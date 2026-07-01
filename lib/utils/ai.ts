import { createHash } from 'crypto';
import { supabase } from '@/lib/supabase';
import { checkAndIncrementAiUsage } from './aiUsage';

// Helper to hash prompt for caching
export function getCacheKey(prompt: string): string {
  return createHash('sha256').update(prompt).digest('hex');
}

// Caching helper
async function getCachedResponse(key: string): Promise<string | null> {
  try {
    const { data, error } = await supabase
      .from('ai_cache')
      .select('response_text')
      .eq('cache_key', key)
      .single();

    if (error || !data) return null;
    return data.response_text;
  } catch {
    return null;
  }
}

async function saveResponseToCache(key: string, text: string): Promise<void> {
  try {
    await supabase.from('ai_cache').upsert({
      cache_key: key,
      response_text: text,
      created_at: new Date().toISOString()
    });
  } catch (err) {
    console.error('Error caching AI response:', err);
  }
}

interface GenerateOptions {
  userId: string;
  prompt: string;
  maxTokens?: number;
  temperature?: number;
  skipCache?: boolean;
  jsonMode?: boolean;
}

/**
 * Repairs a truncated JSON string by closing unclosed double quotes, brackets, and curly braces.
 */
export function repairTruncatedJSON(json: string): string {
  let cleaned = json.trim();
  
  // If it's already valid JSON, don't touch it
  try {
    JSON.parse(cleaned);
    return cleaned;
  } catch (e) {}

  let inString = false;
  let escape = false;
  const stack: ('{' | '[')[] = [];

  for (let i = 0; i < cleaned.length; i++) {
    const char = cleaned[i];
    if (escape) {
      escape = false;
      continue;
    }
    if (char === '\\') {
      escape = true;
      continue;
    }
    if (char === '"') {
      inString = !inString;
      continue;
    }
    if (!inString) {
      if (char === '{' || char === '[') {
        stack.push(char);
      } else if (char === '}') {
        if (stack[stack.length - 1] === '{') stack.pop();
      } else if (char === ']') {
        if (stack[stack.length - 1] === '[') stack.pop();
      }
    }
  }

  // If we ended inside a string, close it
  if (inString) {
    cleaned += '"';
  }

  // Remove trailing commas, colons or unclosed property patterns
  let prevCleaned = '';
  while (cleaned !== prevCleaned) {
    prevCleaned = cleaned;
    cleaned = cleaned.trim();
    if (cleaned.endsWith(',') || cleaned.endsWith(':')) {
      cleaned = cleaned.slice(0, -1);
    }
  }

  // Clean trailing commas after trimming
  cleaned = cleaned.trim().replace(/,\s*$/, '');

  // Close remaining items in the stack
  while (stack.length > 0) {
    const last = stack.pop();
    if (last === '{') {
      cleaned += '}';
    } else if (last === '[') {
      cleaned += ']';
    }
  }

  return cleaned;
}

/**
 * Robustly extracts and parses JSON from AI response text.
 * Handles leading/trailing markdown blocks, conversational text, and whitespace.
 * Attempts to repair truncated JSON response blocks.
 */
