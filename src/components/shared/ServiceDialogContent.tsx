"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { AlertCircle, ChevronRight, FileText, HeadphonesIcon, Send, UploadCloud, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  createdAt: number
}

const INITIAL_MESSAGE: Message = {
  id: 'init-1',
  role: 'assistant',
  content: '您好，我是AI客服小二，很高兴为您服务，请问有什么可以帮助您的吗？',
  createdAt: Date.now()
}

const COMMON_QUESTIONS = [
  "操作员（子账号重构版）",
  "公对公充值/打款/转账",
  "升级授权/批量升级授权",
  "怎么开发票（普票专票）",
  "重开发票",
  "有套餐/企业会员/包年包月的优惠活动吗？"
]

export function ServiceDialogContent() {
    const [messages, setMessages] = useState<Message[]>([INITIAL_MESSAGE])
    const [input, setInput] = useState("")
    const [isLoading, setIsLoading] = useState(false)
    const scrollRef = useRef<HTMLDivElement>(null)
    const endRef = useRef<HTMLDivElement>(null)

    const scrollToBottom = () => {
        endRef.current?.scrollIntoView({ behavior: "smooth" })
    }

    useEffect(() => {
        scrollToBottom()
    }, [messages])

    const handleSend = async (text: string = input) => {
        if (!text.trim() || isLoading) return

        const userMsg: Message = {
            id: Date.now().toString(),
            role: 'user',
            content: text,
            createdAt: Date.now()
        }

        setMessages(prev => [...prev, userMsg])
        setInput("")
        setIsLoading(true)

        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: text })
            })

            const data = await response.json()
            
            const aiMsg: Message = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: data.response || "抱歉，我暂时无法回答这个问题，请尝试咨询人工客服。",
                createdAt: Date.now()
            }
            
            setMessages(prev => [...prev, aiMsg])
        } catch (error) {
            console.error('Chat error:', error)
            const errorMsg: Message = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: "网络连接异常，请稍后重试。",
                createdAt: Date.now()
            }
            setMessages(prev => [...prev, errorMsg])
        } finally {
            setIsLoading(false)
        }
    }

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            handleSend()
        }
    }

    return (
        <>
            <div className="bg-primary p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary-foreground flex items-center justify-center text-primary font-bold text-lg">
                        小
                    </div>
                    <div>
                        <h3 className="font-bold text-primary-foreground">小二</h3>
                        <p className="text-xs text-primary-foreground/80">AI客服在线时间 9:00-22:00</p>
                    </div>
                </div>
                <div className="flex gap-2 text-primary-foreground/80">
                    <Button variant="ghost" size="icon" className="hover:bg-primary-foreground/10 hover:text-primary-foreground">
                        <AlertCircle className="h-5 w-5" />
                    </Button>
                </div>
            </div>
            
            <div className="h-[400px] flex flex-col bg-muted/30">
                <ScrollArea className="flex-1 p-4" ref={scrollRef}>
                    <div className="flex flex-col gap-4">
                        {messages.map((msg) => (
                            <div key={msg.id} className={cn("flex gap-3", msg.role === 'user' ? "flex-row-reverse" : "")}>
                                <div className={cn(
                                    "w-8 h-8 rounded-full flex items-center justify-center text-xs shrink-0",
                                    msg.role === 'assistant' ? "bg-teal-600 text-white" : "bg-blue-600 text-white"
                                )}>
                                    {msg.role === 'assistant' ? '小' : '我'}
                                </div>
                                <div className={cn(
                                    "p-3 rounded-lg shadow-sm max-w-[85%] text-sm break-words",
                                    msg.role === 'assistant' 
                                        ? "bg-card text-foreground rounded-tl-none" 
                                        : "bg-blue-600 text-white rounded-tr-none"
                                )}>
                                    <p>{msg.content}</p>
                                </div>
                            </div>
                        ))}
                        
                        {isLoading && (
                            <div className="flex gap-3">
                                <div className="w-8 h-8 rounded-full bg-teal-600 flex items-center justify-center text-white text-xs shrink-0">
                                    小
                                </div>
                                <div className="bg-card p-3 rounded-lg rounded-tl-none shadow-sm">
                                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                                </div>
                            </div>
                        )}
                        
                        {/* Show suggestions only if the last message is from assistant */}
                        {messages[messages.length - 1]?.role === 'assistant' && !isLoading && (
                            <div className="bg-card rounded-lg p-2 shadow-sm ml-11 mb-2">
                                <p className="text-xs font-bold text-foreground mb-2 px-2">猜你想问</p>
                                <div className="flex flex-col">
                                    {COMMON_QUESTIONS.map((item, i) => (
                                        <button 
                                            key={i} 
                                            onClick={() => handleSend(item)}
                                            className="flex items-center justify-between p-2 text-sm text-muted-foreground hover:bg-muted rounded text-left group transition-colors"
                                        >
                                            <span>{item}</span>
                                            <ChevronRight className="h-3 w-3 text-muted-foreground group-hover:text-foreground" />
                                        </button>
                                    ))}
                                    <button className="flex items-center justify-center p-2 text-xs text-muted-foreground hover:text-teal-600 gap-1 mt-1 border-t border-border">
                                        <UploadCloud className="w-3 h-3" /> 换一批
                                    </button>
                                </div>
                            </div>
                        )}
                        <div ref={endRef} />
                    </div>
                </ScrollArea>
                
                <div className="flex justify-center mb-2 px-4">
                    <Button variant="outline" size="sm" className="bg-card text-muted-foreground hover:bg-muted border-border rounded-full h-8 text-xs shadow-sm w-full">
                        <HeadphonesIcon className="w-3 h-3 mr-1" />
                        转人工客服
                    </Button>
                </div>
                
                <div className="p-3 bg-card border-t border-border">
                    <div className="relative">
                        <Input 
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="请简短描述您的问题..." 
                            className="pr-10 bg-muted border-none focus-visible:ring-0 text-foreground placeholder:text-muted-foreground"
                            disabled={isLoading}
                        />
                        <div className="flex items-center gap-2 absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground">
                           <Button 
                                size="icon" 
                                variant="ghost" 
                                className="h-6 w-6 hover:text-teal-600"
                                onClick={() => handleSend()}
                                disabled={!input.trim() || isLoading}
                            >
                                <Send className="h-4 w-4" />
                           </Button>
                        </div>
                    </div>
                    <div className="flex gap-4 mt-2 px-1">
                        <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-foreground">
                            <FileText className="h-4 w-4" />
                        </Button>
                         <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-foreground">
                            <UploadCloud className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </div>
        </>
    )
}
