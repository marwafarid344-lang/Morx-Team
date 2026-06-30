import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/middleware/auth';
import { supabaseAdmin as supabase } from '@/lib/supabase';
import { ApiResponse } from '@/lib/types';

/**
 * Handle files for a specific task
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { taskId: string } }
) {
  const user = await requireAuth(request);
  if (user instanceof NextResponse) return user;

  try {
    const taskId = params.taskId;
    const authUserId = user.id;
    const body = await request.json();
    const { file_name, file_url } = body;

    if (!file_name || !file_url) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'file_name and file_url are required' },
        { status: 400 }
      );
    }

    // Insert file record - Use authUserId (UUID)
    const { data: newFile, error } = await supabase
      .from('task_files')
      .insert({
        task_id: parseInt(taskId),
        file_name,
        file_url,
        auth_user_id: authUserId
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json<ApiResponse>({
      success: true,
      message: 'File uploaded successfully',
      data: newFile
    });
  } catch (error) {
    console.error('Upload file error:', error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { taskId: string } }
) {
  const user = await requireAuth(request);
  if (user instanceof NextResponse) return user;

  try {
    const taskId = params.taskId;

    // Get files for task
    const { data: files, error } = await supabase
      .from('task_files')
      .select('*')
      .eq('task_id', taskId);

    if (error) throw error;

    return NextResponse.json<ApiResponse>({
      success: true,
      data: files || []
    });
  } catch (error) {
    console.error('Download file error:', error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
