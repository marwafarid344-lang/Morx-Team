import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin as supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');

    if (!code) {
      return NextResponse.redirect(`${request.nextUrl.origin}/signin?error=no_code`);
    }

    // Exchange code for tokens
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID || '',
        client_secret: process.env.GOOGLE_CLIENT_SECRET || '',
        redirect_uri: `${request.nextUrl.origin}/api/auth/google/callback`,
        grant_type: 'authorization_code',
      }),
    });

    const tokens = await tokenResponse.json();

    if (!tokens.access_token) {
      return NextResponse.redirect(`${request.nextUrl.origin}/signin?error=token_failed`);
    }

    // Get user info from Google
    const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });

    const googleUser = await userInfoResponse.json();

    // Check if user exists in database
    const { data: existingUser } = await supabase
      .from('users')
      .select('*')
      .eq('email', googleUser.email)
      .single();

    if (existingUser) {
      // Existing user - create session and redirect
      const sessionData = {
        auth_user_id: existingUser.auth_user_id, // Use UUID
        first_name: existingUser.first_name,
        last_name: existingUser.last_name,
        email: existingUser.email,
        profile_image: existingUser.profile_image || '',
        study_level: existingUser.study_level,
        department: existingUser.department,
        faculty: existingUser.faculty,
        bio: existingUser.bio,
        skills: existingUser.skills,
        is_available: existingUser.is_available,
        searching_teams_subjects: existingUser.searching_teams_subjects,
        links: existingUser.links,
        created_at: existingUser.created_at,
        isLoggedIn: true
      };

      // Redirect to a page that will set localStorage and redirect
      const sessionParam = encodeURIComponent(JSON.stringify(sessionData));
      return NextResponse.redirect(`${request.nextUrl.origin}/auth/complete-login?session=${sessionParam}`);
    } else {
      // New user - redirect to complete signup
      const names = (googleUser.name || '').split(' ');
      const firstName = names[0] || '';
      const lastName = names.slice(1).join(' ') || '';

      const tempUserData = {
        first_name: firstName,
        last_name: lastName,
        email: googleUser.email,
        profile_image: googleUser.picture || '',
        oauth_provider: 'google'
      };

      const tempDataParam = encodeURIComponent(JSON.stringify(tempUserData));
      return NextResponse.redirect(`${request.nextUrl.origin}/auth/complete-signup?data=${tempDataParam}`);
    }
  } catch (error) {
    // console.error('Google OAuth callback error:', error);
    return NextResponse.redirect(`${request.nextUrl.origin}/signin?error=callback_error`);
  }
}
