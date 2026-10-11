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
      jawan28_schedules: {
        Row: { amount_due: number; amount_paid: number; due_date: string; id: string; order_id: string; tranche: number }
        Insert: { amount_due: number; amount_paid?: number; due_date: string; id?: string; order_id: string; tranche: number }
        Update: { amount_due?: number; amount_paid?: number; due_date?: string; id?: string; order_id?: string; tranche?: number }
        Relationships: [
          { foreignKeyName: "jawan28_schedules_order_id_fkey"; columns: ["order_id"]; isOneToOne: false; referencedRelation: "orders"; referencedColumns: ["id"] },
        ]
      }
      meat_availability: {
        Row: {
          available: boolean
          meat_id: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          available?: boolean
          meat_id: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          available?: boolean
          meat_id?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      order_items: {
        Row: {
          cut: string | null
          format_id: string
          format_kg: number
          id: string
          label: string
          line_total: number
          meat_id: string | null
          mix: Json | null
          order_id: string
          qty: number
          unit_price: number
        }
        Insert: {
          cut?: string | null
          format_id: string
          format_kg: number
          id?: string
          label: string
          line_total: number
          meat_id?: string | null
          mix?: Json | null
          order_id: string
          qty: number
          unit_price: number
        }
        Update: {
          cut?: string | null
          format_id?: string
          format_kg?: number
          id?: string
          label?: string
          line_total?: number
          meat_id?: string | null
          mix?: Json | null
          order_id?: string
          qty?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      order_status_logs: {
        Row: {
          changed_by: string | null
          comment: string
          created_at: string
          id: number
          new_status: string
          old_status: string | null
          order_id: string
        }
        Insert: {
          changed_by?: string | null
          comment?: string
          created_at?: string
          id?: never
          new_status: string
          old_status?: string | null
          order_id: string
        }
        Update: {
          changed_by?: string | null
          comment?: string
          created_at?: string
          id?: never
          new_status?: string
          old_status?: string | null
          order_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "order_status_logs_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          area: string
          created_at: string
          customer_name: string
          customer_phone: string
          delivery_when: string
          gps_accuracy: number | null
          id: string
          jawan28_decision: string | null
          jawan28_requested: boolean
          lat: number | null
          lng: number | null
          note: string
          number: string
          payment_method: string
          source: string
          status: string
          total_fcfa: number
          total_kg: number
          updated_at: string
        }
        Insert: {
          area?: string
          created_at?: string
          customer_name: string
          customer_phone: string
          delivery_when?: string
          gps_accuracy?: number | null
          id?: string
          jawan28_decision?: string | null
          jawan28_requested?: boolean
          lat?: number | null
          lng?: number | null
          note?: string
          number?: string
          payment_method: string
          source?: string
          status?: string
          total_fcfa: number
          total_kg: number
          updated_at?: string
        }
        Update: {
          area?: string
          created_at?: string
          customer_name?: string
          customer_phone?: string
          delivery_when?: string
          gps_accuracy?: number | null
          id?: string
          jawan28_decision?: string | null
          jawan28_requested?: boolean
          lat?: number | null
          lng?: number | null
          note?: string
          number?: string
          payment_method?: string
          source?: string
          status?: string
          total_fcfa?: number
          total_kg?: number
          updated_at?: string
        }
        Relationships: []
      }
      payment_transactions: {
        Row: { amount: number; comment: string; id: string; method: string; order_id: string; paid_at: string; received_by: string | null; reference: string; schedule_id: string | null }
        Insert: { amount: number; comment?: string; id?: string; method: string; order_id: string; paid_at?: string; received_by?: string | null; reference?: string; schedule_id?: string | null }
        Update: { amount?: number; comment?: string; id?: string; method?: string; order_id?: string; paid_at?: string; received_by?: string | null; reference?: string; schedule_id?: string | null }
        Relationships: [
          { foreignKeyName: "payment_transactions_order_id_fkey"; columns: ["order_id"]; isOneToOne: false; referencedRelation: "orders"; referencedColumns: ["id"] },
          { foreignKeyName: "payment_transactions_schedule_id_fkey"; columns: ["schedule_id"]; isOneToOne: false; referencedRelation: "jawan28_schedules"; referencedColumns: ["id"] },
        ]
      }
      promos: {
        Row: {
          active: boolean
          id: string
          name: string
          offer: string
          sort: number
          tagline: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          id: string
          name: string
          offer?: string
          sort?: number
          tagline?: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          id?: string
          name?: string
          offer?: string
          sort?: number
          tagline?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_public_promos: {
        Args: never
        Returns: {
          active: boolean
          id: string
          name: string
          offer: string
          sort: number
          tagline: string
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_staff: { Args: { _user_id: string }; Returns: boolean }
      decide_jawan28: {
        Args: { _accept: boolean; _comment?: string; _order_id: string; _start?: string }
        Returns: undefined
      }
      record_payment: {
        Args: { _amount: number; _comment?: string; _method: string; _order_id: string; _reference: string; _schedule_id: string | null }
        Returns: string
      }
      set_meat_availability: {
        Args: { _available: boolean; _meat_id: string }
        Returns: undefined
      }
      set_order_status: {
        Args: { _comment?: string; _order_id: string; _status: string }
        Returns: string
      }
      create_web_order: {
        Args: { _order: Json; _items: Json }
        Returns: { order_id: string; order_number: string }[]
      }
    }
    Enums: {
      app_role: "admin" | "user" | "pdg" | "gestionnaire"
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
      app_role: ["admin", "user", "pdg", "gestionnaire"],
    },
  },
} as const
