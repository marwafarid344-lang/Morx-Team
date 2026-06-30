"use client"

import { motion } from "framer-motion"
import { Check } from "lucide-react"

interface Step {
  id: number
  name: string
}

interface StepIndicatorProps {
  steps: Step[]
  currentStep: number
}

export function StepIndicator({ steps, currentStep }: StepIndicatorProps) {
  return (
    <div className="flex items-center justify-between w-full px-2 mb-8">
      {steps.map((step, idx) => {
        const isCompleted = currentStep > step.id
        const isActive = currentStep === step.id
        
        return (
          <div key={step.id} className="flex flex-col items-center flex-1 relative">
            {/* Connection Line */}
            {idx !== 0 && (
              <div 
                className={`absolute left-[-50%] top-4 w-full h-[2px] -z-10 transition-colors duration-500 ${isCompleted || isActive ? 'bg-primary' : 'bg-muted'}`} 
              />
            )}
            
            <motion.div
              initial={false}
              animate={{
                backgroundColor: isCompleted || isActive ? "var(--primary)" : "var(--muted)",
                scale: isActive ? 1.2 : 1,
              }}
              className={`size-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${isCompleted || isActive ? 'text-primary-foreground' : 'text-muted-foreground'}`}
            >
              {isCompleted ? (
                <Check className="size-4 stroke-[3px]" />
              ) : (
                step.id
              )}
            </motion.div>
            
            <span className={`mt-2 text-[10px] font-black uppercase tracking-widest text-center ${isActive ? 'text-foreground' : 'text-muted-foreground opacity-50'}`}>
              {step.name}
            </span>
          </div>
        )
      })}
    </div>
  )
}
