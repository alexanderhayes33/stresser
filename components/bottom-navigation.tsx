"use client"

import { usePathname } from "next/navigation"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { ThemeToggle } from "@/components/theme-toggle"
import {
  LayoutDashboard,
  Zap,
  CreditCard,
  Settings,
  Shield,
  Home,
} from "lucide-react"
import type { User as UserType } from "@/lib/get-user"

interface BottomNavigationProps {
  user: UserType
}

const navigation: Array<{
  name: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  isHome?: boolean
}> = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Attacks", href: "/attacks", icon: Zap },
  { name: "Home", href: "/", icon: Home, isHome: true },
  { name: "Pricing", href: "/pricing", icon: CreditCard },
  { name: "Settings", href: "/settings", icon: Settings },
]

export function BottomNavigation({ user }: BottomNavigationProps) {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 lg:hidden">
      <div className="flex items-center justify-between h-16 relative px-4">
        {navigation.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href || (item.href !== "/" && pathname?.startsWith(item.href + "/"))
          const isHome = item.isHome
          
          if (isHome) {
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "absolute left-1/2 -translate-x-1/2 -top-7 flex items-center justify-center transition-all group z-10",
                  isActive
                    ? "text-primary"
                    : "text-primary-foreground"
                )}
              >
                <div className={cn(
                  "relative rounded-full p-4 shadow-2xl transition-all duration-300",
                  "bg-gradient-to-br from-primary via-primary to-primary/80",
                  "ring-4 ring-primary/20 ring-offset-2 ring-offset-background",
                  "hover:scale-110 hover:shadow-primary/50",
                  isActive && "animate-pulse"
                )}>
                  {/* Glow effect */}
                  <div className="absolute inset-0 rounded-full bg-primary/30 blur-xl animate-pulse" />
                  <Icon className="h-6 w-6 relative z-10" />
                </div>
              </Link>
            )
          }
          
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center gap-1 text-xs font-medium transition-colors flex-1",
                isActive
                  ? "text-primary"
                  : "text-muted-foreground"
              )}
            >
              <Icon className="h-5 w-5" />
              <span className="text-[10px]">{item.name}</span>
            </Link>
          )
        })}
      </div>
      <div className="absolute -top-12 right-4 flex items-center gap-2">
        <ThemeToggle />
        {user.is_admin && (
          <Link
            href="/admin"
            className={cn(
              "flex items-center gap-2 rounded-full px-4 py-2 text-xs font-medium transition-colors shadow-lg",
              pathname?.startsWith("/admin")
                ? "bg-primary text-primary-foreground"
                : "bg-primary/90 text-primary-foreground hover:bg-primary"
            )}
          >
            <Shield className="h-4 w-4" />
            <span>Admin</span>
          </Link>
        )}
      </div>
    </nav>
  )
}

