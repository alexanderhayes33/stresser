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

interface Attack {
  id: number
  user_id: number
  target_url: string
  host?: string
  port?: number
  method: string
  time?: number
  duration_seconds: number
  threads: number
  status: string
  success_count: number
  failed_count: number
  total_requests: number
}

interface User {
  id: number
  username: string
}

interface AttackMethod {
  id: number
  name: string
  display_name: string
  description: string | null
}

export default function AttackFormClient({ attackId }: { attackId?: string }) {
  const router = useRouter()
  const { showAlert, AlertComponent } = useAlert()
  const [loading, setLoading] = useState(!!attackId)
  const [saving, setSaving] = useState(false)
  const [users, setUsers] = useState<User[]>([])
  const [methods, setMethods] = useState<AttackMethod[]>([])
  const [formData, setFormData] = useState({
    user_id: "",
    host: "",
    port: "",
    method: "",
    time: "",
    status: "pending",
    success_count: 0,
    failed_count: 0,
    total_requests: 0,
  })

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await fetch("/api/admin/users?limit=1000")
        if (response.ok) {
          const data = await response.json()
          setUsers(data.users || [])
        }
      } catch (error) {
        console.error("Failed to fetch users:", error)
      }
    }

    const fetchMethods = async () => {
      try {
        const response = await fetch("/api/attack-methods")
        if (response.ok) {
          const data = await response.json()
          setMethods(data.methods || [])
        }
      } catch (error) {
        console.error("Failed to fetch methods:", error)
      }
    }

    fetchUsers()
    fetchMethods()

    if (attackId) {
      fetchAttack()
    }
  }, [attackId])

  const fetchAttack = async () => {
    try {
      const response = await fetch(`/api/admin/attacks/${attackId}`)
      if (response.ok) {
        const data = await response.json()
        const attack: Attack = data.attack
        setFormData({
          user_id: attack.user_id.toString(),
          host: attack.host || "",
          port: attack.port?.toString() || "",
          method: attack.method || "",
          time: attack.time?.toString() || "",
          status: attack.status,
          success_count: attack.success_count,
          failed_count: attack.failed_count,
          total_requests: attack.total_requests,
        })
      }
    } catch (error) {
      console.error("Failed to fetch attack:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      const url = attackId
        ? `/api/admin/attacks/${attackId}`
        : "/api/admin/attacks"
      const method = attackId ? "PUT" : "POST"

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          user_id: parseInt(formData.user_id),
          host: formData.host.trim(),
          port: parseInt(formData.port),
          method: formData.method,
          time: parseInt(formData.time),
          success_count: parseInt(formData.success_count.toString()),
          failed_count: parseInt(formData.failed_count.toString()),
          total_requests: parseInt(formData.total_requests.toString()),
        }),
      })

      if (response.ok) {
        router.push("/admin/attacks")
      } else {
        const data = await response.json()
        await showAlert(data.error || "Failed to save attack", "Error")
      }
    } catch (error) {
      console.error("Failed to save attack:", error)
      await showAlert("Failed to save attack", "Error")
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
          onClick={() => router.push("/admin/attacks")}
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <h1 className="text-3xl font-bold mb-2">
          {attackId ? "Edit Attack" : "New Attack"}
        </h1>
        <p className="text-muted-foreground">
          {attackId
            ? "Update attack details"
            : "Create a new attack for a user"}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Attack Details</CardTitle>
          <CardDescription>
            Fill in the attack information below
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="user_id" className="text-sm font-medium">
                User
              </label>
              <select
                id="user_id"
                value={formData.user_id}
                onChange={(e) =>
                  setFormData({ ...formData, user_id: e.target.value })
                }
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                required
              >
                <option value="">Select a user</option>
                {users.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.username}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label htmlFor="host" className="text-sm font-medium">
                Host (IP/URL)
              </label>
              <Input
                id="host"
                type="text"
                value={formData.host}
                onChange={(e) =>
                  setFormData({ ...formData, host: e.target.value })
                }
                placeholder="70.70.70.7"
                required
              />
              <p className="text-xs text-muted-foreground">
                L4 IP or L7 URL
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
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
                <p className="text-xs text-muted-foreground">
                  1-65535
                </p>
              </div>

              <div className="space-y-2">
                <label htmlFor="method" className="text-sm font-medium">
                  Method
                </label>
                <Select
                  value={formData.method}
                  onValueChange={(value) =>
                    setFormData({ ...formData, method: value })
                  }
                  required
                >
                  <SelectTrigger id="method">
                    <SelectValue placeholder="Select a method" />
                  </SelectTrigger>
                  <SelectContent>
                    {methods.map((method) => (
                      <SelectItem key={method.id} value={method.name}>
                        {method.display_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
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
                placeholder="30"
                required
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="status" className="text-sm font-medium">
                Status
              </label>
              <select
                id="status"
                value={formData.status}
                onChange={(e) =>
                  setFormData({ ...formData, status: e.target.value })
                }
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="pending">Pending</option>
                <option value="running">Running</option>
                <option value="completed">Completed</option>
                <option value="failed">Failed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>


            {attackId && (
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label htmlFor="success_count" className="text-sm font-medium">
                    Success Count
                  </label>
                  <Input
                    id="success_count"
                    type="number"
                    min="0"
                    value={formData.success_count}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        success_count: parseInt(e.target.value) || 0,
                      })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="failed_count" className="text-sm font-medium">
                    Failed Count
                  </label>
                  <Input
                    id="failed_count"
                    type="number"
                    min="0"
                    value={formData.failed_count}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        failed_count: parseInt(e.target.value) || 0,
                      })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="total_requests" className="text-sm font-medium">
                    Total Requests
                  </label>
                  <Input
                    id="total_requests"
                    type="number"
                    min="0"
                    value={formData.total_requests}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        total_requests: parseInt(e.target.value) || 0,
                      })
                    }
                  />
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push("/admin/attacks")}
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

