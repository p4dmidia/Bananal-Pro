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
  Search,
  X,
  Menu,
  Video,
  BookOpen
} from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";

const adminMenuItems = [
  { icon: LayoutDashboard, label: "Visão Geral", path: "/admin" },
  { icon: Users, label: "Usuários", path: "/admin/usuarios" },
  { icon: DollarSign, label: "Financeiro", path: "/admin/financeiro" },
  { icon: AlertTriangle, label: "Moderação", path: "/admin/moderacao" },
  { icon: ShieldCheck, label: "Cursos", path: "/admin/cursos" },
  { icon: Video, label: "Lives", path: "/admin/lives" },
  { icon: BookOpen, label: "Biblioteca", path: "/admin/biblioteca" },
  { icon: Settings, label: "Configurações", path: "/admin/config" },
];

import logoImg from "../../assets/logo.png";

const AdminSidebar = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside className={`
        fixed inset-y-0 left-0 z-50 w-72 bg-black border-r border-white/5 flex flex-col h-screen transition-transform duration-300 lg:sticky lg:translate-x-0
        ${isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
      `}>
        <div className="py-4 px-8 flex items-center justify-between">
          <Link to="/admin" className="flex items-center gap-3 group">
            <img src={logoImg} alt="Bananal PRO" className="h-28 w-auto object-contain -my-6" style={{ filter: 'invert(1)' }} />
            <span className="bg-emerald-500/10 text-emerald-500 text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest self-center ml-1">Admin</span>
          </Link>
          <button onClick={onClose} className="lg:hidden text-zinc-500 hover:text-white">
            <X size={24} />
          </button>
        </div>

        <nav className="flex-1 px-4 space-y-2 mt-4 overflow-y-auto min-h-0">
          {adminMenuItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={onClose}
                className={`flex items-center gap-3 px-4 py-3.5 rounded-2xl font-bold text-sm transition-all group ${
                  isActive 
                    ? "bg-emerald-600 text-white shadow-lg shadow-emerald-600/10" 
                    : "text-zinc-500 hover:text-white hover:bg-white/5"
                }`}
              >
                <item.icon size={20} className={isActive ? "text-white" : "group-hover:text-emerald-500 transition-colors"} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-white/5">
          <div className="bg-zinc-900/50 p-4 rounded-3xl border border-white/5 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full border-2 border-emerald-500 overflow-hidden">
                <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Admin" alt="Admin Avatar" />
              </div>
              <div>
                <p className="text-xs font-black text-white uppercase tracking-widest">Administrador Master</p>
                <p className="text-[10px] text-zinc-500 font-bold">Acesso Total</p>
              </div>
            </div>
            <button 
              onClick={() => navigate("/admin/login")}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-white/5 hover:bg-emerald-500/10 hover:text-emerald-500 text-zinc-500 text-xs font-bold transition-all"
            >
              <LogOut size={14} />
              Encerrar Sessão
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-black text-white font-sans overflow-x-hidden">
      <AdminSidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      
      <div className="flex-1 flex flex-col min-w-0">
        {/* Admin Navbar */}
        <header className="h-20 border-b border-white/10 px-4 md:px-8 flex items-center justify-between sticky top-0 bg-black/80 backdrop-blur-md z-40">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="lg:hidden p-2 text-zinc-400 hover:text-white transition-colors"
            >
              <Menu size={24} />
            </button>
          </div>

          <div className="flex items-center gap-3 md:gap-6">
            <button className="relative p-2 text-zinc-400 hover:text-white transition-colors">
              <Bell size={22} />
              <span className="absolute top-2 right-2 w-2 h-2 bg-emerald-600 rounded-full" />
            </button>
            
            <div className="h-8 w-[1px] bg-white/10 hidden sm:block" />
            
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
