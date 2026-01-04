"use client"

import { useRouter } from "next/navigation"
import { Sidebar } from "@/components/sidebar"
import { BottomNavigation } from "@/components/bottom-navigation"
import type { User } from "@/lib/get-user"

interface UserLayoutClientProps {
  user: User
  children: React.ReactNode
}

export default function UserLayoutClient({
  user,
  children,
}: UserLayoutClientProps) {
  const router = useRouter()

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" })
    router.push("/login")
    router.refresh()
  }

  return (
    <div className="min-h-screen bg-background">
      <Sidebar user={user} onLogout={handleLogout} />
      <div className="lg:pl-64 pb-16 lg:pb-0">{children}</div>
      <BottomNavigation user={user} />
    </div>
  )
}

