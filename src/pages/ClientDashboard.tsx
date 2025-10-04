import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase, Agendamento, Servico, Profile } from '../lib/supabase';
import { LogOut, CalendarCheck, Clock, Scissors, User } from 'lucide-react';

type NextAppointment = (Agendamento & {
  servico: Pick<Servico, 'nome_servico' | 'duracao_media_minutos'>;
  profissional: Pick<Profile, 'full_name'> | null;
}) | null;

export default function ClientDashboard() {
  const { user, profile, signOut } = useAuth();
  const [nextAppointment, setNextAppointment] = useState<NextAppointment>(null);
  const [timeLeft, setTimeLeft] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchNextAppointment = async () => {
    if (!user || !profile || profile.role !== 'client') {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError('');
    try {
      // Buscar o ID do cliente na tabela 'clientes' usando o user.id
      const { data: clientData, error: clientError } = await supabase
        .from('clientes')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (clientError) throw clientError;
      if (!clientData) {
        setError('Dados do cliente não encontrados. Por favor, tente fazer login novamente ou cadastre-se.');
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('agendamentos')
        .select(`
          *,
          servico:servicos(nome_servico, duracao_media_minutos),
          profissional:profiles(full_name)
        `)
        .eq('id_cliente', clientData.id) // Usar o id da tabela clientes
        .gte('data_hora_inicio', new Date().toISOString()) // Apenas agendamentos futuros
        .order('data_hora_inicio', { ascending: true })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      setNextAppointment(data);

    } catch (err: any) {
      console.error('Erro ao buscar próximo agendamento:', err);
      setError('Não foi possível carregar seu próximo agendamento.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNextAppointment();
  }, [user, profile]);

  useEffect(() => {
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

    calculateTimeLeft(); // Calcula imediatamente
    const timer = setInterval(calculateTimeLeft, 1000); // Atualiza a cada segundo

    return () => clearInterval(timer); // Limpa o timer ao desmontar
  }, [nextAppointment]);

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

      <main className="flex-1 p-6 flex flex-col items-center justify-center">
        <div className="max-w-2xl w-full bg-white rounded-xl shadow-2xl p-8 text-center">
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
      </main>
    </div>
  );
}