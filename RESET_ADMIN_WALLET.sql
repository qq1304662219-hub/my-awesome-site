-- ==============================================================================
-- Reset Wallet Script for Super Admin (qq1304662219@gmail.com)
-- 
-- Instructions:
-- 1. Copy the content of this file.
-- 2. Go to your Supabase Dashboard -> SQL Editor.
-- 3. Paste the content and click "Run".
-- ==============================================================================

DO $$
DECLARE
    target_user_id uuid;
    target_email text := 'qq1304662219@gmail.com'; -- The super admin email identified in the codebase
BEGIN
    -- Get the user ID from auth.users
    SELECT id INTO target_user_id FROM auth.users WHERE email = target_email;

    IF target_user_id IS NOT NULL THEN
        -- 1. Delete all transactions
        -- This effectively resets "Total Revenue" (总收益) and "Total Withdrawn" (已提现)
        -- because they are calculated dynamically from the transactions table.
        DELETE FROM public.transactions WHERE user_id = target_user_id;

        -- 2. Delete all withdrawal records
        -- This clears the withdrawal requests history.
        DELETE FROM public.withdrawals WHERE user_id = target_user_id;

        -- 3. Reset profile balance to 0
        -- This resets "Account Balance" (账户余额).
        UPDATE public.profiles 
        SET balance = 0 
        WHERE id = target_user_id;

        RAISE NOTICE 'Successfully reset wallet for user: % (ID: %)', target_email, target_user_id;
        RAISE NOTICE '  - Transactions deleted: ALL';
        RAISE NOTICE '  - Withdrawals deleted: ALL';
        RAISE NOTICE '  - Balance reset to: 0';
    ELSE
        RAISE WARNING 'Target user % not found. Please verify the email address.', target_email;
    END IF;
END $$;
