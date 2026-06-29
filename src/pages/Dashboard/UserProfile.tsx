import React, { useState, useEffect } from "react";
import Layout from "../../components/Layout/Layout";
import { Link } from "react-router-dom";
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
  X,
  Camera,
  Sparkles
} from "lucide-react";
import toast from "react-hot-toast";
import { useAuth } from "../../contexts/AuthContext";
import { supabase } from "../../lib/supabase";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function UserProfile() {
  const { user, profile, refreshProfile } = useAuth();
  const [activeTab, setActiveTab] = useState<"personal" | "farm" | "billing">("personal");
  const [isSaving, setIsSaving] = useState(false);

  // Form states
  const [personalData, setPersonalData] = useState({
    name: profile?.full_name || profile?.name || "Produtor Rural",
    email: profile?.email || user?.email || "contato@bananalpro.com.br",
    phone: profile?.phone || "(31) 99999-8888",
    document: profile?.cpf || "123.456.789-00"
  });

  useEffect(() => {
    if (profile) {
      setPersonalData({
        name: profile.full_name || profile.name || "Produtor Rural",
        email: profile.email || user?.email || "contato@bananalpro.com.br",
        phone: profile.phone || "(31) 99999-8888",
        document: profile.cpf || "123.456.789-00"
      });
    }
  }, [profile, user]);

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
    bananaVariety: "prata-ana",
    cep: "",
    address: ""
  });

  const [subscription, setSubscription] = useState<any>(null);
  const [loadingSubscription, setLoadingSubscription] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [isCanceling, setIsCanceling] = useState(false);

  const [uploadingAvatar, setUploadingAvatar] = useState(false);

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

  const fetchSubscriptionInfo = async () => {
    if (!profile?.id) return;
    setLoadingSubscription(true);
    try {
      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .eq("user_id", profile.id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      if (data && data.length > 0) {
        // Find latest active or cancelled order
        const latestOrder = data.find(o => o.status === 'paid' || o.status === 'cancelled');
        
        if (latestOrder) {
          const isMonthly = latestOrder.total_amount <= 150;
          const daysLimit = isMonthly ? 30 : 365;
          const orderDate = new Date(latestOrder.created_at);
          const expiryDate = new Date(orderDate.getTime() + daysLimit * 24 * 60 * 60 * 1000);
          
          setSubscription({
            id: latestOrder.id,
            planName: isMonthly ? "Plano Mensal" : "Plano Anual (Membro Fundador)",
            value: isMonthly ? "R$ 97,00/mês" : "R$ 497,00/ano",
            status: latestOrder.status === 'cancelled' ? 'Cancelamento Solicitado' : 'Ativo',
            nextBilling: format(expiryDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR }),
            paymentMethod: latestOrder.payment_method || "PIX",
            isCancelled: latestOrder.status === 'cancelled',
            expiryDate: expiryDate
          });
        } else {
          setSubscription(null);
        }
      } else {
        setSubscription(null);
      }
    } catch (err) {
      console.error("Error fetching subscription:", err);
    } finally {
      setLoadingSubscription(false);
    }
  };

  useEffect(() => {
    if (activeTab === "farm" && profile?.id) {
      fetchAreas();
    }
    if (activeTab === "billing" && profile?.id) {
      fetchSubscriptionInfo();
    }
  }, [activeTab, profile]);

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !profile?.id) return;

    if (file.size > 2 * 1024 * 1024) {
      toast.error("A imagem deve ter no máximo 2MB.");
      return;
    }

    setUploadingAvatar(true);
    const toastId = toast.loading("Enviando nova foto de perfil...");

    try {
      const fileExt = file.name.split('.').pop()?.toLowerCase() || 'png';
      const filePath = `${user?.id || profile.mocha_user_id}/avatar-${Date.now()}.${fileExt}`;

      let finalImageUrl = "";

      try {
        // 1. Tenta fazer upload para 'visual-diagnostics'
        let uploadResult = await supabase.storage
          .from('visual-diagnostics')
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: true
          });

        let uploadError = uploadResult.error;
        let bucketUsed = 'visual-diagnostics';

        if (uploadError) {
          // Fallback para 'library-files'
          const fallbackResult = await supabase.storage
            .from('library-files')
            .upload(filePath, file, {
              cacheControl: '3600',
              upsert: true
            });
          uploadError = fallbackResult.error;
          bucketUsed = 'library-files';
        }

        if (uploadError) throw uploadError;

        // Obter URL pública
        const { data: { publicUrl } } = supabase.storage
          .from(bucketUsed)
          .getPublicUrl(filePath);

        finalImageUrl = publicUrl;
      } catch (uploadErr) {
        console.warn("Falha no upload físico para o Storage. Convertendo para base64 como contingência...", uploadErr);
        // Fallback supremo: converter para base64
        const base64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = (err) => reject(err);
          reader.readAsDataURL(file);
        });
        finalImageUrl = base64;
      }

      // Atualizar o avatar_url no banco de dados imediatamente
      const { error: dbError } = await supabase
        .from("user_profiles")
        .update({ avatar_url: finalImageUrl })
        .eq("id", profile.id);

      if (dbError) throw dbError;

      toast.success("Foto de perfil atualizada!", { id: toastId });
      
      // Atualizar o estado global
      if (typeof refreshProfile === 'function') {
        await refreshProfile();
      }
    } catch (err) {
      console.error("Error uploading avatar:", err);
      toast.error("Erro ao fazer upload da foto de perfil.", { id: toastId });
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handlePersonalSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile?.id) {
      toast.error("Usuário não identificado.");
      return;
    }
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from("user_profiles")
        .update({
          full_name: personalData.name.trim(),
          phone: personalData.phone.trim()
        })
        .eq("id", profile.id);

      if (error) throw error;

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
      
      if (typeof refreshProfile === 'function') {
        await refreshProfile();
      }
    } catch (err) {
      console.error("Error saving profile name:", err);
      toast.error("Erro ao salvar dados.");
    } finally {
      setIsSaving(false);
    }
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
        banana_variety: areaForm.bananaVariety,
        cep: areaForm.cep.trim() || null,
        address: areaForm.address.trim() || null
      };

      if (editingArea) {
        const { error } = await supabase
          .from("producer_areas")
          .update(payload)
          .eq("id", editingArea.id);
        if (error) throw error;
        toast.success("Área updated com sucesso!", {
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
        bananaVariety: "prata-ana",
        cep: "",
        address: ""
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
      bananaVariety: "prata-ana",
      cep: "",
      address: ""
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
      bananaVariety: area.banana_variety,
      cep: area.cep || "",
      address: area.address || ""
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
    setShowCancelModal(true);
  };

  const handleConfirmCancel = async () => {
    if (!subscription?.id) return;
    setIsCanceling(true);
    try {
      const { error } = await supabase
        .from("orders")
        .update({ status: "cancelled", updated_at: new Date().toISOString() })
        .eq("id", subscription.id);

      if (error) throw error;

      toast.success("Cancelamento solicitado! Seu acesso continua garantido até o vencimento.", {
        duration: 5000
      });
      
      setShowCancelModal(false);
      await fetchSubscriptionInfo();
    } catch (err) {
      console.error("Error canceling subscription:", err);
      toast.error("Erro ao solicitar cancelamento. Tente novamente.");
    } finally {
      setIsCanceling(false);
    }
  };

  const tabs = [
    { id: "personal", label: "Dados Pessoais", icon: <User size={16} /> },
    { id: "farm", label: "Minhas Áreas", icon: <Building size={16} /> },
    { id: "billing", label: "Assinatura & Cobrança", icon: <CreditCard size={16} /> }
  ];

  return (
    <Layout>
      <div className="space-y-6 pb-12 -mt-4 md:-mt-8">
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
        <div className="hero-banner-container flex border-b border-slate-100 dark:border-white/10 gap-6">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 pb-4 font-bold text-xs uppercase tracking-wider transition-all relative cursor-pointer !bg-transparent !border-none !rounded-none ${
                activeTab === tab.id ? "!text-[#589c1c] dark:!text-[#6ee7b7]" : "text-slate-400 hover:text-slate-800 dark:hover:text-white"
              }`}
            >
              {React.cloneElement(tab.icon, { className: activeTab === tab.id ? "text-[#589c1c] dark:text-[#6ee7b7]" : "text-slate-400" })}
              {tab.label}
              {activeTab === tab.id && (
                <motion.div 
                  layoutId="profileTabLine"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#589c1c] dark:bg-[#6ee7b7]" 
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
                  {/* Foto de Perfil */}
                  <div className="flex flex-col sm:flex-row items-center gap-6 pb-6 border-b border-slate-100 dark:border-white/5">
                    <div className="relative group/avatar w-20 h-20 rounded-full border border-emerald-500/20 p-[2px] bg-emerald-900/10 overflow-hidden shrink-0">
                      <img 
                        src={profile?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${personalData.name}`} 
                        alt="Avatar" 
                        className="w-full h-full object-cover rounded-full"
                      />
                      {uploadingAvatar && (
                        <div className="absolute inset-0 bg-black/60 flex items-center justify-center rounded-full">
                          <Loader2 className="w-5 h-5 text-emerald-400 animate-spin" />
                        </div>
                      )}
                    </div>
                    
                    <div className="space-y-1.5 text-center sm:text-left">
                      <h4 className="text-sm font-bold text-white">Foto de Perfil</h4>
                      <p className="text-xs text-zinc-500">Formatos suportados: PNG, JPG ou GIF. Máximo de 2MB.</p>
                      <div className="pt-1">
                        <label className="bg-[#589c1c] hover:bg-[#478016] text-white font-bold text-[10px] uppercase tracking-wider px-4 py-2 rounded-xl cursor-pointer transition-colors inline-block">
                          Alterar Foto
                          <input 
                            type="file" 
                            accept="image/*" 
                            onChange={handleAvatarChange} 
                            disabled={uploadingAvatar}
                            className="hidden" 
                          />
                        </label>
                      </div>
                    </div>
                  </div>

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

                          {(area.cep || area.address) && (
                            <div className="bg-white/[0.01] border border-white/5 p-3 rounded-xl space-y-1.5 text-xs">
                              {area.address && (
                                <div className="flex items-start gap-1.5">
                                  <span className="text-[9px] text-slate-500 uppercase font-black shrink-0 mt-0.5">Endereço:</span>
                                  <span className="text-white truncate font-medium" title={area.address}>{area.address}</span>
                                </div>
                              )}
                              {area.cep && (
                                <div className="flex items-center gap-1.5">
                                  <span className="text-[9px] text-slate-500 uppercase font-black shrink-0">CEP:</span>
                                  <span className="text-white font-medium">{area.cep}</span>
                                </div>
                              )}
                            </div>
                          )}
                          
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
                {loadingSubscription ? (
                  <div className="glass-card p-12 rounded-[2.5rem] border-white/5 flex flex-col items-center justify-center gap-3">
                    <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
                    <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest">Carregando assinatura...</p>
                  </div>
                ) : !subscription ? (
                  <div className="glass-card p-8 rounded-[2.5rem] border-white/5 text-center space-y-4">
                    <div className="w-12 h-12 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center mx-auto text-zinc-450">
                      <CreditCard size={20} />
                    </div>
                    <div className="space-y-1">
                      <p className="text-white text-sm font-bold">Nenhuma assinatura ativa encontrada</p>
                      <p className="text-zinc-500 text-xs leading-relaxed max-w-sm mx-auto">
                        Para liberar o seu acesso completo aos cursos técnicos, suporte com agrônomos e ferramentas agrícolas inteligentes, conclua sua contratação.
                      </p>
                    </div>
                    <Link 
                      to="/checkout" 
                      className="inline-block bg-emerald-600 hover:bg-emerald-500 text-white px-8 py-3.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all cursor-pointer hover:scale-[1.01] active:scale-95 shadow-md shadow-emerald-500/10"
                    >
                      Contratar Assinatura Agora
                    </Link>
                  </div>
                ) : (
                  <>
                    {/* Subscription Details Card */}
                    <div className="glass-card p-8 rounded-[2.5rem] border-white/5 space-y-6">
                      <div className="flex items-center justify-between flex-wrap gap-4">
                        <div>
                          <span className={`text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full border ${
                            subscription.status === 'Ativo' 
                              ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' 
                              : 'text-amber-500 bg-amber-500/10 border-amber-500/20 animate-pulse'
                          }`}>
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

                      <div className="border-t border-white/5 pt-4 space-y-3 font-sans">
                        <div className="flex justify-between text-xs">
                          <span className="text-slate-500">
                            {subscription.isCancelled ? 'Vencimento do Acesso:' : 'Próxima Renovação:'}
                          </span>
                          <span className="text-white font-bold">{subscription.nextBilling}</span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-slate-500">Método de Faturamento:</span>
                          <span className="text-white font-bold">{subscription.paymentMethod}</span>
                        </div>
                      </div>

                      {subscription.isCancelled && (
                        <div className="p-4 bg-amber-500/5 rounded-2xl border border-amber-500/15 text-left text-xs text-amber-500 font-semibold leading-relaxed font-sans">
                          ⚠️ Cancelamento solicitado. Seu acesso à plataforma continuará ativo e garantido até {subscription.nextBilling}. Após essa data, o seu acesso às ferramentas completas será revogado.
                        </div>
                      )}

                      <div className="flex flex-wrap gap-4 pt-4 border-t border-white/5">
                        {!subscription.isCancelled && (
                          <button
                            onClick={handleCancelSubscription}
                            className="bg-white/5 border border-white/10 hover:bg-red-500/10 hover:border-red-500/20 text-slate-300 hover:text-red-400 px-6 py-3.5 rounded-xl font-bold text-xs tracking-wider uppercase transition-all flex items-center justify-center cursor-pointer"
                          >
                            Cancelar Assinatura
                          </button>
                        )}
                        <a
                          href="https://wa.me/5521969014654"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-3.5 rounded-xl font-bold text-xs tracking-wider uppercase transition-all flex-1 text-center font-inter justify-center flex items-center"
                        >
                          Falar com Consultor Financeiro
                        </a>
                      </div>
                    </div>

                    {/* Secure Badge */}
                    <div className="bg-emerald-500/5 dark:bg-emerald-950/20 border border-emerald-500/10 dark:border-emerald-950 p-6 rounded-3xl flex gap-4 items-start font-sans">
                      <Shield className="text-emerald-400 shrink-0 w-6 h-6 mt-1" />
                      <div className="space-y-1">
                        <h4 className="text-white font-bold text-xs">Faturamento Seguro e Criptografado</h4>
                        <p className="text-slate-550 dark:text-zinc-500 text-[11px] leading-relaxed">
                          Nossa plataforma utiliza criptografia SSL ponta a ponta e processamento através da InfinitePay. Não armazenamos informações brutas do seu cartão de crédito nos nossos servidores.
                        </p>
                      </div>
                    </div>
                  </>
                )}
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

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-white uppercase tracking-wider block">CEP da Área</label>
                    <input
                      type="text"
                      value={areaForm.cep}
                      onChange={(e) => setAreaForm({ ...areaForm, cep: e.target.value })}
                      placeholder="Ex: 35700-000"
                      className="w-full bg-black/40 border border-white/10 rounded-2xl py-3 px-4 text-white text-xs focus:outline-none focus:border-emerald-500/50"
                    />
                  </div>

                  <div className="md:col-span-2 space-y-1">
                    <label className="text-[10px] font-bold text-white uppercase tracking-wider block">Endereço / Localização Rural</label>
                    <input
                      type="text"
                      value={areaForm.address}
                      onChange={(e) => setAreaForm({ ...areaForm, address: e.target.value })}
                      placeholder="Ex: Rodovia MG-238, Km 12"
                      className="w-full bg-black/40 border border-white/10 rounded-2xl py-3 px-4 text-white text-xs focus:outline-none focus:border-emerald-500/50"
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

      {/* CANCEL SUBSCRIPTION MODAL */}
      <AnimatePresence>
        {showCancelModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowCancelModal(false)}
              className="fixed inset-0 bg-black/80 backdrop-blur-md"
            />

            <motion.div
              initial={{ scale: 0.95, y: 20, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.95, y: 20, opacity: 0 }}
              className="bg-zinc-950 border border-white/10 rounded-[2.5rem] w-full max-w-md p-8 relative z-10 overflow-hidden shadow-2xl space-y-6 text-center font-sans"
            >
              <div className="mx-auto w-12 h-12 rounded-2xl bg-red-500/10 border border-red-500/25 flex items-center justify-center text-red-500 shadow-md">
                <AlertTriangle size={24} />
              </div>

              <div className="space-y-2">
                <h3 className="text-xl font-bold text-white font-headline">
                  Confirmar Cancelamento
                </h3>
                <p className="text-zinc-400 text-xs leading-relaxed max-w-sm mx-auto">
                  Você continuará tendo acesso irrestrito ao Bananal PRO até o final do período de carência em <strong className="text-white">{subscription?.nextBilling}</strong>.
                </p>
                <div className="p-4 bg-white/5 rounded-2xl text-left border border-white/5 space-y-2 mt-4">
                  <h4 className="text-[10px] font-black uppercase text-amber-500 tracking-wider">Atenção sobre cobrança externa</h4>
                  <p className="text-[10px] text-zinc-400 leading-relaxed font-medium">
                    Como o Bananal PRO processa pagamentos via checkout da **InfinitePay**, lembre-se de conferir e cancelar a recorrência automática do cartão em seu aplicativo bancário ou fatura caso tenha habilitado assinatura automática.
                  </p>
                </div>
              </div>

              <div className="flex gap-4 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCancelModal(false)}
                  className="flex-1 bg-white/5 hover:bg-white/10 text-white py-3 rounded-xl font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer border border-white/5"
                >
                  Voltar
                </button>
                <button
                  type="button"
                  disabled={isCanceling}
                  onClick={handleConfirmCancel}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white py-3 rounded-xl font-bold text-xs uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1.5"
                >
                  {isCanceling ? <Loader2 size={14} className="animate-spin" /> : "Confirmar"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </Layout>
  );
}
