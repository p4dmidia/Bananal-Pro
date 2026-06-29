import React, { useEffect, useState } from "react";
import AdminLayout from "../../components/Layout/AdminLayout";
import { motion, AnimatePresence } from "motion/react";
import { 
  BookOpen, 
  Plus, 
  Search, 
  Trash2, 
  FileText, 
  FileSpreadsheet, 
  Download, 
  Loader2,
  X,
  Save,
  CheckCircle,
  FolderOpen
} from "lucide-react";
import { supabase as supabaseClient } from "../../lib/supabase";
const supabase = supabaseClient as any;
import toast from "react-hot-toast";

interface LibraryResourceItem {
  id: string;
  title: string;
  description: string;
  category: "fitossanidade" | "nutricao" | "gestao" | "mercado";
  type: "pdf" | "xlsx" | "doc";
  size: string;
  author: string;
  year: string;
  file_url: string;
  created_at?: string;
}

const formatBytes = (bytes: number, decimals = 1) => {
  if (!bytes) return "0 Bytes";
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
};

export default function AdminLibrary() {
  const [resources, setResources] = useState<LibraryResourceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);

  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Form state
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "fitossanidade" as "fitossanidade" | "nutricao" | "gestao" | "mercado",
    type: "pdf" as "pdf" | "xlsx" | "doc",
    size: "",
    author: "",
    year: new Date().getFullYear().toString(),
    file_url: ""
  });

  const fetchResources = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('library_resources')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setResources(data || []);
    } catch (err: any) {
      console.warn("Erro ao carregar tabela 'library_resources' do Supabase:", err);
      // Fallback local se a tabela ainda não tiver sido criada pelo SQL
      const local = localStorage.getItem("admin_library_resources_db");
      if (local) {
        setResources(JSON.parse(local));
      } else {
        setResources([]);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResources();
  }, []);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadProgress(0);

    try {
      const fileExt = file.name.split('.').pop()?.toLowerCase();
      
      // Map file extension to type
      let docType: "pdf" | "xlsx" | "doc" = "pdf";
      if (fileExt === "xlsx" || fileExt === "xls" || fileExt === "csv") {
        docType = "xlsx";
      } else if (fileExt === "doc" || fileExt === "docx") {
        docType = "doc";
      }

      const fileName = `${crypto.randomUUID()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { data, error } = await supabase.storage
        .from('library-files')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
          onUploadProgress: (progress: any) => {
            const percentage = Math.round((progress.loaded / progress.total) * 100);
            setUploadProgress(percentage);
          }
        });

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from('library-files')
        .getPublicUrl(filePath);

      const fileSizeFormatted = formatBytes(file.size);

      setFormData(prev => ({
        ...prev,
        file_url: publicUrl,
        size: fileSizeFormatted,
        type: docType,
        title: prev.title || file.name.replace(/\.[^/.]+$/, "") // Remove a extensão do título se estiver vazio
      }));

      toast.success("Arquivo enviado com sucesso!");
    } catch (err: any) {
      console.error("Erro ao fazer upload do arquivo:", err);
      toast.error("Erro ao enviar arquivo: " + err.message);
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.file_url) {
      return toast.error("Título e Arquivo são obrigatórios.");
    }

    setIsSaving(true);
    try {
      const payload: LibraryResourceItem = {
        id: editingId || crypto.randomUUID(),
        title: formData.title,
        description: formData.description,
        category: formData.category,
        type: formData.type,
        size: formData.size || "1.0 MB",
        author: formData.author || "Bananal PRO",
        year: formData.year || new Date().getFullYear().toString(),
        file_url: formData.file_url
      };

      try {
        if (editingId) {
          const { error } = await supabase
            .from('library_resources')
            .update(payload)
            .eq('id', editingId);
          if (error) throw error;
        } else {
          const { error } = await supabase
            .from('library_resources')
            .insert([payload]);
          if (error) throw error;
        }
      } catch (dbErr) {
        // Fallback local se falhar ou tabela não existir
        let current = [...resources];
        if (editingId) {
          current = current.map(item => item.id === editingId ? payload : item);
        } else {
          current = [payload, ...current];
        }
        setResources(current);
        localStorage.setItem("admin_library_resources_db", JSON.stringify(current));
      }

      toast.success(editingId ? "Recurso atualizado com sucesso!" : "Recurso adicionado com sucesso!");
      setIsModalOpen(false);
      resetForm();
      fetchResources();
    } catch (err: any) {
      console.error("Erro ao salvar recurso:", err);
      toast.error("Erro ao salvar: " + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string, fileUrl: string) => {
    if (!confirm("Tem certeza que deseja remover este arquivo da biblioteca?")) return;

    try {
      // Tenta remover o arquivo do storage se ele estiver no nosso bucket
      if (fileUrl && fileUrl.includes('/library-files/')) {
        try {
          const fileName = fileUrl.split('/library-files/').pop();
          if (fileName) {
            await supabase.storage.from('library-files').remove([fileName]);
          }
        } catch (storageErr) {
          console.warn("Aviso: Não foi possível deletar o arquivo físico do storage:", storageErr);
        }
      }

      try {
        const { error } = await supabase.from('library_resources').delete().eq('id', id);
        if (error) throw error;
      } catch (dbErr) {
        const updated = resources.filter(item => item.id !== id);
        setResources(updated);
        localStorage.setItem("admin_library_resources_db", JSON.stringify(updated));
      }

      toast.success("Recurso removido com sucesso!");
      fetchResources();
    } catch (err: any) {
      console.error("Erro ao excluir recurso:", err);
      toast.error("Erro ao excluir: " + err.message);
    }
  };

  const handleEdit = (res: LibraryResourceItem) => {
    setFormData({
      title: res.title,
      description: res.description,
      category: res.category,
      type: res.type,
      size: res.size,
      author: res.author,
      year: res.year,
      file_url: res.file_url
    });
    setEditingId(res.id);
    setIsModalOpen(true);
  };

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      category: "fitossanidade",
      type: "pdf",
      size: "",
      author: "",
      year: new Date().getFullYear().toString(),
      file_url: ""
    });
    setEditingId(null);
  };

  const filteredResources = resources.filter(res => 
    res.title.toLowerCase().includes(search.toLowerCase()) || 
    res.description.toLowerCase().includes(search.toLowerCase()) || 
    res.author.toLowerCase().includes(search.toLowerCase())
  );

  const getCategoryLabel = (cat: string) => {
    switch(cat) {
      case "fitossanidade": return "Fitossanidade / Pragas";
      case "nutricao": return "Nutrição & Solo";
      case "gestao": return "Gestão Rurfinanceira";
      case "mercado": return "Mercado & Variedades";
      default: return cat;
    }
  };

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-emerald-500/10 dark:bg-emerald-500/20 rounded-2xl border border-emerald-500/20">
              <BookOpen className="text-[#589c1c] dark:text-[#6ee7b7] w-8 h-8" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-800 dark:text-white">Gestão da Biblioteca Técnica</h1>
              <p className="text-slate-500 dark:text-zinc-400 text-sm mt-1">Publique cartilhas, planilhas de cálculo e boletins técnicos para os assinantes realizarem download.</p>
            </div>
          </div>
          <button 
            onClick={() => { resetForm(); setIsModalOpen(true); }}
            className="bg-[#589c1c] hover:bg-[#467c16] dark:bg-[#10b981] dark:hover:bg-[#0d9468] text-white px-6 py-4 rounded-2xl font-bold flex items-center gap-2 transition-all shadow-lg shadow-emerald-600/10 active:scale-95 self-end md:self-auto cursor-pointer"
          >
            <Plus size={20} />
            Publicar Arquivo
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-zinc-500 group-focus-within:text-emerald-500 transition-colors" size={20} />
            <input 
              type="text" 
              placeholder="Pesquisar arquivos por título, descrição ou autor..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-white dark:bg-zinc-900/40 border border-slate-200 dark:border-white/10 rounded-2xl pl-12 pr-4 py-4 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all placeholder:text-slate-400 dark:placeholder:text-zinc-650"
            />
          </div>
        </div>

        {/* List Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-10 h-10 text-emerald-500 animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredResources.length === 0 ? (
              <div className="col-span-full py-20 text-center space-y-4 bg-white dark:bg-zinc-900/20 rounded-[2rem] border border-dashed border-slate-200 dark:border-white/10">
                <FolderOpen className="mx-auto text-slate-400 dark:text-zinc-600 w-12 h-12" />
                <div className="space-y-1">
                  <p className="text-slate-800 dark:text-white font-bold">Nenhum arquivo publicado</p>
                  <p className="text-slate-500 dark:text-zinc-500 text-sm">Adicione um novo recurso para começar.</p>
                </div>
              </div>
            ) : (
              filteredResources.map((res) => (
                <motion.div 
                  key={res.id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white dark:bg-zinc-900/40 border border-slate-100 dark:border-white/5 p-6 rounded-[2rem] shadow-sm flex flex-col justify-between hover:border-emerald-500/30 dark:hover:border-emerald-500/30 transition-all"
                >
                  <div className="space-y-4">
                    <div className="flex items-start justify-between">
                      <span className="text-[10px] font-black px-3 py-1 rounded-full uppercase bg-emerald-500/10 text-[#589c1c] dark:text-emerald-400 border border-emerald-500/20">
                        {getCategoryLabel(res.category)}
                      </span>

                      <div className="flex gap-2">
                        <button 
                          onClick={() => handleEdit(res)}
                          className="p-2 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 rounded-xl text-slate-500 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-white transition-all text-xs font-bold cursor-pointer"
                        >
                          Editar
                        </button>
                        <button 
                          onClick={() => handleDelete(res.id, res.file_url)}
                          className="p-2 bg-red-500/10 hover:bg-red-600 rounded-xl text-red-655 hover:text-white transition-all cursor-pointer"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>

                    <div className="flex gap-4">
                      <div className="w-12 h-12 shrink-0 bg-slate-50 dark:bg-white/5 border border-slate-150 dark:border-white/5 rounded-2xl flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                        {res.type === "xlsx" ? <FileSpreadsheet size={24} /> : <FileText size={24} />}
                      </div>
                      <div className="space-y-1">
                        <h3 className="text-base font-bold text-slate-800 dark:text-white leading-tight">{res.title}</h3>
                        <p className="text-slate-400 dark:text-zinc-500 text-xs">
                          {res.author} • Publicado em {res.year}
                        </p>
                      </div>
                    </div>

                    <p className="text-slate-500 dark:text-zinc-400 text-xs leading-relaxed line-clamp-2">{res.description}</p>
                  </div>

                  <div className="pt-4 mt-6 border-t border-slate-100 dark:border-white/5 flex items-center justify-between">
                    <span className="text-[10px] font-bold text-slate-500 dark:text-zinc-500 bg-slate-50 dark:bg-white/5 px-2.5 py-1 rounded uppercase tracking-widest border border-slate-150 dark:border-white/5">
                      {res.type} • {res.size}
                    </span>
                    <a 
                      href={res.file_url} 
                      target="_blank" 
                      rel="noreferrer"
                      className="bg-[#589c1c]/10 dark:bg-[#10b981]/10 hover:bg-[#589c1c] dark:hover:bg-[#10b981] text-[#589c1c] dark:text-[#6ee7b7] hover:text-white px-3.5 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer border border-[#589c1c]/10 dark:border-[#10b981]/10"
                    >
                      <Download size={12} />
                      Baixar Arquivo
                    </a>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        )}

        {/* Modal Editor */}
        <AnimatePresence>
          {isModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <motion.div 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/90 backdrop-blur-md"
                onClick={() => !isSaving && !isUploading && setIsModalOpen(false)}
              />
              <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="relative w-full max-w-3xl bg-zinc-950 border border-white/10 rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
              >
                <div className="p-8 border-b border-white/5 flex items-center justify-between">
                  <h2 className="text-2xl font-black text-white uppercase tracking-tighter">
                    {editingId ? "Editar Arquivo" : "Publicar Novo Arquivo"}
                  </h2>
                  <button 
                    onClick={() => !isSaving && !isUploading && setIsModalOpen(false)} 
                    className="p-2 hover:bg-white/5 rounded-xl text-zinc-500 transition-all cursor-pointer"
                  >
                    <X size={24} />
                  </button>
                </div>

                <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-8 space-y-6 custom-scrollbar">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    
                    {/* File Upload Area */}
                    <div className="space-y-4 md:col-span-2 bg-zinc-900/20 border border-white/5 p-5 rounded-[2rem]">
                      <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Upload do Documento (PDF, Excel, Word)</label>
                      
                      <div className="relative flex flex-col items-center justify-center border border-dashed border-white/10 hover:border-emerald-500/30 p-6 rounded-2xl bg-black/40 group transition-all text-center">
                        {isUploading ? (
                          <div className="flex flex-col items-center space-y-2 py-4">
                            <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
                            <p className="text-xs font-bold text-white">Enviando arquivo...</p>
                            <p className="text-[10px] text-zinc-500">{uploadProgress}% concluído</p>
                          </div>
                        ) : (
                          <label className="cursor-pointer w-full py-4 space-y-2">
                            <div className="text-xs font-bold text-emerald-400 group-hover:text-emerald-300">
                              Clique para fazer upload de um arquivo
                            </div>
                            <div className="text-[10px] text-zinc-500">
                              PDF, XLSX, XLS, DOC, DOCX (Será salvo no Supabase Storage)
                            </div>
                            <input 
                              type="file" 
                              accept=".pdf,.xlsx,.xls,.doc,.docx,.csv" 
                              onChange={handleFileUpload} 
                              className="hidden" 
                            />
                          </label>
                        )}
                      </div>

                      {formData.file_url && (
                        <div className="space-y-2 pt-2">
                          <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-1">
                            <CheckCircle size={12} />
                            Arquivo carregado: {formData.size}
                          </span>
                          <input 
                            type="url" required value={formData.file_url} 
                            onChange={e => setFormData({...formData, file_url: e.target.value})}
                            placeholder="URL do arquivo"
                            className="w-full bg-zinc-900/50 border border-white/10 rounded-2xl px-4 py-2.5 text-xs text-zinc-400 font-mono"
                          />
                        </div>
                      )}
                    </div>

                    <div className="space-y-2 md:col-span-2">
                      <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Título do Documento</label>
                      <input 
                        type="text" required value={formData.title} 
                        onChange={e => setFormData({...formData, title: e.target.value})}
                        placeholder="Ex: Cartilha de Manejo de Sigatoka"
                        className="w-full bg-zinc-900/50 border border-white/10 rounded-2xl px-5 py-4 text-white focus:ring-2 focus:ring-emerald-500/50 font-bold"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Autor / Órgão Emissor</label>
                      <input 
                        type="text" required value={formData.author} 
                        onChange={e => setFormData({...formData, author: e.target.value})}
                        placeholder="Ex: Embrapa, Dr. Carlos Silva"
                        className="w-full bg-zinc-900/50 border border-white/10 rounded-2xl px-5 py-4 text-white focus:ring-2 focus:ring-emerald-500/50 font-bold"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Ano de Publicação</label>
                      <input 
                        type="text" required value={formData.year} 
                        onChange={e => setFormData({...formData, year: e.target.value})}
                        placeholder="Ex: 2026"
                        className="w-full bg-zinc-900/50 border border-white/10 rounded-2xl px-5 py-4 text-white focus:ring-2 focus:ring-emerald-500/50 font-bold"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Categoria</label>
                      <select 
                        value={formData.category} 
                        onChange={e => setFormData({...formData, category: e.target.value as any})}
                        className="w-full bg-zinc-900 border border-white/10 rounded-2xl px-5 py-4 text-white focus:ring-2 focus:ring-emerald-500/50 font-bold h-[54px] cursor-pointer"
                      >
                        <option value="fitossanidade">Fitossanidade / Pragas</option>
                        <option value="nutricao">Nutrição & Solo</option>
                        <option value="gestao">Gestão Rurfinanceira</option>
                        <option value="mercado">Mercado & Variedades</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Formato do Arquivo</label>
                      <select 
                        value={formData.type} 
                        onChange={e => setFormData({...formData, type: e.target.value as any})}
                        className="w-full bg-zinc-900 border border-white/10 rounded-2xl px-5 py-4 text-white focus:ring-2 focus:ring-emerald-500/50 font-bold h-[54px] cursor-pointer"
                      >
                        <option value="pdf">PDF (Documento)</option>
                        <option value="xlsx">XLSX (Planilha Excel)</option>
                        <option value="doc">DOC (Arquivo Word)</option>
                      </select>
                    </div>

                    <div className="space-y-2 md:col-span-2">
                      <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Descrição do Conteúdo</label>
                      <textarea 
                        rows={3} value={formData.description} 
                        onChange={e => setFormData({...formData, description: e.target.value})}
                        placeholder="Descreva brevemente o que o assinante encontrará neste documento técnico..."
                        className="w-full bg-zinc-900/50 border border-white/10 rounded-2xl px-5 py-4 text-white focus:ring-2 focus:ring-emerald-500/50 font-semibold resize-none"
                      />
                    </div>

                  </div>

                  <div className="border-t border-white/5 pt-6 flex gap-4">
                    <button 
                      type="button" 
                      disabled={isSaving || isUploading} 
                      onClick={() => setIsModalOpen(false)}
                      className="flex-1 bg-white/5 hover:bg-white/10 text-white font-bold py-4 rounded-2xl transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                    >
                      Cancelar
                    </button>
                    <button 
                      type="submit" 
                      disabled={isSaving || isUploading}
                      className="flex-[2] bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-4 rounded-2xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                    >
                      {isSaving || isUploading ? <Loader2 className="animate-spin" /> : <Save size={18} />}
                      {isSaving ? "Salvando..." : isUploading ? "Enviando arquivo..." : "Salvar Arquivo"}
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </AdminLayout>
  );
}
