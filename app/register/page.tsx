"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ThemeToggle } from "@/components/theme-toggle"
import { Zap, Sparkles, UserPlus, ArrowRight, Loader2 } from "lucide-react"
import { SaturnHubLogo } from "@/components/saturn-hub-logo"

export default function RegisterPage() {
  const router = useRouter()
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    if (password !== confirmPassword) {
      setError("Passwords do not match")
      setLoading(false)
      return
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters")
      setLoading(false)
      return
    }

    if (username.length < 3) {
      setError("Username must be at least 3 characters")
      setLoading(false)
      return
    }

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password, confirmPassword }),
        credentials: 'include', // Important for cookies
      })

      if (!response.ok) {
        let errorMessage = "Registration failed"
        try {
          const data = await response.json()
          errorMessage = data.error || errorMessage
        } catch {
          errorMessage = `Server error: ${response.status} ${response.statusText}`
        }
        setError(errorMessage)
        setLoading(false)
        return
      }

      const data = await response.json()

      router.push("/dashboard")
      router.refresh()
    } catch (err: any) {
      console.error('Register error:', err)
      setError(err.message || "An error occurred. Please try again.")
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-background relative overflow-hidden bg-pattern">
      {/* Animated background elements */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }} />
        <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-primary/5 rounded-full blur-3xl animate-float" style={{ animationDelay: '4s' }} />
        <div className="absolute top-1/4 right-1/3 w-64 h-64 bg-primary/8 rounded-full blur-2xl animate-float" style={{ animationDelay: '1s' }} />
        <div className="absolute bottom-1/3 left-1/3 w-80 h-80 bg-primary/6 rounded-full blur-2xl animate-float" style={{ animationDelay: '3s' }} />
      </div>
      
      {/* Grid overlay */}
      <div className="fixed inset-0 -z-10 bg-grid opacity-30" />

      <div className="absolute top-4 right-4 z-20">
        <ThemeToggle />
      </div>

      <div className="flex-1 flex items-center justify-center p-4 relative z-10">
        <Card className="w-full max-w-md gradient-card border-2 shadow-2xl relative overflow-hidden group">
          <div className="shine-effect absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          
          <CardHeader className="space-y-1 text-center relative z-10">
            <div className="flex justify-center mb-6">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass mb-4 animate-pulse-glow">
                <Sparkles className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">Get Started</span>
              </div>
            </div>
            <div className="flex justify-center mb-4">
              <SaturnHubLogo size="lg" />
            </div>
            <CardTitle className="text-3xl lg:text-4xl font-bold mb-2">
              <span className="gradient-text">Create Account</span>
            </CardTitle>
            <CardDescription className="text-base">
              Sign up to get started with Saturn Hub
            </CardDescription>
          </CardHeader>

          <CardContent className="relative z-10">
            <form onSubmit={handleRegister} className="space-y-5">
              <div className="space-y-2">
                <label htmlFor="username" className="text-sm font-medium">
                  Username
                </label>
                <Input
                  id="username"
                  type="text"
                  placeholder="Choose a username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  minLength={3}
                  className="border-2 focus:border-primary/50 transition-all duration-300"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="password" className="text-sm font-medium">
                  Password
                </label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="border-2 focus:border-primary/50 transition-all duration-300"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="confirmPassword" className="text-sm font-medium">
                  Confirm Password
                </label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="border-2 focus:border-primary/50 transition-all duration-300"
                />
              </div>
              {error && (
                <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md border border-destructive/20">
                  {error}
                </div>
              )}
              <Button 
                type="submit" 
                className="w-full gradient-primary shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 text-lg py-6" 
                disabled={loading}
              >
                {loading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <>
                    Sign Up
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </>
                )}
              </Button>
            </form>
            <div className="mt-6 text-center text-sm">
              <span className="text-muted-foreground">Already have an account? </span>
              <Link href="/login" className="text-primary hover:underline font-medium">
                Sign in
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

