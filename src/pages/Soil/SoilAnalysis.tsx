import React, { useState, useEffect } from "react";
import Layout from "../../components/Layout/Layout";
import bannerImg from "../../assets/banana_soil_analysis_banner.png";
import { motion, AnimatePresence } from "motion/react";
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
  FileUp,
  X
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
  documentUrl?: string;
}

const loadPdfjs = () => {
  return new Promise<any>((resolve) => {
    if ((window as any).pdfjsLib) {
      resolve((window as any).pdfjsLib);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.min.js';
    script.onload = () => {
      const pdfjsLib = (window as any).pdfjsLib;
      pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js';
      resolve(pdfjsLib);
    };
    document.head.appendChild(script);
  });
};

const extractTextFromPdf = async (file: File): Promise<string> => {
  const pdfjsLib = await loadPdfjs();
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  let fullText = "";
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    const pageText = textContent.items.map((item: any) => item.str).join(" ");
    fullText += pageText + "\n";
  }
  return fullText;
};

const parseSoilPdfText = (text: string) => {
  const normalized = text.replace(/,/g, '.').replace(/\s+/g, ' ');
  
  // Default values
  let ph = 5.5;
  let p = 12.0;
  let k = 0.15;
  let ca = 1.8;
  let mg = 0.6;
  let hAl = 4.2;

  // 1. pH em Água
  const phMatch = normalized.match(/ph(?:[- ]?água|[- ]?agua)?[^0-9]*([3-8]\.[0-9])/i);
  if (phMatch) {
    ph = parseFloat(phMatch[1]);
  }

  // 2. Fósforo (P)
  const pMatch = normalized.match(/(?:fósforo|fosforo|p\s+mg\/dm³|p\s+mg\/dm3)[^0-9]*(\d+(?:\.\d+)?)/i);
  if (pMatch) {
    p = parseFloat(pMatch[1]);
  } else {
    const pSimple = normalized.match(/\b(?:p)\b[^0-9]*(\d+(?:\.\d+)?)/i);
    if (pSimple) p = parseFloat(pSimple[1]);
  }

  // 3. Potássio (K)
  const kMatch = normalized.match(/(?:potássio|potassio|k\s+mg\/dm³|k\s+mg\/dm3)[^0-9]*(\d+(?:\.\d+)?)/i);
  if (kMatch) {
    const val = parseFloat(kMatch[1]);
    k = val > 5 ? parseFloat((val / 391).toFixed(3)) : val;
  } else {
    const kSimple = normalized.match(/\b(?:k)\b[^0-9]*(\d+(?:\.\d+)?)/i);
    if (kSimple) {
      const val = parseFloat(kSimple[1]);
      k = val > 5 ? parseFloat((val / 391).toFixed(3)) : val;
    }
  }

  // 4. Cálcio (Ca)
  const caMatch = normalized.match(/(?:cálcio|calcio|ca\s+cmolc)[^0-9]*(\d+(?:\.\d+)?)/i);
  if (caMatch) {
    ca = parseFloat(caMatch[1]);
  } else {
    const caSimple = normalized.match(/\b(?:ca)\b[^0-9]*(\d+(?:\.\d+)?)/i);
    if (caSimple) ca = parseFloat(caSimple[1]);
  }

  // 5. Magnésio (Mg)
  const mgMatch = normalized.match(/(?:magnésio|magnesio|mg\s+cmolc)[^0-9]*(\d+(?:\.\d+)?)/i);
  if (mgMatch) {
    mg = parseFloat(mgMatch[1]);
  } else {
    const mgSimple = normalized.match(/\b(?:mg)\b[^0-9]*(\d+(?:\.\d+)?)/i);
    if (mgSimple) mg = parseFloat(mgSimple[1]);
  }

  // 6. H + Al
  const hAlMatch = normalized.match(/(?:h\s*\+\s*al|acidez)[^0-9]*(\d+(?:\.\d+)?)/i);
  if (hAlMatch) {
    hAl = parseFloat(hAlMatch[1]);
  }

  return { ph, p, k, ca, mg, hAl };
};

const openDataUrlOrBlob = (url: string) => {
  if (!url) return;
  if (url.startsWith('data:')) {
    try {
      const parts = url.split(',');
      const mime = parts[0].match(/:(.*?);/)?.[1] || 'application/pdf';
      const bstr = atob(parts[1]);
      let n = bstr.length;
      const u8arr = new Uint8Array(n);
      while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
      }
      const blob = new Blob([u8arr], { type: mime });
      const blobUrl = URL.createObjectURL(blob);
      window.open(blobUrl, '_blank');
    } catch (err) {
      console.error("Error opening base64 document:", err);
      const newTab = window.open();
      if (newTab) {
        newTab.document.write(`<iframe src="${url}" frameborder="0" style="border:0; top:0px; left:0px; bottom:0px; right:0px; width:100%; height:100%;" allowfullscreen></iframe>`);
      }
    }
  } else {
    window.open(url, '_blank');
  }
};

