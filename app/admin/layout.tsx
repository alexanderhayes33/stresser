import { redirect } from "next/navigation"
import { getUser } from "@/lib/get-user"
import AdminLayoutClient from "@/components/admin-layout-client"

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await getUser()

  if (!user) {
    redirect("/login")
  }

  if (!user.is_admin) {
    redirect("/dashboard")
  }

  return <AdminLayoutClient user={user}>{children}</AdminLayoutClient>
}

