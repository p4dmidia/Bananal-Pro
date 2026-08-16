import React, { useEffect, useState } from 'react';
import { Download, X, Smartphone } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function InstallPWA() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone) {
      setIsInstalled(true);
    }

    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      
      // Only show if NOT installed AND on a mobile/tablet device (< 1024px)
      const isMobileOrTablet = window.innerWidth < 1024;
      
      if (!isInstalled && isMobileOrTablet) {
        setTimeout(() => setIsVisible(true), 3000);
      }
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, [isInstalled]);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
      setIsVisible(false);
    }
  };

  if (isInstalled || !isVisible) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        className="fixed bottom-6 left-6 right-6 z-[100] md:left-auto md:w-96"
      >
        <div className="glass-card bg-black/90 border-primary/20 p-6 rounded-[2.5rem] shadow-2xl shadow-primary/20 flex flex-col gap-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full p-[3px] bg-gradient-to-tr from-emerald-500 to-yellow-500 overflow-hidden shrink-0">
                <img
                  alt="Banana PRO logo"
                  className="w-full h-full rounded-full object-cover bg-white"
                  src="/favicon.png"
                />
              </div>
              <div>
                <h3 className="text-white font-bold text-lg leading-tight">Instalar Banana PRO</h3>
                <p className="text-slate-400 text-sm">Tenha acesso rápido à plataforma direto na sua tela inicial.</p>
              </div>
            </div>
            <button 
              onClick={() => setIsVisible(false)}
              className="p-2 text-slate-500 hover:text-white transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleInstall}
              className="flex-1 bg-primary hover:bg-primary-dark text-white font-bold py-3 rounded-2xl flex items-center justify-center gap-2 hover:brightness-110 transition-all shadow-lg shadow-primary/20"
            >
              <Download size={18} />
              Instalar Agora
            </button>
            <button
              onClick={() => setIsVisible(false)}
              className="px-6 bg-white/5 text-slate-400 font-bold py-3 rounded-2xl hover:bg-white/10 transition-all"
            >
              Depois
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
