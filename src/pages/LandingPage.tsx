import React, { useEffect, useState, useRef } from "react";
import PublicLayout from "../components/Layout/PublicLayout";
import { Link } from "react-router-dom";
import { motion } from "motion/react";
import { 
  Sprout, 
  Leaf, 
  Droplet, 
  TrendingUp, 
  ShieldCheck, 
  Coins, 
  Headphones, 
  Tv, 
  Users 
} from "lucide-react";
import logoImg from "../assets/logo.png";

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
    <span ref={ref} className="text-tertiary-fixed text-5xl md:text-6xl font-headline font-bold block tracking-tight">
      {prefix}
      {decimals > 0 ? value.toFixed(decimals) : Math.floor(value)}
      {suffix}
    </span>
  );
}

export default function LandingPage() {
  const pillarsList = [
    {
      id: "solo",
      icon: <Sprout className="w-8 h-8" />,
      title: "Solo Fértil",
      impactPhrase: "Equilíbrio químico e físico para alta produtividade.",
      image: "/images/banana_pillar_soil.jpg",
      features: [
        "Interpretação prática da análise de solo",
        "Cálculo automático de calagem e gessagem",
        "Recomendação precisa de adubação por hectare"
      ]
    },
    {
      id: "mudas",
      icon: <Leaf className="w-8 h-8" />,
      title: "Mudas de Qualidade",
      impactPhrase: "O sucesso da sua lavoura começa na escolha da muda.",
      image: "/images/banana_pillar_seedlings.jpg",
      features: [
        "Seleção das melhores cultivares agrícolas",
        "Prevenção rigorosa de pragas e nematoides",
        "Acompanhamento do plantio até a colheita"
      ]
    },
    {
      id: "irrigacao",
      icon: <Droplet className="w-8 h-8" />,
      title: "Irrigação Inteligente",
      impactPhrase: "Água na medida certa para o máximo enchimento.",
      image: "/images/banana_pillar_irrigation.jpg",
      features: [
        "Planejamento estrutural do gotejamento",
        "Manejo hídrico ideal por fase da planta",
        "Evite desperdício de água e energia elétrica"
      ]
    },
    {
      id: "nutricao",
      icon: <TrendingUp className="w-8 h-8" />,
      title: "Nutrição Eficiente",
      impactPhrase: "Adubação correta e econômica para caixas pesadas.",
      image: "/images/banana_pillar_nutrition.jpg",
      features: [
        "Correção de fome oculta e deficiências foliares",
        "Fertilização calibrada para cada talhão",
        "Máximo retorno sobre investimento em adubo"
      ]
    },
    {
      id: "manejo",
      icon: <ShieldCheck className="w-8 h-8" />,
      title: "Manejo de Alto Nível",
      impactPhrase: "Práticas técnicas que geram resultados reais.",
      image: "/images/banana_pillar_management.jpg",
      features: [
        "Desbaste, desfolha e condução técnica",
        "Prevenção contra Sigatoka e fitossanidade",
        "Organização prática dos talhões da fazenda"
      ]
    },
    {
      id: "lucro",
      icon: <Coins className="w-8 h-8" />,
      title: "Mais Lucro e Sustentabilidade",
      impactPhrase: "Produza muito mais gastando muito menos.",
      image: "/images/banana_pillar_sustainability.jpg",
      features: [
        "Gestão financeira de custos por hectare",
        "Classificação e embalagem de elite",
        "Preço ideal de venda e comercialização"
      ]
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
      {/* Premium Hero Section Coded from Rebranding Artwork Design */}
      <section className="relative min-h-screen flex flex-col justify-between overflow-hidden pt-28 pb-12 bg-[#00170F] text-white">
        {/* Background Plantation Sunset */}
        <div className="absolute inset-0 z-0 overflow-hidden">
          <img
            src="/images/banana_plantation_hero_bg_v2.png"
            alt="Banana PRO Cultivo"
            className="w-full h-full object-cover brightness-[0.2]"
          />
          {/* Sunset glow top right */}
          <div className="absolute top-0 right-0 w-[55%] h-[55%] bg-gradient-to-bl from-yellow-500/10 via-transparent to-transparent pointer-events-none" />
        </div>

        {/* Ambient glows */}
        <div className="glow-spot glow-green top-1/4 left-1/4"></div>
        <div className="glow-spot glow-yellow bottom-1/4 right-1/4"></div>

        <div className="max-w-7xl mx-auto px-6 md:px-10 w-full relative z-10 flex-1 flex flex-col justify-between gap-12">
          {/* Main Top Row: Left Text + Right Specialists */}
          <div className="grid lg:grid-cols-12 gap-8 items-center w-full">
            {/* Left Column: Brand Info */}
            <div className="lg:col-span-6 space-y-6 text-left pb-4">
              {/* Logo in hero body */}
              <div className="flex items-center gap-3">
                <img src={logoImg} alt="Banana PRO" className="h-20 md:h-24 w-auto object-contain" />
              </div>

              <h1 className="font-headline text-3xl sm:text-4xl md:text-5xl lg:text-6xl text-white font-extrabold tracking-tight leading-[1.08] uppercase">
                O MÉTODO COMPLETO <br />
                PARA PRODUZIR BANANAS <br />
                COM <span className="text-tertiary-fixed">MAIS EFICIÊNCIA</span>,<br />
                <span className="text-tertiary-fixed">MENOS CUSTO</span> E <span className="text-tertiary-fixed">MAIS LUCRO</span>.
              </h1>

              <div className="flex items-start gap-3 pt-2">
                <Leaf className="text-tertiary-fixed w-5 h-5 shrink-0 mt-0.5" />
                <p className="font-sans text-sm md:text-base text-zinc-300 leading-relaxed max-w-xl">
                  Conhecimento prático e suporte especializado para transformar sua produção.
                </p>
              </div>

              {/* Call to action buttons */}
              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <a
                  href="#planos"
                  className="bg-secondary hover:bg-secondary-fixed text-white px-8 py-3.5 rounded-xl font-headline font-bold text-sm tracking-wide transition-all border-glow duration-300 shadow-lg shadow-secondary/20 flex items-center justify-center gap-2 cursor-pointer w-full sm:w-auto text-center"
                >
                  Entrar para a Comunidade
                  <span className="material-symbols-outlined text-sm">arrow_forward</span>
                </a>
              </div>
            </div>

            {/* Right Column: Specialists Photo & Stamp overlay */}
            <div className="lg:col-span-6 relative flex justify-center lg:justify-end items-end h-[42vh] lg:h-[55vh] xl:h-[60vh]">
              {/* Specialists image */}
              <img
                src="/images/specialists_hero.png"
                alt="Especialistas Banana PRO"
                className="max-h-full w-auto object-contain object-bottom z-10 select-none scale-[1.05] lg:scale-[1.12] origin-bottom"
              />
              
              {/* Blend gradient at bottom of specialists */}
              <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-[#00170F] to-transparent z-15 pointer-events-none" />

              {/* Gold Round Stamp Overlay */}
              <div className="absolute bottom-8 left-4 lg:-left-2 z-20 animate-float-1">
                <div className="relative w-28 h-28 md:w-36 md:h-36 rounded-full border-2 border-tertiary-fixed/30 bg-[#00170F]/90 flex flex-col items-center justify-center text-center p-2 shadow-2xl">
                  {/* Outer glowing dotted border */}
                  <div className="absolute inset-1 rounded-full border border-dashed border-tertiary-fixed/20 animate-spin-slow"></div>
                  {/* Stamp text content */}
                  <span className="text-[7px] md:text-[9px] font-extrabold uppercase tracking-widest text-tertiary-fixed leading-tight">Produção</span>
                  <span className="text-[7px] md:text-[9px] font-extrabold uppercase tracking-widest text-tertiary-fixed leading-tight">com Lucro</span>
                  <span className="text-xl md:text-2xl my-0.5">🍌</span>
                  <span className="text-[6px] md:text-[8px] text-zinc-400 font-bold uppercase tracking-wider leading-none">Eficiência &</span>
                  <span className="text-[6px] md:text-[8px] text-zinc-400 font-bold uppercase tracking-wider leading-none">Performance</span>
                </div>
              </div>
            </div>
          </div>

          {/* Middle Row: Gold horizontal banner pill */}
          <div className="w-full text-center relative z-10 my-4">
            <div className="inline-flex flex-col md:flex-row items-center justify-center gap-2 md:gap-4 px-8 py-3 rounded-full border border-tertiary-fixed/30 bg-[#002417]/70 backdrop-blur-md max-w-3xl mx-auto shadow-lg">
              <span className="text-[10px] md:text-xs font-black uppercase tracking-widest text-white font-inter">DA BASE AO MANEJO AVANÇADO</span>
              <span className="hidden md:inline text-tertiary-fixed">•</span>
              <span className="text-[10px] md:text-xs font-black uppercase tracking-widest text-tertiary-fixed font-inter">ACOMPANHAMENTO DE QUEM VIVE O QUE ENSINA</span>
            </div>
          </div>

          {/* Pillars Row: 6 Circular Icons + Labels */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6 w-full text-center pb-8 border-b border-emerald-950/40 relative z-10">
            {[
              { icon: <Sprout className="w-5 h-5 text-tertiary-fixed" />, title: "Solo Fértil", desc: "Equilíbrio e Alta Produtividade" },
              { icon: <Leaf className="w-5 h-5 text-tertiary-fixed" />, title: "Mudas de Qualidade", desc: "Do Plantio à Colheita" },
              { icon: <Droplet className="w-5 h-5 text-tertiary-fixed" />, title: "Irrigação Inteligente", desc: "Água na Medida Certa" },
              { icon: <TrendingUp className="w-5 h-5 text-tertiary-fixed" />, title: "Nutrição Eficiente", desc: "Adubação Correta e Econômica" },
              { icon: <ShieldCheck className="w-5 h-5 text-tertiary-fixed" />, title: "Manejo de Alto Nível", desc: "Práticas que Geram Resultados" },
              { icon: <Coins className="w-5 h-5 text-tertiary-fixed" />, title: "Mais Lucro e Sustentabilidade", desc: "Produza Mais, Gastando Menos" }
            ].map((pillar, idx) => (
              <div key={idx} className="flex flex-col items-center space-y-3 group cursor-pointer">
                {/* Circle Icon Container */}
                <div className="w-12 h-12 rounded-full border-2 border-tertiary-fixed/30 bg-[#00170F]/80 flex items-center justify-center shadow-md group-hover:border-tertiary-fixed group-hover:scale-110 transition-all duration-300">
                  {pillar.icon}
                </div>
                <div className="space-y-1">
                  <h4 className="text-[11px] font-black uppercase tracking-wider text-white font-headline leading-tight">
                    {pillar.title}
                  </h4>
                  <p className="text-[9px] text-zinc-400 font-sans leading-tight">
                    {pillar.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Bottom Footer Row: 3 Support benefits side-by-side */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full text-center relative z-10 pt-2">
            {[
              { icon: <Headphones className="w-5 h-5 text-tertiary-fixed" />, title: "Suporte Especializado", desc: "Tire dúvidas sempre que precisar" },
              { icon: <Tv className="w-5 h-5 text-tertiary-fixed" />, title: "Aulas ao Vivo Semanais", desc: "Com especialistas no assunto" },
              { icon: <Users className="w-5 h-5 text-tertiary-fixed" />, title: "Comunidade Exclusiva", desc: "De produtores comprometidos" }
            ].map((item, idx) => (
              <div key={idx} className="flex items-center justify-center gap-3 py-2.5 px-4 rounded-xl bg-[#002417]/30 border border-emerald-950/20">
                {item.icon}
                <div className="text-left">
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider font-headline leading-tight">{item.title}</h4>
                  <p className="text-[10px] text-zinc-400 font-sans leading-none">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Feature Showcase Grid (Linear Style) — BLOCK 2 (Visual Redesign) */}
      <section className="py-24 relative overflow-hidden bg-[#01140d] text-white border-y border-emerald-950/60 reveal" id="ferramentas">
        {/* Subtle grid pattern background */}
        <div className="absolute inset-0 bg-[radial-gradient(#ffe17a_1px,transparent_1px)] [background-size:32px_32px] opacity-[0.03] pointer-events-none" />
        
        {/* Ambient volumetric glows */}
        <div className="absolute top-1/4 left-1/10 w-96 h-96 bg-emerald-500/10 blur-[100px] rounded-full pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/10 w-96 h-96 bg-tertiary-fixed/5 blur-[100px] rounded-full pointer-events-none" />

        <div className="max-w-7xl mx-auto px-6 md:px-10 relative z-10">
          <div className="text-center max-w-3xl mx-auto mb-20 space-y-4">
            <span className="text-tertiary-fixed font-semibold uppercase tracking-widest text-xs font-inter block">O Método Operacional</span>
            <h2 className="font-headline text-3xl sm:text-4xl text-white font-bold tracking-tight">Detalhes do Método Banana PRO</h2>
            <p className="text-zinc-400 font-sans text-sm md:text-base leading-relaxed">
              Mais do que ferramentas, entregamos o método completo para sua lavoura atingir a máxima eficiência técnica e comercial.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 relative z-10">
            {pillarsList.map((pillar, idx) => (
              <motion.div
                key={pillar.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: (idx % 3) * 0.1, duration: 0.6, ease: "easeOut" }}
                className="bg-[#021c12]/60 backdrop-blur-md border border-emerald-900/40 p-0 rounded-3xl hover:border-tertiary-fixed/50 hover:shadow-2xl hover:shadow-emerald-950/20 hover:-translate-y-2 transition-all duration-500 ease-out flex flex-col justify-between overflow-hidden group border-glow"
              >
                {/* Photo Header */}
                <div className="relative w-full h-48 overflow-hidden bg-emerald-950">
                  <img
                    src={pillar.image}
                    alt={pillar.title}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#021c12] via-transparent to-transparent" />
                  
                  {/* Icon floating */}
                  <div className="absolute bottom-4 left-6 w-12 h-12 rounded-xl bg-[#00170F]/90 border border-emerald-800/40 flex items-center justify-center text-tertiary-fixed shadow-md">
                    {pillar.icon}
                  </div>
                </div>

                <div className="p-6 md:p-8 flex-1 flex flex-col justify-between space-y-6">
                  <div className="text-left space-y-4">
                    <h3 className="text-xl md:text-2xl font-headline font-bold text-white tracking-tight">
                      {pillar.title}
                    </h3>

                    {/* Checklist style */}
                    <div className="space-y-3 pt-1 text-left">
                      {pillar.features.map((feat, fidx) => (
                        <div key={fidx} className="flex items-start gap-2.5">
                          <div className="w-4 h-4 rounded-full bg-emerald-950 border border-emerald-900 flex items-center justify-center shrink-0 mt-0.5 group-hover:border-tertiary-fixed/40 transition-colors">
                            <svg className="w-2.5 h-2.5 text-tertiary-fixed" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="4">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                          <span className="text-zinc-300 text-xs font-sans leading-snug group-hover:text-white transition-colors duration-200">
                            {feat}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Phrase of impact at the bottom with a divider */}
                  <div className="pt-4 border-t border-emerald-950 text-left">
                    <p className="text-tertiary-fixed/85 font-sans text-xs italic leading-relaxed">
                      "{pillar.impactPhrase}"
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Core Features Banner — New Section (Atmospheric Dark Gold Theme) */}
      <section className="py-16 relative overflow-hidden bg-[#002417] text-white border-b border-emerald-950/60 reveal">
        <div className="max-w-7xl mx-auto px-6 md:px-10 relative z-10">
          <div className="glass border-glow rounded-3xl p-8 md:p-12 shadow-2xl flex flex-col lg:flex-row items-center justify-between gap-10">
            <div className="text-left space-y-2 lg:max-w-md">
              <h3 className="font-headline text-2xl font-black text-white tracking-tight leading-tight">
                Tudo o que você precisa em um único lugar.
              </h3>
              <p className="text-zinc-400 font-sans text-xs">
                Um ecossistema completo desenhado de ponta a ponta para apoiar o produtor de banana nas decisões diárias.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 w-full lg:flex-1">
              {[
                {
                  icon: <Headphones className="w-6 h-6 text-tertiary-fixed" />,
                  title: "Suporte Especializado",
                  desc: "Tire dúvidas técnicas com nossos agrônomos sempre que precisar."
                },
                {
                  icon: <Tv className="w-6 h-6 text-tertiary-fixed" />,
                  title: "Aulas ao Vivo Semanais",
                  desc: "Encontros interativos online com especialistas no assunto."
                },
                {
                  icon: <Users className="w-6 h-6 text-tertiary-fixed" />,
                  title: "Comunidade Exclusiva",
                  desc: "Troque experiências e cotações com produtores de todo o país."
                }
              ].map((item, idx) => (
                <div key={idx} className="flex gap-4 items-start text-left p-4 rounded-2xl bg-[#00170F]/50 border border-emerald-900/30 hover:border-tertiary-fixed/30 transition-all duration-300">
                  <div className="w-10 h-10 shrink-0 rounded-xl bg-emerald-950 flex items-center justify-center shadow-sm">
                    {item.icon}
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-sm font-headline font-bold text-white">
                      {item.title}
                    </h4>
                    <p className="text-[11px] text-zinc-400 font-sans leading-relaxed">
                      {item.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Timeline Section — BLOCK 3 (Dark Background) */}
      <section className="py-24 relative overflow-hidden bg-gradient-to-b from-[#002417] to-[#00170F] border-b border-emerald-950/60 reveal">
        {/* Glow Spots */}
        <div className="glow-spot glow-green top-1/4 left-1/12 opacity-30"></div>
        <div className="glow-spot glow-yellow bottom-1/4 right-1/12 opacity-20"></div>

        <div className="max-w-7xl mx-auto px-6 md:px-10 relative z-10 w-full">
          {/* Centered Header */}
          <div className="text-center max-w-3xl mx-auto mb-20 space-y-4">
            <span className="text-tertiary-fixed font-semibold uppercase tracking-widest text-xs font-inter block">
              Ciclo Completo
            </span>
            <h2 className="font-headline text-3xl sm:text-4xl md:text-5xl text-white font-extrabold tracking-tight leading-tight">
              Acompanhamos todo o ciclo do bananicultor
            </h2>
            <div className="max-w-2xl mx-auto pt-4">
              <p className="font-sans text-base md:text-lg text-emerald-100/90 font-medium leading-relaxed italic border-l-2 md:border-l-0 md:border-y border-tertiary-fixed/30 pl-4 md:pl-0 md:py-3">
                "Em cada etapa existe uma decisão importante. E em cada etapa estaremos ao seu lado."
              </p>
            </div>
          </div>

          {/* Timeline Process */}
          <div className="relative w-full">
            {/* Timeline central connection line */}
            <div className="absolute left-[24px] lg:left-1/2 transform lg:-translate-x-1/2 top-8 bottom-8 w-[2px] bg-gradient-to-b from-emerald-500/80 via-tertiary-fixed/40 to-emerald-950/20"></div>

            <div className="space-y-16 lg:space-y-24">
              {[
                {
                  title: "Escolha da muda",
                  desc: "Seleção genética de mudas de laboratório micropropagadas de alta produtividade, livres de pragas como nematóides e broca, garantindo arranque vigoroso e uniformidade no campo.",
                  image: "/images/escolhadamuda.png",
                },
                {
                  title: "Plantio",
                  desc: "Definição do espaçamento ideal e alinhamento preciso das covas ou sulcos, considerando a cultivar e a declividade da área de cultivo para otimizar o aproveitamento da luz e facilitar os tratos culturais.",
                  image: "/images/plantio.png",
                },
                {
                  title: "Solo",
                  desc: "Análise físico-química detalhada da área de plantio, servindo de base para o cálculo de calagem, gessagem e adubação orgânica e mineral equilibradas.",
                  image: "/images/solo.png",
                },
                {
                  title: "Irrigação",
                  desc: "Projeto técnico e dimensionamento do sistema de microaspersão ou gotejamento, garantindo a lâmina diária de água necessária para suprir o alto consumo hídrico da bananeira.",
                  image: "/images/irrigacao.png",
                },
                {
                  title: "Manejo",
                  desc: "Execução periódica de desbaste (mantendo mãe, filha e neta), desfolha sanitária, eliminação do coração (inflorescência masculina) e escoramento das plantas para suportar o peso dos cachos.",
                  image: "/images/manejo.png",
                },
                {
                  title: "Controle de doenças",
                  desc: "Monitoramento constante de pragas e doenças, como a Sigatoka Negra e Amarela e o Mal-do-Panamá, adotando desfolha cirúrgica, manejo biológico e controle químico estratégico.",
                  image: "/images/controledoencas.png",
                },
                {
                  title: "Enchimento",
                  desc: "Adubações ricas em potássio e nitrogênio na fase reprodutiva, além de proteção física dos cachos (ensacamento) para obter frutos limpos, compridos, sem defeitos e caixas pesadas.",
                  image: "/images/enchimento.png",
                },
                {
                  title: "Colheita",
                  desc: "Determinação do ponto ideal de corte pelo calibre dos frutos. Operação cuidadosa de corte da bananeira e transporte suspenso ou acolchoado do cacho para a casa de embalagem sem ferir os frutos.",
                  image: "/images/colheita.png",
                },
                {
                  title: "Comercialização",
                  desc: "Lavagem, despencamento, classificação rigorosa, embalagem em caixas padronizadas e logística de escoamento para garantir o melhor valor de venda no mercado interno ou exportação.",
                  image: "/images/comercializacao.png",
                }
              ].map((step, idx) => {
                const isEven = idx % 2 === 0;
                return (
                  <div key={idx} className="grid lg:grid-cols-2 gap-8 lg:gap-16 items-center relative w-full">
                    {/* Central Circle Marker */}
                    <div className="absolute left-[24px] lg:left-1/2 transform -translate-x-1/2 top-4 lg:top-1/2 lg:-translate-y-1/2 w-8 h-8 rounded-full bg-[#00170F] border-2 border-tertiary-fixed flex items-center justify-center text-xs font-bold text-tertiary-fixed shadow-md shadow-emerald-950/50 z-20">
                      {idx + 1}
                    </div>

                    {/* Step Card Content */}
                    <div className={`pl-16 lg:pl-0 ${isEven ? "lg:order-1 lg:text-right" : "lg:order-2 lg:text-left"} space-y-4`}>
                      <div className="p-6 sm:p-8 rounded-2xl bg-emerald-950/20 border border-emerald-500/5 backdrop-blur-md hover:border-emerald-500/20 hover:bg-emerald-950/30 transition-all duration-300 shadow-xl">
                        <span className="text-xs font-mono uppercase tracking-widest text-tertiary-fixed font-bold block mb-2">
                          Etapa {idx + 1}
                        </span>
                        <h3 className="font-headline text-xl sm:text-2xl text-white font-bold tracking-tight mb-3">
                          {step.title}
                        </h3>
                        <p className="text-xs sm:text-sm text-zinc-300 font-sans leading-relaxed">
                          {step.desc}
                        </p>
                      </div>
                    </div>

                    {/* Step Image */}
                    <div className={`pl-16 lg:pl-0 ${isEven ? "lg:order-2" : "lg:order-1"} relative`}>
                      <div className="relative aspect-[16/10] w-full overflow-hidden rounded-2xl border border-emerald-500/10 shadow-2xl group cursor-pointer">
                        <img
                          src={step.image}
                          alt={step.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 select-none"
                          loading="lazy"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Specialists Section — BLOCK 4 (Premium Dark Green Background) */}
      <section className="py-24 bg-[#01140d] text-white border-b border-emerald-950/60 reveal" id="comunidade">
        <div className="max-w-7xl mx-auto px-6 md:px-10">
          <div className="text-center max-w-3xl mx-auto mb-20 space-y-4">
            <span className="text-tertiary-fixed font-semibold uppercase tracking-widest text-xs font-inter block">Equipe de Apoio</span>
            <h2 className="font-headline text-3xl sm:text-4xl text-white font-bold tracking-tight">Conheça quem vai acompanhar você</h2>
            <p className="text-zinc-400 font-sans text-sm md:text-base leading-relaxed">
              Você terá acesso direto a especialistas que entendem a realidade do campo e vivem a bananicultura no dia a dia.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                name: "Jean Carlos",
                role: "Produtor de Banana",
                bio: "Produtor atuante com mais de 5 anos de experiência diária na lavoura. Especialista em técnicas de condução de alta produtividade e manejo de campo. Traduz a teoria científica em soluções simples, práticas e direto ao ponto para o produtor rural.",
                image: "/images/jean.png",
                position: "object-center"
              },
              {
                name: "Jhonatan",
                role: "Engenheiro Agrônomo",
                bio: "Engenheiro Agrônomo especializado em fertilidade de solo, sanidade vegetal e nutrição de alta precisão para bananeiras. Focado em balancear nutrientes para maximizar o enchimento dos cachos e otimizar os custos com adubação.",
                image: "/images/jhonatan.jpeg",
                position: "object-top"
              },
              {
                name: "Francisco",
                role: "Especialista em Biológicos",
                bio: "Consultor de campo com mais de 20 anos de dedicação exclusiva à fitossanidade e ao controle biológico na bananicultura. Referência em manejo integrado de pragas, controle estratégico da Sigatoka e redução sustentável do uso de defensivos químicos.",
                image: "/images/francisco.jpeg",
                position: "object-center"
              }
            ].map((spec, idx) => (
              <div key={idx} className="bg-[#021c12]/60 backdrop-blur-md border border-emerald-900/40 rounded-[2.5rem] overflow-hidden hover:shadow-xl hover:border-tertiary-fixed/30 transition-all duration-500 flex flex-col hover:-translate-y-1 group border-glow">
                {/* Large Photo Container */}
                <div className="w-full h-80 overflow-hidden relative bg-[#01140d]">
                  <img
                    src={spec.image}
                    alt={spec.name}
                    className={`w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 ${spec.position}`}
                  />
                </div>
                {/* Content */}
                <div className="p-8 space-y-4 flex-1 flex flex-col justify-between text-left">
                  <div className="space-y-2">
                    <h3 className="text-2xl font-headline font-bold text-white">{spec.name}</h3>
                    <p className="text-tertiary-fixed font-bold text-xs uppercase tracking-wider font-inter">
                      {spec.role}
                    </p>
                    <p className="text-sm text-zinc-300 font-sans leading-relaxed pt-3 border-t border-emerald-950/60">
                      {spec.bio}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Results Counters Section — BLOCK 5 (Dark Background) */}
      <section className="py-24 bg-[#002417] border-b border-emerald-950/60 relative reveal">
        <div className="max-w-7xl mx-auto px-6 md:px-10">
          <div className="bg-[#021c12]/60 backdrop-blur-md p-12 rounded-[3.5rem] border border-emerald-900/40 text-center text-white relative overflow-hidden group border-glow">
            {/* Mesh highlights inside results card */}
            <div className="absolute top-0 right-0 w-80 h-80 bg-tertiary-fixed/5 blur-[120px] transition-all duration-700 group-hover:bg-tertiary-fixed/10"></div>
            
            <div className="relative z-10">
              <h2 className="font-headline text-2xl sm:text-3xl font-bold mb-16 tracking-tight text-white">Resultados Reais Operacionais</h2>
              <div className="grid md:grid-cols-3 gap-12">
                <div className="space-y-4 border-r md:border-emerald-950/50 last:border-0 pr-4">
                  <Counter target={35} prefix="+" suffix="%" />
                  <p className="text-xs font-semibold tracking-widest text-zinc-400 uppercase font-inter">Aumento Médio na Produtividade</p>
                </div>
                <div className="space-y-4 border-r md:border-emerald-950/50 last:border-0 pr-4">
                  <Counter target={15} suffix="%" />
                  <p className="text-xs font-semibold tracking-widest text-zinc-400 uppercase font-inter">Redução em Custos de Insumos</p>
                </div>
                <div className="space-y-4">
                  <Counter target={3.4} decimals={1} suffix="x" />
                  <p className="text-xs font-semibold tracking-widest text-zinc-400 uppercase font-inter">Retorno sobre Investimento (ROI)</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section (Fintech Style) — BLOCK 6 (Dark Background) */}
      <section className="py-24 bg-[#01140d] text-white border-b border-emerald-950/60 relative reveal" id="planos">
        <div className="max-w-7xl mx-auto px-6 md:px-10 text-center">
          <div className="max-w-3xl mx-auto mb-16 space-y-4">
            <span className="text-tertiary-fixed font-semibold uppercase tracking-widest text-xs font-inter block">Investimento Otimizado</span>
            <h2 className="font-headline text-2xl sm:text-3xl md:text-4xl text-white font-bold tracking-tight">O ecossistema completo ao seu alcance.</h2>
          </div>

          {/* Comparison of Value Table */}
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto mb-16">
            {/* Consultoria Tradicional */}
            <div className="bg-[#021c12]/40 border border-emerald-950 p-8 rounded-[2.5rem] text-left space-y-4">
              <h3 className="text-xl font-headline font-bold text-zinc-400 flex items-center gap-2">
                Consultoria Tradicional
              </h3>
              <div className="text-2xl font-headline font-extrabold text-red-500">
                R$ 2.000 a R$ 2.500
                <span className="text-xs font-sans text-zinc-500 font-normal"> /visita</span>
              </div>
              <ul className="space-y-3.5 text-zinc-450 font-sans text-xs">
                <li className="flex items-center gap-2">
                  <span className="text-red-500 shrink-0 font-bold">✓</span>
                  <span>Uma única visita presencial</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-red-500 shrink-0 font-bold">✓</span>
                  <span>Diagnóstico pontual e isolado</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-red-500 shrink-0 font-bold">✓</span>
                  <span>Exigência de novo pagamento para retornos e dúvidas</span>
                </li>
              </ul>
            </div>

            {/* Banana PRO */}
            <div className="bg-[#021c12]/80 border border-tertiary-fixed/30 p-8 rounded-[2.5rem] text-left space-y-4 border-glow">
              <h3 className="text-xl font-headline font-bold text-tertiary-fixed flex items-center gap-2">
                Acompanhamento Banana PRO
              </h3>
              <div className="text-2xl font-headline font-extrabold text-emerald-400">
                Acesso Contínuo
                <span className="text-xs font-sans text-zinc-550 font-normal"> /ano todo</span>
              </div>
              <ul className="space-y-3.5 text-zinc-300 font-sans text-xs">
                <li className="flex items-center gap-2">
                  <span className="text-emerald-400 shrink-0 font-bold">✓</span>
                  <span>Acompanhamento contínuo nas decisões diárias</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-emerald-400 shrink-0 font-bold">✓</span>
                  <span>Especialistas de prontidão para tirar dúvidas</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-emerald-400 shrink-0 font-bold">✓</span>
                  <span>Comunidade active com troca de experiências reais</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-emerald-400 shrink-0 font-bold">✓</span>
                  <span>Cursos, lives, ferramentas e conteúdos sempre atualizados</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Mensal */}
            <div className="bg-[#021c12]/60 backdrop-blur-md border border-emerald-900/40 rounded-[2.5rem] p-8 md:p-10 relative flex flex-col justify-between shadow-sm hover:shadow-xl hover:border-emerald-800 transition-all duration-300 text-left border-glow">
              <div>
                <span className="text-zinc-400 text-[11px] font-bold tracking-wider uppercase font-inter block">
                  Acesso Mensal Recorrente
                </span>
                
                <div className="mt-3">
                  <span className="bg-emerald-950 text-emerald-400 border border-emerald-900/30 text-[10px] font-extrabold px-3 py-1 rounded-full uppercase tracking-wider font-inter inline-block">
                    Flexibilidade Total
                  </span>
                </div>
                
                <p className="text-zinc-400 text-[11px] font-bold uppercase tracking-wider mt-8">
                  Por apenas:
                </p>
                
                <div className="mt-2 mb-1 flex items-baseline gap-1">
                  <span className="text-5xl font-black text-tertiary-fixed tracking-tight font-headline">R$ 97</span>
                  <span className="text-zinc-400 font-sans text-sm">/mês</span>
                </div>
                
                <p className="text-zinc-300 font-sans text-sm font-semibold mb-6">
                  Acesso mensal sem fidelidade
                </p>
                
                <div className="inline-block border border-emerald-950 bg-emerald-950/30 px-4 py-1.5 rounded-xl text-xs text-zinc-450 font-medium font-sans">
                  Ideal para testar os recursos.
                </div>
              </div>
              
              <div className="mt-10">
                <Link
                  to="/auth/register?offer=padrao&plan=mensal"
                  className="w-full bg-[#006d3b] hover:bg-emerald-600 text-white py-4.5 rounded-2xl font-headline font-bold text-xs tracking-wider uppercase transition-all duration-300 active:scale-95 block text-center cursor-pointer"
                >
                  Assinar Plano Mensal
                </Link>
                <p className="text-[10px] text-zinc-500 mt-4 text-center font-sans">
                  ✓ Acesso imediato • Cancele quando quiser • Sem fidelidade
                </p>
                <p className="text-[10px] text-zinc-400 mt-6 font-sans leading-relaxed text-left">
                  Tenha acesso a todas as ferramentas de solo, suporte técnico dos agrônomos e comunidade VIP mês a mês.
                </p>
              </div>
            </div>

            {/* Anual */}
            <div className="bg-[#021c12]/80 backdrop-blur-md border-2 border-tertiary-fixed rounded-[2.5rem] p-8 md:p-10 relative flex flex-col justify-between overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 text-left border-glow">
              {/* Slanted banner top-right */}
              <div className="absolute top-0 right-0 bg-tertiary-fixed text-[#00170F] text-[10px] font-black uppercase tracking-widest px-6 py-2 rounded-bl-2xl">
                Poucas Vagas
              </div>
              
              <div>
                <span className="text-zinc-400 text-[11px] font-bold tracking-wider uppercase font-inter block">
                  Acesso Completo de 1 Ano
                </span>
                
                <div className="mt-3 flex items-center gap-3">
                  <span className="text-zinc-500 line-through text-xs font-medium">De R$ 797/ano</span>
                  <span className="bg-emerald-950 text-tertiary-fixed border border-emerald-900/30 text-[10px] font-extrabold px-3 py-1 rounded-full uppercase tracking-wider font-inter inline-block">
                    Desconto Especial
                  </span>
                </div>
                
                <p className="text-zinc-400 text-[11px] font-bold uppercase tracking-wider mt-8">
                  Por apenas:
                </p>
                
                <div className="mt-2 mb-1 flex items-baseline gap-1.5 font-headline">
                  <span className="text-lg font-bold text-tertiary-fixed">12x de</span>
                  <span className="text-5xl font-black text-tertiary-fixed tracking-tight">R$ 49,70</span>
                </div>
                
                <p className="text-zinc-300 font-sans text-sm font-semibold mb-6">
                  ou <span className="font-bold text-tertiary-fixed">R$ 497 à vista</span> por um ano de acesso
                </p>
                
                <div className="inline-block border border-emerald-950 bg-emerald-950/30 px-4 py-1.5 rounded-xl text-xs text-zinc-400 font-medium font-sans">
                  Menos de um café por dia.
                </div>
              </div>
              
              <div className="mt-10">
                <Link
                  to="/auth/register?offer=padrao&plan=anual"
                  className="w-full bg-[#006d3b] hover:bg-emerald-600 text-white py-4.5 rounded-2xl font-headline font-bold text-xs tracking-wider uppercase transition-all duration-300 shadow-md hover:shadow-lg active:scale-95 block text-center cursor-pointer font-sans"
                >
                  Quero Garantir Meu Acesso Fundador Agora!
                </Link>
                <p className="text-[10px] text-zinc-500 mt-4 text-center font-sans">
                  ✓ Acesso imediato • Pagamento 100% seguro • Cancele quando quiser
                </p>
                <p className="text-[10px] text-zinc-400 mt-6 font-sans leading-relaxed text-left">
                  Esta oferta de lançamento é por tempo limitado e exclusiva para quem fechar primeiro. Quando estas poucas vagas terminarem, o lote será encerrado e o valor será reajustado.
                </p>
              </div>
            </div>
          </div>

          {/* Footer note moved here below pricing cards */}
          <p className="text-[11px] text-zinc-500 max-w-3xl mx-auto mt-16 leading-relaxed text-center font-sans">
            * O Banana PRO não substitui todas as situações em que uma visita presencial seja necessária. Nosso objetivo é oferecer acompanhamento contínuo para apoiar as decisões do dia a dia da lavoura.
          </p>
        </div>
      </section>

      {/* 7 Days Guarantee Section — BLOCK 6.5 (Dark Background) */}
      <section className="py-20 bg-[#002417] text-white border-b border-emerald-950/60 reveal">
        <div className="max-w-4xl mx-auto px-6 md:px-10">
          <div className="bg-[#021c12]/60 backdrop-blur-md border border-emerald-900/40 rounded-[2.5rem] p-8 md:p-12 flex flex-col md:flex-row items-center gap-8 shadow-sm border-glow">
            {/* Seal Icon */}
            <div className="w-28 h-28 shrink-0">
              <img
                src="/images/selo_garantia.png"
                alt="7 Dias de Garantia Banana PRO"
                className="w-full h-full object-contain"
              />
            </div>
            {/* Content */}
            <div className="space-y-4 text-left">
              <h3 className="text-2xl font-headline font-bold text-white">Garantia Incondicional de 7 Dias</h3>
              <p className="text-zinc-300 font-sans text-xs md:text-sm leading-relaxed">
                Experimente o Banana PRO e tenha acesso a toda a nossa equipe de especialistas, comunidade e ferramentas. Se por qualquer motivo você achar que o acompanhamento não é para você dentro dos primeiros 7 dias, devolvemos todo o seu dinheiro de forma simples e rápida.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section — BLOCK 7 (Dark Background) */}
      <section className="py-24 bg-[#01140d] text-white border-b border-emerald-950/60 reveal" id="faq">
        <div className="max-w-3xl mx-auto px-6 md:px-10">
          <h2 className="font-headline text-3xl text-white font-bold text-center mb-16">Dúvidas Frequentes</h2>
          <div className="space-y-4 font-sans">
            <details className="group p-6 rounded-2xl border border-emerald-900/40 bg-[#021c12]/60 backdrop-blur-md transition-all duration-300 hover:border-tertiary-fixed/30 shadow-sm">
              <summary className="flex justify-between items-center cursor-pointer list-none font-headline font-semibold text-sm md:text-base text-white hover:text-tertiary-fixed transition-colors">
                Como funciona o suporte com os agrônomos?
                <span className="material-symbols-outlined group-open:rotate-180 transition-transform duration-300 text-zinc-400 font-sans">
                  expand_more
                </span>
              </summary>
              <div className="overflow-hidden transition-all duration-300">
                <p className="mt-4 text-xs md:text-sm text-zinc-300 leading-relaxed text-left">
                  Dentro da comunidade ou na área do painel de solo, você pode abrir chamados técnicos e enviar fotos e relatórios da sua plantação de bananas. Nossos engenheiros agrônomos devem responder em até 24h úteis fornecendo recomendações de tratamento.
                </p>
              </div>
            </details>

            <details className="group p-6 rounded-2xl border border-emerald-900/40 bg-[#021c12]/60 backdrop-blur-md transition-all duration-300 hover:border-tertiary-fixed/30 shadow-sm">
              <summary className="flex justify-between items-center cursor-pointer list-none font-headline font-semibold text-sm md:text-base text-white hover:text-tertiary-fixed transition-colors">
                Como tenho acesso aos cursos de bananicultura?
                <span className="material-symbols-outlined group-open:rotate-180 transition-transform duration-300 text-zinc-400 font-sans">
                  expand_more
                </span>
              </summary>
              <div className="overflow-hidden transition-all duration-300">
                <p className="mt-4 text-xs md:text-sm text-zinc-300 leading-relaxed text-left">
                  O acesso aos cursos e treinamentos técnicos é liberado imediatamente após a confirmação da sua assinatura. Você e sua equipe podem assistir às aulas teóricas e práticas (vídeos gravados e materiais PDF de apoio) de qualquer computador ou celular.
                </p>
              </div>
            </details>

            <details className="group p-6 rounded-2xl border border-emerald-900/40 bg-[#021c12]/60 backdrop-blur-md transition-all duration-300 hover:border-tertiary-fixed/30 shadow-sm">
              <summary className="flex justify-between items-center cursor-pointer list-none font-headline font-semibold text-sm md:text-base text-white hover:text-tertiary-fixed transition-colors">
                Consigo utilizar a plataforma offline no campo?
                <span className="material-symbols-outlined group-open:rotate-180 transition-transform duration-300 text-zinc-400 font-sans">
                  expand_more
                </span>
              </summary>
              <div className="overflow-hidden transition-all duration-300">
                <p className="mt-4 text-xs md:text-sm text-zinc-300 leading-relaxed text-left">
                  Sim! Você pode registrar seus custos, manejos e controle de estoque mesmo sem sinal de internet ou de celular no campo. Todas as suas informações ficam salvas de forma segura e são atualizadas automaticamente com o sistema assim que você se conectar a uma rede.
                </p>
              </div>
            </details>

            <details className="group p-6 rounded-2xl border border-emerald-900/40 bg-[#021c12]/60 backdrop-blur-md transition-all duration-300 hover:border-tertiary-fixed/30 shadow-sm">
              <summary className="flex justify-between items-center cursor-pointer list-none font-headline font-semibold text-sm md:text-base text-white hover:text-tertiary-fixed transition-colors">
                Quais variedades de banana a plataforma atende?
                <span className="material-symbols-outlined group-open:rotate-180 transition-transform duration-300 text-zinc-400 font-sans">
                  expand_more
                </span>
              </summary>
              <div className="overflow-hidden transition-all duration-300">
                <p className="mt-4 text-xs md:text-sm text-zinc-300 leading-relaxed text-left">
                  O Banana PRO possui parâmetros calibrados para as principais variedades cultivadas no Brasil, incluindo Banana Prata (Anã e Catarinense), Cavendish (Nanica/Nanicão), Banana Maçã, Banana da Terra e Banana Ouro.
                </p>
              </div>
            </details>

            <details className="group p-6 rounded-2xl border border-emerald-900/40 bg-[#021c12]/60 backdrop-blur-md transition-all duration-300 hover:border-tertiary-fixed/30 shadow-sm">
              <summary className="flex justify-between items-center cursor-pointer list-none font-headline font-semibold text-sm md:text-base text-white hover:text-tertiary-fixed transition-colors">
                Como funciona a interpretação da análise de solo?
                <span className="material-symbols-outlined group-open:rotate-180 transition-transform duration-300 text-zinc-400 font-sans">
                  expand_more
                </span>
              </summary>
              <div className="overflow-hidden transition-all duration-300">
                <p className="mt-4 text-xs md:text-sm text-zinc-300 leading-relaxed text-left">
                  Você insere os dados químicos do seu laudo (pH, P, K, Ca, Mg, etc.) e o sistema calcula instantaneamente a Soma de Bases (SB), Capacidade de Troca Catiônica (CTC), saturação por bases atual (V%) e a dose recomendada de calcário em toneladas por hectare (Necessidade de Calagem) calibrada especificamente para o bananicultor.
                </p>
              </div>
            </details>

            <details className="group p-6 rounded-2xl border border-emerald-900/40 bg-[#021c12]/60 backdrop-blur-md transition-all duration-300 hover:border-tertiary-fixed/30 shadow-sm">
              <summary className="flex justify-between items-center cursor-pointer list-none font-headline font-semibold text-sm md:text-base text-white hover:text-tertiary-fixed transition-colors">
                Posso cancelar a assinatura a qualquer momento?
                <span className="material-symbols-outlined group-open:rotate-180 transition-transform duration-300 text-zinc-400 font-sans">
                  expand_more
                </span>
              </summary>
              <div className="overflow-hidden transition-all duration-300">
                <p className="mt-4 text-xs md:text-sm text-zinc-300 leading-relaxed text-left">
                  Sim! O plano mensal não possui carência ou fidelidade, podendo ser cancelado com um clique no seu painel de configurações. O plano anual garante acesso por 12 meses, com renovação automática opcional.
                </p>
              </div>
            </details>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
