import React, { useEffect, useState } from "react";
import AdminLayout from "../../components/Layout/AdminLayout";
import { motion, AnimatePresence } from "motion/react";
import { 
  DollarSign, 
  Search, 
  Filter, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  TrendingUp, 
  AlertTriangle,
  Loader2,
  FileText,
  User,
  CreditCard,
  Ban,
  RefreshCw,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  MessageCircle
} from "lucide-react";
import { supabase } from "../../lib/supabase";
import { toast } from "sonner";
import { format, subDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  PieChart, 
  Pie, 
  Cell, 
  Legend 
} from "recharts";

interface Subscription {
  id: number;
  user_id: number;
  user_name: string;
  user_email: string;
  user_whatsapp?: string;
  amount: number;
  status: string;
  payment_method: string;
  created_at: string;
}

interface PeriodStats {
  mrr: number;
  faturamento: number;
  activeCount: number;
  pendingCount: number;
  churn: number;
  retention: number;
}

const calculateStatsForPeriod = (subsList: Subscription[]): PeriodStats => {
  const active = subsList.filter(s => s.status === 'paid');
  const pending = subsList.filter(s => s.status === 'pending');
  const cancelled = subsList.filter(s => s.status === 'cancelled');
  
  const activeCount = active.length;
  const pendingCount = pending.length;
  const cancelledCount = cancelled.length;
  
  const faturamento = active.reduce((acc, curr) => acc + curr.amount, 0);
  
  // MRR: Monthly (<= 150) adds R$ 97, Annual (> 150) adds R$ 33.08
  const mrr = active.reduce((acc, curr) => {
    const isMonthly = curr.amount <= 150;
    return acc + (isMonthly ? 97 : 33.08);
  }, 0);
  
  const totalSubs = activeCount + cancelledCount;
  const churn = totalSubs > 0 ? (cancelledCount / totalSubs) * 100 : 0;
  const retention = 100 - churn;
  
  return {
    mrr,
    faturamento,
    activeCount,
    pendingCount,
    churn,
    retention
  };
};

const getPercentageChange = (current: number, previous: number) => {
  if (previous === 0) return current > 0 ? 100 : 0;
  return ((current - previous) / previous) * 100;
};

const getWhatsAppLink = (fullName: string, whatsapp: string, status: string = 'cancelled', amount: number = 97) => {
  let phoneClean = whatsapp.replace(/\D/g, '');
  if (!phoneClean) return null;
  
  // Prepend Brazil country code 55 if missing and number is simple mobile number
  if (phoneClean.length <= 11 && !phoneClean.startsWith('55')) {
    phoneClean = '55' + phoneClean;
  }
  
  const firstName = fullName.split(' ')[0];
  const planName = amount <= 150 ? "Plano Mensal" : "Plano Anual";
  
  let msg = "";
  if (status === 'pending') {
    msg = `Olá ${firstName}! Tudo bem? Vi que você iniciou a sua inscrição no Bananal PRO para o ${planName}, mas não chegou a concluir o pagamento na InfinitePay. Ficou com alguma dúvida sobre as ferramentas, o suporte com agrônomos ou o acesso? Estou por aqui para te ajudar!`;
  } else {
    msg = `Olá ${firstName}, tudo bem? Vimos que você solicitou o cancelamento da sua assinatura do Bananal PRO. Gostaríamos de entender o que houve e ver se podemos te ajudar com alguma condição ou suporte especial para você continuar conosco evoluindo sua produção!`;
  }
  
  return `https://wa.me/${phoneClean}?text=${encodeURIComponent(msg)}`;
};

