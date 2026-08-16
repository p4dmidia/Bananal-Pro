import React, { useState } from "react";
import PublicLayout from "../../components/Layout/PublicLayout";
import { motion, AnimatePresence } from "motion/react";
import { 
  Mail, 
  Phone, 
  MapPin, 
  Send, 
  CheckCircle2, 
  MessageSquare,
  ArrowRight,
  Clock,
  HelpCircle
} from "lucide-react";

export default function Contact() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "suporte",
    message: ""
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    if (error) setError("");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic validation
    if (!formData.name.trim() || !formData.email.trim() || !formData.message.trim()) {
      setError("Por favor, preencha todos os campos obrigatórios (*).");
      return;
    }

    if (!/\S+@\S+\.\S+/.test(formData.email)) {
      setError("Por favor, insira um e-mail válido.");
      return;
    }

    setIsSubmitting(true);
    
    // Simulate API request
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSubmitted(true);
      setFormData({
        name: "",
        email: "",
        phone: "",
        subject: "suporte",
        message: ""
      });
    }, 1500);
  };

  return (
    <PublicLayout>
      <div className="relative min-h-screen bg-grid overflow-hidden py-16">
        {/* Volumetric ambient glows */}
        <div className="glow-spot glow-green top-[10%] left-[-10%]" />
        <div className="glow-spot glow-primary bottom-[10%] right-[-10%]" />

        <div className="max-w-7xl mx-auto px-6 relative z-10 space-y-16">
          {/* Header */}
          <section className="text-center space-y-6 max-w-3xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-2 bg-secondary-container/20 border border-secondary/30 px-4 py-2 rounded-full text-xs font-black uppercase tracking-widest text-secondary-fixed"
            >
              Fale Conosco
            </motion.div>
            <motion.h1
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-4xl md:text-6xl font-display font-bold leading-tight text-white"
            >
              Estamos aqui para <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-secondary-fixed to-tertiary-fixed font-black">
                apoiar seu plantio.
              </span>
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-on-surface-variant text-base md:text-lg max-w-xl mx-auto leading-relaxed"
            >
              Tem alguma dúvida sobre a nossa plataforma, precisa de suporte técnico ou quer falar diretamente com o nosso agrônomo especialista?
            </motion.p>
          </section>

          {/* Grid Layout: Contact Info & Form */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
            
            {/* Info Cards Column */}
            <motion.div 
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="lg:col-span-5 space-y-6"
            >
              {/* WhatsApp / Agronomist Support */}
              <div className="dark-glass rounded-[2rem] p-8 border border-white/5 space-y-6 relative overflow-hidden group hover:border-secondary/30 transition-all duration-300">
                <div className="absolute top-0 right-0 w-32 h-32 bg-secondary/5 blur-2xl rounded-full" />
                <div className="w-12 h-12 rounded-xl bg-secondary/15 flex items-center justify-center border border-secondary/20">
                  <MessageSquare className="text-secondary-fixed w-6 h-6" />
                </div>
                <div className="space-y-2">
                  <span className="text-[10px] font-black uppercase tracking-widest text-secondary-fixed">Suporte Técnico Humano</span>
                  <h3 className="text-xl font-bold text-white">Fale com nosso Agrônomo</h3>
                  <p className="text-on-surface-variant text-xs leading-relaxed">
                    Tire dúvidas técnicas de manejo, calagem e doenças diretamente pelo nosso canal exclusivo do WhatsApp.
                  </p>
                </div>
                <a 
                  href="https://wa.me/5521969014654" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 bg-secondary hover:bg-secondary-fixed text-white hover:text-primary-container px-6 py-3 rounded-xl font-bold text-xs tracking-wider uppercase transition-all duration-300 w-full justify-center shadow-lg shadow-secondary/10"
                >
                  Chamar no WhatsApp
                  <ArrowRight size={14} />
                </a>
              </div>

              {/* Direct Channels */}
              <div className="dark-glass rounded-[2rem] p-8 border border-white/5 space-y-6">
                <h3 className="text-lg font-bold text-white border-b border-outline-variant/30 pb-3">Canais Diretos</h3>
                
                <div className="space-y-4">
                  <div className="flex gap-4">
                    <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center shrink-0 border border-white/10">
                      <Mail className="text-secondary-fixed w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white">E-mail Comercial</h4>
                      <p className="text-on-surface-variant text-xs">contato@bananapro.com.br</p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center shrink-0 border border-white/10">
                      <Phone className="text-secondary-fixed w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white">Telefone Geral</h4>
                      <p className="text-on-surface-variant text-xs">+55 (31) 3771-0000</p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center shrink-0 border border-white/10">
                      <Clock className="text-secondary-fixed w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white">Horário de Atendimento</h4>
                      <p className="text-on-surface-variant text-xs">Segunda a Sexta, das 08h às 17h</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Office Location */}
              <div className="dark-glass rounded-[2rem] p-8 border border-white/5 space-y-4">
                <div className="flex gap-4">
                  <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center shrink-0 border border-white/10">
                    <MapPin className="text-secondary-fixed w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">Sede Administrativa</h3>
                    <p className="text-on-surface-variant text-xs leading-relaxed mt-1">
                      Av. Villa-Lobos, 120 - Mangabeiras<br />
                      Sete Lagoas - MG, CEP: 35700-110<br />
                      Brasil
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Contact Form Column */}
            <motion.div 
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
              className="lg:col-span-7"
            >
              <div className="dark-glass rounded-[2.5rem] p-8 md:p-12 border border-white/5 relative">
                <AnimatePresence mode="wait">
                  {!isSubmitted ? (
                    <motion.form 
                      key="form"
                      onSubmit={handleSubmit} 
                      className="space-y-6"
                      initial={{ opacity: 1 }}
                      exit={{ opacity: 0, y: -20 }}
                    >
                      <div>
                        <h2 className="text-2xl font-bold text-white">Envie uma Mensagem</h2>
                        <p className="text-on-surface-variant text-xs mt-1">Preencha o formulário abaixo e entraremos em contato o mais rápido possível.</p>
                      </div>

                      {error && (
                        <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl text-xs font-semibold">
                          {error}
                        </div>
                      )}

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <label htmlFor="name" className="text-[11px] font-bold text-white uppercase tracking-wider block">Nome Completo *</label>
                          <input 
                            type="text" 
                            id="name"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            placeholder="Seu nome"
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs text-white placeholder-zinc-500 focus:border-secondary/50 focus:outline-none transition-colors"
                          />
                        </div>

                        <div className="space-y-2">
                          <label htmlFor="email" className="text-[11px] font-bold text-white uppercase tracking-wider block">E-mail de Contato *</label>
                          <input 
                            type="email" 
                            id="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            placeholder="seu@email.com"
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs text-white placeholder-zinc-500 focus:border-secondary/50 focus:outline-none transition-colors"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <label htmlFor="phone" className="text-[11px] font-bold text-white uppercase tracking-wider block">WhatsApp / Celular</label>
                          <input 
                            type="tel" 
                            id="phone"
                            name="phone"
                            value={formData.phone}
                            onChange={handleChange}
                            placeholder="(00) 00000-0000"
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs text-white placeholder-zinc-500 focus:border-secondary/50 focus:outline-none transition-colors"
                          />
                        </div>

                        <div className="space-y-2">
                          <label htmlFor="subject" className="text-[11px] font-bold text-white uppercase tracking-wider block">Assunto *</label>
                          <select 
                            id="subject"
                            name="subject"
                            value={formData.subject}
                            onChange={handleChange}
                            className="w-full bg-zinc-900 border border-white/10 rounded-xl px-4 py-3 text-xs text-white focus:border-secondary/50 focus:outline-none transition-colors"
                          >
                            <option value="suporte">Suporte Técnico da Plataforma</option>
                            <option value="agronomo">Dúvida Técnica com Agrônomo</option>
                            <option value="financeiro">Financeiro / Assinatura</option>
                            <option value="parceria">Parcerias / Comercial</option>
                          </select>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label htmlFor="message" className="text-[11px] font-bold text-white uppercase tracking-wider block">Sua Mensagem *</label>
                        <textarea 
                          id="message"
                          name="message"
                          value={formData.message}
                          onChange={handleChange}
                          rows={5}
                          placeholder="Como podemos te ajudar no dia de hoje?"
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs text-white placeholder-zinc-500 focus:border-secondary/50 focus:outline-none transition-colors resize-none"
                        />
                      </div>

                      <button 
                        type="submit"
                        disabled={isSubmitting}
                        className="bg-secondary hover:bg-secondary-fixed text-white hover:text-primary-container px-8 py-4 rounded-xl font-bold text-xs tracking-wider uppercase transition-all duration-300 w-full flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-secondary/15 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isSubmitting ? (
                          <>
                            <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                            Enviando...
                          </>
                        ) : (
                          <>
                            Enviar Mensagem
                            <Send size={14} />
                          </>
                        )}
                      </button>
                    </motion.form>
                  ) : (
                    <motion.div 
                      key="success"
                      className="text-center py-12 space-y-6"
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0 }}
                    >
                      <div className="w-20 h-20 bg-secondary/15 border border-secondary/20 rounded-full flex items-center justify-center mx-auto">
                        <CheckCircle2 className="text-secondary-fixed w-10 h-10" />
                      </div>
                      <div className="space-y-2 max-w-md mx-auto">
                        <h2 className="text-2xl font-bold text-white">Mensagem Enviada!</h2>
                        <p className="text-on-surface-variant text-xs leading-relaxed">
                          Agradecemos o seu contato. Nossa equipe ou nosso engenheiro agrônomo analisará seu chamado e responderá no e-mail fornecido em até 24 horas úteis.
                        </p>
                      </div>
                      <button 
                        onClick={() => setIsSubmitted(false)}
                        className="bg-white/5 border border-white/10 hover:bg-white/10 text-white px-6 py-3 rounded-xl font-bold text-xs tracking-wider uppercase transition-all"
                      >
                        Enviar nova mensagem
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>

          </div>
        </div>
      </div>
    </PublicLayout>
  );
}
