"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/theme-toggle"
import { Menu, X, LogIn, UserPlus, LayoutDashboard } from "lucide-react"
import { SaturnHubLogo } from "@/components/saturn-hub-logo"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
type User = {
  id: number
  username: string
  email: string | null
  role: string
  is_admin: boolean
}

export function PublicNavbar() {
  const pathname = usePathname()
  const router = useRouter()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const checkUser = async () => {
      try {
        const response = await fetch("/api/auth/me")
        if (response.ok) {
          const data = await response.json()
          setUser(data.user || null)
        }
      } catch (error) {
        console.error("Failed to check user:", error)
      } finally {
        setLoading(false)
      }
    }
    checkUser()
  }, [])

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" })
      setUser(null)
      router.push("/")
      router.refresh()
    } catch (error) {
      console.error("Failed to logout:", error)
    }
  }

  const navItems = [
    { name: "Home", href: "/" },
    { name: "Pricing", href: "/pricing" },
  ]

  return (
    <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-2">
              <SaturnHubLogo size="md" />
              <span className="text-xl font-bold">Saturn Hub</span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-6">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`text-sm font-medium transition-colors hover:text-primary ${
                    pathname === item.href
                      ? "text-foreground"
                      : "text-muted-foreground"
                  }`}
                >
                  {item.name}
                </Link>
              ))}
            </div>
          </div>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center gap-2">
            <ThemeToggle />
            {loading ? (
              <div className="h-9 w-20" />
            ) : user ? (
              <>
                <Button 
                  className="gradient-primary shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105" 
                  asChild
                >
                  <Link href="/dashboard">
                    <LayoutDashboard className="mr-2 h-4 w-4" />
                    Client Panel
                  </Link>
                </Button>
                <Button variant="ghost" onClick={handleLogout}>
                  Logout
                </Button>
              </>
            ) : (
              <>
                <Button variant="ghost" asChild>
                  <Link href="/login">
                    <LogIn className="mr-2 h-4 w-4" />
                    Login
                  </Link>
                </Button>
                <Button asChild>
                  <Link href="/register">
                    <UserPlus className="mr-2 h-4 w-4" />
                    Sign Up
                  </Link>
                </Button>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="flex md:hidden items-center gap-2">
            <ThemeToggle />
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                >
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[300px] sm:w-[400px]">
                <SheetHeader>
                  <SheetTitle className="flex items-center gap-2">
                    <SaturnHubLogo size="md" />
                    <span className="text-xl font-bold">Saturn Hub</span>
                  </SheetTitle>
                </SheetHeader>
                <div className="mt-8 space-y-6">
                  {/* Navigation Items */}
                  <div className="space-y-2">
                    {navItems.map((item) => (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setMobileOpen(false)}
                        className={`flex items-center px-4 py-3 rounded-lg text-base font-medium transition-colors ${
                          pathname === item.href
                            ? "bg-primary/10 text-primary"
                            : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                        }`}
                      >
                        {item.name}
                      </Link>
                    ))}
                  </div>

                  {/* User Actions */}
                  <div className="pt-6 border-t space-y-2">
                    {loading ? (
                      <div className="h-9" />
                    ) : user ? (
                      <>
                        <Button 
                          className="w-full gradient-primary shadow-lg hover:shadow-xl transition-all duration-300" 
                          asChild
                        >
                          <Link href="/dashboard" onClick={() => setMobileOpen(false)}>
                            <LayoutDashboard className="mr-2 h-4 w-4" />
                            Client Panel
                          </Link>
                        </Button>
                        <Button variant="ghost" className="w-full" onClick={() => {
                          handleLogout()
                          setMobileOpen(false)
                        }}>
                          Logout
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button variant="ghost" className="w-full" asChild>
                          <Link href="/login" onClick={() => setMobileOpen(false)}>
                            <LogIn className="mr-2 h-4 w-4" />
                            Login
                          </Link>
                        </Button>
                        <Button className="w-full" asChild>
                          <Link href="/register" onClick={() => setMobileOpen(false)}>
                            <UserPlus className="mr-2 h-4 w-4" />
                            Sign Up
                          </Link>
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </nav>
  )
}

