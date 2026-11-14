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
  public: {
    Tables: {
      activity_logs: {
        Row: {
          action: string
          actor_id: string | null
          changes: string[]
          created_at: string
          entity_id: string
          entity_type: string
          id: string
          summary: string
          workspace_id: string
        }
        Insert: {
          action: string
          actor_id?: string | null
          changes?: string[]
          created_at?: string
          entity_id: string
          entity_type: string
          id?: string
          summary: string
          workspace_id: string
        }
        Update: {
          action?: string
          actor_id?: string | null
          changes?: string[]
          created_at?: string
          entity_id?: string
          entity_type?: string
          id?: string
          summary?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "activity_logs_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      clients: {
        Row: {
          address_line: string | null
          city: string | null
          company_name: string | null
          contact_name: string
          country: string
          created_at: string
          created_by: string | null
          email: string | null
          id: string
          kind: Database["public"]["Enums"]["client_kind"]
          notes: string | null
          phone: string | null
          postal_code: string | null
          search_text: string | null
          updated_at: string
          workspace_id: string
        }
        Insert: {
          address_line?: string | null
          city?: string | null
          company_name?: string | null
          contact_name: string
          country?: string
          created_at?: string
          created_by?: string | null
          email?: string | null
          id?: string
          kind?: Database["public"]["Enums"]["client_kind"]
          notes?: string | null
          phone?: string | null
          postal_code?: string | null
          search_text?: string | null
          updated_at?: string
          workspace_id: string
        }
        Update: {
          address_line?: string | null
          city?: string | null
          company_name?: string | null
          contact_name?: string
          country?: string
          created_at?: string
          created_by?: string | null
          email?: string | null
          id?: string
          kind?: Database["public"]["Enums"]["client_kind"]
          notes?: string | null
          phone?: string | null
          postal_code?: string | null
          search_text?: string | null
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "clients_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          full_name: string | null
          id: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      projects: {
        Row: {
          budget_cents: number | null
          client_id: string | null
          completed_at: string | null
          created_at: string
          created_by: string | null
          description: string | null
          due_date: string | null
          id: string
          name: string
          progress: number
          search_text: string | null
          start_date: string | null
          status: Database["public"]["Enums"]["project_status"]
          updated_at: string
          workspace_id: string
        }
        Insert: {
          budget_cents?: number | null
          client_id?: string | null
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          name: string
          progress?: number
          search_text?: string | null
          start_date?: string | null
          status?: Database["public"]["Enums"]["project_status"]
          updated_at?: string
          workspace_id: string
        }
        Update: {
          budget_cents?: number | null
          client_id?: string | null
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          name?: string
          progress?: number
          search_text?: string | null
          start_date?: string | null
          status?: Database["public"]["Enums"]["project_status"]
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "projects_client_same_workspace"
            columns: ["client_id", "workspace_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id", "workspace_id"]
          },
          {
            foreignKeyName: "projects_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      quote_counters: {
        Row: {
          last_value: number
          workspace_id: string
          year: number
        }
        Insert: {
          last_value: number
          workspace_id: string
          year: number
        }
        Update: {
          last_value?: number
          workspace_id?: string
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "quote_counters_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      quote_items: {
        Row: {
          description: string | null
          id: string
          label: string
          line_subtotal_cents: number
          line_total_cents: number
          line_vat_cents: number
          position: number
          quantity: number
          quote_id: string
          unit: string | null
          unit_price_cents: number
          vat_rate_bp: number
          workspace_id: string
        }
        Insert: {
          description?: string | null
          id?: string
          label: string
          line_subtotal_cents: number
          line_total_cents: number
          line_vat_cents: number
          position: number
          quantity: number
          quote_id: string
          unit?: string | null
          unit_price_cents: number
          vat_rate_bp: number
          workspace_id: string
        }
        Update: {
          description?: string | null
          id?: string
          label?: string
          line_subtotal_cents?: number
          line_total_cents?: number
          line_vat_cents?: number
          position?: number
          quantity?: number
          quote_id?: string
          unit?: string | null
          unit_price_cents?: number
          vat_rate_bp?: number
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "quote_items_quote_same_workspace"
            columns: ["quote_id", "workspace_id"]
            isOneToOne: false
            referencedRelation: "quotes"
            referencedColumns: ["id", "workspace_id"]
          },
        ]
      }
      quotes: {
        Row: {
          accepted_at: string | null
          client_id: string
          client_snapshot: Json | null
          created_at: string
          created_by: string | null
          id: string
          issue_date: string
          issuer_snapshot: Json | null
          number: string
          project_id: string | null
          refused_at: string | null
          search_text: string | null
          sent_at: string | null
          status: Database["public"]["Enums"]["quote_status"]
          subtotal_cents: number
          terms: string | null
          title: string
          total_cents: number
          updated_at: string
          valid_until: string
          vat_cents: number
          vat_exempt: boolean
          workspace_id: string
        }
        Insert: {
          accepted_at?: string | null
          client_id: string
          client_snapshot?: Json | null
          created_at?: string
          created_by?: string | null
          id?: string
          issue_date?: string
          issuer_snapshot?: Json | null
          number: string
          project_id?: string | null
          refused_at?: string | null
          search_text?: string | null
          sent_at?: string | null
          status?: Database["public"]["Enums"]["quote_status"]
          subtotal_cents?: number
          terms?: string | null
          title: string
          total_cents?: number
          updated_at?: string
          valid_until: string
          vat_cents?: number
          vat_exempt?: boolean
          workspace_id: string
        }
        Update: {
          accepted_at?: string | null
          client_id?: string
          client_snapshot?: Json | null
          created_at?: string
          created_by?: string | null
          id?: string
          issue_date?: string
          issuer_snapshot?: Json | null
          number?: string
          project_id?: string | null
          refused_at?: string | null
          search_text?: string | null
          sent_at?: string | null
          status?: Database["public"]["Enums"]["quote_status"]
          subtotal_cents?: number
          terms?: string | null
          title?: string
          total_cents?: number
          updated_at?: string
          valid_until?: string
          vat_cents?: number
          vat_exempt?: boolean
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "quotes_client_same_workspace"
            columns: ["client_id", "workspace_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id", "workspace_id"]
          },
          {
            foreignKeyName: "quotes_project_same_workspace"
            columns: ["project_id", "workspace_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id", "workspace_id"]
          },
          {
            foreignKeyName: "quotes_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          completed_at: string | null
          created_at: string
          created_by: string | null
          description: string | null
          due_date: string | null
          id: string
          priority: Database["public"]["Enums"]["task_priority"]
          project_id: string | null
          search_text: string | null
          status: Database["public"]["Enums"]["task_status"]
          title: string
          updated_at: string
          workspace_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          priority?: Database["public"]["Enums"]["task_priority"]
          project_id?: string | null
          search_text?: string | null
          status?: Database["public"]["Enums"]["task_status"]
          title: string
          updated_at?: string
          workspace_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          priority?: Database["public"]["Enums"]["task_priority"]
          project_id?: string | null
          search_text?: string | null
          status?: Database["public"]["Enums"]["task_status"]
          title?: string
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tasks_project_same_workspace"
            columns: ["project_id", "workspace_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id", "workspace_id"]
          },
          {
            foreignKeyName: "tasks_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      workspace_members: {
        Row: {
          created_at: string
          role: Database["public"]["Enums"]["workspace_role"]
          user_id: string
          workspace_id: string
        }
        Insert: {
          created_at?: string
          role?: Database["public"]["Enums"]["workspace_role"]
          user_id: string
          workspace_id: string
        }
        Update: {
          created_at?: string
          role?: Database["public"]["Enums"]["workspace_role"]
          user_id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workspace_members_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      workspaces: {
        Row: {
          address_line: string | null
          city: string | null
          company_name: string | null
          country: string
          created_at: string
          created_by: string | null
          currency: string
          default_vat_rate_bp: number
          email: string | null
          id: string
          is_demo: boolean
          name: string
          phone: string | null
          postal_code: string | null
          quote_footer: string | null
          quote_terms: string | null
          quote_validity_days: number
          siret: string | null
          slug: string
          timezone: string
          updated_at: string
          vat_exempt: boolean
          vat_number: string | null
        }
        Insert: {
          address_line?: string | null
          city?: string | null
          company_name?: string | null
          country?: string
          created_at?: string
          created_by?: string | null
          currency?: string
          default_vat_rate_bp?: number
          email?: string | null
          id?: string
          is_demo?: boolean
          name: string
          phone?: string | null
          postal_code?: string | null
          quote_footer?: string | null
          quote_terms?: string | null
          quote_validity_days?: number
          siret?: string | null
          slug: string
          timezone?: string
          updated_at?: string
          vat_exempt?: boolean
          vat_number?: string | null
        }
        Update: {
          address_line?: string | null
          city?: string | null
          company_name?: string | null
          country?: string
          created_at?: string
          created_by?: string | null
          currency?: string
          default_vat_rate_bp?: number
          email?: string | null
          id?: string
          is_demo?: boolean
          name?: string
          phone?: string | null
          postal_code?: string | null
          quote_footer?: string | null
          quote_terms?: string | null
          quote_validity_days?: number
          siret?: string | null
          slug?: string
          timezone?: string
          updated_at?: string
          vat_exempt?: boolean
          vat_number?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      duplicate_quote: {
        Args: { p_quote_id: string; p_workspace_id: string }
        Returns: string
      }
      save_quote: {
        Args: {
          p_items: Json
          p_quote: Json
          p_quote_id: string
          p_workspace_id: string
        }
        Returns: string
      }
      set_quote_status: {
        Args: {
          p_quote_id: string
          p_status: Database["public"]["Enums"]["quote_status"]
          p_workspace_id: string
        }
        Returns: undefined
      }
    }
    Enums: {
      client_kind: "company" | "individual"
      project_status:
        | "upcoming"
        | "in_progress"
        | "on_hold"
        | "completed"
        | "cancelled"
      quote_status: "draft" | "sent" | "accepted" | "refused"
      task_priority: "low" | "medium" | "high" | "urgent"
      task_status: "todo" | "in_progress" | "done"
      workspace_role: "owner" | "admin" | "member"
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
  public: {
    Enums: {
      client_kind: ["company", "individual"],
      project_status: [
        "upcoming",
        "in_progress",
        "on_hold",
        "completed",
        "cancelled",
      ],
      quote_status: ["draft", "sent", "accepted", "refused"],
      task_priority: ["low", "medium", "high", "urgent"],
      task_status: ["todo", "in_progress", "done"],
      workspace_role: ["owner", "admin", "member"],
    },
  },
} as const
