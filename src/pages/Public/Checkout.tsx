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
  ExternalLink,
  RefreshCw,
  MessageCircle
} from "lucide-react";
import { toast } from "react-hot-toast";

export default function Checkout() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [checkingStatus, setCheckingStatus] = useState(false);

  const selectedPlan = searchParams.get("plan") === "mensal" ? "mensal" : "anual";

  // MODO TESTE DE INTEGRAÇÃO: Altere IS_TEST_PRICE para false para voltar aos preços normais
  const IS_TEST_PRICE = true; 
  const planPrice = IS_TEST_PRICE ? 1.00 : (selectedPlan === "mensal" ? 97.00 : 497.00);

  const fetchProfileAndCheck = async (authUser: any) => {
    try {
      const { data: profileData, error: profileError } = await supabase
        .from("user_profiles")
        .select("*")
        .eq("mocha_user_id", authUser.id)
        .maybeSingle();

      if (profileError) throw profileError;
      
      if (profileData) {
        if (profileData.role === 'admin') {
          setProfile(profileData);
          toast.success("Bem-vindo, Administrador!");
          navigate("/dashboard");
          return true;
        }

        // Check if the user has any orders in the database
        const { data: userOrders, error: ordersError } = await supabase
          .from("orders")
          .select("*")
          .eq("user_id", profileData.id);

        if (ordersError) {
          console.error("Error loading orders:", ordersError);
        }

        const pendingOrder = userOrders?.find(o => o.status === 'pending');
        const hasOrders = userOrders && userOrders.length > 0;

        if (!hasOrders) {
          console.log("New user detected with no orders. Initializing pending order...");
          
          // 1. Force is_active to false in the database
          const { error: updateProfileError } = await supabase
            .from("user_profiles")
            .update({ is_active: false })
            .eq("id", profileData.id);

          if (updateProfileError) {
            console.error("Error updating profile status:", updateProfileError);
          } else {
            profileData.is_active = false;
          }

          // 2. Create pending order in the database
          const { error: insertOrderError } = await supabase
            .from("orders")
            .insert({
              user_id: profileData.id,
              total_amount: planPrice,
              status: "pending",
              payment_method: "PIX"
            });

          if (insertOrderError) {
            console.error("Error creating pending order:", insertOrderError);
          }
        } else if (pendingOrder && Number(pendingOrder.total_amount) !== planPrice) {
          console.log("Updating existing pending order to match selected plan price:", planPrice);
          const { error: updateOrderPriceError } = await supabase
            .from("orders")
            .update({ total_amount: planPrice })
            .eq("id", pendingOrder.id);
          
          if (updateOrderPriceError) {
            console.error("Error updating pending order price:", updateOrderPriceError);
          }
        }

        setProfile(profileData);

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
  }, [navigate, selectedPlan]);

  useEffect(() => {
    if (!user || profile?.is_active) return;

    const interval = setInterval(async () => {
      await fetchProfileAndCheck(user);
    }, 3000);

    return () => clearInterval(interval);
  }, [user, profile?.is_active]);

  const handleRedirectToInfinitePay = () => {
    window.location.href = "https://infinitepay.io/$jean-carlos-fjc";
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
    <div className="min-h-screen bg-background text-on-surface font-sans py-12 px-6 relative selection:bg-emerald-500/30 flex items-center justify-center">
      {/* Background Volumetric Glows */}
      <div className="glow-spot glow-green absolute top-[10%] left-[-15%] w-[45%] aspect-square rounded-full blur-[120px] pointer-events-none" />
      <div className="glow-spot glow-primary absolute bottom-[20%] right-[-15%] w-[45%] aspect-square rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-xl w-full relative z-10 space-y-6">
        
        {/* Top bar back link */}
        <div className="flex items-center justify-between border-b border-outline/10 pb-4">
          <Link to="/" className="flex items-center gap-2 text-on-surface-variant hover:text-on-surface transition-colors text-xs font-bold uppercase tracking-wider">
            <ArrowLeft size={16} />
            Voltar para o início
          </Link>
          <div className="flex items-center gap-1.5 bg-emerald-500/10 dark:bg-emerald-950/40 border border-emerald-500/20 px-3 py-1.5 rounded-full text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            Conexão Segura
          </div>
        </div>

        <div className="bg-surface border border-outline/10 rounded-[2.5rem] p-8 shadow-2xl space-y-6 text-center">
          
          <div className="mx-auto w-16 h-16 rounded-3xl bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shadow-md">
            <Sprout size={36} />
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl md:text-3xl font-black tracking-tight text-on-surface uppercase leading-tight">
              Assinatura Bananal PRO
            </h1>
            <p className="text-on-surface-variant text-sm leading-relaxed max-w-md mx-auto">
              Seu cadastro foi realizado com sucesso! Para começar a usar a plataforma e liberar o seu acesso completo aos cursos, ferramentas agrícolas e suporte com agrônomos, conclua a contratação da sua assinatura.
            </p>
          </div>

          {/* Plan Selector Toggle */}
          <div className="flex bg-slate-100 dark:bg-zinc-900/60 p-1.5 rounded-2xl border border-outline/10 gap-2 max-w-sm mx-auto">
            <button
              onClick={() => setSearchParams({ plan: 'mensal' })}
              className={`flex-grow py-2.5 px-4 rounded-xl text-xs font-black transition-all cursor-pointer ${
                selectedPlan === 'mensal'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'text-slate-500 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-white'
              }`}
            >
              Plano Mensal ({IS_TEST_PRICE ? "R$ 1" : "R$ 97"})
            </button>
            <button
              onClick={() => setSearchParams({ plan: 'anual' })}
              className={`flex-grow py-2.5 px-4 rounded-xl text-xs font-black transition-all cursor-pointer relative ${
                selectedPlan === 'anual'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'text-slate-500 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-white'
              }`}
            >
              Plano Anual ({IS_TEST_PRICE ? "R$ 1" : "R$ 497"})
              <span className="absolute -top-2 -right-2 bg-amber-500 text-white text-[7px] font-black px-1.5 py-0.5 rounded-full uppercase tracking-wider animate-pulse">
                Oferta
              </span>
            </button>
          </div>

          {/* Plan Info Card */}
          <div className="bg-surface-variant border border-outline/10 p-5 rounded-[2rem] text-left space-y-2">
            <div className="flex justify-between items-center border-b border-outline/10 pb-2">
              <span className="text-xs font-black text-on-surface-variant uppercase tracking-wider">Produto</span>
              <span className="text-xs font-bold text-emerald-500 dark:text-emerald-400">
                {selectedPlan === 'mensal' ? 'Assinatura Mensal' : 'Assinatura Anual (Oferta Membro Fundador)'}
              </span>
            </div>
            <div className="flex justify-between items-center pt-1">
              <span className="text-xs font-black text-on-surface-variant uppercase tracking-wider">Preço / Recorrência</span>
              <span className="text-base font-extrabold text-on-surface">
                {selectedPlan === 'mensal' ? (
                  <>{IS_TEST_PRICE ? "R$ 1,00" : "R$ 97,00"} <span className="text-xs text-on-surface-variant font-medium">/ mensal</span></>
                ) : (
                  <div className="text-right">
                    <span>{IS_TEST_PRICE ? "R$ 1,00" : "R$ 497,00"} <span className="text-xs text-on-surface-variant font-medium">/ anual</span></span>
                    <span className="text-xs text-amber-500 font-bold block mt-1">
                      {IS_TEST_PRICE ? "(Ou 12x de R$ 0,10 no cartão)" : "(Ou 12x de R$ 49,70 no cartão)"}
                    </span>
                  </div>
                )}
              </span>
            </div>
          </div>

          <div className="space-y-3 pt-2">
            {/* Primary InfinitePay button */}
            <button
              onClick={handleRedirectToInfinitePay}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-4 px-6 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg hover:shadow-emerald-600/10 active:scale-95 cursor-pointer text-sm"
            >
              <ExternalLink size={18} />
              Finalizar Pagamento na InfinitePay
            </button>

            {/* Auto status check indicator */}
            <div className="flex items-center justify-center gap-2 py-3 text-xs font-semibold text-slate-500 dark:text-zinc-400">
              <Loader2 size={14} className="animate-spin text-emerald-500" />
              Aguardando confirmação de pagamento... O acesso será liberado automaticamente.
            </div>
          </div>

          {/* Secure details */}
          <div className="flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-zinc-500 pt-2 border-t border-outline/10">
            <Lock size={12} />
            Pagamento Processado com Criptografia SSL
          </div>
        </div>

        {/* Support Banner */}
        <div className="bg-emerald-500/5 dark:bg-emerald-950/10 border border-emerald-500/10 rounded-[2rem] p-6 flex items-start gap-4">
          <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0 text-emerald-600 dark:text-emerald-400">
            <MessageCircle size={24} />
          </div>
          <div className="space-y-1 text-left">
            <h4 className="text-sm font-bold text-on-surface">Precisa de Ajuda Técnica ou Financeira?</h4>
            <p className="text-xs text-on-surface-variant leading-relaxed">
              Fale conosco diretamente pelo nosso suporte no WhatsApp. Estamos disponíveis para te auxiliar na liberação da sua conta e dúvidas.
            </p>
            <a 
              href="https://wa.me/5521969014654" 
              target="_blank" 
              rel="noreferrer"
              className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline inline-flex items-center gap-1 pt-1.5"
            >
              Chamar Suporte no WhatsApp (21) 96901-4654
            </a>
          </div>
        </div>

      </div>
    </div>
  );
}
