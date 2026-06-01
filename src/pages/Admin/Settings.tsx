import React, { useEffect, useState } from "react";
import AdminLayout from "../../components/Layout/AdminLayout";
import { motion, AnimatePresence } from "motion/react";
import { 
  Settings as SettingsIcon, 
  Save, 
  DollarSign, 
  Globe, 
  Lock,
  ChevronRight,
  Loader2,
  TrendingUp,
  AlertCircle,
  Plus,
  Pencil,
  Trash2,
  X
} from "lucide-react";
import { supabase } from "../../lib/supabase";
import { toast } from "sonner";

type TabType = "geral" | "agricola" | "planos" | "seguranca";

interface SettingItem {
  id: number;
  key: string;
  value: string;
  description: string;
}

export default function AdminSettings() {
  const [activeTab, setActiveTab] = useState<TabType>("geral");
  const [settings, setSettings] = useState<SettingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<any | null>(null);
  const [planForm, setPlanForm] = useState({
    name: "",
    price: "",
    interval: "mensal",
    description: "",
    is_active: true
  });

  const menuItems = [
    { id: "geral", label: "Geral", icon: Globe },
    { id: "agricola", label: "Parâmetros Agrícolas", icon: TrendingUp },
    { id: "planos", label: "Planos & SaaS", icon: DollarSign },
    { id: "seguranca", label: "Segurança", icon: Lock },
  ];

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('system_settings')
        .select('*');

      if (error) throw error;
      setSettings(data || []);

      // If agricultural or plans configurations are missing, initialize them in state
      const defaults = [
        { key: "soil_target_v", value: "70", desc: "Meta de Saturação por Bases (%) para bananeira" },
        { key: "soil_limit_p_low", value: "15", desc: "Limite inferior de Fósforo (P) baixo (mg/dm³)" },
        { key: "soil_limit_p_med", value: "30", desc: "Limite inferior de Fósforo (P) médio (mg/dm³)" },
        { key: "soil_limit_k_low", value: "0.15", desc: "Limite inferior de Potássio (K) baixo (cmolc/dm³)" },
        { key: "soil_limit_k_med", value: "0.30", desc: "Limite inferior de Potássio (K) médio (cmolc/dm³)" },
        { key: "plan_amount", value: "87", desc: "Valor da assinatura mensal recorrente (R$)" },
        { key: "asaas_token", value: "", desc: "Token da API do Gateway Asaas" },
        { key: "asaas_environment", value: "sandbox", desc: "Ambiente do Gateway Asaas (sandbox/production)" },
        {
          key: "subscription_plans",
          value: JSON.stringify([
            { id: "1", name: "Plano Mensal", price: 87, interval: "mensal", description: "Acesso completo a todas as ferramentas e cursos com cobrança mensal recorrente.", is_active: true },
            { id: "2", name: "Plano Anual", price: 790, interval: "anual", description: "Acesso completo por 12 meses com desconto de mais de 20% em relação ao mensal.", is_active: true }
          ]),
          desc: "Planos de assinatura da plataforma de cursos e ferramentas (JSON)"
        }
      ];

      setSettings(prev => {
        const merged = [...prev];
        defaults.forEach(def => {
          if (!merged.find(s => s.key === def.key)) {
            merged.push({ id: Math.random(), key: def.key, value: def.value, description: def.desc });
          }
        });
        return merged;
      });

    } catch (err) {
      console.error('Error fetching settings:', err);
      toast.error("Erro ao carregar configurações.");
    } finally {
      setLoading(false);
    }
  };

  const getSetting = (key: string) => settings.find(s => s.key === key)?.value || "";

  const handleUpdateSetting = (key: string, value: string) => {
    setSettings(prev => {
      const exists = prev.find(s => s.key === key);
      if (exists) {
        return prev.map(s => s.key === key ? { ...s, value } : s);
      }
      return [...prev, { id: Math.random(), key, value, description: "" }];
    });
  };

  const plansSetting = settings.find(s => s.key === "subscription_plans")?.value || "[]";
  let plans: any[] = [];
  try {
    plans = JSON.parse(plansSetting);
  } catch (e) {
    console.error("Erro ao fazer parse dos planos:", e);
  }

  const handleUpdatePlans = (newPlans: any[]) => {
    handleUpdateSetting("subscription_plans", JSON.stringify(newPlans));
  };

  const handleOpenAddPlan = () => {
    setEditingPlan(null);
    setPlanForm({
      name: "",
      price: "",
      interval: "mensal",
      description: "",
      is_active: true
    });
    setIsPlanModalOpen(true);
  };

  const handleOpenEditPlan = (plan: any) => {
    setEditingPlan(plan);
    setPlanForm({
      name: plan.name,
      price: plan.price.toString(),
      interval: plan.interval,
      description: plan.description || "",
      is_active: plan.is_active !== false
    });
    setIsPlanModalOpen(true);
  };

  const handleSavePlan = (e: React.FormEvent) => {
    e.preventDefault();
    if (!planForm.name || !planForm.price) {
      toast.error("Nome e Preço são obrigatórios.");
      return;
    }

    const priceNum = parseFloat(planForm.price);
    if (isNaN(priceNum) || priceNum <= 0) {
      toast.error("Informe um preço válido maior que zero.");
      return;
    }

    const currentPlans = [...plans];

    if (editingPlan) {
      const updated = currentPlans.map(p => p.id === editingPlan.id ? {
        ...p,
        name: planForm.name,
        price: priceNum,
        interval: planForm.interval,
        description: planForm.description,
        is_active: planForm.is_active
      } : p);
      handleUpdatePlans(updated);
      toast.success("Plano atualizado localmente! Salve as alterações para persistir.");
    } else {
      const newPlan = {
        id: crypto.randomUUID(),
        name: planForm.name,
        price: priceNum,
        interval: planForm.interval,
        description: planForm.description,
        is_active: planForm.is_active
      };
      handleUpdatePlans([...currentPlans, newPlan]);
      toast.success("Plano adicionado localmente! Salve as alterações para persistir.");
    }

    setIsPlanModalOpen(false);
  };

  const handleDeletePlan = (id: string) => {
    if (!confirm("Tem certeza de que deseja excluir este plano de assinatura?")) return;
    const updated = plans.filter(p => p.id !== id);
    handleUpdatePlans(updated);
    toast.success("Plano removido localmente! Salve as alterações para persistir.");
  };

  const handleSaveAll = async () => {
    setIsSaving(true);
    try {
      const updates = settings.map(setting => (
        supabase
          .from('system_settings')
          .upsert({ 
            key: setting.key, 
            value: setting.value, 
            updated_at: new Date().toISOString() 
          }, { onConflict: 'key' })
      ));

      const results = await Promise.all(updates);
      const errors = results.filter(r => r.error);

      if (errors.length > 0) throw errors[0].error;

      toast.success("Todas as configurações foram atualizadas com sucesso!");
    } catch (err: any) {
      console.error('Error saving settings:', err);
      toast.error("Erro ao salvar: " + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const renderContent = () => {
    if (loading) return (
      <div className="flex flex-col items-center justify-center py-20 text-zinc-500">
        <Loader2 className="w-8 h-8 animate-spin mb-4" />
        <p className="font-bold">Carregando parâmetros...</p>
      </div>
    );

    switch (activeTab) {
      case "geral":
        return (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
            <section className="bg-zinc-900/40 border border-white/5 p-8 rounded-[2.5rem] space-y-6">
              <h3 className="text-xl font-bold text-white">Informações da Plataforma</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-black text-zinc-500 uppercase tracking-widest ml-1">Nome do Sistema</label>
                  <input 
                    type="text" 
                    value={getSetting('site_name')} 
                    onChange={(e) => handleUpdateSetting('site_name', e.target.value)}
                    className="w-full bg-black/40 border border-white/10 rounded-2xl px-5 py-3.5 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50" 
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-zinc-500 uppercase tracking-widest ml-1">E-mail de Suporte</label>
                  <input 
                    type="email" 
                    value={getSetting('support_email')} 
                    onChange={(e) => handleUpdateSetting('support_email', e.target.value)}
                    className="w-full bg-black/40 border border-white/10 rounded-2xl px-5 py-3.5 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50" 
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-zinc-500 uppercase tracking-widest ml-1">WhatsApp Suporte</label>
                  <input 
                    type="text" 
                    value={getSetting('support_whatsapp')} 
                    onChange={(e) => handleUpdateSetting('support_whatsapp', e.target.value)}
                    className="w-full bg-black/40 border border-white/10 rounded-2xl px-5 py-3.5 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50" 
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-zinc-500 uppercase tracking-widest ml-1">URL Oficial</label>
                  <input 
                    type="text" 
                    value={getSetting('site_url')} 
                    onChange={(e) => handleUpdateSetting('site_url', e.target.value)}
                    className="w-full bg-black/40 border border-white/10 rounded-2xl px-5 py-3.5 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50" 
                  />
                </div>
              </div>
            </section>
          </motion.div>
        );
      case "agricola":
        return (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
            <section className="bg-zinc-900/40 border border-white/5 p-8 rounded-[2.5rem] space-y-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-500">
                  <TrendingUp size={20} />
                </div>
                <h3 className="text-xl font-bold text-white">Parâmetros das Calculadoras</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2 md:col-span-2">
                  <label className="text-xs font-black text-zinc-500 uppercase tracking-widest ml-1">Meta de Saturação por Bases (V2 %)</label>
                  <input 
                    type="number" 
                    value={getSetting('soil_target_v')} 
                    onChange={(e) => handleUpdateSetting('soil_target_v', e.target.value)}
                    className="w-full bg-black/40 border border-white/10 rounded-2xl px-5 py-3.5 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50" 
                  />
                  <p className="text-[10px] text-zinc-500 italic">Padrão para cultura da banana: 70%</p>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-black text-zinc-500 uppercase tracking-widest ml-1">Fósforo (P) Limite Baixo (mg/dm³)</label>
                  <input 
                    type="number" 
                    value={getSetting('soil_limit_p_low')} 
                    onChange={(e) => handleUpdateSetting('soil_limit_p_low', e.target.value)}
                    className="w-full bg-black/40 border border-white/10 rounded-2xl px-5 py-3.5 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50" 
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-black text-zinc-500 uppercase tracking-widest ml-1">Fósforo (P) Limite Médio (mg/dm³)</label>
                  <input 
                    type="number" 
                    value={getSetting('soil_limit_p_med')} 
                    onChange={(e) => handleUpdateSetting('soil_limit_p_med', e.target.value)}
                    className="w-full bg-black/40 border border-white/10 rounded-2xl px-5 py-3.5 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50" 
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-black text-zinc-500 uppercase tracking-widest ml-1">Potássio (K) Limite Baixo (cmolc/dm³)</label>
                  <input 
                    type="number" 
                    step="0.01"
                    value={getSetting('soil_limit_k_low')} 
                    onChange={(e) => handleUpdateSetting('soil_limit_k_low', e.target.value)}
                    className="w-full bg-black/40 border border-white/10 rounded-2xl px-5 py-3.5 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50" 
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-black text-zinc-500 uppercase tracking-widest ml-1">Potássio (K) Limite Médio (cmolc/dm³)</label>
                  <input 
                    type="number" 
                    step="0.01"
                    value={getSetting('soil_limit_k_med')} 
                    onChange={(e) => handleUpdateSetting('soil_limit_k_med', e.target.value)}
                    className="w-full bg-black/40 border border-white/10 rounded-2xl px-5 py-3.5 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50" 
                  />
                </div>
              </div>
            </section>
          </motion.div>
        );
      case "planos":
        return (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-8">
            {/* Subscription Plans Manager */}
            <section className="bg-zinc-900/40 border border-white/5 p-8 rounded-[2.5rem] space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-xl font-bold text-white">Planos de Assinatura</h3>
                  <p className="text-zinc-500 text-xs mt-1">Crie e gerencie os planos que dão acesso aos cursos e ferramentas.</p>
                </div>
                <button
                  type="button"
                  onClick={handleOpenAddPlan}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-3 rounded-2xl font-bold text-xs flex items-center gap-1.5 transition-all shadow-lg shadow-emerald-600/20 active:scale-95 cursor-pointer"
                >
                  <Plus size={16} />
                  Novo Plano
                </button>
              </div>

              {/* Plans Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {plans.length === 0 ? (
                  <div className="col-span-full py-10 text-center bg-black/20 rounded-3xl border border-dashed border-white/5 text-zinc-500 text-xs">
                    Nenhum plano cadastrado. Clique em "Novo Plano" para começar.
                  </div>
                ) : (
                  plans.map((plan) => (
                    <div 
                      key={plan.id}
                      className="bg-black/40 border border-white/5 p-6 rounded-3xl flex flex-col justify-between hover:border-emerald-500/20 transition-all group"
                    >
                      <div className="space-y-4">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h4 className="font-bold text-white text-sm">{plan.name}</h4>
                            <span className="text-[10px] text-zinc-500 font-mono">ID: {plan.id.substring(0, 8)}...</span>
                          </div>
                          <span className={`text-[9px] font-black px-2.5 py-1 rounded-full uppercase border ${
                            plan.is_active !== false 
                              ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" 
                              : "bg-red-500/10 text-red-400 border-red-500/20"
                          }`}>
                            {plan.is_active !== false ? "Ativo" : "Inativo"}
                          </span>
                        </div>

                        <div className="space-y-1">
                          <p className="text-xl font-black text-white">
                            R$ {plan.price.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                            <span className="text-xs text-zinc-500 font-medium">/{plan.interval}</span>
                          </p>
                          <p className="text-zinc-400 text-xs leading-relaxed line-clamp-3">{plan.description}</p>
                        </div>
                      </div>

                      <div className="flex justify-end gap-2 pt-4 mt-4 border-t border-white/5">
                        <button
                          type="button"
                          onClick={() => handleOpenEditPlan(plan)}
                          className="p-2 bg-white/5 hover:bg-emerald-500/10 text-zinc-400 hover:text-emerald-400 border border-transparent hover:border-emerald-500/20 rounded-xl transition-all cursor-pointer"
                          title="Editar Plano"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeletePlan(plan.id)}
                          className="p-2 bg-white/5 hover:bg-red-500/10 text-zinc-400 hover:text-red-400 border border-transparent hover:border-red-500/20 rounded-xl transition-all cursor-pointer"
                          title="Excluir Plano"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </section>

            {/* Gateway Configuration */}
            <section className="bg-zinc-900/40 border border-white/5 p-8 rounded-[2.5rem] space-y-6">
              <div>
                <h3 className="text-xl font-bold text-white">Configuração do Gateway (Asaas)</h3>
                <p className="text-zinc-500 text-xs mt-1">Insira suas credenciais de API do Asaas para integrar a cobrança dos planos.</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2 md:col-span-2">
                  <label className="text-xs font-black text-zinc-500 uppercase tracking-widest ml-1">Token de Integração Asaas</label>
                  <input 
                    type="password" 
                    value={getSetting('asaas_token')} 
                    onChange={(e) => handleUpdateSetting('asaas_token', e.target.value)}
                    placeholder="••••••••••••••••••••"
                    className="w-full bg-black/40 border border-white/10 rounded-2xl px-5 py-3.5 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 font-mono" 
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <label className="text-xs font-black text-zinc-500 uppercase tracking-widest ml-1">Ambiente de Execução</label>
                  <select 
                    value={getSetting('asaas_environment')} 
                    onChange={(e) => handleUpdateSetting('asaas_environment', e.target.value)}
                    className="w-full bg-black/40 border border-white/10 rounded-2xl px-5 py-3.5 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 h-[54px] cursor-pointer font-bold"
                  >
                    <option value="sandbox">Sandbox (Testes)</option>
                    <option value="production">Produção (Real)</option>
                  </select>
                </div>
              </div>
            </section>
          </motion.div>
        );
      case "seguranca":
        return (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
            <section className="bg-zinc-900/40 border border-white/5 p-8 rounded-[2.5rem] space-y-6">
              <h3 className="text-xl font-bold text-white">Segurança e Acesso</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-black text-zinc-500 uppercase tracking-widest ml-1">Tempo de Sessão (min)</label>
                  <input 
                    type="number" 
                    value={getSetting('session_timeout')} 
                    onChange={(e) => handleUpdateSetting('session_timeout', e.target.value)}
                    className="w-full bg-black/40 border border-white/10 rounded-2xl px-5 py-3.5 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50" 
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-zinc-500 uppercase tracking-widest ml-1">Tentativas de Login</label>
                  <input 
                    type="number" 
                    value={getSetting('max_login_attempts')} 
                    onChange={(e) => handleUpdateSetting('max_login_attempts', e.target.value)}
                    className="w-full bg-black/40 border border-white/10 rounded-2xl px-5 py-3.5 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50" 
                  />
                </div>
              </div>
            </section>
          </motion.div>
        );
    }
  };

  return (
    <AdminLayout>
      <div className="max-w-6xl mx-auto space-y-10">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              <SettingsIcon className="text-emerald-500" />
              Configurações do Sistema
            </h1>
            <p className="text-zinc-500 text-sm mt-1">Gerencie as regras de negócio, parâmetros de análise de solo e credenciais do Asaas.</p>
          </div>
          <button 
            onClick={handleSaveAll}
            disabled={isSaving}
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-3 rounded-2xl font-bold flex items-center gap-2 transition-all shadow-lg shadow-emerald-600/20 active:scale-95 disabled:opacity-50 cursor-pointer"
          >
            {isSaving ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
            {isSaving ? "Salvando..." : "Salvar Alterações"}
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Sidebar Nav */}
          <div className="space-y-3">
            {menuItems.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button 
                  key={item.id}
                  onClick={() => setActiveTab(item.id as TabType)}
                  className={`w-full flex items-center justify-between px-6 py-4 rounded-3xl font-bold text-sm transition-all group border ${
                    isActive 
                      ? "bg-white/10 text-white border-white/20 shadow-xl" 
                      : "text-zinc-500 hover:text-white hover:bg-white/5 border-transparent"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <item.icon size={20} className={isActive ? "text-emerald-500" : "group-hover:text-emerald-500 transition-colors"} />
                    {item.label}
                  </div>
                  {isActive && <ChevronRight size={16} className="text-emerald-500" />}
                </button>
              );
            })}
          </div>

          {/* Main Content Area */}
          <div className="lg:col-span-2">
            <AnimatePresence mode="wait">
              {renderContent()}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Plan Editor Modal */}
      <AnimatePresence>
        {isPlanModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/85 backdrop-blur-sm"
              onClick={() => setIsPlanModalOpen(false)}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-lg bg-zinc-950 border border-white/10 rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col z-10"
            >
              <div className="p-8 border-b border-white/5 flex items-center justify-between">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <DollarSign className="text-emerald-500" size={20} />
                  {editingPlan ? "Editar Plano de Assinatura" : "Criar Novo Plano"}
                </h2>
                <button 
                  onClick={() => setIsPlanModalOpen(false)} 
                  className="p-2 hover:bg-white/5 rounded-xl text-zinc-500 hover:text-white transition-all cursor-pointer"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSavePlan} className="p-8 space-y-6">
                <div className="space-y-2">
                  <label className="text-xs font-black text-zinc-500 uppercase tracking-widest ml-1">Nome do Plano</label>
                  <input 
                    type="text" 
                    required 
                    value={planForm.name} 
                    onChange={e => setPlanForm({...planForm, name: e.target.value})}
                    placeholder="Ex: Plano Trimestral"
                    className="w-full bg-zinc-900 border border-white/10 rounded-2xl px-5 py-3.5 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 font-bold"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-black text-zinc-500 uppercase tracking-widest ml-1">Preço (R$)</label>
                    <input 
                      type="number" 
                      required 
                      step="0.01"
                      min="0.01"
                      value={planForm.price} 
                      onChange={e => setPlanForm({...planForm, price: e.target.value})}
                      placeholder="87.00"
                      className="w-full bg-zinc-900 border border-white/10 rounded-2xl px-5 py-3.5 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 font-bold"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-black text-zinc-500 uppercase tracking-widest ml-1">Intervalo</label>
                    <select 
                      value={planForm.interval} 
                      onChange={e => setPlanForm({...planForm, interval: e.target.value})}
                      className="w-full bg-zinc-900 border border-white/10 rounded-2xl px-5 py-3.5 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 h-[54px] cursor-pointer font-bold"
                    >
                      <option value="mensal">Mensal</option>
                      <option value="trimestral">Trimestral</option>
                      <option value="semestral">Semestral</option>
                      <option value="anual">Anual</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-black text-zinc-500 uppercase tracking-widest ml-1">Descrição</label>
                  <textarea 
                    rows={3} 
                    value={planForm.description} 
                    onChange={e => setPlanForm({...planForm, description: e.target.value})}
                    placeholder="Resumo dos benefícios do plano..."
                    className="w-full bg-zinc-900 border border-white/10 rounded-2xl px-5 py-3.5 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 font-semibold resize-none"
                  />
                </div>

                <div className="flex items-center gap-3 py-2">
                  <input 
                    type="checkbox" 
                    id="plan-active" 
                    checked={planForm.is_active} 
                    onChange={e => setPlanForm({...planForm, is_active: e.target.checked})}
                    className="accent-emerald-500 w-4 h-4 rounded cursor-pointer"
                  />
                  <label htmlFor="plan-active" className="text-xs font-bold text-zinc-400 cursor-pointer select-none">
                    Plano Ativo (disponível para contratação)
                  </label>
                </div>

                <div className="flex gap-4 border-t border-white/5 pt-6">
                  <button 
                    type="button" 
                    onClick={() => setIsPlanModalOpen(false)}
                    className="flex-1 bg-white/5 hover:bg-white/10 text-white font-bold py-3.5 rounded-2xl transition-all cursor-pointer text-xs uppercase tracking-wider"
                  >
                    Cancelar
                  </button>
                  <button 
                    type="submit"
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3.5 rounded-2xl transition-all cursor-pointer text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20"
                  >
                    <Save size={14} />
                    Confirmar
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </AdminLayout>
  );
}
