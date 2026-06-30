"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { 
  ArrowRight, 
  ArrowLeft, 
  ShieldCheck,
  Globe,
  Loader2,
  Sun,
  Moon,
} from "lucide-react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { DEPARTMENT_NAMES } from "@/lib/constants/subjects"
import { FACULTIES, FCDS_FACULTY_NAME } from "@/lib/constants/faculties"
import { EGYPTIAN_GOVERNORATES } from "@/lib/constants/governorates"
import { useTheme } from "next-themes"

function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const cookies = document.cookie.split(';');
  const cookie = cookies.find(c => c.trim().startsWith(name + '='));
  if (cookie) return decodeURIComponent(cookie.split('=')[1]);
  return null;
}

export default function CompleteProfilePage() {
  const router = useRouter()
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [step, setStep] = useState(1) // 1: Name, 2: Governorate, 3: Faculty, 4: Academic, 5: Security
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [email, setEmail] = useState("")
  const [governorate, setGovernorate] = useState<string>("")
  const [faculty, setFaculty] = useState<string>("")
  const [studyLevel, setStudyLevel] = useState<string>("")
  const [department, setDepartment] = useState<string>("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [hasSession, setHasSession] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    const tempSessionStr = getCookie('morx_temp_session')
    if (tempSessionStr) {
      try {
        const tempSession = JSON.parse(tempSessionStr)
        if (tempSession.isTemporary) {
          setEmail(tempSession.email || '')
          setFirstName(tempSession.tempFirstName || '')
          setLastName(tempSession.tempLastName || '')
          setHasSession(true)
        }
      } catch (e) { console.error(e) }
    } else {
      router.push('/signup?error=Session expired')
    }
  }, [router])

  const handleNext = () => {
    setError("")
    if (step === 1 && (!firstName || !lastName)) { setError("Names are required to build your profile DNA."); return }
    if (step === 2 && !governorate) { setError("Governorate selection is required to proceed."); return }
    if (step === 3 && !faculty) { setError("Faculty selection is required to proceed."); return }
    if (step === 4 && (!studyLevel || !department)) { setError("Academic focus is mandatory for team placement."); return }
    
    // Logic to skip Academic step (step 4) if not FCDS
    if (step === 3 && faculty !== FCDS_FACULTY_NAME) {
      setStep(5)
      return
    }
    
    setStep(s => s + 1)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    if (password !== confirmPassword) { setError("The encryption keys (passwords) do not match."); setLoading(false); return }

    const profileData: any = { 
      first_name: firstName, 
      last_name: lastName, 
      password,
      governorate,
      faculty,
      study_level: studyLevel || null,
      department: department || null
    }

    try {
      const res = await fetch('/api/auth/complete-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profileData),
      })

      const result = await res.json()
      if (result.success) {
        const userData = result.data.user
        localStorage.setItem('student_session', JSON.stringify(userData))
        window.dispatchEvent(new CustomEvent('userLogin', { detail: userData }))
        router.push('/')
      } else {
        setError(result.error || 'The transmission failed. Check your connection.')
        setLoading(false)
      }
    } catch {
      setError("An unexpected solar flare occurred.")
      setLoading(false)
    }
  }

  if (!mounted || !hasSession) return (
    <div className="-mb-8 min-h-screen bg-background flex items-center justify-center">
       <div className="flex flex-col items-center gap-4">
          <Loader2 className="animate-spin text-primary size-12" />
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground">Syncing Stardust...</p>
       </div>
    </div>
  )

  return (
    <div className="-mb-12 min-h-screen bg-background text-foreground selection:bg-primary/30 relative overflow-hidden flex flex-col items-center justify-center p-4">
      {/* Immersive Background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 size-[800px] bg-gradient-to-br from-primary/5 to-secondary/5 rounded-full blur-[140px]" />
        <div className="absolute top-0 right-0 size-96 bg-primary/10 rounded-full blur-[100px]" />
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-[0.02]" />
      </div>

      {/* Header Branding */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="absolute top-4 left-0 right-0 flex items-center justify-between px-8"
      >
        <div className="flex-1" />
        <div className="flex items-center gap-3">
          <div className="relative size-9 rounded-full bg-primary flex items-center justify-center overflow-hidden">
            <Image 
              src="/Morx upscaled.png" 
              alt="Morx" 
              width={36} 
              height={36} 
              className="size-full object-cover" 
            />
          </div>
          <span className="text-xl font-black italic tracking-tighter rock-salt">Morx</span>
        </div>
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

      <div className="w-full max-w-xl relative">
        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div key="st1" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, x: -50 }} className="space-y-12">
               <div className="space-y-4">
                  <h2 className="text-5xl font-black italic tracking-tighter leading-none underline decoration-primary/30">Welcome, Explorer.</h2>
                  <p className="text-lg text-muted-foreground">Google core authenticated <span className="text-primary font-bold">[{email}]</span>. Let&apos;s finalize your digital identity.</p>
               </div>
               
               <div className="grid gap-6">
                  <div className="space-y-2 relative group">
                     <Label className="text-[10px] font-black uppercase tracking-widest text-primary absolute -top-2 left-6 bg-background px-2 z-10">First Name</Label>
                     <Input value={firstName} onChange={(e)=>setFirstName(e.target.value)} className="h-20 text-3xl font-bold px-8 rounded-[40px] bg-foreground/5 border-2 border-foreground/10 focus-visible:ring-0 focus-visible:border-primary transition-all" />
                  </div>
                  <div className="space-y-2 relative group">
                     <Label className="text-[10px] font-black uppercase tracking-widest text-secondary absolute -top-2 left-6 bg-background px-2 z-10">Last Name</Label>
                     <Input value={lastName} onChange={(e)=>setLastName(e.target.value)} className="h-20 text-3xl font-bold px-8 rounded-[40px] bg-foreground/5 border-2 border-foreground/10 focus-visible:ring-0 focus-visible:border-secondary transition-all" />
                  </div>
               </div>

               {error && <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 font-bold text-sm text-center">{error}</div>}
               <Button onClick={handleNext} className="w-full h-16 rounded-full text-xl font-black italic tracking-tighter bg-foreground text-background hover:scale-[1.02] transition-transform">Synchronize Identity <ArrowRight className="ml-2" /></Button>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div key="st_governorate" initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }} className="space-y-12">
               <div className="space-y-4">
                  <h2 className="text-5xl font-black italic tracking-tighter leading-none">Your Location.</h2>
                  <p className="text-lg text-muted-foreground">Select your governorate to connect with nearby talent.</p>
               </div>

               <div className="grid gap-6">
                 <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-primary ml-4">Choose Governorate</Label>
                    <Select value={governorate} onValueChange={setGovernorate}>
                       <SelectTrigger className="h-20 text-xl font-bold px-8 rounded-[40px] bg-foreground/5 border-2 border-foreground/10 focus-visible:ring-0 border-primary/20">
                          <SelectValue placeholder="Select governorate" />
                       </SelectTrigger>
                       <SelectContent className="bg-popover border-border text-foreground rounded-3xl max-h-[300px]">
                          {EGYPTIAN_GOVERNORATES.map((gov) => (
                             <SelectItem key={gov} value={gov}>{gov}</SelectItem>
                          ))}
                       </SelectContent>
                    </Select>
                 </div>
               </div>

               {error && <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 font-bold text-sm text-center">{error}</div>}
               <div className="flex gap-4">
                  <Button variant="ghost" onClick={()=>setStep(1)} className="h-14 px-8 rounded-full border border-foreground/10 font-bold"><ArrowLeft className="mr-2" /> Back</Button>
                  <Button onClick={handleNext} className="flex-1 h-16 rounded-full text-xl font-black italic tracking-tighter bg-primary text-white hover:scale-[1.02] transition-all">Continue <ArrowRight className="ml-2" /></Button>
               </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div key="st_faculty" initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }} className="space-y-12">
               <div className="space-y-4">
                  <h2 className="text-5xl font-black italic tracking-tighter leading-none">Your Campus.</h2>
                  <p className="text-lg text-muted-foreground">Select your base of operations within the university system.</p>
               </div>

               <div className="grid gap-6">
                 <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-primary ml-4">Choose Faculty</Label>
                    <Select value={faculty} onValueChange={setFaculty}>
                       <SelectTrigger className="h-20 text-xl font-bold px-8 rounded-[40px] bg-foreground/5 border-2 border-foreground/10 focus-visible:ring-0 border-primary/20">
                          <SelectValue placeholder="Select faculty" />
                       </SelectTrigger>
                       <SelectContent className="bg-popover border-border text-foreground rounded-3xl max-h-[300px]">
                          {FACULTIES.map((f) => (
                             <SelectItem key={f} value={f}>{f}</SelectItem>
                          ))}
                       </SelectContent>
                    </Select>
                 </div>
               </div>

               {error && <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 font-bold text-sm text-center">{error}</div>}
               <div className="flex gap-4">
                  <Button variant="ghost" onClick={()=>setStep(2)} className="h-14 px-8 rounded-full border border-foreground/10 font-bold"><ArrowLeft className="mr-2" /> Back</Button>
                  <Button onClick={handleNext} className="flex-1 h-16 rounded-full text-xl font-black italic tracking-tighter bg-primary text-white hover:scale-[1.02] transition-all">Continue <ArrowRight className="ml-2" /></Button>
               </div>
            </motion.div>
          )}

          {step === 4 && (
            <motion.div key="st4_academic" initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }} className="space-y-12">
               <div className="space-y-4">
                  <h2 className="text-5xl font-black italic tracking-tighter leading-none">Your Domain.</h2>
                  <p className="text-lg text-muted-foreground">Professional context matters. Choose your academic specialization below.</p>
               </div>

               <div className="grid gap-6">
                 <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-primary ml-4">Education Level</Label>
                    <Select value={studyLevel} onValueChange={setStudyLevel}>
                       <SelectTrigger className="h-20 text-2xl font-bold px-8 rounded-[40px] bg-foreground/5 border-2 border-foreground/10 focus-visible:ring-0 border-primary/20">
                          <SelectValue placeholder="Current Level" />
                       </SelectTrigger>
                       <SelectContent className="bg-popover border-border text-foreground rounded-3xl">
                          <SelectItem value="1">Level 1 - Foundation</SelectItem>
                          <SelectItem value="2">Level 2 - Explorer</SelectItem>
                          <SelectItem value="3">Level 3 - Professional</SelectItem>
                          <SelectItem value="4">Level 4 - Expert</SelectItem>
                       </SelectContent>
                    </Select>
                 </div>
                 <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-secondary ml-4">Specialization</Label>
                    <Select value={department} onValueChange={setDepartment}>
                       <SelectTrigger className="h-20 text-2xl font-bold px-8 rounded-[40px] bg-foreground/5 border-2 border-foreground/10 focus-visible:ring-0 border-secondary/20">
                          <SelectValue placeholder="Department" />
                       </SelectTrigger>
                       <SelectContent className="bg-popover border-border text-foreground rounded-3xl">
                          {Object.entries(DEPARTMENT_NAMES).map(([code, name]) => (
                             <SelectItem key={code} value={code}>{name}</SelectItem>
                          ))}
                       </SelectContent>
                    </Select>
                 </div>
               </div>

               {error && <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 font-bold text-sm text-center">{error}</div>}
               <div className="flex gap-4">
                  <Button variant="ghost" onClick={()=>setStep(3)} className="h-14 px-8 rounded-full border border-foreground/10 font-bold"><ArrowLeft className="mr-2" /> Back</Button>
                  <Button onClick={handleNext} className="flex-1 h-16 rounded-full text-xl font-black italic tracking-tighter bg-primary text-white hover:scale-[1.02] transition-all">Proceed to Security <ArrowRight className="ml-2" /></Button>
               </div>
            </motion.div>
          )}

          {step === 5 && (
            <motion.div key="st5_security" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="space-y-12">
               <div className="space-y-4">
                  <h2 className="text-5xl font-black italic tracking-tighter leading-none">Security Lock.</h2>
                  <p className="text-lg text-muted-foreground">Create a secondary password as a backup to your Google auth.</p>
               </div>

               <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-2 relative group">
                     <Label className="text-[10px] font-black uppercase tracking-widest text-primary absolute -top-2 left-6 bg-background px-2 z-10">Backup Password</Label>
                     <Input type="password" value={password} onChange={(e)=>setPassword(e.target.value)} className="h-20 text-3xl font-bold px-8 rounded-[40px] bg-foreground/5 border-2 border-foreground/10 focus-visible:ring-0 border-primary shadow-[0_0_30px_-10px_rgba(var(--primary),0.2)]" required />
                  </div>
                  <div className="space-y-2 relative group">
                     <Label className="text-[10px] font-black uppercase tracking-widest text-secondary absolute -top-2 left-6 bg-background px-2 z-10">Verify Backup</Label>
                     <Input type="password" value={confirmPassword} onChange={(e)=>setConfirmPassword(e.target.value)} className="h-20 text-3xl font-bold px-8 rounded-[40px] bg-foreground/5 border-2 border-foreground/10 focus-visible:ring-0 border-secondary shadow-[0_0_30px_-10px_rgba(var(--secondary),0.2)]" required />
                  </div>

                  {error && <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 font-bold text-sm text-center">{error}</div>}
                  
                  <div className="flex gap-4">
                    <Button type="button" variant="ghost" onClick={()=>{
                      if (faculty === FCDS_FACULTY_NAME) setStep(4)
                      else setStep(3)
                    }} className="h-14 px-8 rounded-full border border-foreground/10 font-bold"><ArrowLeft className="mr-2" /> Back</Button>
                    <Button disabled={loading} type="submit" className="flex-1 h-20 rounded-[40px] text-2xl font-black italic tracking-tighter bg-gradient-to-r from-primary to-secondary text-white hover:scale-[1.02] transition-all">
                       {loading ? <Loader2 className="animate-spin size-8" /> : "Initiate Launch"}
                    </Button>
                  </div>
               </form>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Persistent Status Labels */}
      <div className="absolute bottom-12 flex gap-12 text-[10px] font-black uppercase tracking-[0.2em] opacity-30">
        <div className="flex items-center gap-2 text-primary"><ShieldCheck className="size-3" /> Encrypted Transition</div>
        <div className="flex items-center gap-2"><Globe className="size-3" /> Global Edge Deployment</div>
      </div>
    </div>
  )
}
