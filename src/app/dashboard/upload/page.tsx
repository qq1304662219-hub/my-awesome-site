'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { FileUpload } from '@/components/ui/file-upload'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Plus } from 'lucide-react'

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
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
    </div>
  )

  if (!user) return null

  return (
    <div className="max-w-2xl mx-auto py-8">
        <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
            <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                    <Plus className="h-5 w-5 text-blue-500" />
                    上传新作品
                </CardTitle>
            </CardHeader>
            <CardContent>
                <FileUpload userId={user.id} />
            </CardContent>
        </Card>
    </div>
  )
}
