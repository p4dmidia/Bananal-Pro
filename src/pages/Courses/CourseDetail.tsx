import React, { useEffect, useState } from "react";
import Layout from "../../components/Layout/Layout";
import { motion } from "motion/react";
import { 
  Play, 
  Star, 
  Users, 
  Clock, 
  BookOpen, 
  Award, 
  CheckCircle, 
  ArrowRight,
  ShieldCheck,
  Zap,
  Loader2,
  AlertCircle
} from "lucide-react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import { Tables } from "../../types/database";

type Course = Tables<'courses'> & {
  instructor?: { full_name: string } | null;
};

type Lesson = Tables<'lessons'>;

export default function CourseDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [course, setCourse] = useState<Course | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="w-10 h-10 text-primary animate-spin" />
        </div>
      </Layout>
    );
  }

  if (error || !course) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
          <AlertCircle className="w-12 h-12 text-red-500" />
          <p className="text-white font-bold">{error || "Curso não encontrado."}</p>
          <button onClick={() => navigate('/cursos')} className="text-primary hover:underline">Voltar ao catálogo</button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto space-y-12">
        {/* Hero Section */}
        <div className="relative h-[400px] rounded-[3rem] overflow-hidden border border-white/5">
          <img src={course.thumbnail_url || "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&q=80&w=800"} className="w-full h-full object-cover opacity-30" alt="" />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
          
          <div className="absolute inset-0 p-12 flex flex-col justify-end space-y-6">
            <div className="flex gap-3">
              <span className="bg-primary/20 text-primary px-4 py-1 rounded-full text-xs font-black uppercase tracking-widest border border-primary/20">
                {course.category}
              </span>
              <span className="bg-white/10 text-white px-4 py-1 rounded-full text-xs font-black uppercase tracking-widest border border-white/10 flex items-center gap-1 text-white">
                <Star size={12} className="text-yellow-500 fill-current" /> 5.0 (Acesso Premium)
              </span>
            </div>
            
            <h1 className="text-5xl md:text-6xl font-display font-bold text-white max-w-3xl leading-tight">
              {course.title}
            </h1>
            
            <div className="flex items-center gap-8 text-slate-300">
              <div className="flex items-center gap-2">
                <Users size={20} className="text-primary" />
                <span className="font-bold">Acesso Vitalício</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock size={20} className="text-primary" />
                <span className="font-bold">{lessons.length} aulas</span>
              </div>
              <div className="flex items-center gap-2">
                <Award size={20} className="text-primary" />
                <span className="font-bold">Certificado Incluso</span>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-12">
            <section className="space-y-6">
              <h2 className="text-3xl font-display font-bold text-white">Descrição</h2>
              <p className="text-slate-400 leading-relaxed text-lg">
                {course.description}
              </p>
            </section>

            <section className="space-y-6">
              <h2 className="text-3xl font-display font-bold text-white">Conteúdo do Curso</h2>
              <div className="space-y-4">
                {lessons.length > 0 ? (
                  lessons.map((lesson, i) => (
                    <div key={lesson.id} className="bg-white/5 border border-white/10 p-6 rounded-[2rem] flex items-center justify-between hover:bg-white/[0.08] transition-all group cursor-pointer" onClick={() => navigate(`/cursos/player/${course.id}`)}>
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary font-bold">
                          {lesson.order_index || i + 1}
                        </div>
                        <div>
                          <h4 className="font-bold text-white group-hover:text-primary transition-colors">{lesson.title}</h4>
                          <p className="text-xs text-slate-500">{lesson.duration || "Duração variada"}</p>
                        </div>
                      </div>
                      <ArrowRight className="text-slate-600 group-hover:text-primary transition-colors" size={20} />
                    </div>
                  ))
                ) : (
                  <div className="p-8 text-center text-slate-500 bg-white/5 rounded-2xl">
                    Nenhuma aula cadastrada ainda.
                  </div>
                )}
              </div>
            </section>

            <section className="bg-gradient-to-br from-primary/10 to-accent/10 border border-white/5 p-8 rounded-[3rem] flex items-center gap-8">
              <div className="w-24 h-24 rounded-full border-4 border-primary overflow-hidden shrink-0 bg-white/5">
                <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${course.instructor?.full_name || 'instructor'}`} alt="" />
              </div>
              <div className="space-y-2">
                <h3 className="text-2xl font-bold text-white">Sobre o Instrutor: {course.instructor?.full_name || 'Produtor'}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">
                  Referência no ecossistema Bananal PRO. Especialista em {course.category || 'bananicultura'} pronto para compartilhar conhecimentos práticos e aplicados ao campo.
                </p>
              </div>
            </section>
          </div>

          {/* Access/Sticky Card */}
          <div className="space-y-6">
            <div className="sticky top-12 glass-card p-8 rounded-[3rem] border-primary/30 bg-primary/5 shadow-2xl shadow-primary/10 space-y-8">
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-primary font-black uppercase tracking-widest text-xs">
                  <Zap size={14} fill="currentColor" /> Treinamento Disponível
                </div>
                <h3 className="text-3xl font-display font-bold text-white leading-tight">
                  Acesso Liberado para Produtores
                </h3>
                <p className="text-slate-400 text-sm">
                  Este conteúdo faz parte da formação oficial do **Bananal PRO**.
                </p>
                <div className="bg-primary/10 p-4 rounded-2xl border border-primary/20">
                  <p className="text-white text-xs font-medium">
                    Obtenha <span className="text-primary font-black">certificado oficial</span> ao concluir todos os módulos.
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <button 
                  onClick={() => navigate(`/cursos/player/${course.id}`)}
                  className="w-full bg-primary hover:bg-primary-dark text-white font-black py-6 rounded-2xl shadow-xl shadow-primary/30 transition-all hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-3"
                >
                  Iniciar Treinamento
                  <ArrowRight size={20} />
                </button>
              </div>

              <div className="space-y-4 pt-8 border-t border-white/5">
                {[
                  { icon: <ShieldCheck size={18} />, label: "Acesso vitalício" },
                  { icon: <Play size={18} />, label: "Assista onde quiser" },
                  { icon: <BookOpen size={18} />, label: "Materiais de apoio inclusos" },
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-3 text-slate-300 text-sm font-medium">
                    <div className="text-primary">{item.icon}</div>
                    {item.label}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
