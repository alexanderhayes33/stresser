"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { Save, Loader2, Power } from "lucide-react"
import { useAlert } from "@/lib/use-alert"
import { Checkbox } from "@/components/ui/checkbox"

export default function SettingsClient() {
  const { showAlert, AlertComponent } = useAlert()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [settings, setSettings] = useState({
    truewallet_phone: "",
    global_concurrent_limit_l4: "",
    global_concurrent_limit_l7: "",
    global_attack_enabled: "true",
  })

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    try {
      const response = await fetch("/api/admin/settings")
      if (response.ok) {
        const data = await response.json()
        setSettings({
          truewallet_phone: data.settings.truewallet_phone || "",
          global_concurrent_limit_l4: data.settings.global_concurrent_limit_l4 || "",
          global_concurrent_limit_l7: data.settings.global_concurrent_limit_l7 || "",
          global_attack_enabled: data.settings.global_attack_enabled || "true",
        })
      }
    } catch (error) {
      console.error("Failed to fetch settings:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      const response = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          settings: {
            truewallet_phone: settings.truewallet_phone,
            global_concurrent_limit_l4: settings.global_concurrent_limit_l4,
            global_concurrent_limit_l7: settings.global_concurrent_limit_l7,
            global_attack_enabled: settings.global_attack_enabled,
          },
        }),
      })

      if (response.ok) {
        await showAlert("Settings saved successfully", "Success")
      } else {
        const data = await response.json()
        await showAlert(data.error || "Failed to save settings", "Error")
      }
    } catch (error) {
      console.error("Failed to save settings:", error)
      await showAlert("An error occurred while saving", "Error")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <main className="container mx-auto px-4 py-4 lg:py-8">
        <div className="mb-8">
          <h1 className="text-2xl lg:text-3xl font-bold mb-2">Settings</h1>
          <p className="text-sm lg:text-base text-muted-foreground">
            Manage system settings
          </p>
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-64 mt-2" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-10 w-full" />
          </CardContent>
        </Card>
      </main>
    )
  }

  return (
    <main className="container mx-auto px-4 py-4 lg:py-8">
      <div className="mb-8">
        <h1 className="text-2xl lg:text-3xl font-bold mb-2">Settings</h1>
        <p className="text-sm lg:text-base text-muted-foreground">
          Manage system settings
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Payment Settings</CardTitle>
            <CardDescription>
              Configure TrueWallet phone number
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="truewallet_phone">TrueWallet Phone Number</Label>
                <Input
                  id="truewallet_phone"
                  type="tel"
                  value={settings.truewallet_phone}
                  onChange={(e) =>
                    setSettings({ ...settings, truewallet_phone: e.target.value })
                  }
                  placeholder="0812345678"
                  maxLength={10}
                  required
                />
                <p className="text-xs text-muted-foreground">
                  TrueWallet phone number
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>System Settings</CardTitle>
            <CardDescription>
              Configure global system limits and controls
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="space-y-4 p-4 border rounded-lg bg-muted/50">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="global_attack_enabled" className="text-base font-semibold flex items-center gap-2">
                      <Power className="h-4 w-4" />
                      Global Attack System
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Enable or disable attack system for all users. Admins can bypass this restriction.
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="global_attack_enabled"
                      checked={settings.global_attack_enabled === "true"}
                      onCheckedChange={(checked) =>
                        setSettings({ ...settings, global_attack_enabled: checked ? "true" : "false" })
                      }
                    />
                    <Label 
                      htmlFor="global_attack_enabled" 
                      className={`text-sm font-medium cursor-pointer ${settings.global_attack_enabled === "true" ? "text-primary" : "text-muted-foreground"}`}
                    >
                      {settings.global_attack_enabled === "true" ? "Enabled" : "Disabled"}
                    </Label>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="global_concurrent_limit_l4">Global Concurrent Attack Limit (L4)</Label>
                  <Input
                    id="global_concurrent_limit_l4"
                    type="number"
                    min="1"
                    value={settings.global_concurrent_limit_l4}
                    onChange={(e) =>
                      setSettings({ ...settings, global_concurrent_limit_l4: e.target.value })
                    }
                    placeholder="No limit (leave empty)"
                  />
                  <p className="text-xs text-muted-foreground">
                    Maximum concurrent L4 attacks across all users. Leave empty for no limit.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="global_concurrent_limit_l7">Global Concurrent Attack Limit (L7)</Label>
                  <Input
                    id="global_concurrent_limit_l7"
                    type="number"
                    min="1"
                    value={settings.global_concurrent_limit_l7}
                    onChange={(e) =>
                      setSettings({ ...settings, global_concurrent_limit_l7: e.target.value })
                    }
                    placeholder="No limit (leave empty)"
                  />
                  <p className="text-xs text-muted-foreground">
                    Maximum concurrent L7 attacks across all users. Leave empty for no limit.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end mt-6">
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
      <AlertComponent />
    </main>
  )
}

