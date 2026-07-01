"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { 
  BookOpen, 
  ChevronRight, 
  Users, 
  FolderLock, 
  CheckSquare, 
  Bell, 
  LayoutTemplate, 
  BarChart4, 
  Settings, 
  HelpCircle,
  Code,
  LogIn,
  UserPlus,
  ShieldCheck,
  Trash2,
  LogOut,
  Sparkles,
  Calendar,
  LayoutGrid,
  FileText,
  MessageSquare,
  Upload,
  Shield,
  Crown,
  Palette,
  Clock,
  Search,
  Bot,
  Zap,
  Lock,
  Briefcase,
  GraduationCap,
  Globe,
  Star,
  Github
} from "lucide-react"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import Link from "next/link"

const sections = [
  { 
    id: "getting-started", 
    title: "Getting Started", 
    icon: <BookOpen className="size-4" />,
    content: (
      <div className="space-y-6">
        <h2 className="text-3xl font-black italic">🚀 Getting Started</h2>
        <p className="text-muted-foreground">Welcome to <strong>Morx</strong>! We've built an advanced reports and statistics platform designed for modern teams who want to move fast with precision.</p>
        
        <div className="rounded-2xl overflow-hidden border bg-muted/20">
          <img src="./Morx/Home.png" alt="Morx Dashboard" className="w-full object-cover shadow-2xl" />
        </div>

        <div className="p-4 bg-primary/5 rounded-xl border-l-4 border-primary">
          <p className="font-bold">The Morx Vision</p>
          <p className="text-sm mt-1">Our platform isn't just about checkboxes; it seeks to provide a complete ecosystem where data-driven decisions meet seamless collaboration.</p>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <button 
            onClick={() => {
              const element = document.getElementById('auth-scroll');
              if (element) element.scrollIntoView({ behavior: 'smooth' });
              const authSection = document.querySelector('[data-section-id="auth"]');
              if (authSection) (authSection as HTMLElement).click();
            }}
            className="p-4 border rounded-xl bg-background hover:border-primary/50 transition-colors text-left group"
          >
             <div className="size-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary mb-3 group-hover:bg-primary group-hover:text-white transition-colors">1</div>
             <p className="text-sm font-bold">Create Account</p>
             <p className="text-xs text-muted-foreground">Sign up with your academic or professional email to join the network.</p>
             <p className="text-[10px] text-primary mt-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">Learn how <ChevronRight className="size-2" /></p>
          </button>
          <button 
            onClick={() => {
              const teamSection = document.querySelector('[data-section-id="teams"]');
              if (teamSection) (teamSection as HTMLElement).click();
            }}
            className="p-4 border rounded-xl bg-background hover:border-primary/50 transition-colors text-left group"
          >
             <div className="size-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary mb-3 group-hover:bg-primary group-hover:text-white transition-colors">2</div>
             <p className="text-sm font-bold">Join or Create Team</p>
             <p className="text-xs text-muted-foreground">Start your own department or join an existing workforce.</p>
             <p className="text-[10px] text-primary mt-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">Explore teams <ChevronRight className="size-2" /></p>
          </button>
        </div>

        <div className="p-5 bg-gradient-to-r from-primary/5 to-primary/10 rounded-2xl border border-primary/20 mt-6">
          <h3 className="font-bold text-lg mb-3 flex items-center gap-2"><Zap className="size-5 text-primary" /> Quick Overview</h3>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="p-3 bg-background rounded-lg border">
              <p className="text-2xl font-black text-primary">Teams</p>
              <p className="text-xs text-muted-foreground">Create & manage teams</p>
            </div>
            <div className="p-3 bg-background rounded-lg border">
              <p className="text-2xl font-black text-primary">Projects</p>
              <p className="text-xs text-muted-foreground">Organize your work</p>
            </div>
            <div className="p-3 bg-background rounded-lg border">
              <p className="text-2xl font-black text-primary">Tasks</p>
              <p className="text-xs text-muted-foreground">Track progress</p>
            </div>
            <div className="p-3 bg-background rounded-lg border">
              <p className="text-2xl font-black text-primary">AI</p>
              <p className="text-xs text-muted-foreground">Smart suggestions</p>
            </div>
          </div>
        </div>
      </div>
    )
  },
  { 
    id: "auth", 
    title: "Authentication", 
    icon: <LogIn className="size-4" />,
    content: (
      <div id="auth-scroll" className="space-y-6">
        <h2 className="text-3xl font-black italic">🔐 Authentication</h2>
        <p className="text-muted-foreground">Getting started with Morx is simple. Whether you're creating a new account or signing back in, we've optimized the flow for speed and security.</p>
        
        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="signup" className="border-none">
            <AccordionTrigger className="hover:no-underline py-4">
              <div className="flex items-center gap-3">
                 <div className="size-8 rounded-lg bg-orange-500/10 flex items-center justify-center text-orange-500"><UserPlus className="size-4" /></div>
                 <div className="text-left">
                    <p className="text-sm font-bold">Sign Up Workflow</p>
                <p className="text-xs text-muted-foreground font-normal">A multi-step process to set up your professional profile. You can also skip the manual steps using <strong>GitHub</strong> or <strong>Google</strong> for instant identity creation.</p>
                 </div>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-6 pt-4">
                <div className="grid gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">Step 1</Badge>
                      <p className="text-sm font-bold">Basic Information</p>
                    </div>
                    <p className="text-xs text-muted-foreground">Enter your first name, last name, and email address.</p>
                    <div className="rounded-xl overflow-hidden border bg-muted/20">
                      <img src="/Morx/sign up 1.png" alt="Sign Up Step 1" className="w-full object-cover" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">Step 2</Badge>
                      <p className="text-sm font-bold">Email Verification</p>
                    </div>
                    <p className="text-xs text-muted-foreground">Verify your email address to continue the registration process.</p>
                    <div className="rounded-xl overflow-hidden border bg-muted/20">
                      <img src="/Morx/sign up 2.png" alt="Sign Up Step 2" className="w-full object-cover" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">Step 3</Badge>
                      <p className="text-sm font-bold">Academic Details</p>
                    </div>
                    <p className="text-xs text-muted-foreground">Select your faculty, study level, and department (for FCDS members).</p>
                    <div className="rounded-xl overflow-hidden border bg-muted/20">
                      <img src="/Morx/sign up 3.png" alt="Sign Up Step 3" className="w-full object-cover" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">Step 4</Badge>
                      <p className="text-sm font-bold">Security & Password</p>
                    </div>
                    <p className="text-xs text-muted-foreground">Create a secure password with confirmation validation.</p>
                    <div className="rounded-xl overflow-hidden border bg-muted/20">
                      <img src="/Morx/sign up 4.png" alt="Sign Up Step 4" className="w-full object-cover" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">Step 5</Badge>
                      <p className="text-sm font-bold">Finalizing Profile</p>
                    </div>
                    <p className="text-xs text-muted-foreground">Complete your profile setup and start using Morx!</p>
                    <div className="rounded-xl overflow-hidden border bg-muted/20">
                      <img src="/Morx/sign up 5.png" alt="Sign Up Step 5" className="w-full object-cover" />
                    </div>
                  </div>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="signin" className="border-none mt-4">
            <AccordionTrigger className="hover:no-underline py-4">
              <div className="flex items-center gap-3">
                 <div className="size-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-500"><LogIn className="size-4" /></div>
                 <div className="text-left">
                    <p className="text-sm font-bold">Sign In Process</p>
                    <p className="text-xs text-muted-foreground font-normal">Quick access to your workspace via traditional or social login.</p>
                 </div>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-6 pt-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <p className="text-xs font-bold text-muted-foreground uppercase">Email Login</p>
                    <div className="rounded-xl overflow-hidden border bg-muted/20">
                      <img src="/Morx/login.png" alt="Login Page" className="w-full object-cover" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <p className="text-xs font-bold text-muted-foreground uppercase">OAuth Providers</p>
                    <div className="rounded-xl overflow-hidden border bg-muted/20">
                      <img src="/Morx/login 2.png" alt="Login Providers" className="w-full object-cover" />
                    </div>
                  </div>
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="p-4 bg-blue-500/5 rounded-xl border border-blue-500/20">
                    <p className="text-sm font-bold flex items-center gap-2"><Shield className="size-4 text-blue-500" /> Google OAuth Integration</p>
                    <p className="text-xs text-muted-foreground mt-1">Sign in quickly and securely using your Google account. Your profile image and basic info will be synced automatically.</p>
                  </div>
                  <div className="p-4 bg-slate-500/5 rounded-xl border border-slate-500/20">
                    <p className="text-sm font-bold flex items-center gap-2"><Github className="size-4 text-slate-500" /> GitHub Auth</p>
                    <p className="text-xs text-muted-foreground mt-1">Developer-grade authentication. Perfect for syncing your identity and future repository integrations.</p>
                  </div>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="forgot" className="border-none mt-4">
            <AccordionTrigger className="hover:no-underline py-4">
              <div className="flex items-center gap-3">
                 <div className="size-8 rounded-lg bg-red-500/10 flex items-center justify-center text-red-500"><Lock className="size-4" /></div>
                 <div className="text-left">
                    <p className="text-sm font-bold">Password Recovery</p>
                    <p className="text-xs text-muted-foreground font-normal">Forgot your password? Reset it securely.</p>
                 </div>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-4 pt-4">
                <p className="text-sm text-muted-foreground">If you've forgotten your password, you can reset it by verifying your identity through Google OAuth, then setting a new password.</p>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="p-4 border rounded-xl">
                    <p className="text-xs font-bold mb-2">Step 1: Verify Identity</p>
                    <p className="text-xs text-muted-foreground">Sign in with Google to confirm your account ownership.</p>
                  </div>
                  <div className="p-4 border rounded-xl">
                    <p className="text-xs font-bold mb-2">Step 2: Set New Password</p>
                    <p className="text-xs text-muted-foreground">Create a new secure password with confirmation.</p>
                  </div>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
    )
  },
  { 
    id: "profile", 
    title: "User Profile", 
    icon: <Users className="size-4" />,
    content: (
      <div className="space-y-6">
        <h2 className="text-3xl font-black italic">👤 Your Identity</h2>
        <p className="text-muted-foreground">Your profile is your professional hub in Morx. Manage your skills, track your participations, and showcase your contributions.</p>
        
        <div className="rounded-2xl overflow-hidden border bg-muted/20">
          <img src="/Morx/Profile.png" alt="User Profile" className="w-full object-cover" />
        </div>

        <div className="space-y-4">
           <h3 className="text-xl font-bold italic">Profile Features:</h3>
           <ul className="grid gap-3">
              <li className="flex items-start gap-3">
                 <div className="size-5 rounded-full bg-green-500/10 flex items-center justify-center text-green-500 mt-0.5"><CheckSquare className="size-3" /></div>
                  <div>
                    <p className="text-sm font-bold">Profile Sync</p>
                    <p className="text-xs text-muted-foreground">Automatic synchronization with your <strong>Google</strong> or <strong>GitHub</strong> account for a seamless experience.</p>
                  </div>
              </li>
              <li className="flex items-start gap-3">
                 <div className="size-5 rounded-full bg-green-500/10 flex items-center justify-center text-green-500 mt-0.5"><CheckSquare className="size-3" /></div>
                 <div>
                    <p className="text-sm font-bold">Activity Tracking</p>
                    <p className="text-xs text-muted-foreground">Keep an eye on your assigned tasks and progress across all teams.</p>
                 </div>
              </li>
              <li className="flex items-start gap-3">
                 <div className="size-5 rounded-full bg-green-500/10 flex items-center justify-center text-green-500 mt-0.5"><CheckSquare className="size-3" /></div>
                 <div>
                    <p className="text-sm font-bold">Skills Management</p>
                    <p className="text-xs text-muted-foreground">Add and manage your skills to be discoverable in the Talent Marketplace.</p>
                 </div>
              </li>
              <li className="flex items-start gap-3">
                 <div className="size-5 rounded-full bg-green-500/10 flex items-center justify-center text-green-500 mt-0.5"><CheckSquare className="size-3" /></div>
                 <div>
                    <p className="text-sm font-bold">Social Links</p>
                    <p className="text-xs text-muted-foreground">Connect your GitHub, LinkedIn, Facebook, and WhatsApp profiles.</p>
                 </div>
              </li>
              <li className="flex items-start gap-3">
                 <div className="size-5 rounded-full bg-green-500/10 flex items-center justify-center text-green-500 mt-0.5"><CheckSquare className="size-3" /></div>
                 <div>
                    <p className="text-sm font-bold">Availability Status</p>
                    <p className="text-xs text-muted-foreground">Toggle your availability to appear or hide from the Talent Marketplace.</p>
                 </div>
              </li>
           </ul>
        </div>

        <div className="p-4 bg-primary/5 rounded-xl border border-primary/20">
          <p className="text-sm font-bold flex items-center gap-2"><GraduationCap className="size-4 text-primary" /> Academic Information</p>
          <p className="text-xs text-muted-foreground mt-1">Your profile includes your faculty, study level, department, and bio - helping others find the right collaborators.</p>
        </div>
      </div>
    )
  },
  { 
    id: "teams", 
    title: "Teams & Workforce", 
    icon: <Users className="size-4" />,
    content: (
      <div className="space-y-6">
        <h2 className="text-3xl font-black italic">👥 Team Power</h2>
        <p className="text-muted-foreground">Collaborate effectively by grouping members into functional teams and departments.</p>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="rounded-xl overflow-hidden border bg-muted/20">
            <img src="/Morx/Team.png" alt="Team Overview" className="w-full h-full object-cover" />
          </div>
          <div className="rounded-xl overflow-hidden border bg-muted/20">
            <img src="/Morx/team 2.png" alt="Team Dashboard" className="w-full h-full object-cover" />
          </div>
        </div>

        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="create" className="border rounded-xl px-4 mb-3">
            <AccordionTrigger className="hover:no-underline py-4">
              <div className="flex items-center gap-3">
                 <div className="size-8 rounded-lg bg-green-500/10 flex items-center justify-center text-green-500"><UserPlus className="size-4" /></div>
                 <div className="text-left">
                    <p className="text-sm font-bold">Creating a Team</p>
                    <p className="text-xs text-muted-foreground font-normal">Set up your own team in minutes.</p>
                 </div>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-4 pt-2 pb-4">
                <p className="text-sm text-muted-foreground">When creating a team, you'll provide:</p>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2"><div className="size-1.5 rounded-full bg-primary" /> <strong>Team Name</strong> - A unique identifier (auto-generates URL)</li>
                  <li className="flex items-center gap-2"><div className="size-1.5 rounded-full bg-primary" /> <strong>Description</strong> - What your team is about</li>
                  <li className="flex items-center gap-2"><div className="size-1.5 rounded-full bg-primary" /> <strong>Visibility</strong> - Public (discoverable) or Private (invite-only)</li>
                  <li className="flex items-center gap-2"><div className="size-1.5 rounded-full bg-primary" /> <strong>Team Type</strong> - Basic or Determinated (with purpose & subject)</li>
                  <li className="flex items-center gap-2"><div className="size-1.5 rounded-full bg-primary" /> <strong>Purpose</strong> - Gaming, Business, Development, or FCDS</li>
                  <li className="flex items-center gap-2"><div className="size-1.5 rounded-full bg-primary" /> <strong>Required Skills</strong> - For AI-powered talent matching</li>
                </ul>
                <div className="p-3 bg-primary/5 rounded-lg text-xs">
                  <strong>Note:</strong> The creator automatically becomes the team Owner.
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="visibility" className="border rounded-xl px-4 mb-3">
            <AccordionTrigger className="hover:no-underline py-4">
              <div className="flex items-center gap-3">
                 <div className="size-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-500"><Globe className="size-4" /></div>
                 <div className="text-left">
                    <p className="text-sm font-bold">Public vs Private Teams</p>
                    <p className="text-xs text-muted-foreground font-normal">Control who can discover and join your team.</p>
                 </div>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-4 pt-2 pb-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="p-4 border rounded-xl bg-green-500/5 border-green-500/20">
                    <p className="text-sm font-bold text-green-600 mb-2">🌐 Public Teams</p>
                    <ul className="space-y-1 text-xs text-muted-foreground">
                      <li>• Visible in Browse Teams page</li>
                      <li>• Anyone can request to join</li>
                      <li>• Searchable by name, tags, subject</li>
                      <li>• Great for open communities</li>
                    </ul>
                  </div>
                  <div className="p-4 border rounded-xl bg-orange-500/5 border-orange-500/20">
                    <p className="text-sm font-bold text-orange-600 mb-2">🔒 Private Teams</p>
                    <ul className="space-y-1 text-xs text-muted-foreground">
                      <li>• Hidden from public browse</li>
                      <li>• Invitation-only access</li>
                      <li>• Perfect for closed projects</li>
                      <li>• Maximum privacy control</li>
                    </ul>
                  </div>
                </div>
                <div className="rounded-2xl overflow-hidden border bg-muted/20 border-primary/20">
                  <img src="/Morx/public teams.png" alt="Public Teams Explorer" className="w-full object-cover" />
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="roles" className="border rounded-xl px-4 mb-3">
            <AccordionTrigger className="hover:no-underline py-4">
              <div className="flex items-center gap-3">
                 <div className="size-8 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-500"><Crown className="size-4" /></div>
                 <div className="text-left">
                    <p className="text-sm font-bold">Team Roles & Permissions</p>
                    <p className="text-xs text-muted-foreground font-normal">Understand what each role can do.</p>
                 </div>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-4 pt-2 pb-4">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2 px-3">Permission</th>
                        <th className="text-center py-2 px-3">👑 Owner</th>
                        <th className="text-center py-2 px-3">🛡️ Admin</th>
                        <th className="text-center py-2 px-3">👤 Member</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      <tr><td className="py-2 px-3">Delete Team</td><td className="text-center">✅</td><td className="text-center">❌</td><td className="text-center">❌</td></tr>
                      <tr><td className="py-2 px-3">Update Team Settings</td><td className="text-center">✅</td><td className="text-center">✅</td><td className="text-center">❌</td></tr>
                      <tr><td className="py-2 px-3">Change Visibility</td><td className="text-center">✅</td><td className="text-center">✅</td><td className="text-center">❌</td></tr>
                      <tr><td className="py-2 px-3">Add/Remove Members</td><td className="text-center">✅</td><td className="text-center">✅</td><td className="text-center">❌</td></tr>
                      <tr><td className="py-2 px-3">Change Member Roles</td><td className="text-center">✅</td><td className="text-center">✅</td><td className="text-center">❌</td></tr>
                      <tr><td className="py-2 px-3">Approve Join Requests</td><td className="text-center">✅</td><td className="text-center">✅</td><td className="text-center">❌</td></tr>
                      <tr><td className="py-2 px-3">Create Projects</td><td className="text-center">✅</td><td className="text-center">✅</td><td className="text-center">❌</td></tr>
                      <tr><td className="py-2 px-3">Create Tasks</td><td className="text-center">✅</td><td className="text-center">✅</td><td className="text-center">❌</td></tr>
                      <tr><td className="py-2 px-3">Assign Tasks</td><td className="text-center">✅</td><td className="text-center">✅</td><td className="text-center">❌</td></tr>
                      <tr><td className="py-2 px-3">Edit Task Status</td><td className="text-center">✅</td><td className="text-center">✅</td><td className="text-center">✅</td></tr>
                      <tr><td className="py-2 px-3">Add Comments</td><td className="text-center">✅</td><td className="text-center">✅</td><td className="text-center">✅</td></tr>
                      <tr><td className="py-2 px-3">View Team Stats</td><td className="text-center">✅</td><td className="text-center">✅</td><td className="text-center">✅</td></tr>
                    </tbody>
                  </table>
                </div>
                <div className="rounded-xl overflow-hidden border border-primary/20 bg-background">
                  <img src="/Morx/admin vs owner.png" alt="Admin vs Owner comparison" className="w-full" />
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="members" className="border rounded-xl px-4 mb-3">
            <AccordionTrigger className="hover:no-underline py-4">
              <div className="flex items-center gap-3">
                 <div className="size-8 rounded-lg bg-cyan-500/10 flex items-center justify-center text-cyan-500"><Users className="size-4" /></div>
                 <div className="text-left">
                    <p className="text-sm font-bold">Member Management</p>
                    <p className="text-xs text-muted-foreground font-normal">Add, remove, and manage team members.</p>
                 </div>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-4 pt-2 pb-4">
                <p className="text-sm text-muted-foreground">Owners and admins can manage team members:</p>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2"><div className="size-1.5 rounded-full bg-green-500" /> <strong>Add by Email</strong> - Invite users directly by their email address</li>
                  <li className="flex items-center gap-2"><div className="size-1.5 rounded-full bg-blue-500" /> <strong>From Marketplace</strong> - Invite talent from the Talent Marketplace</li>
                  <li className="flex items-center gap-2"><div className="size-1.5 rounded-full bg-purple-500" /> <strong>Change Roles</strong> - Promote members to admin or demote</li>
                  <li className="flex items-center gap-2"><div className="size-1.5 rounded-full bg-red-500" /> <strong>Remove Members</strong> - Remove users from the team</li>
                </ul>
                <div className="p-3 bg-yellow-500/10 rounded-lg border border-yellow-500/20 text-xs">
                  <strong>⚠️ Member Limits:</strong> The number of members you can add depends on the team owner's subscription plan (Free: 15, Starter: 50, Professional: 80, Enterprise: Unlimited).
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        <div className="grid sm:grid-cols-2 gap-4 mt-8">
          <div className="p-5 bg-destructive/5 border border-destructive/10 rounded-2xl space-y-3">
             <div className="flex items-center gap-2 text-destructive">
                <Trash2 className="size-4" />
                <p className="text-sm font-bold">Team Dissolution</p>
             </div>
             <p className="text-xs text-muted-foreground">Only owners can completely delete a team. This action is irreversible and removes all projects, tasks, and data.</p>
             <div className="rounded-xl overflow-hidden border border-destructive/20">
                <img src="/Morx/delete team.png" alt="Delete Team" className="w-full" />
             </div>
          </div>
          <div className="p-5 bg-orange-500/5 border border-orange-500/10 rounded-2xl space-y-3">
             <div className="flex items-center gap-2 text-orange-500">
                <LogOut className="size-4" />
                <p className="text-sm font-bold">Leaving a Team</p>
             </div>
             <p className="text-xs text-muted-foreground">Members can leave teams at any time, but will lose access to team resources. Owners cannot leave without transferring ownership.</p>
             <div className="rounded-xl overflow-hidden border border-orange-500/20">
                <img src="/Morx/leave team.png" alt="Leave Team" className="w-full" />
             </div>
          </div>
        </div>
      </div>
    )
  },
  { 
    id: "projects", 
    title: "Projects", 
    icon: <FolderLock className="size-4" />,
    content: (
      <div className="space-y-6">
        <h2 className="text-3xl font-black italic">📁 Projects</h2>
        <p className="text-muted-foreground">Projects are containers for your tasks within a team. Organize work by project to keep things structured.</p>
        
        <div className="p-4 bg-amber-500/5 rounded-xl border-l-4 border-amber-500">
          <p className="font-bold flex items-center gap-2"><Shield className="size-4 text-amber-500" /> Permission Required</p>
          <p className="text-sm mt-1">Only team <strong>Owners</strong> and <strong>Admins</strong> can create projects within a team.</p>
        </div>

        <div className="space-y-4">
          <h3 className="text-xl font-bold italic">Project Features:</h3>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="p-4 border rounded-xl">
              <div className="size-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary mb-3">
                <FolderLock className="size-5" />
              </div>
              <p className="text-sm font-bold">Create Project</p>
              <p className="text-xs text-muted-foreground mt-1">Set a project name and description. The URL is auto-generated.</p>
            </div>
            <div className="p-4 border rounded-xl">
              <div className="size-10 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-500 mb-3">
                <Settings className="size-5" />
              </div>
              <p className="text-sm font-bold">Edit Project</p>
              <p className="text-xs text-muted-foreground mt-1">Update project name and description at any time.</p>
            </div>
            <div className="p-4 border rounded-xl">
              <div className="size-10 rounded-lg bg-green-500/10 flex items-center justify-center text-green-500 mb-3">
                <BarChart4 className="size-5" />
              </div>
              <p className="text-sm font-bold">Progress Tracking</p>
              <p className="text-xs text-muted-foreground mt-1">Visual progress bar showing task completion percentage.</p>
            </div>
            <div className="p-4 border rounded-xl">
              <div className="size-10 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-500 mb-3">
                <Users className="size-5" />
              </div>
              <p className="text-sm font-bold">Team Access</p>
              <p className="text-xs text-muted-foreground mt-1">All team members automatically have access to team projects.</p>
            </div>
          </div>
        </div>

        <div className="p-5 bg-destructive/5 border border-destructive/10 rounded-2xl mt-6 space-y-3">
           <div className="flex items-center gap-2 text-destructive">
              <Trash2 className="size-4" />
              <p className="text-sm font-bold">Project Deletion</p>
           </div>
           <div className="flex flex-col md:flex-row gap-6">
              <div className="flex-1">
                 <p className="text-xs text-muted-foreground mb-4">Deleting a project will permanently remove all associated tasks, comments, files, and documentation. Ensure you have backed up any necessary data before proceeding.</p>
                 <div className="p-3 bg-background rounded-lg border border-destructive/20 text-[10px] italic">
                    Note: Only the team owner or admin can delete projects. Deletion requires confirmation by typing the project name.
                 </div>
              </div>
              <div className="shrink-0 w-full md:w-64 rounded-xl overflow-hidden border border-destructive/20 bg-background">
                 <img src="/Morx/delete project.png" alt="Delete Project" className="w-full" />
              </div>
           </div>
        </div>
      </div>
    )
  },
  { 
    id: "tasks", 
    title: "Task Management", 
    icon: <CheckSquare className="size-4" />,
    content: (
      <div className="space-y-6">
        <h2 className="text-3xl font-black italic">✅ Task Management</h2>
        <p className="text-muted-foreground">Our powerful task management system helps you track work from start to finish with multiple views and AI assistance.</p>
        
        <div className="p-4 bg-amber-500/5 rounded-xl border-l-4 border-amber-500">
          <p className="font-bold flex items-center gap-2"><Shield className="size-4 text-amber-500" /> Task Creation Permission</p>
          <p className="text-sm mt-1">Only team <strong>Owners</strong> and <strong>Admins</strong> can create new tasks. All members can update task status, priority, and due dates.</p>
        </div>
        
        <div className="rounded-2xl overflow-hidden border bg-muted/20">
          <img src="/Morx/tasks.png" alt="Tasks Board" className="w-full object-cover" />
        </div>

        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="create" className="border rounded-xl px-4 mb-3">
            <AccordionTrigger className="hover:no-underline py-4">
              <div className="flex items-center gap-3">
                 <div className="size-8 rounded-lg bg-green-500/10 flex items-center justify-center text-green-500"><CheckSquare className="size-4" /></div>
                 <div className="text-left">
                    <p className="text-sm font-bold">Creating Tasks</p>
                    <p className="text-xs text-muted-foreground font-normal">Add new tasks with details and assignments.</p>
                 </div>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-4 pt-2 pb-4">
                <p className="text-sm text-muted-foreground">When creating a task, you can set:</p>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2"><div className="size-1.5 rounded-full bg-primary" /> <strong>Title</strong> - Task name (required)</li>
                  <li className="flex items-center gap-2"><div className="size-1.5 rounded-full bg-primary" /> <strong>Description</strong> - Detailed information</li>
                  <li className="flex items-center gap-2"><div className="size-1.5 rounded-full bg-primary" /> <strong>Priority</strong> - Low, Medium, or High</li>
                  <li className="flex items-center gap-2"><div className="size-1.5 rounded-full bg-primary" /> <strong>Due Date</strong> - Deadline for completion</li>
                  <li className="flex items-center gap-2"><div className="size-1.5 rounded-full bg-primary" /> <strong>Assignees</strong> - Team members to work on the task</li>
                </ul>
                <div className="p-3 bg-primary/5 rounded-lg text-xs">
                  <strong>💡 Tip:</strong> Assigned members receive a notification about the new task.
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="views" className="border rounded-xl px-4 mb-3">
            <AccordionTrigger className="hover:no-underline py-4">
              <div className="flex items-center gap-3">
                 <div className="size-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-500"><LayoutGrid className="size-4" /></div>
                 <div className="text-left">
                    <p className="text-sm font-bold">Task Views</p>
                    <p className="text-xs text-muted-foreground font-normal">Multiple ways to visualize your tasks.</p>
                 </div>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-4 pt-2 pb-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="p-4 border rounded-xl">
                    <div className="flex items-center gap-2 mb-2">
                      <LayoutGrid className="size-4 text-primary" />
                      <p className="text-sm font-bold">Kanban Board</p>
                    </div>
                    <p className="text-xs text-muted-foreground">Drag-and-drop tasks between columns: Todo, In Progress, and Done.</p>
                  </div>
                  <div className="p-4 border rounded-xl">
                    <div className="flex items-center gap-2 mb-2">
                      <Calendar className="size-4 text-primary" />
                      <p className="text-sm font-bold">Calendar View</p>
                    </div>
                    <p className="text-xs text-muted-foreground">View tasks on a calendar organized by due date.</p>
                  </div>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="ai" className="border rounded-xl px-4 mb-3">
            <AccordionTrigger className="hover:no-underline py-4">
              <div className="flex items-center gap-3">
                 <div className="size-8 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-500"><Sparkles className="size-4" /></div>
                 <div className="text-left">
                    <p className="text-sm font-bold">AI Task Suggestions</p>
                    <p className="text-xs text-muted-foreground font-normal">Let AI help you plan your tasks.</p>
                 </div>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-4 pt-2 pb-4">
                <p className="text-sm text-muted-foreground">Use the <strong>"AI Suggest"</strong> button to get intelligent task suggestions based on your project context.</p>
                <div className="grid gap-3">
                  <div className="p-3 bg-purple-500/5 rounded-lg border border-purple-500/20">
                    <p className="text-xs"><strong>How it works:</strong></p>
                    <ol className="list-decimal list-inside text-xs text-muted-foreground mt-1 space-y-1">
                      <li>Click the "AI Suggest" button on the project page</li>
                      <li>AI analyzes your project and existing tasks</li>
                      <li>Receive 5 smart task suggestions</li>
                      <li>Click any suggestion to auto-fill the task form</li>
                    </ol>
                  </div>
                  <div className="p-3 bg-yellow-500/10 rounded-lg border border-yellow-500/20 text-xs">
                    <strong>⚠️ AI Limits:</strong> Daily AI usage depends on your plan (Free: 5, Starter: 10, Professional: 20, Enterprise: Unlimited).
                  </div>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="features" className="border rounded-xl px-4 mb-3">
            <AccordionTrigger className="hover:no-underline py-4">
              <div className="flex items-center gap-3">
                 <div className="size-8 rounded-lg bg-cyan-500/10 flex items-center justify-center text-cyan-500"><FileText className="size-4" /></div>
                 <div className="text-left">
                    <p className="text-sm font-bold">Task Features</p>
                    <p className="text-xs text-muted-foreground font-normal">Documentation, comments, files, and more.</p>
                 </div>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-4 pt-2 pb-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="p-3 border rounded-lg">
                    <div className="flex items-center gap-2 mb-1">
                      <FileText className="size-4 text-blue-500" />
                      <p className="text-sm font-bold">Documentation</p>
                    </div>
                    <p className="text-xs text-muted-foreground">Rich text documentation with Markdown support for each task.</p>
                  </div>
                  <div className="p-3 border rounded-lg">
                    <div className="flex items-center gap-2 mb-1">
                      <MessageSquare className="size-4 text-green-500" />
                      <p className="text-sm font-bold">Comments</p>
                    </div>
                    <p className="text-xs text-muted-foreground">Discuss tasks with team members through comments.</p>
                  </div>
                  <div className="p-3 border rounded-lg">
                    <div className="flex items-center gap-2 mb-1">
                      <Upload className="size-4 text-orange-500" />
                      <p className="text-sm font-bold">File Attachments</p>
                    </div>
                    <p className="text-xs text-muted-foreground">Upload and share files related to tasks.</p>
                  </div>
                  <div className="p-3 border rounded-lg">
                    <div className="flex items-center gap-2 mb-1">
                      <Users className="size-4 text-purple-500" />
                      <p className="text-sm font-bold">Assignments</p>
                    </div>
                    <p className="text-xs text-muted-foreground">Assign multiple team members to work on tasks.</p>
                  </div>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        <div className="grid sm:grid-cols-3 gap-4">
           <div className="rounded-xl overflow-hidden border bg-muted/10 p-2">
              <p className="text-[10px] font-bold text-center mb-1 uppercase">Assign Users</p>
              <img src="/Morx/assign users.png" alt="Assigning Users" className="w-full rounded" />
           </div>
           <div className="rounded-xl overflow-hidden border bg-muted/10 p-2">
              <p className="text-[10px] font-bold text-center mb-1 uppercase">Move & Organize</p>
              <img src="/Morx/move task.png" alt="Moving Tasks" className="w-full rounded" />
           </div>
           <div className="rounded-xl overflow-hidden border bg-muted/10 p-2">
              <p className="text-[10px] font-bold text-center mb-1 uppercase">Advanced Edit</p>
              <img src="/Morx/edit task.png" alt="Editing Tasks" className="w-full rounded" />
           </div>
        </div>

        <div className="rounded-2xl overflow-hidden border bg-muted/20">
          <p className="p-3 text-xs font-bold bg-muted/30">Strategic Planning View</p>
          <img src="/Morx/plan.png" alt="Strategic Plan" className="w-full object-cover" />
        </div>
      </div>
    )
  },
  { 
    id: "marketplace", 
    title: "Talent Marketplace", 
    icon: <Briefcase className="size-4" />,
    content: (
      <div className="space-y-6">
        <h2 className="text-3xl font-black italic">🏆 Talent Marketplace</h2>
        <p className="text-muted-foreground">Need developers, designers, or writers? Find the best talent directly within our internal ecosystem.</p>
        
        <div className="rounded-2xl overflow-hidden border bg-muted/20">
          <img src="/Morx/Talent.png" alt="Talent Marketplace" className="w-full object-cover" />
        </div>

        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="browse" className="border rounded-xl px-4 mb-3">
            <AccordionTrigger className="hover:no-underline py-4">
              <div className="flex items-center gap-3">
                 <div className="size-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-500"><Search className="size-4" /></div>
                 <div className="text-left">
                    <p className="text-sm font-bold">Browse Talent</p>
                    <p className="text-xs text-muted-foreground font-normal">Search and filter available professionals.</p>
                 </div>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-4 pt-2 pb-4">
                <p className="text-sm text-muted-foreground">Discover talented individuals who have set themselves as "available" in their profile settings.</p>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2"><div className="size-1.5 rounded-full bg-primary" /> <strong>Search by Skills</strong> - Find users with specific expertise</li>
                  <li className="flex items-center gap-2"><div className="size-1.5 rounded-full bg-primary" /> <strong>Filter by Department</strong> - Browse by academic department</li>
                  <li className="flex items-center gap-2"><div className="size-1.5 rounded-full bg-primary" /> <strong>View Profiles</strong> - See skills, bio, and social links</li>
                </ul>
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="invite" className="border rounded-xl px-4 mb-3">
            <AccordionTrigger className="hover:no-underline py-4">
              <div className="flex items-center gap-3">
                 <div className="size-8 rounded-lg bg-green-500/10 flex items-center justify-center text-green-500"><UserPlus className="size-4" /></div>
                 <div className="text-left">
                    <p className="text-sm font-bold">Send Invitations</p>
                    <p className="text-xs text-muted-foreground font-normal">Invite talent to join your team.</p>
                 </div>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-4 pt-2 pb-4">
                <p className="text-sm text-muted-foreground">As a team owner or admin, you can invite users to join your team:</p>
                <ol className="list-decimal list-inside text-sm space-y-2 text-muted-foreground">
                  <li>Browse the talent marketplace and find a suitable candidate</li>
                  <li>Click "Invite to Team" on their profile</li>
                  <li>Select which team to invite them to</li>
                  <li>Add an optional message</li>
                  <li>The user receives a notification and can accept or decline</li>
                </ol>
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="ai-match" className="border rounded-xl px-4 mb-3">
            <AccordionTrigger className="hover:no-underline py-4">
              <div className="flex items-center gap-3">
                 <div className="size-8 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-500"><Bot className="size-4" /></div>
                 <div className="text-left">
                    <p className="text-sm font-bold">AI Talent Matching</p>
                    <p className="text-xs text-muted-foreground font-normal">Let AI find the best candidates for your team.</p>
                 </div>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-4 pt-2 pb-4">
                <p className="text-sm text-muted-foreground">If your team has defined required skills, AI can automatically match candidates:</p>
                <div className="p-3 bg-purple-500/5 rounded-lg border border-purple-500/20">
                  <p className="text-xs"><strong>How it works:</strong></p>
                  <ol className="list-decimal list-inside text-xs text-muted-foreground mt-1 space-y-1">
                    <li>Set required skills in your team settings</li>
                    <li>AI analyzes candidate skills and experience</li>
                    <li>Receive ranked matches with explanations</li>
                    <li>Invite top matches with one click</li>
                  </ol>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        <div className="p-6 bg-secondary/5 rounded-2xl border border-secondary/20">
           <h4 className="font-bold flex items-center gap-2 mb-2"><HelpCircle className="size-4" /> Smart Recruitment Process</h4>
           <ol className="list-decimal list-inside text-sm space-y-2 text-muted-foreground">
              <li>Search for talent based on their department or skills.</li>
              <li>View their profile, previous contributions, and social links.</li>
              <li>Send a formal invitation to join your specific team.</li>
              <li>Track pending invitations in your Invitations page.</li>
           </ol>
        </div>
      </div>
    )
  },
  { 
    id: "invites", 
    title: "Invites & Requests", 
    icon: <Bell className="size-4" />,
    content: (
      <div className="space-y-6">
        <h2 className="text-3xl font-black italic">📨 Managing Invitations</h2>
        <p className="text-muted-foreground">Track all incoming requests and outgoing invitations in one centralized place.</p>
        
        <div className="grid gap-4">
          <div className="rounded-2xl overflow-hidden border bg-muted/20">
            <img src="/Morx/invite 1.png" alt="Invitation View" className="w-full object-cover" />
          </div>
          <div className="grid grid-cols-2 gap-4">
             <div className="rounded-xl overflow-hidden border bg-muted/20">
               <img src="/Morx/request.png" alt="Team Requests" className="w-full h-full object-cover" />
             </div>
             <div className="rounded-xl overflow-hidden border bg-muted/20">
               <img src="/Morx/request to pub team.png" alt="Public Team Requests" className="w-full h-full object-cover" />
             </div>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div className="p-4 border rounded-xl">
            <p className="text-sm font-bold mb-2">📥 Incoming</p>
            <ul className="space-y-1 text-xs text-muted-foreground">
              <li>• Team invitations from other users</li>
              <li>• Accept or decline invitations</li>
              <li>• View invitation details and messages</li>
            </ul>
          </div>
          <div className="p-4 border rounded-xl">
            <p className="text-sm font-bold mb-2">📤 Outgoing</p>
            <ul className="space-y-1 text-xs text-muted-foreground">
              <li>• Join requests you've sent to teams</li>
              <li>• Track request status (pending/approved/rejected)</li>
              <li>• Invitations you've sent to users</li>
            </ul>
          </div>
        </div>

        <div className="p-4 bg-blue-500/5 rounded-xl border border-blue-500/20">
          <p className="text-sm font-bold mb-2">Join Request Flow</p>
          <ol className="list-decimal list-inside text-xs text-muted-foreground space-y-1">
            <li>User finds a public team and clicks "Request to Join"</li>
            <li>Team owners and admins receive a notification</li>
            <li>Owner/admin approves or rejects the request</li>
            <li>User receives notification of the decision</li>
          </ol>
        </div>
      </div>
    )
  },
  { 
    id: "templates", 
    title: "Templates", 
    icon: <LayoutTemplate className="size-4" />,
    content: (
      <div className="space-y-6">
        <h2 className="text-3xl font-black italic">📋 Smart Templates</h2>
        <p className="text-muted-foreground">Don't start from scratch. Use templates to replicate proven workflows in seconds.</p>
        
        <div className="rounded-2xl overflow-hidden border bg-muted/20">
          <img src="/Morx/templates.png" alt="Template Library" className="w-full object-cover" />
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div className="p-4 border rounded-xl">
            <div className="flex items-center gap-2 mb-2">
              <LayoutTemplate className="size-4 text-primary" />
              <p className="text-sm font-bold">Browse Templates</p>
            </div>
            <ul className="space-y-1 text-xs text-muted-foreground">
              <li>• Search by name or category</li>
              <li>• Filter by: Development, Marketing, Design, Product, Business</li>
              <li>• View ratings and usage counts</li>
            </ul>
          </div>
          <div className="p-4 border rounded-xl">
            <div className="flex items-center gap-2 mb-2">
              <Star className="size-4 text-yellow-500" />
              <p className="text-sm font-bold">Template Details</p>
            </div>
            <ul className="space-y-1 text-xs text-muted-foreground">
              <li>• View all tasks in the template</li>
              <li>• See suggested priorities</li>
              <li>• Rate templates (1-5 stars)</li>
            </ul>
          </div>
        </div>

        <div className="p-5 bg-primary/5 rounded-2xl border border-primary/20">
          <h4 className="font-bold mb-3">How to Use Templates</h4>
          <ol className="list-decimal list-inside text-sm space-y-2 text-muted-foreground">
            <li>Browse the template library and select a template</li>
            <li>Review the tasks included in the template</li>
            <li>Click "Apply to Project" and select your target project</li>
            <li>All template tasks are automatically created in your project</li>
          </ol>
        </div>

        <div className="grid sm:grid-cols-5 gap-3">
          {['Development', 'Marketing', 'Design', 'Product', 'Business'].map((category) => (
            <div key={category} className="p-3 border rounded-xl text-center">
              <p className="text-xs font-bold">{category}</p>
            </div>
          ))}
        </div>

        <p className="text-sm text-muted-foreground">Our template library includes pre-built structures for Software Development, UI/UX Research, Marketing Campaigns, Product Launches, and academic projects. You can also create your own custom templates!</p>
      </div>
    )
  },
  { 
    id: "analytics", 
    title: "Analytics", 
    icon: <BarChart4 className="size-4" />,
    content: (
      <div className="space-y-6">
        <h2 className="text-3xl font-black italic">📊 Powerful Analytics</h2>
        <p className="text-muted-foreground">Visualize your success. Our reporting engine turns task data into beautiful, actionable charts.</p>
        
        <div className="rounded-2xl overflow-hidden border bg-muted/20">
          <img src="/Morx/reports.png" alt="Reporting Dashboard" className="w-full object-cover" />
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div className="p-4 border rounded-xl">
            <p className="text-sm font-bold mb-2">📈 Team Statistics</p>
            <ul className="space-y-1 text-xs text-muted-foreground">
              <li>• Task completion rates</li>
              <li>• Tasks by status (Todo, In Progress, Done)</li>
              <li>• Tasks by priority distribution</li>
              <li>• Member workload analysis</li>
            </ul>
          </div>
          <div className="p-4 border rounded-xl">
            <p className="text-sm font-bold mb-2">📊 Project Insights</p>
            <ul className="space-y-1 text-xs text-muted-foreground">
              <li>• Progress tracking per project</li>
              <li>• Completion percentage</li>
              <li>• Overdue task tracking</li>
              <li>• Activity timeline</li>
            </ul>
          </div>
        </div>

        <div className="p-4 bg-muted/40 rounded-xl">
           <p className="text-xs italic text-muted-foreground">"Data matures your team. Morx matures your data."</p>
        </div>
      </div>
    )
  },
  { 
    id: "notifications", 
    title: "Notifications", 
    icon: <Bell className="size-4" />,
    content: (
      <div className="space-y-6">
        <h2 className="text-3xl font-black italic">🔔 Real-time Alerts</h2>
        <p className="text-muted-foreground">Never miss a deadline or a team update with our real-time notification system powered by Supabase Realtime.</p>
        
        <div className="space-y-4">
           <div className="rounded-xl border p-4 flex items-center justify-center bg-muted/5 max-w-sm mx-auto">
              <img src="/Morx/Notification 1.png" alt="Notification Menu" className="max-w-full shadow-sm rounded-lg" />
           </div>
           <div className="rounded-2xl border overflow-hidden bg-muted/5">
              <img src="/Morx/Notification 2.png" alt="Notifications Panel" className="w-full object-cover" />
           </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-bold">Notification Types</h3>
          <div className="grid sm:grid-cols-2 gap-3">
            <div className="p-3 border rounded-lg flex items-start gap-3">
              <span className="text-lg">📝</span>
              <div>
                <p className="text-sm font-bold">Task Assigned</p>
                <p className="text-xs text-muted-foreground">When you're assigned to a new task</p>
              </div>
            </div>
            <div className="p-3 border rounded-lg flex items-start gap-3">
              <span className="text-lg">⏰</span>
              <div>
                <p className="text-sm font-bold">Due Soon</p>
                <p className="text-xs text-muted-foreground">Task due within 24 hours</p>
              </div>
            </div>
            <div className="p-3 border rounded-lg flex items-start gap-3">
              <span className="text-lg">✅</span>
              <div>
                <p className="text-sm font-bold">Task Completed</p>
                <p className="text-xs text-muted-foreground">When a task is marked as done</p>
              </div>
            </div>
            <div className="p-3 border rounded-lg flex items-start gap-3">
              <span className="text-lg">📅</span>
              <div>
                <p className="text-sm font-bold">Date Changed</p>
                <p className="text-xs text-muted-foreground">Due date has been modified</p>
              </div>
            </div>
            <div className="p-3 border rounded-lg flex items-start gap-3">
              <span className="text-lg">👥</span>
              <div>
                <p className="text-sm font-bold">Added to Team</p>
                <p className="text-xs text-muted-foreground">When you're added to a team</p>
              </div>
            </div>
            <div className="p-3 border rounded-lg flex items-start gap-3">
              <span className="text-lg">🤝</span>
              <div>
                <p className="text-sm font-bold">Join Request</p>
                <p className="text-xs text-muted-foreground">Someone wants to join your team</p>
              </div>
            </div>
            <div className="p-3 border rounded-lg flex items-start gap-3">
              <span className="text-lg">📩</span>
              <div>
                <p className="text-sm font-bold">Team Invitation</p>
                <p className="text-xs text-muted-foreground">You've been invited to a team</p>
              </div>
            </div>
            <div className="p-3 border rounded-lg flex items-start gap-3">
              <span className="text-lg">⚡</span>
              <div>
                <p className="text-sm font-bold">Priority Changed</p>
                <p className="text-xs text-muted-foreground">Task priority has been updated</p>
              </div>
            </div>
          </div>
        </div>

        <div className="p-4 bg-primary/5 rounded-xl border border-primary/20">
          <p className="text-sm font-bold mb-1">Mark as Read</p>
          <p className="text-xs text-muted-foreground">Click any notification to mark it as read, or use "Mark all as read" to clear all unread notifications at once.</p>
        </div>
      </div>
    )
  },
  { 
    id: "settings", 
    title: "Settings", 
    icon: <Settings className="size-4" />,
    content: (
      <div className="space-y-6">
        <h2 className="text-3xl font-black italic">⚙️ Settings & Customization</h2>
        <p className="text-muted-foreground">Personalize your Morx experience with extensive customization options.</p>
        
        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="profile" className="border rounded-xl px-4 mb-3">
            <AccordionTrigger className="hover:no-underline py-4">
              <div className="flex items-center gap-3">
                 <div className="size-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-500"><Users className="size-4" /></div>
                 <div className="text-left">
                    <p className="text-sm font-bold">Profile Settings</p>
                    <p className="text-xs text-muted-foreground font-normal">Personal information and account details.</p>
                 </div>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-3 pt-2 pb-4">
                <p className="text-sm text-muted-foreground">Update your personal information:</p>
                <ul className="space-y-1 text-sm">
                  <li>• First name and last name</li>
                  <li>• Password (securely hashed)</li>
                  <li>• Study level and department</li>
                  <li>• Faculty information</li>
                  <li>• Personal bio</li>
                </ul>
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="theme" className="border rounded-xl px-4 mb-3">
            <AccordionTrigger className="hover:no-underline py-4">
              <div className="flex items-center gap-3">
                 <div className="size-8 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-500"><Palette className="size-4" /></div>
                 <div className="text-left">
                    <p className="text-sm font-bold">Appearance</p>
                    <p className="text-xs text-muted-foreground font-normal">Theme and color customization.</p>
                 </div>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-4 pt-2 pb-4">
                <div>
                  <p className="text-sm font-bold mb-2">Light/Dark Mode</p>
                  <div className="flex gap-2">
                    <div className="px-3 py-1.5 border rounded-lg text-xs">System</div>
                    <div className="px-3 py-1.5 border rounded-lg text-xs">Light</div>
                    <div className="px-3 py-1.5 border rounded-lg text-xs">Dark</div>
                  </div>
                </div>
                <div>
                  <p className="text-sm font-bold mb-2">Color Themes (15 options)</p>
                  <div className="flex flex-wrap gap-2">
                    {['Mint', 'Indigo', 'Ocean', 'Amber', 'Rose', 'Lavender', 'Forest', 'Sunset', 'Coral'].map(color => (
                      <div key={color} className="px-3 py-1 border rounded-lg text-[10px]">
                        {color}
                      </div>
                    ))}
                    <div className="px-3 py-1 border rounded-lg text-[10px] text-muted-foreground">+6 more</div>
                  </div>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="clock" className="border rounded-xl px-4 mb-3">
            <AccordionTrigger className="hover:no-underline py-4">
              <div className="flex items-center gap-3">
                 <div className="size-8 rounded-lg bg-cyan-500/10 flex items-center justify-center text-cyan-500"><Clock className="size-4" /></div>
                 <div className="text-left">
                    <p className="text-sm font-bold">Clock Settings</p>
                    <p className="text-xs text-muted-foreground font-normal">Time format and timezone.</p>
                 </div>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-3 pt-2 pb-4">
                <ul className="space-y-1 text-sm text-muted-foreground">
                  <li>• 12-hour or 24-hour format toggle</li>
                  <li>• 15+ timezone options</li>
                  <li>• Live preview of your settings</li>
                </ul>
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="professional" className="border rounded-xl px-4 mb-3">
            <AccordionTrigger className="hover:no-underline py-4">
              <div className="flex items-center gap-3">
                 <div className="size-8 rounded-lg bg-green-500/10 flex items-center justify-center text-green-500"><Briefcase className="size-4" /></div>
                 <div className="text-left">
                    <p className="text-sm font-bold">Professional Profile</p>
                    <p className="text-xs text-muted-foreground font-normal">Talent marketplace visibility.</p>
                 </div>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-3 pt-2 pb-4">
                <ul className="space-y-1 text-sm text-muted-foreground">
                  <li>• Toggle availability for Talent Marketplace</li>
                  <li>• Manage your skills list</li>
                  <li>• Configure social links (GitHub, LinkedIn, etc.)</li>
                </ul>
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="plan" className="border rounded-xl px-4 mb-3">
            <AccordionTrigger className="hover:no-underline py-4">
              <div className="flex items-center gap-3">
                 <div className="size-8 rounded-lg bg-yellow-500/10 flex items-center justify-center text-yellow-500"><Crown className="size-4" /></div>
                 <div className="text-left">
                    <p className="text-sm font-bold">Subscription Plan</p>
                    <p className="text-xs text-muted-foreground font-normal">View your plan and limits.</p>
                 </div>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-3 pt-2 pb-4">
                <p className="text-sm text-muted-foreground">View your current plan details:</p>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2 px-2">Feature</th>
                        <th className="text-center py-2 px-2">Free</th>
                        <th className="text-center py-2 px-2">Starter</th>
                        <th className="text-center py-2 px-2">Pro</th>
                        <th className="text-center py-2 px-2">Enterprise</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      <tr><td className="py-2 px-2">Team Members</td><td className="text-center">15</td><td className="text-center">50</td><td className="text-center">80</td><td className="text-center">∞</td></tr>
                      <tr><td className="py-2 px-2">AI Requests/Day</td><td className="text-center">5</td><td className="text-center">10</td><td className="text-center">20</td><td className="text-center">∞</td></tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        <div className="rounded-2xl overflow-hidden border bg-muted/20">
          <img src="/Morx/themes.png" alt="Theme Selector" className="w-full object-cover" />
        </div>
      </div>
    )
  },
  { 
    id: "ai-team-os", 
    title: "AI Team OS & Formulas", 
    icon: <Sparkles className="size-4" />,
    content: (
      <div className="space-y-6">
        <h2 className="text-3xl font-black italic flex items-center gap-2">🤖 Marlin AI Team OS</h2>
        <p className="text-muted-foreground">Morx transforms project spaces using a modular AI engine that calculates behavioral metrics, matches skills, runs health diagnostics, and utilizes semantic memory.</p>

        <div className="p-4 bg-primary/5 rounded-xl border-l-4 border-primary">
          <p className="font-bold">LaTeX Math & Calculations</p>
          <p className="text-sm mt-1">Below are the concise mathematical models used to power Marlin's analysis and indicators.</p>
        </div>

        <Accordion type="single" collapsible className="w-full space-y-3">
          <AccordionItem value="dna" className="border rounded-xl px-4">
            <AccordionTrigger className="hover:no-underline font-bold">🧬 AI Team DNA Profile</AccordionTrigger>
            <AccordionContent className="space-y-4 pt-2">
              <p className="text-sm text-muted-foreground">Evolves continuously based on user commits, task status, comments, and project timelines.</p>
              <div className="p-4 bg-muted/40 rounded-xl space-y-4">
                <div>
                  <p className="text-xs font-bold uppercase text-primary">1. Preferred Working Hours</p>
                  <p className="text-xs text-muted-foreground mb-2">Calculates the statistical mode of activity timestamps:</p>
                  <div className="bg-background p-3 rounded-lg border flex justify-center text-sm font-semibold">
                    {"$$\\text{Peak Hour} = \\text{mode}\\left(\\{ \\text{Hour}(c.\\text{created\\_at}) \\mid c \\in \\text{Comments} \\} \\cup \\{ \\text{Hour}(t.\\text{created\\_at}) \\mid t \\in \\text{Tasks} \\}\\right)$$"}
                  </div>
                </div>
                <div>
                  <p className="text-xs font-bold uppercase text-primary">2. Deadline Reliability</p>
                  <p className="text-xs text-muted-foreground mb-2">The percentage of assigned tasks completed before or on the due date:</p>
                  <div className="bg-background p-3 rounded-lg border flex justify-center text-sm font-semibold">
                    {"$$\\text{Reliability} = \\frac{\\text{Tasks Completed On Time}}{\\text{Total Assigned Tasks}} \\times 100\\%$$"}
                  </div>
                </div>
                <div>
                  <p className="text-xs font-bold uppercase text-primary">3. Collaboration Score</p>
                  <p className="text-xs text-muted-foreground mb-2">Quantifies messaging behavior and team integration:</p>
                  <div className="bg-background p-3 rounded-lg border flex justify-center text-sm font-semibold">
                    {"$$\\text{Collaboration} = \\min\\left(100, \\text{Comments Count} \\times 5 + \\text{Teams Joined} \\times 10\\right)$$"}
                  </div>
                </div>
                <div>
                  <p className="text-xs font-bold uppercase text-primary">4. Task Consistency</p>
                  <p className="text-xs text-muted-foreground mb-2">Measures completion variance via standard deviation $\sigma$:</p>
                  <div className="bg-background p-3 rounded-lg border flex justify-center text-sm font-semibold">
                    {"$$\\text{Consistency} = \\max\\left(0, 100 - \\sigma\\right)$$\n\n$$\\text{where } \\sigma = \\sqrt{\\frac{1}{N}\\sum_{i=1}^{N}(X_i - \\mu)^2}$$"}
                  </div>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="matching" className="border rounded-xl px-4">
            <AccordionTrigger className="hover:no-underline font-bold">🤝 Smart Team Matching</AccordionTrigger>
            <AccordionContent className="space-y-4 pt-2">
              <p className="text-sm text-muted-foreground">Finds the best-suited student candidates for projects based on skills and reliability DNA.</p>
              <div className="p-4 bg-muted/40 rounded-xl space-y-2">
                <p className="text-xs font-bold uppercase text-primary">Compatibility Score Formula</p>
                <div className="bg-background p-3 rounded-lg border flex justify-center text-sm font-semibold">
                  {"$$\\text{Compatibility} = 0.4 \\times \\text{Skills Match} + 0.3 \\times \\text{Reliability} + 0.3 \\times \\text{Collaboration}$$"}
                </div>
                <p className="text-xs text-muted-foreground">Where the Skills Match ratio is computed as:</p>
                <div className="bg-background p-3 rounded-lg border flex justify-center text-sm font-semibold">
                  {"$$\\text{Skills Match} = \\frac{\\text{Candidate Skills} \\cap \\text{Project Required Skills}}{\\text{Project Required Skills}} \\times 100\\%$$"}
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="health" className="border rounded-xl px-4">
            <AccordionTrigger className="hover:no-underline font-bold">🏥 Team Health Engine</AccordionTrigger>
            <AccordionContent className="space-y-4 pt-2">
              <p className="text-sm text-muted-foreground">Monitors workload distribution imbalances and burnout indexes across active student groups.</p>
              <div className="p-4 bg-muted/40 rounded-xl space-y-4">
                <div>
                  <p className="text-xs font-bold uppercase text-primary">1. Workload Imbalance</p>
                  <p className="text-xs text-muted-foreground mb-2">Calculated using the standard deviation of tasks assigned among active members:</p>
                  <div className="bg-background p-3 rounded-lg border flex justify-center text-sm font-semibold">
                    {"$$\\text{Imbalance} = \\sqrt{\\frac{1}{M}\\sum_{j=1}^{M}(T_j - \\bar{T})^2}$$"}
                  </div>
                </div>
                <div>
                  <p className="text-xs font-bold uppercase text-primary">2. Burnout Risk Index</p>
                  <p className="text-xs text-muted-foreground mb-2">Aggregates overdue backlogs against completion speed:</p>
                  <div className="bg-background p-3 rounded-lg border flex justify-center text-sm font-semibold">
                    {"$$\\text{Burnout Risk} = \\min\\left(100, \\frac{\\text{Overdue Tasks} \\times 1.5 + \\text{Active Tasks}}{\\text{Historical Velocity}} \\times 100\\right)$$"}
                  </div>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="skills" className="border rounded-xl px-4">
            <AccordionTrigger className="hover:no-underline font-bold">🌳 Skill Trees & Gamification</AccordionTrigger>
            <AccordionContent className="space-y-4 pt-2">
              <p className="text-sm text-muted-foreground">Progresses academic capabilities automatically upon task completion and keyword analysis.</p>
              <div className="p-4 bg-muted/40 rounded-xl space-y-4">
                <div>
                  <p className="text-xs font-bold uppercase text-primary">1. Skill Level Progression</p>
                  <p className="text-xs text-muted-foreground mb-2">Calculates the current tier based on accumulated Experience Points (XP):</p>
                  <div className="bg-background p-3 rounded-lg border flex justify-center text-sm font-semibold">
                    {"$$\\text{Level} = \\left\\lfloor \\frac{\\text{Total XP}}{300} \\right\\rfloor + 1$$"}
                  </div>
                </div>
                <div>
                  <p className="text-xs font-bold uppercase text-primary">2. Confidence Score</p>
                  <p className="text-xs text-muted-foreground mb-2">Formulates a credibility ranking by scaling reliability with level weights:</p>
                  <div className="bg-background p-3 rounded-lg border flex justify-center text-sm font-semibold">
                    {"$$\\text{Confidence} = \\max\\left(30, \\min\\left(100, 45 + 0.5 \\times (\\text{Reliability} - 50) + \\text{Level} \\times 5\\right)\\right)$$"}
                  </div>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="reputation" className="border rounded-xl px-4">
            <AccordionTrigger className="hover:no-underline font-bold">🌟 Team Reputation</AccordionTrigger>
            <AccordionContent className="space-y-4 pt-2">
              <p className="text-sm text-muted-foreground">Merges anonymous teammate reviews into DNA scores using a Weighted Moving Average:</p>
              <div className="p-4 bg-muted/40 rounded-xl">
                <div className="bg-background p-3 rounded-lg border flex justify-center text-sm font-semibold">
                  {"$$\\text{New DNA Score} = 0.7 \\times \\text{Existing Score} + 0.3 \\times (\\text{Peer Rating} \\times 20)$$" }
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="memory" className="border rounded-xl px-4">
            <AccordionTrigger className="hover:no-underline font-bold">🎙️ Voice Assistant & Semantic Memory</AccordionTrigger>
            <AccordionContent className="space-y-4 pt-2">
              <p className="text-sm text-muted-foreground">Retrieves long-term chat contexts using vector cosine similarity:</p>
              <div className="p-4 bg-muted/40 rounded-xl">
                <div className="bg-background p-3 rounded-lg border flex justify-center text-sm font-semibold">
                  {"$$\\text{Cosine Distance} = 1 - \\frac{\\mathbf{A} \\cdot \\mathbf{B}}{\\|\\mathbf{A}\\| \\|\\mathbf{B}\\|} = 1 - \\frac{\\sum_{i=1}^{n} A_i B_i}{\\sqrt{\\sum_{i=1}^{n} A_i^2} \\sqrt{\\sum_{i=1}^{n} B_i^2}}$$" }
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
    )
  },
]

