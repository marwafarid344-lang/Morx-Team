import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { ApiResponse } from '@/lib/types';

/**
 * Extended user info with both auth UUID and numeric user_id
 */
export interface AuthenticatedUser {
  authId: string;      // Supabase Auth UUID
  userId: number;      // Numeric user_id from users table
  email: string;
  firstName?: string;
  lastName?: string;
}

/**
 * Check if user is authenticated and return both their auth UUID and numeric user_id.
 * This provides backward compatibility with existing database schema that uses numeric user_id.
 * 
 * @returns AuthenticatedUser object or NextResponse with 401 error
 */
export async function requireAuthWithUserId(request: NextRequest): Promise<AuthenticatedUser | NextResponse> {
  try {
    // Get the authorization header
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Unauthorized - No token provided' },
        { status: 401 }
      );
    }

    const token = authHeader.replace('Bearer ', '');

    // Verify the token with Supabase
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);

    if (error || !user) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Unauthorized - Invalid token' },
        { status: 401 }
      );
    }

    // Look up the numeric user_id from the users table
    const { data: userData, error: userError } = await supabaseAdmin
      .from('users')
      .select('user_id, first_name, last_name, email')
      .eq('auth_user_id', user.id)
      .single();

    if (userError || !userData) {
      // User might exist in auth but not in users table, or auth_user_id not set
      // Try looking up by email as fallback
      const { data: userByEmail, error: emailError } = await supabaseAdmin
        .from('users')
        .select('user_id, first_name, last_name, email')
        .eq('email', user.email)
        .single();

      if (emailError || !userByEmail) {
        return NextResponse.json<ApiResponse>(
          { success: false, error: 'User profile not found' },
          { status: 404 }
        );
      }

      // Update auth_user_id for this user (auto-link)
      await supabaseAdmin
        .from('users')
        .update({ auth_user_id: user.id })
        .eq('user_id', userByEmail.user_id);

      return {
        authId: user.id,
        userId: userByEmail.user_id,
        email: userByEmail.email,
        firstName: userByEmail.first_name,
        lastName: userByEmail.last_name,
      };
    }

    return {
      authId: user.id,
      userId: userData.user_id,
      email: userData.email,
      firstName: userData.first_name,
      lastName: userData.last_name,
    };
  } catch (error) {
    console.error('Auth middleware error:', error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Authentication error' },
      { status: 500 }
    );
  }
}
