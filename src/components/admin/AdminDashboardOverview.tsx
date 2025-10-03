import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Users, Scissors, User, CalendarCheck, CalendarX, Calendar } from 'lucide-react';

export default function AdminDashboardOverview() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [metrics, setMetrics] = useState({
    totalProfessionals: 0,
    totalServices: 0,
    totalClients: 0,
    appointmentsToday: 0,
    appointmentsCompletedToday: 0,
    appointmentsPendingToday: 0,
  });

  useEffect(() => {
    const fetchMetrics = async () => {
      setLoading(true);
      setError('');
      try {
        // Total de Profissionais
        const { count: professionalsCount, error: profError } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true })
          .eq('role', 'professional')
          .eq('is_working', true); // Corrigido para 'is_working'
        if (profError) throw profError;

        // Total de Serviços Ativos
        const { count: servicesCount, error: servError } = await supabase
          .from('servicos')
          .select('*', { count: 'exact', head: true })
          .eq('ativo', true);
        if (servError) throw servError;

        // Total de Clientes
        const { count: clientsCount, error: clientError } = await supabase
          .from('clientes')
          .select('*', { count: 'exact', head: true });
        if (clientError) throw clientError;

        // Agendamentos para hoje
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const { data: appointmentsData, error: apptError } = await supabase
          .from('agendamentos')
          .select('status')
          .gte('data_hora_inicio', today.toISOString())
          .lt('data_hora_inicio', tomorrow.toISOString());
        if (apptError) throw apptError;

        const appointmentsToday = appointmentsData?.length || 0;
        const appointmentsCompletedToday = appointmentsData?.filter(appt => appt.status === 'concluido').length || 0;
        const appointmentsPendingToday = appointmentsData?.filter(appt => appt.status === 'agendado').length || 0;


        setMetrics({
          totalProfessionals: professionalsCount || 0,
          totalServices: servicesCount || 0,
          totalClients: clientsCount || 0,
          appointmentsToday,
          appointmentsCompletedToday,
          appointmentsPendingToday,
        });

      } catch (err: any) {
        console.error('Erro ao carregar métricas do dashboard:', err);
        setError('Não foi possível carregar as métricas do dashboard.');
      } finally {
        setLoading(false);
      }
    };

    fetchMetrics();
  }, []);

  if (loading) {
    return (
      <div className="text-center text-slate-500 flex flex-col items-center justify-center h-48">
        <div className="w-10 h-10 border-4 border-slate-300 border-t-slate-900 rounded-full animate-spin mb-3"></div>
        Carregando dashboard...
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-red-600 p-4 bg-red-50 rounded-lg">
        {error}
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-3xl font-bold text-slate-900 mb-8">Visão Geral do Salão</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Card de Profissionais */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex items-center space-x-4">
          <div className="p-3 bg-blue-100 rounded-full">
            <Users className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <p className="text-sm text-slate-500">Profissionais Ativos</p>
            <p className="text-2xl font-bold text-slate-900">{metrics.totalProfessionals}</p>
          </div>
        </div>

        {/* Card de Serviços */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex items-center space-x-4">
          <div className="p-3 bg-green-100 rounded-full">
            <Scissors className="w-6 h-6 text-green-600" />
          </div>
          <div>
            <p className="text-sm text-slate-500">Serviços Ativos</p>
            <p className="text-2xl font-bold text-slate-900">{metrics.totalServices}</p>
          </div>
        </div>

        {/* Card de Clientes */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex items-center space-x-4">
          <div className="p-3 bg-purple-100 rounded-full">
            <User className="w-6 h-6 text-purple-600" />
          </div>
          <div>
            <p className="text-sm text-slate-500">Total de Clientes</p>
            <p className="text-2xl font-bold text-slate-900">{metrics.totalClients}</p>
          </div>
        </div>

        {/* Card de Agendamentos Hoje */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex items-center space-x-4">
          <div className="p-3 bg-yellow-100 rounded-full">
            <Calendar className="w-6 h-6 text-yellow-600" />
          </div>
          <div>
            <p className="text-sm text-slate-500">Agendamentos Hoje</p>
            <p className="text-2xl font-bold text-slate-900">{metrics.appointmentsToday}</p>
          </div>
        </div>
      </div>

      <h3 className="text-2xl font-bold text-slate-900 mb-6">Agendamentos do Dia</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Card de Agendamentos Pendentes Hoje */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex items-center space-x-4">
          <div className="p-3 bg-orange-100 rounded-full">
            <CalendarX className="w-6 h-6 text-orange-600" />
          </div>
          <div>
            <p className="text-sm text-slate-500">Agendamentos Pendentes</p>
            <p className="text-2xl font-bold text-slate-900">{metrics.appointmentsPendingToday}</p>
          </div>
        </div>

        {/* Card de Agendamentos Concluídos Hoje */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex items-center space-x-4">
          <div className="p-3 bg-lime-100 rounded-full">
            <CalendarCheck className="w-6 h-6 text-lime-600" />
          </div>
          <div>
            <p className="text-sm text-slate-500">Agendamentos Concluídos</p>
            <p className="text-2xl font-bold text-slate-900">{metrics.appointmentsCompletedToday}</p>
          </div>
        </div>
      </div>
    </div>
  );
}