"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Share2, Link, Check, Twitter, Facebook } from "lucide-react"
import { toast } from "sonner"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

interface SocialShareProps {
  url: string
  title?: string
}

export function SocialShare({ url, title = "分享视频" }: SocialShareProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      toast.success("链接已复制")
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      toast.error("复制失败")
    }
  }

  const handleShare = (platform: 'twitter' | 'facebook') => {
    let shareUrl = ''
    const text = encodeURIComponent(title)
    const href = encodeURIComponent(url)

    switch (platform) {
      case 'twitter':
        shareUrl = `https://twitter.com/intent/tweet?text=${text}&url=${href}`
        break
      case 'facebook':
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${href}`
        break
    }

    window.open(shareUrl, '_blank', 'width=600,height=400')
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="secondary" className="bg-white/10 hover:bg-white/20 border-0 text-white">
          <Share2 className="h-4 w-4 mr-2" />
          分享
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-56 bg-[#1a202c] border-white/10 text-white p-2" align="center">
        <div className="grid gap-2">
          <Button variant="ghost" className="w-full justify-start hover:bg-white/10" onClick={handleCopy}>
            {copied ? <Check className="h-4 w-4 mr-2 text-green-500" /> : <Link className="h-4 w-4 mr-2" />}
            复制链接
          </Button>
          <Button variant="ghost" className="w-full justify-start hover:bg-white/10" onClick={() => handleShare('twitter')}>
            <Twitter className="h-4 w-4 mr-2 text-blue-400" />
            分享到 Twitter
          </Button>
          <Button variant="ghost" className="w-full justify-start hover:bg-white/10" onClick={() => handleShare('facebook')}>
            <Facebook className="h-4 w-4 mr-2 text-blue-600" />
            分享到 Facebook
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  )
}
