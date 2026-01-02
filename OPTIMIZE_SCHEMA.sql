-- 1. Add professional parameter columns to videos table
ALTER TABLE videos 
ADD COLUMN IF NOT EXISTS resolution TEXT, -- '4k', '1080p', '720p'
ADD COLUMN IF NOT EXISTS fps INTEGER, -- 24, 30, 60
ADD COLUMN IF NOT EXISTS ai_model TEXT, -- 'Sora', 'Runway', 'Pika', etc.
ADD COLUMN IF NOT EXISTS format TEXT, -- 'MP4', 'MOV'
ADD COLUMN IF NOT EXISTS size BIGINT; -- File size in bytes

-- 2. Add index for filtering performance
CREATE INDEX IF NOT EXISTS idx_videos_resolution ON videos(resolution);
CREATE INDEX IF NOT EXISTS idx_videos_fps ON videos(fps);
CREATE INDEX IF NOT EXISTS idx_videos_ai_model ON videos(ai_model);

-- 3. Create Commerce Tables if not exist
CREATE TABLE IF NOT EXISTS orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    total_amount DECIMAL(10, 2) NOT NULL,
    status TEXT DEFAULT 'pending', -- 'pending', 'completed', 'failed'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
    video_id UUID REFERENCES videos(id) ON DELETE SET NULL,
    price DECIMAL(10, 2) NOT NULL,
    license_type TEXT NOT NULL, -- 'personal', 'enterprise'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Update Transactions table
ALTER TABLE transactions 
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'completed'; -- 'pending', 'completed', 'failed'

-- 5. Handle Purchase RPC (Transactional)
CREATE OR REPLACE FUNCTION handle_purchase(
    p_user_id UUID,
    p_total_amount DECIMAL,
    p_video_ids UUID[],
    p_prices DECIMAL[],
    p_license_types TEXT[]
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_order_id UUID;
    v_balance DECIMAL;
    v_i INT;
    v_video_owner_id UUID;
BEGIN
    -- Check Balance
    SELECT balance INTO v_balance FROM profiles WHERE id = p_user_id;
    IF v_balance < p_total_amount THEN
        RAISE EXCEPTION 'Insufficient balance';
    END IF;

    -- Deduct Balance
    UPDATE profiles SET balance = balance - p_total_amount WHERE id = p_user_id;

    -- Create Order
    INSERT INTO orders (user_id, total_amount, status)
    VALUES (p_user_id, p_total_amount, 'completed')
    RETURNING id INTO v_order_id;

    -- Process Items
    FOR v_i IN 1..array_length(p_video_ids, 1) LOOP
        -- Insert Order Item
        INSERT INTO order_items (order_id, video_id, price, license_type)
        VALUES (v_order_id, p_video_ids[v_i], p_prices[v_i], p_license_types[v_i]);

        -- Get Video Owner
        SELECT user_id INTO v_video_owner_id FROM videos WHERE id = p_video_ids[v_i];

        -- Credit Owner (70% share) if not self-purchase
        IF v_video_owner_id IS NOT NULL AND v_video_owner_id != p_user_id THEN
            UPDATE profiles 
            SET balance = balance + (p_prices[v_i] * 0.7) 
            WHERE id = v_video_owner_id;

            -- Log Transaction for Owner
            INSERT INTO transactions (user_id, type, amount, status, description)
            VALUES (v_video_owner_id, 'income', p_prices[v_i] * 0.7, 'completed', 'Video Sales Revenue');
            
            -- Notify Owner
            INSERT INTO notifications (user_id, type, title, content)
            VALUES (v_video_owner_id, 'system', 'Video Sold', 'Your video has been purchased!');
        END IF;
    END LOOP;

    -- Log Transaction for Buyer
    INSERT INTO transactions (user_id, type, amount, status, description)
    VALUES (p_user_id, 'purchase', p_total_amount, 'completed', 'Video Purchase');

    RETURN v_order_id;
END;
$$;

-- 6. Backfill Mock Data for Filters
UPDATE videos 
SET 
  resolution = CASE floor(random() * 3) 
    WHEN 0 THEN '4k' 
    WHEN 1 THEN '1080p' 
    ELSE '720p' 
  END,
  fps = CASE floor(random() * 3) 
    WHEN 0 THEN 60 
    WHEN 1 THEN 30 
    ELSE 24 
  END,
  ai_model = CASE floor(random() * 5) 
    WHEN 0 THEN 'Sora' 
    WHEN 1 THEN 'Runway' 
    WHEN 2 THEN 'Pika' 
    WHEN 3 THEN 'Midjourney' 
    ELSE 'SVD' 
  END,
  style = COALESCE(style, CASE floor(random() * 6) 
    WHEN 0 THEN 'Sci-Fi' 
    WHEN 1 THEN 'Chinese' 
    WHEN 2 THEN 'Anime' 
    WHEN 3 THEN 'Realistic' 
    WHEN 4 THEN 'Abstract' 
    ELSE '3D' 
  END),
  category = COALESCE(category, CASE floor(random() * 4) 
    WHEN 0 THEN 'Live' 
    WHEN 1 THEN 'Commerce' 
    WHEN 2 THEN 'Game' 
    ELSE 'Wallpaper' 
  END),
  format = 'MP4',
  size = floor(random() * 50000000) + 10000000 -- 10MB to 60MB
WHERE resolution IS NULL;
