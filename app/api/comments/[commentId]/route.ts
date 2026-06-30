import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/middleware/auth';
import { supabaseAdmin as supabase } from '@/lib/supabase';
import { ApiResponse } from '@/lib/types';

/**
 * Delete a specific comment (author or admin only)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { commentId: string } }
) {
  const user = await requireAuth(request);
  if (user instanceof NextResponse) return user;

  try {
    const authUserId = user.id;
    const { commentId } = params;

    // Get comment info to check ownership
    const { data: comment } = await supabase
      .from('task_comments')
      .select('auth_user_id, task_id')
      .eq('comment_id', commentId)
      .single();

    if (!comment) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Comment not found' },
        { status: 404 }
      );
    }

    // Check if user is comment author - Using auth_user_id (UUID)
    const isAuthor = comment.auth_user_id === authUserId;

    if (!isAuthor) {
      // Get task and project to check team role
      const { data: task } = await supabase
        .from('tasks')
        .select('project_id')
        .eq('task_id', comment.task_id)
        .single();

      if (task) {
        const { data: project } = await supabase
          .from('projects')
          .select('team_id')
          .eq('project_id', task.project_id)
          .single();

        if (project) {
          const { data: membership } = await supabase
            .from('team_members')
            .select('role')
            .eq('team_id', project.team_id)
            .eq('auth_user_id', authUserId)
            .single();

          const isAdmin = membership && (membership.role === 'owner' || membership.role === 'admin');

          if (!isAdmin) {
            return NextResponse.json<ApiResponse>(
              { success: false, error: 'Only comment author or admins can delete comments' },
              { status: 403 }
            );
          }
        }
      }
    }

    // Delete comment
    await supabase
      .from('task_comments')
      .delete()
      .eq('comment_id', commentId);

    return NextResponse.json<ApiResponse>({
      success: true,
      message: 'Comment deleted successfully',
    });
  } catch (error) {
    console.error('Delete comment error:', error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
