import { useState, useEffect } from 'react';
import { supabase, Profile } from '../../lib/supabase';
import { Plus, Edit2, X, User } from 'lucide-react';

export default function TeamManagement() {
  const [professionals, setProfessionals] = useState<Profile[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    full_name: '', // Alterado de 'nome' para 'full_name'
    email: '',
    telefone: '',
    commission_percentage: 0,
    password: ''
  });

  useEffect(() => {
    loadProfessionals();
  }, []);

  const loadProfessionals = async () => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('role', 'professional')
      .order('full_name'); // Ordenar por full_name
    if (data) setProfessionals(data);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (editingId) {
      await supabase
        .from('profiles')
        .update({
          full_name: formData.full_name, // Alterado de 'nome' para 'full_name'
          telefone: formData.telefone,
          commission_percentage: formData.commission_percentage
        })
        .eq('id', editingId);
    } else {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            full_name: formData.full_name // Usar full_name para o trigger
          }
        }
      });

      if (authData.user && !authError) {
        await supabase.from('profiles').insert({
          id: authData.user.id,
          full_name: formData.full_name, // Usar full_name
          email: formData.email,
          telefone: formData.telefone,
          role: 'professional',
          commission_percentage: formData.commission_percentage,
          is_working: true
        });
      }
    }

    resetForm();
    loadProfessionals();
  };

  const handleEdit = (professional: Profile) => {
    setEditingId(professional.id);
    setFormData({
      full_name: professional.full_name, // Usar full_name
      email: professional.email,
      telefone: professional.telefone || '',
      commission_percentage: professional.commission_percentage,
      password: ''
    });
    setShowModal(true);
  };

  const handleToggleStatus = async (id: string, currentStatus: boolean) => {
    await supabase
      .from('profiles')
      .update({ is_working: !currentStatus })
      .eq('id', id);
    loadProfessionals();
  };

  const resetForm = () => {
    setFormData({
      full_name: '', // Alterado de 'nome' para 'full_name'
      email: '',
      telefone: '',
      commission_percentage: 0,
      password: ''
    });
    setEditingId(null);
    setShowModal(false);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-3xl font-bold text-slate-900">Gestão de Equipe</h2>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-lg hover:bg-slate-800 transition"
        >
          <Plus className="w-5 h-5" />
          Adicionar Profissional
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {professionals.map((professional) => (
          <div
            key={professional.id}
            className="bg-white rounded-xl shadow-sm border border-slate-200 p-6"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                  professional.is_working ? 'bg-slate-900' : 'bg-slate-300'
                }`}>
                  <User className={`w-6 h-6 ${professional.is_working ? 'text-white' : 'text-slate-500'}`} />
                </div>
                <div>
                  <h3 className={`font-semibold ${professional.is_working ? 'text-slate-900' : 'text-slate-500'}`}>
                    {professional.full_name}
                  </h3>
                  <p className={`text-sm ${professional.is_working ? 'text-slate-600' : 'text-slate-400'} mt-1`}>
                    {professional.email}
                  </p>
                </div>
              </div>
            </div>

            {professional.telefone && (
              <div className="mb-4">
                <p className={`text-sm ${professional.is_working ? 'text-slate-600' : 'text-slate-400'}`}>
                  Tel: {professional.telefone}
                </p>
              </div>
            )}

            <div className="mb-4">
              <p className={`text-sm ${professional.is_working ? 'text-slate-600' : 'text-slate-400'}`}>Comissão</p>
              <p className={`text-2xl font-bold ${professional.is_working ? 'text-slate-900' : 'text-slate-500'}`}>
                {professional.commission_percentage}%
              </p>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => handleEdit(professional)}
                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition"
              >
                <Edit2 className="w-4 h-4" />
                Editar
              </button>
              <button
                onClick={() => handleToggleStatus(professional.id, professional.is_working)}
                className={`flex-1 px-3 py-2 rounded-lg transition ${
                  professional.is_working
                    ? 'bg-red-100 text-red-700 hover:bg-red-200'
                    : 'bg-green-100 text-green-700 hover:bg-green-200'
                }`}
              >
                {professional.is_working ? 'Inativar' : 'Ativar'}
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
                {editingId ? 'Editar Profissional' : 'Novo Profissional'}
              </h3>
              <button onClick={resetForm} className="text-slate-500 hover:text-slate-700">
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Nome</label>
                <input
                  type="text"
                  value={formData.full_name} // Alterado de 'nome' para 'full_name'
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })} // Alterado de 'nome' para 'full_name'
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent text-sm"
                  required
                />
              </div>

              {!editingId && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Email</label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent text-sm"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Senha</label>
                    <input
                      type="password"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent text-sm"
                      required
                      minLength={6}
                    />
                  </div>
                </>
              )}

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Telefone</label>
                <input
                  type="tel"
                  value={formData.telefone}
                  onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Comissão (%)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  value={formData.commission_percentage}
                  onChange={(e) =>
                    setFormData({ ...formData, commission_percentage: parseFloat(e.target.value) })
                  }
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent text-sm"
                  required
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={resetForm}
                  className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition text-sm"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-slate-900 text-white py-2 rounded-lg hover:bg-slate-800 transition text-sm"
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