import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { X } from 'lucide-react';

type Cliente = {
  id?: number;
  nome_completo: string;
  telefone: string;
};

type Props = {
  clientToEdit?: Cliente | null;
  onClose: () => void;
  onSuccess: () => void;
};

export default function ClientModal({ clientToEdit, onClose, onSuccess }: Props) {
  const [nomeCompleto, setNomeCompleto] = useState('');
  const [telefone, setTelefone] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (clientToEdit) {
      setNomeCompleto(clientToEdit.nome_completo);
      setTelefone(clientToEdit.telefone);
    }
  }, [clientToEdit]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const clientData = {
      nome_completo: nomeCompleto,
      telefone: telefone,
    };

    try {
      let response;
      if (clientToEdit?.id) {
        // Editando um cliente existente
        response = await supabase.from('clientes').update(clientData).eq('id', clientToEdit.id);
      } else {
        // Criando um novo cliente
        response = await supabase.from('clientes').insert(clientData);
      }
      
      if (response.error) throw response.error;
      
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Erro ao salvar cliente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-slate-500 hover:text-slate-800"><X size={24} /></button>
        <h2 className="text-2xl font-bold text-slate-900 mb-6">{clientToEdit ? 'Editar Cliente' : 'Adicionar Novo Cliente'}</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">{error}</div>}
          <div>
            <label htmlFor="nomeCompleto" className="block text-sm font-medium text-slate-700 mb-1">Nome Completo</label>
            <input id="nomeCompleto" type="text" value={nomeCompleto} onChange={(e) => setNomeCompleto(e.target.value)} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900" required />
          </div>
          <div>
            <label htmlFor="telefone" className="block text-sm font-medium text-slate-700 mb-1">Telefone</label>
            <input id="telefone" type="tel" value={telefone} onChange={(e) => setTelefone(e.target.value)} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900" required />
          </div>
          <div className="pt-4 flex justify-end space-x-3">
            <button type="button" onClick={onClose} className="px-4 py-2 bg-slate-200 text-slate-800 rounded-lg hover:bg-slate-300">Cancelar</button>
            <button type="submit" disabled={loading} className="px-4 py-2 bg-slate-900 text-white rounded-lg font-medium hover:bg-slate-800 disabled:opacity-50">
              {loading ? 'Salvando...' : 'Salvar Cliente'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}