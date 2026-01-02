'use client'
import { useState, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Upload, Loader2, CheckCircle, AlertCircle, RefreshCw, X, FileVideo, ChevronRight, ChevronLeft } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import Link from 'next/link'
import { Progress } from "@/components/ui/progress"
import { toast } from "sonner"
import { useAuthStore } from "@/store/useAuthStore"
import { Badge } from "@/components/ui/badge"
import { motion, AnimatePresence } from "framer-motion"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"

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
  const [durationSec, setDurationSec] = useState(0)

  const handleMetadataLoaded = (e: React.SyntheticEvent<HTMLVideoElement>) => {
    const video = e.currentTarget
    
    // Extract Duration
    const duration = video.duration
    if (!isNaN(duration)) {
        setDurationSec(duration)
        const minutes = Math.floor(duration / 60)
        const seconds = Math.floor(duration % 60)
        const formatted = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
        setDurationStr(formatted)
    }

    // Extract Resolution
    const width = video.videoWidth
    const height = video.videoHeight
    if (width && height) {
        // Auto-detect ratio
        const r = width / height
        if (r > 1.7) setRatio("16:9")
        else if (r < 0.6) setRatio("9:16")
        
        // Auto-detect resolution tag
        let resTag = "1080p"
        if (width >= 3840 || height >= 3840) resTag = "4k"
        else if (width < 1280 && height < 1280) resTag = "720p"
        
        // Store technical specs in a way we can use during upload
        // For now, we'll just log it or store in state if we had a dedicated state for it.
        // We'll append it to the description or a hidden field if needed, 
        // OR better: we add these fields to the insert query in handleUpload.
        // Let's store them in a ref or state.
        videoRef.current!.dataset.width = width.toString()
        videoRef.current!.dataset.height = height.toString()
        videoRef.current!.dataset.resolution = resTag
    }
  }

  const handleSeeked = () => {
    if (!coverUrl) {
        handleCaptureCover();
    }
  }

  const [isDragging, setIsDragging] = useState(false)

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const droppedFile = e.dataTransfer.files[0]
    if (droppedFile && droppedFile.type.startsWith('video/')) {
        handleFileSelect(droppedFile)
    } else {
        toast.error('请上传视频文件')
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelect(e.target.files[0])
    }
  }

  const handleFileSelect = async (selectedFile: File) => {
    if (selectedFile.size > 500 * 1024 * 1024) { // 500MB limit
        toast.error('文件大小不能超过 500MB')
        return
    }

    // Check storage quota
    const { data: isQuotaAvailable, error: quotaError } = await supabase.rpc('check_storage_quota', {
        p_new_file_size: selectedFile.size
    })

    if (quotaError) {
        console.error('Quota check error:', quotaError)
        // Fail open or closed? Let's fail closed but warn.
        // toast.error('无法检查存储配额，请稍后重试')
        // return
    }

    if (isQuotaAvailable === false) {
        toast.error('存储空间不足，请联系管理员升级配额')
        return
    }

    setFile(selectedFile)
    setPreviewUrl(URL.createObjectURL(selectedFile))
    setTitle(selectedFile.name.replace(/\.[^/.]+$/, "")) // Remove extension
    setStep(2)
    // Reset other fields if needed
    setMessage(null)
  }

  const handleCaptureCover = () => {
      if (videoRef.current) {
          const canvas = document.createElement('canvas')
          canvas.width = videoRef.current.videoWidth
          canvas.height = videoRef.current.videoHeight
          const ctx = canvas.getContext('2d')
          ctx?.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height)
          setCoverUrl(canvas.toDataURL('image/jpeg'))
          toast.success('封面已截取')
      }
  }

  const handleTagKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && tagInput.trim()) {
        e.preventDefault()
        if (!tags.includes(tagInput.trim())) {
            setTags([...tags, tagInput.trim()])
        }
        setTagInput('')
    }
  }

  const removeTag = (index: number) => {
      setTags(tags.filter((_, i) => i !== index))
  }

  const handleUpload = async () => {
    if (!file || !userId) return
    if (!coverUrl) {
        toast.error('请先截取封面')
        return
    }
    if (!title.trim()) {
        toast.error('请输入标题')
        return
    }

    setUploading(true)
    setMessage(null)
    setProgress(0)

    try {
      // 0. Check Storage Quota
      const { data: hasQuota, error: quotaError } = await supabase.rpc('check_storage_quota', { 
        p_new_file_size: file.size 
      })

      if (quotaError) {
        console.error("Quota check error:", quotaError)
        // If RPC fails (e.g. not found), we might want to fail open or closed. 
        // For now, let's log and proceed, or block. 
        // If function is missing, it errors.
        // Let's assume migration runs successfully.
      } else if (hasQuota === false) {
        throw new Error("存储空间已满，无法上传此视频。请联系管理员升级套餐。")
      }

      // 1. Upload Video
      const fileExt = file.name.split('.').pop()
      const fileName = `${userId}/${Date.now()}.${fileExt}`
      
      const { data: videoUploadData, error: videoUploadError } = await supabase.storage
        .from('videos')
        .upload(fileName, file, {
            cacheControl: '3600',
            upsert: false
        })

      if (videoUploadError) throw videoUploadError
      setProgress(50)

      // 2. Upload Cover
      const coverBlob = await (await fetch(coverUrl)).blob()
      const coverName = `${userId}/${Date.now()}_cover.jpg`
      const { data: coverUploadData, error: coverUploadError } = await supabase.storage
        .from('covers')
        .upload(coverName, coverBlob)

      if (coverUploadError) throw coverUploadError
      setProgress(80)

      // 3. Get Public URLs
      const { data: { publicUrl: videoUrl } } = supabase.storage.from('videos').getPublicUrl(fileName)
      const { data: { publicUrl: coverPublicUrl } } = supabase.storage.from('covers').getPublicUrl(coverName)

      // 4. Insert into Database
      const { data: videoData, error: dbError } = await supabase
        .from('videos')
        .insert({
          user_id: userId,
          title,
          description,
          url: videoUrl,
          cover_url: coverPublicUrl,
          price: parseFloat(price) || 0,
          status: 'pending', // Default to pending
          tags,
          category,
          style,
          ratio,
          duration: durationSec,
          ai_model: aiModel,
          prompt,
          // Auto-detected metadata
          resolution: videoRef.current?.dataset.resolution || '1080p',
          width: videoRef.current?.dataset.width ? parseInt(videoRef.current.dataset.width) : null,
          height: videoRef.current?.dataset.height ? parseInt(videoRef.current.dataset.height) : null,
          size: file.size,
          format: file.type.split('/')[1]?.toUpperCase() || 'MP4',
          fps: 30 // Default assumption as browser API doesn't give FPS easily
        })
        .select()
        .single()

      if (dbError) throw dbError
      setProgress(100)

      // 5. Notify Followers
      try {
        // Self notification
        await supabase.from('notifications').insert({
            user_id: userId,
            actor_id: userId,
            type: 'system',
            resource_id: videoData.id.toString(),
            resource_type: 'video',
            content: `您的视频 "${title || file.name}" 已上传成功`,
            is_read: false
        });

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

  return (
    <div className="w-full">
      <AnimatePresence mode="wait">
        {step === 1 && (
            <motion.div 
                key="step1"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="space-y-5"
            >
                <div 
                    className={`border-2 border-dashed rounded-xl p-10 flex flex-col items-center justify-center text-center transition-all cursor-pointer group min-h-[300px] ${isDragging ? 'border-blue-500 bg-blue-500/10' : 'border-white/10 hover:border-blue-500/50 hover:bg-blue-500/5'}`}
                    onClick={() => document.getElementById('file-upload')?.click()}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                >
                    <div className="h-20 w-20 rounded-full bg-blue-500/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-lg shadow-blue-500/5">
                        <Upload className="h-10 w-10 text-blue-500" />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">点击或拖拽上传视频</h3>
                    <p className="text-sm text-gray-400 mb-6 max-w-sm">
                        支持 MP4, MOV, WebM 格式。建议上传 1080p 或 4K 分辨率的高质量视频。
                    </p>
                    <div className="flex flex-col gap-2">
                        <Input 
                            id="file-upload" 
                            type="file" 
                            accept="video/*" 
                            className="hidden" 
                            onChange={handleFileChange}
                        />
                        <Button variant="secondary" className="px-8">选择文件</Button>
                        <p className="text-xs text-gray-500 mt-2">最大支持 500MB</p>
                    </div>
                </div>
            </motion.div>
        )}

        {step === 2 && file && (
            <motion.div 
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
            >
                <div className="flex items-center justify-between">
                    <Button variant="ghost" onClick={() => { setStep(1); setFile(null); }} className="text-gray-400 hover:text-white pl-0 gap-1">
                        <ChevronLeft className="h-4 w-4" /> 返回重选
                    </Button>
                    <Badge variant="outline" className="text-blue-400 border-blue-500/30">正在编辑: {file.name}</Badge>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Left: Preview & Cover */}
                    <div className="space-y-6">
                        <div className="space-y-2">
                            <Label className="text-gray-300 flex items-center gap-2">
                                <FileVideo className="h-4 w-4 text-blue-500" />
                                视频预览 & 封面
                            </Label>
                            <div className="aspect-video bg-black rounded-xl overflow-hidden border border-white/10 relative group shadow-2xl">
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
                        </div>

                        <div className="flex items-center justify-between gap-4 p-4 rounded-lg bg-white/5 border border-white/10">
                            <div className="text-sm text-gray-400">
                                封面是用户看到的第一眼，请选择精彩的一帧。
                            </div>
                            <Button size="sm" variant="secondary" onClick={handleCaptureCover} type="button" className="shrink-0">
                                📸 截取当前帧
                            </Button>
                        </div>
                        
                        {coverUrl && (
                            <motion.div 
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="space-y-2"
                            >
                                <Label className="text-gray-300 text-xs uppercase tracking-wider">当前封面预览</Label>
                                <div className="w-40 aspect-video bg-black rounded-lg border border-white/10 overflow-hidden shadow-lg">
                                    <img src={coverUrl} alt="Cover" className="w-full h-full object-cover" />
                                </div>
                            </motion.div>
                        )}
                    </div>

                    {/* Right: Metadata Form */}
                    <div className="space-y-5">
                        <div className="space-y-2">
                        <Label htmlFor="title" className="text-gray-300">标题 <span className="text-red-500">*</span></Label>
                        <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} className="bg-black/20 border-white/10 text-white focus:border-blue-500/50" />
                        </div>

                        <div className="space-y-2">
                        <Label htmlFor="desc" className="text-gray-300">描述</Label>
                        <Textarea id="desc" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="简单介绍一下视频内容..." className="bg-black/20 border-white/10 text-white min-h-[80px] focus:border-blue-500/50" />
                        </div>

                        <div className="space-y-2">
                        <Label className="text-gray-300">Prompt (提示词)</Label>
                        <Textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder="生成该视频使用的提示词..." className="bg-black/20 border-white/10 text-white min-h-[60px] focus:border-blue-500/50" />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="text-gray-300">AI Model</Label>
                                <Select value={aiModel} onValueChange={setAiModel}>
                                    <SelectTrigger className="bg-black/20 border-white/10 text-white"><SelectValue placeholder="选择 AI 模型" /></SelectTrigger>
                                    <SelectContent className="bg-[#1e293b] border-white/10 text-white">
                                        {AI_MODELS.map(i => <SelectItem key={i.value} value={i.value}>{i.label}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-gray-300">分类</Label>
                                <Select value={category} onValueChange={setCategory}>
                                    <SelectTrigger className="bg-black/20 border-white/10 text-white"><SelectValue /></SelectTrigger>
                                    <SelectContent className="bg-[#1e293b] border-white/10 text-white">
                                        {SCENARIOS.map(i => <SelectItem key={i.value} value={i.value}>{i.label}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="text-gray-300">价格 (A币)</Label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">¥</span>
                                    <Input type="number" value={price} onChange={(e) => setPrice(e.target.value)} className="bg-black/20 border-white/10 text-white pl-7" min="0" />
                                </div>
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
                        <div className="flex flex-wrap gap-2 mb-2 min-h-[32px]">
                            {tags.map((tag, index) => (
                                <Badge key={index} variant="secondary" className="gap-1 pr-1 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border-blue-500/20">
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

                <div className="flex justify-end gap-3 pt-6 border-t border-white/5">
                    <Button variant="ghost" onClick={() => { setStep(1); setFile(null); }} disabled={uploading} className="text-gray-300 hover:text-white hover:bg-white/10">
                        取消
                    </Button>
                    <div className="flex flex-col gap-2 w-full max-w-[200px]">
                    {uploading && <Progress value={progress} className="h-2" />}
                    <Button onClick={handleUpload} disabled={uploading} className="bg-blue-600 hover:bg-blue-700 w-full shadow-lg shadow-blue-900/20">
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
            </motion.div>
        )}

        {step === 3 && (
            <motion.div 
                key="step3"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="space-y-6 py-12"
            >
                <div className="flex flex-col items-center justify-center text-center space-y-4">
                    <div className="h-20 w-20 rounded-full bg-green-500/10 flex items-center justify-center mb-2 ring-4 ring-green-500/5">
                        <CheckCircle className="h-10 w-10 text-green-500" />
                    </div>
                    <h3 className="text-2xl font-bold text-white">发布成功！</h3>
                    <p className="text-gray-400 max-w-md">您的作品已提交审核，审核通过后将自动上架。感谢您对社区的贡献！</p>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
                    <Button asChild className="bg-blue-600 hover:bg-blue-700 h-11 px-8 text-base shadow-lg shadow-blue-900/20">
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
                            setTitle('');
                            setDescription('');
                            setTags([]);
                            setPrice('0');
                        }} 
                        variant="outline" 
                        className="border-white/10 hover:bg-white/5 text-gray-300 hover:text-white h-11 px-8"
                    >
                        继续上传
                    </Button>
                </div>
            </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}