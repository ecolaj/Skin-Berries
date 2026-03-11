import React, { useState, useRef, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { X, Loader2, Camera, UserCircle } from 'lucide-react';
import type { Database } from '../types/supabase';
import type { User } from '@supabase/supabase-js';

type ProfileRow = Database['public']['Tables']['profiles']['Row'];

interface ProfileModalProps {
    isOpen: boolean;
    onClose: () => void;
    user: User | null;
    onProfileUpdated: () => void;
    viewOnly?: boolean;
    userEmail?: string;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({ 
    isOpen, 
    onClose, 
    user, 
    onProfileUpdated,
    viewOnly = false,
    userEmail
}) => {
    const [profile, setProfile] = useState<ProfileRow | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    
    const [fullName, setFullName] = useState('');
    const [jobTitle, setJobTitle] = useState('');
    const [avatarUrl, setAvatarUrl] = useState('');
    const [avatarFile, setAvatarFile] = useState<File | null>(null);
    const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
    
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isOpen && user) {
            fetchProfile();
        }
    }, [isOpen, user]);

    const fetchProfile = async () => {
        if (!user) return;
        setLoading(true);
        const { data } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id || (user as any).id)
            .single();
            
        if (data) {
            setProfile(data);
            setFullName(data.full_name || '');
            setJobTitle(data.job_title || '');
            setAvatarUrl(data.avatar_url || '');
            setAvatarPreview(data.avatar_url || null);
        }
        setLoading(false);
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setAvatarFile(file);
            const objectUrl = URL.createObjectURL(file);
            setAvatarPreview(objectUrl);
        }
    };

    const handleSave = async () => {
        if (!user || !profile) return;
        setSaving(true);
        
        try {
            let finalAvatarUrl = avatarUrl;
            
            // Upload new avatar if selected
            if (avatarFile) {
                const fileExt = avatarFile.name.split('.').pop();
                const fileName = `${user.id}-${Math.random()}.${fileExt}`;
                const filePath = `${fileName}`;
                
                const { error: uploadError } = await supabase.storage
                    .from('avatars')
                    .upload(filePath, avatarFile, { upsert: true });
                    
                if (uploadError) throw uploadError;
                
                const { data } = supabase.storage.from('avatars').getPublicUrl(filePath);
                finalAvatarUrl = data.publicUrl;
            }
            
            // Update profile
            const { error: updateError } = await supabase
                .from('profiles')
                .update({
                    full_name: fullName,
                    job_title: jobTitle,
                    avatar_url: finalAvatarUrl
                })
                .eq('id', user.id);
                
            if (updateError) throw updateError;
            
            onProfileUpdated();
            onClose();
        } catch (error) {
            console.error('Error updating profile:', error);
            alert('Oh no, hubo un error al guardar tu perfil. Intenta de nuevo.');
        } finally {
            setSaving(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
            <div className="bg-white rounded-3xl shadow-xl w-full max-w-md overflow-hidden animate-fadeInScale">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-slate-50">
                    <div>
                        <h2 className="text-xl font-bold text-slate-800">{viewOnly ? 'Información de Usuario' : 'Mi Perfil'}</h2>
                        <p className="text-sm text-slate-500">{viewOnly ? 'Consulta los detalles de este colaborador.' : 'Personaliza cómo te ves en el sistema.'}</p>
                    </div>
                    <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200/50 rounded-full transition-colors">
                        <X size={20} />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-10 text-slate-400">
                            <Loader2 size={32} className="animate-spin mb-4" />
                            <p>Cargando información...</p>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {/* Avatar Section */}
                            <div className="flex flex-col items-center justify-center">
                                <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                                    <div className={`w-24 h-24 rounded-full overflow-hidden bg-slate-100 border-[3px] border-white shadow-md flex items-center justify-center ring-2 ring-skin-blush text-skin-accent transition-all ${!viewOnly ? 'group-hover:ring-skin-accent' : ''}`}>
                                        {avatarPreview ? (
                                            <img src={avatarPreview} alt="Avatar Preview" className="w-full h-full object-cover" />
                                        ) : (
                                            <UserCircle size={48} className="text-slate-300" />
                                        )}
                                    </div>
                                    {!viewOnly && (
                                        <div className="absolute inset-0 bg-black/40 rounded-full flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Camera size={24} className="text-white mb-1" />
                                        </div>
                                    )}
                                </div>
                                {!viewOnly && (
                                    <p className="text-sm text-slate-500 mt-3 font-medium cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                                        Cambiar Fotografía
                                    </p>
                                )}
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    className="hidden"
                                    accept="image/*"
                                    onChange={handleFileChange}
                                />
                            </div>

                            {/* Info Section */}
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-1.5 flex items-center justify-between">
                                        Correo Electrónico
                                        <span className="text-[10px] text-slate-400 font-normal">Solo lectura</span>
                                    </label>
                                    <div className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-100 text-slate-500 font-medium cursor-not-allowed text-sm flex items-center">
                                        {user?.email || userEmail}
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-1.5 flex items-center justify-between">
                                        Nombre Completo
                                        <span className="text-[10px] text-slate-400 font-normal">Requerido</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={fullName}
                                        onChange={(e) => setFullName(e.target.value)}
                                        placeholder="ej. Ana Martínez"
                                        disabled={viewOnly}
                                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-skin-blush focus:border-skin-accent transition-all text-slate-700 disabled:opacity-75 disabled:cursor-not-allowed"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                                        Rol o Puesto Oficial
                                    </label>
                                    <input
                                        type="text"
                                        value={jobTitle}
                                        onChange={(e) => setJobTitle(e.target.value)}
                                        placeholder="ej. Gerente de Inventario"
                                        disabled={viewOnly}
                                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-skin-blush focus:border-skin-accent transition-all text-slate-700 disabled:opacity-75 disabled:cursor-not-allowed"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                                        Nivel de Acceso (Lectura)
                                    </label>
                                    <div className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-100 text-slate-500 font-medium cursor-not-allowed uppercase text-xs flex items-center">
                                        {profile?.role === 'master' ? 'Master (Acceso Total)' : profile?.role === 'operador' ? 'Operador de Sistema' : 'Consulta e Historial'}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        disabled={saving || loading}
                        className="px-5 py-2 rounded-xl text-slate-600 font-medium hover:bg-slate-200 transition-colors disabled:opacity-50"
                    >
                        {viewOnly ? 'Cerrar' : 'Cancelar'}
                    </button>
                    {!viewOnly && (
                        <button
                            onClick={handleSave}
                            disabled={saving || loading}
                            className="flex items-center gap-2 bg-skin-dark text-white px-6 py-2 rounded-xl font-medium shadow-md hover:bg-skin-dark/90 transition-colors disabled:opacity-70"
                        >
                            {saving ? (
                                <>
                                    <Loader2 size={18} className="animate-spin" />
                                    Guardando...
                                </>
                            ) : (
                                'Guardar Cambios'
                            )}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};