export function extractAndParseJSON<T>(text: string): T {
  const trimmed = text.trim();
  
  // Try parsing directly first
  try {
    return JSON.parse(trimmed) as T;
  } catch (e) {
    // Continue cleanup
  }

  // Remove markdown code blocks if any
  let cleaned = trimmed
    .replace(/```json/gi, '')
    .replace(/```/g, '')
    .trim();

  try {
    return JSON.parse(cleaned) as T;
  } catch (e) {
    // Continue cleanup
  }

  // Find the boundaries of the JSON object or array
  const firstCurly = cleaned.indexOf('{');
  const lastCurly = cleaned.lastIndexOf('}');
  const firstBracket = cleaned.indexOf('[');
  const lastBracket = cleaned.lastIndexOf(']');

  let startIndex = -1;
  let endIndex = -1;

  if (firstCurly !== -1 && (firstBracket === -1 || firstCurly < firstBracket)) {
    // Object matches
    startIndex = firstCurly;
    endIndex = lastCurly;
  } else if (firstBracket !== -1) {
    // Array matches
    startIndex = firstBracket;
    endIndex = lastBracket;
  }

  // If last brace is missing (e.g. truncated), try to repair from the start index to the end of string
  if (startIndex !== -1 && (endIndex === -1 || endIndex < startIndex)) {
    endIndex = cleaned.length - 1;
  }

  if (startIndex !== -1 && endIndex !== -1 && endIndex >= startIndex) {
    const candidate = cleaned.slice(startIndex, endIndex + 1);
    try {
      const repaired = repairTruncatedJSON(candidate);
      return JSON.parse(repaired) as T;
    } catch (parseErr: any) {
      console.error('Failed to parse and repair JSON candidate:', parseErr);
      throw new Error(`JSON parsing failed: ${parseErr.message}. Content was: ${candidate.substring(0, 200)}...`);
    }
  }

  throw new Error(`Could not find valid JSON object or array in AI response. Content was: ${trimmed.substring(0, 200)}...`);
}

/**
 * Standard AI Generation wrapper with automatic caching, rate limiting, and fallback.
 */
export async function generateAI({
  userId,
  prompt,
  maxTokens = 2000,
  temperature = 0.7,
  skipCache = false,
  jsonMode = false
}: GenerateOptions): Promise<{ success: boolean; data?: string; error?: string; limitReached?: boolean }> {
  const cacheKey = getCacheKey(prompt);

  // 1. Check cache first (Free!)
  if (!skipCache) {
    const cached = await getCachedResponse(cacheKey);
    if (cached) {
      if (jsonMode) {
        try {
          extractAndParseJSON(cached);
          console.log(`[AI Utility] Cache HIT for key ${cacheKey}`);
          return { success: true, data: cached };
        } catch (e) {
          console.warn(`[AI Utility] Cache hit but invalid JSON, skipping cache for key ${cacheKey}`);
        }
      } else {
        console.log(`[AI Utility] Cache HIT for key ${cacheKey}`);
        return { success: true, data: cached };
      }
    }
  }

  // 2. Rate limit check (Increments usage if allowed)
  const rateLimit = await checkAndIncrementAiUsage(userId);
  if (!rateLimit.allowed) {
    return {
      success: false,
      error: rateLimit.error,
      limitReached: true
    };
  }

  const openRouterKey = process.env.OPENROUTER_API_KEY;
  const geminiKey = process.env.GEMINI_API_KEY;

  if (!openRouterKey && !geminiKey) {
    return { success: false, error: 'No AI API key configured in env' };
  }

  let generatedText: string | null = null;

  // Try OpenRouter first if configured
  if (openRouterKey) {
    try {
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${openRouterKey}`,
        },
        body: JSON.stringify({
          model: 'openrouter/auto',
          messages: [{ role: 'user', content: prompt }],
          max_tokens: maxTokens,
          temperature: temperature,
          response_format: jsonMode ? { type: 'json_object' } : undefined,
        })
      });

      if (response.ok) {
        const data = await response.json();
        generatedText = data.choices?.[0]?.message?.content?.trim();
      } else {
        console.error('OpenRouter error:', await response.text());
      }
    } catch (error) {
      console.error('OpenRouter request failed:', error);
    }
  }

  // Fallback to Gemini 2.0 Flash (Fast & Low Cost)
  if (!generatedText && geminiKey) {
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [{
              parts: [{ text: prompt }]
            }],
            generationConfig: {
              temperature: temperature,
              maxOutputTokens: maxTokens,
              responseMimeType: jsonMode ? 'application/json' : undefined,
            }
          })
        }
      );

      if (response.ok) {
        const data = await response.json();
        generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
      } else {
        console.error('Gemini error:', await response.text());
      }
    } catch (error) {
      console.error('Gemini request failed:', error);
    }
  }

  if (generatedText) {
    // Save to cache
    if (!skipCache) {
      await saveResponseToCache(cacheKey, generatedText);
    }
    return { success: true, data: generatedText };
  }

  return { success: false, error: 'All configured LLM providers failed' };
}
