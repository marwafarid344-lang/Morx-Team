import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/middleware/auth';
import { supabaseAdmin as supabase } from '@/lib/supabase';
import { ApiResponse } from '@/lib/types';
import { getPlanLimit } from '@/lib/constants/plans';
import { PlanType } from '@/lib/types';

/**
 * Get user's usage stats: teams created, projects, member counts per team
 * Uses authenticated user's ID from session
 */
export async function GET(request: NextRequest) {
  const user = await requireAuth(request);
  if (user instanceof NextResponse) return user;

  try {
    const authUserId = user.id;

    // Get user's plan to determine member limits
    const { data: userData } = await supabase
      .from('users')
      .select('plan')
      .eq('auth_user_id', authUserId)
      .single();
    
    const userPlan = (userData?.plan || 'free') as PlanType;
    const planLimit = getPlanLimit(userPlan);

    // Get teams where user is owner (teams they created)
    const { data: ownedMemberships, error: teamsError } = await supabase
      .from('team_members')
      .select('team_id')
      .eq('auth_user_id', authUserId)
      .eq('role', 'owner');

    if (teamsError) throw teamsError;

    const teamIds = ownedMemberships?.map(t => t.team_id) || [];
    
    // Get team details and member counts efficiently
    let teamsWithStats: { team_id: number; team_name: string; team_url: string; member_count: number; member_limit: number }[] = [];
    
    if (teamIds.length > 0) {
      // Fetch team names and URLs
      const { data: teams } = await supabase
        .from('teams')
        .select('team_id, team_name, team_url')
        .in('team_id', teamIds);

      // Fetch member counts for all owned teams in one go
      const { data: memberCounts } = await supabase
        .from('team_members')
        .select('team_id')
        .in('team_id', teamIds);

      const countMap: Record<number, number> = {};
      memberCounts?.forEach(m => {
        countMap[m.team_id] = (countMap[m.team_id] || 0) + 1;
      });

      teamsWithStats = (teams || []).map(team => ({
        ...team,
        member_count: countMap[team.team_id] || 0,
        member_limit: planLimit
      }));
    }

    // Get total projects created by user
    const { count: projectsCount } = await supabase
      .from('projects')
      .select('*', { count: 'exact', head: true })
      .eq('auth_user_id', authUserId);

    // Get total tasks created by user
    const { count: tasksCount } = await supabase
      .from('tasks')
      .select('*', { count: 'exact', head: true })
      .eq('auth_user_id', authUserId);

    return NextResponse.json<ApiResponse>({
      success: true,
      data: {
        teams: teamsWithStats,
        total_teams: teamsWithStats.length,
        total_projects: projectsCount || 0,
        total_tasks: tasksCount || 0
      }
    });
  } catch (error) {
    console.error('Get user stats error:', error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
