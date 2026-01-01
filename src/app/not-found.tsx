import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function NotFound() {
  return (
    <div className="bg-[#020817] text-white min-h-screen flex flex-col items-center justify-center p-4">
      <h2 className="text-6xl font-bold mb-4 text-blue-500">404</h2>
      <h3 className="text-2xl font-semibold mb-6">Page Not Found</h3>
      <p className="text-gray-400 mb-8 text-center max-w-md">
        The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.
      </p>
      <Link href="/">
        <Button variant="secondary" size="lg">
          Return Home
        </Button>
      </Link>
    </div>
  )
}
