"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Trophy, Award, Flame, Zap, RefreshCw, Star, Users, ArrowUpRight } from "lucide-react"
import { toast } from "sonner"

interface GamificationStats {
  auth_user_id: string
  xp: number
  level: number
  streak_count: number
  last_activity_date: string
  contribution_score: number
}

interface BadgeItem {
  user_badge_id: string
  badge_name: string
  badge_type: string
  awarded_at: string
}

interface LeaderboardUser {
  rank: number
  auth_user_id: string
  first_name: string
  last_name: string
  profile_image: string | null
  xp: number
  level: number
  contribution_score: number
}

interface GamificationData {
  stats: GamificationStats
  badges: BadgeItem[]
  leaderboard: LeaderboardUser[]
}

interface GamificationWidgetProps {
  userId: string
}

export function GamificationWidget({ userId }: GamificationWidgetProps) {
  const [data, setData] = useState<GamificationData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchGamification = async () => {
      try {
        setLoading(true)
        const res = await fetch(`/api/users/gamification?user_id=${userId}`)
        const result = await res.json()
        if (result.success) {
          setData(result.data)
        } else {
          toast.error("Failed to load gamification data")
        }
      } catch (err) {
        console.error(err)
        toast.error("Network error loading gamification profile")
      } finally {
        setLoading(false)
      }
    }

    if (userId) fetchGamification()
  }, [userId])

  if (loading) {
    return (
      <div className="flex h-40 items-center justify-center">
        <Trophy className="size-8 animate-spin text-amber-500" />
        <span className="ml-2 text-sm text-muted-foreground">Loading achievements...</span>
      </div>
    )
  }

  if (!data) return null

  const xpNeededForNextLevel = 500
  const xpInCurrentLevel = data.stats.xp % xpNeededForNextLevel
  const levelProgress = (xpInCurrentLevel / xpNeededForNextLevel) * 100

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* User Stats & Badges */}
      <Card className="lg:col-span-2 border-amber-500/20 bg-gradient-to-br from-background to-amber-500/5 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full blur-3xl"></div>
        <CardHeader>
          <CardTitle className="text-lg font-bold flex items-center gap-2">
            <Trophy className="size-5 text-amber-500" />
            <span>Gamification & Accomplishments</span>
          </CardTitle>
          <CardDescription>Earn XP by finishing tasks and completing streaks.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* XP & Level progress */}
          <div className="p-4 rounded-xl border bg-muted/20 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs text-muted-foreground block">Global Level</span>
                <span className="text-3xl font-black text-amber-600 dark:text-amber-400">Level {data.stats.level}</span>
              </div>
              <div className="text-right">
                <span className="text-xs text-muted-foreground block">Contribution Score</span>
                <span className="font-bold text-sm text-foreground flex items-center gap-1">
                  <Star className="size-4 text-amber-500 fill-amber-500" />
                  {data.stats.contribution_score.toFixed(1)}
                </span>
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{xpInCurrentLevel} / {xpNeededForNextLevel} XP</span>
                <span>{Math.round(levelProgress)}% to Level {data.stats.level + 1}</span>
              </div>
              <Progress value={levelProgress} className="h-2 bg-muted" />
            </div>

            <div className="flex items-center gap-4 pt-2">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-600 dark:text-amber-400">
                <Flame className="size-4 fill-amber-500 text-amber-500" />
                <span>{data.stats.streak_count} Day Project Streak</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs font-semibold text-purple-600 dark:text-purple-400">
                <Zap className="size-4 text-purple-500" />
                <span>{data.stats.xp} Total XP Accumulated</span>
              </div>
            </div>
          </div>

          {/* Badges inventory */}
          <div className="space-y-3">
            <h4 className="font-bold text-sm flex items-center gap-1.5">
              <Award className="size-4 text-amber-500" />
              <span>Earned Badges</span>
            </h4>
            <div className="flex flex-wrap gap-2.5">
              {data.badges.map((badge) => (
                <div 
                  key={badge.user_badge_id} 
                  className={`px-3 py-2 rounded-xl border flex items-center gap-2 text-xs font-semibold shadow-sm ${
                    badge.badge_type === 'legendary' 
                      ? 'bg-red-500/10 text-red-500 border-red-500/30' 
                      : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30'
                  }`}
                >
                  <Award className="size-4" />
                  <div>
                    <p className="leading-tight">{badge.badge_name}</p>
                    <span className="text-[9px] text-muted-foreground font-mono block uppercase">{badge.badge_type}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Top Students Leaderboard */}
      <Card className="lg:col-span-1 border-muted">
        <CardHeader>
          <CardTitle className="text-base font-bold flex items-center gap-1.5">
            <Users className="size-4.5 text-amber-500" />
            <span>Top Students Leaderboard</span>
          </CardTitle>
          <CardDescription>Global contributor rankings by accumulated XP.</CardDescription>
        </CardHeader>
        <CardContent className="px-3">
          <div className="space-y-2">
            {data.leaderboard.map((user) => (
              <div 
                key={user.auth_user_id} 
                className={`flex items-center justify-between p-2 rounded-xl transition-colors text-xs ${
                  user.auth_user_id === userId ? 'bg-amber-500/10 border border-amber-500/20' : 'hover:bg-muted/50'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className={`w-5 font-bold font-mono text-center text-[10px] ${
                    user.rank === 1 ? 'text-yellow-500' : user.rank === 2 ? 'text-gray-400' : user.rank === 3 ? 'text-amber-600' : 'text-muted-foreground'
                  }`}>
                    #{user.rank}
                  </span>
                  <Avatar className="size-7">
                    <AvatarImage src={user.profile_image || ''} />
                    <AvatarFallback className="text-[10px] font-bold">
                      {user.first_name[0]}{user.last_name[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p className="font-semibold truncate text-foreground leading-tight">
                      {user.first_name} {user.last_name}
                    </p>
                    <span className="text-[9px] text-muted-foreground font-medium">Lvl {user.level}</span>
                  </div>
                </div>
                <div className="text-right whitespace-nowrap">
                  <span className="font-bold text-foreground text-xs">{user.xp}</span>
                  <span className="text-[9px] text-muted-foreground block">XP</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
