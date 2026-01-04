"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Skeleton } from "@/components/ui/skeleton"
import { Pagination } from "@/components/ui/pagination"
import { Plus, Edit, Trash2, RefreshCw, Loader2, Search } from "lucide-react"
import UserFormDialog from "@/components/user-form-dialog"
import { useAlert } from "@/lib/use-alert"

interface Plan {
  id: number
  name: string
}

interface User {
  id: number
  username: string
  email: string | null
  role: string
  is_admin: boolean
  is_active: boolean
  points: number
  balance: number | null
  plan_id: number | null
  plans: Plan | null
  created_at: string
}

const ITEMS_PER_PAGE = 25

export default function UsersListClient() {
  const router = useRouter()
  const { showAlert, showConfirm, AlertComponent } = useAlert()
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [users, setUsers] = useState<User[]>([])
  const [total, setTotal] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)
  const [searchQuery, setSearchQuery] = useState("")
  const [deleting, setDeleting] = useState<number | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingUserId, setEditingUserId] = useState<string | undefined>(undefined)

  const fetchUsers = async (page: number = currentPage) => {
    setLoading(true)
    try {
      const offset = (page - 1) * ITEMS_PER_PAGE
      const searchParam = searchQuery.trim() ? `&search=${encodeURIComponent(searchQuery.trim())}` : ''
      const url = `/api/admin/users?limit=${ITEMS_PER_PAGE}&offset=${offset}${searchParam}`
      
      const response = await fetch(url)
      if (response.ok) {
        const data = await response.json()
        setUsers(data.users || [])
        setTotal(data.total || 0)
      }
    } catch (error) {
      console.error("Failed to fetch users:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setCurrentPage(1)
      fetchUsers(1)
    }, 300)

    return () => clearTimeout(timeoutId)
  }, [searchQuery])

  useEffect(() => {
    fetchUsers(currentPage)
  }, [currentPage])

  const totalPages = Math.ceil(total / ITEMS_PER_PAGE)

  const handleRefresh = async () => {
    setRefreshing(true)
    try {
      await fetchUsers(currentPage)
    } finally {
      setRefreshing(false)
    }
  }

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }


  const handleDelete = async (id: number) => {
    const confirmed = await showConfirm("Are you sure you want to delete this user?")
    if (!confirmed) {
      return
    }

    setDeleting(id)
    try {
      const response = await fetch(`/api/admin/users/${id}`, {
        method: "DELETE",
      })

      if (response.ok) {
        fetchUsers(currentPage)
      } else {
        const data = await response.json()
        await showAlert(data.error || "Failed to delete user", "Error")
      }
    } catch (error) {
      console.error("Failed to delete user:", error)
      await showAlert("Failed to delete user", "Error")
    } finally {
      setDeleting(null)
    }
  }

  const handleNewUser = () => {
    setEditingUserId(undefined)
    setDialogOpen(true)
  }

  const handleEditUser = (id: number) => {
    setEditingUserId(id.toString())
    setDialogOpen(true)
  }

  const handleDialogSuccess = () => {
    setDialogOpen(false)
    setEditingUserId(undefined)
    fetchUsers(currentPage)
  }

  const handleDialogCancel = () => {
    setDialogOpen(false)
    setEditingUserId(undefined)
  }

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Users Management</h1>
          <p className="text-muted-foreground">
            Manage all users in the system
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
          <Button onClick={handleNewUser}>
            <Plus className="mr-2 h-4 w-4" />
            New User
          </Button>
        </div>
      </div>

      {/* Search */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Search Users</CardTitle>
          <CardDescription>Search by user ID, username, or email</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Label htmlFor="search" className="sr-only">Search</Label>
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="search"
              type="text"
              placeholder="Search by user ID, username, or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>All Users</CardTitle>
          <CardDescription>
            Showing {users.length} of {total} users (Page {currentPage} of {totalPages || 1})
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {searchQuery ? "No users found matching your search" : "No users found"}
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Username</TableHead>
                      <TableHead>Plan</TableHead>
                      <TableHead>Balance</TableHead>
                      <TableHead>Admin</TableHead>
                      <TableHead>Active</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">{user.id}</TableCell>
                        <TableCell>{user.username}</TableCell>
                        <TableCell>
                          {user.plans ? (
                            <span className="font-medium">{user.plans.name}</span>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <span className="font-medium">
                            ฿{parseFloat(String(user.balance || 0)).toFixed(2)}
                          </span>
                        </TableCell>
                        <TableCell>
                          {user.is_admin ? (
                            <span className="text-green-500">Yes</span>
                          ) : (
                            <span className="text-muted-foreground">No</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {user.is_active ? (
                            <span className="text-green-500">Active</span>
                          ) : (
                            <span className="text-red-500">Inactive</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {new Date(user.created_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEditUser(user.id)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDelete(user.id)}
                              disabled={deleting === user.id}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
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

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingUserId ? "Edit User" : "New User"}
            </DialogTitle>
            <DialogDescription>
              {editingUserId
                ? "Update user details and limits"
                : "Create a new user account"}
            </DialogDescription>
          </DialogHeader>
          <UserFormDialog
            userId={editingUserId}
            onSuccess={handleDialogSuccess}
            onCancel={handleDialogCancel}
          />
        </DialogContent>
      </Dialog>
      <AlertComponent />
    </main>
  )
}

