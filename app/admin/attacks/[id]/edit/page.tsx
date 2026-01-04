import { redirect } from "next/navigation"
import { getUser } from "@/lib/get-user"
import AttackFormClient from "@/components/attack-form-client"

export default async function EditAttackPage({
  params,
}: {
  params: { id: string }
}) {
  const user = await getUser()

  if (!user || !user.is_admin) {
    redirect("/dashboard")
  }

  return <AttackFormClient attackId={params.id} />
}

