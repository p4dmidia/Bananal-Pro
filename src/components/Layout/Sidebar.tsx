import React, { useLayoutEffect, useRef, useState } from "react";
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
  ShieldCheck,
  X
} from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
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
  const [showSupportModal, setShowSupportModal] = useState(false);
  const [tourActiveStep, setTourActiveStep] = useState(0);

  const navRef = useRef<HTMLElement>(null);

  React.useEffect(() => {
    const handleStep = (e: Event) => {
      const customEvent = e as CustomEvent;
      setTourActiveStep(customEvent.detail || 0);
    };
    window.addEventListener("chico-tour-step", handleStep);
    return () => window.removeEventListener("chico-tour-step", handleStep);
  }, []);

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
      {(isOpen || tourActiveStep === 2) && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9998] lg:hidden"
          onClick={onClose}
        />
      )}

      <aside className={`
        fixed inset-y-0 left-0 w-72 sidebar-premium text-white flex flex-col h-[100dvh] transition-all duration-300 lg:translate-x-0
        ${isOpen || tourActiveStep === 2 ? "translate-x-0 z-[9999]" : "-translate-x-full lg:translate-x-0 z-50"}
        ${tourActiveStep === 2 
          ? "shadow-[0_0_50px_rgba(16,185,129,0.4)] border-r border-emerald-500/60 ring-4 ring-emerald-500/20" 
          : ""
        }
      `}>
        {/* Header com Logotipo Transparente Anexado */}
        <div className="py-6 px-6 flex items-center justify-between relative border-b border-emerald-950/30">
          <Link to="/dashboard" className="flex items-center justify-center w-44 h-12 group hover:scale-[1.02] transition-transform">
            <img src={logoTransparentImg} alt="Banana PRO" className="h-full w-full object-contain" />
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

          <button 
            onClick={() => setShowSupportModal(true)}
            className="w-full flex items-center justify-between px-4 py-3 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-400/30 hover:border-emerald-400/50 text-white transition-all text-xs group cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <Headphones size={15} className="text-emerald-350 group-hover:scale-110 transition-transform" />
              <div className="text-left">
                <p className="font-extrabold text-[10px] text-emerald-300 uppercase tracking-wider">Precisa de ajuda?</p>
                <p className="text-[9px] text-zinc-100 font-medium">Fale com nosso suporte</p>
              </div>
            </div>
            <ChevronRight size={12} className="text-zinc-200 group-hover:translate-x-0.5 transition-transform" />
          </button>

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

      {/* SUPPORT OPTIONS MODAL */}
      <AnimatePresence>
        {showSupportModal && (
          <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
            {/* Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowSupportModal(false)}
              className="fixed inset-0 bg-black/80 backdrop-blur-md"
            />

            {/* Modal Content */}
            <motion.div
              initial={{ scale: 0.95, y: 20, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.95, y: 20, opacity: 0 }}
              className="bg-zinc-950 border border-emerald-500/20 rounded-[2.5rem] w-full max-w-4xl p-6 md:p-8 relative z-10 overflow-hidden shadow-2xl space-y-6 font-sans text-white max-h-[90vh] overflow-y-auto"
            >
              {/* Close Button */}
              <button
                onClick={() => setShowSupportModal(false)}
                className="absolute top-6 right-6 p-2 rounded-full hover:bg-white/5 text-zinc-400 hover:text-white transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>

              {/* Title Header */}
              <div className="text-center space-y-2">
                <div className="mx-auto w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center text-emerald-400 shadow-md">
                  <Headphones size={24} />
                </div>
                <h3 className="text-2xl font-black font-headline tracking-tight text-white uppercase">
                  Central de Ajuda & Suporte
                </h3>
                <p className="text-sm text-zinc-400 max-w-xl mx-auto font-medium">
                  Selecione o especialista ideal para o seu tipo de dúvida e fale diretamente pelo WhatsApp.
                </p>
              </div>

              {/* Grid of Support Options */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* 1. Francisco */}
                <div className="bg-emerald-950/20 border border-emerald-950/40 rounded-3xl p-5 flex flex-col justify-between hover:border-emerald-500/30 transition-all hover:bg-emerald-950/30 relative overflow-hidden group">
                  <div className="flex gap-4">
                    <div className="w-14 h-14 rounded-2xl border border-emerald-500/25 p-[2px] bg-emerald-900/10 overflow-hidden shrink-0">
                      <img 
                        src="/images/francisco.jpeg" 
                        alt="Francisco" 
                        className="w-full h-full object-cover rounded-2xl group-hover:scale-105 transition-transform duration-300"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = `https://api.dicebear.com/7.x/avataaars/svg?seed=Francisco`;
                        }}
                      />
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-white text-base">Francisco</h4>
                        <span className="text-[8px] font-black uppercase px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                          Biológicos
                        </span>
                      </div>
                      <p className="text-[10px] text-zinc-400 font-extrabold uppercase tracking-wider">Especialista de Biológicos</p>
                      <p className="text-xs text-zinc-300 leading-normal">
                        Dúvidas sobre adubação orgânica, bioinsumos e manejo biológico? Fale com o Francisco para potencializar sua lavoura.
                      </p>
                    </div>
                  </div>
                  <a
                    href="https://wa.me/557599168766"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-4 flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 px-4 rounded-2xl text-xs uppercase tracking-wider transition-all shadow-md cursor-pointer"
                  >
                    <MessageCircle size={15} />
                    <span>Dúvidas sobre Biológico? Chame aqui</span>
                  </a>
                </div>

                {/* 2. Jhonatan */}
                <div className="bg-emerald-950/20 border border-emerald-950/40 rounded-3xl p-5 flex flex-col justify-between hover:border-emerald-500/30 transition-all hover:bg-emerald-950/30 relative overflow-hidden group">
                  <div className="flex gap-4">
                    <div className="w-14 h-14 rounded-2xl border border-emerald-500/25 p-[2px] bg-emerald-900/10 overflow-hidden shrink-0">
                      <img 
                        src="/images/jhonatan.jpeg" 
                        alt="Jhonatan" 
                        className="w-full h-full object-cover rounded-2xl group-hover:scale-105 transition-transform duration-300"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = `https://api.dicebear.com/7.x/avataaars/svg?seed=Jhonatan`;
                        }}
                      />
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-white text-base">Jhonatan</h4>
                        <span className="text-[8px] font-black uppercase px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                          Agrônomo
                        </span>
                      </div>
                      <p className="text-[10px] text-zinc-400 font-extrabold uppercase tracking-wider">Engenheiro Agrônomo</p>
                      <p className="text-xs text-zinc-300 leading-normal">
                        Problemas no plantio, sintomas de doenças, pragas ou adubação no campo? Fale direto com o nosso Agrônomo Jhonatan.
                      </p>
                    </div>
                  </div>
                  <a
                    href="https://wa.me/5527995759957"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-4 flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 px-4 rounded-2xl text-xs uppercase tracking-wider transition-all shadow-md cursor-pointer"
                  >
                    <MessageCircle size={15} />
                    <span>Dúvidas técnicas do campo! Fale aqui</span>
                  </a>
                </div>

                {/* 3. Jean Carlos */}
                <div className="bg-emerald-950/20 border border-emerald-950/40 rounded-3xl p-5 flex flex-col justify-between hover:border-emerald-500/30 transition-all hover:bg-emerald-950/30 relative overflow-hidden group">
                  <div className="flex gap-4">
                    <div className="w-14 h-14 rounded-2xl border border-emerald-500/25 p-[2px] bg-emerald-900/10 overflow-hidden shrink-0">
                      <img 
                        src="/images/jean.png" 
                        alt="Jean Carlos" 
                        className="w-full h-full object-cover rounded-2xl group-hover:scale-105 transition-transform duration-300"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = `https://api.dicebear.com/7.x/avataaars/svg?seed=Jean`;
                        }}
                      />
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-white text-base">Jean Carlos</h4>
                        <span className="text-[8px] font-black uppercase px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                          Bananicultor
                        </span>
                      </div>
                      <p className="text-[10px] text-zinc-400 font-extrabold uppercase tracking-wider">Produtor & Especialista</p>
                      <p className="text-xs text-zinc-300 leading-normal">
                        Dúvidas relacionadas ao conteúdo do curso, técnicas de manejo ou dúvidas práticas da banana? Fale com o Jean.
                      </p>
                    </div>
                  </div>
                  <a
                    href="https://wa.me/5521969014654"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-4 flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 px-4 rounded-2xl text-xs uppercase tracking-wider transition-all shadow-md cursor-pointer"
                  >
                    <MessageCircle size={15} />
                    <span>Dúvidas do curso e manejo? Fale aqui</span>
                  </a>
                </div>

                {/* 4. Weider */}
                <div className="bg-emerald-950/20 border border-emerald-950/40 rounded-3xl p-5 flex flex-col justify-between hover:border-emerald-500/30 transition-all hover:bg-emerald-950/30 relative overflow-hidden group">
                  <div className="flex gap-4">
                    <div className="w-14 h-14 rounded-2xl border border-emerald-500/25 p-[2px] bg-emerald-900/10 overflow-hidden shrink-0">
                      <img 
                        src="/images/weider.png" 
                        alt="Weider" 
                        className="w-full h-full object-cover rounded-2xl group-hover:scale-105 transition-transform duration-300"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = `https://api.dicebear.com/7.x/avataaars/svg?seed=Weider`;
                        }}
                      />
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-white text-base">Weider</h4>
                        <span className="text-[8px] font-black uppercase px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                          Plataforma
                        </span>
                      </div>
                      <p className="text-[10px] text-zinc-400 font-extrabold uppercase tracking-wider">Suporte Técnico</p>
                      <p className="text-xs text-zinc-300 leading-normal">
                        Dúvidas sobre o funcionamento da plataforma Banana PRO, problemas de acesso, erros ou faturamento? Fale com Weider.
                      </p>
                    </div>
                  </div>
                  <a
                    href="https://wa.me/5531995006891"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-4 flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 px-4 rounded-2xl text-xs uppercase tracking-wider transition-all shadow-md cursor-pointer"
                  >
                    <MessageCircle size={15} />
                    <span>Dúvidas sobre a plataforma? Chame aqui</span>
                  </a>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
