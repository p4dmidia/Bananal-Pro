import React, { useState, useEffect } from "react";
import Layout from "../../components/Layout/Layout";
import { motion, AnimatePresence } from "motion/react";
import { 
  Package, 
  Plus, 
  Minus, 
  AlertCircle, 
  Calendar, 
  Layers, 
  Search, 
  PlusCircle, 
  CheckCircle2, 
  Trash2,
  Tag,
  Loader2,
  Pencil
} from "lucide-react";
import { toast } from "react-hot-toast";
import { useAuth } from "../../contexts/AuthContext";
import { supabase } from "../../lib/supabase";

interface InventoryItem {
  id: string;
  name: string;
  category: "Fertilizantes" | "Defensivos" | "Embalagens" | "Outros";
  quantity: number;
  unit: string;
  minQuantity: number;
  expiryDate: string | null;
  supplier: string;
}

export default function Inventory() {
  const { profile } = useAuth();
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loadingItems, setLoadingItems] = useState(false);
  const [saving, setSaving] = useState(false);

  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [editName, setEditName] = useState("");
  const [editCategory, setEditCategory] = useState<"Fertilizantes" | "Defensivos" | "Embalagens" | "Outros">("Fertilizantes");
  const [editQuantity, setEditQuantity] = useState(0);
  const [editUnit, setEditUnit] = useState("kg");
  const [editMinQuantity, setEditMinQuantity] = useState(0);
  const [editExpiryDate, setEditExpiryDate] = useState("");
  const [editSupplier, setEditSupplier] = useState("");

  const startEditItem = (item: InventoryItem) => {
    setEditingItem(item);
    setEditName(item.name);
    setEditCategory(item.category);
    setEditQuantity(item.quantity);
    setEditUnit(item.unit);
    setEditMinQuantity(item.minQuantity);
    setEditExpiryDate(item.expiryDate || "");
    setEditSupplier(item.supplier);
  };

  const handleEditItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;
    if (!editName.trim()) {
      toast.error("Por favor, digite o nome do insumo.");
      return;
    }
    
    setSaving(true);
    try {
      const { error } = await (supabase as any)
        .from('farm_inventory')
        .update({
          name: editName,
          category: editCategory,
          quantity: editQuantity,
          unit: editUnit,
          min_quantity: editMinQuantity,
          expiry_date: editExpiryDate ? editExpiryDate : null,
          supplier: editSupplier || "Não informado"
        })
        .eq('id', Number(editingItem.id));

      if (error) throw error;

      toast.success("Insumo atualizado com sucesso!");
      setEditingItem(null);
      fetchInventoryItems();
    } catch (err) {
      console.error('Error editing inventory item:', err);
      toast.error('Erro ao atualizar insumo no Supabase.');
    } finally {
      setSaving(false);
    }
  };

  const fetchInventoryItems = async () => {
    if (!profile?.id) return;
    setLoadingItems(true);
    try {
      const { data, error } = await (supabase as any)
        .from('farm_inventory')
        .select('*')
        .eq('user_id', profile.id)
        .order('name', { ascending: true });

      if (error) throw error;

      const mapped: InventoryItem[] = (data || []).map((t) => ({
        id: String(t.id),
        name: t.name,
        category: t.category as any,
        quantity: Number(t.quantity),
        unit: t.unit,
        minQuantity: Number(t.min_quantity),
        expiryDate: t.expiry_date,
        supplier: t.supplier
      }));
      setItems(mapped);
    } catch (err) {
      console.error('Error fetching inventory:', err);
      toast.error('Erro ao buscar estoque de insumos.');
    } finally {
      setLoadingItems(false);
    }
  };

  useEffect(() => {
    if (profile?.id) {
      fetchInventoryItems();
    }
  }, [profile]);

  // Form states
  const [name, setName] = useState("");
  const [category, setCategory] = useState<"Fertilizantes" | "Defensivos" | "Embalagens" | "Outros">("Fertilizantes");
  const [quantity, setQuantity] = useState(0);
  const [unit, setUnit] = useState("kg");
  const [minQuantity, setMinQuantity] = useState(0);
  const [expiryDate, setExpiryDate] = useState("");
  const [supplier, setSupplier] = useState("");

  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState<string>("Todos");

  const [adjustingItemId, setAdjustingItemId] = useState<string | null>(null);
  const [adjustAmount, setAdjustAmount] = useState<number>(0);
  const [adjustType, setAdjustType] = useState<"in" | "out">("in");

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Por favor, digite o nome do insumo.");
      return;
    }
    if (!profile?.id) {
      toast.error("Usuário não identificado.");
      return;
    }

    setSaving(true);
    try {
      const { error } = await (supabase as any)
        .from('farm_inventory')
        .insert([{
          user_id: profile.id,
          name,
          category,
          quantity,
          unit,
          min_quantity: minQuantity,
          expiry_date: expiryDate ? expiryDate : null,
          supplier: supplier || "Não informado"
        }]);

      if (error) throw error;

      toast.success("Insumo cadastrado com sucesso!");
      setName("");
      setQuantity(0);
      setMinQuantity(0);
      setExpiryDate("");
      setSupplier("");
      fetchInventoryItems();
    } catch (err) {
      console.error('Error adding inventory item:', err);
      toast.error('Erro ao cadastrar insumo no Supabase.');
    } finally {
      setSaving(false);
    }
  };

  const handleQuantityAdjust = async (id: string) => {
    if (adjustAmount <= 0) {
      toast.error("Por favor, digite uma quantidade válida.");
      return;
    }

    const item = items.find(i => i.id === id);
    if (!item) return;

    const factor = adjustType === "in" ? 1 : -1;
    const newQty = Math.max(0, item.quantity + (adjustAmount * factor));

    try {
      const { error } = await (supabase as any)
        .from('farm_inventory')
        .update({ quantity: newQty })
        .eq('id', Number(id));

      if (error) throw error;

      toast.success("Estoque ajustado com sucesso!");
      setAdjustingItemId(null);
      setAdjustAmount(0);
      fetchInventoryItems();
    } catch (err) {
      console.error('Error adjusting inventory quantity:', err);
      toast.error('Erro ao ajustar quantidade no Supabase.');
    }
  };

  const handleDeleteItem = async (id: string) => {
    if (!confirm("Deseja mesmo remover este insumo do estoque?")) return;
    try {
      const { error } = await (supabase as any)
        .from('farm_inventory')
        .delete()
        .eq('id', Number(id));

      if (error) throw error;

      toast.success("Insumo removido.");
      fetchInventoryItems();
    } catch (err) {
      console.error('Error deleting inventory item:', err);
      toast.error('Erro ao deletar insumo do Supabase.');
    }
  };

  // Filtered items
  const filteredItems = items.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          item.supplier.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = filterCategory === "Todos" || item.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  // Expiry date checks
  const isNearExpiry = (dateStr: string | null) => {
    if (!dateStr) return false;
    const expiry = new Date(dateStr);
    const today = new Date();
    const diffTime = expiry.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 && diffDays <= 30; // 30 dias para vencer
  };

  const isExpired = (dateStr: string | null) => {
    if (!dateStr) return false;
    const expiry = new Date(dateStr);
    const today = new Date();
    return expiry.getTime() < today.getTime();
  };

  return (
    <Layout>
      <div className="max-w-7xl mx-auto space-y-10 pb-20">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-4xl font-display font-bold text-white mb-2 flex items-center gap-3">
              <Package className="text-primary w-10 h-10" />
              Estoque de Insumos
            </h1>
            <p className="text-slate-400 text-lg">
              Controle de defensivos, fertilizantes, sacos e embalagens para a lavoura.
            </p>
          </div>
        </div>

        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="glass-card p-6 rounded-3xl border-white/5 bg-zinc-900/20 text-center">
            <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest mb-1">Total de Itens</p>
            <p className="text-3xl font-bold text-white">{items.length}</p>
          </div>
          <div className="glass-card p-6 rounded-3xl border-white/5 bg-zinc-900/20 text-center relative overflow-hidden">
            {items.some(i => i.quantity < i.minQuantity) && <div className="absolute inset-0 bg-red-500/5 animate-pulse" />}
            <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest mb-1">Estoque Crítico</p>
            <p className={`text-3xl font-bold ${items.some(i => i.quantity < i.minQuantity) ? "text-red-400" : "text-white"}`}>
              {items.filter(i => i.quantity < i.minQuantity).length}
            </p>
          </div>
          <div className="glass-card p-6 rounded-3xl border-white/5 bg-zinc-900/20 text-center">
            <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest mb-1">Próximos do Vencimento</p>
            <p className={`text-3xl font-bold ${items.some(i => isNearExpiry(i.expiryDate)) ? "text-yellow-500" : "text-white"}`}>
              {items.filter(i => isNearExpiry(i.expiryDate)).length}
            </p>
          </div>
          <div className="glass-card p-6 rounded-3xl border-white/5 bg-zinc-900/20 text-center">
            <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest mb-1">Itens Vencidos</p>
            <p className={`text-3xl font-bold ${items.some(i => isExpired(i.expiryDate)) ? "text-red-500" : "text-white"}`}>
              {items.filter(i => isExpired(i.expiryDate)).length}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* List and Filters Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Search & Filters */}
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 group-focus-within:text-primary transition-colors" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Buscar insumos..."
                  className="w-full bg-zinc-900/50 border border-white/5 rounded-2xl py-3.5 pl-11 pr-4 text-white focus:outline-none focus:ring-1 focus:ring-primary/50 transition-all font-bold placeholder:text-zinc-700 shadow-md text-sm"
                />
              </div>

              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="bg-zinc-900/50 border border-white/5 rounded-2xl px-4 py-3.5 text-zinc-400 font-bold focus:outline-none transition-all shadow-md text-sm cursor-pointer"
              >
                <option value="Todos">Todas as Categorias</option>
                <option value="Fertilizantes">Fertilizantes</option>
                <option value="Defensivos">Defensivos</option>
                <option value="Embalagens">Embalagens</option>
                <option value="Outros">Outros</option>
              </select>
            </div>

            {/* Inventory List */}
            <div className="space-y-4">
              {filteredItems.map((item) => {
                const isCritical = item.quantity < item.minQuantity;
                const isItemExpired = isExpired(item.expiryDate);
                const isItemNearExpiry = isNearExpiry(item.expiryDate);

                return (
                  <div
                    key={item.id}
                    className="glass-card p-6 rounded-3xl border-white/5 bg-zinc-900/40 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:border-primary/20 transition-all relative group"
                  >
                    <div className="flex items-start gap-4">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                        item.category === "Fertilizantes" ? "bg-emerald-500/10 text-emerald-400" :
                        item.category === "Defensivos" ? "bg-yellow-500/10 text-yellow-500" :
                        item.category === "Embalagens" ? "bg-blue-500/10 text-blue-400" : "bg-zinc-500/10 text-zinc-400"
                      }`}>
                        <Package size={22} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-bold text-white text-base">{item.name}</h3>
                          <span className="text-[9px] font-black uppercase bg-white/5 border border-white/10 px-2 py-0.5 rounded text-zinc-400 tracking-wider">
                            {item.category}
                          </span>
                        </div>
                        <p className="text-xs text-zinc-500 mt-1">Fornecedor: {item.supplier}</p>
                        
                        {/* Warnings */}
                        <div className="flex gap-2 flex-wrap mt-2">
                          {isCritical && (
                            <span className="text-[9px] font-black bg-red-500/10 border border-red-500/20 text-red-400 px-2 py-0.5 rounded flex items-center gap-1">
                              <AlertCircle size={10} /> ESTOQUE BAIXO
                            </span>
                          )}
                          {isItemExpired && (
                            <span className="text-[9px] font-black bg-red-500/10 border border-red-500/20 text-red-400 px-2 py-0.5 rounded flex items-center gap-1">
                              <Calendar size={10} /> PRODUTO VENCIDO
                            </span>
                          )}
                          {isItemNearExpiry && (
                            <span className="text-[9px] font-black bg-yellow-500/10 border border-yellow-500/20 text-yellow-500 px-2 py-0.5 rounded flex items-center gap-1">
                              <Calendar size={10} /> PRÓXIMO DO VENCIMENTO
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between md:justify-end gap-6 border-t md:border-t-0 border-white/5 pt-4 md:pt-0">
                      {/* Quantity display */}
                      <div className="text-left md:text-right">
                        <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-black">Em Estoque</p>
                        <p className={`text-2xl font-black ${isCritical ? "text-red-400 animate-pulse" : "text-white"}`}>
                          {item.quantity.toLocaleString()} <span className="text-xs font-semibold text-zinc-400">{item.unit}</span>
                        </p>
                        <p className="text-[9px] text-zinc-500 mt-0.5">Mínimo: {item.minQuantity} {item.unit}</p>
                      </div>

                      {/* Quick Adjust Buttons */}
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setAdjustingItemId(item.id);
                            setAdjustType("in");
                          }}
                          className="w-10 h-10 rounded-xl bg-white/5 hover:bg-primary hover:text-white text-zinc-400 flex items-center justify-center transition-all cursor-pointer"
                        >
                          <Plus size={16} />
                        </button>
                        <button
                          onClick={() => {
                            setAdjustingItemId(item.id);
                            setAdjustType("out");
                          }}
                          className="w-10 h-10 rounded-xl bg-white/5 hover:bg-red-500 hover:text-white text-zinc-400 flex items-center justify-center transition-all cursor-pointer"
                        >
                          <Minus size={16} />
                        </button>
                        <button
                          onClick={() => startEditItem(item)}
                          className="w-10 h-10 rounded-xl bg-white/5 hover:bg-primary/10 text-zinc-600 hover:text-primary flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all cursor-pointer"
                          title="Editar Insumo"
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          onClick={() => handleDeleteItem(item.id)}
                          className="w-10 h-10 rounded-xl bg-white/5 hover:bg-red-500/10 text-zinc-600 hover:text-red-400 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all cursor-pointer"
                          title="Excluir Insumo"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}

              {loadingItems && (
                <div className="flex flex-col items-center justify-center py-20 bg-zinc-900/10 rounded-[2.5rem] border border-dashed border-white/5 text-slate-500 gap-2">
                  <Loader2 className="w-6 h-6 text-primary animate-spin" />
                  <span className="text-xs font-bold uppercase tracking-widest text-zinc-600">Carregando estoque...</span>
                </div>
              )}

              {!loadingItems && filteredItems.length === 0 && (
                <div className="text-center py-20 bg-zinc-900/10 rounded-[2.5rem] border border-dashed border-white/5 text-zinc-500">
                  Nenhum insumo encontrado.
                </div>
              )}
            </div>
          </div>

          {/* Form Column */}
          <div className="space-y-6">
            <div className="glass-card p-6 rounded-[2.5rem] border-white/5 bg-zinc-900/40">
              <div className="flex items-center gap-2.5 mb-6">
                <PlusCircle className="text-primary w-5 h-5" />
                <h3 className="text-lg font-bold text-white">Cadastrar Insumo</h3>
              </div>

              <form onSubmit={handleAddItem} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">Nome do Insumo</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ex: Superfosfato Simples"
                    className="w-full bg-black/40 border border-white/10 rounded-2xl py-3 px-4 text-white text-sm focus:outline-none focus:border-primary/50"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-300">Categoria</label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value as any)}
                      className="w-full bg-zinc-900 border border-white/10 rounded-2xl py-3 px-4 text-white text-sm focus:outline-none focus:border-primary/50 h-[46px] cursor-pointer"
                    >
                      <option value="Fertilizantes">Fertilizantes</option>
                      <option value="Defensivos">Defensivos</option>
                      <option value="Embalagens">Embalagens</option>
                      <option value="Outros">Outros</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-300">Unidade</label>
                    <select
                      value={unit}
                      onChange={(e) => setUnit(e.target.value)}
                      className="w-full bg-zinc-900 border border-white/10 rounded-2xl py-3 px-4 text-white text-sm focus:outline-none focus:border-primary/50 h-[46px] cursor-pointer"
                    >
                      <option value="kg">kg (Quilo)</option>
                      <option value="L">L (Litro)</option>
                      <option value="un">un (Unidades)</option>
                      <option value="ton">ton (Toneladas)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-300">Qtd. Inicial</label>
                    <input
                      type="number"
                      required
                      min="0"
                      value={quantity}
                      onChange={(e) => setQuantity(parseFloat(e.target.value) || 0)}
                      className="w-full bg-black/40 border border-white/10 rounded-2xl py-3 px-4 text-white text-sm focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-300">Qtd. Mínima</label>
                    <input
                      type="number"
                      required
                      min="0"
                      value={minQuantity}
                      onChange={(e) => setMinQuantity(parseFloat(e.target.value) || 0)}
                      className="w-full bg-black/40 border border-white/10 rounded-2xl py-3 px-4 text-white text-sm focus:outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">Data de Validade (Opcional)</label>
                  <input
                    type="date"
                    value={expiryDate}
                    onChange={(e) => setExpiryDate(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 rounded-2xl py-3 px-4 text-white text-sm focus:outline-none focus:border-primary/50"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">Fornecedor</label>
                  <input
                    type="text"
                    value={supplier}
                    onChange={(e) => setSupplier(e.target.value)}
                    placeholder="Nome da distribuidora"
                    className="w-full bg-black/40 border border-white/10 rounded-2xl py-3 px-4 text-white text-sm focus:outline-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={saving}
                  className="w-full bg-primary hover:bg-primary-dark text-white font-bold py-3.5 rounded-2xl transition-all cursor-pointer text-sm flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    "Adicionar ao Estoque"
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>

      {/* ADJUST QUANTITY DIALOG */}
      <AnimatePresence>
        {adjustingItemId !== null && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setAdjustingItemId(null)}
              className="fixed inset-0 bg-black/80 backdrop-blur-md"
            />

            <motion.div
              initial={{ scale: 0.95, y: 20, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.95, y: 20, opacity: 0 }}
              className="bg-zinc-950 border border-white/10 rounded-[2.5rem] w-full max-w-sm p-8 relative z-10 overflow-hidden shadow-2xl"
            >
              <h3 className="text-xl font-bold text-white mb-2">
                {adjustType === "in" ? "Registrar Entrada" : "Registrar Saída"}
              </h3>
              <p className="text-xs text-zinc-400 mb-6">
                {adjustType === "in" 
                  ? "Adicionar novas quantidades compradas ou recebidas ao estoque." 
                  : "Lançar quantidades aplicadas ou removidas do estoque."
                }
              </p>

              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">Quantidade</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={adjustAmount === 0 ? "" : adjustAmount}
                    onChange={(e) => setAdjustAmount(parseFloat(e.target.value) || 0)}
                    placeholder="Digite a quantidade..."
                    className="w-full bg-black/40 border border-white/10 rounded-2xl py-3.5 px-4 text-white text-sm focus:outline-none focus:border-primary/50 text-center font-bold text-lg"
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => handleQuantityAdjust(adjustingItemId)}
                    className="flex-1 bg-primary hover:bg-primary-dark text-white font-bold py-3.5 rounded-2xl transition-all cursor-pointer text-sm shadow-md"
                  >
                    Confirmar
                  </button>
                  <button
                    onClick={() => setAdjustingItemId(null)}
                    className="px-5 border border-white/10 hover:bg-white/5 text-zinc-400 hover:text-white font-bold rounded-2xl transition-colors cursor-pointer text-sm"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* EDIT INVENTORY ITEM DIALOG */}
      <AnimatePresence>
        {editingItem !== null && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setEditingItem(null)}
              className="fixed inset-0 bg-black/80 backdrop-blur-md"
            />

            <motion.div
              initial={{ scale: 0.95, y: 20, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.95, y: 20, opacity: 0 }}
              className="bg-zinc-950 border border-white/10 rounded-[2.5rem] w-full max-w-md p-8 relative z-10 overflow-hidden shadow-2xl"
            >
              <h3 className="text-xl font-bold text-white mb-2">Editar Insumo</h3>
              <p className="text-xs text-zinc-400 mb-6">
                Atualize as informações do insumo selecionado.
              </p>

              <form onSubmit={handleEditItem} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">Nome do Insumo</label>
                  <input
                    type="text"
                    required
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    placeholder="Ex: Superfosfato Simples"
                    className="w-full bg-black/40 border border-white/10 rounded-2xl py-3 px-4 text-white text-sm focus:outline-none focus:border-primary/50"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-300">Categoria</label>
                    <select
                      value={editCategory}
                      onChange={(e) => setEditCategory(e.target.value as any)}
                      className="w-full bg-zinc-900 border border-white/10 rounded-2xl py-3 px-4 text-white text-sm focus:outline-none focus:border-primary/50 h-[46px] cursor-pointer"
                    >
                      <option value="Fertilizantes">Fertilizantes</option>
                      <option value="Defensivos">Defensivos</option>
                      <option value="Embalagens">Embalagens</option>
                      <option value="Outros">Outros</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-300">Unidade</label>
                    <select
                      value={editUnit}
                      onChange={(e) => setEditUnit(e.target.value)}
                      className="w-full bg-zinc-900 border border-white/10 rounded-2xl py-3 px-4 text-white text-sm focus:outline-none focus:border-primary/50 h-[46px] cursor-pointer"
                    >
                      <option value="kg">kg (Quilo)</option>
                      <option value="L">L (Litro)</option>
                      <option value="un">un (Unidades)</option>
                      <option value="ton">ton (Toneladas)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-300">Quantidade</label>
                    <input
                      type="number"
                      required
                      min="0"
                      value={editQuantity}
                      onChange={(e) => setEditQuantity(parseFloat(e.target.value) || 0)}
                      className="w-full bg-black/40 border border-white/10 rounded-2xl py-3 px-4 text-white text-sm focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-300">Qtd. Mínima</label>
                    <input
                      type="number"
                      required
                      min="0"
                      value={editMinQuantity}
                      onChange={(e) => setEditMinQuantity(parseFloat(e.target.value) || 0)}
                      className="w-full bg-black/40 border border-white/10 rounded-2xl py-3 px-4 text-white text-sm focus:outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">Data de Validade (Opcional)</label>
                  <input
                    type="date"
                    value={editExpiryDate}
                    onChange={(e) => setEditExpiryDate(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 rounded-2xl py-3 px-4 text-white text-sm focus:outline-none focus:border-primary/50"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">Fornecedor</label>
                  <input
                    type="text"
                    value={editSupplier}
                    onChange={(e) => setEditSupplier(e.target.value)}
                    placeholder="Nome da distribuidora"
                    className="w-full bg-black/40 border border-white/10 rounded-2xl py-3 px-4 text-white text-sm focus:outline-none"
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex-1 bg-primary hover:bg-primary-dark text-white font-bold py-3.5 rounded-2xl transition-all cursor-pointer text-sm shadow-md flex items-center justify-center gap-2"
                  >
                    {saving ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Salvando...
                      </>
                    ) : (
                      "Salvar Alterações"
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingItem(null)}
                    className="px-5 border border-white/10 hover:bg-white/5 text-zinc-400 hover:text-white font-bold rounded-2xl transition-colors cursor-pointer text-sm"
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </Layout>
  );
}
