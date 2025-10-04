import { useState, useEffect } from 'react';
import { DollarSign, CalendarCheck, CalendarX, CalendarClock } from 'lucide-react';
import { supabase } from '../../lib/supabase';

// Define a type para a estrutura esperada do agendamento com o preço do serviço
type AppointmentWithServicePrice = {
  id: number;
  status: string;
  servico: { preco: number }[] | null; // Corrigido: agora 'servico' é um array de objetos ou null
};

export default function FinancialReports() {
  const [startDate, setStartDate] = useState(new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [metrics, setMetrics] = useState({
    totalRevenue: 0,
    completedAppointments: 0,
    canceledAppointments: 0,
    pendingAppointments: 0,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchFinancialData = async () => {
    setLoading(true);
    setError('');
    setMetrics({
      totalRevenue: 0,
      completedAppointments: 0,
      canceledAppointments: 0,
      pendingAppointments: 0,
    });

    try {
      const { data: appointments, error } = await supabase
        .from('agendamentos')
        .select(`
          id,
          status,
          servico:servicos(preco)
        `)
        .gte('data_hora_inicio', `${startDate}T00:00:00.000Z`)
        .lte('data_hora_inicio', `${endDate}T23:59:59.999Z`);

      if (error) throw error;

      console.log('Fetched appointments for financial report:', appointments); // LOG DE DEBUG

      let calculatedRevenue = 0;
      let completedCount = 0;
      let canceledCount = 0;
      let pendingCount = 0;

      if (appointments) {
        appointments.forEach((appt: AppointmentWithServicePrice) => {
          console.log('Processing appointment:', appt); // LOG DE DEBUG
          console.log('Service array:', appt.servico); // LOG DE DEBUG
          console.log('Service price (first element):', appt.servico?.[0]?.preco); // LOG DE DEBUG

          if (appt.status === 'concluido') {
            // Acessa o preço do primeiro elemento do array 'servico'
            const servicePrice = appt.servico?.[0]?.preco;
            if (servicePrice !== undefined && servicePrice !== null) {
              calculatedRevenue += servicePrice;
            } else {
              console.warn('Service price not found for completed appointment:', appt.id);
            }
            completedCount++;
          } else if (appt.status === 'cancelado') {
            canceledCount++;
          } else if (appt.status === 'agendado') {
            pendingCount++;
          }
        });
      }

      setMetrics({
        totalRevenue: calculatedRevenue,
        completedAppointments: completedCount,
        canceledAppointments: canceledCount,
        pendingAppointments: pendingCount,
      });

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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Card de Receita Total */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex items-center space-x-4">
            <div className="p-3 bg-green-100 rounded-full">
              <DollarSign className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Receita Total</p>
              <p className="text-2xl font-bold text-green-700">
                R$ {metrics.totalRevenue.toFixed(2).replace('.', ',')}
              </p>
            </div>
          </div>

          {/* Card de Agendamentos Concluídos */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex items-center space-x-4">
            <div className="p-3 bg-lime-100 rounded-full">
              <CalendarCheck className="w-6 h-6 text-lime-600" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Agendamentos Concluídos</p>
              <p className="text-2xl font-bold text-slate-900">{metrics.completedAppointments}</p>
            </div>
          </div>

          {/* Card de Agendamentos Pendentes */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex items-center space-x-4">
            <div className="p-3 bg-orange-100 rounded-full">
              <CalendarClock className="w-6 h-6 text-orange-600" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Agendamentos Pendentes</p>
              <p className="text-2xl font-bold text-slate-900">{metrics.pendingAppointments}</p>
            </div>
          </div>

          {/* Card de Agendamentos Cancelados */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex items-center space-x-4">
            <div className="p-3 bg-red-100 rounded-full">
              <CalendarX className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Agendamentos Cancelados</p>
              <p className="text-2xl font-bold text-slate-900">{metrics.canceledAppointments}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}