-- Create RPC function for token-based invitation acceptance
-- This handles cases where users sign up with a different email than they were invited with

CREATE OR REPLACE FUNCTION public.accept_invitation_by_token(p_user_id uuid, p_token text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_connection_id uuid;
  v_sender_id uuid;
BEGIN
  -- Find and update the connection by token
  UPDATE user_connections
  SET 
    connected_user_id = p_user_id, 
    status = 'accepted', 
    updated_at = NOW()
  WHERE 
    invitation_token = p_token 
    AND status = 'pending_invitation'
  RETURNING id, user_id INTO v_connection_id, v_sender_id;
  
  IF v_connection_id IS NULL THEN
    -- No matching pending invitation found
    RETURN jsonb_build_object('linked', false, 'reason', 'no_matching_invitation');
  END IF;
  
  -- Log the successful linking
  RAISE LOG '[accept_invitation_by_token] Successfully linked connection % for user %', v_connection_id, p_user_id;
  
  -- Also link any auto-gifting rules associated with this connection
  UPDATE auto_gifting_rules
  SET 
    recipient_id = p_user_id,
    pending_recipient_email = NULL,
    updated_at = NOW()
  WHERE 
    user_id = v_sender_id 
    AND pending_recipient_email = (
      SELECT pending_recipient_email 
      FROM user_connections 
      WHERE id = v_connection_id
    );
  
  RETURN jsonb_build_object(
    'linked', true, 
    'connection_id', v_connection_id,
    'sender_id', v_sender_id
  );
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.accept_invitation_by_token(uuid, text) TO authenticated;