-- Phase 1: Update current ZMA balance to match Zinc dashboard ($349.39)
UPDATE zma_accounts 
SET 
  account_balance = 349.39,
  last_balance_check = NOW(),
  updated_at = NOW()
WHERE is_default = true;

-- Create audit log table for manual balance updates
CREATE TABLE IF NOT EXISTS zma_balance_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id UUID REFERENCES auth.users(id) NOT NULL,
  account_id UUID REFERENCES zma_accounts(id) NOT NULL,
  previous_balance DECIMAL(10,2),
  new_balance DECIMAL(10,2) NOT NULL,
  update_source TEXT NOT NULL DEFAULT 'manual', -- 'manual', 'api', 'automatic'
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on audit log
ALTER TABLE zma_balance_audit_log ENABLE ROW LEVEL SECURITY;

-- Allow employees to read audit logs
CREATE POLICY "Employees can view balance audit logs"
  ON zma_balance_audit_log FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.user_type = 'employee'
    )
  );

-- Function to manually update ZMA balance with audit trail
CREATE OR REPLACE FUNCTION update_zma_balance_manual(
  p_new_balance DECIMAL(10,2),
  p_notes TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_old_balance DECIMAL(10,2);
  v_admin_id UUID;
  v_account_id UUID;
  v_result JSON;
BEGIN
  -- Get current user
  v_admin_id := auth.uid();
  
  -- Verify user is employee
  IF NOT EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = v_admin_id 
    AND user_type = 'employee'
  ) THEN
    RAISE EXCEPTION 'Unauthorized: Only employees can manually update ZMA balance';
  END IF;
  
  -- Get current balance and account ID for default account
  SELECT id, account_balance INTO v_account_id, v_old_balance
  FROM zma_accounts
  WHERE is_default = true;
  
  IF v_account_id IS NULL THEN
    RAISE EXCEPTION 'No default ZMA account found';
  END IF;
  
  -- Update balance
  UPDATE zma_accounts
  SET 
    account_balance = p_new_balance,
    last_balance_check = NOW(),
    updated_at = NOW()
  WHERE id = v_account_id;
  
  -- Create audit log entry
  INSERT INTO zma_balance_audit_log (
    admin_user_id,
    account_id,
    previous_balance,
    new_balance,
    update_source,
    notes
  ) VALUES (
    v_admin_id,
    v_account_id,
    v_old_balance,
    p_new_balance,
    'manual',
    COALESCE(p_notes, 'Manual balance sync from Zinc dashboard')
  );
  
  -- Return result
  v_result := json_build_object(
    'success', true,
    'old_balance', v_old_balance,
    'new_balance', p_new_balance,
    'account_id', v_account_id,
    'updated_by', v_admin_id,
    'updated_at', NOW()
  );
  
  RETURN v_result;
END;
$$;