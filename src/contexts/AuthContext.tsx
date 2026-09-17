import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { Tables } from '../types/database';

type Profile = Tables<'user_profiles'>;

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  session: Session | null;
  loading: boolean;
  profileLoading: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [profileLoading, setProfileLoading] = useState(false);
  const loadingRef = React.useRef(true);

  // Sync ref with state
  useEffect(() => {
    loadingRef.current = loading;
  }, [loading]);

  const fetchProfile = async (userId: string, email?: string) => {
    setProfileLoading(true);
    try {
      console.log('Auth: Fetching profile for', userId, 'with email', email);
      
      // 1. Busca direta pelo mocha_user_id
      let { data, error } = await (supabase as any)
        .from('user_profiles')
        .select('*')
        .eq('mocha_user_id', userId)
        .maybeSingle() as any;

      // 2. Fallback por email caso o mocha_user_id ainda não tenha sido vinculado
      if (!data && email) {
        console.log('Auth: Fallback fetch using email:', email);
        const { data: emailData } = await (supabase as any)
          .from('user_profiles')
          .select('*')
          .ilike('email', email)
          .maybeSingle() as any;
        
        data = emailData;
        if (data) {
          console.log('Auth: Updating mocha_user_id to', userId, 'for profile ID', data.id);
          (supabase as any)
            .from('user_profiles')
            .update({ mocha_user_id: userId })
            .eq('id', data.id)
            .then();
        }
      }

      if (data) {
        // Enforce Grace Period Check only for regular subscribers (not admin, partner or pj)
        if (data.is_active && data.role !== 'admin' && data.role !== 'partner' && data.role !== 'pj') {
          try {
            const { data: orders, error: ordersError } = await supabase
              .from('orders')
              .select('*')
              .eq('user_id', data.id);

            if (!ordersError && orders && orders.length > 0) {
              const now = new Date();
              const hasActiveOrder = orders.some(o => {
                if (o.status !== 'paid' && o.status !== 'cancelled') return false;
                
                const amount = Number(o.total_amount);
                const daysLimit = amount <= 250 ? 90 : (amount <= 400 ? 180 : 365);
                const orderDate = new Date(o.created_at);
                const expiryDate = new Date(orderDate.getTime() + daysLimit * 24 * 60 * 60 * 1000);
                
                return now <= expiryDate;
              });

              if (!hasActiveOrder) {
                console.log('Auth: No active paid or cancelled orders in grace period found. Updating profile to inactive...');
                const { error: updateError } = await supabase
                  .from('user_profiles')
                  .update({ is_active: false })
                  .eq('id', data.id);

                if (!updateError) {
                  data.is_active = false;
                }
              }
            }
          } catch (graceErr) {
            console.error('Auth: Error enforcing grace period:', graceErr);
          }
        }

        const { data: areasData } = await supabase
          .from('producer_areas')
          .select('property_name')
          .eq('user_id', data.id)
          .order('created_at', { ascending: true })
          .limit(1);

        if (areasData && areasData.length > 0 && areasData[0].property_name) {
          (data as any).property_name = areasData[0].property_name;
        }
      }

      setProfile(data);
      return data;
    } catch (err) {
      console.error('Auth: Error fetching profile:', err);
      setProfile(null);
      return null;
    } finally {
      setProfileLoading(false);
    }
  };

  // Efeito para escutar mudanças de autenticação sem travar em mutex interno
  useEffect(() => {
    let isMounted = true;

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, currentSession) => {
      console.log('Auth: State change event:', event);
      
      if (!isMounted) return;

      const currentUser = currentSession?.user ?? null;
      setSession(currentSession);
      setUser(currentUser);

      if (!currentUser) {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  // Efeito dedicado para carregar o perfil do usuário ativo
  useEffect(() => {
    let isCancelled = false;

    if (user) {
      fetchProfile(user.id, user.email).finally(() => {
        if (!isCancelled) {
          setLoading(false);
        }
      });
    }

    // Fallback de segurança para nunca travar tela
    const timeout = setTimeout(() => {
      if (!isCancelled && loadingRef.current) {
        setLoading(false);
      }
    }, 4000);

    return () => {
      isCancelled = true;
      clearTimeout(timeout);
    };
  }, [user?.id, user?.email]);

  const signOut = async () => {
    await supabase.auth.signOut();
    setProfile(null);
    setUser(null);
    setSession(null);
  };

  const refreshProfile = async () => {
    if (user) await fetchProfile(user.id, user.email);
  };

  return (
    <AuthContext.Provider value={{ user, profile, session, loading, profileLoading, signOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) throw new Error('useAuth error');
  return context;
}
