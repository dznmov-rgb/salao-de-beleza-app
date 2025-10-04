import { useState, useEffect } from 'react';
import { supabase, Profile } from '../lib/supabase';
import { ArrowLeft, UserPlus, LogIn } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

type Service = { id: number; nome_servico: string; preco: number; duracao_media_minutos: number; };

export default function QuickAppointment() {
  const { user, profile, signIn, signUp, loading: authLoading } = useAuth(); // Use authLoading
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

  // Efeito para inicializar o cliente e o passo com base no estado de autenticação
  useEffect(() => {
    console.log('QuickAppointment: User/Profile useEffect triggered. User:', user?.id, 'Profile Role:', profile?.role, 'Current Step:', step, 'Auth Loading:', authLoading);

    const initializeClientAndStep = async () => {
      setLoading(true);
      setError('');
      setSuccessMessage(''); // Clear success message on re-init

      // Espera o AuthContext terminar de carregar antes de tomar decisões
      if (authLoading) {
        console.log('QuickAppointment: Auth is still loading, deferring initialization.');
        setLoading(false); // Garante que o loading local seja desativado enquanto o auth carrega
        return;
      }

      try {
        if (user && profile && profile.role === 'client') {
          setClientName(profile.full_name || '');
          setClientPhone(profile.telefone || '');
          setClientEmail(profile.email || '');

          let currentClientId: number | null = null;

          // 1. Tenta encontrar o cliente pelo user_id (se já estiver vinculado)
          let { data: existingClientByUser, error: clientByUserError } = await supabase
            .from('clientes')
            .select('id, nome_completo, telefone') // Seleciona também nome_completo e telefone
            .eq('user_id', user!.id)
            .maybeSingle();

          if (clientByUserError) throw clientByUserError;

          if (existingClientByUser) {
            currentClientId = existingClientByUser.id;
            console.log('QuickAppointment: Found client by user_id:', currentClientId);

            // Verifica se nome_completo ou telefone estão nulos e atualiza se necessário
            if (!existingClientByUser.nome_completo || !existingClientByUser.telefone) {
              console.log('QuickAppointment: Existing client data incomplete, attempting to update from profile.');
              const updateData: { nome_completo?: string; telefone?: string } = {};
              if (!existingClientByUser.nome_completo && profile.full_name) {
                updateData.nome_completo = profile.full_name;
              }
              if (!existingClientByUser.telefone && profile.telefone) {
                updateData.telefone = profile.telefone;
              }

              if (Object.keys(updateData).length > 0) {
                const { error: updateError } = await supabase
                  .from('clientes')
                  .update(updateData)
                  .eq('id', existingClientByUser.id);
                if (updateError) throw updateError;
                console.log('QuickAppointment: Client data updated from profile.');
              }
            }

          } else {
            // 2. Se não encontrou pelo user_id, tenta encontrar pelo telefone (para agendamentos de convidado)
            let { data: existingClientByPhone, error: clientByPhoneError } = await supabase
              .from('clientes')
              .select('id, nome_completo, telefone')
              .eq('telefone', profile.telefone)
              .maybeSingle();
            
            if (clientByPhoneError) throw clientByPhoneError;

            if (existingClientByPhone) {
              // 3. Se encontrou pelo telefone, atualiza para vincular ao user_id
              console.log('QuickAppointment: Found client by phone, linking to user_id:', existingClientByPhone.id);
              const { error: updateError } = await supabase.from('clientes').update({ user_id: user!.id }).eq('id', existingClientByPhone.id);
              if (updateError) throw updateError;
              currentClientId = existingClientByPhone.id;
            } else {
              // 4. Se não encontrou de nenhuma forma, cria um novo cliente e vincula ao user_id
              console.log('QuickAppointment: No existing client found, creating new and linking to user_id.');
              const { data: newClient, error: insertError } = await supabase
                .from('clientes')
                .insert({ nome_completo: profile.full_name, telefone: profile.telefone, user_id: user!.id })
                .select('id')
                .single();
              if (insertError) throw insertError;
              if (newClient) {
                currentClientId = newClient.id;
              }
            }
          }
          
          if (currentClientId) {
            setClientId(currentClientId);
            // Se o cliente está logado, pula para o passo de seleção de serviço
            setStep(4); 
            console.log('QuickAppointment: Client logged in, skipping to step 4 (service selection). Client ID:', currentClientId, 'Setting step to 4.');
          } else {
            setError("Não foi possível identificar ou criar seu perfil de cliente.");
            setStep(0); // Fallback para a escolha inicial se o ID do cliente não puder ser estabelecido
            console.log('QuickAppointment: Client ID not established, setting step to 0.');
          }

        } else if (!user) { // Se não estiver logado, sempre começa do passo 0
          console.log('QuickAppointment: User is not logged in. Starting from step 0.');
          setStep(0);
          setClientId(null); // Limpa o ID do cliente se não estiver logado
        } else { // Isso cobre casos como usuário logado mas não com role de cliente (admin/professional)
          console.log('QuickAppointment: User logged in but not client role. Resetting step to 0.');
          setStep(0);
          setClientId(null);
        }
      } catch (err) {
        console.error("QuickAppointment: Erro durante a inicialização:", err);
        setError("Ocorreu um erro ao inicializar a página.");
        setStep(0);
      } finally {
        setLoading(false); // Garante que o loading seja desativado em todos os cenários
      }
    };

    initializeClientAndStep();
  }, [user, profile, authLoading]); // Depende de user, profile e authLoading

  const handleGuestIdentificationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      let { data: existingClient } = await supabase
        .from('clientes')
        .select('id, nome_completo, telefone') // Seleciona nome_completo e telefone
        .eq('telefone', clientPhone)
        .maybeSingle();

      if (existingClient) {
        setClientId(existingClient.id);
        setClientName(existingClient.nome_completo || ''); // Ensure string

        // NOVO: Atualiza nome_completo e telefone se estiverem faltando no cliente existente
        if (!existingClient.nome_completo || !existingClient.telefone) {
          console.log('QuickAppointment: Existing guest client data incomplete, attempting to update.');
          const updateData: { nome_completo?: string; telefone?: string } = {};
          if (!existingClient.nome_completo && clientName) {
            updateData.nome_completo = clientName;
          }
          if (!existingClient.telefone && clientPhone) {
            updateData.telefone = clientPhone;
          }

          if (Object.keys(updateData).length > 0) {
            const { error: updateError } = await supabase
              .from('clientes')
              .update(updateData)
              .eq('id', existingClient.id);
            if (updateError) throw updateError;
            console.log('QuickAppointment: Existing guest client data updated.');
          }
        }

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
      console.error("QuickAppointment: Erro na identificação do convidado:", err);
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
      // AuthContext useEffect will handle setting user/profile and App.tsx will handle redirection
    } catch (err: any) {
      console.error("QuickAppointment: Erro no login:", err);
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
      // AuthContext useEffect will handle setting user/profile and App.tsx will handle redirection
    } catch (err: any) {
      console.error("QuickAppointment: Erro no cadastro:", err);
      setError(err.message || 'Ocorreu um erro ao criar a conta.');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmAppointment = async () => {
    setLoading(true);
    setError('');
    try {
      console.log('QuickAppointment: Confirming appointment with data:', {
        id_cliente: clientId,
        id_servico: selectedService!.id,
        id_profissional: selectedProfessional === 'any' ? null : selectedProfessional!.id,
        data_hora_inicio: selectedDateTime!.toISOString(),
        data_hora_fim: new Date(selectedDateTime!.getTime() + selectedService!.duracao_media_minutos * 60000).toISOString()
      });
      const { error } = await supabase.from('agendamentos').insert({
        id_cliente: clientId,
        id_servico: selectedService!.id,
        id_profissional: selectedProfessional === 'any' ? null : selectedProfessional!.id,
        data_hora_inicio: selectedDateTime!.toISOString(),
        data_hora_fim: new Date(selectedDateTime!.getTime() + selectedService!.duracao_media_minutos * 60000).toISOString()
      });
      if (error) throw error;
      console.log('QuickAppointment: Appointment confirmed successfully.');
      setStep(8); // Novo passo de sucesso
    } catch (err) {
      console.error("QuickAppointment: Erro ao salvar agendamento:", err);
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
      console.log('QuickAppointment: Services fetched:', data);
    } catch (err: any) {
      console.error("QuickAppointment: Erro ao carregar serviços:", err);
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
      console.log('QuickAppointment: Professionals fetched:', data);
    } catch (err: any) {
      console.error("QuickAppointment: Erro ao carregar profissionais:", err);
      setError('Não foi possível carregar os profissionais.');
    } finally {
      setLoading(false);
    }
  };

  // NOVA FUNÇÃO: Buscar horários disponíveis
  const fetchAvailableSlots = async () => {
    if (!selectedDate || !selectedService || !selectedProfessional) {
      setAvailableSlots([]);
      return;
    }

    setLoading(true);
    setError('');
    try {
      const dayStart = new Date(selectedDate);
      dayStart.setHours(8, 0, 0, 0); // Salon opens at 8 AM

      const dayEnd = new Date(selectedDate);
      dayEnd.setHours(20, 0, 0, 0); // Salon closes at 8 PM

      // Fetch existing appointments for the selected day
      let query = supabase
        .from('agendamentos')
        .select('data_hora_inicio, data_hora_fim')
        .gte('data_hora_inicio', dayStart.toISOString())
        .lt('data_hora_inicio', dayEnd.toISOString())
        .neq('status', 'cancelado'); // Exclude canceled appointments

      if (selectedProfessional !== 'any') {
        query = query.eq('id_profissional', (selectedProfessional as Profile).id);
      }

      const { data: existingAppointments, error: apptError } = await query;
      if (apptError) throw apptError;

      const occupiedSlots: { start: Date; end: Date }[] = (existingAppointments || []).map(appt => ({
        start: new Date(appt.data_hora_inicio),
        end: new Date(appt.data_hora_fim),
      }));

      const potentialSlots: Date[] = [];
      let currentTime = new Date(dayStart);

      while (currentTime.getTime() + selectedService.duracao_media_minutos * 60000 <= dayEnd.getTime()) {
        const slotEnd = new Date(currentTime.getTime() + selectedService.duracao_media_minutos * 60000);
        
        // Check if this potential slot overlaps with any existing appointment
        const isOverlapping = occupiedSlots.some(occupied => {
          return (
            (currentTime.getTime() < occupied.end.getTime() && slotEnd.getTime() > occupied.start.getTime())
          );
        });

        // Also check if the slot starts before the current time (to avoid showing past slots on the current day)
        const now = new Date();
        const isPast = currentTime.getTime() < now.getTime();

        if (!isOverlapping && !isPast) {
          potentialSlots.push(new Date(currentTime));
        }
        
        currentTime.setMinutes(currentTime.getMinutes() + selectedService.duracao_media_minutos);
      }
      
      setAvailableSlots(potentialSlots);

    } catch (err: any) {
      console.error("QuickAppointment: Erro ao carregar horários disponíveis:", err);
      setError('Não foi possível carregar os horários disponíveis.');
      setAvailableSlots([]);
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
          console.log('QuickAppointment: Loading services for step 4.');
          await fetchServices();
        }
        if (step === 5 && professionals.length === 0) { // Antigo step 3
          console.log('QuickAppointment: Loading professionals for step 5.');
          await fetchProfessionals();
        }
      } catch (err: any) {
        console.error("QuickAppointment: Erro ao carregar dados do passo:", err);
        setError('Não foi possível carregar os dados. Tente novamente.');
      } finally {
        setLoading(false);
      }
    };
    loadStepData();
  }, [step]);

  // NOVO useEffect para buscar horários disponíveis quando as dependências mudam
  useEffect(() => {
    if (selectedDate && selectedService && selectedProfessional) {
      fetchAvailableSlots();
    } else {
      setAvailableSlots([]); // Limpa os horários se as pré-condições não forem atendidas
    }
  }, [selectedDate, selectedService, selectedProfessional]);


  const handleNextStep = () => {
    console.log('QuickAppointment: Moving to next step:', step + 1);
    setStep(prev => prev + 1);
  }
  const handleBackStep = () => { 
    console.log('QuickAppointment: Moving to previous step:', step - 1);
    if (step === 6) setSelectedDate(null); // Se voltar da escolha de data/hora
    setStep(prev => prev - 1); 
  };
  const handleDateSelect = (date: Date) => {
    console.log('QuickAppointment: Date selected:', date);
    setSelectedDate(date);
    setAvailableSlots([]); // Limpa os slots para que a nova busca seja acionada
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

  // REMOVIDO: O bloco de redirecionamento interno para clientes foi removido daqui.
  // O App.tsx agora permite que clientes acessem esta página.

  const renderStepContent = () => {
    if (loading) return <p className="text-center text-gray-500">Carregando...</p>;
    if (error) return <p className="text-center text-red-600">{error}</p>;
    if (successMessage) return (
      <div className="text-center">
        <h1 className="text-2xl font-bold text-green-600 mb-4">Sucesso!</h1>
        <p className="text-gray-600">{successMessage}</p>
        <button onClick={() => { setSuccessMessage(''); setStep(0); }} className="mt-6 inline-block w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 rounded-lg font-medium hover:from-blue-700 hover:to-indigo-700">Agendar Outro Serviço</button>
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
        console.log('QuickAppointment: Rendering success step (step 8).'); // Added log here
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