import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/middleware/auth';
import { supabaseAdmin as supabase } from '@/lib/supabase';
import { ApiResponse } from '@/lib/types';

export const dynamic = 'force-dynamic';

/**
 * Get all teams for the authenticated user
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const publicOnly = searchParams.get('public') === 'true';

    // If requesting public teams, no auth needed
    if (publicOnly) {
      const { data: publicTeams, error: publicError } = await supabase
        .from('teams')
        .select('team_id, team_name, team_url, created_at, created_by, is_public, description, team_type, purpose, subject, tags, required_skills')
        .eq('is_public', true)
        .order('created_at', { ascending: false });

      if (publicError) {
        console.error('Supabase public teams error:', publicError);
        throw publicError;
      }

      if (!publicTeams || publicTeams.length === 0) {
        return NextResponse.json<ApiResponse>({
          success: true,
          data: [],
        });
      }

      // Get creator names for public teams
      const creatorIds = [...new Set(publicTeams.map((t: any) => t.created_by))];
      const { data: creators } = await supabase
        .from('users')
        .select('auth_user_id, first_name, last_name, profile_image')
        .in('auth_user_id', creatorIds);

      const creatorMap: Record<string, { name: string; image: string }> = {};
      creators?.forEach((c: any) => {
        creatorMap[c.auth_user_id] = {
          name: `${c.first_name || ''}${c.last_name ? ' ' + c.last_name : ''}`.trim() || 'Unknown',
          image: c.profile_image || ''
        };
      });

      // Get member counts
      const { data: memberCounts } = await supabase
        .from('team_members')
        .select('team_id')
        .in('team_id', publicTeams?.map((t: any) => t.team_id) || []);

      const memberCountMap: Record<string, number> = {};
      memberCounts?.forEach((m: any) => {
        memberCountMap[m.team_id] = (memberCountMap[m.team_id] || 0) + 1;
      });

      // Get project counts
      const { data: projectCounts } = await supabase
        .from('projects')
        .select('team_id')
        .in('team_id', publicTeams?.map((t: any) => t.team_id) || []);

      const projectCountMap: Record<string, number> = {};
      projectCounts?.forEach((p: any) => {
        projectCountMap[p.team_id] = (projectCountMap[p.team_id] || 0) + 1;
      });

      const teamsWithDetails = publicTeams?.map((team: any) => ({
        ...team,
        creator_name: creatorMap[team.created_by]?.name || 'Unknown',
        creator_image: creatorMap[team.created_by]?.image || '',
        member_count: memberCountMap[team.team_id] || 0,
        project_count: projectCountMap[team.team_id] || 0,
      })) || [];

      return NextResponse.json<ApiResponse>({
        success: true,
        data: teamsWithDetails,
      });
    }

    // For authenticated user's teams
    const user = await requireAuth(request);
    if (user instanceof NextResponse) return user;

    const authUserId = user.id;

    // Get all team memberships for the user
    const { data: memberships, error: membershipError } = await supabase
      .from('team_members')
      .select('team_id, role, auth_user_id')
      .eq('auth_user_id', authUserId);

    if (membershipError) {
      console.error('Supabase membership error:', membershipError);
      throw membershipError;
    }

    if (!memberships || memberships.length === 0) {
      return NextResponse.json<ApiResponse>({
        success: true,
        data: [],
      });
    }

    const teamIds = memberships.map((m: any) => m.team_id);

    // Get team details
    const { data: teams, error: teamsError } = await supabase
      .from('teams')
      .select('team_id, team_name, team_url, created_at, created_by, is_public, description, team_type, purpose, subject, tags')
      .in('team_id', teamIds);

    if (teamsError) {
      console.error('[Teams API] Supabase teams error:', teamsError);
      throw teamsError;
    }


    const creatorIds = [...new Set(teams?.map((t: any) => t.created_by) || [])];
    const { data: creators } = await supabase
      .from('users')
      .select('auth_user_id, first_name, last_name, profile_image')
      .in('auth_user_id', creatorIds);

    const creatorMap: Record<string, { name: string; image: string }> = {};
    creators?.forEach((c: any) => {
      creatorMap[c.auth_user_id] = {
        name: `${c.first_name || ''}${c.last_name ? ' ' + c.last_name : ''}`.trim() || 'Unknown',
        image: c.profile_image || ''
      };
    });

    // Get member counts for each team
    const { data: allMemberCounts } = await supabase
      .from('team_members')
      .select('team_id')
      .in('team_id', teamIds);

    const memberCountMap: Record<string, number> = {};
    allMemberCounts?.forEach((m: any) => {
      memberCountMap[m.team_id] = (memberCountMap[m.team_id] || 0) + 1;
    });

    // Create role map
    const roleMap: Record<string, string> = {};
    memberships.forEach((m: any) => {
      roleMap[m.team_id] = m.role;
    });

    // Get project counts for each team
    const { data: projectCounts } = await supabase
      .from('projects')
      .select('team_id')
      .in('team_id', teamIds);

    const projectCountMap: Record<string, number> = {};
    projectCounts?.forEach((p: any) => {
      projectCountMap[p.team_id] = (projectCountMap[p.team_id] || 0) + 1;
    });

    // Combine all data
    const teamsWithDetails = teams?.map((team: any) => ({
      ...team,
      role: roleMap[team.team_id] || 'member',
      creator_name: creatorMap[team.created_by]?.name || 'Unknown',
      creator_image: creatorMap[team.created_by]?.image || '',
      member_count: memberCountMap[team.team_id] || 0,
      project_count: projectCountMap[team.team_id] || 0,
      auth_user_id: team.created_by // Keep auth_user_id for frontend compat if needed
    })) || [];

    return NextResponse.json<ApiResponse>({
      success: true,
      data: teamsWithDetails,
    });
  } catch (error) {
    console.error('Get teams error:', error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Create a new team
 */
