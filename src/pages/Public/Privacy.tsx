import React from "react";
import PublicLayout from "../../components/Layout/PublicLayout";
import { motion } from "motion/react";
import { ShieldCheck, FileText, Lock, Eye, Database, HelpCircle } from "lucide-react";

export default function Privacy() {
  const sections = [
    {
      icon: <ShieldCheck className="text-secondary-fixed w-5 h-5" />,
      title: "1. Introdução e Compromisso LGPD",
      content: "O Banana PRO está totalmente comprometido com a privacidade, segurança e proteção de dados de nossos usuários, em estrita conformidade com a Lei Geral de Proteção de Dados Pessoais (LGPD - Lei nº 13.709/2018). Como plataforma SaaS voltada para a bananicultura, entendemos que os dados de sua lavoura, relatórios de solo e informações financeiras constituem segredos comerciais e ativos cruciais do produtor rural. Esta política explica de forma clara e transparente como coletamos, armazenamos, tratamos e protegemos esses dados."
    },
    {
      icon: <Database className="text-secondary-fixed w-5 h-5" />,
      title: "2. Dados que Coletamos",
      content: "Coletamos dois tipos principais de informações: dados pessoais e dados operacionais agrícolas. Os dados pessoais incluem seu nome, e-mail, telefone/WhatsApp, CNPJ ou CPF para fins de faturamento e autenticação. Os dados operacionais agrícolas incluem informações cadastrais sobre glebas ou talhões de terra, resultados de laudos químicos laboratoriais de solo inseridos em nossas calculadoras de calagem, histórico de estoque de insumos NPK cadastrados, dados climáticos locais, orçamentos e despesas financeiras operacionais da fazenda para cálculo de Break-Even."
    },
    {
      icon: <Lock className="text-secondary-fixed w-5 h-5" />,
      title: "3. Finalidade do Tratamento de Dados",
      content: "O tratamento dos dados coletados tem finalidades específicas e legítimas vinculadas à entrega de nossos serviços SaaS: (i) Processar e exibir os cálculos de química de solo e recomendações de calagem específicas para suas glebas; (ii) Gerar relatórios e gráficos de fluxo de caixa e ponto de equilíbrio financeiro (Break-Even); (iii) Enviar previsões climáticas customizadas e alertas fitossanitários locais (como risco de Sigatoka); (iv) Permitir a interação segura no fórum da Comunidade; (v) Prestar suporte agronômico personalizado através do nosso WhatsApp de atendimento."
    },
    {
      icon: <Eye className="text-secondary-fixed w-5 h-5" />,
      title: "4. Confidencialidade e Não Compartilhamento",
      content: "Nós NUNCA venderemos, alugaremos ou compartilharemos os dados agronômicos, financeiros ou de solo da sua propriedade rural com indústrias de fertilizantes, tradings, instituições financeiras ou terceiros não autorizados para fins comerciais ou publicitários. Os dados da sua fazenda pertencem exclusivamente a você. O acesso aos dados por nossa equipe técnica e agrônomos de suporte só ocorrerá mediante sua solicitação expressa de assistência ou abertura de chamado."
    },
    {
      icon: <FileText className="text-secondary-fixed w-5 h-5" />,
      title: "5. Segurança e Armazenamento",
      content: "Todos os dados transmitidos para o Banana PRO são criptografados em trânsito usando protocolos de segurança HTTPS/SSL e armazenados em servidores de nuvem de alta segurança (Supabase/PostgreSQL) com backups automatizados periódicos. Implementamos rigorosos controles de acesso interno, garantindo que apenas usuários autenticados possam visualizar as informações de suas respectivas propriedades rurais."
    },
    {
      icon: <HelpCircle className="text-secondary-fixed w-5 h-5" />,
      title: "6. Seus Direitos como Titular",
      content: "Conforme assegurado pela LGPD, você possui direito a: (i) Confirmar a existência de tratamento de dados; (ii) Acessar a totalidade dos dados operacionais e pessoais armazenados; (iii) Solicitar a correção de dados incompletos ou inexatos; (iv) Solicitar a exclusão definitiva de seus dados de nossa base ao encerrar a assinatura da plataforma. Para exercer quaisquer destes direitos, basta entrar em contato direto pelo e-mail contato@bananapro.com.br."
    }
  ];

  return (
    <PublicLayout>
      <div className="relative min-h-screen bg-grid overflow-hidden py-16">
        {/* Ambient Glows */}
        <div className="glow-spot glow-green top-[10%] right-[-10%]" />
        <div className="glow-spot glow-yellow bottom-[20%] left-[-10%]" />

        <div className="max-w-4xl mx-auto px-6 relative z-10 space-y-12">
          {/* Header */}
          <section className="text-center space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-2 bg-secondary-container/20 border border-secondary/30 px-4 py-2 rounded-full text-xs font-black uppercase tracking-widest text-secondary-fixed"
            >
              Termos Legais
            </motion.div>
            <motion.h1
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-4xl md:text-5xl font-display font-bold text-white"
            >
              Política de Privacidade
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-on-surface-variant text-xs"
            >
              Última atualização: 30 de Maio de 2026. Em conformidade com a LGPD.
            </motion.p>
          </section>

          {/* Privacy content cards */}
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

          {/* Summary / Contact Callout */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="p-8 rounded-[2rem] bg-gradient-to-br from-secondary-container/10 to-[#012214]/30 border border-white/10 text-center space-y-4"
          >
            <h3 className="text-white font-bold text-sm">Dúvidas sobre a LGPD no Banana PRO?</h3>
            <p className="text-on-surface-variant text-xs max-w-xl mx-auto leading-relaxed">
              Dispomos de um Encarregado de Proteção de Dados (DPO) pronto para responder suas dúvidas sobre segurança digital no campo. Envie um e-mail com suas considerações.
            </p>
            <a 
              href="mailto:contato@bananapro.com.br"
              className="inline-block text-secondary-fixed hover:underline text-xs font-bold"
            >
              contato@bananapro.com.br
            </a>
          </motion.div>
        </div>
      </div>
    </PublicLayout>
  );
}
