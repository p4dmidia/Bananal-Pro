import React, { useState } from "react";
import { Link } from "react-router-dom";
import { 
  Zap, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  TrendingUp, 
  Award, 
  ArrowRight, 
  HelpCircle,
  Volume2,
  VolumeX,
  Play,
  FileText,
  ShieldCheck,
  Calendar,
  Users,
  Sun,
  Video,
  Database,
  BarChart3,
  Package,
  Layers,
  Sparkles,
  Lock
} from "lucide-react";
import logoImg from "../../assets/logo.png";
import salesHeroImg from "../../assets/sales-hero.jpg";
import videoCoverImg from "../../assets/video-cover.jpg";

export default function SalesPage() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  const scrollToOffer = (e: React.MouseEvent) => {
    e.preventDefault();
    const offerSection = document.getElementById("oferta-pricing");
    if (offerSection) {
      offerSection.scrollIntoView({ behavior: "smooth" });
    }
  };

  const handlePlayToggle = () => {
    setIsPlaying(!isPlaying);
  };

  const handleMuteToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsMuted(!isMuted);
  };

  return (
    <div className="min-h-screen bg-[#052014] text-white font-sans overflow-x-hidden selection:bg-secondary/40 selection:text-white relative">
      {/* High Precision Grid Background */}
      <div className="absolute inset-0 bg-grid opacity-60 pointer-events-none z-0" />
      
      {/* Volumetric Lights */}
      <div className="glow-spot glow-green top-[-5%] right-[-10%] md:right-[5%]" />
      <div className="glow-spot glow-yellow top-[30%] left-[-15%] md:left-[-5%]" />
      <div className="glow-spot glow-primary bottom-[10%] right-[10%]" />

      <div className="relative z-10">
        


        {/* HERO SECTION */}
        <section className="relative py-24 md:py-36 min-h-[85vh] flex items-center overflow-hidden border-b border-outline-variant/10">
          {/* Background Image (Netflix Cover style) */}
          <div className="absolute inset-0 z-0">
            <img
              src={salesHeroImg}
              alt="Bananal PRO Background"
              className="w-full h-full object-cover object-right md:object-center brightness-[0.55] lg:brightness-[0.6]"
            />
            {/* Cinematic Gradient Overlays to ensure readability */}
            {/* Left to right fade for text readability */}
            <div className="absolute inset-0 bg-gradient-to-r from-[#052014] via-[#052014]/85 sm:via-[#052014]/55 to-transparent z-10" />
            {/* Bottom to top fade for transition to next section */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#052014] via-transparent to-transparent z-10" />
            {/* Dark tint on top */}
            <div className="absolute inset-0 bg-black/15 z-10" />
          </div>

          <div className="max-w-7xl mx-auto px-6 relative z-20 w-full">
            <div className="max-w-3xl text-left space-y-8">
              <div className="space-y-4">
                <h2 className="text-xl md:text-2xl font-headline font-black tracking-widest text-secondary-fixed uppercase">
                  DO PLANTIO À COLHEITA.
                </h2>
                <h1 className="font-headline text-4xl md:text-6xl lg:text-7xl text-white font-extrabold tracking-tight leading-[1.1] text-balance">
                  TUDO O QUE VOCÊ PRECISA PARA TER UMA LAVOURA <span className="text-transparent bg-clip-text bg-gradient-to-r from-secondary-fixed to-tertiary-fixed font-black">MAIS PRODUTIVA E LUCRATIVA.</span>
                </h1>
              </div>

              <div className="space-y-4 font-sans text-base md:text-lg text-zinc-200 leading-relaxed text-balance max-w-2xl">
                <p className="font-semibold">
                  O primeiro ecossistema completo da bananicultura brasileira com treinamentos, ferramentas, gestão e suporte especializado.
                </p>
              </div>

              <div className="pt-4">
                <a
                  href="#oferta-pricing"
                  onClick={scrollToOffer}
                  className="bg-secondary hover:bg-secondary-fixed text-white hover:text-primary-container px-10 py-5 rounded-2xl font-headline font-extrabold text-base tracking-wide transition-all border-glow duration-300 shadow-2xl shadow-secondary/30 hover:scale-[1.03] active:scale-95 inline-flex items-center gap-3 cursor-pointer uppercase"
                >
                  Quero Garantir Meu Acesso Fundador
                  <ArrowRight size={20} />
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* VSL (Video Sales Letter) SECTION */}
        <section className="py-16 bg-surface-container/20 border-y border-outline-variant/10 relative">
          <div className="max-w-4xl mx-auto px-6 text-center space-y-10">
            
            <div className="space-y-4 max-w-3xl mx-auto">
              <h2 className="font-headline text-2xl md:text-3xl font-extrabold text-white">
                Antes de fechar esta página, assista ao vídeo abaixo.
              </h2>
              <p className="font-sans text-sm md:text-base text-zinc-400 leading-relaxed">
                Nos próximos minutos, você vai descobrir como produtores estão deixando de depender de informações soltas e passando a administrar suas lavouras com método, acompanhamento técnico e ferramentas práticas para aumentar a produtividade e o lucro.
              </p>
              <p className="font-sans text-sm md:text-base text-zinc-400 leading-relaxed">
                O Bananal PRO não é apenas mais um curso. É o próximo passo para quem quer produzir melhor, gastar menos e tomar decisões com mais segurança.
              </p>
            </div>

            {/* Video Player Mockup (Premium Iframe Container) */}
            <div 
              onClick={handlePlayToggle}
              className="w-full aspect-video dark-glass rounded-[2rem] p-3 shadow-2xl relative border border-outline-variant/30 overflow-hidden group cursor-pointer"
            >
              <div className="w-full h-full rounded-[1.5rem] bg-black overflow-hidden relative flex items-center justify-center">
                {/* Background image mockup when not playing */}
                {!isPlaying ? (
                  <>
                    <img 
                      src={videoCoverImg}
                      alt="VSL Thumbnail"
                      className="absolute inset-0 w-full h-full object-cover brightness-[0.4] group-hover:scale-[1.02] transition-transform duration-700"
                    />
                    {/* Big pulsing play button */}
                    <div className="relative z-10 w-20 h-20 rounded-full bg-secondary flex items-center justify-center border-glow shadow-2xl shadow-secondary/40 group-hover:bg-secondary-fixed group-hover:scale-110 duration-300 transition-all">
                      <Play fill="white" size={32} className="ml-1.5 text-white" />
                    </div>
                    {/* Video Duration Badge */}
                    <span className="absolute bottom-4 right-4 bg-black/80 px-3 py-1 rounded-lg text-[10px] font-bold tracking-widest text-zinc-300 border border-white/10 uppercase">
                      Apresentação Completa
                    </span>
                  </>
                ) : (
                  /* Embed video player or mock active player (custom youtube or direct embed can go here) */
                  <div className="absolute inset-0 w-full h-full bg-[#010603] flex flex-col items-center justify-center p-6 text-center space-y-4">
                    <div className="w-16 h-16 rounded-full border-t-2 border-l-2 border-secondary animate-spin mb-2" />
                    <p className="text-sm font-semibold tracking-wide text-zinc-300">Carregando apresentação...</p>
                    <p className="text-[11px] text-zinc-500 max-w-xs leading-relaxed">
                      [Para integrar seu vídeo: Substitua este mock pelo iframe do seu YouTube, Vimeo, Panda Video ou Wistia]
                    </p>
                    <button 
                      onClick={(e) => { e.stopPropagation(); setIsPlaying(false); }}
                      className="bg-white/10 hover:bg-white/20 text-white text-xs px-4 py-2 rounded-xl border border-white/10 transition-all font-bold"
                    >
                      Voltar ao Início
                    </button>
                  </div>
                )}

                {/* Top Overlay details */}
                <div className="absolute top-4 left-4 right-4 flex justify-between items-center pointer-events-none z-20">
                  <span className="bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full text-[10px] font-bold text-secondary-fixed tracking-wider flex items-center gap-1.5 border border-secondary/20">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></span>
                    APRESENTAÇÃO EXCLUSIVA
                  </span>
                </div>
              </div>
            </div>

            {/* Subtext call to action below video */}
            <p className="text-xs text-zinc-500 font-inter">
              🚨 ATENÇÃO: Essa condição especial ficará disponível por tempo limitado e poderá ser encerrada sem aviso prévio após o fechamento desta campanha.
            </p>
          </div>
        </section>

        {/* QUEBRA DE CRENÇAS / DIAGNÓSTICO DA REALIDADE */}
        <section className="py-24 bg-white text-zinc-900 border-y border-zinc-200/50 relative z-10">
          <div className="max-w-6xl mx-auto px-6 space-y-20">
            
            {/* Header / Intro */}
            <div className="text-center max-w-3xl mx-auto space-y-4">
              <span className="text-secondary font-bold uppercase tracking-widest text-xs font-inter block">Diagnóstico Real</span>
              <h2 className="font-headline text-3xl md:text-5xl font-extrabold tracking-tight text-zinc-950 leading-tight">
                A Verdade Que Poucos Produtores Gostam de Admitir
              </h2>
            </div>

            {/* Stacked layout: Trabalho duro under/above Realidade Financeira */}
            <div className="flex flex-col gap-10 bg-zinc-50 border border-zinc-200/80 p-8 md:p-12 rounded-[2.5rem] relative overflow-hidden">
              <div className="absolute top-0 left-0 w-32 h-32 bg-secondary/5 blur-[60px] rounded-full" />
              
              {/* Part 1: Você trabalha duro */}
              <div className="space-y-4 relative z-10">
                <h3 className="font-headline text-2xl font-extrabold text-zinc-900">Você trabalha duro.</h3>
                <div className="flex flex-wrap gap-3">
                  {[
                    { label: "Investe em adubo", icon: "🌱" },
                    { label: "Investe em irrigação", icon: "💧" },
                    { label: "Investe em defensivos", icon: "🛡️" },
                    { label: "Investe em mão de obra", icon: "👥" },
                    { label: "Passa o ano inteiro cuidando da lavoura", icon: "📅" }
                  ].map((item, index) => (
                    <div key={index} className="flex items-center gap-2 bg-white px-4 py-2.5 rounded-xl border border-zinc-200 shadow-sm transition-all hover:scale-[1.01] hover:border-zinc-300 shrink-0">
                      <span className="text-lg">{item.icon}</span>
                      <span className="text-sm font-semibold text-zinc-700">{item.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Horizontal Divider */}
              <div className="h-px bg-zinc-200 w-full relative z-10" />

              {/* Part 2: Mas quando chega... */}
              <div className="space-y-6 relative z-10">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-red-50 flex items-center justify-center border border-red-200/60 shrink-0">
                    <TrendingUp className="text-red-500 transform rotate-180" size={24} />
                  </div>
                  <h4 className="font-headline text-xl md:text-2xl font-bold text-red-700 leading-tight">
                    Mas quando chega o momento de fechar as contas...
                  </h4>
                </div>
                <p className="text-2xl md:text-3xl font-headline font-black text-zinc-950 leading-tight">
                  O lucro não acompanha o esforço.
                </p>
                <div className="space-y-2 max-w-3xl">
                  <p className="text-sm font-bold text-zinc-800 flex items-center gap-2">
                    💔 E o mais frustrante?
                  </p>
                  <p className="text-sm md:text-base text-zinc-600 leading-relaxed font-sans">
                    Muitas vezes você nem sabe exatamente onde está perdendo dinheiro.
                  </p>
                </div>
              </div>
            </div>

            {/* Sub-section: 4 cards of "Talvez..." */}
            <div className="space-y-8">
              <div className="text-center max-w-2xl mx-auto">
                <h3 className="font-headline text-xl font-bold text-zinc-900">Os Gargalos Silenciosos</h3>
                <p className="text-xs text-zinc-500 mt-1">Os vazamentos de lucro acontecem de forma sutil</p>
              </div>

              <div className="grid sm:grid-cols-2 gap-6">
                {[
                  { title: "Limitação de Potencial", desc: "Talvez a produtividade esteja abaixo do potencial da sua área." },
                  { title: "Desperdício de Insumos", desc: "Talvez você esteja aplicando mais insumos do que deveria." },
                  { title: "Falta de Nutrição Oculta", desc: "Talvez problemas nutricionais estejam limitando o desenvolvimento das plantas sem que você perceba." },
                  { title: "Timing Incorreto", desc: "Talvez decisões importantes estejam sendo tomadas tarde demais." }
                ].map((item, index) => (
                  <div key={index} className="p-6 rounded-2xl bg-zinc-50/50 border border-zinc-200/80 hover:border-amber-500/40 hover:bg-amber-50/10 transition-all duration-300 flex gap-4 items-start group">
                    <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center shrink-0 border border-amber-500/20 group-hover:bg-amber-500/20 transition-colors">
                      <HelpCircle className="text-amber-600" size={20} />
                    </div>
                    <div>
                      <h4 className="font-headline font-bold text-sm text-zinc-900">{item.title}</h4>
                      <p className="text-xs text-zinc-600 font-sans mt-1.5 leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Sub-section: Custos Crescentes */}
            <div className="p-8 md:p-12 rounded-[2.5rem] bg-gradient-to-r from-red-50 to-orange-50 border border-red-200/60 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-48 h-48 bg-red-500/5 blur-[80px] rounded-full" />
              <div className="relative z-10 grid md:grid-cols-3 gap-8 items-center">
                <div className="md:col-span-1 space-y-3">
                  <span className="text-red-600 font-bold uppercase tracking-widest text-[10px] font-inter block">Cenário Macroeconômico</span>
                  <h3 className="font-headline text-2xl font-extrabold text-red-950 leading-tight">
                    E enquanto isso acontece, os custos continuam aumentando.
                  </h3>
                </div>
                <div className="md:col-span-2 grid sm:grid-cols-2 gap-4">
                  {[
                    { label: "O preço dos fertilizantes sobe.", icon: "📈" },
                    { label: "O custo da mão de obra aumenta.", icon: "👥" },
                    { label: "Os defensivos ficam mais caros.", icon: "🧪" },
                    { label: "E cada erro custa mais caro do que custava no ano passado.", icon: "⚠️", highlight: true }
                  ].map((item, index) => (
                    <div key={index} className={`p-4 rounded-xl border flex items-center gap-3 ${item.highlight ? 'bg-red-600 text-white border-red-700 shadow-lg shadow-red-600/10 col-span-full sm:col-span-1' : 'bg-white text-zinc-800 border-zinc-200'}`}>
                      <span className="text-lg">{item.icon}</span>
                      <p className={`text-xs leading-relaxed font-semibold font-sans ${item.highlight ? 'text-white' : 'text-zinc-700'}`}>{item.label}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

          </div>
        </section>

        {/* AGITAÇÃO / REALIDADE DO PRODUTOR */}
        <section className="py-24 bg-surface-container/10 border-y border-outline-variant/10 relative">
          {/* Volumetric ambient light */}
          <div className="absolute top-[20%] left-[-10%] w-[40%] aspect-square rounded-full bg-red-500/5 blur-[120px] pointer-events-none" />
          
          <div className="max-w-5xl mx-auto px-6 space-y-20 relative z-10">
            
            {/* Header */}
            <div className="text-center max-w-3xl mx-auto space-y-4">
              <span className="text-secondary-fixed font-bold uppercase tracking-widest text-xs font-inter block">A Falta de Controle</span>
              <h2 className="font-headline text-3xl md:text-5xl font-extrabold tracking-tight text-white leading-tight">
                A realidade é que muitos produtores passam meses trabalhando sem saber exatamente:
              </h2>
            </div>

            {/* List of 5 items with ❌ */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-4xl mx-auto">
              {[
                { title: "Custo por hectare", text: "Qual o custo real de produção por hectare.", icon: "❌" },
                { title: "Desperdícios invisíveis", text: "Onde estão os maiores desperdícios da propriedade.", icon: "❌" },
                { title: "Manejos eficientes", text: "Quais manejos realmente aumentam a produtividade.", icon: "❌" },
                { title: "Decisões prejudiciais", text: "Quais decisões estão reduzindo seus resultados.", icon: "❌" },
                { title: "Correções urgentes", text: "O que precisa ser corrigido antes da próxima safra.", icon: "❌" }
              ].map((item, index) => (
                <div key={index} className="p-6 rounded-2xl bg-zinc-900/40 border border-outline-variant/20 hover:border-red-500/30 transition-all duration-300 flex flex-col justify-between group">
                  <div className="space-y-4">
                    <div className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center border border-red-500/20 text-red-500 font-bold">
                      {item.icon}
                    </div>
                    <div className="space-y-2">
                      <h4 className="font-headline font-bold text-sm text-white group-hover:text-red-400 transition-colors">{item.title}</h4>
                      <p className="text-xs text-zinc-400 font-sans leading-relaxed">{item.text}</p>
                    </div>
                  </div>
                </div>
              ))}
              <div className="p-6 rounded-2xl bg-red-950/20 border border-red-900/40 flex flex-col justify-center items-center text-center space-y-3 group hover:border-red-500/40 transition-all md:col-span-2 lg:col-span-1">
                <span className="text-3xl animate-bounce">🚨</span>
                <h4 className="font-headline font-bold text-sm text-red-300">Margem sob risco</h4>
                <p className="text-[10px] text-zinc-500">Trabalhar sem essas respostas é jogar com a sorte a cada safra.</p>
              </div>
            </div>

            {/* Timeline: E quando os problemas aparecem... */}
            <div className="space-y-8 max-w-4xl mx-auto pt-6 border-t border-outline-variant/10">
              <div className="text-center space-y-2">
                <h3 className="font-headline text-xl font-bold text-white">E quando os problemas aparecem...</h3>
                <p className="text-xs text-zinc-400">Normalmente já é tarde demais.</p>
              </div>

              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { text: "A planta já perdeu potencial.", icon: "🥀", color: "text-amber-400" },
                  { text: "A produtividade já foi comprometida.", icon: "📉", color: "text-orange-400" },
                  { text: "O dinheiro já foi gasto.", icon: "💸", color: "text-red-400" },
                  { text: "O prejuízo já aconteceu.", icon: "⚠️", color: "text-red-500", highlight: true }
                ].map((item, index) => (
                  <div key={index} className={`p-5 rounded-2xl border transition-all ${item.highlight ? 'bg-red-500/10 border-red-500/30' : 'bg-zinc-900/30 border-outline-variant/10 hover:border-outline-variant/30'}`}>
                    <div className="flex justify-between items-start mb-3">
                      <span className="text-2xl">{item.icon}</span>
                      <span className="text-[10px] font-mono text-zinc-600 font-bold">FASE 0{index + 1}</span>
                    </div>
                    <p className="text-xs font-semibold text-zinc-200 leading-relaxed font-sans">{item.text}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Final Agitation Callout: A pergunta é... */}
            <div className="p-8 md:p-12 rounded-[2.5rem] bg-gradient-to-br from-[#0c0f0e] via-[#052014] to-black border-2 border-secondary/20 text-center max-w-3xl mx-auto relative overflow-hidden group shadow-2xl">
              <div className="absolute inset-0 bg-secondary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
              <div className="absolute -top-12 -right-12 w-40 h-40 bg-secondary/10 blur-[80px] rounded-full" />
              
              <div className="relative z-10 space-y-6">
                <span className="text-secondary-fixed font-bold uppercase tracking-widest text-[10px] font-inter block">Reflexão Necessária</span>
                <p className="text-lg md:text-xl text-zinc-300 font-sans">
                  A pergunta é:
                </p>
                <h3 className="font-headline text-2xl md:text-4xl font-extrabold text-white leading-tight">
                  Quanto custa repetir os mesmos erros por mais uma safra?
                </h3>
              </div>
            </div>

          </div>
        </section>

        {/* APRESENTAÇÃO DA SOLUÇÃO (The Solution) SECTION */}
        <section className="py-24 max-w-6xl mx-auto px-6 space-y-24">
          
          {/* Header & Imagine Block */}
          <div className="space-y-12">
            <div className="text-center max-w-3xl mx-auto space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-secondary-container/20 border border-secondary/30">
                <span className="w-1.5 h-1.5 rounded-full bg-secondary-fixed animate-pulse"></span>
                <span className="text-[10px] font-bold tracking-widest text-secondary-fixed uppercase font-inter">
                  O Novo Caminho
                </span>
              </div>
              <h2 className="font-headline text-3xl md:text-5xl font-extrabold tracking-tight text-white leading-tight">
                Existe Uma Forma Melhor de Produzir.
              </h2>
              <p className="text-sm text-zinc-400 font-sans max-w-2xl mx-auto">
                Imagine gerenciar sua produção com total segurança, sabendo exatamente o que fazer em cada etapa.
              </p>
            </div>

            {/* Imagine Cards Grid */}
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                { title: "Clareza Total", desc: "Imagine ter clareza sobre o que está acontecendo na sua propriedade.", icon: "🔍" },
                { title: "Decisões Direcionadas", desc: "Saber exatamente quais decisões precisam ser tomadas.", icon: "🧠" },
                { title: "Evolução Segura", desc: "Acompanhar a evolução da lavoura com confiança.", icon: "📈" },
                { title: "Prevenção Ativa", desc: "Ter acesso às informações certas antes que os problemas apareçam.", icon: "🚨" },
                { title: "Apoio do Especialista", desc: "Contar com orientação técnica quando surgir uma dúvida importante.", icon: "👨‍🌾" },
                { title: "Fim do Olhômetro", desc: "E parar de depender da tentativa e erro para conduzir sua produção.", icon: "🛑" }
              ].map((item, idx) => (
                <div key={idx} className="p-6 rounded-2xl dark-glass border border-outline-variant/20 hover:border-secondary/30 transition-all duration-300">
                  <span className="text-2xl mb-4 block">{item.icon}</span>
                  <h4 className="font-headline font-bold text-sm text-white mb-2">{item.title}</h4>
                  <p className="text-xs text-zinc-400 font-sans leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Creation & Manifesto Block */}
          <div className="flex flex-col gap-10 bg-secondary/5 border border-secondary/20 p-8 md:p-12 rounded-[2.5rem] relative overflow-hidden">
            <div className="absolute top-0 right-0 w-60 h-60 bg-secondary/10 blur-[100px] rounded-full" />
            
            {/* Part 1: Foi para isso que criamos... */}
            <div className="space-y-4 relative z-10">
              <h3 className="font-headline text-2xl md:text-3xl font-extrabold text-white leading-tight">
                Foi para isso que criamos o Bananal PRO.
              </h3>
              <p className="text-sm md:text-base text-zinc-300 font-sans leading-relaxed max-w-4xl">
                Uma plataforma desenvolvida exclusivamente para produtores de banana que querem produzir mais, reduzir desperdícios e tomar decisões com mais segurança.
              </p>
            </div>

            {/* Horizontal Divider */}
            <div className="h-px bg-white/10 w-full relative z-10" />

            {/* Part 2: Nosso Manifesto */}
            <div className="space-y-6 relative z-10">
              <div>
                <span className="text-secondary-fixed font-bold uppercase tracking-widest text-[10px] font-inter block mb-2">Nosso Manifesto</span>
                <p className="text-lg md:text-xl font-headline font-extrabold text-white leading-tight">
                  Porque acreditamos que o produtor não precisa trabalhar mais.
                </p>
              </div>
              <div className="flex flex-wrap gap-4">
                {[
                  { label: "Mais controle.", icon: "🎛️" },
                  { label: "Mais conhecimento.", icon: "📚" },
                  { label: "Mais acompanhamento.", icon: "🤝" },
                  { label: "Mais previsibilidade.", icon: "🔮" },
                  { label: "Mais resultado.", icon: "🏆" }
                ].map((item, idx) => (
                  <div key={idx} className="p-3.5 rounded-xl bg-black/40 border border-white/5 flex items-center gap-2.5 shrink-0">
                    <span className="text-lg">{item.icon}</span>
                    <span className="text-xs font-bold text-zinc-300">{item.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* O Método Bananal PRO */}
          <div className="space-y-12">
            <div className="text-center max-w-2xl mx-auto space-y-3">
              <span className="text-secondary font-bold uppercase tracking-widest text-xs font-inter block">A Metodologia</span>
              <h2 className="font-headline text-2xl md:text-4xl font-extrabold text-white">
                O Método Bananal PRO
              </h2>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              {[
                { 
                  title: "🍌 Conhecimento Aplicado ao Campo", 
                  desc: "Aprenda exatamente o que fazer, quando fazer e por que fazer. Sem teoria desnecessária. Apenas o que realmente impacta produtividade, qualidade e rentabilidade.", 
                  icon: "field" 
                },
                { 
                  title: "📊 Gestão e Controle da Propriedade", 
                  desc: "Acompanhe indicadores, organize atividades, monitore custos e tome decisões baseadas em dados reais da sua operação.", 
                  icon: "dashboard" 
                },
                { 
                  title: "👨‍🌾 Suporte e Acompanhamento Contínuo", 
                  desc: "Não enfrente os desafios da produção sozinho. Tenha acesso a especialistas, conteúdos atualizados e uma comunidade formada por produtores que vivem os mesmos desafios que você.", 
                  icon: "group" 
                }
              ].map((pillar, idx) => (
                <div key={idx} className="p-8 rounded-[2rem] bg-zinc-900/40 border border-outline-variant/10 hover:border-secondary/30 transition-all duration-300 flex flex-col justify-between space-y-6">
                  <div className="space-y-4">
                    <h4 className="font-headline font-bold text-base text-white">{pillar.title}</h4>
                    <p className="text-xs text-zinc-400 font-sans leading-relaxed">{pillar.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </section>

        {/* O QUE VOCÊ RECEBE (Value Stack Grid) SECTION */}
        <section className="py-24 bg-slate-50 text-zinc-900 border-y border-zinc-200/50 relative z-10">
          <div className="max-w-7xl mx-auto px-6 space-y-16">
            <div className="text-center max-w-4xl mx-auto space-y-6">
              <span className="text-secondary font-bold uppercase tracking-widest text-xs font-inter block">O Ecossistema</span>
              <h2 className="font-headline text-3xl md:text-5xl font-extrabold tracking-tight text-zinc-950 leading-tight">
                Um ambiente criado para eliminar os gargalos que travam o crescimento de milhares de produtores todos os anos.
              </h2>
              <div className="max-w-3xl mx-auto space-y-4">
                <p className="font-headline text-lg font-extrabold text-secondary">
                  E o melhor: Você não precisa descobrir tudo sozinho.
                </p>
                <p className="text-zinc-600 font-sans text-sm md:text-base leading-relaxed">
                  Ao entrar hoje, terá acesso imediato a um conjunto de recursos que foram desenvolvidos para ajudar você a produzir melhor, reduzir custos e tomar decisões mais inteligentes.
                </p>
                <p className="font-headline text-sm font-extrabold tracking-widest text-zinc-800 uppercase pt-2">
                  Veja Tudo o Que Está Incluído no Seu Acesso
                </p>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {[
                { title: "Plataforma completa", desc: "Painel integrado com todos os módulos agrícolas.", icon: <Layers size={20} /> },
                { title: "Treinamentos avançados", desc: "Cursos práticos do manejo da cultura ao pós-colheita.", icon: <Award size={20} /> },
                { title: "Comunidade exclusiva", desc: "Fórum e chat de produtores para troca de cotações e dicas.", icon: <Users size={20} /> },
                { title: "Biblioteca técnica", desc: "Modelos de fichas, planilhas e laudos agronômicos práticos.", icon: <FileText size={20} /> },
                { title: "Análise de solo", desc: "Cálculos rápidos de necessidade de calagem e gessagem.", icon: <BarChart3 size={20} /> },
                { title: "Gestão financeira", desc: "Controle simples de receitas, despesas e margem operacional.", icon: <TrendingUp size={20} /> },
                { title: "Controle de estoque", desc: "Gestão de NPK e defensivos com alertas de validade.", icon: <Package size={20} /> },
                { title: "Calendário agrícola", desc: "Cronograma dinâmico de adubação, irrigação e colheita.", icon: <Calendar size={20} /> },
                { title: "Clima e previsões", desc: "Boletins agroclimáticos locais para programar pulverizações.", icon: <Sun size={20} /> },
                { title: "Lives e mentorias", desc: "Encontros online com especialistas e agrônomos parceiros.", icon: <Video size={20} /> },
                { title: "Diagnóstico técnico", desc: "Auxílio visual na identificação de deficiências e pragas.", icon: <Database size={20} /> },
                { title: "Suporte especializado", desc: "Atendimento direto com agrônomos na plataforma.", icon: <ShieldCheck size={20} /> }
              ].map((item, i) => (
                <div 
                  key={i}
                  className="p-6 rounded-[2rem] bg-white border border-zinc-200 hover:border-secondary/40 transition-all group hover:bg-zinc-50/50 cursor-pointer shadow-sm hover:shadow-md"
                >
                  <div className="w-10 h-10 rounded-xl bg-secondary/10 flex items-center justify-center border border-secondary/20 transition-colors group-hover:bg-secondary/20 mb-4 text-secondary">
                    {item.icon}
                  </div>
                  <h3 className="font-headline font-bold text-sm text-zinc-900 mb-2 flex items-center gap-1.5">
                    <CheckCircle2 size={14} className="text-secondary shrink-0" />
                    {item.title}
                  </h3>
                  <p className="text-xs font-sans text-zinc-600 leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FUTURO SECTION (Two Paths Comparison) */}
        <section className="py-24 bg-[#03150d] text-white border-y border-outline-variant/10 relative overflow-hidden">
          {/* Volumetric Lights */}
          <div className="absolute top-[30%] left-[-10%] w-[40%] aspect-square rounded-full bg-secondary/5 blur-[120px] pointer-events-none" />
          <div className="absolute bottom-[20%] right-[-10%] w-[40%] aspect-square rounded-full bg-red-500/5 blur-[120px] pointer-events-none" />

          <div className="max-w-6xl mx-auto px-6 space-y-16 relative z-10">
            
            {/* Header */}
            <div className="text-center max-w-4xl mx-auto space-y-6">
              <span className="text-secondary-fixed font-bold uppercase tracking-widest text-xs font-inter block">O Próximo Ano</span>
              <h2 className="font-headline text-3xl md:text-5xl font-extrabold tracking-tight text-white leading-tight">
                Daqui a Um Ano, Sua Lavoura Não Estará no Mesmo Lugar.
              </h2>
              <div className="max-w-2xl mx-auto p-4 bg-white/5 border border-white/10 rounded-2xl">
                <p className="font-headline text-lg md:text-xl font-bold text-secondary-fixed leading-relaxed">
                  A única questão é: Ela estará melhor ou pior do que está hoje?
                </p>
              </div>
            </div>

            {/* Narrative Context */}
            <div className="grid md:grid-cols-2 gap-8 text-sm md:text-base text-zinc-300 font-sans leading-relaxed max-w-4xl mx-auto pt-4 border-t border-white/5">
              <div className="space-y-4">
                <p>
                  Porque o tempo vai passar de qualquer forma. A próxima adubação vai acontecer. A próxima safra vai chegar.
                </p>
                <p>
                  Novos desafios vão surgir. Novas decisões precisarão ser tomadas.
                </p>
              </div>
              <div className="space-y-4 md:border-l md:border-white/10 md:pl-8">
                <p className="font-semibold text-white">
                  E a diferença entre crescer ou continuar enfrentando os mesmos problemas quase nunca está no esforço.
                </p>
                <p className="text-secondary-fixed font-bold">
                  Está nas decisões tomadas ao longo do caminho.
                </p>
              </div>
            </div>

            {/* Comparison Cards */}
            <div className="grid md:grid-cols-2 gap-8 pt-8 items-stretch max-w-5xl mx-auto">
              
              {/* Path 1: Estagnado */}
              <div className="p-8 rounded-[2.5rem] bg-zinc-950/60 border border-red-500/20 flex flex-col justify-between space-y-6 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-24 h-24 bg-red-500/5 blur-[50px] rounded-full" />
                
                <div className="space-y-6">
                  <div className="space-y-2">
                    <span className="bg-red-500/10 text-red-400 border border-red-500/20 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest font-inter inline-block">
                      Caminho 1: Sem Mudança
                    </span>
                    <h3 className="font-headline text-xl font-bold text-white leading-tight">
                      Talvez daqui a 12 meses você continue enfrentando as mesmas dúvidas que enfrenta hoje:
                    </h3>
                  </div>

                  <ul className="space-y-3.5 text-xs text-zinc-400 font-sans">
                    {[
                      "Sem saber exatamente onde estão os gargalos da produção.",
                      "Sem clareza sobre seus custos reais.",
                      "Sem um planejamento estruturado para a propriedade.",
                      "Apagando incêndios todos os dias e tentando resolver problemas conforme eles aparecem."
                    ].map((item, i) => (
                      <li key={i} className="flex gap-2.5 items-start">
                        <XCircle className="text-red-500 shrink-0 mt-0.5" size={14} />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Path 2: Evolução */}
              <div className="p-8 rounded-[2.5rem] bg-secondary-container/10 border border-secondary/40 flex flex-col justify-between space-y-6 relative overflow-hidden shadow-xl shadow-secondary/5 group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-secondary/15 blur-[60px] rounded-full" />
                
                <div className="space-y-6">
                  <div className="space-y-2">
                    <span className="bg-secondary/20 text-secondary-fixed border border-secondary/30 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest font-inter inline-block">
                      Caminho 2: Controle
                    </span>
                    <h3 className="font-headline text-xl font-bold text-white leading-tight">
                      Ou talvez daqui a 12 meses você olhe para trás e perceba que finalmente assumiu o controle da sua operação:
                    </h3>
                  </div>

                  <ul className="space-y-3 text-xs text-zinc-300 font-sans">
                    {[
                      "Que passou a tomar decisões com mais segurança.",
                      "Que reduziu desperdícios.",
                      "Que organizou melhor sua produção.",
                      "Que evoluiu tecnicamente.",
                      "Que deixou de depender da tentativa e erro.",
                      "E que começou a construir uma propriedade mais eficiente, mais previsível e mais lucrativa."
                    ].map((item, i) => (
                      <li key={i} className="flex gap-2.5 items-start">
                        <CheckCircle2 className="text-secondary shrink-0 mt-0.5" size={14} />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

            </div>

            {/* Bottom Callout */}
            <div className="text-center max-w-2xl mx-auto space-y-6 pt-8 border-t border-white/5">
              <p className="text-base md:text-lg font-sans text-zinc-300">
                A verdade é que nenhuma transformação acontece por acaso.
              </p>
              <p className="font-headline text-xl md:text-2xl font-extrabold text-white leading-relaxed">
                Ela começa no momento em que você decide fazer algo diferente.
              </p>
              <p className="text-secondary-fixed font-bold text-sm tracking-wide uppercase font-inter">
                ✨ E é exatamente por isso que queremos fazer um convite especial para você hoje.
              </p>
            </div>

          </div>
        </section>

        {/* OFERTA (Value Stack & Pricing Card) SECTION */}
        <section className="py-24 bg-white text-zinc-900 border-y border-zinc-200/50 relative z-10" id="oferta-pricing">
          
          <div className="max-w-7xl mx-auto px-6 space-y-16 relative z-10">
            <div className="text-center max-w-3xl mx-auto space-y-4">
              <span className="text-secondary font-bold uppercase tracking-widest text-xs font-inter block">Oportunidade Única</span>
              <h2 className="font-headline text-3xl md:text-5xl font-extrabold tracking-tight text-zinc-950 leading-tight">
                OFERTA FUNDADOR
              </h2>
              <p className="text-zinc-600 font-sans text-sm md:text-base leading-relaxed">
                Estamos abrindo as portas do Bananal PRO para os primeiros membros da comunidade. Esta condição especial não será disponibilizada novamente.
              </p>
            </div>

            <div className="grid lg:grid-cols-12 gap-12 items-stretch max-w-5xl mx-auto">
              
              {/* Value Stack Breakdown */}
              <div className="lg:col-span-6 bg-zinc-50 border border-zinc-200 rounded-[2.5rem] p-8 flex flex-col justify-between shadow-sm">
                <div>
                  <h4 className="font-headline font-bold text-sm text-zinc-500 uppercase tracking-wider mb-6 border-b border-zinc-200 pb-3">
                    O que você levaria pelo valor regular:
                  </h4>
                  <ul className="space-y-4 font-sans text-xs">
                    {[
                      { name: "Treinamentos completos", price: "R$ 297" },
                      { name: "Comunidade exclusiva", price: "R$ 197" },
                      { name: "Lives e mentorias", price: "R$ 297" },
                      { name: "Biblioteca técnica", price: "R$ 197" },
                      { name: "Ferramentas agrícolas", price: "R$ 497" },
                      { name: "Gestão financeira", desc: "", price: "R$ 297" },
                      { name: "Análise de solo", price: "R$ 297" }
                    ].map((item, i) => (
                      <li key={i} className="flex justify-between items-center text-zinc-700">
                        <span className="flex items-center gap-2">
                          <CheckCircle2 size={12} className="text-secondary shrink-0" />
                          {item.name}
                        </span>
                        <span className="font-mono text-zinc-500 font-medium">{item.price}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="mt-8 pt-4 border-t border-zinc-200 flex justify-between items-end">
                  <div>
                    <p className="text-[10px] text-zinc-400 uppercase tracking-widest font-black">Valor total acumulado</p>
                    <p className="text-2xl font-headline font-extrabold text-zinc-400 line-through mt-0.5">R$ 2.079</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] text-secondary uppercase tracking-widest font-black font-semibold">Seu desconto fundador</p>
                    <p className="text-sm font-bold text-secondary">- R$ 1.732 economizados</p>
                  </div>
                </div>
              </div>

              {/* Real Pricing Box */}
              <div className="lg:col-span-6 bg-white border-2 border-secondary rounded-[2.5rem] p-8 flex flex-col justify-between relative overflow-hidden shadow-xl shadow-secondary/5">
                <div className="absolute top-0 right-0 bg-secondary text-white text-[8px] font-black uppercase tracking-widest px-4 py-1.5 rounded-bl-2xl">
                  Poucas Vagas
                </div>
                
                <div className="space-y-6">
                  <div className="space-y-2">
                    <p className="text-[10px] text-zinc-400 uppercase tracking-widest font-bold">Acesso Completo de 1 Ano</p>
                    <div className="flex items-center gap-3">
                      <span className="text-zinc-400 font-bold line-through text-sm">De R$ 897/ano</span>
                      <span className="bg-secondary/10 text-secondary border border-secondary/20 px-2 py-0.5 rounded text-[9px] font-black uppercase">Desconto Especial</span>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <p className="text-xs text-zinc-500">Por Apenas:</p>
                    <div className="flex items-baseline gap-2">
                      <span className="text-5xl font-headline font-black text-zinc-900">R$ 347</span>
                      <span className="text-zinc-500 text-sm">/ano</span>
                    </div>
                    <p className="text-xs text-zinc-500 mt-1">ou em até</p>
                    <p className="text-2xl font-headline font-extrabold text-secondary">
                      12x de R$ 34,70
                    </p>
                  </div>

                  {/* Micro Cost justification */}
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-zinc-50 border border-zinc-200 text-zinc-700 font-medium text-[10px] tracking-wide">
                    💰 Menos de um café por dia.
                  </div>
                </div>

                <div className="space-y-4 mt-8">
                  <Link
                    to="/auth/register"
                    className="w-full bg-secondary hover:bg-secondary-fixed text-white hover:text-primary-container py-4.5 rounded-2xl font-headline font-extrabold text-xs tracking-wider uppercase transition-all duration-300 shadow-xl shadow-secondary/15 hover:scale-[1.02] active:scale-95 block text-center cursor-pointer border-glow"
                  >
                    Quero Garantir Meu Acesso Fundador
                  </Link>

                  <p className="text-[9.5px] text-zinc-500 leading-relaxed font-sans mt-2">
                    ⚠️ Esta oferta de lançamento é por tempo limitado e exclusiva para quem fechar primeiro. Quando estas poucas vagas terminarem, o lote será encerrado e o valor será reajustado.
                  </p>
                </div>

              </div>

            </div>
          </div>
        </section>

        {/* GARANTIA SECTION */}
        <section className="py-24 max-w-4xl mx-auto px-6 text-center space-y-8">
          <div className="w-20 h-20 rounded-full bg-secondary/10 border-glow flex items-center justify-center mx-auto text-secondary-fixed shadow-2xl">
            <ShieldCheck size={40} />
          </div>
          
          <div className="space-y-4">
            <span className="text-secondary-fixed font-bold uppercase tracking-widest text-xs font-inter block">Compromisso Bananal PRO</span>
            <h2 className="font-headline text-3xl md:text-4xl font-extrabold tracking-tight text-white">
              Sua Satisfação Garantida ou Seu Dinheiro de Volta
            </h2>
          </div>

          <p className="text-zinc-300 font-sans text-sm md:text-base leading-relaxed max-w-2xl mx-auto text-balance">
            Você entra hoje. Explora toda a plataforma. Participa da comunidade. Assiste aos treinamentos. E se concluir que o Bananal PRO não entrega valor para sua propriedade, basta solicitar o cancelamento dentro do prazo de garantia de 7 dias. Risco zero.
          </p>
        </section>

        {/* CTA FINAL SECTION */}
        <section className="py-24 bg-gradient-to-t from-black to-[#052014] border-t border-outline-variant/10 text-center relative overflow-hidden">
          
          <div className="max-w-4xl mx-auto px-6 space-y-10 relative z-10">
            <h2 className="font-headline text-3xl md:text-5xl font-extrabold leading-tight text-white max-w-3xl mx-auto">
              Sua próxima safra começa agora.
            </h2>
            
            <p className="text-sm md:text-base text-zinc-400 max-w-2xl mx-auto leading-relaxed text-balance">
              Você pode continuar fazendo tudo da mesma forma e obtendo os mesmos resultados. Ou pode entrar para o Bananal PRO e fazer parte dos produtores que estão construindo uma nova forma de gerir a bananicultura.
            </p>
            
            <div className="pt-4">
              <Link
                to="/auth/register"
                className="bg-secondary hover:bg-secondary-fixed text-white hover:text-primary-container px-12 py-5 rounded-2xl font-headline font-extrabold text-sm tracking-wider uppercase transition-all duration-300 shadow-2xl shadow-secondary/20 hover:scale-[1.02] active:scale-95 inline-block text-center cursor-pointer border-glow"
              >
                Quero Garantir Meu Acesso Fundador Agora
              </Link>
            </div>

            {/* Micro badges below CTA */}
            <div className="flex flex-wrap items-center justify-center gap-6 text-zinc-500 font-inter text-[10px] uppercase tracking-widest pt-6 font-bold border-t border-white/5">
              <span className="flex items-center gap-1.5"><Lock size={12} /> Compra 100% Segura</span>
              <span>•</span>
              <span className="flex items-center gap-1.5"><ShieldCheck size={12} /> Garantia de Satisfação</span>
              <span>•</span>
              <span>Acesso imediato enviado por e-mail</span>
            </div>
          </div>
        </section>

      </div>
    </div>
  );
}