export async function POST(request: NextRequest) {
  const user = await requireAuth(request);
  if (user instanceof NextResponse) return user;

  try {
    const body = await request.json();
    const { team_name, team_url, description, team_type, purpose, subject, tags, is_public } = body;
    const authUserId = user.id;

    if (!team_name) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'team_name is required' },
        { status: 400 }
      );
    }

    // Check team limit (max 5 teams per user)
    const TEAM_LIMIT = 5;
    const { count: currentTeamCount } = await supabase
      .from('team_members')
      .select('*', { count: 'exact', head: true })
      .eq('auth_user_id', authUserId)
      .eq('role', 'owner');

    if (currentTeamCount && currentTeamCount >= TEAM_LIMIT) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: `You can create a maximum of ${TEAM_LIMIT} teams` },
        { status: 400 }
      );
    }

    // Generate team URL if not provided
    const generateRandomString = (length: number) => {
      const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
      let result = '';
      for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      return result;
    };

    const finalTeamUrl = team_url || generateRandomString(16);

    // Check if team URL already exists
    const { data: existingTeam } = await supabase
      .from('teams')
      .select('team_id')
      .eq('team_url', finalTeamUrl)
      .single();

    if (existingTeam) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Team URL already exists' },
        { status: 400 }
      );
    }

    // Create team
    const { data: newTeam, error: createError } = await supabase
      .from('teams')
      .insert({
        team_name,
        team_url: finalTeamUrl,
        created_by: authUserId,
        description: description || '',
        team_type: team_type || 'other',
        purpose: purpose || '',
        subject: subject || '',
        tags: tags || [],
        is_public: is_public || false,
      })
      .select()
      .single();

    if (createError) throw createError;

    // Add creator as owner
    await supabase.from('team_members').insert({
      auth_user_id: authUserId,
      team_id: newTeam.team_id,
      role: 'owner'
    });

    return NextResponse.json<ApiResponse>(
      {
        success: true,
        message: 'Team created successfully',
        data: newTeam,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Create team error:', error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
