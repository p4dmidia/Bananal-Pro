import React, { useState, useEffect } from "react";
import Layout from "../../components/Layout/Layout";
import { motion, AnimatePresence } from "motion/react";
import { 
  Camera, 
  Upload, 
  X, 
  AlertTriangle, 
  CheckCircle2, 
  Loader2, 
  BookOpen, 
  FileText, 
  Zap,
  ChevronRight,
  History,
  Trash2
} from "lucide-react";
import { toast } from "react-hot-toast";
import { useAuth } from "../../contexts/AuthContext";
import { supabase } from "../../lib/supabase";

interface DiagnosisResult {
  diseaseName: string;
  scientificName: string;
  severity: "Crítico" | "Moderado" | "Baixo";
  description: string;
  culturalControl: string[];
  chemicalControl: string[];
  biologicalControl: string[];
}

const DISEASE_DATABASE: Record<string, DiagnosisResult> = {
  "sigatoka": {
    diseaseName: "Sigatoka Negra",
    scientificName: "Mycosphaerella fijiensis",
    severity: "Crítico",
    description: "Doença fúngica mais grave da bananicultura. Causa estrias necróticas escuras paralelas às nervuras secundárias da folha, levando à queima rápida da folhagem, perda de fotossíntese e maturação precoce dos frutos ainda no pé.",
    culturalControl: [
      "Drenagem eficiente da área (evitar acúmulo de umidade).",
      "Desfolha sanitária (desponta e cirurgia de folhas lesionadas) acumulando-as com a face de baixo para o solo.",
      "Combate de ervas daninhas para reduzir umidade relativa no microclima."
    ],
    chemicalControl: [
      "Pulverização preventiva com fungicidas protetores (Mancozeb ou Clorotalonil) em períodos de chuva.",
      "Uso rotacionado de fungicidas sistêmicos (Triazóis e Estrobilurinas) para evitar resistência."
    ],
    biologicalControl: [
      "Aplicação de formulações baseadas em Bacillus subtilis ou Bacillus amyloliquefaciens na folhagem."
    ]
  },
  "panama": {
    diseaseName: "Mal do Panamá (Fusariose)",
    scientificName: "Fusarium oxysporum f. sp. cubense",
    severity: "Crítico",
    description: "Fungo de solo devastador que penetra pelas raízes e obstrui os vasos condutores de seiva (xilema). Provoca o amarelecimento das folhas mais velhas pelas bordas, que murcham e caem junto ao pseudocaule (sintoma de 'guarda-chuva quebrado').",
    culturalControl: [
      "Uso de mudas micropropagadas (in vitro) certificadas livres do fungo.",
      "Evitar trânsito de máquinas e ferramentas de áreas contaminadas para áreas limpas sem desinfecção.",
      "Substituição de variedades suscetíveis (ex: Maçã) por cultivares resistentes (ex: BRS Conquista)."
    ],
    chemicalControl: [
      "Não há controle químico eficiente no solo. O fungo permanece viável por mais de 20 anos."
    ],
    biologicalControl: [
      "Uso de Trichoderma harzianum no plantio para colonização das raízes e proteção biológica."
    ]
  },
  "potassio": {
    diseaseName: "Deficiência de Potássio (K)",
    scientificName: "Deficiência Nutricional",
    severity: "Moderado",
    description: "O potássio é o nutriente mais extraído pela bananeira. Sua carência causa amarelecimento rápido e secamento das pontas e bordas das folhas mais velhas, que se dobram para baixo. O cacho fica raquítico e os frutos não enchem.",
    culturalControl: [
      "Realização de análise de solo anual para correção de adubação.",
      "Incorporação dos restos de pseudocaule e folhas no solo (são fontes riquíssimas de potássio)."
    ],
    chemicalControl: [
      "Aplicação urgente de Cloreto de Potássio (KCl) ou Sulfato de Potássio no solo, parcelado em 3 a 4 vezes ao longo do ano."
    ],
    biologicalControl: []
  }
};

interface DiagnosticHistoryItem {
  id: string;
  date: string;
  diseaseName: string;
  scientificName: string;
  severity: "Crítico" | "Moderado" | "Baixo";
  description: string;
  imageUrl: string | null;
}

