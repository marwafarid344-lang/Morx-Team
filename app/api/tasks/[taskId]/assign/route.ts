import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/middleware/auth';
import { supabaseAdmin as supabase } from '@/lib/supabase';
import { ApiResponse } from '@/lib/types';

/**
 * Assign a user to a task
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { taskId: string } }
) {
  const user = await requireAuth(request);
  if (user instanceof NextResponse) return user;

  try {
    const taskId = params.taskId;
    const { user_to_assign_id } = await request.json();
    const requesterId = user.id;

    if (!user_to_assign_id) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'user_to_assign_id is required' },
        { status: 400 }
      );
    }

    // Get task to check project/team access
    const { data: task } = await supabase
      .from('tasks')
      .select('project_id')
      .eq('task_id', taskId)
      .single();

    if (!task) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Task not found' },
        { status: 404 }
      );
    }

    // Get project team
    const { data: project } = await supabase
      .from('projects')
      .select('team_id')
      .eq('project_id', task.project_id)
      .single();

    if (!project) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Project not found' },
        { status: 404 }
      );
    }

    // Check if requester has permission (team owner/admin)
    const { data: requesterMembership } = await supabase
      .from('team_members')
      .select('role')
      .eq('team_id', project.team_id)
      .eq('auth_user_id', requesterId)
      .single();

    const isAuthorized = requesterMembership && (requesterMembership.role === 'owner' || requesterMembership.role === 'admin');
    
    if (!isAuthorized) {
       return NextResponse.json<ApiResponse>(
        { success: false, error: 'Only team admins or owners can assign tasks' },
        { status: 403 }
      );
    }

    // Check if user to assign is team member
    const { data: assigneeMembership } = await supabase
      .from('team_members')
      .select('auth_user_id')
      .eq('team_id', project.team_id)
      .eq('auth_user_id', user_to_assign_id)
      .single();

    if (!assigneeMembership) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Target user must be a team member to be assigned' },
        { status: 400 }
      );
    }

    // Check if already assigned
    const { data: alreadyAssigned } = await supabase
      .from('task_assignments')
      .select('*')
      .eq('auth_user_id', user_to_assign_id)
      .eq('task_id', taskId)
      .single();

    if (alreadyAssigned) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'User is already assigned to this task' },
        { status: 409 }
      );
    }

    await supabase.from('task_assignments').insert({
      auth_user_id: user_to_assign_id,
      task_id: parseInt(taskId)
    });

    return NextResponse.json<ApiResponse>(
      {
        success: true,
        message: 'User assigned to task successfully',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Assign task error:', error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Unassign a user from a task
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { taskId: string } }
) {
  const user = await requireAuth(request);
  if (user instanceof NextResponse) return user;

  try {
    const taskId = params.taskId;
    const { searchParams } = new URL(request.url);
    const authUserIdToUnassign = searchParams.get('auth_user_id');
    const requesterId = user.id;

    if (!authUserIdToUnassign) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'auth_user_id query parameter is required' },
        { status: 400 }
      );
    }

    // Get task/team info for permission check
    const { data: task } = await supabase
      .from('tasks')
      .select('project_id')
      .eq('task_id', taskId)
      .single();

    const { data: project } = await supabase
      .from('projects')
      .select('team_id')
      .eq('project_id', task?.project_id)
      .single();

    const { data: requesterMembership } = await supabase
      .from('team_members')
      .select('role')
      .eq('team_id', project?.team_id)
      .eq('auth_user_id', requesterId)
      .single();

    const isAdmin = requesterMembership && (requesterMembership.role === 'owner' || requesterMembership.role === 'admin');
    const isSelfUnassign = authUserIdToUnassign === requesterId;

    if (!isAdmin && !isSelfUnassign) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Unauthorized: Only admins or the assignee themselves can remove an assignment' },
        { status: 403 }
      );
    }

    await supabase
      .from('task_assignments')
      .delete()
      .eq('auth_user_id', authUserIdToUnassign)
      .eq('task_id', taskId);

    return NextResponse.json<ApiResponse>({
      success: true,
      message: 'User unassigned from task successfully',
    });
  } catch (error) {
    console.error('Unassign task error:', error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
