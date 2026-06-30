import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/middleware/auth';
import { supabaseAdmin as supabase } from '@/lib/supabase';
import { ApiResponse } from '@/lib/types';
import { generateAI } from '@/lib/utils/ai';
import { encodeContent, decodeContent } from '@/lib/utils/contentEncoding';

export async function POST(request: NextRequest) {
  const user = await requireAuth(request);
  if (user instanceof NextResponse) return user;

  try {
    const body = await request.json();
    const { query, project_id } = body;
    const userId = user.id;

    if (!query) {
      return NextResponse.json<ApiResponse>({ success: false, error: 'query is required' }, { status: 400 });
    }

    const text = query.toLowerCase();

    // 1. ACTION EXECUTION: Create task intent
    if (text.includes('create task') || text.includes('add task')) {
      if (!project_id) {
        return NextResponse.json<ApiResponse>({
          success: true,
          data: {
            text: "I can create tasks, but please open a project workspace first so I know where to add it."
          }
        });
      }

      // Try to parse task title using regex or simple search
      let taskTitle = query.replace(/create task|add task/gi, '').trim();
      if (!taskTitle) taskTitle = "New Task via Voice";

      const { data: newTask, error: taskErr } = await supabase
        .from('tasks')
        .insert({
          title: encodeContent(taskTitle),
          description: encodeContent('Generated via voice assistant command.'),
          status: 0,
          priority: 2,
          project_id,
          auth_user_id: userId
        })
        .select()
        .single();

      if (taskErr) throw taskErr;

      return NextResponse.json<ApiResponse>({
        success: true,
        data: {
          text: `Task "${taskTitle}" has been created successfully in your backlog.`,
          action: 'task_created',
          task: newTask
        }
      });
    }

    // 2. WORKSPACE SEARCH: Search project/tasks
    if (text.includes('search') || text.includes('find task')) {
      if (!project_id) {
        return NextResponse.json<ApiResponse>({
          success: true,
          data: { text: "Please select a project to search." }
        });
      }

      const searchTerms = query.replace(/search|find task/gi, '').trim();
      const { data: tasks } = await supabase
        .from('tasks')
        .select('title, status')
        .eq('project_id', project_id);

      const matched = tasks?.filter((t: any) => decodeContent(t.title).toLowerCase().includes(searchTerms.toLowerCase())) || [];

      if (matched.length > 0) {
        const list = matched.map((t: any) => `- ${decodeContent(t.title)} (${t.status === 2 ? 'Done' : t.status === 1 ? 'In Progress' : 'Todo'})`).join('\n');
        return NextResponse.json<ApiResponse>({
          success: true,
          data: { text: `I found these tasks matching "${searchTerms}":\n${list}` }
        });
      } else {
        return NextResponse.json<ApiResponse>({
          success: true,
          data: { text: `I couldn't find any tasks matching "${searchTerms}" in this project.` }
        });
      }
    }

    // 3. SEMANTIC MEMORY RETRIEVAL (Phase 10)
    // We fetch recent semantic memories matching the query to append to the system prompt
    let memoryContext = "";
    try {
      const memoryRes = await fetch(`${request.nextUrl.origin}/api/ai/memory?q=${encodeURIComponent(query)}`, {
        headers: { Cookie: request.headers.get('cookie') || '' }
      });
      const memories = await memoryRes.json();
      if (memories.success && memories.data && memories.data.length > 0) {
        memoryContext = `Relevant memories of past discussions:\n` + memories.data.map((m: any) => `- ${m.content}`).join('\n') + `\n\n`;
      }
    } catch (e) {
      console.warn('Could not load memory context for voice assistant:', e);
    }

    // 4. GENERATIVE CONVERSATION
    const systemPrompt = `You are Marlin, a voice-enabled AI assistant for students. Keep your response extremely brief, natural, and conversational (max 2 sentences) because it will be spoken back to the user.
${memoryContext}
User Query: "${query}"
Marlin:`;

    const aiResponse = await generateAI({ userId, prompt: systemPrompt, maxTokens: 100 });
    if (!aiResponse.success) throw new Error(aiResponse.error);

    const replyText = aiResponse.data || "I'm here to help you manage your tasks.";

    // Save this interaction to long-term memory asynchronously
    try {
      await fetch(`${request.nextUrl.origin}/api/ai/memory`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Cookie: request.headers.get('cookie') || ''
        },
        body: JSON.stringify({
          content: `User asked: "${query}" | Marlin answered: "${replyText}"`,
          project_id
        })
      });
    } catch (e) {
      console.warn('Failed to save voice interaction memory:', e);
    }

    return NextResponse.json<ApiResponse>({
      success: true,
      data: {
        text: replyText
      }
    });

  } catch (error: any) {
    console.error('Voice assistant error:', error);
    return NextResponse.json<ApiResponse>({ success: false, error: error.message || 'Internal server error' }, { status: 500 });
  }
}
