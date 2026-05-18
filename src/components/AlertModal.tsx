import { useEffect } from 'react';
import { XCircle, CheckCircle, X } from 'lucide-react';

interface AlertModalProps {
    isOpen: boolean;
    title?: string;
    message: string;
    onClose: () => void;
    type?: 'success' | 'error';
}

export const AlertModal = ({
    isOpen,
    title,
    message,
    onClose,
    type = 'error',
}: AlertModalProps) => {
    // Cerrar con Escape
    useEffect(() => {
        if (!isOpen) return;
        const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    const isSuccess = type === 'success';
    const defaultTitle = isSuccess ? '¡Éxito!' : 'Ocurrió un error';
    const displayTitle = title || defaultTitle;

    return (
        <div
            className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4"
            onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
        >
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden animate-[fadeInScale_0.18s_ease-out]">
                {/* Header */}
                <div className="p-6 pb-4 flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                        {isSuccess ? (
                            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center flex-shrink-0">
                                <CheckCircle size={20} />
                            </div>
                        ) : (
                            <div className="w-10 h-10 rounded-xl bg-red-100 text-red-600 flex items-center justify-center flex-shrink-0">
                                <XCircle size={20} />
                            </div>
                        )}
                        <div>
                            <h3 className="text-base font-bold text-slate-900 leading-tight">{displayTitle}</h3>
                            <p className="text-sm text-slate-500 mt-1 leading-relaxed">{message}</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 flex-shrink-0 transition-colors"
                    >
                        <X size={16} />
                    </button>
                </div>

                {/* Footer */}
                <div className="px-6 pb-6">
                    <button
                        onClick={onClose}
                        className={`w-full px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                            isSuccess 
                                ? 'bg-emerald-600 hover:bg-emerald-700 text-white' 
                                : 'bg-slate-900 hover:bg-slate-800 text-white'
                        }`}
                    >
                        Entendido
                    </button>
                </div>
            </div>
        </div>
    );
};