export default function DocsPage() {
  const [activeSection, setActiveSection] = useState("getting-started")

  useEffect(() => {
    // Inject KaTeX CSS
    if (!document.getElementById("katex-css")) {
      const link = document.createElement("link");
      link.id = "katex-css";
      link.rel = "stylesheet";
      link.href = "https://cdn.jsdelivr.net/npm/katex@0.16.8/dist/katex.min.css";
      document.head.appendChild(link);
    }

    let observer: MutationObserver | null = null;

    // Trigger rendering on content
    const triggerRender = () => {
      const el = document.getElementById("docs-content");
      if (el && (window as any).renderMathInElement) {
        try {
          if (observer) observer.disconnect();
          (window as any).renderMathInElement(el, {
            delimiters: [
              { left: "$$", right: "$$", display: true },
              { left: "$", right: "$", display: false }
            ],
            throwOnError: false
          });
          if (observer) observer.observe(el, { childList: true, subtree: true });
        } catch (e) {
          console.error("Error rendering KaTeX math:", e);
        }
      }
    };

    // Inject Auto-render JS
    const loadAutoRender = () => {
      if (!(window as any).renderMathInElement) {
        const script = document.createElement("script");
        script.src = "https://cdn.jsdelivr.net/npm/katex@0.16.8/dist/contrib/auto-render.min.js";
        script.async = true;
        script.onload = () => {
          triggerRender();
          startObserver();
        };
        document.body.appendChild(script);
      } else {
        triggerRender();
        startObserver();
      }
    };

    // Inject KaTeX JS
    const loadKatex = () => {
      if (!(window as any).katex) {
        const script = document.createElement("script");
        script.src = "https://cdn.jsdelivr.net/npm/katex@0.16.8/dist/katex.min.js";
        script.async = true;
        script.onload = () => loadAutoRender();
        document.body.appendChild(script);
      } else {
        loadAutoRender();
      }
    };

    const startObserver = () => {
      const el = document.getElementById("docs-content");
      if (el && !observer) {
        observer = new MutationObserver(() => {
          triggerRender();
        });
        observer.observe(el, { childList: true, subtree: true });
      }
    };

    loadKatex();

    return () => {
      if (observer) {
        observer.disconnect();
      }
    };
  }, [activeSection]);

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 border-t relative">
        <div className="container px-4 md:px-6 py-12 flex flex-col md:flex-row gap-12">
          {/* Sidebar */}
          <aside className="w-full md:w-64 shrink-0 space-y-8">
             <div className="space-y-1">
                <h4 className="px-4 text-xs font-black uppercase tracking-widest text-muted-foreground/60 mb-4">Documentation</h4>
                <nav className="space-y-1">
                   {sections.map((section) => (
                     <button
                        key={section.id}
                        data-section-id={section.id}
                        onClick={() => setActiveSection(section.id)}
                        className={`w-full flex items-center gap-3 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${activeSection === section.id ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted'}`}
                     >
                        {section.icon}
                        {section.title}
                     </button>
                   ))}
                </nav>
             </div>

             <div className="p-4 rounded-2xl bg-muted/40 border space-y-4">
                <div className="size-10 rounded-xl bg-background flex items-center justify-center border shadow-sm"><Code className="size-5 text-primary" /></div>
                <div className="space-y-1">
                   <p className="text-sm font-bold">API Access</p>
                   <p className="text-xs text-muted-foreground">Want to build on top of Morx? Explore our API reference guide.</p>
                </div>
                <Link href="/api" className="text-xs font-bold text-primary flex items-center gap-1 hover:underline">
                   View API Specs <ChevronRight className="size-3" />
                </Link>
             </div>

             <div className="p-4 rounded-2xl bg-gradient-to-br from-purple-500/10 to-primary/10 border border-purple-500/20 space-y-4">
                <div className="size-10 rounded-xl bg-background flex items-center justify-center border shadow-sm"><Sparkles className="size-5 text-purple-500" /></div>
                <div className="space-y-1">
                   <p className="text-sm font-bold">AI Features</p>
                   <p className="text-xs text-muted-foreground">Morx uses AI for task suggestions, talent matching, and description generation.</p>
                </div>
             </div>
          </aside>

          {/* Content Area */}
          <div id="docs-content" className="flex-1 max-w-4xl min-h-[600px] border-l md:pl-12">
             <motion.div
                key={activeSection}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3 }}
             >
                {sections.find(s => s.id === activeSection)?.content}
             </motion.div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}

function Badge({ children, variant = "default", className = "" }: any) {
   const styles = variant === "outline" ? "border text-foreground" : "bg-primary text-primary-foreground";
   return <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${styles} ${className}`}>{children}</span>
}
