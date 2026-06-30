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
    const { action, team_id, project_id, task_id, data } = body;
    const userId = user.id;

    if (!action) {
      return NextResponse.json<ApiResponse>({ success: false, error: 'action parameter is required' }, { status: 400 });
    }

    // Standard actions mapping
    switch (action) {
      case 'split-task': {
        const { taskTitle, taskDesc, count = 3 } = data || {};
        if (!taskTitle) {
          return NextResponse.json<ApiResponse>({ success: false, error: 'taskTitle is required' }, { status: 400 });
        }
        
        const prompt = `You are Marlin, an AI team member. Break down the task titled "${taskTitle}" (${taskDesc || 'No description'}) into up to ${count} smaller sub-tasks.
For each sub-task, provide:
1. A concise, clear title.
2. A short description.
3. An estimated duration (e.g. "2 days").
4. Priority level (1 = High, 2 = Medium, 3 = Low).
Return the result strictly as a JSON array of objects with keys: "title", "description", "priority", "estimated_days". Do not include markdown code block formatting or backticks around the JSON.`;

        const response = await generateAI({ userId, prompt });
        if (!response.success) {
          return NextResponse.json<ApiResponse>({ success: false, error: response.error, limitReached: response.limitReached }, { status: 500 });
        }

        // Clean JSON response (remove any markdown formatting)
        let jsonText = response.data || '[]';
        jsonText = jsonText.replace(/```json/g, '').replace(/```/g, '').trim();
        const subTasks = JSON.parse(jsonText);

        return NextResponse.json<ApiResponse>({ success: true, data: subTasks });
      }

      case 'generate-milestones': {
        const { projectName, projectDesc } = data || {};
        if (!projectName) {
          return NextResponse.json<ApiResponse>({ success: false, error: 'projectName is required' }, { status: 400 });
        }

        const prompt = `You are Marlin, an AI team member. Generate 4 critical milestones for a project named "${projectName}" described as: ${projectDesc || 'No description'}.
For each milestone, provide:
1. Title
2. Goals/Deliverables
3. Recommended relative deadline (e.g. "Week 2")
Return the response strictly as a JSON array of objects with keys: "title", "goals", "relative_deadline". Do not wrap the JSON in markdown code blocks.`;

        const response = await generateAI({ userId, prompt });
        if (!response.success) {
          return NextResponse.json<ApiResponse>({ success: false, error: response.error, limitReached: response.limitReached }, { status: 500 });
        }

        let jsonText = response.data || '[]';
        jsonText = jsonText.replace(/```json/g, '').replace(/```/g, '').trim();
        const milestones = JSON.parse(jsonText);

        return NextResponse.json<ApiResponse>({ success: true, data: milestones });
      }

      case 'detect-blockers': {
        if (!project_id) {
          return NextResponse.json<ApiResponse>({ success: false, error: 'project_id is required' }, { status: 400 });
        }

        // Fetch tasks and comments to analyze for blockers
        const { data: tasks } = await supabase.from('tasks').select('*').eq('project_id', project_id);
        const taskIds = tasks?.map((t: any) => t.task_id) || [];

        let commentsText = '';
        if (taskIds.length > 0) {
          const { data: comments } = await supabase
            .from('task_comments')
            .select('comment_text, auth_user_id')
            .in('task_id', taskIds)
            .order('created_at', { ascending: false })
            .limit(20);

          commentsText = comments?.map((c: any) => decodeContent(c.comment_text)).join('\n') || '';
        }

        const tasksText = tasks?.map((t: any) => `Task: ${decodeContent(t.title)} | Status: ${t.status === 2 ? 'Done' : t.status === 1 ? 'In Progress' : 'Todo'}`).join('\n') || 'No tasks';

        const prompt = `You are Marlin, an AI team member. Analyze the following project tasks and discussion comments to identify any potential blockers, inactive assignments, or delayed items:
Tasks:
${tasksText}

Discussion/Comments:
${commentsText}

List any blockers or warnings. Suggest solutions.
Return a JSON object with keys: "blockers" (array of strings outlining blockers), "at_risk_tasks" (array of strings listing tasks at risk), "recommendations" (array of strings with recommended fixes). Do not include markdown code block formatting.`;

        const response = await generateAI({ userId, prompt });
        if (!response.success) {
          return NextResponse.json<ApiResponse>({ success: false, error: response.error, limitReached: response.limitReached }, { status: 500 });
        }

        let jsonText = response.data || '{}';
        jsonText = jsonText.replace(/```json/g, '').replace(/```/g, '').trim();
        const analysis = JSON.parse(jsonText);

        return NextResponse.json<ApiResponse>({ success: true, data: analysis });
      }

      case 'recommend-next-actions': {
        if (!project_id) {
          return NextResponse.json<ApiResponse>({ success: false, error: 'project_id is required' }, { status: 400 });
        }

        // Get uncompleted tasks
        const { data: tasks } = await supabase
          .from('tasks')
          .select('task_id, title, priority, due_date')
          .eq('project_id', project_id)
          .neq('status', 2)
          .limit(10);

        const tasksList = tasks?.map((t: any) => `- ${decodeContent(t.title)} (Priority: ${t.priority}, Due: ${t.due_date || 'N/A'})`).join('\n') || 'None';

        const prompt = `You are Marlin, an AI team member. Based on these active uncompleted tasks:
${tasksList}

Recommend the top 3 next actions for the team to keep the project on track.
Return a JSON array of strings, e.g. ["Action 1", "Action 2", "Action 3"]. Do not include markdown formatting.`;

        const response = await generateAI({ userId, prompt });
        if (!response.success) {
          return NextResponse.json<ApiResponse>({ success: false, error: response.error, limitReached: response.limitReached }, { status: 500 });
        }

        let jsonText = response.data || '[]';
        jsonText = jsonText.replace(/```json/g, '').replace(/```/g, '').trim();
        const actions = JSON.parse(jsonText);

        return NextResponse.json<ApiResponse>({ success: true, data: actions });
      }

      case 'summarize-meeting': {
        const { notes } = data || {};
        if (!notes) {
          return NextResponse.json<ApiResponse>({ success: false, error: 'notes is required' }, { status: 400 });
        }

        const prompt = `You are Marlin, an AI team member. Summarize the following meeting notes. Identify key decisions made and action items.
Meeting Notes:
${notes}

Return the response strictly as a JSON object with keys: "summary" (string), "key_decisions" (array of strings), "action_items" (array of objects with keys "item" and "assignee"). Do not include markdown formatting.`;

        const response = await generateAI({ userId, prompt });
        if (!response.success) {
          return NextResponse.json<ApiResponse>({ success: false, error: response.error, limitReached: response.limitReached }, { status: 500 });
        }

        let jsonText = response.data || '{}';
        jsonText = jsonText.replace(/```json/g, '').replace(/```/g, '').trim();
        const summary = JSON.parse(jsonText);

        return NextResponse.json<ApiResponse>({ success: true, data: summary });
      }

      default:
        return NextResponse.json<ApiResponse>({ success: false, error: `Unsupported action: ${action}` }, { status: 400 });
    }
  } catch (error: any) {
    console.error('Agent AI error:', error);
    return NextResponse.json<ApiResponse>({ success: false, error: error.message || 'Internal server error' }, { status: 500 });
  }
}
