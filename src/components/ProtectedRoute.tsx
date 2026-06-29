import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Loader2 } from 'lucide-react';

export function ProtectedRoute({ 
  children, 
  adminOnly = false 
}: { 
  children: React.ReactNode;
  adminOnly?: boolean;
}) {
  const { user, profile, loading, profileLoading } = useAuth();
  const location = useLocation();

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
  if (adminOnly) {
    if (profile?.role !== 'admin') {
      return <Navigate to="/dashboard" replace />;
    }
  } else {
    // Usuários comuns precisam ter assinatura ativa (is_active === true)
    if (profile?.role !== 'admin' && profile?.is_active !== true) {
      return <Navigate to="/checkout" replace />;
    }
  }

  // 4. Se chegou aqui, está autorizado
  return <>{children}</>;
}
