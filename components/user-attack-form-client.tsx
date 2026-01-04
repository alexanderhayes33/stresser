"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { ArrowLeft, Zap, Loader2 } from "lucide-react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface Method {
  id: number
  name: string
  display_name: string
  description: string | null
}

export default function AttackFormClient() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [methods, setMethods] = useState<Method[]>([])
  const [formData, setFormData] = useState({
    host: "",
    port: "",
    method: "",
    time: "30",
  })
  const [error, setError] = useState("")

  useEffect(() => {
    const fetchMethods = async () => {
      try {
        const response = await fetch("/api/attack-methods")
        if (response.ok) {
          const data = await response.json()
          setMethods(data.methods || [])
          if (data.methods && data.methods.length > 0) {
            setFormData((prev) => ({
              ...prev,
              method: data.methods[0].name,
            }))
          }
        }
      } catch (error) {
        console.error("Failed to fetch methods:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchMethods()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setSubmitting(true)

    try {
      const response = await fetch("/api/attacks/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          host: formData.host.trim(),
          port: parseInt(formData.port),
          method: formData.method,
          time: parseInt(formData.time),
        }),
      })

      const data = await response.json()

      if (response.ok) {
        router.push("/dashboard")
        router.refresh()
      } else {
        setError(data.error || "Failed to create attack")
      }
    } catch (error: any) {
      console.error("Failed to create attack:", error)
      setError("Failed to create attack. Please try again.")
    } finally {
      setSubmitting(false)
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
        <h1 className="text-3xl font-bold mb-2">New Attack</h1>
        <p className="text-muted-foreground">
          Create a new attack on a target
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Attack Configuration</CardTitle>
          <CardDescription>
            Fill in the attack details below
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="host" className="text-sm font-medium">
                Host (IP / URL)
              </label>
              <Input
                id="host"
                type="text"
                value={formData.host}
                onChange={(e) =>
                  setFormData({ ...formData, host: e.target.value })
                }
                placeholder="70.70.70.7 or example.com"
                required
              />
              <p className="text-xs text-muted-foreground">
                Enter target IP address or URL (L4 IP / L7 URL)
              </p>
            </div>

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
                Port number (1-65535)
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
                      {method.description ? ` - ${method.description}` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
                required
              />
              <p className="text-xs text-muted-foreground">
                Attack duration in seconds
              </p>
            </div>

            {error && (
              <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">
                {error}
              </div>
            )}

            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push("/dashboard")}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Zap className="mr-2 h-4 w-4" />
                )}
                {submitting ? "Starting..." : "Start Attack"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </main>
  )
}

