import { redirect } from "next/navigation"
import { getUser } from "@/lib/get-user"
import AttacksPageClient from "@/components/attacks-page-client"

export default async function AttacksPage() {
  const user = await getUser()

  if (!user) {
    redirect("/login")
  }

  return <AttacksPageClient />
}

