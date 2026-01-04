import { redirect } from "next/navigation"
import { getUser } from "@/lib/get-user"
import ApiLogsClient from "@/components/api-logs-client"

export default async function ApiLogsPage() {
  const user = await getUser()

  if (!user || !user.is_admin) {
    redirect("/dashboard")
  }

  return <ApiLogsClient />
}

