"use client"

import Link from "next/link"
import Image from "next/image"
import { useTheme } from "next-themes"
import { useState, useEffect } from "react"

export function Footer() {
  const { theme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
        <footer className="w-[calc(100%-2rem)] max-w-7xl mx-auto mb-6 rounded-[2.5rem] border border-border/40 bg-background/40 backdrop-blur-xl shadow-lg transition-all duration-300 hover:border-primary/20">
          <div className="container flex flex-col gap-8 px-6 py-10 md:px-10 lg:py-12">
              <div className="grid gap-8 sm:grid-cols-2 md:grid-cols-4">
                <div className="space-y-4">
                    <div className="flex items-center gap-2 font-bold group">
                    <div className="size-8" /> 
                    <span className="rock-salt group-hover:text-primary transition-colors">Morx</span>
                    </div>
                </div>
              </div>
          </div>
        </footer>
    )
  }

  return (
    <footer className="w-[calc(100%-2rem)] max-w-7xl mx-auto mb-6 rounded-[2.5rem] border border-border/40 bg-background/40 backdrop-blur-xl shadow-lg transition-all duration-300 hover:border-primary/20">
      <div className="container flex flex-col gap-8 px-6 py-10 md:px-10 lg:py-12">
        <div className="grid gap-8 sm:grid-cols-2 md:grid-cols-4">
          <div className="space-y-4">
            <div className="flex items-center gap-2 font-bold group">
              <div className="relative size-7 rounded-full bg-primary flex items-center justify-center overflow-hidden">
                <Image 
                  src="/Morx upscaled.png" 
                  alt="Morx" 
                  width={28} 
                  height={28} 
                  className="size-full object-cover transition-transform group-hover:scale-110" 
                />
              </div>
              <span className="rock-salt group-hover:text-primary transition-colors">Morx</span>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Advanced reports and statistics platform for data-driven decisions.
            </p>
          </div>

          <div className="space-y-4">
            <h4 className="text-sm font-bold uppercase tracking-wider text-foreground/80">Product</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="https://levi-abdoahmed.vercel.app" className="text-muted-foreground hover:text-primary transition-colors">About Owner</Link></li>
              <li><Link href="/analytics" className="text-muted-foreground hover:text-primary transition-colors">Analytics for Admins</Link></li>
            </ul>
          </div>
          
          <div className="space-y-4">
            <h4 className="text-sm font-bold uppercase tracking-wider text-foreground/80">Resources</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/docs" className="text-muted-foreground hover:text-primary transition-colors">Documentation</Link></li>
              <li><Link href="/api" className="text-muted-foreground hover:text-primary transition-colors">API Reference</Link></li>
              <li><Link href="/pricing" className="text-muted-foreground hover:text-primary transition-colors">Pricing</Link></li>
            </ul>
          </div>
          
          <div className="space-y-4">
            <h4 className="text-sm font-bold uppercase tracking-wider text-foreground/80">Company</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/about" className="text-muted-foreground hover:text-primary transition-colors">About Us</Link></li>
              <li><Link href="/privacy" className="text-muted-foreground hover:text-primary transition-colors">Privacy Policy</Link></li>
              <li><Link href="/terms" className="text-muted-foreground hover:text-primary transition-colors">Terms of Service</Link></li>
            </ul>
          </div>
        </div>
        
        <div className="flex flex-row justify-between items-center border-t border-border/20 pt-8">
          <div className="flex flex-col gap-1">
            <p className="text-xs text-muted-foreground font-medium">
                &copy; {new Date().getFullYear()} Morx. All rights reserved.
            </p>
            <Link href="https://chameleon-nu.vercel.app" target="_blank" className="flex items-center gap-2 group opacity-80 hover:opacity-100 transition-opacity w-fit">
                <span className="text-[10px] font-bold tracking-wide text-[#FFCC00]">One of Chameleon products</span>
                <Image 
                    src="/1212-removebg-preview.png" 
                    alt="Chameleon" 
                    width={20} 
                    height={20} 
                    className="size-5 transition-transform group-hover:scale-110" 
                />
            </Link>
          </div>
          <div className="flex items-center gap-4">
            <Image 
              src="/made in egypt.png" 
              alt="Made in Egypt" 
              width={80} 
              height={40} 
              className="h-8 w-auto object-contain opacity-80 hover:opacity-100 transition-opacity" 
            />
            <div className="size-2 rounded-full bg-primary/40 animate-pulse" title="System Status: Online" />
          </div>
        </div>
      </div>
    </footer>
  )
}

