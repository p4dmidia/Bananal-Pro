import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import AdminLayout from "../../components/Layout/AdminLayout";
import { motion } from "motion/react";
import { supabase } from "../../lib/supabase";
import { 
  ShieldCheck, 
  Users, 
  DollarSign, 
  TrendingUp, 
  CheckCircle, 
  XCircle,
  Loader2,
  AlertTriangle
} from "lucide-react";
import { format, subDays, startOfDay, eachDayOfInterval } from "date-fns";
import { ptBR } from "date-fns/locale";
import { 
  AreaChart, 
  Area, 
  BarChart,
  Bar,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';

interface DashboardStats {
  totalUsers: number;
  activeUsers: number;
  mrr: number;
  churnRate: string;
  retentionRate: string;
}

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    activeUsers: 0,
    mrr: 0,
    churnRate: "3.8%",
    retentionRate: "96.2%"
  });
  const [recentSubscriptions, setRecentSubscriptions] = useState<any[]>([]);
  const [growthData, setGrowthData] = useState<any[]>([]);
  const [revenueData, setRevenueData] = useState<any[]>([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // 1. Total Users
      const { data: usersData, count: usersCount } = await supabase
        .from('user_profiles')
        .select('*', { count: 'exact' });

      // 2. Fetch orders for revenue
      let ordersData: any[] = [];
      try {
        const { data: dbOrders, error: ordersError } = await supabase
          .from('orders')
          .select('*, user_profiles:user_profiles!orders_user_id_fkey(full_name, email)')
          .order('created_at', { ascending: false });

        if (ordersError) throw ordersError;
        ordersData = dbOrders || [];
      } catch (dbErr) {
        console.warn("Tabela 'orders' não encontrada ou inacessível. Utilizando fallback local.");
        const local = localStorage.getItem("admin_orders_db");
        if (local) {
          ordersData = JSON.parse(local);
        } else {
          const defaultOrders = [
            { id: 1001, user_id: 1, total_amount: 87, status: "paid", payment_method: "PIX", created_at: new Date(Date.now() - 86400000 * 2).toISOString(), user_profiles: { full_name: "Carlos Silva", email: "carlos.silva@agro.com" } },
            { id: 1002, user_id: 2, total_amount: 87, status: "paid", payment_method: "Cartão de Crédito", created_at: new Date(Date.now() - 86400000 * 4).toISOString(), user_profiles: { full_name: "Marcos Souza", email: "marcos.souza@fazenda.com" } },
            { id: 1003, user_id: 3, total_amount: 87, status: "pending", payment_method: "PIX", created_at: new Date(Date.now() - 3600000 * 5).toISOString(), user_profiles: { full_name: "Ana Oliveira", email: "ana.oliveira@banana.com" } },
            { id: 1004, user_id: 4, total_amount: 87, status: "cancelled", payment_method: "Boleto", created_at: new Date(Date.now() - 86400000 * 15).toISOString(), user_profiles: { full_name: "João Santos", email: "joao.santos@bananal.com" } }
          ];
          ordersData = defaultOrders;
          localStorage.setItem("admin_orders_db", JSON.stringify(defaultOrders));
        }
      }

      // Calculate active users (unique user_ids with paid orders, excluding null/undefined user_ids and test orders <= 1.00)
      const paidOrders = ordersData.filter((o: any) => o.status === 'paid' && o.user_id !== null && o.user_id !== undefined && Number(o.total_amount) > 1.00);
      
      // Mapeia o último valor de plano pago de cada usuário ativo
      const activeUsersMap = new Map<number, number>();
      paidOrders.forEach((o: any) => {
        const userProfile = usersData?.find((u: any) => u.id === o.user_id);
        const isUserActive = userProfile ? userProfile.is_active : false;
        
        if (isUserActive) {
          const existingDate = activeUsersMap.get(o.user_id) ? new Date(paidOrders.find((x: any) => x.user_id === o.user_id)?.created_at || 0) : new Date(0);
          if (new Date(o.created_at) >= existingDate) {
            activeUsersMap.set(o.user_id, Number(o.total_amount || 97.00));
          }
        }
      });

      const activeCount = activeUsersMap.size;
      
      // Calcula o MRR real: R$ 97 para mensal (<= 150) e R$ 41.41 (497/12) para anual (> 150)
      let mrrValue = 0;
      activeUsersMap.forEach((amount) => {
        const isMonthly = amount <= 150;
        mrrValue += isMonthly ? 97 : 41.41;
      });

      // Calcula os usuários que deram churn: têm pelo menos um pedido pago na história, mas perfil inativo atualmente
      const uniquePaidUserIds = Array.from(new Set(paidOrders.map((o: any) => o.user_id)));
      let cancelledCount = 0;

      uniquePaidUserIds.forEach(userId => {
        const userProfile = usersData?.find((u: any) => u.id === userId);
        const isCurrentlyActive = userProfile ? userProfile.is_active : false;
        if (!isCurrentlyActive) {
          cancelledCount++;
        }
      });

      const totalSubs = activeCount + cancelledCount;
      const churnVal = totalSubs > 0 ? (cancelledCount / totalSubs) * 100 : 0;
      const retentionVal = 100 - churnVal;

      setStats({
        totalUsers: usersCount || 0,
        activeUsers: activeCount,
        mrr: mrrValue,
        churnRate: `${churnVal.toFixed(1)}%`,
        retentionRate: `${retentionVal.toFixed(1)}%`
      });

      // Get latest 5 paid orders
      setRecentSubscriptions(paidOrders.slice(0, 5));

      // 3. Growth & Revenue Data (Last 7 days)
      const days = eachDayOfInterval({
        start: subDays(new Date(), 6),
        end: new Date(),
      });

      const chartData = days.map(day => {
        const dateStr = format(day, 'yyyy-MM-dd');
        
        const userCount = usersData?.filter(u => 
          format(new Date(u.created_at), 'yyyy-MM-dd') === dateStr
        ).length || 0;

        const dailyRevenue = ordersData.filter(o => 
          o.status === 'paid' && Number(o.total_amount) > 1.00 && format(new Date(o.created_at), 'yyyy-MM-dd') === dateStr
        ).reduce((acc, curr) => acc + Number(curr.total_amount), 0) || 0;
        
        return {
          name: format(day, 'dd/MM'),
          usuarios: userCount,
          faturamento: dailyRevenue
        };
      });

      setGrowthData(chartData);
      setRevenueData(chartData);
    } catch (error) {
      console.error("Erro ao carregar dashboard:", error);
    } finally {
      setLoading(false);
    }
  };

  const adminStats = [
    { label: "Receita MRR", value: `R$ ${stats.mrr.toLocaleString('pt-BR')}`, change: "Recorrência Mensal", icon: DollarSign, color: "text-emerald-400" },
    { label: "Assinantes Ativos", value: stats.activeUsers.toString(), change: `${stats.totalUsers} cadastrados`, icon: Users, color: "text-blue-400" },
    { label: "Retenção / Churn", value: `${stats.retentionRate} / ${stats.churnRate}`, change: "Saúde da plataforma", icon: ShieldCheck, color: "text-purple-400" },
  ];

  if (loading) {
    return (
      <AdminLayout>
        <div className="h-[60vh] flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto space-y-10">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-emerald-500/10 dark:bg-emerald-500/20 rounded-2xl border border-emerald-500/20">
            <ShieldCheck className="text-emerald-600 dark:text-emerald-400 w-8 h-8" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-slate-800 dark:text-white">Painel Administrativo</h1>
            <p className="text-slate-500 dark:text-zinc-400 text-sm font-medium">Controle total da plataforma Bananal PRO</p>
          </div>
        </div>

        {/* Admin Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {adminStats.map((stat, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.1 }}
              className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm flex flex-col justify-between group hover:shadow-md transition-all duration-300 relative overflow-hidden"
            >
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider block">{stat.label}</span>
                  <span className="text-3xl font-display font-black text-slate-800 dark:text-white">{stat.value}</span>
                </div>
                <div className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-950/20 flex items-center justify-center text-[#589c1c] dark:text-[#6ee7b7]">
                  <stat.icon size={20} />
                </div>
              </div>
              <div className="flex items-center gap-1 text-[10px] font-black text-[#589c1c] dark:text-[#6ee7b7] mt-4">
                <span className="text-slate-400 dark:text-zinc-500 font-bold uppercase tracking-wider">{stat.change}</span>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Growth Chart */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-zinc-900/40 border border-slate-100 dark:border-white/5 p-6 rounded-[2rem] shadow-sm overflow-hidden"
          >
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-xl font-bold text-slate-800 dark:text-white uppercase tracking-tighter">Novos Produtores</h2>
                <p className="text-slate-400 dark:text-zinc-500 text-[10px] font-black uppercase tracking-widest mt-1">Usuários cadastrados nos últimos 7 dias</p>
              </div>
            </div>

            <div className="h-[250px] w-full" style={{ minHeight: '250px' }}>
              <ResponsiveContainer width="99%" height="100%">
                <AreaChart data={growthData}>
                  <defs>
                    <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.04)" className="dark:stroke-white/5" vertical={false} />
                  <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }}
                  />
                  <YAxis hide />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                      border: '1px solid #e2e8f0',
                      borderRadius: '16px',
                      fontSize: '11px',
                      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.05)'
                    }}
                    cursor={{ stroke: 'rgba(16, 185, 129, 0.1)', strokeWidth: 2 }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="usuarios" 
                    stroke="#10b981" 
                    strokeWidth={3}
                    fillOpacity={1} 
                    fill="url(#colorUsers)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          {/* Revenue Chart */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white dark:bg-zinc-900/40 border border-slate-100 dark:border-white/5 p-6 rounded-[2rem] shadow-sm overflow-hidden"
          >
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-xl font-bold text-slate-800 dark:text-white uppercase tracking-tighter">Faturamento</h2>
                <p className="text-[#589c1c] dark:text-[#6ee7b7] text-[10px] font-black uppercase tracking-widest mt-1">Volume de vendas em R$</p>
              </div>
              <div className="flex items-center gap-2 px-3 py-1 bg-emerald-500/10 rounded-lg">
                <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 tracking-widest uppercase">7 Dias</span>
              </div>
            </div>

            <div className="h-[250px] w-full" style={{ minHeight: '250px' }}>
              <ResponsiveContainer width="99%" height="100%">
                <BarChart data={revenueData}>
                  <defs>
                    <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0.2}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.04)" className="dark:stroke-white/5" vertical={false} />
                  <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }}
                  />
                  <YAxis hide />
                  <Tooltip 
                    formatter={(value: number) => [`R$ ${value.toLocaleString('pt-BR')}`, 'Faturamento']}
                    contentStyle={{ 
                      backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                      border: '1px solid #e2e8f0',
                      borderRadius: '16px',
                      fontSize: '11px',
                      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.05)'
                    }}
                    cursor={{ fill: 'rgba(0, 0, 0, 0.02)' }}
                  />
                  <Bar 
                    dataKey="faturamento" 
                    fill="url(#colorRev)" 
                    radius={[6, 6, 0, 0]}
                    barSize={20}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 gap-8">
          {/* Recent Subscriptions */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                <CheckCircle className="text-emerald-500" size={20} />
                Últimas Assinaturas Ativas
              </h2>
              <button 
                onClick={() => navigate('/admin/financeiro')}
                className="text-xs font-bold text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors"
              >
                Ver todas
              </button>
            </div>

            <div className="bg-white dark:bg-zinc-900/40 border border-slate-100 dark:border-white/5 rounded-[2rem] shadow-sm overflow-hidden">
              <table className="w-full text-left">
                <thead className="bg-slate-50 dark:bg-white/5">
                  <tr>
                    <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-500 dark:text-zinc-400 border-b border-slate-100 dark:border-white/5">Produtor</th>
                    <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-500 dark:text-zinc-400 border-b border-slate-100 dark:border-white/5">Valor</th>
                    <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-500 dark:text-zinc-400 border-b border-slate-100 dark:border-white/5">Data</th>
                    <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-500 dark:text-zinc-400 border-b border-slate-100 dark:border-white/5 text-right">Método</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                  {recentSubscriptions.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-10 text-center text-slate-400 dark:text-zinc-500 text-sm">Nenhuma assinatura ativa encontrada</td>
                    </tr>
                  ) : (
                    recentSubscriptions.map((s) => (
                      <tr key={s.id} className="hover:bg-slate-50/50 dark:hover:bg-white/[0.01] transition-colors border-b border-slate-100 dark:border-white/5 last:border-0">
                        <td className="px-6 py-4 font-bold text-sm text-slate-800 dark:text-white">
                          <div>
                            <p>{s.user_profiles?.full_name || 'Produtor'}</p>
                            <p className="text-[10px] text-slate-400 dark:text-zinc-500 font-medium">{s.user_profiles?.email || ''}</p>
                          </div>
                        </td>
                        <td className="px-6 py-4 font-bold text-sm text-emerald-600 dark:text-emerald-400">R$ {Number(s.total_amount).toLocaleString('pt-BR')}</td>
                        <td className="px-6 py-4 text-xs text-slate-500 dark:text-zinc-400 font-medium">
                          {format(new Date(s.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <span className="text-xs text-slate-600 dark:text-zinc-300 font-bold bg-slate-100 dark:bg-white/5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-white/5">
                            {s.payment_method || 'PIX'}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
