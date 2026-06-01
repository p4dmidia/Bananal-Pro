import React, { useState, useEffect } from "react";
import Layout from "../../components/Layout/Layout";
import { motion, AnimatePresence } from "motion/react";
import { 
  BookOpen, 
  Search, 
  Download, 
  FileText, 
  Database,
  FileSpreadsheet, 
  Award,
  Filter,
  CheckCircle,
  Loader2
} from "lucide-react";
import toast from "react-hot-toast";
import { supabase as supabaseClient } from "../../lib/supabase";
const supabase = supabaseClient as any;

interface LibraryResource {
  id: string;
  title: string;
  description: string;
  category: "fitossanidade" | "nutricao" | "gestao" | "mercado";
  type: "pdf" | "xlsx" | "doc";
  size: string;
  author: string;
  year: string;
  file_url: string;
}

const fallbackResources: LibraryResource[] = [
  {
    id: "res-1",
    title: "Manual Prático de Identificação e Controle da Sigatoka Negra",
    description: "Guia ilustrado com sintomas de campo, diagnóstico precoce e estratégias de rotação de princípios ativos para fungicidas.",
    category: "fitossanidade",
    type: "pdf",
    size: "4.8 MB",
    author: "Embrapa Mandioca e Fruticultura",
    year: "2024",
    file_url: "https://example.com/materials/sigatoka_manual.pdf"
  },
  {
    id: "res-2",
    title: "Planilha de Gestão Financeira e Custo Operacional Efetivo (COE)",
    description: "Modelo Excel avançado parametrizado para cálculo automático do Break-Even (Ponto de Equilíbrio) em caixas de banana colhidas.",
    category: "gestao",
    type: "xlsx",
    size: "1.2 MB",
    author: "Bananal PRO Consultoria",
    year: "2026",
    file_url: "https://example.com/materials/gestao_financeira.xlsx"
  },
  {
    id: "res-3",
    title: "Boletim Técnico: Recomendação de Adubação e Calagem na Bananicultura",
    description: "Tabela oficial de interpretação de análises químicas de solo com foco na absorção de Potássio (K) e relações de Cálcio/Magnésio.",
    category: "nutricao",
    type: "pdf",
    size: "2.5 MB",
    author: "Dr. Carlos Silva (Bananal PRO)",
    year: "2025",
    file_url: "https://example.com/materials/adubacao_calagem.pdf"
  },
  {
    id: "res-4",
    title: "Guia de Pragas: Combate ao Moleque da Bananeira (Cosmopolites sordidus)",
    description: "Instruções completas para fabricação de iscas de pseudocaule (tipo queijo e sanduíche) e monitoramento de infestações.",
    category: "fitossanidade",
    type: "pdf",
    size: "3.1 MB",
    author: "Embrapa Mandioca e Fruticultura",
    year: "2023",
    file_url: "https://example.com/materials/combate_moleque.pdf"
  },
  {
    id: "res-5",
    title: "Infográfico Interativo: Variedades de Banana Comercializadas no Brasil",
    description: "Guia comparativo detalhando tolerância a doenças, ciclo de produção e mercado consumidor de Prata Anã, Nanica, Maçã e Ouro.",
    category: "mercado",
    type: "pdf",
    size: "8.7 MB",
    author: "Secretaria de Agricultura / MG",
    year: "2024",
    file_url: "https://example.com/materials/variedades_banana.pdf"
  },
  {
    id: "res-6",
    title: "Calculadora Manual de Necessidade de Calagem (Fórmula de Saturação)",
    description: "Ficha em PDF contendo as fórmulas detalhadas passo a passo para cálculo manual de necessidade de gesso e calcário dolomítico.",
    category: "nutricao",
    type: "pdf",
    size: "950 KB",
    author: "Dr. Carlos Silva (Bananal PRO)",
    year: "2025",
    file_url: "https://example.com/materials/calculadora_calagem.pdf"
  }
];

