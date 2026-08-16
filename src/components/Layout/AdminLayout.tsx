import React, { useState } from "react";
import { 
  LayoutDashboard, 
  Users, 
  DollarSign, 
  AlertTriangle, 
  ShieldCheck, 
  Settings,
  LogOut,
  Bell,
  X,
  Menu,
  Video,
  BookOpen,
  ChevronRight,
  MessageSquare
} from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import logoTransparentImg from "../../assets/logo-transparent.png";
import { useAuth } from "../../contexts/AuthContext";

const adminMenuItems = [
  { icon: LayoutDashboard, label: "Visão Geral", path: "/admin" },
  { icon: Users, label: "Usuários", path: "/admin/usuarios" },
  { icon: DollarSign, label: "Assinaturas", path: "/admin/financeiro" },
  { icon: AlertTriangle, label: "Moderação", path: "/admin/moderacao" },
  { icon: ShieldCheck, label: "Cursos", path: "/admin/cursos" },
  { icon: Video, label: "Lives", path: "/admin/lives" },
  { icon: BookOpen, label: "Biblioteca", path: "/admin/biblioteca" },
  { icon: MessageSquare, label: "Comunidade", path: "/comunidade" },
  { icon: Settings, label: "Configurações", path: "/admin/config" },
];

const AdminSidebar = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { profile } = useAuth();

  const filteredMenuItems = adminMenuItems.filter(item => {
    if (profile?.role === 'admin') return true;
    if (profile?.role === 'partner' || profile?.role === 'pj') {
      return item.path === '/admin/financeiro' || item.path === '/comunidade';
    }
    return false;
  });

  const userDisplayName = profile?.full_name || "Membro da Equipe";
  const userRoleLabel = profile?.role === 'admin' 
    ? 'Acesso Total' 
    : profile?.role === 'partner' 
    ? 'Sócio' 
    : 'Parceiro PJ';
  const userTitle = profile?.role === 'admin' 
    ? 'Administrador Master' 
    : profile?.role === 'partner' 
    ? 'Sócio Banana PRO' 
    : 'Prestador PJ';

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9998] lg:hidden"
          onClick={onClose}
        />
      )}

      <aside className={`
        fixed inset-y-0 left-0 w-72 sidebar-premium text-white flex flex-col h-[100dvh] transition-transform duration-300 lg:translate-x-0
        ${isOpen ? "translate-x-0 z-[9999]" : "-translate-x-full lg:translate-x-0 z-50"}
      `}>
        {/* Header com Logotipo Transparente Anexado */}
        <div className="py-6 px-6 flex items-center justify-between relative border-b border-emerald-950/30">
          <div className="relative">
            <Link to="/admin" className="flex items-center justify-center w-44 h-12 group hover:scale-[1.02] transition-transform">
              <img src={logoTransparentImg} alt="Banana PRO" className="h-full w-full object-contain" />
            </Link>
            <span className="absolute -top-2 -right-4 bg-emerald-600 text-white text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest shadow-md">Painel</span>
          </div>
          <button onClick={onClose} className="lg:hidden text-white/80 hover:text-white cursor-pointer p-1">
            <LogOut className="w-5 h-5 rotate-180" />
          </button>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto min-h-0 scrollbar-thin">
          {filteredMenuItems.map((item) => {
            const isActive = location.pathname === item.path || 
              (item.path !== "/admin" && location.pathname.startsWith(item.path));
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={onClose}
                className={`flex items-center justify-between px-4 py-3 rounded-xl transition-all group border border-transparent ${
                  isActive 
                    ? "sidebar-item-active font-semibold" 
                    : "text-white/70 hover:bg-white/5 hover:text-white"
                }`}
              >
                <div className="flex items-center gap-3">
                  <item.icon size={18} className={isActive ? "text-emerald-400" : "text-white/60 group-hover:text-white transition-colors"} />
                  <span className="text-sm font-medium tracking-wide">{item.label}</span>
                </div>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-emerald-950/30 space-y-3">
          {/* Card do Usuário Admin */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-950/20 hover:bg-emerald-950/40 border border-emerald-950/40 transition-all group/profile">
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="w-10 h-10 rounded-full border border-emerald-500/20 p-[2px] bg-emerald-900/10 overflow-hidden shrink-0">
                <img 
                  src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${userDisplayName}`}
                  alt="Admin Avatar" 
                  className="w-full h-full object-cover rounded-full"
                />
              </div>
              <div className="overflow-hidden">
                <p className="text-xs font-bold text-white/70 group-hover/profile:text-white transition-colors truncate leading-snug">{userDisplayName}</p>
                <p className="text-[9px] text-emerald-400 uppercase tracking-wider font-extrabold mt-0.5">{userRoleLabel}</p>
                <p className="text-[9px] text-white/50 truncate mt-0.5">{userTitle}</p>
              </div>
            </div>
          </div>

          {/* Sair da Conta */}
          <button 
            onClick={() => navigate("/admin/login")}
            className="w-full flex items-center gap-2.5 px-4 py-2.5 text-white/50 hover:text-red-400 hover:bg-red-500/5 rounded-xl transition-all text-xs group cursor-pointer"
          >
            <LogOut size={16} className="group-hover:rotate-6 transition-transform" />
            <span className="font-semibold">Encerrar Sessão</span>
          </button>
        </div>
      </aside>
    </>
  );
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const location = useLocation();
  const hasTransparentHeader = location.pathname === "/comunidade";

  return (
    <div className="flex min-h-screen bg-background text-on-surface font-sans overflow-x-hidden">
      <AdminSidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      
      <div className="flex-1 flex flex-col min-w-0 lg:pl-72">
        {/* Admin Navbar */}
        <header className={
          hasTransparentHeader 
            ? "h-20 px-4 md:px-8 flex items-center justify-between absolute top-0 right-0 left-0 lg:left-72 bg-transparent z-40 border-none"
            : "h-20 border-b border-outline/10 px-4 md:px-8 flex items-center justify-between sticky top-0 bg-background/80 backdrop-blur-md z-40"
        }>
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className={`sidebar-toggle-btn lg:hidden p-2.5 transition-colors rounded-xl border cursor-pointer ${
                hasTransparentHeader 
                  ? "bg-emerald-500/10 border-emerald-500/25 text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/20" 
                  : "bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20"
              }`}
            >
              <Menu size={22} className={hasTransparentHeader ? "text-emerald-400" : "text-emerald-600 dark:text-emerald-400"} />
            </button>
          </div>

          <div className="flex items-center gap-3 md:gap-6">
            <button className={`relative p-2 transition-colors cursor-pointer ${
              hasTransparentHeader 
                ? "text-white/80 hover:text-white" 
                : "text-on-surface-variant hover:text-on-surface"
            }`}>
              <Bell size={22} />
              <span className="absolute top-2 right-2 w-2 h-2 bg-emerald-600 rounded-full" />
            </button>
            
            <div className={`h-8 w-[1px] hidden sm:block ${hasTransparentHeader ? "bg-white/10" : "bg-outline/20"}`} />
            
            <div className="hidden xs:flex flex-col items-end">
              <span className={`text-[10px] font-black uppercase tracking-widest ${hasTransparentHeader ? "text-emerald-400" : "text-emerald-500"}`}>Servidor</span>
              <span className={`text-xs font-bold ${hasTransparentHeader ? "text-[#6ee7b7]" : "text-emerald-400"}`}>ATIVO</span>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <main className={`flex-1 overflow-y-auto ${hasTransparentHeader ? "p-0" : "p-4 md:p-8"}`}>
          {children}
        </main>
      </div>
    </div>
  );
}
