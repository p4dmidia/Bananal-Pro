import React, { useEffect, useState } from "react";
import Layout from "../../components/Layout/Layout";
import { motion, AnimatePresence } from "motion/react";
import { 
  Users, 
  DollarSign, 
  BookOpen, 
  Plus, 
  TrendingUp, 
  BarChart3, 
  MessageSquare,
  ChevronRight,
  MoreVertical,
  Play,
  X,
  Image as ImageIcon,
  Trash2,
  FileVideo,
  Loader2,
  Layout as LayoutIcon,
  Check,
  ChevronDown,
  ChevronUp,
  GripVertical,
  Type,
  AlignLeft,
  Settings,
  Eye,
  Download,
  Star
} from "lucide-react";
import { supabase as supabaseClient } from "../../lib/supabase";
const supabase = supabaseClient as any;
import { Tables } from "../../types/database";
import { useAuth } from "../../contexts/AuthContext";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

type Course = Tables<'courses'>;

interface LessonInput {
  id: string;
  title: string;
  description: string;
  thumbnailFile: File | null;
  videoFile: File | null;
  videoUrlInput?: string;
  materials: { id?: string; title: string; url: string; file?: File }[];
  isUploading?: boolean;
  progress?: number;
}

interface ModuleInput {
  id: string;
  title: string;
  lessons: LessonInput[];
  isExpanded: boolean;
  coverFile: File | null;
  existingCoverUrl?: string;
}

