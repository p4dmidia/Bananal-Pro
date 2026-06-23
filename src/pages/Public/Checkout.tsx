import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import { 
  ShieldCheck, 
  Lock, 
  CreditCard, 
  QrCode, 
  CheckCircle2, 
  Loader2, 
  AlertCircle, 
  Copy, 
  Check, 
  Star,
  ArrowLeft,
  Sprout
} from "lucide-react";
import { toast } from "react-hot-toast";

interface Testimonial {
  name: string;
  rating: number;
  text: string;
  avatar_url: string;
}

interface CheckoutConfig {
  slug: string;
  title: string;
  subtitle: string;
  header_image_url: string;
  features: string[];
  guarantee_days: number;
  payment_methods: string[];
  testimonials: Testimonial[];
}

export default function Checkout() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const currentSlug = slug || "padrao";

  const [loadingConfig, setLoadingConfig] = useState(true);
  const [config, setConfig] = useState<CheckoutConfig | null>(null);
  
  // User profile and authentication
  const [user, setUser] = useState<any>(null);
  const [billingData, setBillingData] = useState({
    fullName: "",
    email: "",
    cpfCnpj: "",
    whatsapp: "",
  });

  // Payment UI states
  const [paymentMethod, setPaymentMethod] = useState<"credit_card" | "pix">("credit_card");
  const [cardData, setCardData] = useState({
    number: "",
    name: "",
    expiry: "",
    cvc: "",
    installments: "1",
  });
  
  // Pix generator states
  const [pixGenerated, setPixGenerated] = useState(false);
  const [generatingPix, setGeneratingPix] = useState(false);
  const [copiedPix, setCopiedPix] = useState(false);

  // Form errors / Processing loading
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<string | null>(null);

  // 1. Authenticate & load config
  useEffect(() => {
    const checkAuthAndLoad = async () => {
      // Check authentication
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) {
        toast.error("Identifique-se primeiro para realizar a assinatura.");
        navigate(`/auth/register?offer=${currentSlug}`);
        return;
      }
      setUser(authUser);

      // Fetch user profile to prefill
      const { data: profile } = await supabase
        .from("user_profiles")
        .select("*")
        .eq("mocha_user_id", authUser.id)
        .maybeSingle();

      if (profile) {
        setBillingData({
          fullName: profile.full_name || authUser.user_metadata?.full_name || "",
          email: profile.email || authUser.email || "",
          cpfCnpj: profile.cpf || "",
          whatsapp: profile.phone || "",
        });
      } else {
        setBillingData(prev => ({
          ...prev,
          fullName: authUser.user_metadata?.full_name || "",
          email: authUser.email || "",
        }));
      }

      // Fetch checkout customization config
      try {
        const { data, error } = await supabase
          .from("checkout_settings")
          .select("*")
          .eq("slug", currentSlug)
          .maybeSingle();

        if (error) throw error;

        if (data) {
          setConfig({
            slug: data.slug,
            title: data.title,
            subtitle: data.subtitle,
            header_image_url: data.header_image_url,
            features: Array.isArray(data.features) ? data.features : [],
            guarantee_days: data.guarantee_days,
            payment_methods: Array.isArray(data.payment_methods) ? data.payment_methods : ["pix", "credit_card"],
            testimonials: Array.isArray(data.testimonials) ? data.testimonials : [],
          });
          
          // Set first payment method available
          if (Array.isArray(data.payment_methods) && data.payment_methods.length > 0) {
            setPaymentMethod(data.payment_methods[0] as "credit_card" | "pix");
          }
        } else {
          // If slug config not found in DB, fallback to default mock structure
          const fallbackConfig: CheckoutConfig = {
            slug: "padrao",
            title: "GUIA PRÁTICO PARA PRODUÇÃO DE BANANAS",
            subtitle: "Ter uma boa colheita, prevenindo contra doenças e economizando muito com o primeiro ecossistema completo da bananicultura brasileira.",
            header_image_url: "https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?auto=format&fit=crop&w=1200&q=80",
            features: [
              "Acesso Completo aos Cursos e Aulas Práticas",
              "Módulo Avançado de Análise e Calagem de Solo",
              "Ferramentas de Controle Financeiro e Estoque",
              "Diagnóstico por IA para Identificar Doenças",
              "Apoio e Mentorias Semanais com Engenheiros Agrônomos"
            ],
            guarantee_days: 7,
            payment_methods: ["credit_card", "pix"],
            testimonials: [
              {
                name: "Rafael da Costa Prá",
                rating: 5,
                text: "Eu achei que era pouca coisa pelo preço. Mas tem tudo que eu precisava saber sobre cultivo de bananas de forma muito prática.",
                avatar_url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&h=150&q=80"
              },
              {
                name: "Mateus Santos da Cruz",
                rating: 5,
                text: "O treinamento é realmente bom, bem explicativo, tem muita informação boa. O módulo de análise de solo economizou muito adubo.",
                avatar_url: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&h=150&q=80"
              }
            ]
          };
          setConfig(fallbackConfig);
        }
      } catch (err) {
        console.error("Error loading checkout config:", err);
        toast.error("Erro ao carregar configurações do checkout.");
      } finally {
        setLoadingConfig(false);
      }
    };

    checkAuthAndLoad();
  }, [currentSlug, navigate]);

  const handleBillingChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setBillingData(prev => ({ ...prev, [name]: value }));
  };

  const handleCardChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setCardData(prev => ({ ...prev, [name]: value }));
  };

  // Generate Pix simulation
  const handleGeneratePix = () => {
    if (!billingData.cpfCnpj || !billingData.whatsapp) {
      setErrors("Preencha seu CPF/CNPJ e Telefone/WhatsApp antes de gerar o PIX.");
      return;
    }
    setErrors(null);
    setGeneratingPix(true);
    setTimeout(() => {
      setGeneratingPix(false);
      setPixGenerated(true);
      toast.success("PIX gerado com sucesso! Efetue o pagamento.");
    }, 1500);
  };

  const copyPixCode = () => {
    const mockCode = "00020101021226930014br.gov.bcb.pix2571pix-prod.dgaovzdkszfqjutldddq5204000053039865802BR5925Comunidade Bananal Pro6009Sao Paulo62070503***6304CA3B";
    navigator.clipboard.writeText(mockCode);
    setCopiedPix(true);
    toast.success("Código PIX Copiado!");
    setTimeout(() => setCopiedPix(false), 2000);
  };

  // Submit payment / Activate subscription
  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;

    // Simple Form Validation
    if (!billingData.cpfCnpj || !billingData.whatsapp) {
      setErrors("CPF/CNPJ e WhatsApp são obrigatórios para a emissão da assinatura.");
      return;
    }

    if (paymentMethod === "credit_card" && (!cardData.number || !cardData.name || !cardData.expiry || !cardData.cvc)) {
      setErrors("Por favor, preencha todos os campos do cartão de crédito.");
      return;
    }

    setErrors(null);
    setSubmitting(true);

    try {
      // 1. Update user profile details (CPF, Phone) and set role/active status
      const { error: profileError } = await supabase
        .from("user_profiles")
        .update({
          cpf: billingData.cpfCnpj,
          phone: billingData.whatsapp,
          is_active: true, // Mark subscription as active!
          updated_at: new Date().toISOString()
        })
        .eq("mocha_user_id", user.id);

      if (profileError) throw profileError;

      // 2. Simulate Payment Provider delay
      await new Promise(resolve => setTimeout(resolve, 2000));

      toast.success("Assinatura confirmada com sucesso! Bem-vindo ao Bananal PRO.");
      navigate("/dashboard");
    } catch (err: any) {
      console.error("Payment submission error:", err);
      setErrors(err.message || "Erro ao processar pagamento. Tente novamente.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingConfig || !config) {
    return (
      <div className="min-h-screen bg-background text-on-surface flex flex-col items-center justify-center p-6">
        <Loader2 className="w-10 h-10 animate-spin text-emerald-500 mb-4" />
        <p className="font-bold text-sm tracking-wider uppercase text-zinc-400">Processando checkout seguro...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-on-surface font-sans py-12 px-6 relative selection:bg-emerald-500/30">
      {/* Background Volumetric Glows */}
      <div className="glow-spot glow-green absolute top-[10%] left-[-15%] w-[45%] aspect-square rounded-full blur-[120px] pointer-events-none" />
      <div className="glow-spot glow-primary absolute bottom-[20%] right-[-15%] w-[45%] aspect-square rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-6xl mx-auto relative z-10 space-y-8">
        
        {/* Top bar back link */}
        <div className="flex items-center justify-between border-b border-outline/10 pb-4">
          <Link to="/vendas" className="flex items-center gap-2 text-on-surface-variant hover:text-on-surface transition-colors text-xs font-bold uppercase tracking-wider">
            <ArrowLeft size={16} />
            Voltar para Vendas
          </Link>
          <div className="flex items-center gap-1.5 bg-emerald-500/10 dark:bg-emerald-950/40 border border-emerald-500/20 px-3 py-1.5 rounded-full text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            Conexão Segura SSL
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* LEFT COLUMN: Customizable Offer Details */}
          <div className="lg:col-span-7 space-y-8">
            
            {/* Main Offer Header Card */}
            <div className="bg-surface border border-outline/10 rounded-[2.5rem] overflow-hidden shadow-2xl">
              <div className="h-60 relative w-full overflow-hidden">
                <img 
                  src={config.header_image_url} 
                  alt="Checkout Banner" 
                  className="w-full h-full object-cover brightness-[0.7]"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-surface via-surface/40 to-transparent" />
                <div className="absolute top-4 left-4">
                  <span className="bg-emerald-600 text-white text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full shadow-lg">
                    Oferta Exclusiva
                  </span>
                </div>
              </div>

              <div className="p-8 space-y-4">
                <h1 className="text-2xl md:text-3xl font-black tracking-tight text-on-surface uppercase leading-tight font-headline">
                  {config.title}
                </h1>
                <p className="text-on-surface-variant text-sm md:text-base leading-relaxed">
                  {config.subtitle}
                </p>
              </div>
            </div>

            {/* Included Features List */}
            <div className="bg-surface border border-outline/10 rounded-[2.5rem] p-8 space-y-6 shadow-xl">
              <h3 className="text-xs font-black uppercase tracking-widest text-on-surface-variant border-b border-outline/10 pb-3">
                O que você vai receber acesso:
              </h3>
              <ul className="space-y-4">
                {config.features.map((feature, idx) => (
                  <li key={idx} className="flex gap-3.5 items-start text-on-surface text-sm font-semibold">
                    <CheckCircle2 size={20} className="text-emerald-500 shrink-0 mt-0.5" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Testimonials */}
            {config.testimonials && config.testimonials.length > 0 && (
              <div className="space-y-6">
                <h3 className="text-xs font-black uppercase tracking-widest text-on-surface-variant ml-4">
                  Depoimentos de Produtores
                </h3>
                <div className="grid sm:grid-cols-2 gap-4">
                  {config.testimonials.map((t, idx) => (
                    <div key={idx} className="bg-surface border border-outline/10 p-6 rounded-[2rem] space-y-4 flex flex-col justify-between">
                      <p className="text-xs text-on-surface-variant italic leading-relaxed">
                        "{t.text}"
                      </p>
                      <div className="flex items-center gap-3 pt-2 border-t border-outline/10">
                        <img 
                          src={t.avatar_url} 
                          alt={t.name} 
                          className="w-10 h-10 rounded-full object-cover border border-outline/10"
                        />
                        <div>
                          <h4 className="text-xs font-bold text-on-surface">{t.name}</h4>
                          <div className="flex gap-0.5 text-amber-500 mt-0.5">
                            {Array.from({ length: t.rating }).map((_, i) => (
                              <Star key={i} size={10} fill="currentColor" />
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Guarantee Emblem */}
            <div className="bg-emerald-500/5 dark:bg-emerald-950/10 border border-emerald-500/10 rounded-[2rem] p-6 flex items-start gap-4">
              <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0 text-emerald-600 dark:text-emerald-400">
                <ShieldCheck size={28} />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-on-surface">Garantia de Satisfação de {config.guarantee_days} dias</h4>
                <p className="text-xs text-on-surface-variant leading-relaxed">
                  Experimente toda a plataforma sem riscos. Se não gostar dos recursos ou do suporte, basta solicitar o reembolso integral dentro de {config.guarantee_days} dias. Risco zero.
                </p>
              </div>
            </div>

          </div>

          {/* RIGHT COLUMN: Billing & Secured Payments */}
          <div className="lg:col-span-5">
            <div className="bg-surface border border-outline/10 rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden">
              
              {/* Top security header */}
              <div className="flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-400 bg-emerald-500/5 border border-emerald-500/10 py-3 rounded-2xl mb-8">
                <Lock size={12} />
                Ambiente de Checkout Criptografado
              </div>

              {errors && (
                <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-2xl flex items-start gap-3 text-red-500 text-xs font-semibold mb-6">
                  <AlertCircle className="shrink-0 mt-0.5" size={16} />
                  <span>{errors}</span>
                </div>
              )}

              <form onSubmit={handlePaymentSubmit} className="space-y-6">
                
                {/* 1. Identification Fields */}
                <div className="space-y-4">
                  <h3 className="text-xs font-black uppercase tracking-widest text-on-surface-variant border-b border-outline/10 pb-2">
                    1. Dados de Identificação
                  </h3>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider ml-1">Nome do Comprador</label>
                    <input
                      type="text"
                      name="fullName"
                      value={billingData.fullName}
                      onChange={handleBillingChange}
                      placeholder="Seu nome completo"
                      required
                      className="w-full bg-surface border border-outline/15 rounded-2xl py-3 px-4 text-on-surface text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 placeholder:text-on-surface-variant/40"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider ml-1">E-mail de Cadastro</label>
                    <input
                      type="email"
                      name="email"
                      value={billingData.email}
                      onChange={handleBillingChange}
                      placeholder="seu@email.com"
                      required
                      disabled // Already authenticated email cannot be changed to prevent session drift
                      className="w-full bg-surface-variant/40 border border-outline/10 rounded-2xl py-3 px-4 text-on-surface-variant text-sm focus:outline-none opacity-60"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider ml-1">CPF ou CNPJ</label>
                      <input
                        type="text"
                        name="cpfCnpj"
                        value={billingData.cpfCnpj}
                        onChange={handleBillingChange}
                        placeholder="000.000.000-00"
                        required
                        className="w-full bg-surface border border-outline/15 rounded-2xl py-3 px-4 text-on-surface text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 placeholder:text-on-surface-variant/40"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider ml-1">WhatsApp</label>
                      <input
                        type="text"
                        name="whatsapp"
                        value={billingData.whatsapp}
                        onChange={handleBillingChange}
                        placeholder="(00) 99999-9999"
                        required
                        className="w-full bg-surface border border-outline/15 rounded-2xl py-3 px-4 text-on-surface text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 placeholder:text-on-surface-variant/40"
                      />
                    </div>
                  </div>
                </div>

                {/* 2. Payment Selector */}
                <div className="space-y-4 pt-4">
                  <h3 className="text-xs font-black uppercase tracking-widest text-on-surface-variant border-b border-outline/10 pb-2">
                    2. Forma de Pagamento
                  </h3>

                  <div className="grid grid-cols-2 gap-4">
                    {config.payment_methods.includes("credit_card") && (
                      <button
                        type="button"
                        onClick={() => setPaymentMethod("credit_card")}
                        className={`py-3.5 px-4 rounded-2xl border font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer ${
                          paymentMethod === "credit_card"
                            ? "bg-emerald-600/10 border-emerald-500 text-emerald-600 dark:text-emerald-400 shadow-lg"
                            : "bg-surface border-outline/15 text-on-surface-variant hover:text-on-surface"
                        }`}
                      >
                        <CreditCard size={16} />
                        Cartão
                      </button>
                    )}
                    {config.payment_methods.includes("pix") && (
                      <button
                        type="button"
                        onClick={() => setPaymentMethod("pix")}
                        className={`py-3.5 px-4 rounded-2xl border font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer ${
                          paymentMethod === "pix"
                            ? "bg-emerald-600/10 border-emerald-500 text-emerald-600 dark:text-emerald-400 shadow-lg"
                            : "bg-surface border-outline/15 text-on-surface-variant hover:text-on-surface"
                        }`}
                      >
                        <QrCode size={16} />
                        PIX
                      </button>
                    )}
                  </div>

                  {/* Payment Details Container */}
                  <div className="bg-surface-variant border border-outline/10 p-6 rounded-3xl space-y-4">
                    
                    {/* CREDIT CARD FORM */}
                    {paymentMethod === "credit_card" && (
                      <div className="space-y-4">
                        
                        {/* Interactive Card Mockup */}
                        <div className="bg-gradient-to-tr from-emerald-800 to-emerald-950 p-6 rounded-2xl shadow-xl border border-white/10 space-y-6 relative overflow-hidden">
                          <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-[30px]" />
                          <div className="flex justify-between items-start">
                            <Sprout className="text-emerald-300 w-8 h-8" />
                            <span className="text-[10px] font-black tracking-widest text-emerald-300 uppercase">Assinatura PRO</span>
                          </div>
                          <div className="space-y-1">
                            <p className="text-[9px] uppercase font-bold tracking-widest text-emerald-400">Número do Cartão</p>
                            <p className="font-mono text-base tracking-widest text-white">
                              {cardData.number || "•••• •••• •••• ••••"}
                            </p>
                          </div>
                          <div className="flex justify-between items-end">
                            <div>
                              <p className="text-[8px] uppercase font-bold tracking-widest text-emerald-400">Titular</p>
                              <p className="text-xs uppercase font-bold tracking-wide text-white truncate max-w-[150px]">
                                {cardData.name || "NOME DO TITULAR"}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-[8px] uppercase font-bold tracking-widest text-emerald-400">Validade</p>
                              <p className="font-mono text-xs text-white">
                                {cardData.expiry || "MM/YY"}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Card Inputs */}
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider ml-1">Número do Cartão</label>
                          <input
                            type="text"
                            name="number"
                            value={cardData.number}
                            onChange={handleCardChange}
                            placeholder="0000 0000 0000 0000"
                            maxLength={19}
                            className="w-full bg-surface border border-outline/15 rounded-2xl py-3 px-4 text-on-surface text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 placeholder:text-on-surface-variant/40"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider ml-1">Nome Impresso no Cartão</label>
                          <input
                            type="text"
                            name="name"
                            value={cardData.name}
                            onChange={handleCardChange}
                            placeholder="NOME COMPLETO"
                            className="w-full bg-surface border border-outline/15 rounded-2xl py-3 px-4 text-on-surface text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 placeholder:text-on-surface-variant/40 uppercase"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider ml-1">Validade (MM/AA)</label>
                            <input
                              type="text"
                              name="expiry"
                              value={cardData.expiry}
                              onChange={handleCardChange}
                              placeholder="MM/AA"
                              maxLength={5}
                              className="w-full bg-surface border border-outline/15 rounded-2xl py-3 px-4 text-on-surface text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 placeholder:text-on-surface-variant/40"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider ml-1">CVV / CVC</label>
                            <input
                              type="password"
                              name="cvc"
                              value={cardData.cvc}
                              onChange={handleCardChange}
                              placeholder="000"
                              maxLength={4}
                              className="w-full bg-surface border border-outline/15 rounded-2xl py-3 px-4 text-on-surface text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 placeholder:text-on-surface-variant/40"
                            />
                          </div>
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider ml-1">Opções de Parcelamento</label>
                          <select
                            name="installments"
                            value={cardData.installments}
                            onChange={handleCardChange}
                            className="w-full bg-surface border border-outline/15 rounded-2xl py-3 px-4 text-on-surface text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 h-[48px] cursor-pointer"
                          >
                            <option value="1">1x de R$ 347,00 (sem juros)</option>
                            <option value="2">2x de R$ 173,50 (sem juros)</option>
                            <option value="3">3x de R$ 115,67 (sem juros)</option>
                            <option value="6">6x de R$ 57,83 (sem juros)</option>
                            <option value="12">12x de R$ 34,70 (parcelado)</option>
                          </select>
                        </div>

                      </div>
                    )}

                    {/* PIX GENERATOR / QR CODE */}
                    {paymentMethod === "pix" && (
                      <div className="text-center py-4 space-y-4">
                        {!pixGenerated ? (
                          <div className="space-y-4">
                            <p className="text-xs text-on-surface-variant max-w-xs mx-auto leading-relaxed">
                              O código PIX e QR Code serão gerados imediatamente após clicar no botão abaixo.
                            </p>
                            <button
                              type="button"
                              onClick={handleGeneratePix}
                              disabled={generatingPix}
                              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs uppercase tracking-wider py-3 px-6 rounded-2xl transition-all active:scale-[0.98] inline-flex items-center gap-2 cursor-pointer"
                            >
                              {generatingPix ? (
                                <>
                                  <Loader2 size={16} className="animate-spin text-white" />
                                  Gerando Código...
                                </>
                              ) : (
                                "Gerar Código PIX"
                              )}
                            </button>
                          </div>
                        ) : (
                          <div className="space-y-6">
                            
                            {/* QR Code Simulation */}
                            <div className="w-40 h-40 bg-white p-2 rounded-2xl mx-auto flex items-center justify-center shadow-lg">
                              <svg className="w-36 h-36" viewBox="0 0 100 100" fill="none">
                                <rect width="100" height="100" fill="white"/>
                                {/* Mock QR Code Patterns */}
                                <rect x="5" y="5" width="25" height="25" fill="#052e16" stroke="white" strokeWidth="2"/>
                                <rect x="10" y="10" width="15" height="15" fill="white"/>
                                <rect x="13" y="13" width="9" height="9" fill="#052e16"/>
                                
                                <rect x="70" y="5" width="25" height="25" fill="#052e16" stroke="white" strokeWidth="2"/>
                                <rect x="75" y="10" width="15" height="15" fill="white"/>
                                <rect x="78" y="78" width="9" height="9" fill="#052e16"/>
                                
                                <rect x="5" y="70" width="25" height="25" fill="#052e16" stroke="white" strokeWidth="2"/>
                                <rect x="10" y="75" width="15" height="15" fill="white"/>
                                <rect x="13" y="78" width="9" height="9" fill="#052e16"/>
                                
                                <rect x="40" y="40" width="20" height="20" fill="#052e16"/>
                                <rect x="45" y="45" width="10" height="10" fill="white"/>
                                <rect x="48" y="48" width="4" height="4" fill="#052e16"/>
                                
                                <rect x="40" y="10" width="15" height="8" fill="#052e16"/>
                                <rect x="70" y="45" width="15" height="10" fill="#052e16"/>
                                <rect x="45" y="75" width="12" height="15" fill="#052e16"/>
                              </svg>
                            </div>
                            
                            <p className="text-[10px] text-on-surface-variant max-w-[250px] mx-auto leading-relaxed">
                              Escaneie o QR Code acima com seu app do banco ou copie o código Copia e Cola abaixo.
                            </p>

                            <div className="space-y-2">
                              <button
                                type="button"
                                onClick={copyPixCode}
                                className="w-full bg-surface hover:bg-surface-variant/40 text-on-surface py-3 rounded-2xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 border border-outline/15 transition-all cursor-pointer"
                              >
                                {copiedPix ? (
                                  <>
                                    <Check size={14} className="text-emerald-500" />
                                    Copiado!
                                  </>
                                ) : (
                                  <>
                                    <Copy size={14} />
                                    Copiar PIX Copia e Cola
                                  </>
                                )}
                              </button>
                            </div>

                          </div>
                        )}
                      </div>
                    )}

                  </div>
                </div>

                {/* Submit button */}
                <button
                  type="submit"
                  disabled={submitting || (paymentMethod === "pix" && !pixGenerated)}
                  className="w-full bg-[#10b981] hover:bg-[#059669] text-white py-4 rounded-2xl font-extrabold text-xs uppercase tracking-wider transition-all duration-300 shadow-xl shadow-[#10b981]/10 hover:scale-[1.01] active:scale-[0.98] disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2 mt-4"
                >
                  {submitting ? (
                    <>
                      <Loader2 size={16} className="animate-spin text-white" />
                      Processando Assinatura...
                    </>
                  ) : (
                    "Confirmar Assinatura"
                  )}
                </button>
                
                {/* Security and seals */}
                <div className="flex justify-between items-center text-[9px] text-on-surface-variant uppercase tracking-widest pt-4 border-t border-outline/10 font-bold">
                  <span>✓ Acesso Imediato</span>
                  <span>•</span>
                  <span>✓ Gateway Seguro</span>
                  <span>•</span>
                  <span>✓ Risco Zero</span>
                </div>

              </form>

            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
