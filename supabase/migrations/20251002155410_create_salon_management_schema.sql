/*
  # Salon Management System - Database Schema

  1. New Tables
    - `profiles`
      - `id` (uuid, primary key, references auth.users)
      - `nome` (text) - User's full name
      - `email` (text) - User's email
      - `telefone` (text) - User's phone number
      - `role` (text) - User role: 'admin' or 'professional'
      - `commission_percentage` (decimal) - Commission percentage for professionals
      - `foto_url` (text) - Profile photo URL
      - `ativo` (boolean) - Active status
      - `created_at` (timestamptz) - Creation timestamp
      
    - `servicos`
      - `id` (uuid, primary key)
      - `nome_servico` (text) - Service name
      - `preco` (decimal) - Service price
      - `duracao_media_minutos` (integer) - Average duration in minutes
      - `ativo` (boolean) - Active status
      - `created_at` (timestamptz) - Creation timestamp
      
    - `agendamentos`
      - `id` (uuid, primary key)
      - `cliente_nome` (text) - Client name
      - `cliente_telefone` (text) - Client phone
      - `id_profissional` (uuid) - Foreign key to profiles
      - `id_servico` (uuid) - Foreign key to servicos
      - `data_hora` (timestamptz) - Appointment date and time
      - `status` (text) - Status: 'agendado', 'executado', 'nao_compareceu'
      - `created_at` (timestamptz) - Creation timestamp

  2. Security
    - Enable RLS on all tables
    - Policies for admin (full access)
    - Policies for professional (own agenda only)
    - Policies for public (quick appointment creation)
*/

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nome text NOT NULL,
  email text UNIQUE NOT NULL,
  telefone text,
  role text NOT NULL CHECK (role IN ('admin', 'professional')),
  commission_percentage decimal(5,2) DEFAULT 0,
  foto_url text,
  ativo boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Create servicos table
CREATE TABLE IF NOT EXISTS servicos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome_servico text NOT NULL,
  preco decimal(10,2) NOT NULL,
  duracao_media_minutos integer NOT NULL,
  ativo boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Create agendamentos table
CREATE TABLE IF NOT EXISTS agendamentos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_nome text NOT NULL,
  cliente_telefone text NOT NULL,
  id_profissional uuid NOT NULL REFERENCES profiles(id),
  id_servico uuid NOT NULL REFERENCES servicos(id),
  data_hora timestamptz NOT NULL,
  status text NOT NULL DEFAULT 'agendado' CHECK (status IN ('agendado', 'executado', 'nao_compareceu')),
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE servicos ENABLE ROW LEVEL SECURITY;
ALTER TABLE agendamentos ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Admins can view all profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Professionals can view own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Admins can insert profiles"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can update profiles"
  ON profiles FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Public can view active professionals"
  ON profiles FOR SELECT
  TO anon
  USING (role = 'professional' AND ativo = true);

-- Servicos policies
CREATE POLICY "Anyone can view active services"
  ON servicos FOR SELECT
  TO anon, authenticated
  USING (ativo = true);

CREATE POLICY "Admins can insert services"
  ON servicos FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can update services"
  ON servicos FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- Agendamentos policies
CREATE POLICY "Anyone can create appointments"
  ON agendamentos FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Admins can view all appointments"
  ON agendamentos FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Professionals can view own appointments"
  ON agendamentos FOR SELECT
  TO authenticated
  USING (id_profissional = auth.uid());

CREATE POLICY "Admins can update all appointments"
  ON agendamentos FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Professionals can update own appointments status"
  ON agendamentos FOR UPDATE
  TO authenticated
  USING (id_profissional = auth.uid())
  WITH CHECK (id_profissional = auth.uid());

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_agendamentos_profissional ON agendamentos(id_profissional);
CREATE INDEX IF NOT EXISTS idx_agendamentos_data_hora ON agendamentos(data_hora);
CREATE INDEX IF NOT EXISTS idx_agendamentos_status ON agendamentos(status);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);