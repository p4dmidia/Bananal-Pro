import React, { useState, useEffect } from "react";
import Layout from "../../components/Layout/Layout";
import { motion, AnimatePresence } from "motion/react";
import { 
  Users, 
  MessageSquare, 
  Heart, 
  Share2, 
  Send, 
  Image as ImageIcon, 
  Sprout, 
  HelpCircle, 
  Award, 
  BookOpen, 
  Filter,
  CheckCircle2,
  Lock,
  Loader2
} from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { toast } from "react-hot-toast";
import { supabase as supabaseClient } from "../../lib/supabase";
const supabase = supabaseClient as any;

interface Post {
  id: string;
  author: {
    name: string;
    role: string;
    reputation: "Bronze" | "Prata" | "Ouro" | "Especialista";
    avatarSeed: string;
  };
  category: "Geral" | "Manejo" | "Solo & Nutrição" | "Pragas & Doenças";
  content: string;
  image?: string;
  likes: number;
  commentsCount: number;
  timeAgo: string;
  isLikedByUser?: boolean;
  isQuestionToAgronomist?: boolean;
  agronomistAnswer?: string;
}


interface FeaturedMember {
  name: string;
  rep: "Bronze" | "Prata" | "Ouro" | "Especialista";
  desc: string;
  seed: string;
}

interface Comment {
  id: string;
  content: string;
  timeAgo: string;
  author: {
    name: string;
    role: string;
    avatarSeed: string;
  };
}

