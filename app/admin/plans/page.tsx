import { redirect } from "next/navigation"
import { getUser } from "@/lib/get-user"
import PlansListClient from "@/components/plans-list-client"

export default async function PlansPage() {
  const user = await getUser()

  if (!user) {
    redirect("/login")
  }

  if (!user.is_admin) {
    redirect("/dashboard")
  }

  return <PlansListClient />
}

