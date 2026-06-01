import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import AdminLayout from "../../components/Layout/AdminLayout";
import { motion, AnimatePresence } from "motion/react";
import { supabase } from "../../lib/supabase";
import { 
  Users as UsersIcon, 
  Search, 
  Filter, 
  MoreVertical, 
  Shield, 
  Mail, 
  Calendar,
  ChevronRight,
  UserPlus,
  Loader2,
  Eye,
  Power,
  Trash2,
  XCircle,
  Smartphone
} from "lucide-react";
import { format, subDays } from "date-fns";
import { ptBR } from "date-fns/locale";

interface UserProfile {
  id: string;
  full_name: string;
  email: string;
  role: string;
  created_at: string;
  is_active: boolean;
  avatar_url?: string;
  phone?: string;
  pix_key?: string;
  cpf?: string;
  referral_code?: string;
}

export default function AdminUsers() {
  const navigate = useNavigate();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [stats, setStats] = useState({
    total: 0,
    activeToday: 0,
    new7d: 0,
    retention: "94%"
  });

  const UserDetailModal = ({ user, onClose }: { user: UserProfile, onClose: () => void }) => (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-start justify-center p-4 md:p-10 bg-black/80 backdrop-blur-sm overflow-y-auto"
      onClick={onClose}
    >
      <motion.div 
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        className="bg-zinc-900 border border-white/10 w-full max-w-2xl rounded-[2.5rem] overflow-hidden shadow-2xl my-4 md:my-8 relative"
        onClick={e => e.stopPropagation()}
      >
        <div className="relative h-32 bg-gradient-to-r from-red-600 to-red-900">
          <button 
            onClick={onClose}
            className="absolute top-6 right-6 p-2 bg-black/20 hover:bg-black/40 rounded-full text-white transition-all"
          >
            <XCircle size={24} />
          </button>
        </div>
        
        <div className="px-10 pb-10 -mt-16 relative z-10">
          <div className="flex flex-col md:flex-row md:items-end gap-6 mb-8">
            <div className="w-32 h-32 rounded-[2rem] border-4 border-zinc-900 overflow-hidden bg-zinc-800 shadow-xl relative z-10">
              <img 
                src={user.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.full_name}`} 
                alt="" 
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex-1 pb-2">
              <h2 className="text-3xl font-black text-white">{user.full_name}</h2>
              <p className="text-red-500 font-bold flex items-center gap-2">
                <Shield size={16} />
                {user.role === 'admin' ? 'Administrador do Sistema' : 'Afiliado Parceiro'}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div>
                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest block mb-2">Informações de Contato</label>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 text-zinc-300 bg-white/5 p-3 rounded-2xl border border-white/5">
                    <Mail size={18} className="text-red-500" />
                    <span className="text-sm">{user.email}</span>
                  </div>
                  {user.phone && (
                    <div className="flex items-center gap-3 text-zinc-300 bg-white/5 p-3 rounded-2xl border border-white/5">
                      <Smartphone size={18} className="text-red-500" />
                      <span className="text-sm">{user.phone}</span>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest block mb-2">Segurança e Status</label>
                <div className="flex items-center gap-4">
                  <div className={`px-4 py-2 rounded-xl font-bold text-xs uppercase ${user.is_active ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}>
                    {user.is_active ? 'Conta Ativa' : 'Conta Inativa'}
                  </div>
                  <div className="text-zinc-500 text-xs flex items-center gap-2">
                    <Calendar size={14} />
                    Membro desde {format(new Date(user.created_at), "dd/MM/yyyy")}
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest block mb-2">Dados Financeiros</label>
                <div className="space-y-3">
                  <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                    <p className="text-[10px] font-black text-zinc-500 uppercase mb-1">Chave PIX</p>
                    <p className="text-sm text-white font-mono">{user.pix_key || 'Não cadastrada'}</p>
                  </div>
                  <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                    <p className="text-[10px] font-black text-zinc-500 uppercase mb-1">CPF/CNPJ</p>
                    <p className="text-sm text-white font-mono">{user.cpf || 'Não informado'}</p>
                  </div>
                </div>
              </div>

              {user.referral_code && (
                <div className="bg-red-500/5 border border-red-500/10 p-4 rounded-2xl">
                  <p className="text-[10px] font-black text-red-500/50 uppercase mb-1">Código de Indicação</p>
                  <p className="text-lg font-black text-white tracking-widest uppercase">{user.referral_code}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );

  useEffect(() => {
    fetchUsers();
  }, []);

  const toggleUserStatus = async (id: any, currentStatus: boolean) => {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .update({ is_active: !currentStatus })
        .eq('id', Number(id))
        .select();

      if (error) throw error;
      if (!data || data.length === 0) {
        throw new Error("Erro de permissão ou perfil não encontrado no banco.");
      }
      
      setUsers(prev => prev.map(u => u.id === id ? { ...u, is_active: !currentStatus } : u));
      toast.success(`Usuário ${!currentStatus ? 'ativado' : 'desativado'} com sucesso!`);
    } catch (error: any) {
      console.error("Erro ao alterar status do usuário:", error);
      toast.error("Erro ao alterar status: " + error.message);
    }
  };

  const deleteUser = async (id: any) => {
    if (!window.confirm("Tem certeza que deseja excluir este usuário?")) return;
    
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .delete()
        .eq('id', Number(id))
        .select();

      if (error) throw error;
      if (!data || data.length === 0) {
        throw new Error("Erro de permissão: a exclusão foi bloqueada pelo banco de dados.");
      }
      
      setUsers(prev => prev.filter(u => u.id !== id));
      toast.success("Usuário excluído com sucesso!");
    } catch (error: any) {
      console.error("Erro ao excluir usuário:", error);
      toast.error("Erro ao excluir: " + error.message);
    }
  };

  const fetchUsers = async () => {
    setLoading(true);
    try {
      // Fetch users
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUsers(data || []);

      // Calculate stats
      const total = data?.length || 0;
      const sevenDaysAgo = subDays(new Date(), 7);
      const new7d = data?.filter(u => new Date(u.created_at) > sevenDaysAgo).length || 0;
      const active = data?.filter(u => u.is_active).length || 0;

      const retentionValue = total > 0 ? Math.round((active / total) * 100) : 100;

      setStats({
        total,
        activeToday: active,
        new7d,
        retention: `${retentionValue}%`
      });
    } catch (error) {
      console.error("Erro ao buscar usuários:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter(user => 
    user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              <UsersIcon className="text-red-500" />
              Gestão de Usuários
            </h1>
            <p className="text-zinc-500 text-sm mt-1">Gerencie todos os membros da plataforma Bananal PRO.</p>
          </div>
          <button 
            onClick={() => navigate('/auth/register')}
            className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2 transition-all shadow-lg shadow-red-600/20"
          >
            <UserPlus size={20} />
            Novo Usuário
          </button>
        </div>

        {/* Stats Summary */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[
            { label: "Total Membros", value: stats.total.toLocaleString(), color: "text-blue-400" },
            { label: "Usuários Ativos", value: stats.activeToday.toLocaleString(), color: "text-emerald-400" },
            { label: "Novos (7d)", value: `+${stats.new7d}`, color: "text-purple-400" },
            { label: "Taxa Retenção", value: stats.retention, color: "text-orange-400" },
          ].map((stat, i) => (
            <div key={i} className="bg-zinc-900/40 border border-white/5 p-6 rounded-3xl">
              <p className="text-zinc-500 text-[10px] font-black uppercase tracking-widest mb-1">{stat.label}</p>
              <h3 className={`text-2xl font-bold ${stat.color}`}>{stat.value}</h3>
            </div>
          ))}
        </div>

        {/* Filters and Search */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500 group-focus-within:text-red-500 transition-colors" />
            <input
              type="text"
              placeholder="Buscar por nome, email ou ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-zinc-900/50 border border-white/10 rounded-2xl py-3.5 pl-12 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-red-500/50 transition-all"
            />
          </div>
          <div className="flex gap-2">
            <button className="bg-zinc-900/50 border border-white/10 rounded-2xl px-6 py-3.5 text-zinc-300 flex items-center gap-2 hover:bg-zinc-800 transition-colors font-bold">
              <Filter className="w-5 h-5" />
              Filtrar
            </button>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-zinc-900/50 border border-white/5 rounded-[2.5rem] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-white/5 border-b border-white/5">
                <tr>
                  <th className="px-8 py-5 text-[10px] font-black uppercase text-zinc-500">Usuário</th>
                  <th className="px-8 py-5 text-[10px] font-black uppercase text-zinc-500">Cargo / Função</th>
                  <th className="px-8 py-5 text-[10px] font-black uppercase text-zinc-500">Data Cadastro</th>
                  <th className="px-8 py-5 text-[10px] font-black uppercase text-zinc-500">Status</th>
                  <th className="px-8 py-5 text-[10px] font-black uppercase text-zinc-500 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="px-8 py-20 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <Loader2 className="w-8 h-8 text-red-500 animate-spin" />
                        <p className="text-zinc-500 text-sm font-medium">Carregando membros...</p>
                      </div>
                    </td>
                  </tr>
                ) : filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-8 py-20 text-center text-zinc-500">
                      Nenhum usuário encontrado para "{searchTerm}"
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((user, index) => (
                    <motion.tr 
                      key={user.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="hover:bg-white/[0.02] transition-colors group"
                    >
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-2xl overflow-hidden border border-white/10 bg-zinc-800">
                            <img 
                              src={user.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.full_name}`} 
                              alt="" 
                            />
                          </div>
                          <div>
                            <p className="font-bold text-white group-hover:text-red-500 transition-colors">{user.full_name}</p>
                            <p className="text-xs text-zinc-500 flex items-center gap-1">
                              <Mail size={12} />
                              {user.email}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex flex-col">
                          <span className="text-sm font-bold text-white flex items-center gap-1">
                            <Shield size={14} className="text-red-500" />
                            {user.role === 'admin' ? 'Administrador' : 'Produtor'}
                          </span>
                          <span className="text-xs text-zinc-500 uppercase font-black tracking-tighter mt-1">
                            {user.role === 'admin' ? 'Acesso Total' : 'Membro'}
                          </span>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-2 text-zinc-400 text-sm">
                          <Calendar size={14} />
                          {format(new Date(user.created_at), "dd/MM/yyyy", { locale: ptBR })}
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <span className={`text-[10px] font-black px-3 py-1 rounded-full uppercase ${
                          user.is_active ? "bg-emerald-500/10 text-emerald-500" : "bg-red-500/10 text-red-500"
                        }`}>
                          {user.is_active ? "Ativo" : "Inativo"}
                        </span>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex justify-end gap-2">
                          <button 
                            onClick={() => setSelectedUser(user)}
                            className="p-2 bg-white/5 hover:bg-white/10 rounded-xl transition-all text-zinc-400 hover:text-white"
                            title="Ver Detalhes"
                          >
                            <Eye size={18} />
                          </button>
                          <button 
                            onClick={() => toggleUserStatus(user.id, user.is_active)}
                            className={`p-2 rounded-xl transition-all ${
                              user.is_active 
                                ? "bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500 hover:text-white" 
                                : "bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white"
                            }`}
                            title={user.is_active ? "Desativar Usuário" : "Ativar Usuário"}
                          >
                            <Power size={18} />
                          </button>
                          <button 
                            onClick={() => deleteUser(user.id)}
                            className="p-2 bg-white/5 hover:bg-red-500/20 rounded-xl transition-all text-zinc-400 hover:text-red-500"
                            title="Excluir Usuário"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          
          <div className="p-6 bg-white/[0.01] border-t border-white/5 flex items-center justify-between">
            <p className="text-xs text-zinc-500 font-medium">
              Mostrando {filteredUsers.length} de {stats.total} usuários
            </p>
            <div className="flex gap-2">
              <button className="px-4 py-2 bg-white/5 rounded-xl text-xs font-bold disabled:opacity-50" disabled>Anterior</button>
              <button className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-xl text-xs font-bold">Próxima</button>
            </div>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {selectedUser && (
          <UserDetailModal 
            user={selectedUser} 
            onClose={() => setSelectedUser(null)} 
          />
        )}
      </AnimatePresence>
    </AdminLayout>
  );
}
