"use client"

import { useCallback, useState, useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"

export interface TutorialStep {
  id: number
  title: string
  description: string
  targetSelector: string
  page: string
  position: "top" | "bottom" | "left" | "right"
}

// Tutorial steps configuration
export const TUTORIAL_STEPS: TutorialStep[] = [
  {
    id: 1,
    title: "Welcome to Morx!",
    description: "Let's start by exploring the Teams feature. Click the Teams tab in the navigation to see your teams and create new ones.",
    targetSelector: "[data-tutorial='teams-nav'], [data-tutorial='teams-nav-mobile']",
    page: "/",
    position: "bottom"
  },
  {
    id: 2,
    title: "Create Your First Team",
    description: "This is where you can create a new team. Teams help you collaborate with others on projects and tasks.",
    targetSelector: "[data-tutorial='create-team-btn']",
    page: "/teams",
    position: "bottom"
  },
  {
    id: 3,
    title: "Browse Public Teams",
    description: "Explore public teams created by other users. You can request to join teams that match your interests.",
    targetSelector: "[data-tutorial='browse-teams']",
    page: "/teams/browse",
    position: "bottom"
  },
  {
    id: 4,
    title: "Talent Marketplace",
    description: "Find talented people for your team or showcase your skills to get discovered by team owners.",
    targetSelector: "[data-tutorial='talent-grid']",
    page: "/talent",
    position: "bottom"
  },
  {
    id: 5,
    title: "Your Settings",
    description: "This is where you manage all your account settings. Let's explore the different tabs.",
    targetSelector: "[data-tutorial='settings-tabs']",
    page: "/settings",
    position: "bottom"
  },
  {
    id: 6,
    title: "Profile Settings",
    description: "Update your personal information, change your password, and manage security settings here.",
    targetSelector: "[data-tutorial='profile-tab']",
    page: "/settings",
    position: "bottom"
  },
  {
    id: 7,
    title: "Your Plan",
    description: "View your subscription details, usage statistics, and plan limits.",
    targetSelector: "[data-tutorial='plan-tab']",
    page: "/settings",
    position: "bottom"
  },
  {
    id: 8,
    title: "Themes & Appearance",
    description: "Customize how Morx looks! Choose between light/dark mode and pick your favorite color theme.",
    targetSelector: "[data-tutorial='appearance-tab']",
    page: "/settings",
    position: "bottom"
  },
  {
    id: 9,
    title: "Professional Profile",
    description: "Showcase your skills and make yourself discoverable in the talent marketplace. This is the final step!",
    targetSelector: "[data-tutorial='professional-tab']",
    page: "/settings",
    position: "bottom"
  }
]

export function useTutorial() {
  const router = useRouter()
  const pathname = usePathname()
  const { user, setUser } = useAuth()
  
  const [isActive, setIsActive] = useState(false)
  const [currentStepIndex, setCurrentStepIndex] = useState(0)
  const [hasCheckedUser, setHasCheckedUser] = useState(false)
  
  const currentStep = TUTORIAL_STEPS[currentStepIndex]
  const isLastStep = currentStepIndex === TUTORIAL_STEPS.length - 1
  const totalSteps = TUTORIAL_STEPS.length
  // Removed isNavigating - users click manually, no loading needed
  const isNavigating = false
  
  // Check if tutorial should be shown - start immediately after login on any page
  useEffect(() => {
    if (user && !hasCheckedUser) {
      setHasCheckedUser(true)
      
      // Start for users who haven't completed the tutorial
      if (user.skip_tutorial !== true) {
        // Start tutorial immediately and redirect to first step
        setIsActive(true)
        if (pathname !== TUTORIAL_STEPS[0].page) {
          router.push(TUTORIAL_STEPS[0].page)
        }
      }
    }
  }, [user, hasCheckedUser, pathname, router])

  // Navigate to correct page when step changes (user clicked Next)
  useEffect(() => {
    if (isActive && currentStep && pathname !== currentStep.page) {
      router.push(currentStep.page)
    }
  }, [isActive, currentStepIndex]) // Only trigger on step index change

  const nextStep = useCallback(() => {
    if (currentStepIndex < TUTORIAL_STEPS.length - 1) {
      setCurrentStepIndex(prev => prev + 1)
    } else {
      // Tutorial complete
      completeTutorial()
    }
  }, [currentStepIndex])

  const prevStep = useCallback(() => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(prev => prev - 1)
    }
  }, [currentStepIndex])

  const skipTutorial = useCallback(async () => {
    setIsActive(false)
    setCurrentStepIndex(0)
    
    try {
      // Call API to update skip_tutorial
      const res = await fetch('/api/users/skip-tutorial', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ auth_user_id: user?.auth_user_id })
      })
      
      if (res.ok) {
        // Update local user state
        if (user) {
          setUser({ ...user, skip_tutorial: true })
        }
      }
    } catch (error) {
      console.error('Error skipping tutorial:', error)
    }
  }, [user, setUser])

  const completeTutorial = useCallback(async () => {
    await skipTutorial() // Uses same logic - sets skip_tutorial to true
  }, [skipTutorial])

  const startTutorial = useCallback(() => {
    setCurrentStepIndex(0)
    setIsActive(true)
    if (pathname !== TUTORIAL_STEPS[0].page) {
      router.push(TUTORIAL_STEPS[0].page)
    }
  }, [pathname, router])

  return {
    isActive,
    currentStep,
    currentStepIndex,
    totalSteps,
    isLastStep,
    isNavigating, // Always false now - no loading state
    nextStep,
    prevStep,
    skipTutorial,
    startTutorial,
    completeTutorial
  }
}
