"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { supabase } from "@/lib/supabase"
import { useRouter } from "next/navigation"

interface CourseEnrollButtonProps {
  courseId: number
  price: number
  isEnrolled: boolean
}

export function CourseEnrollButton({ courseId, price, isEnrolled }: CourseEnrollButtonProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [enrolled, setEnrolled] = useState(isEnrolled)

  const handleEnroll = async () => {
    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        toast.error("请先登录")
        router.push("/auth")
        return
      }

      if (price > 0) {
        if (!confirm(`确定要支付 ¥${price} 购买此课程吗？`)) {
            setLoading(false)
            return
        }
      }

      const { error } = await supabase.rpc('enroll_course', {
        p_course_id: courseId
      })

      if (error) {
          if (error.message.includes('Insufficient balance')) {
              toast.error("余额不足，请前往财务中心充值")
          } else {
              toast.error("报名失败: " + error.message)
          }
          throw error
      }

      toast.success("报名成功！")
      setEnrolled(true)
      router.refresh()
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  if (enrolled) {
    return (
      <Button className="w-full bg-green-600 hover:bg-green-700 py-6 text-lg" disabled>
        已报名
      </Button>
    )
  }

  return (
    <Button 
      onClick={handleEnroll} 
      disabled={loading}
      className="w-full bg-blue-600 hover:bg-blue-700 py-6 text-lg"
    >
      {loading ? "处理中..." : (price > 0 ? "立即购买" : "免费报名")}
    </Button>
  )
}
