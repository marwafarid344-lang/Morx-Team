'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
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
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'
import { 
  Star, 
  Search, 
  Plus, 
  Trash2, 
  Layout, 
  Briefcase, 
  Code, 
  Palette, 
  Megaphone, 
  Package,
  Loader2,
  Sparkles,
  TrendingUp,
  Clock,
  ChevronRight,
  User,
  Wand2,
  ListTodo
} from 'lucide-react'
import { Header } from '@/components/header'
import { Footer } from '@/components/footer'

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
}

interface TemplateTask {
  title: string
  description: string
  priority: string
}

const CATEGORIES = [
  { value: 'all', label: 'All Categories', icon: Layout },
  { value: 'Development', label: 'Development', icon: Code },
  { value: 'Marketing', label: 'Marketing', icon: Megaphone },
  { value: 'Design', label: 'Design', icon: Palette },
  { value: 'Product', label: 'Product', icon: Package },
  { value: 'Business', label: 'Business', icon: Briefcase },
]

const getCategoryIcon = (category: string | null) => {
  switch (category?.toLowerCase()) {
    case 'development':
      return <Code className="size-4" />
    case 'marketing':
      return <Megaphone className="size-4" />
    case 'design':
      return <Palette className="size-4" />
    case 'product':
      return <Package className="size-4" />
    case 'business':
      return <Briefcase className="size-4" />
    default:
      return <Layout className="size-4" />
  }
}

const StarRating = ({ 
  rating, 
  onRate, 
  interactive = false,
  size = 'sm'
}: { 
  rating: number
  onRate?: (rating: number) => void
  interactive?: boolean
  size?: 'sm' | 'md' | 'lg'
}) => {
  const [hoverRating, setHoverRating] = useState(0)
  
  const sizeClasses = {
    sm: 'size-4',
    md: 'size-5',
    lg: 'size-6'
  }

  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={!interactive}
          className={`${interactive ? 'cursor-pointer hover:scale-110' : 'cursor-default'} transition-transform`}
          onMouseEnter={() => interactive && setHoverRating(star)}
          onMouseLeave={() => interactive && setHoverRating(0)}
          onClick={() => interactive && onRate?.(star)}
        >
          <Star
            className={`${sizeClasses[size]} ${
              star <= (hoverRating || rating)
                ? 'fill-yellow-400 text-yellow-400'
                : 'text-muted-foreground/30'
            } transition-colors`}
          />
        </button>
      ))}
    </div>
  )
}

