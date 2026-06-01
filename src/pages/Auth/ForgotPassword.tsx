import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Mail, ArrowLeft, CheckCircle2, Sprout, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

export default function ForgotPassword() {
  const [isSent, setIsSent] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSent(true);
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-6 relative overflow-hidden">
      {/* Background Glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/20 rounded-full blur-[120px] animate-pulse" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-accent/20 rounded-full blur-[120px] animate-pulse delay-700" />

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md relative z-10"
      >
        <div className="bg-zinc-900/50 backdrop-blur-xl border border-white/10 rounded-[2.5rem] p-10 shadow-2xl space-y-8">
          <div className="text-center space-y-4">
            <Link to="/" className="inline-flex items-center gap-2 mb-4">
              <Sprout className="text-primary w-8 h-8" />
              <span className="text-2xl font-display font-bold text-white">Bananal PRO</span>
            </Link>
            
            <AnimatePresence mode="wait">
              {!isSent ? (
                <motion.div
                  key="form-header"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-2"
                >
                  <h1 className="text-3xl font-bold text-white">Recuperar Senha</h1>
                  <p className="text-zinc-500 text-sm">Insira seu e-mail para receber um link de redefinição.</p>
                </motion.div>
              ) : (
                <motion.div
                  key="success-header"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-4 flex flex-col items-center"
                >
                  <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-2">
                    <CheckCircle2 className="text-primary w-10 h-10" />
                  </div>
                  <h1 className="text-3xl font-bold text-white">E-mail Enviado!</h1>
                  <p className="text-zinc-500 text-sm px-4">Verifique sua caixa de entrada e siga as instruções para criar sua nova senha.</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <AnimatePresence mode="wait">
            {!isSent ? (
              <motion.form 
                key="form"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onSubmit={handleSubmit} 
                className="space-y-6"
              >
                <div className="space-y-2">
                  <label className="text-sm font-medium text-zinc-300 ml-1">Seu E-mail</label>
                  <div className="relative group">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500 group-focus-within:text-primary transition-colors" />
                    <input
                      type="email"
                      placeholder="seu@email.com"
                      className="w-full bg-black/40 border border-white/5 rounded-2xl py-4 pl-12 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all placeholder:text-zinc-600"
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full bg-primary hover:bg-primary-dark text-white font-black py-4 rounded-2xl shadow-xl shadow-primary/20 transition-all hover:scale-[1.01] active:scale-[0.98] flex items-center justify-center gap-2"
                >
                  Enviar Link
                  <ArrowRight size={20} />
                </button>
              </motion.form>
            ) : (
              <motion.div
                key="success-action"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="pt-4"
              >
                <Link
                  to="/auth/login"
                  className="w-full bg-white/5 hover:bg-white/10 text-white font-bold py-4 rounded-2xl border border-white/5 transition-all flex items-center justify-center gap-2"
                >
                  <ArrowLeft size={20} />
                  Voltar para o Login
                </Link>
              </motion.div>
            )}
          </AnimatePresence>

          {!isSent && (
            <div className="text-center pt-4">
              <Link to="/auth/login" className="text-sm font-bold text-zinc-500 hover:text-primary transition-colors flex items-center justify-center gap-2">
                <ArrowLeft size={16} />
                Cancelar e voltar
              </Link>
            </div>
          )}
        </div>

        <p className="mt-12 text-center text-zinc-600 text-xs font-medium uppercase tracking-widest leading-loose">
          Bananal PRO System <br /> Secure Authentication Layer
        </p>
      </motion.div>
    </div>
  );
}
