-- Create ai_models table
CREATE TABLE IF NOT EXISTS ai_models (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  icon_url TEXT,
  cover_url TEXT,
  category TEXT,
  tags TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE ai_models ENABLE ROW LEVEL SECURITY;

-- Policies for ai_models
CREATE POLICY "Public models are viewable by everyone" ON ai_models
  FOR SELECT USING (true);

CREATE POLICY "Admins can insert models" ON ai_models
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "Admins can update models" ON ai_models
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'super_admin')
    )
  );

-- Create events table
CREATE TABLE IF NOT EXISTS events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  cover_url TEXT,
  status TEXT CHECK (status IN ('active', 'upcoming', 'ended')) DEFAULT 'upcoming',
  start_date TIMESTAMP WITH TIME ZONE,
  end_date TIMESTAMP WITH TIME ZONE,
  prize_pool TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE events ENABLE ROW LEVEL SECURITY;

-- Policies for events
CREATE POLICY "Public events are viewable by everyone" ON events
  FOR SELECT USING (true);

CREATE POLICY "Admins can insert events" ON events
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "Admins can update events" ON events
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'super_admin')
    )
  );

-- Insert initial data for AI Models
INSERT INTO ai_models (name, description, category, tags) VALUES
('Sora', 'OpenAI推出的文生视频模型，支持长达60秒的高清视频生成。', 'Text-to-Video', ARRAY['Realism', '60s', 'OpenAI']),
('Runway Gen-2', 'Runway推出的多模态视频生成模型，支持文本、图像等多种输入。', 'Multi-Modal', ARRAY['Cinematic', 'Control', 'Runway']),
('Pika Labs', '专注于动画和流畅度的视频生成工具，擅长角色动画。', 'Animation', ARRAY['Discord', 'Animation', 'Pika']),
('Stable Video Diffusion', 'Stability AI推出的开源视频生成模型，基于Stable Diffusion。', 'Image-to-Video', ARRAY['Open Source', 'SVD', 'Stability AI']),
('Midjourney', '虽然主要是图像生成，但其Zoom Out和Pan功能可用于制作视频素材。', 'Image Gen', ARRAY['Artistic', 'High Quality', 'MJ']),
('DALL-E 3', 'OpenAI的图像生成模型，极其遵循提示词，适合生成视频分镜。', 'Image Gen', ARRAY['Prompt Adherence', 'OpenAI', 'DALL-E']);

-- Insert initial data for Events
INSERT INTO events (title, description, status, start_date, end_date, prize_pool) VALUES
('Sora 创意视频大赛', '使用 Sora 或类似工具创作 60s 以内的创意视频，主题不限。', 'active', NOW(), NOW() + INTERVAL '30 days', '¥50,000'),
('AI 电影预告片挑战', '制作一部虚构电影的预告片，展现你的导演才华。', 'upcoming', NOW() + INTERVAL '10 days', NOW() + INTERVAL '40 days', '¥30,000'),
('首届 AI 视频艺术节', '探索 AI 视频的艺术边界，寻找最具创意的视觉表达。', 'ended', NOW() - INTERVAL '30 days', NOW(), '¥20,000');
