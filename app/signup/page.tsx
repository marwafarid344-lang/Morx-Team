"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { createBrowserClient } from "@supabase/ssr"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/contexts/auth-context"
import { 
  ArrowRight, 
  ChevronRight, 
  Loader2,
  AlertCircle,
  Sun,
  Moon,
  Github
} from "lucide-react"
import { useTheme } from "next-themes"

const steps = [
  { id: 1, name: "Initialize" },
  { id: 2, name: "Authenticate" },
  { id: 3, name: "Profile" },
  { id: 4, name: "Mission" },
  { id: 5, name: "Gateway" },
]

export default function SignUpPage() {
  const router = useRouter()
  const { user, isLoading: isAuthLoading } = useAuth()
  const [step, setStep] = useState(0) // 0: Splash, 1: Choice
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [supabase, setSupabase] = useState<any>(null)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Redirect logged-in users to home
  useEffect(() => {
    if (mounted && !isAuthLoading && user) {
      router.replace("/")
    }
  }, [user, isAuthLoading, router, mounted])

  // Initialize Supabase client on mount
  useEffect(() => {
    const client = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
    setSupabase(client)
  }, [])

  // Floating background elements tracking mouse
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 })
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({ x: (e.clientX / window.innerWidth) - 0.5, y: (e.clientY / window.innerHeight) - 0.5 })
    }
    window.addEventListener("mousemove", handleMouseMove)
    return () => window.removeEventListener("mousemove", handleMouseMove)
  }, [])

  const handleGoogleAuth = async () => {
    if (!supabase) {
      setError("Authentication node not ready. Wait a second.")
      return
    }

    setLoading(true)
    setError("")
    
    try {
      const { data, error: authError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: {
            prompt: 'select_account',
            access_type: 'offline',
          },
        },
      })

      if (authError) {
        setError(authError.message)
        setLoading(false)
        return
      }

      if (data?.url) {
        window.location.href = data.url
      }
    } catch (e) {
      setError("The stardust failed to align. Try again?")
      setLoading(false)
    }
  }

  const handleGithubAuth = async () => {
    if (!supabase) {
      setError("Authentication node not ready. Wait a second.")
      return
    }

    setLoading(true)
    setError("")
    
    try {
      const { data, error: authError } = await supabase.auth.signInWithOAuth({
        provider: 'github',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (authError) {
        setError(authError.message)
        setLoading(false)
        return
      }

      if (data?.url) {
        window.location.href = data.url
      }
    } catch (e) {
      setError("The stardust failed to align. Try again?")
      setLoading(false)
    }
  }

  if (!mounted) return null

  return (
    <div className="-mt-24 -mb-12 h-screen bg-background text-foreground selection:bg-primary/30 relative overflow-hidden font-sans">
      {/* Immersive Background */}
      <motion.div 
        className="absolute inset-0 z-0 pointer-events-none"
        style={{
          x: mousePos.x * 30,
          y: mousePos.y * 30,
        }}
      >
        <div className="absolute top-[-10%] left-[-10%] size-[600px] bg-primary/10 rounded-full blur-[120px] animate-pulse dark:bg-primary/10 light:bg-primary/5" />
        <div className="absolute bottom-[-10%] right-[-10%] size-[600px] bg-secondary/10 rounded-full blur-[120px] animate-pulse delay-700 dark:bg-secondary/10 light:bg-secondary/5" />
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-[0.05] dark:opacity-[0.03]" />
      </motion.div>

      <div className="container relative z-10 h-full flex flex-col px-4 pt-12 pb-12">
        {/* Persistent Branding */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between w-full mb-8 relative z-20"
        >
          <div className="flex-1" />
          <Link href="/" className="flex items-center gap-2 font-bold group focus:outline-none">
            <div className="relative size-9 rounded-full bg-primary flex items-center justify-center overflow-hidden">
              <Image 
                src="/Morx upscaled.png" 
                alt="Morx" 
                width={36} 
                height={36} 
                className="size-full object-cover transition-transform group-hover:scale-110" 
              />
            </div>
            <span className="text-xl rock-salt group-hover:text-primary transition-colors">Morx</span>
          </Link>
          <div className="flex-1 flex justify-end">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="rounded-full hover:bg-foreground/5 transition-colors"
            >
              {theme === "dark" ? <Sun className="size-5" /> : <Moon className="size-5" />}
            </Button>
          </div>
        </motion.div>

        <div className="flex-1 flex flex-col items-center justify-center">
          <AnimatePresence mode="wait">
          {/* STEP 0: Splash */}
          {step === 0 && (
            <motion.div 
              key="step0"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-xl text-center space-y-8"
            >
              <h1 className="text-6xl md:text-8xl font-black italic tracking-tighter leading-none">
                Start your <span className="text-primary">Legacy.</span>
              </h1>
              <p className="text-xl text-muted-foreground font-medium">Your workflow isn&apos;t just about tasks — it&apos;s about the marks you leave. Ready to build something great?</p>
              <Button 
                onClick={() => setStep(1)}
                className="h-16 px-12 rounded-full text-xl font-black italic tracking-tighter bg-foreground text-background hover:scale-105 transition-transform shadow-[0_10px_30px_-10px_rgba(0,0,0,0.1)] dark:shadow-[0_10px_30px_-10px_rgba(255,255,255,0.1)]"
              >
                Let&apos;s Go <ArrowRight className="ml-2 size-6" />
              </Button>
            </motion.div>
          )}

          {/* STEP 1: Choice */}
          {step === 1 && (
            <motion.div 
              key="step1"
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -40 }}
              className="w-full max-w-lg space-y-12"
            >
              <div className="space-y-4 text-center">
                <h2 className="text-4xl md:text-5xl font-black italic tracking-tighter">Enter the Core.</h2>
                <p className="text-lg text-muted-foreground">We exclusively use authorized digital protocols for maximum security and simplicity.</p>
              </div>
              
               <div className="grid gap-4">
                  <button 
                  onClick={handleGoogleAuth}
                  disabled={loading}
                  className="flex items-center justify-between group p-5 rounded-[32px] bg-foreground text-background hover:scale-[1.02] transition-all text-left shadow-[0_20px_40px_-15px_rgba(0,0,0,0.1)] dark:shadow-[0_20px_40px_-15px_rgba(255,255,255,0.05)]"
                 >
                    <div className="flex items-center gap-5">
                       <div className="size-12 rounded-2xl bg-background flex items-center justify-center p-2.5 shadow-sm">
                          <svg viewBox="0 0 24 24" className="size-full"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" /><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" /><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" /><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" /></svg>
                       </div>
                       <div>
                          <p className="text-xl font-black italic tracking-tighter">Launch with Google</p>
                          <p className="text-[10px] font-bold opacity-40 uppercase tracking-wider">Instant Authentication</p>
                       </div>
                    </div>
                    {loading ? <Loader2 className="animate-spin size-7" /> : <ChevronRight className="size-7 opacity-20 group-hover:opacity-100 transition-opacity" />}
                 </button>

                 <button 
                  onClick={handleGithubAuth}
                  disabled={loading}
                  className="flex items-center justify-between group p-5 rounded-[32px] bg-foreground text-background hover:scale-[1.02] transition-all text-left shadow-[0_20px_40px_-15px_rgba(0,0,0,0.1)] dark:shadow-[0_20px_40px_-15px_rgba(255,255,255,0.05)]"
                 >
                    <div className="flex items-center gap-5">
                       <div className="size-12 rounded-2xl bg-foreground text-background flex items-center justify-center p-2.5 shadow-sm group-hover:rotate-6 transition-transform ring-1 ring-background/10">
                          <Github className="size-full" />
                       </div>
                       <div>
                          <p className="text-xl font-black italic tracking-tighter">Launch with GitHub</p>
                          <p className="text-[10px] font-bold opacity-40 uppercase tracking-wider">Developer Grade Auth</p>
                       </div>
                    </div>
                    {loading ? <Loader2 className="animate-spin size-7" /> : <ChevronRight className="size-7 opacity-20 group-hover:opacity-100 transition-opacity" />}
                 </button>

                 {error && (
                    <div className="flex items-center gap-2 text-red-500 font-bold justify-center bg-red-500/10 p-4 rounded-2xl border border-red-500/20">
                      <AlertCircle className="size-5" /> {error}
                    </div>
                 )}
              </div>

               <div className="pt-8 flex flex-col items-center gap-4">
                 <p className="text-muted-foreground/30 text-[10px] font-black uppercase tracking-[0.3em]">Already initialized?</p>
                 <Link href="/signin" className="text-foreground hover:text-primary font-bold underline underline-offset-8 decoration-foreground/20 hover:decoration-primary transition-all">Sign in to your account</Link>
              </div>
            </motion.div>
          )}


        </AnimatePresence>
        </div>
      </div>
    </div>
  )
}
