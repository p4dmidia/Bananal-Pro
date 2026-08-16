import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Mail, ArrowLeft, CheckCircle2, Sprout, ArrowRight, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import toast from "react-hot-toast";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [isSent, setIsSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/login` // redirects them back to login page
      });

      if (error) throw error;

      setIsSent(true);
      toast.success("E-mail de recuperação enviado com sucesso!");
    } catch (err: any) {
      console.error("Error resetting password:", err);
      toast.error(err.message || "Erro ao solicitar recuperação de senha.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-on-surface flex items-center justify-center p-6 relative overflow-hidden">
      {/* Background Glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/20 rounded-full blur-[120px] animate-pulse" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-accent/20 rounded-full blur-[120px] animate-pulse delay-700" />

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md relative z-10"
      >
        <div className="bg-surface backdrop-blur-xl border border-outline/15 rounded-[2.5rem] p-10 shadow-2xl space-y-8">
          <div className="text-center space-y-4">
            <Link to="/" className="inline-flex items-center gap-2 mb-4">
              <Sprout className="text-primary w-8 h-8" />
              <span className="text-2xl font-display font-bold text-on-surface">Banana PRO</span>
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
                  <h1 className="text-3xl font-bold text-on-surface">Recuperar Senha</h1>
                  <p className="text-on-surface-variant text-sm">Insira seu e-mail para receber um link de redefinição.</p>
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
                  <h1 className="text-3xl font-bold text-on-surface">E-mail Enviado!</h1>
                  <p className="text-on-surface-variant text-sm px-4">Verifique sua caixa de entrada e siga as instruções para criar sua nova senha.</p>
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
                  <label className="text-sm font-medium text-on-surface ml-1">Seu E-mail</label>
                  <div className="relative group">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-on-surface-variant group-focus-within:text-primary transition-colors" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="seu@email.com"
                      className="w-full bg-background border border-outline/15 rounded-2xl py-4 pl-12 pr-4 text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all placeholder:text-on-surface-variant/40"
                      required
                      disabled={loading}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-primary hover:bg-emerald-700 text-white font-black py-4 rounded-2xl shadow-xl shadow-primary/20 transition-all hover:scale-[1.01] active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                >
                  {loading ? (
                    <>
                      <Loader2 size={20} className="animate-spin" />
                      Enviando...
                    </>
                  ) : (
                    <>
                      Enviar Link
                      <ArrowRight size={20} />
                    </>
                  )}
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
                  className="w-full bg-surface hover:bg-on-surface/5 text-on-surface font-bold py-4 rounded-2xl border border-outline/10 transition-all flex items-center justify-center gap-2"
                >
                  <ArrowLeft size={20} />
                  Voltar para o Login
                </Link>
              </motion.div>
            )}
          </AnimatePresence>

          {!isSent && (
            <div className="text-center pt-4">
              <Link to="/auth/login" className="text-sm font-bold text-on-surface-variant hover:text-primary transition-colors flex items-center justify-center gap-2">
                <ArrowLeft size={16} />
                Cancelar e voltar
              </Link>
            </div>
          )}
        </div>

        <p className="mt-12 text-center text-on-surface-variant text-xs font-medium uppercase tracking-widest leading-loose">
          Banana PRO System <br /> Secure Authentication Layer
        </p>
      </motion.div>
    </div>
  );
}
