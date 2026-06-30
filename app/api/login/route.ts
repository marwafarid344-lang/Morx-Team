import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { supabaseAdmin as supabase } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Find user by email - MUST use auth_user_id
    const { data: userData, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    if (error || !userData) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    if (!userData.password) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Check if user has auth_user_id (required for new auth system)
    if (!userData.auth_user_id) {
       return NextResponse.json(
        { error: 'Account needs migration. Please use Google Sign-In or contact support.' },
        { status: 401 }
      );
    }

    // Verify password (SHA-256 + bcrypt)
    const sha256Hash = crypto.createHash('sha256').update(password).digest('hex');
    const isPasswordValid = await bcrypt.compare(sha256Hash, userData.password);

    if (!isPasswordValid) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Return user data with auth_user_id (UUID) - REMOVED numeric user_id
    const sessionData = {
      auth_user_id: userData.auth_user_id,  // UUID - the only PK
      first_name: userData.first_name,
      last_name: userData.last_name,
      email: userData.email,
      profile_image: userData.profile_image,
      study_level: userData.study_level,
      department: userData.department,
      faculty: userData.faculty,
      bio: userData.bio,
      skills: userData.skills,
      is_available: userData.is_available,
      searching_teams_subjects: userData.searching_teams_subjects,
      links: userData.links,
      created_at: userData.created_at,
      isLoggedIn: true,
    };


    const response = NextResponse.json({ user: sessionData });
    
    // Set a persistent cookie for the session
    response.cookies.set('morx_session', JSON.stringify(sessionData), {
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 1 week
      httpOnly: false, // Accessible by client-side sync
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
    });

    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'An error occurred during login' },
      { status: 500 }
    );
  }
}
