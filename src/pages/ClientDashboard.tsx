import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase, AgendamentoWithDetails } from '../lib/supabase';
import { LogOut, CalendarCheck, Clock, Scissors, User, CalendarDays, History } from 'lucide-react';

export default function ClientDashboard() {
  const { user, profile, signOut } = useAuth();
  const [appointments, setAppointments] = useState<AgendamentoWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [timeLeft, setTimeLeft] = useState<string>('');

  console.log('ClientDashboard: Component Rendered. User:', user?.id, 'Profile Role:', profile?.role, 'Loading:', loading, 'Error:', error);

  const fetchAppointments = async () => {
    console.log('ClientDashboard: fetchAppointments called.');
    if (!user || !profile || profile.role !== 'client') {
      console.log('ClientDashboard: Not authorized or no user/profile for client role. User:', user?.id, 'Profile Role:', profile?.role);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError('');
    try {
      const { data: clientData, error: clientError } = await supabase
        .from('clientes')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (clientError) throw clientError;
      if (!clientData) {
        setError('Dados do cliente não encontrados. Por favor, tente fazer login novamente ou cadastre-se.');
        setLoading(false);
        console.log('ClientDashboard: Client data not found for user ID:', user.id);
        return;
      }

      console.log('ClientDashboard: Client ID for fetching appointments:', clientData.id);

      const { data, error } = await supabase
        .from('agendamentos')
        .select(`
          *,
          servico:servicos(nome_servico, duracao_media_minutos),
          profissional:profiles(full_name)
        `)
        .eq('id_cliente', clientData.id)
        .order('data_hora_inicio', { ascending: true });

      if (error) throw error;
      setAppointments(data || []);
      console.log('ClientDashboard: Fetched appointments:', data);

    } catch (err: any) {
      console.error('ClientDashboard: Erro ao buscar agendamentos:', err);
      setError('Não foi possível carregar seus agendamentos.');
    } finally {
      setLoading(false);
      console.log('ClientDashboard: fetchAppointments finished. Loading:', false);
    }
  };

  useEffect(() => {
    console.log('ClientDashboard: useEffect triggered for user/profile change.');
    fetchAppointments();
  }, [user, profile]);

  useEffect(() => {
    const nextAppointment = appointments.find(appt => new Date(appt.data_hora_inicio) > new Date());

    if (!nextAppointment) {
      setTimeLeft('');
      return;
    }

    const calculateTimeLeft = () => {
      const appointmentTime = new Date(nextAppointment.data_hora_inicio).getTime();
      const now = new Date().getTime();
      const difference = appointmentTime - now;

      if (difference <= 0) {
        setTimeLeft('Seu agendamento está acontecendo agora ou já passou!');
        return;
      }

      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);

      setTimeLeft(
        `${days > 0 ? `${days}d ` : ''}${hours.toString().padStart(2, '0')}h ${minutes.toString().padStart(2, '0')}m ${seconds.toString().padStart(2, '0')}s`
      );
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(timer);
  }, [appointments]);

  const upcomingAppointments = appointments.filter(appt => new Date(appt.data_hora_inicio) > new Date());
  const pastAppointments = appointments.filter(appt => new Date(appt.data_hora_inicio) <= new Date());
  const nextAppointment = upcomingAppointments.length > 0 ? upcomingAppointments[0] : null;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'agendado':
        return 'bg-blue-100 text-blue-700';
      case 'concluido':
        return 'bg-green-100 text-green-700';
      case 'cancelado':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-slate-100 text-slate-700';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'agendado':
        return 'Agendado';
      case 'concluido':
        return 'Concluído';
      case 'cancelado':
        return 'Cancelado';
      default:
        return status;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-300 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Carregando seu painel...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-lg text-center">
          <p>{error}</p>
          <button onClick={signOut} className="mt-4 text-blue-600 hover:underline">
            Tentar fazer login novamente
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex flex-col">
      <header className="bg-gradient-to-r from-blue-600 to-indigo-600 p-4 shadow-lg flex justify-between items-center">
        <h1 className="text-xl font-bold text-white">Olá, {profile?.full_name?.split(' ')[0] || 'Cliente'}!</h1>
        <button
          onClick={signOut}
          className="text-white flex items-center space-x-2 px-3 py-2 rounded-lg hover:bg-blue-700 transition"
        >
          <LogOut size={18} />
          <span>Sair</span>
        </button>
      </header>

      <main className="flex-1 p-6 flex flex-col items-center">
        <div className="max-w-2xl w-full bg-white rounded-xl shadow-2xl p-8 text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">Seu Próximo Agendamento</h2>

          {nextAppointment ? (
            <div className="space-y-4">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-blue-100 rounded-full mb-4">
                <CalendarCheck className="w-10 h-10 text-blue-600" />
              </div>
              <p className="text-gray-600 text-lg">
                Você tem um agendamento para:
              </p>
              <p className="text-4xl font-extrabold text-blue-700 mb-4">
                {new Date(nextAppointment.data_hora_inicio).toLocaleDateString('pt-BR', { dateStyle: 'full', timeStyle: 'short' })}
              </p>

              <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg space-y-2 text-left">
                <div className="flex items-center space-x-2 text-gray-800">
                  <Scissors size={20} className="text-blue-600" />
                  <span className="font-semibold">{nextAppointment.servico?.nome_servico}</span>
                </div>
                {nextAppointment.profissional && (
                  <div className="flex items-center space-x-2 text-gray-800">
                    <User size={20} className="text-blue-600" />
                    <span>Com: {nextAppointment.profissional.full_name}</span>
                  </div>
                )}
                <div className="flex items-center space-x-2 text-gray-800">
                  <Clock size={20} className="text-blue-600" />
                  <span>Duração estimada: {nextAppointment.servico?.duracao_media_minutos} minutos</span>
                </div>
              </div>

              <div className="mt-8">
                <p className="text-gray-700 text-xl font-semibold mb-2">Tempo restante:</p>
                <p className="text-5xl font-extrabold text-indigo-700 animate-pulse">
                  {timeLeft}
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-gray-100 rounded-full mb-4">
                <CalendarCheck className="w-10 h-10 text-gray-500" />
              </div>
              <p className="text-gray-600 text-lg">
                Você não tem nenhum agendamento futuro.
              </p>
              <a
                href="/quick-appointment"
                className="mt-6 inline-block bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 px-6 rounded-lg font-medium hover:from-blue-700 hover:to-indigo-700 transition"
              >
                Agendar um Serviço
              </a>
            </div>
          )}
        </div>

        {/* Seção de Agendamentos Futuros */}
        {upcomingAppointments.length > 1 && ( // Mostra se houver mais de um agendamento futuro (o primeiro já está no card principal)
          <div className="max-w-2xl w-full bg-white rounded-xl shadow-2xl p-8 mb-8 text-left">
            <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center space-x-2">
              <CalendarDays size={24} className="text-blue-600" />
              <span>Outros Agendamentos Futuros</span>
            </h3>
            <div className="space-y-4">
              {upcomingAppointments.slice(1).map(appt => ( // Pula o primeiro, que já está no card principal
                <div key={appt.id} className="border-b border-gray-200 pb-4 last:border-b-0 last:pb-0">
                  <p className="font-semibold text-gray-800">
                    {new Date(appt.data_hora_inicio).toLocaleDateString('pt-BR', { dateStyle: 'full', timeStyle: 'short' })}
                  </p>
                  <div className="flex items-center space-x-2 text-gray-600 text-sm mt-1">
                    <Scissors size={16} />
                    <span>{appt.servico?.nome_servico}</span>
                    {appt.profissional && (
                      <>
                        <User size={16} />
                        <span>Com: {appt.profissional.full_name}</span>
                      </>
                    )}
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(appt.status)}`}>
                      {getStatusLabel(appt.status)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Seção de Agendamentos Anteriores */}
        {pastAppointments.length > 0 && (
          <div className="max-w-2xl w-full bg-white rounded-xl shadow-2xl p-8 text-left">
            <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center space-x-2">
              <History size={24} className="text-gray-600" />
              <span>Agendamentos Anteriores</span>
            </h3>
            <div className="space-y-4">
              {pastAppointments.map(appt => (
                <div key={appt.id} className="border-b border-gray-200 pb-4 last:border-b-0 last:pb-0">
                  <p className="font-semibold text-gray-800">
                    {new Date(appt.data_hora_inicio).toLocaleDateString('pt-BR', { dateStyle: 'full', timeStyle: 'short' })}
                  </p>
                  <div className="flex items-center space-x-2 text-gray-600 text-sm mt-1">
                    <Scissors size={16} />
                    <span>{appt.servico?.nome_servico}</span>
                    {appt.profissional && (
                      <>
                        <User size={16} />
                        <span>Com: {appt.profissional.full_name}</span>
                      </>
                    )}
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(appt.status)}`}>
                      {getStatusLabel(appt.status)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}