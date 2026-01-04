"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { 
  Users, 
  Activity, 
  Target, 
  TrendingUp, 
  CreditCard, 
  Zap,
  Clock,
  ArrowUpRight,
  ArrowDownRight
} from "lucide-react"
import Link from "next/link"

interface Transaction {
  id: number
  amount: number
  status: string
  created_at: string
  reason?: string
  users?: { id: number; username: string }
  plans?: { id: number; name: string } | null
}

interface Attack {
  id: number
  host: string
  port?: number
  method: string
  status: string
  created_at: string
  users?: { id: number; username: string }
}

interface TopUser {
  id: number
  username: string
  balance?: number
  attackCount?: number
}

interface Stats {
  totalUsers: number
  totalAttacks: number
  activeAttacks: number
  successRate: number
  totalRevenue: number
  todayRevenue: number
  monthRevenue: number
  activePlans: number
  totalMethods: number
  recentTransactions: Transaction[]
  recentAttacks: Attack[]
  topUsersByBalance: TopUser[]
  topUsersByAttacks: TopUser[]
}

export default function AdminDashboardClient() {
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<Stats>({
    totalUsers: 0,
    totalAttacks: 0,
    activeAttacks: 0,
    successRate: 0,
    totalRevenue: 0,
    todayRevenue: 0,
    monthRevenue: 0,
    activePlans: 0,
    totalMethods: 0,
    recentTransactions: [],
    recentAttacks: [],
    topUsersByBalance: [],
    topUsersByAttacks: [],
  })

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch("/api/admin/stats")
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
  }, [])

  const getStatusColor = (status: string) => {
    switch (status) {
      case "SUCCESS":
        return "bg-green-500/10 text-green-500"
      case "FAILED":
        return "bg-red-500/10 text-red-500"
      case "PENDING":
        return "bg-yellow-500/10 text-yellow-500"
      case "running":
        return "bg-blue-500/10 text-blue-500"
      case "completed":
        return "bg-green-500/10 text-green-500"
      case "failed":
        return "bg-red-500/10 text-red-500"
      default:
        return "bg-gray-500/10 text-gray-500"
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat("th-TH", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date)
  }

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Admin Dashboard</h1>
        <p className="text-muted-foreground">
          Overview of system statistics and activities
        </p>
      </div>

      {loading ? (
        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
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
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-32" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-32" />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-32" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-32" />
              </CardContent>
            </Card>
          </div>
        </div>
      ) : (
        <>
          {/* Stats Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalUsers.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Registered users
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Attacks</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalAttacks.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  All time attacks
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Attacks</CardTitle>
                <Target className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.activeAttacks}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Currently running
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.successRate}%</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Average success rate
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Revenue Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                <CreditCard className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">฿{stats.totalRevenue.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  All time revenue
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Today Revenue</CardTitle>
                <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">฿{stats.todayRevenue.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Revenue today
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">This Month</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">฿{stats.monthRevenue.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Monthly revenue
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Plans</CardTitle>
                <CreditCard className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.activePlans}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Available plans
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Additional Stats */}
          <div className="grid gap-4 md:grid-cols-2 mb-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Attack Methods</CardTitle>
                <Zap className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalMethods}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Total methods available
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Recent Activities */}
          <div className="grid gap-4 md:grid-cols-2 mb-6">
            {/* Recent Transactions */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Recent Transactions</CardTitle>
                  <CardDescription>Latest payment activities</CardDescription>
                </div>
                <Link href="/admin/transactions" className="text-sm text-primary hover:underline">
                  View all
                </Link>
              </CardHeader>
              <CardContent>
                {stats.recentTransactions.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No transactions yet
                  </p>
                ) : (
                  <div className="space-y-3">
                    {stats.recentTransactions.slice(0, 5).map((transaction) => (
                      <div
                        key={transaction.id}
                        className="flex items-center justify-between p-2 rounded-lg border bg-card"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="text-sm font-medium truncate">
                              {transaction.users?.username || "Unknown"}
                            </p>
                            <Badge className={getStatusColor(transaction.status)}>
                              {transaction.status}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {transaction.plans?.name || transaction.reason || "Topup"}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatDate(transaction.created_at)}
                          </p>
                        </div>
                        <div className="text-right ml-4">
                          <p className="text-sm font-semibold">
                            ฿{parseFloat(String(transaction.amount || 0)).toFixed(2)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Recent Attacks */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Recent Attacks</CardTitle>
                  <CardDescription>Latest attack activities</CardDescription>
                </div>
                <Link href="/admin/attacks" className="text-sm text-primary hover:underline">
                  View all
                </Link>
              </CardHeader>
              <CardContent>
                {stats.recentAttacks.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No attacks yet
                  </p>
                ) : (
                  <div className="space-y-3">
                    {stats.recentAttacks.slice(0, 5).map((attack) => (
                      <div
                        key={attack.id}
                        className="flex items-center justify-between p-2 rounded-lg border bg-card"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="text-sm font-medium truncate">
                              {attack.users?.username || "Unknown"}
                            </p>
                            <Badge className={getStatusColor(attack.status)}>
                              {attack.status}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground truncate">
                            {attack.host}:{attack.port || "N/A"}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {attack.method} • {formatDate(attack.created_at)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Top Users */}
          <div className="grid gap-4 md:grid-cols-2 mb-6">
            {/* Top Users by Balance */}
            <Card>
              <CardHeader>
                <CardTitle>Top Users by Balance</CardTitle>
                <CardDescription>Users with highest balance</CardDescription>
              </CardHeader>
              <CardContent>
                {stats.topUsersByBalance.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No users found
                  </p>
                ) : (
                  <div className="space-y-2">
                    {stats.topUsersByBalance.map((user, index) => (
                      <div
                        key={user.id}
                        className="flex items-center justify-between p-2 rounded-lg border bg-card"
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold">
                            {index + 1}
                          </div>
                          <div>
                            <p className="text-sm font-medium">{user.username}</p>
                            <Link
                              href={`/admin/users/${user.id}/edit`}
                              className="text-xs text-muted-foreground hover:text-primary"
                            >
                              View profile
                            </Link>
                          </div>
                        </div>
                        <p className="text-sm font-semibold">
                          ฿{parseFloat(String(user.balance || 0)).toFixed(2)}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Top Users by Attacks */}
            <Card>
              <CardHeader>
                <CardTitle>Top Users by Attacks</CardTitle>
                <CardDescription>Most active users</CardDescription>
              </CardHeader>
              <CardContent>
                {stats.topUsersByAttacks.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No users found
                  </p>
                ) : (
                  <div className="space-y-2">
                    {stats.topUsersByAttacks.map((user, index) => (
                      <div
                        key={user.id}
                        className="flex items-center justify-between p-2 rounded-lg border bg-card"
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold">
                            {index + 1}
                          </div>
                          <div>
                            <p className="text-sm font-medium">{user.username}</p>
                            <Link
                              href={`/admin/users/${user.id}/edit`}
                              className="text-xs text-muted-foreground hover:text-primary"
                            >
                              View profile
                            </Link>
                          </div>
                        </div>
                        <p className="text-sm font-semibold">
                          {user.attackCount || 0} attacks
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </main>
  )
}

