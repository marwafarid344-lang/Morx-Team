import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/middleware/auth';
import { supabaseAdmin as supabase } from '@/lib/supabase';

interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

// GET /api/templates/[templateId] - Get template details with all tasks
export async function GET(
  request: NextRequest,
  { params }: { params: { templateId: string } }
) {
  try {
    const templateId = params.templateId;

    // Fetch template - avoid FK hint issues by fetching creator separately
    const { data: template, error: templateError } = await supabase
      .from('task_templates')
      .select('*')
      .eq('template_id', templateId)
      .single();

    if (templateError) throw templateError;

    if (!template) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Template not found' },
        { status: 404 }
      );
    }

    // Fetch creator info separately
    let creatorInfo = null;
    if (template.auth_user_id) {
      const { data: creator } = await supabase
        .from('users')
        .select('first_name, last_name, email')
        .eq('auth_user_id', template.auth_user_id)
        .single();
      creatorInfo = creator;
    }

    // Fetch template tasks
    const { data: tasks, error: tasksError } = await supabase
      .from('template_tasks')
      .select('*')
      .eq('template_id', templateId)
      .order('order_index', { ascending: true });

    if (tasksError) throw tasksError;

    return NextResponse.json<ApiResponse>({
      success: true,
      data: {
        ...template,
        users: creatorInfo,
        tasks: tasks || [],
      },
    });
  } catch (error: any) {
    console.error('Error fetching template details:', error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: error.message || 'Failed to fetch template' },
      { status: 500 }
    );
  }
}

// POST /api/templates/[templateId]/apply - Apply template to a project
export async function POST(
  request: NextRequest,
  { params }: { params: { templateId: string } }
) {
  const user = await requireAuth(request);
  if (user instanceof NextResponse) return user;

  try {
    const templateId = params.templateId;
    const body = await request.json();
    const { project_id } = body;
    const authUserId = user.id;

    if (!project_id) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'project_id is required' },
        { status: 400 }
      );
    }

    // Verify project exists and user has access
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('project_id, team_id')
      .eq('project_id', project_id)
      .single();

    if (projectError || !project) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Project not found or access denied' },
        { status: 404 }
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
      project_id: project_id,
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

    // Increment usage count
    await supabase
      .from('task_templates')
      .update({ usage_count: supabase.rpc('increment', { x: 1 }) })
      .eq('template_id', templateId);

    return NextResponse.json<ApiResponse>({
      success: true,
      data: {
        tasks_created: createdTasks?.length || 0,
        tasks: createdTasks,
      },
    });
  } catch (error: any) {
    console.error('Error applying template:', error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: error.message || 'Failed to apply template' },
      { status: 500 }
    );
  }
}

// PUT /api/templates/[templateId] - Update a custom template
export async function PUT(
  request: NextRequest,
  { params }: { params: { templateId: string } }
) {
  const user = await requireAuth(request);
  if (user instanceof NextResponse) return user;

  try {
    const templateId = params.templateId;
    const authUserId = user.id;
    const body = await request.json();
    const { template_name, description, category, tasks } = body;

    // Check if template exists and user is the creator
    const { data: template, error: fetchError } = await supabase
      .from('task_templates')
      .select('template_id, auth_user_id, is_builtin')
      .eq('template_id', templateId)
      .single();

    if (fetchError || !template) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Template not found' },
        { status: 404 }
      );
    }

    if (template.is_builtin) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Cannot edit built-in templates' },
        { status: 403 }
      );
    }

    if (template.auth_user_id !== authUserId) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Only template creator can edit it' },
        { status: 403 }
      );
    }

    // Validate input
    if (!template_name || template_name.trim() === '') {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Template name is required' },
        { status: 400 }
      );
    }

    if (!tasks || !Array.isArray(tasks) || tasks.length === 0) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'At least one task is required' },
        { status: 400 }
      );
    }

    // Update template details
    const { error: updateError } = await supabase
      .from('task_templates')
      .update({
        template_name: template_name.trim(),
        description: description?.trim() || null,
        category: category || null,
      })
      .eq('template_id', templateId);

    if (updateError) throw updateError;

    // Delete existing tasks
    const { error: deleteTasksError } = await supabase
      .from('template_tasks')
      .delete()
      .eq('template_id', templateId);

    if (deleteTasksError) throw deleteTasksError;

    // Insert new tasks
    const tasksToInsert = tasks.map((task: any, index: number) => ({
      template_id: parseInt(templateId),
      task_title: task.title?.trim() || task.task_title?.trim(),
      task_description: task.description?.trim() || task.task_description?.trim() || null,
      suggested_priority: task.priority || task.suggested_priority || 'medium',
      order_index: index,
    }));

    const { error: insertTasksError } = await supabase
      .from('template_tasks')
      .insert(tasksToInsert);

    if (insertTasksError) throw insertTasksError;

    return NextResponse.json<ApiResponse>({
      success: true,
      data: { message: 'Template updated successfully' },
    });
  } catch (error: any) {
    console.error('Error updating template:', error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: error.message || 'Failed to update template' },
      { status: 500 }
    );
  }
}

// DELETE /api/templates/[templateId] - Delete a custom template
export async function DELETE(
  request: NextRequest,
  { params }: { params: { templateId: string } }
) {
  const user = await requireAuth(request);
  if (user instanceof NextResponse) return user;

  try {
    const templateId = params.templateId;
    const authUserId = user.id;

    // Check if template exists and user is the creator
    const { data: template, error: fetchError } = await supabase
      .from('task_templates')
      .select('template_id, auth_user_id, is_builtin')
      .eq('template_id', templateId)
      .single();

    if (fetchError || !template) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Template not found' },
        { status: 404 }
      );
    }

    if (template.is_builtin) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Cannot delete built-in templates' },
        { status: 403 }
      );
    }

    if (template.auth_user_id !== authUserId) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Only template creator can delete it' },
        { status: 403 }
      );
    }

    // Delete template (cascade will delete template_tasks and ratings)
    const { error: deleteError } = await supabase
      .from('task_templates')
      .delete()
      .eq('template_id', templateId);

    if (deleteError) throw deleteError;

    return NextResponse.json<ApiResponse>({
      success: true,
      data: { message: 'Template deleted successfully' },
    });
  } catch (error: any) {
    console.error('Error deleting template:', error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: error.message || 'Failed to delete template' },
      { status: 500 }
    );
  }
}
