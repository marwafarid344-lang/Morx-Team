import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/middleware/auth';
import { supabaseAdmin as supabase } from '@/lib/supabase';
import { ApiResponse } from '@/lib/types';

// Retry helper for database operations
async function retryQuery<T>(
  queryFn: () => Promise<{ data: T | null; error: any }>,
  maxRetries = 3,
  delayMs = 1000
): Promise<{ data: T | null; error: any }> {
  let lastError;
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      const result = await queryFn();
      if (!result.error) return result;
      lastError = result.error;
      
      // Don't retry on auth errors or not found
      if (result.error.code === 'PGRST116' || result.error.code === '42501') {
        return result;
      }
      
      if (i < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, delayMs * (i + 1)));
      }
    } catch (err) {
      lastError = err;
      if (i < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, delayMs * (i + 1)));
      }
    }
  }
  
  return { data: null, error: lastError };
}

/**
 * Get invitations for the authenticated user
 */
export async function GET(request: NextRequest) {
  const user = await requireAuth(request);
  if (user instanceof NextResponse) return user;

  try {
    const authUserId = user.id;

    // Get invitations for this user with retry
    const { data: invitations, error } = await retryQuery<any[]>(() => 
      supabase
        .from('team_invitations')
        .select(`
          *,
          team:teams(team_id, team_name, team_url, description)
        `)
        .eq('auth_user_id', authUserId)
        .order('created_at', { ascending: false }) as any
    );

    if (error) {
      console.error('Database error fetching invitations:', error);
      throw error;
    }

    // Get inviter info separately to avoid FK hint issues
    const inviterIds = [...new Set(invitations?.map((inv: any) => inv.inviter_id) || [])];
    let invitersMap: Record<string, any> = {};

    if (inviterIds.length > 0) {
      const { data: inviters, error: invitersError } = await retryQuery<any[]>(() =>
        supabase
          .from('users')
          .select('auth_user_id, first_name, last_name, profile_image')
          .in('auth_user_id', inviterIds) as any
      );

      if (invitersError) {
        console.error('Error fetching inviters:', invitersError);
        // Continue without inviter info rather than failing completely
      } else {
        inviters?.forEach((inv: any) => {
          invitersMap[inv.auth_user_id] = inv;
        });
      }
    }

    // Combine data
    const invitationsWithInviter = invitations?.map((inv: any) => ({
      ...inv,
      inviter: invitersMap[inv.inviter_id] || null
    })) || [];

    return NextResponse.json<ApiResponse>({
      success: true,
      data: invitationsWithInviter,
    });
  } catch (error) {
    console.error('Get invitations error:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      details: error instanceof Error ? error.stack : String(error),
      hint: (error as any)?.hint || '',
      code: (error as any)?.code || ''
    });
    
    return NextResponse.json<ApiResponse>(
      { 
        success: false, 
        error: 'Failed to fetch invitations. Please check your connection and try again.' 
      },
      { status: 500 }
    );
  }
}
