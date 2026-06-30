import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin as supabase } from '@/lib/supabase';
import { ApiResponse } from '@/lib/types';
import bcrypt from 'bcryptjs';

/**
 * Complete signup for new users from OAuth (Google)
 * This creates both the auth user and the database record
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { first_name, last_name, email, password, profile_image, oauth_provider } = body;

    // Validate input
    if (!email || !password || !first_name || !last_name) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'All fields are required' },
        { status: 400 }
      );
    }

    // Validate password length
    if (password.length < 6) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Password must be at least 6 characters' },
        { status: 400 }
      );
    }

    // Check if user already exists in database
    const { data: existingUser } = await supabase
      .from('users')
      .select('auth_user_id')
      .eq('email', email)
      .single();

    if (existingUser) {
      return NextResponse.json<ApiResponse>(
        { 
          success: false, 
          error: 'An account with this email already exists. Please sign in instead.'
        },
        { status: 409 }
      );
    }

    // 1. Check if auth user already exists, or create new one
    let authUserId: string;
    
    // First, try to get existing auth user by email
    const { data: existingAuthUsers } = await supabase.auth.admin.listUsers();
    const existingAuthUser = existingAuthUsers?.users?.find(u => u.email === email);

    if (existingAuthUser) {
      // Auth user exists from previous attempt - use it
      authUserId = existingAuthUser.id;
      
      // Update password if provided
      if (password) {
        await supabase.auth.admin.updateUserById(authUserId, {
          password,
          user_metadata: { first_name, last_name }
        });
      }
    } else {
      // Create new Supabase Auth User
      const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { first_name, last_name }
      });

      if (authError) {
        return NextResponse.json<ApiResponse>(
          { success: false, error: authError.message },
          { status: 400 }
        );
      }

      authUserId = authUser.user.id;
    }

    // 2. Create user in public table
    const { data: newUser, error: createError } = await supabase
      .from('users')
      .insert({
        auth_user_id: authUserId,
        first_name, 
        last_name, 
        email,
        profile_image: profile_image || ''
      })
      .select('auth_user_id, first_name, last_name, email, profile_image, created_at')
      .single();

    if (createError) {
      // Rollback auth user creation if public profile fails
      await supabase.auth.admin.deleteUser(authUserId);
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Failed to create user: ' + createError.message },
        { status: 500 }
      );
    }

    // 3. Create session for the new user
    const response = NextResponse.json<ApiResponse>(
      {
        success: true,
        message: 'Account created successfully',
        data: {
          user: newUser
        }
      },
      { status: 201 }
    );

    // Set session cookie
    response.cookies.set('morx_session', JSON.stringify({
      auth_user_id: newUser.auth_user_id,
      first_name: newUser.first_name,
      last_name: newUser.last_name,
      email: newUser.email,
      profile_image: newUser.profile_image,
      created_at: newUser.created_at,
      isLoggedIn: true,
    }), {
      path: '/',
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 1 week
    });

    return response;
  } catch (error) {
    console.error('Complete signup error:', error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
