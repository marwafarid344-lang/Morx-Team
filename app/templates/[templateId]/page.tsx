'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'
import { 
  Star, 
  ArrowLeft, 
  Layout, 
  Code, 
  Palette, 
  Megaphone, 
  Package,
  Briefcase,
  Loader2,
  CheckCircle2,
  TrendingUp,
  Calendar,
  User,
  ListTodo,
  Rocket,
  AlertCircle,
  Trash2,
  Pencil,
  Plus,
  Wand2
} from 'lucide-react'
import { Header } from '@/components/header'
import { Footer } from '@/components/footer'

interface TemplateTask {
  template_task_id: number
  task_title: string
  task_description: string | null
  suggested_priority: string
  order_index: number
}

interface Template {
  template_id: number
  template_name: string
  description: string | null
  category: string | null
  is_builtin: boolean
  auth_user_id: string | null
  language: string
  rating_avg: number
  usage_count: number
  created_at: string
  users?: {
    first_name: string
    last_name: string
    email?: string
  } | null
  tasks: TemplateTask[]
}

interface Project {
  project_id: number
  project_name: string
  team_id: number
}

interface Team {
  team_id: number
  team_name: string
}

const getCategoryIcon = (category: string | null) => {
  switch (category?.toLowerCase()) {
    case 'development':
      return <Code className="size-5" />
    case 'marketing':
      return <Megaphone className="size-5" />
    case 'design':
      return <Palette className="size-5" />
    case 'product':
      return <Package className="size-5" />
    case 'business':
      return <Briefcase className="size-5" />
    default:
      return <Layout className="size-5" />
  }
}

const getPriorityColor = (priority: string) => {
  switch (priority?.toLowerCase()) {
    case 'urgent':
      return 'bg-red-500/10 text-red-600 border-red-500/20'
    case 'high':
      return 'bg-orange-500/10 text-orange-600 border-orange-500/20'
    case 'medium':
      return 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20'
    case 'low':
      return 'bg-green-500/10 text-green-600 border-green-500/20'
    default:
      return 'bg-muted text-muted-foreground'
  }
}

const StarRating = ({ rating }: { rating: number }) => (
  <div className="flex items-center gap-0.5">
    {[1, 2, 3, 4, 5].map((star) => (
      <Star
        key={star}
        className={`size-4 ${
          star <= Math.round(rating)
            ? 'fill-yellow-400 text-yellow-400'
            : 'text-muted-foreground/30'
        }`}
      />
    ))}
  </div>
)

