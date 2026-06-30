import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { supabaseAdmin } from '@/lib/supabase';
import { ApiResponse } from '@/lib/types';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

/**
 * Complete profile for new OAuth users
 * This is when the user actually gets saved to the database
 */
export async function POST(request: NextRequest) {
  try {
    const cookieStore = cookies();
    
    // Get temporary session (for new users from OAuth)
    const tempSessionCookie = cookieStore.get('morx_temp_session');
    
    if (!tempSessionCookie) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'No temporary session found. Please sign in again.' },
        { status: 401 }
      );
    }

    let tempSession;
    try {
      tempSession = JSON.parse(tempSessionCookie.value);
    } catch {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Invalid session data' },
        { status: 401 }
      );
    }

    // Verify this is a temporary session
    if (!tempSession.isTemporary) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Invalid session type' },
        { status: 400 }
      );
    }

    const { email, profileImage, auth_user_id } = tempSession;

    if (!email) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Email not found in session' },
        { status: 400 }
      );
    }

    // auth_user_id is REQUIRED
    if (!auth_user_id) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Auth user ID not found. Please sign in again.' },
        { status: 400 }
      );
    }

    // Get profile data from request
    const body = await request.json();
    const { first_name, last_name, password, governorate, study_level, department, faculty } = body;

    if (!first_name || !last_name) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'first_name and last_name are required' },
        { status: 400 }
      );
    }

    // Check if user already exists (safety check)
    const { data: existingUser } = await supabaseAdmin
      .from('users')
      .select('auth_user_id')
      .eq('email', email)
      .single();

    if (existingUser) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'User already exists' },
        { status: 409 }
      );
    }

    // Prepare user data - auth_user_id is the primary identifier
    const userData: any = {
      first_name, 
      last_name, 
      email, 
      profile_image: profileImage || '',
      auth_user_id: auth_user_id,  // UUID from Supabase Auth
      governorate,
      study_level,
      department,
      faculty
    };

    // Hash password if provided (SHA-256 + bcrypt for enhanced security)
    if (password) {
      const sha256Hash = crypto.createHash('sha256').update(password).digest('hex');
      userData.password = await bcrypt.hash(sha256Hash, 10);
    }

    // NOW create the user in the database
    const { data: newUser, error: insertError } = await supabaseAdmin
      .from('users')
      .insert(userData)
      .select('auth_user_id, first_name, last_name, email, profile_image, governorate, study_level, department, faculty, created_at')
      .single();

    if (insertError) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Failed to create user: ' + insertError.message },
        { status: 500 }
      );
    }

    const response = NextResponse.json<ApiResponse>(
      {
        success: true,
        message: 'Profile completed successfully',
        data: {
          user: newUser,
          redirectUrl: '/',
          isLoggedIn: true,
        },
      },
      { status: 201 }
    );

    // Set the real session cookie with auth_user_id (UUID) - NEVER use numeric user_id
    response.cookies.set('morx_session', JSON.stringify({
      auth_user_id: newUser.auth_user_id,  // UUID - the key field!
      first_name: newUser.first_name,
      last_name: newUser.last_name,
      email: newUser.email,
      profile_image: newUser.profile_image,
      created_at: newUser.created_at,
      isLoggedIn: true,
    }), {
      path: '/',
      httpOnly: false,
      secure: false, // Set to false to avoid local dev issues
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 1 week
    });

    // Delete the temporary session
    response.cookies.delete('morx_temp_session');

    return response;
  } catch (error) {
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
