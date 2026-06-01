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
            
            <div className="space-y-3">
              <h2 className="font-headline text-2xl md:text-3xl font-extrabold text-white">
                Antes de tomar qualquer decisão, assista esta apresentação.
              </h2>
              <p className="font-sans text-sm md:text-base text-zinc-400 max-w-2xl mx-auto leading-relaxed">
                Em poucos minutos você vai entender por que o Bananal PRO é o projeto mais importante que já criamos para produtores de banana.
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
              ⚠️ Assista até o final. Condições especiais reveladas no fechamento da apresentação.
            </p>
          </div>
        </section>

        {/* QUEBRA DE CRENÇAS (Belief Shattering) SECTION */}
        <section className="py-24 bg-white text-zinc-900 border-y border-zinc-200/50 relative z-10">
          <div className="max-w-6xl mx-auto px-6 space-y-16">
            <div className="text-center max-w-3xl mx-auto space-y-4">
              <span className="text-secondary font-bold uppercase tracking-widest text-xs font-inter block">O Grande Obstáculo</span>
              <h2 className="font-headline text-3xl md:text-5xl font-extrabold tracking-tight text-zinc-950 leading-tight">
                A verdade é que informação nunca foi o problema.
              </h2>
              <p className="text-zinc-600 font-sans text-sm md:text-base leading-relaxed">
                Hoje você encontra vídeos no YouTube. Grupos no WhatsApp. Conteúdos espalhados pela internet. Mas mesmo assim a maioria dos produtores continua enfrentando gargalos operacionais diários.
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 pt-4">
              {[
                "Baixa produtividade nas colheitas",
                "Custos de adubação cada vez maiores",
                "Falta de planejamento a médio prazo",
                "Erros recorrentes de manejo cultural",
                "Problemas nutricionais de solo ocultos",
                "Decisões agronômicas tomadas no escuro"
              ].map((problem, i) => (
                <div 
                  key={i}
                  className="p-6 rounded-2xl bg-red-50/60 border border-red-200/50 flex items-start gap-4 transition-all duration-300 hover:border-red-300 hover:bg-red-50"
                >
                  <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center shrink-0 border border-red-200">
                    <XCircle className="text-red-600" size={20} />
                  </div>
                  <div>
                    <h4 className="font-headline font-bold text-sm text-red-800 mt-0.5">Problema Crítico</h4>
                    <p className="text-xs text-zinc-600 font-sans mt-1 leading-relaxed">{problem}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="p-8 rounded-[2rem] bg-zinc-50 border border-zinc-200/80 text-center max-w-3xl mx-auto relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-40 h-40 bg-secondary/5 blur-[80px] rounded-full" />
              <div className="relative z-10 space-y-4">
                <p className="text-base md:text-lg text-zinc-700 font-sans">
                  O problema não é falta de informação.
                </p>
                <h3 className="font-headline text-2xl md:text-3xl font-extrabold text-secondary">
                  O problema é falta de um SISTEMA.
                </h3>
              </div>
            </div>
          </div>
        </section>

        {/* AGITAÇÃO SECTION (Pain Agitation) */}
        <section className="py-24 bg-surface-container/10 border-y border-outline-variant/10 relative">
          <div className="max-w-5xl mx-auto px-6 space-y-16">
            <div className="text-center max-w-3xl mx-auto space-y-4">
              <span className="text-secondary-fixed font-bold uppercase tracking-widest text-xs font-inter block">O Custo da Inação</span>
              <h2 className="font-headline text-3xl md:text-5xl font-extrabold tracking-tight text-white leading-tight">
                Quanto custa continuar administrando sua lavoura apenas na memória?
              </h2>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {[
                { q: "Quanto custa uma adubação mal planejada?", desc: "Desperdiçar sacos de fertilizantes caros e ver a bananeira sofrer por falta ou excesso de NPK." },
                { q: "Quanto custa uma análise de solo mal interpretada?", desc: "Aplicar calcário ou gesso na dose errada, atrasando o desenvolvimento do talhão por meses." },
                { q: "Quanto custa perder produtividade durante uma safra inteira?", desc: "Deixar de colher caixas premium de banana prata ou nanica por falta de manejo sistemático." },
                { q: "Quanto custa não ter suporte quando surge um problema na propriedade?", desc: "Pesquisar soluções genéricas no Google enquanto a Sigatoka ou o Mal do Panamá se espalham." }
              ].map((item, i) => (
                <div 
                  key={i}
                  className="p-8 rounded-3xl dark-glass border border-outline-variant/30 flex gap-5 items-start transition-all hover:scale-[1.01]"
                >
                  <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center shrink-0 border border-amber-500/25">
                    <AlertTriangle className="text-amber-400" size={22} />
                  </div>
                  <div className="space-y-2">
                    <h3 className="font-headline font-bold text-base text-white">{item.q}</h3>
                    <p className="text-xs text-zinc-400 font-sans leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="text-center max-w-2xl mx-auto pt-4">
              <p className="text-base md:text-lg font-headline font-bold text-zinc-300">
                Um único erro pode custar <span className="text-red-400 font-extrabold">muito mais</span> do que o valor investido no Bananal PRO.
              </p>
            </div>
          </div>
        </section>

        {/* APRESENTAÇÃO DA SOLUÇÃO (The Solution) SECTION */}
        <section className="py-24 max-w-5xl mx-auto px-6 space-y-16">
          <div className="grid lg:grid-cols-12 gap-16 items-center">
            
            {/* Left side text copy */}
            <div className="lg:col-span-6 space-y-8 text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-secondary-container/20 border border-secondary/30">
                <span className="w-1.5 h-1.5 rounded-full bg-secondary-fixed animate-pulse"></span>
                <span className="text-[10px] font-bold tracking-widest text-secondary-fixed uppercase font-inter">
                  O Novo Caminho
                </span>
              </div>
              <h2 className="font-headline text-3xl md:text-5xl font-extrabold tracking-tight text-white leading-tight">
                Foi por isso que criamos o Bananal PRO.
              </h2>
              <div className="space-y-4 font-sans text-sm md:text-base text-zinc-300 leading-relaxed">
                <p className="font-bold text-white">
                  Não é apenas um curso. Não é apenas uma comunidade. Não é apenas um software.
                </p>
                <p>
                  É o primeiro ecossistema completo criado exclusivamente para produtores de banana.
                </p>
                <p className="text-secondary-fixed font-semibold">
                  Um ambiente onde você encontra conhecimento, ferramentas, suporte e acompanhamento em um único lugar.
                </p>
              </div>
            </div>

            {/* Right side visual representation */}
            <div className="lg:col-span-6 relative flex justify-center">
              <div className="absolute inset-0 bg-secondary/5 rounded-[2.5rem] blur-[80px] -z-10" />
              
              <div className="w-full max-w-[420px] dark-glass rounded-[2.5rem] p-6 border border-outline-variant/30 space-y-6">
                <div className="flex items-center gap-3 pb-4 border-b border-outline-variant/20">
                  <span className="material-symbols-outlined text-secondary-fixed text-2xl">eco</span>
                  <h4 className="font-headline font-bold text-sm text-white uppercase tracking-wider">A Tríade Bananal PRO</h4>
                </div>
                
                {[
                  { title: "Educação Técnica de Elite", desc: "Trilhas de aprendizagem do plantio à colheita.", icon: <Award className="text-secondary-fixed" size={18} /> },
                  { title: "Ferramentas Agro-Digitais", desc: "Calculadoras de solo, controle de NPK e finanças.", icon: <Database className="text-secondary-fixed" size={18} /> },
                  { title: "Suporte e Rede Ativa", desc: "Chat com agrônomos e comunidade VIP de produtores.", icon: <Users className="text-secondary-fixed" size={18} /> }
                ].map((item, idx) => (
                  <div key={idx} className="flex gap-4 items-start">
                    <div className="w-8 h-8 rounded-lg bg-secondary/15 flex items-center justify-center shrink-0 border border-secondary/20 mt-0.5">
                      {item.icon}
                    </div>
                    <div>
                      <h5 className="text-xs font-bold text-white">{item.title}</h5>
                      <p className="text-[10px] text-zinc-400 font-sans mt-0.5 leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </section>

        {/* O QUE VOCÊ RECEBE (Value Stack Grid) SECTION */}
        <section className="py-24 bg-slate-50 text-zinc-900 border-y border-zinc-200/50 relative z-10">
          <div className="max-w-7xl mx-auto px-6 space-y-16">
            <div className="text-center max-w-3xl mx-auto space-y-4">
              <span className="text-secondary font-bold uppercase tracking-widest text-xs font-inter block">O Ecossistema</span>
              <h2 className="font-headline text-3xl md:text-5xl font-extrabold tracking-tight text-zinc-950 leading-tight">
                Tudo o que você recebe ao entrar hoje.
              </h2>
              <p className="text-zinc-600 font-sans text-sm md:text-base leading-relaxed">
                Desenvolvemos cada recurso pensando na realidade do produtor rural que quer otimizar custos e acelerar ganhos.
              </p>
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

        {/* FUTURO SECTION (Two Groups) */}
        <section className="py-24 max-w-5xl mx-auto px-6 space-y-16">
          <div className="text-center max-w-3xl mx-auto space-y-4">
            <span className="text-secondary-fixed font-bold uppercase tracking-widest text-xs font-inter block">O Próximo Ano</span>
            <h2 className="font-headline text-3xl md:text-5xl font-extrabold tracking-tight text-white leading-tight">
              Daqui a 12 meses existirão apenas dois tipos de produtores.
            </h2>
          </div>

          <div className="grid md:grid-cols-2 gap-8 pt-4">
            
            {/* Group 1 */}
            <div className="p-8 rounded-[2.5rem] bg-slate-900/40 border border-outline-variant/20 flex flex-col justify-between space-y-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-red-500/5 blur-[50px] rounded-full" />
              <div className="space-y-4">
                <span className="bg-red-500/10 text-red-400 border border-red-500/20 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest font-inter">
                  GRUPO 1: ESTAGNADO
                </span>
                <h3 className="font-headline text-lg font-bold text-white leading-tight">
                  Os que continuarão tomando decisões sem método e no escuro.
                </h3>
                <p className="text-xs text-zinc-400 font-sans leading-relaxed">
                  Continuarão anotando os gastos em papéis perdidos, calculando adubação no olhômetro, dependendo da sorte com o clima e sem saber qual é a real margem de lucro por hectare da lavoura.
                </p>
              </div>
              <div className="flex items-center gap-2 text-xs font-bold text-red-300">
                <XCircle size={16} /> Risco alto de perdas financeiras
              </div>
            </div>

            {/* Group 2 */}
            <div className="p-8 rounded-[2.5rem] bg-secondary-container/10 border border-secondary/40 flex flex-col justify-between space-y-6 relative overflow-hidden shadow-xl shadow-secondary/5">
              <div className="absolute top-0 right-0 w-32 h-32 bg-secondary/15 blur-[60px] rounded-full" />
              <div className="space-y-4">
                <span className="bg-secondary/20 text-secondary-fixed border border-secondary/30 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest font-inter">
                  GRUPO 2: BANANAL PRO
                </span>
                <h3 className="font-headline text-lg font-bold text-white leading-tight">
                  Os que terão dados, planejamento, conhecimento e acompanhamento.
                </h3>
                <p className="text-xs text-zinc-400 font-sans leading-relaxed">
                  Operarão com calculadoras precisas de solo, planejarão os tratos culturais no calendário digital, terão previsões agroclimáticas confiáveis, controlarão insumos rigidamente e consultarão agrônomos na plataforma.
                </p>
              </div>
              <div className="flex items-center gap-2 text-xs font-bold text-secondary-fixed">
                <CheckCircle2 size={16} /> Crescimento técnico e financeiro guiado
              </div>
            </div>

          </div>

          <div className="text-center max-w-2xl mx-auto space-y-4 pt-6">
            <p className="text-lg md:text-xl text-zinc-400 font-sans">
              A pergunta é:
            </p>
            <h3 className="font-headline text-2xl md:text-4xl font-extrabold text-white">
              Em qual grupo você estará?
            </h3>
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
                    💰 Menos de R$ 1 por dia.
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
                    ⚠️ <strong>Escassez:</strong> Esta oferta de lançamento é por tempo limitado e exclusiva para quem fechar primeiro. Quando estas poucas vagas terminarem, o lote será encerrado e o valor será reajustado.
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
