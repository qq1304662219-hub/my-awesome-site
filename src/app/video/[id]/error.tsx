'use client'
 
import { useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { AlertTriangle, RefreshCcw } from 'lucide-react'
 
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
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-card border border-border rounded-xl p-8 text-center space-y-6">
        <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto">
            <AlertTriangle className="w-8 h-8 text-destructive" />
        </div>
        
        <div className="space-y-2">
            <h2 className="text-2xl font-bold text-foreground">视频加载失败</h2>
            <p className="text-muted-foreground text-sm">
                抱歉，我们无法加载此视频。可能是因为网络问题或视频已被删除。
            </p>
        </div>

        <div className="flex gap-4 justify-center">
            <Button 
                onClick={reset}
                variant="outline"
                className="border-border hover:bg-accent text-foreground gap-2"
            >
                <RefreshCcw className="w-4 h-4" />
                重试
            </Button>
            <Link href="/explore">
                <Button className="bg-blue-600 hover:bg-blue-700">
                    去发现更多
                </Button>
            </Link>
        </div>
        
        {process.env.NODE_ENV === 'development' && (
            <div className="mt-4 p-4 bg-muted rounded text-left overflow-auto max-h-32 text-xs font-mono text-destructive">
                {error.message}
            </div>
        )}
      </div>
    </div>
  )
}
