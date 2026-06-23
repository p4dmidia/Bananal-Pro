import React, { useState } from "react";
import { motion } from "motion/react";
import { Mail, Lock, ArrowRight, Sprout, Globe, CheckCircle2, Loader2, AlertCircle, Eye, EyeOff } from "lucide-react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import { toast } from "react-hot-toast";

export default function Login() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const offerSlug = searchParams.get("offer");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    setError(null);
    try {
      const redirectTo = offerSlug 
        ? `${window.location.origin}/checkout/${offerSlug}` 
        : `${window.location.origin}/dashboard`;

      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo },
      });

      if (error) throw error;
    } catch (err: any) {
      console.error("Google login error:", err);
      toast.error("Erro ao autenticar com o Google.");
      setGoogleLoading(false);
    }
  };

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

      if (offerSlug) {
        navigate(`/checkout/${offerSlug}`);
      } else {
        navigate("/dashboard");
      }
    } catch (err: any) {
      setError(err.message || "Erro ao realizar login. Verifique suas credenciais.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-on-surface flex flex-col md:flex-row overflow-hidden font-sans">
      {/* Left Side: Brand & Social Proof */}
      <div className="hidden md:flex md:w-1/2 bg-surface-container relative items-center justify-center p-12 overflow-hidden border-r border-outline/10">
        <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-emerald-500/10 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-emerald-700/10 rounded-full blur-[120px] animate-pulse delay-700" />
        
        <div className="relative z-10 max-w-lg space-y-12">
          <Link to="/" className="flex items-center gap-3 mb-16">
            <div className="w-12 h-12 bg-emerald-600 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-600/20">
              <Sprout className="text-white w-8 h-8" />
            </div>
            <span className="text-3xl font-bold tracking-tight text-white">Bananal PRO</span>
          </Link>

          <div className="space-y-6">
            <motion.h1 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="text-5xl font-bold leading-tight text-on-surface"
            >
              Acesse sua conta no <br /><span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 to-teal-600 font-extrabold">Bananal PRO</span>.
            </motion.h1>
            <p className="text-on-surface-variant text-lg leading-relaxed">
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
              <div key={i} className="flex items-center gap-3 text-on-surface text-sm font-semibold">
                <CheckCircle2 className="text-emerald-500" size={18} />
                {text}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Side: Login Form */}
      <div className="flex-1 flex items-center justify-center p-6 md:p-12 bg-background relative">
        <div className="md:hidden absolute top-10 left-10">
          <Link to="/" className="flex items-center gap-2">
            <Sprout className="text-emerald-500 w-8 h-8" />
            <span className="text-xl font-bold text-on-surface">Bananal PRO</span>
          </Link>
        </div>

        <div className="absolute top-10 right-10 hidden md:flex items-center gap-2 text-on-surface-variant text-xs font-bold uppercase tracking-widest cursor-pointer hover:text-on-surface transition-colors">
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
            className="inline-flex items-center gap-2 text-on-surface-variant hover:text-on-surface transition-colors text-sm font-bold group"
          >
            <ArrowRight className="w-4 h-4 rotate-180 group-hover:-translate-x-1 transition-transform" />
            Voltar ao Início
          </Link>

          <div className="space-y-2 text-center md:text-left">
            <h2 className="text-3xl font-extrabold text-on-surface">Bem-vindo de volta!</h2>
            <p className="text-on-surface-variant">Insira suas credenciais para acessar o sistema.</p>
          </div>

          {/* Google Login Button */}
          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={googleLoading || loading}
            className="w-full bg-white text-zinc-900 font-bold py-3.5 px-4 rounded-2xl flex items-center justify-center gap-3 transition-all hover:bg-zinc-100 active:scale-[0.98] border border-zinc-200 cursor-pointer disabled:opacity-50"
          >
            {googleLoading ? (
              <Loader2 className="w-5 h-5 animate-spin text-zinc-950" />
            ) : (
              <>
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.85z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.85c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                Entrar com o Google
              </>
            )}
          </button>

          <div className="relative flex py-2 items-center">
            <div className="flex-grow border-t border-outline/10"></div>
            <span className="flex-shrink mx-4 text-on-surface-variant text-xs font-bold uppercase tracking-wider">Ou</span>
            <div className="flex-grow border-t border-outline/10"></div>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            {error && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-red-500/10 border border-red-500/20 p-4 rounded-2xl flex items-center gap-3 text-red-500 text-sm font-semibold"
              >
                <AlertCircle className="shrink-0" size={18} />
                {error}
              </motion.div>
            )}

            <div className="space-y-2">
              <label className="text-sm font-semibold text-on-surface ml-1">E-mail</label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-on-surface-variant group-focus-within:text-emerald-500 transition-colors" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="exemplo@email.com"
                  className="w-full bg-surface border border-outline/15 rounded-2xl py-4 pl-12 pr-4 text-on-surface focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all text-sm placeholder:text-on-surface-variant/40"
                  required
                  disabled={loading}
                  autoComplete="email"
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center px-1">
                <label className="text-sm font-semibold text-on-surface">Senha</label>
                <Link to="/auth/forgot-password" className="text-xs text-emerald-500 hover:underline font-bold">Esqueceu a senha?</Link>
              </div>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-on-surface-variant group-focus-within:text-emerald-500 transition-colors" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-surface border border-outline/15 rounded-2xl py-4 pl-12 pr-12 text-on-surface focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all text-sm placeholder:text-on-surface-variant/40"
                  required
                  disabled={loading}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface transition-colors"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2 px-1">
              <input type="checkbox" id="remember" className="accent-emerald-600 w-4 h-4 rounded border-outline/10 cursor-pointer" />
              <label htmlFor="remember" className="text-xs text-on-surface-variant font-semibold cursor-pointer select-none">Lembrar-me por 30 dias</label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2 group transition-all shadow-xl shadow-emerald-600/20 hover:scale-[1.01] active:scale-[0.98] disabled:opacity-50 cursor-pointer mt-6"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin text-white" />
              ) : (
                <>
                  Acessar Plataforma
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          <p className="text-center text-on-surface-variant text-sm pt-4 border-t border-outline/10">
            Ainda não possui conta?{" "}
            <Link to={offerSlug ? `/auth/register?offer=${offerSlug}` : "/auth/register"} className="text-emerald-500 font-bold hover:underline">
              Crie sua conta agora
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
