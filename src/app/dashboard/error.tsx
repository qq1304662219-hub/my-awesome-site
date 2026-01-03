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
      <h2 className="text-xl font-bold text-foreground">出错了</h2>
      <p className="text-muted-foreground text-center max-w-md">
        加载仪表板时遇到问题。请稍后再试。
      </p>
      <Button
        onClick={reset}
        variant="outline"
        className="border-border hover:bg-accent hover:text-accent-foreground text-foreground"
      >
        重试
      </Button>
    </div>
  )
}
