import React, { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { 
  HelpCircle, 
  X, 
  Play, 
  Square, 
  TrendingUp, 
  Sprout, 
  Calendar, 
  Bell, 
  AlertTriangle, 
  Check, 
  ChevronRight, 
  Loader2, 
  MessageSquare,
  BookOpen,
  DollarSign,
  Droplet,
  Compass,
  FileText
} from "lucide-react";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../contexts/AuthContext";
import { toast } from "react-hot-toast";
import chicoImg from "../../assets/chico.jpg";

interface AlertItem {
  id: string;
  type: "info" | "warning" | "danger" | "success";
  title: string;
  message: string;
  actionText?: string;
  action?: () => Promise<void>;
}

export default function VirtualAssistant() {
  const { profile } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"alerts" | "guide" | "faq">("alerts");
  const [loadingAlerts, setLoadingAlerts] = useState(false);
  
  // Data States for alerts
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [userState, setUserState] = useState<string>("MG");
  const [userCity, setUserCity] = useState<string>("Sete Lagoas");
  const [userVariety, setUserVariety] = useState<string>("Prata Anã");
  const [regionalPrice, setRegionalPrice] = useState<number | null>(null);
  
  // Speech Synthesis States
  const [speakingTextId, setSpeakingTextId] = useState<string | null>(null);
  const synthRef = useRef<SpeechSynthesis | null>(window.speechSynthesis || null);

  // Guided Tour States
  const [tourStep, setTourStep] = useState<number>(0); // 0 = inactive, 1..4 = steps

  // Check onboarding on mount
  useEffect(() => {
    if (profile?.id) {
      const isTourDone = localStorage.getItem(`bananalpro_tour_done_${profile.id}`);
      if (!isTourDone) {
        // Delay opening the welcome dialog slightly for better feel
        const timer = setTimeout(() => {
          setTourStep(1);
          // Set to true immediately when tour triggers, so it does not auto-open again on subsequent navigation/reloads
          localStorage.setItem(`bananalpro_tour_done_${profile.id}`, "true");
        }, 3000);
        return () => clearTimeout(timer);
      }
    }
  }, [profile]);

  // Trigger custom event when tour step changes to synchronize with the Sidebar component
  useEffect(() => {
    window.dispatchEvent(new CustomEvent("chico-tour-step", { detail: tourStep }));
  }, [tourStep]);

  // Load contextual data and generate alerts
  const fetchAssistantData = async () => {
    if (!profile?.id) return;
    setLoadingAlerts(true);
    try {
      // 1. Fetch user city & state
      let state = profile.state || "MG";
      let city = profile.city || "Sete Lagoas";
      setUserState(state);
      setUserCity(city);

      // 2. Fetch producer areas to find user's varieties
      const { data: areas } = await supabase
        .from("producer_areas")
        .select("banana_variety")
        .limit(1);
      
      let variety = "Prata Anã";
      if (areas && areas.length > 0 && areas[0].banana_variety) {
        variety = areas[0].banana_variety;
      }
      setUserVariety(variety);

      // 3. Fetch latest price of this variety in this state/region
      // Map state to Ceasa/CEPEA region
      let targetRegion = "Média Regional";
      if (state.toUpperCase() === "MG") targetRegion = "Norte de Minas";
      else if (state.toUpperCase() === "SP") targetRegion = "Vale do Ribeira";
      else if (state.toUpperCase() === "BA") targetRegion = "Bom Jesus da Lapa";

      const { data: prices } = await supabase
        .from("banana_market_prices")
        .select("price_per_kg")
        .eq("region", targetRegion)
        .order("price_date", { ascending: false })
        .limit(1);

      let priceVal = 3.40; // fallback
      if (prices && prices.length > 0) {
        priceVal = Number(prices[0].price_per_kg);
      }
      setRegionalPrice(priceVal);

      // 4. Fetch low stock items
      const { data: inventory } = await supabase
        .from("farm_inventory")
        .select("name, quantity, min_quantity")
        .eq("user_id", profile.id);
      
      const lowStockItem = inventory?.find(item => Number(item.quantity) < Number(item.min_quantity));

      // 5. Fetch soil analysis
      const { data: soil } = await supabase
        .from("soil_analyses")
        .select("created_at, liming_need")
        .order("created_at", { ascending: false })
        .limit(1);

      // 6. Build Alerts List
      const generatedAlerts: AlertItem[] = [];

      // Weather Alert (Try to read weather humidity from dashboard cache)
      let currentHumidity = 82;
      try {
        const cacheKey = `dashboard_cache_${profile.id}`;
        const cacheData = localStorage.getItem(cacheKey);
        if (cacheData) {
          const parsed = JSON.parse(cacheData);
          if (parsed.weatherWidget && typeof parsed.weatherWidget.humidity === 'number') {
            currentHumidity = parsed.weatherWidget.humidity;
          }
        }
      } catch (e) {
        console.warn("Failed to parse dashboard weather cache", e);
      }

      if (currentHumidity > 80) {
        generatedAlerts.push({
          id: "sigatoka-alert",
          type: "danger",
          title: "🌧️ Risco de Sigatoka Negra",
          message: `Umidade do ar elevada (${currentHumidity}%). As condições climáticas atuais estão altamente propícias para o desenvolvimento da Sigatoka Negra no seu bananal.`,
          actionText: "Agendar Pulverização Preventiva",
          action: async () => {
            await scheduleTask("Pulverização Preventiva (Sigatoka)", "Manejo", "Aplicação preventiva de fungicida sugerida pelo Chico devido a alta umidade.");
          }
        });
      }

      // CEASA Regional Price Alert
      generatedAlerts.push({
        id: "market-price-alert",
        type: "success",
        title: "📈 Cotação Regionalizada",
        message: `O preço médio da banana ${variety} na sua região (${targetRegion}) está cotado a R$ ${priceVal.toFixed(2)}/kg hoje. Houve uma alta recente de +1.5%. Excelente momento para realizar vendas!`,
        actionText: "Lançar Nova Venda",
        action: async () => {
          navigate("/financeiro");
          setIsOpen(false);
        }
      });

      // Stock Alert
      if (lowStockItem) {
        generatedAlerts.push({
          id: "stock-alert",
          type: "warning",
          title: "📦 Insumo com Estoque Baixo",
          message: `Seu estoque do insumo '${lowStockItem.name}' está com apenas ${lowStockItem.quantity} unidades (mínimo de segurança: ${lowStockItem.min_quantity}).`,
          actionText: "Agendar Compra no Calendário",
          action: async () => {
            await scheduleTask(`Comprar Insumo: ${lowStockItem.name}`, "Financeiro", `Lembrete de compra do insumo ${lowStockItem.name} cujo estoque está baixo.`);
          }
        });
      }

      // Soil Liming Alert
      if (soil && soil.length > 0 && Number(soil[0].liming_need) > 0) {
        const limingVal = Number(soil[0].liming_need);
        generatedAlerts.push({
          id: "soil-liming-alert",
          type: "info",
          title: "🌱 Correção de Solo Recomendada",
          message: `Sua última análise de solo indica a necessidade de calagem de ${limingVal} t/ha. Para o seu talhão principal de 1 hectare, isso equivale a aproximadamente ${Math.round(limingVal * 20)} sacos de calcário de 50kg.`,
          actionText: "Agendar Aplicação de Calcário",
          action: async () => {
            await scheduleTask(`Calagem de Solo (${limingVal} t/ha)`, "Manejo", `Aplicação recomendada de calcário de ${limingVal} t/ha para correção da acidez do solo.`);
          }
        });
      } else if (!soil || soil.length === 0) {
        generatedAlerts.push({
          id: "soil-missing-alert",
          type: "info",
          title: "🌱 Nenhuma Análise de Solo",
          message: "Você ainda não cadastrou nenhuma análise de solo no sistema. Recomendamos fazer isso para calcular a dosagem exata de adubo e economizar dinheiro.",
          actionText: "Cadastrar Análise de Solo",
          action: async () => {
            navigate("/solo");
            setIsOpen(false);
          }
        });
      }

      setAlerts(generatedAlerts);
    } catch (err) {
      console.error("Error generating assistant alerts:", err);
    } finally {
      setLoadingAlerts(false);
    }
  };

  useEffect(() => {
    if (isOpen && profile?.id) {
      fetchAssistantData();
    }
  }, [isOpen, profile]);

  // Helper to schedule a task
  const scheduleTask = async (title: string, category: string, description: string) => {
    if (!profile?.id) return;
    try {
      const todayStr = new Date().toISOString().split("T")[0];
      const { error } = await supabase.from("farm_tasks").insert({
        user_id: profile.id,
        title,
        date: todayStr,
        category,
        status: "Pendente",
        description
      });

      if (error) throw error;
      toast.success("Tarefa agendada no seu Calendário Agrícola!");
      fetchAssistantData(); // refresh list
    } catch (err) {
      console.error("Failed to schedule task:", err);
      toast.error("Erro ao agendar a tarefa.");
    }
  };

  // Clean text from emojis and double spaces for clean reading
  const cleanTextForSpeech = (text: string) => {
    return text
      .replace(/[\u{1F300}-\u{1F9FF}]|[\u{1F600}-\u{1F64F}]|[\u{1F680}-\u{1F6FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|[\u{1F1E6}-\u{1F1FF}]/gu, "")
      .replace(/\s+/g, " ")
      .trim();
  };

  // TTS (Text-to-Speech) trigger
  const handleToggleSpeech = (id: string, text: string) => {
    if (!synthRef.current) {
      toast.error("Seu navegador não suporta leitura por áudio.");
      return;
    }

    if (speakingTextId === id) {
      synthRef.current.cancel();
      setSpeakingTextId(null);
    } else {
      synthRef.current.cancel();
      const cleanedText = cleanTextForSpeech(text);
      const utterance = new SpeechSynthesisUtterance(cleanedText);
      utterance.lang = "pt-BR";

      // Select the best available pt-BR voice
      const voices = synthRef.current.getVoices();
      const bestVoice = 
        voices.find(v => v.lang === "pt-BR" && v.name.toLowerCase().includes("natural")) ||
        voices.find(v => v.lang === "pt-BR" && v.name.toLowerCase().includes("google")) ||
        voices.find(v => v.lang === "pt-BR" && v.name.toLowerCase().includes("microsoft")) ||
        voices.find(v => v.lang === "pt-BR") ||
        voices.find(v => v.lang.startsWith("pt"));

      if (bestVoice) {
        utterance.voice = bestVoice;
      }

      utterance.rate = 0.95; // A friendly, slightly slower and more natural speaking rate
      utterance.pitch = 1.0;

      utterance.onend = () => setSpeakingTextId(null);
      utterance.onerror = () => setSpeakingTextId(null);
      setSpeakingTextId(id);
      synthRef.current.speak(utterance);
    }
  };

  // Clean speech on unmount or drawer close
  useEffect(() => {
    return () => {
      if (synthRef.current) synthRef.current.cancel();
    };
  }, [isOpen]);

  // Get screen-specific guide content
  const getScreenGuide = () => {
    const path = location.pathname;
    
    if (path.includes("/dashboard")) {
      return {
        title: "Início (Painel Geral)",
        description: "Aqui você acompanha o coração da sua fazenda. O Bananal PRO resume suas informações para facilitar sua gestão diária.",
        tips: [
          "Área Monitorada: O tamanho total de todas as suas glebas cadastradas.",
          "Custo e Lucro Estimados: Calculados cruzando seus gastos lançados no Financeiro com a produção teórica dos seus pés de banana.",
          "Clima Atual: Previsão do tempo local em tempo real. Útil para prever geadas ou pragas.",
          "Cotação da Banana: Preço médio da banana na sua região hoje."
        ]
      };
    }
    if (path.includes("/solo")) {
      return {
        title: "Análise de Solo",
        description: "O segredo para um bananal produtivo está na saúde do solo. Aqui você envia a análise que pegou no laboratório.",
        tips: [
          "Envie a análise: Digite o pH, Fósforo (P), Potássio (K) e outros índices do laudo.",
          "Nós calculamos tudo: O sistema calcula a necessidade exata de calcário (Calagem) em toneladas por hectare.",
          "Evite desperdício: Aplicar a dose exata de adubo economiza até 30% nos custos de insumos do ano."
        ]
      };
    }
    if (path.includes("/financeiro")) {
      return {
        title: "Gestão Financeira",
        description: "Aqui você controla o dinheiro da sua fazenda. É a garantia de saber se o bananal está dando lucro real ou prejuízo.",
        tips: [
          "Receita: Toda venda de banana que você fizer. Informe o peso (kg) ou número de caixas e o valor recebido.",
          "Despesa: Compra de adubo, pagamento de funcionários, combustível ou ferramentas.",
          "Dica de Ouro: Anote as saídas no mesmo dia em que ocorrerem para não esquecer nada."
        ]
      };
    }
    if (path.includes("/calendario")) {
      return {
        title: "Calendário Agrícola",
        description: "Planeje e organize as atividades do campo para não perder prazos cruciais de adubação e colheita.",
        tips: [
          "Tarefas: Crie lembretes de colheita, adubação ou manutenção do bananal.",
          "Chico Ajuda: Alertas importantes que você aceita na minha aba geram tarefas automáticas aqui.",
          "Status: Marque as tarefas como 'Concluído' para manter o histórico da sua fazenda em dia."
        ]
      };
    }
    if (path.includes("/estoque")) {
      return {
        title: "Estoque de Insumos",
        description: "Controle seus sacos de adubo, fungicidas e defensivos estocados no seu galpão.",
        tips: [
          "Estoque Mínimo: Defina um limite de segurança para cada insumo. O Chico te avisará se a quantidade cair abaixo disso.",
          "Validade: Fique atento ao vencimento de defensivos agrícolas para evitar prejuízos.",
          "Custo Médio: O valor das despesas com insumos alimenta seus relatórios financeiros automaticamente."
        ]
      };
    }
    if (path.includes("/diagnostico")) {
      return {
        title: "Diagnóstico Visual por IA",
        description: "A saúde das suas folhas de banana avaliada em segundos usando inteligência artificial.",
        tips: [
          "Como usar: Tire uma foto nítida e de perto da mancha na folha da bananeira e envie aqui.",
          "O que a IA detecta: Identifica se é Sigatoka Amarela, Sigatoka Negra ou Mal-do-Panamá.",
          "Nível de Severidade: Mostra o quão grave está e as ações de controle sugeridas por agrônomos."
        ]
      };
    }
    if (path.includes("/cursos")) {
      return {
        title: "Treinamentos & Módulos",
        description: "Sua escola online do bananicultor. Assista às aulas gravadas pelos melhores engenheiros agrônomos da área.",
        tips: [
          "Módulos Sequenciais: Assista na ordem para ter o melhor aproveitamento técnico.",
          "Materiais Extras: Baixe planilhas, PDFs e cartilhas anexadas nas aulas para usar na fazenda.",
          "Marcar Concluído: Ajuda a registrar seu progresso e liberar novos certificados."
        ]
      };
    }

    return {
      title: "Menu Principal",
      description: "Navegue pelo menu lateral para gerenciar as diferentes áreas do seu negócio de bananicultura.",
      tips: [
        "Início: Indicadores rápidos da fazenda.",
        "Análise de Solo: Calagem e adubação exatas.",
        "Gestão Financeira: Controle de caixa e lucros.",
        "Treinamentos: Aulas de manejo e mercado de banana."
      ]
    };
  };

  const screenGuide = getScreenGuide();

  // Tour Steps Content
  const getTourStepContent = () => {
    switch (tourStep) {
      case 1:
        return {
          title: "👋 Bem-vindo ao Bananal PRO!",
          desc: "Olá! Sou o Chico, seu parceiro no bananal. Vamos fazer uma rápida caminhada de 4 passos pelas ferramentas essenciais para aumentar sua produtividade.",
          nextText: "Começar Tour",
          backText: "Agora Não"
        };
      case 2:
        return {
          title: "📌 1. Navegação Fácil",
          desc: "No menu lateral esquerdo você acessa tudo: análises de solo, fluxo de caixa, estoque e o catálogo de aulas de manejo de banana.",
          nextText: "Entendido",
          backText: "Voltar"
        };
      case 3:
        return {
          title: "🌦️ 2. Clima e Cotações",
          desc: "Na sua tela inicial, monitoramos a previsão do tempo e exibimos a cotação diária da banana na sua região (como no Norte de Minas ou Vale do Ribeira) para você vender no melhor momento.",
          nextText: "Próximo",
          backText: "Voltar"
        };
      case 4:
        return {
          title: "💡 3. Eu ajudo você!",
          desc: "Se o tempo indicar muita umidade (risco de Sigatoka) ou seu adubo estiver acabando, eu acenderei um alerta aqui no cantinho e te darei a opção de agendar a solução com um clique. Finalizamos o tour!",
          nextText: "Concluir Tour",
          backText: "Voltar"
        };
      default:
        return null;
    }
  };

  const tourContent = getTourStepContent();

  const handleFinishTour = () => {
    if (profile?.id) {
      localStorage.setItem(`bananalpro_tour_done_${profile.id}`, "true");
    }
    setTourStep(0);
    toast.success("Parabéns! Tour concluído. Se precisar de ajuda, clique no Chico!");
  };

  return (
    <>
      {/* Guided Tour Backdrop Overlay */}
      {tourStep > 0 && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-[9998] transition-all flex items-center justify-center p-4">
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="chico-tour-box border border-emerald-500/20 max-w-md w-full rounded-[2.5rem] p-8 shadow-2xl relative"
          >
            {/* Chico Avatar illustration inside Tour dialog */}
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 rounded-full border border-emerald-400/20 overflow-hidden shrink-0 animate-bounce">
                <img src={chicoImg} className="w-full h-full object-cover" alt="Chico" />
              </div>
              <div>
                <h4 className="text-zinc-500 text-[10px] font-black uppercase tracking-widest">CHICO DO BANANAL</h4>
                <p className="text-emerald-400 font-extrabold text-sm uppercase">Guia de Boas-Vindas</p>
              </div>
            </div>
            
            <h3 className="text-xl font-bold text-white mb-3">{tourContent?.title}</h3>
            <p className="text-zinc-300 text-sm leading-relaxed mb-8">{tourContent?.desc}</p>
            
            <div className="flex justify-between items-center pt-4 border-t border-white/5">
              <span className="text-[10px] text-zinc-500 font-black uppercase tracking-wider">Passo {tourStep} de 4</span>
              <div className="flex gap-3">
                <button 
                  onClick={() => {
                    if (tourStep === 1) {
                      setTourStep(0);
                    } else {
                      setTourStep(prev => prev - 1);
                    }
                  }}
                  className="px-4 py-2 bg-transparent text-zinc-400 hover:text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all cursor-pointer"
                >
                  {tourContent?.backText}
                </button>
                <button 
                  onClick={() => {
                    if (tourStep === 4) {
                      handleFinishTour();
                    } else {
                      setTourStep(prev => prev + 1);
                    }
                  }}
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black uppercase tracking-widest rounded-xl transition-all shadow-lg shadow-emerald-600/10 cursor-pointer"
                >
                  {tourContent?.nextText}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Floating Button / Chico Avatar */}
      <div className="fixed bottom-6 right-6 z-[999] flex flex-col items-end">
        <motion.button
          onClick={() => {
            setIsOpen(!isOpen);
            if (tourStep > 0) setTourStep(0); // cancel tour if user manually opens
          }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="w-14 h-14 rounded-full flex items-center justify-center text-white shadow-2xl relative group cursor-pointer transition-all chico-floating-btn"
        >
          {/* Notification bubble if there are alerts */}
          {!isOpen && alerts.length > 0 && (
            <span className="absolute -top-1 -right-1 bg-rose-500 w-5 h-5 rounded-full text-[10px] font-black flex items-center justify-center text-white animate-pulse z-10">
              {alerts.length}
            </span>
          )}
          {isOpen ? <X size={24} /> : (
            <div className="w-full h-full rounded-full overflow-hidden">
              <img src={chicoImg} className="w-full h-full object-cover" alt="Chico" />
            </div>
          )}
        </motion.button>
      </div>

      {/* Slide-over Drawer Panel */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop opacity cover */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.4 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-black z-[998]"
            />

            {/* Main Panel Drawer */}
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="chico-assistant-drawer fixed right-0 top-0 bottom-0 w-full max-w-md border-l z-[998] flex flex-col overflow-hidden"
            >
              {/* Drawer Header */}
              <div className="p-6 border-b border-white/5 chico-assistant-header flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full overflow-hidden border border-emerald-500/20 shrink-0">
                    <img src={chicoImg} className="w-full h-full object-cover" alt="Chico" />
                  </div>
                  <div>
                    <h3 className="font-bold chico-text-primary text-base">Chico</h3>
                    <p className="chico-text-secondary text-[10px] uppercase font-black tracking-widest">Seu parceiro no bananal</p>
                  </div>
                </div>
                <button 
                  onClick={() => setIsOpen(false)}
                  className="p-2 text-zinc-500 hover:text-white rounded-xl bg-white/5 transition-colors cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Drawer Tabs Header */}
              <div className="px-4 py-3 border-b border-white/5 chico-assistant-header">
                <div className="grid grid-cols-3 gap-1 bg-[#03140a] p-1 rounded-xl border border-emerald-500/10">
                  {(["alerts", "guide", "faq"] as const).map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`py-2 text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all cursor-pointer ${
                        activeTab === tab 
                          ? "bg-emerald-600 text-white shadow-md shadow-emerald-950/20" 
                          : "text-zinc-400 hover:text-zinc-200 hover:bg-white/5"
                      }`}
                    >
                      {tab === "alerts" ? "💡 Dicas" : tab === "guide" ? "📖 Guia" : "❓ FAQ"}
                    </button>
                  ))}
                </div>
              </div>

              {/* Drawer Scrollable Content */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6 no-scrollbar">
                
                {/* Tab 1: ALERTS & SUGGESTIONS */}
                {activeTab === "alerts" && (
                  <div className="space-y-4">
                    {loadingAlerts ? (
                      <div className="py-20 flex flex-col items-center justify-center gap-3 text-zinc-500">
                        <Loader2 className="animate-spin text-emerald-500" />
                        <span className="text-xs uppercase font-bold tracking-wider">Carregando avisos de campo...</span>
                      </div>
                    ) : alerts.length > 0 ? (
                      alerts.map((alert) => (
                        <div 
                          key={alert.id}
                          className={`rounded-[1.5rem] p-5 border text-left flex flex-col justify-between transition-all ${
                            alert.type === "danger" 
                              ? "chico-card-danger" 
                              : alert.type === "warning"
                              ? "chico-card-warning"
                              : alert.type === "success"
                              ? "chico-card-success"
                              : "chico-card-info"
                          }`}
                        >
                          <div className="flex justify-between items-start mb-2">
                            <h4 className="font-bold text-sm chico-text-primary">{alert.title}</h4>
                            <button
                              onClick={() => handleToggleSpeech(alert.id, `${alert.title}. ${alert.message}`)}
                              className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white transition-colors cursor-pointer"
                              title="Ouvir explicação do Chico"
                            >
                              {speakingTextId === alert.id ? <Square size={12} className="text-rose-450" /> : <Play size={12} />}
                            </button>
                          </div>
                          
                          <p className="text-xs chico-text-secondary leading-relaxed mb-4">{alert.message}</p>
                          
                          {alert.actionText && alert.action && (
                            <button
                              onClick={alert.action}
                              className="chico-btn-green"
                            >
                              {alert.actionText}
                            </button>
                          )}
                        </div>
                      ))
                    ) : (
                      <div className="py-20 text-center text-zinc-500 space-y-2">
                        <Check className="mx-auto text-emerald-500/50" size={32} />
                        <p className="text-sm font-bold chico-text-primary">Tudo em ordem!</p>
                        <p className="text-xs chico-text-secondary">Não há alertas ou riscos detectados nas suas glebas hoje.</p>
                      </div>
                    )}

                    {/* Restart Tour button */}
                    <button 
                      onClick={() => {
                        setTourStep(1);
                        setIsOpen(false);
                      }}
                      className="w-full py-4 mt-6 border border-dashed border-white/10 hover:border-emerald-500/35 hover:bg-emerald-500/[0.02] chico-text-secondary hover:text-emerald-400 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer flex items-center justify-center gap-2"
                    >
                      <Compass size={14} />
                      Refazer Tour do Sistema
                    </button>
                  </div>
                )}

                {/* Tab 2: GUIDE FOR THE CURRENT SCREEN */}
                {activeTab === "guide" && (
                  <div className="space-y-6 text-left">
                    <div className="flex items-center justify-between border-b border-white/5 pb-3">
                      <div>
                        <h4 className="text-sm font-bold chico-text-primary">{screenGuide.title}</h4>
                        <p className="text-[10px] chico-text-secondary uppercase font-black tracking-widest mt-0.5">Explicação didática</p>
                      </div>
                      <button
                        onClick={() => handleToggleSpeech("screen-guide", `${screenGuide.title}. ${screenGuide.description} ${screenGuide.tips.join(". ")}`)}
                        className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white transition-colors cursor-pointer"
                        title="Ouvir explicação"
                      >
                        {speakingTextId === "screen-guide" ? <Square size={12} className="text-rose-450" /> : <Play size={12} />}
                      </button>
                    </div>

                    <p className="text-xs chico-text-secondary leading-relaxed bg-white/[0.01] border border-white/5 p-4 rounded-2xl">
                      {screenGuide.description}
                    </p>

                    <div className="space-y-3">
                      <h5 className="text-[10px] font-black chico-text-secondary uppercase tracking-widest">Dicas do Chico:</h5>
                      {screenGuide.tips.map((tip, idx) => (
                        <div key={idx} className="flex gap-3 bg-black/40 border border-white/5 p-4 rounded-xl items-start">
                          <ChevronRight size={14} className="text-emerald-500 shrink-0 mt-0.5" />
                          <p className="text-xs chico-text-secondary leading-normal">{tip}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Tab 3: QUICK FAQ */}
                {activeTab === "faq" && (
                  <div className="space-y-4 text-left">
                    {[
                      {
                        q: "Como cadastrar meu primeiro talhão?",
                        a: "Vá em 'Início', no seletor de glebas clique no botão '+' ou clique para editar seu perfil. Preencha o tamanho em hectares e a variedade de banana que você planta (ex: Prata Anã ou Grande Naine). Isso serve para o Chico calcular sua produção."
                      },
                      {
                        q: "Como funciona o diagnóstico por foto?",
                        a: "Clique em 'Análise Agrícola' no menu e escolha 'Diagnóstico Visual'. Envie uma foto aproximada da mancha na folha. Nossa inteligência artificial analisa a severidade e te indica se é Sigatoka Negra ou Amarela."
                      },
                      {
                        q: "O que é adubação por análise de solo?",
                        a: "Ao cadastrar a análise laboratorial do seu solo, calculamos a necessidade exata de calcário por hectare. Isso evita que você gaste dinheiro comprando adubo em excesso, jogando o calcário apenas onde precisa."
                      },
                      {
                        q: "Como lançar vendas e compras no financeiro?",
                        a: "Na tela 'Fluxo de Caixa', clique em 'Nova Transação'. Marque se é Receita (venda de caixas de banana) ou Despesa (compra de adubo ou pagamento de pessoal). Manter isso em dia garante que você saiba seu lucro mensal exato."
                      }
                    ].map((faq, idx) => (
                      <details 
                        key={idx} 
                        className="group bg-white/[0.01] border border-white/5 rounded-[1.5rem] p-4 [&_summary::-webkit-details-marker]:hidden"
                      >
                        <summary className="flex items-center justify-between cursor-pointer focus:outline-none">
                          <h4 className="text-xs font-bold chico-text-primary group-open:text-emerald-450 transition-colors pr-4">
                            {faq.q}
                          </h4>
                          <span className="text-zinc-550 group-open:rotate-180 transition-transform">
                            <ChevronRight size={16} />
                          </span>
                        </summary>
                        <p className="text-xs chico-text-secondary mt-3 leading-relaxed border-t border-white/5 pt-3">
                          {faq.a}
                        </p>
                      </details>
                    ))}
                  </div>
                )}

              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
