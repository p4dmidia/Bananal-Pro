import React from "react";
import PublicLayout from "../../components/Layout/PublicLayout";
import { motion } from "motion/react";
import { 
  CreditCard, 
  ShoppingBag, 
  Sprout, 
  Wrench, 
  Truck, 
  FileText, 
  GraduationCap, 
  ChevronRight,
  ShieldCheck,
  Zap,
  Globe
} from "lucide-react";

const BENEFITS = [
  {
    icon: Sprout,
    title: "Insumos & Fertilizantes",
    description: "Descontos de até 15% em adubos, defensivos e fertilizantes foliares com distribuidores credenciados.",
    color: "text-emerald-400",
    bg: "bg-emerald-400/10"
  },
  {
    icon: ShoppingBag,
    title: "Embalagens & Logística",
    description: "Preços diferenciados na compra de caixas de papelão modelo exportação e nacional para transporte de bananas.",
    color: "text-orange-400",
    bg: "bg-orange-400/10"
  },
  {
    icon: GraduationCap,
    title: "Treinamentos & Cursos",
    description: "Acesso a workshops práticos, cursos técnicos de bananicultura e consultoria especializada com agrônomos.",
    color: "text-blue-400",
    bg: "bg-blue-400/10"
  },
  {
    icon: Wrench,
    title: "Máquinas & Ferramentas",
    description: "Condições especiais na aquisição de pulverizadores, sistemas de irrigação e ferramentas de colheita.",
    color: "text-purple-400",
    bg: "bg-purple-400/10"
  },
  {
    icon: Truck,
    title: "Frete & Combustível",
    description: "Parcerias com transportadoras e postos parceiros para baratear o escoamento da sua produção.",
    color: "text-cyan-400",
    bg: "bg-cyan-400/10"
  },
  {
    icon: FileText,
    title: "Análises de Solo",
    description: "Valores reduzidos em laboratórios credenciados para realização de análises químicas de solo e foliares.",
    color: "text-rose-400",
    bg: "bg-rose-400/10"
  }
];

