import Link from "next/link"
import { Button } from "@/components/ui/button"
import { FileQuestion, Home } from "lucide-react"
import { Navbar } from "@/components/landing/Navbar"

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <Navbar />
      
      <div className="flex-1 flex flex-col items-center justify-center p-4">
        <div className="relative mb-8">
            <div className="absolute inset-0 bg-blue-500/20 blur-3xl rounded-full"></div>
            <FileQuestion className="h-32 w-32 text-muted-foreground relative z-10" />
        </div>

        <h2 className="text-6xl font-bold mb-4 bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">404</h2>
        <h3 className="text-2xl font-semibold mb-6 text-foreground">页面未找到</h3>
        <p className="text-muted-foreground mb-8 text-center max-w-md leading-relaxed">
          抱歉，您访问的页面可能已被移除、重命名或暂时不可用。
          <br />
          请检查链接是否正确，或返回首页。
        </p>
        
        <Link href="/">
          <Button size="lg" className="bg-blue-600 hover:bg-blue-700 rounded-full px-8">
            <Home className="h-4 w-4 mr-2" />
            返回首页
          </Button>
        </Link>
      </div>
    </div>
  )
}
