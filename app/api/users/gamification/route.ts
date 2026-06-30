import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/middleware/auth';
import { supabaseAdmin as supabase } from '@/lib/supabase';
import { ApiResponse } from '@/lib/types';

export async function GET(request: NextRequest) {
  const user = await requireAuth(request);
  if (user instanceof NextResponse) return user;

  try {
    const { searchParams } = new URL(request.url);
    const targetUserId = searchParams.get('user_id') || user.id;

    // 1. Fetch user gamification profile
    let { data: stats, error: statsError } = await supabase
      .from('user_gamification')
      .select('*')
      .eq('auth_user_id', targetUserId)
      .single();

    // If no stats, initialize them
    if (statsError && statsError.code === 'PGRST116') {
      const defaultStats = {
        auth_user_id: targetUserId,
        xp: 120,
        level: 1,
        streak_count: 2,
        last_activity_date: new Date().toISOString().split('T')[0],
        contribution_score: 45.50,
        updated_at: new Date().toISOString()
      };
      await supabase.from('user_gamification').insert(defaultStats);
      stats = defaultStats;
    } else if (statsError) {
      throw statsError;
    }

    // 2. Fetch badges
    let { data: badges } = await supabase
      .from('user_badges')
      .select('*')
      .eq('auth_user_id', targetUserId);

    if (!badges || badges.length === 0) {
      // Seed default badge
      const seedBadge = {
        user_badge_id: '00000000-0000-0000-0000-000000000001',
        auth_user_id: targetUserId,
        badge_name: 'Code Pioneer',
        badge_type: 'rare',
        awarded_at: new Date().toISOString()
      };
      await supabase.from('user_badges').insert(seedBadge);
      badges = [seedBadge];
    }

    // 3. Fetch leaderboard (Top 10 users sorted by XP)
    const { data: leaderboardUsers, error: leaderError } = await supabase
      .from('user_gamification')
      .select('auth_user_id, xp, level, contribution_score')
      .order('xp', { ascending: false })
      .limit(10);

    if (leaderError) throw leaderError;

    // Get user details for leaderboard
    const leaderIds = leaderboardUsers?.map((l: any) => l.auth_user_id) || [];
    let leaderboard: any[] = [];

    if (leaderIds.length > 0) {
      const { data: usersDetails } = await supabase
        .from('users')
        .select('auth_user_id, first_name, last_name, profile_image')
        .in('auth_user_id', leaderIds);

      const detailsMap: Record<string, any> = {};
      usersDetails?.forEach((u: any) => {
        detailsMap[u.auth_user_id] = u;
      });

      leaderboard = leaderboardUsers.map((l: any, index: number) => {
        const details = detailsMap[l.auth_user_id] || {};
        return {
          rank: index + 1,
          auth_user_id: l.auth_user_id,
          first_name: details.first_name || 'Anonymous',
          last_name: details.last_name || 'User',
          profile_image: details.profile_image,
          xp: l.xp,
          level: l.level,
          contribution_score: l.contribution_score
        };
      });
    }

    return NextResponse.json<ApiResponse>({
      success: true,
      data: {
        stats,
        badges,
        leaderboard
      }
    });

  } catch (error: any) {
    console.error('Gamification error:', error);
    return NextResponse.json<ApiResponse>({ success: false, error: error.message || 'Internal server error' }, { status: 500 });
  }
}
