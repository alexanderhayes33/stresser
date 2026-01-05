import { redirect } from "next/navigation"
import { Suspense } from "react"
import { getUser } from "@/lib/get-user"
import PaymentClient from "@/components/payment-client"
import { Skeleton } from "@/components/ui/skeleton"

function PaymentPageContent() {
  return <PaymentClient />
}

export default async function PaymentPage() {
  const user = await getUser()

  if (!user) {
    redirect("/login")
  }

  return (
    <Suspense fallback={<Skeleton className="h-96 w-full" />}>
      <PaymentPageContent />
    </Suspense>
  )
}

