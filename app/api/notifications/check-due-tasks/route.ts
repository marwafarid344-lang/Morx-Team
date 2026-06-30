import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin as supabase } from '@/lib/supabase';
import { ApiResponse } from '@/lib/types';
import { decodeContent } from '@/lib/utils/contentEncoding';

/**
 * Check for tasks due within 24 hours and create notifications
 * This is an internal system route, usually triggered by a cron job or manual admin call.
 */
export async function POST(request: NextRequest) {
  try {
    const now = new Date();
    const in24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    // Get tasks due within 24 hours that are not completed
    const { data: tasks, error: tasksError } = await supabase
      .from('tasks')
      .select('task_id, title, due_date, project_id')
      .neq('status', 2)
      .not('due_date', 'is', null)
      .gte('due_date', now.toISOString())
      .lte('due_date', in24Hours.toISOString());

    if (tasksError) throw tasksError;

    const taskIds = tasks?.map((t: any) => t.task_id) || [];

    if (taskIds.length === 0) {
      return NextResponse.json<ApiResponse>({
        success: true,
        message: 'No tasks due soon',
        data: { count: 0 },
      });
    }

    // Get project names
    const projectIds = [...new Set(tasks?.map((t: any) => t.project_id) || [])];
    const { data: projects } = await supabase
      .from('projects')
      .select('project_id, project_name')
      .in('project_id', projectIds);

    const projectMap: Record<number, string> = {};
    projects?.forEach((p: any) => {
      projectMap[p.project_id] = p.project_name;
    });

    // Get assignments - Use auth_user_id (UUID)
    const { data: assignments } = await supabase
      .from('task_assignments')
      .select('task_id, auth_user_id')
      .in('task_id', taskIds);

    let notificationsCreated = 0;

    for (const task of tasks || []) {
      const taskAssignments = assignments?.filter((a: any) => a.task_id === task.task_id) || [];
      
      for (const assignment of taskAssignments) {
        const dueDate = new Date(task.due_date);
        const hoursUntilDue = Math.round((dueDate.getTime() - Date.now()) / (1000 * 60 * 60));

        // Check if notification already exists - Match by auth_user_id
        const { data: existingNotif } = await supabase
          .from('notifications')
          .select('notification_id')
          .eq('task_id', task.task_id)
          .eq('auth_user_id', assignment.auth_user_id)
          .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
          .single();

        if (!existingNotif) {
          await supabase.from('notifications').insert({
            auth_user_id: assignment.auth_user_id,
            title: '⏰ Task Due Soon',
            message: `Task "${decodeContent(task.title)}" in project "${projectMap[task.project_id]}" is due in ${hoursUntilDue} hours`,
            task_id: task.task_id,
            related_id: task.task_id,
            type: 'task_due'
          });
          notificationsCreated++;
        }
      }
    }

    return NextResponse.json<ApiResponse>({
      success: true,
      message: `Created ${notificationsCreated} notifications for tasks due soon`,
      data: { count: notificationsCreated },
    });
  } catch (error) {
    console.error('Check due tasks error:', error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
