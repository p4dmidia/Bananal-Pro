import React, { useEffect, useState } from "react";
import AdminLayout from "../../components/Layout/AdminLayout";
import Layout from "../../components/Layout/Layout";
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
  Users,
  CreditCard, 
  Ban, 
  RefreshCw, 
  ArrowUpRight, 
  ArrowDownRight, 
  Calendar, 
  MessageCircle, 
  ShieldCheck, 
  Plus, 
  Trash2, 
  Percent,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import { supabase } from "../../lib/supabase";
import { toast } from "sonner";
import { format, subDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useAuth } from "../../contexts/AuthContext";
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
  user_active?: boolean;
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

const calculateStatsForPeriod = (subsList: Subscription[], allSubs: Subscription[] = []): PeriodStats => {
  // Faturamento e pendentes são específicos do período filtrado
  const activeInPeriod = subsList.filter(s => s.status === 'paid' && s.user_id !== null && s.user_id !== undefined);
  const pending = subsList.filter(s => s.status === 'pending' && s.user_id !== null && s.user_id !== undefined);
  const pendingCount = pending.length;
  const faturamento = activeInPeriod.reduce((acc, curr) => acc + curr.amount, 0);

  // MRR, Assinantes Ativos, Churn e Retenção medem a base inteira (allSubs) para evitar divergências
  const history = allSubs.length > 0 ? allSubs : subsList;
  const historyPaid = history.filter(s => s.status === 'paid' && s.user_id !== null && s.user_id !== undefined);

  // Mapeia o último valor de plano de cada usuário ativo na base histórica
  const activeUsersMap = new Map<number, number>();
  historyPaid.forEach(s => {
    if (s.user_active) {
      const existingDate = activeUsersMap.get(s.user_id) ? new Date(historyPaid.find(x => x.user_id === s.user_id)?.created_at || 0) : new Date(0);
      if (new Date(s.created_at) >= existingDate) {
        activeUsersMap.set(s.user_id, s.amount);
      }
    }
  });

  const activeCount = activeUsersMap.size;

  // Calcula MRR real
  let mrr = 0;
  activeUsersMap.forEach((amount) => {
    const isMonthly = amount <= 150;
    mrr += isMonthly ? 97 : 41.41;
  });

  // Calcula churn baseados nos usuários que já pagaram mas estão inativos hoje
  const uniquePaidUserIds = Array.from(new Set(historyPaid.map(s => s.user_id)));
  let cancelledCount = 0;

  uniquePaidUserIds.forEach(userId => {
    const orderForUser = history.find(s => s.user_id === userId);
    const isUserActive = orderForUser ? orderForUser.user_active : false;
    if (!isUserActive) {
      cancelledCount++;
    }
  });

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
  
  if (phoneClean.length <= 11 && !phoneClean.startsWith('55')) {
    phoneClean = '55' + phoneClean;
  }
  
  const firstName = fullName.split(' ')[0];
  const planName = amount <= 150 ? "Plano Mensal" : "Plano Anual";
  
  let msg = "";
  if (status === 'pending') {
    msg = `Olá ${firstName}! Tudo bem? Vi que você iniciou a sua inscrição no Bananal PRO para o ${planName}, mas não chegou a concluir o pagamento. Ficou com alguma dúvida sobre as ferramentas, o suporte com agrônomos ou o acesso? Estou por aqui para te ajudar!`;
  } else {
    msg = `Olá ${firstName}, tudo bem? Vimos que você solicitou o cancelamento da sua assinatura do Bananal PRO. Gostaríamos de entender o que houve e ver se podemos te ajudar com alguma condição ou suporte especial para você continuar conosco evoluindo sua produção!`;
  }
  
  return `https://wa.me/${phoneClean}?text=${encodeURIComponent(msg)}`;
};

