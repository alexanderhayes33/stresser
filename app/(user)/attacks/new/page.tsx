import { redirect } from "next/navigation"
import { getUser } from "@/lib/get-user"
import AttackFormClient from "@/components/user-attack-form-client"

export default async function NewAttackPage() {
  const user = await getUser()

  if (!user) {
    redirect("/login")
  }

  return <AttackFormClient />
}

