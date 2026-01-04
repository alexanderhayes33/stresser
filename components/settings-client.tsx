"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { Save, Loader2 } from "lucide-react"
import { useAlert } from "@/lib/use-alert"

export default function SettingsClient() {
  const { showAlert, AlertComponent } = useAlert()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [settings, setSettings] = useState({
    truewallet_phone: "",
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

      <Card>
        <CardHeader>
          <CardTitle>Payment Settings</CardTitle>
          <CardDescription>
            Configure TrueWallet phone number
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
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

            <div className="flex justify-end">
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

