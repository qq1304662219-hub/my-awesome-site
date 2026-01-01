'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { AlertTriangle } from 'lucide-react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error(error)
  }, [error])

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-[#020817] text-white">
      <div className="bg-white/5 border border-white/10 rounded-xl p-8 max-w-md w-full text-center space-y-6">
        <div className="mx-auto w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center">
            <AlertTriangle className="h-8 w-8 text-red-500" />
        </div>
        
        <div className="space-y-2">
            <h2 className="text-xl font-bold">出错了</h2>
            <p className="text-gray-400 text-sm">
            我们遇到了一些问题。请尝试刷新页面或稍后再试。
            </p>
            {process.env.NODE_ENV === 'development' && (
                <p className="text-xs text-red-400 bg-red-500/5 p-2 rounded mt-2 text-left font-mono break-all">
                    {error.message}
                </p>
            )}
        </div>

        <div className="flex gap-4 justify-center">
            <Button
                variant="outline"
                onClick={() => window.location.href = '/'}
                className="border-white/10 hover:bg-white/10"
            >
                返回首页
            </Button>
            <Button
                onClick={() => reset()}
                className="bg-blue-600 hover:bg-blue-700"
            >
                重试
            </Button>
        </div>
      </div>
    </div>
  )
}
