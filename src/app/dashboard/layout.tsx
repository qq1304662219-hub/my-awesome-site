import { DashboardSidebar } from "@/components/dashboard/Sidebar"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex h-screen bg-[#0B1120] overflow-hidden">
      <DashboardSidebar />
      <main className="flex-1 overflow-y-auto relative">
        {children}
      </main>
    </div>
  )
}
