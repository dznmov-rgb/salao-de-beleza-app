// src/pages/QuickAppointment.tsx

import { useState, useEffect } from 'react';
import { supabase, Profile } from '../lib/supabase';
import { ArrowLeft } from 'lucide-react';

type Service = { id: number; nome_servico: string; preco: number; duracao_media_minutos: number; };

export default function QuickAppointment() {
  const [step, setStep] = useState(1);
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedProfessional, setSelectedProfessional] = useState<Profile | 'any' | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [availableSlots, setAvailableSlots] = useState<Date[]>([]);
  const [selectedDateTime, setSelectedDateTime] = useState<Date | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [professionals, setProfessionals] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadStepData = async () => {
      setLoading(true);
      setError('');
      try {
        if (step === 2 && services.length === 0) {
          const { data, error } = await supabase.from('servicos').select('*').order('nome_servico');
          if (error) throw error;
          setServices(data || []);
        }
        if (step === 3 && professionals.length === 0) {
          const { data, error } = await supabase.from('profiles').select('*').eq('role', 'professional');
          if (error) throw error;
          setProfessionals(data || []);
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
  
  useEffect(() => { if (selectedDate) { calculateAvailableSlots(selectedDate); } }, [selectedDate, selectedProfessional, selectedService]);

  const handleNextStep = () => setStep(prev => prev + 1);
  const handleBackStep = () => { if (step === 4) setSelectedDate(null); setStep(prev => prev - 1); };
  const handleConfirmAppointment = async () => { setLoading(true); try { const { error } = await supabase.from('agendamentos').insert({ cliente_nome: clientName, cliente_telefone: clientPhone, id_servico: selectedService!.id, id_profissional: selectedProfessional === 'any' ? null : selectedProfessional!.id, data_hora_inicio: selectedDateTime!.toISOString(), data_hora_fim: new Date(selectedDateTime!.getTime() + selectedService!.duracao_media_minutos * 60000).toISOString() }); if (error) throw error; setStep(6); } catch (err) { console.error(err); setError('Erro ao salvar agendamento.'); } finally { setLoading(false); } };
  const handleDateSelect = (date: Date) => { setSelectedDate(date); setAvailableSlots([]); };
  const getNext7Days = () => [...Array(7)].map((_, i) => { const d = new Date(); d.setDate(d.getDate() + i); return d; });

  const renderStepContent = () => {
    if (loading) return <p className="text-center text-slate-500">Carregando...</p>;
    if (error) return <p className="text-center text-red-600">{error}</p>;
    switch (step) {
      case 1: return ( <form onSubmit={handleNextStep} className="space-y-4"> <h1 className="text-2xl font-bold text-slate-800 text-center mb-6">Identificação</h1> <div> <label htmlFor="name" className="block text-sm font-medium text-slate-700 mb-1">Seu Nome Completo</label> <input id="name" type="text" value={clientName} onChange={(e) => setClientName(e.target.value)} className="w-full px-4 py-2 border border-slate-300 rounded-lg" required /> </div> <div> <label htmlFor="phone" className="block text-sm font-medium text-slate-700 mb-1">Seu Telefone (WhatsApp)</label> <input id="phone" type="tel" value={clientPhone} onChange={(e) => setClientPhone(e.target.value)} className="w-full px-4 py-2 border border-slate-300 rounded-lg" required /> </div> <button type="submit" className="w-full bg-slate-900 text-white py-3 rounded-lg font-medium hover:bg-slate-800">Continuar</button> </form> );
      case 2: return ( <div> <h1 className="text-2xl font-bold text-slate-800 text-center mb-6">Escolha o Serviço</h1> <div className="space-y-3"> {services.map(s => ( <button key={s.id} onClick={() => { setSelectedService(s); handleNextStep(); }} className="w-full text-left p-4 border rounded-lg hover:bg-slate-50 hover:border-slate-900 transition"> <div className="flex justify-between items-center"> <span className="font-semibold text-slate-700">{s.nome_servico}</span> <span className="font-bold text-slate-900">R$ {s.preco.toFixed(2).replace('.', ',')}</span> </div> </button> ))} </div> </div> );
      case 3: return ( <div> <h1 className="text-2xl font-bold text-slate-800 text-center mb-6">Escolha o Profissional</h1> <div className="space-y-3"> <button onClick={() => { setSelectedProfessional('any'); handleNextStep(); }} className="w-full text-left p-4 border rounded-lg hover:bg-slate-50 hover:border-slate-900 transition bg-slate-50 font-semibold text-slate-900">Sem Preferência</button> {professionals.map(p => ( <button key={p.id} onClick={() => { setSelectedProfessional(p); handleNextStep(); }} className="w-full text-left p-4 border rounded-lg hover:bg-slate-50 hover:border-slate-900 transition"> <span className="font-semibold text-slate-700">{p.full_name}</span> </button> ))} </div> </div> );
      case 4: return ( <div> <h1 className="text-2xl font-bold text-slate-800 text-center mb-6">Escolha o Horário</h1> <div className="mb-6"> <p className="text-sm font-medium text-slate-700 mb-2">Selecione o Dia:</p> <div className="grid grid-cols-4 gap-2"> {getNext7Days().map(day => ( <button key={day.toISOString()} onClick={() => handleDateSelect(day)} className={`p-2 border rounded-lg text-center ${selectedDate?.toDateString() === day.toDateString() ? 'bg-slate-900 text-white' : 'hover:bg-slate-100'}`}> <div className="text-xs">{day.toLocaleDateString('pt-BR', { weekday: 'short' })}</div> <div className="font-bold">{day.getDate()}</div> </button>))} </div> </div> {selectedDate && ( <div> <p className="text-sm font-medium text-slate-700 mb-2">Horários Disponíveis:</p> {loading ? <p>Calculando...</p> : availableSlots.length > 0 ? ( <div className="grid grid-cols-4 gap-2"> {availableSlots.map(slot => ( <button key={slot.toISOString()} onClick={() => { setSelectedDateTime(slot); handleNextStep(); }} className="p-2 border rounded-lg hover:bg-slate-900 hover:text-white transition"> {slot.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })} </button> ))} </div> ) : <p className="text-center text-slate-500">Nenhum horário vago para este dia.</p>} </div> )} </div> );
      case 5: return ( <div className="space-y-4"> <h1 className="text-2xl font-bold text-slate-800 text-center mb-6">Confirme seu Agendamento</h1> <div className="p-4 border rounded-lg bg-slate-50 space-y-2 text-slate-700"> <p><strong>Nome:</strong> {clientName}</p> <p><strong>Serviço:</strong> {selectedService?.nome_servico}</p> <p><strong>Profissional:</strong> {selectedProfessional === 'any' ? 'Qualquer um' : selectedProfessional?.full_name}</p> <p><strong>Data e Hora:</strong> {selectedDateTime?.toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' }) || 'N/A'}</p> </div> <button onClick={handleConfirmAppointment} disabled={loading} className="w-full bg-slate-900 text-white py-3 rounded-lg font-medium hover:bg-slate-800 disabled:opacity-50">{loading ? 'Confirmando...' : 'Confirmar Agendamento'}</button> </div> );
      case 6: return ( <div className="text-center"> <h1 className="text-2xl font-bold text-green-600 mb-4">Agendamento Confirmado!</h1> <p className="text-slate-600">Seu horário foi marcado com sucesso. Mal podemos esperar para te ver!</p> <a href="/" className="mt-6 inline-block w-full bg-slate-900 text-white py-3 rounded-lg font-medium hover:bg-slate-800">Voltar para o Início</a> </div> );
      default: return null;
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col items-center p-4 pt-10">
      <div className="w-full max-w-lg">
        {step > 1 && step < 6 ? ( <button onClick={handleBackStep} className="inline-flex items-center text-slate-600 hover:text-slate-900 mb-4"> <ArrowLeft size={16} className="mr-1" /> Voltar </button> ) : ( <div className="h-10 mb-4"></div> )}
        <div className="bg-white rounded-xl shadow-lg p-6">
          {renderStepContent()}
        </div>
      </div>
    </div>
  );
}