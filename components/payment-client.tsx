"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { Loader2, CreditCard, ArrowLeft } from "lucide-react"


export default function PaymentClient() {
  const router = useRouter()
  
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [voucherLink, setVoucherLink] = useState("")
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)
  const [newBalance, setNewBalance] = useState<number | null>(null)

  useEffect(() => {
    setLoading(false)
  }, [])

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
        setTimeout(() => {
          router.push("/dashboard")
        }, 3000)
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

  if (loading) {
    return (
      <main className="container mx-auto px-4 py-4 lg:py-8">
        <Skeleton className="h-96 w-full" />
      </main>
    )
  }

  return (
    <main className="container mx-auto px-4 py-4 lg:py-8">
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => router.back()}
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <h1 className="text-2xl lg:text-3xl font-bold mb-2">Top Up Balance</h1>
        <p className="text-sm lg:text-base text-muted-foreground">
          Top up your balance with TrueWallet gift envelope
        </p>
      </div>

      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            TrueWallet Payment
          </CardTitle>
          <CardDescription>
            Please enter your TrueWallet Gift Link to proceed with payment
          </CardDescription>
        </CardHeader>
        <CardContent>
          {success ? (
            <div className="text-center py-8">
              <div className="text-4xl mb-4">✅</div>
              <h3 className="text-xl font-bold mb-2 text-green-600">
                Top Up Successful!
              </h3>
              {newBalance !== null && (
                <p className="text-lg font-semibold mb-2">
                  Your new balance: ฿{newBalance.toFixed(2)}
                </p>
              )}
              <p className="text-muted-foreground">
                Redirecting to Dashboard...
              </p>
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
                  onClick={() => router.back()}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={submitting} className="flex-1">
                  {submitting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <CreditCard className="mr-2 h-4 w-4" />
                      Pay Now
                    </>
                  )}
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </main>
  )
}

