"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { PlanAvatar } from "@/components/ui/plan-avatar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { ArrowLeft, Trash2, Crown, Shield, User, Globe, Lock, Check, X, Copy, LogOut, Users, Settings2, GraduationCap, MoreVertical, BarChart3, Plus, ExternalLink } from "lucide-react"
import { FCDS_SUBJECTS, TEAM_PURPOSES } from "@/lib/constants/subjects"
import { AIDescriptionButton } from "@/components/ui/ai-description-button"

// Social Link Icons
const GithubIcon = () => (
  <svg className="size-4" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
  </svg>
)

const LinkedInIcon = () => (
  <svg className="size-4" viewBox="0 0 24 24" fill="currentColor">
    <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
  </svg>
)

const FacebookIcon = () => (
  <svg className="size-4" viewBox="0 0 24 24" fill="currentColor">
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385h-3.047v-3.47h3.047v-2.642c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953h-1.514c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385c5.736-.9 10.125-5.864 10.125-11.854z"/>
  </svg>
)

const WhatsAppIcon = () => (
  <svg className="size-4" viewBox="0 0 24 24" fill="currentColor">
    <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/>
  </svg>
)

import SignupRequired from "@/components/signup-required"
import { toast } from "sonner"

export default function TeamSettingsPage() {
  const router = useRouter()
  const params = useParams()
  const teamUrl = params.teamUrl as string

  const [user, setUser] = useState<any>(null)
  const [team, setTeam] = useState<any>(null)
  const [members, setMembers] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [joinRequests, setJoinRequests] = useState<any[]>([])
  const [pendingCount, setPendingCount] = useState(0)
  const [isUpdatingVisibility, setIsUpdatingVisibility] = useState(false)
  const [linkCopied, setLinkCopied] = useState(false)
  const [isLeaveDialogOpen, setIsLeaveDialogOpen] = useState(false)
  const [isUpdatingDescription, setIsUpdatingDescription] = useState(false)
  const [editDescription, setEditDescription] = useState("")
  
  // Join request user details dialog
  const [selectedRequestUser, setSelectedRequestUser] = useState<any>(null)
  const [isRequestUserDialogOpen, setIsRequestUserDialogOpen] = useState(false)
  
  // Specialized fields
  const [teamType, setTeamType] = useState<'basic' | 'determinated'>('basic')
  const [purpose, setPurpose] = useState("")
  const [subject, setSubject] = useState("")
  const [isUpdatingSpecialized, setIsUpdatingSpecialized] = useState(false)
  const [skills, setSkills] = useState<string[]>([])
  const [newSkill, setNewSkill] = useState("")
  const [isUpdatingSkills, setIsUpdatingSkills] = useState(false)

  // Load skills from team tags
  useEffect(() => {
    if (team?.required_skills && Array.isArray(team.required_skills)) {
      setSkills(team.required_skills)
    }
  }, [team])

  useEffect(() => {
    const storedSession = localStorage.getItem('student_session')
    if (storedSession) {
      const userData = JSON.parse(storedSession)
      // Normalize user object to ensure auth_user_id exists
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
      fetchTeam()
      fetchMembers()
      fetchJoinRequests()
    }
  }, [teamUrl, user])

  const fetchTeam = async () => {
    try {
      const res = await fetch(`/api/teams/${teamUrl}`)
      const result = await res.json()
      
      if (result.success) {
        setTeam(result.data)
        setEditDescription(result.data.description || "")
        setTeamType(result.data.team_type || 'basic')
        setPurpose(result.data.purpose || "")
        setSubject(result.data.subject || "")
      }
    } catch (error) {
      console.error('Error fetching team:', error)
    }
  }

  const fetchMembers = async () => {
    try {
      const res = await fetch(`/api/teams/${teamUrl}/members`)
      const result = await res.json()
      
      if (result.success) {
        const sortedMembers = (result.data || []).sort((a: any, b: any) => {
          const rolePriority: Record<string, number> = { owner: 1, admin: 2, member: 3 };
          return (rolePriority[a.role] || 4) - (rolePriority[b.role] || 4);
        });
        setMembers(sortedMembers)
      }
    } catch (error) {
      console.error('Error fetching members:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchJoinRequests = async () => {
    try {
      const res = await fetch(`/api/teams/${teamUrl}/requests`)
      const result = await res.json()
      
      if (result.success) {
        const requests = result.data || []
        setJoinRequests(requests)
        setPendingCount(requests.filter((r: any) => r.status === 'pending').length)
      }
    } catch (error) {
      console.error('Error fetching join requests:', error)
    }
  }

  const handleRemoveMember = async (userId: number, userName: string) => {
    if (!confirm(`Remove ${userName} from the team?`)) return
    
    try {
      const res = await fetch(`/api/teams/${teamUrl}/members?target_auth_user_id=${userId}`, {
        method: 'DELETE'
      })
      
      const result = await res.json()
      
      if (result.success) {
        fetchMembers()
      } else {
        toast.error(result.error || 'Failed to remove member')
      }
    } catch (error) {
      toast.error('An error occurred. Please try again.')
    }
  }

  const handleChangeRole = async (userId: number, newRole: string) => {
    try {
      const res = await fetch(`/api/teams/${teamUrl}/members`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          auth_user_id: userId, 
          new_role: newRole,
          requester_id: user?.auth_user_id 
        })
      })
      
      const result = await res.json()
      
      if (result.success) {
        fetchMembers()
      } else {
        toast.error(result.error || 'Failed to change role')
      }
    } catch (error) {
      toast.error('An error occurred. Please try again.')
    }
  }

  const handleToggleVisibility = async () => {
    if (!team) return
    setIsUpdatingVisibility(true)
    
    try {
      const res = await fetch(`/api/teams/${teamUrl}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          auth_user_id: user?.auth_user_id,
          is_public: !team.is_public
        })
      })
      
      const result = await res.json()
      
      if (result.success) {
        setTeam({ ...team, is_public: !team.is_public })
      } else {
        toast.error(result.error || 'Failed to update visibility')
      }
    } catch (error) {
      toast.error('An error occurred. Please try again.')
    } finally {
      setIsUpdatingVisibility(false)
    }
  }

  const handleUpdateDescription = async () => {
    if (!team) return
    setIsUpdatingDescription(true)
    
    try {
      const res = await fetch(`/api/teams/${teamUrl}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          auth_user_id: user?.auth_user_id,
          description: editDescription
        })
      })
      
      const result = await res.json()
      
      if (result.success) {
        setTeam({ ...team, description: editDescription })
        toast.success('Description updated successfully')
      } else {
        toast.error(result.error || 'Failed to update description')
      }
    } catch (error) {
      toast.error('An error occurred. Please try again.')
    } finally {
      setIsUpdatingDescription(false)
    }
  }

  const handleUpdateSpecialized = async () => {
    if (!team) return
    setIsUpdatingSpecialized(true)
    
    try {
      console.log('[Specialized] Updating with:', { teamType, purpose, subject });
      const res = await fetch(`/api/teams/${teamUrl}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          team_type: teamType,
          purpose: purpose || "",
          subject: subject || "",
          tags: subject ? [subject, purpose].filter(Boolean) : (purpose ? [purpose] : [])
        })
      })
      
      const result = await res.json()
      console.log('[Specialized] Response:', result);
      
      if (result.success) {
        setTeam({ ...team, team_type: teamType, purpose, subject })
        toast.success('Specialized settings updated successfully')
      } else {
        toast.error(result.error || 'Failed to update specialized settings')
      }
    } catch (error) {
      console.error('Error updating specialized settings:', error)
      toast.error('An error occurred. Please try again.')
    } finally {
      setIsUpdatingSpecialized(false)
    }
  }

  const handleUpdateSkills = async () => {
    if (!team) return
    setIsUpdatingSkills(true)

    try {
      const res = await fetch(`/api/teams/${teamUrl}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          auth_user_id: user?.auth_user_id,
          required_skills: skills
        })
      })

      const result = await res.json()

      if (result.success) {
        setTeam({ ...team, required_skills: skills })
        toast.success('Skills updated successfully')
      } else {
        toast.error(result.error || 'Failed to update skills')
      }
    } catch (error) {
       toast.error('An error occurred. Please try again.')
    } finally {
      setIsUpdatingSkills(false)
    }
  }

  const handleAddSkill = () => {
    if (newSkill.trim() && !skills.includes(newSkill.trim())) {
      setSkills([...skills, newSkill.trim()])
      setNewSkill("")
    }
  }

  const handleRemoveSkill = (skillToRemove: string) => {
    setSkills(skills.filter(skill => skill !== skillToRemove))
  }

  const handleRequestAction = async (requestId: number, action: 'approve' | 'decline') => {
    try {
      const res = await fetch(`/api/teams/${teamUrl}/requests`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          auth_user_id: user?.auth_user_id,
          request_id: requestId,
          action
        })
      })
      
      const result = await res.json()
      
      if (result.success) {
        fetchJoinRequests()
        if (action === 'approve') {
          fetchMembers()
        }
      } else {
        toast.error(result.error || `Failed to ${action} request`)
      }
    } catch (error) {
      toast.error('An error occurred. Please try again.')
    }
  }

  const handleLeaveTeam = async () => {
    try {
      if (!user?.auth_user_id) return
      const res = await fetch(`/api/teams/${teamUrl}/members?target_auth_user_id=${user.auth_user_id}`, {
        method: 'DELETE'
      })
      
      const result = await res.json()
      
      if (result.success) {
        toast.success('You have left the team')
        router.push('/teams')
      } else {
        toast.error(result.error || 'Failed to leave team')
      }
    } catch (error) {
      toast.error('An error occurred. Please try again.')
    }
    setIsLeaveDialogOpen(false)
  }

  const copyInviteLink = async () => {
    const link = `${window.location.origin}/teams/join/${teamUrl}`
    await navigator.clipboard.writeText(link)
    setLinkCopied(true)
    setTimeout(() => setLinkCopied(false), 2000)
  }

  const getRoleIcon = (role: string) => {
    if (role === 'owner') return <Crown className="size-4 text-yellow-500" />
    if (role === 'admin') return <Shield className="size-4 text-blue-500" />
    return <User className="size-4 text-gray-500" />
  }

  const getRoleBadgeColor = (role: string) => {
    if (role === 'owner') return "bg-yellow-100 text-yellow-800"
    if (role === 'admin') return "bg-blue-100 text-blue-800"
    return "bg-gray-100 text-gray-800"
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
    return <SignupRequired />
  }

  const isOwnerOrAdmin = team?.role === 'owner' || team?.role === 'admin';
  const isOwner = team?.role === 'owner';
  const pendingRequests = joinRequests.filter(r => r.status === 'pending');
  const currentUserMember = members.find(m => m.auth_user_id === user?.auth_user_id);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      <main className="flex-1 py-8 bg-background">
        <div className="container px-4 md:px-6 max-w-4xl">
          {/* Header */}
          <div className="mb-8">
            <Button
              variant="ghost"
              className="mb-4"
              onClick={() => router.push(`/teams/${teamUrl}`)}
            >
              <ArrowLeft className="mr-2 size-4" />
              Back to Team
            </Button>
            
            <h1 className="text-3xl font-bold tracking-tight mb-2">Team Settings</h1>
            <p className="text-muted-foreground">
              Manage {team?.team_name}
            </p>
          </div>

          <div className="space-y-6 bg-background" >
            {/* Team Details Card - Admin/Owner Only */}
            {isOwnerOrAdmin && (
              <Card>
                <CardHeader>
                  <CardTitle>Team Details</CardTitle>
                  <CardDescription>
                    Update your team's name and description
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="teamName">Team Name</Label>
                      <div className="flex flex-col sm:flex-row gap-2">
                        <Input 
                          id="teamName"
                          value={team?.team_name || ""}
                          onChange={(e) => setTeam({ ...team, team_name: e.target.value })}
                          placeholder="Team Name"
                          className="flex-1"
                        />
                        <Button 
                          className="sm:w-32"
                          onClick={() => {
                            if (!team?.team_name.trim()) return;
                            toast.info('Updating team name...');
                            fetch(`/api/teams/${teamUrl}`, {
                              method: 'PUT',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({
                                auth_user_id: user?.auth_user_id,
                                team_name: team.team_name
                              })
                            }).then(res => res.json()).then(res => {
                              if (res.success) {
                                toast.success('Team name updated');
                              } else {
                                toast.error(res.error || 'Failed to update team name');
                              }
                            }).catch(err => {
                              toast.error('Network error. Please try again.');
                            });
                          }}
                        >
                          Save
                        </Button>
                      </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="description">Team Description</Label>
                      <AIDescriptionButton
                        context={{
                          type: 'team',
                          name: team?.team_name || '',
                          userName: user?.first_name || '',
                          purpose: purpose || undefined,
                          subject: subject || undefined
                        }}
                        onGenerated={(desc) => setEditDescription(desc)}
                        disabled={!team?.team_name}
                      />
                    </div>
                    <Textarea
                      id="description"
                      placeholder="Describe your team..."
                      value={editDescription}
                      onChange={(e) => setEditDescription(e.target.value)}
                      className="h-32 resize-none"
                    />
                    <div className="flex justify-end">
                      <Button 
                        onClick={handleUpdateDescription}
                        disabled={isUpdatingDescription}
                      >
                        Update Description
                      </Button>
                    </div>
                  </div>

                </CardContent>
              </Card>
            )}

            {/* Specialized Settings Card - Owner Only */}
            {isOwner && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <GraduationCap className="size-5 text-purple-500" />
                    Specialized Settings
                  </CardTitle>
                  <CardDescription>
                    Define your team's type and purpose (Owner only)
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Team Type</Label>
                        <Select value={teamType} onValueChange={(val: any) => setTeamType(val)}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="basic">Basic Team</SelectItem>
                            <SelectItem value="determinated">Determinated Team</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {teamType === 'determinated' && (
                        <div className="space-y-2">
                          <Label>Purpose</Label>
                          <Select value={purpose} onValueChange={setPurpose}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select purpose" />
                            </SelectTrigger>
                            <SelectContent>
                              {TEAM_PURPOSES.map(p => {
                                const Icon = p.icon;
                                return (
                                  <SelectItem key={p.id} value={p.id}>
                                    <div className="flex items-center gap-2">
                                      <Icon className="size-4" />
                                      {p.label}
                                    </div>
                                  </SelectItem>
                                );
                              })}
                            </SelectContent>
                          </Select>
                        </div>
                      )}

                      {teamType === 'determinated' && purpose === 'fcds' && (
                        <div className="space-y-2 md:col-span-2">
                          <Label className="flex items-center gap-2">
                            <GraduationCap className="size-4" />
                            Academic Subject
                          </Label>
                          <Select value={subject} onValueChange={setSubject}>
                            <SelectTrigger>
                              <SelectValue placeholder="Choose a subject..." />
                            </SelectTrigger>
                            <SelectContent>
                              {(() => {
                                const level = user?.study_level ? Number(user.study_level) : null;
                                let dept = user?.department;

                                // Handle 'AI' as an alias for 'IS' (Intelligent Systems)
                                if (dept === 'AI') dept = 'IS';

                                // Collect all available subjects
                                const relevantSubjects: string[] = [];

                                // Add current subject first if it exists (so it always shows)
                                if (subject && subject !== "Other") {
                                  relevantSubjects.push(subject);
                                }

                                if (level && FCDS_SUBJECTS[level]) {
                                  const subjectsByDept = FCDS_SUBJECTS[level];

                                  if (subjectsByDept["General"]) {
                                    subjectsByDept["General"].forEach(s => {
                                      if (!relevantSubjects.includes(s)) relevantSubjects.push(s);
                                    });
                                  }

                                  if (dept && dept !== "General" && subjectsByDept[dept]) {
                                    subjectsByDept[dept].forEach(s => {
                                      if (!relevantSubjects.includes(s)) relevantSubjects.push(s);
                                    });
                                  }
                                }

                                // Always add "Other" option
                                if (!relevantSubjects.includes("Other")) {
                                  relevantSubjects.push("Other");
                                }

                                return relevantSubjects.map((s) => (
                                  <SelectItem key={s} value={s}>{s}</SelectItem>
                                ));
                              })()}
                            </SelectContent>
                          </Select>
                          <p className="text-[10px] text-muted-foreground mt-1">
                            Available subjects based on your Level {user?.study_level || '?'} {user?.department || ''}
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="flex justify-end pt-2">
                      <Button 
                        variant="secondary"
                        onClick={handleUpdateSpecialized}
                        disabled={isUpdatingSpecialized}
                      >
                        Save Specialized Settings
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Required Skills Card - Admin/Owner Only */}
            {isOwnerOrAdmin && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="size-5 text-indigo-500" />
                    Required Skills
                  </CardTitle>
                  <CardDescription>
                    Add skills that are required or relevant for this team (e.g., React, Python, Design)
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex gap-2">
                      <Input 
                        placeholder="Enter a skill..." 
                        value={newSkill}
                        onChange={(e) => setNewSkill(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddSkill();
                          }
                        }}
                      />
                      <Button onClick={handleAddSkill} variant="outline" size="icon">
                        <Plus className="size-4" />
                      </Button>
                    </div>

                    <div className="flex flex-wrap gap-2 min-h-[40px] p-4 bg-muted/30 rounded-lg border border-dashed">
                      {skills.length === 0 && (
                        <p className="text-sm text-muted-foreground italic w-full text-center">No skills added yet</p>
                      )}
                      {skills.map((skill, index) => (
                        <Badge key={index} variant="secondary" className="pl-3 pr-1 py-1 flex items-center gap-1">
                          {skill}
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="size-4 hover:bg-destructive/10 hover:text-destructive rounded-full"
                            onClick={() => handleRemoveSkill(skill)}
                          >
                            <X className="size-3" />
                          </Button>
                        </Badge>
                      ))}
                    </div>

                    <div className="flex justify-end pt-2">
                      <Button 
                        variant="secondary"
                        onClick={handleUpdateSkills}
                        disabled={isUpdatingSkills}
                      >
                        Save Skills
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Team Visibility Card - Admin/Owner Only */}
            {isOwnerOrAdmin && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    {team?.is_public ? <Globe className="size-5 text-green-500" /> : <Lock className="size-5 text-orange-500" />}
                    Team Visibility
                  </CardTitle>
                  <CardDescription>
                    {team?.is_public 
                      ? "This team is public. Anyone can find and request to join."
                      : "This team is private. Only people with invite link can request to join."}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="visibility">Public Team</Label>
                      <p className="text-sm text-muted-foreground">
                        Allow anyone to discover and request to join this team
                      </p>
                    </div>
                    <Switch
                      id="visibility"
                      checked={team?.is_public || false}
                      onCheckedChange={handleToggleVisibility}
                      disabled={isUpdatingVisibility}
                    />
                  </div>
                  
                  {/* Invite Link */}
                  <div className="pt-4 border-t">
                    <Label className="mb-2 block">Invite Link</Label>
                    <div className="flex gap-2">
                      <Input 
                        readOnly 
                        value={`${typeof window !== 'undefined' ? window.location.origin : ''}/teams/join/${teamUrl}`}
                        className="font-mono text-sm"
                      />
                      <Button variant="outline" size="icon" onClick={copyInviteLink}>
                        {linkCopied ? <Check className="size-4 text-green-500" /> : <Copy className="size-4" />}
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      Share this link to invite people to request joining your team
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Pending Join Requests Card - Admin/Owner Only */}
            {isOwnerOrAdmin && pendingCount > 0 && (
              <Card className="border-primary ring-2 ring-primary/20">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      Pending Join Requests
                      <Badge className="bg-primary text-primary-foreground animate-pulse">
                        {pendingCount}
                      </Badge>
                    </CardTitle>
                  </div>
                  <CardDescription>
                    Review and manage requests from users who want to join this team
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {pendingRequests.map((request) => (
                      <div key={request.request_id} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 bg-muted/50 rounded-lg gap-4">
                        <div className="flex items-center gap-3 min-w-0">
                          <Avatar 
                            className="size-10 shrink-0 cursor-pointer ring-2 ring-transparent hover:ring-primary/50 transition-all"
                            onClick={() => {
                              setSelectedRequestUser(request.user)
                              setIsRequestUserDialogOpen(true)
                            }}
                          >
                            {request.user?.profile_image && (
                              <AvatarImage src={request.user.profile_image} alt={request.user.first_name || 'User'} />
                            )}
                            <AvatarFallback>
                              {request.user?.first_name?.[0]}{request.user?.last_name?.[0] || '?'}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="font-medium truncate">
                                {request.user?.first_name} {request.user?.last_name || ''}
                              </p>
                              {request.faculty_matches === false && (
                                <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-amber-500/10 text-amber-700 dark:text-amber-500 border-amber-500/30 shrink-0">
                                  ⚠️ Different Faculty
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground truncate">{request.user?.email}</p>
                            {request.user?.faculty && (
                              <p className="text-xs text-muted-foreground mt-0.5 truncate">
                                <GraduationCap className="size-3 inline mr-1" />
                                {request.user.faculty}
                              </p>
                            )}
                            {request.message && (
                              <p className="text-sm text-muted-foreground italic mt-1 line-clamp-2">"{request.message}"</p>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-2 sm:shrink-0 justify-end">
                          <Button 
                            size="sm" 
                            variant="outline"
                            className="text-red-600 hover:text-red-700 hover:bg-red-50 flex-1 sm:flex-none"
                            onClick={() => handleRequestAction(request.request_id, 'decline')}
                          >
                            <X className="size-4 mr-1" />
                            Decline
                          </Button>
                          <Button 
                            size="sm"
                            className="flex-1 sm:flex-none"
                            onClick={() => handleRequestAction(request.request_id, 'approve')}
                          >
                            <Check className="size-4 mr-1" />
                            Approve
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Team Members Card */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="size-5" />
                      Team Members
                    </CardTitle>
                    <CardDescription>{members.length} members</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {members.map((member) => (
                    <div key={member.auth_user_id} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 bg-muted/50 rounded-lg gap-3">
                      <div className="flex items-center gap-4 min-w-0 flex-1">
                        <PlanAvatar 
                          src={member.profile_image} 
                          fallback={`${member.first_name?.[0] || ''}${member.last_name?.[0] || ''}`}
                          plan={member.plan || 'free'}
                          className="size-10 shrink-0"
                        />
                        <div className="min-w-0 flex-1">
                          <div className="font-medium inline-flex items-center gap-1.5 truncate">
                            {member.first_name} {member.last_name}
                            <Badge 
                              variant="outline" 
                              className={`text-[10px] px-1.5 py-0 capitalize shrink-0 ${
                                member.plan === 'enterprise' ? 'border-red-500 text-red-600' :
                                member.plan === 'professional' ? 'border-blue-500 text-blue-600' :
                                member.plan === 'starter' ? 'border-yellow-500 text-yellow-600' :
                                'border-emerald-500 text-emerald-600'
                              }`}
                            >
                              {member.plan || 'free'}
                            </Badge>
                            {member.auth_user_id === user?.auth_user_id && (
                              <Badge variant="outline" className="text-xs shrink-0">You</Badge>
                            )}
                          </div>
                          <div className="text-sm text-muted-foreground truncate">
                            {member.email}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
                        <Badge className={`${getRoleBadgeColor(member.role)} shrink-0`}>
                          <span className="flex items-center gap-1">
                            {getRoleIcon(member.role)}
                            {member.role}
                          </span>
                        </Badge>

                        {/* Actions Dropdown - Only for non-owners and not self */}
                        {isOwnerOrAdmin && member.role !== 'owner' && member.auth_user_id !== user?.auth_user_id && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreVertical className="size-4" />
                                <span className="sr-only">Open menu</span>
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuItem
                                onClick={() => navigator.clipboard.writeText(member.email)}
                              >
                                <Copy className="mr-2 size-4" />
                                Copy Email
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              
                              {/* Role Management - Owner Only */}
                              {isOwner && (
                                <>
                                  <DropdownMenuItem
                                    onClick={() => handleChangeRole(member.auth_user_id, member.role === 'admin' ? 'member' : 'admin')}
                                  >
                                    {member.role === 'admin' ? (
                                      <>
                                        <User className="mr-2 size-4" />
                                        Demote to Member
                                      </>
                                    ) : (
                                      <>
                                        <Shield className="mr-2 size-4" />
                                        Promote to Admin
                                      </>
                                    )}
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                </>
                              )}

                              <DropdownMenuItem
                                className="text-red-600 focus:text-red-600"
                                onClick={() => handleRemoveMember(member.auth_user_id, `${member.first_name}${member.last_name ? ' ' + member.last_name : ''}`)}
                              >
                                <Trash2 className="mr-2 size-4" />
                                Remove Member
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Danger Zone - Leave Team */}
            {currentUserMember && currentUserMember.role !== 'owner' && (
              <Card className="border-red-200">
                <CardHeader>
                  <CardTitle className="text-red-600">Danger Zone</CardTitle>
                  <CardDescription>
                    Actions here cannot be undone
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex-1">
                      <p className="font-medium">Leave Team</p>
                      <p className="text-sm text-muted-foreground">
                        You will lose access to all projects and tasks in this team
                      </p>
                    </div>
                    <Button 
                      variant="destructive" 
                      onClick={() => setIsLeaveDialogOpen(true)}
                      className="w-full sm:w-auto"
                    >
                      <LogOut className="mr-2 size-4" />
                      Leave Team
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>
      <Footer />

      {/* Leave Team Confirmation Dialog */}
      <Dialog open={isLeaveDialogOpen} onOpenChange={setIsLeaveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Leave Team?</DialogTitle>
            <DialogDescription>
              Are you sure you want to leave <strong>{team?.team_name}</strong>? You will lose access to all projects and tasks. You'll need to request to join again if you change your mind.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsLeaveDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleLeaveTeam}>
              Leave Team
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Join Request User Details Dialog */}
      <Dialog open={isRequestUserDialogOpen} onOpenChange={setIsRequestUserDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <Avatar className="size-12">
                {selectedRequestUser?.profile_image && (
                  <AvatarImage src={selectedRequestUser.profile_image} alt={selectedRequestUser.first_name || 'User'} />
                )}
                <AvatarFallback>
                  {selectedRequestUser?.first_name?.[0]}{selectedRequestUser?.last_name?.[0] || '?'}
                </AvatarFallback>
              </Avatar>
              <div>
                <div className="font-semibold text-lg">
                  {selectedRequestUser?.first_name} {selectedRequestUser?.last_name}
                </div>
                <div className="text-sm text-muted-foreground font-normal">
                  {selectedRequestUser?.email}
                </div>
              </div>
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {selectedRequestUser?.faculty && (
              <div>
                <h4 className="text-sm font-semibold text-muted-foreground mb-2 flex items-center gap-2">
                  <GraduationCap className="size-4" />
                  Faculty
                </h4>
                <p className="text-sm">{selectedRequestUser.faculty}</p>
              </div>
            )}

            {selectedRequestUser?.links && (selectedRequestUser.links.github || selectedRequestUser.links.linkedin || selectedRequestUser.links.facebook || selectedRequestUser.links.whatsapp) && (
              <div>
                <h4 className="text-sm font-semibold text-muted-foreground mb-3">Social Links</h4>
                <div className="grid grid-cols-2 gap-3">
                  {selectedRequestUser.links.github && (
                    <a
                      href={selectedRequestUser.links.github}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-muted hover:bg-primary/10 hover:text-primary transition-all"
                    >
                      <GithubIcon />
                      <span className="text-sm font-medium">GitHub</span>
                    </a>
                  )}
                  {selectedRequestUser.links.linkedin && (
                    <a
                      href={selectedRequestUser.links.linkedin}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-muted hover:bg-[#0077B5]/10 hover:text-[#0077B5] transition-all"
                    >
                      <LinkedInIcon />
                      <span className="text-sm font-medium">LinkedIn</span>
                    </a>
                  )}
                  {selectedRequestUser.links.facebook && (
                    <a
                      href={selectedRequestUser.links.facebook}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-muted hover:bg-[#1877F2]/10 hover:text-[#1877F2] transition-all"
                    >
                      <FacebookIcon />
                      <span className="text-sm font-medium">Facebook</span>
                    </a>
                  )}
                  {selectedRequestUser.links.whatsapp && (
                    <a
                      href={`https://wa.me/${selectedRequestUser.links.whatsapp.replace(/[^0-9]/g, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-muted hover:bg-[#25D366]/10 hover:text-[#25D366] transition-all"
                    >
                      <WhatsAppIcon />
                      <span className="text-sm font-medium">WhatsApp</span>
                    </a>
                  )}
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRequestUserDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
