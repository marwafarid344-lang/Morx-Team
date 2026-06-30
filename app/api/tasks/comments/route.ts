import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/middleware/auth';
import { supabaseAdmin as supabase } from '@/lib/supabase';
import { encodeContent, decodeContent } from '@/lib/utils/contentEncoding';
import { ApiResponse } from '@/lib/types';

/**
 * Get all comments for a task
 */
export async function GET(request: NextRequest) {
  const user = await requireAuth(request);
  if (user instanceof NextResponse) return user;

  try {
    const { searchParams } = new URL(request.url);
    const task_id = searchParams.get('task_id');
    const authUserId = user.id;

    if (!task_id) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'task_id is required' },
        { status: 400 }
      );
    }

    // Get task and project to verify access
    const { data: task } = await supabase
      .from('tasks')
      .select('project_id')
      .eq('task_id', task_id)
      .single();

    if (!task) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Task not found' },
        { status: 404 }
      );
    }

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

    // Check user access
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

    // Get comments
    const { data: comments, error } = await supabase
      .from('task_comments')
      .select('comment_id, comment_text, created_at, likes, auth_user_id')
      .eq('task_id', task_id)
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Get user info for comments
    const commentUserIds = [...new Set(comments?.map((c: any) => c.auth_user_id) || [])];
    let usersMap: Record<string, any> = {};

    if (commentUserIds.length > 0) {
      const { data: users } = await supabase
        .from('users')
        .select('auth_user_id, first_name, last_name, profile_image, plan')
        .in('auth_user_id', commentUserIds);

      users?.forEach((u: any) => {
        usersMap[u.auth_user_id] = u;
      });
    }

    const commentsWithUsers = comments?.map((c: any) => ({
      ...c,
      comment_text: decodeContent(c.comment_text),
      likes: c.likes || 0,
      first_name: usersMap[c.auth_user_id]?.first_name,
      last_name: usersMap[c.auth_user_id]?.last_name,
      profile_image: usersMap[c.auth_user_id]?.profile_image,
      plan: usersMap[c.auth_user_id]?.plan
    })) || [];

    return NextResponse.json<ApiResponse>({
      success: true,
      data: commentsWithUsers
    });

  } catch (error) {
    console.error('Get comments error:', error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Add a comment to a task
 */
export async function POST(request: NextRequest) {
  const user = await requireAuth(request);
  if (user instanceof NextResponse) return user;

  try {
    const body = await request.json();
    const { task_id, comment_text } = body;
    const authUserId = user.id;

    if (!task_id || !comment_text) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'task_id and comment_text are required' },
        { status: 400 }
      );
    }

    // Get task team info to check access
    const { data: task } = await supabase
      .from('tasks')
      .select('project_id')
      .eq('task_id', task_id)
      .single();

    if (!task) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Task not found' },
        { status: 404 }
      );
    }

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

    // Insert comment
    const { data: newComment, error } = await supabase
      .from('task_comments')
      .insert({
        task_id,
        auth_user_id: authUserId,
        comment_text: encodeContent(comment_text)
      })
      .select()
      .single();

    if (error) throw error;

    // Get user info for response
    const { data: userInfo } = await supabase
      .from('users')
      .select('first_name, last_name, profile_image, plan')
      .eq('auth_user_id', authUserId)
      .single();

    return NextResponse.json<ApiResponse>({
      success: true,
      message: 'Comment added successfully',
      data: {
        ...newComment,
        comment_text: decodeContent(newComment.comment_text),
        likes: 0,
        first_name: userInfo?.first_name,
        last_name: userInfo?.last_name,
        profile_image: userInfo?.profile_image,
        plan: userInfo?.plan
      }
    });

  } catch (error) {
    console.error('Add comment error:', error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Delete a comment
 */
export async function DELETE(request: NextRequest) {
  const user = await requireAuth(request);
  if (user instanceof NextResponse) return user;

  try {
    const { searchParams } = new URL(request.url);
    const comment_id = searchParams.get('comment_id');
    const authUserId = user.id;

    if (!comment_id) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'comment_id is required' },
        { status: 400 }
      );
    }

    // Get comment info
    const { data: comment, error: commentError } = await supabase
      .from('task_comments')
      .select('auth_user_id, task_id')
      .eq('comment_id', comment_id)
      .single();

    if (commentError || !comment) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Comment not found' },
        { status: 404 }
      );
    }

    // Get task/team info for permission check
    const { data: task } = await supabase
      .from('tasks')
      .select('project_id')
      .eq('task_id', comment.task_id)
      .single();

    const { data: project } = await supabase
      .from('projects')
      .select('team_id')
      .eq('project_id', task?.project_id)
      .single();

    // Check permissions
    const isCommentAuthor = comment.auth_user_id === authUserId;

    const { data: membership } = await supabase
      .from('team_members')
      .select('role')
      .eq('team_id', project?.team_id)
      .eq('auth_user_id', authUserId)
      .single();

    const isAdmin = membership && (membership.role === 'owner' || membership.role === 'admin');

    if (!isCommentAuthor && !isAdmin) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Only comment author or team admin can delete this comment' },
        { status: 403 }
      );
    }

    await supabase
      .from('task_comments')
      .delete()
      .eq('comment_id', comment_id);

    return NextResponse.json<ApiResponse>({
      success: true,
      message: 'Comment deleted successfully'
    });

  } catch (error) {
    console.error('Delete comment error:', error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
