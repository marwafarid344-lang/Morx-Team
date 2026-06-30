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
}

/**
 * Standard AI Generation wrapper with automatic caching, rate limiting, and fallback.
 */
export async function generateAI({
  userId,
  prompt,
  maxTokens = 800,
  temperature = 0.7,
  skipCache = false
}: GenerateOptions): Promise<{ success: boolean; data?: string; error?: string; limitReached?: boolean }> {
  const cacheKey = getCacheKey(prompt);

  // 1. Check cache first (Free!)
  if (!skipCache) {
    const cached = await getCachedResponse(cacheKey);
    if (cached) {
      console.log(`[AI Utility] Cache HIT for key ${cacheKey}`);
      return { success: true, data: cached };
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
