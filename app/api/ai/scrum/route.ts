import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/middleware/auth';
import { supabaseAdmin as supabase } from '@/lib/supabase';
import { ApiResponse } from '@/lib/types';
import { generateAI } from '@/lib/utils/ai';
import { decodeContent } from '@/lib/utils/contentEncoding';

export async function POST(request: NextRequest) {
  const user = await requireAuth(request);
  if (user instanceof NextResponse) return user;

  try {
    const body = await request.json();
    const { action, project_id, team_id, data } = body;
    const userId = user.id;

    if (!action || !project_id) {
      return NextResponse.json<ApiResponse>({ success: false, error: 'action and project_id are required' }, { status: 400 });
    }

    // Fetch project tasks for context
    const { data: tasks } = await supabase
      .from('tasks')
      .select('*')
      .eq('project_id', project_id);

    const taskList = tasks?.map((t: any) => `- [${t.status === 2 ? 'Completed' : t.status === 1 ? 'In Progress' : 'Todo'}] ${decodeContent(t.title)} | Priority: ${t.priority} | Due: ${t.due_date || 'None'}`).join('\n') || 'No tasks';

    switch (action) {
      case 'weekly-plan': {
        const prompt = `You are Marlin, the AI Scrum Master. Generate a weekly plan for this project based on the active tasks:
${taskList}

Organize the plan into:
1. High Priority Focus
2. Mid Priority Items
3. Recommended Member Assignments
Return a JSON object with keys: "focus" (string), "priorities" (array of strings), "assignments" (array of strings). Do not include markdown code block formatting.`;

        const response = await generateAI({ userId, prompt });
        if (!response.success) throw new Error(response.error);

        let jsonText = response.data || '{}';
        jsonText = jsonText.replace(/```json/g, '').replace(/```/g, '').trim();
        const plan = JSON.parse(jsonText);
        return NextResponse.json<ApiResponse>({ success: true, data: plan });
      }

      case 'review-sprint': {
        const prompt = `You are Marlin, the AI Scrum Master. Review the sprint status for the following tasks:
${taskList}

Compare completed tasks vs planned. Outline achievements, carryover tasks, and general team velocity.
Return a JSON object with keys: "completed_count" (number), "total_count" (number), "achievements" (array of strings), "carryover" (array of strings), "summary" (string). Do not include markdown.`;

        const response = await generateAI({ userId, prompt });
        if (!response.success) throw new Error(response.error);

        let jsonText = response.data || '{}';
        jsonText = jsonText.replace(/```json/g, '').replace(/```/g, '').trim();
        const review = JSON.parse(jsonText);
        return NextResponse.json<ApiResponse>({ success: true, data: review });
      }

      case 'standup-summary': {
        // Fetch recent comments for standup context
        const taskIds = tasks?.map((t: any) => t.task_id) || [];
        let commentsText = '';
        if (taskIds.length > 0) {
          const { data: comments } = await supabase
            .from('task_comments')
            .select('comment_text, created_at')
            .in('task_id', taskIds)
            .limit(10);
          commentsText = comments?.map((c: any) => decodeContent(c.comment_text)).join('\n') || '';
        }

        const prompt = `You are Marlin, the AI Scrum Master. Synthesize a Daily Standup Summary for the team based on tasks and comments:
Tasks:
${taskList}

Recent Comments/Updates:
${commentsText}

Outline:
1. What was accomplished yesterday
2. What is the focus for today
3. Active blockers/concerns
Return a JSON object with keys: "yesterday" (array of strings), "today" (array of strings), "blockers" (array of strings). Do not include markdown formatting.`;

        const response = await generateAI({ userId, prompt });
        if (!response.success) throw new Error(response.error);

        let jsonText = response.data || '{}';
        jsonText = jsonText.replace(/```json/g, '').replace(/```/g, '').trim();
        const standup = JSON.parse(jsonText);
        return NextResponse.json<ApiResponse>({ success: true, data: standup });
      }

      case 'release-notes': {
        const completedTasksText = tasks?.filter((t: any) => t.status === 2).map((t: any) => `- ${decodeContent(t.title)}`).join('\n') || 'None';
        const prompt = `You are Marlin, the AI Scrum Master. Write release notes for the completed sprint items:
${completedTasksText}

Return a JSON object with keys: "version" (string, e.g. "v1.1.0"), "title" (string), "features" (array of strings), "improvements" (array of strings). Do not include markdown.`;

        const response = await generateAI({ userId, prompt });
        if (!response.success) throw new Error(response.error);

        let jsonText = response.data || '{}';
        jsonText = jsonText.replace(/```json/g, '').replace(/```/g, '').trim();
        const notes = JSON.parse(jsonText);
        return NextResponse.json<ApiResponse>({ success: true, data: notes });
      }

      default:
        return NextResponse.json<ApiResponse>({ success: false, error: 'Unsupported scrum action' }, { status: 400 });
    }

  } catch (error: any) {
    console.error('Scrum route error:', error);
    return NextResponse.json<ApiResponse>({ success: false, error: error.message || 'Internal server error' }, { status: 500 });
  }
}
