import { redirect } from "next/navigation"
import { getUser } from "@/lib/get-user"
import AttacksListClient from "@/components/attacks-list-client"

export default async function AttacksPage() {
  const user = await getUser()

  if (!user || !user.is_admin) {
    redirect("/dashboard")
  }

  return <AttacksListClient />
}

