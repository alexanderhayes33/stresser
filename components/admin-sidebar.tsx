"use client"

import { useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/theme-toggle"
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet"
import {
  LayoutDashboard,
  Shield,
  Users,
  Activity,
  Target,
  Settings,
  LogOut,
  User,
  Menu,
  CreditCard,
  Receipt,
  Home,
} from "lucide-react"
import type { User as UserType } from "@/lib/get-user"
import { cn } from "@/lib/utils"

interface AdminSidebarProps {
  user: UserType
  onLogout: () => void
}

const navigation = [
  { name: "Home", href: "/", icon: Home },
  { name: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { name: "Attacks", href: "/admin/attacks", icon: Activity },
  { name: "Users", href: "/admin/users", icon: Users },
  { name: "Methods", href: "/admin/methods", icon: Target },
  { name: "Plans", href: "/admin/plans", icon: CreditCard },
  { name: "Transactions", href: "/admin/transactions", icon: Receipt },
  { name: "Settings", href: "/admin/settings", icon: Settings },
]

export function AdminSidebar({ user, onLogout }: AdminSidebarProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)

  const SidebarContent = ({ onItemClick }: { onItemClick?: () => void }) => (
    <div className="flex h-full flex-col">
      <div className="flex h-16 items-center border-b px-6">
        <div className="flex items-center gap-2">
          <div className="rounded-lg bg-primary p-2">
            <Shield className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="text-xl font-bold">Backoffice</span>
        </div>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-4">
        {navigation.map((item) => {
          const Icon = item.icon
          // สำหรับ "/" และ "/admin" ให้เช็ค exact match เท่านั้น
          // สำหรับเมนูอื่นให้เช็ค exact match หรือ sub-path
          const isActive = item.href === "/" || item.href === "/admin"
            ? pathname === item.href
            : pathname === item.href || pathname?.startsWith(item.href + "/")
          return (
            <Link
              key={item.name}
              href={item.href}
              onClick={onItemClick}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-accent text-accent-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              )}
            >
              <Icon className="h-5 w-5" />
              {item.name}
            </Link>
          )
        })}
      </nav>

      <div className="border-t p-4">
        <div className="mb-3 flex items-center gap-3 rounded-lg px-3 py-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
            <User className="h-4 w-4 text-primary" />
          </div>
          <div className="flex-1 overflow-hidden">
            <p className="text-sm font-medium truncate">{user.username}</p>
            <p className="text-xs text-muted-foreground truncate">Admin</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="flex-1 justify-start gap-2"
            onClick={() => {
              router.push("/dashboard")
            }}
          >
            <LayoutDashboard className="h-4 w-4" />
            User View
          </Button>
        </div>
        <div className="flex items-center gap-2 mt-2">
          <ThemeToggle />
          <Button
            variant="ghost"
            size="sm"
            className="flex-1 justify-start gap-2"
            onClick={onLogout}
          >
            <LogOut className="h-4 w-4" />
            Logout
          </Button>
        </div>
      </div>
    </div>
  )

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-64 lg:flex-col border-r bg-background">
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden fixed top-4 left-4 z-50 bg-background/80 backdrop-blur-sm border shadow-sm"
          >
            <Menu className="h-5 w-5" />
            <span className="sr-only">Toggle menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-64 p-0">
          <SidebarContent onItemClick={() => setMobileOpen(false)} />
        </SheetContent>
      </Sheet>
    </>
  )
}

