import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import type { Database } from '../types/supabase';
import { Plus, Ticket, Loader2, X, MapPin, Phone, Clock, PowerOff, Power } from 'lucide-react';
import { ConfirmModal } from '../components/ConfirmModal';
import { AlertModal } from '../components/AlertModal';

type Store = Database['public']['Tables']['stores']['Row'];

const emptyForm = { name: '', address: '', phone: '', schedule: '' };

export const Events = () => {
    const [events, setEvents] = useState<Store[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [toggling, setToggling] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingEvent, setEditingEvent] = useState<Store | null>(null);
    const [formData, setFormData] = useState(emptyForm);
    const [showInactive, setShowInactive] = useState(false);
    
    // Auth Role
    const { profile } = useAuth();
    const userRole = profile?.role || null;
    const canManageEvents = ['master', 'admin', 'operador'].includes(userRole || '');
    const assignedStoreIds = profile?.assigned_stores || [];

    // Modales de confirmación y alerta
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [alertOpen, setAlertOpen] = useState(false);
    const [alertMessage, setAlertMessage] = useState('');

    const showAlert = (msg: string) => { setAlertMessage(msg); setAlertOpen(true); };

    const fetchEvents = async () => {
        setLoading(true);
        let query = supabase.from('stores').select('*').eq('type', 'event').order('name');
        if (assignedStoreIds.length > 0) {
            query = query.in('id', assignedStoreIds);
        }
        const { data } = await query;
        if (data) setEvents(data);
        setLoading(false);
    };

    useEffect(() => { fetchEvents(); }, []);

    const openAddModal = () => {
        setEditingEvent(null);
        setFormData(emptyForm);
        setIsModalOpen(true);
    };

    const openEditModal = (eventObj: Store) => {
        setEditingEvent(eventObj);
        setFormData({
            name: eventObj.name,
            address: eventObj.address || '',
            phone: eventObj.phone || '',
            schedule: eventObj.schedule || '',
        });
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingEvent(null);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);

        const payload = {
            name: formData.name,
            address: formData.address || null,
            phone: formData.phone || null,
            schedule: formData.schedule || null,
        };

        const { error } = editingEvent
            ? await supabase.from('stores').update(payload).eq('id', editingEvent.id)
            : await supabase.from('stores').insert([{ ...payload, type: 'event' as any }]);

        setSaving(false);
        if (!error) {
            closeModal();
            fetchEvents();
        } else {
            showAlert('Error al guardar evento: ' + error.message);
        }
    };

    const handleToggleActive = () => {
        if (!editingEvent) return;
        setConfirmOpen(true);
    };

    const doToggleActive = async () => {
        if (!editingEvent) return;
        setConfirmOpen(false);
        const next = !editingEvent.is_active;
        setToggling(true);
        const { error } = await supabase
            .from('stores')
            .update({ is_active: next })
            .eq('id', editingEvent.id);
        setToggling(false);

        if (!error) {
            closeModal();
            fetchEvents();
        } else {
            showAlert('Error al cambiar el estado: ' + error.message);
        }
    };

    const visibleEvents = showInactive
        ? events.filter((s) => !s.is_active)
        : events.filter((s) => s.is_active);

    const inactiveCount = events.filter((s) => !s.is_active).length;

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Gestión de Eventos</h1>
                    <p className="text-slate-500 mt-1">Administra tus eventos especiales.</p>
                </div>
                <div className="flex items-center gap-3 flex-wrap">
                    {/* Filtro Activas / Inactivas */}
                    <div className="flex items-center bg-slate-100 rounded-xl p-1 gap-1">
                        <button
                            onClick={() => setShowInactive(false)}
                            className={`px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all ${!showInactive ? 'bg-white shadow text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            Activos
                        </button>
                        <button
                            onClick={() => setShowInactive(true)}
                            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all ${showInactive ? 'bg-white shadow text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            Inactivos
                            {inactiveCount > 0 && (
                                <span className="bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded-full text-xs leading-none">
                                    {inactiveCount}
                                </span>
                            )}
                        </button>
                    </div>
                    {canManageEvents && (
                        <button
                            onClick={openAddModal}
                            className="flex items-center gap-2 bg-skin-accent hover:bg-pink-700 text-white px-5 py-2.5 rounded-xl font-medium shadow-md shadow-skin-accent/30 transition-all"
                        >
                            <Plus size={18} />
                            Añadir Evento
                        </button>
                    )}
                </div>
            </div>

            {/* Events Grid */}
            {loading ? (
                <div className="text-center py-12 text-slate-400">Cargando eventos...</div>
            ) : visibleEvents.length === 0 ? (
                <div className="text-center py-12 text-slate-400 bg-skin-card rounded-2xl border border-slate-100">
                    {showInactive ? 'No hay eventos inactivos.' : 'No hay eventos registrados.'}
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                    {visibleEvents.map((eventObj) => (
                        <div
                            key={eventObj.id}
                            className={`bg-skin-card rounded-2xl shadow-sm border overflow-hidden hover:shadow-md transition-all ${eventObj.is_active ? 'border-slate-100' : 'border-slate-200 opacity-70'}`}
                        >
                            {/* Card Header */}
                            <div className="px-6 pt-6 pb-4 border-b border-slate-100 flex items-start gap-3">
                                <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${eventObj.is_active ? 'bg-skin-blush text-skin-accent' : 'bg-slate-100 text-slate-400'}`}>
                                    <Ticket size={22} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h3 className="font-semibold text-slate-900 text-lg leading-tight">{eventObj.name}</h3>
                                    <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-orange-50 text-orange-600`}>
                                            Evento Especial
                                        </span>
                                        {!eventObj.is_active && (
                                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-500">
                                                Inactivo
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Card Details */}
                            <div className="px-6 py-4 space-y-2.5">
                                {eventObj.address ? (
                                    <div className="flex items-start gap-2 text-sm text-slate-600">
                                        <MapPin size={15} className="text-slate-400 mt-0.5 flex-shrink-0" />
                                        <span>{eventObj.address}</span>
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-2 text-sm text-slate-400 italic">
                                        <MapPin size={15} /><span>Sin dirección registrada</span>
                                    </div>
                                )}
                                {eventObj.phone ? (
                                    <div className="flex items-center gap-2 text-sm text-slate-600">
                                        <Phone size={15} className="text-slate-400 flex-shrink-0" />
                                        <span>{eventObj.phone}</span>
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-2 text-sm text-slate-400 italic">
                                        <Phone size={15} /><span>Sin teléfono registrado</span>
                                    </div>
                                )}
                                {eventObj.schedule ? (
                                    <div className="flex items-center gap-2 text-sm text-slate-600">
                                        <Clock size={15} className="text-slate-400 flex-shrink-0" />
                                        <span>{eventObj.schedule}</span>
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-2 text-sm text-slate-400 italic">
                                        <Clock size={15} /><span>Sin horario registrado</span>
                                    </div>
                                )}
                            </div>

                            {/* Card Footer */}
                            {canManageEvents && (
                                <div className="px-6 pb-5">
                                    <button
                                        onClick={() => openEditModal(eventObj)}
                                        className="w-full text-center py-2 rounded-xl border border-skin-accent/30 text-skin-accent text-sm font-medium hover:bg-skin-blush transition-all"
                                    >
                                        Editar información
                                    </button>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* Modal Añadir / Editar Evento */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
                        {/* Header */}
                        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                            <div>
                                <h3 className="text-xl font-bold text-slate-900">{editingEvent ? 'Editar evento' : 'Añadir nuevo evento'}</h3>
                                <p className="text-sm text-slate-500 mt-0.5">{editingEvent ? 'Modifica la información del evento.' : 'Ingresa los datos del nuevo evento.'}</p>
                            </div>
                            <button onClick={closeModal} className="p-2 rounded-full hover:bg-slate-100 text-slate-500 transition-colors">
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            {/* Name */}
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    Nombre del Evento *
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="block w-full rounded-xl border border-slate-300 px-4 py-2.5 focus:border-skin-accent focus:outline-none focus:ring-1 focus:ring-skin-accent shadow-sm"
                                    placeholder="Ej. Feria de Verano, Evento Corporativo..."
                                />
                            </div>

                            {/* Address */}
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-1.5">
                                    <MapPin size={14} className="text-slate-400" />
                                    Dirección
                                </label>
                                <input
                                    type="text"
                                    value={formData.address}
                                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                    className="block w-full rounded-xl border border-slate-300 px-4 py-2.5 focus:border-skin-accent focus:outline-none focus:ring-1 focus:ring-skin-accent shadow-sm"
                                    placeholder="Ej. Centro de Convenciones"
                                />
                            </div>

                            {/* Phone */}
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-1.5">
                                    <Phone size={14} className="text-slate-400" />
                                    Teléfono
                                </label>
                                <input
                                    type="tel"
                                    value={formData.phone}
                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                    className="block w-full rounded-xl border border-slate-300 px-4 py-2.5 focus:border-skin-accent focus:outline-none focus:ring-1 focus:ring-skin-accent shadow-sm"
                                    placeholder="Ej. 2234-5678"
                                />
                            </div>

                            {/* Schedule */}
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-1.5">
                                    <Clock size={14} className="text-slate-400" />
                                    Horario / Fecha
                                </label>
                                <input
                                    type="text"
                                    value={formData.schedule}
                                    onChange={(e) => setFormData({ ...formData, schedule: e.target.value })}
                                    className="block w-full rounded-xl border border-slate-300 px-4 py-2.5 focus:border-skin-accent focus:outline-none focus:ring-1 focus:ring-skin-accent shadow-sm"
                                    placeholder="Ej. 15 de Noviembre, 9:00am a 6:00pm"
                                />
                            </div>

                            {/* Actions: Guardar + Cancelar */}
                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={closeModal}
                                    className="flex-1 px-4 py-2.5 border border-slate-300 text-slate-700 rounded-xl font-medium hover:bg-slate-50 transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="flex-1 px-4 py-2.5 bg-skin-accent text-white rounded-xl font-medium hover:bg-pink-700 flex justify-center items-center shadow-md shadow-skin-accent/30 transition-all disabled:opacity-70"
                                >
                                    {saving ? <Loader2 className="animate-spin" size={20} /> : (editingEvent ? 'Guardar Cambios' : 'Guardar Evento')}
                                </button>
                            </div>

                            {/* Desactivar / Reactivar — solo al editar */}
                            {editingEvent && (
                                <div className="pt-2 border-t border-slate-100">
                                    <button
                                        type="button"
                                        onClick={handleToggleActive}
                                        disabled={toggling}
                                        className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm transition-all disabled:opacity-60 ${
                                            editingEvent.is_active
                                                ? 'border border-red-200 text-red-600 hover:bg-red-50'
                                                : 'border border-emerald-200 text-emerald-600 hover:bg-emerald-50'
                                        }`}
                                    >
                                        {toggling ? (
                                            <Loader2 className="animate-spin" size={16} />
                                        ) : editingEvent.is_active ? (
                                            <><PowerOff size={16} />Desactivar evento</>
                                        ) : (
                                            <><Power size={16} />Reactivar evento</>
                                        )}
                                    </button>
                                    <p className="text-xs text-slate-400 text-center mt-2">
                                        {editingEvent.is_active
                                            ? 'El evento no se eliminará, solo quedará inactivo.'
                                            : 'El evento volverá a aparecer como activo.'}
                                    </p>
                                </div>
                            )}
                        </form>
                    </div>
                </div>
            )}

            {/* Modal de confirmación para activar/desactivar */}
            <ConfirmModal
                isOpen={confirmOpen}
                title={editingEvent?.is_active ? 'Desactivar evento' : 'Reactivar evento'}
                message={
                    editingEvent?.is_active
                        ? `¿Deseas desactivar el evento "${editingEvent?.name}"? No se eliminará, solo dejará de aparecer como activo.`
                        : `¿Deseas reactivar el evento "${editingEvent?.name}"? Volverá a aparecer como activo.`
                }
                confirmLabel={editingEvent?.is_active ? 'Sí, desactivar' : 'Sí, reactivar'}
                variant={editingEvent?.is_active ? 'danger' : 'default'}
                onConfirm={doToggleActive}
                onCancel={() => setConfirmOpen(false)}
            />

            {/* Modal de alerta de error */}
            <AlertModal
                isOpen={alertOpen}
                message={alertMessage}
                onClose={() => setAlertOpen(false)}
            />
        </div>
    );
};
