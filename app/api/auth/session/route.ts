import { NextRequest, NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import { supabaseAdmin as supabase } from '@/lib/supabase';
import { createClient } from '@/lib/supabase/server';
import { ApiResponse } from '@/lib/types';

/**
 * Get current session with full user data for frontend synchronization
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    let authUserId = searchParams.get('auth_user_id');

    // If no auth_user_id in params, check server-side session
    if (!authUserId) {
      const supabaseServer = createClient();
      const { data: { user: sbUser } } = await supabaseServer.auth.getUser();
      
      if (sbUser) {
        // Resolve auth_user_id from database using email (UUID)
        const { data: dbUser } = await supabase
          .from('users')
          .select('auth_user_id')
          .eq('email', sbUser.email)
          .single();
        
        if (dbUser) {
          authUserId = dbUser.auth_user_id;
        } else {
          // New user from OAuth - needs profile completion
          return NextResponse.json<ApiResponse>({
            success: true,
            data: {
              needsProfileCompletion: true,
              email: sbUser.email,
              first_name: sbUser.user_metadata?.first_name || sbUser.user_metadata?.full_name?.split(' ')[0] || '',
              last_name: sbUser.user_metadata?.last_name || sbUser.user_metadata?.full_name?.split(' ').slice(1).join(' ') || '',
              avatar_url: sbUser.user_metadata?.avatar_url || '',
            }
          });
        }
      }
    }

    if (!authUserId) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Get full user data from database using auth_user_id (UUID)
    const { data: userData, error } = await supabase
      .from('users')
      .select('auth_user_id, first_name, last_name, email, profile_image, created_at')
      .eq('auth_user_id', authUserId)
      .single();

    if (error || !userData) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json<ApiResponse>({
      success: true,
      data: {
        needsProfileCompletion: false,
        user: userData,
        session: {
          user: {
            id: userData.auth_user_id, // This is the string UUID
            email: userData.email,
            first_name: userData.first_name,
            last_name: userData.last_name,
            name: `${userData.first_name || ''} ${userData.last_name || ''}`.trim(),
            profileImage: userData.profile_image,
          },
        },
      },
    });
  } catch (error) {
    // console.error('Get session error:', error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
