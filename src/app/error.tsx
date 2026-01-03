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
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-background text-foreground">
      <div className="bg-card border border-border rounded-xl p-8 max-w-md w-full text-center space-y-6 shadow-sm">
        <div className="mx-auto w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center">
            <AlertTriangle className="h-8 w-8 text-red-500" />
        </div>
        
        <div className="space-y-2">
            <h2 className="text-xl font-bold">出错了</h2>
            <p className="text-muted-foreground text-sm">
            我们遇到了一些问题。请尝试刷新页面或稍后再试。
            </p>
            {process.env.NODE_ENV === 'development' && (
                <p className="text-xs text-red-500 bg-red-500/10 p-2 rounded mt-2 text-left font-mono break-all">
                    {error.message}
                </p>
            )}
        </div>

        <div className="flex gap-4 justify-center">
            <Button
                variant="outline"
                onClick={() => window.location.href = '/'}
            >
                返回首页
            </Button>
            <Button
                onClick={() => reset()}
            >
                重试
            </Button>
        </div>
      </div>
    </div>
  )
}
