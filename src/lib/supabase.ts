import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = (import.meta.env.VITE_SUPABASE_URL as string) || 'https://dvqnlnxkwcrxbctujajl.supabase.co'
const SUPABASE_ANON_KEY = (import.meta.env.VITE_SUPABASE_ANON_KEY as string) || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR2cW5sbnhrd2NyeGJjdHVqYWpsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE1NzM4OTIsImV4cCI6MjA2NzE0OTg5Mn0.9mzrQC2B9Kp_ZNyLt-Gpe_0HkVE-bioR7sFWsviru40'

export const supabaseConfigured = !!(import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY)

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

// ─── Tipos de domínio ──────────────────────────────────────────────────────

export type PepEntry = {
  id: string
  ref: 'C' | 'SC' | 'P' | 'SP' | 'PT'
  comp: number | null
  prod: number | null
  subp: number | null
  pct: number | null
  descricao: string | null
  // Valores US$ atuais (cols N, O, P)
  n_atual: number
  o_atual: number
  p_atual: number
  // Valores US$ base/arranque (cols R, S, T)
  r_base: number
  s_base: number
  t_base: number
  versao: string
  linha_excel: number | null
  importado_em: string
  // Campos expandidos (migration 006)
  codigo_wbs: string | null           // col I — "1.2.3.4"
  k_reais_bid: number | null          // col K — BRL BID
  l_reais_local: number | null        // col L — BRL Local
  m_reais_total: number | null        // col M — BRL Total
  pct_bid: number | null              // col Q — %BID
  pmr_ref: string | null              // col Z — código PMR associado
  pa_ref: string | null               // col AA — ref Ponto de Atenção
  secretaria: string | null            // col Y — Secretaria responsável
  tipo_aquisicao: string | null       // col AB — ex: "Consultor Individual"
  metodo_aquisicao: string | null     // col AC — ex: "CD", "3CV", "SN"
  fisica_2025: number | null          // col AD — entrega prevista 2025 (0/1)
  fisica_2026: number | null          // col AE
  fisica_2027: number | null          // col AF
  fisica_2028: number | null          // col AG
  fisica_2029: number | null          // col AH
  fisica_eop: number | null           // col AI — entrega EOP
  desembolso_2025: number | null      // col AJ — US$ previsto 2025
  desembolso_2026: number | null      // col AK
  desembolso_2027: number | null      // col AL
  desembolso_2028: number | null      // col AM
  desembolso_2029: number | null      // col AN
  desembolso_total: number | null     // col AO — total US$
  resumo_executivo: string | null     // descrição detalhada / resumo executivo
  lote: string | null                 // col H — lote de aquisição
}

export type PmrOutput = {
  id: string
  componente: string | null
  produto: string | null
  codigo: string | null
  descricao: string | null
  unidade: string | null
  linha_base: number | null
  meta_contrato: number | null
  meta_periodo: number | null
  realizado: number
  pct_realizado: number
  periodo_ref: string | null
  importado_em: string
}

export type PmrOutcome = {
  id: string
  componente: string | null
  objetivo: string | null
  codigo: string | null
  descricao: string | null
  unidade: string | null
  linha_base: number | null
  meta_contrato: number | null
  realizado: number
  pct_realizado: number
  fonte_dados: string | null
  periodo_ref: string | null
  importado_em: string
}

export type Risco = {
  id: string
  descricao: string
  categoria: 'Financeiro' | 'Político' | 'Técnico' | 'Ambiental' | 'Social' | 'Institucional'
  probabilidade: number
  impacto: number
  nivel: number
  mitigacao: string | null
  responsavel: string | null
  status: 'Ativo' | 'Mitigado' | 'Monitorando' | 'Fechado'
  tipo: 'Estratégico' | 'Tático' | 'Operacional'
  componente: string | null
  criado_em: string
  atualizado_em: string
}

