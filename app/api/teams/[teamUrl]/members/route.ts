import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/middleware/auth';
import { supabaseAdmin as supabase } from '@/lib/supabase';
import { ApiResponse } from '@/lib/types';
import { canAddMember, getPlanLimit } from '@/lib/constants/plans';

export const dynamic = 'force-dynamic';

/**
 * Get team members
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
      .select('team_id')
      .eq('team_url', teamUrl)
      .single();

    if (!team) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Team not found' },
        { status: 404 }
      );
    }

    // Verify user is team member
    const { data: membership } = await supabase
      .from('team_members')
      .select('role')
      .eq('team_id', team.team_id)
      .eq('auth_user_id', authUserId)
      .single();

    if (!membership) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Access denied' },
        { status: 403 }
      );
    }

    // Get all members
    const { data: members, error } = await supabase
      .from('team_members')
      .select('auth_user_id, role, joined_at')
      .eq('team_id', team.team_id);

    if (error) throw error;

    // Get user info for all members
    const memberIds = members?.map((m: any) => m.auth_user_id) || [];
    const { data: users } = await supabase
      .from('users')
      .select('auth_user_id, first_name, last_name, email, profile_image, plan')
      .in('auth_user_id', memberIds);

    const userMap: Record<string, any> = {};
    users?.forEach((u: any) => {
      userMap[u.auth_user_id] = u;
    });

    const membersWithInfo = members?.map((m: any) => ({
      ...m,
      ...userMap[m.auth_user_id],
    })) || [];

    return NextResponse.json<ApiResponse>({
      success: true,
      data: membersWithInfo,
    });
  } catch (error) {
    console.error('Get team members error:', error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Add member to team (owner/admin only)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { teamUrl: string } }
) {
  const user = await requireAuth(request);
  if (user instanceof NextResponse) return user;

  try {
    const body = await request.json();
    const { email, role } = body;
    const authUserId = user.id;
    const { teamUrl } = params;

    if (!email) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'email is required' },
        { status: 400 }
      );
    }

    // Get team
    const { data: team } = await supabase
      .from('teams')
      .select('team_id, team_name')
      .eq('team_url', teamUrl)
      .single();

    if (!team) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Team not found' },
        { status: 404 }
      );
    }

    // Check requester permissions
    const { data: membership } = await supabase
      .from('team_members')
      .select('role')
      .eq('team_id', team.team_id)
      .eq('auth_user_id', authUserId)
      .single();

    if (!membership || (membership.role !== 'owner' && membership.role !== 'admin')) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Only owners and admins can add members' },
        { status: 403 }
      );
    }

    // Find user by email
    const { data: userToAdd } = await supabase
      .from('users')
      .select('auth_user_id, first_name')
      .eq('email', email)
      .single();

    if (!userToAdd) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'User not found with that email' },
        { status: 404 }
      );
    }

    // Check if already a member
    const { data: existingMember } = await supabase
      .from('team_members')
      .select('auth_user_id')
      .eq('team_id', team.team_id)
      .eq('auth_user_id', userToAdd.auth_user_id)
      .single();

    if (existingMember) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'User is already a team member' },
        { status: 400 }
      );
    }

    // Check member limit based on team owner's plan
    const { data: teamWithOwner } = await supabase
      .from('teams')
      .select('created_by')
      .eq('team_id', team.team_id)
      .single();

    const { data: ownerData } = await supabase
      .from('users')
      .select('plan')
      .eq('auth_user_id', teamWithOwner?.created_by)
      .single();

    const { count: memberCount } = await supabase
      .from('team_members')
      .select('*', { count: 'exact', head: true })
      .eq('team_id', team.team_id);

    if (!canAddMember(memberCount || 0, ownerData?.plan)) {
      const limit = getPlanLimit(ownerData?.plan);
      return NextResponse.json<ApiResponse>(
        { success: false, error: `Team has reached the maximum of ${limit} members for the ${ownerData?.plan || 'free'} plan. Upgrade to add more members.` },
        { status: 403 }
      );
    }

    // Add member
    await supabase.from('team_members').insert({
      auth_user_id: userToAdd.auth_user_id,
      team_id: team.team_id,
      role: role || 'member'
    });

    // Notify user
    try {
      const requesterUserInfo = await supabase
        .from('users')
        .select('first_name, last_name')
        .eq('auth_user_id', authUserId)
        .single();
      
      const adminName = requesterUserInfo.data 
        ? `${requesterUserInfo.data.first_name} ${requesterUserInfo.data.last_name || ''}`.trim()
        : 'An administrator';

      await supabase.from('notifications').insert({
        auth_user_id: userToAdd.auth_user_id,
        title: '🎉 Added to Team',
        message: `You have been added to team "${team.team_name}" by ${adminName}.`,
        type: 'team_added',
        is_read: false
      });
    } catch (notifError) {
      console.error('Failed to send notification for direct team addition:', notifError);
    }

    return NextResponse.json<ApiResponse>(
      {
        success: true,
        message: `${userToAdd.first_name} added to team`,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Add team member error:', error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Update member role (owner only)
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { teamUrl: string } }
) {
  const user = await requireAuth(request);
  if (user instanceof NextResponse) return user;

  try {
    const body = await request.json();
    const { auth_user_id: targetUserId, new_role } = body;
    const authUserId = user.id;
    const { teamUrl } = params;

    if (!targetUserId || !new_role) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'auth_user_id and new_role are required' },
        { status: 400 }
      );
    }

    if (!['admin', 'member'].includes(new_role)) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Invalid role' },
        { status: 400 }
      );
    }

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

    // Check requester permissions (Owner only)
    const { data: requesterMembership } = await supabase
      .from('team_members')
      .select('role')
      .eq('team_id', team.team_id)
      .eq('auth_user_id', authUserId)
      .single();

    if (!requesterMembership || requesterMembership.role !== 'owner') {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Only owners can change member roles' },
        { status: 403 }
      );
    }

    // Update member role
    const { error } = await supabase
      .from('team_members')
      .update({ role: new_role })
      .eq('team_id', team.team_id)
      .eq('auth_user_id', targetUserId);

    if (error) throw error;

    return NextResponse.json<ApiResponse>({
      success: true,
      message: 'Member role updated successfully',
    });
  } catch (error) {
    console.error('Update member role error:', error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Remove member from team
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { teamUrl: string } }
) {
  const user = await requireAuth(request);
  if (user instanceof NextResponse) return user;

  try {
    const { searchParams } = new URL(request.url);
    const targetAuthUserId = searchParams.get('target_auth_user_id');
    const authUserId = user.id;
    const { teamUrl } = params;

    if (!targetAuthUserId) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'target_auth_user_id is required' },
        { status: 400 }
      );
    }

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

    // Check requester permissions
    // Allow if owner/admin OR if removing self (leaving team)
    const { data: membership } = await supabase
      .from('team_members')
      .select('role')
      .eq('team_id', team.team_id)
      .eq('auth_user_id', authUserId)
      .single();

    const isSelfRemoval = authUserId === targetAuthUserId;

    if (!membership && !isSelfRemoval) {
       return NextResponse.json<ApiResponse>(
        { success: false, error: 'Access denied' },
        { status: 403 }
      );
    }

    if (!isSelfRemoval && membership?.role !== 'owner' && membership?.role !== 'admin') {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Only owners and admins can remove other members' },
        { status: 403 }
      );
    }

    // Owner cannot leave the team (they must transfer ownership or delete it)
    if (isSelfRemoval && membership?.role === 'owner') {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Owner cannot leave the team. You must transfer ownership first or delete the team.' },
        { status: 403 }
      );
    }

    // Get all projects in this team
    const { data: teamProjects } = await supabase
      .from('projects')
      .select('project_id')
      .eq('team_id', team.team_id);

    if (teamProjects && teamProjects.length > 0) {
      const projectIds = teamProjects.map(p => p.project_id);

      // Get all tasks in these projects
      const { data: teamTasks } = await supabase
        .from('tasks')
        .select('task_id')
        .in('project_id', projectIds);

      if (teamTasks && teamTasks.length > 0) {
        const taskIds = teamTasks.map(t => t.task_id);

        // Remove task assignments for the leaving user for tasks in this team
        await supabase
          .from('task_assignments')
          .delete()
          .eq('auth_user_id', targetAuthUserId)
          .in('task_id', taskIds);

        // Delete task_docs created by this user for tasks in this team
        await supabase
          .from('task_docs')
          .delete()
          .eq('auth_user_id', targetAuthUserId)
          .in('task_id', taskIds);
      }
    }

    // Remove member from team
    await supabase
      .from('team_members')
      .delete()
      .eq('team_id', team.team_id)
      .eq('auth_user_id', targetAuthUserId);

    return NextResponse.json<ApiResponse>({
      success: true,
      message: 'Member removed from team',
    });
  } catch (error) {
    console.error('Remove team member error:', error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
