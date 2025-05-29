export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
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
      auto_gifting_rules: {
        Row: {
          budget_limit: number | null
          created_at: string | null
          date_type: string
          gift_preferences: Json | null
          id: string
          is_active: boolean | null
          recipient_id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          budget_limit?: number | null
          created_at?: string | null
          date_type: string
          gift_preferences?: Json | null
          id?: string
          is_active?: boolean | null
          recipient_id: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          budget_limit?: number | null
          created_at?: string | null
          date_type?: string
          gift_preferences?: Json | null
          id?: string
          is_active?: boolean | null
          recipient_id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
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
          bio: string | null
          created_at: string | null
          data_sharing_settings: Json | null
          dob: string | null
          email: string | null
          gift_preferences: Json | null
          id: string
          important_dates: Json | null
          name: string | null
          profile_image: string | null
          profile_type: string | null
          shipping_address: Json | null
          updated_at: string | null
          username: string | null
        }
        Insert: {
          bio?: string | null
          created_at?: string | null
          data_sharing_settings?: Json | null
          dob?: string | null
          email?: string | null
          gift_preferences?: Json | null
          id: string
          important_dates?: Json | null
          name?: string | null
          profile_image?: string | null
          profile_type?: string | null
          shipping_address?: Json | null
          updated_at?: string | null
          username?: string | null
        }
        Update: {
          bio?: string | null
          created_at?: string | null
          data_sharing_settings?: Json | null
          dob?: string | null
          email?: string | null
          gift_preferences?: Json | null
          id?: string
          important_dates?: Json | null
          name?: string | null
          profile_image?: string | null
          profile_type?: string | null
          shipping_address?: Json | null
          updated_at?: string | null
          username?: string | null
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
      user_special_dates: {
        Row: {
          created_at: string | null
          date: string
          date_type: string
          id: string
          updated_at: string | null
          user_id: string
          visibility: string
        }
        Insert: {
          created_at?: string | null
          date: string
          date_type: string
          id?: string
          updated_at?: string | null
          user_id: string
          visibility?: string
        }
        Update: {
          created_at?: string | null
          date?: string
          date_type?: string
          id?: string
          updated_at?: string | null
          user_id?: string
          visibility?: string
        }
        Relationships: [
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

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
