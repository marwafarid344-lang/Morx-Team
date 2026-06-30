'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { 
  FileText, 
  Search, 
  Star, 
  Users, 
  CheckCircle2, 
  Globe,
  TrendingUp,
  Sparkles,
  Plus
} from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

interface Template {
  template_id: number;
  template_name: string;
  description: string;
  category: string;
  is_builtin: boolean;
  creator_id: number | null;
  language: string;
  rating_avg: number;
  usage_count: number;
  users?: {
    first_name: string;
    last_name: string;
  };
}

interface TemplateWithTasks extends Template {
  tasks: {
    template_task_id: number;
    task_title: string;
    task_description: string;
    suggested_priority: string;
    order_index: number;
  }[];
}

interface TemplateLibraryProps {
  onTemplateSelect?: (templateId: number) => void;
  project_id?: number;
  auth_user_id?: string;
  team_id?: number;  // For creating new project from template
  mode?: 'apply' | 'create';  // 'apply' = add to existing project, 'create' = create new project
}

export default function TemplateLibrary({ onTemplateSelect, project_id, auth_user_id, team_id, mode = 'apply' }: TemplateLibraryProps) {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedLanguage, setSelectedLanguage] = useState<string>('all');
  const [previewTemplate, setPreviewTemplate] = useState<TemplateWithTasks | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isApplying, setIsApplying] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [showProjectNameInput, setShowProjectNameInput] = useState(false);

  useEffect(() => {
    fetchTemplates();
  }, [selectedCategory, selectedLanguage]);

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (selectedCategory !== 'all') params.append('category', selectedCategory);
      if (selectedLanguage !== 'all') params.append('language', selectedLanguage);
      if (searchQuery) params.append('search', searchQuery);

      const res = await fetch(`/api/templates?${params.toString()}`);
      const result = await res.json();

      if (result.success) {
        setTemplates(result.data || []);
      }
    } catch (error) {
      console.error('Error fetching templates:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTemplateDetails = async (templateId: number) => {
    try {
      const res = await fetch(`/api/templates/${templateId}`);
      const result = await res.json();

      if (result.success) {
        setPreviewTemplate(result.data);
        setIsPreviewOpen(true);
      }
    } catch (error) {
      console.error('Error fetching template details:', error);
    }
  };

  const applyTemplate = async () => {
    if (!previewTemplate || !project_id || !auth_user_id) return;

    try {
      setIsApplying(true);
      const res = await fetch(`/api/templates/${previewTemplate.template_id}/apply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ project_id, auth_user_id })
      });

      const result = await res.json();

      if (result.success) {
        setIsPreviewOpen(false);
        onTemplateSelect?.(previewTemplate.template_id);
        toast.success(`${result.data.tasks_created} tasks created successfully!`);
      } else {
        toast.error(result.error || 'Failed to apply template');
      }
    } catch (error) {
      console.error('Error applying template:', error);
      toast.error('An error occurred. Please try again.');
    } finally {
      setIsApplying(false);
    }
  };

  const createProjectFromTemplate = async () => {
    if (!previewTemplate || !team_id || !auth_user_id) return;
    if (!newProjectName.trim()) {
      toast.error('Please enter a project name');
      return;
    }

    try {
      setIsApplying(true);
      const res = await fetch(`/api/templates/${previewTemplate.template_id}/create-project`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          team_id, 
          auth_user_id,
          project_name: newProjectName,
          project_description: `Created from ${previewTemplate.template_name} template`
        })
      });

      const result = await res.json();

      if (result.success) {
        setIsPreviewOpen(false);
        setShowProjectNameInput(false);
        setNewProjectName('');
        onTemplateSelect?.(previewTemplate.template_id);
        toast.success(`Project "${result.data.project.project_name}" created with ${result.data.tasks_created} tasks!`);
      } else {
        toast.error(result.error || 'Failed to create project');
      }
    } catch (error) {
      console.error('Error creating project from template:', error);
      toast.error('An error occurred. Please try again.');
    } finally {
      setIsApplying(false);
    }
  };

  const filteredTemplates = templates.filter(t =>
    t.template_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const categories = ['all', 'Development', 'Marketing', 'Design', 'Product'];

  const getPriorityVariant = (priority: string): "default" | "destructive" | "outline" | "secondary" => {
    if (priority === 'urgent') return 'destructive';
    if (priority === 'high') return 'default';
    return 'secondary';
  };

  return (
    <div className="space-y-4">
      {/* Header & Filters */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Sparkles className="size-6 text-primary"/>
          <h2 className="text-2xl font-bold">Template Library</h2>
        </div>
        <p className="text-sm text-muted-foreground">
          Browse and apply pre-built templates to your projects
        </p>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              placeholder="Search templates..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && fetchTemplates()}
              className="pl-9"
            />
          </div>
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              {categories.map(cat => (
                <SelectItem key={cat} value={cat}>
                  {cat === 'all' ? 'All Categories' : cat}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
            <SelectTrigger className="w-full sm:w-[140px]">
              <SelectValue placeholder="Language" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Languages</SelectItem>
              <SelectItem value="en">English</SelectItem>
              <SelectItem value="ar">العربية</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Templates Grid */}
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-sm text-muted-foreground">Loading templates...</p>
        </div>
      ) : filteredTemplates.length === 0 ? (
        <div className="text-center py-12">
          <FileText className="size-12 text-muted-foreground/50 mx-auto mb-4" />
          <h3 className="font-semibold mb-2">No templates found</h3>
          <p className="text-sm text-muted-foreground">Try adjusting your filters</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pb-4">
          {filteredTemplates.map((template) => (
            <Card
              key={template.template_id}
              className="hover:shadow-lg transition-all cursor-pointer hover:border-primary/50"
              onClick={() => fetchTemplateDetails(template.template_id)}
            >
              <CardHeader>
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <CardTitle className="text-lg flex items-center gap-2">
                      {template.template_name}
                      {template.is_builtin && (
                        <Badge variant="secondary" className="text-xs">Official</Badge>
                      )}
                    </CardTitle>
                    <CardDescription className="text-xs mt-1 line-clamp-2">
                      {template.description || 'No description'}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Star className="size-3 fill-yellow-500 text-yellow-500" />
                    <span>{template.rating_avg.toFixed(1)}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <TrendingUp className="size-3" />
                    <span>{template.usage_count} uses</span>
                  </div>
                  {template.language && (
                    <div className="flex items-center gap-1">
                      <Globe className="size-3" />
                      <span>{template.language.toUpperCase()}</span>
                    </div>
                  )}
                </div>
                {template.category && (
                  <Badge variant="outline" className="mt-3 text-xs">
                    {template.category}
                  </Badge>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Template Preview Dialog */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-3xl h-[90vh] flex flex-col">
          <DialogHeader className="shrink-0">
            <DialogTitle className="flex items-center gap-2">
              <FileText className="size-5 text-primary" />
              {previewTemplate?.template_name}
            </DialogTitle>
            <DialogDescription>
              {previewTemplate?.description}
            </DialogDescription>
          </DialogHeader>

          <Separator className="shrink-0" />

          <div className="flex-1 overflow-y-auto pr-4">
            <div className="space-y-4 py-2">
              {/* Template Info */}
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Star className="size-4 fill-yellow-500 text-yellow-500" />
                  <span>{previewTemplate?.rating_avg.toFixed(1)} rating</span>
                </div>
                <div className="flex items-center gap-1">
                  <Users className="size-4" />
                  <span>{previewTemplate?.usage_count} uses</span>
                </div>
                {previewTemplate?.category && (
                  <Badge variant="secondary">{previewTemplate.category}</Badge>
                )}
              </div>

              {/* Tasks List */}
              <div>
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                  <CheckCircle2 className="size-4" />
                  Template Tasks ({previewTemplate?.tasks?.length || 0})
                </h4>
                <div className="space-y-2">
                  {previewTemplate?.tasks?.map((task, index) => (
                    <Card key={task.template_task_id} className="bg-muted/30">
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <div className="flex-shrink-0 size-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-semibold text-primary">
                            {index + 1}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h5 className="font-medium text-sm">{task.task_title}</h5>
                            {task.task_description && (
                              <p className="text-xs text-muted-foreground mt-1">
                                {task.task_description}
                              </p>
                            )}
                            <div className="mt-2">
                              <Badge
                                variant={getPriorityVariant(task.suggested_priority)}
                                className="text-xs"
                              >
                                {task.suggested_priority}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <Separator className="shrink-0" />

          <DialogFooter className="border-t pt-4 shrink-0">
            {mode === 'create' || (team_id && !project_id) ? (
              // Create new project mode
              showProjectNameInput ? (
                <div className="flex flex-col sm:flex-row gap-3 w-full">
                  <Input
                    placeholder="Enter project name..."
                    value={newProjectName}
                    onChange={(e) => setNewProjectName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && createProjectFromTemplate()}
                    className="flex-1"
                    autoFocus
                  />
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setShowProjectNameInput(false);
                        setNewProjectName('');
                      }}
                    >
                      Cancel
                    </Button>
                    <Button onClick={createProjectFromTemplate} disabled={isApplying || !newProjectName.trim()}>
                      {isApplying ? 'Creating...' : 'Create Project'}
                    </Button>
                  </div>
                </div>
              ) : (
                <Button onClick={() => setShowProjectNameInput(true)} className="w-full sm:w-auto">
                  <Plus className="mr-2 size-4" />
                  Create as New Project
                </Button>
              )
            ) : (
              // Apply to existing project mode
              <Button onClick={applyTemplate} disabled={isApplying}>
                {isApplying ? 'Applying...' : 'Apply to Project'}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
