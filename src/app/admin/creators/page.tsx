"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { useAuthStore } from "@/store/useAuthStore"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { Check, X, Loader2, ShieldCheck, User, Video } from "lucide-react"
import { useRouter } from "next/navigation"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { format } from "date-fns"

interface CreatorApplication {
  id: string
  full_name: string
  email: string
  avatar_url: string
  bio?: string
  created_at: string
  is_verified: boolean
  role: string
  storage_used: number
}

export default function AdminCreatorsPage() {
  const [applications, setApplications] = useState<CreatorApplication[]>([])
  const [loading, setLoading] = useState(true)
  const { profile } = useAuthStore()
  const router = useRouter()

  useEffect(() => {
    fetchApplications()
  }, [])

  const fetchApplications = async () => {
    try {
      // Fetch users who are NOT verified
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('is_verified', false)
        .order('created_at', { ascending: false })
        .limit(50)

      if (error) throw error
      setApplications(data as any)
    } catch (error) {
      console.error(error)
      toast.error("加载失败")
    } finally {
      setLoading(false)
    }
  }

  const handleVerify = async (userId: string) => {
    try {
        const { error } = await supabase
            .from('profiles')
            .update({ 
                is_verified: true,
                role: 'creator', // Upgrade role
                badges: ['verified', 'creator'] // Add default badges
            })
            .eq('id', userId)
        
        if (error) throw error
        
        toast.success("已通过认证")
        fetchApplications()
    } catch (error) {
        toast.error("操作失败")
    }
  }

  return (
    <div className="p-8 ml-64">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-white flex items-center gap-2">
            <ShieldCheck className="text-blue-500" />
            创作者审核
        </h1>
        <div className="text-sm text-gray-400">
            待审核用户: {applications.length}
        </div>
      </div>

      <div className="grid gap-4">
        {loading ? (
            <div className="flex justify-center py-12">
                <Loader2 className="animate-spin h-8 w-8 text-blue-500" />
            </div>
        ) : applications.length === 0 ? (
            <div className="text-center py-12 text-gray-400 bg-white/5 rounded-xl border border-white/10">
                暂无待审核用户
            </div>
        ) : (
            applications.map((app) => (
                <Card key={app.id} className="bg-[#0f172a] border-white/10 text-white">
                    <CardContent className="p-6 flex items-center justify-between gap-4">
                        <div className="flex items-center gap-4 flex-1">
                            <Avatar className="h-12 w-12 border border-white/10">
                                <AvatarImage src={app.avatar_url} />
                                <AvatarFallback>{app.full_name?.[0]}</AvatarFallback>
                            </Avatar>
                            <div>
                                <div className="flex items-center gap-2">
                                    <h3 className="font-bold text-lg">{app.full_name || "Unknown User"}</h3>
                                    <Badge variant="outline" className="text-xs border-white/20 text-gray-400">
                                        {app.role}
                                    </Badge>
                                </div>
                                <p className="text-sm text-gray-400 line-clamp-1">
                                    {app.email} • 注册于 {format(new Date(app.created_at), 'yyyy-MM-dd')}
                                </p>
                                {app.bio && (
                                    <p className="text-sm text-gray-300 mt-1 line-clamp-1">
                                        简介: {app.bio}
                                    </p>
                                )}
                            </div>
                        </div>

                        <div className="flex items-center gap-6">
                            <div className="text-right text-sm text-gray-400">
                                <div>已用存储</div>
                                <div className="font-mono text-white">
                                    {(app.storage_used / 1024 / 1024).toFixed(1)} MB
                                </div>
                            </div>
                            
                            <div className="flex gap-2">
                                <Button 
                                    onClick={() => handleVerify(app.id)}
                                    className="bg-green-600 hover:bg-green-700 text-white gap-2"
                                >
                                    <Check className="w-4 h-4" />
                                    通过认证
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            ))
        )}
      </div>
    </div>
  )
}