interface SoilTestExtended extends SoilTest {
  user_profiles?: {
    full_name: string;
    email: string;
    property_name: string | null;
  } | null;
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

  const [documentUrl, setDocumentUrl] = useState("");
  const [uploadingDoc, setUploadingDoc] = useState(false);
  const [activeTab, setActiveTab] = useState<"calculator" | "all-analyses">("calculator");

  // General history states for admin, partner, pj
  const [allAnalyses, setAllAnalyses] = useState<SoilTestExtended[]>([]);
  const [loadingAllAnalyses, setLoadingAllAnalyses] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Edit modal states
  const [editingAnalysis, setEditingAnalysis] = useState<SoilTestExtended | null>(null);
  const [editDescription, setEditDescription] = useState("");
  const [editPh, setEditPh] = useState(5.2);
  const [editP, setEditP] = useState(12);
  const [editK, setEditK] = useState(0.15);
  const [editCa, setEditCa] = useState(1.8);
  const [editMg, setEditMg] = useState(0.6);
  const [editHAl, setEditHAl] = useState(4.2);
  const [editPrnt, setEditPrnt] = useState(80);
  const [editDocumentUrl, setEditDocumentUrl] = useState("");
  const [uploadingEditDoc, setUploadingEditDoc] = useState(false);

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

