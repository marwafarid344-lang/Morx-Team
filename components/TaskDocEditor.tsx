'use client';

import { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { FileText, Edit, Save, X, Trash2, Eye, Code, ExternalLink } from 'lucide-react';

interface TaskDocEditorProps {
  taskId: string;
  userId: string;
  canEdit: boolean;
  taskTitle?: string;
  onSave?: () => void;
}

export default function TaskDocEditor({ taskId, userId, canEdit, taskTitle, onSave }: TaskDocEditorProps) {
  const [content, setContent] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [docInfo, setDocInfo] = useState<any>(null);
  const [error, setError] = useState('');
  const [showPreview, setShowPreview] = useState(true);

  useEffect(() => {
    if (taskId) {
      fetchDoc();
    }
  }, [taskId]);

  const fetchDoc = async () => {
    try {
      setIsLoading(true);
      const res = await fetch(`/api/tasks/${taskId}/docs?user_id=${userId}`);
      const data = await res.json();

      if (data.success) {
        setContent(data.data.content || '');
        setDocInfo(data.data);
      }
    } catch (err) {
      console.error('Error fetching doc:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      setError('');

      const res = await fetch(`/api/tasks/${taskId}/docs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, user_id: userId })
      });

      const data = await res.json();

      if (data.success) {
        setIsEditing(false);
        setDocInfo(data.data);
        onSave?.();
      } else {
        setError(data.error || 'Failed to save');
      }
    } catch (err) {
      setError('Failed to save documentation');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this documentation?')) return;

    try {
      const res = await fetch(`/api/tasks/${taskId}/docs?user_id=${userId}`, {
        method: 'DELETE'
      });

      const data = await res.json();

      if (data.success) {
        setContent('');
        setDocInfo(null);
        setIsEditing(false);
      }
    } catch (err) {
      setError('Failed to delete documentation');
    }
  };

  const openDialog = (editMode: boolean = false) => {
    setIsEditing(editMode);
    setIsDialogOpen(true);
  };

  const closeDialog = () => {
    setIsDialogOpen(false);
    setIsEditing(false);
    fetchDoc(); // Refresh content
  };

  // Markdown components configuration
  const markdownComponents = {
    code({ node, inline, className, children, ...props }: any) {
      const match = /language-(\w+)/.exec(className || '');
      return !inline && match ? (
        <SyntaxHighlighter
          style={oneDark}
          language={match[1]}
          PreTag="div"
          className="!rounded-lg !my-2"
          {...props}
        >
          {String(children).replace(/\n$/, '')}
        </SyntaxHighlighter>
      ) : (
        <code className="bg-muted px-1.5 py-0.5 rounded text-sm font-mono" {...props}>
          {children}
        </code>
      );
    },
    h1: ({ children }: any) => <h1 className="text-2xl font-bold text-primary border-b border-border pb-2 mb-4">{children}</h1>,
    h2: ({ children }: any) => <h2 className="text-xl font-semibold text-foreground mt-6 mb-3">{children}</h2>,
    h3: ({ children }: any) => <h3 className="text-lg font-medium text-foreground mt-4 mb-2">{children}</h3>,
    p: ({ children }: any) => <p className="text-sm text-muted-foreground mb-3 leading-relaxed">{children}</p>,
    ul: ({ children }: any) => <ul className="list-disc list-inside text-sm text-muted-foreground mb-3 space-y-1 ml-2">{children}</ul>,
    ol: ({ children }: any) => <ol className="list-decimal list-inside text-sm text-muted-foreground mb-3 space-y-1 ml-2">{children}</ol>,
    blockquote: ({ children }: any) => <blockquote className="border-l-4 border-primary pl-4 italic text-muted-foreground my-3">{children}</blockquote>,
    a: ({ href, children }: any) => <a href={href} className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">{children}</a>,
    table: ({ children }: any) => <table className="w-full text-sm border-collapse my-3">{children}</table>,
    th: ({ children }: any) => <th className="border border-border px-3 py-2 text-left bg-muted/50 font-medium">{children}</th>,
    td: ({ children }: any) => <td className="border border-border px-3 py-2">{children}</td>,
    hr: () => <Separator className="my-4" />,
  };

  return (
    <>
      {/* Compact Preview Button */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="size-4 text-primary" />
            <span className="text-sm font-medium">Documentation</span>
            {content && <Badge variant="secondary" className="text-xs">Has content</Badge>}
          </div>
        </div>

        {isLoading ? (
          <p className="text-xs text-muted-foreground">Loading...</p>
        ) : content ? (
          <div className="space-y-2">
            <div className="text-xs text-muted-foreground line-clamp-2 bg-muted/30 p-2 rounded">
              {content.substring(0, 100)}...
            </div>
            <Button
              size="sm"
              variant="outline"
              className="w-full h-8 text-xs"
              onClick={() => openDialog(false)}
            >
              <ExternalLink className="size-3 mr-1" />
              View Documentation
            </Button>
          </div>
        ) : (
          <div className="text-center py-4 bg-muted/20 rounded-lg">
            <FileText className="size-6 text-muted-foreground/50 mx-auto mb-1" />
            <p className="text-xs text-muted-foreground">No documentation</p>
            {canEdit && (
              <Button
                size="sm"
                variant="outline"
                className="mt-2 h-7 text-xs"
                onClick={() => openDialog(true)}
              >
                <Edit className="size-3 mr-1" />
                Add Documentation
              </Button>
            )}
            {!canEdit && (
              <p className="text-xs text-muted-foreground/60 mt-1">
                Only task creator or admin can add
              </p>
            )}
          </div>
        )}
      </div>

      {/* Full Documentation Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="size-5 text-primary" />
              {taskTitle ? `Documentation: ${taskTitle}` : 'Task Documentation'}
            </DialogTitle>
            {docInfo && docInfo.exists && !isEditing && (
              <p className="text-xs text-muted-foreground">
                Created by {docInfo.creator_name} • Updated {new Date(docInfo.updated_at).toLocaleDateString()}
              </p>
            )}
          </DialogHeader>

          <Separator />

          <div className="flex-1 overflow-hidden">
            {error && (
              <div className="bg-destructive/10 text-destructive text-sm px-3 py-2 rounded-md mb-4">
                {error}
              </div>
            )}

            {isEditing ? (
              /* Edit Mode */
              <div className="h-full flex flex-col gap-4">
                {/* Toolbar */}
                <div className="flex items-center justify-between flex-shrink-0">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-xs">
                      <Code className="size-3 mr-1" />
                      TAD
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      Supports headings, bold, italic, code, lists, tables
                    </span>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 text-xs"
                    onClick={() => setShowPreview(!showPreview)}
                  >
                    <Eye className="size-3 mr-1" />
                    {showPreview ? 'Hide Preview' : 'Show Preview'}
                  </Button>
                </div>

                {/* Editor and Preview */}
                <div className={`flex-1 overflow-hidden ${showPreview ? 'grid grid-cols-2 gap-4' : ''}`}>
                  {/* Editor */}
                  <div className="h-full flex flex-col">
                    <span className="text-xs font-medium text-muted-foreground mb-2">Editor</span>
                    <Textarea
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      placeholder={`# Task Documentation

## Overview
Describe the task details here...

## Requirements
- Requirement 1
- Requirement 2

## Notes
Add any additional notes...

\`\`\`javascript
// Code example
const example = "hello";
\`\`\``}
                      className="flex-1 min-h-[400px] font-mono text-sm resize-none bg-background/50 border-border/50"
                    />
                  </div>

                  {/* Live Preview */}
                  {showPreview && (
                    <div className="h-full flex flex-col">
                      <span className="text-xs font-medium text-muted-foreground mb-2">Preview</span>
                      <ScrollArea className="flex-1 rounded-lg border border-border/50 bg-background/30 p-4">
                        <div className="prose prose-sm dark:prose-invert max-w-none">
                          {content ? (
                            <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
                              {content}
                            </ReactMarkdown>
                          ) : (
                            <p className="text-muted-foreground italic">Start typing to see preview...</p>
                          )}
                        </div>
                      </ScrollArea>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              /* View Mode */
              <ScrollArea className="h-[500px] pr-4">
                <div className="prose prose-sm dark:prose-invert max-w-none">
                  {content ? (
                    <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
                      {content}
                    </ReactMarkdown>
                  ) : (
                    <div className="text-center py-12">
                      <FileText className="size-12 text-muted-foreground/30 mx-auto mb-3" />
                      <p className="text-muted-foreground">No documentation yet</p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            )}
          </div>

          <Separator />

          <DialogFooter className="flex-shrink-0">
            {isEditing ? (
              <>
                <Button variant="ghost" onClick={closeDialog}>
                  <X className="size-4 mr-1" />
                  Cancel
                </Button>
                <Button onClick={handleSave} disabled={isSaving}>
                  <Save className="size-4 mr-1" />
                  {isSaving ? 'Saving...' : 'Save Documentation'}
                </Button>
              </>
            ) : (
              <>
                {canEdit && content && (
                  <Button variant="ghost" className="text-destructive hover:text-destructive" onClick={handleDelete}>
                    <Trash2 className="size-4 mr-1" />
                    Delete
                  </Button>
                )}
                {canEdit && (
                  <Button variant="outline" onClick={() => setIsEditing(true)}>
                    <Edit className="size-4 mr-1" />
                    {content ? 'Edit' : 'Add Documentation'}
                  </Button>
                )}
                <Button variant="ghost" onClick={closeDialog}>
                  Close
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
