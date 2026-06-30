"use client"

import { motion } from "framer-motion"
import { Check, ArrowRight, Zap, Star, Shield, Rocket } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import Link from "next/link"

const plans = [
  {
    name: "Starter",
    price: { monthly: "$29", annually: "$23" },
    description: "Perfect for small teams and startups starting their journey.",
    features: [
      "Up to 50 team members",
      "Basic analytics dashboard",
      "Email support (24h response)",
      "Standard task management",
      "Community templates access",
      "10 Daily AI Requests"
    ],
    cta: "Start Free Trial",
    popular: false
  },
  {
    name: "Professional",
    price: { monthly: "$79", annually: "$63" },
    description: "Ideal for growing businesses needing advanced insights.",
    features: [
      "Up to 80 team members",
      "Advanced analytics & trends",
      "Priority email support",
      "Full API access",
      "Custom project templates",
      "Team activity tracking",
      "Workload distribution",
      "20 Daily AI Requests"
    ],
    cta: "Start Free Trial",
    popular: true
  },
  {
    name: "Enterprise",
    price: { monthly: "$199", annually: "$159" },
    description: "For large organizations with complex workflow needs.",
    features: [
      "Unlimited team members",
      "Custom analytics & BI",
      "24/7 Phone & Email support",
      "Advanced API with webhooks",
      "Custom integrations",
      "Dedicated account manager",
      "SSO & advanced security",
      "Unlimited Daily AI Requests"

    ],
    cta: "Contact Sales",
    popular: false
  }
]

