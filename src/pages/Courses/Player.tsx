import React, { useState, useEffect } from "react";
import Layout from "../../components/Layout/Layout";
import { motion, AnimatePresence } from "motion/react";
import { 
  Play, 
  CheckCircle, 
  FileText, 
  MessageSquare, 
  ChevronDown, 
  ChevronUp,
  Download,
  Loader2,
  AlertCircle,
  Clock,
  ArrowLeft,
  Share2,
  Bookmark,
  MonitorPlay,
  Star,
  Send,
  Plus,
  Trash2,
  BookOpen,
  Award,
  User as UserIcon
} from "lucide-react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { supabase as supabaseClient } from "../../lib/supabase";
const supabase = supabaseClient as any;
import { Tables } from "../../types/database";
import { useAuth } from "../../contexts/AuthContext";
import { toast } from "sonner";
import { getUserDisplayName } from "../../lib/utils";
import { validateContent } from "../../utils/contentFilter";
import CertificateModal from "../../components/Courses/CertificateModal";
import YouTubePlayer from "../../components/Courses/YouTubePlayer";

type Course = Tables<'courses'> & {
  instructor?: { full_name: string } | null;
};

type Module = Tables<'course_modules'> & {
  lessons: Tables<'lessons'>[];
};

type Lesson = Tables<'lessons'>;

