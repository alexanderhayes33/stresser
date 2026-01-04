import { redirect } from "next/navigation"
import { getUser } from "@/lib/get-user"
import UserLayoutClient from "@/components/user-layout-client"

export default async function UserLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await getUser()

  if (!user) {
    redirect("/login")
  }

  return <UserLayoutClient user={user}>{children}</UserLayoutClient>
}

