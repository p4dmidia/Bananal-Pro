import React, { useState } from "react";
import Layout from "../../components/Layout/Layout";
import { useNotifications } from "../../contexts/NotificationContext";
import { motion, AnimatePresence } from "motion/react";
import { 
  Bell, 
  CheckCheck, 
  Clock, 
  Info,
  Loader2,
  Trash2,
  AlertTriangle
} from "lucide-react";
import toast from "react-hot-toast";

export default function NotificationsCenter() {
  const { notifications, unreadCount, markAsRead, markAllAsRead, loading } = useNotifications();
  const [filter, setFilter] = useState<"all" | "unread">("all");

  const filteredNotifications = notifications.filter(notif => {
    if (filter === "unread") return !notif.is_read;
    return true;
  });

  const handleMarkAllRead = async () => {
    try {
      await markAllAsRead();
      toast.success("Todas as notificações foram marcadas como lidas!", {
        style: {
          borderRadius: "1rem",
          background: "#05160f",
          color: "#ecfdf5",
          border: "1px solid rgba(117, 252, 167, 0.15)",
          fontSize: "12px",
          fontWeight: "bold"
        }
      });
    } catch (err) {
      toast.error("Erro ao marcar notificações como lidas.");
    }
  };

  const handleMarkSingleRead = async (id: number, isAlreadyRead: boolean) => {
    if (isAlreadyRead) return;
    try {
      await markAsRead(id);
    } catch (err) {
      console.error("Erro ao marcar notificação como lida:", err);
    }
  };

  return (
    <Layout>
      <div className="space-y-8 pb-12 max-w-4xl">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-headline font-bold text-white flex items-center gap-3">
              <Bell className="text-emerald-500 w-8 h-8" />
              Notificações
            </h1>
            <p className="text-slate-400 text-sm mt-1">
              Fique por dentro de laudos concluídos, avisos meteorológicos e agendamentos de lives.
            </p>
          </div>

          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllRead}
              className="bg-zinc-900 border border-white/10 hover:bg-emerald-600 hover:border-emerald-500 hover:text-white text-emerald-400 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer"
            >
              <CheckCheck size={14} />
              Marcar Todas como Lidas
            </button>
          )}
        </div>

        {/* Tab Filters */}
        <div className="flex border-b border-white/10 gap-6">
          <button
            onClick={() => setFilter("all")}
            className={`pb-4 font-bold text-xs uppercase tracking-wider transition-all relative cursor-pointer ${
              filter === "all" ? "text-emerald-400" : "text-slate-400 hover:text-white"
            }`}
          >
            Todas ({notifications.length})
            {filter === "all" && (
              <motion.div 
                layoutId="notifTabLine"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-500" 
              />
            )}
          </button>
          <button
            onClick={() => setFilter("unread")}
            className={`pb-4 font-bold text-xs uppercase tracking-wider transition-all relative cursor-pointer ${
              filter === "unread" ? "text-emerald-400" : "text-slate-400 hover:text-white"
            }`}
          >
            Não Lidas ({unreadCount})
            {filter === "unread" && (
              <motion.div 
                layoutId="notifTabLine"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-500" 
              />
            )}
          </button>
        </div>

        {/* Notifications List */}
        <div className="space-y-4">
          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center text-slate-500 gap-3">
              <Loader2 className="animate-spin text-emerald-500" size={32} />
              <p className="text-sm">Buscando notificações...</p>
            </div>
          ) : filteredNotifications.length > 0 ? (
            <div className="space-y-3">
              <AnimatePresence mode="popLayout">
                {filteredNotifications.map((notif) => (
                  <motion.div
                    key={notif.id}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    onClick={() => handleMarkSingleRead(Number(notif.id), notif.is_read)}
                    className={`p-6 bg-zinc-950 border rounded-3xl transition-all relative flex gap-4 items-start ${
                      !notif.is_read 
                        ? "border-emerald-500/30 bg-emerald-950/5 cursor-pointer hover:bg-emerald-950/10" 
                        : "border-white/5 opacity-80"
                    }`}
                  >
                    {/* Left unread green line */}
                    {!notif.is_read && (
                      <div className="absolute left-0 top-6 bottom-6 w-1 bg-emerald-500 rounded-r-md" />
                    )}

                    {/* Icon container */}
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${
                      !notif.is_read 
                        ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" 
                        : "bg-white/5 border-white/5 text-slate-500"
                    }`}>
                      <Bell size={18} />
                    </div>

                    {/* Info */}
                    <div className="space-y-1.5 flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 flex-wrap sm:flex-nowrap">
                        <h3 className={`text-sm font-bold truncate ${!notif.is_read ? "text-white" : "text-slate-300"}`}>
                          {notif.title}
                        </h3>
                        <span className="text-[10px] text-slate-500 font-medium flex items-center gap-1 shrink-0 font-sans">
                          <Clock size={12} />
                          {new Date(notif.created_at).toLocaleString('pt-BR', { 
                            hour: '2-digit', 
                            minute: '2-digit', 
                            day: '2-digit', 
                            month: '2-digit' 
                          })}
                        </span>
                      </div>
                      
                      <p className="text-xs text-slate-400 leading-relaxed font-sans">
                        {notif.message}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          ) : (
            <div className="py-20 text-center text-slate-500 space-y-4">
              <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto border border-white/5">
                <Bell className="opacity-20 text-slate-400" size={28} />
              </div>
              <div className="space-y-1 max-w-xs mx-auto">
                <h4 className="font-bold text-sm text-white">Nenhuma notificação por aqui</h4>
                <p className="text-xs">
                  {filter === "unread" 
                    ? "Parabéns! Você leu todas as suas notificações importantes." 
                    : "Você receberá atualizações quando novos laudos de solo ou conteúdos estiverem prontos."}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
