// src/pages/Login.tsx (COM NOVAS CORES)

import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { LogIn } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await signIn(email, password);
    } catch (err) {
      setError('Email ou senha incorretos');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-secondary flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl p-8">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary rounded-full mb-4">
            <LogIn className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-primary">Bem-vindo</h1>
          <p className="text-slate-600 mt-2">Faça login para acessar o sistema</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (<div className="bg-red-50 ...">{error}</div>)}
          <div>
            <label htmlFor="email" className="block ...">Email</label>
            <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full ... focus:ring-primary focus:border-primary" required />
          </div>
          <div>
            <label htmlFor="password" className="block ...">Senha</label>
            <input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full ... focus:ring-primary focus:border-primary" required />
          </div>
          <button type="submit" disabled={loading} className="w-full bg-primary text-white ... hover:bg-primary-dark ...">
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>
        <div className="text-center mt-6">
          <a href="/cadastro" className="text-sm font-medium text-primary hover:text-primary-dark">Não tem uma conta? Cadastre-se</a>
        </div>
      </div>
    </div>
  );
}