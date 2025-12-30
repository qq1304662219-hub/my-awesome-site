import { DashboardSidebar } from "@/components/dashboard/Sidebar"
import { Navbar } from "@/components/landing/Navbar"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex h-screen bg-[#0B1120] overflow-hidden flex-col">
      <Navbar />
      <div className="flex flex-1 overflow-hidden pt-16">
        <DashboardSidebar />
        <main className="flex-1 overflow-y-auto relative">
          {children}
        </main>
      </div>
    </div>
  )
}
