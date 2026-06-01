import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { ChevronRight, ChevronDown, User, TrendingUp, Users, DollarSign, X, ZoomIn, ZoomOut, Maximize } from "lucide-react";

interface NodeData {
  id: string;
  name?: string;
  full_name?: string;
  level: string;
  referrals: number;
  earnings: string;
  children?: NodeData[];
}

interface NetworkTreeProps {
  data: NodeData;
}

const TreeNode = ({ node, depth = 0 }: { node: NodeData; depth?: number }) => {
  const navigate = useNavigate();
  const [isExpanded, setIsExpanded] = useState(depth < 1);
  const [showInfo, setShowInfo] = useState(false);

  const hasChildren = node.children && node.children.length > 0;

  return (
    <div className="flex flex-col items-center">
      {/* Node Container */}
      <div className="relative flex flex-col items-center group">
        {/* Node Circle */}
        <motion.div
          onClick={() => setShowInfo(true)}
          className={`relative z-10 rounded-full p-[2px] cursor-pointer transition-all hover:scale-110 shadow-lg shrink-0 ${
            depth === 0 
              ? "w-16 h-16 bg-purple-gradient shadow-primary/30" 
              : "w-12 h-12 bg-zinc-800 border border-white/10 hover:border-primary/50"
          }`}
        >
          <div className="w-full h-full rounded-full bg-black flex items-center justify-center overflow-hidden">
            <img 
              src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${node.full_name || node.name}`} 
              alt={node.full_name || node.name} 
              className="w-full h-full object-cover"
            />
          </div>
          
          {/* Level Badge */}
          <div className="absolute -bottom-1 -right-1 bg-zinc-900 border border-white/10 rounded-full px-2 py-0.5 text-[8px] font-black uppercase text-primary">
            N{depth}
          </div>
        </motion.div>

        {/* Label */}
        <div className="mt-2 text-center max-w-[120px]">
          <p className="text-[11px] font-bold text-white truncate px-2">{node.full_name || node.name}</p>
          <p className="text-[9px] text-zinc-500 font-medium uppercase tracking-widest">{node.level}</p>
        </div>

        {/* Expand/Collapse Toggle */}
        {hasChildren && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsExpanded(!isExpanded);
            }}
            className="mt-2 w-5 h-5 bg-zinc-900 border border-white/10 rounded-full flex items-center justify-center text-zinc-400 hover:text-white hover:border-primary/50 transition-all z-20"
          >
            {isExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
          </button>
        )}

        {/* Connecting Line Down (if expanded) */}
        {hasChildren && isExpanded && (
          <div className="h-8 w-px bg-gradient-to-b from-primary/50 to-transparent" />
        )}
      </div>

      {/* Children Section */}
      <AnimatePresence>
        {hasChildren && isExpanded && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="relative pt-4"
          >
            {/* Horizontal Connector Line */}
            <div className="absolute top-0 left-0 right-0 flex justify-center">
              <div className="h-px bg-white/10 w-[calc(100%-4rem)]" />
            </div>

            <div className="flex gap-8 px-4">
              {node.children?.map((child) => (
                <div key={child.id} className="relative">
                  {/* Vertical line up to horizontal connector */}
                  <div className="absolute top-[-1rem] left-1/2 -translate-x-1/2 h-4 w-px bg-white/10" />
                  <TreeNode node={child} depth={depth + 1} />
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Info Modal */}
      <AnimatePresence>
        {showInfo && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowInfo(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-sm bg-zinc-900 border border-white/10 rounded-[2.5rem] overflow-hidden shadow-2xl"
            >
              {/* Header Profile */}
              <div className="bg-gradient-to-br from-primary/20 to-accent/20 p-8 pt-12 text-center relative">
                <button 
                  onClick={() => setShowInfo(false)}
                  className="absolute top-6 right-6 text-white/50 hover:text-white transition-colors"
                >
                  <X size={20} />
                </button>
                <div className="w-24 h-24 rounded-full bg-purple-gradient p-1 mx-auto mb-4 shadow-xl">
                  <div className="w-full h-full rounded-full bg-black flex items-center justify-center overflow-hidden">
                    <img 
                      src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${node.full_name || node.name}`} 
                      alt={node.full_name || node.name} 
                    />
                  </div>
                </div>
                <h3 className="text-2xl font-display font-bold text-white">{node.full_name || node.name}</h3>
                <p className="text-primary font-bold text-xs uppercase tracking-widest mt-1">{node.level}</p>
              </div>

              {/* Stats Grid */}
              <div className="p-8 grid grid-cols-2 gap-4">
                <div className="bg-white/5 border border-white/5 rounded-2xl p-4">
                  <div className="flex items-center gap-2 text-zinc-500 mb-1">
                    <Users size={14} />
                    <span className="text-[10px] font-black uppercase">Diretos</span>
                  </div>
                  <p className="text-xl font-bold">{node.referrals}</p>
                </div>
                <div className="bg-white/5 border border-white/5 rounded-2xl p-4">
                  <div className="flex items-center gap-2 text-zinc-500 mb-1">
                    <TrendingUp size={14} />
                    <span className="text-[10px] font-black uppercase">Nível</span>
                  </div>
                  <p className="text-xl font-bold">Nível {depth}</p>
                </div>
                <div className="bg-white/5 border border-white/5 rounded-2xl p-4 col-span-2">
                  <div className="flex items-center gap-2 text-zinc-500 mb-1">
                    <DollarSign size={14} />
                    <span className="text-[10px] font-black uppercase">Ganhos Totais</span>
                  </div>
                  <p className="text-2xl font-display font-bold text-emerald-400">{node.earnings}</p>
                </div>
              </div>

              {/* Action Button */}
              <div className="px-8 pb-8">
                <button 
                  onClick={() => navigate('/admin/usuarios')}
                  className="w-full bg-white/5 hover:bg-white/10 text-white font-bold py-4 rounded-2xl border border-white/10 transition-all text-sm"
                >
                  Ver Perfil Detalhado
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default function NetworkTree({ data }: NetworkTreeProps) {
  const [scale, setScale] = useState(1);

  const handleZoomIn = () => setScale(prev => Math.min(prev + 0.1, 2));
  const handleZoomOut = () => setScale(prev => Math.max(prev - 0.1, 0.5));
  const handleReset = () => setScale(1);

  return (
    <div className="relative w-full bg-black/20 rounded-[3rem] overflow-hidden group">
      {/* Zoom Controls Overlay */}
      <div className="absolute top-6 right-6 z-50 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        <button 
          onClick={handleZoomIn}
          className="p-3 bg-zinc-900 border border-white/10 rounded-xl text-white hover:bg-zinc-800 transition-all shadow-xl"
          title="Aumentar Zoom"
        >
          <ZoomIn size={18} />
        </button>
        <button 
          onClick={handleZoomOut}
          className="p-3 bg-zinc-900 border border-white/10 rounded-xl text-white hover:bg-zinc-800 transition-all shadow-xl"
          title="Diminuir Zoom"
        >
          <ZoomOut size={18} />
        </button>
        <button 
          onClick={handleReset}
          className="p-3 bg-zinc-900 border border-white/10 rounded-xl text-primary hover:bg-zinc-800 transition-all shadow-xl"
          title="Resetar Zoom"
        >
          <Maximize size={18} />
        </button>
        <div className="bg-zinc-900/80 border border-white/5 px-2 py-1 rounded-lg text-[10px] font-black text-center text-zinc-500 uppercase">
          {Math.round(scale * 100)}%
        </div>
      </div>

      <div className="w-full overflow-x-auto pb-60 pt-20 scrollbar-hide min-h-[1000px]">
        <motion.div 
          animate={{ scale }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="min-w-max px-40 origin-top flex justify-center"
        >
          <TreeNode node={data} />
        </motion.div>
      </div>
    </div>
  );
}
