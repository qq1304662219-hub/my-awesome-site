"use client"

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Grid, Heart, User as UserIcon, MessageSquare, Share2 } from "lucide-react";
import { VideoCard } from "@/components/shared/VideoCard";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

interface ProfileViewProps {
  profile: any;
  videos: any[];
  likedVideos: any[];
  isOwnProfile: boolean;
}

export function ProfileView({ profile, videos, likedVideos, isOwnProfile: initialIsOwnProfile }: ProfileViewProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"works" | "likes" | "about">("works");
  const [isFollowing, setIsFollowing] = useState(false);
  const [isOwner, setIsOwner] = useState(initialIsOwnProfile);
  const [followersCount, setFollowersCount] = useState(0);

  useEffect(() => {
    const checkUserAndFollowStatus = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        
        // 1. Check ownership
        if (user && user.id === profile.id) {
            setIsOwner(true);
        }

        // 2. Check follow status
        if (user && user.id !== profile.id) {
            const { data } = await supabase
                .from('follows')
                .select('*')
                .eq('follower_id', user.id)
                .eq('following_id', profile.id)
                .single();
            if (data) setIsFollowing(true);
        }

        // 3. Get followers count
        const { count } = await supabase
            .from('follows')
            .select('*', { count: 'exact', head: true })
            .eq('following_id', profile.id);
        
        if (count !== null) setFollowersCount(count);
    };
    
    checkUserAndFollowStatus();
  }, [profile.id]);

  const handleFollow = async () => {
    if (isOwner) return;
    
    // Optimistic update
    const newStatus = !isFollowing;
    setIsFollowing(newStatus);
    setFollowersCount(prev => newStatus ? prev + 1 : prev - 1);
    toast.success(newStatus ? "关注成功" : "已取消关注");

    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return; // Should prompt login

        if (newStatus) {
            await supabase.from('follows').insert({
                follower_id: user.id,
                following_id: profile.id
            });

            // Notification for Follow
            if (user.id !== profile.id) {
                await supabase.from('notifications').insert({
                    user_id: profile.id,
                    actor_id: user.id,
                    type: 'follow',
                    content: '关注了你',
                    is_read: false
                });
            }
        } else {
            await supabase.from('follows').delete()
                .eq('follower_id', user.id)
                .eq('following_id', profile.id);
        }
    } catch (error) {
        // Revert
        setIsFollowing(!newStatus);
        setFollowersCount(prev => !newStatus ? prev + 1 : prev - 1);
        toast.error("操作失败，请重试");
        console.error(error);
    }
  };

  const handleMessage = () => {
    router.push(`/dashboard/messages/${profile.id}`);
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success("链接已复制到剪贴板");
  };

  return (
    <div className="flex-1 pt-24 pb-16">
      {/* Header */}
      <div className="container mx-auto px-4 mb-16">
        <div className="flex flex-col items-center justify-center text-center space-y-4">
          <Avatar className="h-24 w-24 border-2 border-border">
            <AvatarImage src={profile.avatar_url} />
            <AvatarFallback className="bg-primary text-primary-foreground text-xl">
               {profile.full_name?.[0]?.toUpperCase() || "U"}
            </AvatarFallback>
          </Avatar>
          
          <div>
            <h1 className="text-3xl font-bold text-foreground">{profile.full_name}</h1>
            <p className="text-muted-foreground mt-2">
              {profile.bio || "这个用户很懒，什么都没写"}
            </p>
          </div>

          <div className="flex items-center gap-6 text-sm text-muted-foreground">
            <div className="flex flex-col items-center">
              <span className="text-foreground font-bold text-lg">{videos.length}</span>
              <span>作品</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-foreground font-bold text-lg">{likedVideos.length}</span>
              <span>喜欢</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-foreground font-bold text-lg">{followersCount}</span>
              <span>粉丝</span>
            </div>
          </div>

          <div className="flex gap-4">
            {isOwner ? (
               <Button variant="outline" className="border-border hover:bg-accent text-foreground">
                 编辑资料
               </Button>
            ) : (
              <>
                <Button 
                  variant={isFollowing ? "secondary" : "default"}
                  className={isFollowing ? "bg-secondary text-secondary-foreground hover:bg-secondary/80" : "bg-primary hover:bg-primary/90"}
                  onClick={handleFollow}
                >
                  {isFollowing ? "已关注" : "关注"}
                </Button>
                <Button 
                  variant="outline" 
                  className="border-border hover:bg-accent text-foreground"
                  onClick={handleMessage}
                >
                  <MessageSquare className="w-4 h-4 mr-2" />
                  私信
                </Button>
              </>
            )}
            <Button 
              variant="ghost" 
              size="icon" 
              className="text-muted-foreground hover:text-foreground hover:bg-accent"
              onClick={handleShare}
            >
              <Share2 className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Content Tabs */}
      <div className="container mx-auto px-4 border-b border-border mb-8 sticky top-16 bg-background/95 backdrop-blur z-30">
        <div className="flex justify-center gap-8">
          <button 
            onClick={() => setActiveTab("works")}
            className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors ${
              activeTab === "works" 
                ? "border-primary text-primary font-medium" 
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <Grid className="h-4 w-4" />
            作品
          </button>
          <button 
            onClick={() => setActiveTab("likes")}
            className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors ${
              activeTab === "likes" 
                ? "border-primary text-primary font-medium" 
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <Heart className="h-4 w-4" />
            喜欢
          </button>
          <button 
            onClick={() => setActiveTab("about")}
            className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors ${
              activeTab === "about" 
                ? "border-primary text-primary font-medium" 
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <UserIcon className="h-4 w-4" />
            简介
          </button>
        </div>
      </div>

      {/* Tab Content */}
      <div className="container mx-auto px-4 min-h-[400px]">
        <AnimatePresence mode="wait">
          {activeTab === "works" && (
            <motion.div
              key="works"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2 }}
            >
              {videos.length === 0 ? (
                <div className="text-center py-20 text-muted-foreground">
                  <Grid className="w-12 h-12 mx-auto mb-4 opacity-20" />
                  <p>该用户暂时没有发布作品</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {videos.map((video) => (
                    <VideoCard 
                        key={video.id}
                        {...video}
                        author={profile.full_name} // Force current profile name as author
                    />
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {activeTab === "likes" && (
            <motion.div
              key="likes"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2 }}
            >
              {likedVideos.length === 0 ? (
                <div className="text-center py-20 text-muted-foreground">
                  <Heart className="w-12 h-12 mx-auto mb-4 opacity-20" />
                  <p>还没有喜欢的视频</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {likedVideos.map((video) => (
                    <VideoCard 
                        key={video.id}
                        {...video}
                    />
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {activeTab === "about" && (
            <motion.div
              key="about"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2 }}
              className="max-w-2xl mx-auto bg-card rounded-2xl p-8 border border-border"
            >
              <h3 className="text-xl font-bold text-foreground mb-4">关于我</h3>
              <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">
                {profile.bio || "这个用户很懒，什么都没写"}
              </p>
              
              <div className="mt-8 pt-8 border-t border-border grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground block mb-1">加入时间</span>
                  <span className="text-foreground">{new Date(profile.created_at || Date.now()).toLocaleDateString()}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block mb-1">所在地</span>
                  <span className="text-foreground">未知</span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
