import { redirect } from "next/navigation"
import { getUser } from "@/lib/get-user"
import UserFormClient from "@/components/user-form-client"

export default async function NewUserPage() {
  const user = await getUser()

  if (!user || !user.is_admin) {
    redirect("/dashboard")
  }

  return <UserFormClient />
}

