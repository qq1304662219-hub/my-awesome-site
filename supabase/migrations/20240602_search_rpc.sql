-- Create a function for advanced video search
CREATE OR REPLACE FUNCTION search_videos(query_text text)
RETURNS SETOF videos
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT *
  FROM videos
  WHERE
    title ILIKE '%' || query_text || '%'
    OR description ILIKE '%' || query_text || '%'
    OR ai_model ILIKE '%' || query_text || '%'
    OR (tags IS NOT NULL AND array_to_string(tags, ',') ILIKE '%' || query_text || '%')
  ORDER BY created_at DESC;
END;
$$;

-- Grant execute permission to everyone (or authenticated users)
GRANT EXECUTE ON FUNCTION search_videos(text) TO public;
GRANT EXECUTE ON FUNCTION search_videos(text) TO anon;
GRANT EXECUTE ON FUNCTION search_videos(text) TO authenticated;
