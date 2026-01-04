import { PublicNavbar } from "@/components/public-navbar"
import PricingPageClient from "@/components/pricing-page-client"
import { SaturnHubLogo } from "@/components/saturn-hub-logo"

export default function PricingPage() {
  return (
    <div className="min-h-screen flex flex-col overflow-x-hidden">
      <PublicNavbar />
      <PricingPageClient />
      {/* Footer */}
      <footer className="border-t py-8 mt-auto">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <SaturnHubLogo size="sm" />
              <span className="font-bold">Saturn Hub</span>
            </div>
            <p className="text-sm text-muted-foreground">
              © 2026 Saturn Hub. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}

