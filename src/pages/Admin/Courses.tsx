import React, { useEffect, useState, useRef } from "react";
import AdminLayout from "../../components/Layout/AdminLayout";
import { motion, AnimatePresence } from "motion/react";
import { 
  BookOpen, 
  Plus, 
  Search, 
  Filter, 
  MoreVertical, 
  Video, 
  Star, 
  X,
  Image as ImageIcon,
  Trash2,
  FileVideo,
  Loader2,
  Layout,
  Check,
  ChevronDown,
  ChevronUp,
  GripVertical,
  Type,
  AlignLeft,
  Settings,
  Eye,
  Download
} from "lucide-react";
import { supabase } from "../../lib/supabase";
import { Tables } from "../../types/database";
import { toast } from "sonner";
import { useAuth } from "../../contexts/AuthContext";
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
  is_locked?: boolean;
}

interface ModuleInput {
  id: string;
  title: string;
  lessons: LessonInput[];
  isExpanded: boolean;
  coverFile: File | null;
  existingCoverUrl?: string;
  is_locked?: boolean;
}


export default function AdminCourses() {
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

  // Form State
  const [newCourse, setNewCourse] = useState({
    title: "",
    category: "Business",
    points: 0,
    description: "",
  });
  
  const [courseThumbnail, setCourseThumbnail] = useState<File | null>(null);
  const [modules, setModules] = useState<ModuleInput[]>([]);
  const [deletedLessonIds, setDeletedLessonIds] = useState<number[]>([]);
  const [deletedModuleIds, setDeletedModuleIds] = useState<number[]>([]);

  // Drag and Drop States and Refs
  const [draggingModuleIdx, setDraggingModuleIdx] = useState<number | null>(null);
  const [draggingLessonIdx, setDraggingLessonIdx] = useState<{ modId: string; lessonIdx: number } | null>(null);
  const draggingModuleIndexRef = useRef<number | null>(null);
  const draggingLessonIndexRef = useRef<{ modId: string; lessonIdx: number } | null>(null);

  const fetchCourses = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCourses(data || []);
    } catch (err) {
      console.error('Error fetching courses:', err);
      toast.error("Erro ao carregar cursos.");
    } finally {
      setLoading(false);
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
          is_locked,
          lessons (
            id,
            title,
            description,
            video_url,
            thumbnail_url,
            is_locked,
            materials:lesson_materials(id, title, file_url)
          )
        `)
        .eq('course_id', Number(courseId))
        .order('order_index', { ascending: true })
        .order('order_index', { foreignTable: 'lessons', ascending: true });

      if (modulesError) throw modulesError;

      // 3. Populate State
      setNewCourse({
        title: course.title || "",
        category: course.category || "Business",
        points: course.points || 0,
        description: course.description || "",
      });
      
      // Armazenar as URLs existentes para não perdê-las se não houver novo upload
      (course as any).existingThumbnailUrl = course.thumbnail_url;

      const formattedModules: ModuleInput[] = (modulesData || []).map(mod => ({
        id: mod.id.toString(),
        title: mod.title || "",
        isExpanded: false,
        coverFile: null,
        existingCoverUrl: (mod as any).cover_url || "",
        is_locked: mod.is_locked || false,
        lessons: (mod.lessons as any[] || []).map(lesson => ({
          id: lesson.id.toString(),
          title: lesson.title || "",
          description: lesson.description || "",
          thumbnailFile: null,
          videoFile: null,
          existingVideoUrl: lesson.video_url,
          videoUrlInput: lesson.video_url || "",
          existingThumbUrl: lesson.thumbnail_url,
          is_locked: lesson.is_locked || false,
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
      fetchCourses();
    } catch (err: any) {
      console.error('Error deleting course:', err);
      toast.error("Erro ao excluir curso.");
    }
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  const uploadFile = async (file: File, bucket: string) => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
    const filePath = `${fileName}`;

    await supabase.storage.createBucket(bucket, { public: true }).catch(() => {});

    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(filePath, file);

    if (uploadError) throw uploadError;

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
      // 0. Deletar módulos e aulas marcados para exclusão no banco de dados
      if (deletedLessonIds.length > 0) {
        // Excluir materiais associados primeiro
        await supabase
          .from('lesson_materials')
          .delete()
          .in('lesson_id', deletedLessonIds);

        // Excluir comentários associados primeiro
        await supabase
          .from('lesson_comments')
          .delete()
          .in('lesson_id', deletedLessonIds);
          
        // Excluir progresso do usuário associado
        await supabase
          .from('user_course_progress')
          .delete()
          .in('lesson_id', deletedLessonIds);

        const { error: delLessonError } = await supabase
          .from('lessons')
          .delete()
          .in('id', deletedLessonIds);
          
        if (delLessonError) throw delLessonError;
      }

      if (deletedModuleIds.length > 0) {
        const { error: delModError } = await supabase
          .from('course_modules')
          .delete()
          .in('id', deletedModuleIds);
          
        if (delModError) throw delModError;
      }

      setDeletedLessonIds([]);
      setDeletedModuleIds([]);

      let thumbnailUrl = "";

      // 1. Upload Capa do Curso
      if (courseThumbnail) {
        thumbnailUrl = await uploadFile(courseThumbnail, 'course-thumbnails');
      } else if (editingCourseId) {
        // Manter a existente se estiver editando e não enviou nova
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
          .eq('id', editingCourseId)
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

      const updatedModules = [];

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
          cover_url: coverUrl,
          is_locked: mod.is_locked || false
        };

        let moduleData;
        if (isExistingModule) {
          const { data, error } = await supabase
            .from('course_modules')
            .update(modulePayload)
            .eq('id', mod.id)
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

        const updatedLessons = [];
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
            order_index: j,
            is_locked: lesson.is_locked || false
          };

          let lessonId = lesson.id;
          if (isExistingLesson) {
            const { error: lessonError } = await supabase
              .from('lessons')
              .update(lessonPayload)
              .eq('id', lesson.id);
            if (lessonError) throw lessonError;
          } else {
            const { data: newLessonData, error: lessonError } = await supabase
              .from('lessons')
              .insert([lessonPayload])
              .select()
              .single();
            if (lessonError) throw lessonError;
            lessonId = newLessonData.id.toString();
          }

          // 3.1. Processar Materiais da Aula
          const updatedMaterials = [];
          if (lesson.materials && lesson.materials.length > 0) {
            for (const material of lesson.materials) {
              let materialUrl = material.url;

              // Se for um novo arquivo, fazer upload
              if (material.file) {
                materialUrl = await uploadFile(material.file, 'lesson-materials');
              }

              const materialPayload = {
                lesson_id: lessonId,
                title: material.title || "Arquivo",
                file_url: materialUrl,
                file_type: materialUrl.split('.').pop()?.toUpperCase() || 'FILE'
              };

              let materialId = material.id;
              if (material.id && !isNaN(Number(material.id))) {
                const { data: updatedMaterialData, error: matError } = await supabase
                  .from('lesson_materials')
                  .update(materialPayload)
                  .eq('id', material.id)
                  .select()
                  .single();
                if (!matError && updatedMaterialData) {
                  materialId = updatedMaterialData.id.toString();
                }
              } else {
                const { data: newMaterialData, error: matError } = await supabase
                  .from('lesson_materials')
                  .insert([materialPayload])
                  .select()
                  .single();
                if (!matError && newMaterialData) {
                  materialId = newMaterialData.id.toString();
                }
              }
              updatedMaterials.push({
                id: materialId,
                title: materialPayload.title,
                url: materialUrl,
                file: null
              });
            }
          }

          updatedLessons.push({
            ...lesson,
            id: lessonId,
            videoFile: null,
            thumbnailFile: null,
            existingVideoUrl: lessonVideoUrl,
            videoUrlInput: lessonVideoUrl,
            existingThumbUrl: lessonThumbUrl,
            materials: updatedMaterials
          });
        }

        updatedModules.push({
          ...mod,
          id: moduleData.id.toString(),
          existingCoverUrl: coverUrl,
          coverFile: null,
          lessons: updatedLessons
        });
      }

      toast.success(editingCourseId ? "Alterações salvas com sucesso!" : "Curso publicado com sucesso!");
      setEditingCourseId(course.id.toString());
      setCourseThumbnail(null);
      setModules(updatedModules);
      fetchCourses();
    } catch (err: any) {
      console.error('Error saving course:', err);
      toast.error("Erro ao salvar: " + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const resetForm = () => {
    setNewCourse({ title: "", category: "Business", points: 0, description: "" });
    setCourseThumbnail(null);
    setModules([]);
    setStep(1);
    setEditingCourseId(null);
    setDeletedLessonIds([]);
    setDeletedModuleIds([]);
  };

  const addModule = () => {
    const newModule: ModuleInput = {
      id: Math.random().toString(36),
      title: "",
      lessons: [],
      isExpanded: true,
      coverFile: null,
      existingCoverUrl: "",
      is_locked: false
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
            materials: [],
            is_locked: false
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
    <AdminLayout>
      {isModalOpen ? (
        <div className="max-w-7xl mx-auto space-y-8">
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
                    fetchCourses();
                  }
                }}
                className="bg-white/5 hover:bg-white/10 text-white font-black text-xs uppercase tracking-widest px-6 py-4 rounded-2xl border border-white/10 transition-all flex items-center gap-2"
              >
                Fechar Editor
              </button>
            </div>
          </div>

          {/* Body do Builder */}
          <div className="bg-zinc-950/40 border border-white/5 rounded-[2.5rem] p-6 md:p-12">
            {step === 1 ? (
              <motion.div 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="max-w-3xl mx-auto space-y-12"
              >
                {/* Capa Preview */}
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

                {/* Fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-2 md:col-span-2">
                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Nome do Curso</label>
                    <div className="relative group">
                      <Type className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-600 group-focus-within:text-primary transition-colors" size={20} />
                      <input 
                        type="text" 
                        placeholder="Ex: Formação Expert Banana PRO"
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
                  className="w-full bg-primary hover:bg-primary/95 text-white font-black py-6 rounded-3xl flex items-center justify-center gap-3 transition-all shadow-xl shadow-primary/20"
                >
                  Próximo: Montar Conteúdo
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
                         <Layout size={24} />
                      </div>
                      <div>
                         <h3 className="text-xl font-bold text-white tracking-tight">Construtor de Grade</h3>
                         <p className="text-zinc-500 text-xs uppercase font-black tracking-widest">Adicione módulos e suas respectivas aulas</p>
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
                    <div 
                      key={mod.id} 
                      draggable={draggingModuleIdx === modIdx}
                      onDragStart={(e) => {
                        draggingModuleIndexRef.current = modIdx;
                        e.dataTransfer.effectAllowed = "move";
                      }}
                      onDragOver={(e) => {
                        e.preventDefault();
                      }}
                      onDrop={(e) => {
                        const dragIdx = draggingModuleIndexRef.current;
                        if (dragIdx !== null && dragIdx !== modIdx) {
                          const newMods = [...modules];
                          const [movedMod] = newMods.splice(dragIdx, 1);
                          newMods.splice(modIdx, 0, movedMod);
                          setModules(newMods);
                        }
                      }}
                      onDragEnd={() => {
                        draggingModuleIndexRef.current = null;
                        setDraggingModuleIdx(null);
                      }}
                      className={`bg-zinc-900/30 border rounded-[2.5rem] overflow-hidden transition-all ${
                        draggingModuleIdx === modIdx ? "border-primary bg-zinc-900/60 opacity-50 scale-[0.98]" : "border-white/5"
                      }`}
                    >
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
                            <div 
                              onMouseDown={() => setDraggingModuleIdx(modIdx)}
                              onMouseUp={() => setDraggingModuleIdx(null)}
                              className="cursor-grab active:cursor-grabbing p-1 text-zinc-500 hover:text-white transition-colors flex items-center justify-center shrink-0"
                              title="Arraste para reordenar o módulo"
                            >
                              <GripVertical size={20} />
                            </div>
                            <div className="flex-1 flex flex-col gap-1 pr-4">
                               <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Título do Módulo</label>
                               <input 
                                 type="text" 
                                 placeholder="Ex: Módulo 1 - Introdução ao Banana PRO"
                                 value={mod.title}
                                 onChange={(e) => {
                                   const newMods = [...modules];
                                   newMods[modIdx].title = e.target.value;
                                   setModules(newMods);
                                 }}
                                 className="bg-black/30 border border-white/10 rounded-xl px-4 py-2 text-white font-bold text-base focus:outline-none focus:ring-1 focus:ring-primary/30 w-full placeholder:text-zinc-700"
                               />
                            </div>
                         </div>
                          <div className="flex items-center gap-4">
                             <label className="flex items-center gap-2 cursor-pointer bg-black/20 border border-white/5 px-3 py-1.5 rounded-xl hover:bg-black/35 transition-all select-none">
                               <input 
                                 type="checkbox" 
                                 checked={mod.is_locked || false}
                                 onChange={(e) => {
                                   const newMods = [...modules];
                                   newMods[modIdx].is_locked = e.target.checked;
                                   setModules(newMods);
                                 }}
                                 className="accent-emerald-500 w-4 h-4 cursor-pointer"
                               />
                               <span className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">Trancar Acesso (Em Breve)</span>
                             </label>

                             <button 
                               type="button"
                               onClick={() => {
                                const isRealId = !isNaN(Number(mod.id));
                                if (isRealId) {
                                  setDeletedModuleIds(prev => [...prev, Number(mod.id)]);
                                  // Adiciona todas as aulas deste módulo para deleção também
                                  const realLessonIds = mod.lessons
                                    .map(l => Number(l.id))
                                    .filter(id => !isNaN(id));
                                  if (realLessonIds.length > 0) {
                                    setDeletedLessonIds(prev => [...prev, ...realLessonIds]);
                                  }
                                }
                                setModules(modules.filter(m => m.id !== mod.id));
                              }}
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
                          <div 
                            key={lesson.id} 
                            draggable={draggingLessonIdx?.modId === mod.id && draggingLessonIdx?.lessonIdx === lessonIdx}
                            onDragStart={(e) => {
                              draggingLessonIndexRef.current = { modId: mod.id, lessonIdx };
                              e.dataTransfer.effectAllowed = "move";
                            }}
                            onDragOver={(e) => {
                              e.preventDefault();
                            }}
                            onDrop={(e) => {
                              const drag = draggingLessonIndexRef.current;
                              if (drag) {
                                const newMods = [...modules];
                                const sourceMod = newMods.find(m => m.id === drag.modId);
                                const targetMod = newMods.find(m => m.id === mod.id);
                                if (sourceMod && targetMod) {
                                  const [movedLesson] = sourceMod.lessons.splice(drag.lessonIdx, 1);
                                  targetMod.lessons.splice(lessonIdx, 0, movedLesson);
                                  setModules(newMods);
                                }
                              }
                            }}
                            onDragEnd={() => {
                              draggingLessonIndexRef.current = null;
                              setDraggingLessonIdx(null);
                            }}
                            className={`bg-black/40 border rounded-[2rem] p-6 grid grid-cols-1 md:grid-cols-12 gap-6 group hover:border-white/10 transition-all ${
                              draggingLessonIdx?.modId === mod.id && draggingLessonIdx?.lessonIdx === lessonIdx
                                ? "border-primary bg-black/60 opacity-50 scale-[0.99]"
                                : "border-white/5"
                            }`}
                          >
                             {/* Lesson Drag Grip Header */}
                             <div className="md:col-span-12 flex items-center gap-2 border-b border-white/5 pb-2 mb-2">
                               <div 
                                 onMouseDown={() => setDraggingLessonIdx({ modId: mod.id, lessonIdx })}
                                 onMouseUp={() => setDraggingLessonIdx(null)}
                                 className="cursor-grab active:cursor-grabbing p-1 text-zinc-500 hover:text-white transition-colors flex items-center justify-center shrink-0"
                                 title="Arraste para reordenar a aula"
                               >
                                 <GripVertical size={16} />
                               </div>
                               <span className="text-xs font-black text-zinc-400 uppercase tracking-widest">Aula {lessonIdx + 1}</span>
                             </div>
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
                                <div className="flex flex-col gap-1 w-full">
                                    <div className="flex items-center justify-between w-full">
                                      <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Nome da Aula</label>
                                      <label className="flex items-center gap-1.5 cursor-pointer select-none">
                                        <input 
                                          type="checkbox" 
                                          checked={lesson.is_locked || false}
                                          onChange={(e) => updateLesson(mod.id, lesson.id, { is_locked: e.target.checked })}
                                          className="accent-emerald-500 w-3.5 h-3.5 cursor-pointer"
                                        />
                                        <span className="text-[9px] font-black text-zinc-500 uppercase tracking-wider">Trancar Aula (Em Breve)</span>
                                      </label>
                                    </div>
                                    <input 
                                      type="text" 
                                      placeholder="Título da Aula"
                                      value={lesson.title}
                                      onChange={(e) => updateLesson(mod.id, lesson.id, { title: e.target.value })}
                                      className="w-full bg-black/20 border border-white/5 rounded-2xl px-4 py-3 text-white font-bold text-sm focus:outline-none focus:ring-1 focus:ring-primary/30 placeholder:text-zinc-800"
                                    />
                                 </div>
                                <input 
                                  type="text" 
                                  placeholder="Link do Vídeo (Ex: YouTube, Vimeo ou Panda Video)"
                                  value={lesson.videoUrlInput || ""}
                                  onChange={(e) => updateLesson(mod.id, lesson.id, { videoUrlInput: e.target.value })}
                                  className="w-full bg-black/20 border border-white/5 rounded-2xl px-4 py-2.5 text-zinc-300 text-xs focus:outline-none focus:ring-1 focus:ring-primary/30 placeholder:text-zinc-800"
                                />
                                <textarea 
                                  rows={3}
                                  placeholder="Descreva o que será ensinado nesta aula... (Dica: Use quebras de linha para organizar melhor)"
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
                                      <span className="text-[10px] font-black uppercase tracking-widest line-clamp-1 px-2">Vídeo Pronto</span>
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
                                       <span className="text-[10px] font-black uppercase tracking-widest">Arquivos para Download</span>
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
                                      Adicionar Arquivo
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
                                  type="button"
                                  onClick={() => {
                                    const isRealId = !isNaN(Number(lesson.id));
                                    if (isRealId) {
                                      setDeletedLessonIds(prev => [...prev, Number(lesson.id)]);
                                    }
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

                        {/* Botão de Adicionar Nova Aula */}
                        <div className="flex justify-center pt-6 border-t border-white/5 mt-4">
                          <button 
                            type="button"
                            onClick={() => addLesson(mod.id)}
                            className="bg-primary hover:bg-primary/95 text-white font-black text-xs uppercase tracking-widest px-8 py-4 rounded-2xl transition-all flex items-center gap-2 shadow-lg shadow-primary/20 active:scale-95 cursor-pointer"
                          >
                            <Plus size={16} />
                            Adicionar Nova Aula
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                  ))}

                  {modules.length === 0 && (
                    <div className="py-20 text-center border-2 border-dashed border-white/5 rounded-[3rem]">
                       <Layout className="mx-auto text-zinc-800 mb-4" size={40} />
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
      ) : (
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Header Section */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-emerald-500/10 dark:bg-emerald-500/20 rounded-2xl border border-emerald-500/20">
                <BookOpen className="text-[#589c1c] dark:text-[#6ee7b7] w-8 h-8" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-slate-800 dark:text-white">Gestão de Treinamentos (LMS)</h1>
                <p className="text-slate-500 dark:text-zinc-400 text-sm mt-1">Plataforma de capacitação Banana PRO.</p>
              </div>
            </div>
            <button 
              onClick={() => {
                resetForm();
                setIsModalOpen(true);
              }}
              className="bg-[#589c1c] hover:bg-[#467c16] dark:bg-[#10b981] dark:hover:bg-[#0d9468] text-white px-8 py-4 rounded-2xl font-bold flex items-center gap-2 transition-all shadow-lg shadow-emerald-600/10 active:scale-95 cursor-pointer"
            >
              <Plus size={20} />
              Novo Treinamento
            </button>
          </div>

          {/* Filters */}
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-zinc-500 group-focus-within:text-emerald-500 transition-colors" size={20} />
              <input 
                type="text" 
                placeholder="Pesquisar nos seus conteúdos..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-white dark:bg-zinc-900/40 border border-slate-200 dark:border-white/10 rounded-2xl pl-12 pr-4 py-4 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all"
              />
            </div>
            <button className="bg-white dark:bg-zinc-900/40 border border-slate-200 dark:border-white/10 p-4 rounded-2xl text-slate-500 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-white transition-all cursor-pointer">
              <Filter size={20} />
            </button>
          </div>

          {/* Courses Grid */}
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-10 h-10 text-emerald-500 animate-spin" />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredCourses.map((course) => (
                <motion.div 
                  key={course.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white dark:bg-zinc-900/40 border border-slate-100 dark:border-white/5 rounded-[2rem] shadow-sm overflow-hidden flex flex-col group hover:border-emerald-500/30 dark:hover:border-emerald-500/30 transition-all"
                >
                  <div className="aspect-video relative overflow-hidden">
                    <img 
                      src={course.thumbnail_url || "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800"} 
                      alt={course.title || ""}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute top-4 left-4 flex gap-2">
                      <span className="bg-black/60 backdrop-blur-md text-white text-[10px] font-black px-3 py-1.5 rounded-full uppercase tracking-widest border border-white/10">
                        {course.category}
                      </span>
                    </div>
                  </div>

                  <div className="p-8 flex-1 flex flex-col justify-between">
                    <div>
                      <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2 line-clamp-1">{course.title}</h3>
                      <p className="text-slate-500 dark:text-zinc-500 text-sm line-clamp-2 mb-6">{course.description}</p>
                    </div>

                    <div className="flex items-center justify-between pt-6 border-t border-slate-100 dark:border-white/5">
                      <div className="flex items-center gap-2">
                        <div className="p-2 bg-yellow-500/10 rounded-lg">
                          <Star className="text-yellow-500" size={14} />
                        </div>
                        <span className="text-sm font-bold text-slate-800 dark:text-white">{course.points} pts</span>
                      </div>
                      <div className="flex items-center gap-2 relative">
                         <button 
                           onClick={() => handleEditCourse(course.id.toString())}
                           className="bg-[#589c1c] hover:bg-[#467c16] dark:bg-[#10b981] dark:hover:bg-[#0d9468] text-white px-4 py-2 rounded-xl text-xs font-extrabold transition-all flex items-center gap-1 shadow-md cursor-pointer"
                           title="Editar Treinamento"
                         >
                           <Settings size={14} />
                           Editar
                         </button>
                         <button 
                           onClick={() => navigate(`/admin/cursos/detalhes/${course.id}`)}
                           className="p-2 text-slate-400 dark:text-zinc-500 hover:text-slate-800 dark:hover:text-white transition-colors cursor-pointer"
                           title="Visualizar no Catálogo"
                         >
                           <Eye size={18} />
                         </button>
                         <div className="relative">
                           <button 
                             onClick={(e) => {
                               e.stopPropagation();
                               setActiveMenuId(activeMenuId === course.id ? null : course.id);
                             }}
                             className={`p-2 transition-colors cursor-pointer ${activeMenuId === course.id ? 'text-[#589c1c] dark:text-[#6ee7b7]' : 'text-slate-400 dark:text-zinc-500 hover:text-slate-800 dark:hover:text-white'}`}
                           >
                             <MoreVertical size={18} />
                           </button>

                           <AnimatePresence>
                             {activeMenuId === course.id && (
                               <>
                                 <div 
                                   className="fixed inset-0 z-10" 
                                   onClick={() => setActiveMenuId(null)}
                                 />
                                 <motion.div 
                                   initial={{ opacity: 0, scale: 0.95, y: 10 }}
                                   animate={{ opacity: 1, scale: 1, y: 0 }}
                                   exit={{ opacity: 0, scale: 0.95, y: 10 }}
                                   className="absolute right-0 bottom-full mb-2 w-48 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-white/10 rounded-xl shadow-2xl z-20 overflow-hidden"
                                 >
                                   <button 
                                      onClick={() => handleEditCourse(course.id.toString())}
                                      className="w-full px-4 py-3 text-left text-sm text-slate-650 dark:text-zinc-450 hover:bg-slate-50 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white flex items-center gap-2 transition-all cursor-pointer"
                                    >
                                      <Settings size={14} />
                                      Editar Curso
                                    </button>
                                   <button 
                                     onClick={() => {
                                       setActiveMenuId(null);
                                       handleDeleteCourse(course.id);
                                     }}
                                     className="w-full px-4 py-3 text-left text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 flex items-center gap-2 transition-all cursor-pointer"
                                   >
                                     <Trash2 size={14} />
                                     Excluir Treinamento
                                   </button>
                                 </motion.div>
                               </>
                             )}
                           </AnimatePresence>
                         </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      )}
    </AdminLayout>
  );
}
