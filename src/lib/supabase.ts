import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Profile = {
  id: string;
  full_name: string;
  email: string;
  telefone: string | null;
  role: 'admin' | 'professional';
  commission_percentage: number;
  foto_url: string | null;
  is_working: boolean;
  created_at: string;
};

export type Servico = {
  id: number; // Corrigido para number
  nome_servico: string;
  preco: number;
  duracao_media_minutos: number;
  ativo: boolean;
  created_at: string;
};

export type Cliente = { // Adicionado o tipo Cliente
  id: number;
  nome_completo: string;
  telefone: string;
  created_at: string;
};

export type Agendamento = {
  id: number; // Corrigido para number
  cliente_nome: string;
  cliente_telefone: string;
  id_profissional: string | null; // Pode ser null se 'any' for selecionado
  id_servico: number; // Corrigido para number
  data_hora_inicio: string;
  data_hora_fim: string;
  status: 'agendado' | 'executado' | 'nao_compareceu' | 'concluido' | 'cancelado'; // Adicionado 'concluido' e 'cancelado'
  created_at: string;
};

export type AgendamentoWithDetails = Agendamento & {
  servico: Servico;
  profissional: Profile;
};