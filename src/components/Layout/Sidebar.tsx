import { useLayoutEffect, useRef } from "react";
import { 
  LayoutDashboard, 
  Users, 
  GraduationCap, 
  Wallet, 
  Settings, 
  LogOut,
  ChevronRight,
  Sprout,
  Package,
  Calendar,
  CloudSun,
  Camera,
  Tv,
  BookOpen,
  MessageCircle
} from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import { useAuth } from "../../contexts/AuthContext";
import { getUserDisplayName } from "../../lib/utils";
import { useTranslation } from "react-i18next";
import logoImg from "../../assets/logo.png";

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
  { icon: MessageCircle, labelKey: "nav.whatsapp", defaultLabel: "Suporte WhatsApp", path: "https://wa.me/5531999999999" },
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

  const activeRef = useRef<HTMLAnchorElement>(null);

  useLayoutEffect(() => {
    if (activeRef.current) {
      activeRef.current.scrollIntoView({ behavior: "auto", block: "nearest" });
    }
  }, [location.pathname]);

  const handleLogout = async () => {
    await signOut();
    navigate("/auth/login");
  };

  const userDisplayName = getUserDisplayName(profile, user) || user?.user_metadata?.login || "Usuário";

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
        fixed inset-y-0 left-0 z-50 w-72 bg-[#0a2413] text-white border-r border-emerald-950 flex flex-col h-screen transition-transform duration-300 lg:translate-x-0
        ${isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
      `}>
        <div className="py-6 px-4 flex flex-col items-center justify-center relative">
          <Link to="/dashboard" className="flex items-center justify-center bg-white w-48 h-16 rounded-2xl shadow-md p-2 group hover:scale-105 transition-transform">
            <img src={logoImg} alt="Bananal PRO" className="h-full w-full object-contain" />
          </Link>
          <button onClick={onClose} className="absolute right-6 top-6 lg:hidden text-white/80 hover:text-white cursor-pointer">
            <LogOut className="w-6 h-6 rotate-180" />
          </button>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto min-h-0">
          {MENU_ITEMS.map((item) => {
            const isActive = location.pathname === item.path;
            const isExternal = item.path.startsWith("http");
            
            const linkProps = isExternal 
              ? { href: item.path, target: "_blank", rel: "noopener noreferrer" } 
              : { to: item.path };
              
            const Tag = isExternal ? "a" : Link;

            return (
              <Tag
                key={item.path}
                {...linkProps}
                ref={!isExternal && isActive ? activeRef : undefined}
                onClick={onClose}
                className={`flex items-center justify-between p-4 rounded-2xl transition-all group ${
                  !isExternal && isActive 
                    ? "bg-white text-primary shadow-lg shadow-black/10" 
                    : "text-white/80 hover:bg-white/5 hover:text-white"
                }`}
              >
                <div className="flex items-center gap-3">
                  <item.icon size={22} className={!isExternal && isActive ? "text-primary" : "text-white/70 group-hover:text-white transition-colors"} />
                  <span className="font-semibold">{t(item.labelKey, item.defaultLabel)}</span>
                </div>
                {!isExternal && isActive && <motion.div layoutId="active-pill"><ChevronRight size={16} /></motion.div>}
              </Tag>
            );
          })}
          
          {/* Administração removida conforme solicitado */}
        </nav>

        <div className="p-4 mt-auto">
          <Link to="/perfil" onClick={onClose} className="block bg-white hover:bg-slate-50 transition-all p-4 rounded-2xl mb-4 group/profile shadow-md border border-primary/10">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 p-[2px] group-hover/profile:scale-105 transition-transform">
                <div className="w-full h-full rounded-full bg-white flex items-center justify-center overflow-hidden">
                  <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${userDisplayName}`} alt="User" />
                </div>
              </div>
              <div className="overflow-hidden flex-1">
                <p className="text-sm font-bold truncate text-primary">{userDisplayName}</p>
                <p className="text-[10px] text-primary/70 uppercase tracking-wider font-bold">
                  {profile?.role === 'admin' ? t("nav.admin", "Administrador") : `Parceiro • ${profile?.email || user?.email || '---'}`}
                </p>
              </div>
              <ChevronRight size={14} className="text-primary/70 group-hover/profile:translate-x-1 transition-transform" />
            </div>
            <div className="h-1 bg-primary/10 rounded-full overflow-hidden">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: "10%" }}
                className="h-full bg-primary"
              />
            </div>
            <p className="text-[10px] text-primary/70 mt-2 text-right">Iniciando jornada</p>
          </Link>

          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-3 p-4 text-red-400 hover:bg-red-500/10 rounded-2xl transition-all group cursor-pointer"
          >
            <LogOut size={20} className="group-hover:rotate-12 transition-transform text-red-400" />
            <span className="font-semibold">{t("nav.logout", "Sair da Conta")}</span>
          </button>
        </div>
      </aside>
    </>
  );
}
