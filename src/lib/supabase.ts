import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Profile = {
  id: string;
  full_name: string;
  email: string;
  telefone: string | null;
  role: 'admin' | 'professional' | 'client'; // Adicionado 'client'
  commission_percentage: number | null; // Pode ser null para clientes
  foto_url: string | null;
  is_working: boolean | null; // Pode ser null para clientes
  created_at: string;
};

export type Servico = {
  id: number;
  nome_servico: string;
  preco: number;
  duracao_media_minutos: number;
  ativo: boolean;
  created_at: string;
};

export type Cliente = {
  id: number;
  user_id: string | null; // Adicionado user_id para vincular ao auth.users
  nome_completo: string | null; // Alterado para ser anulável
  telefone: string | null; // Alterado para ser anulável
  created_at: string;
};

export type Agendamento = {
  id: number;
  cliente_nome: string;
  cliente_telefone: string;
  id_profissional: string | null;
  id_servico: number;
  data_hora_inicio: string;
  data_hora_fim: string;
  status: 'agendado' | 'executado' | 'nao_compareceu' | 'concluido' | 'cancelado';
  created_at: string;
};

export type AgendamentoWithDetails = Agendamento & {
  servico: Servico;
  profissional: Profile;
};

export type Timesheet = {
  id: number;
  professional_id: string;
  check_in_time: string;
  check_out_time: string | null;
  date: string;
  created_at: string;
};