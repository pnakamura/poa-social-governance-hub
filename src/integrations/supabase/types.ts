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
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      atividades: {
        Row: {
          atualizado_em: string | null
          componente: string | null
          criado_em: string | null
          id: string
          prazo: string | null
          prioridade: string | null
          progresso: number | null
          responsavel: string | null
          status: string | null
          titulo: string
        }
        Insert: {
          atualizado_em?: string | null
          componente?: string | null
          criado_em?: string | null
          id?: string
          prazo?: string | null
          prioridade?: string | null
          progresso?: number | null
          responsavel?: string | null
          status?: string | null
          titulo: string
        }
        Update: {
          atualizado_em?: string | null
          componente?: string | null
          criado_em?: string | null
          id?: string
          prazo?: string | null
          prioridade?: string | null
          progresso?: number | null
          responsavel?: string | null
          status?: string | null
          titulo?: string
        }
        Relationships: []
      }
      nao_objecoes: {
        Row: {
          criado_em: string | null
          id: string
          observacoes: string | null
          processo: string
          recebido_em: string | null
          solicitado_em: string | null
          status: string | null
          tipo: string | null
          valor_usd: number | null
        }
        Insert: {
          criado_em?: string | null
          id?: string
          observacoes?: string | null
          processo: string
          recebido_em?: string | null
          solicitado_em?: string | null
          status?: string | null
          tipo?: string | null
          valor_usd?: number | null
        }
        Update: {
          criado_em?: string | null
          id?: string
          observacoes?: string | null
          processo?: string
          recebido_em?: string | null
          solicitado_em?: string | null
          status?: string | null
          tipo?: string | null
          valor_usd?: number | null
        }
        Relationships: []
      }
      notas_criticas: {
        Row: {
          autor: string | null
          componente: string | null
          criado_em: string | null
          id: string
          nota: string
        }
        Insert: {
          autor?: string | null
          componente?: string | null
          criado_em?: string | null
          id?: string
          nota: string
        }
        Update: {
          autor?: string | null
          componente?: string | null
          criado_em?: string | null
          id?: string
          nota?: string
        }
        Relationships: []
      }
      osrl_assessments: {
        Row: {
          created_at: string
          email: string
          id: string
          osrl_level: number
          overall_score: number
          personalized_analysis: Json
          pillar_scores: Json
          report_html: string
          responses: Json
          timestamp: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          osrl_level: number
          overall_score: number
          personalized_analysis: Json
          pillar_scores: Json
          report_html: string
          responses: Json
          timestamp?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          osrl_level?: number
          overall_score?: number
          personalized_analysis?: Json
          pillar_scores?: Json
          report_html?: string
          responses?: Json
          timestamp?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      pep_entries: {
        Row: {
          comp: number | null
          descricao: string | null
          id: string
          importado_em: string | null
          linha_excel: number | null
          n_atual: number | null
          o_atual: number | null
          p_atual: number | null
          pct: number | null
          prod: number | null
          r_base: number | null
          ref: string
          s_base: number | null
          subp: number | null
          t_base: number | null
          versao: string
        }
        Insert: {
          comp?: number | null
          descricao?: string | null
          id?: string
          importado_em?: string | null
          linha_excel?: number | null
          n_atual?: number | null
          o_atual?: number | null
          p_atual?: number | null
          pct?: number | null
          prod?: number | null
          r_base?: number | null
          ref: string
          s_base?: number | null
          subp?: number | null
          t_base?: number | null
          versao?: string
        }
        Update: {
          comp?: number | null
          descricao?: string | null
          id?: string
          importado_em?: string | null
          linha_excel?: number | null
          n_atual?: number | null
          o_atual?: number | null
          p_atual?: number | null
          pct?: number | null
          prod?: number | null
          r_base?: number | null
          ref?: string
          s_base?: number | null
          subp?: number | null
          t_base?: number | null
          versao?: string
        }
        Relationships: []
      }
      pmr_outcomes: {
        Row: {
          codigo: string | null
          componente: string | null
          descricao: string | null
          fonte_dados: string | null
          id: string
          importado_em: string | null
          linha_base: number | null
          meta_contrato: number | null
          objetivo: string | null
          pct_realizado: number | null
          periodo_ref: string | null
          realizado: number | null
          unidade: string | null
        }
        Insert: {
          codigo?: string | null
          componente?: string | null
          descricao?: string | null
          fonte_dados?: string | null
          id?: string
          importado_em?: string | null
          linha_base?: number | null
          meta_contrato?: number | null
          objetivo?: string | null
          pct_realizado?: number | null
          periodo_ref?: string | null
          realizado?: number | null
          unidade?: string | null
        }
        Update: {
          codigo?: string | null
          componente?: string | null
          descricao?: string | null
          fonte_dados?: string | null
          id?: string
          importado_em?: string | null
          linha_base?: number | null
          meta_contrato?: number | null
          objetivo?: string | null
          pct_realizado?: number | null
          periodo_ref?: string | null
          realizado?: number | null
          unidade?: string | null
        }
        Relationships: []
      }
      pmr_outputs: {
        Row: {
          codigo: string | null
          componente: string | null
          descricao: string | null
          id: string
          importado_em: string | null
          linha_base: number | null
          meta_contrato: number | null
          meta_periodo: number | null
          pct_realizado: number | null
          periodo_ref: string | null
          produto: string | null
          realizado: number | null
          unidade: string | null
        }
        Insert: {
          codigo?: string | null
          componente?: string | null
          descricao?: string | null
          id?: string
          importado_em?: string | null
          linha_base?: number | null
          meta_contrato?: number | null
          meta_periodo?: number | null
          pct_realizado?: number | null
          periodo_ref?: string | null
          produto?: string | null
          realizado?: number | null
          unidade?: string | null
        }
        Update: {
          codigo?: string | null
          componente?: string | null
          descricao?: string | null
          id?: string
          importado_em?: string | null
          linha_base?: number | null
          meta_contrato?: number | null
          meta_periodo?: number | null
          pct_realizado?: number | null
          periodo_ref?: string | null
          produto?: string | null
          realizado?: number | null
          unidade?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          cargo: string | null
          created_at: string
          departamento: string | null
          email: string
          id: string
          nome: string
          role: Database["public"]["Enums"]["user_role"]
          telefone: string | null
          updated_at: string
        }
        Insert: {
          cargo?: string | null
          created_at?: string
          departamento?: string | null
          email: string
          id: string
          nome: string
          role?: Database["public"]["Enums"]["user_role"]
          telefone?: string | null
          updated_at?: string
        }
        Update: {
          cargo?: string | null
          created_at?: string
          departamento?: string | null
          email?: string
          id?: string
          nome?: string
          role?: Database["public"]["Enums"]["user_role"]
          telefone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      programas: {
        Row: {
          codigo: string | null
          created_at: string
          descricao: string | null
          id: string
          nome: string
          status: string | null
          updated_at: string
        }
        Insert: {
          codigo?: string | null
          created_at?: string
          descricao?: string | null
          id?: string
          nome: string
          status?: string | null
          updated_at?: string
        }
        Update: {
          codigo?: string | null
          created_at?: string
          descricao?: string | null
          id?: string
          nome?: string
          status?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      projetos: {
        Row: {
          created_at: string
          data_fim: string | null
          data_inicio: string | null
          descricao: string | null
          gestor_id: string | null
          id: string
          nome: string
          status: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          data_fim?: string | null
          data_inicio?: string | null
          descricao?: string | null
          gestor_id?: string | null
          id?: string
          nome: string
          status?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          data_fim?: string | null
          data_inicio?: string | null
          descricao?: string | null
          gestor_id?: string | null
          id?: string
          nome?: string
          status?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "projetos_gestor_id_fkey"
            columns: ["gestor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      recomendacoes: {
        Row: {
          componente: string | null
          criado_em: string | null
          descricao: string | null
          id: string
          status: string | null
          titulo: string
          urgencia: string | null
        }
        Insert: {
          componente?: string | null
          criado_em?: string | null
          descricao?: string | null
          id?: string
          status?: string | null
          titulo: string
          urgencia?: string | null
        }
        Update: {
          componente?: string | null
          criado_em?: string | null
          descricao?: string | null
          id?: string
          status?: string | null
          titulo?: string
          urgencia?: string | null
        }
        Relationships: []
      }
      riscos: {
        Row: {
          atualizado_em: string | null
          categoria: string
          criado_em: string | null
          descricao: string
          id: string
          impacto: number
          mitigacao: string | null
          nivel: number | null
          probabilidade: number
          responsavel: string | null
          status: string | null
        }
        Insert: {
          atualizado_em?: string | null
          categoria: string
          criado_em?: string | null
          descricao: string
          id?: string
          impacto: number
          mitigacao?: string | null
          nivel?: number | null
          probabilidade: number
          responsavel?: string | null
          status?: string | null
        }
        Update: {
          atualizado_em?: string | null
          categoria?: string
          criado_em?: string | null
          descricao?: string
          id?: string
          impacto?: number
          mitigacao?: string | null
          nivel?: number | null
          probabilidade?: number
          responsavel?: string | null
          status?: string | null
        }
        Relationships: []
      }
      riscos_causas: {
        Row: {
          categoria: string | null
          created_at: string
          descricao: string
          id: string
          risco_id: string
          updated_at: string
        }
        Insert: {
          categoria?: string | null
          created_at?: string
          descricao: string
          id?: string
          risco_id: string
          updated_at?: string
        }
        Update: {
          categoria?: string | null
          created_at?: string
          descricao?: string
          id?: string
          risco_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      riscos_historico: {
        Row: {
          acao: string
          created_at: string
          dados_anteriores: Json | null
          dados_novos: Json | null
          id: string
          observacoes: string | null
          risco_id: string
          usuario_id: string
        }
        Insert: {
          acao: string
          created_at?: string
          dados_anteriores?: Json | null
          dados_novos?: Json | null
          id?: string
          observacoes?: string | null
          risco_id: string
          usuario_id: string
        }
        Update: {
          acao?: string
          created_at?: string
          dados_anteriores?: Json | null
          dados_novos?: Json | null
          id?: string
          observacoes?: string | null
          risco_id?: string
          usuario_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "riscos_historico_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      riscos_variaveis_historico: {
        Row: {
          created_at: string
          data_snapshot: string
          id: string
          impacto: Database["public"]["Enums"]["risk_impact"]
          nivel_risco: Database["public"]["Enums"]["risk_level"]
          observacoes: string | null
          probabilidade: Database["public"]["Enums"]["risk_probability"]
          risco_id: string
          status: Database["public"]["Enums"]["risk_status"]
          usuario_id: string
        }
        Insert: {
          created_at?: string
          data_snapshot?: string
          id?: string
          impacto: Database["public"]["Enums"]["risk_impact"]
          nivel_risco: Database["public"]["Enums"]["risk_level"]
          observacoes?: string | null
          probabilidade: Database["public"]["Enums"]["risk_probability"]
          risco_id: string
          status: Database["public"]["Enums"]["risk_status"]
          usuario_id: string
        }
        Update: {
          created_at?: string
          data_snapshot?: string
          id?: string
          impacto?: Database["public"]["Enums"]["risk_impact"]
          nivel_risco?: Database["public"]["Enums"]["risk_level"]
          observacoes?: string | null
          probabilidade?: Database["public"]["Enums"]["risk_probability"]
          risco_id?: string
          status?: Database["public"]["Enums"]["risk_status"]
          usuario_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "riscos_variaveis_historico_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      templates: {
        Row: {
          category: string
          created_at: string
          created_by: string
          description: string | null
          downloads: number | null
          file_path: string | null
          file_size: number | null
          file_type: string | null
          id: string
          is_public: boolean | null
          metadata: Json | null
          title: string
          type: string
          updated_at: string
        }
        Insert: {
          category: string
          created_at?: string
          created_by: string
          description?: string | null
          downloads?: number | null
          file_path?: string | null
          file_size?: number | null
          file_type?: string | null
          id?: string
          is_public?: boolean | null
          metadata?: Json | null
          title: string
          type: string
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          created_by?: string
          description?: string | null
          downloads?: number | null
          file_path?: string | null
          file_size?: number | null
          file_type?: string | null
          id?: string
          is_public?: boolean | null
          metadata?: Json | null
          title?: string
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "templates_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      termos_referencia: {
        Row: {
          budget: string
          created_at: string
          created_by: string
          description: string
          duration: string
          error_message: string | null
          experience_criteria: string
          experience_weight: number
          google_docs_url: string | null
          id: string
          n8n_processed_at: string | null
          n8n_request_id: string
          n8n_response: Json | null
          objective: string
          programa_id: string | null
          requirements: string | null
          scope: string
          status: string
          technical_criteria: string
          technical_weight: number
          template_id: string | null
          title: string
          type: string
          updated_at: string
        }
        Insert: {
          budget: string
          created_at?: string
          created_by: string
          description: string
          duration: string
          error_message?: string | null
          experience_criteria: string
          experience_weight?: number
          google_docs_url?: string | null
          id?: string
          n8n_processed_at?: string | null
          n8n_request_id: string
          n8n_response?: Json | null
          objective: string
          programa_id?: string | null
          requirements?: string | null
          scope: string
          status?: string
          technical_criteria: string
          technical_weight?: number
          template_id?: string | null
          title: string
          type: string
          updated_at?: string
        }
        Update: {
          budget?: string
          created_at?: string
          created_by?: string
          description?: string
          duration?: string
          error_message?: string | null
          experience_criteria?: string
          experience_weight?: number
          google_docs_url?: string | null
          id?: string
          n8n_processed_at?: string | null
          n8n_request_id?: string
          n8n_response?: Json | null
          objective?: string
          programa_id?: string | null
          requirements?: string | null
          scope?: string
          status?: string
          technical_criteria?: string
          technical_weight?: number
          template_id?: string | null
          title?: string
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "termos_referencia_programa_id_fkey"
            columns: ["programa_id"]
            isOneToOne: false
            referencedRelation: "programas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "termos_referencia_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "templates"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          assigned_at: string
          assigned_by: string | null
          id: string
          role: Database["public"]["Enums"]["user_role"]
          user_id: string
        }
        Insert: {
          assigned_at?: string
          assigned_by?: string | null
          id?: string
          role: Database["public"]["Enums"]["user_role"]
          user_id: string
        }
        Update: {
          assigned_at?: string
          assigned_by?: string | null
          id?: string
          role?: Database["public"]["Enums"]["user_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      analyze_common_causes: {
        Args: never
        Returns: {
          categorias: string[]
          causa_descricao: string
          complexidade_score: number
          confiabilidade_score: number
          criticidade_score: number
          frequencia: number
          impacto_score: number
          riscos_alto_impacto: number
          riscos_baixo_impacto: number
          riscos_medio_impacto: number
          score_final: number
          tendencia_score: number
        }[]
      }
      analyze_common_causes_enhanced: {
        Args: never
        Returns: {
          categorias: string[]
          causa_descricao: string
          complexidade_score: number
          confiabilidade_score: number
          criticidade_score: number
          frequencia: number
          impacto_score: number
          riscos_afetados: string[]
          riscos_alto_impacto: number
          riscos_baixo_impacto: number
          riscos_medio_impacto: number
          score_final: number
          tendencia_score: number
        }[]
      }
      get_user_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["user_role"]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["user_role"]
          _user_id: string
        }
        Returns: boolean
      }
      increment_template_downloads: {
        Args: { template_id: string }
        Returns: undefined
      }
      is_admin_or_gestor: { Args: { _user_id: string }; Returns: boolean }
      user_can_access_risk: {
        Args: { _risco_id: string; _user_id: string }
        Returns: boolean
      }
      user_has_role: {
        Args: {
          _role: Database["public"]["Enums"]["user_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      risk_category:
        | "Tecnologia"
        | "Recursos Humanos"
        | "Financeiro"
        | "Operacional"
        | "Compliance"
        | "Estratégico"
        | "Regulatório"
      risk_impact: "Muito Baixo" | "Baixo" | "Médio" | "Alto" | "Muito Alto"
      risk_level: "Baixo" | "Médio" | "Alto" | "Crítico"
      risk_probability:
        | "Muito Baixa"
        | "Baixa"
        | "Média"
        | "Alta"
        | "Muito Alta"
      risk_status:
        | "Identificado"
        | "Em Análise"
        | "Em Monitoramento"
        | "Em Andamento"
        | "Mitigado"
        | "Aceito"
        | "Transferido"
        | "Eliminado"
        | "IA"
      risk_strategy: "Mitigar" | "Aceitar" | "Transferir" | "Evitar"
      user_role: "admin" | "gestor" | "analista" | "visualizador"
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
      risk_category: [
        "Tecnologia",
        "Recursos Humanos",
        "Financeiro",
        "Operacional",
        "Compliance",
        "Estratégico",
        "Regulatório",
      ],
      risk_impact: ["Muito Baixo", "Baixo", "Médio", "Alto", "Muito Alto"],
      risk_level: ["Baixo", "Médio", "Alto", "Crítico"],
      risk_probability: ["Muito Baixa", "Baixa", "Média", "Alta", "Muito Alta"],
      risk_status: [
        "Identificado",
        "Em Análise",
        "Em Monitoramento",
        "Em Andamento",
        "Mitigado",
        "Aceito",
        "Transferido",
        "Eliminado",
        "IA",
      ],
      risk_strategy: ["Mitigar", "Aceitar", "Transferir", "Evitar"],
      user_role: ["admin", "gestor", "analista", "visualizador"],
    },
  },
} as const
