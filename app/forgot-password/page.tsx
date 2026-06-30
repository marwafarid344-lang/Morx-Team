"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { createBrowserClient } from "@supabase/ssr"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { AuthTransition } from "@/components/auth-transition"
import { Eye, EyeOff, ArrowLeft, CheckCircle2, Shield, User, Mail } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

export default function ForgotPasswordPage() {
  const router = useRouter()
  const [step, setStep] = useState<'verify' | 'choose' | 'reset' | 'success'>('verify')
  const [email, setEmail] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [verifiedUserId, setVerifiedUserId] = useState<number | null>(null)
  const [userData, setUserData] = useState<any>(null)
  const [supabase, setSupabase] = useState<any>(null)

  useEffect(() => {
    const client = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
    setSupabase(client)
  }, [])

  // Handle the OAuth callback
  useEffect(() => {
    const handleCallback = async () => {
      if (!supabase) return
      
      const urlHash = window.location.hash
      const urlParams = new URLSearchParams(window.location.search)
      const hasAuthCallback = urlHash.includes('access_token') || urlParams.has('code')
      
      if (!hasAuthCallback) return
      
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      
      if (session?.user?.email) {
        try {
          const res = await fetch('/api/auth/verify-google-user', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: session.user.email })
          })
          
          const result = await res.json()
          
          if (result.success && result.user_id) {
            setEmail(session.user.email)
            setVerifiedUserId(result.user_id)
            setUserData(result) // Assuming result contains user details like first_name, last_name, etc.
            setStep('choose')
            window.history.replaceState(null, '', '/forgot-password')
          } else {
            setError(result.error || 'No account found with this Google email. Please sign up first.')
          }
        } catch (err) {
          setError('Failed to verify your account.')
        }
      }
    }
    
    handleCallback()
  }, [supabase])

  const handleGoogleVerify = async () => {
    if (!supabase) {
      setError('Authentication not ready. Please try again.')
      return
    }

    setLoading(true)
    setError('')

    try {
      const { data, error: authError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/forgot-password`,
          queryParams: {
            prompt: 'select_account',
            access_type: 'offline',
          },
        },
      })

      if (authError) {
        setError(authError.message)
        setLoading(false)
        return
      }

      if (data?.url) {
        window.location.href = data.url
      }
    } catch (err) {
      setError('Failed to verify with Google')
      setLoading(false)
    }
  }

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match')
      setLoading(false)
      return
    }

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters')
      setLoading(false)
      return
    }

    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: verifiedUserId,
          new_password: newPassword
        })
      })

      const result = await res.json()

      if (result.success) {
        setStep('success')
      } else {
        setError(result.error || 'Failed to reset password')
      }
    } catch (err) {
      setError('An error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <AuthTransition mode="signin">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1 flex flex-col items-center">
            <Link href="/" className="mb-2">
              <Image src="/Morx.png" alt="Morx" width={60} height={60} className="size-15" />
            </Link>
            <CardTitle className="text-2xl font-bold text-center">
              {step === 'verify' && 'Reset Your Password'}
              {step === 'choose' && 'Found Your Account'}
              {step === 'reset' && 'Create New Password'}
              {step === 'success' && 'Password Reset!'}
            </CardTitle>
            <CardDescription className="text-center">
              {step === 'verify' && 'Verify your identity with Google to reset your password'}
              {step === 'choose' && 'Please confirm this is the account you want to reset'}
              {step === 'reset' && `Resetting password for ${email}`}
              {step === 'success' && 'Your password has been successfully changed'}
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            {step === 'verify' && (
              <>
                <div className="p-4 bg-muted/50 rounded-lg border border-border/50">
                  <div className="flex items-start gap-3">
                    <Shield className="h-5 w-5 text-primary mt-0.5" />
                    <div className="text-sm text-muted-foreground">
                      <p className="font-medium text-foreground mb-1">How it works:</p>
                      <ol className="list-decimal list-inside space-y-1">
                        <li>Verify with your Google account</li>
                        <li>Confirm your project account details</li>
                        <li>Set your new secure password</li>
                      </ol>
                    </div>
                  </div>
                </div>

                {error && (
                  <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-lg">
                    {error}
                  </div>
                )}

                <Button
                  className="w-full"
                  onClick={handleGoogleVerify}
                  disabled={loading || !supabase}
                >
                  <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                  </svg>
                  {loading ? 'Verifying...' : 'Verify with Google'}
                </Button>
              </>
            )}

            {step === 'choose' && userData && (
              <div className="space-y-4">
                <p className="text-sm font-medium text-muted-foreground text-center">
                  Select your account below:
                </p>
                <Card 
                  className="p-4 cursor-pointer hover:border-primary transition-all border-2 border-transparent bg-muted/30 group"
                  onClick={() => setStep('reset')}
                >
                  <div className="flex items-center gap-4">
                    <Avatar className="h-12 w-12 border-2 border-background group-hover:border-primary/20 transition-all">
                      <AvatarImage src={userData.profile_image} />
                      <AvatarFallback>
                        <User className="h-6 w-6" />
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-base font-bold truncate">
                         {userData.first_name} {userData.last_name}
                      </h3>
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Mail className="h-3 w-3" />
                        <span className="truncate">{userData.email}</span>
                      </div>
                    </div>
                    <div className="h-6 w-6 rounded-full border-2 border-muted flex items-center justify-center group-hover:border-primary group-hover:bg-primary transition-all">
                       <CheckCircle2 className="h-4 w-4 text-white opacity-0 group-hover:opacity-100 transition-all" />
                    </div>
                  </div>
                </Card>
                <Button 
                  variant="outline" 
                  className="w-full" 
                  onClick={() => {
                    setStep('verify')
                    setUserData(null)
                  }}
                >
                  Not your account? Try again
                </Button>
              </div>
            )}

            {step === 'reset' && (
              <form onSubmit={handleResetPassword} className="space-y-4">
                {error && (
                  <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-lg">
                    {error}
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="new-password">New Password</Label>
                  <div className="relative">
                    <Input
                      id="new-password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter your new password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="pr-10"
                      required
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4 text-muted-foreground" /> : <Eye className="h-4 w-4 text-muted-foreground" />}
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirm-new-password">Confirm New Password</Label>
                  <div className="relative">
                    <Input
                      id="confirm-new-password"
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="Confirm your new password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="pr-10"
                      required
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? <EyeOff className="h-4 w-4 text-muted-foreground" /> : <Eye className="h-4 w-4 text-muted-foreground" />}
                    </Button>
                  </div>
                </div>

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? 'Resetting...' : 'Reset Password'}
                </Button>
              </form>
            )}

            {step === 'success' && (
              <div className="text-center space-y-4">
                <div className="flex justify-center">
                  <div className="size-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                    <CheckCircle2 className="size-8 text-green-600 dark:text-green-400" />
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">
                  Your password has been reset successfully. You can now sign in with your new password.
                </p>
                <Button className="w-full" onClick={() => router.push('/signin')}>
                  Go to Sign In
                </Button>
              </div>
            )}
          </CardContent>

          <CardFooter className="flex flex-col space-y-4">
            <div className="text-sm text-muted-foreground text-center">
              <Link href="/signin" className="text-primary hover:underline inline-flex items-center gap-1">
                <ArrowLeft className="h-4 w-4" />
                Back to Sign In
              </Link>
            </div>
          </CardFooter>
        </Card>
      </AuthTransition>
    </div>
  )
}
