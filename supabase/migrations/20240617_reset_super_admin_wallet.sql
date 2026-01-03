-- Reset wallet history and balance for the super admin
-- This script clears transactions, withdrawals, and resets balance to 0 for the specified super admin email.

DO $$
DECLARE
    target_user_id uuid;
    target_email text := 'qq1304662219@gmail.com'; -- The super admin email identified in the codebase
BEGIN
    -- Get the user ID from auth.users
    SELECT id INTO target_user_id FROM auth.users WHERE email = target_email;

    IF target_user_id IS NOT NULL THEN
        -- 1. Delete all transactions (This resets Total Revenue and Total Withdrawn stats as they are calculated from transactions)
        DELETE FROM public.transactions WHERE user_id = target_user_id;

        -- 2. Delete all withdrawal records
        DELETE FROM public.withdrawals WHERE user_id = target_user_id;

        -- 3. Reset profile balance to 0
        UPDATE public.profiles 
        SET balance = 0 
        WHERE id = target_user_id;

        RAISE NOTICE 'Successfully reset wallet for user: % (ID: %)', target_email, target_user_id;
    ELSE
        RAISE WARNING 'Target user % not found. Please verify the email address.', target_email;
    END IF;
END $$;
