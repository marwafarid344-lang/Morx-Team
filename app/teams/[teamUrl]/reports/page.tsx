"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { TeamHealthDashboard } from "@/components/analytics/TeamHealthDashboard"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { ArrowLeft, Activity } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"

export default function TeamReportsPage() {
  const params = useParams()
  const router = useRouter()
  const teamUrl = params.teamUrl as string
  const { user } = useAuth()

  const [team, setTeam] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchTeam = async () => {
      try {
        setLoading(true)
        const res = await fetch(`/api/teams/${teamUrl}`)
        const result = await res.json()
        if (result.success) {
          setTeam(result.data)
        }
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    if (teamUrl) fetchTeam()
  }, [teamUrl])

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      <main className="flex-1 container px-4 md:px-6 py-8 space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={() => router.back()} className="gap-1.5 text-xs">
            <ArrowLeft className="size-3.5" /> Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              <Activity className="size-5 text-primary" />
              <span>Team Health & Diagnostics</span>
            </h1>
            {team && <p className="text-sm text-muted-foreground">{team.team_name} reports overview</p>}
          </div>
        </div>

        {loading ? (
          <div className="flex h-60 items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : team ? (
          <TeamHealthDashboard teamId={team.team_id} />
        ) : (
          <Card className="p-6 text-center">
            <CardHeader>
              <CardTitle>Team Not Found</CardTitle>
              <CardDescription>Could not retrieve details for the requested team.</CardDescription>
            </CardHeader>
          </Card>
        )}
      </main>
      <Footer />
    </div>
  )
}
