import React from "react";
import PublicLayout from "../../components/Layout/PublicLayout";
import { motion } from "motion/react";
import { 
  Sprout, 
  Wallet, 
  Package, 
  CloudSun, 
  Calendar, 
  Camera, 
  CheckCircle2, 
  ArrowRight,
  TrendingUp
} from "lucide-react";
import { Link } from "react-router-dom";

export default function Tools() {
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

  return (
    <PublicLayout>
      <div className="space-y-24 py-16">
        
        {/* Hero Header */}
        <section className="max-w-7xl mx-auto px-6 text-center space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 bg-secondary-container/20 border border-secondary/30 px-4 py-2 rounded-full text-xs font-black uppercase tracking-widest text-secondary-fixed backdrop-blur-sm"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-secondary-fixed animate-pulse"></span>
            Tecnologia de Precisão
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-5xl md:text-6xl font-display font-bold leading-tight max-w-4xl mx-auto text-white"
          >
            Ferramentas Agrícolas <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-secondary-fixed to-tertiary-fixed font-black">
              que otimizam seu campo.
            </span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-zinc-300 text-base md:text-lg max-w-2xl mx-auto leading-relaxed"
          >
            Substitua planilhas complexas por painéis práticos desenhados exclusivamente para a bananicultura brasileira.
          </motion.p>
        </section>

        {/* Detailed Showcase Grid */}
        <section className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            {toolsList.map((tool, idx) => (
              <motion.div
                key={tool.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: (idx % 2) * 0.1 }}
                className="bg-white border border-zinc-200 p-8 md:p-10 rounded-[3rem] hover:border-secondary hover:shadow-xl transition-all shadow-sm flex flex-col justify-between"
              >
                <div className="space-y-6">
                  <div className="w-16 h-16 rounded-2xl bg-secondary/15 flex items-center justify-center border border-secondary/20">
                    {tool.icon}
                  </div>
                  <h3 className="text-2xl font-display font-bold text-primary">{tool.title}</h3>
                  <p className="text-zinc-500 text-xs leading-relaxed font-sans">{tool.desc}</p>
                  
                  <div className="space-y-2 pt-4 border-t border-zinc-100">
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
        </section>

        {/* Interactive Stats Callout */}
        <section className="max-w-7xl mx-auto px-6">
          <div className="bg-gradient-to-br from-[#012214] to-black rounded-[4rem] p-12 md:p-20 text-white relative overflow-hidden border border-white/10">
            <div className="absolute top-0 right-0 w-96 h-96 bg-primary/10 blur-[100px] rounded-full" />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center relative z-10">
              <div className="space-y-6">
                <span className="text-[10px] font-black uppercase tracking-widest text-secondary-fixed">Retorno Imediato</span>
                <h2 className="text-3xl md:text-4xl font-headline font-bold">Pronto para digitalizar sua lavoura?</h2>
                <p className="text-zinc-400 text-sm leading-relaxed">
                  Crie sua conta em menos de 2 minutos e tenha acesso imediato a todas as calculadoras, previsões e ao feed da comunidade.
                </p>
              </div>
              <div className="flex justify-end flex-wrap gap-4">
                <Link
                  to="/auth/register"
                  className="bg-secondary hover:bg-secondary-fixed text-white hover:text-primary-container px-8 py-4 rounded-xl font-bold text-sm tracking-wide transition-all shadow-lg shadow-secondary/20 flex items-center gap-2 cursor-pointer w-full sm:w-auto justify-center"
                >
                  Começar Agora
                  <ArrowRight size={16} />
                </Link>
                <Link
                  to="/contato"
                  className="bg-white/5 border border-white/10 hover:bg-white/10 text-white px-8 py-4 rounded-xl font-bold text-sm tracking-wide transition-all w-full sm:w-auto text-center"
                >
                  Falar com Consultor
                </Link>
              </div>
            </div>
          </div>
        </section>

      </div>
    </PublicLayout>
  );
}
