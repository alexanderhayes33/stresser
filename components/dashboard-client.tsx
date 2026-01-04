"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Activity, Target, Clock, Shield, CreditCard, Users, Zap, Infinity, Wallet } from "lucide-react"
import type { User } from "@/lib/get-user"

interface DashboardClientProps {
  user: User
}

interface Plan {
  id: number
  name: string
  description: string | null
  max_concurrent: number | null
  max_time: number | null
  allowed_methods: string[] | null
  price: number | null
  cooldown: number | null
}

interface UserProfile {
  user: User & {
    plan: Plan | null
    plan_id: number | null
    max_concurrent: number | null
    max_time: number | null
    allowed_methods: string[] | null
    cooldown_until: string | null
    balance: number
  }
  paymentHistory: Array<{
    id: number
    amount: number
    status: string
    created_at: string
    plan_id: number | null
    reason: string | null
    plans: {
      id: number
      name: string
    } | null
  }>
  currentConcurrent: number
}

export default function DashboardClient({ user }: DashboardClientProps) {
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalAttacks: 0,
    activeAttacks: 0,
    successRate: 0,
    completedAttacks: 0,
  })
  const [profile, setProfile] = useState<UserProfile | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch attack stats
        const statsResponse = await fetch("/api/attacks/stats")
        if (statsResponse.ok) {
          const statsData = await statsResponse.json()
          setStats({
            totalAttacks: statsData.totalAttacks || 0,
            activeAttacks: statsData.activeAttacks || 0,
            successRate: statsData.successRate || 0,
            completedAttacks: statsData.completedAttacks || 0,
          })
        }

        // Fetch user profile
        const profileResponse = await fetch("/api/user/profile")
        if (profileResponse.ok) {
          const profileData = await profileResponse.json()
          setProfile(profileData)
        }
      } catch (error) {
        console.error("Failed to fetch data:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const formatLimit = (value: number | null) => {
    if (value === null || value === undefined) return "∞"
    return value.toString()
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  return (
    <main className="container mx-auto px-4 py-8 lg:py-16 min-h-0 relative bg-pattern">
      {/* Animated background elements */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }} />
        <div className="absolute top-1/4 right-1/3 w-64 h-64 bg-primary/8 rounded-full blur-2xl animate-float" style={{ animationDelay: '1s' }} />
        <div className="absolute bottom-1/3 left-1/3 w-80 h-80 bg-primary/6 rounded-full blur-2xl animate-float" style={{ animationDelay: '3s' }} />
      </div>
      
      {/* Grid overlay */}
      <div className="fixed inset-0 -z-10 bg-grid opacity-20" />

      <div className="mb-12 lg:mb-16 relative z-10">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass mb-6 animate-pulse-glow">
          <span className="text-sm font-medium">Dashboard Overview</span>
        </div>
        <h1 className="text-4xl lg:text-6xl font-bold mb-4">
          <span className="gradient-text">Dashboard</span>
        </h1>
        <p className="text-lg lg:text-xl text-muted-foreground max-w-2xl">
          Important information and usage statistics
        </p>
      </div>

      {loading ? (
        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-4 w-24" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-8 w-32" />
                </CardContent>
              </Card>
            ))}
          </div>
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-48" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-32 w-full" />
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="space-y-6 relative z-10">
          {/* Attack Statistics */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <Card className="gradient-card hover:shadow-xl transition-all duration-300 group overflow-hidden relative">
              <div className="shine-effect absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
                <CardTitle className="text-sm font-medium">Total Attacks</CardTitle>
                <div className="gradient-feature-icon rounded-lg p-2">
                  <Activity className="h-4 w-4 text-primary" />
                </div>
              </CardHeader>
              <CardContent className="relative z-10">
                <div className="text-3xl font-bold gradient-text">{stats.totalAttacks.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Total attack executions
                </p>
              </CardContent>
            </Card>

            <Card className="gradient-card hover:shadow-xl transition-all duration-300 group overflow-hidden relative">
              <div className="shine-effect absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
                <CardTitle className="text-sm font-medium">Active Attacks</CardTitle>
                <div className="gradient-feature-icon rounded-lg p-2">
                  <Target className="h-4 w-4 text-primary" />
                </div>
              </CardHeader>
              <CardContent className="relative z-10">
                <div className="text-3xl font-bold gradient-text">{stats.activeAttacks}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Currently running
                </p>
              </CardContent>
            </Card>

            <Card className="gradient-card hover:shadow-xl transition-all duration-300 group overflow-hidden relative">
              <div className="shine-effect absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
                <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
                <div className="gradient-feature-icon rounded-lg p-2">
                  <Clock className="h-4 w-4 text-primary" />
                </div>
              </CardHeader>
              <CardContent className="relative z-10">
                <div className="text-3xl font-bold gradient-text">{stats.successRate}%</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Attack completed {(stats.completedAttacks || 0).toLocaleString()}
                </p>
              </CardContent>
            </Card>

            {profile && (
              <Card className="gradient-card hover:shadow-xl transition-all duration-300 group overflow-hidden relative">
                <div className="shine-effect absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
                  <CardTitle className="text-sm font-medium">Balance</CardTitle>
                  <div className="gradient-feature-icon rounded-lg p-2">
                    <Wallet className="h-4 w-4 text-primary" />
                  </div>
                </CardHeader>
                <CardContent className="relative z-10">
                  <div className="text-3xl font-bold gradient-text">฿{profile.user.balance?.toFixed(2) || "0.00"}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Available balance
                  </p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* User Plan Information */}
          {profile && (
            <Card className="gradient-card hover:shadow-xl transition-all duration-300 group overflow-hidden relative">
              <div className="shine-effect absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <CardHeader className="relative z-10">
                <CardTitle className="flex items-center gap-2 text-xl">
                  <div className="gradient-feature-icon rounded-lg p-2">
                    <CreditCard className="h-5 w-5 text-primary" />
                  </div>
                  Current Plan
                </CardTitle>
                <CardDescription className="text-base">
                  Your plan information and usage limits
                </CardDescription>
              </CardHeader>
              <CardContent className="relative z-10">
                {profile.user.plan ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-xl font-semibold">{profile.user.plan.name}</h3>
                        {profile.user.plan.description && (
                          <p className="text-sm text-muted-foreground mt-1">
                            {profile.user.plan.description}
                          </p>
                        )}
                      </div>
                      {profile.user.plan.price && (
                        <Badge variant="default" className="text-sm gradient-primary">
                          ฿{profile.user.plan.price.toFixed(2)}/m
                        </Badge>
                      )}
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t">
                      <div className="p-3 rounded-lg hover:bg-muted/50 transition-colors">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                          <div className="gradient-feature-icon rounded-lg p-1">
                            <Zap className="h-4 w-4 text-primary" />
                          </div>
                          <span>Concurrent</span>
                        </div>
                        <div className="text-xl font-semibold">
                          {profile.currentConcurrent} / {formatLimit(profile.user.plan?.max_concurrent ?? profile.user.max_concurrent)}
                        </div>
                      </div>
                      <div className="p-3 rounded-lg hover:bg-muted/50 transition-colors">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                          <div className="gradient-feature-icon rounded-lg p-1">
                            <Clock className="h-4 w-4 text-primary" />
                          </div>
                          <span>Max Time</span>
                        </div>
                        <div className="text-xl font-semibold">
                          {formatLimit(profile.user.plan?.max_time ?? profile.user.max_time)}s
                        </div>
                      </div>
                      <div className="p-3 rounded-lg hover:bg-muted/50 transition-colors">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                          <div className="gradient-feature-icon rounded-lg p-1">
                            <Target className="h-4 w-4 text-primary" />
                          </div>
                          <span>Methods</span>
                        </div>
                        <div className="text-xl font-semibold">
                          {profile.user.allowed_methods && profile.user.allowed_methods.length > 0
                            ? profile.user.allowed_methods.length
                            : "∞"}
                        </div>
                      </div>
                      <div className="p-3 rounded-lg hover:bg-muted/50 transition-colors">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                          <div className="gradient-feature-icon rounded-lg p-1">
                            <Shield className="h-4 w-4 text-primary" />
                          </div>
                          <span>Cooldown</span>
                        </div>
                        <div className="text-xl font-semibold">
                          {profile.user.plan.cooldown === null || profile.user.plan.cooldown === 0
                            ? "0s"
                            : `${profile.user.plan.cooldown}s`}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground text-lg">You don't have a plan yet</p>
                    <p className="text-sm text-muted-foreground mt-2">
                      Visit the Pricing page to purchase a plan
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Payment History */}
          {profile && profile.paymentHistory.length > 0 && (
            <Card className="gradient-card hover:shadow-xl transition-all duration-300 group overflow-hidden relative">
              <div className="shine-effect absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <CardHeader className="relative z-10">
                <CardTitle className="flex items-center gap-2 text-xl">
                  <div className="gradient-feature-icon rounded-lg p-2">
                    <Activity className="h-5 w-5 text-primary" />
                  </div>
                  Recent Payment History
                </CardTitle>
                <CardDescription className="text-base">
                  Last 5 payment transactions
                </CardDescription>
              </CardHeader>
              <CardContent className="relative z-10">
                <div className="space-y-3">
                  {profile.paymentHistory.map((payment) => {
                    // กำหนดประเภทของรายการ
                    let transactionType = ""
                    if (payment.plan_id === null && payment.reason && payment.reason.includes("Added to balance")) {
                      transactionType = "Balance topup"
                    } else if (payment.plan_id !== null && payment.plans) {
                      transactionType = `Buy plan ${payment.plans.name}`
                    } else if (payment.plan_id !== null) {
                      transactionType = "Buy plan"
                    } else {
                      transactionType = "Payment"
                    }

                    return (
                      <div
                        key={payment.id}
                        className="flex items-center justify-between p-4 rounded-lg border gradient-card hover:border-primary/50 transition-all duration-300"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="font-bold text-lg gradient-text">฿{payment.amount.toFixed(2)}</span>
                            <Badge
                              variant={payment.status === "SUCCESS" ? "default" : "destructive"}
                              className={payment.status === "SUCCESS" ? "gradient-primary" : ""}
                            >
                              {payment.status === "SUCCESS" ? "Success" : "Failed"}
                            </Badge>
                          </div>
                          <p className="text-sm font-medium text-foreground">
                            {transactionType}
                          </p>
                          {payment.reason && (
                            <p className="text-xs text-muted-foreground mt-1">
                              {payment.reason}
                            </p>
                          )}
                          <p className="text-xs text-muted-foreground mt-1">
                            {formatDate(payment.created_at)}
                          </p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </main>
  )
}

