import React, { useState, useEffect } from "react";
import Layout from "../../components/Layout/Layout";
import { motion } from "motion/react";
import { 
  Sprout, 
  Calculator, 
  FileText, 
  HelpCircle, 
  CheckCircle2, 
  TrendingUp, 
  AlertTriangle,
  History,
  Trash2,
  Loader2
} from "lucide-react";
import { toast } from "react-hot-toast";
import { useAuth } from "../../contexts/AuthContext";
import { supabase } from "../../lib/supabase";

interface SoilTest {
  id: string;
  date: string;
  description: string;
  ph: number;
  p: number;
  k: number;
  ca: number;
  mg: number;
  hAl: number;
  vPercent: number;
  limingNeed: number;
}

export default function SoilAnalysis() {
  const { profile } = useAuth();
  const [description, setDescription] = useState("");
  const [ph, setPh] = useState(5.2);
  const [p, setP] = useState(12); // mg/dm³
  const [k, setK] = useState(0.15); // cmolc/dm³
  const [ca, setCa] = useState(1.8); // cmolc/dm³
  const [mg, setMg] = useState(0.6); // cmolc/dm³
  const [hAl, setHAl] = useState(4.2); // cmolc/dm³
  const [prnt, setPrnt] = useState(80); // %

  const [history, setHistory] = useState<SoilTest[]>([]);
  const [targetV, setTargetV] = useState(70);
  const [limitPLow, setLimitPLow] = useState(15);
  const [limitPMed, setLimitPMed] = useState(30);
  const [limitKLow, setLimitKLow] = useState(0.15);
  const [limitKMed, setLimitKMed] = useState(0.3);

  const [loadingHistory, setLoadingHistory] = useState(false);
  const [saving, setSaving] = useState(false);

  const fetchSoilAnalyses = async () => {
    if (!profile?.id) return;
    setLoadingHistory(true);
    try {
      const { data, error } = await (supabase as any)
        .from('soil_analyses')
        .select('*')
        .eq('user_id', profile.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const mapped: SoilTest[] = (data || []).map((t) => ({
        id: String(t.id),
        date: t.created_at ? t.created_at.split('T')[0] : new Date().toISOString().split('T')[0],
        description: t.description,
        ph: Number(t.ph),
        p: Number(t.p),
        k: Number(t.k),
        ca: Number(t.ca),
        mg: Number(t.mg),
        hAl: Number(t.h_al),
        vPercent: Number(t.v_percent),
        limingNeed: Number(t.liming_need)
      }));
      setHistory(mapped);
    } catch (err) {
      console.error('Error fetching soil analyses:', err);
      toast.error('Erro ao buscar histórico de análises de solo.');
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    const fetchParams = async () => {
      try {
        const { data } = await supabase
          .from('system_settings')
          .select('key, value')
          .in('key', ['soil_target_v', 'soil_limit_p_low', 'soil_limit_p_med', 'soil_limit_k_low', 'soil_limit_k_med']);
        
        if (data) {
          const target_v = data.find(s => s.key === 'soil_target_v')?.value;
          const p_low = data.find(s => s.key === 'soil_limit_p_low')?.value;
          const p_med = data.find(s => s.key === 'soil_limit_p_med')?.value;
          const k_low = data.find(s => s.key === 'soil_limit_k_low')?.value;
          const k_med = data.find(s => s.key === 'soil_limit_k_med')?.value;
          
          if (target_v) setTargetV(parseFloat(target_v));
          if (p_low) setLimitPLow(parseFloat(p_low));
          if (p_med) setLimitPMed(parseFloat(p_med));
          if (k_low) setLimitKLow(parseFloat(k_low));
          if (k_med) setLimitKMed(parseFloat(k_med));
        }
      } catch (err) {
        console.error("Error loading soil limits:", err);
      }
    };
    fetchParams();
  }, []);

  useEffect(() => {
    if (profile?.id) {
      fetchSoilAnalyses();
    }
  }, [profile]);

  // Calculations
  const sb = ca + mg + k; // Soma de bases
  const ctc = sb + hAl;   // CTC
  const v1 = ctc > 0 ? (sb / ctc) * 100 : 0; // V% atual

  // NC = (V2 - V1) * CTC / PRNT
  const limingNeed = v1 < targetV && ctc > 0
    ? parseFloat((((targetV - v1) * ctc) / prnt).toFixed(2))
    : 0;

  const handleCalculate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) {
      toast.error("Por favor, dê uma descrição/identificação para esta gleba.");
      return;
    }
    if (!profile?.id) {
      toast.error("Usuário não identificado.");
      return;
    }

    setSaving(true);
    try {
      const { error } = await (supabase as any)
        .from('soil_analyses')
        .insert([{
          user_id: profile.id,
          description,
          ph,
          p,
          k,
          ca,
          mg,
          h_al: hAl,
          v_percent: parseFloat(v1.toFixed(1)),
          liming_need: limingNeed
        }]);

      if (error) throw error;

      toast.success("Análise de solo salva com sucesso no histórico!");
      setDescription("");
      fetchSoilAnalyses();
    } catch (err) {
      console.error('Error saving soil analysis:', err);
      toast.error('Erro ao salvar análise no Supabase.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Deseja mesmo remover esta análise do histórico?")) return;
    try {
      const { error } = await (supabase as any)
        .from('soil_analyses')
        .delete()
        .eq('id', Number(id));

      if (error) throw error;

      toast.success("Registro removido.");
      fetchSoilAnalyses();
    } catch (err) {
      console.error('Error deleting soil analysis:', err);
      toast.error('Erro ao deletar análise do Supabase.');
    }
  };

  // Nutrient status helpers
  const getPStatus = (val: number) => {
    if (val < limitPLow) return { text: "Baixo", color: "text-red-400" };
    if (val <= limitPMed) return { text: "Médio", color: "text-yellow-400" };
    return { text: "Adequado", color: "text-emerald-400" };
  };

  const getKStatus = (val: number) => {
    if (val < limitKLow) return { text: "Baixo", color: "text-red-400" };
    if (val <= limitKMed) return { text: "Médio", color: "text-yellow-400" };
    return { text: "Adequado", color: "text-emerald-400" };
  };

  return (
    <Layout>
      <div className="max-w-7xl mx-auto space-y-10 pb-20">
        {/* Header */}
        <div>
          <h1 className="text-4xl font-display font-bold text-white mb-2 flex items-center gap-3">
            <Sprout className="text-primary w-10 h-10" />
            Análise de Solo
          </h1>
          <p className="text-slate-400 text-lg">
            Interpretação química instantânea, cálculo de calagem e recomendação nutricional específica para banana.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Form Column */}
          <div className="lg:col-span-2 space-y-8">
            <div className="glass-card p-8 rounded-[2.5rem] border-white/5 bg-zinc-900/40 relative overflow-hidden">
              <div className="flex items-center gap-3 mb-6">
                <Calculator className="text-primary w-6 h-6" />
                <h2 className="text-xl font-bold text-white">Nova Interpretação Técnica</h2>
              </div>

              <form onSubmit={handleCalculate} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Identificação da Gleba / Fazenda</label>
                  <input
                    type="text"
                    required
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Ex: Gleba Sul - Cavendish Irrigada"
                    className="w-full bg-black/40 border border-white/10 rounded-2xl py-4 px-4 text-white text-sm focus:outline-none focus:border-primary/50 transition-colors"
                  />
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-slate-300">pH (Água)</label>
                    <input
                      type="number"
                      step="0.1"
                      min="3"
                      max="9"
                      value={ph}
                      onChange={(e) => setPh(parseFloat(e.target.value) || 0)}
                      className="w-full bg-black/40 border border-white/10 rounded-2xl py-3 px-4 text-white text-sm focus:outline-none focus:border-primary/50"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-slate-300">Fósforo P (mg/dm³)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={p}
                      onChange={(e) => setP(parseFloat(e.target.value) || 0)}
                      className="w-full bg-black/40 border border-white/10 rounded-2xl py-3 px-4 text-white text-sm focus:outline-none focus:border-primary/50"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-slate-300">Potássio K (cmolc/dm³)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={k}
                      onChange={(e) => setK(parseFloat(e.target.value) || 0)}
                      className="w-full bg-black/40 border border-white/10 rounded-2xl py-3 px-4 text-white text-sm focus:outline-none focus:border-primary/50"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-slate-300">Cálcio Ca (cmolc/dm³)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={ca}
                      onChange={(e) => setCa(parseFloat(e.target.value) || 0)}
                      className="w-full bg-black/40 border border-white/10 rounded-2xl py-3 px-4 text-white text-sm focus:outline-none focus:border-primary/50"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-slate-300">Magnésio Mg (cmolc/dm³)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={mg}
                      onChange={(e) => setMg(parseFloat(e.target.value) || 0)}
                      className="w-full bg-black/40 border border-white/10 rounded-2xl py-3 px-4 text-white text-sm focus:outline-none focus:border-primary/50"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-slate-300">H + Al (Acidez - cmolc/dm³)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={hAl}
                      onChange={(e) => setHAl(parseFloat(e.target.value) || 0)}
                      className="w-full bg-black/40 border border-white/10 rounded-2xl py-3 px-4 text-white text-sm focus:outline-none focus:border-primary/50"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-slate-300">PRNT do Calcário (%)</label>
                    <input
                      type="number"
                      step="1"
                      min="50"
                      max="120"
                      value={prnt}
                      onChange={(e) => setPrnt(parseInt(e.target.value) || 80)}
                      className="w-full bg-black/40 border border-white/10 rounded-2xl py-3 px-4 text-white text-sm focus:outline-none focus:border-primary/50"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={saving}
                  className="w-full bg-primary hover:bg-primary-dark text-white font-black py-4 rounded-2xl transition-all shadow-lg shadow-primary/20 cursor-pointer text-sm uppercase tracking-wider flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    "Salvar no Histórico da Fazenda"
                  )}
                </button>
              </form>
            </div>

            {/* Calculations Dashboard */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="glass-card p-6 rounded-3xl border-white/5 bg-zinc-900/20 text-center">
                <p className="text-zinc-500 text-xs uppercase tracking-widest font-black mb-2">Soma de Bases (SB)</p>
                <p className="text-3xl font-bold text-white">{sb.toFixed(2)} <span className="text-xs text-zinc-500">cmolc/dm³</span></p>
              </div>
              <div className="glass-card p-6 rounded-3xl border-white/5 bg-zinc-900/20 text-center">
                <p className="text-zinc-500 text-xs uppercase tracking-widest font-black mb-2">Capacidade Troca (CTC)</p>
                <p className="text-3xl font-bold text-white">{ctc.toFixed(2)} <span className="text-xs text-zinc-500">cmolc/dm³</span></p>
              </div>
              <div className="glass-card p-6 rounded-3xl border-white/5 bg-zinc-900/20 text-center relative overflow-hidden group">
                <div className={`absolute inset-0 opacity-10 ${v1 >= targetV ? "bg-emerald-500" : "bg-yellow-500"}`} />
                <p className="text-zinc-500 text-xs uppercase tracking-widest font-black mb-2">Saturação por Bases (V%)</p>
                <p className={`text-3xl font-bold ${v1 >= targetV ? "text-emerald-400" : "text-yellow-500"}`}>{v1.toFixed(1)}%</p>
                <p className="text-[10px] text-zinc-500 mt-1">Meta Ideal: {targetV}%</p>
              </div>
            </div>

            {/* Recommendations Card */}
            <div className="glass-card p-8 rounded-[2.5rem] border-white/5 bg-zinc-900/30">
              <div className="flex items-center gap-3 mb-6">
                <FileText className="text-primary w-6 h-6" />
                <h3 className="text-xl font-bold text-white">Recomendações Agronômicas</h3>
              </div>

              <div className="space-y-6">
                {/* Liming Recommendation */}
                <div className="flex gap-4 p-5 rounded-2xl bg-white/[0.02] border border-white/5">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 bg-primary/10 text-primary">
                    <Calculator size={22} />
                  </div>
                  <div>
                    <h4 className="font-bold text-white mb-1">Necessidade de Calagem (NC)</h4>
                    <p className="text-sm text-zinc-400 leading-relaxed">
                      {limingNeed > 0 ? (
                        <>
                          Recomenda-se a aplicação de <span className="text-primary font-bold">{limingNeed} toneladas/ha</span> de Calcário Dolomítico (rico em Magnésio) espalhado uniformemente antes das chuvas para elevar a saturação por bases para {targetV}%.
                        </>
                      ) : (
                        "Sua saturação por bases está excelente. Não há necessidade de calagem para a lavoura de banana no momento."
                      )}
                    </p>
                  </div>
                </div>

                {/* Nitrogen & Potassium */}
                <div className="flex gap-4 p-5 rounded-2xl bg-white/[0.02] border border-white/5">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 bg-yellow-500/10 text-yellow-500">
                    <TrendingUp size={22} />
                  </div>
                  <div>
                    <h4 className="font-bold text-white mb-1">Equilíbrio de Potássio (K) e Fósforo (P)</h4>
                    <ul className="text-sm text-zinc-400 leading-relaxed space-y-2 list-disc list-inside">
                      <li>
                        Fósforo (P: {p} mg/dm³): <span className={`${getPStatus(p).color} font-bold`}>{getPStatus(p).text}</span>. 
                        {p < 15 && " Recomendado adubação fosfatada pesada no plantio ou início das águas (Superfosfato Simples)."}
                      </li>
                      <li>
                        Potássio (K: {k} cmolc/dm³): <span className={`${getKStatus(k).color} font-bold`}>{getKStatus(k).text}</span>. 
                        {k < 0.15 && " Bananeiras exigem alto potássio. Recomenda-se 300kg/ha de Cloreto de Potássio (KCl) parcelado."}
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar / History Column */}
          <div className="space-y-8">
            <div className="glass-card p-6 rounded-[2.5rem] border-white/5 bg-zinc-900/40">
              <div className="flex items-center gap-2.5 mb-6">
                <History className="text-primary w-5 h-5" />
                <h3 className="text-lg font-bold text-white">Histórico de Análises</h3>
              </div>

              <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 no-scrollbar">
                {loadingHistory ? (
                  <div className="flex flex-col items-center justify-center py-20 text-slate-500 gap-2">
                    <Loader2 className="w-6 h-6 text-primary animate-spin" />
                    <span className="text-xs font-bold uppercase tracking-widest text-zinc-600">Buscando no Supabase...</span>
                  </div>
                ) : (
                  <>
                    {history.map((test) => (
                      <div key={test.id} className="p-4 bg-black/40 border border-white/5 rounded-2xl space-y-3 relative group">
                        <button
                          onClick={() => handleDelete(test.id)}
                          className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-red-500/10 text-zinc-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all cursor-pointer"
                        >
                          <Trash2 size={14} />
                        </button>

                        <div>
                          <p className="font-bold text-sm text-white truncate max-w-[200px]">{test.description}</p>
                          <p className="text-[10px] text-zinc-500 font-medium">Coletada em: {test.date}</p>
                        </div>

                        <div className="grid grid-cols-3 gap-2 text-center pt-2 border-t border-white/5">
                          <div className="bg-white/5 rounded-lg p-1.5">
                            <p className="text-[8px] text-zinc-500 font-bold">pH</p>
                            <p className="text-xs font-bold text-white">{test.ph}</p>
                          </div>
                          <div className="bg-white/5 rounded-lg p-1.5">
                            <p className="text-[8px] text-zinc-500 font-bold">V%</p>
                            <p className="text-xs font-bold text-primary">{test.vPercent}%</p>
                          </div>
                          <div className="bg-white/5 rounded-lg p-1.5">
                            <p className="text-[8px] text-zinc-500 font-bold">CALAGEM</p>
                            <p className="text-xs font-bold text-yellow-500">{test.limingNeed}t/ha</p>
                          </div>
                        </div>
                      </div>
                    ))}

                    {history.length === 0 && (
                      <div className="text-center py-8 text-zinc-600">
                        Nenhuma análise salva.
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Visual Guide Box */}
            <div className="bg-primary/5 border border-primary/20 p-6 rounded-3xl flex gap-3">
              <AlertTriangle className="text-primary shrink-0" size={20} />
              <div>
                <h4 className="text-sm font-bold text-white mb-1">Instruções de Coleta</h4>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Para bananeiras, colete 20 subamostras na projeção da copa das plantas, na profundidade de 0-20 cm e 20-40 cm. Misture bem antes de enviar ao laboratório credenciado.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
