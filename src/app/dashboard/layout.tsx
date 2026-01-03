import { DashboardSidebar } from "@/components/dashboard/Sidebar"
import { Navbar } from "@/components/landing/Navbar"
import { AuthGuard } from "@/components/auth/AuthGuard"

import { EmailVerificationBanner } from "@/components/dashboard/EmailVerificationBanner"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <AuthGuard>
      <div className="flex h-screen bg-background overflow-hidden flex-col">
        <Navbar simple={true} showMobileMenu={false} />
        <div className="flex flex-1 overflow-hidden pt-16">
          <DashboardSidebar />
          <main className="flex-1 overflow-y-auto relative">
            <EmailVerificationBanner />
            {children}
          </main>
        </div>
      </div>
    </AuthGuard>
  )
}
