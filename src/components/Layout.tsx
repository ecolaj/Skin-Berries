import { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { ProfileModal } from './ProfileModal';
import { ConfirmModal } from './ConfirmModal';
import { Store, Settings, LogOut, PackageSearch, LayoutDashboard, Users, Box, ChevronDown, Target, ClipboardList } from 'lucide-react';

export const Layout = () => {
    const { user, profile } = useAuth();
    const navigate = useNavigate();
    
    const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
    const [isLogoutConfirmOpen, setIsLogoutConfirmOpen] = useState(false);
    const [isConfigOpen, setIsConfigOpen] = useState(false);

    const handleLogout = async () => {
        setIsLogoutConfirmOpen(false);
        await supabase.auth.signOut();
        navigate('/login');
    };

    const navItems = [
        { to: "/", icon: <LayoutDashboard size={20} />, label: "Panel Principal" },
        { to: "/stores", icon: <Store size={20} />, label: "Tiendas" },
        { to: "/products", icon: <Box size={20} />, label: "Catálogo de Productos" },
        { to: "/restock", icon: <PackageSearch size={20} />, label: "Despachos e Inventario" },
        { to: "/dispatch-history", icon: <ClipboardList size={20} />, label: "Historial de Despachos" },
    ];

    const configItems = [
        { to: "/users", icon: <Users size={18} />, label: "Usuarios y Roles" },
        { to: "/goals", icon: <Target size={18} />, label: "Metas Corporativas" },
    ];

    const canSeeConfig = profile?.role === 'master' || profile?.role === 'admin';

    return (
        <div className="flex h-screen bg-skin-bg print:h-auto print:bg-white">
            {/* Sidebar */}
            <aside className="w-64 bg-skin-card border-r border-slate-200 flex flex-col print:hidden">
                <div className="p-6 flex justify-center">
                    <img src="/logo.png" alt="Skin & Berries Logo" className="h-16 w-auto object-contain" />
                </div>

                <nav className="flex-1 px-4 mt-4 space-y-1 overflow-y-auto">
                    {/* Main Nav */}
                    {navItems.map((item) => (
                        <NavLink
                            key={item.to}
                            to={item.to}
                            className={({ isActive }) =>
                                `flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${isActive
                                    ? 'bg-skin-blush text-skin-accent font-medium shadow-sm'
                                    : 'text-skin-dark hover:bg-slate-50 hover:text-skin-accent'
                                }`
                            }
                        >
                            {item.icon}
                            {item.label}
                        </NavLink>
                    ))}

                    {/* Configuration Submenu (For Master and Admin) */}
                    {canSeeConfig && (
                        <div className="pt-2">
                            <button
                                onClick={() => setIsConfigOpen(!isConfigOpen)}
                                className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all ${
                                    isConfigOpen ? 'text-skin-accent bg-slate-50/50' : 'text-skin-dark hover:bg-slate-50'
                                }`}
                            >
                                <div className="flex items-center gap-3">
                                    <Settings size={20} />
                                    <span className="font-medium">Configuración</span>
                                </div>
                                <ChevronDown 
                                    size={16} 
                                    className={`transition-transform duration-200 ${isConfigOpen ? 'rotate-180' : ''}`} 
                                />
                            </button>

                            {/* Sub-items */}
                            <div className={`mt-1 space-y-1 overflow-hidden transition-all duration-[400ms] ${isConfigOpen ? 'max-h-40 opacity-100' : 'max-h-0 opacity-0'}`}>
                                {configItems.map((subItem) => (
                                    <NavLink
                                        key={subItem.to}
                                        to={subItem.to}
                                        className={({ isActive }) =>
                                            `flex items-center gap-3 pl-11 pr-4 py-2.5 rounded-xl text-sm transition-all ${isActive
                                                ? 'text-skin-accent font-bold bg-skin-blush/30'
                                                : 'text-slate-500 hover:text-skin-accent hover:bg-slate-50'
                                            }`
                                        }
                                    >
                                        {subItem.icon}
                                        {subItem.label}
                                    </NavLink>
                                ))}
                            </div>
                        </div>
                    )}
                </nav>

                <div className="p-4 border-t border-slate-200">
                    <div 
                        onClick={() => setIsProfileModalOpen(true)}
                        className="flex items-center gap-3 px-4 py-3 bg-slate-50 hover:bg-slate-100 rounded-xl mb-4 cursor-pointer transition-colors group"
                    >
                        <div className="w-8 h-8 rounded-full bg-skin-rose text-white flex items-center justify-center font-bold overflow-hidden shadow-sm group-hover:ring-2 ring-skin-blush transition-all">
                            {profile?.avatar_url ? (
                                <img src={profile.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                            ) : (
                                user?.email?.[0].toUpperCase() ?? 'U'
                            )}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-slate-900 truncate group-hover:text-skin-accent transition-colors">
                                {profile?.full_name || user?.email}
                            </p>
                            <p className="text-xs text-slate-500 truncate">
                                {profile?.job_title || (profile?.role === 'master' ? 'Master' : profile?.role === 'operador' ? 'Operador' : 'Consulta')}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={() => setIsLogoutConfirmOpen(true)}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                        <LogOut size={16} />
                        Cerrar Sesión
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-auto print:overflow-visible">
                <div className="p-8 max-w-7xl mx-auto print:p-0 print:max-w-none">
                    <Outlet />
                </div>
            </main>

            {/* Profile Modal */}
            <ProfileModal
                isOpen={isProfileModalOpen}
                onClose={() => setIsProfileModalOpen(false)}
                user={user}
                onProfileUpdated={() => {}}
            />

            {/* Logout Confirmation Modal */}
            <ConfirmModal
                isOpen={isLogoutConfirmOpen}
                title="¿Cerrar sesión?"
                message="¿Estás seguro de que deseas salir del sistema? Tendrás que ingresar tus credenciales nuevamente para entrar."
                confirmLabel="Sí, salir"
                cancelLabel="Cancelar"
                variant="danger"
                onConfirm={handleLogout}
                onCancel={() => setIsLogoutConfirmOpen(false)}
            />
        </div>
    );
};