export default function SocialFeed() {
  const { profile } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [newPostContent, setNewPostContent] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("Todos");
  const [postCategory, setPostCategory] = useState<"Geral" | "Manejo" | "Solo & Nutrição" | "Pragas & Doenças">("Geral");
  const [isQuestion, setIsQuestion] = useState(false);

  // New States for Comments & Featured Members
  const [featuredMembers, setFeaturedMembers] = useState<FeaturedMember[]>([]);
  const [expandedPostId, setExpandedPostId] = useState<string | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [newCommentText, setNewCommentText] = useState("");

  const fetchPosts = async () => {
    try {
      const { data: postsData, error: postsError } = await supabase
        .from('community_posts')
        .select(`
          id,
          content,
          category,
          image_url,
          is_question_to_agronomist,
          agronomist_answer,
          created_at,
          user_id,
          comments_count,
          author:user_profiles!community_posts_user_id_fkey (
            id,
            full_name,
            role,
            city,
            state
          )
        `)
        .order('created_at', { ascending: false });

      if (postsError) throw postsError;

      const { data: likesData, error: likesError } = await supabase
        .from('community_post_likes')
        .select('post_id, user_id');

      const likesGroup = likesData || [];

      // Fetch featured members (top 3 user_profiles)
      const { data: membersData } = await supabase
        .from('user_profiles')
        .select('id, full_name, role, city, state')
        .limit(3);

      if (membersData && membersData.length > 0) {
        const mappedMembers: FeaturedMember[] = membersData.map((m: any) => {
          let rep: "Bronze" | "Prata" | "Ouro" | "Especialista" = "Bronze";
          let desc = `Produtor • ${m.city || "Brasil"}`;
          if (m.role === 'admin') {
            rep = "Especialista";
            desc = "Agrônomo Chefe";
          } else if (m.id % 3 === 0) {
            rep = "Ouro";
          } else if (m.id % 2 === 0) {
            rep = "Prata";
          }

          return {
            name: m.full_name || "Membro Bananal",
            rep,
            desc,
            seed: m.full_name || "user"
          };
        });
        setFeaturedMembers(mappedMembers);
      } else {
        setFeaturedMembers([
          { name: "Dr. Carlos Eduardo", rep: "Especialista", desc: "Agrônomo Chefe", seed: "carlos" },
          { name: "João Rodrigues", rep: "Ouro", desc: "Produtor • Sete Lagoas/MG", seed: "joao" }
        ]);
      }

      if (postsData && postsData.length > 0) {
        const mapped: Post[] = postsData.map((post: any) => {
          const postLikes = likesGroup.filter(l => l.post_id === post.id);
          const isLikedByUser = profile ? postLikes.some(l => l.user_id === profile.id) : false;

          const diffMs = Date.now() - new Date(post.created_at).getTime();
          const diffMin = Math.floor(diffMs / 60000);
          const diffHrs = Math.floor(diffMin / 60);
          const diffDays = Math.floor(diffHrs / 24);
          let timeAgo = "Agora mesmo";
          if (diffDays > 0) timeAgo = `${diffDays} d atrás`;
          else if (diffHrs > 0) timeAgo = `${diffHrs} h atrás`;
          else if (diffMin > 0) timeAgo = `${diffMin} m atrás`;

          let reputation: "Bronze" | "Prata" | "Ouro" | "Especialista" = "Bronze";
          if (post.author?.role === 'admin') reputation = "Especialista";
          else if (post.author?.id % 3 === 0) reputation = "Ouro";
          else if (post.author?.id % 2 === 0) reputation = "Prata";

          return {
            id: post.id,
            content: post.content,
            category: post.category as any,
            image: post.image_url || undefined,
            isQuestionToAgronomist: post.is_question_to_agronomist,
            agronomistAnswer: post.agronomist_answer || undefined,
            timeAgo,
            likes: postLikes.length,
            isLikedByUser,
            commentsCount: post.comments_count || 0,
            author: {
              name: post.author?.full_name || "Produtor Desconhecido",
              role: post.author?.role === 'admin' ? "Agrônomo Chefe" : `Produtor • ${post.author?.city || 'Brasil'}`,
              reputation,
              avatarSeed: post.author?.full_name || "user"
            }
          };
        });
        setPosts(mapped);
      } else {
        setPosts([]);
      }
    } catch (err) {
      console.warn("Erro ao buscar publicações do Supabase:", err);
      setPosts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, [profile]);

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPostContent.trim()) return;

    if (!profile) {
      toast.error("Você precisa estar logado para publicar.");
      return;
    }

    try {
      const { error } = await supabase
        .from('community_posts')
        .insert([{
          user_id: profile.id,
          content: newPostContent,
          category: postCategory,
          is_question_to_agronomist: isQuestion,
          agronomist_answer: isQuestion ? "Aguardando resposta do engenheiro agrônomo..." : null
        }]);

      if (error) throw error;

      setNewPostContent("");
      setIsQuestion(false);
      toast.success(isQuestion ? "Pergunta enviada ao agrônomo!" : "Publicação criada com sucesso!");
      await fetchPosts();
    } catch (err: any) {
      console.error('Error creating post:', err);
      toast.error("Erro ao criar publicação: " + err.message);
    }
  };

  const handleLike = async (postId: string) => {
    if (!profile) {
      toast.error("Você precisa estar logado para curtir.");
      return;
    }

    const post = posts.find(p => p.id === postId);
    if (!post) return;

    try {
      if (post.isLikedByUser) {
        const { error } = await supabase
          .from('community_post_likes')
          .delete()
          .eq('post_id', postId)
          .eq('user_id', profile.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('community_post_likes')
          .insert([{
            post_id: postId,
            user_id: profile.id
          }]);
        if (error) throw error;
      }
      await fetchPosts();
    } catch (err: any) {
      console.error('Error toggling like:', err);
      toast.error("Erro ao curtir publicação: " + err.message);
    }
  };

  const fetchComments = async (postId: string) => {
    setCommentsLoading(true);
    try {
      const { data, error } = await supabase
        .from('community_post_comments')
        .select(`
          id,
          content,
          created_at,
          user_id,
          author:user_profiles!community_post_comments_user_id_fkey (
            full_name,
            role,
            city
          )
        `)
        .eq('post_id', postId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      const mapped: Comment[] = (data || []).map((c: any) => {
        const diffMs = Date.now() - new Date(c.created_at).getTime();
        const diffMin = Math.floor(diffMs / 60000);
        const diffHrs = Math.floor(diffMin / 60);
        let timeAgo = "Agora mesmo";
        if (diffHrs > 0) timeAgo = `${diffHrs} h atrás`;
        else if (diffMin > 0) timeAgo = `${diffMin} m atrás`;

        return {
          id: c.id,
          content: c.content,
          timeAgo,
          author: {
            name: c.author?.full_name || "Membro",
            role: c.author?.role === 'admin' ? "Agrônomo" : "Produtor",
            avatarSeed: c.author?.full_name || "user"
          }
        };
      });

      setComments(mapped);
    } catch (err) {
      console.error('Error fetching comments:', err);
      toast.error("Erro ao carregar comentários.");
    } finally {
      setCommentsLoading(false);
    }
  };

  const handleToggleComments = async (postId: string) => {
    if (expandedPostId === postId) {
      setExpandedPostId(null);
      setComments([]);
    } else {
      setExpandedPostId(postId);
      setNewCommentText("");
      await fetchComments(postId);
    }
  };

  const handleAddComment = async (e: React.FormEvent, postId: string) => {
    e.preventDefault();
    if (!newCommentText.trim()) return;

    if (!profile) {
      toast.error("Você precisa estar logado para comentar.");
      return;
    }

    try {
      const { error } = await supabase
        .from('community_post_comments')
        .insert([{
          post_id: postId,
          user_id: profile.id,
          content: newCommentText
        }]);

      if (error) throw error;

      setNewCommentText("");
      toast.success("Comentário publicado!");
      await fetchComments(postId);
      await fetchPosts();
    } catch (err: any) {
      console.error('Error adding comment:', err);
      toast.error("Erro ao publicar comentário: " + err.message);
    }
  };

  const categories = ["Todos", "Geral", "Manejo", "Solo & Nutrição", "Pragas & Doenças"];

  const filteredPosts = selectedCategory === "Todos" 
    ? posts 
    : posts.filter(p => p.category === selectedCategory);

  const getReputationBadgeColor = (rep: string) => {
    switch (rep) {
      case "Especialista": return "bg-primary/20 text-primary border-primary/30";
      case "Ouro": return "bg-yellow-500/20 text-yellow-500 border-yellow-500/30";
      case "Prata": return "bg-zinc-400/20 text-zinc-300 border-zinc-400/30";
      default: return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
    }
  };

  return (
    <Layout>
      <div className="max-w-7xl mx-auto space-y-10 pb-20">
        
        {/* Header */}
        <div>
          <h1 className="text-4xl font-display font-bold text-white mb-2 flex items-center gap-3">
            <Users className="text-primary w-10 h-10" />
            Comunidade Bananal PRO
          </h1>
          <p className="text-slate-400 text-lg">
            Compartilhe experiências, tire dúvidas com agrônomos especializados e conecte-se com produtores de todo o país.
          </p>
        </div>

        {/* Filters */}
        <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-5 py-2.5 rounded-full text-xs font-bold transition-all border shrink-0 cursor-pointer ${
                selectedCategory === cat
                  ? "bg-primary border-primary text-white shadow-lg shadow-primary/20"
                  : "bg-zinc-950 border-white/5 text-zinc-500 hover:text-white hover:border-white/10"
              }`}
            >
              {cat === "Todos" ? "Todas as Discussões" : cat}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Feed Column */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Create Post Card */}
            <div className="glass-card p-6 rounded-[2rem] border-white/5 bg-zinc-900/40 space-y-4">
              <form onSubmit={handleCreatePost} className="space-y-4">
                <div className="flex gap-4">
                  <div className="w-10 h-10 rounded-full overflow-hidden bg-white/5 border border-primary/20 flex-shrink-0">
                    <img 
                      src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${profile?.full_name || "user"}`} 
                      alt="Avatar" 
                    />
                  </div>
                  <textarea
                    value={newPostContent}
                    onChange={(e) => setNewPostContent(e.target.value)}
                    placeholder="Compartilhe uma dúvida, manejo ou dica agrícola..."
                    className="flex-1 bg-black/30 border border-white/5 rounded-2xl p-4 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-primary/50 resize-none min-h-[100px]"
                  />
                </div>

                <div className="flex flex-wrap items-center justify-between gap-4 pt-2 border-t border-white/5">
                  <div className="flex gap-3 flex-wrap">
                    {/* Category Select */}
                    <select
                      value={postCategory}
                      onChange={(e) => setPostCategory(e.target.value as any)}
                      className="bg-black/40 border border-white/10 rounded-xl text-xs text-zinc-400 px-3 py-2 focus:outline-none cursor-pointer"
                    >
                      <option value="Geral">Categoria: Geral</option>
                      <option value="Manejo">Manejo</option>
                      <option value="Solo & Nutrição">Solo & Nutrição</option>
                      <option value="Pragas & Doenças">Pragas & Doenças</option>
                    </select>

                    {/* Ask Agronomist Checkbox */}
                    <button
                      type="button"
                      onClick={() => setIsQuestion(!isQuestion)}
                      className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border cursor-pointer ${
                        isQuestion 
                          ? "bg-amber-500/20 border-amber-500 text-amber-400 shadow-sm" 
                          : "bg-black/40 border-white/10 text-zinc-500 hover:text-white"
                      }`}
                    >
                      <HelpCircle size={14} />
                      Enviar ao Agrônomo
                    </button>
                  </div>

                  <button
                    type="submit"
                    disabled={!newPostContent.trim()}
                    className="bg-primary hover:bg-primary-dark text-white font-bold text-xs uppercase tracking-wider px-6 py-2.5 rounded-xl disabled:opacity-50 transition-colors cursor-pointer flex items-center gap-2"
                  >
                    Publicar
                    <Send size={12} />
                  </button>
                </div>
              </form>
            </div>

            {/* Post Feed List */}
            <div className="space-y-6">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-16 gap-3">
                  <Loader2 className="w-10 h-10 text-primary animate-spin" />
                  <p className="text-zinc-500 text-xs font-bold animate-pulse">Carregando feed...</p>
                </div>
              ) : filteredPosts.length > 0 ? (
                filteredPosts.map((post) => (
                  <motion.div
                    key={post.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`glass-card p-6 rounded-[2.5rem] border-white/5 bg-zinc-900/30 space-y-5 relative overflow-hidden ${
                      post.isQuestionToAgronomist ? "border-amber-500/20 bg-amber-500/[0.01]" : ""
                    }`}
                  >
                    {/* Post Header */}
                    <div className="flex justify-between items-start gap-4">
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-full overflow-hidden bg-white/5 border border-primary/20">
                          <img 
                            src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${post.author.avatarSeed}`} 
                            alt="Avatar" 
                          />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="font-bold text-white text-sm">{post.author.name}</h4>
                            <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded border ${getReputationBadgeColor(post.author.reputation)}`}>
                              {post.author.reputation}
                            </span>
                          </div>
                          <p className="text-[10px] text-zinc-500 font-semibold">{post.author.role}</p>
                        </div>
                      </div>
                      
                      <span className="text-[10px] text-zinc-600 font-bold bg-white/5 px-3 py-1 rounded-full border border-white/5">
                        {post.category}
                      </span>
                    </div>

                    {/* Post Content */}
                    <p className="text-zinc-300 text-sm leading-relaxed whitespace-pre-line">
                      {post.content}
                    </p>

                    {/* Q&A Section */}
                    {post.isQuestionToAgronomist && post.agronomistAnswer && (
                      <div className="bg-amber-500/[0.03] border border-amber-500/10 p-5 rounded-2xl space-y-3 mt-4 relative">
                        <div className="flex items-center gap-2 text-amber-400 font-bold text-xs">
                          <Sprout size={14} />
                          Resposta do Agrônomo Bananal PRO
                        </div>
                        <p className="text-zinc-400 text-xs leading-relaxed">
                          {post.agronomistAnswer}
                        </p>
                      </div>
                    )}

                    {/* Post Actions */}
                    <div className="flex gap-6 border-t border-white/5 pt-4">
                      <button
                        onClick={() => handleLike(post.id)}
                        className={`flex items-center gap-2 text-xs font-bold transition-colors cursor-pointer ${
                          post.isLikedByUser ? "text-red-500" : "text-zinc-500 hover:text-white"
                        }`}
                      >
                        <Heart size={16} fill={post.isLikedByUser ? "currentColor" : "none"} />
                        <span>{post.likes}</span>
                      </button>

                      <button 
                        onClick={() => handleToggleComments(post.id)}
                        className={`flex items-center gap-2 text-xs font-bold transition-colors cursor-pointer ${
                          expandedPostId === post.id ? "text-primary" : "text-zinc-500 hover:text-white"
                        }`}
                      >
                        <MessageSquare size={16} />
                        <span>{post.commentsCount} Comentários</span>
                      </button>

                      <span className="text-[10px] text-zinc-600 ml-auto font-medium self-center">
                        {post.timeAgo}
                      </span>
                    </div>

                    {/* Comments Section */}
                    {expandedPostId === post.id && (
                      <div className="mt-4 pt-4 border-t border-white/5 space-y-4">
                        <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Comentários</p>
                        
                        {commentsLoading ? (
                          <div className="flex items-center justify-center py-4">
                            <Loader2 className="w-6 h-6 text-primary animate-spin" />
                          </div>
                        ) : (
                          <div className="space-y-3 max-h-60 overflow-y-auto no-scrollbar pr-2">
                            {comments.length > 0 ? (
                              comments.map((comment) => (
                                <div key={comment.id} className="flex gap-2 items-start text-xs bg-white/[0.02] p-3 rounded-xl border border-white/5">
                                  <div className="w-6 h-6 rounded-full overflow-hidden bg-white/5 shrink-0">
                                    <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${comment.author.avatarSeed}`} alt="" />
                                  </div>
                                  <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                      <span className="font-bold text-white">{comment.author.name}</span>
                                      <span className="text-[8px] bg-white/10 px-1.5 py-0.5 rounded text-zinc-400 font-bold uppercase">{comment.author.role}</span>
                                      <span className="text-[8px] text-zinc-600">{comment.timeAgo}</span>
                                    </div>
                                    <p className="text-zinc-300">{comment.content}</p>
                                  </div>
                                </div>
                              ))
                            ) : (
                              <p className="text-xs text-zinc-600 italic">Nenhum comentário ainda. Seja o primeiro a comentar!</p>
                            )}
                          </div>
                        )}

                        {/* Add Comment Form */}
                        <form onSubmit={(e) => handleAddComment(e, post.id)} className="flex gap-2 mt-2">
                          <input
                            type="text"
                            placeholder="Escreva um comentário..."
                            value={newCommentText}
                            onChange={(e) => setNewCommentText(e.target.value)}
                            className="flex-1 bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-primary/50"
                          />
                          <button
                            type="submit"
                            disabled={!newCommentText.trim()}
                            className="bg-primary hover:bg-primary/95 text-white font-bold text-xs px-4 py-2 rounded-xl disabled:opacity-50 transition-all cursor-pointer flex items-center justify-center shrink-0"
                          >
                            Enviar
                          </button>
                        </form>
                      </div>
                    )}
                  </motion.div>
                ))
              ) : (
                <div className="py-20 text-center bg-zinc-900/10 rounded-[3rem] border border-dashed border-white/5">
                  <p className="text-zinc-500 font-bold text-xs uppercase tracking-widest">Nenhuma publicação nesta categoria.</p>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar Column */}
          <div className="space-y-8">
            
            {/* Ask the Agronomist Info */}
            <div className="glass-card p-6 rounded-[2.5rem] border-white/5 bg-zinc-900/40 space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-400">
                <HelpCircle size={24} />
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-bold text-white">Suporte Humano com Agrônomo</h3>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Como assinante Premium, você tem prioridade absoluta. Marque a opção **"Enviar ao Agrônomo"** ao criar um post para que nossa equipe técnica analise seu problema foliar, praga ou deficiência nutricional diretamente.
                </p>
              </div>
              
              <div className="p-4 bg-amber-500/5 border border-amber-500/10 rounded-2xl flex items-center gap-3">
                <CheckCircle2 className="text-amber-500 shrink-0" size={16} />
                <span className="text-[10px] text-amber-400 font-bold uppercase tracking-wider">Resposta em até 24h úteis</span>
              </div>
            </div>

            {/* Top Active Producers (Reputation) */}
            <div className="glass-card p-6 rounded-[2.5rem] border-white/5 bg-zinc-900/40 space-y-6">
              <div className="flex items-center gap-2.5">
                <Award className="text-primary w-5 h-5" />
                <h3 className="text-sm font-bold text-zinc-300 uppercase tracking-widest">Membros em Destaque</h3>
              </div>

              <div className="space-y-4">
                {featuredMembers.map((member, idx) => (
                  <div key={idx} className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full overflow-hidden bg-white/5 border border-white/5 flex-shrink-0">
                      <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${member.seed}`} alt="" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-white">{member.name}</span>
                        <span className={`text-[7px] font-black uppercase px-1.5 py-0.5 rounded border ${getReputationBadgeColor(member.rep)}`}>
                          {member.rep}
                        </span>
                      </div>
                      <p className="text-[9px] text-zinc-500 font-medium">{member.desc}</p>
                    </div>
                  </div>
                ))}
                {featuredMembers.length === 0 && (
                  <p className="text-xs text-zinc-600 italic">Nenhum membro em destaque no momento.</p>
                )}
              </div>
            </div>

            {/* Community Rules */}
            <div className="p-6 bg-white/[0.02] border border-white/5 rounded-3xl space-y-3">
              <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-2">
                <BookOpen size={14} className="text-primary" /> Regras da Comunidade
              </h4>
              <ul className="text-[10px] text-zinc-500 space-y-1.5 list-disc list-inside leading-relaxed">
                <li>Respeito mútuo entre todos os produtores e técnicos.</li>
                <li>Foco exclusivo em bananicultura e agronegócio.</li>
                <li>Evitar propagandas de defensivos ou marcas não homologadas.</li>
              </ul>
            </div>

          </div>

        </div>
      </div>
    </Layout>
  );
}
