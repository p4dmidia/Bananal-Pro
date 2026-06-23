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
  Pencil,
  Sparkles,
  X,
  Zap
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
  const { user, profile } = useAuth();
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loadingItems, setLoadingItems] = useState(false);
  const [saving, setSaving] = useState(false);

  // Estados para Organização do Estoque com IA
  const [showStockAiModal, setShowStockAiModal] = useState(false);
  const [stockAiDiagnosis, setStockAiDiagnosis] = useState<string | null>(null);
  const [analyzingStock, setAnalyzingStock] = useState(false);
  const [analysisStockStep, setAnalysisStockStep] = useState(0);

  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [editName, setEditName] = useState("");
  const [editCategory, setEditCategory] = useState<"Fertilizantes" | "Defensivos" | "Embalagens" | "Outros">("Fertilizantes");
  const [editQuantity, setEditQuantity] = useState(0);
  const [editUnit, setEditUnit] = useState("kg");
  const [editMinQuantity, setEditMinQuantity] = useState(0);
  const [editExpiryDate, setEditExpiryDate] = useState("");
  const [editSupplier, setEditSupplier] = useState("");

  const [isNpk, setIsNpk] = useState(false);
  const [npkN, setNpkN] = useState("");
  const [npkP, setNpkP] = useState("");
  const [npkK, setNpkK] = useState("");

  const [editIsNpk, setEditIsNpk] = useState(false);
  const [editNpkN, setEditNpkN] = useState("");
  const [editNpkP, setEditNpkP] = useState("");
  const [editNpkK, setEditNpkK] = useState("");

  const startEditItem = (item: InventoryItem) => {
    setEditingItem(item);
    setEditCategory(item.category);
    setEditQuantity(item.quantity);
    setEditUnit(item.unit);
    setEditMinQuantity(item.minQuantity);
    setEditExpiryDate(item.expiryDate || "");
    setEditSupplier(item.supplier);

    const npkMatch = item.name.match(/(.+)\s*\(NPK\s*(\d+)-(\d+)-(\d+)\)/i);
    if (npkMatch) {
      setEditName(npkMatch[1].trim());
      setEditIsNpk(true);
      setEditNpkN(npkMatch[2]);
      setEditNpkP(npkMatch[3]);
      setEditNpkK(npkMatch[4]);
    } else {
      setEditName(item.name);
      setEditIsNpk(false);
      setEditNpkN("");
      setEditNpkP("");
      setEditNpkK("");
    }
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
      const finalName = editIsNpk && editNpkN && editNpkP && editNpkK 
        ? `${editName.trim()} (NPK ${editNpkN}-${editNpkP}-${editNpkK})`
        : editName.trim();

      const { error } = await (supabase as any)
        .from('farm_inventory')
        .update({
          name: finalName,
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

      // Check and generate expiry notifications in user_notifications table in Supabase
      if (user?.id && mapped.length > 0) {
        const expiringItems = mapped.filter(i => isExpired(i.expiryDate) || isNearExpiry(i.expiryDate));
        if (expiringItems.length > 0) {
          try {
            const { data: existingNotifs } = await (supabase as any)
              .from('user_notifications')
              .select('title')
              .eq('user_id', user.id)
              .like('title', 'Alerta de Vencimento:%');

            const existingTitles = new Set((existingNotifs || []).map((n: any) => n.title));

            for (const item of expiringItems) {
              const typeStr = isExpired(item.expiryDate) ? 'vencido' : 'proximo ao vencimento';
              const dateStr = item.expiryDate ? new Date(item.expiryDate + "T12:00:00").toLocaleDateString('pt-BR') : '';
              const title = `Alerta de Vencimento: ${item.name}`;
              const message = `O produto ${item.name} esta ${typeStr}. Data de validade: ${dateStr || 'Nao informada'}. Verifique seu estoque!`;

              if (!existingTitles.has(title)) {
                await (supabase as any)
                  .from('user_notifications')
                  .insert([{
                    user_id: user.id,
                    title,
                    message,
                    is_read: false
                  }]);
              }
            }
          } catch (notifErr) {
            console.warn("Aviso: Falha ao sincronizar alertas de vencimento com o Supabase:", notifErr);
          }
        }
      }
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

  // Simular a Análise Inteligente de Estoque
  const handleRunStockAi = async () => {
    setAnalyzingStock(true);
    setAnalysisStockStep(0);

    const stepsText = [
      "Catalogando tipos de insumos...",
      "Cruzando fórmulas de fertilizantes NPK e corretivos...",
      "Avaliando destinação agronômica dos defensivos...",
      "Buscando redundâncias de finalidade e alertas de validades...",
      "Gerando guia inteligente de aproveitamento de insumos..."
    ];

    for (let i = 0; i < stepsText.length; i++) {
      setAnalysisStockStep(i);
      await new Promise(resolve => setTimeout(resolve, 800));
    }

    try {
      const diagnosisText = generateStockDiagnosis(items);
      setStockAiDiagnosis(diagnosisText);
      toast.success("Otimização de estoque concluída com sucesso!");
    } catch (err) {
      console.error(err);
      toast.error("Erro ao gerar otimização do estoque.");
    } finally {
      setAnalyzingStock(false);
    }
  };

  const generateStockDiagnosis = (stockItems: InventoryItem[]): string => {
    if (stockItems.length === 0) {
      return `### 📦 SEU ESTOQUE ESTÁ VAZIO

Cadastre insumos no estoque para receber uma análise detalhada sobre como utilizá-los e evitar compras redundantes.`;
    }

    const fertilizers = stockItems.filter(i => i.category === "Fertilizantes");
    const defensives = stockItems.filter(i => i.category === "Defensivos");
    const packaging = stockItems.filter(i => i.category === "Embalagens");
    const others = stockItems.filter(i => i.category === "Outros");

    let report = `### 💡 RELATÓRIO DE ORGANIZAÇÃO E OTIMIZAÇÃO DE ESTOQUE

Analisamos os **${stockItems.length} insumos** cadastrados no seu estoque. Abaixo está a organização de utilidade técnica e orientações para otimizar suas finanças.

---

`;

    if (fertilizers.length > 0) {
      report += `### 🌱 GRUPO 1: NUTRIÇÃO E FERTILIZANTES
*Abaixo está a finalidade e o manejo correto dos adubos em estoque:*

`;
      fertilizers.forEach(f => {
        const nameLower = f.name.toLowerCase();
        let utility = "Fornecimento de nutrientes essenciais para crescimento vegetativo e produção.";
        let howToUse = "Aplicar de acordo com a análise de solo, distribuindo na projeção da copa (círculo sob as folhas).";

        if (nameLower.includes("npk")) {
          utility = "Adubo mineral misto contendo Nitrogênio (crescimento de folhas), Fósforo (enraizamento e força) e Potássio (peso e enchimento dos frutos).";
          howToUse = "Ideal para adubações de cobertura parceladas ao longo do ciclo úmido. Evite aplicar colado ao pseudocaule.";
        } else if (nameLower.includes("ureia") || nameLower.includes("uréia") || nameLower.includes("nitrogênio") || nameLower.includes("nitrogenio")) {
          utility = "Fonte concentrada de Nitrogênio (N). Essencial para a velocidade de crescimento e emissão de folhas novas.";
          howToUse = "Aplicar sob solo úmido e incorporar imediatamente ou irrigar após a aplicação para evitar perdas por volatilização.";
        } else if (nameLower.includes("superfosfato") || nameLower.includes("fósforo") || nameLower.includes("fosforo") || nameLower.includes("yoring") || nameLower.includes("ss")) {
          utility = "Fonte rica em Fósforo (P) e Cálcio. Crucial para o desenvolvimento de raízes fortes no plantio e refiliação.";
          howToUse = "Aplicar de forma localizada no fundo da cova de plantio ou na abertura de sulcos.";
        } else if (nameLower.includes("potássio") || nameLower.includes("cloreto") || nameLower.includes("kcl") || nameLower.includes("sulfato")) {
          utility = "Fonte concentrada de Potássio (K). Nutriente mais extraído pela bananeira, responsável pelo calibre e peso do cacho.";
          howToUse = "Dividir a aplicação em várias parcelas durante o crescimento do cacho.";
        } else if (nameLower.includes("calcário") || nameLower.includes("gesso") || nameLower.includes("calcio") || nameLower.includes("magnésio")) {
          utility = "Corretivo de acidez do solo e fornecedor de Cálcio (Ca) e Magnésio (Mg).";
          howToUse = "Distribuir a lanço em toda a área de cultivo antes do período chuvoso.";
        } else if (nameLower.includes("esterco") || nameLower.includes("orgânico") || nameLower.includes("cama") || nameLower.includes("composto")) {
          utility = "Matéria orgânica rica. Melhora a estrutura do solo, retenção de água e biologia das raízes.";
          howToUse = "Adicionar na cova de plantio misturado à terra ou distribuir como cobertura morta.";
        }

        report += `*   **${f.name}** (${f.quantity} ${f.unit} em estoque)
    *   *Para que serve*: ${utility}
    *   *Como usar*: ${howToUse}
`;
      });
      report += `\n`;
    }

    if (defensives.length > 0) {
      report += `### 🛡️ GRUPO 2: PROTEÇÃO FITOSSANITÁRIA (DEFENSIVOS)
*Finalidades e recomendações de segurança:*

`;
      defensives.forEach(d => {
        const nameLower = d.name.toLowerCase();
        let utility = "Controle de pragas, fungos ou invasoras no bananal.";
        let howToUse = "Aplicar com EPI completo, respeitando o período de carência e seguindo receituário agronômico.";

        if (nameLower.includes("óleo") || nameLower.includes("oleo") || nameLower.includes("adjuvante")) {
          utility = "Óleo mineral / Adjuvante. Melhora a aderência dos fungicidas e asfixia ácaros.";
          howToUse = "Misturar junto com o fungicida na calda, evitando horas de calor extremo.";
        } else if (nameLower.includes("fungicida") || nameLower.includes("mancozeb") || nameLower.includes("tebuconazol") || nameLower.includes("triazol") || nameLower.includes("estrobilurina")) {
          utility = "Controle de fungos foliares (Sigatoka Negra e Sigatoka Amarela).";
          howToUse = "Pulverizar nas folhas mais jovens nos períodos quentes e úmidos, rotacionando princípios ativos.";
        } else if (nameLower.includes("inseticida") || nameLower.includes("fipronil") || nameLower.includes("beauveria") || nameLower.includes("diflubenzuron")) {
          utility = "Controle de insetos pragas (Broca-do-Rizoma ou tripes).";
          howToUse = "Para broca, aplicar de forma localizada no colo ou nas iscas de pseudocaule.";
        } else if (nameLower.includes("herbicida") || nameLower.includes("glifosato") || nameLower.includes("mata")) {
          utility = "Controle de plantas invasoras que competem por água e adubo.";
          howToUse = "Aplicar de forma dirigida nas entrelinhas, evitando deriva para a bananeira.";
        }

        report += `*   **${d.name}** (${d.quantity} ${d.unit} em estoque)
    *   *Para que serve*: ${utility}
    *   *Como usar*: ${howToUse}
`;
      });
      report += `\n`;
    }

    if (packaging.length > 0) {
      report += `### 📦 GRUPO 3: EMBALAGENS E PROTEÇÃO DE FRUTOS
*Uso correto para manter a qualidade comercial:*

`;
      packaging.forEach(p => {
        const nameLower = p.name.toLowerCase();
        let utility = "Materiais para proteção, colheita e transporte da produção.";
        let howToUse = "Utilizar no momento adequado do enchimento dos frutos para evitar danos mecânicos.";

        if (nameLower.includes("saco") || nameLower.includes("ensacamento") || nameLower.includes("plástico")) {
          utility = "Sacos plásticos para cacho. Protege contra geadas, ventos, poeira e tripes.";
          howToUse = "Ensacar o cacho logo após a queda do coração.";
        } else if (nameLower.includes("caixa") || nameLower.includes("papelão") || nameLower.includes("madeira")) {
          utility = "Embalagens para transporte seguro e classificação comercial dos frutos.";
          howToUse = "Acomodar as pencas higienizadas com almofadas de proteção de polietileno.";
        }

        report += `*   **${p.name}** (${p.quantity} ${p.unit} em estoque)
    *   *Para que serve*: ${utility}
    *   *Como usar*: ${howToUse}
`;
      });
      report += `\n`;
    }

    if (others.length > 0) {
      report += `### 🛠️ OUTROS INSUMOS E FERRAMENTAS
*Classificação de materiais de apoio:*

`;
      others.forEach(o => {
        report += `*   **${o.name}** (${o.quantity} ${o.unit} em estoque)
    *   *Uso recomendado*: Material de apoio geral para manutenção da lavoura, escoramento ou ferramentas de corte.
`;
      });
      report += `\n`;
    }

    report += `---

### ⚠️ RECOMENDAÇÕES DE OTIMIZAÇÃO E COMPRA (ANTI-DESPERDÍCIO)

`;

    let redundancies = [];
    const nSources = fertilizers.filter(f => f.name.toLowerCase().match(/(ureia|uréia|nitrogênio|nitrogenio)/));
    if (nSources.length > 1) {
      redundancies.push(`*   **Fontes de Nitrogênio Duplicadas**: Você possui mais de uma fonte de nitrogênio em estoque (${nSources.map(s => s.name).join(", ")}). Evite comprar novos fertilizantes nitrogenados até utilizar estes saldos.`);
    }

    const pSources = fertilizers.filter(f => f.name.toLowerCase().match(/(superfosfato|fósforo|fosforo|yoring)/));
    if (pSources.length > 1) {
      redundancies.push(`*   **Fontes de Fósforo Duplicadas**: Detectamos duplicidade de fósforo (${pSources.map(s => s.name).join(", ")}). Use-os nas novas covas de plantio ou renovação de rebentos antes de adquirir mais adubo fosfatado.`);
    }

    const kSources = fertilizers.filter(f => f.name.toLowerCase().match(/(potássio|cloreto|kcl|sulfato)/));
    if (kSources.length > 1) {
      redundancies.push(`*   **Fontes de Potássio Duplicadas**: Você possui múltiplas fontes de Potássio (${kSources.map(s => s.name).join(", ")}). Recomenda-se esgotar os estoques atuais antes de planejar compras adicionais.`);
    }

    const expiredCount = stockItems.filter(i => isExpired(i.expiryDate)).length;
    const nearExpiryCount = stockItems.filter(i => isNearExpiry(i.expiryDate)).length;

    if (expiredCount > 0) {
      redundancies.push(`*   **Alerta de Desperdício (Itens Vencidos)**: Existem **${expiredCount} insumo(s) vencido(s)**. Produtos vencidos perdem a eficácia. Faça a destinação correta e não compre substitutos até planejar o uso real.`);
    }
    
    if (nearExpiryCount > 0) {
      redundancies.push(`*   **Aproveitamento Urgente (Próximos do Vencimento)**: Há **${nearExpiryCount} insumo(s)** prestes a vencer em 30 dias. Priorize o uso destes produtos no campo para evitar perda financeira total.`);
    }

    if (redundancies.length > 0) {
      report += redundancies.join("\n");
    } else {
      report += `*   ✅ **Estoque Equilibrado**: Não identificamos redundâncias óbvias de compras ou duplicidades de finalidade. Seu estoque está enxuto e bem dimensionado. Evite comprar novos insumos sem antes checar as quantidades mínimas de segurança.`;
    }

    return report;
  };

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
      const finalName = isNpk && npkN && npkP && npkK 
        ? `${name.trim()} (NPK ${npkN}-${npkP}-${npkK})`
        : name.trim();

      const { error } = await (supabase as any)
        .from('farm_inventory')
        .insert([{
          user_id: profile.id,
          name: finalName,
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
      setIsNpk(false);
      setNpkN("");
      setNpkP("");
      setNpkK("");
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
          
          <button
            onClick={() => {
              setStockAiDiagnosis(null);
              setShowStockAiModal(true);
            }}
            className="bg-emerald-500/10 border border-emerald-500/20 hover:bg-emerald-500/20 text-emerald-400 font-bold px-6 py-4 rounded-2xl flex items-center gap-2 cursor-pointer transition-all hover:scale-105 shadow-lg shadow-emerald-500/5 text-xs uppercase tracking-widest self-start md:self-center"
          >
            <Sparkles size={16} />
            Organizar Estoque com IA
          </button>
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

        {/* Expiry Warning Panel */}
        {(items.filter(i => isExpired(i.expiryDate) || isNearExpiry(i.expiryDate)).length > 0) && (
          <div className="p-6 rounded-[2.5rem] border border-red-500/20 bg-red-500/5 space-y-4">
            <h3 className="text-sm font-bold text-red-400 flex items-center gap-2">
              <AlertCircle size={16} /> Centro de Alertas de Validade
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {items.filter(i => isExpired(i.expiryDate) || isNearExpiry(i.expiryDate)).map(item => {
                const expired = isExpired(item.expiryDate);
                return (
                  <div key={item.id} className={`p-4 rounded-2xl flex items-center justify-between gap-4 border ${
                    expired ? "bg-red-500/10 border-red-500/20" : "bg-yellow-500/10 border-yellow-500/20"
                  }`}>
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                        expired ? "bg-red-500/20 text-red-400" : "bg-yellow-500/20 text-yellow-500"
                      }`}>
                        <Calendar size={14} />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-white">{item.name}</p>
                        <p className="text-[10px] text-zinc-500">
                          {expired ? "Expirou em:" : "Vence em:"} {item.expiryDate ? new Date(item.expiryDate + "T12:00:00").toLocaleDateString('pt-BR') : ''}
                        </p>
                      </div>
                    </div>
                    <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded ${
                      expired ? "bg-red-500/20 text-red-400" : "bg-yellow-500/20 text-yellow-500"
                    }`}>
                      {expired ? "Vencido" : "A vencer"}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

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

                const npkMatch = item.name.match(/(.+)\s*\(NPK\s*(\d+)-(\d+)-(\d+)\)/i);
                const displayName = npkMatch ? npkMatch[1].trim() : item.name;
                const npkFormula = npkMatch ? `${npkMatch[2]}-${npkMatch[3]}-${npkMatch[4]}` : null;

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
                          <h3 className="font-bold text-white text-base">{displayName}</h3>
                          {npkFormula && (
                            <span className="text-[9px] font-black bg-gradient-to-r from-emerald-500 to-teal-500 text-white px-2 py-0.5 rounded shadow shadow-emerald-500/25 tracking-wider font-bold">
                              NPK {npkFormula}
                            </span>
                          )}
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

                {category === "Fertilizantes" && (
                  <div className="p-4 bg-white/[0.02] border border-white/5 rounded-2xl space-y-3">
                    <label className="flex items-center gap-2 text-xs font-semibold text-slate-300 cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={isNpk} 
                        onChange={(e) => setIsNpk(e.target.checked)} 
                        className="rounded border-white/10 text-primary bg-black/40"
                      />
                      E adubo NPK?
                    </label>
                    
                    {isNpk && (
                      <div className="grid grid-cols-3 gap-2 pt-1">
                        <div className="space-y-1">
                          <label className="text-[10px] text-zinc-500 font-bold">N (%)</label>
                          <input 
                            type="number" 
                            required 
                            min="0"
                            max="100"
                            value={npkN} 
                            onChange={(e) => setNpkN(e.target.value)} 
                            placeholder="ex: 20"
                            className="w-full bg-black/40 border border-white/10 rounded-xl py-2 px-2 text-center text-xs text-white"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] text-zinc-500 font-bold">P (%)</label>
                          <input 
                            type="number" 
                            required 
                            min="0"
                            max="100"
                            value={npkP} 
                            onChange={(e) => setNpkP(e.target.value)} 
                            placeholder="ex: 05"
                            className="w-full bg-black/40 border border-white/10 rounded-xl py-2 px-2 text-center text-xs text-white"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] text-zinc-500 font-bold">K (%)</label>
                          <input 
                            type="number" 
                            required 
                            min="0"
                            max="100"
                            value={npkK} 
                            onChange={(e) => setNpkK(e.target.value)} 
                            placeholder="ex: 20"
                            className="w-full bg-black/40 border border-white/10 rounded-xl py-2 px-2 text-center text-xs text-white"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                )}

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

                {editCategory === "Fertilizantes" && (
                  <div className="p-4 bg-white/[0.02] border border-white/5 rounded-2xl space-y-3 text-left">
                    <label className="flex items-center gap-2 text-xs font-semibold text-slate-300 cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={editIsNpk} 
                        onChange={(e) => setEditIsNpk(e.target.checked)} 
                        className="rounded border-white/10 text-primary bg-black/40"
                      />
                      E adubo NPK?
                    </label>
                    
                    {editIsNpk && (
                      <div className="grid grid-cols-3 gap-2 pt-1">
                        <div className="space-y-1">
                          <label className="text-[10px] text-zinc-500 font-bold">N (%)</label>
                          <input 
                            type="number" 
                            required 
                            min="0"
                            max="100"
                            value={editNpkN} 
                            onChange={(e) => setEditNpkN(e.target.value)} 
                            placeholder="ex: 20"
                            className="w-full bg-black/40 border border-white/10 rounded-xl py-2 px-2 text-center text-xs text-white"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] text-zinc-500 font-bold">P (%)</label>
                          <input 
                            type="number" 
                            required 
                            min="0"
                            max="100"
                            value={editNpkP} 
                            onChange={(e) => setEditNpkP(e.target.value)} 
                            placeholder="ex: 05"
                            className="w-full bg-black/40 border border-white/10 rounded-xl py-2 px-2 text-center text-xs text-white"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] text-zinc-500 font-bold">K (%)</label>
                          <input 
                            type="number" 
                            required 
                            min="0"
                            max="100"
                            value={editNpkK} 
                            onChange={(e) => setEditNpkK(e.target.value)} 
                            placeholder="ex: 20"
                            className="w-full bg-black/40 border border-white/10 rounded-xl py-2 px-2 text-center text-xs text-white"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                )}

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

      {/* Modal: Organização e Otimização de Estoque com IA */}
      <AnimatePresence>
        {showStockAiModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                if (!analyzingStock) setShowStockAiModal(false);
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
                    Organização de Estoque com IA
                  </h2>
                  <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">
                    Assistente Agronômico Virtual
                  </span>
                </div>
                <button
                  onClick={() => {
                    if (!analyzingStock) setShowStockAiModal(false);
                  }}
                  className="p-2 hover:bg-white/5 rounded-full transition-colors cursor-pointer text-zinc-400 hover:text-white"
                >
                  <X size={20} />
                </button>
              </div>

              {analyzingStock ? (
                /* Scanning loader screen */
                <div className="flex-grow py-16 flex flex-col items-center justify-center space-y-6">
                  <div className="relative">
                    <div className="w-16 h-16 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
                    <div className="absolute inset-0 flex items-center justify-center text-primary">
                      <Sparkles size={20} className="animate-pulse" />
                    </div>
                  </div>
                  
                  <div className="text-center space-y-2 max-w-xs">
                    <h3 className="font-bold text-white text-sm animate-pulse">
                      {[
                        "Catalogando tipos de insumos...",
                        "Cruzando fórmulas de fertilizantes NPK e corretivos...",
                        "Avaliando destinação agronômica dos defensivos...",
                        "Buscando redundâncias de finalidade e alertas de validades...",
                        "Gerando guia inteligente de aproveitamento de insumos..."
                      ][analysisStockStep]}
                    </h3>
                    <p className="text-xs text-zinc-500">
                      Nossa inteligência artificial está analisando as quantidades e finalidades de cada insumo no seu estoque.
                    </p>
                  </div>
                </div>
              ) : stockAiDiagnosis ? (
                /* Diagnostic results screen */
                <div className="flex-grow flex flex-col min-h-0">
                  <div className="flex-grow overflow-y-auto pr-2 space-y-6 bg-black/30 p-6 rounded-3xl border border-white/5 mb-6">
                    {/* Rendered custom markdown */}
                    <div className="space-y-1 text-left">
                      {(() => {
                        const text = stockAiDiagnosis;
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
                      onClick={handleRunStockAi}
                      className="bg-white/5 border border-white/10 hover:bg-white/10 text-white font-bold text-xs uppercase tracking-wider py-3.5 px-6 rounded-2xl cursor-pointer flex items-center gap-2"
                    >
                      Refazer Análise
                    </button>
                    <button
                      onClick={() => setShowStockAiModal(false)}
                      className="flex-grow bg-primary hover:bg-primary-dark text-white font-bold text-xs uppercase tracking-wider py-3.5 px-6 rounded-2xl cursor-pointer text-center"
                    >
                      Fechar
                    </button>
                  </div>
                </div>
              ) : (
                /* Starting screen explaining AI benefits */
                <div className="space-y-6">
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    Nossa IA analisará todo o estoque de insumos registrado. Ela irá organizar os produtos por finalidade agronômica, explicar como utilizá-los na cultura da banana, destacar redundâncias de compras e identificar alertas de vencimento para evitar prejuízos.
                  </p>

                  <div className="bg-white/[0.01] border border-white/5 p-5 rounded-2xl space-y-4">
                    <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                      <Zap className="text-primary" size={14} /> O que a IA fará:
                    </h3>
                    <ul className="space-y-2 text-xs text-zinc-400">
                      <li className="flex items-start gap-2">
                        <span className="text-primary font-bold">•</span>
                        <span>**Organizar os insumos** (adubos, defensivos e embalagens) mostrando a utilidade exata de cada um no bananal.</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-primary font-bold">•</span>
                        <span>**Explicar como aplicar** de forma eficiente e segura, maximizando o aproveitamento.</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-primary font-bold">•</span>
                        <span>**Prevenir desperdícios**, indicando itens duplicados ou com vencimento muito próximo para evitar novas compras desnecessárias.</span>
                      </li>
                    </ul>
                  </div>

                  <button
                    onClick={handleRunStockAi}
                    className="w-full bg-primary hover:bg-primary-dark text-white font-bold py-4 rounded-2xl shadow-lg shadow-primary/20 transition-all cursor-pointer text-xs uppercase tracking-widest flex items-center justify-center gap-2"
                  >
                    <Sparkles size={16} />
                    Iniciar Análise Inteligente de Estoque
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
