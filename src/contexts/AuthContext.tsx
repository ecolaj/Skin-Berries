import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { User } from '@supabase/supabase-js';

type AuthContextType = {
    user: User | null;
    loading: boolean;
};

const AuthContext = createContext<AuthContextType>({ user: null, loading: true });

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let isMounted = true;

        const checkUserStatus = async (currentUser: User | null) => {
            if (!currentUser) {
                if (isMounted) {
                    setUser(null);
                    setLoading(false);
                }
                return;
            }

            // Check if user is active in DB
            const { data } = await supabase.from('profiles').select('is_active').eq('id', currentUser.id).single();
            
            if (isMounted) {
                if (data && data.is_active === false) {
                    // Si está inactivo, forzamos cierre de sesión
                    await supabase.auth.signOut();
                    setUser(null);
                } else {
                    setUser(currentUser);
                }
                setLoading(false);
            }
        };

        supabase.auth.getSession().then(({ data: { session } }) => {
            checkUserStatus(session?.user ?? null);
        });

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            checkUserStatus(session?.user ?? null);
        });

        return () => {
            isMounted = false;
            subscription.unsubscribe();
        };
    }, []);

    return (
        <AuthContext.Provider value={{ user, loading }}>
            {children}
        </AuthContext.Provider>
    );
};
