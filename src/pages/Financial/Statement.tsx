import React, { useState, useEffect } from "react";
import Layout from "../../components/Layout/Layout";
import { motion, AnimatePresence } from "motion/react";
import { 
  Wallet, 
  ArrowDownCircle, 
  ArrowUpCircle, 
  Search, 
  Filter, 
  Download,
  PlusCircle,
  History,
  X,
  TrendingUp,
  AlertCircle,
  Calculator,
  Loader2,
  Trash2,
  Pencil,
  Sparkles,
  CheckCircle2,
  Calendar,
  Package,
  Sprout,
  Map,
  Zap
} from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { supabase } from "../../lib/supabase";
import { toast } from "react-hot-toast";
import { ResponsiveContainer, AreaChart, Area } from "recharts";
import bannerImg from "../../assets/banana_plantation_financial_chart.png";

export interface CycleExpense {
  id: string;
  description: string;
  amount: number;
  date: string;
}

export interface ProductionCycle {
  id: string;
  user_id?: string;
  name: string;
  plants_count: number;
  banana_variety: string;
  start_date: string;
  end_date: string | null;
  status: "Ativo" | "Encerrado";
  boxes_harvested: number | null;
  price_per_box: number | null;
  expenses: CycleExpense[];
  notes: string | null;
  ai_diagnosis: string | null;
}

interface FarmTransaction {
  id: string;
  type: "Receita" | "Despesa";
  category: string;
  costClassification: string; // Fixo or Variável
  amount: number;
  date: string;
  description: string;
  area_id?: number | null;
}

function CostGaugeCard({ title, value, sublabel, changeText, percentage }: {
  title: string;
  value: string;
  sublabel: string;
  changeText: string;
  percentage: number;
}) {
  const radius = 22;
  const strokeWidth = 4.5;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (Math.min(percentage, 100) / 100) * circumference;

  return (
    <div className="glass-card p-6 rounded-[2rem] border-white/5 bg-zinc-900/30 flex items-center gap-4 text-left">
      <div className="relative w-16 h-16 flex items-center justify-center shrink-0">
        <svg className="w-full h-full -rotate-90">
          <circle
            cx="32"
            cy="32"
            r={radius}
            fill="transparent"
            stroke="rgba(88, 156, 28, 0.1)"
            strokeWidth={strokeWidth}
          />
          <circle
            cx="32"
            cy="32"
            r={radius}
            fill="transparent"
            stroke="#589c1c"
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className="transition-all duration-1000 ease-out"
          />
        </svg>
      </div>

      <div className="flex-1 space-y-1">
        <div className="flex items-center gap-1.5 text-slate-400 dark:text-zinc-500">
          <TrendingUp size={14} className="text-[#589c1c] dark:text-[#6ee7b7]" />
          <span className="text-[10px] font-black uppercase tracking-widest">{title}</span>
        </div>
        <div>
          <h4 className="text-2xl font-display font-black text-slate-800 dark:text-white">{value}</h4>
          <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">{sublabel}</span>
        </div>
        <div className="flex items-center gap-1 text-[10px] font-bold text-[#589c1c] dark:text-[#6ee7b7]">
          {changeText}
        </div>
      </div>
    </div>
  );
}

