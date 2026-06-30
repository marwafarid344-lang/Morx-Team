import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin as supabase } from '@/lib/supabase';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { ApiResponse } from '@/lib/types';

/**
 * Reset password for a user
 * Note: auth_user_id is the primary identifier (UUID)
 */
export async function POST(request: NextRequest) {
  try {
    const { auth_user_id, new_password } = await request.json();

    if (!auth_user_id || !new_password) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'auth_user_id and new_password are required' },
        { status: 400 }
      );
    }

    if (new_password.length < 6) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Password must be at least 6 characters' },
        { status: 400 }
      );
    }

    // Hash the new password (SHA-256 + bcrypt)
    const saltRounds = 10;
    const sha256Hash = crypto.createHash('sha256').update(new_password).digest('hex');
    const hashedPassword = await bcrypt.hash(sha256Hash, saltRounds);

    // Update password in database using auth_user_id (UUID)
    const { data, error } = await supabase
      .from('users')
      .update({ password: hashedPassword })
      .eq('auth_user_id', auth_user_id)
      .select('auth_user_id');

    if (error) {
      // console.error('Database error:', error);
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Failed to update password' },
        { status: 500 }
      );
    }

    if (!data || data.length === 0) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json<ApiResponse>({
      success: true,
      message: 'Password reset successfully'
    });

  } catch (error) {
    // console.error('Reset password error:', error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
