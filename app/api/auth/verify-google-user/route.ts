import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { success: false, error: 'Email is required' },
        { status: 400 }
      );
    }

    const sanitizedEmail = email.trim().toLowerCase();
    
    // Check if user exists with this email - Use auth_user_id
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('auth_user_id, email, first_name, last_name, profile_image')
      .ilike('email', sanitizedEmail)
      .limit(1)
      .single();

    if (userError || !userData) {
      return NextResponse.json(
        { success: false, error: 'No account found with this email' },
        { status: 404 }
      );
    }

    // User found - return auth_user_id (UUID)
    return NextResponse.json({
      success: true,
      auth_user_id: userData.auth_user_id, // Use UUID
      email: userData.email,
      message: 'User verified successfully'
    });

  } catch (error) {
    // console.error('Verify Google user error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
