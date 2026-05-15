import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { logAction } from '../utils/logger';
import type { User } from '@supabase/supabase-js';
import type { Database } from '../types/supabase';

type Profile = Database['public']['Tables']['profiles']['Row'];

type AuthContextType = {
    user: User | null;
    profile: Profile | null;
    loading: boolean;
    refreshProfile: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({ user: null, profile: null, loading: true, refreshProfile: async () => {} });

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [profile, setProfile] = useState<Profile | null>(null);
    const [loading, setLoading] = useState(true);
    const lastUserRef = useRef<string | null>(null);
    const profileSubscriptionRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

    useEffect(() => {
        let isMounted = true;

        const fetchAndSetProfile = async (currentUser: User) => {
            const { data } = await supabase.from('profiles').select('*').eq('id', currentUser.id).single();

            if (!isMounted) return;

            if (data && data.is_active === false) {
                await supabase.auth.signOut();
                setUser(null);
                setProfile(null);
                lastUserRef.current = null;
                profileSubscriptionRef.current?.unsubscribe();
                profileSubscriptionRef.current = null;
            } else {
                setUser(currentUser);
                setProfile(data || null);

                // Setup realtime subscription for this profile if not already set
                if (!profileSubscriptionRef.current) {
                    profileSubscriptionRef.current = supabase
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
        };

        // Initial session load
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (!isMounted) return;
            const currentUser = session?.user ?? null;
            if (currentUser) {
                logAction('LOGIN', { email: currentUser.email });
                lastUserRef.current = currentUser.id;
                fetchAndSetProfile(currentUser);
            } else {
                setUser(null);
                setProfile(null);
                setLoading(false);
            }
        });

        // Listen for auth state changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            if (!isMounted) return;

            const currentUser = session?.user ?? null;

            // TOKEN_REFRESHED, SIGNED_IN when tab regains focus: skip if same user to avoid
            // re-fetching data and resetting in-progress form states in other components.
            if (
                (event === 'TOKEN_REFRESHED' || event === 'SIGNED_IN') &&
                currentUser?.id === lastUserRef.current
            ) {
                return;
            }

            if (currentUser) {
                // New login or user switch
                if (currentUser.id !== lastUserRef.current) {
                    logAction('LOGIN', { email: currentUser.email });
                    lastUserRef.current = currentUser.id;
                    // Clean up previous subscription before setting up a new one
                    profileSubscriptionRef.current?.unsubscribe();
                    profileSubscriptionRef.current = null;
                }
                fetchAndSetProfile(currentUser);
            } else {
                // Logout
                if (lastUserRef.current) {
                    logAction('LOGOUT');
                }
                lastUserRef.current = null;
                profileSubscriptionRef.current?.unsubscribe();
                profileSubscriptionRef.current = null;
                setUser(null);
                setProfile(null);
                setLoading(false);
            }
        });

        return () => {
            isMounted = false;
            subscription.unsubscribe();
            profileSubscriptionRef.current?.unsubscribe();
        };
    }, []);

    const refreshProfile = async () => {
        if (!user) return;
        const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();
        if (data) {
            setProfile(data);
        }
    };

    return (
        <AuthContext.Provider value={{ user, profile, loading, refreshProfile }}>
            {children}
        </AuthContext.Provider>
    );
};
