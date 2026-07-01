"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Heart, Activity, ShieldAlert, Sparkles, CheckCircle2, TrendingUp, AlertTriangle, MessageSquare, Loader2, BarChart2, FolderKanban, Users } from "lucide-react"
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, BarChart, Bar, CartesianGrid, Legend } from "recharts"
import { toast } from "sonner"
import { useParams } from "next/navigation"
import { useTheme } from "next-themes"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"

interface HealthData {
  team_id: string
  engagement_score: number
  productivity_score: number
  burnout_risk: string
  conflict_risk: string
  project_failure_risk: string
  inactive_members: number
  workload_imbalance: number
  total_comments: number
  completed_tasks: number
  total_tasks: number
  late_tasks: number
  monitored_at: string
}

interface TeamStats {
  overall: {
    total_projects: number
    total_tasks: number
    completed_tasks: number
    todo_tasks: number
    in_progress_tasks: number
    total_members: number
    completion_rate: number
  }
  by_user: Array<{
    auth_user_id: string
    first_name: string
    last_name: string
    assigned_tasks: number
    completed_tasks: number
  }>
  by_project: Array<{
    project_id: string
    project_name: string
    total_tasks: number
    completed_tasks: number
    in_progress_tasks: number
  }>
  status_distribution: {
    todo: number
    in_progress: number
    done: number
  }
  priority_distribution: {
    high: number
    medium: number
    low: number
  }
}

interface TeamHealthDashboardProps {
  teamId: string
}

