-- Migration to add reject_withdrawal RPC

-- This function handles the rejection of a withdrawal request.
-- It:
-- 1. Verifies the caller is an admin.
-- 2. Checks if the withdrawal exists and is pending.
-- 3. Updates the withdrawal status to 'rejected'.
-- 4. Refunds the amount to the user's balance.
-- 5. Records a refund transaction.

CREATE OR REPLACE FUNCTION public.reject_withdrawal(p_withdrawal_id UUID, p_reason TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_withdrawal RECORD;
  v_user_id UUID;
  v_amount DECIMAL;
BEGIN
  -- 1. Check if executor is admin
  IF NOT EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND (role = 'admin' OR role = 'super_admin')) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  -- 2. Get withdrawal details
  SELECT * INTO v_withdrawal FROM withdrawals WHERE id = p_withdrawal_id FOR UPDATE;
  
  IF v_withdrawal IS NULL THEN
    RAISE EXCEPTION 'Withdrawal not found';
  END IF;

  IF v_withdrawal.status != 'pending' THEN
    RAISE EXCEPTION 'Withdrawal is not pending';
  END IF;

  v_user_id := v_withdrawal.user_id;
  v_amount := v_withdrawal.amount;

  -- 3. Update withdrawal status
  UPDATE withdrawals
  SET status = 'rejected'
  WHERE id = p_withdrawal_id;

  -- 4. Refund user balance
  UPDATE profiles
  SET balance = COALESCE(balance, 0) + v_amount
  WHERE id = v_user_id;

  -- 5. Record refund transaction
  INSERT INTO transactions (user_id, amount, type, description, status)
  VALUES (v_user_id, v_amount, 'refund', '提现被拒绝: ' || p_reason, 'completed');

  -- Optional: Create a notification for the user
  INSERT INTO notifications (user_id, actor_id, type, resource_id, resource_type, content, is_read)
  VALUES (
    v_user_id, 
    auth.uid(), 
    'system', 
    p_withdrawal_id::text, 
    'withdrawal', 
    '您的提现申请已被拒绝，金额已退回余额。原因: ' || p_reason, 
    false
  );

END;
$$;