export default function ProducerDashboard() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCourseId, setEditingCourseId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [step, setStep] = useState(1); // 1: Info, 2: Builder

  // Stats State
  const [stats, setStats] = useState([
    { label: "Vendas da Rede", value: "R$ 0", change: "0%", icon: DollarSign, color: "text-emerald-400" },
    { label: "Alunos Ativos", value: "0", change: "0%", icon: Users, color: "text-primary" },
    { label: "Cursos Publicados", value: "0", change: "0%", icon: BookOpen, color: "text-blue-400" },
    { label: "Aulas Concluídas", value: "0", change: "0%", icon: BarChart3, color: "text-purple-400" },
  ]);

  // Questions and Comments
  const [recentComments, setRecentComments] = useState<any[]>([]);
  const [loadingComments, setLoadingComments] = useState(false);

  // Form State
  const [newCourse, setNewCourse] = useState({
    title: "",
    category: "Business",
    points: 0,
    description: "",
  });
  
  const [courseThumbnail, setCourseThumbnail] = useState<File | null>(null);
  const [modules, setModules] = useState<ModuleInput[]>([]);

  const fetchProducerData = async () => {
    if (!profile?.id) return;
    setLoading(true);
    try {
      // 1. Fetch courses
      const { data: coursesData, error: coursesError } = await supabase
        .from('courses')
        .select('*')
        .eq('instructor_id', profile.id)
        .order('created_at', { ascending: false });

      if (coursesError) throw coursesError;
      const producerCourses = coursesData || [];
      setCourses(producerCourses);

      const courseIds = producerCourses.map(c => c.id);

      // 2. Fetch stats
      let activeStudents = 0;
      let completedLessonsCount = 0;
      let totalEarnings = 0;

      // Query User Settings for earnings
      const { data: userSettings } = await supabase
        .from('user_settings')
        .select('total_earnings')
        .eq('user_id', profile.id)
        .single();
      
      if (userSettings) {
        totalEarnings = userSettings.total_earnings || 0;
      }

      if (courseIds.length > 0) {
        // Active students count
        const { data: progressData } = await supabase
          .from('user_course_progress')
          .select('user_id, completed')
          .in('course_id', courseIds);
        
        if (progressData) {
          const uniqueStudents = new Set(progressData.map(p => p.user_id));
          activeStudents = uniqueStudents.size;
          completedLessonsCount = progressData.filter(p => p.completed).length;
        }

        // Fetch recent comments on producer's courses
        setLoadingComments(true);
        const { data: lessonsData } = await supabase
          .from('lessons')
          .select('id')
          .in('course_id', courseIds);
        
        if (lessonsData && lessonsData.length > 0) {
          const lessonIds = lessonsData.map(l => l.id);
          const { data: commentsData } = await supabase
            .from('lesson_comments')
            .select(`
              id,
              content,
              created_at,
              is_approved,
              user:user_profiles (full_name),
              lesson:lessons (title)
            `)
            .in('lesson_id', lessonIds)
            .order('created_at', { ascending: false })
            .limit(5);
          
          setRecentComments(commentsData || []);
        }
        setLoadingComments(false);
      }

      setStats([
        { label: "Seus Ganhos Totais", value: `R$ ${totalEarnings.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, change: "+10%", icon: DollarSign, color: "text-emerald-400" },
        { label: "Alunos Ativos", value: activeStudents.toString(), change: `+${activeStudents ? '15%' : '0%'}`, icon: Users, color: "text-primary" },
        { label: "Cursos Publicados", value: producerCourses.length.toString(), change: "0%", icon: BookOpen, color: "text-blue-400" },
        { label: "Aulas Concluídas", value: completedLessonsCount.toString(), change: "+8%", icon: BarChart3, color: "text-purple-400" },
      ]);

    } catch (err) {
      console.error('Error fetching producer data:', err);
      toast.error("Erro ao carregar dados do painel.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducerData();
  }, [profile]);

  const uploadFile = async (file: File, bucket: string) => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
    const filePath = `${fileName}`;

    await supabase.storage.createBucket(bucket, { public: true }).catch(() => {});

    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(filePath, file);

    // Fallback to company-logos bucket if specific bucket fails
    if (uploadError) {
      console.warn(`Bucket ${bucket} upload failed, falling back to company-logos...`);
      const fallbackPath = `${bucket}/${fileName}`;
      const { error: fallbackError } = await supabase.storage
        .from('company-logos')
        .upload(fallbackPath, file);
      
      if (fallbackError) throw fallbackError;
      
      const { data } = supabase.storage
        .from('company-logos')
        .getPublicUrl(fallbackPath);
      
      return data.publicUrl;
    }

    const { data } = supabase.storage
      .from(bucket)
      .getPublicUrl(filePath);

    return data.publicUrl;
  };

  const handleSaveCourse = async () => {
    if (!newCourse.title) return toast.error("O título é obrigatório.");
    if (!profile) return toast.error("Sessão expirada.");
    
    setIsSaving(true);
    try {
      let thumbnailUrl = "";

      // 1. Upload Capa do Curso
      if (courseThumbnail) {
        thumbnailUrl = await uploadFile(courseThumbnail, 'course-thumbnails');
      } else if (editingCourseId) {
        const existing = courses.find(c => c.id.toString() === editingCourseId);
        thumbnailUrl = existing?.thumbnail_url || "";
      }

      // 2. Salvar/Atualizar o curso base
      const coursePayload = {
        title: newCourse.title,
        category: newCourse.category,
        points: newCourse.points,
        description: newCourse.description,
        thumbnail_url: thumbnailUrl,
        instructor_id: profile.id,
        is_active: true
      };

      let courseData;
      if (editingCourseId) {
        const { data, error } = await supabase
          .from('courses')
          .update(coursePayload)
          .eq('id', Number(editingCourseId))
          .select()
          .single();
        if (error) throw error;
        courseData = data;
      } else {
        const { data, error } = await supabase
          .from('courses')
          .insert([coursePayload])
          .select()
          .single();
        if (error) throw error;
        courseData = data;
      }

      const course = courseData;

      // 3. Processar Módulos e Aulas
      for (let i = 0; i < modules.length; i++) {
        const mod = modules[i];
        const isExistingModule = !isNaN(Number(mod.id));

        let coverUrl = mod.existingCoverUrl || "";
        if (mod.coverFile) {
          coverUrl = await uploadFile(mod.coverFile, 'course-thumbnails');
        }

        const modulePayload: any = {
          course_id: course.id,
          title: mod.title || `Módulo ${i + 1}`,
          order_index: i,
          cover_url: coverUrl
        };

        let moduleData;
        if (isExistingModule) {
          const { data, error } = await supabase
            .from('course_modules')
            .update(modulePayload)
            .eq('id', Number(mod.id))
            .select()
            .single();
          if (error) throw error;
          moduleData = data;
        } else {
          const { data, error } = await supabase
            .from('course_modules')
            .insert([modulePayload])
            .select()
            .single();
          if (error) throw error;
          moduleData = data;
        }

        for (let j = 0; j < mod.lessons.length; j++) {
          const lesson = mod.lessons[j] as any;
          const isExistingLesson = !isNaN(Number(lesson.id));
          let lessonVideoUrl = lesson.videoUrlInput || lesson.existingVideoUrl || "";
          let lessonThumbUrl = lesson.existingThumbUrl || "";

          // Upload de arquivos da aula se houver novos
          if (lesson.videoFile) {
            lessonVideoUrl = await uploadFile(lesson.videoFile, 'course-videos');
          }
          if (lesson.thumbnailFile) {
            lessonThumbUrl = await uploadFile(lesson.thumbnailFile, 'lesson-thumbnails');
          }

          const lessonPayload = {
            course_id: course.id,
            module_id: moduleData.id,
            title: lesson.title || `Aula ${j + 1}`,
            description: lesson.description,
            video_url: lessonVideoUrl,
            thumbnail_url: lessonThumbUrl,
            order_index: j
          };

          if (isExistingLesson) {
            const { error: lessonError } = await supabase
              .from('lessons')
              .update(lessonPayload)
              .eq('id', Number(lesson.id));
            if (lessonError) throw lessonError;
          } else {
            const { data: newLessonData, error: lessonError } = await supabase
              .from('lessons')
              .insert([lessonPayload])
              .select()
              .single();
            if (lessonError) throw lessonError;
            lesson.id = newLessonData.id;
          }

          // 3.1. Processar Materiais da Aula
          if (lesson.materials && lesson.materials.length > 0) {
            for (const material of lesson.materials) {
              let materialUrl = material.url;

              if (material.file) {
                materialUrl = await uploadFile(material.file, 'lesson-materials');
              }

              const materialPayload = {
                lesson_id: lesson.id,
                title: material.title || "Arquivo",
                file_url: materialUrl,
                file_type: materialUrl.split('.').pop()?.toUpperCase() || 'FILE'
              };

              if (material.id && !isNaN(Number(material.id))) {
                await supabase.from('lesson_materials').update(materialPayload).eq('id', Number(material.id));
              } else {
                await supabase.from('lesson_materials').insert([materialPayload]);
              }
            }
          }
        }
      }

      toast.success(editingCourseId ? "Treinamento atualizado!" : "Curso publicado com sucesso!");
      setIsModalOpen(false);
      resetForm();
      fetchProducerData();
    } catch (err: any) {
      console.error('Error saving course:', err);
      toast.error("Erro ao salvar: " + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleEditCourse = async (courseId: string) => {
    setActiveMenuId(null);
    setLoading(true);
    try {
      // 1. Fetch Course
      const { data: course, error: courseError } = await supabase
        .from('courses')
        .select('*')
        .eq('id', Number(courseId))
        .single();
      
      if (courseError) throw courseError;

      // 2. Fetch Modules and Lessons
      const { data: modulesData, error: modulesError } = await (supabase as any)
        .from('course_modules')
        .select(`
          id,
          title,
          cover_url,
          lessons (
            id,
            title,
            description,
            video_url,
            thumbnail_url,
            materials:lesson_materials(id, title, file_url)
          )
        `)
        .eq('course_id', Number(courseId))
        .order('order_index', { ascending: true });

      if (modulesError) throw modulesError;

      // 3. Populate State
      setNewCourse({
        title: course.title || "",
        category: course.category || "Business",
        points: course.points || 0,
        description: course.description || "",
      });
      
      const formattedModules: ModuleInput[] = (modulesData || []).map(mod => ({
        id: mod.id.toString(),
        title: mod.title || "",
        isExpanded: false,
        coverFile: null,
        existingCoverUrl: (mod as any).cover_url || "",
        lessons: (mod.lessons as any[] || []).map(lesson => ({
          id: lesson.id.toString(),
          title: lesson.title || "",
          description: lesson.description || "",
          thumbnailFile: null,
          videoFile: null,
          existingVideoUrl: lesson.video_url,
          videoUrlInput: lesson.video_url || "",
          existingThumbUrl: lesson.thumbnail_url,
          materials: (lesson.materials || []).map((m: any) => ({
            id: m.id.toString(),
            title: m.title,
            url: m.file_url
          }))
        }))
      }));

      setModules(formattedModules);
      setEditingCourseId(courseId);
      setIsModalOpen(true);
      setStep(1);
    } catch (err) {
      console.error('Error loading course for edit:', err);
      toast.error("Erro ao carregar dados do curso.");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCourse = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este curso? Esta ação é irreversível.")) return;
    
    try {
      const { error } = await supabase
        .from('courses')
        .delete()
        .eq('id', Number(id));

      if (error) throw error;
      
      toast.success("Curso excluído com sucesso!");
      fetchProducerData();
    } catch (err: any) {
      console.error('Error deleting course:', err);
      toast.error("Erro ao excluir curso.");
    }
  };

  const resetForm = () => {
    setNewCourse({ title: "", category: "Business", points: 0, description: "" });
    setCourseThumbnail(null);
    setModules([]);
    setStep(1);
    setEditingCourseId(null);
  };

  const addModule = () => {
    const newModule: ModuleInput = {
      id: Math.random().toString(36),
      title: "",
      lessons: [],
      isExpanded: true,
      coverFile: null,
      existingCoverUrl: ""
    };
    setModules([...modules, newModule]);
  };

  const addLesson = (moduleId: string) => {
    setModules(modules.map(mod => {
      if (mod.id === moduleId) {
        return {
          ...mod,
          lessons: [...mod.lessons, {
            id: Math.random().toString(36),
            title: "",
            description: "",
            thumbnailFile: null,
            videoFile: null,
            videoUrlInput: "",
            materials: []
          }]
        };
      }
      return mod;
    }));
  };

  const updateLesson = (moduleId: string, lessonId: string, updates: Partial<LessonInput>) => {
    setModules(modules.map(mod => {
      if (mod.id === moduleId) {
        return {
          ...mod,
          lessons: mod.lessons.map(lesson => 
            lesson.id === lessonId ? { ...lesson, ...updates } : lesson
          )
        };
      }
      return mod;
    }));
  };

  const filteredCourses = courses.filter(c => 
    c.title?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Layout>
      {!isModalOpen ? (
        <div className="space-y-10 max-w-7xl mx-auto">
          {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-4xl font-display font-bold mb-2">Área do Produtor (LMS)</h1>
            <p className="text-slate-400 text-lg">Crie treinamentos, gerencie suas aulas e acompanhe o progresso dos seus alunos.</p>
          </div>
          
          <button 
            onClick={() => {
              resetForm();
              setIsModalOpen(true);
            }}
            className="bg-primary hover:bg-primary px-8 py-4 rounded-2xl font-bold flex items-center gap-3 transition-all shadow-xl shadow-primary/20"
          >
            <Plus size={22} />
            Criar Novo Curso
          </button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="glass-card p-6 rounded-3xl border-white/5 bg-white/[0.02]"
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-2xl bg-white/5 ${stat.color}`}>
                  <stat.icon size={24} />
                </div>
                <span className="text-xs font-bold text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded-lg">
                  {stat.change}
                </span>
              </div>
              <p className="text-slate-500 text-sm font-medium mb-1">{stat.label}</p>
              <h3 className="text-2xl font-bold text-white">{stat.value}</h3>
            </motion.div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Courses List */}
          <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-display font-bold">Meus Cursos</h2>
              <div className="relative w-64">
                <input 
                  type="text" 
                  placeholder="Buscar curso..." 
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full bg-white/[0.02] border border-white/5 rounded-xl px-4 py-2 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-primary/50"
                />
              </div>
            </div>
            
            {loading ? (
              <div className="flex items-center justify-center py-20 bg-white/[0.01] rounded-3xl border border-white/5">
                <Loader2 className="w-10 h-10 text-primary animate-spin" />
              </div>
            ) : filteredCourses.length === 0 ? (
              <div className="py-20 text-center bg-white/[0.01] rounded-[2.5rem] border border-white/5 border-dashed">
                <BookOpen className="mx-auto text-zinc-700 mb-4" size={40} />
                <p className="text-zinc-500 font-bold">Nenhum curso encontrado.</p>
                <button 
                  onClick={() => setIsModalOpen(true)}
                  className="mt-4 text-primary font-bold hover:underline text-sm"
                >
                  Criar seu primeiro curso
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredCourses.map((course) => (
                  <div key={course.id} className="glass-card p-5 rounded-[2.5rem] border-white/5 hover:bg-white/[0.03] transition-all flex flex-col md:flex-row items-center gap-6 group">
                    <div className="w-full md:w-32 h-20 rounded-2xl overflow-hidden shrink-0 border border-white/5 bg-zinc-800">
                      <img 
                        src={course.thumbnail_url || "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800"} 
                        className="w-full h-full object-cover" 
                        alt="" 
                      />
                    </div>
                    <div className="flex-1 w-full text-center md:text-left">
                      <h4 className="font-bold text-white text-lg group-hover:text-primary transition-colors">{course.title}</h4>
                      <p className="text-xs text-slate-500 mt-1">Categoria: {course.category} • {course.points} Pontos de Rede</p>
                    </div>
                    
                    <div className="flex items-center gap-3 w-full md:w-auto justify-center md:justify-end">
                      <button 
                        onClick={() => handleEditCourse(course.id.toString())}
                        className="bg-primary hover:bg-primary/95 text-white px-5 py-3 rounded-2xl text-xs font-extrabold transition-all flex items-center gap-1.5 shadow-md active:scale-95 whitespace-nowrap"
                        title="Editar Aulas e Conteúdo"
                      >
                        <Settings size={14} />
                        Editar Aulas
                      </button>
                      <button 
                        onClick={() => navigate(`/cursos/detalhes/${course.id}`)}
                        className="p-3 bg-white/5 hover:bg-white/10 rounded-2xl text-slate-300 transition-all"
                        title="Ver no Catálogo"
                      >
                        <Eye size={18} />
                      </button>
                      <button 
                        onClick={() => handleDeleteCourse(course.id.toString())}
                        className="p-3 bg-white/5 hover:bg-primary/20 rounded-2xl text-slate-300 hover:text-primary transition-all"
                        title="Excluir Curso"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Side Panel: Recent Questions */}
          <div className="space-y-6">
            <h2 className="text-2xl font-display font-bold">Dúvidas dos Alunos</h2>
            <div className="glass-card p-6 rounded-[2.5rem] border-white/5 bg-white/[0.02] space-y-6">
              {loadingComments ? (
                <div className="flex justify-center py-10">
                  <Loader2 className="w-6 h-6 text-primary animate-spin" />
                </div>
              ) : recentComments.length === 0 ? (
                <p className="text-xs text-slate-500 text-center py-6">Nenhuma dúvida recente encontrada nas suas aulas.</p>
              ) : (
                recentComments.map((comment) => (
                  <div key={comment.id} className="space-y-2 border-b border-white/5 pb-4 last:border-b-0 last:pb-0">
                    <div className="flex justify-between items-start gap-2">
                      <p className="text-xs font-bold text-white">{comment.user?.full_name || "Aluno"}</p>
                      <span className="text-[9px] font-black text-primary uppercase bg-primary/10 px-2 py-0.5 rounded-full">
                        {comment.lesson?.title || "Aula"}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 line-clamp-2 italic">"{comment.content}"</p>
                    <p className="text-[9px] text-slate-600">
                      {new Date(comment.created_at).toLocaleDateString('pt-BR')} às {new Date(comment.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                ))
              )}
            </div>
            
            <div className="glass-card p-6 rounded-[2.5rem] border-primary/20 bg-primary/5 space-y-4">
              <div className="flex items-center gap-3">
                <MessageSquare className="text-primary" />
                <h3 className="font-bold text-white">Suporte LMS</h3>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Interaja com seus alunos respondendo às dúvidas diretamente no player das aulas correspondentes.
              </p>
            </div>
          </div>
        </div>
      </div>
      ) : (
        <div className="space-y-10 max-w-7xl mx-auto">
          {/* Header do Builder em Tela Cheia */}
          <div className="p-8 border border-white/5 bg-zinc-900/20 rounded-[2.5rem] flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div className="flex flex-col">
                <h2 className="text-2xl font-black text-white uppercase tracking-tighter">
                  {editingCourseId ? "Editando Treinamento" : step === 1 ? "Identidade do Curso" : "Estrutura do Conteúdo"}
                </h2>
                <div className="flex gap-2 mt-2">
                  <div className={`h-1.5 w-12 rounded-full transition-all ${step >= 1 ? "bg-primary" : "bg-white/10"}`} />
                  <div className={`h-1.5 w-12 rounded-full transition-all ${step >= 2 ? "bg-primary" : "bg-white/10"}`} />
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              {step === 2 && (
                <button 
                  onClick={() => setStep(1)}
                  className="text-zinc-500 hover:text-white font-bold text-sm px-4"
                >
                  Voltar Etapa
                </button>
              )}
              <button 
                disabled={isSaving}
                onClick={() => {
                  if (!isSaving) {
                    setIsModalOpen(false);
                    resetForm();
                  }
                }}
                className="bg-white/5 hover:bg-white/10 text-white font-black text-xs uppercase tracking-widest px-6 py-4 rounded-2xl border border-white/10 transition-all flex items-center gap-2"
              >
                Cancelar e Sair
              </button>
            </div>
          </div>

          {/* Builder Body */}
          <div className="bg-zinc-950/40 border border-white/5 rounded-[2.5rem] p-6 md:p-12">
            {step === 1 ? (
                  <motion.div 
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="max-w-3xl mx-auto space-y-12"
                  >
                    {/* Cover Preview */}
                    <div className="space-y-4">
                      <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Capa do Curso</label>
                      <div 
                        onClick={() => document.getElementById('course-thumb')?.click()}
                        className="aspect-video w-full bg-zinc-900 border-2 border-dashed border-white/10 rounded-[3rem] overflow-hidden group cursor-pointer hover:border-primary/50 transition-all relative"
                      >
                        {courseThumbnail ? (
                          <img src={URL.createObjectURL(courseThumbnail)} className="w-full h-full object-cover" alt="Course" />
                        ) : editingCourseId && courses.find(c => c.id.toString() === editingCourseId)?.thumbnail_url ? (
                          <img src={courses.find(c => c.id.toString() === editingCourseId)?.thumbnail_url || ""} className="w-full h-full object-cover" alt="Course" />
                        ) : (
                          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
                            <div className="p-6 bg-white/5 rounded-full text-zinc-600 group-hover:text-primary group-hover:scale-110 transition-all">
                              <ImageIcon size={40} />
                            </div>
                            <p className="text-zinc-500 text-sm font-bold">Arraste ou clique para enviar a capa</p>
                          </div>
                        )}
                        <input id="course-thumb" type="file" className="hidden" accept="image/*" onChange={(e) => setCourseThumbnail(e.target.files?.[0] || null)} />
                      </div>
                    </div>

                    {/* Inputs */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-2 md:col-span-2">
                        <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Nome do Curso</label>
                        <div className="relative group">
                          <Type className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-600 group-focus-within:text-primary transition-colors" size={20} />
                          <input 
                            type="text" 
                            placeholder="Ex: Formação Expert Bananal PRO"
                            value={newCourse.title}
                            onChange={(e) => setNewCourse({...newCourse, title: e.target.value})}
                            className="w-full bg-zinc-900/50 border border-white/10 rounded-2xl pl-14 pr-5 py-5 text-white focus:outline-none focus:ring-2 focus:ring-primary/50 font-bold" 
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Categoria Principal</label>
                        <select 
                          value={newCourse.category}
                          onChange={(e) => setNewCourse({...newCourse, category: e.target.value})}
                          className="w-full bg-zinc-900/50 border border-white/10 rounded-2xl px-6 py-5 text-white focus:outline-none focus:ring-2 focus:ring-primary/50 appearance-none font-bold"
                        >
                          <option value="Business">Business</option>
                          <option value="Mindset">Mindset</option>
                          <option value="Vendas">Vendas</option>
                          <option value="Produtos">Produtos</option>
                        </select>
                      </div>

                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Pontuação na Rede</label>
                        <div className="relative group">
                          <Star className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-600 group-focus-within:text-yellow-500 transition-colors" size={20} />
                          <input 
                            type="number" 
                            value={newCourse.points}
                            onChange={(e) => setNewCourse({...newCourse, points: Number(e.target.value)})}
                            className="w-full bg-zinc-900/50 border border-white/10 rounded-2xl pl-14 pr-5 py-5 text-white focus:outline-none focus:ring-2 focus:ring-primary/50 font-bold" 
                          />
                        </div>
                      </div>

                      <div className="space-y-2 md:col-span-2">
                        <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Breve Resumo</label>
                        <div className="relative group">
                          <AlignLeft className="absolute left-5 top-6 text-zinc-600 group-focus-within:text-primary transition-colors" size={20} />
                          <textarea 
                            rows={4}
                            placeholder="O que o afiliado vai aprender nesse curso?"
                            value={newCourse.description}
                            onChange={(e) => setNewCourse({...newCourse, description: e.target.value})}
                            className="w-full bg-zinc-900/50 border border-white/10 rounded-2xl pl-14 pr-5 py-5 text-white focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
                          />
                        </div>
                      </div>
                    </div>

                    <button 
                      onClick={() => setStep(2)}
                      className="w-full bg-primary hover:bg-primary text-white font-black py-6 rounded-3xl flex items-center justify-center gap-3 transition-all shadow-xl shadow-primary/20"
                    >
                      Próximo: Construtor de Conteúdo
                      <ChevronDown className="-rotate-90" size={20} />
                    </button>
                  </motion.div>
                ) : (
                  <motion.div 
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="space-y-8"
                  >
                    {/* Builder Toolbar */}
                    <div className="flex items-center justify-between mb-12">
                       <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary">
                             <LayoutIcon size={24} />
                          </div>
                          <div>
                             <h3 className="text-xl font-bold text-white tracking-tight">Grade do Treinamento</h3>
                             <p className="text-zinc-500 text-xs uppercase font-black tracking-widest">Estruture seus módulos, aulas e materiais</p>
                          </div>
                       </div>
                       <button 
                    onClick={addModule}
                    className="bg-primary hover:bg-primary/90 text-white font-black text-xs uppercase tracking-widest px-6 py-4 rounded-2xl border border-primary/20 transition-all flex items-center gap-2 shadow-lg shadow-primary/20 active:scale-95 cursor-pointer"
                   >
                     <Plus size={16} />
                     Novo Módulo
                   </button>
                </div>

                {/* Modules List */}
                <div className="space-y-6">
                  {modules.map((mod, modIdx) => (
                    <div key={mod.id} className="bg-zinc-900/30 border border-white/5 rounded-[2.5rem] overflow-hidden transition-all">
                      <div className="p-6 flex items-center justify-between bg-white/5">
                         <div className="flex items-center gap-4 flex-1">
                            <button
                              type="button"
                              onClick={() => {
                                const newMods = [...modules];
                                newMods[modIdx].isExpanded = !newMods[modIdx].isExpanded;
                                setModules(newMods);
                              }}
                              className="text-zinc-500 hover:text-white p-1 transition-transform duration-200"
                              style={{ transform: mod.isExpanded ? "rotate(0deg)" : "rotate(-90deg)" }}
                            >
                              <ChevronDown size={20} />
                            </button>
                            <GripVertical className="text-zinc-800" />
                            <input 
                              type="text" 
                              placeholder="Ex: Módulo 1 - Fundamentos do Negócio"
                              value={mod.title}
                              onChange={(e) => {
                                const newMods = [...modules];
                                newMods[modIdx].title = e.target.value;
                                setModules(newMods);
                              }}
                              className="bg-transparent border-none text-white font-black text-xl focus:ring-0 w-full placeholder:text-zinc-800"
                            />
                         </div>
                         <div className="flex items-center gap-3">
                             <button 
                               onClick={() => addLesson(mod.id)}
                               className="text-xs font-extrabold text-white bg-primary px-5 py-2.5 rounded-xl hover:bg-primary/90 transition-all uppercase tracking-wider shadow-md active:scale-95 flex items-center gap-1"
                             >
                               <Plus size={14} />
                               Aula
                             </button>
                             <button 
                               onClick={() => setModules(modules.filter(m => m.id !== mod.id))}
                               className="p-2 text-zinc-700 hover:text-primary transition-colors"
                             >
                               <Trash2 size={20} />
                             </button>
                         </div>
                      </div>

                      {mod.isExpanded && (
                        <div className="p-6 space-y-4">
                        {/* Capa do Módulo */}
                        <div className="flex flex-col md:flex-row items-center gap-6 p-6 bg-black/20 border border-white/5 rounded-3xl mb-6">
                          <div 
                            onClick={() => document.getElementById(`module-cover-${mod.id}`)?.click()}
                            className="w-full md:w-48 aspect-video bg-zinc-950 rounded-2xl border border-white/5 flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-primary/30 overflow-hidden relative group shrink-0"
                          >
                            {mod.coverFile ? (
                              <img src={URL.createObjectURL(mod.coverFile)} className="w-full h-full object-cover" alt="" />
                            ) : mod.existingCoverUrl ? (
                              <img src={mod.existingCoverUrl} className="w-full h-full object-cover" alt="" />
                            ) : (
                              <>
                                <ImageIcon size={20} className="text-zinc-700 group-hover:text-primary transition-colors" />
                                <span className="text-[10px] font-black text-zinc-700 group-hover:text-zinc-500 uppercase">Capa do Módulo</span>
                              </>
                            )}
                            <input 
                              id={`module-cover-${mod.id}`} 
                              type="file" 
                              className="hidden" 
                              accept="image/*" 
                              onChange={(e) => {
                                const file = e.target.files?.[0] || null;
                                const newMods = [...modules];
                                newMods[modIdx].coverFile = file;
                                setModules(newMods);
                              }} 
                            />
                          </div>
                          <div className="flex-1 space-y-1">
                            <h4 className="text-sm font-bold text-white">Imagem de Capa do Módulo</h4>
                            <p className="text-xs text-zinc-500">Esta imagem será mostrada como plano de fundo do card deste módulo no catálogo.</p>
                            {(mod.coverFile || mod.existingCoverUrl) && (
                              <button 
                                onClick={() => {
                                  const newMods = [...modules];
                                  newMods[modIdx].coverFile = null;
                                  newMods[modIdx].existingCoverUrl = "";
                                  setModules(newMods);
                                }}
                                className="text-[10px] font-black text-primary hover:text-red-400 uppercase tracking-widest mt-2 bg-transparent border-none cursor-pointer"
                              >
                                Remover Capa
                              </button>
                            )}
                          </div>
                        </div>

                        {mod.lessons.map((lesson, lessonIdx) => (
                              <div key={lesson.id} className="bg-black/40 border border-white/5 rounded-[2rem] p-6 grid grid-cols-1 md:grid-cols-12 gap-6 group hover:border-white/10 transition-all">
                                 {/* Lesson Thumbnail */}
                                 <div className="md:col-span-3">
                                    <div 
                                      onClick={() => document.getElementById(`lesson-thumb-${lesson.id}`)?.click()}
                                      className="aspect-video bg-zinc-950 rounded-2xl border border-white/5 flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-primary/30 overflow-hidden relative"
                                    >
                                      {lesson.thumbnailFile ? (
                                        <img src={URL.createObjectURL(lesson.thumbnailFile)} className="w-full h-full object-cover" alt="" />
                                      ) : (lesson as any).existingThumbUrl ? (
                                        <img src={(lesson as any).existingThumbUrl} className="w-full h-full object-cover" alt="" />
                                      ) : (
                                        <>
                                          <ImageIcon size={20} className="text-zinc-700" />
                                          <span className="text-[10px] font-black text-zinc-700 uppercase">Capa da Aula</span>
                                        </>
                                      )}
                                      <input id={`lesson-thumb-${lesson.id}`} type="file" className="hidden" accept="image/*" onChange={(e) => updateLesson(mod.id, lesson.id, { thumbnailFile: e.target.files?.[0] || null })} />
                                    </div>
                                 </div>

                                 {/* Lesson Details */}
                                 <div className="md:col-span-6 space-y-3">
                                    <input 
                                      type="text" 
                                      placeholder="Título da Aula"
                                      value={lesson.title}
                                      onChange={(e) => updateLesson(mod.id, lesson.id, { title: e.target.value })}
                                      className="w-full bg-transparent border-none text-white font-bold p-0 focus:ring-0 text-lg placeholder:text-zinc-800"
                                    />
                                    <input 
                                       type="text" 
                                       placeholder="Link do Vídeo (Ex: YouTube, Vimeo ou Panda Video)"
                                       value={lesson.videoUrlInput || ""}
                                       onChange={(e) => updateLesson(mod.id, lesson.id, { videoUrlInput: e.target.value })}
                                       className="w-full bg-black/20 border border-white/5 rounded-2xl px-4 py-2.5 text-zinc-300 text-xs focus:outline-none focus:ring-1 focus:ring-primary/30 placeholder:text-zinc-800"
                                     />
                                    <textarea 
                                      rows={3}
                                      placeholder="Descreva o que será ensinado nesta aula..."
                                      value={lesson.description}
                                      onChange={(e) => updateLesson(mod.id, lesson.id, { description: e.target.value })}
                                      className="w-full bg-black/20 border border-white/5 rounded-2xl px-4 py-3 text-zinc-400 text-sm focus:outline-none focus:ring-1 focus:ring-primary/30 resize-none placeholder:text-zinc-800"
                                    />
                                 </div>

                                 {/* Video Upload */}
                                 <div className="md:col-span-3 flex flex-col justify-center">
                                    <button 
                                      onClick={() => document.getElementById(`lesson-video-${lesson.id}`)?.click()}
                                      className={`w-full py-4 rounded-2xl border border-dashed flex flex-col items-center gap-2 transition-all ${lesson.videoFile ? "border-emerald-500/50 bg-emerald-500/5 text-emerald-500" : "border-white/10 hover:border-primary/50 text-zinc-500"}`}
                                    >
                                      {lesson.videoFile ? (
                                        <>
                                          <Check size={20} />
                                          <span className="text-[10px] font-black uppercase tracking-widest truncate max-w-[150px] px-2">{lesson.videoFile.name}</span>
                                        </>
                                      ) : (lesson as any).existingVideoUrl ? (
                                        <>
                                          <Check size={20} className="text-emerald-500" />
                                          <span className="text-[10px] font-black uppercase tracking-widest line-clamp-1 px-2">Vídeo Existente</span>
                                        </>
                                      ) : (
                                        <>
                                          <FileVideo size={20} />
                                          <span className="text-[10px] font-black uppercase tracking-widest">Selecionar Vídeo</span>
                                        </>
                                      )}
                                    </button>
                                    <input id={`lesson-video-${lesson.id}`} type="file" className="hidden" accept="video/*" onChange={(e) => updateLesson(mod.id, lesson.id, { videoFile: e.target.files?.[0] || null })} />
                                 </div>

                                 {/* Lesson Materials Section */}
                                 <div className="md:col-span-12 border-t border-white/5 pt-4 mt-2">
                                    <div className="flex items-center justify-between mb-4">
                                       <div className="flex items-center gap-2 text-zinc-500">
                                          <Download size={14} />
                                          <span className="text-[10px] font-black uppercase tracking-widest">Arquivos Complementares</span>
                                       </div>
                                       <button 
                                         onClick={() => {
                                           const currentMaterials = lesson.materials || [];
                                           updateLesson(mod.id, lesson.id, {
                                             materials: [...currentMaterials, { title: "", url: "" }]
                                           });
                                         }}
                                         className="text-[10px] font-black text-primary hover:text-red-400 uppercase tracking-widest flex items-center gap-1"
                                       >
                                         <Plus size={12} />
                                         Anexar Arquivo
                                       </button>
                                    </div>

                                    <div className="space-y-3">
                                       {(lesson.materials || []).map((material, mIdx) => (
                                         <div key={mIdx} className="flex gap-3 items-center">
                                           <input 
                                             type="text" 
                                             placeholder="Nome do Arquivo"
                                             value={material.title}
                                             onChange={(e) => {
                                               const newMats = [...(lesson.materials || [])];
                                               newMats[mIdx].title = e.target.value;
                                               updateLesson(mod.id, lesson.id, { materials: newMats });
                                             }}
                                             className="flex-1 bg-black/20 border border-white/5 rounded-xl px-4 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-primary/30"
                                           />
                                           
                                           <div className="flex-1 relative">
                                             <button 
                                               onClick={() => document.getElementById(`material-file-${lesson.id}-${mIdx}`)?.click()}
                                               className={`w-full py-2 rounded-xl border border-dashed text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${material.file || material.url ? "border-emerald-500/50 bg-emerald-500/5 text-emerald-500" : "border-white/10 hover:border-primary/50 text-zinc-500"}`}
                                             >
                                               {material.file ? (
                                                 <>
                                                   <Check size={14} />
                                                   <span className="truncate max-w-[150px]">{material.file.name}</span>
                                                 </>
                                               ) : material.url ? (
                                                 <>
                                                   <Check size={14} />
                                                   <span>Arquivo Pronto</span>
                                                 </>
                                               ) : (
                                                 <>
                                                   <Download size={14} />
                                                   <span>Upload de Arquivo</span>
                                                 </>
                                               )}
                                             </button>
                                             <input 
                                               id={`material-file-${lesson.id}-${mIdx}`} 
                                               type="file" 
                                               className="hidden" 
                                               onChange={(e) => {
                                                 const file = e.target.files?.[0];
                                                 if (file) {
                                                   const newMats = [...(lesson.materials || [])];
                                                   newMats[mIdx].file = file;
                                                   if (!newMats[mIdx].title) newMats[mIdx].title = file.name.split('.')[0];
                                                   updateLesson(mod.id, lesson.id, { materials: newMats });
                                                 }
                                               }} 
                                             />
                                           </div>

                                           <button 
                                             onClick={() => {
                                               const newMats = lesson.materials.filter((_, i) => i !== mIdx);
                                               updateLesson(mod.id, lesson.id, { materials: newMats });
                                             }}
                                             className="p-2 text-zinc-700 hover:text-primary transition-colors"
                                           >
                                             <X size={14} />
                                           </button>
                                         </div>
                                       ))}
                                       {(!lesson.materials || lesson.materials.length === 0) && (
                                         <p className="text-[10px] text-zinc-800 font-bold uppercase text-center py-2">Nenhum arquivo anexado a esta aula</p>
                                       )}
                                    </div>
                                 </div>

                                 {/* Lesson Actions */}
                                 <div className="md:col-span-12 flex justify-end border-t border-white/5 pt-4">
                                   <button 
                                     onClick={() => {
                                       const newMods = [...modules];
                                       newMods[modIdx].lessons = newMods[modIdx].lessons.filter(l => l.id !== lesson.id);
                                       setModules(newMods);
                                     }}
                                     className="text-[10px] font-black text-zinc-800 hover:text-primary transition-colors uppercase tracking-widest"
                                   >
                                     Excluir Aula
                                   </button>
                                 </div>
                              </div>
                            ))}

                            {mod.lessons.length === 0 && (
                              <div className="text-center py-10 border-2 border-dashed border-white/5 rounded-[2rem]">
                                 <p className="text-zinc-800 font-bold text-sm">Este módulo ainda não tem aulas.</p>
                              </div>
                            )}
                       </div>
                     )}
                    </div>
                  ))}

                      {modules.length === 0 && (
                        <div className="py-20 text-center border-2 border-dashed border-white/5 rounded-[3rem]">
                           <LayoutIcon className="mx-auto text-zinc-800 mb-4" size={40} />
                           <p className="text-zinc-700 font-black uppercase tracking-widest text-xs">Crie seu primeiro módulo para começar</p>
                        </div>
                      )}
                    </div>

                    {/* Global Save Button */}
                    <div className="pt-12 border-t border-white/5">
                      <button 
                        onClick={handleSaveCourse}
                        disabled={isSaving}
                        className="w-full bg-primary hover:bg-primary text-white font-black py-6 rounded-[2rem] flex items-center justify-center gap-3 transition-all shadow-2xl shadow-primary/30 disabled:opacity-50"
                      >
                        {isSaving ? <Loader2 className="animate-spin" /> : <Check size={24} />}
                        {isSaving ? "Salvando alterações..." : editingCourseId ? "Atualizar Treinamento" : "Finalizar e Publicar Treinamento"}
                      </button>
                    </div>
                  </motion.div>
                )}
            </div>
          </div>
        )}
      </Layout>
    );
  }
