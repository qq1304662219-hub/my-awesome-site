"use client"

import { Button } from "@/components/ui/button"
import { DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"

interface FeedbackDialogContentProps {
    onClose: () => void
}

export function FeedbackDialogContent({ onClose }: FeedbackDialogContentProps) {
    return (
        <>
            <DialogHeader>
                <DialogTitle className="text-center text-xl">反馈工单</DialogTitle>
            </DialogHeader>
            <div className="py-4">
                <div className="text-center text-sm text-muted-foreground mb-6">
                    <p>尊敬的用户您好，我们非常重视您的反馈，将尽快给您回复，有价值的反馈将获得奖励</p>
                    <div className="flex justify-center gap-4 mt-2">
                        <a href="#" className="text-blue-500 hover:underline">奖励说明</a>
                        <a href="#" className="text-blue-500 hover:underline">工单记录</a>
                    </div>
                </div>

                <div className="flex justify-center gap-8 mb-6">
                    <RadioGroup defaultValue="bug" className="flex gap-6">
                        <div className="flex items-center space-x-2">
                            <RadioGroupItem value="bug" id="bug" className="border-blue-500 text-blue-500" />
                            <Label htmlFor="bug" className="cursor-pointer">BUG反馈</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <RadioGroupItem value="other" id="other" className="border-muted-foreground" />
                            <Label htmlFor="other" className="cursor-pointer">其他类</Label>
                        </div>
                    </RadioGroup>
                </div>

                <div className="space-y-4">
                    <Textarea 
                        placeholder="请准确描述您的反馈" 
                        className="min-h-[150px] bg-muted border-border resize-none focus:border-blue-500"
                    />
                    
                    <div className="text-xs text-muted-foreground text-center">
                        如需针对某个素材发起工单，可前往播放页或购买记录页点击“举报”或“售后”
                        <br />
                        如对于平台有新的想法与建议，可参加 <span className="text-blue-500 cursor-pointer">【提建议，得奖励】</span> 活动
                    </div>
                </div>
            </div>
            <DialogFooter className="sm:justify-center">
                <Button 
                    className="w-full sm:w-1/3 bg-primary text-primary-foreground hover:bg-primary/90 rounded-full"
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
