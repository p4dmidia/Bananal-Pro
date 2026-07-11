import React, { useState, useEffect, useRef } from "react";
import Layout from "../../components/Layout/Layout";
import { motion, AnimatePresence } from "motion/react";
import { 
  Tv, 
  MessageSquare, 
  Send, 
  Users, 
  Calendar, 
  Clock, 
  Play, 
  Sparkles,
  Volume2,
  ExternalLink,
  FileText,
  ArrowUpRight,
  Info,
  Loader2
} from "lucide-react";
import { supabase as supabaseClient } from "../../lib/supabase";
import { useAuth } from "../../contexts/AuthContext";
import { toast } from "sonner";
import YouTubePlayer from "../../components/Courses/YouTubePlayer";

const supabase = supabaseClient as any;

interface ChatMessage {
  id: number;
  user: string;
  avatar: string;
  text: string;
  time: string;
  isAgronomist?: boolean;
}

interface LiveSession {
  id: string;
  title: string;
  host: string;
  date: string;
  duration: string;
  category: string;
  videoUrl: string;
  isLive?: boolean;
  description?: string;
  live_url?: string;
  replay_url?: string;
  materials?: { title: string; url: string }[];
  chat_enabled?: boolean;
  raw_status?: string;
  thumbnail_url?: string;
}

// Helpers para extração de IDs de vídeo e thumbnail
function getYoutubeId(url: string) {
  if (!url) return null;
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
}

function getYoutubeEmbedUrl(url: string) {
  if (!url) return "";
  const ytId = getYoutubeId(url);
  if (ytId) {
    return `https://www.youtube.com/embed/${ytId}`;
  }
  
  // Suporte a Vimeo
  const vimeoReg = /(?:vimeo)\.com\/(?:channels\/(?:\w+\/)?|groups\/([^\/]*)\/videos\/|album\/(\d+)\/video\/|)(\d+)(?:$|\/|\?)/;
  const vimeoMatch = url.match(vimeoReg);
  if (vimeoMatch && vimeoMatch[3]) {
    return `https://player.vimeo.com/video/${vimeoMatch[3]}`;
  }

  return url;
}

function isDirectVideoUrl(url: string) {
  if (!url) return false;
  return url.includes('/storage/v1/object/') || url.match(/\.(mp4|webm|ogg|mov)($|\?)/i) !== null;
}

function getSessionThumbnail(item: any) {
  if (item.thumbnail_url) {
    return item.thumbnail_url;
  }
  if (item.replay_url) {
    const ytId = getYoutubeId(item.replay_url);
    if (ytId) {
      return `https://img.youtube.com/vi/${ytId}/hqdefault.jpg`;
    }
  }
  
  // Imagens padrão baseadas em categorias populares do bananal
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
}

const fallbackSessions: LiveSession[] = [
  {
    id: "live-1",
    title: "Mentoria Coletiva: Combate de Precisão à Sigatoka Negra no Período Chuvoso",
    host: "Dr. Carlos Silva (Engenheiro Agrônomo)",
    date: "Hoje",
    duration: "Em andamento",
    category: "Fitossanidade",
    videoUrl: "https://images.unsplash.com/photo-1593113598332-cd288d649433?auto=format&fit=crop&q=80&w=1200",
    isLive: true,
    description: "Participe da mentoria ao vivo para tirar suas dúvidas sobre o manejo de Sigatoka Negra.",
    live_url: "https://meet.google.com/abc-defg-hij",
    replay_url: "",
    materials: [],
    chat_enabled: true,
    raw_status: "live"
  },
  {
    id: "live-2",
    title: "Interpretação Descomplicada de Análise de Solo para Banana Prata",
    host: "Dr. Carlos Silva",
    date: "25 Mai 2026",
    duration: "1h 15min",
    category: "Solo & Nutrição",
    videoUrl: "https://images.unsplash.com/photo-1464226184884-fa280b87c399?auto=format&fit=crop&q=80&w=600",
    description: "Nesta mentoria gravada, explicamos os principais pontos para analisar a fertilidade do solo.",
    live_url: "",
    replay_url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    materials: [{ title: "Tabela Nutrientes.pdf", url: "https://example.com" }],
    chat_enabled: false,
    raw_status: "finished"
  },
  {
    id: "live-3",
    title: "Manejo Orgânico e Controle de Nematoides na Cultura da Banana",
    host: "Dra. Regina Santos (Pesquisadora Embrapa)",
    date: "18 Mai 2026",
    duration: "1h 42min",
    category: "Manejo Sustentável",
    videoUrl: "https://images.unsplash.com/photo-1530595467537-0b5996c41f2d?auto=format&fit=crop&q=80&w=600",
    description: "Controle biológico e práticas culturais para reduzir infestação de fitonematoides.",
    live_url: "",
    replay_url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    materials: [],
    chat_enabled: false,
    raw_status: "finished"
  }
];

