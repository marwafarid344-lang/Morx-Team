import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/middleware/auth';
import { supabaseAdmin as supabase } from '@/lib/supabase';
import { ApiResponse } from '@/lib/types';

/**
 * Sync profile image from Google to database - uses authenticated user's ID
 */
export async function POST(request: NextRequest) {
  const user = await requireAuth(request);
  if (user instanceof NextResponse) return user;

  try {
    const body = await request.json();
    const { profile_image } = body;

    if (!profile_image) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'profile_image is required' },
        { status: 400 }
      );
    }

    // Update user's profile image using auth_user_id from session
    const { data, error } = await supabase
      .from('users')
      .update({ profile_image })
      .eq('auth_user_id', user.id)
      .select('auth_user_id, first_name, last_name, email, profile_image, study_level, department, faculty, governorate, bio, skills, is_available, created_at')
      .single();

    if (error) {
      // console.error('[Sync Profile Image] Error:', error);
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Failed to update profile image' },
        { status: 500 }
      );
    }

    return NextResponse.json<ApiResponse>({
      success: true,
      message: 'Profile image updated successfully',
      data
    });
  } catch (error) {
    // console.error('[Sync Profile Image] Error:', error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
