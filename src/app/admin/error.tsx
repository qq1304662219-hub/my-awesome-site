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
    console.error(error)
  }, [error])

  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
      <div className="p-4 bg-destructive/10 rounded-full">
        <AlertTriangle className="w-12 h-12 text-destructive" />
      </div>
      <h2 className="text-xl font-bold text-foreground">管理后台出错</h2>
      <p className="text-muted-foreground text-center max-w-md">
        加载管理页面时遇到问题。
      </p>
      <div className="p-4 bg-muted/50 rounded border border-border text-xs font-mono text-destructive max-w-lg break-all">
          {error.message}
      </div>
      <Button
        onClick={reset}
        variant="outline"
        className="border-border hover:bg-muted text-muted-foreground"
      >
        重试
      </Button>
    </div>
  )
}
