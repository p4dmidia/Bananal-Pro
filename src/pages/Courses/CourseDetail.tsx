import React, { useEffect, useState } from "react";
import Layout from "../../components/Layout/Layout";
import AdminLayout from "../../components/Layout/AdminLayout";
import { useAuth } from "../../contexts/AuthContext";
import { 
  Play, 
  Star, 
  Users, 
  Clock, 
  BookOpen, 
  Award, 
  ArrowRight,
  ShieldCheck,
  Zap,
  Loader2,
  AlertCircle
} from "lucide-react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import { Tables } from "../../types/database";
import jeanImg from "../../assets/jean.png";

type Course = Tables<'courses'> & {
  instructor?: { full_name: string } | null;
};

type Lesson = Tables<'lessons'>;

export default function CourseDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { profile, loading: authLoading } = useAuth();
  
  const [course, setCourse] = useState<Course | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isAdminPath = location.pathname.startsWith('/admin');
  const LayoutComponent = isAdminPath ? AdminLayout : Layout;

  // Se o usuário for assinante comum e tentar entrar pela rota de detalhes,
  // redireciona para a página do player diretamente.
  useEffect(() => {
    if (!authLoading && !isAdminPath && (!profile || profile.role !== 'admin')) {
      navigate(`/cursos/player/${id}`, { replace: true });
    }
  }, [authLoading, profile, id, navigate, isAdminPath]);

  useEffect(() => {
    if (!id) return;

    const fetchCourseDetails = async () => {
      setLoading(true);
      try {
        // Fetch course
        const { data: courseData, error: courseError } = await supabase
          .from('courses')
          .select(`
            *,
            instructor:user_profiles (full_name)
          `)
          .eq('id', Number(id))
          .single();

        if (courseError) throw courseError;
        setCourse(courseData as any);

        // Fetch lessons
        const { data: lessonData, error: lessonError } = await supabase
          .from('lessons')
          .select('*')
          .eq('course_id', Number(id))
          .order('order_index', { ascending: true });

        if (lessonError) throw lessonError;
        setLessons(lessonData);

      } catch (err: any) {
        console.error('Error fetching course:', err);
        setError("Não foi possível carregar os detalhes do curso.");
      } finally {
        setLoading(false);
      }
    };

    fetchCourseDetails();
  }, [id]);

  if (loading || authLoading) {
    return (
      <LayoutComponent>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="w-10 h-10 text-primary animate-spin" />
        </div>
      </LayoutComponent>
    );
  }

  if (error || !course) {
    return (
      <LayoutComponent>
        <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
          <AlertCircle className="w-12 h-12 text-red-500" />
          <p className="text-on-surface font-bold">{error || "Curso não encontrado."}</p>
          <button onClick={() => navigate(isAdminPath ? '/admin/cursos' : '/cursos')} className="text-primary hover:underline">
            Voltar ao catálogo
          </button>
        </div>
      </LayoutComponent>
    );
  }

  return (
    <LayoutComponent>
      <div className="max-w-7xl mx-auto space-y-12">
        {/* Hero Section - Taller image with white text directly on the image and a soft bottom gradient */}
        <div className="relative h-[500px] rounded-[3.5rem] overflow-hidden border border-outline/10 shadow-lg bg-[#020c08]">
          <style>{`
            body:not(.dark-theme) .hero-text-force-white {
              color: #ffffff !important;
            }
            body:not(.dark-theme) .hero-text-force-white-mute {
              color: rgba(255, 255, 255, 0.8) !important;
            }
          `}</style>

          {/* Background Image: full opacity and vivid contrast */}
          <img 
            src={course.thumbnail_url || "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&q=80&w=800"} 
            className="w-full h-full object-cover opacity-90 brightness-[0.85]" 
            alt="Capa do Treinamento" 
          />
          
          {/* Soft Bottom-to-Top Dark Gradient Mask: provides perfect legibility without being a hard gray block */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-transparent pointer-events-none" />
          
          {/* Content overlayed directly on the image */}
          <div className="absolute bottom-12 left-12 right-12 z-10 max-w-4xl space-y-6">
            <div className="flex flex-wrap gap-3">
              <span className="bg-primary/80 backdrop-blur-md text-white hero-text-force-white px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest border border-white/10">
                {course.category}
              </span>
              <span className="bg-black/45 backdrop-blur-md text-white hero-text-force-white px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest flex items-center gap-1.5 border border-white/10 shadow-md">
                <Star size={12} className="text-yellow-500 fill-current" /> 5.0 (Acesso Premium)
              </span>
            </div>
            
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-display font-black text-white hero-text-force-white leading-tight drop-shadow-md">
              {course.title}
            </h1>
            
            <div className="flex flex-wrap items-center gap-x-8 gap-y-3 text-white/90 hero-text-force-white-mute text-sm font-semibold pt-4 border-t border-white/10 drop-shadow-sm">
              <div className="flex items-center gap-2">
                <Users size={18} className="text-emerald-400" />
                <span>Acesso Vitalício</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock size={18} className="text-emerald-400" />
                <span>{lessons.length} aulas</span>
              </div>
              <div className="flex items-center gap-2">
                <Award size={18} className="text-emerald-400" />
                <span>Certificado Incluso</span>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-12">
            <section className="space-y-6">
              <h2 className="text-3xl font-display font-bold text-on-surface">Descrição</h2>
              <p className="text-on-surface-variant leading-relaxed text-lg font-medium">
                {course.description}
              </p>
            </section>

            <section className="space-y-6">
              <h2 className="text-3xl font-display font-bold text-on-surface">Conteúdo do Curso</h2>
              <div className="space-y-4">
                {lessons.length > 0 ? (
                  lessons.map((lesson, i) => (
                    <div 
                      key={lesson.id} 
                      className="bg-white border border-outline/10 p-6 rounded-[2rem] flex items-center justify-between hover:bg-slate-50 transition-all group cursor-pointer shadow-sm" 
                      onClick={() => navigate(isAdminPath ? `/admin/cursos` : `/cursos/player/${course.id}`)}
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary font-bold">
                          {lesson.order_index || i + 1}
                        </div>
                        <div>
                          <h4 className="font-bold text-on-surface group-hover:text-primary transition-colors">{lesson.title}</h4>
                          <p className="text-xs text-on-surface-variant/60">{lesson.duration || "Duração variada"}</p>
                        </div>
                      </div>
                      <ArrowRight className="text-on-surface-variant/60 group-hover:text-primary transition-colors" size={20} />
                    </div>
                  ))
                ) : (
                  <div className="p-8 text-center text-on-surface-variant bg-white rounded-[2rem] border border-outline/10 shadow-sm">
                    Nenhuma aula cadastrada ainda.
                  </div>
                )}
              </div>
            </section>

            <section className="bg-white border border-outline/10 p-8 rounded-[3rem] flex flex-col md:flex-row items-center gap-8 shadow-sm">
              <div className="w-28 h-28 rounded-full border-4 border-primary/15 overflow-hidden shrink-0 bg-primary/5 shadow-md">
                <img src={jeanImg} alt="Jean Carlos" className="w-full h-full object-cover" />
              </div>
              <div className="space-y-4">
                <div className="space-y-2">
                  <h3 className="text-2xl font-black text-on-surface">Jean Carlos</h3>
                  <span className="inline-block bg-primary/10 text-primary px-3.5 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest">
                    Produtor Rural e Especialista em Bananicultura
                  </span>
                </div>
                <p className="text-on-surface-variant text-sm leading-relaxed font-medium">
                  Com anos de experiência prática no campo, Jean Carlos desenvolveu métodos e estratégias que ajudam produtores a aumentar a produtividade, melhorar a qualidade da produção e alcançar melhores resultados na bananicultura. No Bananal PRO, ele compartilha conhecimento real, aplicado diariamente em propriedades rurais e validado pela experiência prática.
                </p>
              </div>
            </section>
          </div>

          {/* Access/Sticky Card */}
          <div className="space-y-6">
            <div className="sticky top-12 bg-white border border-outline/10 p-8 rounded-[3rem] shadow-xl shadow-black/[0.02] space-y-8">
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-primary font-black uppercase tracking-widest text-xs">
                  <Zap size={14} fill="currentColor" /> Treinamento Disponível
                </div>
                <h3 className="text-3xl font-display font-bold text-on-surface leading-tight">
                  Acesso Liberado para Produtores
                </h3>
                <p className="text-on-surface-variant text-sm">
                  Este conteúdo faz parte da formação oficial do **Bananal PRO**.
                </p>
                <div className="bg-primary/5 p-4 rounded-2xl border border-primary/10">
                  <p className="text-on-surface text-xs font-medium">
                    Obtenha <span className="text-primary font-black">certificado oficial</span> ao concluir todos os módulos.
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <button 
                  onClick={() => navigate(isAdminPath ? `/admin/cursos` : `/cursos/player/${course.id}`)}
                  className="w-full bg-primary hover:bg-emerald-800 text-white font-black py-6 rounded-2xl shadow-xl shadow-primary/30 transition-all hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-3 cursor-pointer"
                >
                  Iniciar Treinamento
                  <ArrowRight size={20} />
                </button>
              </div>

              <div className="space-y-4 pt-8 border-t border-outline/10">
                {[
                  { icon: <ShieldCheck size={18} />, label: "Acesso vitalício" },
                  { icon: <Play size={18} />, label: "Assista onde quiser" },
                  { icon: <BookOpen size={18} />, label: "Materiais de apoio inclusos" },
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-3 text-on-surface-variant text-sm font-medium">
                    <div className="text-primary">{item.icon}</div>
                    {item.label}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </LayoutComponent>
  );
}
