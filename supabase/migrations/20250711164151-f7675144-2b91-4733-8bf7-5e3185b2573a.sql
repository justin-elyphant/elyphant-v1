-- Check for any problematic RLS policies on group_chat_members that might cause recursion
SELECT policyname, cmd, qual, with_check 
FROM pg_policies 
WHERE schemaname = 'public' AND tablename = 'group_chat_members';

-- Check if there are any functions or policies that might be causing recursion
-- Let's look at what might be accessing group_chat_members
SELECT policyname, cmd, qual 
FROM pg_policies 
WHERE schemaname = 'public' 
AND (qual ILIKE '%group_chat_members%' OR with_check ILIKE '%group_chat_members%');