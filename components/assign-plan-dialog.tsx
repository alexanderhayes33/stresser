"use client"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Loader2, Calendar, Clock } from "lucide-react"
import { useAlert } from "@/lib/use-alert"

interface AssignPlanDialogProps {
  open: boolean
  onClose: () => void
  onSuccess: () => void
}

interface User {
  id: number
  username: string
  email: string | null
  plan_id: number | null
  plan_expires_at: string | null
}

interface Plan {
  id: number
  name: string
  price: number | null
  description: string | null
  max_concurrent: number | null
  max_time: number | null
  allowed_methods: string[] | null
  cooldown: number | null
}

interface UserPlanDetails {
  plan: Plan | null
  plan_expires_at: string | null
}

export default function AssignPlanDialog({
  open,
  onClose,
  onSuccess,
}: AssignPlanDialogProps) {
  const { showAlert, AlertComponent } = useAlert()
  const [loading, setLoading] = useState(false)
  const [users, setUsers] = useState<User[]>([])
  const [plans, setPlans] = useState<Plan[]>([])
  const [selectedUserId, setSelectedUserId] = useState<string>("")
  const [selectedPlanId, setSelectedPlanId] = useState<string>("")
  const [fetching, setFetching] = useState(true)
  const [userPlanDetails, setUserPlanDetails] = useState<UserPlanDetails | null>(null)
  const [loadingPlanDetails, setLoadingPlanDetails] = useState(false)

  useEffect(() => {
    if (open) {
      fetchUsers()
      fetchPlans()
      setSelectedUserId("")
      setSelectedPlanId("")
      setUserPlanDetails(null)
    }
  }, [open])

  useEffect(() => {
    if (selectedUserId) {
      fetchUserPlanDetails(selectedUserId)
    } else {
      setUserPlanDetails(null)
    }
  }, [selectedUserId])

  const fetchUsers = async () => {
    try {
      const response = await fetch("/api/admin/users?limit=1000")
      if (response.ok) {
        const data = await response.json()
        setUsers(data.users || [])
      }
    } catch (error) {
      console.error("Failed to fetch users:", error)
    } finally {
      setFetching(false)
    }
  }

  const fetchPlans = async () => {
    try {
      const response = await fetch("/api/admin/plans")
      if (response.ok) {
        const data = await response.json()
        setPlans(data.plans || [])
      }
    } catch (error) {
      console.error("Failed to fetch plans:", error)
    }
  }

  const fetchUserPlanDetails = async (userId: string) => {
    setLoadingPlanDetails(true)
    try {
      const response = await fetch(`/api/admin/users/${userId}`)
      if (response.ok) {
        const data = await response.json()
        const user = data.user
        
        if (user.plan_id) {
          // Fetch plan details
          const planResponse = await fetch(`/api/admin/plans/${user.plan_id}`)
          if (planResponse.ok) {
            const planData = await planResponse.json()
            setUserPlanDetails({
              plan: planData.plan,
              plan_expires_at: user.plan_expires_at,
            })
          } else {
            setUserPlanDetails({
              plan: null,
              plan_expires_at: user.plan_expires_at,
            })
          }
        } else {
          setUserPlanDetails({
            plan: null,
            plan_expires_at: null,
          })
        }
      }
    } catch (error) {
      console.error("Failed to fetch user plan details:", error)
      setUserPlanDetails(null)
    } finally {
      setLoadingPlanDetails(false)
    }
  }

  const calculateDaysUntilExpiry = (expiresAt: string | null): number | null => {
    if (!expiresAt) return null
    const expiryDate = new Date(expiresAt)
    const now = new Date()
    const diffTime = expiryDate.getTime() - now.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  const formatExpiryInfo = (expiresAt: string | null): string => {
    if (!expiresAt) return "No expiration date"
    const days = calculateDaysUntilExpiry(expiresAt)
    if (days === null) return "Invalid date"
    if (days < 0) return `Expired ${Math.abs(days)} days ago`
    if (days === 0) return "Expires today"
    return `Expires in ${days} days`
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!selectedUserId) {
      await showAlert("Please select a user", "Validation Error")
      return
    }

    if (!selectedPlanId || selectedPlanId === "none") {
      await showAlert("Please select a plan", "Validation Error")
      return
    }

    setLoading(true)
    try {
      const response = await fetch(`/api/admin/users/${selectedUserId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          plan_id: selectedPlanId === "none" ? null : parseInt(selectedPlanId),
        }),
      })

      if (response.ok) {
        await showAlert("Plan assigned successfully", "Success")
        onSuccess()
        onClose()
        setSelectedUserId("")
        setSelectedPlanId(selectedPlanId === "none" ? "" : selectedPlanId)
      } else {
        const data = await response.json()
        await showAlert(data.error || "Failed to assign plan", "Error")
      }
    } catch (error) {
      console.error("Failed to assign plan:", error)
      await showAlert("Failed to assign plan", "Error")
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Assign Plan to User</DialogTitle>
            <DialogDescription>
              Select a user and plan to assign
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="user">User</Label>
              <Select
                value={selectedUserId}
                onValueChange={setSelectedUserId}
                disabled={fetching}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a user" />
                </SelectTrigger>
                <SelectContent>
                  {users.map((user) => (
                    <SelectItem key={user.id} value={user.id.toString()}>
                      {user.username} {user.email && `(${user.email})`}
                      {user.plan_id && " [Has Plan]"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedUserId && (
              <div className="space-y-2">
                {loadingPlanDetails ? (
                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-center py-4">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span className="ml-2 text-sm text-muted-foreground">Loading plan details...</span>
                      </div>
                    </CardContent>
                  </Card>
                ) : userPlanDetails?.plan ? (
                  <Card className="border-primary/20 bg-primary/5">
                    <CardContent className="pt-6">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-lg">{userPlanDetails.plan.name}</h3>
                            <Badge variant="default">Current Plan</Badge>
                          </div>
                        </div>
                        
                        {userPlanDetails.plan.description && (
                          <p className="text-sm text-muted-foreground">
                            {userPlanDetails.plan.description}
                          </p>
                        )}

                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <div>
                            <span className="text-muted-foreground">Max Concurrent:</span>
                            <span className="ml-2 font-medium">
                              {userPlanDetails.plan.max_concurrent ?? "∞"}
                            </span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Max Time:</span>
                            <span className="ml-2 font-medium">
                              {userPlanDetails.plan.max_time ? `${userPlanDetails.plan.max_time}s` : "∞"}
                            </span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Cooldown:</span>
                            <span className="ml-2 font-medium">
                              {userPlanDetails.plan.cooldown ? `${userPlanDetails.plan.cooldown}s` : "None"}
                            </span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Price:</span>
                            <span className="ml-2 font-medium">
                              {userPlanDetails.plan.price ? `${userPlanDetails.plan.price} points` : "Free"}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 pt-2 border-t">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <span className={`text-sm font-medium ${
                            calculateDaysUntilExpiry(userPlanDetails.plan_expires_at) !== null &&
                            calculateDaysUntilExpiry(userPlanDetails.plan_expires_at)! < 7
                              ? "text-destructive"
                              : calculateDaysUntilExpiry(userPlanDetails.plan_expires_at) !== null &&
                                calculateDaysUntilExpiry(userPlanDetails.plan_expires_at)! < 30
                              ? "text-yellow-500"
                              : ""
                          }`}>
                            {formatExpiryInfo(userPlanDetails.plan_expires_at)}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <Card className="border-muted">
                    <CardContent className="pt-6">
                      <div className="text-center py-4">
                        <p className="text-sm text-muted-foreground">No plan assigned</p>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="plan">Plan</Label>
              <Select
                value={selectedPlanId || undefined}
                onValueChange={(value) => setSelectedPlanId(value === "none" ? "" : value)}
                disabled={fetching}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a plan" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No plan (Remove plan)</SelectItem>
                  {plans.map((plan) => (
                    <SelectItem key={plan.id} value={plan.id.toString()}>
                      {plan.name} {plan.price !== null && `- ${plan.price} points`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading || !selectedUserId || !selectedPlanId || selectedPlanId === "none"}>
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Assign Plan"
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
      <AlertComponent />
    </>
  )
}