// Componente principal do Player de Cursos
export default function CoursePlayer() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialLessonId = searchParams.get("lessonId");
  const { user, profile } = useAuth();
  const [course, setCourse] = useState<Course | null>(null);
  const [modules, setModules] = useState<Module[]>([]);
  const [currentLesson, setCurrentLesson] = useState<Lesson | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("about");
  const [expandedModules, setExpandedModules] = useState<number[]>([]);
  
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState("");
  const [isPosting, setIsPosting] = useState(false);
  const [customBlockedWords, setCustomBlockedWords] = useState<string[]>([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [materials, setMaterials] = useState<any[]>([]);
  const [loadingMaterials, setLoadingMaterials] = useState(false);
  const [showAddMaterial, setShowAddMaterial] = useState(false);
  const [newMaterial, setNewMaterial] = useState({ title: "", url: "" });
  const [isAddingMaterial, setIsAddingMaterial] = useState(false);
  const [showCertificate, setShowCertificate] = useState(false);
  const [completedLessons, setCompletedLessons] = useState<number[]>([]);
  const [isCompleting, setIsCompleting] = useState(false);

  const fetchBlockedWords = async () => {
    try {
      const { data, error } = await supabase
        .from('system_settings')
        .select('value')
        .eq('key', 'blocked_words')
        .maybeSingle();

      if (error) throw error;

      if (data && data.value) {
        const words = data.value
          .split(',')
          .map((w: string) => w.trim())
          .filter((w: string) => w.length > 0);
        setCustomBlockedWords(words);
      }
    } catch (err) {
      console.warn("Erro ao buscar palavras bloqueadas personalizadas:", err);
    }
  };

  useEffect(() => {
    fetchBlockedWords();
  }, []);

  useEffect(() => {
    if (!id) return;

    const fetchCourseData = async () => {
      setLoading(true);
      try {
        // 1. Buscar Curso
        const { data: courseData, error: courseError } = await supabase
          .from('courses')
          .select(`
            *,
            instructor:user_profiles (full_name)
          `)
          .eq('id', id)
          .single();

        if (courseError) throw courseError;
        setCourse(courseData as any);

        // 2. Buscar Módulos
        const { data: moduleData, error: moduleError } = await supabase
          .from('course_modules')
          .select('*')
          .eq('course_id', id)
          .order('order_index', { ascending: true });

        if (moduleError) throw moduleError;

        // 3. Buscar Todas as Aulas e Agrupar
        const { data: lessonData, error: lessonError } = await supabase
          .from('lessons')
          .select('*')
          .eq('course_id', id)
          .order('order_index', { ascending: true });

        if (lessonError) throw lessonError;

        const modulesWithLessons = (moduleData || []).map(mod => ({
          ...mod,
          lessons: (lessonData || []).filter(lesson => lesson.module_id === mod.id)
        }));

        setModules(modulesWithLessons);
        
        // Determinar aula inicial
        let startingLesson = null;
        if (initialLessonId) {
          startingLesson = (lessonData || []).find(l => l.id === Number(initialLessonId));
        }

        if (startingLesson) {
          setCurrentLesson(startingLesson);
          setExpandedModules([Number(startingLesson.module_id)]);
        } else if (modulesWithLessons.length > 0) {
          setExpandedModules([Number(modulesWithLessons[0].id)]);
          if (modulesWithLessons[0].lessons.length > 0) {
            setCurrentLesson(modulesWithLessons[0].lessons[0]);
          }
        } else if (lessonData && lessonData.length > 0) {
          // Fallback se não houver módulos mas houver aulas
          setCurrentLesson(lessonData[0]);
        }

      } catch (err) {
        console.error('Error fetching course player data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchCourseData();
    fetchProgress();
  }, [id, profile]);

  const fetchProgress = async () => {
    if (!id || !profile) return;
    try {
      const { data, error } = await supabase
        .from('user_course_progress')
        .select('lesson_id')
        .eq('course_id', id)
        .eq('user_id', profile.id)
        .eq('completed', true);

      if (error) throw error;
      setCompletedLessons(data?.map(p => Number(p.lesson_id)) || []);
    } catch (err) {
      console.error('Error fetching progress:', err);
    }
  };

  const toggleLessonCompletion = async (lessonId: number) => {
    if (!profile) {
      toast.error("Perfil não encontrado. Tente sair e entrar novamente.");
      return;
    }
    
    try {
      const isCompleted = completedLessons.includes(lessonId);
      
      if (isCompleted) {
        const { error } = await supabase
          .from('user_course_progress')
          .delete()
          .eq('user_id', profile.id)
          .eq('lesson_id', lessonId);
        if (error) throw error;
        setCompletedLessons(prev => prev.filter(id => id !== lessonId));
        toast.success("Aula marcada como não concluída");
      } else {
        const { error } = await supabase
          .from('user_course_progress')
          .insert([{ 
            course_id: course?.id,
            user_id: profile.id, 
            lesson_id: lessonId,
            completed: true,
            completed_at: new Date().toISOString()
          }]);

        if (error) throw error;
        setCompletedLessons(prev => [...prev, Number(currentLesson.id)]);
        toast.success("Aula concluída! Parabéns! 🎉");
      }
    } catch (err: any) {
      console.error('Error completing lesson:', err);
      toast.error("Erro ao atualizar progresso.");
    } finally {
      setIsCompleting(false);
    }
  };

  useEffect(() => {
    if (currentLesson) {
      fetchComments(Number(currentLesson.id));
      fetchMaterials(Number(currentLesson.id));
    }
  }, [currentLesson]);

  // Bloqueio do botão direito e atalhos de desenvolvedor (F12, Ctrl+Shift+I, Ctrl+Shift+C, Ctrl+Shift+J, Ctrl+U)
  useEffect(() => {
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      // Impede tecla F12
      if (e.key === "F12") {
        e.preventDefault();
      }
      // Impede Ctrl+Shift+I, Ctrl+Shift+C e Ctrl+Shift+J
      if (e.ctrlKey && e.shiftKey && ["I", "C", "J"].includes(e.key.toUpperCase())) {
        e.preventDefault();
      }
      // Impede Ctrl+U (Exibir código-fonte)
      if (e.ctrlKey && e.key.toUpperCase() === "U") {
        e.preventDefault();
      }
    };

    document.addEventListener("contextmenu", handleContextMenu);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("contextmenu", handleContextMenu);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const fetchMaterials = async (lessonId: number) => {
    setLoadingMaterials(true);
    try {
      const { data, error } = await supabase
        .from('lesson_materials')
        .select('*')
        .eq('lesson_id', lessonId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setMaterials(data || []);
    } catch (err) {
      console.error("Error fetching materials:", err);
    } finally {
      setLoadingMaterials(false);
    }
  };

  const handleAddMaterial = async () => {
    if (!newMaterial.title.trim() || !newMaterial.url.trim() || !currentLesson) return;

    setIsAddingMaterial(true);
    try {
      const { error } = await supabase
        .from('lesson_materials')
        .insert([{
          lesson_id: currentLesson.id,
          title: newMaterial.title.trim(),
          file_url: newMaterial.url.trim(),
          file_type: newMaterial.url.split('.').pop()?.toUpperCase() || 'FILE'
        }]);

      if (error) throw error;

      setNewMaterial({ title: "", url: "" });
      setShowAddMaterial(false);
      fetchMaterials(Number(currentLesson.id));
      toast.success("Material adicionado com sucesso!");
    } catch (err) {
      toast.error("Erro ao adicionar material.");
    } finally {
      setIsAddingMaterial(false);
    }
  };

  const handleDeleteMaterial = async (id: number) => {
    if (!window.confirm("Deseja excluir este material?")) return;
    try {
      const { error } = await supabase
        .from('lesson_materials')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setMaterials(prev => prev.filter(m => m.id !== id));
      toast.success("Material removido.");
    } catch (err) {
      toast.error("Erro ao remover material.");
    }
  };

  const allLessons = modules.flatMap(m => m.lessons);
  const currentIndex = allLessons.findIndex(l => l.id === currentLesson?.id);
  const isLastLesson = currentIndex === allLessons.length - 1 && allLessons.length > 0;
  const nextLesson = !isLastLesson ? allLessons[currentIndex + 1] : null;

  const handleNextLesson = () => {
    if (!isLastLesson && nextLesson) {
      setCurrentLesson(nextLesson);
      setExpandedModules(prev => Array.from(new Set([...prev, Number(nextLesson.module_id)])));
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (isLastLesson) {
      // Verificar se todas as aulas foram concluídas
      const allCompleted = allLessons.every(l => completedLessons.includes(Number(l.id)));
      
      if (allCompleted) {
        setShowCertificate(true);
      } else {
        toast.warning("Você precisa concluir todas as aulas para emitir o certificado.");
      }
    }
  };

  const fetchComments = async (lessonId: number) => {
    setLoadingComments(true);
    try {
      let query = supabase
        .from('lesson_comments')
        .select(`
          *,
          user:user_profiles (full_name, avatar_url)
        `)
        .eq('lesson_id', lessonId);

      if (profile?.id) {
        query = query.or(`is_approved.eq.true,user_id.eq.${profile.id}`);
      } else {
        query = query.eq('is_approved', true);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;
      setComments(data || []);
    } catch (err) {
      console.error("Error fetching comments:", err);
    } finally {
      setLoadingComments(false);
    }
  };

  const handlePostComment = async () => {
    if (!newComment.trim() || !currentLesson || !profile) return;

    const validation = validateContent(newComment.trim(), customBlockedWords);
    if (!validation.isValid) {
      if (validation.reason === "profanity") {
        toast.error(`Seu comentário contém termo impróprio ("${validation.blockedTerm}"). Por favor, seja respeitoso.`);
      } else if (validation.reason === "links") {
        toast.error(`Links externos não autorizados ("${validation.blockedTerm}") não são permitidos nas aulas.`);
      }
      return;
    }

    setIsPosting(true);
    try {
      const { error } = await supabase
        .from('lesson_comments')
        .insert([{
          lesson_id: currentLesson.id,
          user_id: profile.id,
          content: newComment.trim(),
          is_approved: false
        }]);

      if (error) throw error;

      setNewComment("");
      fetchComments(Number(currentLesson.id));
      toast.success("Comentário enviado para moderação!");
    } catch (err) {
      toast.error("Erro ao publicar comentário.");
    } finally {
      setIsPosting(false);
    }
  };

  const toggleModule = (modId: number) => {
    setExpandedModules(prev => 
      prev.includes(modId) ? prev.filter(id => id !== modId) : [...prev, modId]
    );
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[80vh]">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="w-12 h-12 text-emerald-500 animate-spin" />
            <p className="text-zinc-500 font-black uppercase tracking-widest text-xs">Preparando sua aula...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (!course) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6">
          <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center">
            <AlertCircle className="w-10 h-10 text-emerald-500" />
          </div>
          <div className="text-center">
            <h2 className="text-2xl font-bold text-white mb-2">Ops! Curso não encontrado</h2>
            <p className="text-zinc-500">O conteúdo que você procura pode ter sido removido ou está indisponível.</p>
          </div>
          <button 
            onClick={() => navigate('/cursos')} 
            className="bg-white text-black font-black px-8 py-4 rounded-2xl hover:bg-zinc-200 transition-all uppercase text-xs tracking-widest"
          >
            Voltar ao Catálogo
          </button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-[1600px] mx-auto pb-20 player-page-container">
        <style dangerouslySetInnerHTML={{ __html: `
          body:not(.dark-theme) .lg\\:pl-72,
          body:not(.dark-theme) header,
          body:not(.dark-theme) main {
            background-color: #020c08 !important;
            color: #ffffff !important;
            border-color: rgba(255, 255, 255, 0.08) !important;
          }
          body:not(.dark-theme) header button,
          body:not(.dark-theme) header span,
          body:not(.dark-theme) header svg,
          body:not(.dark-theme) header div {
            color: #ffffff !important;
          }
          body:not(.dark-theme) header button {
            background-color: rgba(255, 255, 255, 0.06) !important;
            border-color: rgba(255, 255, 255, 0.12) !important;
          }
          body:not(.dark-theme) header button:hover {
            background-color: rgba(255, 255, 255, 0.12) !important;
          }
          body:not(.dark-theme) .player-page-container .bg-zinc-900\\/30,
          body:not(.dark-theme) .player-page-container .bg-zinc-900\\/40,
          body:not(.dark-theme) .player-page-container .bg-white\\/5,
          body:not(.dark-theme) .player-page-container .bg-surface-variant\\/20,
          body:not(.dark-theme) .player-page-container .bg-surface-variant\\/40,
          body:not(.dark-theme) .player-page-container .bg-surface {
            background-color: #06150e !important;
            border-color: rgba(255, 255, 255, 0.08) !important;
          }
          body:not(.dark-theme) .player-page-container .border-white\\/5,
          body:not(.dark-theme) .player-page-container .border-outline\\/10 {
            border-color: rgba(255, 255, 255, 0.08) !important;
          }
          body:not(.dark-theme) .player-page-container input,
          body:not(.dark-theme) .player-page-container textarea {
            background-color: #030a07 !important;
            color: #ffffff !important;
            border-color: rgba(255, 255, 255, 0.08) !important;
          }
          body:not(.dark-theme) .player-page-container input::placeholder,
          body:not(.dark-theme) .player-page-container textarea::placeholder {
            color: rgba(255, 255, 255, 0.35) !important;
          }
          body:not(.dark-theme) .player-page-container h1,
          body:not(.dark-theme) .player-page-container h2,
          body:not(.dark-theme) .player-page-container h3,
          body:not(.dark-theme) .player-page-container h4,
          body:not(.dark-theme) .player-page-container h5,
          body:not(.dark-theme) .player-page-container h6,
          body:not(.dark-theme) .player-page-container .text-white,
          body:not(.dark-theme) .player-page-container text-white,
          body:not(.dark-theme) .player-page-container .force-white {
            color: #ffffff !important;
          }
          body:not(.dark-theme) .player-page-container p,
          body:not(.dark-theme) .player-page-container .text-zinc-300,
          body:not(.dark-theme) .player-page-container .text-zinc-400 {
            color: #b5c7bd !important;
          }
          body:not(.dark-theme) .player-page-container .text-zinc-500,
          body:not(.dark-theme) .player-page-container .text-zinc-600 {
            color: #5d7568 !important;
          }
          body:not(.dark-theme) .player-page-container .text-zinc-700 {
            color: rgba(255, 255, 255, 0.4) !important;
          }
          body:not(.dark-theme) .player-page-container .border-emerald-500 {
            border-color: #10b981 !important;
          }
          body:not(.dark-theme) .player-page-container .bg-emerald-500\\/5 {
            background-color: rgba(16, 185, 129, 0.08) !important;
          }
          body:not(.dark-theme) .player-page-container .text-emerald-500 {
            color: #10b981 !important;
          }
          body:not(.dark-theme) .player-page-container .bg-white\\/5 {
            background-color: rgba(255, 255, 255, 0.06) !important;
          }
          body:not(.dark-theme) .player-page-container .bg-white\\/5:hover {
            background-color: rgba(255, 255, 255, 0.12) !important;
          }
          body:has(.player-page-container) ::-webkit-scrollbar-track {
            background: #020c08 !important;
          }
          body:has(.player-page-container) ::-webkit-scrollbar-thumb {
            background: #0d2f19 !important;
          }
        `}} />
        {/* Navigation Breadcrumb */}
        <div className="flex items-center gap-4 mb-8">
           <button 
            onClick={() => navigate('/cursos')}
            className="p-3 bg-white/5 hover:bg-white/10 rounded-2xl text-white transition-all"
           >
             <ArrowLeft size={20} />
           </button>
           <div>
              <h1 className="text-white font-black text-xl tracking-tight">{course.title}</h1>
              <div className="flex items-center gap-2 text-zinc-500 text-[10px] font-black uppercase tracking-widest">
                <span>{course.category}</span>
                <span>•</span>
                <span>{course.instructor?.full_name}</span>
              </div>
           </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* Main Content Area (Player & About) */}
          <div className="lg:col-span-8 space-y-8">
            {/* Cinematic Player Wrapper */}
            <div className="aspect-video bg-black rounded-[2.5rem] overflow-hidden shadow-2xl shadow-emerald-500/5 border border-white/5 relative group">
              {currentLesson?.video_url ? (
                <YouTubePlayer
                  url={currentLesson.video_url}
                  title={currentLesson.title}
                />
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-900/50">
                  <MonitorPlay className="w-20 h-20 text-zinc-800 mb-4" />
                  <p className="text-zinc-600 font-bold">Nenhum vídeo disponível para esta aula.</p>
                </div>
              )}
            </div>

            {/* Lesson Info Card */}
            <div className="bg-zinc-900/30 border border-white/5 rounded-[2.5rem] p-8 md:p-12">
               <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
                  <div className="space-y-2">
                     <span className="text-emerald-500 font-black text-[10px] uppercase tracking-[0.2em]">Você está assistindo:</span>
                     <h2 className="text-3xl font-black text-white tracking-tighter">{currentLesson?.title || "Selecione uma aula"}</h2>
                  </div>
                  <div className="flex items-center gap-3">
                     <button 
                        onClick={() => currentLesson && toggleLessonCompletion(Number(currentLesson.id))}
                        className={`flex items-center gap-2 px-6 py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all ${
                          currentLesson && completedLessons.includes(Number(currentLesson.id))
                            ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20"
                            : "bg-emerald-500/10 hover:bg-emerald-500 text-emerald-500 hover:text-white"
                        }`}
                     >
                        <CheckCircle size={18} />
                        {currentLesson && completedLessons.includes(Number(currentLesson.id)) ? "Aula Concluída" : "Concluir Aula"}
                     </button>
                  </div>
               </div>

               {/* Tabs Netflix Style */}
               <div className="flex gap-10 border-b border-white/5 mb-8">
                  {[
                    { id: "about", label: "Descrição", icon: <FileText size={16} /> },
                    { id: "materials", label: "Arquivos", icon: <Download size={16} /> },
                    { id: "community", label: "Comunidade", icon: <MessageSquare size={16} /> }
                  ].map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`pb-6 flex items-center gap-2 text-sm font-black uppercase tracking-widest transition-all relative ${activeTab === tab.id ? "text-white" : "text-zinc-500 hover:text-zinc-300"}`}
                    >
                      {tab.icon}
                      {tab.label}
                      {activeTab === tab.id && (
                        <motion.div layoutId="player-tab" className="absolute bottom-0 left-0 right-0 h-1 bg-emerald-500 rounded-full" />
                      )}
                    </button>
                  ))}
               </div>

               <div className="text-zinc-400 text-lg leading-relaxed max-w-4xl">
                  {activeTab === "about" && (
                    <div className="space-y-8">
                      {currentLesson?.description && (
                        <div className="prose prose-invert max-w-none">
                          <p className="whitespace-pre-wrap text-white text-lg leading-relaxed">
                            {currentLesson.description}
                          </p>
                        </div>
                      )}
                      
                      <div className="pt-8 border-t border-white/5">
                        <h4 className="text-white font-black text-xs uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                          <BookOpen size={16} className="text-emerald-500" />
                          Descrição
                        </h4>
                        <p className="text-zinc-400 text-sm leading-relaxed whitespace-pre-wrap bg-white/5 p-6 rounded-3xl border border-white/5">
                          {course?.description || "Nenhuma descrição geral disponível para este treinamento."}
                        </p>
                      </div>
                    </div>
                  )}
                  {activeTab === "materials" && (
                    <div className="space-y-6">
                      {profile?.role === 'admin' && (
                        <div className="mb-8">
                          {!showAddMaterial ? (
                            <button 
                              onClick={() => setShowAddMaterial(true)}
                              className="w-full py-4 border-2 border-dashed border-white/10 rounded-[2rem] text-zinc-500 hover:text-white hover:border-emerald-500/50 hover:bg-emerald-500/5 transition-all font-bold text-sm flex items-center justify-center gap-2"
                            >
                              <Plus size={18} />
                              Adicionar Novo Material
                            </button>
                          ) : (
                            <motion.div 
                              initial={{ opacity: 0, y: -10 }}
                              animate={{ opacity: 1, y: 0 }}
                              className="bg-white/5 border border-white/10 p-6 rounded-[2.5rem] space-y-4"
                            >
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                  <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-2">Título do Arquivo</label>
                                  <input 
                                    type="text" 
                                    placeholder="Ex: PDF Complementar da Aula"
                                    value={newMaterial.title}
                                    onChange={(e) => setNewMaterial({ ...newMaterial, title: e.target.value })}
                                    className="w-full bg-black/40 border border-white/5 rounded-2xl px-5 py-3 text-sm text-white focus:outline-none focus:ring-1 focus:ring-emerald-500/50"
                                  />
                                </div>
                                <div className="space-y-2">
                                  <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-2">URL do Arquivo</label>
                                  <input 
                                    type="text" 
                                    placeholder="https://exemplo.com/arquivo.pdf"
                                    value={newMaterial.url}
                                    onChange={(e) => setNewMaterial({ ...newMaterial, url: e.target.value })}
                                    className="w-full bg-black/40 border border-white/5 rounded-2xl px-5 py-3 text-sm text-white focus:outline-none focus:ring-1 focus:ring-emerald-500/50"
                                  />
                                </div>
                              </div>
                              <div className="flex justify-end gap-3 pt-2">
                                <button 
                                  onClick={() => setShowAddMaterial(false)}
                                  className="px-6 py-2.5 text-xs font-bold text-zinc-500 hover:text-white transition-all"
                                >
                                  Cancelar
                                </button>
                                <button 
                                  disabled={isAddingMaterial || !newMaterial.title || !newMaterial.url}
                                  onClick={handleAddMaterial}
                                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all disabled:opacity-50"
                                >
                                  {isAddingMaterial ? <Loader2 className="animate-spin" size={16} /> : "Salvar Arquivo"}
                                </button>
                              </div>
                            </motion.div>
                          )}
                        </div>
                      )}

                      {loadingMaterials ? (
                        <div className="flex justify-center py-10">
                          <Loader2 className="animate-spin text-zinc-600" />
                        </div>
                      ) : materials.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {materials.map((file) => (
                            <div key={file.id} className="bg-white/5 border border-white/10 p-5 rounded-3xl flex items-center justify-between group hover:border-emerald-500/30 transition-all">
                              <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-zinc-800 rounded-2xl flex items-center justify-center text-emerald-500 group-hover:bg-emerald-500 group-hover:text-white transition-all">
                                  <Download size={20} />
                                </div>
                                <div>
                                  <h4 className="text-sm font-bold text-white group-hover:text-emerald-500 transition-all">{file.title}</h4>
                                  <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">{file.file_type} • ARQUIVO</span>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <a 
                                  href={file.file_url} 
                                  target="_blank" 
                                  rel="noreferrer"
                                  className="p-2.5 bg-white/5 hover:bg-white/10 rounded-xl text-zinc-400 hover:text-white transition-all"
                                  title="Download"
                                >
                                  <Download size={18} />
                                </a>
                                {profile?.role === 'admin' && (
                                  <button 
                                    onClick={() => handleDeleteMaterial(file.id)}
                                    className="p-2.5 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white rounded-xl transition-all"
                                    title="Excluir"
                                  >
                                    <Trash2 size={18} />
                                  </button>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="py-20 text-center border-2 border-dashed border-white/5 rounded-[2.5rem]">
                           <Download className="mx-auto mb-4 text-zinc-800" size={32} />
                           <p className="text-zinc-600 font-bold text-sm">Nenhum material complementar disponível para esta aula.</p>
                        </div>
                      )}
                    </div>
                  )}
                  {activeTab === "community" && (
                    <div className="space-y-8 mt-4">
                       {/* Input Area */}
                       <div className="bg-white/5 border border-white/10 p-6 rounded-[2rem] flex items-center gap-4 focus-within:border-emerald-500/50 transition-all">
                          <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center shrink-0 border border-white/5">
                             <UserIcon size={20} className="text-zinc-500" />
                          </div>
                          <input 
                            type="text" 
                            placeholder="Diga algo sobre esta aula..."
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handlePostComment()}
                            className="bg-transparent border-none outline-none flex-1 text-white text-sm placeholder:text-zinc-600"
                          />
                          <button 
                            disabled={isPosting || !newComment.trim()}
                            onClick={handlePostComment}
                            className="p-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:bg-zinc-800 rounded-xl transition-all"
                          >
                             {isPosting ? <Loader2 className="animate-spin" size={18} /> : <Send size={18} />}
                          </button>
                       </div>

                       {/* Comments List */}
                       <div className="space-y-6">
                          {loadingComments ? (
                            <div className="flex justify-center py-10">
                               <Loader2 className="animate-spin text-zinc-600" />
                            </div>
                          ) : comments.length > 0 ? (
                            comments.map((comment) => (
                              <div key={comment.id} className="flex gap-4 group">
                                 <div className="w-10 h-10 rounded-full overflow-hidden bg-zinc-800 shrink-0 border border-white/5">
                                    {comment.user?.avatar_url ? (
                                      <img src={comment.user.avatar_url} className="w-full h-full object-cover" alt="" />
                                    ) : (
                                      <div className="w-full h-full flex items-center justify-center text-zinc-500 font-bold text-xs">
                                         {comment.user?.full_name?.charAt(0) || 'U'}
                                      </div>
                                    )}
                                 </div>
                                 <div className="flex-1 space-y-1">
                                     <div className="flex items-center gap-3">
                                        <span className="text-sm font-bold text-white">{comment.user?.full_name || 'Usuário'}</span>
                                        <span className="text-[10px] text-zinc-600 font-bold uppercase tracking-widest">
                                           {new Date(comment.created_at).toLocaleDateString('pt-BR')}
                                        </span>
                                        {!comment.is_approved && (
                                          <span className="text-[9px] bg-yellow-500/10 text-yellow-500 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider border border-yellow-500/20">
                                             Pendente
                                          </span>
                                        )}
                                     </div>
                                    <p className="text-sm text-zinc-400 leading-relaxed">{comment.content}</p>
                                 </div>
                              </div>
                            ))
                          ) : (
                            <div className="py-20 text-center border-2 border-dashed border-white/5 rounded-[2.5rem]">
                               <MessageSquare className="mx-auto mb-4 text-zinc-800" size={32} />
                               <p className="text-zinc-600 font-bold">Seja o primeiro a comentar nesta aula!</p>
                            </div>
                          )}
                       </div>
                    </div>
                  )}
               </div>
            </div>
          </div>

          {/* Sidebar Playlist (Netflix Style) */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-zinc-900/40 border border-white/5 rounded-[2.5rem] overflow-hidden sticky top-8">
               <div className="p-8 border-b border-white/5 flex items-center justify-between bg-white/5">
                  <h3 className="text-lg font-black text-white uppercase tracking-tighter">Conteúdo do Curso</h3>
                  <div className="p-2 bg-emerald-500/10 rounded-lg">
                     <Bookmark className="text-emerald-500" size={16} />
                  </div>
               </div>

               <div className="max-h-[70vh] overflow-y-auto custom-scrollbar">
                  {modules.map((mod, modIdx) => (
                    <div key={mod.id} className="border-b border-white/5 last:border-0">
                       <button 
                        onClick={() => toggleModule(Number(mod.id))}
                        className="w-full p-6 flex items-center justify-between hover:bg-white/5 transition-all text-left"
                       >
                          <div className="flex items-center gap-4">
                             <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-[10px] font-black text-zinc-500">
                                {modIdx + 1}
                             </div>
                             <div>
                                <h4 className="text-sm font-bold text-white line-clamp-1">{mod.title}</h4>
                                <span className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">{mod.lessons.length} Aulas</span>
                             </div>
                          </div>
                          {expandedModules.includes(Number(mod.id)) ? <ChevronUp size={18} className="text-zinc-700" /> : <ChevronDown size={18} className="text-zinc-700" />}
                       </button>

                       <AnimatePresence>
                          {expandedModules.includes(Number(mod.id)) && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              className="overflow-hidden bg-black/20"
                            >
                               {mod.lessons.map((lesson, lessonIdx) => (
                                 <button 
                                  key={lesson.id}
                                  onClick={() => setCurrentLesson(lesson)}
                                  className={`w-full p-6 flex items-start gap-4 transition-all group border-l-4 ${currentLesson?.id === lesson.id ? "bg-emerald-500/5 border-emerald-500" : "border-transparent hover:bg-white/5"}`}
                                 >
                                    <div className="w-24 aspect-video rounded-xl overflow-hidden bg-zinc-800 shrink-0 border border-white/5 relative">
                                       <img 
                                        src={lesson.thumbnail_url || course.thumbnail_url || "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=400"} 
                                        className="w-full h-full object-cover group-hover:scale-110 transition-transform" 
                                        alt="" 
                                       />
                                       <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
                                          <Play size={16} className="text-white fill-current" />
                                       </div>
                                    </div>
                                    <div className="text-left space-y-1">
                                       <h5 className={`text-xs font-bold leading-tight line-clamp-2 ${currentLesson?.id === lesson.id ? "text-emerald-500" : "text-zinc-300 group-hover:text-white"}`}>
                                          {lesson.title}
                                       </h5>
                                       <div className="flex items-center gap-2 text-[10px] text-zinc-600 font-black uppercase tracking-tighter">
                                          <Clock size={10} />
                                          <span>{lesson.duration || "Aula "+(lessonIdx+1)}</span>
                                          {completedLessons.includes(Number(lesson.id)) && (
                                            <span className="flex items-center gap-1 text-emerald-500 ml-auto">
                                              <CheckCircle size={10} />
                                              Concluída
                                            </span>
                                          )}
                                       </div>
                                    </div>
                                 </button>
                               ))}
                            </motion.div>
                          )}
                       </AnimatePresence>
                    </div>
                  ))}

                  {modules.length === 0 && (
                    <div className="p-12 text-center">
                       <p className="text-zinc-600 text-xs font-bold uppercase tracking-widest">Nenhuma aula cadastrada ainda.</p>
                    </div>
                  )}
               </div>
            </div>
            
            {/* Promo Card Next Lesson */}
            <div 
              onClick={handleNextLesson}
              className={`${isLastLesson ? "bg-emerald-600 shadow-emerald-600/20" : "bg-emerald-700 shadow-emerald-700/20"} rounded-[2.5rem] p-8 relative overflow-hidden group cursor-pointer shadow-2xl active:scale-95 transition-all`}
            >
               <div className="relative z-10">
                  <h4 className="text-white font-black text-xl tracking-tighter mb-2">
                    {isLastLesson ? "Treinamento Concluído" : "Dominando a Rede"}
                  </h4>
                  <p className="text-white/70 text-xs font-bold mb-6">
                    {isLastLesson 
                      ? "Você chegou ao fim deste curso! Garanta sua certificação." 
                      : `Próxima aula: ${nextLesson?.title || "Carregando..."}`}
                  </p>
                  <button className="bg-white text-zinc-900 px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest flex items-center gap-2 hover:bg-zinc-100 transition-colors">
                     {isLastLesson ? (
                       <>
                        <Award size={14} className="text-emerald-600" fill="currentColor" />
                        Emitir Certificado
                       </>
                     ) : (
                       <>
                        <Play size={14} className="text-emerald-600" fill="currentColor" />
                        Assistir Agora
                       </>
                     )}
                  </button>
               </div>
               {isLastLesson ? (
                 <Award className="absolute -right-4 -bottom-4 text-white/5 w-32 h-32 rotate-12 group-hover:rotate-45 transition-transform duration-700" />
               ) : (
                 <Star className="absolute -right-4 -bottom-4 text-white/5 w-32 h-32 rotate-12 group-hover:rotate-45 transition-transform duration-700" />
               )}
            </div>
          </div>
        </div>
      </div>

      <CertificateModal 
        isOpen={showCertificate}
        onClose={() => setShowCertificate(false)}
        studentName={getUserDisplayName(profile, user)}
        courseTitle={course?.title || "Treinamento Bananal PRO"}
        completionDate={new Date().toLocaleDateString('pt-BR')}
        instructorName="Bananal PRO"
      />
    </Layout>
  );
}
