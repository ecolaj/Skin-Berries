import { useEffect, useRef, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import type { Database } from '../types/supabase';
import { Plus, Loader2, ImageIcon, Pencil, X, Upload, Check } from 'lucide-react';
import { AlertModal } from '../components/AlertModal';

type Product = Database['public']['Tables']['products']['Row'];

// Compress image using canvas before uploading
const compressImage = (file: File, maxWidth = 400, quality = 0.75): Promise<Blob> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let { width, height } = img;
                if (width > maxWidth) {
                    height = (height * maxWidth) / width;
                    width = maxWidth;
                }
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx?.drawImage(img, 0, 0, width, height);
                canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error('Compression failed')), 'image/webp', quality);
            };
            img.onerror = reject;
            img.src = e.target?.result as string;
        };
        reader.readAsDataURL(file);
    });
};

const uploadProductImage = async (file: File, productSku: string): Promise<string> => {
    const compressed = await compressImage(file);
    const ext = 'webp';
    const path = `${productSku.replace(/\s+/g, '-')}-${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from('product-images').upload(path, compressed, { contentType: 'image/webp', upsert: true });
    if (error) throw error;
    const { data } = supabase.storage.from('product-images').getPublicUrl(path);
    return data.publicUrl;
};

const emptyForm = { name: '', sku: '', barcode: '', brand: '', price: '', is_active: true };

export const Products = () => {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);
    const [formData, setFormData] = useState(emptyForm);
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Filtro activos / inactivos
    const [showInactive, setShowInactive] = useState(false);
    
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

    const visibleProducts = showInactive
        ? products.filter((p) => !p.is_active)
        : products.filter((p) => p.is_active);

    const inactiveCount = products.filter((p) => !p.is_active).length;

    const fetchProducts = async () => {
        setLoading(true);
        const { data } = await supabase.from('products').select('*').order('name');
        if (data) setProducts(data);
        setLoading(false);
    };

    useEffect(() => { fetchProducts(); }, []);

    const openAddModal = () => {
        setEditingProduct(null);
        setFormData(emptyForm);
        setImageFile(null);
        setImagePreview(null);
        setIsModalOpen(true);
    };

    const openEditModal = (product: Product) => {
        setEditingProduct(product);
        setFormData({
            name: product.name,
            sku: product.sku,
            barcode: product.barcode || '',
            brand: product.brand || '',
            price: product.price ? String(product.price) : '',
            is_active: product.is_active ?? true,
        });
        setImageFile(null);
        setImagePreview(product.image_url || null);
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingProduct(null);
        setImageFile(null);
        setImagePreview(null);
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setImageFile(file);
        setImagePreview(URL.createObjectURL(file));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);

        let imageUrl = editingProduct?.image_url || null;
        if (imageFile) {
            try {
                imageUrl = await uploadProductImage(imageFile, formData.sku || 'product');
            } catch (err) {
                showAlert('Error al subir la imagen: ' + (err as Error).message);
                setSaving(false);
                return;
            }
        }

        const payload = {
            name: formData.name,
            sku: formData.sku,
            barcode: formData.barcode || null,
            brand: formData.brand || null,
            price: formData.price ? parseFloat(formData.price) : null,
            is_active: formData.is_active,
            image_url: imageUrl,
        };

        const { error } = editingProduct
            ? await supabase.from('products').update(payload).eq('id', editingProduct.id)
            : await supabase.from('products').insert([payload]);

        setSaving(false);
        if (!error) {
            closeModal();
            fetchProducts();
        } else {
            showAlert('Error al guardar el producto: ' + error.message);
        }
    };

    return (
        <div className="flex flex-col h-[calc(100vh-4rem)] space-y-6">
            {/* ===== HEADER FIJO ===== */}
            <div className="shrink-0 flex flex-col md:flex-row md:items-end justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Catálogo de Productos</h1>
                        <p className="text-slate-500 mt-1">Registra y administra los cosméticos disponibles.</p>
                    </div>
                    <div className="flex items-center gap-3 flex-wrap">
                        {/* Filtro Vigentes / Inactivos */}
                        <div className="flex items-center bg-slate-100 rounded-xl p-1 gap-1">
                            <button
                                onClick={() => setShowInactive(false)}
                                className={`px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all ${
                                    !showInactive ? 'bg-white shadow text-slate-900' : 'text-slate-500 hover:text-slate-700'
                                }`}
                            >
                                Vigentes
                            </button>
                            <button
                                onClick={() => setShowInactive(true)}
                                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all ${
                                    showInactive ? 'bg-white shadow text-slate-900' : 'text-slate-500 hover:text-slate-700'
                                }`}
                            >
                                Inactivos
                                {inactiveCount > 0 && (
                                    <span className="bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded-full text-xs leading-none">
                                        {inactiveCount}
                                    </span>
                                )}
                            </button>
                        </div>
                        {!isConsulta && (
                            <button
                                onClick={openAddModal}
                                className="flex items-center gap-2 bg-skin-accent hover:bg-pink-700 text-white px-5 py-2.5 rounded-xl font-medium shadow-md shadow-skin-accent/30 transition-all"
                            >
                                <Plus size={18} />
                                Añadir Producto
                            </button>
                        )}
                    </div>
                </div>

            {/* TABLA CON SCROLL INTERNO */}
            <div className="flex-1 flex flex-col min-h-0 bg-skin-card rounded-2xl shadow-sm border border-slate-100">
                <div className="flex-1 overflow-y-auto rounded-xl">
                    <table className="w-full text-left text-sm text-slate-600 relative">
                        <thead className="text-xs uppercase bg-slate-50 text-slate-500 font-semibold border-b border-slate-100 sticky top-0 z-10 shadow-sm">
                            <tr>
                                <th className="px-6 py-4">Producto</th>
                                <th className="px-6 py-4">SKU / Código</th>
                                <th className="px-6 py-4">Precio</th>
                                <th className="px-6 py-4 text-center">Estado</th>
                                <th className="px-6 py-4 text-right">Acciones</th>
                            </tr>
                        </thead>
                    <tbody className="divide-y divide-slate-100">
                            {loading ? (
                                <tr><td colSpan={5} className="px-6 py-8 text-center text-slate-400">Cargando productos...</td></tr>
                            ) : visibleProducts.length === 0 ? (
                                <tr><td colSpan={5} className="px-6 py-8 text-center text-slate-400">
                                    {showInactive ? 'No hay productos inactivos.' : 'No hay productos en el catálogo.'}
                                </td></tr>
                            ) : visibleProducts.map((product) => (
                                <tr key={product.id} className="hover:bg-slate-50/50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-lg bg-slate-100 border border-slate-200 flex-shrink-0 flex items-center justify-center overflow-hidden">
                                                {product.image_url
                                                    ? <img src={product.image_url} alt="" className="w-full h-full object-cover" />
                                                    : <ImageIcon className="text-slate-400" size={20} />
                                                }
                                            </div>
                                            <div>
                                                <span className="font-medium text-slate-800 block">{product.name}</span>
                                                {product.brand && <span className="text-xs text-slate-500">{product.brand}</span>}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 font-mono text-xs">
                                        <span className="font-semibold text-slate-900">{product.sku}</span><br />
                                        <span className="text-slate-400">{product.barcode || 'Sin código'}</span>
                                    </td>
                                    <td className="px-6 py-4 font-medium text-slate-800">
                                        {product.price ? `Q${Number(product.price).toFixed(2)}` : '-'}
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${product.is_active ? 'bg-green-50 text-green-600' : 'bg-slate-100 text-slate-500'}`}>
                                            {product.is_active ? <Check size={12} /> : <X size={12} />}
                                            {product.is_active ? 'Vigente' : 'Inactivo'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        {!isConsulta && (
                                            <button
                                                onClick={() => openEditModal(product)}
                                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-skin-accent border border-skin-accent/30 hover:bg-skin-blush text-sm font-medium transition-all"
                                            >
                                                <Pencil size={14} />
                                                Editar
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal Añadir / Editar Producto */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] flex flex-col">
                        {/* Modal Header */}
                        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                            <div>
                                <h3 className="text-xl font-bold text-slate-900">{editingProduct ? 'Editar producto' : 'Añadir producto'}</h3>
                                <p className="text-sm text-slate-500 mt-0.5">{editingProduct ? 'Modifica los datos del artículo.' : 'Registra un nuevo artículo en el sistema.'}</p>
                            </div>
                            <button onClick={closeModal} className="p-2 rounded-full hover:bg-slate-100 text-slate-500 transition-colors">
                                <X size={20} />
                            </button>
                        </div>

                        {/* Modal Body - scrollable */}
                        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
                            <div className="p-6 space-y-4 overflow-y-auto flex-1">

                                {/* Image Upload */}
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">Imagen del Producto</label>
                                    <div
                                        onClick={() => fileInputRef.current?.click()}
                                        className="relative cursor-pointer border-2 border-dashed border-slate-200 rounded-xl p-4 flex flex-col items-center justify-center gap-2 hover:border-skin-accent hover:bg-skin-blush/30 transition-all group min-h-[120px]"
                                    >
                                        {imagePreview ? (
                                            <img src={imagePreview || undefined} alt="Preview" className="h-24 w-24 object-cover rounded-lg shadow-sm" />
                                        ) : (
                                            <>
                                                <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center group-hover:bg-skin-blush transition-colors">
                                                    <Upload size={20} className="text-slate-400 group-hover:text-skin-accent transition-colors" />
                                                </div>
                                                <p className="text-sm text-slate-500">Haz clic para subir una imagen</p>
                                                <p className="text-xs text-slate-400">JPG, PNG, WEBP — Se comprimirá automáticamente</p>
                                            </>
                                        )}
                                        {imagePreview && (
                                            <p className="text-xs text-skin-accent font-medium">Haz clic para cambiar</p>
                                        )}
                                    </div>
                                    <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
                                </div>

                                {/* Name */}
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Nombre del Producto *</label>
                                    <input type="text" required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        className="block w-full rounded-xl border border-slate-300 px-4 py-2.5 focus:border-skin-accent focus:outline-none focus:ring-1 focus:ring-skin-accent shadow-sm" />
                                </div>

                                {/* Brand */}
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Marca</label>
                                    <input type="text" value={formData.brand} onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                                        className="block w-full rounded-xl border border-slate-300 px-4 py-2.5 focus:border-skin-accent focus:outline-none focus:ring-1 focus:ring-skin-accent shadow-sm" placeholder="Opcional" />
                                </div>

                                {/* SKU / Barcode */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">SKU *</label>
                                        <input type="text" required value={formData.sku} onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                                            className="block w-full font-mono text-sm rounded-xl border border-slate-300 px-4 py-2.5 focus:border-skin-accent focus:outline-none focus:ring-1 focus:ring-skin-accent shadow-sm" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Código de Barras</label>
                                        <input type="text" value={formData.barcode} onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                                            className="block w-full font-mono text-sm rounded-xl border border-slate-300 px-4 py-2.5 focus:border-skin-accent focus:outline-none focus:ring-1 focus:ring-skin-accent shadow-sm" />
                                    </div>
                                </div>

                                {/* Price / Active */}
                                <div className="grid grid-cols-2 gap-4 items-end">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Precio</label>
                                        <div className="relative">
                                            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                                                <span className="text-slate-500 font-medium text-sm">Q</span>
                                            </div>
                                            <input type="number" step="0.01" min="0" value={formData.price} onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                                                className="block w-full rounded-xl border border-slate-300 pl-7 pr-4 py-2.5 focus:border-skin-accent focus:outline-none focus:ring-1 focus:ring-skin-accent shadow-sm" placeholder="0.00" />
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 pb-2">
                                        <input type="checkbox" id="is_active" checked={formData.is_active} onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                                            className="h-4 w-4 rounded border-slate-300 text-skin-accent focus:ring-skin-accent cursor-pointer" />
                                        <label htmlFor="is_active" className="text-sm text-slate-700 cursor-pointer select-none">Producto Vigente</label>
                                    </div>
                                </div>
                            </div>

                            {/* Modal Footer */}
                            <div className="p-6 border-t border-slate-100 flex gap-3">
                                <button type="button" onClick={closeModal}
                                    className="flex-1 px-4 py-2.5 border border-slate-300 text-slate-700 rounded-xl font-medium hover:bg-slate-50 transition-colors">
                                    Cancelar
                                </button>
                                <button type="submit" disabled={saving}
                                    className="flex-1 px-4 py-2.5 bg-skin-accent text-white rounded-xl font-medium hover:bg-pink-700 flex justify-center items-center shadow-md shadow-skin-accent/30 transition-all disabled:opacity-70">
                                    {saving ? <Loader2 className="animate-spin" size={20} /> : (editingProduct ? 'Guardar Cambios' : 'Guardar Producto')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal de alerta de error */}
            <AlertModal
                isOpen={alertOpen}
                message={alertMessage}
                onClose={() => setAlertOpen(false)}
            />
        </div>
    );
};
