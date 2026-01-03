'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { FileUpload } from '@/components/ui/file-upload'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Plus } from 'lucide-react'
import { motion } from 'framer-motion'

export default function UploadPage() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setUser(user)
      }
      setLoading(false)
    }
    getUser()
  }, [])

  if (loading) return (
    <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
    </div>
  )

  if (!user) return (
    <div className="flex flex-col items-center justify-center h-96 space-y-4">
        <p className="text-muted-foreground">请先登录后再上传作品</p>
    </div>
  )

  return (
    <div className="p-4 md:p-8 space-y-6 md:space-y-8 max-w-7xl mx-auto pb-24">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">上传作品</h1>
            <p className="text-muted-foreground">分享您的 AI 视频作品，设置价格并赚取收益。</p>
        </div>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card className="bg-card border-border backdrop-blur-sm overflow-hidden">
            <CardHeader className="bg-muted/30 border-b border-border">
                <CardTitle className="text-foreground flex items-center gap-2 text-lg">
                    <Plus className="h-5 w-5 text-primary" />
                    创建新发布
                </CardTitle>
            </CardHeader>
            <CardContent className="p-6 md:p-8">
                <FileUpload userId={user.id} />
            </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}