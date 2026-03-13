import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { Database } from '../types/supabase';
import { ShieldAlert, UserCog, Loader2, Store, Power, PowerOff, Box } from 'lucide-react';
import { AlertModal } from '../components/AlertModal';
import { ConfirmModal } from '../components/ConfirmModal';
import { ProfileModal } from '../components/ProfileModal';

type Profile = Database['public']['Tables']['profiles']['Row'];
type StoreType = Database['public']['Tables']['stores']['Row'];

export const Users = () => {
    const [profiles, setProfiles] = useState<Profile[]>([]);
    const [stores, setStores] = useState<StoreType[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState<string | null>(null);

    // Modal de alerta
    const [alertOpen, setAlertOpen] = useState(false);
    const [alertMessage, setAlertMessage] = useState('');

    // Modal de confirmación (Disable user)
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [userToToggle, setUserToToggle] = useState<Profile | null>(null);

    // Modal de Perfil (View Only)
    const [profileModalOpen, setProfileModalOpen] = useState(false);
    const [selectedUserProfile, setSelectedUserProfile] = useState<Profile | null>(null);

    const showAlert = (msg: string) => { setAlertMessage(msg); setAlertOpen(true); };

    const fetchData = async () => {
        setLoading(true);
        const [profilesResponse, storesResponse] = await Promise.all([
            supabase.from('profiles').select('*').order('created_at'),
            supabase.from('stores').select('*').order('name')
        ]);

        if (profilesResponse.data) setProfiles(profilesResponse.data);
        if (storesResponse.data) setStores(storesResponse.data);

        setLoading(false);
    };

    useEffect(() => {
        fetchData();

        const channel = supabase
            .channel('profiles_changes')
            .on('postgres_changes', 
                { event: 'UPDATE', schema: 'public', table: 'profiles' }, 
                (payload) => {
                    setProfiles(current => current.map(p => p.id === payload.new.id ? { ...p, ...payload.new } : p) as Profile[]);
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    const handleUpdateRole = async (userId: string, newRole: Profile['role']) => {
        const targetProfile = profiles.find(p => p.id === userId);
        if (targetProfile?.role === 'master') {
            showAlert('No se puede cambiar el rol de un usuario Master.');
            return;
        }

        setSaving(userId);
        const { error } = await supabase.from('profiles').update({ role: newRole }).eq('id', userId);
        setSaving(null);
        if (!error) {
            setProfiles(profiles.map(p => p.id === userId ? { ...p, role: newRole } : p));
        } else {
            showAlert('Error al actualizar rol: ' + error.message);
        }
    };

    const handleUpdateStore = async (userId: string, newStoreId: string) => {
        setSaving(userId);
        const storeValue = newStoreId === 'none' ? null : newStoreId;
        const { error } = await supabase.from('profiles').update({ store_id: storeValue }).eq('id', userId);
        setSaving(null);
        if (!error) {
            setProfiles(profiles.map(p => p.id === userId ? { ...p, store_id: storeValue } : p));
        } else {
            showAlert('Error al asignar tienda: ' + error.message);
        }
    };

    const confirmToggleActive = (profile: Profile) => {
        if (profile.role === 'master') {
            showAlert('El usuario Master no puede ser desactivado por seguridad.');
            return;
        }
        setUserToToggle(profile);
        setConfirmOpen(true);
    };

    const handleToggleActive = async () => {
        if (!userToToggle) return;
        setConfirmOpen(false);
        setSaving(userToToggle.id);
        
        const newValue = !userToToggle.is_active;
        const { error } = await supabase.from('profiles').update({ is_active: newValue }).eq('id', userToToggle.id);
        setSaving(null);
        
        if (!error) {
            setProfiles(profiles.map(p => p.id === userToToggle.id ? { ...p, is_active: newValue } : p));
        } else {
            showAlert('Error al cambiar el estado del usuario: ' + error.message);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Usuarios y Roles</h1>
                    <p className="text-slate-500 mt-1">Administra los accesos al sistema y asigna encargados a las tiendas.</p>
                </div>
            </div>

            <div className="bg-skin-card rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-slate-600">
                        <thead className="text-xs uppercase bg-slate-50 text-slate-500 font-semibold border-b border-slate-100">
                            <tr>
                                <th className="px-6 py-4">Usuario</th>
                                <th className="px-6 py-4">Rol en el Sistema</th>
                                <th className="px-6 py-4">Tienda Asignada</th>
                                <th className="px-6 py-4 text-center">Estado</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading ? (
                                <tr>
                                    <td colSpan={4} className="px-6 py-8 text-center text-slate-400">Cargando usuarios...</td>
                                </tr>
                            ) : profiles.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="px-6 py-8 text-center text-slate-400">No hay usuarios registrados.</td>
                                </tr>
                            ) : (
                                profiles.map((profile) => (
                                    <tr key={profile.id} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div 
                                                className="flex items-center gap-3 cursor-pointer group"
                                                onClick={() => {
                                                    setSelectedUserProfile(profile);
                                                    setProfileModalOpen(true);
                                                }}
                                            >
                                                <div className="w-10 h-10 rounded-full bg-slate-100 flex-shrink-0 flex items-center justify-center text-slate-500 font-bold overflow-hidden border border-slate-200 shadow-sm group-hover:ring-2 group-hover:ring-skin-accent transition-all">
                                                    {profile.avatar_url ? (
                                                        <img src={profile.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                                                    ) : (
                                                        profile.full_name?.charAt(0) || 'U'
                                                    )}
                                                </div>
                                                <div>
                                                    <span className="font-medium text-slate-800 block group-hover:text-skin-accent transition-colors">{profile.full_name || 'Sin Nombre'}</span>
                                                    <span className="text-xs text-slate-400 font-medium block mt-0.5 uppercase tracking-wider">
                                                        {profile.job_title || (profile.role === 'master' ? 'Master' : profile.role === 'operador' ? 'Operador' : 'Consulta')}
                                                    </span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                {profile.role === 'master' ? <ShieldAlert size={16} className="text-skin-accent" /> : profile.role === 'operador' ? <UserCog size={16} className="text-indigo-400" /> : <Box size={16} className="text-slate-300" />}
                                                <select
                                                    value={profile.role}
                                                    onChange={(e) => handleUpdateRole(profile.id, e.target.value as any)}
                                                    disabled={saving === profile.id || profile.role === 'master'}
                                                    className="bg-transparent border border-white-200 rounded-lg px-2 py-1 outline-none focus:border-skin-accent disabled:opacity-75 disabled:cursor-not-allowed font-medium"
                                                >
                                                    <option value="consulta">Consulta</option>
                                                    <option value="operador">Operador</option>
                                                    <option value="store_manager">Encargado de Tienda</option>
                                                    <option value="admin">Administrador</option>
                                                    <option value="master">Master</option>
                                                </select>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <Store size={16} className="text-slate-400" />
                                                <select
                                                    value={profile.store_id || 'none'}
                                                    onChange={(e) => handleUpdateStore(profile.id, e.target.value)}
                                                    disabled={saving === profile.id || profile.role === 'master'}
                                                    className="bg-transparent border border-slate-200 rounded-lg px-2 py-1 outline-none focus:border-skin-accent max-w-[200px] truncate disabled:opacity-50 disabled:bg-slate-50"
                                                >
                                                    <option value="none">-- Sin Asignar --</option>
                                                    {stores.map(s => (
                                                        <option key={s.id} value={s.id}>{s.name}</option>
                                                    ))}
                                                </select>
                                            </div>
                                            {profile.role === 'master' && <p className="text-[10px] text-skin-accent mt-1 italic">Master tiene acceso total</p>}
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            {saving === profile.id ? (
                                                <Loader2 className="animate-spin text-skin-accent mx-auto" size={18} />
                                            ) : (
                                                <button
                                                    onClick={() => confirmToggleActive(profile)}
                                                    disabled={profile.role === 'master'}
                                                    className={`inline-flex items-center gap-1.5 justify-center px-3 py-1.5 rounded-full text-xs font-semibold shadow-sm transition-colors ${
                                                        profile.is_active 
                                                            ? 'bg-green-50 text-green-600 hover:bg-green-100 disabled:opacity-100' 
                                                            : 'bg-red-50 text-red-600 hover:bg-red-100'
                                                    } disabled:cursor-not-allowed`}
                                                >
                                                    {profile.is_active ? <Power size={14} /> : <PowerOff size={14} />}
                                                    {profile.is_active ? 'Activo' : 'Desactivado'}
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal de alerta de error */}
            <AlertModal
                isOpen={alertOpen}
                message={alertMessage}
                onClose={() => setAlertOpen(false)}
            />

            {/* Modal de confirmación para desactivar/activar */}
            <ConfirmModal
                isOpen={confirmOpen}
                title={userToToggle?.is_active ? "¿Desactivar usuario?" : "¿Reactivar usuario?"}
                message={userToToggle?.is_active 
                    ? `¿Estás seguro que deseas desactivar a ${userToToggle?.full_name || 'este usuario'}? No podrá iniciar sesión en el sistema.`
                    : `¿Deseas reactivar a ${userToToggle?.full_name || 'este usuario'} para que vuelva a tener acceso al sistema?`}
                variant={userToToggle?.is_active ? "danger" : "default"}
                confirmLabel={userToToggle?.is_active ? "Sí, desactivar" : "Sí, reactivar"}
                onConfirm={handleToggleActive}
                onCancel={() => { setConfirmOpen(false); setUserToToggle(null); }}
            />

            {/* Modal de Perfil para ver info de usuario */}
            {selectedUserProfile && (
                <ProfileModal
                    isOpen={profileModalOpen}
                    onClose={() => {
                        setProfileModalOpen(false);
                        setSelectedUserProfile(null);
                    }}
                    user={{ id: selectedUserProfile.id } as any}
                    userEmail={selectedUserProfile.email || 'No disponible'}
                    onProfileUpdated={() => {}}
                    viewOnly={true}
                />
            )}
        </div>
    );
};
