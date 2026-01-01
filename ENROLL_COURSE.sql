-- RPC: Enroll Course (Deduct Balance + Insert Enrollment)
CREATE OR REPLACE FUNCTION enroll_course(
  p_course_id BIGINT
) RETURNS void AS $$
DECLARE
  v_user_id UUID;
  v_price NUMERIC;
  v_balance NUMERIC;
  v_title TEXT;
BEGIN
  v_user_id := auth.uid();
  
  -- Check if already enrolled
  IF EXISTS (SELECT 1 FROM course_enrollments WHERE user_id = v_user_id AND course_id = p_course_id) THEN
    RETURN; -- Already enrolled, do nothing
  END IF;

  -- Get course price and title
  SELECT price, title INTO v_price, v_title FROM courses WHERE id = p_course_id;
  
  -- If free, just enroll
  IF v_price <= 0 THEN
    INSERT INTO course_enrollments (user_id, course_id) VALUES (v_user_id, p_course_id);
    -- Update students count
    UPDATE courses SET students_count = students_count + 1 WHERE id = p_course_id;
    RETURN;
  END IF;

  -- Check balance
  SELECT balance INTO v_balance FROM profiles WHERE id = v_user_id;
  
  IF v_balance < v_price THEN
    RAISE EXCEPTION 'Insufficient balance';
  END IF;
  
  -- Deduct balance
  UPDATE profiles 
  SET balance = balance - v_price 
  WHERE id = v_user_id;
  
  -- Record transaction
  INSERT INTO transactions (user_id, amount, type, description)
  VALUES (v_user_id, -v_price, 'purchase', '购买课程: ' || v_title);
  
  -- Enroll
  INSERT INTO course_enrollments (user_id, course_id) VALUES (v_user_id, p_course_id);
  
  -- Update students count
  UPDATE courses SET students_count = students_count + 1 WHERE id = p_course_id;
  
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
