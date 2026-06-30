import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin as supabase } from '@/lib/supabase';
import { ApiResponse } from '@/lib/types';

/**
 * Handle user registration
 */
export async function POST(request: NextRequest) {
  try {
    const body: any = await request.json();
    const { first_name, last_name, email, password, study_level, department, faculty, bio } = body;

    // Validate input
    if (!email || !password || !first_name || !last_name) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'All fields are required' },
        { status: 400 }
      );
    }

    // Check if user already exists
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

    // 1. Create Supabase Auth User
    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { first_name, last_name }
    });

    if (authError) {
      // console.error('[Signup] Auth creation error:', authError);
      return NextResponse.json<ApiResponse>(
        { success: false, error: authError.message },
        { status: 400 }
      );
    }

    // 2. Create user in public table - auth_user_id is the Primary Key
    const { data: newUser, error: createError } = await supabase
      .from('users')
      .insert({
        auth_user_id: authUser.user.id, // Direct use of Supabase Auth UUID
        first_name, 
        last_name, 
        email,
        study_level,
        department,
        faculty,
        bio
      })
      .select('auth_user_id, first_name, last_name, email, study_level, department, created_at')
      .single();

    if (createError) {
      // console.error('[Signup] Public user creation error:', createError);
      // Rollback auth user creation if public profile fails
      await supabase.auth.admin.deleteUser(authUser.user.id);
      throw createError;
    }

    return NextResponse.json<ApiResponse>(
      {
        success: true,
        message: 'Account created successfully',
        data: newUser
      },
      { status: 201 }
    );
  } catch (error) {
    // console.error('Signup error:', error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
