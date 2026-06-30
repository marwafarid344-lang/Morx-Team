import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/middleware/auth';
import { supabaseAdmin as supabase } from '@/lib/supabase';
import { ApiResponse } from '@/lib/types';
import { canAddMember, getPlanLimit } from '@/lib/constants/plans';

/**
 * Respond to an invitation (Accept/Reject)
 */
export async function PUT(request: NextRequest) {
  const user = await requireAuth(request);
  if (user instanceof NextResponse) return user;

  try {
    const { invitation_id, action } = await request.json();
    const authUserId = user.id;

    if (!invitation_id || !action) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'invitation_id and action are required' },
        { status: 400 }
      );
    }

    // 1. Get invitation and verify ownership
    const { data: invitation, error: fetchError } = await supabase
      .from('team_invitations')
      .select('*')
      .eq('id', invitation_id)
      .eq('auth_user_id', authUserId)
      .single();

    if (fetchError || !invitation) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Invitation not found or unauthorized' },
        { status: 404 }
      );
    }

    if (invitation.status !== 'pending') {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Invitation has already been processed' },
        { status: 400 }
      );
    }

    if (action === 'accepted') {
      // Check member limit based on team owner's plan
      const { data: teamData } = await supabase
        .from('teams')
        .select('created_by')
        .eq('team_id', invitation.team_id)
        .single();

      const { data: ownerData } = await supabase
        .from('users')
        .select('plan')
        .eq('auth_user_id', teamData?.created_by)
        .single();

      const { count: memberCount } = await supabase
        .from('team_members')
        .select('*', { count: 'exact', head: true })
        .eq('team_id', invitation.team_id);

      if (!canAddMember(memberCount || 0, ownerData?.plan)) {
        const limit = getPlanLimit(ownerData?.plan);
        return NextResponse.json<ApiResponse>(
          { success: false, error: `Team has reached the maximum of ${limit} members for the ${ownerData?.plan || 'free'} plan.` },
          { status: 403 }
        );
      }

      // 2. Add user to team_members
      const { error: joinError } = await supabase
        .from('team_members')
        .insert({
          team_id: invitation.team_id,
          auth_user_id: authUserId,
          role: 'member'
        });

      if (joinError) throw joinError;

      // 3. Update invitation status
      await supabase
        .from('team_invitations')
        .update({ status: 'accepted' })
        .eq('id', invitation_id);

      // 4. Notify inviter
      const { data: userInfo } = await supabase
        .from('users')
        .select('first_name, last_name')
        .eq('auth_user_id', authUserId)
        .single();

      const { data: team } = await supabase
        .from('teams')
        .select('team_name')
        .eq('team_id', invitation.team_id)
        .single();

      await supabase.from('notifications').insert({
        auth_user_id: invitation.inviter_id,
        title: '✅ Invitation Accepted',
        message: `${userInfo?.first_name} ${userInfo?.last_name || ''} has joined ${team?.team_name}.`,
        type: 'team_added',
        is_read: false
      });

      return NextResponse.json<ApiResponse>({
        success: true,
        message: 'Successfully joined the team',
      });
    } else {
      // Update invitation status to rejected
      await supabase
        .from('team_invitations')
        .update({ status: 'rejected' })
        .eq('id', invitation_id);

      return NextResponse.json<ApiResponse>({
        success: true,
        message: 'Invitation rejected',
      });
    }
  } catch (error) {
    console.error('Respond to invite error:', error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
