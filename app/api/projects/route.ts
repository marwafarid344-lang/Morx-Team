import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/middleware/auth';
import { supabaseAdmin as supabase } from '@/lib/supabase';
import { ApiResponse } from '@/lib/types';

/**
 * Get all projects for a team
 */
export async function GET(request: NextRequest) {
  const user = await requireAuth(request);
  if (user instanceof NextResponse) return user;

  try {
    const { searchParams } = new URL(request.url);
    const authUserId = user.id;
    const teamId = searchParams.get('team_id');

    if (!teamId) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'team_id is required' },
        { status: 400 }
      );
    }

    console.log(`[Projects API] Checking access for user ${authUserId} in team ${teamId}`);

    // Check if user is team member
    const { data: membership, error: memberError } = await supabase
      .from('team_members')
      .select('role')
      .eq('auth_user_id', authUserId)
      .eq('team_id', teamId)
      .single();

    console.log(`[Projects API] Membership result:`, { membership, error: memberError });

    if (memberError || !membership) {
      console.warn(`[Projects API] Access Denied: User ${authUserId} is not in team ${teamId}`, memberError);
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Not a team member' },
        { status: 403 }
      );
    }

    // Get all projects for the team
    const { data: projects, error: projectsError } = await supabase
      .from('projects')
      .select('*')
      .eq('team_id', teamId)
      .order('created_at', { ascending: false });

    if (projectsError) throw projectsError;

    // Get creator names
    const creatorIds = [...new Set(projects?.map((p: any) => p.auth_user_id) || [])];
    const { data: creators } = await supabase
      .from('users')
      .select('auth_user_id, first_name, last_name')
      .in('auth_user_id', creatorIds);

    const creatorMap: Record<string, any> = {};
    creators?.forEach((c: any) => {
      creatorMap[c.auth_user_id] = { 
        first_name: c.first_name,
        last_name: c.last_name
      };
    });

    // Get task counts for each project
    const projectIds = projects?.map((p: any) => p.project_id) || [];
    
    let taskCounts: Record<string, { total: number; completed: number }> = {};
    
    if (projectIds.length > 0) {
      const { data: tasks } = await supabase
        .from('tasks')
        .select('project_id, status')
        .in('project_id', projectIds);

      tasks?.forEach((task: any) => {
        if (!taskCounts[task.project_id]) {
          taskCounts[task.project_id] = { total: 0, completed: 0 };
        }
        taskCounts[task.project_id].total++;
        if (task.status === 2) {
          taskCounts[task.project_id].completed++;
        }
      });
    }

    // Combine data
    const projectsWithCounts = projects?.map((project: any) => ({
      ...project,
      first_name: creatorMap[project.auth_user_id]?.first_name,
      last_name: creatorMap[project.auth_user_id]?.last_name,
      task_count: taskCounts[project.project_id]?.total || 0,
      completed_tasks: taskCounts[project.project_id]?.completed || 0,
    })) || [];

    return NextResponse.json<ApiResponse>({
      success: true,
      data: projectsWithCounts,
    });
  } catch (error) {
    console.error('Get projects error:', error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Create a new project (only owners and admins)
 */
export async function POST(request: NextRequest) {
  const user = await requireAuth(request);
  if (user instanceof NextResponse) return user;

  try {
    const body = await request.json();
    const { project_name, description, team_id } = body;
    const authUserId = user.id;

    if (!project_name || !team_id) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'project_name and team_id are required' },
        { status: 400 }
      );
    }

    // Check if user is owner or admin
    const { data: membership, error: memberError } = await supabase
      .from('team_members')
      .select('role')
      .eq('auth_user_id', authUserId)
      .eq('team_id', team_id)
      .single();

    if (memberError || !membership) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Not a team member' },
        { status: 403 }
      );
    }

    if (membership.role !== 'owner' && membership.role !== 'admin') {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Only owners and admins can create projects' },
        { status: 403 }
      );
    }

    // Generate random 16-character project URL
    const generateProjectUrl = () => {
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
      let result = '';
      for (let i = 0; i < 16; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      return result;
    };

    const project_url = generateProjectUrl();

    // Create project
    const { data: newProject, error: createError } = await supabase
      .from('projects')
      .insert({
        project_name,
        description: description || '',
        team_id,
        auth_user_id: authUserId,
        project_url,
      })
      .select()
      .single();

    if (createError) throw createError;

    return NextResponse.json<ApiResponse>(
      {
        success: true,
        message: 'Project created successfully',
        data: newProject,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Create project error:', error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
