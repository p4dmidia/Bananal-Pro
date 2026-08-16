import React, { useState, useEffect } from "react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../contexts/AuthContext";
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
  Clock,
  Users
} from "lucide-react";
import { toast } from "react-hot-toast";

declare global {
  interface Window {
    MercadoPago: any;
  }
}

export default function Checkout() {
  const navigate = useNavigate();
  const { refreshProfile } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  // Dados do PIX gerado (restaura do sessionStorage se houver)
  const [pixData, setPixData] = useState<{ qr_code: string; qr_code_base64: string; payment_id: string } | null>(() => {
    const saved = sessionStorage.getItem("pending_pix_data");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Erro ao restaurar pixData do sessionStorage:", e);
      }
    }
    return null;
  });
  const [copied, setCopied] = useState(false);
  const [submittingPayment, setSubmittingPayment] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [hasPaymentDecline, setHasPaymentDecline] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState<'credit_card' | 'pix'>('credit_card');
  const [cpf, setCpf] = useState("");

  // Sincroniza o CPF caso mude ou venha do banco
  useEffect(() => {
    if (profile?.cpf) {
      setCpf(profile.cpf);
    }
  }, [profile?.cpf]);

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
  const planPrice = selectedPlan === 'mensal' ? 97.00 : 497.00;

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
        // Busca se há alguma ordem de cartão de crédito cancelada recente
        try {
          const { data: recentOrders } = await supabase
            .from("orders")
            .select("*")
            .eq("user_id", profileData.id)
            .eq("payment_method", "Cartão de Crédito")
            .eq("status", "cancelled")
            .order("created_at", { ascending: false })
            .limit(1);

          if (recentOrders && recentOrders.length > 0) {
            setHasPaymentDecline(true);
          } else {
            setHasPaymentDecline(false);
          }
        } catch (orderErr) {
          console.error("Erro ao buscar ordens canceladas:", orderErr);
        }
        if (profileData.role === 'admin') {
          setProfile((prev: any) => {
            if (prev?.id === profileData.id && prev?.role === profileData.role) return prev;
            return profileData;
          });
          sessionStorage.removeItem("pending_pix_data");
          toast.success("Bem-vindo, Administrador!");
          await refreshProfile();
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
          sessionStorage.removeItem("pending_pix_data");
          toast.success("Sua assinatura já está ativa!");
          await refreshProfile();
          navigate("/dashboard?payment_confirmed=true");
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

  // Polling de 3 segundos para detectar aprovação do pagamento geral
  useEffect(() => {
    if (!user || profile?.is_active) return;

    const interval = setInterval(async () => {
      await fetchProfileAndCheck(user);
    }, 3000);

    return () => clearInterval(interval);
  }, [user, profile?.is_active]);

  // Polling de 3 segundos para detectar aprovação do pagamento PIX de forma ativa
  useEffect(() => {
    if (!pixData || !user || profile?.is_active) return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/check-payment-status?payment_id=${pixData.payment_id}&user_id=${profile?.id || ""}`);
        const data = await res.json();
        
        if (data.status === "approved") {
          clearInterval(interval);
          sessionStorage.removeItem("pending_pix_data");
          toast.success("Pagamento aprovado com sucesso! Redirecionando...");
          await refreshProfile();
          await fetchProfileAndCheck(user);
          navigate("/dashboard?payment_confirmed=true");
        }
      } catch (err) {
        console.error("Erro ao verificar status do pagamento PIX:", err);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [pixData, user, profile?.id, profile?.is_active, navigate]);

  // Função para processar o pagamento com cartão de crédito (Redirect) ou Pix (Geração on-page)
  const handleProcessPayment = async () => {
    setSubmittingPayment(true);
    setPaymentError(null);

    try {
      const payload = {
        plan: selectedPlan,
        user_id: profile?.id,
        payment_method_id: selectedMethod,
        payer_email: profile?.email || user?.email || "",
        first_name: profile?.full_name?.split(" ")[0] || "Produtor",
        last_name: profile?.full_name?.split(" ").slice(1).join(" ") || "Banana",
        cpf: selectedMethod === 'pix' ? cpf.replace(/\D/g, '') : undefined
      };

      const res = await fetch("/api/process-payment", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Erro ao processar pagamento.");
      }

      if (selectedMethod === 'pix') {
        const pixObj = {
          qr_code: data.qr_code,
          qr_code_base64: data.qr_code_base64,
          payment_id: data.payment_id
        };
        sessionStorage.setItem("pending_pix_data", JSON.stringify(pixObj));
        setPixData(pixObj);
      } else if (selectedMethod === 'credit_card' && data.init_point) {
        // Redireciona o usuário para o checkout seguro hospedado no Mercado Pago
        window.location.href = data.init_point;
      } else {
        throw new Error("Opção de pagamento inválida ou erro na resposta do servidor.");
      }
    } catch (err: any) {
      console.error("Payment error:", err);
      setPaymentError(err.message || "Erro no processamento do pagamento.");
      toast.error(err.message || "Erro no processamento do pagamento.");
    } finally {
      setSubmittingPayment(false);
    }
  };

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
    <div className="min-h-screen bg-[#F8FAFC] text-slate-800 font-sans selection:bg-[#22C55E]/30 overflow-x-hidden pb-16">
      {/* CSS Keyframes and Float Animations */}
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        @keyframes shadowPulse {
          0%, 100% { transform: scale(1); opacity: 0.12; }
          50% { transform: scale(0.85); opacity: 0.05; }
        }
        .animate-float {
          animation: float 4s ease-in-out infinite;
        }
        .animate-shadow {
          animation: shadowPulse 4s ease-in-out infinite;
        }
        .font-inter-extrabold {
          font-family: 'Inter', sans-serif;
          font-weight: 800;
        }
        .font-inter-medium {
          font-family: 'Inter', sans-serif;
          font-weight: 500;
        }
        .font-inter-semibold {
          font-family: 'Inter', sans-serif;
          font-weight: 600;
        }
      `}</style>

      {/* Main Content Area */}
      <div className="max-w-6xl w-full mx-auto relative z-10 space-y-6 px-4 md:px-8 pt-8">
        
        {/* Navigation & Header */}
        <div className="flex items-center justify-between border-b border-zinc-200 pb-4">
          <Link to="/" className="flex items-center gap-2 text-zinc-500 hover:text-[#021B13] transition-colors text-xs font-inter-semibold uppercase tracking-wider">
            <ArrowLeft size={16} />
            Voltar para o início
          </Link>
          <div className="flex items-center gap-1.5 bg-[#22C55E]/10 border border-[#22C55E]/20 px-3 py-1.5 rounded-full text-[10px] font-inter-semibold text-[#16a34a] uppercase tracking-widest">
            <span className="w-1.5 h-1.5 rounded-full bg-[#22C55E] animate-pulse"></span>
            Conexão Segura
          </div>
        </div>

        {/* 2-Column Responsive Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Column Left: Plan Selection and Form (lg:col-span-7) */}
          <div className="lg:col-span-7 space-y-6">
            
            <div className="bg-white border border-zinc-200/80 rounded-[2.5rem] shadow-lg overflow-hidden">
              {/* Top Banner image - displayed fully and without cuts */}
              <div className="w-full relative bg-zinc-950/40">
                <img 
                  src="/images/checkout-banner.png" 
                  alt="Banana PRO Checkout" 
                  className="w-full h-auto block"
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                    const fallback = e.currentTarget.parentElement?.querySelector(".banner-fallback");
                    if (fallback) fallback.setAttribute("style", "display: flex;");
                  }}
                />
                <div 
                  className="banner-fallback hidden w-full min-h-[120px] flex-col justify-center px-6 py-6 border-b border-zinc-250 bg-gradient-to-r from-[#021B13] to-[#042c1f]"
                >
                  <span className="text-[9px] font-inter-extrabold tracking-widest text-[#22C55E] uppercase bg-[#22C55E]/10 px-2 py-0.5 rounded-full w-max">
                    Acesso Imediato
                  </span>
                  <h2 className="text-xl font-inter-extrabold text-white leading-tight uppercase mt-1.5">
                    Adquirir Treinamento Banana PRO
                  </h2>
                  <p className="text-xs text-zinc-300 max-w-md">
                    Seu cadastro foi realizado com sucesso! Conclua sua aquisição abaixo para liberar o acesso instantâneo.
                  </p>
                </div>
              </div>

              {/* Plan Selector inside Card */}
              <div className="p-6 md:p-8 space-y-6 text-left">
                
                {/* Selector Header */}
                <div className="space-y-3">
                  <label className="text-[10px] font-inter-extrabold text-zinc-500 uppercase tracking-widest block">
                    Escolha o seu plano de acesso:
                  </label>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Plano Anual (Mais Escolhido) */}
                    <button
                      type="button"
                      onClick={() => handlePlanChange('anual')}
                      className={`relative p-5 rounded-2xl text-left border transition-all cursor-pointer flex flex-col justify-between min-h-[120px] ${
                        selectedPlan === 'anual' 
                          ? 'bg-[#f0fdf4] border-[#22C55E] text-[#021B13] ring-1 ring-[#22C55E] shadow-[0_4px_20px_rgba(34,197,94,0.08)]' 
                          : 'bg-white border-zinc-200 text-zinc-600 hover:border-zinc-300 hover:text-zinc-800'
                      }`}
                    >
                      <span className="absolute -top-2.5 right-4 bg-[#22C55E] text-white text-[8px] font-inter-extrabold px-2.5 py-1 rounded-full uppercase tracking-widest shadow-md">
                        MAIS ESCOLHIDO
                      </span>
                      <div className="space-y-0.5">
                        <span className="text-xs font-inter-extrabold uppercase tracking-wider block">Plano Anual</span>
                        <span className="text-[9px] text-[#16a34a] font-bold block">Economize 57%</span>
                      </div>
                      <div className="mt-4 pt-2 border-t border-zinc-150 w-full flex items-baseline gap-1">
                        <span className="text-[9px] text-zinc-500 font-medium font-inter-medium">12x de</span>
                        <span className="text-base font-inter-extrabold text-[#16a34a]">R$ 49,70</span>
                        <span className="text-[9px] text-zinc-400 font-inter-medium">ou R$ 497 à vista</span>
                      </div>
                    </button>

                    {/* Plano Mensal */}
                    <button
                      type="button"
                      onClick={() => handlePlanChange('mensal')}
                      className={`p-5 rounded-2xl text-left border transition-all cursor-pointer flex flex-col justify-between min-h-[120px] ${
                        selectedPlan === 'mensal' 
                          ? 'bg-[#f0fdf4] border-[#22C55E] text-[#021B13] ring-1 ring-[#22C55E] shadow-[0_4px_20px_rgba(34,197,94,0.08)]' 
                          : 'bg-white border-zinc-200 text-zinc-600 hover:border-zinc-300 hover:text-zinc-800'
                      }`}
                    >
                      <div className="space-y-0.5">
                        <span className="text-xs font-inter-extrabold uppercase tracking-wider block">Plano Mensal</span>
                        <span className="text-[9px] text-zinc-500 block font-inter-medium">Sem fidelidade, cancele quando quiser</span>
                      </div>
                      <div className="mt-4 pt-2 border-t border-zinc-150 w-full flex items-baseline gap-1">
                        <span className="text-base font-inter-extrabold text-zinc-800">R$ 97,00</span>
                        <span className="text-[9px] text-zinc-500 font-inter-medium">/ mês</span>
                      </div>
                    </button>
                  </div>
                </div>

                {/* Divider */}
                <div className="border-t border-zinc-200 pt-6">
                  <label className="text-[10px] font-inter-extrabold text-zinc-500 uppercase tracking-widest block mb-4">
                    Dados do Pagamento:
                  </label>

                  {hasPaymentDecline && (
                    <div className="bg-amber-500/10 border border-amber-500/20 text-amber-800 p-5 rounded-2xl mb-4 text-xs font-inter-semibold flex flex-col gap-2 shadow-[0_4px_12px_rgba(245,158,11,0.03)]">
                      <div className="flex items-center gap-2 font-inter-bold text-[13px]">
                        <AlertCircle size={18} className="shrink-0 text-amber-600" />
                        Aviso sobre sua assinatura
                      </div>
                      <p className="text-zinc-650 leading-relaxed font-inter-medium">
                        O seu banco recusou a cobrança inicial da sua assinatura no valor de <strong>R$ {selectedPlan === 'mensal' ? '97,00' : '497,00'}</strong> devido a limite insuficiente ou bloqueio temporário do cartão.
                      </p>
                      <p className="text-zinc-650 font-inter-medium">
                        Por favor, <strong>tente com outro cartão de crédito</strong> ou faça o pagamento via <strong>PIX</strong> para ativar sua assinatura agora.
                      </p>
                      <div className="mt-2 pt-3 border-t border-amber-500/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <span className="text-[11px] text-zinc-500 font-inter-medium">
                          Precisa de ajuda com o seu pagamento?
                        </span>
                        <a
                          href="https://wa.me/5521969014654?text=Ol%C3%A1%2C%20tive%20um%20problema%20com%20o%20pagamento%20da%20minha%20assinatura%20e%20gostaria%20de%20ajuda%20para%20regularizar."
                          target="_blank"
                          rel="noopener noreferrer"
                          className="bg-[#25D366] hover:bg-[#20ba5a] text-white px-4 py-2.5 rounded-xl font-inter-bold text-[11px] uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-sm shrink-0"
                        >
                          <MessageCircle size={14} />
                          Falar no WhatsApp
                        </a>
                      </div>
                    </div>
                  )}

                  {paymentError && (
                    <div className="bg-red-500/10 border border-red-500/20 text-red-650 p-4 rounded-2xl mb-4 text-xs font-inter-semibold flex items-center gap-2">
                      <AlertCircle size={16} className="shrink-0" />
                      <span>{paymentError}</span>
                    </div>
                  )}

                  {submittingPayment && (
                    <div className="flex flex-col items-center justify-center py-8 space-y-3 bg-zinc-50 rounded-2xl border border-zinc-200">
                      <Loader2 className="w-8 h-8 animate-spin text-[#22C55E]" />
                      <p className="text-xs font-inter-semibold text-zinc-500 uppercase tracking-wider">Processando seu pagamento...</p>
                    </div>
                  )}

                  {/* Custom PIX Screen */}
                  <div style={{ display: pixData ? "block" : "none" }}>
                    {pixData && (
                      <div className="space-y-6 text-center bg-zinc-50 border border-zinc-200 p-6 rounded-[2rem] animate-fade-in">
                        <div className="flex items-center justify-center gap-2 text-[#16a34a] font-inter-extrabold text-sm uppercase tracking-wider">
                          <QrCode size={20} />
                          PIX Gerado com Sucesso!
                        </div>

                        {pixData.qr_code_base64 && (
                          <div className="bg-white p-4 rounded-2xl inline-block shadow-md border border-zinc-200">
                            <img 
                              src={`data:image/jpeg;base64,${pixData.qr_code_base64}`} 
                              alt="QR Code do PIX" 
                              className="w-48 h-48 mx-auto"
                            />
                          </div>
                        )}

                        <div className="space-y-2">
                          <p className="text-xs font-inter-semibold text-zinc-500 uppercase tracking-wider text-left">Código Pix Copia e Cola</p>
                          <div className="flex gap-2">
                            <input 
                              type="text" 
                              readOnly 
                              value={pixData.qr_code}
                              className="flex-grow bg-white border border-zinc-200 rounded-xl px-4 py-3 text-xs font-mono text-zinc-700 focus:outline-none"
                            />
                            <button
                              onClick={handleCopyPix}
                              className="bg-[#22C55E] hover:bg-[#16a34a] text-white p-3.5 rounded-xl transition-all flex items-center justify-center shrink-0 shadow-md cursor-pointer"
                              title="Copiar código"
                            >
                              {copied ? <Check size={16} /> : <Copy size={16} />}
                            </button>
                          </div>
                        </div>

                        <div className="flex items-center justify-center gap-2 py-2 text-xs font-inter-semibold text-zinc-500">
                          <Loader2 size={14} className="animate-spin text-[#22C55E]" />
                          Aguardando confirmação... Seu acesso ao treinamento será liberado em segundos!
                        </div>

                        <button
                          onClick={() => {
                            sessionStorage.removeItem("pending_pix_data");
                            setPixData(null);
                          }}
                          className="text-xs font-inter-semibold text-zinc-500 hover:text-zinc-800 transition-colors underline cursor-pointer"
                        >
                          Escolher outra forma de pagamento
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Custom Payment Selector */}
                  <div style={{ display: pixData ? "none" : "block" }} className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                      {/* Cartão de Crédito Button */}
                      <button
                        type="button"
                        onClick={() => setSelectedMethod('credit_card')}
                        className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col items-center justify-center gap-2 font-inter-semibold text-xs ${
                          selectedMethod === 'credit_card'
                            ? 'bg-[#f0fdf4] border-[#22C55E] text-[#021B13] ring-1 ring-[#22C55E]'
                            : 'bg-white border-zinc-200 text-zinc-600 hover:border-zinc-300 hover:text-zinc-800'
                        }`}
                      >
                        <CreditCard size={20} className={selectedMethod === 'credit_card' ? 'text-[#22C55E]' : 'text-zinc-400'} />
                        Cartão de Crédito
                      </button>

                      {/* Pix Button */}
                      <button
                        type="button"
                        onClick={() => setSelectedMethod('pix')}
                        className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col items-center justify-center gap-2 font-inter-semibold text-xs ${
                          selectedMethod === 'pix'
                            ? 'bg-[#f0fdf4] border-[#22C55E] text-[#021B13] ring-1 ring-[#22C55E]'
                            : 'bg-white border-zinc-200 text-zinc-650 hover:border-zinc-300 hover:text-zinc-800'
                        }`}
                      >
                        <QrCode size={20} className={selectedMethod === 'pix' ? 'text-[#22C55E]' : 'text-zinc-400'} />
                        Pix
                      </button>
                    </div>

                    {selectedMethod === 'credit_card' ? (
                      /* Cartão de Crédito Section */
                      <div className="bg-zinc-50 border border-zinc-200 rounded-3xl p-6 space-y-4">
                        <div className="flex gap-3 text-xs text-zinc-600 leading-relaxed font-inter-medium">
                          <ShieldCheck size={18} className="text-[#22C55E] shrink-0 mt-0.5" />
                          <p>
                            Você será redirecionado com segurança para o ambiente oficial do <strong>Mercado Pago</strong> para preencher os dados do seu cartão. Sua assinatura é processada em um ambiente blindado contra fraudes.
                          </p>
                        </div>
                        
                        <button
                          type="button"
                          disabled={submittingPayment}
                          onClick={handleProcessPayment}
                          className="w-full bg-[#22C55E] hover:bg-[#16a34a] disabled:bg-zinc-300 disabled:cursor-not-allowed text-white font-inter-extrabold text-xs uppercase tracking-widest py-4 px-6 rounded-2xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
                        >
                          {submittingPayment ? (
                            <>
                              <Loader2 size={16} className="animate-spin" />
                              Processando...
                            </>
                          ) : (
                            <>
                              <Lock size={14} />
                              Ir para o Pagamento Seguro
                            </>
                          )}
                        </button>
                      </div>
                    ) : (
                      /* Pix Section */
                      <div className="bg-zinc-50 border border-zinc-200 rounded-3xl p-6 space-y-4">
                        <div className="space-y-2">
                          <label className="text-[10px] font-inter-extrabold text-zinc-500 uppercase tracking-widest block">
                            CPF do Titular (obrigatório para gerar Pix):
                          </label>
                          <input
                            type="text"
                            placeholder="000.000.000-00"
                            value={cpf}
                            onChange={(e) => {
                              // Aplica máscara simples de CPF
                              const raw = e.target.value.replace(/\D/g, "");
                              let masked = raw;
                              if (raw.length > 3) masked = raw.substring(0, 3) + "." + raw.substring(3);
                              if (raw.length > 6) masked = masked.substring(0, 7) + "." + masked.substring(7);
                              if (raw.length > 9) masked = masked.substring(0, 11) + "-" + masked.substring(11, 13);
                              setCpf(masked.substring(0, 14));
                            }}
                            className="w-full bg-white border border-zinc-200 rounded-xl px-4 py-3 text-xs font-inter-medium focus:outline-none focus:ring-1 focus:ring-[#22C55E] focus:border-[#22C55E]"
                          />
                        </div>

                        <button
                          type="button"
                          disabled={submittingPayment || cpf.replace(/\D/g, '').length !== 11}
                          onClick={handleProcessPayment}
                          className="w-full bg-[#22C55E] hover:bg-[#16a34a] disabled:bg-zinc-300 disabled:text-zinc-500 disabled:cursor-not-allowed text-white font-inter-extrabold text-xs uppercase tracking-widest py-4 px-6 rounded-2xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
                        >
                          {submittingPayment ? (
                            <>
                              <Loader2 size={16} className="animate-spin" />
                              Gerando Pix...
                            </>
                          ) : (
                            <>
                              <QrCode size={14} />
                              Gerar Código Pix
                            </>
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                </div>

              </div>
            </div>

            {/* Trust Footer below left card */}
            <div className="flex items-center justify-center gap-2 text-[9px] font-inter-extrabold uppercase tracking-widest text-zinc-400 py-2">
              <Lock size={12} className="text-[#22C55E]" />
              Pagamento Processado com Criptografia SSL
            </div>

          </div>

          {/* Column Right: Product Details, Guarantee and Urgency (lg:col-span-5) */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* Product Card */}
            <div className="bg-white border border-zinc-200/80 rounded-[2.5rem] p-8 shadow-lg space-y-6 text-center">
              
              {/* Product Image / Mockup with Floating Animation */}
              <div className="relative w-full max-w-[280px] mx-auto py-6 flex flex-col items-center">
                {/* Glow effect behind */}
                <div className="absolute top-[20%] w-[180px] h-[180px] rounded-full bg-[#22C55E]/5 blur-[40px] pointer-events-none" />
                
                {/* Floating Mockup Image */}
                <div className="relative z-10 animate-float">
                  <img 
                    src="/images/product-box.png" 
                    alt="Mockup Banana PRO" 
                    className="w-full h-auto object-contain max-h-[260px] mx-auto"
                    onError={(e) => {
                      e.currentTarget.style.display = "none";
                      const fallback = e.currentTarget.parentElement?.querySelector(".box-fallback");
                      if (fallback) fallback.setAttribute("style", "display: flex;");
                    }}
                  />
                  <div 
                    className="box-fallback w-[200px] aspect-[4/5] hidden flex-col items-center justify-center p-6 text-center space-y-4 rounded-3xl bg-gradient-to-br from-zinc-50 to-zinc-100 border border-zinc-200 shadow-md mx-auto"
                  >
                    <div className="w-12 h-12 rounded-2xl bg-[#22C55E]/10 border border-[#22C55E]/20 flex items-center justify-center text-[#22C55E]">
                      <Sprout size={28} />
                    </div>
                    <div>
                      <h3 className="text-xs font-inter-extrabold text-[#021B13] uppercase tracking-tight">Comunidade Banana PRO</h3>
                      <span className="text-[8px] text-zinc-500 font-inter-extrabold uppercase tracking-widest block mt-1">Plataforma Premium</span>
                    </div>
                  </div>
                </div>
                
                {/* Floating Shadow Underneath */}
                <div className="w-[150px] h-[10px] bg-zinc-300/60 rounded-full blur-[5px] mt-4 animate-shadow" />
              </div>

              {/* Prova Social */}
              <div className="bg-[#22C55E]/5 border border-[#22C55E]/10 rounded-2xl p-4 text-left flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-[#22C55E]/10 border border-[#22C55E]/20 flex items-center justify-center text-[#16a34a] shrink-0">
                  <Users size={16} />
                </div>
                <p className="text-xs text-slate-600 font-inter-medium">
                  Mais de <strong className="text-[#021B13] font-inter-extrabold">1.500 produtores</strong> já fazem parte da comunidade <strong className="text-[#021B13]">Banana PRO</strong>.
                </p>
              </div>

              {/* O QUE VOCÊ RECEBE */}
              <div className="space-y-4 text-left">
                <h3 className="text-[10px] font-inter-extrabold text-zinc-500 uppercase tracking-widest border-b border-zinc-200 pb-2">
                  O QUE VOCÊ RECEBE:
                </h3>
                <ul className="space-y-3.5 text-xs text-slate-700">
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 size={16} className="text-[#22C55E] shrink-0" />
                    <span className="font-inter-medium text-slate-800">Treinamento completo</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 size={16} className="text-[#22C55E] shrink-0" />
                    <span className="font-inter-medium text-slate-800">Lives semanais</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 size={16} className="text-[#22C55E] shrink-0" />
                    <span className="font-inter-medium text-slate-800">Biblioteca técnica</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 size={16} className="text-[#22C55E] shrink-0" />
                    <span className="font-inter-medium text-slate-800">Comunidade exclusiva</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 size={16} className="text-[#22C55E] shrink-0" />
                    <span className="font-inter-medium text-slate-800">Ferramentas de cálculo</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 size={16} className="text-[#22C55E] shrink-0" />
                    <span className="font-inter-medium text-slate-800">Atualizações constantes</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 size={16} className="text-[#22C55E] shrink-0" />
                    <span className="font-inter-medium text-slate-800">Suporte especializado</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 size={16} className="text-[#22C55E] shrink-0" />
                    <span className="font-inter-medium text-slate-800">Acesso imediato</span>
                  </li>
                </ul>
              </div>

            </div>

            {/* Garantias */}
            <div className="grid grid-cols-2 gap-4 text-left">
              <div className="bg-white border border-zinc-200/80 p-4 rounded-xl flex items-center gap-2.5 shadow-sm">
                <Lock size={15} className="text-[#22C55E] shrink-0" />
                <span className="text-[10px] font-inter-semibold text-slate-700 uppercase tracking-wider">Pagamento seguro</span>
              </div>
              <div className="bg-white border border-zinc-200/80 p-4 rounded-xl flex items-center gap-2.5 shadow-sm">
                <Zap size={15} className="text-[#16a34a] shrink-0" />
                <span className="text-[10px] font-inter-semibold text-slate-700 uppercase tracking-wider">Liberação imediata</span>
              </div>
              <div className="bg-white border border-zinc-200/80 p-4 rounded-xl flex items-center gap-2.5 shadow-sm">
                <ShieldCheck size={15} className="text-[#22C55E] shrink-0" />
                <span className="text-[10px] font-inter-semibold text-slate-700 uppercase tracking-wider">Plataforma própria</span>
              </div>
              <div className="bg-white border border-zinc-200/80 p-4 rounded-xl flex items-center gap-2.5 shadow-sm">
                <MessageCircle size={15} className="text-[#16a34a] shrink-0" />
                <span className="text-[10px] font-inter-semibold text-slate-700 uppercase tracking-wider">Suporte especializado</span>
              </div>
            </div>

            {/* Direct Support WhatsApp Box */}
            <div className="bg-white border border-zinc-200/80 rounded-[2rem] p-6 flex items-start gap-4 shadow-md">
              <div className="w-12 h-12 rounded-full overflow-hidden border border-zinc-200 flex items-center justify-center shrink-0 bg-zinc-100">
                <img 
                  src="/images/support-face.png" 
                  alt="Suporte Jean Carlos" 
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                    const fallback = e.currentTarget.parentElement?.querySelector(".face-fallback");
                    if (fallback) fallback.setAttribute("style", "display: flex;");
                  }}
                />
                <div 
                  className="face-fallback hidden w-full h-full items-center justify-center bg-[#22C55E] text-white font-inter-extrabold text-xs"
                >
                  JC
                </div>
              </div>
              <div className="space-y-1 text-left">
                <h4 className="text-sm font-inter-semibold text-slate-800">Precisa de Ajuda com a Compra?</h4>
                <p className="text-xs text-slate-500 leading-relaxed font-inter-medium">
                  Fale com nosso suporte para resolver dúvidas sobre faturamento, nota fiscal ou liberação de acesso.
                </p>
                <a 
                  href="https://wa.me/5521969014654?text=Olá!%20Gostaria%20de%20ajuda%20com%20o%20checkout%20do%20Bananal%20PRO." 
                  target="_blank" 
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 px-4 py-2 mt-2 bg-[#22C55E] hover:bg-[#16a34a] text-white font-inter-semibold text-xs rounded-xl shadow-sm transition-all cursor-pointer"
                >
                  <MessageCircle size={14} />
                  Falar no WhatsApp
                </a>
              </div>
            </div>

          </div>

        </div>

      </div>

      {/* Exit Intent Popup Modal */}
      {showExitPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="relative max-w-sm w-full bg-white border border-zinc-200 rounded-[2rem] p-8 text-center space-y-6 shadow-2xl">
            {/* Close Button */}
            <button 
              onClick={closeExitPopup}
              className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-800 transition-colors cursor-pointer"
              title="Fechar"
            >
              <AlertCircle size={20} className="rotate-45" />
            </button>

            {/* humanization image with fallback */}
            <div className="w-24 h-24 rounded-full bg-zinc-100 mx-auto overflow-hidden border border-zinc-200 shadow-md">
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
                className="face-fallback w-full h-full hidden items-center justify-center bg-[#22C55E] text-white font-inter-extrabold text-2xl"
              >
                JC
              </div>
            </div>

            <div className="space-y-2">
              <span className="text-[9px] font-inter-extrabold uppercase tracking-widest text-[#16a34a] bg-[#22C55E]/10 px-3 py-1 rounded-full">
                Não vá embora com dúvidas!
              </span>
              <h3 className="text-lg font-inter-extrabold text-slate-800 leading-tight uppercase">
                Posso te ajudar a começar?
              </h3>
              <p className="text-[11px] text-slate-500 leading-relaxed font-inter-medium">
                Ficou com alguma dúvida sobre as ferramentas, calculadoras ou o processo de pagamento? Me chame no WhatsApp e te ajudo agora mesmo.
              </p>
            </div>

            <a 
              href="https://wa.me/5521969014654?text=Olá!%20Estou%20na%20tela%20de%20checkout%20do%20Bananal%20PRO%20e%20gostaria%20de%20tirar%20uma%20dúvida."
              target="_blank"
              rel="noreferrer"
              onClick={closeExitPopup}
              className="w-full bg-[#22C55E] hover:bg-[#16a34a] text-white font-inter-extrabold text-xs uppercase tracking-wider py-4 px-6 rounded-2xl transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer"
            >
              <MessageCircle size={18} fill="currentColor" />
              Conversar no WhatsApp
            </a>

            <button 
              onClick={closeExitPopup}
              className="text-xs font-inter-semibold text-zinc-500 hover:text-zinc-850 transition-colors underline cursor-pointer"
            >
              Continuar no Checkout
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
