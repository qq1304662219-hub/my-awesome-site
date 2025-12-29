"use client"

import { useEffect } from "react"
import { Button } from "@/components/ui/button"
import { AlertTriangle, RefreshCcw } from "lucide-react"

export default function Error({
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
    <div className="min-h-screen bg-[#020817] flex flex-col items-center justify-center text-center px-4">
      <div className="space-y-6 max-w-md bg-[#0B1120] p-8 rounded-2xl border border-white/10">
        <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto text-red-500">
          <AlertTriangle className="w-8 h-8" />
        </div>
        
        <div>
          <h2 className="text-xl font-bold text-white mb-2">系统遇到了一点小问题</h2>
          <p className="text-gray-400 text-sm">
            这可能是临时的网络波动或系统错误。我们已经记录了这个问题。
          </p>
        </div>

        <div className="flex gap-4 justify-center">
          <Button 
            onClick={reset}
            className="bg-white text-black hover:bg-gray-200 gap-2"
          >
            <RefreshCcw className="w-4 h-4" />
            尝试刷新
          </Button>
          <Button 
            variant="outline" 
            onClick={() => window.location.href = '/'}
            className="border-white/10 hover:bg-white/10"
          >
            返回首页
          </Button>
        </div>
        
        {process.env.NODE_ENV === 'development' && (
          <div className="mt-8 p-4 bg-black/50 rounded-lg text-left overflow-auto max-h-40">
            <p className="text-xs text-red-400 font-mono break-all">
              {error.message}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