export type Atividade = {
  id: string
  titulo: string
  componente: string | null
  responsavel: string | null
  prazo: string | null
  progresso: number
  prioridade: 'Alta' | 'Media' | 'Baixa'
  status: 'todo' | 'progress' | 'waiting' | 'done'
  criado_em: string
  atualizado_em: string
}

export type NotaCritica = {
  id: string
  componente: string | null
  nota: string
  autor: string | null
  criado_em: string
}

export type Recomendacao = {
  id: string
  titulo: string
  descricao: string | null
  urgencia: 'Alta' | 'Media' | 'Baixa'
  componente: string | null
  status: 'Pendente' | 'Em Andamento' | 'Concluída' | 'Cancelada'
  criado_em: string
}

export type NaoObjecao = {
  id: string
  processo: string
  tipo: 'Aquisição' | 'Pessoal' | 'Consultoria' | 'TdR' | 'Outro' | null
  solicitado_em: string | null
  recebido_em: string | null
  status: 'Pendente' | 'Recebida' | 'Vencida' | 'Cancelada'
  valor_usd: number | null
  observacoes: string | null
  criado_em: string
}

export type Marco = {
  id: string
  data_marco: string
  tipo: 'legislativo' | 'contratual' | 'missao_bid' | 'entrega_doc' | 'obra' | 'aquisicao' | 'outro'
  titulo: string
  descricao: string | null
  area: 'obras' | 'digital' | 'social' | 'governanca' | 'financeiro' | 'aquisicoes' | 'socioambiental' | null
  status: 'concluido' | 'em_andamento' | 'previsto' | 'atrasado'
  referencia_doc: string | null
  created_at: string
  updated_at: string
}

export type PontoAtencao = {
  id: string
  tema: string
  descricao: string | null
  area: 'obras' | 'digital' | 'social' | 'governanca' | 'juridico' | 'socioambiental' | 'aquisicoes' | 'financeiro'
  criticidade: 'critico' | 'alerta' | 'ok' | 'info'
  status_texto: string | null
  responsavel: string | null
  prazo_previsto: string | null
  resolucao: string | null
  data_atualizacao: string | null
  ativo: boolean
  created_at: string
  updated_at: string
}

export type Aquisicao = {
  id: string
  id_processo: string | null
  titulo: string
  tipo: 'obra' | 'consultoria' | 'bem' | 'servico' | 'fidic'
  modalidade: string | null
  secretaria: 'SMPG' | 'SMS' | 'SMAS' | 'SMED' | 'SMID' | 'SMDET' | 'PROCEMPA' | 'DEMHAB' | 'Outro'
  componente: string | null
  valor_usd: number | null
  valor_brl: number | null
  financiador: string
  status: 'planejado' | 'preparacao' | 'publicado' | 'em_avaliacao' | 'adjudicado' | 'contratado' | 'em_execucao' | 'concluido' | 'cancelado'
  data_inicio_previsto: string | null
  data_publicacao: string | null
  data_adjudicacao: string | null
  data_contratacao: string | null
  data_fim_previsto: string | null
  data_fim_real: string | null
  fidic_aplicavel: boolean
  lote: string | null
  notas: string | null
  created_at: string
  updated_at: string
}

export type SyncLog = {
  id: number
  tabela_destino: string
  fonte: string
  versao: string | null
  registros_lidos: number
  registros_inseridos: number
  registros_atualizados: number
  registros_ignorados: number
  registros_erro: number
  status: 'ok' | 'erro' | 'parcial'
  mensagem_erro: string | null
  executado_por: string
  executado_em: string
}

export type ProgramaContexto = {
  id: string
  categoria: 'demografico' | 'social' | 'economico' | 'climatico' | 'financeiro'
  indicador: string
  valor: number | null
  valor_texto: string | null
  unidade: string | null
  fonte: string | null
  ano_referencia: number | null
  notas: string | null
  created_at: string
}

export type TemaMonitoramento = {
  id: string
  nome: string
  descricao: string | null
  palavras_chave: string[]
  ativo: boolean
  criado_em: string
}
