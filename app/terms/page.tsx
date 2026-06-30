"use client"

import { motion } from "framer-motion"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import Link from "next/link"
import { ArrowLeft, Scale, UserCheck, ShieldAlert, CreditCard, Ban, AlertTriangle, FileText } from "lucide-react"

export default function TermsPage() {
  const sections = [
    { id: "acceptance", title: "Acceptance of Terms", icon: <Scale className="size-5" /> },
    { id: "account", title: "Account Registration", icon: <UserCheck className="size-5" /> },
    { id: "usage", title: "Acceptable Use", icon: <ShieldAlert className="size-5" /> },
    { id: "payment", title: "Payment & Billing", icon: <CreditCard className="size-5" /> },
    { id: "termination", title: "Termination", icon: <Ban className="size-5" /> },
    { id: "liability", title: "Limitation of Liability", icon: <AlertTriangle className="size-5" /> },
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
                            <FileText className="size-8" />
                        </div>
                    </div>
                    <h1 className="text-4xl md:text-6xl font-black italic tracking-tighter">Terms of Service</h1>
                    <p className="text-xl text-muted-foreground">Please read these terms carefully before using our services.</p>
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
                            Welcome to Morx. By accessing or using our website and services, you agree to be bound by these Terms of Service and all applicable laws and regulations. If you do not agree with any of these terms, you are prohibited from using or accessing this site.
                        </p>
                    </motion.div>

                    <div className="space-y-8">
                        <div id="acceptance" className="scroll-mt-32">
                             <Card className="border-border/40 bg-gradient-to-b from-background to-muted/10 overflow-hidden group hover:border-primary/30 transition-all">
                                <CardHeader className="flex flex-row items-center gap-4 bg-muted/20 border-b border-border/20 px-6 py-4">
                                    <div className="size-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                                        <Scale className="size-5" />
                                    </div>
                                    <CardTitle className="text-xl font-bold">1. Acceptance of Terms</CardTitle>
                                </CardHeader>
                                <CardContent className="p-6">
                                    <p className="text-muted-foreground leading-relaxed">
                                        These Terms of Service ("Terms") constitute a legally binding agreement between you and Morx ("we," "us," or "our"). By creating an account or using our services, you represent that you are at least 18 years old and have the legal capacity to enter into this agreement.
                                    </p>
                                </CardContent>
                            </Card>
                        </div>

                        <div id="account" className="scroll-mt-32">
                           <Card className="border-border/40 bg-gradient-to-b from-background to-muted/10 overflow-hidden group hover:border-primary/30 transition-all">
                                <CardHeader className="flex flex-row items-center gap-4 bg-muted/20 border-b border-border/20 px-6 py-4">
                                     <div className="size-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                                        <UserCheck className="size-5" />
                                    </div>
                                    <CardTitle className="text-xl font-bold">2. Account Registration</CardTitle>
                                </CardHeader>
                                <CardContent className="p-6 space-y-4">
                                    <p className="text-muted-foreground leading-relaxed">
                                        To access certain features of our platform, you may be required to register for an account. You agree to provide accurate, current, and complete information during the registration process and to update such information to keep it accurate, current, and complete.
                                    </p>
                                    <p className="text-muted-foreground leading-relaxed">
                                        You are responsible for safeguarding your password and for all activities that occur under your account. You agree to notify us immediately of any unauthorized use of your account.
                                    </p>
                                </CardContent>
                            </Card>
                        </div>

                        <div id="usage" className="scroll-mt-32">
                            <Card className="border-border/40 bg-gradient-to-b from-background to-muted/10 overflow-hidden group hover:border-primary/30 transition-all">
                                <CardHeader className="flex flex-row items-center gap-4 bg-muted/20 border-b border-border/20 px-6 py-4">
                                    <div className="size-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                                        <ShieldAlert className="size-5" />
                                    </div>
                                    <CardTitle className="text-xl font-bold">3. Acceptable Use</CardTitle>
                                </CardHeader>
                                <CardContent className="p-6">
                                    <p className="text-muted-foreground mb-4">You agree not to misuse our services. For example, you must not:</p>
                                    <ul className="grid gap-3 sm:grid-cols-2">
                                        {[
                                            "Use services for illegal purposes",
                                            "Harass or harm other users",
                                            "Violate third-party rights",
                                            "Interfere with security features",
                                            "Reverse engineer source code",
                                            "Send spam or unsolicited messages"
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

                         <div id="payment" className="scroll-mt-32">
                            <Card className="border-border/40 bg-gradient-to-b from-background to-muted/10 overflow-hidden group hover:border-primary/30 transition-all">
                                <CardHeader className="flex flex-row items-center gap-4 bg-muted/20 border-b border-border/20 px-6 py-4">
                                    <div className="size-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                                        <CreditCard className="size-5" />
                                    </div>
                                    <CardTitle className="text-xl font-bold">4. Payment & Billing</CardTitle>
                                </CardHeader>
                                <CardContent className="p-6 space-y-4">
                                     <p className="text-muted-foreground leading-relaxed">
                                        Certain aspects of the services may be provided for a fee or other charge. If you elect to use paid aspects of the services, you agree to the pricing and payment terms as we may update them from time to time.
                                    </p>
                                    <p className="text-muted-foreground leading-relaxed">
                                        We may add new services for additional fees and charges, add or amend fees and charges for existing services, at any time in our sole discretion. Any change to our pricing or payment terms shall become effective in the billing cycle following notice of such change to you as provided in these Terms.
                                    </p>
                                </CardContent>
                            </Card>
                        </div>

                        <div id="termination" className="scroll-mt-32">
                             <Card className="border-border/40 bg-gradient-to-b from-background to-muted/10 overflow-hidden group hover:border-primary/30 transition-all">
                                <CardHeader className="flex flex-row items-center gap-4 bg-muted/20 border-b border-border/20 px-6 py-4">
                                    <div className="size-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                                        <Ban className="size-5" />
                                    </div>
                                    <CardTitle className="text-xl font-bold">5. Termination</CardTitle>
                                </CardHeader>
                                <CardContent className="p-6">
                                    <p className="text-muted-foreground leading-relaxed">
                                        We may terminate your access to and use of the services, at our sole discretion, at any time and without notice to you. You may cancel your account at any time by sending an email to us or through your account settings. Upon any termination, discontinuation, or cancellation of the services or your account, the provisions of these Terms which by their nature should survive will survive.
                                    </p>
                                </CardContent>
                            </Card>
                        </div>

                         <div id="liability" className="scroll-mt-32">
                             <Card className="border-border/40 bg-gradient-to-b from-background to-muted/10 overflow-hidden group hover:border-primary/30 transition-all">
                                <CardHeader className="flex flex-row items-center gap-4 bg-muted/20 border-b border-border/20 px-6 py-4">
                                    <div className="size-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                                        <AlertTriangle className="size-5" />
                                    </div>
                                    <CardTitle className="text-xl font-bold">6. Limitation of Liability</CardTitle>
                                </CardHeader>
                                <CardContent className="p-6">
                                     <p className="text-muted-foreground leading-relaxed">
                                        To the fullest extent permitted by law, in no event will Morx be liable to you or any third party for any lost profits, lost data, costs of procurement of substitute products, or any indirect, consequential, exemplary, incidental, special or punitive damages arising from or relating to these terms or your use of, or inability to use, the site or services, even if Morx has been advised of the possibility of such damages.
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
