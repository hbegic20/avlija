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
    PostgrestVersion: "14.18"
  }
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      favorites: {
        Row: {
          created_at: string
          listing_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          listing_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          listing_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "favorites_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "favorites_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      listing_images: {
        Row: {
          created_at: string
          height: number | null
          id: string
          listing_id: string
          position: number
          storage_path: string
          width: number | null
        }
        Insert: {
          created_at?: string
          height?: number | null
          id?: string
          listing_id: string
          position?: number
          storage_path: string
          width?: number | null
        }
        Update: {
          created_at?: string
          height?: number | null
          id?: string
          listing_id?: string
          position?: number
          storage_path?: string
          width?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "listing_images_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
        ]
      }
      listings: {
        Row: {
          address: string | null
          area_m2: number | null
          bathrooms: number | null
          condition: Database["public"]["Enums"]["property_condition"] | null
          created_at: string
          description: string
          expires_at: string | null
          features: string[]
          floor: number | null
          has_building_permit: boolean | null
          has_usage_permit: boolean | null
          heating: Database["public"]["Enums"]["heating_type"] | null
          hidden_reason: string | null
          id: string
          is_registered: boolean | null
          land_area_m2: number | null
          lat: number | null
          lng: number | null
          location_precise: boolean
          municipality_id: number
          neighborhood: string | null
          number: number
          owner_id: string
          price_km: number | null
          price_negotiable: boolean
          published_at: string | null
          rooms: number | null
          search: unknown
          sold_at: string | null
          status: Database["public"]["Enums"]["listing_status"]
          title: string
          total_floors: number | null
          type: Database["public"]["Enums"]["property_type"]
          updated_at: string
          view_count: number
          year_built: number | null
        }
        Insert: {
          address?: string | null
          area_m2?: number | null
          bathrooms?: number | null
          condition?: Database["public"]["Enums"]["property_condition"] | null
          created_at?: string
          description?: string
          expires_at?: string | null
          features?: string[]
          floor?: number | null
          has_building_permit?: boolean | null
          has_usage_permit?: boolean | null
          heating?: Database["public"]["Enums"]["heating_type"] | null
          hidden_reason?: string | null
          id?: string
          is_registered?: boolean | null
          land_area_m2?: number | null
          lat?: number | null
          lng?: number | null
          location_precise?: boolean
          municipality_id: number
          neighborhood?: string | null
          number?: number
          owner_id: string
          price_km?: number | null
          price_negotiable?: boolean
          published_at?: string | null
          rooms?: number | null
          search?: unknown
          sold_at?: string | null
          status?: Database["public"]["Enums"]["listing_status"]
          title: string
          total_floors?: number | null
          type: Database["public"]["Enums"]["property_type"]
          updated_at?: string
          view_count?: number
          year_built?: number | null
        }
        Update: {
          address?: string | null
          area_m2?: number | null
          bathrooms?: number | null
          condition?: Database["public"]["Enums"]["property_condition"] | null
          created_at?: string
          description?: string
          expires_at?: string | null
          features?: string[]
          floor?: number | null
          has_building_permit?: boolean | null
          has_usage_permit?: boolean | null
          heating?: Database["public"]["Enums"]["heating_type"] | null
          hidden_reason?: string | null
          id?: string
          is_registered?: boolean | null
          land_area_m2?: number | null
          lat?: number | null
          lng?: number | null
          location_precise?: boolean
          municipality_id?: number
          neighborhood?: string | null
          number?: number
          owner_id?: string
          price_km?: number | null
          price_negotiable?: boolean
          published_at?: string | null
          rooms?: number | null
          search?: unknown
          sold_at?: string | null
          status?: Database["public"]["Enums"]["listing_status"]
          title?: string
          total_floors?: number | null
          type?: Database["public"]["Enums"]["property_type"]
          updated_at?: string
          view_count?: number
          year_built?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "listings_municipality_id_fkey"
            columns: ["municipality_id"]
            isOneToOne: false
            referencedRelation: "municipalities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "listings_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      municipalities: {
        Row: {
          id: number
          lat: number
          lng: number
          name: string
          slug: string
        }
        Insert: {
          id: number
          lat: number
          lng: number
          name: string
          slug: string
        }
        Update: {
          id?: number
          lat?: number
          lng?: number
          name?: string
          slug?: string
        }
        Relationships: []
      }
      profile_contacts: {
        Row: {
          has_viber: boolean
          has_whatsapp: boolean
          phone: string | null
          profile_id: string
          updated_at: string
        }
        Insert: {
          has_viber?: boolean
          has_whatsapp?: boolean
          phone?: string | null
          profile_id: string
          updated_at?: string
        }
        Update: {
          has_viber?: boolean
          has_whatsapp?: boolean
          phone?: string | null
          profile_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profile_contacts_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          full_name: string
          id: string
          municipality_id: number | null
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          full_name: string
          id: string
          municipality_id?: number | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string
          id?: string
          municipality_id?: number | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_municipality_id_fkey"
            columns: ["municipality_id"]
            isOneToOne: false
            referencedRelation: "municipalities"
            referencedColumns: ["id"]
          },
        ]
      }
      reports: {
        Row: {
          created_at: string
          details: string | null
          id: string
          listing_id: string
          reason: Database["public"]["Enums"]["report_reason"]
          reporter_id: string | null
          resolved_by: string | null
          status: Database["public"]["Enums"]["report_status"]
        }
        Insert: {
          created_at?: string
          details?: string | null
          id?: string
          listing_id: string
          reason: Database["public"]["Enums"]["report_reason"]
          reporter_id?: string | null
          resolved_by?: string | null
          status?: Database["public"]["Enums"]["report_status"]
        }
        Update: {
          created_at?: string
          details?: string | null
          id?: string
          listing_id?: string
          reason?: Database["public"]["Enums"]["report_reason"]
          reporter_id?: string | null
          resolved_by?: string | null
          status?: Database["public"]["Enums"]["report_status"]
        }
        Relationships: [
          {
            foreignKeyName: "reports_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reports_reporter_id_fkey"
            columns: ["reporter_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reports_resolved_by_fkey"
            columns: ["resolved_by"]
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
      archive_expired_listings: { Args: never; Returns: number }
      get_seller_contact: {
        Args: { listing_id: string }
        Returns: {
          full_name: string
          has_viber: boolean
          has_whatsapp: boolean
          phone: string
        }[]
      }
      immutable_unaccent: { Args: { input: string }; Returns: string }
      increment_listing_view: {
        Args: { listing_id: string }
        Returns: undefined
      }
      is_admin: { Args: never; Returns: boolean }
      renew_listing: { Args: { listing_id: string }; Returns: string }
    }
    Enums: {
      heating_type:
        | "centralno"
        | "etazno"
        | "struja"
        | "drva"
        | "plin"
        | "toplotna_pumpa"
        | "nema"
      listing_status: "draft" | "active" | "sold" | "archived" | "hidden"
      property_condition:
        | "novogradnja"
        | "renovirano"
        | "useljivo"
        | "potrebna_adaptacija"
        | "roh_bau"
      property_type:
        | "stan"
        | "kuca"
        | "plac"
        | "poljoprivredno"
        | "vikendica"
        | "poslovni_prostor"
        | "garaza"
      report_reason:
        | "lazni_oglas"
        | "prodano"
        | "netacni_podaci"
        | "neprimjereno"
        | "prevara"
        | "ostalo"
      report_status: "open" | "resolved" | "dismissed"
      user_role: "user" | "admin"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      heating_type: [
        "centralno",
        "etazno",
        "struja",
        "drva",
        "plin",
        "toplotna_pumpa",
        "nema",
      ],
      listing_status: ["draft", "active", "sold", "archived", "hidden"],
      property_condition: [
        "novogradnja",
        "renovirano",
        "useljivo",
        "potrebna_adaptacija",
        "roh_bau",
      ],
      property_type: [
        "stan",
        "kuca",
        "plac",
        "poljoprivredno",
        "vikendica",
        "poslovni_prostor",
        "garaza",
      ],
      report_reason: [
        "lazni_oglas",
        "prodano",
        "netacni_podaci",
        "neprimjereno",
        "prevara",
        "ostalo",
      ],
      report_status: ["open", "resolved", "dismissed"],
      user_role: ["user", "admin"],
    },
  },
} as const
