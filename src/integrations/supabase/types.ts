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
      analytics_cache: {
        Row: {
          calculado_em: string
          chave: string
          dados: Json
        }
        Insert: {
          calculado_em?: string
          chave: string
          dados: Json
        }
        Update: {
          calculado_em?: string
          chave?: string
          dados?: Json
        }
        Relationships: []
      }
      aquisicoes: {
        Row: {
          componente: string | null
          created_at: string | null
          data_adjudicacao: string | null
          data_contratacao: string | null
          data_fim_previsto: string | null
          data_fim_real: string | null
          data_inicio_previsto: string | null
          data_publicacao: string | null
          fidic_aplicavel: boolean | null
          financiador: string | null
          id: string
          id_processo: string | null
          lote: string | null
          modalidade: string | null
          notas: string | null
          secretaria: string
          status: string
          tipo: string
          titulo: string
          updated_at: string | null
          valor_brl: number | null
          valor_usd: number | null
        }
        Insert: {
          componente?: string | null
          created_at?: string | null
          data_adjudicacao?: string | null
          data_contratacao?: string | null
          data_fim_previsto?: string | null
          data_fim_real?: string | null
          data_inicio_previsto?: string | null
          data_publicacao?: string | null
          fidic_aplicavel?: boolean | null
          financiador?: string | null
          id?: string
          id_processo?: string | null
          lote?: string | null
          modalidade?: string | null
          notas?: string | null
          secretaria: string
          status?: string
          tipo: string
          titulo: string
          updated_at?: string | null
          valor_brl?: number | null
          valor_usd?: number | null
        }
        Update: {
          componente?: string | null
          created_at?: string | null
          data_adjudicacao?: string | null
          data_contratacao?: string | null
          data_fim_previsto?: string | null
          data_fim_real?: string | null
          data_inicio_previsto?: string | null
          data_publicacao?: string | null
          fidic_aplicavel?: boolean | null
          financiador?: string | null
          id?: string
          id_processo?: string | null
          lote?: string | null
          modalidade?: string | null
          notas?: string | null
          secretaria?: string
          status?: string
          tipo?: string
          titulo?: string
          updated_at?: string | null
          valor_brl?: number | null
          valor_usd?: number | null
        }
        Relationships: []
      }
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
      marcos: {
        Row: {
          area: string | null
          created_at: string | null
          data_marco: string
          descricao: string | null
          id: string
          referencia_doc: string | null
          status: string
          tipo: string
          titulo: string
          updated_at: string | null
        }
        Insert: {
          area?: string | null
          created_at?: string | null
          data_marco: string
          descricao?: string | null
          id?: string
          referencia_doc?: string | null
          status?: string
          tipo: string
          titulo: string
          updated_at?: string | null
        }
        Update: {
          area?: string | null
          created_at?: string | null
          data_marco?: string
          descricao?: string | null
          id?: string
          referencia_doc?: string | null
          status?: string
          tipo?: string
          titulo?: string
          updated_at?: string | null
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
          codigo_wbs: string | null
          comp: number | null
          descricao: string | null
          desembolso_2025: number | null
          desembolso_2026: number | null
          desembolso_2027: number | null
          desembolso_2028: number | null
          desembolso_2029: number | null
          desembolso_total: number | null
          fisica_2025: number | null
          fisica_2026: number | null
          fisica_2027: number | null
          fisica_2028: number | null
          fisica_2029: number | null
          fisica_eop: number | null
          id: string
          importado_em: string | null
          k_reais_bid: number | null
          l_reais_local: number | null
          linha_excel: number | null
          lote: string | null
          m_reais_total: number | null
          metodo_aquisicao: string | null
          n_atual: number | null
          o_atual: number | null
          p_atual: number | null
          pa_ref: string | null
          pct: number | null
          pct_bid: number | null
          pmr_ref: string | null
          prod: number | null
          r_base: number | null
          ref: string
          resumo_executivo: string | null
          s_base: number | null
          secretaria: string | null
          subp: number | null
          t_base: number | null
          tipo_aquisicao: string | null
          versao: string
        }
        Insert: {
          codigo_wbs?: string | null
          comp?: number | null
          descricao?: string | null
          desembolso_2025?: number | null
          desembolso_2026?: number | null
          desembolso_2027?: number | null
          desembolso_2028?: number | null
          desembolso_2029?: number | null
          desembolso_total?: number | null
          fisica_2025?: number | null
          fisica_2026?: number | null
          fisica_2027?: number | null
          fisica_2028?: number | null
          fisica_2029?: number | null
          fisica_eop?: number | null
          id?: string
          importado_em?: string | null
          k_reais_bid?: number | null
          l_reais_local?: number | null
          linha_excel?: number | null
          lote?: string | null
          m_reais_total?: number | null
          metodo_aquisicao?: string | null
          n_atual?: number | null
          o_atual?: number | null
          p_atual?: number | null
          pa_ref?: string | null
          pct?: number | null
          pct_bid?: number | null
          pmr_ref?: string | null
          prod?: number | null
          r_base?: number | null
          ref: string
          resumo_executivo?: string | null
          s_base?: number | null
          secretaria?: string | null
          subp?: number | null
          t_base?: number | null
          tipo_aquisicao?: string | null
          versao?: string
        }
        Update: {
          codigo_wbs?: string | null
          comp?: number | null
          descricao?: string | null
          desembolso_2025?: number | null
          desembolso_2026?: number | null
          desembolso_2027?: number | null
          desembolso_2028?: number | null
          desembolso_2029?: number | null
          desembolso_total?: number | null
          fisica_2025?: number | null
          fisica_2026?: number | null
          fisica_2027?: number | null
          fisica_2028?: number | null
          fisica_2029?: number | null
          fisica_eop?: number | null
          id?: string
          importado_em?: string | null
          k_reais_bid?: number | null
          l_reais_local?: number | null
          linha_excel?: number | null
          lote?: string | null
          m_reais_total?: number | null
          metodo_aquisicao?: string | null
          n_atual?: number | null
          o_atual?: number | null
          p_atual?: number | null
          pa_ref?: string | null
          pct?: number | null
          pct_bid?: number | null
          pmr_ref?: string | null
          prod?: number | null
          r_base?: number | null
          ref?: string
          resumo_executivo?: string | null
          s_base?: number | null
          secretaria?: string | null
          subp?: number | null
          t_base?: number | null
          tipo_aquisicao?: string | null
          versao?: string
        }
        Relationships: []
      }
      pep_gestao: {
        Row: {
          created_at: string | null
          data_fim_previsto: string | null
          data_inicio_real: string | null
          id: string
          nivel_risco: string | null
          notas: string | null
          pep_entry_id: string
          progresso: number
          status: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          data_fim_previsto?: string | null
          data_inicio_real?: string | null
          id?: string
          nivel_risco?: string | null
          notas?: string | null
          pep_entry_id: string
          progresso?: number
          status?: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          data_fim_previsto?: string | null
          data_inicio_real?: string | null
          id?: string
          nivel_risco?: string | null
          notas?: string | null
          pep_entry_id?: string
          progresso?: number
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pep_gestao_pep_entry_id_fkey"
            columns: ["pep_entry_id"]
            isOneToOne: true
            referencedRelation: "pep_entries"
            referencedColumns: ["id"]
          },
        ]
      }
      pep_historico: {
        Row: {
          campo: string
          created_at: string | null
          id: string
          pep_entry_id: string
          usuario: string | null
          valor_anterior: string | null
          valor_novo: string | null
        }
        Insert: {
          campo: string
          created_at?: string | null
          id?: string
          pep_entry_id: string
          usuario?: string | null
          valor_anterior?: string | null
          valor_novo?: string | null
        }
        Update: {
          campo?: string
          created_at?: string | null
          id?: string
          pep_entry_id?: string
          usuario?: string | null
          valor_anterior?: string | null
          valor_novo?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pep_historico_pep_entry_id_fkey"
            columns: ["pep_entry_id"]
            isOneToOne: false
            referencedRelation: "pep_entries"
            referencedColumns: ["id"]
          },
        ]
      }
      pep_impedimentos: {
        Row: {
          created_at: string | null
          descricao: string
          id: string
          pep_entry_id: string
          resolvido: boolean | null
        }
        Insert: {
          created_at?: string | null
          descricao: string
          id?: string
          pep_entry_id: string
          resolvido?: boolean | null
        }
        Update: {
          created_at?: string | null
          descricao?: string
          id?: string
          pep_entry_id?: string
          resolvido?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "pep_impedimentos_pep_entry_id_fkey"
            columns: ["pep_entry_id"]
            isOneToOne: false
            referencedRelation: "pep_entries"
            referencedColumns: ["id"]
          },
        ]
      }
      pep_riscos: {
        Row: {
          created_at: string
          id: string
          impacto: string
          mitigacao: string | null
          pep_entry_id: string
          probabilidade: string
          risco_global_id: string | null
          status: string
          titulo_risco: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          impacto?: string
          mitigacao?: string | null
          pep_entry_id: string
          probabilidade?: string
          risco_global_id?: string | null
          status?: string
          titulo_risco: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          impacto?: string
          mitigacao?: string | null
          pep_entry_id?: string
          probabilidade?: string
          risco_global_id?: string | null
          status?: string
          titulo_risco?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "pep_riscos_pep_entry_id_fkey"
            columns: ["pep_entry_id"]
            isOneToOne: false
            referencedRelation: "pep_entries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pep_riscos_risco_global_id_fkey"
            columns: ["risco_global_id"]
            isOneToOne: false
            referencedRelation: "riscos"
            referencedColumns: ["id"]
          },
        ]
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
      pontos_atencao: {
        Row: {
          area: string
          ativo: boolean | null
          created_at: string | null
          criticidade: string
          data_atualizacao: string | null
          descricao: string | null
          id: string
          prazo_previsto: string | null
          resolucao: string | null
          responsavel: string | null
          status_texto: string | null
          tema: string
          updated_at: string | null
        }
        Insert: {
          area: string
          ativo?: boolean | null
          created_at?: string | null
          criticidade?: string
          data_atualizacao?: string | null
          descricao?: string | null
          id?: string
          prazo_previsto?: string | null
          resolucao?: string | null
          responsavel?: string | null
          status_texto?: string | null
          tema: string
          updated_at?: string | null
        }
        Update: {
          area?: string
          ativo?: boolean | null
          created_at?: string | null
          criticidade?: string
          data_atualizacao?: string | null
          descricao?: string | null
          id?: string
          prazo_previsto?: string | null
          resolucao?: string | null
          responsavel?: string | null
          status_texto?: string | null
          tema?: string
          updated_at?: string | null
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
      programa_contexto: {
        Row: {
          ano_referencia: number | null
          categoria: string
          created_at: string | null
          fonte: string | null
          id: string
          indicador: string
          notas: string | null
          unidade: string | null
          valor: number | null
          valor_texto: string | null
        }
        Insert: {
          ano_referencia?: number | null
          categoria: string
          created_at?: string | null
          fonte?: string | null
          id?: string
          indicador: string
          notas?: string | null
          unidade?: string | null
          valor?: number | null
          valor_texto?: string | null
        }
        Update: {
          ano_referencia?: number | null
          categoria?: string
          created_at?: string | null
          fonte?: string | null
          id?: string
          indicador?: string
          notas?: string | null
          unidade?: string | null
          valor?: number | null
          valor_texto?: string | null
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
          componente: string | null
          criado_em: string | null
          descricao: string
          id: string
          impacto: number
          mitigacao: string | null
          nivel: number | null
          probabilidade: number
          responsavel: string | null
          status: string | null
          tipo: string
        }
        Insert: {
          atualizado_em?: string | null
          categoria: string
          componente?: string | null
          criado_em?: string | null
          descricao: string
          id?: string
          impacto: number
          mitigacao?: string | null
          nivel?: number | null
          probabilidade: number
          responsavel?: string | null
          status?: string | null
          tipo?: string
        }
        Update: {
          atualizado_em?: string | null
          categoria?: string
          componente?: string | null
          criado_em?: string | null
          descricao?: string
          id?: string
          impacto?: number
          mitigacao?: string | null
          nivel?: number | null
          probabilidade?: number
          responsavel?: string | null
          status?: string | null
          tipo?: string
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
      sync_log: {
        Row: {
          executado_em: string | null
          executado_por: string | null
          fonte: string
          id: number
          mensagem_erro: string | null
          registros_atualizados: number | null
          registros_erro: number | null
          registros_ignorados: number | null
          registros_inseridos: number | null
          registros_lidos: number | null
          status: string
          tabela_destino: string
          versao: string | null
        }
        Insert: {
          executado_em?: string | null
          executado_por?: string | null
          fonte: string
          id?: number
          mensagem_erro?: string | null
          registros_atualizados?: number | null
          registros_erro?: number | null
          registros_ignorados?: number | null
          registros_inseridos?: number | null
          registros_lidos?: number | null
          status?: string
          tabela_destino: string
          versao?: string | null
        }
        Update: {
          executado_em?: string | null
          executado_por?: string | null
          fonte?: string
          id?: number
          mensagem_erro?: string | null
          registros_atualizados?: number | null
          registros_erro?: number | null
          registros_ignorados?: number | null
          registros_inseridos?: number | null
          registros_lidos?: number | null
          status?: string
          tabela_destino?: string
          versao?: string | null
        }
        Relationships: []
      }
      temas_monitoramento: {
        Row: {
          ativo: boolean | null
          criado_em: string | null
          descricao: string | null
          id: string
          nome: string
          palavras_chave: string[]
        }
        Insert: {
          ativo?: boolean | null
          criado_em?: string | null
          descricao?: string | null
          id?: string
          nome: string
          palavras_chave?: string[]
        }
        Update: {
          ativo?: boolean | null
          criado_em?: string | null
          descricao?: string | null
          id?: string
          nome?: string
          palavras_chave?: string[]
        }
        Relationships: []
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
