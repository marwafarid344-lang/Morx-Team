"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { motion, AnimatePresence, useMotionValue, useSpring } from "framer-motion"
import { ArrowRight, ArrowLeft, Globe, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"

/* ═══════════════════════════════════════════════════════════════════════════════
   Survey Intro — /survey
   Immersive, creative intro with animated mesh, floating orbs, typing effects
   ═══════════════════════════════════════════════════════════════════════════ */

/* ── Typing effect hook ──────────────────────────────────────────────────── */
function useTyping(text: string, speed = 45, delay = 600) {
  const [displayed, setDisplayed] = useState("")
  const [done, setDone] = useState(false)
  useEffect(() => {
    setDisplayed(""); setDone(false)
    const timeout = setTimeout(() => {
      let i = 0
      const interval = setInterval(() => {
        setDisplayed(text.slice(0, i + 1))
        i++
        if (i >= text.length) { clearInterval(interval); setDone(true) }
      }, speed)
      return () => clearInterval(interval)
    }, delay)
    return () => clearTimeout(timeout)
  }, [text, speed, delay])
  return { displayed, done }
}

/* ── Floating orb component ──────────────────────────────────────────────── */
function FloatingOrb({ size, color, x, y, duration, blur }: {
  size: number; color: string; x: string; y: string; duration: number; blur: number
}) {
  return (
    <div
      className="orb-float pointer-events-none fixed rounded-full"
      style={{
        width: size, height: size,
        background: `radial-gradient(circle at 30% 30%, ${color}, transparent 70%)`,
        left: x, top: y,
        filter: `blur(${blur}px)`,
        animationDuration: `${duration}s`,
      }}
    />
  )
}

/* ── Step data ───────────────────────────────────────────────────────────── */
const STEPS = [
  { id: "hero", title: "AI can write.\nBut can it feel?", subtitle: "A research survey to explore the invisible line between artificial and human expression." },
  { id: "why", title: "We need\nyour eyes.", subtitle: "You'll read, compare, and judge two writing styles — one human, one machine. Can you tell the difference?" },
  { id: "details", title: "22 questions.\n5 minutes.\nZero judgment.", subtitle: "Four sections. From your background to your raw opinions. Every answer is anonymous." },
  { id: "privacy", title: "Your words\nstay yours.", subtitle: "No names. No tracking. No data sold. Just honest research, powered by Morx." },
  { id: "lang", title: "", subtitle: "" },
]

/* ═══════════════════════════════════════════════════════════════════════════ */

export default function SurveyIntro() {
  const [step, setStep] = useState(0)
  const [mounted, setMounted] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)
  const springX = useSpring(mouseX, { stiffness: 50, damping: 20 })
  const springY = useSpring(mouseY, { stiffness: 50, damping: 20 })

  useEffect(() => { setMounted(true) }, [])

  useEffect(() => {
    const handleMouse = (e: MouseEvent) => {
      mouseX.set((e.clientX / window.innerWidth - 0.5) * 30)
      mouseY.set((e.clientY / window.innerHeight - 0.5) * 30)
    }
    window.addEventListener("mousemove", handleMouse)
    return () => window.removeEventListener("mousemove", handleMouse)
  }, [mouseX, mouseY])

  const current = STEPS[step]
  const { displayed: typedTitle, done: titleDone } = useTyping(current.title, 35, 200)
  const { displayed: typedSub } = useTyping(current.subtitle, 18, current.title.length * 35 + 500)

  const isLast = step === STEPS.length - 1

  const goTo = (i: number) => { if (i >= 0 && i < STEPS.length) setStep(i) }

  if (!mounted) return null

  return (
    <div ref={containerRef} className="relative min-h-dvh flex flex-col items-center justify-center overflow-hidden bg-background selection:bg-primary/20">

      {/* ── Animated mesh background ── */}
      <div className="fixed inset-0 -z-20 overflow-hidden">
        <div className="mesh-gradient" />
      </div>

      {/* ── Noise texture overlay ── */}
      <div className="fixed inset-0 -z-10 opacity-[0.015] dark:opacity-[0.04]"
        style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E\")" }} />

      {/* ── Floating orbs ── */}
      <FloatingOrb size={400} color="hsl(var(--primary) / 0.12)" x="-5%" y="10%" duration={18} blur={80} />
      <FloatingOrb size={300} color="hsl(var(--secondary) / 0.1)" x="75%" y="60%" duration={22} blur={60} />
      <FloatingOrb size={250} color="hsl(var(--primary) / 0.08)" x="60%" y="-10%" duration={15} blur={90} />
      <FloatingOrb size={180} color="hsl(var(--secondary) / 0.06)" x="20%" y="70%" duration={20} blur={50} />

      {/* ── Morx watermark ── */}
      <motion.div
        className="fixed top-5 right-6 z-50"
        style={{ x: springX, y: springY }}
      >
        <span className="rock-salt text-primary/30 text-[10px] tracking-wider">Morx</span>
      </motion.div>

      {/* ── Progress ring ── */}
      <div className="fixed top-6 left-6 z-50">
        <svg width="36" height="36" viewBox="0 0 36 36" className="rotate-[-90deg]">
          <circle cx="18" cy="18" r="15" fill="none" stroke="hsl(var(--border))" strokeWidth="2" opacity="0.3" />
          <motion.circle
            cx="18" cy="18" r="15" fill="none"
            stroke="hsl(var(--primary))"
            strokeWidth="2"
            strokeLinecap="round"
            strokeDasharray={2 * Math.PI * 15}
            initial={false}
            animate={{ strokeDashoffset: 2 * Math.PI * 15 * (1 - (step + 1) / STEPS.length) }}
            transition={{ type: "spring", stiffness: 100, damping: 20 }}
          />
        </svg>
        <span className="absolute inset-0 flex items-center justify-center text-[9px] font-bold text-muted-foreground/60">
          {step + 1}/{STEPS.length}
        </span>
      </div>

      {/* ═════════ Content ═════════ */}
      <div className="relative z-10 w-full max-w-5xl mx-auto px-6 sm:px-12">
        <AnimatePresence mode="wait">

          {/* ── Text slides (0–3) ── */}
          {!isLast && (
            <motion.div
              key={step}
              initial={{ opacity: 0, y: 60, filter: "blur(12px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              exit={{ opacity: 0, y: -40, filter: "blur(8px)" }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              className="flex flex-col items-start min-h-[60vh] justify-center"
            >
              {/* Title with typing effect */}
              <h1
                className="font-black italic tracking-tighter leading-[0.88] text-foreground mb-6 relative"
                style={{ fontSize: "clamp(2.8rem, 8vw, 7.5rem)" }}
              >
                {typedTitle.split("\n").map((line, i) => (
                  <span key={i}>
                    {i > 0 && <br />}
                    {line}
                  </span>
                ))}
                {!titleDone && (
                  <span className="inline-block w-[3px] h-[0.85em] bg-primary ml-1 animate-pulse rounded-full align-baseline" />
                )}
              </h1>

              {/* Subtitle */}
              <p className="text-muted-foreground text-lg sm:text-xl max-w-2xl leading-relaxed min-h-[3em]">
                {typedSub}
              </p>

              {/* Decorative accent line */}
              <motion.div
                className="mt-10 h-[2px] rounded-full bg-gradient-to-r from-primary via-secondary to-transparent"
                initial={{ width: 0 }}
                animate={{ width: "40%" }}
                transition={{ delay: 0.8, duration: 1.2, ease: "easeOut" }}
              />
            </motion.div>
          )}

          {/* ── Language selection (last slide) ── */}
          {isLast && (
            <motion.div
              key="lang"
              initial={{ opacity: 0, scale: 0.9, filter: "blur(20px)" }}
              animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
              exit={{ opacity: 0, scale: 0.95, filter: "blur(10px)" }}
              transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
              className="flex flex-col items-center justify-center min-h-[70vh] text-center"
            >
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ delay: 0.2, duration: 0.8, type: "spring", stiffness: 150 }}
                className="mb-8"
              >
                <div className="relative">
                  <div className="size-20 rounded-3xl bg-primary/10 backdrop-blur-sm flex items-center justify-center border border-primary/20 rotate-12">
                    <Globe className="size-10 text-primary -rotate-12" />
                  </div>
                  <Sparkles className="absolute -top-2 -right-2 size-5 text-secondary animate-pulse" />
                </div>
              </motion.div>

              <h2 className="text-3xl sm:text-4xl md:text-5xl font-black italic tracking-tighter text-foreground mb-2">
                Pick Your Vibe
              </h2>
              <p className="text-muted-foreground/50 text-sm mb-12">same survey, your language</p>

              <div className="flex flex-col sm:flex-row items-center gap-6 w-full max-w-md">
                {/* Arabic */}
                <Link href="/survey/ar" className="group relative flex-1 w-full">
                  <div className="lang-card relative overflow-hidden rounded-3xl border border-border/40 bg-background/60 backdrop-blur-xl p-8 transition-all duration-500 group-hover:border-primary/40 group-hover:shadow-2xl group-hover:shadow-primary/10 group-hover:-translate-y-2">
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    <div className="relative z-10">
                      <div className="text-4xl font-black italic text-primary mb-2 group-hover:scale-110 transition-transform duration-300">ع</div>
                      <h3 className="text-xl font-black italic tracking-tighter text-foreground mb-1">عربي</h3>
                      <p className="text-muted-foreground/40 text-xs">المصرية العامية</p>
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-primary to-secondary scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left rounded-b-3xl" />
                  </div>
                </Link>

                {/* Divider */}
                <div className="hidden sm:flex flex-col items-center gap-2 text-muted-foreground/20">
                  <div className="w-px h-8 bg-border" />
                  <span className="text-[10px] font-bold uppercase tracking-widest">or</span>
                  <div className="w-px h-8 bg-border" />
                </div>
                <div className="sm:hidden flex items-center gap-3 text-muted-foreground/20 w-full max-w-[200px]">
                  <div className="h-px flex-1 bg-border" />
                  <span className="text-[10px] font-bold uppercase tracking-widest">or</span>
                  <div className="h-px flex-1 bg-border" />
                </div>

                {/* English */}
                <Link href="/survey/en" className="group relative flex-1 w-full">
                  <div className="lang-card relative overflow-hidden rounded-3xl border border-border/40 bg-background/60 backdrop-blur-xl p-8 transition-all duration-500 group-hover:border-secondary/40 group-hover:shadow-2xl group-hover:shadow-secondary/10 group-hover:-translate-y-2">
                    <div className="absolute inset-0 bg-gradient-to-br from-secondary/5 via-transparent to-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    <div className="relative z-10">
                      <div className="text-4xl mb-2 group-hover:scale-110 transition-transform duration-300">
                        <Globe className="size-9 text-secondary inline" />
                      </div>
                      <h3 className="text-xl font-black italic tracking-tighter text-foreground mb-1">English</h3>
                      <p className="text-muted-foreground/40 text-xs">English Version</p>
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-secondary to-primary scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-right rounded-b-3xl" />
                  </div>
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Navigation ── */}
      {!isLast && (
        <div className="fixed bottom-8 inset-x-0 z-40 flex items-center justify-center gap-3">
          {step > 0 && (
            <Button
              onClick={() => goTo(step - 1)}
              variant="ghost"
              size="icon"
              className="rounded-full w-12 h-12 backdrop-blur-sm bg-background/40 border border-border/30 hover:bg-background/60"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
          )}
          <Button
            onClick={() => goTo(step + 1)}
            className="rounded-full h-12 px-8 font-bold text-base backdrop-blur-sm shadow-lg shadow-primary/20"
          >
            Next <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      )}

      {/* Skip */}
      {!isLast && (
        <button
          onClick={() => goTo(STEPS.length - 1)}
          className="fixed bottom-8 left-6 z-40 text-muted-foreground/20 hover:text-muted-foreground/50 text-[11px] transition-colors duration-300 font-medium"
        >
          skip →
        </button>
      )}

      {/* Back on lang slide */}
      {isLast && (
        <button
          onClick={() => goTo(step - 1)}
          className="fixed bottom-8 left-1/2 -translate-x-1/2 z-40 text-muted-foreground/30 hover:text-muted-foreground/60 text-xs transition-colors duration-300 flex items-center gap-1.5"
        >
          <ArrowLeft className="w-3 h-3" /> go back
        </button>
      )}

      {/* ── Styles ── */}
      <style>{`
        .mesh-gradient {
          position: absolute;
          inset: -50%;
          width: 200%;
          height: 200%;
          background:
            radial-gradient(ellipse at 20% 50%, hsl(var(--primary) / 0.06) 0%, transparent 50%),
            radial-gradient(ellipse at 80% 20%, hsl(var(--secondary) / 0.05) 0%, transparent 50%),
            radial-gradient(ellipse at 50% 80%, hsl(var(--primary) / 0.04) 0%, transparent 50%);
          animation: meshMove 25s ease-in-out infinite alternate;
        }
        @keyframes meshMove {
          0% { transform: translate(0%, 0%) rotate(0deg) }
          33% { transform: translate(-3%, 2%) rotate(1deg) }
          66% { transform: translate(2%, -2%) rotate(-1deg) }
          100% { transform: translate(-1%, 1%) rotate(0.5deg) }
        }
        @keyframes orbFloat {
          0%, 100% { transform: translate(0, 0) scale(1) }
          25% { transform: translate(20px, -30px) scale(1.05) }
          50% { transform: translate(-15px, 15px) scale(0.95) }
          75% { transform: translate(25px, 10px) scale(1.02) }
        }
        .orb-float {
          animation: orbFloat var(--duration, 18s) ease-in-out infinite;
          will-change: transform;
        }
      `}</style>
    </div>
  )
}
