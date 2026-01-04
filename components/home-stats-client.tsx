"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { NumberTicker } from "@/components/ui/number-ticker"
import { Activity, Users, CheckCircle2 } from "lucide-react"

interface Stats {
  totalUsers: number
  activeAttacks: number
  successRate: number
  completedAttacks: number
}

export default function HomeStatsClient() {
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<Stats>({
    totalUsers: 0,
    activeAttacks: 0,
    successRate: 0,
    completedAttacks: 0,
  })

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch("/api/public/stats")
        if (response.ok) {
          const data = await response.json()
          setStats(data)
        }
      } catch (error) {
        console.error("Failed to fetch stats:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
    
    // Refresh every 10 seconds
    const interval = setInterval(fetchStats, 10000)
    return () => clearInterval(interval)
  }, [])

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="gradient-card">
            <CardHeader>
              <Skeleton className="h-6 w-32" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-24" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <Card className="gradient-card hover:shadow-xl transition-all duration-300 group overflow-hidden relative">
        <div className="shine-effect absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        <CardHeader className="relative z-10">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold">Ongoing Attacks</CardTitle>
            <div className="gradient-feature-icon rounded-lg p-2">
              <Activity className="h-5 w-5 text-primary" />
            </div>
          </div>
        </CardHeader>
        <CardContent className="relative z-10">
          <div className="text-3xl font-bold">
            <NumberTicker value={stats.activeAttacks} delay={0.2} />
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Currently running
          </p>
        </CardContent>
      </Card>

      <Card className="gradient-card hover:shadow-xl transition-all duration-300 group overflow-hidden relative">
        <div className="shine-effect absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        <CardHeader className="relative z-10">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold">Attack Success</CardTitle>
            <div className="gradient-feature-icon rounded-lg p-2">
              <CheckCircle2 className="h-5 w-5 text-primary" />
            </div>
          </div>
        </CardHeader>
        <CardContent className="relative z-10">
          <div className="text-3xl font-bold">
            <NumberTicker value={stats.successRate} delay={0.4} decimalPlaces={1} />%
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Attack completed <NumberTicker value={stats.completedAttacks} delay={0.6} />
          </p>
        </CardContent>
      </Card>

      <Card className="gradient-card hover:shadow-xl transition-all duration-300 group overflow-hidden relative">
        <div className="shine-effect absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        <CardHeader className="relative z-10">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold">User Count</CardTitle>
            <div className="gradient-feature-icon rounded-lg p-2">
              <Users className="h-5 w-5 text-primary" />
            </div>
          </div>
        </CardHeader>
        <CardContent className="relative z-10">
          <div className="text-3xl font-bold">
            <NumberTicker value={stats.totalUsers} delay={0.3} />
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Registered users
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

