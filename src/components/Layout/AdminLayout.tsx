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
import logoImg from "../../assets/logo.png";

const adminMenuItems = [
  { icon: LayoutDashboard, label: "Visão Geral", path: "/admin" },
  { icon: Users, label: "Usuários", path: "/admin/usuarios" },
  { icon: DollarSign, label: "Financeiro", path: "/admin/financeiro" },
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
          <div className="relative">
            <Link to="/admin" className="flex items-center justify-center bg-white w-48 h-16 rounded-2xl shadow-md p-2 group hover:scale-105 transition-transform">
              <img src={logoImg} alt="Bananal PRO" className="h-full w-full object-contain" />
            </Link>
            <span className="absolute -top-2 -right-2 bg-emerald-600 text-white text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest shadow-md">Admin</span>
          </div>
          <button onClick={onClose} className="absolute right-6 top-6 lg:hidden text-white/80 hover:text-white cursor-pointer">
            <X size={24} />
          </button>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto min-h-0">
          {adminMenuItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={onClose}
                className={`flex items-center justify-between p-4 rounded-2xl transition-all group ${
                  isActive 
                    ? "bg-white text-primary shadow-lg shadow-black/10" 
                    : "text-white/80 hover:bg-white/5 hover:text-white"
                }`}
              >
                <div className="flex items-center gap-3">
                  <item.icon size={22} className={isActive ? "text-primary" : "text-white/70 group-hover:text-white transition-colors"} />
                  <span className="font-semibold">{item.label}</span>
                </div>
                {isActive && <ChevronRight size={16} />}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 mt-auto">
          <div className="block bg-white p-4 rounded-2xl mb-4 group/profile shadow-md border border-primary/10">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 p-[2px]">
                <div className="w-full h-full rounded-full bg-white flex items-center justify-center overflow-hidden">
                  <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Admin" alt="Admin Avatar" />
                </div>
              </div>
              <div className="overflow-hidden flex-1">
                <p className="text-sm font-bold truncate text-primary">Administrador Master</p>
                <p className="text-[10px] text-primary/70 uppercase tracking-wider font-bold">
                  Acesso Total
                </p>
              </div>
            </div>
            <div className="h-1 bg-primary/10 rounded-full overflow-hidden">
              <div className="h-full bg-primary w-full" />
            </div>
          </div>

          <button 
            onClick={() => navigate("/admin/login")}
            className="w-full flex items-center gap-3 p-4 text-red-400 hover:bg-red-500/10 rounded-2xl transition-all group cursor-pointer"
          >
            <LogOut size={20} className="group-hover:rotate-12 transition-transform text-red-400" />
            <span className="font-semibold">Encerrar Sessão</span>
          </button>
        </div>
      </aside>
    </>
  );
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-background text-on-surface font-sans overflow-x-hidden">
      <AdminSidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      
      <div className="flex-1 flex flex-col min-w-0 lg:pl-72">
        {/* Admin Navbar */}
        <header className="h-20 border-b border-outline/10 px-4 md:px-8 flex items-center justify-between sticky top-0 bg-background/80 backdrop-blur-md z-40">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="lg:hidden p-2 text-on-surface-variant hover:text-on-surface transition-colors"
            >
              <Menu size={24} />
            </button>
          </div>

          <div className="flex items-center gap-3 md:gap-6">
            <button className="relative p-2 text-on-surface-variant hover:text-on-surface transition-colors">
              <Bell size={22} />
              <span className="absolute top-2 right-2 w-2 h-2 bg-emerald-600 rounded-full" />
            </button>
            
            <div className="h-8 w-[1px] bg-outline/20 hidden sm:block" />
            
            <div className="hidden xs:flex flex-col items-end">
              <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Servidor</span>
              <span className="text-xs font-bold text-emerald-400">ATIVO</span>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <main className="p-4 md:p-8 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
