import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { User } from '@supabase/supabase-js';
import type { Database } from '../types/supabase';

type Profile = Database['public']['Tables']['profiles']['Row'];

type AuthContextType = {
    user: User | null;
    profile: Profile | null;
    loading: boolean;
};

const AuthContext = createContext<AuthContextType>({ user: null, profile: null, loading: true });

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [profile, setProfile] = useState<Profile | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let isMounted = true;
        let profileSubscription: ReturnType<typeof supabase.channel> | null = null;

        const checkUserStatus = async (currentUser: User | null) => {
            if (!currentUser) {
                if (isMounted) {
                    setUser(null);
                    setProfile(null);
                    setLoading(false);
                    if (profileSubscription) {
                        profileSubscription.unsubscribe();
                        profileSubscription = null;
                    }
                }
                return;
            }

            // Check profile in DB
            const { data } = await supabase.from('profiles').select('*').eq('id', currentUser.id).single();
            
            if (isMounted) {
                if (data && data.is_active === false) {
                    await supabase.auth.signOut();
                    setUser(null);
                    setProfile(null);
                } else {
                    setUser(currentUser);
                    setProfile(data || null);

                    // Setup realtime subscription for this profile if not already set
                    if (!profileSubscription) {
                        profileSubscription = supabase
                            .channel(`profile_${currentUser.id}`)
                            .on('postgres_changes', 
                                { event: 'UPDATE', schema: 'public', table: 'profiles', filter: `id=eq.${currentUser.id}` }, 
                                (payload) => {
                                    if (isMounted) setProfile(payload.new as Profile);
                                }
                            )
                            .subscribe();
                    }
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
            if (profileSubscription) profileSubscription.unsubscribe();
        };
    }, []);

    return (
        <AuthContext.Provider value={{ user, profile, loading }}>
            {children}
        </AuthContext.Provider>
    );
};
