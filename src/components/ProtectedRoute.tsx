import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Loader2 } from 'lucide-react';

export function ProtectedRoute({ 
  children, 
  adminOnly = false,
  allowedRoles
}: { 
  children: React.ReactNode;
  adminOnly?: boolean;
  allowedRoles?: string[];
}) {
  const { user, profile, loading, profileLoading, refreshProfile } = useAuth();
  const location = useLocation();

  const refreshedRef = React.useRef(false);

  // Efeito para recarregar o perfil silenciosamente se veio da confirmação de pagamento
  React.useEffect(() => {
    if (user && profile && !profile.is_active && location.search.includes('payment_confirmed')) {
      if (refreshedRef.current) return;
      refreshedRef.current = true;

      console.log("ProtectedRoute: Detectada confirmação de pagamento recente. Limpando caches e recarregando perfil...");
      
      // Limpa caches do navegador para evitar dados agronômicos antigos em cache
      if ('caches' in window) {
        caches.keys().then(keys => {
          for (const key of keys) {
            caches.delete(key);
          }
        });
      }
      
      refreshProfile();
    }
  }, [user, profile, location.search, refreshProfile]);

  // 1. Carregamento inicial do Usuário e Perfil
  if (loading || profileLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center flex-col gap-4">
        <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
        <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest">Carregando...</p>
      </div>
    );
  }

  // 2. Se não houver usuário, redireciona para login
  if (!user) {
    if (location.pathname.startsWith('/admin')) {
      return <Navigate to="/admin/login" state={{ from: location }} replace />;
    }
    return <Navigate to="/auth/login" state={{ from: location }} replace />;
  }

  // 3. Verificações de permissão e assinatura ativa
  if (allowedRoles) {
    if (!profile?.role || !allowedRoles.includes(profile.role)) {
      return <Navigate to="/dashboard" replace />;
    }
  } else if (adminOnly) {
    if (profile?.role !== 'admin') {
      return <Navigate to="/dashboard" replace />;
    }
  } else {
    // Usuários comuns precisam ter assinatura ativa (is_active === true)
    const hasPaymentParams = location.search.includes('payment_id') || 
                             location.search.includes('preapproval_id') ||
                             location.search.includes('preference_id') ||
                             location.search.includes('collection_id') ||
                             location.search.includes('payment_confirmed');

    if (
      profile?.role !== 'admin' && 
      profile?.role !== 'partner' && 
      profile?.role !== 'pj' && 
      profile?.is_active !== true && 
      !hasPaymentParams
    ) {
      return <Navigate to="/checkout" replace />;
    }
  }

  // 4. Se chegou aqui, está autorizado
  return <>{children}</>;
}
