// src/components/ServiceModal.tsx

import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { X } from 'lucide-react';

// Definindo o tipo para um serviço
type Service = {
  id?: number;
  nome_servico: string;
  preco: number;
  duracao_media_minutos: number;
};

type Props = {
  serviceToEdit?: Service | null;
  onClose: () => void;
  onSuccess: () => void;
};

export default function ServiceModal({ serviceToEdit, onClose, onSuccess }: Props) {
  const [nome, setNome] = useState('');
  const [preco, setPreco] = useState('');
  const [duracao, setDuracao] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (serviceToEdit) {
      setNome(serviceToEdit.nome_servico);
      setPreco(String(serviceToEdit.preco));
      setDuracao(String(serviceToEdit.duracao_media_minutos));
    }
  }, [serviceToEdit]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const serviceData = {
      nome_servico: nome,
      preco: Number(preco),
      duracao_media_minutos: Number(duracao),
    };

    try {
      let response;
      if (serviceToEdit?.id) {
        // Editando um serviço existente
        response = await supabase.from('servicos').update(serviceData).eq('id', serviceToEdit.id);
      } else {
        // Criando um novo serviço
        response = await supabase.from('servicos').insert(serviceData);
      }
      
      if (response.error) throw response.error;
      
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Erro ao salvar serviço.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-slate-500 hover:text-slate-800"><X size={24} /></button>
        <h2 className="text-2xl font-bold text-slate-900 mb-6">{serviceToEdit ? 'Editar Serviço' : 'Adicionar Novo Serviço'}</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">{error}</div>}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-slate-700 mb-1">Nome do Serviço</label>
            <input id="name" type="text" value={nome} onChange={(e) => setNome(e.target.value)} className="w-full px-4 py-2 border border-slate-300 rounded-lg" required />
          </div>
          <div>
            <label htmlFor="price" className="block text-sm font-medium text-slate-700 mb-1">Preço (R$)</label>
            <input id="price" type="number" step="0.01" value={preco} onChange={(e) => setPreco(e.target.value)} className="w-full px-4 py-2 border border-slate-300 rounded-lg" required />
          </div>
          <div>
            <label htmlFor="duration" className="block text-sm font-medium text-slate-700 mb-1">Duração Média (minutos)</label>
            <input id="duration" type="number" value={duracao} onChange={(e) => setDuracao(e.target.value)} className="w-full px-4 py-2 border border-slate-300 rounded-lg" required />
          </div>
          <div className="pt-4 flex justify-end space-x-3">
            <button type="button" onClick={onClose} className="px-4 py-2 bg-slate-200 text-slate-800 rounded-lg hover:bg-slate-300">Cancelar</button>
            <button type="submit" disabled={loading} className="px-4 py-2 bg-slate-900 text-white rounded-lg font-medium hover:bg-slate-800 disabled:opacity-50">
              {loading ? 'Salvando...' : 'Salvar Serviço'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}