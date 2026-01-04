import { Suspense } from "react"
import { TransactionsClient } from "@/components/transactions-list-client"
import { Skeleton } from "@/components/ui/skeleton"

export default function TransactionsPage() {
  return (
    <Suspense
      fallback={
        <main className="container mx-auto px-4 py-8">
          <div className="mb-8">
            <Skeleton className="h-8 w-48 mb-2" />
            <Skeleton className="h-4 w-96" />
          </div>
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-24 w-full" />
            ))}
          </div>
        </main>
      }
    >
      <TransactionsClient />
    </Suspense>
  )
}

