import { useState, useEffect } from 'react';
import { supabase, Profile } from '../lib/supabase';
import { ArrowLeft, UserPlus, LogIn } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

type Service = { id: number; nome_servico: string; preco: number; duracao_media_minutos: number; };

export default function QuickAppointment() {
  const { user, profile, signIn, signUp } = useAuth();
  const [step, setStep] = useState(0); // Novo passo inicial para escolha
  const [clientName, setClientName] = useState(profile?.full_name || '');
  const [clientPhone, setClientPhone] = useState(profile?.telefone || '');
  const [clientEmail, setClientEmail] = useState(''); // Para login/signup
  const [clientPassword, setClientPassword] = useState(''); // Para login/signup
  const [clientId, setClientId] = useState<number | null>(null);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedProfessional, setSelectedProfessional] = useState<Profile | 'any' | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [availableSlots, setAvailableSlots] = useState<Date[]>([]);
  const [selectedDateTime, setSelectedDateTime] = useState<Date | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [professionals, setProfessionals] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Efeito para preencher nome e telefone se o cliente estiver logado
  useEffect(() => {
    if (user && profile && profile.role === 'client') {
      setClientName(profile.full_name || '');
      setClientPhone(profile.telefone || '');
      setClientEmail(profile.email || '');
      // Tenta encontrar o cliente existente ou cria um novo e vincula ao user_id
      const findOrCreateClient = async () => {
        setLoading(true);
        try {
          let { data: existingClient } = await supabase
            .from('clientes')
            .select('id')
            .eq('user_id', user!.id)
            .maybeSingle();

          if (existingClient) {
            setClientId(existingClient.id);
          } else {
            // Se não encontrou pelo user_id, tenta pelo telefone/email
            let { data: clientByPhone } = await supabase
              .from('clientes')
              .select('id, nome_completo')
              .eq('telefone', profile.telefone)
              .maybeSingle();

            if (clientByPhone) {
              // Se encontrou pelo telefone, atualiza para vincular ao user_id
              await supabase.from('clientes').update({ user_id: user!.id }).eq('id', clientByPhone.id);
              setClientId(clientByPhone.id);
            } else {
              // Se não encontrou, cria um novo cliente e vincula ao user_id
              const { data: newClient } = await supabase
                .from('clientes')
                .insert({ nome_completo: profile.full_name, telefone: profile.telefone, user_id: user!.id })
                .select('id')
                .single();
              if (newClient) {
                setClientId(newClient.id);
              }
            }
          }
          setStep(4); // Pula para a escolha do serviço se já estiver logado como cliente
        } catch (err) {
          console.error("Erro ao vincular cliente logado:", err);
          setError("Erro ao carregar seus dados de cliente.");
        } finally {
          setLoading(false);
        }
      };
      findOrCreateClient();
    }
  }, [user, profile]);


  const handleGuestIdentificationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      let { data: existingClient } = await supabase
        .from('clientes')
        .select('id, nome_completo')
        .eq('telefone', clientPhone)
        .maybeSingle();

      if (existingClient) {
        setClientId(existingClient.id);
        setClientName(existingClient.nome_completo);
      } else {
        const { data: newClient } = await supabase
          .from('clientes')
          .insert({ nome_completo: clientName, telefone: clientPhone })
          .select('id')
          .single();
        if (newClient) {
          setClientId(newClient.id);
        }
      }
      setStep(4); // Próximo passo: Escolha o Serviço
    } catch (err: any) {
      console.error(err);
      setError("Ocorreu um erro na identificação. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await signIn(clientEmail, clientPassword);
      // AuthContext useEffect will handle setting user/profile and redirecting if needed
      // For quick-appointment, it should automatically jump to step 4 via the useEffect above
    } catch (err: any) {
      setError(err.message || 'Email ou senha incorretos.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccessMessage('');
    try {
      await signUp(clientName, clientEmail, clientPassword, 'client', clientPhone);
      setSuccessMessage('Cadastro realizado com sucesso! Verifique seu e-mail para confirmar a conta. Você será redirecionado para o agendamento.');
      // AuthContext useEffect will handle setting user/profile and redirecting if needed
      // For quick-appointment, it should automatically jump to step 4 via the useEffect above
    } catch (err: any) {
      setError(err.message || 'Ocorreu um erro ao criar a conta.');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmAppointment = async () => {
    setLoading(true);
    setError('');
    try {
      const { error } = await supabase.from('agendamentos').insert({
        id_cliente: clientId,
        id_servico: selectedService!.id,
        id_profissional: selectedProfessional === 'any' ? null : selectedProfessional!.id,
        data_hora_inicio: selectedDateTime!.toISOString(),
        data_hora_fim: new Date(selectedDateTime!.getTime() + selectedService!.duracao_media_minutos * 60000).toISOString()
      });
      if (error) throw error;
      setStep(8); // Novo passo de sucesso
    } catch (err) {
      console.error(err);
      setError('Erro ao salvar agendamento.');
    } finally {
      setLoading(false);
    }
  };

  const fetchServices = async () => {
    setLoading(true);
    setError('');
    try {
      const { data, error } = await supabase
        .from('servicos')
        .select('*')
        .eq('ativo', true) // Apenas serviços ativos
        .order('nome_servico');
      if (error) throw error;
      setServices(data || []);
    } catch (err: any) {
      setError('Não foi possível carregar os serviços.');
    } finally {
      setLoading(false);
    }
  };

  const fetchProfessionals = async () => {
    setLoading(true);
    setError('');
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'professional')
        .eq('is_working', true); // Apenas profissionais em expediente
      if (error) throw error;
      setProfessionals(data || []);
    } catch (err: any) {
      setError('Não foi possível carregar os profissionais.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const loadStepData = async () => {
      setLoading(true);
      setError('');
      try {
        if (step === 4 && services.length === 0) { // Antigo step 2
          await fetchServices();
        }
        if (step === 5 && professionals.length === 0) { // Antigo step 3
          await fetchProfessionals();
        }
      } catch (err: any) {
        setError('Não foi possível carregar os dados. Tente novamente.');
      } finally {
        setLoading(false);
      }
    };
    loadStepData();
  }, [step]);

  const calculateAvailableSlots = async (date: Date) => {
    if (!selectedService || !selectedProfessional) return;
    setLoading(true);
    setAvailableSlots([]);
    const serviceDuration = selectedService.duracao_media_minutos;
    const professionalId = selectedProfessional === 'any' ? null : selectedProfessional.id;
    const dayStart = new Date(new Date(date).setHours(0, 0, 0, 0)).toISOString();
    const dayEnd = new Date(new Date(date).setHours(23, 59, 59, 999)).toISOString();
    let query = supabase.from('agendamentos').select('data_hora_inicio, data_hora_fim').gte('data_hora_inicio', dayStart).lte('data_hora_inicio', dayEnd);
    if (professionalId) { query = query.eq('id_profissional', professionalId); }
    const { data: existingAppointments, error } = await query;
    if (error) { console.error(error); setLoading(false); return; }
    const busySlots = existingAppointments.map(appt => ({ start: new Date(appt.data_hora_inicio), end: new Date(appt.data_hora_fim) }));
    const slots: Date[] = [];
    const workDayStart = 9, workDayEnd = 18, slotInterval = 30;
    for (let hour = workDayStart; hour < workDayEnd; hour++) {
      for (let minute = 0; minute < 60; minute += slotInterval) {
        const potentialStart = new Date(new Date(date).setHours(hour, minute, 0, 0));
        const potentialEnd = new Date(potentialStart.getTime() + serviceDuration * 60000);
        if (potentialEnd.getHours() > workDayEnd || (potentialEnd.getHours() === workDayEnd && potentialEnd.getMinutes() > 0)) continue;
        let isFree = true;
        for (const busy of busySlots) {
          if ((potentialStart >= busy.start && potentialStart < busy.end) || (potentialEnd > busy.start && potentialEnd <= busy.end) || (potentialStart <= busy.start && potentialEnd >= busy.end)) { isFree = false; break; }
        }
        if (isFree) { slots.push(potentialStart); }
      }
    }
    setAvailableSlots(slots);
    setLoading(false);
  };

  useEffect(() => {
    if (selectedDate && selectedService && selectedProfessional) {
      calculateAvailableSlots(selectedDate);
    }
  }, [selectedDate, selectedProfessional, selectedService]);

  const handleNextStep = () => setStep(prev => prev + 1);
  const handleBackStep = () => { 
    if (step === 6) setSelectedDate(null); // Se voltar da escolha de data/hora
    setStep(prev => prev - 1); 
  };
  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
    setAvailableSlots([]);
  };

  const getNext7Days = () => {
    const days = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date();
      date.setDate(date.getDate() + i);
      days.push(date);
    }
    return days;
  };

  const renderStepContent = () => {
    if (loading) return <p className="text-center text-gray-500">Carregando...</p>;
    if (error) return <p className="text-center text-red-600">{error}</p>;
    if (successMessage) return (
      <div className="text-center">
        <h1 className="text-2xl font-bold text-green-600 mb-4">Sucesso!</h1>
        <p className="text-gray-600">{successMessage}</p>
        <button onClick={() => { setSuccessMessage(''); setStep(4); }} className="mt-6 inline-block w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 rounded-lg font-medium hover:from-blue-700 hover:to-indigo-700">Continuar para Agendamento</button>
      </div>
    );

    switch (step) {
      case 0: // Escolha inicial: Convidado, Login, Cadastro
        return (
          <div>
            <h1 className="text-2xl font-bold text-gray-900 text-center mb-6">Como você gostaria de agendar?</h1>
            <div className="space-y-4">
              <button onClick={() => setStep(1)} className="w-full flex items-center justify-center gap-3 p-4 border border-gray-300 rounded-lg hover:bg-blue-50 hover:border-blue-500 transition text-lg font-semibold text-gray-700">
                <UserPlus size={24} /> Agendar como Convidado
              </button>
              <button onClick={() => setStep(2)} className="w-full flex items-center justify-center gap-3 p-4 border border-gray-300 rounded-lg hover:bg-blue-50 hover:border-blue-500 transition text-lg font-semibold text-gray-700">
                <LogIn size={24} /> Entrar na Minha Conta
              </button>
              <button onClick={() => setStep(3)} className="w-full flex items-center justify-center gap-3 p-4 border border-gray-300 rounded-lg hover:bg-blue-50 hover:border-blue-500 transition text-lg font-semibold text-gray-700">
                <UserPlus size={24} /> Criar Minha Conta
              </button>
            </div>
          </div>
        );
      case 1: // Identificação como Convidado
        return (
          <form onSubmit={handleGuestIdentificationSubmit} className="space-y-4">
            <h1 className="text-2xl font-bold text-gray-900 text-center mb-6">Agendar como Convidado</h1>
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Seu Nome Completo</label>
              <input id="name" type="text" value={clientName} onChange={(e) => setClientName(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg" required />
            </div>
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">Seu Telefone (WhatsApp)</label>
              <input id="phone" type="tel" value={clientPhone} onChange={(e) => setClientPhone(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg" required />
            </div>
            <button type="submit" className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 rounded-lg font-medium hover:from-blue-700 hover:to-indigo-700">Continuar</button>
          </form>
        );
      case 2: // Login de Cliente
        return (
          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <h1 className="text-2xl font-bold text-gray-900 text-center mb-6">Entrar na Minha Conta</h1>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input id="email" type="email" value={clientEmail} onChange={(e) => setClientEmail(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg" required />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">Senha</label>
              <input id="password" type="password" value={clientPassword} onChange={(e) => setClientPassword(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg" required />
            </div>
            <button type="submit" className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 rounded-lg font-medium hover:from-blue-700 hover:to-indigo-700">Entrar</button>
          </form>
        );
      case 3: // Cadastro de Cliente
        return (
          <form onSubmit={handleSignupSubmit} className="space-y-4">
            <h1 className="text-2xl font-bold text-gray-900 text-center mb-6">Criar Minha Conta</h1>
            <div>
              <label htmlFor="signupName" className="block text-sm font-medium text-gray-700 mb-1">Nome Completo</label>
              <input id="signupName" type="text" value={clientName} onChange={(e) => setClientName(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg" required />
            </div>
            <div>
              <label htmlFor="signupEmail" className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input id="signupEmail" type="email" value={clientEmail} onChange={(e) => setClientEmail(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg" required />
            </div>
            <div>
              <label htmlFor="signupPhone" className="block text-sm font-medium text-gray-700 mb-1">Telefone (WhatsApp)</label>
              <input id="signupPhone" type="tel" value={clientPhone} onChange={(e) => setClientPhone(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg" required />
            </div>
            <div>
              <label htmlFor="signupPassword" className="block text-sm font-medium text-gray-700 mb-1">Senha</label>
              <input id="signupPassword" type="password" value={clientPassword} onChange={(e) => setClientPassword(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg" required />
            </div>
            <button type="submit" className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 rounded-lg font-medium hover:from-blue-700 hover:to-indigo-700">Cadastrar e Agendar</button>
          </form>
        );
      case 4: // Escolha o Serviço (antigo step 2)
        return (
          <div>
            <h1 className="text-2xl font-bold text-gray-900 text-center mb-6">Escolha o Serviço</h1>
            <div className="space-y-3">
              {services.map(service => (
                <button key={service.id} onClick={() => { setSelectedService(service); handleNextStep(); }} className="w-full text-left p-4 border border-gray-300 rounded-lg hover:bg-blue-50 hover:border-blue-500 transition">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-gray-700">{service.nome_servico}</span>
                    <span className="font-bold text-gray-900">R$ {service.preco.toFixed(2).replace('.', ',')}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        );
      case 5: // Escolha o Profissional (antigo step 3)
        return (
          <div>
            <h1 className="text-2xl font-bold text-gray-900 text-center mb-6">Escolha o Profissional</h1>
            <div className="space-y-3">
              <button onClick={() => { setSelectedProfessional('any'); handleNextStep(); }} className="w-full text-left p-4 border border-gray-300 rounded-lg hover:bg-blue-50 hover:border-blue-500 transition bg-blue-50 font-semibold text-gray-900">Sem Preferência</button>
              {professionals.map(pro => (
                <button key={pro.id} onClick={() => { setSelectedProfessional(pro); handleNextStep(); }} className="w-full text-left p-4 border border-gray-300 rounded-lg hover:bg-blue-50 hover:border-blue-500 transition">
                  <span className="font-semibold text-gray-700">{pro.full_name}</span>
                </button>
              ))}
            </div>
          </div>
        );
      case 6: // Escolha Data e Hora (antigo step 4)
        return (
          <div>
            <h1 className="text-2xl font-bold text-gray-900 text-center mb-6">Escolha o Horário</h1>
            <div className="mb-6">
              <p className="text-sm font-medium text-gray-700 mb-2">Selecione o Dia:</p>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {getNext7Days().map(day => (
                  <button key={day.toISOString()} onClick={() => handleDateSelect(day)} className={`p-2 border border-gray-300 rounded-lg text-center ${selectedDate?.toDateString() === day.toDateString() ? 'bg-blue-600 text-white' : 'hover:bg-gray-100'}`}>
                    <div className="text-xs">{day.toLocaleDateString('pt-BR', { weekday: 'short' })}</div>
                    <div className="font-bold">{day.getDate()}</div>
                  </button>
                ))}
              </div>
            </div>
            {selectedDate && (
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">Horários Disponíveis:</p>
                {loading ? <p className="text-center text-gray-500">Calculando...</p> : availableSlots.length > 0 ? (
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                    {availableSlots.map(slot => (
                      <button key={slot.toISOString()} onClick={() => { setSelectedDateTime(slot); handleNextStep(); }} className="p-2 border border-gray-300 rounded-lg hover:bg-blue-600 hover:text-white transition">
                        {slot.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-gray-500">Nenhum horário vago para este dia.</p>
                )}
              </div>
            )}
          </div>
        );
      case 7: // Confirmação (antigo step 5)
        return (
          <div className="space-y-4">
            <h1 className="text-2xl font-bold text-gray-900 text-center mb-6">Confirme seu Agendamento</h1>
            <div className="p-4 border border-gray-300 rounded-lg bg-gray-50 space-y-2 text-gray-700">
              <p><strong>Nome:</strong> {clientName}</p>
              <p><strong>Serviço:</strong> {selectedService?.nome_servico}</p>
              <p><strong>Profissional:</strong> {selectedProfessional === 'any' ? 'Qualquer um' : selectedProfessional?.full_name}</p>
              <p><strong>Data e Hora:</strong> {selectedDateTime?.toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' }) || 'A definir'}</p>
            </div>
            <button onClick={handleConfirmAppointment} disabled={loading} className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 rounded-lg font-medium hover:from-blue-700 hover:to-indigo-700">Confirmar Agendamento</button>
          </div>
        );
      case 8: // Sucesso (antigo step 6)
        return (
          <div className="text-center">
            <h1 className="text-2xl font-bold text-green-600 mb-4">Agendamento Confirmado!</h1>
            <p className="text-gray-600">Seu horário foi marcado com sucesso. Mal podemos esperar para te ver!</p>
            {user && profile?.role === 'client' ? (
              <a href="/client-dashboard" className="mt-6 inline-block w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 rounded-lg font-medium hover:from-blue-700 hover:to-indigo-700">Ir para Meu Painel</a>
            ) : (
              <button onClick={() => setStep(0)} className="mt-6 inline-block w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 rounded-lg font-medium hover:from-blue-700 hover:to-indigo-700">Agendar Outro Serviço</button>
            )}
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center p-4 pt-10">
      <div className="w-full max-w-lg">
        {step > 0 && step < 8 ? ( // Botão de voltar aparece a partir do passo 1, e não no sucesso
          <button onClick={handleBackStep} className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-4">
            <ArrowLeft size={16} className="mr-1" />
            Voltar
          </button>
        ) : (
          <div className="h-10 mb-4"></div> // Espaçamento para manter o layout
        )}
        <div className="bg-white rounded-xl shadow-lg p-6">
          {renderStepContent()}
        </div>
      </div>
    </div>
  );
}