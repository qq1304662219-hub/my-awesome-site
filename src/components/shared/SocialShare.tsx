"use client"

import { Button } from "@/components/ui/button"
import { 
  Twitter, 
  Facebook, 
  Link as LinkIcon, 
  Mail,
  MoreHorizontal
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { toast } from "sonner"

interface SocialShareProps {
  url: string
  title: string
  description?: string
}

export function SocialShare({ url, title, description }: SocialShareProps) {
  
  const handleCopyLink = () => {
    navigator.clipboard.writeText(url)
    toast.success("链接已复制到剪贴板")
  }

  const shareToTwitter = () => {
    const text = encodeURIComponent(`${title}\n${description || ''}`)
    window.open(`https://twitter.com/intent/tweet?text=${text}&url=${encodeURIComponent(url)}`, '_blank')
  }

  const shareToFacebook = () => {
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, '_blank')
  }
  
  const shareToWeibo = () => {
     const text = encodeURIComponent(`${title} - ${description || ''}`)
     window.open(`http://service.weibo.com/share/share.php?url=${encodeURIComponent(url)}&title=${text}`, '_blank')
  }

  return (
    <div className="flex items-center gap-2">
      <Button variant="outline" size="icon" onClick={handleCopyLink} className="rounded-full bg-white/5 border-white/10 hover:bg-white/10 text-gray-300">
        <LinkIcon className="h-4 w-4" />
      </Button>
      
      <Button variant="outline" size="icon" onClick={shareToTwitter} className="rounded-full bg-white/5 border-white/10 hover:bg-[#1DA1F2]/20 hover:text-[#1DA1F2] text-gray-300 transition-colors">
        <Twitter className="h-4 w-4" />
      </Button>
      
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="icon" className="rounded-full bg-white/5 border-white/10 hover:bg-white/10 text-gray-300">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="bg-[#1a1f2e] border-white/10 text-gray-300">
          <DropdownMenuItem onClick={shareToFacebook} className="hover:bg-white/10 cursor-pointer">
            <Facebook className="mr-2 h-4 w-4" /> Facebook
          </DropdownMenuItem>
          <DropdownMenuItem onClick={shareToWeibo} className="hover:bg-white/10 cursor-pointer">
            <span className="mr-2 h-4 w-4 flex items-center justify-center font-bold text-xs">wb</span> 微博
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => window.location.href = `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(url)}`} className="hover:bg-white/10 cursor-pointer">
            <Mail className="mr-2 h-4 w-4" /> 邮件分享
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
