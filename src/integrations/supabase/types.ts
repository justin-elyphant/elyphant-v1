export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
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
        }
        Insert: {
          created_at?: string
          id?: number
          key: string
        }
        Update: {
          created_at?: string
          id?: number
          key?: string
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
      auto_gifting_rules: {
        Row: {
          budget_limit: number | null
          created_at: string | null
          date_type: string
          event_id: string | null
          gift_preferences: Json | null
          gift_selection_criteria: Json | null
          id: string
          is_active: boolean | null
          notification_preferences: Json | null
          payment_method_id: string | null
          pending_recipient_email: string | null
          privacy_settings: Json | null
          recipient_id: string | null
          recipient_lifestyle_factors: Json | null
          relationship_context: Json | null
          seasonal_adjustment_factors: Json | null
          success_metrics: Json | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          budget_limit?: number | null
          created_at?: string | null
          date_type: string
          event_id?: string | null
          gift_preferences?: Json | null
          gift_selection_criteria?: Json | null
          id?: string
          is_active?: boolean | null
          notification_preferences?: Json | null
          payment_method_id?: string | null
          pending_recipient_email?: string | null
          privacy_settings?: Json | null
          recipient_id?: string | null
          recipient_lifestyle_factors?: Json | null
          relationship_context?: Json | null
          seasonal_adjustment_factors?: Json | null
          success_metrics?: Json | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          budget_limit?: number | null
          created_at?: string | null
          date_type?: string
          event_id?: string | null
          gift_preferences?: Json | null
          gift_selection_criteria?: Json | null
          id?: string
          is_active?: boolean | null
          notification_preferences?: Json | null
          payment_method_id?: string | null
          pending_recipient_email?: string | null
          privacy_settings?: Json | null
          recipient_id?: string | null
          recipient_lifestyle_factors?: Json | null
          relationship_context?: Json | null
          seasonal_adjustment_factors?: Json | null
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
          created_at: string | null
          error_message: string | null
          event_id: string | null
          execution_date: string
          id: string
          next_retry_at: string | null
          order_id: string | null
          retry_count: number | null
          rule_id: string | null
          selected_products: Json | null
          status: string
          total_amount: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          error_message?: string | null
          event_id?: string | null
          execution_date: string
          id?: string
          next_retry_at?: string | null
          order_id?: string | null
          retry_count?: number | null
          rule_id?: string | null
          selected_products?: Json | null
          status?: string
          total_amount?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          error_message?: string | null
          event_id?: string | null
          execution_date?: string
          id?: string
          next_retry_at?: string | null
          order_id?: string | null
          retry_count?: number | null
          rule_id?: string | null
          selected_products?: Json | null
          status?: string
          total_amount?: number | null
          updated_at?: string | null
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
          total_price: number
          unit_price: number
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
          total_price: number
          unit_price: number
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
          total_price?: number
          unit_price?: number
          vendor?: string | null
        }
        Relationships: [
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
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          billing_info: Json | null
          created_at: string
          currency: string
          delivery_groups: Json | null
          funding_source: string | null
          gift_message: string | null
          gift_options: Json | null
          gift_scheduling_options: Json | null
          group_gift_project_id: string | null
          has_multiple_recipients: boolean | null
          id: string
          is_gift: boolean | null
          is_surprise_gift: boolean | null
          order_number: string
          payment_status: string | null
          scheduled_delivery_date: string | null
          shipping_cost: number
          shipping_info: Json
          status: string
          stripe_payment_intent_id: string | null
          stripe_session_id: string | null
          subtotal: number
          tax_amount: number
          total_amount: number
          tracking_number: string | null
          updated_at: string
          user_id: string | null
          zinc_order_id: string | null
          zinc_status: string | null
        }
        Insert: {
          billing_info?: Json | null
          created_at?: string
          currency?: string
          delivery_groups?: Json | null
          funding_source?: string | null
          gift_message?: string | null
          gift_options?: Json | null
          gift_scheduling_options?: Json | null
          group_gift_project_id?: string | null
          has_multiple_recipients?: boolean | null
          id?: string
          is_gift?: boolean | null
          is_surprise_gift?: boolean | null
          order_number: string
          payment_status?: string | null
          scheduled_delivery_date?: string | null
          shipping_cost?: number
          shipping_info: Json
          status?: string
          stripe_payment_intent_id?: string | null
          stripe_session_id?: string | null
          subtotal: number
          tax_amount?: number
          total_amount: number
          tracking_number?: string | null
          updated_at?: string
          user_id?: string | null
          zinc_order_id?: string | null
          zinc_status?: string | null
        }
        Update: {
          billing_info?: Json | null
          created_at?: string
          currency?: string
          delivery_groups?: Json | null
          funding_source?: string | null
          gift_message?: string | null
          gift_options?: Json | null
          gift_scheduling_options?: Json | null
          group_gift_project_id?: string | null
          has_multiple_recipients?: boolean | null
          id?: string
          is_gift?: boolean | null
          is_surprise_gift?: boolean | null
          order_number?: string
          payment_status?: string | null
          scheduled_delivery_date?: string | null
          shipping_cost?: number
          shipping_info?: Json
          status?: string
          stripe_payment_intent_id?: string | null
          stripe_session_id?: string | null
          subtotal?: number
          tax_amount?: number
          total_amount?: number
          tracking_number?: string | null
          updated_at?: string
          user_id?: string | null
          zinc_order_id?: string | null
          zinc_status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "orders_group_gift_project_id_fkey"
            columns: ["group_gift_project_id"]
            isOneToOne: false
            referencedRelation: "group_gift_projects"
            referencedColumns: ["id"]
          },
        ]
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
      profiles: {
        Row: {
          ai_interaction_data: Json | null
          bio: string | null
          birth_year: number
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
          id: string
          important_dates: Json | null
          interests: Json | null
          last_name: string
          name: string | null
          onboarding_completed: boolean | null
          profile_image: string | null
          profile_type: string | null
          shipping_address: Json | null
          updated_at: string | null
          username: string
          wishlists: Json | null
        }
        Insert: {
          ai_interaction_data?: Json | null
          bio?: string | null
          birth_year: number
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
          id: string
          important_dates?: Json | null
          interests?: Json | null
          last_name: string
          name?: string | null
          onboarding_completed?: boolean | null
          profile_image?: string | null
          profile_type?: string | null
          shipping_address?: Json | null
          updated_at?: string | null
          username: string
          wishlists?: Json | null
        }
        Update: {
          ai_interaction_data?: Json | null
          bio?: string | null
          birth_year?: number
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
          id?: string
          important_dates?: Json | null
          interests?: Json | null
          last_name?: string
          name?: string | null
          onboarding_completed?: boolean | null
          profile_image?: string | null
          profile_type?: string | null
          shipping_address?: Json | null
          updated_at?: string | null
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
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
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
      user_connections: {
        Row: {
          blocked_at: string | null
          blocked_by: string | null
          connected_user_id: string | null
          created_at: string | null
          data_access_permissions: Json | null
          follow_type: string | null
          id: string
          invitation_sent_at: string | null
          invitation_token: string | null
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
          data_access_permissions?: Json | null
          follow_type?: string | null
          id?: string
          invitation_sent_at?: string | null
          invitation_token?: string | null
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
          data_access_permissions?: Json | null
          follow_type?: string | null
          id?: string
          invitation_sent_at?: string | null
          invitation_token?: string | null
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
      user_special_dates: {
        Row: {
          archived_at: string | null
          connection_id: string | null
          created_at: string | null
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      are_users_connected: {
        Args: { user_id_1: string; user_id_2: string }
        Returns: boolean
      }
      can_cancel_order: {
        Args: { order_id: string }
        Returns: boolean
      }
      can_send_nudge: {
        Args: { p_user_id: string; p_recipient_email: string }
        Returns: boolean
      }
      can_user_connect: {
        Args: { requester_id: string; target_id: string }
        Returns: boolean
      }
      cancel_order: {
        Args: { order_id: string; cancellation_reason?: string }
        Returns: Json
      }
      check_message_rate_limit: {
        Args: { sender_uuid: string }
        Returns: boolean
      }
      cleanup_failed_orders: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      delete_user_account: {
        Args: { target_user_id: string }
        Returns: Json
      }
      generate_invitation_token: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      generate_order_number: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_nudge_summary: {
        Args: { p_user_id: string; p_recipient_email: string }
        Returns: {
          total_nudges: number
          last_nudge_sent: string
          can_nudge: boolean
          days_until_next_nudge: number
        }[]
      }
      get_upcoming_auto_gift_events: {
        Args: { days_ahead?: number }
        Returns: {
          event_id: string
          rule_id: string
          user_id: string
          event_date: string
          event_type: string
          recipient_id: string
          budget_limit: number
          notification_days: number[]
        }[]
      }
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
      }
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
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
