import React, { useEffect, useState } from "react";
import Layout from "../../components/Layout/Layout";
import { motion, AnimatePresence } from "motion/react";
import { 
  Search, 
  Play, 
  Star, 
  ChevronRight, 
  Loader2,
  Info,
  Flame,
  Sparkles,
  Zap,
  TrendingUp,
  Bookmark
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import { Tables } from "../../types/database";

type Course = Tables<'courses'> & {
  instructor?: { full_name: string } | null;
};

export default function Catalog() {
  const navigate = useNavigate();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Todos");

  useEffect(() => {
    const fetchCourses = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('courses')
          .select(`
            *,
            instructor:user_profiles (full_name)
          `)
          .eq('is_active', true)
          .order('created_at', { ascending: false });

        if (error) throw error;
        setCourses(data as any);
      } catch (err) {
        console.error('Error fetching courses:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchCourses();
  }, []);

  const categories = ["Todos", ...new Set(courses.map(c => c.category).filter(Boolean))] as string[];
  
  const filteredCourses = courses.filter(course => {
    const matchesSearch = course.title?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "Todos" || course.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const featuredCourse = courses[0]; // O mais recente como destaque
  const trendingCourses = [...courses].sort((a, b) => (b.points || 0) - (a.points || 0)).slice(0, 4);
  const recentCourses = courses.slice(0, 6); // Mostrar os 6 mais novos na seção de recentes

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[80vh]">
          <Loader2 className="w-12 h-12 text-primary animate-spin" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-16 pb-20">
        {/* HERO FEATURED SECTION (Estilo Netflix) */}
        <AnimatePresence>
          {featuredCourse && selectedCategory === "Todos" && !searchQuery && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="relative h-[600px] w-full rounded-[3.5rem] overflow-hidden group border border-white/5 shadow-2xl"
            >
              {/* Background Image with Overlay */}
              <div className="absolute inset-0">
                <img 
                  src={featuredCourse.thumbnail_url || "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=1600"} 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-[2s]"
                  alt=""
                />
                <div className="absolute inset-0 bg-gradient-to-r from-black via-black/60 to-transparent" />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />
              </div>

              {/* Content */}
              <div className="absolute inset-0 p-12 md:p-20 flex flex-col justify-center max-w-4xl space-y-8">
                <div className="flex items-center gap-3">
                   <div className="px-3 py-1 bg-primary rounded-lg text-[10px] font-black text-white uppercase tracking-widest">
                      Destaque do Mês
                   </div>
                   <div className="flex items-center gap-1 text-yellow-500">
                      <Star size={14} fill="currentColor" />
                      <span className="text-xs font-black uppercase">Elite</span>
                   </div>
                </div>

                <h1 className="text-5xl md:text-7xl font-black text-white tracking-tighter leading-tight">
                  {featuredCourse.title}
                </h1>

                <p className="text-zinc-300 text-lg md:text-xl line-clamp-3 max-w-2xl font-medium">
                  {featuredCourse.description}
                </p>

                <div className="flex flex-wrap items-center gap-4">
                   <button 
                    onClick={() => navigate(`/cursos/player/${featuredCourse.id}`)}
                    className="bg-white text-black px-10 py-5 rounded-2xl font-black text-sm uppercase tracking-widest flex items-center gap-3 hover:bg-zinc-200 transition-all active:scale-95 shadow-xl shadow-white/5"
                   >
                     <Play size={20} fill="currentColor" />
                     Assistir Agora
                   </button>
                   <button 
                    onClick={() => navigate(`/cursos/detalhes/${featuredCourse.id}`)}
                    className="bg-white/10 backdrop-blur-md text-white px-8 py-5 rounded-2xl font-black text-sm uppercase tracking-widest flex items-center gap-3 hover:bg-white/20 transition-all border border-white/10"
                   >
                     <Info size={20} />
                     Mais Detalhes
                   </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* TOOLBAR & SEARCH */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-8">
           <div className="flex items-center gap-4 overflow-x-auto no-scrollbar w-full md:w-auto">
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-8 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all border ${selectedCategory === cat ? "bg-primary border-primary text-white shadow-lg shadow-primary/20" : "bg-white/5 border-white/5 text-zinc-500 hover:text-white"}`}
                >
                  {cat}
                </button>
              ))}
           </div>

           <div className="relative group w-full md:w-96">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-primary transition-colors" size={20} />
              <input 
                type="text" 
                placeholder="O que você quer aprender?"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-zinc-900/50 border border-white/5 rounded-[1.5rem] pl-14 pr-6 py-4 text-white focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all font-bold placeholder:text-zinc-700"
              />
           </div>
        </div>

        {/* CONTENT ROWS */}
        <div className="space-y-20">
          {/* Row 1: Tendências / Filtrados */}
          <section className="space-y-8">
             <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                   <div className="p-3 bg-primary/10 rounded-2xl text-primary">
                      <TrendingUp size={24} />
                   </div>
                    <h2 className="text-3xl font-black text-white tracking-tighter">
                      {selectedCategory === "Todos" ? "Tendências no Bananal PRO" : selectedCategory}
                    </h2>
                </div>
                <button 
                  onClick={() => setSelectedCategory("Todos")}
                  className="text-zinc-500 hover:text-white text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-colors"
                >
                   Ver Todos <ChevronRight size={14} />
                </button>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                {(selectedCategory === "Todos" ? trendingCourses : filteredCourses).map((course, idx) => (
                  <motion.div 
                    key={course.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    onClick={() => navigate(`/cursos/player/${course.id}`)}
                    className="relative aspect-[16/9] rounded-[2.5rem] overflow-hidden group cursor-pointer border border-white/5 shadow-xl transition-all hover:scale-[1.03] hover:shadow-primary/10"
                  >
                    <img 
                      src={course.thumbnail_url || "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800"} 
                      className="w-full h-full object-cover group-hover:brightness-50 transition-all duration-500"
                      alt={course.title || ""}
                    />
                    
                    {/* Hover Info */}
                    <div className="absolute inset-0 p-8 flex flex-col justify-end opacity-0 group-hover:opacity-100 transition-all duration-500 bg-gradient-to-t from-black via-black/20 to-transparent">
                       <div className="flex items-center gap-2 mb-2">
                          <div className="bg-primary p-2 rounded-full">
                             <Play size={14} fill="currentColor" className="text-white" />
                          </div>
                          <div className="flex items-center gap-1 text-[10px] font-black text-white uppercase tracking-widest">
                             <Sparkles size={10} className="text-yellow-500" />
                             {course.points} Pontos
                          </div>
                       </div>
                       <h3 className="text-xl font-black text-white tracking-tight leading-tight line-clamp-2">
                         {course.title}
                       </h3>
                       <div className="mt-4 flex items-center gap-3">
                          <button className="bg-white/10 hover:bg-white text-white hover:text-black p-2.5 rounded-xl transition-all border border-white/10">
                             <Bookmark size={16} />
                          </button>
                          <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">{course.category}</span>
                       </div>
                    </div>
                  </motion.div>
                ))}
             </div>

             {filteredCourses.length === 0 && (
               <div className="py-20 text-center bg-zinc-900/20 rounded-[3rem] border border-dashed border-white/5">
                  <p className="text-zinc-600 font-bold">Nenhum curso encontrado com esses critérios.</p>
               </div>
             )}
          </section>

          {/* Row 2: Promo Banner */}
          <section className="relative h-80 w-full rounded-[3.5rem] overflow-hidden group shadow-2xl">
             <div className="absolute inset-0 bg-gradient-to-r from-primary via-primary/80 to-zinc-950" />
             <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]" />
             
             <div className="absolute inset-0 p-12 flex flex-col md:flex-row items-center justify-between gap-10">
                <div className="space-y-4 max-w-xl text-center md:text-left">
                   <div className="flex items-center justify-center md:justify-start gap-2">
                      <Flame size={20} className="text-orange-500" />
                      <span className="text-[10px] font-black text-white uppercase tracking-[0.3em]">Treinamento Técnico</span>
                   </div>
                   <h2 className="text-4xl font-black text-white tracking-tighter">Torne-se um Especialista</h2>
                   <p className="text-white/70 font-medium">Complete os módulos de capacitação agronômica e receba seu certificado oficial emitido pelo Bananal PRO.</p>
                </div>
                 <button 
                  onClick={() => navigate('/cursos')}
                  className="bg-white text-primary px-10 py-5 rounded-2xl font-black text-xs uppercase tracking-widest hover:scale-105 transition-all shadow-2xl"
                 >
                    Ver Todos os Cursos
                 </button>
             </div>
          </section>

          {/* Row 3: Mais Categorias (Grid Alternativo) */}
          {selectedCategory === "Todos" && (
            <section className="space-y-8">
               <div className="flex items-center gap-3">
                  <div className="p-3 bg-blue-600/10 rounded-2xl text-blue-600">
                     <Zap size={24} />
                  </div>
                  <h2 className="text-3xl font-black text-white tracking-tighter">Recém Adicionados</h2>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  {recentCourses.slice(0, 3).map((course) => (
                    <div 
                      key={course.id}
                      onClick={() => navigate(`/cursos/player/${course.id}`)}
                      className="bg-zinc-900/40 border border-white/5 p-6 rounded-[2.5rem] group cursor-pointer hover:border-primary/30 transition-all"
                    >
                       <div className="aspect-video rounded-3xl overflow-hidden mb-6">
                          <img src={course.thumbnail_url || ""} className="w-full h-full object-cover group-hover:scale-110 transition-all duration-700" alt="" />
                       </div>
                       <div className="space-y-3">
                          <h4 className="text-lg font-bold text-white line-clamp-1">{course.title}</h4>
                          <p className="text-zinc-500 text-sm line-clamp-2">{course.description}</p>
                          <div className="pt-4 flex items-center justify-between border-t border-white/5">
                             <span className="text-[10px] font-black text-primary uppercase">{course.category}</span>
                             <div className="flex items-center gap-1 text-zinc-400">
                                <Star size={12} fill="currentColor" className="text-yellow-500" />
                                <span className="text-xs font-bold">5.0</span>
                             </div>
                          </div>
                       </div>
                    </div>
                  ))}
               </div>
            </section>
          )}
        </div>
      </div>
    </Layout>
  );
}
