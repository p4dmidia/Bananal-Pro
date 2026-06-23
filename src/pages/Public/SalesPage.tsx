import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Zap,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
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
  Lock,
  Sprout,
  Droplet,
  Shield,
  X,
  AlertCircle
} from "lucide-react";
import logoImg from "../../assets/logo.png";
import salesHeroImg from "../../assets/sales-hero.jpg";
import videoCoverImg from "../../assets/video-cover.jpg";

export default function SalesPage() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  useEffect(() => {
    document.body.classList.add("dark-theme");
    return () => {
      document.body.classList.remove("dark-theme");
    };
  }, []);

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
                  Quero Garantir Meu Acesso Fundador Agora!
                  <ArrowRight size={20} />
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* VSL (Video Sales Letter) SECTION */}
        <section className="py-12 md:py-16 bg-surface-container/20 border-y border-outline-variant/10 relative">
          <div className="max-w-4xl mx-auto px-6 text-center space-y-8">

            <div className="space-y-4 max-w-3xl mx-auto">
              <h2 className="font-headline text-3xl md:text-4xl font-extrabold text-white leading-tight">
                Descubra o método de 3 etapas que está ajudando bananicultores a aumentar o peso do cacho e a margem de lucro por hectare.
              </h2>
              <p className="font-sans text-base md:text-lg text-zinc-350 leading-relaxed">
                Nos próximos minutos, você vai descobrir como produtores estão deixando de depender de informações soltas e passando a administrar suas lavouras com método, acompanhamento técnico e ferramentas práticas para <span className="text-secondary-fixed font-bold">aumentar a produtividade e o lucro</span>.
              </p>
              <p className="font-sans text-base md:text-lg text-zinc-350 leading-relaxed">
                O Bananal PRO não é apenas mais um curso. É o próximo passo para quem quer <span className="text-secondary-fixed font-bold">produzir melhor, gastar menos e tomar decisões com mais segurança</span>.
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
            <div className="pt-4">
              <a
                href="#oferta-pricing"
                onClick={scrollToOffer}
                className="bg-secondary hover:bg-secondary-fixed text-white hover:text-primary-container px-10 py-5 rounded-2xl font-headline font-extrabold text-base tracking-wide transition-all border-glow duration-300 shadow-2xl shadow-secondary/30 hover:scale-[1.03] active:scale-95 inline-flex items-center gap-3 cursor-pointer uppercase"
              >
                Quero Garantir Meu Acesso Fundador Agora!
                <ArrowRight size={20} />
              </a>
            </div>
            {/* Subtext call to action below video */}
            <p className="text-xs text-zinc-500 font-inter">
              ATENÇÃO: Essa condição especial ficará disponível por tempo limitado e poderá ser encerrada sem aviso prévio após o fechamento desta campanha.
            </p>
          </div>
        </section>

        {/* QUEBRA DE CRENÇAS / DIAGNÓSTICO DA REALIDADE */}
        <section className="py-12 md:py-16 bg-white text-zinc-900 border-y border-zinc-200/50 relative z-10">
          <div className="max-w-3xl mx-auto px-6 space-y-10">

            {/* Header / Intro */}
            <div className="text-center space-y-3">
              <h2 className="font-headline text-4xl md:text-5xl font-black tracking-tight text-zinc-950 leading-tight">
                A Verdade Que Poucos Produtores Gostam de Admitir
              </h2>
            </div>

            {/* Stacked layout: Trabalho duro under/above Realidade Financeira */}
            <div className="space-y-8 relative z-10 text-zinc-900">

              {/* Part 1: Você trabalha duro */}
              <div className="space-y-4">
                <h3 className="font-headline text-3xl md:text-4xl font-black text-zinc-950">Você trabalha duro.</h3>
                <p className="text-xl md:text-2xl text-zinc-650 leading-relaxed font-sans">
                  Você <span className="text-green-700 font-semibold">investe em adubo</span>, <span className="text-green-700 font-semibold">investe em irrigação</span>, <span className="text-green-700 font-semibold">investe em defensivos</span>, <span className="text-green-700 font-semibold">investe em mão de obra</span> e passa o ano inteiro cuidando da lavoura.
                </p>
              </div>

              {/* Horizontal Divider */}
              <div className="h-px bg-zinc-200 w-full relative z-10" />

              {/* Part 2: Mas quando chega... */}
              <div className="space-y-4">
                <div className="flex flex-col items-start gap-3">
                  <div className="inline-flex items-center gap-1.5 bg-red-50 border border-red-100/85 px-3.5 py-1.5 rounded-full text-[10px] md:text-xs font-bold text-red-650 uppercase tracking-wider font-inter">
                    <TrendingDown className="text-red-500" size={14} />
                    <span>Mas quando chega o momento de fechar as contas...</span>
                  </div>
                  <h4 className="text-3xl md:text-4xl lg:text-5xl font-headline font-black text-zinc-950 leading-tight">
                    O lucro <span className="underline decoration-red-500 decoration-[3px] md:decoration-[4px] underline-offset-[6px] md:underline-offset-[8px] font-black text-zinc-950">não acompanha o esforço</span>.
                  </h4>
                </div>
                <p className="text-xl md:text-2xl text-zinc-600 leading-relaxed font-sans">
                  E o mais frustrante? Muitas vezes você nem sabe exatamente onde está <span className="text-red-600 font-bold">perdendo dinheiro</span>.
                </p>
              </div>
            </div>

            {/* Sub-section: Os Gargalos Silenciosos (Linearized and Cleaned) */}
            <div className="space-y-8 pt-8 border-t border-zinc-200">
              <div className="text-center space-y-2">
                <h3 className="font-headline text-3xl font-black text-zinc-900">Os Gargalos Silenciosos</h3>
                <p className="text-sm text-zinc-500">Os vazamentos de lucro acontecem de forma sutil</p>
              </div>

              <ul className="space-y-6 max-w-2xl mx-auto">
                {[
                  { title: "Terra produzindo menos do que deveria", desc: "" },
                  { title: "Dinheiro jogado na terra", desc: "" },
                  { title: "Fome oculta do bananal", desc: "" },
                  { title: "Atraso que custa a safra", desc: "" }
                ].map((item, index) => (
                  <li key={index} className="flex gap-4 items-start pb-4 border-b border-zinc-100 last:border-0 last:pb-0">
                    <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center shrink-0 border border-amber-500/20 text-amber-600 font-bold mt-1">
                      <HelpCircle size={18} />
                    </div>
                    <div>
                      <h4 className="font-headline font-black text-xl text-zinc-900">{item.title}</h4>
                      <p className="text-base md:text-lg text-zinc-600 font-sans mt-1.5 leading-relaxed">
                        {index === 0 ? (
                          <>Sua área tem potencial para dar cachos maiores e mais pesados, mas está <span className="text-red-600 font-semibold">travada por detalhes invisíveis</span>.</>
                        ) : index === 1 ? (
                          <>Adubo aplicado no momento errado ou na quantidade errada evapora ou é levado pela chuva. É <span className="text-red-600 font-semibold">dinheiro do seu bolso indo embora</span>.</>
                        ) : index === 2 ? (
                          <>Carências de micronutrientes <span className="text-red-600 font-semibold">travam o crescimento do cacho</span> antes mesmo que as folhas comecem a amarelar.</>
                        ) : (
                          <>Uma aplicação feita com 3 dias de atraso ou uma praga detectada tarde demais pode <span className="text-red-600 font-semibold">comprometer o rendimento do ano inteiro</span>.</>
                        )}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            {/* Sub-section: Custos Crescentes (Clean text flow) */}
            <div className="space-y-6 pt-8 border-t border-zinc-200">
              <div className="space-y-2">
                <h3 className="font-headline text-3xl font-black text-zinc-950 leading-tight">
                  E enquanto isso acontece, os custos continuam aumentando.
                </h3>
              </div>

              <ul className="space-y-3 max-w-2xl mx-auto">
                {[
                  { label: <>O preço dos <span className="font-semibold text-zinc-950">fertilizantes sobe</span>.</>, icon: <TrendingUp size={18} className="text-red-600" /> },
                  { label: <>O custo da <span className="font-semibold text-zinc-950">mão de obra aumenta</span>.</>, icon: <Users size={18} className="text-red-600" /> },
                  { label: <>Os <span className="font-semibold text-zinc-950">defensivos ficam mais caros</span>.</>, icon: <AlertCircle size={18} className="text-red-600" /> },
                  { label: "E cada erro custa mais caro do que custava no ano passado.", icon: <AlertTriangle size={18} className="text-red-600" />, highlight: true }
                ].map((item, index) => (
                  <li key={index} className="flex gap-3 items-center py-2.5 border-b border-zinc-100 last:border-b-0">
                    <span className="shrink-0">{item.icon}</span>
                    <p className={`text-base md:text-lg font-sans leading-relaxed ${item.highlight ? 'text-red-600 font-black' : 'text-zinc-700 font-medium'}`}>{item.label}</p>
                  </li>
                ))}
              </ul>
            </div>

          </div>
        </section>

        {/* AGITAÇÃO / REALIDADE DO PRODUTOR */}
        <section className="py-12 md:py-16 bg-[#052014] border-y border-outline-variant/10 relative">
          {/* Volumetric ambient light */}
          <div className="absolute top-[20%] left-[-10%] w-[40%] aspect-square rounded-full bg-red-500/5 blur-[120px] pointer-events-none" />

          <div className="max-w-2xl mx-auto px-6 space-y-10 relative z-10 text-white">

            {/* Header */}
            <div className="space-y-4">
              <h2 className="font-headline text-3xl md:text-4xl font-black tracking-tight leading-tight">
                A realidade é que muitos produtores passam meses trabalhando sem saber exatamente:
              </h2>
            </div>

            {/* List of 5 items with X (Linearized and Cleaned) */}
            <ul className="space-y-6 max-w-2xl mx-auto">
              {[
                { title: "Custo por hectare", text: <>Qual o <span className="text-red-400 font-semibold">custo real de produção</span> por hectare.</>, icon: <X size={16} className="text-red-500" /> },
                { title: "Desperdícios invisíveis", text: <>Onde estão os <span className="text-red-400 font-semibold">maiores desperdícios</span> da propriedade.</>, icon: <X size={16} className="text-red-500" /> },
                { title: "Manejos eficientes", text: <>Quais manejos realmente <span className="text-secondary-fixed font-semibold">aumentam a produtividade</span>.</>, icon: <X size={16} className="text-red-500" /> },
                { title: "Decisões prejudiciais", text: <>Quais decisões estão <span className="text-red-400 font-semibold">reduzindo seus resultados</span>.</>, icon: <X size={16} className="text-red-500" /> },
                { title: "Correções urgentes", text: <>O que <span className="text-red-400 font-semibold">precisa ser corrigido</span> antes da próxima safra.</>, icon: <X size={16} className="text-red-500" /> }
              ].map((item, index) => (
                <li key={index} className="flex gap-4 items-start pb-4 border-b border-outline-variant/10 last:border-0 last:pb-0">
                  <div className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center border border-red-500/20 shrink-0 mt-1">
                    {item.icon}
                  </div>
                  <div>
                    <h4 className="font-headline font-black text-lg md:text-xl text-white">{item.title}</h4>
                    <p className="text-base md:text-lg text-zinc-300 font-sans mt-1.5 leading-relaxed">{item.text}</p>
                  </div>
                </li>
              ))}

              <li className="pt-6 border-t border-outline-variant/20 flex gap-4 items-start">
                <span className="text-2xl shrink-0"><AlertTriangle className="text-red-500" size={24} /></span>
                <div>
                  <h4 className="font-headline font-black text-lg md:text-xl text-red-400">Margem sob risco</h4>
                  <p className="text-base md:text-lg text-zinc-300 font-sans mt-1.5 leading-relaxed">Trabalhar sem essas respostas é jogar com a sorte a cada safra.</p>
                </div>
              </li>
            </ul>

            {/* Timeline: E quando os problemas aparecem... (Linearized and Cleaned) */}
            <div className="space-y-6 pt-8 border-t border-outline-variant/10">
              <div className="space-y-2">
                <h3 className="font-headline text-2xl md:text-3xl font-black text-white">E quando os problemas aparecem...</h3>
                <p className="text-base text-zinc-400">Normalmente já é tarde demais.</p>
              </div>

              <ul className="space-y-4 max-w-2xl mx-auto">
                {[
                  { text: <>A planta já <span className="text-red-400 font-semibold">perdeu potencial</span>.</>, icon: "01" },
                  { text: <>A produtividade já foi <span className="text-red-400 font-semibold">comprometida</span>.</>, icon: "02" },
                  { text: <>O <span className="text-red-400 font-semibold">dinheiro já foi gasto</span>.</>, icon: "03" },
                  { text: <>O <span className="text-red-400 font-black">prejuízo já aconteceu</span>.</>, icon: "04", highlight: true }
                ].map((item, index) => (
                  <li key={index} className="flex items-start gap-4 py-3 border-b border-outline-variant/10 last:border-b-0">
                    <span className="text-lg font-bold font-mono text-zinc-500 shrink-0 mt-1">{item.icon}</span>
                    <div>
                      <p className={`text-base md:text-lg font-sans leading-relaxed ${item.highlight ? 'text-red-400 font-extrabold' : 'text-zinc-200 font-semibold'}`}>{item.text}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            {/* Final Agitation Callout: A pergunta é... (Simplified style) */}
            <div className="pt-8 border-t border-outline-variant/10 text-center max-w-2xl mx-auto space-y-4">
              <p className="text-xl text-zinc-300 font-sans">
                A pergunta é:
              </p>
              <h3 className="font-headline text-3xl md:text-4xl font-black text-white leading-tight">
                Quanto custa repetir os mesmos erros por mais uma safra?
              </h3>
            </div>

          </div>
        </section>

        {/* APRESENTAÇÃO DA SOLUÇÃO (The Solution) SECTION */}
        <section className="py-12 md:py-16 bg-[#052014] text-white relative">
          <div className="max-w-2xl mx-auto px-6 space-y-8">

            {/* Header & Imagine Block */}
            <div className="space-y-8">
              <div className="space-y-4">

                <h2 className="font-headline text-3xl md:text-4xl font-black tracking-tight leading-tight">
                  Existe Uma Forma Melhor de Produzir.
                </h2>
                <p className="text-lg md:text-xl text-zinc-300 font-sans leading-relaxed">
                  Imagine gerenciar sua produção com total segurança, sabendo exatamente o que fazer em cada etapa.
                </p>
              </div>

              {/* Imagine List instead of Grid */}
              <ul className="space-y-6 max-w-2xl mx-auto">
                {[
                  { title: "Clareza Total", desc: <>Imagine ter <span className="text-secondary-fixed font-bold">clareza sobre o que está acontecendo</span> na sua propriedade.</>, icon: <CheckCircle2 className="text-secondary-fixed" size={20} /> },
                  { title: "Decisões Direcionadas", desc: <>Saber exatamente <span className="text-secondary-fixed font-bold">quais decisões precisam ser tomadas</span>.</>, icon: <HelpCircle className="text-secondary-fixed" size={20} /> },
                  { title: "Evolução Segura", desc: <>Acompanhar a <span className="text-secondary-fixed font-bold">evolução da lavoura com confiança</span>.</>, icon: <TrendingUp className="text-secondary-fixed" size={20} /> },
                  { title: "Prevenção Ativa", desc: <>Ter acesso às informações certas <span className="text-secondary-fixed font-bold">antes que os problemas apareçam</span>.</>, icon: <AlertTriangle className="text-secondary-fixed" size={20} /> },
                  { title: "Apoio do Especialista", desc: <>Contar com <span className="text-secondary-fixed font-bold">orientação técnica</span> quando surgir uma dúvida importante.</>, icon: <Users className="text-secondary-fixed" size={20} /> },
                  { title: "Fim do Olhômetro", desc: <>E <span className="text-secondary-fixed font-bold">parar de depender da tentativa e erro</span> para conduzir sua produção.</>, icon: <XCircle className="text-secondary-fixed" size={20} /> }
                ].map((item, idx) => (
                  <li key={idx} className="flex gap-4 items-start pb-4 border-b border-outline-variant/10 last:border-0 last:pb-0">
                    <span className="shrink-0 mt-1">{item.icon}</span>
                    <div>
                      <h4 className="font-headline font-black text-lg md:text-xl text-white">{item.title}</h4>
                      <p className="text-base md:text-lg text-zinc-300 font-sans mt-1 leading-relaxed">{item.desc}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            {/* Creation & Manifesto Block (Clean and text-focused) */}
            <div className="space-y-8 pt-8 border-t border-outline-variant/10">

              {/* Part 1: Foi para isso que criamos... */}
              <div className="space-y-4">
                <h3 className="font-headline text-2xl md:text-3xl font-black text-white leading-tight">
                  Foi para isso que criamos o <span className="text-secondary-fixed font-black">Bananal PRO</span>.
                </h3>
                <p className="text-lg md:text-xl text-zinc-300 font-sans leading-relaxed">
                  O primeiro ecossistema completo que une tecnologia de gestão agrícola, treinamentos práticos de manejo e acompanhamento técnico direto com engenheiros agrônomos na palma da sua mão.
                </p>
              </div>

              {/* Part 2: Nosso Manifesto */}
              <div className="space-y-6 pt-6 border-t border-outline-variant/10">
                <div>
                  <p className="text-xl md:text-2xl font-headline font-black text-white leading-tight">
                    Porque acreditamos que o produtor não precisa trabalhar mais para conquistar:
                  </p>
                </div>
                <ul className="space-y-3 font-sans text-base md:text-lg text-zinc-300 max-w-2xl">
                  {[
                    "Cachos padrão exportação.",
                    "Redução no custo do adubo.",
                    "Gestão financeira sem complicação.",
                    "Suporte direto de agrônomos."
                  ].map((label, idx) => (
                    <li key={idx} className="flex items-center gap-3">
                      <span className="w-2 h-2 rounded-full bg-secondary-fixed shrink-0" />
                      <span className="font-semibold text-zinc-200">{label}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* O Método Bananal PRO (Cleaned) */}
            <div className="space-y-8 pt-8 border-t border-outline-variant/10">
              <div className="space-y-2">
                <h2 className="font-headline text-2xl md:text-3xl font-black text-white">
                  O Método Bananal PRO
                </h2>
              </div>

              <ul className="space-y-6 max-w-2xl mx-auto">
                {[
                  {
                    title: "Conhecimento Aplicado ao Campo",
                    desc: "Aprenda exatamente o que fazer, quando fazer e por que fazer. Sem teoria desnecessária. Apenas o que realmente impacta produtividade, qualidade e rentabilidade.",
                    icon: <FileText className="text-secondary-fixed" size={24} />
                  },
                  {
                    title: "Gestão e Controle da Propriedade",
                    desc: "Acompanhe indicadores, organize atividades, monitore custos e tome decisões baseadas em dados reais da sua operação.",
                    icon: <BarChart3 className="text-secondary-fixed" size={24} />
                  },
                  {
                    title: "Suporte e Acompanhamento Contínuo",
                    desc: "Não enfrente os desafios da produção sozinho. Tenha acesso a especialistas, conteúdos atualizados e uma comunidade formada por produtores que vivem os mesmos desafios que você.",
                    icon: <Users className="text-secondary-fixed" size={24} />
                  }
                ].map((pillar, idx) => (
                  <li key={idx} className="flex gap-4 items-start py-4 border-b border-outline-variant/10 last:border-b-0 last:pb-0">
                    <span className="shrink-0 mt-1">{pillar.icon}</span>
                    <div>
                      <h4 className="font-headline font-black text-lg md:text-xl text-white">Pilar 0{idx + 1}: {pillar.title}</h4>
                      <p className="text-base md:text-lg text-zinc-300 font-sans mt-2 leading-relaxed">{pillar.desc}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

          </div>
        </section>

        {/* O QUE VOCÊ RECEBE (Value Stack Grid) SECTION */}
        <section className="py-12 md:py-16 bg-slate-50 text-zinc-900 border-y border-zinc-200/50 relative z-10">
          <div className="max-w-2xl mx-auto px-6 space-y-8">
            <div className="space-y-4">
              <h2 className="font-headline text-3xl md:text-4xl font-black tracking-tight text-zinc-950 leading-tight">
                Um ambiente criado para eliminar os gargalos que travam o crescimento de milhares de produtores todos os anos.
              </h2>
              <div className="space-y-3">
                <p className="font-headline text-lg md:text-xl font-bold text-secondary">
                  E o melhor: Você não precisa descobrir tudo sozinho.
                </p>
                <p className="text-zinc-650 font-sans text-base md:text-lg leading-relaxed">
                  Ao entrar hoje, terá acesso imediato a um conjunto de recursos que foram desenvolvidos para ajudar você a produzir melhor, reduzir custos e tomar decisões mais inteligentes.
                </p>
                <p className="font-headline text-sm font-extrabold tracking-widest text-zinc-800 uppercase pt-2">
                  Veja Tudo o Que Está Incluído no Seu Acesso
                </p>
              </div>
            </div>

            <ul className="space-y-5 border-t border-zinc-200 pt-6 max-w-2xl mx-auto">
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
                <li key={i} className="flex gap-4 items-start pb-6 border-b border-zinc-200 last:border-b-0 last:pb-0">
                  <div className="text-secondary shrink-0 mt-1">
                    {item.icon}
                  </div>
                  <div>
                    <h3 className="font-headline font-black text-lg md:text-xl text-zinc-900 mb-1 flex items-center gap-1.5">
                      <CheckCircle2 size={18} className="text-secondary shrink-0" />
                      {item.title}
                    </h3>
                    <p className="text-base md:text-lg font-sans text-zinc-700 leading-relaxed">{item.desc}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* FUTURO SECTION (Two Paths Comparison) */}
        <section className="py-12 md:py-16 bg-[#03150d] text-white border-y border-outline-variant/10 relative overflow-hidden">
          {/* Volumetric Lights */}
          <div className="absolute top-[30%] left-[-10%] w-[40%] aspect-square rounded-full bg-secondary/5 blur-[120px] pointer-events-none" />
          <div className="absolute bottom-[20%] right-[-10%] w-[40%] aspect-square rounded-full bg-red-500/5 blur-[120px] pointer-events-none" />

          <div className="max-w-2xl mx-auto px-6 space-y-10 relative z-10">

            {/* Header */}
            <div className="space-y-4">
              <h2 className="font-headline text-4xl md:text-5xl font-black tracking-tight text-white leading-tight">
                Daqui a Um Ano, Sua Lavoura Não Estará no Mesmo Lugar.
              </h2>
              <div className="p-4 bg-white/5 border border-white/10 rounded-2xl">
                <p className="font-headline text-xl md:text-2xl font-bold text-white leading-relaxed">
                  A única questão é: <span className="text-secondary-fixed font-black">Ela estará melhor ou pior do que está hoje?</span>
                </p>
              </div>
            </div>

            {/* Narrative Context */}
            <div className="space-y-3 text-lg md:text-xl text-zinc-300 font-sans leading-relaxed pt-4 border-t border-white/5">
              <p>
                Porque o tempo vai passar de qualquer forma. A próxima adubação vai acontecer. A próxima safra vai chegar.
              </p>
              <p>
                Novos desafios vão surgir. Novas decisões precisarão ser tomadas.
              </p>
              <p className="font-semibold text-white pt-2 border-t border-white/5">
                E a diferença entre crescer ou continuar enfrentando os mesmos problemas quase nunca está no esforço.
              </p>
              <p className="text-zinc-200">
                Está nas <span className="text-secondary-fixed font-black">decisões tomadas</span> ao longo do caminho.
              </p>
            </div>

            {/* Comparison Cards Stacked Vertically (Cleaned) */}
            <div className="space-y-10 pt-8 border-t border-white/10">

              {/* Path 1: Estagnado */}
              <div className="space-y-3">
                <div className="space-y-2">
                  <span className="bg-red-500/10 text-red-400 border border-red-500/20 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest font-inter inline-block">
                    Caminho 1: Sem Mudança
                  </span>
                  <h3 className="font-headline text-2xl font-black text-white leading-tight">
                    Talvez daqui a 12 meses você <span className="text-red-400 font-semibold">continue enfrentando as mesmas dúvidas</span> que enfrenta hoje:
                  </h3>
                </div>

                <ul className="space-y-4 text-base md:text-lg text-zinc-300 font-sans max-w-2xl mx-auto pl-2">
                  {[
                    "Sem saber exatamente onde estão os gargalos da produção.",
                    "Sem clareza sobre seus custos reais.",
                    "Sem um planejamento estruturado para a propriedade.",
                    "Apagando incêndios todos os dias e tentando resolver problemas conforme eles aparecem."
                  ].map((item, i) => (
                    <li key={i} className="flex gap-3 items-start">
                      <XCircle className="text-red-500 shrink-0 mt-1.5" size={18} />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Path 2: Evolução */}
              <div className="pt-8 border-t border-white/5 space-y-3">
                <div className="space-y-2">
                  <span className="bg-secondary/20 text-secondary-fixed border border-secondary/30 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest font-inter inline-block">
                    Caminho 2: Controle
                  </span>
                  <h3 className="font-headline text-2xl font-black text-white leading-tight">
                    Ou talvez daqui a 12 meses você olhe para trás e perceba que finalmente <span className="text-secondary-fixed font-bold">assumiu o controle da sua operação</span>:
                  </h3>
                </div>

                <ul className="space-y-4 text-base md:text-lg text-zinc-200 font-sans max-w-2xl mx-auto pl-2">
                  {[
                    "Que passou a tomar decisões com mais segurança.",
                    "Que reduziu desperdícios.",
                    "Que organizou melhor sua produção.",
                    "Que evoluiu tecnicamente.",
                    "Que deixou de depender da tentativa e erro.",
                    "E que começou a construir uma propriedade mais eficiente, mais previsível e mais lucrativa."
                  ].map((item, i) => (
                    <li key={i} className="flex gap-3 items-start">
                      <CheckCircle2 className="text-secondary shrink-0 mt-1.5" size={18} />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Bottom Callout */}
              <div className="text-center space-y-4 pt-6 border-t border-white/5">
                <p className="text-lg md:text-xl font-sans text-zinc-300 font-medium">
                  A verdade é que nenhuma transformação acontece por acaso.
                </p>
                <p className="font-headline text-xl md:text-2xl font-extrabold text-white leading-relaxed">
                  Ela começa no momento em que você decide fazer algo diferente.
                </p>
                <p className="text-secondary-fixed font-bold text-sm md:text-base tracking-wide uppercase font-inter">
                  E é exatamente por isso que queremos fazer um convite especial para você hoje.
                </p>
              </div>

            </div>
          </div>
        </section>

        {/* OFERTA (Value Stack & Pricing Card) SECTION */}
        <section className="py-12 md:py-16 bg-white text-zinc-900 border-y border-zinc-200/50 relative z-10" id="oferta-pricing">

          <div className="max-w-4xl mx-auto px-6 space-y-10 relative z-10">
            <div className="text-center space-y-4">
              <span className="text-secondary font-bold uppercase tracking-widest text-xs font-inter block">Oportunidade Única</span>
              <h2 className="font-headline text-3xl md:text-5xl font-extrabold tracking-tight text-zinc-950 leading-tight">
                OFERTA FUNDADOR
              </h2>
              <p className="text-zinc-650 font-sans text-base md:text-lg leading-relaxed max-w-xl mx-auto">
                Estamos abrindo as portas do Bananal PRO para os primeiros membros da comunidade. Esta condição especial não será disponibilizada novamente.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8 items-stretch">

              {/* Value Stack Breakdown */}
              <div className="bg-zinc-50 border border-zinc-200 rounded-[2rem] p-6 flex flex-col justify-between shadow-sm">
                <div>
                  <h4 className="font-headline font-bold text-xs text-zinc-500 uppercase tracking-wider mb-6 border-b border-zinc-200 pb-3">
                    O que você levaria pelo valor regular:
                  </h4>
                  <ul className="space-y-4 font-sans text-xs">
                    {[
                      { name: "Treinamentos completos", price: "R$ 297" },
                      { name: "Comunidade exclusiva", price: "R$ 197" },
                      { name: "Lives e mentorias", price: "R$ 297" },
                      { name: "Biblioteca técnica", price: "R$ 197" },
                      { name: "Ferramentas agrícolas", price: "R$ 497" },
                      { name: "Gestão financeira", price: "R$ 297" },
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
                    <p className="text-[9px] text-zinc-400 uppercase tracking-widest font-black">Valor total acumulado</p>
                    <p className="text-xl font-headline font-extrabold text-zinc-400 line-through mt-0.5">R$ 2.079</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[9px] text-secondary uppercase tracking-widest font-semibold">Seu desconto fundador</p>
                    <p className="text-xs font-bold text-secondary">- R$ 1.732 economizados</p>
                  </div>
                </div>
              </div>

              {/* Real Pricing Box */}
              <div className="bg-white border-2 border-secondary rounded-[2rem] p-6 flex flex-col justify-between relative overflow-hidden shadow-xl shadow-secondary/5">
                <div className="absolute top-0 right-0 bg-secondary text-white text-[8px] font-black uppercase tracking-widest px-4 py-1.5 rounded-bl-xl">
                  Poucas Vagas
                </div>

                <div className="space-y-6">
                  <div className="space-y-2">
                    <p className="text-[9px] text-zinc-400 uppercase tracking-widest font-bold">Acesso Completo de 1 Ano</p>
                    <div className="flex items-center gap-3">
                      <span className="text-zinc-400 font-bold line-through text-xs">De R$ 897/ano</span>
                      <span className="bg-secondary/10 text-secondary border border-secondary/20 px-2 py-0.5 rounded text-[8px] font-black uppercase">Desconto Especial</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <p className="text-[10px] text-zinc-500 uppercase tracking-wider font-bold">Por Apenas:</p>
                    <div className="flex items-baseline gap-1.5 leading-none">
                      <span className="text-lg md:text-xl font-headline font-extrabold text-secondary">12x de</span>
                      <span className="text-4xl md:text-5xl font-headline font-black text-secondary">R$ 34,70</span>
                    </div>
                    <p className="text-xs text-zinc-500 font-medium font-sans">
                      ou <span className="font-bold text-zinc-800">R$ 347 à vista</span> por um ano de acesso
                    </p>
                  </div>

                  {/* Micro Cost justification */}
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-zinc-50 border border-zinc-200 text-zinc-700 font-medium text-[9px] tracking-wide">
                    Menos de um café por dia.
                  </div>
                </div>

                <div className="space-y-4 mt-8">
                  <Link
                    to="/auth/register?offer=padrao"
                    className="w-full bg-secondary hover:bg-secondary-fixed text-white hover:text-primary-container py-3.5 rounded-xl font-headline font-extrabold text-xs tracking-wider uppercase transition-all duration-300 shadow-xl shadow-secondary/15 hover:scale-[1.01] active:scale-95 block text-center cursor-pointer border-glow"
                  >
                    Quero Garantir Meu Acesso Fundador Agora!
                  </Link>

                  <p className="text-[10px] text-zinc-500 text-center font-semibold font-sans mt-1">
                    ✓ Acesso imediato • Pagamento 100% seguro • Cancele quando quiser
                  </p>

                  <p className="text-[9px] text-zinc-400 leading-relaxed font-sans mt-2">
                    Esta oferta de lançamento é por tempo limitado e exclusiva para quem fechar primeiro. Quando estas poucas vagas terminarem, o lote será encerrado e o valor será reajustado.
                  </p>
                </div>

              </div>

            </div>
          </div>
        </section>

        {/* GARANTIA SECTION */}
        <section className="py-12 md:py-16 max-w-4xl mx-auto px-6 text-center space-y-6">
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
        <section className="py-12 md:py-16 bg-gradient-to-t from-black to-[#052014] border-t border-outline-variant/10 text-center relative overflow-hidden">

          <div className="max-w-4xl mx-auto px-6 space-y-8 relative z-10">
            <h2 className="font-headline text-3xl md:text-5xl font-extrabold leading-tight text-white max-w-3xl mx-auto">
              Sua próxima safra começa agora.
            </h2>

            <p className="text-sm md:text-base text-zinc-400 max-w-2xl mx-auto leading-relaxed text-balance">
              Você pode continuar fazendo tudo da mesma forma e obtendo os mesmos resultados. Ou pode entrar para o Bananal PRO e fazer parte dos produtores que estão construindo uma nova forma de gerir a bananicultura.
            </p>

            <div className="pt-4">
              <Link
                to="/auth/register?offer=padrao"
                className="bg-secondary hover:bg-secondary-fixed text-white hover:text-primary-container px-12 py-5 rounded-2xl font-headline font-extrabold text-sm tracking-wider uppercase transition-all duration-300 shadow-2xl shadow-secondary/20 hover:scale-[1.02] active:scale-95 inline-block text-center cursor-pointer border-glow"
              >
                Quero Garantir Meu Acesso Fundador Agora!
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
