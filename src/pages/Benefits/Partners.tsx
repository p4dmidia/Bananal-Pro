import React, { useEffect, useState } from "react";
import Layout from "../../components/Layout/Layout";
import { motion, AnimatePresence } from "motion/react";
import { 
  Search, 
  MapPin, 
  Tag, 
  ChevronRight, 
  Filter, 
  CreditCard, 
  Loader2, 
  Sparkles, 
  Building2, 
  Phone,
  Copy,
  Check,
  X,
  Lock,
  User,
  Calendar
} from "lucide-react";
import { supabase } from "../../lib/supabase";
import { Tables } from "../../types/database";
import { useAuth } from "../../contexts/AuthContext";
import { useTranslation } from "react-i18next";
import { toast } from "react-hot-toast";

type Company = Tables<'companies'> & {
  company_cashback_config?: { cashback_percentage: number } | null;
  company_categories?: { category_id: string }[];
};

type Category = Tables<'categories'>;

export default function Partners() {
  const { profile, refreshProfile } = useAuth();
  const { t } = useTranslation();

  const [companies, setCompanies] = useState<Company[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | "Todos">("Todos");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);

  // Modal & Coupon states
  const [activeCoupon, setActiveCoupon] = useState<string | null>(null);
  const [showCardModal, setShowCardModal] = useState(false);
  const [showVoucherModal, setShowVoucherModal] = useState(false);
  const [showCpfPrompt, setShowCpfPrompt] = useState(false);
  const [generatingVoucher, setGeneratingVoucher] = useState(false);
  const [copied, setCopied] = useState(false);
  const [cpfInput, setCpfInput] = useState("");
  const [cpfSaving, setCpfSaving] = useState(false);

  useEffect(() => {
    const fetchInitialData = async () => {
      setLoading(true);
      try {
        // Fetch categories
        const { data: catData } = await supabase.from('categories').select('*').order('name');
        if (catData) setCategories(catData);

        // Fetch companies with cashback (desconto) and categories
        const { data: compData, error: compError } = await supabase
          .from('companies')
          .select(`
            *,
            company_cashback_config (cashback_percentage),
            company_categories (category_id)
          `)
          .eq('is_active', true);

        if (compError) throw compError;
        setCompanies(compData as any || []);
      } catch (err) {
        console.error('Error fetching partners:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchInitialData();
  }, []);

  // Fetch active coupon on load
  useEffect(() => {
    const fetchActiveCoupon = async () => {
      if (!profile) return;
      try {
        const { data, error } = await supabase
          .from('customer_coupons')
          .select('coupon_code')
          .eq('user_id', profile.id)
          .eq('is_active', true)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (data) {
          setActiveCoupon(data.coupon_code);
        }
      } catch (err) {
        console.error('Error fetching active coupon:', err);
      }
    };
    if (profile) fetchActiveCoupon();
  }, [profile]);

  const filteredCompanies = companies.filter(company => {
    const matchesSearch = company.nome_fantasia?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         company.description?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = selectedCategoryId === "Todos" || 
                            company.company_categories?.some(cc => cc.category_id === selectedCategoryId);

    return matchesSearch && matchesCategory;
  });

  const handleGenerateVoucher = async () => {
    if (!profile) {
      toast.error("Você precisa estar autenticado.");
      return;
    }

    if (!profile.cpf) {
      setShowCpfPrompt(true);
      return;
    }

    setGeneratingVoucher(true);
    try {
      // Check if already has an active coupon
      const { data: existingCoupon } = await supabase
        .from('customer_coupons')
        .select('coupon_code')
        .eq('user_id', profile.id)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (existingCoupon) {
        setActiveCoupon(existingCoupon.coupon_code);
        setShowVoucherModal(true);
        return;
      }

      // Generate random coupon code
      const randomPart = Math.random().toString(36).substring(2, 8).toUpperCase();
      const code = `BANANAL-${randomPart}`;

      const { error: insertError } = await supabase
        .from('customer_coupons')
        .insert({
          user_id: profile.id,
          coupon_code: code,
          cpf: profile.cpf,
          is_active: true,
          total_usage_count: 0
        });

      if (insertError) throw insertError;

      setActiveCoupon(code);
      setShowVoucherModal(true);
    } catch (err: any) {
      console.error('Error generating voucher:', err);
      toast.error("Erro ao gerar voucher: " + (err.message || "Erro desconhecido"));
    } finally {
      setGeneratingVoucher(false);
    }
  };

  const handleSaveCpf = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;

    // Simple CPF cleanup and basic check
    const cleanCpf = cpfInput.replace(/\D/g, "");
    if (cleanCpf.length !== 11) {
      toast.error("O CPF deve conter exatamente 11 dígitos.");
      return;
    }

    setCpfSaving(true);
    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({ cpf: cpfInput })
        .eq('id', profile.id);

      if (error) throw error;

      await refreshProfile();
      toast.success("CPF cadastrado com sucesso!");
      setShowCpfPrompt(false);
      
      // Auto trigger voucher generation after saving CPF
      setTimeout(() => {
        handleGenerateVoucher();
      }, 500);
    } catch (err: any) {
      console.error("Error saving CPF:", err);
      toast.error("Erro ao salvar CPF: " + (err.message || "Erro desconhecido"));
    } finally {
      setCpfSaving(false);
    }
  };

  const handleCopyCode = () => {
    if (!activeCoupon) return;
    navigator.clipboard.writeText(activeCoupon);
    setCopied(true);
    toast.success(t("card_modal.copied", "Código copiado!"));
    setTimeout(() => setCopied(false), 2000);
  };

  const formatCPF = (cpf: string | null) => {
    if (!cpf) return "000.000.000-00";
    const clean = cpf.replace(/\D/g, "");
    if (clean.length !== 11) return cpf;
    return `${clean.substring(0, 3)}.***.***-${clean.substring(9, 11)}`;
  };

  return (
    <Layout>
      <div className="space-y-12 pb-20">
        {/* Hero Section Premium */}
        <section className="relative h-80 w-full rounded-[3.5rem] overflow-hidden group shadow-2xl">
           <div className="absolute inset-0 bg-purple-gradient opacity-90" />
           <div className="absolute inset-0 bg-gradient-to-r from-primary via-primary/80 to-zinc-950" />
           <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20" />
           
           <div className="absolute inset-0 p-12 flex flex-col md:flex-row items-center justify-between gap-10 z-10">
              <div className="space-y-4 max-w-xl text-center md:text-left">
                 <div className="flex items-center justify-center md:justify-start gap-2">
                    <Sparkles size={20} className="text-yellow-500 animate-pulse" />
                    <span className="text-[10px] font-black text-white uppercase tracking-[0.3em]">{t("partners_page.badge")}</span>
                 </div>
                 <h2 className="text-4xl md:text-5xl font-black text-white tracking-tighter leading-tight">{t("partners_page.title")}</h2>
                 <p className="text-white/70 font-medium">{t("partners_page.subtitle")}</p>
              </div>
              <button 
                onClick={() => {
                  if (!profile?.cpf) {
                    setShowCpfPrompt(true);
                  } else {
                    setShowCardModal(true);
                  }
                }}
                className="bg-white text-black px-10 py-5 rounded-2xl font-black text-xs uppercase tracking-widest hover:scale-105 transition-all shadow-2xl flex items-center gap-3 cursor-pointer"
              >
                 <CreditCard size={18} className="text-primary" />
                 {t("partners_page.view_card")}
              </button>
           </div>
           <Building2 size={300} className="absolute -right-20 -bottom-20 text-white/5 rotate-12 group-hover:rotate-45 transition-all duration-[2s]" />
        </section>

        {/* Search and Filters */}
        <div className="flex flex-col md:flex-row gap-6">
          <div className="flex-1 relative group">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500 group-focus-within:text-primary transition-colors" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t("partners_page.search_placeholder")}
              className="w-full bg-zinc-900/50 border border-white/5 rounded-[2rem] py-5 pl-14 pr-6 text-white focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all font-bold placeholder:text-zinc-700 shadow-xl"
            />
          </div>
          <button className="bg-zinc-900/50 border border-white/5 rounded-2xl px-8 py-5 text-zinc-400 font-bold flex items-center gap-3 hover:text-white transition-all shadow-xl cursor-pointer">
            <Filter size={20} />
            {t("partners_page.advanced_filters")}
          </button>
        </div>

        {/* Categories Carousel */}
        <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar">
          <button
            onClick={() => setSelectedCategoryId("Todos")}
            className={`px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest border transition-all whitespace-nowrap shadow-lg cursor-pointer ${
              selectedCategoryId === "Todos" 
                ? "bg-primary border-primary text-white shadow-primary/20" 
                : "bg-zinc-900/50 border-white/5 text-zinc-500 hover:text-white"
            }`}
          >
            {t("partners_page.all")}
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategoryId(cat.id)}
              className={`px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest border transition-all whitespace-nowrap shadow-lg cursor-pointer ${
                selectedCategoryId === cat.id 
                  ? "bg-primary border-primary text-white shadow-primary/20" 
                  : "bg-zinc-900/50 border-white/5 text-zinc-500 hover:text-white"
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-12 h-12 text-primary animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-8">
            <AnimatePresence>
              {filteredCompanies.map((partner, index) => {
                const discountPercent = partner.company_cashback_config?.cashback_percentage || 10;
                return (
                  <motion.div
                    key={partner.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ delay: index * 0.05 }}
                    className="group bg-zinc-900/40 hover:bg-zinc-900/80 border border-white/5 rounded-[3rem] p-8 transition-all hover:-translate-y-2 hover:shadow-2xl hover:shadow-primary/5 flex flex-col"
                  >
                    <div className="flex items-start justify-between mb-8">
                      <div className="w-20 h-20 bg-white rounded-[1.5rem] overflow-hidden flex items-center justify-center border-4 border-zinc-800 shadow-xl group-hover:scale-110 transition-transform duration-500">
                        <img 
                          src={partner.thumbnail_url || `https://ui-avatars.com/api/?name=${partner.nome_fantasia}&background=random`} 
                          alt={partner.nome_fantasia} 
                          className="w-full h-full object-cover" 
                        />
                      </div>
                      <div className="bg-primary/10 text-primary text-[10px] font-black px-3 py-1.5 rounded-full border border-primary/20 uppercase tracking-widest">
                        {t("partners_page.discount_badge", { discount: discountPercent })}
                      </div>
                    </div>

                    <div className="space-y-6 flex-1 flex flex-col">
                      <div>
                        <h3 className="text-2xl font-black text-white group-hover:text-primary transition-colors truncate tracking-tighter">
                          {partner.nome_fantasia}
                        </h3>
                        <div className="flex items-center gap-2 text-zinc-500 text-[10px] font-black uppercase tracking-widest mt-1">
                          <Tag className="w-3 h-3 text-primary" />
                          {partner.cnpj}
                        </div>
                      </div>

                      <p className="text-zinc-500 text-sm line-clamp-2 leading-relaxed flex-1">
                        {partner.description || "Estabelecimento parceiro Clube de Vantagens. Benefício exclusivo para membros ativos."}
                      </p>

                      <div className="space-y-3 pt-6 border-t border-white/5">
                        <div className="flex items-center gap-3 text-zinc-500 text-xs font-medium">
                          <MapPin className="w-4 h-4 text-primary shrink-0" />
                          <span className="truncate">{partner.address_city || "Cidade"}, {partner.address_state || "UF"}</span>
                        </div>
                        <div className="flex items-center gap-3 text-zinc-500 text-xs font-medium">
                          <Phone className="w-4 h-4 text-primary shrink-0" />
                          <span>{partner.whatsapp || partner.telefone || t("partners_page.no_contact")}</span>
                        </div>
                      </div>

                      <button 
                        onClick={handleGenerateVoucher}
                        disabled={generatingVoucher}
                        className="w-full bg-white/5 hover:bg-primary text-zinc-400 hover:text-white font-black text-[10px] uppercase tracking-[0.2em] py-5 rounded-2xl border border-white/10 flex items-center justify-center gap-3 transition-all active:scale-95 cursor-pointer disabled:opacity-55"
                      >
                        {generatingVoucher ? (
                          <Loader2 size={14} className="animate-spin text-white" />
                        ) : (
                          <>
                            {t("partners_page.generate_voucher")}
                            <ChevronRight size={14} />
                          </>
                        )}
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
            
            {filteredCompanies.length === 0 && (
              <div className="col-span-full py-20 text-center bg-zinc-900/20 rounded-[3.5rem] border border-dashed border-white/5">
                 <p className="text-zinc-500 font-bold">{t("partners_page.no_partners")}</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* MODAL: CARTÃO DE BENEFÍCIOS VIRTUAL */}
      <AnimatePresence>
        {showCardModal && profile && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowCardModal(false)}
              className="fixed inset-0 bg-black/80 backdrop-blur-md"
            />
            
            <motion.div
              initial={{ scale: 0.95, y: 20, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.95, y: 20, opacity: 0 }}
              className="bg-zinc-950 border border-white/10 rounded-[2.5rem] w-full max-w-lg p-8 relative z-10 overflow-hidden shadow-2xl"
            >
              <button 
                onClick={() => setShowCardModal(false)}
                className="absolute top-6 right-6 p-2 rounded-full hover:bg-white/5 text-zinc-400 hover:text-white transition-colors cursor-pointer"
              >
                <X size={20} />
              </button>

              <div className="space-y-6">
                <div>
                  <h3 className="text-2xl font-black text-white tracking-tight">{t("card_modal.title")}</h3>
                  <p className="text-zinc-400 text-xs mt-1">{t("card_modal.subtitle")}</p>
                </div>

                {/* Styled Digital Glassmorphic Card */}
                <div className="relative aspect-[1.586/1] w-full rounded-3xl overflow-hidden p-6 text-white shadow-2xl flex flex-col justify-between group">
                  {/* Card Background Gradient */}
                  <div className="absolute inset-0 bg-gradient-to-tr from-[#6b21a8] via-[#10b981]/80 to-[#18181b] opacity-90 group-hover:scale-105 transition-transform duration-700" />
                  <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-15" />
                  <div className="absolute top-0 right-0 w-44 h-44 bg-primary/20 rounded-full blur-3xl" />
                  
                  {/* Top Row: Brand & Hologram */}
                  <div className="relative z-10 flex justify-between items-start">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full p-[4px] bg-gradient-to-tr from-emerald-500 to-yellow-500">
                        <div className="w-full h-full rounded-full bg-black" />
                      </div>
                      <span className="font-display font-black tracking-tight text-sm">BANANAL PRO</span>
                    </div>
                    {/* Glowing active status */}
                    <div className="bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-[9px] font-black px-2.5 py-1 rounded-full flex items-center gap-1.5 shadow-sm">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                      <span>{t("card_modal.status_active")}</span>
                    </div>
                  </div>

                  {/* Middle Row: Hologram Chip */}
                  <div className="relative z-10 my-4 flex items-center justify-between">
                    {/* Simulated golden chip */}
                    <div className="w-12 h-9 bg-gradient-to-br from-yellow-300 via-yellow-500 to-yellow-600 rounded-md relative overflow-hidden shadow-inner border border-yellow-400/30">
                      <div className="absolute inset-x-3 inset-y-1 border-r border-black/10" />
                      <div className="absolute inset-y-3 inset-x-1 border-b border-black/10" />
                    </div>
                    
                    <div className="text-right">
                      <p className="text-[8px] text-white/50 uppercase tracking-widest font-black">{t("card_modal.card_type")}</p>
                      <p className="text-xs font-black tracking-widest text-primary/80">#BANANAL-{profile.id.toString().padStart(6, '0')}</p>
                    </div>
                  </div>

                  {/* Bottom Row: User Name & CPF */}
                  <div className="relative z-10 flex justify-between items-end">
                    <div className="space-y-1">
                      <p className="text-[10px] text-white/50 uppercase tracking-widest font-black flex items-center gap-1">
                        <User size={10} />
                        Membro
                      </p>
                      <h4 className="text-base font-black uppercase tracking-wide truncate max-w-[240px]">
                        {profile.full_name || "Membro Bananal PRO"}
                      </h4>
                    </div>
                    
                    <div className="text-right space-y-1">
                      <p className="text-[8px] text-white/50 uppercase tracking-widest font-black flex items-center justify-end gap-1">
                        <Lock size={9} />
                        CPF
                      </p>
                      <p className="text-xs font-black font-mono tracking-wider bg-black/35 px-2 py-0.5 rounded border border-white/5">
                        {formatCPF(profile.cpf)}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex gap-4 pt-4">
                  <button 
                    onClick={() => {
                      setShowCardModal(false);
                      handleGenerateVoucher();
                    }}
                    className="flex-1 bg-primary hover:bg-primary-dark text-white font-bold py-4 rounded-2xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-primary/20"
                  >
                    <Sparkles size={16} />
                    {t("card_modal.generate_new")}
                  </button>
                  <button 
                    onClick={() => setShowCardModal(false)}
                    className="px-6 border border-white/10 hover:bg-white/5 text-zinc-400 hover:text-white font-bold rounded-2xl transition-colors cursor-pointer"
                  >
                    {t("card_modal.close")}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL: EXIBIR VOUCHER DE DESCONTO */}
      <AnimatePresence>
        {showVoucherModal && activeCoupon && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowVoucherModal(false)}
              className="fixed inset-0 bg-black/80 backdrop-blur-md"
            />
            
            <motion.div
              initial={{ scale: 0.95, y: 20, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.95, y: 20, opacity: 0 }}
              className="bg-zinc-950 border border-white/10 rounded-[2.5rem] w-full max-w-md p-8 relative z-10 overflow-hidden shadow-2xl"
            >
              <button 
                onClick={() => setShowVoucherModal(false)}
                className="absolute top-6 right-6 p-2 rounded-full hover:bg-white/5 text-zinc-400 hover:text-white transition-colors cursor-pointer"
              >
                <X size={20} />
              </button>

              <div className="space-y-6 text-center">
                <div className="w-16 h-16 bg-primary/10 border border-primary/20 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
                  <Tag className="text-primary w-8 h-8" />
                </div>

                <div className="space-y-2">
                  <h3 className="text-2xl font-black text-white tracking-tight">{t("card_modal.voucher_title")}</h3>
                  <p className="text-zinc-400 text-xs max-w-sm mx-auto">{t("card_modal.voucher_desc")}</p>
                </div>

                {/* Ticket Display */}
                <div className="bg-zinc-900 border border-white/5 rounded-3xl p-6 relative overflow-hidden my-6">
                  {/* Ticket side notches */}
                  <div className="absolute top-1/2 -left-3 w-6 h-6 bg-zinc-950 rounded-full border border-white/5 -translate-y-1/2" />
                  <div className="absolute top-1/2 -right-3 w-6 h-6 bg-zinc-950 rounded-full border border-white/5 -translate-y-1/2" />
                  
                  <div className="space-y-2">
                    <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-[0.2em]">CÓDIGO DO VOUCHER</p>
                    <div className="text-3xl font-black text-white tracking-widest font-mono select-all bg-black/40 py-4 px-2 rounded-2xl border border-white/5">
                      {activeCoupon}
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-dashed border-white/10 flex justify-between items-center text-xs text-zinc-500 font-medium">
                    <span>CPF: {formatCPF(profile?.cpf || "")}</span>
                    <span className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                      Ativo
                    </span>
                  </div>
                </div>

                <div className="flex gap-4">
                  <button 
                    onClick={handleCopyCode}
                    className="flex-1 bg-primary hover:bg-primary-dark text-white font-bold py-4 rounded-2xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-primary/20 active:scale-95"
                  >
                    {copied ? <Check size={16} /> : <Copy size={16} />}
                    {t("card_modal.copy_code")}
                  </button>
                  <button 
                    onClick={() => setShowVoucherModal(false)}
                    className="px-6 border border-white/10 hover:bg-white/5 text-zinc-400 hover:text-white font-bold rounded-2xl transition-colors cursor-pointer"
                  >
                    {t("card_modal.close")}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL: FORMULÁRIO DE CADASTRO DE CPF */}
      <AnimatePresence>
        {showCpfPrompt && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowCpfPrompt(false)}
              className="fixed inset-0 bg-black/80 backdrop-blur-md"
            />
            
            <motion.div
              initial={{ scale: 0.95, y: 20, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.95, y: 20, opacity: 0 }}
              className="bg-zinc-950 border border-white/10 rounded-[2.5rem] w-full max-w-md p-8 relative z-10 overflow-hidden shadow-2xl"
            >
              <button 
                onClick={() => setShowCpfPrompt(false)}
                className="absolute top-6 right-6 p-2 rounded-full hover:bg-white/5 text-zinc-400 hover:text-white transition-colors cursor-pointer"
              >
                <X size={20} />
              </button>

              <form onSubmit={handleSaveCpf} className="space-y-6">
                <div className="text-center">
                  <div className="w-16 h-16 bg-primary/10 border border-primary/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Lock className="text-primary w-8 h-8" />
                  </div>
                  <h3 className="text-2xl font-black text-white tracking-tight">CPF Necessário</h3>
                  <p className="text-zinc-400 text-xs mt-2 max-w-sm mx-auto">
                    Para emitir seu cartão virtual e gerar vouchers de desconto, precisamos registrar seu CPF. Ele será validado no caixa dos estabelecimentos.
                  </p>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-400 ml-1 uppercase tracking-widest">Digite seu CPF</label>
                  <input
                    type="text"
                    required
                    value={cpfInput}
                    onChange={(e) => setCpfInput(e.target.value)}
                    placeholder="000.000.000-00"
                    className="w-full bg-zinc-900 border border-white/10 rounded-2xl py-4 px-4 text-white focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all font-mono text-center text-lg font-bold"
                  />
                </div>

                <div className="flex gap-4 pt-2">
                  <button 
                    type="submit"
                    disabled={cpfSaving}
                    className="flex-1 bg-primary hover:bg-primary-dark text-white font-bold py-4 rounded-2xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-primary/20 disabled:opacity-55"
                  >
                    {cpfSaving ? <Loader2 size={16} className="animate-spin text-white" /> : "Salvar e Continuar"}
                  </button>
                  <button 
                    type="button"
                    onClick={() => setShowCpfPrompt(false)}
                    className="px-6 border border-white/10 hover:bg-white/5 text-zinc-400 hover:text-white font-bold rounded-2xl transition-colors cursor-pointer"
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
