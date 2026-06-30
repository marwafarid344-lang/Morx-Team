"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd"
import { motion, AnimatePresence } from "framer-motion"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { PlanAvatar } from "@/components/ui/plan-avatar"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, ArrowLeft, MoreVertical, Trash2, Calendar, User, AlertCircle, CheckCircle2, Clock, Settings, Edit, MessageSquare, Paperclip, Send, X, Download, Heart, ChevronDown, Check, LayoutGrid, CalendarDays, Sparkles, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import TaskCalendar from "@/components/TaskCalendar"
import { LiveClock } from "@/components/LiveClock"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Checkbox } from "@/components/ui/checkbox"
import TaskDocEditor from "@/components/TaskDocEditor"
import { decodeTask, decodeComment } from "@/lib/utils/contentDecoding"
import { useAuth } from "@/contexts/auth-context"
import { toast } from "sonner"
import { AIDescriptionButton } from "@/components/ui/ai-description-button"
import { AITeamMemberPanel } from "@/components/ai/AITeamMemberPanel"
import { TeammateRatingModal } from "@/components/ui/TeammateRatingModal"



interface Task {
  task_id: string  // UUID
  title: string
  description: string
  status: number // 0=todo, 1=in-progress, 2=done
  priority: number
  due_date: string | null
  assigned_users: string | null // Format: "userId:Name||userId:Name"
  comment_count: number
  auth_user_id: string // UUID
}

interface Comment {
  comment_id: number
  comment_text: string
  created_at: string
  auth_user_id: string // UUID
  first_name: string
  last_name: string
  profile_image: string | null
  plan?: string | null
  likes: number
}

interface TaskFile {
  file_id: number
  file_name: string
  file_url: string
  uploaded_at: string
  auth_user_id: string // UUID
  first_name: string
  last_name: string
}

