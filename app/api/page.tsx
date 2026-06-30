"use client"

import { motion } from "framer-motion"
import { 
  Terminal, 
  Key, 
  Globe, 
  Cpu, 
  ArrowRight,
  ShieldCheck,
  Copy
} from "lucide-react"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Badge } from "@/components/ui/badge"
import { AnimatedGlobe } from "@/components/animated-globe"

const endpoints = [
  {
    category: "Authentication",
    routes: [
      {
        path: "/api/auth/signup",
        method: "POST",
        desc: "Create a new user account.",
        params: "{ firstName, lastName, email, password }",
        response: '{ "success": true, "user": { ... } }'
      },
      {
        path: "/api/auth/signin",
        method: "POST",
        desc: "Authenticate user and create session.",
        params: "{ email, password }",
        response: '{ "success": true, "session": { ... } }'
      }
    ]
  },
  {
    category: "Teams",
    routes: [
      {
        path: "/api/teams",
        method: "GET",
        desc: "Fetch all teams for the current user.",
        params: "None",
        response: '{ "success": true, "data": [ ... ] }'
      },
      {
        path: "/api/teams/create",
        method: "POST",
        desc: "Initialize a new team workspace.",
        params: "{ name, description, type, purpose }",
        response: '{ "success": true, "team_id": "..." }'
      }
    ]
  },
  {
    category: "Talent Marketplace",
    routes: [
      {
        path: "/api/users",
        method: "GET",
        desc: "Search and filter the workforce.",
        params: "?department=CS&skills=React",
        response: '{ "success": true, "data": [ ... ] }'
      }
    ]
  }
]

export default function ApiPage() {
  return (
    <div className="flex min-h-screen flex-col font-sans selection:bg-primary/30">
      <Header />
      <main className="flex-1 bg-background text-foreground">
        {/* API Hero Section */}
        <section className="relative py-24 overflow-hidden border-b border-border">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,hsl(var(--muted)),transparent)] pointer-events-none"></div>
          <div className="container relative z-10 px-4 md:px-6">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                <div className="flex items-center gap-2 text-primary font-mono text-sm tracking-widest uppercase mb-4">
                  <Terminal className="size-4" /> Morx API v1.0
                </div>
                <h1 className="text-5xl md:text-7xl font-black italic tracking-tighter leading-none">
                  Build with the <span className="text-primary rock-salt decoration-primary/30 underline-offset-8">Morx</span> Core.
                </h1>
                <p className="text-xl text-muted-foreground leading-relaxed max-w-2xl">
                  Integrate Morx powerful team management and analytics directly into your own workflow. 
                  Our RESTful API is designed for speed, security, and developer happiness.
                </p>
                <div className="flex flex-wrap gap-4 pt-4">
                   <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-muted border border-border text-sm font-medium">
                      <ShieldCheck className="size-4 text-green-500" /> End-to-End Encryption
                   </div>
                   <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-muted border border-border text-sm font-medium">
                      <Globe className="size-4 text-blue-500" /> Global Edge Network
                   </div>
                </div>
              </motion.div>
              
              <motion.div 
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 1, delay: 0.2 }}
                className="hidden lg:flex justify-center items-center"
              >
                 <AnimatedGlobe />
              </motion.div>
            </div>
          </div>
        </section>

        {/* Technical Reference section */}
        <section className="py-24">
          <div className="container px-4 md:px-6">
            <div className="grid lg:grid-cols-12 gap-16">
              {/* Left Column: Docs */}
              <div className="lg:col-span-8 space-y-16">
                 {endpoints.map((cat, idx) => (
                   <div key={idx} className="space-y-8">
                      <h2 className="text-2xl font-bold flex items-center gap-3 border-b border-border pb-4">
                         <span className="text-primary opacity-50">0{idx + 1}.</span> {cat.category}
                      </h2>
                      <div className="space-y-12">
                         {cat.routes.map((route, ridx) => (
                           <motion.div 
                              key={ridx}
                              initial={{ opacity: 0, x: -10 }}
                              whileInView={{ opacity: 1, x: 0 }}
                              viewport={{ once: true }}
                              className="group space-y-4"
                           >
                              <div className="flex items-center justify-between">
                                 <div className="flex items-center gap-3">
                                    <Badge variant="outline" className={`font-black tracking-widest ${route.method === 'GET' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' : 'bg-green-500/10 text-green-400 border-green-500/20'}`}>
                                       {route.method}
                                    </Badge>
                                    <code className="text-lg font-mono text-foreground group-hover:text-primary transition-colors">{route.path}</code>
                                 </div>
                                 <button className="text-muted-foreground hover:text-foreground transition-colors"><Copy className="size-4" /></button>
                              </div>
                              <p className="text-muted-foreground text-sm">{route.desc}</p>
                              
                              <div className="grid md:grid-cols-2 gap-4">
                                 <div className="space-y-2">
                                    <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Request Body</p>
                                    <pre className="p-4 rounded-xl bg-muted border border-border font-mono text-xs overflow-x-auto text-muted-foreground">
                                       {route.params}
                                    </pre>
                                 </div>
                                 <div className="space-y-2">
                                    <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Response Example</p>
                                    <pre className="p-4 rounded-xl bg-muted border border-border font-mono text-xs overflow-x-auto text-primary/70">
                                       {route.response}
                                    </pre>
                                 </div>
                              </div>
                           </motion.div>
                         ))}
                      </div>
                   </div>
                 ))}
              </div>

              {/* Right Column: Key/Auth Info */}
              <div className="lg:col-span-4 lg:sticky lg:top-24 h-fit space-y-8">
                 <div className="p-8 rounded-3xl bg-gradient-to-br from-muted to-transparent border border-border space-y-6">
                    <div className="size-12 rounded-2xl bg-primary/20 flex items-center justify-center text-primary"><Key className="size-6" /></div>
                    <div className="space-y-2">
                       <h3 className="text-xl font-bold">Authentication</h3>
                       <p className="text-sm text-muted-foreground leading-relaxed">
                          Morx uses Bearer tokens for API security. Ensure your request includes the proper Authorization header.
                       </p>
                    </div>
                    <pre className="bg-card p-4 rounded-xl text-xs font-mono border border-border text-muted-foreground">
                       Authorization: Bearer <span className="text-primary">YOUR_TOKEN</span>
                    </pre>
                 </div>

                 <div className="p-8 rounded-3xl bg-muted border border-border space-y-4">
                    <div className="flex items-center gap-3 text-sm font-bold">
                       <Cpu className="size-5 text-orange-500" /> Rate Limits
                    </div>
                    <p className="text-xs text-muted-foreground">Starter: 1,000 req/day<br/>Pro: 50,000 req/day<br/>Enterprise: Unlimited</p>
                 </div>
              </div>
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="py-24 border-t border-border bg-gradient-to-t from-primary/5 to-transparent">
           <div className="container px-4 md:px-6 text-center">
              <h2 className="text-3xl font-bold mb-8 italic">Ready to integrate?</h2>
              <div className="flex justify-center gap-4">
                 <button className="h-12 px-8 rounded-full bg-primary text-primary-foreground font-black text-sm uppercase tracking-widest hover:scale-105 transition-transform flex items-center gap-2">
                    Get Access Token <ArrowRight className="size-4" />
                 </button>
              </div>
           </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}