export default function TemplateDetailPage() {
  const router = useRouter()
  const params = useParams()
  const templateId = params.templateId as string

  const [template, setTemplate] = useState<Template | null>(null)
  const [loading, setLoading] = useState(true)
  const [applyDialogOpen, setApplyDialogOpen] = useState(false)
  const [teams, setTeams] = useState<Team[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [selectedTeam, setSelectedTeam] = useState('')
  const [selectedProject, setSelectedProject] = useState('')
  const [loadingProjects, setLoadingProjects] = useState(false)
  const [applying, setApplying] = useState(false)
  const [userRating, setUserRating] = useState(0)
  const [ratingDialogOpen, setRatingDialogOpen] = useState(false)
  const [submittingRating, setSubmittingRating] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  
  // Edit template state
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [editName, setEditName] = useState('')
  const [editDescription, setEditDescription] = useState('')
  const [editCategory, setEditCategory] = useState('')
  const [editTasks, setEditTasks] = useState<{title: string, description: string, priority: string}[]>([])
  const [saving, setSaving] = useState(false)
  const [generatingDescription, setGeneratingDescription] = useState(false)
  const [suggestingTasks, setSuggestingTasks] = useState(false)

  // Get current user ID
  useEffect(() => {
    const session = localStorage.getItem('student_session')
    if (session) {
      try {
        const parsed = JSON.parse(session)
        setCurrentUserId(parsed.auth_user_id || parsed.id)
      } catch (e) {
        console.error('Error parsing session:', e)
      }
    }
  }, [])

  const fetchTemplate = useCallback(async () => {
    try {
      setLoading(true)
      const res = await fetch(`/api/templates/${templateId}`, {
        credentials: 'include'
      })
      const data = await res.json()
      
      if (data.success) {
        setTemplate(data.data)
      } else {
        toast.error(data.error || 'Template not found')
        router.push('/templates')
      }
    } catch (error) {
      console.error('Error fetching template:', error)
      toast.error('Failed to load template')
      router.push('/templates')
    } finally {
      setLoading(false)
    }
  }, [templateId, router])

  const fetchTeams = async () => {
    try {
      const res = await fetch('/api/teams', { credentials: 'include' })
      const data = await res.json()
      if (data.success) {
        setTeams(data.data || [])
      }
    } catch (error) {
      console.error('Error fetching teams:', error)
    }
  }

  const fetchProjects = async (teamId: string) => {
    try {
      setLoadingProjects(true)
      const res = await fetch(`/api/projects?team_id=${teamId}`, { credentials: 'include' })
      const data = await res.json()
      if (data.success) {
        setProjects(data.data || [])
      }
    } catch (error) {
      console.error('Error fetching projects:', error)
    } finally {
      setLoadingProjects(false)
    }
  }

  useEffect(() => {
    fetchTemplate()
  }, [fetchTemplate])

  useEffect(() => {
    if (applyDialogOpen) {
      fetchTeams()
    }
  }, [applyDialogOpen])

  useEffect(() => {
    if (selectedTeam) {
      setSelectedProject('')
      fetchProjects(selectedTeam)
    }
  }, [selectedTeam])

  const handleApplyTemplate = async () => {
    if (!selectedProject) {
      toast.error('Please select a project')
      return
    }

    try {
      setApplying(true)
      const res = await fetch(`/api/templates/${templateId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ project_id: parseInt(selectedProject) })
      })

      const data = await res.json()
      if (data.success) {
        toast.success(`${data.data.tasks_created} tasks created successfully!`)
        setApplyDialogOpen(false)
        fetchTemplate() // Refresh to show updated usage count
      } else {
        toast.error(data.error || 'Failed to apply template')
      }
    } catch (error) {
      console.error('Error applying template:', error)
      toast.error('Failed to apply template')
    } finally {
      setApplying(false)
    }
  }

  const handleRateTemplate = async (rating: number) => {
    try {
      setSubmittingRating(true)
      const res = await fetch(`/api/templates/${templateId}/rate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ rating })
      })

      const data = await res.json()
      if (data.success) {
        toast.success(data.message || 'Rating submitted!')
        setRatingDialogOpen(false)
        fetchTemplate()
      } else {
        toast.error(data.error || 'Failed to submit rating')
      }
    } catch (error) {
      console.error('Error rating template:', error)
      toast.error('Failed to submit rating')
    } finally {
      setSubmittingRating(false)
    }
  }

  const getCreatorName = () => {
    if (!template) return 'Unknown'
    if (template.is_builtin) return 'Morx Team'
    if (template.users) {
      return `${template.users.first_name || ''} ${template.users.last_name || ''}`.trim() || 'Community'
    }
    return 'Community'
  }

  const isCreator = currentUserId && template?.auth_user_id === currentUserId

  const handleDeleteTemplate = async () => {
    try {
      setDeleting(true)
      const res = await fetch(`/api/templates/${templateId}`, {
        method: 'DELETE',
        credentials: 'include'
      })

      const data = await res.json()
      if (data.success) {
        toast.success('Template deleted successfully!')
        router.push('/templates')
      } else {
        toast.error(data.error || 'Failed to delete template')
      }
    } catch (error) {
      console.error('Error deleting template:', error)
      toast.error('Failed to delete template')
    } finally {
      setDeleting(false)
      setDeleteDialogOpen(false)
    }
  }

  const openEditDialog = () => {
    if (template) {
      setEditName(template.template_name)
      setEditDescription(template.description || '')
      setEditCategory(template.category || '')
      setEditTasks(template.tasks.map(t => ({
        title: t.task_title,
        description: t.task_description || '',
        priority: t.suggested_priority || 'medium'
      })))
      setEditDialogOpen(true)
    }
  }

  const addEditTask = () => {
    setEditTasks([...editTasks, { title: '', description: '', priority: 'medium' }])
  }

  const removeEditTask = (index: number) => {
    if (editTasks.length > 1) {
      setEditTasks(editTasks.filter((_, i) => i !== index))
    }
  }

  const updateEditTask = (index: number, field: 'title' | 'description' | 'priority', value: string) => {
    const updated = [...editTasks]
    updated[index][field] = value
    setEditTasks(updated)
  }

  const handleSaveTemplate = async () => {
    if (!editName.trim()) {
      toast.error('Template name is required')
      return
    }

    const validTasks = editTasks.filter(t => t.title.trim())
    if (validTasks.length === 0) {
      toast.error('At least one task is required')
      return
    }

    try {
      setSaving(true)
      const res = await fetch(`/api/templates/${templateId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          template_name: editName.trim(),
          description: editDescription.trim() || null,
          category: editCategory || null,
          tasks: validTasks
        })
      })

      const data = await res.json()
      if (data.success) {
        toast.success('Template updated successfully!')
        setEditDialogOpen(false)
        fetchTemplate()
      } else {
        toast.error(data.error || 'Failed to update template')
      }
    } catch (error) {
      console.error('Error updating template:', error)
      toast.error('Failed to update template')
    } finally {
      setSaving(false)
    }
  }

  const handleGenerateEditDescription = async () => {
    if (!editName.trim()) {
      toast.error('Please enter a template name first')
      return
    }

    if (!currentUserId) {
      toast.error('Please sign in to use this feature')
      return
    }

    try {
      setGeneratingDescription(true)
      
      const prompt = `Generate a concise, professional description (2-3 sentences max) for a task template named "${editName}"${editCategory ? ` in the ${editCategory} category` : ''}. The description should explain what the template is for and who would benefit from using it. Return ONLY the description text, no quotes or extra formatting.`

      const response = await fetch('/api/ai/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          max_tokens: 150,
          userId: currentUserId
        })
      })

      const result = await response.json()
      
      if (result.limitReached) {
        toast.error(result.error || 'Daily limit reached. Try again tomorrow!')
        return
      }
      
      if (result.success && result.data) {
        const cleanedDescription = result.data.replace(/^"|"$/g, '').trim()
        setEditDescription(cleanedDescription)
        toast.success('Description generated successfully!')
      } else {
        toast.error(result.error || 'Failed to generate description')
      }
    } catch (error) {
      console.error('Error generating description:', error)
      toast.error('An error occurred while generating description')
    } finally {
      setGeneratingDescription(false)
    }
  }

  const handleSuggestEditTasks = async () => {
    if (!editName.trim()) {
      toast.error('Please enter a template name first')
      return
    }

    if (!currentUserId) {
      toast.error('Please sign in to use this feature')
      return
    }

    try {
      setSuggestingTasks(true)
      
      const prompt = `Suggest 5 practical tasks for a template named "${editName}"${editCategory ? ` in the ${editCategory} category` : ''}${editDescription ? `. Description: ${editDescription}` : ''}.

Respond with ONLY a JSON array in this exact format (no markdown, no explanation):
[{"title": "Task title", "description": "Brief description", "priority": "low|medium|high|urgent"}]

Make the tasks practical, actionable, and logically ordered.`

      const response = await fetch('/api/ai/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          max_tokens: 500,
          userId: currentUserId
        })
      })

      const result = await response.json()
      
      if (result.limitReached) {
        toast.error(result.error || 'Daily limit reached. Try again tomorrow!')
        return
      }
      
      if (result.success && result.data) {
        try {
          const cleanedResponse = result.data.replace(/```json\n?|\n?```/g, '').trim()
          const suggestedTasks = JSON.parse(cleanedResponse)
          
          if (Array.isArray(suggestedTasks) && suggestedTasks.length > 0) {
            const formattedTasks = suggestedTasks.map((task: any) => ({
              title: task.title || '',
              description: task.description || '',
              priority: ['low', 'medium', 'high', 'urgent'].includes(task.priority) ? task.priority : 'medium'
            }))
            setEditTasks(formattedTasks)
            toast.success(`Suggested ${formattedTasks.length} tasks successfully!`)
          } else {
            toast.error('Invalid response format')
          }
        } catch (parseError) {
          console.error('Parse error:', parseError, result.data)
          toast.error('Failed to parse task suggestions')
        }
      } else {
        toast.error(result.error || 'Failed to suggest tasks')
      }
    } catch (error) {
      console.error('Error suggesting tasks:', error)
      toast.error('An error occurred while suggesting tasks')
    } finally {
      setSuggestingTasks(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <Loader2 className="size-8 animate-spin text-primary" />
        </main>
        <Footer />
      </div>
    )
  }

  if (!template) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <main className="flex-1 flex flex-col items-center justify-center">
          <AlertCircle className="size-12 text-muted-foreground mb-4" />
          <h2 className="text-xl font-semibold mb-2">Template not found</h2>
          <Button onClick={() => router.push('/templates')}>
            Back to Templates
          </Button>
        </main>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-8">
        {/* Back Button */}
        <Button 
          variant="ghost" 
          size="sm" 
          className="mb-6 -ml-2"
          onClick={() => router.push('/templates')}
        >
          <ArrowLeft className="size-4 mr-2" />
          Back to Templates
        </Button>

        {/* Template Header */}
        <div className="flex flex-col lg:flex-row gap-6 mb-8">
          <div className="flex-1">
            <div className="flex items-start gap-4 mb-4">
              <div className="p-3 rounded-xl bg-primary/10 text-primary">
                {getCategoryIcon(template.category)}
              </div>
              <div>
                <div className="flex items-center gap-3 flex-wrap">
                  <h1 className="text-2xl lg:text-3xl font-bold">{template.template_name}</h1>
                  {template.is_builtin && (
                    <Badge variant="secondary">Built-in</Badge>
                  )}
                </div>
                <p className="text-muted-foreground mt-1">
                  {template.description || 'No description provided'}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <User className="size-4" />
                {getCreatorName()}
              </div>
              <div className="flex items-center gap-1.5">
                <Calendar className="size-4" />
                {new Date(template.created_at).toLocaleDateString()}
              </div>
              <div className="flex items-center gap-1.5">
                <TrendingUp className="size-4" />
                {template.usage_count || 0} uses
              </div>
              <div className="flex items-center gap-1.5">
                <ListTodo className="size-4" />
                {template.tasks.length} tasks
              </div>
              {template.category && (
                <Badge variant="outline">{template.category}</Badge>
              )}
            </div>

            <div className="flex items-center gap-3 mt-4">
              <StarRating rating={template.rating_avg || 0} />
              <span className="text-sm text-muted-foreground">
                {(template.rating_avg || 0).toFixed(1)} rating
              </span>
            </div>
          </div>

          <div className="flex flex-col gap-3 lg:w-48">
            <Button size="lg" className="gap-2" onClick={() => setApplyDialogOpen(true)}>
              <Rocket className="size-4" />
              Use Template
            </Button>
            <Button 
              variant="outline" 
              size="lg" 
              className="gap-2"
              onClick={() => {
                setUserRating(0)
                setRatingDialogOpen(true)
              }}
            >
              <Star className="size-4" />
              Rate Template
            </Button>
            {isCreator && !template.is_builtin && (
              <Button 
                variant="outline" 
                size="lg" 
                className="gap-2"
                onClick={openEditDialog}
              >
                <Pencil className="size-4" />
                Edit Template
              </Button>
            )}
            {isCreator && !template.is_builtin && (
              <Button 
                variant="destructive" 
                size="lg" 
                className="gap-2"
                onClick={() => setDeleteDialogOpen(true)}
              >
                <Trash2 className="size-4" />
                Delete Template
              </Button>
            )}
          </div>
        </div>

        {/* Tasks List */}
        <div>
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <ListTodo className="size-5" />
            Template Tasks ({template.tasks.length})
          </h2>
          <div className="space-y-3">
            {template.tasks.map((task, index) => (
              <Card key={task.template_task_id} className="hover:shadow-sm transition-shadow">
                <CardContent className="py-4">
                  <div className="flex items-start gap-4">
                    <div className="flex items-center justify-center size-8 rounded-full bg-primary/10 text-primary text-sm font-medium shrink-0">
                      {index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-medium">{task.task_title}</h3>
                        <Badge variant="outline" className={`text-xs ${getPriorityColor(task.suggested_priority)}`}>
                          {task.suggested_priority}
                        </Badge>
                      </div>
                      {task.task_description && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {task.task_description}
                        </p>
                      )}
                    </div>
                    <CheckCircle2 className="size-5 text-muted-foreground/30 shrink-0" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Apply Template Dialog */}
        <Dialog open={applyDialogOpen} onOpenChange={setApplyDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Apply Template</DialogTitle>
              <DialogDescription>
                Choose a project to add these {template.tasks.length} tasks to
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Select Team</label>
                <Select value={selectedTeam} onValueChange={setSelectedTeam}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a team" />
                  </SelectTrigger>
                  <SelectContent>
                    {teams.map((team) => (
                      <SelectItem key={team.team_id} value={team.team_id.toString()}>
                        {team.team_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedTeam && (
                <div>
                  <label className="text-sm font-medium mb-2 block">Select Project</label>
                  {loadingProjects ? (
                    <div className="flex items-center justify-center py-4">
                      <Loader2 className="size-5 animate-spin" />
                    </div>
                  ) : projects.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-2">
                      No projects found in this team
                    </p>
                  ) : (
                    <Select value={selectedProject} onValueChange={setSelectedProject}>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose a project" />
                      </SelectTrigger>
                      <SelectContent>
                        {projects.map((project) => (
                          <SelectItem key={project.project_id} value={project.project_id.toString()}>
                            {project.project_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setApplyDialogOpen(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleApplyTemplate}
                disabled={!selectedProject || applying}
              >
                {applying ? (
                  <>
                    <Loader2 className="size-4 mr-2 animate-spin" />
                    Creating Tasks...
                  </>
                ) : (
                  <>
                    <Rocket className="size-4 mr-2" />
                    Apply Template
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Rating Dialog */}
        <Dialog open={ratingDialogOpen} onOpenChange={setRatingDialogOpen}>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle>Rate Template</DialogTitle>
              <DialogDescription>
                How would you rate this template?
              </DialogDescription>
            </DialogHeader>
            <div className="flex flex-col items-center py-6">
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    className="cursor-pointer hover:scale-110 transition-transform"
                    onClick={() => setUserRating(star)}
                  >
                    <Star
                      className={`size-8 ${
                        star <= userRating
                          ? 'fill-yellow-400 text-yellow-400'
                          : 'text-muted-foreground/30'
                      } transition-colors`}
                    />
                  </button>
                ))}
              </div>
              <p className="text-sm text-muted-foreground mt-3">
                {userRating === 0 ? 'Click to rate' : `You selected ${userRating} star${userRating > 1 ? 's' : ''}`}
              </p>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setRatingDialogOpen(false)}>
                Cancel
              </Button>
              <Button 
                onClick={() => handleRateTemplate(userRating)}
                disabled={userRating === 0 || submittingRating}
              >
                {submittingRating ? (
                  <>
                    <Loader2 className="size-4 mr-2 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  'Submit Rating'
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle className="text-destructive">Delete Template</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete "{template.template_name}"? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="gap-2 sm:gap-0">
              <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
                Cancel
              </Button>
              <Button 
                variant="destructive"
                onClick={handleDeleteTemplate}
                disabled={deleting}
              >
                {deleting ? (
                  <>
                    <Loader2 className="size-4 mr-2 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="size-4 mr-2" />
                    Delete
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Template Dialog */}
        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Template</DialogTitle>
              <DialogDescription>
                Update your template details and tasks
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="text-sm font-medium mb-2 block">Template Name *</label>
                  <Input
                    placeholder="e.g., Website Launch Checklist"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                  />
                </div>
                <div className="col-span-2">
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium">Description</label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleGenerateEditDescription}
                      disabled={generatingDescription || !editName.trim()}
                      className="gap-1.5 h-7 text-xs bg-gradient-to-r from-purple-500/10 to-blue-500/10 border-purple-500/30 hover:border-purple-500/50 text-purple-600 dark:text-purple-400"
                    >
                      {generatingDescription ? (
                        <>
                          <Loader2 className="size-3 animate-spin" />
                          Generating...
                        </>
                      ) : (
                        <>
                          <Wand2 className="size-3" />
                          AI Generate
                        </>
                      )}
                    </Button>
                  </div>
                  <Textarea
                    placeholder="Describe what this template is for..."
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    rows={2}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Category</label>
                  <Select value={editCategory} onValueChange={setEditCategory}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Development">Development</SelectItem>
                      <SelectItem value="Marketing">Marketing</SelectItem>
                      <SelectItem value="Design">Design</SelectItem>
                      <SelectItem value="Product">Product</SelectItem>
                      <SelectItem value="Business">Business</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="text-sm font-medium">Tasks *</label>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleSuggestEditTasks}
                      disabled={suggestingTasks || !editName.trim()}
                      className="gap-1.5 h-8 text-xs bg-gradient-to-r from-purple-500/10 to-blue-500/10 border-purple-500/30 hover:border-purple-500/50 text-purple-600 dark:text-purple-400"
                    >
                      {suggestingTasks ? (
                        <>
                          <Loader2 className="size-3 animate-spin" />
                          Suggesting...
                        </>
                      ) : (
                        <>
                          <ListTodo className="size-3" />
                          AI Suggest Tasks
                        </>
                      )}
                    </Button>
                    <Button type="button" variant="outline" size="sm" onClick={addEditTask}>
                      <Plus className="size-3 mr-1" /> Add Task
                    </Button>
                  </div>
                </div>
                <div className="space-y-3">
                  {editTasks.map((task, index) => (
                    <div key={index} className="flex gap-2 items-start p-3 border rounded-lg bg-muted/30">
                      <div className="flex-1 space-y-2">
                        <Input
                          placeholder={`Task ${index + 1} title`}
                          value={task.title}
                          onChange={(e) => updateEditTask(index, 'title', e.target.value)}
                        />
                        <Input
                          placeholder="Description (optional)"
                          value={task.description}
                          onChange={(e) => updateEditTask(index, 'description', e.target.value)}
                        />
                      </div>
                      <Select 
                        value={task.priority} 
                        onValueChange={(v) => updateEditTask(index, 'priority', v)}
                      >
                        <SelectTrigger className="w-28">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">Low</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="high">High</SelectItem>
                          <SelectItem value="urgent">Urgent</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeEditTask(index)}
                        disabled={editTasks.length === 1}
                      >
                        <Trash2 className="size-4 text-destructive" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSaveTemplate} disabled={saving}>
                {saving ? (
                  <>
                    <Loader2 className="size-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save Changes'
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </main>
      <Footer />
    </div>
  )
}
