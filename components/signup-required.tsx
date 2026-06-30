"use client"

import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"

export default function SignupRequired() {
  const router = useRouter()

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 flex items-center justify-center bg-background">
        <div className="text-center px-4 max-w-md">
          <h1 className="text-2xl md:text-3xl font-bold mb-3">Signup Required</h1>
          <p className="text-muted-foreground mb-6">
            You need to be logged in to access this page. Please sign in or create an account to continue.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button onClick={() => router.push('/signin')} size="lg" className="w-full sm:w-auto">
              Sign In
            </Button>
            <Button onClick={() => router.push('/signup')} variant="outline" size="lg" className="w-full sm:w-auto">
              Create Account
            </Button>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
