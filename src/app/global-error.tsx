"use client"

import { useEffect } from "react"
import { Button } from "@/components/ui/button"

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
        <div className="text-center p-8">
          <h2 className="text-3xl font-bold mb-4">Something went wrong!</h2>
          <p className="text-gray-400 mb-8">
            Critical error occurred. We apologize for the inconvenience.
          </p>
          <Button onClick={() => reset()} variant="secondary">
            Try again
          </Button>
        </div>
      </body>
    </html>
  )
}
