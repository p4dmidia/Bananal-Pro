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
  Loader2,
  Download,
  FileUp
} from "lucide-react";
import { toast } from "react-hot-toast";
import { useAuth } from "../../contexts/AuthContext";
import { supabase } from "../../lib/supabase";
import { jsPDF } from "jspdf";
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';

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
  const [areas, setAreas] = useState<any[]>([]);
  const [selectedAreaId, setSelectedAreaId] = useState<string>("custom");

  const [history, setHistory] = useState<SoilTest[]>([]);
  const [targetV, setTargetV] = useState(70);
  const [limitPLow, setLimitPLow] = useState(15);
  const [limitPMed, setLimitPMed] = useState(30);
  const [limitKLow, setLimitKLow] = useState(0.15);
  const [limitKMed, setLimitKMed] = useState(0.3);

  const [loadingHistory, setLoadingHistory] = useState(false);
  const [saving, setSaving] = useState(false);

  const [comparisonFilter, setComparisonFilter] = useState<string>("all");
  const [comparisonTab, setComparisonTab] = useState<string>("acidity");

  // Filtra as análises para o comparativo ordenando cronologicamente
  const filteredHistoryForComparison = history
    .filter(item => comparisonFilter === "all" || item.description === comparisonFilter)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  // Formata os dados para o gráfico do Recharts
  const chartData = filteredHistoryForComparison.map(item => {
    const dateParts = item.date.split('-');
    const formattedDate = dateParts.length === 3 ? `${dateParts[2]}/${dateParts[1]}` : item.date;
    return {
      name: formattedDate,
      pH: item.ph,
      V: item.vPercent,
      P: item.p,
      K: item.k,
      Ca: item.ca,
      Mg: item.mg,
      Calagem: item.limingNeed,
      fullName: item.description,
      dateFull: item.date
    };
  });

  const uniqueGlebas = Array.from(new Set(history.map(item => item.description)));

  const [scanningReport, setScanningReport] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [scanStatusMsg, setScanStatusMsg] = useState("");

  const handleUploadLabReport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setScanningReport(true);
    setScanProgress(0);
    setScanStatusMsg("Carregando arquivo de laudo...");

    const steps = [
      { progress: 15, msg: "Lendo cabecalho do laboratorio..." },
      { progress: 45, msg: "Identificando teores de nutrientes (K, P, Ca, Mg)..." },
      { progress: 75, msg: "Lendo acidez potencial e pH em agua..." },
      { progress: 95, msg: "Concluindo extracao digital dos dados..." },
      { progress: 100, msg: "Concluido!" }
    ];

    let currentStep = 0;
    const interval = setInterval(() => {
      if (currentStep < steps.length) {
        setScanProgress(steps[currentStep].progress);
        setScanStatusMsg(steps[currentStep].msg);
        currentStep++;
      } else {
        clearInterval(interval);
        setTimeout(() => {
          setDescription(`Laudo Extraido - Gleba ${file.name.replace(/\.[^/.]+$/, "")}`);
          setPh(5.1);
          setP(8.5);
          setK(0.12);
          setCa(1.4);
          setMg(0.4);
          setHAl(4.1);
          setPrnt(80);
          
          setScanningReport(false);
          toast.success("Laudo laboratorial processado! Dados de solo extraidos e preenchidos automaticamente.");
        }, 550);
      }
    }, 600);
  };

  const handleExportPDF = (gleba: string, values: {
    ph: number;
    p: number;
    k: number;
    ca: number;
    mg: number;
    hAl: number;
    prnt: number;
    sb: number;
    ctc: number;
    vPercent: number;
    limingNeed: number;
  }) => {
    try {
      const doc = new jsPDF();

      // Top banner
      doc.setFillColor(5, 46, 22); // #052e16 (deep forest green)
      doc.rect(0, 0, 210, 40, "F");

      // Title inside banner
      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(18);
      doc.text("BANANAL PRO - RELATORIO TECNICO", 14, 18);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.text("Interpretacao Quimica de Solo e Recomendacao de Calagem", 14, 26);
      doc.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')}`, 150, 18);

      // Section 1: Identification
      doc.setTextColor(31, 41, 55); // #1f2937
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.text("1. IDENTIFICACAO DA GLEBA", 14, 55);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.text(`Identificacao/Gleba: ${gleba}`, 14, 63);
      doc.text(`Cultura Principal: Banana (Manejo Tecnico)`, 14, 69);

      // Draw a line separator
      doc.setDrawColor(229, 231, 235); // #e5e7eb
      doc.line(14, 75, 196, 75);

      // Section 2: Chemical parameters
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.text("2. PARAMETROS QUIMICOS ANALISADOS", 14, 85);

      // Draw table header
      doc.setFillColor(243, 244, 246); // light gray #f3f4f6
      doc.rect(14, 90, 182, 8, "F");
      doc.setTextColor(55, 65, 81); // #374151
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.text("Parametro", 18, 95);
      doc.text("Valor Encontrado", 60, 95);
      doc.text("Unidade", 100, 95);
      doc.text("Faixa Recomendada", 130, 95);
      doc.text("Status", 170, 95);

      // Table rows
      const getNutrientStatusText = (val: number, low: number, med: number) => {
        if (val < low) return "Baixo";
        if (val <= med) return "Medio";
        return "Adequado";
      };

      const rows = [
        ["pH em Agua", values.ph.toFixed(1), "adimensional", "5.5 - 6.5", values.ph < 5.5 ? "Acido (Baixo)" : values.ph > 6.5 ? "Alto" : "Ideal"],
        ["Fosforo (P)", values.p.toFixed(1), "mg/dm3", `> ${limitPLow}`, getNutrientStatusText(values.p, limitPLow, limitPMed)],
        ["Potassio (K)", values.k.toFixed(2), "cmolc/dm3", `> ${limitKLow}`, getNutrientStatusText(values.k, limitKLow, limitKMed)],
        ["Calcio (Ca)", values.ca.toFixed(1), "cmolc/dm3", "> 2.0", values.ca < 2 ? "Baixo" : "Adequado"],
        ["Magnesio (Mg)", values.mg.toFixed(1), "cmolc/dm3", "> 0.8", values.mg < 0.8 ? "Baixo" : "Adequado"],
        ["Acidez Al+(H+Al)", values.hAl.toFixed(1), "cmolc/dm3", "-", "-"],
        ["Soma de Bases (SB)", values.sb.toFixed(2), "cmolc/dm3", "-", "-"],
        ["Capacidade Troca (CTC)", values.ctc.toFixed(2), "cmolc/dm3", "-", "-"],
        ["Saturacao por Bases (V)", `${values.vPercent.toFixed(1)}%`, "%", `${targetV}%`, values.vPercent < targetV ? "Abaixo da Meta" : "Ideal"]
      ];

      doc.setFont("helvetica", "normal");
      let currentY = 102;
      rows.forEach((row) => {
        doc.setTextColor(31, 41, 55);
        doc.text(row[0], 18, currentY);
        doc.text(row[1], 60, currentY);
        doc.text(row[2], 100, currentY);
        doc.text(row[3], 130, currentY);

        const status = row[4];
        if (status.includes("Baixo") || status.includes("Acido") || status.includes("Abaixo")) {
          doc.setTextColor(185, 28, 28); // red #b91c1c
        } else if (status.includes("Ideal") || status.includes("Adequado")) {
          doc.setTextColor(4, 120, 87); // emerald #047857
        } else {
          doc.setTextColor(31, 41, 55);
        }
        doc.text(status, 170, currentY);

        // Underline row
        doc.setDrawColor(243, 244, 246);
        doc.line(14, currentY + 3, 196, currentY + 3);
        currentY += 8;
      });

      // Section 3: Recommendations
      doc.setDrawColor(229, 231, 235);
      doc.line(14, currentY + 2, 196, currentY + 2);
      currentY += 12;

      doc.setTextColor(31, 41, 55);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.text("3. RECOMENDACOES E CONDICIONAMENTO DO SOLO", 14, currentY);
      currentY += 8;

      // Liming block
      doc.setFillColor(240, 253, 250); // very light emerald #f0fdfa
      doc.rect(14, currentY, 182, 22, "F");
      doc.setDrawColor(186, 230, 253);
      doc.rect(14, currentY, 182, 22, "S");

      doc.setTextColor(5, 46, 22);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.text("NECESSIDADE DE CALAGEM (NC)", 18, currentY + 6);
      
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      if (values.limingNeed > 0) {
        doc.text(`Recomendamos a aplicacao de ${values.limingNeed} t/ha de Calcario Dolomitico (PRNT ${values.prnt}%).`, 18, currentY + 12);
        doc.text(`Objetivo: Elevar a saturacao por bases de ${values.vPercent.toFixed(1)}% para a meta recomendada de ${targetV}%.`, 18, currentY + 17);
      } else {
        doc.text("Nao ha necessidade de calagem para esta gleba no momento.", 18, currentY + 12);
        doc.text(`A saturacao por bases atual (${values.vPercent.toFixed(1)}%) esta de acordo com a recomendacao de ${targetV}%.`, 18, currentY + 17);
      }
      currentY += 30;

      // NPK recommendation block
      doc.setTextColor(31, 41, 55);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.text("EQUILIBRIO NUTRICIONAL", 14, currentY);
      currentY += 6;

      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      let pRec = "";
      let kRec = "";

      if (values.p < limitPLow) {
        pRec = "Fosforo BAIXO. Exige adubacao fosfatada corretiva pesada no plantio ou sulco (ex: Superfosfato Simples).";
      } else if (values.p <= limitPMed) {
        pRec = "Fosforo MEDIO. Recomenda-se adubacao de manutencao padrao no inicio do periodo chuvoso.";
      } else {
        pRec = "Fosforo ADEQUADO. Aplicar dosagem minima de reposicao conforme exportacao esperada.";
      }

      if (values.k < limitKLow) {
        kRec = "Potassio BAIXO. Bananeiras sao altamente exigentes em K. Aplicar Cloreto de Potassio (KCl) parcelado.";
      } else if (values.k <= limitKMed) {
        kRec = "Potassio MEDIO. Realizar aplicacoes regulares de KCl parceladas a cada 60 dias nas aguas.";
      } else {
        kRec = "Potassio ADEQUADO. Monitorar e aplicar apenas adubacao de manutencao pos-colheita.";
      }

      doc.text(`- ${pRec}`, 14, currentY);
      doc.text(`- ${kRec}`, 14, currentY + 6);
      currentY += 22;

      // Technical signature/footer
      doc.setDrawColor(229, 231, 235);
      doc.line(14, currentY, 196, currentY);
      currentY += 10;

      doc.setFont("helvetica", "italic");
      doc.setFontSize(8);
      doc.setTextColor(107, 114, 128); // #6b7280
      doc.text("Este relatorio contem recomendacoes orientativas baseadas nos valores inseridos pelo usuario.", 14, currentY);
      doc.text("Recomendamos a consulta a um Engenheiro Agronomo para prescricao do receituario agronomico.", 14, currentY + 4);
      doc.text("Plataforma Bananal Pro - Tecnologias e Solucoes para a Bananicultura de Precisao.", 14, currentY + 8);

      // Save document
      doc.save(`laudo_calagem_${gleba.toLowerCase().replace(/[^a-z0-9]/g, "_")}.pdf`);
      toast.success("Relatorio PDF exportado com sucesso!");
    } catch (err) {
      console.error("Erro ao gerar PDF:", err);
      toast.error("Erro ao gerar relatorio em PDF.");
    }
  };

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

  const fetchAreas = async () => {
    if (!profile?.id) return;
    try {
      const { data, error } = await supabase
        .from('producer_areas')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      setAreas(data || []);
    } catch (err) {
      console.error('Error fetching areas in soil analysis:', err);
    }
  };

  useEffect(() => {
    if (profile?.id) {
      fetchSoilAnalyses();
      fetchAreas();
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
      setSelectedAreaId("custom");
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

              {scanningReport ? (
                <div className="p-8 border border-primary/20 bg-primary/5 rounded-2xl flex flex-col items-center justify-center text-center space-y-4 mb-6 transition-all">
                  <Loader2 className="w-8 h-8 text-primary animate-spin" />
                  <div>
                    <p className="text-white font-bold text-sm">{scanStatusMsg}</p>
                    <div className="w-48 h-1.5 bg-zinc-800 rounded-full mt-2 mx-auto overflow-hidden">
                      <div className="h-full bg-primary transition-all duration-300" style={{ width: `${scanProgress}%` }} />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="border border-dashed border-white/10 hover:border-primary/30 bg-black/20 rounded-2xl p-5 text-center flex flex-col items-center justify-center transition-all relative overflow-hidden group mb-6">
                  <FileUp className="text-primary w-6 h-6 mb-2 group-hover:scale-110 transition-transform" />
                  <p className="text-xs font-bold text-white mb-0.5">Simular Importação de Laudo Laboratorial</p>
                  <p className="text-[10px] text-zinc-500">Suba um PDF ou Imagem do laudo químico para preenchimento inteligente</p>
                  <input
                    type="file"
                    accept=".pdf,image/*"
                    onChange={handleUploadLabReport}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                </div>
              )}

              <form onSubmit={handleCalculate} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest block">Vincular a Área Cadastrada</label>
                    <select
                      value={selectedAreaId}
                      onChange={(e) => {
                        const val = e.target.value;
                        setSelectedAreaId(val);
                        if (val !== "custom") {
                          const area = areas.find(a => String(a.id) === val);
                          if (area) {
                            setDescription(`${area.name} (${area.property_name})`);
                          }
                        } else {
                          setDescription("");
                        }
                      }}
                      className="w-full bg-black/40 border border-white/10 rounded-2xl py-4 px-4 text-white text-sm focus:outline-none focus:border-primary/50 transition-colors"
                    >
                      <option value="custom" className="bg-zinc-950 text-white">Outra Gleba (Digitação Manual)</option>
                      {areas.map(a => (
                        <option key={a.id} value={a.id} className="bg-zinc-950 text-white">
                          {a.name} ({a.property_name})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest block">Identificação da Gleba / Fazenda *</label>
                    <input
                      type="text"
                      required
                      disabled={selectedAreaId !== "custom"}
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Ex: Gleba Sul - Cavendish Irrigada"
                      className="w-full bg-black/40 border border-white/10 rounded-2xl py-4 px-4 text-white text-sm focus:outline-none focus:border-primary/50 transition-colors disabled:opacity-50 disabled:bg-zinc-900/50 disabled:cursor-not-allowed"
                    />
                  </div>
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
              <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
                <div className="flex items-center gap-3">
                  <FileText className="text-primary w-6 h-6" />
                  <h3 className="text-xl font-bold text-white">Recomendações Agronômicas</h3>
                </div>
                <button
                  onClick={() => handleExportPDF(description || "Gleba sem identificacao", { ph, p, k, ca, mg, hAl, prnt, sb, ctc: sb + hAl, vPercent: v1, limingNeed })}
                  className="bg-primary/10 hover:bg-primary text-primary hover:text-white border border-primary/20 px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <Download size={14} />
                  Exportar PDF
                </button>
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
                        <div className="absolute top-4 right-4 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-all">
                          <button
                            onClick={() => handleExportPDF(test.description, {
                              ph: test.ph,
                              p: test.p,
                              k: test.k,
                              ca: test.ca,
                              mg: test.mg,
                              hAl: test.hAl,
                              prnt: 80,
                              sb: test.ca + test.mg + test.k,
                              ctc: test.ca + test.mg + test.k + test.hAl,
                              vPercent: test.vPercent,
                              limingNeed: test.limingNeed
                            })}
                            className="p-1.5 rounded-lg hover:bg-primary/10 text-zinc-600 hover:text-primary cursor-pointer"
                            title="Exportar PDF"
                          >
                            <Download size={14} />
                          </button>
                          <button
                            onClick={() => handleDelete(test.id)}
                            className="p-1.5 rounded-lg hover:bg-red-500/10 text-zinc-600 hover:text-red-400 cursor-pointer"
                            title="Excluir"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>

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

        {/* COMPARATIVO DE EVOLUÇÃO DO SOLO */}
        {history.length >= 2 ? (
          <div className="glass-card p-8 rounded-[2.5rem] border-white/5 bg-zinc-900/40 space-y-8 mt-10">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-white/5">
              <div className="space-y-1.5">
                <h3 className="text-2xl font-headline font-black text-white flex items-center gap-3">
                  <TrendingUp className="text-primary w-8 h-8" />
                  Evolução Química do Solo
                </h3>
                <p className="text-slate-400 text-sm font-medium">
                  Acompanhe a evolução dos nutrientes, acidez e necessidade de calagem ao longo das análises.
                </p>
              </div>

              {/* Filtro de Gleba */}
              <div className="flex items-center gap-3 shrink-0">
                <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Filtrar por:</span>
                <select
                  value={comparisonFilter}
                  onChange={(e) => setComparisonFilter(e.target.value)}
                  className="bg-black/40 border border-white/10 rounded-2xl py-3 px-4 text-white text-sm focus:outline-none focus:border-primary/50 transition-colors"
                >
                  <option value="all" className="bg-zinc-950">Todas as Glebas</option>
                  {uniqueGlebas.map((g, idx) => (
                    <option key={idx} value={g} className="bg-zinc-950">
                      {g}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {chartData.length < 2 ? (
              <div className="text-center py-12 text-zinc-500 bg-black/10 rounded-[2rem] border border-dashed border-white/5">
                Selecione uma gleba com mais de duas análises no histórico para ver o gráfico de evolução.
              </div>
            ) : (
              <div className="space-y-8">
                {/* Tabs para selecionar tipo de indicador no gráfico */}
                <div className="flex items-center gap-3 border-b border-white/5 pb-4 flex-wrap">
                  <button
                    type="button"
                    onClick={() => setComparisonTab("acidity")}
                    className={`px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                      comparisonTab === "acidity" ? "bg-primary text-white" : "bg-white/5 text-zinc-400 hover:bg-white/10"
                    }`}
                  >
                    Acidez (pH & V%)
                  </button>
                  <button
                    type="button"
                    onClick={() => setComparisonTab("nutrients")}
                    className={`px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                      comparisonTab === "nutrients" ? "bg-primary text-white" : "bg-white/5 text-zinc-400 hover:bg-white/10"
                    }`}
                  >
                    Nutrientes (P & K)
                  </button>
                  <button
                    type="button"
                    onClick={() => setComparisonTab("bases")}
                    className={`px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                      comparisonTab === "bases" ? "bg-primary text-white" : "bg-white/5 text-zinc-400 hover:bg-white/10"
                    }`}
                  >
                    Bases (Ca & Mg)
                  </button>
                </div>

                {/* Área do Gráfico */}
                <div className="h-[300px] w-full bg-black/20 border border-white/5 p-4 rounded-3xl relative">
                  <ResponsiveContainer width="99%" height="100%">
                    <LineChart data={chartData} margin={{ top: 10, right: 30, left: 10, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                      <XAxis
                        dataKey="name"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: '#71717a', fontSize: 10, fontWeight: 700 }}
                      />
                      {comparisonTab === "acidity" && (
                        <>
                          <YAxis yAxisId="left" domain={[3, 9]} label={{ value: 'pH (Água)', angle: -90, position: 'insideLeft', fill: '#71717a', fontSize: 10, fontWeight: 700 }} tick={{ fill: '#71717a', fontSize: 10 }} />
                          <YAxis yAxisId="right" orientation="right" domain={[0, 100]} label={{ value: 'Saturação V%', angle: 90, position: 'insideRight', fill: '#71717a', fontSize: 10, fontWeight: 700 }} tick={{ fill: '#71717a', fontSize: 10 }} />
                          <Tooltip contentStyle={{ backgroundColor: '#18181b', border: '1px solid #ffffff10', borderRadius: '16px', fontSize: '11px', color: '#fff' }} />
                          <Legend wrapperStyle={{ fontSize: 10, fontWeight: 700, paddingTop: 10 }} />
                          <Line yAxisId="left" type="monotone" dataKey="pH" stroke="#10b981" strokeWidth={3} activeDot={{ r: 6 }} name="pH (Água)" />
                          <Line yAxisId="right" type="monotone" dataKey="V" stroke="#3b82f6" strokeWidth={3} name="Saturação V%" />
                        </>
                      )}
                      {comparisonTab === "nutrients" && (
                        <>
                          <YAxis yAxisId="left" label={{ value: 'Fósforo P (mg/dm³)', angle: -90, position: 'insideLeft', fill: '#71717a', fontSize: 10, fontWeight: 700 }} tick={{ fill: '#71717a', fontSize: 10 }} />
                          <YAxis yAxisId="right" orientation="right" label={{ value: 'Potássio K (cmolc/dm³)', angle: 90, position: 'insideRight', fill: '#71717a', fontSize: 10, fontWeight: 700 }} tick={{ fill: '#71717a', fontSize: 10 }} />
                          <Tooltip contentStyle={{ backgroundColor: '#18181b', border: '1px solid #ffffff10', borderRadius: '16px', fontSize: '11px', color: '#fff' }} />
                          <Legend wrapperStyle={{ fontSize: 10, fontWeight: 700, paddingTop: 10 }} />
                          <Line yAxisId="left" type="monotone" dataKey="P" stroke="#f59e0b" strokeWidth={3} activeDot={{ r: 6 }} name="Fósforo (P)" />
                          <Line yAxisId="right" type="monotone" dataKey="K" stroke="#8b5cf6" strokeWidth={3} name="Potássio (K)" />
                        </>
                      )}
                      {comparisonTab === "bases" && (
                        <>
                          <YAxis label={{ value: 'Teor (cmolc/dm³)', angle: -90, position: 'insideLeft', fill: '#71717a', fontSize: 10, fontWeight: 700 }} tick={{ fill: '#71717a', fontSize: 10 }} />
                          <Tooltip contentStyle={{ backgroundColor: '#18181b', border: '1px solid #ffffff10', borderRadius: '16px', fontSize: '11px', color: '#fff' }} />
                          <Legend wrapperStyle={{ fontSize: 10, fontWeight: 700, paddingTop: 10 }} />
                          <Line type="monotone" dataKey="Ca" stroke="#3b82f6" strokeWidth={3} activeDot={{ r: 6 }} name="Cálcio (Ca)" />
                          <Line type="monotone" dataKey="Mg" stroke="#ec4899" strokeWidth={3} name="Magnésio (Mg)" />
                        </>
                      )}
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                {/* Tabela de Comparação Numérica Lado a Lado */}
                <div className="space-y-4">
                  <h4 className="text-sm font-bold text-white uppercase tracking-wider">Tabela Comparativa Lado a Lado</h4>
                  <div className="overflow-x-auto rounded-3xl border border-white/5 bg-black/20 no-scrollbar">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-white/5 border-b border-white/5">
                          <th className="px-6 py-4 font-bold text-zinc-400">Nutriente / Parâmetro</th>
                          {filteredHistoryForComparison.map((test, idx) => (
                            <th key={idx} className="px-6 py-4 font-bold text-white text-center">
                              <div>
                                <p className="truncate max-w-[150px]">{test.description}</p>
                                <p className="text-[10px] text-zinc-500 font-medium">{test.date}</p>
                              </div>
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5 text-zinc-300">
                        <tr className="hover:bg-white/[0.01]">
                          <td className="px-6 py-3 font-semibold text-white">pH (Água)</td>
                          {filteredHistoryForComparison.map((test, idx) => (
                            <td key={idx} className="px-6 py-3 text-center font-bold">{test.ph}</td>
                          ))}
                        </tr>
                        <tr className="hover:bg-white/[0.01]">
                          <td className="px-6 py-3 font-semibold text-white">Fósforo P (mg/dm³)</td>
                          {filteredHistoryForComparison.map((test, idx) => (
                            <td key={idx} className={`px-6 py-3 text-center font-bold ${getPStatus(test.p).color}`}>{test.p}</td>
                          ))}
                        </tr>
                        <tr className="hover:bg-white/[0.01]">
                          <td className="px-6 py-3 font-semibold text-white">Potássio K (cmolc/dm³)</td>
                          {filteredHistoryForComparison.map((test, idx) => (
                            <td key={idx} className={`px-6 py-3 text-center font-bold ${getKStatus(test.k).color}`}>{test.k}</td>
                          ))}
                        </tr>
                        <tr className="hover:bg-white/[0.01]">
                          <td className="px-6 py-3 font-semibold text-white">Cálcio Ca (cmolc/dm³)</td>
                          {filteredHistoryForComparison.map((test, idx) => (
                            <td key={idx} className="px-6 py-3 text-center">{test.ca}</td>
                          ))}
                        </tr>
                        <tr className="hover:bg-white/[0.01]">
                          <td className="px-6 py-3 font-semibold text-white">Magnésio Mg (cmolc/dm³)</td>
                          {filteredHistoryForComparison.map((test, idx) => (
                            <td key={idx} className="px-6 py-3 text-center">{test.mg}</td>
                          ))}
                        </tr>
                        <tr className="hover:bg-white/[0.01]">
                          <td className="px-6 py-3 font-semibold text-white">Acidez H + Al (cmolc/dm³)</td>
                          {filteredHistoryForComparison.map((test, idx) => (
                            <td key={idx} className="px-6 py-3 text-center">{test.hAl}</td>
                          ))}
                        </tr>
                        <tr className="hover:bg-white/[0.01]">
                          <td className="px-6 py-3 font-semibold text-white">Saturação por Bases V (%)</td>
                          {filteredHistoryForComparison.map((test, idx) => (
                            <td key={idx} className={`px-6 py-3 text-center font-bold ${test.vPercent >= targetV ? "text-emerald-400" : "text-yellow-500"}`}>{test.vPercent}%</td>
                          ))}
                        </tr>
                        <tr className="hover:bg-white/[0.01] bg-primary/5">
                          <td className="px-6 py-3 font-semibold text-primary">Necessidade de Calagem (t/ha)</td>
                          {filteredHistoryForComparison.map((test, idx) => (
                            <td key={idx} className="px-6 py-3 text-center font-bold text-yellow-500">{test.limingNeed} t/ha</td>
                          ))}
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="glass-card p-8 rounded-[2.5rem] border-white/5 bg-zinc-900/40 flex flex-col md:flex-row items-center justify-between gap-6 mt-10">
            <div className="space-y-2 text-center md:text-left">
              <h3 className="text-xl font-bold text-white flex items-center justify-center md:justify-start gap-2">
                <TrendingUp className="text-primary" size={24} />
                Painel de Evolução do Solo
              </h3>
              <p className="text-sm text-zinc-400 max-w-xl leading-relaxed">
                Adicione duas ou mais análises químicas no histórico para desbloquear gráficos de evolução de acidez, nutrientes e saturação por bases ao longo do tempo.
              </p>
            </div>
            <div className="bg-white/5 border border-white/10 px-5 py-3 rounded-2xl text-xs text-zinc-500 font-semibold uppercase tracking-wider shrink-0">
              {history.length} de 2 análises
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