export default function ProjectPage() {
  const router = useRouter()
  const params = useParams()
  const projectUrl = params.projectUrl as string

  const { user, isLoading: authLoading } = useAuth()
  const [project, setProject] = useState<any>(null)
  const [tasks, setTasks] = useState<Task[]>([])
  const [teamMembers, setTeamMembers] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false)
  const [newMemberEmail, setNewMemberEmail] = useState("")
  const [newMemberRole, setNewMemberRole] = useState("member")
  const [isEditProjectDialogOpen, setIsEditProjectDialogOpen] = useState(false)
  const [editProjectName, setEditProjectName] = useState("")
  const [editProjectDescription, setEditProjectDescription] = useState("")
  
  // Task form state
  const [newTaskTitle, setNewTaskTitle] = useState("")
  const [newTaskDesc, setNewTaskDesc] = useState("")
  const [newTaskDueDate, setNewTaskDueDate] = useState("")
  const [newTaskPriority, setNewTaskPriority] = useState("1")
  const [selectedAssignees, setSelectedAssignees] = useState<string[]>([])

  // Task details dialog
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [isTaskDetailsOpen, setIsTaskDetailsOpen] = useState(false)
  const [comments, setComments] = useState<Comment[]>([])
  const [newComment, setNewComment] = useState("")
  const [isLoadingComments, setIsLoadingComments] = useState(false)
  const [lastDroppedId, setLastDroppedId] = useState<string | null>(null)

  // Delete comment confirmation dialog
  const [deleteCommentDialogOpen, setDeleteCommentDialogOpen] = useState(false)
  const [commentToDelete, setCommentToDelete] = useState<number | null>(null)

  // View mode state
  const [viewMode, setViewMode] = useState<'kanban' | 'calendar' | 'ai'>('kanban')


  // AI Task Suggestions state
  const [aiSuggestionsOpen, setAiSuggestionsOpen] = useState(false)
  const [aiSuggestionsLoading, setAiSuggestionsLoading] = useState(false)
  const [aiSuggestions, setAiSuggestions] = useState<{title: string; description: string; priority: number}[]>([])

  useEffect(() => {
    // Auth is now managed by useAuth context
  }, [])

  // Derived state for current user role
  const currentUserRole = teamMembers.find(m => m.auth_user_id === user?.auth_user_id)?.role || 'member';
  const isAdminOrOwner = currentUserRole === 'admin' || currentUserRole === 'owner';

  useEffect(() => {
    if (user?.auth_user_id) {
      fetchProject()
    }
  }, [user, projectUrl])

  useEffect(() => {
    if (project && user?.auth_user_id) {
      fetchTasks()
      fetchTeamMembers()
    }
  }, [project, user])

  const fetchProject = async () => {
    if (!user?.auth_user_id) {
      setIsLoading(false)
      return
    }
    
    try {
      const res = await fetch(`/api/projects/${projectUrl}`)
      const result = await res.json()
      
      if (result.success) {
        setProject(result.data)
      } else {
        // Set project with error flag for unauthorized access
        setProject({ 
          error: true, 
          message: result.error, 
          owner: result.data?.owner || null, 
          teamName: result.data?.teamName || null 
        })
      }
    } catch (error) {
      console.error('Error fetching project:', error)
      setProject({ error: true, message: 'Failed to load project', owner: null, teamName: null })
    } finally {
      setIsLoading(false)
    }
  }

  if (authLoading) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading...</p>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  const fetchTasks = async () => {
    if (!project || !user?.auth_user_id) return
    
    try {
      const res = await fetch(`/api/tasks?project_id=${project.project_id}`)
      const result = await res.json()
      
      if (result.success) {
        const decodedTasks = (result.data || []).map((t: any) => decodeTask(t));
        setTasks(decodedTasks);
      }
    } catch (error) {
      console.error('Error fetching tasks:', error)
    }
  }

  const fetchTeamMembers = async () => {
    if (!project || !user?.auth_user_id) {

      return
    }
    
    try {

      const res = await fetch(`/api/teams/${project.team_url}/members`)
      const result = await res.json()
      

      
      if (result.success) {
        // Deduplicate members based on auth_user_id
        const uniqueMembers = Array.from(
          new Map((result.data || []).map((m: any) => [m.auth_user_id, m])).values()
        )
        setTeamMembers(uniqueMembers)
      } else {
        console.error('Failed to fetch team members:', result.error)
      }
    } catch (error) {
      console.error('Error fetching team members:', error)
    }
  }

  const onDragEnd = (result: DropResult) => {
    const { destination, source, draggableId } = result;

    if (!destination) return;

    // If dropped in the same position
    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }

    const taskId = draggableId; // task_id is UUID string now
    const newStatus = parseInt(destination.droppableId);

    // Optimistic update: instantly move the task in the UI
    setTasks(prevTasks => 
      prevTasks.map(task => 
        task.task_id === taskId ? { ...task, status: newStatus } : task
      )
    );

    setLastDroppedId(taskId);
    setTimeout(() => setLastDroppedId(null), 800);

    // Persist to database
    handleUpdateTaskStatus(taskId, newStatus);
  };

  // AI Task Suggestions handler
  const handleAiSuggestTasks = async () => {
    if (!project || !user?.auth_user_id) return
    
    setAiSuggestionsLoading(true)
    setAiSuggestionsOpen(true)
    
    try {
      const existingTasks = tasks.map(t => t.title).join(', ') || 'None'
      
      const prompt = `You are a project management AI. Based on the following project details, suggest 5 NEW tasks that would help complete this project.

PROJECT DETAILS:
- Name: ${project.project_name}
- Description: ${project.description || 'No description'}
- Team: ${project.team_name || 'Unknown'}

EXISTING TASKS (avoid duplicates):
${existingTasks}

Respond with ONLY a JSON array in this exact format (no markdown, no explanation):
[
  {"title": "Task title here", "description": "Brief description", "priority": 2},
  {"title": "Another task", "description": "Description", "priority": 1}
]

Priority: 1=Low, 2=Medium, 3=High
Make the tasks specific, actionable, and relevant to the project. Each task should be different from existing tasks.`

      const response = await fetch('/api/ai/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          max_tokens: 600
        })
      })

      const result = await response.json()

      if (result.limitReached) {
        toast.error(result.error || "Daily limit reached. Try again tomorrow!")
        setAiSuggestionsOpen(false)
        return
      }
      
      if (result.success && result.data) {
        try {
          const cleanedResponse = result.data.replace(/```json\n?|\n?```/g, '').trim()
          const parsed = JSON.parse(cleanedResponse)
          
          if (Array.isArray(parsed)) {
            setAiSuggestions(parsed.slice(0, 5))
          } else {
            toast.error("AI returned unexpected format")
            setAiSuggestionsOpen(false)
          }
        } catch (parseError) {
          console.error('Parse error:', parseError, result.data)
          toast.error("Failed to parse AI response")
          setAiSuggestionsOpen(false)
        }
      } else {
        toast.error(result.error || "AI suggestions failed")
        setAiSuggestionsOpen(false)
      }
    } catch (error) {
      console.error('AI Suggest error:', error)
      toast.error("An error occurred")
      setAiSuggestionsOpen(false)
    } finally {
      setAiSuggestionsLoading(false)
    }
  }

  // Use AI suggestion to fill task form
  const useSuggestion = (suggestion: {title: string; description: string; priority: number}) => {
    setNewTaskTitle(suggestion.title)
    setNewTaskDesc(suggestion.description)
    setNewTaskPriority(suggestion.priority.toString())
    setAiSuggestionsOpen(false)
    setIsCreateDialogOpen(true)
  }

  const handleCreateTask = async () => {
    if (!newTaskTitle.trim() || !project || !user?.auth_user_id) return
    
    try {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newTaskTitle,
          description: newTaskDesc,
          project_id: project.project_id,
          due_date: newTaskDueDate || null,
          priority: parseInt(newTaskPriority),
          assigned_to: selectedAssignees
        })
      })
      
      const result = await res.json()
      
      if (result.success) {
        setNewTaskTitle('')
        setNewTaskDesc('')
        setNewTaskDueDate('')
        setNewTaskPriority('1')
        setSelectedAssignees([])
        setIsCreateDialogOpen(false)
        fetchTasks()
        toast.success("Task created successfully!")
      } else {
        toast.error(result.error || 'Failed to create task')
      }
    } catch (error) {
      console.error('Error creating task:', error)
      toast.error('An error occurred. Please try again.')
    }
  }

  const handleUpdateTaskStatus = async (taskId: string, newStatus: number) => {
    if (!user?.auth_user_id) return
    
    try {
      const res = await fetch('/api/tasks', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          task_id: taskId, 
          status: newStatus 
        })
      })
      
      const result = await res.json()
      
      if (result.success) {
        fetchTasks()
      }
    } catch (error) {
      console.error('Error updating task:', error)
    }
  }

  const handleDeleteTask = async (taskId: string, taskTitle: string) => {
    if (!user?.auth_user_id) return
    if (!confirm(`Delete "${taskTitle}"?`)) return
    
    try {
      const res = await fetch(`/api/tasks?task_id=${taskId}`, {
        method: 'DELETE'
      })
      
      const result = await res.json()
      
      if (result.success) {
        fetchTasks()
      }
    } catch (error) {
      console.error('Error deleting task:', error)
    }
  }

  const handleEditTask = (task: Task) => {
    setEditingTask(task)
    setNewTaskTitle(task.title)
    setNewTaskDesc(task.description || '')
    setNewTaskDueDate(task.due_date ? task.due_date.split('T')[0] : '')
    setNewTaskPriority(task.priority?.toString() || '1')
    
    // Parse assigned users
    if (task.assigned_users) {
      const assignees = task.assigned_users.split('||').map(a => {
        const [userId] = a.split(':')
        return userId
      })
      setSelectedAssignees(assignees)
    } else {
      setSelectedAssignees([])
    }
    
    setIsEditDialogOpen(true)
  }

  const handleUpdateTask = async () => {
    if (!editingTask || !newTaskTitle.trim() || !user?.auth_user_id) return
    
    try {
      const res = await fetch('/api/tasks', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          task_id: editingTask.task_id,
          title: newTaskTitle,
          description: newTaskDesc,
          due_date: newTaskDueDate || null,
          priority: parseInt(newTaskPriority)
        })
      })
      
      const result = await res.json()
      
      if (result.success) {
        // Update assignments
        await fetch('/api/tasks/assign', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            task_id: editingTask.task_id,
            assigned_to: selectedAssignees
          })
        })
        
        setNewTaskTitle('')
        setNewTaskDesc('')
        setNewTaskDueDate('')
        setNewTaskPriority('1')
        setSelectedAssignees([])
        setIsEditDialogOpen(false)
        setEditingTask(null)
        fetchTasks()
        toast.success("Task updated successfully!")
      } else {
        toast.error(result.error || 'Failed to update task')
      }
    } catch (error) {
      console.error('Error updating task:', error)
      toast.error('An error occurred. Please try again.')
    }
  }

  const handleAddMember = async () => {
    if (!newMemberEmail.trim() || !project || !user?.auth_user_id) return
    
    try {
      const res = await fetch(`/api/teams/${project.team_url}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_email: newMemberEmail,
          role: newMemberRole
        })
      })
      
      const result = await res.json()
      
      if (result.success) {
        setNewMemberEmail('')
        setNewMemberRole('member')
        setIsAddMemberOpen(false)
        fetchTeamMembers()
        toast.success(`${result.message}`)
      } else {
        toast.error(result.error || 'Failed to add member')
      }
    } catch (error) {
      console.error('Error adding member:', error)
      toast.error('An error occurred. Please try again.')
    }
  }

  const getDaysDiff = (dueDate: string | null) => {
    if (!dueDate) return null
    const due = new Date(dueDate)
    const today = new Date()
    const diffTime = due.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  // Task details functions
  const openTaskDetails = async (task: Task) => {
    setSelectedTask(task)
    setIsTaskDetailsOpen(true)
    fetchComments(task.task_id)
  }

  const fetchComments = async (taskId: string) => {
    setIsLoadingComments(true)
    try {
      const res = await fetch(`/api/tasks/comments?task_id=${taskId}`)
      const result = await res.json()
      if (result.success) {
        const decodedComments = (result.data || []).map((c: any) => decodeComment(c));
        setComments(decodedComments);
      }
    } catch (error) {
      console.error('Error fetching comments:', error)
    } finally {
      setIsLoadingComments(false)
    }
  }



  const handleAddComment = async () => {
    if (!newComment.trim() || !selectedTask || !user?.auth_user_id) return
    
    try {
      const res = await fetch('/api/tasks/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          task_id: selectedTask.task_id,
          comment_text: newComment
        })
      })
      
      const result = await res.json()
      if (result.success) {
        const decodedComment = decodeComment(result.data);
        setComments(prev => [decodedComment, ...prev])
        setNewComment('')
      }
    } catch (error) {
      console.error('Error adding comment:', error)
    }
  }

  const openDeleteCommentDialog = (commentId: number) => {
    setCommentToDelete(commentId)
    setDeleteCommentDialogOpen(true)
  }

  const handleDeleteComment = async () => {
    if (!user?.auth_user_id || !commentToDelete) return
    
    try {
      const res = await fetch(`/api/tasks/comments?comment_id=${commentToDelete}`, {
        method: 'DELETE'
      })
      
      const result = await res.json()
      if (result.success) {
        setComments(prev => prev.filter(c => c.comment_id !== commentToDelete))
        toast.success('Comment deleted successfully')
      } else {
        toast.error(result.error || 'Failed to delete comment')
      }
    } catch (error) {
      console.error('Error deleting comment:', error)
      toast.error('An error occurred while deleting the comment')
    } finally {
      setDeleteCommentDialogOpen(false)
      setCommentToDelete(null)
    }
  }

  const handleLikeComment = async (commentId: number) => {
    if (!user?.auth_user_id) return
    
    try {
      const res = await fetch('/api/tasks/comments/like', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          comment_id: commentId
        })
      })
      
      const result = await res.json()
      if (result.success) {
        setComments(prev => prev.map(c => 
          c.comment_id === commentId 
            ? { ...c, likes: result.data.likes }
            : c
        ))
      }
    } catch (error) {
      console.error('Error liking comment:', error)
    }
  }


  const handleEditProject = () => {
    setEditProjectName(project.project_name)
    setEditProjectDescription(project.description || "")
    setIsEditProjectDialogOpen(true)
  }

  const handleUpdateProject = async () => {
    if (!editProjectName.trim() || !user?.auth_user_id) return

    try {
      const res = await fetch(`/api/projects/${projectUrl}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          project_name: editProjectName,
          description: editProjectDescription
        })
      })

      const result = await res.json()

      if (result.success) {
        setProject({ ...project, project_name: editProjectName, description: editProjectDescription })
        setIsEditProjectDialogOpen(false)
        toast.success("Project updated successfully!")
      } else {
        toast.error(result.error || 'Failed to update project')
      }
    } catch (error) {
      console.error('Error updating project:', error)
      toast.error('An error occurred. Please try again.')
    }
  }

  const getPriorityColor = (priority: number) => {
    if (priority === 3) return "bg-red-500"
    if (priority === 2) return "bg-orange-500"
    return "bg-blue-500"
  }

  const getPriorityLabel = (priority: number) => {
    if (priority === 3) return "High"
    if (priority === 2) return "Medium"
    return "Low"
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center bg-background">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading project...</p>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  if (!project) return null

  const todoTasks = tasks.filter(t => t.status === 0)
  const inProgressTasks = tasks.filter(t => t.status === 1)
  const doneTasks = tasks.filter(t => t.status === 2)

  // Loading state
  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <Header />
        <main className="flex-1 flex items-center justify-center bg-background">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading project...</p>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  // Login required
  if (!user) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <Header />
        <main className="flex-1 flex items-center justify-center bg-background">
          <div className="text-center px-4 max-w-md">
            <div className="size-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
              <AlertCircle className="size-10 text-primary" />
            </div>
            <h1 className="text-2xl md:text-3xl font-bold mb-3">Login Required</h1>
            <p className="text-muted-foreground mb-6">
              You need to be logged in to access projects and their tasks. Please sign in to continue.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button onClick={() => router.push('/signin')} size="lg" className="w-full sm:w-auto">
                Sign In
              </Button>
              <Button onClick={() => router.push('/signup')} variant="outline" size="lg" className="w-full sm:w-auto">
                Create Account
              </Button>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  // Unauthorized access
  if (project?.error) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <Header />
        <main className="flex-1 flex items-center justify-center bg-background">
          <div className="text-center px-4 max-w-lg">
            <div className="size-20 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-6">
              <AlertCircle className="size-10 text-destructive" />
            </div>
            <h1 className="text-2xl md:text-3xl font-bold mb-3 text-destructive">Unauthorized Access</h1>
            <p className="text-muted-foreground mb-4">
              You are not authorized to view this project. Only team members can access team projects.
            </p>
            {project.teamName && (
              <Alert className="mb-6 border-primary/50 bg-primary/5">
                <AlertDescription className="text-left">
                  <p className="font-semibold mb-2">Need access to this project?</p>
                  <p className="text-sm mb-1">This project belongs to team: <span className="font-semibold text-primary">{project.teamName}</span></p>
                  {project.owner && (
                    <p className="text-sm">
                      Contact the team owner: <span className="font-mono font-semibold text-primary">{project.owner.name}</span>
                    </p>
                  )}
                </AlertDescription>
              </Alert>
            )}
            <Button onClick={() => router.push('/teams')} variant="outline" size="lg">
              <ArrowLeft className="mr-2 size-4" />
              Back to Teams
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  if (!project) {
    return null
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      <main className="flex-1 py-6 bg-background">
        <div className="container px-4 md:px-6">
          {/* Project Header */}
          <div className="mb-6">
            <Button
              variant="ghost"
              className="mb-4"
              onClick={() => router.back()}
            >
              <ArrowLeft className="mr-2 size-4" />
              Back
            </Button>
            
            <div className="flex flex-col gap-4">
              {/* Title Section - Always on top */}
              <div>
                <h1 className="text-2xl md:text-3xl font-bold tracking-tight mb-1">{project.project_name}</h1>
                <p className="text-sm text-muted-foreground">{project.team_name} · {tasks.length} tasks</p>
              </div>
              
              {/* Time + Buttons Row */}
              <div className="flex items-center justify-between">
                {/* Clock on left */}
                <LiveClock compact showSettings={false} />
                
                {/* Buttons on right */}
                <div className="flex items-center gap-2">
                  {/* View Mode Toggle */}
                  <div className="flex items-center rounded-lg border bg-muted/30 p-1">
                    <Button
                      variant={viewMode === 'kanban' ? 'default' : 'ghost'}
                      size="sm"
                      className="h-8 px-3 gap-1.5"
                      onClick={() => setViewMode('kanban')}
                    >
                      <LayoutGrid className="size-4" />
                      <span className="hidden sm:inline">Board</span>
                    </Button>
                    <Button
                      variant={viewMode === 'calendar' ? 'default' : 'ghost'}
                      size="sm"
                      className="h-8 px-3 gap-1.5"
                      onClick={() => setViewMode('calendar')}
                    >
                      <CalendarDays className="size-4" />
                      <span className="hidden sm:inline">Calendar</span>
                    </Button>
                    <Button
                      variant={viewMode === 'ai' ? 'default' : 'ghost'}
                      size="sm"
                      className="h-8 px-3 gap-1.5"
                      onClick={() => setViewMode('ai')}
                    >
                      <Sparkles className="size-4 text-purple-500" />
                      <span className="hidden sm:inline">Marlin AI</span>
                    </Button>
                  </div>
                  

                  {user && (
                    <TeammateRatingModal 
                      projectId={project.project_id} 
                      teamMembers={teamMembers} 
                      currentUserId={user.auth_user_id} 
                    />
                  )}


                {/* AI Task Suggestions Button - Only for owners and admins */}
                {(project.role === 'owner' || project.role === 'admin') && (
                  <Button 
                    variant="outline" 
                    className="gap-2 border-purple-500/30 hover:border-purple-500/50 hover:bg-purple-500/10 text-purple-700 dark:text-purple-400"
                    onClick={handleAiSuggestTasks}
                    disabled={aiSuggestionsLoading}
                  >
                    {aiSuggestionsLoading ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <Sparkles className="size-4" />
                    )}
                    <span className="hidden sm:inline">AI Suggest</span>
                  </Button>
                )}
                
                {/* New Task Button - Only for owners and admins */}
                {(project.role === 'owner' || project.role === 'admin') && (
                  <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="sm:mr-2 size-4" />
                      <span className="hidden sm:inline">New Task</span>
                    </Button>
                  </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Create New Task</DialogTitle>
                    <DialogDescription>Add a task to {project.project_name}</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="taskTitle">Task Title *</Label>
                      <Input
                        id="taskTitle"
                        placeholder="Fix bug in login page"
                        value={newTaskTitle}
                        onChange={(e) => setNewTaskTitle(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="taskDesc">Description</Label>
                        <AIDescriptionButton
                          context={{
                            type: 'task',
                            name: newTaskTitle,
                            teamName: project?.team_name || '',
                          }}
                          onGenerated={(desc) => setNewTaskDesc(desc)}
                          disabled={!newTaskTitle.trim()}
                        />
                      </div>
                      <Textarea
                        id="taskDesc"
                        placeholder="Describe the task..."
                        value={newTaskDesc}
                        onChange={(e) => setNewTaskDesc(e.target.value)}
                        rows={3}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="dueDate">Due Date</Label>
                        <Input
                          id="dueDate"
                          type="date"
                          value={newTaskDueDate}
                          onChange={(e) => setNewTaskDueDate(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="priority">Priority</Label>
                        <Select value={newTaskPriority} onValueChange={setNewTaskPriority}>
                          <SelectTrigger id="priority">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="1">Low</SelectItem>
                            <SelectItem value="2">Medium</SelectItem>
                            <SelectItem value="3">High</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Assign To</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            role="combobox"
                            className="w-full justify-between"
                          >
                            {selectedAssignees.length === 0 ? (
                              "Select team members..."
                            ) : (
                              <span className="flex items-center gap-1">
                                {selectedAssignees.length} member{selectedAssignees.length > 1 ? 's' : ''} selected
                              </span>
                            )}
                            <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[400px] p-0" align="start">
                          <div className="max-h-[300px] overflow-y-auto p-2">
                            {teamMembers.length === 0 ? (
                              <div className="px-4 py-8 text-center text-sm text-muted-foreground">
                                No team members found
                              </div>
                            ) : (
                              teamMembers.map((member) => {
                                const isSelected = selectedAssignees.includes(member.auth_user_id)
                                return (
                                  <div
                                    key={member.auth_user_id}
                                    className={cn(
                                    "flex items-center gap-3 p-3 rounded-lg transition-all duration-200 cursor-pointer",
                                    isSelected 
                                      ? "bg-gradient-to-r from-primary/20 to-primary/10 border-2 border-primary shadow-sm scale-[1.02]" 
                                      : "hover:bg-accent/50 border-2 border-transparent"
                                  )}
                                  onClick={() => {
                                    setSelectedAssignees(prev =>
                                      isSelected
                                        ? prev.filter(id => id !== member.auth_user_id)
                                        : [...prev, member.auth_user_id]
                                    )
                                  }}
                                >
                                  <Avatar className={cn(
                                    "h-10 w-10 transition-all",
                                    isSelected && "ring-2 ring-primary ring-offset-2"
                                  )}>
                                    <AvatarImage src={member.profile_image || undefined} />
                                    <AvatarFallback className={cn(
                                      isSelected && "bg-primary text-primary-foreground"
                                    )}>
                                      {member.first_name?.[0]}{member.last_name?.[0]}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div className="flex-1 min-w-0">
                                    <p className={cn(
                                      "text-sm font-medium truncate transition-colors",
                                      isSelected && "text-primary font-semibold"
                                    )}>
                                      {member.first_name} {member.last_name}
                                    </p>
                                    <p className="text-xs text-muted-foreground capitalize">
                                      {member.role || 'member'}
                                    </p>
                                  </div>
                                  {isSelected && (
                                    <div className="flex-shrink-0 size-8 rounded-full bg-primary flex items-center justify-center">
                                      <Check className="h-5 w-5 text-primary-foreground" />
                                    </div>
                                  )}
                                </div>)
                              })
                            )}
                          </div>
                        </PopoverContent>
                      </Popover>
                      {selectedAssignees.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-2">
                          {selectedAssignees.map((userId) => {
                            const member = teamMembers.find(m => m.auth_user_id === userId)
                            if (!member) return null
                            return (
                              <Badge key={userId} variant="secondary" className="gap-1">
                                {member.first_name} {member.last_name}
                                <X
                                  className="h-3 w-3 cursor-pointer"
                                  onClick={() => {
                                    setSelectedAssignees(prev => prev.filter(id => id !== userId))
                                  }}
                                />
                              </Badge>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                  <DialogFooter>
                    <Button onClick={handleCreateTask} disabled={!newTaskTitle.trim()}>
                      Create Task
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
                )}
                </div>
              </div>
            </div>
          </div>

          {/* Edit Task Dialog */}
          <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Edit Task</DialogTitle>
                <DialogDescription>Update task details</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="editTaskTitle">Task Title *</Label>
                  <Input
                    id="editTaskTitle"
                    placeholder="Fix bug in login page"
                    value={newTaskTitle}
                    onChange={(e) => setNewTaskTitle(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="editTaskDesc">Description</Label>
                    <AIDescriptionButton
                      context={{
                        type: 'task',
                        name: newTaskTitle,
                        teamName: project?.team_name || '',
                      }}
                      onGenerated={(desc) => setNewTaskDesc(desc)}
                      disabled={!newTaskTitle.trim()}
                    />
                  </div>
                  <Textarea
                    id="editTaskDesc"
                    placeholder="Describe the task..."
                    value={newTaskDesc}
                    onChange={(e) => setNewTaskDesc(e.target.value)}
                    rows={3}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="editDueDate">Due Date</Label>
                    <Input
                      id="editDueDate"
                      type="date"
                      value={newTaskDueDate}
                      onChange={(e) => setNewTaskDueDate(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="editPriority">Priority</Label>
                    <Select value={newTaskPriority} onValueChange={setNewTaskPriority}>
                      <SelectTrigger id="editPriority">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">Low</SelectItem>
                        <SelectItem value="2">Medium</SelectItem>
                        <SelectItem value="3">High</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Assign To</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        className="w-full justify-between"
                      >
                        {selectedAssignees.length === 0 ? (
                          "Select team members..."
                        ) : (
                          <span className="flex items-center gap-1">
                            {selectedAssignees.length} member{selectedAssignees.length > 1 ? 's' : ''} selected
                          </span>
                        )}
                        <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[400px] p-0" align="start">
                      <div className="max-h-[300px] overflow-y-auto p-2">
                        {teamMembers.length === 0 ? (
                          <div className="px-4 py-8 text-center text-sm text-muted-foreground">
                            No team members found
                          </div>
                        ) : (
                          teamMembers.map((member) => {
                            const isSelected = selectedAssignees.includes(member.auth_user_id)
                            return (
                              <div
                                key={member.user_id}
                                className={cn(
                                  "flex items-center gap-3 p-3 rounded-lg transition-all duration-200 cursor-pointer",
                                  isSelected 
                                    ? "bg-gradient-to-r from-primary/20 to-primary/10 border-2 border-primary shadow-sm scale-[1.02]" 
                                    : "hover:bg-accent/50 border-2 border-transparent"
                                )}
                                onClick={() => {
                                  setSelectedAssignees(prev =>
                                    isSelected
                                      ? prev.filter(id => id !== member.auth_user_id)
                                      : [...prev, member.auth_user_id]
                                  )
                                }}
                              >
                                <Avatar className={cn(
                                  "h-10 w-10 transition-all",
                                  isSelected && "ring-2 ring-primary ring-offset-2"
                                )}>
                                  <AvatarImage src={member.profile_image || undefined} />
                                  <AvatarFallback className={cn(
                                    isSelected && "bg-primary text-primary-foreground"
                                  )}>
                                    {member.first_name?.[0]}{member.last_name?.[0]}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="flex-1 min-w-0">
                                  <p className={cn(
                                    "text-sm font-medium truncate transition-colors",
                                    isSelected && "text-primary font-semibold"
                                  )}>
                                    {member.first_name}{member.last_name ? ` ${member.last_name}` : ''}
                                  </p>
                                  <p className="text-xs text-muted-foreground capitalize">
                                    {member.role || 'member'}
                                  </p>
                                </div>
                                {isSelected && (
                                  <div className="flex-shrink-0 size-8 rounded-full bg-primary flex items-center justify-center">
                                    <Check className="h-5 w-5 text-primary-foreground" />
                                  </div>
                                )}
                              </div>
                            )
                          })
                        )}
                      </div>
                    </PopoverContent>
                  </Popover>
                  {selectedAssignees.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {selectedAssignees.map((userId) => {
                        const member = teamMembers.find(m => m.user_id === userId)
                        if (!member) return null
                        return (
                          <Badge key={userId} variant="secondary" className="gap-1">
                            {member.first_name} {member.last_name}
                            <X
                              className="h-3 w-3 cursor-pointer"
                              onClick={() => {
                                setSelectedAssignees(prev => prev.filter(id => id !== userId))
                              }}
                            />
                          </Badge>
                        )
                      })}
                    </div>
                  )}
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>Cancel</Button>
                <Button onClick={handleUpdateTask}>Update Task</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Add Member Dialog */}
          <Dialog open={isAddMemberOpen} onOpenChange={setIsAddMemberOpen}>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Add Team Member</DialogTitle>
                <DialogDescription>
                  Invite a user to join {project.team_name}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="memberEmail">User Email *</Label>
                  <Input
                    id="memberEmail"
                    type="email"
                    placeholder="user@example.com"
                    value={newMemberEmail}
                    onChange={(e) => setNewMemberEmail(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="memberRole">Role</Label>
                  <Select value={newMemberRole} onValueChange={setNewMemberRole}>
                    <SelectTrigger id="memberRole">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="member">Member</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddMemberOpen(false)}>Cancel</Button>
                <Button onClick={handleAddMember}>Add Member</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Settings Dialog */}
          <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
            <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Settings className="size-5" />
                  Project & Team Details
                </DialogTitle>
                <DialogDescription>
                  Complete information from database
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-6">
                {/* Project Details Section */}
                <div className="space-y-3">
                  <h3 className="text-lg font-semibold border-b pb-2">Project Information</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground font-medium">Project ID</p>
                      <p className="font-mono">{project.project_id}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground font-medium">Project Name</p>
                      <p>{project.project_name}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground font-medium">Project URL</p>
                      <p className="font-mono text-blue-600">{project.project_url}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground font-medium">Team ID</p>
                      <p className="font-mono">{project.team_id}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground font-medium">Created At</p>
                      <p>{project.created_at ? new Date(project.created_at).toLocaleString() : 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground font-medium">Total Tasks</p>
                      <p className="font-semibold">{tasks.length}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground font-medium">Tasks Status</p>
                      <div className="flex gap-2 mt-1">
                        <Badge variant="secondary">Todo: {tasks.filter(t => t.status === 0).length}</Badge>
                        <Badge variant="secondary">Progress: {tasks.filter(t => t.status === 1).length}</Badge>
                        <Badge variant="secondary">Done: {tasks.filter(t => t.status === 2).length}</Badge>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Team Details Section */}
                <div className="space-y-3">
                  <h3 className="text-lg font-semibold border-b pb-2">Team Information</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground font-medium">Team ID</p>
                      <p className="font-mono">{project.team_id}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground font-medium">Team Name</p>
                      <p>{project.team_name}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground font-medium">Team URL</p>
                      <p className="font-mono text-blue-600">{project.team_url}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground font-medium">Total Members</p>
                      <p className="font-semibold">{teamMembers.length}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground font-medium">Your Role</p>
                      <Badge variant="outline" className="capitalize">{project.role}</Badge>
                    </div>
                  </div>
                </div>

                {/* Team Members Section */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between border-b pb-2">
                    <h3 className="text-lg font-semibold">Team Members ({teamMembers.length})</h3>
                    {(project.role === 'owner' || project.role === 'admin') && (
                      <Button size="sm" variant="outline" onClick={() => setIsAddMemberOpen(true)}>
                        <Plus className="mr-1 size-3" />
                        Add Member
                      </Button>
                    )}
                  </div>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {teamMembers.map((member) => (
                      <div key={member.auth_user_id} className="flex items-center justify-between p-3 rounded-lg border bg-card">
                        <div className="flex items-center gap-3">
                          <PlanAvatar
                            src={member.profile_image}
                            plan={member.plan}
                            fallback={<>{member.first_name?.[0]}{member.last_name?.[0]}</>}
                            size="md"
                          />
                          <div>
                            <p className="font-medium text-sm">{member.first_name} {member.last_name}</p>
                            <p className="text-xs text-muted-foreground">{member.email}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge variant={member.role === 'owner' ? 'default' : 'secondary'} className="capitalize">
                            {member.role}
                          </Badge>
                          <p className="text-xs text-muted-foreground mt-1">ID: {member.user_id}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          {/* Task Details Dialog */}
          <Dialog open={isTaskDetailsOpen} onOpenChange={setIsTaskDetailsOpen}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
              <DialogHeader>
                <DialogTitle className="text-xl">{selectedTask?.title}</DialogTitle>
                <DialogDescription>
                  {selectedTask?.description}
                </DialogDescription>
              </DialogHeader>

              <div className="flex-1 overflow-y-auto">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Main Content - Comments */}
                  <div className="lg:col-span-2 space-y-4">
                    {/* Task Info */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="outline" className={cn("text-xs", getPriorityColor(selectedTask?.priority || 1), "text-white border-0")}>
                        {getPriorityLabel(selectedTask?.priority || 1)}
                      </Badge>
                      {selectedTask?.due_date && (
                        <Badge variant="outline" className="text-xs">
                          <Calendar className="mr-1 size-3" />
                          Due: {new Date(selectedTask.due_date).toLocaleDateString()}
                        </Badge>
                      )}
                      <Badge variant="outline" className="text-xs capitalize">
                        {selectedTask?.status === 0 ? 'To Do' : selectedTask?.status === 1 ? 'In Progress' : 'Done'}
                      </Badge>
                    </div>

                    <Separator />

                    {/* Comments Section */}
                    <div className="space-y-3">
                      <h3 className="font-semibold flex items-center gap-2">
                        <MessageSquare className="size-4" />
                        Comments ({comments.length})
                      </h3>
                      
                      {/* Add Comment Form */}
                      <div className="flex gap-2">
                        <PlanAvatar
                          src={user?.profile_image}
                          plan={user?.plan}
                          fallback={<>{user?.first_name?.[0]}{user?.last_name?.[0]}</>}
                          size="sm"
                        />
                        <div className="flex-1 flex gap-2">
                          <Input
                            placeholder="Add a comment..."
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleAddComment()}
                          />
                          <Button size="sm" onClick={handleAddComment} disabled={!newComment.trim()}>
                            <Send className="size-4" />
                          </Button>
                        </div>
                      </div>

                      {/* Comments List */}
                      <ScrollArea className="h-[300px] pr-4">
                        {isLoadingComments ? (
                          <div className="text-center py-8 text-sm text-muted-foreground">Loading comments...</div>
                        ) : comments.length === 0 ? (
                          <div className="text-center py-8 text-sm text-muted-foreground">No comments yet. Be the first to comment!</div>
                        ) : (
                          <div className="space-y-4">
                            {comments.map((comment) => (
                              <div key={comment.comment_id} className="flex gap-3">
                                <PlanAvatar
                                  src={comment.profile_image || undefined}
                                  plan={comment.plan as any}
                                  fallback={<span className="text-xs">{comment.first_name?.[0]}{comment.last_name?.[0]}</span>}
                                  size="sm"
                                />
                                <div className="flex-1 space-y-1">
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                      <p className="text-sm font-medium">
                                        {comment.first_name} {comment.last_name}
                                      </p>
                                      <p className="text-xs text-muted-foreground">
                                        {new Date(comment.created_at).toLocaleString()}
                                      </p>
                                    </div>
                                    {/* Delete Comment Button: Author OR Admin/Owner */}
                                    {(comment.auth_user_id === user?.auth_user_id || isAdminOrOwner) && (
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="size-6 text-muted-foreground hover:text-red-500 hover:bg-red-500/10"
                                        onClick={() => openDeleteCommentDialog(comment.comment_id)}
                                      >
                                        <X className="size-3" />
                                      </Button>
                                    )}
                                  </div>
                                  <p className="text-sm bg-muted p-2 rounded-lg">{comment.comment_text}</p>
                                  <div className="flex items-center gap-2 mt-1">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-7 px-2 text-xs hover:text-red-500 transition-colors"
                                      onClick={() => handleLikeComment(comment.comment_id)}
                                    >
                                      <Heart className={cn("size-3 mr-1", (comment.likes || 0) > 0 && "fill-red-500 text-red-500")} />
                                      <span className="font-medium">{comment.likes || 0}</span>
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </ScrollArea>
                    </div>
                  </div>

                  {/* Sidebar - Assignments & Files */}
                  <div className="space-y-4">
                    {/* Assigned To Section */}
                    <div className="space-y-2">
                      <h3 className="font-semibold text-sm flex items-center gap-2">
                        <User className="size-4" />
                        Assigned To
                      </h3>
                      <div className="space-y-2">
                        {selectedTask?.assigned_users ? (
                          (() => {
                            // Parse and deduplicate assignees by userId
                            const assignees = selectedTask.assigned_users.split('||').map((assignee: string) => {
                              const parts = assignee.split(':')
                              return {
                                userId: parts[0],
                                name: parts[1] || '',
                                profileImage: parts.slice(2).join(':') || ''
                              }
                            })
                            // Remove duplicates based on userId
                            const uniqueAssignees = Array.from(
                              new Map(assignees.map(a => [a.userId, a])).values()
                            )
                            return uniqueAssignees.map((assignee) => {
                              const memberPlan = teamMembers.find(m => m.auth_user_id === assignee.userId)?.plan
                              return (
                                <div key={assignee.userId} className="flex items-center gap-2 text-sm">
                                  <PlanAvatar
                                    src={assignee.profileImage || undefined}
                                    plan={memberPlan}
                                    fallback={<span className="text-xs">{assignee.name.split(' ').map((n: string) => n[0]).join('')}</span>}
                                    size="sm"
                                  />
                                  <span>{assignee.name}</span>
                                </div>
                              )
                            })
                          })()
                        ) : (
                          <p className="text-sm text-muted-foreground">No one assigned</p>
                        )}
                      </div>
                      {(project?.role === 'owner' || project?.role === 'admin') && (
                        <Button size="sm" variant="outline" className="w-full mt-2" onClick={() => handleEditTask(selectedTask!)}>
                          <User className="mr-1 size-3" />
                          Assign Members
                        </Button>
                      )}
                    </div>

                    <Separator />

                    {/* Documentation Section */}
                    <div className="space-y-2">
                      <TaskDocEditor
                        taskId={selectedTask?.task_id || ""}
                        userId={user?.auth_user_id || ""}
                        canEdit={
                          selectedTask?.auth_user_id === user?.auth_user_id ||
                          project?.role === 'owner' ||
                          project?.role === 'admin'
                        }
                      />
                    </div>
                  </div>
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setIsTaskDetailsOpen(false)}>Close</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* AI Task Suggestions Dialog */}
          <Dialog open={aiSuggestionsOpen} onOpenChange={setAiSuggestionsOpen}>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Sparkles className="size-5 text-purple-500" />
                  AI Task Suggestions
                </DialogTitle>
                <DialogDescription>
                  AI-generated task ideas based on your project. Click any suggestion to use it.
                </DialogDescription>
              </DialogHeader>
              
              {aiSuggestionsLoading ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <Loader2 className="size-8 animate-spin text-purple-500 mb-4" />
                  <p className="text-muted-foreground">Analyzing your project...</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[400px] overflow-y-auto">
                  {aiSuggestions.map((suggestion, index) => (
                    <div
                      key={index}
                      className="p-4 border rounded-lg hover:border-purple-500/50 hover:bg-purple-500/5 cursor-pointer transition-all group"
                      onClick={() => useSuggestion(suggestion)}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <h4 className="font-medium group-hover:text-purple-700 dark:group-hover:text-purple-400 transition-colors">
                            {suggestion.title}
                          </h4>
                          <p className="text-sm text-muted-foreground mt-1">
                            {suggestion.description}
                          </p>
                        </div>
                        <Badge 
                          variant="outline" 
                          className={cn(
                            "shrink-0",
                            suggestion.priority === 3 && "border-red-500 text-red-500",
                            suggestion.priority === 2 && "border-yellow-500 text-yellow-500",
                            suggestion.priority === 1 && "border-green-500 text-green-500"
                          )}
                        >
                          {suggestion.priority === 3 ? 'High' : suggestion.priority === 2 ? 'Medium' : 'Low'}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                        <Plus className="size-3" />
                        <span>Click to add this task</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <DialogFooter>
                <Button variant="outline" onClick={() => setAiSuggestionsOpen(false)}>
                  Close
                </Button>
                <Button 
                  onClick={handleAiSuggestTasks} 
                  disabled={aiSuggestionsLoading}
                  className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                >
                  {aiSuggestionsLoading ? (
                    <>
                      <Loader2 className="mr-2 size-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 size-4" />
                      Regenerate
                    </>
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Edit Project Dialog */}
          <Dialog open={isEditProjectDialogOpen} onOpenChange={setIsEditProjectDialogOpen}>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Edit Project</DialogTitle>
                <DialogDescription>
                  Update your project's name and description
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-project-name">Project Name *</Label>
                  <Input
                    id="edit-project-name"
                    placeholder="My Project"
                    value={editProjectName}
                    onChange={(e) => setEditProjectName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="edit-project-description">Description</Label>
                    <AIDescriptionButton
                      context={{
                        type: 'project',
                        name: editProjectName,
                        teamName: project?.team_name || '',
                      }}
                      onGenerated={(desc) => setEditProjectDescription(desc)}
                      disabled={!editProjectName.trim()}
                    />
                  </div>
                  <Textarea
                    id="edit-project-description"
                    placeholder="Describe what this project is about..."
                    value={editProjectDescription}
                    onChange={(e) => setEditProjectDescription(e.target.value)}
                    rows={4}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setIsEditProjectDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleUpdateProject}
                  disabled={!editProjectName.trim()}
                >
                  Save Changes
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* View Mode: Calendar */}
          {viewMode === 'calendar' && (
            <div className="mt-2">
              <TaskCalendar tasks={tasks} onTaskClick={openTaskDetails} />
            </div>
          )}

          {/* View Mode: AI Team Member */}
          {viewMode === 'ai' && (
            <div className="mt-4">
              <AITeamMemberPanel projectId={project.project_id} teamId={project.team_id} />
            </div>
          )}

          {/* View Mode: Kanban Board */}
          {viewMode === 'kanban' && (
          <DragDropContext onDragEnd={onDragEnd}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
              {/* To Do Column */}
              <Droppable droppableId="0">
                {(provided) => (
                  <div 
                    className="space-y-3"
                    {...provided.droppableProps}
                    ref={provided.innerRef}
                  >
                    <div className="flex items-center gap-2">
                      <div className="size-2 rounded-full bg-gray-500"></div>
                      <h3 className="font-semibold">To Do</h3>
                      <Badge variant="secondary" className="ml-auto">{todoTasks.length}</Badge>
                    </div>
                    <div className="space-y-3 min-h-[150px]">
                      {todoTasks.map((task, index) => (
                        <Draggable key={task.task_id} draggableId={task.task_id.toString()} index={index}>
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                            >
                              <TaskCard
                                task={task}
                                onStatusChange={handleUpdateTaskStatus}
                                onDelete={handleDeleteTask}
                                onEdit={handleEditTask}
                                onOpenDetails={openTaskDetails}
                                userRole={project.role}
                                getDaysDiff={getDaysDiff}
                                getPriorityColor={getPriorityColor}
                                getPriorityLabel={getPriorityLabel}
                                currentUserId={user?.auth_user_id}
                                isDragging={snapshot.isDragging}
                                isRecentlyDropped={lastDroppedId === task.task_id}
                                teamMembers={teamMembers}
                              />
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                      {todoTasks.length === 0 && (
                        <div className="text-center py-8 text-sm text-muted-foreground">
                          No tasks
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </Droppable>

              {/* In Progress Column */}
              <Droppable droppableId="1">
                {(provided) => (
                  <div 
                    className="space-y-3"
                    {...provided.droppableProps}
                    ref={provided.innerRef}
                  >
                    <div className="flex items-center gap-2">
                      <div className="size-2 rounded-full bg-blue-500"></div>
                      <h3 className="font-semibold">In Progress</h3>
                      <Badge variant="secondary" className="ml-auto">{inProgressTasks.length}</Badge>
                    </div>
                    <div className="space-y-3 min-h-[150px]">
                      {inProgressTasks.map((task, index) => (
                        <Draggable key={task.task_id} draggableId={task.task_id.toString()} index={index}>
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                            >
                              <TaskCard
                                task={task}
                                onStatusChange={handleUpdateTaskStatus}
                                onDelete={handleDeleteTask}
                                onEdit={handleEditTask}
                                onOpenDetails={openTaskDetails}
                                userRole={project.role}
                                getDaysDiff={getDaysDiff}
                                getPriorityColor={getPriorityColor}
                                getPriorityLabel={getPriorityLabel}
                                currentUserId={user?.auth_user_id}
                                isDragging={snapshot.isDragging}
                                isRecentlyDropped={lastDroppedId === task.task_id}
                                teamMembers={teamMembers}
                              />
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                      {inProgressTasks.length === 0 && (
                        <div className="text-center py-8 text-sm text-muted-foreground">
                          No tasks
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </Droppable>

              {/* Done Column */}
              <Droppable droppableId="2">
                {(provided) => (
                  <div 
                    className="space-y-3"
                    {...provided.droppableProps}
                    ref={provided.innerRef}
                  >
                    <div className="flex items-center gap-2">
                      <div className="size-2 rounded-full bg-green-500"></div>
                      <h3 className="font-semibold">Done</h3>
                      <Badge variant="secondary" className="ml-auto">{doneTasks.length}</Badge>
                    </div>
                    <div className="space-y-3 min-h-[150px]">
                      {doneTasks.map((task, index) => (
                        <Draggable key={task.task_id} draggableId={task.task_id.toString()} index={index}>
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                            >
                              <TaskCard
                                task={task}
                                onStatusChange={handleUpdateTaskStatus}
                                onDelete={handleDeleteTask}
                                onEdit={handleEditTask}
                                onOpenDetails={openTaskDetails}
                                userRole={project.role}
                                getDaysDiff={getDaysDiff}
                                getPriorityColor={getPriorityColor}
                                getPriorityLabel={getPriorityLabel}
                                currentUserId={user?.auth_user_id}
                                isDragging={snapshot.isDragging}
                                isRecentlyDropped={lastDroppedId === task.task_id}
                                teamMembers={teamMembers}
                              />
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                      {doneTasks.length === 0 && (
                        <div className="text-center py-8 text-sm text-muted-foreground">
                          No tasks
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </Droppable>
            </div>
          </DragDropContext>
          )}

          {/* Delete Comment Confirmation Dialog */}
          <Dialog open={deleteCommentDialogOpen} onOpenChange={setDeleteCommentDialogOpen}>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Delete Comment</DialogTitle>
                <DialogDescription>
                  Are you sure you want to delete this comment? This action cannot be undone.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button 
                  variant="outline" 
                  onClick={() => setDeleteCommentDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button 
                  variant="destructive" 
                  onClick={handleDeleteComment}
                >
                  Delete
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </main>
      <Footer />
    </div>
  )
}

// Task Card Component
function TaskCard({ 
  task, 
  onStatusChange, 
  onDelete,
  onEdit,
  onOpenDetails,
  userRole,
  getDaysDiff,
  getPriorityColor,
  getPriorityLabel,
  currentUserId,
  isDragging,
  isRecentlyDropped,
  teamMembers
}: {
  task: Task
  onStatusChange: (id: string, status: number) => void
  onDelete: (id: string, title: string) => void
  onEdit: (task: Task) => void
  onOpenDetails: (task: Task) => void
  userRole: string
  getDaysDiff: (date: string | null) => number | null
  getPriorityColor: (priority: number) => string
  getPriorityLabel: (priority: number) => string
  currentUserId?: string
  isDragging?: boolean
  isRecentlyDropped?: boolean
  teamMembers: any[]
}) {
  const daysDiff = getDaysDiff(task.due_date)
  const isOverdue = daysDiff !== null && daysDiff < 0
  const isDueSoon = daysDiff !== null && daysDiff >= 0 && daysDiff <= 2

  // Priority border colors
  const getBorderColor = (priority: number) => {
    switch (priority) {
      case 3: return 'border-l-red-500'
      case 2: return 'border-l-orange-400'
      case 1: return 'border-l-blue-400'
      default: return 'border-l-gray-300'
    }
  }

  return (
    <motion.div
      initial={false}
      animate={isDragging ? {
        scale: 1.05,
        rotate: [0, -1, 1, -1, 0],
        zIndex: 50,
      } : {
        scale: 1,
        rotate: 0,
        zIndex: 1,
      }}
      transition={isDragging ? {
        rotate: { repeat: Infinity, duration: 0.15 },
        default: { duration: 0.1 }
      } : { duration: 0.2 }}
      className="relative"
    >
      <AnimatePresence>
        {isRecentlyDropped && (
          <div className="absolute inset-0 pointer-events-none z-50">
            {/* Spark Center Flash */}
            <motion.div
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: [0, 1, 0], scale: [0.5, 1.5, 2] }}
              transition={{ duration: 0.4 }}
              className="absolute inset-0 bg-primary/20 rounded-xl blur-xl"
            />
            {/* Particle Sparks */}
            {[...Array(12)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute top-1/2 left-1/2 w-1.5 h-1.5 bg-primary rounded-full shadow-[0_0_10px_2px_rgba(59,130,246,0.5)]"
                initial={{ x: 0, y: 0, scale: 0 }}
                animate={{ 
                  x: (Math.random() - 0.5) * 200, 
                  y: (Math.random() - 0.5) * 200, 
                  scale: [0, 1.5, 0],
                  opacity: [1, 1, 0]
                }}
                transition={{ 
                  duration: 0.6, 
                  ease: "easeOut",
                  delay: Math.random() * 0.1 
                }}
              />
            ))}
          </div>
        )}
      </AnimatePresence>

      <Card className={cn(
        "group hover:shadow-lg transition-all duration-200 border-l-4 cursor-pointer relative overflow-hidden",
        getBorderColor(task.priority),
        isDragging && "shadow-2xl ring-2 ring-primary ring-offset-2 border-l-primary bg-primary/5"
      )}
      onClick={() => onOpenDetails(task)}
      >
        {/* Carrying Glow Overlay */}
        {isDragging && (
          <motion.div 
            className="absolute inset-0 bg-gradient-to-tr from-primary/10 via-transparent to-primary/5"
            animate={{ opacity: [0.3, 0.6, 0.3] }}
            transition={{ duration: 1, repeat: Infinity }}
          />
        )}
      <CardHeader className="p-3 pb-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-sm font-semibold line-clamp-2 mb-1">
              {task.title}
            </CardTitle>
            {task.description && (
              <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                {task.description}
              </p>
            )}
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
              <Button 
                variant="ghost" 
                size="icon" 
                className="size-7 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
              >
                <MoreVertical className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {(userRole === 'owner' || userRole === 'admin') && (
                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onEdit(task); }}>
                  <Edit className="mr-2 size-3" />
                  Edit
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onStatusChange(task.task_id, 0); }}>
                Move to To Do
              </DropdownMenuItem>
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onStatusChange(task.task_id, 1); }}>
                Move to In Progress
              </DropdownMenuItem>
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onStatusChange(task.task_id, 2); }}>
                Move to Done
              </DropdownMenuItem>
              
              {/* Delete Task: Creator OR Admin/Owner */}
              {(task.auth_user_id === currentUserId || userRole === 'owner' || userRole === 'admin') && (
                <DropdownMenuItem 
                  onClick={(e) => { e.stopPropagation(); onDelete(task.task_id, task.title); }}
                  className="text-destructive"
                >
                  <Trash2 className="mr-2 size-3" />
                  Delete
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      
      <CardContent className="p-3 pt-0 space-y-2">
        {/* Priority and Due Date Row */}
        <div className="flex items-center gap-2 flex-wrap">
          <Badge 
            variant="outline" 
            className={cn(
              "text-xs font-medium border-0",
              task.priority === 3 && "bg-red-100 text-red-700",
              task.priority === 2 && "bg-orange-100 text-orange-700",
              task.priority === 1 && "bg-blue-100 text-blue-700"
            )}
          >
            {getPriorityLabel(task.priority)}
          </Badge>
          
          {task.due_date && (
            <Badge 
              variant="outline" 
              className={cn(
                "text-xs",
                isOverdue && "bg-red-50 text-red-700 border-red-200",
                isDueSoon && !isOverdue && "bg-yellow-50 text-yellow-700 border-yellow-200",
                !isOverdue && !isDueSoon && "bg-muted text-muted-foreground"
              )}
            >
              <Calendar className="mr-1 size-3" />
              {new Date(task.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </Badge>
          )}
        </div>

        {/* Assigned Users Avatars */}
        {task.assigned_users && (() => {
          const assignees = task.assigned_users.split('||').map((a: string) => {
            const parts = a.split(':')
            return {
              userId: parts[0],
              name: parts[1] || '',
              profileImage: parts.slice(2).join(':') || ''
            }
          })
          // Remove duplicates based on userId
          const uniqueAssignees = Array.from(
            new Map(assignees.map(a => [a.userId, a])).values()
          )
          return uniqueAssignees.length > 0 && (
            <div className="flex items-center -space-x-2">
              {uniqueAssignees.slice(0, 3).map((assignee: any) => {
                const memberPlan = teamMembers.find((m: any) => m.auth_user_id === assignee.userId)?.plan
                return (
                  <PlanAvatar
                    key={assignee.userId}
                    src={assignee.profileImage || undefined}
                    plan={memberPlan}
                    fallback={<span className="text-[10px] bg-primary/10">{assignee.name.split(' ').map((n: string) => n[0]).join('')}</span>}
                    size="sm"
                  />
                )
              })}
              {uniqueAssignees.length > 3 && (
                <div className="size-7 rounded-full bg-muted border-2 border-background flex items-center justify-center text-[10px] font-semibold">
                  +{uniqueAssignees.length - 3}
                </div>
              )}
            </div>
          )
        })()}

        {/* Comments Count */}
        {task.comment_count > 0 && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground pt-1">
            <MessageSquare className="size-3" />
            <span>{task.comment_count} {task.comment_count === 1 ? 'comment' : 'comments'}</span>
          </div>
        )}
      </CardContent>
    </Card>
    </motion.div>
  )
}
