import React, { useEffect, useState, useRef } from "react";
import Layout from "../../components/Layout/Layout";
import { motion, AnimatePresence } from "motion/react";
import { 
  Play, 
  BookOpen, 
  CheckCircle, 
  Clock, 
  Award, 
  Star, 
  ChevronLeft, 
  ChevronRight, 
  X, 
  Download, 
  FileText, 
  Sparkles, 
  Zap, 
  Loader2,
  Tv,
  Calendar
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import { Tables } from "../../types/database";
import { useAuth } from "../../contexts/AuthContext";
import YouTubePlayer from "../../components/Courses/YouTubePlayer";

// Import da imagem exclusiva do Módulo 0 (Boas-vindas)
import modulo0Img from "../../assets/modulo0.jpg";

type Course = Tables<'courses'> & {
  instructor?: { full_name: string } | null;
};

type Module = Tables<'course_modules'> & {
  lessons: Tables<'lessons'>[];
  progressPercent: number;
  status: string;
  completedCount: number;
  cover: string;
  desc: string;
};

type Lesson = Tables<'lessons'>;

// Imagens temáticas exclusivas para os módulos
const MODULE_THEMES = [
  {
    title: "Boas-vindas e Integração",
    desc: "Comece sua jornada entendendo como o treinamento funciona, a mentalidade do produtor profissional e como aproveitar ao máximo tudo o que preparamos para você.",
    cover: modulo0Img,
  },
  {
    title: "Manejo de Solo, Calagem e Nutrição",
    desc: "Técnicas científicas de amostragem de terra, cálculo exato de calagem, gessagem e recomendação de adubação (NPK e micronutrientes).",
    cover: "https://images.unsplash.com/photo-1589923188900-85dae523342b?auto=format&fit=crop&q=80&w=800",
  },
  {
    title: "Controle Integrado de Pragas e Sigatoka",
    desc: "Identificação cirúrgica, monitoramento e combate à Sigatoka Negra/Amarela, Mal-do-Panamá, broca e nematoides com manejo químico e biológico.",
    cover: "https://images.unsplash.com/photo-1599599810769-bcde5a160d32?auto=format&fit=crop&q=80&w=800",
  },
  {
    title: "Gestão Operacional, Fluxo e Custos",
    desc: "Cálculo de custo de produção por hectare, planejamento financeiro anual, controle de estoque de insumos e eficiência da mão de obra.",
    cover: "https://images.unsplash.com/photo-1464234470488-910db15db18e?auto=format&fit=crop&q=80&w=800",
  },
  {
    title: "Colheita, Climatização e Pós-Colheita",
    desc: "Ponto ideal de colheita para o mercado interno e exportação, processamento no packing house, embalagem e redução de perdas.",
    cover: "https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?auto=format&fit=crop&q=80&w=800",
  }
];

const getModuleTheme = (title: string, index: number, coverUrl?: string) => {
  const theme = MODULE_THEMES[index % MODULE_THEMES.length];
  return {
    title: title.startsWith("Módulo") ? `Módulo ${index}: ${theme.title}` : title,
    desc: theme.desc,
    cover: coverUrl || theme.cover,
  };
};

export default function Catalog() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  
  const [course, setCourse] = useState<Course | null>(null);
  const [modules, setModules] = useState<Module[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [completedLessons, setCompletedLessons] = useState<number[]>([]);
  const [lastWatchedLesson, setLastWatchedLesson] = useState<Lesson | null>(null);
  const [nextLessonToWatch, setNextLessonToWatch] = useState<Lesson | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedModule, setSelectedModule] = useState<Module | null>(null);

  const [moduleMaterials, setModuleMaterials] = useState<any[]>([]);
  const [loadingMaterials, setLoadingMaterials] = useState(false);

  const [recordedLives, setRecordedLives] = useState<any[]>([]);
  const [loadingLives, setLoadingLives] = useState(false);
  const [selectedLiveReplay, setSelectedLiveReplay] = useState<any | null>(null);

  const carouselRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const handleAccessModule = (mod: Module) => {
    if ((mod as any).is_locked) {
      toast.warning("Este módulo estará disponível em breve!");
      return;
    }
    if (!mod.lessons || mod.lessons.length === 0) return;
    const firstUncompleted = mod.lessons.find(l => !completedLessons.includes(Number(l.id)));
    const targetLesson = firstUncompleted || mod.lessons[0];
    navigate(`/cursos/player/${course?.id}?lessonId=${targetLesson.id}`);
  };

  // Buscar dados principais
  useEffect(() => {
    const fetchCourseData = async () => {
      setLoading(true);
      try {
        // 1. Buscar primeiro curso ativo do banco
        const { data: coursesData, error: coursesError } = await supabase
          .from('courses')
          .select(`
            *,
            instructor:user_profiles (full_name)
          `)
          .eq('is_active', true)
          .order('id', { ascending: true });

        if (coursesError) throw coursesError;
        if (!coursesData || coursesData.length === 0) {
          setLoading(false);
          return;
        }

        const mainCourse = coursesData[0];
        setCourse(mainCourse as any);

        // 2. Buscar módulos
        const { data: modulesData, error: modulesError } = await supabase
          .from('course_modules')
          .select('*')
          .eq('course_id', mainCourse.id)
          .order('order_index', { ascending: true });

        if (modulesError) throw modulesError;

        // 3. Buscar aulas
        const { data: lessonsData, error: lessonsError } = await supabase
          .from('lessons')
          .select('*')
          .eq('course_id', mainCourse.id)
          .order('order_index', { ascending: true });

        if (lessonsError) throw lessonsError;
        const allLessons = lessonsData || [];
        setLessons(allLessons);

        // 4. Buscar progresso do usuário
        let completedIds: number[] = [];
        let lastWatched: Lesson | null = null;

        if (profile?.id) {
          const { data: progressData, error: progressError } = await supabase
            .from('user_course_progress')
            .select('lesson_id, completed_at')
            .eq('course_id', mainCourse.id)
            .eq('user_id', profile.id)
            .eq('completed', true)
            .order('completed_at', { ascending: false });

          if (progressError) throw progressError;
          completedIds = progressData?.map(p => Number(p.lesson_id)) || [];
          setCompletedLessons(completedIds);

          if (progressData && progressData.length > 0) {
            const lastCompletedId = Number(progressData[0].lesson_id);
            lastWatched = allLessons.find(l => l.id === lastCompletedId) || null;
            setLastWatchedLesson(lastWatched);
          }
        }

        // 5. Determinar próxima aula a assistir
        let nextLesson: Lesson | null = null;
        if (allLessons.length > 0) {
          if (lastWatched) {
            const lastIndex = allLessons.findIndex(l => l.id === lastWatched!.id);
            if (lastIndex !== -1 && lastIndex < allLessons.length - 1) {
              nextLesson = allLessons[lastIndex + 1];
            } else {
              // Se terminou a última, sugere a primeira aula não concluída
              const firstUncompleted = allLessons.find(l => !completedIds.includes(Number(l.id)));
              nextLesson = firstUncompleted || allLessons[allLessons.length - 1];
            }
          } else {
            nextLesson = allLessons[0];
          }
        }
        setNextLessonToWatch(nextLesson);

        // 6. Enriquecer os módulos (Módulo 0, Módulo 1, etc.)
        const enrichedModules = (modulesData || []).map((mod, index) => {
          const modLessons = allLessons.filter(lesson => lesson.module_id === mod.id);
          const theme = getModuleTheme(mod.title, index, (mod as any).cover_url);
          
          const completedInModule = modLessons.filter(l => completedIds.includes(Number(l.id))).length;
          const progressPercent = modLessons.length > 0 ? Math.round((completedInModule / modLessons.length) * 100) : 0;
          
          let status = mod.is_locked ? "Em breve" : "Não iniciado";
          if (!mod.is_locked && completedInModule > 0) {
            status = completedInModule === modLessons.length ? "Concluído" : "Em andamento";
          }

          return {
            ...mod,
            title: theme.title,
            desc: theme.desc,
            cover: theme.cover,
            lessons: modLessons,
            progressPercent,
            status,
            completedCount: completedInModule
          };
        });

        setModules(enrichedModules);

      } catch (err) {
        console.error("Error loading course data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchCourseData();
  }, [profile]);

  // Helpers para extração de IDs de vídeo e thumbnail das lives
  const getLiveYoutubeId = (url: string) => {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  const getLiveSessionThumbnail = (item: any) => {
    if (item.replay_url) {
      const ytId = getLiveYoutubeId(item.replay_url);
      if (ytId) {
        return `https://img.youtube.com/vi/${ytId}/hqdefault.jpg`;
      }
    }
    
    const category = (item.category || "").toLowerCase();
    if (category.includes("solo") || category.includes("nutri")) {
      return "https://images.unsplash.com/photo-1464226184884-fa280b87c399?auto=format&fit=crop&q=80&w=600";
    }
    if (category.includes("sustent") || category.includes("org")) {
      return "https://images.unsplash.com/photo-1530595467537-0b5996c41f2d?auto=format&fit=crop&q=80&w=600";
    }
    if (category.includes("finan") || category.includes("gest")) {
      return "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&q=80&w=600";
    }
    
    return "https://images.unsplash.com/photo-1593113598332-cd288d649433?auto=format&fit=crop&q=80&w=1200";
  };

  const isLiveDirectVideoUrl = (url: string) => {
    if (!url) return false;
    return url.includes('/storage/v1/object/') || url.match(/\.(mp4|webm|ogg|mov)($|\?)/i) !== null;
  };

  // Buscar mentorias gravadas (lives com status finished)
  useEffect(() => {
    const fetchRecordedLives = async () => {
      setLoadingLives(true);
      try {
        const { data, error } = await supabase
          .from("lives")
          .select("*")
          .eq("status", "finished")
          .order("scheduled_at", { ascending: false });

        if (error) throw error;

        const mapped = (data || []).map((item: any) => {
          const dateObj = new Date(item.scheduled_at);
          const formattedDate = dateObj.toLocaleDateString("pt-BR", {
            day: "2-digit",
            month: "short",
            year: "numeric",
          });

          return {
            id: item.id,
            title: item.title,
            host: item.host || "Dr. Carlos Silva",
            date: formattedDate,
            duration: item.duration || "Gravação",
            category: item.category || "Geral",
            videoUrl: getLiveSessionThumbnail(item),
            description: item.description,
            replay_url: item.replay_url,
            materials: item.materials || []
          };
        });

        setRecordedLives(mapped);
      } catch (err) {
        console.warn("Erro ao buscar lives gravadas:", err);
      } finally {
        setLoadingLives(false);
      }
    };

    fetchRecordedLives();
  }, [profile]);

  // Carregar materiais complementares ao selecionar um módulo
  useEffect(() => {
    if (!selectedModule || selectedModule.lessons.length === 0) {
      setModuleMaterials([]);
      return;
    }

    const fetchModuleMaterials = async () => {
      setLoadingMaterials(true);
      try {
        const lessonIds = selectedModule.lessons.map(l => l.id);
        const { data, error } = await supabase
          .from('lesson_materials')
          .select('*')
          .in('lesson_id', lessonIds);

        if (error) throw error;
        setModuleMaterials(data || []);
      } catch (err) {
        console.error("Error fetching module materials:", err);
      } finally {
        setLoadingMaterials(false);
      }
    };

    fetchModuleMaterials();
  }, [selectedModule]);

  // Configurações de scroll do carrossel
  const checkScrollLimits = () => {
    if (carouselRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = carouselRef.current;
      setCanScrollLeft(scrollLeft > 5);
      setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 5);
    }
  };

  const scroll = (direction: "left" | "right") => {
    if (carouselRef.current) {
      const { scrollLeft, clientWidth } = carouselRef.current;
      const scrollTo = direction === "left" 
        ? scrollLeft - clientWidth * 0.75 
        : scrollLeft + clientWidth * 0.75;
      carouselRef.current.scrollTo({ left: scrollTo, behavior: "smooth" });
    }
  };

  useEffect(() => {
    const el = carouselRef.current;
    if (el) {
      el.addEventListener("scroll", checkScrollLimits);
      checkScrollLimits();
      window.addEventListener("resize", checkScrollLimits);
    }
    return () => {
      if (el) el.removeEventListener("scroll", checkScrollLimits);
      window.removeEventListener("resize", checkScrollLimits);
    };
  }, [modules]);

  // Calcular progresso geral
  const totalLessons = lessons.length;
  const completedCount = completedLessons.length;
  const progressPercent = totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0;

  if (loading) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center min-h-[80vh] gap-4">
          <Loader2 className="w-12 h-12 text-primary animate-spin" />
          <p className="text-on-surface-variant font-headline font-bold text-xs uppercase tracking-widest">
            Carregando sua jornada...
          </p>
        </div>
      </Layout>
    );
  }

  if (!course) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center min-h-[70vh] text-center space-y-6 max-w-md mx-auto">
          <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center text-primary">
            <Zap size={36} />
          </div>
          <div className="space-y-2">
            <h2 className="text-3xl font-headline font-black text-on-surface">Formação Indisponível</h2>
            <p className="text-on-surface-variant leading-relaxed">
              O treinamento principal do Bananal PRO está temporariamente em manutenção. Por favor, tente novamente mais tarde.
            </p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-12 pb-20 max-w-[1600px] mx-auto hero-banner-container">
        
        {/* Estilos customizados para contornar overrides agressivos do index.css e forçar elementos legíveis */}
        <style dangerouslySetInnerHTML={{ __html: `
          body:not(.dark-theme) .hero-banner-container .force-white,
          body:not(.dark-theme) .force-white,
          body .force-white,
          .hero-banner-container .force-white {
            color: #ffffff !important;
          }
          .hero-banner-container .force-zinc-200 {
            color: #f4f4f5 !important;
          }
          .hero-banner-container .force-zinc-300 {
            color: #d4d4d8 !important;
          }
          .hero-banner-container .force-zinc-400 {
            color: #a1a1aa !important;
          }
          .hero-banner-container .force-emerald-400 {
            color: #34d399 !important;
          }
          .hero-banner-container .hero-card-custom {
            background-color: #000000 !important;
          }
          .hero-banner-container .gradient-t-custom {
            background: linear-gradient(to top, rgba(0, 0, 0, 0.7) 0%, rgba(0, 0, 0, 0.1) 60%, transparent 100%) !important;
          }
          .hero-banner-container .gradient-r-custom {
            background: linear-gradient(to right, rgba(0, 0, 0, 0.75) 0%, rgba(0, 0, 0, 0.1) 60%, transparent 100%) !important;
          }
          .hero-banner-container .selo-premium-badge {
            background-color: rgba(255, 255, 255, 0.15) !important;
            border: 1px solid rgba(255, 255, 255, 0.25) !important;
          }
          .hero-banner-container .btn-continuar {
            background-color: #006d3b !important;
            color: #ffffff !important;
            border: 1px solid #006d3b !important;
          }
          .hero-banner-container .btn-continuar:hover {
            background-color: #00522c !important;
            border-color: #00522c !important;
          }
          .hero-banner-container .btn-continuar svg {
            color: #ffffff !important;
            fill: #ffffff !important;
          }
          .hero-banner-container .btn-modulos {
            background-color: #ffffff !important;
            color: #006d3b !important;
            border: 1px solid #ffffff !important;
          }
          .hero-banner-container .btn-modulos:hover {
            background-color: #f4f4f5 !important;
            border-color: #f4f4f5 !important;
            color: #00522c !important;
          }
          .hero-banner-container .btn-modulos svg {
            color: #006d3b !important;
          }
          .hero-banner-container .btn-modulos:hover svg {
            color: #00522c !important;
          }
          .hero-banner-container .btn-card-acessar {
            background-color: rgba(255, 255, 255, 0.12) !important;
            color: #ffffff !important;
            border: 1px solid rgba(255, 255, 255, 0.25) !important;
            backdrop-filter: blur(8px) !important;
          }
          .hero-banner-container .btn-card-acessar:hover {
            background-color: rgba(255, 255, 255, 0.25) !important;
            color: #ffffff !important;
          }
          .hero-banner-container .card-gradient-custom {
            background: linear-gradient(to top, rgba(0, 0, 0, 0.7) 0%, rgba(0, 0, 0, 0.15) 50%, transparent 100%) !important;
          }
        `}} />

        {/* HERO FEATURED SECTION (Estilo Netflix / Masterclass com Imagem Viva e Textos Brancos Forçados) */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative w-full rounded-[3.5rem] overflow-hidden min-h-[480px] lg:min-h-[520px] border border-outline/15 hero-card-custom flex flex-col justify-end p-8 md:p-16 lg:p-20 shadow-2xl"
        >
          {/* Capa de Fundo com Imagem mais nítida e vibrante */}
          <div className="absolute inset-0 z-0">
            <img 
              src={course.thumbnail_url || "https://images.unsplash.com/photo-1595974482597-4b8da8879bc5?auto=format&fit=crop&q=80&w=1600"} 
              className="w-full h-full object-cover opacity-100 brightness-[1.08]"
              alt="Capa Bananal PRO"
            />
            {/* Gradientes controlados para dar contraste aos textos sem apagar a imagem */}
            <div className="absolute inset-0 gradient-t-custom" />
            <div className="absolute inset-0 gradient-r-custom" />
          </div>

          {/* Conteúdo do Banner */}
          <div className="relative z-10 space-y-8 max-w-4xl">
            {/* Selo Premium + Info */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="selo-premium-badge backdrop-blur-md px-3.5 py-1.5 rounded-full border text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 force-white">
                <Star size={12} className="text-yellow-400 fill-yellow-400" />
                Selo Premium
              </div>
              <div className="text-[10px] font-black text-white bg-emerald-600 border border-emerald-500/30 px-3.5 py-1.5 rounded-full uppercase tracking-widest">
                Formação Oficial
              </div>
            </div>

            {/* Título Principal & Subtítulo */}
            <div className="space-y-4">
              <h1 className="text-5xl md:text-7xl font-display font-black tracking-tight leading-none force-white">
                {course.title === 'grilo' || course.title === 'rick' || course.title === ' girino   adulto ' ? 'BANANAL PRO' : course.title.toUpperCase()}
              </h1>
              <p className="text-lg md:text-xl font-medium max-w-2xl leading-relaxed force-white">
                Formação completa para produtores que desejam aumentar produtividade, melhorar gestão e obter mais resultados.
              </p>
            </div>

            {/* Botões de Ação */}
            <div className="flex flex-wrap items-center gap-4">
              <button 
                onClick={() => {
                  if (nextLessonToWatch) {
                    navigate(`/cursos/player/${course.id}?lessonId=${nextLessonToWatch.id}`);
                  } else {
                    navigate(`/cursos/player/${course.id}`);
                  }
                }}
                className="btn-continuar transition-all font-black text-xs uppercase tracking-widest px-8 py-5 rounded-2xl flex items-center gap-3 active:scale-95 shadow-xl cursor-pointer"
              >
                <Play size={16} fill="currentColor" />
                Continuar Assistindo
              </button>
              <button 
                onClick={() => {
                  const modSection = document.getElementById("modules-section");
                  if (modSection) {
                    modSection.scrollIntoView({ behavior: "smooth" });
                  }
                }}
                className="btn-modulos transition-all border font-black text-xs uppercase tracking-widest px-8 py-5 rounded-2xl flex items-center gap-3 active:scale-95 cursor-pointer"
              >
                <BookOpen size={16} />
                Ver Módulos
              </button>
            </div>

            {/* Progresso do Aluno */}
            <div className="pt-6 border-t border-white/10 space-y-3 max-w-md">
              <div className="flex items-center justify-between text-xs font-semibold force-zinc-300">
                <span>Progresso Geral do Curso</span>
                <span>{progressPercent}% Concluído</span>
              </div>
              <div className="w-full h-1.5 bg-white/15 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-emerald-500 rounded-full transition-all duration-1000" 
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <div className="flex flex-wrap items-center justify-between gap-4 text-[10px] font-bold force-zinc-400">
                <span>Aulas concluídas: {completedCount} de {totalLessons}</span>
                {lastWatchedLesson && (
                  <span className="truncate max-w-[240px]">
                    Última assistida: <span className="force-white font-extrabold">{lastWatchedLesson.title}</span>
                  </span>
                )}
              </div>
            </div>
          </div>
        </motion.div>

        {/* SEÇÃO DOS MÓDULOS (Greenn Club 2.0 Carrossel) */}
        <div className="space-y-8 pt-6" id="modules-section">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div className="space-y-1.5">
              <h2 className="text-3xl font-display font-black text-on-surface tracking-tight">Sua Jornada de Aprendizado</h2>
              <p className="text-on-surface-variant text-sm font-medium">Explore todos os módulos da formação Bananal PRO.</p>
            </div>
          </div>

          {/* Container do Carrossel com Setas Absolutas Estilo Slide */}
          <div className="relative group/carousel">
            {/* Seta Esquerda */}
            <AnimatePresence>
              {canScrollLeft && (
                <motion.button
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  onClick={() => scroll("left")}
                  className="absolute left-4 top-1/2 -translate-y-1/2 z-20 w-12 h-12 rounded-full bg-zinc-950/80 hover:bg-zinc-900 border border-white/10 flex items-center justify-center text-white shadow-2xl transition-all cursor-pointer hover:scale-110 active:scale-95"
                  title="Módulos Anteriores"
                >
                  <ChevronLeft size={24} />
                </motion.button>
              )}
            </AnimatePresence>

            {/* Seta Direita */}
            <AnimatePresence>
              {canScrollRight && (
                <motion.button
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  onClick={() => scroll("right")}
                  className="absolute right-4 top-1/2 -translate-y-1/2 z-20 w-12 h-12 rounded-full bg-zinc-950/80 hover:bg-zinc-900 border border-white/10 flex items-center justify-center text-white shadow-2xl transition-all cursor-pointer hover:scale-110 active:scale-95"
                  title="Próximos Módulos"
                >
                  <ChevronRight size={24} />
                </motion.button>
              )}
            </AnimatePresence>

            {/* Carrossel de Módulos */}
            <div 
              ref={carouselRef}
              className="flex gap-6 overflow-x-auto no-scrollbar scroll-smooth snap-x snap-mandatory pb-6 px-1"
            >
              {modules.map((mod, index) => {
                const isSelected = selectedModule?.id === mod.id;
                return (
                  <div 
                    key={mod.id}
                    className="snap-start shrink-0"
                  >
                    {/* Card Módulo Premium */}
                    <div 
                      onClick={() => handleAccessModule(mod)}
                      className="relative w-[290px] h-[500px] rounded-[2.5rem] overflow-hidden flex flex-col justify-between p-6 cursor-pointer shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-[1.02] border group border-white/10 hover:border-white/20"
                    >
                      {/* Capa de Fundo (Imagem do Módulo) */}
                      <div className="absolute inset-0 z-0 bg-zinc-950">
                        <img 
                          src={mod.cover} 
                          className={`w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ${mod.is_locked ? "opacity-45" : "opacity-100"}`} 
                          alt={mod.title}
                        />
                      </div>

                      {/* Badge de Status (Z-10 para ficar acima do fundo) */}
                      <div className="relative z-10 self-start">
                        <span className={`px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border backdrop-blur-md ${
                          mod.status === "Concluído" 
                            ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" 
                            : (mod.status === "Em andamento" || mod.status === "Em breve")
                            ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                            : "bg-black/45 text-white force-white border-white/10"
                        }`}>
                          {mod.status}
                        </span>
                      </div>

                      {/* Informações do Módulo (Z-10) */}
                      <div className="relative z-10 flex flex-col justify-end space-y-4 pt-5">
                        
                        {/* Tempo e Aulas */}
                        <div className="flex items-center justify-between text-xs font-semibold force-white">
                          <span className="flex items-center gap-1 force-white">
                            <Clock size={12} className="force-white" />
                            {mod.lessons.length * 15} min
                          </span>
                          <span className="force-white">{mod.lessons.length} aulas</span>
                        </div>

                        {/* Barra de Progresso */}
                        <div className="space-y-1.5">
                          <div className="w-full h-1 rounded-full overflow-hidden" style={{ backgroundColor: 'rgba(255, 255, 255, 0.25)' }}>
                            <div 
                              className="h-full bg-emerald-500 rounded-full" 
                              style={{ width: `${mod.progressPercent}%` }}
                            />
                          </div>
                          <div className="flex items-center justify-between text-[10px] font-bold force-white">
                            <span className="force-white">Progresso</span>
                            <span className="force-white">{mod.progressPercent}%</span>
                          </div>
                        </div>

                        {/* Botão Acessar Módulo */}
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAccessModule(mod);
                          }}
                          className={`btn-card-acessar w-full py-3.5 text-[10px] font-black uppercase tracking-widest text-center rounded-xl transition-all duration-200 cursor-pointer ${mod.is_locked ? "opacity-60 bg-zinc-800 text-zinc-400 border-zinc-700/30 cursor-not-allowed hover:bg-zinc-800" : ""}`}
                        >
                          {mod.is_locked ? "Em Breve" : "Acessar Módulo"}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* SEÇÃO DE ENCONTROS GRAVADOS (Lives Gravadas) */}
        <div className="space-y-8 pt-6 border-t border-outline/10">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div className="space-y-1.5">
              <h2 className="text-3xl font-display font-black text-on-surface tracking-tight flex items-center gap-2">
                <Tv className="text-primary w-8 h-8" />
                Mentoria e Lives Gravadas
              </h2>
              <p className="text-on-surface-variant text-sm font-medium">
                Reveja os encontros exclusivos com especialistas e acesse materiais de apoio.
              </p>
            </div>
          </div>

          {loadingLives ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="animate-spin text-primary" size={32} />
            </div>
          ) : recordedLives.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6">
              {recordedLives.map((live) => (
                <div
                  key={live.id}
                  onClick={() => setSelectedLiveReplay(live)}
                  className="bg-surface border border-outline/10 hover:border-emerald-500/30 rounded-[2.5rem] overflow-hidden flex flex-col p-5 cursor-pointer shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-[1.02] relative group"
                >
                  {/* Thumbnail */}
                  <div className="relative aspect-video rounded-[2rem] overflow-hidden bg-surface-variant shrink-0 mb-4">
                    <img
                      src={live.videoUrl}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                      alt={live.title}
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <div className="w-12 h-12 bg-primary text-white rounded-full flex items-center justify-center shadow-lg transform scale-90 group-hover:scale-100 transition-transform">
                        <Play size={20} className="fill-current ml-0.5" />
                      </div>
                    </div>
                    {/* Badge Categoria */}
                    <div className="absolute top-3 left-3">
                      <span className="px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest bg-black/60 text-white border border-white/10 backdrop-blur-md">
                        {live.category}
                      </span>
                    </div>
                    {/* Badge Duração */}
                    <div className="absolute bottom-3 right-3">
                      <span className="px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest bg-black/60 text-white border border-white/10 backdrop-blur-md">
                        {live.duration}
                      </span>
                    </div>
                  </div>

                  {/* Info */}
                  <div className="flex-1 flex flex-col justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-[10px] text-on-surface-variant font-bold">
                        <span className="text-secondary-fixed font-black uppercase tracking-wider">{live.host}</span>
                        <span className="flex items-center gap-1">
                          <Calendar size={10} />
                          {live.date}
                        </span>
                      </div>
                      <h3 className="text-sm font-headline font-black text-on-surface leading-snug line-clamp-2 group-hover:text-primary transition-colors">
                        {live.title}
                      </h3>
                      {live.description && (
                        <p className="text-xs text-on-surface-variant line-clamp-2 leading-relaxed font-medium">
                          {live.description}
                        </p>
                      )}
                    </div>

                    <div className="mt-4 pt-3 border-t border-outline/10 flex items-center justify-between">
                      <span className="text-[10px] font-black uppercase tracking-widest text-primary flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                        Assistir Mentoria
                        <Play size={10} className="fill-current" />
                      </span>
                      {live.materials && live.materials.length > 0 && (
                        <span className="px-2 py-0.5 bg-primary/10 text-primary text-[9px] font-black uppercase tracking-widest rounded-full border border-primary/20">
                          {live.materials.length} {live.materials.length === 1 ? "Material" : "Materiais"}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-surface border border-dashed border-outline/10 rounded-[2.5rem]">
              <p className="text-on-surface-variant text-sm font-semibold">Nenhuma mentoria gravada disponível no momento.</p>
            </div>
          )}
        </div>

        {/* DRAWER DETALHADO DO MÓDULO SELECIONADO (Estilo Netflix / Fluid) */}
        <AnimatePresence>
          {selectedModule && (
            <motion.div
              initial={{ opacity: 0, y: 20, height: 0 }}
              animate={{ opacity: 1, y: 0, height: "auto" }}
              exit={{ opacity: 0, y: 20, height: 0 }}
              transition={{ duration: 0.4, ease: "easeInOut" }}
              className="overflow-hidden w-full pt-4"
            >
              <div className="bg-surface border border-outline/10 rounded-[2.5rem] p-6 md:p-10 lg:p-12 relative shadow-2xl space-y-8">
                
                {/* Botão de Fechar */}
                <button 
                  onClick={() => setSelectedModule(null)}
                  className="absolute top-6 right-6 p-2 bg-surface-variant hover:bg-outline/20 border border-outline/10 text-on-surface rounded-xl transition-all cursor-pointer z-20"
                  title="Fechar"
                >
                  <X size={18} />
                </button>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 md:gap-12">
                  
                  {/* Lado Esquerdo: Info Geral do Módulo */}
                  <div className="lg:col-span-4 space-y-6">
                    <div className="relative aspect-[16/10] rounded-[2rem] overflow-hidden border border-outline/10 shadow-md">
                      <img src={selectedModule.cover} className="w-full h-full object-cover" alt="" />
                    </div>
                    
                    <div className="space-y-3">
                      <span className="text-[9px] font-black text-secondary-fixed uppercase tracking-wider">Metas do Módulo</span>
                      <h3 className="text-2xl font-headline font-black text-on-surface leading-tight">
                        {selectedModule.title}
                      </h3>
                      <p className="text-on-surface-variant text-sm leading-relaxed whitespace-pre-wrap">
                        {selectedModule.desc}
                      </p>
                    </div>

                    {/* Caixa de Progresso Individual */}
                    <div className="bg-surface-variant/40 border border-outline/10 p-5 rounded-3xl space-y-3 shadow-sm">
                      <h4 className="text-[9px] font-black text-on-surface-variant uppercase tracking-wider">Aproveitamento</h4>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-on-surface">{selectedModule.completedCount} de {selectedModule.lessons.length} aulas concluídas</span>
                        <span className="text-[10px] font-black text-emerald-500 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded-full">{selectedModule.progressPercent}%</span>
                      </div>
                      <div className="w-full h-1.5 bg-outline/10 rounded-full overflow-hidden">
                        <div className="h-full bg-emerald-500 rounded-full transition-all duration-500" style={{ width: `${selectedModule.progressPercent}%` }} />
                      </div>
                    </div>
                  </div>

                  {/* Lado Direito: Lista de Aulas e Anexos */}
                  <div className="lg:col-span-8 space-y-8">
                    
                    {/* Grade de Aulas */}
                    <div className="space-y-4">
                      <h4 className="text-lg font-headline font-black text-on-surface">Aulas Disponíveis</h4>
                      
                      <div className="space-y-3 max-h-[360px] overflow-y-auto pr-2 custom-scrollbar">
                        {selectedModule.lessons.map((lesson, i) => {
                          const isCompleted = completedLessons.includes(Number(lesson.id));
                          return (
                            <div 
                              key={lesson.id}
                              onClick={() => navigate(`/cursos/player/${course.id}?lessonId=${lesson.id}`)}
                              className="bg-surface-variant/20 hover:bg-surface-variant/60 border border-outline/10 hover:border-emerald-500/20 p-4 rounded-2xl flex items-center justify-between group cursor-pointer transition-all duration-200"
                            >
                              <div className="flex items-center gap-4 min-w-0">
                                {/* Indicador Visual */}
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border transition-colors ${
                                  isCompleted 
                                    ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" 
                                    : "bg-surface text-on-surface-variant border-outline/10 group-hover:bg-primary group-hover:text-white"
                                }`}>
                                  {isCompleted ? <CheckCircle size={16} /> : <Play size={16} className="ml-0.5" />}
                                </div>
                                
                                <div className="min-w-0">
                                  <h5 className="text-sm font-bold text-on-surface group-hover:text-primary transition-colors truncate">
                                    {i + 1}. {lesson.title}
                                  </h5>
                                  <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest flex items-center gap-1 mt-0.5">
                                    <Clock size={10} />
                                    {lesson.duration || "Duração variada"}
                                  </span>
                                </div>
                              </div>

                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigate(`/cursos/player/${course.id}?lessonId=${lesson.id}`);
                                }}
                                className="bg-surface hover:bg-primary text-on-surface-variant hover:text-white border border-outline/10 hover:border-primary px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-200 active:scale-95 cursor-pointer"
                              >
                                Assistir
                              </button>
                            </div>
                          );
                        })}
                        
                        {selectedModule.lessons.length === 0 && (
                          <div className="text-center py-12 bg-surface rounded-2xl border border-dashed border-outline/10">
                            <p className="text-on-surface-variant text-sm font-semibold">Nenhuma aula disponível neste módulo.</p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Lista de Materiais de Apoio do Módulo */}
                    <div className="space-y-4 pt-4 border-t border-outline/10">
                      <h4 className="text-lg font-headline font-black text-on-surface">Materiais Complementares</h4>
                      {loadingMaterials ? (
                        <div className="flex items-center justify-center py-6">
                          <Loader2 className="animate-spin text-zinc-500" size={24} />
                        </div>
                      ) : moduleMaterials.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {moduleMaterials.map((file) => (
                            <div 
                              key={file.id} 
                              className="bg-surface-variant/30 border border-outline/10 p-4 rounded-2xl flex items-center justify-between group hover:border-emerald-500/20 transition-all duration-200"
                            >
                              <div className="flex items-center gap-3 min-w-0">
                                <div className="w-9 h-9 bg-surface rounded-xl flex items-center justify-center text-on-surface shrink-0 group-hover:bg-primary group-hover:text-white transition-colors border border-outline/10">
                                  <Download size={15} />
                                </div>
                                <div className="min-w-0">
                                  <h5 className="text-xs font-bold text-on-surface truncate group-hover:text-primary transition-colors">{file.title}</h5>
                                  <span className="text-[9px] font-black text-on-surface-variant uppercase tracking-widest">{file.file_type || "ANEXO"}</span>
                                </div>
                              </div>
                              <a 
                                href={file.file_url} 
                                target="_blank" 
                                rel="noreferrer"
                                className="p-2 bg-surface hover:bg-outline/25 border border-outline/10 text-on-surface-variant hover:text-on-surface rounded-lg transition-all"
                                title="Download"
                              >
                                <Download size={13} />
                              </a>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="py-6 text-center bg-surface-variant/20 border border-dashed border-outline/10 rounded-2xl text-on-surface-variant text-xs font-bold">
                          Nenhum material complementar anexado a este módulo.
                        </div>
                      )}
                    </div>

                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* MODAL LIGHTBOX PARA REPLAY DE LIVES */}
        <AnimatePresence>
          {selectedLiveReplay && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/85 backdrop-blur-md z-[150] flex items-center justify-center p-4 md:p-6"
              onClick={() => setSelectedLiveReplay(null)}
            >
              <motion.div
                initial={{ scale: 0.95, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.95, y: 20 }}
                transition={{ type: "spring", duration: 0.5 }}
                className="max-w-4xl w-full bg-surface border border-outline/10 rounded-[2.5rem] overflow-hidden shadow-2xl relative flex flex-col max-h-[90vh]"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Botão de Fechar */}
                <button
                  onClick={() => setSelectedLiveReplay(null)}
                  className="absolute top-4 right-4 p-2.5 bg-black/50 hover:bg-black/80 text-white rounded-full transition-all cursor-pointer z-50 border border-white/10 hover:scale-105 active:scale-95"
                  title="Fechar"
                >
                  <X size={18} />
                </button>

                {/* Player de Vídeo */}
                <div className="w-full aspect-video bg-black relative shrink-0">
                  {selectedLiveReplay.replay_url ? (
                    <YouTubePlayer
                      url={selectedLiveReplay.replay_url}
                      title={selectedLiveReplay.title}
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-on-surface-variant gap-3">
                      <Tv size={48} className="text-primary animate-pulse" />
                      <p className="text-sm font-semibold">Replay de vídeo indisponível</p>
                    </div>
                  )}
                </div>

                {/* Conteúdo e Detalhes */}
                <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6 custom-scrollbar">
                  <div className="space-y-3">
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="px-3.5 py-1.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[9px] font-black uppercase tracking-widest rounded-full">
                        {selectedLiveReplay.category}
                      </span>
                      <span className="text-[10px] text-on-surface-variant font-bold flex items-center gap-1.5">
                        <Clock size={12} className="text-primary" />
                        {selectedLiveReplay.duration}
                      </span>
                      <span className="text-[10px] text-on-surface-variant font-bold flex items-center gap-1.5">
                        <Calendar size={12} className="text-primary" />
                        {selectedLiveReplay.date}
                      </span>
                    </div>

                    <h3 className="text-2xl font-headline font-black text-on-surface leading-tight">
                      {selectedLiveReplay.title}
                    </h3>

                    <div className="flex items-center gap-2 pt-1">
                      <span className="text-xs text-on-surface-variant font-semibold">Facilitador:</span>
                      <span className="text-xs text-primary font-black uppercase tracking-wider bg-primary/10 border border-primary/20 px-2.5 py-0.5 rounded-md">
                        {selectedLiveReplay.host}
                      </span>
                    </div>
                  </div>

                  {selectedLiveReplay.description && (
                    <div className="space-y-2 pt-4 border-t border-outline/10">
                      <h4 className="text-xs font-black text-on-surface-variant uppercase tracking-wider">Sobre esta mentoria</h4>
                      <p className="text-sm text-on-surface-variant leading-relaxed whitespace-pre-wrap font-medium">
                        {selectedLiveReplay.description}
                      </p>
                    </div>
                  )}

                  {/* Materiais Complementares */}
                  <div className="space-y-4 pt-4 border-t border-outline/10">
                    <h4 className="text-sm font-headline font-black text-on-surface">Materiais Complementares</h4>
                    {selectedLiveReplay.materials && selectedLiveReplay.materials.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {selectedLiveReplay.materials.map((file: any, index: number) => {
                          const fileUrl = file.url || file.file_url;
                          return (
                            <div
                              key={index}
                              className="bg-surface-variant/30 border border-outline/10 p-4 rounded-2xl flex items-center justify-between group hover:border-emerald-500/20 transition-all duration-200"
                            >
                              <div className="flex items-center gap-3 min-w-0">
                                <div className="w-9 h-9 bg-surface rounded-xl flex items-center justify-center text-on-surface shrink-0 group-hover:bg-primary group-hover:text-white transition-colors border border-outline/10">
                                  <FileText size={15} />
                                </div>
                                <div className="min-w-0">
                                  <h5 className="text-xs font-bold text-on-surface truncate group-hover:text-primary transition-colors font-medium">
                                    {file.title}
                                  </h5>
                                  <span className="text-[9px] font-black text-on-surface-variant uppercase tracking-widest">
                                    ANEXO
                                  </span>
                                </div>
                              </div>
                              {fileUrl && (
                                <a
                                  href={fileUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="p-2 bg-surface hover:bg-outline/25 border border-outline/10 text-on-surface-variant hover:text-on-surface rounded-lg transition-all"
                                  title="Download"
                                >
                                  <Download size={13} />
                                </a>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="py-6 text-center bg-surface-variant/20 border border-dashed border-outline/10 rounded-2xl text-on-surface-variant text-xs font-bold">
                        Nenhum material complementar anexado a esta mentoria.
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </Layout>
  );
}
