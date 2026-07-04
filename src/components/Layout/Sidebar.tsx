import React, { useLayoutEffect, useRef } from "react";
import { 
  LayoutDashboard, 
  Users, 
  GraduationCap, 
  Wallet, 
  Settings, 
  LogOut,
  ChevronRight,
  ChevronDown,
  Sprout,
  Package,
  Calendar,
  CloudSun,
  Camera,
  Tv,
  BookOpen,
  MessageCircle,
  Headphones,
  ShieldCheck
} from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import { useAuth } from "../../contexts/AuthContext";
import { getUserDisplayName } from "../../lib/utils";
import { useTranslation } from "react-i18next";
import logoTransparentImg from "../../assets/logo-transparent.png";

const MENU_ITEMS = [
  { icon: LayoutDashboard, labelKey: "nav.dashboard", defaultLabel: "Início", path: "/dashboard" },
  { icon: Users, labelKey: "nav.feed", defaultLabel: "Comunidade", path: "/comunidade" },
  { icon: GraduationCap, labelKey: "nav.courses", defaultLabel: "Treinamentos", path: "/cursos" },
  { icon: Tv, labelKey: "nav.lives", defaultLabel: "Lives ao Vivo", path: "/lives" },
  { icon: BookOpen, labelKey: "nav.library", defaultLabel: "Biblioteca Técnica", path: "/biblioteca" },
  { icon: Sprout, labelKey: "nav.soil", defaultLabel: "Análise de Solo", path: "/solo" },
  { icon: Wallet, labelKey: "nav.financial", defaultLabel: "Financeiro", path: "/financeiro" },
  { icon: Package, labelKey: "nav.inventory", defaultLabel: "Estoque", path: "/estoque" },
  { icon: CloudSun, labelKey: "nav.weather", defaultLabel: "Clima", path: "/clima" },
  { icon: Calendar, labelKey: "nav.calendar", defaultLabel: "Calendário Agrícola", path: "/calendario" },
  { icon: Camera, labelKey: "nav.diagnostic", defaultLabel: "Diagnóstico Visual", path: "/diagnostico" },
  { icon: Settings, labelKey: "nav.settings", defaultLabel: "Configurações", path: "/configuracoes" },
];

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, profile, signOut } = useAuth();
  const { t } = useTranslation();

  const navRef = useRef<HTMLElement>(null);

  useLayoutEffect(() => {
    const savedScroll = sessionStorage.getItem("sidebar-scroll-y");
    if (savedScroll && navRef.current) {
      navRef.current.scrollTop = Number(savedScroll);
    }
  }, []);

  const handleScroll = (e: React.UIEvent<HTMLElement>) => {
    sessionStorage.setItem("sidebar-scroll-y", String(e.currentTarget.scrollTop));
  };

  const handleLogout = async () => {
    await signOut();
    navigate("/auth/login");
  };

  const userDisplayName = getUserDisplayName(profile, user) || user?.user_metadata?.login || "Usuário";
  const userRole = profile?.role === 'admin' 
    ? "ADMINISTRADOR" 
    : profile?.role === 'partner' 
    ? "SÓCIO" 
    : profile?.role === 'pj' 
    ? "PARCEIRO PJ" 
    : "PRODUTOR";
  const farmName = profile?.property_name || "Fazenda São José";

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside className={`
        fixed inset-y-0 left-0 z-50 w-72 sidebar-premium text-white flex flex-col h-screen transition-transform duration-300 lg:translate-x-0
        ${isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
      `}>
        {/* Header com Logotipo Transparente Anexado */}
        <div className="py-6 px-6 flex items-center justify-between relative border-b border-emerald-950/30">
          <Link to="/dashboard" className="flex items-center justify-center w-44 h-12 group hover:scale-[1.02] transition-transform">
            <img src={logoTransparentImg} alt="Bananal PRO" className="h-full w-full object-contain" />
          </Link>
          <button onClick={onClose} className="lg:hidden text-white/80 hover:text-white cursor-pointer p-1">
            <LogOut className="w-5 h-5 rotate-180" />
          </button>
        </div>

        <nav 
          ref={navRef}
          onScroll={handleScroll}
          className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto min-h-0 scrollbar-thin"
        >
          {(() => {
            const menuItems = [...MENU_ITEMS];
            
            // Adiciona itens de Sócio/PJ dinamicamente
            if (profile?.role === 'admin' || profile?.role === 'partner' || profile?.role === 'pj') {
              const finIndex = menuItems.findIndex(i => i.path === '/financeiro');
              if (finIndex !== -1) {
                menuItems.splice(finIndex + 1, 0, {
                  icon: Wallet,
                  labelKey: "nav.sharing",
                  defaultLabel: "Rateio / Comissões",
                  path: "/admin/financeiro"
                });
              }

              const commIndex = menuItems.findIndex(i => i.path === '/comunidade');
              if (commIndex !== -1) {
                menuItems.splice(commIndex + 1, 0, {
                  icon: ShieldCheck,
                  labelKey: "nav.moderation",
                  defaultLabel: "Moderação",
                  path: "/admin/moderacao"
                });
              }
            }

            return menuItems.map((item) => {
              const isActive = location.pathname === item.path || 
                (item.path !== "/" && item.path !== "/dashboard" && location.pathname.startsWith(item.path));
              const isExternal = item.path.startsWith("http");
              
              const linkProps = isExternal 
                ? { href: item.path, target: "_blank", rel: "noopener noreferrer" } 
                : { to: item.path };
                
              const Tag = isExternal ? "a" : Link;

              return (
                <Tag
                  key={item.path}
                  {...linkProps}
                  onClick={onClose}
                  className={`flex items-center justify-between px-4 py-3 rounded-xl transition-all group border border-transparent ${
                    !isExternal && isActive 
                      ? "sidebar-item-active font-semibold" 
                      : "text-white/70 hover:bg-white/5 hover:text-white"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <item.icon size={18} className={!isExternal && isActive ? "text-emerald-400" : "text-white/60 group-hover:text-white transition-colors"} />
                    <span className="text-sm font-medium tracking-wide">{t(item.labelKey, item.defaultLabel)}</span>
                  </div>
                </Tag>
              );
            });
          })()}
        </nav>

        {/* Rodapé Reestilizado Fiel ao Layout */}
        <div className="p-4 border-t border-emerald-950/30 space-y-3">

          {/* Card do Usuário */}
          <Link 
            to="/perfil" 
            onClick={onClose} 
            className="flex items-center justify-between p-3 rounded-xl bg-emerald-950/20 hover:bg-emerald-950/40 border border-emerald-950/40 transition-all group/profile"
          >
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="w-10 h-10 rounded-full border border-emerald-500/20 p-[2px] bg-emerald-900/10 overflow-hidden shrink-0">
                <img 
                  src={profile?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${userDisplayName}`} 
                  alt="Avatar" 
                  className="w-full h-full object-cover rounded-full"
                />
              </div>
              <div className="overflow-hidden">
                <p className="text-xs font-bold text-white/70 group-hover/profile:text-white transition-colors truncate leading-snug">{userDisplayName}</p>
                <p className="text-[9px] text-emerald-400 uppercase tracking-wider font-extrabold mt-0.5">{userRole}</p>
                <p className="text-[9px] text-white/50 truncate mt-0.5">{farmName}</p>
              </div>
            </div>
            <ChevronDown size={14} className="text-white/40 group-hover/profile:text-white transition-colors shrink-0 ml-2" />
          </Link>

          <a 
            href="https://wa.me/5521969014654" 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center justify-between px-4 py-3 rounded-xl bg-emerald-500/5 hover:bg-emerald-500/10 border border-emerald-500/10 hover:border-emerald-500/20 text-white/80 hover:text-white transition-all text-xs group cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <Headphones size={15} className="text-emerald-400 group-hover:scale-110 transition-transform" />
              <div className="text-left">
                <p className="font-bold text-[10px] text-white">Precisa de ajuda?</p>
                <p className="text-[9px] text-white/50">Fale com nosso suporte</p>
              </div>
            </div>
            <ChevronRight size={12} className="text-white/40 group-hover:translate-x-0.5 transition-transform" />
          </a>

          {/* Sair da Conta */}
          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-2.5 px-4 py-2.5 text-white/50 hover:text-red-400 hover:bg-red-500/5 rounded-xl transition-all text-xs group cursor-pointer"
          >
            <LogOut size={16} className="group-hover:rotate-6 transition-transform" />
            <span className="font-semibold">Sair da Conta</span>
          </button>
        </div>
      </aside>
    </>
  );
}
