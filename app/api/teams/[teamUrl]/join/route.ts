import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/middleware/auth';
import { supabaseAdmin as supabase } from '@/lib/supabase';
import { ApiResponse } from '@/lib/types';

/**
 * Check team join status (GET)
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
    const { data: team } = await supabase
      .from('teams')
      .select('team_id, team_name, is_public')
      .eq('team_url', teamUrl)
      .single();

    if (!team) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Team not found' },
        { status: 404 }
      );
    }

    // Check if already a member
    const { data: membership } = await supabase
      .from('team_members')
      .select('role')
      .eq('team_id', team.team_id)
      .eq('auth_user_id', authUserId)
      .single();

    if (membership) {
      return NextResponse.json<ApiResponse>({
        success: true,
        data: {
          status: 'member',
          role: membership.role,
          team_name: team.team_name,
          is_public: team.is_public,
        },
      });
    }

    // Check for pending join request
    const { data: pendingRequest } = await supabase
      .from('team_join_requests')
      .select('request_id, status')
      .eq('team_id', team.team_id)
      .eq('auth_user_id', authUserId)
      .eq('status', 'pending')
      .single();

    if (pendingRequest) {
      return NextResponse.json<ApiResponse>({
        success: true,
        data: {
          status: 'pending',
          request_id: pendingRequest.request_id,
          team_name: team.team_name,
          is_public: team.is_public,
        },
      });
    }

    return NextResponse.json<ApiResponse>({
      success: true,
      data: {
        status: 'not_member',
        is_public: team.is_public,
        team_name: team.team_name,
      },
    });
  } catch (error) {
    console.error('Check team join status error:', error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Join team or request to join (POST)
 */
export async function POST(
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
      .select('team_id, team_name, is_public')
      .eq('team_url', teamUrl)
      .single();

    if (!team) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Team not found' },
        { status: 404 }
      );
    }

    // Check if already a member
    const { data: existingMember } = await supabase
      .from('team_members')
      .select('auth_user_id')
      .eq('team_id', team.team_id)
      .eq('auth_user_id', authUserId)
      .single();

    if (existingMember) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Already a team member' },
        { status: 400 }
      );
    }

    // Check for existing pending request
    const { data: existingRequest } = await supabase
      .from('team_join_requests')
      .select('request_id')
      .eq('team_id', team.team_id)
      .eq('auth_user_id', authUserId)
      .eq('status', 'pending')
      .single();

    if (existingRequest) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'You already have a pending request to join this team' },
        { status: 400 }
      );
    }

    // Create join request (Required for all teams)
    const { data: newRequest, error: requestError } = await supabase
      .from('team_join_requests')
      .insert({
        auth_user_id: authUserId,
        team_id: team.team_id,
        status: 'pending'
      })
      .select()
      .single();

    if (requestError) throw requestError;

    // Notify Team Owners and Admins
    try {
      // Get admins and owners
      const { data: teamAdmins } = await supabase
        .from('team_members')
        .select('auth_user_id')
        .eq('team_id', team.team_id)
        .in('role', ['owner', 'admin']);

      // Get requester details for the message
      const { data: requester } = await supabase
        .from('users')
        .select('first_name, last_name')
        .eq('auth_user_id', authUserId)
        .single();

      if (teamAdmins && teamAdmins.length > 0) {
        const requesterName = requester 
          ? `${requester.first_name} ${requester.last_name || ''}`.trim() 
          : 'A user';

        const notifications = teamAdmins.map(admin => ({
          auth_user_id: admin.auth_user_id,
          title: 'New Join Request',
          message: `${requesterName} requested to join ${team.team_name}`,
          type: 'team_join_request',
          related_id: newRequest.request_id, // identifying the request
          is_read: false
        }));

        await supabase.from('notifications').insert(notifications);
      }
    } catch (notifyError) {
      // Don't block the response if notification fails, just log it
      console.error('Failed to notify team admins of join request:', notifyError);
    }

    return NextResponse.json<ApiResponse>({
      success: true,
      message: 'Join request submitted',
      data: {
        status: 'pending',
        request_id: newRequest.request_id,
      },
    });
  } catch (error) {
    console.error('Join team error:', error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Cancel join request (DELETE)
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
      .select('team_id')
      .eq('team_url', teamUrl)
      .single();

    if (!team) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Team not found' },
        { status: 404 }
      );
    }

    // Delete pending request
    await supabase
      .from('team_join_requests')
      .delete()
      .eq('team_id', team.team_id)
      .eq('auth_user_id', authUserId)
      .eq('status', 'pending');

    return NextResponse.json<ApiResponse>({
      success: true,
      message: 'Join request cancelled',
    });
  } catch (error) {
    console.error('Cancel join request error:', error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
