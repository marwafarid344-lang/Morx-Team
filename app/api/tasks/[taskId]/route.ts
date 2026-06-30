import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/middleware/auth';
import { supabaseAdmin as supabase } from '@/lib/supabase';
import { ApiResponse } from '@/lib/types';
import { encodeContent, decodeContent } from '@/lib/utils/contentEncoding';

/**
 * Get task by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { taskId: string } }
) {
  const user = await requireAuth(request);
  if (user instanceof NextResponse) return user;

  try {
    const { taskId } = params;

    // Get task
    const { data: task, error: taskError } = await supabase
      .from('tasks')
      .select('*')
      .eq('task_id', taskId)
      .single();

    if (taskError || !task) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Task not found' },
        { status: 404 }
      );
    }

    // Get assignees
    const { data: assignments } = await supabase
      .from('task_assignments')
      .select('auth_user_id')
      .eq('task_id', taskId);

    let assignees: any[] = [];
    if (assignments && assignments.length > 0) {
      const userIds = assignments.map((a: any) => a.auth_user_id);
      const { data: users } = await supabase
        .from('users')
        .select('auth_user_id, first_name')
        .in('auth_user_id', userIds);

      assignees = users?.map((u: any) => ({
        auth_user_id: u.auth_user_id,
        name: `${u.first_name || ''} ${''}`.trim()
      })) || [];
    }

    return NextResponse.json<ApiResponse>({
      success: true,
      data: {
        ...task,
        title: decodeContent(task.title),
        description: decodeContent(task.description || ''),
        assignees
      },
    });
  } catch (error) {
    console.error('Get task error:', error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Update task
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { taskId: string } }
) {
  const user = await requireAuth(request);
  if (user instanceof NextResponse) return user;

  try {
    const { taskId } = params;
    const body = await request.json();
    const { title, description, status, due_date, priority } = body;

    // Build update object
    const updates: Record<string, any> = {};
    if (title !== undefined) updates.title = encodeContent(title);
    if (description !== undefined) updates.description = encodeContent(description);
    if (status !== undefined) updates.status = status;
    if (due_date !== undefined) updates.due_date = due_date;
    if (priority !== undefined) updates.priority = priority;

    if (Object.keys(updates).length === 0) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'No fields to update' },
        { status: 400 }
      );
    }

    const { data: updated, error: updateError } = await supabase
      .from('tasks')
      .update(updates)
      .eq('task_id', taskId)
      .select()
      .single();

    if (updateError) throw updateError;

    return NextResponse.json<ApiResponse>({
      success: true,
      message: 'Task updated successfully',
      data: {
        ...updated,
        title: decodeContent(updated.title),
        description: decodeContent(updated.description || '')
      },
    });
  } catch (error) {
    console.error('Update task error:', error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Delete task
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { taskId: string } }
) {
  const user = await requireAuth(request);
  if (user instanceof NextResponse) return user;

  try {
    const authUserId = user.id;
    const { taskId } = params;

    // Get task info
    const { data: task, error: taskError } = await supabase
      .from('tasks')
      .select('auth_user_id, project_id')
      .eq('task_id', taskId)
      .single();

    if (taskError || !task) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Task not found' },
        { status: 404 }
      );
    }

    // Get project team info
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

    // Check if user is task creator or team admin/owner
    const isTaskCreator = task.auth_user_id === authUserId;

    const { data: membership } = await supabase
      .from('team_members')
      .select('role')
      .eq('team_id', project.team_id)
      .eq('auth_user_id', authUserId)
      .single();

    const isAdmin = membership && (membership.role === 'owner' || membership.role === 'admin');

    if (!isTaskCreator && !isAdmin) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Only task creator or team admin can delete this task' },
        { status: 403 }
      );
    }

    const { error: deleteError } = await supabase
      .from('tasks')
      .delete()
      .eq('task_id', taskId);

    if (deleteError) throw deleteError;

    return NextResponse.json<ApiResponse>({
      success: true,
      message: 'Task deleted successfully',
    });
  } catch (error) {
    console.error('Delete task error:', error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
