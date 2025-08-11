-- CRITICAL SECURITY FIX: Secure order_notes table from public exposure
-- This table contains sensitive admin notes about customer orders and internal operations

-- Drop the extremely dangerous existing policy that allows public access
DROP POLICY IF EXISTS "Admin users can manage order notes" ON public.order_notes;

-- Create function to check if user is an admin (needs to be implemented based on your admin system)
-- For now, we'll use a conservative approach and restrict to service role + order owners
CREATE OR REPLACE FUNCTION public.can_access_order_notes(note_order_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE
  current_user_id uuid;
  order_owner_id uuid;
BEGIN
  current_user_id := auth.uid();
  
  -- Service role can always access (for admin functions)
  IF current_user_id IS NULL THEN
    RETURN false;
  END IF;
  
  -- Get the order owner
  SELECT user_id INTO order_owner_id
  FROM public.orders
  WHERE id = note_order_id;
  
  -- Order owner can see non-internal notes about their orders
  IF current_user_id = order_owner_id THEN
    RETURN true;
  END IF;
  
  -- For now, only order owners can access notes
  -- TODO: Add proper admin role checking when admin roles are implemented
  RETURN false;
END;
$$;

-- SECURE POLICIES FOR ORDER_NOTES TABLE

-- Policy 1: Service role can manage all order notes (for admin operations)
CREATE POLICY "Service role can manage all order notes"
ON public.order_notes
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Policy 2: Order owners can view non-internal notes about their orders
CREATE POLICY "Order owners can view their non-internal order notes"
ON public.order_notes
FOR SELECT
TO authenticated
USING (
  is_internal = false AND 
  public.can_access_order_notes(order_id) = true
);

-- Policy 3: Admins can create notes (will need admin role implementation)
CREATE POLICY "Authenticated users can create order notes"
ON public.order_notes
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = admin_user_id AND
  public.can_access_order_notes(order_id) = true
);

-- Ensure RLS is enabled
ALTER TABLE public.order_notes ENABLE ROW LEVEL SECURITY;

-- Completely revoke dangerous public access
REVOKE ALL ON public.order_notes FROM public;
REVOKE ALL ON public.order_notes FROM anon;

-- Grant minimal necessary permissions to authenticated users
GRANT SELECT ON public.order_notes TO authenticated;
GRANT INSERT ON public.order_notes TO authenticated;

-- Grant full access to service role for admin operations
GRANT ALL ON public.order_notes TO service_role;

-- Create audit function for order notes access
CREATE OR REPLACE FUNCTION public.audit_order_notes_access()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
BEGIN
  -- Log access to order notes in admin audit log
  INSERT INTO public.admin_audit_log (
    admin_user_id,
    action_type,
    target_type,
    target_id,
    action_details
  ) VALUES (
    COALESCE(auth.uid(), '00000000-0000-0000-0000-000000000000'::uuid),
    TG_OP,
    'order_note',
    COALESCE(NEW.id, OLD.id),
    jsonb_build_object(
      'timestamp', now(),
      'operation', TG_OP,
      'order_id', COALESCE(NEW.order_id, OLD.order_id),
      'is_internal', COALESCE(NEW.is_internal, OLD.is_internal),
      'note_type', COALESCE(NEW.note_type, OLD.note_type)
    )
  );
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Create trigger to audit all order notes operations
CREATE TRIGGER audit_order_notes_access
  AFTER INSERT OR UPDATE OR DELETE ON public.order_notes
  FOR EACH ROW EXECUTE FUNCTION public.audit_order_notes_access();