"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Users, Globe, Lock, Clock, Check, UserPlus, ArrowLeft, AlertCircle } from "lucide-react"

export default function JoinTeamPage() {
  const router = useRouter()
  const params = useParams()
  const teamUrl = params.teamUrl as string

  const [user, setUser] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [teamInfo, setTeamInfo] = useState<any>(null)
  const [joinMessage, setJoinMessage] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    const storedSession = localStorage.getItem('student_session')
    if (storedSession) {
      const userData = JSON.parse(storedSession)
      setUser({
        ...userData,
        auth_user_id: userData.auth_user_id || userData.id
      })
    } else {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    if (user?.auth_user_id) {
      fetchTeamInfo()
    }
  }, [teamUrl, user])

  const fetchTeamInfo = async () => {
    try {
      const res = await fetch(`/api/teams/${teamUrl}/join`)
      const result = await res.json()
      
      if (result.success) {
        setTeamInfo(result.data)
      } else {
        setError(result.error || 'Team not found')
      }
    } catch (error) {
      console.error('Error fetching team info:', error)
      setError('Failed to load team information')
    } finally {
      setIsLoading(false)
    }
  }

  const handleJoinRequest = async () => {
    if (!user?.auth_user_id) return
    setIsSubmitting(true)
    setError("")
    
    try {
      const res = await fetch(`/api/teams/${teamUrl}/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          auth_user_id: user.auth_user_id,
          message: joinMessage.trim() || null
        })
      })
      
      const result = await res.json()
      
      if (result.success) {
        // Refresh team info to show pending status
        fetchTeamInfo()
      } else {
        setError(result.error || 'Failed to send join request')
      }
    } catch (error) {
      console.error('Error sending join request:', error)
      setError('An error occurred. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCancelRequest = async () => {
    if (!user?.auth_user_id) return
    setIsSubmitting(true)
    
    try {
      const res = await fetch(`/api/teams/${teamUrl}/join`, {
        method: 'DELETE'
      })
      
      const result = await res.json()
      
      if (result.success) {
        fetchTeamInfo()
      } else {
        setError(result.error || 'Failed to cancel request')
      }
    } catch (error) {
      console.error('Error cancelling request:', error)
      setError('An error occurred. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading...</p>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  if (!user) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <Card className="max-w-md mx-4">
            <CardHeader>
              <CardTitle>Sign In Required</CardTitle>
              <CardDescription>
                Please sign in to request joining this team
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => router.push('/auth')} className="w-full">
                Sign In
              </Button>
            </CardContent>
          </Card>
        </main>
        <Footer />
      </div>
    )
  }

  if (error && !teamInfo) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <Card className="max-w-md mx-4">
            <CardHeader>
              <div className="flex items-center gap-3">
                <AlertCircle className="size-8 text-destructive" />
                <CardTitle>Team Not Found</CardTitle>
              </div>
              <CardDescription>{error}</CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" onClick={() => router.push('/teams')} className="w-full">
                <ArrowLeft className="mr-2 size-4" />
                Back to Teams
              </Button>
            </CardContent>
          </Card>
        </main>
        <Footer />
      </div>
    )
  }

  // Already a member
  if (teamInfo?.status === 'member') {
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center py-8">
          <Card className="max-w-md mx-4">
            <CardHeader>
              <div className="size-16 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-4">
                <Check className="size-8 text-green-500" />
              </div>
              <CardTitle className="text-center">You're Already a Member!</CardTitle>
              <CardDescription className="text-center">
                You are already a {teamInfo.role || 'member'} of {teamInfo.team_name}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button onClick={() => router.push(`/teams/${teamUrl}`)} className="w-full">
                Go to Team
              </Button>
              <Button variant="outline" onClick={() => router.push('/teams')} className="w-full">
                Back to Teams
              </Button>
            </CardContent>
          </Card>
        </main>
        <Footer />
      </div>
    )
  }

  // Has pending request
  if (teamInfo?.status === 'pending') {
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center py-8">
          <Card className="max-w-md mx-4">
            <CardHeader>
              <div className="size-16 rounded-full bg-yellow-500/10 flex items-center justify-center mx-auto mb-4">
                <Clock className="size-8 text-yellow-500" />
              </div>
              <CardTitle className="text-center">Request Pending</CardTitle>
              <CardDescription className="text-center">
                Your request to join <strong>{teamInfo.team_name}</strong> is awaiting approval from the team admin.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-center text-muted-foreground">
                Your request is currently awaiting review by the team administrator.
              </p>
              <Button 
                variant="outline" 
                onClick={handleCancelRequest} 
                disabled={isSubmitting}
                className="w-full text-red-600 hover:text-red-700"
              >
                Cancel Request
              </Button>
              <Button variant="ghost" onClick={() => router.push('/teams')} className="w-full">
                Back to Teams
              </Button>
            </CardContent>
          </Card>
        </main>
        <Footer />
      </div>
    )
  }

  // Join request form
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 flex items-center justify-center py-8 bg-muted/200">
        <Card className="max-w-lg mx-4 w-full">
          <CardHeader>
            <div className="flex items-center gap-4 mb-2">
              <div className={`size-14 rounded-lg flex items-center justify-center ${teamInfo?.is_public ? 'bg-green-500/10' : 'bg-orange-500/10'}`}>
                {teamInfo?.is_public 
                  ? <Globe className="size-7 text-green-500" /> 
                  : <Lock className="size-7 text-orange-500" />
                }
              </div>
              <div>
                <CardTitle className="text-2xl">{teamInfo?.team_name}</CardTitle>
                <Badge variant="secondary" className="mt-1">
                  {teamInfo?.is_public ? 'Public Team' : 'Private Team'}
                </Badge>
              </div>
            </div>
            <CardDescription className="pt-2">
              Request to join this team. The team admin will review your request.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {error && (
              <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm flex items-center gap-2">
                <AlertCircle className="size-4" />
                {error}
              </div>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="message">Message (optional)</Label>
              <Textarea
                id="message"
                placeholder="Introduce yourself or explain why you want to join..."
                value={joinMessage}
                onChange={(e) => setJoinMessage(e.target.value)}
                rows={3}
                className="resize-none"
              />
              <p className="text-xs text-muted-foreground">
                This message will be visible to the team admin
              </p>
            </div>

            <div className="flex gap-3 pt-2">
              <Button variant="outline" onClick={() => router.push('/teams')} className="flex-1">
                Cancel
              </Button>
              <Button 
                onClick={handleJoinRequest} 
                disabled={isSubmitting}
                className="flex-1"
              >
                <UserPlus className="mr-2 size-4" />
                {isSubmitting ? 'Sending...' : 'Request to Join'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  )
}

