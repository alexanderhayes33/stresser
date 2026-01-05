"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { Save, Loader2 } from "lucide-react"
import { useAlert } from "@/lib/use-alert"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"

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
  bypass_global_slot: boolean
  bypass_cooldown: boolean
}

interface UserFormDialogProps {
  userId?: string
  onSuccess: () => void
  onCancel: () => void
}

export default function UserFormDialog({ userId, onSuccess, onCancel }: UserFormDialogProps) {
  const { showAlert, AlertComponent } = useAlert()
  const [loading, setLoading] = useState(!!userId)
  const [saving, setSaving] = useState(false)
  const [methods, setMethods] = useState<any[]>([])
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    role: "user",
    is_admin: false,
    is_active: true,
    allowed_methods: [] as string[],
    max_time: "",
    max_concurrent: "",
    bypass_global_slot: false,
    bypass_cooldown: false,
  })

  useEffect(() => {
    fetchMethods()
    if (userId) {
      fetchUser()
    } else {
      setLoading(false)
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

  const fetchUser = async () => {
    try {
      const response = await fetch(`/api/admin/users/${userId}`)
      if (response.ok) {
        const data = await response.json()
        const user: User = data.user
        setFormData({
          username: user.username,
          password: "",
          role: user.role,
          is_admin: user.is_admin,
          is_active: user.is_active,
          allowed_methods: Array.isArray(user.allowed_methods) ? user.allowed_methods : [],
          max_time: user.max_time?.toString() || "",
          max_concurrent: user.max_concurrent?.toString() || "",
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
        role: formData.role,
        is_admin: formData.is_admin,
        is_active: formData.is_active,
        allowed_methods: formData.allowed_methods.length > 0 ? formData.allowed_methods : null,
        max_time: formData.max_time ? parseInt(formData.max_time) : null,
        max_concurrent: formData.max_concurrent ? parseInt(formData.max_concurrent) : null,
        bypass_global_slot: formData.bypass_global_slot,
        bypass_cooldown: formData.bypass_cooldown,
      }

      // Only include username for new users
      if (!userId) {
        payload.username = formData.username
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
        onSuccess()
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

  const toggleMethod = (methodName: string) => {
    setFormData((prev) => ({
      ...prev,
      allowed_methods: prev.allowed_methods.includes(methodName)
        ? prev.allowed_methods.filter((m) => m !== methodName)
        : [...prev.allowed_methods, methodName],
    }))
  }

  const toggleCategory = (category: string) => {
    const categoryMethods = methods
      .filter((m) => m.category === category)
      .map((m) => m.name)
    
    const allSelected = categoryMethods.every((name) =>
      formData.allowed_methods.includes(name)
    )

    setFormData((prev) => {
      if (allSelected) {
        // Unselect all methods in this category
        return {
          ...prev,
          allowed_methods: prev.allowed_methods.filter(
            (name) => !categoryMethods.includes(name)
          ),
        }
      } else {
        // Select all methods in this category
        const newMethods = [...prev.allowed_methods]
        categoryMethods.forEach((name) => {
          if (!newMethods.includes(name)) {
            newMethods.push(name)
          }
        })
        return {
          ...prev,
          allowed_methods: newMethods,
        }
      }
    })
  }

  const isCategorySelected = (category: string) => {
    const categoryMethods = methods
      .filter((m) => m.category === category)
      .map((m) => m.name)
    
    if (categoryMethods.length === 0) return false
    
    return categoryMethods.every((name) =>
      formData.allowed_methods.includes(name)
    )
  }

  const isCategoryIndeterminate = (category: string) => {
    const categoryMethods = methods
      .filter((m) => m.category === category)
      .map((m) => m.name)
    
    if (categoryMethods.length === 0) return false
    
    const selectedCount = categoryMethods.filter((name) =>
      formData.allowed_methods.includes(name)
    ).length
    
    return selectedCount > 0 && selectedCount < categoryMethods.length
  }

  const getMethodsByCategory = (category: string) => {
    return methods.filter((m) => m.category === category)
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-h-[80vh] overflow-y-auto">
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
          required={!userId}
          disabled={!!userId}
          minLength={3}
          className={userId ? "bg-muted cursor-not-allowed" : ""}
        />
        {userId && (
          <p className="text-xs text-muted-foreground">
            Username cannot be changed after user creation.
          </p>
        )}
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
        <Label>Allowed Methods</Label>
        <p className="text-xs text-muted-foreground mb-2">
          Leave empty to allow all methods. Select specific methods to restrict access.
        </p>
        <div className="border rounded-md p-4 max-h-48 overflow-y-auto">
          {methods.length === 0 ? (
            <p className="text-sm text-muted-foreground">No methods available</p>
          ) : (
            <div className="space-y-4">
              {/* Category Selection */}
              <div className="space-y-2 pb-2 border-b">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="category-l4"
                    checked={isCategorySelected("L4")}
                    onCheckedChange={() => toggleCategory("L4")}
                  />
                  <Label
                    htmlFor="category-l4"
                    className="text-sm font-medium cursor-pointer flex items-center gap-2"
                  >
                    <Badge
                      variant="outline"
                      className="bg-green-500/10 text-green-500 border-green-500/20"
                    >
                      L4
                    </Badge>
                    <span>Select All L4 Methods</span>
                    {isCategoryIndeterminate("L4") && (
                      <span className="text-xs text-muted-foreground">(Partial)</span>
                    )}
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="category-l7"
                    checked={isCategorySelected("L7")}
                    onCheckedChange={() => toggleCategory("L7")}
                  />
                  <Label
                    htmlFor="category-l7"
                    className="text-sm font-medium cursor-pointer flex items-center gap-2"
                  >
                    <Badge
                      variant="outline"
                      className="bg-blue-500/10 text-blue-500 border-blue-500/20"
                    >
                      L7
                    </Badge>
                    <span>Select All L7 Methods</span>
                    {isCategoryIndeterminate("L7") && (
                      <span className="text-xs text-muted-foreground">(Partial)</span>
                    )}
                  </Label>
                </div>
              </div>

              {/* Methods by Category */}
              <div className="space-y-3">
                {/* L4 Methods */}
                {getMethodsByCategory("L4").length > 0 && (
                  <div className="space-y-2">
                    <div className="text-xs font-medium text-muted-foreground flex items-center gap-2">
                      <Badge
                        variant="outline"
                        className="bg-green-500/10 text-green-500 border-green-500/20 text-xs"
                      >
                        L4
                      </Badge>
                      <span>Layer 4 Methods</span>
                    </div>
                    {getMethodsByCategory("L4").map((method) => (
                      <div key={method.id} className="flex items-center space-x-2 ml-4">
                        <Checkbox
                          id={`method-${method.id}`}
                          checked={formData.allowed_methods.includes(method.name)}
                          onCheckedChange={() => toggleMethod(method.name)}
                        />
                        <Label
                          htmlFor={`method-${method.id}`}
                          className="text-sm font-normal cursor-pointer flex items-center gap-2 flex-1"
                        >
                          <span>{method.display_name}</span>
                          <span className="text-xs text-muted-foreground">({method.name})</span>
                        </Label>
                      </div>
                    ))}
                  </div>
                )}

                {/* L7 Methods */}
                {getMethodsByCategory("L7").length > 0 && (
                  <div className="space-y-2">
                    <div className="text-xs font-medium text-muted-foreground flex items-center gap-2">
                      <Badge
                        variant="outline"
                        className="bg-blue-500/10 text-blue-500 border-blue-500/20 text-xs"
                      >
                        L7
                      </Badge>
                      <span>Layer 7 Methods</span>
                    </div>
                    {getMethodsByCategory("L7").map((method) => (
                      <div key={method.id} className="flex items-center space-x-2 ml-4">
                        <Checkbox
                          id={`method-${method.id}`}
                          checked={formData.allowed_methods.includes(method.name)}
                          onCheckedChange={() => toggleMethod(method.name)}
                        />
                        <Label
                          htmlFor={`method-${method.id}`}
                          className="text-sm font-normal cursor-pointer flex items-center gap-2 flex-1"
                        >
                          <span>{method.display_name}</span>
                          <span className="text-xs text-muted-foreground">({method.name})</span>
                        </Label>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
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
          onClick={onCancel}
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
      <AlertComponent />
    </form>
  )
}

