import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/middleware/auth';
import { supabaseAdmin as supabase } from '@/lib/supabase';
import { ApiResponse } from '@/lib/types';

/**
 * Get task documentation
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { taskId: string } }
) {
  const user = await requireAuth(request);
  if (user instanceof NextResponse) return user;

  try {
    const { taskId } = params;

    // Get task documentation
    const { data: doc, error } = await supabase
      .from('task_docs')
      .select('*')
      .eq('task_id', taskId)
      .single();

    // If no doc exists, return empty content
    if (error && error.code === 'PGRST116') {
      return NextResponse.json<ApiResponse>({
        success: true,
        data: {
          task_id: taskId,
          content: '',
          exists: false
        }
      });
    }

    if (error) throw error;

    // Get creator info
    let creatorName = 'Unknown';
    if (doc.auth_user_id) {
      const { data: creator } = await supabase
        .from('users')
        .select('first_name')
        .eq('auth_user_id', doc.auth_user_id)
        .single();
      if (creator) {
        creatorName = `${creator.first_name || ''}`.trim() || 'Unknown';
      }
    }

    return NextResponse.json<ApiResponse>({
      success: true,
      data: {
        ...doc,
        exists: true,
        creator_name: creatorName
      }
    });
  } catch (error) {
    console.error('Get task doc error:', error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Create or Update task documentation
 * Only task creator or team admin/owner can edit
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { taskId: string } }
) {
  const user = await requireAuth(request);
  if (user instanceof NextResponse) return user;

  try {
    const body = await request.json();
    const { content } = body;
    const authUserId = user.id;
    const { taskId } = params;

    if (content === undefined) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'content is required' },
        { status: 400 }
      );
    }

    // Get task info
    const { data: task } = await supabase
      .from('tasks')
      .select('task_id, auth_user_id, project_id')
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
        { success: false, error: 'Only task creator or team admin can edit documentation' },
        { status: 403 }
      );
    }

    // Check if doc exists
    const { data: existingDoc } = await supabase
      .from('task_docs')
      .select('doc_id')
      .eq('task_id', taskId)
      .single();

    let doc;

    if (existingDoc) {
      // Update existing doc
      const { data, error } = await supabase
        .from('task_docs')
        .update({ content })
        .eq('task_id', taskId)
        .select()
        .single();

      if (error) throw error;
      doc = data;
    } else {
      // Create new doc
      const { data, error } = await supabase
        .from('task_docs')
        .insert({
          task_id: taskId,
          content,
          auth_user_id: authUserId
        })
        .select()
        .single();

      if (error) throw error;
      doc = data;
    }

    return NextResponse.json<ApiResponse>({
      success: true,
      message: 'Documentation saved successfully',
      data: doc
    });
  } catch (error) {
    console.error('Save task doc error:', error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Delete task documentation
 * Only task creator or team admin/owner can delete
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
    const { data: task } = await supabase
      .from('tasks')
      .select('auth_user_id, project_id')
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

    // Check permissions
    const isTaskCreator = task.auth_user_id === authUserId;

    const { data: membership } = await supabase
      .from('team_members')
      .select('role')
      .eq('team_id', project?.team_id)
      .eq('auth_user_id', authUserId)
      .single();

    const isAdmin = membership && (membership.role === 'owner' || membership.role === 'admin');

    if (!isTaskCreator && !isAdmin) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Only task creator or team admin can delete documentation' },
        { status: 403 }
      );
    }

    await supabase
      .from('task_docs')
      .delete()
      .eq('task_id', taskId);

    return NextResponse.json<ApiResponse>({
      success: true,
      message: 'Documentation deleted successfully'
    });
  } catch (error) {
    console.error('Delete task doc error:', error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
