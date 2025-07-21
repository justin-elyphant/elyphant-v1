-- Fix infinite recursion in group_chat_members policies
-- First, create security definer functions to avoid self-referencing queries

-- Function to check if user is admin of a specific group chat
CREATE OR REPLACE FUNCTION public.is_group_admin(group_id uuid, user_id uuid)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.group_chat_members
    WHERE group_chat_id = group_id 
    AND user_id = user_id 
    AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Function to check if user is member of a specific group chat  
CREATE OR REPLACE FUNCTION public.is_group_member(group_id uuid, user_id uuid)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.group_chat_members
    WHERE group_chat_id = group_id 
    AND user_id = user_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Drop existing problematic policies
DROP POLICY IF EXISTS "Group admins can manage members" ON public.group_chat_members;
DROP POLICY IF EXISTS "Users can view group members of groups they belong to" ON public.group_chat_members;

-- Create new policies using security definer functions
CREATE POLICY "Group admins can manage members" ON public.group_chat_members
FOR ALL USING (
  public.is_group_admin(group_chat_id, auth.uid())
);

CREATE POLICY "Users can view group members of groups they belong to" ON public.group_chat_members
FOR SELECT USING (
  public.is_group_member(group_chat_id, auth.uid())
);

-- Also fix the group_chats policies that might have similar issues
DROP POLICY IF EXISTS "Group admins can update group chats" ON public.group_chats;
DROP POLICY IF EXISTS "Users can view groups they are members of" ON public.group_chats;

CREATE POLICY "Group admins can update group chats" ON public.group_chats
FOR UPDATE USING (
  public.is_group_admin(id, auth.uid())
);

CREATE POLICY "Users can view groups they are members of" ON public.group_chats
FOR SELECT USING (
  public.is_group_member(id, auth.uid())
);