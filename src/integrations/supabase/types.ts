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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      affiliate_links: {
        Row: {
          affiliate_url: string
          channel_id: string | null
          click_count: number
          conversions: number
          created_at: string
          health_status: Database["public"]["Enums"]["health_status"]
          health_status_code: number | null
          id: string
          product_id: string
          revenue: number
          short_code: string
          user_id: string
        }
        Insert: {
          affiliate_url: string
          channel_id?: string | null
          click_count?: number
          conversions?: number
          created_at?: string
          health_status?: Database["public"]["Enums"]["health_status"]
          health_status_code?: number | null
          id?: string
          product_id: string
          revenue?: number
          short_code: string
          user_id: string
        }
        Update: {
          affiliate_url?: string
          channel_id?: string | null
          click_count?: number
          conversions?: number
          created_at?: string
          health_status?: Database["public"]["Enums"]["health_status"]
          health_status_code?: number | null
          id?: string
          product_id?: string
          revenue?: number
          short_code?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "affiliate_links_channel_id_fkey"
            columns: ["channel_id"]
            isOneToOne: false
            referencedRelation: "channels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "affiliate_links_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      brands: {
        Row: {
          created_at: string
          id: string
          name: string
          network_id: string | null
          product_count: number
          website_url: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          network_id?: string | null
          product_count?: number
          website_url?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          network_id?: string | null
          product_count?: number
          website_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "brands_network_id_fkey"
            columns: ["network_id"]
            isOneToOne: false
            referencedRelation: "networks"
            referencedColumns: ["id"]
          },
        ]
      }
      channels: {
        Row: {
          created_at: string
          id: string
          name: string
          url: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          url?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          url?: string | null
          user_id?: string
        }
        Relationships: []
      }
      link_clicks: {
        Row: {
          clicked_at: string
          id: string
          ip_hash: string | null
          link_id: string
          referrer: string | null
          user_agent: string | null
        }
        Insert: {
          clicked_at?: string
          id?: string
          ip_hash?: string | null
          link_id: string
          referrer?: string | null
          user_agent?: string | null
        }
        Update: {
          clicked_at?: string
          id?: string
          ip_hash?: string | null
          link_id?: string
          referrer?: string | null
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "link_clicks_link_id_fkey"
            columns: ["link_id"]
            isOneToOne: false
            referencedRelation: "affiliate_links"
            referencedColumns: ["id"]
          },
        ]
      }
      link_health: {
        Row: {
          error_message: string | null
          id: string
          is_valid: boolean
          last_checked_at: string
          link_id: string
          status_code: number | null
        }
        Insert: {
          error_message?: string | null
          id?: string
          is_valid?: boolean
          last_checked_at?: string
          link_id: string
          status_code?: number | null
        }
        Update: {
          error_message?: string | null
          id?: string
          is_valid?: boolean
          last_checked_at?: string
          link_id?: string
          status_code?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "link_health_link_id_fkey"
            columns: ["link_id"]
            isOneToOne: false
            referencedRelation: "affiliate_links"
            referencedColumns: ["id"]
          },
        ]
      }
      networks: {
        Row: {
          api_base_url: string | null
          auth_type: Database["public"]["Enums"]["network_auth_type"]
          created_at: string
          id: string
          name: string
          slug: string
          url_template: string
        }
        Insert: {
          api_base_url?: string | null
          auth_type?: Database["public"]["Enums"]["network_auth_type"]
          created_at?: string
          id?: string
          name: string
          slug: string
          url_template: string
        }
        Update: {
          api_base_url?: string | null
          auth_type?: Database["public"]["Enums"]["network_auth_type"]
          created_at?: string
          id?: string
          name?: string
          slug?: string
          url_template?: string
        }
        Relationships: []
      }
      products: {
        Row: {
          affiliate_url_template: string | null
          availability_status: Database["public"]["Enums"]["availability_status"]
          brand_id: string | null
          category: string | null
          created_at: string
          currency: string
          description: string | null
          id: string
          image_url: string | null
          merchant_id: string | null
          network_id: string | null
          price: number | null
          sku: string
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          affiliate_url_template?: string | null
          availability_status?: Database["public"]["Enums"]["availability_status"]
          brand_id?: string | null
          category?: string | null
          created_at?: string
          currency?: string
          description?: string | null
          id?: string
          image_url?: string | null
          merchant_id?: string | null
          network_id?: string | null
          price?: number | null
          sku: string
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          affiliate_url_template?: string | null
          availability_status?: Database["public"]["Enums"]["availability_status"]
          brand_id?: string | null
          category?: string | null
          created_at?: string
          currency?: string
          description?: string | null
          id?: string
          image_url?: string | null
          merchant_id?: string | null
          network_id?: string | null
          price?: number | null
          sku?: string
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "products_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_network_id_fkey"
            columns: ["network_id"]
            isOneToOne: false
            referencedRelation: "networks"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          display_name: string | null
          email: string | null
          has_completed_onboarding: boolean
          id: string
          utm_campaign: string | null
          utm_medium: string | null
          utm_source: string | null
        }
        Insert: {
          created_at?: string
          display_name?: string | null
          email?: string | null
          has_completed_onboarding?: boolean
          id: string
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
        }
        Update: {
          created_at?: string
          display_name?: string | null
          email?: string | null
          has_completed_onboarding?: boolean
          id?: string
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
        }
        Relationships: []
      }
      user_credentials: {
        Row: {
          affiliate_id: string
          api_token_encrypted: string | null
          created_at: string
          id: string
          network_id: string
          user_id: string
        }
        Insert: {
          affiliate_id: string
          api_token_encrypted?: string | null
          created_at?: string
          id?: string
          network_id: string
          user_id: string
        }
        Update: {
          affiliate_id?: string
          api_token_encrypted?: string | null
          created_at?: string
          id?: string
          network_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_credentials_network_id_fkey"
            columns: ["network_id"]
            isOneToOne: false
            referencedRelation: "networks"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      availability_status: "in_stock" | "out_of_stock" | "unknown"
      health_status: "healthy" | "broken" | "unknown"
      network_auth_type: "api_key" | "oauth2" | "hmac"
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
      availability_status: ["in_stock", "out_of_stock", "unknown"],
      health_status: ["healthy", "broken", "unknown"],
      network_auth_type: ["api_key", "oauth2", "hmac"],
    },
  },
} as const
