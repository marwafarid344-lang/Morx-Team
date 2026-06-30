"use client"

import { useEffect, useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { X, ChevronRight, ChevronLeft, Sparkles, SkipForward } from "lucide-react"
import { useTutorialContext } from "./TutorialProvider"

export function TutorialOverlay() {
  const {
    isActive,
    currentStep,
    currentStepIndex,
    totalSteps,
    isLastStep,
    nextStep,
    prevStep,
    skipTutorial
  } = useTutorialContext()

  const [targetRect, setTargetRect] = useState<DOMRect | null>(null)
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 })
  const overlayRef = useRef<HTMLDivElement>(null)

  // Find and highlight the target element
  useEffect(() => {
    if (!isActive || !currentStep) {
      setTargetRect(null)
      return
    }

    const findTarget = () => {
      const target = document.querySelector(currentStep.targetSelector)
      if (target) {
        // Special handling for steps 3 and 4 (Browse Teams and Marketplace)
        // Scroll to 40% of page height instead of centering on element
        if (currentStepIndex === 2 || currentStepIndex === 3) {
          const scrollTarget = document.documentElement.scrollHeight * 0.4 - window.innerHeight * 0.4
          window.scrollTo({ top: Math.max(0, scrollTarget), behavior: 'smooth' })
        } else {
          // Normal scroll to center the element
          target.scrollIntoView({ behavior: 'smooth', block: 'center' })
        }
        
        // Wait a bit for scroll to complete, then get position
        setTimeout(() => {
          const rect = target.getBoundingClientRect()
          setTargetRect(rect)
          
          // Calculate tooltip position - responsive for mobile
          const isMobile = window.innerWidth < 640
          const tooltipWidth = isMobile ? Math.min(340, window.innerWidth - 32) : 380
          const tooltipHeight = 220
          const padding = isMobile ? 16 : 20
          
          let top = 0
          let left = 0

          // On mobile, always position below the target and center horizontally
          if (isMobile) {
            top = rect.bottom + padding
            left = (window.innerWidth - tooltipWidth) / 2
            
            // If tooltip would go below viewport, position above
            if (top + tooltipHeight > window.innerHeight - padding) {
              top = rect.top - tooltipHeight - padding
            }
          } else {
            // Desktop positioning based on step preference
            switch (currentStep.position) {
              case "bottom":
                top = rect.bottom + padding
                left = rect.left + rect.width / 2 - tooltipWidth / 2
                break
              case "top":
                top = rect.top - tooltipHeight - padding
                left = rect.left + rect.width / 2 - tooltipWidth / 2
                break
              case "left":
                top = rect.top + rect.height / 2 - tooltipHeight / 2
                left = rect.left - tooltipWidth - padding
                break
              case "right":
                top = rect.top + rect.height / 2 - tooltipHeight / 2
                left = rect.right + padding
                break
            }
          }

          // Keep tooltip within viewport
          left = Math.max(padding, Math.min(left, window.innerWidth - tooltipWidth - padding))
          top = Math.max(padding, Math.min(top, window.innerHeight - tooltipHeight - padding))

          setTooltipPosition({ top, left })
        }, 300)
      } else {
        setTargetRect(null)
      }
    }

    // Initial find with delay for page to render
    const timer = setTimeout(findTarget, 200)
    
    // Keep looking until found
    const interval = setInterval(() => {
      const target = document.querySelector(currentStep.targetSelector)
      if (target && !targetRect) {
        findTarget()
      }
    }, 500)
    
    // Re-find on scroll (to update position)
    const handleScroll = () => {
      const target = document.querySelector(currentStep.targetSelector)
      if (target) {
        const rect = target.getBoundingClientRect()
        setTargetRect(rect)
      }
    }
    
    window.addEventListener("scroll", handleScroll)

    return () => {
      clearTimeout(timer)
      clearInterval(interval)
      window.removeEventListener("scroll", handleScroll)
    }
  }, [isActive, currentStep, currentStepIndex])

  if (!isActive || !currentStep) {
    return null
  }

  return (
    <div 
      ref={overlayRef}
      className="fixed inset-0 z-[9999]"
    >
      {/* Blur overlay with cutout for spotlight using SVG */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ filter: 'url(#blur-filter)' }}>
        <defs>
          <filter id="blur-filter">
            <feGaussianBlur stdDeviation="4" />
          </filter>
          <mask id="spotlight-mask">
            <rect x="0" y="0" width="100%" height="100%" fill="white" />
            {targetRect && (
              <rect 
                x={targetRect.left - 16}
                y={targetRect.top - 16}
                width={targetRect.width + 32}
                height={targetRect.height + 32}
                rx="16"
                fill="black"
              />
            )}
          </mask>
        </defs>
        <rect 
          x="0" 
          y="0" 
          width="100%" 
          height="100%" 
          fill="rgba(0, 0, 0, 0.5)" 
          mask="url(#spotlight-mask)"
        />
      </svg>
      
      {/* Backdrop blur layer - separate from SVG */}
      <div 
        className="absolute inset-0 backdrop-blur-md pointer-events-none"
        style={{
          clipPath: targetRect 
            ? `polygon(
                0% 0%, 
                0% 100%, 
                ${targetRect.left - 16}px 100%, 
                ${targetRect.left - 16}px ${targetRect.top - 16}px, 
                ${targetRect.right + 16}px ${targetRect.top - 16}px, 
                ${targetRect.right + 16}px ${targetRect.bottom + 16}px, 
                ${targetRect.left - 16}px ${targetRect.bottom + 16}px, 
                ${targetRect.left - 16}px 100%, 
                100% 100%, 
                100% 0%
              )`
            : 'none'
        }}
      />
      
      {/* Highlight ring around target */}
      {targetRect && (
        <div
          className="absolute rounded-2xl pointer-events-none border-4 border-primary shadow-[0_0_40px_rgba(var(--primary),0.6)]"
          style={{
            top: targetRect.top - 16,
            left: targetRect.left - 16,
            width: targetRect.width + 32,
            height: targetRect.height + 32,
            animation: 'pulse 2s ease-in-out infinite',
          }}
        />
      )}

      {/* Tutorial tooltip card */}
      <Card 
        className="absolute w-[380px] max-w-[calc(100vw-2rem)] shadow-2xl border-primary/50 bg-background pointer-events-auto transition-all duration-300 ease-out"
        style={{
          top: tooltipPosition.top,
          left: tooltipPosition.left,
          opacity: targetRect ? 1 : 0.9,
          transform: targetRect ? "scale(1)" : "scale(0.98)",
        }}
      >
        <CardHeader className="pb-3 relative">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <div className="size-8 rounded-full bg-primary/10 flex items-center justify-center">
                <Sparkles className="size-4 text-primary" />
              </div>
              <Badge variant="secondary" className="text-xs">
                Step {currentStepIndex + 1} of {totalSteps}
              </Badge>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="size-7 text-muted-foreground hover:text-foreground"
              onClick={skipTutorial}
            >
              <X className="size-4" />
            </Button>
          </div>
          <CardTitle className="text-lg mt-2">{currentStep.title}</CardTitle>
          <CardDescription className="text-sm leading-relaxed">
            {currentStep.description}
          </CardDescription>
        </CardHeader>

        <CardContent className="pt-0">
          {/* Progress bar */}
          <div className="w-full h-1.5 bg-muted rounded-full mb-4 overflow-hidden">
            <div 
              className="h-full bg-primary rounded-full transition-all duration-500 ease-out"
              style={{ width: `${((currentStepIndex + 1) / totalSteps) * 100}%` }}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="sm"
              onClick={skipTutorial}
              className="text-muted-foreground hover:text-foreground gap-1"
            >
              <SkipForward className="size-3.5" />
              Skip Tutorial
            </Button>
            
            <div className="flex items-center gap-2">
              {currentStepIndex > 0 && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={prevStep}
                  className="gap-1"
                >
                  <ChevronLeft className="size-4" />
                  Back
                </Button>
              )}
              <Button 
                size="sm" 
                onClick={nextStep}
                className="gap-1"
              >
                {isLastStep ? (
                  <>
                    Finish
                    <Sparkles className="size-4" />
                  </>
                ) : (
                  <>
                    Next
                    <ChevronRight className="size-4" />
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
