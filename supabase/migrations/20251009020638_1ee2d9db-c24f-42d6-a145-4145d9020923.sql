-- Create admin function to delete any user account
CREATE OR REPLACE FUNCTION public.admin_delete_user_account(target_user_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  deletion_summary json;
  admin_user_id uuid;
BEGIN
  -- Get current user
  admin_user_id := auth.uid();
  
  -- CRITICAL: Verify caller is a business admin
  IF NOT public.is_business_admin(admin_user_id) THEN
    RAISE EXCEPTION 'Unauthorized: Only business administrators can delete user accounts';
  END IF;
  
  -- Log the admin deletion attempt
  INSERT INTO public.admin_audit_log (
    admin_user_id,
    action_type,
    target_type,
    target_id,
    action_details
  ) VALUES (
    admin_user_id,
    'delete_user_account',
    'user',
    target_user_id,
    jsonb_build_object(
      'deleted_by_admin', true,
      'timestamp', now()
    )
  );
  
  -- Call the existing comprehensive deletion function
  SELECT public.delete_user_account(target_user_id) INTO deletion_summary;
  
  -- Also delete from auth.users (admin privilege)
  DELETE FROM auth.users WHERE id = target_user_id;
  
  RETURN deletion_summary;
END;
$function$;

-- Grant execute permission to authenticated users (function will check admin status internally)
GRANT EXECUTE ON FUNCTION public.admin_delete_user_account(uuid) TO authenticated;