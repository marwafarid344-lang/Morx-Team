import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/middleware/auth';
import { supabaseAdmin as supabase } from '@/lib/supabase';
import { ApiResponse } from '@/lib/types';

export async function GET(request: NextRequest) {
  const user = await requireAuth(request);
  if (user instanceof NextResponse) return user;

  try {
    const { searchParams } = new URL(request.url);
    const teamId = searchParams.get('team_id');

    if (!teamId) {
      return NextResponse.json<ApiResponse>({ success: false, error: 'team_id is required' }, { status: 400 });
    }

    // 1. Fetch team, projects, and members
    const { data: teamMembers } = await supabase
      .from('team_members')
      .select('auth_user_id')
      .eq('team_id', teamId);

    const { data: projects } = await supabase
      .from('projects')
      .select('project_id')
      .eq('team_id', teamId);

    const projectIds = projects?.map((p: any) => p.project_id) || [];
    const memberIds = teamMembers?.map((m: any) => m.auth_user_id) || [];

    if (memberIds.length === 0) {
      return NextResponse.json<ApiResponse>({
        success: true,
        data: {
          engagement_score: 100,
          productivity_score: 100,
          burnout_risk: 'low',
          conflict_risk: 'low',
          project_failure_risk: 'low',
          inactive_members: 0,
          workload_imbalance: 0,
          total_comments: 0
        }
      });
    }

    // 2. Fetch tasks for all projects in this team
    let tasks: any[] = [];
    if (projectIds.length > 0) {
      const { data: fetchedTasks } = await supabase
        .from('tasks')
        .select('*')
        .in('project_id', projectIds);
      tasks = fetchedTasks || [];
    }

    // 3. Fetch comments in the last 14 days
    let comments: any[] = [];
    if (projectIds.length > 0) {
      // Get all tasks to find related comments
      const allTaskIds = tasks.map((t: any) => t.task_id);
      if (allTaskIds.length > 0) {
        const { data: fetchedComments } = await supabase
          .from('task_comments')
          .select('comment_id, auth_user_id, created_at')
          .in('task_id', allTaskIds);
        comments = fetchedComments || [];
      }
    }

    // 4. Calculate metrics deterministically
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter((t: any) => t.status === 2).length;
    const activeTasks = tasks.filter((t: any) => t.status !== 2);
    
    // Inactive members
    const activeMemberIdsInComments = new Set(comments.map((c: any) => c.auth_user_id));
    const inactiveMembers = memberIds.filter(id => !activeMemberIdsInComments.has(id));

    // Late tasks (due date passed and status is not done)
    const now = new Date();
    const lateTasks = activeTasks.filter((t: any) => t.due_date && new Date(t.due_date) < now);

    // Fetch assignments to calculate workload distribution
    let assignments: any[] = [];
    if (tasks.length > 0) {
      const { data: fetchedAssignments } = await supabase
        .from('task_assignments')
        .select('*')
        .in('task_id', tasks.map((t: any) => t.task_id));
      assignments = fetchedAssignments || [];
    }

    const memberTaskCounts: Record<string, number> = {};
    memberIds.forEach(id => { memberTaskCounts[id] = 0; });
    assignments.forEach((a: any) => {
      if (memberTaskCounts[a.auth_user_id] !== undefined) {
        memberTaskCounts[a.auth_user_id]++;
      }
    });

    // Workload imbalance calculation (Gini coefficient of tasks distribution)
    let maxTasks = 0;
    let minTasks = Infinity;
    Object.values(memberTaskCounts).forEach((count: number) => {
      if (count > maxTasks) maxTasks = count;
      if (count < minTasks) minTasks = count;
    });

    const workloadImbalance = maxTasks - minTasks > 3 ? Math.min(100, (maxTasks - minTasks) * 15) : 10;

    // Engagement score (based on comments and task creation)
    const commentCount = comments.length;
    const engagementScore = Math.min(100, Math.max(20, 50 + commentCount * 3 + completedTasks * 2 - inactiveMembers.length * 10));

    // Productivity score
    const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 70;
    const productivityScore = Math.min(100, Math.max(30, Math.round(completionRate)));

    // Risk levels
    let burnoutRisk = 'low';
    if (maxTasks > 6 || workloadImbalance > 70) burnoutRisk = 'high';
    else if (maxTasks > 4 || workloadImbalance > 45) burnoutRisk = 'medium';

    let conflictRisk = 'low';
    if (commentCount < 3 && lateTasks.length > 2) conflictRisk = 'high';
    else if (commentCount < 6 && lateTasks.length > 0) conflictRisk = 'medium';

    let projectFailureRisk = 'low';
    const lateTasksRatio = activeTasks.length > 0 ? lateTasks.length / activeTasks.length : 0;
    if (lateTasksRatio > 0.5 || (lateTasks.length > 3 && completionRate < 40)) projectFailureRisk = 'high';
    else if (lateTasksRatio > 0.2 || lateTasks.length > 0) projectFailureRisk = 'medium';

    const healthData = {
      team_id: teamId,
      engagement_score: engagementScore,
      productivity_score: productivityScore,
      burnout_risk: burnoutRisk,
      conflict_risk: conflictRisk,
      project_failure_risk: projectFailureRisk,
      inactive_members: inactiveMembers.length,
      workload_imbalance: workloadImbalance,
      total_comments: commentCount,
      completed_tasks: completedTasks,
      total_tasks: totalTasks,
      late_tasks: lateTasks.length,
      monitored_at: new Date().toISOString()
    };

    // Upsert into team_health
    await supabase.from('team_health').upsert({
      team_id: teamId,
      engagement_score: engagementScore,
      productivity_score: productivityScore,
      burnout_risk: burnoutRisk,
      conflict_risk: conflictRisk,
      project_failure_risk: projectFailureRisk,
      monitored_at: healthData.monitored_at
    });

    return NextResponse.json<ApiResponse>({
      success: true,
      data: healthData
    });

  } catch (error: any) {
    console.error('Team health error:', error);
    return NextResponse.json<ApiResponse>({ success: false, error: error.message || 'Internal server error' }, { status: 500 });
  }
}