export default function PricingPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <section className="py-24 relative overflow-hidden">
          <div className="absolute inset-0 -z-10 h-full w-full bg-white dark:bg-black bg-[linear-gradient(to_right,#f0f0f0_1px,transparent_1px),linear-gradient(to_bottom,#f0f0f0_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,#1f1f1f_1px,transparent_1px),linear-gradient(to_bottom,#1f1f1f_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_110%)]"></div>
          
          <div className="container px-4 md:px-6">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center max-w-3xl mx-auto mb-16 space-y-4"
            >
              <Badge variant="outline" className="rounded-full px-4 py-1 animate-pulse border-primary text-primary">Simple Pricing</Badge>
              <h1 className="text-4xl md:text-6xl font-black italic tracking-tighter">Choose Your <span className="text-primary">Stellar</span> Plan.</h1>
              <p className="text-xl text-muted-foreground">Transparent pricing for teams of all sizes. No hidden fees, just results.</p>
            </motion.div>

            <Tabs defaultValue="monthly" className="w-full max-w-5xl mx-auto">
              <div className="flex justify-center mb-12">
                <TabsList className="grid w-[450px] grid-cols-2 h-14 rounded-full p-1.5 border-2 bg-muted/20">
                  <TabsTrigger value="monthly" className="rounded-full text-base font-bold">Monthly</TabsTrigger>
                  <TabsTrigger value="annually" className="rounded-full text-base font-bold flex items-center gap-2">
                    Annually 
                    <Badge className="bg-primary text-white text-[10px] px-2 py-0.5 rounded-full border-0">SAVE 20%</Badge>
                  </TabsTrigger>
                </TabsList>
              </div>

              {['monthly', 'annually'].map((billing) => (
                <TabsContent key={billing} value={billing}>
                  <div className="grid md:grid-cols-3 gap-8 items-stretch pt-4">
                    {plans.map((plan, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                      >
                        <Card className={`h-full flex flex-col relative overflow-hidden border-2 transition-all hover:shadow-2xl ${plan.popular ? 'border-primary shadow-xl scale-105 z-10' : 'border-border/40 hover:border-primary/50'}`}>
                          {plan.popular && (
                            <div className="absolute top-0 right-0 bg-primary text-primary-foreground px-6 py-1.5 text-[10px] font-black uppercase tracking-[0.2em] rounded-bl-3xl">
                              Most Popular
                            </div>
                          )}
                          <CardHeader className="p-8">
                            <CardTitle className="text-2xl font-black italic tracking-tighter">{plan.name}</CardTitle>
                            <CardDescription className="text-muted-foreground mt-2 font-medium">{plan.description}</CardDescription>
                            <div className="mt-6 flex items-baseline">
                              <span className="text-5xl font-black italic tracking-tighter">{billing === 'monthly' ? plan.price.monthly : plan.price.annually}</span>
                              <span className="text-muted-foreground ml-2 font-bold opacity-60">/mo</span>
                            </div>
                          </CardHeader>
                          <CardContent className="p-8 pt-0 flex-grow flex flex-col">
                            <ul className="space-y-4 mb-8 flex-grow">
                              {plan.features.map((feature, j) => (
                                <li key={j} className="flex items-start gap-3 text-sm font-medium">
                                  <div className="size-5 rounded-full bg-primary/10 flex items-center justify-center text-primary mt-0.5 shrink-0">
                                    <Check className="size-3 stroke-[3]" />
                                  </div>
                                  {feature}
                                </li>
                              ))}
                            </ul>
                            <Link href="/signup" className="w-full">
                              <Button className={`w-full h-14 rounded-2xl font-black italic tracking-tighter text-lg transition-transform hover:scale-[1.02] ${plan.popular ? 'bg-primary shadow-lg shadow-primary/20 hover:bg-primary/90' : 'bg-muted hover:bg-muted/80'}`} variant={plan.popular ? 'default' : 'secondary'}>
                                {plan.cta}
                              </Button>
                            </Link>
                          </CardContent>
                        </Card>
                      </motion.div>
                    ))}
                  </div>
                </TabsContent>
              ))}
            </Tabs>
          </div>
        </section>

        {/* Comparison Section */}
        <section className="py-24 bg-muted/30">
          <div className="container px-4 md:px-6">
            <h2 className="text-3xl font-bold text-center mb-16">Compare All Features</h2>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b">
                    <th className="py-6 px-4 text-left font-bold text-lg">Feature</th>
                    <th className="py-6 px-4 text-center font-bold text-lg">Starter</th>
                    <th className="py-6 px-4 text-center font-bold text-lg">Professional</th>
                    <th className="py-6 px-4 text-center font-bold text-lg">Enterprise</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {[
                    ["Team Members", "Up to 50", "Up to 80", "Unlimited"],
                    ["Analytics", "Basic", "Advanced", "Custom BI"],
                    ["AI usage per day", "10", "20", "Unlimited"],
                    ["API Access", "None", "Full", "Advanced + Webhooks"],
                    ["Support", "Email", "Priority Email", "24/7 Phone & Email"],
                    ["Task Documentation", "✓", "✓", "✓"],
                    ["Custom Templates", "✓", "✓", "✓"],
                    ["Marketplace Access", "✓", "✓", "✓"],
                  ].map((row, i) => (
                    <tr key={i} className="hover:bg-muted/50 transition-colors">
                      <td className="py-4 px-4 font-medium">{row[0]}</td>
                      <td className="py-4 px-4 text-center text-muted-foreground">{row[1]}</td>
                      <td className="py-4 px-4 text-center text-muted-foreground">{row[2]}</td>
                      <td className="py-4 px-4 text-center text-muted-foreground">{row[3]}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        <section className="py-24 bg-foreground text-background">
          <div className="container px-4 md:px-6 text-center space-y-8">
            <h2 className="text-3xl md:text-5xl font-black italic">Still not sure?</h2>
            <p className="text-xl text-background/60 max-w-2xl mx-auto">Start with our free trial and see why teams love <span className="rock-salt text-primary">Morx</span>. No credit card required.</p>
            <div className="flex justify-center gap-4">
               <Link href="/signup">
                 <Button size="lg" className="rounded-full px-8 h-14 text-xl">Start 14-Day Free Trial</Button>
               </Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}

