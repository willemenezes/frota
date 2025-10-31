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
      checklist_responses: {
        Row: {
          checklist_id: string
          conforme: boolean
          created_at: string | null
          fotos_urls: string[] | null
          id: string
          item_id: string
          observacao: string | null
        }
        Insert: {
          checklist_id: string
          conforme: boolean
          created_at?: string | null
          fotos_urls?: string[] | null
          id?: string
          item_id: string
          observacao?: string | null
        }
        Update: {
          checklist_id?: string
          conforme?: boolean
          created_at?: string | null
          fotos_urls?: string[] | null
          id?: string
          item_id?: string
          observacao?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "checklist_responses_checklist_id_fkey"
            columns: ["checklist_id"]
            isOneToOne: false
            referencedRelation: "checklists"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "checklist_responses_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "checklist_template_items"
            referencedColumns: ["id"]
          },
        ]
      }
      checklist_template_items: {
        Row: {
          created_at: string | null
          descricao: string | null
          id: string
          nome: string
          ordem: number
          template_id: string
        }
        Insert: {
          created_at?: string | null
          descricao?: string | null
          id?: string
          nome: string
          ordem: number
          template_id: string
        }
        Update: {
          created_at?: string | null
          descricao?: string | null
          id?: string
          nome?: string
          ordem?: number
          template_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "checklist_template_items_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "checklist_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      checklist_templates: {
        Row: {
          created_at: string | null
          descricao: string | null
          id: string
          nome: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          descricao?: string | null
          id?: string
          nome: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          descricao?: string | null
          id?: string
          nome?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      checklists: {
        Row: {
          assinado: boolean | null
          assinado_em: string | null
          comentarios: string | null
          created_at: string | null
          fotos_veiculo: string[] | null
          id: string
          latitude: number | null
          longitude: number | null
          motorista_contrato: string | null
          motorista_funcao: string | null
          motorista_id: string
          motorista_matricula: string | null
          motorista_nome: string | null
          odometro_final: number | null
          odometro_inicial: number
          status: Database["public"]["Enums"]["checklist_status"]
          template_id: string
          updated_at: string | null
          vehicle_id: string
        }
        Insert: {
          assinado?: boolean | null
          assinado_em?: string | null
          comentarios?: string | null
          created_at?: string | null
          fotos_veiculo?: string[] | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          motorista_contrato?: string | null
          motorista_funcao?: string | null
          motorista_id: string
          motorista_matricula?: string | null
          motorista_nome?: string | null
          odometro_final?: number | null
          odometro_inicial: number
          status?: Database["public"]["Enums"]["checklist_status"]
          template_id: string
          updated_at?: string | null
          vehicle_id: string
        }
        Update: {
          assinado?: boolean | null
          assinado_em?: string | null
          comentarios?: string | null
          created_at?: string | null
          fotos_veiculo?: string[] | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          motorista_contrato?: string | null
          motorista_funcao?: string | null
          motorista_id?: string
          motorista_matricula?: string | null
          motorista_nome?: string | null
          odometro_final?: number | null
          odometro_inicial?: number
          status?: Database["public"]["Enums"]["checklist_status"]
          template_id?: string
          updated_at?: string | null
          vehicle_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "checklists_motorista_id_fkey"
            columns: ["motorista_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "checklists_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "checklist_templates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "checklists_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      defects: {
        Row: {
          checklist_id: string | null
          created_at: string | null
          descricao: string
          foto_url: string | null
          id: string
          resolvido_em: string | null
          resolvido_por: string | null
          severidade: Database["public"]["Enums"]["defect_severity"]
          status: Database["public"]["Enums"]["defect_status"]
          updated_at: string | null
          vehicle_id: string
        }
        Insert: {
          checklist_id?: string | null
          created_at?: string | null
          descricao: string
          foto_url?: string | null
          id?: string
          resolvido_em?: string | null
          resolvido_por?: string | null
          severidade?: Database["public"]["Enums"]["defect_severity"]
          status?: Database["public"]["Enums"]["defect_status"]
          updated_at?: string | null
          vehicle_id: string
        }
        Update: {
          checklist_id?: string | null
          created_at?: string | null
          descricao?: string
          foto_url?: string | null
          id?: string
          resolvido_em?: string | null
          resolvido_por?: string | null
          severidade?: Database["public"]["Enums"]["defect_severity"]
          status?: Database["public"]["Enums"]["defect_status"]
          updated_at?: string | null
          vehicle_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "defects_checklist_id_fkey"
            columns: ["checklist_id"]
            isOneToOne: false
            referencedRelation: "checklists"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "defects_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string | null
          id: string
          nome_completo: string
          telefone: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id: string
          nome_completo: string
          telefone?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          nome_completo?: string
          telefone?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      vehicle_documents: {
        Row: {
          arquivo_url: string
          created_at: string | null
          data_vencimento: string | null
          id: string
          tipo: string
          vehicle_id: string
        }
        Insert: {
          arquivo_url: string
          created_at?: string | null
          data_vencimento?: string | null
          id?: string
          tipo: string
          vehicle_id: string
        }
        Update: {
          arquivo_url?: string
          created_at?: string | null
          data_vencimento?: string | null
          id?: string
          tipo?: string
          vehicle_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vehicle_documents_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      vehicles: {
        Row: {
          ano: number
          chassi: string | null
          created_at: string | null
          foto_url: string | null
          id: string
          modelo: string
          placa: string
          quilometragem_atual: number
          updated_at: string | null
        }
        Insert: {
          ano: number
          chassi?: string | null
          created_at?: string | null
          foto_url?: string | null
          id?: string
          modelo: string
          placa: string
          quilometragem_atual?: number
          updated_at?: string | null
        }
        Update: {
          ano?: number
          chassi?: string | null
          created_at?: string | null
          foto_url?: string | null
          id?: string
          modelo?: string
          placa?: string
          quilometragem_atual?: number
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "motorista" | "gestor" | "administrador"
      checklist_status: "ok" | "com_defeito" | "pendente" | "concluido"
      defect_severity: "leve" | "moderado" | "critico"
      defect_status: "aberto" | "em_analise" | "resolvido"
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
      app_role: ["motorista", "gestor", "administrador"],
      checklist_status: ["ok", "com_defeito", "pendente", "concluido"],
      defect_severity: ["leve", "moderado", "critico"],
      defect_status: ["aberto", "em_analise", "resolvido"],
    },
  },
} as const
