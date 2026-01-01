"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { Loader2, Trash2, CheckCircle, XCircle, ExternalLink, MessageSquare, Video } from "lucide-react"
import Link from "next/link"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

export default function AdminReportsPage() {
  const [reports, setReports] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchReports()
  }, [])

  const fetchReports = async () => {
    try {
      const res = await fetch('/api/admin/reports')
      const data = await res.json()

      if (!res.ok) throw new Error(data.error)
      setReports(data.reports || [])
    } catch (error) {
      console.error("Error fetching reports:", error)
      toast.error("加载举报列表失败")
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateStatus = async (id: string, status: string) => {
    try {
      const res = await fetch(`/api/admin/reports/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      })
      const data = await res.json()
      
      if (!res.ok) throw new Error(data.error)
      
      toast.success("状态已更新")
      fetchReports()
    } catch (error) {
      toast.error("更新失败")
    }
  }

  const handleDeleteContent = async (report: any) => {
    if (!confirm("确定要删除这条内容吗？此操作不可恢复。")) return

    try {
      const res = await fetch(`/api/admin/reports/${report.id}`, {
        method: 'DELETE'
      })
      const data = await res.json()

      if (!res.ok) throw new Error(data.error)
      
      toast.success("内容已删除，举报已标记为解决")
      fetchReports()
    } catch (error: any) {
      console.error("Delete error:", error)
      toast.error("删除失败: " + error.message)
    }
  }

  if (loading) {
    return <div className="flex justify-center p-12"><Loader2 className="animate-spin text-blue-500" /></div>
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">举报处理</h1>
        <Badge variant="outline" className="text-gray-400">待处理: {reports.filter(r => r.status === 'pending').length}</Badge>
      </div>

      <div className="bg-[#0B1120] border border-white/10 rounded-xl overflow-hidden">
        <Table>
          <TableHeader className="bg-white/5">
            <TableRow className="border-white/10 hover:bg-transparent">
              <TableHead className="text-gray-400">举报类型</TableHead>
              <TableHead className="text-gray-400">举报人</TableHead>
              <TableHead className="text-gray-400">原因</TableHead>
              <TableHead className="text-gray-400">关联内容</TableHead>
              <TableHead className="text-gray-400">状态</TableHead>
              <TableHead className="text-gray-400 text-right">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {reports.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-12 text-gray-500">暂无举报记录</TableCell>
              </TableRow>
            ) : (
              reports.map((report) => (
                <TableRow key={report.id} className="border-white/10 hover:bg-white/5">
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {report.video_id ? <Video className="w-4 h-4 text-blue-400" /> : <MessageSquare className="w-4 h-4 text-green-400" />}
                      <span className="capitalize">{report.video_id ? '视频' : '评论'}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                        <span>{report.profiles?.full_name || 'Unknown'}</span>
                        <span className="text-xs text-gray-500">{new Date(report.created_at).toLocaleDateString()}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-red-300 bg-red-500/10 px-2 py-1 rounded text-sm">{report.reason}</span>
                  </TableCell>
                  <TableCell>
                    {report.video_id && report.videos ? (
                        <Link href={`/video/${report.video_id}`} target="_blank" className="flex items-center gap-1 text-blue-400 hover:underline">
                            {report.videos.title.substring(0, 20)}...
                            <ExternalLink className="w-3 h-3" />
                        </Link>
                    ) : report.comment_id && report.comments ? (
                        <div className="text-sm text-gray-300 max-w-[200px] truncate" title={report.comments.content}>
                            "{report.comments.content}"
                            <Link href={`/video/${report.comments.video_id}`} target="_blank" className="ml-2 inline-block text-blue-400 hover:underline">
                                <ExternalLink className="w-3 h-3" />
                            </Link>
                        </div>
                    ) : (
                        <span className="text-gray-600 italic">内容已删除</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge className={
                        report.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' :
                        report.status === 'resolved' ? 'bg-green-500/20 text-green-400' :
                        'bg-gray-500/20 text-gray-400'
                    }>
                        {report.status === 'pending' ? '待处理' : report.status === 'resolved' ? '已解决' : '已驳回'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      {report.status === 'pending' && (
                        <>
                            <Button 
                                size="sm" 
                                variant="ghost" 
                                className="h-8 w-8 p-0 text-green-400 hover:bg-green-500/20"
                                title="标记为已解决"
                                onClick={() => handleUpdateStatus(report.id, 'resolved')}
                            >
                                <CheckCircle className="w-4 h-4" />
                            </Button>
                            <Button 
                                size="sm" 
                                variant="ghost" 
                                className="h-8 w-8 p-0 text-gray-400 hover:bg-gray-500/20"
                                title="驳回举报"
                                onClick={() => handleUpdateStatus(report.id, 'dismissed')}
                            >
                                <XCircle className="w-4 h-4" />
                            </Button>
                            <Button 
                                size="sm" 
                                variant="ghost" 
                                className="h-8 w-8 p-0 text-red-400 hover:bg-red-500/20"
                                title="删除违规内容"
                                onClick={() => handleDeleteContent(report)}
                            >
                                <Trash2 className="w-4 h-4" />
                            </Button>
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
