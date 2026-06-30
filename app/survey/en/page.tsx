"use client"

import { useState, useCallback, memo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ChevronRight, ChevronLeft, Send, Loader2, Gift, ArrowLeft, Sparkles, Check } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"

import {
  type Question,
  ALL_STEPS_EN as ALL_STEPS,
  TOTAL,
  FORM_MAP,
  DEMO_COUNT
} from "./../questions"

type AnswerVal = string | string[] | number

/* ── Pill button — glassmorphism with animated check ──────────────────────── */
const Pill = memo(function Pill({ label, selected, accent, onClick }: {
  label: string; selected: boolean; accent: string; onClick: () => void
}) {
  return (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.03, y: -1 }}
      whileTap={{ scale: 0.97 }}
      className="relative px-5 py-3.5 rounded-2xl text-sm md:text-base font-medium transition-all duration-300 outline-none text-left overflow-hidden backdrop-blur-sm"
      style={{
        border: `1.5px solid ${selected ? accent : "hsl(var(--border) / 0.4)"}`,
        background: selected ? `${accent}12` : "hsl(var(--background) / 0.6)",
        color: selected ? accent : "hsl(var(--muted-foreground))",
        boxShadow: selected ? `0 4px 20px ${accent}20, inset 0 1px 0 ${accent}15` : "0 1px 3px hsl(var(--border) / 0.15)",
      }}
    >
      {selected && (
        <motion.div
          layoutId="pill-glow"
          className="absolute inset-0 rounded-2xl"
          style={{ background: `linear-gradient(135deg, ${accent}08, ${accent}05)` }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
        />
      )}
      <span className="relative z-10 flex items-center gap-2">
        {selected && (
          <motion.span
            initial={{ scale: 0, rotate: -90 }}
            animate={{ scale: 1, rotate: 0 }}
            className="inline-flex items-center justify-center size-4 rounded-full"
            style={{ background: accent }}
          >
            <Check className="size-2.5 text-white" strokeWidth={3} />
          </motion.span>
        )}
        {label}
      </span>
    </motion.button>
  )
})
/* ── Rating scale — creative interactive cubes with connecting track ──────── */
const RatingScale = memo(function RatingScale({ value, onChange, minLabel, maxLabel, accent, accent2 }: {
  value: number | null; onChange: (v: number) => void
  minLabel: string; maxLabel: string; accent: string; accent2: string
}) {
  return (
    <div>
      <div className="relative flex gap-2 sm:gap-3 mt-2">
        {/* Connecting track */}
        <div className="absolute top-1/2 left-4 right-4 h-[2px] -translate-y-1/2 bg-border/30 rounded-full" />
        {value && value > 1 && (
          <motion.div
            className="absolute top-1/2 left-4 h-[2px] -translate-y-1/2 rounded-full"
            style={{ background: `linear-gradient(90deg, ${accent}, ${accent2})` }}
            initial={false}
            animate={{ width: `${((value - 1) / 4) * (100 - 8)}%` }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
          />
        )}
        {[1, 2, 3, 4, 5].map((n) => {
          const isSelected = value === n
          const isFilled = value !== null && n <= value
          return (
            <motion.button
              key={n}
              onClick={() => onChange(n)}
              whileHover={{ scale: 1.1, y: -2 }}
              whileTap={{ scale: 0.9 }}
              className="relative z-10 flex-1 h-14 md:h-16 rounded-2xl font-black italic text-lg md:text-xl transition-all duration-200"
              style={
                isSelected
                  ? { background: `linear-gradient(135deg,${accent},${accent2})`, color: "#fff", boxShadow: `0 8px 30px ${accent}40` }
                  : isFilled
                    ? { background: `${accent}20`, border: `2px solid ${accent}40`, color: accent }
                    : { background: "hsl(var(--background) / 0.6)", border: "1.5px solid hsl(var(--border) / 0.4)", color: "hsl(var(--muted-foreground))", backdropFilter: "blur(8px)" }
              }
            >
              {n}
              {isSelected && (
                <motion.div
                  layoutId="rating-dot"
                  className="absolute -bottom-1 left-1/2 -translate-x-1/2 size-2 rounded-full"
                  style={{ background: accent2 }}
                />
              )}
            </motion.button>
          )
        })}
      </div>
      <div className="flex justify-between mt-3 text-[11px] text-muted-foreground/40 font-medium uppercase tracking-wider">
        <span>{minLabel}</span>
        <span>{maxLabel}</span>
      </div>
    </div>
  )
})

/* ── Progress bar — creative glowing version ────────────────────────────────── */
const ProgressBar = memo(function ProgressBar({ step, accent, accent2 }: { step: number; accent: string; accent2: string }) {
  const pct = (step / TOTAL) * 100
  return (
    <>
      <div className="fixed top-0 left-0 right-0 h-[3px] bg-muted/50 z-50 backdrop-blur-sm">
        <motion.div
          className="h-full rounded-r-full relative"
          initial={false}
          animate={{ width: `${pct}%` }}
          transition={{ type: "spring", stiffness: 200, damping: 25 }}
          style={{ background: `linear-gradient(90deg,${accent},${accent2})`, willChange: "width" }}
        >
          <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full" style={{ background: accent2, boxShadow: `0 0 12px ${accent2}88, 0 0 24px ${accent2}44` }} />
        </motion.div>
      </div>
      <div className="fixed top-4 right-6 z-50 flex items-center gap-2">
        <span className="text-[10px] font-bold text-muted-foreground/40 uppercase tracking-widest">{step}/{TOTAL}</span>
      </div>
      <div className="fixed top-4 left-6 z-50">
        <span className="rock-salt text-primary/25 text-[10px]">Morx</span>
      </div>
    </>
  )
})

/* ── Transition presets — blur + scale for drama ────────────────────────────── */
const SLIDE   = { initial: { opacity: 0, x: 80, filter: "blur(8px)" }, animate: { opacity: 1, x: 0, filter: "blur(0px)" }, exit: { opacity: 0, x: -60, filter: "blur(6px)" } }
const FADE_UP = { initial: { opacity: 0, y: 50, filter: "blur(12px)" }, animate: { opacity: 1, y: 0, filter: "blur(0px)" }, exit: { opacity: 0, y: -30, filter: "blur(8px)" } }
const DUR     = { duration: 0.5, ease: [0.16, 1, 0.3, 1] } as const

/* ═══════════════════════════════════════════════════════════════════════════════
   Main Survey Page — English
   ═══════════════════════════════════════════════════════════════════════════ */
export default function SurveyPage() {
  const [step, setStep] = useState(0)
  const [answers, setAnswers] = useState<Record<string, AnswerVal>>({})
  const [otherText, setOtherText] = useState("")
  const [submitting, setSubmitting] = useState(false)

  const q: Question | null = step >= 1 && step <= TOTAL ? ALL_STEPS[step - 1] : null
  const answer = q ? answers[q.id] : undefined

  const canProceed = !q
    || (q.type === "radio"       && typeof answer === "string" && answer.length > 0)
    || (q.type === "radio-other" && typeof answer === "string" && answer.length > 0 && (answer !== "Other" || otherText.trim().length > 0))
    || (q.type === "checkbox"    && Array.isArray(answer) && (answer as string[]).length > 0)
    || (q.type === "checkbox-other" && Array.isArray(answer) && (answer as string[]).length > 0 && (!(answer as string[]).includes("Other") || otherText.trim().length > 0))
    || (q.type === "textarea"    && !q.required)
    || (q.type === "textarea"    && q.required && typeof answer === "string" && (answer as string).trim().length >= 5)
    || (q.type === "text-input"  && !q.required)
    || (q.type === "text-input"  && q.required && typeof answer === "string" && (answer as string).trim().length > 0)
    || (q.type === "rating"      && typeof answer === "number")
    || (q.type === "text-compare" && q.subQuestions != null && q.subQuestions.every(sq => {
         const sqAnswer = answers[sq.id]
         return typeof sqAnswer === "string" && sqAnswer.length > 0
       }))
    || (q.type === "text-display")

  const setAnswer = useCallback((val: AnswerVal) => {
    if (!q) return
    setAnswers((prev) => ({ ...prev, [q.id]: val }))
  }, [q])

  const setSubAnswer = useCallback((subId: string, val: string) => {
    setAnswers((prev) => ({ ...prev, [subId]: val }))
  }, [])

  const handleNext = useCallback(async () => {
    if (q?.id === "demo-education" && answers["demo-education"] === "High School") {
      setAnswers((prev) => ({ ...prev, "demo-field": "Not specialized" }))
      setStep((s) => s + 2)
      return
    }

    if (step < TOTAL) { setStep((s) => s + 1); return }
    setSubmitting(true)
    try {
      const params = new URLSearchParams()
      for (const [qId, entryId] of Object.entries(FORM_MAP)) {
        const val = answers[qId]
        if (val === undefined || val === null || val === "") continue
        if (Array.isArray(val)) {
          for (const v of val) {
            const sendVal = (v === "Other" && otherText.trim()) ? otherText.trim() : v
            params.append(entryId, sendVal)
          }
        } else if (typeof val === "number") {
          params.append(entryId, String(val))
        } else {
          let finalVal = val as string
          if (qId === "demo-field" && val === "Other" && otherText.trim()) finalVal = otherText.trim()
          else if (qId === "demo-field" && val === "Not specialized") finalVal = ""
          params.append(entryId, finalVal)
        }
      }
      const res = await fetch("/api/survey/submit", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: params.toString(),
      })

      if (!res.ok) throw new Error("Submission failed")
      toast.success("✅ Response sent! Your answers have been recorded successfully.")
    } catch {
      toast.error("⚠️ Submission issue. Your answers may not have been recorded. Please try again.")
    }
    await new Promise((r) => setTimeout(r, 800))
    setSubmitting(false)
    setStep(TOTAL + 1)
  }, [step, answers, otherText])

  const handleBack = useCallback(() => {
    const q1Index = ALL_STEPS.findIndex(s => s.id === "q1") + 1
    if (step === q1Index && answers["demo-education"] === "High School") {
      setStep((s) => Math.max(s - 2, 0))
    } else {
      setStep((s) => Math.max(s - 1, 0))
    }
  }, [step, answers])

  const accent  = q?.accent  ?? "hsl(var(--primary))"
  const accent2 = q?.accent2 ?? "hsl(var(--secondary))"

  const stepDisplay = q
    ? q.section === "Tell Us About You"
      ? { label: q.section, counter: `${step} / ${DEMO_COUNT}` }
      : { label: q.section, counter: `${step - DEMO_COUNT} / ${TOTAL - DEMO_COUNT}` }
    : null

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-background">

      {/* Noise texture */}
      <div className="fixed inset-0 -z-5 opacity-[0.012] dark:opacity-[0.03] pointer-events-none"
        style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")" }} />

      {/* Gradient blobs with creative positioning */}
      <div aria-hidden className="pointer-events-none fixed rounded-full blur-[120px] opacity-[0.15] survey-blob-1"
        style={{ width: 600, height: 600, background: `radial-gradient(circle,${accent},transparent 70%)`, top: "-15%", right: "-8%", willChange: "transform" }} />
      <div aria-hidden className="pointer-events-none fixed rounded-full blur-[100px] opacity-[0.1] survey-blob-2"
        style={{ width: 500, height: 500, background: `radial-gradient(circle,${accent2},transparent 70%)`, bottom: "-10%", left: "-5%", willChange: "transform" }} />

      {/* Progress strip */}
      {step >= 1 && step <= TOTAL && <ProgressBar step={step} accent={accent} accent2={accent2} />}

      {/* ── Content ── */}
      <div className="relative z-10 min-h-screen flex flex-col justify-center px-6 md:px-16 lg:px-28 py-20">
        <AnimatePresence mode="wait" initial={false}>

          {/* ── INTRO ── */}
          {step === 0 && (
            <motion.div key="intro" {...FADE_UP} transition={DUR}>
              <div className="flex items-center gap-3 mb-8">
                <span className="rock-salt text-primary text-sm">Morx</span>
                <div className="w-px h-4 bg-border/40" />
                <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-muted-foreground/40">Research</span>
              </div>

              <h1 className="font-black italic tracking-tighter leading-[0.88] text-foreground mb-4" style={{ fontSize: "clamp(2.4rem,8vw,7rem)" }}>
                AI can write.<br />
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary via-secondary to-primary bg-[length:200%_100%] animate-[shimmer_3s_ease-in-out_infinite]">
                  But can it feel?
                </span>
              </h1>

              <p className="text-base md:text-lg text-muted-foreground/60 max-w-xl mb-4 leading-relaxed">
                Read, compare, and judge. Can you tell AI from human?
              </p>

              <motion.div
                className="h-[2px] rounded-full bg-gradient-to-r from-primary via-secondary to-transparent mb-10"
                initial={{ width: 0 }}
                animate={{ width: "35%" }}
                transition={{ delay: 0.4, duration: 1, ease: "easeOut" }}
              />

              <div className="mb-8 p-5 rounded-2xl bg-background/60 backdrop-blur-xl border border-border/30 flex items-center gap-4 max-w-xl shadow-lg">
                <Gift className="w-7 h-7 text-primary animate-bounce shrink-0" />
                <p className="text-sm md:text-base text-foreground/70 font-medium">
                  Complete the survey for a chance to win exclusive prizes 🎁
                </p>
              </div>

              <button
                onClick={() => setStep(1)}
                className="group inline-flex items-center gap-4 text-primary-foreground font-black italic text-xl md:text-2xl px-10 py-5 rounded-2xl bg-primary hover:bg-primary/90 transition-all duration-300 hover:scale-[1.04] hover:shadow-xl hover:shadow-primary/25 active:scale-95"
              >
                Begin Survey
                <ChevronRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
              </button>
            </motion.div>
          )}

          {/* ── QUESTION ── */}
          {step >= 1 && step <= TOTAL && q && (
            <motion.div key={`q${step}`} {...SLIDE} transition={DUR}>

              {/* Section header — creative with glowing dot */}
              <motion.div
                className="flex items-center gap-3 mb-6"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1, duration: 0.4 }}
              >
                <div className="size-2 rounded-full" style={{ background: q.accent, boxShadow: `0 0 8px ${q.accent}66` }} />
                <span className="text-[11px] font-bold tracking-[0.2em] uppercase" style={{ color: q.accent }}>
                  {stepDisplay?.label}
                </span>
                <div className="h-px flex-1 bg-gradient-to-r from-border/40 to-transparent" />
                <span className="text-[10px] text-muted-foreground/30 font-bold tabular-nums">{stepDisplay?.counter}</span>
              </motion.div>

              {/* ── Text Display ── */}
              {q.type === "text-display" && q.textContent && (
                <>
                  <motion.div
                    className="inline-flex items-center gap-2 mb-4"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.15 }}
                  >
                    <span
                      className="text-[10px] font-bold tracking-[0.2em] uppercase px-3 py-1.5 rounded-full backdrop-blur-sm"
                      style={{ background: `${q.accent}10`, color: q.accent, border: `1px solid ${q.accent}25` }}
                    >
                      {q.textLabel}
                    </span>
                  </motion.div>
                  <h2 className="font-black italic leading-[0.92] tracking-tighter text-foreground mb-6"
                    style={{ fontSize: "clamp(1.8rem,4vw,3.5rem)", whiteSpace: "pre-line" }}>
                    {q.label}
                  </h2>
                  {q.sub && <p className="text-sm md:text-base text-muted-foreground/60 mb-6">{q.sub}</p>}
                  <div className="p-6 md:p-8 rounded-3xl bg-background/50 backdrop-blur-xl border border-border/30 max-w-2xl relative overflow-hidden shadow-lg"
                    style={{ borderLeft: `3px solid ${q.accent}` }}>
                    <div className="absolute top-0 right-0 w-32 h-32 rounded-full blur-[60px] opacity-10" style={{ background: q.accent }} />
                    <p className="text-base md:text-lg text-foreground/70 leading-[1.9] relative z-10">
                      {q.textContent}
                    </p>
                  </div>
                </>
              )}

              {/* ── Text Compare ── */}
              {q.type === "text-compare" && q.subQuestions && (
                <>
                  <motion.div
                    className="inline-flex items-center gap-2 mb-4"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.15 }}
                  >
                    <span
                      className="text-[10px] font-bold tracking-[0.2em] uppercase px-3 py-1.5 rounded-full backdrop-blur-sm"
                      style={{ background: `${q.accent}10`, color: q.accent, border: `1px solid ${q.accent}25` }}
                    >
                      {q.textLabel}
                    </span>
                  </motion.div>
                  <h2 className="font-black italic leading-[0.92] tracking-tighter text-foreground mb-8"
                    style={{ fontSize: "clamp(1.8rem,4vw,3.5rem)", whiteSpace: "pre-line" }}>
                    {q.label}
                  </h2>
                  <div className="space-y-8 max-w-3xl">
                    {q.subQuestions.map((sq, idx) => {
                      const sqAnswer = answers[sq.id] as string | undefined
                      return (
                        <motion.div
                          key={sq.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.15 + idx * 0.08 }}
                          className="p-5 rounded-2xl bg-background/40 backdrop-blur-sm border border-border/20"
                        >
                          <p className="text-sm md:text-base text-muted-foreground/70 font-medium mb-4">
                            <span className="inline-flex items-center justify-center size-5 rounded-full text-[10px] font-bold mr-2" style={{ background: `${q.accent}15`, color: q.accent }}>{idx + 1}</span>
                            {sq.label}
                          </p>
                          <div className="flex flex-wrap gap-2.5">
                            {sq.options.map((opt) => (
                              <Pill key={opt} label={opt} selected={sqAnswer === opt} accent={q.accent}
                                onClick={() => setSubAnswer(sq.id, opt)} />
                            ))}
                          </div>
                        </motion.div>
                      )
                    })}
                  </div>
                </>
              )}

              {/* ── Standard questions ── */}
              {q.type !== "text-compare" && q.type !== "text-display" && (
                <>
                  <motion.h2
                    className="font-black italic leading-[0.92] tracking-tighter text-foreground mb-4"
                    style={{ fontSize: "clamp(2.2rem,5.5vw,5.5rem)", whiteSpace: "pre-line" }}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.05 }}
                  >
                    {q.label}
                  </motion.h2>
                  {q.sub && (
                    <motion.p
                      className="text-sm md:text-base text-muted-foreground/50 mb-10"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.15 }}
                    >{q.sub}</motion.p>
                  )}
                  {!q.sub && <div className="mb-10" />}

                  {/* Text Input — creative animated underline */}
                  {q.type === "text-input" && (
                    <motion.div className="max-w-md" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                      <div className="relative">
                        <input
                          type={q.inputType || "text"}
                          placeholder={q.placeholder}
                          value={(answer as string) || ""}
                          onChange={(e) => setAnswer(e.target.value)}
                          className="w-full bg-transparent text-foreground text-2xl md:text-3xl font-light placeholder-muted-foreground/20 outline-none pb-4 transition-colors duration-300"
                          style={{ caretColor: q.accent }}
                        />
                        <div className="h-[2px] bg-border/20 rounded-full" />
                        <motion.div
                          className="absolute bottom-0 left-0 h-[2px] rounded-full"
                          style={{ background: `linear-gradient(90deg, ${q.accent}, ${q.accent2})` }}
                          initial={false}
                          animate={{ width: (answer as string)?.trim() ? "100%" : "0%" }}
                          transition={{ duration: 0.4, ease: "easeOut" }}
                        />
                      </div>
                      {!q.required && (
                        <p className="text-[11px] text-muted-foreground/30 mt-3 flex items-center gap-1.5">
                          <span className="inline-block w-1 h-1 rounded-full bg-muted-foreground/15" />
                          Optional — skip if you prefer
                        </p>
                      )}
                    </motion.div>
                  )}

                  {/* Rating */}
                  {q.type === "rating" && (
                    <motion.div className="max-w-lg" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                      <RatingScale
                        value={(answer as number) ?? null}
                        onChange={setAnswer}
                        minLabel={q.minLabel ?? ""}
                        maxLabel={q.maxLabel ?? ""}
                        accent={q.accent} accent2={q.accent2} />
                    </motion.div>
                  )}

                  {/* Radio */}
                  {q.type === "radio" && q.options && (
                    <motion.div
                      className="flex flex-wrap gap-2.5 max-w-3xl"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.15 }}
                    >
                      {q.options.map((opt, i) => (
                        <motion.div key={opt} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 + i * 0.04 }}>
                          <Pill label={opt} selected={answer === opt} accent={q.accent}
                            onClick={() => setAnswer(opt)} />
                        </motion.div>
                      ))}
                    </motion.div>
                  )}

                  {/* Radio with Other */}
                  {q.type === "radio-other" && q.options && (
                    <div className="max-w-3xl">
                      <motion.div className="flex flex-wrap gap-2.5" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }}>
                        {q.options.map((opt, i) => (
                          <motion.div key={opt} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 + i * 0.04 }}>
                            <Pill label={opt} selected={answer === opt} accent={q.accent}
                              onClick={() => { setAnswer(opt); if (opt !== "Other") setOtherText("") }} />
                          </motion.div>
                        ))}
                      </motion.div>
                      {answer === "Other" && (
                        <motion.div initial={{ opacity: 0, y: 10, filter: "blur(4px)" }} animate={{ opacity: 1, y: 0, filter: "blur(0px)" }} transition={{ duration: 0.3 }}>
                          <div className="relative mt-5 max-w-md">
                            <input
                              type="text" placeholder="Please specify your field…" value={otherText}
                              onChange={(e) => setOtherText(e.target.value)} autoFocus
                              className="w-full bg-transparent text-foreground text-lg font-light placeholder-muted-foreground/20 outline-none pb-3"
                              style={{ caretColor: q.accent }}
                            />
                            <div className="h-[2px] bg-border/20 rounded-full" />
                            <motion.div className="absolute bottom-0 left-0 h-[2px] rounded-full" style={{ background: q.accent }}
                              initial={false} animate={{ width: otherText.trim() ? "100%" : "0%" }} transition={{ duration: 0.4 }} />
                          </div>
                        </motion.div>
                      )}
                    </div>
                  )}

                  {/* Checkbox */}
                  {q.type === "checkbox" && q.options && (
                    <motion.div className="flex flex-wrap gap-2.5 max-w-3xl" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }}>
                      {q.options.map((opt, i) => {
                        const checked = Array.isArray(answer) && (answer as string[]).includes(opt)
                        return (
                          <motion.div key={opt} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 + i * 0.04 }}>
                            <Pill label={opt} selected={checked} accent={q.accent}
                              onClick={() => {
                                const prev = (answer as string[]) || []
                                setAnswer(checked ? prev.filter((v) => v !== opt) : [...prev, opt])
                              }} />
                          </motion.div>
                        )
                      })}
                    </motion.div>
                  )}

                  {/* Checkbox with Other */}
                  {q.type === "checkbox-other" && q.options && (
                    <div className="max-w-3xl">
                      <motion.div className="flex flex-wrap gap-2.5" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }}>
                        {q.options.map((opt, i) => {
                          const checked = Array.isArray(answer) && (answer as string[]).includes(opt)
                          return (
                            <motion.div key={opt} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 + i * 0.04 }}>
                              <Pill label={opt} selected={checked} accent={q.accent}
                                onClick={() => {
                                  const prev = (answer as string[]) || []
                                  const next = checked ? prev.filter((v) => v !== opt) : [...prev, opt]
                                  setAnswer(next)
                                  if (opt === "Other" && checked) setOtherText("")
                                }} />
                            </motion.div>
                          )
                        })}
                      </motion.div>
                      {Array.isArray(answer) && (answer as string[]).includes("Other") && (
                        <motion.div initial={{ opacity: 0, y: 10, filter: "blur(4px)" }} animate={{ opacity: 1, y: 0, filter: "blur(0px)" }} transition={{ duration: 0.3 }}>
                          <div className="relative mt-5 max-w-md">
                            <input
                              type="text" placeholder="Please specify…" value={otherText}
                              onChange={(e) => setOtherText(e.target.value)} autoFocus
                              className="w-full bg-transparent text-foreground text-lg font-light placeholder-muted-foreground/20 outline-none pb-3"
                              style={{ caretColor: q.accent }}
                            />
                            <div className="h-[2px] bg-border/20 rounded-full" />
                            <motion.div className="absolute bottom-0 left-0 h-[2px] rounded-full" style={{ background: q.accent }}
                              initial={false} animate={{ width: otherText.trim() ? "100%" : "0%" }} transition={{ duration: 0.4 }} />
                          </div>
                        </motion.div>
                      )}
                    </div>
                  )}

                  {/* Textarea — creative expanding */}
                  {q.type === "textarea" && (
                    <motion.div className="max-w-2xl" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                      <div className="relative">
                        <textarea
                          rows={5}
                          value={(answer as string) || ""}
                          onChange={(e) => setAnswer(e.target.value)}
                          placeholder={q.placeholder}
                          className="w-full bg-background/30 backdrop-blur-sm text-foreground text-lg md:text-xl font-light placeholder-muted-foreground/20 resize-none outline-none rounded-2xl p-5 border border-border/20 transition-all duration-300 focus:border-transparent"
                          style={{ caretColor: q.accent, boxShadow: (answer as string)?.trim() ? `0 0 0 1.5px ${q.accent}40, 0 4px 20px ${q.accent}10` : "none" }}
                        />
                      </div>
                      <div className="flex items-center justify-between mt-2">
                        {q.required ? (
                          <p className="text-[11px] text-muted-foreground/30">
                            {((answer as string) || "").trim().length} chars
                            {((answer as string) || "").trim().length < 5 && <span style={{ color: q.accent }}> · min 5</span>}
                          </p>
                        ) : (
                          <p className="text-[11px] text-muted-foreground/25">Optional</p>
                        )}
                        {(answer as string)?.trim() && (
                          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="size-1.5 rounded-full" style={{ background: q.accent }} />
                        )}
                      </div>
                    </motion.div>
                  )}
                </>
              )}

              {/* ── Nav — creative glassmorphism ── */}
              <motion.div
                className="flex items-center gap-4 mt-14"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <button
                  onClick={handleBack}
                  className="flex items-center gap-2 text-muted-foreground/30 hover:text-muted-foreground/60 transition-all duration-300 text-sm font-medium hover:-translate-x-0.5"
                >
                  <ChevronLeft className="w-3.5 h-3.5" /> Back
                </button>

                <motion.button
                  onClick={canProceed && !submitting ? handleNext : undefined}
                  disabled={!canProceed || submitting}
                  whileHover={canProceed && !submitting ? { scale: 1.04, y: -1 } : {}}
                  whileTap={canProceed && !submitting ? { scale: 0.97 } : {}}
                  className="flex items-center gap-3 font-black italic text-base md:text-lg px-8 py-4 rounded-2xl transition-all duration-300 disabled:cursor-not-allowed"
                  style={
                    canProceed && !submitting
                      ? { background: q.accent, color: "#fff", boxShadow: `0 8px 30px ${q.accent}30` }
                      : { background: "hsl(var(--background) / 0.6)", color: "hsl(var(--muted-foreground) / 0.3)", border: "1.5px solid hsl(var(--border) / 0.3)", backdropFilter: "blur(8px)" }
                  }
                >
                  {submitting
                    ? <><Loader2 className="w-5 h-5 animate-spin" /> Submitting…</>
                    : step === TOTAL
                    ? <><Send className="w-4 h-4" /> Submit</>
                    : <>Continue <ChevronRight className="w-4 h-4" /></>}
                </motion.button>
              </motion.div>
            </motion.div>
          )}

          {/* ── DONE ── */}
          {step === TOTAL + 1 && (
            <motion.div key="done" {...FADE_UP} transition={DUR} className="text-center flex flex-col items-center">
              {/* Animated checkmark ring */}
              <motion.div
                initial={{ scale: 0, rotate: -90 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ delay: 0.1, type: "spring", stiffness: 150, damping: 15 }}
                className="relative mb-8"
              >
                <div className="size-24 rounded-full bg-primary/10 flex items-center justify-center">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.4, type: "spring", stiffness: 200 }}
                  >
                    <Check className="size-12 text-primary" strokeWidth={3} />
                  </motion.div>
                </div>
                <Sparkles className="absolute -top-1 -right-1 size-6 text-secondary animate-pulse" />
                <Sparkles className="absolute -bottom-1 -left-2 size-4 text-primary/60 animate-pulse" style={{ animationDelay: "0.5s" }} />
              </motion.div>

              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="rock-salt text-primary/30 text-xs mb-4"
              >Morx</motion.p>

              <h2 className="font-black italic leading-[0.88] tracking-tighter text-foreground mb-6"
                style={{ fontSize: "clamp(2.5rem,8vw,7rem)" }}>
                That meant{" "}
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary via-secondary to-primary bg-[length:200%_100%] animate-[shimmer_3s_ease-in-out_infinite]">
                  everything.
                </span>
              </h2>

              <p className="text-lg md:text-xl text-muted-foreground/60 max-w-lg mb-4 leading-relaxed">
                Your perspective helps us understand how people truly perceive AI writing.
              </p>
              <p className="text-sm text-muted-foreground/30 max-w-lg mb-14">
                All responses are anonymous • Powered by Morx
              </p>

              <Link href="/"
                className="group inline-flex items-center gap-3 font-bold text-sm px-8 py-4 rounded-2xl text-muted-foreground hover:text-foreground bg-background/60 backdrop-blur-xl border border-border/30 hover:border-primary/30 transition-all duration-300 hover:scale-[1.03] hover:shadow-lg">
                <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Back to Morx
              </Link>
            </motion.div>
          )}

        </AnimatePresence>
      </div>

      {/* Creative CSS */}
      <style>{`
        @keyframes blobDrift1{0%,100%{transform:translate(0,0) scale(1)}40%{transform:translate(-25px,18px) scale(1.04)}70%{transform:translate(15px,-12px) scale(0.97)}}
        @keyframes blobDrift2{0%,100%{transform:translate(0,0) scale(1)}35%{transform:translate(22px,-18px) scale(1.03)}65%{transform:translate(-12px,22px) scale(0.97)}}
        .survey-blob-1{animation:blobDrift1 14s ease-in-out infinite}
        .survey-blob-2{animation:blobDrift2 17s ease-in-out infinite}
        @keyframes shimmer{0%{background-position:200% 0}50%{background-position:0% 0}100%{background-position:200% 0}}
      `}
      </style>
    </div>
  )
}


