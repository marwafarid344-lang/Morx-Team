import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/middleware/auth';
import { supabaseAdmin as supabase } from '@/lib/supabase';
import { ApiResponse } from '@/lib/types';
import { encodeContent, decodeContent } from '@/lib/utils/contentEncoding';

/**
 * Get all tasks for a project
 */
export async function GET(request: NextRequest) {
  const user = await requireAuth(request);
  if (user instanceof NextResponse) return user;

  try {
    const { searchParams } = new URL(request.url);
    const authUserId = user.id;
    const projectId = searchParams.get('project_id');

    if (!projectId) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'project_id is required' },
        { status: 400 }
      );
    }

    // Get project and team info
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('project_id, team_id')
      .eq('project_id', projectId)
      .single();

    if (projectError || !project) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Project not found' },
        { status: 404 }
      );
    }

    // Check if user has access
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

    // Get all tasks for the project
    const { data: tasks, error: tasksError } = await supabase
      .from('tasks')
      .select('*')
      .eq('project_id', projectId)
      .order('due_date', { ascending: true, nullsFirst: false })
      .order('priority', { ascending: false });

    if (tasksError) throw tasksError;

    const taskIds = tasks?.map((t: any) => t.task_id) || [];

    // Get assignments for all tasks
    let assignmentsMap: Record<number, any[]> = {};
    let commentCounts: Record<number, number> = {};

    if (taskIds.length > 0) {
      // Get assignments
      const { data: assignments } = await supabase
        .from('task_assignments')
        .select('task_id, auth_user_id')
        .in('task_id', taskIds);

      // Get user info for assignments
      const assignedUserIds = [...new Set(assignments?.map((a: any) => a.auth_user_id) || [])];
      let usersMap: Record<string, any> = {};
      
      if (assignedUserIds.length > 0) {
        const { data: users } = await supabase
          .from('users')
          .select('auth_user_id, first_name, last_name, profile_image')
          .in('auth_user_id', assignedUserIds);
        
        users?.forEach((u: any) => {
          usersMap[u.auth_user_id] = u;
        });
      }

      assignments?.forEach((a: any) => {
        if (!assignmentsMap[a.task_id]) {
          assignmentsMap[a.task_id] = [];
        }
        const assignedUser = usersMap[a.auth_user_id];
        assignmentsMap[a.task_id].push({
          auth_user_id: a.auth_user_id,
          name: assignedUser ? `${assignedUser.first_name || ''}${assignedUser.last_name ? ' ' + assignedUser.last_name : ''}`.trim() : 'Unknown',
          profile_image: assignedUser?.profile_image || ''
        });
      });

      // Get comment counts
      const { data: comments } = await supabase
        .from('task_comments')
        .select('task_id')
        .in('task_id', taskIds);

      comments?.forEach((c: any) => {
        commentCounts[c.task_id] = (commentCounts[c.task_id] || 0) + 1;
      });
    }

    // Combine data
    const tasksWithDetails = tasks?.map((task: any) => {
      const assignments = assignmentsMap[task.task_id] || [];
      return {
        ...task,
        title: decodeContent(task.title),
        description: decodeContent(task.description || ''),
        // Format: "authUserId:name:profileImage||authUserId:name:profileImage"
        assigned_users: assignments.map((a: any) => `${a.auth_user_id}:${a.name}:${a.profile_image || ''}`).join('||'),
        comment_count: commentCounts[task.task_id] || 0
      };
    }) || [];

    return NextResponse.json<ApiResponse>({
      success: true,
      data: tasksWithDetails,
    });
  } catch (error) {
    console.error('Get tasks error:', error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Create a new task
 */
export async function POST(request: NextRequest) {
  const user = await requireAuth(request);
  if (user instanceof NextResponse) return user;

  try {
    const body = await request.json();
    const { title, description, project_id, priority, due_date, status, assigned_to } = body;
    const authUserId = user.id;

    if (!title || !project_id) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'title and project_id are required' },
        { status: 400 }
      );
    }

    // Get project team
    const { data: project } = await supabase
      .from('projects')
      .select('team_id, project_name')
      .eq('project_id', project_id)
      .single();

    if (!project) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Project not found' },
        { status: 404 }
      );
    }

    // Check if user is team member
    const { data: membership } = await supabase
      .from('team_members')
      .select('role')
      .eq('team_id', project.team_id)
      .eq('auth_user_id', authUserId)
      .single();

    if (!membership) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Access denied - not a team member' },
        { status: 403 }
      );
    }

    // Only owners and admins can create tasks
    if (membership.role !== 'owner' && membership.role !== 'admin') {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Only owners and admins can create tasks' },
        { status: 403 }
      );
    }

    // Create task
    const { data: newTask, error: createError } = await supabase
      .from('tasks')
      .insert({
        title: encodeContent(title),
        description: encodeContent(description || ''),
        project_id,
        priority: priority || 3,
        due_date: due_date || null,
        status: status || 0,
        auth_user_id: authUserId
      })
      .select()
      .single();

    if (createError) throw createError;

    // Assign users if specified (assigned_to contains auth_user_id UUIDs)
    if (assigned_to && Array.isArray(assigned_to) && assigned_to.length > 0) {
      const assignments = assigned_to.map((assignedAuthUserId: string) => ({
        auth_user_id: assignedAuthUserId,
        task_id: newTask.task_id
      }));

      await supabase.from('task_assignments').insert(assignments);

      // 1. Send "New Task Assigned" notification to all assignees
      const assignmentNotifications = assigned_to.map((assignedAuthUserId: string) => ({
        auth_user_id: assignedAuthUserId,
        title: '📝 New Task Assigned',
        message: `You've been assigned to "${decodeContent(title)}" in project "${project.project_name}"`,
        task_id: newTask.task_id,
        related_id: newTask.task_id,
        type: 'task_assigned',
        is_read: false
      }));

      await supabase.from('notifications').insert(assignmentNotifications);

      // 2. Also send "Due Soon" alert if it's within 24h
      if (due_date) {
        const dueTime = new Date(due_date).getTime();
        const now = Date.now();
        const hoursUntilDue = (dueTime - now) / (1000 * 60 * 60);

        if (hoursUntilDue > 0 && hoursUntilDue <= 24) {
          const dueNotifications = assigned_to.map((assignedAuthUserId: string) => ({
            auth_user_id: assignedAuthUserId,
            title: '⏰ Task Due Soon',
            message: `Task "${decodeContent(title)}" is due in ${Math.round(hoursUntilDue)} hours`,
            task_id: newTask.task_id,
            related_id: newTask.task_id,
            type: 'task_due',
            is_read: false
          }));

          await supabase.from('notifications').insert(dueNotifications);
        }
      }
    }

    return NextResponse.json<ApiResponse>(
      {
        success: true,
        message: 'Task created successfully',
        data: newTask,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Create task error:', error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Update task
 */
export async function PATCH(request: NextRequest) {
  const user = await requireAuth(request);
  if (user instanceof NextResponse) return user;

  try {
    const body = await request.json();
    const { task_id, title, description, priority, due_date, status } = body;
    const authUserId = user.id;

    if (!task_id) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'task_id is required' },
        { status: 400 }
      );
    }

    // Get task and project info (including original values for comparison)
    const { data: task } = await supabase
      .from('tasks')
      .select('task_id, project_id, title, due_date, status, priority')
      .eq('task_id', task_id)
      .single();

    if (!task) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Task not found' },
        { status: 404 }
      );
    }

    // Store original values for comparison
    const originalDueDate = task.due_date;
    const originalStatus = task.status;
    const originalPriority = task.priority;

    // Get project team
    const { data: project } = await supabase
      .from('projects')
      .select('team_id, project_name')
      .eq('project_id', task.project_id)
      .single();

    if (!project) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Project not found' },
        { status: 404 }
      );
    }

    // Check user access
    const { data: membership } = await supabase
      .from('team_members')
      .select('role')
      .eq('team_id', project.team_id)
      .eq('auth_user_id', authUserId)
      .single();

    if (!membership) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Task not found or access denied' },
        { status: 404 }
      );
    }

    // Build update object
    const updates: Record<string, any> = {};
    const isAdmin = membership.role === 'admin' || membership.role === 'owner';

    if (priority !== undefined) updates.priority = priority;
    if (due_date !== undefined) updates.due_date = due_date;
    if (status !== undefined) updates.status = status;

    if ((title !== undefined || description !== undefined) && !isAdmin) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Only admins and owners can update title/description' },
        { status: 403 }
      );
    }

    if (title !== undefined) updates.title = encodeContent(title);
    if (description !== undefined) updates.description = encodeContent(description);

    if (Object.keys(updates).length === 0) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'No fields to update' },
        { status: 400 }
      );
    }

    // Update task
    const { data: updatedTask, error: updateError } = await supabase
      .from('tasks')
      .update(updates)
      .eq('task_id', task_id)
      .select()
      .single();

    if (updateError) throw updateError;

    // Send notifications for significant changes
    try {
      // Get assigned users for this task
      const { data: assignments } = await supabase
        .from('task_assignments')
        .select('auth_user_id')
        .eq('task_id', task_id);

      const assignedUserIds = assignments?.map(a => a.auth_user_id).filter(id => id !== authUserId) || [];

      if (assignedUserIds.length > 0) {
        const taskTitle = decodeContent(task.title);
        const notifications: any[] = [];

        // Check for due date change
        if (due_date !== undefined && due_date !== originalDueDate) {
          const formattedDate = due_date 
            ? new Date(due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
            : 'No due date';
          
          assignedUserIds.forEach((userId: string) => {
            notifications.push({
              auth_user_id: userId,
              title: '📅 Due Date Changed',
              message: `Task "${taskTitle}" due date changed to ${formattedDate}`,
              task_id: task_id,
              related_id: task_id,
              type: 'task_date_changed',
              is_read: false
            });
          });
        }

        // Check for status change to completed (status 2 = done)
        if (status !== undefined && status === 2 && originalStatus !== 2) {
          assignedUserIds.forEach((userId: string) => {
            notifications.push({
              auth_user_id: userId,
              title: '✅ Task Completed',
              message: `Task "${taskTitle}" in "${project.project_name}" has been marked as done`,
              task_id: task_id,
              related_id: task_id,
              type: 'task_completed',
              is_read: false
            });
          });
        }

        // Check for priority change
        if (priority !== undefined && priority !== originalPriority) {
          const priorityLabels: Record<number, string> = { 1: 'Low', 2: 'Medium', 3: 'High' };
          const newPriorityLabel = priorityLabels[priority] || 'Unknown';
          
          assignedUserIds.forEach((userId: string) => {
            notifications.push({
              auth_user_id: userId,
              title: '⚡ Priority Changed',
              message: `Task "${taskTitle}" priority changed to ${newPriorityLabel}`,
              task_id: task_id,
              related_id: task_id,
              type: 'task_priority_changed',
              is_read: false
            });
          });
        }

        // Insert all notifications
        if (notifications.length > 0) {
          await supabase.from('notifications').insert(notifications);
        }
      }
    } catch (notifError) {
      // Log error but don't fail the update
      console.error('Failed to send update notifications:', notifError);
    }

    return NextResponse.json<ApiResponse>({
      success: true,
      message: 'Task updated successfully',
      data: {
        ...updatedTask,
        title: decodeContent(updatedTask.title),
        description: decodeContent(updatedTask.description || '')
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
export async function DELETE(request: NextRequest) {
  const user = await requireAuth(request);
  if (user instanceof NextResponse) return user;

  try {
    const { searchParams } = new URL(request.url);
    const authUserId = user.id;
    const taskId = searchParams.get('task_id');

    if (!taskId) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'task_id is required' },
        { status: 400 }
      );
    }

    // Get task and project
    const { data: task } = await supabase
      .from('tasks')
      .select('task_id, project_id, auth_user_id')
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

    // Check user is team member
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

    // Check if user is task creator or team admin/owner
    const isTaskCreator = task.auth_user_id === authUserId;
    const isAdmin = membership.role === 'owner' || membership.role === 'admin';

    if (!isTaskCreator && !isAdmin) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Only task creator or team admin can delete this task' },
        { status: 403 }
      );
    }

    // Delete task
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
