import { useEffect, useRef } from "react";
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
  BookOpen
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

  useEffect(() => {
    if (activeRef.current) {
      activeRef.current.scrollIntoView({ behavior: "smooth", block: "nearest" });
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
        fixed inset-y-0 left-0 z-50 w-72 bg-black border-r border-white/10 flex flex-col h-screen transition-transform duration-300 lg:sticky lg:translate-x-0
        ${isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
      `}>
        <div className="py-4 px-8 flex items-center justify-between">
          <Link to="/dashboard" className="flex items-center gap-3 group">
            <img src={logoImg} alt="Bananal PRO" className="h-28 w-auto object-contain -my-6" style={{ filter: 'invert(1)' }} />
          </Link>
          <button onClick={onClose} className="lg:hidden text-slate-400 hover:text-white cursor-pointer">
            <LogOut className="w-6 h-6 rotate-180" />
          </button>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto min-h-0">
          {MENU_ITEMS.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                ref={isActive ? activeRef : undefined}
                onClick={onClose}
                className={`flex items-center justify-between p-4 rounded-2xl transition-all group ${
                  isActive 
                    ? "bg-emerald-600 text-white shadow-lg shadow-emerald-600/10" 
                    : "text-slate-400 hover:bg-white/5 hover:text-white"
                }`}
              >
                <div className="flex items-center gap-3">
                  <item.icon size={22} className={isActive ? "text-white" : "group-hover:text-primary transition-colors"} />
                  <span className="font-semibold">{t(item.labelKey, item.defaultLabel)}</span>
                </div>
                {isActive && <motion.div layoutId="active-pill"><ChevronRight size={16} /></motion.div>}
              </Link>
            );
          })}
          
          {/* Administração removida conforme solicitado */}
        </nav>

        <div className="p-4 mt-auto">
          <Link to="/perfil" onClick={onClose} className="block glass-card p-4 rounded-2xl border border-white/5 hover:border-emerald-600/30 transition-all mb-4 group/profile">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-emerald-600 p-[2px] group-hover/profile:scale-105 transition-transform">
                <div className="w-full h-full rounded-full bg-black flex items-center justify-center overflow-hidden">
                  <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${userDisplayName}`} alt="User" />
                </div>
              </div>
              <div className="overflow-hidden flex-1">
                <p className="text-sm font-bold truncate group-hover/profile:text-emerald-400 transition-colors">{userDisplayName}</p>
                <p className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">
                  {profile?.role === 'admin' ? t("nav.admin", "Administrador") : `Parceiro • ${profile?.email || user?.email || '---'}`}
                </p>
              </div>
              <ChevronRight size={14} className="text-slate-500 group-hover/profile:translate-x-1 transition-transform" />
            </div>
            <div className="h-1 bg-white/10 rounded-full overflow-hidden">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: "10%" }}
                className="h-full bg-emerald-600"
              />
            </div>
            <p className="text-[10px] text-slate-500 mt-2 text-right">Iniciando jornada</p>
          </Link>

          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-3 p-4 text-slate-400 hover:text-red-400 transition-colors group cursor-pointer"
          >
            <LogOut size={20} className="group-hover:rotate-12 transition-transform" />
            <span className="font-semibold">{t("nav.logout", "Sair")}</span>
          </button>
        </div>
      </aside>
    </>
  );
}
