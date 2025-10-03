import { useState, useEffect } from 'react';
import { DollarSign } from 'lucide-react';
import { supabase } from '../../lib/supabase';

export default function FinancialReports() {
  const [startDate, setStartDate] = useState(new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchFinancialData = async () => {
    setLoading(true);
    setError('');
    setTotalRevenue(0);

    try {
      const { data: appointments, error } = await supabase
        .from('agendamentos')
        .select(`
          status,
          servico:servicos(preco)
        `)
        .eq('status', 'concluido')
        .gte('data_hora_inicio', `${startDate}T00:00:00.000Z`)
        .lte('data_hora_inicio', `${endDate}T23:59:59.999Z`);

      if (error) throw error;

      let calculatedRevenue = 0;
      if (appointments) {
        calculatedRevenue = appointments.reduce((sum, appt) => {
          // Certifica-se de que 'servico' e 'preco' existem antes de somar
          return sum + (appt.servico?.[0]?.preco || 0); // Acessa o preço do primeiro serviço no array
        }, 0);
      }
      setTotalRevenue(calculatedRevenue);

    } catch (err: any) {
      console.error('Erro ao buscar dados financeiros:', err);
      setError('Erro ao carregar relatórios financeiros.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFinancialData();
  }, [startDate, endDate]);

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-3xl font-bold text-slate-900">Relatórios Financeiros</h2>
      </div>
      
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-6">
        <h3 className="text-xl font-semibold text-slate-900 mb-4">Filtro por Período</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="startDate" className="block text-sm font-medium text-slate-700 mb-2">
              Data de Início
            </label>
            <input
              type="date"
              id="startDate"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent"
            />
          </div>
          <div>
            <label htmlFor="endDate" className="block text-sm font-medium text-slate-700 mb-2">
              Data de Fim
            </label>
            <input
              type="date"
              id="endDate"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        {loading ? (
          <div className="text-center text-slate-500 flex flex-col items-center">
            <div className="w-10 h-10 border-4 border-slate-300 border-t-slate-900 rounded-full animate-spin mb-3"></div>
            Carregando relatório...
          </div>
        ) : error ? (
          <div className="text-center text-red-600 p-4 bg-red-50 rounded-lg">
            {error}
          </div>
        ) : (
          <div className="text-center">
            <DollarSign className="w-16 h-16 text-green-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-slate-900 mb-2">Receita Total no Período</h3>
            <p className="text-5xl font-bold text-green-700">
              R$ {totalRevenue.toFixed(2).replace('.', ',')}
            </p>
            <p className="text-slate-600 mt-2">
              De {new Date(startDate).toLocaleDateString('pt-BR')} a {new Date(endDate).toLocaleDateString('pt-BR')}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}