import { redirect } from "next/navigation"
import { getUser } from "@/lib/get-user"
import UsersListClient from "@/components/users-list-client"

export default async function UsersPage() {
  const user = await getUser()

  if (!user || !user.is_admin) {
    redirect("/dashboard")
  }

  return <UsersListClient />
}

