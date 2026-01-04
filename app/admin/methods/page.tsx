import { redirect } from "next/navigation"
import { getUser } from "@/lib/get-user"
import MethodsListClient from "@/components/methods-list-client"

export default async function MethodsPage() {
  const user = await getUser()

  if (!user || !user.is_admin) {
    redirect("/dashboard")
  }

  return <MethodsListClient />
}

