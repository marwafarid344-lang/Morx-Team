import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/';

  if (code) {
    const supabase = createClient();
    const { data: { session }, error } = await supabase.auth.exchangeCodeForSession(code);
    
    if (error) {
      return NextResponse.redirect(`${origin}/signin?error=session_exchange_failed`);
    }

    if (!session?.user) {
      return NextResponse.redirect(`${origin}/signin?error=no_session`);
    }
    
    // Check if user exists in our public users table
    const { data: dbUser, error: dbError } = await supabase
      .from('users')
      .select('*')
      .eq('email', session.user.email)
      .single();

    if (dbError && dbError.code !== 'PGRST116') {
      // PGRST116 is "not found" - that's okay for new users
      return NextResponse.redirect(`${origin}/signin?error=database_error`);
    }

    if (!dbUser) {
      // New user - redirect to complete profile
      const tempSession = {
        isTemporary: true,
        auth_user_id: session.user.id,
        email: session.user.email,
        tempFirstName: session.user.user_metadata?.full_name?.split(' ')[0] || '',
        tempLastName: session.user.user_metadata?.full_name?.split(' ').slice(1).join(' ') || '',
        profileImage: session.user.user_metadata?.avatar_url || '',
      };

      const response = NextResponse.redirect(`${origin}/complete-profile`);
      response.cookies.set('morx_temp_session', JSON.stringify(tempSession), {
        path: '/',
        maxAge: 3600, // 1 hour
      });
      
      return response;
    }
    
    // Existing user - set session cookie and redirect
    const response = NextResponse.redirect(`${origin}${next}`);
    response.cookies.set('morx_session', JSON.stringify({
      user_id: dbUser.user_id,
      first_name: dbUser.first_name,
      last_name: dbUser.last_name,
      email: dbUser.email,
      profile_image: dbUser.profile_image,
      study_level: dbUser.study_level,
      department: dbUser.department,
      faculty: dbUser.faculty,
      bio: dbUser.bio,
      skills: dbUser.skills,
      is_available: dbUser.is_available,
      created_at: dbUser.created_at,
      isLoggedIn: true,
    }), {
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 1 week
      httpOnly: false,
      secure: false, // Set to false to avoid local dev issues
      sameSite: 'lax',
    });
    
    return response;
  }

  // No code parameter
  return NextResponse.redirect(`${origin}/signin?error=no_auth_code`);
}
