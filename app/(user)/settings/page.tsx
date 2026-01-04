import { redirect } from "next/navigation"
import { getUser } from "@/lib/get-user"
import UserSettingsClient from "@/components/user-settings-client"

export default async function SettingsPage() {
  const user = await getUser()

  if (!user) {
    redirect("/login")
  }

  return <UserSettingsClient />
}

