"use client"

import { useState, useRef } from "react"
import { Upload, X, FileVideo, Image as ImageIcon, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { supabase } from "@/lib/supabase"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

export function DragDropUpload({ onUploadComplete }: { onUploadComplete: () => void }) {
  const [isDragging, setIsDragging] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const fileInputRef = useRef<HTMLInputElement>(null)

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
    const files = e.dataTransfer.files
    if (files.length > 0) {
      handleUpload(files[0])
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleUpload(e.target.files[0])
    }
  }

  const handleUpload = async (file: File) => {
    if (!file) return

    // Validate file type
    if (!file.type.startsWith("video/") && !file.type.startsWith("image/")) {
      toast.error("只支持上传视频或图片文件")
      return
    }

    setIsUploading(true)
    setProgress(10)

    try {
      const user = (await supabase.auth.getUser()).data.user
      if (!user) {
        toast.error("请先登录")
        return
      }

      // Extract metadata
      let metadata = { duration: 0, width: 0, height: 0 };
      if (file.type.startsWith("video/")) {
          try {
              metadata = await new Promise((resolve) => {
                  const video = document.createElement('video');
                  video.preload = 'metadata';
                  video.onloadedmetadata = () => {
                      window.URL.revokeObjectURL(video.src);
                      resolve({
                          duration: Math.round(video.duration),
                          width: video.videoWidth,
                          height: video.videoHeight
                      });
                  };
                  video.onerror = () => resolve({ duration: 0, width: 0, height: 0 });
                  video.src = URL.createObjectURL(file);
              });
          } catch (e) {
              console.warn("Failed to extract video metadata", e);
          }
      }

      const fileExt = file.name.split(".").pop()
      // Use userId/timestamp-filename format as requested
      const fileName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`
      const filePath = `${user.id}/${fileName}`

      // 1. Upload to Storage
      const { error: uploadError } = await supabase.storage
        .from("videos")
        .upload(filePath, file)

      if (uploadError) throw uploadError

      setProgress(60)

      // 2. Get Public URL
      const { data: { publicUrl } } = supabase.storage
        .from("videos")
        .getPublicUrl(filePath)

      // 3. Save to Database
      const { error: dbError } = await supabase
        .from("videos")
        .insert({
          title: file.name.split(".")[0], // Default title from filename
          url: publicUrl,
          user_id: user.id,
          category: "Other", // Default category
          description: "Uploaded via Drag & Drop",
          size: file.size,
          format: fileExt,
          duration: metadata.duration,
          width: metadata.width,
          height: metadata.height
        })

      if (dbError) throw dbError

      setProgress(100)
      toast.success("上传成功！")
      onUploadComplete()
    } catch (error: any) {
      console.error(error)
      toast.error("上传失败: " + error.message)
    } finally {
      setIsUploading(false)
      setProgress(0)
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    }
  }

  return (
    <div
      className={cn(
        "relative group border-2 border-dashed rounded-xl p-8 transition-all duration-200 ease-in-out cursor-pointer",
        isDragging
          ? "border-blue-500 bg-blue-500/10 scale-[1.01]"
          : "border-white/10 hover:border-white/20 hover:bg-white/5",
        isUploading && "pointer-events-none opacity-50"
      )}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={() => fileInputRef.current?.click()}
    >
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        accept="video/*,image/*"
        onChange={handleFileSelect}
      />

      <div className="flex flex-col items-center justify-center gap-4 text-center">
        <div className="p-4 rounded-full bg-white/5 group-hover:bg-white/10 transition-colors">
            {isUploading ? (
                <Loader2 className="h-8 w-8 text-blue-400 animate-spin" />
            ) : (
                <Upload className="h-8 w-8 text-gray-400 group-hover:text-white transition-colors" />
            )}
        </div>
        
        <div className="space-y-1">
          <h3 className="font-semibold text-white">
            {isUploading ? "正在上传..." : "点击或拖拽上传"}
          </h3>
          <p className="text-sm text-gray-500">
            支持 JPG, PNG, MP4, WebM (最大 50MB)
          </p>
        </div>
      </div>

      {/* Progress Bar */}
      {isUploading && (
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/10 overflow-hidden rounded-b-xl">
          <div 
            className="h-full bg-blue-500 transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
    </div>
  )
}
