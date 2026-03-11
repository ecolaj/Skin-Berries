import { useEffect } from 'react';
import { Info, X } from 'lucide-react';

interface InfoModalProps {
    isOpen: boolean;
    title: string;
    children: React.ReactNode;
    onClose: () => void;
}

export const InfoModal = ({
    isOpen,
    title,
    children,
    onClose,
}: InfoModalProps) => {
    // Cerrar con Escape
    useEffect(() => {
        if (!isOpen) return;
        const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/40 backdrop-blur-[2px] p-4 p-8"
            onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
        >
            <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-md overflow-hidden animate-[fadeInScale_0.2s_ease-out] border border-slate-100">
                {/* Header */}
                <div className="p-8 pb-4 flex items-start justify-between gap-4">
                    <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 shadow-sm">
                            <Info size={24} />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-slate-900 leading-tight">{title}</h3>
                            <p className="text-sm text-slate-500 mt-1">Guía informativa y de métricas.</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-full hover:bg-slate-100 text-slate-400 transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-8 pt-4 leading-relaxed text-slate-600 text-sm">
                    {children}
                </div>

                {/* Footer */}
                <div className="px-8 pb-8">
                    <button
                        onClick={onClose}
                        className="w-full px-6 py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl text-sm font-bold tracking-wide transition-all active:scale-[0.98]"
                    >
                        Cerrar Guía
                    </button>
                </div>
            </div>
        </div>
    );
};
