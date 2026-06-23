import React, { useEffect, useState } from "react";
import AdminLayout from "../../components/Layout/AdminLayout";
import { motion } from "motion/react";
import { 
  MessageSquare, 
  Loader2,
  Trash2,
  CheckCircle,
  User,
  BookOpen,
  RefreshCcw,
  ShieldAlert,
  Calendar
} from "lucide-react";
import { supabase as supabaseClient } from "../../lib/supabase";
const supabase = supabaseClient as any;
import { useAuth } from "../../contexts/AuthContext";
import { toast } from "sonner";

export default function AdminModeration() {
  const { user } = useAuth();
  const [comments, setComments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const fetchComments = async () => {
    if (!user) return;
    setLoading(true);
    
    try {
      // Busca apenas comentários de aulas/cursos pendentes
      const { data, error } = await supabase
        .from('lesson_comments')
        .select(`
          id,
          content,
          created_at,
          is_approved,
          user_profiles (full_name),
          lessons (title)
        `)
        .eq('is_approved', false);

      if (error) throw error;

      const formatted = (data || []).map((c: any) => ({
        id: c.id,
        type: 'lesson',
        content: c.content,
        created_at: c.created_at,
        is_approved: c.is_approved,
        user_name: c.user_profiles?.full_name || 'Usuário',
        context_title: c.lessons?.title || 'Aula'
      }));

      // Ordena por mais recente
      const sorted = formatted.sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );

      setComments(sorted);
    } catch (err: any) {
      console.error('Fetch Error:', err);
      toast.error("Erro ao carregar comentários para moderação: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (id: string, action: 'approve_comment' | 'delete_comment', type: 'lesson') => {
    const confirmMsg = action === 'delete_comment' ? "Excluir comentário?" : null;
    if (confirmMsg && !confirm(confirmMsg)) return;

    setLoading(true);
    try {
      const table = 'lesson_comments';

      if (action === 'approve_comment') {
        const { error } = await supabase
          .from(table)
          .update({ is_approved: true })
          .eq('id', Number(id));
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from(table)
          .delete()
          .eq('id', Number(id));
        if (error) throw error;
      }

      toast.success(action === 'approve_comment' ? "Aprovado com sucesso!" : "Excluído com sucesso!");
      await fetchComments();
    } catch (err: any) {
      toast.error("Erro ao processar ação: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) fetchComments();
  }, [user]);

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <div>
             <h1 className="text-3xl font-bold text-on-surface flex items-center gap-3">
               <ShieldAlert className="text-primary" />
               Moderação de Comentários
             </h1>
             <p className="text-on-surface-variant text-sm mt-1">Modere as interações dos alunos nas aulas do Bananal PRO.</p>
          </div>
          <button 
            onClick={fetchComments}
            className="p-3 bg-white border border-outline/10 rounded-2xl text-on-surface-variant hover:text-on-surface transition-all shadow-sm cursor-pointer"
          >
            <RefreshCcw size={20} className={loading ? "animate-spin" : ""} />
          </button>
        </div>

        {/* Date Filter Bar */}
        <div className="bg-white border border-outline/10 p-6 rounded-3xl flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 flex-1">
            <div className="flex flex-col gap-1.5 flex-1 max-w-xs">
              <label className="text-[10px] font-black text-on-surface-variant/60 uppercase tracking-widest ml-1">Data Inicial</label>
              <div className="relative group">
                <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant/60 group-focus-within:text-primary transition-colors" />
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full bg-white border border-outline/15 rounded-2xl py-3 pl-12 pr-4 text-xs text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 transition-all cursor-pointer [color-scheme:light]"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5 flex-1 max-w-xs">
              <label className="text-[10px] font-black text-on-surface-variant/60 uppercase tracking-widest ml-1">Data Final</label>
              <div className="relative group">
                <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant/60 group-focus-within:text-primary transition-colors" />
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full bg-white border border-outline/15 rounded-2xl py-3 pl-12 pr-4 text-xs text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 transition-all cursor-pointer [color-scheme:light]"
                />
              </div>
            </div>
          </div>

          {(startDate || endDate) && (
            <button
              onClick={() => {
                setStartDate("");
                setEndDate("");
              }}
              className="px-5 py-3 bg-surface hover:bg-on-surface/5 text-on-surface-variant hover:text-on-surface border border-outline/10 rounded-2xl text-xs font-bold transition-all self-end md:self-auto cursor-pointer"
            >
              Limpar Filtros
            </button>
          )}
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <Loader2 className="w-10 h-10 text-primary animate-spin" />
            <p className="text-on-surface-variant font-bold animate-pulse">Sincronizando com o Servidor...</p>
          </div>
        ) : (
          <div className="grid gap-6">
            {(() => {
              const filteredComments = comments.filter((comment) => {
                if (!comment.created_at) return true;
                const commentDate = new Date(comment.created_at);
                
                if (startDate) {
                  const start = new Date(startDate + "T00:00:00");
                  if (commentDate < start) return false;
                }
                
                if (endDate) {
                  const end = new Date(endDate + "T23:59:59");
                  if (commentDate > end) return false;
                }
                
                return true;
              });

              return filteredComments.length > 0 ? (
                filteredComments.map((comment) => (
                  <motion.div
                    key={`${comment.type}-${comment.id}`}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="bg-white border border-outline/10 p-8 rounded-[2.5rem] flex flex-col md:flex-row justify-between items-start md:items-center group hover:border-primary/20 transition-all shadow-sm"
                  >
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-3 mb-4">
                         <span className="flex items-center gap-2 bg-primary/10 text-primary px-3 py-1 rounded-full text-[10px] font-black uppercase border border-primary/20">
                            <User size={12} /> {comment.user_name}
                         </span>
                         
                         <span className="flex items-center gap-2 bg-blue-500/10 text-blue-500 px-3 py-1 rounded-full text-[10px] font-black uppercase border border-blue-500/20">
                            <BookOpen size={12} /> Curso: {comment.context_title}
                         </span>

                         <span className="flex items-center gap-2 bg-yellow-500/10 text-yellow-600 px-3 py-1 rounded-full text-[10px] font-black uppercase border border-yellow-500/20 animate-pulse">
                            <RefreshCcw size={12} /> Pendente
                         </span>
                      </div>
                      <p className="text-on-surface text-lg leading-relaxed font-medium">"{comment.content}"</p>
                      <p className="text-[10px] text-on-surface-variant/60 font-bold mt-4 uppercase tracking-widest">
                        {new Date(comment.created_at).toLocaleString('pt-BR')}
                      </p>
                    </div>
                    
                    <div className="flex gap-3 mt-6 md:mt-0">
                      <button 
                        onClick={() => handleAction(comment.id.toString(), 'approve_comment', comment.type)}
                        disabled={loading}
                        className="p-4 bg-surface text-on-surface-variant/70 hover:text-emerald-600 border border-outline/10 rounded-2xl transition-all hover:bg-on-surface/5 disabled:opacity-50 cursor-pointer"
                        title="Aprovar comentário"
                      >
                        <CheckCircle size={24} />
                      </button>
                      <button 
                        onClick={() => handleAction(comment.id.toString(), 'delete_comment', comment.type)}
                        disabled={loading}
                        className="p-4 bg-surface text-on-surface-variant/70 hover:text-red-500 border border-outline/10 rounded-2xl transition-all hover:bg-on-surface/5 disabled:opacity-50 cursor-pointer"
                        title="Excluir comentário"
                      >
                        <Trash2 size={24} />
                      </button>
                    </div>
                  </motion.div>
                ))
              ) : (
                <div className="py-24 text-center bg-white rounded-[4rem] border border-dashed border-outline/10">
                   <MessageSquare size={56} className="mx-auto text-on-surface-variant/30 mb-4" />
                   <p className="text-on-surface-variant/60 font-bold uppercase tracking-widest text-xs">
                     {comments.length > 0 
                       ? "Nenhum comentário encontrado no período selecionado." 
                       : "Nenhum comentário aguardando moderação."}
                   </p>
                </div>
              );
            })()}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
