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
  Pencil
} from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { supabase } from "../../lib/supabase";
import { toast } from "react-hot-toast";

interface FarmTransaction {
  id: string;
  type: "Receita" | "Despesa";
  category: string;
  amount: number;
  date: string;
  description: string;
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

  // Transaction list state
  const [transactions, setTransactions] = useState<FarmTransaction[]>([]);

  // Form states
  const [txType, setTxType] = useState<"Receita" | "Despesa">("Despesa");
  const [txCategory, setTxCategory] = useState("Adubos/Insumos");
  const [txAmount, setTxAmount] = useState("");
  const [txDate, setTxDate] = useState("");
  const [txDescription, setTxDescription] = useState("");

  // Edit states
  const [editingTransaction, setEditingTransaction] = useState<FarmTransaction | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editTxType, setEditTxType] = useState<"Receita" | "Despesa">("Despesa");
  const [editTxCategory, setEditTxCategory] = useState("Adubos/Insumos");
  const [editTxAmount, setEditTxAmount] = useState("");
  const [editTxDate, setEditTxDate] = useState("");
  const [editTxDescription, setEditTxDescription] = useState("");

  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<string>("Todos");

  // Load farm parameters
  useEffect(() => {
    if (profile?.id) {
      const stored = localStorage.getItem(`farm_parameters_${profile.id}`);
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          if (parsed.hectares !== undefined) setHectares(parsed.hectares);
          if (parsed.plantsCount !== undefined) setPlantsCount(parsed.plantsCount);
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
        return {
          id: String(t.id),
          type: (t.type === 'Receita' || t.type === 'Despesa') ? t.type : 'Despesa',
          category: parts[0] || 'Outros',
          amount: t.amount,
          date: t.created_at ? t.created_at.split('T')[0] : new Date().toISOString().split('T')[0],
          description: parts[1] || t.description || ''
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

  useEffect(() => {
    fetchTransactions();
  }, [profile]);

  // Calculations
  const totalReceitas = transactions
    .filter(t => t.type === "Receita")
    .reduce((sum, t) => sum + t.amount, 0);

  const totalDespesas = transactions
    .filter(t => t.type === "Despesa")
    .reduce((sum, t) => sum + t.amount, 0);

  const lucroEstimado = totalReceitas - totalDespesas;

  // Indicators
  const custoPorHectare = hectares > 0 ? totalDespesas / hectares : 0;
  const custoPorPlanta = plantsCount > 0 ? totalDespesas / plantsCount : 0;

  // Break-even: totalDespesas / targetBoxPrice (how many boxes to sell to cover total farm expenses)
  const breakEvenBoxes = targetBoxPrice > 0 ? Math.ceil(totalDespesas / targetBoxPrice) : 0;

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
      const categoryAndDesc = `${txCategory} | ${txDescription}`;
      const { error } = await supabase
        .from('transactions')
        .insert([
          {
            user_id: profile.id,
            amount: parseFloat(txAmount),
            type: txType,
            description: categoryAndDesc,
            status: 'completed',
            created_at: new Date(txDate + "T12:00:00").toISOString()
          }
        ]);

      if (error) throw error;

      toast.success("Lançamento financeiro registrado com sucesso!");
      setShowAddModal(false);
      setTxAmount("");
      setTxDescription("");
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
      const categoryAndDesc = `${editTxCategory} | ${editTxDescription}`;
      const { error } = await supabase
        .from('transactions')
        .update({
          amount: parseFloat(editTxAmount),
          type: editTxType,
          description: categoryAndDesc,
          created_at: new Date(editTxDate + "T12:00:00").toISOString()
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
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-4xl font-display font-bold mb-2 text-white">Gestão Financeira</h1>
            <p className="text-slate-400 text-lg">Controle de custos por hectare/planta, ponto de equilíbrio e fluxo de caixa da fazenda.</p>
          </div>
          
          <button 
            onClick={() => setShowAddModal(true)}
            className="bg-primary hover:bg-primary-dark px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:scale-105 transition-all shadow-xl shadow-primary/20 text-white cursor-pointer"
          >
            <PlusCircle size={18} className="inline mr-2" />
            Lançar Receita/Despesa
          </button>
        </div>

        {/* Farm Parameters Setting Bar */}
        <div className="glass-card p-6 rounded-3xl border-white/5 bg-zinc-900/40 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-1">
            <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Área da Lavoura (Hectares)</label>
            <input
              type="number"
              step="0.1"
              value={hectares}
              onChange={(e) => {
                const val = parseFloat(e.target.value) || 0;
                setHectares(val);
                saveFarmParameters({ hectares: val });
              }}
              className="w-full bg-black/30 border border-white/5 rounded-xl py-2 px-3 text-white text-sm font-bold focus:outline-none focus:border-primary/50"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Número Total de Plantas</label>
            <input
              type="number"
              value={plantsCount}
              onChange={(e) => {
                const val = parseInt(e.target.value) || 0;
                setPlantsCount(val);
                saveFarmParameters({ plantsCount: val });
              }}
              className="w-full bg-black/30 border border-white/5 rounded-xl py-2 px-3 text-white text-sm font-bold focus:outline-none focus:border-primary/50"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Preço da Caixa Estimado (R$)</label>
            <input
              type="number"
              value={targetBoxPrice}
              onChange={(e) => {
                const val = parseFloat(e.target.value) || 0;
                setTargetBoxPrice(val);
                saveFarmParameters({ targetBoxPrice: val });
              }}
              className="w-full bg-black/30 border border-white/5 rounded-xl py-2 px-3 text-white text-sm font-bold focus:outline-none focus:border-primary/50"
            />
          </div>
        </div>

        {/* Balance Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="glass-card p-8 rounded-[2.5rem] border-white/5 bg-zinc-900/30">
            <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest mb-4">Total de Receitas</p>
            <h3 className="text-4xl font-display font-bold text-emerald-400">
              {formatCurrency(totalReceitas)}
            </h3>
            <p className="text-xs text-zinc-500 mt-4 leading-relaxed">Vendas diretas de cachos e caixas de banana.</p>
          </div>

          <div className="glass-card p-8 rounded-[2.5rem] border-white/5 bg-zinc-900/30">
            <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest mb-4">Custos Operacionais</p>
            <h3 className="text-4xl font-display font-bold text-red-400">
              {formatCurrency(totalDespesas)}
            </h3>
            <p className="text-xs text-zinc-500 mt-4 leading-relaxed">Insumos, mão de obra, diesel e manutenção.</p>
          </div>

          <div className="glass-card p-8 rounded-[2.5rem] border-white/5 bg-primary/5 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:scale-110 transition-transform text-white">
              <Wallet size={80} />
            </div>
            <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-4">Lucro Líquido</p>
            <h3 className={`text-4xl font-display font-bold ${lucroEstimado >= 0 ? "text-primary" : "text-red-400"}`}>
              {formatCurrency(lucroEstimado)}
            </h3>
            <div className="mt-4 flex gap-4">
              <span className="text-xs text-slate-400 font-bold bg-white/5 px-3 py-1 rounded-full border border-white/5">Saldo Fazenda</span>
            </div>
          </div>
        </div>

        {/* Agro Indicators */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="glass-card p-6 rounded-3xl border-white/5 bg-zinc-900/20 text-center">
            <p className="text-zinc-500 text-xs uppercase tracking-widest font-black mb-2">Custo Operacional por Hectare</p>
            <p className="text-2xl font-bold text-white">{formatCurrency(custoPorHectare)} <span className="text-xs text-zinc-500">/ ha</span></p>
          </div>
          <div className="glass-card p-6 rounded-3xl border-white/5 bg-zinc-900/20 text-center">
            <p className="text-zinc-500 text-xs uppercase tracking-widest font-black mb-2">Custo Operacional por Planta</p>
            <p className="text-2xl font-bold text-white">{formatCurrency(custoPorPlanta)} <span className="text-xs text-zinc-500">/ planta</span></p>
          </div>
          <div className="glass-card p-6 rounded-3xl border-white/5 bg-zinc-900/20 text-center flex flex-col justify-center items-center">
            <p className="text-zinc-500 text-xs uppercase tracking-widest font-black mb-2 flex items-center gap-1.5 justify-center">
              <Calculator size={14} className="text-primary" /> Ponto de Equilíbrio (Break-Even)
            </p>
            <p className="text-2xl font-bold text-yellow-500">{breakEvenBoxes} <span className="text-xs text-zinc-500">caixas necessárias</span></p>
          </div>
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
                        <td className="px-8 py-6 text-slate-300 font-semibold">{tx.category}</td>
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
    </Layout>
  );
}
