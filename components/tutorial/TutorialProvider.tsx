"use client"

import { createContext, useContext, type ReactNode } from "react"
import { useTutorial } from "@/hooks/use-tutorial"
import type { TutorialStep } from "@/hooks/use-tutorial"

interface TutorialContextType {
  isActive: boolean
  currentStep: TutorialStep | undefined
  currentStepIndex: number
  totalSteps: number
  isLastStep: boolean
  isNavigating: boolean
  nextStep: () => void
  prevStep: () => void
  skipTutorial: () => Promise<void>
  startTutorial: () => void
  completeTutorial: () => Promise<void>
}

const TutorialContext = createContext<TutorialContextType | undefined>(undefined)

export function TutorialProvider({ children }: { children: ReactNode }) {
  const tutorial = useTutorial()

  return (
    <TutorialContext.Provider value={tutorial}>
      {children}
    </TutorialContext.Provider>
  )
}

export function useTutorialContext() {
  const context = useContext(TutorialContext)
  if (!context) {
    throw new Error("useTutorialContext must be used within TutorialProvider")
  }
  return context
}
