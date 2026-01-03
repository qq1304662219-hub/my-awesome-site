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

import { 
    CATEGORIES, 
    STYLES, 
    AI_MODELS, 
    MOVEMENTS, 
    RATIOS, 
    RESOLUTIONS, 
    DURATIONS, 
    FPS_OPTIONS 
} from "@/lib/constants"

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
  
  const [category, setCategory] = useState('')
  const [style, setStyle] = useState('')
  const [ratio, setRatio] = useState('')
  const [movement, setMovement] = useState('')
  const [resolution, setResolution] = useState('')
  const [durationTag, setDurationTag] = useState('')
  const [fpsTag, setFpsTag] = useState('')
  const [fps, setFps] = useState(30)
  
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  const [durationSec, setDurationSec] = useState(0)

  const handleMetadataLoaded = (e: React.SyntheticEvent<HTMLVideoElement>) => {
    const video = e.currentTarget
    
    // Extract Duration
    const duration = video.duration
    if (!isNaN(duration)) {
        setDurationSec(duration)
        if (duration < 3) setDurationTag("under_3s")
        else if (duration <= 5) setDurationTag("3_5s")
        else if (duration <= 10) setDurationTag("5_10s")
        else setDurationTag("over_10s")
    }

    // Extract Resolution
    const width = video.videoWidth
    const height = video.videoHeight
    if (width && height) {
        // Auto-detect ratio
        const r = width / height
        // Find closest ratio with tighter tolerances
        if (Math.abs(r - 16/9) < 0.15) setRatio("16:9")
        else if (Math.abs(r - 9/16) < 0.15) setRatio("9:16")
        else if (Math.abs(r - 1) < 0.1) setRatio("1:1")
        else if (Math.abs(r - 21/9) < 0.15) setRatio("21:9")
        else if (Math.abs(r - 4/3) < 0.15) setRatio("4:3")
        else {
            // Fallback based on orientation
            if (width > height) setRatio("16:9")
            else if (height > width) setRatio("9:16")
            else setRatio("1:1")
        }
        
        // Auto-detect resolution tag based on the shorter side (standard definition)
        const minDim = Math.min(width, height)
        const maxDim = Math.max(width, height)
        
        // Logic: 8K (~4320p), 4K (~2160p), 2K (~1440p), 1080p, 720p
        if (minDim >= 4320 || maxDim >= 7680) setResolution("8k")
        else if (minDim >= 2160 || maxDim >= 3840) setResolution("4k")
        else if (minDim >= 1440 || maxDim >= 2560) setResolution("2k")
        else if (minDim >= 1080 || maxDim >= 1920) setResolution("1080p")
        else setResolution("720p_low")
        
        videoRef.current!.dataset.width = width.toString()
        videoRef.current!.dataset.height = height.toString()
    }
    
    // Estimate FPS (Video element doesn't expose FPS directly, usually requires parsing file header or counting frames over time)
    // For now, we default to 30 or let user select. 
    // We can't easily auto-detect FPS in JS without external libraries.
    setFpsTag("30") // Default to 30 fps
    setFps(30)
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
    
    // Validate 8 Mandatory Tags
    if (!style) { toast.error('请选择视觉风格'); return }
    if (!category) { toast.error('请选择内容题材'); return }
    if (!aiModel) { toast.error('请选择 AI 模型'); return }
    if (!movement) { toast.error('请选择镜头语言'); return }
    if (!resolution) { toast.error('请选择画质/分辨率'); return }
    if (!durationTag) { toast.error('请确认时长分类'); return }
    if (!ratio) { toast.error('请选择比例'); return }
    if (!fpsTag) { toast.error('请选择帧率'); return }

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
      } else if (hasQuota === false) {
        throw new Error("存储空间已满，无法上传此视频。请联系管理员升级套餐。")
      }

      // 1. Upload Video (Original to Private Bucket)
      const fileName = `${userId}/${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.]/g, '_')}`
      const { data: videoUploadData, error: videoUploadError } = await supabase.storage
        .from('raw_videos') // Changed to private bucket
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
      setProgress(70)

      // 3. Get Public URLs
      // Note: Video URL will be set to empty or placeholder initially, updated after processing
      const { data: { publicUrl: coverPublicUrl } } = supabase.storage.from('covers').getPublicUrl(coverName)

      // Determine numeric FPS from tag if possible, or use default
      let finalFps = 30
      if (fpsTag === '24') finalFps = 24
      else if (fpsTag === '25') finalFps = 25
      else if (fpsTag === '30') finalFps = 30
      else if (fpsTag === 'over_60') finalFps = 60
      else if (fpsTag === 'under_24') finalFps = 15 // approximation
      else finalFps = fps || 30

      // 4. Insert into Database
      const { data: videoData, error: dbError } = await supabase
        .from('videos')
        .insert({
          user_id: userId,
          title,
          description,
          url: '', // Will be updated by processing
          original_url: fileName, // Store path to raw video
          cover_url: coverPublicUrl,
          price: parseFloat(price) || 0,
          status: 'processing', // Set to processing
          tags,
          category,
          style,
          ratio,
          duration: durationSec,
          duration_range: durationTag,
          ai_model: aiModel,
          movement, 
          prompt,
          resolution, 
          fps_range: fpsTag,
          width: videoRef.current?.dataset.width ? parseInt(videoRef.current.dataset.width) : null,
          height: videoRef.current?.dataset.height ? parseInt(videoRef.current.dataset.height) : null,
          size: file.size,
          format: file.type.split('/')[1]?.toUpperCase() || 'MP4',
          fps: finalFps,
          is_processed: false
        })
        .select()
        .single()

      if (dbError) throw dbError
      
      // 5. Trigger Backend Processing
      setProgress(85)
      try {
        const response = await fetch('/api/upload/process', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                videoId: videoData.id,
                filePath: fileName,
                userId: userId
            })
        });
        
        if (!response.ok) {
            console.error('Processing trigger failed');
            // We don't throw here to avoid blocking the UI, but we should notify
            toast.error('视频处理请求失败，请稍后重试');
        }
      } catch (procErr) {
        console.error('Processing error:', procErr);
      }

      setProgress(100)

      // 6. Notify Followers
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
                    className={`border-2 border-dashed rounded-xl p-10 flex flex-col items-center justify-center text-center transition-all cursor-pointer group min-h-[300px] ${isDragging ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/50 hover:bg-primary/5'}`}
                    onClick={() => document.getElementById('file-upload')?.click()}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                >
                    <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-lg shadow-primary/5">
                        <Upload className="h-10 w-10 text-primary" />
                    </div>
                    <h3 className="text-xl font-bold text-foreground mb-2">点击或拖拽上传视频</h3>
                    <p className="text-sm text-muted-foreground mb-6 max-w-sm">
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
                        <p className="text-xs text-muted-foreground mt-2">最大支持 500MB</p>
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
                            <Label className="text-muted-foreground flex items-center gap-2">
                                <FileVideo className="h-4 w-4 text-primary" />
                                视频预览 & 封面
                            </Label>
                            <div className="aspect-video bg-black rounded-xl overflow-hidden border border-border relative group shadow-2xl">
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

                        <div className="flex items-center justify-between gap-4 p-4 rounded-lg bg-muted/30 border border-border">
                            <div className="text-sm text-muted-foreground">
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
                                <Label className="text-muted-foreground text-xs uppercase tracking-wider">当前封面预览</Label>
                                <div className="w-40 aspect-video bg-muted rounded-lg border border-border overflow-hidden shadow-lg">
                                    <img src={coverUrl} alt="Cover" className="w-full h-full object-cover" />
                                </div>
                            </motion.div>
                        )}
                    </div>

                    {/* Right: Metadata Form */}
                    <div className="space-y-5">
                        <div className="space-y-2">
                        <Label htmlFor="title" className="text-foreground">标题 <span className="text-red-500">*</span></Label>
                        <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} className="bg-background border-input text-foreground focus:border-primary/50" />
                        </div>

                        <div className="space-y-2">
                        <Label htmlFor="desc" className="text-muted-foreground">描述</Label>
                        <Textarea id="desc" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="简单介绍一下视频内容..." className="bg-background border-input text-foreground min-h-[80px] focus:border-primary/50" />
                        </div>

                        <div className="space-y-2">
                        <Label className="text-muted-foreground">Prompt (提示词)</Label>
                        <Textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder="生成该视频使用的提示词..." className="bg-background border-input text-foreground min-h-[60px] focus:border-primary/50" />
                        </div>

                        {/* 8 Essential Classifications */}
                        <div className="space-y-4 border rounded-lg p-4 bg-muted/20">
                            <Label className="text-sm font-semibold text-foreground mb-2 block">视频分类属性 (必填)</Label>
                            
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label className="text-muted-foreground text-xs">内容题材</Label>
                                    <Select value={category} onValueChange={setCategory}>
                                        <SelectTrigger className="bg-background border-input text-foreground"><SelectValue placeholder="选择题材" /></SelectTrigger>
                                        <SelectContent className="bg-popover border-border text-popover-foreground">
                                            {CATEGORIES.map(i => <SelectItem key={i.value} value={i.value}>{i.label}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-muted-foreground text-xs">视觉风格</Label>
                                    <Select value={style} onValueChange={setStyle}>
                                        <SelectTrigger className="bg-background border-input text-foreground"><SelectValue placeholder="选择风格" /></SelectTrigger>
                                        <SelectContent className="bg-popover border-border text-popover-foreground">
                                            {STYLES.map(i => <SelectItem key={i.value} value={i.value}>{i.label}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label className="text-muted-foreground text-xs">AI 模型</Label>
                                    <Select value={aiModel} onValueChange={setAiModel}>
                                        <SelectTrigger className="bg-background border-input text-foreground"><SelectValue placeholder="选择模型" /></SelectTrigger>
                                        <SelectContent className="bg-popover border-border text-popover-foreground">
                                            {AI_MODELS.map(i => <SelectItem key={i.value} value={i.value}>{i.label}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-muted-foreground text-xs">镜头语言</Label>
                                    <Select value={movement} onValueChange={setMovement}>
                                        <SelectTrigger className="bg-background border-input text-foreground"><SelectValue placeholder="选择镜头" /></SelectTrigger>
                                        <SelectContent className="bg-popover border-border text-popover-foreground">
                                            {MOVEMENTS.map(i => <SelectItem key={i.value} value={i.value}>{i.label}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label className="text-muted-foreground text-xs flex items-center gap-1">
                                        画质/分辨率
                                        <Badge variant="outline" className="text-[10px] h-4 px-1 border-blue-200 text-blue-500">自动识别</Badge>
                                    </Label>
                                    <Select value={resolution} onValueChange={setResolution} disabled>
                                        <SelectTrigger className="bg-muted border-input text-foreground opacity-100"><SelectValue placeholder="自动识别中..." /></SelectTrigger>
                                        <SelectContent className="bg-popover border-border text-popover-foreground">
                                            {RESOLUTIONS.map(i => <SelectItem key={i.value} value={i.value}>{i.label}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-muted-foreground text-xs flex items-center gap-1">
                                        比例
                                        <Badge variant="outline" className="text-[10px] h-4 px-1 border-blue-200 text-blue-500">自动识别</Badge>
                                    </Label>
                                    <Select value={ratio} onValueChange={setRatio} disabled>
                                        <SelectTrigger className="bg-muted border-input text-foreground opacity-100"><SelectValue placeholder="自动识别中..." /></SelectTrigger>
                                        <SelectContent className="bg-popover border-border text-popover-foreground">
                                            {RATIOS.map(i => <SelectItem key={i.value} value={i.value}>{i.label}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label className="text-muted-foreground text-xs flex items-center gap-1">
                                        时长
                                        <Badge variant="outline" className="text-[10px] h-4 px-1 border-blue-200 text-blue-500">自动识别</Badge>
                                    </Label>
                                    <Select value={durationTag} onValueChange={setDurationTag} disabled>
                                        <SelectTrigger className="bg-muted border-input text-foreground opacity-100"><SelectValue placeholder="自动识别中..." /></SelectTrigger>
                                        <SelectContent className="bg-popover border-border text-popover-foreground">
                                            {DURATIONS.map(i => <SelectItem key={i.value} value={i.value}>{i.label}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-muted-foreground text-xs flex items-center gap-1">
                                        帧率
                                        <span className="text-[10px] text-muted-foreground">(请手动选择)</span>
                                    </Label>
                                    <Select value={fpsTag} onValueChange={setFpsTag}>
                                        <SelectTrigger className="bg-background border-input text-foreground"><SelectValue placeholder="选择帧率" /></SelectTrigger>
                                        <SelectContent className="bg-popover border-border text-popover-foreground">
                                            {FPS_OPTIONS.map(i => <SelectItem key={i.value} value={i.value}>{i.label}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>价格 (A币)</Label>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">¥</span>
                                <Input type="number" value={price} onChange={(e) => setPrice(e.target.value)} className="pl-7" min="0" />
                            </div>
                        </div>

                        <div className="space-y-2">
                        <Label className="text-muted-foreground">标签 (输入后回车添加)</Label>
                        <div className="flex flex-wrap gap-2 mb-2 min-h-[32px]">
                            {tags.map((tag, index) => (
                                <Badge key={index} variant="secondary" className="gap-1 pr-1 bg-primary/10 hover:bg-primary/20 text-primary border-primary/20">
                                    {tag}
                                    <X className="h-3 w-3 cursor-pointer hover:text-destructive" onClick={() => removeTag(index)} />
                                </Badge>
                            ))}
                        </div>
                        <Input 
                            value={tagInput} 
                            onChange={(e) => setTagInput(e.target.value)} 
                            onKeyDown={handleTagKeyDown}
                            placeholder="例如: 4K, 自然, 延时摄影" 
                            className="bg-background border-input text-foreground" 
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

                <div className="flex justify-end gap-3 pt-6 border-t border-border">
                    <Button variant="ghost" onClick={() => { setStep(1); setFile(null); }} disabled={uploading} className="text-muted-foreground hover:text-foreground">
                        取消
                    </Button>
                    <div className="flex flex-col gap-2 w-full max-w-[200px]">
                    {uploading && <Progress value={progress} className="h-2" />}
                    <Button onClick={handleUpload} disabled={uploading} className="bg-primary hover:bg-primary/90 w-full shadow-lg shadow-primary/20">
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
                    <h3 className="text-2xl font-bold text-foreground">发布成功！</h3>
                    <p className="text-muted-foreground max-w-md">您的作品已提交审核，审核通过后将自动上架。感谢您对社区的贡献！</p>
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
                        className="border-input hover:bg-accent hover:text-accent-foreground text-muted-foreground h-11 px-8"
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