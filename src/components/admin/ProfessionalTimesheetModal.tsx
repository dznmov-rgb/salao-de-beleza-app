import { useState, useEffect } from 'react';
import { supabase, Timesheet, Profile } from '../../lib/supabase';
import { X, Clock, CalendarDays } from 'lucide-react';

type Props = {
  professional: Profile;
  onClose: () => void;
};

export default function ProfessionalTimesheetModal({ professional, onClose }: Props) {
  const [timesheets, setTimesheets] = useState<Timesheet[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterDate, setFilterDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    fetchTimesheets();
  }, [professional.id, filterDate]);

  const fetchTimesheets = async () => {
    setLoading(true);
    setError('');
    try {
      const { data, error } = await supabase
        .from('timesheets')
        .select('*')
        .eq('professional_id', professional.id)
        .eq('date', filterDate)
        .order('check_in_time', { ascending: true });

      if (error) throw error;
      setTimesheets(data || []);
    } catch (err: any) {
      console.error('Erro ao carregar pontos:', err);
      setError('Não foi possível carregar os registros de ponto.');
    } finally {
      setLoading(false);
    }
  };

  const calculateTotalHours = (checkIn: string, checkOut: string | null) => {
    if (!checkOut) return 'Em andamento';
    const inTime = new Date(checkIn).getTime();
    const outTime = new Date(checkOut).getTime();
    const diffMs = outTime - inTime;
    const diffHours = diffMs / (1000 * 60 * 60);
    return diffHours.toFixed(2) + 'h';
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl p-8 max-w-2xl w-full relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-slate-500 hover:text-slate-800"><X size={24} /></button>
        <h2 className="text-2xl font-bold text-slate-900 mb-6">Ponto de {professional.full_name}</h2>
        
        <div className="mb-6">
          <label htmlFor="filterDate" className="block text-sm font-medium text-slate-700 mb-2">
            Filtrar por Data
          </label>
          <input
            type="date"
            id="filterDate"
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent"
          />
        </div>

        {loading ? (
          <div className="text-center text-slate-500 flex flex-col items-center justify-center h-32">
            <div className="w-8 h-8 border-4 border-slate-300 border-t-slate-900 rounded-full animate-spin mb-3"></div>
            Carregando registros...
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        ) : timesheets.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 text-center">
            <CalendarDays className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-600">Nenhum registro de ponto para esta data.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {timesheets.map((entry) => (
              <div key={entry.id} className="bg-slate-50 p-4 rounded-lg border border-slate-200 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Clock className="w-5 h-5 text-slate-600" />
                  <div>
                    <p className="font-medium text-slate-900">
                      {new Date(entry.check_in_time).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                      {entry.check_out_time && ` - ${new Date(entry.check_out_time).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`}
                    </p>
                    <p className="text-sm text-slate-500">
                      {new Date(entry.check_in_time).toLocaleDateString('pt-BR', { dateStyle: 'long' })}
                    </p>
                  </div>
                </div>
                <span className="font-semibold text-slate-800">
                  {calculateTotalHours(entry.check_in_time, entry.check_out_time)}
                </span>
              </div>
            ))}
          </div>
        )}

        <div className="pt-6 mt-6 border-t flex justify-end">
          <button type="button" onClick={onClose} className="px-4 py-2 bg-slate-200 text-slate-800 rounded-lg hover:bg-slate-300">Fechar</button>
        </div>
      </div>
    </div>
  );
}