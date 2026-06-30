import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/middleware/auth';
import { supabaseAdmin as supabase } from '@/lib/supabase';
import { ApiResponse } from '@/lib/types';

export async function GET(request: NextRequest) {
  const user = await requireAuth(request);
  if (user instanceof NextResponse) return user;

  try {
    const { searchParams } = new URL(request.url);
    const targetUserId = searchParams.get('user_id') || user.id;
    const forceRefresh = searchParams.get('refresh') === 'true';

    // 1. Check if user_dna already exists
    if (!forceRefresh) {
      const { data: cachedDna, error: cacheError } = await supabase
        .from('user_dna')
        .select('*')
        .eq('auth_user_id', targetUserId)
        .single();

      if (cachedDna) {
        return NextResponse.json<ApiResponse>({ success: true, data: cachedDna });
      }
    }

    // 2. Perform deterministic calculation based on project history
    
    // Get user details
    const { data: userData } = await supabase
      .from('users')
      .select('skills, department, created_at')
      .eq('auth_user_id', targetUserId)
      .single();

    // Get user comments to determine preferred hours and communication volume
    const { data: comments } = await supabase
      .from('task_comments')
      .select('created_at, comment_text')
      .eq('auth_user_id', targetUserId);

    // Get tasks assigned to/completed by this user
    const { data: assignments } = await supabase
      .from('task_assignments')
      .select('task_id')
      .eq('auth_user_id', targetUserId);

    const taskIds = assignments?.map((a: any) => a.task_id) || [];
    
    let tasks: any[] = [];
    if (taskIds.length > 0) {
      const { data: fetchedTasks } = await supabase
        .from('tasks')
        .select('task_id, status, priority, due_date, created_at')
        .in('task_id', taskIds);
      tasks = fetchedTasks || [];
    }

    // Get teams created by this user
    const { data: teamsCreated } = await supabase
      .from('teams')
      .select('team_id')
      .eq('created_by', targetUserId);

    // Get projects created by this user
    const { data: projectsCreated } = await supabase
      .from('projects')
      .select('project_id')
      .eq('auth_user_id', targetUserId);

    // Get team memberships
    const { data: memberships } = await supabase
      .from('team_members')
      .select('role')
      .eq('auth_user_id', targetUserId);

    // Calculate Preferred Working Hours
    const hourCounts: Record<number, number> = {};
    for (let i = 0; i < 24; i++) hourCounts[i] = 0;

    comments?.forEach((c: any) => {
      const hour = new Date(c.created_at).getHours();
      hourCounts[hour] = (hourCounts[hour] || 0) + 1;
    });

    tasks?.forEach((t: any) => {
      const hour = new Date(t.created_at).getHours();
      hourCounts[hour] = (hourCounts[hour] || 0) + 1;
    });

    let peakHour = 9; // default 9 AM
    let maxActivity = 0;
    for (let hour = 0; hour < 24; hour++) {
      if (hourCounts[hour] > maxActivity) {
        maxActivity = hourCounts[hour];
        peakHour = hour;
      }
    }

    const startHour = (peakHour - 3 + 24) % 24;
    const endHour = (peakHour + 5) % 24;
    const workingHours = {
      start: `${startHour.toString().padStart(2, '0')}:00`,
      end: `${endHour.toString().padStart(2, '0')}:00`,
      timezone: 'GMT+3'
    };

    // Calculate Leadership Score
    const leadCount = memberships?.filter((m: any) => m.role === 'owner' || m.role === 'admin').length || 0;
    const createdCount = (teamsCreated?.length || 0) + (projectsCreated?.length || 0);
    const leadershipScore = Math.min(100, Math.max(0, 45 + leadCount * 15 + createdCount * 5));

    // Calculate Collaboration Score
    const commentCount = comments?.length || 0;
    const collaborationScore = Math.min(100, Math.max(0, 50 + commentCount * 4));

    // Calculate Deadline Reliability & Execution Speed
    let completedOnTime = 0;
    let totalCompletedWithDueDate = 0;
    let doneTasks = tasks?.filter((t: any) => t.status === 2) || [];
    
    doneTasks.forEach((t: any) => {
      if (t.due_date) {
        totalCompletedWithDueDate++;
        const completedAt = new Date(); // assume completed now for placeholder
        const dueDate = new Date(t.due_date);
        if (completedAt <= dueDate) {
          completedOnTime++;
        }
      }
    });

    const deadlineReliability = totalCompletedWithDueDate > 0 
      ? Math.min(100, Math.max(0, (completedOnTime / totalCompletedWithDueDate) * 100))
      : 75.00; // default value if no due dates

    // Execution Speed (randomized around a solid baseline for simulation/initial data)
    const totalTasksCount = tasks?.length || 0;
    const doneCount = doneTasks.length;
    const executionSpeed = Math.min(100, Math.max(0, 60 + doneCount * 3 - (totalTasksCount - doneCount) * 2));

    // Consistency
    const consistency = Math.min(100, Math.max(0, 70 + (deadlineReliability > 80 ? 10 : -10)));

    // Learning Speed
    const learningSpeed = Math.min(100, Math.max(0, 65 + (doneCount > 5 ? 15 : 5)));

    // Technologies
    const skillsList = userData?.skills ? (typeof userData.skills === 'string' ? JSON.parse(userData.skills) : userData.skills) : [];
    const preferredTechnologies = Array.isArray(skillsList) ? skillsList.slice(0, 5) : ['React', 'TypeScript', 'TailwindCSS'];

    // Preferred Role
    const preferredRole = userData?.department || 'Software Developer';

    // Communication Style
    let communicationStyle = 'Collaborative';
    if (commentCount > 15) {
      communicationStyle = 'Expressive';
    } else if (commentCount > 5) {
      communicationStyle = 'Collaborative';
    } else {
      communicationStyle = 'Direct';
    }

    // Save DNA
    const newDna = {
      auth_user_id: targetUserId,
      preferred_working_hours: workingHours,
      communication_style: communicationStyle,
      leadership_score: leadershipScore,
      execution_speed: executionSpeed,
      consistency: consistency,
      deadline_reliability: deadlineReliability,
      collaboration_score: collaborationScore,
      preferred_technologies: preferredTechnologies,
      preferred_role: preferredRole,
      learning_speed: learningSpeed,
      updated_at: new Date().toISOString()
    };

    await supabase.from('user_dna').upsert(newDna);

    return NextResponse.json<ApiResponse>({
      success: true,
      data: newDna
    });

  } catch (error: any) {
    console.error('User DNA error:', error);
    return NextResponse.json<ApiResponse>({ success: false, error: error.message || 'Internal server error' }, { status: 500 });
  }
}
