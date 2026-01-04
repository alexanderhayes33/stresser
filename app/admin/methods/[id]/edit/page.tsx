import { redirect } from "next/navigation"
import { getUser } from "@/lib/get-user"
import MethodFormClient from "@/components/method-form-client"

export default async function EditMethodPage({
  params,
}: {
  params: { id: string }
}) {
  const user = await getUser()

  if (!user || !user.is_admin) {
    redirect("/dashboard")
  }

  return <MethodFormClient methodId={params.id} />
}

