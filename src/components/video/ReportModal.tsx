"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { supabase } from "@/lib/supabase"
import { toast } from "sonner"
import { AlertTriangle } from "lucide-react"

interface ReportModalProps {
  isOpen: boolean
  onClose: () => void
  resourceId: string | number // Video ID or Comment ID
  resourceType: 'video' | 'comment'
}

const REPORT_REASONS = [
  { id: 'spam', label: '垃圾广告 / Spam' },
  { id: 'inappropriate', label: '不当内容 / Inappropriate Content' },
  { id: 'copyright', label: '侵犯版权 / Copyright Infringement' },
  { id: 'violence', label: '暴力或血腥 / Violence' },
  { id: 'other', label: '其他 / Other' },
]

export function ReportModal({ isOpen, onClose, resourceId, resourceType }: ReportModalProps) {
  const [reason, setReason] = useState("spam")
  const [details, setDetails] = useState("")
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async () => {
    setSubmitting(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        toast.error("请先登录")
        return
      }

      const reportData: any = {
        reporter_id: user.id,
        reason: `${REPORT_REASONS.find(r => r.id === reason)?.label} - ${details}`,
        status: 'pending'
      }

      if (resourceType === 'video') {
        reportData.video_id = resourceId
      } else {
        reportData.comment_id = resourceId
      }

      const { error } = await supabase
        .from('reports')
        .insert(reportData)

      if (error) throw error

      toast.success("举报已提交，我们会尽快处理")
      onClose()
      setDetails("")
      setReason("spam")
    } catch (error: any) {
      console.error("Report error:", error)
      toast.error("提交失败: " + error.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="bg-[#0f172a] border-white/10 text-white sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-400">
            <AlertTriangle className="w-5 h-5" />
            举报{resourceType === 'video' ? '视频' : '评论'}
          </DialogTitle>
          <DialogDescription className="text-gray-400">
            请选择举报原因，帮助我们维护社区环境。
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="space-y-3">
            <Label>举报原因</Label>
            <RadioGroup value={reason} onValueChange={setReason} className="gap-2">
              {REPORT_REASONS.map((r) => (
                <div key={r.id} className="flex items-center space-x-2">
                  <RadioGroupItem value={r.id} id={r.id} className="border-white/20 text-blue-500" />
                  <Label htmlFor={r.id} className="font-normal cursor-pointer">{r.label}</Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          <div className="space-y-2">
            <Label htmlFor="details">详细说明 (可选)</Label>
            <Textarea
              id="details"
              placeholder="请提供更多细节..."
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              className="bg-black/20 border-white/10 min-h-[100px]"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={onClose} disabled={submitting} className="hover:bg-white/10 hover:text-white">
            取消
          </Button>
          <Button onClick={handleSubmit} disabled={submitting} className="bg-red-600 hover:bg-red-700 text-white">
            {submitting ? "提交中..." : "提交举报"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