  const handleUploadLabReport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.pdf')) {
      toast.error("Por favor, selecione apenas arquivos em formato PDF.");
      return;
    }

    setScanningReport(true);
    setScanProgress(0);
    setScanStatusMsg("Carregando arquivo de laudo PDF...");

    // Real upload promise running concurrently
    const uploadPromise = (async () => {
      try {
        const fileExt = file.name.split('.').pop();
        const fileName = `soil-analysis-${Date.now()}.${fileExt}`;
        const filePath = `${profile?.id || 'public'}/${fileName}`;
        
        await supabase.storage.createBucket('soil-analyses', { public: true }).catch(() => {});
        
        const { error: uploadError } = await supabase.storage
          .from('soil-analyses')
          .upload(filePath, file, { cacheControl: '3600', upsert: true });
          
        if (uploadError) {
          const { error: fallbackError } = await supabase.storage
            .from('library-files')
            .upload(filePath, file, { cacheControl: '3600', upsert: true });
          if (fallbackError) {
            // base64 fallback
            return new Promise<string>((resolve) => {
              const reader = new FileReader();
              reader.onloadend = () => resolve(reader.result as string);
              reader.readAsDataURL(file);
            });
          } else {
            return supabase.storage.from('library-files').getPublicUrl(filePath).data.publicUrl;
          }
        } else {
          return supabase.storage.from('soil-analyses').getPublicUrl(filePath).data.publicUrl;
        }
      } catch (err) {
        console.warn("Upload error in background:", err);
        return "";
      }
    })();

    // Client-side PDF text extraction
    let parsedValues = {
      ph: 5.5,
      p: 12.0,
      k: 0.15,
      ca: 1.8,
      mg: 0.6,
      hAl: 4.2
    };

    try {
      setScanStatusMsg("Extraindo texto digital do laudo PDF...");
      const text = await extractTextFromPdf(file);
      if (text.trim()) {
        const parsed = parseSoilPdfText(text);
        parsedValues = parsed;
      }
    } catch (err) {
      console.warn("Error parsing PDF text, using default fallbacks:", err);
    }

    const steps = [
      { progress: 25, msg: "Lendo estrutura do PDF..." },
      { progress: 55, msg: "Identificando teores de nutrientes (K, P, Ca, Mg)..." },
      { progress: 85, msg: "Lendo acidez potencial e pH em água..." },
      { progress: 100, msg: "Concluído!" }
    ];

    let currentStep = 0;
    const interval = setInterval(async () => {
      if (currentStep < steps.length) {
        setScanProgress(steps[currentStep].progress);
        setScanStatusMsg(steps[currentStep].msg);
        currentStep++;
      } else {
        clearInterval(interval);
        const uploadedUrl = await uploadPromise;
        setDocumentUrl(uploadedUrl);
        
        setTimeout(() => {
          setDescription(`Laudo PDF - ${file.name.replace(/\.[^/.]+$/, "")}`);
          setPh(parsedValues.ph);
          setP(parsedValues.p);
          setK(parsedValues.k);
          setCa(parsedValues.ca);
          setMg(parsedValues.mg);
          setHAl(parsedValues.hAl);
          setPrnt(80);
          
          setScanningReport(false);
          toast.success("Laudo PDF importado! Revise e ajuste os valores se necessário.");
        }, 550);
      }
    }, 450);
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

      const mapped: SoilTest[] = (data || []).map((t: any) => ({
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
        limingNeed: Number(t.liming_need),
        documentUrl: t.document_url || ""
      }));
      setHistory(mapped);
    } catch (err) {
      console.error('Error fetching soil analyses:', err);
      toast.error('Erro ao buscar histórico de análises de solo.');
    } finally {
      setLoadingHistory(false);
    }
  };

  const fetchAllSoilAnalyses = async () => {
    if (!profile?.id) return;
    setLoadingAllAnalyses(true);
    try {
      const { data, error } = await (supabase as any)
        .from('soil_analyses')
        .select(`
          *,
          user_profiles:user_id (
            id,
            full_name,
            email
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Buscar áreas de produtores para associar o nome da propriedade
      const { data: areasData } = await supabase
        .from('producer_areas')
        .select('user_id, property_name');

      const propertyMap: Record<string, string> = {};
      if (areasData) {
        areasData.forEach((a: any) => {
          if (a.user_id && a.property_name) {
            propertyMap[String(a.user_id)] = a.property_name;
          }
        });
      }

      const mapped: SoilTestExtended[] = (data || []).map((t: any) => ({
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
        limingNeed: Number(t.liming_need),
        documentUrl: t.document_url || "",
        user_profiles: t.user_profiles ? {
          full_name: t.user_profiles.full_name,
          email: t.user_profiles.email,
          property_name: propertyMap[String(t.user_profiles.id)] || propertyMap[String(t.user_id)] || "Sem propriedade cadastrada"
        } : null
      }));
      setAllAnalyses(mapped);
    } catch (err) {
      console.error('Error fetching all soil analyses:', err);
      toast.error('Erro ao buscar histórico geral de análises de solo.');
    } finally {
      setLoadingAllAnalyses(false);
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
      if (['admin', 'partner', 'pj'].includes(profile.role)) {
        fetchAllSoilAnalyses();
      }
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
          liming_need: limingNeed,
          document_url: documentUrl || null
        }]);

      if (error) throw error;

      toast.success("Análise de solo salva com sucesso no histórico!");
      setDescription("");
      setDocumentUrl("");
      setSelectedAreaId("custom");
      fetchSoilAnalyses();
      if (['admin', 'partner', 'pj'].includes(profile.role)) {
        fetchAllSoilAnalyses();
      }
    } catch (err) {
      console.error('Error saving soil analysis:', err);
      toast.error('Erro ao salvar análise no Supabase.');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateAnalysis = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAnalysis) return;
    if (!editDescription.trim()) {
      toast.error("Por favor, forneça uma descrição.");
      return;
    }

    const editSb = editCa + editMg + editK;
    const editCtc = editSb + editHAl;
    const editV = editCtc > 0 ? (editSb / editCtc) * 100 : 0;
    const editLimingNeed = editV < targetV && editCtc > 0
      ? parseFloat((((targetV - editV) * editCtc) / editPrnt).toFixed(2))
      : 0;

    try {
      const { error } = await (supabase as any)
        .from('soil_analyses')
        .update({
          description: editDescription,
          ph: editPh,
          p: editP,
          k: editK,
          ca: editCa,
          mg: editMg,
          h_al: editHAl,
          v_percent: parseFloat(editV.toFixed(1)),
          liming_need: editLimingNeed,
          document_url: editDocumentUrl || null
        })
        .eq('id', Number(editingAnalysis.id));

      if (error) throw error;

      toast.success("Análise de solo atualizada com sucesso!");
      setEditingAnalysis(null);
      fetchSoilAnalyses();
      fetchAllSoilAnalyses();
    } catch (err) {
      console.error('Error updating soil analysis:', err);
      toast.error('Erro ao atualizar análise de solo.');
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
        {/* Header Banner */}
        <div 
          className="hero-banner-container relative mx-[-1rem] mt-[-1rem] md:mx-[-2rem] md:mt-[-2rem] rounded-none md:rounded-b-[2.5rem] overflow-hidden px-8 pb-10 pt-24 md:px-12 md:pb-12 md:pt-28 min-h-[220px] flex flex-col md:flex-row justify-between items-center md:items-end gap-6 bg-cover bg-center border-none z-10"
          style={{ backgroundImage: `url(${bannerImg})` }}
        >
          {/* Película escura do tom do menu lateral (#02160a) para legibilidade perfeita */}
          <div className="absolute inset-0 bg-[#02160a]/85 backdrop-blur-[1px] z-0 pointer-events-none" />

          {/* Fade to white/page-background at the bottom */}
          <div className="absolute bottom-0 left-0 right-0 h-10 bg-gradient-to-t from-background to-transparent z-10 pointer-events-none" />

          <div className="relative z-10 max-w-3xl text-left">
            <h1 className="text-3xl md:text-4xl font-display font-bold text-white mb-2 flex items-center gap-3">
              <span className="!text-white">Análise</span> <span className="text-[#589c1c] dark:text-[#6ee7b7]">de Solo</span>
              <Sprout className="text-[#589c1c] dark:text-[#6ee7b7] w-8 h-8 shrink-0 animate-pulse" />
            </h1>
            <p className="!text-white text-sm md:text-base font-medium leading-relaxed opacity-95">
              Interpretação química instantânea, cálculo de calagem e recomendação nutricional específica para banana.
            </p>
          </div>
        </div>

        {profile && ['admin', 'partner', 'pj'].includes(profile.role) && (
          <div className="flex border-b border-white/5 pb-4 mb-2 flex-wrap gap-3">
            <button
              type="button"
              onClick={() => { setActiveTab("calculator"); setCurrentPage(1); }}
              className={`px-5 py-3 rounded-xl font-bold text-xs tracking-wider uppercase transition-all cursor-pointer ${
                activeTab === "calculator" ? "bg-primary text-white border border-primary/20 shadow-lg shadow-primary/20" : "bg-white/5 text-zinc-400 hover:bg-white/10"
              }`}
            >
              Calculadora e Minhas Análises
            </button>
            <button
              type="button"
              onClick={() => { setActiveTab("all-analyses"); setCurrentPage(1); }}
              className={`px-5 py-3 rounded-xl font-bold text-xs tracking-wider uppercase transition-all cursor-pointer ${
                activeTab === "all-analyses" ? "bg-primary text-white border border-primary/20 shadow-lg shadow-primary/20" : "bg-white/5 text-zinc-400 hover:bg-white/10"
              }`}
            >
              Todas as Análises dos Assinantes
            </button>
          </div>
        )}

        {activeTab === "calculator" ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Form Column */}
          <div className="lg:col-span-2 space-y-8">
            <div className="glass-card p-8 rounded-[2.5rem] border-white/5 bg-zinc-900/40 relative overflow-hidden">
              <div className="flex items-center gap-3 mb-6">
                <Calculator className="text-primary w-6 h-6" />
                <h2 className="text-xl font-bold text-white">Nova Interpretação Técnica</h2>
              </div>

              {scanningReport ? (
                <div 
                  className="p-8 border border-primary/20 bg-primary/5 rounded-2xl flex flex-col items-center justify-center text-center space-y-4 mb-6 transition-all notranslate"
                  translate="no"
                >
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
                  <p className="text-xs font-bold text-white mb-0.5">Leitura Automática de Laudo PDF</p>
                  <p className="text-[10px] text-zinc-500">Faça o upload do laudo digital em PDF para extrair e preencher os dados automaticamente</p>
                  <input
                    type="file"
                    accept=".pdf"
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

                {/* Campo para anexar laudo PDF manualmente */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-300">Anexar Laudo PDF (Opcional)</label>
                  <input
                    type="file"
                    accept=".pdf"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      if (!file.name.toLowerCase().endsWith('.pdf')) {
                        toast.error("Por favor, selecione apenas arquivos em formato PDF.");
                        return;
                      }
                      setUploadingDoc(true);
                      try {
                        const fileExt = file.name.split('.').pop();
                        const fileName = `soil-analysis-${Date.now()}.${fileExt}`;
                        const filePath = `${profile?.id || 'public'}/${fileName}`;
                        
                        await supabase.storage.createBucket('soil-analyses', { public: true }).catch(() => {});
                        
                        let finalUrl = "";
                        const { error: uploadError } = await supabase.storage
                          .from('soil-analyses')
                          .upload(filePath, file, { cacheControl: '3600', upsert: true });
                          
                        if (uploadError) {
                          const { error: fallbackError } = await supabase.storage
                            .from('library-files')
                            .upload(filePath, file, { cacheControl: '3600', upsert: true });
                          if (fallbackError) {
                            // base64 fallback
                            finalUrl = await new Promise<string>((resolve) => {
                              const reader = new FileReader();
                              reader.onloadend = () => resolve(reader.result as string);
                              reader.readAsDataURL(file);
                            });
                          } else {
                            finalUrl = supabase.storage.from('library-files').getPublicUrl(filePath).data.publicUrl;
                          }
                        } else {
                          finalUrl = supabase.storage.from('soil-analyses').getPublicUrl(filePath).data.publicUrl;
                        }
                        
                        setDocumentUrl(finalUrl);
                        toast.success("Laudo anexado com sucesso!");
                      } catch (err) {
                        console.error("Error uploading manual document:", err);
                        toast.error("Erro ao fazer upload do laudo.");
                      } finally {
                        setUploadingDoc(false);
                      }
                    }}
                    className="w-full bg-black/40 border border-white/10 rounded-2xl py-3 px-4 text-white text-xs focus:outline-none focus:border-primary/50 file:mr-4 file:py-1 file:px-2.5 file:rounded-lg file:border-0 file:text-[10px] file:font-semibold file:bg-primary file:text-white"
                  />
                  {uploadingDoc && <p className="text-[10px] text-zinc-500 animate-pulse">Enviando arquivo...</p>}
                  {documentUrl && !uploadingDoc && (
                    <p className="text-[10px] text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 size={12} /> Laudo anexado!{' '}
                      <button
                        type="button"
                        onClick={() => openDataUrlOrBlob(documentUrl)}
                        className="underline font-bold text-white hover:text-primary bg-transparent border-0 p-0 cursor-pointer text-[10px] inline-block font-sans"
                      >
                        Ver arquivo
                      </button>
                    </p>
                  )}
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
        ) : (
          /* Render General subscriber list tab */
          <div className="space-y-8 animate-fadeIn">
            <div className="glass-card p-8 rounded-[2.5rem] border border-white/5 bg-zinc-900/40 space-y-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-white/5">
                <div>
                  <h3 className="text-xl font-bold text-white flex items-center gap-2">
                    <FileText className="text-primary w-6 h-6" />
                    Histórico Geral de Análises de Solo
                  </h3>
                  <p className="text-xs text-zinc-400 mt-1">Consulte, filtre e gerencie as análises cadastradas pelos produtores assinantes.</p>
                </div>
                <button
                  type="button"
                  onClick={() => fetchAllSoilAnalyses()}
                  className="bg-white/5 hover:bg-white/10 text-white px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 cursor-pointer transition-colors border border-white/10"
                >
                  <History size={14} /> Atualizar Lista
                </button>
              </div>

              {/* Filtros */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Pesquisar</label>
                  <input
                    type="text"
                    placeholder="Nome, e-mail ou gleba..."
                    value={searchTerm}
                    onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                    className="w-full bg-black/40 border border-white/10 rounded-xl py-3 px-4 text-white text-xs focus:outline-none focus:border-primary/50 transition-colors"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Data Inicial</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => { setStartDate(e.target.value); setCurrentPage(1); }}
                    className="w-full bg-black/40 border border-white/10 rounded-xl py-3 px-4 text-white text-xs focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Data Final</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => { setEndDate(e.target.value); setCurrentPage(1); }}
                    className="w-full bg-black/40 border border-white/10 rounded-xl py-3 px-4 text-white text-xs focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Itens por Página</label>
                  <select
                    value={itemsPerPage}
                    onChange={(e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }}
                    className="w-full bg-black/40 border border-white/10 rounded-xl py-3 px-4 text-white text-xs focus:outline-none focus:border-primary/50"
                  >
                    <option value="5" className="bg-zinc-950">5 itens</option>
                    <option value="10" className="bg-zinc-950">10 itens</option>
                    <option value="25" className="bg-zinc-950">25 itens</option>
                    <option value="50" className="bg-zinc-950">50 itens</option>
                  </select>
                </div>
              </div>

              {/* Tabela de Resultados */}
              {loadingAllAnalyses ? (
                <div className="flex flex-col items-center justify-center py-20 text-slate-500 gap-2">
                  <Loader2 className="w-8 h-8 text-primary animate-spin" />
                  <span className="text-xs font-bold uppercase tracking-widest text-zinc-500">Carregando histórico...</span>
                </div>
              ) : allAnalyses.length === 0 ? (
                <div className="text-center py-16 text-zinc-500 bg-black/10 rounded-3xl border border-dashed border-white/5">
                  Nenhuma análise encontrada.
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="overflow-x-auto rounded-2xl border border-white/5 bg-black/20 no-scrollbar">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-white/5 border-b border-white/5 text-zinc-400">
                          <th className="px-5 py-4 font-bold uppercase tracking-wider">Assinante / Propriedade</th>
                          <th className="px-5 py-4 font-bold uppercase tracking-wider">Gleba</th>
                          <th className="px-5 py-4 font-bold uppercase tracking-wider">Data</th>
                          <th className="px-5 py-4 font-bold uppercase tracking-wider text-center">Química (pH / V% / P / K)</th>
                          <th className="px-5 py-4 font-bold uppercase tracking-wider text-center">Recomendação Calagem</th>
                          <th className="px-5 py-4 font-bold uppercase tracking-wider text-center">Laudo / Arquivo</th>
                          <th className="px-5 py-4 font-bold uppercase tracking-wider text-center">Ações</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5 text-zinc-300">
                        {allAnalyses
                          .filter(item => {
                            const matchesSearch = !searchTerm.trim() || 
                              item.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                              (item.user_profiles?.full_name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
                              (item.user_profiles?.email || "").toLowerCase().includes(searchTerm.toLowerCase());
                              
                            const matchesDate = (!startDate || item.date >= startDate) &&
                                                (!endDate || item.date <= endDate);
                                                
                            return matchesSearch && matchesDate;
                          })
                          .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                          .map((test) => {
                            const name = test.user_profiles?.full_name || "Assinante";
                            const email = test.user_profiles?.email || "Não informado";
                            const farmName = test.user_profiles?.property_name || "Sem propriedade cadastrada";
                            
                            return (
                              <tr key={test.id} className="hover:bg-white/[0.01] transition-colors">
                                <td className="px-5 py-4">
                                  <p className="font-bold text-white text-sm">{name}</p>
                                  <p className="text-[10px] text-zinc-500">{email}</p>
                                  <p className="text-[10px] text-emerald-500 font-medium mt-0.5">{farmName}</p>
                                </td>
                                <td className="px-5 py-4 font-semibold text-white">{test.description}</td>
                                <td className="px-5 py-4 text-zinc-400">{test.date}</td>
                                <td className="px-5 py-4 text-center">
                                  <div className="flex justify-center items-center gap-1.5 flex-wrap">
                                    <span className="px-2 py-0.5 rounded bg-white/5 font-semibold text-[10px]" title="pH">pH: {test.ph}</span>
                                    <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-semibold text-[10px]" title="V%">V: {test.vPercent}%</span>
                                    <span className={`px-2 py-0.5 rounded font-semibold text-[10px] ${getPStatus(test.p).color} bg-white/5`} title="Fósforo">P: {test.p}</span>
                                    <span className={`px-2 py-0.5 rounded font-semibold text-[10px] ${getKStatus(test.k).color} bg-white/5`} title="Potássio">K: {test.k}</span>
                                  </div>
                                </td>
                                <td className="px-5 py-4 text-center font-bold text-yellow-500 text-sm">
                                  {test.limingNeed > 0 ? `${test.limingNeed} t/ha` : "Não necessita"}
                                </td>
                                <td className="px-5 py-4 text-center">
                                  {test.documentUrl ? (
                                    <button
                                      type="button"
                                      onClick={() => openDataUrlOrBlob(test.documentUrl || "")}
                                      className="inline-flex items-center gap-1 bg-emerald-500/10 hover:bg-emerald-500 text-emerald-400 hover:text-white px-3 py-1.5 rounded-xl border border-emerald-500/20 text-[10px] font-bold uppercase transition-all cursor-pointer"
                                    >
                                      <FileText size={12} /> Ver Laudo
                                    </button>
                                  ) : (
                                    <span className="text-zinc-600 text-[10px] italic">Sem documento</span>
                                  )}
                                </td>
                                <td className="px-5 py-4 text-center">
                                  <div className="flex justify-center items-center gap-2">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setEditingAnalysis(test);
                                        setEditDescription(test.description);
                                        setEditPh(test.ph);
                                        setEditP(test.p);
                                        setEditK(test.k);
                                        setEditCa(test.ca);
                                        setEditMg(test.mg);
                                        setEditHAl(test.hAl);
                                        setEditPrnt(80);
                                        setEditDocumentUrl(test.documentUrl || "");
                                      }}
                                      className="bg-primary/10 hover:bg-primary text-primary hover:text-white px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border-0"
                                      title="Editar"
                                    >
                                      Editar
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleDelete(test.id)}
                                      className="bg-red-500/5 hover:bg-red-500/20 text-red-400 p-2 rounded-xl text-xs font-bold transition-all cursor-pointer border-0"
                                      title="Excluir"
                                    >
                                      <Trash2 size={13} />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                      </tbody>
                    </table>
                  </div>

                  {/* Paginação */}
                  {Math.ceil(
                    allAnalyses.filter(item => {
                      const matchesSearch = !searchTerm.trim() || 
                        item.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        (item.user_profiles?.full_name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
                        (item.user_profiles?.email || "").toLowerCase().includes(searchTerm.toLowerCase());
                        
                      const matchesDate = (!startDate || item.date >= startDate) &&
                                          (!endDate || item.date <= endDate);
                                          
                      return matchesSearch && matchesDate;
                    }).length / itemsPerPage
                  ) > 1 && (
                    <div className="flex items-center justify-between pt-4 border-t border-white/5 text-xs">
                      <p className="text-zinc-500">
                        Página <span className="text-white font-bold">{currentPage}</span>
                      </p>
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                          disabled={currentPage === 1}
                          className="px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 disabled:opacity-50 text-white font-semibold cursor-pointer disabled:cursor-not-allowed transition-colors border-0"
                        >
                          Anterior
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const total = allAnalyses.filter(item => {
                              const matchesSearch = !searchTerm.trim() || 
                                item.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                (item.user_profiles?.full_name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
                                (item.user_profiles?.email || "").toLowerCase().includes(searchTerm.toLowerCase());
                                
                              const matchesDate = (!startDate || item.date >= startDate) &&
                                                  (!endDate || item.date <= endDate);
                                                  
                              return matchesSearch && matchesDate;
                            }).length;
                            const maxPage = Math.ceil(total / itemsPerPage);
                            setCurrentPage(prev => Math.min(prev + 1, maxPage));
                          }}
                          disabled={
                            currentPage === Math.ceil(
                              allAnalyses.filter(item => {
                                const matchesSearch = !searchTerm.trim() || 
                                  item.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                  (item.user_profiles?.full_name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
                                  (item.user_profiles?.email || "").toLowerCase().includes(searchTerm.toLowerCase());
                                  
                                const matchesDate = (!startDate || item.date >= startDate) &&
                                                    (!endDate || item.date <= endDate);
                                                    
                                return matchesSearch && matchesDate;
                              }).length / itemsPerPage
                            )
                          }
                          className="px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 disabled:opacity-50 text-white font-semibold cursor-pointer disabled:cursor-not-allowed transition-colors border-0"
                        >
                          Próximo
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

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

        {/* EDIT ANALYSIS MODAL */}
        <AnimatePresence>
          {editingAnalysis && (
            <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setEditingAnalysis(null)}
                className="fixed inset-0 bg-black/80 backdrop-blur-md"
              />

              <motion.div
                initial={{ scale: 0.95, y: 20, opacity: 0 }}
                animate={{ scale: 1, y: 0, opacity: 1 }}
                exit={{ scale: 0.95, y: 20, opacity: 0 }}
                className="bg-zinc-950 border border-emerald-500/20 rounded-[2.5rem] w-full max-w-2xl p-6 md:p-8 relative z-10 overflow-hidden shadow-2xl space-y-6 font-sans text-white max-h-[90vh] overflow-y-auto"
              >
                <button
                  type="button"
                  onClick={() => setEditingAnalysis(null)}
                  className="absolute top-6 right-6 p-2 rounded-full hover:bg-white/5 text-zinc-400 hover:text-white transition-colors cursor-pointer border-0"
                >
                  <X size={18} />
                </button>

                <div>
                  <h3 className="text-xl font-bold text-white flex items-center gap-2">
                    <Calculator className="text-primary w-5 h-5" />
                    Editar Análise de Solo
                  </h3>
                  <p className="text-xs text-zinc-400 mt-1">
                    Editando análise de {editingAnalysis.user_profiles?.full_name || "Assinante"} - Gleba: {editingAnalysis.description}
                  </p>
                </div>

                <form onSubmit={handleUpdateAnalysis} className="space-y-5">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest block">Identificação / Gleba</label>
                    <input
                      type="text"
                      required
                      value={editDescription}
                      onChange={(e) => setEditDescription(e.target.value)}
                      className="w-full bg-black/40 border border-white/10 rounded-2xl py-3 px-4 text-white text-xs focus:outline-none focus:border-primary/50"
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
                        value={editPh}
                        onChange={(e) => setEditPh(parseFloat(e.target.value) || 0)}
                        className="w-full bg-black/40 border border-white/10 rounded-2xl py-2 px-3 text-white text-xs focus:outline-none focus:border-primary/50"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-slate-300">Fósforo P (mg/dm³)</label>
                      <input
                        type="number"
                        step="0.1"
                        value={editP}
                        onChange={(e) => setEditP(parseFloat(e.target.value) || 0)}
                        className="w-full bg-black/40 border border-white/10 rounded-2xl py-2 px-3 text-white text-xs focus:outline-none focus:border-primary/50"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-slate-300">Potássio K (cmolc/dm³)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={editK}
                        onChange={(e) => setEditK(parseFloat(e.target.value) || 0)}
                        className="w-full bg-black/40 border border-white/10 rounded-2xl py-2 px-3 text-white text-xs focus:outline-none focus:border-primary/50"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-slate-300">Cálcio Ca (cmolc/dm³)</label>
                      <input
                        type="number"
                        step="0.1"
                        value={editCa}
                        onChange={(e) => setEditCa(parseFloat(e.target.value) || 0)}
                        className="w-full bg-black/40 border border-white/10 rounded-2xl py-2 px-3 text-white text-xs focus:outline-none focus:border-primary/50"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-slate-300">Magnésio Mg (cmolc/dm³)</label>
                      <input
                        type="number"
                        step="0.1"
                        value={editMg}
                        onChange={(e) => setEditMg(parseFloat(e.target.value) || 0)}
                        className="w-full bg-black/40 border border-white/10 rounded-2xl py-2 px-3 text-white text-xs focus:outline-none focus:border-primary/50"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-slate-300">H + Al (cmolc/dm³)</label>
                      <input
                        type="number"
                        step="0.1"
                        value={editHAl}
                        onChange={(e) => setEditHAl(parseFloat(e.target.value) || 0)}
                        className="w-full bg-black/40 border border-white/10 rounded-2xl py-2 px-3 text-white text-xs focus:outline-none focus:border-primary/50"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-slate-300">PRNT do Calcário (%)</label>
                      <input
                        type="number"
                        step="1"
                        min="50"
                        max="120"
                        value={editPrnt}
                        onChange={(e) => setEditPrnt(parseInt(e.target.value) || 80)}
                        className="w-full bg-black/40 border border-white/10 rounded-2xl py-2 px-3 text-white text-xs focus:outline-none focus:border-primary/50"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-slate-300">Anexar Novo Laudo PDF (Opcional)</label>
                    <div className="flex items-center gap-4">
                      <input
                        type="file"
                        accept=".pdf"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          if (!file.name.toLowerCase().endsWith('.pdf')) {
                            toast.error("Por favor, selecione apenas arquivos em formato PDF.");
                            return;
                          }
                          setUploadingEditDoc(true);
                          try {
                            const fileExt = file.name.split('.').pop();
                            const fileName = `soil-analysis-${Date.now()}.${fileExt}`;
                            const filePath = `${editingAnalysis.user_id}/${fileName}`;
                            
                            await supabase.storage.createBucket('soil-analyses', { public: true }).catch(() => {});
                            
                            let finalUrl = "";
                            const { error: uploadError } = await supabase.storage
                              .from('soil-analyses')
                              .upload(filePath, file, { cacheControl: '3600', upsert: true });
                              
                            if (uploadError) {
                              const { error: fallbackError } = await supabase.storage
                                .from('library-files')
                                .upload(filePath, file, { cacheControl: '3600', upsert: true });
                              if (fallbackError) {
                                // base64 fallback
                                finalUrl = await new Promise<string>((resolve) => {
                                  const reader = new FileReader();
                                  reader.onloadend = () => resolve(reader.result as string);
                                  reader.readAsDataURL(file);
                                });
                              } else {
                                finalUrl = supabase.storage.from('library-files').getPublicUrl(filePath).data.publicUrl;
                              }
                            } else {
                              finalUrl = supabase.storage.from('soil-analyses').getPublicUrl(filePath).data.publicUrl;
                            }
                            
                            setEditDocumentUrl(finalUrl);
                            toast.success("Novo laudo anexado com sucesso!");
                          } catch (err) {
                            console.error("Error uploading edit document:", err);
                            toast.error("Erro ao fazer upload do documento.");
                          } finally {
                            setUploadingEditDoc(false);
                          }
                        }}
                        className="flex-1 bg-black/40 border border-white/10 rounded-2xl py-2.5 px-4 text-white text-xs file:mr-4 file:py-1 file:px-2.5 file:rounded-lg file:border-0 file:text-[10px] file:font-semibold file:bg-primary file:text-white"
                      />
                      {uploadingEditDoc && <Loader2 className="w-5 h-5 text-primary animate-spin shrink-0" />}
                    </div>
                    {editDocumentUrl && (
                      <p className="text-[10px] text-emerald-400">
                        Laudo atual:{' '}
                        <button
                          type="button"
                          onClick={() => openDataUrlOrBlob(editDocumentUrl)}
                          className="underline font-bold text-white hover:text-primary bg-transparent border-0 p-0 cursor-pointer text-[10px] inline-block font-sans"
                        >
                          Visualizar
                        </button>
                      </p>
                    )}
                  </div>

                  <div className="flex justify-end gap-3 pt-3">
                    <button
                      type="button"
                      onClick={() => setEditingAnalysis(null)}
                      className="px-5 py-3 rounded-2xl bg-white/5 hover:bg-white/10 text-white font-semibold text-xs cursor-pointer transition-colors border-0"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-3 rounded-2xl bg-primary hover:bg-primary-dark text-white font-black text-xs uppercase tracking-wider transition-all shadow-md cursor-pointer border-0"
                    >
                      Salvar Alterações
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </Layout>
  );
}
