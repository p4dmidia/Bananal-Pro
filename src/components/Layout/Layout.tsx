import React, { useState } from "react";
import Sidebar from "./Sidebar";
import { Search, Bell, Menu, X, Loader2, Globe } from "lucide-react";
import { useNotifications } from "../../contexts/NotificationContext";
import { motion, AnimatePresence } from "motion/react";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";
import { Link, useLocation } from "react-router-dom";

export default function Layout({ children, headerActions }: { children: React.ReactNode; headerActions?: React.ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showLangMenu, setShowLangMenu] = useState(false);
  const { notifications, unreadCount, markAsRead, markAllAsRead, loading: loadingNotifications } = useNotifications();
  const { t, i18n } = useTranslation();
  const location = useLocation();

  const currentLang = i18n.language || "pt";
  const isDashboard = location.pathname === "/dashboard";
  const hasTransparentHeader = location.pathname === "/dashboard" || location.pathname === "/financeiro" || location.pathname === "/comunidade" || location.pathname === "/biblioteca" || location.pathname === "/solo" || location.pathname === "/estoque" || location.pathname === "/clima" || location.pathname === "/calendario" || location.pathname === "/diagnostico";

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
    localStorage.setItem("i18nextLng", lng);
    setShowLangMenu(false);
  };

  return (
    <div className="flex min-h-screen bg-background text-on-surface font-sans overflow-x-hidden">
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      
      <div className="flex-1 flex flex-col min-w-0 lg:pl-72">
        {/* Navbar */}
        <header className={
          hasTransparentHeader 
            ? "h-20 px-4 md:px-8 flex items-center justify-between absolute top-0 right-0 left-0 lg:left-72 bg-transparent z-40 border-none"
            : "h-20 border-b border-outline/10 px-4 md:px-8 flex items-center justify-between sticky top-0 bg-background/80 backdrop-blur-md z-40"
        }>
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className={`sidebar-toggle-btn lg:hidden p-2.5 transition-colors rounded-xl border cursor-pointer ${
                hasTransparentHeader 
                  ? "bg-emerald-500/10 border-emerald-500/25 text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/20" 
                  : "bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20"
              }`}
            >
              <Menu size={22} className="text-emerald-600 dark:text-emerald-400" />
            </button>
          </div>

          <div className="hero-banner-container flex items-center gap-3 md:gap-6">
            {headerActions}
            {/* Language Selector Dropdown */}
            <div className="relative">
              <button 
                onClick={() => setShowLangMenu(!showLangMenu)}
                className={`flex items-center gap-2 px-3 py-2 border rounded-2xl transition-all text-xs font-bold cursor-pointer ${
                  hasTransparentHeader 
                    ? "bg-white/10 hover:bg-white/20 border-white/20 hover:border-white/40 text-white" 
                    : "bg-surface border-outline/10 hover:border-outline/20 hover:text-on-surface text-on-surface-variant"
                }`}
              >
                <Globe size={14} className={hasTransparentHeader ? "text-emerald-400" : "text-emerald-600 dark:text-emerald-400"} />
                <span className={`uppercase font-black ${hasTransparentHeader ? "text-emerald-400" : "text-emerald-600 dark:text-emerald-400"}`}>{currentLang === "pt" ? "🇧🇷 PT" : currentLang === "en" ? "🇺🇸 EN" : "🇪🇸 ES"}</span>
              </button>
              
              <AnimatePresence>
                {showLangMenu && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setShowLangMenu(false)} />
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className="absolute right-0 mt-2 w-32 bg-surface border border-outline/15 rounded-[1.5rem] shadow-2xl z-50 overflow-hidden"
                    >
                      <div className="py-1">
                        <button
                          type="button"
                          onClick={() => changeLanguage("pt")}
                          className="w-full text-left px-4 py-2.5 hover:bg-on-surface/5 text-xs font-bold text-on-surface flex items-center gap-2 cursor-pointer transition-colors"
                        >
                          <span>🇧🇷</span> Português
                        </button>
                        <button
                          type="button"
                          onClick={() => changeLanguage("en")}
                          className="w-full text-left px-4 py-2.5 hover:bg-on-surface/5 text-xs font-bold text-on-surface flex items-center gap-2 cursor-pointer transition-colors"
                        >
                          <span>🇺🇸</span> English
                        </button>
                        <button
                          type="button"
                          onClick={() => changeLanguage("es")}
                          className="w-full text-left px-4 py-2.5 hover:bg-on-surface/5 text-xs font-bold text-on-surface flex items-center gap-2 cursor-pointer transition-colors"
                        >
                          <span>🇪🇸</span> Español
                        </button>
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
            <div className="relative">
              <button 
                onClick={async () => {
                  setShowNotifications(!showNotifications);
                  if (Notification.permission === "default") {
                    toast((tToast) => (
                      <div className="flex items-center gap-3">
                        <div className="bg-primary/20 p-2 rounded-lg">
                          <Bell className="text-primary" size={20} />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-on-surface">{t("notifications.activate_prompt")}</p>
                          <p className="text-xs text-on-surface-variant">{t("notifications.activate_desc")}</p>
                          <div className="flex gap-2 mt-2">
                            <button 
                              onClick={() => {
                                Notification.requestPermission();
                                toast.dismiss(tToast.id);
                              }}
                              className="bg-primary text-white px-3 py-1 rounded-md text-[10px] font-bold cursor-pointer"
                            >
                              {t("notifications.activate_btn")}
                            </button>
                            <button 
                              onClick={() => toast.dismiss(tToast.id)}
                              className="text-on-surface-variant px-3 py-1 text-[10px] font-bold cursor-pointer"
                            >
                              {t("notifications.later_btn")}
                            </button>
                          </div>
                        </div>
                      </div>
                    ), { duration: 10000 });
                  }
                }}
                className={`relative p-2 transition-colors cursor-pointer ${
                  hasTransparentHeader 
                    ? "text-white/80 hover:text-white" 
                    : "text-on-surface-variant hover:text-on-surface"
                }`}
              >
                <Bell size={22} />
                {unreadCount > 0 && (
                  <span className={`absolute top-2 right-2 w-4 h-4 text-[10px] font-bold flex items-center justify-center rounded-full border-2 ${
                    hasTransparentHeader 
                      ? "bg-emerald-500 text-white border-emerald-950" 
                      : "bg-primary text-white border-background"
                  }`}>
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              <AnimatePresence>
                {showNotifications && (
                  <>
                    <motion.div 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      onClick={() => setShowNotifications(false)}
                      className="fixed inset-0 z-40"
                    />
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className="absolute right-0 mt-2 w-80 md:w-96 bg-surface border border-outline/15 rounded-[2rem] shadow-2xl z-50 overflow-hidden"
                    >
                      <div className="p-6 border-b border-outline/10 flex items-center justify-between">
                        <h3 className="font-bold text-lg">{t("notifications.title")}</h3>
                        <button 
                          onClick={() => markAllAsRead()}
                          className="text-xs font-bold text-primary hover:underline cursor-pointer"
                        >
                          {t("notifications.mark_read")}
                        </button>
                      </div>

                      <div className="max-h-[350px] overflow-y-auto no-scrollbar">
                        {loadingNotifications ? (
                          <div className="p-10 flex flex-col items-center justify-center text-on-surface-variant gap-3">
                            <Loader2 className="animate-spin" size={24} />
                            <p className="text-sm">{t("notifications.fetching")}</p>
                          </div>
                        ) : notifications.length > 0 ? (
                          notifications.map((notif) => (
                            <div 
                              key={notif.id}
                              onClick={() => {
                                markAsRead(Number(notif.id));
                                if (notif.link) window.location.href = notif.link;
                              }}
                              className={`p-5 border-b border-outline/10 hover:bg-on-surface/[0.02] cursor-pointer transition-colors relative ${!notif.is_read ? "bg-primary/10" : ""}`}
                            >
                              {!notif.is_read && (
                                <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary" />
                              )}
                              <p className="font-bold text-sm text-on-surface mb-1">{notif.title}</p>
                              <p className="text-xs text-on-surface-variant line-clamp-2 leading-relaxed">{notif.message}</p>
                              <p className="text-[10px] text-on-surface-variant mt-2 font-medium">
                                {new Date(notif.created_at).toLocaleString(currentLang === 'pt' ? 'pt-BR' : currentLang === 'es' ? 'es-ES' : 'en-US', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' })}
                              </p>
                            </div>
                          ))
                        ) : (
                          <div className="p-12 text-center text-on-surface-variant">
                            <Bell className="mx-auto mb-3 opacity-20" size={32} />
                            <p className="text-sm">{t("notifications.empty")}</p>
                          </div>
                        )}
                      </div>

                      <div className="p-4 border-t border-outline/10 text-center bg-on-surface/5">
                        <Link 
                          to="/notificacoes" 
                          onClick={() => setShowNotifications(false)}
                          className="text-xs font-bold text-emerald-400 hover:text-emerald-300 hover:underline transition-colors block w-full py-1 cursor-pointer"
                        >
                          Ver todas as notificações
                        </Link>
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <main className={isDashboard ? "overflow-y-auto w-full" : "p-4 md:p-8 overflow-y-auto"}>
          {children}
        </main>
      </div>
    </div>
  );
}
