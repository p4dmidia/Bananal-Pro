import React, { useState } from "react";
import { motion } from "motion/react";
import { Lock, ArrowRight, Sprout, CheckCircle2, Loader2, AlertCircle, Eye, EyeOff } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import { toast } from "react-hot-toast";

export default function ResetPassword() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password.length < 6) {
      setError("A nova senha deve ter pelo menos 6 caracteres.");
      return;
    }

    if (password !== confirmPassword) {
      setError("As senhas não coincidem. Digite a mesma senha nos dois campos.");
      return;
    }

    setLoading(true);

    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password: password,
      });

      if (updateError) throw updateError;

      setSuccess(true);
      toast.success("Sua nova senha foi cadastrada com sucesso! Faça login com ela.");

      // Encerra a sessão temporária de recuperação para que o usuário faça o login limpo com a nova senha
      await supabase.auth.signOut();

      setTimeout(() => {
        navigate("/auth/login", { replace: true });
      }, 1800);
    } catch (err: any) {
      console.error("Error updating password:", err);
      setError(err.message || "Erro ao redefinir sua senha. O link pode ter expirado.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-on-surface flex items-center justify-center p-6 relative overflow-hidden font-sans">
      {/* Background Glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-emerald-500/10 rounded-full blur-[120px] animate-pulse" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-emerald-700/10 rounded-full blur-[120px] animate-pulse delay-700" />

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md relative z-10"
      >
        <div className="bg-surface-container/60 backdrop-blur-xl border border-outline/15 rounded-[2.5rem] p-8 md:p-10 shadow-2xl space-y-8">
          <div className="text-center space-y-3">
            <Link to="/" className="inline-flex items-center gap-2 mb-2">
              <div className="w-10 h-10 bg-emerald-600 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-600/20">
                <Sprout className="text-white w-6 h-6" />
              </div>
              <span className="text-2xl font-bold tracking-tight text-white">Banana PRO</span>
            </Link>

            {!success ? (
              <>
                <h1 className="text-2xl md:text-3xl font-bold text-on-surface">Cadastrar Nova Senha</h1>
                <p className="text-on-surface-variant text-sm">
                  Crie uma senha de acesso segura para entrar usando seu e-mail e senha.
                </p>
              </>
            ) : (
              <div className="py-4 space-y-3 flex flex-col items-center">
                <div className="w-16 h-16 bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center">
                  <CheckCircle2 size={36} />
                </div>
                <h2 className="text-2xl font-bold text-white">Senha Atualizada!</h2>
                <p className="text-sm text-zinc-400">
                  Sua senha foi salva. Redirecionando para a tela de login...
                </p>
              </div>
            )}
          </div>

          {!success && (
            <form onSubmit={handleResetPassword} className="space-y-6">
              {/* Campo oculto para acessibilidade e gerenciadores de senha */}
              <input type="text" name="username" autoComplete="username" style={{ display: "none" }} tabIndex={-1} readOnly />

              {error && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-red-500/10 border border-red-500/20 p-4 rounded-2xl flex items-start gap-3 text-red-500 text-xs font-semibold"
                >
                  <AlertCircle className="shrink-0 mt-0.5" size={16} />
                  <span>{error}</span>
                </motion.div>
              )}

              <div className="space-y-2">
                <label className="text-sm font-semibold text-on-surface ml-1">Nova Senha</label>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-on-surface-variant group-focus-within:text-emerald-500 transition-colors" />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Mínimo de 6 caracteres"
                    className="w-full bg-surface border border-outline/15 rounded-2xl py-4 pl-12 pr-12 text-on-surface focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all text-sm placeholder:text-on-surface-variant/40"
                    required
                    minLength={6}
                    disabled={loading}
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface transition-colors cursor-pointer"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-on-surface ml-1">Confirmar Nova Senha</label>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-on-surface-variant group-focus-within:text-emerald-500 transition-colors" />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Digite a senha novamente"
                    className="w-full bg-surface border border-outline/15 rounded-2xl py-4 pl-12 pr-4 text-on-surface focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all text-sm placeholder:text-on-surface-variant/40"
                    required
                    minLength={6}
                    disabled={loading}
                    autoComplete="new-password"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold py-4 rounded-2xl shadow-xl shadow-emerald-900/20 transition-all hover:scale-[1.01] active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Salvando nova senha...
                  </>
                ) : (
                  <>
                    Salvar Nova Senha
                    <ArrowRight size={18} />
                  </>
                )}
              </button>
            </form>
          )}

          <div className="text-center pt-2">
            <Link
              to="/auth/login"
              className="text-xs font-bold text-on-surface-variant hover:text-on-surface transition-colors"
            >
              Voltar para o Login
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
