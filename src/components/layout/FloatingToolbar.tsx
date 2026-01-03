"use client"

import { useState, useEffect } from "react"
import { usePathname } from "next/navigation"
import { ShoppingCart, HeadphonesIcon, Ticket, X, Send, ChevronRight, FileText, UploadCloud, AlertCircle, ArrowUp } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetClose } from "@/components/ui/sheet"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { toast } from "sonner"
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
                            className="h-12 w-12 rounded-full shadow-lg bg-white hover:bg-gray-100 text-gray-800 border border-gray-200 transition-transform group-hover:scale-110"
                        >
                            <ShoppingCart className="h-5 w-5" />
                        </Button>
                        <span className="absolute right-14 bg-black/80 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                            购物车
                        </span>
                    </div>
                </SheetTrigger>
                <SheetContent className="w-full sm:max-w-md bg-[#0f172a] border-white/10 text-white p-0">
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
                            className="h-12 w-12 rounded-full shadow-lg bg-white hover:bg-gray-100 text-gray-800 border border-gray-200 transition-transform group-hover:scale-110"
                        >
                            <HeadphonesIcon className="h-5 w-5" />
                        </Button>
                        <span className="absolute right-14 bg-black/80 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                            联系客服
                        </span>
                    </div>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[400px] bg-[#0f172a] border-white/10 text-white p-0 overflow-hidden gap-0">
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
                            className="h-12 w-12 rounded-full shadow-lg bg-white hover:bg-gray-100 text-gray-800 border border-gray-200 transition-transform group-hover:scale-110"
                        >
                            <Ticket className="h-5 w-5" />
                        </Button>
                        <span className="absolute right-14 bg-black/80 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                            反馈工单
                        </span>
                    </div>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[600px] bg-[#0f172a] border-white/10 text-white">
                    <TicketDialogContent onClose={() => setTicketOpen(false)} />
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
                    <span className="absolute right-14 bg-black/80 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
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
            <div className="flex items-center justify-between p-4 border-b border-white/10">
                <div className="flex items-center gap-4 text-sm font-medium">
                    <span className="text-white border-b-2 border-white pb-4 -mb-4.5 cursor-pointer">视频 0</span>
                    <span className="text-gray-500 cursor-pointer hover:text-gray-300 transition-colors">图片 0</span>
                    <span className="text-gray-500 cursor-pointer hover:text-gray-300 transition-colors">音乐 0</span>
                </div>
                <Button variant="ghost" size="icon" onClick={onClose} className="text-gray-400 hover:text-white">
                    <X className="h-4 w-4" />
                </Button>
            </div>

            <div className="flex-1 flex flex-col items-center justify-center text-gray-500 gap-4">
                <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center">
                    <ShoppingCart className="h-8 w-8 opacity-50" />
                </div>
                <p>暂无数据</p>
            </div>

            <div className="p-4 border-t border-white/10 bg-[#020817]/50">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded border border-white/20" />
                        <span className="text-sm text-gray-400">全选</span>
                    </div>
                    <div className="flex gap-2">
                         <Button disabled variant="outline" className="border-white/10 text-gray-500">
                            修改授权
                         </Button>
                         <Button disabled className="bg-white/10 text-gray-500">
                            删除
                         </Button>
                    </div>
                </div>
            </div>
        </div>
    )
}