export default function Lives() {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<LiveSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeSession, setActiveSession] = useState<LiveSession | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Função para carregar lives
  const loadLives = async (shouldShowLoading = true) => {
    if (shouldShowLoading) setLoading(true);
    try {
      const { data, error } = await supabase
        .from("lives")
        .select("*")
        .order("scheduled_at", { ascending: false });

      if (error) throw error;

      if (data && data.length > 0) {
        const filtered = data.filter((item: any) => item.status !== "finished");
        if (filtered.length > 0) {
          const mapped: LiveSession[] = filtered.map((item: any) => {
            const dateObj = new Date(item.scheduled_at);
            const formattedDate = dateObj.toLocaleDateString("pt-BR", {
              day: "2-digit",
              month: "short",
              year: "numeric",
            });
            const formattedTime = dateObj.toLocaleTimeString("pt-BR", {
              hour: "2-digit",
              minute: "2-digit",
            });

            return {
              id: item.id,
              title: item.title,
              host: item.host || "Dr. Carlos Silva",
              date: formattedDate,
              duration: item.status === "live" ? "Ao Vivo" : item.status === "scheduled" ? `Agendada para às ${formattedTime}` : "Gravação",
              category: item.category || "Geral",
              videoUrl: getSessionThumbnail(item),
              isLive: item.status === "live",
              description: item.description,
              live_url: item.live_url,
              replay_url: item.replay_url,
              materials: item.materials || [],
              chat_enabled: item.chat_enabled,
              raw_status: item.status,
              thumbnail_url: item.thumbnail_url
            };
          });

          setSessions(mapped);
          
          // Define activeSession: prioriza a que está ao vivo, senão a selecionada anteriormente se ainda existir na lista, senão a primeira
          setActiveSession(prev => {
            const liveObj = mapped.find(s => s.isLive);
            if (liveObj) return liveObj;
            
            if (prev) {
              const stillExists = mapped.find(s => s.id === prev.id);
              if (stillExists) return stillExists;
            }
            
            return mapped[0];
          });
        } else {
          setSessions([]);
          setActiveSession(null);
        }
      } else {
        setSessions([]);
        setActiveSession(null);
      }
    } catch (err) {
      console.warn("Erro ao buscar lives do Supabase:", err);
    } finally {
      if (shouldShowLoading) setLoading(false);
    }
  };

  // Efeito para carregar lives e assinar atualizações na tabela lives (Realtime)
  useEffect(() => {
    loadLives(true);

    const livesChannel = supabase
      .channel('public:lives')
      .on(
        'postgres_changes',
        {
          event: '*', // UPDATE, INSERT, DELETE
          schema: 'public',
          table: 'lives'
        },
        () => {
          // Quando qualquer live sofrer alteração, recarrega a lista silenciosamente
          loadLives(false);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(livesChannel);
    };
  }, []);

  // Efeito para carregar histórico do chat e assinar mensagens da live ativa (Realtime)
  useEffect(() => {
    if (!activeSession?.id) {
      setChatMessages([]);
      return;
    }

    const loadChatHistory = async () => {
      try {
        const { data, error } = await supabase
          .from('live_chat_messages')
          .select(`
            id,
            message,
            created_at,
            user_id,
            user_profiles:user_id (
              full_name,
              role,
              avatar_url,
              email
            )
          `)
          .eq('live_id', activeSession.id)
          .order('created_at', { ascending: true });

        if (error) throw error;

        if (data) {
          const mappedMsgs: ChatMessage[] = data.map((msg: any) => {
            const timeObj = new Date(msg.created_at);
            const formattedTime = timeObj.toLocaleTimeString("pt-BR", {
              hour: "2-digit",
              minute: "2-digit"
            });
            const profile = msg.user_profiles;
            const name = profile?.full_name || profile?.email?.split('@')[0] || "Produtor";
            return {
              id: msg.id,
              user: name,
              avatar: name.substring(0, 2).toUpperCase(),
              text: msg.message,
              time: formattedTime,
              isAgronomist: profile?.role === 'admin'
            };
          });
          setChatMessages(mappedMsgs);
        }
      } catch (err) {
        console.error("Erro ao carregar histórico do chat:", err);
      }
    };

    loadChatHistory();

    const chatChannel = supabase
      .channel(`live-chat:${activeSession.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'live_chat_messages',
          filter: `live_id=eq.${activeSession.id}`
        },
        async (payload: any) => {
          try {
            // Busca dados do perfil do remetente
            const { data: profile } = await supabase
              .from('user_profiles')
              .select('full_name, role, avatar_url, email')
              .eq('mocha_user_id', payload.new.user_id)
              .maybeSingle();

            const timeObj = new Date(payload.new.created_at);
            const formattedTime = timeObj.toLocaleTimeString("pt-BR", {
              hour: "2-digit",
              minute: "2-digit"
            });
            const name = profile?.full_name || profile?.email?.split('@')[0] || "Produtor";

            const newMsg: ChatMessage = {
              id: payload.new.id,
              user: name,
              avatar: name.substring(0, 2).toUpperCase(),
              text: payload.new.message,
              time: formattedTime,
              isAgronomist: profile?.role === 'admin'
            };

            setChatMessages(prev => {
              if (prev.some(m => m.id === newMsg.id)) return prev;
              return [...prev, newMsg];
            });
          } catch (err) {
            console.error("Erro no realtime chat:", err);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(chatChannel);
    };
  }, [activeSession?.id]);

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

  // Auto-scroll chat to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim()) return;
    if (!user) {
      toast.error("Você precisa estar logado para enviar mensagens.");
      return;
    }
    if (!activeSession) return;

    const messageText = inputMessage;
    setInputMessage("");

    try {
      const { error } = await supabase
        .from('live_chat_messages')
        .insert({
          live_id: activeSession.id,
          user_id: user.id,
          message: messageText
        });

      if (error) throw error;
    } catch (err: any) {
      console.error("Erro ao enviar mensagem:", err);
      toast.error("Erro ao enviar mensagem: " + err.message);
    }
  };

  const handleSelectSession = (session: LiveSession) => {
    setActiveSession(session);
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
          <Loader2 className="w-12 h-12 text-emerald-500 animate-spin" />
          <p className="text-slate-400 text-sm font-semibold">Carregando transmissões...</p>
        </div>
      </Layout>
    );
  }

  if (!activeSession) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-4 max-w-md mx-auto">
          <div className="w-16 h-16 bg-zinc-900 border border-white/5 rounded-full flex items-center justify-center text-slate-400">
            <Tv size={28} />
          </div>
          <h2 className="text-xl font-bold text-white">Nenhuma Transmissão Disponível</h2>
          <p className="text-slate-400 text-xs leading-relaxed">
            No momento não há mentorias gravadas ou transmissões ao vivo agendadas. Fique atento às notificações no painel para as próximas mentorias coletivas.
          </p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-8 pb-12">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-headline font-bold text-white flex items-center gap-3">
              <Tv className="text-emerald-500 w-8 h-8" />
              Lives & Mentorias
            </h1>
            <p className="text-slate-400 text-sm mt-1">
              Acompanhe as consultorias coletivas ao vivo com nossos agrônomos ou assista às gravações passadas.
            </p>
          </div>
          
          {activeSession.isLive && (
            <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 px-4 py-2 rounded-2xl animate-pulse">
              <span className="w-2.5 h-2.5 bg-red-500 rounded-full"></span>
              <span className="text-red-400 text-xs font-black uppercase tracking-widest">Transmitindo Ao Vivo</span>
            </div>
          )}
        </div>

        {/* Main Grid: Player & Live Chat */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Video Player */}
          <div className={`${activeSession.chat_enabled ? "lg:col-span-8" : "lg:col-span-12"} space-y-4`}>
            <div className="relative aspect-video rounded-3xl overflow-hidden border border-white/10 bg-zinc-900 group shadow-2xl">
              {/* Se for gravação e tiver URL de replay válida */}
              {activeSession.raw_status === "finished" && activeSession.replay_url ? (
                isDirectVideoUrl(activeSession.replay_url) ? (
                  <video
                    src={activeSession.replay_url}
                    controls
                    className="w-full h-full object-cover bg-black"
                    poster={activeSession.videoUrl}
                  />
                ) : (
                  <YouTubePlayer
                    url={activeSession.replay_url}
                    title={activeSession.title}
                  />
                )
              ) : (
                <>
                  {/* Cover/Player Background */}
                  <img 
                    src={activeSession.videoUrl} 
                    alt="Live Stream" 
                    className="w-full h-full object-cover opacity-70 group-hover:scale-105 transition-all duration-700" 
                  />
                  
                  {/* Volumetric Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent" />

                  {/* Status Tags */}
                  <div className="absolute top-6 left-6 flex items-center gap-2 z-10">
                    <span className="bg-emerald-600/90 backdrop-blur-md text-white text-[10px] font-black uppercase tracking-wider px-3 py-1.5 rounded-full border border-emerald-500/20">
                      {activeSession.category}
                    </span>
                    {activeSession.isLive ? (
                      <span className="bg-red-600 backdrop-blur-md text-white text-[10px] font-black uppercase tracking-wider px-3 py-1.5 rounded-full animate-pulse flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 bg-white rounded-full"></span>
                        AO VIVO
                      </span>
                    ) : activeSession.raw_status === "scheduled" ? (
                      <span className="bg-yellow-600/90 backdrop-blur-md text-white text-[10px] font-black uppercase tracking-wider px-3 py-1.5 rounded-full">
                        AGENDADA
                      </span>
                    ) : (
                      <span className="bg-white/10 backdrop-blur-md text-slate-300 text-[10px] font-black uppercase tracking-wider px-3 py-1.5 rounded-full">
                        GRAVAÇÃO
                      </span>
                    )}
                  </div>

                  {/* Se estiver AO VIVO (Google Meet) */}
                  {activeSession.raw_status === "live" && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center p-6 bg-black/45 backdrop-blur-[2px]">
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="max-w-md w-full bg-zinc-950/95 border border-emerald-500/30 p-6 md:p-8 rounded-[2.5rem] text-center space-y-6 shadow-2xl"
                      >
                        <div className="flex justify-center">
                          <div className="relative">
                            <div className="absolute -inset-1 rounded-full bg-emerald-500/30 blur animate-pulse" />
                            <div className="relative w-14 h-14 bg-emerald-950 border border-emerald-500/40 rounded-full flex items-center justify-center text-emerald-400">
                              <Tv size={24} className="animate-bounce" />
                            </div>
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <span className="inline-flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full">
                            <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-ping" />
                            Mentoria em Andamento
                          </span>
                          <h3 className="text-lg font-bold text-white leading-tight">Transmissão no Google Meet</h3>
                          <p className="text-zinc-400 text-xs leading-relaxed">
                            Esta mentoria está acontecendo ao vivo agora mesmo! Clique no botão abaixo para abrir a sala e participar com os agrônomos.
                          </p>
                        </div>

                        <a
                          href={activeSession.live_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex w-full items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-4 px-6 rounded-2xl transition-all shadow-lg shadow-emerald-600/20 active:scale-[0.98]"
                        >
                          <span>Entrar no Google Meet</span>
                          <ArrowUpRight size={14} />
                        </a>
                      </motion.div>
                    </div>
                  )}

                  {/* Se estiver AGENDADA */}
                  {activeSession.raw_status === "scheduled" && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center p-6 bg-black/55 backdrop-blur-[2px]">
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="max-w-md w-full bg-zinc-950/95 border border-white/5 p-6 md:p-8 rounded-[2.5rem] text-center space-y-6 shadow-2xl"
                      >
                        <div className="flex justify-center">
                          <div className="w-14 h-14 bg-zinc-900 border border-white/10 rounded-full flex items-center justify-center text-zinc-400">
                            <Calendar size={24} />
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <span className="inline-block bg-zinc-800 text-zinc-400 text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full">
                            Agendada
                          </span>
                          <h3 className="text-lg font-bold text-white leading-tight">Agendada para Breve</h3>
                          <p className="text-zinc-400 text-xs leading-relaxed">
                            Esta mentoria técnica está marcada para **{activeSession.date}**. O link de acesso estará disponível aqui no horário agendado!
                          </p>
                        </div>
                      </motion.div>
                    </div>
                  )}

                  {/* Se estiver FINALIZADA mas sem replay ainda */}
                  {activeSession.raw_status === "finished" && !activeSession.replay_url && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center p-6 bg-black/55 backdrop-blur-[2px]">
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="max-w-md w-full bg-zinc-950/95 border border-white/5 p-6 md:p-8 rounded-[2.5rem] text-center space-y-6 shadow-2xl"
                      >
                        <div className="flex justify-center">
                          <div className="w-14 h-14 bg-zinc-900 border border-white/10 rounded-full flex items-center justify-center text-zinc-400">
                            <Tv size={24} />
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <span className="inline-block bg-zinc-800 text-zinc-400 text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full">
                            Finalizada
                          </span>
                          <h3 className="text-lg font-bold text-white leading-tight">Gravação em Processamento</h3>
                          <p className="text-zinc-400 text-xs leading-relaxed">
                            Esta mentoria foi finalizada recentemente. A gravação está sendo processada e o replay estará disponível nesta tela em breve. Agradecemos a paciência!
                          </p>
                        </div>
                      </motion.div>
                    </div>
                  )}


                </>
              )}
            </div>

            {/* Session Text Details */}
            <div className="glass-card p-6 rounded-[2rem] border-white/5 space-y-4">
              <div className="space-y-2">
                <h2 className="text-xl font-headline font-bold text-white">{activeSession.title}</h2>
                <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-slate-400">
                  <span className="font-semibold text-emerald-400">{activeSession.host}</span>
                  <span className="flex items-center gap-1.5">
                    <Calendar size={14} />
                    {activeSession.date}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Clock size={14} />
                    {activeSession.duration}
                  </span>
                </div>
              </div>

              {activeSession.description && (
                <p className="text-xs text-slate-300 leading-relaxed pt-2 border-t border-white/5">{activeSession.description}</p>
              )}

              {/* Materiais de Apoio */}
              {activeSession.materials && activeSession.materials.length > 0 && (
                <div className="pt-4 border-t border-white/5 space-y-2">
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Materiais de Apoio ({activeSession.materials.length})</p>
                  <div className="flex flex-wrap gap-2">
                    {activeSession.materials.map((m: any, idx: number) => (
                      <a 
                        key={idx} 
                        href={m.url} 
                        target="_blank" 
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/5 hover:bg-emerald-500/10 rounded-xl text-xs text-slate-300 hover:text-emerald-400 transition-colors border border-white/5"
                      >
                        <FileText size={12} />
                        <span className="truncate max-w-[150px]">{m.title}</span>
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Interactive Chat */}
          {activeSession.chat_enabled && (
            <div className="lg:col-span-4 flex flex-col h-[400px] lg:h-auto min-h-[400px] lg:min-h-0 bg-zinc-950 border border-white/10 rounded-3xl overflow-hidden shadow-xl">
              {/* Chat Header */}
              <div className="px-6 py-4 bg-zinc-900 border-b border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MessageSquare className="text-emerald-500 w-5 h-5" />
                  <h3 className="font-bold text-sm text-white">Chat da Mentoria</h3>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Chat Online</span>
                </div>
              </div>

              {/* Chat Body */}
              <div className="flex-1 p-6 overflow-y-auto space-y-4 no-scrollbar">
                {chatMessages.map((msg) => (
                  <div 
                    key={msg.id} 
                    className={`flex gap-3 items-start ${msg.isAgronomist ? "bg-emerald-950/20 border border-emerald-900/30 p-3 rounded-2xl" : ""}`}
                  >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-black shrink-0 ${
                      msg.isAgronomist ? "bg-emerald-600 text-white" : "bg-white/10 text-slate-300"
                    }`}>
                      {msg.avatar}
                    </div>
                    <div className="space-y-1 overflow-hidden">
                      <div className="flex items-baseline gap-2">
                        <span className={`text-xs font-bold ${msg.isAgronomist ? "text-emerald-400" : "text-white"}`}>
                          {msg.user}
                        </span>
                        {msg.isAgronomist && (
                          <span className="bg-emerald-500/20 text-emerald-300 text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded">
                            Agrônomo
                          </span>
                        )}
                        <span className="text-[9px] text-slate-600">{msg.time}</span>
                      </div>
                      <p className="text-xs text-slate-300 leading-relaxed break-words">{msg.text}</p>
                    </div>
                  </div>
                ))}
                <div ref={chatEndRef} />
              </div>

              {/* Chat Input */}
              <form onSubmit={handleSendMessage} className="p-4 bg-zinc-900 border-t border-white/5 flex gap-2">
                <input 
                  type="text" 
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  placeholder="Pergunte ao agrônomo..."
                  className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs text-white placeholder-zinc-500 focus:border-emerald-500/50 focus:outline-none transition-colors"
                />
                <button 
                  type="submit"
                  className="w-10 h-10 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl flex items-center justify-center shrink-0 cursor-pointer transition-colors"
                >
                  <Send size={14} />
                </button>
              </form>
            </div>
          )}

        </div>

        {/* Past Records Section */}
        {sessions.filter(s => s.id !== activeSession?.id).length > 0 && (
          <section className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-headline font-bold text-white flex items-center gap-2">
                <Sparkles className="text-emerald-500 w-5 h-5" />
                Todas as Mentorias
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {sessions.filter(s => s.id !== activeSession?.id).map((session) => (
                <motion.div
                  key={session.id}
                  whileHover={{ y: -4 }}
                  onClick={() => handleSelectSession(session)}
                  className={`bg-zinc-950 border rounded-[2rem] overflow-hidden flex flex-col justify-between cursor-pointer transition-all duration-300 ${
                    activeSession.id === session.id ? "border-emerald-500 shadow-lg shadow-emerald-500/5" : "border-white/5 hover:border-white/15"
                  }`}
                >
                  {/* Thumbnail */}
                  <div className="relative aspect-video bg-zinc-900">
                    <img src={session.videoUrl} alt={session.title} className="w-full h-full object-cover opacity-60 animate-fade-in" />
                    <div className="absolute inset-0 bg-black/20" />
                    <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-md text-slate-300 text-[8px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full border border-white/5 z-10">
                      {session.category}
                    </div>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-10 h-10 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center border border-white/20 text-white">
                        {session.raw_status === "live" ? (
                          <span className="w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse" />
                        ) : (
                          <Play size={14} className="fill-white ml-0.5" />
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Details */}
                  <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                    <h4 className="text-xs font-bold text-white line-clamp-2 leading-relaxed">{session.title}</h4>
                    
                    <div className="flex items-center justify-between text-[10px] text-slate-500 border-t border-white/5 pt-3">
                      <span>{session.host}</span>
                      <span className="flex items-center gap-1">
                        <Clock size={10} />
                        {session.duration}
                      </span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </section>
        )}

      </div>
    </Layout>
  );
}
