import { useEffect } from 'react';
import { AlertTriangle, X } from 'lucide-react';

interface ConfirmModalProps {
    isOpen: boolean;
    title: string;
    message: string;
    confirmLabel?: string;
    cancelLabel?: string;
    /** 'danger' = botón rojo, 'warning' = naranja, 'default' = acento del proyecto */
    variant?: 'danger' | 'warning' | 'default';
    onConfirm: () => void;
    onCancel: () => void;
}

export const ConfirmModal = ({
    isOpen,
    title,
    message,
    confirmLabel = 'Confirmar',
    cancelLabel = 'Cancelar',
    variant = 'danger',
    onConfirm,
    onCancel,
}: ConfirmModalProps) => {
    // Cerrar con Escape
    useEffect(() => {
        if (!isOpen) return;
        const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onCancel(); };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [isOpen, onCancel]);

    if (!isOpen) return null;

    const variantStyles = {
        danger:  { icon: 'bg-red-100 text-red-600',    btn: 'bg-red-600 hover:bg-red-700 shadow-red-200' },
        warning: { icon: 'bg-amber-100 text-amber-600', btn: 'bg-amber-500 hover:bg-amber-600 shadow-amber-200' },
        default: { icon: 'bg-skin-blush text-skin-accent', btn: 'bg-skin-accent hover:bg-pink-700 shadow-skin-accent/30' },
    }[variant];

    return (
        <div
            className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4"
            onClick={(e) => { if (e.target === e.currentTarget) onCancel(); }}
        >
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden animate-[fadeInScale_0.18s_ease-out]">
                {/* Header */}
                <div className="p-6 pb-4 flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${variantStyles.icon}`}>
                            <AlertTriangle size={20} />
                        </div>
                        <div>
                            <h3 className="text-base font-bold text-slate-900 leading-tight">{title}</h3>
                            <p className="text-sm text-slate-500 mt-1 leading-relaxed">{message}</p>
                        </div>
                    </div>
                    <button
                        onClick={onCancel}
                        className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 flex-shrink-0 transition-colors"
                    >
                        <X size={16} />
                    </button>
                </div>

                {/* Footer */}
                <div className="px-6 pb-6 flex gap-3">
                    <button
                        onClick={onCancel}
                        className="flex-1 px-4 py-2.5 border border-slate-200 text-slate-700 rounded-xl text-sm font-medium hover:bg-slate-50 transition-colors"
                    >
                        {cancelLabel}
                    </button>
                    <button
                        onClick={onConfirm}
                        className={`flex-1 px-4 py-2.5 text-white rounded-xl text-sm font-medium shadow-md transition-all ${variantStyles.btn}`}
                    >
                        {confirmLabel}
                    </button>
                </div>
            </div>
        </div>
    );
};
