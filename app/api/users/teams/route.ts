import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/middleware/auth';
import { supabaseAdmin as supabase } from '@/lib/supabase';
import { ApiResponse } from '@/lib/types';

/**
 * Get teams for the authenticated user
 */
export async function GET(request: NextRequest) {
  const user = await requireAuth(request);
  if (user instanceof NextResponse) return user;

  try {
    const authUserId = user.id;

    // Get user's team memberships
    const { data: memberships, error: memberError } = await supabase
      .from('team_members')
      .select('team_id, role, joined_at')
      .eq('auth_user_id', authUserId);

    if (memberError) throw memberError;

    const teamIds = memberships?.map((m: any) => m.team_id) || [];

    if (teamIds.length === 0) {
      return NextResponse.json<ApiResponse>({
        success: true,
        data: [],
      });
    }

    // Get team details
    const { data: teams, error: teamsError } = await supabase
      .from('teams')
      .select('team_id, team_name, team_url, created_at')
      .in('team_id', teamIds)
      .order('created_at', { ascending: false });

    if (teamsError) throw teamsError;

    // Combine with membership data
    const teamsWithRoles = teams?.map((team: any) => {
      const membership = memberships?.find((m: any) => m.team_id === team.team_id);
      return {
        ...team,
        role: membership?.role || 'member',
        joined_at: membership?.joined_at
      };
    }) || [];

    return NextResponse.json<ApiResponse>({
      success: true,
      data: teamsWithRoles,
    });
  } catch (error) {
    console.error('Get user teams error:', error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
