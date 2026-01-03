"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { AlertCircle, ChevronRight, FileText, HeadphonesIcon, Send, UploadCloud } from "lucide-react"

export function ServiceDialogContent() {
    return (
        <>
            <div className="bg-primary p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary-foreground flex items-center justify-center text-primary font-bold text-lg">
                        光
                    </div>
                    <div>
                        <h3 className="font-bold text-primary-foreground">光子</h3>
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
                <ScrollArea className="flex-1 p-4">
                    <div className="flex gap-3 mb-4">
                        <div className="w-8 h-8 rounded-full bg-teal-600 flex items-center justify-center text-white text-xs shrink-0">
                            光
                        </div>
                        <div className="bg-card text-foreground p-3 rounded-lg rounded-tl-none shadow-sm max-w-[85%] text-sm">
                            <p>您好，我是AI客服光子，很高兴为您服务，请问有什么可以帮助您的吗？</p>
                        </div>
                    </div>
                    
                    <div className="bg-card rounded-lg p-2 shadow-sm ml-11 mb-4">
                        <p className="text-xs font-bold text-foreground mb-2 px-2">请选择您要咨询的业务</p>
                        <div className="flex flex-col">
                            {[
                                "操作员（子账号重构版）",
                                "公对公充值/打款/转账",
                                "升级授权/批量升级授权",
                                "怎么开发票（普票专票）",
                                "重开发票",
                                "有套餐/企业会员/包年包月的优惠活动吗？"
                            ].map((item, i) => (
                                <button key={i} className="flex items-center justify-between p-2 text-sm text-muted-foreground hover:bg-muted rounded text-left group transition-colors">
                                    <span>{item}</span>
                                    <ChevronRight className="h-3 w-3 text-muted-foreground group-hover:text-foreground" />
                                </button>
                            ))}
                            <button className="flex items-center justify-center p-2 text-xs text-muted-foreground hover:text-teal-600 gap-1 mt-1 border-t border-border">
                                <UploadCloud className="w-3 h-3" /> 换一批
                            </button>
                        </div>
                    </div>
                    
                    <div className="flex justify-center mb-4">
                        <Button variant="outline" size="sm" className="bg-card text-muted-foreground hover:bg-muted border-border rounded-full h-8 text-xs shadow-sm">
                            <HeadphonesIcon className="w-3 h-3 mr-1" />
                            转人工
                        </Button>
                    </div>
                </ScrollArea>
                
                <div className="p-3 bg-card border-t border-border">
                    <div className="relative">
                        <Input 
                            placeholder="请简短描述您的问题" 
                            className="pr-10 bg-muted border-none focus-visible:ring-0 text-foreground placeholder:text-muted-foreground"
                        />
                        <div className="flex items-center gap-2 absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground">
                           <Button size="icon" variant="ghost" className="h-6 w-6 hover:text-teal-600">
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
