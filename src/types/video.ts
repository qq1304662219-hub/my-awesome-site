export interface Video {
  id: string;
  title: string;
  description?: string;
  url?: string;
  thumbnail_url?: string;
  author?: string;
  user_id?: string;
  views?: number;
  downloads?: number;
  price?: number;
  duration?: string;
  category?: string;
  style?: string;
  ratio?: string;
  status?: 'pending' | 'published' | 'rejected';
  download_url?: string;
  tags?: string[];
  rank?: number;
  created_at?: string;
  width?: number;
  height?: number;
  profiles?: {
    full_name: string | null;
    avatar_url: string | null;
  };
  views_count?: number;
  ai_model?: string;
  prompt?: string;
  resolution?: string;
  fps?: number;
  movement?: string;
  format?: string;
  size?: number;
}
