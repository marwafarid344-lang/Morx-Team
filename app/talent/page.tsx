"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { PlanAvatar } from "@/components/ui/plan-avatar"
import { Search, Users, Star, MessageSquare, Briefcase, Filter, X, ExternalLink, Sparkles, Loader2 } from "lucide-react"
import { DEPARTMENT_NAMES } from "@/lib/constants/subjects"
import { toast } from "sonner"

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

export default function TalentMarketplace() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [talent, setTalent] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [myTeams, setMyTeams] = useState<any[]>([])
  
  // WhatsApp dialog state
  const [whatsappDialogOpen, setWhatsappDialogOpen] = useState(false)
  const [selectedMemberForWhatsapp, setSelectedMemberForWhatsapp] = useState<any>(null)
  const [whatsappMessage, setWhatsappMessage] = useState("")
  
  // Filters
  const [searchQuery, setSearchQuery] = useState("")
  const [departmentFilter, setDepartmentFilter] = useState("all")
  const [skillFilter, setSkillFilter] = useState("")
  const [subjectFilter, setSubjectFilter] = useState("")

  // Invitation state
  const [selectedUser, setSelectedUser] = useState<any>(null)
  const [selectedTeam, setSelectedTeam] = useState<string>("")
  const [inviteMessage, setInviteMessage] = useState("")
  const [isInviteOpen, setIsInviteOpen] = useState(false)
  const [sendingInvite, setSendingInvite] = useState(false)

  // Member details dialog state
  const [selectedMemberDetails, setSelectedMemberDetails] = useState<any>(null)
  const [isMemberDetailsOpen, setIsMemberDetailsOpen] = useState(false)

  // AI Match state
  const [aiMatchActive, setAiMatchActive] = useState(false)
  const [aiMatchLoading, setAiMatchLoading] = useState(false)
  const [aiMatchedIds, setAiMatchedIds] = useState<string[]>([])
  const [aiMatchedData, setAiMatchedData] = useState<any[]>([])
  const [aiMatchReason, setAiMatchReason] = useState<string>("")


  // AI Team Suggestion state (for current user)
  const [suggestedTeamsDialogOpen, setSuggestedTeamsDialogOpen] = useState(false)
  const [suggestedTeams, setSuggestedTeams] = useState<any[]>([])
  const [suggestedTeamsLoading, setSuggestedTeamsLoading] = useState(false)
  const [suggestedTeamsReason, setSuggestedTeamsReason] = useState<string>("")

  useEffect(() => {
    const storedSession = localStorage.getItem('student_session')
    if (storedSession) {
      const userData = JSON.parse(storedSession)
      const normalizedUser = {
        ...userData,
        auth_user_id: userData.auth_user_id || userData.id
      }
      setUser(normalizedUser)
      fetchMyTeams(normalizedUser.auth_user_id)
    }
    fetchTalent()
  }, [])

  const fetchTalent = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/recruitment/talent')
      const result = await res.json()
      if (result.success) {
        setTalent(result.data)
      }
    } catch (error) {
      console.error('Error fetching talent:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchMyTeams = async (authUserId: string) => {
    try {
      const res = await fetch('/api/teams')
      const result = await res.json()
      if (result.success) {
        // Only teams where I am owner or admin
        const manageableTeams = result.data.filter((t: any) => t.role === 'owner' || t.role === 'admin')
        setMyTeams(manageableTeams)
      }
    } catch (error) {
      console.error('Error fetching teams:', error)
    }
  }

  const handleSendInvite = async () => {
    if (!selectedTeam || !selectedUser || !user) return

    try {
      setSendingInvite(true)
      const res = await fetch('/api/recruitment/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          team_id: selectedTeam,
          target_auth_user_id: selectedUser.auth_user_id,
          inviter_id: user.auth_user_id,
          message: inviteMessage
        })
      })

      const result = await res.json()
      if (result.success) {
        toast.success("Invitation sent successfully!")
        setIsInviteOpen(false)
        setInviteMessage("")
        setSelectedTeam("")
      } else {
        toast.error(result.error || "Failed to send invitation")
      }
    } catch (error) {
      console.error('Error sending invite:', error)
      toast.error("An error occurred. Please try again.")
    } finally {
      setSendingInvite(false)
    }
  }

  const handleAiMatch = async () => {
    if (myTeams.length === 0) {
      toast.error("You need to be an owner or admin of at least one team to use AI Match")
      return
    }

    try {
      setAiMatchLoading(true)
      const teamId = myTeams[0].team_id
      const res = await fetch(`/api/teams/match?team_id=${teamId}`)
      const result = await res.json()
      
      if (result.success && result.data) {
        const matches = result.data
        setAiMatchedData(matches)
        setAiMatchedIds(matches.map((m: any) => m.candidate.auth_user_id))
        setAiMatchReason(`Matched candidates for team "${myTeams[0].team_name}" using skills, dynamic behavioral DNA, availability, and reliability history.`)
        setAiMatchActive(true)
        toast.success(`🎯 Found ${matches.length} matching candidates!`)
      } else {
        toast.error(result.error || "AI matching failed")
      }
    } catch (error) {
      console.error('AI Match error:', error)
      toast.error("An error occurred during AI matching")
    } finally {
      setAiMatchLoading(false)
    }
  }

  const clearAiMatch = () => {
    setAiMatchActive(false)
    setAiMatchedIds([])
    setAiMatchReason("")
  }

  const handleSuggestTeamsForMe = async () => {
    if (!user) {
      toast.error("Please log in to get team suggestions")
      return
    }

    try {
      setSuggestedTeamsLoading(true)
      setSuggestedTeamsDialogOpen(true)

      // Fetch all available teams
      const teamsRes = await fetch('/api/teams/browse')
      const teamsResult = await teamsRes.json()
      
      if (!teamsResult.success || !teamsResult.data || teamsResult.data.length === 0) {
        toast.error("No teams available to suggest")
        setSuggestedTeamsLoading(false)
        return
      }

      const availableTeams = teamsResult.data

      // Build prompt for AI
      const prompt = `You are a team matching AI. Analyze the candidate's profile and suggest the BEST matching teams.

CANDIDATE PROFILE:
Name: ${user.first_name} ${user.last_name}
Department: ${user.department || 'General'}
Study Level: ${user.study_level || 'Unknown'}
Skills: ${Array.isArray(user.skills) && user.skills.length > 0 ? user.skills.join(', ') : 'No skills listed'}
Looking for teams in subjects: ${Array.isArray(user.searching_teams_subjects) && user.searching_teams_subjects.length > 0 ? user.searching_teams_subjects.join(', ') : 'Open to any subject'}
Bio: ${user.bio || 'No bio provided'}

AVAILABLE TEAMS (${availableTeams.length} total):
${availableTeams.map((t: any) => `
Team ID: ${t.team_id}
Team Name: ${t.team_name}
Purpose: ${t.purpose || 'General collaboration'}
Subject: ${t.subject || 'Any field'}
Required Skills: ${Array.isArray(t.required_skills) && t.required_skills.length > 0 ? t.required_skills.join(', ') : 'No specific requirements'}
Tags: ${Array.isArray(t.tags) && t.tags.length > 0 ? t.tags.join(', ') : 'None'}
Member Count: ${t.member_count || 0}`).join('\n')}

MATCHING RULES:
1. PRIORITIZE teams whose subject matches candidate's "Looking for teams in" subjects
2. Match required skills with candidate's skills
3. Consider team purpose alignment with candidate's profile
4. Exclude teams where candidate is already a member
5. Select 3-8 teams with the BEST fit (quality over quantity)

Respond with ONLY a JSON object in this exact format (no markdown, no explanation):
{"team_ids": ["id1", "id2", ...], "reason": "Brief explanation of why these teams match"}

Select the BEST teams (3-8) that would be ideal for this candidate.`

      const response = await fetch('/api/ai/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          max_tokens: 800
        })
      })

      const result = await response.json()
      
      if (result.limitReached) {
        toast.error(result.error || "Daily AI limit reached. Try again tomorrow!")
        setSuggestedTeamsLoading(false)
        return
      }
      
      if (result.success && result.data) {
        try {
          const cleanedResponse = result.data.replace(/```json\n?|\n?```/g, '').trim()
          const parsed = JSON.parse(cleanedResponse)
          
          if (parsed.team_ids && Array.isArray(parsed.team_ids) && parsed.team_ids.length > 0) {
            // Get full team details
            const matchedTeams = availableTeams.filter((t: any) => parsed.team_ids.includes(t.team_id))
            
            if (matchedTeams.length > 0) {
              setSuggestedTeams(matchedTeams)
              setSuggestedTeamsReason(parsed.reason || "Matched based on your skills and interests")
              toast.success(`🎯 Found ${matchedTeams.length} teams that match your profile!`)
            } else {
              toast.error("No matching teams found")
            }
          } else {
            toast.error("AI couldn't find suitable teams. Try updating your profile with more skills or subjects.")
          }
        } catch (parseError) {
          console.error('Parse error:', parseError, result.data)
          toast.error("Failed to parse AI response. Please try again.")
        }
      } else {
        toast.error(result.error || "AI team suggestion failed")
      }
    } catch (error) {
      console.error('AI Team Suggestion error:', error)
      toast.error("An error occurred during team suggestion")
    } finally {
      setSuggestedTeamsLoading(false)
    }
  }

  const filteredTalent = talent.filter(item => {
    // If AI match is active, only show matched candidates
    if (aiMatchActive) {
      return aiMatchedIds.includes(item.auth_user_id) && item.auth_user_id !== user?.auth_user_id
    }

    const matchesSearch = searchQuery === "" || 
      `${item.first_name} ${item.last_name}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.bio && item.bio.toLowerCase().includes(searchQuery.toLowerCase()))
    
    const matchesDepartment = departmentFilter === "all" || item.department === departmentFilter
    
    const matchesSkill = skillFilter === "" || 
      (item.skills && item.skills.some((s: string) => s.toLowerCase().includes(skillFilter.toLowerCase())))
    
    const matchesSubject = subjectFilter === "" || 
      (item.searching_teams_subjects && item.searching_teams_subjects.some((s: string) => s.toLowerCase().includes(subjectFilter.toLowerCase())))

    return matchesSearch && matchesDepartment && matchesSkill && matchesSubject && item.auth_user_id !== user?.auth_user_id
  }).sort((a, b) => {
    // If AI match is active, sort by the order returned by AI
    if (aiMatchActive) {
      return aiMatchedIds.indexOf(a.auth_user_id) - aiMatchedIds.indexOf(b.auth_user_id)
    }
    return 0
  })

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 py-12 bg-background">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
            <div>
              <h1 className="text-4xl font-extrabold tracking-tight mb-3 rock-salt text-primary">Talent Marketplace</h1>
              <p className="text-muted-foreground text-lg text-arabic">Find talent and build your dream team</p>
            </div>
            <div className="flex items-center gap-3">
               <Badge variant="outline" className="px-4 py-1.5 text-sm bg-primary/10 text-primary border-primary/30 backdrop-blur-sm shadow-sm font-bold">
                {filteredTalent.length} {filteredTalent.length === 1 ? 'Member' : 'Members'} Available
               </Badge>
            </div>
          </div>

          {/* Filters Bar */}
          <Card className="mb-8 border-primary/10 shadow-sm bg-background">
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-3 size-4 text-muted-foreground" />
                  <Input 
                    placeholder="Search name or bio..." 
                    className="pl-9"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <div>
                  <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                    <SelectTrigger>
                      <Filter className="mr-2 size-4 text-muted-foreground" />
                      <SelectValue placeholder="Department" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Departments</SelectItem>
                      {Object.entries(DEPARTMENT_NAMES).map(([code, name]) => (
                        <SelectItem key={code} value={code}>{name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="relative">
                  <Briefcase className="absolute left-3 top-3 size-4 text-muted-foreground" />
                  <Input 
                    placeholder="Filter by skill..." 
                    className="pl-9"
                    value={skillFilter}
                    onChange={(e) => setSkillFilter(e.target.value)}
                  />
                </div>
                <div className="relative">
                  <Star className="absolute left-3 top-3 size-4 text-muted-foreground" />
                  <Input 
                    placeholder="Filter by subject..." 
                    className="pl-9"
                    value={subjectFilter}
                    onChange={(e) => setSubjectFilter(e.target.value)}
                  />
                </div>
                <div className="flex items-center gap-2">
                  {!aiMatchActive ? (
                    <Button 
                      variant="default" 
                      className="h-10 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white shadow-md"
                      onClick={handleAiMatch}
                      disabled={aiMatchLoading || myTeams.length === 0}
                    >
                      {aiMatchLoading ? (
                        <>
                          <Loader2 className="mr-2 size-4 animate-spin" /> Analyzing...
                        </>
                      ) : (
                        <>
                          <Sparkles className="mr-2 size-4" /> AI Match
                        </>
                      )}
                    </Button>
                  ) : (
                    <Button 
                      variant="outline" 
                      className="h-10 border-purple-500 text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-950 hover:text-white"
                      onClick={clearAiMatch}
                    >
                      <X className="mr-2 size-4" /> Clear AI Match
                    </Button>
                  )}
                  {(searchQuery || departmentFilter !== "all" || skillFilter || subjectFilter) && !aiMatchActive && (
                    <Button variant="ghost" className="h-10 text-muted-foreground" onClick={() => {
                        setSearchQuery("");
                        setDepartmentFilter("all");
                        setSkillFilter("");
                        setSubjectFilter("");
                    }}>
                      <X className="mr-2 size-4" /> Reset
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* AI Match Results Banner */}
          {aiMatchActive && (
            <Card className="mb-6 border-purple-500/30 bg-gradient-to-r from-purple-500/10 to-blue-500/10">
              <CardContent className="py-4">
                <div className="flex items-start gap-3">
                  <Sparkles className="size-5 text-purple-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-purple-700 dark:text-purple-400 mb-1">
                      AI Matched {aiMatchedIds.length} Candidates
                    </h3>
                    <p className="text-sm text-muted-foreground">{aiMatchReason}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
              <p className="text-muted-foreground">Discovering talented individuals...</p>
            </div>
          ) : filteredTalent.length === 0 ? (
            <div className="text-center py-20">
              <Users className="size-16 text-muted-foreground/30 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">No talent found</h3>
              <p className="text-muted-foreground">Try adjusting your filters to find more members.</p>
              <p className="text-muted-foreground">this maybe cause of there is no available talent in your faculty</p>
            </div>
          ) : (
            <div data-tutorial="talent-grid" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredTalent.map((member) => (
                <Card 
                  key={member.auth_user_id} 
                  className="group hover:shadow-xl transition-all duration-300 border-primary/5 hover:border-primary/20 overflow-hidden flex flex-col cursor-pointer"
                  onClick={() => {
                    setSelectedMemberDetails(member)
                    setIsMemberDetailsOpen(true)
                  }}
                >
                  <div className="h-1.5 bg-gradient-to-r from-primary/40 to-primary/10" />
                  <CardHeader className="pb-2 pt-3">
                    <div className="flex items-center gap-3">
                      <PlanAvatar
                        src={member.profile_image}
                        alt={member.first_name || ''}
                        plan={member.plan}
                        fallback={
                          <div className="flex h-full w-full items-center justify-center bg-primary/10 text-primary font-bold">
                            {member.first_name?.[0]}{member.last_name?.[0]}
                          </div>
                        }
                        size="md"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <CardTitle className="text-base font-bold group-hover:text-primary transition-colors">
                            {member.first_name} {member.last_name}
                          </CardTitle>
                          <Badge 
                            variant="outline" 
                            className={`text-[10px] font-bold uppercase px-1.5 py-0 ${
                              member.plan === 'enterprise' ? 'bg-red-500/10 text-red-500 border-red-500/30' :
                              member.plan === 'professional' ? 'bg-blue-500/10 text-blue-500 border-blue-500/30' :
                              member.plan === 'starter' ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/30' :
                              'bg-emerald-500/10 text-emerald-500 border-emerald-500/30'
                            }`}
                          >
                            {member.plan === 'enterprise' ? 'ENT' : 
                             member.plan === 'professional' ? 'PRO' : 
                             member.plan === 'starter' ? 'STR' : 'FREE'}
                          </Badge>
                        </div>
                        <CardDescription className="flex flex-col gap-0.5 mt-0.5 text-xs text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Star className="size-2.5 fill-primary/20" /> 
                            {(member.department && DEPARTMENT_NAMES[member.department])}
                          </div>
                          {member.governorate && member.faculty && (
                            <div className="flex items-center gap-1 text-[11px]">
                              {member.faculty} | {member.governorate}
                            </div>
                          )}
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="flex-1 py-2">
                    {aiMatchActive && (() => {
                      const matchInfo = aiMatchedData.find((m: any) => m.candidate.auth_user_id === member.auth_user_id)
                      if (!matchInfo) return null
                      return (
                        <div className="mb-3 space-y-1.5 p-2 rounded-lg border border-purple-500/20 bg-purple-500/5 text-xs animate-in fade-in duration-200">
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-purple-700 dark:text-purple-300">Compatibility:</span>
                            <Badge className="bg-purple-600 hover:bg-purple-700 text-white font-mono text-[10px] py-0 px-1">{matchInfo.compatibility_score}%</Badge>
                          </div>
                          {matchInfo.strengths && matchInfo.strengths.length > 0 && (
                            <div>
                              <span className="font-bold text-[9px] uppercase text-muted-foreground/80 block">Strength:</span>
                              <span className="text-muted-foreground text-[10px]">{matchInfo.strengths[0]}</span>
                            </div>
                          )}
                          {matchInfo.risks && matchInfo.risks.length > 0 && (
                            <div>
                              <span className="font-bold text-[9px] uppercase text-amber-500 block">Risk:</span>
                              <span className="text-muted-foreground text-[10px]">{matchInfo.risks[0]}</span>
                            </div>
                          )}
                        </div>
                      )
                    })()}
                    {/* Searching for Teams Subjects */}
                    <div className="space-y-1">
                      <p className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground/50">Looking for Teams In</p>
                      {member.searching_teams_subjects && Array.isArray(member.searching_teams_subjects) && member.searching_teams_subjects.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {member.searching_teams_subjects.slice(0, 3).map((subject: string, idx: number) => (
                            <Badge key={idx} variant="default" className="text-[10px] py-0 px-1.5 bg-primary/15 text-primary hover:bg-primary/25">
                              {subject}
                            </Badge>
                          ))}
                          {member.searching_teams_subjects.length > 3 && (
                            <Badge variant="outline" className="text-[10px] text-primary font-bold py-0 px-1.5">
                              +{member.searching_teams_subjects.length - 3}
                            </Badge>
                          )}
                        </div>
                      ) : (
                        <p className="text-[10px] text-muted-foreground/60 italic">
                          {[
                            "Too cool for subjects apparently 😎",
                            "Searching for... nothing? Interesting strategy 🤔",
                            "The mysterious type - no preferences listed 🕵️",
                            "Keeping it open-ended... or just lazy? 🤷",
                            "Probably waiting for subjects to find them 🎯",
                            "Team-less wanderer with no destination 🗺️",
                            "Not picky... or just hasn't decided yet? 🎲"
                          ][Math.floor(Math.random() * 7)]}
                        </p>
                      )}
                    </div>
                  </CardContent>
                  <CardFooter className="pt-0 pb-2">
                    <Button 
                      variant="ghost" 
                      size="sm"
                      className="w-full h-7 text-xs text-primary hover:text-primary hover:bg-primary/10"
                      onClick={(e) => {
                        e.stopPropagation()
                        setSelectedMemberDetails(member)
                        setIsMemberDetailsOpen(true)
                      }}
                    >
                      View Details
                      <ExternalLink className="ml-1.5 size-3" />
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </div>
        
        {/* Invitation Dialog */}
        <Dialog open={isInviteOpen} onOpenChange={setIsInviteOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Invite {selectedUser?.first_name} to your Team</DialogTitle>
              <DialogDescription>
                Choose one of your teams to send an invitation to this user.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Select Team</Label>
                <Select value={selectedTeam} onValueChange={setSelectedTeam}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a team..." />
                  </SelectTrigger>
                  <SelectContent>
                    {myTeams.map((team) => (
                      <SelectItem key={team.team_id} value={team.team_id.toString()}>
                        {team.team_name} ({team.role})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Invitation Message (Optional)</Label>
                <Textarea 
                  placeholder="Hi! We saw your profile and we'd love to have you on our team..."
                  value={inviteMessage}
                  onChange={(e) => setInviteMessage(e.target.value)}
                  className="min-h-[100px]"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsInviteOpen(false)}>Cancel</Button>
              <Button onClick={handleSendInvite} disabled={!selectedTeam || sendingInvite}>
                {sendingInvite ? "Sending..." : "Send Invitation"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        
        {/* WhatsApp Message Dialog */}
        <Dialog open={whatsappDialogOpen} onOpenChange={setWhatsappDialogOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <div className="p-2 rounded-full bg-[#25D366]/10">
                  <WhatsAppIcon />
                </div>
                Message {selectedMemberForWhatsapp?.first_name} on WhatsApp
              </DialogTitle>
              <DialogDescription>
                Compose your message before opening WhatsApp
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Your Message</Label>
                <Textarea 
                  placeholder="Write your message..."
                  value={whatsappMessage}
                  onChange={(e) => setWhatsappMessage(e.target.value)}
                  className="min-h-[120px]"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Clicking "Open WhatsApp" will open the WhatsApp app or web with your pre-filled message.
              </p>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setWhatsappDialogOpen(false)}>Cancel</Button>
              <Button 
                className="bg-[#25D366] hover:bg-[#128C7E] text-white"
                onClick={() => {
                  if (selectedMemberForWhatsapp?.links?.whatsapp) {
                    // Clean the phone number (remove spaces, dashes, etc.)
                    const phoneNumber = selectedMemberForWhatsapp.links.whatsapp.replace(/[\s-()]/g, '').replace(/^\+/, '')
                    const encodedMessage = encodeURIComponent(whatsappMessage)
                    window.open(`https://wa.me/${phoneNumber}?text=${encodedMessage}`, '_blank')
                    setWhatsappDialogOpen(false)
                  }
                }}
              >
                <WhatsAppIcon />
                <span className="ml-2">Open WhatsApp</span>
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Member Details Dialog */}
        <Dialog open={isMemberDetailsOpen} onOpenChange={setIsMemberDetailsOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-3">
                <PlanAvatar
                  src={selectedMemberDetails?.profile_image}
                  alt={selectedMemberDetails?.first_name || ''}
                  plan={selectedMemberDetails?.plan}
                  fallback={
                    <div className="flex h-full w-full items-center justify-center bg-primary/10 text-primary font-bold">
                      {selectedMemberDetails?.first_name?.[0]}{selectedMemberDetails?.last_name?.[0]}
                    </div>
                  }
                  size="lg"
                />
                <div>
                  <div className="text-xl font-bold">{selectedMemberDetails?.first_name} {selectedMemberDetails?.last_name}</div>
                  <div className="text-sm text-muted-foreground font-normal">
                    {(selectedMemberDetails?.department && DEPARTMENT_NAMES[selectedMemberDetails?.department]) || selectedMemberDetails?.department || "General"} • Level {selectedMemberDetails?.study_level || "?"}
                    <br></br>
                    {selectedMemberDetails?.governorate && selectedMemberDetails?.faculty && (
                      <> {selectedMemberDetails.faculty} | {selectedMemberDetails.governorate}</>
                    )}
                  </div>
                </div>
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-6 py-4">
              {/* Plan */}
              <div>
                <h3 className="text-sm font-semibold text-muted-foreground mb-2">Plan</h3>
                <Badge 
                  variant="outline" 
                  className={`text-sm font-bold uppercase tracking-wider px-3 py-1 ${
                    selectedMemberDetails?.plan === 'enterprise' ? 'bg-red-500/10 text-red-500 border-red-500/30' :
                    selectedMemberDetails?.plan === 'professional' ? 'bg-blue-500/10 text-blue-500 border-blue-500/30' :
                    selectedMemberDetails?.plan === 'starter' ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/30' :
                    'bg-emerald-500/10 text-emerald-500 border-emerald-500/30'
                  }`}
                >
                  {selectedMemberDetails?.plan === 'enterprise' ? 'Enterprise' : 
                   selectedMemberDetails?.plan === 'professional' ? 'Professional' : 
                   selectedMemberDetails?.plan === 'starter' ? 'Starter' : 'Free'}
                </Badge>
              </div>

              {/* Bio */}
              {selectedMemberDetails?.bio && (
                <div>
                  <h3 className="text-sm font-semibold text-muted-foreground mb-2">About</h3>
                  <p className="text-sm text-foreground leading-relaxed italic">"{selectedMemberDetails.bio}"</p>
                </div>
              )}

              {/* Skills */}
              {selectedMemberDetails?.skills && selectedMemberDetails.skills.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-muted-foreground mb-2">Skills</h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedMemberDetails.skills.map((skill: string, idx: number) => (
                      <Badge key={idx} variant="secondary" className="text-sm">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Searching Teams Subjects */}
              {selectedMemberDetails?.searching_teams_subjects && selectedMemberDetails.searching_teams_subjects.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-muted-foreground mb-2">Looking to Join Teams For</h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedMemberDetails.searching_teams_subjects.map((subject: string, idx: number) => (
                      <Badge key={idx} variant="outline" className="text-sm bg-primary/5 border-primary/30">
                        {subject}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Social Links */}
              {selectedMemberDetails?.links && (selectedMemberDetails.links.github || selectedMemberDetails.links.linkedin || selectedMemberDetails.links.facebook || selectedMemberDetails.links.whatsapp) && (
                <div>
                  <h3 className="text-sm font-semibold text-muted-foreground mb-2">Connect</h3>
                  <div className="flex items-center gap-3">
                    {selectedMemberDetails.links.github && (
                      <a
                        href={selectedMemberDetails.links.github}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-muted hover:bg-primary/10 hover:text-primary transition-all"
                      >
                        <GithubIcon />
                        <span className="text-sm font-medium">GitHub</span>
                      </a>
                    )}
                    {selectedMemberDetails.links.linkedin && (
                      <a
                        href={selectedMemberDetails.links.linkedin}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-muted hover:bg-[#0077B5]/10 hover:text-[#0077B5] transition-all"
                      >
                        <LinkedInIcon />
                        <span className="text-sm font-medium">LinkedIn</span>
                      </a>
                    )}
                    {selectedMemberDetails.links.facebook && (
                      <a
                        href={selectedMemberDetails.links.facebook}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-muted hover:bg-[#1877F2]/10 hover:text-[#1877F2] transition-all"
                      >
                        <FacebookIcon />
                        <span className="text-sm font-medium">Facebook</span>
                      </a>
                    )}
                    {selectedMemberDetails.links.whatsapp && (
                      <button
                        onClick={() => {
                          setSelectedMemberForWhatsapp(selectedMemberDetails)
                          setWhatsappMessage(`Hi ${selectedMemberDetails.first_name}! I found your profile on Morx and would like to connect with you.`)
                          setWhatsappDialogOpen(true)
                          setIsMemberDetailsOpen(false)
                        }}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-muted hover:bg-[#25D366]/10 hover:text-[#25D366] transition-all"
                      >
                        <WhatsAppIcon />
                        <span className="text-sm font-medium">WhatsApp</span>
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsMemberDetailsOpen(false)}>Close</Button>
              {myTeams.length > 0 && (
                <Button 
                  onClick={() => {
                    setSelectedUser(selectedMemberDetails)
                    setIsMemberDetailsOpen(false)
                    setIsInviteOpen(true)
                  }}
                  className="bg-gradient-to-br from-primary to-primary/80"
                >
                  Invite to Team
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Suggested Teams Dialog */}
        <Dialog open={suggestedTeamsDialogOpen} onOpenChange={setSuggestedTeamsDialogOpen}>
          <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Sparkles className="size-5 text-emerald-500" />
                AI Team Suggestions for You
              </DialogTitle>
              <DialogDescription>
                Based on your skills and interests, here are teams that might be perfect for you
              </DialogDescription>
            </DialogHeader>

            {suggestedTeamsLoading ? (
              <div className="py-12 text-center">
                <Loader2 className="size-12 animate-spin text-emerald-500 mx-auto mb-4" />
                <p className="text-sm text-muted-foreground">AI is analyzing teams for you...</p>
              </div>
            ) : suggestedTeams.length > 0 ? (
              <div className="space-y-4">
                {/* AI Reason Banner */}
                <Card className="border-emerald-500/30 bg-gradient-to-r from-emerald-500/10 to-teal-500/10">
                  <CardContent className="py-3">
                    <p className="text-sm text-muted-foreground">{suggestedTeamsReason}</p>
                  </CardContent>
                </Card>

                {/* Teams List */}
                <div className="space-y-3">
                  {suggestedTeams.map((team: any) => (
                    <Card key={team.team_id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 space-y-2">
                            <div>
                              <h3 className="font-semibold text-lg">{team.team_name}</h3>
                              {team.subject && (
                                <Badge variant="secondary" className="text-xs mt-1">
                                  {team.subject}
                                </Badge>
                              )}
                            </div>
                            
                            {team.purpose && (
                              <p className="text-sm text-muted-foreground">{team.purpose}</p>
                            )}
                            
                            {team.required_skills && Array.isArray(team.required_skills) && team.required_skills.length > 0 && (
                              <div className="flex flex-wrap gap-1">
                                <span className="text-xs text-muted-foreground">Required:</span>
                                {team.required_skills.map((skill: string, idx: number) => (
                                  <Badge key={idx} variant="outline" className="text-xs">
                                    {skill}
                                  </Badge>
                                ))}
                              </div>
                            )}

                            <div className="flex items-center gap-3 text-xs text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Users className="size-3" />
                                {team.member_count || 0} members
                              </span>
                            </div>
                          </div>

                          <Button
                            size="sm"
                            onClick={() => {
                              window.location.href = `/teams/${team.team_url}`
                            }}
                            className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600"
                          >
                            View Team
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            ) : (
              <div className="py-12 text-center">
                <Users className="size-16 text-muted-foreground/30 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Teams Found</h3>
                <p className="text-sm text-muted-foreground">
                  Try adding more skills or subjects to your profile to get better suggestions.
                </p>
              </div>
            )}

            <DialogFooter>
              <Button variant="outline" onClick={() => setSuggestedTeamsDialogOpen(false)}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </main>
      <Footer />
    </div>
  )
}

function Label({ children, className }: { children: React.ReactNode, className?: string }) {
  return <label className={`text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 ${className}`}>{children}</label>
}
