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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      ai_jobs: {
        Row: {
          created_at: string | null
          error_message: string | null
          id: number
          integration_id: string | null
          payload: Json
          provider: string
          result: Json | null
          status: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          error_message?: string | null
          id?: number
          integration_id?: string | null
          payload: Json
          provider: string
          result?: Json | null
          status?: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          error_message?: string | null
          id?: number
          integration_id?: string | null
          payload?: Json
          provider?: string
          result?: Json | null
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_jobs_integration_id_fkey"
            columns: ["integration_id"]
            isOneToOne: false
            referencedRelation: "integrations"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          created_at: string
          description: string | null
          id: string
          slug: string
          title: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          slug: string
          title: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          slug?: string
          title?: string
        }
        Relationships: []
      }
      comments: {
        Row: {
          content_html: string
          created_at: string
          id: number
          parent_id: number | null
          post_id: string
          status: string
          user_id: string | null
        }
        Insert: {
          content_html: string
          created_at?: string
          id?: never
          parent_id?: number | null
          post_id: string
          status?: string
          user_id?: string | null
        }
        Update: {
          content_html?: string
          created_at?: string
          id?: never
          parent_id?: number | null
          post_id?: string
          status?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "comments_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      integrations: {
        Row: {
          config: Json | null
          created_at: string | null
          created_by: string | null
          credentials_in_vault: boolean | null
          enabled: boolean | null
          endpoint_url: string | null
          id: string
          name: string
          type: string
          updated_at: string | null
        }
        Insert: {
          config?: Json | null
          created_at?: string | null
          created_by?: string | null
          credentials_in_vault?: boolean | null
          enabled?: boolean | null
          endpoint_url?: string | null
          id?: string
          name: string
          type: string
          updated_at?: string | null
        }
        Update: {
          config?: Json | null
          created_at?: string | null
          created_by?: string | null
          credentials_in_vault?: boolean | null
          enabled?: boolean | null
          endpoint_url?: string | null
          id?: string
          name?: string
          type?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      moderation_actions: {
        Row: {
          action: string
          created_at: string | null
          id: number
          metadata: Json | null
          moderator_id: string | null
          reason: string | null
          target_id: string
          target_type: string
        }
        Insert: {
          action: string
          created_at?: string | null
          id?: number
          metadata?: Json | null
          moderator_id?: string | null
          reason?: string | null
          target_id: string
          target_type: string
        }
        Update: {
          action?: string
          created_at?: string | null
          id?: number
          metadata?: Json | null
          moderator_id?: string | null
          reason?: string | null
          target_id?: string
          target_type?: string
        }
        Relationships: []
      }
      post_tags: {
        Row: {
          post_id: string
          tag_id: string
        }
        Insert: {
          post_id: string
          tag_id: string
        }
        Update: {
          post_id?: string
          tag_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_tags_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_tags_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "tags"
            referencedColumns: ["id"]
          },
        ]
      }
      posts: {
        Row: {
          author_id: string
          canonical: string | null
          category_id: string | null
          content_html: string | null
          cover_image_url: string | null
          created_at: string
          focus_keywords: string[] | null
          id: string
          noindex: boolean | null
          published_at: string | null
          seo_description: string | null
          seo_title: string | null
          slug: string
          status: string
          subtitle: string | null
          title: string
          tldr: string | null
          type: string
          updated_at: string
        }
        Insert: {
          author_id: string
          canonical?: string | null
          category_id?: string | null
          content_html?: string | null
          cover_image_url?: string | null
          created_at?: string
          focus_keywords?: string[] | null
          id?: string
          noindex?: boolean | null
          published_at?: string | null
          seo_description?: string | null
          seo_title?: string | null
          slug: string
          status?: string
          subtitle?: string | null
          title: string
          tldr?: string | null
          type?: string
          updated_at?: string
        }
        Update: {
          author_id?: string
          canonical?: string | null
          category_id?: string | null
          content_html?: string | null
          cover_image_url?: string | null
          created_at?: string
          focus_keywords?: string[] | null
          id?: string
          noindex?: boolean | null
          published_at?: string | null
          seo_description?: string | null
          seo_title?: string | null
          slug?: string
          status?: string
          subtitle?: string | null
          title?: string
          tldr?: string | null
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "posts_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "posts_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          city: string | null
          created_at: string
          id: string
          interests: string[] | null
          role: string
          updated_at: string
          user_id: string
          username: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          city?: string | null
          created_at?: string
          id?: string
          interests?: string[] | null
          role?: string
          updated_at?: string
          user_id: string
          username?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          city?: string | null
          created_at?: string
          id?: string
          interests?: string[] | null
          role?: string
          updated_at?: string
          user_id?: string
          username?: string | null
        }
        Relationships: []
      }
      reports: {
        Row: {
          comment_id: number | null
          created_at: string
          id: number
          post_id: string | null
          reason: string
          status: string
          user_id: string | null
        }
        Insert: {
          comment_id?: number | null
          created_at?: string
          id?: never
          post_id?: string | null
          reason: string
          status?: string
          user_id?: string | null
        }
        Update: {
          comment_id?: number | null
          created_at?: string
          id?: never
          post_id?: string | null
          reason?: string
          status?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reports_comment_id_fkey"
            columns: ["comment_id"]
            isOneToOne: false
            referencedRelation: "comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reports_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reports_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      signals: {
        Row: {
          created_at: string
          id: number
          meta: Json | null
          post_id: string
          type: string
          user_id: string | null
          value: number | null
        }
        Insert: {
          created_at?: string
          id?: never
          meta?: Json | null
          post_id: string
          type: string
          user_id?: string | null
          value?: number | null
        }
        Update: {
          created_at?: string
          id?: never
          meta?: Json | null
          post_id?: string
          type?: string
          user_id?: string | null
          value?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "signals_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "signals_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      stats_cache: {
        Row: {
          data: Json
          key: string
          updated_at: string | null
        }
        Insert: {
          data: Json
          key: string
          updated_at?: string | null
        }
        Update: {
          data?: Json
          key?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      tags: {
        Row: {
          created_at: string
          id: string
          slug: string
          title: string
        }
        Insert: {
          created_at?: string
          id?: string
          slug: string
          title: string
        }
        Update: {
          created_at?: string
          id?: string
          slug?: string
          title?: string
        }
        Relationships: []
      }
      uploads: {
        Row: {
          created_at: string
          file_size: number | null
          file_url: string
          id: string
          mime_type: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          file_size?: number | null
          file_url: string
          id?: string
          mime_type?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          file_size?: number | null
          file_url?: string
          id?: string
          mime_type?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "uploads_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      check_username_available: {
        Args: { username_to_check: string }
        Returns: boolean
      }
      get_available_tags: {
        Args: Record<PropertyKey, never>
        Returns: {
          created_at: string
          id: string
          slug: string
          title: string
        }[]
      }
      get_homepage_stats: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      get_integration_credentials: {
        Args: { integration_id: string }
        Returns: Json
      }
      update_stats_cache: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
    }
    Enums: {
      user_role: "user" | "author" | "editor" | "admin" | "moderator"
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
      user_role: ["user", "author", "editor", "admin", "moderator"],
    },
  },
} as const
