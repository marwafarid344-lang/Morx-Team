import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/middleware/auth';
import { supabaseAdmin as supabase } from '@/lib/supabase';
import { ApiResponse } from '@/lib/types';

/**
 * Send a team invitation to a user
 */
export async function POST(request: NextRequest) {
  const user = await requireAuth(request);
  if (user instanceof NextResponse) return user;

  try {
    const { team_id, target_auth_user_id, message } = await request.json();
    const inviterAuthUserId = user.id;

    console.log('[Invite API] Received:', { team_id, target_auth_user_id, message });

    if (!team_id || !target_auth_user_id) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'team_id and target_auth_user_id are required' },
        { status: 400 }
      );
    }

    // 1. Check if inviter is owner/admin of the team
    const { data: membership } = await supabase
      .from('team_members')
      .select('role')
      .eq('team_id', team_id)
      .eq('auth_user_id', inviterAuthUserId)
      .single();

    if (!membership || (membership.role !== 'owner' && membership.role !== 'admin')) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Only team owners and admins can invite members' },
        { status: 403 }
      );
    }

    // 2. Check if user is already in the team
    const { data: targetMembership } = await supabase
      .from('team_members')
      .select('auth_user_id')
      .eq('team_id', team_id)
      .eq('auth_user_id', target_auth_user_id)
      .single();

    if (targetMembership) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'User is already a member of this team' },
        { status: 400 }
      );
    }

    // 3. Create invitation
    const { data: invitation, error: inviteError } = await supabase
      .from('team_invitations')
      .insert({
        team_id,
        auth_user_id: target_auth_user_id,
        inviter_id: inviterAuthUserId,
        message: message || '',
        status: 'pending'
      })
      .select()
      .single();

    if (inviteError) {
      if (inviteError.code === '23505') { // Unique violation
        return NextResponse.json<ApiResponse>(
          { success: false, error: 'A pending invitation already exists for this user' },
          { status: 400 }
        );
      }
      throw inviteError;
    }

    // 4. Create notification for the user
    const { data: team } = await supabase
      .from('teams')
      .select('team_name')
      .eq('team_id', team_id)
      .single();
    
    await supabase.from('notifications').insert({
      auth_user_id: target_auth_user_id,
      title: '📩 New Team Invitation',
      message: `You have been invited to join team "${team?.team_name || 'unknown'}". Check your invitations to respond.`,
      type: 'team_invitation',
      is_read: false
    });

    return NextResponse.json<ApiResponse>({
      success: true,
      message: 'Invitation sent successfully',
      data: invitation,
    });
  } catch (error) {
    console.error('Invite talent error:', error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
