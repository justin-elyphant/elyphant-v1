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
          analysis: Json
          created_at: string
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          address_hash: string
          analysis: Json
          created_at?: string
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          address_hash?: string
          analysis?: Json
          created_at?: string
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
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
          privacy_settings: Json | null
          recipient_id: string
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
          privacy_settings?: Json | null
          recipient_id: string
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
          privacy_settings?: Json | null
          recipient_id?: string
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
          updated_at: string | null
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
          updated_at?: string | null
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
          updated_at?: string | null
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
      messages: {
        Row: {
          content: string
          created_at: string | null
          id: string
          is_read: boolean | null
          product_link_id: number | null
          recipient_id: string
          sender_id: string
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          product_link_id?: number | null
          recipient_id: string
          sender_id: string
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          product_link_id?: number | null
          recipient_id?: string
          sender_id?: string
        }
        Relationships: []
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
      orders: {
        Row: {
          created_at: string
          currency: string
          delivery_groups: Json | null
          gift_message: string | null
          gift_options: Json | null
          gift_scheduling_options: Json | null
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
          created_at?: string
          currency?: string
          delivery_groups?: Json | null
          gift_message?: string | null
          gift_options?: Json | null
          gift_scheduling_options?: Json | null
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
          created_at?: string
          currency?: string
          delivery_groups?: Json | null
          gift_message?: string | null
          gift_options?: Json | null
          gift_scheduling_options?: Json | null
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
          allow_follows_from: string
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
          allow_follows_from?: string
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
          allow_follows_from?: string
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
      profiles: {
        Row: {
          ai_interaction_data: Json | null
          bio: string | null
          created_at: string | null
          data_sharing_settings: Json | null
          dob: string | null
          email: string | null
          enhanced_ai_interaction_data: Json | null
          enhanced_gift_preferences: Json | null
          enhanced_gifting_history: Json | null
          gift_giving_preferences: Json | null
          gift_preferences: Json | null
          gifting_history: Json | null
          id: string
          important_dates: Json | null
          interests: Json | null
          name: string | null
          onboarding_completed: boolean | null
          profile_image: string | null
          profile_type: string | null
          shipping_address: Json | null
          updated_at: string | null
          username: string | null
          wishlists: Json | null
        }
        Insert: {
          ai_interaction_data?: Json | null
          bio?: string | null
          created_at?: string | null
          data_sharing_settings?: Json | null
          dob?: string | null
          email?: string | null
          enhanced_ai_interaction_data?: Json | null
          enhanced_gift_preferences?: Json | null
          enhanced_gifting_history?: Json | null
          gift_giving_preferences?: Json | null
          gift_preferences?: Json | null
          gifting_history?: Json | null
          id: string
          important_dates?: Json | null
          interests?: Json | null
          name?: string | null
          onboarding_completed?: boolean | null
          profile_image?: string | null
          profile_type?: string | null
          shipping_address?: Json | null
          updated_at?: string | null
          username?: string | null
          wishlists?: Json | null
        }
        Update: {
          ai_interaction_data?: Json | null
          bio?: string | null
          created_at?: string | null
          data_sharing_settings?: Json | null
          dob?: string | null
          email?: string | null
          enhanced_ai_interaction_data?: Json | null
          enhanced_gift_preferences?: Json | null
          enhanced_gifting_history?: Json | null
          gift_giving_preferences?: Json | null
          gift_preferences?: Json | null
          gifting_history?: Json | null
          id?: string
          important_dates?: Json | null
          interests?: Json | null
          name?: string | null
          onboarding_completed?: boolean | null
          profile_image?: string | null
          profile_type?: string | null
          shipping_address?: Json | null
          updated_at?: string | null
          username?: string | null
          wishlists?: Json | null
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
          connected_user_id: string
          created_at: string | null
          data_access_permissions: Json | null
          follow_type: string | null
          id: string
          relationship_type: string
          status: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          blocked_at?: string | null
          blocked_by?: string | null
          connected_user_id: string
          created_at?: string | null
          data_access_permissions?: Json | null
          follow_type?: string | null
          id?: string
          relationship_type: string
          status?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          blocked_at?: string | null
          blocked_by?: string | null
          connected_user_id?: string
          created_at?: string | null
          data_access_permissions?: Json | null
          follow_type?: string | null
          id?: string
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
      can_user_follow: {
        Args: { follower_id: string; target_id: string }
        Returns: boolean
      }
      delete_user_account: {
        Args: { target_user_id: string }
        Returns: Json
      }
      generate_order_number: {
        Args: Record<PropertyKey, never>
        Returns: string
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
          allow_follows_from: string
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
