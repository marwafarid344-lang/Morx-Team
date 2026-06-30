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
    const authUserId = user.id;

    const { data: notifications, error } = await supabase
      .from('notifications')
      .select('notification_id, auth_user_id, title, message, is_read, created_at, task_id, type')
      .eq('auth_user_id', authUserId)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) throw error;

    // Count unread
    const unreadCount = notifications?.filter((n: any) => !n.is_read).length || 0;

    return NextResponse.json<ApiResponse>({
      success: true,
      data: {
        notifications: notifications || [],
        unread_count: unreadCount,
      },
    });
  } catch (error) {
    // console.error('Get notifications error:', error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
