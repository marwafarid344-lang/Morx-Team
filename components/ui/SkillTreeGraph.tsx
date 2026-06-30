"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Sparkles, Trophy, GitFork, Star, TrendingUp, Calendar, Zap, AlertCircle } from "lucide-react"
import { toast } from "sonner"

interface Skill {
  auth_user_id: string
  skill_name: string
  experience_points: number
  confidence_score: number
  level: number
  updated_at: string
}

interface SkillData {
  skills: Skill[]
  timeline: { date: string; skill: string; xp_gained: number; total_xp: number }[]
  hidden_talents: string[]
  global_confidence: number
}

interface SkillTreeGraphProps {
  userId: string
}

export function SkillTreeGraph({ userId }: SkillTreeGraphProps) {
  const [data, setData] = useState<SkillData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchSkills = async () => {
      try {
        setLoading(true)
        const res = await fetch(`/api/users/skills?user_id=${userId}`)
        const result = await res.json()
        if (result.success) {
          setData(result.data)
        } else {
          toast.error("Failed to load skill tree data")
        }
      } catch (err) {
        console.error(err)
        toast.error("Network error loading skills")
      } finally {
        setLoading(false)
      }
    }

    if (userId) fetchSkills()
  }, [userId])

  if (loading) {
    return (
      <div className="flex h-60 items-center justify-center">
        <GitFork className="size-8 animate-spin text-purple-500" />
        <span className="ml-2 text-sm text-muted-foreground">Mapping skill tree...</span>
      </div>
    )
  }

  if (!data || data.skills.length === 0) {
    return <div className="text-center p-6 text-muted-foreground">No skill data available.</div>
  }

  return (
    <div className="space-y-6">
      {/* Skill Summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-purple-500/20 bg-gradient-to-br from-background to-purple-500/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-muted-foreground uppercase flex items-center justify-between">
              <span>Primary Specialization</span>
              <Trophy className="size-4 text-purple-500" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-extrabold">{data.skills[0]?.skill_name || 'Generalist'}</div>
            <p className="text-xs text-muted-foreground mt-1">Level {data.skills[0]?.level || 1} · {data.skills[0]?.experience_points || 0} XP total</p>
          </CardContent>
        </Card>

        <Card className="border-emerald-500/20 bg-gradient-to-br from-background to-emerald-500/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-muted-foreground uppercase flex items-center justify-between">
              <span>Overall Confidence</span>
              <Star className="size-4 text-emerald-500" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-extrabold">{data.global_confidence}%</div>
            <p className="text-xs text-muted-foreground mt-1">Based on task completion and project metrics.</p>
          </CardContent>
        </Card>

        <Card className="border-indigo-500/20 bg-gradient-to-br from-background to-indigo-500/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-muted-foreground uppercase flex items-center justify-between">
              <span>Hidden Talents</span>
              <Sparkles className="size-4 text-indigo-500" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold flex flex-wrap gap-1.5 mt-1">
              {data.hidden_talents.length > 0 ? (
                data.hidden_talents.map(t => <Badge key={t} variant="secondary" className="bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border-indigo-500/20">{t}</Badge>)
              ) : (
                <span className="text-muted-foreground text-sm font-medium">None detected yet</span>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Competencies built outside your core department.</p>
          </CardContent>
        </Card>
      </div>

      {/* Visually stunning Skill Tree Graph Map */}
      <Card className="border-muted bg-card">
        <CardHeader>
          <CardTitle className="text-lg font-bold flex items-center gap-1.5">
            <GitFork className="size-4 text-purple-500" />
            <span>Interactive Skill Node Map</span>
          </CardTitle>
          <CardDescription>Evolving nodes connected to your project task completions.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center p-6 bg-muted/20 rounded-xl relative overflow-hidden">
            {/* SVG Connecting lines in background */}
            <div className="absolute inset-0 z-0 pointer-events-none flex justify-center items-center">
              <svg className="w-full h-full opacity-30 stroke-purple-500" strokeWidth="2" strokeDasharray="4">
                <line x1="50%" y1="20%" x2="25%" y2="60%" />
                <line x1="50%" y1="20%" x2="50%" y2="60%" />
                <line x1="50%" y1="20%" x2="75%" y2="60%" />
              </svg>
            </div>

            {/* Core Root node */}
            <div className="z-10 bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-5 py-3 rounded-2xl shadow-lg border border-purple-500/30 text-center mb-16 animate-bounce">
              <span className="text-xs font-bold uppercase tracking-widest text-purple-200 block">Root Node</span>
              <span className="font-bold text-sm">Morx Team OS Profile</span>
            </div>

            {/* Connected Skill Leaves */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-2xl z-10">
              {data.skills.slice(0, 3).map((skill, index) => (
                <div key={skill.skill_name} className="bg-card border border-purple-500/20 rounded-xl p-4 shadow hover:shadow-md transition-shadow relative overflow-hidden">
                  <div className="absolute top-0 left-0 h-1 bg-gradient-to-r from-purple-500 to-indigo-500 w-full"></div>
                  <div className="flex justify-between items-start mb-2">
                    <span className="font-bold text-sm text-foreground">{skill.skill_name}</span>
                    <Badge variant="outline" className="text-[10px] text-purple-500 font-bold border-purple-500/20">Lvl {skill.level}</Badge>
                  </div>
                  
                  <div className="space-y-2 mt-3">
                    <div className="flex justify-between text-[11px] text-muted-foreground">
                      <span>XP: {skill.experience_points}</span>
                      <span>Confidence: {skill.confidence_score}%</span>
                    </div>
                    <Progress value={(skill.experience_points % 300) / 3} className="h-1 bg-muted" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Experience Timeline */}
      <Card className="border-muted bg-card">
        <CardHeader>
          <CardTitle className="text-base font-bold flex items-center gap-1.5">
            <Calendar className="size-4 text-emerald-500" />
            <span>Experience Timeline</span>
          </CardTitle>
          <CardDescription>Historical logs of automatic skill XP allocations.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {data.timeline.map((log, idx) => (
              <div key={idx} className="flex gap-4 items-start pb-4 border-b border-muted/50 last:border-0 last:pb-0 text-sm">
                <span className="text-xs font-mono text-muted-foreground whitespace-nowrap mt-0.5">{log.date}</span>
                <div className="flex-1">
                  <p className="font-medium text-foreground">Earned <span className="text-emerald-500 font-bold">+{log.xp_gained} XP</span> in <span className="text-purple-600 dark:text-purple-400 font-semibold">{log.skill}</span></p>
                  <p className="text-xs text-muted-foreground">Calculated automatically on task completion.</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
