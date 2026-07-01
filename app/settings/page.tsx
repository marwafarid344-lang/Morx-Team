"use client"

import { useState, useEffect } from "react"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useTheme } from "next-themes"
import { useColorTheme } from "@/components/color-theme-provider"
import { useAuth } from "@/contexts/auth-context"
import { User, CreditCard, Palette, Shield, ChevronRight, Check, Sun, Moon, Laptop, Clock, Sparkles } from "lucide-react"
import { FACULTIES, FCDS_FACULTY_NAME } from "@/lib/constants/faculties"
import { DEPARTMENT_NAMES, FCDS_SUBJECTS } from "@/lib/constants/subjects"
import { EGYPTIAN_GOVERNORATES } from "@/lib/constants/governorates"
import { PLAN_LIMITS, getPlanLimit, getPlanBorderColor, getAiDailyLimit } from "@/lib/constants/plans"
import { PlanType } from "@/lib/types"
import { toast } from "sonner"
import { UserDNACard } from "@/components/ui/UserDNACard"
import { SkillTreeGraph } from "@/components/ui/SkillTreeGraph"
import { GamificationWidget } from "@/components/ui/GamificationWidget"
import { Trophy } from "lucide-react"


function ColorThemeSelector() {
  const { colorTheme, setColorTheme } = useColorTheme()

  const colorThemes = [
    { value: "default", label: "Default (Mint)", colors: ["158 64% 52%", "142 76% 36%", "160 84% 39%"] },
    { value: "volcano", label: "Volcano", colors: ["14 100% 57%", "24 95% 53%", "14 100% 57%"] },
    { value: "nightowl", label: "Night Owl", colors: ["207 90% 54%", "286 85% 60%", "171 100% 41%"] },
    { value: "skyblue", label: "Sky Blue", colors: ["199 89% 48%", "204 96% 27%", "186 100% 69%"] },
    { value: "sunset", label: "Sunset", colors: ["340 82% 52%", "25 95% 53%", "291 64% 42%"] },
    { value: "forest", label: "Forest", colors: ["142 76% 36%", "84 68% 42%", "173 58% 39%"] },
    { value: "ocean", label: "Ocean", colors: ["212 100% 48%", "188 78% 41%", "199 89% 48%"] },
    { value: "lavender", label: "Lavender", colors: ["262 83% 58%", "291 47% 51%", "280 67% 80%"] },
    { value: "rose", label: "Rose", colors: ["330 81% 60%", "346 77% 49%", "350 89% 60%"] },
    { value: "amber", label: "Amber", colors: ["32 95% 44%", "38 92% 50%", "45 93% 47%"] },
    { value: "mint", label: "Mint", colors: ["158 64% 52%", "168 76% 42%", "160 84% 39%"] },
    { value: "crimson", label: "Crimson", colors: ["348 83% 47%", "356 75% 53%", "340 82% 52%"] },
    { value: "indigo", label: "Indigo", colors: ["239 84% 67%", "243 75% 59%", "249 95% 63%"] },
    { value: "emerald", label: "Emerald", colors: ["158 64% 52%", "142 76% 36%", "152 60% 53%"] },
    { value: "coral", label: "Coral", colors: ["16 100% 66%", "14 91% 68%", "351 95% 71%"] },
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle>Color Theme</CardTitle>
        <CardDescription>
          Choose your favorite color palette for the entire site
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {colorThemes.map((theme) => (
            <button
              key={theme.value}
              onClick={() => setColorTheme(theme.value as any)}
              className={`relative p-4 border-2 rounded-lg transition-all hover:border-primary/50 ${
                colorTheme === theme.value ? "border-primary bg-primary/5" : "border-border"
              }`}
            >
              <div className="space-y-3">
                <div className="flex gap-1 justify-center">
                  {theme.colors.map((color, idx) => (
                    <div
                      key={idx}
                      className="h-8 w-8 rounded-full"
                      style={{ backgroundColor: `hsl(${color})` }}
                    />
                  ))}
                </div>
                <p className="text-xs font-medium text-center">{theme.label}</p>
              </div>
              {colorTheme === theme.value && (
                <div className="absolute top-2 right-2">
                  <Check className="size-4 text-primary" />
                </div>
              )}
            </button>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

// Clock Settings Component
function ClockSettingsContent() {
  const [is24Hour, setIs24Hour] = useState(true)
  const [timezone, setTimezone] = useState("Africa/Cairo")
  const [time, setTime] = useState(new Date())
  const [mounted, setMounted] = useState(false)

  const TIMEZONES = [
    { value: "Africa/Cairo", label: "Cairo (GMT+2)" },
    { value: "UTC", label: "UTC (GMT+0)" },
    { value: "America/New_York", label: "New York (EST/EDT)" },
    { value: "America/Los_Angeles", label: "Los Angeles (PST/PDT)" },
    { value: "America/Chicago", label: "Chicago (CST/CDT)" },
    { value: "Europe/London", label: "London (GMT/BST)" },
    { value: "Europe/Paris", label: "Paris (CET/CEST)" },
    { value: "Europe/Berlin", label: "Berlin (CET/CEST)" },
    { value: "Asia/Dubai", label: "Dubai (GST)" },
    { value: "Asia/Kolkata", label: "Mumbai (IST)" },
    { value: "Asia/Shanghai", label: "Shanghai (CST)" },
    { value: "Asia/Tokyo", label: "Tokyo (JST)" },
    { value: "Asia/Singapore", label: "Singapore (SGT)" },
    { value: "Australia/Sydney", label: "Sydney (AEST/AEDT)" },
    { value: "Africa/Johannesburg", label: "Johannesburg (SAST)" },
  ]

  useEffect(() => {
    setMounted(true)
    // Load saved preferences
    const savedFormat = localStorage.getItem("clock_format")
    const savedTimezone = localStorage.getItem("clock_timezone")
    
    if (savedFormat !== null) {
      setIs24Hour(savedFormat === "24")
    }
    if (savedTimezone) {
      setTimezone(savedTimezone)
    }
  }, [])

  useEffect(() => {
    const interval = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(interval)
  }, [])

  const handleFormatChange = (value: boolean) => {
    setIs24Hour(value)
    localStorage.setItem("clock_format", value ? "24" : "12")
  }

  const handleTimezoneChange = (value: string) => {
    setTimezone(value)
    localStorage.setItem("clock_timezone", value)
  }

  const formatTime = () => {
    try {
      return time.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: !is24Hour,
        timeZone: timezone,
      })
    } catch {
      return time.toLocaleTimeString()
    }
  }

  if (!mounted) return null

  return (
    <>
      {/* 12/24 Hour Format */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <Label htmlFor="clock-format" className="text-base font-medium">24-Hour Format</Label>
          <p className="text-sm text-muted-foreground">
            {is24Hour ? "Showing time in 24-hour format (e.g., 14:30)" : "Showing time in 12-hour format (e.g., 2:30 PM)"}
          </p>
        </div>
        <Switch
          id="clock-format"
          checked={is24Hour}
          onCheckedChange={handleFormatChange}
        />
      </div>

      <Separator />

      {/* Timezone Selection */}
      <div className="space-y-3">
        <Label className="text-base font-medium">Timezone</Label>
        <Select value={timezone} onValueChange={handleTimezoneChange}>
          <SelectTrigger className="w-full md:w-80">
            <SelectValue placeholder="Select your timezone" />
          </SelectTrigger>
          <SelectContent>
            {TIMEZONES.map((tz) => (
              <SelectItem key={tz.value} value={tz.value}>
                <span className="flex items-center gap-2">
                  {timezone === tz.value && <Check className="size-3 text-primary" />}
                  {tz.label}
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-sm text-muted-foreground">
          This affects how times are displayed in projects and tasks
        </p>
      </div>

      <Separator />

      {/* Live Preview */}
      <div className="flex items-center justify-between p-4 bg-primary/5 rounded-lg border border-primary/20">
        <div className="space-y-1">
          <p className="text-sm font-medium">Current Time Preview</p>
          <p className="text-xs text-muted-foreground">{TIMEZONES.find(t => t.value === timezone)?.label}</p>
        </div>
        <div className="flex items-center gap-2">
          <Clock className="size-5 text-primary" />
          <span className="font-mono text-xl font-bold">{formatTime()}</span>
        </div>
      </div>
    </>
  )
}

export default function SettingsPage() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const { user: authUser, setUser: setAuthUser, isLoading: isAuthLoading } = useAuth()
  const [user, setUser] = useState<any>(null)
  const [isNewUser, setIsNewUser] = useState(false)

  // Profile state - initialize with authUser if available, otherwise empty
  const [profile, setProfile] = useState(() => {
    if (authUser) {
      const userLinks = authUser.links || {}
      return {
        first_name: authUser.first_name || '',
        last_name: authUser.last_name || '',
        email: authUser.email || "",
        profileImage: authUser.profile_image || "",
        studyLevel: authUser.study_level?.toString() || "",
        department: authUser.department || "",
        faculty: authUser.faculty || "",
        governorate: authUser.governorate || "",
        bio: authUser.bio || "",
        skills: Array.isArray(authUser.skills) ? authUser.skills : [],
        is_available: authUser.is_available ?? true,
        searching_teams_subjects: Array.isArray(authUser.searching_teams_subjects) ? authUser.searching_teams_subjects : [],
        links: {
          github: userLinks.github || "",
          linkedin: userLinks.linkedin || "",
          facebook: userLinks.facebook || "",
          whatsapp: userLinks.whatsapp || ""
        }
      }
    }
    return {
      first_name: "",
      last_name: "",
      email: "",
      profileImage: "",
      studyLevel: "",
      department: "",
      faculty: "",
      governorate: "",
      bio: "",
      skills: [] as string[],
      is_available: true,
      searching_teams_subjects: [] as string[],
      links: {
        github: "",
        linkedin: "",
        facebook: "",
        whatsapp: ""
      }
    }
  })

  // Password state
  const [passwordData, setPasswordData] = useState({
    newPassword: "",
    confirmPassword: ""
  })


  // User stats for Plan tab
  const [userStats, setUserStats] = useState<{
    teams: { team_id: number; team_name: string; team_url: string; member_count: number; member_limit: number }[];
    total_teams: number;
    total_projects: number;
    total_tasks: number;
  } | null>(null)
  const [loadingStats, setLoadingStats] = useState(false)

  // AI Credits state
  const [aiCredits, setAiCredits] = useState<{
    used: number;
    limit: number;
    remaining: number;
    date: string;
    plan?: string;
    unlimited?: boolean;
  } | null>(null)

  // Safe localStorage wrapper
  const safeLocalStorage = {
    getItem: (key: string) => {
      if (typeof window !== "undefined") {
        return localStorage.getItem(key)
      }
      return null
    },
    setItem: (key: string, value: string) => {
      if (typeof window !== "undefined") {
        localStorage.setItem(key, value)
      }
    }
  }

  // Fetch user stats
  const fetchUserStats = async (authUserId: string) => {
    try {
      setLoadingStats(true)
      const res = await fetch(`/api/users/stats?auth_user_id=${authUserId}`)
      const data = await res.json()
      if (data.success) {
        setUserStats(data.data)
      }
    } catch (error) {
      console.error('Error fetching user stats:', error)
    } finally {
      setLoadingStats(false)
    }
  }

  // Fetch AI Credits usage
  const fetchAiCredits = async (authUserId: string) => {
    try {
      const res = await fetch(`/api/ai/usage?userId=${authUserId}`)
      const data = await res.json()
      if (data.success) {
        setAiCredits(data.data)
      }
    } catch (error) {
      console.error('Error fetching AI credits:', error)
    }
  }

  // Sync profile state when auth user is loaded or updated
  useEffect(() => {
    if (authUser) {
      setUser(authUser)
      const userLinks = authUser.links || {}
      
      // Update profile state to ensure it's in sync with authUser
      setProfile(prev => ({
        first_name: authUser.first_name || prev.first_name,
        last_name: authUser.last_name || prev.last_name,
        email: authUser.email || prev.email,
        profileImage: authUser.profile_image || prev.profileImage,
        studyLevel: authUser.study_level?.toString() || prev.studyLevel,
        department: authUser.department || prev.department,
        faculty: authUser.faculty || prev.faculty,
        governorate: authUser.governorate || prev.governorate,
        bio: authUser.bio || prev.bio,
        skills: Array.isArray(authUser.skills) ? authUser.skills : prev.skills,
        is_available: authUser.is_available ?? prev.is_available,
        searching_teams_subjects: Array.isArray(authUser.searching_teams_subjects) ? authUser.searching_teams_subjects : prev.searching_teams_subjects,
        links: {
          github: userLinks.github || prev.links.github,
          linkedin: userLinks.linkedin || prev.links.linkedin,
          facebook: userLinks.facebook || prev.links.facebook,
          whatsapp: userLinks.whatsapp || prev.links.whatsapp
        }
      }))
      
      if (authUser.auth_user_id) {
        fetchUserStats(authUser.auth_user_id)
        fetchAiCredits(authUser.auth_user_id)
      }
    }
  }, [authUser])

  useEffect(() => {
    setMounted(true)
    
    // Check if this is a new user from URL params
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search)
      setIsNewUser(urlParams.get('welcome') === 'true')
    }
  }, [])

  // Redirect unauthenticated users to signin
  useEffect(() => {
    if (!isAuthLoading && !authUser) {
      window.location.href = "/signin"
    }
  }, [authUser, isAuthLoading])

  // Dynamic plan data based on user's actual plan
  const userPlan = (user?.plan || 'free') as PlanType
  const planLimit = getPlanLimit(userPlan)
  const planBorderColor = getPlanBorderColor(userPlan)
  const aiDailyLimit = getAiDailyLimit(userPlan)

  const PLAN_FEATURES: Record<PlanType, string[]> = {
    free: [
      "Up to 15 team members",
      "5 AI requests per day",
      "Unlimited teams",
      "Unlimited projects",
      "Unlimited tasks",
      "Team collaboration",
      "Task comments & assignments",
    ],
    starter: [
      "Up to 50 team members",
      "10 AI requests per day",
      "Basic analytics",
      "5GB storage",
      "Email support",
      "Yellow profile border"
    ],
    professional: [
      "Up to 80 team members",
      "20 AI requests per day",
      "Advanced analytics",
      "25GB storage",
      "Priority email support",
      "API access",
      "Blue profile border"
    ],
    enterprise: [
      "Unlimited team members",
      "Unlimited AI requests",
      "Custom analytics",
      "Unlimited storage",
      "24/7 phone & email support",
      "Red profile border"
    ]
  }

  const PLAN_NAMES: Record<PlanType, string> = {
    free: "Free",
    starter: "Starter",
    professional: "Professional",
    enterprise: "Enterprise"
  }

  const planData = {
    name: PLAN_NAMES[userPlan],
    price: userPlan === 'free' ? "Free Forever" : userPlan === 'starter' ? "$29/month" : userPlan === 'professional' ? "$79/month" : "$199/month",
    status: "Active",
    borderColor: planBorderColor,
    features: PLAN_FEATURES[userPlan],
    limits: {
      teamMembers: planLimit === Infinity ? 'Unlimited' : planLimit,
      aiRequests: aiDailyLimit === Infinity ? 'Unlimited' : `${aiDailyLimit}/day`,
    }
  }

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      // Check if user is logged in
      if (!user || !user.auth_user_id) {
        toast.error("Please log in to update your profile")
        return
      }

      const updateData: any = {
        auth_user_id: user.auth_user_id,
        first_name: profile.first_name,
        last_name: profile.last_name,
        bio: profile.bio,
        skills: profile.skills,
        is_available: profile.is_available,
        searching_teams_subjects: profile.searching_teams_subjects,
        links: profile.links
      }

      // Only include password if both fields are filled and match
      if (passwordData.newPassword && passwordData.confirmPassword) {
        if (passwordData.newPassword !== passwordData.confirmPassword) {
          toast.error("Passwords do not match!")
          return
        }
        updateData.password = passwordData.newPassword
      }

      const res = await fetch('/api/users/update-profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData)
      })

      const result = await res.json()

      if (result.success) {
        // Update localStorage with new data using student_session key
        safeLocalStorage.setItem('student_session', JSON.stringify(result.data))
        
        // Update local state
        setAuthUser(result.data)
        setUser(result.data)
        const updatedLinks = result.data.links || {}
        setProfile({
          first_name: result.data.first_name,
          last_name: result.data.last_name,
          email: result.data.email,
          profileImage: result.data.profile_image || "",
          studyLevel: result.data.study_level?.toString() || "",
          department: result.data.department || "",
          faculty: result.data.faculty || "",
          governorate: result.data.governorate || "",
          bio: result.data.bio || "",
          skills: Array.isArray(result.data.skills) ? result.data.skills : [],
          is_available: result.data.is_available ?? true,
          searching_teams_subjects: Array.isArray(result.data.searching_teams_subjects) ? result.data.searching_teams_subjects : [],
          links: {
            github: updatedLinks.github || "",
            linkedin: updatedLinks.linkedin || "",
            facebook: updatedLinks.facebook || "",
            whatsapp: updatedLinks.whatsapp || ""
          }
        })

        // Clear password fields
        setPasswordData({ newPassword: "", confirmPassword: "" })

        // Trigger header update
        window.dispatchEvent(new CustomEvent('userLogin', { detail: result.data }))

        toast.success("Profile updated successfully!")
        
        // If this was a new user completing their profile, redirect to teams
        if (isNewUser) {
          setTimeout(() => {
            window.location.href = '/teams'
          }, 1000)
        }
      } else {
        toast.error(result.error || "Failed to update profile")
      }
    } catch (error) {
      console.error("Profile update error:", error)
      toast.error("An error occurred. Please try again.")
    }
  }


  const themeOptions = [
    { value: "light", label: "Light", icon: <Sun className="size-8" /> },
    { value: "dark", label: "Dark", icon: <Moon className="size-8" /> },
    { value: "system", label: "System", icon: <Laptop className="size-8" /> }
  ]

  // Get available subjects based on user's faculty and department (from ALL levels)
  const getAvailableSubjects = (): string[] => {
    // Only FCDS faculty can edit this field (case-insensitive check)
    if (!profile.faculty || profile.faculty.toLowerCase() !== FCDS_FACULTY_NAME.toLowerCase()) {
      return []
    }

    const dept = profile.department
    if (!dept) return []

    const allSubjects: string[] = []

    // Add all subjects from user's department across all levels (1-4)
    for (let level = 1; level <= 4; level++) {
      if (FCDS_SUBJECTS[level]?.[dept]) {
        allSubjects.push(...FCDS_SUBJECTS[level][dept])
      }
    }

    // Remove duplicates and return
    return [...new Set(allSubjects)]
  }

  const canEditSearchingSubjects = profile.faculty && profile.faculty.toLowerCase() === FCDS_FACULTY_NAME.toLowerCase() && profile.department

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 py-12 bg-muted/200">
        <div className="container px-4 md:px-6">
          <div className="mb-8">
            <h1 className="text-3xl font-bold tracking-tight mb-2">
              {isNewUser ? 'Welcome! Complete Your Profile' : 'Settings'}
            </h1>
            <p className="text-muted-foreground">
              {isNewUser 
                ? 'Please complete your profile information to get started with Morx' 
                : 'Manage your account settings'}
            </p>
          </div>

          {isNewUser && (
            <Card className="mb-6 border-primary bg-primary/5">
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <div className="size-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <User className="size-5 text-primary" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="font-semibold">Complete Your Profile</h3>
                    <p className="text-sm text-muted-foreground">
                      Set a password to secure your account and customize your profile in the other tabs.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <Tabs defaultValue="profile" className="space-y-6">
            <TabsList className="grid w-full grid-cols-5 lg:w-auto lg:inline-grid">
              <TabsTrigger value="profile" className="flex items-center gap-2">
                <User className="size-4" />
                <span className="hidden sm:inline">Profile</span>
              </TabsTrigger>
              <TabsTrigger value="plan" className="flex items-center gap-2">
                <CreditCard className="size-4" />
                <span className="hidden sm:inline">Plan</span>
              </TabsTrigger>
              <TabsTrigger value="appearance" className="flex items-center gap-2">
                <Palette className="size-4" />
                <span className="hidden sm:inline">Appearance</span>
              </TabsTrigger>
              <TabsTrigger value="professional" className="flex items-center gap-2">
                <Shield className="size-4" />
                <span className="hidden sm:inline">Professional</span>
              </TabsTrigger>
              <TabsTrigger value="skills" className="flex items-center gap-2">
                <Trophy className="size-4" />
                <span className="hidden sm:inline">Skills and DNA</span>
              </TabsTrigger>
            </TabsList>

            {/* Profile Tab */}
            <TabsContent value="profile" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Profile Information</CardTitle>
                  <CardDescription>
                    Update your personal information and account details
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center gap-4">
                    <Avatar className="size-20">
                      {profile.profileImage ? (
                        <AvatarImage src={profile.profileImage} alt={profile.first_name} />
                      ) : (
                        <AvatarImage src="/Morx.png" />
                      )}
                      <AvatarFallback className="text-lg">
                        {profile.first_name?.substring(0, 1)}{profile.last_name?.substring(0, 1)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="space-y-2">
                      <p className="text-sm font-medium">Profile Picture</p>
                      <p className="text-xs text-muted-foreground italic">Your profile picture is synchronized with your authentication provider (Google) and cannot be changed manually Through our platform.</p>
                    </div>
                  </div>

                  <Separator />

                  <form onSubmit={handleProfileUpdate} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="firstName">First Name</Label>
                        <Input
                          id="firstName"
                          value={profile.first_name}
                          onChange={(e) => setProfile({ ...profile, first_name: e.target.value })}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="lastName">Last Name</Label>
                        <Input
                          id="lastName"
                          value={profile.last_name}
                          onChange={(e) => setProfile({ ...profile, last_name: e.target.value })}
                          required
                        />
                      </div>
                      <div className="space-y-2 md:col-span-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                          id="email"
                          type="email"
                          value={profile.email}
                          disabled
                        />
                        <p className="text-xs text-muted-foreground">Email cannot be changed</p>
                      </div>

                      <div className="space-y-2 md:col-span-2">
                        <Label htmlFor="governorate">Governorate</Label>
                        <Select 
                          value={profile.governorate} 
                          onValueChange={(value) => setProfile({ ...profile, governorate: value })}
                          disabled
                        >
                          <SelectTrigger id="governorate">
                            <SelectValue placeholder="Select governorate" />
                          </SelectTrigger>
                          <SelectContent>
                            {EGYPTIAN_GOVERNORATES.map((gov) => (
                              <SelectItem key={gov} value={gov}>{gov}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2 md:col-span-2">
                        <Label htmlFor="faculty">Faculty</Label>
                        <Select 
                          value={profile.faculty} 
                          onValueChange={(value) => setProfile({ ...profile, faculty: value })}
                          disabled
                        >
                          <SelectTrigger id="faculty">
                            <SelectValue placeholder="Select faculty" />
                          </SelectTrigger>
                          <SelectContent>
                            {FACULTIES.map((f) => (
                              <SelectItem key={f} value={f}>{f}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Only show Study Level and Department for FCDS faculty */}
                      {profile.faculty && profile.faculty.toLowerCase() === FCDS_FACULTY_NAME.toLowerCase() && (
                        <>
                          <div className="space-y-2">
                            <Label htmlFor="studyLevel">Study Level</Label>
                            <Select 
                              value={profile.studyLevel} 
                              onValueChange={(value) => setProfile({ ...profile, studyLevel: value })}
                              disabled
                            >
                              <SelectTrigger id="studyLevel">
                                <SelectValue placeholder="Select level" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="1">Level 1</SelectItem>
                                <SelectItem value="2">Level 2</SelectItem>
                                <SelectItem value="3">Level 3</SelectItem>
                                <SelectItem value="4">Level 4</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="department">Department</Label>
                            <Select 
                              value={profile.department || undefined} 
                              onValueChange={(value) => setProfile({ ...profile, department: value })}
                              disabled
                            >
                              <SelectTrigger id="department">
                                <SelectValue placeholder="Select dept" />
                              </SelectTrigger>
                              <SelectContent>
                                {Object.entries(DEPARTMENT_NAMES).map(([code, name]) => (
                                  <SelectItem key={code} value={code}>{name}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </>
                      )}

                      <div className="md:col-span-2">
                        <p className="text-xs text-muted-foreground italic">
                          not available to edit now - contact the support in case of details corrections
                        </p>
                      </div>
                    </div>

                    <Separator />

                    <div>
                      <h3 className="text-lg font-semibold mb-4">Change Password</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="newPassword">New Password</Label>
                          <Input
                            id="newPassword"
                            type="password"
                            placeholder="Enter new password"
                            value={passwordData.newPassword}
                            onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="confirmPassword">Confirm Password</Label>
                          <Input
                            id="confirmPassword"
                            type="password"
                            placeholder="Confirm new password"
                            value={passwordData.confirmPassword}
                            onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                          />
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">Leave blank to keep current password</p>
                    </div>

                    <div className="flex justify-end gap-2">
                      <Button type="button" variant="outline" onClick={() => window.location.reload()}>Cancel</Button>
                      <Button type="submit">Save Changes</Button>
                    </div>
                  </form>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Security</CardTitle>
                  <CardDescription>Additional security settings</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <div className="font-medium">Two-Factor Authentication</div>
                      <div className="text-sm text-muted-foreground">Add an extra layer of security</div>
                    </div>
                    <Button variant="outline">Enable</Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            {/* Professional Tab */}
            <TabsContent value="professional" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Professional Profile</CardTitle>
                  <CardDescription>
                    Boost your team prospects by showcasing your skills and experience
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <div className="font-semibold text-lg">Available for Recruitment</div>
                      <div className="text-sm text-muted-foreground">Allow team owners to find you in the marketplace</div>
                    </div>
                    <Switch
                      checked={profile.is_available}
                      onCheckedChange={(checked) => setProfile({ ...profile, is_available: checked })}
                    />
                  </div>
                  
                  <Separator />
                  
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="bio">Professional Bio</Label>
                      <Textarea
                        id="bio"
                        placeholder="Tell teams about your experience and what you're looking for..."
                        className="min-h-[150px] resize-none"
                        value={profile.bio}
                        onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                      />
                      <p className="text-xs text-muted-foreground">Brief summary of your professional background (max 500 characters)</p>
                    </div>
                    
                    <div className="space-y-3">
                      <Label>Skills & Expertise</Label>
                      <div className="flex flex-wrap gap-2 mb-3 min-h-[40px] p-2 border rounded-md bg-muted/20">
                        {profile.skills.length === 0 ? (
                          <span className="text-sm text-muted-foreground italic px-2">No skills added yet...</span>
                        ) : (
                          profile.skills.map((skill, index) => (
                            <Badge key={index} variant="secondary" className="flex items-center gap-1 py-1 px-2">
                              {skill}
                              <button 
                                onClick={() => setProfile({ ...profile, skills: profile.skills.filter((_, i) => i !== index) })}
                                className="ml-1 hover:text-destructive transition-colors"
                              >
                                &times;
                              </button>
                            </Badge>
                          ))
                        )}
                      </div>
                      
                      <div className="flex gap-2">
                        <Input 
                          id="skillInput"
                          placeholder="Add a skill (e.g. React, Python, UI Design)" 
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              const val = (e.target as HTMLInputElement).value.trim();
                              if (val && !profile.skills.includes(val)) {
                                setProfile({ ...profile, skills: [...profile.skills, val] });
                                (e.target as HTMLInputElement).value = '';
                              }
                            }
                          }}
                        />
                        <Button 
                          type="button" 
                          variant="outline"
                          onClick={() => {
                            const input = document.getElementById('skillInput') as HTMLInputElement;
                            const val = input.value.trim();
                            if (val && !profile.skills.includes(val)) {
                              setProfile({ ...profile, skills: [...profile.skills, val] });
                              input.value = '';
                            }
                          }}
                        >
                          Add
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground italic">Press Enter to add multiple skills</p>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  {/* Social Links Section */}
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-lg font-semibold mb-1">Social Links</h3>
                      <p className="text-sm text-muted-foreground">Add your social profiles to help teams connect with you</p>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* GitHub */}
                      <div className="space-y-2">
                        <Label htmlFor="github" className="flex items-center gap-2">
                          <svg className="size-4" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                          </svg>
                          GitHub
                        </Label>
                        <Input
                          id="github"
                          placeholder="https://github.com/username"
                          value={profile.links.github}
                          onChange={(e) => setProfile({ ...profile, links: { ...profile.links, github: e.target.value } })}
                        />
                      </div>
                      
                      {/* LinkedIn */}
                      <div className="space-y-2">
                        <Label htmlFor="linkedin" className="flex items-center gap-2">
                          <svg className="size-4" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
                          </svg>
                          LinkedIn
                        </Label>
                        <Input
                          id="linkedin"
                          placeholder="https://linkedin.com/in/username"
                          value={profile.links.linkedin}
                          onChange={(e) => setProfile({ ...profile, links: { ...profile.links, linkedin: e.target.value } })}
                        />
                      </div>
                      
                      {/* Facebook */}
                      <div className="space-y-2">
                        <Label htmlFor="facebook" className="flex items-center gap-2">
                          <svg className="size-4" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385h-3.047v-3.47h3.047v-2.642c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953h-1.514c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385c5.736-.9 10.125-5.864 10.125-11.854z"/>
                          </svg>
                          Facebook
                        </Label>
                        <Input
                          id="facebook"
                          placeholder="https://facebook.com/username"
                          value={profile.links.facebook}
                          onChange={(e) => setProfile({ ...profile, links: { ...profile.links, facebook: e.target.value } })}
                        />
                      </div>
                      
                      {/* WhatsApp */}
                      <div className="space-y-2">
                        <Label htmlFor="whatsapp" className="flex items-center gap-2">
                          <svg className="size-4" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/>
                          </svg>
                          WhatsApp Number
                        </Label>
                        <Input
                          id="whatsapp"
                          placeholder="+20 1234567890"
                          value={profile.links.whatsapp}
                          onChange={(e) => setProfile({ ...profile, links: { ...profile.links, whatsapp: e.target.value } })}
                        />
                        <p className="text-xs text-muted-foreground">Include country code (e.g., +20 for Egypt)</p>
                      </div>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  {/* Searching for Teams Subjects */}
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-lg font-semibold mb-1">Team Subject Preferences</h3>
                      <p className="text-sm text-muted-foreground">
                        {canEditSearchingSubjects 
                          ? "Select subjects you're looking to join teams for. This helps team owners find you."
                          : "Only available for Faculty of Computer and Data Science students"}
                      </p>
                    </div>
                    
                    {canEditSearchingSubjects ? (
                      <div className="space-y-3">
                        {/* Selected Subjects Display */}
                        <div className="flex flex-wrap gap-2 mb-3 min-h-[40px] p-2 border rounded-md bg-muted/20">
                          {profile.searching_teams_subjects.length === 0 ? (
                            <span className="text-sm text-muted-foreground italic px-2">No subjects selected...</span>
                          ) : (
                            profile.searching_teams_subjects.map((subject, index) => (
                              <Badge key={index} variant="default" className="flex items-center gap-1 py-1 px-2">
                                {subject}
                                <button 
                                  onClick={() => setProfile({ 
                                    ...profile, 
                                    searching_teams_subjects: profile.searching_teams_subjects.filter((_, i) => i !== index) 
                                  })}
                                  className="ml-1 hover:text-destructive transition-colors"
                                >
                                  &times;
                                </button>
                              </Badge>
                            ))
                          )}
                        </div>
                        
                        {/* Subject Selector Dropdown */}
                        <div className="space-y-2">
                          <Label>Available Subjects for Your Level & Department</Label>
                          <Select 
                            value=""
                            onValueChange={(value) => {
                              if (value && !profile.searching_teams_subjects.includes(value)) {
                                setProfile({ 
                                  ...profile, 
                                  searching_teams_subjects: [...profile.searching_teams_subjects, value] 
                                })
                              }
                            }}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select a subject to add" />
                            </SelectTrigger>
                            <SelectContent>
                              {getAvailableSubjects().filter(s => !profile.searching_teams_subjects.includes(s)).map((subject) => (
                                <SelectItem key={subject} value={subject}>{subject}</SelectItem>
                              ))}
                              {getAvailableSubjects().filter(s => !profile.searching_teams_subjects.includes(s)).length === 0 && (
                                <div className="p-2 text-sm text-muted-foreground text-center">
                                  All subjects selected
                                </div>
                              )}
                            </SelectContent>
                          </Select>
                          <p className="text-xs text-muted-foreground italic">
                            Subjects from all levels in your department ({DEPARTMENT_NAMES[profile.department] || profile.department})
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="p-4 bg-muted/50 rounded-lg border border-dashed">
                        <p className="text-sm text-muted-foreground text-center">
                          This feature is only available for students from the Faculty of Computer and Data Science.
                          {profile.faculty && profile.faculty.toLowerCase() !== FCDS_FACULTY_NAME.toLowerCase() && (
                            <span className="block mt-1">Your current faculty: {profile.faculty}</span>
                          )}
                        </p>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex justify-end pt-4">
                    <Button onClick={handleProfileUpdate}>Save Professional Profile</Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Skill Tree & Achievements Tab */}
            <TabsContent value="skills" className="space-y-6">
              {user?.auth_user_id && (
                <>
                  <UserDNACard userId={user.auth_user_id} userName={user.first_name || 'Member'} />
                  <SkillTreeGraph userId={user.auth_user_id} />
                  <GamificationWidget userId={user.auth_user_id} />
                </>
              )}
            </TabsContent>

            {/* Plan Tab */}
            <TabsContent value="plan" className="space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Current Plan</CardTitle>
                      <CardDescription>Your subscription details</CardDescription>
                    </div>
                    <Badge className="bg-primary/10 text-primary hover:bg-primary/20">
                      {planData.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between p-4 bg-gradient-to-r from-primary/10 to-primary/5 rounded-lg border border-primary/20">
                    <div>
                      <h3 className="text-2xl font-bold text-primary">{planData.name}</h3>
                      <p className="text-muted-foreground">{planData.price}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">No credit card required</p>
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <h4 className="font-semibold mb-3">What's Included</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {planData.features.map((feature, index) => (
                        <div key={index} className="flex items-center gap-2 text-sm">
                          <Check className="size-4 text-primary flex-shrink-0" />
                          <span>{feature}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <h4 className="font-semibold mb-3">Your Usage</h4>
                    {loadingStats ? (
                      <p className="text-sm text-muted-foreground">Loading stats...</p>
                    ) : userStats ? (
                      <div className="space-y-4">
                        {/* Stats Cards */}
                        <div className="grid grid-cols-3 gap-4">
                          <div className="p-4 bg-muted rounded-lg text-center">
                            <p className="text-3xl font-bold text-primary">{userStats.total_teams}</p>
                            <p className="text-xs text-muted-foreground">Teams Created</p>
                          </div>
                          <div className="p-4 bg-muted rounded-lg text-center">
                            <p className="text-3xl font-bold text-primary">{userStats.total_projects}</p>
                            <p className="text-xs text-muted-foreground">Projects Created</p>
                          </div>
                          <div className="p-4 bg-muted rounded-lg text-center">
                            <p className="text-3xl font-bold text-primary">{userStats.total_tasks}</p>
                            <p className="text-xs text-muted-foreground">Tasks Created</p>
                          </div>
                        </div>

                        {/* Teams Member Progress */}
                        {userStats.teams.length > 0 && (
                          <div className="space-y-3">
                            <h5 className="text-sm font-medium text-muted-foreground">Team Members Usage</h5>
                            {userStats.teams.map((team) => (
                              <div key={team.team_id} className="p-3 bg-muted/50 rounded-lg space-y-2">
                                <div className="flex items-center justify-between text-sm">
                                  <span className="font-medium">{team.team_name}</span>
                                  <span className="text-muted-foreground">
                                    {team.member_count} / {team.member_limit === null ? 'Unlimited' : team.member_limit} members
                                  </span>
                                </div>
                                <div className="w-full bg-background rounded-full h-2">
                                  <div
                                    className={`h-2 rounded-full transition-all ${
                                      team.member_limit === null
                                        ? 'bg-primary'
                                        : team.member_count >= team.member_limit 
                                          ? 'bg-destructive' 
                                          : team.member_count >= team.member_limit * 0.8 
                                            ? 'bg-yellow-500' 
                                            : 'bg-primary'
                                    }`}
                                    style={{ width: `${team.member_limit === null ? Math.min((team.member_count / 100) * 100, 10) : Math.min((team.member_count / team.member_limit) * 100, 100)}%` }}
                                  />
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* AI Credits Usage */}
                        <div className="space-y-3">
                          <h5 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                            <Sparkles className="size-4 text-purple-500" />
                            AI Credits (Daily)
                          </h5>
                          <div className="p-4 bg-gradient-to-r from-purple-500/10 to-blue-500/10 rounded-lg border border-purple-500/20 space-y-3">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Sparkles className="size-5 text-purple-500" />
                                <span className="font-medium">AI Requests</span>
                              </div>
                              <span className="text-sm text-muted-foreground">
                                {aiCredits 
                                  ? aiCredits.unlimited 
                                    ? `${aiCredits.used} / Unlimited` 
                                    : `${aiCredits.used} / ${aiCredits.limit}`
                                  : 'Loading...'}
                              </span>
                            </div>
                            {!aiCredits?.unlimited && (
                              <div className="w-full bg-background/50 rounded-full h-3">
                                <div
                                  className={`h-3 rounded-full transition-all ${
                                    aiCredits && aiCredits.remaining === 0
                                      ? 'bg-destructive'
                                      : aiCredits && aiCredits.remaining <= 3
                                        ? 'bg-yellow-500'
                                        : 'bg-gradient-to-r from-purple-500 to-blue-500'
                                  }`}
                                  style={{ width: `${aiCredits && aiCredits.limit > 0 ? (aiCredits.used / aiCredits.limit) * 100 : 0}%` }}
                                />
                              </div>
                            )}
                            {aiCredits?.unlimited && (
                              <div className="w-full bg-gradient-to-r from-purple-500/30 to-blue-500/30 rounded-full h-3">
                                <div className="h-3 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 w-full animate-pulse" />
                              </div>
                            )}
                            <div className="flex items-center justify-between text-xs text-muted-foreground">
                              <span>
                                {aiCredits?.unlimited 
                                  ? '∞ Unlimited requests' 
                                  : `${aiCredits?.remaining ?? 5} credits remaining today`}
                              </span>
                              <span>{aiCredits?.unlimited ? 'Enterprise Plan' : 'Resets daily at midnight'}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">No usage data available</p>
                    )}
                  </div>

                  <Separator />

                  <div>
                    <h4 className="font-semibold mb-3">Plan Limits</h4>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                        <span className="text-sm">Members per Team</span>
                        <Badge variant="secondary">{typeof planData.limits.teamMembers === 'number' ? `${planData.limits.teamMembers} max` : planData.limits.teamMembers}</Badge>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                        <span className="text-sm">Teams</span>
                        <Badge variant="secondary">Unlimited</Badge>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                        <span className="text-sm">Projects</span>
                        <Badge variant="secondary">Unlimited</Badge>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                        <span className="text-sm">Tasks</span>
                        <Badge variant="secondary">Unlimited</Badge>
                      </div>
                    </div>
                  </div>

                </CardContent>
              </Card>
            </TabsContent>

            {/* Appearance Tab */}
            <TabsContent value="appearance" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Light/Dark Mode</CardTitle>
                  <CardDescription>
                    Choose how Morx looks and feels in your browser
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {themeOptions.map((option) => (
                      <button
                        key={option.value}
                        onClick={() => setTheme(option.value)}
                        className={`relative p-4 border-2 rounded-lg transition-all hover:border-primary/50 ${
                          theme === option.value ? "border-primary bg-primary/5" : "border-border"
                        }`}
                      >
                        <div className="flex flex-col items-center gap-2">
                          <span className="mb-2">{option.icon}</span>
                          <span className="font-medium">{option.label}</span>
                        </div>
                        {theme === option.value && (
                          <div className="absolute top-2 right-2">
                            <Check className="size-5 text-primary" />
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <ColorThemeSelector />

              {/* Clock Settings */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="size-5" />
                    Clock Settings
                  </CardTitle>
                  <CardDescription>
                    Configure how time is displayed across the platform
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <ClockSettingsContent />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
      <Footer />
    </div>
  )
}
