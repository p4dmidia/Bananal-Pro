import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Layout from "../../components/Layout/Layout";
import { motion } from "motion/react";
import { 
  TrendingUp, 
  PlayCircle, 
  Trophy, 
  ArrowUpRight, 
  Loader2, 
  AlertCircle, 
  Settings, 
  CloudSun,
  Calendar,
  Sprout,
  DollarSign,
  Video,
  Bell,
  Eye
} from "lucide-react";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../contexts/AuthContext";
import { getUserFirstName } from "../../lib/utils";
import { toast } from "react-hot-toast";

export default function Overview() {
  const { user, profile, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [city, setCity] = useState("Sete Lagoas");
  const [state, setState] = useState("MG");

  const [farmStats, setFarmStats] = useState({
    totalArea: 5.0,
    variety: "Cavendish & Prata",
    estimatedYield: "12.5 ton",
    healthStatus: "Excelente",
    financeText: "Lucro Ativo",
    isProfit: true
  });

  const [weatherWidget, setWeatherWidget] = useState({
    temp: 26,
    humidity: 78,
    rainChance: 20,
    wind: 8,
    condition: "Ensolarado com poucas nuvens"
  });

  const [recentTasks, setRecentTasks] = useState<any[]>([]);
  const [recentLessons, setRecentLessons] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);

  const mapWmoCode = (code: number): string => {
    if (code === 0) return "Ensolarado / Céu Limpo";
    if (code <= 3) return "Parcialmente Nublado";
    if (code === 45 || code === 48) return "Nevoeiro / Névoa";
    if (code <= 55) return "Chuvisco Leve";
    if (code <= 65) return "Chuva Moderada";
    if (code <= 75) return "Neve / Granizo";
    if (code <= 82) return "Pancadas de Chuva";
    return "Tempestade / Trovoadas";
  };

  const getAgroAdvice = () => {
    if (weatherWidget.wind > 10) {
      return "Evite pulverizações hoje. Ventos acima de 10 km/h provocam alta deriva de defensivos.";
    }
    if (weatherWidget.humidity < 55) {
      return "Evite pulverizações foliares. Umidade muito baixa causa evaporação rápida de gotas.";
    }
    if (weatherWidget.rainChance > 70) {
      return "Risco de lixiviação elevado. Evite adubações pesadas de solo se houver previsão de temporais.";
    }
    return "Condições ideais para aplicação de adubo foliar, desbaste de filhos e colheita.";
  };

  useEffect(() => {
    if (authLoading) return;
    if (!profile?.id) {
      setLoading(false);
      return;
    }

    const loadData = async () => {
      setLoading(true);
      try {
        // 1. Load farm parameters from localStorage
        let hectares = 5.0;
        const storedParams = localStorage.getItem(`farm_parameters_${profile.id}`);
        if (storedParams) {
          try {
            const parsed = JSON.parse(storedParams);
            if (parsed.hectares !== undefined) hectares = parsed.hectares;
          } catch (e) {
            console.error(e);
          }
        }

        // 2. Fetch real transactions from Supabase
        let financeText = "Sem Lançamentos";
        let isProfit = true;
        try {
          const { data: txs } = await supabase
            .from('transactions')
            .select('amount, type')
            .eq('user_id', profile.id);

          if (txs && txs.length > 0) {
            const balance = txs.reduce((sum, t) => sum + (t.type === 'Receita' ? t.amount : -t.amount), 0);
            financeText = balance >= 0 ? "Lucro Ativo" : "Custo Elevado";
            isProfit = balance >= 0;
          }
        } catch (err) {
          console.error("Error fetching dashboard transactions:", err);
        }

        // 3. Fetch real-time weather
        let weatherData = {
          temp: 26,
          humidity: 78,
          rainChance: 20,
          wind: 8,
          condition: "Ensolarado com poucas nuvens"
        };
        
        let userCity = profile.city || "Sete Lagoas";
        let userState = profile.state || "MG";
        setCity(userCity);
        setState(userState);
        let lat = -19.4664;
        let lon = -44.2447;

        try {
          const geoRes = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(userCity)}&count=1&language=pt`);
          if (geoRes.ok) {
            const geoData = await geoRes.json();
            if (geoData.results && geoData.results.length > 0) {
              lat = geoData.results[0].latitude;
              lon = geoData.results[0].longitude;
            }
          }

          const weatherRes = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,wind_speed_10m,precipitation,weather_code&daily=precipitation_probability_max&timezone=auto`);
          if (weatherRes.ok) {
            const wData = await weatherRes.json();
            const cur = wData.current;
            weatherData = {
              temp: Math.round(cur.temperature_2m),
              humidity: Math.round(cur.relative_humidity_2m),
              wind: Math.round(cur.wind_speed_10m),
              rainChance: wData.daily.precipitation_probability_max ? wData.daily.precipitation_probability_max[0] : 0,
              condition: mapWmoCode(cur.weather_code)
            };
          }
        } catch (err) {
          console.error("Dashboard weather fetch failed:", err);
        }

        setWeatherWidget(weatherData);

        // 4. Load recent tasks from localStorage
        let tasksList: any[] = [];
        const storedTasks = localStorage.getItem(`farm_tasks_${profile.id}`);
        if (storedTasks) {
          try {
            const allTasks = JSON.parse(storedTasks);
            // Get first 2 pending tasks, sorted by date
            tasksList = allTasks
              .filter((t: any) => t.status === "Pendente")
              .sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime())
              .slice(0, 2)
              .map((t: any) => {
                const diff = new Date(t.date + "T12:00:00").getTime() - new Date().setHours(12, 0, 0, 0);
                const diffDays = Math.ceil(diff / (1000 * 60 * 60 * 24));
                let dateLabel = new Date(t.date + "T00:00:00").toLocaleDateString('pt-BR');
                if (diffDays === 0) dateLabel = "Hoje";
                else if (diffDays === 1) dateLabel = "Amanhã";
                return {
                  id: t.id,
                  title: t.title,
                  date: dateLabel,
                  category: t.category
                };
              });
          } catch (e) {
            console.error(e);
          }
        }
        
        // Fallback if no tasks
        if (tasksList.length === 0) {
          tasksList = [
            { id: "1", title: "Nenhuma atividade pendente no calendário.", date: "Tudo em dia", category: "Manejo" }
          ];
        }
        setRecentTasks(tasksList);

        // 5. Fetch recent lessons from Supabase
        let lessonsList: any[] = [];
        try {
          const { data: lessonsData } = await supabase
            .from('lessons')
            .select('id, title, duration, course_modules(title)')
            .order('created_at', { ascending: false })
            .limit(2);

          if (lessonsData && lessonsData.length > 0) {
            lessonsList = lessonsData.map((l: any) => ({
              id: String(l.id),
              title: l.title,
              duration: l.duration || "15 min",
              module: l.course_modules?.title || "Treinamento Geral"
            }));
          }
        } catch (err) {
          console.error("Error fetching lessons:", err);
        }

        // Fallback for lessons
        if (lessonsList.length === 0) {
          lessonsList = [
            { id: "1", title: "Controle Eficiente de Sigatoka Negra", duration: "18 min", module: "Proteção Sanitária" },
            { id: "2", title: "Manejo Nutricional da Bananeira Cavendish", duration: "24 min", module: "Fisiologia e Solo" }
          ];
        }
        setRecentLessons(lessonsList);

        // 6. Generate Alerts (Humidity + Stock low)
        const alertsList: any[] = [];
        
        // Weather humidity alert
        if (weatherData.humidity > 75) {
          alertsList.push({
            id: "humidity-alert",
            message: `Risco alto de proliferação de fungos foliares devido à umidade do ar elevada de ${weatherData.humidity}%.`,
            level: "warning"
          });
        }

        // Stock alerts
        const storedInventory = localStorage.getItem(`farm_inventory_${profile.id}`);
        if (storedInventory) {
          try {
            const stockItems = JSON.parse(storedInventory);
            const lowStock = stockItems.filter((i: any) => i.quantity < i.minQuantity);
            lowStock.forEach((item: any, idx: number) => {
              alertsList.push({
                id: `stock-alert-${idx}`,
                message: `Estoque do Insumo '${item.name}' atingiu nível crítico (${item.quantity}${item.unit}).`,
                level: "danger"
              });
            });
          } catch (e) {
            console.error(e);
          }
        }

        // Fallback / standard alert if list is empty
        if (alertsList.length === 0) {
          alertsList.push({
            id: "safe-alert",
            message: "Nenhum alerta fitossanitário crítico. Lavouras operando em conformidade.",
            level: "success"
          });
        }
        setAlerts(alertsList);

        // Calculate farm stats
        const isCritical = alertsList.some(a => a.level === "danger");
        setFarmStats({
          totalArea: hectares,
          variety: "Cavendish & Prata",
          estimatedYield: `${(hectares * 2.5).toFixed(1)} ton`,
          healthStatus: isCritical ? "Atenção" : "Excelente",
          financeText,
          isProfit
        });

      } catch (err) {
        console.error("Dashboard data load failed:", err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [authLoading, profile]);

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="w-10 h-10 text-primary animate-spin" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto space-y-8 pb-20">
        
        {/* Welcome Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <h1 className="text-4xl font-display font-black mb-2 text-white">
              Olá, {getUserFirstName(profile, user)}! 🍌
            </h1>
            <p className="text-slate-400 text-base">
              Acompanhe o monitoramento da sua lavoura e mantenha sua produção de banana no máximo potencial.
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <span className="text-[11px] font-black uppercase px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-full flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              Fazenda Ativa
            </span>
          </div>
        </div>

        {/* Agro Indicators Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="glass-card p-6 rounded-[2rem] border-white/5 bg-zinc-900/30">
            <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest mb-1">Área Monitorada</p>
            <h3 className="text-3xl font-display font-black text-white">{farmStats.totalArea} <span className="text-sm font-semibold text-zinc-400">hectares</span></h3>
            <p className="text-[10px] text-zinc-600 mt-2 font-medium">Cultivo: {farmStats.variety}</p>
          </div>

          <div className="glass-card p-6 rounded-[2rem] border-white/5 bg-zinc-900/30">
            <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest mb-1">Produção Estimada</p>
            <h3 className="text-3xl font-display font-black text-white">{farmStats.estimatedYield}</h3>
            <p className="text-[10px] text-zinc-600 mt-2 font-medium">Previsão de colheita para o ciclo atual</p>
          </div>

          <div className="glass-card p-6 rounded-[2rem] border-white/5 bg-zinc-900/30">
            <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest mb-1">Sanidade Geral</p>
            <h3 className="text-3xl font-display font-black text-emerald-400">{farmStats.healthStatus}</h3>
            <p className="text-[10px] text-zinc-600 mt-2 font-medium">Análise baseada em dados fitossanitários</p>
          </div>

          <div className="glass-card p-6 rounded-[2rem] border-white/5 bg-primary/5 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 text-white group-hover:scale-110 transition-transform">
              <DollarSign size={50} />
            </div>
            <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1">Financeiro Fazenda</p>
            <h3 className={`text-3xl font-display font-black ${farmStats.isProfit ? 'text-white' : 'text-red-400'}`}>
              {farmStats.financeText}
            </h3>
            <p className="text-[10px] text-zinc-600 mt-2 font-medium">Fluxo de Caixa da Fazenda</p>
          </div>
        </div>

        {/* Alerts and Climate Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Weather & Recommendations */}
          <div className="lg:col-span-2 glass-card p-8 rounded-[2.5rem] border-white/5 bg-zinc-900/40 relative overflow-hidden flex flex-col justify-between min-h-[300px]">
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl" />
            
            <div className="relative z-10 flex justify-between items-start flex-wrap gap-4">
              <div>
                <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">CLIMA EM TEMPO REAL ({city}/{state})</p>
                <h3 className="text-4xl font-display font-black text-white mt-4">{weatherWidget.temp}°C</h3>
                <p className="text-sm text-zinc-400 mt-2 font-medium">{weatherWidget.condition}</p>
              </div>
              <CloudSun size={64} className="text-primary animate-pulse" />
            </div>

            <div className="relative z-10 grid grid-cols-3 gap-4 border-t border-white/5 pt-6 mt-8">
              <div>
                <p className="text-[9px] text-zinc-500 font-black uppercase">Umidade do Ar</p>
                <p className="text-sm font-bold text-white mt-0.5">{weatherWidget.humidity}%</p>
              </div>
              <div>
                <p className="text-[9px] text-zinc-500 font-black uppercase">Vento</p>
                <p className="text-sm font-bold text-white mt-0.5">{weatherWidget.wind} km/h</p>
              </div>
              <div>
                <p className="text-[9px] text-zinc-500 font-black uppercase">Chuva</p>
                <p className="text-sm font-bold text-white mt-0.5">{weatherWidget.rainChance}%</p>
              </div>
            </div>

            <div className="relative z-10 bg-primary/5 border border-primary/20 p-4 rounded-2xl flex items-center gap-3 mt-6">
              <Sprout className="text-primary shrink-0" size={18} />
              <p className="text-xs text-zinc-400 leading-relaxed">
                <span className="text-white font-bold">Conselho Agrícola:</span> {getAgroAdvice()}
              </p>
            </div>
          </div>

          {/* Critical Warnings */}
          <div className="space-y-6">
            <h3 className="text-xl font-bold text-white">Alertas Críticos</h3>
            <div className="space-y-4">
              {alerts.map(a => (
                <div key={a.id} className={`p-5 border rounded-3xl flex gap-3 ${
                  a.level === 'danger' 
                    ? "bg-red-500/5 border-red-500/20 text-red-400" 
                    : "bg-yellow-500/5 border-yellow-500/20 text-yellow-400"
                }`}>
                  <AlertCircle className="shrink-0" size={20} />
                  <p className="text-xs text-zinc-400 leading-relaxed font-medium">{a.message}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Tasks and Learning Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Tasks Widget */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-2xl font-display font-bold text-white flex items-center gap-2">
                <Calendar className="text-primary" size={20} />
                Próximas Atividades
              </h3>
              <Link to="/calendario" className="text-xs text-primary font-bold hover:underline">Ver Calendário Completo</Link>
            </div>

            <div className="glass-card rounded-[2.5rem] border-white/5 bg-zinc-900/40 divide-y divide-white/5">
              {recentTasks.map(t => (
                <div key={t.id} className="p-6 flex justify-between items-center hover:bg-white/[0.01] transition-colors first:rounded-t-[2.5rem] last:rounded-b-[2.5rem]">
                  <div>
                    <h4 className="font-bold text-white text-sm">{t.title}</h4>
                    <span className="text-[9px] font-black uppercase text-zinc-500 tracking-wider bg-white/5 border border-white/5 px-2 py-0.5 rounded mt-1.5 inline-block">
                      {t.category}
                    </span>
                  </div>
                  <span className="text-xs text-zinc-400 font-bold">{t.date}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Courses / Lessons Widget */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-2xl font-display font-bold text-white flex items-center gap-2">
                <PlayCircle className="text-primary" size={20} />
                Treinamentos Recentes
              </h3>
              <Link to="/cursos" className="text-xs text-primary font-bold hover:underline">Ver Catálogo</Link>
            </div>

            <div className="glass-card rounded-[2.5rem] border-white/5 bg-zinc-900/40 divide-y divide-white/5">
              {recentLessons.map(l => (
                <div key={l.id} className="p-6 flex justify-between items-center hover:bg-white/[0.01] transition-colors first:rounded-t-[2.5rem] last:rounded-b-[2.5rem]">
                  <div>
                    <h4 className="font-bold text-white text-sm">{l.title}</h4>
                    <p className="text-[10px] text-zinc-500 mt-1 font-medium">Módulo: {l.module}</p>
                  </div>
                  <span className="text-xs text-zinc-400 font-bold shrink-0">{l.duration}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
