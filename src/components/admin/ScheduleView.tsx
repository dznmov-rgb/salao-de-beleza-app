import { useState, useEffect } from 'react';
import { supabase, AgendamentoWithDetails } from '../../lib/supabase';
import { Calendar, Clock, User, Phone } from 'lucide-react';

export default function ScheduleView() {
  const [appointments, setAppointments] = useState<AgendamentoWithDetails[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedProfessional, setSelectedProfessional] = useState<string>('all');
  const [professionals, setProfessionals] = useState<any[]>([]);

  useEffect(() => {
    loadProfessionals();
  }, []);

  useEffect(() => {
    loadAppointments();
  }, [selectedDate, selectedProfessional]);

  const loadProfessionals = async () => {
    const { data } = await supabase
      .from('profiles')
      .select('id, nome')
      .eq('role', 'professional')
      .eq('ativo', true)
      .order('nome');
    if (data) setProfessionals(data);
  };

  const loadAppointments = async () => {
    let query = supabase
      .from('agendamentos')
      .select(`
        *,
        servico:servicos(*),
        profissional:profiles(*)
      `)
      .gte('data_hora', `${selectedDate}T00:00:00`)
      .lte('data_hora', `${selectedDate}T23:59:59`)
      .order('data_hora');

    if (selectedProfessional !== 'all') {
      query = query.eq('id_profissional', selectedProfessional);
    }

    const { data } = await query;
    if (data) setAppointments(data as any);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'agendado':
        return 'bg-blue-100 text-blue-700';
      case 'executado':
        return 'bg-green-100 text-green-700';
      case 'nao_compareceu':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-slate-100 text-slate-700';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'agendado':
        return 'Agendado';
      case 'executado':
        return 'Executado';
      case 'nao_compareceu':
        return 'Não Compareceu';
      default:
        return status;
    }
  };

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold text-slate-900 mb-6">Agenda Completa</h2>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 mb-6">
        <div className="grid grid-cols-1 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Data</label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Profissional</label>
            <select
              value={selectedProfessional}
              onChange={(e) => setSelectedProfessional(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent"
            >
              <option value="all">Todos</option>
              {professionals.map((prof) => (
                <option key={prof.id} value={prof.id}>
                  {prof.nome}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {appointments.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 text-center">
          <Calendar className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-600">Nenhum agendamento encontrado para esta data</p>
        </div>
      ) : (
        <div className="space-y-3">
          {appointments.map((appointment) => (
            <div
              key={appointment.id}
              className="bg-white rounded-xl shadow-sm border border-slate-200 p-4"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2 text-slate-700">
                  <Clock className="w-4 h-4" />
                  <span className="font-semibold text-sm">
                    {new Date(appointment.data_hora).toLocaleTimeString('pt-BR', {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(appointment.status)}`}>
                  {getStatusLabel(appointment.status)}
                </span>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-slate-500" />
                  <span className="text-sm font-medium text-slate-900">{appointment.cliente_nome}</span>
                </div>
                
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-slate-500" />
                  <span className="text-sm text-slate-600">{appointment.cliente_telefone}</span>
                </div>

                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-slate-500" />
                  <span className="text-sm text-slate-900 font-medium">{appointment.servico.nome_servico}</span>
                  <span className="text-sm text-slate-600">- R$ {appointment.servico.preco.toFixed(2)}</span>
                </div>

                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-slate-500" />
                  <span className="text-sm text-slate-900">Prof: {appointment.profissional.nome}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}