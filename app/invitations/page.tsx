"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Mail, Check, X, Users, Calendar, ArrowRight, Info } from "lucide-react"
import { toast } from "sonner"

export default function InvitationsHub() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [invitations, setInvitations] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [processingId, setProcessingId] = useState<number | null>(null)

  useEffect(() => {
    const storedSession = localStorage.getItem('student_session')
    if (storedSession) {
      const userData = JSON.parse(storedSession)
      const normalizedUser = {
        ...userData,
        auth_user_id: userData.auth_user_id || userData.id
      }
      setUser(normalizedUser)
      fetchInvitations(normalizedUser.auth_user_id)
    } else {
      router.push('/signin')
    }
  }, [])

  const fetchInvitations = async (authUserId: string) => {
    try {
      setLoading(true)
      const res = await fetch(`/api/recruitment/invitations?auth_user_id=${authUserId}`)
      const result = await res.json()
      if (result.success) {
        setInvitations(result.data)
      }
    } catch (error) {
      console.error('Error fetching invitations:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleRespond = async (invitationId: number, action: 'accepted' | 'rejected') => {
    try {
      setProcessingId(invitationId)
      const res = await fetch('/api/recruitment/respond', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          invitation_id: invitationId,
          auth_user_id: user.auth_user_id,
          action
        })
      })

      const result = await res.json()
      if (result.success) {
        // Remove from list or update status
        setInvitations(prev => prev.filter(inv => inv.id !== invitationId))
        toast.success(action === 'accepted' ? "Welcome to the team!" : "Invitation declined.")
        if (action === 'accepted' && result.team_url) {
           router.push(`/teams/${result.team_url}`)
        }
      } else {
        toast.error(result.error || "Failed to respond to invitation")
      }
    } catch (error) {
      console.error('Error responding to invitation:', error)
      toast.error("An error occurred. Please try again.")
    } finally {
      setProcessingId(null)
    }
  }

  const pendingInvites = invitations.filter(inv => inv.status === 'pending')
  const pastInvites = invitations.filter(inv => inv.status !== 'pending')

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 py-12 bg-muted/200">
        <div className="container px-4 md:px-6 max-w-5xl">
          <div className="mb-10">
            <h1 className="text-4xl font-extrabold tracking-tight mb-3 rock-salt text-primary">Invitations Hub</h1>
            <p className="text-muted-foreground text-lg text-arabic">Team Joining Requests in one a Place</p>
          </div>

          {loading ? (
             <div className="flex flex-col items-center justify-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
              <p className="text-muted-foreground">Fetching your invitations...</p>
            </div>
          ) : pendingInvites.length === 0 ? (
            <Card className="bg-primary/5 border-primary/10 border-dashed py-12">
               <CardContent className="flex flex-col items-center text-center">
                  <div className="size-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                    <Mail className="size-8 text-primary/40" />
                  </div>
                  <h2 className="text-xl font-bold mb-2">No pending invitations</h2>
                  <p className="text-muted-foreground max-w-sm mb-6">
                    You don't have any team invitations right now. 
                    Make sure your "Available for Recruitment" toggle is ON in Settings!
                  </p>
                  <Button onClick={() => router.push('/talent')} variant="outline">
                    Browse Talent Marketplace
                  </Button>
               </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
               <h2 className="text-2xl font-bold flex items-center gap-2">
                 <Badge className="rounded-full px-2" variant="default">{pendingInvites.length}</Badge> New Invitations
               </h2>
               <div className="grid gap-4">
                 {pendingInvites.map((invite) => (
                    <Card key={invite.id} className="overflow-hidden border-primary/20 hover:shadow-md transition-shadow">
                      <div className="flex flex-col md:flex-row">
                         <div className="p-6 flex-1">
                            <div className="flex items-start gap-4">
                               <div className="size-14 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                                  <Users className="size-7 text-primary" />
                               </div>
                               <div className="flex-1 min-w-0">
                                  <h3 className="text-xl font-bold group-hover:text-primary transition-colors truncate">
                                    {invite.team?.team_name}
                                  </h3>
                                  <p className="text-sm text-muted-foreground mt-1 line-clamp-1">{invite.team?.description || "A dynamic team looking for your expertise."}</p>
                                  
                                  <div className="mt-4 flex flex-wrap gap-4 text-xs font-medium text-muted-foreground">
                                     <div className="flex items-center gap-1.5">
                                        <Calendar className="size-3.5" />
                                        Sent {new Date(invite.created_at).toLocaleDateString()}
                                     </div>
                                     <div className="flex items-center gap-1.5 border-l pl-4">
                                        <Avatar className="size-5">
                                          {invite.inviter?.profile_image && (
                                            <AvatarImage src={invite.inviter.profile_image} />
                                          )}
                                          <AvatarFallback className="text-[8px]">
                                            {invite.inviter?.first_name?.[0]}{invite.inviter?.last_name?.[0]}
                                          </AvatarFallback>
                                        </Avatar>
                                        <div className="flex flex-col">
                                          <span className="text-[10px] text-muted-foreground leading-none">Invited by</span>
                                          <span className="text-xs font-semibold">{invite.inviter?.first_name} {invite.inviter?.last_name}</span>
                                        </div>
                                     </div>
                                  </div>
                               </div>
                            </div>
                            
                            {invite.message && (
                               <div className="mt-6 p-4 bg-muted/40 rounded-lg border border-border/50 relative">
                                  <div className="absolute -top-3 left-4 bg-background px-2 text-[10px] font-bold text-primary uppercase tracking-widest">Personal Message</div>
                                  <p className="text-sm italic text-foreground/80 leading-relaxed">
                                    "{invite.message}"
                                  </p>
                               </div>
                            )}
                         </div>
                         
                         <div className="bg-muted/20 border-l p-6 md:w-64 flex flex-col justify-center gap-3">
                            <Button 
                              className="w-full bg-primary hover:bg-primary/90" 
                              onClick={() => handleRespond(invite.id, 'accepted')}
                              disabled={processingId === invite.id}
                            >
                              {processingId === invite.id ? "Joining..." : <> <Check className="mr-2 size-4" /> Accept & Join </>}
                            </Button>
                            <Button 
                              variant="outline" 
                              className="w-full text-destructive hover:bg-destructive/5" 
                              onClick={() => handleRespond(invite.id, 'rejected')}
                              disabled={processingId === invite.id}
                            >
                              <X className="mr-2 size-4" /> Decline
                            </Button>
                            <Button variant="ghost" size="sm" className="w-full text-xs" onClick={() => router.push(`/teams/browse`)}>
                               View Team Details <ArrowRight className="ml-1 size-3" />
                            </Button>
                         </div>
                      </div>
                    </Card>
                 ))}
               </div>
            </div>
          )}

          {pastInvites.length > 0 && (
             <div className="mt-16">
                <h3 className="text-xl font-bold mb-6 text-muted-foreground opacity-60">Invitation History</h3>
                <div className="grid gap-3 opacity-60 grayscale hover:grayscale-0 transition-all">
                   {pastInvites.map((invite) => (
                      <div key={invite.id} className="flex items-center justify-between p-4 bg-background border rounded-lg text-sm">
                         <div className="flex items-center gap-3">
                            <div className="size-8 rounded bg-muted flex items-center justify-center">
                               <Users className="size-4" />
                            </div>
                            <div>
                               <span className="font-bold">{invite.team?.team_name}</span>
                               <span className="mx-2 text-muted-foreground">•</span>
                               <span className="text-muted-foreground">Sent {new Date(invite.created_at).toLocaleDateString()}</span>
                            </div>
                         </div>
                         <Badge variant={invite.status === 'accepted' ? 'secondary' : 'outline'}>
                            {invite.status === 'accepted' ? 'Accepted' : 'Declined'}
                         </Badge>
                      </div>
                   ))}
                </div>
             </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  )
}


