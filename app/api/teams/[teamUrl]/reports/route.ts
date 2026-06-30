import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/middleware/auth';
import { supabaseAdmin as supabase } from '@/lib/supabase'
import { decodeContent } from '@/lib/utils/contentEncoding'

export async function GET(
  request: NextRequest,
  { params }: { params: { teamUrl: string } }
) {
  const user = await requireAuth(request);
  if (user instanceof NextResponse) return user;

  try {
    const { searchParams } = new URL(request.url)
    const authUserId = user.id
    const period = parseInt(searchParams.get('period') || '30')
    const projectFilter = searchParams.get('project')

    const teamUrl = params.teamUrl

    // Get team info
    const { data: team, error: teamError } = await supabase
      .from('teams')
      .select('team_id, team_name')
      .eq('team_url', teamUrl)
      .single()

    if (teamError || !team) {
      return NextResponse.json({ success: false, error: 'Team not found' }, { status: 404 })
    }

    // Verify membership
    const { data: membership, error: memberError } = await supabase
      .from('team_members')
      .select('role')
      .eq('team_id', team.team_id)
      .eq('auth_user_id', authUserId)
      .single()

    if (memberError || !membership) {
      return NextResponse.json({ success: false, error: 'Access denied' }, { status: 403 })
    }

    // Get all projects for this team
    let projectQuery = supabase
      .from('projects')
      .select('project_id, project_name')
      .eq('team_id', team.team_id)

    const { data: projects, error: projectsError } = await projectQuery
    if (projectsError) throw projectsError

    const projectIds = projects?.map((p: any) => p.project_id) || []

    // If specific project filter, narrow down
    let filteredProjectIds = projectIds
    if (projectFilter && projectFilter !== 'all') {
      filteredProjectIds = [parseInt(projectFilter)]
    }

    // Get all tasks for these projects
    let tasks: any[] = []
    if (filteredProjectIds.length > 0) {
      const { data: taskData, error: taskError } = await supabase
        .from('tasks')
        .select('task_id, title, status, due_date, project_id, auth_user_id, created_at')
        .in('project_id', filteredProjectIds)

      if (!taskError && taskData) {
        tasks = taskData
      }
    }

    // Calculate overview statistics
    const totalProjects = projectFilter && projectFilter !== 'all' ? 1 : projects?.length || 0
    const totalTasks = tasks.length
    const completedTasks = tasks.filter((t: any) => t.status === 2).length
    const inProgressTasks = tasks.filter((t: any) => t.status === 1).length
    const todoTasks = tasks.filter((t: any) => t.status === 0).length
    const overdueTasks = tasks.filter((t: any) => 
      t.due_date && new Date(t.due_date) < new Date() && t.status !== 2
    ).length

    const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0

    // Project statistics
    const projectStats = (projectFilter && projectFilter !== 'all' 
      ? projects?.filter((p: any) => p.project_id === parseInt(projectFilter))
      : projects
    )?.map((project: any) => {
      const projectTasks = tasks.filter((t: any) => t.project_id === project.project_id)
      return {
        project_id: project.project_id,
        project_name: project.project_name,
        total_tasks: projectTasks.length,
        completed: projectTasks.filter((t: any) => t.status === 2).length,
        in_progress: projectTasks.filter((t: any) => t.status === 1).length,
        todo: projectTasks.filter((t: any) => t.status === 0).length,
        overdue: projectTasks.filter((t: any) => 
          t.due_date && new Date(t.due_date) < new Date() && t.status !== 2
        ).length
      }
    }) || []

    // Get team members
    const { data: members, error: membersError } = await supabase
      .from('team_members')
      .select('auth_user_id, role')
      .eq('team_id', team.team_id)

    const memberIds = members?.map((m: any) => m.auth_user_id) || []

    // Get member user info
    let memberUsers: any[] = []
    if (memberIds.length > 0) {
      const { data: users } = await supabase
        .from('users')
        .select('auth_user_id, first_name, last_name, profile_image, plan')
        .in('auth_user_id', memberIds)
      memberUsers = users || []
    }

    // Get task assignments
    const taskIds = tasks.map((t: any) => t.task_id)
    let assignments: any[] = []
    if (taskIds.length > 0) {
      const { data: assignData } = await supabase
        .from('task_assignments')
        .select('auth_user_id, task_id')
        .in('task_id', taskIds)
      assignments = assignData || []
    }

    // Calculate member performance
    const memberPerformance = memberUsers.map((user: any) => {
      const memberRole = members?.find((m: any) => m.auth_user_id === user.auth_user_id)?.role || 'member'
      const userAssignments = assignments.filter((a: any) => a.auth_user_id === user.auth_user_id)
      const assignedTaskIds = userAssignments.map((a: any) => a.task_id)
      const assignedTasks = tasks.filter((t: any) => assignedTaskIds.includes(t.task_id))
      const completedAssigned = assignedTasks.filter((t: any) => t.status === 2).length

      return {
        auth_user_id: user.auth_user_id,
        name: `${user.first_name || ''} ${user.last_name || ''}`.trim() || 'Unknown',
        profile_image: user.profile_image,
        plan: user.plan || 'free',
        role: memberRole,
        assigned_tasks: assignedTasks.length,
        completed_tasks: completedAssigned,
        completion_rate: assignedTasks.length > 0 
          ? Math.round((completedAssigned / assignedTasks.length) * 100)
          : 0
      }
    }).sort((a, b) => b.completed_tasks - a.completed_tasks)

    // Get recent activity (just completed tasks)
    const recentTasks = tasks
      .sort((a: any, b: any) => b.task_id - a.task_id)
      .slice(0, 20)

    // Get project names for recent tasks
    const recentActivity = recentTasks.map((task: any) => {
      const project = projects?.find((p: any) => p.project_id === task.project_id)
      const assignment = assignments.find((a: any) => a.task_id === task.task_id)
      const assignedUser = assignment ? memberUsers.find((u: any) => u.auth_user_id === assignment.auth_user_id) : null

      return {
        task_id: task.task_id,
        task_title: decodeContent(task.title),
        status: task.status === 2 ? 'done' : task.status === 1 ? 'in-progress' : 'todo',
        timestamp: task.created_at || new Date().toISOString(),
        project_name: project?.project_name || 'Unknown',
        user_name: assignedUser ? `${assignedUser.first_name || ''} ${assignedUser.last_name || ''}`.trim() : 'Unassigned',
        type: task.status === 2 ? 'completed' : task.status === 1 ? 'started' : 'created'
      }
    })

    // Prepare response data
    const reportData = {
      overview: {
        total_projects: totalProjects,
        total_tasks: totalTasks,
        completed_tasks: completedTasks,
        in_progress_tasks: inProgressTasks,
        todo_tasks: todoTasks,
        overdue_tasks: overdueTasks,
        completion_rate: completionRate,
        completion_trend: 0
      },
      project_stats: projectStats,
      member_performance: memberPerformance,
      recent_activity: recentActivity
    }

    return NextResponse.json({ success: true, data: reportData })

  } catch (error: any) {
    console.error('Error fetching team reports:', error)
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to fetch reports' },
      { status: 500 }
    )
  }
}