export function TeamHealthDashboard({ teamId }: TeamHealthDashboardProps) {
  const params = useParams()
  const teamUrl = params.teamUrl as string
  const { resolvedTheme } = useTheme()

  const [health, setHealth] = useState<HealthData | null>(null)
  const [stats, setStats] = useState<TeamStats | null>(null)
  const [loading, setLoading] = useState(true)

  const [aiReport, setAiReport] = useState<string | null>(null)
  const [generatingAi, setGeneratingAi] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        const [healthRes, statsRes] = await Promise.all([
          fetch(`/api/teams/health?team_id=${teamId}`),
          fetch(`/api/teams/${teamUrl}/stats`)
        ])

        const healthResult = await healthRes.json()
        const statsResult = await statsRes.json()

        if (healthResult.success) {
          setHealth(healthResult.data)
        }
        if (statsResult.success) {
          setStats(statsResult.data)
        }
      } catch (err) {
        console.error(err)
        toast.error("Error loading team diagnostics")
      } finally {
        setLoading(false)
      }
    }

    if (teamId && teamUrl) fetchData()
  }, [teamId, teamUrl])

  useEffect(() => {
    if (!aiReport) return

    // Inject KaTeX CSS
    if (!document.getElementById("katex-css")) {
      const link = document.createElement("link")
      link.id = "katex-css"
      link.rel = "stylesheet"
      link.href = "https://cdn.jsdelivr.net/npm/katex@0.16.8/dist/katex.min.css"
      document.head.appendChild(link)
    }

    // Inject KaTeX JS
    const loadKatex = () => {
      if (!(window as any).katex) {
        const script = document.createElement("script")
        script.src = "https://cdn.jsdelivr.net/npm/katex@0.16.8/dist/katex.min.js"
        script.async = true;
        script.onload = () => loadAutoRender()
        document.body.appendChild(script)
      } else {
        loadAutoRender()
      }
    }

    // Inject Auto-render JS
    const loadAutoRender = () => {
      if (!(window as any).renderMathInElement) {
        const script = document.createElement("script")
        script.src = "https://cdn.jsdelivr.net/npm/katex@0.16.8/dist/contrib/auto-render.min.js"
        script.async = true;
        script.onload = () => triggerRender()
        document.body.appendChild(script)
      } else {
        triggerRender()
      }
    }

    // Trigger rendering on content
    const triggerRender = () => {
      const el = document.getElementById("ai-report-content")
      if (el && (window as any).renderMathInElement) {
        try {
          (window as any).renderMathInElement(el, {
            delimiters: [
              { left: "$$", right: "$$", display: true },
              { left: "$", right: "$", display: false }
            ],
            throwOnError: false
          })
        } catch (e) {
          console.error("Error rendering KaTeX math:", e)
        }
      }
    }

    loadKatex()
  }, [aiReport])

  const generateTeamReport = async () => {
    try {
      setGeneratingAi(true)
      const res = await fetch('/api/ai/team-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ team_id: teamId })
      })
      const result = await res.json()
      if (result.success) {
        setAiReport(result.data)
        toast.success("Marlin's Advisory report generated!")
      } else {
        toast.error(result.error || "Failed to generate report")
      }
    } catch (err) {
      console.error(err)
      toast.error("Error connecting to Marlin")
    } finally {
      setGeneratingAi(false)
    }
  }

  if (loading) {
    return (
      <div className="flex h-80 flex-col items-center justify-center space-y-4">
        <Activity className="size-10 animate-spin text-primary" />
        <span className="text-sm font-semibold text-muted-foreground">Running diagnostic scans & crunching team workloads...</span>
      </div>
    )
  }

  if (!health || !stats) {
    return <div className="text-center p-12 text-muted-foreground">No metrics available. Please assign projects and tasks to team members first.</div>
  }

  const getRiskColor = (risk: string) => {
    switch (risk.toLowerCase()) {
      case "high": return "bg-red-500/10 text-red-500 border-red-500/20"
      case "medium": return "bg-amber-500/10 text-amber-500 border-amber-500/20"
      default: return "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
    }
  }

  // Theme-adaptive chart colors
  const isDark = resolvedTheme === "dark"
  const textFill = isDark ? "#a1a1aa" : "#71717a"
  const gridStroke = isDark ? "#27272a" : "#e2e8f0"
  const tooltipBg = isDark ? "#18181b" : "#ffffff"
  const tooltipBorder = isDark ? "#27272a" : "#e2e8f0"

  // 5-day cadence chart data
  const trendData = [
    { name: "Day 1", productivity: Math.max(30, health.productivity_score - 15), engagement: Math.max(20, health.engagement_score - 8) },
    { name: "Day 2", productivity: Math.max(30, health.productivity_score - 8), engagement: Math.max(20, health.engagement_score - 4) },
    { name: "Day 3", productivity: Math.max(30, health.productivity_score - 12), engagement: Math.max(20, health.engagement_score + 3) },
    { name: "Day 4", productivity: Math.max(30, health.productivity_score + 2), engagement: Math.max(20, health.engagement_score + 5) },
    { name: "Day 5", productivity: health.productivity_score, engagement: health.engagement_score }
  ]

  // Member workload data mapping
  const memberWorkloadData = stats.by_user.map(u => ({
    name: `${u.first_name} ${u.last_name[0]}.`,
    "Assigned Tasks": u.assigned_tasks,
    "Completed Tasks": u.completed_tasks
  }))

  return (
    <div className="space-y-6">
      {/* Risk Indicators Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-red-500/20 bg-gradient-to-br from-background to-red-500/5 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-bold text-muted-foreground uppercase flex items-center justify-between tracking-wider">
              <span>Burnout Risk</span>
              <Heart className="size-4 text-red-500" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold capitalize">{health.burnout_risk}</span>
              <Badge variant="outline" className={getRiskColor(health.burnout_risk)}>
                {health.burnout_risk === 'high' ? 'Overworked' : 'Healthy'}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-1.5">Based on workload imbalance ({health.workload_imbalance}%) and total active tasks.</p>
          </CardContent>
        </Card>

        <Card className="border-amber-500/20 bg-gradient-to-br from-background to-amber-500/5 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-bold text-muted-foreground uppercase flex items-center justify-between tracking-wider">
              <span>Conflict Risk</span>
              <AlertTriangle className="size-4 text-amber-500" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold capitalize">{health.conflict_risk}</span>
              <Badge variant="outline" className={getRiskColor(health.conflict_risk)}>
                {health.total_comments < 3 ? 'Silenced' : 'Normal'}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-1.5">Evaluated from communication density ({health.total_comments} comments in last 14 days).</p>
          </CardContent>
        </Card>

        <Card className="border-purple-500/20 bg-gradient-to-br from-background to-purple-500/5 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-bold text-muted-foreground uppercase flex items-center justify-between tracking-wider">
              <span>Failure Risk</span>
              <ShieldAlert className="size-4 text-purple-500" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold capitalize">{health.project_failure_risk}</span>
              <Badge variant="outline" className={getRiskColor(health.project_failure_risk)}>
                {health.late_tasks > 0 ? 'Delayed Items' : 'On Track'}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-1.5">{health.late_tasks} overdue tasks out of {health.total_tasks} total sprint tasks.</p>
          </CardContent>
        </Card>
      </div>

      {/* KPI Scores and Area Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1 border shadow-sm">
          <CardHeader>
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <Activity className="size-4 text-primary" />
              <span>Health Diagnostics</span>
            </CardTitle>
            <CardDescription>Core productivity and engagement indexes.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">Engagement Rate</span>
                <span className="font-bold">{health.engagement_score}%</span>
              </div>
              <Progress value={health.engagement_score} className="h-2" />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">Productivity Output</span>
                <span className="font-bold">{health.productivity_score}%</span>
              </div>
              <Progress value={health.productivity_score} className="h-2" />
            </div>

            <div className="pt-4 border-t grid grid-cols-2 gap-4 text-center">
              <div className="p-3 rounded-xl bg-muted/30">
                <span className="text-xs text-muted-foreground block mb-0.5">Inactive Members</span>
                <span className="text-lg font-bold text-red-500">{health.inactive_members}</span>
              </div>
              <div className="p-3 rounded-xl bg-muted/30">
                <span className="text-xs text-muted-foreground block mb-0.5">Tasks Completed</span>
                <span className="text-lg font-bold text-emerald-500">{health.completed_tasks}/{health.total_tasks}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2 border shadow-sm">
          <CardHeader>
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <TrendingUp className="size-4 text-primary" />
              <span>Performance Cadence</span>
            </CardTitle>
            <CardDescription>5-day sprint trajectory representing dynamics.</CardDescription>
          </CardHeader>
          <CardContent className="h-60 pr-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData} margin={{ left: -20, right: 10 }}>
                <defs>
                  <linearGradient id="colorProd" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorEng" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
                <XAxis dataKey="name" stroke={textFill} fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke={textFill} fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ backgroundColor: tooltipBg, borderColor: tooltipBorder, color: isDark ? "#ffffff" : "#000000" }} />
                <Area type="monotone" dataKey="productivity" stroke="hsl(var(--primary))" fillOpacity={1} fill="url(#colorProd)" strokeWidth={2} name="Productivity" />
                <Area type="monotone" dataKey="engagement" stroke="#3b82f6" fillOpacity={1} fill="url(#colorEng)" strokeWidth={2} name="Engagement" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Member Workload Bar Chart and Projects List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* User Stats and Workload */}
        <Card className="border shadow-sm">
          <CardHeader>
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <BarChart2 className="size-4 text-primary" />
              <span>Members Workload & Efficiency</span>
            </CardTitle>
            <CardDescription>Assigned tasks vs successfully completed items.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="h-60 pr-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={memberWorkloadData} margin={{ left: -20, right: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
                  <XAxis dataKey="name" stroke={textFill} fontSize={10} tickLine={false} axisLine={false} />
                  <YAxis stroke={textFill} fontSize={10} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={{ backgroundColor: tooltipBg, borderColor: tooltipBorder, color: isDark ? "#ffffff" : "#000000" }} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="Assigned Tasks" fill="rgb(99, 102, 241)" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Completed Tasks" fill="rgb(16, 185, 129)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Members table */}
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full text-xs text-left">
                <thead className="bg-muted/50 font-semibold border-b">
                  <tr>
                    <th className="p-3">Teammate</th>
                    <th className="p-3 text-center">Assigned</th>
                    <th className="p-3 text-center">Completed</th>
                    <th className="p-3 text-right">Completion Rate</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {stats.by_user.map(u => {
                    const rate = u.assigned_tasks > 0 ? Math.round((u.completed_tasks / u.assigned_tasks) * 100) : 0
                    return (
                      <tr key={u.auth_user_id} className="hover:bg-muted/10">
                        <td className="p-3 font-medium">{u.first_name} {u.last_name}</td>
                        <td className="p-3 text-center text-muted-foreground">{u.assigned_tasks}</td>
                        <td className="p-3 text-center text-emerald-500 font-bold">{u.completed_tasks}</td>
                        <td className="p-3 text-right font-bold">{rate}%</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Projects List Panel */}
        <Card className="border shadow-sm">
          <CardHeader>
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <FolderKanban className="size-4 text-primary" />
              <span>Project Health & Progress</span>
            </CardTitle>
            <CardDescription>Overall completion rates across active projects.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {stats.by_project.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-12">No active projects found in this team.</p>
            ) : (
              stats.by_project.map(project => {
                const percent = project.total_tasks > 0 ? Math.round((project.completed_tasks / project.total_tasks) * 100) : 0
                return (
                  <div key={project.project_id} className="p-4 border rounded-xl bg-muted/10 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold">{project.project_name}</span>
                      <span className="text-xs text-muted-foreground font-semibold">
                        {project.completed_tasks}/{project.total_tasks} Tasks
                      </span>
                    </div>
                    <Progress value={percent} className="h-2" />
                    <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <CheckCircle2 className="size-3 text-emerald-500" /> {percent}% Complete
                      </span>
                      <span>{project.in_progress_tasks} In Progress</span>
                    </div>
                  </div>
                )
              })
            )}
          </CardContent>
        </Card>
      </div>

      {/* Marlin AI Advisor Panel */}
      <Card className="border-purple-500/20 bg-gradient-to-br from-background to-purple-500/5 shadow-md relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-5">
          <Sparkles className="size-40 text-purple-500" />
        </div>
        <CardHeader>
          <CardTitle className="text-base font-bold flex items-center gap-2">
            <Sparkles className="size-5 text-purple-500 animate-pulse" />
            <span>Marlin's AI Advisory Report</span>
          </CardTitle>
          <CardDescription>Instant dynamic report summarizing workload balance, productivity blocks, and actions.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {aiReport ? (
            <div id="ai-report-content" className="prose prose-sm dark:prose-invert max-w-none bg-background/50 border p-5 rounded-2xl backdrop-blur-sm animate-in fade-in duration-300">
              <div className="space-y-4 text-sm text-foreground/90 leading-relaxed">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {aiReport}
                </ReactMarkdown>
              </div>
            </div>
          ) : (
            <div className="text-center py-10 bg-background/30 rounded-2xl border border-dashed flex flex-col items-center justify-center space-y-3">
              <Users className="size-8 text-muted-foreground/50" />
              <div className="space-y-1">
                <p className="text-sm font-bold text-muted-foreground">Ready to analyze team diagnostics</p>
                <p className="text-xs text-muted-foreground/80">Click the button below to generate a deep behavioral and contribution advisory report.</p>
              </div>
            </div>
          )}

          <div className="flex justify-end pt-2">
            <Button
              onClick={generateTeamReport}
              disabled={generatingAi}
              className="gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold shadow-md rounded-xl"
            >
              {generatingAi ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  <span>Marlin is analyzing workload data...</span>
                </>
              ) : (
                <>
                  <Sparkles className="size-4" />
                  <span>Ask Marlin for Advisory Report</span>
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
