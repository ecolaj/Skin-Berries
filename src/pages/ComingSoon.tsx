import { Sparkles } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface ComingSoonProps {
    title: string;
    icon?: LucideIcon;
}

export const ComingSoon = ({ title, icon: Icon = Sparkles }: ComingSoonProps) => {
    return (
        <div className="flex flex-col items-center justify-center min-h-[70vh] text-center p-8 animate-[fadeIn_0.5s_ease-out]">
            <div className="w-20 h-20 bg-skin-blush text-skin-accent rounded-3xl flex items-center justify-center mb-6 shadow-sm">
                <Icon size={40} className="animate-pulse" />
            </div>
            
            <h1 className="text-3xl font-bold text-slate-900 mb-3 italic tracking-tight uppercase">
                {title}
            </h1>
            
            <div className="max-w-md">
                <p className="text-slate-500 leading-relaxed mb-8">
                    Esta sección está actualmente bajo desarrollo como parte de nuestra fase de expansión estratégica. 
                </p>
                
                <div className="inline-flex items-center gap-3 px-6 py-2 bg-slate-50 border border-slate-100 rounded-2xl text-slate-400 text-sm font-medium">
                    <span className="w-2 h-2 rounded-full bg-skin-accent animate-ping"></span>
                    Próximamente más configuraciones
                </div>
            </div>
            
            {/* Background design elements */}
            <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 -z-10 opacity-[0.03] pointer-events-none">
                <img src="/logo.png" alt="" className="w-[500px] grayscale" />
            </div>
        </div>
    );
};