export default function Statement() {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [loadingTransactions, setLoadingTransactions] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);

  // Farm area and plants stats for formulas
  const [hectares, setHectares] = useState<number>(5);
  const [plantsCount, setPlantsCount] = useState<number>(8000);
  const [targetBoxPrice, setTargetBoxPrice] = useState<number>(35); // Preço estimado da caixa de banana R$

  // Estados para o Simulador de Vendas e Produtividade
  const [simPlants, setSimPlants] = useState<number>(8000);
  const [simBoxes, setSimBoxes] = useState<number>(500);
  const [simPricePerKg, setSimPricePerKg] = useState<number>(1.75);
  const [simBoxWeight, setSimBoxWeight] = useState<number>(20); // padrão 20kg (caixa padrão de banana)

  // Estados para Ciclos de Produção
  const [cycles, setCycles] = useState<ProductionCycle[]>([]);
  const [loadingCycles, setLoadingCycles] = useState(true);
  const [showCycleModal, setShowCycleModal] = useState(false);
  const [editingCycle, setEditingCycle] = useState<ProductionCycle | null>(null);

  // Form states do novo ciclo
  const [cycleName, setCycleName] = useState("");
  const [cyclePlants, setCyclePlants] = useState("");
  const [cycleVariety, setCycleVariety] = useState("Cavendish");
  const [cycleStartDate, setCycleStartDate] = useState("");

  // Estados do Modal de Despesas
  const [showExpensesModal, setShowExpensesModal] = useState(false);
  const [selectedCycleForExpenses, setSelectedCycleForExpenses] = useState<ProductionCycle | null>(null);
  const [expDescription, setExpDescription] = useState("");
  const [expAmount, setExpAmount] = useState("");
  const [expDate, setExpDate] = useState("");

  // Estados do Encerramento de Ciclo
  const [showCloseCycleModal, setShowCloseCycleModal] = useState(false);
  const [selectedCycleForClose, setSelectedCycleForClose] = useState<ProductionCycle | null>(null);
  const [closeBoxes, setCloseBoxes] = useState("");
  const [closePrice, setClosePrice] = useState("");

  // Estados do Diagnóstico de IA
  const [showAiModal, setShowAiModal] = useState(false);
  const [selectedCycleForAi, setSelectedCycleForAi] = useState<ProductionCycle | null>(null);
  const [aiNotes, setAiNotes] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisStep, setAnalysisStep] = useState(0);
  const [isLocalStorageOnly, setIsLocalStorageOnly] = useState(false);

  // Transaction list state
  const [transactions, setTransactions] = useState<FarmTransaction[]>([]);

  // Form states
  const [txType, setTxType] = useState<"Receita" | "Despesa">("Despesa");
  const [txCategory, setTxCategory] = useState("Adubos/Insumos");
  const [txAmount, setTxAmount] = useState("");
  const [txDate, setTxDate] = useState("");
  const [txDescription, setTxDescription] = useState("");
  const [txCostClassification, setTxCostClassification] = useState("Variável");
  const [txAreaId, setTxAreaId] = useState<string>("all");

  // Edit states
  const [editingTransaction, setEditingTransaction] = useState<FarmTransaction | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editTxType, setEditTxType] = useState<"Receita" | "Despesa">("Despesa");
  const [editTxCategory, setEditTxCategory] = useState("Adubos/Insumos");
  const [editTxAmount, setEditTxAmount] = useState("");
  const [editTxDate, setEditTxDate] = useState("");
  const [editTxDescription, setEditTxDescription] = useState("");
  const [editTxCostClassification, setEditTxCostClassification] = useState("Variável");
  const [editTxAreaId, setEditTxAreaId] = useState<string>("all");
  const [areas, setAreas] = useState<any[]>([]);

  const fetchAreas = async () => {
    if (!profile?.id) return;
    try {
      const { data, error } = await supabase
        .from('producer_areas')
        .select('*')
        .order('created_at', { ascending: true });
      if (!error && data) {
        setAreas(data || []);
      }
    } catch (err) {
      console.error('Error fetching areas in Statement:', err);
    }
  };

  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<string>("Todos");

  // Helper to deduce classification for old/existing database records
  const getDefaultClassification = (category: string): string => {
    const fixedCategories = ["Mão de Obra", "Equipamentos"];
    if (fixedCategories.includes(category)) return "Fixo";
    return "Variável";
  };

  // Load farm parameters
  useEffect(() => {
    if (profile?.id) {
      const stored = localStorage.getItem(`farm_parameters_${profile.id}`);
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          if (parsed.hectares !== undefined) setHectares(parsed.hectares);
          if (parsed.plantsCount !== undefined) {
            setPlantsCount(parsed.plantsCount);
            setSimPlants(parsed.plantsCount);
          }
          if (parsed.targetBoxPrice !== undefined) setTargetBoxPrice(parsed.targetBoxPrice);
        } catch (e) {
          console.error(e);
        }
      }
    }
  }, [profile]);

  const saveFarmParameters = (updates: { hectares?: number; plantsCount?: number; targetBoxPrice?: number }) => {
    if (!profile?.id) return;
    const current = { hectares, plantsCount, targetBoxPrice, ...updates };
    localStorage.setItem(`farm_parameters_${profile.id}`, JSON.stringify(current));
  };

  const handleExportExcel = () => {
    try {
      if (transactions.length === 0) {
        toast.error("Não há lançamentos para exportar.");
        return;
      }

      // Headers for CSV
      const headers = ["Tipo", "Categoria", "Classificacao", "Descricao", "Data", "Valor (R$)"];
      
      // Map transactions to CSV rows
      const csvRows = transactions.map(t => [
        t.type,
        t.category,
        t.type === "Despesa" ? (t.costClassification || "Variável") : "Receita",
        t.description.replace(/"/g, '""'), // Escape quotes
        new Date(t.date + "T00:00:00").toLocaleDateString('pt-BR'),
        t.amount.toFixed(2).replace('.', ',') // Brazilian decimal format
      ]);

      // Combine headers and rows
      const csvContent = "\uFEFF" + [headers.join(";"), ...csvRows.map(row => row.map(val => `"${val}"`).join(";"))].join("\n");

      // Create blob and download
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `demonstrativo_financeiro_${new Date().getFullYear()}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success("Demonstrativo financeiro exportado com sucesso!");
    } catch (err) {
      console.error("Erro ao exportar Excel:", err);
      toast.error("Erro ao exportar demonstrativo financeiro.");
    }
  };

  // Fetch transactions from Supabase
  const fetchTransactions = async () => {
    if (!profile?.id) return;
    setLoadingTransactions(true);
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', profile.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const mapped: FarmTransaction[] = (data || []).map((t) => {
        const parts = t.description?.split(' | ') || [];
        let category = 'Outros';
        let costClassification = '';
        let description = '';

        if (t.type === 'Receita') {
          category = parts[0] || 'Outras Vendas';
          costClassification = '';
          description = parts.length > 2 ? parts[2] : (parts[1] || t.description || '');
        } else {
          // Despesa
          category = parts[0] || 'Outros Custos';
          if (parts.length > 2) {
            costClassification = parts[1] || 'Variável';
            description = parts[2] || '';
          } else {
            // Retrocompatible fallback
            costClassification = getDefaultClassification(category);
            description = parts[1] || t.description || '';
          }
        }

        return {
          id: String(t.id),
          type: (t.type === 'Receita' || t.type === 'Despesa') ? t.type : 'Despesa',
          category,
          costClassification,
          amount: t.amount,
          date: t.created_at ? t.created_at.split('T')[0] : new Date().toISOString().split('T')[0],
          description,
          area_id: t.area_id
        };
      });
      setTransactions(mapped);
    } catch (err) {
      console.error('Error fetching transactions:', err);
      toast.error('Erro ao buscar movimentações do Supabase.');
    } finally {
      setLoadingTransactions(false);
    }
  };

  // Buscar ciclos do Supabase com fallback para localStorage
  const fetchCycles = async () => {
    if (!profile?.id) return;
    setLoadingCycles(true);
    
    if (isLocalStorageOnly) {
      loadCyclesFromLocalStorage();
      setLoadingCycles(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('production_cycles')
        .select('*')
        .eq('user_id', profile.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (data) {
        const mapped: ProductionCycle[] = data.map((item: any) => ({
          id: String(item.id),
          name: item.name,
          plants_count: Number(item.plants_count),
          banana_variety: item.banana_variety,
          start_date: item.start_date,
          end_date: item.end_date,
          status: item.status as any,
          boxes_harvested: item.boxes_harvested !== null ? Number(item.boxes_harvested) : null,
          price_per_box: item.price_per_box !== null ? Number(item.price_per_box) : null,
          expenses: Array.isArray(item.expenses) ? item.expenses : [],
          notes: item.notes,
          ai_diagnosis: item.ai_diagnosis,
        }));
        setCycles(mapped);
        localStorage.setItem(`production_cycles_${profile.id}`, JSON.stringify(mapped));
        return;
      }
    } catch (err: any) {
      if (err?.code === 'PGRST205' || String(err?.status) === '404' || err?.message?.includes("relation") || err?.message?.includes("schema cache")) {
        setIsLocalStorageOnly(true);
      }
      console.warn("Supabase production_cycles error (using localStorage fallback):", err);
      loadCyclesFromLocalStorage();
    } finally {
      setLoadingCycles(false);
    }
  };

  const loadCyclesFromLocalStorage = () => {
    const stored = localStorage.getItem(`production_cycles_${profile!.id}`);
    if (stored) {
      try {
        setCycles(JSON.parse(stored));
      } catch (e) {
        console.error(e);
      }
    } else {
      setCycles([]);
    }
  };

  // Salvar Ciclo (Novo ou Edição)
  const handleSaveCycle = async (cName: string, cPlants: number, cVariety: string, cStartDate: string, existingId?: string) => {
    if (!profile?.id) return;
    if (!cName.trim() || cPlants <= 0 || !cStartDate) {
      toast.error("Por favor, preencha os dados do ciclo corretamente.");
      return;
    }

    const isLocal = isLocalStorageOnly || (existingId && existingId.startsWith("local_"));

    if (isLocal) {
      let currentCycles = [...cycles];
      if (existingId) {
        currentCycles = currentCycles.map(c => c.id === existingId ? {
          ...c,
          name: cName,
          plants_count: cPlants,
          banana_variety: cVariety,
          start_date: cStartDate
        } : c);
        toast.success("Ciclo de produção atualizado localmente!");
      } else {
        const newLocal: ProductionCycle = {
          id: `local_${Date.now()}`,
          name: cName,
          plants_count: cPlants,
          banana_variety: cVariety,
          start_date: cStartDate,
          end_date: null,
          status: "Ativo",
          boxes_harvested: null,
          price_per_box: null,
          expenses: [],
          notes: null,
          ai_diagnosis: null
        };
        currentCycles.unshift(newLocal);
        toast.success("Ciclo de produção iniciado localmente!");
      }
      localStorage.setItem(`production_cycles_${profile.id}`, JSON.stringify(currentCycles));
      setCycles(currentCycles);
      setShowCycleModal(false);
      resetCycleForm();
      return;
    }

    setLoading(true);
    try {
      const isEdit = !!existingId;
      const cycleData = {
        user_id: profile.id,
        name: cName,
        plants_count: cPlants,
        banana_variety: cVariety,
        start_date: cStartDate,
        status: "Ativo",
        expenses: []
      };

      if (isEdit) {
        const { error } = await supabase
          .from('production_cycles')
          .update({
            name: cName,
            plants_count: cPlants,
            banana_variety: cVariety,
            start_date: cStartDate
          })
          .eq('id', Number(existingId));
        if (error) throw error;
        toast.success("Ciclo de produção atualizado!");
      } else {
        const { error } = await supabase
          .from('production_cycles')
          .insert([cycleData]);
        if (error) throw error;
        toast.success("Ciclo de produção iniciado!");
      }
      fetchCycles();
      setShowCycleModal(false);
      resetCycleForm();
    } catch (err) {
      console.warn("Failed to write to Supabase, falling back to local:", err);
      setIsLocalStorageOnly(true);
      handleSaveCycle(cName, cPlants, cVariety, cStartDate, existingId);
    } finally {
      setLoading(false);
    }
  };

  const resetCycleForm = () => {
    setCycleName("");
    setCyclePlants("");
    setCycleVariety("Cavendish");
    setCycleStartDate("");
    setEditingCycle(null);
  };

  const startEditCycle = (c: ProductionCycle) => {
    setEditingCycle(c);
    setCycleName(c.name);
    setCyclePlants(String(c.plants_count));
    setCycleVariety(c.banana_variety);
    setCycleStartDate(c.start_date);
    setShowCycleModal(true);
  };

  // Excluir Ciclo
  const handleDeleteCycle = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este ciclo de produção?")) return;
    if (!profile?.id) return;

    const isLocal = isLocalStorageOnly || id.startsWith("local_");

    if (isLocal) {
      const filtered = cycles.filter(c => c.id !== id);
      localStorage.setItem(`production_cycles_${profile.id}`, JSON.stringify(filtered));
      setCycles(filtered);
      toast.success("Ciclo excluído localmente!");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('production_cycles')
        .delete()
        .eq('id', Number(id));
      if (error) throw error;
      toast.success("Ciclo excluído!");
      fetchCycles();
    } catch (err) {
      console.warn("Failed to delete from Supabase, falling back to local:", err);
      setIsLocalStorageOnly(true);
      handleDeleteCycle(id);
    } finally {
      setLoading(false);
    }
  };

  // Adicionar despesa a um ciclo
  const handleAddCycleExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCycleForExpenses || !expDescription.trim() || !expAmount || parseFloat(expAmount) <= 0 || !expDate) {
      toast.error("Por favor, preencha todos os campos da despesa.");
      return;
    }

    const isLocal = isLocalStorageOnly || selectedCycleForExpenses.id.startsWith("local_");
    const newExp = {
      id: `exp_${Date.now()}`,
      description: expDescription.trim(),
      amount: parseFloat(expAmount),
      date: expDate
    };
    const updatedExpenses = [...(selectedCycleForExpenses.expenses || []), newExp];
    const updatedCycle = { ...selectedCycleForExpenses, expenses: updatedExpenses };

    if (isLocal) {
      const updatedCycles = cycles.map(c => c.id === selectedCycleForExpenses.id ? updatedCycle : c);
      localStorage.setItem(`production_cycles_${profile!.id}`, JSON.stringify(updatedCycles));
      setCycles(updatedCycles);
      setSelectedCycleForExpenses(updatedCycle);
      toast.success("Despesa adicionada localmente!");
      setExpDescription("");
      setExpAmount("");
      setExpDate("");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('production_cycles')
        .update({ expenses: updatedExpenses })
        .eq('id', Number(selectedCycleForExpenses.id));
      if (error) throw error;

      setSelectedCycleForExpenses(updatedCycle);
      toast.success("Despesa adicionada ao ciclo!");
      setExpDescription("");
      setExpAmount("");
      setExpDate("");
      fetchCycles();
    } catch (err) {
      console.warn("Failed to add expense on Supabase, falling back to local:", err);
      setIsLocalStorageOnly(true);
      const updatedCycles = cycles.map(c => c.id === selectedCycleForExpenses.id ? updatedCycle : c);
      localStorage.setItem(`production_cycles_${profile!.id}`, JSON.stringify(updatedCycles));
      setCycles(updatedCycles);
      setSelectedCycleForExpenses(updatedCycle);
      toast.success("Despesa adicionada localmente!");
      setExpDescription("");
      setExpAmount("");
      setExpDate("");
    } finally {
      setLoading(false);
    }
  };

  // Excluir despesa do ciclo
  const handleDeleteCycleExpense = async (expId: string) => {
    if (!selectedCycleForExpenses) return;

    const isLocal = isLocalStorageOnly || selectedCycleForExpenses.id.startsWith("local_");
    const updatedExpenses = selectedCycleForExpenses.expenses.filter(e => e.id !== expId);
    const updatedCycle = { ...selectedCycleForExpenses, expenses: updatedExpenses };

    if (isLocal) {
      const updatedCycles = cycles.map(c => c.id === selectedCycleForExpenses.id ? updatedCycle : c);
      localStorage.setItem(`production_cycles_${profile!.id}`, JSON.stringify(updatedCycles));
      setCycles(updatedCycles);
      setSelectedCycleForExpenses(updatedCycle);
      toast.success("Despesa removida localmente.");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('production_cycles')
        .update({ expenses: updatedExpenses })
        .eq('id', Number(selectedCycleForExpenses.id));
      if (error) throw error;

      setSelectedCycleForExpenses(updatedCycle);
      toast.success("Despesa removida.");
      fetchCycles();
    } catch (err) {
      console.warn("Failed to delete expense on Supabase, falling back to local:", err);
      setIsLocalStorageOnly(true);
      const updatedCycles = cycles.map(c => c.id === selectedCycleForExpenses.id ? updatedCycle : c);
      localStorage.setItem(`production_cycles_${profile!.id}`, JSON.stringify(updatedCycles));
      setCycles(updatedCycles);
      setSelectedCycleForExpenses(updatedCycle);
      toast.success("Despesa removida localmente.");
    } finally {
      setLoading(false);
    }
  };

  // Fechar ciclo (Colheita)
  const handleCloseCycle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCycleForClose || !closeBoxes || parseInt(closeBoxes) <= 0 || !closePrice || parseFloat(closePrice) <= 0) {
      toast.error("Por favor, preencha as caixas e o preço corretamente.");
      return;
    }

    const isLocal = isLocalStorageOnly || selectedCycleForClose.id.startsWith("local_");
    const boxes = parseInt(closeBoxes);
    const price = parseFloat(closePrice);
    const endDate = new Date().toISOString().split('T')[0];

    const updatedCycle: ProductionCycle = {
      ...selectedCycleForClose,
      status: "Encerrado",
      boxes_harvested: boxes,
      price_per_box: price,
      end_date: endDate
    };

    if (isLocal) {
      const updatedCycles = cycles.map(c => c.id === selectedCycleForClose.id ? updatedCycle : c);
      localStorage.setItem(`production_cycles_${profile!.id}`, JSON.stringify(updatedCycles));
      setCycles(updatedCycles);
      toast.success("Safra/Ciclo encerrado localmente!");
      setShowCloseCycleModal(false);
      setCloseBoxes("");
      setClosePrice("");
      setSelectedCycleForClose(null);
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('production_cycles')
        .update({
          status: "Encerrado",
          boxes_harvested: boxes,
          price_per_box: price,
          end_date: endDate
        })
        .eq('id', Number(selectedCycleForClose.id));
      if (error) throw error;

      toast.success("Safra/Ciclo encerrado com sucesso!");
      setShowCloseCycleModal(false);
      setCloseBoxes("");
      setClosePrice("");
      setSelectedCycleForClose(null);
      fetchCycles();
    } catch (err) {
      console.warn("Failed to close cycle on Supabase, falling back to local:", err);
      setIsLocalStorageOnly(true);
      const updatedCycles = cycles.map(c => c.id === selectedCycleForClose.id ? updatedCycle : c);
      localStorage.setItem(`production_cycles_${profile!.id}`, JSON.stringify(updatedCycles));
      setCycles(updatedCycles);
      toast.success("Safra/Ciclo encerrado localmente!");
      setShowCloseCycleModal(false);
      setCloseBoxes("");
      setClosePrice("");
      setSelectedCycleForClose(null);
    } finally {
      setLoading(false);
    }
  };

  // Simular e salvar Diagnóstico de IA
  const handleRunAiDiagnosis = async () => {
    if (!selectedCycleForAi) return;
    setAnalyzing(true);
    setAnalysisStep(0);

    const stepsText = [
      "Processando dados de rentabilidade...",
      "Comparando custo/pé com histórico operacional...",
      "Analisando impacto de quebras e perdas por tombamento...",
      "Avaliando parâmetros de rega e clima local...",
      "Gerando recomendações e plano de ação agronômico..."
    ];

    for (let i = 0; i < stepsText.length; i++) {
      setAnalysisStep(i);
      await new Promise(resolve => setTimeout(resolve, 800));
    }

    const diagnosisText = generateAiDiagnosis(selectedCycleForAi, aiNotes);
    const updatedCycle: ProductionCycle = {
      ...selectedCycleForAi,
      notes: aiNotes,
      ai_diagnosis: diagnosisText
    };

    const isLocal = isLocalStorageOnly || selectedCycleForAi.id.startsWith("local_");

    if (isLocal) {
      const updatedCycles = cycles.map(c => c.id === selectedCycleForAi.id ? updatedCycle : c);
      localStorage.setItem(`production_cycles_${profile!.id}`, JSON.stringify(updatedCycles));
      setCycles(updatedCycles);
      setSelectedCycleForAi(updatedCycle);
      toast.success("Diagnóstico da IA concluído localmente!");
      setAnalyzing(false);
      return;
    }

    try {
      const { error } = await supabase
        .from('production_cycles')
        .update({
          notes: aiNotes,
          ai_diagnosis: diagnosisText
        })
        .eq('id', Number(selectedCycleForAi.id));
      if (error) throw error;

      setSelectedCycleForAi(updatedCycle);
      const updatedCycles = cycles.map(c => c.id === selectedCycleForAi.id ? updatedCycle : c);
      setCycles(updatedCycles);
      toast.success("Diagnóstico da IA concluído!");
    } catch (err) {
      console.warn("Failed to save AI diagnosis on Supabase, falling back to local:", err);
      setIsLocalStorageOnly(true);
      const updatedCycles = cycles.map(c => c.id === selectedCycleForAi.id ? updatedCycle : c);
      localStorage.setItem(`production_cycles_${profile!.id}`, JSON.stringify(updatedCycles));
      setCycles(updatedCycles);
      setSelectedCycleForAi(updatedCycle);
      toast.success("Diagnóstico da IA concluído localmente!");
    } finally {
      setAnalyzing(false);
    }
  };

  const generateAiDiagnosis = (cycle: ProductionCycle, notes: string): string => {
    const totalExpenses = cycle.expenses.reduce((sum, e) => sum + e.amount, 0);
    const revenue = (cycle.boxes_harvested || 0) * (cycle.price_per_box || 0);
    const profit = revenue - totalExpenses;
    const plants = cycle.plants_count || 1;
    const boxes = cycle.boxes_harvested || 1;
    const costPerPlant = totalExpenses / plants;
    const profitPerPlant = profit / plants;
    const yieldPerPlant = ((cycle.boxes_harvested || 0) * 20) / plants; // kg/pé

    let lossPercent = 0;
    const percentMatch = notes.match(/(\d+)%/);
    if (percentMatch) {
      lossPercent = parseInt(percentMatch[1]) / 100;
    } else if (notes.toLowerCase().includes("tombamento") || notes.toLowerCase().includes("perca") || notes.toLowerCase().includes("perda")) {
      lossPercent = 0.15; // default 15%
    }

    const potentialRevenue = lossPercent > 0 ? revenue / (1 - lossPercent) : revenue;
    const lossValue = potentialRevenue - revenue;

    let diagnosis = `### 📊 DIAGNÓSTICO FINANCEIRO E DE PRODUTIVIDADE

*   **Variedade cultivada**: Banana ${cycle.banana_variety}
*   **Total de Plantas (Pés)**: ${plants.toLocaleString()} pés
*   **Rendimento Total**: ${(boxes * 20).toLocaleString()} kg (${boxes} caixas de 20kg)
*   **Produtividade por Pé**: ${yieldPerPlant.toFixed(2)} kg/pé (Média ideal da variedade: ${cycle.banana_variety.toLowerCase().includes("prata") ? "15-20" : "20-30"} kg/pé)
*   **Faturamento Bruto**: ${formatCurrency(revenue)}
*   **Custo Total do Ciclo**: ${formatCurrency(totalExpenses)} (${formatCurrency(costPerPlant)} por pé)
*   **Lucro Líquido Real**: ${formatCurrency(profit)} (${formatCurrency(profitPerPlant)} por pé)

---

### ⚠️ ANÁLISE DE PERDAS E OCORRÊNCIAS
`;

    if (lossPercent > 0) {
      diagnosis += `*   **Impacto de Tombamento/Perdas**: Detectamos relatos de perdas na ordem de **${(lossPercent * 100).toFixed(0)}%**.
*   **Prejuízo Estimado**: O tombamento e as quebras no plantio reduziram seu faturamento bruto em aproximadamente **${formatCurrency(lossValue)}**. Caso essas perdas tivessem sido controladas, seu lucro líquido saltaria de **${formatCurrency(profit)}** para **${formatCurrency(profit - totalExpenses + potentialRevenue)}** (aumento de **${((potentialRevenue - revenue) / (revenue || 1) * 100).toFixed(1)}%** na rentabilidade).
`;
    } else {
      diagnosis += `*   **Impacto de Perdas**: Não foram declaradas perdas significativas no relato, indicando que a colheita aproveitou o potencial planejado das plantas.
`;
    }

    diagnosis += `\n### 💧 ANÁLISE DE IRRIGAÇÃO E MANEJO\n`;

    const notesLower = notes.toLowerCase();
    if (notesLower.includes("gotejamento") || notesLower.includes("gotejador")) {
      diagnosis += `*   **Irrigação**: O uso de **gotejamento** é excelente para economia de água e aplicação de fertirrigação direcionada. Entretanto, em solos mais arenosos ou sob calor intenso, certifique-se de que a lâmina de água atinja o bulbo úmido da bananeira (raízes concentradas a 30-40cm de profundidade).
`;
    } else if (notesLower.includes("microaspersão") || notesLower.includes("aspersor")) {
      diagnosis += `*   **Irrigação**: A **microaspersão** garante boa cobertura de área úmida e ajuda a climatizar o bananal. Monitore a umidade nas entrelinhas para evitar proliferação de plantas invasoras e fungos foliares devido ao molhamento das folhas baixas.
`;
    } else if (notesLower.includes("seca") || notesLower.includes("falta de água") || notesLower.includes("estiagem")) {
      diagnosis += `*   **Alerta de Estresse Hídrico**: A bananeira é extremamente sensível à falta de água (exige 1500mm a 2000mm anuais). A seca atrasa o lançamento da inflorescência, reduz o número de pencas por cacho e gera frutos finos e sem valor comercial. Cogite investir em automação de irrigação.
`;
    } else {
      diagnosis += `*   **Manejo Hídrico**: Mantenha a umidade do solo constante, especialmente durante o florescimento e enchimento de cachos, fases críticas de demanda hídrica da bananeira.
`;
    }

    diagnosis += `\n### 🌱 PLANO DE AÇÃO PARA O PRÓXIMO CICLO\n`;

    if (lossPercent > 0) {
      diagnosis += `1.  **Combate ao Tombamento**:
    *   **Escoramento de Cachos**: Faça o escoramento (com bambu, madeira ou fitilho sintético amarrado ao pseudocaule vizinho) a partir do momento em que o cacho despontar e curvar para baixo.
    *   **Quebra-Ventos**: Plante barreiras físicas de vento nas bordas da propriedade (ex: capim-cameroon, sansão-do-campo) para reduzir a velocidade das rajadas que derrubam as plantas pesadas.
    *   **Nutrição**: Aumente a adubação com **Potássio (K)** e **Silício (Si)**, que fortalecem as fibras do pseudocaule, tornando a bananeira estruturalmente mais forte contra ventos.
`;
    }

    if (notesLower.includes("broca") || notesLower.includes("moleque da bananeira")) {
      diagnosis += `2.  **Manejo da Broca-do-Rizoma**:
    *   **Iscas de pseudocaule**: Distribua iscas do tipo "sanduíche" ou "telha" feitas com pedaços do próprio pseudocaule cortado após a colheita, tratadas com inseticida biológico (*Beauveria bassiana*).
    *   **Limpeza do Bananal**: Remova restos de plantas colhidas rapidamente para eliminar o abrigo natural do inseto.
`;
    }

    if (notesLower.includes("sigatoka") || notesLower.includes("mancha")) {
      diagnosis += `3.  **Controle de Sigatoka (Negra/Amarela)**:
    *   **Desfolha sanitária rigorosa**: Corte e deite no chão as folhas ou partes de folhas afetadas, colocando a face superior voltada para o solo para acelerar a decomposição e evitar dispersão dos esporos.
    *   **Drenagem**: Evite acúmulo de água parada que eleva a umidade relativa do ar sob a copa das árvores.
`;
    }

    if (costPerPlant > 15) {
      diagnosis += `4.  **Otimização de Custos**: Seu custo por pé de **${formatCurrency(costPerPlant)}** está acima do padrão médio. Avalie a compra de insumos em cooperativas agrícolas e faça compras coletivas para baratear fertilizantes, focando na análise de solo para não aplicar nutrientes em excesso.
`;
    } else {
      diagnosis += `4.  **Eficiência de Custos**: Seu custo de **${formatCurrency(costPerPlant)}/pé** está em nível excelente e competitivo. Continue com a calibração de dosagem com base na análise química do solo para evitar desperdício de adubos.
`;
    }

    return diagnosis;
  };

  useEffect(() => {
    fetchTransactions();
    fetchCycles();
    fetchAreas();
  }, [profile]);

  // Calculations
  const totalReceitas = transactions
    .filter(t => t.type === "Receita")
    .reduce((sum, t) => sum + t.amount, 0);

  const totalDespesas = transactions
    .filter(t => t.type === "Despesa")
    .reduce((sum, t) => sum + t.amount, 0);

  const totalCustosFixos = transactions
    .filter(t => t.type === "Despesa" && t.costClassification === "Fixo")
    .reduce((sum, t) => sum + t.amount, 0);

  const totalCustosVariaveis = transactions
    .filter(t => t.type === "Despesa" && t.costClassification === "Variável")
    .reduce((sum, t) => sum + t.amount, 0);

  const margemContribuicao = totalReceitas - totalCustosVariaveis;

  const lucroEstimado = totalReceitas - totalDespesas;

  // Indicators using database values if available, otherwise fallback
  const dbHectares = areas.length > 0 ? areas.reduce((sum, a) => sum + (a.size_hectares || 0), 0) : hectares;
  const dbPlantsCount = areas.length > 0 ? areas.reduce((sum, a) => sum + (a.plants_count || 0), 0) : plantsCount;

  const custoPorHectare = dbHectares > 0 ? totalDespesas / dbHectares : 0;
  const custoPorPlanta = dbPlantsCount > 0 ? totalDespesas / dbPlantsCount : 0;

  // Break-even: totalDespesas / targetBoxPrice (how many boxes to sell to cover total farm expenses)
  const breakEvenBoxes = targetBoxPrice > 0 ? Math.ceil(totalDespesas / targetBoxPrice) : 0;

  const volumeCaixas = totalReceitas > 0 ? (totalReceitas / targetBoxPrice) : (dbPlantsCount > 0 ? (dbPlantsCount * 0.15) : 100);
  const custoPorCaixa = totalDespesas / volumeCaixas;
  const margemSeguranca = targetBoxPrice - custoPorCaixa;

  const getRevenuesSparklineData = () => {
    const revenueTxs = transactions
      .filter(t => t.type === "Receita")
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    if (revenueTxs.length === 0) {
      return [{ value: 0 }, { value: 0 }, { value: 0 }, { value: 0 }];
    }
    if (revenueTxs.length < 5) {
      return revenueTxs.map(t => ({ value: t.amount }));
    }
    return revenueTxs.slice(-10).map(t => ({ value: t.amount }));
  };

  // Cálculos do Simulador de Vendas e Produtividade
  const simTotalWeight = simBoxes * simBoxWeight; // Peso total das bananas (kg)
  const simGrossRevenue = simTotalWeight * simPricePerKg; // Faturamento total da simulação
  
  const simGrossPerBox = simBoxWeight * simPricePerKg; // Ganho bruto por caixa
  const simGrossPerPlant = simPlants > 0 ? simGrossRevenue / simPlants : 0; // Ganho bruto por pé

  // Custos e Lucro Líquido Real baseando-se nas despesas da fazenda
  const simCostPerBox = simBoxes > 0 ? totalDespesas / simBoxes : 0;
  const simNetPerBox = simGrossPerBox - simCostPerBox; // Ganho líquido por caixa

  const simCostPerPlant = simPlants > 0 ? totalDespesas / simPlants : 0;
  const simNetPerPlant = simGrossPerPlant - simCostPerPlant; // Ganho líquido por pé

  const handleAddTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!txAmount || Number(txAmount) <= 0 || !txDate || !txDescription.trim()) {
      toast.error("Por favor, preencha todos os campos corretamente.");
      return;
    }

    if (!profile?.id) {
      toast.error("Usuário não identificado.");
      return;
    }

    setLoading(true);
    try {
      const classification = txType === "Despesa" ? txCostClassification : "";
      const categoryAndDesc = `${txCategory} | ${classification} | ${txDescription}`;
      const { error } = await supabase
        .from('transactions')
        .insert([
          {
            user_id: profile.id,
            amount: parseFloat(txAmount),
            type: txType,
            description: categoryAndDesc,
            status: 'completed',
            created_at: new Date(txDate + "T12:00:00").toISOString(),
            area_id: txAreaId === "all" ? null : Number(txAreaId)
          }
        ]);

      if (error) throw error;

      toast.success("Lançamento financeiro registrado com sucesso!");
      setShowAddModal(false);
      setTxAmount("");
      setTxDescription("");
      setTxAreaId("all");
      fetchTransactions();
    } catch (err) {
      console.error('Error adding transaction:', err);
      toast.error('Erro ao salvar movimentação no Supabase.');
    } finally {
      setLoading(false);
    }
  };

  const startEditTransaction = (tx: FarmTransaction) => {
    setEditingTransaction(tx);
    setEditTxType(tx.type);
    setEditTxCategory(tx.category);
    setEditTxAmount(String(tx.amount));
    setEditTxDate(tx.date);
    setEditTxDescription(tx.description);
    setEditTxCostClassification(tx.costClassification || "Variável");
    setEditTxAreaId(tx.area_id ? String(tx.area_id) : "all");
    setShowEditModal(true);
  };

  const handleEditTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTransaction) return;

    if (!editTxAmount || Number(editTxAmount) <= 0 || !editTxDate || !editTxDescription.trim()) {
      toast.error("Por favor, preencha todos os campos corretamente.");
      return;
    }

    setLoading(true);
    try {
      const classification = editTxType === "Despesa" ? editTxCostClassification : "";
      const categoryAndDesc = `${editTxCategory} | ${classification} | ${editTxDescription}`;
      const { error } = await supabase
        .from('transactions')
        .update({
          amount: parseFloat(editTxAmount),
          type: editTxType,
          description: categoryAndDesc,
          created_at: new Date(editTxDate + "T12:00:00").toISOString(),
          area_id: editTxAreaId === "all" ? null : Number(editTxAreaId)
        })
        .eq('id', Number(editingTransaction.id));

      if (error) throw error;

      toast.success("Lançamento financeiro atualizado com sucesso!");
      setShowEditModal(false);
      setEditingTransaction(null);
      fetchTransactions();
    } catch (err) {
      console.error('Error updating transaction:', err);
      toast.error('Erro ao atualizar movimentação no Supabase.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTransaction = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este lançamento?")) return;
    try {
      const { error } = await supabase
        .from('transactions')
        .delete()
        .eq('id', Number(id));

      if (error) throw error;

      toast.success("Lançamento excluído.");
      fetchTransactions();
    } catch (err) {
      console.error('Error deleting transaction:', err);
      toast.error('Erro ao deletar lançamento do Supabase.');
    }
  };

  const filteredTransactions = transactions.filter(t => {
    const matchesSearch = t.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          t.category.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = filterType === "Todos" || t.type === filterType;
    return matchesSearch && matchesType;
  });

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(val);
  };

  return (
    <Layout>
      <div className="max-w-7xl mx-auto space-y-10 pb-20">
        {/* Header Banner */}
        <div 
          className="hero-banner-container relative mx-[-1rem] mt-[-1rem] md:mx-[-2rem] md:mt-[-2rem] rounded-none md:rounded-b-[2.5rem] overflow-hidden px-8 pb-10 pt-24 md:px-12 md:pb-12 md:pt-28 min-h-[220px] flex flex-col md:flex-row justify-between items-center md:items-end gap-6 bg-cover bg-center border-none z-10"
          style={{ backgroundImage: `url(${bannerImg})` }}
        >
          {/* Overlay with dark green gradient matching the sidebar */}
          <div className="absolute inset-0 bg-gradient-to-b from-[#02160a]/95 via-[#061d0f]/80 to-transparent z-0 pointer-events-none" />

          {/* Fade to white/page-background at the bottom */}
          <div className="absolute bottom-0 left-0 right-0 h-10 bg-gradient-to-t from-background to-transparent z-10 pointer-events-none" />

          <div className="relative z-10 max-w-2xl text-left">
            <h1 className="text-4xl md:text-5xl font-display font-bold text-white mb-3 flex items-center gap-2">
              <span className="!text-white">Gestão</span> <span className="text-[#589c1c] dark:text-[#6ee7b7]">Financeira</span>
              <Sprout className="text-[#589c1c] dark:text-[#6ee7b7] w-8 h-8 shrink-0 animate-bounce" style={{ animationDuration: '3s' }} />
            </h1>
            <p className="!text-white text-base md:text-lg font-medium leading-relaxed">
              Controle de custos por hectare/planta, ponto de equilíbrio e fluxo de caixa da fazenda.
            </p>
          </div>

          <div className="relative z-10 flex flex-col sm:flex-row gap-4 w-full md:w-auto shrink-0 mb-2">
            <button 
              onClick={handleExportExcel}
              className="!bg-transparent border !border-amber-500/40 hover:!bg-amber-500/10 px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest transition-all !text-amber-400 cursor-pointer flex items-center justify-center gap-2"
            >
              <Download size={16} className="!text-amber-400" />
              Exportar Excel
            </button>
            <button 
              onClick={() => setShowAddModal(true)}
              className="bg-[#589c1c] hover:bg-[#478016] px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest hover:scale-105 transition-all shadow-xl shadow-black/25 text-white cursor-pointer flex items-center justify-center gap-2"
            >
              <PlusCircle size={16} />
              Lançar Receita/Despesa
            </button>
          </div>
        </div>

        {/* Farm Parameters Setting Bar */}
        <div className="hero-banner-container glass-card p-6 rounded-[2rem] border-slate-100 dark:border-white/5 bg-white dark:bg-zinc-900/40 grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Hectares */}
          <div className="flex items-center gap-4 bg-slate-50/50 dark:bg-white/5 p-3 rounded-2xl border border-slate-100 dark:border-white/5">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 shrink-0">
              <Map size={20} />
            </div>
            <div className="space-y-1 flex-1 text-left">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Área da Lavoura (Hectares)</label>
              <input
                type="number"
                step="0.1"
                value={hectares}
                onChange={(e) => {
                  const val = parseFloat(e.target.value) || 0;
                  setHectares(val);
                  saveFarmParameters({ hectares: val });
                }}
                className="w-full bg-transparent border-none p-0 text-slate-800 dark:text-white text-sm font-bold focus:outline-none focus:ring-0"
              />
            </div>
          </div>

          {/* Plants Count */}
          <div className="flex items-center gap-4 bg-slate-50/50 dark:bg-white/5 p-3 rounded-2xl border border-slate-100 dark:border-white/5">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 shrink-0">
              <Sprout size={20} />
            </div>
            <div className="space-y-1 flex-1 text-left">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Número Total de Plantas</label>
              <input
                type="number"
                value={plantsCount}
                onChange={(e) => {
                  const val = parseInt(e.target.value) || 0;
                  setPlantsCount(val);
                  saveFarmParameters({ plantsCount: val });
                }}
                className="w-full bg-transparent border-none p-0 text-slate-800 dark:text-white text-sm font-bold focus:outline-none focus:ring-0"
              />
            </div>
          </div>

          {/* Target Box Price */}
          <div className="flex items-center gap-4 bg-slate-50/50 dark:bg-white/5 p-3 rounded-2xl border border-slate-100 dark:border-white/5">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 shrink-0">
              <Package size={20} />
            </div>
            <div className="space-y-1 flex-1 text-left">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Preço da Caixa Estimado (R$)</label>
              <input
                type="number"
                value={targetBoxPrice}
                onChange={(e) => {
                  const val = parseFloat(e.target.value) || 0;
                  setTargetBoxPrice(val);
                  saveFarmParameters({ targetBoxPrice: val });
                }}
                className="w-full bg-transparent border-none p-0 text-slate-800 dark:text-white text-sm font-bold focus:outline-none focus:ring-0"
              />
            </div>
          </div>
        </div>

        {/* Balance Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Receitas */}
          <div className="glass-card p-6 md:p-8 rounded-[2rem] border border-slate-100 dark:border-white/5 bg-white dark:bg-zinc-900/30 flex flex-col justify-between min-h-[220px]">
            <div>
              <div className="flex items-center gap-2 text-[#589c1c] dark:text-[#6ee7b7] mb-2 text-left">
                <TrendingUp size={16} />
                <span className="text-xs font-black uppercase tracking-wider">Total de Receitas</span>
              </div>
              <div className="flex items-baseline justify-between mt-4">
                <h3 className="text-3xl md:text-4xl font-display font-black text-[#589c1c] dark:text-[#6ee7b7] text-left">
                  {formatCurrency(totalReceitas)}
                </h3>
                <span className="bg-[#eefbeb] dark:bg-emerald-500/10 text-[#589c1c] dark:text-[#6ee7b7] px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider">
                  ↑ 18%
                </span>
              </div>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-2 leading-relaxed text-left">Vendas diretas de cachos e caixas de banana.</p>
            </div>
            
            {/* Sparkline */}
            <div className="h-12 w-full mt-4 overflow-hidden rounded-xl">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={getRevenuesSparklineData()} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
                  <defs>
                    <linearGradient id="colorRevenues" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#589c1c" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#589c1c" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <Area 
                    type="monotone" 
                    dataKey="value" 
                    stroke="#589c1c" 
                    strokeWidth={2} 
                    fillOpacity={1} 
                    fill="url(#colorRevenues)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Despesas */}
          <div className="glass-card p-6 md:p-8 rounded-[2rem] border border-slate-100 dark:border-white/5 bg-white dark:bg-zinc-900/30 flex flex-col justify-between min-h-[220px]">
            <div>
              <div className="flex items-center gap-2 text-[#d97706] dark:text-amber-400 mb-2 text-left">
                <Calculator size={16} />
                <span className="text-xs font-black uppercase tracking-wider">Custos Operacionais</span>
              </div>
              <div className="flex items-baseline justify-between mt-4">
                <h3 className="text-3xl md:text-4xl font-display font-black text-[#d97706] dark:text-amber-400 text-left">
                  {formatCurrency(totalDespesas)}
                </h3>
                <span className="bg-amber-50 dark:bg-amber-500/10 text-[#d97706] dark:text-amber-400 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider">
                  ↓ 6%
                </span>
              </div>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-2 leading-relaxed text-left">Insumos, mão de obra, diesel e manutenção.</p>
            </div>
            
            <div className="mt-6 space-y-2 border-t border-slate-100 dark:border-white/5 pt-4">
              <div className="flex justify-between text-[10px] text-zinc-500 font-bold uppercase tracking-wider">
                <span className="text-purple-500 dark:text-purple-400">FIXO: {formatCurrency(totalCustosFixos)}</span>
                <span className="text-[#d97706] dark:text-[#f59e0b]">VARIÁVEL: {formatCurrency(totalCustosVariaveis)}</span>
              </div>
              <div className="h-2 w-full bg-slate-100 dark:bg-zinc-800/50 rounded-full overflow-hidden flex">
                <div 
                  className="h-full bg-purple-500 transition-all duration-500" 
                  style={{ width: `${totalDespesas > 0 ? (totalCustosFixos / totalDespesas) * 100 : 0}%` }} 
                />
                <div 
                  className="h-full bg-amber-500 transition-all duration-500" 
                  style={{ width: `${totalDespesas > 0 ? (totalCustosVariaveis / totalDespesas) * 100 : 0}%` }} 
                />
              </div>
            </div>
          </div>

          {/* Lucro Líquido */}
          <div className="glass-card p-6 md:p-8 rounded-[2rem] border border-slate-100 dark:border-white/5 bg-white dark:bg-zinc-900/30 relative overflow-hidden group flex flex-col justify-between min-h-[220px]">
            {/* Wallet icon inside the card, aligned on the right */}
            <div className="absolute top-1/2 -translate-y-1/2 -right-4 p-6 opacity-[0.08] group-hover:opacity-[0.12] group-hover:scale-110 transition-all duration-500 text-slate-600 dark:text-white pointer-events-none">
              <Wallet size={96} />
            </div>

            <div>
              <div className="flex items-center gap-2 text-[#589c1c] dark:text-[#6ee7b7] mb-2 text-left">
                <Wallet size={16} />
                <span className="text-xs font-black uppercase tracking-wider">Lucro Líquido</span>
              </div>
              <div className="mt-4">
                <h3 className={`text-3xl md:text-4xl font-display font-black text-left ${lucroEstimado >= 0 ? "text-[#589c1c] dark:text-[#6ee7b7]" : "text-red-500"}`}>
                  {formatCurrency(lucroEstimado)}
                </h3>
              </div>
              <div className="flex justify-start mt-2">
                <span className="bg-[#eefbeb] dark:bg-emerald-500/10 text-[#589c1c] dark:text-[#6ee7b7] px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider">
                  ↑ 32%
                </span>
              </div>
            </div>
            
            <div className="mt-6 flex flex-wrap gap-4 items-center justify-between border-t border-slate-100 dark:border-white/5 pt-4 z-10">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-white/5 px-3 py-1 rounded-xl border border-slate-100 dark:border-white/5">
                Saldo Fazenda
              </span>
              <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold" title="Receitas menos Custos Variáveis">
                Margem Contrib.: <span className="text-[#589c1c] dark:text-[#6ee7b7]">{formatCurrency(margemContribuicao)}</span>
              </span>
            </div>
          </div>
        </div>

        {/* Circular Gauges and Break Even */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <CostGaugeCard 
            title="Custo Operacional por Hectare" 
            value={formatCurrency(custoPorHectare)} 
            sublabel="por hectare" 
            changeText="↓ 6% vs mês anterior" 
            percentage={custoPorHectare && !isNaN(custoPorHectare) ? Math.min(100, Math.max(5, Math.round((custoPorHectare / 8000) * 100))) : 0} 
          />
          
          <CostGaugeCard 
            title="Custo Operacional por Planta" 
            value={formatCurrency(custoPorPlanta)} 
            sublabel="por planta" 
            changeText="↓ 6% vs mês anterior" 
            percentage={custoPorPlanta && !isNaN(custoPorPlanta) ? Math.min(100, Math.max(5, Math.round((custoPorPlanta / 6) * 100))) : 0} 
          />

          <div className="glass-card p-6 rounded-[2rem] border border-slate-100 dark:border-white/5 bg-white dark:bg-zinc-900/30 flex flex-col justify-between">
            <div className="flex items-center gap-1.5 text-slate-400 dark:text-zinc-500 mb-4 text-left">
              <Calculator size={14} className="text-[#589c1c] dark:text-[#6ee7b7]" />
              <span className="text-[10px] font-black uppercase tracking-widest">Ponto de Equilíbrio (Break-Even)</span>
            </div>
            
            <div className="space-y-2.5 text-left">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400 font-semibold">Custo por caixa</span>
                <span className="text-slate-700 dark:text-slate-300 font-black">{formatCurrency(custoPorCaixa)}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400 font-semibold">Preço de venda</span>
                <span className="text-slate-700 dark:text-slate-300 font-black">{formatCurrency(targetBoxPrice)}</span>
              </div>
              
              <div className="flex justify-between items-center bg-[#eefbeb] dark:bg-emerald-500/10 border border-emerald-500/10 dark:border-emerald-500/20 p-2.5 rounded-2xl">
                <span className="text-[#589c1c] dark:text-[#6ee7b7] text-[10px] font-black uppercase tracking-wider">Margem de segurança</span>
                <span className="text-[#589c1c] dark:text-[#6ee7b7] font-black text-xs">
                  {formatCurrency(margemSeguranca)} <span className="text-[10px] opacity-75">/ caixa</span>
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Simulador de Comercialização e Rendimento */}
        <div className="glass-card p-8 rounded-[2.5rem] border-white/5 bg-zinc-900/40 space-y-8">
          <div className="space-y-1.5 pb-4 border-b border-white/5">
            <h3 className="text-xl font-display font-black text-slate-800 dark:text-white flex items-center gap-2">
              <Calculator className="text-emerald-500 w-6 h-6 animate-pulse" />
              Simulador de Produtividade e Rendimento
            </h3>
            <p className="text-slate-400 text-sm font-medium">
              Simule a receita e o retorno financeiro por pé (planta) e por caixa de banana com base no peso e preço do quilo.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Parâmetros de Entrada */}
            <div className="lg:col-span-5 space-y-4 bg-slate-100 dark:bg-black/25 p-6 rounded-3xl border border-slate-200 dark:border-white/5">
              <h4 className="text-xs font-black text-slate-500 dark:text-zinc-400 uppercase tracking-widest mb-4">Parâmetros de Entrada</h4>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5 text-left">
                  <label className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider block">Quantidade de Pés</label>
                  <input
                    type="number"
                    value={simPlants}
                    onChange={(e) => setSimPlants(Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-full bg-white dark:bg-zinc-900 border border-slate-200 dark:border-white/10 rounded-xl py-2 px-3 text-slate-800 dark:text-white text-sm font-bold focus:outline-none focus:border-primary/50"
                  />
                </div>

                <div className="space-y-1.5 text-left">
                  <label className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider block">Quantidade de Caixas</label>
                  <input
                    type="number"
                    value={simBoxes}
                    onChange={(e) => setSimBoxes(Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-full bg-white dark:bg-zinc-900 border border-slate-200 dark:border-white/10 rounded-xl py-2 px-3 text-slate-800 dark:text-white text-sm font-bold focus:outline-none focus:border-primary/50"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5 text-left">
                  <label className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider block">Valor do KG (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={simPricePerKg}
                    onChange={(e) => setSimPricePerKg(Math.max(0, parseFloat(e.target.value) || 0))}
                    className="w-full bg-white dark:bg-zinc-900 border border-slate-200 dark:border-white/10 rounded-xl py-2 px-3 text-slate-800 dark:text-white text-sm font-bold focus:outline-none focus:border-primary/50"
                  />
                </div>

                <div className="space-y-1.5 text-left">
                  <label className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider block">Peso da Caixa (kg)</label>
                  <input
                    type="number"
                    step="0.5"
                    value={simBoxWeight}
                    onChange={(e) => setSimBoxWeight(Math.max(0, parseFloat(e.target.value) || 0))}
                    className="w-full bg-white dark:bg-zinc-900 border border-slate-200 dark:border-white/10 rounded-xl py-2 px-3 text-slate-800 dark:text-white text-sm font-bold focus:outline-none focus:border-primary/50"
                  />
                </div>
              </div>
            </div>

            {/* Resultados */}
            <div className="lg:col-span-7 grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* Peso Total */}
              <div className="bg-white dark:bg-white/[0.02] border border-slate-200 dark:border-white/5 p-5 rounded-3xl flex flex-col justify-between text-left">
                <div>
                  <span className="text-[10px] font-black text-slate-400 dark:text-zinc-500 uppercase tracking-widest block mb-1">Peso Total Estimado</span>
                  <h5 className="text-2xl font-bold text-slate-800 dark:text-white">
                    {simTotalWeight.toLocaleString("pt-BR")} <span className="text-xs text-slate-400 font-semibold">kg de banana</span>
                  </h5>
                </div>
                <p className="text-[10px] text-slate-400 mt-2 font-medium">
                  Produtividade média: <span className="text-emerald-500 dark:text-primary font-bold">{(simPlants > 0 ? simTotalWeight / simPlants : 0).toFixed(2)} kg/pé</span>
                </p>
              </div>

              {/* Receita Total Simulação */}
              <div className="bg-white dark:bg-white/[0.02] border border-slate-200 dark:border-white/5 p-5 rounded-3xl flex flex-col justify-between text-left">
                <div>
                  <span className="text-[10px] font-black text-slate-400 dark:text-zinc-500 uppercase tracking-widest block mb-1">Faturamento Estimado</span>
                  <h5 className="text-2xl font-bold text-emerald-500 dark:text-emerald-400">
                    {formatCurrency(simGrossRevenue)}
                  </h5>
                </div>
                <p className="text-[10px] text-slate-400 mt-2 font-medium">
                  Simulação de receita bruta das vendas.
                </p>
              </div>

              {/* Rendimento por Pé (Planta) */}
              <div className="bg-white dark:bg-primary/5 border border-slate-200 dark:border-primary/10 p-5 rounded-3xl space-y-3 text-left">
                <span className="text-[10px] font-black text-emerald-500 dark:text-primary uppercase tracking-widest block">Rendimento por Pé (Planta)</span>
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-400">Ganho Bruto:</span>
                    <span className="text-slate-700 dark:text-white font-bold">{formatCurrency(simGrossPerPlant)}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-400">Custo Estimado:</span>
                    <span className="text-red-500 dark:text-red-400">{formatCurrency(simCostPerPlant)}</span>
                  </div>
                  <div className="flex justify-between text-xs border-t border-slate-100 dark:border-white/5 pt-1.5 font-bold">
                    <span className="text-slate-500 dark:text-slate-300">Lucro Líquido:</span>
                    <span className={simNetPerPlant >= 0 ? "text-emerald-500 dark:text-emerald-400" : "text-red-500 dark:text-red-400"}>
                      {formatCurrency(simNetPerPlant)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Rendimento por Caixa */}
              <div className="bg-white dark:bg-primary/5 border border-slate-200 dark:border-primary/10 p-5 rounded-3xl space-y-3 text-left">
                <span className="text-[10px] font-black text-emerald-500 dark:text-primary uppercase tracking-widest block">Rendimento por Caixa</span>
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-400">Ganho Bruto:</span>
                    <span className="text-slate-700 dark:text-white font-bold">{formatCurrency(simGrossPerBox)}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-400">Custo Estimado:</span>
                    <span className="text-red-500 dark:text-red-400">{formatCurrency(simCostPerBox)}</span>
                  </div>
                  <div className="flex justify-between text-xs border-t border-slate-100 dark:border-white/5 pt-1.5 font-bold">
                    <span className="text-slate-500 dark:text-slate-300">Lucro Líquido:</span>
                    <span className={simNetPerBox >= 0 ? "text-emerald-500 dark:text-emerald-400" : "text-red-500 dark:text-red-400"}>
                      {formatCurrency(simNetPerBox)}
                    </span>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>

        {/* Seção: Ciclos de Produção (Safras) & Diagnóstico */}
        <div className="glass-card p-8 rounded-[2.5rem] border-white/5 bg-zinc-900/40 space-y-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-4 border-b border-white/5">
            <div className="space-y-1">
              <h3 className="text-xl font-display font-black text-slate-800 dark:text-white flex items-center gap-2">
                <Package className="text-emerald-500 w-6 h-6 animate-pulse" />
                Ciclos de Produção (Safras/Lotes)
              </h3>
              <p className="text-slate-400 text-sm font-medium">
                Controle custos e rendimentos por lote. Feche o ciclo com os dados da colheita e obtenha diagnósticos inteligentes por IA.
              </p>
            </div>
            <button
              onClick={() => {
                resetCycleForm();
                setShowCycleModal(true);
              }}
              className="bg-primary hover:bg-primary-dark px-6 py-3.5 rounded-2xl font-black text-xs uppercase tracking-widest hover:scale-105 transition-all text-white cursor-pointer flex items-center gap-2 self-start md:self-center"
            >
              <PlusCircle size={16} />
              Iniciar Nova Safra
            </button>
          </div>

          {loadingCycles ? (
            <div className="py-12 text-center text-slate-500">
              <div className="flex items-center justify-center gap-2">
                <Loader2 className="w-5 h-5 text-primary animate-spin" />
                <span>Carregando ciclos de produção...</span>
              </div>
            </div>
          ) : cycles.length === 0 ? (
            <div className="py-16 text-center bg-white/[0.01] border border-dashed border-white/5 rounded-3xl space-y-4">
              <div className="mx-auto w-12 h-12 bg-white/5 rounded-full flex items-center justify-center text-zinc-500">
                <Package size={24} />
              </div>
              <div className="space-y-1">
                <h4 className="font-bold text-white text-sm">Nenhum ciclo cadastrado</h4>
                <p className="text-zinc-500 text-xs max-w-sm mx-auto leading-relaxed">
                  Inicie seu primeiro lote/safra para acompanhar os custos por pé em tempo real e habilitar a inteligência do agrônomo virtual.
                </p>
              </div>
              <button
                onClick={() => setShowCycleModal(true)}
                className="bg-white/5 hover:bg-white/10 border border-white/10 px-4 py-2.5 rounded-xl font-bold text-xs text-white"
              >
                Criar Primeiro Ciclo
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {cycles.map((c) => {
                const totalCycleCosts = c.expenses.reduce((sum, e) => sum + e.amount, 0);
                const isClosed = c.status === "Encerrado";
                const totalRevenue = isClosed ? (c.boxes_harvested || 0) * (c.price_per_box || 0) : 0;
                const netProfit = isClosed ? totalRevenue - totalCycleCosts : 0;

                return (
                  <div
                    key={c.id}
                    className={`glass-card p-6 rounded-3xl border transition-all flex flex-col justify-between h-full bg-zinc-900/30 ${
                      isClosed 
                        ? "border-white/5 hover:border-white/15" 
                        : "border-primary/10 hover:border-primary/30"
                    }`}
                  >
                    <div>
                      {/* Header */}
                      <div className="flex justify-between items-start gap-2 mb-4">
                        <div>
                          <h4 className="font-bold text-lg text-white line-clamp-1">{c.name}</h4>
                          <span className="text-[10px] font-bold text-slate-400">Variedade: Banana {c.banana_variety}</span>
                        </div>
                        <span
                          className={`text-[8px] font-black uppercase px-2 py-0.5 rounded ${
                            isClosed
                              ? "bg-slate-800 border border-slate-700 text-slate-400"
                              : "bg-emerald-500/10 border border-emerald-500/20 text-emerald-400"
                          }`}
                        >
                          {c.status}
                        </span>
                      </div>

                      {/* Info grid */}
                      <div className="space-y-2 border-t border-white/5 pt-3 text-xs">
                        <div className="flex justify-between text-slate-400">
                          <span>Quantidade de Pés:</span>
                          <span className="text-white font-semibold">{c.plants_count.toLocaleString()} pés</span>
                        </div>
                        <div className="flex justify-between text-slate-400">
                          <span>Data de Plantio:</span>
                          <span className="text-white font-semibold">
                            {new Date(c.start_date + "T00:00:00").toLocaleDateString("pt-BR")}
                          </span>
                        </div>
                        {isClosed && c.end_date && (
                          <div className="flex justify-between text-slate-400">
                            <span>Data de Colheita:</span>
                            <span className="text-white font-semibold">
                              {new Date(c.end_date + "T00:00:00").toLocaleDateString("pt-BR")}
                            </span>
                          </div>
                        )}
                        <div className="flex justify-between text-slate-400 border-t border-white/5 pt-2">
                          <span>Custo Acumulado:</span>
                          <span className="text-red-400 font-bold">{formatCurrency(totalCycleCosts)}</span>
                        </div>
                        {!isClosed && c.plants_count > 0 && (
                          <div className="flex justify-between text-slate-500 text-[10px]">
                            <span>Custo atual por pé:</span>
                            <span>{formatCurrency(totalCycleCosts / c.plants_count)}/pé</span>
                          </div>
                        )}

                        {/* Closed details */}
                        {isClosed && (
                          <div className="space-y-2 bg-black/20 p-3 rounded-2xl border border-white/5 mt-3">
                            <div className="flex justify-between text-[10px] text-zinc-500 font-bold uppercase tracking-wider mb-1">
                              <span>Resultado Comercial</span>
                            </div>
                            <div className="flex justify-between text-slate-400">
                              <span>Colheita:</span>
                              <span className="text-white font-semibold">
                                {c.boxes_harvested} cx ({((c.boxes_harvested || 0) * 20).toLocaleString()} kg)
                              </span>
                            </div>
                            <div className="flex justify-between text-slate-400">
                              <span>Receita Bruta:</span>
                              <span className="text-emerald-400 font-semibold">{formatCurrency(totalRevenue)}</span>
                            </div>
                            <div className="flex justify-between text-slate-300 font-bold border-t border-white/5 pt-1">
                              <span>Lucro Líquido:</span>
                              <span className={netProfit >= 0 ? "text-emerald-400" : "text-red-400"}>
                                {formatCurrency(netProfit)}
                              </span>
                            </div>
                            <div className="grid grid-cols-2 gap-2 border-t border-white/5 pt-2 mt-1 text-[10px] text-zinc-500 font-medium">
                              <div>
                                Custo/Pé: <span className="text-slate-300 font-bold">{formatCurrency(totalCycleCosts / (c.plants_count || 1))}</span>
                              </div>
                              <div>
                                Lucro/Pé: <span className={netProfit >= 0 ? "text-emerald-400 font-bold" : "text-red-400 font-bold"}>{formatCurrency(netProfit / (c.plants_count || 1))}</span>
                              </div>
                              <div>
                                Custo/Cx: <span className="text-slate-300 font-bold">{formatCurrency(totalCycleCosts / (c.boxes_harvested || 1))}</span>
                              </div>
                              <div>
                                Lucro/Cx: <span className={netProfit >= 0 ? "text-emerald-400 font-bold" : "text-red-400 font-bold"}>{formatCurrency(netProfit / (c.boxes_harvested || 1))}</span>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-between gap-2 border-t border-white/5 pt-4 mt-6">
                      <div className="flex gap-2 flex-1">
                        {!isClosed ? (
                          <>
                            <button
                              onClick={() => {
                                setSelectedCycleForExpenses(c);
                                setExpDescription("");
                                setExpAmount("");
                                setExpDate("");
                                setShowExpensesModal(true);
                              }}
                              className="bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold text-[10px] uppercase tracking-wider px-3 py-2 rounded-xl transition-all flex items-center gap-1 cursor-pointer"
                            >
                              <PlusCircle size={12} />
                              Despesas
                            </button>
                            <button
                              onClick={() => {
                                setSelectedCycleForClose(c);
                                setCloseBoxes("");
                                setClosePrice("");
                                setShowCloseCycleModal(true);
                              }}
                              className="bg-primary hover:bg-primary-dark text-white font-bold text-[10px] uppercase tracking-wider px-3 py-2 rounded-xl transition-all flex items-center gap-1 cursor-pointer"
                            >
                              <CheckCircle2 size={12} />
                              Colheita
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() => {
                              setSelectedCycleForAi(c);
                              setAiNotes(c.notes || "");
                              setShowAiModal(true);
                            }}
                            className="bg-emerald-500/10 border border-emerald-500/20 hover:bg-emerald-500/20 text-emerald-400 font-bold text-[10px] uppercase tracking-wider px-4 py-2 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer w-full justify-center"
                          >
                            <Sparkles size={12} />
                            Diagnóstico IA
                          </button>
                        )}
                      </div>

                      <div className="flex gap-1">
                        {!isClosed && (
                          <button
                            onClick={() => startEditCycle(c)}
                            className="p-2 rounded-lg bg-white/5 text-zinc-500 hover:text-white hover:bg-white/10 transition-all cursor-pointer"
                            title="Editar Ciclo"
                          >
                            <Pencil size={12} />
                          </button>
                        )}
                        <button
                          onClick={() => handleDeleteCycle(c.id)}
                          className="p-2 rounded-lg bg-white/5 text-zinc-500 hover:text-red-400 hover:bg-red-500/10 transition-all cursor-pointer"
                          title="Excluir Ciclo"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Transactions Table */}
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <h2 className="text-2xl font-display font-bold flex items-center gap-3 text-white">
              <History className="text-primary" />
              Lançamentos Financeiros
            </h2>
            
            <div className="flex gap-3">
              <div className="bg-white/5 border border-white/10 px-4 py-2 rounded-xl flex items-center gap-2">
                <Search size={16} className="text-slate-500" />
                <input 
                  type="text" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Filtrar lançamentos..." 
                  className="bg-transparent border-none outline-none text-xs w-36 text-white" 
                />
              </div>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="bg-white/5 border border-white/10 rounded-xl text-xs text-zinc-400 px-3 py-2 focus:outline-none cursor-pointer"
              >
                <option value="Todos">Todos os Tipos</option>
                <option value="Receita">Apenas Receitas</option>
                <option value="Despesa">Apenas Despesas</option>
              </select>
            </div>
          </div>

          <div className="glass-card rounded-[2.5rem] border-white/5 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-white/[0.02] border-b border-white/5">
                    <th className="px-8 py-6 text-xs uppercase tracking-widest text-slate-500 font-bold">Tipo</th>
                    <th className="px-8 py-6 text-xs uppercase tracking-widest text-slate-500 font-bold">Categoria</th>
                    <th className="px-8 py-6 text-xs uppercase tracking-widest text-slate-500 font-bold">Descrição</th>
                    <th className="px-8 py-6 text-xs uppercase tracking-widest text-slate-500 font-bold">Data</th>
                    <th className="px-8 py-6 text-xs uppercase tracking-widest text-slate-500 font-bold text-right">Valor</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {loadingTransactions ? (
                    <tr>
                      <td colSpan={5} className="px-8 py-20 text-center text-slate-500">
                        <div className="flex items-center justify-center gap-2">
                          <Loader2 className="w-5 h-5 text-primary animate-spin" />
                          <span>Carregando do Supabase...</span>
                        </div>
                      </td>
                    </tr>
                  ) : filteredTransactions.length > 0 ? (
                    filteredTransactions.map((tx) => (
                      <tr key={tx.id} className="hover:bg-white/[0.01] transition-colors group relative">
                        <td className="px-8 py-6">
                          <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-lg ${tx.type === "Despesa" ? 'bg-red-400/10 text-red-400' : 'bg-emerald-400/10 text-emerald-400'}`}>
                              {tx.type === "Despesa" ? <ArrowUpCircle size={16} /> : <ArrowDownCircle size={16} />}
                            </div>
                            <span className="font-bold text-white">{tx.type}</span>
                          </div>
                        </td>
                        <td className="px-8 py-6">
                          <div className="flex items-center gap-2">
                            <span className="text-slate-300 font-semibold">{tx.category}</span>
                            {tx.area_id && (
                              <span className="text-[8px] font-black uppercase px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                                {areas.find(a => String(a.id) === String(tx.area_id))?.name || "Talhão"}
                              </span>
                            )}
                            {tx.type === "Despesa" && (
                              <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded ${
                                tx.costClassification === "Fixo" 
                                  ? "bg-purple-500/10 border border-purple-500/20 text-purple-400" 
                                  : "bg-amber-500/10 border border-amber-500/20 text-amber-400"
                              }`}>
                                {tx.costClassification || "Variável"}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-8 py-6 text-slate-500 text-xs max-w-sm truncate">{tx.description}</td>
                        <td className="px-8 py-6 text-slate-500 text-xs">
                          {new Date(tx.date + "T00:00:00").toLocaleDateString('pt-BR')}
                        </td>
                        <td className="px-8 py-6 text-right">
                          <div className="flex items-center justify-end gap-3">
                            <span className={`font-bold text-base ${tx.type === "Despesa" ? 'text-red-400' : 'text-emerald-400'}`}>
                              {tx.type === "Despesa" ? '-' : '+'} {formatCurrency(tx.amount)}
                            </span>
                            <button
                              onClick={() => startEditTransaction(tx)}
                              className="p-1 rounded bg-white/5 text-zinc-600 hover:text-primary opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                            >
                              <Pencil size={12} />
                            </button>
                            <button
                              onClick={() => handleDeleteTransaction(tx.id)}
                              className="p-1 rounded bg-white/5 text-zinc-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="px-8 py-20 text-center text-slate-500">
                        Nenhum lançamento financeiro registrado.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Transaction Add Modal */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAddModal(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md bg-zinc-950 border border-white/10 rounded-[2.5rem] overflow-hidden shadow-2xl p-8 z-10"
            >
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-2xl font-bold text-white">Lançar Movimentação</h2>
                <button onClick={() => setShowAddModal(false)} className="p-2 hover:bg-white/5 rounded-full transition-colors cursor-pointer text-zinc-400 hover:text-white">
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleAddTransaction} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-300">Tipo de Lançamento</label>
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      type="button"
                      onClick={() => {
                        setTxType("Receita");
                        setTxCategory("Venda de Banana Cavendish");
                      }}
                      className={`py-3 rounded-2xl font-bold text-xs uppercase tracking-widest border transition-all cursor-pointer ${
                        txType === "Receita" 
                          ? "bg-emerald-500 border-emerald-500 text-white shadow-lg shadow-emerald-500/20" 
                          : "bg-black/30 border-white/10 text-zinc-500 hover:text-white"
                      }`}
                    >
                      Receita (+)
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setTxType("Despesa");
                        setTxCategory("Adubos/Insumos");
                      }}
                      className={`py-3 rounded-2xl font-bold text-xs uppercase tracking-widest border transition-all cursor-pointer ${
                        txType === "Despesa" 
                          ? "bg-red-500 border-red-500 text-white shadow-lg shadow-red-500/20" 
                          : "bg-black/30 border-white/10 text-zinc-500 hover:text-white"
                      }`}
                    >
                      Despesa (-)
                    </button>
                  </div>
                </div>

                {txType === "Despesa" && (
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-slate-300">Classificacao do Custo</label>
                    <div className="grid grid-cols-2 gap-4">
                      <button
                        type="button"
                        onClick={() => setTxCostClassification("Fixo")}
                        className={`py-2.5 rounded-xl font-bold text-xs uppercase tracking-widest border transition-all cursor-pointer ${
                          txCostClassification === "Fixo" 
                            ? "bg-purple-600/20 border-purple-500 text-purple-400 shadow-md" 
                            : "bg-black/30 border-white/10 text-zinc-500 hover:text-white"
                        }`}
                      >
                        Fixo
                      </button>
                      <button
                        type="button"
                        onClick={() => setTxCostClassification("Variável")}
                        className={`py-2.5 rounded-xl font-bold text-xs uppercase tracking-widest border transition-all cursor-pointer ${
                          txCostClassification === "Variável" 
                            ? "bg-amber-600/20 border-amber-500 text-amber-400 shadow-md" 
                            : "bg-black/30 border-white/10 text-zinc-500 hover:text-white"
                        }`}
                      >
                        Variavel
                      </button>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-slate-300">Categoria</label>
                    {txType === "Receita" ? (
                      <select
                        value={txCategory}
                        onChange={(e) => setTxCategory(e.target.value)}
                        className="w-full bg-zinc-900 border border-white/10 rounded-2xl py-3 px-4 text-white text-xs focus:outline-none h-[42px] cursor-pointer"
                      >
                        <option value="Venda de Banana Cavendish">Banana Cavendish</option>
                        <option value="Venda de Banana Prata">Banana Prata</option>
                        <option value="Venda de Banana Nanica">Banana Nanica</option>
                        <option value="Outras Vendas">Outras Vendas</option>
                      </select>
                    ) : (
                      <select
                        value={txCategory}
                        onChange={(e) => setTxCategory(e.target.value)}
                        className="w-full bg-zinc-900 border border-white/10 rounded-2xl py-3 px-4 text-white text-xs focus:outline-none h-[42px] cursor-pointer"
                      >
                        <option value="Adubos/Insumos">Adubos/Insumos</option>
                        <option value="Mão de Obra">Mão de Obra</option>
                        <option value="Defensivos">Defensivos</option>
                        <option value="Combustível">Combustível</option>
                        <option value="Equipamentos">Equipamentos</option>
                        <option value="Outros Custos">Outros Custos</option>
                      </select>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-slate-300">Data</label>
                    <input
                      type="date"
                      required
                      value={txDate}
                      onChange={(e) => setTxDate(e.target.value)}
                      className="w-full bg-black/40 border border-white/10 rounded-2xl py-2 px-4 text-white text-xs focus:outline-none h-[42px]"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-300">Gleba / Talhão</label>
                  <select
                    value={txAreaId}
                    onChange={(e) => setTxAreaId(e.target.value)}
                    className="w-full bg-zinc-900 border border-white/10 rounded-2xl py-3 px-4 text-white text-xs focus:outline-none h-[42px] cursor-pointer"
                  >
                    <option value="all">Geral (Sem Talhão Específico)</option>
                    {areas.map((a) => (
                      <option key={a.id} value={a.id}>{a.name} ({a.banana_variety})</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-300">Valor (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={txAmount}
                    onChange={(e) => setTxAmount(e.target.value)}
                    placeholder="0,00"
                    className="w-full bg-black/40 border border-white/10 rounded-2xl py-3.5 px-4 text-xl font-bold text-white focus:outline-none text-center"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-300">Descrição / Destinatário</label>
                  <input
                    type="text"
                    required
                    value={txDescription}
                    onChange={(e) => setTxDescription(e.target.value)}
                    placeholder="Ex: Compra de fertilizantes da Nortox"
                    className="w-full bg-black/40 border border-white/10 rounded-2xl py-3.5 px-4 text-xs text-white focus:outline-none"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-primary hover:bg-primary-dark text-white font-bold py-4 rounded-2xl shadow-lg shadow-primary/20 transition-all cursor-pointer text-xs uppercase tracking-widest"
                >
                  Registrar Lançamento
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Transaction Edit Modal */}
      <AnimatePresence>
        {showEditModal && editingTransaction && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                setShowEditModal(false);
                setEditingTransaction(null);
              }}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md bg-zinc-950 border border-white/10 rounded-[2.5rem] overflow-hidden shadow-2xl p-8 z-10"
            >
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-2xl font-bold text-white">Editar Lançamento</h2>
                <button 
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingTransaction(null);
                  }} 
                  className="p-2 hover:bg-white/5 rounded-full transition-colors cursor-pointer text-zinc-400 hover:text-white"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleEditTransaction} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-300">Tipo de Lançamento</label>
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      type="button"
                      onClick={() => {
                        setEditTxType("Receita");
                        setEditTxCategory("Venda de Banana Cavendish");
                      }}
                      className={`py-3 rounded-2xl font-bold text-xs uppercase tracking-widest border transition-all cursor-pointer ${
                        editTxType === "Receita" 
                          ? "bg-emerald-500 border-emerald-500 text-white shadow-lg shadow-emerald-500/20" 
                          : "bg-black/30 border-white/10 text-zinc-500 hover:text-white"
                      }`}
                    >
                      Receita (+)
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setEditTxType("Despesa");
                        setEditTxCategory("Adubos/Insumos");
                      }}
                      className={`py-3 rounded-2xl font-bold text-xs uppercase tracking-widest border transition-all cursor-pointer ${
                        editTxType === "Despesa" 
                          ? "bg-red-500 border-red-500 text-white shadow-lg shadow-red-500/20" 
                          : "bg-black/30 border-white/10 text-zinc-500 hover:text-white"
                      }`}
                    >
                      Despesa (-)
                    </button>
                  </div>
                </div>

                {editTxType === "Despesa" && (
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-slate-300">Classificacao do Custo</label>
                    <div className="grid grid-cols-2 gap-4">
                      <button
                        type="button"
                        onClick={() => setEditTxCostClassification("Fixo")}
                        className={`py-2.5 rounded-xl font-bold text-xs uppercase tracking-widest border transition-all cursor-pointer ${
                          editTxCostClassification === "Fixo" 
                            ? "bg-purple-600/20 border-purple-500 text-purple-400 shadow-md" 
                            : "bg-black/30 border-white/10 text-zinc-500 hover:text-white"
                        }`}
                      >
                        Fixo
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditTxCostClassification("Variável")}
                        className={`py-2.5 rounded-xl font-bold text-xs uppercase tracking-widest border transition-all cursor-pointer ${
                          editTxCostClassification === "Variável" 
                            ? "bg-amber-600/20 border-amber-500 text-amber-400 shadow-md" 
                            : "bg-black/30 border-white/10 text-zinc-500 hover:text-white"
                        }`}
                      >
                        Variavel
                      </button>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-slate-300">Categoria</label>
                    {editTxType === "Receita" ? (
                      <select
                        value={editTxCategory}
                        onChange={(e) => setEditTxCategory(e.target.value)}
                        className="w-full bg-zinc-900 border border-white/10 rounded-2xl py-3 px-4 text-white text-xs focus:outline-none h-[42px] cursor-pointer"
                      >
                        <option value="Venda de Banana Cavendish">Banana Cavendish</option>
                        <option value="Venda de Banana Prata">Banana Prata</option>
                        <option value="Venda de Banana Nanica">Banana Nanica</option>
                        <option value="Outras Vendas">Outras Vendas</option>
                      </select>
                    ) : (
                      <select
                        value={editTxCategory}
                        onChange={(e) => setEditTxCategory(e.target.value)}
                        className="w-full bg-zinc-900 border border-white/10 rounded-2xl py-3 px-4 text-white text-xs focus:outline-none h-[42px] cursor-pointer"
                      >
                        <option value="Adubos/Insumos">Adubos/Insumos</option>
                        <option value="Mão de Obra">Mão de Obra</option>
                        <option value="Defensivos">Defensivos</option>
                        <option value="Combustível">Combustível</option>
                        <option value="Equipamentos">Equipamentos</option>
                        <option value="Outros Custos">Outros Custos</option>
                      </select>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-slate-300">Data</label>
                    <input
                      type="date"
                      required
                      value={editTxDate}
                      onChange={(e) => setEditTxDate(e.target.value)}
                      className="w-full bg-black/40 border border-white/10 rounded-2xl py-2 px-4 text-white text-xs focus:outline-none h-[42px]"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-300">Gleba / Talhão</label>
                  <select
                    value={editTxAreaId}
                    onChange={(e) => setEditTxAreaId(e.target.value)}
                    className="w-full bg-zinc-900 border border-white/10 rounded-2xl py-3 px-4 text-white text-xs focus:outline-none h-[42px] cursor-pointer"
                  >
                    <option value="all">Geral (Sem Talhão Específico)</option>
                    {areas.map((a) => (
                      <option key={a.id} value={a.id}>{a.name} ({a.banana_variety})</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-300">Valor (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={editTxAmount}
                    onChange={(e) => setEditTxAmount(e.target.value)}
                    placeholder="0,00"
                    className="w-full bg-black/40 border border-white/10 rounded-2xl py-3.5 px-4 text-xl font-bold text-white focus:outline-none text-center"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-300">Descrição / Destinatário</label>
                  <input
                    type="text"
                    required
                    value={editTxDescription}
                    onChange={(e) => setEditTxDescription(e.target.value)}
                    placeholder="Ex: Compra de fertilizantes da Nortox"
                    className="w-full bg-black/40 border border-white/10 rounded-2xl py-3.5 px-4 text-xs text-white focus:outline-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-primary hover:bg-primary-dark text-white font-bold py-4 rounded-2xl shadow-lg shadow-primary/20 transition-all cursor-pointer text-xs uppercase tracking-widest flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    "Salvar Alterações"
                  )}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal: Novo/Editar Ciclo */}
      <AnimatePresence>
        {showCycleModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowCycleModal(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md bg-zinc-950 border border-white/10 rounded-[2.5rem] overflow-hidden shadow-2xl p-8 z-10"
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-white">
                  {editingCycle ? "Editar Lote / Safra" : "Iniciar Novo Lote / Safra"}
                </h2>
                <button
                  onClick={() => setShowCycleModal(false)}
                  className="p-2 hover:bg-white/5 rounded-full transition-colors cursor-pointer text-zinc-400 hover:text-white"
                >
                  <X size={20} />
                </button>
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSaveCycle(cycleName, parseInt(cyclePlants) || 0, cycleVariety, cycleStartDate, editingCycle?.id);
                }}
                className="space-y-5"
              >
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">Identificação do Lote / Nome</label>
                  <input
                    type="text"
                    required
                    value={cycleName}
                    onChange={(e) => setCycleName(e.target.value)}
                    placeholder="Ex: Talhão Sul - Cavendish 2025/2026"
                    className="w-full bg-black/40 border border-white/10 rounded-2xl py-3 px-4 text-xs text-white focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300">Variedade de Banana</label>
                    <select
                      value={cycleVariety}
                      onChange={(e) => setCycleVariety(e.target.value)}
                      className="w-full bg-zinc-900 border border-white/10 rounded-2xl py-3 px-4 text-white text-xs focus:outline-none h-[42px] cursor-pointer"
                    >
                      <option value="Cavendish">Cavendish</option>
                      <option value="Prata Anã">Prata Anã</option>
                      <option value="Prata Gorutuba">Prata Gorutuba</option>
                      <option value="Nanica">Nanica</option>
                      <option value="Terra">Terra</option>
                      <option value="Maçã">Maçã</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300">Data de Plantio/Início</label>
                    <input
                      type="date"
                      required
                      value={cycleStartDate}
                      onChange={(e) => setCycleStartDate(e.target.value)}
                      className="w-full bg-black/40 border border-white/10 rounded-2xl py-2 px-4 text-white text-xs focus:outline-none h-[42px]"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">Quantidade de Pés (Plantas)</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={cyclePlants}
                    onChange={(e) => setCyclePlants(e.target.value)}
                    placeholder="Ex: 2000"
                    className="w-full bg-black/40 border border-white/10 rounded-2xl py-3 px-4 text-xs text-white focus:outline-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-primary hover:bg-primary-dark text-white font-bold py-4 rounded-2xl shadow-lg shadow-primary/20 transition-all cursor-pointer text-xs uppercase tracking-widest flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Iniciando...
                    </>
                  ) : (
                    editingCycle ? "Salvar Alterações" : "Iniciar Safra"
                  )}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal: Gerenciar Despesas do Ciclo */}
      <AnimatePresence>
        {showExpensesModal && selectedCycleForExpenses && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowExpensesModal(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-lg bg-zinc-950 border border-white/10 rounded-[2.5rem] overflow-hidden shadow-2xl p-8 z-10 flex flex-col max-h-[90vh]"
            >
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <Wallet className="text-red-400" size={20} />
                    Despesas: {selectedCycleForExpenses.name}
                  </h2>
                  <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">
                    Total Acumulado: {formatCurrency(selectedCycleForExpenses.expenses.reduce((sum, e) => sum + e.amount, 0))}
                  </span>
                </div>
                <button
                  onClick={() => setShowExpensesModal(false)}
                  className="p-2 hover:bg-white/5 rounded-full transition-colors cursor-pointer text-zinc-400 hover:text-white"
                >
                  <X size={20} />
                </button>
              </div>

              {/* List of expenses */}
              <div className="flex-1 overflow-y-auto pr-2 space-y-3 mb-6 border-b border-white/5 pb-4">
                {selectedCycleForExpenses.expenses.length === 0 ? (
                  <div className="py-8 text-center text-xs text-zinc-500">
                    Nenhuma despesa lançada especificamente para esta safra. Cadastre abaixo.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {selectedCycleForExpenses.expenses.map((exp) => (
                      <div
                        key={exp.id}
                        className="bg-white/[0.02] border border-white/5 p-3 rounded-2xl flex items-center justify-between gap-4 group"
                      >
                        <div>
                          <p className="text-xs font-bold text-white">{exp.description}</p>
                          <span className="text-[10px] text-zinc-500">
                            {new Date(exp.date + "T00:00:00").toLocaleDateString("pt-BR")}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-red-400">-{formatCurrency(exp.amount)}</span>
                          <button
                            onClick={() => handleDeleteCycleExpense(exp.id)}
                            className="p-1 rounded bg-white/5 text-zinc-600 hover:text-red-400 transition-colors cursor-pointer"
                            title="Remover Despesa"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Add Expense Form */}
              <form onSubmit={handleAddCycleExpense} className="space-y-4 bg-white/[0.01] p-4 rounded-2xl border border-white/5">
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">Novo Lançamento no Lote</h3>
                
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-400 font-bold uppercase">Valor (R$)</label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={expAmount}
                      onChange={(e) => setExpAmount(e.target.value)}
                      placeholder="0,00"
                      className="w-full bg-zinc-900 border border-white/10 rounded-xl py-2 px-3 text-xs font-bold text-white focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-400 font-bold uppercase">Data despesa</label>
                    <input
                      type="date"
                      required
                      value={expDate}
                      onChange={(e) => setExpDate(e.target.value)}
                      className="w-full bg-zinc-900 border border-white/10 rounded-xl py-1.5 px-3 text-xs text-white focus:outline-none h-[34px]"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 font-bold uppercase">Descrição da Despesa</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      required
                      value={expDescription}
                      onChange={(e) => setExpDescription(e.target.value)}
                      placeholder="Ex: Fertilizantes, Ensacamento, Inseticida"
                      className="w-full bg-zinc-900 border border-white/10 rounded-xl py-2 px-3 text-xs text-white focus:outline-none"
                    />
                    <button
                      type="submit"
                      disabled={loading}
                      className="bg-primary hover:bg-primary-dark text-white font-bold text-xs uppercase tracking-wider px-4 rounded-xl transition-all cursor-pointer whitespace-nowrap"
                    >
                      {loading ? "Add..." : "Adicionar"}
                    </button>
                  </div>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal: Encerrar Safra (Colheita) */}
      <AnimatePresence>
        {showCloseCycleModal && selectedCycleForClose && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowCloseCycleModal(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md bg-zinc-950 border border-white/10 rounded-[2.5rem] overflow-hidden shadow-2xl p-8 z-10"
            >
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <CheckCircle2 className="text-primary" size={22} />
                    Fechar Safra / Colheita
                  </h2>
                  <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">
                    Lote: {selectedCycleForClose.name}
                  </span>
                </div>
                <button
                  onClick={() => setShowCloseCycleModal(false)}
                  className="p-2 hover:bg-white/5 rounded-full transition-colors cursor-pointer text-zinc-400 hover:text-white"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleCloseCycle} className="space-y-5">
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Informe os dados comerciais de fechamento do lote. O sistema calculará o faturamento bruto, margem líquida e retornos médios por planta e caixa.
                </p>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300">Caixas Colhidas</label>
                    <input
                      type="number"
                      required
                      min="1"
                      value={closeBoxes}
                      onChange={(e) => setCloseBoxes(e.target.value)}
                      placeholder="Ex: 500"
                      className="w-full bg-black/40 border border-white/10 rounded-2xl py-3 px-4 text-xs text-white focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300">Valor / Caixa (R$)</label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      min="0.1"
                      value={closePrice}
                      onChange={(e) => setClosePrice(e.target.value)}
                      placeholder="Ex: 35,00"
                      className="w-full bg-black/40 border border-white/10 rounded-2xl py-3 px-4 text-xs text-white focus:outline-none text-center font-bold"
                    />
                  </div>
                </div>

                <div className="bg-white/[0.01] border border-white/5 p-4 rounded-2xl text-[10px] text-zinc-500 space-y-1.5">
                  <div className="flex justify-between">
                    <span>Peso médio da caixa:</span>
                    <span className="text-white font-bold">20 kg</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Custo operacional acumulado:</span>
                    <span className="text-red-400 font-bold">
                      {formatCurrency(selectedCycleForClose.expenses.reduce((sum, e) => sum + e.amount, 0))}
                    </span>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-primary hover:bg-primary-dark text-white font-bold py-4 rounded-2xl shadow-lg shadow-primary/20 transition-all cursor-pointer text-xs uppercase tracking-widest flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Encerrando...
                    </>
                  ) : (
                    "Confirmar Encerramento de Safra"
                  )}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal: Diagnóstico de IA */}
      <AnimatePresence>
        {showAiModal && selectedCycleForAi && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                if (!analyzing) setShowAiModal(false);
              }}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-2xl bg-zinc-950 border border-white/10 rounded-[2.5rem] overflow-hidden shadow-2xl p-8 z-10 flex flex-col max-h-[90vh]"
            >
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                    <Sparkles className="text-primary" size={22} />
                    Diagnóstico Agronômico IA
                  </h2>
                  <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">
                    Safra: {selectedCycleForAi.name}
                  </span>
                </div>
                <button
                  onClick={() => {
                    if (!analyzing) setShowAiModal(false);
                  }}
                  className="p-2 hover:bg-white/5 rounded-full transition-colors cursor-pointer text-zinc-400 hover:text-white"
                >
                  <X size={20} />
                </button>
              </div>

              {analyzing ? (
                /* Scanning loader screen */
                <div className="flex-1 py-16 flex flex-col items-center justify-center space-y-6">
                  <div className="relative">
                    <div className="w-16 h-16 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
                    <div className="absolute inset-0 flex items-center justify-center text-primary">
                      <Sparkles size={20} className="animate-pulse" />
                    </div>
                  </div>
                  
                  <div className="text-center space-y-2 max-w-xs">
                    <h3 className="font-bold text-white text-sm animate-pulse">
                      {[
                        "Processando dados de rentabilidade...",
                        "Comparando custo/pé com histórico operacional...",
                        "Analisando impacto de quebras e perdas por tombamento...",
                        "Avaliando parâmetros de rega e clima local...",
                        "Gerando recomendações e plano de ação agronômico..."
                      ][analysisStep]}
                    </h3>
                    <p className="text-xs text-zinc-500">
                      O agrônomo virtual está processando os dados financeiros e seu relato prático.
                    </p>
                  </div>
                </div>
              ) : selectedCycleForAi.ai_diagnosis ? (
                /* Diagnostic results screen */
                <div className="flex-grow flex flex-col min-h-0">
                  <div className="flex-1 overflow-y-auto pr-2 space-y-6 bg-black/30 p-6 rounded-3xl border border-white/5 mb-6">
                    {/* Rendered custom markdown */}
                    <div className="space-y-1">
                      {(() => {
                        const text = selectedCycleForAi.ai_diagnosis;
                        return text.split("\n").map((line, idx) => {
                          if (line.startsWith("### ")) {
                            return (
                              <h4 key={idx} className="text-xs font-black text-primary uppercase tracking-widest mt-6 mb-3 border-b border-white/5 pb-1 flex items-center gap-1.5">
                                <Zap size={10} />
                                {line.replace("### ", "")}
                              </h4>
                            );
                          }
                          if (line.startsWith("* ")) {
                            const content = line.replace("* ", "");
                            const boldParts = content.split("**");
                            return (
                              <li key={idx} className="text-xs text-slate-300 ml-4 list-disc mb-2 leading-relaxed">
                                {boldParts.map((part, i) => i % 2 === 1 ? <strong key={i} className="text-white font-bold">{part}</strong> : part)}
                              </li>
                            );
                          }
                          if (line.startsWith("    * ")) {
                            const content = line.replace("    * ", "");
                            const boldParts = content.split("**");
                            return (
                              <li key={idx} className="text-xs text-slate-400 ml-8 list-circle mb-1.5 leading-relaxed">
                                {boldParts.map((part, i) => i % 2 === 1 ? <strong key={i} className="text-white font-bold">{part}</strong> : part)}
                              </li>
                            );
                          }
                          if (line.match(/^\d+\.\s+/)) {
                            const content = line.replace(/^\d+\.\s+/, "");
                            const num = line.match(/^(\d+)\./)?.[1] || "";
                            const boldParts = content.split("**");
                            return (
                              <div key={idx} className="text-xs text-slate-300 font-semibold mt-4 mb-2 flex gap-2">
                                <span className="text-primary font-bold">{num}.</span>
                                <div>
                                  {boldParts.map((part, i) => i % 2 === 1 ? <strong key={i} className="text-white font-bold">{part}</strong> : part)}
                                </div>
                              </div>
                            );
                          }
                          if (line.trim() === "---") {
                            return <hr key={idx} className="border-white/5 my-4" />;
                          }
                          if (line.trim() === "") {
                            return null;
                          }
                          const boldParts = line.split("**");
                          return (
                            <p key={idx} className="text-xs text-slate-300 mb-2 leading-relaxed">
                              {boldParts.map((part, i) => i % 2 === 1 ? <strong key={i} className="text-white font-bold">{part}</strong> : part)}
                            </p>
                          );
                        });
                      })()}
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <button
                      onClick={() => {
                        const updated = { ...selectedCycleForAi, ai_diagnosis: null };
                        setSelectedCycleForAi(updated);
                      }}
                      className="bg-white/5 border border-white/10 hover:bg-white/10 text-white font-bold text-xs uppercase tracking-wider py-3.5 px-6 rounded-2xl cursor-pointer flex items-center gap-2"
                    >
                      Refazer Diagnóstico
                    </button>
                    <button
                      onClick={() => setShowAiModal(false)}
                      className="flex-1 bg-primary hover:bg-primary-dark text-white font-bold text-xs uppercase tracking-wider py-3.5 px-6 rounded-2xl cursor-pointer text-center"
                    >
                      Fechar
                    </button>
                  </div>
                </div>
              ) : (
                /* Note submission screen */
                <div className="space-y-6">
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    Para calibrar as recomendações agronômicas e fazer uma análise financeira correta de perdas, dê um resumo de como você cuidou deste lote (irrigação e adubação) e se ocorreram tombamentos ou pragas.
                  </p>

                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-slate-300">Relato do Manejo e Perdas da Safra</label>
                    <textarea
                      required
                      rows={5}
                      value={aiNotes}
                      onChange={(e) => setAiNotes(e.target.value)}
                      placeholder="Ex: Molhei com microaspersão a cada 2 dias. Tivemos um vento muito forte em novembro que derrubou cerca de 15% das plantas mais pesadas. Também notamos um foco de broca no meio do lote no fim da safra."
                      className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 text-xs text-white focus:outline-none resize-none leading-relaxed"
                    />
                  </div>

                  <button
                    onClick={handleRunAiDiagnosis}
                    disabled={!aiNotes.trim() || loading}
                    className="w-full bg-primary hover:bg-primary-dark text-white font-bold py-4 rounded-2xl shadow-lg shadow-primary/20 transition-all cursor-pointer text-xs uppercase tracking-widest flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Sparkles size={16} />
                    Gerar Diagnóstico Avançado com IA
                  </button>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </Layout>
  );
}
