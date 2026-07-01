import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/middleware/auth';
import { supabaseAdmin as supabase } from '@/lib/supabase';
import { ApiResponse } from '@/lib/types';
import { generateAI, extractAndParseJSON } from '@/lib/utils/ai';
import { encodeContent } from '@/lib/utils/contentEncoding';

export async function POST(request: NextRequest) {
  const user = await requireAuth(request);
  if (user instanceof NextResponse) return user;

  try {
    const body = await request.json();
    const { prompt, action, team_id, generatedData } = body;
    const userId = user.id;

    if (action === 'create' && generatedData && team_id) {
      // 1. Instantly create the project and populate it with generated tasks/milestones!
      const generateProjectUrl = () => {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let result = '';
        for (let i = 0; i < 16; i++) result += chars.charAt(Math.floor(Math.random() * chars.length));
        return result;
      };

      const projectUrl = generateProjectUrl();
      const { data: project, error: projError } = await supabase
        .from('projects')
        .insert({
          project_name: generatedData.title,
          description: generatedData.documentation.substring(0, 300),
          team_id,
          auth_user_id: userId,
          project_url: projectUrl
        })
        .select()
        .single();

      if (projError || !project) throw new Error(projError?.message || 'Failed to create project');

      // 2. Insert tasks into project
      const tasksToInsert = generatedData.tasks.map((t: any) => ({
        title: encodeContent(t.title),
        description: encodeContent(t.description),
        status: 0,
        priority: t.priority || 2,
        due_date: new Date(Date.now() + (t.days_from_start || 7) * 24 * 60 * 60 * 1000).toISOString(),
        project_id: project.project_id,
        auth_user_id: userId
      }));

      const { error: tasksError } = await supabase
        .from('tasks')
        .insert(tasksToInsert);

      if (tasksError) throw tasksError;

      return NextResponse.json<ApiResponse>({
        success: true,
        message: 'Generated project created successfully!',
        data: { project_url: projectUrl }
      });
    }

    if (!prompt) {
      return NextResponse.json<ApiResponse>({ success: false, error: 'prompt parameter is required' }, { status: 400 });
    }

    const aiPrompt = `You are Marlin, a lead project architect. Based on the project concept "${prompt}", generate a complete project roadmap package.
Structure your response strictly as a JSON object with the following fields:
1. "title": The name of the project.
2. "architecture": The recommended software architecture (e.g. client-server, microservices).
3. "database_schema": Description of database tables and relations.
4. "required_skills": Array of strings (e.g., ["React", "PostgreSQL", "Node.js"]).
5. "timeline": Timeline summary (e.g., "4 Weeks").
6. "risks": Array of objects with keys "risk" and "mitigation".
7. "roles": Array of objects with keys "role_name" and "responsibility".
8. "milestones": Array of objects with keys "title" and "deliverable".
9. "tasks": Array of objects with keys "title", "description", "priority" (1=High, 2=Medium, 3=Low), and "days_from_start" (suggested start offset day, e.g. 3).
10. "documentation": A short README.md introduction text for the project workspace.

Do not wrap the JSON in markdown code blocks.`;

    const response = await generateAI({ userId, prompt: aiPrompt, maxTokens: 3000, jsonMode: true });
    if (!response.success) {
      return NextResponse.json<ApiResponse>({ success: false, error: response.error, limitReached: response.limitReached }, { status: 500 });
    }

    const projectSchema = extractAndParseJSON(response.data || '{}');

    return NextResponse.json<ApiResponse>({
      success: true,
      data: projectSchema
    });

  } catch (error: any) {
    console.error('Project generator error:', error);
    return NextResponse.json<ApiResponse>({ success: false, error: error.message || 'Internal server error' }, { status: 500 });
  }
}
