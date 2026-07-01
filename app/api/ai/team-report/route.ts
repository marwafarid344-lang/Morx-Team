import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/middleware/auth';
import { supabaseAdmin as supabase } from '@/lib/supabase';
import { ApiResponse } from '@/lib/types';
import { generateAI } from '@/lib/utils/ai';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const user = await requireAuth(request);
  if (user instanceof NextResponse) return user;

  try {
    const body = await request.json();
    const { team_id } = body;
    const userId = user.id;

    if (!team_id) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'team_id is required' },
        { status: 400 }
      );
    }

    // 1. Fetch team info
    const { data: team } = await supabase
      .from('teams')
      .select('team_name')
      .eq('team_id', team_id)
      .single();

    if (!team) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Team not found' },
        { status: 404 }
      );
    }

    // 2. Fetch projects
    const { data: projects } = await supabase
      .from('projects')
      .select('project_id, project_name')
      .eq('team_id', team_id);

    const projectIds = projects?.map((p: any) => p.project_id) || [];

    // 3. Fetch tasks
    let tasks: any[] = [];
    if (projectIds.length > 0) {
      const { data: taskData } = await supabase
        .from('tasks')
        .select('task_id, status, priority, project_id')
        .in('project_id', projectIds);
      tasks = taskData || [];
    }

    // 4. Fetch members
    const { data: members } = await supabase
      .from('team_members')
      .select('auth_user_id')
      .eq('team_id', team_id);

    const memberIds = members?.map((m: any) => m.auth_user_id) || [];

    // 5. Fetch user details
    let users: any[] = [];
    if (memberIds.length > 0) {
      const { data: userData } = await supabase
        .from('users')
        .select('auth_user_id, first_name, last_name')
        .in('auth_user_id', memberIds);
      users = userData || [];
    }

    // 6. Fetch task assignments
    const taskIds = tasks.map((t: any) => t.task_id);
    let assignments: any[] = [];
    if (taskIds.length > 0) {
      const { data: assignData } = await supabase
        .from('task_assignments')
        .select('auth_user_id, task_id')
        .in('task_id', taskIds);
      assignments = assignData || [];
    }

    // Calculate metrics
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter((t: any) => t.status === 2).length;
    const todoTasks = tasks.filter((t: any) => t.status === 0).length;
    const inProgressTasks = tasks.filter((t: any) => t.status === 1).length;

    // Fetch team health record
    const { data: health } = await supabase
      .from('team_health')
      .select('*')
      .eq('team_id', team_id)
      .order('monitored_at', { ascending: false })
      .limit(1)
      .single();

    const overallStats = {
      total_projects: projects?.length || 0,
      total_tasks: totalTasks,
      completed_tasks: completedTasks,
      todo_tasks: todoTasks,
      in_progress_tasks: inProgressTasks,
      total_members: members?.length || 0,
      completion_rate: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0
    };

    const userStats = users.map((u: any) => {
      const userAssignments = assignments.filter((a: any) => a.auth_user_id === u.auth_user_id);
      const userTaskIds = userAssignments.map((a: any) => a.task_id);
      const userTasks = tasks.filter((t: any) => userTaskIds.includes(t.task_id));
      const completed = userTasks.filter((t: any) => t.status === 2).length;

      return {
        first_name: u.first_name,
        last_name: u.last_name,
        assigned_tasks: userTasks.length,
        completed_tasks: completed
      };
    });

    const projectStats = projects?.map((p: any) => {
      const projectTasks = tasks.filter((t: any) => t.project_id === p.project_id);
      return {
        project_name: p.project_name,
        total_tasks: projectTasks.length,
        completed_tasks: projectTasks.filter((t: any) => t.status === 2).length,
        in_progress_tasks: projectTasks.filter((t: any) => t.status === 1).length
      };
    }) || [];

    const prompt = `You are Marlin, the AI Team Operating System Advisor. Analyze the following diagnostics and contributions for the student team "${team.team_name}":

Overall Metrics:
- Total Projects: ${overallStats.total_projects}
- Total Tasks: ${overallStats.total_tasks}
- Completed Tasks: ${overallStats.completed_tasks} (${overallStats.completion_rate}% completion rate)
- Tasks Todo: ${overallStats.todo_tasks}
- Tasks In Progress: ${overallStats.in_progress_tasks}
- Inactive Members (no comments in last 14 days): ${health?.inactive_members || 0}
- Workload Imbalance score: ${health?.workload_imbalance || 0}%
- Burnout Risk level: ${health?.burnout_risk || 'low'}
- Conflict Risk level: ${health?.conflict_risk || 'low'}
- Project Failure Risk level: ${health?.project_failure_risk || 'low'}

Members Contributions:
${userStats.map(u => `- ${u.first_name} ${u.last_name}: Assigned ${u.assigned_tasks} tasks, Completed ${u.completed_tasks} tasks.`).join('\n')}

Projects Status:
${projectStats.map(p => `- Project "${p.project_name}": ${p.completed_tasks}/${p.total_tasks} tasks completed, ${p.in_progress_tasks} in progress.`).join('\n')}

Provide a comprehensive, encouraging, and highly professional advisor report for the team leader. Group your report into these sections:
1. 🩺 Overall Health & Diagnostics (Analysis of Burnout, Conflict, and Project Failure Risks)
2. 👥 Workload Balance & Individual Contributions (Who is doing what, who needs support, who is excelling)
3. 🚀 Project Progress Analysis (Which projects are healthy and which are lagging)
4. 💡 3 Actionable Recommendations (Clear, concrete recommendations to optimize velocity, reduce stress, and improve collaboration)

Respond in clear Markdown. Output only the report text.`;

    const aiRes = await generateAI({ userId, prompt, maxTokens: 2500, skipCache: true });
    if (!aiRes.success) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: aiRes.error || 'Failed to generate AI report' },
        { status: 500 }
      );
    }

    return NextResponse.json<ApiResponse>({
      success: true,
      data: aiRes.data
    });

  } catch (error: any) {
    console.error('AI team-report error:', error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
