import { redirect } from "next/navigation"
import { getUser } from "@/lib/get-user"
import DashboardClient from "@/components/dashboard-client"

export default async function DashboardPage() {
  const user = await getUser()

  if (!user) {
    redirect("/login")
  }

  return <DashboardClient user={user} />
}
