import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { 
    Activity, 
    Search, 
    Calendar, 
    User as UserIcon, 
    Filter,
    ArrowUpDown,
    Info,
    Loader2,
    History
} from 'lucide-react';

interface AuditLog {
    id: string;
    user_id: string | null;
    action: string;
    entity_type: string | null;
    entity_id: string | null;
    details: any;
    created_at: string;
    profiles?: {
        full_name: string | null;
        email: string | null;
    } | null;
}

export const AuditLogs = () => {
    const { profile } = useAuth();
    const [logs, setLogs] = useState<AuditLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedUser, setSelectedUser] = useState('all');
    const [selectedAction, setSelectedAction] = useState('all');
    const [usersList, setUsersList] = useState<{ id: string; name: string }[]>([]);
    
    // Pagination
    const [page, setPage] = useState(0);
    const ITEMS_PER_PAGE = 20;

    const fetchLogs = useCallback(async () => {
        setLoading(true);
        try {
            let query = supabase
                .from('audit_logs')
                .select('*, profiles(full_name, email)')
                .order('created_at', { ascending: false })
                .range(page * ITEMS_PER_PAGE, (page + 1) * ITEMS_PER_PAGE - 1);

            if (selectedUser !== 'all') {
                query = query.eq('user_id', selectedUser);
            }

            if (selectedAction !== 'all') {
                query = query.eq('action', selectedAction);
            }

            const { data, error } = await query;

            if (error) throw error;
            setLogs(data || []);
        } catch (error) {
            console.error('Error fetching logs:', error);
        } finally {
            setLoading(false);
        }
    }, [page, selectedUser, selectedAction]);

    useEffect(() => {
        fetchLogs();
    }, [fetchLogs]);

    useEffect(() => {
        // Fetch users for the filter
        const fetchUsers = async () => {
            const { data } = await supabase
                .from('profiles')
                .select('id, full_name, email')
                .order('full_name');
            if (data) {
                setUsersList(data.map(u => ({
                    id: u.id,
                    name: u.full_name || u.email || 'Usuario sin nombre'
                })));
            }
        };
        fetchUsers();
    }, []);

    const getActionBadgeColor = (action: string) => {
        switch (action) {
            case 'LOGIN': return 'bg-green-50 text-green-600 border-green-100';
            case 'LOGOUT': return 'bg-slate-50 text-slate-600 border-slate-100';
            case 'PAGE_VIEW': return 'bg-blue-50 text-blue-600 border-blue-100';
            case 'CREATE_RECORD': return 'bg-indigo-50 text-indigo-600 border-indigo-100';
            case 'UPDATE_RECORD': return 'bg-amber-50 text-amber-600 border-amber-100';
            case 'DELETE_RECORD': return 'bg-red-50 text-red-600 border-red-100';
            default: return 'bg-slate-50 text-slate-500 border-slate-100';
        }
    };

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleString('es-GT', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
    };

    if (profile?.role !== 'admin' && profile?.role !== 'master') {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-slate-500">
                <Info size={48} className="mb-4 opacity-20" />
                <h2 className="text-xl font-bold">Acceso Denegado</h2>
                <p>No tienes permisos para ver esta sección.</p>
            </div>
        );
    }

    return (
        <div className="space-y-6 pb-10">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-3">
                        <History className="text-skin-accent" />
                        Bitácora de Usuario
                    </h1>
                    <p className="text-slate-500 mt-1">Monitorea la actividad y trazabilidad del sistema.</p>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-wrap gap-4 items-end">
                <div className="flex-1 min-w-[200px]">
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Usuario</label>
                    <div className="relative">
                        <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <select 
                            value={selectedUser}
                            onChange={(e) => { setSelectedUser(e.target.value); setPage(0); }}
                            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-skin-accent/20 transition-all appearance-none"
                        >
                            <option value="all">Todos los usuarios</option>
                            {usersList.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                        </select>
                    </div>
                </div>

                <div className="flex-1 min-w-[200px]">
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Acción</label>
                    <div className="relative">
                        <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <select 
                            value={selectedAction}
                            onChange={(e) => { setSelectedAction(e.target.value); setPage(0); }}
                            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-skin-accent/20 transition-all appearance-none"
                        >
                            <option value="all">Todas las acciones</option>
                            <option value="LOGIN">Inicios de Sesión</option>
                            <option value="LOGOUT">Cierres de Sesión</option>
                            <option value="PAGE_VIEW">Navegación</option>
                            <option value="CREATE_RECORD">Creaciones</option>
                            <option value="UPDATE_RECORD">Ediciones</option>
                            <option value="DELETE_RECORD">Eliminaciones</option>
                        </select>
                    </div>
                </div>

                <div className="flex gap-2">
                    <button 
                        onClick={() => setPage(Math.max(0, page - 1))}
                        disabled={page === 0 || loading}
                        className="p-2.5 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 disabled:opacity-50 transition-all"
                    >
                        Anterior
                    </button>
                    <div className="flex items-center px-4 font-bold text-slate-700 bg-slate-100 rounded-xl text-sm">
                        Página {page + 1}
                    </div>
                    <button 
                        onClick={() => setPage(page + 1)}
                        disabled={logs.length < ITEMS_PER_PAGE || loading}
                        className="p-2.5 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 disabled:opacity-50 transition-all"
                    >
                        Siguiente
                    </button>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-2xl shadow-md border border-slate-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 border-b border-slate-100">
                            <tr>
                                <th className="px-6 py-4 font-bold text-slate-500 uppercase tracking-widest text-[10px]">Fecha y Hora</th>
                                <th className="px-6 py-4 font-bold text-slate-500 uppercase tracking-widest text-[10px]">Usuario</th>
                                <th className="px-6 py-4 font-bold text-slate-500 uppercase tracking-widest text-[10px]">Acción</th>
                                <th className="px-6 py-4 font-bold text-slate-500 uppercase tracking-widest text-[10px]">Detalles</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading ? (
                                <tr>
                                    <td colSpan={4} className="px-6 py-20 text-center">
                                        <Loader2 className="animate-spin inline-block text-skin-accent mb-2" size={32} />
                                        <p className="text-slate-400 font-medium">Cargando registros...</p>
                                    </td>
                                </tr>
                            ) : logs.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="px-6 py-20 text-center text-slate-400 italic">
                                        No se encontraron registros para los filtros seleccionados.
                                    </td>
                                </tr>
                            ) : (
                                logs.map((log) => (
                                    <tr key={log.id} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap text-slate-600 font-medium">
                                            <div className="flex items-center gap-2">
                                                <Calendar size={14} className="text-slate-300" />
                                                {formatDate(log.created_at)}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div>
                                                <p className="font-bold text-slate-800">{log.profiles?.full_name || 'Desconocido'}</p>
                                                <p className="text-xs text-slate-400">{log.profiles?.email || 'Sin email'}</p>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-black border ${getActionBadgeColor(log.action)}`}>
                                                {log.action}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-xs text-slate-500 max-w-md overflow-hidden">
                                                {log.action === 'PAGE_VIEW' ? (
                                                    <span className="bg-slate-100 px-2 py-0.5 rounded text-slate-600 font-mono">
                                                        {log.details?.path || '/'}
                                                    </span>
                                                ) : (
                                                    <pre className="text-[10px] bg-slate-50 p-2 rounded border border-slate-100 overflow-x-auto">
                                                        {JSON.stringify(log.details, null, 2)}
                                                    </pre>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};
