-- Check for triggers on storage.objects that might be causing the issue
SELECT schemaname, tablename, trigger_name, action_timing, event_manipulation, action_statement
FROM information_schema.triggers 
WHERE table_schema = 'storage' AND table_name = 'objects';

-- Check for any problematic RLS policies on group_chat_members that might cause recursion
SELECT schemaname, tablename, policyname, cmd, qual, with_check 
FROM pg_policies 
WHERE schemaname = 'public' AND tablename = 'group_chat_members';

-- Let's also check what functions might be called by storage operations
SELECT proname, prosrc 
FROM pg_proc 
WHERE proname ILIKE '%storage%' OR proname ILIKE '%object%'
LIMIT 10;