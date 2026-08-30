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
      let { data, error } = await (supabase as any)
        .from('my_profile')
        .select('*')
        .maybeSingle() as any;

      console.log('Auth: Direct fetch data:', data, 'error:', error);

      if (!data && email) {
        console.log('Auth: Fallback fetch using email:', email);
        const { data: emailData, error: emailError } = await (supabase as any)
          .from('user_profiles')
          .select('id, mocha_user_id, email, full_name, avatar_url, role, city, state, is_active, created_at')
          .ilike('email', email)
          .maybeSingle() as any;
        console.log('Auth: Fallback fetch data:', emailData, 'error:', emailError);
        data = emailData;
        if (data) {
          console.log('Auth: Updating mocha_user_id to', userId, 'for profile ID', data.id);
          (supabase as any).from('user_profiles').update({ mocha_user_id: userId }).eq('id', data.id).then(({ error: updateError }: any) => {
            if (updateError) console.error('Auth: Error updating mocha_user_id:', updateError);
          });
        }
      }

      if (data) {
        // Enforce Grace Period Check
        if (data.is_active && data.role !== 'admin') {
          try {
            const { data: orders, error: ordersError } = await supabase
              .from('orders')
              .select('*')
              .eq('user_id', data.id);

            if (!ordersError && orders && orders.length > 0) {
              const now = new Date();
              // Check if there is at least one active order (either paid or cancelled) that is still within its validity period
              const hasActiveOrder = orders.some(o => {
                if (o.status !== 'paid' && o.status !== 'cancelled') return false;
                
                const isMonthly = o.total_amount <= 150;
                const daysLimit = isMonthly ? 30 : 365;
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
    } catch (err) {
      console.error('Auth: Error fetching profile:', err);
      setProfile(null);
    } finally {
      setProfileLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;

    // Confiamos apenas no onAuthStateChange para inicializar tudo
    // Ele dispara INITIAL_SESSION automaticamente na montagem
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, currentSession) => {
      console.log('Auth: State change event:', event);
      
      if (!isMounted) return;

      const currentUser = currentSession?.user ?? null;
      setSession(currentSession);
      setUser(currentUser);

      if (currentUser && (event === 'SIGNED_IN' || event === 'INITIAL_SESSION' || event === 'TOKEN_REFRESHED')) {
        // Buscamos o perfil mas não bloqueamos o fluxo principal
        fetchProfile(currentUser.id, currentUser.email);
      } else if (event === 'SIGNED_OUT') {
        setProfile(null);
      }

      // IMPORTANTE: Liberamos o loading inicial assim que o usuário (ou falta dele) é identificado
      setLoading(false);
    });

    // Segurança: Se nada acontecer em 6 segundos, libera a tela
    const timeout = setTimeout(() => {
      if (isMounted && loadingRef.current) {
        console.warn('Auth: Timeout reached, forcing loading to false');
        setLoading(false);
      }
    }, 6000);

    return () => {
      isMounted = false;
      clearTimeout(timeout);
      subscription.unsubscribe();
    };
  }, []);

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
