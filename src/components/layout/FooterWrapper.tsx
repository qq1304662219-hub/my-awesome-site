"use client"

import { usePathname } from "next/navigation"
import { Footer } from "@/components/layout/Footer"

export function FooterWrapper() {
  const pathname = usePathname()
  
  // Don't show footer on homepage
  if (pathname === "/") {
    return null
  }

  return <Footer />
}
