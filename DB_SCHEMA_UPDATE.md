# 数据库升级脚本 (VJ Shi 功能支持)

为了支持更高级的筛选和详情展示（类似 VJ Shi），我们需要给 `videos` 表增加一些元数据字段。

请在 Supabase 的 SQL Editor 中运行以下 SQL 代码：

```sql
-- 1. 添加元数据字段
ALTER TABLE public.videos 
ADD COLUMN IF NOT EXISTS duration NUMERIC, -- 视频时长（秒）
ADD COLUMN IF NOT EXISTS width INTEGER,    -- 宽度
ADD COLUMN IF NOT EXISTS height INTEGER,   -- 高度
ADD COLUMN IF NOT EXISTS format TEXT,      -- 格式 (mp4, mov等)
ADD COLUMN IF NOT EXISTS size INTEGER,     -- 文件大小 (bytes)
ADD COLUMN IF NOT EXISTS category TEXT;    -- 分类 (自然, 城市, 科技等)

-- 2. 为了演示，给现有数据填充一些随机值 (可选)
UPDATE public.videos 
SET 
  duration = floor(random() * 60 + 10),
  width = 1920,
  height = 1080,
  format = 'mp4',
  category = '科技'
WHERE duration IS NULL;
```
