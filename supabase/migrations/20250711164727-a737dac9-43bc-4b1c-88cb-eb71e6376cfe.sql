-- Temporarily disable RLS entirely on storage.objects to see if that fixes the issue
ALTER TABLE storage.objects DISABLE ROW LEVEL SECURITY;

-- Also check if there are any triggers on storage.objects that might be causing issues
SELECT trigger_name, event_manipulation, action_statement
FROM information_schema.triggers 
WHERE event_object_schema = 'storage' AND event_object_table = 'objects';