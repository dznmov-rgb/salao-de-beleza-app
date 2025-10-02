import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Profile = {
  id: string;
  nome: string;
  email: string;
  telefone: string | null;
  role: 'admin' | 'professional';
  commission_percentage: number;
  foto_url: string | null;
  ativo: boolean;
  created_at: string;
};

export type Servico = {
  id: string;
  nome_servico: string;
  preco: number;
  duracao_media_minutos: number;
  ativo: boolean;
  created_at: string;
};

export type Agendamento = {
  id: string;
  cliente_nome: string;
  cliente_telefone: string;
  id_profissional: string;
  id_servico: string;
  data_hora: string;
  status: 'agendado' | 'executado' | 'nao_compareceu';
  created_at: string;
};

export type AgendamentoWithDetails = Agendamento & {
  servico: Servico;
  profissional: Profile;
};
