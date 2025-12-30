'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Upload, Loader2, CheckCircle, AlertCircle } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import Link from 'next/link'

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

const SCENARIOS = [
  { value: "Live", label: "直播背景" },
  { value: "Commerce", label: "电商短视频" },
  { value: "Game", label: "游戏/CG" },
  { value: "Wallpaper", label: "动态壁纸" },
  { value: "Other", label: "其他" }
]

const STYLES = [
  { value: "Sci-Fi", label: "赛博/科幻" },
  { value: "Chinese", label: "国潮/古风" },
  { value: "Anime", label: "二次元/动漫" },
  { value: "Realistic", label: "超写实/实拍感" },
  { value: "Abstract", label: "粒子/抽象" },
  { value: "Other", label: "其他" }
]

const RATIOS = [
  { value: "16:9", label: "横屏 16:9" },
  { value: "9:16", label: "竖屏 9:16 (手机专用)" }
]

interface FileUploadProps {
  userId: string;
  onUploadSuccess?: () => void;
}

export function FileUpload({ userId, onUploadSuccess }: FileUploadProps) {
  const [file, setFile] = useState<File | null>(null)
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState('Live')
  const [style, setStyle] = useState('Sci-Fi')
  const [ratio, setRatio] = useState('16:9')
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
          user_id: userId,
          category: category,
          style: style,
          ratio: ratio,
          status: 'pending', // 默认待审核
          download_url: ''   // 默认空下载链接
        })

      if (dbError) throw dbError

      setMessage({ type: 'success', text: '上传成功！您的作品正在审核中，审核通过后将发布。' })
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

  if (message?.type === 'success') {
    return (
        <div className="space-y-6 py-4">
            <div className="flex flex-col items-center justify-center text-center space-y-2">
                <div className="h-12 w-12 rounded-full bg-green-500/20 flex items-center justify-center mb-2">
                    <CheckCircle className="h-6 w-6 text-green-500" />
                </div>
                <h3 className="text-xl font-bold text-white">上传成功</h3>
                <p className="text-gray-400">您的作品已成功发布，快去首页看看吧！</p>
            </div>

            <div className="flex flex-col gap-3">
                <Button asChild className="w-full bg-blue-600 hover:bg-blue-700 h-11 text-base">
                    <Link href="/dashboard/videos">
                        查看我的作品
                    </Link>
                </Button>
                <Button 
                    onClick={() => setMessage(null)} 
                    variant="outline" 
                    className="w-full border-white/10 hover:bg-white/5 text-gray-300 hover:text-white h-11"
                >
                    继续上传
                </Button>
            </div>
        </div>
    )
  }

  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="title" className="text-gray-300 font-medium">作品标题</Label>
        <Input 
          id="title" 
          value={title} 
          onChange={(e) => setTitle(e.target.value)}
          placeholder="给你的作品起个名字"
          className="bg-black/20 border-white/10 text-white h-11 focus-visible:ring-blue-500/50 placeholder:text-gray-600"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
            <Label htmlFor="category" className="text-gray-300 font-medium">场景用途</Label>
            <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="bg-black/20 border-white/10 text-white h-11 focus:ring-blue-500/50">
                <SelectValue placeholder="选择场景" />
            </SelectTrigger>
            <SelectContent className="bg-[#1e293b] border-white/10 text-white">
                {SCENARIOS.map(item => (
                <SelectItem key={item.value} value={item.value} className="focus:bg-blue-600 focus:text-white cursor-pointer">{item.label}</SelectItem>
                ))}
            </SelectContent>
            </Select>
        </div>

        <div className="space-y-2">
            <Label htmlFor="style" className="text-gray-300 font-medium">视觉风格</Label>
            <Select value={style} onValueChange={setStyle}>
            <SelectTrigger className="bg-black/20 border-white/10 text-white h-11 focus:ring-blue-500/50">
                <SelectValue placeholder="选择风格" />
            </SelectTrigger>
            <SelectContent className="bg-[#1e293b] border-white/10 text-white">
                {STYLES.map(item => (
                <SelectItem key={item.value} value={item.value} className="focus:bg-blue-600 focus:text-white cursor-pointer">{item.label}</SelectItem>
                ))}
            </SelectContent>
            </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="ratio" className="text-gray-300 font-medium">视频比例</Label>
        <Select value={ratio} onValueChange={setRatio}>
        <SelectTrigger className="bg-black/20 border-white/10 text-white h-11 focus:ring-blue-500/50">
            <SelectValue placeholder="选择比例" />
        </SelectTrigger>
        <SelectContent className="bg-[#1e293b] border-white/10 text-white">
            {RATIOS.map(item => (
            <SelectItem key={item.value} value={item.value} className="focus:bg-blue-600 focus:text-white cursor-pointer">{item.label}</SelectItem>
            ))}
        </SelectContent>
        </Select>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="picture" className="text-gray-300 font-medium">上传文件</Label>
        <div className="relative group cursor-pointer">
            <Input 
            id="picture" 
            type="file" 
            onChange={handleFileChange} 
            className="hidden"
            accept="image/*,video/*"
            />
            <label 
                htmlFor="picture" 
                className={`
                    flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer transition-colors
                    ${file ? 'border-blue-500/50 bg-blue-500/10' : 'border-white/10 bg-black/20 hover:border-white/20 hover:bg-white/5'}
                `}
            >
                {file ? (
                    <div className="text-center px-4">
                        <CheckCircle className="w-8 h-8 text-blue-400 mx-auto mb-2" />
                        <p className="text-sm text-blue-200 truncate max-w-[200px]">{file.name}</p>
                    </div>
                ) : (
                    <div className="text-center text-gray-400 group-hover:text-gray-300">
                        <Upload className="w-8 h-8 mx-auto mb-2" />
                        <p className="text-sm">点击选择视频或图片</p>
                    </div>
                )}
            </label>
        </div>
      </div>

      {message && message.type === 'error' && (
        <Alert variant="destructive" className="bg-red-900/20 border-red-900/50 text-red-200">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>错误</AlertTitle>
          <AlertDescription>
            {message.text}
          </AlertDescription>
        </Alert>
      )}

      <Button 
        onClick={handleUpload} 
        disabled={!file || uploading} 
        className="w-full bg-blue-600 hover:bg-blue-700 h-11 text-base font-medium transition-all hover:scale-[1.02] active:scale-[0.98]"
      >
        {uploading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            正在上传...
          </>
        ) : (
          <>
            <Upload className="mr-2 h-4 w-4" />
            开始发布
          </>
        )}
      </Button>
    </div>
  )
}