export default function Library() {
  const [resources, setResources] = useState<LibraryResource[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const loadResources = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("library_resources")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setResources(data || []);
    } catch (err) {
      console.warn("Erro ao buscar arquivos da biblioteca técnica:", err);
      setResources(fallbackResources);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadResources();
  }, []);

  const handleDownload = (res: LibraryResource) => {
    setDownloadingId(res.id);
    
    try {
      if (res.file_url) {
        window.open(res.file_url, '_blank');
        toast.success(`Download de "${res.title}" iniciado!`, {
          icon: "💾",
          style: {
            borderRadius: "1rem",
            background: "#05160f",
            color: "#ecfdf5",
            border: "1px solid rgba(117, 252, 167, 0.15)",
            fontSize: "12px",
            fontWeight: "bold"
          }
        });
      } else {
        toast.error("Link do arquivo não disponível.");
      }
    } catch (err) {
      toast.error("Erro ao iniciar o download.");
    } finally {
      setDownloadingId(null);
    }
  };

  const filteredResources = resources.filter(res => {
    const matchesSearch = res.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          res.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          res.author.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = selectedCategory === "all" || res.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  const categories = [
    { id: "all", label: "Todos os Arquivos" },
    { id: "fitossanidade", label: "Fitossanidade / Pragas" },
    { id: "nutricao", label: "Nutrição & Solo" },
    { id: "gestao", label: "Gestão Rurfinanceira" },
    { id: "mercado", label: "Mercado & Variedades" }
  ];

  return (
    <Layout>
      <div className="space-y-8 pb-12">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-headline font-bold text-white flex items-center gap-3">
            <BookOpen className="text-emerald-500 w-8 h-8" />
            Biblioteca Técnica
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Acesse e baixe guias técnicos, tabelas, cartilhas agrícolas e planilhas operacionais exclusivas.
          </p>
        </div>

        {/* Search & Category Filter Section */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          
          {/* Search Box */}
          <div className="lg:col-span-4 relative">
            <Search className="absolute left-4 top-3.5 text-slate-500 w-5 h-5" />
            <input 
              type="text" 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar guias ou planilhas..."
              className="w-full bg-zinc-950 border border-white/10 rounded-2xl pl-12 pr-4 py-3 text-xs text-white placeholder-zinc-500 focus:border-emerald-500/50 focus:outline-none transition-colors"
            />
          </div>

          {/* Category Badges */}
          <div className="lg:col-span-8 flex flex-wrap gap-2 overflow-x-auto no-scrollbar py-1">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                  selectedCategory === cat.id 
                    ? "bg-emerald-600 text-white shadow-lg shadow-emerald-600/10" 
                    : "bg-zinc-900 border border-white/5 text-slate-400 hover:border-white/10 hover:text-white"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

        </div>

        {/* Resources Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence mode="popLayout">
            {filteredResources.map((res) => (
              <motion.div
                key={res.id}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className="bg-zinc-950 border border-white/5 p-6 rounded-[2rem] flex flex-col justify-between hover:border-emerald-500/30 transition-all duration-300 group"
              >
                <div className="space-y-4">
                  {/* Category & Icon */}
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] font-black uppercase tracking-widest text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full">
                      {res.category}
                    </span>
                    
                    {res.type === "xlsx" ? (
                      <FileSpreadsheet className="text-emerald-500 w-6 h-6 group-hover:scale-110 transition-transform" />
                    ) : (
                      <FileText className="text-emerald-400 w-6 h-6 group-hover:scale-110 transition-transform" />
                    )}
                  </div>

                  {/* Title & Description */}
                  <div className="space-y-2">
                    <h3 className="text-sm font-bold text-white leading-relaxed group-hover:text-emerald-400 transition-colors">
                      {res.title}
                    </h3>
                    <p className="text-slate-500 text-xs leading-relaxed font-sans line-clamp-3">
                      {res.description}
                    </p>
                  </div>
                </div>

                {/* Metadata & Actions */}
                <div className="mt-6 pt-4 border-t border-white/5 space-y-4">
                  <div className="flex items-center justify-between text-[10px] text-slate-500">
                    <div>
                      <p className="font-semibold text-slate-400">{res.author}</p>
                      <p className="mt-0.5">Publicado em {res.year}</p>
                    </div>
                    <span className="font-bold uppercase tracking-wider text-slate-400 bg-white/5 px-2 py-1 rounded border border-white/5">
                      {res.type} • {res.size}
                    </span>
                  </div>

                  {/* Download Button */}
                  <button
                    onClick={() => handleDownload(res)}
                    disabled={downloadingId !== null}
                    className="w-full bg-zinc-900 border border-white/10 hover:bg-emerald-600 hover:border-emerald-500 hover:text-white text-emerald-400 py-3.5 rounded-xl font-bold text-xs tracking-wider uppercase transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {downloadingId === res.id ? (
                      <>
                        <Loader2 className="animate-spin w-4 h-4" />
                        Aguardando...
                      </>
                    ) : (
                      <>
                        Download do Arquivo
                        <Download size={14} />
                      </>
                    )}
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          
          {filteredResources.length === 0 && (
            <div className="col-span-full py-16 text-center text-slate-500 space-y-3">
              <BookOpen className="mx-auto opacity-20 w-12 h-12" />
              <h4 className="font-bold text-sm text-white">Nenhum recurso encontrado</h4>
              <p className="text-xs max-w-xs mx-auto">Tente refinar sua busca utilizando termos como "calagem", "sigatoka" ou mude o filtro de categoria.</p>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
