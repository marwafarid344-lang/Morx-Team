"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Heart, Activity, ShieldAlert, Sparkles, CheckCircle2, TrendingUp, AlertTriangle, MessageSquare } from "lucide-react"
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip } from "recharts"
import { toast } from "sonner"

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

interface TeamHealthDashboardProps {
  teamId: string
}

export function TeamHealthDashboard({ teamId }: TeamHealthDashboardProps) {
  const [health, setHealth] = useState<HealthData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchHealth = async () => {
      try {
        setLoading(true)
        const res = await fetch(`/api/teams/health?team_id=${teamId}`)
        const result = await res.json()
        if (result.success) {
          setHealth(result.data)
        } else {
          toast.error("Failed to fetch team health metrics")
        }
      } catch (err) {
        console.error(err)
        toast.error("Network error loading team health")
      } finally {
        setLoading(false)
      }
    }

    if (teamId) fetchHealth()
  }, [teamId])

  if (loading) {
    return (
      <div className="flex h-60 items-center justify-center">
        <Activity className="size-8 animate-spin text-primary" />
        <span className="ml-2 text-sm text-muted-foreground">Running diagnostics...</span>
      </div>
    )
  }

  if (!health) return <div className="text-center p-6 text-muted-foreground">No health metrics available.</div>

  const getRiskColor = (risk: string) => {
    switch (risk.toLowerCase()) {
      case "high": return "bg-red-500/10 text-red-500 border-red-500/20"
      case "medium": return "bg-amber-500/10 text-amber-500 border-amber-500/20"
      default: return "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
    }
  }

  // Simulated trend data for graph
  const trendData = [
    { name: "Day 1", productivity: health.productivity_score - 10, engagement: health.engagement_score - 5 },
    { name: "Day 2", productivity: health.productivity_score - 5, engagement: health.engagement_score - 2 },
    { name: "Day 3", productivity: health.productivity_score - 8, engagement: health.engagement_score + 2 },
    { name: "Day 4", productivity: health.productivity_score + 2, engagement: health.engagement_score + 5 },
    { name: "Day 5", productivity: health.productivity_score, engagement: health.engagement_score }
  ]

  return (
    <div className="space-y-6">
      {/* 3 Columns: Risks Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-red-500/20 bg-gradient-to-br from-background to-red-500/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-muted-foreground uppercase flex items-center justify-between">
              <span>Burnout Risk</span>
              <Heart className="size-4 text-red-500" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold capitalize">{health.burnout_risk}</span>
              <Badge variant="outline" className={getRiskColor(health.burnout_risk)}>
                {health.burnout_risk === 'high' ? 'Critical' : 'Stable'}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-1">Based on workload imbalance ({health.workload_imbalance}%) and task density.</p>
          </CardContent>
        </Card>

        <Card className="border-amber-500/20 bg-gradient-to-br from-background to-amber-500/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-muted-foreground uppercase flex items-center justify-between">
              <span>Conflict Risk</span>
              <AlertTriangle className="size-4 text-amber-500" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold capitalize">{health.conflict_risk}</span>
              <Badge variant="outline" className={getRiskColor(health.conflict_risk)}>
                {health.total_comments < 3 ? 'Low Comm' : 'Normal'}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-1">Based on active communication volume ({health.total_comments} comments).</p>
          </CardContent>
        </Card>

        <Card className="border-purple-500/20 bg-gradient-to-br from-background to-purple-500/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-muted-foreground uppercase flex items-center justify-between">
              <span>Project Failure Risk</span>
              <ShieldAlert className="size-4 text-purple-500" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold capitalize">{health.project_failure_risk}</span>
              <Badge variant="outline" className={getRiskColor(health.project_failure_risk)}>
                {health.late_tasks > 0 ? 'Overdue Tasks' : 'Healthy'}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-1">{health.late_tasks} overdue tasks out of {health.total_tasks} total tasks.</p>
          </CardContent>
        </Card>
      </div>

      {/* Main KPI Progress Bars & Trend Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1 border-muted bg-card">
          <CardHeader>
            <CardTitle className="text-lg font-bold flex items-center gap-1.5">
              <Activity className="size-4 text-primary" />
              <span>Health Diagnostics</span>
            </CardTitle>
            <CardDescription>Core productivity and engagement parameters.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">Engagement Score</span>
                <span className="font-bold">{health.engagement_score}%</span>
              </div>
              <Progress value={health.engagement_score} className="h-2" />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">Productivity Score</span>
                <span className="font-bold">{health.productivity_score}%</span>
              </div>
              <Progress value={health.productivity_score} className="h-2" />
            </div>

            <div className="pt-2 border-t border-muted grid grid-cols-2 gap-4 text-center">
              <div className="p-2 rounded bg-muted/30">
                <span className="text-xs text-muted-foreground block">Inactive Members</span>
                <span className="text-lg font-bold text-red-500">{health.inactive_members}</span>
              </div>
              <div className="p-2 rounded bg-muted/30">
                <span className="text-xs text-muted-foreground block">Completed Tasks</span>
                <span className="text-lg font-bold text-emerald-500">{health.completed_tasks}/{health.total_tasks}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Visual Trend Chart */}
        <Card className="lg:col-span-2 border-muted">
          <CardHeader>
            <CardTitle className="text-lg font-bold flex items-center gap-1.5">
              <TrendingUp className="size-4 text-primary" />
              <span>Performance Cadence</span>
            </CardTitle>
            <CardDescription>5-day sprint trajectory representing team dynamics.</CardDescription>
          </CardHeader>
          <CardContent className="h-60">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData}>
                <defs>
                  <linearGradient id="colorProd" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="var(--primary)" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="name" stroke="#888888" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="#888888" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip />
                <Area type="monotone" dataKey="productivity" stroke="var(--primary)" fillOpacity={1} fill="url(#colorProd)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
