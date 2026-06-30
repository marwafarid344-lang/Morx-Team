import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/middleware/auth';
import { supabaseAdmin as supabase } from '@/lib/supabase';
import { CreateCommentRequest, ApiResponse } from '@/lib/types';
import { encodeContent } from '@/lib/utils/contentEncoding';

export async function POST(request: NextRequest) {
  const user = await requireAuth(request);
  if (user instanceof NextResponse) return user;

  try {
    const body: CreateCommentRequest = await request.json();
    const { comment_text, task_id } = body;
    const authUserId = user.id;

    if (!comment_text || !task_id) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'comment_text and task_id are required' },
        { status: 400 }
      );
    }

    // Get task to check project
    const { data: task, error: taskError } = await supabase
      .from('tasks')
      .select('project_id')
      .eq('task_id', task_id)
      .single();

    if (taskError || !task) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Task not found' },
        { status: 404 }
      );
    }

    // Get project team to verify user membership
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

    // Check if user is team member
    const { data: membership } = await supabase
      .from('team_members')
      .select('role')
      .eq('auth_user_id', authUserId)
      .eq('team_id', project.team_id)
      .single();

    if (!membership) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Unauthorized: You must be a team member to comment' },
        { status: 403 }
      );
    }

    // Create comment (encode sensitive content)
    const { data: newComment, error: createError } = await supabase
      .from('task_comments')
      .insert({
        comment_text: encodeContent(comment_text),
        task_id,
        auth_user_id: authUserId
      })
      .select()
      .single();

    if (createError) throw createError;

    // Get user info for response
    const { data: userInfo } = await supabase
      .from('users')
      .select('first_name, last_name')
      .eq('auth_user_id', authUserId)
      .single();

    return NextResponse.json<ApiResponse>(
      {
        success: true,
        message: 'Comment created successfully',
        data: {
          ...newComment,
          first_name: userInfo?.first_name,
          last_name: userInfo?.last_name,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Create comment error:', error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  const user = await requireAuth(request);
  if (user instanceof NextResponse) return user;

  try {
    const { searchParams } = new URL(request.url);
    const taskId = searchParams.get('task_id');
    const authUserId = user.id;

    if (!taskId) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'task_id query parameter is required' },
        { status: 400 }
      );
    }

    // Get task to check project
    const { data: task, error: taskError } = await supabase
      .from('tasks')
      .select('project_id')
      .eq('task_id', taskId)
      .single();

    if (taskError || !task) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Task not found' },
        { status: 404 }
      );
    }

    // Get project team to verify user membership
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

    // Check if user is team member
    const { data: membership } = await supabase
      .from('team_members')
      .select('role')
      .eq('auth_user_id', authUserId)
      .eq('team_id', project.team_id)
      .single();

    if (!membership) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Unauthorized: You must be a team member to view comments' },
        { status: 403 }
      );
    }

    // Get all comments for the task
    const { data: comments, error: commentsError } = await supabase
      .from('task_comments')
      .select('*')
      .eq('task_id', taskId)
      .order('comment_id', { ascending: true });

    if (commentsError) throw commentsError;

    // Get user info for all commenters
    const commenterIds = [...new Set(comments?.map((c: any) => c.auth_user_id) || [])];
    let usersMap: Record<string, any> = {};

    if (commenterIds.length > 0) {
      const { data: users } = await supabase
        .from('users')
        .select('auth_user_id, first_name, last_name, email')
        .in('auth_user_id', commenterIds);

      users?.forEach((u: any) => {
        usersMap[u.auth_user_id] = u;
      });
    }

    // Format response
    const formattedComments = comments?.map((c: any) => ({
      ...c,
      first_name: usersMap[c.auth_user_id]?.first_name,
      last_name: usersMap[c.auth_user_id]?.last_name,
      email: usersMap[c.auth_user_id]?.email,
    })) || [];

    return NextResponse.json<ApiResponse>({
      success: true,
      data: formattedComments,
    });
  } catch (error) {
    console.error('Get comments error:', error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
