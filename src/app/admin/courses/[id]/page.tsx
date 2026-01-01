"use client"

import { CourseForm } from "@/components/admin/CourseForm"
import { supabase } from "@/lib/supabase"
import { useEffect, useState } from "react"
import { toast } from "sonner"

export default function EditCoursePage({ params }: { params: { id: string } }) {
  const [course, setCourse] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchCourse()
  }, [])

  const fetchCourse = async () => {
    try {
      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .eq('id', params.id)
        .single()

      if (error) throw error
      setCourse(data)
    } catch (error) {
      console.error(error)
      toast.error("获取课程信息失败")
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <div>加载中...</div>
  if (!course) return <div>课程不存在</div>

  return <CourseForm mode="edit" initialData={course} />
}
