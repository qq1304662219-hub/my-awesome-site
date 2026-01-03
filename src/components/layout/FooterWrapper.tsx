"use client"

import { usePathname } from "next/navigation"
import { Footer } from "@/components/landing/Footer"

export function FooterWrapper() {
  const pathname = usePathname()
  
  // Don't show footer on homepage
  if (pathname === "/") {
    return null
  }

  return <Footer />
}
