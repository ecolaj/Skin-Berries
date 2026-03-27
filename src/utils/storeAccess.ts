import type { Database } from '../types/supabase';

type StoreType = Database['public']['Tables']['stores']['Row'];
type Profile = Database['public']['Tables']['profiles']['Row'];

/**
 * Filtra el arreglo completo de ubicaciones para devolver solo las que tiene asignadas el usuario,
 * evaluando las etiquetas especiales 'ALL_STORES' y 'ALL_EVENTS'.
 */
export const getAllowedStores = (stores: StoreType[], profile: Profile | null): StoreType[] => {
    if (!profile) return [];

    const role = profile.role || '';
    const assignedStores = profile.assigned_stores || [];

    // Master y Admin siempre tienen acceso a todo (ver en UI como "Sin Restricción")
    if (role === 'master' || role === 'admin') {
        return stores;
    }

    // Identificamos las etiquetas especiales de selección masiva
    const hasAllStores = assignedStores.includes('ALL_STORES');
    const hasAllEvents = assignedStores.includes('ALL_EVENTS');

    // Filtramos
    return stores.filter(s => {
        // En base a su tipo
        if (s.type === 'store' && hasAllStores) return true;
        if (s.type === 'event' && hasAllEvents) return true;
        
        // Asignaciones directas
        return assignedStores.includes(s.id);
    });
};
