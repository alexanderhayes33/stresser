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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Skeleton } from "@/components/ui/skeleton"
import { Plus, Edit, Trash2, RefreshCw, Loader2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import MethodFormDialog from "@/components/method-form-dialog"
import { useAlert } from "@/lib/use-alert"

interface Method {
  id: number
  name: string
  display_name: string
  description: string | null
  is_active: boolean
  category: string | null
  created_at: string
}

export default function MethodsListClient() {
  const router = useRouter()
  const { showAlert, showConfirm, AlertComponent } = useAlert()
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [methods, setMethods] = useState<Method[]>([])
  const [deleting, setDeleting] = useState<number | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingMethodId, setEditingMethodId] = useState<string | undefined>(undefined)

  const fetchMethods = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/admin/methods")
      if (response.ok) {
        const data = await response.json()
        setMethods(data.methods || [])
      }
    } catch (error) {
      console.error("Failed to fetch methods:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    try {
      await fetchMethods()
    } finally {
      setRefreshing(false)
    }
  }

  useEffect(() => {
    fetchMethods()
  }, [])

  const handleDelete = async (id: number) => {
    const confirmed = await showConfirm("Are you sure you want to delete this method?")
    if (!confirmed) {
      return
    }

    setDeleting(id)
    try {
      const response = await fetch(`/api/admin/methods/${id}`, {
        method: "DELETE",
      })

      if (response.ok) {
        setMethods(methods.filter((method) => method.id !== id))
      } else {
        const data = await response.json()
        await showAlert(data.error || "Failed to delete method", "Error")
      }
    } catch (error) {
      console.error("Failed to delete method:", error)
      await showAlert("Failed to delete method", "Error")
    } finally {
      setDeleting(null)
    }
  }

  const handleNewMethod = () => {
    setEditingMethodId(undefined)
    setDialogOpen(true)
  }

  const handleEditMethod = (id: number) => {
    setEditingMethodId(id.toString())
    setDialogOpen(true)
  }

  const handleDialogSuccess = () => {
    setDialogOpen(false)
    setEditingMethodId(undefined)
    fetchMethods()
  }

  const handleDialogCancel = () => {
    setDialogOpen(false)
    setEditingMethodId(undefined)
  }

  // แบ่ง methods ตาม category
  const l4Methods = methods.filter((m) => (m.category || "L4") === "L4").sort((a, b) => a.display_name.localeCompare(b.display_name))
  const l7Methods = methods.filter((m) => m.category === "L7").sort((a, b) => a.display_name.localeCompare(b.display_name))

  const renderMethodsTable = (methodsList: Method[], category: string) => (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Display Name</TableHead>
            <TableHead>Description</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Created</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {methodsList.map((method) => (
            <TableRow key={method.id}>
              <TableCell className="font-mono text-sm">{method.name}</TableCell>
              <TableCell className="font-semibold">{method.display_name}</TableCell>
              <TableCell>{method.description || "-"}</TableCell>
              <TableCell>
                {method.is_active ? (
                  <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20">
                    Active
                  </Badge>
                ) : (
                  <Badge variant="outline" className="bg-red-500/10 text-red-500 border-red-500/20">
                    Inactive
                  </Badge>
                )}
              </TableCell>
              <TableCell className="text-muted-foreground">
                {new Date(method.created_at).toLocaleDateString()}
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleEditMethod(method.id)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(method.id)}
                    disabled={deleting === method.id}
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
  )

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Attack Methods Management</h1>
          <p className="text-muted-foreground">
            Manage attack methods available to users
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
          <Button onClick={handleNewMethod}>
            <Plus className="mr-2 h-4 w-4" />
            New Method
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-32" />
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-32" />
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      ) : methods.length === 0 ? (
        <Card>
          <CardContent className="text-center py-8 text-muted-foreground">
            No methods found
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* L4 Section */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <CardTitle>L4 Methods</CardTitle>
                <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20">
                  {l4Methods.length} methods
                </Badge>
              </div>
              <CardDescription>
                Layer 4 attack methods
              </CardDescription>
            </CardHeader>
            <CardContent>
              {l4Methods.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No L4 methods found
                </div>
              ) : (
                renderMethodsTable(l4Methods, "L4")
              )}
            </CardContent>
          </Card>

          {/* L7 Section */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <CardTitle>L7 Methods</CardTitle>
                <Badge variant="outline" className="bg-blue-500/10 text-blue-500 border-blue-500/20">
                  {l7Methods.length} methods
                </Badge>
              </div>
              <CardDescription>
                Layer 7 attack methods
              </CardDescription>
            </CardHeader>
            <CardContent>
              {l7Methods.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No L7 methods found
                </div>
              ) : (
                renderMethodsTable(l7Methods, "L7")
              )}
            </CardContent>
          </Card>
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {editingMethodId ? "Edit Method" : "New Method"}
            </DialogTitle>
            <DialogDescription>
              {editingMethodId
                ? "Update attack method details"
                : "Create a new attack method"}
            </DialogDescription>
          </DialogHeader>
          <MethodFormDialog
            methodId={editingMethodId}
            onSuccess={handleDialogSuccess}
            onCancel={handleDialogCancel}
          />
          </DialogContent>
        </Dialog>
        <AlertComponent />
      </main>
    )
  }

