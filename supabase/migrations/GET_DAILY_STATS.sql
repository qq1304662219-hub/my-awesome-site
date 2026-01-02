CREATE OR REPLACE FUNCTION public.get_user_daily_stats(p_user_id UUID, p_days INT DEFAULT 7)
RETURNS TABLE (date DATE, views BIGINT, downloads BIGINT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    d.date,
    SUM(d.views)::BIGINT as views,
    SUM(d.downloads)::BIGINT as downloads
  FROM public.daily_video_stats d
  JOIN public.videos v ON d.video_id = v.id
  WHERE v.user_id = p_user_id
  AND d.date >= (CURRENT_DATE - (p_days - 1) * INTERVAL '1 day')::DATE
  GROUP BY d.date
  ORDER BY d.date;
END;
$$;
