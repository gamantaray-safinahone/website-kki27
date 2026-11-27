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
    PostgrestVersion: "17.1"
  }
  public: {
    Tables: {
      app_admins: {
        Row: {
          created_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          user_id?: string
        }
        Relationships: []
      }
      app_state: {
        Row: {
          active_lintasan: string | null
          id: boolean
          live_run_id: string | null
          phase_order: string[]
          updated_at: string
        }
        Insert: {
          active_lintasan?: string | null
          id?: boolean
          live_run_id?: string | null
          phase_order?: string[]
          updated_at?: string
        }
        Update: {
          active_lintasan?: string | null
          id?: boolean
          live_run_id?: string | null
          phase_order?: string[]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "app_state_active_lintasan_fkey"
            columns: ["active_lintasan"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["lintasan"]
          },
          {
            foreignKeyName: "app_state_live_run_id_fkey"
            columns: ["live_run_id"]
            isOneToOne: false
            referencedRelation: "runs"
            referencedColumns: ["id"]
          },
        ]
      }
      captures: {
        Row: {
          captured_at: string
          cog_deg: number | null
          detection: Json | null
          heading_deg: number | null
          hidden: boolean
          id: number
          lat: number | null
          lon: number | null
          meta: Json | null
          received_at: string
          run_id: string
          slot: string
          sog_ms: number | null
          storage_path: string
          surface_path: string | null
          surface_thumb_path: string | null
          thumb_path: string | null
        }
        Insert: {
          captured_at: string
          cog_deg?: number | null
          detection?: Json | null
          heading_deg?: number | null
          hidden?: boolean
          id?: never
          lat?: number | null
          lon?: number | null
          meta?: Json | null
          received_at?: string
          run_id: string
          slot: string
          sog_ms?: number | null
          storage_path: string
          surface_path?: string | null
          surface_thumb_path?: string | null
          thumb_path?: string | null
        }
        Update: {
          captured_at?: string
          cog_deg?: number | null
          detection?: Json | null
          heading_deg?: number | null
          hidden?: boolean
          id?: never
          lat?: number | null
          lon?: number | null
          meta?: Json | null
          received_at?: string
          run_id?: string
          slot?: string
          sog_ms?: number | null
          storage_path?: string
          surface_path?: string | null
          surface_thumb_path?: string | null
          thumb_path?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "captures_run_id_fkey"
            columns: ["run_id"]
            isOneToOne: false
            referencedRelation: "runs"
            referencedColumns: ["id"]
          },
        ]
      }
      course_items: {
        Row: {
          id: number
          kind: string
          label: string | null
          lat: number
          lintasan: string
          lon: number
          seq: number
          updated_at: string
        }
        Insert: {
          id?: never
          kind: string
          label?: string | null
          lat: number
          lintasan: string
          lon: number
          seq?: number
          updated_at?: string
        }
        Update: {
          id?: never
          kind?: string
          label?: string | null
          lat?: number
          lintasan?: string
          lon?: number
          seq?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_items_lintasan_fkey"
            columns: ["lintasan"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["lintasan"]
          },
        ]
      }
      courses: {
        Row: {
          center_lat: number | null
          center_lon: number | null
          grid_bearing_deg: number
          grid_cell_m: number
          grid_cols: number
          grid_rows: number
          imaging_slots: string[]
          lintasan: string
          updated_at: string
          zoom: number
        }
        Insert: {
          center_lat?: number | null
          center_lon?: number | null
          grid_bearing_deg?: number
          grid_cell_m?: number
          grid_cols?: number
          grid_rows?: number
          imaging_slots: string[]
          lintasan: string
          updated_at?: string
          zoom?: number
        }
        Update: {
          center_lat?: number | null
          center_lon?: number | null
          grid_bearing_deg?: number
          grid_cell_m?: number
          grid_cols?: number
          grid_rows?: number
          imaging_slots?: string[]
          lintasan?: string
          updated_at?: string
          zoom?: number
        }
        Relationships: []
      }
      mission_events: {
        Row: {
          detail: Json | null
          id: number
          phase: string
          received_at: string
          run_id: string
          status: string
          t: string
        }
        Insert: {
          detail?: Json | null
          id?: never
          phase: string
          received_at?: string
          run_id: string
          status: string
          t: string
        }
        Update: {
          detail?: Json | null
          id?: never
          phase?: string
          received_at?: string
          run_id?: string
          status?: string
          t?: string
        }
        Relationships: [
          {
            foreignKeyName: "mission_events_run_id_fkey"
            columns: ["run_id"]
            isOneToOne: false
            referencedRelation: "runs"
            referencedColumns: ["id"]
          },
        ]
      }
      runs: {
        Row: {
          course_snapshot: Json | null
          created_at: string
          end_reason: string | null
          ended_at: string | null
          id: string
          is_official: boolean
          label: string | null
          lintasan: string | null
          notes: string | null
          source: string
          started_at: string
          status: string
        }
        Insert: {
          course_snapshot?: Json | null
          created_at?: string
          end_reason?: string | null
          ended_at?: string | null
          id?: string
          is_official?: boolean
          label?: string | null
          lintasan?: string | null
          notes?: string | null
          source?: string
          started_at?: string
          status?: string
        }
        Update: {
          course_snapshot?: Json | null
          created_at?: string
          end_reason?: string | null
          ended_at?: string | null
          id?: string
          is_official?: boolean
          label?: string | null
          lintasan?: string | null
          notes?: string | null
          source?: string
          started_at?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "runs_lintasan_fkey"
            columns: ["lintasan"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["lintasan"]
          },
        ]
      }
      telemetry: {
        Row: {
          armed: boolean | null
          battery_a: number | null
          battery_pct: number | null
          battery_v: number | null
          cog_deg: number | null
          docking_phase: string | null
          fcu_connected: boolean | null
          fcu_mode: string | null
          gps_fix: number | null
          gps_sats: number | null
          heading_deg: number | null
          id: number
          lat: number | null
          lon: number | null
          mission_state: string | null
          received_at: string
          run_id: string
          sog_ms: number | null
          t: string
        }
        Insert: {
          armed?: boolean | null
          battery_a?: number | null
          battery_pct?: number | null
          battery_v?: number | null
          cog_deg?: number | null
          docking_phase?: string | null
          fcu_connected?: boolean | null
          fcu_mode?: string | null
          gps_fix?: number | null
          gps_sats?: number | null
          heading_deg?: number | null
          id?: never
          lat?: number | null
          lon?: number | null
          mission_state?: string | null
          received_at?: string
          run_id: string
          sog_ms?: number | null
          t: string
        }
        Update: {
          armed?: boolean | null
          battery_a?: number | null
          battery_pct?: number | null
          battery_v?: number | null
          cog_deg?: number | null
          docking_phase?: string | null
          fcu_connected?: boolean | null
          fcu_mode?: string | null
          gps_fix?: number | null
          gps_sats?: number | null
          heading_deg?: number | null
          id?: never
          lat?: number | null
          lon?: number | null
          mission_state?: string | null
          received_at?: string
          run_id?: string
          sog_ms?: number | null
          t?: string
        }
        Relationships: [
          {
            foreignKeyName: "telemetry_run_id_fkey"
            columns: ["run_id"]
            isOneToOne: false
            referencedRelation: "runs"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      mission_status: {
        Row: {
          detail: Json | null
          phase: string | null
          run_id: string | null
          status: string | null
          t: string | null
        }
        Relationships: [
          {
            foreignKeyName: "mission_events_run_id_fkey"
            columns: ["run_id"]
            isOneToOne: false
            referencedRelation: "runs"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      get_run_series: {
        Args: { p_run_id: string; p_step?: number }
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
    Enums: {},
  },
} as const
