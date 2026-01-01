"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Plus, Pencil, Trash2, Search, BookOpen } from "lucide-react"
import Link from "next/link"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"

export default function AdminCoursesPage() {
  const [courses, setCourses] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")

  useEffect(() => {
    fetchCourses()
  }, [])

  const fetchCourses = async () => {
    setLoading(true)
    try {
      let query = supabase
        .from('courses')
        .select('*')
        .order('created_at', { ascending: false })

      if (search) {
        query = query.ilike('title', `%${search}%`)
      }

      const { data, error } = await query

      if (error) throw error
      setCourses(data || [])
    } catch (error) {
      console.error("Error fetching courses:", error)
      toast.error("获取课程列表失败")
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm("确定要删除这个课程吗？此操作不可恢复。")) return

    try {
      const { error } = await supabase
        .from('courses')
        .delete()
        .eq('id', id)

      if (error) throw error

      toast.success("课程已删除")
      setCourses(courses.filter(c => c.id !== id))
    } catch (error) {
      console.error("Error deleting course:", error)
      toast.error("删除失败")
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">课程管理</h1>
          <p className="text-gray-400 mt-2">管理平台的在线课程内容</p>
        </div>
        <Link href="/admin/courses/create">
          <Button className="bg-blue-600 hover:bg-blue-700">
            <Plus className="w-4 h-4 mr-2" />
            发布新课程
          </Button>
        </Link>
      </div>

      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input 
            placeholder="搜索课程标题..." 
            className="pl-10 bg-white/5 border-white/10"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && fetchCourses()}
          />
        </div>
        <Button variant="outline" onClick={fetchCourses}>搜索</Button>
      </div>

      {loading ? (
        <div className="text-center py-20">加载中...</div>
      ) : courses.length === 0 ? (
        <div className="text-center py-20 bg-white/5 rounded-xl border border-white/10">
          <BookOpen className="w-12 h-12 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-400">暂无课程</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {courses.map((course) => (
            <Card key={course.id} className="bg-white/5 border-white/10">
              <CardContent className="p-6 flex items-center gap-6">
                <img 
                  src={course.image_url} 
                  alt={course.title} 
                  className="w-32 h-20 object-cover rounded-lg bg-gray-800"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-bold">{course.title}</h3>
                    <Badge variant="secondary" className="bg-blue-500/10 text-blue-400 border-blue-500/20">
                      {course.level}
                    </Badge>
                    <span className="text-sm text-gray-500">
                      {course.price > 0 ? `¥${course.price}` : '免费'}
                    </span>
                  </div>
                  <div className="flex gap-4 text-sm text-gray-400">
                    <span>讲师: {course.instructor}</span>
                    <span>时长: {course.duration}</span>
                    <span>学员: {course.students_count}</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Link href={`/admin/courses/${course.id}`}>
                    <Button variant="ghost" size="icon" className="hover:text-blue-400">
                      <Pencil className="w-4 h-4" />
                    </Button>
                  </Link>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="hover:text-red-400"
                    onClick={() => handleDelete(course.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
