import React, { useEffect, useState, useRef } from "react";
import PublicLayout from "../components/Layout/PublicLayout";
import { Link } from "react-router-dom";
import { motion } from "motion/react";
import { 
  HeartHandshake, 
  UserCheck, 
  Users, 
  Wrench, 
  Coins, 
  TrendingUp 
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

  const pillarsList = [
    {
      id: "acompanhamento",
      icon: <HeartHandshake className="w-8 h-8" />,
      title: "Acompanhamento Contínuo",
      impactPhrase: "Sua lavoura acompanhada de perto por quem entende.",
      features: [
        "Não fique sozinho nas decisões da lavoura",
        "Receba orientação durante todo o ciclo",
        "Tire dúvidas sempre que precisar"
      ]
    },
    {
      id: "especialistas",
      icon: <UserCheck className="w-8 h-8" />,
      title: "Especialistas",
      impactPhrase: "Uma equipe acompanhando sua produção.",
      features: [
        "Jean Carlos",
        "Jhonatan",
        "Francisco"
      ]
    },
    {
      id: "comunidade",
      icon: <Users className="w-8 h-8" />,
      title: "Comunidade",
      impactPhrase: "Troca de experiências com produtores reais.",
      features: [
        "Troca de experiências",
        "Produtores reais",
        "Aprendizado coletivo"
      ]
    },
    {
      id: "ferramentas",
      icon: <Wrench className="w-8 h-8" />,
      title: "Ferramentas",
      impactPhrase: "Tecnologia simples e prática na palma da mão.",
      features: [
        "Calculadoras",
        "IA especializada",
        "Biblioteca técnica"
      ]
    },
    {
      id: "economia",
      icon: <Coins className="w-8 h-8" />,
      title: "Economia",
      impactPhrase: "Seu dinheiro rendendo mais no campo.",
      features: [
        "Evite erros caros",
        "Reduza desperdícios",
        "Mais lucro por hectare"
      ]
    },
    {
      id: "produtividade",
      icon: <TrendingUp className="w-8 h-8" />,
      title: "Produtividade",
      impactPhrase: "O caminho mais curto para a máxima rentabilidade.",
      features: [
        "Melhor manejo",
        "Melhor tomada de decisão",
        "Produza mais com segurança"
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
      {/* Hero Section */}
      <section className="relative min-h-[95vh] flex items-center overflow-hidden pt-12 pb-20 bg-[#002417]">
        {/* Realístic background image */}
        <div className="absolute inset-0 z-0">
          <img
            src="/images/banana_plantation_hero_bg_v2.png"
            alt="Banana Plantation Sunset"
            className="w-full h-full object-cover brightness-[0.24]"
          />
        </div>

        {/* Ambient Shadows */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#002417] via-transparent to-transparent z-1"></div>

        {/* Grid Container for Left Text Column only */}
        <div className="max-w-7xl mx-auto px-6 md:px-10 grid lg:grid-cols-12 gap-y-10 lg:gap-16 items-center w-full relative z-10 min-w-0">
          {/* Left Text Column */}
          <div className="lg:col-span-5 space-y-8 text-left w-full min-w-0">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-secondary-container/20 border border-secondary/30 backdrop-blur-md">
              <span className="w-1.5 h-1.5 rounded-full bg-secondary-fixed animate-pulse"></span>
              <span className="text-[9px] font-bold tracking-widest text-secondary-fixed uppercase font-inter">
                Acompanhamento & Comunidade
              </span>
            </div>

            <h1 className="font-headline text-3xl sm:text-4xl md:text-5xl lg:text-6xl text-white font-extrabold tracking-tight leading-[1.1] text-balance">
              Uma equipe ao seu lado durante todo o ciclo da bananicultura.
            </h1>

            <p className="font-sans text-sm md:text-base text-on-surface-variant leading-relaxed max-w-xl">
              Você não precisa enfrentar os desafios da sua lavoura sozinho. Receba suporte contínuo de agrônomos experientes, discussões com produtores e ferramentas de laudos de solo práticos.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 pt-2 w-full sm:w-auto">
              <a
                href="#planos"
                className="bg-secondary hover:bg-secondary-fixed text-white hover:text-primary-container px-8 py-4 rounded-xl font-headline font-bold text-sm tracking-wide transition-all border-glow duration-300 shadow-lg shadow-secondary/20 flex items-center justify-center gap-2 cursor-pointer w-full sm:w-auto text-center font-sans"
              >
                Entrar para a Comunidade
                <span className="material-symbols-outlined text-sm">arrow_forward</span>
              </a>
              <a
                href="#planos"
                className="bg-surface-container border border-outline-variant hover:border-secondary-fixed/50 hover:bg-surface-container-high px-8 py-4 rounded-xl font-headline font-bold text-sm tracking-wide text-white transition-all duration-300 flex items-center justify-center w-full sm:w-auto text-center font-sans"
              >
                Ver Soluções
              </a>
            </div>
          </div>
          
          {/* Empty right column placeholder for spacing in grid */}
          <div className="lg:col-span-7 h-[20vh] lg:h-0 pointer-events-none"></div>
        </div>

        {/* Absolute specialists container to touch the very bottom border of the head section */}
        <div className="absolute bottom-0 right-0 lg:right-[7%] xl:right-[10%] w-full lg:w-[45%] h-[50vh] lg:h-[80vh] flex items-end justify-center lg:justify-end overflow-visible pointer-events-none z-10">
          <img
            src="/images/specialists_hero.png"
            alt="Especialistas Bananal PRO"
            className="max-h-full object-contain object-bottom scale-[1.1] lg:scale-[1.38] xl:scale-[1.44] origin-bottom"
          />
        </div>
      </section>

      {/* Feature Showcase Grid (Linear Style) — BLOCK 2 (Visual Redesign) */}
      <section className="py-24 relative overflow-hidden bg-gradient-to-b from-slate-50 via-white to-slate-50 text-zinc-900 border-y border-zinc-200/50 reveal" id="ferramentas">
        {/* Subtle grid pattern background */}
        <div className="absolute inset-0 bg-[radial-gradient(#10b981_1px,transparent_1px)] [background-size:24px_24px] opacity-[0.04] pointer-events-none" />
        
        <div className="max-w-7xl mx-auto px-6 md:px-10 relative z-10">
          <div className="text-center max-w-3xl mx-auto mb-20 space-y-4">
            <span className="text-secondary font-semibold uppercase tracking-widest text-xs font-inter block">Pilares do Acompanhamento</span>
            <h2 className="font-headline text-2xl sm:text-3xl md:text-4xl text-primary font-bold tracking-tight">Como o Bananal PRO apoia o seu dia a dia.</h2>
            <p className="text-zinc-650 font-sans text-sm md:text-base leading-relaxed">
              Mais do que ferramentas, oferecemos um programa integrado de suporte e conhecimento prático para sua lavoura.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative z-10">
            {pillarsList.map((pillar, idx) => (
              <motion.div
                key={pillar.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: (idx % 3) * 0.1, duration: 0.6, ease: "easeOut" }}
                className="bg-white/80 backdrop-blur-sm border border-zinc-200/60 p-8 md:p-10 rounded-[2rem] hover:border-emerald-500/40 hover:shadow-2xl hover:shadow-emerald-900/5 hover:-translate-y-2 transition-all duration-500 ease-out flex flex-col justify-between group"
              >
                <div className="space-y-6">
                  {/* Icon with beautiful gradient background */}
                  <div className="w-16 h-16 rounded-2xl bg-emerald-50 border border-emerald-100/50 flex items-center justify-center text-emerald-600 transition-all duration-500 group-hover:scale-110 group-hover:rotate-3 group-hover:bg-emerald-500 group-hover:text-white group-hover:border-emerald-500 shadow-sm">
                    {pillar.icon}
                  </div>
                  
                  <div className="text-left space-y-2">
                    <h3 className="text-xl md:text-2xl font-headline font-bold text-primary tracking-tight transition-colors group-hover:text-emerald-950">
                      {pillar.title}
                    </h3>
                  </div>

                  {/* Checklist style */}
                  <div className="space-y-3.5 pt-2 text-left">
                    {pillar.features.map((feat, fidx) => (
                      <div key={fidx} className="flex items-start gap-3 group/item">
                        <div className="w-5 h-5 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center shrink-0 mt-0.5 shadow-sm group-hover:bg-emerald-500 group-hover:border-emerald-500 group-hover:text-white transition-all duration-300">
                          <svg className="w-3 h-3 text-emerald-600 group-hover:text-white transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                        <span className="text-zinc-650 text-sm font-medium font-sans leading-snug group-hover:text-zinc-900 transition-colors duration-200">
                          {feat}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Phrase of impact at the bottom with a divider */}
                <div className="mt-8 pt-5 border-t border-zinc-100 text-left">
                  <p className="text-emerald-800/90 font-sans text-[13px] font-semibold italic leading-relaxed group-hover:text-emerald-700 transition-colors duration-300">
                    "{pillar.impactPhrase}"
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Timeline Section — BLOCK 3 (Dark Background) */}
      <section className="py-24 relative overflow-hidden bg-[#002417] border-y border-emerald-900/50 reveal">
        <div className="max-w-7xl mx-auto px-6 md:px-10 grid lg:grid-cols-12 gap-y-12 lg:gap-16 items-center w-full relative z-10">
          {/* Left Message Column */}
          <div className="lg:col-span-5 space-y-6 text-left w-full min-w-0">
            <span className="text-secondary-fixed font-semibold uppercase tracking-widest text-xs font-inter block">Ciclo Completo</span>
            <h2 className="font-headline text-3xl sm:text-4xl text-white font-extrabold tracking-tight leading-tight">
              Acompanhamos todo o ciclo da banana
            </h2>
            <div className="border-l-2 border-secondary pl-6 py-2">
              <p className="font-sans text-lg md:text-xl text-emerald-100 font-medium leading-relaxed italic">
                "Em cada etapa existe uma decisão importante. E em cada etapa estaremos ao seu lado."
              </p>
            </div>
          </div>

          {/* Right Timeline Column */}
          <div className="lg:col-span-7 relative w-full min-w-0">
            {/* Timeline connection line */}
            <div className="absolute left-8 top-4 bottom-4 w-0.5 bg-emerald-800/40 hidden sm:block"></div>

            <div className="grid grid-cols-1 gap-6">
              {[
                { icon: "🌱", title: "Escolha da muda", desc: "Seleção genética de alta produtividade e livre de pragas." },
                { icon: "🚜", title: "Plantio", desc: "Espaçamento ideal e marcação precisa da área de cultivo." },
                { icon: "🌱", title: "Solo", desc: "Interpretação química e física para nutrição balanceada." },
                { icon: "💧", title: "Irrigação", desc: "Manejo hídrico ideal para o desenvolvimento do cacho." },
                { icon: "🌿", title: "Manejo", desc: "Desbaste, desfolha e condução técnica da planta." },
                { icon: "🦠", title: "Controle de doenças", desc: "Prevenção contra Sigatoka e fitossanidade foliar." },
                { icon: "🍌", title: "Enchimento", desc: "Nutrição e cuidados finais para caixas pesadas." },
                { icon: "🚛", title: "Colheita", desc: "Corte e transporte do cacho sem causar ferimentos." },
                { icon: "💰", title: "Comercialização", desc: "Classificação, embalagem e preço ideal de venda." }
              ].map((step, idx) => (
                <div key={idx} className="flex gap-4 items-start relative z-10 p-4 rounded-2xl bg-emerald-950/20 border border-emerald-900/10 sm:bg-transparent sm:border-transparent sm:p-0">
                  <div className="w-16 h-16 shrink-0 rounded-2xl bg-emerald-900/50 border border-emerald-700/30 flex items-center justify-center text-2xl shadow-md sm:ml-0.5">
                    {step.icon}
                  </div>
                  <div className="space-y-1 pt-1 text-left">
                    <h4 className="text-sm font-headline font-bold text-white flex items-center gap-2">
                      <span className="text-[10px] text-secondary font-mono">Etapa {idx + 1}</span>
                      • {step.title}
                    </h4>
                    <p className="text-xs text-emerald-100/70 font-sans leading-relaxed">{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Specialists Section — BLOCK 4 (White Background) */}
      <section className="py-24 bg-white text-zinc-900 border-b border-zinc-200/50 reveal" id="comunidade">
        <div className="max-w-7xl mx-auto px-6 md:px-10">
          <div className="text-center max-w-3xl mx-auto mb-20 space-y-4">
            <span className="text-secondary font-semibold uppercase tracking-widest text-xs font-inter block">Equipe de Apoio</span>
            <h2 className="font-headline text-3xl sm:text-4xl text-primary font-bold tracking-tight">Conheça quem vai acompanhar você</h2>
            <p className="text-zinc-650 font-sans text-sm md:text-base leading-relaxed">
              Você terá acesso direto a especialistas que entendem a realidade do campo e vivem a bananicultura no dia a dia.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                name: "Jean Carlos",
                role: "Produtor de Banana",
                bio: "Mais de 5 anos vivendo a bananicultura na prática.",
                image: "/images/jean.png",
                position: "object-center"
              },
              {
                name: "Jhonatan",
                role: "Engenheiro Agrônomo",
                bio: "Especialista em nutrição, manejo e sanidade da bananeira.",
                image: "/images/jhonatan.jpeg",
                position: "object-top"
              },
              {
                name: "Francisco",
                role: "Especialista em Biológicos",
                bio: "Mais de 20 anos de Experiência prática aplicada ao campo.",
                image: "/images/francisco.jpeg",
                position: "object-center"
              }
            ].map((spec, idx) => (
              <div key={idx} className="bg-slate-50 border border-zinc-200/80 rounded-[2.5rem] overflow-hidden hover:shadow-xl transition-all duration-300 flex flex-col hover:-translate-y-1">
                {/* Large Photo Container */}
                <div className="w-full h-80 overflow-hidden relative bg-zinc-100">
                  <img
                    src={spec.image}
                    alt={spec.name}
                    className={`w-full h-full object-cover ${spec.position}`}
                  />
                </div>
                {/* Content */}
                <div className="p-8 space-y-4 flex-1 flex flex-col justify-between text-left">
                  <div className="space-y-2">
                    <h3 className="text-2xl font-headline font-bold text-primary">{spec.name}</h3>
                    <p className="text-secondary font-bold text-xs uppercase tracking-wider font-inter">
                      {spec.role}
                    </p>
                    <p className="text-zinc-650 font-sans text-xs leading-relaxed pt-2 border-t border-zinc-200/60">
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

          {/* Comparison of Value Table */}
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto mb-16">
            {/* Consultoria Tradicional */}
            <div className="bg-slate-50 border border-zinc-200/80 p-8 rounded-[2.5rem] text-left space-y-4">
              <h3 className="text-xl font-headline font-bold text-primary flex items-center gap-2">
                Consultoria Tradicional
              </h3>
              <div className="text-2xl font-headline font-extrabold text-red-700">
                R$ 2.000 a R$ 2.500
                <span className="text-xs font-sans text-zinc-500 font-normal"> /visita</span>
              </div>
              <ul className="space-y-3.5 text-zinc-700 font-sans text-xs">
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

            {/* Bananal PRO */}
            <div className="bg-emerald-50/20 border border-emerald-500/30 p-8 rounded-[2.5rem] text-left space-y-4">
              <h3 className="text-xl font-headline font-bold text-emerald-850 flex items-center gap-2">
                Acompanhamento Bananal PRO
              </h3>
              <div className="text-2xl font-headline font-extrabold text-emerald-700">
                Acesso Contínuo
                <span className="text-xs font-sans text-zinc-500 font-normal"> /ano todo</span>
              </div>
              <ul className="space-y-3.5 text-zinc-700 font-sans text-xs">
                <li className="flex items-center gap-2">
                  <span className="text-emerald-600 shrink-0 font-bold">✓</span>
                  <span>Acompanhamento contínuo nas decisões diárias</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-emerald-600 shrink-0 font-bold">✓</span>
                  <span>Especialistas de prontidão para tirar dúvidas</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-emerald-600 shrink-0 font-bold">✓</span>
                  <span>Comunidade ativa com troca de experiências reais</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-emerald-600 shrink-0 font-bold">✓</span>
                  <span>Cursos, lives, ferramentas e conteúdos sempre atualizados</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Mensal */}
            <div className="bg-white border border-zinc-200/80 rounded-[2.5rem] p-8 md:p-10 relative flex flex-col justify-between shadow-sm hover:shadow-xl transition-all duration-300 text-left">
              <div>
                <span className="text-zinc-400 text-[11px] font-bold tracking-wider uppercase font-inter block">
                  Acesso Mensal Recorrente
                </span>
                
                <div className="mt-3">
                  <span className="bg-emerald-50 text-emerald-700 border border-emerald-200/50 text-[10px] font-extrabold px-3 py-1 rounded-full uppercase tracking-wider font-inter inline-block">
                    Flexibilidade Total
                  </span>
                </div>
                
                <p className="text-zinc-400 text-[11px] font-bold uppercase tracking-wider mt-8">
                  Por apenas:
                </p>
                
                <div className="mt-2 mb-1 flex items-baseline gap-1">
                  <span className="text-5xl font-black text-emerald-800 tracking-tight font-headline">R$ 97</span>
                  <span className="text-zinc-500 font-sans text-sm">/mês</span>
                </div>
                
                <p className="text-zinc-700 font-sans text-sm font-semibold mb-6">
                  Acesso mensal sem fidelidade
                </p>
                
                <div className="inline-block border border-zinc-200 bg-zinc-50/50 px-4 py-1.5 rounded-xl text-xs text-zinc-500 font-medium font-sans">
                  Ideal para testar os recursos.
                </div>
              </div>
              
              <div className="mt-10">
                <Link
                  to="/auth/register?offer=padrao&plan=mensal"
                  className="w-full bg-emerald-800 hover:bg-emerald-900 text-white py-4.5 rounded-2xl font-headline font-bold text-xs tracking-wider uppercase transition-all duration-300 active:scale-95 block text-center cursor-pointer"
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
            <div className="bg-white border-2 border-emerald-700/90 rounded-[2.5rem] p-8 md:p-10 relative flex flex-col justify-between overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 text-left">
              {/* Slanted banner top-right */}
              <div className="absolute top-0 right-0 bg-emerald-800 text-white text-[10px] font-black uppercase tracking-widest px-6 py-2 rounded-bl-2xl">
                Poucas Vagas
              </div>
              
              <div>
                <span className="text-zinc-400 text-[11px] font-bold tracking-wider uppercase font-inter block">
                  Acesso Completo de 1 Ano
                </span>
                
                <div className="mt-3 flex items-center gap-3">
                  <span className="text-zinc-400 line-through text-xs font-medium">De R$ 797/ano</span>
                  <span className="bg-emerald-50 text-emerald-700 border border-emerald-200/50 text-[10px] font-extrabold px-3 py-1 rounded-full uppercase tracking-wider font-inter inline-block">
                    Desconto Especial
                  </span>
                </div>
                
                <p className="text-zinc-400 text-[11px] font-bold uppercase tracking-wider mt-8">
                  Por apenas:
                </p>
                
                <div className="mt-2 mb-1 flex items-baseline gap-1.5 font-headline">
                  <span className="text-lg font-bold text-emerald-800">12x de</span>
                  <span className="text-5xl font-black text-emerald-800 tracking-tight">R$ 49,70</span>
                </div>
                
                <p className="text-zinc-700 font-sans text-sm font-semibold mb-6">
                  ou <span className="font-bold text-emerald-800">R$ 497 à vista</span> por um ano de acesso
                </p>
                
                <div className="inline-block border border-zinc-200 bg-zinc-50/50 px-4 py-1.5 rounded-xl text-xs text-zinc-500 font-medium font-sans">
                  Menos de um café por dia.
                </div>
              </div>
              
              <div className="mt-10">
                <Link
                  to="/auth/register?offer=padrao&plan=anual"
                  className="w-full bg-emerald-800 hover:bg-emerald-900 text-white py-4.5 rounded-2xl font-headline font-bold text-xs tracking-wider uppercase transition-all duration-300 shadow-md hover:shadow-lg active:scale-95 block text-center cursor-pointer font-sans"
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
            * O Bananal PRO não substitui todas as situações em que uma visita presencial seja necessária. Nosso objetivo é oferecer acompanhamento contínuo para apoiar as decisões do dia a dia da lavoura.
          </p>
        </div>
      </section>

      {/* 7 Days Guarantee Section */}
      <section className="py-20 bg-white text-zinc-900 border-b border-zinc-200/50 reveal">
        <div className="max-w-4xl mx-auto px-6 md:px-10">
          <div className="bg-emerald-50/20 border border-emerald-500/20 rounded-[2.5rem] p-8 md:p-12 flex flex-col md:flex-row items-center gap-8 shadow-sm">
            {/* Seal Icon */}
            <div className="w-28 h-28 shrink-0">
              <img
                src="/images/selo_garantia.png"
                alt="7 Dias de Garantia Bananal PRO"
                className="w-full h-full object-contain"
              />
            </div>
            {/* Content */}
            <div className="space-y-4 text-left">
              <h3 className="text-2xl font-headline font-bold text-primary">Garantia Incondicional de 7 Dias</h3>
              <p className="text-zinc-655 font-sans text-xs md:text-sm leading-relaxed">
                Experimente o Bananal PRO e tenha acesso a toda a nossa equipe de especialistas, comunidade e ferramentas. Se por qualquer motivo você achar que o acompanhamento não é para você dentro dos primeiros 7 dias, devolvemos todo o seu dinheiro de forma simples e rápida.
              </p>
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
                <p className="mt-4 text-xs md:text-sm text-zinc-600 leading-relaxed text-left">
                  Dentro do módulo de comunidade ou na área do painel de solo, você pode abrir chamados técnicos e enviar fotos e relatórios da sua plantação de bananas. Nossos engenheiros agrônomos devem responder em até 24h úteis fornecendo recomendações de tratamento.
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
                <p className="mt-4 text-xs md:text-sm text-zinc-600 leading-relaxed text-left">
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
                <p className="mt-4 text-xs md:text-sm text-zinc-600 leading-relaxed text-left">
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
                <p className="mt-4 text-xs md:text-sm text-zinc-600 leading-relaxed text-left">
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
                <p className="mt-4 text-xs md:text-sm text-zinc-600 leading-relaxed text-left">
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
                <p className="mt-4 text-xs md:text-sm text-zinc-600 leading-relaxed text-left">
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
                <p className="mt-4 text-xs md:text-sm text-zinc-600 leading-relaxed text-left">
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
                <p className="mt-4 text-xs md:text-sm text-zinc-600 leading-relaxed text-left">
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
                <p className="mt-4 text-xs md:text-sm text-zinc-600 leading-relaxed text-left">
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
                <p className="mt-4 text-xs md:text-sm text-zinc-600 leading-relaxed text-left">
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
