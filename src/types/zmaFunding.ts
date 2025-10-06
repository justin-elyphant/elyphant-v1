export interface ZMAFundingSchedule {
  id: string;
  expected_payout_date?: string;
  expected_payout_amount?: number;
  stripe_payout_id?: string;
  transferred_to_zinc: boolean;
  transfer_date?: string;
  transfer_amount?: number;
  admin_confirmed_by?: string;
  zma_balance_before?: number;
  zma_balance_after?: number;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface ZMAFundingAlert {
  id: string;
  alert_type: 'low_balance' | 'critical_balance' | 'pending_orders_waiting';
  zma_current_balance: number;
  pending_orders_value: number;
  recommended_transfer_amount: number;
  orders_count_waiting: number;
  alert_sent_at: string;
  email_sent: boolean;
  resolved_at?: string;
  resolved_by?: string;
  created_at: string;
}

export interface OrderFundingStatus {
  funding_status?: 'funded' | 'awaiting_funds' | 'funds_allocated';
  funding_hold_reason?: string;
  funding_allocated_at?: string;
  expected_funding_date?: string;
}
