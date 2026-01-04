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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Plus, Edit, Trash2, RefreshCw, Loader2, Infinity, UserPlus } from "lucide-react"
import PlanFormDialog from "@/components/plan-form-dialog"
import AssignPlanDialog from "@/components/assign-plan-dialog"
import { useAlert } from "@/lib/use-alert"

interface Plan {
  id: number
  name: string
  description: string | null
  max_concurrent: number | null
  max_time: number | null
  allowed_methods: string[] | null
  price: number | null
  cooldown: number | null
  is_active: boolean
  is_popular?: boolean
  created_at: string
  updated_at: string
}

export default function PlansListClient() {
  const { showAlert, showConfirm, AlertComponent } = useAlert()
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [plans, setPlans] = useState<Plan[]>([])
  const [deleting, setDeleting] = useState<number | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingPlanId, setEditingPlanId] = useState<string | undefined>(undefined)
  const [assignDialogOpen, setAssignDialogOpen] = useState(false)

  const fetchPlans = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/admin/plans")
      if (response.ok) {
        const data = await response.json()
        setPlans(data.plans || [])
      }
    } catch (error) {
      console.error("Failed to fetch plans:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    try {
      await fetchPlans()
    } finally {
      setRefreshing(false)
    }
  }

  useEffect(() => {
    fetchPlans()
  }, [])

  const handleDelete = async (id: number) => {
    const confirmed = await showConfirm("Are you sure you want to delete this plan?")
    if (!confirmed) {
      return
    }

    setDeleting(id)
    try {
      const response = await fetch(`/api/admin/plans/${id}`, {
        method: "DELETE",
      })

      if (response.ok) {
        setPlans(plans.filter((plan) => plan.id !== id))
      } else {
        const data = await response.json()
        await showAlert(data.error || "Failed to delete plan", "Error")
      }
    } catch (error) {
      console.error("Failed to delete plan:", error)
      await showAlert("Failed to delete plan", "Error")
    } finally {
      setDeleting(null)
    }
  }

  const handleNewPlan = () => {
    setEditingPlanId(undefined)
    setDialogOpen(true)
  }

  const handleEditPlan = (id: number) => {
    setEditingPlanId(id.toString())
    setDialogOpen(true)
  }

  const handleDialogClose = () => {
    setDialogOpen(false)
    setEditingPlanId(undefined)
  }

  const handleSuccess = () => {
    handleDialogClose()
    fetchPlans()
  }

  const formatLimit = (value: number | null) => {
    if (value === null) return "∞"
    return value.toString()
  }

  const formatPrice = (price: number | null) => {
    if (price === null) return "Free"
    return `฿${price.toFixed(2)}`
  }

  return (
    <main className="container mx-auto px-4 py-4 lg:py-8">
      <div className="mb-6 lg:mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold mb-2">Plans</h1>
          <p className="text-sm lg:text-base text-muted-foreground">
            Manage pricing plans
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
          <Button variant="outline" onClick={() => setAssignDialogOpen(true)}>
            <UserPlus className="h-4 w-4 mr-2" />
            Add Plan to User
          </Button>
          <Button onClick={handleNewPlan}>
            <Plus className="h-4 w-4 mr-2" />
            New Plan
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Plans</CardTitle>
          <CardDescription>
            Manage all pricing plans in the system
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : plans.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No plans found. Create your first plan to get started.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Max Concurrent</TableHead>
                    <TableHead>Max Time</TableHead>
                    <TableHead>Allowed Methods</TableHead>
                    <TableHead>Cooldown</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Popular</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {plans.map((plan) => (
                    <TableRow key={plan.id}>
                      <TableCell className="font-medium">{plan.name}</TableCell>
                      <TableCell className="max-w-xs truncate">
                        {plan.description || "-"}
                      </TableCell>
                      <TableCell>{formatLimit(plan.max_concurrent)}</TableCell>
                      <TableCell>
                        {formatLimit(plan.max_time)} {plan.max_time !== null && "s"}
                      </TableCell>
                      <TableCell>
                        {plan.allowed_methods && plan.allowed_methods.length > 0
                          ? `${plan.allowed_methods.length} methods`
                          : "All"}
                      </TableCell>
                      <TableCell>
                        {plan.cooldown === null || plan.cooldown === 0
                          ? "None"
                          : `${plan.cooldown}s`}
                      </TableCell>
                      <TableCell>{formatPrice(plan.price)}</TableCell>
                      <TableCell>
                        <Badge variant={plan.is_active ? "default" : "outline"}>
                          {plan.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={plan.is_popular ? "default" : "outline"}>
                          {plan.is_popular ? "Popular" : "-"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEditPlan(plan.id)}
                            title="Edit plan"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(plan.id)}
                            disabled={deleting === plan.id}
                            title="Delete plan"
                          >
                            {deleting === plan.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingPlanId ? "Edit Plan" : "New Plan"}
            </DialogTitle>
            <DialogDescription>
              {editingPlanId
                ? "Update plan details below."
                : "Create a new pricing plan."}
            </DialogDescription>
          </DialogHeader>
          <PlanFormDialog
            planId={editingPlanId}
            onSuccess={handleSuccess}
            onCancel={handleDialogClose}
          />
        </DialogContent>
      </Dialog>

      <AssignPlanDialog
        open={assignDialogOpen}
        onClose={() => setAssignDialogOpen(false)}
        onSuccess={handleSuccess}
      />
      <AlertComponent />
    </main>
  )
}

