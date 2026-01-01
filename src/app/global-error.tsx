"use client"

import { useEffect } from "react"
import { Button } from "@/components/ui/button"
import { AlertTriangle, RefreshCw } from "lucide-react"

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <html>
      <body className="bg-[#020817] text-white min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center justify-center p-8 max-w-md w-full text-center space-y-6">
          <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mb-2">
            <AlertTriangle className="h-10 w-10 text-red-500" />
          </div>
          
          <div className="space-y-2">
            <h2 className="text-3xl font-bold">发生了严重错误</h2>
            <p className="text-gray-400">
              我们遇到了无法处理的系统级错误。请尝试刷新页面。
            </p>
          </div>

          <Button 
            onClick={() => reset()} 
            className="bg-blue-600 hover:bg-blue-700 min-w-[120px]"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            重试
          </Button>
        </div>
      </body>
    </html>
  )
}
