import React, { useState, useEffect } from "react";
import Layout from "../../components/Layout/Layout";
import { motion, AnimatePresence } from "motion/react";
import { 
  User, 
  MapPin, 
  CreditCard, 
  Save, 
  Check, 
  Building,
  AlertTriangle,
  Shield,
  HelpCircle,
  Plus,
  Trash2,
  Edit2,
  Loader2,
  X
} from "lucide-react";
import toast from "react-hot-toast";
import { useAuth } from "../../contexts/AuthContext";
import { supabase } from "../../lib/supabase";

export default function UserProfile() {
  const { user, profile } = useAuth();
  const [activeTab, setActiveTab] = useState<"personal" | "farm" | "billing">("personal");
  const [isSaving, setIsSaving] = useState(false);

  // Form states
  const [personalData, setPersonalData] = useState({
    name: profile?.name || "Produtor Rural",
    email: profile?.email || user?.email || "contato@bananalpro.com.br",
    phone: "(31) 99999-8888",
    document: "123.456.789-00"
  });

  const [areas, setAreas] = useState<any[]>([]);
  const [loadingAreas, setLoadingAreas] = useState(false);
  const [showAreaModal, setShowAreaModal] = useState(false);
  const [editingArea, setEditingArea] = useState<any | null>(null);

  // Modal form state
  const [areaForm, setAreaForm] = useState({
    name: "",
    propertyName: "",
    sizeHectares: "",
    city: "",
    state: "",
    bananaVariety: "prata-ana"
  });

  const [subscription, setSubscription] = useState({
    planName: "Plano Profissional Anual",
    value: "R$ 799,00/ano",
    status: "Ativo",
    nextBilling: "30 de Maio de 2027",
    paymentMethod: "•••• •••• •••• 4242 (Mastercard)"
  });

  const fetchAreas = async () => {
    if (!profile?.id) return;
    setLoadingAreas(true);
    try {
      const { data, error } = await supabase
        .from("producer_areas")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      setAreas(data || []);
    } catch (err) {
      console.error("Error fetching areas:", err);
      toast.error("Erro ao carregar suas áreas.");
    } finally {
      setLoadingAreas(false);
    }
  };

  useEffect(() => {
    if (activeTab === "farm" && profile?.id) {
      fetchAreas();
    }
  }, [activeTab, profile]);

  const handlePersonalSave = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      toast.success("Dados pessoais salvos com sucesso!", {
        style: {
          borderRadius: "1rem",
          background: "#05160f",
          color: "#ecfdf5",
          border: "1px solid rgba(117, 252, 167, 0.15)",
          fontSize: "12px",
          fontWeight: "bold"
        }
      });
    }, 1200);
  };

  const handleSaveArea = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile?.id) {
      toast.error("Usuário não identificado.");
      return;
    }
    if (!areaForm.name.trim() || !areaForm.propertyName.trim() || !areaForm.city.trim() || !areaForm.state.trim()) {
      toast.error("Preencha todos os campos obrigatórios.");
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        user_id: profile.id,
        name: areaForm.name.trim(),
        property_name: areaForm.propertyName.trim(),
        size_hectares: parseFloat(areaForm.sizeHectares) || 0,
        city: areaForm.city.trim(),
        state: areaForm.state.trim().toUpperCase(),
        banana_variety: areaForm.bananaVariety
      };

      if (editingArea) {
        const { error } = await supabase
          .from("producer_areas")
          .update(payload)
          .eq("id", editingArea.id);
        if (error) throw error;
        toast.success("Área atualizada com sucesso!", {
          style: {
            borderRadius: "1rem",
            background: "#05160f",
            color: "#ecfdf5",
            border: "1px solid rgba(117, 252, 167, 0.15)",
            fontSize: "12px",
            fontWeight: "bold"
          }
        });
      } else {
        const { error } = await supabase
          .from("producer_areas")
          .insert([payload]);
        if (error) throw error;
        toast.success("Área cadastrada com sucesso!", {
          style: {
            borderRadius: "1rem",
            background: "#05160f",
            color: "#ecfdf5",
            border: "1px solid rgba(117, 252, 167, 0.15)",
            fontSize: "12px",
            fontWeight: "bold"
          }
        });
      }

      setShowAreaModal(false);
      setEditingArea(null);
      setAreaForm({
        name: "",
        propertyName: "",
        sizeHectares: "",
        city: "",
        state: "",
        bananaVariety: "prata-ana"
      });
      fetchAreas();
    } catch (err) {
      console.error("Error saving area:", err);
      toast.error("Erro ao salvar área no Supabase.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteArea = async (id: number) => {
    if (!confirm("Tem certeza que deseja excluir esta área? Essa ação é permanente e os laudos vinculados a esta gleba perderão o vínculo.")) return;
    try {
      const { error } = await supabase
        .from("producer_areas")
        .delete()
        .eq("id", id);
      if (error) throw error;
      toast.success("Área excluída com sucesso!", {
        style: {
          borderRadius: "1rem",
          background: "#05160f",
          color: "#ecfdf5",
          border: "1px solid rgba(117, 252, 167, 0.15)",
          fontSize: "12px",
          fontWeight: "bold"
        }
      });
      fetchAreas();
    } catch (err) {
      console.error("Error deleting area:", err);
      toast.error("Erro ao excluir área.");
    }
  };

  const openAddModal = () => {
    setEditingArea(null);
    setAreaForm({
      name: "",
      propertyName: "",
      sizeHectares: "",
      city: "",
      state: "",
      bananaVariety: "prata-ana"
    });
    setShowAreaModal(true);
  };

  const openEditModal = (area: any) => {
    setEditingArea(area);
    setAreaForm({
      name: area.name,
      propertyName: area.property_name,
      sizeHectares: String(area.size_hectares),
      city: area.city,
      state: area.state,
      bananaVariety: area.banana_variety
    });
    setShowAreaModal(true);
  };

  const getVarietyLabel = (variety: string) => {
    switch (variety) {
      case "prata-ana": return "Banana Prata Anã";
      case "nanica": return "Banana Nanica (Cavendish)";
      case "maca": return "Banana Maçã";
      case "terra": return "Banana da Terra";
      case "ouro": return "Banana Ouro";
      default: return variety;
    }
  };

  const handleCancelSubscription = () => {
    toast.error("Para cancelar ou alterar sua assinatura, entre em contato direto pelo suporte no WhatsApp.", {
      duration: 5000,
      style: {
        borderRadius: "1rem",
        background: "#160505",
        color: "#fdecfe",
        border: "1px solid rgba(252, 117, 117, 0.15)",
        fontSize: "12px",
        fontWeight: "bold"
      }
    });
  };

  const tabs = [
    { id: "personal", label: "Dados Pessoais", icon: <User size={16} /> },
    { id: "farm", label: "Minhas Áreas", icon: <Building size={16} /> },
    { id: "billing", label: "Assinatura & Cobrança", icon: <CreditCard size={16} /> }
  ];

  return (
    <Layout>
      <div className="space-y-8 pb-12">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-headline font-bold text-white flex items-center gap-3">
            <User className="text-emerald-500 w-8 h-8" />
            Configurações da Conta
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Gerencie suas informações pessoais, configurações da fazenda e detalhes de cobrança.
          </p>
        </div>

        {/* Tab Buttons */}
        <div className="flex border-b border-white/10 gap-6">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 pb-4 font-bold text-xs uppercase tracking-wider transition-all relative cursor-pointer ${
                activeTab === tab.id ? "text-emerald-400" : "text-slate-400 hover:text-white"
              }`}
            >
              {tab.icon}
              {tab.label}
              {activeTab === tab.id && (
                <motion.div 
                  layoutId="profileTabLine"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-500" 
                />
              )}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="max-w-3xl">
          <AnimatePresence mode="wait">
            
            {/* Tab: Personal Data */}
            {activeTab === "personal" && (
              <motion.div
                key="personal-tab"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="glass-card p-8 rounded-[2.5rem] border-white/5"
              >
                <form onSubmit={handlePersonalSave} className="space-y-6">
                  <div>
                    <h3 className="text-lg font-bold text-white">Dados de Acesso</h3>
                    <p className="text-slate-500 text-xs mt-1">Mantenha seu e-mail e contato atualizados para comunicados importantes.</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-white uppercase tracking-wider block">Nome Completo</label>
                      <input 
                        type="text" 
                        value={personalData.name}
                        onChange={(e) => setPersonalData({ ...personalData, name: e.target.value })}
                        className="w-full bg-zinc-950 border border-white/10 rounded-xl px-4 py-3 text-xs text-white focus:border-emerald-500/50 focus:outline-none transition-colors"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-white uppercase tracking-wider block">WhatsApp / Celular</label>
                      <input 
                        type="text" 
                        value={personalData.phone}
                        onChange={(e) => setPersonalData({ ...personalData, phone: e.target.value })}
                        className="w-full bg-zinc-950 border border-white/10 rounded-xl px-4 py-3 text-xs text-white focus:border-emerald-500/50 focus:outline-none transition-colors"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">CPF / CNPJ (Não editável)</label>
                      <input 
                        type="text" 
                        disabled
                        value={personalData.document}
                        className="w-full bg-zinc-900/50 border border-white/5 rounded-xl px-4 py-3 text-xs text-slate-500 cursor-not-allowed"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">E-mail Cadastrado</label>
                      <input 
                        type="email" 
                        disabled
                        value={personalData.email}
                        className="w-full bg-zinc-900/50 border border-white/5 rounded-xl px-4 py-3 text-xs text-slate-500 cursor-not-allowed"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end pt-4 border-t border-white/5">
                    <button
                      type="submit"
                      disabled={isSaving}
                      className="bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-3 rounded-xl font-bold text-xs tracking-wider uppercase transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      {isSaving ? "Salvando..." : "Salvar Alterações"}
                      <Save size={14} />
                    </button>
                  </div>
                </form>
              </motion.div>
            )}

            {/* Tab: Farm Areas */}
            {activeTab === "farm" && (
              <motion.div
                key="farm-tab"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6"
              >
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div>
                    <h3 className="text-xl font-bold text-white">Áreas e Talhões Monitorados</h3>
                    <p className="text-slate-500 text-xs mt-1">
                      Cadastre e gerencie suas diferentes propriedades e glebas produtivas para calibração de clima e análises.
                    </p>
                  </div>
                  <button
                    onClick={openAddModal}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2.5 rounded-xl font-bold text-xs tracking-wider uppercase transition-all flex items-center gap-1.5 cursor-pointer shadow-lg shadow-emerald-950/20"
                  >
                    <Plus size={14} />
                    Nova Área
                  </button>
                </div>

                {loadingAreas ? (
                  <div className="glass-card p-12 rounded-[2.5rem] border-white/5 flex flex-col items-center justify-center text-center space-y-4">
                    <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
                    <p className="text-xs text-slate-500 uppercase tracking-widest font-bold">Carregando áreas...</p>
                  </div>
                ) : areas.length === 0 ? (
                  <div className="glass-card p-12 rounded-[2.5rem] border-white/5 text-center flex flex-col items-center justify-center min-h-[250px] space-y-4">
                    <Building className="text-slate-600 w-12 h-12" />
                    <div>
                      <h4 className="text-white font-bold text-base">Nenhuma área cadastrada</h4>
                      <p className="text-slate-500 text-xs mt-1 max-w-sm mx-auto">
                        Você ainda não cadastrou nenhuma gleba ou fazenda. Adicione sua primeira área para ativar o monitoramento de clima localizado e laudos agronômicos estruturados.
                      </p>
                    </div>
                    <button
                      onClick={openAddModal}
                      className="bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-3 rounded-xl font-bold text-xs tracking-wider uppercase transition-all flex items-center gap-1.5 cursor-pointer shadow-md"
                    >
                      <Plus size={14} />
                      Cadastrar Primeira Área
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {areas.map((area) => (
                      <div 
                        key={area.id} 
                        className="glass-card p-6 rounded-3xl border-white/5 bg-zinc-950/40 flex flex-col justify-between relative group hover:border-emerald-500/20 transition-all duration-300"
                      >
                        {/* Actions */}
                        <div className="absolute top-4 right-4 flex gap-1 opacity-0 group-hover:opacity-100 transition-all">
                          <button
                            onClick={() => openEditModal(area)}
                            className="p-2 rounded-lg hover:bg-white/5 text-slate-400 hover:text-white transition-colors cursor-pointer"
                            title="Editar Área"
                          >
                            <Edit2 size={12} />
                          </button>
                          <button
                            onClick={() => handleDeleteArea(area.id)}
                            className="p-2 rounded-lg hover:bg-red-500/10 text-slate-400 hover:text-red-400 transition-colors cursor-pointer"
                            title="Excluir"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>

                        <div className="space-y-4">
                          <div>
                            <span className="text-[9px] font-black uppercase text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/15">
                              {area.property_name}
                            </span>
                            <h4 className="text-lg font-bold text-white mt-2 truncate pr-16">{area.name}</h4>
                          </div>

                          <div className="grid grid-cols-2 gap-4 border-t border-white/5 pt-4">
                            <div>
                              <p className="text-[9px] text-slate-500 uppercase font-black">Tamanho</p>
                              <p className="text-sm font-bold text-white">{area.size_hectares} <span className="text-[10px] text-slate-500">ha</span></p>
                            </div>
                            <div>
                              <p className="text-[9px] text-slate-500 uppercase font-black">Localização</p>
                              <p className="text-sm font-bold text-white flex items-center gap-1">
                                <MapPin size={12} className="text-emerald-500" />
                                <span className="truncate">{area.city} - {area.state}</span>
                              </p>
                            </div>
                          </div>
                          
                          <div className="bg-white/[0.02] border border-white/5 p-3 rounded-xl flex items-center justify-between">
                            <span className="text-[9px] text-slate-500 font-bold uppercase">Variedade Principal</span>
                            <span className="text-[10px] font-bold text-white bg-zinc-900 px-2.5 py-1 rounded-lg border border-white/5">
                              {getVarietyLabel(area.banana_variety)}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}

            {/* Tab: Billing */}
            {activeTab === "billing" && (
              <motion.div
                key="billing-tab"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6"
              >
                {/* Subscription Details Card */}
                <div className="glass-card p-8 rounded-[2.5rem] border-white/5 space-y-6">
                  <div className="flex items-center justify-between flex-wrap gap-4">
                    <div>
                      <span className="text-[9px] font-black uppercase tracking-widest text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
                        {subscription.status}
                      </span>
                      <h3 className="text-xl font-bold text-white mt-3">{subscription.planName}</h3>
                      <p className="text-slate-400 text-xs mt-1">Acesso irrestrito a todas as ferramentas agrícolas e consultorias.</p>
                    </div>

                    <div className="bg-emerald-500/5 dark:bg-emerald-950/20 border border-emerald-500/10 dark:border-emerald-900/30 p-6 rounded-2xl text-center">
                      <span className="text-[10px] font-bold text-slate-400 block uppercase">Valor Contratado</span>
                      <span className="text-2xl font-black text-white mt-1 block">{subscription.value}</span>
                    </div>
                  </div>

                  <div className="border-t border-white/5 pt-4 space-y-3">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-500">Próxima Renovação:</span>
                      <span className="text-white font-bold">{subscription.nextBilling}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-500">Método de Faturamento:</span>
                      <span className="text-white font-bold">{subscription.paymentMethod}</span>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-4 pt-4 border-t border-white/5">
                    <button
                      onClick={handleCancelSubscription}
                      className="bg-white/5 border border-white/10 hover:bg-red-500/10 hover:border-red-500/20 text-slate-300 hover:text-red-400 px-6 py-3.5 rounded-xl font-bold text-xs tracking-wider uppercase transition-all flex items-center justify-center cursor-pointer"
                    >
                      Cancelar Assinatura
                    </button>
                    <a
                      href="https://wa.me/5531999999999"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-3.5 rounded-xl font-bold text-xs tracking-wider uppercase transition-all flex-1 text-center font-inter justify-center flex items-center"
                    >
                      Falar com Consultor Financeiro
                    </a>
                  </div>
                </div>

                {/* Secure Badge */}
                <div className="bg-emerald-500/5 dark:bg-emerald-950/20 border border-emerald-500/10 dark:border-emerald-950 p-6 rounded-3xl flex gap-4 items-start">
                  <Shield className="text-emerald-400 shrink-0 w-6 h-6 mt-1" />
                  <div className="space-y-1">
                    <h4 className="text-white font-bold text-xs">Faturamento Seguro e Criptografado</h4>
                    <p className="text-slate-500 text-xs leading-relaxed">
                      Nossa plataforma utiliza criptografia SSL ponta a ponta e processamento através da Iugu/Stripe. Não armazenamos informações brutas do seu cartão de crédito nos nossos servidores.
                    </p>
                  </div>
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </div>

      {/* AREA MODAL */}
      <AnimatePresence>
        {showAreaModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAreaModal(false)}
              className="fixed inset-0 bg-black/80 backdrop-blur-md"
            />

            <motion.div
              initial={{ scale: 0.95, y: 20, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.95, y: 20, opacity: 0 }}
              className="bg-zinc-950 border border-white/10 rounded-[2.5rem] w-full max-w-lg p-8 relative z-10 overflow-hidden shadow-2xl space-y-6"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-white font-headline">
                  {editingArea ? "Editar Área/Talhão" : "Nova Área de Monitoramento"}
                </h3>
                <button
                  onClick={() => setShowAreaModal(false)}
                  className="p-1.5 rounded-lg hover:bg-white/5 text-zinc-400 hover:text-white transition-colors cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleSaveArea} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-white uppercase tracking-wider block">Identificação / Nome do Talhão *</label>
                    <input
                      type="text"
                      required
                      value={areaForm.name}
                      onChange={(e) => setAreaForm({ ...areaForm, name: e.target.value })}
                      placeholder="Ex: Talhão Norte, Gleba B"
                      className="w-full bg-black/40 border border-white/10 rounded-2xl py-3 px-4 text-white text-xs focus:outline-none focus:border-emerald-500/50"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-white uppercase tracking-wider block">Nome da Propriedade / Fazenda *</label>
                    <input
                      type="text"
                      required
                      value={areaForm.propertyName}
                      onChange={(e) => setAreaForm({ ...areaForm, propertyName: e.target.value })}
                      placeholder="Ex: Fazenda Bananal, Sítio Alegre"
                      className="w-full bg-black/40 border border-white/10 rounded-2xl py-3 px-4 text-white text-xs focus:outline-none focus:border-emerald-500/50"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-white uppercase tracking-wider block">Área (Hectares) *</label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={areaForm.sizeHectares}
                      onChange={(e) => setAreaForm({ ...areaForm, sizeHectares: e.target.value })}
                      placeholder="Ex: 5.5"
                      className="w-full bg-black/40 border border-white/10 rounded-2xl py-3 px-4 text-white text-xs focus:outline-none focus:border-emerald-500/50"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-white uppercase tracking-wider block">Cidade *</label>
                    <input
                      type="text"
                      required
                      value={areaForm.city}
                      onChange={(e) => setAreaForm({ ...areaForm, city: e.target.value })}
                      placeholder="Ex: Sete Lagoas"
                      className="w-full bg-black/40 border border-white/10 rounded-2xl py-3 px-4 text-white text-xs focus:outline-none focus:border-emerald-500/50"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-white uppercase tracking-wider block">Estado (UF) *</label>
                    <input
                      type="text"
                      required
                      maxLength={2}
                      value={areaForm.state}
                      onChange={(e) => setAreaForm({ ...areaForm, state: e.target.value })}
                      placeholder="Ex: MG"
                      className="w-full bg-black/40 border border-white/10 rounded-2xl py-3 px-4 text-white text-xs focus:outline-none focus:border-emerald-500/50 uppercase"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-white uppercase tracking-wider block">Variedade Principal Cultivada *</label>
                  <select
                    value={areaForm.bananaVariety}
                    onChange={(e) => setAreaForm({ ...areaForm, bananaVariety: e.target.value })}
                    className="w-full bg-black/40 border border-white/10 rounded-2xl py-3 px-4 text-white text-xs focus:outline-none focus:border-emerald-500/50"
                  >
                    <option value="prata-ana">Banana Prata Anã</option>
                    <option value="nanica">Banana Nanica (Cavendish)</option>
                    <option value="maca">Banana Maçã</option>
                    <option value="terra">Banana da Terra</option>
                    <option value="ouro">Banana Ouro</option>
                  </select>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3.5 rounded-2xl transition-all cursor-pointer text-xs uppercase tracking-wider shadow-md flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Salvando...
                      </>
                    ) : (
                      "Salvar Área"
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAreaModal(false)}
                    className="px-6 border border-white/10 hover:bg-white/5 text-zinc-400 hover:text-white font-bold rounded-2xl transition-colors cursor-pointer text-xs uppercase tracking-wider"
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
