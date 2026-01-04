"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Skeleton } from "@/components/ui/skeleton"
import { Input } from "@/components/ui/input"
import { Pagination } from "@/components/ui/pagination"
import { Zap, RefreshCw, CheckCircle2, XCircle, Clock, Loader2, Ban, RotateCw, ArrowDownToLine, Activity } from "lucide-react"
import { AttackCountdown } from "@/components/attack-countdown"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface Attack {
  id: number
  host: string
  port: number
  method: string
  time: number
  status: string
  created_at: string
  started_at: string | null
  completed_at: string | null
  success_count: number
  failed_count: number
  total_requests: number
  concurrent_count: number | null
}

const ITEMS_PER_PAGE = 25

export default function AttacksPageClient() {
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [attacks, setAttacks] = useState<Attack[]>([])
  const [total, setTotal] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)
  const [formData, setFormData] = useState({
    host: "",
    port: "",
    method: "",
    time: "30",
    concurrent: "1",
  })
  const [submitting, setSubmitting] = useState(false)
  const [resendingIds, setResendingIds] = useState<Set<number>>(new Set())
  const [methods, setMethods] = useState<any[]>([])
  const [error, setError] = useState("")

  useEffect(() => {
    fetchAttacks()
    fetchMethods()
  }, [currentPage])

  // Auto-set port to 443 when L7 method is selected
  useEffect(() => {
    if (formData.method) {
      const selectedMethod = methods.find((m) => m.name === formData.method)
      if (selectedMethod?.category === "L7") {
        setFormData((prev) => ({
          ...prev,
          port: "443",
        }))
      }
    }
  }, [formData.method, methods])

  useEffect(() => {
    // Auto-refresh in background every 5 seconds (silent update)
    const interval = setInterval(async () => {
      // Update status first
      await fetch("/api/attacks/update-status", { method: "POST" })
      // Then fetch updated attacks silently (no loading state)
      fetchAttacks(true, currentPage)
    }, 5000)
    
    return () => clearInterval(interval)
  }, [currentPage])

  const fetchAttacks = async (silent = false, page: number = currentPage) => {
    if (!silent) {
      setLoading(true)
    }
    try {
      const offset = (page - 1) * ITEMS_PER_PAGE
      const response = await fetch(`/api/attacks?limit=${ITEMS_PER_PAGE}&offset=${offset}`)
      if (response.ok) {
        const data = await response.json()
        setAttacks(data.attacks || [])
        setTotal(data.total || 0)
      }
    } catch (error) {
      console.error("Failed to fetch attacks:", error)
    } finally {
      if (!silent) {
        setLoading(false)
      }
    }
  }

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    try {
      await fetch("/api/attacks/update-status", { method: "POST" })
      await fetchAttacks(false, currentPage)
    } finally {
      setRefreshing(false)
    }
  }

  const handleResend = async (attack: Attack) => {
    setResendingIds((prev) => new Set(prev).add(attack.id))
    setError("")
    
    try {
      const selectedMethod = methods.find((m) => m.name === attack.method)
      const isL7 = selectedMethod?.category === "L7"
      
      const response = await fetch("/api/attacks/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          host: attack.host,
          port: isL7 ? 443 : attack.port,
          method: attack.method,
          time: attack.time,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        // Refresh attacks list
        await fetchAttacks(false, currentPage)
      } else {
        setError(data.error || "Failed to resend attack")
      }
    } catch (error: any) {
      console.error("Failed to resend attack:", error)
      setError("Failed to resend attack. Please try again.")
    } finally {
      setResendingIds((prev) => {
        const newSet = new Set(prev)
        newSet.delete(attack.id)
        return newSet
      })
    }
  }

  const handleReinput = (attack: Attack) => {
    const selectedMethod = methods.find((m) => m.name === attack.method)
    const isL7 = selectedMethod?.category === "L7"
    
    setFormData({
      host: attack.host || "",
      port: isL7 ? "443" : (attack.port?.toString() || ""),
      method: attack.method || "",
      time: attack.time?.toString() || "30",
      concurrent: attack.concurrent_count?.toString() || "1",
    })
    // Scroll to form
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  const fetchMethods = async () => {
    try {
      const response = await fetch("/api/attack-methods")
      if (response.ok) {
        const data = await response.json()
        setMethods(data.methods || [])
        if (data.methods && data.methods.length > 0) {
          setFormData((prev) => ({
            ...prev,
            method: data.methods[0].name,
          }))
        }
      }
    } catch (error) {
      console.error("Failed to fetch methods:", error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setSubmitting(true)

    try {
      const response = await fetch("/api/attacks/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          host: formData.host.trim(),
          port: (() => {
            const selectedMethod = methods.find((m) => m.name === formData.method)
            return selectedMethod?.category === "L7" ? 443 : parseInt(formData.port)
          })(),
          method: formData.method,
          time: parseInt(formData.time),
          concurrent: formData.concurrent ? parseInt(formData.concurrent.toString()) : 1,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setFormData({
          host: "",
          port: "",
          method: methods[0]?.name || "",
          time: "30",
          concurrent: "1",
        })
        setError("")
        fetchAttacks(false, currentPage)
      } else {
        if (response.status === 429 && data.cooldown_remaining) {
          setError(`Cooldown active. Please wait ${data.cooldown_remaining} seconds before launching another attack.`)
        } else {
          setError(data.error || "Failed to create attack")
        }
      }
    } catch (error: any) {
      console.error("Failed to create attack:", error)
      setError("Failed to create attack. Please try again.")
    } finally {
      setSubmitting(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "running":
        return (
          <Badge variant="info" className="gap-1.5">
            <Loader2 className="h-3 w-3 animate-spin" />
            Running
          </Badge>
        )
      case "completed":
        return (
          <Badge variant="success" className="gap-1.5">
            <CheckCircle2 className="h-3 w-3" />
            Completed
          </Badge>
        )
      case "failed":
        return (
          <Badge variant="error" className="gap-1.5">
            <XCircle className="h-3 w-3" />
            Failed
          </Badge>
        )
      case "cancelled":
        return (
          <Badge variant="outline" className="gap-1.5">
            <Ban className="h-3 w-3" />
            Cancelled
          </Badge>
        )
      case "pending":
        return (
          <Badge variant="warning" className="gap-1.5">
            <Clock className="h-3 w-3" />
            Pending
          </Badge>
        )
      default:
        return (
          <Badge variant="warning" className="gap-1.5">
            <Clock className="h-3 w-3" />
            {status}
          </Badge>
        )
    }
  }

  const getRemainingTime = (attack: Attack) => {
    if (!attack.started_at || attack.status !== "running") return null
    
    const started = new Date(attack.started_at).getTime()
    const now = Date.now()
    const elapsed = Math.floor((now - started) / 1000)
    const remaining = attack.time - elapsed
    
    return remaining > 0 ? remaining : 0
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  // Filter and update status based on time
  const processedAttacks = attacks.map((attack) => {
    if (attack.status === "running" && attack.started_at) {
      const remaining = getRemainingTime(attack)
      if (remaining !== null && remaining <= 0) {
        // Time expired, should be completed
        return { ...attack, status: "completed" as const }
      }
    }
    return attack
  })

  // Group attacks by concurrent batch (same host, port, method, time, created_at within 1 second)
  // Only group if there are multiple records with same parameters (old data)
  // New attacks are single records with concurrent_count already set
  const groupAttacks = (attacks: Attack[]) => {
    const grouped = new Map<string, Attack[]>()
    
    attacks.forEach((attack) => {
      // Create a key based on attack parameters and creation time (rounded to nearest second)
      const createdTime = new Date(attack.created_at).getTime()
      const roundedTime = Math.floor(createdTime / 1000) * 1000
      const key = `${attack.host}-${attack.port}-${attack.method}-${attack.time}-${roundedTime}`
      
      if (!grouped.has(key)) {
        grouped.set(key, [])
      }
      grouped.get(key)!.push(attack)
    })
    
    // Return attacks: if group has multiple records, use first with sum of concurrent_count
    // If group has single record, use it as-is (concurrent_count already correct)
    return Array.from(grouped.values()).map((group) => {
      const first = group[0]
      // Only sum if there are multiple records (old data format)
      if (group.length > 1) {
        const totalConcurrent = group.reduce((sum, a) => sum + (a.concurrent_count || 1), 0)
        return {
          ...first,
          concurrent_count: totalConcurrent,
        }
      }
      // Single record - use concurrent_count as-is
      return first
    })
  }

  const ongoingAttacks = groupAttacks(
    processedAttacks.filter((a) => a.status === "running" || a.status === "pending")
  )
  const historyAttacks = groupAttacks(
    processedAttacks.filter((a) => a.status !== "running" && a.status !== "pending")
  )

  const totalPages = Math.ceil(total / ITEMS_PER_PAGE)

  return (
    <main className="container mx-auto px-4 py-8 lg:py-16 min-h-0 relative bg-pattern">
      {/* Animated background elements */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }} />
        <div className="absolute top-1/4 right-1/3 w-64 h-64 bg-primary/8 rounded-full blur-2xl animate-float" style={{ animationDelay: '1s' }} />
        <div className="absolute bottom-1/3 left-1/3 w-80 h-80 bg-primary/6 rounded-full blur-2xl animate-float" style={{ animationDelay: '3s' }} />
      </div>
      
      {/* Grid overlay */}
      <div className="fixed inset-0 -z-10 bg-grid opacity-20" />

      <div className="mb-12 lg:mb-16 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative z-10">
        <div>
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass mb-6 animate-pulse-glow">
            <span className="text-sm font-medium">Attack HUB</span>
          </div>
          <h1 className="text-4xl lg:text-6xl font-bold mb-4">
            <span className="gradient-text">Attacks</span>
          </h1>
          <p className="text-lg lg:text-xl text-muted-foreground max-w-2xl">
            Manage your attacks and view history
          </p>
        </div>
        <Button 
          variant="outline" 
          size="icon" 
          onClick={handleRefresh}
          disabled={refreshing}
          className="shadow-lg hover:shadow-xl transition-all duration-300"
        >
          {refreshing ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4" />
          )}
        </Button>
      </div>

      <Card className="gradient-card hover:shadow-xl transition-all duration-300 group overflow-hidden relative mb-8">
        <div className="shine-effect absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        <CardHeader className="relative z-10">
          <CardTitle className="flex items-center gap-2 text-xl">
            <div className="gradient-feature-icon rounded-lg p-2">
              <Zap className="h-5 w-5 text-primary" />
            </div>
            New Attack
          </CardTitle>
          <CardDescription className="text-base">
            Create a new attack on a target
          </CardDescription>
        </CardHeader>
        <CardContent className="relative z-10">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label htmlFor="host" className="text-sm font-medium">
                  Host (IP / URL)
                </label>
                <Input
                  id="host"
                  type="text"
                  value={formData.host}
                  onChange={(e) =>
                    setFormData({ ...formData, host: e.target.value })
                  }
                  placeholder="70.70.70.7 or example.com"
                  required
                />
              </div>

              {(() => {
                const selectedMethod = methods.find((m) => m.name === formData.method)
                const isL7 = selectedMethod?.category === "L7"
                
                if (isL7) {
                  return (
                    <div className="space-y-2">
                      <label htmlFor="port" className="text-sm font-medium">
                        Port (Auto: 443 for L7)
                      </label>
                      <Input
                        id="port"
                        type="number"
                        value="443"
                        disabled
                        className="bg-muted"
                      />
                      <p className="text-xs text-muted-foreground">
                        Port 443 is automatically set for L7 methods
                      </p>
                    </div>
                  )
                }
                
                return (
                  <div className="space-y-2">
                    <label htmlFor="port" className="text-sm font-medium">
                      Port
                    </label>
                    <Input
                      id="port"
                      type="number"
                      min="1"
                      max="65535"
                      value={formData.port}
                      onChange={(e) =>
                        setFormData({ ...formData, port: e.target.value })
                      }
                      placeholder="25565"
                      required
                    />
                  </div>
                )
              })()}

              <div className="space-y-2">
                <label htmlFor="method" className="text-sm font-medium">
                  Method
                </label>
                {methods.length > 0 ? (
                  <Select
                    value={formData.method}
                    onValueChange={(value) => {
                      const selectedMethod = methods.find((m) => m.name === value)
                      setFormData({
                        ...formData,
                        method: value,
                        port: selectedMethod?.category === "L7" ? "443" : formData.port,
                      })
                    }}
                    required
                  >
                    <SelectTrigger id="method">
                      <SelectValue placeholder="Select a method" />
                    </SelectTrigger>
                    <SelectContent>
                      {methods.map((method) => (
                        <SelectItem key={method.id} value={method.name}>
                          <span className="flex items-center gap-2">
                            <span>{method.display_name}</span>
                            {method.category && (
                              <Badge variant="outline" className={`text-xs ${method.category === "L7" ? "bg-blue-500/10 text-blue-500 border-blue-500/20" : "bg-green-500/10 text-green-500 border-green-500/20"}`}>
                                {method.category}
                              </Badge>
                            )}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Skeleton className="h-10 w-full" />
                )}
              </div>

              <div className="space-y-2">
                <label htmlFor="time" className="text-sm font-medium">
                  Time (seconds)
                </label>
                <Input
                  id="time"
                  type="number"
                  min="1"
                  value={formData.time}
                  onChange={(e) =>
                    setFormData({ ...formData, time: e.target.value })
                  }
                  required
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="concurrent" className="text-sm font-medium">
                  Concurrent
                </label>
                <Input
                  id="concurrent"
                  type="number"
                  min="1"
                  value={formData.concurrent}
                  onChange={(e) =>
                    setFormData({ ...formData, concurrent: e.target.value })
                  }
                  placeholder="1"
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Number of concurrent attacks
                </p>
              </div>
            </div>

            {error && (
              <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">
                {error}
              </div>
            )}

            <div className="flex justify-end gap-2">
              <Button 
                type="submit" 
                disabled={submitting}
                className="gradient-primary shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
              >
                {submitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <Zap className="mr-2 h-4 w-4" />
                    Start Attack
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {ongoingAttacks.length > 0 && (
        <Card className="gradient-card hover:shadow-xl transition-all duration-300 group overflow-hidden relative mb-8">
          <div className="shine-effect absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <CardHeader className="relative z-10">
            <CardTitle className="flex items-center gap-2 text-xl">
              <div className="gradient-feature-icon rounded-lg p-2">
                <Activity className="h-5 w-5 text-primary" />
              </div>
              Ongoing Attacks
            </CardTitle>
            <CardDescription className="text-base">
              Currently running attacks
            </CardDescription>
          </CardHeader>
          <CardContent className="relative z-10">
            {loading ? (
              <div className="space-y-2">
                {[1, 2].map((i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Host</TableHead>
                      <TableHead>Port</TableHead>
                      <TableHead>Method</TableHead>
                      <TableHead>Time</TableHead>
                      <TableHead>Concurrent</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Remaining</TableHead>
                      <TableHead>Started</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {ongoingAttacks.map((attack) => (
                      <TableRow key={attack.id}>
                        <TableCell className="font-medium">{attack.host}</TableCell>
                        <TableCell>{attack.port}</TableCell>
                        <TableCell>{attack.method}</TableCell>
                        <TableCell>{attack.time}s</TableCell>
                        <TableCell>{attack.concurrent_count || 1}</TableCell>
                        <TableCell>
                          {getStatusBadge(attack.status)}
                        </TableCell>
                        <TableCell>
                          <AttackCountdown
                            startedAt={attack.started_at}
                            duration={attack.time}
                            status={attack.status}
                          />
                        </TableCell>
                        <TableCell>
                          {attack.started_at
                            ? new Date(attack.started_at).toLocaleString()
                            : attack.status === "pending"
                            ? "Pending"
                            : "-"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Card className="gradient-card hover:shadow-xl transition-all duration-300 group overflow-hidden relative">
        <div className="shine-effect absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        <CardHeader className="relative z-10">
          <CardTitle className="flex items-center gap-2 text-xl">
            <div className="gradient-feature-icon rounded-lg p-2">
              <Clock className="h-5 w-5 text-primary" />
            </div>
            Attack History
          </CardTitle>
          <CardDescription className="text-base">
            Showing {attacks.length} of {attacks.length} attacks (Page {currentPage} of {totalPages || 1})
          </CardDescription>
        </CardHeader>
        <CardContent className="relative z-10">
          {loading ? (
            <div className="space-y-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : historyAttacks.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No attack history found
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Host</TableHead>
                      <TableHead>Port</TableHead>
                      <TableHead>Method</TableHead>
                      <TableHead>Time</TableHead>
                      <TableHead>Concurrent</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {historyAttacks.map((attack) => (
                      <TableRow key={attack.id}>
                        <TableCell className="font-medium">{attack.host}</TableCell>
                        <TableCell>{attack.port}</TableCell>
                        <TableCell>{attack.method}</TableCell>
                        <TableCell>{attack.time}s</TableCell>
                        <TableCell>{attack.concurrent_count || 1}</TableCell>
                        <TableCell>
                          {getStatusBadge(attack.status)}
                        </TableCell>
                        <TableCell>
                          {new Date(attack.created_at).toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleReinput(attack)}
                              title="Fill form with this attack data"
                            >
                              <ArrowDownToLine className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleResend(attack)}
                              disabled={resendingIds.has(attack.id)}
                              title="Resend attack"
                            >
                              {resendingIds.has(attack.id) ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <RotateCw className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              {totalPages > 1 && (
                <div className="mt-6">
                  <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={handlePageChange}
                  />
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </main>
  )
}

