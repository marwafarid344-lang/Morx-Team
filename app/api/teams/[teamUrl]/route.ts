import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/middleware/auth';
import { supabaseAdmin as supabase } from '@/lib/supabase';
import { ApiResponse } from '@/lib/types';

export const dynamic = 'force-dynamic';

/**
 * Get team details by URL
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { teamUrl: string } }
) {
  const user = await requireAuth(request);
  if (user instanceof NextResponse) return user;

  try {
    const authUserId = user.id;
    const { teamUrl } = params;

    // Get team
    const { data: team, error: teamError } = await supabase
      .from('teams')
      .select('*, required_skills')
      .eq('team_url', teamUrl)
      .single();

    if (teamError || !team) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Team not found' },
        { status: 404 }
      );
    }

    // Check if user is a member
    const { data: membership } = await supabase
      .from('team_members')
      .select('role')
      .eq('team_id', team.team_id)
      .eq('auth_user_id', authUserId)
      .single();

    if (!membership) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Access denied - not a team member' },
        { status: 403 }
      );
    }

    // Get owner info
    const { data: owner } = await supabase
      .from('users')
      .select('auth_user_id, first_name, last_name, email')
      .eq('auth_user_id', team.created_by)
      .single();

    // Get member count
    const { count: memberCount } = await supabase
      .from('team_members')
      .select('*', { count: 'exact', head: true })
      .eq('team_id', team.team_id);

    return NextResponse.json<ApiResponse>({
      success: true,
      data: {
        ...team,
        role: membership.role,
        owner: owner ? {
          auth_user_id: owner.auth_user_id,
          first_name: owner.first_name,
          last_name: owner.last_name,
          email: owner.email,
        } : null,
        member_count: memberCount || 0,
      },
    });
  } catch (error) {
    console.error('Get team error:', error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Update team details (owner/admin only)
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { teamUrl: string } }
) {
  const user = await requireAuth(request);
  if (user instanceof NextResponse) return user;

  try {
    const body = await request.json();
    const { team_name, description, is_public, team_type, purpose, subject, tags, required_skills } = body;
    const authUserId = user.id;
    const { teamUrl } = params;

    console.log(`[Teams API PUT] Updating team ${teamUrl}`, { 
      authUserId, 
      payload: { team_name, description, is_public, team_type, purpose, subject, tags, required_skills } 
    });

    // Get team
    const { data: team, error: teamFetchError } = await supabase
      .from('teams')
      .select('team_id')
      .eq('team_url', teamUrl)
      .single();

    if (teamFetchError || !team) {
      console.error('[Teams API PUT] Team not found:', teamUrl, teamFetchError);
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Team not found' },
        { status: 404 }
      );
    }

    // Check permissions
    const { data: membership } = await supabase
      .from('team_members')
      .select('role')
      .eq('team_id', team.team_id)
      .eq('auth_user_id', authUserId)
      .single();

    if (!membership || (membership.role !== 'owner' && membership.role !== 'admin')) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Only owners and admins can update team settings' },
        { status: 403 }
      );
    }

    // Build update object
    const updates: Record<string, any> = {};
    if (team_name !== undefined) updates.team_name = team_name;
    if (description !== undefined) updates.description = description;
    // Allow both description and team_description for flexibility
    if (body.team_description !== undefined) updates.description = body.team_description; 
    
    if (is_public !== undefined) updates.is_public = is_public;
    if (team_type !== undefined) updates.team_type = team_type;
    if (purpose !== undefined) updates.purpose = purpose || '';
    
    // Subject, tags can only be updated by owner
    if (subject !== undefined && membership.role === 'owner') {
      updates.subject = subject || '';
    }
    if (tags !== undefined && membership.role === 'owner') {
      updates.tags = tags || [];
    }
    
    if (required_skills !== undefined) updates.required_skills = required_skills || [];

    if (Object.keys(updates).length === 0) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'No fields to update' },
        { status: 400 }
      );
    }

    const { data: updatedTeam, error: updateError } = await supabase
      .from('teams')
      .update(updates)
      .eq('team_id', team.team_id)
      .select()
      .single();

    if (updateError) {
      console.error('[Teams API PUT] Supabase update error:', updateError);
      throw updateError;
    }

    console.log('[Teams API PUT] Team updated successfully');

    return NextResponse.json<ApiResponse>({
      success: true,
      message: 'Team updated successfully',
      data: updatedTeam,
    });
  } catch (error: any) {
    console.error('Update team error:', error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Delete team (owner only)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { teamUrl: string } }
) {
  const user = await requireAuth(request);
  if (user instanceof NextResponse) return user;

  try {
    const authUserId = user.id;
    const { teamUrl } = params;

    // Get team
    const { data: team } = await supabase
      .from('teams')
      .select('team_id, created_by')
      .eq('team_url', teamUrl)
      .single();

    if (!team) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Team not found' },
        { status: 404 }
      );
    }

    // Check if user is owner
    const { data: membership } = await supabase
      .from('team_members')
      .select('role')
      .eq('team_id', team.team_id)
      .eq('auth_user_id', authUserId)
      .single();

    if (!membership || membership.role !== 'owner') {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Only the team owner can delete the team' },
        { status: 403 }
      );
    }

    // Delete team (cascade will handle members, projects, etc.)
    const { error: deleteError } = await supabase
      .from('teams')
      .delete()
      .eq('team_id', team.team_id);

    if (deleteError) throw deleteError;

    return NextResponse.json<ApiResponse>({
      success: true,
      message: 'Team deleted successfully',
    });
  } catch (error) {
    console.error('Delete team error:', error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
