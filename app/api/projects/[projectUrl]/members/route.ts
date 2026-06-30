import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/middleware/auth';
import { supabaseAdmin as supabase } from '@/lib/supabase';
import { ApiResponse } from '@/lib/types';

/**
 * Get all members of a project (team members who are assigned to project)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { projectUrl: string } }
) {
  const user = await requireAuth(request);
  if (user instanceof NextResponse) return user;

  try {
    const { projectUrl } = params;

    // Get project
    const { data: project } = await supabase
      .from('projects')
      .select('project_id, team_id')
      .eq('project_url', projectUrl)
      .single();

    if (!project) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Project not found' },
        { status: 404 }
      );
    }

    // Get project members from project_members table
    const { data: projectMembers } = await supabase
      .from('project_members')
      .select('auth_user_id')
      .eq('project_id', project.project_id);

    const memberIds = projectMembers?.map((m: any) => m.auth_user_id) || [];

    // Get user details
    let members: any[] = [];
    if (memberIds.length > 0) {
      const { data: users } = await supabase
        .from('users')
        .select('auth_user_id, first_name, email, profile_image')
        .in('auth_user_id', memberIds);
      members = users || [];
    }

    return NextResponse.json<ApiResponse>({
      success: true,
      data: members,
    });
  } catch (error) {
    console.error('Get project members error:', error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Add member to project
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { projectUrl: string } }
) {
  const user = await requireAuth(request);
  if (user instanceof NextResponse) return user;

  try {
    const body = await request.json();
    const { target_user_id } = body; // The user to add (auth_user_id)
    const authUserId = user.id;

    if (!target_user_id) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'target_user_id is required' },
        { status: 400 }
      );
    }

    const { projectUrl } = params;

    // Get project
    const { data: project } = await supabase
      .from('projects')
      .select('project_id, team_id')
      .eq('project_url', projectUrl)
      .single();

    if (!project) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Project not found' },
        { status: 404 }
      );
    }

    // Check requester permissions
    const { data: requesterMembership } = await supabase
      .from('team_members')
      .select('role')
      .eq('team_id', project.team_id)
      .eq('auth_user_id', authUserId)
      .single();

    if (!requesterMembership || (requesterMembership.role !== 'owner' && requesterMembership.role !== 'admin')) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Only owners and admins can add members to projects' },
        { status: 403 }
      );
    }

    // Check if user to add is a team member
    const { data: isTeamMember } = await supabase
      .from('team_members')
      .select('auth_user_id')
      .eq('auth_user_id', target_user_id)
      .eq('team_id', project.team_id)
      .single();

    if (!isTeamMember) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'User must be a team member first' },
        { status: 400 }
      );
    }

    // Check if already a project member
    const { data: existing } = await supabase
      .from('project_members')
      .select('auth_user_id')
      .eq('auth_user_id', target_user_id)
      .eq('project_id', project.project_id)
      .single();

    if (existing) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'User is already a project member' },
        { status: 400 }
      );
    }

    // Add user to project
    await supabase.from('project_members').insert({
      auth_user_id: target_user_id,
      project_id: project.project_id
    });

    // Get user info
    const { data: userInfo } = await supabase
      .from('users')
      .select('auth_user_id, first_name, email')
      .eq('auth_user_id', target_user_id)
      .single();

    return NextResponse.json<ApiResponse>(
      {
        success: true,
        message: `${userInfo?.first_name || 'User'} added to project`,
        data: userInfo,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Add project member error:', error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Remove member from project
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { projectUrl: string } }
) {
  const user = await requireAuth(request);
  if (user instanceof NextResponse) return user;

  try {
    const { searchParams } = new URL(request.url);
    const authUserId = user.id;
    const targetUserId = searchParams.get('target_user_id');

    if (!targetUserId) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'target_user_id is required' },
        { status: 400 }
      );
    }

    const { projectUrl } = params;

    // Get project
    const { data: project } = await supabase
      .from('projects')
      .select('project_id, team_id')
      .eq('project_url', projectUrl)
      .single();

    if (!project) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Project not found' },
        { status: 404 }
      );
    }

    // Check requester permissions
    const { data: requesterMembership } = await supabase
      .from('team_members')
      .select('role')
      .eq('team_id', project.team_id)
      .eq('auth_user_id', authUserId)
      .single();

    if (!requesterMembership || (requesterMembership.role !== 'owner' && requesterMembership.role !== 'admin')) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Only owners and admins can remove members from projects' },
        { status: 403 }
      );
    }

    // Remove user from project
    await supabase
      .from('project_members')
      .delete()
      .eq('auth_user_id', targetUserId)
      .eq('project_id', project.project_id);

    return NextResponse.json<ApiResponse>({
      success: true,
      message: 'User removed from project',
    });
  } catch (error) {
    console.error('Remove project member error:', error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
