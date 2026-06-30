"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import Link from "next/link"
import Image from "next/image"
import { Menu, X, Moon, Sun, Settings, LogOut, Users, Briefcase, Mail } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useTheme } from "next-themes"
import { signOut } from "next-auth/react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { PlanAvatar } from "@/components/ui/plan-avatar"
import { useRouter } from "next/navigation"
import { NotificationPanel } from "@/components/notification-panel"
import { useAuth } from "@/contexts/auth-context"

export function Header() {
  const [isScrolled, setIsScrolled] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const { theme, setTheme } = useTheme()
  const { user, setUser } = useAuth()
  const [mounted, setMounted] = useState(false)
  const router = useRouter()
  const [inviteCount, setInviteCount] = useState(0)

  useEffect(() => {
    if (user?.auth_user_id) {
      fetchInviteCount(user.auth_user_id)
      const interval = setInterval(() => fetchInviteCount(user.auth_user_id as string), 60000)
      return () => clearInterval(interval)
    }
  }, [user?.auth_user_id])

  const fetchInviteCount = async (authUserId: string) => {
    try {
      const res = await fetch(`/api/recruitment/invitations`)
      const result = await res.json()
      if (result.success) {
        setInviteCount(result.data.filter((inv: any) => inv.status === 'pending').length)
      }
    } catch (error) {
       console.error('Error fetching invite count:', error)
    }
  }

  useEffect(() => {
    setMounted(true)
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10)
    }
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark")
  }

  const handleLogout = async () => {
    setUser(null)
    await signOut({ redirect: false })
    router.push("/")
  }

  const isAuthenticated = !!user

  if (!mounted) {
    return (
      <header className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-2rem)] max-w-7xl pointer-events-none">
        <div className="pointer-events-auto h-16 rounded-full border border-border/40 backdrop-blur-xl bg-background/20">
          <div className="container flex h-full items-center justify-between px-6">
            <Link href="/" className="flex items-center gap-2 font-bold focus:outline-none group">
              <div className="relative size-9 rounded-full bg-primary flex items-center justify-center overflow-hidden">
                <Image 
                  src="/Morx upscaled.png" 
                  alt="Morx" 
                  width={40}
                  height={40} 
                  className="size-full object-cover transition-transform group-hover:scale-110" 
                />
              </div>
              <span className="text-xl rock-salt group-hover:text-primary transition-colors">Morx</span>
            </Link>
            <div className="flex items-center gap-4">
              <div className="size-5" />
            </div>
          </div>
        </div>
      </header>
    )
  }

  return (
    <header className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-2rem)] max-w-7xl pointer-events-none">
      <div 
        className={`pointer-events-auto h-16 rounded-full border transition-all duration-300 backdrop-blur-xl ${
          isScrolled 
            ? "bg-background/80 shadow-lg border-primary/20 scale-[0.98]" 
            : "bg-background/40 border-border/40"
        }`}
      >
        <div className="container flex h-full items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-2 font-bold group focus:outline-none">
            <div className="relative size-9 rounded-full bg-primary flex items-center justify-center overflow-hidden">
              <Image 
                src="/Morx upscaled.png" 
                alt="Morx" 
                width={36} 
                height={36} 
                className="size-full object-cover transition-transform group-hover:scale-110" 
              />
            </div>
            <span className="text-xl rock-salt group-hover:text-primary transition-colors">Morx</span>
          </Link>
          
          <motion.nav 
            className="hidden md:flex gap-8"
            initial="hidden"
            animate="visible"
            variants={{
              hidden: {},
              visible: {
                transition: {
                  staggerChildren: 0.08
                }
              }
            }}
          >
            {isAuthenticated ? (
              <>
                {[
                  { href: "/", label: "Home" },
                  { href: "/teams", label: "Teams" },
                  { href: "/templates", label: "Templates" },
                ].map((link, i) => (
                  <motion.div
                    key={link.href}
                    variants={{
                      hidden: { opacity: 0, y: -10 },
                      visible: { opacity: 1, y: 0 }
                    }}
                    whileHover={{ scale: 1.05, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                    transition={{ type: "spring", stiffness: 400, damping: 17 }}
                  >
                    <Link href={link.href} className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
                      {link.label}
                    </Link>
                  </motion.div>
                ))}
                <motion.div
                  variants={{
                    hidden: { opacity: 0, y: -10 },
                    visible: { opacity: 1, y: 0 }
                  }}
                  whileHover={{ scale: 1.1, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  transition={{ type: "spring", stiffness: 400, damping: 17 }}
                >
                  <Link href="/talent" className="text-sm font-medium text-primary font-bold transition-colors hover:text-primary/80">
                    Marketplace
                  </Link>
                </motion.div>
                <motion.div 
                  className="w-px h-4 bg-border/60 self-center"
                  variants={{
                    hidden: { opacity: 0, scaleY: 0 },
                    visible: { opacity: 1, scaleY: 1 }
                  }}
                />
                {[
                  { href: "/docs", label: "Docs" },
                  { href: "/api", label: "API" },
                ].map((link) => (
                  <motion.div
                    key={link.href}
                    variants={{
                      hidden: { opacity: 0, y: -10 },
                      visible: { opacity: 1, y: 0 }
                    }}
                    whileHover={{ scale: 1.05, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                    transition={{ type: "spring", stiffness: 400, damping: 17 }}
                  >
                    <Link href={link.href} className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
                      {link.label}
                    </Link>
                  </motion.div>
                ))}
              </>
            ) : (
              <>
                {[
                  { href: "/docs", label: "Documentation" },
                  { href: "/api", label: "API" },
                  { href: "/pricing", label: "Pricing" },
                ].map((link) => (
                  <motion.div
                    key={link.href}
                    variants={{
                      hidden: { opacity: 0, y: -10 },
                      visible: { opacity: 1, y: 0 }
                    }}
                    whileHover={{ scale: 1.05, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                    transition={{ type: "spring", stiffness: 400, damping: 17 }}
                  >
                    <Link href={link.href} className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
                      {link.label}
                    </Link>
                  </motion.div>
                ))}
              </>
            )}
          </motion.nav>

          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={toggleTheme} className="rounded-full">
              {theme === "dark" ? <Sun className="size-5" /> : <Moon className="size-5" />}
            </Button>

            {isAuthenticated && user ? (
              <div className="flex items-center gap-2 sm:gap-4">
                <NotificationPanel userId={user.auth_user_id} />
                <div className="hidden md:block">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="relative h-10 w-10 rounded-full p-0">
                        <PlanAvatar
                          src={user.profile_image}
                          alt={user.first_name || ''}
                          plan={user.plan}
                          fallback={user.first_name?.[0]}
                          size="md"
                        />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-56" align="end" forceMount>
                      <DropdownMenuLabel className="font-normal">
                        <div className="flex flex-col space-y-1">
                          <p className="text-sm font-medium leading-none">{user.first_name}{user.last_name ? ' ' + user.last_name : ''}</p>
                          <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
                        </div>
                      </DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild>
                        <Link href="/settings" className="cursor-pointer">
                          <Settings className="mr-2 h-4 w-4" />
                          <span>Settings</span>
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href="/invitations" className="cursor-pointer flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Mail className="mr-2 h-4 w-4" />
                            <span>Invitations</span>
                          </div>
                          {inviteCount > 0 && (
                            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] text-white font-bold">
                              {inviteCount}
                            </span>
                          )}
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href="/talent" className="cursor-pointer">
                          <Briefcase className="mr-2 h-4 w-4" />
                          <span>Marketplace</span>
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href="/teams" className="cursor-pointer">
                          <Users className="mr-2 h-4 w-4" />
                          <span>My Teams</span>
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="text-destructive focus:text-destructive cursor-pointer" onClick={handleLogout}>
                        <LogOut className="mr-2 h-4 w-4" />
                        <span>Log out</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link href="/signin">
                  <Button variant="ghost" size="sm" className="hidden sm:inline-flex rounded-full">Sign In</Button>
                </Link>
                <Link href="/signup">
                  <Button size="sm" className="rounded-full">Let's Go!</Button>
                </Link>
              </div>
            )}

            <Button variant="ghost" size="icon" className="md:hidden rounded-full" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
              {mobileMenuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="absolute top-20 left-0 right-0 pointer-events-auto md:hidden overflow-hidden rounded-[2rem] border border-border/40 bg-background/95 backdrop-blur-xl shadow-2xl animate-in fade-in zoom-in duration-300">
          <div className="container py-6 space-y-4">
            {isAuthenticated && user ? (
              <>
                <div className="flex items-center gap-3 pb-4 mb-4 border-b">
                  <PlanAvatar
                    src={user.profile_image}
                    alt={user.first_name || ''}
                    plan={user.plan}
                    fallback={<span className="bg-primary/10 text-primary">{user.first_name?.[0]}</span>}
                    size="lg"
                  />
                  <div className="flex flex-col">
                    <p className="font-semibold text-foreground">
                      {user.first_name} {user.last_name || ''}
                    </p>
                    <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                      {user.email}
                    </p>
                  </div>
                </div>
                <Link href="/" className="block text-sm font-medium py-2" onClick={() => setMobileMenuOpen(false)}>Home</Link>
                <Link href="/teams" className="block text-sm font-medium py-2" onClick={() => setMobileMenuOpen(false)}>Teams</Link>
                <Link href="/templates" className="block text-sm font-medium py-2" onClick={() => setMobileMenuOpen(false)}>Templates</Link>
                <Link href="/talent" className="block text-sm font-medium py-2 text-primary font-bold" onClick={() => setMobileMenuOpen(false)}>Marketplace</Link>
                <Link href="/invitations" className="flex items-center justify-between text-sm font-medium py-2" onClick={() => setMobileMenuOpen(false)}>
                  Invitations
                  {inviteCount > 0 && <span className="bg-primary text-white text-[10px] px-2 py-0.5 rounded-full">{inviteCount}</span>}
                </Link>
                <DropdownMenuSeparator />
                <Link href="/settings" className="block text-sm font-medium py-2" onClick={() => setMobileMenuOpen(false)}>Settings</Link>
                <button className="block w-full text-left text-sm font-medium py-2 text-destructive" onClick={() => {
                  handleLogout()
                  setMobileMenuOpen(false)
                }}>
                  Log out
                </button>
              </>
            ) : (
              <div className="pt-4 flex flex-col gap-2">
                <Link href="/docs" className="block text-sm font-medium py-2" onClick={() => setMobileMenuOpen(false)}>Documentation</Link>
                <Link href="/api" className="block text-sm font-medium py-2" onClick={() => setMobileMenuOpen(false)}>API</Link>
                <Link href="/pricing" className="block text-sm font-medium py-2" onClick={() => setMobileMenuOpen(false)}>Pricing</Link>
                <Link href="/signin" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="outline" className="w-full rounded-full mt-2">Sign In</Button>
                </Link>
                <Link href="/signup" onClick={() => setMobileMenuOpen(false)}>
                  <Button className="w-full rounded-full">Let's Start</Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  )
}
