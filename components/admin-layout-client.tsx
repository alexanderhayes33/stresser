"use client"

import { useRouter } from "next/navigation"
import { AdminSidebar } from "@/components/admin-sidebar"
import type { User } from "@/lib/get-user"

interface AdminLayoutClientProps {
  user: User
  children: React.ReactNode
}

export default function AdminLayoutClient({
  user,
  children,
}: AdminLayoutClientProps) {
  const router = useRouter()

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" })
    router.push("/login")
    router.refresh()
  }

  return (
    <div className="min-h-screen bg-background">
      <AdminSidebar user={user} onLogout={handleLogout} />
      <div className="lg:pl-64 pt-16 lg:pt-0">{children}</div>
    </div>
  )
}

