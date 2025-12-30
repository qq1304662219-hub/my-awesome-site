export interface Video {
  id: string | number;
  title: string;
  description?: string;
  url?: string;
  image?: string;
  author?: string;
  user_id?: string;
  views?: string | number;
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
}
