import { useEffect, useState } from 'react';
import { MessageSquare, X } from 'lucide-react';

interface ReasonModalProps {
    isOpen: boolean;
    title: string;
    message: string;
    placeholder?: string;
    confirmLabel?: string;
    cancelLabel?: string;
    onConfirm: (reason: string) => void;
    onCancel: () => void;
}

export const ReasonModal = ({
    isOpen,
    title,
    message,
    placeholder = 'Escribe el motivo aquí...',
    confirmLabel = 'Confirmar',
    cancelLabel = 'Cancelar',
    onConfirm,
    onCancel,
}: ReasonModalProps) => {
    const [reason, setReason] = useState('');

    useEffect(() => {
        if (isOpen) setReason('');
    }, [isOpen]);

    useEffect(() => {
        if (!isOpen) return;
        const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onCancel(); };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [isOpen, onCancel]);

    if (!isOpen) return null;

    const handleConfirm = () => {
        if (reason.trim().length < 5) return;
        onConfirm(reason);
    };

    return (
        <div
            className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4"
            onClick={(e) => { if (e.target === e.currentTarget) onCancel(); }}
        >
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-[fadeInScale_0.18s_ease-out]">
                {/* Header */}
                <div className="p-6 pb-4 flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center flex-shrink-0">
                            <MessageSquare size={20} />
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

                {/* Body */}
                <div className="px-6 pb-4">
                    <textarea
                        autoFocus
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        placeholder={placeholder}
                        className="w-full h-24 rounded-xl border border-slate-200 p-3 text-sm focus:border-rose-400 focus:ring-1 focus:ring-rose-400 outline-none resize-none transition-all shadow-sm"
                    />
                    <p className="text-[10px] text-slate-400 mt-1">
                        * Mínimo 5 caracteres para proceder.
                    </p>
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
                        onClick={handleConfirm}
                        disabled={reason.trim().length < 5}
                        className="flex-1 px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-sm font-medium shadow-md shadow-rose-200 disabled:opacity-50 disabled:shadow-none transition-all"
                    >
                        {confirmLabel}
                    </button>
                </div>
            </div>
        </div>
    );
};
