"use client"

import { useState, useEffect } from "react"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { useRouter } from "next/navigation"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Search, Users, Globe, ArrowRight, UserPlus, Gamepad2, Briefcase, Code, GraduationCap, X, Filter } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { TEAM_PURPOSES } from "@/lib/constants/subjects"

export default function BrowseTeamsPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [publicTeams, setPublicTeams] = useState<any[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedPurpose, setSelectedPurpose] = useState<string>("all")
  const [selectedTag, setSelectedTag] = useState<string>("all")
  const [availableTags, setAvailableTags] = useState<string[]>([])

  useEffect(() => {
    const storedSession = localStorage.getItem('student_session')
    if (storedSession) {
      setUser(JSON.parse(storedSession))
    }
    fetchPublicTeams()
  }, [])

  const fetchPublicTeams = async () => {
    try {
      const res = await fetch('/api/teams?public=true')
      const result = await res.json()
      
      if (result.success) {
        setPublicTeams(result.data || [])
        // Extract unique tags
        const tags = new Set<string>()
        result.data?.forEach((team: any) => {
          team.tags?.forEach((tag: string) => tags.add(tag))
          if (team.subject) tags.add(team.subject)
        })
        setAvailableTags(Array.from(tags).sort())
      }
    } catch (error) {
      console.error('Error fetching public teams:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const getPriorityScore = (team: any) => {
    if (!user) return 0;
    let score = 0;
    if (team.purpose === 'fcds') {
      if (team.subject && user.department && team.subject.includes(user.department)) score += 10;
      if (team.tags && team.tags.includes(user.department)) score += 5;
    }
    return score;
  };

  const filteredTeams = publicTeams
    .filter(team => {
      // Search matching
      const query = searchQuery.toLowerCase()
      const matchesSearch = 
        team.team_name?.toLowerCase().includes(query) ||
        team.description?.toLowerCase().includes(query) ||
        team.tags?.some((t: string) => t.toLowerCase().includes(query)) ||
        team.subject?.toLowerCase().includes(query)

      // Purpose matching
      const matchesPurpose = selectedPurpose === "all" || team.purpose === selectedPurpose

      // Tag matching
      const matchesTag = selectedTag === "all" || 
        team.tags?.includes(selectedTag) || 
        team.subject === selectedTag

      return matchesSearch && matchesPurpose && matchesTag
    })
    .sort((a, b) => getPriorityScore(b) - getPriorityScore(a));

  const clearFilters = () => {
    setSearchQuery("")
    setSelectedPurpose("all")
    setSelectedTag("all")
  }

  const getPurposeIcon = (purpose: string) => {
    switch (purpose) {
      case 'gaming': return <Gamepad2 className="size-5 text-purple-500" />;
      case 'business': return <Briefcase className="size-5 text-blue-500" />;
      case 'development': return <Code className="size-5 text-orange-500" />;
      case 'fcds': return <GraduationCap className="size-5 text-green-500" />;
      default: return <Globe className="size-5 text-muted-foreground" />;
    }
  };

  const getPurposeColor = (purpose: string) => {
    switch (purpose) {
      case 'gaming': return 'bg-purple-500/10 border-purple-500/20';
      case 'business': return 'bg-blue-500/10 border-blue-500/20';
      case 'development': return 'bg-orange-500/10 border-orange-500/20';
      case 'fcds': return 'bg-green-500/10 border-green-500/20';
      default: return 'bg-muted border-border';
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading public teams...</p>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 py-6 sm:py-8 md:py-12 bg-muted/200">
        <div className="container px-4 sm:px-6 lg:px-8">
          <div className="mb-6 sm:mb-8">
            <div className="flex items-center gap-3 mb-2">
              <Globe className="size-8 text-primary" />
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight">Browse Public Teams</h1>
            </div>
            <p className="text-sm sm:text-base text-muted-foreground">
              Discover and join public teams to collaborate with others
            </p>
          </div>

          <div className="flex flex-col gap-4 mb-8">
            <div className="flex flex-col md:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input
                  placeholder="Search teams, tags, or subjects..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 h-10"
                />
              </div>
              
              <div className="flex flex-wrap gap-2">
                <Select value={selectedPurpose} onValueChange={setSelectedPurpose}>
                  <SelectTrigger className="w-full sm:w-[160px] h-10">
                    <div className="flex items-center gap-2 truncate">
                      <Filter className="size-3.5 opacity-50 shrink-0" />
                      <SelectValue placeholder="Purpose" className="truncate" />
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Purposes</SelectItem>
                    {TEAM_PURPOSES.map(p => (
                      <SelectItem key={p.id} value={p.id}>{p.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={selectedTag} onValueChange={setSelectedTag}>
                  <SelectTrigger className="w-full sm:w-[220px] h-10 text-left">
                    <div className="flex items-center gap-2 truncate">
                      <Users className="size-3.5 opacity-50 shrink-0" />
                      <SelectValue placeholder="Tag/Subject" className="truncate" />
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Tags</SelectItem>
                    {availableTags.map(tag => (
                      <SelectItem key={tag} value={tag}>{tag}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {(searchQuery || selectedPurpose !== "all" || selectedTag !== "all") && (
                  <Button variant="ghost" size="sm" onClick={clearFilters} className="h-10 px-3">
                    <X className="mr-2 size-4" />
                    Clear
                  </Button>
                )}

                <Button variant="outline" onClick={() => router.push('/teams')} className="h-10 ml-auto">
                  My Teams
                </Button>
              </div>
            </div>
          </div>

          {filteredTeams.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 sm:py-16 md:py-24 px-4">
              <div className="size-16 sm:size-20 rounded-full bg-muted flex items-center justify-center mb-4 sm:mb-6">
                <Globe className="size-8 sm:size-10 text-muted-foreground" />
              </div>
              <h2 className="text-xl sm:text-2xl font-semibold mb-2 text-center">
                {searchQuery ? "No teams found" : "No public teams yet"}
              </h2>
              <p className="text-sm sm:text-base text-muted-foreground text-center mb-6 sm:mb-8 max-w-md px-4">
                {searchQuery 
                  ? "Try a different search term"
                  : "Be the first to create a public team!"}
              </p>
              <Button onClick={() => router.push('/teams')}>
                Go to My Teams
              </Button>
            </div>
          ) : (
            <div data-tutorial="browse-teams" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5 lg:gap-6">
              {filteredTeams.map((team) => (
                <Card 
                  key={team.team_id} 
                  className="hover:shadow-lg transition-all cursor-pointer hover:border-primary/50"
                  onClick={() => router.push(`/teams/join/${team.team_url}`)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start gap-3">
                      <div className={`size-11 rounded-lg flex items-center justify-center flex-shrink-0 border ${getPurposeColor(team.purpose)}`}>
                        {getPurposeIcon(team.purpose)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <CardTitle className="text-base sm:text-lg truncate">{team.team_name}</CardTitle>
                          {team.team_type === 'determinated' && (
                            <Badge variant="outline" className="text-[10px] h-4 px-1 uppercase tracking-wider font-bold border-primary/30 text-primary bg-primary/5">
                              specialized
                            </Badge>
                          )}
                        </div>
                        <CardDescription className="text-xs flex items-center gap-1.5 mt-1">
                          <Avatar className="size-4">
                            {team.creator_image && (
                              <AvatarImage src={team.creator_image} />
                            )}
                            <AvatarFallback className="text-[6px]">
                              {team.creator_name?.substring(0, 1)}
                            </AvatarFallback>
                          </Avatar>
                          <span className="truncate">Created by {team.creator_name}</span>
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="flex flex-wrap gap-1 mb-3">
                      {team.purpose && (
                        <Badge variant="outline" className="text-[10px] capitalize">
                          {team.purpose}
                        </Badge>
                      )}
                      {team.subject && (
                        <Badge variant="secondary" className="text-[10px] bg-green-500/10 text-green-600 border-green-500/20">
                          {team.subject}
                        </Badge>
                      )}
                    </div>

                    <div className="mb-3">
                      <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 pl-0.5">
                        Requirements
                      </p>
                      {team.required_skills && team.required_skills.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {team.required_skills.map((skill: string, i: number) => (
                            <Badge key={i} variant="outline" className="text-[10px] bg-blue-500/5 text-blue-600 border-blue-200">
                              {skill}
                            </Badge>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-muted-foreground italic opacity-70">
                          {(() => {
                            const msgs = [
                              "Pulse check: Optional. 💗",
                              "No skills? No problem. 🤷‍♂️",
                              "Just bring good vibes. ✨",
                              "Requirements: breathing (negotiable). 😮‍💨",
                              "We have low standards. join us! 📉",
                              "Too cool for requirements. 😎",
                              "Ideally human, but we're flexible. 👽",
                              "Buy us some coffee. ☕"
                            ];
                            return msgs[(team.team_name?.length || 0) % msgs.length];
                          })()}
                        </p>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2 min-h-[2.5rem] mb-4 italic">
                      {team.description || "Too cool for descriptions, apparently. 🙄"}
                    </p>
                    <div className="flex items-center justify-between">
                      <Badge variant="secondary" className="text-xs">
                        <Users className="size-3 mr-1" />
                        {team.member_count || 0} member{team.member_count !== 1 ? 's' : ''}
                      </Badge>
                      <Button variant="ghost" size="sm" className="text-xs h-8 -mr-2">
                        <UserPlus className="size-3 mr-1" />
                        Join Team
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  )
}
