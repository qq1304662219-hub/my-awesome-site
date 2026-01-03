"use client"

import { useState, useEffect } from "react"
import { usePathname } from "next/navigation"
import { ShoppingCart, HeadphonesIcon, Ticket, ArrowUp } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog"
import { ServiceDialogContent } from "@/components/shared/ServiceDialogContent"
import { FeedbackDialogContent } from "@/components/shared/FeedbackDialogContent"
import { useCartStore } from "@/store/useCartStore"

import { CartDrawerContent } from "@/components/cart/CartDrawerContent"

export function FloatingToolbar() {
    const pathname = usePathname()
    const [isMounted, setIsMounted] = useState(false)
    const [cartOpen, setCartOpen] = useState(false)
    const [serviceOpen, setServiceOpen] = useState(false)
    const [ticketOpen, setTicketOpen] = useState(false)
    const [showScrollTop, setShowScrollTop] = useState(false)
    const cartCount = useCartStore((state) => state.count)

    // Prevent hydration mismatch
    useEffect(() => {
        setIsMounted(true)

        const handleScroll = () => {
            setShowScrollTop(window.scrollY > 400)
        }

        window.addEventListener('scroll', handleScroll)
        return () => window.removeEventListener('scroll', handleScroll)
    }, [])

    const scrollToTop = () => {
        window.scrollTo({ top: 0, behavior: 'smooth' })
    }

    if (!isMounted) return null

    // Only show on non-home pages
    // Adjust logic as needed. The user said "entering video material section".
    // We'll hide it on the homepage ('/') and show on others.
    // If we want to be more specific (e.g. only /explore and /video/*), we can do:
    // const showToolbar = pathname?.startsWith('/explore') || pathname?.startsWith('/video')
    // For now, "not home" is a safe bet based on "首页不展示".
    const showToolbar = pathname !== '/'

    if (!showToolbar) return null

    return (
        <div className="fixed bottom-20 right-6 z-50 flex flex-col gap-3">
            {/* Cart Button */}
            <Sheet open={cartOpen} onOpenChange={setCartOpen}>
                <SheetTrigger asChild>
                    <div className="group relative flex items-center justify-end">
                        <Button 
                            variant="secondary" 
                            size="icon" 
                            className="h-12 w-12 rounded-full shadow-lg bg-card hover:bg-accent text-foreground border border-border transition-transform group-hover:scale-110 relative"
                        >
                            <ShoppingCart className="h-5 w-5" />
                            {cartCount > 0 && (
                                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] h-[18px] flex items-center justify-center border-2 border-card">
                                    {cartCount > 99 ? '99+' : cartCount}
                                </span>
                            )}
                        </Button>
                        <span className="absolute right-14 bg-foreground text-background text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                            我的购物车
                        </span>
                    </div>
                </SheetTrigger>
                <SheetContent className="w-full sm:max-w-md bg-background border-border text-foreground p-0">
                    <CartDrawerContent onClose={() => setCartOpen(false)} />
                </SheetContent>
            </Sheet>

            {/* Service Button */}
            <Dialog open={serviceOpen} onOpenChange={setServiceOpen}>
                <DialogTrigger asChild>
                    <div className="group relative flex items-center justify-end">
                        <Button 
                            variant="secondary" 
                            size="icon" 
                            className="h-12 w-12 rounded-full shadow-lg bg-card hover:bg-accent text-foreground border border-border transition-transform group-hover:scale-110"
                        >
                            <HeadphonesIcon className="h-5 w-5" />
                        </Button>
                        <span className="absolute right-14 bg-foreground text-background text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                            在线客服
                        </span>
                    </div>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[400px] bg-background border-border text-foreground p-0 overflow-hidden gap-0">
                    <ServiceDialogContent />
                </DialogContent>
            </Dialog>

            {/* Ticket Button */}
            <Dialog open={ticketOpen} onOpenChange={setTicketOpen}>
                <DialogTrigger asChild>
                    <div className="group relative flex items-center justify-end">
                        <Button 
                            variant="secondary" 
                            size="icon" 
                            className="h-12 w-12 rounded-full shadow-lg bg-card hover:bg-accent text-foreground border border-border transition-transform group-hover:scale-110"
                        >
                            <Ticket className="h-5 w-5" />
                        </Button>
                        <span className="absolute right-14 bg-foreground text-background text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                            反馈工单
                        </span>
                    </div>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[600px] bg-background border-border text-foreground">
                    <FeedbackDialogContent onClose={() => setTicketOpen(false)} />
                </DialogContent>
            </Dialog>

            {/* Scroll To Top */}
            <div className={`transition-all duration-300 ${showScrollTop ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10 pointer-events-none'}`}>
                <div className="group relative flex items-center justify-end">
                    <Button 
                        variant="secondary" 
                        size="icon" 
                        className="h-12 w-12 rounded-full shadow-lg bg-primary hover:bg-primary/90 text-primary-foreground border border-primary/20 transition-transform group-hover:scale-110"
                        onClick={scrollToTop}
                    >
                        <ArrowUp className="h-5 w-5" />
                    </Button>
                    <span className="absolute right-14 bg-foreground text-background text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                        回到顶部
                    </span>
                </div>
            </div>
        </div>
    )
}
