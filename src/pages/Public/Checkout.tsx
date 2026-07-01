import React, { useState, useEffect } from "react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import { 
  ShieldCheck, 
  Lock, 
  Loader2, 
  AlertCircle, 
  ArrowLeft,
  Sprout,
  Copy,
  Check,
  RefreshCw,
  MessageCircle,
  CreditCard,
  QrCode,
  Zap,
  Award,
  CheckCircle2,
  Clock
} from "lucide-react";
import { toast } from "react-hot-toast";

declare global {
  interface Window {
    MercadoPago: any;
  }
}

export default function Checkout() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  // Dados do PIX gerado
  const [pixData, setPixData] = useState<{ qr_code: string; qr_code_base64: string; payment_id: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const [submittingPayment, setSubmittingPayment] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);

  // Estados para o popup de intenção de saída (Exit Intent)
  const [showExitPopup, setShowExitPopup] = useState(false);
  const [exitPopupShown, setExitPopupShown] = useState(false);

  useEffect(() => {
    const handleMouseLeave = (e: MouseEvent) => {
      if (e.clientY < 20 && !exitPopupShown) {
        setShowExitPopup(true);
        setExitPopupShown(true);
      }
    };

    document.addEventListener("mouseleave", handleMouseLeave);
    return () => {
      document.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, [exitPopupShown]);

  // Estado para armazenar o plano selecionado (inicia a partir da URL)
  const [selectedPlan, setSelectedPlan] = useState<'mensal' | 'anual'>(
    searchParams.get("plan") === "mensal" ? "mensal" : "anual"
  );

  // Sincroniza o estado do plano com as mudanças de parâmetro de busca na URL
  useEffect(() => {
    const planParam = searchParams.get("plan");
    if (planParam === "mensal" || planParam === "anual") {
      setSelectedPlan(planParam);
    }
  }, [searchParams]);

  // Preço oficial de produção (R$ 97 mensal / R$ 497 anual)
  const planPrice = selectedPlan === "mensal" ? 97.00 : 497.00;

  const handlePlanChange = (plan: 'mensal' | 'anual') => {
    setSelectedPlan(plan);
    setSearchParams({ plan });
    setPixData(null);
    setPaymentError(null);
  };

  const fetchProfileAndCheck = async (authUser: any) => {
    try {
      let profileData: any = null;
      
      const { data: dbProfile, error: profileError } = await supabase
        .from("user_profiles")
        .select("*")
        .eq("mocha_user_id", authUser.id)
        .maybeSingle();

      if (profileError) throw profileError;
      profileData = dbProfile;

      // Se o perfil não for encontrado por mocha_user_id (ex: novo login do Google)
      if (!profileData) {
        console.log("Perfil não encontrado pelo mocha_user_id. Buscando pelo e-mail:", authUser.email);
        const { data: emailProfile } = await supabase
          .from("user_profiles")
          .select("*")
          .ilike("email", authUser.email || "")
          .maybeSingle();

        if (emailProfile) {
          // Perfil já existia pelo e-mail, atualiza o mocha_user_id correspondente
          console.log("Perfil localizado pelo e-mail. Vinculando mocha_user_id...");
          const { data: updatedProfile, error: updateErr } = await supabase
            .from("user_profiles")
            .update({ mocha_user_id: authUser.id })
            .eq("id", emailProfile.id)
            .select()
            .single();

          if (!updateErr && updatedProfile) {
            profileData = updatedProfile;
          } else {
            profileData = emailProfile;
          }
        } else {
          // Cria um novo perfil de usuário caso não exista no banco
          console.log("Nenhum perfil localizado por e-mail. Criando novo perfil...");
          const newProfile = {
            mocha_user_id: authUser.id,
            email: authUser.email,
            full_name: authUser.user_metadata?.full_name || authUser.email?.split("@")[0] || "Usuário",
            is_active: false,
            role: "user"
          };

          const { data: insertedProfile, error: insertErr } = await supabase
            .from("user_profiles")
            .insert(newProfile)
            .select()
            .single();

          if (insertErr) {
            console.error("Falha ao inserir perfil de usuário:", insertErr);
            // Tentativa final de busca (em caso de concorrência com trigger do banco)
            const { data: retryProfile } = await supabase
              .from("user_profiles")
              .select("*")
              .eq("mocha_user_id", authUser.id)
              .maybeSingle();
            
            if (retryProfile) {
              profileData = retryProfile;
            } else {
              setPaymentError("Não foi possível criar ou localizar o seu perfil de usuário. Entre em contato com o suporte.");
              return false;
            }
          } else {
            profileData = insertedProfile;
          }
        }
      }

      if (profileData) {
        if (profileData.role === 'admin') {
          setProfile((prev: any) => {
            if (prev?.id === profileData.id && prev?.role === profileData.role) return prev;
            return profileData;
          });
          toast.success("Bem-vindo, Administrador!");
          navigate("/dashboard");
          return true;
        }



        setProfile((prev: any) => {
          if (
            prev?.id === profileData.id && 
            prev?.is_active === profileData.is_active && 
            prev?.email === profileData.email &&
            prev?.full_name === profileData.full_name &&
            prev?.cpf === profileData.cpf
          ) {
            return prev;
          }
          return profileData;
        });

        if (profileData.is_active) {
          toast.success("Sua assinatura já está ativa!");
          navigate("/dashboard");
          return true;
        }
      }
    } catch (err) {
      console.error("Error loading user profile:", err);
    }
    return false;
  };

  useEffect(() => {
    const checkAuth = async () => {
      setLoading(true);
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) {
        toast.error("Identifique-se primeiro para realizar a assinatura.");
        navigate("/auth/register");
        return;
      }
      setUser(authUser);
      await fetchProfileAndCheck(authUser);
      setLoading(false);
    };

    checkAuth();
  }, [navigate]);

  // Auto-remoção do Service Worker na tela de checkout para evitar qualquer interceptação de requisições de pagamento
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        let hasActive = false;
        for (const registration of registrations) {
          hasActive = true;
          registration.unregister().then((unregistered) => {
            if (unregistered) {
              console.log('Service Worker desativado com sucesso para o checkout.');
            }
          });
        }
        // Recarrega apenas UMA vez para limpar a sessão caso houvesse um SW ativo controlando a página
        if (hasActive) {
          const hasReloadedKey = 'checkout_sw_cleared_reload';
          const hasReloaded = sessionStorage.getItem(hasReloadedKey);
          if (!hasReloaded) {
            sessionStorage.setItem(hasReloadedKey, 'true');
            setTimeout(() => {
              window.location.reload();
            }, 500);
          }
        }
      });
    }
  }, []);

  // Polling de 3 segundos para detectar aprovação do pagamento
  useEffect(() => {
    if (!user || profile?.is_active) return;

    const interval = setInterval(async () => {
      await fetchProfileAndCheck(user);
    }, 3000);

    return () => clearInterval(interval);
  }, [user, profile?.is_active]);

  // Efeito para renderizar o Mercado Pago Payment Brick
  useEffect(() => {
    if (loading || !profile || pixData) return;

    let cardBrickController: any;

    const initMercadoPago = async () => {
      try {
        if (!window.MercadoPago) {
          console.error("Mercado Pago SDK script não foi carregado na janela global.");
          return;
        }

        const publicKey = import.meta.env.VITE_MERCADO_PAGO_PUBLIC_KEY;
        if (!publicKey) {
          setPaymentError("Aviso para o Administrador: A chave pública do Mercado Pago (VITE_MERCADO_PAGO_PUBLIC_KEY) não está configurada no ambiente.");
          return;
        }

        const mp = new window.MercadoPago(publicKey, {
          locale: "pt-BR"
        });

        const bricksBuilder = mp.bricks();

        const renderPaymentBrick = async () => {
          const settings = {
            initialization: {
              amount: planPrice,
              payer: {
                email: profile.email || user?.email || "",
                firstName: profile.full_name?.split(" ")[0] || "",
                lastName: profile.full_name?.split(" ").slice(1).join(" ") || "",
                entityType: "individual",
                ...(profile.cpf ? {
                  identification: {
                    type: "CPF",
                    number: profile.cpf
                  }
                } : {})
              }
            },
            customization: {
              paymentMethods: {
                creditCard: "all",
                debitCard: "all",
                bankTransfer: ["pix"]
              },
              visual: {
                style: {
                  theme: "default",
                  customVariables: {
                    baseColor: "#10b981"
                  }
                }
              }
            },
            callbacks: {
              onReady: () => {
                console.log("Mercado Pago Payment Brick pronto.");
              },
              onSubmit: ({ selectedPaymentMethod, formData }: any) => {
                return new Promise<void>((resolve, reject) => {
                  setSubmittingPayment(true);
                  setPaymentError(null);

                  fetch("/api/process-payment", {
                    method: "POST",
                    headers: {
                      "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                      formData,
                      plan: selectedPlan,
                      user_id: profile.id
                    })
                  })
                  .then(async (res) => {
                    const data = await res.json();
                    if (!res.ok) {
                      throw new Error(data.error || "Erro ao processar o pagamento.");
                    }

                    if (data.payment_method_id === "pix") {
                      setPixData({
                        qr_code: data.qr_code,
                        qr_code_base64: data.qr_code_base64,
                        payment_id: data.payment_id
                      });
                      resolve();
                    } else if (data.status === "approved") {
                      toast.success("Assinatura realizada com sucesso!");
                      navigate("/dashboard");
                      resolve();
                    } else {
                      throw new Error("O pagamento não pôde ser aprovado. Verifique os dados do cartão.");
                    }
                  })
                  .catch((err) => {
                    console.error("Payment submission error:", err);
                    setPaymentError(err.message || "Erro no processamento do pagamento.");
                    toast.error(err.message || "Erro no processamento do pagamento.");
                    reject(err);
                  })
                  .finally(() => {
                    setSubmittingPayment(false);
                  });
                });
              },
              onError: (error: any) => {
                console.error("Mercado Pago Brick error callback:", error);
                setPaymentError("Erro ao carregar o formulário de pagamento.");
              }
            }
          };

          const container = document.getElementById("paymentBrick_container");
          if (container) {
            container.innerHTML = "";
            cardBrickController = await bricksBuilder.create(
              "payment",
              "paymentBrick_container",
              settings
            );
          }
        };

        await renderPaymentBrick();
      } catch (err) {
        console.error("Erro geral na inicialização do Mercado Pago:", err);
      }
    };

    const timer = setTimeout(() => {
      initMercadoPago();
    }, 100);

    return () => {
      clearTimeout(timer);
      if (cardBrickController && typeof cardBrickController.unmount === "function") {
        try {
          cardBrickController.unmount();
        } catch (unmountErr) {
          console.warn("Erro ao desmontar o Mercado Pago Brick:", unmountErr);
        }
      }
    };
  }, [
    loading, 
    profile?.id, 
    profile?.email, 
    profile?.full_name, 
    profile?.cpf, 
    selectedPlan, 
    planPrice, 
    pixData ? true : false
  ]);

  const handleCopyPix = () => {
    if (pixData?.qr_code) {
      navigator.clipboard.writeText(pixData.qr_code);
      setCopied(true);
      toast.success("Chave Pix copiada!");
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const closeExitPopup = () => {
    setShowExitPopup(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background text-on-surface flex flex-col items-center justify-center p-6">
        <Loader2 className="w-10 h-10 animate-spin text-emerald-500 mb-4" />
        <p className="font-bold text-sm tracking-wider uppercase text-zinc-400">Verificando status de acesso...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#070b0e] text-zinc-200 font-sans py-12 px-4 md:px-8 relative selection:bg-emerald-500/30 overflow-x-hidden">
      {/* Decorative backdrop glow spots */}
      <div className="glow-spot glow-green absolute top-[10%] left-[-15%] w-[65%] aspect-square rounded-full bg-emerald-500/5 blur-[150px] pointer-events-none" />
      <div className="glow-spot glow-primary absolute bottom-[20%] right-[-15%] w-[65%] aspect-square rounded-full bg-emerald-800/5 blur-[150px] pointer-events-none" />

      {/* Main Container */}
      <div className="max-w-6xl w-full mx-auto relative z-10 space-y-6">
        
        {/* Navigation & Header */}
        <div className="flex items-center justify-between border-b border-zinc-800/50 pb-4">
          <Link to="/" className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors text-xs font-bold uppercase tracking-wider">
            <ArrowLeft size={16} />
            Voltar para o início
          </Link>
          <div className="flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-full text-[10px] font-bold text-emerald-400 uppercase tracking-widest">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            Conexão Segura
          </div>
        </div>

        {/* 2-Column Responsive Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Column Left: Plan Selection and Form (lg:col-span-7) */}
          <div className="lg:col-span-7 space-y-6">
            
            <div className="bg-zinc-900 border border-zinc-850 rounded-[2.5rem] shadow-2xl overflow-hidden">
              {/* Top Banner image or styled header */}
              <div className="w-full relative bg-gradient-to-r from-emerald-950 to-zinc-950 min-h-[140px] flex flex-col justify-center px-6 py-6 border-b border-zinc-850">
                <img 
                  src="/images/checkout-banner.png" 
                  alt="Bananal PRO Checkout Banner" 
                  className="absolute inset-0 w-full h-full object-cover opacity-35 mix-blend-overlay"
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                  }}
                />
                <div className="relative z-10 space-y-1.5 text-left">
                  <span className="text-[9px] font-black tracking-widest text-emerald-400 uppercase bg-emerald-500/10 px-2 py-0.5 rounded-full">
                    Acesso Imediato
                  </span>
                  <h2 className="text-xl md:text-2xl font-black text-white leading-tight uppercase tracking-tight">
                    Adquirir Treinamento Bananal PRO
                  </h2>
                  <p className="text-xs text-zinc-400 max-w-md">
                    Seu cadastro foi realizado com sucesso! Conclua sua aquisição abaixo para liberar o acesso instantâneo ao ecossistema.
                  </p>
                </div>
              </div>

              {/* Plan Selector inside Card */}
              <div className="p-6 md:p-8 space-y-6 text-left">
                
                {/* Selector Header */}
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest block">
                    Escolha o seu plano de acesso:
                  </label>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Plano Anual (Recomendado) */}
                    <button
                      type="button"
                      onClick={() => handlePlanChange('anual')}
                      className={`relative p-5 rounded-2xl text-left border transition-all cursor-pointer flex flex-col justify-between min-h-[120px] ${
                        selectedPlan === 'anual' 
                          ? 'bg-emerald-950/20 border-emerald-500 text-white ring-1 ring-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.1)]' 
                          : 'bg-zinc-950/50 border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'
                      }`}
                    >
                      <span className="absolute top-2 right-2 bg-emerald-500 text-black text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
                        Economize 57%
                      </span>
                      <div className="space-y-0.5">
                        <span className="text-xs font-black uppercase tracking-wider block">Plano Anual</span>
                        <span className="text-[9px] text-zinc-500 block">Acesso completo por 12 meses</span>
                      </div>
                      <div className="mt-4 pt-2 border-t border-zinc-800/80 w-full flex items-baseline gap-1">
                        <span className="text-[9px] text-zinc-500 font-medium">12x de</span>
                        <span className="text-base font-black text-white">R$ 49,70</span>
                        <span className="text-[9px] text-zinc-500">ou R$ 497 à vista</span>
                      </div>
                    </button>

                    {/* Plano Mensal */}
                    <button
                      type="button"
                      onClick={() => handlePlanChange('mensal')}
                      className={`p-5 rounded-2xl text-left border transition-all cursor-pointer flex flex-col justify-between min-h-[120px] ${
                        selectedPlan === 'mensal' 
                          ? 'bg-emerald-950/20 border-emerald-500 text-white ring-1 ring-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.1)]' 
                          : 'bg-zinc-950/50 border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'
                      }`}
                    >
                      <div className="space-y-0.5">
                        <span className="text-xs font-black uppercase tracking-wider block">Plano Mensal</span>
                        <span className="text-[9px] text-zinc-500 block">Cobrança recorrente automática</span>
                      </div>
                      <div className="mt-4 pt-2 border-t border-zinc-800/80 w-full flex items-baseline gap-1">
                        <span className="text-base font-black text-white">R$ 97,00</span>
                        <span className="text-[9px] text-zinc-500">/ mês</span>
                      </div>
                    </button>
                  </div>
                </div>

                {/* Divider */}
                <div className="border-t border-zinc-850 pt-6">
                  <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest block mb-4">
                    Dados do Pagamento:
                  </label>

                  {paymentError && (
                    <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-2xl mb-4 text-xs font-bold flex items-center gap-2">
                      <AlertCircle size={16} className="shrink-0" />
                      <span>{paymentError}</span>
                    </div>
                  )}

                  {submittingPayment && (
                    <div className="flex flex-col items-center justify-center py-8 space-y-3 bg-zinc-950/55 rounded-2xl border border-zinc-850">
                      <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
                      <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Processando seu pagamento...</p>
                    </div>
                  )}

                  {/* Custom PIX Screen */}
                  <div style={{ display: pixData ? "block" : "none" }}>
                    {pixData && (
                      <div className="space-y-6 text-center bg-zinc-950/50 border border-zinc-850 p-6 rounded-[2rem] animate-fade-in">
                        <div className="flex items-center justify-center gap-2 text-emerald-400 font-black text-sm uppercase tracking-wider">
                          <QrCode size={20} />
                          PIX Gerado com Sucesso!
                        </div>

                        {pixData.qr_code_base64 && (
                          <div className="bg-white p-4 rounded-2xl inline-block shadow-md border border-zinc-800">
                            <img 
                              src={`data:image/jpeg;base64,${pixData.qr_code_base64}`} 
                              alt="QR Code do PIX" 
                              className="w-48 h-48 mx-auto"
                            />
                          </div>
                        )}

                        <div className="space-y-2">
                          <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider text-left">Código Pix Copia e Cola</p>
                          <div className="flex gap-2">
                            <input 
                              type="text" 
                              readOnly 
                              value={pixData.qr_code}
                              className="flex-grow bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-xs font-mono text-zinc-300 focus:outline-none"
                            />
                            <button
                              onClick={handleCopyPix}
                              className="bg-emerald-600 hover:bg-emerald-700 text-white p-3.5 rounded-xl transition-all flex items-center justify-center shrink-0 shadow-md cursor-pointer"
                              title="Copiar código"
                            >
                              {copied ? <Check size={16} /> : <Copy size={16} />}
                            </button>
                          </div>
                        </div>

                        <div className="flex items-center justify-center gap-2 py-2 text-xs font-bold text-zinc-500">
                          <Loader2 size={14} className="animate-spin text-emerald-500" />
                          Aguardando confirmação... Seu acesso ao treinamento será liberado em segundos!
                        </div>

                        <button
                          onClick={() => setPixData(null)}
                          className="text-xs font-bold text-zinc-500 hover:text-white transition-colors underline cursor-pointer"
                        >
                          Escolher outra forma de pagamento
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Mercado Pago Payment Brick Container */}
                  <div 
                    id="paymentBrick_container" 
                    style={{ display: pixData ? "none" : "block" }}
                    className={`w-full transition-opacity ${submittingPayment ? "opacity-30 pointer-events-none" : "opacity-100"}`}
                  ></div>
                </div>

              </div>
            </div>

            {/* Trust Footer below left card */}
            <div className="flex items-center justify-center gap-2 text-[9px] font-black uppercase tracking-widest text-zinc-500 py-2">
              <Lock size={12} className="text-emerald-500" />
              Pagamento Processado com Criptografia SSL
            </div>

          </div>

          {/* Column Right: Product Details, Guarantee and Urgency (lg:col-span-5) */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* Product Card */}
            <div className="bg-zinc-900 border border-zinc-850 rounded-[2.5rem] p-8 shadow-2xl space-y-6 text-center">
              
              {/* Product Image / Mockup with robust CSS Fallback */}
              <div className="w-full relative aspect-square max-w-[240px] mx-auto rounded-[2rem] overflow-hidden flex items-center justify-center bg-gradient-to-br from-emerald-950/20 to-zinc-950 border border-zinc-800 shadow-md">
                <img 
                  src="/images/product-box.png" 
                  alt="Mockup Bananal PRO" 
                  className="w-full h-full object-contain"
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                    const placeholder = e.currentTarget.parentElement?.querySelector(".box-placeholder");
                    if (placeholder) placeholder.setAttribute("style", "display: flex;");
                  }}
                />
                <div 
                  className="box-placeholder w-full h-full hidden flex-col items-center justify-center p-6 text-center space-y-4 bg-gradient-to-br from-emerald-600/20 to-zinc-950"
                >
                  <div className="w-16 h-16 rounded-3xl bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center text-emerald-400">
                    <Sprout size={36} />
                  </div>
                  <div>
                    <h3 className="text-md font-black text-white uppercase tracking-tight">Comunidade Bananal PRO</h3>
                    <p className="text-[9px] text-zinc-500 uppercase tracking-widest mt-1">Treinamento & Tecnologia</p>
                  </div>
                </div>
              </div>

              {/* Product Pricing Summary Badge */}
              <div className="bg-zinc-950/50 border border-zinc-850 p-4 rounded-2xl text-left space-y-1">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-black text-zinc-500 uppercase tracking-wider">Assinatura Selecionada</span>
                  <span className="text-xs font-black text-emerald-400 uppercase tracking-wider">
                    {selectedPlan === 'mensal' ? 'Plano Mensal' : 'Plano Anual'}
                  </span>
                </div>
                <div className="flex justify-between items-baseline pt-1">
                  <span className="text-[10px] font-black text-zinc-500 uppercase tracking-wider">Total</span>
                  <span className="text-lg font-black text-white">
                    {selectedPlan === 'mensal' ? 'R$ 97,00/mês' : 'R$ 497,00/ano'}
                  </span>
                </div>
              </div>

              {/* Urgency Counter */}
              <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-2xl p-4 flex items-center gap-3 text-left">
                <span className="flex h-2 w-2 relative shrink-0">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <p className="text-[11px] text-zinc-400">
                  <strong className="text-white">27 produtores</strong> estão finalizando a inscrição na plataforma nesta semana.
                </p>
              </div>

              {/* O QUE VOCÊ VAI RECEBER */}
              <div className="space-y-4 text-left">
                <h3 className="text-[10px] font-black text-zinc-400 uppercase tracking-widest border-b border-zinc-850 pb-2">
                  O QUE VOCÊ VAI RECEBER:
                </h3>
                <ul className="space-y-3.5 text-xs text-zinc-300">
                  <li className="flex items-start gap-2.5">
                    <CheckCircle2 size={16} className="text-emerald-400 shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-white">Treinamento Bananal PRO</strong>: Acesso completo aos cursos técnicos de recomendação de adubação e manejo.
                    </div>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <CheckCircle2 size={16} className="text-emerald-400 shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-white">Calculadoras de Nutrição</strong>: Interpretação de química de solo e dosagem ideal de calagem instantânea.
                    </div>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <CheckCircle2 size={16} className="text-emerald-400 shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-white">Alertas de Sigatoka</strong>: Ferramenta climática avançada para controle estratégico de pulverizações.
                    </div>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <CheckCircle2 size={16} className="text-emerald-400 shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-white">Cartão Digital de Produtor</strong>: Acesso a convênios de desconto em fertilizantes, mudas e defensivos.
                    </div>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <CheckCircle2 size={16} className="text-emerald-400 shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-white">Fórum da Comunidade</strong>: Espaço de networking com outros bananicultores e especialistas.
                    </div>
                  </li>
                </ul>
              </div>

            </div>

            {/* Satisfaction Guarantee Seal */}
            <div className="bg-zinc-900 border border-zinc-850 rounded-[2rem] p-6 flex items-start gap-4 text-left shadow-md">
              <Award size={36} className="text-amber-500 shrink-0" />
              <div className="space-y-1">
                <h4 className="text-xs font-black text-white uppercase tracking-wider">GARANTIA INCONDICIONAL DE 7 DIAS</h4>
                <p className="text-[10px] text-zinc-400 leading-relaxed">
                  Sem riscos! Se por qualquer motivo você decidir que a plataforma não vale o investimento, envie uma mensagem de cancelamento em até 7 dias e devolvemos cada centavo.
                </p>
              </div>
            </div>

            {/* Direct Support WhatsApp Box */}
            <div className="bg-[#25D366]/5 border border-[#25D366]/10 rounded-[2rem] p-6 flex items-start gap-4 shadow-md">
              <div className="w-12 h-12 rounded-full bg-[#25D366]/10 border border-[#25D366]/20 flex items-center justify-center shrink-0 text-[#25D366]">
                <MessageCircle size={24} />
              </div>
              <div className="space-y-1 text-left">
                <h4 className="text-sm font-bold text-white">Precisa de Ajuda com a Compra?</h4>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Fale com nosso suporte para resolver dúvidas sobre faturamento, nota fiscal ou liberação de acesso.
                </p>
                <a 
                  href="https://wa.me/5521969014654?text=Olá!%20Gostaria%20de%20ajuda%20com%20o%20checkout%20do%20Bananal%20PRO." 
                  target="_blank" 
                  rel="noreferrer"
                  className="text-xs font-bold text-[#25D366] hover:underline inline-flex items-center gap-1 pt-1.5 cursor-pointer"
                >
                  Chamar Suporte no WhatsApp (21) 96901-4654
                </a>
              </div>
            </div>

          </div>

        </div>

      </div>

      {/* Exit Intent Popup Modal */}
      {showExitPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-fade-in">
          <div className="relative max-w-sm w-full bg-zinc-900 border border-zinc-800 rounded-[2rem] p-8 text-center space-y-6 shadow-2xl">
            {/* Close Button */}
            <button 
              onClick={closeExitPopup}
              className="absolute top-4 right-4 text-zinc-500 hover:text-white transition-colors cursor-pointer"
              title="Fechar"
            >
              <AlertCircle size={20} className="rotate-45" />
            </button>

            {/* humanization image with fallback */}
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-emerald-500 to-zinc-800 mx-auto overflow-hidden border border-emerald-500/20 shadow-md">
              <img 
                src="/images/support-face.png" 
                alt="Jean Carlos Suporte" 
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.currentTarget.style.display = "none";
                  const fallback = e.currentTarget.parentElement?.querySelector(".face-fallback");
                  if (fallback) fallback.setAttribute("style", "display: flex;");
                }}
              />
              <div 
                className="face-fallback w-full h-full hidden items-center justify-center text-emerald-400 font-bold uppercase tracking-wider text-2xl"
              >
                JC
              </div>
            </div>

            <div className="space-y-2">
              <span className="text-[9px] font-black uppercase tracking-widest text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full">
                Não vá embora com dúvidas!
              </span>
              <h3 className="text-lg font-black text-white leading-tight uppercase">
                Posso te ajudar a começar?
              </h3>
              <p className="text-[11px] text-zinc-400 leading-relaxed">
                Ficou com alguma dúvida sobre as ferramentas, calculadoras ou o processo de pagamento? Me chame no WhatsApp e te ajudo agora mesmo.
              </p>
            </div>

            <a 
              href="https://wa.me/5521969014654?text=Olá!%20Estou%20na%20tela%20de%20checkout%20do%20Bananal%20PRO%20e%20gostaria%20de%20tirar%20uma%20dúvida."
              target="_blank"
              rel="noreferrer"
              onClick={closeExitPopup}
              className="w-full bg-[#25D366] hover:bg-[#20ba5a] text-zinc-950 font-black text-xs uppercase tracking-wider py-4 px-6 rounded-2xl transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer"
            >
              <MessageCircle size={18} fill="currentColor" />
              Conversar no WhatsApp
            </a>

            <button 
              onClick={closeExitPopup}
              className="text-xs font-bold text-zinc-505 hover:text-zinc-300 transition-colors underline cursor-pointer"
            >
              Continuar no Checkout
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
