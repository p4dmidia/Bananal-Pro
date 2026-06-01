import React from "react";
import PublicLayout from "../../components/Layout/PublicLayout";
import { motion } from "motion/react";
import { 
  Network, 
  PlayCircle, 
  CreditCard, 
  GraduationCap, 
  ArrowRight, 
  CheckCircle2, 
  TrendingUp,
  Zap,
  Users,
  Sprout
} from "lucide-react";

export default function HowItWorks() {
  const steps = [
    {
      icon: <Users className="text-primary" />,
      title: "1. Cadastre-se na Plataforma",
      description: "Crie sua conta como produtor rural e acesse o painel personalizado para iniciar a gestão do seu bananal."
    },
    {
      icon: <Network className="text-accent" />,
      title: "2. Monitore Solo e Insumos",
      description: "Utilize nossas calculadoras químicas de calagem e monitore a validade e estoque de defensivos e fertilizantes."
    },
    {
      icon: <PlayCircle className="text-primary" />,
      title: "3. Acompanhe Clima e Pragas",
      description: "Veja previsões climáticas ideais para pulverização e utilize o diagnóstico visual para identificar pragas nas folhas."
    },
    {
      icon: <GraduationCap className="text-accent" />,
      title: "4. Capacite-se e Conecte-se",
      description: "Assista a treinamentos técnicos sobre bananicultura e troque conhecimentos práticos no feed da comunidade."
    }
  ];

  return (
    <PublicLayout>
      <div className="space-y-32 py-20">
        {/* Hero Section */}
        <section className="max-w-7xl mx-auto px-6 text-center space-y-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 bg-white/5 border border-white/10 px-4 py-2 rounded-full text-xs font-black uppercase tracking-widest text-primary"
          >
            <Zap size={14} fill="currentColor" /> Ecossistema Bananal PRO
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-5xl md:text-7xl font-display font-bold leading-tight max-w-4xl mx-auto"
          >
            Como otimizamos sua <span className="text-primary">Produção</span> com <span className="text-accent">Tecnologia</span>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-zinc-400 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed"
          >
            O Bananal PRO une gestão técnica, monitoramento de solo, previsão climática e educação especializada em um único lugar.
          </motion.p>
        </section>

        {/* The Matrix Explanation */}
        <section className="relative overflow-hidden bg-zinc-900/50 py-32 border-y border-white/5">
          <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
            <div className="space-y-8 relative z-10">
              <h2 className="text-4xl font-display font-bold">Gestão Completa <br /> <span className="text-primary">do seu Bananal</span></h2>
              <p className="text-zinc-400 text-lg leading-relaxed">
                Nossa plataforma consolida o monitoramento técnico e financeiro do seu plantio de banana, oferecendo dados acionáveis e recomendações agronômicas precisas.
              </p>
              <div className="space-y-4">
                {[
                  "Cálculo automático de calagem e gessagem",
                  "Alertas de estoque mínimo e vencimento de insumos",
                  "Previsão de condições climáticas para pulverização",
                  "Faturamento e custo operacional por hectare"
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <CheckCircle2 className="text-primary" size={20} />
                    <span className="font-medium">{item}</span>
                  </div>
                ))}
              </div>
              <button className="bg-primary hover:bg-primary-dark text-white px-8 py-4 rounded-2xl font-bold flex items-center gap-3 transition-all">
                Conhecer Recursos
                <ArrowRight size={20} />
              </button>
            </div>
            
            <div className="relative group">
              <div className="absolute inset-0 bg-primary/20 blur-[100px] group-hover:bg-primary/30 transition-colors rounded-full" />
              <div className="relative bg-zinc-900 border border-white/10 p-12 rounded-[3rem] shadow-2xl">
                {/* Visual representation of soil analysis and indicators */}
                <div className="space-y-6">
                  <div className="flex justify-between items-center border-b border-white/5 pb-4">
                    <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Gleba Norte - Solo</span>
                    <span className="bg-emerald-500/10 text-emerald-400 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-500/20">Excelente</span>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    {[
                      { label: "pH (Água)", val: "6.2", desc: "Ideal" },
                      { label: "Fósforo P", val: "24.5", desc: "Adequado" },
                      { label: "Potássio K", val: "0.28", desc: "Adequado" },
                    ].map((item, idx) => (
                      <div key={idx} className="bg-white/5 border border-white/5 p-4 rounded-2xl text-center">
                        <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider block">{item.label}</span>
                        <span className="text-lg font-bold text-white block mt-1">{item.val}</span>
                        <span className="text-[8px] text-emerald-400 font-bold block mt-1">{item.desc}</span>
                      </div>
                    ))}
                  </div>
                  <div className="p-4 bg-primary/10 border border-primary/20 rounded-2xl flex items-center gap-3">
                    <Sprout className="text-primary shrink-0" size={16} />
                    <span className="text-[10px] text-zinc-300 leading-relaxed font-medium">Recomendação: Solo equilibrado, manter manejo nutricional.</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Steps Grid */}
        <section className="max-w-7xl mx-auto px-6">
          <div className="text-center space-y-4 mb-20">
            <h2 className="text-4xl font-display font-bold">Ciclo de Produtividade</h2>
            <p className="text-zinc-500">O caminho para o sucesso no Bananal PRO é simples e focado no campo.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {steps.map((step, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="bg-zinc-900/30 border border-white/5 p-8 rounded-[2.5rem] hover:bg-zinc-800/50 transition-all group"
              >
                <div className="w-14 h-14 bg-white/5 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  {step.icon}
                </div>
                <h3 className="text-xl font-bold mb-4">{step.title}</h3>
                <p className="text-zinc-500 text-sm leading-relaxed">{step.description}</p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Benefits Cards Section */}
        <section className="max-w-7xl mx-auto px-6">
          <div className="bg-gradient-to-br from-primary/10 to-accent/10 border border-white/10 rounded-[4rem] p-12 md:p-20 overflow-hidden relative">
            <div className="absolute top-0 right-0 w-96 h-96 bg-primary/20 blur-[120px] -mr-48 -mt-48 rounded-full" />
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center relative z-10">
              <div className="space-y-8">
                <h2 className="text-4xl font-display font-bold">Economize na compra <br />de <span className="text-accent">Insumos Agrícolas</span></h2>
                <p className="text-zinc-300 text-lg leading-relaxed">
                  Ao fazer parte do Bananal PRO, você ganha acesso a convênios de descontos em fertilizantes, mudas certificadas, defensivos e caixas de papelão em distribuidores parceiros.
                </p>
                <div className="flex items-center gap-4 text-white font-bold">
                  <div className="flex -space-x-4">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="w-12 h-12 rounded-full border-2 border-zinc-900 overflow-hidden">
                        <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${i}`} alt="" />
                      </div>
                    ))}
                  </div>
                  <p className="text-sm">Junte-se a milhares de produtores</p>
                </div>
              </div>
              
              <div className="flex justify-center">
                <motion.div
                  whileHover={{ rotateY: 15, rotateX: -5 }}
                  className="w-full max-w-sm aspect-[1.6/1] bg-gradient-to-br from-zinc-800 to-black rounded-3xl border border-white/20 p-8 shadow-2xl relative overflow-hidden group preserve-3d"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="flex justify-between items-start mb-12">
                    <div className="w-12 h-12 bg-white/5 rounded-xl flex items-center justify-center">
                      <Users className="text-primary w-8 h-8" />
                    </div>
                    <CreditCard className="text-zinc-500" />
                  </div>
                  <div className="space-y-2">
                    <p className="text-[10px] text-zinc-500 uppercase tracking-[0.3em] font-black">Cartão de Produtor Bananal PRO</p>
                    <p className="text-xl font-display font-bold tracking-widest text-white">PROD • 8842 • 9102 • 001</p>
                  </div>
                  <div className="mt-8 flex justify-between items-end">
                    <p className="text-sm font-bold text-zinc-400">ALEX RIVERA</p>
                    <div className="flex gap-1">
                      <div className="w-8 h-8 bg-primary/20 rounded-full" />
                      <div className="w-8 h-8 bg-accent/20 rounded-full" />
                    </div>
                  </div>
                </motion.div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="max-w-7xl mx-auto px-6 text-center space-y-12 pb-20">
          <h2 className="text-5xl font-display font-bold">Pronto para começar sua <br /> <span className="text-gradient">jornada tecnológica?</span></h2>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
            <button className="w-full sm:w-auto bg-primary hover:bg-primary-dark text-white px-12 py-5 rounded-2xl font-bold text-lg transition-all shadow-xl shadow-primary/20">
              Começar Agora Gratuitamente
            </button>
            <button className="w-full sm:w-auto bg-white/5 hover:bg-white/10 text-white px-12 py-5 rounded-2xl font-bold text-lg border border-white/10 transition-all">
              Falar com um Consultor
            </button>
          </div>
          <p className="text-zinc-500 text-sm">Sem taxas ocultas. Cancele quando quiser.</p>
        </section>
      </div>
    </PublicLayout>
  );
}
