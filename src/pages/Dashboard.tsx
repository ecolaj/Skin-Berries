import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { 
    Store, 
    TrendingUp, 
    AlertCircle, 
    Activity, 
    ShoppingCart, 
    ArrowUpRight,
    Loader2,
    Calendar,
    Coins
} from 'lucide-react';
import { 
    ResponsiveContainer, 
    AreaChart, 
    Area, 
    XAxis, 
    YAxis, 
    CartesianGrid, 
    Tooltip, 
    PieChart, 
    Pie, 
    Cell, 
    BarChart, 
    Bar,
    Legend
} from 'recharts';

import { InfoModal } from '../components/InfoModal';

export const Dashboard = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [isInfoOpen, setIsInfoOpen] = useState(false);
    
    const [stats, setStats] = useState({
        totalValuation: 0,
        stockHealth: 0,
        activeStores: 0,
        monthlyOrders: 0
    });
    
    const [brandData, setBrandData] = useState<any[] | null>(null);
    const [topProducts, setTopProducts] = useState<any[] | null>(null);
    const [storeLoad, setStoreLoad] = useState<any[] | null>(null);
    const [trendData, setTrendData] = useState<any[] | null>(null);

    const formatCurrency = (val: number) => {
        return 'Q' + val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    };

    const months = [
        'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
        'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];

    const years = [2024, 2025, 2026];

    useEffect(() => {
        fetchDashboardData();
    }, [selectedMonth, selectedYear]);

    const fetchDashboardData = async () => {
        setLoading(true);
        try {
            // Range for filtering orders
            const startDate = new Date(selectedYear, selectedMonth, 1);
            const endDate = new Date(selectedYear, selectedMonth + 1, 0, 23, 59, 59);

            // Fetching all necessary data
            const [
                { data: stores },
                { data: products },
                { data: inventory },
                { data: orders }
            ] = await Promise.all([
                supabase.from('stores').select('*').eq('is_active', true).neq('type', 'warehouse'),
                supabase.from('products').select('*'),
                supabase.from('store_inventory').select('*'),
                supabase.from('dispatch_orders').select('*, dispatch_order_items(*)')
            ]);

            if (!stores || !products || !inventory || !orders) return;

            const activeStoreIds = stores.map(s => s.id);

            // --- CALCULATE STATS ---
            // 1. Valuation (Only for active stores)
            let totalVal = 0;
            const filteredInventory = inventory.filter(inv => activeStoreIds.includes(inv.store_id));
            
            filteredInventory.forEach(inv => {
                const product = products.find(p => p.id === inv.product_id);
                if (product?.price) {
                    totalVal += inv.current_stock * product.price;
                }
            });

            // 2. Stock Health (% of active store items above base_stock)
            const healthyItems = filteredInventory.filter(i => i.current_stock >= i.base_stock).length;
            const healthIndex = filteredInventory.length > 0 ? (healthyItems / filteredInventory.length) * 100 : 0;

            // 3. Orders in selected period
            const periodOrders = orders.filter(o => {
                const date = new Date(o.created_at);
                return date >= startDate && date <= endDate;
            });

            setStats({
                totalValuation: totalVal,
                stockHealth: healthIndex,
                activeStores: stores.length,
                monthlyOrders: periodOrders.length
            });

            // --- CHART DATA: BRAND DISTRIBUTION ---
            const brandMap: Record<string, number> = {};
            filteredInventory.forEach(inv => {
                const product = products.find(p => p.id === inv.product_id);
                const brand = product?.brand || 'Sin Marca';
                if (!brandMap[brand]) brandMap[brand] = 0;
                brandMap[brand] += inv.current_stock * (product?.price || 0);
            });
            setBrandData(Object.entries(brandMap)
                .map(([name, value]) => ({ name, value }))
                .filter(b => b.value > 0)
            );

            // --- CHART DATA: STORE LOAD ---
            const storeOrderMap: Record<string, number> = {};
            periodOrders.forEach(o => {
                const store = stores.find(s => s.id === o.store_id);
                if (store) {
                    storeOrderMap[store.name] = (storeOrderMap[store.name] || 0) + 1;
                }
            });
            setStoreLoad(Object.entries(storeOrderMap).map(([name, orders]) => ({ name, orders })));

            // --- CHART DATA: TOP PRODUCTS ---
            const itemMap: Record<string, { name: string, qty: number }> = {};
            periodOrders.forEach(o => {
                o.dispatch_order_items?.forEach((item: any) => {
                    const product = products.find(p => p.id === item.product_id);
                    if (product) {
                        if (!itemMap[product.id]) itemMap[product.id] = { name: product.name, qty: 0 };
                        itemMap[product.id].qty += item.dispatch_qty;
                    }
                });
            });
            setTopProducts(Object.values(itemMap)
                .sort((a, b) => b.qty - a.qty)
                .slice(0, 5)
                .map(i => ({ name: i.name.substring(0, 15), cantidad: i.qty })));

            // --- REAL TREND DATA: Orders by day in the selected month ---
            const daysInMonth = endDate.getDate();
            const dailyStats = Array.from({ length: daysInMonth }, (_, i) => ({
                day: i + 1,
                ordenes: 0
            }));

            periodOrders.forEach(o => {
                const day = new Date(o.created_at).getDate();
                dailyStats[day - 1].ordenes++;
            });

            setTrendData(dailyStats.map(d => ({ name: `${d.day}`, orders: d.ordenes })));

        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const COLORS = ['#b76c77', '#E8B4B8', '#1E293B', '#64748b', '#94a3b8'];

    return (
        <div className="space-y-8 pb-10">
            {/* --- HEADER & FILTERS --- */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight italic">Dashboard Estratégico</h1>
                    <p className="text-slate-500 mt-1">Análisis de rendimiento corporativo en tiempo real.</p>
                </div>

                <div className="flex items-center gap-3 bg-white p-2 rounded-2xl shadow-sm border border-slate-100">
                    <Calendar className="text-slate-400 ml-2" size={18} />
                    <select 
                        value={selectedMonth} 
                        onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                        className="bg-transparent outline-none text-slate-700 font-bold px-2 py-1 cursor-pointer"
                    >
                        {months.map((m, i) => <option key={m} value={i}>{m}</option>)}
                    </select>
                    <select 
                        value={selectedYear} 
                        onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                        className="bg-transparent outline-none text-slate-700 font-bold px-2 py-1 cursor-pointer"
                    >
                        {years.map(y => <option key={y} value={y}>{y}</option>)}
                    </select>
                </div>
            </div>

            {loading ? (
                <div className="flex flex-col items-center justify-center min-h-[50vh] text-slate-400">
                    <Loader2 className="animate-spin mb-4" size={40} />
                    <p className="font-medium animate-pulse">Sincronizando datos de la nube...</p>
                </div>
            ) : (
                <>
                    {/* --- STAT CARDS --- */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {/* Valuation */}
                        <div className="bg-white rounded-3xl p-6 shadow-md border border-slate-100 flex items-center gap-4 relative overflow-hidden group hover:shadow-lg transition-all">
                            <div className="absolute top-0 right-0 w-24 h-24 -mr-8 -mt-8 bg-skin-blush/30 rounded-full blur-2xl transition-all group-hover:bg-skin-blush/50"></div>
                            <div className="w-14 h-14 bg-skin-blush text-skin-accent rounded-2xl flex items-center justify-center shadow-sm">
                                <Coins size={28} />
                            </div>
                            <div>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Valor Inventario</p>
                                <h3 className="text-2xl font-bold text-slate-800 tracking-tight">
                                    {formatCurrency(stats.totalValuation)}
                                </h3>
                            </div>
                        </div>

                        {/* Stock Health */}
                        <button 
                            onClick={() => setIsInfoOpen(true)}
                            className="bg-white rounded-3xl p-6 shadow-md border border-slate-100 flex items-center gap-4 relative overflow-hidden group hover:shadow-lg hover:-translate-y-1 transition-all text-left"
                        >
                            <div className="w-14 h-14 bg-green-50 text-green-600 rounded-2xl flex items-center justify-center shadow-sm group-hover:bg-green-100 transition-colors">
                                <Activity size={28} />
                            </div>
                            <div>
                                <div className="flex items-center gap-1">
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Salud del Stock</p>
                                    <ArrowUpRight size={14} className="text-slate-300 group-hover:text-green-500 transition-colors" />
                                </div>
                                <h3 className="text-2xl font-bold text-slate-800 tracking-tight">
                                    {stats.stockHealth.toFixed(1)}%
                                </h3>
                            </div>
                        </button>

                        {/* Stores */}
                        <div className="bg-white rounded-3xl p-6 shadow-md border border-slate-100 flex items-center gap-4 relative overflow-hidden group hover:shadow-lg transition-all">
                            <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center shadow-sm">
                                <Store size={28} />
                            </div>
                            <div>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Tiendas Activas</p>
                                <h3 className="text-2xl font-bold text-slate-800 tracking-tight">{stats.activeStores}</h3>
                            </div>
                        </div>

                        {/* Monthly Orders */}
                        <button 
                            onClick={() => navigate('/dispatch-history')}
                            className="bg-white rounded-3xl p-6 shadow-md border border-slate-100 flex items-center gap-4 relative overflow-hidden group hover:shadow-lg hover:-translate-y-1 transition-all text-left"
                        >
                            <div className="w-14 h-14 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center shadow-sm transition-transform group-hover:scale-110">
                                <ShoppingCart size={28} />
                            </div>
                            <div>
                                <div className="flex items-center gap-1">
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Órdenes del Mes</p>
                                    <ArrowUpRight size={14} className="text-slate-300 group-hover:text-rose-400 transition-colors" />
                                </div>
                                <h3 className="text-2xl font-bold text-slate-800 tracking-tight">{stats.monthlyOrders}</h3>
                            </div>
                        </button>
                    </div>

                    {/* --- MIDDLE SECTION --- */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Daily Activity Chart */}
                        <div className="lg:col-span-2 bg-white rounded-[2rem] p-8 shadow-md border border-slate-100">
                            <div className="flex items-center justify-between mb-8">
                                <div>
                                    <h3 className="text-xl font-bold text-slate-800">Actividad Logística Diaria</h3>
                                    <p className="text-sm text-slate-400">Número de órdenes por día en el mes seleccionado</p>
                                </div>
                            </div>
                            <div className="h-[300px] w-full">
                                {trendData && trendData.some(d => d.orders > 0) ? (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart data={trendData}>
                                            <defs>
                                                <linearGradient id="colorOrders" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#b76c77" stopOpacity={0.3}/>
                                                    <stop offset="95%" stopColor="#b76c77" stopOpacity={0}/>
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10}} />
                                            <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10}} />
                                            <Tooltip 
                                                contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}}
                                            />
                                            <Area type="monotone" dataKey="orders" stroke="#b76c77" strokeWidth={3} fillOpacity={1} fill="url(#colorOrders)" />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="h-full flex flex-col items-center justify-center text-slate-300 border-2 border-dashed border-slate-50 rounded-3xl bg-slate-50/50">
                                        <ShoppingCart size={40} className="mb-2 opacity-20" />
                                        <p>No se registran órdenes en este periodo</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Distribution by Brand */}
                        <div className="bg-white rounded-[2rem] p-8 shadow-md border border-slate-100">
                            <h3 className="text-xl font-bold text-slate-800 mb-2">Inversión por Marca</h3>
                            <p className="text-sm text-slate-400 mb-8">Capital distribuido en marcas</p>
                            <div className="h-[250px] w-full">
                                {brandData && brandData.length > 0 ? (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={brandData}
                                                innerRadius={60}
                                                outerRadius={80}
                                                paddingAngle={5}
                                                dataKey="value"
                                            >
                                                {brandData.map((_entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                ))}
                                            </Pie>
                                            <Tooltip formatter={(value: number) => formatCurrency(value)} />
                                            <Legend verticalAlign="bottom" height={36}/>
                                        </PieChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="h-full flex items-center justify-center text-slate-300">
                                        <p>Sin datos de inventario</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* --- BOTTOM SECTION --- */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* Top Products */}
                        <div className="bg-white rounded-[2rem] p-8 shadow-md border border-slate-100">
                            <div className="flex items-center gap-3 mb-6">
                                <TrendingUp className="text-skin-accent" size={24} />
                                <h3 className="text-xl font-bold text-slate-800">Top 5 Rotación (Unidades)</h3>
                            </div>
                            <div className="h-[250px] w-full">
                                {topProducts && topProducts.length > 0 ? (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={topProducts} layout="vertical">
                                            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                                            <XAxis type="number" hide />
                                            <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} width={120} tick={{fill: '#64748b', fontSize: 11}} />
                                            <Tooltip />
                                            <Bar dataKey="cantidad" fill="#b76c77" radius={[0, 8, 8, 0]} barSize={20} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="h-full flex items-center justify-center text-slate-300">
                                        <p>Sin salidas de producto registradas</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Store Load */}
                        <div className="bg-white rounded-[2rem] p-8 shadow-md border border-slate-100">
                            <div className="flex items-center gap-3 mb-6">
                                <Activity className="text-indigo-600" size={24} />
                                <h3 className="text-xl font-bold text-slate-800">Órdenes Solicitadas por Tienda</h3>
                            </div>
                            <div className="h-[250px] w-full">
                                {storeLoad && storeLoad.length > 0 ? (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={storeLoad}>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 11}} />
                                            <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 11}} />
                                            <Tooltip />
                                            <Bar dataKey="orders" fill="#1E293B" radius={[8, 8, 0, 0]} barSize={40} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="h-full flex items-center justify-center text-slate-300 italic">
                                        <p>Selecciona un periodo con actividad para ver este gráfico</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* --- STRATEGIC INSIGHTS --- */}
                    <div className="bg-[#1e1e1e] rounded-[2.5rem] p-10 text-white relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-skin-blush/10 rounded-full -mr-20 -mt-20 blur-3xl"></div>
                        <div className="relative z-10 flex flex-col md:flex-row items-center gap-10">
                            <div className="w-20 h-20 bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 flex items-center justify-center shrink-0">
                                <AlertCircle size={40} className="text-skin-blush" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-black mb-3 italic tracking-tight uppercase">Resumen de Decisión</h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-white/70 text-sm">
                                    <p>
                                        <strong className="text-white">Estado de Operación:</strong> 
                                        {stats.monthlyOrders === 0 
                                            ? ' No se registra actividad en este periodo. Verifique si hay órdenes pendientes de digitalizar.' 
                                            : ` En este periodo se han gestionado ${stats.monthlyOrders} órdenes. La carga está concentrada en ${storeLoad?.[0]?.name || 'tiendas específicas'}.`}
                                    </p>
                                    <p>
                                        <strong className="text-white">Análisis de Capital:</strong> 
                                        {stats.totalValuation > 0 
                                            ? ` Actualmente el capital activo en tiendas es de ${formatCurrency(stats.totalValuation)}. La salud operativa del catálogo es del ${stats.stockHealth.toFixed(1)}%.`
                                            : ' No hay inventario registrado en tiendas activas para reportar valorización.'}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </>
            )}

            <InfoModal 
                isOpen={isInfoOpen} 
                title="Guía: Salud del Stock" 
                onClose={() => setIsInfoOpen(false)}
            >
                <div className="space-y-4">
                    <section>
                        <h4 className="font-bold text-slate-800 flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
                            ¿Cómo se calcula?
                        </h4>
                        <p className="mt-1">
                            Es el porcentaje de productos en tiendas activas cuyo <strong>Stock Actual</strong> es igual o superior al <strong>Stock Base</strong> definido.
                        </p>
                    </section>
                    
                    <section>
                        <h4 className="font-bold text-slate-800 flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
                            Interpretación
                        </h4>
                        <ul className="mt-2 space-y-2">
                            <li className="flex gap-2 text-sm">
                                <span className="font-bold text-green-600 shrink-0 min-w-[60px]">90%+:</span> Salud óptima. Operación fluida.
                            </li>
                            <li className="flex gap-2 text-sm">
                                <span className="font-bold text-amber-600 shrink-0 min-w-[60px]">70-89%:</span> Riesgo moderado. Revisar reposiciones.
                            </li>
                            <li className="flex gap-2 text-sm">
                                <span className="font-bold text-red-600 shrink-0 min-w-[60px]">{"<"}70%:</span> Crítico. Riesgo de pérdida de ventas.
                            </li>
                        </ul>
                    </section>

                    <p className="text-xs bg-slate-50 p-4 rounded-xl border border-slate-100 italic text-slate-500">
                        "Un stock saludable asegura que el capital esté rotando correctamente y no estancado en productos de baja demanda."
                    </p>
                </div>
            </InfoModal>
        </div>
    );
};
