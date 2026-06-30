"use client"

import React, { useEffect, useRef } from 'react'

interface Point {
  x: number
  y: number
  z: number
  r: number
}

interface Connection {
  start: Point
  end: Point
  progress: number
  speed: number
}

import { useColorTheme } from "@/components/color-theme-provider"
import { useTheme } from "next-themes"

export const AnimatedGlobe = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const { colorTheme } = useColorTheme()
  const { theme } = useTheme()
  const colorsRef = useRef({
    primary: '#22c55e',
    primaryGlow: 'rgba(34, 197, 94, 0.5)',
    dot: 'rgba(255, 255, 255, 0.1)',
    activeDot: 'rgba(34, 197, 94, 0.8)'
  })

  useEffect(() => {
    // Standardize HSL from CSS variable
    const root = window.document.documentElement
    const primaryHslRaw = getComputedStyle(root).getPropertyValue('--primary').trim()
    
    if (primaryHslRaw) {
      const hslParts = primaryHslRaw.split(' ')
      const h = hslParts[0]
      const s = hslParts[1]
      const l = hslParts[2]
      
      const primaryColor = `hsl(${h}, ${s}, ${l})`
      const primaryGlow = `hsla(${h}, ${s}, ${l}, 0.5)`
      const activeDot = `hsla(${h}, ${s}, ${l}, 0.8)`
      
      colorsRef.current = {
        ...colorsRef.current,
        primary: primaryColor,
        primaryGlow: primaryGlow,
        activeDot: activeDot
      }
    }
  }, [colorTheme, theme])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let width = canvas.width = 600
    let height = canvas.height = 600
    const centerX = width / 2
    const centerY = height / 2
    const radius = 220
    const points: Point[] = []
    const connections: Connection[] = []
    let rotationY = 0
    let rotationX = 0.2

    // Initialize globe surface points
    const pointCount = 400
    for (let i = 0; i < pointCount; i++) {
      const phi = Math.acos(-1 + (2 * i) / pointCount)
      const theta = Math.sqrt(pointCount * Math.PI) * phi

      points.push({
        x: Math.cos(theta) * Math.sin(phi) * radius,
        y: Math.sin(theta) * Math.sin(phi) * radius,
        z: Math.cos(phi) * radius,
        r: 1
      })
    }

    // Add active connections (moving dots)
    const createConnection = () => {
      const p1 = points[Math.floor(Math.random() * points.length)]
      const p2 = points[Math.floor(Math.random() * points.length)]
      connections.push({
        start: p1,
        end: p2,
        progress: 0,
        speed: 0.005 + Math.random() * 0.01
      })
    }

    for (let i = 0; i < 15; i++) createConnection()

    const rotate = (p: Point, ry: number, rx: number) => {
      // Y-axis rotation
      const cosY = Math.cos(ry)
      const sinY = Math.sin(ry)
      let x = p.x * cosY - p.z * sinY
      let z = p.x * sinY + p.z * cosY

      // X-axis rotation
      const cosX = Math.cos(rx)
      const sinX = Math.sin(rx)
      let y = p.y * cosX - z * sinX
      z = p.y * sinX + z * cosX

      return { x, y, z }
    }

    const animate = () => {
      ctx.clearRect(0, 0, width, height)
      rotationY += 0.002

      // Resolve current primary color from CSS variable for Canvas
      const root = window.document.documentElement
      const primaryHslRaw = getComputedStyle(root).getPropertyValue('--primary').trim()
      let primaryColor = colorsRef.current.primary
      let glowColor = 'rgba(34, 197, 94, 0.03)'
      
      // Check if light mode
      const isLightMode = root.classList.contains('light')

      if (primaryHslRaw) {
        // Tailwind/CSS variables often store HSL as "h s l"
        const hslFormatted = primaryHslRaw.split(' ').join(', ')
        primaryColor = `hsl(${hslFormatted})`
        glowColor = `hsla(${hslFormatted}, 0.03)`
        
        // Update ref for other parts of the loop
        colorsRef.current.primary = primaryColor
      }

      // Draw globe atmosphere/glow
      const gradient = ctx.createRadialGradient(centerX, centerY, radius * 0.8, centerX, centerY, radius)
      gradient.addColorStop(0, glowColor)
      gradient.addColorStop(1, 'transparent')
      ctx.fillStyle = gradient
      ctx.beginPath()
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2)
      ctx.fill()
      
      // Draw a subtle border - dark in light mode
      ctx.strokeStyle = isLightMode ? 'rgba(0, 0, 0, 0.1)' : 'rgba(255, 255, 255, 0.05)'
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2)
      ctx.stroke()

      // Draw surface points - dark in light mode
      points.forEach(p => {
        const rotated = rotate(p, rotationY, rotationX)
        const scale = 1000 / (1000 + rotated.z) // perspective
        const x2d = centerX + rotated.x * scale
        const y2d = centerY + rotated.y * scale

        if (rotated.z > -radius) { // depth sorting/culling
            ctx.beginPath()
            ctx.arc(x2d, y2d, (rotated.z > 0 ? 1.2 : 0.8) * scale, 0, Math.PI * 2)
            if (isLightMode) {
              ctx.fillStyle = rotated.z > 0 
                  ? 'rgba(0, 0, 0, 0.15)' 
                  : 'rgba(0, 0, 0, 0.08)'
            } else {
              ctx.fillStyle = rotated.z > 0 
                  ? 'rgba(255, 255, 255, 0.3)' 
                  : 'rgba(255, 255, 255, 0.1)'
            }
            ctx.fill()
        }
      })

      // Draw connections (arcs/moving dots)
      connections.forEach((c, idx) => {
        c.progress += c.speed
        if (c.progress >= 1) {
          connections[idx] = {
            start: points[Math.floor(Math.random() * points.length)],
            end: points[Math.floor(Math.random() * points.length)],
            progress: 0,
            speed: 0.005 + Math.random() * 0.01
          }
        }

        // Spherical interpolation (simplified as linear in 3D then normalized)
        const currentPos = {
          x: c.start.x + (c.end.x - c.start.x) * c.progress,
          y: c.start.y + (c.end.y - c.start.y) * c.progress,
          z: c.start.z + (c.end.z - c.start.z) * c.progress
        }
        
        // Normalize and push back to radius to keep on surface
        const mag = Math.sqrt(currentPos.x**2 + currentPos.y**2 + currentPos.z**2)
        currentPos.x = (currentPos.x / mag) * radius
        currentPos.y = (currentPos.y / mag) * radius
        currentPos.z = (currentPos.z / mag) * radius

        const rotated = rotate(currentPos as Point, rotationY, rotationX)
        const scale = 1000 / (1000 + rotated.z)
        const x2d = centerX + rotated.x * scale
        const y2d = centerY + rotated.y * scale

        if (rotated.z > -radius) {
           // Draw glowing trail
           ctx.beginPath()
           ctx.arc(x2d, y2d, 3 * scale, 0, Math.PI * 2)
           ctx.shadowBlur = 15
           ctx.shadowColor = primaryColor
           ctx.fillStyle = primaryColor
           ctx.fill()
           ctx.shadowBlur = 0
        }
      })

      requestAnimationFrame(animate)
    }

    animate()

    const handleResize = () => {
        if (!canvasRef.current) return
        // Keep it fixed size for simplicity since it's in a grid
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  return (
    <div className="relative flex items-center justify-center pointer-events-none select-none">
      <div 
        className="absolute inset-0 rounded-full blur-[120px] opacity-20 transform translate-x-12" 
        style={{ backgroundColor: 'hsl(var(--primary))' }}
      />
      <canvas 
        ref={canvasRef} 
        className="max-w-full h-auto opacity-80"
        style={{ mixBlendMode: 'screen' }}
      />
    </div>
  )
}
