import { redirect } from "next/navigation"
import { getUser } from "@/lib/get-user"
import SettingsClient from "@/components/settings-client"

export default async function SettingsPage() {
  const user = await getUser()

  if (!user) {
    redirect("/login")
  }

  if (!user.is_admin) {
    redirect("/dashboard")
  }

  return <SettingsClient />
}

