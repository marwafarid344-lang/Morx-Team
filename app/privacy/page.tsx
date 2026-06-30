"use client"

import { motion } from "framer-motion"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import Link from "next/link"
import { ArrowLeft, Database, Search, Share2, Lock, UserCog, Cookie, ShieldCheck } from "lucide-react"

export default function PrivacyPage() {
  const sections = [
    { id: "collection", title: "Information Collection", icon: <Database className="size-5" /> },
    { id: "usage", title: "How We Use Data", icon: <Search className="size-5" /> },
    { id: "sharing", title: "Information Sharing", icon: <Share2 className="size-5" /> },
    { id: "security", title: "Data Security", icon: <Lock className="size-5" /> },
    { id: "rights", title: "Your Rights", icon: <UserCog className="size-5" /> },
    { id: "cookies", title: "Cookies", icon: <Cookie className="size-5" /> },
  ]

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id)
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" })
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-background selection:bg-primary/20">
      <Header />
      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative w-full py-24 md:py-32 overflow-hidden bg-muted/20">
            <div className="absolute inset-0 -z-10 h-full w-full bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:4rem_4rem]"></div>
            <div className="container px-4 md:px-6 relative text-center">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5 }}
                    className="max-w-3xl mx-auto space-y-6"
                >
                    <Link href="/" className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-primary mb-4 transition-colors">
                        <ArrowLeft className="mr-2 size-4" /> Back to Home
                    </Link>
                    <div className="flex justify-center mb-4">
                        <div className="size-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                            <ShieldCheck className="size-8" />
                        </div>
                    </div>
                    <h1 className="text-4xl md:text-6xl font-black italic tracking-tighter">Privacy Policy</h1>
                    <p className="text-xl text-muted-foreground">Transparency is key. Here's how we protect your data.</p>
                    <Badge variant="outline" className="text-xs font-mono py-1">Last updated: {new Date().toLocaleDateString()}</Badge>
                </motion.div>
            </div>
        </section>

        <section className="container px-4 md:px-6 py-12 md:py-20 max-w-7xl mx-auto">
            <div className="flex flex-col lg:flex-row gap-12 lg:gap-24">
                {/* Sidebar Navigation */}
                <div className="hidden lg:block w-72 shrink-0">
                    <div className="sticky top-32 space-y-2">
                         <div className="p-4 rounded-xl bg-muted/30 border border-border/40 backdrop-blur-sm">
                            <p className="font-bold text-sm mb-4 uppercase tracking-wider text-muted-foreground px-2">Table of Contents</p>
                            <nav className="space-y-1">
                                {sections.map((section) => (
                                    <button
                                        key={section.id}
                                        onClick={() => scrollToSection(section.id)}
                                        className="flex items-center gap-3 w-full text-sm text-left text-muted-foreground hover:text-primary hover:bg-primary/5 px-3 py-2 rounded-lg transition-all"
                                    >
                                        {section.icon}
                                        {section.title}
                                    </button>
                                ))}
                            </nav>
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 space-y-8">
                     <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                        className="prose prose-gray dark:prose-invert max-w-none mb-12"
                    >
                        <p className="text-lg leading-relaxed text-muted-foreground">
                            Your privacy is important to us. It is Morx's policy to respect your privacy regarding any information we may collect from you across our website and other sites we own and operate.
                        </p>
                    </motion.div>

                    <div className="space-y-8">
                        <div id="collection" className="scroll-mt-32">
                             <Card className="border-border/40 bg-gradient-to-b from-background to-muted/10 overflow-hidden group hover:border-primary/30 transition-all">
                                <CardHeader className="flex flex-row items-center gap-4 bg-muted/20 border-b border-border/20 px-6 py-4">
                                    <div className="size-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                                        <Database className="size-5" />
                                    </div>
                                    <CardTitle className="text-xl font-bold">1. Information Collection</CardTitle>
                                </CardHeader>
                                <CardContent className="p-6">
                                    <p className="text-muted-foreground mb-4 leading-relaxed">
                                        We only ask for personal information when we truly need it to provide a service to you. We collect it by fair and lawful means, with your knowledge and consent. We also let you know why we’re collecting it and how it will be used.
                                    </p>
                                    <p className="text-muted-foreground font-medium mb-2">Types of data we collect:</p>
                                    <ul className="grid gap-3 sm:grid-cols-2">
                                         {[
                                            "Identity Data",
                                            "Contact Data",
                                            "Technical Data",
                                            "Usage Data"
                                        ].map((item, i) => (
                                            <li key={i} className="flex items-center gap-3 text-sm text-muted-foreground">
                                                <div className="size-1.5 rounded-full bg-primary/60 shrink-0" />
                                                {item}
                                            </li>
                                        ))}
                                    </ul>
                                </CardContent>
                            </Card>
                        </div>

                        <div id="usage" className="scroll-mt-32">
                             <Card className="border-border/40 bg-gradient-to-b from-background to-muted/10 overflow-hidden group hover:border-primary/30 transition-all">
                                <CardHeader className="flex flex-row items-center gap-4 bg-muted/20 border-b border-border/20 px-6 py-4">
                                    <div className="size-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                                        <Search className="size-5" />
                                    </div>
                                    <CardTitle className="text-xl font-bold">2. How We Use Data</CardTitle>
                                </CardHeader>
                                <CardContent className="p-6">
                                    <p className="text-muted-foreground leading-relaxed">
                                        We use your data to provide, operate, and maintain our website, to improve, personalize, and expand our website, to understand and analyze how you use our website, and to develop new products, services, features, and functionality.
                                    </p>
                                </CardContent>
                            </Card>
                        </div>

                        <div id="sharing" className="scroll-mt-32">
                             <Card className="border-border/40 bg-gradient-to-b from-background to-muted/10 overflow-hidden group hover:border-primary/30 transition-all">
                                <CardHeader className="flex flex-row items-center gap-4 bg-muted/20 border-b border-border/20 px-6 py-4">
                                     <div className="size-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                                        <Share2 className="size-5" />
                                    </div>
                                    <CardTitle className="text-xl font-bold">3. Information Sharing</CardTitle>
                                </CardHeader>
                                <CardContent className="p-6">
                                    <p className="text-muted-foreground leading-relaxed">
                                        We do not share your personal information publicly or with third-parties, except when required to by law. We may share your information with service providers who assist us in operating our website, conducting our business, or serving our users, so long as those parties agree to keep this information confidential.
                                    </p>
                                </CardContent>
                            </Card>
                        </div>

                         <div id="security" className="scroll-mt-32">
                             <Card className="border-border/40 bg-gradient-to-b from-background to-muted/10 overflow-hidden group hover:border-primary/30 transition-all">
                                <CardHeader className="flex flex-row items-center gap-4 bg-muted/20 border-b border-border/20 px-6 py-4">
                                     <div className="size-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                                        <Lock className="size-5" />
                                    </div>
                                    <CardTitle className="text-xl font-bold">4. Data Security</CardTitle>
                                </CardHeader>
                                <CardContent className="p-6">
                                    <p className="text-muted-foreground leading-relaxed">
                                        We value your trust in providing us your Personal Information, thus we are striving to use commercially acceptable means of protecting it. But remember that no method of transmission over the internet, or method of electronic storage is 100% secure and reliable, and we cannot guarantee its absolute security.
                                    </p>
                                </CardContent>
                            </Card>
                        </div>

                        <div id="rights" className="scroll-mt-32">
                             <Card className="border-border/40 bg-gradient-to-b from-background to-muted/10 overflow-hidden group hover:border-primary/30 transition-all">
                                <CardHeader className="flex flex-row items-center gap-4 bg-muted/20 border-b border-border/20 px-6 py-4">
                                     <div className="size-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                                        <UserCog className="size-5" />
                                    </div>
                                    <CardTitle className="text-xl font-bold">5. Your Rights</CardTitle>
                                </CardHeader>
                                <CardContent className="p-6">
                                    <p className="text-muted-foreground leading-relaxed">
                                        You are free to refuse our request for your personal information, with the understanding that we may be unable to provide you with some of your desired services. You have the right to access, correct, update, or request deletion of your personal information.
                                    </p>
                                </CardContent>
                            </Card>
                        </div>

                         <div id="cookies" className="scroll-mt-32">
                             <Card className="border-border/40 bg-gradient-to-b from-background to-muted/10 overflow-hidden group hover:border-primary/30 transition-all">
                                <CardHeader className="flex flex-row items-center gap-4 bg-muted/20 border-b border-border/20 px-6 py-4">
                                     <div className="size-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                                        <Cookie className="size-5" />
                                    </div>
                                    <CardTitle className="text-xl font-bold">6. Cookies</CardTitle>
                                </CardHeader>
                                <CardContent className="p-6">
                                    <p className="text-muted-foreground leading-relaxed">
                                        We use "cookies" to collect information about you and your activity across our site. A cookie is a small piece of data that our website stores on your computer, and accesses each time you visit, so we can understand how you use our site. This helps us serve you content based on preferences you have specified.
                                    </p>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </div>
            </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}
