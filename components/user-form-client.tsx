"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { ArrowLeft, Save, Loader2 } from "lucide-react"
import { useAlert } from "@/lib/use-alert"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface User {
  id: number
  username: string
  email: string | null
  role: string
  is_admin: boolean
  is_active: boolean
  points: number
  allowed_methods: string[] | null
  max_time: number | null
  max_concurrent: number | null
  plan_id: number | null
  bypass_global_slot: boolean
  bypass_cooldown: boolean
}

export default function UserFormClient({ userId }: { userId?: string }) {
  const router = useRouter()
  const { showAlert, AlertComponent } = useAlert()
  const [loading, setLoading] = useState(!!userId)
  const [saving, setSaving] = useState(false)
  const [methods, setMethods] = useState<any[]>([])
  const [plans, setPlans] = useState<any[]>([])
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    email: "",
    role: "user",
    is_admin: false,
    is_active: true,
    points: 0,
    allowed_methods: [] as string[],
    max_time: "",
    max_concurrent: "",
    plan_id: "",
    bypass_global_slot: false,
    bypass_cooldown: false,
  })

  useEffect(() => {
    fetchMethods()
    fetchPlans()
    if (userId) {
      fetchUser()
    }
  }, [userId])

  const fetchMethods = async () => {
    try {
      const response = await fetch("/api/admin/methods")
      if (response.ok) {
        const data = await response.json()
        setMethods(data.methods || [])
      }
    } catch (error) {
      console.error("Failed to fetch methods:", error)
    }
  }

  const fetchPlans = async () => {
    try {
      const response = await fetch("/api/plans")
      if (response.ok) {
        const data = await response.json()
        setPlans(data.plans || [])
        console.log("Plans fetched:", data.plans || [])
      } else {
        console.error("Failed to fetch plans:", response.status)
      }
    } catch (error) {
      console.error("Failed to fetch plans:", error)
    }
  }

  const fetchUser = async () => {
    try {
      const response = await fetch(`/api/admin/users/${userId}`)
      if (response.ok) {
        const data = await response.json()
        const user: User = data.user
        setFormData({
          username: user.username,
          password: "",
          email: user.email || "",
          role: user.role,
          is_admin: user.is_admin,
          is_active: user.is_active,
          points: user.points,
          allowed_methods: Array.isArray(user.allowed_methods) ? user.allowed_methods : [],
          max_time: user.max_time?.toString() || "",
          max_concurrent: user.max_concurrent?.toString() || "",
          plan_id: user.plan_id?.toString() || "",
          bypass_global_slot: user.bypass_global_slot || false,
          bypass_cooldown: user.bypass_cooldown || false,
        })
      }
    } catch (error) {
      console.error("Failed to fetch user:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      const url = userId ? `/api/admin/users/${userId}` : "/api/admin/users"
      const method = userId ? "PUT" : "POST"

      const payload: any = {
        username: formData.username,
        email: formData.email || null,
        role: formData.role,
        is_admin: formData.is_admin,
        is_active: formData.is_active,
        points: parseFloat(formData.points.toString()),
        allowed_methods: formData.allowed_methods.length > 0 ? formData.allowed_methods : null,
        max_time: formData.max_time ? parseInt(formData.max_time) : null,
        max_concurrent: formData.max_concurrent ? parseInt(formData.max_concurrent) : null,
        plan_id: formData.plan_id ? parseInt(formData.plan_id) : null,
        bypass_global_slot: formData.bypass_global_slot,
        bypass_cooldown: formData.bypass_cooldown,
      }

      // Only include password if it's provided (for new users or when updating)
      if (!userId || formData.password) {
        if (!formData.password) {
          await showAlert("Password is required", "Validation Error")
          setSaving(false)
          return
        }
        payload.password = formData.password
      }

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      })

      if (response.ok) {
        router.push("/admin/users")
      } else {
        const data = await response.json()
        await showAlert(data.error || "Failed to save user", "Error")
      }
    } catch (error) {
      console.error("Failed to save user:", error)
      await showAlert("Failed to save user", "Error")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <main className="container mx-auto px-4 py-8">
        <Skeleton className="h-96 w-full" />
      </main>
    )
  }

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <Button
          variant="ghost"
          onClick={() => router.push("/admin/users")}
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <h1 className="text-3xl font-bold mb-2">
          {userId ? "Edit User" : "New User"}
        </h1>
        <p className="text-muted-foreground">
          {userId ? "Update user details" : "Create a new user account"}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>User Details</CardTitle>
          <CardDescription>
            Fill in the user information below
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="username" className="text-sm font-medium">
                Username
              </label>
              <Input
                id="username"
                type="text"
                value={formData.username}
                onChange={(e) =>
                  setFormData({ ...formData, username: e.target.value })
                }
                required
                minLength={3}
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium">
                Password {userId && "(leave empty to keep current password)"}
              </label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
                required={!userId}
                minLength={6}
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium">
                Email
              </label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
              />
              </div>

              <div className="space-y-2">
                <label htmlFor="points" className="text-sm font-medium">
                  Points
                </label>
                <Input
                  id="points"
                  type="number"
                  min="0"
                  value={formData.points}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      points: parseFloat(e.target.value) || 0,
                    })
                  }
                />
            </div>

            <div className="space-y-3">
            <div className="flex gap-4">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="is_admin"
                  checked={formData.is_admin}
                  onChange={(e) =>
                    setFormData({ ...formData, is_admin: e.target.checked })
                  }
                  className="h-4 w-4 rounded border-gray-300"
                />
                <label htmlFor="is_admin" className="text-sm font-medium">
                  Admin
                </label>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={formData.is_active}
                  onChange={(e) =>
                    setFormData({ ...formData, is_active: e.target.checked })
                  }
                  className="h-4 w-4 rounded border-gray-300"
                />
                <label htmlFor="is_active" className="text-sm font-medium">
                  Active
                </label>
              </div>
              </div>

              <div className="flex gap-4">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="bypass_global_slot"
                    checked={formData.bypass_global_slot}
                    onChange={(e) =>
                      setFormData({ ...formData, bypass_global_slot: e.target.checked })
                    }
                    className="h-4 w-4 rounded border-gray-300"
                  />
                  <label htmlFor="bypass_global_slot" className="text-sm font-medium">
                    Bypass Global Slot
                  </label>
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="bypass_cooldown"
                    checked={formData.bypass_cooldown}
                    onChange={(e) =>
                      setFormData({ ...formData, bypass_cooldown: e.target.checked })
                    }
                    className="h-4 w-4 rounded border-gray-300"
                  />
                  <label htmlFor="bypass_cooldown" className="text-sm font-medium">
                    Bypass Cooldown
                  </label>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Bypass Global Slot: User can bypass the global concurrent attack limit. Bypass Cooldown: User can bypass cooldown restrictions.
              </p>
            </div>

            <div className="space-y-2">
              <label htmlFor="plan_id" className="text-sm font-medium">
                Plan
              </label>
              {plans.length > 0 ? (
                <Select
                  value={formData.plan_id}
                  onValueChange={(value) =>
                    setFormData({ ...formData, plan_id: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a plan" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">No plan</SelectItem>
                    {plans.map((plan) => (
                      <SelectItem key={plan.id} value={plan.id.toString()}>
                        {plan.name} - {plan.price} points
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <div className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-muted-foreground items-center">
                  No plans available. Create plans in Admin → Plans first.
                </div>
              )}
              <p className="text-xs text-muted-foreground">
                Assign a plan to this user. Leave empty for no plan.
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">
                Allowed Methods
              </label>
              <p className="text-xs text-muted-foreground mb-2">
                Leave empty to allow all methods. Select specific methods to restrict access.
              </p>
              <div className="space-y-2 max-h-48 overflow-y-auto border rounded-md p-3">
                {methods.map((method) => (
                  <div key={method.id} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id={`method-${method.id}`}
                      checked={formData.allowed_methods.includes(method.name)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setFormData({
                            ...formData,
                            allowed_methods: [...formData.allowed_methods, method.name],
                          })
                        } else {
                          setFormData({
                            ...formData,
                            allowed_methods: formData.allowed_methods.filter(
                              (m) => m !== method.name
                            ),
                          })
                        }
                      }}
                      className="h-4 w-4 rounded border-gray-300"
                    />
                    <label
                      htmlFor={`method-${method.id}`}
                      className="text-sm font-medium cursor-pointer"
                    >
                      {method.display_name} ({method.name})
                    </label>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label htmlFor="max_time" className="text-sm font-medium">
                  Max Time (seconds)
                </label>
                <Input
                  id="max_time"
                  type="number"
                  min="1"
                  value={formData.max_time}
                  onChange={(e) =>
                    setFormData({ ...formData, max_time: e.target.value })
                  }
                  placeholder="No limit"
                />
                <p className="text-xs text-muted-foreground">
                  Maximum attack duration. Leave empty for no limit.
                </p>
              </div>

              <div className="space-y-2">
                <label htmlFor="max_concurrent" className="text-sm font-medium">
                  Max Concurrent Attacks
                </label>
                <Input
                  id="max_concurrent"
                  type="number"
                  min="1"
                  value={formData.max_concurrent}
                  onChange={(e) =>
                    setFormData({ ...formData, max_concurrent: e.target.value })
                  }
                  placeholder="No limit"
                />
                <p className="text-xs text-muted-foreground">
                  Maximum concurrent attacks. Leave empty for no limit.
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push("/admin/users")}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Save
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </main>
  )
}

