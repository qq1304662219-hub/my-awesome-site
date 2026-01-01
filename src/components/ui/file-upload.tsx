'use client'
import { useState, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Upload, Loader2, CheckCircle, AlertCircle, RefreshCw, X } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import Link from 'next/link'
import { Progress } from "@/components/ui/progress"
import { toast } from "sonner"
import { useAuthStore } from "@/store/useAuthStore"
import { Badge } from "@/components/ui/badge"

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

const AI_MODELS = [
  { value: "Sora", label: "Sora" },
  { value: "Runway Gen-2", label: "Runway Gen-2" },
  { value: "Pika Labs", label: "Pika Labs" },
  { value: "Stable Video Diffusion", label: "Stable Video Diffusion" },
  { value: "Midjourney", label: "Midjourney" },
  { value: "DALL-E 3", label: "DALL-E 3" },
  { value: "Other", label: "其他" }
]

interface FileUploadProps {
  userId: string;
  onUploadSuccess?: () => void;
}

export function FileUpload({ userId, onUploadSuccess }: FileUploadProps) {
  const { user } = useAuthStore()
  const videoRef = useRef<HTMLVideoElement>(null)
  const [step, setStep] = useState(1) // 1: Select File, 2: Details & Preview, 3: Success
  const [file, setFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [coverUrl, setCoverUrl] = useState<string | null>(null)
  
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [price, setPrice] = useState('0')
  const [tags, setTags] = useState<string[]>([])
  const [tagInput, setTagInput] = useState('')
  const [prompt, setPrompt] = useState('')
  const [aiModel, setAiModel] = useState('')
  
  const [category, setCategory] = useState('Live')
  const [style, setStyle] = useState('Sci-Fi')
  const [ratio, setRatio] = useState('16:9')
  
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  const [durationStr, setDurationStr] = useState('00:00')

  const handleMetadataLoaded = (e: React.SyntheticEvent<HTMLVideoElement>) => {
    const video = e.currentTarget
    const duration = video.duration
    if (!isNaN(duration)) {
        const minutes = Math.floor(duration / 60)
        const seconds = Math.floor(duration % 60)
        const formatted = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
        setDurationStr(formatted)
    }
  }

  const handleSeeked = () => {
    if (!coverUrl) {
        handleCaptureCover();
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFile = e.target.files[0]
      setFile(selectedFile)
      setPreviewUrl(URL.createObjectURL(selectedFile))
      
      // Auto-set title
      const name = selectedFile.name.replace(/\.[^/.]+$/, "")
      setTitle(name)
      
      setStep(2)
    }
  }

  const handleCaptureCover = () => {
    const video = videoRef.current
    if (video) {
      const canvas = document.createElement('canvas')
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      canvas.getContext('2d')?.drawImage(video, 0, 0, canvas.width, canvas.height)
      setCoverUrl(canvas.toDataURL('image/jpeg'))
    }
  }

  const handleTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
        e.preventDefault()
        const newTag = tagInput.trim()
        if (newTag && !tags.includes(newTag)) {
            setTags([...tags, newTag])
            setTagInput('')
        }
    }
  }

  const removeTag = (indexToRemove: number) => {
    setTags(tags.filter((_, index) => index !== indexToRemove))
  }

  const handleUpload = async () => {
    if (!file || !userId) return
    
    if (user && !user.email_confirmed_at) {
        toast.error("请先验证邮箱才能发布作品")
        return
    }

    setUploading(true)
    setMessage(null)

    try {
      // 1. Upload Video
      const fileExt = file.name.split('.').pop()
      const fileName = `${userId}/${Date.now()}.${fileExt}`
      
      // Simulate progress since Supabase JS client doesn't support it directly in simple upload
      const progressInterval = setInterval(() => {
        setProgress(prev => {
            if (prev >= 90) return prev;
            return prev + 5;
        })
      }, 500);

      const { error: uploadError } = await supabase.storage
        .from('uploads')
        .upload(fileName, file)
      
      clearInterval(progressInterval);
      setProgress(100);

      if (uploadError) throw uploadError

      // 2. Upload Cover (if exists)
      let coverStoragePath = null
      if (coverUrl) {
        const coverBlob = await (await fetch(coverUrl)).blob()
        const coverName = `${userId}/${Date.now()}_cover.jpg`
        const { error: coverError } = await supabase.storage
            .from('uploads')
            .upload(coverName, coverBlob)
        
        if (!coverError) {
             const { data: { publicUrl } } = supabase.storage
            .from('uploads')
            .getPublicUrl(coverName)
            coverStoragePath = publicUrl
        }
      }

      // 3. Get Public URL (or Signed URL logic later)
      const { data: { publicUrl } } = supabase.storage
        .from('uploads')
        .getPublicUrl(fileName)

      // 4. Save metadata
      const { data: videoData, error: dbError } = await supabase
        .from('videos')
        .insert({
          title: title || file.name,
          description: description,
          url: publicUrl,
          thumbnail_url: coverStoragePath, // Save generated cover
          user_id: userId,
          category: category,
          style: style,
          ratio: ratio,
          price: parseFloat(price) || 0,
          tags: tags, // Fix: tags is already an array
          prompt: prompt,
          ai_model: aiModel,
          status: 'pending',
          download_url: '',
          duration: durationStr // Use extracted duration
        })
        .select()
        .single()

      if (dbError) throw dbError

      // 5. Notify Followers
      try {
        const { data: followers } = await supabase
            .from('follows')
            .select('follower_id')
            .eq('following_id', userId)
        
        if (followers && followers.length > 0) {
            const notifications = followers.map(f => ({
                user_id: f.follower_id,
                actor_id: userId,
                type: 'new_video',
                resource_id: videoData.id.toString(),
                resource_type: 'video',
                content: `发布了新视频: ${title || file.name}`,
                is_read: false
            }))
            
            await supabase.from('notifications').insert(notifications)
        }
      } catch (notifyError) {
        console.error("Error notifying followers:", notifyError)
        // Don't block success flow if notification fails
      }

      setMessage({ type: 'success', text: '上传成功！' })
      setStep(3)
      
      if (onUploadSuccess) {
        onUploadSuccess()
      }

    } catch (error: any) {
      console.error('Upload error:', error)
      setMessage({ type: 'error', text: error.message || '上传失败' })
    } finally {
      setUploading(false)
    }
  }

  if (step === 3) {
    // Success view
    return (
        <div className="space-y-6 py-4">
            <div className="flex flex-col items-center justify-center text-center space-y-2">
                <div className="h-12 w-12 rounded-full bg-green-500/20 flex items-center justify-center mb-2">
                    <CheckCircle className="h-6 w-6 text-green-500" />
                </div>
                <h3 className="text-xl font-bold text-white">发布成功</h3>
                <p className="text-gray-400">您的作品已提交审核，感谢您的贡献！</p>
            </div>

            <div className="flex flex-col gap-3">
                <Button asChild className="w-full bg-blue-600 hover:bg-blue-700 h-11 text-base">
                    <Link href="/dashboard/videos">
                        管理我的作品
                    </Link>
                </Button>
                <Button 
                    onClick={() => {
                        setStep(1); 
                        setFile(null); 
                        setPreviewUrl(null); 
                        setCoverUrl(null);
                        setMessage(null);
                    }} 
                    variant="outline" 
                    className="w-full border-white/10 hover:bg-white/5 text-gray-300 hover:text-white h-11"
                >
                    继续上传
                </Button>
            </div>
        </div>
    )
  }

  if (step === 2 && file) {
      return (
          <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Left: Preview & Cover */}
                  <div className="space-y-4">
                      <Label className="text-gray-300">视频预览 & 封面截取</Label>
                      <div className="aspect-video bg-black rounded-lg overflow-hidden border border-white/10 relative group">
                          {previewUrl && (
                              <video 
                                ref={videoRef}
                                src={previewUrl} 
                                className="w-full h-full object-contain" 
                                controls 
                                onLoadedMetadata={handleMetadataLoaded}
                                onSeeked={handleSeeked}
                              />
                          )}
                      </div>
                      <div className="flex gap-2">
                          <Button size="sm" variant="secondary" onClick={handleCaptureCover} type="button">
                              📸 截取当前帧为封面
                          </Button>
                      </div>
                      {coverUrl && (
                          <div className="space-y-2">
                              <Label className="text-gray-300 text-xs">当前封面预览</Label>
                              <div className="w-32 aspect-video bg-black rounded border border-white/10 overflow-hidden">
                                  <img src={coverUrl} alt="Cover" className="w-full h-full object-cover" />
                              </div>
                          </div>
                      )}
                  </div>

                  {/* Right: Metadata Form */}
                  <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="title" className="text-gray-300">标题</Label>
                        <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} className="bg-black/20 border-white/10 text-white" />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="desc" className="text-gray-300">描述</Label>
                        <Input id="desc" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="简单介绍一下视频内容..." className="bg-black/20 border-white/10 text-white" />
                      </div>

                      <div className="space-y-2">
                        <Label className="text-gray-300">Prompt (提示词)</Label>
                        <Input value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder="生成该视频使用的提示词..." className="bg-black/20 border-white/10 text-white" />
                      </div>

                      <div className="space-y-2">
                        <Label className="text-gray-300">AI Model (使用的模型)</Label>
                        <Select value={aiModel} onValueChange={setAiModel}>
                            <SelectTrigger className="bg-black/20 border-white/10 text-white"><SelectValue placeholder="选择 AI 模型" /></SelectTrigger>
                            <SelectContent className="bg-[#1e293b] border-white/10 text-white">
                                {AI_MODELS.map(i => <SelectItem key={i.value} value={i.value}>{i.label}</SelectItem>)}
                            </SelectContent>
                        </Select>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label className="text-gray-300">分类</Label>
                            <Select value={category} onValueChange={setCategory}>
                                <SelectTrigger className="bg-black/20 border-white/10 text-white"><SelectValue /></SelectTrigger>
                                <SelectContent className="bg-[#1e293b] border-white/10 text-white">
                                    {SCENARIOS.map(i => <SelectItem key={i.value} value={i.value}>{i.label}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-gray-300">风格</Label>
                            <Select value={style} onValueChange={setStyle}>
                                <SelectTrigger className="bg-black/20 border-white/10 text-white"><SelectValue /></SelectTrigger>
                                <SelectContent className="bg-[#1e293b] border-white/10 text-white">
                                    {STYLES.map(i => <SelectItem key={i.value} value={i.value}>{i.label}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label className="text-gray-300">价格 (A币)</Label>
                            <Input type="number" value={price} onChange={(e) => setPrice(e.target.value)} className="bg-black/20 border-white/10 text-white" min="0" />
                          </div>
                          <div className="space-y-2">
                             <Label className="text-gray-300">比例</Label>
                             <Select value={ratio} onValueChange={setRatio}>
                                <SelectTrigger className="bg-black/20 border-white/10 text-white"><SelectValue /></SelectTrigger>
                                <SelectContent className="bg-[#1e293b] border-white/10 text-white">
                                    {RATIOS.map(i => <SelectItem key={i.value} value={i.value}>{i.label}</SelectItem>)}
                                </SelectContent>
                            </Select>
                          </div>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-gray-300">标签 (输入后回车添加)</Label>
                        <div className="flex flex-wrap gap-2 mb-2">
                            {tags.map((tag, index) => (
                                <Badge key={index} variant="secondary" className="gap-1 pr-1 bg-white/10 hover:bg-white/20 text-gray-200">
                                    {tag}
                                    <X className="h-3 w-3 cursor-pointer hover:text-red-400" onClick={() => removeTag(index)} />
                                </Badge>
                            ))}
                        </div>
                        <Input 
                            value={tagInput} 
                            onChange={(e) => setTagInput(e.target.value)} 
                            onKeyDown={handleTagKeyDown}
                            placeholder="例如: 4K, 自然, 延时摄影" 
                            className="bg-black/20 border-white/10 text-white" 
                        />
                      </div>
                  </div>
              </div>

              {message?.type === 'error' && (
                  <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertTitle>错误</AlertTitle>
                      <AlertDescription>{message.text}</AlertDescription>
                  </Alert>
              )}

              <div className="flex justify-end gap-3 pt-4">
                  <Button variant="ghost" onClick={() => { setStep(1); setFile(null); }} disabled={uploading} className="text-gray-300 hover:text-white hover:bg-white/10">
                      取消
                  </Button>
                  <div className="flex flex-col gap-2 w-full max-w-[200px]">
                    {uploading && <Progress value={progress} className="h-2" />}
                    <Button onClick={handleUpload} disabled={uploading} className="bg-blue-600 hover:bg-blue-700 w-full">
                        {uploading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                上传中 {Math.round(progress)}%
                            </>
                        ) : (
                            <>
                                <Upload className="mr-2 h-4 w-4" />
                                确认发布
                            </>
                        )}
                    </Button>
                  </div>
              </div>
          </div>
      )
  }

  return (
    <div className="space-y-5">
      <div className="border-2 border-dashed border-white/10 rounded-xl p-10 flex flex-col items-center justify-center text-center hover:border-blue-500/50 hover:bg-blue-500/5 transition-all cursor-pointer group" onClick={() => document.getElementById('file-upload')?.click()}>
          <div className="h-16 w-16 rounded-full bg-blue-500/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Upload className="h-8 w-8 text-blue-500" />
          </div>
          <h3 className="text-lg font-medium text-white mb-1">点击或拖拽上传视频</h3>
          <p className="text-sm text-gray-400 mb-6">支持 MP4, MOV, WebM 格式</p>
          <Input 
              id="file-upload" 
              type="file" 
              accept="video/*" 
              className="hidden" 
              onChange={handleFileChange}
          />
          <Button variant="secondary">选择文件</Button>
      </div>
    </div>
  )
}
