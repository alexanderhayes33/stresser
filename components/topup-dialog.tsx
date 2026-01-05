"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { CreditCard, Loader2, Wallet } from "lucide-react"
import { CheckmarkAnimation } from "@/components/checkmark-animation"

interface TopupDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export function TopupDialog({ open, onOpenChange, onSuccess }: TopupDialogProps) {
  const [voucherLink, setVoucherLink] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)
  const [newBalance, setNewBalance] = useState<number | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setSubmitting(true)

    try {
      const response = await fetch("/api/payment/topup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          voucherLink: voucherLink.trim(),
        }),
      })

      const data = await response.json()

      if (response.ok && data.success) {
        setSuccess(true)
        setNewBalance(data.balance || null)
        setVoucherLink("")
        if (onSuccess) {
          onSuccess()
        }
        setTimeout(() => {
          onOpenChange(false)
          setSuccess(false)
          setNewBalance(null)
        }, 2000)
      } else {
        setError(data.message || data.error || "Payment processing failed")
      }
    } catch (error: any) {
      console.error("Failed to process payment:", error)
      setError("System error occurred. Please try again")
    } finally {
      setSubmitting(false)
    }
  }

  const handleOpenChange = (open: boolean) => {
    if (!open && !submitting) {
      setVoucherLink("")
      setError("")
      setSuccess(false)
      setNewBalance(null)
    }
    onOpenChange(open)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5" />
            Top Up Balance
          </DialogTitle>
          <DialogDescription>
            Enter your TrueWallet gift envelope link to add balance
          </DialogDescription>
        </DialogHeader>
        {success ? (
          <div className="py-6 space-y-4">
            <div className="text-center">
              <CheckmarkAnimation className="mb-4" />
              <h3 className="text-xl font-bold mb-2 text-green-600">
                Top Up Successful!
              </h3>
              {newBalance !== null && (
                <p className="text-lg font-semibold mb-2">
                  Your new balance: ฿{newBalance.toFixed(2)}
                </p>
              )}
              <p className="text-sm text-muted-foreground">
                Closing dialog...
              </p>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="voucherLink">TrueWallet Gift Link</Label>
              <Input
                id="voucherLink"
                type="text"
                value={voucherLink}
                onChange={(e) => setVoucherLink(e.target.value)}
                placeholder="https://gift.truemoney.com/campaign/?v=..."
                required
                disabled={submitting}
              />
            </div>

            {error && (
              <div className="p-3 rounded-md bg-destructive/10 text-destructive text-sm">
                {error}
              </div>
            )}

            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => handleOpenChange(false)}
                className="flex-1"
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={submitting} className="flex-1">
                {submitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <CreditCard className="mr-2 h-4 w-4" />
                    Top Up
                  </>
                )}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}

