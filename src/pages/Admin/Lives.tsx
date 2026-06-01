import React, { useEffect, useState } from "react";
import AdminLayout from "../../components/Layout/AdminLayout";
import { motion, AnimatePresence } from "motion/react";
import { 
  Video, 
  Plus, 
  Search, 
  Trash2, 
  Calendar, 
  Clock, 
  MessageSquare, 
  Link2,
  FileDown, 
  Loader2,
  X,
  Save,
  CheckCircle,
  Play,
  FileText
} from "lucide-react";
import { supabase as supabaseClient } from "../../lib/supabase";
const supabase = supabaseClient as any;
import { toast } from "sonner";

interface LiveItem {
  id: string;
  title: string;
  description: string;
  scheduled_at: string;
  live_url: string;
  status: "scheduled" | "live" | "finished";
  chat_enabled: boolean;
  replay_url?: string;
  materials: { title: string; url: string }[];
  host?: string;
  category?: string;
}

export default function AdminLives() {
  const [lives, setLives] = useState<LiveItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);

  const [isUploadingVideo, setIsUploadingVideo] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('video/')) {
      return toast.error("Por favor, selecione um arquivo de vídeo válido.");
    }

    setIsUploadingVideo(true);
    setUploadProgress(0);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${crypto.randomUUID()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { data, error } = await supabase.storage
        .from('lives-replays')
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
        .from('lives-replays')
        .getPublicUrl(filePath);

      setFormData(prev => ({
        ...prev,
        replay_url: publicUrl
      }));

      toast.success("Vídeo enviado com sucesso!");
    } catch (err: any) {
      console.error("Erro ao fazer upload do vídeo:", err);
      toast.error("Erro ao enviar vídeo: " + err.message);
    } finally {
      setIsUploadingVideo(false);
      setUploadProgress(0);
    }
  };

  const [isUploadingMaterial, setIsUploadingMaterial] = useState(false);
  const [materialUploadProgress, setMaterialUploadProgress] = useState(0);

  const handleMaterialUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingMaterial(true);
    setMaterialUploadProgress(0);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${crypto.randomUUID()}.${fileExt}`;
      const filePath = `materials/${fileName}`;

      const { data, error } = await supabase.storage
        .from('lives-replays')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
          onUploadProgress: (progress: any) => {
            const percentage = Math.round((progress.loaded / progress.total) * 100);
            setMaterialUploadProgress(percentage);
          }
        });

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from('lives-replays')
        .getPublicUrl(filePath);

      // Auto-add directly to materials list
      const newMaterial = { title: file.name, url: publicUrl };
      setMaterialsList(prev => [...prev, newMaterial]);

      // Clear the inputs
      setFormData(prev => ({
        ...prev,
        materialUrl: "",
        materialTitle: ""
      }));

      toast.success("Material enviado e adicionado com sucesso!");
    } catch (err: any) {
      console.error("Erro ao fazer upload do material:", err);
      toast.error("Erro ao enviar arquivo: " + err.message);
    } finally {
      setIsUploadingMaterial(false);
      setMaterialUploadProgress(0);
    }
  };

  // Form state
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    scheduled_at: "",
    live_url: "",
    status: "scheduled" as "scheduled" | "live" | "finished",
    chat_enabled: true,
    replay_url: "",
    materialTitle: "",
    materialUrl: "",
    host: "",
    category: "",
  });

  const [materialsList, setMaterialsList] = useState<{ title: string; url: string }[]>([]);

  const fetchLives = async () => {
    setLoading(true);
    try {
      // Tenta carregar do Supabase. Se a tabela não existir, cai no bloco catch/fallback.
      const { data, error } = await supabase
        .from('lives')
        .select('*')
        .order('scheduled_at', { ascending: false });

      if (error) throw error;
      setLives(data || []);
    } catch (err: any) {
      console.warn("Tabela 'lives' não encontrada ou inacessível. Utilizando fallback local.");
      const local = localStorage.getItem("admin_lives_db");
      if (local) {
        setLives(JSON.parse(local));
      } else {
        const defaultLives: LiveItem[] = [
          {
            id: "1",
            title: "Manejo Nutricional e Calagem da Banana Prata",
            description: "Live técnica focada na interpretação da análise de solo e recomendações práticas para a região Sudeste.",
            scheduled_at: new Date(Date.now() + 86400000 * 2).toISOString(), // 2 days from now
            live_url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
            status: "scheduled",
            chat_enabled: true,
            materials: [
              { title: "Tabela de Nutrientes Recomendados.pdf", url: "https://example.com/materials/nutrientes.pdf" }
            ]
          },
          {
            id: "2",
            title: "Prevenção do Mal do Panamá na Prática",
            description: "Passo a passo com medidas de biossegurança contra a principal ameaça fúngica dos bananais.",
            scheduled_at: new Date(Date.now() - 86400000).toISOString(), // Yesterday
            live_url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
            status: "finished",
            chat_enabled: false,
            replay_url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
            materials: [
              { title: "Manual de Biosseguranca.pdf", url: "https://example.com/materials/biosseguranca.pdf" }
            ]
          }
        ];
        setLives(defaultLives);
        localStorage.setItem("admin_lives_db", JSON.stringify(defaultLives));
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLives();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.scheduled_at) {
      return toast.error("Título e Data Agendada são obrigatórios.");
    }

    setIsSaving(true);
    try {
      // Auto-append unsaved filled material
      let finalMaterials = [...materialsList];
      if (formData.materialTitle && formData.materialUrl) {
        const alreadyExists = finalMaterials.some(m => m.url === formData.materialUrl);
        if (!alreadyExists) {
          finalMaterials.push({ title: formData.materialTitle, url: formData.materialUrl });
        }
      }

      const payload: LiveItem = {
        id: editingId || crypto.randomUUID(),
        title: formData.title,
        description: formData.description,
        scheduled_at: formData.scheduled_at,
        live_url: formData.live_url,
        status: formData.status,
        chat_enabled: formData.chat_enabled,
        replay_url: formData.replay_url || undefined,
        materials: finalMaterials,
        host: formData.host || undefined,
        category: formData.category || undefined
      };

      // Tenta salvar no Supabase
      try {
        if (editingId) {
          const { error } = await supabase
            .from('lives')
            .update(payload)
            .eq('id', editingId);
          if (error) throw error;
        } else {
          const { error } = await supabase
            .from('lives')
            .insert([payload]);
          if (error) throw error;
        }
      } catch (dbErr) {
        // Fallback Local Storage
        let currentLives = [...lives];
        if (editingId) {
          currentLives = currentLives.map(l => l.id === editingId ? payload : l);
        } else {
          currentLives = [payload, ...currentLives];
        }
        setLives(currentLives);
        localStorage.setItem("admin_lives_db", JSON.stringify(currentLives));
      }

      toast.success(editingId ? "Live atualizada com sucesso!" : "Live agendada com sucesso!");
      setIsModalOpen(false);
      resetForm();
      fetchLives();
    } catch (err: any) {
      console.error("Error saving live:", err);
      toast.error("Erro ao salvar: " + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir esta transmissão?")) return;

    try {
      try {
        const { error } = await supabase.from('lives').delete().eq('id', id);
        if (error) throw error;
      } catch (dbErr) {
        const updated = lives.filter(l => l.id !== id);
        setLives(updated);
        localStorage.setItem("admin_lives_db", JSON.stringify(updated));
      }
      toast.success("Transmissão excluída com sucesso!");
      fetchLives();
    } catch (err: any) {
      console.error("Error deleting live:", err);
      toast.error("Erro ao excluir: " + err.message);
    }
  };

  const handleUpdateStatus = async (id: string, newStatus: "scheduled" | "live" | "finished") => {
    try {
      const { error } = await supabase
        .from('lives')
        .update({ status: newStatus })
        .eq('id', id);

      if (error) throw error;

      toast.success(
        newStatus === 'live' 
          ? "Live iniciada! Agora está visível para os assinantes." 
          : "Live finalizada!"
      );
      fetchLives();
    } catch (err: any) {
      console.error("Erro ao atualizar status:", err);
      toast.error("Erro ao atualizar status: " + err.message);
    }
  };

  const handleEdit = (live: LiveItem) => {
    setFormData({
      title: live.title,
      description: live.description,
      scheduled_at: live.scheduled_at.substring(0, 16), // Format for datetime-local input
      live_url: live.live_url,
      status: live.status,
      chat_enabled: live.chat_enabled,
      replay_url: live.replay_url || "",
      materialTitle: "",
      materialUrl: "",
      host: live.host || "",
      category: live.category || "",
    });
    setMaterialsList(live.materials || []);
    setEditingId(live.id);
    setIsModalOpen(true);
  };

  const addMaterial = () => {
    if (!formData.materialTitle || !formData.materialUrl) {
      return toast.error("Informe o título e o link do material.");
    }
    setMaterialsList([...materialsList, { title: formData.materialTitle, url: formData.materialUrl }]);
    setFormData(prev => ({ ...prev, materialTitle: "", materialUrl: "" }));
    toast.success("Material adicionado!");
  };

  const removeMaterial = (index: number) => {
    setMaterialsList(materialsList.filter((_, i) => i !== index));
  };

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      scheduled_at: "",
      live_url: "",
      status: "scheduled",
      chat_enabled: true,
      replay_url: "",
      materialTitle: "",
      materialUrl: "",
      host: "",
      category: "",
    });
    setMaterialsList([]);
    setEditingId(null);
  };

  const filteredLives = lives.filter(l => 
    l.title.toLowerCase().includes(search.toLowerCase()) || 
    l.description.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              <Video className="text-purple-500" />
              Gestão de Lives & Replays
            </h1>
            <p className="text-zinc-500 text-sm mt-1">Agende novas aulas ao vivo, envie replays das lives finalizadas e anexe materiais de apoio.</p>
          </div>
          <button 
            onClick={() => { resetForm(); setIsModalOpen(true); }}
            className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-4 rounded-2xl font-bold flex items-center gap-2 transition-all shadow-lg shadow-purple-600/20 active:scale-95 self-end md:self-auto"
          >
            <Plus size={20} />
            Agendar Live
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-purple-500 transition-colors" size={20} />
            <input 
              type="text" 
              placeholder="Pesquisar lives por título ou descrição..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-zinc-900/50 border border-white/5 rounded-2xl pl-12 pr-4 py-4 text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all placeholder:text-zinc-600"
            />
          </div>
        </div>

        {/* List Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-10 h-10 text-purple-500 animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredLives.length === 0 ? (
              <div className="col-span-full py-20 text-center space-y-4 bg-zinc-900/20 rounded-[3rem] border border-dashed border-white/5">
                <Video className="mx-auto text-zinc-700 w-12 h-12" />
                <div className="space-y-1">
                  <p className="text-white font-bold">Nenhuma live encontrada</p>
                  <p className="text-zinc-500 text-sm">Crie um agendamento para começar.</p>
                </div>
              </div>
            ) : (
              filteredLives.map((live) => (
                <motion.div 
                  key={live.id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-zinc-900/40 border border-white/5 p-6 rounded-[2.5rem] flex flex-col justify-between hover:border-purple-500/30 transition-all"
                >
                  <div className="space-y-4">
                    <div className="flex items-start justify-between">
                      <span className={`text-[10px] font-black px-3 py-1 rounded-full uppercase border ${
                        live.status === "live" ? "bg-red-500/10 text-red-500 border-red-500/20 animate-pulse" :
                        live.status === "scheduled" ? "bg-yellow-500/10 text-yellow-500 border-yellow-500/20" :
                        "bg-zinc-500/10 text-zinc-400 border-white/5"
                      }`}>
                        {live.status === "live" ? "Ao Vivo" : live.status === "scheduled" ? "Agendada" : "Finalizada / Replay"}
                      </span>

                      <div className="flex gap-2">
                        <button 
                          onClick={() => handleEdit(live)}
                          className="p-2 bg-white/5 hover:bg-white/10 rounded-xl text-zinc-400 hover:text-white transition-all text-xs font-bold"
                        >
                          Editar
                        </button>
                        <button 
                          onClick={() => handleDelete(live.id)}
                          className="p-2 bg-red-500/10 hover:bg-red-600 rounded-xl text-red-400 hover:text-white transition-all"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-lg font-bold text-white leading-tight">{live.title}</h3>
                      <p className="text-zinc-500 text-xs mt-1 font-semibold flex items-center gap-1.5">
                        <Calendar size={12} />
                        {new Date(live.scheduled_at).toLocaleString('pt-BR')}
                      </p>
                      <p className="text-zinc-400 text-xs leading-relaxed mt-3 line-clamp-2">{live.description}</p>
                    </div>

                    {live.materials.length > 0 && (
                      <div className="pt-4 border-t border-white/5 space-y-2">
                        <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Materiais de Apoio ({live.materials.length})</p>
                        <div className="flex flex-wrap gap-2">
                          {live.materials.map((m, idx) => (
                            <a 
                              key={idx} 
                              href={m.url} 
                              target="_blank" 
                              rel="noreferrer"
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/5 hover:bg-purple-500/10 rounded-xl text-xs text-zinc-400 hover:text-purple-400 transition-colors border border-white/5"
                            >
                              <FileText size={12} />
                              <span className="truncate max-w-[120px]">{m.title}</span>
                            </a>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="pt-6 mt-6 border-t border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <span className={`text-[10px] font-bold flex items-center gap-1 ${live.chat_enabled ? 'text-emerald-400' : 'text-zinc-500'}`}>
                        <MessageSquare size={12} />
                        Chat {live.chat_enabled ? 'Habilitado' : 'Desabilitado'}
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-2 self-end sm:self-auto">
                      {live.status === 'scheduled' && (
                        <button
                          onClick={() => handleUpdateStatus(live.id, 'live')}
                          className="bg-emerald-600/10 hover:bg-emerald-600 text-emerald-400 hover:text-white px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all"
                        >
                          Transmitir Ao Vivo
                        </button>
                      )}
                      {live.status === 'live' && (
                        <button
                          onClick={() => handleUpdateStatus(live.id, 'finished')}
                          className="bg-red-600/10 hover:bg-red-600 text-red-400 hover:text-white px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all animate-pulse"
                        >
                          Encerrar Transmissão
                        </button>
                      )}

                      <a 
                        href={live.status === 'finished' && live.replay_url ? live.replay_url : live.live_url} 
                        target="_blank" 
                        rel="noreferrer"
                        className="bg-purple-600/10 hover:bg-purple-600 text-purple-400 hover:text-white px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 transition-all"
                      >
                        <Play size={10} fill="currentColor" />
                        {live.status === 'finished' ? 'Ver Replay' : 'Acessar Sala'}
                      </a>
                    </div>
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
                onClick={() => !isSaving && setIsModalOpen(false)}
              />
              <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="relative w-full max-w-3xl bg-zinc-950 border border-white/10 rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
              >
                <div className="p-8 border-b border-white/5 flex items-center justify-between">
                  <h2 className="text-2xl font-black text-white uppercase tracking-tighter">
                    {editingId ? "Editar Transmissão" : "Agendar Nova Transmissão"}
                  </h2>
                  <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-white/5 rounded-xl text-zinc-500 transition-all">
                    <X size={24} />
                  </button>
                </div>

                <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-8 space-y-6 custom-scrollbar">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2 md:col-span-2">
                      <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Título da Live</label>
                      <input 
                        type="text" required value={formData.title} 
                        onChange={e => setFormData({...formData, title: e.target.value})}
                        className="w-full bg-zinc-900/50 border border-white/10 rounded-2xl px-5 py-4 text-white focus:ring-2 focus:ring-purple-500/50 font-bold"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Palestrante (Host)</label>
                      <input 
                        type="text" value={formData.host} 
                        onChange={e => setFormData({...formData, host: e.target.value})}
                        placeholder="Ex: Dr. Carlos Silva"
                        className="w-full bg-zinc-900/50 border border-white/10 rounded-2xl px-5 py-4 text-white focus:ring-2 focus:ring-purple-500/50 font-bold"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Categoria</label>
                      <input 
                        type="text" value={formData.category} 
                        onChange={e => setFormData({...formData, category: e.target.value})}
                        placeholder="Ex: Fitossanidade, Nutrição"
                        className="w-full bg-zinc-900/50 border border-white/10 rounded-2xl px-5 py-4 text-white focus:ring-2 focus:ring-purple-500/50 font-bold"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Data e Hora</label>
                      <input 
                        type="datetime-local" required value={formData.scheduled_at} 
                        onChange={e => setFormData({...formData, scheduled_at: e.target.value})}
                        className="w-full bg-zinc-900/50 border border-white/10 rounded-2xl px-5 py-4 text-white focus:ring-2 focus:ring-purple-500/50 font-bold"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Status</label>
                      <select 
                        value={formData.status} 
                        onChange={e => setFormData({...formData, status: e.target.value as any})}
                        className="w-full bg-zinc-900 border border-white/10 rounded-2xl px-5 py-4 text-white focus:ring-2 focus:ring-purple-500/50 font-bold h-[54px] cursor-pointer"
                      >
                        <option value="scheduled">Agendada</option>
                        <option value="live">Ao Vivo</option>
                        <option value="finished">Finalizada / Replay</option>
                      </select>
                    </div>

                    <div className="space-y-2 md:col-span-2">
                      <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Link de Transmissão (YouTube / Vimeo)</label>
                      <input 
                        type="url" required value={formData.live_url} 
                        onChange={e => setFormData({...formData, live_url: e.target.value})}
                        className="w-full bg-zinc-900/50 border border-white/10 rounded-2xl px-5 py-4 text-white focus:ring-2 focus:ring-purple-500/50 font-mono"
                      />
                    </div>

                    {formData.status === 'finished' && (
                      <div className="space-y-4 md:col-span-2 bg-zinc-900/20 border border-white/5 p-5 rounded-[2rem]">
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Link do Replay / Gravação (Opcional)</label>
                          <input 
                            type="url" value={formData.replay_url} 
                            placeholder="https://youtube.com/watch?v=..."
                            onChange={e => setFormData({...formData, replay_url: e.target.value})}
                            className="w-full bg-zinc-900/50 border border-white/10 rounded-2xl px-5 py-4 text-white focus:ring-2 focus:ring-purple-500/50 font-mono"
                          />
                        </div>
                        
                        <div className="relative flex flex-col items-center justify-center border border-dashed border-white/10 hover:border-purple-500/30 p-6 rounded-2xl bg-black/40 group transition-all text-center">
                          {isUploadingVideo ? (
                            <div className="flex flex-col items-center space-y-2 py-4">
                              <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
                              <p className="text-xs font-bold text-white">Enviando vídeo...</p>
                              <p className="text-[10px] text-zinc-500">{uploadProgress}% concluído</p>
                            </div>
                          ) : (
                            <label className="cursor-pointer w-full py-4 space-y-2">
                              <div className="text-xs font-bold text-purple-400 group-hover:text-purple-300">
                                Ou faça upload de um arquivo de vídeo (.mp4, .webm)
                              </div>
                              <div className="text-[10px] text-zinc-500">
                                O arquivo será salvo diretamente no Supabase Storage
                              </div>
                              <input 
                                type="file" 
                                accept="video/*" 
                                onChange={handleVideoUpload} 
                                className="hidden" 
                              />
                            </label>
                          )}
                        </div>
                      </div>
                    )}

                    <div className="space-y-2 md:col-span-2">
                      <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Resumo / Descrição</label>
                      <textarea 
                        rows={3} value={formData.description} 
                        onChange={e => setFormData({...formData, description: e.target.value})}
                        className="w-full bg-zinc-900/50 border border-white/10 rounded-2xl px-5 py-4 text-white focus:ring-2 focus:ring-purple-500/50 font-semibold resize-none"
                      />
                    </div>

                    <div className="md:col-span-2 flex items-center gap-2 py-2">
                      <input 
                        type="checkbox" id="chat-toggle" checked={formData.chat_enabled} 
                        onChange={e => setFormData({...formData, chat_enabled: e.target.checked})}
                        className="accent-purple-500 w-4 h-4 rounded"
                      />
                      <label htmlFor="chat-toggle" className="text-xs font-bold text-zinc-400 cursor-pointer">
                        Habilitar chat ao vivo para esta transmissão
                      </label>
                    </div>

                    {/* Materials Manager */}
                    <div className="md:col-span-2 border-t border-white/5 pt-6 space-y-4">
                      <h3 className="text-xs font-bold text-purple-400 uppercase tracking-widest">Materiais de Apoio</h3>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Nome do Material</label>
                          <input 
                            type="text" value={formData.materialTitle} 
                            onChange={e => setFormData({...formData, materialTitle: e.target.value})}
                            placeholder="Ex: Tabela Nutrientes.pdf"
                            className="w-full bg-zinc-900/50 border border-white/10 rounded-2xl px-4 py-3 text-white text-xs"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Link ou Upload do Material</label>
                          <div className="flex flex-col gap-2">
                            <div className="flex gap-2">
                              <input 
                                type="url" value={formData.materialUrl} 
                                onChange={e => setFormData({...formData, materialUrl: e.target.value})}
                                placeholder="https://exemplo.com/material.pdf"
                                className="w-full bg-zinc-900/50 border border-white/10 rounded-2xl px-4 py-3 text-white text-xs font-mono flex-1"
                              />
                              <button 
                                type="button" onClick={addMaterial}
                                className="px-4 bg-purple-600 hover:bg-purple-700 text-white rounded-2xl font-bold text-xs cursor-pointer"
                              >
                                Adicionar
                              </button>
                            </div>
                            
                            <div className="flex items-center gap-2">
                              {isUploadingMaterial ? (
                                <div className="flex items-center gap-2 text-xs text-purple-400">
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                  <span>Enviando arquivo... {materialUploadProgress}%</span>
                                </div>
                              ) : (
                                <label className="flex items-center justify-center gap-1.5 px-4 py-2 bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-xl text-xs font-bold cursor-pointer transition-all active:scale-[0.98]">
                                  <span>Fazer upload de arquivo</span>
                                  <input 
                                    type="file" 
                                    onChange={handleMaterialUpload} 
                                    className="hidden" 
                                  />
                                </label>
                              )}
                              {formData.materialUrl && formData.materialUrl.includes('/storage/') && (
                                <span className="text-[10px] text-emerald-400 font-bold">✓ Arquivo carregado com sucesso</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                      {materialsList.length > 0 && (
                        <div className="bg-black/40 border border-white/5 rounded-2xl p-4 space-y-2">
                          {materialsList.map((mat, index) => (
                            <div key={index} className="flex items-center justify-between text-xs bg-white/5 px-3 py-2 rounded-xl border border-white/5">
                              <span className="font-semibold text-zinc-300 truncate max-w-[400px]">{mat.title}</span>
                              <button 
                                type="button" onClick={() => removeMaterial(index)}
                                className="text-red-400 hover:text-red-500 font-bold"
                              >
                                Remover
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="border-t border-white/5 pt-6 flex gap-4">
                    <button 
                      type="button" 
                      disabled={isSaving || isUploadingVideo || isUploadingMaterial} 
                      onClick={() => setIsModalOpen(false)}
                      className="flex-1 bg-white/5 hover:bg-white/10 text-white font-bold py-4 rounded-2xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Cancelar
                    </button>
                    <button 
                      type="submit" 
                      disabled={isSaving || isUploadingVideo || isUploadingMaterial}
                      className="flex-[2] bg-purple-600 hover:bg-purple-700 text-white font-bold py-4 rounded-2xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-purple-600/20 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isSaving || isUploadingVideo || isUploadingMaterial ? <Loader2 className="animate-spin" /> : <Save size={18} />}
                      {isSaving ? "Salvando..." : isUploadingVideo || isUploadingMaterial ? "Enviando arquivo..." : "Salvar Live"}
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
