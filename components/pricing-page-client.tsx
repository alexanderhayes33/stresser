"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Check, Infinity, ShoppingCart, CreditCard, Loader2, Zap, Clock, Target, Shield, Wallet } from "lucide-react"
import { CheckmarkAnimation } from "@/components/checkmark-animation"

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

export default function PricingPageClient() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [plans, setPlans] = useState<Plan[]>([])
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)
  const [userBalance, setUserBalance] = useState<number>(0)

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const response = await fetch("/api/plans")
        if (response.ok) {
          const data = await response.json()
          setPlans(data.plans || [])
        }
      } catch (error) {
        console.error("Failed to fetch plans:", error)
      } finally {
        setLoading(false)
      }
    }

    const fetchUserProfile = async () => {
      try {
        const response = await fetch("/api/user/profile")
        if (response.ok) {
          const data = await response.json()
          setUserBalance(data.user?.balance || 0)
        }
      } catch (error) {
        console.error("Failed to fetch user profile:", error)
      }
    }

    fetchPlans()
    fetchUserProfile()
  }, [])

  const formatPrice = (price: number | null) => {
    if (price === null) return "Free"
    return `฿${price.toFixed(2)}`
  }

  const formatLimit = (value: number | null) => {
    if (value === null) return <Infinity className="h-4 w-4 inline" />
    return value.toString()
  }

  const handlePurchaseClick = (plan: Plan) => {
    setSelectedPlan(plan)
    setDialogOpen(true)
    setError("")
    setSuccess(false)
  }

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedPlan) return

    setError("")
    setSubmitting(true)

    try {
      // ใช้ balance เท่านั้น
      const response = await fetch("/api/payment/use-balance", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          planId: selectedPlan.id,
        }),
      })

      const data = await response.json()

      if (response.ok && data.success) {
        setSuccess(true)
        setUserBalance(data.balance || 0)
        // Refresh user profile to get updated balance
        const profileResponse = await fetch("/api/user/profile")
        if (profileResponse.ok) {
          const profileData = await profileResponse.json()
          setUserBalance(profileData.user?.balance || 0)
        }
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
        <div className="mb-8">
          <h1 className="text-2xl lg:text-3xl font-bold mb-2">Pricing Plans</h1>
          <p className="text-sm lg:text-base text-muted-foreground">
            Choose the plan that fits your needs
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-96 w-full" />
          ))}
        </div>
      </main>
    )
  }

  return (
    <>
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Purchase Plan
            </DialogTitle>
            <DialogDescription>
              {selectedPlan
                ? `Purchase ${selectedPlan.name} plan - ฿${selectedPlan.price?.toFixed(2)} using your balance`
                : "Purchase plan using your balance"}
            </DialogDescription>
          </DialogHeader>
          {success ? (
            <div className="py-6 space-y-6">
              <div className="text-center">
                <CheckmarkAnimation className="mb-4" />
                <h3 className="text-2xl font-bold mb-2">
                  Payment Successful!
                </h3>
                <p className="text-sm text-muted-foreground">
                  Your plan has been activated successfully
                </p>
              </div>

              {selectedPlan && (
                <div className="border rounded-lg p-4 space-y-4 bg-muted/50">
                  <div className="flex items-center justify-between pb-3 border-b">
                    <div>
                      <h4 className="text-lg font-semibold">{selectedPlan.name}</h4>
                      {selectedPlan.description && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {selectedPlan.description}
                        </p>
                      )}
                    </div>
                    {selectedPlan.price && (
                      <div className="text-right">
                        <div className="text-2xl font-bold">฿{selectedPlan.price.toFixed(2)}</div>
                        <div className="text-xs text-muted-foreground">/m</div>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Zap className="h-4 w-4" />
                        <span>Max Concurrent</span>
                      </div>
                      <div className="text-lg font-semibold">
                        {formatLimit(selectedPlan.max_concurrent)}
                      </div>
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        <span>Max Time</span>
                      </div>
                      <div className="text-lg font-semibold">
                        {formatLimit(selectedPlan.max_time)}s
                      </div>
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Target className="h-4 w-4" />
                        <span>Methods</span>
                      </div>
                      <div className="text-lg font-semibold">
                        {selectedPlan.allowed_methods && selectedPlan.allowed_methods.length > 0
                          ? selectedPlan.allowed_methods.length
                          : "∞"}
                      </div>
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Shield className="h-4 w-4" />
                        <span>Cooldown</span>
                      </div>
                      <div className="text-lg font-semibold">
                        {selectedPlan.cooldown === null || selectedPlan.cooldown === 0
                          ? "0s"
                          : `${selectedPlan.cooldown}s`}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="pt-4">
                <Button
                  className="w-full"
                  onClick={() => {
                    setDialogOpen(false)
                    router.push("/dashboard")
                    router.refresh()
                  }}
                >
                  Let Start
                </Button>
              </div>
            </div>
          ) : (
            <form onSubmit={handlePaymentSubmit} className="space-y-4">
              {selectedPlan && (
                <div className="p-3 rounded-md bg-muted/50 text-sm">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-muted-foreground">Plan Price:</span>
                    <span className="font-semibold">฿{selectedPlan.price?.toFixed(2)}</span>
                  </div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-muted-foreground">Your Balance:</span>
                    <span className="font-semibold">฿{userBalance.toFixed(2)}</span>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t">
                    <span className="text-muted-foreground">Remaining Balance:</span>
                    <span className={`font-semibold ${userBalance >= (selectedPlan.price || 0) ? "text-primary" : "text-destructive"}`}>
                      ฿{(userBalance - (selectedPlan.price || 0)).toFixed(2)}
                    </span>
                  </div>
                  {userBalance < (selectedPlan.price || 0) && (
                    <div className="mt-3 p-2 rounded-md bg-destructive/10 border border-destructive/20">
                      <p className="text-xs text-destructive font-medium mb-1">
                        Insufficient balance
                      </p>
                      <p className="text-xs text-muted-foreground mb-2">
                        Please top up your balance first using TrueWallet gift envelope.
                      </p>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="w-full"
                        onClick={() => {
                          setDialogOpen(false)
                          router.push("/payment")
                        }}
                      >
                        <CreditCard className="mr-2 h-3 w-3" />
                        Go to Top Up
                      </Button>
                    </div>
                  )}
                </div>
              )}

              {error && (
                <div className="p-3 rounded-md bg-destructive/10 text-destructive text-sm">
                  {error}
                </div>
              )}

              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setDialogOpen(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={submitting || userBalance < (selectedPlan?.price || 0)} 
                  className="flex-1"
                >
                  {submitting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <Wallet className="mr-2 h-4 w-4" />
                      Pay with Balance
                    </>
                  )}
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>

      <main className="flex-1 container mx-auto px-4 py-8 lg:py-16 min-h-0 relative bg-pattern">
        {/* Animated background elements */}
        <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
          <div className="absolute top-0 right-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-float" />
          <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }} />
          <div className="absolute top-1/4 right-1/3 w-64 h-64 bg-primary/8 rounded-full blur-2xl animate-float" style={{ animationDelay: '1s' }} />
          <div className="absolute bottom-1/3 left-1/3 w-80 h-80 bg-primary/6 rounded-full blur-2xl animate-float" style={{ animationDelay: '3s' }} />
        </div>
        
        {/* Grid overlay */}
        <div className="fixed inset-0 -z-10 bg-grid opacity-20" />

        <div className="mb-12 lg:mb-16 text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass mb-6 animate-pulse-glow">
            <span className="text-sm font-medium">Choose Your Plan</span>
          </div>
          <h1 className="text-4xl lg:text-6xl font-bold mb-4">
            <span className="gradient-text">Pricing Plans</span>
          </h1>
          <p className="text-lg lg:text-xl text-muted-foreground max-w-2xl mx-auto">
            Select the perfect plan that fits your testing needs and scale as you grow
          </p>
        </div>

        {plans.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            No plans available at the moment
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8 max-w-7xl mx-auto relative z-10">
            {plans.map((plan, index) => (
              <Card 
                key={plan.id} 
                className={`gradient-pricing-card flex flex-col group overflow-hidden relative ${
                  plan.is_popular ? 'lg:scale-105 border-primary/40' : ''
                }`}
              >
                <div className="shine-effect absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                
                {plan.is_popular && plan.is_active && (
                  <div className="absolute top-0 right-0 bg-primary text-primary-foreground px-3 py-1 text-xs font-bold rounded-bl-lg">
                    POPULAR
                  </div>
                )}
                
                <CardHeader className="relative z-10">
                  <div className="flex items-center justify-between mb-4">
                    <CardTitle className="text-2xl lg:text-3xl font-bold">{plan.name}</CardTitle>
                    <Badge 
                      variant={plan.is_active ? "default" : "outline"}
                      className={plan.is_active ? "gradient-primary" : ""}
                    >
                      {plan.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                  <div className="text-4xl lg:text-5xl font-bold mb-2">
                    <span className="gradient-text">
                      {formatPrice(plan.price)}
                    </span>
                    {plan.price && (
                      <span className="text-base font-normal text-muted-foreground ml-2">/m</span>
                    )}
                  </div>
                  {plan.description && (
                    <CardDescription className="mt-3 text-base">
                      {plan.description}
                    </CardDescription>
                  )}
                </CardHeader>
                
                <CardContent className="flex-1 flex flex-col relative z-10">
                  <div className="space-y-4 flex-1 mb-6">
                    <div className="space-y-3">
                      <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors">
                        <div className="gradient-feature-icon rounded-lg p-1.5">
                          <Zap className="h-4 w-4 text-primary" />
                        </div>
                        <span className="text-sm flex-1">
                          <strong className="text-foreground">Max Concurrent:</strong>{" "}
                          <span className="text-muted-foreground">{formatLimit(plan.max_concurrent)}</span>
                        </span>
                      </div>
                      <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors">
                        <div className="gradient-feature-icon rounded-lg p-1.5">
                          <Clock className="h-4 w-4 text-primary" />
                        </div>
                        <span className="text-sm flex-1">
                          <strong className="text-foreground">Max Time:</strong>{" "}
                          <span className="text-muted-foreground">{formatLimit(plan.max_time)}s</span>
                        </span>
                      </div>
                      <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors">
                        <div className="gradient-feature-icon rounded-lg p-1.5">
                          <Shield className="h-4 w-4 text-primary" />
                        </div>
                        <span className="text-sm flex-1">
                          <strong className="text-foreground">Cooldown:</strong>{" "}
                          <span className="text-muted-foreground">
                            {plan.cooldown === null || plan.cooldown === 0
                              ? "0s"
                              : `${plan.cooldown}s`}
                          </span>
                        </span>
                      </div>
                      <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors">
                        <div className="gradient-feature-icon rounded-lg p-1.5">
                          <Target className="h-4 w-4 text-primary" />
                        </div>
                        <span className="text-sm flex-1">
                          <strong className="text-foreground">Allowed Methods:</strong>{" "}
                          <span className="text-muted-foreground">
                            {plan.allowed_methods && plan.allowed_methods.length > 0
                              ? plan.allowed_methods.length
                              : "All"}
                          </span>
                        </span>
                      </div>
                      {plan.allowed_methods && plan.allowed_methods.length > 0 && (
                        <div className="pl-6 text-xs text-muted-foreground bg-muted/30 p-2 rounded">
                          {plan.allowed_methods.join(", ")}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {plan.price && plan.price > 0 && (
                    <div className="mt-auto pt-4 border-t">
                      <Button
                        className="w-full gradient-primary shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
                        onClick={() => handlePurchaseClick(plan)}
                      >
                        <ShoppingCart className="mr-2 h-4 w-4" />
                        Purchase Plan
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </>
  )
}

