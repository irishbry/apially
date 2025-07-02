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
      backup_logs: {
        Row: {
          backup_type: string
          created_at: string
          dropbox_url: string | null
          file_name: string
          file_path: string
          file_size: number | null
          format: string
          id: string
          record_count: number
          status: string
          storage_path: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          backup_type?: string
          created_at?: string
          dropbox_url?: string | null
          file_name: string
          file_path: string
          file_size?: number | null
          format?: string
          id?: string
          record_count?: number
          status?: string
          storage_path?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          backup_type?: string
          created_at?: string
          dropbox_url?: string | null
          file_name?: string
          file_path?: string
          file_size?: number | null
          format?: string
          id?: string
          record_count?: number
          status?: string
          storage_path?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      data_entries: {
        Row: {
          backed_up_dropbox: boolean | null
          backed_up_email: boolean | null
          created_at: string
          file_name: string
          file_path: string
          id: string
          last_dropbox_backup: string | null
          last_email_backup: string | null
          metadata: Json | null
          sensor_id: string | null
          source_id: string | null
          timestamp: string
          user_id: string | null
        }
        Insert: {
          backed_up_dropbox?: boolean | null
          backed_up_email?: boolean | null
          created_at?: string
          file_name: string
          file_path: string
          id?: string
          last_dropbox_backup?: string | null
          last_email_backup?: string | null
          metadata?: Json | null
          sensor_id?: string | null
          source_id?: string | null
          timestamp?: string
          user_id?: string | null
        }
        Update: {
          backed_up_dropbox?: boolean | null
          backed_up_email?: boolean | null
          created_at?: string
          file_name?: string
          file_path?: string
          id?: string
          last_dropbox_backup?: string | null
          last_email_backup?: string | null
          metadata?: Json | null
          sensor_id?: string | null
          source_id?: string | null
          timestamp?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "data_entries_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "sources"
            referencedColumns: ["id"]
          },
        ]
      }
      dropbox_configs: {
        Row: {
          access_token_expires_at: string | null
          app_key: string | null
          app_secret: string | null
          created_at: string
          daily_backup_enabled: boolean
          dropbox_path: string
          dropbox_token: string | null
          id: string
          is_active: boolean
          refresh_token: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          access_token_expires_at?: string | null
          app_key?: string | null
          app_secret?: string | null
          created_at?: string
          daily_backup_enabled?: boolean
          dropbox_path: string
          dropbox_token?: string | null
          id?: string
          is_active?: boolean
          refresh_token?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          access_token_expires_at?: string | null
          app_key?: string | null
          app_secret?: string | null
          created_at?: string
          daily_backup_enabled?: boolean
          dropbox_path?: string
          dropbox_token?: string | null
          id?: string
          is_active?: boolean
          refresh_token?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      scheduled_exports: {
        Row: {
          active: boolean | null
          created_at: string | null
          delivery: string
          email: string | null
          format: string
          frequency: string
          id: string
          last_export: string | null
          name: string
          next_export: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          active?: boolean | null
          created_at?: string | null
          delivery: string
          email?: string | null
          format: string
          frequency: string
          id?: string
          last_export?: string | null
          name: string
          next_export?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          active?: boolean | null
          created_at?: string | null
          delivery?: string
          email?: string | null
          format?: string
          frequency?: string
          id?: string
          last_export?: string | null
          name?: string
          next_export?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      schema_configs: {
        Row: {
          api_key: string | null
          created_at: string
          description: string | null
          field_types: Json
          id: string
          name: string
          required_fields: Json
          updated_at: string
          user_id: string | null
        }
        Insert: {
          api_key?: string | null
          created_at?: string
          description?: string | null
          field_types?: Json
          id?: string
          name: string
          required_fields?: Json
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          api_key?: string | null
          created_at?: string
          description?: string | null
          field_types?: Json
          id?: string
          name?: string
          required_fields?: Json
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "schema_configs_api_key_fkey"
            columns: ["api_key"]
            isOneToOne: true
            referencedRelation: "sources"
            referencedColumns: ["api_key"]
          },
        ]
      }
      sources: {
        Row: {
          active: boolean
          api_key: string
          created_at: string
          data_count: number
          id: string
          last_active: string | null
          name: string
          schema: Json | null
          url: string | null
          user_id: string
        }
        Insert: {
          active?: boolean
          api_key: string
          created_at?: string
          data_count?: number
          id?: string
          last_active?: string | null
          name: string
          schema?: Json | null
          url?: string | null
          user_id: string
        }
        Update: {
          active?: boolean
          api_key?: string
          created_at?: string
          data_count?: number
          id?: string
          last_active?: string | null
          name?: string
          schema?: Json | null
          url?: string | null
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      generate_unique_api_key: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      process_scheduled_exports: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      trigger_daily_backups: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      update_source_schema: {
        Args: { p_api_key: string; p_schema: Json }
        Returns: undefined
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
