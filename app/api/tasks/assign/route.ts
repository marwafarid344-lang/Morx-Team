import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/middleware/auth';
import { supabaseAdmin as supabase } from '@/lib/supabase';
import { ApiResponse } from '@/lib/types';
import { decodeContent } from '@/lib/utils/contentEncoding';

/**
 * Update task assignments
 */
export async function POST(request: NextRequest) {
  const user = await requireAuth(request);
  if (user instanceof NextResponse) return user;

  try {
    const body = await request.json();
    const { task_id, assigned_to } = body;
    const authUserId = user.id;

    if (!task_id) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'task_id is required' },
        { status: 400 }
      );
    }

    // Get task and project info
    const { data: task } = await supabase
      .from('tasks')
      .select('task_id, project_id')
      .eq('task_id', task_id)
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

    // Check user permissions
    const { data: membership } = await supabase
      .from('team_members')
      .select('role')
      .eq('team_id', project.team_id)
      .eq('auth_user_id', authUserId)
      .single();

    if (!membership) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Access denied' },
        { status: 403 }
      );
    }

    // Only admins and owners can reassign tasks
    if (membership.role !== 'owner' && membership.role !== 'admin') {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Only admins and owners can assign tasks' },
        { status: 403 }
      );
    }

    // Get existing assignments before deleting
    const { data: existingAssignments } = await supabase
      .from('task_assignments')
      .select('auth_user_id')
      .eq('task_id', task_id);

    const previousAssignees = existingAssignments?.map(a => a.auth_user_id) || [];

    // Delete existing assignments
    await supabase
      .from('task_assignments')
      .delete()
      .eq('task_id', task_id);

    // Add new assignments (assigned_to contains auth_user_id UUIDs)
    if (assigned_to && Array.isArray(assigned_to) && assigned_to.length > 0) {
      const newAssignments = assigned_to.map((assignedUserId: string) => ({
        auth_user_id: assignedUserId,
        task_id
      }));

      await supabase.from('task_assignments').insert(newAssignments);

      // Find newly assigned users (not previously assigned)
      const newlyAssignedUsers = assigned_to.filter(
        (userId: string) => !previousAssignees.includes(userId)
      );

      // Send notifications ONLY to newly assigned users
      if (newlyAssignedUsers.length > 0) {
        try {
          // Get task details for notification
          const { data: taskDetails } = await supabase
            .from('tasks')
            .select(`
              title,
              due_date,
              projects!inner(project_name)
            `)
            .eq('task_id', task_id)
            .single();

          if (taskDetails) {
            // Create notifications for each newly assigned user
            const projectName = (taskDetails.projects as any)?.project_name || 'Unknown';
            
            const notifications = newlyAssignedUsers.map((assignedUserId: string) => ({
              auth_user_id: assignedUserId,
              title: '📝 New Task Assigned',
              message: `You've been assigned to "${decodeContent(taskDetails.title)}" in project "${projectName}"`,
              task_id: task_id,
              related_id: task_id,
              type: 'task_assigned',
              is_read: false
            }));

            await supabase.from('notifications').insert(notifications);
          }
        } catch (notifError) {
          // Log error but don't fail the assignment
          console.error('Failed to send assignment notifications:', notifError);
        }
      }
    }

    return NextResponse.json<ApiResponse>({
      success: true,
      message: 'Task assignments updated successfully',
    });
  } catch (error) {
    console.error('Update task assignments error:', error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
