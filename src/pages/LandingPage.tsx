import React, { useEffect, useState, useRef } from "react";
import PublicLayout from "../components/Layout/PublicLayout";
import { Link } from "react-router-dom";
import { motion } from "motion/react";
import { 
  Sprout, 
  Wallet, 
  Package, 
  CloudSun, 
  Calendar, 
  Camera, 
  CheckCircle2 
} from "lucide-react";

// Custom Counter Component with IntersectionObserver
function Counter({
  target,
  decimals = 0,
  prefix = "",
  suffix = "",
}: {
  target: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
}) {
  const [value, setValue] = useState(0);
  const [hasAnimated, setHasAnimated] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting && !hasAnimated) {
          setHasAnimated(true);
          let current = 0;
          const duration = 2000;
          const stepTime = 20;
          const steps = duration / stepTime;
          const increment = target / steps;

          const timer = setInterval(() => {
            current += increment;
            if (current >= target) {
              setValue(target);
              clearInterval(timer);
            } else {
              setValue(current);
            }
          }, stepTime);
        }
      },
      { threshold: 0.1 }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, [target, hasAnimated]);

  return (
    <span ref={ref} className="text-secondary-fixed text-5xl md:text-6xl font-headline font-bold block tracking-tight">
      {prefix}
      {decimals > 0 ? value.toFixed(decimals) : Math.floor(value)}
      {suffix}
    </span>
  );
}

