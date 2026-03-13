import { useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import type { Database } from '../types/supabase';
import {
    Calculator, PackageCheck, Store, AlertTriangle,
    ImageIcon, Save, ChevronDown, CheckCheck, Loader2, FileDown, Upload
} from 'lucide-react';
import { AlertModal } from '../components/AlertModal';

type StoreRow = Database['public']['Tables']['stores']['Row'];
type ProductRow = Database['public']['Tables']['products']['Row'];

interface InventoryRow {
    product: ProductRow;
    base_stock: number;
    current_stock: number;
    dispatch_qty: number;  // base_stock - current_stock (positive only)
}

export const RestockTool = () => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [stores, setStores] = useState<StoreRow[]>([]);
    const [selectedStoreId, setSelectedStoreId] = useState<string>('');
    const [allProducts, setAllProducts] = useState<ProductRow[]>([]);
    const [rows, setRows] = useState<InventoryRow[]>([]);
    const [loading, setLoading] = useState(false);
    const [savingInventory, setSavingInventory] = useState(false);
    const [generatingOrder, setGeneratingOrder] = useState(false);
    const [calculated, setCalculated] = useState(false);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    
    // Auth Role
    const { user } = useAuth();
    const [userRole, setUserRole] = useState<string | null>(null);

    useEffect(() => {
        if (user) {
            supabase.from('profiles').select('role').eq('id', user.id).single()
                .then(({ data }) => setUserRole(data?.role || null));
        }
    }, [user]);

    const isConsulta = userRole === 'consulta';

    // Modal de alerta
    const [alertOpen, setAlertOpen] = useState(false);
    const [alertMessage, setAlertMessage] = useState('');

    const showAlert = (msg: string) => { setAlertMessage(msg); setAlertOpen(true); };

    // Load stores on mount
    useEffect(() => {
        supabase.from('stores').select('*').eq('type', 'store').eq('is_active', true).order('name').then(({ data }) => {
            if (data) {
                setStores(data);
                if (data.length > 0) setSelectedStoreId(data[0].id);
            }
        });
        supabase.from('products').select('*').eq('is_active', true).order('name').then(({ data }) => {
            if (data) setAllProducts(data);
        });
    }, []);

    // Load inventory for selected store
    const loadInventory = useCallback(async () => {
        if (!selectedStoreId || allProducts.length === 0) return;
        setLoading(true);
        setCalculated(false);

        const { data: inventoryData } = await supabase
            .from('store_inventory')
            .select('*')
            .eq('store_id', selectedStoreId);

        const inventoryMap = new Map(inventoryData?.map(i => [i.product_id, i]) ?? []);

        const merged: InventoryRow[] = allProducts.map(product => {
            const inv = inventoryMap.get(product.id);
            const base = inv?.base_stock ?? 0;
            const current = inv?.current_stock ?? 0;
            return {
                product,
                base_stock: base,
                current_stock: current,
                dispatch_qty: Math.max(0, base - current),
            };
        });

        setRows(merged);
        setLoading(false);
    }, [selectedStoreId, allProducts]);

    useEffect(() => { loadInventory(); }, [loadInventory]);

    const updateRow = (productId: string, field: 'base_stock' | 'current_stock', value: number) => {
        setRows(prev => prev.map(r => {
            if (r.product.id !== productId) return r;
            const updated = { ...r, [field]: value };
            updated.dispatch_qty = Math.max(0, updated.base_stock - updated.current_stock);
            return updated;
        }));
        setCalculated(false);
    };

    const handleSaveInventory = async () => {
        if (!selectedStoreId) return;
        setSavingInventory(true);

        const upserts = rows.map(r => ({
            store_id: selectedStoreId,
            product_id: r.product.id,
            base_stock: r.base_stock,
            current_stock: r.current_stock,
            last_counted_at: new Date().toISOString(),
        }));

        const { error } = await supabase.from('store_inventory').upsert(upserts, {
            onConflict: 'store_id,product_id'
        });

        setSavingInventory(false);
        if (!error) {
            setSuccessMessage('Inventario guardado correctamente.');
            setTimeout(() => setSuccessMessage(null), 3000);
        } else {
            showAlert('Error al guardar inventario: ' + error.message);
        }
    };

    const handleCalculate = () => setCalculated(true);

    const handleBulkUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            const content = e.target?.result as string;
            if (!content) return;

            const lines = content.split('\n');
            let updatedCount = 0;
            const newRows = [...rows];

            lines.forEach(line => {
                // Detectar delimitador (punto y coma o coma)
                const delimiter = line.includes(';') ? ';' : ',';
                const parts = line.split(delimiter);
                if (parts.length < 2) return;

                const code = parts[0].trim();
                const qtyStr = parts[1].trim();
                
                if (!code || isNaN(parseInt(qtyStr))) return;

                const qty = parseInt(qtyStr);
                // Buscar específicamente por código de barras
                const rowIndex = newRows.findIndex(r => r.product.barcode === code);

                if (rowIndex !== -1) {
                    newRows[rowIndex] = {
                        ...newRows[rowIndex],
                        current_stock: qty,
                        dispatch_qty: Math.max(0, newRows[rowIndex].base_stock - qty)
                    };
                    updatedCount++;
                }
            });

            setRows(newRows);
            setCalculated(false);
            if (updatedCount > 0) {
                setSuccessMessage(`✅ Se actualizaron ${updatedCount} productos desde el archivo.`);
                setTimeout(() => setSuccessMessage(null), 5000);
            } else {
                showAlert('No se encontraron coincidencias. Asegúrate de que los Códigos de Barras en el archivo coincijan con el catálogo y que el formato sea: código;cantidad o código,cantidad');
            }
            if (fileInputRef.current) fileInputRef.current.value = '';
        };
        reader.readAsText(file);
    };

    const dispatchRows = rows.filter(r => r.dispatch_qty > 0);
    const displayedRows = calculated ? dispatchRows : rows;

    const handleGenerateOrder = async () => {
        if (!selectedStoreId || dispatchRows.length === 0) return;
        setGeneratingOrder(true);

        const { data: orderData, error: orderError } = await supabase
            .from('dispatch_orders')
            .insert([{ store_id: selectedStoreId, status: 'pendiente' }])
            .select()
            .single();

        if (orderError || !orderData) {
            showAlert('Error al crear orden: ' + orderError?.message);
            setGeneratingOrder(false);
            return;
        }

        const items = dispatchRows.map(r => ({
            order_id: orderData.id,
            product_id: r.product.id,
            base_stock: r.base_stock,
            current_stock: r.current_stock,
            dispatch_qty: r.dispatch_qty,
        }));

        const { error: itemsError } = await supabase.from('dispatch_order_items').insert(items);
        setGeneratingOrder(false);

        if (itemsError) {
            showAlert('Error al guardar items: ' + itemsError.message);
        } else {
            setSuccessMessage(`✅ Orden de despacho #${orderData.id.substring(0, 8).toUpperCase()} creada exitosamente.`);
            setTimeout(() => setSuccessMessage(null), 5000);
        }
    };

    const totalDispatch = dispatchRows.reduce((acc, r) => acc + r.dispatch_qty, 0);

    return (
        <div className="flex flex-col h-[calc(100vh-4rem)] space-y-6">
            <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleBulkUpload} 
                className="hidden" 
                accept=".csv" 
            />
            <div className="shrink-0 space-y-6">
                {/* ===== HEADER FIJO ===== */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Despachos e Inventario</h1>
                        <p className="text-slate-500 mt-1">Registra el inventario real por tienda y genera órdenes de despacho.</p>
                    </div>

                    {/* Store selector */}
                    <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-4 py-2.5 shadow-sm">
                        <Store size={18} className="text-slate-400" />
                        <div className="relative flex items-center gap-1">
                            <select
                                value={selectedStoreId}
                                onChange={(e) => { setSelectedStoreId(e.target.value); setCalculated(false); }}
                                className="bg-transparent outline-none text-slate-800 font-medium pr-6 appearance-none cursor-pointer"
                            >
                                {stores.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                            </select>
                            <ChevronDown size={14} className="text-slate-400 pointer-events-none absolute right-0" />
                        </div>
                    </div>
                </div>

            {/* Success Banner */}
            {successMessage && (
                <div className="bg-green-50 border border-green-200 text-green-700 rounded-xl px-5 py-3 flex items-center gap-2 font-medium">
                    <CheckCheck size={18} />
                    {successMessage}
                </div>
            )}

            {/* Summary Cards */}
            {calculated && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-skin-card border border-red-100 rounded-2xl p-5 flex items-center gap-4">
                        <div className="w-11 h-11 rounded-xl bg-red-50 text-red-500 flex items-center justify-center flex-shrink-0">
                            <AlertTriangle size={22} />
                        </div>
                        <div>
                            <p className="text-sm text-slate-500">Productos a Despachar</p>
                            <p className="text-2xl font-bold text-slate-900">{dispatchRows.length}</p>
                        </div>
                    </div>
                    <div className="bg-skin-card border border-skin-rose/20 rounded-2xl p-5 flex items-center gap-4">
                        <div className="w-11 h-11 rounded-xl bg-skin-blush text-skin-accent flex items-center justify-center flex-shrink-0">
                            <PackageCheck size={22} />
                        </div>
                        <div>
                            <p className="text-sm text-slate-500">Unidades Totales</p>
                            <p className="text-2xl font-bold text-slate-900">{totalDispatch}</p>
                        </div>
                    </div>
                    <button
                        onClick={handleGenerateOrder}
                        disabled={generatingOrder || dispatchRows.length === 0 || isConsulta}
                        className="bg-slate-900 hover:bg-slate-800 text-white rounded-2xl p-5 flex items-center justify-center gap-3 font-semibold shadow-md transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                        {generatingOrder ? <Loader2 className="animate-spin" size={20} /> : <FileDown size={20} />}
                        {isConsulta ? 'Solo Consulta' : 'Generar Orden de Despacho'}
                    </button>
                </div>
            )}
            </div>

            {/* TABLA CON SCROLL INTERNO */}
            <div className="flex-1 flex flex-col min-h-0 bg-skin-card rounded-2xl shadow-sm border border-slate-100">
                {/* Table Toolbar */}
                <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/60 rounded-t-2xl">
                    <div>
                        <h2 className="font-semibold text-slate-800">
                            {calculated
                                ? `Resultado: ${dispatchRows.length} producto(s) requieren despacho`
                                : `Inventario actual — ${rows.length} productos`}
                        </h2>
                        {!calculated && (
                            <p className="text-xs text-slate-400 mt-0.5">Ingresa el conteo real o sube un archivo CSV.</p>
                        )}
                    </div>
                    <div className="flex items-center gap-2">
                        {calculated && (
                            <button
                                onClick={() => setCalculated(false)}
                                className="px-3 py-1.5 text-sm text-slate-600 border border-slate-200 rounded-lg hover:bg-white transition-all"
                            >
                                Ver todo
                            </button>
                        )}
                        {!isConsulta && (
                            <>
                                <button
                                    onClick={() => fileInputRef.current?.click()}
                                    className="flex items-center gap-1.5 px-4 py-1.5 text-sm border border-slate-300 text-slate-700 rounded-lg hover:bg-white font-medium transition-all"
                                >
                                    <Upload size={15} />
                                    Carga Masiva
                                </button>
                                <button
                                    onClick={handleSaveInventory}
                                    disabled={savingInventory}
                                    className="flex items-center gap-1.5 px-4 py-1.5 text-sm border border-slate-300 text-slate-700 rounded-lg hover:bg-white font-medium transition-all disabled:opacity-60"
                                >
                                    {savingInventory ? <Loader2 className="animate-spin" size={15} /> : <Save size={15} />}
                                    Guardar Inventario
                                </button>
                                <button
                                    onClick={handleCalculate}
                                    className="flex items-center gap-1.5 px-4 py-1.5 text-sm bg-skin-accent hover:bg-pink-700 text-white rounded-lg font-medium shadow-sm shadow-skin-accent/30 transition-all"
                                >
                                    <Calculator size={15} />
                                    Calcular Despachos
                                </button>
                            </>
                        )}
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto rounded-b-2xl">
                    <table className="w-full text-left text-sm text-slate-600 relative">
                        <thead className="text-xs uppercase bg-slate-50 text-slate-500 font-semibold border-b border-slate-100 sticky top-0 z-10 shadow-sm">
                            <tr>
                            <th className="px-6 py-4">Producto</th>
                            <th className="px-6 py-4 text-center">Stock Mínimo<br /><span className="text-[10px] normal-case font-normal">(Base recomendada)</span></th>
                            <th className="px-6 py-4 text-center">Existencia Real<br /><span className="text-[10px] normal-case font-normal">(Inventario actual)</span></th>
                            <th className="px-6 py-4 text-center">A Despachar</th>
                        </tr>
                    </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading ? (
                                <tr>
                                    <td colSpan={4} className="px-6 py-10 text-center text-slate-400">
                                        <Loader2 className="animate-spin inline-block mb-2" size={24} />
                                        <p>Cargando inventario...</p>
                                    </td>
                                </tr>
                            ) : displayedRows.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="px-6 py-10 text-center text-slate-400">
                                        {calculated
                                            ? '✅ ¡Todos los productos están en niveles óptimos!'
                                            : 'No hay productos en este catálogo.'}
                                    </td>
                                </tr>
                            ) : displayedRows.map((row) => {
                                const needsDispatch = row.dispatch_qty > 0;
                                return (
                                    <tr
                                        key={row.product.id}
                                        className={`transition-colors ${needsDispatch && calculated ? 'bg-rose-50/40' : 'hover:bg-slate-50/50'}`}
                                    >
                                        {/* Product */}
                                        <td className="px-6 py-3">
                                            <div className="flex items-center gap-3">
                                                <div className="w-9 h-9 rounded-lg bg-slate-100 border border-slate-200 flex-shrink-0 flex items-center justify-center overflow-hidden">
                                                    {row.product.image_url
                                                        ? <img src={row.product.image_url} alt="" className="w-full h-full object-cover" />
                                                        : <ImageIcon size={16} className="text-slate-400" />}
                                                </div>
                                                <div>
                                                    <p className="font-medium text-slate-800 leading-tight">{row.product.name}</p>
                                                    <p className="text-xs text-slate-400 font-mono">{row.product.sku}</p>
                                                </div>
                                            </div>
                                        </td>

                                        <td className="px-6 py-3 text-center">
                                            <input
                                                type="number"
                                                min={0}
                                                value={row.base_stock}
                                                onChange={(e) => updateRow(row.product.id, 'base_stock', parseInt(e.target.value) || 0)}
                                                disabled={isConsulta || userRole !== 'master'}
                                                className="w-20 text-center rounded-lg border border-slate-200 bg-slate-50 px-2 py-1.5 focus:border-skin-accent focus:outline-none focus:ring-1 focus:ring-skin-accent text-sm font-medium disabled:opacity-60"
                                            />
                                        </td>

                                        {/* Current Stock (editable) */}
                                        <td className="px-6 py-3 text-center">
                                            <input
                                                type="number"
                                                min={0}
                                                value={row.current_stock}
                                                onChange={(e) => updateRow(row.product.id, 'current_stock', parseInt(e.target.value) || 0)}
                                                disabled={isConsulta}
                                                className={`w-20 text-center rounded-lg border px-2 py-1.5 focus:outline-none focus:ring-1 text-sm font-medium transition-colors ${row.current_stock < row.base_stock
                                                        ? 'border-red-300 bg-red-50 text-red-600 focus:border-red-400 focus:ring-red-400'
                                                        : 'border-slate-200 bg-slate-50 focus:border-skin-accent focus:ring-skin-accent'
                                                    } disabled:opacity-60`}
                                            />
                                        </td>

                                        {/* Dispatch Amount */}
                                        <td className="px-6 py-3 text-center">
                                            {row.dispatch_qty > 0 ? (
                                                <span className="inline-flex items-center justify-center px-3 py-1 rounded-full text-sm font-bold bg-skin-accent text-white shadow-sm shadow-skin-accent/30">
                                                    +{row.dispatch_qty}
                                                </span>
                                            ) : (
                                                <span className="text-slate-300 text-lg font-bold">—</span>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
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
        </div>
    );
};
