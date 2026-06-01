import React, { useState } from "react";
import { motion } from "motion/react";
import { Mail, Lock, ArrowRight, Sprout, Globe, CheckCircle2, Loader2, AlertCircle, Eye, EyeOff } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabase";

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      navigate("/dashboard");
    } catch (err: any) {
      setError(err.message || "Erro ao realizar login. Verifique suas credenciais.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex flex-col md:flex-row overflow-hidden">
      {/* Left Side: Brand & Social Proof */}
      <div className="hidden md:flex md:w-1/2 bg-zinc-950 relative items-center justify-center p-12 overflow-hidden border-r border-white/5">
        <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-primary/20 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-accent/20 rounded-full blur-[120px] animate-pulse delay-700" />
        
        <div className="relative z-10 max-w-lg space-y-12">
          <Link to="/" className="flex items-center gap-3 mb-16">
            <div className="w-12 h-12 bg-primary rounded-2xl flex items-center justify-center shadow-lg shadow-primary/20">
              <Sprout className="text-white w-8 h-8" />
            </div>
            <span className="text-3xl font-display font-black tracking-tight text-white">Bananal PRO</span>
          </Link>

          <div className="space-y-6">
            <motion.h1 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="text-5xl font-display font-bold leading-tight text-white"
            >
              Acesse sua conta no <br /><span className="text-gradient">Bananal PRO</span>.
            </motion.h1>
            <p className="text-zinc-400 text-lg leading-relaxed">
              Faça a gestão da sua lavoura, use as calculadoras agrícolas e conecte-se com agrônomos e outros produtores.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {[
              "Segurança de dados ponta a ponta",
              "Gestão financeira simplificada",
              "Análise e Calagem de solo recomendadas",
              "Suporte técnico com engenheiro agrônomo"
            ].map((text, i) => (
              <div key={i} className="flex items-center gap-3 text-zinc-300 text-sm font-medium">
                <CheckCircle2 className="text-primary" size={18} />
                {text}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Side: Login Form */}
      <div className="flex-1 flex items-center justify-center p-6 md:p-12 bg-black relative">
        <div className="md:hidden absolute top-10 left-10">
          <Link to="/" className="flex items-center gap-2">
            <Sprout className="text-primary w-8 h-8" />
            <span className="text-xl font-display font-bold text-white">Bananal PRO</span>
          </Link>
        </div>

        <div className="absolute top-10 right-10 hidden md:flex items-center gap-2 text-zinc-500 text-xs font-bold uppercase tracking-widest cursor-pointer hover:text-white transition-colors">
          <Globe size={14} />
          <span>Português (BR)</span>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md space-y-8"
        >
          <Link 
            to="/" 
            className="inline-flex items-center gap-2 text-zinc-500 hover:text-white transition-colors text-sm font-bold group"
          >
            <ArrowRight className="w-4 h-4 rotate-180 group-hover:-translate-x-1 transition-transform" />
            Voltar ao Início
          </Link>

          <div className="space-y-2">
            <h2 className="text-3xl font-bold text-white">Bem-vindo de volta!</h2>
            <p className="text-zinc-500">Insira suas credenciais para acessar o sistema.</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            {error && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-red-500/10 border border-red-500/20 p-4 rounded-2xl flex items-center gap-3 text-red-500 text-sm"
              >
                <AlertCircle size={18} />
                {error}
              </motion.div>
            )}

            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-300 ml-1">E-mail</label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500 group-focus-within:text-primary transition-colors" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="exemplo@email.com"
                  className="w-full bg-zinc-900/50 border border-white/5 rounded-2xl py-4 pl-12 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all placeholder:text-zinc-600"
                  required
                  disabled={loading}
                  autoComplete="email"
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center px-1">
                <label className="text-sm font-medium text-zinc-300">Senha</label>
                <Link to="/auth/forgot-password" className="text-xs text-primary hover:underline font-bold">Esqueceu a senha?</Link>
              </div>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500 group-focus-within:text-primary transition-colors" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-zinc-900/50 border border-white/5 rounded-2xl py-4 pl-12 pr-12 text-white focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all placeholder:text-zinc-600"
                  required
                  disabled={loading}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2 px-1">
              <input type="checkbox" id="remember" className="accent-primary w-4 h-4 rounded border-white/10" />
              <label htmlFor="remember" className="text-xs text-zinc-500 font-medium cursor-pointer">Lembrar-me por 30 dias</label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary hover:bg-primary-dark text-white font-black py-4 rounded-2xl flex items-center justify-center gap-2 group transition-all shadow-xl shadow-primary/20 hover:scale-[1.01] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  Acessar Plataforma
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          <p className="text-center text-zinc-500 text-sm">
            Ainda não possui conta?{" "}
            <Link to="/auth/register" className="text-primary font-bold hover:underline">
              Crie sua conta agora
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
