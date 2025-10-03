import { useState, useEffect } from 'react';
import { supabase, Profile } from '../lib/supabase';
import { X } from 'lucide-react';

type Props = {
  profile: Profile;
  onClose: () => void;
  onSuccess: () => void;
};

export default function EditProfessionalModal({ profile, onClose, onSuccess }: Props) {
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (profile) {
      setName(profile.nome || '');
    }
  }, [profile]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ nome: name })
        .eq('id', profile.id);

      if (error) throw error;
      
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Erro ao atualizar profissional.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-slate-500 hover:text-slate-800"><X size={24} /></button>
        <h2 className="text-2xl font-bold text-slate-900 mb-6">Editar Profissional</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">{error}</div>}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
            <input type="email" value={profile.email || 'Email não disponível'} className="w-full px-4 py-2 border bg-slate-100 rounded-lg cursor-not-allowed" disabled />
          </div>
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-slate-700 mb-1">Nome Completo</label>
            <input id="name" type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full px-4 py-2 border border-slate-300 rounded-lg" required />
          </div>
          <div className="pt-4 flex justify-end space-x-3">
            <button type="button" onClick={onClose} className="px-4 py-2 bg-slate-200 text-slate-800 rounded-lg hover:bg-slate-300">Cancelar</button>
            <button type="submit" disabled={loading} className="px-4 py-2 bg-slate-900 text-white rounded-lg font-medium hover:bg-slate-800 disabled:opacity-50">
              {loading ? 'Salvando...' : 'Salvar Alterações'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}