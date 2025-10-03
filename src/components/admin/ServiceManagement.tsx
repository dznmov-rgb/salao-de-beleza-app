import { useState, useEffect } from 'react';
import { supabase, Servico } from '../../lib/supabase';
import { Plus, CreditCard as Edit2, X, Scissors, Clock } from 'lucide-react';

export default function ServiceManagement() {
  const [services, setServices] = useState<Servico[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    nome_servico: '',
    preco: 0,
    duracao_media_minutos: 30
  });

  useEffect(() => {
    loadServices();
  }, []);

  const loadServices = async () => {
    try {
      const { data, error } = await supabase
        .from('servicos')
        .select('*')
        .order('nome_servico');
      
      if (error) {
        console.error('Erro ao carregar serviços:', error);
        return;
      }
      
      setServices(data || []);
    } catch (error) {
      console.error('Erro ao carregar serviços:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (editingId) {
        const { error } = await supabase
          .from('servicos')
          .update(formData)
          .eq('id', editingId);
        
        if (error) throw error;
      } else {
        const { error } = await supabase.from('servicos').insert({
          ...formData,
          ativo: true
        });
        
        if (error) throw error;
      }

      resetForm();
      loadServices();
    } catch (error) {
      console.error('Erro ao salvar serviço:', error);
    }
  };

  const handleEdit = (service: Servico) => {
    setEditingId(service.id);
    setFormData({
      nome_servico: service.nome_servico,
      preco: service.preco,
      duracao_media_minutos: service.duracao_media_minutos
    });
    setShowModal(true);
  };

  const handleToggleStatus = async (id: string, currentStatus: boolean) => {
    try {
      const newStatus = !currentStatus;
      console.log('Trocando status do serviço', id, 'de', currentStatus, 'para', newStatus);
      
      const { error } = await supabase
        .from('servicos')
        .update({ ativo: newStatus })
        .eq('id', id);
      
      if (error) {
        console.error('Erro ao atualizar status:', error);
        throw error;
      }
      
      // Atualiza localmente para feedback imediato
      setServices(prevServices => 
        prevServices.map(service => 
          service.id === id 
            ? { ...service, ativo: newStatus }
            : service
        )
      );
      
      console.log('Status atualizado com sucesso!');
    } catch (error) {
      console.error('Erro ao alternar status do serviço:', error);
      alert('Erro ao atualizar status do serviço. Tente novamente.');
    }
  };

  const resetForm = () => {
    setFormData({
      nome_servico: '',
      preco: 0,
      duracao_media_minutos: 30
    });
    setEditingId(null);
    setShowModal(false);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-3xl font-bold text-slate-900">Gestão de Serviços</h2>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-lg hover:bg-slate-800 transition"
        >
          <Plus className="w-5 h-5" />
          Adicionar Serviço
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {services.map((service) => (
          <div
            key={service.id}
            className="bg-white rounded-xl shadow-sm border border-slate-200 p-6"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                  service.ativo ? 'bg-slate-900' : 'bg-slate-300'
                }`}>
                  <Scissors className={`w-6 h-6 ${service.ativo ? 'text-white' : 'text-slate-500'}`} />
                </div>
                <div>
                  <h3 className={`font-semibold ${service.ativo ? 'text-slate-900' : 'text-slate-500'}`}>
                    {service.nome_servico}
                  </h3>
                  <p className={`text-sm ${service.ativo ? 'text-slate-600' : 'text-slate-400'} flex items-center gap-1 mt-1`}>
                    <Clock className={`w-4 h-4 ${service.ativo ? 'text-slate-500' : 'text-slate-400'}`} />
                    {service.duracao_media_minutos} min
                  </p>
                </div>
              </div>
            </div>

            <div className="mb-4">
              <p className={`text-2xl font-bold ${service.ativo ? 'text-slate-900' : 'text-slate-500'}`}>
                R$ {service.preco.toFixed(2)}
              </p>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => handleEdit(service)}
                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition"
              >
                <Edit2 className="w-4 h-4" />
                Editar
              </button>
              <button
                onClick={() => handleToggleStatus(service.id, service.ativo)}
                className={`flex-1 px-3 py-2 rounded-lg transition ${
                  service.ativo
                    ? 'bg-red-100 text-red-700 hover:bg-red-200'
                    : 'bg-green-100 text-green-700 hover:bg-green-200'
                }`}
              >
                {service.ativo ? 'Desativar' : 'Ativar'}
              </button>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold text-slate-900">
                {editingId ? 'Editar Serviço' : 'Novo Serviço'}
              </h3>
              <button onClick={resetForm} className="text-slate-500 hover:text-slate-700">
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Nome do Serviço
                </label>
                <input
                  type="text"
                  value={formData.nome_servico}
                  onChange={(e) => setFormData({ ...formData, nome_servico: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Preço (R$)</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.preco}
                  onChange={(e) => setFormData({ ...formData, preco: parseFloat(e.target.value) })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium s-700 mb-2">
                  Duração Média (minutos)
                </label>
                <input
                  type="number"
                  min="5"
                  step="5"
                  value={formData.duracao_media_minutos}
                  onChange={(e) =>
                    setFormData({ ...formData, duracao_media_minutos: parseInt(e.target.value) })
                  }
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent"
                  required
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={resetForm}
                  className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-slate-900 text-white py-2 rounded-lg hover:bg-slate-800 transition"
                >
                  {editingId ? 'Salvar' : 'Criar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}