export default function LandingPage() {
  const [dashboardTab, setDashboardTab] = useState("Dashboard");
  const [activeTool, setActiveTool] = useState("solo");

  const toolsList = [
    {
      id: "solo",
      icon: <Sprout className="text-secondary w-8 h-8" />,
      title: "Química de Solo & Calagem",
      desc: "Interprete análises laboratoriais de forma instantânea. O sistema calcula a Soma de Bases (SB), Capacidade de Troca Catiônica (CTC) e a Saturação por Bases (V%). Com base na meta da cultura de banana, a plataforma gera a recomendação exata da Necessidade de Calagem (NC) em toneladas por hectare.",
      features: ["Interpretação automática de pH, P, K, Ca, Mg", "Cálculo preciso de Necessidade de Calagem", "Histórico digital de glebas/talhões"]
    },
    {
      id: "financeiro",
      icon: <Wallet className="text-secondary w-8 h-8" />,
      title: "Gestão Financeira & Break-Even",
      desc: "Controle as receitas e custos operacionais da propriedade sem complicações. Monitore despesas com insumos, combustível e mão de obra, calculando automaticamente o custo operacional por hectare e por planta, além do ponto de equilíbrio (Break-even) em caixas de banana.",
      features: ["Custos operacionais detalhados", "Indicadores de custo por hectare/planta", "Ponto de Equilíbrio (Break-Even) automático"]
    },
    {
      id: "estoque",
      icon: <Package className="text-secondary w-8 h-8" />,
      title: "Estoque de Insumos NPK",
      desc: "Evite a interrupção de aplicações críticas. Cadastre adubos e defensivos agrícolas com alerta de validade e quantidade mínima de segurança, facilitando a reposição e o planejamento financeiro de compras.",
      features: ["Entradas e saídas de insumos", "Aviso de estoque mínimo e validade", "Planejamento de compras integrado"]
    },
    {
      id: "clima",
      icon: <CloudSun className="text-secondary w-8 h-8" />,
      title: "Clima & Conselho Agrícola",
      desc: "Previsões meteorológicas locais calibradas para a pulverização foliar. O sistema calcula a janela ideal com base na velocidade do vento, umidade do ar e chances de precipitação, emitindo alertas automáticos de risco de Sigatoka.",
      features: ["Temperatura e umidade em tempo real", "Janela ideal de pulverização (vento/umidade)", "Alertas fitossanitários climáticos"]
    },
    {
      id: "calendario",
      icon: <Calendar className="text-secondary w-8 h-8" />,
      title: "Calendário Agrícola",
      desc: "Gerencie o cronograma de atividades do campo. Defina datas de adubação, pulverizações, irrigação e colheitas, mantendo toda a equipe técnica alinhada com as tarefas agendadas.",
      features: ["Agenda de manejo foliar e irrigação", "Notificação de tarefas pendentes", "Histórico de manejos executados"]
    },
    {
      id: "diagnostico",
      icon: <Camera className="text-secondary w-8 h-8" />,
      title: "Diagnóstico Visual por IA",
      desc: "Use a câmera do seu celular para identificar problemas foliares na bananeira. A Inteligência Artificial analisa os padrões de manchas e estrias, fornecendo sugestões e recomendações de controle cultural, químico e biológico.",
      features: ["Identificação visual de Sigatoka e Fusariose", "Dicas imediatas de manejo preventivo", "Laudo técnico digital"]
    }
  ];

  useEffect(() => {
    document.body.classList.add("dark-theme");
    return () => {
      document.body.classList.remove("dark-theme");
    };
  }, []);

  useEffect(() => {
    // Scroll reveal observer
    const revealCallback = (entries: IntersectionObserverEntry[]) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("active");
        }
      });
    };

    const observer = new IntersectionObserver(revealCallback, {
      threshold: 0.1,
      rootMargin: "0px 0px -50px 0px",
    });

    document.querySelectorAll(".reveal").forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, []);

  return (
    <PublicLayout>
      {/* Hero Section */}
      <section className="relative min-h-[95vh] flex items-center overflow-hidden bg-grid pt-12 pb-20 leaf-accent">
        {/* Volumetric Lights */}
        <div className="glow-spot glow-green top-[-10%] right-[-10%] md:right-[5%]" />
        <div className="glow-spot glow-yellow top-[40%] left-[-15%] md:left-[-5%]" />
        <div className="glow-spot glow-primary bottom-[10%] right-[20%]" />

        <div className="max-w-7xl mx-auto px-6 md:px-10 grid lg:grid-cols-12 gap-y-10 lg:gap-16 items-center w-full relative z-10 min-w-0">
          {/* Left Text Column */}
          <div className="lg:col-span-5 space-y-8 text-left w-full min-w-0">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-secondary-container/20 border border-secondary/30 backdrop-blur-md">
              <span className="w-1.5 h-1.5 rounded-full bg-secondary-fixed animate-pulse"></span>
              <span className="text-[9px] font-bold tracking-widest text-secondary-fixed uppercase font-inter">
                Ecossistema Operacional & Educação
              </span>
            </div>

            <h1 className="font-headline text-3xl sm:text-4xl md:text-5xl lg:text-6xl text-white font-extrabold tracking-tight leading-[1.1] text-balance">
              O ecossistema completo para a <span className="text-transparent bg-clip-text bg-gradient-to-r from-secondary-fixed to-tertiary-fixed font-black">produtividade</span> da sua bananicultura.
            </h1>

            <p className="font-sans text-sm md:text-base text-on-surface-variant leading-relaxed max-w-xl">
              Conecte sua lavoura a um ecossistema integrado: cursos técnicos avançados, fórum exclusivo de produtores, suporte contínuo com engenheiros agrônomos e ferramentas inteligentes de solo e gestão financeira.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 pt-2 w-full sm:w-auto">
              <Link
                to="/auth/register?offer=padrao&plan=anual"
                className="bg-secondary hover:bg-secondary-fixed text-white hover:text-primary-container px-8 py-4 rounded-xl font-headline font-bold text-sm tracking-wide transition-all border-glow duration-300 shadow-lg shadow-secondary/20 flex items-center justify-center gap-2 cursor-pointer w-full sm:w-auto text-center"
              >
                Começar Operações
                <span className="material-symbols-outlined text-sm">arrow_forward</span>
              </Link>
              <a
                href="#planos"
                className="bg-surface-container border border-outline-variant hover:border-secondary-fixed/50 hover:bg-surface-container-high px-8 py-4 rounded-xl font-headline font-bold text-sm tracking-wide text-white transition-all duration-300 flex items-center justify-center w-full sm:w-auto text-center"
              >
                Ver Soluções
              </a>
            </div>

            {/* Quick Metrics Badge */}
            <div className="grid grid-cols-3 gap-6 pt-6 border-t border-outline-variant/30">
              <div>
                <p className="text-xl font-headline font-bold text-white">1.5k+</p>
                <p className="text-[10px] text-on-surface-variant uppercase font-inter font-semibold">Fazendas Ativas</p>
              </div>
              <div>
                <p className="text-xl font-headline font-bold text-secondary-fixed">800+</p>
                <p className="text-[10px] text-on-surface-variant uppercase font-inter font-semibold">Alunos Formados</p>
              </div>
              <div>
                <p className="text-xl font-headline font-bold text-tertiary-fixed">100%</p>
                <p className="text-[10px] text-on-surface-variant uppercase font-inter font-semibold">Apoio Agronômico</p>
              </div>
            </div>
          </div>

          {/* Right Interactive Dashboard Mockup & Floating Cards */}
          <div className="lg:col-span-7 relative flex justify-center items-center w-full min-w-0">
            {/* Ambient Shadow behind Dashboard */}
            <div className="absolute inset-0 bg-secondary/5 rounded-[2.5rem] blur-[80px] -z-10"></div>

            {/* High Fidelity Mockup */}
            <div className="w-full max-w-[620px] dark-glass rounded-[2rem] p-3 shadow-2xl relative border-glow overflow-hidden transition-all duration-500 hover:scale-[1.01] hover:shadow-secondary/5 min-w-0">
              <div className="w-full rounded-[1.5rem] bg-[#020d08] border border-outline-variant/30 flex flex-col sm:flex-row overflow-hidden min-h-[380px] text-white">
                
                {/* Mockup Sidebar */}
                <div className="w-full sm:w-40 border-b sm:border-b-0 sm:border-r border-outline-variant/30 p-3 flex flex-row sm:flex-col gap-2 overflow-x-auto sm:overflow-x-visible shrink-0 bg-[#010905]">
                  <div className="hidden sm:flex items-center gap-2 px-2 py-1.5 mb-4 border-b border-outline-variant/20">
                    <span className="material-symbols-outlined text-secondary-fixed text-lg">eco</span>
                    <span className="text-[10px] font-bold uppercase tracking-wider font-headline text-white">OPERACIONAL</span>
                  </div>
                  {[
                    { name: "Dashboard", icon: "dashboard" },
                    { name: "Financeiro", icon: "payments" },
                    { name: "Análise de Solo", icon: "science" },
                    { name: "Clima", icon: "thermostat" },
                    { name: "Estoque", icon: "inventory_2" }
                  ].map((tab) => (
                    <button
                      key={tab.name}
                      onClick={() => setDashboardTab(tab.name)}
                      className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[10px] font-semibold transition-all text-left font-inter cursor-pointer whitespace-nowrap ${
                        dashboardTab === tab.name
                          ? "bg-secondary text-white shadow-sm"
                          : "text-on-surface-variant hover:bg-white/5 hover:text-white"
                      }`}
                    >
                      <span className="material-symbols-outlined text-xs leading-none">{tab.icon}</span>
                      {tab.name}
                    </button>
                  ))}
                  <div className="hidden sm:block mt-auto px-2.5 py-1.5 rounded-lg bg-surface-container/50 border border-outline-variant/20">
                    <p className="text-[8px] text-on-surface-variant uppercase font-inter">Agrônomo</p>
                    <p className="text-[9px] font-bold text-secondary-fixed">Online</p>
                  </div>
                </div>

                {/* Mockup Content Panel */}
                <div className="flex-1 p-5 flex flex-col gap-4 overflow-y-auto">
                  
                  {/* Dynamic Header */}
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-[8px] uppercase tracking-wider text-on-surface-variant font-inter">Módulo Integrado</p>
                      <h4 className="text-xs font-bold font-headline text-white flex items-center gap-1">
                        {dashboardTab === "Dashboard" && "Painel Geral Fazenda Progresso"}
                        {dashboardTab === "Financeiro" && "Demonstrativo Financeiro Integrado"}
                        {dashboardTab === "Análise de Solo" && "Química de Solo & Adubação"}
                        {dashboardTab === "Clima" && "Radar Meteorológico & Alertas"}
                        {dashboardTab === "Estoque" && "Inventário de Insumos NPK"}
                      </h4>
                    </div>
                    <span className="text-[8px] px-2 py-0.5 rounded-full bg-emerald-950 border border-emerald-500/20 text-emerald-400 font-bold font-inter">
                      Sincronizado
                    </span>
                  </div>

                  {/* Tab Contents */}
                  {dashboardTab === "Dashboard" && (
                    <div className="space-y-4 flex-1 flex flex-col justify-between">
                      {/* Grid Stats */}
                      <div className="grid grid-cols-3 gap-1.5 xs:gap-2">
                        <div className="p-2 rounded-lg bg-surface-container/60 border border-outline-variant/20 min-w-0">
                          <p className="text-[6px] xs:text-[7px] text-on-surface-variant uppercase font-inter truncate">Produtividade</p>
                          <p className="text-[10px] xs:text-xs font-bold font-headline text-secondary-fixed truncate">+24.8%</p>
                        </div>
                        <div className="p-2 rounded-lg bg-surface-container/60 border border-outline-variant/20 min-w-0">
                          <p className="text-[6px] xs:text-[7px] text-on-surface-variant uppercase font-inter truncate">Adubação NPK</p>
                          <p className="text-[10px] xs:text-xs font-bold font-headline text-white truncate">Estável</p>
                        </div>
                        <div className="p-2 rounded-lg bg-surface-container/60 border border-outline-variant/20 min-w-0">
                          <p className="text-[6px] xs:text-[7px] text-on-surface-variant uppercase font-inter truncate">Custo Cacho</p>
                          <p className="text-[10px] xs:text-xs font-bold font-headline text-tertiary-fixed truncate">R$ 8.42</p>
                        </div>
                      </div>
                      {/* Chart Widget */}
                      <div className="flex-1 min-h-[120px] bg-surface-container/30 border border-outline-variant/20 rounded-lg p-3 flex flex-col justify-between">
                        <p className="text-[8px] text-on-surface-variant font-inter">Ton / Hectare (Evolução da Safra)</p>
                        <div className="h-16 flex items-end gap-1.5 pt-4">
                          <div className="flex-1 bg-secondary/15 border-t border-secondary-fixed/30 rounded-t h-[40%]"></div>
                          <div className="flex-1 bg-secondary/35 border-t border-secondary-fixed/50 rounded-t h-[65%]"></div>
                          <div className="flex-1 bg-secondary/25 border-t border-secondary-fixed/40 rounded-t h-[50%]"></div>
                          <div className="flex-1 bg-secondary/65 border-t border-secondary-fixed/70 rounded-t h-[85%]"></div>
                          <div className="flex-1 bg-secondary-fixed border-t border-secondary-fixed rounded-t h-[95%] shadow-glow"></div>
                        </div>
                      </div>
                    </div>
                  )}

                  {dashboardTab === "Financeiro" && (
                    <div className="space-y-3 flex-1 flex flex-col">
                      <div className="p-3 rounded-lg bg-surface-container/60 border border-outline-variant/20 flex justify-between items-center">
                        <div>
                          <p className="text-[7px] text-on-surface-variant uppercase font-inter">Faturamento Líquido Mensal</p>
                          <p className="text-sm font-bold font-headline text-white">R$ 142.840,00</p>
                        </div>
                        <span className="material-symbols-outlined text-secondary-fixed text-lg">trending_up</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="p-2.5 rounded-lg bg-surface-container/30 border border-outline-variant/20">
                          <p className="text-[7px] text-on-surface-variant uppercase font-inter">Custos Operacionais</p>
                          <p className="text-[10px] font-bold text-white">R$ 42.110,00</p>
                        </div>
                        <div className="p-2.5 rounded-lg bg-surface-container/30 border border-outline-variant/20">
                          <p className="text-[7px] text-on-surface-variant uppercase font-inter">ROI Estimado Anual</p>
                          <p className="text-[10px] font-bold text-secondary-fixed">3.4x Retorno</p>
                        </div>
                      </div>
                      <div className="flex-1 min-h-[60px] bg-red-950/20 border border-red-500/10 rounded-lg p-2.5 flex items-center justify-between">
                        <div className="flex-1 flex items-center gap-2">
                          <span className="material-symbols-outlined text-red-400 text-sm">warning</span>
                          <span className="text-[8px] text-red-300 font-inter">Excesso de custo em Nitratos (Safra 4B)</span>
                        </div>
                        <button className="text-[7px] text-white hover:underline uppercase font-inter font-bold">Ajustar</button>
                      </div>
                    </div>
                  )}

                  {dashboardTab === "Análise de Solo" && (
                    <div className="space-y-3 flex-1 flex flex-col justify-between">
                      <div className="p-2.5 rounded-lg bg-surface-container/60 border border-outline-variant/20 flex justify-between items-center">
                        <div>
                          <p className="text-[7px] text-on-surface-variant uppercase font-inter">pH do Solo (Talhão Norte)</p>
                          <p className="text-xs font-bold text-secondary-fixed">6.2 (Ideal)</p>
                        </div>
                        <div className="h-6 w-16 bg-surface-container-high border border-outline-variant/40 rounded flex items-center justify-center text-[8px] text-white uppercase font-inter">
                          Calagem Otimizada
                        </div>
                      </div>
                      <div className="flex-1 min-h-[100px] border border-outline-variant/20 rounded-lg p-2.5 bg-surface-container/30 space-y-2">
                        <p className="text-[8px] text-on-surface-variant uppercase font-inter">Nutrientes Químicos (Laudo)</p>
                        <div className="space-y-1 text-[8px]">
                          <div className="flex justify-between items-center p-1 rounded hover:bg-white/5">
                            <span className="font-semibold text-white">Fósforo (P)</span>
                            <span className="text-secondary-fixed">Apropriado</span>
                          </div>
                          <div className="flex justify-between items-center p-1 rounded hover:bg-white/5">
                            <span className="font-semibold text-white">Potássio (K)</span>
                            <span className="text-secondary-fixed">Apropriado</span>
                          </div>
                          <div className="flex justify-between items-center p-1 rounded hover:bg-white/5">
                            <span className="font-semibold text-white">Alumínio (Al)</span>
                            <span className="text-red-400 font-semibold">Tóxico - Requer Calagem</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {dashboardTab === "Clima" && (
                    <div className="space-y-3 flex-1 flex flex-col justify-between">
                      <div className="grid grid-cols-2 gap-2">
                        <div className="p-2.5 rounded-lg bg-surface-container/60 border border-outline-variant/20 flex flex-col justify-between min-w-0">
                          <p className="text-[7px] text-on-surface-variant uppercase font-inter truncate">Precipitação Prevista</p>
                          <h5 className="text-sm font-bold text-white font-headline truncate">120mm</h5>
                          <p className="text-[7px] text-on-surface-variant truncate">Próximos 7 dias</p>
                        </div>
                        <div className="p-2.5 rounded-lg bg-surface-container/60 border border-outline-variant/20 flex flex-col justify-between min-w-0">
                          <p className="text-[7px] text-on-surface-variant uppercase font-inter truncate">Janela Pulverização</p>
                          <h5 className="text-xs font-bold text-secondary-fixed uppercase font-headline truncate">Excelente</h5>
                          <p className="text-[7px] text-on-surface-variant truncate">Umidade Relativa: 64%</p>
                        </div>
                      </div>
                      <div className="p-3 bg-amber-950/20 border border-amber-500/10 rounded-lg flex items-center gap-2">
                        <span className="material-symbols-outlined text-amber-500 text-sm">thunderstorm</span>
                        <div>
                          <p className="text-[8px] font-bold text-white">Risco de Sigatoka Negra Elevado</p>
                          <p className="text-[7px] text-on-surface-variant">Temperatura e umidade propícias. Monitore folhas.</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {dashboardTab === "Estoque" && (
                    <div className="space-y-3 flex-1 flex flex-col justify-between">
                      <div className="flex justify-between items-center text-[8px] text-on-surface-variant border-b border-outline-variant/20 pb-1">
                        <span>Insumo cadastrado</span>
                        <span>Qtd. Disponível</span>
                      </div>
                      <div className="space-y-1 flex-1 overflow-y-auto max-h-[100px]">
                        {[
                          { name: "Cloreto de Potássio", qty: "450 kg", low: false },
                          { name: "Superfosfato Simples", qty: "80 kg", low: true },
                          { name: "Fungicida Systemic Pro", qty: "12 L", low: false },
                          { name: "Calcário Calcítico", qty: "1.200 kg", low: false }
                        ].map((item, idx) => (
                          <div key={idx} className="flex justify-between items-center p-1.5 rounded bg-surface-container/30 border border-outline-variant/10 text-[8px]">
                            <span className="font-semibold text-white">{item.name}</span>
                            <span className={item.low ? "text-red-400 font-bold" : "text-white"}>{item.qty} {item.low && "(Repor)"}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Floating Cards around Mockup with Hover & Floating Animations */}
            <div className="hidden lg:block absolute top-[10%] -left-12 glass p-3.5 rounded-2xl w-44 hover:scale-105 transition-transform duration-300 animate-float-1 z-20 border-glow">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-secondary-fixed text-lg">rainy</span>
                <div>
                  <p className="text-[8px] font-semibold text-on-surface-variant uppercase font-inter">Previsão Semanal</p>
                  <p className="text-[11px] font-bold text-white">Chuvas: 120mm</p>
                </div>
              </div>
            </div>

            <div className="hidden lg:block absolute bottom-[20%] -right-12 glass p-3.5 rounded-2xl w-48 hover:scale-105 transition-transform duration-300 animate-float-2 z-20 border-glow">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-secondary-fixed text-lg">trending_up</span>
                <div>
                  <p className="text-[8px] font-semibold text-on-surface-variant uppercase font-inter">Produtividade Safra</p>
                  <p className="text-[11px] font-bold text-secondary-fixed">+18% vs. Anterior</p>
                </div>
              </div>
            </div>

            <div className="hidden lg:block absolute -bottom-8 left-12 glass p-3.5 rounded-2xl w-48 hover:scale-105 transition-transform duration-300 animate-float-3 z-20 border-glow">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-tertiary-fixed text-lg">science</span>
                <div>
                  <p className="text-[8px] font-semibold text-on-surface-variant uppercase font-inter">Análise Química</p>
                  <p className="text-[11px] font-bold text-white">Solo Otimizado</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Showcase Grid (Linear Style) — BLOCK 2 (White Background) */}
      <section className="py-24 relative overflow-hidden bg-white text-zinc-900 border-y border-zinc-200/50 reveal" id="ferramentas">
        <div className="max-w-7xl mx-auto px-6 md:px-10">
          <div className="text-center max-w-3xl mx-auto mb-20 space-y-4">
            <span className="text-secondary font-semibold uppercase tracking-widest text-xs font-inter block">Tecnologia de Precisão</span>
            <h2 className="font-headline text-2xl sm:text-3xl md:text-4xl text-primary font-bold tracking-tight">Ferramentas Agrícolas que otimizam seu campo.</h2>
            <p className="text-zinc-600 font-sans text-sm md:text-base leading-relaxed">
              Substitua planilhas complexas por painéis práticos desenhados exclusivamente para a bananicultura brasileira.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            {toolsList.map((tool, idx) => (
              <motion.div
                key={tool.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: (idx % 2) * 0.1 }}
                className="bg-slate-50 border border-zinc-200/80 p-8 md:p-10 rounded-[2.5rem] hover:border-secondary hover:shadow-xl transition-all shadow-sm flex flex-col justify-between group hover:bg-emerald-50/10 duration-300"
              >
                <div className="space-y-6">
                  <div className="w-16 h-16 rounded-2xl bg-secondary/10 flex items-center justify-center border border-secondary/20 transition-colors group-hover:bg-secondary/20">
                    {tool.icon}
                  </div>
                  <h3 className="text-2xl font-headline font-bold text-primary">{tool.title}</h3>
                  <p className="text-zinc-600 text-xs leading-relaxed font-sans">{tool.desc}</p>
                  
                  <div className="space-y-2 pt-4 border-t border-zinc-200/60">
                    {tool.features.map((feat, fidx) => (
                      <div key={fidx} className="flex items-center gap-2 text-zinc-700 text-xs font-semibold">
                        <CheckCircle2 size={16} className="text-secondary shrink-0" />
                        <span>{feat}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Advanced Interactive Solo and Diagnostics Demo (Vercel Style) — BLOCK 3 (Dark Background) */}
      <section className="py-24 relative overflow-hidden bg-surface-container/40 border-y border-outline-variant/20 reveal">
        <div className="glow-spot glow-primary top-[20%] right-[-10%]" />
        
        <div className="max-w-7xl mx-auto px-6 md:px-10 grid md:grid-cols-2 gap-y-10 md:gap-16 items-center w-full min-w-0">
          <div className="space-y-8 w-full min-w-0">
            <span className="text-secondary-fixed font-semibold uppercase tracking-widest text-xs font-inter block">Módulos Avançados</span>
            <h2 className="font-headline text-2xl sm:text-3xl md:text-4xl text-white font-extrabold tracking-tight leading-tight">
              Análise Química Otimizada & Diagnóstico de Campo.
            </h2>
            <p className="font-sans text-sm md:text-base text-on-surface-variant leading-relaxed">
              O Bananal PRO une educação e tecnologia. Acesse cursos de recomendação de adubação ao mesmo tempo em que calcula dosagens ideais com nossa ferramenta inteligente de calagem.
            </p>

            {/* Quick Switch controls */}
            <div className="flex gap-4 border-b border-outline-variant/30 pb-2">
              <button
                onClick={() => setActiveTool("solo")}
                className={`pb-2 text-xs font-bold font-inter cursor-pointer transition-all border-b-2 ${
                  activeTool === "solo"
                    ? "border-secondary-fixed text-secondary-fixed font-semibold"
                    : "border-transparent text-on-surface-variant hover:text-white"
                }`}
              >
                Química de Solo
              </button>
              <button
                onClick={() => setActiveTool("diagnostico")}
                className={`pb-2 text-xs font-bold font-inter cursor-pointer transition-all border-b-2 ${
                  activeTool === "diagnostico"
                    ? "border-secondary-fixed text-secondary-fixed font-semibold"
                    : "border-transparent text-on-surface-variant hover:text-white"
                }`}
              >
                Diagnóstico Visual
              </button>
            </div>

            <div className="space-y-4">
              {activeTool === "solo" ? (
                <>
                  <div className="flex gap-3">
                    <span className="material-symbols-outlined text-secondary-fixed text-xl mt-0.5">check_circle</span>
                    <div>
                      <p className="text-sm font-headline font-semibold text-white">Recomendação de Adubação</p>
                      <p className="text-xs text-on-surface-variant font-sans">Aprenda a aplicar as dosagens exatas de fósforo, nitrogênio e potássio na bananeira.</p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <span className="material-symbols-outlined text-secondary-fixed text-xl mt-0.5">check_circle</span>
                    <div>
                      <p className="text-sm font-headline font-semibold text-white">Evolução do Solo por Talhão</p>
                      <p className="text-xs text-on-surface-variant font-sans">Acompanhe a correção química da terra de forma visual e de fácil entendimento.</p>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex gap-3">
                    <span className="material-symbols-outlined text-secondary-fixed text-xl mt-0.5">check_circle</span>
                    <div>
                      <p className="text-sm font-headline font-semibold text-white">Envio de Fotos para Análise</p>
                      <p className="text-xs text-on-surface-variant font-sans">Identifique anomalias como a Sigatoka ou ácaros foliares enviando fotos no painel.</p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <span className="material-symbols-outlined text-secondary-fixed text-xl mt-0.5">check_circle</span>
                    <div>
                      <p className="text-sm font-headline font-semibold text-white">Recomendação Operacional</p>
                      <p className="text-xs text-on-surface-variant font-sans">Dicas técnicas de tratamentos fitossanitários com a supervisão dos agrônomos.</p>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Interactive Screen Preview */}
          <div className="glass p-5 rounded-[2rem] border-glow shadow-2xl relative w-full min-h-[320px] bg-[#020d08] flex flex-col justify-between min-w-0">
            {activeTool === "solo" ? (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-bold text-white uppercase font-headline">Solo: Interpretação de Laudo Químico</span>
                  <span className="text-[8px] bg-secondary/20 text-secondary-fixed px-2 py-0.5 rounded font-inter">Talhão Central</span>
                </div>
                {/* Visual Dials/Bars */}
                <div className="space-y-2.5 font-sans">
                  {[
                    { label: "pH do Solo", value: "6.4", target: "6.0 - 6.5", color: "text-secondary-fixed" },
                    { label: "Matéria Orgânica", value: "3.8 %", target: "3.5 % - 4.5 %", color: "text-secondary-fixed" },
                    { label: "Alumínio (Al3+)", value: "0.1 cmolc/dm³", target: "< 0.2", color: "text-secondary-fixed" },
                    { label: "Saturação por Bases (V%)", value: "52 %", target: "60 % - 70 %", color: "text-tertiary-fixed" }
                  ].map((dial, idx) => (
                    <div key={idx} className="p-3 bg-surface-container/50 border border-outline-variant/20 rounded-xl flex justify-between items-center text-xs">
                      <div>
                        <p className="font-semibold text-white">{dial.label}</p>
                        <p className="text-[10px] text-on-surface-variant">Alvo: {dial.target}</p>
                      </div>
                      <span className={`font-headline font-bold ${dial.color}`}>{dial.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-bold text-white uppercase font-headline">Diagnóstico por Imagem</span>
                  <span className="text-[8px] bg-amber-500/20 text-tertiary-fixed px-2 py-0.5 rounded font-inter">Pendente Verificação</span>
                </div>
                {/* Diagnostic visual item */}
                <div className="flex gap-4 items-center p-4 bg-surface-container/50 border border-outline-variant/20 rounded-2xl">
                  <div className="w-16 h-16 rounded-xl bg-gradient-to-tr from-secondary/30 to-amber-500/30 flex items-center justify-center border border-outline-variant/30 shrink-0">
                    <span className="material-symbols-outlined text-secondary-fixed text-3xl">image</span>
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-white font-headline">Imagem: Foliar_TalhaoNorte_01.jpg</h5>
                    <p className="text-[10px] text-on-surface-variant mt-1 leading-relaxed">
                      Resultado IA: **86% probabilidade de Sigatoka Amarela**. Recomendamos aplicação imediata de fungicida preventivo.
                    </p>
                  </div>
                </div>
                <div className="p-3 bg-amber-950/20 border border-amber-500/10 rounded-xl flex justify-between items-center text-[10px]">
                  <span className="text-white font-semibold">Agrônomo Alocado:</span>
                  <span className="text-secondary-fixed font-bold">Dr. Carlos Eduardo (24h úteis)</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* The Intelligence Hub: Slack/Discord Style Community Showcase (Circle/Slack Style) — BLOCK 4 (White Background) */}
      <section className="py-24 relative overflow-hidden bg-white text-zinc-900 border-b border-zinc-200/50 reveal" id="comunidade">
        <div className="max-w-7xl mx-auto px-6 md:px-10 grid lg:grid-cols-12 gap-y-10 lg:gap-16 items-center w-full min-w-0">
          
          {/* Slack/Discord Workspace Mockup */}
          <div className="lg:col-span-7 w-full flex justify-center items-center min-w-0">
            <div className="w-full max-w-[620px] dark-glass rounded-[2rem] p-3 shadow-2xl relative border-glow overflow-hidden min-w-0">
              <div className="w-full rounded-[1.5rem] bg-[#010905] border border-outline-variant/20 flex flex-col sm:flex-row overflow-hidden min-h-[350px] text-white">
                
                {/* Channels list */}
                <div className="w-full sm:w-40 border-b sm:border-b-0 sm:border-r border-outline-variant/20 p-3 bg-[#010603] flex flex-row sm:flex-col gap-2 overflow-x-auto sm:overflow-x-visible shrink-0">
                  <div className="hidden sm:flex items-center gap-2 mb-4 px-2 py-1 border-b border-outline-variant/10">
                    <span className="w-2.5 h-2.5 rounded-full bg-secondary-fixed animate-pulse"></span>
                    <span className="text-[10px] font-bold text-white uppercase font-headline">BANANAL VIP</span>
                  </div>
                  <div className="flex flex-row sm:flex-col gap-1 w-full">
                    {["Geral", "Preço de Mercado", "Controle de Pragas", "Adubação"].map((chan) => (
                      <div
                        key={chan}
                        className={`flex items-center gap-1.5 px-2.5 py-1 text-[10px] rounded transition-all text-on-surface-variant font-inter whitespace-nowrap cursor-pointer ${
                          chan === "Controle de Pragas"
                            ? "bg-secondary/15 text-secondary-fixed font-bold border border-secondary/20"
                            : "hover:text-white"
                        }`}
                      >
                        <span className="text-on-surface-variant font-mono">#</span>
                        {chan}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Chat Feed */}
                <div className="flex-1 p-4 flex flex-col justify-between">
                  <div className="flex justify-between items-center pb-2 border-b border-outline-variant/10">
                    <div>
                      <span className="text-[10px] font-bold font-headline text-white"># Controle de Pragas</span>
                      <p className="text-[7px] text-on-surface-variant font-inter">Dúvidas técnicas e boletins fitossanitários</p>
                    </div>
                    <span className="text-[8px] text-on-surface-variant font-inter">42 online</span>
                  </div>
                  
                  {/* Messages list */}
                  <div className="flex-1 space-y-3.5 my-3 overflow-y-auto max-h-[180px] pr-2">
                    <div className="flex gap-2 text-[9px] items-start">
                      <div className="w-6 h-6 rounded-full bg-secondary/20 flex items-center justify-center shrink-0 border border-outline-variant/20">
                        <span className="text-secondary-fixed font-bold text-[8px]">AM</span>
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-white">Alisson Martins</span>
                          <span className="text-[7px] text-on-surface-variant">Bahia • 10:24</span>
                        </div>
                        <p className="text-on-surface-variant font-sans mt-0.5">Pessoal, surgiu essa mancha nas bananeiras novas no talhão sul. Alguém já viu?</p>
                      </div>
                    </div>

                    <div className="flex gap-2 text-[9px] items-start bg-secondary/5 p-2 rounded-xl border border-secondary/10">
                      <div className="w-6 h-6 rounded-full bg-secondary-fixed text-primary-container flex items-center justify-center shrink-0 border border-secondary-fixed/20 shadow-glow">
                        <span className="material-symbols-outlined text-xs">shield</span>
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-white flex items-center gap-1">
                            Dr. Carlos Eduardo
                            <span className="text-[7px] bg-secondary-fixed text-primary px-1.5 py-0.2 rounded-full font-bold">Agrônomo</span>
                          </span>
                          <span className="text-[7px] text-on-surface-variant">10:45</span>
                        </div>
                        <p className="text-emerald-300 font-sans mt-0.5">Alisson, esse sintoma indica infestação inicial de Sigatoka. Não aplique excesso de nitrogênio. Aconselho o tratamento biológico com Trichoderma na base da planta.</p>
                      </div>
                    </div>
                  </div>

                  {/* Input field mockup */}
                  <div className="p-2 bg-surface-container/50 border border-outline-variant/20 rounded-xl flex items-center justify-between text-[9px] text-on-surface-variant font-inter">
                    <span>Pergunte algo à comunidade ou envie uma foto...</span>
                    <span className="material-symbols-outlined text-xs hover:text-white cursor-pointer">send</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Text Column */}
          <div className="lg:col-span-5 space-y-8 text-left w-full min-w-0">
            <span className="text-secondary font-semibold uppercase tracking-widest text-xs font-inter block">Inteligência Coletiva</span>
            <h2 className="font-headline text-2xl sm:text-3xl md:text-4xl text-primary font-bold tracking-tight">O epicentro de conexões e capacitação rural.</h2>
            <p className="font-sans text-sm md:text-base text-zinc-600 leading-relaxed">
              Não produza isolado. Participe de debates técnicos com outros agricultores, participe de lives semanais exclusivas com engenheiros agrônomos convidados e acesse cotações de preços de caixas de banana em tempo real por região.
            </p>
            <div className="space-y-4">
              <div className="flex gap-3">
                <span className="material-symbols-outlined text-secondary text-xl">school</span>
                <div>
                  <h4 className="text-sm font-headline font-semibold text-primary">Cursos Técnicos Avançados</h4>
                  <p className="text-xs text-zinc-600 font-sans">Aprenda com especialistas os segredos de condução, tratos culturais e combate a pragas.</p>
                </div>
              </div>
              <div className="flex gap-3">
                <span className="material-symbols-outlined text-secondary text-xl">database</span>
                <div>
                  <h4 className="text-sm font-headline font-semibold text-primary">Cotações & Transações</h4>
                  <p className="text-xs text-zinc-600 font-sans">Entenda a média de venda da banana prata e nanica antes de negociar sua colheita.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Results Counters Section — BLOCK 5 (Dark Background) */}
      <section className="py-24 bg-surface-container/30 border-y border-outline-variant/20 relative reveal">
        <div className="max-w-7xl mx-auto px-6 md:px-10">
          <div className="bg-primary-container/40 p-12 rounded-[3.5rem] border border-outline-variant/30 text-center text-white relative overflow-hidden group">
            {/* Mesh highlights inside results card */}
            <div className="absolute top-0 right-0 w-80 h-80 bg-secondary/15 blur-[120px] transition-all duration-700 group-hover:bg-secondary/25"></div>
            
            <div className="relative z-10">
              <h2 className="font-headline text-2xl sm:text-3xl font-bold mb-16 tracking-tight text-white">Resultados Reais Operacionais</h2>
              <div className="grid md:grid-cols-3 gap-12">
                <div className="space-y-4 border-r md:border-outline-variant/30 last:border-0 pr-4">
                  <Counter target={35} prefix="+" suffix="%" />
                  <p className="text-xs font-semibold tracking-widest text-on-primary-container uppercase font-inter">Aumento Médio na Produtividade</p>
                </div>
                <div className="space-y-4 border-r md:border-outline-variant/30 last:border-0 pr-4">
                  <Counter target={15} suffix="%" />
                  <p className="text-xs font-semibold tracking-widest text-on-primary-container uppercase font-inter">Redução em Custos de Insumos</p>
                </div>
                <div className="space-y-4">
                  <Counter target={3.4} decimals={1} suffix="x" />
                  <p className="text-xs font-semibold tracking-widest text-on-primary-container uppercase font-inter">Retorno sobre Investimento (ROI)</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section (Fintech Style) — BLOCK 6 (White Background) */}
      <section className="py-24 bg-white text-zinc-900 border-b border-zinc-200/50 relative reveal" id="planos">
        <div className="max-w-7xl mx-auto px-6 md:px-10 text-center">
          <div className="max-w-3xl mx-auto mb-16 space-y-4">
            <span className="text-secondary font-semibold uppercase tracking-widest text-xs font-inter block">Investimento Otimizado</span>
            <h2 className="font-headline text-2xl sm:text-3xl md:text-4xl text-primary font-bold tracking-tight">O ecossistema completo ao seu alcance.</h2>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Mensal */}
            <div className="dark-glass rounded-[2.5rem] p-10 relative price-card hover-card-effect border-glow flex flex-col justify-between">
              <div>
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-zinc-800 text-zinc-400 px-5 py-1 rounded-full text-[10px] font-bold tracking-widest uppercase font-inter border border-white/5">
                  PLANO MENSAL
                </div>
                <div className="mb-6 mt-4">
                  <span className="text-5xl font-headline font-extrabold text-white">R$ 97</span>
                  <span className="text-on-surface-variant font-sans text-sm">/mês</span>
                </div>
                <p className="text-on-surface-variant mb-8 font-sans text-xs leading-relaxed">
                  Ideal para quem deseja flexibilidade total e testar todos os recursos operacionais.
                </p>
                <ul className="space-y-3.5 text-left mb-8 font-sans text-[11px] text-zinc-300">
                  <li className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-secondary-fixed text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                    <span>Treinamentos e Cursos Técnicos Inclusos</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-secondary-fixed text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                    <span>Suporte com Engenheiros Agrônomos</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-secondary-fixed text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                    <span>Comunidade VIP & Cotações de Mercado</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-secondary-fixed text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                    <span>Ferramentas de Solo & Gestão Agrícola</span>
                  </li>
                </ul>
              </div>
              <div>
                <Link
                  to="/auth/register?offer=padrao&plan=mensal"
                  className="w-full bg-white/5 hover:bg-white/10 text-white py-4 rounded-xl font-headline font-bold text-xs tracking-wider uppercase transition-all duration-300 border border-white/10 active:scale-95 block text-center cursor-pointer"
                >
                  Assinar Mensal
                </Link>
                <p className="text-[9px] text-on-surface-variant mt-4 font-sans uppercase tracking-widest font-semibold">Sem fidelidade • Cancele quando quiser</p>
              </div>
            </div>

            {/* Anual */}
            <div className="dark-glass rounded-[2.5rem] p-10 relative price-card hover-card-effect border-glow border-secondary/50 flex flex-col justify-between overflow-hidden shadow-2xl shadow-secondary/5">
              <div className="absolute top-0 right-0 bg-secondary text-white text-[8px] font-black uppercase tracking-widest px-4 py-1.5 rounded-bl-2xl">
                OFERTA MEMBRO FUNDADOR
              </div>
              <div>
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-secondary text-white px-5 py-1 rounded-full text-[10px] font-bold tracking-widest uppercase font-inter border border-secondary-fixed/20 shadow-glow">
                  PLANO ANUAL
                </div>
                <div className="mb-6 mt-4">
                  <span className="text-5xl font-headline font-extrabold text-white">R$ 497</span>
                  <span className="text-on-surface-variant font-sans text-sm">/ano</span>
                  <p className="text-secondary-fixed text-[10px] font-bold mt-1 uppercase tracking-wider">De R$ 797 por R$ 497 (Economize R$ 300)</p>
                </div>
                <p className="text-on-surface-variant mb-8 font-sans text-xs leading-relaxed">
                  Acesso completo por 12 meses. Parcele em até **12x de R$ 49,70** no cartão de crédito.
                </p>
                <ul className="space-y-3.5 text-left mb-8 font-sans text-[11px] text-zinc-300">
                  <li className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-secondary-fixed text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                    <span className="font-bold text-white">Tudo do plano Mensal incluído</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-secondary-fixed text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                    <span>Desconto Membro Fundador de R$ 797 por R$ 497</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-secondary-fixed text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                    <span>Prioridade máxima em laudos de análise de solo</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-secondary-fixed text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                    <span>Acesso a todas as futuras atualizações e ferramentas</span>
                  </li>
                </ul>
              </div>
              <div>
                <Link
                  to="/auth/register?offer=padrao&plan=anual"
                  className="w-full bg-secondary hover:bg-secondary-fixed text-white hover:text-primary-container py-4.5 rounded-xl font-headline font-extrabold text-xs tracking-wider uppercase transition-all duration-300 shadow-lg shadow-secondary/15 active:scale-95 block text-center cursor-pointer"
                >
                  Assinar Anual (12x de R$ 49,70)
                </Link>
                <p className="text-[9px] text-on-surface-variant mt-4 font-sans uppercase tracking-widest font-semibold">Parcele em até 12x no cartão de crédito</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section — BLOCK 7 (White Background / Light gray) */}
      <section className="py-24 bg-slate-50 text-zinc-900 border-b border-zinc-200/50 reveal" id="faq">
        <div className="max-w-3xl mx-auto px-6 md:px-10">
          <h2 className="font-headline text-3xl text-primary font-bold text-center mb-16">Dúvidas Frequentes</h2>
          <div className="space-y-4 font-sans">
            <details className="group p-6 rounded-2xl border border-zinc-200 bg-white transition-all duration-300 hover:border-secondary/45 shadow-sm">
              <summary className="flex justify-between items-center cursor-pointer list-none font-headline font-semibold text-sm md:text-base text-primary">
                Como funciona o suporte com os agrônomos?
                <span className="material-symbols-outlined group-open:rotate-180 transition-transform duration-300 text-zinc-400">
                  expand_more
                </span>
              </summary>
              <div className="overflow-hidden transition-all duration-300">
                <p className="mt-4 text-xs md:text-sm text-zinc-600 leading-relaxed">
                  Dentro do módulo de comunidade ou na área do painel de solo, você pode abrir chamados técnicos e enviar fotos e relatórios da sua plantação de bananas. Nossos engenheiros agrônomos respondem em até 24h úteis fornecendo recomendações de tratamento.
                </p>
              </div>
            </details>

            <details className="group p-6 rounded-2xl border border-zinc-200 bg-white transition-all duration-300 hover:border-secondary/45 shadow-sm">
              <summary className="flex justify-between items-center cursor-pointer list-none font-headline font-semibold text-sm md:text-base text-primary">
                Como tenho acesso aos cursos de bananicultura?
                <span className="material-symbols-outlined group-open:rotate-180 transition-transform duration-300 text-zinc-400">
                  expand_more
                </span>
              </summary>
              <div className="overflow-hidden transition-all duration-300">
                <p className="mt-4 text-xs md:text-sm text-zinc-600 leading-relaxed">
                  O acesso aos cursos e treinamentos técnicos é liberado imediatamente após a confirmação da sua assinatura. Você e sua equipe podem assistir às aulas teóricas e práticas (vídeos gravados e materiais PDF de apoio) de qualquer computador ou celular.
                </p>
              </div>
            </details>

            <details className="group p-6 rounded-2xl border border-zinc-200 bg-white transition-all duration-300 hover:border-secondary/45 shadow-sm">
              <summary className="flex justify-between items-center cursor-pointer list-none font-headline font-semibold text-sm md:text-base text-primary">
                Consigo utilizar a plataforma offline no campo?
                <span className="material-symbols-outlined group-open:rotate-180 transition-transform duration-300 text-zinc-400">
                  expand_more
                </span>
              </summary>
              <div className="overflow-hidden transition-all duration-300">
                <p className="mt-4 text-xs md:text-sm text-zinc-600 leading-relaxed">
                  Sim! Você pode registrar seus custos, manejos e controle de estoque mesmo sem sinal de internet ou de celular no campo. Todas as suas informações ficam salvas de forma segura e são atualizadas automaticamente com o sistema assim que você se conectar a uma rede.
                </p>
              </div>
            </details>

            <details className="group p-6 rounded-2xl border border-zinc-200 bg-white transition-all duration-300 hover:border-secondary/45 shadow-sm">
              <summary className="flex justify-between items-center cursor-pointer list-none font-headline font-semibold text-sm md:text-base text-primary">
                Quais variedades de banana a plataforma atende?
                <span className="material-symbols-outlined group-open:rotate-180 transition-transform duration-300 text-zinc-400">
                  expand_more
                </span>
              </summary>
              <div className="overflow-hidden transition-all duration-300">
                <p className="mt-4 text-xs md:text-sm text-zinc-600 leading-relaxed">
                  O Bananal PRO possui parâmetros calibrados para as principais variedades cultivadas no Brasil, incluindo Banana Prata (Anã e Catarinense), Cavendish (Nanica/Nanicão), Banana Maçã, Banana da Terra e Banana Ouro.
                </p>
              </div>
            </details>

            <details className="group p-6 rounded-2xl border border-zinc-200 bg-white transition-all duration-300 hover:border-secondary/45 shadow-sm">
              <summary className="flex justify-between items-center cursor-pointer list-none font-headline font-semibold text-sm md:text-base text-primary">
                Como funciona a interpretação da análise de solo?
                <span className="material-symbols-outlined group-open:rotate-180 transition-transform duration-300 text-zinc-400">
                  expand_more
                </span>
              </summary>
              <div className="overflow-hidden transition-all duration-300">
                <p className="mt-4 text-xs md:text-sm text-zinc-600 leading-relaxed">
                  Você insere manualmente os dados químicos do seu laudo (pH, P, K, Ca, Mg, etc.) e o sistema calcula instantaneamente a Soma de Bases (SB), Capacidade de Troca Catiônica (CTC), saturação por bases atual (V%) e a dose recomendada de calcário em toneladas por hectare (Necessidade de Calagem).
                </p>
              </div>
            </details>

            <details className="group p-6 rounded-2xl border border-zinc-200 bg-white transition-all duration-300 hover:border-secondary/45 shadow-sm">
              <summary className="flex justify-between items-center cursor-pointer list-none font-headline font-semibold text-sm md:text-base text-primary">
                Vocês emitem certificados para os funcionários treinados?
                <span className="material-symbols-outlined group-open:rotate-180 transition-transform duration-300 text-zinc-400">
                  expand_more
                </span>
              </summary>
              <div className="overflow-hidden transition-all duration-300">
                <p className="mt-4 text-xs md:text-sm text-zinc-600 leading-relaxed">
                  Sim! Todos os treinamentos técnicos possuem avaliações de conhecimento e emitem certificados de conclusão nominais em PDF. Perfeito para comprovar a capacitação da sua equipe de campo para auditorias ou certificadoras (como GlobalGAP).
                </p>
              </div>
            </details>

            <details className="group p-6 rounded-2xl border border-zinc-200 bg-white transition-all duration-300 hover:border-secondary/45 shadow-sm">
              <summary className="flex justify-between items-center cursor-pointer list-none font-headline font-semibold text-sm md:text-base text-primary">
                Como funciona o diagnóstico por imagem de pragas?
                <span className="material-symbols-outlined group-open:rotate-180 transition-transform duration-300 text-zinc-400">
                  expand_more
                </span>
              </summary>
              <div className="overflow-hidden transition-all duration-300">
                <p className="mt-4 text-xs md:text-sm text-zinc-600 leading-relaxed">
                  Você tira uma foto nítida da folha lesionada ou sintoma com o celular e envia na plataforma. Nosso sistema analisa os padrões visuais para identificar doenças (como Sigatoka Negra/Amarela ou Fusariose) e sugere manejos imediatos de controle cultural ou químico.
                </p>
              </div>
            </details>

            <details className="group p-6 rounded-2xl border border-zinc-200 bg-white transition-all duration-300 hover:border-secondary/45 shadow-sm">
              <summary className="flex justify-between items-center cursor-pointer list-none font-headline font-semibold text-sm md:text-base text-primary">
                O controle de custos financeiros serve para mais de uma propriedade?
                <span className="material-symbols-outlined group-open:rotate-180 transition-transform duration-300 text-zinc-400">
                  expand_more
                </span>
              </summary>
              <div className="overflow-hidden transition-all duration-300">
                <p className="mt-4 text-xs md:text-sm text-zinc-600 leading-relaxed">
                  Sim, você pode gerenciar os custos operacionais (insumos, diesel, mão de obra) de diferentes talhões ou glebas e visualizar os relatórios consolidados ou filtrados por área no seu painel financeiro.
                </p>
              </div>
            </details>

            <details className="group p-6 rounded-2xl border border-zinc-200 bg-white transition-all duration-300 hover:border-secondary/45 shadow-sm">
              <summary className="flex justify-between items-center cursor-pointer list-none font-headline font-semibold text-sm md:text-base text-primary">
                O gateway de pagamentos é seguro? Como recebo as notas fiscais?
                <span className="material-symbols-outlined group-open:rotate-180 transition-transform duration-300 text-zinc-400">
                  expand_more
                </span>
              </summary>
              <div className="overflow-hidden transition-all duration-300">
                <p className="mt-4 text-xs md:text-sm text-zinc-600 leading-relaxed">
                  Todas as assinaturas são processadas de forma segura através do InfinitePay, um dos maiores gateways de pagamento do Brasil. Você recebe os comprovantes de serviço diretamente no seu e-mail cadastrado.
                </p>
              </div>
            </details>

            <details className="group p-6 rounded-2xl border border-zinc-200 bg-white transition-all duration-300 hover:border-secondary/45 shadow-sm">
              <summary className="flex justify-between items-center cursor-pointer list-none font-headline font-semibold text-sm md:text-base text-primary">
                Posso cancelar a assinatura a qualquer momento?
                <span className="material-symbols-outlined group-open:rotate-180 transition-transform duration-300 text-zinc-400">
                  expand_more
                </span>
              </summary>
              <div className="overflow-hidden transition-all duration-300">
                <p className="mt-4 text-xs md:text-sm text-zinc-600 leading-relaxed">
                  Sim! O plano mensal não possui carência ou fidelidade, podendo ser cancelado com um clique no seu painel de configurações. O plano anual garante acesso por 12 meses, com renovação automática opcional.
                </p>
              </div>
            </details>
          </div>
        </div>
      </section>

      {/* Final Cinematic CTA — BLOCK 8 (Dark image backdrop) */}
      <section className="relative py-36 overflow-hidden reveal">
        <div className="absolute inset-0 z-0">
          <img
            alt="Banana Plantation"
            className="w-full h-full object-cover brightness-[0.25] transition-transform duration-[3000ms] hover:scale-105"
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuCNVB0M7qqkD03-wJME2_tzbotkdKN2EIxn9WzqSc6Tdap73X_tPl_Yn0s48W6aBpB4AA5hc2wa6MVYM4Gs1uhTgeZHJNZQCIfPrR44LrMF3FV3mlUdw8rI7BDnJEBtPzG3Z5-5lpzchhJiOzuw70vgqELfrk7HuMDNqNE9fA_b9b6JAdHvRzJj45wKFRACWLHOJLF_xrluSZEa727AxyPfr2_GVEPChgQPBpx4hw6JiY3h1zaJ4bm65kpK-NxofQdZPQqxDk5fdQ"
          />
        </div>
        
        {/* Volumetric Green overlay inside CTA */}
        <div className="absolute inset-0 bg-[#002417]/30 z-5"></div>

        <div className="relative z-10 max-w-7xl mx-auto px-6 md:px-10 text-center text-white space-y-8">
          <h2 className="font-headline text-3xl md:text-5xl font-extrabold max-w-4xl mx-auto leading-tight tracking-tight">
            Pronto para liderar a nova era da bananicultura?
          </h2>
          <p className="text-sm md:text-base text-white/70 max-w-xl mx-auto font-sans">
            Capacite sua equipe, conecte-se a agrônomos experientes e utilize a melhor tecnologia agrícola do mercado.
          </p>
          <div className="pt-4">
            <Link
              to="/auth/register?offer=padrao&plan=anual"
              className="bg-secondary hover:bg-secondary-fixed text-white hover:text-primary-container px-12 py-5 rounded-2xl font-headline font-extrabold text-sm tracking-wider uppercase transition-all duration-300 shadow-2xl shadow-secondary/20 hover:scale-[1.02] active:scale-95 inline-block text-center cursor-pointer"
            >
              Começar Agora
            </Link>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
