import React, { useState, useEffect } from "react";
import Layout from "../../components/Layout/Layout";
import { motion, AnimatePresence } from "motion/react";
import { 
  Calendar, 
  Plus, 
  Check, 
  Clock, 
  Trash2, 
  AlertCircle, 
  Tag, 
  Info,
  CalendarDays,
  CheckCircle2,
  ListTodo,
  Loader2,
  Pencil,
  X,
  Sparkles,
  Zap,
  Bell
} from "lucide-react";
import { toast } from "react-hot-toast";
import { useAuth } from "../../contexts/AuthContext";
import { supabase } from "../../lib/supabase";

interface FarmTask {
  id: string;
  title: string;
  date: string;
  category: "Irrigação" | "Adubação" | "Pulverização" | "Colheita" | "Manejo";
  status: "Pendente" | "Concluido";
  description: string;
}

export default function FarmCalendar() {
  const { profile } = useAuth();
  const [tasks, setTasks] = useState<FarmTask[]>([]);
  const [loadingTasks, setLoadingTasks] = useState(false);
  const [saving, setSaving] = useState(false);

  // Estados para Visão Notion e Priorização por IA
  const [viewMode, setViewMode] = useState<"standard" | "notion">("standard");
  const [priorizing, setPrioritizing] = useState(false);
  const [prioritizationStep, setPrioritizationStep] = useState(0);
  const [taskPriorities, setTaskPriorities] = useState<Record<string, { priority: "Alta" | "Média" | "Baixa"; reason: string }>>({});
  const [confirmedTasks, setConfirmedTasks] = useState<Record<string, boolean>>({});

  const [editingTask, setEditingTask] = useState<FarmTask | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDate, setEditDate] = useState("");
  const [editCategory, setEditCategory] = useState<"Irrigação" | "Adubação" | "Pulverização" | "Colheita" | "Manejo">("Manejo");
  const [editDescription, setEditDescription] = useState("");

  const startEditTask = (task: FarmTask) => {
    setEditingTask(task);
    setEditTitle(task.title);
    setEditDate(task.date);
    setEditCategory(task.category);
    setEditDescription(task.description);
  };

  const handleEditTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTask) return;
    if (!editTitle.trim() || !editDate) {
      toast.error("Por favor, preencha o título e a data da tarefa.");
      return;
    }

    setSaving(true);
    try {
      const { error } = await (supabase as any)
        .from('farm_tasks')
        .update({
          title: editTitle,
          date: editDate,
          category: editCategory,
          description: editDescription || "Sem observações."
        })
        .eq('id', Number(editingTask.id));

      if (error) throw error;

      toast.success("Tarefa atualizada com sucesso!");
      setEditingTask(null);
      fetchTasks();
    } catch (err) {
      console.error('Error editing task:', err);
      toast.error('Erro ao atualizar tarefa no Supabase.');
    } finally {
      setSaving(false);
    }
  };

  const fetchTasks = async () => {
    if (!profile?.id) return;
    setLoadingTasks(true);
    try {
      const { data, error } = await (supabase as any)
        .from('farm_tasks')
        .select('*')
        .eq('user_id', profile.id)
        .order('date', { ascending: true });

      if (error) throw error;

      const mapped: FarmTask[] = (data || []).map((t) => ({
        id: String(t.id),
        title: t.title,
        date: t.date,
        category: t.category as any,
        status: t.status as any,
        description: t.description
      }));
      setTasks(mapped);

      // Load priorities and confirmed states from localStorage
      const storedPriorities = localStorage.getItem(`task_priorities_${profile.id}`);
      if (storedPriorities) {
        try {
          setTaskPriorities(JSON.parse(storedPriorities));
        } catch (e) {
          console.error("Error loading task priorities:", e);
        }
      }
      const storedConfirmed = localStorage.getItem(`confirmed_tasks_${profile.id}`);
      if (storedConfirmed) {
        try {
          setConfirmedTasks(JSON.parse(storedConfirmed));
        } catch (e) {
          console.error("Error loading confirmed tasks:", e);
        }
      }
    } catch (err) {
      console.error('Error fetching farm tasks:', err);
      toast.error('Erro ao buscar tarefas do calendário.');
    } finally {
      setLoadingTasks(false);
    }
  };

  useEffect(() => {
    if (profile?.id) {
      fetchTasks();
    }
  }, [profile]);

  // Métodos e Helpers para Visão Notion e IA Priorização
  const handleSetPriorityManual = (taskId: string, priority: "Alta" | "Média" | "Baixa") => {
    if (!profile?.id) return;
    const existingReason = taskPriorities[taskId]?.reason || "Definido manualmente pelo produtor.";
    const updated = {
      ...taskPriorities,
      [taskId]: {
        priority,
        reason: existingReason
      }
    };
    setTaskPriorities(updated);
    localStorage.setItem(`task_priorities_${profile.id}`, JSON.stringify(updated));
    toast.success(`Prioridade da tarefa definida como ${priority}!`);
  };

  const handleRunAiPrioritization = async () => {
    if (tasks.length === 0) {
      toast.error("Nenhuma tarefa para priorizar.");
      return;
    }
    setPrioritizing(true);
    setPrioritizationStep(0);

    const stepsText = [
      "Agrupando tarefas por data de execução...",
      "Avaliando a janela crítica de cada atividade...",
      "Cruzando dependências entre adubação, colheita e pragas...",
      "Gerando diagnóstico de prioridade por inteligência artificial..."
    ];

    for (let i = 0; i < stepsText.length; i++) {
      setPrioritizationStep(i);
      await new Promise(resolve => setTimeout(resolve, 800));
    }

    if (!profile?.id) return;

    const newPriorities: Record<string, { priority: "Alta" | "Média" | "Baixa"; reason: string }> = { ...taskPriorities };

    tasks.forEach(task => {
      let priority: "Alta" | "Média" | "Baixa" = "Média";
      let reason = "";

      const today = new Date();
      const taskDate = new Date(task.date + "T12:00:00");
      const diffTime = taskDate.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (task.category === "Colheita") {
        if (diffDays <= 2) {
          priority = "Alta";
          reason = "A colheita de banana exige precisão milimétrica de data para evitar que os cachos passem do ponto de corte comercial.";
        } else {
          priority = "Média";
          reason = "Colheita agendada. A preparação da logística de caixas e ajudantes deve ser iniciada com antecedência.";
        }
      } else if (task.category === "Pulverização") {
        priority = "Alta";
        reason = "A pulverização (defensivos ou controle biológico) é crucial para prevenir a disseminação de Sigatoka Negra/Amarela e broca.";
      } else if (task.category === "Irrigação") {
        if (diffDays <= 1) {
          priority = "Alta";
          reason = "O estresse hídrico reduz o tamanho dos cachos. A irrigação nas bananeiras precisa de regularidade máxima.";
        } else {
          priority = "Média";
          reason = "Rega de rotina necessária para manter a umidade do solo na projeção da copa.";
        }
      } else if (task.category === "Adubação") {
        priority = "Média";
        reason = "A adubação de cobertura (NPK/Nitrogênio) fortalece a emissão foliar e deve ser aplicada com solo úmido.";
      } else {
        if (task.title.toLowerCase().includes("escoramento") || task.description.toLowerCase().includes("escorar") || task.title.toLowerCase().includes("tombamento")) {
          priority = "Alta";
          reason = "O escoramento de plantas com cachos pesados é prioridade para evitar perdas totais por ventos fortes.";
        } else {
          priority = "Baixa";
          reason = "Manejo geral de rotina (desbaste de brotos, limpeza ou roçada). Pode ser planejado de forma flexível.";
        }
      }

      if (diffDays < 0 && task.status === "Pendente") {
        priority = "Alta";
        reason = `ATRASADA: Esta tarefa deveria ter sido executada em ${taskDate.toLocaleDateString('pt-BR')}. Risco de prejuízo produtivo.`;
      }

      newPriorities[task.id] = { priority, reason };
    });

    setTaskPriorities(newPriorities);
    localStorage.setItem(`task_priorities_${profile.id}`, JSON.stringify(newPriorities));
    setPrioritizing(false);
    toast.success("Tarefas priorizadas com inteligência artificial!");
  };

  const isTomorrow = (dateStr: string) => {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    
    const taskDate = new Date(dateStr + "T12:00:00");
    return (
      taskDate.getDate() === tomorrow.getDate() &&
      taskDate.getMonth() === tomorrow.getMonth() &&
      taskDate.getFullYear() === tomorrow.getFullYear()
    );
  };

  const handleConfirmTaskTomorrow = (taskId: string) => {
    if (!profile?.id) return;
    const updated = {
      ...confirmedTasks,
      [taskId]: true
    };
    setConfirmedTasks(updated);
    localStorage.setItem(`confirmed_tasks_${profile.id}`, JSON.stringify(updated));
    toast.success("Excelente! Bom trabalho amanhã na lavoura! 💪", {
      style: {
        borderRadius: "1rem",
        background: "#05160f",
        color: "#ecfdf5",
        border: "1px solid rgba(117, 252, 167, 0.15)",
        fontSize: "12px",
        fontWeight: "bold"
      }
    });
  };

  const handleRescheduleTask = async (task: FarmTask) => {
    if (!profile?.id) return;
    
    const currentDate = new Date(task.date + "T12:00:00");
    const nextDate = new Date(currentDate);
    nextDate.setDate(currentDate.getDate() + 1);
    
    const newDateStr = nextDate.toISOString().split('T')[0];
    
    setSaving(true);
    try {
      const { error } = await (supabase as any)
        .from('farm_tasks')
        .update({ date: newDateStr })
        .eq('id', Number(task.id));
        
      if (error) throw error;
      
      const updatedPriorities = { ...taskPriorities };
      updatedPriorities[task.id] = {
        priority: taskPriorities[task.id]?.priority || "Alta",
        reason: `Reagendada automaticamente devido a um imprevisto no dia anterior.`
      };
      setTaskPriorities(updatedPriorities);
      localStorage.setItem(`task_priorities_${profile.id}`, JSON.stringify(updatedPriorities));
      
      toast.success(`Entendido. A IA reagendou a tarefa "${task.title}" para o dia seguinte (${nextDate.toLocaleDateString('pt-BR')})!`, {
        style: {
          borderRadius: "1rem",
          background: "#180f02",
          color: "#fef3c7",
          border: "1px solid rgba(245, 158, 11, 0.15)",
          fontSize: "12px",
          fontWeight: "bold"
        }
      });
      
      fetchTasks();
    } catch (err) {
      console.error("Error rescheduling task:", err);
      toast.error("Erro ao reagendar tarefa.");
    } finally {
      setSaving(false);
    }
  };

  const getTaskPriorityScore = (taskId: string) => {
    const p = taskPriorities[taskId]?.priority;
    if (p === "Alta") return 3;
    if (p === "Média") return 2;
    if (p === "Baixa") return 1;
    return 2;
  };
  // Form states
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [category, setCategory] = useState<"Irrigação" | "Adubação" | "Pulverização" | "Colheita" | "Manejo">("Manejo");
  const [description, setDescription] = useState("");

  const [filterCategory, setFilterCategory] = useState<string>("Todos");

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !date) {
      toast.error("Por favor, preencha o título e a data da tarefa.");
      return;
    }
    if (!profile?.id) {
      toast.error("Usuário não identificado.");
      return;
    }

    setSaving(true);
    try {
      const { error } = await (supabase as any)
        .from('farm_tasks')
        .insert([{
          user_id: profile.id,
          title,
          date,
          category,
          status: "Pendente",
          description: description || "Sem observações."
        }]);

      if (error) throw error;

      toast.success("Tarefa agendada no calendário agrícola!");
      setTitle("");
      setDate("");
      setDescription("");
      fetchTasks();
    } catch (err) {
      console.error('Error adding farm task:', err);
      toast.error('Erro ao salvar agendamento no Supabase.');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = async (id: string) => {
    const task = tasks.find(t => t.id === id);
    if (!task) return;

    const newStatus = task.status === "Pendente" ? "Concluido" : "Pendente";

    try {
      const { error } = await (supabase as any)
        .from('farm_tasks')
        .update({ status: newStatus })
        .eq('id', Number(id));

      if (error) throw error;

      if (newStatus === "Concluido") {
        toast.success("Tarefa concluída!");
      } else {
        toast.success("Tarefa reaberta!");
      }
      fetchTasks();
    } catch (err) {
      console.error('Error toggling task status:', err);
      toast.error('Erro ao atualizar status da tarefa no Supabase.');
    }
  };

  const handleDeleteTask = async (id: string) => {
    if (!confirm("Deseja mesmo remover esta tarefa do calendário?")) return;
    try {
      const { error } = await (supabase as any)
        .from('farm_tasks')
        .delete()
        .eq('id', Number(id));

      if (error) throw error;

      toast.success("Tarefa removida do calendário.");
      fetchTasks();
    } catch (err) {
      console.error('Error deleting task:', err);
      toast.error('Erro ao deletar tarefa do Supabase.');
    }
  };

  const sortedTasks = [...tasks].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const filteredTasks = sortedTasks.filter(t => {
    return filterCategory === "Todos" || t.category === filterCategory;
  });

  const notionSortedTasks = [...tasks].sort((a, b) => {
    if (a.status === "Pendente" && b.status === "Concluido") return -1;
    if (a.status === "Concluido" && b.status === "Pendente") return 1;

    const scoreA = getTaskPriorityScore(a.id);
    const scoreB = getTaskPriorityScore(b.id);
    if (scoreA !== scoreB) return scoreB - scoreA;

    return new Date(a.date).getTime() - new Date(b.date).getTime();
  });

  const filteredNotionTasks = notionSortedTasks.filter(t => {
    return filterCategory === "Todos" || t.category === filterCategory;
  });

  return (
    <Layout>
      <div className="max-w-7xl mx-auto space-y-10 pb-20">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-4xl font-display font-bold text-white mb-2 flex items-center gap-3">
              <Calendar className="text-primary w-10 h-10" />
              Calendário Agrícola
            </h1>
            <p className="text-slate-400 text-lg">
              Planejamento e controle de tarefas, adubação, irrigação e colheitas da fazenda.
            </p>
          </div>
        </div>

        {/* Dashboard Widgets */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="glass-card p-6 rounded-3xl border-white/5 bg-zinc-900/20 text-center">
            <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest mb-1">Total de Tarefas</p>
            <p className="text-3xl font-bold text-white">{tasks.length}</p>
          </div>
          <div className="glass-card p-6 rounded-3xl border-white/5 bg-zinc-900/20 text-center">
            <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest mb-1">Tarefas Pendentes</p>
            <p className="text-3xl font-bold text-yellow-500">
              {tasks.filter(t => t.status === "Pendente").length}
            </p>
          </div>
          <div className="glass-card p-6 rounded-3xl border-white/5 bg-zinc-900/20 text-center">
            <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest mb-1">Concluídas</p>
            <p className="text-3xl font-bold text-emerald-400">
              {tasks.filter(t => t.status === "Concluido").length}
            </p>
          </div>
        </div>

        {/* View Mode Tabs (Notion style) */}
        <div className="flex border-b border-white/10 gap-6">
          <button
            onClick={() => setViewMode("standard")}
            className={`pb-4 font-bold text-xs uppercase tracking-wider transition-all relative cursor-pointer ${
              viewMode === "standard" ? "text-primary" : "text-slate-400 hover:text-white"
            }`}
          >
            Visão Cronológica
            {viewMode === "standard" && (
              <motion.div 
                layoutId="calendarTabLine"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" 
              />
            )}
          </button>
          <button
            onClick={() => setViewMode("notion")}
            className={`pb-4 font-bold text-xs uppercase tracking-wider transition-all relative cursor-pointer flex items-center gap-2 ${
              viewMode === "notion" ? "text-primary" : "text-slate-400 hover:text-white"
            }`}
          >
            <Sparkles size={14} />
            Visão Notion (Prioridade IA)
            {viewMode === "notion" && (
              <motion.div 
                layoutId="calendarTabLine"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" 
              />
            )}
          </button>
        </div>

        {/* Lembretes de Amanhã na Lavoura */}
        {profile?.id && tasks.filter(t => t.status === "Pendente" && isTomorrow(t.date) && !confirmedTasks[t.id]).length > 0 && (
          <div className="p-6 rounded-[2.5rem] border border-amber-500/20 bg-amber-500/5 space-y-4">
            <h3 className="text-sm font-bold text-amber-400 flex items-center gap-2">
              <Bell className="animate-bounce" size={16} /> Lembretes de Amanhã na Lavoura
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {tasks.filter(t => t.status === "Pendente" && isTomorrow(t.date) && !confirmedTasks[t.id]).map(task => (
                <div key={task.id} className="p-5 bg-zinc-950/60 border border-white/10 rounded-2xl flex flex-col justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex justify-between items-start">
                      <span className="text-[9px] font-black uppercase bg-amber-500/20 text-amber-400 border border-amber-500/30 px-2 py-0.5 rounded tracking-wider">
                        {task.category}
                      </span>
                    </div>
                    <h4 className="text-sm font-bold text-white mt-2">{task.title}</h4>
                    <p className="text-xs text-zinc-400 line-clamp-2">{task.description}</p>
                  </div>
                  
                  <div className="flex gap-2 pt-2 border-t border-white/5">
                    <button
                      onClick={() => handleConfirmTaskTomorrow(task.id)}
                      className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 rounded-xl text-[10px] uppercase tracking-wider transition-colors cursor-pointer"
                    >
                      Vou Fazer
                    </button>
                    <button
                      onClick={() => handleRescheduleTask(task)}
                      className="flex-1 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/20 font-bold py-2 rounded-xl text-[10px] uppercase tracking-wider transition-colors cursor-pointer"
                    >
                      Houve Imprevisto
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Calendar List Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Filter controls */}
            <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar">
              {["Todos", "Irrigação", "Adubação", "Pulverização", "Colheita", "Manejo"].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setFilterCategory(cat)}
                  className={`px-6 py-3 rounded-xl text-xs font-bold uppercase tracking-widest border transition-all whitespace-nowrap cursor-pointer shadow-md ${
                    filterCategory === cat 
                      ? "bg-primary border-primary text-white shadow-primary/20" 
                      : "bg-zinc-900/50 border-white/5 text-zinc-500 hover:text-white"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* AI Prioritizer Action Panel in Notion View */}
            {viewMode === "notion" && (
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-zinc-900/30 border border-white/5 p-6 rounded-[2rem]">
                <div>
                  <h3 className="font-bold text-white text-sm">Priorização Inteligente de Atividades</h3>
                  <p className="text-xs text-zinc-500 mt-1">Organize suas tarefas pelo nível de impacto agronômico calculado pela IA.</p>
                </div>
                <button
                  onClick={handleRunAiPrioritization}
                  disabled={priorizing}
                  className="bg-primary hover:bg-primary-dark text-white font-bold px-6 py-3 rounded-2xl flex items-center gap-2 cursor-pointer transition-all hover:scale-105 shadow-lg shadow-primary/20 text-xs uppercase tracking-widest disabled:opacity-50"
                >
                  {priorizing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Analisando...
                    </>
                  ) : (
                    <>
                      <Sparkles size={14} />
                      Priorizar com IA
                    </>
                  )}
                </button>
              </div>
            )}

            {/* List */}
            <div className="space-y-4">
              {viewMode === "standard" ? (
                filteredTasks.map((task) => {
                  const isPending = task.status === "Pendente";
                  
                  return (
                    <div
                      key={task.id}
                      className={`glass-card p-6 rounded-[2rem] border transition-all flex flex-col md:flex-row md:items-center justify-between gap-6 relative group ${
                        !isPending ? "border-emerald-500/10 bg-emerald-500/[0.01]" : "border-white/5 bg-zinc-900/40"
                      }`}
                    >
                      <div className="flex items-start gap-4">
                        {/* Checkbox button */}
                        <button
                          onClick={() => handleToggleStatus(task.id)}
                          className={`w-8 h-8 rounded-full border flex items-center justify-center shrink-0 transition-all cursor-pointer ${
                            !isPending 
                              ? "bg-emerald-500 border-emerald-500 text-white" 
                              : "border-white/10 hover:border-primary text-transparent bg-white/5"
                          }`}
                        >
                          <Check size={16} />
                        </button>

                        <div className="space-y-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className={`font-bold text-base ${!isPending ? "text-zinc-500 line-through" : "text-white"}`}>
                              {task.title}
                            </h3>
                            <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded border tracking-wider ${
                              task.category === "Adubação" ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" :
                              task.category === "Pulverização" ? "bg-yellow-500/10 border-yellow-500/20 text-yellow-400" :
                              task.category === "Colheita" ? "bg-blue-500/10 border-blue-500/20 text-blue-400" : "bg-zinc-500/10 border-white/5 text-zinc-400"
                            }`}>
                              {task.category}
                            </span>
                          </div>
                          <p className={`text-sm ${!isPending ? "text-zinc-600" : "text-zinc-400"} leading-relaxed`}>
                            {task.description}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between md:justify-end gap-6 border-t md:border-t-0 border-white/5 pt-4 md:pt-0 shrink-0">
                        {/* Date */}
                        <div className="flex items-center gap-2.5 text-zinc-500 text-xs font-semibold">
                          <Clock size={14} className="text-primary" />
                          <span>{new Date(task.date + "T00:00:00").toLocaleDateString('pt-BR')}</span>
                        </div>

                        <div className="flex gap-2">
                          <button
                            onClick={() => startEditTask(task)}
                            className="p-2 rounded-xl bg-white/5 hover:bg-primary/10 text-zinc-600 hover:text-primary transition-colors cursor-pointer opacity-0 group-hover:opacity-100"
                            title="Editar Tarefa"
                          >
                            <Pencil size={16} />
                          </button>
                          <button
                            onClick={() => handleDeleteTask(task.id)}
                            className="p-2 rounded-xl bg-white/5 hover:bg-red-500/10 text-zinc-600 hover:text-red-400 transition-colors cursor-pointer opacity-0 group-hover:opacity-100"
                            title="Excluir Tarefa"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                filteredNotionTasks.map((task) => {
                  const isPending = task.status === "Pendente";
                  const pInfo = taskPriorities[task.id] || { priority: "Média", reason: "" };
                  const pColor = pInfo.priority === "Alta" ? "border-l-4 border-red-500/70" :
                                pInfo.priority === "Baixa" ? "border-l-4 border-blue-500/70" : "border-l-4 border-amber-500/70";
                  
                  return (
                    <div
                      key={task.id}
                      className={`glass-card p-6 rounded-[2rem] border transition-all flex flex-col justify-between gap-4 relative group ${pColor} ${
                        !isPending ? "border-emerald-500/10 bg-emerald-500/[0.01] opacity-70" : "border-white/5 bg-zinc-900/40"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-4">
                          {/* Checkbox button */}
                          <button
                            onClick={() => handleToggleStatus(task.id)}
                            className={`w-8 h-8 rounded-full border flex items-center justify-center shrink-0 transition-all cursor-pointer ${
                              !isPending 
                                ? "bg-emerald-500 border-emerald-500 text-white" 
                                : "border-white/10 hover:border-primary text-transparent bg-white/5"
                            }`}
                          >
                            <Check size={16} />
                          </button>

                          <div className="space-y-1.5">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className={`font-bold text-base ${!isPending ? "text-zinc-500 line-through" : "text-white"}`}>
                                {task.title}
                              </h3>
                              <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded border tracking-wider ${
                                task.category === "Adubação" ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" :
                                task.category === "Pulverização" ? "bg-yellow-500/10 border-yellow-500/20 text-yellow-400" :
                                task.category === "Colheita" ? "bg-blue-500/10 border-blue-500/20 text-blue-400" : "bg-zinc-500/10 border-white/5 text-zinc-400"
                              }`}>
                                {task.category}
                              </span>

                              {/* Priority Badge */}
                              <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded border tracking-wider flex items-center gap-1 ${
                                pInfo.priority === "Alta" ? "bg-red-500/10 border-red-500/20 text-red-400" :
                                pInfo.priority === "Baixa" ? "bg-blue-500/10 border-blue-500/20 text-blue-400" : "bg-amber-500/10 border-amber-500/20 text-amber-400"
                              }`}>
                                {pInfo.priority}
                              </span>
                            </div>
                            <p className={`text-sm ${!isPending ? "text-zinc-600" : "text-zinc-400"} leading-relaxed`}>
                              {task.description}
                            </p>
                          </div>
                        </div>

                        {/* Manual override selection */}
                        {isPending && (
                          <div className="shrink-0">
                            <select
                              value={pInfo.priority}
                              onChange={(e) => handleSetPriorityManual(task.id, e.target.value as any)}
                              className="bg-black/40 border border-white/10 rounded-xl px-2.5 py-1.5 text-[10px] text-zinc-400 font-bold focus:outline-none cursor-pointer"
                            >
                              <option value="Alta">🔴 Alta</option>
                              <option value="Média">🟡 Média</option>
                              <option value="Baixa">🔵 Baixa</option>
                            </select>
                          </div>
                        )}
                      </div>

                      {/* AI Justification Quote block */}
                      {isPending && pInfo.reason && (
                        <div className="bg-emerald-50 border border-emerald-100 dark:bg-emerald-950/20 dark:border-emerald-800/30 px-4 py-3 rounded-2xl flex items-start gap-2 text-[11px] text-emerald-800 dark:text-emerald-300 leading-relaxed shadow-sm">
                          <Zap className="text-emerald-500 shrink-0 mt-0.5" size={12} />
                          <div>
                            <span className="font-bold text-emerald-900 dark:text-emerald-200">Justificativa IA:</span> {pInfo.reason}
                          </div>
                        </div>
                      )}

                      <div className="flex items-center justify-between md:justify-end gap-6 border-t border-white/5 pt-4 shrink-0">
                        {/* Date */}
                        <div className="flex items-center gap-2.5 text-zinc-500 text-xs font-semibold">
                          <Clock size={14} className="text-primary" />
                          <span>{new Date(task.date + "T00:00:00").toLocaleDateString('pt-BR')}</span>
                        </div>

                        <div className="flex gap-2">
                          <button
                            onClick={() => startEditTask(task)}
                            className="p-2 rounded-xl bg-white/5 hover:bg-primary/10 text-zinc-600 hover:text-primary transition-colors cursor-pointer opacity-0 group-hover:opacity-100"
                            title="Editar Tarefa"
                          >
                            <Pencil size={16} />
                          </button>
                          <button
                            onClick={() => handleDeleteTask(task.id)}
                            className="p-2 rounded-xl bg-white/5 hover:bg-red-500/10 text-zinc-600 hover:text-red-400 transition-colors cursor-pointer opacity-0 group-hover:opacity-100"
                            title="Excluir Tarefa"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}

              {loadingTasks && (
                <div className="flex flex-col items-center justify-center py-20 bg-zinc-900/10 rounded-[2.5rem] border border-dashed border-white/5 text-slate-500 gap-2">
                  <Loader2 className="w-6 h-6 text-primary animate-spin" />
                  <span className="text-xs font-bold uppercase tracking-widest text-zinc-600">Carregando tarefas...</span>
                </div>
              )}

              {!loadingTasks && (viewMode === "standard" ? filteredTasks.length === 0 : filteredNotionTasks.length === 0) && (
                <div className="text-center py-20 bg-zinc-900/10 rounded-[2.5rem] border border-dashed border-white/5 text-zinc-500">
                  Nenhuma atividade agendada.
                </div>
              )}
            </div>
          </div>

          {/* Form Column */}
          <div className="space-y-6">
            <div className="glass-card p-6 rounded-[2.5rem] border-white/5 bg-zinc-900/40">
              <div className="flex items-center gap-2.5 mb-6">
                <CalendarDays className="text-primary w-5 h-5" />
                <h3 className="text-lg font-bold text-white">Agendar Tarefa</h3>
              </div>

              <form onSubmit={handleAddTask} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">Tarefa</label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Ex: Pulverização gleba sul"
                    className="w-full bg-black/40 border border-white/10 rounded-2xl py-3.5 px-4 text-white text-sm focus:outline-none focus:border-primary/50"
                  />
                </div>

                <div className="grid grid-cols-1 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-300">Categoria</label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value as any)}
                      className="w-full bg-zinc-900 border border-white/10 rounded-2xl py-3.5 px-4 text-white text-sm focus:outline-none h-[48px] cursor-pointer"
                    >
                      <option value="Manejo">Manejo Geral</option>
                      <option value="Irrigação">Irrigação</option>
                      <option value="Adubação">Adubação</option>
                      <option value="Pulverização">Pulverização</option>
                      <option value="Colheita">Colheita</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-300">Data de Execução</label>
                    <input
                      type="date"
                      required
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className="w-full bg-black/40 border border-white/10 rounded-2xl py-3 px-4 text-white text-sm focus:outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">Descrição / Notas</label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Especificações do manejo, insumos a usar, etc..."
                    className="w-full bg-black/40 border border-white/10 rounded-2xl py-3 px-4 text-white text-sm focus:outline-none min-h-[100px] resize-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={saving}
                  className="w-full bg-primary hover:bg-primary-dark text-white font-bold py-3.5 rounded-2xl transition-all cursor-pointer text-sm flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    "Confirmar Agendamento"
                  )}
                </button>
              </form>
            </div>

            {/* Crop cycle info */}
            <div className="glass-card p-6 rounded-3xl border-white/5 bg-zinc-900/30">
              <div className="flex gap-3">
                <Info className="text-primary shrink-0" size={20} />
                <div>
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-1">Manejo da Bananeira</h4>
                  <p className="text-[11px] text-zinc-500 leading-relaxed">
                    O desbaste (eliminação de brotos excedentes) deve ser feito a cada 30-45 dias. O escoramento de plantas com caixas pesados previne tombamentos por vento. A eliminação do coração (descoletamento) melhora o peso dos frutos.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* EDIT TASK DIALOG */}
      <AnimatePresence>
        {editingTask !== null && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setEditingTask(null)}
              className="fixed inset-0 bg-black/80 backdrop-blur-md"
            />

            <motion.div
              initial={{ scale: 0.95, y: 20, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.95, y: 20, opacity: 0 }}
              className="bg-zinc-950 border border-white/10 rounded-[2.5rem] w-full max-w-md p-8 relative z-10 overflow-hidden shadow-2xl"
            >
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xl font-bold text-white">Editar Tarefa</h3>
                <button
                  type="button"
                  onClick={() => setEditingTask(null)}
                  className="p-1.5 rounded-lg hover:bg-white/5 text-zinc-400 hover:text-white transition-colors cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>
              <p className="text-xs text-zinc-400 mb-6">
                Atualize as informações do agendamento selecionado.
              </p>

              <form onSubmit={handleEditTask} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">Tarefa</label>
                  <input
                    type="text"
                    required
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    placeholder="Ex: Pulverização gleba sul"
                    className="w-full bg-black/40 border border-white/10 rounded-2xl py-3.5 px-4 text-white text-sm focus:outline-none focus:border-primary/50"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-300">Categoria</label>
                    <select
                      value={editCategory}
                      onChange={(e) => setEditCategory(e.target.value as any)}
                      className="w-full bg-zinc-900 border border-white/10 rounded-2xl py-3.5 px-4 text-white text-sm focus:outline-none h-[48px] cursor-pointer"
                    >
                      <option value="Manejo">Manejo Geral</option>
                      <option value="Irrigação">Irrigação</option>
                      <option value="Adubação">Adubação</option>
                      <option value="Pulverização">Pulverização</option>
                      <option value="Colheita">Colheita</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-300">Data de Execução</label>
                    <input
                      type="date"
                      required
                      value={editDate}
                      onChange={(e) => setEditDate(e.target.value)}
                      className="w-full bg-black/40 border border-white/10 rounded-2xl py-3 px-4 text-white text-sm focus:outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">Descrição / Notas</label>
                  <textarea
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    placeholder="Especificações do manejo, insumos a usar, etc..."
                    className="w-full bg-black/40 border border-white/10 rounded-2xl py-3 px-4 text-white text-sm focus:outline-none min-h-[100px] resize-none"
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex-1 bg-primary hover:bg-primary-dark text-white font-bold py-3.5 rounded-2xl transition-all cursor-pointer text-sm shadow-md flex items-center justify-center gap-2"
                  >
                    {saving ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Salvando...
                      </>
                    ) : (
                      "Salvar Alterações"
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingTask(null)}
                    className="px-5 border border-white/10 hover:bg-white/5 text-zinc-400 hover:text-white font-bold rounded-2xl transition-colors cursor-pointer text-sm"
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </Layout>
  );
}
