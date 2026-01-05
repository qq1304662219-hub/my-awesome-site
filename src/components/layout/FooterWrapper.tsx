"use client"

import { usePathname } from "next/navigation"
import { Footer } from "@/components/landing/Footer"

export function FooterWrapper() {
  const pathname = usePathname()
  
  return <Footer />
}
