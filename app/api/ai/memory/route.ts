import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/middleware/auth';
import { supabaseAdmin as supabase } from '@/lib/supabase';
import { ApiResponse } from '@/lib/types';
import { generateAI } from '@/lib/utils/ai';

// Mock embedding generator to keep it extremely cost-effective and zero-dependency if API keys are missing.
// If OpenAI or Gemini keys are active, this can call their embedding routes.
async function getEmbedding(text: string): Promise<number[]> {
  const openRouterKey = process.env.OPENROUTER_API_KEY;
  const geminiKey = process.env.GEMINI_API_KEY;

  if (geminiKey) {
    try {
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent?key=${geminiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: "models/text-embedding-004",
          content: { parts: [{ text }] }
        })
      });
      if (res.ok) {
        const json = await res.json();
        return json.embedding.values;
      }
    } catch (e) {
      console.error('Gemini embedding failed, falling back to mock:', e);
    }
  }

  // Fallback / Mock 1536-dimension vector for pgvector compat
  const mockVector = new Array(1536).fill(0).map((_, i) => Math.sin(i + text.length));
  return mockVector;
}

export async function GET(request: NextRequest) {
  const user = await requireAuth(request);
  if (user instanceof NextResponse) return user;

  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');
    const userId = user.id;

    if (!query) {
      // Return recent memories
      const { data } = await supabase
        .from('ai_memories')
        .select('content, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(5);

      return NextResponse.json<ApiResponse>({ success: true, data: data || [] });
    }

    const vector = await getEmbedding(query);

    // Call pgvector cosine distance search
    // Using Supabase rpc to execute raw SQL or pre-defined search function
    // For safety, we can fallback to standard keyword matching if pgvector throws an error
    try {
      const { data: matchedMemories, error: vectorError } = await supabase
        .rpc('match_memories', {
          query_embedding: vector,
          match_threshold: 0.5,
          match_count: 5,
          user_uuid: userId
        });

      if (vectorError) throw vectorError;
      return NextResponse.json<ApiResponse>({ success: true, data: matchedMemories });
    } catch (rpcErr) {
      // Fallback: simple keyword search in memories
      console.warn('pgvector search failed, falling back to text search:', rpcErr);
      const { data: textMatched } = await supabase
        .from('ai_memories')
        .select('content, created_at')
        .eq('user_id', userId)
        .like('content', `%${query}%`)
        .limit(5);

      return NextResponse.json<ApiResponse>({ success: true, data: textMatched || [] });
    }

  } catch (error: any) {
    console.error('Memory retrieval error:', error);
    return NextResponse.json<ApiResponse>({ success: false, error: error.message || 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const user = await requireAuth(request);
  if (user instanceof NextResponse) return user;

  try {
    const body = await request.json();
    const { content, team_id, project_id } = body;
    const userId = user.id;

    if (!content) {
      return NextResponse.json<ApiResponse>({ success: false, error: 'content is required' }, { status: 400 });
    }

    const embedding = await getEmbedding(content);

    const { data: newMemory, error: memError } = await supabase
      .from('ai_memories')
      .insert({
        user_id: userId,
        team_id: team_id || null,
        project_id: project_id || null,
        content,
        embedding
      })
      .select('memory_id, content')
      .single();

    if (memError) throw memError;

    return NextResponse.json<ApiResponse>({
      success: true,
      message: 'Long-term memory saved successfully!',
      data: newMemory
    });

  } catch (error: any) {
    console.error('Save memory error:', error);
    return NextResponse.json<ApiResponse>({ success: false, error: error.message || 'Internal server error' }, { status: 500 });
  }
}
