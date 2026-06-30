"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Clock, User, Zap, Users, ShieldAlert, Award, RefreshCw, Terminal, HeartHandshake } from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"

interface UserDnaData {
  auth_user_id: string
  preferred_working_hours: { start: string; end: string; timezone: string }
  communication_style: string
  leadership_score: number
  execution_speed: number
  consistency: number
  deadline_reliability: number
  collaboration_score: number
  preferred_technologies: string[]
  preferred_role: string
  learning_speed: number
}

interface UserDNACardProps {
  userId: string
  userName?: string
}

export function UserDNACard({ userId, userName = "Member" }: UserDNACardProps) {
  const [dna, setDna] = useState<UserDnaData | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const fetchDna = async (forceRefresh = false) => {
    if (forceRefresh) setRefreshing(true)
    else setLoading(true)

    try {
      const res = await fetch(`/api/users/dna?user_id=${userId}${forceRefresh ? '&refresh=true' : ''}`)
      const result = await res.json()
      if (result.success) {
        setDna(result.data)
      } else {
        toast.error("Failed to load user DNA")
      }
    } catch (err) {
      console.error(err)
      toast.error("Network error loading DNA")
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    fetchDna()
  }, [userId])

  if (loading) {
    return (
      <Card className="w-full h-80 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="size-8 animate-spin text-purple-500 mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">Decoding user DNA...</p>
        </div>
      </Card>
    )
  }

  if (!dna) {
    return (
      <Card className="w-full p-6 text-center">
        <p className="text-muted-foreground">No DNA profile found.</p>
        <Button size="sm" className="mt-2" onClick={() => fetchDna(true)}>Initialize Profile</Button>
      </Card>
    )
  }

  const metrics = [
    { name: "Execution Speed", value: dna.execution_speed, icon: <Zap className="size-4 text-amber-500" /> },
    { name: "Deadline Reliability", value: dna.deadline_reliability, icon: <Clock className="size-4 text-emerald-500" /> },
    { name: "Consistency", value: dna.consistency, icon: <ShieldAlert className="size-4 text-blue-500" /> },
    { name: "Leadership Score", value: dna.leadership_score, icon: <Award className="size-4 text-red-500" /> },
    { name: "Collaboration Score", value: dna.collaboration_score, icon: <Users className="size-4 text-purple-500" /> },
    { name: "Learning Speed", value: dna.learning_speed, icon: <HeartHandshake className="size-4 text-pink-500" /> }
  ]

  return (
    <Card className="border-purple-500/20 bg-gradient-to-br from-background via-background to-purple-500/5 shadow-xl relative overflow-hidden">
      <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/5 rounded-full blur-2xl"></div>
      <CardHeader className="pb-3 flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-xl font-bold flex items-center gap-2">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-indigo-600 dark:from-purple-400 dark:to-indigo-400">
              AI Team DNA Profile
            </span>
          </CardTitle>
          <CardDescription>Behavioral metrics calculated from project engagement patterns.</CardDescription>
        </div>
        <Button 
          variant="outline" 
          size="icon" 
          onClick={() => fetchDna(true)} 
          disabled={refreshing}
          className="size-8 text-purple-500 border-purple-500/20 hover:bg-purple-500/10"
        >
          <RefreshCw className={`size-4 ${refreshing ? 'animate-spin' : ''}`} />
        </Button>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Core Attributes Header */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="p-3 rounded-xl border border-muted bg-muted/20">
            <span className="text-xs text-muted-foreground block mb-0.5">Role Persona</span>
            <span className="font-semibold text-sm flex items-center gap-1.5">
              <User className="size-3.5 text-purple-500" />
              {dna.preferred_role}
            </span>
          </div>
          <div className="p-3 rounded-xl border border-muted bg-muted/20">
            <span className="text-xs text-muted-foreground block mb-0.5">Communication Style</span>
            <span className="font-semibold text-sm flex items-center gap-1.5">
              <Badge variant="outline" className="text-purple-500 border-purple-500/30 bg-purple-500/5">{dna.communication_style}</Badge>
            </span>
          </div>
          <div className="p-3 rounded-xl border border-muted bg-muted/20">
            <span className="text-xs text-muted-foreground block mb-0.5">Peak Working Hours</span>
            <span className="font-semibold text-xs flex items-center gap-1">
              <Clock className="size-3.5 text-purple-500" />
              {dna.preferred_working_hours.start} - {dna.preferred_working_hours.end} ({dna.preferred_working_hours.timezone})
            </span>
          </div>
        </div>

        {/* Evolving Scores progress bars */}
        <div className="space-y-4">
          <h4 className="font-semibold text-xs uppercase tracking-wider text-muted-foreground">Evolving Behavioral Scores</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {metrics.map((metric) => (
              <div key={metric.name} className="space-y-1.5 p-2 rounded-lg border border-border/50 hover:bg-muted/10 transition-colors">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    {metric.icon}
                    <span className="font-medium">{metric.name}</span>
                  </div>
                  <span className="font-bold text-xs">{metric.value.toFixed(0)}%</span>
                </div>
                <Progress value={metric.value} className="h-1.5 bg-muted" />
              </div>
            ))}
          </div>
        </div>

        {/* Preferred technologies */}
        {dna.preferred_technologies && dna.preferred_technologies.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-semibold text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Terminal className="size-3.5 text-purple-500" />
              <span>Preferred Tech Stack</span>
            </h4>
            <div className="flex flex-wrap gap-1.5">
              {dna.preferred_technologies.map((tech) => (
                <Badge key={tech} variant="secondary" className="text-xs font-mono">{tech}</Badge>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
