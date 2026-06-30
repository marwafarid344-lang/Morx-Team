import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/middleware/auth';
import { supabaseAdmin as supabase } from '@/lib/supabase';

interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

// POST /api/templates/[templateId]/create-project - Create new project from template
export async function POST(
  request: NextRequest,
  { params }: { params: { templateId: string } }
) {
  const user = await requireAuth(request);
  if (user instanceof NextResponse) return user;

  try {
    const templateId = params.templateId;
    const body = await request.json();
    const { team_id, project_name, project_description } = body;
    const authUserId = user.id;

    if (!team_id) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'team_id is required' },
        { status: 400 }
      );
    }

    if (!project_name || !project_name.trim()) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'project_name is required' },
        { status: 400 }
      );
    }

    // Check if user is team member with create permissions
    const { data: membership } = await supabase
      .from('team_members')
      .select('role')
      .eq('team_id', team_id)
      .eq('auth_user_id', authUserId)
      .single();

    if (!membership || (membership.role !== 'owner' && membership.role !== 'admin')) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Only owners and admins can create projects' },
        { status: 403 }
      );
    }

    // Fetch template tasks
    const { data: templateTasks, error: templateError } = await supabase
      .from('template_tasks')
      .select('*')
      .eq('template_id', templateId)
      .order('order_index', { ascending: true });

    if (templateError) throw templateError;

    if (!templateTasks || templateTasks.length === 0) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Template has no tasks' },
        { status: 400 }
      );
    }

    // Create project
    const projectUrl = project_name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    
    const { data: newProject, error: projectError } = await supabase
      .from('projects')
      .insert({
        team_id: team_id,
        project_name: project_name,
        description: project_description || `Created from template`,
        project_url: projectUrl,
        auth_user_id: authUserId,
      })
      .select()
      .single();

    if (projectError) throw projectError;

    // Helper function to convert priority string to number
    const convertPriority = (priority: string): number => {
      const priorityMap: { [key: string]: number } = {
        'urgent': 3,
        'high': 3,
        'medium': 2,
        'low': 1
      };
      return priorityMap[priority.toLowerCase()] || 2; // default to medium
    };

    // Create tasks from template
    const newTasks = templateTasks.map((templateTask) => ({
      project_id: newProject.project_id,
      title: templateTask.task_title,
      description: templateTask.task_description || '',
      status: 0, // todo
      priority: convertPriority(templateTask.suggested_priority || 'medium'),
      auth_user_id: authUserId,
    }));

    const { data: createdTasks, error: createError } = await supabase
      .from('tasks')
      .insert(newTasks)
      .select();

    if (createError) throw createError;

    // Increment template usage count
    const { error: incrementError } = await supabase.rpc('increment_template_usage', {
      template_id_param: templateId
    });

    if (incrementError) {
      console.warn('Failed to increment usage count:', incrementError);
    }

    return NextResponse.json<ApiResponse>({
      success: true,
      data: {
        project: newProject,
        tasks_created: createdTasks?.length || 0,
        project_url: projectUrl,
      },
    });
  } catch (error: any) {
    console.error('Error creating project from template:', error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: error.message || 'Failed to create project from template' },
      { status: 500 }
    );
  }
}
