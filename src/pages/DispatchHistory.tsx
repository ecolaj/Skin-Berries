import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import type { Database } from '../types/supabase';
import { Store, Calendar, FileText, Loader2, Printer, X } from 'lucide-react';
import { AlertModal } from '../components/AlertModal';
import { ConfirmModal } from '../components/ConfirmModal';
import { ReasonModal } from '../components/ReasonModal';

type DispatchOrder = Omit<Database['public']['Tables']['dispatch_orders']['Row'], 'status'> & {
    status: 'pendiente' | 'despachado' | 'recibido' | 'anulada';
    stores: { name: string, id: string } | null;
    profiles: { full_name: string | null } | null;
};
type DispatchItem = Database['public']['Tables']['dispatch_order_items']['Row'] & {
    products: { name: string, sku: string, image_url: string | null } | null;
};
type StoreType = Database['public']['Tables']['stores']['Row'];

export const DispatchHistory = () => {
    const [orders, setOrders] = useState<DispatchOrder[]>([]);
    const [stores, setStores] = useState<StoreType[]>([]);
    const [loading, setLoading] = useState(true);

    // Auth & Permissions
    const { profile } = useAuth();
    const assignedStoreId = profile?.store_id;
    
    // Filters
    const [selectedStore, setSelectedStore] = useState<string>('all');
    const [selectedMonth, setSelectedMonth] = useState<number | 'all'>(new Date().getMonth());
    const [selectedYear, setSelectedYear] = useState<number | 'all'>(new Date().getFullYear());
    
    const months = [
        'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
        'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];
    const years = [2024, 2025, 2026];
    
    // Preview Modal
    const [previewOrder, setPreviewOrder] = useState<DispatchOrder | null>(null);
    const [previewItems, setPreviewItems] = useState<DispatchItem[]>([]);
    const [loadingPreview, setLoadingPreview] = useState(false);

    // Alerts
    const [alertOpen, setAlertOpen] = useState(false);
    const [alertMessage, setAlertMessage] = useState('');
    const [confirmModal, setConfirmModal] = useState<{ open: boolean, orderId: string | null }>({
        open: false,
        orderId: null
    });
    const [reasonModal, setReasonModal] = useState<{ open: boolean, orderId: string | null }>({
        open: false,
        orderId: null
    });

    const showAlert = (msg: string) => { setAlertMessage(msg); setAlertOpen(true); };

    useEffect(() => {
        fetchStores();
        fetchOrders();
    }, []);

    const fetchStores = async () => {
        let query = supabase.from('stores').select('*').eq('type', 'store').eq('is_active', true);
        if (assignedStoreId) {
            query = query.eq('id', assignedStoreId);
        }
        const { data } = await query.order('name');
        if (data) setStores(data);
    };

    const fetchOrders = async () => {
        setLoading(true);
        let query = supabase
            .from('dispatch_orders')
            .select(`
                *,
                stores ( id, name ),
                profiles ( full_name )
            `);

        if (assignedStoreId) {
            query = query.eq('store_id', assignedStoreId);
        }

        const { data, error } = await query.order('created_at', { ascending: false });

        if (error) {
            showAlert('Error al cargar historial: ' + error.message);
        } else if (data) {
            // Fix nested type casting
            setOrders(data as unknown as DispatchOrder[]);
        }
        setLoading(false);
    };

    const handleOpenPreview = async (order: DispatchOrder) => {
        setPreviewOrder(order);
        setLoadingPreview(true);
        const { data, error } = await supabase
            .from('dispatch_order_items')
            .select(`
                *,
                products ( name, sku, image_url )
            `)
            .eq('order_id', order.id);

        if (error) {
            showAlert('Error al cargar items: ' + error.message);
        } else if (data) {
            setPreviewItems(data as unknown as DispatchItem[]);
        }
        setLoadingPreview(false);
    };

    const handleUpdateStatus = async (orderId: string, newStatus: string, reason?: string) => {
        setLoading(true);
        const updateData: any = { status: newStatus };
        
        if (newStatus === 'despachado') updateData.dispatched_at = new Date().toISOString();
        if (newStatus === 'recibido') updateData.received_at = new Date().toISOString();
        if (newStatus === 'anulada' && reason) updateData.notes = reason;

        const { error } = await supabase
            .from('dispatch_orders')
            .update(updateData)
            .eq('id', orderId);

        if (error) {
            showAlert('Error al actualizar estado: ' + error.message);
        } else {
            // Actualizar localmente
            setOrders(prev => prev.map(o => o.id === orderId ? { ...o, ...updateData } : o));
        }
        setLoading(false);
    };

    const handlePrint = () => {
        window.print();
    };

    const filteredOrders = orders.filter(o => {
        const matchesStore = selectedStore === 'all' || o.store_id === selectedStore;
        
        if (selectedMonth === 'all' && selectedYear === 'all') return matchesStore;
        
        const date = new Date(o.created_at);
        const matchesMonth = selectedMonth === 'all' || date.getMonth() === selectedMonth;
        const matchesYear = selectedYear === 'all' || date.getFullYear() === selectedYear;
        
        return matchesStore && matchesMonth && matchesYear;
    });

    return (
        <div className="flex flex-col h-[calc(100vh-4rem)] space-y-6 print:h-auto print:space-y-0 print:block">
            <div className="shrink-0 space-y-6 print:hidden">
                {/* ===== HEADER ===== */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Historial de Despachos</h1>
                        <p className="text-slate-500 mt-1">Consulta y descarga órdenes de despacho registradas.</p>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 bg-white border border-slate-200 rounded-2xl p-2 shadow-sm">
                        <div className="flex items-center gap-2 px-3 py-1 border-r border-slate-100">
                            <Store size={16} className="text-slate-400" />
                            <select
                                value={selectedStore}
                                onChange={(e) => setSelectedStore(e.target.value)}
                                className="bg-transparent outline-none text-slate-800 font-bold text-sm cursor-pointer"
                            >
                                <option value="all">Todas las tiendas</option>
                                {stores.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                            </select>
                        </div>
                        
                        <div className="flex items-center gap-2 px-3 py-1 border-r border-slate-100">
                            <Calendar size={16} className="text-slate-400" />
                            <select
                                value={selectedMonth}
                                onChange={(e) => setSelectedMonth(e.target.value === 'all' ? 'all' : parseInt(e.target.value))}
                                className="bg-transparent outline-none text-slate-800 font-bold text-sm cursor-pointer"
                            >
                                <option value="all">Todos los meses</option>
                                {months.map((m, i) => <option key={m} value={i}>{m}</option>)}
                            </select>
                        </div>

                        <div className="flex items-center gap-2 px-3 py-1">
                            <select
                                value={selectedYear}
                                onChange={(e) => setSelectedYear(e.target.value === 'all' ? 'all' : parseInt(e.target.value))}
                                className="bg-transparent outline-none text-slate-800 font-bold text-sm cursor-pointer"
                            >
                                <option value="all">Ver Todo (Años)</option>
                                {years.map(y => <option key={y} value={y}>{y}</option>)}
                            </select>
                        </div>
                    </div>
                </div>
            </div>

            {/* TABLA CON SCROLL INTERNO */}
            <div className="flex-1 flex flex-col min-h-0 bg-skin-card rounded-2xl shadow-sm border border-slate-100 print:hidden">
                <div className="p-4 border-b border-slate-100 bg-slate-50/60 rounded-t-2xl flex items-center justify-between">
                    <h2 className="font-semibold text-slate-800">
                        Órdenes Encontradas: {filteredOrders.length}
                    </h2>
                </div>
                
                <div className="flex-1 overflow-y-auto rounded-b-2xl">
                    <table className="w-full text-left text-sm text-slate-600 relative">
                        <thead className="text-xs uppercase bg-slate-50 text-slate-500 font-semibold border-b border-slate-100 sticky top-0 z-10 shadow-sm">
                            <tr>
                                <th className="px-6 py-4">ID Orden</th>
                                <th className="px-6 py-4">Fecha de Generación</th>
                                <th className="px-6 py-4">Destino (Tienda)</th>
                                <th className="px-6 py-4">Estado</th>
                                <th className="px-6 py-4 text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-10 text-center text-slate-400">
                                        <Loader2 className="animate-spin inline-block mb-2" size={24} />
                                        <p>Cargando historial...</p>
                                    </td>
                                </tr>
                            ) : filteredOrders.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-10 text-center text-slate-400">
                                        {selectedStore === 'all' ? 'No hay órdenes generadas aún.' : 'No hay órdenes para esta tienda.'}
                                    </td>
                                </tr>
                            ) : filteredOrders.map((order) => (
                                <tr key={order.id} className="hover:bg-slate-50/50 transition-colors">
                                    <td className="px-6 py-4 font-mono font-medium text-slate-900 border-l-[3px] border-transparent hover:border-skin-accent">
                                        #{order.id.split('-')[0].toUpperCase()}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            <Calendar size={14} className="text-slate-400" />
                                            <span>{new Date(order.created_at).toLocaleDateString('es-GT', { year: 'numeric', month: 'short', day: 'numeric' })}</span>
                                            <span className="text-slate-400 text-xs">{new Date(order.created_at).toLocaleTimeString('es-GT', { hour: '2-digit', minute: '2-digit' })}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2 font-medium text-slate-800">
                                            <Store size={14} className="text-skin-accent" />
                                            {order.stores?.name || 'Tienda Desconocida'}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center justify-start gap-1">
                                            {/* PENDIENTE - Hito inicial */}
                                            <div className={`px-2 py-1 rounded-lg text-[10px] font-bold border transition-all truncate ${
                                                order.status === 'pendiente' 
                                                ? 'bg-amber-50 border-amber-200 text-amber-600 shadow-sm' 
                                                : 'bg-slate-50 border-slate-100 text-slate-400 opacity-40'
                                            }`}>
                                                PEND.
                                            </div>
                                            
                                            <div className="w-1.5 h-px bg-slate-200 shrink-0"></div>

                                            {/* DESPACHADO */}
                                            <button 
                                                disabled={order.status !== 'pendiente'}
                                                onClick={() => handleUpdateStatus(order.id, 'despachado')}
                                                className={`px-2 py-1 rounded-lg text-[10px] font-bold border transition-all truncate ${
                                                    order.status === 'despachado' 
                                                    ? 'bg-blue-50 border-blue-200 text-blue-600 shadow-sm' 
                                                    : order.status === 'recibido'
                                                    ? 'bg-slate-50 border-slate-100 text-slate-400 opacity-40'
                                                    : order.status === 'pendiente'
                                                    ? 'bg-white border-slate-200 text-slate-400 hover:border-blue-400 hover:text-blue-500 cursor-pointer'
                                                    : 'bg-slate-50 border-slate-100 text-slate-200 cursor-not-allowed'
                                                }`}
                                            >
                                                DESP.
                                            </button>

                                            <div className="w-1.5 h-px bg-slate-200 shrink-0"></div>

                                            {/* RECIBIDO */}
                                            <button 
                                                disabled={order.status !== 'despachado'}
                                                onClick={() => handleUpdateStatus(order.id, 'recibido')}
                                                className={`px-2 py-1 rounded-lg text-[10px] font-bold border transition-all truncate ${
                                                    order.status === 'recibido' 
                                                    ? 'bg-green-50 border-green-200 text-green-600 shadow-sm' 
                                                    : order.status === 'despachado'
                                                    ? 'bg-white border-slate-200 text-slate-400 hover:border-green-400 hover:text-green-500 cursor-pointer'
                                                    : 'bg-slate-50 border-slate-100 text-slate-200 cursor-not-allowed opacity-40'
                                                }`}
                                            >
                                                RECIB.
                                            </button>

                                            {/* ANULAR - Solo si no se ha avanzado más allá de pendiente */}
                                            {(order.status === 'pendiente' || order.status === 'anulada') && (
                                                <>
                                                    <div className="w-1.5 h-px bg-slate-200 shrink-0"></div>
                                                    <button 
                                                        disabled={order.status === 'anulada'}
                                                        onClick={() => setReasonModal({ open: true, orderId: order.id })}
                                                        className={`px-2 py-1 rounded-lg text-[10px] font-bold border transition-all truncate ${
                                                            order.status === 'anulada' 
                                                            ? 'bg-slate-100 border-slate-200 text-slate-400' 
                                                            : 'bg-white border-slate-200 text-slate-400 hover:border-rose-400 hover:text-rose-500 cursor-pointer'
                                                        }`}
                                                    >
                                                        ANUL.
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <button
                                                onClick={() => handleOpenPreview(order)}
                                                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors
                                                    ${order.status === 'anulada' 
                                                        ? 'bg-slate-100 text-slate-500 hover:bg-slate-200' 
                                                        : 'bg-skin-blush text-skin-accent hover:bg-pink-100'}`}
                                            >
                                                <FileText size={16} />
                                                Ver Formato
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* PREVIEW MODAL */}
            {previewOrder && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 md:p-8 print:static print:inset-auto print:bg-transparent print:p-0 print:backdrop-blur-none print:flex-none print:block">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-full flex flex-col overflow-hidden animate-fadeInScale print:shadow-none print:rounded-none print:max-w-none print:max-h-none print:overflow-visible print:block">
                        {/* Modal Header */}
                        <div className="shrink-0 p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50 print:hidden">
                            <div>
                                <h3 className="text-lg font-bold text-slate-800">Formato de Despacho</h3>
                                <p className="text-xs text-slate-500">Vista previa lista para generar PDF / Imprimir.</p>
                            </div>
                            <div className="flex items-center gap-3">
                                <button 
                                    onClick={handlePrint}
                                    className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 rounded-xl font-medium shadow-md transition-all"
                                >
                                    <Printer size={16} />
                                    Descargar / Imprimir
                                </button>
                                <button 
                                    onClick={() => { setPreviewOrder(null); setPreviewItems([]); }}
                                    className="p-2 rounded-full hover:bg-slate-200 text-slate-500 transition-colors"
                                >
                                    <X size={20} />
                                </button>
                            </div>
                        </div>

                        {/* Modal Body / Printable Area (Scrollable in UI, full height in print) */}
                        <div className="flex-1 overflow-y-auto p-8 bg-slate-200/50 print:overflow-visible print:p-0 print:bg-white print:block">
                            {/* Paper Canvas */}
                            <div className="bg-white shadow-sm ring-1 ring-slate-200 mx-auto w-full max-w-[210mm] min-h-[297mm] p-10 relative print:shadow-none print:ring-0 print:p-0 print:max-w-none print:w-auto" id="printable-area">
                                {loadingPreview ? (
                                    <div className="h-full flex flex-col items-center justify-center text-slate-400">
                                        <Loader2 className="animate-spin mb-4" size={32} />
                                        <p>Generando formato oficial...</p>
                                    </div>
                                ) : (
                                    <div className="flex flex-col h-full">
                                        
                                        {/* DOCUMENT HEADER */}
                                        <div className="flex justify-between items-start border-b-2 border-slate-800 pb-6 mb-8">
                                            <div className="flex items-center gap-4">
                                                <img src="/logo.png" alt="Skin & Berries" className="w-16 h-auto grayscale-[50%]" />
                                                <div>
                                                    <h2 className="text-2xl font-black text-slate-900 tracking-tight uppercase">Orden de Despacho</h2>
                                                    <p className="text-sm font-medium text-slate-500">Bodega Central — Transporte e Inventario</p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-1">Nº Documento</p>
                                                <p className="text-xl font-mono font-black text-rose-600">
                                                    #{previewOrder.id.split('-')[0].toUpperCase()}
                                                </p>
                                                {previewOrder.status === 'anulada' && (
                                                    <div className="bg-red-600 text-white px-2 py-0.5 rounded text-[10px] font-bold mt-1 uppercase text-center">ANULADA</div>
                                                )}
                                            </div>
                                        </div>

                                        {/* ANULATION REASON (Only if cancelled) */}
                                        {previewOrder.status === 'anulada' && previewOrder.notes && (
                                            <div className="mb-6 bg-red-50 border-2 border-red-200 p-4 rounded-xl flex items-start gap-3">
                                                <div className="w-8 h-8 rounded-lg bg-red-100 text-red-600 flex items-center justify-center shrink-0">
                                                    <X size={16} />
                                                </div>
                                                <div>
                                                    <p className="text-[10px] font-black text-red-700 uppercase tracking-widest">Motivo de Anulación</p>
                                                    <p className="text-sm text-red-800 font-medium italic">"{previewOrder.notes}"</p>
                                                </div>
                                            </div>
                                        )}

                                        {/* DOCUMENT META DATA */}
                                        <div className="grid grid-cols-2 gap-8 mb-8 pb-8 border-b border-slate-200">
                                            <div>
                                                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Fecha y Hora de Generación</p>
                                                <p className="font-medium text-slate-800">
                                                    {new Date(previewOrder.created_at).toLocaleDateString('es-GT', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                                                </p>
                                                <p className="text-slate-600 text-sm">
                                                    {new Date(previewOrder.created_at).toLocaleTimeString('es-GT', { hour: '2-digit', minute: '2-digit' })} horas
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Destino Oficial</p>
                                                <p className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                                    <Store size={18} className="text-slate-400" />
                                                    {previewOrder.stores?.name}
                                                </p>
                                                <p className="text-slate-500 text-sm mt-0.5">Autorizado para transporte seguro.</p>
                                            </div>
                                        </div>

                                        {/* ITEMS TABLE */}
                                        <div className="flex-1">
                                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Detalle de Mercadería</p>
                                            <table className="w-full text-left text-sm text-slate-800 mb-8 border border-slate-300">
                                                <thead className="bg-slate-100 text-slate-600 font-bold uppercase text-xs">
                                                    <tr>
                                                        <th className="px-4 py-3 border-b border-slate-300 w-16 text-center">No.</th>
                                                        <th className="px-4 py-3 border-b border-slate-300">Descripción del Producto</th>
                                                        <th className="px-4 py-3 border-b border-slate-300 font-mono">CÓDIGO / SKU</th>
                                                        <th className="px-4 py-3 border-b border-slate-300 text-center w-32 border-l border-slate-300 bg-slate-200">CANTIDAD</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-dashed divide-slate-300">
                                                    {previewItems.map((item, index) => (
                                                        <tr key={item.id}>
                                                            <td className="px-4 py-3 text-center font-mono text-xs text-slate-400">{(index + 1).toString().padStart(2, '0')}</td>
                                                            <td className="px-4 py-3 font-medium">{item.products?.name}</td>
                                                            <td className="px-4 py-3 font-mono text-xs">{item.products?.sku}</td>
                                                            <td className="px-4 py-3 text-center font-bold text-lg border-l border-slate-300 bg-slate-50/50">
                                                                {item.dispatch_qty}
                                                            </td>
                                                        </tr>
                                                    ))}
                                                    {previewItems.length === 0 && (
                                                        <tr><td colSpan={4} className="p-8 text-center text-slate-400 italic">No hay productos en esta orden.</td></tr>
                                                    )}
                                                </tbody>
                                                <tfoot className="border-t-2 border-slate-800 bg-slate-50">
                                                    <tr>
                                                        <td colSpan={3} className="px-4 py-3 text-right font-bold uppercase text-xs">Total de Unidades a Despachar:</td>
                                                        <td className="px-4 py-3 text-center font-black text-xl border-l border-slate-300">
                                                            {previewItems.reduce((acc, curr) => acc + curr.dispatch_qty, 0)}
                                                        </td>
                                                    </tr>
                                                </tfoot>
                                            </table>
                                        </div>

                                        {/* SIGNATURES */}
                                        <div className="mt-16 pt-8 grid grid-cols-3 gap-8 text-center px-4">
                                            <div>
                                                <div className="border-b border-slate-800 mb-2 pb-8"></div>
                                                <p className="text-xs font-bold text-slate-800 uppercase">Generado Por</p>
                                                <p className="text-[10px] text-slate-800 mt-1 font-bold italic">
                                                    {previewOrder.profiles?.full_name || 'Bodega / Operador'}
                                                </p>
                                            </div>
                                            <div>
                                                <div className="border-b border-slate-800 mb-2 pb-8"></div>
                                                <p className="text-xs font-bold text-slate-800 uppercase">Autorizado Por</p>
                                                <p className="text-[10px] text-slate-500 mt-1">Gerencia / Supervisor</p>
                                            </div>
                                            <div>
                                                <div className="border-b border-slate-800 mb-2 pb-8"></div>
                                                <p className="text-xs font-bold text-slate-800 uppercase">Recibido Conforme</p>
                                                <p className="text-[10px] text-slate-500 mt-1">Encargado de Tienda</p>
                                            </div>
                                        </div>

                                        {/* FOOTER */}
                                        <div className="mt-12 text-center text-[10px] text-slate-400 italic">
                                            Documento generado automáticamente por el sistema Skin & Berries HQ. Para uso interno exclusivo. <br/>
                                            El receptor certifica la recepción íntegra de los artículos listados en este comprobante.
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <div className="print:hidden">
                <AlertModal isOpen={alertOpen} message={alertMessage} onClose={() => setAlertOpen(false)} />
                <ConfirmModal 
                    isOpen={confirmModal.open}
                    title="¿Proceder con la acción?"
                    message="Confirma si deseas continuar con este cambio de estado."
                    confirmLabel="Confirmar"
                    onConfirm={() => {
                        // generic keep if needed, but we used reasonModal for cancellation
                        setConfirmModal({ open: false, orderId: null });
                    }}
                    onCancel={() => setConfirmModal({ open: false, orderId: null })}
                />
                <ReasonModal
                    isOpen={reasonModal.open}
                    title="Anular Orden de Despacho"
                    message="Para anular esta orden, es obligatorio ingresar el motivo."
                    placeholder="Ej: Error en cantidades, tienda equivocada, etc..."
                    confirmLabel="Anular Permanentemente"
                    onConfirm={(reason) => {
                        if (reasonModal.orderId) handleUpdateStatus(reasonModal.orderId, 'anulada', reason);
                        setReasonModal({ open: false, orderId: null });
                    }}
                    onCancel={() => setReasonModal({ open: false, orderId: null })}
                />
            </div>
        </div>
    );
};
