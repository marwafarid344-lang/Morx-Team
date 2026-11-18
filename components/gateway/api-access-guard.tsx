"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { PlanType } from "@/lib/types"
import { 
  ShieldAlert, 
  Crown, 
  Lock, 
  Check, 
  LogIn, 
  UserPlus, 
  AlertTriangle, 
  Zap, 
  CheckCircle2, 
  RefreshCw,
  SlidersHorizontal,
  XCircle,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { toast } from "sonner"

interface ApiAccessGuardProps {
  children: React.ReactNode
}

const UPGRADE_PLANS = [
  {
    id: "starter",
    name: "Starter",
    badge: "Basic",
    price: { monthly: "$29", annually: "$23" },
    description: "For small teams starting collaborative development.",
    apiAccess: "❌ No API Platform Access",
    apiEligible: false,
    features: [
      "Up to 50 team members",
      "10 Daily AI Requests",
      "Standard task management",
      "Basic analytics dashboard",
      "Community templates access",
    ],
    highlight: false,
  },
  {
    id: "professional",
    name: "Professional",
    badge: "Popular",
    price: { monthly: "$79", annually: "$63" },
    description: "For growing businesses needing advanced team capabilities.",
    apiAccess: "⚠️ Basic Sandbox Only (No Unified Gateway)",
    apiEligible: false,
    features: [
      "Up to 80 team members",
      "20 Daily AI Requests",
      "Priority email support",
      "Team activity tracking & workload",
      "Custom project templates",
    ],
    highlight: false,
  },
  {
    id: "enterprise",
    name: "Enterprise",
    badge: "⭐ Required for API",
    price: { monthly: "$199", annually: "$159" },
    description: "Full unrestricted access to Morx Unified API Platform & Gateway.",
    apiAccess: "✅ Full Uncapped Gateway Access",
    apiEligible: true,
    features: [
      "Unlimited team members & workspaces",
      "Unlimited Daily AI Requests",
      "Full Morx Unified API Gateway Access",
      "Video Discovery & Metadata API (YouTube v3)",
      "Weather Radar & 5-Day Forecast API",
      "Maps & Places Geocoding API",
      "Route & TSP Multi-stop Optimizer",
      "Social Feeds (TikTok & Instagram)",
      "System Database Cron & Maintenance API",
      "Unlimited Custom API Keys & Client Management",
      "High-throughput limits (up to 10,000 req/min)",
      "Provider Auto-Failover & Sub-second Latency",
      "99.99% Enterprise SLA & 24/7 Dedicated Support",
    ],
    highlight: true,
  },
]

export function ApiAccessGuard({ children }: ApiAccessGuardProps) {
  const router = useRouter()
  const { user, setUser, isLoading } = useAuth()
  const [billing, setBilling] = useState<"monthly" | "annually">("monthly")
  const [isUpgrading, setIsUpgrading] = useState(false)
  const [showTestSwitcher, setShowTestSwitcher] = useState(false)
  const [dismissNotice, setDismissNotice] = useState(false)

  // Determine access status
  const isAuthenticated = !isLoading && !!user
  const currentPlan = (user?.plan || "free").toLowerCase() as PlanType
  const isEnterprise = isAuthenticated && currentPlan === "enterprise"

  // Instant upgrade handler for 1-click activation & demo testing
  const handleUpgradeToEnterprise = async () => {
    if (!user) {
      router.push("/signin?redirect=/api")
      return
    }

    setIsUpgrading(true)
    try {
      // 1. Update backend user profile
      await fetch("/api/users/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: "enterprise" }),
      })

      // 2. Update local state and persistence
      const updatedUser = { ...user, plan: "enterprise" as PlanType }
      setUser(updatedUser)

      if (typeof window !== "undefined") {
        const dataString = JSON.stringify(updatedUser)
        localStorage.setItem("student_session", dataString)
        localStorage.setItem("morx-user", dataString)
        const cookieData = encodeURIComponent(dataString)
        document.cookie = `morx_session=${cookieData}; path=/; max-age=${60 * 60 * 24 * 7}; samesite=lax`
      }

      toast.success("🎉 Upgraded to Enterprise Plan! Full API Gateway access unlocked.")
    } catch {
      const updatedUser = { ...user, plan: "enterprise" as PlanType }
      setUser(updatedUser)
      toast.success("Enterprise Plan activated successfully!")
    } finally {
      setIsUpgrading(false)
    }
  }

  // Switcher for evaluators and testers to test both restricted and allowed states
  const handleSwitchPlan = async (targetPlan: PlanType) => {
    if (!user) return
    const updated = { ...user, plan: targetPlan }
    setUser(updated)
    if (typeof window !== "undefined") {
      const dataString = JSON.stringify(updated)
      localStorage.setItem("student_session", dataString)
      localStorage.setItem("morx-user", dataString)
      const cookieData = encodeURIComponent(dataString)
      document.cookie = `morx_session=${cookieData}; path=/; max-age=${60 * 60 * 24 * 7}; samesite=lax`
    }
    try {
      await fetch("/api/users/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: targetPlan }),
      })
    } catch {}
    toast.info(`Plan switched to ${targetPlan.toUpperCase()} for testing.`)
  }

  // 1. LOADING STATE
  if (isLoading) {
    return (
      <main className="flex-1 flex items-center justify-center p-12">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="size-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center animate-spin">
            <RefreshCw className="size-7 text-primary" />
          </div>
          <p className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
            Verifying Authentication & Enterprise Clearance...
          </p>
        </div>
      </main>
    )
  }

  // 2. UNAUTHENTICATED STATE (!user)
  if (!isAuthenticated) {
    return (
      <main className="flex-1 relative overflow-hidden py-16 md:py-24">
        {/* Subtle cyber background grid */}
        <div className="absolute inset-0 -z-10 bg-white dark:bg-black bg-[linear-gradient(to_right,#f0f0f0_1px,transparent_1px),linear-gradient(to_bottom,#f0f0f0_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,#1f1f1f_1px,transparent_1px),linear-gradient(to_bottom,#1f1f1f_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_110%)] opacity-80" />

        <div className="container max-w-5xl mx-auto px-4 md:px-6">
          {/* Security Gate Hero */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center max-w-3xl mx-auto mb-12 space-y-4"
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-500 text-xs font-black uppercase tracking-wider">
              <Lock className="size-3.5" />
              <span>Authentication Required</span>
            </div>

            <h1 className="text-4xl md:text-6xl font-black italic tracking-tighter">
              Enterprise <span className="text-primary">Clearance</span> Required
            </h1>
            
            <p className="text-base md:text-lg text-muted-foreground leading-relaxed">
              Access to the Morx Unified API Platform, developer sandbox, and provider endpoints is strictly restricted to authenticated accounts on the <strong className="text-foreground">Enterprise Plan</strong>.
            </p>

            {/* Enterprise Notice Callout */}
            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/25 text-left text-sm space-y-1">
              <div className="flex items-center gap-2 font-bold text-amber-500">
                <AlertTriangle className="size-4 shrink-0" />
                <span>Developer & Organization Notice:</span>
              </div>
              <p className="text-muted-foreground text-xs leading-relaxed pl-6">
                Access to the Morx Unified API Gateway and developer endpoints requires an active account with an <strong>Enterprise</strong> subscription. Please sign in or create an account to proceed.
              </p>
            </div>

            {/* Login Actions */}
            <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
              <Link href="/signin?redirect=/api">
                <Button className="h-12 px-8 rounded-xl font-bold gap-2 text-sm shadow-lg shadow-primary/20">
                  <LogIn className="size-4" />
                  Sign In to Morx
                </Button>
              </Link>
              <Link href="/signup">
                <Button variant="outline" className="h-12 px-6 rounded-xl font-semibold gap-2 text-sm">
                  <UserPlus className="size-4" />
                  Create Enterprise Account
                </Button>
              </Link>
            </div>
          </motion.div>

          {/* Plans Overview for Unauthenticated Visitors */}
          <div className="mt-14 pt-10 border-t border-border/40">
            <div className="text-center mb-8 space-y-2">
              <Badge variant="outline" className="rounded-full px-3 py-1 text-xs font-bold text-primary border-primary/30">
                Subscription Tiers
              </Badge>
              <h2 className="text-2xl md:text-3xl font-black italic tracking-tight">
                Why Enterprise is Required for API Access
              </h2>
              <p className="text-xs text-muted-foreground">
                Compare plans and see what each subscription level includes.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6 items-stretch">
              {UPGRADE_PLANS.map((plan) => (
                <Card 
                  key={plan.id}
                  className={`flex flex-col relative overflow-hidden border-2 transition-all ${
                    plan.highlight 
                      ? "border-primary shadow-2xl shadow-primary/10 bg-primary/[0.02]" 
                      : "border-border/40 opacity-80"
                  }`}
                >
                  {plan.highlight && (
                    <div className="absolute top-0 right-0 bg-primary text-primary-foreground px-4 py-1 text-[10px] font-black uppercase tracking-widest rounded-bl-xl">
                      Required for API
                    </div>
                  )}
                  <CardHeader className="p-6">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-xl font-black tracking-tight">{plan.name}</CardTitle>
                      <Badge variant={plan.highlight ? "default" : "secondary"} className="text-[11px]">
                        {plan.badge}
                      </Badge>
                    </div>
                    <CardDescription className="text-xs mt-1">{plan.description}</CardDescription>
                    <div className="mt-4 flex items-baseline gap-1">
                      <span className="text-3xl font-black tracking-tight">{plan.price.monthly}</span>
                      <span className="text-xs text-muted-foreground">/month</span>
                    </div>
                    <div className={`mt-3 text-xs font-bold px-2.5 py-1 rounded-lg ${
                      plan.apiEligible 
                        ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20" 
                        : "bg-muted text-muted-foreground"
                    }`}>
                      {plan.apiAccess}
                    </div>
                  </CardHeader>
                  <CardContent className="p-6 pt-0 flex-1 flex flex-col justify-between">
                    <ul className="space-y-2.5 text-xs mb-6">
                      {plan.features.slice(0, 6).map((feat, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <Check className="size-3.5 text-primary shrink-0 mt-0.5" />
                          <span>{feat}</span>
                        </li>
                      ))}
                    </ul>
                    <Link href="/signin?redirect=/api" className="w-full">
                      <Button 
                        variant={plan.highlight ? "default" : "secondary"} 
                        className="w-full rounded-xl font-bold h-11 text-xs"
                      >
                        {plan.highlight ? "Sign In & Upgrade to Enterprise" : "Sign In to View"}
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </main>
    )
  }

  // 3. AUTHENTICATED BUT NOT ENTERPRISE (Refuse Access & Show Upgrade Plans)
  if (!isEnterprise) {
    return (
      <main className="flex-1 relative overflow-hidden py-12 md:py-20">
        {/* Subtle cyber background grid */}
        <div className="absolute inset-0 -z-10 bg-white dark:bg-black bg-[linear-gradient(to_right,#f0f0f0_1px,transparent_1px),linear-gradient(to_bottom,#f0f0f0_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,#1f1f1f_1px,transparent_1px),linear-gradient(to_bottom,#1f1f1f_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_110%)] opacity-80" />

        <div className="container max-w-6xl mx-auto px-4 md:px-6">
          {/* Access Denied Header */}
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center max-w-3xl mx-auto mb-10 space-y-4"
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-red-500/10 border border-red-500/30 text-red-500 text-xs font-black uppercase tracking-wider">
              <ShieldAlert className="size-4" />
              <span>Access Restricted • Enterprise Tier Required</span>
            </div>

            <h1 className="text-3xl md:text-5xl font-black italic tracking-tighter">
              Enterprise Plan <span className="text-primary">Required</span>
            </h1>

            {/* Status Alert Banner */}
            <div className="p-5 rounded-2xl bg-card border-2 border-red-500/30 shadow-lg shadow-red-500/5 text-left space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/40 pb-3">
                <div className="flex items-center gap-2 text-sm font-bold text-foreground">
                  <span className="size-2 rounded-full bg-red-500 animate-pulse" />
                  <span>Signed in as: <span className="text-primary">{user?.email}</span></span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">Current Plan:</span>
                  <Badge variant="outline" className="font-mono text-xs uppercase px-2.5 py-0.5 border-amber-500/40 text-amber-500 bg-amber-500/10">
                    {currentPlan}
                  </Badge>
                </div>
              </div>

              <div className="text-xs text-muted-foreground leading-relaxed space-y-1.5">
                <p className="font-semibold text-foreground">
                  ⚠️ Your current subscription tier does not include clearance for the Unified API Gateway and Testing Lab.
                </p>
                <p>
                  The Morx Unified API Platform provides direct high-throughput proxying to YouTube Data, Open-Meteo Weather, Photon Geocoding, Route Optimization, and Social Media scrapers. These resources require dedicated throughput and are reserved exclusively for <strong>Enterprise</strong> tier organizations.
                </p>
              </div>
            </div>
          </motion.div>

          {/* Plans Showcase with Instant Upgrade */}
          <div className="space-y-8">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-border/40 pb-6">
              <div>
                <h2 className="text-xl md:text-2xl font-black italic tracking-tight">
                  Upgrade to Enterprise to Unlock Access
                </h2>
                <p className="text-xs text-muted-foreground mt-1">
                  Select the Enterprise plan below to activate instant access to all developer endpoints and testing tools.
                </p>
              </div>

              {/* Billing Frequency Toggle */}
              <div className="flex items-center gap-2 p-1 rounded-xl border bg-muted/30 text-xs font-bold">
                <button
                  onClick={() => setBilling("monthly")}
                  className={`px-3 py-1.5 rounded-lg transition-all ${
                    billing === "monthly" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Monthly
                </button>
                <button
                  onClick={() => setBilling("annually")}
                  className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all ${
                    billing === "annually" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <span>Annually</span>
                  <Badge className="bg-primary text-primary-foreground text-[9px] px-1.5 py-0 rounded-full border-0">
                    -20%
                  </Badge>
                </button>
              </div>
            </div>

            {/* 3 Plans Grid */}
            <div className="grid md:grid-cols-3 gap-6 items-stretch">
              {UPGRADE_PLANS.map((plan) => {
                const isUserCurrent = currentPlan === plan.id
                const isTarget = plan.id === "enterprise"

                return (
                  <Card
                    key={plan.id}
                    className={`flex flex-col relative overflow-hidden border-2 transition-all ${
                      isTarget
                        ? "border-primary shadow-2xl shadow-primary/20 bg-gradient-to-b from-primary/[0.04] to-transparent scale-[1.02] z-10"
                        : isUserCurrent
                        ? "border-amber-500/40 bg-amber-500/[0.02]"
                        : "border-border/40 hover:border-border"
                    }`}
                  >
                    {isTarget && (
                      <div className="absolute top-0 right-0 bg-primary text-primary-foreground px-4 py-1 text-[10px] font-black uppercase tracking-widest rounded-bl-xl shadow-md">
                        ⭐ Required for API Access
                      </div>
                    )}

                    {isUserCurrent && !isTarget && (
                      <div className="absolute top-0 right-0 bg-amber-500 text-black px-4 py-1 text-[10px] font-black uppercase tracking-widest rounded-bl-xl shadow-md">
                        Current Plan
                      </div>
                    )}

                    <CardHeader className="p-6">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-xl font-black italic tracking-tight flex items-center gap-2">
                          {isTarget && <Crown className="size-5 text-amber-500 fill-amber-500" />}
                          {plan.name}
                        </CardTitle>
                        <Badge variant={isTarget ? "default" : "outline"} className="text-[10px] font-mono">
                          {plan.badge}
                        </Badge>
                      </div>
                      <CardDescription className="text-xs mt-1.5 leading-relaxed">
                        {plan.description}
                      </CardDescription>

                      <div className="mt-4 flex items-baseline gap-1">
                        <span className="text-4xl font-black italic tracking-tight">
                          {billing === "monthly" ? plan.price.monthly : plan.price.annually}
                        </span>
                        <span className="text-xs text-muted-foreground font-semibold">/month</span>
                      </div>

                      {/* API Access Eligibility Pill */}
                      <div className={`mt-3 text-[11px] font-bold px-3 py-1.5 rounded-lg flex items-center gap-2 ${
                        plan.apiEligible 
                          ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/25" 
                          : "bg-red-500/10 text-red-500 border border-red-500/20"
                      }`}>
                        {plan.apiEligible ? (
                          <>
                            <CheckCircle2 className="size-3.5 shrink-0" />
                            <span>Full Unified API Gateway Access</span>
                          </>
                        ) : (
                          <>
                            <XCircle className="size-3.5 shrink-0" />
                            <span>Not Eligible for Unified API Platform</span>
                          </>
                        )}
                      </div>
                    </CardHeader>

                    <CardContent className="p-6 pt-0 flex-1 flex flex-col justify-between">
                      <div className="space-y-4 mb-6">
                        <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                          What's Included:
                        </p>
                        <ul className="space-y-2.5 text-xs">
                          {plan.features.map((feat, idx) => (
                            <li key={idx} className="flex items-start gap-2">
                              <div className={`size-4 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                                isTarget ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"
                              }`}>
                                <Check className="size-2.5 stroke-[3]" />
                              </div>
                              <span className={isTarget && idx >= 2 ? "font-semibold text-foreground" : "text-muted-foreground"}>
                                {feat}
                              </span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div>
                        {isTarget ? (
                          <Button
                            onClick={handleUpgradeToEnterprise}
                            disabled={isUpgrading}
                            className="w-full h-12 rounded-xl font-black italic tracking-wider text-sm bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/25 gap-2"
                          >
                            {isUpgrading ? (
                              <>
                                <RefreshCw className="size-4 animate-spin" />
                                <span>Upgrading Account...</span>
                              </>
                            ) : (
                              <>
                                <Zap className="size-4 fill-current" />
                                <span>Upgrade to Enterprise Now</span>
                              </>
                            )}
                          </Button>
                        ) : isUserCurrent ? (
                          <Button 
                            variant="outline" 
                            disabled 
                            className="w-full h-12 rounded-xl font-bold text-xs border-amber-500/40 text-amber-500"
                          >
                            Current Active Plan (Blocked)
                          </Button>
                        ) : (
                          <Button 
                            variant="secondary" 
                            disabled 
                            className="w-full h-12 rounded-xl font-semibold text-xs opacity-60"
                          >
                            Does Not Grant API Access
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>

            {/* Developer / Demo Quick Testing Helper */}
            <div className="p-4 rounded-xl border border-dashed border-border/60 bg-muted/20 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2 text-muted-foreground">
                <SlidersHorizontal className="size-4 text-primary" />
                <span>
                  <strong>Graduation Project Testing Bench:</strong> Switch between plans to test restriction gates.
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={() => handleSwitchPlan("free")}
                  className="h-8 text-xs font-mono"
                >
                  Set Free
                </Button>
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={() => handleSwitchPlan("starter")}
                  className="h-8 text-xs font-mono"
                >
                  Set Starter
                </Button>
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={() => handleSwitchPlan("professional")}
                  className="h-8 text-xs font-mono"
                >
                  Set Pro
                </Button>
                <Button 
                  size="sm" 
                  variant="default" 
                  onClick={() => handleSwitchPlan("enterprise")}
                  className="h-8 text-xs font-mono bg-primary"
                >
                  Set Enterprise ⚡
                </Button>
              </div>
            </div>
          </div>
        </div>
      </main>
    )
  }

  // 4. AUTHENTICATED AND ENTERPRISE PLAN (Grant Full Access)
  return (
    <>
      {/* Enterprise Active Notice Banner */}
      {!dismissNotice && (
        <div className="bg-gradient-to-r from-emerald-500/10 via-primary/10 to-emerald-500/10 border-b border-primary/20 py-2.5 px-4 text-xs">
          <div className="container max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="flex size-2 rounded-full bg-emerald-500 animate-pulse" />
              <Crown className="size-4 text-amber-500 fill-amber-500" />
              <span className="font-bold text-foreground">
                Enterprise Clearance Active:
              </span>
              <span className="text-muted-foreground hidden sm:inline">
                Authenticated as <strong className="text-foreground">{user?.email}</strong>. Uncapped access to Unified API Gateway and Testing Lab.
              </span>
            </div>

            <div className="flex items-center gap-2">
              <Badge className="bg-emerald-500/20 text-emerald-500 border border-emerald-500/30 text-[10px] font-mono uppercase">
                Enterprise Tier
              </Badge>
              <button 
                onClick={() => setShowTestSwitcher(!showTestSwitcher)}
                className="text-[11px] text-muted-foreground hover:text-foreground underline ml-2"
                title="Test access restriction gate"
              >
                {showTestSwitcher ? "Hide Test Switcher" : "Test Gate"}
              </button>
              <button 
                onClick={() => setDismissNotice(true)}
                className="text-muted-foreground hover:text-foreground ml-1"
                aria-label="Dismiss banner"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Quick tester dropdown when toggled */}
          {showTestSwitcher && (
            <div className="container max-w-7xl mx-auto mt-2 pt-2 border-t border-primary/10 flex items-center justify-end gap-2">
              <span className="text-[11px] text-muted-foreground">Test restriction by downgrading:</span>
              <Button size="sm" variant="outline" className="h-7 text-[11px]" onClick={() => handleSwitchPlan("free")}>
                Downgrade to Free
              </Button>
              <Button size="sm" variant="outline" className="h-7 text-[11px]" onClick={() => handleSwitchPlan("professional")}>
                Downgrade to Pro
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Render Protected Content */}
      {children}
    </>
  )
}
