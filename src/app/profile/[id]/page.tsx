import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { supabase } from "@/lib/supabase";
import { ProfileView } from "@/components/profile/ProfileView";

export default async function ProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  // 1. Fetch Profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', id)
    .single();

  // 2. Fetch User's Videos
  const { data: videos } = await supabase
    .from('videos')
    .select('*')
    .eq('user_id', id)
    .order('created_at', { ascending: false });

  // 3. Fetch Liked Videos
  // Note: This relies on the foreign key relationship between likes.video_id and videos.id
  const { data: likedData } = await supabase
    .from('likes')
    .select(`
      video_id,
      videos:video_id (
        *,
        profiles:user_id (
          full_name,
          avatar_url
        )
      )
    `)
    .eq('user_id', id)
    .order('created_at', { ascending: false });

  const likedVideos = likedData?.map((item: any) => {
      const video = item.videos;
      if (!video) return null;
      return {
          ...video,
          author: video.profiles?.full_name || `User ${video.user_id?.slice(0, 6)}`,
          user_avatar: video.profiles?.avatar_url
      };
  }).filter(Boolean) || [];

  // Format user's videos
  const formattedVideos = (videos || []).map((video: any) => ({
    ...video,
    author: profile?.full_name || `User ${id.slice(0, 6)}`,
    user_avatar: profile?.avatar_url
  }));

  // Mock profile if not found (for early stage)
  const displayProfile = profile || {
    id: id,
    full_name: `User ${id.slice(0, 6)}`,
    avatar_url: `https://api.dicebear.com/7.x/avataaars/svg?seed=${id}`,
    bio: '这个用户很懒，什么都没写',
  };

  return (
    <div className="min-h-screen bg-[#020817] text-white flex flex-col">
      <Navbar />
      <ProfileView 
        profile={displayProfile}
        videos={formattedVideos}
        likedVideos={likedVideos}
        isOwnProfile={false} // Client component will verify this
      />
      <Footer />
    </div>
  );
}
