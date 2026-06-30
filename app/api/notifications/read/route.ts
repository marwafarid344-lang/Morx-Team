import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/middleware/auth';
import { supabaseAdmin as supabase } from '@/lib/supabase';
import { ApiResponse } from '@/lib/types';

/**
 * Mark a specific notification as read
 */
export async function PUT(request: NextRequest) {
  const user = await requireAuth(request);
  if (user instanceof NextResponse) return user;

  try {
    const { notification_id } = await request.json();
    const authUserId = user.id;

    if (!notification_id) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'notification_id is required' },
        { status: 400 }
      );
    }

    await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('notification_id', notification_id)
      .eq('auth_user_id', authUserId);

    return NextResponse.json<ApiResponse>({
      success: true,
      message: 'Notification marked as read',
    });
  } catch (error) {
    console.error('Mark notification as read error:', error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Mark all user notifications as read
 */
export async function POST(request: NextRequest) {
  const user = await requireAuth(request);
  if (user instanceof NextResponse) return user;

  try {
    const authUserId = user.id;

    await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('auth_user_id', authUserId)
      .eq('is_read', false);

    return NextResponse.json<ApiResponse>({
      success: true,
      message: 'All notifications marked as read',
    });
  } catch (error) {
    console.error('Mark all notifications as read error:', error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
