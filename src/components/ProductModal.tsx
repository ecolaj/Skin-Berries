import React from 'react';
import { X, ImageIcon, Barcode, Tag, Coins, Activity, ShieldAlert } from 'lucide-react';
import type { Database } from '../types/supabase';

type Product = Database['public']['Tables']['products']['Row'];

interface ProductModalProps {
    isOpen: boolean;
    onClose: () => void;
    product: Product;
}

export const ProductModal: React.FC<ProductModalProps> = ({ isOpen, onClose, product }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
            <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-lg overflow-hidden animate-fadeInScale border border-white/20">
                {/* Header with Background Gradient */}
                <div className="relative h-32 bg-gradient-to-r from-skin-blush via-white to-pink-50 flex items-center justify-between px-8 border-b border-slate-100">
                    <div className="z-10">
                        <h2 className="text-2xl font-black text-slate-800 tracking-tight">Detalle de Producto</h2>
                        <p className="text-sm text-slate-500 font-medium italic">Información técnica y comercial.</p>
                    </div>
                    <button 
                        onClick={onClose} 
                        className="z-10 p-2 text-slate-400 hover:text-slate-600 hover:bg-white/50 rounded-full transition-all shadow-sm"
                    >
                        <X size={20} />
                    </button>
                    {/* Decorative element */}
                    <div className="absolute top-0 right-0 w-32 h-32 bg-skin-accent/5 rounded-full -mr-16 -mt-16 blur-2xl"></div>
                </div>

                {/* Body */}
                <div className="p-8">
                    <div className="flex flex-col gap-8">
                        {/* Hero Section: Image and Basic Info */}
                        <div className="flex items-start gap-6">
                            <div className="w-32 h-32 rounded-3xl bg-slate-50 border-2 border-slate-100 flex-shrink-0 flex items-center justify-center overflow-hidden shadow-inner group">
                                {product.image_url ? (
                                    <img 
                                        src={product.image_url} 
                                        alt={product.name} 
                                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" 
                                    />
                                ) : (
                                    <ImageIcon className="text-slate-300" size={48} />
                                )}
                            </div>
                            <div className="flex-1 space-y-2">
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-skin-blush text-skin-accent shadow-sm border border-skin-accent/10">
                                    {product.brand || 'Marca no especificada'}
                                </span>
                                <h3 className="text-xl font-bold text-slate-900 leading-tight">{product.name}</h3>
                                <div className="flex items-center gap-2 text-slate-400">
                                    <Activity size={14} />
                                    <span className={`text-xs font-bold uppercase tracking-wider ${product.is_active ? 'text-green-500' : 'text-slate-400'}`}>
                                        {product.is_active ? 'Estado: Vigente' : 'Estado: Inactivo'}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Details Grid */}
                        <div className="grid grid-cols-2 gap-4">
                            {/* SKU */}
                            <div className="bg-slate-50/80 rounded-2xl p-4 border border-slate-100 group hover:border-skin-accent/20 transition-colors">
                                <div className="flex items-center gap-2 mb-2 text-slate-400">
                                    <Tag size={14} className="group-hover:text-skin-accent transition-colors" />
                                    <span className="text-[10px] font-bold uppercase tracking-widest">Código SKU</span>
                                </div>
                                <p className="font-mono text-sm font-bold text-slate-800">{product.sku}</p>
                            </div>

                            {/* Barcode */}
                            <div className="bg-slate-50/80 rounded-2xl p-4 border border-slate-100 group hover:border-skin-accent/20 transition-colors">
                                <div className="flex items-center gap-2 mb-2 text-slate-400">
                                    <Barcode size={14} className="group-hover:text-skin-accent transition-colors" />
                                    <span className="text-[10px] font-bold uppercase tracking-widest">Cód. Barras</span>
                                </div>
                                <p className="font-mono text-sm font-bold text-slate-800">{product.barcode || '--'}</p>
                            </div>

                            {/* Price */}
                            <div className="bg-slate-50/80 rounded-2xl p-4 border border-slate-100 group hover:border-skin-accent/20 transition-colors">
                                <div className="flex items-center gap-2 mb-2 text-slate-400">
                                    <Coins size={14} className="group-hover:text-skin-accent transition-colors" />
                                    <span className="text-[10px] font-bold uppercase tracking-widest">Valor Venta</span>
                                </div>
                                <p className="text-lg font-black text-slate-900">
                                    Q{product.price ? Number(product.price).toFixed(2) : '0.00'}
                                </p>
                            </div>

                            {/* Status Indicator */}
                            <div className="bg-slate-50/80 rounded-2xl p-4 border border-slate-100 group hover:border-skin-accent/20 transition-colors">
                                <div className="flex items-center gap-2 mb-2 text-slate-400">
                                    <ShieldAlert size={14} className="group-hover:text-skin-accent transition-colors" />
                                    <span className="text-[10px] font-bold uppercase tracking-widest">Disponibilidad</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className={`w-2 h-2 rounded-full animate-pulse ${product.is_active ? 'bg-green-500' : 'bg-slate-400'}`}></div>
                                    <p className={`font-bold text-sm ${product.is_active ? 'text-green-600' : 'text-slate-500'}`}>
                                        {product.is_active ? 'Venta Autorizada' : 'Venta Suspendida'}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-center">
                    <button
                        onClick={onClose}
                        className="w-full max-w-[200px] py-3 bg-slate-900 text-white rounded-2xl font-bold shadow-lg shadow-slate-200 hover:bg-slate-800 hover:-translate-y-0.5 active:translate-y-0 transition-all uppercase tracking-widest text-xs"
                    >
                        Cerrar Detalles
                    </button>
                </div>
            </div>
        </div>
    );
};
