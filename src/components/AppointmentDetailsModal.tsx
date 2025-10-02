// src/components/AppointmentDetailsModal.tsx

import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { X, User, Scissors, Clock } from 'lucide-react';

type Props = {
  eventInfo: any; // Informações do evento clicado
  onClose: () => void;
  onStatusChange: () => void; // Para avisar o painel que precisa recarregar
};

export default function AppointmentDetailsModal({ eventInfo, onClose, onStatusChange }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { id, title, start, extendedProps } = eventInfo.event;
  const { professional } = extendedProps;

  const updateStatus = async (newStatus: 'concluido' | 'cancelado') => {
    setLoading(true);
    setError('');
    try {
      const { error } = await supabase
        .from('agendamentos')
        .update({ status: newStatus })
        .eq('id', id);
      
      if (error) throw error;
      
      onStatusChange(); // Avisa o componente pai para recarregar a lista de eventos
      onClose();
    } catch (err: any) {
      setError(err.message || 'Erro ao atualizar o status.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-slate-500 hover:text-slate-800"><X size={24} /></button>
        <h2 className="text-2xl font-bold text-slate-900 mb-6">Detalhes do Agendamento</h2>
        
        {error && <div className="bg-red-100 text-red-700 p-3 rounded-md mb-4">{error}</div>}

        <div className="space-y-4 text-slate-700">
          <div className="flex items-center space-x-3">
            <Clock size={20} className="text-slate-500" />
            <span>{new Date(start).toLocaleString('pt-BR', { dateStyle: 'long', timeStyle: 'short' })}</span>
          </div>
          <div className="flex items-center space-x-3">
            <User size={20} className="text-slate-500" />
            <span className="font-semibold">{title.split(' - ')[0]}</span>
          </div>
          <div className="flex items-center space-x-3">
            <Scissors size={20} className="text-slate-500" />
            <span>{title.split(' - ')[1]}</span>
          </div>
          {professional && (
            <div className="flex items-center space-x-3">
              <User size={20} className="text-slate-500" />
              <span>Profissional: <span className="font-semibold">{professional}</span></span>
            </div>
          )}
        </div>

        <div className="pt-6 mt-6 border-t flex justify-end space-x-3">
          <button
            onClick={() => updateStatus('cancelado')}
            disabled={loading}
            className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 disabled:opacity-50"
          >
            Marcar como Cancelado
          </button>
          <button
            onClick={() => updateStatus('concluido')}
            disabled={loading}
            className="px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:opacity-50"
          >
            Marcar como Concluído
          </button>
        </div>
      </div>
    </div>
  );
}