import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { UserPlus, Edit, Trash2 } from 'lucide-react';

// Tipos de dados
type Cliente = {
    id: number;
    nome_completo: string;
    telefone: string;
    created_at: string;
};

export default function Clientes() {
    const [clientes, setClientes] = useState<Cliente[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
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

        fetchClientes();
    }, []);

    return (
        <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-900">Clientes</h1>
                <button
                    className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-5 py-2 rounded-lg font-semibold hover:from-blue-700 hover:to-indigo-700 transition flex items-center space-x-2"
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
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b border-gray-200">
                                <th className="p-3 text-sm font-semibold text-gray-700">Nome</th>
                                <th className="p-3 text-sm font-semibold text-gray-700">Telefone</th>
                                <th className="p-3 text-sm font-semibold text-gray-700">Cadastrado Em</th>
                                <th className="p-3 text-sm font-semibold text-gray-700">Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            {clientes.map(cliente => (
                                <tr key={cliente.id} className="border-b border-gray-100 hover:bg-gray-50">
                                    <td className="p-3 font-medium text-gray-900">{cliente.nome_completo}</td>
                                    <td className="p-3 text-gray-600">{cliente.telefone}</td>
                                    <td className="p-3 text-gray-600">{new Date(cliente.created_at).toLocaleDateString('pt-BR')}</td>
                                    <td className="p-3 flex space-x-3">
                                        <button className="text-blue-600 hover:text-blue-700"><Edit size={18} /></button>
                                        <button className="text-red-600 hover:text-red-700"><Trash2 size={18} /></button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                ) : (
                    <p className="text-center text-gray-500">Nenhum cliente cadastrado.</p>
                )
            )}
        </div>
    );
}