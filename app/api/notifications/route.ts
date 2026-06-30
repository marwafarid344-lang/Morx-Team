import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/middleware/auth';
import { supabaseAdmin as supabase } from '@/lib/supabase';
import { ApiResponse } from '@/lib/types';

/**
 * Get user notifications
 */
export async function GET(request: NextRequest) {
  const user = await requireAuth(request);
  if (user instanceof NextResponse) return user;

  try {
    const { searchParams } = new URL(request.url);
    const authUserId = user.id;
    const unreadOnly = searchParams.get('unread_only') === 'true';

    let query = supabase
      .from('notifications')
      .select('notification_id, auth_user_id, title, message, is_read, created_at, task_id, type, related_id')
      .eq('auth_user_id', authUserId)
      .order('created_at', { ascending: false })
      .limit(50);

    if (unreadOnly) {
      query = query.eq('is_read', false);
    }

    const { data: notifications, error } = await query;

    if (error) {
      // If table doesn't exist or other error, return empty array
      return NextResponse.json<ApiResponse>({
        success: true,
        data: [],
      });
    }

    return NextResponse.json<ApiResponse>({
      success: true,
      data: notifications || [],
    });
  } catch (error) {
    console.error('Get notifications error:', error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Create notification (for internal use)
 */
export async function POST(request: NextRequest) {
  const user = await requireAuth(request);
  if (user instanceof NextResponse) return user;

  try {
    const body = await request.json();
    const { target_auth_user_id, title, message, task_id } = body;

    if (!target_auth_user_id || !title || !message) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const { data: notification, error } = await supabase
      .from('notifications')
      .insert({
        auth_user_id: target_auth_user_id,
        title,
        message,
        task_id: task_id || null,
        is_read: false
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json<ApiResponse>({
      success: true,
      message: 'Notification created',
      data: { notification_id: notification.notification_id },
    });
  } catch (error) {
    console.error('Create notification error:', error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
