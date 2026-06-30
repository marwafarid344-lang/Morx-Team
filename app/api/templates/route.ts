import { supabaseAdmin as supabase } from '@/lib/supabase';
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/middleware/auth';
import { ApiResponse } from '@/lib/types';

/**
 * List all templates (with optional filters)
 */
export async function GET(request: NextRequest) {
  const user = await requireAuth(request);
  if (user instanceof NextResponse) return user;

  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const language = searchParams.get('language');
    const search = searchParams.get('search');

    let query = supabase
      .from('task_templates')
      .select(`
        template_id,
        template_name,
        description,
        category,
        is_builtin,
        auth_user_id,
        language,
        rating_avg,
        usage_count,
        created_at
      `)
      .order('usage_count', { ascending: false })
      .order('rating_avg', { ascending: false });

    // Apply filters
    if (category) {
      query = query.eq('category', category);
    }
    if (language) {
      query = query.eq('language', language);
    }
    if (search) {
      query = query.ilike('template_name', `%${search}%`);
    }

    const { data: templates, error } = await query;

    if (error) throw error;

    return NextResponse.json<ApiResponse>({
      success: true,
      data: templates,
    });
  } catch (error: any) {
    console.error('Error fetching templates:', error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Failed to fetch templates' },
      { status: 500 }
    );
  }
}

/**
 * Create a new custom template
 */
export async function POST(request: NextRequest) {
  const user = await requireAuth(request);
  if (user instanceof NextResponse) return user;

  try {
    const body = await request.json();
    const { template_name, description, category, language, tasks } = body;
    const authUserId = user.id;

    if (!template_name) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'template_name is required' },
        { status: 400 }
      );
    }

    if (!tasks || !Array.isArray(tasks) || tasks.length === 0) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'At least one task is required' },
        { status: 400 }
      );
    }

    // Insert template - Use authUserId (UUID) as creator_id
    const { data: template, error: templateError } = await supabase
      .from('task_templates')
      .insert({
        template_name,
        description: description || null,
        category: category || null,
        language: language || 'en',
        auth_user_id: authUserId, // Set to UUID
        is_builtin: false,
      })
      .select()
      .single();

    if (templateError) throw templateError;

    // Insert template tasks
    const templateTasks = tasks.map((task: any, index: number) => ({
      template_id: template.template_id,
      task_title: task.title,
      task_description: task.description || null,
      suggested_priority: task.priority || 'medium',
      order_index: index + 1,
    }));

    const { error: tasksError } = await supabase
      .from('template_tasks')
      .insert(templateTasks);

    if (tasksError) throw tasksError;

    return NextResponse.json<ApiResponse>({
      success: true,
      message: 'Template created successfully',
      data: template,
    });
  } catch (error: any) {
    console.error('Error creating template:', error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Failed to create template' },
      { status: 500 }
    );
  }
}
