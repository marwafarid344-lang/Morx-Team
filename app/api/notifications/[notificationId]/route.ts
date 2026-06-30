import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/middleware/auth';
import { supabaseAdmin as supabase } from '@/lib/supabase';
import { ApiResponse } from '@/lib/types';

/**
 * Mark a single notification as read
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { notificationId: string } }
) {
  const user = await requireAuth(request);
  if (user instanceof NextResponse) return user;

  try {
    const authUserId = user.id;
    const notificationId = params.notificationId;

    // Verify notification belongs to user - Using auth_user_id
    const { data: notification } = await supabase
      .from('notifications')
      .select('auth_user_id')
      .eq('notification_id', notificationId)
      .single();

    if (!notification) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Notification not found' },
        { status: 404 }
      );
    }

    if (notification.auth_user_id !== authUserId) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Unauthorized' },
        { status: 403 }
      );
    }

    await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('notification_id', notificationId);

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
 * Delete a single notification
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { notificationId: string } }
) {
  const user = await requireAuth(request);
  if (user instanceof NextResponse) return user;

  try {
    const authUserId = user.id;
    const notificationId = params.notificationId;

    // Verify notification belongs to user - Using auth_user_id
    const { data: notification } = await supabase
      .from('notifications')
      .select('auth_user_id')
      .eq('notification_id', notificationId)
      .single();

    if (!notification) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Notification not found' },
        { status: 404 }
      );
    }

    if (notification.auth_user_id !== authUserId) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Unauthorized' },
        { status: 403 }
      );
    }

    await supabase
      .from('notifications')
      .delete()
      .eq('notification_id', notificationId);

    return NextResponse.json<ApiResponse>({
      success: true,
      message: 'Notification deleted successfully',
    });
  } catch (error) {
    console.error('Delete notification error:', error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
