"use client"

import { useState, useEffect } from "react"
import { usePathname } from "next/navigation"
import { ShoppingCart, HeadphonesIcon, Ticket, X, ArrowUp } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog"
import { ServiceDialogContent } from "@/components/shared/ServiceDialogContent"
import { FeedbackDialogContent } from "@/components/shared/FeedbackDialogContent"
import { cn } from "@/lib/utils"

export function FloatingToolbar() {
    const pathname = usePathname()
    const [isMounted, setIsMounted] = useState(false)
    const [cartOpen, setCartOpen] = useState(false)
    const [serviceOpen, setServiceOpen] = useState(false)
    const [ticketOpen, setTicketOpen] = useState(false)
    const [showScrollTop, setShowScrollTop] = useState(false)

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
                            className="h-12 w-12 rounded-full shadow-lg bg-card hover:bg-accent text-foreground border border-border transition-transform group-hover:scale-110"
                        >
                            <ShoppingCart className="h-5 w-5" />
                        </Button>
                        <span className="absolute right-14 bg-foreground text-background text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                            购物车
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

function CartDrawerContent({ onClose }: { onClose: () => void }) {
    // Mock cart items
    const cartItems: any[] = [] // Empty for now to match "暂无数据" in reference image

    return (
        <div className="flex flex-col h-full">
            <div className="flex items-center justify-between p-4 border-b border-border">
                <div className="flex items-center gap-4 text-sm font-medium">
                    <span className="text-foreground border-b-2 border-foreground pb-4 -mb-4.5 cursor-pointer">视频 0</span>
                    <span className="text-muted-foreground cursor-pointer hover:text-foreground transition-colors">图片 0</span>
                    <span className="text-muted-foreground cursor-pointer hover:text-foreground transition-colors">音乐 0</span>
                </div>
                <Button variant="ghost" size="icon" onClick={onClose} className="text-muted-foreground hover:text-foreground">
                    <X className="h-4 w-4" />
                </Button>
            </div>

            <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground gap-4">
                <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center">
                    <ShoppingCart className="h-8 w-8 opacity-50" />
                </div>
                <p>暂无数据</p>
            </div>

            <div className="p-4 border-t border-border bg-muted/50">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded border border-border" />
                        <span className="text-sm text-muted-foreground">全选</span>
                    </div>
                    <div className="flex gap-2">
                         <Button disabled variant="outline" className="border-border text-muted-foreground">
                            修改授权
                         </Button>
                         <Button disabled className="bg-muted text-muted-foreground">
                            删除
                         </Button>
                    </div>
                </div>
            </div>
        </div>
    )
}
