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
      <div className="p-4 bg-red-500/10 rounded-full">
        <AlertTriangle className="w-12 h-12 text-red-500" />
      </div>
      <h2 className="text-xl font-bold text-white">管理后台出错</h2>
      <p className="text-gray-400 text-center max-w-md">
        加载管理页面时遇到问题。
      </p>
      <div className="p-4 bg-black/30 rounded border border-white/10 text-xs font-mono text-red-400 max-w-lg break-all">
          {error.message}
      </div>
      <Button
        onClick={reset}
        variant="outline"
        className="border-white/10 hover:bg-white/10 text-white"
      >
        重试
      </Button>
    </div>
  )
}
