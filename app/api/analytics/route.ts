import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin as supabase } from '@/lib/supabase';
import { ApiResponse } from '@/lib/types';

export async function POST(request: NextRequest) {
  try {
    const { password } = await request.json();
    const correctPassword = process.env.ANALYTICS_PASSWORD;

    if (!correctPassword) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Analytics password not configured in environment' },
        { status: 500 }
      );
    }

    if (password !== correctPassword) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Incorrect password' },
        { status: 401 }
      );
    }

    // Fetch data from various tables
    const [
      { count: userCount },
      { count: teamCount },
      { count: projectCount },
      { count: taskCount },
      { count: commentCount },
      { data: recentUsers },
      { data: recentTeams },
      { data: recentTasks },
      { data: allTasks },
      { data: allProjects },
      { data: allUsers }
    ] = await Promise.all([
      supabase.from('users').select('*', { count: 'exact', head: true }),
      supabase.from('teams').select('*', { count: 'exact', head: true }),
      supabase.from('projects').select('*', { count: 'exact', head: true }),
      supabase.from('tasks').select('*', { count: 'exact', head: true }),
      supabase.from('task_comments').select('*', { count: 'exact', head: true }),
      supabase.from('users').select('auth_user_id, email, first_name, last_name, created_at').order('created_at', { ascending: false }).limit(5),
      supabase.from('teams').select('team_name, team_url, created_at').order('created_at', { ascending: false }).limit(5),
      supabase.from('tasks').select('title, status, created_at').order('created_at', { ascending: false }).limit(5),
      supabase.from('tasks').select('status, project_id'),
      supabase.from('projects').select('project_id, project_name'),
      supabase.from('users').select('created_at')
    ]);

    // Aggregate Task Status Distribution
    const statusDistribution = [
      { name: 'Todo', value: allTasks?.filter(t => t.status === 0).length || 0, color: '#F59E0B' },
      { name: 'In Progress', value: allTasks?.filter(t => t.status === 1).length || 0, color: '#3B82F6' },
      { name: 'Done', value: allTasks?.filter(t => t.status === 2).length || 0, color: '#10B981' },
    ];

    // Aggregate Project Progress
    const projectProgress = allProjects?.map(project => {
      const pTasks = allTasks?.filter(t => t.project_id === project.project_id) || [];
      const done = pTasks.filter(t => t.status === 2).length;
      const progress = pTasks.length > 0 ? Math.round((done / pTasks.length) * 100) : 0;
      return {
        name: project.project_name,
        progress: progress,
        tasks: pTasks.length
      };
    }).sort((a, b) => b.tasks - a.tasks).slice(0, 5) || [];

    // Aggregate Growth Data (Simplified last 7 days)
    const growthData = Array.from({ length: 7 }).map((_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (6 - i));
      const dateStr = date.toISOString().split('T')[0];
      
      const count = allUsers?.filter(u => u.created_at.startsWith(dateStr)).length || 0;
      return {
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        users: count
      };
    });

    return NextResponse.json<ApiResponse>({
      success: true,
      data: {
        stats: {
          users: userCount || 0,
          teams: teamCount || 0,
          projects: projectCount || 0,
          tasks: taskCount || 0,
          comments: commentCount || 0
        },
        recentData: {
          users: recentUsers || [],
          teams: recentTeams || [],
          tasks: recentTasks || []
        },
        chartData: {
          statusDistribution,
          projectProgress,
          growthData
        }
      }
    });
  } catch (error: any) {
    console.error('Analytics API error:', error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
