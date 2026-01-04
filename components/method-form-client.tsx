"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { ArrowLeft, Save, Loader2 } from "lucide-react"
import { useAlert } from "@/lib/use-alert"

interface Method {
  id: number
  name: string
  display_name: string
  description: string | null
  is_active: boolean
  api_url_format: string | null
  category: string | null
}

export default function MethodFormClient({ methodId }: { methodId?: string }) {
  const router = useRouter()
  const { showAlert, AlertComponent } = useAlert()
  const [loading, setLoading] = useState(!!methodId)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    display_name: "",
    description: "",
    is_active: true,
    api_url_format: "",
    category: "L4",
  })

  useEffect(() => {
    if (methodId) {
      fetchMethod()
    }
  }, [methodId])

  const fetchMethod = async () => {
    try {
      const response = await fetch(`/api/admin/methods/${methodId}`)
      if (response.ok) {
        const data = await response.json()
        const method: Method = data.method
        setFormData({
          name: method.name,
          display_name: method.display_name,
          description: method.description || "",
          is_active: method.is_active,
          api_url_format: method.api_url_format || "",
          category: method.category || "L4",
        })
      }
    } catch (error) {
      console.error("Failed to fetch method:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      const url = methodId
        ? `/api/admin/methods/${methodId}`
        : "/api/admin/methods"
      const method = methodId ? "PUT" : "POST"

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: formData.name.trim(),
          display_name: formData.display_name.trim(),
          description: formData.description.trim() || null,
          is_active: formData.is_active,
          api_url_format: formData.api_url_format.trim() || null,
          category: formData.category,
        }),
      })

      if (response.ok) {
        router.push("/admin/methods")
      } else {
        const data = await response.json()
        await showAlert(data.error || "Failed to save method", "Error")
      }
    } catch (error) {
      console.error("Failed to save method:", error)
      await showAlert("Failed to save method", "Error")
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
          onClick={() => router.push("/admin/methods")}
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <h1 className="text-3xl font-bold mb-2">
          {methodId ? "Edit Method" : "New Method"}
        </h1>
        <p className="text-muted-foreground">
          {methodId
            ? "Update attack method details"
            : "Create a new attack method"}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Method Details</CardTitle>
          <CardDescription>
            Fill in the method information below
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="name" className="text-sm font-medium">
                Method Name
              </label>
              <Input
                id="name"
                type="text"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value.toLowerCase().trim() })
                }
                placeholder="ldap"
                required
                disabled={!!methodId}
                className="font-mono"
              />
              <p className="text-xs text-muted-foreground">
                {methodId
                  ? "Method name cannot be changed after creation. This is used as the identifier in the system and will replace [method] in the API URL format."
                  : "Lowercase identifier, no spaces (e.g., ldap, udp, handshake). This will be used to replace [method] in the API URL format."}
              </p>
            </div>

            <div className="space-y-2">
              <label htmlFor="display_name" className="text-sm font-medium">
                Display Name
              </label>
              <Input
                id="display_name"
                type="text"
                value={formData.display_name}
                onChange={(e) =>
                  setFormData({ ...formData, display_name: e.target.value })
                }
                placeholder="LDAP"
                required
              />
              <p className="text-xs text-muted-foreground">
                Name shown to users in the dropdown
              </p>
            </div>

            <div className="space-y-2">
              <label htmlFor="description" className="text-sm font-medium">
                Description
              </label>
              <Input
                id="description"
                type="text"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="LDAP attack method"
              />
              <p className="text-xs text-muted-foreground">
                Optional description of the method
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                <SelectTrigger id="category">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="L4">L4 (Layer 4)</SelectItem>
                  <SelectItem value="L7">L7 (Layer 7)</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Layer 4  or Layer 7 
              </p>
            </div>

            <div className="space-y-2">
              <label htmlFor="api_url_format" className="text-sm font-medium">
                API URL Format
              </label>
              <Input
                id="api_url_format"
                type="text"
                value={formData.api_url_format}
                onChange={(e) =>
                  setFormData({ ...formData, api_url_format: e.target.value })
                }
                placeholder="http://domain.com/api/attack?key=[apikey]&host=[host]&port=[port]&method=[method]&time=[time]"
                className="font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground">
                API URL format with placeholders: [host], [port], [method], [time]
              </p>
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
                Active (visible to users)
              </label>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push("/admin/methods")}
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
      <AlertComponent />
    </main>
  )
}

