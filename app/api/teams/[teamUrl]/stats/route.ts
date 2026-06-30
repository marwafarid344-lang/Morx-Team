import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/middleware/auth';
import { supabaseAdmin as supabase } from '@/lib/supabase';
import { ApiResponse } from '@/lib/types';

/**
 * Get team statistics and analytics
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { teamUrl: string } }
) {
  const user = await requireAuth(request);
  if (user instanceof NextResponse) return user;

  try {
    const authUserId = user.id;
    const { teamUrl } = params;

    // Get team
    const { data: team } = await supabase
      .from('teams')
      .select('team_id, team_name')
      .eq('team_url', teamUrl)
      .single();

    if (!team) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Team not found' },
        { status: 404 }
      );
    }

    // Verify membership
    const { data: membership } = await supabase
      .from('team_members')
      .select('role')
      .eq('team_id', team.team_id)
      .eq('auth_user_id', authUserId)
      .single();

    if (!membership) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Access denied' },
        { status: 403 }
      );
    }

    const teamId = team.team_id;

    // Get projects for this team
    const { data: projects } = await supabase
      .from('projects')
      .select('project_id, project_name, created_at')
      .eq('team_id', teamId);

    const projectIds = projects?.map((p: any) => p.project_id) || [];

    // Get tasks for these projects
    let tasks: any[] = [];
    if (projectIds.length > 0) {
      const { data: taskData } = await supabase
        .from('tasks')
        .select('task_id, status, priority, project_id')
        .in('project_id', projectIds);
      tasks = taskData || [];
    }

    // Get team members
    const { data: members } = await supabase
      .from('team_members')
      .select('auth_user_id')
      .eq('team_id', teamId);

    const memberIds = members?.map((m: any) => m.auth_user_id) || [];

    // Get user info
    let users: any[] = [];
    if (memberIds.length > 0) {
      const { data: userData } = await supabase
        .from('users')
        .select('auth_user_id, first_name, last_name')
        .in('auth_user_id', memberIds);
      users = userData || [];
    }

    // Get task assignments
    const taskIds = tasks.map((t: any) => t.task_id);
    let assignments: any[] = [];
    if (taskIds.length > 0) {
      const { data: assignData } = await supabase
        .from('task_assignments')
        .select('auth_user_id, task_id')
        .in('task_id', taskIds);
      assignments = assignData || [];
    }

    // Calculate overall stats
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter((t: any) => t.status === 2).length;
    const todoTasks = tasks.filter((t: any) => t.status === 0).length;
    const inProgressTasks = tasks.filter((t: any) => t.status === 1).length;

    const overallStats = {
      total_projects: projects?.length || 0,
      total_tasks: totalTasks,
      completed_tasks: completedTasks,
      todo_tasks: todoTasks,
      in_progress_tasks: inProgressTasks,
      total_members: members?.length || 0,
      completion_rate: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0
    };

    // User stats
    const userStats = users.map((user: any) => {
      const userAssignments = assignments.filter((a: any) => a.auth_user_id === user.auth_user_id);
      const userTaskIds = userAssignments.map((a: any) => a.task_id);
      const userTasks = tasks.filter((t: any) => userTaskIds.includes(t.task_id));
      const completed = userTasks.filter((t: any) => t.status === 2).length;

      return {
        auth_user_id: user.auth_user_id,
        first_name: user.first_name,
        last_name: user.last_name,
        assigned_tasks: userTasks.length,
        completed_tasks: completed
      };
    }).sort((a, b) => b.assigned_tasks - a.assigned_tasks);

    // Project stats
    const projectStats = projects?.map((project: any) => {
      const projectTasks = tasks.filter((t: any) => t.project_id === project.project_id);
      return {
        project_id: project.project_id,
        project_name: project.project_name,
        total_tasks: projectTasks.length,
        completed_tasks: projectTasks.filter((t: any) => t.status === 2).length,
        in_progress_tasks: projectTasks.filter((t: any) => t.status === 1).length
      };
    }) || [];

    // Status distribution
    const statusDistribution = {
      todo: todoTasks,
      in_progress: inProgressTasks,
      done: completedTasks
    };

    // Priority distribution
    const priorityDistribution = {
      high: tasks.filter((t: any) => t.priority >= 4).length,
      medium: tasks.filter((t: any) => t.priority === 3).length,
      low: tasks.filter((t: any) => t.priority <= 2).length
    };

    return NextResponse.json<ApiResponse>({
      success: true,
      data: {
        overall: overallStats,
        by_user: userStats,
        by_project: projectStats,
        status_distribution: statusDistribution,
        priority_distribution: priorityDistribution,
      },
    });
  } catch (error) {
    console.error('Get team stats error:', error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
