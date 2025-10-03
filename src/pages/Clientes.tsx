import { useState, useEffect } from 'react';
import { supabase, Cliente } from '../lib/supabase';
import { UserPlus, Edit, Trash2, User, Phone } from 'lucide-react';
import ClientModal from '../components/ClientModal'; // Importa o novo modal

export default function Clientes() {
    const [clientes, setClientes] = useState<Cliente[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [clientToEdit, setClientToEdit] = useState<Cliente | null>(null);

    useEffect(() => {
        fetchClientes();
    }, []);

    const fetchClientes = async () => {
        setLoading(true);
        setError('');
        try {
            const { data, error } = await supabase
                .from('clientes')
                .select('*')
                .order('nome_completo');

            if (error) throw error;
            setClientes(data || []);
        } catch (err: any) {
            setError("Não foi possível carregar os clientes.");
        } finally {
            setLoading(false);
        }
    };

    const handleAddClient = () => {
        setClientToEdit(null); // Garante que o modal está em modo de criação
        setShowModal(true);
    };

    const handleEditClient = (client: Cliente) => {
        setClientToEdit(client); // Define o cliente a ser editado
        setShowModal(true);
    };

    const handleDeleteClient = async (id: number) => {
        if (!window.confirm('Tem certeza que deseja excluir este cliente?')) {
            return;
        }
        try {
            const { error } = await supabase
                .from('clientes')
                .delete()
                .eq('id', id);

            if (error) throw error;
            fetchClientes(); // Recarrega a lista após a exclusão
        } catch (err: any) {
            setError("Erro ao excluir cliente.");
            console.error(err);
        }
    };

    return (
        <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold text-gray-900">Gestão de Clientes</h1>
                <button
                    onClick={handleAddClient}
                    className="bg-slate-900 text-white px-5 py-2 rounded-lg font-semibold hover:bg-slate-800 transition flex items-center space-x-2"
                >
                    <UserPlus size={18} />
                    <span>Adicionar Cliente</span>
                </button>
            </div>

            {loading ? (
                <p className="text-center text-gray-500">Carregando clientes...</p>
            ) : error ? (
                <p className="text-red-600">{error}</p>
            ) : (
                clientes.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {clientes.map(cliente => (
                            <div
                                key={cliente.id}
                                className="bg-white rounded-xl shadow-sm border border-slate-200 p-6"
                            >
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 rounded-lg flex items-center justify-center bg-blue-100">
                                            <User className="w-6 h-6 text-blue-600" />
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-slate-900">
                                                {cliente.nome_completo}
                                            </h3>
                                            <p className="text-sm text-slate-600 flex items-center gap-1 mt-1">
                                                <Phone className="w-4 h-4 text-slate-500" />
                                                {cliente.telefone}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex gap-2 mt-4">
                                    <button
                                        onClick={() => handleEditClient(cliente)}
                                        className="flex-1 flex items-center justify-center gap-2 px-3 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition"
                                    >
                                        <Edit size={18} />
                                        Editar
                                    </button>
                                    <button
                                        onClick={() => handleDeleteClient(cliente.id)}
                                        className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition"
                                    >
                                        <Trash2 size={18} />
                                        Excluir
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 text-center">
                        <User className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                        <p className="text-slate-600">Nenhum cliente cadastrado.</p>
                    </div>
                )
            )}

            {showModal && (
                <ClientModal
                    clientToEdit={clientToEdit}
                    onClose={() => setShowModal(false)}
                    onSuccess={() => {
                        fetchClientes();
                        setShowModal(false);
                    }}
                />
            )}
        </div>
    );
}