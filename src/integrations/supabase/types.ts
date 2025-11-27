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
      ganhos_despesas: {
        Row: {
          categoria: string
          created_at: string
          data: string
          id: string
          observacoes: string | null
          recorrente: boolean
          tipo: string
          user_id: string
          valor: number
        }
        Insert: {
          categoria: string
          created_at?: string
          data: string
          id?: string
          observacoes?: string | null
          recorrente?: boolean
          tipo: string
          user_id: string
          valor: number
        }
        Update: {
          categoria?: string
          created_at?: string
          data?: string
          id?: string
          observacoes?: string | null
          recorrente?: boolean
          tipo?: string
          user_id?: string
          valor?: number
        }
        Relationships: []
      }
      manutencoes: {
        Row: {
          comprovante_url: string | null
          created_at: string
          data: string
          id: string
          km_atual: number
          observacoes: string | null
          proximo_km: number | null
          tipo_manutencao: string
          user_id: string
          valor: number
          veiculo_id: string
        }
        Insert: {
          comprovante_url?: string | null
          created_at?: string
          data: string
          id?: string
          km_atual: number
          observacoes?: string | null
          proximo_km?: number | null
          tipo_manutencao: string
          user_id: string
          valor: number
          veiculo_id: string
        }
        Update: {
          comprovante_url?: string | null
          created_at?: string
          data?: string
          id?: string
          km_atual?: number
          observacoes?: string | null
          proximo_km?: number | null
          tipo_manutencao?: string
          user_id?: string
          valor?: number
          veiculo_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "manutencoes_veiculo_id_fkey"
            columns: ["veiculo_id"]
            isOneToOne: false
            referencedRelation: "veiculos"
            referencedColumns: ["id"]
          },
        ]
      }
      metas: {
        Row: {
          ativa: boolean
          created_at: string
          data_fim: string
          data_inicio: string
          id: string
          tipo: string
          user_id: string
          valor_meta: number
        }
        Insert: {
          ativa?: boolean
          created_at?: string
          data_fim: string
          data_inicio: string
          id?: string
          tipo: string
          user_id: string
          valor_meta: number
        }
        Update: {
          ativa?: boolean
          created_at?: string
          data_fim?: string
          data_inicio?: string
          id?: string
          tipo?: string
          user_id?: string
          valor_meta?: number
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          cpf: string | null
          created_at: string | null
          id: string
          nome_completo: string | null
          telefone: string | null
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          cpf?: string | null
          created_at?: string | null
          id: string
          nome_completo?: string | null
          telefone?: string | null
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          cpf?: string | null
          created_at?: string | null
          id?: string
          nome_completo?: string | null
          telefone?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      turno_fontes_ganho: {
        Row: {
          created_at: string
          fonte_ganho: string
          id: string
          quantidade_corridas: number
          turno_id: string
          user_id: string
          valor_ganho: number
        }
        Insert: {
          created_at?: string
          fonte_ganho: string
          id?: string
          quantidade_corridas?: number
          turno_id: string
          user_id: string
          valor_ganho?: number
        }
        Update: {
          created_at?: string
          fonte_ganho?: string
          id?: string
          quantidade_corridas?: number
          turno_id?: string
          user_id?: string
          valor_ganho?: number
        }
        Relationships: [
          {
            foreignKeyName: "turno_fontes_ganho_turno_id_fkey"
            columns: ["turno_id"]
            isOneToOne: false
            referencedRelation: "turnos_km"
            referencedColumns: ["id"]
          },
        ]
      }
      turnos_km: {
        Row: {
          categoria_ganho: string
          consumo_combustivel: number
          created_at: string
          data: string
          fonte_ganho: string
          hora_fim: string
          hora_inicio: string
          id: string
          km_final: number
          km_inicial: number
          lucro_liquido: number | null
          preco_combustivel: number
          quantidade_corridas: number
          tipo_combustivel: string
          total_horas: number | null
          user_id: string
          valor_ganho: number
          veiculo_id: string
        }
        Insert: {
          categoria_ganho: string
          consumo_combustivel: number
          created_at?: string
          data: string
          fonte_ganho: string
          hora_fim: string
          hora_inicio: string
          id?: string
          km_final: number
          km_inicial: number
          lucro_liquido?: number | null
          preco_combustivel: number
          quantidade_corridas?: number
          tipo_combustivel: string
          total_horas?: number | null
          user_id: string
          valor_ganho: number
          veiculo_id: string
        }
        Update: {
          categoria_ganho?: string
          consumo_combustivel?: number
          created_at?: string
          data?: string
          fonte_ganho?: string
          hora_fim?: string
          hora_inicio?: string
          id?: string
          km_final?: number
          km_inicial?: number
          lucro_liquido?: number | null
          preco_combustivel?: number
          quantidade_corridas?: number
          tipo_combustivel?: string
          total_horas?: number | null
          user_id?: string
          valor_ganho?: number
          veiculo_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "turnos_km_veiculo_id_fkey"
            columns: ["veiculo_id"]
            isOneToOne: false
            referencedRelation: "veiculos"
            referencedColumns: ["id"]
          },
        ]
      }
      veiculos: {
        Row: {
          ano: number | null
          created_at: string
          id: string
          modelo: string
          placa: string
          user_id: string
        }
        Insert: {
          ano?: number | null
          created_at?: string
          id?: string
          modelo: string
          placa: string
          user_id: string
        }
        Update: {
          ano?: number | null
          created_at?: string
          id?: string
          modelo?: string
          placa?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
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