function ServiceDialogContent() {
    return (
        <>
            <div className="bg-gradient-to-r from-teal-500 to-teal-600 p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-teal-600 font-bold text-lg">
                        光
                    </div>
                    <div>
                        <h3 className="font-bold text-white">光子</h3>
                        <p className="text-xs text-teal-100">AI客服在线时间 9:00-22:00</p>
                    </div>
                </div>
                <div className="flex gap-2 text-white/80">
                    <Button variant="ghost" size="icon" className="hover:bg-white/10 hover:text-white">
                        <AlertCircle className="h-5 w-5" />
                    </Button>
                </div>
            </div>
            
            <div className="h-[400px] flex flex-col bg-[#f0f2f5]">
                <ScrollArea className="flex-1 p-4">
                    <div className="flex gap-3 mb-4">
                        <div className="w-8 h-8 rounded-full bg-teal-600 flex items-center justify-center text-white text-xs shrink-0">
                            光
                        </div>
                        <div className="bg-white text-gray-800 p-3 rounded-lg rounded-tl-none shadow-sm max-w-[85%] text-sm">
                            <p>您好，我是AI客服光子，很高兴为您服务，请问有什么可以帮助您的吗？</p>
                        </div>
                    </div>
                    
                    <div className="bg-white rounded-lg p-2 shadow-sm ml-11 mb-4">
                        <p className="text-xs font-bold text-gray-900 mb-2 px-2">请选择您要咨询的业务</p>
                        <div className="flex flex-col">
                            {[
                                "操作员（子账号重构版）",
                                "公对公充值/打款/转账",
                                "升级授权/批量升级授权",
                                "怎么开发票（普票专票）",
                                "重开发票",
                                "有套餐/企业会员/包年包月的优惠活动吗？"
                            ].map((item, i) => (
                                <button key={i} className="flex items-center justify-between p-2 text-sm text-gray-600 hover:bg-gray-50 rounded text-left group transition-colors">
                                    <span>{item}</span>
                                    <ChevronRight className="h-3 w-3 text-gray-400 group-hover:text-gray-600" />
                                </button>
                            ))}
                            <button className="flex items-center justify-center p-2 text-xs text-gray-400 hover:text-teal-600 gap-1 mt-1 border-t border-gray-100">
                                <UploadCloud className="w-3 h-3" /> 换一批
                            </button>
                        </div>
                    </div>
                    
                    <div className="flex justify-center mb-4">
                        <Button variant="outline" size="sm" className="bg-white text-gray-600 hover:bg-gray-50 border-gray-200 rounded-full h-8 text-xs shadow-sm">
                            <HeadphonesIcon className="w-3 h-3 mr-1" />
                            转人工
                        </Button>
                    </div>
                </ScrollArea>
                
                <div className="p-3 bg-white border-t border-gray-200">
                    <div className="relative">
                        <Input 
                            placeholder="请简短描述您的问题" 
                            className="pr-10 bg-gray-50 border-none focus-visible:ring-0 text-gray-800 placeholder:text-gray-400"
                        />
                        <div className="flex items-center gap-2 absolute right-2 top-1/2 -translate-y-1/2 text-gray-400">
                           <Button size="icon" variant="ghost" className="h-6 w-6 hover:text-teal-600">
                                <Send className="h-4 w-4" />
                           </Button>
                        </div>
                    </div>
                    <div className="flex gap-4 mt-2 px-1">
                        <Button variant="ghost" size="icon" className="h-6 w-6 text-gray-400 hover:text-gray-600">
                            <FileText className="h-4 w-4" />
                        </Button>
                         <Button variant="ghost" size="icon" className="h-6 w-6 text-gray-400 hover:text-gray-600">
                            <UploadCloud className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </div>
        </>
    )
}

function TicketDialogContent({ onClose }: { onClose: () => void }) {
    return (
        <>
            <DialogHeader>
                <DialogTitle className="text-center text-xl">反馈工单</DialogTitle>
            </DialogHeader>
            <div className="py-4">
                <div className="text-center text-sm text-gray-400 mb-6">
                    <p>尊敬的用户您好，我们非常重视您的反馈，将尽快给您回复，有价值的反馈将获得奖励</p>
                    <div className="flex justify-center gap-4 mt-2">
                        <a href="#" className="text-blue-400 hover:underline">奖励说明</a>
                        <a href="#" className="text-blue-400 hover:underline">工单记录</a>
                    </div>
                </div>

                <div className="flex justify-center gap-8 mb-6">
                    <RadioGroup defaultValue="bug" className="flex gap-6">
                        <div className="flex items-center space-x-2">
                            <RadioGroupItem value="bug" id="bug" className="border-blue-500 text-blue-500" />
                            <Label htmlFor="bug" className="cursor-pointer">BUG反馈</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <RadioGroupItem value="other" id="other" className="border-gray-500" />
                            <Label htmlFor="other" className="cursor-pointer">其他类</Label>
                        </div>
                    </RadioGroup>
                </div>

                <div className="space-y-4">
                    <Textarea 
                        placeholder="请准确描述您的反馈" 
                        className="min-h-[150px] bg-white/5 border-white/10 resize-none focus:border-blue-500"
                    />
                    
                    <div className="text-xs text-gray-500 text-center">
                        如需针对某个素材发起工单，可前往播放页或购买记录页点击“举报”或“售后”
                        <br />
                        如对于平台有新的想法与建议，可参加 <span className="text-blue-400 cursor-pointer">【提建议，得奖励】</span> 活动
                    </div>
                </div>
            </div>
            <DialogFooter className="sm:justify-center">
                <Button 
                    className="w-full sm:w-1/3 bg-white text-black hover:bg-gray-200 rounded-full"
                    onClick={() => {
                        toast.success("工单已提交")
                        onClose()
                    }}
                >
                    提交
                </Button>
            </DialogFooter>
        </>
    )
}
