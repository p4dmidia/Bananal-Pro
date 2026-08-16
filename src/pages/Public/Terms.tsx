import React from "react";
import PublicLayout from "../../components/Layout/PublicLayout";
import { motion } from "motion/react";
import { Scale, CreditCard, ShieldAlert, Award, FileSpreadsheet, AlertTriangle } from "lucide-react";

export default function Terms() {
  const sections = [
    {
      icon: <Scale className="text-secondary-fixed w-5 h-5" />,
      title: "1. Aceite dos Termos",
      content: "Ao acessar, cadastrar-se ou utilizar a plataforma SaaS Banana PRO (disponível via PWA/Web), você declara aceitar integralmente e sem reservas estes Termos de Uso. Caso discorde de qualquer cláusula ou regra disposta neste documento, recomendamos que não conclua o seu cadastro e interrompa a utilização da plataforma imediatamente."
    },
    {
      icon: <Award className="text-secondary-fixed w-5 h-5" />,
      title: "2. Licença de Uso do SaaS",
      content: "O Banana PRO concede ao usuário uma licença de uso individual, revogável, intransferível e não exclusiva da plataforma SaaS. Esta licença é fornecida sob a modalidade de assinatura mensal ou anual e destina-se estritamente à gestão de suas propriedades agrícolas pessoais ou familiares. É expressamente vedado: (i) copiar, modificar, distribuir, vender ou alugar qualquer parte do software; (ii) fazer engenharia reversa; (iii) usar robôs de mineração de dados ou compartilhar suas credenciais de login com terceiros."
    },
    {
      icon: <ShieldAlert className="text-secondary-fixed w-5 h-5" />,
      title: "3. Limitação de Responsabilidade Agronômica",
      content: "As calculadoras do Banana PRO (incluindo Calagem, Interpretação de Química de Solo e Alertas Climáticos de Sigatoka) operam com base em tabelas literárias agrícolas validadas e algoritmos agronômicos padrão. Estas ferramentas servem como orientações operacionais de suporte ao manejo rural. Elas NÃO substituem a consulta, o diagnóstico de campo presencial e a assinatura de uma Anotação de Responsabilidade Técnica (ART) por um Engenheiro Agrônomo habilitado, exigida legalmente para a compra e prescrição de defensivos e determinados corretivos de solo. A aplicação prática das dosagens sugeridas é de responsabilidade exclusiva do produtor rural."
    },
    {
      icon: <CreditCard className="text-secondary-fixed w-5 h-5" />,
      title: "4. Planos, Assinatura e Cancelamento",
      content: "O acesso completo às ferramentas operacionais do Banana PRO é condicionado à manutenção de uma assinatura ativa. Oferecemos dois planos básicos: (i) Plano Mensal por R$ 97,00/mês, com cobrança recorrente automática; (ii) Plano Anual por R$ 799,00/ano, parcelado em até 12x no cartão de crédito. O cancelamento da assinatura pode ser solicitado a qualquer momento pelo painel do usuário e interromperá as renovações automáticas futuras, mantendo o acesso liberado até o final do ciclo já pago."
    },
    {
      icon: <FileSpreadsheet className="text-secondary-fixed w-5 h-5" />,
      title: "5. Uso do Fórum e Comunidade",
      content: "O fórum da Comunidade Banana PRO destina-se à troca saudável de experiências agrícolas, preços de cotação de banana e boas práticas de manejo no campo. O usuário compromete-se a não publicar conteúdos ofensivos, preconceituosos, difamatórios, propagandas políticas ou anúncios comerciais não autorizados de insumos. O Banana PRO reserva-se o direito de moderar, ocultar comentários e suspender contas que violarem recorrentemente as diretrizes da comunidade."
    },
    {
      icon: <AlertTriangle className="text-secondary-fixed w-5 h-5" />,
      title: "6. Alterações dos Termos e Legislação",
      content: "Reservamo-nos o direito de alterar estes Termos de Uso a qualquer momento para refletir melhorias no PWA, atualizações regulatórias ou mudanças nas regras comerciais de precificação. Alterações significativas serão notificadas na plataforma. Estes termos são regidos pelas leis da República Federativa do Brasil, elegendo-se o foro da comarca de Sete Lagoas/MG para dirimir eventuais controvérsias."
    }
  ];

  return (
    <PublicLayout>
      <div className="relative min-h-screen bg-grid overflow-hidden py-16">
        {/* Ambient Glows */}
        <div className="glow-spot glow-green top-[10%] left-[-10%]" />
        <div className="glow-spot glow-yellow bottom-[20%] right-[-10%]" />

        <div className="max-w-4xl mx-auto px-6 relative z-10 space-y-12">
          {/* Header */}
          <section className="text-center space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-2 bg-secondary-container/20 border border-secondary/30 px-4 py-2 rounded-full text-xs font-black uppercase tracking-widest text-secondary-fixed"
            >
              Contrato de Uso
            </motion.div>
            <motion.h1
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-4xl md:text-5xl font-display font-bold text-white"
            >
              Termos de Uso
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-on-surface-variant text-xs"
            >
              Última atualização: 30 de Maio de 2026. Leia atentamente as regras de uso.
            </motion.p>
          </section>

          {/* Terms content cards */}
          <div className="space-y-6">
            {sections.map((section, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.05 }}
                className="dark-glass rounded-[2rem] p-8 border border-white/5 space-y-4 hover:border-secondary/20 transition-all duration-300"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-secondary/15 flex items-center justify-center border border-secondary/20">
                    {section.icon}
                  </div>
                  <h2 className="text-lg font-bold text-white font-headline">{section.title}</h2>
                </div>
                <p className="text-on-surface-variant text-xs leading-relaxed font-sans">
                  {section.content}
                </p>
              </motion.div>
            ))}
          </div>

          {/* Warning Banner */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="p-8 rounded-[2rem] bg-amber-500/5 border border-amber-500/20 flex gap-4 items-start"
          >
            <AlertTriangle className="text-amber-400 shrink-0 w-6 h-6 mt-1" />
            <div className="space-y-2">
              <h3 className="text-white font-bold text-sm">AVISO IMPORTANTE AOS PRODUTORES</h3>
              <p className="text-on-surface-variant text-xs leading-relaxed">
                As dosagens e laudos de adubação e calagem calculados pela plataforma são estimativas teóricas aproximadas. O Banana PRO não se responsabiliza por prejuízos na safra decorrentes de aplicações incorretas, falta de acompanhamento presencial do engenheiro agrônomo ou variações climáticas atípicas.
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </PublicLayout>
  );
}
