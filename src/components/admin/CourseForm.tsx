"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

interface CourseFormProps {
  initialData?: any
  mode: 'create' | 'edit'
}

export function CourseForm({ initialData, mode }: CourseFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    title: initialData?.title || "",
    description: initialData?.description || "",
    instructor: initialData?.instructor || "",
    duration: initialData?.duration || "",
    level: initialData?.level || "入门",
    price: initialData?.price?.toString() || "0",
    image_url: initialData?.image_url || ""
  })

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.title || !formData.instructor) {
      toast.error("请填写必填项")
      return
    }

    setLoading(true)

    try {
      const payload = {
        title: formData.title,
        description: formData.description,
        instructor: formData.instructor,
        duration: formData.duration,
        level: formData.level,
        price: parseFloat(formData.price) || 0,
        image_url: formData.image_url,
        updated_at: new Date().toISOString()
      }

      let error
      if (mode === 'create') {
        const { error: err } = await supabase
          .from('courses')
          .insert(payload)
        error = err
      } else {
        const { error: err } = await supabase
          .from('courses')
          .update(payload)
          .eq('id', initialData.id)
        error = err
      }

      if (error) throw error

      toast.success(mode === 'create' ? "课程发布成功" : "课程更新成功")
      router.push("/admin/courses")
      router.refresh()
    } catch (error: any) {
      console.error(error)
      toast.error("操作失败: " + error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center gap-4 mb-8">
        <Link href="/admin/courses">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <h1 className="text-2xl font-bold">
          {mode === 'create' ? '发布新课程' : '编辑课程'}
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 bg-white/5 border border-white/10 p-6 rounded-xl">
        <div className="space-y-2">
          <Label>课程标题 *</Label>
          <Input 
            value={formData.title} 
            onChange={(e) => handleChange('title', e.target.value)}
            placeholder="例如：Midjourney 零基础入门"
          />
        </div>

        <div className="space-y-2">
          <Label>课程描述</Label>
          <Textarea 
            value={formData.description} 
            onChange={(e) => handleChange('description', e.target.value)}
            placeholder="课程简介..."
            className="h-32"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>讲师 *</Label>
            <Input 
              value={formData.instructor} 
              onChange={(e) => handleChange('instructor', e.target.value)}
              placeholder="讲师姓名或机构"
            />
          </div>
          <div className="space-y-2">
            <Label>时长</Label>
            <Input 
              value={formData.duration} 
              onChange={(e) => handleChange('duration', e.target.value)}
              placeholder="例如：2小时 30分钟"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>难度等级</Label>
            <Select 
              value={formData.level} 
              onValueChange={(val) => handleChange('level', val)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="入门">入门</SelectItem>
                <SelectItem value="中级">中级</SelectItem>
                <SelectItem value="进阶">进阶</SelectItem>
                <SelectItem value="实战">实战</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>价格 (元)</Label>
            <Input 
              type="number"
              value={formData.price} 
              onChange={(e) => handleChange('price', e.target.value)}
              placeholder="0 为免费"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label>封面图片 URL</Label>
          <Input 
            value={formData.image_url} 
            onChange={(e) => handleChange('image_url', e.target.value)}
            placeholder="https://..."
          />
          {formData.image_url && (
            <img 
              src={formData.image_url} 
              alt="Preview" 
              className="mt-2 h-40 w-full object-cover rounded-lg bg-black/20" 
              onError={(e) => (e.currentTarget.style.display = 'none')}
            />
          )}
        </div>

        <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700" disabled={loading}>
          {loading ? "提交中..." : (mode === 'create' ? "发布课程" : "保存修改")}
        </Button>
      </form>
    </div>
  )
}
