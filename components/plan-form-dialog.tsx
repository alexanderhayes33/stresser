"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { Save, Loader2 } from "lucide-react"
import { useAlert } from "@/lib/use-alert"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"

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
}

interface PlanFormDialogProps {
  planId?: string
  onSuccess: () => void
  onCancel: () => void
}

export default function PlanFormDialog({ planId, onSuccess, onCancel }: PlanFormDialogProps) {
  const { showAlert, AlertComponent } = useAlert()
  const [loading, setLoading] = useState(!!planId)
  const [saving, setSaving] = useState(false)
  const [methods, setMethods] = useState<any[]>([])
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    max_concurrent: "",
    max_time: "",
    allowed_methods: [] as string[],
    price: "",
    cooldown: "",
    is_active: true,
    is_popular: false,
  })

  useEffect(() => {
    fetchMethods()
    if (planId) {
      fetchPlan()
    } else {
      setLoading(false)
    }
  }, [planId])

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

  const fetchPlan = async () => {
    try {
      const response = await fetch(`/api/admin/plans/${planId}`)
      if (response.ok) {
        const data = await response.json()
        const plan: Plan = data.plan
        setFormData({
          name: plan.name,
          description: plan.description || "",
          max_concurrent: plan.max_concurrent?.toString() || "",
          max_time: plan.max_time?.toString() || "",
          allowed_methods: Array.isArray(plan.allowed_methods) ? plan.allowed_methods : [],
          price: plan.price?.toString() || "",
          cooldown: plan.cooldown?.toString() || "",
          is_active: plan.is_active,
          is_popular: plan.is_popular || false,
        })
      }
    } catch (error) {
      console.error("Failed to fetch plan:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      const url = planId ? `/api/admin/plans/${planId}` : "/api/admin/plans"
      const method = planId ? "PUT" : "POST"

      const payload: any = {
        name: formData.name.trim(),
        description: formData.description.trim() || null,
        max_concurrent: formData.max_concurrent ? parseInt(formData.max_concurrent) : null,
        max_time: formData.max_time ? parseInt(formData.max_time) : null,
        allowed_methods: formData.allowed_methods.length > 0 ? formData.allowed_methods : null,
        price: formData.price ? parseFloat(formData.price) : null,
        cooldown: formData.cooldown ? parseInt(formData.cooldown) : 0,
        is_active: formData.is_active,
        is_popular: formData.is_popular,
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
        await showAlert(data.error || "Failed to save plan", "Error")
      }
    } catch (error) {
      console.error("Failed to save plan:", error)
      await showAlert("Failed to save plan", "Error")
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
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Plan Name *</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="Basic Plan"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Input
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Plan description"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="max_concurrent">Max Concurrent</Label>
          <Input
            id="max_concurrent"
            type="number"
            min="1"
            value={formData.max_concurrent}
            onChange={(e) => setFormData({ ...formData, max_concurrent: e.target.value })}
            placeholder="Leave empty for unlimited"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="max_time">Max Time (seconds)</Label>
          <Input
            id="max_time"
            type="number"
            min="1"
            value={formData.max_time}
            onChange={(e) => setFormData({ ...formData, max_time: e.target.value })}
            placeholder="Leave empty for unlimited"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="price">Price</Label>
          <Input
            id="price"
            type="number"
            step="0.01"
            min="0"
            value={formData.price}
            onChange={(e) => setFormData({ ...formData, price: e.target.value })}
            placeholder="0.00 (leave empty for free)"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="cooldown">Cooldown (seconds)</Label>
          <Input
            id="cooldown"
            type="number"
            min="0"
            value={formData.cooldown}
            onChange={(e) => setFormData({ ...formData, cooldown: e.target.value })}
            placeholder="0 (no cooldown)"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Allowed Methods</Label>
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
        <p className="text-xs text-muted-foreground">
          Leave empty to allow all methods
        </p>
      </div>

      <div className="space-y-3">
        <div className="flex items-center space-x-2">
          <Checkbox
            id="is_active"
            checked={formData.is_active}
            onCheckedChange={(checked) =>
              setFormData({ ...formData, is_active: checked as boolean })
            }
          />
          <Label htmlFor="is_active" className="text-sm font-normal cursor-pointer">
            Active
          </Label>
        </div>
        <div className="flex items-center space-x-2">
          <Checkbox
            id="is_popular"
            checked={formData.is_popular}
            onCheckedChange={(checked) =>
              setFormData({ ...formData, is_popular: checked as boolean })
            }
          />
          <Label htmlFor="is_popular" className="text-sm font-normal cursor-pointer">
            Popular Plan (Show popular badge in pricing page)
          </Label>
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
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

