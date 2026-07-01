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
  QrCode
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

  const selectedPlan = searchParams.get("plan") === "mensal" ? "mensal" : "anual";

  // MODO TESTE DE INTEGRAÇÃO: Altere IS_TEST_PRICE para false para voltar aos preços normais
  const IS_TEST_PRICE = true; 
  const planPrice = IS_TEST_PRICE ? 1.00 : (selectedPlan === "mensal" ? 97.00 : 497.00);

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
  }, [navigate, selectedPlan]);

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
      <div className="glow-spot glow-green absolute top-[10%] left-[-15%] w-[45%] aspect-square rounded-full blur-[120px] pointer-events-none" />
      <div className="glow-spot glow-primary absolute bottom-[20%] right-[-15%] w-[45%] aspect-square rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-xl w-full relative z-10 space-y-6">
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
              Adquirir Treinamento Bananal PRO
            </h1>
            <p className="text-on-surface-variant text-sm leading-relaxed max-w-md mx-auto">
              Seu cadastro foi realizado com sucesso! Para liberar o seu acesso imediato ao treinamento e às ferramentas, conclua a aquisição abaixo.
            </p>
          </div>

          {!pixData && (
            <div className="text-center pt-2">
              <Link 
                to="/vendas" 
                className="text-xs font-bold text-slate-400 hover:text-emerald-500 transition-colors underline cursor-pointer"
              >
                Deseja outro plano? Voltar para as ofertas
              </Link>
            </div>
          )}

          <div className="bg-surface-variant border border-outline/10 p-5 rounded-[2rem] text-left space-y-2">
            <div className="flex justify-between items-center border-b border-outline/10 pb-2">
              <span className="text-xs font-black text-on-surface-variant uppercase tracking-wider">Produto</span>
              <span className="text-xs font-bold text-emerald-500 dark:text-emerald-400">
                {selectedPlan === 'mensal' ? 'Acesso Mensal ao Treinamento' : 'Acesso Anual ao Treinamento (Membro Fundador)'}
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

          <div className="pt-2 text-left">
            {paymentError && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-550 dark:text-red-400 p-4 rounded-2xl mb-4 text-xs font-bold flex items-center gap-2">
                <AlertCircle size={16} className="shrink-0" />
                <span>{paymentError}</span>
              </div>
            )}

            {submittingPayment && (
              <div className="flex flex-col items-center justify-center py-8 space-y-3 bg-slate-50 dark:bg-zinc-900/40 rounded-2xl border border-outline/10">
                <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Processando seu pagamento...</p>
              </div>
            )}

            {/* Custom PIX Screen */}
            <div style={{ display: pixData ? "block" : "none" }}>
              {pixData && (
                <div className="space-y-6 text-center bg-slate-50 dark:bg-zinc-900/40 border border-outline/10 p-6 rounded-[2rem] animate-fade-in">
                  <div className="flex items-center justify-center gap-2 text-emerald-600 dark:text-emerald-400 font-black text-sm uppercase tracking-wider">
                    <QrCode size={20} />
                    PIX Gerado com Sucesso!
                  </div>

                  {pixData.qr_code_base64 && (
                    <div className="bg-white p-4 rounded-2xl inline-block shadow-md border border-slate-200">
                      <img 
                        src={`data:image/jpeg;base64,${pixData.qr_code_base64}`} 
                        alt="QR Code do PIX" 
                        className="w-48 h-48 mx-auto"
                      />
                    </div>
                  )}

                  <div className="space-y-2">
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider text-left">Código Pix Copia e Cola</p>
                    <div className="flex gap-2">
                      <input 
                        type="text" 
                        readOnly 
                        value={pixData.qr_code}
                        className="flex-grow bg-white dark:bg-zinc-900 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-xs font-mono text-slate-650 dark:text-zinc-350 focus:outline-none"
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

                  <div className="flex items-center justify-center gap-2 py-2 text-xs font-bold text-slate-500">
                    <Loader2 size={14} className="animate-spin text-emerald-500" />
                    Aguardando confirmação... Seu acesso ao treinamento será liberado em segundos!
                  </div>

                  <button
                    onClick={() => setPixData(null)}
                    className="text-xs font-bold text-slate-400 hover:text-slate-650 dark:hover:text-white transition-colors underline cursor-pointer"
                  >
                    Escolher outra forma de pagamento
                  </button>
                </div>
              )}
            </div>

            {/* Mercado Pago Payment Brick Container (must remain in the DOM to avoid unmount/transition crashes) */}
            <div 
              id="paymentBrick_container" 
              style={{ display: pixData ? "none" : "block" }}
              className={`w-full transition-opacity ${submittingPayment ? "opacity-30 pointer-events-none" : "opacity-100"}`}
            ></div>
          </div>

          <div className="flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-zinc-500 pt-2 border-t border-outline/10">
            <Lock size={12} />
            Pagamento Processado com Criptografia SSL
          </div>
        </div>

        <div className="bg-emerald-500/5 dark:bg-emerald-950/10 border border-emerald-500/10 rounded-[2rem] p-6 flex items-start gap-4">
          <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0 text-emerald-600 dark:text-emerald-400">
            <MessageCircle size={24} />
          </div>
          <div className="space-y-1 text-left">
            <h4 className="text-sm font-bold text-on-surface">Precisa de Ajuda com o Acesso?</h4>
            <p className="text-xs text-on-surface-variant leading-relaxed">
              Fale conosco diretamente pelo nosso suporte no WhatsApp. Estamos disponíveis para te auxiliar na liberação do seu acesso e tirar dúvidas.
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
