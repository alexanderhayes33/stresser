import { redirect } from "next/navigation"
import { getUser } from "@/lib/get-user"
import ExternalApiLogsClient from "@/components/external-api-logs-client"

export default async function ExternalApiLogsPage() {
  const user = await getUser()

  if (!user || !user.is_admin) {
    redirect("/dashboard")
  }

  return <ExternalApiLogsClient />
}

