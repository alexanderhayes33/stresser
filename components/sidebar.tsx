"use client"

import { useState } from "react"
import { usePathname } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/theme-toggle"
import {
  Zap,
  LayoutDashboard,
  Settings,
  LogOut,
  User,
  Shield,
  CreditCard,
  Home,
  Wallet,
} from "lucide-react"
import { SaturnHubLogo } from "@/components/saturn-hub-logo"
import { TopupDialog } from "@/components/topup-dialog"
import type { User as UserType } from "@/lib/get-user"
import { cn } from "@/lib/utils"

interface SidebarProps {
  user: UserType
  onLogout: () => void
}

const navigation = [
  { name: "Home", href: "/", icon: Home },
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Attacks", href: "/attacks", icon: Zap },
  { name: "Pricing", href: "/pricing", icon: CreditCard },
  { name: "Settings", href: "/settings", icon: Settings },
]

export function Sidebar({ user, onLogout }: SidebarProps) {
  const pathname = usePathname()
  const [topupOpen, setTopupOpen] = useState(false)

  const SidebarContent = ({ onItemClick }: { onItemClick?: () => void }) => (
    <div className="flex h-full flex-col">
      <div className="flex h-16 items-center border-b px-6">
        <div className="flex items-center gap-2">
          <SaturnHubLogo size="md" />
          <span className="text-xl font-bold">Saturn Hub</span>
        </div>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-4">
        {navigation.map((item) => {
          const Icon = item.icon
          // สำหรับ "/" ให้เช็ค exact match เท่านั้น
          // สำหรับเมนูอื่นให้เช็ค exact match หรือ sub-path
          const isActive = item.href === "/"
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
        {user.is_admin && (
          <Link
            href="/admin"
            onClick={onItemClick}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              pathname?.startsWith("/admin")
                ? "bg-primary text-primary-foreground hover:bg-primary/90"
                : "bg-primary/10 text-primary hover:bg-primary/20",
              "border border-primary/20"
            )}
          >
            <Shield className="h-5 w-5" />
            Backoffice
          </Link>
        )}
      </nav>

      <div className="border-t p-4">
        <div className="mb-3 flex items-center gap-3 rounded-lg px-3 py-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
            <User className="h-4 w-4 text-primary" />
          </div>
          <div className="flex-1 overflow-hidden">
            <p className="text-sm font-medium truncate">{user.username}</p>
            <p className="text-xs text-muted-foreground truncate">
              {user.role}
            </p>
          </div>
        </div>
        <Button
          variant="default"
          size="sm"
          className="w-full mb-2 gap-2"
          onClick={() => {
            setTopupOpen(true)
            if (onItemClick) onItemClick()
          }}
        >
          <Wallet className="h-4 w-4" />
          Top Up Balance
        </Button>
        <div className="flex items-center gap-2">
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

      {/* Mobile - No sidebar, use bottom navigation instead */}
      <TopupDialog
        open={topupOpen}
        onOpenChange={setTopupOpen}
        onSuccess={() => {
          // Refresh page to update balance
          if (typeof window !== "undefined") {
            window.location.reload()
          }
        }}
      />
    </>
  )
}

