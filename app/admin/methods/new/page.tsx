import { redirect } from "next/navigation"
import { getUser } from "@/lib/get-user"
import MethodFormClient from "@/components/method-form-client"

export default async function NewMethodPage() {
  const user = await getUser()

  if (!user || !user.is_admin) {
    redirect("/dashboard")
  }

  return <MethodFormClient />
}

