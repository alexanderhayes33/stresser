"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
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
import { Pagination } from "@/components/ui/pagination"
import { Plus, Edit, Trash2, RefreshCw, CheckCircle2, XCircle, Clock, Loader2, Ban, Search, Filter } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useAlert } from "@/lib/use-alert"
import AttackCreateDialog from "@/components/attack-create-dialog"

const ITEMS_PER_PAGE = 25

interface Attack {
  id: number
  user_id: number
  target_url: string
  method: string
  duration_seconds: number
  threads: number
  status: string
  success_count: number
  failed_count: number
  total_requests: number
  concurrent_count: number | null
  started_at: string | null
  completed_at: string | null
  created_at: string
  users?: {
    id: number
    username: string
    email: string | null
  }
}

export default function AttacksListClient() {
  const router = useRouter()
  const { showAlert, showConfirm, AlertComponent } = useAlert()
  const [initialLoading, setInitialLoading] = useState(true)
  const [tableLoading, setTableLoading] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [attacks, setAttacks] = useState<Attack[]>([])
  const [total, setTotal] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)
  const [deleting, setDeleting] = useState<number | null>(null)
  const [searchUserId, setSearchUserId] = useState("")
  const [searchTarget, setSearchTarget] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [dialogOpen, setDialogOpen] = useState(false)

  const fetchAttacks = async (page: number = currentPage, isInitial: boolean = false) => {
    if (isInitial) {
      setInitialLoading(true)
    } else {
      setTableLoading(true)
    }
    try {
      const offset = (page - 1) * ITEMS_PER_PAGE
      const params = new URLSearchParams({
        limit: ITEMS_PER_PAGE.toString(),
        offset: offset.toString(),
      })
      
      if (searchUserId) {
        params.append('user_id', searchUserId)
      }
      
      if (searchTarget) {
        params.append('target', searchTarget)
      }
      
      if (statusFilter && statusFilter !== 'all') {
        params.append('status', statusFilter)
      }
      
      const response = await fetch(`/api/admin/attacks?${params.toString()}`)
      if (response.ok) {
        const data = await response.json()
        setAttacks(data.attacks || [])
        setTotal(data.total || 0)
      }
    } catch (error) {
      console.error("Failed to fetch attacks:", error)
    } finally {
      if (isInitial) {
        setInitialLoading(false)
      } else {
        setTableLoading(false)
      }
    }
  }

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setCurrentPage(1)
      fetchAttacks(1, false)
    }, 300)

    return () => clearTimeout(timeoutId)
  }, [searchUserId, searchTarget, statusFilter])

  useEffect(() => {
    if (!initialLoading) {
      fetchAttacks(currentPage, false)
    }
  }, [currentPage])

  useEffect(() => {
    fetchAttacks(1, true)
  }, [])

  const totalPages = Math.ceil(total / ITEMS_PER_PAGE)

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    try {
      await fetchAttacks(currentPage, false)
    } finally {
      setRefreshing(false)
    }
  }

  const handleDelete = async (id: number) => {
    const confirmed = await showConfirm("Are you sure you want to delete this attack?")
    if (!confirmed) {
      return
    }

    setDeleting(id)
    try {
      const response = await fetch(`/api/admin/attacks/${id}`, {
        method: "DELETE",
      })

      if (response.ok) {
        fetchAttacks(currentPage, false)
      } else {
        await showAlert("Failed to delete attack", "Error")
      }
    } catch (error) {
      console.error("Failed to delete attack:", error)
      await showAlert("Failed to delete attack", "Error")
    } finally {
      setDeleting(null)
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

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Attacks Management</h1>
          <p className="text-muted-foreground">
            Manage all attacks in the system
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="icon" 
            onClick={handleRefresh}
            disabled={refreshing}
          >
            {refreshing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
          </Button>
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            New Attack
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Search & Filters
          </CardTitle>
          <CardDescription>Search by user ID, target URL, or filter by status</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="search-user">User ID</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search-user"
                  type="text"
                  placeholder="Search by user ID..."
                  value={searchUserId}
                  onChange={(e) => setSearchUserId(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="search-target">Target URL / Host</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search-target"
                  type="text"
                  placeholder="Search by target URL or host..."
                  value={searchTarget}
                  onChange={(e) => setSearchTarget(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger id="status">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="running">Running</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>All Attacks</CardTitle>
          <CardDescription>
            Showing {attacks.length} of {total} attacks (Page {currentPage} of {totalPages || 1})
          </CardDescription>
        </CardHeader>
        <CardContent>
          {initialLoading ? (
            <div className="space-y-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : attacks.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No attacks found
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>User</TableHead>
                      <TableHead>Target URL</TableHead>
                      <TableHead>Method</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Concurrent</TableHead>
                      <TableHead>Duration</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tableLoading ? (
                      Array.from({ length: 5 }).map((_, i) => (
                        <TableRow key={i}>
                          <TableCell colSpan={8}>
                            <div className="flex items-center space-x-4 py-4">
                              <Skeleton className="h-4 w-16" />
                              <Skeleton className="h-4 w-32" />
                              <Skeleton className="h-4 w-40" />
                              <Skeleton className="h-4 w-24" />
                              <Skeleton className="h-4 w-20" />
                              <Skeleton className="h-4 w-16" />
                              <Skeleton className="h-4 w-20" />
                              <Skeleton className="h-4 w-28" />
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      attacks.map((attack) => (
                      <TableRow key={attack.id}>
                        <TableCell className="font-medium">{attack.id}</TableCell>
                        <TableCell>
                          {attack.users?.username || `User #${attack.user_id}`}
                        </TableCell>
                        <TableCell className="max-w-xs truncate">
                          {attack.target_url}
                        </TableCell>
                        <TableCell>{attack.method}</TableCell>
                        <TableCell>
                          {getStatusBadge(attack.status)}
                        </TableCell>
                        <TableCell>{attack.concurrent_count || 1}</TableCell>
                        <TableCell>{attack.duration_seconds}s</TableCell>
                        <TableCell>
                          {new Date(attack.created_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() =>
                                router.push(`/admin/attacks/${attack.id}/edit`)
                              }
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDelete(attack.id)}
                              disabled={deleting === attack.id}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                    )}
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
      <AttackCreateDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSuccess={() => {
          fetchAttacks(currentPage, false)
        }}
      />
      <AlertComponent />
    </main>
  )
}

