import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { Database } from '../types/supabase';
import { ShieldAlert, UserCog, Loader2, Store, Power, PowerOff, Box } from 'lucide-react';
import { AlertModal } from '../components/AlertModal';
import { ConfirmModal } from '../components/ConfirmModal';
import { ProfileModal } from '../components/ProfileModal';

type Profile = Database['public']['Tables']['profiles']['Row'];
type StoreType = Database['public']['Tables']['stores']['Row'];

const StoreMultiSelect = ({ 
    assignedStores, 
    stores, 
    onChange, 
    disabled 
}: { 
    assignedStores: string[], 
    stores: StoreType[], 
    onChange: (newIds: string[]) => void,
    disabled: boolean
}) => {
    const [open, setOpen] = useState(false);
    
    const hasAllStores = assignedStores.includes('ALL_STORES');
    const hasAllEvents = assignedStores.includes('ALL_EVENTS');
    const specificCount = assignedStores.filter(id => id !== 'ALL_STORES' && id !== 'ALL_EVENTS').length;
    
    let btnText = '-- Sin Asignar --';
    if (assignedStores.length === 0) btnText = '-- Sin Restricción --'; // Master/Admin
    else if (hasAllStores && hasAllEvents) btnText = 'Todo (Tiendas y Eventos)';
    else if (hasAllStores && specificCount > 0) btnText = `Todas las T. + ${specificCount} Ev.`;
    else if (hasAllStores) btnText = 'Todas las Tiendas';
    else if (hasAllEvents && specificCount > 0) btnText = `Todos los Ev. + ${specificCount} T.`;
    else if (hasAllEvents) btnText = 'Todos los Eventos';
    else if (specificCount > 0) btnText = `${specificCount} asignadas`;

    return (
        <div className="relative">
            <button 
                disabled={disabled} 
                onClick={() => setOpen(!open)}
                className="bg-transparent border border-slate-200 rounded-lg px-2 py-1 text-sm text-left truncate w-48 disabled:opacity-50 flex justify-between items-center"
                title={btnText}
            >
                <span className="truncate">{btnText}</span>
            </button>
            {open && (
                <div className="absolute top-full mt-1 left-0 w-72 bg-white border border-slate-200 rounded-lg shadow-xl z-50 p-2 max-h-72 overflow-y-auto">
                    {/* Botones de macro selección */}
                    <div className="space-y-1 mb-2 pb-2 border-b border-slate-100">
                        <label className="flex items-center gap-2 px-2 py-1 bg-skin-blush/20 hover:bg-skin-blush/50 cursor-pointer rounded border border-skin-accent/20">
                            <input 
                                type="checkbox" 
                                checked={hasAllStores}
                                onChange={(e) => {
                                    if (e.target.checked) onChange([...assignedStores, 'ALL_STORES']);
                                    else onChange(assignedStores.filter(id => id !== 'ALL_STORES'));
                                }}
                                className="accent-skin-accent"
                            /> 
                            <span className="text-sm font-bold text-slate-800">Todas las Tiendas (Dinámico)</span>
                        </label>
                        <label className="flex items-center gap-2 px-2 py-1 bg-orange-50 hover:bg-orange-100 cursor-pointer rounded border border-orange-200">
                            <input 
                                type="checkbox" 
                                checked={hasAllEvents}
                                onChange={(e) => {
                                    if (e.target.checked) onChange([...assignedStores, 'ALL_EVENTS']);
                                    else onChange(assignedStores.filter(id => id !== 'ALL_EVENTS'));
                                }}
                                className="accent-orange-500"
                            /> 
                            <span className="text-sm font-bold text-slate-800">Todos los Eventos (Dinámico)</span>
                        </label>
                    </div>

                    <div className="px-2 pb-1 text-xs font-semibold text-slate-400 uppercase tracking-wider">Selección Manual</div>
                    {stores.map(s => {
                        // Si ya tiene "Todas las tiendas", deseleccionamos visualmente la opción de clicar en una tienda específica y viceversa
                        const isStoreCovered = s.type === 'store' && hasAllStores;
                        const isEventCovered = s.type === 'event' && hasAllEvents;
                        const isCovered = isStoreCovered || isEventCovered;

                        return (
                            <label key={s.id} className={`flex items-center gap-2 px-2 py-1 cursor-pointer rounded ${isCovered ? 'opacity-50' : 'hover:bg-slate-50'}`}>
                                <input 
                                    type="checkbox" 
                                    checked={isCovered || assignedStores.includes(s.id)}
                                    disabled={isCovered}
                                    onChange={(e) => {
                                        if (e.target.checked) {
                                            onChange([...assignedStores, s.id]);
                                        } else {
                                            onChange(assignedStores.filter(id => id !== s.id));
                                        }
                                    }}
                                />
                                <span className={`text-sm truncate ${isCovered ? 'text-slate-400 italic' : 'text-slate-700'}`}>
                                    {s.type === 'event' ? '(Evento) ' : '(Tienda) '}{s.name}
                                </span>
                            </label>
                        );
                    })}
                    
                    {/* Opción para limpiar TODO y dejar vacío */}
                    {assignedStores.length > 0 && (
                        <button 
                            className="w-full mt-2 text-xs text-red-500 hover:text-red-700 py-1"
                            onClick={() => {
                                onChange([]);
                                setOpen(false);
                            }}
                        >
                            Quitar todas las asignaciones
                        </button>
                    )}

                    <button className="w-full mt-2 bg-skin-accent text-white py-1.5 rounded-md text-sm font-bold shadow-sm shadow-skin-accent/30" onClick={() => setOpen(false)}>Hecho</button>
                </div>
            )}
            {open && <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />}
        </div>
    );
};

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

    const fetchData = useCallback(async () => {
        // setLoading(true); // already true initially
        const [profilesResponse, storesResponse] = await Promise.all([
            supabase.from('profiles').select('*').order('created_at'),
            supabase.from('stores').select('*').order('name')
        ]);

        if (profilesResponse.data) setProfiles(profilesResponse.data);
        if (storesResponse.data) setStores(storesResponse.data);

        setLoading(false);
    }, []);

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
    }, [fetchData]);

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

    const handleUpdateStores = async (userId: string, newStores: string[]) => {
        setSaving(userId);
        const storesValue = newStores.length === 0 ? [] : newStores;
        const { error } = await supabase.from('profiles').update({ assigned_stores: storesValue }).eq('id', userId);
        setSaving(null);
        if (!error) {
            setProfiles(profiles.map(p => p.id === userId ? { ...p, assigned_stores: storesValue } : p));
        } else {
            showAlert('Error al asignar tiendas/eventos: ' + error.message);
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
        <div className="flex flex-col h-[calc(100vh-4rem)] space-y-6">
            <div className="shrink-0 flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Usuarios y Roles</h1>
                    <p className="text-slate-500 mt-1">Administra los accesos al sistema y asigna encargados a las tiendas.</p>
                </div>
            </div>

            <div className="flex-1 flex flex-col min-h-0 bg-skin-card rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="flex-1 overflow-x-auto overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                    <table className="w-full text-left text-sm text-slate-600 relative">
                        <thead className="text-xs uppercase bg-slate-50 text-slate-500 font-semibold border-b border-slate-100 sticky top-0 z-10 shadow-sm">
                            <tr>
                                <th className="px-6 py-4">Usuario</th>
                                <th className="px-6 py-4">Rol en el Sistema</th>
                                <th className="px-6 py-4">Asignaciones</th>
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
                                                    onChange={(e) => handleUpdateRole(profile.id, e.target.value as NonNullable<Profile['role']>)}
                                                    disabled={saving === profile.id || profile.role === 'master'}
                                                    className="bg-transparent border border-white-200 rounded-lg px-2 py-1 outline-none focus:border-skin-accent disabled:opacity-75 disabled:cursor-not-allowed font-medium"
                                                >
                                                    <option value="consulta">Consulta</option>
                                                    <option value="operador">Operador</option>
                                                    <option value="store_manager">Encargado</option>
                                                    <option value="mercadeo">Mercadeo</option>
                                                    <option value="ventas">Ventas</option>
                                                    <option value="admin">Administrador</option>
                                                    <option value="master">Master</option>
                                                </select>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <Store size={16} className="text-slate-400 mt-0.5" />
                                                <StoreMultiSelect 
                                                    assignedStores={profile.assigned_stores || []}
                                                    stores={stores}
                                                    onChange={(newStores) => handleUpdateStores(profile.id, newStores)}
                                                    disabled={saving === profile.id || profile.role === 'master'}
                                                />
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
                    user={{ id: selectedUserProfile.id } as unknown as import('@supabase/supabase-js').User}
                    userEmail={selectedUserProfile.email || 'No disponible'}
                    onProfileUpdated={() => {}}
                    viewOnly={true}
                />
            )}
        </div>
    );
};
