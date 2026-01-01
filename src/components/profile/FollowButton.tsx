"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { supabase } from "@/lib/supabase"
import { toast } from "sonner"
import { useAuthStore } from "@/store/useAuthStore"
import { useRouter } from "next/navigation"

interface FollowButtonProps {
  authorId: string
  className?: string
}

export function FollowButton({ authorId, className }: FollowButtonProps) {
  const { user, isLoading } = useAuthStore()
  const router = useRouter()
  const [isFollowing, setIsFollowing] = useState(false)
  const [loading, setLoading] = useState(true)
  const [isOwner, setIsOwner] = useState(false)

  useEffect(() => {
    if (isLoading) return

    if (user) {
      if (user.id === authorId) {
        setIsOwner(true)
        setLoading(false)
        return
      }
      checkFollowStatus()
    } else {
      setLoading(false)
    }
  }, [user, authorId, isLoading])

  const checkFollowStatus = async () => {
    try {
      if (!user) return
      const { data } = await supabase
        .from('follows')
        .select('*')
        .eq('follower_id', user.id)
        .eq('following_id', authorId)
        .single()
      
      if (data) setIsFollowing(true)
    } catch (error) {
      console.error("Check follow status error:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleFollow = async () => {
    if (isLoading) return

    if (!user) {
      toast.error("请先登录后关注")
      router.push("/auth")
      return
    }

    if (isOwner) return

    // Optimistic update
    const newStatus = !isFollowing
    setIsFollowing(newStatus)
    toast.success(newStatus ? "关注成功" : "已取消关注")

    try {
      if (newStatus) {
        const { error } = await supabase.from('follows').insert({
          follower_id: user.id,
          following_id: authorId
        })
        if (error) throw error
      } else {
        const { error } = await supabase.from('follows').delete()
          .eq('follower_id', user.id)
          .eq('following_id', authorId)
        if (error) throw error
      }
    } catch (error) {
      // Revert
      setIsFollowing(!newStatus)
      toast.error("操作失败，请重试")
      console.error(error)
    }
  }

  if (loading) return <Button size="sm" variant="ghost" disabled className="w-16 h-8" />
  if (isOwner) return null

  return (
    <Button 
      size="sm"
      variant={isFollowing ? "secondary" : "default"}
      className={className || (isFollowing ? "bg-white/10 text-white hover:bg-white/20" : "bg-blue-600 hover:bg-blue-700 text-white")}
      onClick={handleFollow}
    >
      {isFollowing ? "已关注" : "关注"}
    </Button>
  )
}
