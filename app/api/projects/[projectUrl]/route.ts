import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/middleware/auth';
import { supabaseAdmin as supabase } from '@/lib/supabase';
import { ApiResponse } from '@/lib/types';

/**
 * Get project by URL
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { projectUrl: string } }
) {
  const user = await requireAuth(request);
  if (user instanceof NextResponse) return user;

  try {
    const authUserId = user.id;
    const { projectUrl } = params;

    // Get project
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('*')
      .eq('project_url', projectUrl)
      .single();

    if (projectError || !project) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Project not found' },
        { status: 404 }
      );
    }

    // Get team info
    const { data: team } = await supabase
      .from('teams')
      .select('team_id, team_name, team_url')
      .eq('team_id', project.team_id)
      .single();

    // Check if user is team member - Using auth_user_id
    const { data: membership } = await supabase
      .from('team_members')
      .select('role')
      .eq('team_id', project.team_id)
      .eq('auth_user_id', authUserId)
      .single();

    if (!membership) {
      // Get owner info for access denied response
      const { data: ownerMember } = await supabase
        .from('team_members')
        .select('auth_user_id')
        .eq('team_id', project.team_id)
        .eq('role', 'owner')
        .single();

      let ownerInfo = null;
      if (ownerMember) {
        const { data: owner } = await supabase
          .from('users')
          .select('first_name, email')
          .eq('auth_user_id', ownerMember.auth_user_id)
          .single();
        
        if (owner) {
          ownerInfo = {
            name: `${owner.first_name || ''}`.trim(),
            email: owner.email
          };
        }
      }

      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: 'Access denied',
          data: {
            teamName: team?.team_name,
            teamUrl: team?.team_url,
            owner: ownerInfo,
          },
        },
        { status: 403 }
      );
    }

    return NextResponse.json<ApiResponse>({
      success: true,
      data: {
        ...project,
        team_name: team?.team_name,
        team_url: team?.team_url,
        role: membership.role
      },
    });
  } catch (error) {
    console.error('Get project error:', error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Update project (only owners and admins)
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { projectUrl: string } }
) {
  const user = await requireAuth(request);
  if (user instanceof NextResponse) return user;

  try {
    const authUserId = user.id;
    const body = await request.json();
    const { project_name, description } = body;
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

    // Check permissions
    const { data: membership } = await supabase
      .from('team_members')
      .select('role')
      .eq('team_id', project.team_id)
      .eq('auth_user_id', authUserId)
      .single();

    if (!membership || (membership.role !== 'owner' && membership.role !== 'admin')) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Only owners and admins can update projects' },
        { status: 403 }
      );
    }

    // Update project
    const { data: updated, error: updateError } = await supabase
      .from('projects')
      .update({ project_name, description })
      .eq('project_id', project.project_id)
      .select()
      .single();

    if (updateError) throw updateError;

    return NextResponse.json<ApiResponse>({
      success: true,
      message: 'Project updated successfully',
      data: updated,
    });
  } catch (error) {
    console.error('Update project error:', error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Delete project (only owners and admins)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { projectUrl: string } }
) {
  const user = await requireAuth(request);
  if (user instanceof NextResponse) return user;

  try {
    const authUserId = user.id;
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

    // Check permissions
    const { data: membership } = await supabase
      .from('team_members')
      .select('role')
      .eq('team_id', project.team_id)
      .eq('auth_user_id', authUserId)
      .single();

    if (!membership || (membership.role !== 'owner' && membership.role !== 'admin')) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Only owners and admins can delete projects' },
        { status: 403 }
      );
    }

    // Delete project
    const { error: deleteError } = await supabase
      .from('projects')
      .delete()
      .eq('project_id', project.project_id);

    if (deleteError) throw deleteError;

    return NextResponse.json<ApiResponse>({
      success: true,
      message: 'Project deleted successfully',
    });
  } catch (error) {
    console.error('Delete project error:', error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