export default function AdminFinancial() {
  const { profile, session } = useAuth();
  const supabaseAny = supabase as any;
  const LayoutComponent = profile?.role === 'admin' ? AdminLayout : Layout;
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [timeFilter, setTimeFilter] = useState<string>("30"); // Inicializar com "30" por padrão
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  // Novos estados para agrupamento e datas customizadas
  const [expandedEmails, setExpandedEmails] = useState<{ [email: string]: boolean }>({});
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");

  // Estados para lançamento de Assinatura Manual
  const [isManualSubModalOpen, setIsManualSubModalOpen] = useState(false);
  const [manualSubForm, setManualSubForm] = useState({
    userId: "",
    planType: "mensal", // "mensal" | "anual" | "custom"
    customAmount: "",
    paymentMethod: "PIX",
    trackingCode: "",
  });
  const [manualSubLoading, setManualSubLoading] = useState(false);
  const [userSearchTerm, setUserSearchTerm] = useState("");

  const toggleExpand = (email: string) => {
    setExpandedEmails(prev => ({
      ...prev,
      [email.toLowerCase()]: !prev[email.toLowerCase()]
    }));
  };

  // Estados adicionais para divisão de lucros e controle sócio/PJ
  const [activeTab, setActiveTab] = useState<'orders' | 'earnings' | 'config'>('orders');
  const [partnerEarnings, setPartnerEarnings] = useState<any[]>([]);
  const [sharingConfigs, setSharingConfigs] = useState<any[]>([]);
  const [loadingSharing, setLoadingSharing] = useState(false);
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const [configForm, setConfigForm] = useState({ userId: "", roleType: "pj", percentage: 0 });
  const [userList, setUserList] = useState<any[]>([]);

  // Filtro de usuários para assinatura manual
  const filteredUserListForManualSub = React.useMemo(() => {
    if (!userSearchTerm.trim()) return userList.slice(0, 100);
    return userList.filter(u =>
      (u.full_name || '').toLowerCase().includes(userSearchTerm.toLowerCase()) ||
      (u.email || '').toLowerCase().includes(userSearchTerm.toLowerCase())
    );
  }, [userList, userSearchTerm]);

  const handleCreateManualSub = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualSubForm.userId) {
      toast.error("Por favor, selecione um usuário.");
      return;
    }

    let finalAmount = 97.00;
    if (manualSubForm.planType === 'anual') {
      finalAmount = 497.00;
    } else if (manualSubForm.planType === 'custom') {
      finalAmount = Number(manualSubForm.customAmount);
      if (isNaN(finalAmount) || finalAmount <= 0) {
        toast.error("Por favor, insira um valor válido maior que zero.");
        return;
      }
    }

    setManualSubLoading(true);
    try {
      const token = session?.access_token;
      if (!token) {
        throw new Error("Sessão não encontrada. Por favor, refaça o login.");
      }

      const res = await fetch("/api/create-manual-subscription", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          userId: Number(manualSubForm.userId),
          amount: finalAmount,
          paymentMethod: manualSubForm.paymentMethod,
          trackingCode: manualSubForm.trackingCode || `MANUAL-${Date.now()}`
        })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Erro ao criar assinatura manual.");
      }

      toast.success(data.message || "Assinatura manual lançada com sucesso!");
      setIsManualSubModalOpen(false);
      // Reset form
      setManualSubForm({
        userId: "",
        planType: "mensal",
        customAmount: "",
        paymentMethod: "PIX",
        trackingCode: "",
      });
      setUserSearchTerm("");
      
      // Recarrega todos os dados
      await fetchAllData();
    } catch (err: any) {
      console.error("Erro ao criar assinatura manual:", err);
      toast.error(err.message || "Erro inesperado.");
    } finally {
      setManualSubLoading(false);
    }
  };

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  const isPj = profile?.role === 'pj';
  const isPartner = profile?.role === 'partner';
  const isAdmin = profile?.role === 'admin';

  const fetchSubscriptions = async () => {
    try {
      let ordersData: any[] = [];
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
            phone,
            is_active
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      ordersData = data || [];

      const formatted: Subscription[] = ordersData
        .filter((o: any) => Number(o.total_amount) > 1.00) // Desconsidera planos de 1 real de teste
        .map((o: any) => ({
          id: o.id,
          user_id: o.user_id,
          user_name: o.user_profiles?.full_name || "Produtor Desconhecido",
          user_email: o.user_profiles?.email || "desconhecido@bananalpro.com",
          user_whatsapp: o.user_profiles?.phone || "",
          user_active: o.user_profiles?.is_active ?? false,
          amount: o.total_amount || 97.00,
          status: o.status || "pending",
          payment_method: o.payment_method || "PIX",
          created_at: o.created_at || new Date().toISOString()
        }));

      setSubscriptions(formatted);
    } catch (err: any) {
      console.error("Error fetching subscriptions:", err);
      toast.error("Erro ao carregar assinaturas: " + err.message);
    }
  };

  const fetchPartnerEarnings = async () => {
    try {
      let query = supabaseAny
        .from('partner_earnings')
        .select(`
          id,
          order_id,
          user_id,
          amount,
          created_at,
          user_profiles:user_profiles!partner_earnings_user_id_fkey (
            full_name,
            email
          ),
          orders:orders!partner_earnings_order_id_fkey (
            total_amount,
            payment_method,
            user_profiles:user_profiles!orders_user_id_fkey (
              full_name
            )
          )
        `)
        .order('created_at', { ascending: false });

      if (isPj) {
        // PJs visualizam apenas suas próprias comissões
        const { data: { user: authUser } } = await supabase.auth.getUser();
        if (authUser) {
          // Busca o id do perfil para filtrar
          const { data: userProf } = await supabaseAny
            .from('user_profiles')
            .select('id')
            .eq('mocha_user_id', authUser.id)
            .single();
          
          if (userProf) {
            query = query.eq('user_id', userProf.id);
          }
        }
      }

      const { data, error } = await query;
      if (error) throw error;
      setPartnerEarnings(data || []);
    } catch (err: any) {
      console.error('Error fetching partner earnings:', err);
    }
  };

  const fetchSharingConfigs = async () => {
    setLoadingSharing(true);
    try {
      const { data, error } = await supabaseAny
        .from('profit_sharing_config')
        .select(`
          id,
          user_id,
          role_type,
          share_percentage,
          user_profiles:user_profiles!profit_sharing_config_user_id_fkey (
            full_name,
            email
          )
        `);

      if (error) throw error;
      setSharingConfigs(data || []);
    } catch (err: any) {
      console.error('Error fetching sharing configs:', err);
    } finally {
      setLoadingSharing(false);
    }
  };

  const fetchUserList = async () => {
    try {
      const { data, error } = await supabaseAny
        .from('user_profiles')
        .select('id, full_name, email')
        .order('full_name');
      if (error) throw error;
      setUserList(data || []);
    } catch (err: any) {
      console.error('Error fetching user list:', err);
    }
  };

  const fetchAllData = async () => {
    setLoading(true);
    await fetchSubscriptions();
    await fetchPartnerEarnings();
    await fetchSharingConfigs();
    if (isAdmin) {
      await fetchUserList();
    }
    setLoading(false);
  };

  useEffect(() => {
    if (profile?.role) {
      fetchAllData();
      // Se for PJ, força aba padrão para ser orders (que no caso do PJ mostrará a lista de comissões dele)
      if (profile?.role === 'pj') {
        setActiveTab('orders');
      }
    }
  }, [profile?.role]);

  const handleUpdateStatus = async (orderId: number, newStatus: 'paid' | 'cancelled' | 'pending') => {
    setUpdatingId(orderId);
    try {
      const { error } = await supabaseAny
        .from('orders')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', orderId);

      if (error) throw error;

      // Sincroniza status ativo no perfil do usuário
      const order = subscriptions.find(s => s.id === orderId);
      if (order && order.user_id) {
        const { error: profileError } = await supabaseAny
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

      toast.success(`Assinatura alterada para ${newStatus === 'paid' ? 'Ativa' : newStatus === 'cancelled' ? 'Cancelada' : 'Pendente'}`);
      await fetchAllData();
    } catch (err: any) {
      console.error("Error updating order status:", err);
      toast.error("Erro ao atualizar assinatura: " + err.message);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!configForm.userId || configForm.percentage <= 0) {
      toast.error('Preencha todos os campos e use um percentual válido.');
      return;
    }

    try {
      const currentSum = sharingConfigs
        .filter(c => Number(c.user_id) !== Number(configForm.userId))
        .reduce((sum, c) => sum + Number(c.share_percentage), 0);

      if (currentSum + Number(configForm.percentage) > 100) {
        toast.error(`A soma dos percentuais não pode exceder 100% (atual: ${currentSum}%).`);
        return;
      }

      const { error } = await supabaseAny
        .from('profit_sharing_config')
        .upsert({
          user_id: Number(configForm.userId),
          role_type: configForm.roleType,
          share_percentage: Number(configForm.percentage)
        }, { onConflict: 'user_id' });

      if (error) throw error;

      // Altera o cargo (role) do usuário no perfil
      await supabaseAny
        .from('user_profiles')
        .update({ role: configForm.roleType })
        .eq('id', Number(configForm.userId));

      toast.success('Regra de rateio salva com sucesso!');
      setIsConfigModalOpen(false);
      await fetchSharingConfigs();
    } catch (err: any) {
      console.error('Error saving sharing config:', err);
      toast.error('Erro ao salvar configuração: ' + err.message);
    }
  };

  const handleDeleteConfig = async (id: number, userId: number | string) => {
    if (!window.confirm('Tem certeza que deseja remover esta regra de divisão?')) return;
    try {
      const { error } = await supabaseAny
        .from('profit_sharing_config')
        .delete()
        .eq('id', id);

      if (error) throw error;

      // Restaura o cargo do usuário para 'user'
      await supabaseAny
        .from('user_profiles')
        .update({ role: 'user' })
        .eq('id', Number(userId));

      toast.success('Regra removida com sucesso!');
      await fetchSharingConfigs();
    } catch (err: any) {
      console.error('Error deleting config:', err);
      toast.error('Erro ao remover configuração: ' + err.message);
    }
  };

  // Memoized stats calculation for current and previous period
  const computedStats = React.useMemo(() => {
    const now = new Date();
    const getStartOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
    const startOfToday = getStartOfDay(now);

    let currentStart = new Date(0);
    let currentEnd = now;
    let previousStart = new Date(0);
    let previousEnd = new Date(0);
    let hasComparison = timeFilter !== "all" && timeFilter !== "custom";

    if (timeFilter === "today") {
      currentStart = startOfToday;
      previousStart = subDays(startOfToday, 1);
      previousEnd = startOfToday;
    } else if (timeFilter === "yesterday") {
      currentStart = subDays(startOfToday, 1);
      currentEnd = startOfToday;
      previousStart = subDays(startOfToday, 2);
      previousEnd = subDays(startOfToday, 1);
    } else if (timeFilter === "7") {
      currentStart = subDays(now, 7);
      previousStart = subDays(now, 14);
      previousEnd = subDays(now, 7);
    } else if (timeFilter === "15") {
      currentStart = subDays(now, 15);
      previousStart = subDays(now, 30);
      previousEnd = subDays(now, 15);
    } else if (timeFilter === "30") {
      currentStart = subDays(now, 30);
      previousStart = subDays(now, 60);
      previousEnd = subDays(now, 30);
    } else if (timeFilter === "custom") {
      currentStart = startDate ? new Date(startDate + "T00:00:00") : new Date(0);
      currentEnd = endDate ? new Date(endDate + "T23:59:59") : now;
      hasComparison = false;
    }

    const currentSubs = subscriptions.filter(s => {
      const d = new Date(s.created_at);
      return d >= currentStart && d <= currentEnd;
    });

    const previousSubs = subscriptions.filter(s => {
      const d = new Date(s.created_at);
      return d >= previousStart && d < previousEnd;
    });

    const currentPeriodStats = calculateStatsForPeriod(currentSubs, subscriptions);
    const previousPeriodStats = calculateStatsForPeriod(previousSubs, subscriptions);

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
  }, [subscriptions, timeFilter, startDate, endDate]);

  // Ganhos totais acumulados do PJ atual
  const myTotalEarnings = React.useMemo(() => {
    if (!profile) return 0;
    return partnerEarnings
      .filter(e => Number(e.user_id) === Number(profile.id))
      .reduce((sum, e) => sum + Number(e.amount), 0);
  }, [partnerEarnings, profile]);

  // Percentual configurado para o PJ atual
  const mySharePercentage = React.useMemo(() => {
    if (!profile) return 0;
    return sharingConfigs.find(c => Number(c.user_id) === Number(profile.id))?.share_percentage || 0;
  }, [sharingConfigs, profile]);

  // Agrega dados mensais ou diários para o gráfico de evolução
  const getChartData = () => {
    const now = new Date();
    const getStartOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
    const startOfToday = getStartOfDay(now);

    let limitStart = new Date(0);
    let limitEnd = now;
    
    if (timeFilter === "today") limitStart = startOfToday;
    else if (timeFilter === "yesterday") {
      limitStart = subDays(startOfToday, 1);
      limitEnd = startOfToday;
    }
    else if (timeFilter === "7") limitStart = subDays(now, 7);
    else if (timeFilter === "15") limitStart = subDays(now, 15);
    else if (timeFilter === "30") limitStart = subDays(now, 30);
    else if (timeFilter === "custom") {
      limitStart = startDate ? new Date(startDate + "T00:00:00") : new Date(0);
      limitEnd = endDate ? new Date(endDate + "T23:59:59") : now;
    }

    const activeOrders = subscriptions.filter(s => s.status === 'paid' && new Date(s.created_at) >= limitStart && new Date(s.created_at) <= limitEnd);

    // Se o período for curto (<= 30 dias), agrupamos por dia. Caso contrário, agrupamos por mês.
    const isShortPeriod = timeFilter === "today" || timeFilter === "yesterday" || timeFilter === "7" || timeFilter === "15" || timeFilter === "30" || (timeFilter === "custom" && (limitEnd.getTime() - limitStart.getTime()) <= 30 * 24 * 60 * 60 * 1000);

    const pointsData: { [key: string]: { month: string; mrr: number; faturamento: number; timestamp: number } } = {};

    activeOrders.forEach(sub => {
      const date = new Date(sub.created_at);
      const key = isShortPeriod ? format(date, "yyyy-MM-dd") : format(date, "yyyy-MM");
      const label = isShortPeriod ? format(date, "dd/MM", { locale: ptBR }) : format(date, "MMM/yy", { locale: ptBR });

      if (!pointsData[key]) {
        pointsData[key] = {
          month: label,
          mrr: 0,
          faturamento: 0,
          timestamp: isShortPeriod ? date.getTime() : new Date(date.getFullYear(), date.getMonth(), 1).getTime()
        };
      }

      const isMonthly = sub.amount <= 150;
      pointsData[key].faturamento += sub.amount;
      pointsData[key].mrr += isMonthly ? 97 : 41.41;
    });

    return Object.values(pointsData).sort((a, b) => a.timestamp - b.timestamp);
  };

  // Distribuição de assinantes por tipo de plano
  const getPlanDistribution = () => {
    const now = new Date();
    const getStartOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
    const startOfToday = getStartOfDay(now);

    let limitStart = new Date(0);
    let limitEnd = now;
    
    if (timeFilter === "today") limitStart = startOfToday;
    else if (timeFilter === "yesterday") {
      limitStart = subDays(startOfToday, 1);
      limitEnd = startOfToday;
    }
    else if (timeFilter === "7") limitStart = subDays(now, 7);
    else if (timeFilter === "15") limitStart = subDays(now, 15);
    else if (timeFilter === "30") limitStart = subDays(now, 30);
    else if (timeFilter === "custom") {
      limitStart = startDate ? new Date(startDate + "T00:00:00") : new Date(0);
      limitEnd = endDate ? new Date(endDate + "T23:59:59") : now;
    }

    const activeOrders = subscriptions.filter(s => s.status === 'paid' && new Date(s.created_at) >= limitStart && new Date(s.created_at) <= limitEnd);
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

  // Filtro e busca para a tabela principal (Orders ou Earnings)
  const filtered = React.useMemo(() => {
    if (activeTab === 'orders') {
      return subscriptions.filter(s => {
        const matchesSearch = s.user_name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                              s.user_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                              s.id.toString().includes(searchTerm);
        
        if (statusFilter === "all") return matchesSearch;
        if (statusFilter === "active") return matchesSearch && s.status === "paid";
        if (statusFilter === "pending") return matchesSearch && s.status === "pending";
        if (statusFilter === "cancelled") return matchesSearch && s.status === "cancelled";
        
        return matchesSearch;
      });
    } else {
      // Filtra comissões
      return partnerEarnings.filter(e => {
        const matchesSearch = (e.user_profiles?.full_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                              (e.orders?.user_profiles?.full_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                              (e.order_id || '').toString().includes(searchTerm);
        return matchesSearch;
      });
    }
  }, [subscriptions, partnerEarnings, activeTab, searchTerm, statusFilter]);

  // Agrupamento inteligente para a aba de assinaturas
  interface GroupedSubscription {
    main: Subscription;
    attempts: Subscription[];
  }

  const groupedSubscriptions = React.useMemo(() => {
    if (activeTab !== 'orders') return [];
    
    const emailGroups: { [email: string]: Subscription[] } = {};
    filtered.forEach(sub => {
      const email = sub.user_email.toLowerCase();
      if (!emailGroups[email]) {
        emailGroups[email] = [];
      }
      emailGroups[email].push(sub);
    });

    const groups: GroupedSubscription[] = [];
    Object.values(emailGroups).forEach(subs => {
      // Ordena por data decrescente (mais recente primeiro)
      subs.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      groups.push({
        main: subs[0],
        attempts: subs.slice(1)
      });
    });

    // Ordena os grupos pela data do item principal decrescente
    groups.sort((a, b) => new Date(b.main.created_at).getTime() - new Date(a.main.created_at).getTime());
    return groups;
  }, [filtered, activeTab]);

  const totalPages = activeTab === 'orders' 
    ? Math.ceil(groupedSubscriptions.length / itemsPerPage)
    : Math.ceil(filtered.length / itemsPerPage);

  const startIndex = (currentPage - 1) * itemsPerPage;

  const paginated = filtered.slice(startIndex, startIndex + itemsPerPage);
  
  const paginatedGroups = React.useMemo(() => {
    if (activeTab !== 'orders') return [];
    return groupedSubscriptions.slice(startIndex, startIndex + itemsPerPage);
  }, [groupedSubscriptions, startIndex]);

  // Auxiliar para Badge de Status inteligente
  const getStatusBadge = (status: string, userActive: boolean) => {
    if (status === "paid") {
      return (
        <span className="text-[10px] font-black px-3 py-1.5 rounded-full uppercase border bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20">
          Ativa
        </span>
      );
    }
    // Se o usuário correspondente já estiver ativo por outra via/compra, o status desta tentativa pendente é considerado falha no pagamento
    if (userActive) {
      return (
        <span className="text-[10px] font-black px-3 py-1.5 rounded-full uppercase border bg-red-500/10 text-red-650 dark:text-red-500 border-red-500/20">
          Falha no Pagamento
        </span>
      );
    }
    if (status === "pending") {
      return (
        <span className="text-[10px] font-black px-3 py-1.5 rounded-full uppercase border bg-yellow-500/10 text-yellow-600 dark:text-yellow-500 border-yellow-500/20">
          Pendente
        </span>
      );
    }
    return (
      <span className="text-[10px] font-black px-3 py-1.5 rounded-full uppercase border bg-red-500/10 text-red-650 dark:text-red-500 border-red-500/20">
        Cancelada
      </span>
    );
  };

  const baseStats = [
    { 
      label: "Faturamento Bruto", 
      value: `R$ ${computedStats.current.faturamento.toLocaleString('pt-BR')}`, 
      desc: "Receita de Caixa Total", 
      color: "text-blue-600 dark:text-blue-400", 
      icon: DollarSign,
      hasDiff: computedStats.hasComparison,
      diffValue: computedStats.faturamentoDiff
    },
    { 
      label: "Receita MRR", 
      value: `R$ ${computedStats.current.mrr.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}`, 
      desc: "Recorrência Mensalizada", 
      color: "text-emerald-600 dark:text-emerald-400", 
      icon: TrendingUp,
      hasDiff: computedStats.hasComparison,
      diffValue: computedStats.mrrDiff
    },
    { 
      label: "Reserva da Empresa (50%)", 
      value: `R$ ${(computedStats.current.faturamento * 0.50).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 
      desc: "Fundo de Reinvestimento", 
      color: "text-slate-650 dark:text-zinc-400", 
      icon: ShieldCheck,
      hasDiff: false,
      diffValue: 0
    },
    { 
      label: "Rateio Sócios/PJs (50%)", 
      value: `R$ ${(computedStats.current.faturamento * 0.50).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 
      desc: "Disponível para divisão de lucros", 
      color: "text-yellow-600 dark:text-yellow-500", 
      icon: Users,
      hasDiff: false,
      diffValue: 0
    },
    { 
      label: "Assinantes Ativos", 
      value: computedStats.current.activeCount.toString(), 
      desc: "Planos vigentes", 
      color: "text-purple-600 dark:text-purple-400", 
      icon: CheckCircle2,
      hasDiff: computedStats.hasComparison,
      diffValue: computedStats.activeDiff
    }
  ];

  // Se o usuário tiver participação configurada e for sócio/admin, mostramos seu valor a receber no período
  const hasShare = mySharePercentage > 0;
  if (isPartner || (isAdmin && hasShare)) {
    const myEstimatedEarnings = computedStats.current.faturamento * 0.50 * (mySharePercentage / 100);
    baseStats.push({
      label: "Meu Valor a Receber",
      value: `R$ ${myEstimatedEarnings.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      desc: `Sua cota: ${mySharePercentage}% do rateio`,
      color: "text-amber-500 dark:text-amber-400",
      icon: Percent,
      hasDiff: false,
      diffValue: 0
    });
  }

  const statsToRender = isPj 
    ? [
        {
          label: "Minhas Comissões (Acumulado)",
          value: `R$ ${myTotalEarnings.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
          desc: "Seu ganho líquido acumulado",
          color: "text-emerald-600 dark:text-emerald-400",
          icon: DollarSign,
          hasDiff: false,
          diffValue: 0
        },
        {
          label: "Minha Participação",
          value: `${mySharePercentage}%`,
          desc: "Divisão sobre 50% do lucro líquido",
          color: "text-blue-600 dark:text-blue-400",
          icon: Percent,
          hasDiff: false,
          diffValue: 0
        },
        {
          label: "Meu Valor a Receber",
          value: `R$ ${(computedStats.current.faturamento * 0.50 * (mySharePercentage / 100)).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
          desc: `Sua cota de ${mySharePercentage}% do rateio`,
          color: "text-yellow-600 dark:text-yellow-500",
          icon: Percent,
          hasDiff: false,
          diffValue: 0
        }
      ]
    : baseStats;

  const gridColsClass = isPj 
    ? 'lg:grid-cols-3' 
    : (isPartner || (isAdmin && hasShare)) 
    ? 'lg:grid-cols-6' 
    : 'lg:grid-cols-5';

  return (
    <LayoutComponent>
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-emerald-500/10 dark:bg-emerald-500/20 rounded-2xl border border-emerald-500/20">
              <DollarSign className="text-[#589c1c] dark:text-[#6ee7b7] w-8 h-8" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-800 dark:text-white">
                {isPj ? "Minhas Comissões" : "Financeiro"}
              </h1>
              <p className="text-slate-500 dark:text-zinc-400 text-sm mt-1">
                {isPj 
                  ? "Acompanhe seus rendimentos e histórico de comissões no Bananal PRO." 
                  : "Monitore a receita, controle a reserva e gerencie a divisão de dividendos da empresa."
                }
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3 self-start lg:self-auto w-full lg:w-auto justify-start lg:justify-end">
            {/* Time Filter */}
            {!isPj && (
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
                {timeFilter === "custom" && (
                  <div className="flex items-center gap-2 bg-white dark:bg-zinc-900/40 p-1.5 rounded-2xl border border-slate-200 dark:border-white/10 shadow-sm text-xs font-semibold px-3 shrink-0">
                    <span className="text-[9px] uppercase font-black tracking-wider text-slate-450 dark:text-zinc-500">De:</span>
                    <input 
                      type="date" 
                      value={startDate} 
                      onChange={(e) => setStartDate(e.target.value)} 
                      className="bg-transparent text-slate-800 dark:text-white focus:outline-none border-none text-[11px] cursor-pointer"
                    />
                    <span className="text-[9px] uppercase font-black tracking-wider text-slate-450 dark:text-zinc-500">Até:</span>
                    <input 
                      type="date" 
                      value={endDate} 
                      onChange={(e) => setEndDate(e.target.value)} 
                      className="bg-transparent text-slate-800 dark:text-white focus:outline-none border-none text-[11px] cursor-pointer"
                    />
                  </div>
                )}
                
                <div className="bg-white dark:bg-zinc-900/40 p-1.5 rounded-2xl border border-slate-200 dark:border-white/10 flex gap-1 shadow-sm font-sans overflow-x-auto whitespace-nowrap max-w-full flex-nowrap scrollbar-thin">
                  {[
                    { id: "today", label: "Hoje" },
                    { id: "yesterday", label: "Ontem" },
                    { id: "7", label: "7 dias" },
                    { id: "15", label: "15 dias" },
                    { id: "30", label: "30 dias" },
                    { id: "custom", label: "Personalizado" },
                    { id: "all", label: "Tudo" }
                  ].map(opt => (
                    <button
                      key={opt.id}
                      onClick={() => {
                        setTimeFilter(opt.id);
                        if (opt.id === "custom") {
                          if (!startDate) setStartDate(format(subDays(new Date(), 7), "yyyy-MM-dd"));
                          if (!endDate) setEndDate(format(new Date(), "yyyy-MM-dd"));
                        }
                      }}
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
              </div>
            )}
            <button 
              onClick={fetchAllData}
              className="p-3 bg-white dark:bg-zinc-900/40 border border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-zinc-800 rounded-2xl text-slate-655 dark:text-zinc-300 hover:text-slate-800 dark:hover:text-white transition-all shadow-sm flex items-center gap-2 font-bold text-xs cursor-pointer"
            >
              <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
              Atualizar
            </button>
            {isAdmin && (
              <button 
                onClick={() => setIsManualSubModalOpen(true)}
                className="p-3 bg-[#589c1c] hover:bg-emerald-600 dark:bg-[#10b981] dark:hover:bg-[#0d9468] text-white rounded-2xl font-bold text-xs cursor-pointer shadow-md flex items-center gap-2 transition-all"
              >
                <Plus size={16} />
                Lançar Assinatura
              </button>
            )}
          </div>
        </div>

        {/* Stats Grid */}
        <div className={`grid grid-cols-1 sm:grid-cols-2 ${gridColsClass} gap-4`}>
          {statsToRender.map((stat, i) => (
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

        {/* Charts Section - Hided for PJs */}
        {!isPj && (
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
        )}

        {/* Tab Selector & Filters */}
        <div className="space-y-4">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-200 dark:border-white/10 pb-2">
            
            {/* Tabs (Hided for PJs) */}
            {!isPj ? (
              <div className="flex gap-2">
                <button
                  onClick={() => { setActiveTab('orders'); setCurrentPage(1); }}
                  className={`px-4 py-2 text-xs font-black uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
                    activeTab === 'orders'
                      ? "border-emerald-500 text-slate-800 dark:text-white font-bold"
                      : "border-transparent text-slate-450 dark:text-zinc-500 hover:text-slate-800 dark:hover:text-white"
                  }`}
                >
                  Assinaturas
                </button>
                <button
                  onClick={() => { setActiveTab('earnings'); setCurrentPage(1); }}
                  className={`px-4 py-2 text-xs font-black uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
                    activeTab === 'earnings'
                      ? "border-emerald-500 text-slate-800 dark:text-white font-bold"
                      : "border-transparent text-slate-450 dark:text-zinc-500 hover:text-slate-800 dark:hover:text-white"
                  }`}
                >
                  Rateio / Distribuição
                </button>
                {(isAdmin || isPartner) && (
                  <button
                    onClick={() => { setActiveTab('config'); setCurrentPage(1); }}
                    className={`px-4 py-2 text-xs font-black uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
                      activeTab === 'config'
                        ? "border-emerald-500 text-slate-800 dark:text-white font-bold"
                        : "border-transparent text-slate-450 dark:text-zinc-500 hover:text-slate-800 dark:hover:text-white"
                    }`}
                  >
                    Regras de Rateio
                  </button>
                )}
              </div>
            ) : (
              <h2 className="text-base font-bold text-slate-850 dark:text-white">Minhas Comissões Recebidas</h2>
            )}

            {/* Filter controls */}
            {activeTab !== 'config' && (
              <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                <div className="relative group flex-1 sm:w-64">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-zinc-500 group-focus-within:text-emerald-500 transition-colors" />
                  <input
                    type="text"
                    placeholder="Buscar..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-white dark:bg-zinc-900/40 border border-slate-200 dark:border-white/10 rounded-2xl py-2 pl-10 pr-4 text-slate-850 dark:text-white focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-all placeholder:text-slate-400 dark:placeholder:text-zinc-500 font-medium text-xs"
                  />
                </div>
                
                {activeTab === 'orders' && (
                  <div className="bg-white dark:bg-zinc-900/40 p-1 rounded-2xl border border-slate-200 dark:border-white/10 flex gap-1 shadow-sm">
                    {[
                      { id: "all", label: "Todos" },
                      { id: "active", label: "Ativos" },
                      { id: "pending", label: "Pendentes" },
                      { id: "cancelled", label: "Cancelados" }
                    ].map(tab => (
                      <button
                        key={tab.id}
                        onClick={() => setStatusFilter(tab.id)}
                        className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                          statusFilter === tab.id 
                            ? "bg-[#589c1c] dark:bg-[#10b981] text-white shadow-sm" 
                            : "text-slate-500 dark:text-zinc-500 hover:text-slate-850 dark:hover:text-white"
                        }`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Tab 1: Orders / Subscriptions Table */}
        {activeTab === 'orders' && (
          <div className="bg-white dark:bg-zinc-900/40 border border-slate-100 dark:border-white/5 rounded-[2rem] shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50 dark:bg-white/5">
                  {isPj ? (
                    <tr>
                      <th className="px-8 py-5 text-[10px] font-black uppercase text-slate-500 dark:text-zinc-400 border-b border-slate-100 dark:border-white/5">Data</th>
                      <th className="px-8 py-5 text-[10px] font-black uppercase text-slate-500 dark:text-zinc-400 border-b border-slate-100 dark:border-white/5">Venda de Origem</th>
                      <th className="px-8 py-5 text-[10px] font-black uppercase text-slate-500 dark:text-zinc-400 border-b border-slate-100 dark:border-white/5">Método / Pagamento</th>
                      <th className="px-8 py-5 text-[10px] font-black uppercase text-slate-500 dark:text-zinc-400 border-b border-slate-100 dark:border-white/5">Sua Comissão</th>
                      <th className="px-8 py-5 text-[10px] font-black uppercase text-slate-500 dark:text-zinc-400 border-b border-slate-100 dark:border-white/5">Status</th>
                    </tr>
                  ) : (
                    <tr>
                      <th className="px-8 py-5 text-[10px] font-black uppercase text-slate-500 dark:text-zinc-400 border-b border-slate-100 dark:border-white/5">ID / Data</th>
                      <th className="px-8 py-5 text-[10px] font-black uppercase text-slate-500 dark:text-zinc-400 border-b border-slate-100 dark:border-white/5">Produtor</th>
                      <th className="px-8 py-5 text-[10px] font-black uppercase text-slate-500 dark:text-zinc-400 border-b border-slate-100 dark:border-white/5">Plano / Valor</th>
                      <th className="px-8 py-5 text-[10px] font-black uppercase text-slate-500 dark:text-zinc-400 border-b border-slate-100 dark:border-white/5">Pagamento</th>
                      <th className="px-8 py-5 text-[10px] font-black uppercase text-slate-500 dark:text-zinc-400 border-b border-slate-100 dark:border-white/5">Status</th>
                      <th className="px-8 py-5 text-[10px] font-black uppercase text-slate-500 dark:text-zinc-400 border-b border-slate-100 dark:border-white/5 text-right">Ações</th>
                    </tr>
                  )}
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                  {loading ? (
                    <tr>
                      <td colSpan={isPj ? 5 : 6} className="px-8 py-20 text-center">
                        <div className="flex flex-col items-center gap-3">
                          <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
                          <p className="text-slate-400 dark:text-zinc-500 text-sm font-medium">Carregando dados...</p>
                        </div>
                      </td>
                    </tr>
                  ) : paginated.length === 0 ? (
                    <tr>
                      <td colSpan={isPj ? 5 : 6} className="px-8 py-20 text-center text-slate-400 dark:text-zinc-500">
                        Nenhum registro localizado.
                      </td>
                    </tr>
                  ) : isPj ? (
                    // Renderiza lista de comissões para PJs
                    paginated.map((earning: any, index) => (
                      <motion.tr
                        key={earning.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.01 }}
                        className="hover:bg-slate-50/50 dark:hover:bg-white/[0.01] transition-colors border-b border-slate-100 dark:border-white/5 last:border-0"
                      >
                        <td className="px-8 py-6">
                          <span className="text-xs text-slate-650 dark:text-zinc-450 font-inter-medium">
                            {format(new Date(earning.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                          </span>
                        </td>
                        <td className="px-8 py-6">
                          <div>
                            <p className="text-xs font-bold text-slate-800 dark:text-white">
                              {Number(earning.orders?.total_amount) > 150 ? 'Plano Anual' : 'Plano Mensal'}
                            </p>
                            <p className="text-[10px] text-slate-400">
                              Faturamento bruto: R$ {Number(earning.orders?.total_amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </p>
                          </div>
                        </td>
                        <td className="px-8 py-6">
                          <div className="flex items-center gap-2 text-slate-500 dark:text-zinc-400 text-xs font-semibold">
                            <CreditCard size={13} className="text-slate-400" />
                            {earning.orders?.payment_method || 'Cartão de Crédito'}
                          </div>
                        </td>
                        <td className="px-8 py-6">
                          <span className="text-xs font-black text-emerald-600 dark:text-emerald-400 font-mono">
                            + R$ {Number(earning.amount).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </span>
                        </td>
                        <td className="px-8 py-6">
                          <span className="text-[9px] font-black px-2.5 py-1 rounded-full uppercase border bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20">
                            Aprovado
                          </span>
                        </td>
                      </motion.tr>
                    ))
                  ) : (
                    // Renderiza lista agrupada de pedidos para Admins/Sócios
                    paginatedGroups.map((group, index) => {
                      const sub = group.main;
                      const hasHistory = group.attempts.length > 0;
                      const isExpanded = !!expandedEmails[sub.user_email.toLowerCase()];

                      return (
                        <React.Fragment key={sub.id}>
                          <motion.tr 
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.01 }}
                            className="hover:bg-slate-50/50 dark:hover:bg-white/[0.01] transition-colors border-b border-slate-100 dark:border-white/5 last:border-0"
                          >
                            <td className="px-8 py-6">
                              <div className="flex items-center gap-2">
                                {hasHistory && (
                                  <button
                                    onClick={() => toggleExpand(sub.user_email)}
                                    className="p-1 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-lg text-slate-400 hover:text-slate-650 transition-all cursor-pointer"
                                  >
                                    {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                                  </button>
                                )}
                                <div className="flex flex-col">
                                  <span className="text-sm font-mono text-slate-650 dark:text-zinc-450 flex items-center gap-1">
                                    #{sub.id}
                                    {hasHistory && (
                                      <span className="text-[9px] bg-slate-100 dark:bg-zinc-850 text-slate-500 font-black px-1.5 py-0.5 rounded leading-none">
                                        {group.attempts.length + 1} tent.
                                      </span>
                                    )}
                                  </span>
                                  <span className="text-xs text-slate-400 dark:text-zinc-500">
                                    {format(new Date(sub.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                                  </span>
                                </div>
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
                                  <div className="flex items-center gap-1.5 mt-1">
                                    <span className={`text-[9px] px-2 py-0.5 rounded-full font-extrabold tracking-wider border uppercase ${
                                      sub.user_active 
                                        ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" 
                                        : "bg-zinc-500/10 text-zinc-500 border-zinc-500/10"
                                    }`}>
                                      {sub.user_active ? "Acesso Ativo no Sistema" : "Sem Acesso no Sistema"}
                                    </span>
                                  </div>
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
                              {getStatusBadge(sub.status, sub.user_active)}
                            </td>
                            <td className="px-8 py-6 text-right">
                              <div className="flex justify-end gap-2">
                                {(sub.status === "cancelled" || sub.status === "pending") && sub.user_whatsapp && (
                                  <a
                                    href={getWhatsAppLink(sub.user_name, sub.user_whatsapp, sub.status, sub.amount) || "#"}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className={`px-3 py-2 text-white rounded-xl transition-all font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-sm ${
                                      sub.status === "pending" 
                                        ? "bg-amber-650 hover:bg-amber-700 shadow-amber-500/10" 
                                        : "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/10"
                                    }`}
                                    title={sub.status === "pending" ? "Recuperar Carrinho via WhatsApp" : "Chamar no WhatsApp para reverter cancelamento"}
                                  >
                                    <MessageCircle size={14} />
                                    Recuperar
                                  </a>
                                )}
                                {isAdmin && sub.status !== "paid" && !sub.user_active && (
                                  <button
                                    disabled={updatingId === sub.id}
                                    onClick={() => handleUpdateStatus(sub.id, 'paid')}
                                    className="px-3 py-2 bg-emerald-500/10 hover:bg-emerald-600 text-emerald-600 hover:text-white dark:text-emerald-400 rounded-xl transition-all font-bold text-xs flex items-center gap-1.5 disabled:opacity-50 cursor-pointer border border-emerald-500/10"
                                  >
                                    Ativar
                                  </button>
                                )}
                                {isAdmin && sub.status !== "cancelled" && (
                                  <button
                                    disabled={updatingId === sub.id}
                                    onClick={() => handleUpdateStatus(sub.id, 'cancelled')}
                                    className="px-3 py-2 bg-red-500/10 hover:bg-red-600 text-red-600 hover:text-white dark:text-red-400 rounded-xl transition-all font-bold text-xs flex items-center gap-1.5 disabled:opacity-50 cursor-pointer border border-red-500/10"
                                  >
                                    Cancelar
                                  </button>
                                )}
                              </div>
                            </td>
                          </motion.tr>

                          {/* Renderiza tentativas falhas/histórico quando expandido */}
                          <AnimatePresence>
                            {isExpanded && group.attempts.map((attempt) => (
                              <motion.tr
                                key={attempt.id}
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                exit={{ opacity: 0, height: 0 }}
                                className="bg-slate-50/30 dark:bg-white/[0.005] border-b border-slate-100 dark:border-white/5 last:border-0"
                              >
                                <td className="px-8 py-4 pl-14">
                                  <div className="flex flex-col">
                                    <span className="text-[11px] font-mono text-slate-400 dark:text-zinc-550">#{attempt.id} (tentativa)</span>
                                    <span className="text-[10px] text-slate-400 dark:text-zinc-550">
                                      {format(new Date(attempt.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                                    </span>
                                  </div>
                                </td>
                                <td className="px-8 py-4 text-xs text-slate-400 dark:text-zinc-500">
                                  <div className="flex items-center gap-2">
                                    <span>E-mail: {attempt.user_email}</span>
                                  </div>
                                </td>
                                <td className="px-8 py-4 text-xs text-slate-450">
                                  R$ {attempt.amount.toLocaleString('pt-BR')} ({attempt.amount <= 150 ? 'Mensal' : 'Anual'})
                                </td>
                                <td className="px-8 py-4 text-xs text-slate-450">
                                  {attempt.payment_method}
                                </td>
                                <td className="px-8 py-4">
                                  {getStatusBadge(attempt.status, attempt.user_active)}
                                </td>
                                <td className="px-8 py-4 text-right">
                                  <div className="flex justify-end gap-2">
                                    {isAdmin && attempt.status !== "paid" && !attempt.user_active && (
                                      <button
                                        disabled={updatingId === attempt.id}
                                        onClick={() => handleUpdateStatus(attempt.id, 'paid')}
                                        className="px-2 py-1 bg-emerald-500/10 hover:bg-emerald-600 text-emerald-600 hover:text-white dark:text-emerald-400 rounded-lg transition-all font-bold text-[10px] disabled:opacity-50 cursor-pointer border border-emerald-500/10"
                                      >
                                        Ativar
                                      </button>
                                    )}
                                  </div>
                                </td>
                              </motion.tr>
                            ))}
                          </AnimatePresence>
                        </React.Fragment>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
 
            {/* Pagination */}
            {totalPages > 1 && (
              <div className="p-6 bg-slate-50 dark:bg-white/[0.01] border-t border-slate-100 dark:border-white/5 flex items-center justify-between">
                <p className="text-xs text-slate-400 dark:text-zinc-500 font-medium">
                  Página {currentPage} de {totalPages} ({activeTab === 'orders' ? groupedSubscriptions.length : filtered.length} {activeTab === 'orders' ? 'assinantes' : 'itens'} no total)
                </p>
                <div className="flex items-center gap-2">
                  <button
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    className="px-3 py-1.5 rounded-lg text-xs font-bold bg-white dark:bg-zinc-900 border border-slate-200 dark:border-white/10 text-slate-650 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-800 disabled:opacity-50 transition-all cursor-pointer"
                  >
                    Anterior
                  </button>
                  <button
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    className="px-3 py-1.5 rounded-lg text-xs font-bold bg-white dark:bg-zinc-900 border border-slate-200 dark:border-white/10 text-slate-650 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-800 disabled:opacity-50 transition-all cursor-pointer"
                  >
                    Próximo
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Profit sharing / commissions logs */}
        {activeTab === 'earnings' && !isPj && (
          <div className="bg-white dark:bg-zinc-900/40 border border-slate-100 dark:border-white/5 rounded-[2rem] shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50 dark:bg-white/5">
                  <tr>
                    <th className="px-8 py-5 text-[10px] font-black uppercase text-slate-500 dark:text-zinc-400 border-b border-slate-100 dark:border-white/5">Data</th>
                    <th className="px-8 py-5 text-[10px] font-black uppercase text-slate-500 dark:text-zinc-400 border-b border-slate-100 dark:border-white/5">Beneficiário</th>
                    <th className="px-8 py-5 text-[10px] font-black uppercase text-slate-500 dark:text-zinc-400 border-b border-slate-100 dark:border-white/5">Tipo</th>
                    <th className="px-8 py-5 text-[10px] font-black uppercase text-slate-500 dark:text-zinc-400 border-b border-slate-100 dark:border-white/5">Comprador Original</th>
                    <th className="px-8 py-5 text-[10px] font-black uppercase text-slate-500 dark:text-zinc-400 border-b border-slate-100 dark:border-white/5">Valor Divisão</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                  {loading ? (
                    <tr>
                      <td colSpan={5} className="px-8 py-20 text-center">
                        <div className="flex flex-col items-center gap-3">
                          <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
                          <p className="text-slate-400 dark:text-zinc-500 text-sm font-medium">Carregando rateios...</p>
                        </div>
                      </td>
                    </tr>
                  ) : paginated.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-8 py-20 text-center text-slate-400 dark:text-zinc-500">
                        Nenhum registro de rateio gerado.
                      </td>
                    </tr>
                  ) : (
                    paginated.map((earning: any, index) => (
                      <motion.tr
                        key={earning.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.01 }}
                        className="hover:bg-slate-50/50 dark:hover:bg-white/[0.01] transition-colors border-b border-slate-100 dark:border-white/5 last:border-0"
                      >
                        <td className="px-8 py-6">
                          <span className="text-xs text-slate-650 dark:text-zinc-450">
                            {format(new Date(earning.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                          </span>
                        </td>
                        <td className="px-8 py-6">
                          <div>
                            <p className="font-bold text-slate-800 dark:text-white text-sm">
                              {earning.user_profiles?.full_name || 'Desconhecido'}
                            </p>
                            <p className="text-[10px] text-slate-400">{earning.user_profiles?.email}</p>
                          </div>
                        </td>
                        <td className="px-8 py-6">
                          <span className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase border ${
                            sharingConfigs.find(c => c.user_id === earning.user_id)?.role_type === 'partner'
                              ? 'bg-blue-500/10 text-blue-600 border-blue-500/20'
                              : 'bg-zinc-500/10 text-zinc-600 border-zinc-500/20'
                          }`}>
                            {sharingConfigs.find(c => c.user_id === earning.user_id)?.role_type === 'partner' ? 'Sócio' : 'PJ'}
                          </span>
                        </td>
                        <td className="px-8 py-6">
                          <div>
                            <p className="text-xs text-slate-700 dark:text-zinc-300 font-semibold">
                              {earning.orders?.user_profiles?.full_name || 'Comprador'}
                            </p>
                            <p className="text-[10px] text-slate-400">
                              Bruto: R$ {Number(earning.orders?.total_amount || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </p>
                          </div>
                        </td>
                        <td className="px-8 py-6 font-mono text-xs font-bold text-emerald-600">
                          + R$ {Number(earning.amount).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                      </motion.tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="p-6 bg-slate-50 dark:bg-white/[0.01] border-t border-slate-100 dark:border-white/5 flex items-center justify-between">
                <p className="text-xs text-slate-400 dark:text-zinc-500 font-medium">
                  Página {currentPage} de {totalPages} ({filtered.length} itens no total)
                </p>
                <div className="flex items-center gap-2">
                  <button
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    className="px-3 py-1.5 rounded-lg text-xs font-bold bg-white dark:bg-zinc-900 border border-slate-200 dark:border-white/10 text-slate-650 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-800 disabled:opacity-50 transition-all cursor-pointer"
                  >
                    Anterior
                  </button>
                  <button
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    className="px-3 py-1.5 rounded-lg text-xs font-bold bg-white dark:bg-zinc-900 border border-slate-200 dark:border-white/10 text-slate-650 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-800 disabled:opacity-50 transition-all cursor-pointer"
                  >
                    Próximo
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Configuration (Admins & Partners) */}
        {activeTab === 'config' && (isAdmin || isPartner) && (
          <div className="bg-white dark:bg-zinc-900/40 border border-slate-100 dark:border-white/5 rounded-[2rem] shadow-sm p-6 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-black uppercase tracking-wider text-slate-800 dark:text-white">Gerenciamento de Sócios e PJs</h3>
                <p className="text-[11px] text-slate-450 mt-1">
                  Defina quais usuários receberão comissão/rateio e configure seus respectivos percentuais do bolo. A soma não deve exceder 100%.
                </p>
              </div>
              <button
                onClick={() => {
                  setConfigForm({ userId: '', roleType: 'pj', percentage: 0 });
                  setIsConfigModalOpen(true);
                }}
                className="bg-[#589c1c] hover:bg-emerald-600 text-white font-bold text-xs uppercase tracking-wider px-4 py-3 rounded-2xl flex items-center gap-2 cursor-pointer shadow-md"
              >
                <Plus size={15} />
                Nova Regra
              </button>
            </div>

            {loadingSharing ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
              </div>
            ) : sharingConfigs.length === 0 ? (
              <div className="text-center py-20 text-slate-450 dark:text-zinc-550 text-xs">
                Nenhuma regra de rateio cadastrada ainda.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {sharingConfigs.map(config => (
                  <div key={config.id} className="border border-slate-200 dark:border-white/5 bg-zinc-50/50 dark:bg-white/[0.01] p-5 rounded-2xl flex items-center justify-between shadow-sm">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <span className={`text-[8px] font-black uppercase px-2 py-0.5 border rounded-full ${
                          config.role_type === 'partner'
                            ? 'bg-blue-500/10 text-blue-600 border-blue-500/20'
                            : 'bg-zinc-500/10 text-zinc-650 border-zinc-500/20'
                        }`}>
                          {config.role_type === 'partner' ? 'Sócio' : 'PJ'}
                        </span>
                        <p className="font-bold text-slate-800 dark:text-white text-sm">
                          {config.user_profiles?.full_name || 'Usuário'}
                        </p>
                      </div>
                      <p className="text-[10px] text-slate-450">{config.user_profiles?.email}</p>
                      <p className="text-xs font-semibold text-emerald-600">
                        Percentual: <strong className="text-sm font-extrabold">{config.share_percentage}%</strong> da receita distribuível.
                      </p>
                    </div>
                    <button
                      onClick={() => handleDeleteConfig(config.id, config.user_id)}
                      className="p-3 bg-red-500/10 hover:bg-red-650 hover:text-white text-red-650 rounded-xl transition-all cursor-pointer"
                      title="Excluir Regra"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </div>

      {/* Modal - Nova Regra de Divisão */}
      <AnimatePresence>
        {isConfigModalOpen && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-white/10 rounded-[2.5rem] w-full max-w-md p-8 shadow-2xl relative"
            >
              <button
                onClick={() => setIsConfigModalOpen(false)}
                className="absolute top-6 right-6 p-2 rounded-full hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-500"
              >
                <XCircle size={20} />
              </button>

              <h3 className="text-lg font-black text-slate-850 dark:text-white mb-6 uppercase tracking-wider">Nova Regra de Rateio</h3>

              <form onSubmit={handleSaveConfig} className="space-y-5 font-sans">
                
                {/* Selecionar Usuário */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">Usuário Elegível:</label>
                  <select
                    value={configForm.userId}
                    onChange={(e) => setConfigForm(prev => ({ ...prev, userId: e.target.value }))}
                    className="w-full bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-xs font-semibold text-slate-800 dark:text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  >
                    <option value="">Selecione um usuário...</option>
                    {userList.map(u => (
                      <option key={u.id} value={u.id}>{u.full_name} ({u.email})</option>
                    ))}
                  </select>
                </div>

                {/* Selecionar Tipo */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">Tipo de Cargo/Divisão:</label>
                  <select
                    value={configForm.roleType}
                    onChange={(e) => setConfigForm(prev => ({ ...prev, roleType: e.target.value }))}
                    className="w-full bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-xs font-semibold text-slate-800 dark:text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  >
                    <option value="pj">Prestador PJ</option>
                    <option value="partner">Sócio</option>
                  </select>
                </div>

                {/* Definir Percentual */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">Participação (%):</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    max="100"
                    placeholder="Ex: 35.00"
                    value={configForm.percentage || ''}
                    onChange={(e) => setConfigForm(prev => ({ ...prev, percentage: Number(e.target.value) }))}
                    className="w-full bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-xs font-semibold text-slate-800 dark:text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                <div className="pt-4 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setIsConfigModalOpen(false)}
                    className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-650 font-bold text-xs uppercase tracking-wider py-3.5 rounded-xl cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-[#589c1c] hover:bg-emerald-600 text-white font-bold text-xs uppercase tracking-wider py-3.5 rounded-xl cursor-pointer shadow-md"
                  >
                    Salvar Regra
                  </button>
                </div>

              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal - Nova Assinatura Manual */}
      <AnimatePresence>
        {isManualSubModalOpen && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-white/10 rounded-[2.5rem] w-full max-w-md p-8 shadow-2xl relative"
            >
              <button
                onClick={() => {
                  setIsManualSubModalOpen(false);
                  setUserSearchTerm("");
                }}
                className="absolute top-6 right-6 p-2 rounded-full hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-500 cursor-pointer"
              >
                <XCircle size={20} />
              </button>

              <h3 className="text-lg font-black text-slate-850 dark:text-white mb-6 uppercase tracking-wider">Lançar Assinatura Manual</h3>

              <form onSubmit={handleCreateManualSub} className="space-y-5 font-sans">
                
                {/* Buscar e Selecionar Usuário */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">Filtrar Usuário:</label>
                  <input
                    type="text"
                    placeholder="Digite nome ou e-mail..."
                    value={userSearchTerm}
                    onChange={(e) => setUserSearchTerm(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-xs font-semibold text-slate-800 dark:text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">Selecionar Membro:</label>
                  <select
                    value={manualSubForm.userId}
                    onChange={(e) => setManualSubForm(prev => ({ ...prev, userId: e.target.value }))}
                    className="w-full bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-xs font-semibold text-slate-800 dark:text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  >
                    <option value="">Selecione um usuário...</option>
                    {filteredUserListForManualSub.map(u => (
                      <option key={u.id} value={u.id}>{u.full_name} ({u.email})</option>
                    ))}
                  </select>
                  {filteredUserListForManualSub.length === 0 && (
                    <p className="text-[10px] text-red-500 font-semibold mt-1">Nenhum usuário correspondente encontrado.</p>
                  )}
                </div>

                {/* Selecionar Plano */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">Plano:</label>
                  <select
                    value={manualSubForm.planType}
                    onChange={(e) => setManualSubForm(prev => ({ ...prev, planType: e.target.value }))}
                    className="w-full bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-xs font-semibold text-slate-800 dark:text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  >
                    <option value="mensal">Plano Mensal (R$ 97,00)</option>
                    <option value="anual">Plano Anual (R$ 497,00)</option>
                    <option value="custom">Valor Personalizado</option>
                  </select>
                </div>

                {/* Valor Personalizado se custom */}
                {manualSubForm.planType === 'custom' && (
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">Valor (R$):</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      placeholder="Ex: 150.00"
                      value={manualSubForm.customAmount}
                      onChange={(e) => setManualSubForm(prev => ({ ...prev, customAmount: e.target.value }))}
                      className="w-full bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-xs font-semibold text-slate-800 dark:text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>
                )}

                {/* Método de Pagamento */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">Método de Pagamento:</label>
                  <select
                    value={manualSubForm.paymentMethod}
                    onChange={(e) => setManualSubForm(prev => ({ ...prev, paymentMethod: e.target.value }))}
                    className="w-full bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-xs font-semibold text-slate-800 dark:text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  >
                    <option value="PIX">PIX</option>
                    <option value="Cartão de Crédito">Cartão de Crédito</option>
                    <option value="Transferência Bancária">Transferência Bancária</option>
                    <option value="Dinheiro">Dinheiro</option>
                    <option value="Cortesia / Parceria">Cortesia / Parceria</option>
                  </select>
                </div>

                {/* Observações / Tracking Code */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">Código de Rastreio / Notas (Opcional):</label>
                  <input
                    type="text"
                    placeholder="Ex: TxID do Pix, Comprovante, etc."
                    value={manualSubForm.trackingCode}
                    onChange={(e) => setManualSubForm(prev => ({ ...prev, trackingCode: e.target.value }))}
                    className="w-full bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-xs font-semibold text-slate-800 dark:text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                <div className="pt-4 flex gap-3">
                  <button
                    type="button"
                    disabled={manualSubLoading}
                    onClick={() => {
                      setIsManualSubModalOpen(false);
                      setUserSearchTerm("");
                    }}
                    className="flex-1 bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-655 dark:text-zinc-300 font-bold text-xs uppercase tracking-wider py-3.5 rounded-xl cursor-pointer disabled:opacity-50"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={manualSubLoading}
                    className="flex-1 bg-[#589c1c] hover:bg-emerald-600 text-white font-bold text-xs uppercase tracking-wider py-3.5 rounded-xl cursor-pointer shadow-md disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {manualSubLoading && <Loader2 size={14} className="animate-spin" />}
                    Lançar Assinatura
                  </button>
                </div>

              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </LayoutComponent>
  );
}
