'use client'

import * as React from 'react'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { getPlanBorderColor } from '@/lib/constants/plans'
import { PlanType } from '@/lib/types'
import { cn } from '@/lib/utils'

interface PlanAvatarProps {
  src?: string | null
  alt?: string
  fallback?: React.ReactNode
  plan?: PlanType | null
  className?: string
  size?: 'xxs' | 'xs' | 'sm' | 'md' | 'lg' | 'xl'
}

const sizeMap = {
  xxs: 'h-5 w-5',
  xs: 'h-6 w-6',
  sm: 'h-7 w-7',
  md: 'h-10 w-10',
  lg: 'h-12 w-12',
  xl: 'h-16 w-16',
}

const borderWidthMap = {
  xxs: '1px',
  xs: '2px',
  sm: '2px',
  md: '2px',
  lg: '3px',
  xl: '3px',
}

/**
 * PlanAvatar - Avatar component with plan-based colored border
 * 
 * Border colors:
 * - free: no border
 * - starter: yellow (#EAB308)
 * - professional: blue (#3B82F6)
 * - enterprise: red (#EF4444)
 */
export function PlanAvatar({ 
  src, 
  alt, 
  fallback, 
  plan, 
  className,
  size = 'md' 
}: PlanAvatarProps) {
  const borderColor = getPlanBorderColor(plan)
  const sizeClass = sizeMap[size]
  const borderWidth = borderWidthMap[size]

  return (
    <Avatar 
      className={cn(sizeClass, className)}
      style={borderColor ? { 
        border: `${borderWidth} solid ${borderColor}`,
        boxSizing: 'border-box'
      } : undefined}
    >
      <AvatarImage src={src || undefined} alt={alt} />
      <AvatarFallback className="bg-transparent">{fallback}</AvatarFallback>
    </Avatar>
  )
}

export default PlanAvatar
