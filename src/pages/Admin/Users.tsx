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
  Smartphone,
  Edit2,
  Save,
  MessageCircle
} from "lucide-react";
import { format, subDays } from "date-fns";
import { ptBR } from "date-fns/locale";

const getWhatsAppLink = (fullName: string, phone: string) => {
  let phoneClean = phone.replace(/\D/g, '');
  if (!phoneClean) return '#';
  
  if (phoneClean.length <= 11 && !phoneClean.startsWith('55')) {
    phoneClean = '55' + phoneClean;
  }
  
  const firstName = fullName.trim().split(' ')[0];
  const msg = `Olá ${firstName}! Tudo bem? Vi que você fez seu cadastro na Comunidade Banana PRO, mas ainda não concluiu a assinatura. Ficou com alguma dúvida sobre as ferramentas, suporte de agrônomos ou acesso? Estou à disposição para ajudar!`;
  
  return `https://wa.me/${phoneClean}?text=${encodeURIComponent(msg)}`;
};

interface UserProfile {
  id: number;
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
  mocha_user_id?: string;
}

const UserDetailModal = ({ 
  user, 
  onClose,
  onUpdateUser 
}: { 
  user: UserProfile; 
  onClose: () => void; 
  onUpdateUser: (updatedUser: UserProfile) => void;
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // Form values
  const [fullName, setFullName] = useState(user.full_name || "");
  const [email, setEmail] = useState(user.email || "");
  const [phone, setPhone] = useState(user.phone || "");
  const [cpf, setCpf] = useState(user.cpf || "");
  const [pixKey, setPixKey] = useState(user.pix_key || "");
  const [role, setRole] = useState(user.role || "membro");
  const [password, setPassword] = useState("");

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // 1. Atualizar dados do perfil no banco
      const { data, error } = await supabase
        .from('user_profiles')
        .update({
          full_name: fullName,
          email: email,
          phone: phone,
          cpf: cpf,
          pix_key: pixKey,
          role: role
        })
        .eq('id', Number(user.id))
        .select()
        .single();

      if (error) throw error;

      // 2. Se houver nova senha informada, chamar o RPC para atualizar
      if (password.trim().length > 0) {
        if (!user.mocha_user_id) {
          throw new Error("Este usuário não possui um ID de autenticação (mocha_user_id) válido.");
        }
        
        const { error: rpcError } = await (supabase as any).rpc('admin_update_user_password', {
          target_user_id: user.mocha_user_id,
          new_password: password.trim()
        });

        if (rpcError) throw rpcError;
        toast.success("Senha atualizada com sucesso!");
      }

      toast.success("Dados do usuário atualizados com sucesso!");
      onUpdateUser(data as UserProfile);
      setIsEditing(false);
      setPassword("");
    } catch (error: any) {
      console.error("Erro ao atualizar usuário:", error);
      toast.error("Erro ao salvar: " + error.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
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
        className="bg-white dark:bg-zinc-950 border border-slate-200 dark:border-white/10 w-full max-w-2xl rounded-[2.5rem] overflow-hidden shadow-2xl my-4 md:my-8 relative"
        onClick={e => e.stopPropagation()}
      >
        <div className="relative h-32 bg-gradient-to-r from-emerald-600 to-emerald-900">
          <button 
            onClick={onClose}
            className="absolute top-6 right-6 p-2 bg-black/20 hover:bg-black/40 rounded-full text-white transition-all cursor-pointer"
          >
            <XCircle size={24} />
          </button>
        </div>
        
        <div className="px-10 pb-10 -mt-10 relative z-10">
          <div className="flex flex-col md:flex-row md:items-end gap-6 mb-8 justify-between">
            <div className="flex flex-col md:flex-row md:items-end gap-6 flex-1">
              <div className="w-32 h-32 rounded-[2rem] border-4 border-white dark:border-zinc-950 overflow-hidden bg-slate-100 dark:bg-zinc-800 shadow-xl relative z-10 shrink-0">
                <img 
                  src={user.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${fullName}`} 
                  alt="" 
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex-1 pb-2 w-full">
                {isEditing ? (
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 dark:text-zinc-500 uppercase tracking-widest block">Nome Completo</label>
                    <input 
                      type="text"
                      value={fullName}
                      onChange={e => setFullName(e.target.value)}
                      className="bg-slate-50 dark:bg-black/30 border border-slate-205 dark:border-white/10 rounded-xl px-4 py-2 text-slate-800 dark:text-white font-bold text-base focus:outline-none w-full"
                    />
                  </div>
                ) : (
                  <>
                    <h2 className="text-3xl font-black text-slate-800 dark:text-white">{fullName}</h2>
                    <p className="text-[#589c1c] dark:text-[#6ee7b7] font-bold flex items-center gap-2">
                      <Shield size={16} />
                      {role === 'admin' ? 'Administrador do Sistema' : 'Afiliado Parceiro'}
                    </p>
                  </>
                )}
              </div>
            </div>
            
            <div className="pb-2 self-end">
              {isEditing ? (
                <div className="flex gap-2">
                  <button 
                    disabled={isSaving}
                    onClick={handleSave}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs uppercase tracking-widest rounded-xl transition-all flex items-center gap-1.5 shadow-sm shadow-emerald-500/10 cursor-pointer disabled:opacity-50"
                  >
                    {isSaving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                    Salvar
                  </button>
                  <button 
                    disabled={isSaving}
                    onClick={() => {
                      setIsEditing(false);
                      // Reset values
                      setFullName(user.full_name || "");
                      setEmail(user.email || "");
                      setPhone(user.phone || "");
                      setCpf(user.cpf || "");
                      setPixKey(user.pix_key || "");
                      setRole(user.role || "membro");
                      setPassword("");
                    }}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 text-slate-600 dark:text-zinc-300 font-bold text-xs uppercase tracking-widest rounded-xl transition-all cursor-pointer"
                  >
                    Cancelar
                  </button>
                </div>
              ) : (
                <button 
                  onClick={() => setIsEditing(true)}
                  className="px-4 py-2 bg-[#589c1c] hover:bg-[#4d8718] text-white font-bold text-xs uppercase tracking-widest rounded-xl transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
                >
                  <Edit2 size={14} />
                  Editar Perfil
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div>
                <label className="text-[10px] font-black text-slate-400 dark:text-zinc-500 uppercase tracking-widest block mb-2">Informações de Contato</label>
                <div className="space-y-3">
                  <div className="flex flex-col gap-1.5 text-slate-750 dark:text-zinc-300 bg-slate-50 dark:bg-white/5 p-3 rounded-2xl border border-slate-100 dark:border-white/5">
                    <div className="flex items-center gap-3">
                      <Mail size={18} className="text-[#589c1c] dark:text-[#6ee7b7] shrink-0" />
                      {isEditing ? (
                        <input 
                          type="email"
                          value={email}
                          onChange={e => setEmail(e.target.value)}
                          className="bg-transparent border-b border-slate-200 dark:border-white/10 py-1 text-sm focus:outline-none w-full text-slate-800 dark:text-white font-medium"
                        />
                      ) : (
                        <span className="text-sm">{email}</span>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex flex-col gap-1.5 text-slate-750 dark:text-zinc-300 bg-slate-50 dark:bg-white/5 p-3 rounded-2xl border border-slate-100 dark:border-white/5">
                    <div className="flex items-center gap-3">
                      <Smartphone size={18} className="text-[#589c1c] dark:text-[#6ee7b7] shrink-0" />
                      {isEditing ? (
                        <input 
                          type="text"
                          placeholder="Celular/WhatsApp"
                          value={phone}
                          onChange={e => setPhone(e.target.value)}
                          className="bg-transparent border-b border-slate-200 dark:border-white/10 py-1 text-sm focus:outline-none w-full text-slate-800 dark:text-white font-medium"
                        />
                      ) : (
                        <span className="text-sm">{phone || 'Não informado'}</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black text-slate-400 dark:text-zinc-500 uppercase tracking-widest block mb-2">Segurança e Status</label>
                <div className="space-y-4">
                  {isEditing && (
                    <div className="bg-slate-50 dark:bg-white/5 p-4 rounded-2xl border border-slate-100 dark:border-white/5 space-y-2">
                      <label className="text-[10px] font-black text-slate-400 dark:text-zinc-500 uppercase block">Nova Senha</label>
                      <input 
                        type="password"
                        placeholder="Digite para alterar a senha"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        className="bg-transparent border-b border-slate-200 dark:border-white/10 py-1 text-xs focus:outline-none w-full text-slate-850 dark:text-white"
                      />
                    </div>
                  )}
                  
                  <div className="flex items-center gap-4">
                    <div className={`px-4 py-2 rounded-xl font-bold text-xs uppercase ${user.is_active ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-500' : 'bg-red-500/10 text-red-650 dark:text-red-500'}`}>
                      {user.is_active ? 'Conta Ativa' : 'Conta Inativa'}
                    </div>
                    <div className="text-slate-400 dark:text-zinc-500 text-xs flex items-center gap-2">
                      <Calendar size={14} />
                      Membro desde {format(new Date(user.created_at), "dd/MM/yyyy")}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <label className="text-[10px] font-black text-slate-400 dark:text-zinc-500 uppercase tracking-widest block mb-2">Dados Financeiros e Função</label>
                <div className="space-y-3">
                  {isEditing ? (
                    <div className="bg-slate-50 dark:bg-white/5 p-4 rounded-2xl border border-slate-100 dark:border-white/5">
                      <label className="text-[10px] font-black text-slate-400 dark:text-zinc-500 uppercase mb-1.5 block">Cargo / Nível de Acesso</label>
                      <select 
                        value={role}
                        onChange={e => setRole(e.target.value)}
                        className="w-full bg-slate-100 dark:bg-zinc-900 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2 text-sm text-slate-800 dark:text-white font-bold focus:outline-none"
                      >
                        <option value="membro">Produtor / Afiliado</option>
                        <option value="admin">Administrador do Sistema</option>
                      </select>
                    </div>
                  ) : null}

                  <div className="bg-slate-50 dark:bg-white/5 p-4 rounded-2xl border border-slate-100 dark:border-white/5">
                    <p className="text-[10px] font-black text-slate-400 dark:text-zinc-500 uppercase mb-1">Chave PIX</p>
                    {isEditing ? (
                      <input 
                        type="text"
                        value={pixKey}
                        onChange={e => setPixKey(e.target.value)}
                        className="bg-transparent border-b border-slate-200 dark:border-white/10 py-1 text-sm focus:outline-none w-full text-slate-800 dark:text-white font-mono"
                      />
                    ) : (
                      <p className="text-sm text-slate-700 dark:text-white font-mono">{pixKey || 'Não cadastrada'}</p>
                    )}
                  </div>
                  
                  <div className="bg-slate-50 dark:bg-white/5 p-4 rounded-2xl border border-slate-100 dark:border-white/5">
                    <p className="text-[10px] font-black text-slate-400 dark:text-zinc-500 uppercase mb-1">CPF/CNPJ</p>
                    {isEditing ? (
                      <input 
                        type="text"
                        value={cpf}
                        onChange={e => setCpf(e.target.value)}
                        className="bg-transparent border-b border-slate-200 dark:border-white/10 py-1 text-sm focus:outline-none w-full text-slate-800 dark:text-white font-mono"
                      />
                    ) : (
                      <p className="text-sm text-slate-700 dark:text-white font-mono">{cpf || 'Não informado'}</p>
                    )}
                  </div>
                </div>
              </div>

              {user.referral_code && (
                <div className="bg-emerald-500/5 dark:bg-emerald-500/5 border border-emerald-500/10 p-4 rounded-2xl">
                  <p className="text-[10px] font-black text-[#589c1c] dark:text-[#6ee7b7] uppercase mb-1">Código de Indicação</p>
                  <p className="text-lg font-black text-slate-800 dark:text-white tracking-widest uppercase">{user.referral_code}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

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
    const userToDelete = users.find(u => u.id === id);
    if (userToDelete?.role === 'admin') {
      toast.error("Administradores não podem ser excluídos pelo sistema.");
      return;
    }
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
      const { data, error } = await (supabase as any)
        .from('admin_user_profiles')
        .select('*')
        .order('created_at', { ascending: false }) as any;

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

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);

  // Reset to first page when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedUsers = filteredUsers.slice(startIndex, startIndex + itemsPerPage);

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-emerald-500/10 dark:bg-emerald-500/20 rounded-2xl border border-emerald-500/20">
              <UsersIcon className="text-[#589c1c] dark:text-[#6ee7b7] w-8 h-8" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-800 dark:text-white">Gestão de Usuários</h1>
              <p className="text-slate-500 dark:text-zinc-400 text-sm mt-1">Gerencie todos os membros da plataforma Banana PRO.</p>
            </div>
          </div>
          <button 
            onClick={() => navigate('/auth/register')}
            className="bg-[#589c1c] hover:bg-[#467c16] dark:bg-[#10b981] dark:hover:bg-[#0d9468] text-white px-6 py-3.5 rounded-2xl font-bold flex items-center gap-2 transition-all cursor-pointer shadow-lg shadow-emerald-600/10"
          >
            <UserPlus size={20} />
            Novo Usuário
          </button>
        </div>

        {/* Stats Summary */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[
            { label: "Total Membros", value: stats.total.toLocaleString() },
            { label: "Usuários Ativos", value: stats.activeToday.toLocaleString() },
            { label: "Novos (7d)", value: `+${stats.new7d}` },
            { label: "Taxa Retenção", value: stats.retention },
          ].map((stat, i) => (
            <div key={i} className="bg-white dark:bg-zinc-900/40 border border-slate-100 dark:border-white/5 p-6 rounded-[2rem] shadow-sm flex flex-col justify-between">
              <p className="text-slate-400 dark:text-zinc-500 text-[10px] font-black uppercase tracking-widest mb-1">{stat.label}</p>
              <h3 className="text-2xl font-black text-slate-800 dark:text-white">{stat.value}</h3>
            </div>
          ))}
        </div>

        {/* Filters and Search */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 dark:text-zinc-500 group-focus-within:text-emerald-500 transition-colors" />
            <input
              type="text"
              placeholder="Buscar por nome, email ou ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white dark:bg-zinc-900/40 border border-slate-200 dark:border-white/10 rounded-2xl py-3.5 pl-12 pr-4 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all"
            />
          </div>
          <div className="flex gap-2">
            <button className="bg-white dark:bg-zinc-900/40 border border-slate-200 dark:border-white/10 rounded-2xl px-6 py-3.5 text-slate-600 dark:text-zinc-300 flex items-center gap-2 hover:bg-slate-50 dark:hover:bg-zinc-800 transition-colors font-bold cursor-pointer">
              <Filter className="w-5 h-5" />
              Filtrar
            </button>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-white dark:bg-zinc-900/40 border border-slate-100 dark:border-white/5 rounded-[2rem] shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50 dark:bg-white/5">
                <tr>
                  <th className="px-8 py-5 text-[10px] font-black uppercase text-slate-500 dark:text-zinc-400 border-b border-slate-100 dark:border-white/5">Usuário</th>
                  <th className="px-8 py-5 text-[10px] font-black uppercase text-slate-500 dark:text-zinc-400 border-b border-slate-100 dark:border-white/5">Cargo / Função</th>
                  <th className="px-8 py-5 text-[10px] font-black uppercase text-slate-500 dark:text-zinc-400 border-b border-slate-100 dark:border-white/5">Data Cadastro</th>
                  <th className="px-8 py-5 text-[10px] font-black uppercase text-slate-500 dark:text-zinc-400 border-b border-slate-100 dark:border-white/5">Status</th>
                  <th className="px-8 py-5 text-[10px] font-black uppercase text-slate-500 dark:text-zinc-400 border-b border-slate-100 dark:border-white/5 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="px-8 py-20 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
                        <p className="text-slate-400 dark:text-zinc-500 text-sm font-medium">Carregando membros...</p>
                      </div>
                    </td>
                  </tr>
                ) : filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-8 py-20 text-center text-slate-400 dark:text-zinc-500">
                      Nenhum usuário encontrado para "{searchTerm}"
                    </td>
                  </tr>
                ) : (
                  paginatedUsers.map((user, index) => (
                    <motion.tr 
                      key={user.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="hover:bg-slate-50/50 dark:hover:bg-white/[0.01] transition-colors group border-b border-slate-100 dark:border-white/5 last:border-0"
                    >
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-2xl overflow-hidden border border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-zinc-800 shrink-0">
                            <img 
                              src={user.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.full_name}`} 
                              alt="" 
                              className="w-full h-full object-cover rounded-2xl"
                            />
                          </div>
                          <div>
                            <p className="font-bold text-slate-800 dark:text-white group-hover:text-emerald-500 transition-colors">{user.full_name}</p>
                            <p className="text-xs text-slate-400 dark:text-zinc-500 flex items-center gap-1">
                              <Mail size={12} />
                              {user.email}
                            </p>
                            {user.phone && (
                              <p className="text-[11px] text-slate-400 dark:text-zinc-500 flex items-center gap-1 mt-1 font-semibold">
                                <Smartphone size={12} className="text-emerald-500 shrink-0" />
                                {user.phone}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex flex-col">
                          <span className="text-sm font-bold text-slate-800 dark:text-white flex items-center gap-1">
                            <Shield size={14} className="text-[#589c1c] dark:text-[#6ee7b7]" />
                            {user.role === 'admin' ? 'Administrador' : 'Produtor'}
                          </span>
                          <span className="text-xs text-slate-400 dark:text-zinc-500 uppercase font-black tracking-tighter mt-1">
                            {user.role === 'admin' ? 'Acesso Total' : 'Membro'}
                          </span>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-2 text-slate-500 dark:text-zinc-400 text-sm">
                          <Calendar size={14} />
                          {format(new Date(user.created_at), "dd/MM/yyyy", { locale: ptBR })}
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <span className={`text-[10px] font-black px-3 py-1 rounded-full uppercase ${
                          user.is_active ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-500" : "bg-red-500/10 text-red-650 dark:text-red-500"
                        }`}>
                          {user.is_active ? "Ativo" : "Inativo"}
                        </span>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex justify-end gap-2">
                          <button 
                            onClick={() => setSelectedUser(user)}
                            className="p-2 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 rounded-xl transition-all text-slate-500 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-white cursor-pointer"
                            title="Ver Detalhes"
                          >
                            <Eye size={18} />
                          </button>
                          {user.phone && (
                            <a 
                              href={getWhatsAppLink(user.full_name, user.phone)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className={`p-2 rounded-xl transition-all flex items-center justify-center cursor-pointer ${
                                !user.is_active
                                  ? "bg-emerald-500/10 hover:bg-emerald-600 text-emerald-600 hover:text-white border border-emerald-500/20"
                                  : "bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-500 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-white"
                              }`}
                              title={!user.is_active ? "Recuperar Venda (WhatsApp)" : "Enviar Mensagem no WhatsApp"}
                            >
                              <MessageCircle size={18} />
                            </a>
                          )}
                          <button 
                            onClick={() => toggleUserStatus(user.id, user.is_active)}
                            className={`p-2 rounded-xl transition-all cursor-pointer ${
                              user.is_active 
                                ? "bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500 hover:text-white" 
                                : "bg-red-500/10 text-red-650 hover:bg-red-500 hover:text-white"
                            }`}
                            title={user.is_active ? "Desativar Usuário" : "Ativar Usuário"}
                          >
                            <Power size={18} />
                          </button>
                           {user.role !== 'admin' && (
                             <button 
                               onClick={() => deleteUser(user.id)}
                               className="p-2 bg-slate-100 dark:bg-white/5 hover:bg-red-500/20 rounded-xl transition-all text-slate-500 dark:text-zinc-400 hover:text-red-500 cursor-pointer"
                               title="Excluir Usuário"
                             >
                               <Trash2 size={18} />
                             </button>
                           )}
                        </div>
                      </td>
                    </motion.tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          
          <div className="p-6 bg-slate-50 dark:bg-white/[0.01] border-t border-slate-100 dark:border-white/5 flex items-center justify-between">
            <p className="text-xs text-slate-400 dark:text-zinc-500 font-medium">
              Mostrando {filteredUsers.length > 0 ? startIndex + 1 : 0}-{Math.min(startIndex + itemsPerPage, filteredUsers.length)} de {filteredUsers.length} usuários
            </p>
            <div className="flex items-center gap-4">
              <span className="text-xs text-slate-400 dark:text-zinc-500 font-medium">
                Página {currentPage} de {totalPages || 1}
              </span>
              <div className="flex gap-2">
                <button 
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="px-4 py-2 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 disabled:opacity-50 disabled:hover:bg-slate-100 disabled:dark:hover:bg-white/5 rounded-xl text-xs font-bold cursor-pointer transition-colors"
                >
                  Anterior
                </button>
                <button 
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages || totalPages === 0}
                  className="px-4 py-2 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 disabled:opacity-50 disabled:hover:bg-slate-100 disabled:dark:hover:bg-white/5 rounded-xl text-xs font-bold cursor-pointer transition-colors"
                >
                  Próxima
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {selectedUser && (
          <UserDetailModal 
            user={selectedUser} 
            onClose={() => setSelectedUser(null)} 
            onUpdateUser={(updatedUser) => {
              setUsers(prev => prev.map(u => u.id === updatedUser.id ? updatedUser : u));
              setSelectedUser(updatedUser);
            }}
          />
        )}
      </AnimatePresence>
    </AdminLayout>
  );
}
