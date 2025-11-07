export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      address_intelligence: {
        Row: {
          address_hash: string
          address_type: string | null
          analysis: Json
          coordinates: Json | null
          created_at: string
          delivery_zone_id: string | null
          id: string
          is_valid_for_delivery: boolean | null
          updated_at: string
          user_id: string
        }
        Insert: {
          address_hash: string
          address_type?: string | null
          analysis: Json
          coordinates?: Json | null
          created_at?: string
          delivery_zone_id?: string | null
          id?: string
          is_valid_for_delivery?: boolean | null
          updated_at?: string
          user_id: string
        }
        Update: {
          address_hash?: string
          address_type?: string | null
          analysis?: Json
          coordinates?: Json | null
          created_at?: string
          delivery_zone_id?: string | null
          id?: string
          is_valid_for_delivery?: boolean | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "address_intelligence_delivery_zone_id_fkey"
            columns: ["delivery_zone_id"]
            isOneToOne: false
            referencedRelation: "shipping_zones"
            referencedColumns: ["id"]
          },
        ]
      }
      address_requests: {
        Row: {
          created_at: string
          expires_at: string
          fulfilled_at: string | null
          id: string
          include_notifications: boolean
          message: string
          recipient_email: string
          recipient_id: string
          reminder_schedule: string
          requester_id: string
          shared_address: Json | null
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          expires_at?: string
          fulfilled_at?: string | null
          id?: string
          include_notifications?: boolean
          message: string
          recipient_email: string
          recipient_id: string
          reminder_schedule?: string
          requester_id: string
          shared_address?: Json | null
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          expires_at?: string
          fulfilled_at?: string | null
          id?: string
          include_notifications?: boolean
          message?: string
          recipient_email?: string
          recipient_id?: string
          reminder_schedule?: string
          requester_id?: string
          shared_address?: Json | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "address_requests_recipient_id_fkey"
            columns: ["recipient_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "address_requests_requester_id_fkey"
            columns: ["requester_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      admin_alerts: {
        Row: {
          alert_type: string
          created_at: string
          id: string
          message: string
          metadata: Json | null
          order_id: string | null
          requires_action: boolean | null
          resolved: boolean | null
          resolved_at: string | null
          resolved_by: string | null
          severity: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          alert_type: string
          created_at?: string
          id?: string
          message: string
          metadata?: Json | null
          order_id?: string | null
          requires_action?: boolean | null
          resolved?: boolean | null
          resolved_at?: string | null
          resolved_by?: string | null
          severity: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          alert_type?: string
          created_at?: string
          id?: string
          message?: string
          metadata?: Json | null
          order_id?: string | null
          requires_action?: boolean | null
          resolved?: boolean | null
          resolved_at?: string | null
          resolved_by?: string | null
          severity?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "admin_alerts_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "order_monitoring_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "admin_alerts_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      admin_audit_log: {
        Row: {
          action_details: Json
          action_type: string
          admin_user_id: string
          created_at: string
          id: string
          ip_address: string | null
          target_id: string
          target_type: string
          user_agent: string | null
        }
        Insert: {
          action_details: Json
          action_type: string
          admin_user_id: string
          created_at?: string
          id?: string
          ip_address?: string | null
          target_id: string
          target_type: string
          user_agent?: string | null
        }
        Update: {
          action_details?: Json
          action_type?: string
          admin_user_id?: string
          created_at?: string
          id?: string
          ip_address?: string | null
          target_id?: string
          target_type?: string
          user_agent?: string | null
        }
        Relationships: []
      }
      admin_security_overrides: {
        Row: {
          admin_user_id: string
          created_at: string | null
          expires_at: string | null
          id: string
          is_active: boolean | null
          override_type: string
          reason: string | null
          target_resource: string | null
          used_at: string | null
        }
        Insert: {
          admin_user_id: string
          created_at?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          override_type: string
          reason?: string | null
          target_resource?: string | null
          used_at?: string | null
        }
        Update: {
          admin_user_id?: string
          created_at?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          override_type?: string
          reason?: string | null
          target_resource?: string | null
          used_at?: string | null
        }
        Relationships: []
      }
      ai_assistants: {
        Row: {
          assistant_id: string
          created_at: string
          description: string | null
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          assistant_id: string
          created_at?: string
          description?: string | null
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          assistant_id?: string
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      ai_gift_searches: {
        Row: {
          budget_range: Json | null
          created_at: string | null
          id: string
          occasion: string | null
          recipient_data: Json | null
          results: Json | null
          search_query: string | null
          user_id: string
          was_successful: boolean | null
        }
        Insert: {
          budget_range?: Json | null
          created_at?: string | null
          id?: string
          occasion?: string | null
          recipient_data?: Json | null
          results?: Json | null
          search_query?: string | null
          user_id: string
          was_successful?: boolean | null
        }
        Update: {
          budget_range?: Json | null
          created_at?: string | null
          id?: string
          occasion?: string | null
          recipient_data?: Json | null
          results?: Json | null
          search_query?: string | null
          user_id?: string
          was_successful?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_gift_searches_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_suggestion_insights: {
        Row: {
          confidence_score: number | null
          created_at: string | null
          id: string
          insight_data: Json
          insight_type: string
          is_active: boolean | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          confidence_score?: number | null
          created_at?: string | null
          id?: string
          insight_data?: Json
          insight_type: string
          is_active?: boolean | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          confidence_score?: number | null
          created_at?: string | null
          id?: string
          insight_data?: Json
          insight_type?: string
          is_active?: boolean | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      api_keys: {
        Row: {
          created_at: string
          id: number
          key: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: number
          key: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: number
          key?: string
          user_id?: string
        }
        Relationships: []
      }
      approval_conversations: {
        Row: {
          ai_agent_source: Json
          approval_decision: string | null
          approval_token_id: string
          completed_at: string | null
          conversation_data: Json
          created_at: string
          execution_id: string
          id: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          ai_agent_source?: Json
          approval_decision?: string | null
          approval_token_id: string
          completed_at?: string | null
          conversation_data?: Json
          created_at?: string
          execution_id: string
          id?: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          ai_agent_source?: Json
          approval_decision?: string | null
          approval_token_id?: string
          completed_at?: string | null
          conversation_data?: Json
          created_at?: string
          execution_id?: string
          id?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "approval_conversations_approval_token_id_fkey"
            columns: ["approval_token_id"]
            isOneToOne: false
            referencedRelation: "email_approval_tokens"
            referencedColumns: ["id"]
          },
        ]
      }
      auth_rate_limits: {
        Row: {
          attempt_count: number | null
          blocked_until: string | null
          created_at: string | null
          event_type: string
          first_attempt_at: string | null
          id: string
          identifier: string
          last_attempt_at: string | null
          metadata: Json | null
        }
        Insert: {
          attempt_count?: number | null
          blocked_until?: string | null
          created_at?: string | null
          event_type: string
          first_attempt_at?: string | null
          id?: string
          identifier: string
          last_attempt_at?: string | null
          metadata?: Json | null
        }
        Update: {
          attempt_count?: number | null
          blocked_until?: string | null
          created_at?: string | null
          event_type?: string
          first_attempt_at?: string | null
          id?: string
          identifier?: string
          last_attempt_at?: string | null
          metadata?: Json | null
        }
        Relationships: []
      }
      auto_gift_data_access: {
        Row: {
          access_reason: string | null
          accessed_data_type: string
          accessed_user_id: string | null
          created_at: string | null
          data_points_accessed: Json | null
          execution_id: string | null
          id: string
          user_id: string
        }
        Insert: {
          access_reason?: string | null
          accessed_data_type: string
          accessed_user_id?: string | null
          created_at?: string | null
          data_points_accessed?: Json | null
          execution_id?: string | null
          id?: string
          user_id: string
        }
        Update: {
          access_reason?: string | null
          accessed_data_type?: string
          accessed_user_id?: string | null
          created_at?: string | null
          data_points_accessed?: Json | null
          execution_id?: string | null
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "auto_gift_data_access_execution_id_fkey"
            columns: ["execution_id"]
            isOneToOne: false
            referencedRelation: "automated_gift_executions"
            referencedColumns: ["id"]
          },
        ]
      }
      auto_gift_event_logs: {
        Row: {
          created_at: string
          error_message: string | null
          event_data: Json
          event_type: string
          execution_id: string | null
          expires_at: string | null
          id: string
          metadata: Json
          rule_id: string | null
          setup_token: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          event_data?: Json
          event_type: string
          execution_id?: string | null
          expires_at?: string | null
          id?: string
          metadata?: Json
          rule_id?: string | null
          setup_token?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          event_data?: Json
          event_type?: string
          execution_id?: string | null
          expires_at?: string | null
          id?: string
          metadata?: Json
          rule_id?: string | null
          setup_token?: string | null
          user_id?: string
        }
        Relationships: []
      }
      auto_gift_fulfillment_queue: {
        Row: {
          created_at: string | null
          error_message: string | null
          execution_id: string | null
          id: string
          last_attempt_at: string | null
          order_id: string | null
          retry_count: number | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          error_message?: string | null
          execution_id?: string | null
          id?: string
          last_attempt_at?: string | null
          order_id?: string | null
          retry_count?: number | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          error_message?: string | null
          execution_id?: string | null
          id?: string
          last_attempt_at?: string | null
          order_id?: string | null
          retry_count?: number | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "auto_gift_fulfillment_queue_execution_id_fkey"
            columns: ["execution_id"]
            isOneToOne: false
            referencedRelation: "automated_gift_executions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "auto_gift_fulfillment_queue_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "order_monitoring_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "auto_gift_fulfillment_queue_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      auto_gift_notifications: {
        Row: {
          created_at: string | null
          email_sent: boolean | null
          execution_id: string | null
          id: string
          is_read: boolean | null
          message: string
          notification_type: string
          title: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          email_sent?: boolean | null
          execution_id?: string | null
          id?: string
          is_read?: boolean | null
          message: string
          notification_type: string
          title: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          email_sent?: boolean | null
          execution_id?: string | null
          id?: string
          is_read?: boolean | null
          message?: string
          notification_type?: string
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "auto_gift_notifications_execution_id_fkey"
            columns: ["execution_id"]
            isOneToOne: false
            referencedRelation: "automated_gift_executions"
            referencedColumns: ["id"]
          },
        ]
      }
      auto_gift_payment_audit: {
        Row: {
          amount: number
          created_at: string | null
          currency: string | null
          error_message: string | null
          execution_id: string | null
          id: string
          payment_intent_id: string
          payment_method_id: string | null
          status: string
          stripe_response: Json | null
        }
        Insert: {
          amount: number
          created_at?: string | null
          currency?: string | null
          error_message?: string | null
          execution_id?: string | null
          id?: string
          payment_intent_id: string
          payment_method_id?: string | null
          status: string
          stripe_response?: Json | null
        }
        Update: {
          amount?: number
          created_at?: string | null
          currency?: string | null
          error_message?: string | null
          execution_id?: string | null
          id?: string
          payment_intent_id?: string
          payment_method_id?: string | null
          status?: string
          stripe_response?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "auto_gift_payment_audit_execution_id_fkey"
            columns: ["execution_id"]
            isOneToOne: false
            referencedRelation: "automated_gift_executions"
            referencedColumns: ["id"]
          },
        ]
      }
      auto_gifting_rules: {
        Row: {
          budget_limit: number | null
          created_at: string | null
          date_type: string
          event_id: string | null
          gift_message: string | null
          gift_preferences: Json | null
          gift_selection_criteria: Json | null
          id: string
          is_active: boolean | null
          notification_preferences: Json | null
          payment_method_id: string | null
          payment_method_last_verified: string | null
          payment_method_status: string | null
          payment_method_validation_error: string | null
          pending_recipient_email: string | null
          privacy_settings: Json | null
          recipient_id: string | null
          recipient_lifestyle_factors: Json | null
          relationship_context: Json | null
          scheduled_date: string | null
          seasonal_adjustment_factors: Json | null
          setup_completed_at: string | null
          setup_expires_at: string | null
          setup_token: string | null
          success_metrics: Json | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          budget_limit?: number | null
          created_at?: string | null
          date_type: string
          event_id?: string | null
          gift_message?: string | null
          gift_preferences?: Json | null
          gift_selection_criteria?: Json | null
          id?: string
          is_active?: boolean | null
          notification_preferences?: Json | null
          payment_method_id?: string | null
          payment_method_last_verified?: string | null
          payment_method_status?: string | null
          payment_method_validation_error?: string | null
          pending_recipient_email?: string | null
          privacy_settings?: Json | null
          recipient_id?: string | null
          recipient_lifestyle_factors?: Json | null
          relationship_context?: Json | null
          scheduled_date?: string | null
          seasonal_adjustment_factors?: Json | null
          setup_completed_at?: string | null
          setup_expires_at?: string | null
          setup_token?: string | null
          success_metrics?: Json | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          budget_limit?: number | null
          created_at?: string | null
          date_type?: string
          event_id?: string | null
          gift_message?: string | null
          gift_preferences?: Json | null
          gift_selection_criteria?: Json | null
          id?: string
          is_active?: boolean | null
          notification_preferences?: Json | null
          payment_method_id?: string | null
          payment_method_last_verified?: string | null
          payment_method_status?: string | null
          payment_method_validation_error?: string | null
          pending_recipient_email?: string | null
          privacy_settings?: Json | null
          recipient_id?: string | null
          recipient_lifestyle_factors?: Json | null
          relationship_context?: Json | null
          scheduled_date?: string | null
          seasonal_adjustment_factors?: Json | null
          setup_completed_at?: string | null
          setup_expires_at?: string | null
          setup_token?: string | null
          success_metrics?: Json | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "auto_gifting_rules_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "user_special_dates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "auto_gifting_rules_payment_method_id_fkey"
            columns: ["payment_method_id"]
            isOneToOne: false
            referencedRelation: "payment_methods"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "auto_gifting_rules_recipient_id_fkey"
            columns: ["recipient_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "auto_gifting_rules_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      auto_gifting_settings: {
        Row: {
          auto_approve_gifts: boolean | null
          budget_tracking: Json | null
          created_at: string | null
          default_budget_limit: number | null
          default_gift_source: string | null
          default_notification_days: number[] | null
          dynamic_budget_intelligence: Json | null
          email_notifications: boolean | null
          has_payment_method: boolean | null
          id: string
          notification_preferences: Json | null
          predictive_suggestions: Json | null
          push_notifications: boolean | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          auto_approve_gifts?: boolean | null
          budget_tracking?: Json | null
          created_at?: string | null
          default_budget_limit?: number | null
          default_gift_source?: string | null
          default_notification_days?: number[] | null
          dynamic_budget_intelligence?: Json | null
          email_notifications?: boolean | null
          has_payment_method?: boolean | null
          id?: string
          notification_preferences?: Json | null
          predictive_suggestions?: Json | null
          push_notifications?: boolean | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          auto_approve_gifts?: boolean | null
          budget_tracking?: Json | null
          created_at?: string | null
          default_budget_limit?: number | null
          default_gift_source?: string | null
          default_notification_days?: number[] | null
          dynamic_budget_intelligence?: Json | null
          email_notifications?: boolean | null
          has_payment_method?: boolean | null
          id?: string
          notification_preferences?: Json | null
          predictive_suggestions?: Json | null
          push_notifications?: boolean | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      automated_gift_executions: {
        Row: {
          address_collection_status: string | null
          address_collection_token: string | null
          address_metadata: Json | null
          ai_agent_source: Json | null
          created_at: string | null
          emergency_intelligence: Json | null
          error_message: string | null
          event_id: string | null
          execution_date: string
          id: string
          invitation_context: Json | null
          last_payment_attempt_at: string | null
          next_payment_retry_at: string | null
          next_retry_at: string | null
          order_id: string | null
          payment_confirmed_at: string | null
          payment_error_message: string | null
          payment_retry_count: number | null
          payment_status: string | null
          pending_recipient_email: string | null
          retry_count: number | null
          rule_id: string | null
          selected_products: Json | null
          status: string
          stripe_payment_intent_id: string | null
          total_amount: number | null
          updated_at: string | null
          urgency_level: number | null
          user_id: string
        }
        Insert: {
          address_collection_status?: string | null
          address_collection_token?: string | null
          address_metadata?: Json | null
          ai_agent_source?: Json | null
          created_at?: string | null
          emergency_intelligence?: Json | null
          error_message?: string | null
          event_id?: string | null
          execution_date: string
          id?: string
          invitation_context?: Json | null
          last_payment_attempt_at?: string | null
          next_payment_retry_at?: string | null
          next_retry_at?: string | null
          order_id?: string | null
          payment_confirmed_at?: string | null
          payment_error_message?: string | null
          payment_retry_count?: number | null
          payment_status?: string | null
          pending_recipient_email?: string | null
          retry_count?: number | null
          rule_id?: string | null
          selected_products?: Json | null
          status?: string
          stripe_payment_intent_id?: string | null
          total_amount?: number | null
          updated_at?: string | null
          urgency_level?: number | null
          user_id: string
        }
        Update: {
          address_collection_status?: string | null
          address_collection_token?: string | null
          address_metadata?: Json | null
          ai_agent_source?: Json | null
          created_at?: string | null
          emergency_intelligence?: Json | null
          error_message?: string | null
          event_id?: string | null
          execution_date?: string
          id?: string
          invitation_context?: Json | null
          last_payment_attempt_at?: string | null
          next_payment_retry_at?: string | null
          next_retry_at?: string | null
          order_id?: string | null
          payment_confirmed_at?: string | null
          payment_error_message?: string | null
          payment_retry_count?: number | null
          payment_status?: string | null
          pending_recipient_email?: string | null
          retry_count?: number | null
          rule_id?: string | null
          selected_products?: Json | null
          status?: string
          stripe_payment_intent_id?: string | null
          total_amount?: number | null
          updated_at?: string | null
          urgency_level?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "automated_gift_executions_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "user_special_dates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "automated_gift_executions_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "order_monitoring_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "automated_gift_executions_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "automated_gift_executions_rule_id_fkey"
            columns: ["rule_id"]
            isOneToOne: false
            referencedRelation: "auto_gifting_rules"
            referencedColumns: ["id"]
          },
        ]
      }
      birthday_email_tracking: {
        Row: {
          birthday_year: number
          created_at: string | null
          email_queue_id: string | null
          email_type: string
          id: string
          metadata: Json | null
          sent_at: string
          user_id: string
        }
        Insert: {
          birthday_year: number
          created_at?: string | null
          email_queue_id?: string | null
          email_type: string
          id?: string
          metadata?: Json | null
          sent_at?: string
          user_id: string
        }
        Update: {
          birthday_year?: number
          created_at?: string | null
          email_queue_id?: string | null
          email_type?: string
          id?: string
          metadata?: Json | null
          sent_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "birthday_email_tracking_email_queue_id_fkey"
            columns: ["email_queue_id"]
            isOneToOne: false
            referencedRelation: "email_queue"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "birthday_email_tracking_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      blocked_users: {
        Row: {
          blocked_id: string
          blocker_id: string
          created_at: string | null
          id: string
          reason: string | null
        }
        Insert: {
          blocked_id: string
          blocker_id: string
          created_at?: string | null
          id?: string
          reason?: string | null
        }
        Update: {
          blocked_id?: string
          blocker_id?: string
          created_at?: string | null
          id?: string
          reason?: string | null
        }
        Relationships: []
      }
      business_admins: {
        Row: {
          admin_level: string
          can_manage_payment_methods: boolean | null
          can_view_payment_methods: boolean | null
          created_at: string | null
          created_by: string | null
          id: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          admin_level: string
          can_manage_payment_methods?: boolean | null
          can_view_payment_methods?: boolean | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          admin_level?: string
          can_manage_payment_methods?: boolean | null
          can_view_payment_methods?: boolean | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      business_payment_methods: {
        Row: {
          card_type: string
          created_at: string
          encrypted_cvv: string
          encrypted_number: string
          exp_month: number
          exp_year: number
          id: string
          is_active: boolean
          is_default: boolean
          last_four: string
          name: string
          name_on_card: string
          updated_at: string
        }
        Insert: {
          card_type: string
          created_at?: string
          encrypted_cvv: string
          encrypted_number: string
          exp_month: number
          exp_year: number
          id?: string
          is_active?: boolean
          is_default?: boolean
          last_four: string
          name: string
          name_on_card: string
          updated_at?: string
        }
        Update: {
          card_type?: string
          created_at?: string
          encrypted_cvv?: string
          encrypted_number?: string
          exp_month?: number
          exp_year?: number
          id?: string
          is_active?: boolean
          is_default?: boolean
          last_four?: string
          name?: string
          name_on_card?: string
          updated_at?: string
        }
        Relationships: []
      }
      cart_sessions: {
        Row: {
          abandoned_at: string | null
          cart_data: Json
          checkout_initiated_at: string | null
          completed_at: string | null
          created_at: string
          id: string
          is_recovered: boolean | null
          last_recovery_email_sent: string | null
          last_updated: string
          recovery_emails_sent: number | null
          session_id: string
          total_amount: number | null
          user_id: string | null
        }
        Insert: {
          abandoned_at?: string | null
          cart_data?: Json
          checkout_initiated_at?: string | null
          completed_at?: string | null
          created_at?: string
          id?: string
          is_recovered?: boolean | null
          last_recovery_email_sent?: string | null
          last_updated?: string
          recovery_emails_sent?: number | null
          session_id: string
          total_amount?: number | null
          user_id?: string | null
        }
        Update: {
          abandoned_at?: string | null
          cart_data?: Json
          checkout_initiated_at?: string | null
          completed_at?: string | null
          created_at?: string
          id?: string
          is_recovered?: boolean | null
          last_recovery_email_sent?: string | null
          last_updated?: string
          recovery_emails_sent?: number | null
          session_id?: string
          total_amount?: number | null
          user_id?: string | null
        }
        Relationships: []
      }
      connection_nudges: {
        Row: {
          connection_id: string | null
          created_at: string
          custom_message: string | null
          delivery_status: string
          id: string
          last_nudge_sent_at: string
          next_nudge_scheduled_at: string | null
          nudge_count: number
          nudge_method: string
          nudge_type: string
          recipient_email: string
          recipient_phone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          connection_id?: string | null
          created_at?: string
          custom_message?: string | null
          delivery_status?: string
          id?: string
          last_nudge_sent_at?: string
          next_nudge_scheduled_at?: string | null
          nudge_count?: number
          nudge_method?: string
          nudge_type?: string
          recipient_email: string
          recipient_phone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          connection_id?: string | null
          created_at?: string
          custom_message?: string | null
          delivery_status?: string
          id?: string
          last_nudge_sent_at?: string
          next_nudge_scheduled_at?: string | null
          nudge_count?: number
          nudge_method?: string
          nudge_type?: string
          recipient_email?: string
          recipient_phone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      contributions: {
        Row: {
          amount: number
          campaign_id: string
          contributor_id: string
          created_at: string | null
          id: string
          is_anonymous: boolean | null
          message: string | null
          payment_intent_id: string | null
          payment_status: string
        }
        Insert: {
          amount: number
          campaign_id: string
          contributor_id: string
          created_at?: string | null
          id?: string
          is_anonymous?: boolean | null
          message?: string | null
          payment_intent_id?: string | null
          payment_status?: string
        }
        Update: {
          amount?: number
          campaign_id?: string
          contributor_id?: string
          created_at?: string | null
          id?: string
          is_anonymous?: boolean | null
          message?: string | null
          payment_intent_id?: string | null
          payment_status?: string
        }
        Relationships: [
          {
            foreignKeyName: "contributions_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "funding_campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      conversation_threads: {
        Row: {
          assistant_name: string | null
          created_at: string
          id: string
          metadata: Json | null
          session_id: string
          thread_id: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          assistant_name?: string | null
          created_at?: string
          id?: string
          metadata?: Json | null
          session_id: string
          thread_id: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          assistant_name?: string | null
          created_at?: string
          id?: string
          metadata?: Json | null
          session_id?: string
          thread_id?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      cron_execution_logs: {
        Row: {
          created_at: string | null
          cron_job_name: string
          error_message: string | null
          execution_completed_at: string | null
          execution_metadata: Json | null
          execution_started_at: string | null
          failure_count: number | null
          id: string
          orders_processed: number | null
          status: string
          success_count: number | null
        }
        Insert: {
          created_at?: string | null
          cron_job_name: string
          error_message?: string | null
          execution_completed_at?: string | null
          execution_metadata?: Json | null
          execution_started_at?: string | null
          failure_count?: number | null
          id?: string
          orders_processed?: number | null
          status?: string
          success_count?: number | null
        }
        Update: {
          created_at?: string | null
          cron_job_name?: string
          error_message?: string | null
          execution_completed_at?: string | null
          execution_metadata?: Json | null
          execution_started_at?: string | null
          failure_count?: number | null
          id?: string
          orders_processed?: number | null
          status?: string
          success_count?: number | null
        }
        Relationships: []
      }
      elyphant_amazon_credentials: {
        Row: {
          created_at: string | null
          credential_name: string
          email: string
          encrypted_password: string
          id: string
          is_active: boolean | null
          is_verified: boolean | null
          last_verified_at: string | null
          notes: string | null
          totp_2fa_key: string | null
          updated_at: string | null
          verification_code: string | null
        }
        Insert: {
          created_at?: string | null
          credential_name?: string
          email: string
          encrypted_password: string
          id?: string
          is_active?: boolean | null
          is_verified?: boolean | null
          last_verified_at?: string | null
          notes?: string | null
          totp_2fa_key?: string | null
          updated_at?: string | null
          verification_code?: string | null
        }
        Update: {
          created_at?: string | null
          credential_name?: string
          email?: string
          encrypted_password?: string
          id?: string
          is_active?: boolean | null
          is_verified?: boolean | null
          last_verified_at?: string | null
          notes?: string | null
          totp_2fa_key?: string | null
          updated_at?: string | null
          verification_code?: string | null
        }
        Relationships: []
      }
      email_analytics: {
        Row: {
          bounced_at: string | null
          clicked_at: string | null
          created_at: string
          delivery_status: string
          id: string
          opened_at: string | null
          recipient_email: string
          resend_message_id: string | null
          sent_at: string
          template_id: string | null
          template_type: string
          user_agent: string | null
        }
        Insert: {
          bounced_at?: string | null
          clicked_at?: string | null
          created_at?: string
          delivery_status?: string
          id?: string
          opened_at?: string | null
          recipient_email: string
          resend_message_id?: string | null
          sent_at?: string
          template_id?: string | null
          template_type: string
          user_agent?: string | null
        }
        Update: {
          bounced_at?: string | null
          clicked_at?: string | null
          created_at?: string
          delivery_status?: string
          id?: string
          opened_at?: string | null
          recipient_email?: string
          resend_message_id?: string | null
          sent_at?: string
          template_id?: string | null
          template_type?: string
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "email_analytics_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "email_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      email_approval_tokens: {
        Row: {
          approved_at: string | null
          approved_via: string | null
          created_at: string | null
          email_sent_at: string | null
          execution_id: string | null
          expires_at: string
          id: string
          rejected_at: string | null
          rejection_reason: string | null
          token: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          approved_at?: string | null
          approved_via?: string | null
          created_at?: string | null
          email_sent_at?: string | null
          execution_id?: string | null
          expires_at: string
          id?: string
          rejected_at?: string | null
          rejection_reason?: string | null
          token: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          approved_at?: string | null
          approved_via?: string | null
          created_at?: string | null
          email_sent_at?: string | null
          execution_id?: string | null
          expires_at?: string
          id?: string
          rejected_at?: string | null
          rejection_reason?: string | null
          token?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "email_approval_tokens_execution_id_fkey"
            columns: ["execution_id"]
            isOneToOne: false
            referencedRelation: "automated_gift_executions"
            referencedColumns: ["id"]
          },
        ]
      }
      email_delivery_logs: {
        Row: {
          created_at: string | null
          delivery_status: string
          event_data: Json | null
          id: string
          token_id: string | null
        }
        Insert: {
          created_at?: string | null
          delivery_status: string
          event_data?: Json | null
          id?: string
          token_id?: string | null
        }
        Update: {
          created_at?: string | null
          delivery_status?: string
          event_data?: Json | null
          id?: string
          token_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "email_delivery_logs_token_id_fkey"
            columns: ["token_id"]
            isOneToOne: false
            referencedRelation: "email_approval_tokens"
            referencedColumns: ["id"]
          },
        ]
      }
      email_preferences: {
        Row: {
          created_at: string
          email_type: string
          frequency: string | null
          id: string
          is_enabled: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email_type: string
          frequency?: string | null
          id?: string
          is_enabled?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          email_type?: string
          frequency?: string | null
          id?: string
          is_enabled?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      email_queue: {
        Row: {
          attempts: number
          created_at: string
          error_message: string | null
          event_type: string | null
          id: string
          max_attempts: number
          metadata: Json | null
          priority: string | null
          recipient_email: string
          recipient_name: string | null
          scheduled_for: string
          sent_at: string | null
          status: string
          template_id: string | null
          template_variables: Json | null
          updated_at: string
        }
        Insert: {
          attempts?: number
          created_at?: string
          error_message?: string | null
          event_type?: string | null
          id?: string
          max_attempts?: number
          metadata?: Json | null
          priority?: string | null
          recipient_email: string
          recipient_name?: string | null
          scheduled_for?: string
          sent_at?: string | null
          status?: string
          template_id?: string | null
          template_variables?: Json | null
          updated_at?: string
        }
        Update: {
          attempts?: number
          created_at?: string
          error_message?: string | null
          event_type?: string | null
          id?: string
          max_attempts?: number
          metadata?: Json | null
          priority?: string | null
          recipient_email?: string
          recipient_name?: string | null
          scheduled_for?: string
          sent_at?: string | null
          status?: string
          template_id?: string | null
          template_variables?: Json | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "email_queue_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "email_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      email_template_variables: {
        Row: {
          created_at: string
          default_value: string | null
          description: string | null
          id: string
          is_required: boolean
          template_id: string | null
          variable_name: string
          variable_type: string
        }
        Insert: {
          created_at?: string
          default_value?: string | null
          description?: string | null
          id?: string
          is_required?: boolean
          template_id?: string | null
          variable_name: string
          variable_type: string
        }
        Update: {
          created_at?: string
          default_value?: string | null
          description?: string | null
          id?: string
          is_required?: boolean
          template_id?: string | null
          variable_name?: string
          variable_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "email_template_variables_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "email_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      email_templates: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          html_template: string
          id: string
          is_active: boolean
          name: string
          subject_template: string
          template_type: string
          updated_at: string
          version: number
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          html_template: string
          id?: string
          is_active?: boolean
          name: string
          subject_template: string
          template_type: string
          updated_at?: string
          version?: number
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          html_template?: string
          id?: string
          is_active?: boolean
          name?: string
          subject_template?: string
          template_type?: string
          updated_at?: string
          version?: number
        }
        Relationships: []
      }
      funding_campaigns: {
        Row: {
          campaign_type: string
          created_at: string | null
          creator_id: string
          current_amount: number | null
          description: string
          end_date: string | null
          goal_amount: number
          id: string
          is_active: boolean | null
          product_id: number | null
          title: string
          updated_at: string | null
        }
        Insert: {
          campaign_type: string
          created_at?: string | null
          creator_id: string
          current_amount?: number | null
          description: string
          end_date?: string | null
          goal_amount: number
          id?: string
          is_active?: boolean | null
          product_id?: number | null
          title: string
          updated_at?: string | null
        }
        Update: {
          campaign_type?: string
          created_at?: string | null
          creator_id?: string
          current_amount?: number | null
          description?: string
          end_date?: string | null
          goal_amount?: number
          id?: string
          is_active?: boolean | null
          product_id?: number | null
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      gift_intelligence_cache: {
        Row: {
          cache_data: Json
          created_at: string | null
          expires_at: string | null
          id: string
          intelligence_type: string
          recipient_id: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          cache_data?: Json
          created_at?: string | null
          expires_at?: string | null
          id?: string
          intelligence_type: string
          recipient_id?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          cache_data?: Json
          created_at?: string | null
          expires_at?: string | null
          id?: string
          intelligence_type?: string
          recipient_id?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      gift_invitation_analytics: {
        Row: {
          auto_gift_activated_at: string | null
          completion_redirect_url: string | null
          conversion_status: string
          created_at: string
          email_clicked_at: string | null
          email_opened_at: string | null
          id: string
          invitation_sent_at: string
          invitation_type: string | null
          invited_user_id: string | null
          metadata: Json | null
          occasion: string | null
          profile_completed_at: string | null
          recipient_email: string
          recipient_name: string
          relationship_type: string
          signup_completed_at: string | null
          source_context: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          auto_gift_activated_at?: string | null
          completion_redirect_url?: string | null
          conversion_status?: string
          created_at?: string
          email_clicked_at?: string | null
          email_opened_at?: string | null
          id?: string
          invitation_sent_at?: string
          invitation_type?: string | null
          invited_user_id?: string | null
          metadata?: Json | null
          occasion?: string | null
          profile_completed_at?: string | null
          recipient_email: string
          recipient_name: string
          relationship_type?: string
          signup_completed_at?: string | null
          source_context?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          auto_gift_activated_at?: string | null
          completion_redirect_url?: string | null
          conversion_status?: string
          created_at?: string
          email_clicked_at?: string | null
          email_opened_at?: string | null
          id?: string
          invitation_sent_at?: string
          invitation_type?: string | null
          invited_user_id?: string | null
          metadata?: Json | null
          occasion?: string | null
          profile_completed_at?: string | null
          recipient_email?: string
          recipient_name?: string
          relationship_type?: string
          signup_completed_at?: string | null
          source_context?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      gift_preview_tokens: {
        Row: {
          created_at: string | null
          expires_at: string
          id: string
          order_id: string
          recipient_email: string
          token: string
          viewed_at: string | null
        }
        Insert: {
          created_at?: string | null
          expires_at?: string
          id?: string
          order_id: string
          recipient_email: string
          token: string
          viewed_at?: string | null
        }
        Update: {
          created_at?: string | null
          expires_at?: string
          id?: string
          order_id?: string
          recipient_email?: string
          token?: string
          viewed_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "gift_preview_tokens_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "order_monitoring_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gift_preview_tokens_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      gift_proposal_votes: {
        Row: {
          created_at: string | null
          id: string
          message_id: string
          updated_at: string | null
          user_id: string
          vote_type: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          message_id: string
          updated_at?: string | null
          user_id: string
          vote_type: string
        }
        Update: {
          created_at?: string | null
          id?: string
          message_id?: string
          updated_at?: string | null
          user_id?: string
          vote_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "gift_proposal_votes_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gift_proposal_votes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      gift_recommendation_analytics: {
        Row: {
          created_at: string | null
          event_data: Json | null
          event_type: string
          id: string
          recommendation_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          event_data?: Json | null
          event_type: string
          id?: string
          recommendation_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          event_data?: Json | null
          event_type?: string
          id?: string
          recommendation_id?: string
          user_id?: string
        }
        Relationships: []
      }
      gift_recommendations: {
        Row: {
          confidence_score: number | null
          created_at: string | null
          execution_id: string | null
          id: string
          recipient_id: string | null
          recommendation_data: Json
          recommendation_source: string | null
          search_context: Json
          status: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          confidence_score?: number | null
          created_at?: string | null
          execution_id?: string | null
          id?: string
          recipient_id?: string | null
          recommendation_data?: Json
          recommendation_source?: string | null
          search_context?: Json
          status?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          confidence_score?: number | null
          created_at?: string | null
          execution_id?: string | null
          id?: string
          recipient_id?: string | null
          recommendation_data?: Json
          recommendation_source?: string | null
          search_context?: Json
          status?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      gift_searches: {
        Row: {
          budget_range: string | null
          created_at: string | null
          excluded_items: Json | null
          extra_preferences: Json | null
          id: string
          occasion: string | null
          recipient_age_range: string | null
          recipient_interests: Json | null
          recipient_name: string | null
          recipient_relationship: string | null
          recipient_type: string | null
          search_results: Json | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          budget_range?: string | null
          created_at?: string | null
          excluded_items?: Json | null
          extra_preferences?: Json | null
          id?: string
          occasion?: string | null
          recipient_age_range?: string | null
          recipient_interests?: Json | null
          recipient_name?: string | null
          recipient_relationship?: string | null
          recipient_type?: string | null
          search_results?: Json | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          budget_range?: string | null
          created_at?: string | null
          excluded_items?: Json | null
          extra_preferences?: Json | null
          id?: string
          occasion?: string | null
          recipient_age_range?: string | null
          recipient_interests?: Json | null
          recipient_name?: string | null
          recipient_relationship?: string | null
          recipient_type?: string | null
          search_results?: Json | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      gift_templates: {
        Row: {
          budget_range: Json
          connection_filters: Json | null
          created_at: string
          default_message: string | null
          description: string | null
          id: string
          is_active: boolean
          last_used: string | null
          name: string
          occasion: string
          preferred_categories: string[]
          recipient_types: string[]
          recurring_schedule: Json | null
          updated_at: string
          usage_count: number
          user_id: string
        }
        Insert: {
          budget_range?: Json
          connection_filters?: Json | null
          created_at?: string
          default_message?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          last_used?: string | null
          name: string
          occasion: string
          preferred_categories?: string[]
          recipient_types?: string[]
          recurring_schedule?: Json | null
          updated_at?: string
          usage_count?: number
          user_id: string
        }
        Update: {
          budget_range?: Json
          connection_filters?: Json | null
          created_at?: string
          default_message?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          last_used?: string | null
          name?: string
          occasion?: string
          preferred_categories?: string[]
          recipient_types?: string[]
          recurring_schedule?: Json | null
          updated_at?: string
          usage_count?: number
          user_id?: string
        }
        Relationships: []
      }
      group_chat_members: {
        Row: {
          can_invite: boolean | null
          can_manage_gifts: boolean | null
          group_chat_id: string
          id: string
          joined_at: string | null
          last_seen_at: string | null
          role: string | null
          user_id: string
        }
        Insert: {
          can_invite?: boolean | null
          can_manage_gifts?: boolean | null
          group_chat_id: string
          id?: string
          joined_at?: string | null
          last_seen_at?: string | null
          role?: string | null
          user_id: string
        }
        Update: {
          can_invite?: boolean | null
          can_manage_gifts?: boolean | null
          group_chat_id?: string
          id?: string
          joined_at?: string | null
          last_seen_at?: string | null
          role?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "group_chat_members_group_chat_id_fkey"
            columns: ["group_chat_id"]
            isOneToOne: false
            referencedRelation: "group_chats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "group_chat_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      group_chats: {
        Row: {
          avatar_url: string | null
          chat_type: string | null
          created_at: string | null
          creator_id: string
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          chat_type?: string | null
          created_at?: string | null
          creator_id: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          chat_type?: string | null
          created_at?: string | null
          creator_id?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "group_chats_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      group_gift_contributions: {
        Row: {
          committed_amount: number
          contribution_status: string | null
          contributor_id: string
          created_at: string | null
          group_gift_project_id: string
          id: string
          paid_amount: number | null
          payment_date: string | null
          stripe_payment_intent_id: string | null
          updated_at: string | null
        }
        Insert: {
          committed_amount: number
          contribution_status?: string | null
          contributor_id: string
          created_at?: string | null
          group_gift_project_id: string
          id?: string
          paid_amount?: number | null
          payment_date?: string | null
          stripe_payment_intent_id?: string | null
          updated_at?: string | null
        }
        Update: {
          committed_amount?: number
          contribution_status?: string | null
          contributor_id?: string
          created_at?: string | null
          group_gift_project_id?: string
          id?: string
          paid_amount?: number | null
          payment_date?: string | null
          stripe_payment_intent_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "group_gift_contributions_contributor_id_fkey"
            columns: ["contributor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "group_gift_contributions_group_gift_project_id_fkey"
            columns: ["group_gift_project_id"]
            isOneToOne: false
            referencedRelation: "group_gift_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      group_gift_projects: {
        Row: {
          coordinator_id: string
          created_at: string | null
          current_amount: number | null
          delivery_address: Json | null
          group_chat_id: string
          id: string
          order_id: string | null
          project_name: string
          purchase_deadline: string | null
          recipient_id: string | null
          recipient_name: string | null
          status: string | null
          stripe_group_payment_intent_id: string | null
          target_amount: number
          target_product_id: string | null
          target_product_image: string | null
          target_product_name: string | null
          target_product_price: number | null
          updated_at: string | null
        }
        Insert: {
          coordinator_id: string
          created_at?: string | null
          current_amount?: number | null
          delivery_address?: Json | null
          group_chat_id: string
          id?: string
          order_id?: string | null
          project_name: string
          purchase_deadline?: string | null
          recipient_id?: string | null
          recipient_name?: string | null
          status?: string | null
          stripe_group_payment_intent_id?: string | null
          target_amount: number
          target_product_id?: string | null
          target_product_image?: string | null
          target_product_name?: string | null
          target_product_price?: number | null
          updated_at?: string | null
        }
        Update: {
          coordinator_id?: string
          created_at?: string | null
          current_amount?: number | null
          delivery_address?: Json | null
          group_chat_id?: string
          id?: string
          order_id?: string | null
          project_name?: string
          purchase_deadline?: string | null
          recipient_id?: string | null
          recipient_name?: string | null
          status?: string | null
          stripe_group_payment_intent_id?: string | null
          target_amount?: number
          target_product_id?: string | null
          target_product_image?: string | null
          target_product_name?: string | null
          target_product_price?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "group_gift_projects_coordinator_id_fkey"
            columns: ["coordinator_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "group_gift_projects_group_chat_id_fkey"
            columns: ["group_chat_id"]
            isOneToOne: false
            referencedRelation: "group_chats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "group_gift_projects_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "order_monitoring_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "group_gift_projects_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "group_gift_projects_recipient_id_fkey"
            columns: ["recipient_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      group_gift_tracking_access: {
        Row: {
          access_level: string | null
          can_view_delivery_address: boolean | null
          can_view_tracking: string | null
          created_at: string | null
          group_gift_project_id: string
          id: string
          notification_preferences: Json | null
          user_id: string
        }
        Insert: {
          access_level?: string | null
          can_view_delivery_address?: boolean | null
          can_view_tracking?: string | null
          created_at?: string | null
          group_gift_project_id: string
          id?: string
          notification_preferences?: Json | null
          user_id: string
        }
        Update: {
          access_level?: string | null
          can_view_delivery_address?: boolean | null
          can_view_tracking?: string | null
          created_at?: string | null
          group_gift_project_id?: string
          id?: string
          notification_preferences?: Json | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "group_gift_tracking_access_group_gift_project_id_fkey"
            columns: ["group_gift_project_id"]
            isOneToOne: false
            referencedRelation: "group_gift_projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "group_gift_tracking_access_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      invitation_context_cache: {
        Row: {
          created_at: string | null
          expires_at: string | null
          id: string
          invitation_data: Json
          proxy_intelligence: Json
          recipient_identifier: string
          relationship_context: Json
          urgency_factors: Json
          user_id: string
        }
        Insert: {
          created_at?: string | null
          expires_at?: string | null
          id?: string
          invitation_data?: Json
          proxy_intelligence?: Json
          recipient_identifier: string
          relationship_context?: Json
          urgency_factors?: Json
          user_id: string
        }
        Update: {
          created_at?: string | null
          expires_at?: string | null
          id?: string
          invitation_data?: Json
          proxy_intelligence?: Json
          recipient_identifier?: string
          relationship_context?: Json
          urgency_factors?: Json
          user_id?: string
        }
        Relationships: []
      }
      invitation_conversion_events: {
        Row: {
          created_at: string
          event_data: Json | null
          event_type: string
          id: string
          invitation_id: string
        }
        Insert: {
          created_at?: string
          event_data?: Json | null
          event_type: string
          id?: string
          invitation_id: string
        }
        Update: {
          created_at?: string
          event_data?: Json | null
          event_type?: string
          id?: string
          invitation_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "invitation_conversion_events_invitation_id_fkey"
            columns: ["invitation_id"]
            isOneToOne: false
            referencedRelation: "gift_invitation_analytics"
            referencedColumns: ["id"]
          },
        ]
      }
      invitation_rewards: {
        Row: {
          created_at: string
          earned_at: string
          expires_at: string | null
          id: string
          invitation_id: string
          metadata: Json | null
          redeemed_at: string | null
          reward_description: string | null
          reward_type: string
          reward_value: number | null
          user_id: string
        }
        Insert: {
          created_at?: string
          earned_at?: string
          expires_at?: string | null
          id?: string
          invitation_id: string
          metadata?: Json | null
          redeemed_at?: string | null
          reward_description?: string | null
          reward_type: string
          reward_value?: number | null
          user_id: string
        }
        Update: {
          created_at?: string
          earned_at?: string
          expires_at?: string | null
          id?: string
          invitation_id?: string
          metadata?: Json | null
          redeemed_at?: string | null
          reward_description?: string | null
          reward_type?: string
          reward_value?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "invitation_rewards_invitation_id_fkey"
            columns: ["invitation_id"]
            isOneToOne: false
            referencedRelation: "gift_invitation_analytics"
            referencedColumns: ["id"]
          },
        ]
      }
      location_cache: {
        Row: {
          cache_data: Json
          cache_key: string
          cache_type: string
          created_at: string
          expires_at: string
          id: string
        }
        Insert: {
          cache_data: Json
          cache_key: string
          cache_type: string
          created_at?: string
          expires_at: string
          id?: string
        }
        Update: {
          cache_data?: Json
          cache_key?: string
          cache_type?: string
          created_at?: string
          expires_at?: string
          id?: string
        }
        Relationships: []
      }
      manual_processing_logs: {
        Row: {
          action_details: Json
          action_type: string
          admin_user_id: string | null
          created_at: string
          id: string
          result: Json | null
          target_order_id: string | null
        }
        Insert: {
          action_details?: Json
          action_type: string
          admin_user_id?: string | null
          created_at?: string
          id?: string
          result?: Json | null
          target_order_id?: string | null
        }
        Update: {
          action_details?: Json
          action_type?: string
          admin_user_id?: string | null
          created_at?: string
          id?: string
          result?: Json | null
          target_order_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "manual_processing_logs_target_order_id_fkey"
            columns: ["target_order_id"]
            isOneToOne: false
            referencedRelation: "order_monitoring_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "manual_processing_logs_target_order_id_fkey"
            columns: ["target_order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      message_mentions: {
        Row: {
          created_at: string | null
          id: string
          mentioned_user_id: string
          message_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          mentioned_user_id: string
          message_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          mentioned_user_id?: string
          message_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "message_mentions_mentioned_user_id_fkey"
            columns: ["mentioned_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "message_mentions_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
        ]
      }
      message_rate_limits: {
        Row: {
          is_rate_limited: boolean | null
          last_message_date: string | null
          last_message_time: string | null
          messages_sent_today: number | null
          rate_limit_expires_at: string | null
          user_id: string
        }
        Insert: {
          is_rate_limited?: boolean | null
          last_message_date?: string | null
          last_message_time?: string | null
          messages_sent_today?: number | null
          rate_limit_expires_at?: string | null
          user_id: string
        }
        Update: {
          is_rate_limited?: boolean | null
          last_message_date?: string | null
          last_message_time?: string | null
          messages_sent_today?: number | null
          rate_limit_expires_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      messages: {
        Row: {
          attachment_name: string | null
          attachment_type: string | null
          attachment_url: string | null
          content: string
          created_at: string | null
          delivery_status: string | null
          group_chat_id: string | null
          id: string
          is_gift_proposal: boolean | null
          is_read: boolean | null
          mentioned_users: string[] | null
          message_parent_id: string | null
          message_thread_id: string | null
          message_type: string | null
          poll_data: Json | null
          product_link_id: number | null
          proposal_data: Json | null
          reactions: Json | null
          recipient_id: string
          reply_to_id: string | null
          sender_id: string
          wishlist_link_id: string | null
        }
        Insert: {
          attachment_name?: string | null
          attachment_type?: string | null
          attachment_url?: string | null
          content: string
          created_at?: string | null
          delivery_status?: string | null
          group_chat_id?: string | null
          id?: string
          is_gift_proposal?: boolean | null
          is_read?: boolean | null
          mentioned_users?: string[] | null
          message_parent_id?: string | null
          message_thread_id?: string | null
          message_type?: string | null
          poll_data?: Json | null
          product_link_id?: number | null
          proposal_data?: Json | null
          reactions?: Json | null
          recipient_id: string
          reply_to_id?: string | null
          sender_id: string
          wishlist_link_id?: string | null
        }
        Update: {
          attachment_name?: string | null
          attachment_type?: string | null
          attachment_url?: string | null
          content?: string
          created_at?: string | null
          delivery_status?: string | null
          group_chat_id?: string | null
          id?: string
          is_gift_proposal?: boolean | null
          is_read?: boolean | null
          mentioned_users?: string[] | null
          message_parent_id?: string | null
          message_thread_id?: string | null
          message_type?: string | null
          poll_data?: Json | null
          product_link_id?: number | null
          proposal_data?: Json | null
          reactions?: Json | null
          recipient_id?: string
          reply_to_id?: string | null
          sender_id?: string
          wishlist_link_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "messages_group_chat_id_fkey"
            columns: ["group_chat_id"]
            isOneToOne: false
            referencedRelation: "group_chats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_message_parent_id_fkey"
            columns: ["message_parent_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_reply_to_id_fkey"
            columns: ["reply_to_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
        ]
      }
      nicole_discovery_log: {
        Row: {
          completed_at: string | null
          confidence_metrics: Json | null
          contact_method: string | null
          conversation_summary: string | null
          created_at: string
          data_collected: Json | null
          discovery_status: string
          discovery_trigger: string
          id: string
          recipient_email: string | null
          recipient_id: string | null
          recipient_phone: string | null
          related_execution_id: string | null
          related_rule_id: string | null
          timeline_events: Json | null
          updated_at: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          confidence_metrics?: Json | null
          contact_method?: string | null
          conversation_summary?: string | null
          created_at?: string
          data_collected?: Json | null
          discovery_status?: string
          discovery_trigger: string
          id?: string
          recipient_email?: string | null
          recipient_id?: string | null
          recipient_phone?: string | null
          related_execution_id?: string | null
          related_rule_id?: string | null
          timeline_events?: Json | null
          updated_at?: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          confidence_metrics?: Json | null
          contact_method?: string | null
          conversation_summary?: string | null
          created_at?: string
          data_collected?: Json | null
          discovery_status?: string
          discovery_trigger?: string
          id?: string
          recipient_email?: string | null
          recipient_id?: string | null
          recipient_phone?: string | null
          related_execution_id?: string | null
          related_rule_id?: string | null
          timeline_events?: Json | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      offline_message_queue: {
        Row: {
          attachment_name: string | null
          attachment_type: string | null
          attachment_url: string | null
          content: string
          error_message: string | null
          id: string
          last_retry_at: string | null
          max_retries: number | null
          message_type: string | null
          queued_at: string | null
          recipient_id: string
          retry_count: number | null
          status: string | null
          user_id: string
        }
        Insert: {
          attachment_name?: string | null
          attachment_type?: string | null
          attachment_url?: string | null
          content: string
          error_message?: string | null
          id?: string
          last_retry_at?: string | null
          max_retries?: number | null
          message_type?: string | null
          queued_at?: string | null
          recipient_id: string
          retry_count?: number | null
          status?: string | null
          user_id: string
        }
        Update: {
          attachment_name?: string | null
          attachment_type?: string | null
          attachment_url?: string | null
          content?: string
          error_message?: string | null
          id?: string
          last_retry_at?: string | null
          max_retries?: number | null
          message_type?: string | null
          queued_at?: string | null
          recipient_id?: string
          retry_count?: number | null
          status?: string | null
          user_id?: string
        }
        Relationships: []
      }
      order_email_events: {
        Row: {
          email_type: string
          error_message: string | null
          id: string
          order_id: string | null
          recipient_email: string
          resend_message_id: string | null
          sent_at: string
          status: string
          template_id: string | null
          template_variables: Json | null
        }
        Insert: {
          email_type: string
          error_message?: string | null
          id?: string
          order_id?: string | null
          recipient_email: string
          resend_message_id?: string | null
          sent_at?: string
          status?: string
          template_id?: string | null
          template_variables?: Json | null
        }
        Update: {
          email_type?: string
          error_message?: string | null
          id?: string
          order_id?: string | null
          recipient_email?: string
          resend_message_id?: string | null
          sent_at?: string
          status?: string
          template_id?: string | null
          template_variables?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "order_email_events_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "order_monitoring_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_email_events_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_email_events_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "email_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      order_group_contributors: {
        Row: {
          contribution_amount: number
          contributor_id: string
          created_at: string | null
          id: string
          order_id: string
          stripe_payment_intent_id: string
        }
        Insert: {
          contribution_amount: number
          contributor_id: string
          created_at?: string | null
          id?: string
          order_id: string
          stripe_payment_intent_id: string
        }
        Update: {
          contribution_amount?: number
          contributor_id?: string
          created_at?: string | null
          id?: string
          order_id?: string
          stripe_payment_intent_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "order_group_contributors_contributor_id_fkey"
            columns: ["contributor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_group_contributors_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "order_monitoring_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_group_contributors_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      order_items: {
        Row: {
          created_at: string
          delivery_group_id: string | null
          id: string
          order_id: string | null
          product_id: string
          product_image: string | null
          product_name: string
          quantity: number
          recipient_connection_id: string | null
          recipient_gift_message: string | null
          scheduled_delivery_date: string | null
          selected_variations: Json | null
          total_price: number
          unit_price: number
          variation_text: string | null
          vendor: string | null
        }
        Insert: {
          created_at?: string
          delivery_group_id?: string | null
          id?: string
          order_id?: string | null
          product_id: string
          product_image?: string | null
          product_name: string
          quantity?: number
          recipient_connection_id?: string | null
          recipient_gift_message?: string | null
          scheduled_delivery_date?: string | null
          selected_variations?: Json | null
          total_price: number
          unit_price: number
          variation_text?: string | null
          vendor?: string | null
        }
        Update: {
          created_at?: string
          delivery_group_id?: string | null
          id?: string
          order_id?: string | null
          product_id?: string
          product_image?: string | null
          product_name?: string
          quantity?: number
          recipient_connection_id?: string | null
          recipient_gift_message?: string | null
          scheduled_delivery_date?: string | null
          selected_variations?: Json | null
          total_price?: number
          unit_price?: number
          variation_text?: string | null
          vendor?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "order_monitoring_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_recipient_connection_id_fkey"
            columns: ["recipient_connection_id"]
            isOneToOne: false
            referencedRelation: "user_connections"
            referencedColumns: ["id"]
          },
        ]
      }
      order_notes: {
        Row: {
          admin_user_id: string
          created_at: string
          id: string
          is_internal: boolean
          note_content: string
          note_type: string
          order_id: string
          updated_at: string
        }
        Insert: {
          admin_user_id: string
          created_at?: string
          id?: string
          is_internal?: boolean
          note_content: string
          note_type?: string
          order_id: string
          updated_at?: string
        }
        Update: {
          admin_user_id?: string
          created_at?: string
          id?: string
          is_internal?: boolean
          note_content?: string
          note_type?: string
          order_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "order_notes_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "order_monitoring_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_notes_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      order_recovery_logs: {
        Row: {
          created_at: string
          error_message: string | null
          id: string
          metadata: Json | null
          order_id: string
          recovery_attempts: number | null
          recovery_status: string
          recovery_type: string
          resolved_at: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          id?: string
          metadata?: Json | null
          order_id: string
          recovery_attempts?: number | null
          recovery_status?: string
          recovery_type: string
          resolved_at?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          id?: string
          metadata?: Json | null
          order_id?: string
          recovery_attempts?: number | null
          recovery_status?: string
          recovery_type?: string
          resolved_at?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      order_status_monitoring: {
        Row: {
          alert_sent: boolean | null
          alert_sent_at: string | null
          created_at: string
          current_status: string
          escalation_level: number | null
          expected_status: string
          id: string
          metadata: Json | null
          order_id: string
          status_changed_at: string | null
          updated_at: string
        }
        Insert: {
          alert_sent?: boolean | null
          alert_sent_at?: string | null
          created_at?: string
          current_status: string
          escalation_level?: number | null
          expected_status: string
          id?: string
          metadata?: Json | null
          order_id: string
          status_changed_at?: string | null
          updated_at?: string
        }
        Update: {
          alert_sent?: boolean | null
          alert_sent_at?: string | null
          created_at?: string
          current_status?: string
          escalation_level?: number | null
          expected_status?: string
          id?: string
          metadata?: Json | null
          order_id?: string
          status_changed_at?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      orders: {
        Row: {
          billing_info: Json | null
          cancellation_reason: string | null
          cancelled_at: string | null
          cart_data: Json | null
          cart_session_id: string | null
          confirmation_email_sent: boolean | null
          created_at: string
          currency: string
          delivery_group_id: string | null
          delivery_groups: Json | null
          expected_funding_date: string | null
          followup_email_sent: boolean | null
          funding_allocated_at: string | null
          funding_hold_reason: string | null
          funding_source: string | null
          funding_status: string | null
          gift_message: string | null
          gift_options: Json | null
          gift_preview_viewed: boolean | null
          gift_preview_viewed_at: string | null
          gift_scheduling_options: Json | null
          gifting_fee: number | null
          gifting_fee_description: string | null
          gifting_fee_name: string | null
          group_gift_project_id: string | null
          has_multiple_recipients: boolean | null
          hold_for_scheduled_delivery: boolean | null
          id: string
          is_gift: boolean | null
          is_split_order: boolean | null
          is_surprise_gift: boolean | null
          last_processing_attempt: string | null
          last_zinc_update: string | null
          merchant_tracking_data: Json | null
          next_retry_at: string | null
          order_method: string | null
          order_number: string
          parent_order_id: string | null
          payment_confirmation_sent: boolean | null
          payment_status: string | null
          processing_attempts: number | null
          retry_count: number | null
          retry_reason: string | null
          scheduled_delivery_date: string | null
          shipping_cost: number
          shipping_info: Json
          split_order_index: number | null
          status: string
          status_update_emails_sent: Json | null
          stripe_payment_intent_id: string | null
          stripe_session_id: string | null
          subtotal: number
          tax_amount: number
          thank_you_sent: boolean | null
          thank_you_sent_at: string | null
          total_amount: number
          total_split_orders: number | null
          tracking_number: string | null
          updated_at: string
          user_id: string | null
          webhook_token: string | null
          zinc_order_id: string | null
          zinc_scheduled_processing_date: string | null
          zinc_status: string | null
          zinc_timeline_events: Json | null
          zma_account_used: string | null
          zma_error: string | null
          zma_order_id: string | null
        }
        Insert: {
          billing_info?: Json | null
          cancellation_reason?: string | null
          cancelled_at?: string | null
          cart_data?: Json | null
          cart_session_id?: string | null
          confirmation_email_sent?: boolean | null
          created_at?: string
          currency?: string
          delivery_group_id?: string | null
          delivery_groups?: Json | null
          expected_funding_date?: string | null
          followup_email_sent?: boolean | null
          funding_allocated_at?: string | null
          funding_hold_reason?: string | null
          funding_source?: string | null
          funding_status?: string | null
          gift_message?: string | null
          gift_options?: Json | null
          gift_preview_viewed?: boolean | null
          gift_preview_viewed_at?: string | null
          gift_scheduling_options?: Json | null
          gifting_fee?: number | null
          gifting_fee_description?: string | null
          gifting_fee_name?: string | null
          group_gift_project_id?: string | null
          has_multiple_recipients?: boolean | null
          hold_for_scheduled_delivery?: boolean | null
          id?: string
          is_gift?: boolean | null
          is_split_order?: boolean | null
          is_surprise_gift?: boolean | null
          last_processing_attempt?: string | null
          last_zinc_update?: string | null
          merchant_tracking_data?: Json | null
          next_retry_at?: string | null
          order_method?: string | null
          order_number: string
          parent_order_id?: string | null
          payment_confirmation_sent?: boolean | null
          payment_status?: string | null
          processing_attempts?: number | null
          retry_count?: number | null
          retry_reason?: string | null
          scheduled_delivery_date?: string | null
          shipping_cost?: number
          shipping_info: Json
          split_order_index?: number | null
          status?: string
          status_update_emails_sent?: Json | null
          stripe_payment_intent_id?: string | null
          stripe_session_id?: string | null
          subtotal: number
          tax_amount?: number
          thank_you_sent?: boolean | null
          thank_you_sent_at?: string | null
          total_amount: number
          total_split_orders?: number | null
          tracking_number?: string | null
          updated_at?: string
          user_id?: string | null
          webhook_token?: string | null
          zinc_order_id?: string | null
          zinc_scheduled_processing_date?: string | null
          zinc_status?: string | null
          zinc_timeline_events?: Json | null
          zma_account_used?: string | null
          zma_error?: string | null
          zma_order_id?: string | null
        }
        Update: {
          billing_info?: Json | null
          cancellation_reason?: string | null
          cancelled_at?: string | null
          cart_data?: Json | null
          cart_session_id?: string | null
          confirmation_email_sent?: boolean | null
          created_at?: string
          currency?: string
          delivery_group_id?: string | null
          delivery_groups?: Json | null
          expected_funding_date?: string | null
          followup_email_sent?: boolean | null
          funding_allocated_at?: string | null
          funding_hold_reason?: string | null
          funding_source?: string | null
          funding_status?: string | null
          gift_message?: string | null
          gift_options?: Json | null
          gift_preview_viewed?: boolean | null
          gift_preview_viewed_at?: string | null
          gift_scheduling_options?: Json | null
          gifting_fee?: number | null
          gifting_fee_description?: string | null
          gifting_fee_name?: string | null
          group_gift_project_id?: string | null
          has_multiple_recipients?: boolean | null
          hold_for_scheduled_delivery?: boolean | null
          id?: string
          is_gift?: boolean | null
          is_split_order?: boolean | null
          is_surprise_gift?: boolean | null
          last_processing_attempt?: string | null
          last_zinc_update?: string | null
          merchant_tracking_data?: Json | null
          next_retry_at?: string | null
          order_method?: string | null
          order_number?: string
          parent_order_id?: string | null
          payment_confirmation_sent?: boolean | null
          payment_status?: string | null
          processing_attempts?: number | null
          retry_count?: number | null
          retry_reason?: string | null
          scheduled_delivery_date?: string | null
          shipping_cost?: number
          shipping_info?: Json
          split_order_index?: number | null
          status?: string
          status_update_emails_sent?: Json | null
          stripe_payment_intent_id?: string | null
          stripe_session_id?: string | null
          subtotal?: number
          tax_amount?: number
          thank_you_sent?: boolean | null
          thank_you_sent_at?: string | null
          total_amount?: number
          total_split_orders?: number | null
          tracking_number?: string | null
          updated_at?: string
          user_id?: string | null
          webhook_token?: string | null
          zinc_order_id?: string | null
          zinc_scheduled_processing_date?: string | null
          zinc_status?: string | null
          zinc_timeline_events?: Json | null
          zma_account_used?: string | null
          zma_error?: string | null
          zma_order_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "orders_cart_session_id_fkey"
            columns: ["cart_session_id"]
            isOneToOne: false
            referencedRelation: "cart_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_group_gift_project_id_fkey"
            columns: ["group_gift_project_id"]
            isOneToOne: false
            referencedRelation: "group_gift_projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_parent_order_id_fkey"
            columns: ["parent_order_id"]
            isOneToOne: false
            referencedRelation: "order_monitoring_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_parent_order_id_fkey"
            columns: ["parent_order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      password_reset_tokens: {
        Row: {
          created_at: string
          email: string
          expires_at: string
          id: string
          token: string
          used_at: string | null
        }
        Insert: {
          created_at?: string
          email: string
          expires_at: string
          id?: string
          token: string
          used_at?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          token?: string
          used_at?: string | null
        }
        Relationships: []
      }
      payment_intents_cache: {
        Row: {
          amount: number
          created_at: string | null
          expires_at: string | null
          id: string
          metadata: Json | null
          request_fingerprint: string
          stripe_payment_intent_id: string
          user_id: string | null
        }
        Insert: {
          amount: number
          created_at?: string | null
          expires_at?: string | null
          id?: string
          metadata?: Json | null
          request_fingerprint: string
          stripe_payment_intent_id: string
          user_id?: string | null
        }
        Update: {
          amount?: number
          created_at?: string | null
          expires_at?: string | null
          id?: string
          metadata?: Json | null
          request_fingerprint?: string
          stripe_payment_intent_id?: string
          user_id?: string | null
        }
        Relationships: []
      }
      payment_methods: {
        Row: {
          card_type: string
          created_at: string
          exp_month: number
          exp_year: number
          id: string
          is_default: boolean
          last_four: string
          stripe_payment_method_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          card_type: string
          created_at?: string
          exp_month: number
          exp_year: number
          id?: string
          is_default?: boolean
          last_four: string
          stripe_payment_method_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          card_type?: string
          created_at?: string
          exp_month?: number
          exp_year?: number
          id?: string
          is_default?: boolean
          last_four?: string
          stripe_payment_method_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      payment_verification_audit: {
        Row: {
          created_at: string
          error_details: Json | null
          id: string
          metadata: Json | null
          order_id: string
          resolved_at: string | null
          stripe_payment_intent_id: string | null
          stripe_session_id: string | null
          verification_attempts: number | null
          verification_method: string
          verification_status: string
        }
        Insert: {
          created_at?: string
          error_details?: Json | null
          id?: string
          metadata?: Json | null
          order_id: string
          resolved_at?: string | null
          stripe_payment_intent_id?: string | null
          stripe_session_id?: string | null
          verification_attempts?: number | null
          verification_method: string
          verification_status: string
        }
        Update: {
          created_at?: string
          error_details?: Json | null
          id?: string
          metadata?: Json | null
          order_id?: string
          resolved_at?: string | null
          stripe_payment_intent_id?: string | null
          stripe_session_id?: string | null
          verification_attempts?: number | null
          verification_method?: string
          verification_status?: string
        }
        Relationships: []
      }
      pending_gift_invitations: {
        Row: {
          auto_gift_rules: Json | null
          created_at: string | null
          expires_at: string | null
          gift_events: Json | null
          id: string
          invitation_sent_at: string | null
          invitation_token: string
          recipient_email: string
          recipient_name: string
          shipping_address: Json | null
          status: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          auto_gift_rules?: Json | null
          created_at?: string | null
          expires_at?: string | null
          gift_events?: Json | null
          id?: string
          invitation_sent_at?: string | null
          invitation_token: string
          recipient_email: string
          recipient_name: string
          shipping_address?: Json | null
          status?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          auto_gift_rules?: Json | null
          created_at?: string | null
          expires_at?: string | null
          gift_events?: Json | null
          id?: string
          invitation_sent_at?: string | null
          invitation_token?: string
          recipient_email?: string
          recipient_name?: string
          shipping_address?: Json | null
          status?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      pending_recipient_addresses: {
        Row: {
          collected_at: string | null
          created_at: string
          execution_id: string
          expires_at: string
          id: string
          recipient_email: string
          requested_by: string
          shipping_address: Json | null
          token: string
          updated_at: string
        }
        Insert: {
          collected_at?: string | null
          created_at?: string
          execution_id: string
          expires_at?: string
          id?: string
          recipient_email: string
          requested_by: string
          shipping_address?: Json | null
          token: string
          updated_at?: string
        }
        Update: {
          collected_at?: string | null
          created_at?: string
          execution_id?: string
          expires_at?: string
          id?: string
          recipient_email?: string
          requested_by?: string
          shipping_address?: Json | null
          token?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "pending_recipient_addresses_execution_id_fkey"
            columns: ["execution_id"]
            isOneToOne: false
            referencedRelation: "automated_gift_executions"
            referencedColumns: ["id"]
          },
        ]
      }
      popularity_scores: {
        Row: {
          created_at: string
          customer_score: number | null
          engagement_score: number | null
          final_score: number | null
          id: string
          last_calculated: string
          product_id: string
          purchase_score: number | null
          trending_score: number | null
          updated_at: string
          zinc_score: number | null
        }
        Insert: {
          created_at?: string
          customer_score?: number | null
          engagement_score?: number | null
          final_score?: number | null
          id?: string
          last_calculated?: string
          product_id: string
          purchase_score?: number | null
          trending_score?: number | null
          updated_at?: string
          zinc_score?: number | null
        }
        Update: {
          created_at?: string
          customer_score?: number | null
          engagement_score?: number | null
          final_score?: number | null
          id?: string
          last_calculated?: string
          product_id?: string
          purchase_score?: number | null
          trending_score?: number | null
          updated_at?: string
          zinc_score?: number | null
        }
        Relationships: []
      }
      pricing_settings: {
        Row: {
          applies_to: string
          created_at: string
          fee_description: string | null
          fee_display_name: string
          id: string
          is_active: boolean
          markup_percentage: number
          setting_name: string
          updated_at: string
          zinc_per_order_fee: number
        }
        Insert: {
          applies_to?: string
          created_at?: string
          fee_description?: string | null
          fee_display_name?: string
          id?: string
          is_active?: boolean
          markup_percentage?: number
          setting_name: string
          updated_at?: string
          zinc_per_order_fee?: number
        }
        Update: {
          applies_to?: string
          created_at?: string
          fee_description?: string | null
          fee_display_name?: string
          id?: string
          is_active?: boolean
          markup_percentage?: number
          setting_name?: string
          updated_at?: string
          zinc_per_order_fee?: number
        }
        Relationships: []
      }
      privacy_settings: {
        Row: {
          allow_connection_requests_from: string
          allow_message_requests: boolean | null
          block_list_visibility: string
          created_at: string | null
          id: string
          profile_visibility: string
          show_follower_count: boolean | null
          show_following_count: boolean | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          allow_connection_requests_from?: string
          allow_message_requests?: boolean | null
          block_list_visibility?: string
          created_at?: string | null
          id?: string
          profile_visibility?: string
          show_follower_count?: boolean | null
          show_following_count?: boolean | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          allow_connection_requests_from?: string
          allow_message_requests?: boolean | null
          block_list_visibility?: string
          created_at?: string | null
          id?: string
          profile_visibility?: string
          show_follower_count?: boolean | null
          show_following_count?: boolean | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      product_analytics: {
        Row: {
          created_at: string
          event_data: Json | null
          event_type: string
          id: string
          product_id: string
          session_id: string | null
          source: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          event_data?: Json | null
          event_type: string
          id?: string
          product_id: string
          session_id?: string | null
          source?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          event_data?: Json | null
          event_type?: string
          id?: string
          product_id?: string
          session_id?: string | null
          source?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      profile_completion_analytics: {
        Row: {
          completion_score: number
          created_at: string
          email_campaign_stage: string | null
          email_clicks: number | null
          email_opens: number | null
          id: string
          last_email_sent_at: string | null
          missing_elements: Json
          profile_updated_after_email: boolean | null
          updated_at: string
          user_id: string
        }
        Insert: {
          completion_score: number
          created_at?: string
          email_campaign_stage?: string | null
          email_clicks?: number | null
          email_opens?: number | null
          id?: string
          last_email_sent_at?: string | null
          missing_elements?: Json
          profile_updated_after_email?: boolean | null
          updated_at?: string
          user_id: string
        }
        Update: {
          completion_score?: number
          created_at?: string
          email_campaign_stage?: string | null
          email_clicks?: number | null
          email_opens?: number | null
          id?: string
          last_email_sent_at?: string | null
          missing_elements?: Json
          profile_updated_after_email?: boolean | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          address_last_updated: string | null
          address_verification_method: string | null
          address_verified: boolean | null
          address_verified_at: string | null
          ai_interaction_data: Json | null
          bio: string | null
          birth_year: number
          city: string | null
          created_at: string | null
          data_sharing_settings: Json | null
          dob: string | null
          email: string
          enhanced_ai_interaction_data: Json | null
          enhanced_gift_preferences: Json | null
          enhanced_gifting_history: Json | null
          first_name: string
          gift_giving_preferences: Json | null
          gift_preferences: Json | null
          gifting_history: Json | null
          has_given_gifts: boolean | null
          has_purchased: boolean | null
          has_wishlist: boolean | null
          id: string
          important_dates: Json | null
          interests: Json | null
          last_name: string
          name: string | null
          onboarding_completed: boolean | null
          profile_image: string | null
          profile_type: string | null
          shipping_address: Json | null
          signup_metadata: Json | null
          signup_source: Database["public"]["Enums"]["signup_source"] | null
          source_attribution: Json | null
          state: string | null
          updated_at: string | null
          user_type: Database["public"]["Enums"]["user_type"] | null
          username: string
          wishlists: Json | null
        }
        Insert: {
          address_last_updated?: string | null
          address_verification_method?: string | null
          address_verified?: boolean | null
          address_verified_at?: string | null
          ai_interaction_data?: Json | null
          bio?: string | null
          birth_year: number
          city?: string | null
          created_at?: string | null
          data_sharing_settings?: Json | null
          dob?: string | null
          email: string
          enhanced_ai_interaction_data?: Json | null
          enhanced_gift_preferences?: Json | null
          enhanced_gifting_history?: Json | null
          first_name: string
          gift_giving_preferences?: Json | null
          gift_preferences?: Json | null
          gifting_history?: Json | null
          has_given_gifts?: boolean | null
          has_purchased?: boolean | null
          has_wishlist?: boolean | null
          id: string
          important_dates?: Json | null
          interests?: Json | null
          last_name: string
          name?: string | null
          onboarding_completed?: boolean | null
          profile_image?: string | null
          profile_type?: string | null
          shipping_address?: Json | null
          signup_metadata?: Json | null
          signup_source?: Database["public"]["Enums"]["signup_source"] | null
          source_attribution?: Json | null
          state?: string | null
          updated_at?: string | null
          user_type?: Database["public"]["Enums"]["user_type"] | null
          username: string
          wishlists?: Json | null
        }
        Update: {
          address_last_updated?: string | null
          address_verification_method?: string | null
          address_verified?: boolean | null
          address_verified_at?: string | null
          ai_interaction_data?: Json | null
          bio?: string | null
          birth_year?: number
          city?: string | null
          created_at?: string | null
          data_sharing_settings?: Json | null
          dob?: string | null
          email?: string
          enhanced_ai_interaction_data?: Json | null
          enhanced_gift_preferences?: Json | null
          enhanced_gifting_history?: Json | null
          first_name?: string
          gift_giving_preferences?: Json | null
          gift_preferences?: Json | null
          gifting_history?: Json | null
          has_given_gifts?: boolean | null
          has_purchased?: boolean | null
          has_wishlist?: boolean | null
          id?: string
          important_dates?: Json | null
          interests?: Json | null
          last_name?: string
          name?: string | null
          onboarding_completed?: boolean | null
          profile_image?: string | null
          profile_type?: string | null
          shipping_address?: Json | null
          signup_metadata?: Json | null
          signup_source?: Database["public"]["Enums"]["signup_source"] | null
          source_attribution?: Json | null
          state?: string | null
          updated_at?: string | null
          user_type?: Database["public"]["Enums"]["user_type"] | null
          username?: string
          wishlists?: Json | null
        }
        Relationships: []
      }
      purchase_analytics: {
        Row: {
          conversion_path: Json | null
          created_at: string
          id: string
          order_id: string | null
          product_id: string
          purchase_source: string | null
          quantity: number
          total_price: number
          unit_price: number
          user_id: string | null
        }
        Insert: {
          conversion_path?: Json | null
          created_at?: string
          id?: string
          order_id?: string | null
          product_id: string
          purchase_source?: string | null
          quantity?: number
          total_price: number
          unit_price: number
          user_id?: string | null
        }
        Update: {
          conversion_path?: Json | null
          created_at?: string
          id?: string
          order_id?: string | null
          product_id?: string
          purchase_source?: string | null
          quantity?: number
          total_price?: number
          unit_price?: number
          user_id?: string | null
        }
        Relationships: []
      }
      recipient_intelligence_profiles: {
        Row: {
          confidence_level: number | null
          created_at: string | null
          data_sources: Json | null
          id: string
          invitation_context: Json | null
          is_emergency_profile: boolean | null
          last_updated: string | null
          profile_data: Json
          proxy_intelligence: Json | null
          recipient_identifier: string
          user_id: string
        }
        Insert: {
          confidence_level?: number | null
          created_at?: string | null
          data_sources?: Json | null
          id?: string
          invitation_context?: Json | null
          is_emergency_profile?: boolean | null
          last_updated?: string | null
          profile_data?: Json
          proxy_intelligence?: Json | null
          recipient_identifier: string
          user_id: string
        }
        Update: {
          confidence_level?: number | null
          created_at?: string | null
          data_sources?: Json | null
          id?: string
          invitation_context?: Json | null
          is_emergency_profile?: boolean | null
          last_updated?: string | null
          profile_data?: Json
          proxy_intelligence?: Json | null
          recipient_identifier?: string
          user_id?: string
        }
        Relationships: []
      }
      recipient_preferences: {
        Row: {
          budget_range: number[] | null
          confidence_score: number | null
          created_at: string
          id: string
          interests: string[] | null
          occasion: string | null
          preferences_data: Json | null
          recipient_name: string
          relationship: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          budget_range?: number[] | null
          confidence_score?: number | null
          created_at?: string
          id?: string
          interests?: string[] | null
          occasion?: string | null
          preferences_data?: Json | null
          recipient_name: string
          relationship?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          budget_range?: number[] | null
          confidence_score?: number | null
          created_at?: string
          id?: string
          interests?: string[] | null
          occasion?: string | null
          preferences_data?: Json | null
          recipient_name?: string
          relationship?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      recipient_profiles: {
        Row: {
          age_range: string | null
          created_at: string | null
          id: string
          interests: string[] | null
          name: string
          preferences: Json | null
          relationship: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          age_range?: string | null
          created_at?: string | null
          id?: string
          interests?: string[] | null
          name: string
          preferences?: Json | null
          relationship: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          age_range?: string | null
          created_at?: string | null
          id?: string
          interests?: string[] | null
          name?: string
          preferences?: Json | null
          relationship?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "recipient_profiles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      refund_requests: {
        Row: {
          amount: number
          created_at: string
          error_message: string | null
          id: string
          order_id: string
          processed_at: string | null
          reason: string | null
          status: string
          stripe_payment_intent_id: string | null
          stripe_refund_id: string | null
          updated_at: string
        }
        Insert: {
          amount: number
          created_at?: string
          error_message?: string | null
          id?: string
          order_id: string
          processed_at?: string | null
          reason?: string | null
          status?: string
          stripe_payment_intent_id?: string | null
          stripe_refund_id?: string | null
          updated_at?: string
        }
        Update: {
          amount?: number
          created_at?: string
          error_message?: string | null
          id?: string
          order_id?: string
          processed_at?: string | null
          reason?: string | null
          status?: string
          stripe_payment_intent_id?: string | null
          stripe_refund_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "refund_requests_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "order_monitoring_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "refund_requests_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      return_events: {
        Row: {
          created_at: string
          detected_at: string
          id: string
          order_id: string
          processed_at: string | null
          refund_amount: number | null
          return_items: Json | null
          return_reason: string | null
          return_status: string
          updated_at: string
          zinc_order_id: string | null
        }
        Insert: {
          created_at?: string
          detected_at?: string
          id?: string
          order_id: string
          processed_at?: string | null
          refund_amount?: number | null
          return_items?: Json | null
          return_reason?: string | null
          return_status: string
          updated_at?: string
          zinc_order_id?: string | null
        }
        Update: {
          created_at?: string
          detected_at?: string
          id?: string
          order_id?: string
          processed_at?: string | null
          refund_amount?: number | null
          return_items?: Json | null
          return_reason?: string | null
          return_status?: string
          updated_at?: string
          zinc_order_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "return_events_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "order_monitoring_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "return_events_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      scheduled_order_alerts: {
        Row: {
          alert_message: string
          alert_type: string
          created_at: string | null
          days_overdue: number | null
          id: string
          is_resolved: boolean | null
          metadata: Json | null
          order_id: string | null
          resolved_at: string | null
          scheduled_delivery_date: string | null
          updated_at: string
        }
        Insert: {
          alert_message: string
          alert_type: string
          created_at?: string | null
          days_overdue?: number | null
          id?: string
          is_resolved?: boolean | null
          metadata?: Json | null
          order_id?: string | null
          resolved_at?: string | null
          scheduled_delivery_date?: string | null
          updated_at?: string
        }
        Update: {
          alert_message?: string
          alert_type?: string
          created_at?: string | null
          days_overdue?: number | null
          id?: string
          is_resolved?: boolean | null
          metadata?: Json | null
          order_id?: string | null
          resolved_at?: string | null
          scheduled_delivery_date?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      security_anomalies: {
        Row: {
          anomaly_type: string
          created_at: string
          details: Json | null
          id: string
          resolved: boolean | null
          resolved_at: string | null
          risk_score: number
          session_id: string | null
          user_id: string
        }
        Insert: {
          anomaly_type: string
          created_at?: string
          details?: Json | null
          id?: string
          resolved?: boolean | null
          resolved_at?: string | null
          risk_score?: number
          session_id?: string | null
          user_id: string
        }
        Update: {
          anomaly_type?: string
          created_at?: string
          details?: Json | null
          id?: string
          resolved?: boolean | null
          resolved_at?: string | null
          risk_score?: number
          session_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "security_anomalies_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "user_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      security_audit: {
        Row: {
          access_granted: boolean
          context: Json | null
          created_at: string | null
          function_name: string
          id: string
          user_id: string | null
        }
        Insert: {
          access_granted: boolean
          context?: Json | null
          created_at?: string | null
          function_name: string
          id?: string
          user_id?: string | null
        }
        Update: {
          access_granted?: boolean
          context?: Json | null
          created_at?: string | null
          function_name?: string
          id?: string
          user_id?: string | null
        }
        Relationships: []
      }
      security_logs: {
        Row: {
          created_at: string | null
          details: Json
          event_type: string
          id: string
          ip_address: unknown
          risk_level: string | null
          session_id: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          details?: Json
          event_type: string
          id?: string
          ip_address?: unknown
          risk_level?: string | null
          session_id?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          details?: Json
          event_type?: string
          id?: string
          ip_address?: unknown
          risk_level?: string | null
          session_id?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      shipping_zones: {
        Row: {
          coordinates: Json
          created_at: string
          delivery_time_minutes: number
          id: string
          is_active: boolean
          name: string
          shipping_cost_multiplier: number
          updated_at: string
        }
        Insert: {
          coordinates: Json
          created_at?: string
          delivery_time_minutes?: number
          id?: string
          is_active?: boolean
          name: string
          shipping_cost_multiplier?: number
          updated_at?: string
        }
        Update: {
          coordinates?: Json
          created_at?: string
          delivery_time_minutes?: number
          id?: string
          is_active?: boolean
          name?: string
          shipping_cost_multiplier?: number
          updated_at?: string
        }
        Relationships: []
      }
      sms_messages: {
        Row: {
          created_at: string | null
          delivery_status: string | null
          direction: string
          id: string
          message_content: string
          phone_number: string
          temporary_giftee_id: string | null
          twilio_message_sid: string | null
        }
        Insert: {
          created_at?: string | null
          delivery_status?: string | null
          direction: string
          id?: string
          message_content: string
          phone_number: string
          temporary_giftee_id?: string | null
          twilio_message_sid?: string | null
        }
        Update: {
          created_at?: string | null
          delivery_status?: string | null
          direction?: string
          id?: string
          message_content?: string
          phone_number?: string
          temporary_giftee_id?: string | null
          twilio_message_sid?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sms_messages_temporary_giftee_id_fkey"
            columns: ["temporary_giftee_id"]
            isOneToOne: false
            referencedRelation: "temporary_giftee_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      temporary_giftee_profiles: {
        Row: {
          created_at: string | null
          expires_at: string | null
          gift_date: string | null
          giftor_user_id: string
          id: string
          is_completed: boolean | null
          occasion: string | null
          phone_number: string
          preferences_collected: Json | null
          recipient_name: string | null
          relationship: string | null
          sms_conversation_state: Json | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          expires_at?: string | null
          gift_date?: string | null
          giftor_user_id: string
          id?: string
          is_completed?: boolean | null
          occasion?: string | null
          phone_number: string
          preferences_collected?: Json | null
          recipient_name?: string | null
          relationship?: string | null
          sms_conversation_state?: Json | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          expires_at?: string | null
          gift_date?: string | null
          giftor_user_id?: string
          id?: string
          is_completed?: boolean | null
          occasion?: string | null
          phone_number?: string
          preferences_collected?: Json | null
          recipient_name?: string | null
          relationship?: string | null
          sms_conversation_state?: Json | null
          updated_at?: string | null
        }
        Relationships: []
      }
      trusted_devices: {
        Row: {
          created_at: string | null
          device_fingerprint: string
          device_name: string
          id: string
          last_used_at: string | null
          trusted_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          device_fingerprint: string
          device_name: string
          id?: string
          last_used_at?: string | null
          trusted_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          device_fingerprint?: string
          device_name?: string
          id?: string
          last_used_at?: string | null
          trusted_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      typing_indicators: {
        Row: {
          chat_with_user_id: string
          created_at: string | null
          id: string
          is_typing: boolean | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          chat_with_user_id: string
          created_at?: string | null
          id?: string
          is_typing?: boolean | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          chat_with_user_id?: string
          created_at?: string | null
          id?: string
          is_typing?: boolean | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_addresses: {
        Row: {
          address: Json
          created_at: string | null
          id: string
          is_default: boolean | null
          name: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          address: Json
          created_at?: string | null
          id?: string
          is_default?: boolean | null
          name: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          address?: Json
          created_at?: string | null
          id?: string
          is_default?: boolean | null
          name?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_addresses_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_carts: {
        Row: {
          cart_data: Json
          created_at: string
          expires_at: string
          id: string
          session_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          cart_data?: Json
          created_at?: string
          expires_at?: string
          id?: string
          session_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          cart_data?: Json
          created_at?: string
          expires_at?: string
          id?: string
          session_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_connections: {
        Row: {
          blocked_at: string | null
          blocked_by: string | null
          connected_user_id: string | null
          created_at: string | null
          data_access_permissions: Json
          follow_type: string | null
          gift_message: string | null
          gift_occasion: string | null
          has_pending_gift: boolean | null
          id: string
          invitation_reminder_count: number | null
          invitation_sent_at: string | null
          invitation_token: string | null
          last_reminder_sent_at: string | null
          pending_recipient_dob: string | null
          pending_recipient_email: string | null
          pending_recipient_name: string | null
          pending_recipient_phone: string | null
          pending_shipping_address: Json | null
          relationship_context: Json | null
          relationship_type: string
          status: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          blocked_at?: string | null
          blocked_by?: string | null
          connected_user_id?: string | null
          created_at?: string | null
          data_access_permissions?: Json
          follow_type?: string | null
          gift_message?: string | null
          gift_occasion?: string | null
          has_pending_gift?: boolean | null
          id?: string
          invitation_reminder_count?: number | null
          invitation_sent_at?: string | null
          invitation_token?: string | null
          last_reminder_sent_at?: string | null
          pending_recipient_dob?: string | null
          pending_recipient_email?: string | null
          pending_recipient_name?: string | null
          pending_recipient_phone?: string | null
          pending_shipping_address?: Json | null
          relationship_context?: Json | null
          relationship_type: string
          status?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          blocked_at?: string | null
          blocked_by?: string | null
          connected_user_id?: string | null
          created_at?: string | null
          data_access_permissions?: Json
          follow_type?: string | null
          gift_message?: string | null
          gift_occasion?: string | null
          has_pending_gift?: boolean | null
          id?: string
          invitation_reminder_count?: number | null
          invitation_sent_at?: string | null
          invitation_token?: string | null
          last_reminder_sent_at?: string | null
          pending_recipient_dob?: string | null
          pending_recipient_email?: string | null
          pending_recipient_name?: string | null
          pending_recipient_phone?: string | null
          pending_shipping_address?: Json | null
          relationship_context?: Json | null
          relationship_type?: string
          status?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_connections_connected_user_id_fkey"
            columns: ["connected_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_connections_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_interaction_events: {
        Row: {
          created_at: string
          event_data: Json
          event_type: string
          id: string
          page_url: string | null
          referrer: string | null
          session_id: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          event_data?: Json
          event_type: string
          id?: string
          page_url?: string | null
          referrer?: string | null
          session_id?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          event_data?: Json
          event_type?: string
          id?: string
          page_url?: string | null
          referrer?: string | null
          session_id?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      user_notification_preferences: {
        Row: {
          created_at: string
          device_change_alerts: boolean | null
          email_notifications: boolean | null
          id: string
          location_change_alerts: boolean | null
          new_session_alerts: boolean | null
          suspicious_activity_alerts: boolean | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          device_change_alerts?: boolean | null
          email_notifications?: boolean | null
          id?: string
          location_change_alerts?: boolean | null
          new_session_alerts?: boolean | null
          suspicious_activity_alerts?: boolean | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          device_change_alerts?: boolean | null
          email_notifications?: boolean | null
          id?: string
          location_change_alerts?: boolean | null
          new_session_alerts?: boolean | null
          suspicious_activity_alerts?: boolean | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_presence: {
        Row: {
          current_activity: string | null
          last_seen: string | null
          status: string
          typing_in_chat_with: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          current_activity?: string | null
          last_seen?: string | null
          status?: string
          typing_in_chat_with?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          current_activity?: string | null
          last_seen?: string | null
          status?: string
          typing_in_chat_with?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string | null
          granted_at: string | null
          granted_by: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          granted_at?: string | null
          granted_by?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          granted_at?: string | null
          granted_by?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      user_search_history: {
        Row: {
          created_at: string
          id: string
          search_term: string
          search_type: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          search_term: string
          search_type?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          search_term?: string
          search_type?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_sessions: {
        Row: {
          created_at: string | null
          device_fingerprint: string
          expires_at: string
          id: string
          ip_address: unknown
          is_active: boolean | null
          last_activity_at: string | null
          location_data: Json | null
          session_token: string
          user_agent: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          device_fingerprint: string
          expires_at: string
          id?: string
          ip_address?: unknown
          is_active?: boolean | null
          last_activity_at?: string | null
          location_data?: Json | null
          session_token: string
          user_agent?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          device_fingerprint?: string
          expires_at?: string
          id?: string
          ip_address?: unknown
          is_active?: boolean | null
          last_activity_at?: string | null
          location_data?: Json | null
          session_token?: string
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_special_dates: {
        Row: {
          archived_at: string | null
          connection_id: string | null
          created_at: string | null
          created_by_auto_gifting: boolean | null
          date: string
          date_type: string
          end_date: string | null
          id: string
          is_modified: boolean | null
          is_recurring: boolean | null
          max_occurrences: number | null
          occurrence_number: number | null
          original_event_id: string | null
          recurring_type: string | null
          series_id: string | null
          updated_at: string | null
          user_id: string
          visibility: string
        }
        Insert: {
          archived_at?: string | null
          connection_id?: string | null
          created_at?: string | null
          created_by_auto_gifting?: boolean | null
          date: string
          date_type: string
          end_date?: string | null
          id?: string
          is_modified?: boolean | null
          is_recurring?: boolean | null
          max_occurrences?: number | null
          occurrence_number?: number | null
          original_event_id?: string | null
          recurring_type?: string | null
          series_id?: string | null
          updated_at?: string | null
          user_id: string
          visibility?: string
        }
        Update: {
          archived_at?: string | null
          connection_id?: string | null
          created_at?: string | null
          created_by_auto_gifting?: boolean | null
          date?: string
          date_type?: string
          end_date?: string | null
          id?: string
          is_modified?: boolean | null
          is_recurring?: boolean | null
          max_occurrences?: number | null
          occurrence_number?: number | null
          original_event_id?: string | null
          recurring_type?: string | null
          series_id?: string | null
          updated_at?: string | null
          user_id?: string
          visibility?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_special_dates_connection_id_fkey"
            columns: ["connection_id"]
            isOneToOne: false
            referencedRelation: "user_connections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_special_dates_original_event_id_fkey"
            columns: ["original_event_id"]
            isOneToOne: false
            referencedRelation: "user_special_dates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_special_dates_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_type_audit_log: {
        Row: {
          change_reason: string | null
          changed_by: string | null
          created_at: string | null
          id: string
          metadata: Json | null
          new_user_type: string | null
          old_user_type: string | null
          user_id: string
        }
        Insert: {
          change_reason?: string | null
          changed_by?: string | null
          created_at?: string | null
          id?: string
          metadata?: Json | null
          new_user_type?: string | null
          old_user_type?: string | null
          user_id: string
        }
        Update: {
          change_reason?: string | null
          changed_by?: string | null
          created_at?: string | null
          id?: string
          metadata?: Json | null
          new_user_type?: string | null
          old_user_type?: string | null
          user_id?: string
        }
        Relationships: []
      }
      vendor_accounts: {
        Row: {
          approval_status: string
          approved_by: string | null
          company_name: string
          contact_email: string
          created_at: string
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          approval_status?: string
          approved_by?: string | null
          company_name: string
          contact_email: string
          created_at?: string
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          approval_status?: string
          approved_by?: string | null
          company_name?: string
          contact_email?: string
          created_at?: string
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      vendor_locations: {
        Row: {
          address: Json
          coordinates: Json
          created_at: string
          id: string
          is_active: boolean
          name: string
          service_area_miles: number
          shipping_time_minutes: number
          updated_at: string
          vendor_id: string
        }
        Insert: {
          address: Json
          coordinates: Json
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          service_area_miles?: number
          shipping_time_minutes?: number
          updated_at?: string
          vendor_id: string
        }
        Update: {
          address?: Json
          coordinates?: Json
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          service_area_miles?: number
          shipping_time_minutes?: number
          updated_at?: string
          vendor_id?: string
        }
        Relationships: []
      }
      webhook_delivery_log: {
        Row: {
          created_at: string | null
          delivery_status: string
          error_message: string | null
          event_id: string | null
          event_type: string
          id: string
          metadata: Json | null
          order_id: string | null
          payment_intent_id: string | null
          processing_duration_ms: number | null
          status_code: number | null
          stripe_signature: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          delivery_status?: string
          error_message?: string | null
          event_id?: string | null
          event_type: string
          id?: string
          metadata?: Json | null
          order_id?: string | null
          payment_intent_id?: string | null
          processing_duration_ms?: number | null
          status_code?: number | null
          stripe_signature?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          delivery_status?: string
          error_message?: string | null
          event_id?: string | null
          event_type?: string
          id?: string
          metadata?: Json | null
          order_id?: string | null
          payment_intent_id?: string | null
          processing_duration_ms?: number | null
          status_code?: number | null
          stripe_signature?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      wishlist_item_purchases: {
        Row: {
          created_at: string
          id: string
          is_anonymous: boolean
          item_id: string
          order_id: string | null
          price_paid: number | null
          product_id: string
          purchased_at: string
          purchaser_name: string | null
          purchaser_user_id: string | null
          quantity: number
          updated_at: string
          wishlist_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_anonymous?: boolean
          item_id: string
          order_id?: string | null
          price_paid?: number | null
          product_id: string
          purchased_at?: string
          purchaser_name?: string | null
          purchaser_user_id?: string | null
          quantity?: number
          updated_at?: string
          wishlist_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_anonymous?: boolean
          item_id?: string
          order_id?: string | null
          price_paid?: number | null
          product_id?: string
          purchased_at?: string
          purchaser_name?: string | null
          purchaser_user_id?: string | null
          quantity?: number
          updated_at?: string
          wishlist_id?: string
        }
        Relationships: []
      }
      wishlist_items: {
        Row: {
          brand: string | null
          created_at: string | null
          description: string | null
          id: string
          image_url: string | null
          name: string | null
          price: number | null
          product_id: string
          product_source: string | null
          title: string | null
          wishlist_id: string
        }
        Insert: {
          brand?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          name?: string | null
          price?: number | null
          product_id: string
          product_source?: string | null
          title?: string | null
          wishlist_id: string
        }
        Update: {
          brand?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          name?: string | null
          price?: number | null
          product_id?: string
          product_source?: string | null
          title?: string | null
          wishlist_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wishlist_items_wishlist_id_fkey"
            columns: ["wishlist_id"]
            isOneToOne: false
            referencedRelation: "wishlists"
            referencedColumns: ["id"]
          },
        ]
      }
      wishlists: {
        Row: {
          category: string | null
          created_at: string | null
          description: string | null
          id: string
          is_public: boolean | null
          priority: string | null
          tags: Json | null
          title: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_public?: boolean | null
          priority?: string | null
          tags?: Json | null
          title: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_public?: boolean | null
          priority?: string | null
          tags?: Json | null
          title?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wishlists_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      zinc_sync_logs: {
        Row: {
          created_at: string
          error_message: string | null
          execution_time_ms: number | null
          id: string
          metadata: Json | null
          orders_checked: number | null
          orders_failed: number | null
          orders_updated: number | null
          status: string
          sync_type: string
          triggered_by: string | null
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          execution_time_ms?: number | null
          id?: string
          metadata?: Json | null
          orders_checked?: number | null
          orders_failed?: number | null
          orders_updated?: number | null
          status?: string
          sync_type: string
          triggered_by?: string | null
        }
        Update: {
          created_at?: string
          error_message?: string | null
          execution_time_ms?: number | null
          id?: string
          metadata?: Json | null
          orders_checked?: number | null
          orders_failed?: number | null
          orders_updated?: number | null
          status?: string
          sync_type?: string
          triggered_by?: string | null
        }
        Relationships: []
      }
      zma_accounts: {
        Row: {
          account_balance: number | null
          account_name: string
          account_status: string | null
          api_key: string
          created_at: string | null
          id: string
          is_default: boolean | null
          last_balance_check: string | null
          updated_at: string | null
        }
        Insert: {
          account_balance?: number | null
          account_name: string
          account_status?: string | null
          api_key: string
          created_at?: string | null
          id?: string
          is_default?: boolean | null
          last_balance_check?: string | null
          updated_at?: string | null
        }
        Update: {
          account_balance?: number | null
          account_name?: string
          account_status?: string | null
          api_key?: string
          created_at?: string | null
          id?: string
          is_default?: boolean | null
          last_balance_check?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      zma_balance_audit_log: {
        Row: {
          account_id: string
          admin_user_id: string
          created_at: string | null
          id: string
          new_balance: number
          notes: string | null
          previous_balance: number | null
          update_source: string
        }
        Insert: {
          account_id: string
          admin_user_id: string
          created_at?: string | null
          id?: string
          new_balance: number
          notes?: string | null
          previous_balance?: number | null
          update_source?: string
        }
        Update: {
          account_id?: string
          admin_user_id?: string
          created_at?: string | null
          id?: string
          new_balance?: number
          notes?: string | null
          previous_balance?: number | null
          update_source?: string
        }
        Relationships: [
          {
            foreignKeyName: "zma_balance_audit_log_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "zma_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      zma_cost_tracking: {
        Row: {
          cost_amount: number
          cost_type: string
          created_at: string | null
          daily_total: number | null
          id: string
          monthly_total: number | null
          order_id: string | null
          user_id: string
        }
        Insert: {
          cost_amount: number
          cost_type?: string
          created_at?: string | null
          daily_total?: number | null
          id?: string
          monthly_total?: number | null
          order_id?: string | null
          user_id: string
        }
        Update: {
          cost_amount?: number
          cost_type?: string
          created_at?: string | null
          daily_total?: number | null
          id?: string
          monthly_total?: number | null
          order_id?: string | null
          user_id?: string
        }
        Relationships: []
      }
      zma_funding_alerts: {
        Row: {
          alert_sent_at: string | null
          alert_type: string
          created_at: string | null
          email_sent: boolean | null
          id: string
          orders_count_waiting: number | null
          pending_orders_value: number
          recommended_transfer_amount: number
          resolved_at: string | null
          resolved_by: string | null
          zma_current_balance: number
        }
        Insert: {
          alert_sent_at?: string | null
          alert_type: string
          created_at?: string | null
          email_sent?: boolean | null
          id?: string
          orders_count_waiting?: number | null
          pending_orders_value: number
          recommended_transfer_amount: number
          resolved_at?: string | null
          resolved_by?: string | null
          zma_current_balance: number
        }
        Update: {
          alert_sent_at?: string | null
          alert_type?: string
          created_at?: string | null
          email_sent?: boolean | null
          id?: string
          orders_count_waiting?: number | null
          pending_orders_value?: number
          recommended_transfer_amount?: number
          resolved_at?: string | null
          resolved_by?: string | null
          zma_current_balance?: number
        }
        Relationships: []
      }
      zma_funding_schedule: {
        Row: {
          admin_confirmed_by: string | null
          created_at: string | null
          expected_payout_amount: number | null
          expected_payout_date: string | null
          id: string
          notes: string | null
          stripe_payout_id: string | null
          total_markup_retained: number | null
          transfer_amount: number | null
          transfer_date: string | null
          transferred_to_zinc: boolean | null
          updated_at: string | null
          zma_balance_after: number | null
          zma_balance_before: number | null
        }
        Insert: {
          admin_confirmed_by?: string | null
          created_at?: string | null
          expected_payout_amount?: number | null
          expected_payout_date?: string | null
          id?: string
          notes?: string | null
          stripe_payout_id?: string | null
          total_markup_retained?: number | null
          transfer_amount?: number | null
          transfer_date?: string | null
          transferred_to_zinc?: boolean | null
          updated_at?: string | null
          zma_balance_after?: number | null
          zma_balance_before?: number | null
        }
        Update: {
          admin_confirmed_by?: string | null
          created_at?: string | null
          expected_payout_amount?: number | null
          expected_payout_date?: string | null
          id?: string
          notes?: string | null
          stripe_payout_id?: string | null
          total_markup_retained?: number | null
          transfer_amount?: number | null
          transfer_date?: string | null
          transferred_to_zinc?: boolean | null
          updated_at?: string | null
          zma_balance_after?: number | null
          zma_balance_before?: number | null
        }
        Relationships: []
      }
      zma_order_rate_limits: {
        Row: {
          consecutive_failures: number | null
          created_at: string | null
          is_rate_limited: boolean | null
          last_order_date: string | null
          last_order_time: string | null
          orders_this_hour: number | null
          orders_today: number | null
          rate_limit_expires_at: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          consecutive_failures?: number | null
          created_at?: string | null
          is_rate_limited?: boolean | null
          last_order_date?: string | null
          last_order_time?: string | null
          orders_this_hour?: number | null
          orders_today?: number | null
          rate_limit_expires_at?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          consecutive_failures?: number | null
          created_at?: string | null
          is_rate_limited?: boolean | null
          last_order_date?: string | null
          last_order_time?: string | null
          orders_this_hour?: number | null
          orders_today?: number | null
          rate_limit_expires_at?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      zma_security_events: {
        Row: {
          created_at: string | null
          event_data: Json | null
          event_type: string
          id: string
          order_id: string | null
          resolved_at: string | null
          severity: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          event_data?: Json | null
          event_type: string
          id?: string
          order_id?: string | null
          resolved_at?: string | null
          severity?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          event_data?: Json | null
          event_type?: string
          id?: string
          order_id?: string | null
          resolved_at?: string | null
          severity?: string | null
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      order_monitoring_summary: {
        Row: {
          cancellation_reason: string | null
          cancelled_at: string | null
          created_at: string | null
          has_active_alerts: boolean | null
          has_pending_refund: boolean | null
          id: string | null
          monitoring_status: string | null
          next_retry_at: string | null
          order_number: string | null
          retry_count: number | null
          status: string | null
          total_amount: number | null
          updated_at: string | null
          zinc_status: string | null
        }
        Insert: {
          cancellation_reason?: string | null
          cancelled_at?: string | null
          created_at?: string | null
          has_active_alerts?: never
          has_pending_refund?: never
          id?: string | null
          monitoring_status?: never
          next_retry_at?: string | null
          order_number?: string | null
          retry_count?: number | null
          status?: string | null
          total_amount?: number | null
          updated_at?: string | null
          zinc_status?: string | null
        }
        Update: {
          cancellation_reason?: string | null
          cancelled_at?: string | null
          created_at?: string | null
          has_active_alerts?: never
          has_pending_refund?: never
          id?: string | null
          monitoring_status?: never
          next_retry_at?: string | null
          order_number?: string | null
          retry_count?: number | null
          status?: string | null
          total_amount?: number | null
          updated_at?: string | null
          zinc_status?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      add_business_admin: {
        Args: {
          admin_level_param: string
          can_manage_payment_methods_param?: boolean
          can_view_payment_methods_param?: boolean
          new_admin_user_id: string
        }
        Returns: Json
      }
      admin_delete_user_account: {
        Args: { target_user_id: string }
        Returns: Json
      }
      are_users_connected: {
        Args: { user_id_1: string; user_id_2: string }
        Returns: boolean
      }
      calculate_risk_score: {
        Args: { anomaly_type_param: string; details_param: Json }
        Returns: number
      }
      can_abort_order: { Args: { order_id: string }; Returns: Json }
      can_access_order_notes: {
        Args: { note_order_id: string }
        Returns: boolean
      }
      can_access_trunkline: { Args: { user_uuid: string }; Returns: boolean }
      can_access_vendor_portal: {
        Args: { user_uuid: string }
        Returns: boolean
      }
      can_access_wishlist: {
        Args: {
          privacy_level?: string
          viewer_id: string
          wishlist_owner_id: string
        }
        Returns: boolean
      }
      can_access_zma_accounts: {
        Args: { action_type: string }
        Returns: boolean
      }
      can_bypass_payment_verification: {
        Args: { user_uuid: string }
        Returns: boolean
      }
      can_cancel_order: { Args: { order_id: string }; Returns: boolean }
      can_send_nudge: {
        Args: { p_recipient_email: string; p_user_id: string }
        Returns: boolean
      }
      can_user_connect: {
        Args: { requester_id: string; target_id: string }
        Returns: boolean
      }
      can_view_profile: { Args: { profile_user_id: string }; Returns: boolean }
      cancel_order: {
        Args: { cancellation_reason?: string; order_id: string }
        Returns: Json
      }
      check_auth_rate_limit: {
        Args: {
          p_event_type: string
          p_identifier: string
          p_max_attempts?: number
          p_window_minutes?: number
        }
        Returns: Json
      }
      check_auto_gift_permission: {
        Args: { p_connection_id: string; p_user_id: string }
        Returns: Json
      }
      check_friend_connection: {
        Args: { user1_id: string; user2_id: string }
        Returns: boolean
      }
      check_message_rate_limit: {
        Args: { sender_uuid: string }
        Returns: boolean
      }
      check_missed_scheduled_orders: { Args: never; Returns: undefined }
      check_zma_order_rate_limit: {
        Args: { user_uuid: string }
        Returns: boolean
      }
      cleanup_abandoned_orders: { Args: never; Returns: number }
      cleanup_auth_rate_limits: { Args: never; Returns: undefined }
      cleanup_expired_fingerprints: { Args: never; Returns: number }
      cleanup_expired_invitation_cache: { Args: never; Returns: number }
      cleanup_expired_reset_tokens: { Args: never; Returns: undefined }
      cleanup_expired_sessions: { Args: never; Returns: undefined }
      cleanup_failed_orders: { Args: never; Returns: number }
      cleanup_payment_intent_cache: { Args: never; Returns: number }
      cleanup_zma_validation_cache: { Args: never; Returns: number }
      complete_order_processing: {
        Args: {
          error_message_param?: string
          final_status_param?: string
          order_uuid: string
          zinc_request_id_param: string
          zinc_status_param?: string
        }
        Returns: Json
      }
      delete_user_account: { Args: { target_user_id: string }; Returns: Json }
      detect_abandoned_carts: { Args: never; Returns: undefined }
      emergency_security_verification: { Args: never; Returns: Json }
      fix_function_security_warnings: { Args: never; Returns: string }
      generate_address_collection_token: { Args: never; Returns: string }
      generate_invitation_token: { Args: never; Returns: string }
      generate_order_number: { Args: never; Returns: string }
      get_accessible_wishlist_items: {
        Args: { p_recipient_id: string }
        Returns: {
          brand: string
          description: string
          id: string
          image_url: string
          is_public: boolean
          name: string
          price: number
          title: string
          wishlist_id: string
          wishlist_title: string
        }[]
      }
      get_active_session_count: {
        Args: { target_user_id: string }
        Returns: number
      }
      get_full_shipping_address_for_gifting: {
        Args: { target_user_id: string }
        Returns: Json
      }
      get_masked_location: { Args: { target_user_id: string }; Returns: Json }
      get_nudge_summary: {
        Args: { p_recipient_email: string; p_user_id: string }
        Returns: {
          can_nudge: boolean
          days_until_next_nudge: number
          last_nudge_sent: string
          total_nudges: number
        }[]
      }
      get_order_cancel_eligibility: {
        Args: { order_uuid: string }
        Returns: Json
      }
      get_public_profile_by_identifier: {
        Args: { identifier: string }
        Returns: {
          bio: string
          created_at: string
          id: string
          location: string
          name: string
          profile_image: string
          username: string
        }[]
      }
      get_safe_profile_data: {
        Args: { profile_user_id: string }
        Returns: boolean
      }
      get_security_recommendations: { Args: never; Returns: Json }
      get_upcoming_auto_gift_events: {
        Args: { days_ahead?: number }
        Returns: {
          budget_limit: number
          event_date: string
          event_id: string
          event_type: string
          notification_days: number[]
          recipient_id: string
          rule_id: string
          user_id: string
        }[]
      }
      get_user_active_anomalies: {
        Args: { target_user_id: string }
        Returns: {
          anomaly_type: string
          created_at: string
          details: Json
          id: string
          risk_score: number
        }[]
      }
      get_user_context: { Args: { check_user_id: string }; Returns: Json }
      get_user_privacy_settings: {
        Args: { target_user_id: string }
        Returns: {
          allow_connection_requests_from: string
          allow_message_requests: boolean | null
          block_list_visibility: string
          created_at: string | null
          id: string
          profile_visibility: string
          show_follower_count: boolean | null
          show_following_count: boolean | null
          updated_at: string | null
          user_id: string
        }
        SetofOptions: {
          from: "*"
          to: "privacy_settings"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      get_zma_account_safe: {
        Args: { account_id: string }
        Returns: {
          account_balance: number
          account_name: string
          account_status: string
          created_at: string
          has_api_key: boolean
          id: string
          is_default: boolean
          last_balance_check: string
          updated_at: string
        }[]
      }
      grant_payment_bypass: {
        Args: {
          admin_user_id: string
          duration_hours?: number
          reason?: string
        }
        Returns: Json
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      has_valid_shipping_address: {
        Args: { target_user_id: string }
        Returns: boolean
      }
      increment_processing_attempts: {
        Args: { order_uuid: string }
        Returns: undefined
      }
      initialize_default_auto_gifting_settings: {
        Args: { target_user_id: string }
        Returns: string
      }
      is_authorized_for_payment_methods: {
        Args: { action_type: string }
        Returns: boolean
      }
      is_business_admin: { Args: { check_user_id: string }; Returns: boolean }
      is_elyphant_domain: { Args: { email_address: string }; Returns: boolean }
      is_group_admin: {
        Args: { group_id: string; user_id: string }
        Returns: boolean
      }
      is_group_member: {
        Args: { group_id: string; user_id: string }
        Returns: boolean
      }
      is_user_blocked: {
        Args: { user1_id: string; user2_id: string }
        Returns: boolean
      }
      link_pending_rules_manual: {
        Args: { p_email: string; p_user_id: string }
        Returns: Json
      }
      log_auto_gift_event: {
        Args: {
          error_message_param?: string
          event_data_param?: Json
          event_type_param: string
          execution_id_param?: string
          metadata_param?: Json
          rule_id_param?: string
          setup_token_param?: string
          user_uuid: string
        }
        Returns: string
      }
      log_business_payment_access: {
        Args: {
          additional_data?: Json
          operation_type: string
          payment_method_id?: string
          user_id_param: string
        }
        Returns: undefined
      }
      log_sensitive_data_access: {
        Args: {
          access_reason?: string
          access_type: string
          accessed_id: string
          accessed_table: string
        }
        Returns: undefined
      }
      manual_order_recovery: {
        Args: {
          admin_user_id: string
          bypass_payment_check?: boolean
          order_uuid: string
        }
        Returns: Json
      }
      manually_complete_order: {
        Args: {
          final_status_param?: string
          order_uuid: string
          zinc_request_id_param: string
          zinc_status_param?: string
        }
        Returns: Json
      }
      recover_stuck_orders: {
        Args: { max_age_minutes?: number }
        Returns: Json
      }
      reset_auth_rate_limit: {
        Args: { p_event_type: string; p_identifier: string }
        Returns: undefined
      }
      resolve_anomaly: { Args: { anomaly_id: string }; Returns: boolean }
      search_users_for_friends: {
        Args: {
          requesting_user_id?: string
          search_limit?: number
          search_term: string
        }
        Returns: {
          bio: string
          city: string
          email: string
          first_name: string
          id: string
          last_name: string
          name: string
          profile_image: string
          shipping_address: Json
          state: string
          username: string
        }[]
      }
      security_monitoring_dashboard: { Args: never; Returns: Json }
      set_user_identification: {
        Args: {
          attribution_param?: Json
          metadata_param?: Json
          signup_source_param: Database["public"]["Enums"]["signup_source"]
          target_user_id: string
          user_type_param: Database["public"]["Enums"]["user_type"]
        }
        Returns: undefined
      }
      set_zinc_order_id_if_null: {
        Args: { order_uuid: string; zinc_id: string }
        Returns: boolean
      }
      show_limit: { Args: never; Returns: number }
      show_trgm: { Args: { "": string }; Returns: string[] }
      start_order_processing: { Args: { order_uuid: string }; Returns: Json }
      terminate_other_sessions: {
        Args: { current_session_token: string; target_user_id: string }
        Returns: undefined
      }
      terminate_session: {
        Args: { target_session_id: string }
        Returns: undefined
      }
      track_zma_cost: {
        Args: {
          cost: number
          cost_type_param?: string
          order_uuid: string
          user_uuid: string
        }
        Returns: undefined
      }
      trigger_followup_emails: { Args: never; Returns: undefined }
      trigger_order_recovery: { Args: { order_uuid: string }; Returns: Json }
      update_zma_balance_manual: {
        Args: { p_new_balance: number; p_notes?: string }
        Returns: Json
      }
      validate_access_pattern: {
        Args: {
          operation_type: string
          resource_id?: string
          resource_type: string
        }
        Returns: boolean
      }
      validate_auto_gift_setup_token: {
        Args: { token: string; user_uuid: string }
        Returns: boolean
      }
      validate_webhook_token: {
        Args: { order_uuid: string; provided_token: string }
        Returns: boolean
      }
      validate_zma_order: {
        Args: {
          order_amount: number
          order_hash_param: string
          user_uuid: string
        }
        Returns: Json
      }
      verify_critical_security_fixed: { Args: never; Returns: Json }
    }
    Enums: {
      app_role: "admin" | "vendor" | "employee" | "customer" | "shopper"
      signup_source:
        | "header_cta"
        | "vendor_portal"
        | "trunkline"
        | "social_auth"
        | "direct"
        | "invite"
      user_type: "shopper" | "vendor" | "employee"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "vendor", "employee", "customer", "shopper"],
      signup_source: [
        "header_cta",
        "vendor_portal",
        "trunkline",
        "social_auth",
        "direct",
        "invite",
      ],
      user_type: ["shopper", "vendor", "employee"],
    },
  },
} as const
