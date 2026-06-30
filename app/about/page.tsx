"use client"

import { motion } from "framer-motion"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import Image from "next/image"
import Link from "next/link"
import { ArrowRight, Check, Users, Zap, Shield, Heart, Globe, Lightbulb } from "lucide-react"

export default function AboutPage() {
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  }

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 },
  }

  const values = [
    {
      title: "Innovation First",
      description: "We constantly push boundaries to bring you the most advanced tools.",
      icon: <Lightbulb className="size-6" />,
    },
    {
      title: "User-Centric Design",
      description: "Every feature is crafted with the user's experience in mind.",
      icon: <Heart className="size-6" />,
    },
    {
      title: "Uncompromising Security",
      description: "Your data's safety is our top priority, always.",
      icon: <Shield className="size-6" />,
    },
    {
      title: "Global Connectivity",
      description: "Bridging teams across the world with seamless collaboration.",
      icon: <Globe className="size-6" />,
    },
  ]

  const team = [
    {
      name: "Abdelrahman Ahmed",
      role: "CEO & Frontend, ML Engineer",
    },
    {
      name: "Mohammed Abdeen",
      role: "Software Engineer",
    },
    {
      name: "Mohammed Mosaad",
      role: "Linux Researcher",
    },
    {
      name: "Fares Mohammed",
      role: "Backend Engineer",
    },
    {
      name: "Mohammed Alaa",
      role: "AI Engineer",
    },
    {
      name: "Habiba Mohammed",
      role: "AI Engineer",
    },
    {
      name: "Wafaa Galal",
      role: "Data Analysis Expert",
    },
    {
      name: "Nada Mohammed",
      role: "Data Scientist",
    },
  ]

  const getInitials = (name: string) => {
    const parts = name.split(' ')
    if (parts.length >= 2) {
      return (parts[0].substring(0, 1) + parts[1].substring(0, 1)).toUpperCase()
    }
    return name.substring(0, 2).toUpperCase()
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative w-full py-24 md:py-32 lg:py-40 overflow-hidden">
          <div className="absolute inset-0 -z-10 h-full w-full bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_110%)]"></div>
          <div className="container px-4 md:px-6 relative text-center">
             <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="max-w-4xl mx-auto space-y-6"
            >
              <Badge variant="secondary" className="rounded-full px-4 py-1.5 text-sm font-medium animate-pulse">
                About Us
              </Badge>
              <h1 className="text-4xl md:text-6xl lg:text-7xl font-black italic tracking-tighter">
                Redefining Productivity with <span className="text-primary rock-salt">Morx</span>
              </h1>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                We are building the operating system for modern teams. A unified platform where work happens naturally, efficiently, and beautifully.
              </p>
            </motion.div>
          </div>
        </section>

        {/* Mission Section */}
        <section className="w-full py-20 bg-muted/20">
          <div className="container px-4 md:px-6">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
              >
                <div className="relative aspect-square rounded-[2.5rem] overflow-hidden shadow-2xl border border-border/40 bg-gradient-to-br from-primary/20 via-background to-secondary/20 flex items-center justify-center">
                    <div className="absolute inset-0 bg-[url('/Morx.png')] bg-center bg-no-repeat bg-contain opacity-20"></div>
                     <h3 className="text-5xl font-black italic text-foreground/20 rock-salt">Undefined</h3>
                </div>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="space-y-6"
              >
                <h2 className="text-3xl md:text-5xl font-black italic tracking-tighter">Our Mission</h2>
                <p className="text-lg text-muted-foreground">
                  Our journey began with a simple question: <span className="text-foreground font-semibold">Why is enterprise software so clunky?</span>
                </p>
                <p className="text-lg text-muted-foreground">
                  At Morx, we believe that powerful tools don't have to be complicated. We bridge the gap between complex functionality and intuitive design, enabling teams to focus on their best work, not fighting their tools.
                </p>
                <div className="pt-4">
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                        <h4 className="text-4xl font-black text-primary mb-1">10k+</h4>
                        <p className="text-sm font-medium text-muted-foreground">Teams Empowered</p>
                    </div>
                    <div>
                        <h4 className="text-4xl font-black text-primary mb-1">99.9%</h4>
                        <p className="text-sm font-medium text-muted-foreground">System Uptime</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Values Section */}
        <section className="w-full py-20 lg:py-32">
          <div className="container px-4 md:px-6">
            <div className="text-center max-w-3xl mx-auto mb-16">
                <h2 className="text-3xl md:text-5xl font-black italic tracking-tighter mb-4">Core Values</h2>
                <p className="text-muted-foreground text-lg">The principles that guide every line of code we write.</p>
            </div>
            
            <motion.div 
                variants={container}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true }}
                className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6"
            >
                {values.map((val, i) => (
                    <motion.div key={i} variants={item}>
                        <Card className="h-full border-border/40 hover:border-primary/40 transition-colors bg-gradient-to-b from-background to-muted/10">
                            <CardContent className="p-6 pt-8 text-center flex flex-col items-center h-full">
                                <div className="size-12 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-6">
                                    {val.icon}
                                </div>
                                <h3 className="text-xl font-bold mb-3">{val.title}</h3>
                                <p className="text-sm text-muted-foreground">{val.description}</p>
                            </CardContent>
                        </Card>
                    </motion.div>
                ))}
            </motion.div>
          </div>
        </section>

        {/* Team Section */}
        <section className="w-full py-20 bg-muted/20">
          <div className="container px-4 md:px-6">
            <div className="text-center max-w-3xl mx-auto mb-16">
                <h2 className="text-3xl md:text-5xl font-black italic tracking-tighter mb-4">The Minds Behind Morx</h2>
                <p className="text-muted-foreground text-lg">Detailed craftsmanship by the Undefined team.</p>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {team.map((member, i) => (
                    <motion.div 
                        key={i}
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5, delay: i * 0.1 }}
                    >
                         <Card className="h-full border-border/40 hover:border-primary/40 transition-all group overflow-hidden bg-gradient-to-b from-background to-muted/10">
                            <CardContent className="p-6 flex flex-col items-center text-center">
                                <div className="mb-6 flex items-center justify-center">
                                    <div className="size-20 rounded-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center text-2xl font-black italic text-primary ring-4 ring-background shadow-xl group-hover:scale-110 transition-transform">
                                        {getInitials(member.name)}
                                    </div>
                                </div>
                                <h3 className="text-lg font-bold mb-1 group-hover:text-primary transition-colors">{member.name}</h3>
                                <p className="text-xs font-mono text-muted-foreground uppercase tracking-wide">{member.role}</p>
                            </CardContent>
                        </Card>
                    </motion.div>
                ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="w-full py-24 bg-background relative overflow-hidden text-center">
             <div className="absolute inset-0 -z-10 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:2rem_2rem]"></div>
             <div className="container px-4 md:px-6">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    className="max-w-3xl mx-auto space-y-8"
                >
                    <h2 className="text-4xl md:text-6xl font-black italic tracking-tighter">Ready to join the revolution?</h2>
                    <p className="text-xl text-muted-foreground">Experience the future of work today with Morx.</p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Link href="/signup">
                            <Button size="lg" className="rounded-full h-14 px-8 text-lg font-bold">Get Started Now <ArrowRight className="ml-2 size-5" /></Button>
                        </Link>
                        <Link href="/contact">
                            <Button size="lg" variant="outline" className="rounded-full h-14 px-8 text-lg font-medium">Contact Sales</Button>
                        </Link>
                    </div>
                </motion.div>
             </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}
