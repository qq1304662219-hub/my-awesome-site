'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Upload, Loader2, CheckCircle, AlertCircle } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

interface FileUploadProps {
  userId: string;
  onUploadSuccess?: () => void;
}

export function FileUpload({ userId, onUploadSuccess }: FileUploadProps) {
  const [file, setFile] = useState<File | null>(null)
  const [title, setTitle] = useState('')
  const [uploading, setUploading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0])
      // 自动设置标题为文件名（去掉扩展名）
      if (!title) {
        const name = e.target.files[0].name.replace(/\.[^/.]+$/, "")
        setTitle(name)
      }
    }
  }

  const handleUpload = async () => {
    if (!file || !userId) return

    setUploading(true)
    setMessage(null)

    try {
      // 1. Upload file to Storage
      const fileExt = file.name.split('.').pop()
      const fileName = `${userId}/${Date.now()}.${fileExt}`
      
      const { error: uploadError } = await supabase.storage
        .from('uploads')
        .upload(fileName, file)

      if (uploadError) throw uploadError

      // 2. Get Public URL
      const { data: { publicUrl } } = supabase.storage
        .from('uploads')
        .getPublicUrl(fileName)

      // 3. Save metadata to Database
      const { error: dbError } = await supabase
        .from('videos')
        .insert({
          title: title || file.name,
          url: publicUrl,
          user_id: userId
        })

      if (dbError) throw dbError

      setMessage({ type: 'success', text: '上传成功！' })
      setFile(null)
      setTitle('')
      // Reset file input value
      const fileInput = document.getElementById('picture') as HTMLInputElement
      if (fileInput) fileInput.value = ''
      
      if (onUploadSuccess) {
        onUploadSuccess()
      }

    } catch (error: any) {
      console.error('Upload error:', error)
      setMessage({ type: 'error', text: error.message || '上传失败，请重试' })
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="title" className="text-gray-300">标题</Label>
        <Input 
          id="title" 
          value={title} 
          onChange={(e) => setTitle(e.target.value)}
          placeholder="给你的作品起个名字"
          className="bg-black/20 border-white/10 text-white"
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="picture" className="text-gray-300">选择文件</Label>
        <Input 
          id="picture" 
          type="file" 
          onChange={handleFileChange} 
          className="bg-black/20 border-white/10 text-white file:text-white file:bg-blue-600 file:border-0 file:rounded-md file:mr-4 file:px-2 file:py-1 hover:file:bg-blue-700"
          accept="image/*,video/*"
        />
      </div>

      {message && (
        <Alert variant={message.type === 'error' ? 'destructive' : 'default'} className={message.type === 'success' ? 'border-green-500/50 text-green-500 bg-green-500/10' : ''}>
          {message.type === 'success' ? <CheckCircle className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
          <AlertTitle>{message.type === 'success' ? '成功' : '错误'}</AlertTitle>
          <AlertDescription>
            {message.text}
          </AlertDescription>
        </Alert>
      )}

      <Button onClick={handleUpload} disabled={!file || uploading} className="w-full bg-blue-600 hover:bg-blue-700">
        {uploading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            正在上传...
          </>
        ) : (
          <>
            <Upload className="mr-2 h-4 w-4" />
            开始上传
          </>
        )}
      </Button>
    </div>
  )
}
