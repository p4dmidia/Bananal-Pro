import React, { useState } from "react";
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
  HelpCircle
} from "lucide-react";
import toast from "react-hot-toast";
import { useAuth } from "../../contexts/AuthContext";

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

  const [farmData, setFarmData] = useState({
    farmName: "Fazenda Bananal Alegre",
    city: "Sete Lagoas",
    state: "MG",
    totalArea: "15",
    bananaVariety: "prata-ana"
  });

  const [subscription, setSubscription] = useState({
    planName: "Plano Profissional Anual",
    value: "R$ 799,00/ano",
    status: "Ativo",
    nextBilling: "30 de Maio de 2027",
    paymentMethod: "•••• •••• •••• 4242 (Mastercard)"
  });

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

  const handleFarmSave = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      toast.success("Dados da propriedade agrícola salvos com sucesso!", {
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
    { id: "farm", label: "Minha Fazenda", icon: <Building size={16} /> },
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

            {/* Tab: Farm Data */}
            {activeTab === "farm" && (
              <motion.div
                key="farm-tab"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="glass-card p-8 rounded-[2.5rem] border-white/5"
              >
                <form onSubmit={handleFarmSave} className="space-y-6">
                  <div>
                    <h3 className="text-lg font-bold text-white">Dados da Propriedade</h3>
                    <p className="text-slate-500 text-xs mt-1">Esses dados calibram e facilitam o preenchimento das calculadoras de calagem e finanças.</p>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-white uppercase tracking-wider block">Nome da Fazenda / Sítio</label>
                    <input 
                      type="text" 
                      value={farmData.farmName}
                      onChange={(e) => setFarmData({ ...farmData, farmName: e.target.value })}
                      className="w-full bg-zinc-950 border border-white/10 rounded-xl px-4 py-3 text-xs text-white focus:border-emerald-500/50 focus:outline-none transition-colors"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-white uppercase tracking-wider block">Cidade</label>
                      <input 
                        type="text" 
                        value={farmData.city}
                        onChange={(e) => setFarmData({ ...farmData, city: e.target.value })}
                        className="w-full bg-zinc-950 border border-white/10 rounded-xl px-4 py-3 text-xs text-white focus:border-emerald-500/50 focus:outline-none transition-colors"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-white uppercase tracking-wider block">Estado (UF)</label>
                      <input 
                        type="text" 
                        value={farmData.state}
                        onChange={(e) => setFarmData({ ...farmData, state: e.target.value })}
                        className="w-full bg-zinc-950 border border-white/10 rounded-xl px-4 py-3 text-xs text-white focus:border-emerald-500/50 focus:outline-none transition-colors"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-white uppercase tracking-wider block">Área Total Plantada (Hectares)</label>
                      <input 
                        type="number" 
                        value={farmData.totalArea}
                        onChange={(e) => setFarmData({ ...farmData, totalArea: e.target.value })}
                        className="w-full bg-zinc-950 border border-white/10 rounded-xl px-4 py-3 text-xs text-white focus:border-emerald-500/50 focus:outline-none transition-colors"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-white uppercase tracking-wider block">Variedade Principal Cultivada</label>
                    <select
                      value={farmData.bananaVariety}
                      onChange={(e) => setFarmData({ ...farmData, bananaVariety: e.target.value })}
                      className="w-full bg-zinc-950 border border-white/10 rounded-xl px-4 py-3 text-xs text-white focus:border-emerald-500/50 focus:outline-none transition-colors"
                    >
                      <option value="prata-ana">Banana Prata Anã</option>
                      <option value="nanica">Banana Nanica (Cavendish)</option>
                      <option value="maca">Banana Maçã</option>
                      <option value="terra">Banana da Terra</option>
                      <option value="ouro">Banana Ouro</option>
                    </select>
                  </div>

                  <div className="flex justify-end pt-4 border-t border-white/5">
                    <button
                      type="submit"
                      disabled={isSaving}
                      className="bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-3 rounded-xl font-bold text-xs tracking-wider uppercase transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      {isSaving ? "Salvando..." : "Salvar Configurações"}
                      <Save size={14} />
                    </button>
                  </div>
                </form>
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

                    <div className="bg-emerald-950/20 border border-emerald-900/30 p-6 rounded-2xl text-center">
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
                <div className="bg-[#0b1b11] border border-emerald-950 p-6 rounded-3xl flex gap-4 items-start">
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
    </Layout>
  );
}
