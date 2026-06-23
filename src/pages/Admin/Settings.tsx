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
  X,
  Sliders,
  Copy,
  Check,
  Star
} from "lucide-react";
import { supabase } from "../../lib/supabase";
import { toast } from "sonner";

type TabType = "geral" | "agricola" | "planos" | "checkout" | "seguranca";

interface SettingItem {
  id: number;
  key: string;
  value: string;
  description: string;
}

interface Testimonial {
  name: string;
  rating: number;
  text: string;
  avatar_url: string;
}

interface CheckoutItem {
  id: number;
  slug: string;
  name: string;
  title: string;
  subtitle: string;
  header_image_url: string;
  features: string[];
  guarantee_days: number;
  payment_methods: string[];
  testimonials: Testimonial[];
}

export default function AdminSettings() {
  const [activeTab, setActiveTab] = useState<TabType>("geral");
  const [settings, setSettings] = useState<SettingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  // Plans SaaS states
  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<any | null>(null);
  const [planForm, setPlanForm] = useState({
    name: "",
    price: "",
    interval: "mensal",
    description: "",
    is_active: true
  });

  // Checkouts custom variations states
  const [checkoutConfigs, setCheckoutConfigs] = useState<CheckoutItem[]>([]);
  const [loadingCheckouts, setLoadingCheckouts] = useState(false);
  const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false);
  const [editingCheckout, setEditingCheckout] = useState<CheckoutItem | null>(null);
  const [copiedSlug, setCopiedSlug] = useState<string | null>(null);
  
  const [checkoutForm, setCheckoutForm] = useState({
    slug: "",
    name: "",
    title: "",
    subtitle: "",
    header_image_url: "",
    featuresText: "", // newline-separated
    guarantee_days: 7,
    payment_methods: ["credit_card", "pix"] as string[],
    testimonials: [] as Testimonial[],
  });

  // Testimonial modal states
  const [isTestimonialModalOpen, setIsTestimonialModalOpen] = useState(false);
  const [editingTestimonialIdx, setEditingTestimonialIdx] = useState<number | null>(null);
  const [testimonialForm, setTestimonialForm] = useState<Testimonial>({
    name: "",
    rating: 5,
    text: "",
    avatar_url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&h=150&q=80"
  });

  const menuItems = [
    { id: "geral", label: "Geral", icon: Globe },
    { id: "agricola", label: "Parâmetros Agrícolas", icon: TrendingUp },
    { id: "planos", label: "Planos & SaaS", icon: DollarSign },
    { id: "checkout", label: "Checkout & Vendas", icon: Sliders },
    { id: "seguranca", label: "Segurança", icon: Lock },
  ];

  useEffect(() => {
    fetchSettings();
    fetchCheckouts();
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

  const fetchCheckouts = async () => {
    setLoadingCheckouts(true);
    try {
      const { data, error } = await supabase
        .from("checkout_settings")
        .select("*")
        .order("id", { ascending: true });
      if (error) throw error;
      setCheckoutConfigs(data || []);
    } catch (err) {
      console.error("Error fetching checkouts:", err);
      // Suppress toast if table is not created yet (user has to run SQL first)
    } finally {
      setLoadingCheckouts(false);
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

  // Plans functions
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

  // Checkout functions
  const handleOpenAddCheckout = () => {
    setEditingCheckout(null);
    setCheckoutForm({
      slug: "",
      name: "",
      title: "",
      subtitle: "",
      header_image_url: "",
      featuresText: "",
      guarantee_days: 7,
      payment_methods: ["credit_card", "pix"],
      testimonials: [],
    });
    setIsCheckoutModalOpen(true);
  };

  const handleOpenEditCheckout = (item: CheckoutItem) => {
    setEditingCheckout(item);
    setCheckoutForm({
      slug: item.slug,
      name: item.name,
      title: item.title,
      subtitle: item.subtitle,
      header_image_url: item.header_image_url || "",
      featuresText: Array.isArray(item.features) ? item.features.join("\n") : "",
      guarantee_days: item.guarantee_days || 7,
      payment_methods: item.payment_methods || ["credit_card", "pix"],
      testimonials: item.testimonials || [],
    });
    setIsCheckoutModalOpen(true);
  };

  const handleSaveCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!checkoutForm.name || !checkoutForm.slug) {
      toast.error("Nome e Slug são obrigatórios.");
      return;
    }

    const cleanSlug = checkoutForm.slug.trim().toLowerCase().replace(/[^a-z0-9-_]/g, "");

    const featuresArray = checkoutForm.featuresText
      .split("\n")
      .map(line => line.trim())
      .filter(line => line.length > 0);

    const payload = {
      slug: cleanSlug,
      name: checkoutForm.name,
      title: checkoutForm.title,
      subtitle: checkoutForm.subtitle,
      header_image_url: checkoutForm.header_image_url || "https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?auto=format&fit=crop&w=1200&q=80",
      features: featuresArray,
      guarantee_days: checkoutForm.guarantee_days,
      payment_methods: checkoutForm.payment_methods,
      testimonials: checkoutForm.testimonials,
      updated_at: new Date().toISOString()
    };

    try {
      if (editingCheckout) {
        const { error } = await supabase
          .from("checkout_settings")
          .update(payload)
          .eq("id", editingCheckout.id);
        if (error) throw error;
        toast.success("Checkout atualizado com sucesso!");
      } else {
        const { error } = await supabase
          .from("checkout_settings")
          .insert(payload);
        if (error) throw error;
        toast.success("Nova variação de checkout criada com sucesso!");
      }
      setIsCheckoutModalOpen(false);
      fetchCheckouts();
    } catch (err: any) {
      console.error("Error saving checkout variation:", err);
      toast.error("Erro ao salvar no banco: " + err.message);
    }
  };

  const handleDeleteCheckout = async (id: number) => {
    if (!confirm("Excluir esta variação de checkout permanentemente?")) return;
    try {
      const { error } = await supabase
        .from("checkout_settings")
        .delete()
        .eq("id", id);
      if (error) throw error;
      toast.success("Checkout excluído com sucesso!");
      fetchCheckouts();
    } catch (err: any) {
      console.error("Error deleting checkout:", err);
      toast.error("Erro ao deletar: " + err.message);
    }
  };

  const handleCopyCheckoutUrl = (slug: string) => {
    const url = `${window.location.origin}/checkout/${slug}`;
    navigator.clipboard.writeText(url);
    setCopiedSlug(slug);
    toast.success("Link do checkout copiado!");
    setTimeout(() => setCopiedSlug(null), 2000);
  };

  // Testimonials management inside checkout form
  const handleOpenAddTestimonial = () => {
    setEditingTestimonialIdx(null);
    setTestimonialForm({
      name: "",
      rating: 5,
      text: "",
      avatar_url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&h=150&q=80"
    });
    setIsTestimonialModalOpen(true);
  };

  const handleOpenEditTestimonial = (idx: number, t: Testimonial) => {
    setEditingTestimonialIdx(idx);
    setTestimonialForm({ ...t });
    setIsTestimonialModalOpen(true);
  };

  const handleSaveTestimonial = (e: React.FormEvent) => {
    e.preventDefault();
    if (!testimonialForm.name || !testimonialForm.text) {
      toast.error("Nome e texto do depoimento são obrigatórios.");
      return;
    }

    const currentList = [...checkoutForm.testimonials];

    if (editingTestimonialIdx !== null) {
      currentList[editingTestimonialIdx] = testimonialForm;
    } else {
      currentList.push(testimonialForm);
    }

    setCheckoutForm(prev => ({ ...prev, testimonials: currentList }));
    setIsTestimonialModalOpen(false);
    toast.success("Depoimento atualizado localmente! Lembre-se de salvar o checkout.");
  };

  const handleDeleteTestimonial = (idx: number) => {
    const currentList = checkoutForm.testimonials.filter((_, i) => i !== idx);
    setCheckoutForm(prev => ({ ...prev, testimonials: currentList }));
    toast.success("Depoimento removido localmente! Lembre-se de salvar o checkout.");
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

      toast.success("Todas as configurações gerais foram salvas com sucesso!");
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
            <section className="bg-zinc-900/40 border border-white/5 p-8 rounded-[2.5rem] space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-xl font-bold text-white">Planos de Assinatura</h3>
                  <p className="text-zinc-500 text-xs mt-1">Crie e gerencie os planos que dão acesso aos cursos e ferramentas.</p>
                </div>
                <button
                  type="button"
                  onClick={handleOpenAddPlan}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-3 rounded-2xl font-bold text-xs flex items-center gap-1.5 transition-all shadow-lg shadow-emerald-600/20 active:scale-95 cursor-pointer animate-pulse"
                >
                  <Plus size={16} />
                  Novo Plano
                </button>
              </div>

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
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeletePlan(plan.id)}
                          className="p-2 bg-white/5 hover:bg-red-500/10 text-zinc-400 hover:text-red-400 border border-transparent hover:border-red-500/20 rounded-xl transition-all cursor-pointer"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </section>
          </motion.div>
        );
      case "checkout":
        return (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
            <section className="bg-zinc-900/40 border border-white/5 p-8 rounded-[2.5rem] space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-5">
                <div>
                  <h3 className="text-xl font-bold text-white flex items-center gap-2">
                    <Sliders className="text-emerald-500" />
                    Variações de Checkout
                  </h3>
                  <p className="text-zinc-500 text-xs mt-1">Gere múltiplos checkouts com imagens, depoimentos e links exclusivos.</p>
                </div>
                <button
                  type="button"
                  onClick={handleOpenAddCheckout}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-3 rounded-2xl font-bold text-xs flex items-center gap-1.5 transition-all shadow-lg active:scale-95 cursor-pointer"
                >
                  <Plus size={16} />
                  Novo Checkout
                </button>
              </div>

              {loadingCheckouts ? (
                <div className="flex justify-center items-center py-10 text-zinc-500 text-xs">
                  <Loader2 className="animate-spin mr-2" size={16} />
                  Carregando checkouts...
                </div>
              ) : checkoutConfigs.length === 0 ? (
                <div className="py-12 text-center bg-black/20 rounded-[2rem] border border-dashed border-white/5 text-zinc-500 text-xs font-semibold">
                  Nenhuma variação de checkout cadastrada.<br />
                  <span className="text-zinc-650 block mt-2">
                    (Nota: Certifique-se de executar o script de migração no banco de dados primeiro)
                  </span>
                </div>
              ) : (
                <div className="space-y-4">
                  {checkoutConfigs.map((item) => (
                    <div 
                      key={item.id}
                      className="bg-black/40 border border-white/5 p-6 rounded-3xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:border-white/10 transition-all"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-white text-sm">{item.name}</h4>
                          <span className="bg-emerald-950 text-emerald-400 border border-emerald-500/20 text-[9px] font-bold px-2.5 py-0.5 rounded-full">
                            /{item.slug}
                          </span>
                        </div>
                        <p className="text-zinc-400 text-xs line-clamp-1">{item.title}</p>
                        <p className="text-[10px] text-zinc-500 font-medium">
                          Garantia: {item.guarantee_days} dias • Benefícios: {item.features?.length || 0} • Depoimentos: {item.testimonials?.length || 0}
                        </p>
                      </div>

                      <div className="flex gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleCopyCheckoutUrl(item.slug)}
                          className="bg-zinc-800 hover:bg-zinc-700 text-white px-3.5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer border border-white/5"
                        >
                          {copiedSlug === item.slug ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                          {copiedSlug === item.slug ? "Copiado" : "Copiar URL"}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleOpenEditCheckout(item)}
                          className="p-2.5 bg-white/5 hover:bg-emerald-500/10 text-zinc-400 hover:text-emerald-400 border border-transparent hover:border-emerald-500/20 rounded-xl transition-all cursor-pointer"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteCheckout(item.id)}
                          className="p-2.5 bg-white/5 hover:bg-red-500/10 text-zinc-400 hover:text-red-400 border border-transparent hover:border-red-500/20 rounded-xl transition-all cursor-pointer"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
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
      <div className="max-w-6xl mx-auto space-y-10 font-sans">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              <SettingsIcon className="text-emerald-500" />
              Configurações do Sistema
            </h1>
            <p className="text-zinc-500 text-sm mt-1">Gerencie as regras de negócio, parâmetros de análise de solo e credenciais do Asaas.</p>
          </div>
          {activeTab !== "checkout" && (
            <button 
              onClick={handleSaveAll}
              disabled={isSaving}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-3 rounded-2xl font-bold flex items-center gap-2 transition-all shadow-lg active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              {isSaving ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
              {isSaving ? "Salvando..." : "Salvar Alterações"}
            </button>
          )}
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
              className="relative w-full max-w-lg bg-zinc-950 border border-white/10 rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col z-10 text-white"
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
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3.5 rounded-2xl transition-all cursor-pointer text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg"
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

      {/* Checkout Editor Modal */}
      <AnimatePresence>
        {isCheckoutModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/85 backdrop-blur-sm"
              onClick={() => setIsCheckoutModalOpen(false)}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-2xl bg-zinc-950 border border-white/10 rounded-[2.5rem] shadow-2xl flex flex-col z-10 text-white my-8 max-h-[85vh] overflow-y-auto"
            >
              <div className="p-8 border-b border-white/5 flex items-center justify-between sticky top-0 bg-zinc-950 z-20">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <Sliders className="text-emerald-500" size={20} />
                  {editingCheckout ? `Editar Checkout: ${checkoutForm.name}` : "Criar Nova Variação de Checkout"}
                </h2>
                <button 
                  onClick={() => setIsCheckoutModalOpen(false)} 
                  className="p-2 hover:bg-white/5 rounded-xl text-zinc-500 hover:text-white transition-all cursor-pointer"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSaveCheckout} className="p-8 space-y-6">
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-black text-zinc-500 uppercase tracking-widest ml-1">Nome Interno</label>
                    <input 
                      type="text" 
                      required 
                      value={checkoutForm.name} 
                      onChange={e => setCheckoutForm({...checkoutForm, name: e.target.value})}
                      placeholder="Ex: Oferta Ouro Black Friday"
                      className="w-full bg-zinc-900 border border-white/10 rounded-2xl px-5 py-3.5 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 font-bold"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-black text-zinc-500 uppercase tracking-widest ml-1">Slug da URL (/checkout/...)</label>
                    <input 
                      type="text" 
                      required 
                      disabled={!!editingCheckout} // Slug cannot be changed once created to prevent broken urls
                      value={checkoutForm.slug} 
                      onChange={e => setCheckoutForm({...checkoutForm, slug: e.target.value})}
                      placeholder="ex: blackfriday"
                      className="w-full bg-zinc-900 border border-white/10 rounded-2xl px-5 py-3.5 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 font-bold disabled:opacity-50"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-black text-zinc-500 uppercase tracking-widest ml-1">Título do Checkout (Visual)</label>
                  <input 
                    type="text" 
                    required 
                    value={checkoutForm.title} 
                    onChange={e => setCheckoutForm({...checkoutForm, title: e.target.value})}
                    placeholder="GUIA PRÁTICO PARA PRODUÇÃO DE BANANAS"
                    className="w-full bg-zinc-900 border border-white/10 rounded-2xl px-5 py-3.5 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 font-bold"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-black text-zinc-500 uppercase tracking-widest ml-1">Subtítulo / Descrição</label>
                  <textarea 
                    rows={2} 
                    required 
                    value={checkoutForm.subtitle} 
                    onChange={e => setCheckoutForm({...checkoutForm, subtitle: e.target.value})}
                    placeholder="Resumo em destaque da oferta..."
                    className="w-full bg-zinc-900 border border-white/10 rounded-2xl px-5 py-3.5 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 font-semibold resize-none"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-black text-zinc-500 uppercase tracking-widest ml-1">Imagem de Cabeçalho (URL)</label>
                  <input 
                    type="text" 
                    value={checkoutForm.header_image_url} 
                    onChange={e => setCheckoutForm({...checkoutForm, header_image_url: e.target.value})}
                    placeholder="https://images.unsplash.com/..."
                    className="w-full bg-zinc-900 border border-white/10 rounded-2xl px-5 py-3.5 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 text-xs font-mono"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-black text-zinc-500 uppercase tracking-widest ml-1">Dias de Garantia</label>
                    <input 
                      type="number" 
                      required 
                      value={checkoutForm.guarantee_days} 
                      onChange={e => setCheckoutForm({...checkoutForm, guarantee_days: parseInt(e.target.value) || 7})}
                      className="w-full bg-zinc-900 border border-white/10 rounded-2xl px-5 py-3.5 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 font-bold"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-black text-zinc-500 uppercase tracking-widest ml-1">Meios de Pagamento Habilitados</label>
                    <div className="flex gap-4 pt-3 pl-1">
                      <label className="flex items-center gap-2 text-xs font-semibold text-zinc-300 cursor-pointer">
                        <input 
                          type="checkbox" 
                          checked={checkoutForm.payment_methods.includes("credit_card")}
                          onChange={(e) => {
                            const current = [...checkoutForm.payment_methods];
                            if (e.target.checked) {
                              if (!current.includes("credit_card")) current.push("credit_card");
                            } else {
                              const idx = current.indexOf("credit_card");
                              if (idx !== -1) current.splice(idx, 1);
                            }
                            setCheckoutForm(prev => ({ ...prev, payment_methods: current }));
                          }}
                          className="accent-emerald-500 w-4 h-4 rounded cursor-pointer"
                        />
                        Cartão
                      </label>
                      <label className="flex items-center gap-2 text-xs font-semibold text-zinc-300 cursor-pointer">
                        <input 
                          type="checkbox" 
                          checked={checkoutForm.payment_methods.includes("pix")}
                          onChange={(e) => {
                            const current = [...checkoutForm.payment_methods];
                            if (e.target.checked) {
                              if (!current.includes("pix")) current.push("pix");
                            } else {
                              const idx = current.indexOf("pix");
                              if (idx !== -1) current.splice(idx, 1);
                            }
                            setCheckoutForm(prev => ({ ...prev, payment_methods: current }));
                          }}
                          className="accent-emerald-500 w-4 h-4 rounded cursor-pointer"
                        />
                        PIX
                      </label>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-black text-zinc-500 uppercase tracking-widest ml-1">Vantagens / Benefícios (Um por linha)</label>
                  <textarea 
                    rows={4} 
                    value={checkoutForm.featuresText} 
                    onChange={e => setCheckoutForm({...checkoutForm, featuresText: e.target.value})}
                    placeholder="Acesso completo aos cursos&#10;Mentoria especializada&#10;Calculadora de Calagem..."
                    className="w-full bg-zinc-900 border border-white/10 rounded-2xl px-5 py-3.5 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 font-semibold resize-none"
                  />
                </div>

                {/* Testimonial List inside form */}
                <div className="space-y-4 border-t border-white/5 pt-5">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-black text-zinc-500 uppercase tracking-widest ml-1">Depoimentos dos Clientes</label>
                    <button
                      type="button"
                      onClick={handleOpenAddTestimonial}
                      className="text-emerald-500 hover:text-emerald-400 text-xs font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <Plus size={14} />
                      Adicionar Depoimento
                    </button>
                  </div>

                  <div className="space-y-2">
                    {checkoutForm.testimonials.length === 0 ? (
                      <p className="text-[10px] text-zinc-650 italic text-center py-4">Nenhum depoimento cadastrado nesta variação.</p>
                    ) : (
                      checkoutForm.testimonials.map((t, idx) => (
                        <div key={idx} className="bg-zinc-900 border border-white/5 p-4 rounded-2xl flex items-center justify-between gap-4">
                          <div className="flex items-center gap-3">
                            <img src={t.avatar_url} className="w-8 h-8 rounded-full object-cover" />
                            <div>
                              <h5 className="text-xs font-bold text-white">{t.name}</h5>
                              <p className="text-[10px] text-zinc-500 line-clamp-1 max-w-sm">{t.text}</p>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => handleOpenEditTestimonial(idx, t)}
                              className="text-zinc-500 hover:text-white text-xs font-bold p-1 cursor-pointer"
                            >
                              <Pencil size={12} />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteTestimonial(idx)}
                              className="text-zinc-500 hover:text-red-500 text-xs font-bold p-1 cursor-pointer"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <div className="flex gap-4 border-t border-white/5 pt-6 sticky bottom-0 bg-zinc-950 py-4 z-10">
                  <button 
                    type="button" 
                    onClick={() => setIsCheckoutModalOpen(false)}
                    className="flex-1 bg-white/5 hover:bg-white/10 text-white font-bold py-3.5 rounded-2xl transition-all cursor-pointer text-xs uppercase tracking-wider"
                  >
                    Cancelar
                  </button>
                  <button 
                    type="submit"
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3.5 rounded-2xl transition-all cursor-pointer text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg"
                  >
                    <Save size={14} />
                    Salvar Variação
                  </button>
                </div>

              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Testimonial Sub-modal */}
      <AnimatePresence>
        {isTestimonialModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/90 backdrop-blur-sm"
              onClick={() => setIsTestimonialModalOpen(false)}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md bg-zinc-950 border border-white/10 rounded-[2rem] shadow-2xl flex flex-col z-10 text-white"
            >
              <div className="p-6 border-b border-white/5 flex items-center justify-between">
                <h3 className="font-bold text-white text-base">
                  {editingTestimonialIdx !== null ? "Editar Depoimento" : "Adicionar Depoimento"}
                </h3>
                <button 
                  onClick={() => setIsTestimonialModalOpen(false)} 
                  className="p-1.5 hover:bg-white/5 rounded-lg text-zinc-500 hover:text-white transition-all cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>

              <form onSubmit={handleSaveTestimonial} className="p-6 space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Nome do Produtor</label>
                  <input
                    type="text"
                    required
                    value={testimonialForm.name}
                    onChange={e => setTestimonialForm({...testimonialForm, name: e.target.value})}
                    placeholder="Ex: João da Silva"
                    className="w-full bg-zinc-900 border border-white/10 rounded-2xl py-3 px-4 text-white text-xs focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Avaliação (1 a 5 estrelas)</label>
                    <select
                      value={testimonialForm.rating}
                      onChange={e => setTestimonialForm({...testimonialForm, rating: parseInt(e.target.value) || 5})}
                      className="w-full bg-zinc-900 border border-white/10 rounded-2xl py-3 px-4 text-white text-xs focus:outline-none h-[42px] cursor-pointer"
                    >
                      <option value="5">5 Estrelas</option>
                      <option value="4">4 Estrelas</option>
                      <option value="3">3 Estrelas</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">URL do Avatar</label>
                    <input
                      type="text"
                      value={testimonialForm.avatar_url}
                      onChange={e => setTestimonialForm({...testimonialForm, avatar_url: e.target.value})}
                      placeholder="https://..."
                      className="w-full bg-zinc-900 border border-white/10 rounded-2xl py-3 px-4 text-white text-xs focus:outline-none text-[10px]"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Texto do Depoimento</label>
                  <textarea
                    rows={3}
                    required
                    value={testimonialForm.text}
                    onChange={e => setTestimonialForm({...testimonialForm, text: e.target.value})}
                    placeholder="O que o produtor achou do sistema..."
                    className="w-full bg-zinc-900 border border-white/10 rounded-2xl py-3 px-4 text-white text-xs focus:outline-none resize-none font-semibold"
                  />
                </div>

                <div className="flex gap-3 border-t border-white/5 pt-4">
                  <button 
                    type="button" 
                    onClick={() => setIsTestimonialModalOpen(false)}
                    className="flex-1 bg-white/5 hover:bg-white/10 text-white font-bold py-3 rounded-xl transition-all cursor-pointer text-[10px] uppercase tracking-wider"
                  >
                    Voltar
                  </button>
                  <button 
                    type="submit"
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl transition-all cursor-pointer text-[10px] uppercase tracking-wider"
                  >
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
