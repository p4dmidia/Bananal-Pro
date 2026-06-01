import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import { Mail, Lock, ArrowRight, User, Sprout, Globe, CheckCircle2, Loader2, AlertCircle, Eye, EyeOff } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import { toast } from "react-hot-toast";

const BRAZILIAN_STATES = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 
  'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 
  'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
];

export default function Register() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    fullName: "",
    username: "",
    email: "",
    password: "",
    whatsapp: "",
    cpfCnpj: "",
    cep: "",
    address: "",
    number: "",
    complement: "",
    neighborhood: "",
    city: "",
    state: "",
  });
  const [loading, setLoading] = useState(false);
  const [cepLoading, setCepLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // 1. Basic Validations
    if (formData.password.length < 6) {
      setError("A senha deve ter pelo menos 6 caracteres.");
      setLoading(false);
      return;
    }

    try {

      // 3. Check if username (referral_code) is already taken
      const { data: userData, error: userCheckError } = await supabase
        .from("user_profiles")
        .select("id")
        .eq("referral_code", formData.username)
        .maybeSingle();

      if (userData) {
        setError("Este nome de usuário já está sendo utilizado.");
        setLoading(false);
        return;
      }

      // 4. Check if CPF/CNPJ is already taken
      const { data: cpfData, error: cpfCheckError } = await supabase
        .from("user_profiles")
        .select("id")
        .eq("cpf", formData.cpfCnpj)
        .maybeSingle();

      if (cpfData) {
        setError("Este CPF/CNPJ já está cadastrado no sistema.");
        setLoading(false);
        return;
      }

      // 5. Proceed with Registration
      const nameParts = formData.fullName.trim().split(" ");
      const firstName = nameParts[0] || "";
      const lastName = nameParts.slice(1).join(" ") || "";

      const { data, error: signUpError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            login: formData.username,
            firstName: firstName,
            lastName: lastName,
            whatsapp: formData.whatsapp,
            cpfCnpj: formData.cpfCnpj,
            cep: formData.cep,
            address: formData.address,
            number: formData.number,
            complement: formData.complement,
            neighborhood: formData.neighborhood,
            city: formData.city,
            state: formData.state,
          },
        },
      });

      if (signUpError) throw signUpError;

      if (data.user && data.session) {
        toast.success("Cadastro realizado com sucesso!");
        navigate("/dashboard");
      } else {
        toast.success("Conta criada! Verifique seu e-mail.");
        navigate("/auth/login");
      }
    } catch (err: any) {
      console.error("Registration error:", err);
      setError(err.message || "Erro ao realizar cadastro. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const handleCepChange = async (cepValue: string) => {
    // Apenas números
    const cleanCep = cepValue.replace(/\D/g, "");
    setFormData(prev => ({ ...prev, cep: cleanCep }));

    if (cleanCep.length === 8) {
      setCepLoading(true);
      try {
        const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
        const data = await response.json();
        
        if (!data.erro) {
          setFormData(prev => ({
            ...prev,
            address: data.logradouro || "",
            neighborhood: data.bairro || "",
            city: data.localidade || "",
            state: data.uf || "",
          }));
          toast.success("Endereço preenchido automaticamente!");
        } else {
          toast.error("CEP não encontrado.");
        }
      } catch (err) {
        console.error("Error fetching CEP:", err);
        toast.error("Erro ao buscar CEP.");
      } finally {
        setCepLoading(false);
      }
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    if (name === "cep") {
      handleCepChange(value);
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  return (
    <div className="min-h-screen bg-black flex flex-col md:flex-row overflow-hidden">
      {/* Left Side: Brand & Benefits */}
      <div className="hidden md:flex md:w-1/2 bg-zinc-950 relative items-center justify-center p-12 overflow-hidden border-r border-white/5">
        <div className="absolute top-[-10%] right-[-10%] w-[60%] h-[60%] bg-accent/20 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[60%] h-[60%] bg-primary/20 rounded-full blur-[120px] animate-pulse delay-700" />
        
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
              Tudo que o produtor <br />de banana precisa <br /><span className="text-gradient">em um só lugar</span>.
            </motion.h1>
            <p className="text-zinc-400 text-lg leading-relaxed">
              Faça parte da maior plataforma de bananicultura do Brasil. Tenha acesso a ferramentas de precisão, análises de solo e suporte técnico especializado.
            </p>
          </div>

          <div className="space-y-4">
            {[
              "Calculadoras Agrícolas e Análise de Solo",
              "Diagnóstico Visual de Pragas e Doenças",
              "Gestão Financeira e Estoque de Insumos",
              "Treinamentos Técnicos e Comunidade Exclusiva"
            ].map((text, i) => (
              <div key={i} className="flex items-center gap-3 text-zinc-300 text-sm font-medium bg-white/5 p-4 rounded-2xl border border-white/5">
                <CheckCircle2 className="text-primary" size={18} />
                {text}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Side: Register Form */}
      <div className="flex-1 flex items-center justify-center p-6 md:p-12 bg-black relative overflow-y-auto">
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
          className="w-full max-w-md space-y-8 py-12"
        >
          <Link 
            to="/" 
            className="inline-flex items-center gap-2 text-zinc-500 hover:text-white transition-colors text-sm font-bold group"
          >
            <ArrowRight className="w-4 h-4 rotate-180 group-hover:-translate-x-1 transition-transform" />
            Voltar ao Início
          </Link>

          <div className="space-y-2">
            <h2 className="text-3xl font-bold text-white">Criar nova conta</h2>
            <p className="text-zinc-500">Preencha os dados abaixo para criar sua conta de produtor.</p>
          </div>

          <form onSubmit={handleRegister} className="space-y-5">
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



            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-300 ml-1">Nome Completo</label>
                <div className="relative group">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500 group-focus-within:text-primary transition-colors" />
                  <input
                    type="text"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleChange}
                    placeholder="Seu nome"
                    className="w-full bg-zinc-900/50 border border-white/5 rounded-2xl py-4 pl-12 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all text-sm"
                    required
                    disabled={loading}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-300 ml-1">Usuário</label>
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  placeholder="Nome de usuário"
                  className="w-full bg-zinc-900/50 border border-white/5 rounded-2xl py-4 px-4 text-white focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all text-sm"
                  required
                  disabled={loading}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-300 ml-1">CPF OU CNPJ</label>
                <input
                  type="text"
                  name="cpfCnpj"
                  value={formData.cpfCnpj}
                  onChange={handleChange}
                  placeholder="000.000.000-00"
                  className="w-full bg-zinc-900/50 border border-white/5 rounded-2xl py-4 px-4 text-white focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all text-sm"
                  required
                  disabled={loading}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-300 ml-1">WhatsApp</label>
                <input
                  type="text"
                  name="whatsapp"
                  value={formData.whatsapp}
                  onChange={handleChange}
                  placeholder="(00) 00000-0000"
                  className="w-full bg-zinc-900/50 border border-white/5 rounded-2xl py-4 px-4 text-white focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all text-sm"
                  required
                  disabled={loading}
                />
              </div>
            </div>

            {/* Endereço / Localização */}
            <div className="border-t border-white/5 pt-4">
              <h3 className="text-xs font-bold text-primary uppercase tracking-widest mb-4">Dados de Localização</h3>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-300 ml-1">CEP</label>
                <div className="relative">
                  <input
                    type="text"
                    name="cep"
                    value={formData.cep}
                    onChange={handleChange}
                    placeholder="00000-000"
                    maxLength={9}
                    className="w-full bg-zinc-900/50 border border-white/5 rounded-2xl py-4 px-4 text-white focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all text-sm"
                    required
                    disabled={loading || cepLoading}
                  />
                  {cepLoading && (
                    <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-primary animate-spin" />
                  )}
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-300 ml-1">Estado (UF)</label>
                <select
                  name="state"
                  value={formData.state}
                  onChange={handleChange}
                  className="w-full bg-zinc-900 border-none rounded-2xl py-4 px-4 text-white focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all text-sm h-[54px] cursor-pointer"
                  required
                  disabled={loading}
                >
                  <option value="" disabled>Selecione...</option>
                  {BRAZILIAN_STATES.map(uf => (
                    <option key={uf} value={uf}>{uf}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-300 ml-1">Cidade</label>
                <input
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  placeholder="Cidade"
                  className="w-full bg-zinc-900/50 border border-white/5 rounded-2xl py-4 px-4 text-white focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all text-sm"
                  required
                  disabled={loading}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-300 ml-1">Bairro</label>
                <input
                  type="text"
                  name="neighborhood"
                  value={formData.neighborhood}
                  onChange={handleChange}
                  placeholder="Bairro"
                  className="w-full bg-zinc-900/50 border border-white/5 rounded-2xl py-4 px-4 text-white focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all text-sm"
                  required
                  disabled={loading}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-300 ml-1">Rua / Logradouro</label>
              <input
                type="text"
                name="address"
                value={formData.address}
                onChange={handleChange}
                placeholder="Ex: Av. Paulista"
                className="w-full bg-zinc-900/50 border border-white/5 rounded-2xl py-4 px-4 text-white focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all text-sm"
                required
                disabled={loading}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-300 ml-1">Número</label>
                <input
                  type="text"
                  name="number"
                  value={formData.number}
                  onChange={handleChange}
                  placeholder="123"
                  className="w-full bg-zinc-900/50 border border-white/5 rounded-2xl py-4 px-4 text-white focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all text-sm"
                  required
                  disabled={loading}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-300 ml-1">Complemento</label>
                <input
                  type="text"
                  name="complement"
                  value={formData.complement}
                  onChange={handleChange}
                  placeholder="Apto, Bloco..."
                  className="w-full bg-zinc-900/50 border border-white/5 rounded-2xl py-4 px-4 text-white focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all text-sm"
                  disabled={loading}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-300 ml-1">E-mail</label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500 group-focus-within:text-primary transition-colors" />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="seu@email.com"
                  className="w-full bg-zinc-900/50 border border-white/5 rounded-2xl py-4 pl-12 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                  required
                  disabled={loading}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-300 ml-1">Senha</label>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500 group-focus-within:text-primary transition-colors" />
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className="w-full bg-zinc-900/50 border border-white/5 rounded-2xl py-4 pl-12 pr-12 text-white focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                  required
                  disabled={loading}
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

            <div className="flex items-start gap-2 px-1">
              <input type="checkbox" id="terms" className="accent-primary w-4 h-4 rounded border-white/10 mt-1" required />
              <label htmlFor="terms" className="text-xs text-zinc-500 leading-relaxed">
                Eu li e concordo com os <a href="#" className="text-primary hover:underline font-bold">Termos de Uso</a> e a <a href="#" className="text-primary hover:underline font-bold">Política de Privacidade</a> do Bananal PRO.
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary hover:bg-primary-dark text-white font-black py-4 rounded-2xl flex items-center justify-center gap-2 group transition-all shadow-xl shadow-primary/20 hover:scale-[1.01] active:scale-[0.98] mt-4 disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  Cadastrar Agora
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          <p className="text-center text-zinc-500 text-sm">
            Já possui acesso?{" "}
            <Link to="/auth/login" className="text-primary font-bold hover:underline">
              Entrar na Conta
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