export default function VisualDiagnostic() {
  const { profile } = useAuth();
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const [scanStep, setScanStep] = useState(0);
  const [result, setResult] = useState<DiagnosisResult | null>(null);
  const [simulateType, setSimulateType] = useState<string>("sigatoka");

  const [history, setHistory] = useState<DiagnosticHistoryItem[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [saving, setSaving] = useState(false);

  const scanStepsText = [
    "Lendo canais de cores foliares...",
    "Buscando assinaturas de necroses e manchas...",
    "Analisando padrões geométricos das lesões...",
    "Consultando banco de dados fitossanitários de bananicultura..."
  ];

  const fetchDiagnostics = async () => {
    if (!profile?.id) return;
    setLoadingHistory(true);
    try {
      const { data, error } = await (supabase as any)
        .from('visual_diagnostics')
        .select('*')
        .eq('user_id', profile.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const mapped: DiagnosticHistoryItem[] = (data || []).map((t) => ({
        id: String(t.id),
        date: t.created_at ? t.created_at.split('T')[0] : new Date().toISOString().split('T')[0],
        diseaseName: t.disease_name,
        scientificName: t.scientific_name,
        severity: t.severity as any,
        description: t.description,
        imageUrl: t.image_url
      }));
      setHistory(mapped);
    } catch (err) {
      console.error('Error fetching diagnostics:', err);
      toast.error('Erro ao buscar histórico de diagnósticos.');
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    if (profile?.id) {
      fetchDiagnostics();
    }
  }, [profile]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) {
      setFile(selected);
      setPreviewUrl(URL.createObjectURL(selected));
      setResult(null);
    }
  };

  const handleStartScan = () => {
    if (!file) {
      toast.error("Por favor, envie uma foto primeiro.");
      return;
    }

    setScanning(true);
    setScanStep(0);

    const interval = setInterval(async () => {
      setScanStep(prev => {
        if (prev < scanStepsText.length - 1) {
          return prev + 1;
        } else {
          clearInterval(interval);
          finishScan();
          return prev;
        }
      });
    }, 900);
  };

  const finishScan = async () => {
    setScanning(false);
    const selectedDiagnosis = DISEASE_DATABASE[simulateType] || DISEASE_DATABASE.sigatoka;
    setResult(selectedDiagnosis);

    if (profile?.id) {
      setSaving(true);
      try {
        const { error } = await (supabase as any)
          .from('visual_diagnostics')
          .insert([{
            user_id: profile.id,
            disease_name: selectedDiagnosis.diseaseName,
            scientific_name: selectedDiagnosis.scientificName,
            severity: selectedDiagnosis.severity,
            description: selectedDiagnosis.description,
            image_url: previewUrl
          }]);

        if (error) throw error;

        toast.success("Diagnóstico concluído e salvo com sucesso!");
        fetchDiagnostics();
      } catch (err) {
        console.error('Error saving diagnosis:', err);
        toast.error('Erro ao salvar diagnóstico no Supabase.');
      } finally {
        setSaving(false);
      }
    } else {
      toast.success("Diagnóstico concluído com sucesso!");
    }
  };

  const handleDeleteDiagnostic = async (id: string) => {
    if (!confirm("Deseja mesmo excluir este diagnóstico do histórico?")) return;
    try {
      const { error } = await (supabase as any)
        .from('visual_diagnostics')
        .delete()
        .eq('id', Number(id));

      if (error) throw error;

      toast.success("Diagnóstico removido.");
      fetchDiagnostics();
    } catch (err) {
      console.error('Error deleting diagnosis:', err);
      toast.error('Erro ao excluir diagnóstico do Supabase.');
    }
  };

  const handleReset = () => {
    setFile(null);
    setPreviewUrl(null);
    setResult(null);
  };

  return (
    <Layout>
      <div className="max-w-7xl mx-auto space-y-10 pb-20">
        {/* Header */}
        <div>
          <h1 className="text-4xl font-display font-bold text-white mb-2 flex items-center gap-3">
            <Camera className="text-primary w-10 h-10" />
            Diagnóstico Visual IA
          </h1>
          <p className="text-slate-400 text-lg">
            Envie uma foto de folhas com manchas ou sintomas para identificar pragas, doenças ou deficiências.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Scanning Box Column */}
          <div className="lg:col-span-2 space-y-6">
            {!previewUrl ? (
              <div className="border-2 border-dashed border-white/10 hover:border-primary/40 bg-zinc-900/40 rounded-[2.5rem] p-12 text-center flex flex-col items-center justify-center min-h-[350px] transition-all relative overflow-hidden group">
                <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <Upload className="text-primary w-8 h-8" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">Arraste ou clique para subir a imagem</h3>
                <p className="text-xs text-zinc-500 max-w-xs mb-6">Suporta formatos JPG, JPEG e PNG. Envie fotos nítidas e com boa iluminação.</p>
                
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
              </div>
            ) : (
              <div className="glass-card p-6 rounded-[2.5rem] border-white/5 bg-zinc-900/40 space-y-6 relative">
                {/* Reset button */}
                {!scanning && (
                  <button
                    onClick={handleReset}
                    className="absolute top-6 right-6 p-2 rounded-full bg-black/60 hover:bg-black text-zinc-400 hover:text-white transition-colors cursor-pointer z-10"
                  >
                    <X size={18} />
                  </button>
                )}

                <div className="relative aspect-video w-full rounded-2xl overflow-hidden border border-white/5 bg-black">
                  <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                  
                  {scanning && (
                    <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center p-6 space-y-6">
                      <div className="w-full max-w-xs text-center space-y-4">
                        <Loader2 className="animate-spin text-primary w-10 h-10 mx-auto" />
                        <div className="space-y-1">
                          <p className="text-white font-bold text-sm">Escaneando Imagem...</p>
                          <motion.p 
                            key={scanStep}
                            initial={{ opacity: 0, y: 5 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="text-xs text-primary font-bold tracking-wide"
                          >
                            {scanStepsText[scanStep]}
                          </motion.p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {!scanning && !result && (
                  <div className="space-y-4">
                    {/* Simulator Settings */}
                    <div className="p-4 bg-white/[0.02] border border-white/5 rounded-2xl flex items-center justify-between flex-wrap gap-4">
                      <div className="flex items-center gap-2 text-zinc-400 text-xs font-bold uppercase tracking-wider">
                        <Zap size={14} className="text-yellow-500" /> Simular Diagnóstico de:
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setSimulateType("sigatoka")}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                            simulateType === "sigatoka" ? "bg-primary text-white" : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"
                          }`}
                        >
                          Sigatoka Negra
                        </button>
                        <button
                          onClick={() => setSimulateType("panama")}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                            simulateType === "panama" ? "bg-primary text-white" : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"
                          }`}
                        >
                          Fusariose
                        </button>
                        <button
                          onClick={() => setSimulateType("potassio")}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                            simulateType === "potassio" ? "bg-primary text-white" : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"
                          }`}
                        >
                          Deficiência de K
                        </button>
                      </div>
                    </div>

                    <button
                      onClick={handleStartScan}
                      className="w-full bg-primary hover:bg-primary-dark text-white font-black py-4 rounded-2xl transition-all shadow-lg shadow-primary/20 cursor-pointer text-sm uppercase tracking-wider"
                    >
                      Iniciar Análise Diagnóstica
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Diagnostic Result Display */}
            <AnimatePresence>
              {result && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 20 }}
                  className="glass-card p-8 rounded-[2.5rem] border-white/5 bg-zinc-900/40 space-y-8"
                >
                  <div className="flex items-start justify-between flex-wrap gap-4 border-b border-white/5 pb-6">
                    <div>
                      <div className="flex items-center gap-3">
                        <h2 className="text-2xl font-black text-white">{result.diseaseName}</h2>
                        <span className={`text-[9px] font-black uppercase px-2.5 py-1 rounded-full border ${
                          result.severity === "Crítico" ? "bg-red-500/10 border-red-500/20 text-red-400" : "bg-yellow-500/10 border-yellow-500/20 text-yellow-400"
                        }`}>
                          {result.severity}
                        </span>
                      </div>
                      <p className="text-xs text-zinc-500 font-medium italic mt-1">{result.scientificName}</p>
                    </div>

                    <button
                      onClick={handleReset}
                      className="text-xs text-primary font-bold hover:underline cursor-pointer flex items-center gap-1"
                    >
                      Analisar Outra Imagem <ChevronRight size={14} />
                    </button>
                  </div>

                  <div className="space-y-2">
                    <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                      <FileText size={12} /> Descrição Técnica
                    </h3>
                    <p className="text-sm text-zinc-400 leading-relaxed">{result.description}</p>
                  </div>

                  {/* Recommendation columns */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Cultural control */}
                    <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/5 space-y-3">
                      <h4 className="font-bold text-white text-sm flex items-center gap-2">
                        <BookOpen size={16} className="text-primary" /> Controle Cultural
                      </h4>
                      <ul className="text-xs text-zinc-500 space-y-2 list-disc list-inside leading-relaxed">
                        {result.culturalControl.map((item, idx) => (
                          <li key={idx}>{item}</li>
                        ))}
                      </ul>
                    </div>

                    {/* Chemical / Biological control */}
                    <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/5 space-y-3">
                      <h4 className="font-bold text-white text-sm flex items-center gap-2">
                        <Zap size={16} className="text-yellow-500" /> Controle Fitossanitário
                      </h4>
                      <ul className="text-xs text-zinc-500 space-y-2 list-disc list-inside leading-relaxed">
                        {result.chemicalControl.map((item, idx) => (
                          <li key={idx}><span className="text-zinc-400 font-semibold">[Químico]</span> {item}</li>
                        ))}
                        {result.biologicalControl.map((item, idx) => (
                          <li key={idx}><span className="text-primary font-semibold">[Biológico]</span> {item}</li>
                        ))}
                        {result.chemicalControl.length === 0 && result.biologicalControl.length === 0 && (
                          <li>Nenhum tratamento direto disponível. Foco total em controle preventivo e erradicação.</li>
                        )}
                      </ul>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

           {/* Sidebar / History Column */}
          <div className="space-y-6">
            {/* Diagnostic History Card */}
            <div className="glass-card p-6 rounded-[2.5rem] border-white/5 bg-zinc-900/40 space-y-4">
              <div className="flex items-center gap-2.5 mb-2">
                <History className="text-primary w-5 h-5" />
                <h3 className="text-lg font-bold text-white">Histórico de Diagnósticos</h3>
              </div>

              <div className="space-y-4 max-h-[350px] overflow-y-auto pr-2 no-scrollbar">
                {loadingHistory ? (
                  <div className="flex flex-col items-center justify-center py-12 text-slate-500 gap-2">
                    <Loader2 className="w-5 h-5 text-primary animate-spin" />
                    <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-600">Buscando no Supabase...</span>
                  </div>
                ) : (
                  <>
                    {history.map((item) => (
                      <div key={item.id} className="p-4 bg-black/40 border border-white/5 rounded-2xl space-y-3 relative group">
                        <button
                          onClick={() => handleDeleteDiagnostic(item.id)}
                          className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-red-500/10 text-zinc-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all cursor-pointer"
                        >
                          <Trash2 size={12} />
                        </button>

                        <div className="flex items-start gap-3">
                          {item.imageUrl && (
                            <img src={item.imageUrl} alt="Scan" className="w-12 h-12 rounded-lg object-cover shrink-0 border border-white/10" />
                          )}
                          <div className="overflow-hidden flex-1">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <p className="font-bold text-xs text-white truncate max-w-[100px]">{item.diseaseName}</p>
                              <span className={`text-[7px] font-black uppercase px-1.5 py-0.5 rounded border ${
                                item.severity === "Crítico" ? "bg-red-500/10 border-red-500/20 text-red-400" : "bg-yellow-500/10 border-yellow-500/20 text-yellow-400"
                              }`}>
                                {item.severity}
                              </span>
                            </div>
                            <p className="text-[9px] text-zinc-500 font-medium mt-1">Analisado em: {item.date}</p>
                          </div>
                        </div>
                      </div>
                    ))}

                    {history.length === 0 && (
                      <div className="text-center py-6 text-[11px] text-zinc-600">
                        Nenhum diagnóstico salvo.
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Disease reference database */}
            <div className="space-y-6">
              <h3 className="text-lg font-bold text-white">Guia Rápido de Doenças</h3>

              <div className="glass-card p-6 rounded-[2.5rem] border-white/5 bg-zinc-900/40 space-y-4">
                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-white">Sigatoka Negra</h4>
                  <p className="text-xs text-zinc-500 leading-relaxed">
                    Reconheça pelas manchas cloróticas (estrias) amarelas que progridem para necrose cinza com bordas escuras. Ocorre sob umidade alta.
                  </p>
                </div>
                <div className="space-y-1 border-t border-white/5 pt-4">
                  <h4 className="text-sm font-bold text-white">Fusariose (Mal do Panamá)</h4>
                  <p className="text-xs text-zinc-500 leading-relaxed">
                    Amarelamento foliar progressivo nas bordas das folhas velhas. Provoca quebra do pecíolo rente ao caule e escurecimento interno do pseudocaule.
                  </p>
                </div>
                <div className="space-y-1 border-t border-white/5 pt-4">
                  <h4 className="text-sm font-bold text-white">Deficiência de Potássio</h4>
                  <p className="text-xs text-zinc-500 leading-relaxed">
                    Amarelamento rápido e uniforme na ponta e bordas das folhas basais, progredindo para necrose. O pecíolo dobra mas a folha não murcha por entupimento vascular.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