export default function Benefits() {
  return (
    <PublicLayout>
      {/* Hero Section */}
      <section className="relative pt-20 pb-32 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-full pointer-events-none">
          <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-primary/10 rounded-full blur-[120px] animate-pulse" />
          <div className="absolute bottom-[10%] left-[-10%] w-[50%] h-[50%] bg-accent/10 rounded-full blur-[120px] animate-pulse delay-1000" />
        </div>

        <div className="max-w-7xl mx-auto px-6 relative z-10 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 bg-white/5 border border-white/10 px-4 py-2 rounded-full mb-8"
          >
            <CreditCard className="text-primary w-4 h-4" />
            <span className="text-xs font-bold uppercase tracking-widest text-zinc-400">Exclusivo para Membros</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-5xl md:text-7xl font-display font-bold leading-tight mb-8"
          >
            Um mundo de <span className="text-gradient">Benefícios</span> <br /> na palma da sua mão.
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-zinc-400 text-xl max-w-2xl mx-auto mb-12"
          >
            O Cartão de Produtor Banana PRO é a sua chave para economizar na compra de insumos agrícolas, caixas, mudas e serviços essenciais para o manejo do seu bananal.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <button className="bg-primary hover:bg-primary-dark text-white px-10 py-4 rounded-2xl font-black text-lg shadow-2xl shadow-primary/30 transition-all hover:scale-105 active:scale-95">
              Quero meu Cartão de Produtor
            </button>
            <button className="bg-white/5 hover:bg-white/10 text-white px-10 py-4 rounded-2xl font-black text-lg border border-white/10 transition-all">
              Ver lista de parceiros
            </button>
          </motion.div>
        </div>
      </section>

      {/* Card Visualizer */}
      <section className="pb-32">
        <div className="max-w-5xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="glass-card p-12 rounded-[3rem] border-white/10 relative overflow-hidden group"
          >
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div className="space-y-8">
                <h2 className="text-4xl font-display font-bold">O Cartão que <br /> <span className="text-primary">muda tudo.</span></h2>
                <div className="space-y-4">
                  {[
                    "Aceito em distribuidores credenciados",
                    "Sem taxa para produtores ativos",
                    "Descontos diretos na compra de insumos",
                    "Suporte técnico prioritário incluso"
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <div className="w-6 h-6 bg-primary/20 rounded-full flex items-center justify-center">
                        <ShieldCheck className="text-primary w-4 h-4" />
                      </div>
                      <span className="text-zinc-300 font-medium">{item}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="relative perspective-1000">
                <motion.div
                  animate={{ 
                    rotateY: [0, 5, 0, -5, 0],
                    rotateX: [0, 2, 0, -2, 0]
                  }}
                  transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                  className="w-full aspect-[1.6/1] bg-gradient-to-br from-zinc-800 to-black rounded-[2rem] border border-white/10 p-8 flex flex-col justify-between shadow-2xl shadow-black/50 relative overflow-hidden group-hover:border-primary/50 transition-colors"
                >
                  <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-primary/20 via-transparent to-transparent" />
                  
                  <div className="flex justify-between items-start relative z-10">
                    <div className="space-y-1">
                      <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-black">Produtor Banana PRO</p>
                      <Zap className="text-primary w-8 h-8" />
                    </div>
                    <Globe className="text-zinc-700 w-8 h-8" />
                  </div>

                  <div className="relative z-10">
                    <p className="text-xl font-mono tracking-[0.2em] text-white mb-2">•••• •••• •••• 8842</p>
                    <div className="flex justify-between items-end">
                      <div>
                        <p className="text-[8px] text-zinc-500 uppercase font-bold">Titular</p>
                        <p className="text-xs font-bold text-white uppercase tracking-widest">Alex Rivera</p>
                      </div>
                      <div className="w-12 h-8 bg-zinc-800/50 rounded-md border border-white/5" />
                    </div>
                  </div>
                </motion.div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Benefits Grid */}
      <section className="bg-zinc-950 py-32 border-y border-white/5">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-20">
            <h2 className="text-4xl font-display font-bold mb-4 text-white">Categorias de Benefícios</h2>
            <p className="text-zinc-500 text-lg">Tudo o que você precisa com a economia que você merece.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {BENEFITS.map((benefit, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="glass-card p-8 rounded-[2.5rem] border-white/5 hover:border-primary/30 transition-all group"
              >
                <div className={`w-16 h-16 ${benefit.bg} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                  <benefit.icon className={`${benefit.color} w-8 h-8`} />
                </div>
                <h3 className="text-2xl font-bold mb-4">{benefit.title}</h3>
                <p className="text-zinc-500 leading-relaxed mb-6">
                  {benefit.description}
                </p>
                <button className="flex items-center gap-2 text-sm font-bold text-primary group-hover:gap-3 transition-all">
                  Ver parceiros nesta categoria
                  <ChevronRight size={16} />
                </button>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-32">
        <div className="max-w-5xl mx-auto px-6 text-center">
          <div className="glass-card p-16 rounded-[4rem] border-primary/20 bg-primary/5 overflow-hidden relative">
            <div className="absolute top-0 left-0 w-full h-full bg-purple-gradient opacity-10 pointer-events-none" />
            <h2 className="text-4xl md:text-5xl font-display font-bold mb-8 relative z-10">Pronto para começar a <br /> economizar de verdade?</h2>
            <p className="text-zinc-400 text-lg mb-12 max-w-xl mx-auto relative z-10">
              Junte-se ao Banana PRO hoje e emita seu cartão digital instantaneamente após a ativação da sua conta.
            </p>
            <button className="bg-primary hover:bg-primary-dark text-white px-12 py-5 rounded-2xl font-black text-xl shadow-2xl shadow-primary/40 transition-all hover:scale-105 active:scale-95 relative z-10">
              Abrir minha conta gratuita
            </button>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