export default function AdminFinancial() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [timeFilter, setTimeFilter] = useState<string>("6"); // "30" | "6" | "12" | "all"
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  const fetchSubscriptions = async () => {
    setLoading(true);
    try {
      let ordersData: any[] = [];
      try {
        const { data, error } = await supabase
          .from('orders')
          .select(`
            id,
            user_id,
            total_amount,
            status,
            payment_method,
            created_at,
            user_profiles:user_profiles!orders_user_id_fkey (
              full_name,
              email,
              whatsapp
            )
          `)
          .order('created_at', { ascending: false });

        if (error) throw error;
        ordersData = data || [];
      } catch (dbErr) {
        console.warn("Tabela 'orders' não encontrada ou inacessível. Utilizando fallback local.");
        const local = localStorage.getItem("admin_orders_db");
        if (local) {
          ordersData = JSON.parse(local);
        }
      }

      const formatted: Subscription[] = ordersData.map((o: any) => ({
        id: o.id,
        user_id: o.user_id,
        user_name: o.user_profiles?.full_name || "Produtor Desconhecido",
        user_email: o.user_profiles?.email || "desconhecido@bananalpro.com",
        user_whatsapp: o.user_profiles?.whatsapp || "",
        amount: o.total_amount || 97.00,
        status: o.status || "pending",
        payment_method: o.payment_method || "PIX",
        created_at: o.created_at || new Date().toISOString()
      }));

      // Sort chronologically descending
      formatted.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      setSubscriptions(formatted);
    } catch (err: any) {
      console.error("Error fetching subscriptions:", err);
      toast.error("Erro ao carregar assinaturas: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubscriptions();
  }, []);

  // Reset to first page on search or filter change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, timeFilter]);

  const handleUpdateStatus = async (orderId: number, newStatus: 'paid' | 'cancelled' | 'pending') => {
    setUpdatingId(orderId);
    try {
      try {
        const { error } = await supabase
          .from('orders')
          .update({ status: newStatus, updated_at: new Date().toISOString() })
          .eq('id', orderId);

        if (error) throw error;

        // Sync active status to user profile
        const order = subscriptions.find(s => s.id === orderId);
        if (order && order.user_id) {
          const { error: profileError } = await supabase
            .from('user_profiles')
            .update({ 
              is_active: newStatus === 'paid',
              updated_at: new Date().toISOString()
            })
            .eq('id', order.user_id);
          
          if (profileError) {
            console.error("Error updating user profile status:", profileError);
          }
        }
      } catch (dbErr) {
        // Fallback local update
        const local = localStorage.getItem("admin_orders_db");
        if (local) {
          const parsed = JSON.parse(local);
          const updated = parsed.map((o: any) => o.id === orderId ? { ...o, status: newStatus, updated_at: new Date().toISOString() } : o);
          localStorage.setItem("admin_orders_db", JSON.stringify(updated));
        }
      }

      toast.success(`Assinatura alterada para ${newStatus === 'paid' ? 'Ativa' : newStatus === 'cancelled' ? 'Cancelada' : 'Pendente'}`);
      setSubscriptions(prev => prev.map(s => s.id === orderId ? { ...s, status: newStatus } : s));
    } catch (err: any) {
      console.error("Error updating order status:", err);
      toast.error("Erro ao atualizar assinatura: " + err.message);
    } finally {
      setUpdatingId(null);
    }
  };

  // Memoized stats calculation for current and previous period
  const computedStats = React.useMemo(() => {
    const now = new Date();
    let currentStart = new Date(0);
    let previousStart = new Date(0);
    let previousEnd = new Date(0);
    const hasComparison = timeFilter !== "all";

    if (timeFilter === "30") {
      currentStart = subDays(now, 30);
      previousStart = subDays(now, 60);
      previousEnd = subDays(now, 30);
    } else if (timeFilter === "6") {
      currentStart = subDays(now, 180);
      previousStart = subDays(now, 360);
      previousEnd = subDays(now, 180);
    } else if (timeFilter === "12") {
      currentStart = subDays(now, 365);
      previousStart = subDays(now, 730);
      previousEnd = subDays(now, 365);
    }

    // Filter subscriptions for both periods
    const currentSubs = subscriptions.filter(s => new Date(s.created_at) >= currentStart);
    const previousSubs = subscriptions.filter(s => {
      const d = new Date(s.created_at);
      return d >= previousStart && d < previousEnd;
    });

    const currentPeriodStats = calculateStatsForPeriod(currentSubs);
    const previousPeriodStats = calculateStatsForPeriod(previousSubs);

    const mrrDiff = hasComparison ? getPercentageChange(currentPeriodStats.mrr, previousPeriodStats.mrr) : 0;
    const faturamentoDiff = hasComparison ? getPercentageChange(currentPeriodStats.faturamento, previousPeriodStats.faturamento) : 0;
    const activeDiff = hasComparison ? getPercentageChange(currentPeriodStats.activeCount, previousPeriodStats.activeCount) : 0;
    const pendingDiff = hasComparison ? getPercentageChange(currentPeriodStats.pendingCount, previousPeriodStats.pendingCount) : 0;

    return {
      current: currentPeriodStats,
      mrrDiff,
      faturamentoDiff,
      activeDiff,
      pendingDiff,
      hasComparison
    };
  }, [subscriptions, timeFilter]);

  // Aggregate monthly data for evolution chart
  const getChartData = () => {
    const monthsData: { [key: string]: { month: string; mrr: number; faturamento: number; timestamp: number } } = {};
    const now = new Date();
    let limitDate = new Date(0);
    
    if (timeFilter === "30") limitDate = subDays(now, 30);
    else if (timeFilter === "6") limitDate = subDays(now, 180);
    else if (timeFilter === "12") limitDate = subDays(now, 365);

    const activeOrders = subscriptions.filter(s => s.status === 'paid' && new Date(s.created_at) >= limitDate);

    activeOrders.forEach(sub => {
      const date = new Date(sub.created_at);
      const key = format(date, "yyyy-MM");
      const monthLabel = format(date, "MMM/yy", { locale: ptBR });

      if (!monthsData[key]) {
        monthsData[key] = {
          month: monthLabel,
          mrr: 0,
          faturamento: 0,
          timestamp: new Date(date.getFullYear(), date.getMonth(), 1).getTime()
        };
      }

      const isMonthly = sub.amount <= 150;
      monthsData[key].faturamento += sub.amount;
      monthsData[key].mrr += isMonthly ? 97 : 33.08;
    });

    return Object.values(monthsData).sort((a, b) => a.timestamp - b.timestamp);
  };

  // Count distribution of monthly vs annual plans
  const getPlanDistribution = () => {
    const now = new Date();
    let limitDate = new Date(0);
    
    if (timeFilter === "30") limitDate = subDays(now, 30);
    else if (timeFilter === "6") limitDate = subDays(now, 180);
    else if (timeFilter === "12") limitDate = subDays(now, 365);

    const activeOrders = subscriptions.filter(s => s.status === 'paid' && new Date(s.created_at) >= limitDate);
    const monthlyCount = activeOrders.filter(s => s.amount <= 150).length;
    const annualCount = activeOrders.filter(s => s.amount > 150).length;

    return [
      { name: "Mensal (R$ 97)", value: monthlyCount, color: "#10b981" },
      { name: "Anual (R$ 497)", value: annualCount, color: "#f59e0b" }
    ];
  };

  const renderTrend = (value: number) => {
    if (timeFilter === "all") return null;
    const isPositive = value >= 0;
    return (
      <div className={`flex items-center gap-1 text-[11px] font-bold mt-1.5 ${isPositive ? 'text-emerald-500' : 'text-red-500'}`}>
        {isPositive ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
        <span>{isPositive ? '+' : ''}{value.toFixed(1)}% vs período ant.</span>
      </div>
    );
  };

  // Filter and search table rows
  const filtered = subscriptions.filter(s => {
    const matchesSearch = s.user_name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          s.user_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          s.id.toString().includes(searchTerm);
    
    if (statusFilter === "all") return matchesSearch;
    if (statusFilter === "active") return matchesSearch && s.status === "paid";
    if (statusFilter === "pending") return matchesSearch && s.status === "pending";
    if (statusFilter === "cancelled") return matchesSearch && s.status === "cancelled";
    
    return matchesSearch;
  });

  // Paginated data calculations
  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginated = filtered.slice(startIndex, startIndex + itemsPerPage);

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-emerald-500/10 dark:bg-emerald-500/20 rounded-2xl border border-emerald-500/20">
              <DollarSign className="text-[#589c1c] dark:text-[#6ee7b7] w-8 h-8" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-800 dark:text-white">Assinaturas</h1>
              <p className="text-slate-500 dark:text-zinc-400 text-sm mt-1">Monitore a receita MRR, controle as assinaturas de produtores e analise o crescimento do caixa.</p>
            </div>
          </div>
          <div className="flex items-center gap-3 self-end md:self-auto">
            {/* Time Filter */}
            <div className="bg-white dark:bg-zinc-900/40 p-1.5 rounded-2xl border border-slate-200 dark:border-white/10 flex gap-1 shadow-sm font-sans">
              {[
                { id: "30", label: "30 dias" },
                { id: "6", label: "6 meses" },
                { id: "12", label: "1 ano" },
                { id: "all", label: "Tudo" }
              ].map(opt => (
                <button
                  key={opt.id}
                  onClick={() => setTimeFilter(opt.id)}
                  className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                    timeFilter === opt.id
                      ? "bg-slate-100 dark:bg-white/10 text-slate-800 dark:text-white"
                      : "text-slate-400 dark:text-zinc-500 hover:text-slate-650 dark:hover:text-zinc-300"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            <button 
              onClick={fetchSubscriptions}
              className="p-3 bg-white dark:bg-zinc-900/40 border border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-zinc-800 rounded-2xl text-slate-650 dark:text-zinc-300 hover:text-slate-800 dark:hover:text-white transition-all shadow-sm flex items-center gap-2 font-bold text-xs cursor-pointer"
            >
              <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
              Atualizar
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {[
            { 
              label: "Faturamento", 
              value: `R$ ${computedStats.current.faturamento.toLocaleString('pt-BR')}`, 
              desc: "Receita de Caixa Total", 
              color: "text-blue-600 dark:text-blue-400", 
              icon: DollarSign,
              hasDiff: computedStats.hasComparison,
              diffValue: computedStats.faturamentoDiff
            },
            { 
              label: "Receita MRR", 
              value: `R$ ${computedStats.current.mrr.toLocaleString('pt-BR')}`, 
              desc: "Recorrência Mensal", 
              color: "text-emerald-600 dark:text-emerald-400", 
              icon: TrendingUp,
              hasDiff: computedStats.hasComparison,
              diffValue: computedStats.mrrDiff
            },
            { 
              label: "Assinantes Ativos", 
              value: computedStats.current.activeCount.toString(), 
              desc: "Planos vigentes", 
              color: "text-emerald-600 dark:text-emerald-400", 
              icon: CheckCircle2,
              hasDiff: computedStats.hasComparison,
              diffValue: computedStats.activeDiff
            },
            { 
              label: "Pendentes/Pix", 
              value: computedStats.current.pendingCount.toString(), 
              desc: "Aguardando pagamento", 
              color: "text-yellow-600 dark:text-yellow-500", 
              icon: Clock,
              hasDiff: computedStats.hasComparison,
              diffValue: computedStats.pendingDiff
            },
            { 
              label: "Taxa de Churn", 
              value: `${computedStats.current.churn.toFixed(1)}%`, 
              desc: "Média de cancelamentos", 
              color: "text-red-650 dark:text-red-500", 
              icon: AlertTriangle,
              hasDiff: false
            },
          ].map((stat, i) => (
            <div key={i} className="bg-white dark:bg-zinc-900/40 border border-slate-100 dark:border-white/5 p-6 rounded-[2rem] shadow-sm relative overflow-hidden group flex flex-col justify-between">
              <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform">
                <stat.icon size={48} className={stat.color} />
              </div>
              <div>
                <p className="text-slate-400 dark:text-zinc-500 text-[10px] font-black uppercase tracking-widest mb-1">{stat.label}</p>
                <h3 className={`text-2xl font-black ${stat.color} tracking-tight`}>{stat.value}</h3>
              </div>
              <div className="mt-2 pt-2 border-t border-slate-50 dark:border-white/5">
                <p className="text-[10px] text-slate-400 dark:text-zinc-500 font-semibold">{stat.desc}</p>
                {stat.hasDiff && renderTrend(stat.diffValue)}
              </div>
            </div>
          ))}
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* MRR & Revenue Evolution AreaChart */}
          <div className="lg:col-span-2 bg-white dark:bg-zinc-900/40 border border-slate-100 dark:border-white/5 p-6 rounded-[2rem] shadow-sm flex flex-col justify-between space-y-4">
            <div>
              <h3 className="text-xs font-black text-slate-800 dark:text-white uppercase tracking-wider">Evolução Financeira</h3>
              <p className="text-[11px] text-slate-400 dark:text-zinc-500 mt-1">Comparativo temporal entre faturamento bruto de caixa e receita recorrente mensalizada (MRR)</p>
            </div>
            
            <div className="h-64 w-full">
              {getChartData().length === 0 ? (
                <div className="h-full w-full flex items-center justify-center text-slate-400 text-xs">
                  Sem dados suficientes para gerar o gráfico.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={getChartData()} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorMrr" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorFaturamento" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="month" stroke="#71717a" fontSize={10} tickLine={false} axisLine={false} />
                    <YAxis stroke="#71717a" fontSize={10} tickLine={false} axisLine={false} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: "rgba(9, 9, 11, 0.9)", border: "1px solid rgba(255, 255, 255, 0.1)", borderRadius: "1rem" }}
                      labelStyle={{ color: "#fff", fontWeight: "bold", fontSize: 11 }}
                      itemStyle={{ fontSize: 11 }}
                    />
                    <Area name="Faturamento (Caixa)" type="monotone" dataKey="faturamento" stroke="#3b82f6" strokeWidth={2.5} fillOpacity={1} fill="url(#colorFaturamento)" />
                    <Area name="MRR Recorrente" type="monotone" dataKey="mrr" stroke="#10b981" strokeWidth={2.5} fillOpacity={1} fill="url(#colorMrr)" />
                    <Legend wrapperStyle={{ fontSize: 10, fontWeight: "bold", paddingTop: 10 }} />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Plan Distribution PieChart */}
          <div className="bg-white dark:bg-zinc-900/40 border border-slate-100 dark:border-white/5 p-6 rounded-[2rem] shadow-sm flex flex-col justify-between space-y-4">
            <div>
              <h3 className="text-xs font-black text-slate-800 dark:text-white uppercase tracking-wider">Distribuição de Planos</h3>
              <p className="text-[11px] text-slate-400 dark:text-zinc-500 mt-1">Proporção de assinantes ativos por tipo de plano contratado</p>
            </div>

            <div className="h-64 w-full flex items-center justify-center relative">
              {getPlanDistribution().every(x => x.value === 0) ? (
                <div className="text-slate-400 text-xs">Sem assinantes ativos no período.</div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={getPlanDistribution()}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {getPlanDistribution().map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ backgroundColor: "rgba(9, 9, 11, 0.9)", border: "1px solid rgba(255, 255, 255, 0.1)", borderRadius: "1rem" }}
                      itemStyle={{ fontSize: 11, color: "#fff" }}
                    />
                    <Legend 
                      verticalAlign="bottom" 
                      align="center"
                      layout="horizontal"
                      iconSize={10}
                      wrapperStyle={{ fontSize: 10, fontWeight: "bold" }} 
                    />
                  </PieChart>
                </ResponsiveContainer>
              )}
              
              <div className="absolute flex flex-col items-center justify-center pointer-events-none">
                <span className="text-2xl font-black text-slate-800 dark:text-white">
                  {getPlanDistribution().reduce((sum, curr) => sum + curr.value, 0)}
                </span>
                <span className="text-[9px] font-black text-slate-450 dark:text-zinc-500 uppercase tracking-widest">
                  Assinantes
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 dark:text-zinc-500 group-focus-within:text-emerald-500 transition-colors" />
            <input
              type="text"
              placeholder="Buscar por nome do produtor, email ou ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white dark:bg-zinc-900/40 border border-slate-200 dark:border-white/10 rounded-2xl py-3.5 pl-12 pr-4 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all placeholder:text-slate-400 dark:placeholder:text-zinc-650 font-medium text-sm"
            />
          </div>
          <div className="flex gap-2">
            <div className="bg-white dark:bg-zinc-900/40 p-1.5 rounded-2xl border border-slate-200 dark:border-white/10 flex gap-1 shadow-sm">
              {[
                { id: "all", label: "Todos" },
                { id: "active", label: "Ativos" },
                { id: "pending", label: "Pendentes" },
                { id: "cancelled", label: "Cancelados" }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setStatusFilter(tab.id)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    statusFilter === tab.id 
                      ? "bg-[#589c1c] dark:bg-[#10b981] text-white shadow-md" 
                      : "text-slate-500 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-white"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Subscriptions List */}
        <div className="bg-white dark:bg-zinc-900/40 border border-slate-100 dark:border-white/5 rounded-[2rem] shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50 dark:bg-white/5">
                <tr>
                  <th className="px-8 py-5 text-[10px] font-black uppercase text-slate-500 dark:text-zinc-400 border-b border-slate-100 dark:border-white/5">ID / Data</th>
                  <th className="px-8 py-5 text-[10px] font-black uppercase text-slate-500 dark:text-zinc-400 border-b border-slate-100 dark:border-white/5">Produtor</th>
                  <th className="px-8 py-5 text-[10px] font-black uppercase text-slate-500 dark:text-zinc-400 border-b border-slate-100 dark:border-white/5">Plano / Valor</th>
                  <th className="px-8 py-5 text-[10px] font-black uppercase text-slate-500 dark:text-zinc-400 border-b border-slate-100 dark:border-white/5">Pagamento</th>
                  <th className="px-8 py-5 text-[10px] font-black uppercase text-slate-500 dark:text-zinc-400 border-b border-slate-100 dark:border-white/5">Status</th>
                  <th className="px-8 py-5 text-[10px] font-black uppercase text-slate-500 dark:text-zinc-400 border-b border-slate-100 dark:border-white/5 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-8 py-20 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
                        <p className="text-slate-400 dark:text-zinc-500 text-sm font-medium">Carregando assinaturas...</p>
                      </div>
                    </td>
                  </tr>
                ) : paginated.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-8 py-20 text-center text-slate-400 dark:text-zinc-500">
                      Nenhuma assinatura encontrada.
                    </td>
                  </tr>
                ) : (
                  paginated.map((sub, index) => (
                    <motion.tr 
                      key={sub.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.01 }}
                      className="hover:bg-slate-50/50 dark:hover:bg-white/[0.01] transition-colors border-b border-slate-100 dark:border-white/5 last:border-0"
                    >
                      <td className="px-8 py-6">
                        <div className="flex flex-col">
                          <span className="text-sm font-mono text-slate-650 dark:text-zinc-450">#{sub.id}</span>
                          <span className="text-xs text-slate-400 dark:text-zinc-500">
                            {format(new Date(sub.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                          </span>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
                            <User size={16} />
                          </div>
                          <div>
                            <p className="font-bold text-slate-800 dark:text-white text-sm">{sub.user_name}</p>
                            <p className="text-xs text-slate-400 dark:text-zinc-500">{sub.user_email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <div>
                          <p className="text-sm font-bold text-slate-800 dark:text-white">
                            {sub.amount <= 150 ? "Plano Mensal" : "Plano Anual"}
                          </p>
                          <p className="text-xs text-emerald-600 dark:text-emerald-400 font-bold">
                            R$ {sub.amount.toLocaleString('pt-BR')} {sub.amount <= 150 ? '/mês' : '/ano'}
                          </p>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-2 text-slate-500 dark:text-zinc-400 text-xs font-bold">
                          <CreditCard size={14} className="text-slate-400" />
                          {sub.payment_method}
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <span className={`text-[10px] font-black px-3 py-1.5 rounded-full uppercase border ${
                          sub.status === "paid" ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20" :
                          sub.status === "pending" ? "bg-yellow-500/10 text-yellow-600 dark:text-yellow-500 border-yellow-500/20" :
                          "bg-red-500/10 text-red-650 dark:text-red-500 border-red-500/20"
                        }`}>
                          {sub.status === "paid" ? "Ativa" : sub.status === "pending" ? "Pendente" : "Cancelada"}
                        </span>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex justify-end gap-2">
                          {(sub.status === "cancelled" || sub.status === "pending") && sub.user_whatsapp && (
                            <a
                              href={getWhatsAppLink(sub.user_name, sub.user_whatsapp, sub.status, sub.amount) || "#"}
                              target="_blank"
                              rel="noopener noreferrer"
                              className={`px-3 py-2 text-white rounded-xl transition-all font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-sm ${
                                sub.status === "pending" 
                                  ? "bg-amber-600 hover:bg-amber-700 shadow-amber-500/10" 
                                  : "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/10"
                              }`}
                              title={sub.status === "pending" ? "Recuperar Carrinho via WhatsApp" : "Chamar no WhatsApp para reverter cancelamento"}
                            >
                              <MessageCircle size={14} />
                              {sub.status === "pending" ? "Recuperar Carrinho" : "Recuperar"}
                            </a>
                          )}
                          {sub.status !== "paid" && (
                            <button
                              disabled={updatingId === sub.id}
                              onClick={() => handleUpdateStatus(sub.id, 'paid')}
                              className="px-3 py-2 bg-emerald-500/10 hover:bg-emerald-600 text-emerald-600 hover:text-white dark:text-emerald-400 rounded-xl transition-all font-bold text-xs flex items-center gap-1.5 disabled:opacity-50 cursor-pointer border border-emerald-500/10 animate-fade-in"
                              title="Ativar/Aprovar Assinatura"
                            >
                              {updatingId === sub.id ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
                              Ativar
                            </button>
                          )}
                          {sub.status !== "cancelled" && (
                            <button
                              disabled={updatingId === sub.id}
                              onClick={() => handleUpdateStatus(sub.id, 'cancelled')}
                              className="px-3 py-2 bg-red-500/10 hover:bg-red-600 text-red-600 hover:text-white dark:text-red-400 rounded-xl transition-all font-bold text-xs flex items-center gap-1.5 disabled:opacity-50 cursor-pointer border border-red-500/10 animate-fade-in"
                              title="Cancelar/Bloquear Assinatura"
                            >
                              {updatingId === sub.id ? <Loader2 size={14} className="animate-spin" /> : <Ban size={14} />}
                              Cancelar
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
          
          {/* Pagination Controls */}
          {totalPages > 1 ? (
            <div className="p-6 bg-slate-50 dark:bg-white/[0.01] border-t border-slate-100 dark:border-white/5 flex items-center justify-between font-sans">
              <p className="text-xs text-slate-400 dark:text-zinc-500 font-medium">
                Mostrando {startIndex + 1} a {Math.min(startIndex + itemsPerPage, filtered.length)} de {filtered.length} assinaturas
              </p>
              <div className="flex items-center gap-2">
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  className="px-3 py-1.5 rounded-lg text-xs font-bold bg-white dark:bg-zinc-900 border border-slate-200 dark:border-white/10 text-slate-650 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-800 disabled:opacity-50 transition-all cursor-pointer"
                >
                  Anterior
                </button>
                <span className="text-xs font-bold text-slate-650 dark:text-zinc-400">
                  Página {currentPage} de {totalPages}
                </span>
                <button
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  className="px-3 py-1.5 rounded-lg text-xs font-bold bg-white dark:bg-zinc-900 border border-slate-200 dark:border-white/10 text-slate-650 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-800 disabled:opacity-50 transition-all cursor-pointer"
                >
                  Próximo
                </button>
              </div>
            </div>
          ) : (
            <div className="p-6 bg-slate-50 dark:bg-white/[0.01] border-t border-slate-100 dark:border-white/5 flex items-center justify-between">
              <p className="text-xs text-slate-400 dark:text-zinc-500 font-medium">
                Mostrando {filtered.length} de {subscriptions.length} assinaturas
              </p>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
