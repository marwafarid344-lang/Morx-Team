import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/middleware/auth';
import { supabaseAdmin as supabase } from '@/lib/supabase';
import { User, ApiResponse } from '@/lib/types';

export async function GET(request: NextRequest) {
  const user = await requireAuth(request);
  if (user instanceof NextResponse) return user;

  try {
    const authUserId = user.id;

    // Query by auth_user_id (UUID)
    const { data: userProfile, error } = await supabase
      .from('users')
      .select('auth_user_id, first_name, last_name, email, profile_image, plan, department, study_level, faculty, governorate, bio, skills, is_available, searching_teams_subjects, links, created_at')
      .eq('auth_user_id', authUserId)
      .single();

    if (error || !userProfile) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json<ApiResponse>({
      success: true,
      data: userProfile,
    });
  } catch (error) {
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  const user = await requireAuth(request);
  if (user instanceof NextResponse) return user;

  try {
    const body = await request.json();
    const { first_name, last_name, plan } = body;
    const authUserId = user.id;

    if (!first_name && !last_name && !plan) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'At least one field must be provided' },
        { status: 400 }
      );
    }

    // Build update object
    const updates: Record<string, any> = {};
    if (first_name) updates.first_name = first_name;
    if (last_name) updates.last_name = last_name;
    if (plan !== undefined) updates.plan = plan;

    const { error: updateError } = await supabase
      .from('users')
      .update(updates)
      .eq('auth_user_id', authUserId);

    if (updateError) throw updateError;

    const { data: updatedUser } = await supabase
      .from('users')
      .select('auth_user_id, first_name, last_name, email, profile_image, plan, department, study_level, faculty, governorate, bio, skills, is_available, searching_teams_subjects, links, created_at')
      .eq('auth_user_id', authUserId)
      .single();

    return NextResponse.json<ApiResponse>({
      success: true,
      message: 'Profile updated successfully',
      data: updatedUser,
    });
  } catch (error) {
    // console.error('Update profile error:', error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
