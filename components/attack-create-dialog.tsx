"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Zap, Loader2 } from "lucide-react"
import { useAlert } from "@/lib/use-alert"

interface AttackMethod {
  id: number
  name: string
  display_name: string
  category?: "L4" | "L7"
}

interface AttackCreateDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export default function AttackCreateDialog({
  open,
  onOpenChange,
  onSuccess,
}: AttackCreateDialogProps) {
  const { showAlert, AlertComponent } = useAlert()
  const [methods, setMethods] = useState<AttackMethod[]>([])
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")
  const [formData, setFormData] = useState({
    host: "",
    port: "",
    method: "",
    time: "30",
    concurrent: "1",
  })

  useEffect(() => {
    if (open) {
      fetchMethods()
    }
  }, [open])

  // Auto-set port to 443 when L7 method is selected
  useEffect(() => {
    if (formData.method) {
      const selectedMethod = methods.find((m) => m.name === formData.method)
      if (selectedMethod?.category === "L7") {
        setFormData((prev) => ({
          ...prev,
          port: "443",
        }))
      }
    }
  }, [formData.method, methods])

  const fetchMethods = async () => {
    setLoading(true)
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setSubmitting(true)

    try {
      const selectedMethod = methods.find((m) => m.name === formData.method)
      const isL7 = selectedMethod?.category === "L7"

      const response = await fetch("/api/attacks/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          host: formData.host.trim(),
          port: isL7 ? 443 : parseInt(formData.port),
          method: formData.method,
          time: parseInt(formData.time),
          concurrent: formData.concurrent ? parseInt(formData.concurrent.toString()) : 1,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        // Reset form
        setFormData({
          host: "",
          port: "",
          method: methods[0]?.name || "",
          time: "30",
          concurrent: "1",
        })
        setError("")
        onOpenChange(false)
        onSuccess()
      } else {
        if (response.status === 429 && data.cooldown_remaining) {
          setError(`Cooldown active. Please wait ${data.cooldown_remaining} seconds before launching another attack.`)
        } else {
          setError(data.error || "Failed to create attack")
        }
      }
    } catch (error: any) {
      console.error("Failed to create attack:", error)
      setError("Failed to create attack. Please try again.")
    } finally {
      setSubmitting(false)
    }
  }

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      // Reset form when closing
      setFormData({
        host: "",
        port: "",
        method: methods[0]?.name || "",
        time: "30",
        concurrent: "1",
      })
      setError("")
    }
    onOpenChange(newOpen)
  }

  const selectedMethod = methods.find((m) => m.name === formData.method)
  const isL7 = selectedMethod?.category === "L7"

  return (
    <>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              Create New Attack
            </DialogTitle>
            <DialogDescription>
              Launch a new attack on a target. The attack will be created for your account.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="host">Host (IP / URL)</Label>
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
                </div>

                <div className="space-y-2">
                  <Label htmlFor="port">
                    Port {isL7 && "(Auto: 443 for L7)"}
                  </Label>
                  {isL7 ? (
                    <Input
                      id="port"
                      type="number"
                      value="443"
                      disabled
                      className="bg-muted"
                    />
                  ) : (
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
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="method">Method</Label>
                  {loading ? (
                    <div className="h-10 w-full bg-muted animate-pulse rounded-md" />
                  ) : (
                    <Select
                      value={formData.method}
                      onValueChange={(value) => {
                        const selectedMethod = methods.find((m) => m.name === value)
                        setFormData({
                          ...formData,
                          method: value,
                          port: selectedMethod?.category === "L7" ? "443" : formData.port,
                        })
                      }}
                      required
                    >
                      <SelectTrigger id="method">
                        <SelectValue placeholder="Select a method" />
                      </SelectTrigger>
                      <SelectContent>
                        {methods.map((method) => (
                          <SelectItem key={method.id} value={method.name}>
                            <span className="flex items-center gap-2">
                              <span>{method.display_name}</span>
                              {method.category && (
                                <Badge
                                  variant="outline"
                                  className={`text-xs ${
                                    method.category === "L7"
                                      ? "bg-blue-500/10 text-blue-500 border-blue-500/20"
                                      : "bg-green-500/10 text-green-500 border-green-500/20"
                                  }`}
                                >
                                  {method.category}
                                </Badge>
                              )}
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="time">Time (seconds)</Label>
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
                </div>

                <div className="space-y-2 col-span-2">
                  <Label htmlFor="concurrent">Concurrent</Label>
                  <Input
                    id="concurrent"
                    type="number"
                    min="1"
                    value={formData.concurrent}
                    onChange={(e) =>
                      setFormData({ ...formData, concurrent: e.target.value })
                    }
                    placeholder="1"
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    Number of concurrent attacks
                  </p>
                </div>
              </div>

              {error && (
                <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">
                  {error}
                </div>
              )}
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => handleOpenChange(false)}
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <Zap className="mr-2 h-4 w-4" />
                    Start Attack
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      <AlertComponent />
    </>
  )
}