export default function TemplatesPage() {
  const router = useRouter()
  const [templates, setTemplates] = useState<Template[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [ratingDialogOpen, setRatingDialogOpen] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null)
  const [userRating, setUserRating] = useState(0)
  const [submittingRating, setSubmittingRating] = useState(false)
  
  // Create template form state
  const [newTemplateName, setNewTemplateName] = useState('')
  const [newTemplateDescription, setNewTemplateDescription] = useState('')
  const [newTemplateCategory, setNewTemplateCategory] = useState('')
  const [newTemplateTasks, setNewTemplateTasks] = useState<TemplateTask[]>([
    { title: '', description: '', priority: 'medium' }
  ])
  const [creating, setCreating] = useState(false)
  const [showMine, setShowMine] = useState(false)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  
  // AI Generation states
  const [generatingDescription, setGeneratingDescription] = useState(false)
  const [suggestingTasks, setSuggestingTasks] = useState(false)

  // AI Project Generator State
  const [generatorPrompt, setGeneratorPrompt] = useState("")
  const [generatingProject, setGeneratingProject] = useState(false)
  const [generatedData, setGeneratedData] = useState<any | null>(null)
  const [generatorDialogOpen, setGeneratorDialogOpen] = useState(false)
  const [deployTeamId, setDeployTeamId] = useState("")
  const [userTeams, setUserTeams] = useState<any[]>([])
  const [deploying, setDeploying] = useState(false)


  // Get current user ID and teams
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
    fetchUserTeams()
  }, [])

  const fetchUserTeams = async () => {
    try {
      const res = await fetch('/api/teams')
      const result = await res.json()
      if (result.success) {
        setUserTeams(result.data || [])
      }
    } catch (e) {
      console.error('Error fetching teams:', e)
    }
  }

  const handleGenerateProject = async () => {
    if (!generatorPrompt.trim()) return

    setGeneratingProject(true)
    try {
      const res = await fetch('/api/ai/project-generator', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: generatorPrompt })
      })
      const result = await res.json()

      if (result.success && result.data) {
        setGeneratedData(result.data)
        setGeneratorDialogOpen(true)
        if (userTeams.length > 0) {
          setDeployTeamId(userTeams[0].team_id)
        }
      } else {
        toast.error(result.error || 'Failed to generate project roadmap')
      }
    } catch (e) {
      console.error(e)
      toast.error('Error generating project')
    } finally {
      setGeneratingProject(false)
    }
  }

  const handleDeployProject = async () => {
    if (!deployTeamId || !generatedData) {
      toast.error('Please select a team')
      return
    }

    setDeploying(true)
    try {
      const res = await fetch('/api/ai/project-generator', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create',
          team_id: deployTeamId,
          generatedData
        })
      })
      const result = await res.json()

      if (result.success && result.data?.project_url) {
        toast.success('Project deployed successfully!')
        setGeneratorDialogOpen(false)
        setGeneratorPrompt('')
        router.push(`/projects/${result.data.project_url}`)
      } else {
        toast.error(result.error || 'Failed to deploy project')
      }
    } catch (e) {
      console.error(e)
      toast.error('Error deploying project')
    } finally {
      setDeploying(false)
    }
  }


  const fetchTemplates = useCallback(async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (selectedCategory !== 'all') params.set('category', selectedCategory)
      if (searchQuery) params.set('search', searchQuery)

      const res = await fetch(`/api/templates?${params.toString()}`, {
        credentials: 'include'
      })
      const data = await res.json()
      
      if (data.success) {
        setTemplates(data.data || [])
      } else {
        toast.error('Failed to load templates')
      }
    } catch (error) {
      console.error('Error fetching templates:', error)
      toast.error('Failed to load templates')
    } finally {
      setLoading(false)
    }
  }, [selectedCategory, searchQuery])

  // Filter templates client-side for "Mine" option
  const filteredTemplates = showMine && currentUserId
    ? templates.filter(t => t.auth_user_id === currentUserId)
    : templates

  useEffect(() => {
    fetchTemplates()
  }, [fetchTemplates])

  const handleRateTemplate = async (templateId: number, rating: number) => {
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
        fetchTemplates() // Refresh to show updated rating
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

  const addTask = () => {
    setNewTemplateTasks([...newTemplateTasks, { title: '', description: '', priority: 'medium' }])
  }

  const removeTask = (index: number) => {
    if (newTemplateTasks.length > 1) {
      setNewTemplateTasks(newTemplateTasks.filter((_, i) => i !== index))
    }
  }

  const updateTask = (index: number, field: keyof TemplateTask, value: string) => {
    const updated = [...newTemplateTasks]
    updated[index][field] = value
    setNewTemplateTasks(updated)
  }

  const handleCreateTemplate = async () => {
    if (!newTemplateName.trim()) {
      toast.error('Template name is required')
      return
    }

    const validTasks = newTemplateTasks.filter(t => t.title.trim())
    if (validTasks.length === 0) {
      toast.error('At least one task is required')
      return
    }

    try {
      setCreating(true)
      const res = await fetch('/api/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          template_name: newTemplateName.trim(),
          description: newTemplateDescription.trim() || null,
          category: newTemplateCategory || null,
          language: 'en',
          tasks: validTasks
        })
      })

      const data = await res.json()
      if (data.success) {
        toast.success('Template created successfully!')
        setCreateDialogOpen(false)
        resetCreateForm()
        fetchTemplates()
      } else {
        toast.error(data.error || 'Failed to create template')
      }
    } catch (error) {
      console.error('Error creating template:', error)
      toast.error('Failed to create template')
    } finally {
      setCreating(false)
    }
  }

  const resetCreateForm = () => {
    setNewTemplateName('')
    setNewTemplateDescription('')
    setNewTemplateCategory('')
    setNewTemplateTasks([{ title: '', description: '', priority: 'medium' }])
  }

  // AI Generate Description
  const handleGenerateDescription = async () => {
    if (!newTemplateName.trim()) {
      toast.error('Please enter a template name first')
      return
    }

    if (!currentUserId) {
      toast.error('Please sign in to use this feature')
      return
    }

    try {
      setGeneratingDescription(true)
      
      const prompt = `Generate a concise, professional description (2-3 sentences max) for a task template named "${newTemplateName}"${newTemplateCategory ? ` in the ${newTemplateCategory} category` : ''}. The description should explain what the template is for and who would benefit from using it. Return ONLY the description text, no quotes or extra formatting.`

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
        setNewTemplateDescription(cleanedDescription)
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

  // AI Suggest Tasks
  const handleSuggestTasks = async () => {
    if (!newTemplateName.trim()) {
      toast.error('Please enter a template name first')
      return
    }

    if (!currentUserId) {
      toast.error('Please sign in to use this feature')
      return
    }

    try {
      setSuggestingTasks(true)
      
      const prompt = `Suggest 5 practical tasks for a template named "${newTemplateName}"${newTemplateCategory ? ` in the ${newTemplateCategory} category` : ''}${newTemplateDescription ? `. Description: ${newTemplateDescription}` : ''}.

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
            const formattedTasks: TemplateTask[] = suggestedTasks.map((task: any) => ({
              title: task.title || '',
              description: task.description || '',
              priority: ['low', 'medium', 'high', 'urgent'].includes(task.priority) ? task.priority : 'medium'
            }))
            setNewTemplateTasks(formattedTasks)
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

  const openRatingDialog = (template: Template) => {
    setSelectedTemplate(template)
    setUserRating(0)
    setRatingDialogOpen(true)
  }

  const getCreatorName = (template: Template) => {
    if (template.is_builtin) return 'Morx Team'
    return 'Community' // Since we don't have creator names without FK join
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-8">
        {/* Hero Section */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-primary/10">
              <Sparkles className="size-6 text-primary" />
            </div>
            <h1 className="text-3xl font-bold">Templates Marketplace</h1>
          </div>
          <p className="text-muted-foreground">
            Discover ready-to-use task templates or create your own masterpiece
          </p>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              placeholder="Search templates..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              {CATEGORIES.map((cat) => (
                <SelectItem key={cat.value} value={cat.value}>
                  <div className="flex items-center gap-2">
                    <cat.icon className="size-4" />
                    {cat.label}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            variant={showMine ? 'default' : 'outline'}
            className="gap-2"
            onClick={() => setShowMine(!showMine)}
          >
            <User className="size-4" />
            Mine
          </Button>
          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="size-4" />
                Create Template
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create New Template</DialogTitle>
                <DialogDescription>
                  Build a reusable task template that others can use
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="text-sm font-medium mb-2 block">Template Name *</label>
                    <Input
                      placeholder="e.g., Website Launch Checklist"
                      value={newTemplateName}
                      onChange={(e) => setNewTemplateName(e.target.value)}
                    />
                  </div>
                  <div className="col-span-2">
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-sm font-medium">Description</label>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleGenerateDescription}
                        disabled={generatingDescription || !newTemplateName.trim()}
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
                      value={newTemplateDescription}
                      onChange={(e) => setNewTemplateDescription(e.target.value)}
                      rows={2}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">Category</label>
                    <Select value={newTemplateCategory} onValueChange={setNewTemplateCategory}>
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
                        onClick={handleSuggestTasks}
                        disabled={suggestingTasks || !newTemplateName.trim()}
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
                      <Button type="button" variant="outline" size="sm" onClick={addTask}>
                        <Plus className="size-3 mr-1" /> Add Task
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-3">
                    {newTemplateTasks.map((task, index) => (
                      <div key={index} className="flex gap-2 items-start p-3 border rounded-lg bg-muted/30">
                        <div className="flex-1 space-y-2">
                          <Input
                            placeholder={`Task ${index + 1} title`}
                            value={task.title}
                            onChange={(e) => updateTask(index, 'title', e.target.value)}
                          />
                          <Input
                            placeholder="Description (optional)"
                            value={task.description}
                            onChange={(e) => updateTask(index, 'description', e.target.value)}
                          />
                        </div>
                        <Select 
                          value={task.priority} 
                          onValueChange={(v) => updateTask(index, 'priority', v)}
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
                          onClick={() => removeTask(index)}
                          disabled={newTemplateTasks.length === 1}
                        >
                          <Trash2 className="size-4 text-destructive" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateTemplate} disabled={creating}>
                  {creating ? (
                    <>
                      <Loader2 className="size-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    'Create Template'
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* AI Project Generator Input Section */}
        <Card className="mb-8 border-purple-500/20 bg-gradient-to-r from-purple-500/5 via-indigo-500/5 to-blue-500/5">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-purple-700 dark:text-purple-300">
              <Wand2 className="size-5 text-purple-500" />
              <span>AI Instant Project Generator</span>
            </CardTitle>
            <CardDescription>Generate an entire roadmap, architecture, timeline, tasks, and deploy it to a team instantly.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-3">
              <Input
                placeholder="E.g., Hospital Management System with Patient Booking, E-Commerce Bookstore..."
                value={generatorPrompt}
                onChange={(e) => setGeneratorPrompt(e.target.value)}
                className="flex-1 bg-background"
                onKeyDown={(e) => e.key === 'Enter' && handleGenerateProject()}
              />
              <Button 
                onClick={handleGenerateProject} 
                disabled={generatingProject || !generatorPrompt.trim()}
                className="bg-purple-600 hover:bg-purple-700 text-white gap-1.5"
              >
                {generatingProject ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="size-4" />
                    Generate
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Generator Preview and Deploy Dialog */}
        <Dialog open={generatorDialogOpen} onOpenChange={setGeneratorDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Wand2 className="size-5 text-purple-500" />
                <span>AI Project Blueprint: {generatedData?.title}</span>
              </DialogTitle>
              <DialogDescription>Review architecture, milestones, tasks and choose a team to deploy.</DialogDescription>
            </DialogHeader>

            {generatedData && (
              <div className="space-y-4 py-2 text-sm">
                <div>
                  <h4 className="font-bold text-foreground">Technical Architecture:</h4>
                  <p className="text-muted-foreground">{generatedData.architecture}</p>
                </div>

                <div>
                  <h4 className="font-bold text-foreground">Database Schema Description:</h4>
                  <p className="text-muted-foreground">{generatedData.database_schema}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-bold text-foreground">Required Skills:</h4>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {generatedData.required_skills.map((s: string) => <Badge key={s} variant="secondary">{s}</Badge>)}
                    </div>
                  </div>
                  <div>
                    <h4 className="font-bold text-foreground">Estimated Timeline:</h4>
                    <p className="text-muted-foreground mt-1">{generatedData.timeline}</p>
                  </div>
                </div>

                <div>
                  <h4 className="font-bold text-foreground">Milestones:</h4>
                  <ul className="list-disc pl-5 mt-1 space-y-1 text-muted-foreground">
                    {generatedData.milestones.map((m: any, idx: number) => (
                      <li key={idx}><strong>{m.title}</strong>: {m.deliverable}</li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h4 className="font-bold text-foreground">Generated Task Backlog ({generatedData.tasks.length} items):</h4>
                  <div className="max-h-40 overflow-y-auto space-y-2 mt-1.5 p-2 border rounded bg-muted/20">
                    {generatedData.tasks.map((t: any, idx: number) => (
                      <div key={idx} className="p-2 bg-background border rounded text-xs flex justify-between items-start">
                        <div>
                          <p className="font-semibold text-foreground">{t.title}</p>
                          <p className="text-muted-foreground">{t.description}</p>
                        </div>
                        <Badge className="font-mono scale-90">P{t.priority}</Badge>
                      </div>
                    ))}
                  </div>
                </div>

                <Separator />

                <div className="space-y-2.5 p-3 rounded-lg border border-purple-500/20 bg-purple-500/5">
                  <h4 className="font-bold text-purple-700 dark:text-purple-300">Deploy blueprint to workspace:</h4>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <div className="flex-1">
                      <Select value={deployTeamId} onValueChange={setDeployTeamId}>
                        <SelectTrigger className="bg-background">
                          <SelectValue placeholder="Select a team..." />
                        </SelectTrigger>
                        <SelectContent>
                          {userTeams.map(team => (
                            <SelectItem key={team.team_id} value={team.team_id}>{team.team_name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <Button 
                      onClick={handleDeployProject} 
                      disabled={deploying || !deployTeamId}
                      className="bg-purple-600 hover:bg-purple-700 text-white gap-1.5"
                    >
                      {deploying ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
                      Deploy Project
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>


        {/* Templates Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="size-8 animate-spin text-primary" />
          </div>
        ) : filteredTemplates.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="size-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <Layout className="size-8 text-muted-foreground" />
            </div>
            <h2 className="text-xl font-semibold mb-2">
              {showMine ? 'No templates created yet' : 'No templates found'}
            </h2>
            <p className="text-muted-foreground mb-6">
              {showMine ? 'Create your first template!' : (searchQuery ? 'Try a different search term' : 'Be the first to create a template!')}
            </p>
            <Button onClick={() => setCreateDialogOpen(true)}>
              <Plus className="size-4 mr-2" />
              Create Template
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {filteredTemplates.map((template) => (
              <Card 
                key={template.template_id}
                className="hover:shadow-lg transition-all hover:border-primary/50 group"
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded-md bg-primary/10 text-primary">
                        {getCategoryIcon(template.category)}
                      </div>
                      <div>
                        <CardTitle className="text-base line-clamp-1">
                          {template.template_name}
                        </CardTitle>
                        <CardDescription className="text-xs">
                          by {getCreatorName(template)}
                        </CardDescription>
                      </div>
                    </div>
                    {template.is_builtin && (
                      <Badge variant="secondary" className="text-[10px] shrink-0">
                        Built-in
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="pt-0 space-y-3">
                  <p className="text-sm text-muted-foreground line-clamp-2 min-h-[2.5rem]">
                    {template.description || 'No description provided'}
                  </p>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <StarRating rating={Math.round(template.rating_avg || 0)} />
                      <span className="text-xs text-muted-foreground">
                        ({(template.rating_avg || 0).toFixed(1)})
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <TrendingUp className="size-3" />
                      {template.usage_count || 0} uses
                    </div>
                  </div>

                  {template.category && (
                    <Badge variant="outline" className="text-xs">
                      {template.category}
                    </Badge>
                  )}

                  <div className="flex gap-2 pt-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex-1 text-xs"
                      onClick={() => openRatingDialog(template)}
                    >
                      <Star className="size-3 mr-1" />
                      Rate
                    </Button>
                    <Button 
                      size="sm"
                      className="flex-1 text-xs"
                      onClick={() => router.push(`/templates/${template.template_id}`)}
                    >
                      View
                      <ChevronRight className="size-3 ml-1" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Rating Dialog */}
        <Dialog open={ratingDialogOpen} onOpenChange={setRatingDialogOpen}>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle>Rate Template</DialogTitle>
              <DialogDescription>
                How would you rate "{selectedTemplate?.template_name}"?
              </DialogDescription>
            </DialogHeader>
            <div className="flex flex-col items-center py-6">
              <StarRating
                rating={userRating}
                onRate={setUserRating}
                interactive
                size="lg"
              />
              <p className="text-sm text-muted-foreground mt-3">
                {userRating === 0 ? 'Click to rate' : `You selected ${userRating} star${userRating > 1 ? 's' : ''}`}
              </p>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setRatingDialogOpen(false)}>
                Cancel
              </Button>
              <Button 
                onClick={() => selectedTemplate && handleRateTemplate(selectedTemplate.template_id, userRating)}
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
      </main>
      <Footer />
    </div>
  )
}
