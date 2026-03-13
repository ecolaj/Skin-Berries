import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Loader2, Eye, EyeOff, ArrowLeft, Mail, Lock, User, Send, CheckCircle2 } from 'lucide-react';

type AuthMode = 'login' | 'signup' | 'forgot' | 'success-signup' | 'success-forgot' | 'update-password';

export const Login = () => {
    const [mode, setMode] = useState<AuthMode>('login');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [fullName, setFullName] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [isMounted, setIsMounted] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const navigate = useNavigate();
    const { user } = useAuth();

    useEffect(() => {
        const timer = setTimeout(() => setIsMounted(true), 50);
        
        // Listen for recovery event
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
            if (event === 'PASSWORD_RECOVERY') {
                setMode('update-password');
            }
        });

        return () => {
            clearTimeout(timer);
            subscription.unsubscribe();
        };
    }, []);

    // Redirect to home after successful login
    useEffect(() => {
        if (user) {
            navigate('/');
        }
    }, [user, navigate]);

    const resetMessages = () => {
        setError(null);
    };

    const handleUpdatePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (password !== confirmPassword) {
            setError('Las contraseñas no coinciden');
            return;
        }
        setLoading(true);
        resetMessages();

        const { error } = await supabase.auth.updateUser({ password });

        if (error) {
            setError(error.message);
            setLoading(false);
        } else {
            navigate('/');
        }
    };

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        resetMessages();

        const { error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (error) {
            setError(error.message);
            setLoading(false);
        } else {
            // Successful login; auth state change will update user context.
            // Delay navigation until user is set to avoid premature redirect.
            setLoading(false);
        }
    };

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault();
        if (password !== confirmPassword) {
            setError('Las contraseñas no coinciden');
            return;
        }
        
        setLoading(true);
        resetMessages();

        const { error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    full_name: fullName,
                },
                emailRedirectTo: `${window.location.origin}/login`,
            }
        });

        if (error) {
            setError(error.message);
            setLoading(false);
        } else {
            setMode('success-signup');
            setLoading(false);
        }
    };

    const handleForgotPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        resetMessages();

        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${window.location.origin}/login`,
        });

        if (error) {
            setError(error.message);
            setLoading(false);
        } else {
            setMode('success-forgot');
            setLoading(false);
        }
    };

    const renderHeader = () => {
        switch (mode) {
            case 'signup':
                return {
                    title: 'Únete a nosotros',
                    subtitle: 'Crea tu cuenta corporativa para empezar a gestionar inventarios.'
                };
            case 'forgot':
                return {
                    title: 'Recuperar acceso',
                    subtitle: 'Ingresa tu correo y te enviaremos instrucciones para restablecer tu cuenta.'
                };
            case 'success-signup':
                return {
                    title: '¡Casi listo!',
                    subtitle: 'Por favor revisa tu bandeja de entrada para confirmar tu registro.'
                };
            case 'success-forgot':
                return {
                    title: 'Correo enviado',
                    subtitle: 'Si el correo existe en nuestro sistema, recibirás instrucciones en unos minutos.'
                };
            case 'update-password':
                return {
                    title: 'Nueva Contraseña',
                    subtitle: 'Establece una nueva contraseña segura para tu cuenta.'
                };
            default:
                return {
                    title: 'Bienvenido de nuevo',
                    subtitle: 'Inicia sesión para gestionar el inventario premium de cosméticos.'
                };
        }
    };

    const header = renderHeader();

    return (
        <div className="min-h-screen flex bg-skin-bg">
            <div className="flex-1 flex flex-col justify-center px-4 sm:px-6 lg:flex-none lg:px-20 xl:px-32 relative z-10">
                <div className="mx-auto w-full max-w-sm lg:w-96">
                    <div className="text-center lg:text-left">
                        <div className="flex justify-center lg:justify-start mb-8 transition-all hover:scale-105">
                            <img src="/logo.png" alt="Skin & Berries Logo" className="h-24 w-auto object-contain" />
                        </div>
                        <h2 className="mt-6 text-3xl font-bold tracking-tight text-slate-900 animate-[fadeIn_0.3s_ease-out]">
                            {header.title}
                        </h2>
                        <p className="mt-2 text-sm text-slate-500 animate-[fadeIn_0.4s_ease-out]">
                            {header.subtitle}
                        </p>
                    </div>

                    <div className="mt-8 transition-all">
                        {mode === 'success-signup' || mode === 'success-forgot' ? (
                            <div className="space-y-6 animate-[scaleIn_0.4s_ease-out]">
                                <div className="flex justify-center">
                                    <div className="w-16 h-16 bg-green-50 text-green-500 rounded-full flex items-center justify-center">
                                        <CheckCircle2 size={32} />
                                    </div>
                                </div>
                                <button
                                    onClick={() => setMode('login')}
                                    className="flex w-full justify-center gap-2 items-center rounded-xl border border-slate-200 bg-white py-3 px-4 text-sm font-medium text-slate-600 shadow-sm hover:bg-slate-50 transition-all"
                                >
                                    <ArrowLeft size={16} />
                                    Volver al inicio
                                </button>
                            </div>
                        ) : (
                            <form onSubmit={
                                mode === 'login' ? handleLogin : 
                                mode === 'signup' ? handleSignup : 
                                mode === 'forgot' ? handleForgotPassword : 
                                handleUpdatePassword
                            } className="space-y-5">
                                {mode === 'signup' && (
                                    <div className="animate-[slideDown_0.3s_ease-out]">
                                        <label className="block text-sm font-medium text-slate-700">Nombre completo</label>
                                        <div className="mt-1 relative group">
                                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 group-focus-within:text-skin-accent transition-colors">
                                                <User size={18} />
                                            </div>
                                            <input
                                                type="text"
                                                required
                                                value={fullName}
                                                onChange={(e) => setFullName(e.target.value)}
                                                className="block w-full appearance-none rounded-xl border border-slate-300 pl-10 pr-4 py-3 placeholder-slate-400 focus:border-skin-accent focus:outline-none focus:ring-1 focus:ring-skin-accent sm:text-sm shadow-sm transition-all"
                                                placeholder="Tu nombre completo"
                                            />
                                        </div>
                                    </div>
                                )}

                                <div>
                                    {(mode === 'login' || mode === 'signup' || mode === 'forgot') && (
                                        <label className="block text-sm font-medium text-slate-700">Correo electrónico</label>
                                    )}
                                    {mode !== 'update-password' && (
                                        <div className="mt-1 relative group">
                                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 group-focus-within:text-skin-accent transition-colors">
                                                <Mail size={18} />
                                            </div>
                                            <input
                                                type="email"
                                                required
                                                value={email}
                                                onChange={(e) => setEmail(e.target.value)}
                                                className="block w-full appearance-none rounded-xl border border-slate-300 pl-10 pr-4 py-3 placeholder-slate-400 focus:border-skin-accent focus:outline-none focus:ring-1 focus:ring-skin-accent sm:text-sm shadow-sm transition-all"
                                                placeholder="manager@skinberries.com"
                                            />
                                        </div>
                                    )}
                                </div>

                                {(mode !== 'forgot') && (
                                    <>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700">Contraseña</label>
                                            <div className="mt-1 relative group">
                                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 group-focus-within:text-skin-accent transition-colors">
                                                    <Lock size={18} />
                                                </div>
                                                <input
                                                    type={showPassword ? 'text' : 'password'}
                                                    required
                                                    value={password}
                                                    onChange={(e) => setPassword(e.target.value)}
                                                    className="block w-full appearance-none rounded-xl border border-slate-300 pl-10 pr-12 py-3 placeholder-slate-400 focus:border-skin-accent focus:outline-none focus:ring-1 focus:ring-skin-accent sm:text-sm shadow-sm transition-all"
                                                    placeholder="••••••••"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setShowPassword(!showPassword)}
                                                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-skin-accent transition-colors"
                                                >
                                                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                                </button>
                                            </div>
                                        </div>

                                        {(mode === 'signup' || mode === 'update-password') && (
                                            <div className="animate-[slideDown_0.3s_ease-out]">
                                                <label className="block text-sm font-medium text-slate-700">Confirmar contraseña</label>
                                                <div className="mt-1 relative group">
                                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 group-focus-within:text-skin-accent transition-colors">
                                                        <Lock size={18} />
                                                    </div>
                                                    <input
                                                        type={showPassword ? 'text' : 'password'}
                                                        required
                                                        value={confirmPassword}
                                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                                        className="block w-full appearance-none rounded-xl border border-slate-300 pl-10 pr-4 py-3 placeholder-slate-400 focus:border-skin-accent focus:outline-none focus:ring-1 focus:ring-skin-accent sm:text-sm shadow-sm transition-all"
                                                        placeholder="••••••••"
                                                    />
                                                </div>
                                            </div>
                                        )}
                                    </>
                                )}

                                {error && (
                                    <div className="text-red-500 text-xs font-semibold p-3 bg-red-50 border border-red-100 rounded-xl animate-[shake_0.4s_ease-in-out]">
                                        {error}
                                    </div>
                                )}

                                {mode === 'login' && (
                                    <div className="flex items-center justify-end">
                                        <button
                                            type="button"
                                            onClick={() => { setMode('forgot'); resetMessages(); }}
                                            className="text-xs font-semibold text-skin-accent hover:text-pink-700 transition-colors"
                                        >
                                            ¿Olvidaste tu contraseña?
                                        </button>
                                    </div>
                                )}

                                <div>
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="group relative flex w-full justify-center rounded-xl border border-transparent bg-skin-accent py-3.5 px-4 text-sm font-bold text-white shadow-lg shadow-skin-accent/30 hover:bg-pink-700 focus:outline-none focus:ring-2 focus:ring-skin-accent focus:ring-offset-2 transition-all disabled:opacity-70 disabled:cursor-not-allowed overflow-hidden"
                                    >
                                        <span className="relative z-10 flex items-center gap-2">
                                            {loading ? (
                                                <Loader2 className="animate-spin" size={20} />
                                            ) : (
                                                <>
                                                    {mode === 'login' ? 'Iniciar Sesión' : 
                                                     mode === 'signup' ? 'Crear Cuenta' : 
                                                     mode === 'forgot' ? 'Enviar Instrucciones' : 
                                                     'Guardar Nueva Contraseña'}
                                                    {mode === 'forgot' && <Send size={16} />}
                                                </>
                                            )}
                                        </span>
                                        <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                    </button>
                                </div>

                                <div className="text-center mt-6">
                                    {(mode === 'login' || mode === 'signup') && (
                                        <p className="text-xs text-slate-500">
                                            {mode === 'login' ? '¿No tienes una cuenta?' : '¿Ya tienes una cuenta?'}{' '}
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setMode(mode === 'login' ? 'signup' : 'login');
                                                    resetMessages();
                                                } }
                                                className="font-bold text-skin-accent hover:underline decoration-2 underline-offset-4"
                                            >
                                                {mode === 'login' ? 'Regístrate aquí' : 'Inicia Sesión'}
                                            </button>
                                        </p>
                                    )}
                                    {(mode === 'forgot' || mode === 'update-password') && (
                                        <button
                                            type="button"
                                            onClick={() => { setMode('login'); resetMessages(); }}
                                            className="text-xs font-bold text-skin-accent hover:underline decoration-2 underline-offset-4 flex items-center gap-1 justify-center"
                                        >
                                            <ArrowLeft size={14} /> Volver al Inicio
                                        </button>
                                    )}
                                </div>
                            </form>
                        )}
                    </div>
                </div>
            </div>

            {/* Right side: Image */}
            <div className="relative hidden w-0 flex-1 lg:block overflow-hidden bg-white">
                <div className="absolute inset-0 bg-gradient-to-r from-skin-bg/40 to-transparent z-10 pointer-events-none"></div>
                <img
                    className={`absolute inset-0 h-full w-full object-cover transition-transform duration-[20000ms] ease-out ${isMounted ? 'scale-[1.15] translate-x-4' : 'scale-100 translate-x-0'}`}
                    src="/login-bg.jpg"
                    alt="Skin & Berries Premium"
                />
                
                {/* Floating Brand Badge */}
                <div className="absolute bottom-12 right-12 z-20 animate-[slideUp_1s_ease-out]">
                    <div className="bg-white/80 backdrop-blur-md p-6 rounded-3xl shadow-2xl border border-white/50 max-w-xs">
                        <p className="text-skin-accent font-bold text-xs uppercase tracking-widest mb-1">Skin & Berries</p>
                        <p className="text-slate-800 font-medium text-lg leading-tight italic">"el skincare coreano que amas"</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

