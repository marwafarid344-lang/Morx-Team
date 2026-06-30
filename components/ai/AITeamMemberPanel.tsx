"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Sparkles, Loader2, AlertTriangle, Lightbulb, Play, ClipboardList, CheckCircle2, User, Trophy, Calendar, FileText } from "lucide-react"
import { toast } from "sonner"

interface AITeamMemberPanelProps {
  projectId: string
  teamId: string
}

export function AITeamMemberPanel({ projectId, teamId }: AITeamMemberPanelProps) {
  const [loadingAction, setLoadingAction] = useState<string | null>(null)
  
  // Assistant States
  const [blockersData, setBlockersData] = useState<{ blockers: string[]; at_risk_tasks: string[]; recommendations: string[] } | null>(null)
  const [nextActions, setNextActions] = useState<string[] | null>(null)
  const [meetingNotes, setMeetingNotes] = useState("")
  const [meetingSummary, setMeetingSummary] = useState<{ summary: string; key_decisions: string[]; action_items: { item: string; assignee: string }[] } | null>(null)

  // Scrum Master States
  const [weeklyPlan, setWeeklyPlan] = useState<{ focus: string; priorities: string[]; assignments: string[] } | null>(null)
  const [sprintReview, setSprintReview] = useState<{ completed_count: number; total_count: number; achievements: string[]; carryover: string[]; summary: string } | null>(null)
  const [standup, setStandup] = useState<{ yesterday: string[]; today: string[]; blockers: string[] } | null>(null)
  const [releaseNotes, setReleaseNotes] = useState<{ version: string; title: string; features: string[]; improvements: string[] } | null>(null)

  const handleAgentAction = async (action: string, extraData?: any) => {
    setLoadingAction(action)
    try {
      const res = await fetch('/api/ai/agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          project_id: projectId,
          team_id: teamId,
          data: extraData
        })
      })

      const result = await res.json()
      if (result.success) {
        if (action === 'detect-blockers') setBlockersData(result.data)
        else if (action === 'recommend-next-actions') setNextActions(result.data)
        else if (action === 'summarize-meeting') setMeetingSummary(result.data)
        toast.success("Analysis complete!")
      } else {
        toast.error(result.error || "Failed to process AI action")
      }
    } catch (error) {
      toast.error("Network error executing action")
    } finally {
      setLoadingAction(null)
    }
  }

  const handleScrumAction = async (action: string) => {
    setLoadingAction(action)
    try {
      const res = await fetch('/api/ai/scrum', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          project_id: projectId,
          team_id: teamId
        })
      })

      const result = await res.json()
      if (result.success) {
        if (action === 'weekly-plan') setWeeklyPlan(result.data)
        else if (action === 'review-sprint') setSprintReview(result.data)
        else if (action === 'standup-summary') setStandup(result.data)
        else if (action === 'release-notes') setReleaseNotes(result.data)
        toast.success("Scrum report generated!")
      } else {
        toast.error(result.error || "Failed to generate Scrum report")
      }
    } catch (error) {
      toast.error("Network error executing Scrum master task")
    } finally {
      setLoadingAction(null)
    }
  }

  return (
    <div className="w-full space-y-6">
      <Tabs defaultValue="assistant" className="w-full">
        <TabsList className="grid grid-cols-2 max-w-md bg-muted/40 border border-purple-500/10">
          <TabsTrigger value="assistant" className="gap-2">
            <Sparkles className="size-4 text-purple-500" />
            <span>AI Assistant</span>
          </TabsTrigger>
          <TabsTrigger value="scrum" className="gap-2">
            <Trophy className="size-4 text-amber-500" />
            <span>AI Scrum Master</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="assistant" className="space-y-6 mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Blocker & Risks Panel */}
            <Card className="border-purple-500/20 bg-gradient-to-br from-background to-purple-500/5">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-purple-700 dark:text-purple-300">
                  <AlertTriangle className="size-5 text-purple-500" />
                  <span>Marlin Blocker Radar</span>
                </CardTitle>
                <CardDescription>Detect at-risk tasks and project roadblocks automatically.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button 
                  onClick={() => handleAgentAction('detect-blockers')} 
                  disabled={loadingAction === 'detect-blockers'}
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white gap-2"
                >
                  {loadingAction === 'detect-blockers' ? (
                    <>
                      <Loader2 className="size-4 animate-spin" />
                      Analyzing workspace...
                    </>
                  ) : (
                    <>
                      <Sparkles className="size-4" />
                      Scan for Blockers
                    </>
                  )}
                </Button>

                {blockersData && (
                  <div className="space-y-3 mt-4 text-sm animate-in fade-in duration-200">
                    {blockersData.blockers.length > 0 ? (
                      <div>
                        <h4 className="font-bold text-red-500 mb-1">Blockers Found:</h4>
                        <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
                          {blockersData.blockers.map((b, idx) => <li key={idx}>{b}</li>)}
                        </ul>
                      </div>
                    ) : (
                      <div className="text-emerald-500 flex items-center gap-1.5 font-medium">
                        <CheckCircle2 className="size-4" /> No active blockers detected!
                      </div>
                    )}

                    {blockersData.at_risk_tasks.length > 0 && (
                      <div>
                        <h4 className="font-bold text-amber-500 mb-1">Tasks At Risk:</h4>
                        <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
                          {blockersData.at_risk_tasks.map((r, idx) => <li key={idx}>{r}</li>)}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Recommendations & Next Actions */}
            <Card className="border-blue-500/20 bg-gradient-to-br from-background to-blue-500/5">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-blue-700 dark:text-blue-300">
                  <Lightbulb className="size-5 text-blue-500" />
                  <span>Marlin Smart Planner</span>
                </CardTitle>
                <CardDescription>Determine what actions the team should execute next.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button 
                  onClick={() => handleAgentAction('recommend-next-actions')} 
                  disabled={loadingAction === 'recommend-next-actions'}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white gap-2"
                >
                  {loadingAction === 'recommend-next-actions' ? (
                    <>
                      <Loader2 className="size-4 animate-spin" />
                      Generating plan...
                    </>
                  ) : (
                    <>
                      <Play className="size-4" />
                      Recommend Next Actions
                    </>
                  )}
                </Button>

                {nextActions && (
                  <div className="space-y-2 mt-4 text-sm animate-in fade-in duration-200">
                    <h4 className="font-bold text-foreground mb-2">Priority Actions:</h4>
                    {nextActions.map((action, idx) => (
                      <div key={idx} className="flex gap-2.5 items-start p-2.5 rounded bg-blue-500/5 border border-blue-500/10">
                        <Badge variant="outline" className="text-blue-500 border-blue-500/20 font-mono mt-0.5">{idx + 1}</Badge>
                        <p className="text-muted-foreground leading-tight">{action}</p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Meeting Summarizer */}
            <Card className="md:col-span-2 border-indigo-500/20">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-indigo-700 dark:text-indigo-300">
                  <ClipboardList className="size-5 text-indigo-500" />
                  <span>AI Meeting Summarizer</span>
                </CardTitle>
                <CardDescription>Paste raw notes or transcripts to extract actions and decisions.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Textarea
                  placeholder="Type or paste meeting notes here... (e.g. 'Sarah will fix the login bug by Friday.')"
                  value={meetingNotes}
                  onChange={(e) => setMeetingNotes(e.target.value)}
                  rows={3}
                  className="bg-muted/50 border-indigo-500/10 focus-visible:ring-indigo-500"
                />
                <Button
                  onClick={() => handleAgentAction('summarize-meeting', { notes: meetingNotes })}
                  disabled={loadingAction === 'summarize-meeting' || !meetingNotes.trim()}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2"
                >
                  {loadingAction === 'summarize-meeting' ? (
                    <>
                      <Loader2 className="size-4 animate-spin" />
                      Summarizing...
                    </>
                  ) : (
                    <>
                      <Sparkles className="size-4" />
                      Generate Summary
                    </>
                  )}
                </Button>

                {meetingSummary && (
                  <div className="mt-4 border-t border-muted pt-4 space-y-4 animate-in fade-in duration-200">
                    <div>
                      <h4 className="font-bold text-foreground mb-1 text-sm">Summary:</h4>
                      <p className="text-muted-foreground text-sm">{meetingSummary.summary}</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="scrum" className="space-y-6 mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Daily Standup Generator */}
            <Card className="border-amber-500/20 bg-gradient-to-br from-background to-amber-500/5">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-amber-700 dark:text-amber-300">
                  <Calendar className="size-5 text-amber-500" />
                  <span>AI Daily Standup</span>
                </CardTitle>
                <CardDescription>Synthesize accomplishments, plans, and blockers automatically.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button 
                  onClick={() => handleScrumAction('standup-summary')} 
                  disabled={loadingAction === 'standup-summary'}
                  className="w-full bg-amber-600 hover:bg-amber-700 text-white gap-2"
                >
                  {loadingAction === 'standup-summary' ? (
                    <>
                      <Loader2 className="size-4 animate-spin" />
                      Generating Standup...
                    </>
                  ) : (
                    <>
                      <Sparkles className="size-4" />
                      Compile Standup Report
                    </>
                  )}
                </Button>

                {standup && (
                  <div className="space-y-3 mt-4 text-xs animate-in fade-in duration-200">
                    <div>
                      <h4 className="font-bold text-amber-700 dark:text-amber-300 mb-1">Yesterday:</h4>
                      <ul className="list-disc pl-4 space-y-1 text-muted-foreground">
                        {standup.yesterday.map((y, idx) => <li key={idx}>{y}</li>)}
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-bold text-amber-700 dark:text-amber-300 mb-1">Today:</h4>
                      <ul className="list-disc pl-4 space-y-1 text-muted-foreground">
                        {standup.today.map((t, idx) => <li key={idx}>{t}</li>)}
                      </ul>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Weekly Plan Generator */}
            <Card className="border-emerald-500/20 bg-gradient-to-br from-background to-emerald-500/5">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-emerald-700 dark:text-emerald-300">
                  <ClipboardList className="size-5 text-emerald-500" />
                  <span>AI Weekly Plan</span>
                </CardTitle>
                <CardDescription>Map out weekly tasks, focus objectives, and priorities.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button 
                  onClick={() => handleScrumAction('weekly-plan')} 
                  disabled={loadingAction === 'weekly-plan'}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white gap-2"
                >
                  {loadingAction === 'weekly-plan' ? (
                    <>
                      <Loader2 className="size-4 animate-spin" />
                      Creating Plan...
                    </>
                  ) : (
                    <>
                      <Play className="size-4" />
                      Generate Weekly Plan
                    </>
                  )}
                </Button>

                {weeklyPlan && (
                  <div className="space-y-3 mt-4 text-xs animate-in fade-in duration-200">
                    <div className="p-2 bg-emerald-500/5 rounded border border-emerald-500/10">
                      <span className="font-bold text-emerald-700 dark:text-emerald-300 block">Focus area:</span>
                      <p className="text-muted-foreground">{weeklyPlan.focus}</p>
                    </div>
                    <div>
                      <span className="font-bold text-foreground block">Key Priorities:</span>
                      <ul className="list-disc pl-4 space-y-1 text-muted-foreground">
                        {weeklyPlan.priorities.map((p, idx) => <li key={idx}>{p}</li>)}
                      </ul>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Sprint Review & Release Notes */}
            <Card className="md:col-span-2 border-indigo-500/20 bg-gradient-to-br from-background to-indigo-500/5">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-indigo-700 dark:text-indigo-300">
                  <FileText className="size-5 text-indigo-500" />
                  <span>Sprint Closure & Release Notes</span>
                </CardTitle>
                <CardDescription>Summarize completions, carryovers, and draft release announcements.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-col sm:flex-row gap-3">
                  <Button
                    onClick={() => handleScrumAction('review-sprint')}
                    disabled={loadingAction === 'review-sprint'}
                    variant="outline"
                    className="flex-1 border-indigo-500/30 hover:bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 gap-2"
                  >
                    {loadingAction === 'review-sprint' ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
                    Review Current Sprint
                  </Button>
                  <Button
                    onClick={() => handleScrumAction('release-notes')}
                    disabled={loadingAction === 'release-notes'}
                    variant="outline"
                    className="flex-1 border-purple-500/30 hover:bg-purple-500/10 text-purple-700 dark:text-purple-300 gap-2"
                  >
                    {loadingAction === 'release-notes' ? <Loader2 className="size-4 animate-spin" /> : <FileText className="size-4" />}
                    Generate Release Notes
                  </Button>
                </div>

                {sprintReview && (
                  <div className="p-3 bg-muted/40 rounded-lg border border-border mt-4 text-xs space-y-2 animate-in fade-in duration-200">
                    <div className="flex justify-between items-center font-bold">
                      <span>Velocity Review:</span>
                      <Badge>{sprintReview.completed_count} / {sprintReview.total_count} Tasks Done</Badge>
                    </div>
                    <p className="text-muted-foreground">{sprintReview.summary}</p>
                  </div>
                )}

                {releaseNotes && (
                  <div className="p-3 bg-purple-500/5 rounded-lg border border-purple-500/15 mt-4 text-xs space-y-2 animate-in fade-in duration-200">
                    <div className="flex justify-between items-center font-bold">
                      <span className="text-purple-700 dark:text-purple-300">{releaseNotes.title}</span>
                      <Badge variant="secondary">{releaseNotes.version}</Badge>
                    </div>
                    <div>
                      <span className="font-semibold block">Key Features:</span>
                      <ul className="list-disc pl-4 text-muted-foreground">
                        {releaseNotes.features.map((f, idx) => <li key={idx}>{f}</li>)}
                      </ul>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
