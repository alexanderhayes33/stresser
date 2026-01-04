import { redirect } from "next/navigation"
import { getUser } from "@/lib/get-user"
import AdminDashboardClient from "@/components/admin-dashboard-client"

export default async function AdminPage() {
  const user = await getUser()

  if (!user || !user.is_admin) {
    redirect("/dashboard")
  }

  return <AdminDashboardClient />
}

