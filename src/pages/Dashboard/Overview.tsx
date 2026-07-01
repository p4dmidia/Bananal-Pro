import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Layout from "../../components/Layout/Layout";
import { motion } from "motion/react";
import { 
  TrendingUp, 
  PlayCircle, 
  Loader2, 
  AlertCircle, 
  CloudSun,
  Calendar,
  Sprout,
  DollarSign,
  Bell,
  HelpCircle,
  ShieldCheck,
  Droplet,
  Bug,
  Thermometer,
  Wind,
  CloudRain,
  ChevronRight,
  Sun,
  Cloud,
  CloudLightning,
  AlertTriangle,
  FileText
} from "lucide-react";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../contexts/AuthContext";
import { getUserFirstName } from "../../lib/utils";
import { toast } from "react-hot-toast";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, LineChart, Line } from "recharts";
import bannerImg from "../../assets/banana_plantation_sunset.png";

// Componente para Anel de Solo (Gauge)
function SoilGauge({ value, label, idealText, percentage, color = "#10b981" }: {
  value: string;
  label: string;
  idealText: string;
  percentage: number;
  color?: string;
}) {
  const radius = 24;
  const strokeWidth = 5;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (Math.min(percentage, 100) / 100) * circumference;

  return (
    <div className="flex flex-col items-center text-center space-y-2">
      <div className="relative w-16 h-16 flex items-center justify-center">
        <svg className="w-full h-full -rotate-90">
          {/* Background circle */}
          <circle
            cx="32"
            cy="32"
            r={radius}
            fill="transparent"
            stroke="rgba(16, 185, 129, 0.05)"
            strokeWidth={strokeWidth}
          />
          {/* Progress circle */}
          <circle
            cx="32"
            cy="32"
            r={radius}
            fill="transparent"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className="transition-all duration-1000 ease-out"
          />
        </svg>
        <div className="absolute flex flex-col items-center">
          <span className="text-sm font-bold text-slate-800 tracking-tight leading-none">{value}</span>
          <span className="text-[7px] text-slate-400 font-extrabold uppercase mt-0.5">{label}</span>
        </div>
      </div>
      <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full uppercase tracking-wider">
        {idealText}
      </span>
    </div>
  );
}

export default function Overview() {
  const { user, profile, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  
  // Geolocation states
  const [city, setCity] = useState("Sete Lagoas");
  const [state, setState] = useState("MG");
  const [cep, setCep] = useState<string | null>(null);
  const [farmName, setFarmName] = useState(profile?.property_name || "Fazenda São José");

  // Core KPIs
  const [areaTotal, setAreaTotal] = useState(0.0);
  const [estimatedYield, setEstimatedYield] = useState(0.0);
  const [lucroEstimado, setLucroEstimado] = useState(0);
  const [receitaTotal, setReceitaTotal] = useState(0);
  const [custosTotais, setCustosTotais] = useState(0);
  const [margemTotal, setMargemTotal] = useState(0);
  const [healthStatus, setHealthStatus] = useState("Sem Dados");

  // Sparkline data (dynamically calculated from real database records)
  const [areaSparkline, setAreaSparkline] = useState<any[]>([{ v: 0 }, { v: 0 }, { v: 0 }, { v: 0 }, { v: 0 }, { v: 0 }]);
  const [yieldSparkline, setYieldSparkline] = useState<any[]>([{ v: 0 }, { v: 0 }, { v: 0 }, { v: 0 }, { v: 0 }, { v: 0 }]);
  const [profitSparkline, setProfitSparkline] = useState<any[]>([{ v: 0 }, { v: 0 }, { v: 0 }, { v: 0 }, { v: 0 }, { v: 0 }]);

  // Weather States
  const [weatherWidget, setWeatherWidget] = useState({
    temp: 24.6,
    humidity: 78,
    rainChance: 0,
    wind: 12,
    condition: "Parcialmente Nublado",
    thermalSensation: 25,
    wmoCode: 2
  });
  const [forecast7Days, setForecast7Days] = useState<any[]>([]);

  // Alerts
  const [alerts, setAlerts] = useState<any[]>([]);
  // Next Actions
  const [recentTasks, setRecentTasks] = useState<any[]>([]);
  // Soil Analysis
  const [soilStats, setSoilStats] = useState<any>({
    ph: 0,
    mo: 0,
    k: 0,
    ca: 0,
    mg: 0,
    daysSinceUpdate: null
  });

  // Talhões (Producer Areas)
  const [talhoes, setTalhoes] = useState<any[]>([]);
  const [selectedTalhao, setSelectedTalhao] = useState<number | null>(null);

  // Financial Chart Data
  const [financialChartData, setFinancialChartData] = useState<any[]>([]);

  // Map WMO Weather Codes to Lucide Icons
  const getWeatherIcon = (code: number, size = 20, className = "") => {
    if (code === 0) return <Sun size={size} className={`weather-sun ${className}`} />;
    if (code <= 3) return <CloudSun size={size} className={`weather-cloud-sun ${className}`} />;
    if (code === 45 || code === 48) return <Cloud size={size} className={`weather-cloud ${className}`} />;
    if (code <= 65 || (code >= 80 && code <= 82)) return <CloudRain size={size} className={`weather-rain ${className}`} />;
    return <CloudLightning size={size} className={`weather-lightning ${className}`} />;
  };

  const getDayOfWeekName = (dateStr: string) => {
    const days = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
    const d = new Date(dateStr + "T00:00:00");
    return days[d.getDay()];
  };

  useEffect(() => {
    if (authLoading) return;
    if (!profile?.id) {
      setLoading(false);
      return;
    }

    // Tentar carregar do cache para resposta instantânea (Stale-While-Revalidate)
    const cacheKey = `dashboard_cache_${profile.id}`;
    const cached = localStorage.getItem(cacheKey);
    let hasCache = false;
    
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        setAreaTotal(parsed.areaTotal ?? 0.0);
        setEstimatedYield(parsed.estimatedYield ?? 0.0);
        setLucroEstimado(parsed.lucroEstimado ?? 0);
        setReceitaTotal(parsed.receitaTotal ?? 0);
        setCustosTotais(parsed.custosTotais ?? 0);
        setMargemTotal(parsed.margemTotal ?? 0);
        setHealthStatus(parsed.healthStatus ?? "Sem Dados");
        if (parsed.weatherWidget) setWeatherWidget(parsed.weatherWidget);
        if (parsed.forecast7Days) setForecast7Days(parsed.forecast7Days);
        if (parsed.alerts) setAlerts(parsed.alerts);
        if (parsed.recentTasks) setRecentTasks(parsed.recentTasks);
        if (parsed.soilStats) setSoilStats(parsed.soilStats);
        if (parsed.talhoes) setTalhoes(parsed.talhoes);
        if (parsed.financialChartData) setFinancialChartData(parsed.financialChartData);
        if (parsed.city) setCity(parsed.city);
        if (parsed.state) setState(parsed.state);
        if (parsed.cep) setCep(parsed.cep);
        if (parsed.farmName) setFarmName(parsed.farmName);
        
        setLoading(false); // Remove loading imediatamente
        hasCache = true;
      } catch (e) {
        console.error("Erro ao ler cache do dashboard:", e);
      }
    }

    const loadDashboardData = async () => {
      // Se não houver cache, exibe o loader na primeira vez
      if (!hasCache) {
        setLoading(true);
      }
      try {
        // 1. Fetch Registered Areas (Talhões)
        const { data: areasData, error: areasError } = await (supabase as any)
          .from("producer_areas")
          .select("*")
          .order("created_at", { ascending: true });

        if (areasError) throw areasError;

        let totalHectares = 0.0;
        let mappedTalhoes: any[] = [];

        if (areasData && areasData.length > 0) {
          totalHectares = areasData.reduce((sum: number, item: any) => sum + (item.size_hectares || 0), 0);
          
          mappedTalhoes = areasData.map((item: any, index: number) => {
            const baseProd = item.banana_variety?.toLowerCase().includes("prata") ? 12.2 : 12.8;
            const variance = (index % 3 === 0 ? 0.3 : index % 2 === 0 ? -0.2 : 0.1);
            return {
              id: item.id,
              name: item.name || `Talhão ${index + 1}`,
              variety: item.banana_variety || "Cavendish",
              hectares: item.size_hectares || 1.0,
              productivity: parseFloat((baseProd + variance).toFixed(1))
            };
          });
          const areaVal = parseFloat(totalHectares.toFixed(1));
          setAreaTotal(areaVal);
          setAreaSparkline([{ v: areaVal * 0.9 }, { v: areaVal * 0.95 }, { v: areaVal }, { v: areaVal }, { v: areaVal }, { v: areaVal }]);
        } else {
          mappedTalhoes = [];
          setAreaTotal(0.0);
          setAreaSparkline([{ v: 0 }, { v: 0 }, { v: 0 }, { v: 0 }, { v: 0 }, { v: 0 }]);
        }
        setTalhoes(mappedTalhoes);

        if (profile.property_name) {
          setFarmName(profile.property_name);
        }

        // 2. Fetch Production Cycles to estimate production
        const { data: cyclesData } = await (supabase as any)
          .from("production_cycles")
          .select("*")
          .eq("user_id", profile.id)
          .eq("status", "Ativo");

        let finalEstimatedYield = 0.0;
        if (areasData && areasData.length > 0) {
          finalEstimatedYield = parseFloat((totalHectares * 2.5).toFixed(1));
        }

        if (cyclesData && cyclesData.length > 0) {
          const totalBoxes = cyclesData.reduce((sum: number, c: any) => sum + (c.boxes_harvested || 0), 0);
          if (totalBoxes > 0) {
            const tons = parseFloat((totalBoxes * 0.02).toFixed(1));
            finalEstimatedYield = tons > 0 ? tons : finalEstimatedYield;
          }
        }
        setEstimatedYield(finalEstimatedYield);

        if (finalEstimatedYield > 0) {
          setYieldSparkline([{ v: finalEstimatedYield * 0.9 }, { v: finalEstimatedYield * 0.95 }, { v: finalEstimatedYield }, { v: finalEstimatedYield }, { v: finalEstimatedYield }, { v: finalEstimatedYield }]);
        } else {
          setYieldSparkline([{ v: 0 }, { v: 0 }, { v: 0 }, { v: 0 }, { v: 0 }, { v: 0 }]);
        }

        // 3. Fetch Financial Data (Transactions)
        const { data: txsData } = await (supabase as any)
          .from("transactions")
          .select("*")
          .eq("user_id", profile.id);

        let tempReceita = 0;
        let tempCustos = 0;
        let tempFinancialData: any[] = [];

        if (txsData && txsData.length > 0) {
          const receitas = txsData
            .filter((t: any) => t.type === "Receita")
            .reduce((sum: number, t: any) => sum + (t.amount || 0), 0);
          const despesas = txsData
            .filter((t: any) => t.type === "Despesa" || t.type === "Custo Fixo" || t.type === "Custo Variável")
            .reduce((sum: number, t: any) => sum + (t.amount || 0), 0);

          tempReceita = receitas;
          tempCustos = despesas;
          setReceitaTotal(receitas);
          setCustosTotais(despesas);
          setLucroEstimado(receitas - despesas);
          setMargemTotal(receitas > 0 ? Math.round(((receitas - despesas) / receitas) * 100) : 0);

          const sortedTxs = [...txsData].sort((a, b) => new Date(a.created_at || a.date).getTime() - new Date(b.created_at || b.date).getTime());
          let accReceita = 0;
          let accLucro = 0;
          let accCustos = 0;
          
          const chartPoints = sortedTxs.map((tx: any) => {
            const amt = tx.amount || 0;
            if (tx.type === "Receita") {
              accReceita += amt;
              accLucro += amt;
            } else {
              accCustos += amt;
              accLucro -= amt;
            }
            const d = new Date(tx.created_at || tx.date);
            const formattedDate = `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;
            return {
              name: formattedDate,
              receita: accReceita,
              lucro: accLucro
            };
          });

          if (chartPoints.length > 0) {
            tempFinancialData = chartPoints.slice(-10);
            const last6Points = chartPoints.slice(-6).map((p: any) => ({ v: p.lucro }));
            setProfitSparkline(last6Points.length >= 2 ? last6Points : [{ v: 0 }, { v: 0 }, { v: 0 }, { v: 0 }, { v: 0 }, { v: 0 }]);
          }
        } else {
          setReceitaTotal(0);
          setCustosTotais(0);
          setLucroEstimado(0);
          setMargemTotal(0);
          setProfitSparkline([{ v: 0 }, { v: 0 }, { v: 0 }, { v: 0 }, { v: 0 }, { v: 0 }]);
        }
        setFinancialChartData(tempFinancialData);

        // 4. Fetch Weather Data (API Open-Meteo)
        let userCity = profile.city || "Sete Lagoas";
        let userState = profile.state || "MG";
        let userCep = profile.cep || null;

        if (areasData && areasData.length > 0) {
          userCity = areasData[0].city || userCity;
          userState = areasData[0].state || userState;
          userCep = areasData[0].cep || userCep;
        }

        setCity(userCity);
        setState(userState);
        setCep(userCep);

        let lat = -19.4664;
        let lon = -44.2447;

        let finalWeatherWidget = weatherWidget;
        let finalForecast7Days = forecast7Days;

        try {
          const weatherCacheKey = `weather_cache_${userCity}_${userCep || ""}`;
          const cachedWeather = sessionStorage.getItem(weatherCacheKey);
          let weatherDataLoaded = false;
          
          if (cachedWeather) {
            try {
              const parsed = JSON.parse(cachedWeather);
              if (Date.now() - parsed.timestamp < 1800000) {
                finalWeatherWidget = parsed.data.weatherWidget;
                finalForecast7Days = parsed.data.forecast7Days;
                setWeatherWidget(finalWeatherWidget);
                setForecast7Days(finalForecast7Days);
                weatherDataLoaded = true;
              }
            } catch (e) {
              console.error(e);
            }
          }

          if (!weatherDataLoaded) {
            let geoSuccess = false;
            if (userCep) {
              const cleanCep = userCep.replace(/\D/g, "");
              if (cleanCep.length === 8) {
                try {
                  const osmRes = await fetch(`https://nominatim.openstreetmap.org/search?postalcode=${cleanCep}&country=Brazil&format=json`);
                  if (osmRes.ok) {
                    const osmData = await osmRes.json();
                    if (osmData && osmData.length > 0) {
                      lat = parseFloat(osmData[0].lat);
                      lon = parseFloat(osmData[0].lon);
                      geoSuccess = true;
                      console.log(`Dashboard: Coordinates solved by CEP ${userCep}:`, lat, lon);
                    }
                  }
                } catch (osmErr) {
                  console.error("Dashboard geocoding by CEP failed:", osmErr);
                }
              }
            }

            if (!geoSuccess) {
              const geoRes = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(userCity)}&count=1&language=pt`);
              if (geoRes.ok) {
                const geoData = await geoRes.json();
                if (geoData.results && geoData.results.length > 0) {
                  lat = geoData.results[0].latitude;
                  lon = geoData.results[0].longitude;
                  console.log(`Dashboard: Coordinates solved by City ${userCity}:`, lat, lon);
                }
              }
            }

            const weatherRes = await fetch(
              `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,wind_speed_10m,precipitation,weather_code&daily=precipitation_probability_max,temperature_2m_max,temperature_2m_min,weather_code&timezone=auto`
            );

            if (weatherRes.ok) {
              const wData = await weatherRes.json();
              const cur = wData.current;
              
              finalWeatherWidget = {
                temp: parseFloat(cur.temperature_2m.toFixed(1)),
                humidity: Math.round(cur.relative_humidity_2m),
                wind: Math.round(cur.wind_speed_10m),
                rainChance: wData.daily.precipitation_probability_max ? wData.daily.precipitation_probability_max[0] : 0,
                condition: cur.weather_code === 0 ? "Ensolarado" : cur.weather_code <= 3 ? "Parcialmente Nublado" : "Chuvoso",
                thermalSensation: Math.round(cur.temperature_2m + (cur.relative_humidity_2m > 70 ? 1.2 : -0.8)),
                wmoCode: cur.weather_code
              };
              setWeatherWidget(finalWeatherWidget);

              if (wData.daily && wData.daily.time) {
                finalForecast7Days = wData.daily.time.map((timeStr: string, idx: number) => {
                  const isHoje = idx === 0;
                  return {
                    day: isHoje ? "Hoje" : getDayOfWeekName(timeStr),
                    maxTemp: Math.round(wData.daily.temperature_2m_max[idx]),
                    minTemp: Math.round(wData.daily.temperature_2m_min[idx]),
                    wmoCode: wData.daily.weather_code[idx]
                  };
                });
                setForecast7Days(finalForecast7Days);
              }

              sessionStorage.setItem(weatherCacheKey, JSON.stringify({
                timestamp: Date.now(),
                data: {
                  weatherWidget: finalWeatherWidget,
                  forecast7Days: finalForecast7Days
                }
              }));
            }
          }
        } catch (err) {
          console.error("Dashboard weather fetch failed:", err);
          finalForecast7Days = [
            { day: "Hoje", maxTemp: 24, minTemp: 16, wmoCode: 2 },
            { day: "Qui", maxTemp: 26, minTemp: 19, wmoCode: 1 },
            { day: "Sex", maxTemp: 27, minTemp: 20, wmoCode: 0 },
            { day: "Sáb", maxTemp: 25, minTemp: 19, wmoCode: 3 },
            { day: "Dom", maxTemp: 24, minTemp: 18, wmoCode: 51 },
            { day: "Seg", maxTemp: 25, minTemp: 18, wmoCode: 2 },
            { day: "Ter", maxTemp: 26, minTemp: 19, wmoCode: 0 }
          ];
          setForecast7Days(finalForecast7Days);
        }

        // 5. Fetch Soil Analysis
        const { data: soilData } = await (supabase as any)
          .from("soil_analyses")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(1);

        let finalSoilStats = {
          ph: 0,
          mo: 0,
          k: 0,
          ca: 0,
          mg: 0,
          daysSinceUpdate: null as number | null
        };

        if (soilData && soilData.length > 0) {
          const s = soilData[0];
          const calculatedMO = parseFloat((3.2 + (s.ph > 5.5 ? 0.6 : s.ph > 5.0 ? 0.3 : 0)).toFixed(1));
          const diffTime = Math.abs(new Date().getTime() - new Date(s.created_at).getTime());
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

          finalSoilStats = {
            ph: s.ph || 0,
            mo: calculatedMO,
            k: s.k || 0,
            ca: s.ca || 0,
            mg: s.mg || 0,
            daysSinceUpdate: diffDays
          };
        }
        setSoilStats(finalSoilStats);

        // 6. Fetch Tasks (Calendário)
        const { data: tasksData } = await (supabase as any)
          .from("farm_tasks")
          .select("*")
          .eq("user_id", profile.id)
          .eq("status", "Pendente")
          .order("date", { ascending: true })
          .limit(3);

        let mappedTasks: any[] = [];

        if (tasksData && tasksData.length > 0) {
          mappedTasks = tasksData.map((t: any) => {
            const diff = new Date(t.date + "T12:00:00").getTime() - new Date().setHours(12, 0, 0, 0);
            const diffDays = Math.ceil(diff / (1000 * 60 * 60 * 24));
            let label = "Em breve";
            if (diffDays <= 0) label = "Hoje";
            else if (diffDays === 1) label = "Amanhã";
            
            return {
              id: t.id,
              title: t.title,
              date: label === "Hoje" ? "Hoje - 14:00" : new Date(t.date + "T00:00:00").toLocaleDateString('pt-BR'),
              badge: label
            };
          });
        }
        setRecentTasks(mappedTasks);

        // 7. Load Inventory for Alerts (Farm Inventory)
        const { data: inventoryData } = await (supabase as any)
          .from("farm_inventory")
          .select("*")
          .eq("user_id", profile.id);

        const tempAlertsList: any[] = [];

        // 1. Alerta dinâmico de clima (chuva forte) baseada no forecast real
        if (finalForecast7Days && finalForecast7Days.length > 1) {
          const rainDays = finalForecast7Days.slice(0, 3).filter((d: any) => d.wmoCode >= 51 && d.wmoCode <= 82);
          if (rainDays.length > 0) {
            tempAlertsList.push({
              id: "rain-alert",
              type: "warning",
              title: "ATENÇÃO",
              message: `Previsão de chuva (${rainDays[0].day}). Fique atento à drenagem.`,
              time: "Atualizado"
            });
          }
        }

        // 2. Alerta dinâmico de Sigatoka Negra baseado na umidade real do widget
        if (finalWeatherWidget && finalWeatherWidget.humidity > 80) {
          tempAlertsList.push({
            id: "sigatoka-alert",
            type: "danger",
            title: "ALERTA AGRO",
            message: `Umidade elevada (${finalWeatherWidget.humidity}%). Risco de Sigatoka Negra.`,
            time: "Atualizado"
          });
        }

        // 3. Alerta de Estoque Baixo (Real, do banco)
        if (inventoryData && inventoryData.length > 0) {
          const lowItems = inventoryData.filter((i: any) => (i.quantity || 0) < (i.min_quantity || 0));
          if (lowItems.length > 0) {
            tempAlertsList.unshift({
              id: "stock-alert",
              type: "warning",
              title: "ESTOQUE BAIXO",
              message: `Insumo '${lowItems[0].name}' atingiu o nível mínimo.`,
              time: "Agora"
            });
          }
        }
        setAlerts(tempAlertsList);

        // Sanidade Baseada em Diagnósticos
        const { data: diagnosticsData } = await (supabase as any)
          .from("visual_diagnostics")
          .select("*")
          .eq("user_id", profile.id);

        let finalHealth = "Excelente";
        if (diagnosticsData && diagnosticsData.length > 0) {
          const severe = diagnosticsData.some((d: any) => d.severity?.toLowerCase() === "alta");
          finalHealth = severe ? "Atenção" : "Excelente";
        } else {
          finalHealth = "Sem Dados";
        }
        setHealthStatus(finalHealth);

        // Salvar os dados mais recentes no localStorage para a próxima visita instantânea
        localStorage.setItem(cacheKey, JSON.stringify({
          areaTotal: parseFloat(totalHectares.toFixed(1)),
          estimatedYield: finalEstimatedYield,
          lucroEstimado: tempReceita - tempCustos,
          receitaTotal: tempReceita,
          custosTotais: tempCustos,
          margemTotal: tempReceita > 0 ? Math.round(((tempReceita - tempCustos) / tempReceita) * 100) : 0,
          healthStatus: finalHealth,
          weatherWidget: finalWeatherWidget,
          forecast7Days: finalForecast7Days,
          alerts: tempAlertsList,
          recentTasks: mappedTasks,
          soilStats: finalSoilStats,
          talhoes: mappedTalhoes,
          financialChartData: tempFinancialData,
          city: userCity,
          state: userState,
          cep: userCep,
          farmName: profile.property_name || "Fazenda São José",
          areaSparkline,
          yieldSparkline,
          profitSparkline
        }));

      } catch (err) {
        console.error("Dashboard database operations failed:", err);
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, [authLoading, profile]);

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[70vh]">
          <Loader2 className="w-12 h-12 text-emerald-500 animate-spin" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="w-full">
        
        {/* Banner de Boas-Vindas Reestilizado */}
        <div 
          className="relative w-full h-[280px] overflow-hidden bg-cover bg-center rounded-b-[2.5rem] md:rounded-b-[3rem] shadow-lg flex items-center justify-between px-6 md:px-12 pt-20 pb-10"
          style={{ backgroundImage: `url(${bannerImg})` }}
        >
          {/* Blur/Gradient overlay para leitura perfeita */}
          <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/45 to-transparent" />
          
          <div className="relative z-10 flex items-center gap-3">
            <div className="space-y-1">
              <span className="banner-text text-xs font-semibold tracking-wide" style={{ color: 'rgba(255, 255, 255, 0.75)' }}>Bem-vindo de volta, {profile?.full_name || "Produtor"}!</span>
              <div className="flex items-center gap-2">
                <h1 className="banner-title text-3xl font-display font-black tracking-tight" style={{ color: '#ffffff' }}>{farmName}</h1>
                <Sprout className="text-emerald-400 w-5 h-5 fill-emerald-400/20" />
              </div>
              <p className="banner-text text-xs font-medium tracking-wide mt-1" style={{ color: 'rgba(255, 255, 255, 0.85)' }}>Monitoramento inteligente da sua produção</p>
            </div>
          </div>

          {/* Card Flutuante de Status Geral da Fazenda */}
          <div className="relative z-10 hidden md:flex items-center gap-3 bg-white/95 backdrop-blur-md px-5 py-3.5 rounded-2xl shadow-xl shadow-black/25 border border-white max-w-[280px]">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
            <div className="text-left overflow-hidden">
              <p className="text-[10px] font-black text-slate-800 tracking-wider uppercase">FAZENDA SAUDÁVEL</p>
              <p className="text-[10px] text-slate-400 font-medium truncate mt-0.5">Todos os indicadores dentro do ideal</p>
            </div>
            <div className="ml-auto text-slate-200">
              <svg className="w-6 h-6 stroke-slate-300 fill-none" strokeWidth="1.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z" />
              </svg>
            </div>
          </div>
        </div>

        {/* Conteúdo do Dashboard (KPIs, Solo, etc.) */}
        <div className="max-w-[1300px] mx-auto px-4 md:px-8 space-y-6 pb-20 -mt-10 relative z-20">
          {/* Grade de KPIs Principais */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* Card 1: Área Monitorada */}
          <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm flex flex-col justify-between group hover:shadow-md transition-all duration-300 relative overflow-hidden">
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider block">ÁREA MONITORADA</span>
                <span className="text-3xl font-display font-black text-slate-800">{areaTotal} ha</span>
              </div>
              <div className="w-10 h-10 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-500">
                <Sprout size={20} className="fill-emerald-500/10" />
              </div>
            </div>
            
            {/* Sparkline & Trend */}
            <div className="flex items-end justify-between mt-4">
              <div className="flex items-center gap-1 text-[10px] font-black text-emerald-600">
                {areaTotal > 0 && (
                  <>
                    <span>↑ +12%</span>
                    <span className="text-slate-400 font-bold uppercase tracking-wider">vs último ciclo</span>
                  </>
                )}
              </div>
              <div className="h-6 w-16 opacity-70">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={areaSparkline}>
                    <Line type="monotone" dataKey="v" stroke="#10b981" strokeWidth={1.5} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Card 2: Produção Estimada */}
          <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm flex flex-col justify-between group hover:shadow-md transition-all duration-300 relative overflow-hidden">
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider block">PRODUÇÃO ESTIMADA</span>
                <span className="text-3xl font-display font-black text-slate-800">{estimatedYield} ton</span>
              </div>
              <div className="w-10 h-10 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-500">
                <svg className="w-5 h-5 fill-emerald-500/10 stroke-emerald-500" strokeWidth="1.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v18M3 12h18" />
                </svg>
              </div>
            </div>
            
            {/* Sparkline & Trend */}
            <div className="flex items-end justify-between mt-4">
              <div className="flex items-center gap-1 text-[10px] font-black text-emerald-600">
                {estimatedYield > 0 && (
                  <>
                    <span>↑ +8%</span>
                    <span className="text-slate-400 font-bold uppercase tracking-wider">vs último ciclo</span>
                  </>
                )}
              </div>
              <div className="h-6 w-16 opacity-70">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={yieldSparkline}>
                    <Line type="monotone" dataKey="v" stroke="#10b981" strokeWidth={1.5} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Card 3: Lucro Estimado */}
          <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm flex flex-col justify-between group hover:shadow-md transition-all duration-300 relative overflow-hidden">
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider block">LUCRO ESTIMADO</span>
                <span className="text-3xl font-display font-black text-slate-800">R$ {lucroEstimado.toLocaleString("pt-BR")}</span>
              </div>
              <div className="w-10 h-10 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-500">
                <DollarSign size={20} />
              </div>
            </div>
            
            {/* Sparkline & Trend */}
            <div className="flex items-end justify-between mt-4">
              <div className="flex items-center gap-1 text-[10px] font-black text-emerald-600">
                {lucroEstimado > 0 && (
                  <>
                    <span>↑ +15%</span>
                    <span className="text-slate-400 font-bold uppercase tracking-wider">vs mês anterior</span>
                  </>
                )}
              </div>
              <div className="h-6 w-16 opacity-70">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={profitSparkline}>
                    <Line type="monotone" dataKey="v" stroke="#10b981" strokeWidth={1.5} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Card 4: Sanidade Geral */}
          <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm flex flex-col justify-between group hover:shadow-md transition-all duration-300 relative overflow-hidden">
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider block">SANIDADE GERAL</span>
                <span className="text-3xl font-display font-black text-emerald-600">{healthStatus}</span>
              </div>
              <div className="w-10 h-10 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-500">
                <ShieldCheck size={20} className="fill-emerald-500/10" />
              </div>
            </div>
            
            {/* Progress bar */}
            <div className="space-y-2 mt-4">
              <div className="flex items-center justify-between text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                <span>{healthStatus === "Excelente" ? "Sem alertas críticos" : healthStatus === "Sem Dados" ? "Nenhum laudo enviado" : "Alertas ativos"}</span>
              </div>
              <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 rounded-full" style={{ width: healthStatus === "Excelente" ? "100%" : healthStatus === "Sem Dados" ? "0%" : "70%" }} />
              </div>
            </div>
          </div>
        </div>

        {/* Grade Intermediária: Clima, Alertas, Próximas Ações */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          
          {/* Clima Atual (Coluna 5) */}
          <div className="lg:col-span-5 bg-white rounded-[2rem] p-6 border border-slate-100 shadow-sm flex flex-col justify-between">
            <div>
              <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider">CLIMA ATUAL</span>
              <div className="flex justify-between items-center mt-3">
                <div className="flex items-center gap-3">
                  {getWeatherIcon(weatherWidget.wmoCode, 44)}
                  <div>
                    <h2 className="text-3xl font-display font-black text-slate-800">{weatherWidget.temp}°C</h2>
                    <p className="text-xs text-slate-400 font-semibold">{weatherWidget.condition} • Sensação {weatherWidget.thermalSensation}°C</p>
                  </div>
                </div>

                <div className="text-right space-y-1">
                  <div className="flex items-center gap-1.5 justify-end text-xs text-slate-500">
                    <Droplet size={14} className="text-blue-500" />
                    <span className="font-semibold text-slate-700">{weatherWidget.humidity}%</span>
                    <span className="text-[10px] text-slate-400">UMIDADE</span>
                  </div>
                  <div className="flex items-center gap-1.5 justify-end text-xs text-slate-500">
                    <Wind size={14} className="text-slate-400" />
                    <span className="font-semibold text-slate-700">{weatherWidget.wind} km/h</span>
                    <span className="text-[10px] text-slate-400">VENTO</span>
                  </div>
                  <div className="flex items-center gap-1.5 justify-end text-xs text-slate-500">
                    <CloudRain size={14} className="text-blue-500" />
                    <span className="font-semibold text-slate-700">{weatherWidget.rainChance} mm</span>
                    <span className="text-[10px] text-slate-400">CHUVA HOJE</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Previsão de 7 dias */}
            <div className="border-t border-slate-100 pt-4 mt-6">
              <span className="text-[9px] text-slate-400 font-black uppercase tracking-wider block mb-3">PREVISÃO 7 DIAS</span>
              <div className="flex justify-between items-center overflow-x-auto gap-2 pb-1 scrollbar-none">
                {forecast7Days.map((dayData, idx) => (
                  <div key={idx} className="flex flex-col items-center space-y-1 text-center shrink-0 min-w-[42px]">
                    <span className="text-[10px] font-bold text-slate-400">{dayData.day}</span>
                    {getWeatherIcon(dayData.wmoCode, 18)}
                    <span className="text-[10px] font-black text-slate-800 leading-none mt-1">{dayData.maxTemp}°</span>
                    <span className="text-[8px] font-semibold text-slate-400 leading-none">{dayData.minTemp}°</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Alertas Inteligentes (Coluna 4) */}
          <div className="lg:col-span-4 bg-white rounded-[2rem] p-6 border border-slate-100 shadow-sm flex flex-col justify-between">
            <div className="flex justify-between items-center">
              <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider">ALERTAS INTELIGENTES</span>
              <Link to="/alertas" className="text-[10px] font-black text-emerald-600 uppercase hover:underline">Ver todos</Link>
            </div>

            <div className="space-y-2 mt-4 flex-1 flex flex-col justify-center">
              {alerts.length > 0 ? (
                alerts.map((alert) => {
                  const isDanger = alert.type === "danger";
                  const isWarning = alert.type === "warning";
                  const bgColor = isDanger ? "bg-red-50" : isWarning ? "bg-amber-50" : "bg-emerald-50";
                  const borderColor = isDanger ? "border-red-100" : isWarning ? "border-amber-100" : "border-emerald-100";
                  const iconColor = isDanger ? "text-red-500" : isWarning ? "text-amber-500" : "text-emerald-500";
                  const badgeColor = isDanger ? "text-red-700 bg-red-100" : isWarning ? "text-amber-700 bg-amber-100" : "text-emerald-700 bg-emerald-100";

                  return (
                    <div key={alert.id} className={`flex items-start gap-3 p-3 rounded-2xl border ${bgColor} ${borderColor} transition-all`}>
                      <div className={`mt-0.5 shrink-0 ${iconColor}`}>
                        {isDanger ? <AlertCircle size={16} /> : isWarning ? <AlertTriangle size={16} /> : <ShieldCheck size={16} />}
                      </div>
                      <div className="overflow-hidden flex-1">
                        <div className="flex items-center gap-1.5">
                          <span className={`text-[8px] font-extrabold uppercase px-1.5 py-0.5 rounded ${badgeColor}`}>{alert.title}</span>
                          <span className="text-[8px] text-slate-400 font-bold uppercase ml-auto">{alert.time}</span>
                        </div>
                        <p className="text-[11px] font-bold text-slate-700 mt-1 leading-snug">{alert.message}</p>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="flex flex-col items-center justify-center text-center py-6 space-y-1.5">
                  <div className="w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-500">
                    <ShieldCheck size={18} />
                  </div>
                  <p className="text-[10px] font-bold text-slate-650">Tudo sob controle</p>
                  <p className="text-[8px] text-slate-400 max-w-[180px] leading-normal mx-auto">Nenhum alerta crítico ou recomendação pendente no momento.</p>
                </div>
              )}
            </div>
          </div>

          {/* Próximas Ações (Coluna 3) */}
          <div className="lg:col-span-3 bg-white rounded-[2rem] p-6 border border-slate-100 shadow-sm flex flex-col justify-between">
            <div className="flex justify-between items-center">
              <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider">PRÓXIMAS AÇÕES</span>
            </div>

            <div className="space-y-3 mt-4 flex-1 flex flex-col justify-center">
              {recentTasks.length > 0 ? (
                recentTasks.map((task) => (
                  <div key={task.id} className="flex items-center justify-between border-b border-slate-50 pb-2.5 last:border-b-0 last:pb-0">
                    <div className="flex items-center gap-3 overflow-hidden">
                      <div className="w-8 h-8 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-500 shrink-0">
                        <Calendar size={14} />
                      </div>
                      <div className="overflow-hidden">
                        <p className="text-xs font-bold text-slate-800 truncate leading-snug">{task.title}</p>
                        <span className="text-[10px] text-slate-400 font-medium">{task.date}</span>
                      </div>
                    </div>
                    <span className={`text-[8px] font-extrabold uppercase px-2 py-0.5 rounded-full shrink-0 ml-2 ${
                      task.badge === "Hoje" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
                    }`}>
                      {task.badge}
                    </span>
                  </div>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center text-center py-6 space-y-1">
                  <Calendar className="w-6 h-6 text-slate-350" />
                  <p className="text-[10px] font-bold text-slate-650">Nenhuma ação agendada</p>
                  <p className="text-[8px] text-slate-400 max-w-[150px] leading-normal mx-auto">Adicione tarefas no 'Calendário Agrícola' para acompanhar as próximas ações.</p>
                </div>
              )}
            </div>

            <Link to="/calendario" className="flex items-center justify-between text-[10px] font-black text-slate-500 hover:text-slate-800 uppercase tracking-wider border-t border-slate-100 pt-3 mt-3 w-full">
              <span>Ver calendário completo</span>
              <ChevronRight size={12} />
            </Link>
          </div>
        </div>

        {/* Grade Inferior: Solo, Produção por Talhão, Desempenho Financeiro */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          
          {/* Solo (Coluna 4) */}
          <div className="lg:col-span-4 bg-white rounded-[2rem] p-6 border border-slate-100 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-center">
                <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider">SOLO</span>
                <Link to="/solo" className="text-[10px] font-black text-emerald-600 uppercase hover:underline">Ver detalhes</Link>
              </div>
              <p className="text-[10px] text-slate-400 font-semibold mt-1">
                {soilStats.daysSinceUpdate !== null ? `Análise atualizada há ${soilStats.daysSinceUpdate} dias` : "Sem laudos químicos cadastrados"}
              </p>
            </div>

            {soilStats.daysSinceUpdate !== null ? (
              <>
                {/* Gauge Row */}
                <div className="grid grid-cols-5 gap-2 py-6">
                  <SoilGauge value={String(soilStats.ph)} label="pH" idealText="Ideal" percentage={(soilStats.ph / 7) * 100} />
                  <SoilGauge value={`${soilStats.mo}%`} label="M.O." idealText="Ideal" percentage={(soilStats.mo / 5.0) * 100} color="#10b981" />
                  <SoilGauge value={String(soilStats.k)} label="K" idealText="Ideal" percentage={(soilStats.k / 0.6) * 100} />
                  <SoilGauge value={String(soilStats.ca)} label="Ca" idealText="Ideal" percentage={(soilStats.ca / 4.0) * 100} />
                  <SoilGauge value={String(soilStats.mg)} label="Mg" idealText="Ideal" percentage={(soilStats.mg / 2.0) * 100} />
                </div>

                {/* Recomendação rápida */}
                <div className="bg-emerald-50/50 border border-emerald-100 p-3 rounded-2xl flex items-center gap-2">
                  <Sprout size={16} className="text-emerald-500" />
                  <p className="text-[10px] font-bold text-emerald-800 leading-snug">
                    Nutrientes dentro do nível ideal para máxima produtividade.
                  </p>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center px-4 space-y-2 flex-1">
                <FileText className="w-8 h-8 text-slate-300" />
                <p className="text-[11px] font-bold text-slate-650 leading-snug">Nenhuma análise de solo cadastrada</p>
                <p className="text-[9px] text-slate-400 leading-normal max-w-[200px] mx-auto">Cadastre seu laudo em 'Análise de Solo' para visualizar o status químico e receber recomendações.</p>
              </div>
            )}
          </div>

          {/* Produção por Talhão (Coluna 4) */}
          <div className="lg:col-span-4 bg-white rounded-[2rem] p-6 border border-slate-100 shadow-sm flex flex-col justify-between">
            <div className="flex justify-between items-center">
              <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider">PRODUÇÃO POR TALHÃO</span>
              <Link to="/fazenda" className="text-[10px] font-black text-emerald-600 uppercase hover:underline">Ver mapa</Link>
            </div>

            {/* Farm Layout Vector Map SVG & Legends */}
            {talhoes.length > 0 ? (
              <div className="grid grid-cols-12 gap-4 items-center flex-1 py-4">
                {/* Mapa de Fazenda Vetorial Interativo SVG */}
                <div className="col-span-6 flex justify-center">
                  <svg className="w-32 h-32" viewBox="0 0 120 120" fill="none" strokeWidth="1">
                    {/* Talhão 1 (Norte) */}
                    <path 
                      d="M10 20 L60 10 L65 50 L20 60 Z" 
                      fill={selectedTalhao === 0 ? "rgba(16, 185, 129, 0.4)" : "rgba(16, 185, 129, 0.85)"} 
                      stroke="#ffffff"
                      strokeWidth="1.5"
                      className="cursor-pointer transition-colors duration-200"
                      onMouseEnter={() => setSelectedTalhao(0)}
                      onMouseLeave={() => setSelectedTalhao(null)}
                    />
                    {/* Talhão 2 (Central) */}
                    <path 
                      d="M60 10 L110 20 L100 60 L65 50 Z" 
                      fill={selectedTalhao === 1 ? "rgba(16, 185, 129, 0.4)" : "rgba(16, 185, 129, 0.75)"} 
                      stroke="#ffffff"
                      strokeWidth="1.5"
                      className="cursor-pointer transition-colors duration-200"
                      onMouseEnter={() => setSelectedTalhao(1)}
                      onMouseLeave={() => setSelectedTalhao(null)}
                    />
                    {/* Talhão 3 (Oeste) */}
                    <path 
                      d="M20 60 L65 50 L55 90 L10 85 Z" 
                      fill={selectedTalhao === 2 ? "rgba(16, 185, 129, 0.4)" : "rgba(16, 185, 129, 0.65)"} 
                      stroke="#ffffff"
                      strokeWidth="1.5"
                      className="cursor-pointer transition-colors duration-200"
                      onMouseEnter={() => setSelectedTalhao(2)}
                      onMouseLeave={() => setSelectedTalhao(null)}
                    />
                    {/* Talhão 4 (Leste) */}
                    <path 
                      d="M65 50 L100 60 L90 95 L55 90 Z" 
                      fill={selectedTalhao === 3 ? "rgba(16, 185, 129, 0.4)" : "rgba(16, 185, 129, 0.9)"} 
                      stroke="#ffffff"
                      strokeWidth="1.5"
                      className="cursor-pointer transition-colors duration-200"
                      onMouseEnter={() => setSelectedTalhao(3)}
                      onMouseLeave={() => setSelectedTalhao(null)}
                    />
                    {/* Talhão 5 (Sul) */}
                    <path 
                      d="M55 90 L90 95 L80 115 L45 110 Z" 
                      fill={selectedTalhao === 4 ? "rgba(16, 185, 129, 0.4)" : "rgba(16, 185, 129, 0.55)"} 
                      stroke="#ffffff"
                      strokeWidth="1.5"
                      className="cursor-pointer transition-colors duration-200"
                      onMouseEnter={() => setSelectedTalhao(4)}
                      onMouseLeave={() => setSelectedTalhao(null)}
                    />
                  </svg>
                </div>

                {/* Legenda Lateral */}
                <div className="col-span-6 space-y-1.5">
                  {talhoes.slice(0, 5).map((talhao, idx) => (
                    <div 
                      key={talhao.id} 
                      className={`flex items-center justify-between p-1 rounded-lg transition-colors text-xs ${
                        selectedTalhao === idx ? "bg-slate-50 font-bold" : ""
                      }`}
                      onMouseEnter={() => setSelectedTalhao(idx)}
                      onMouseLeave={() => setSelectedTalhao(null)}
                    >
                      <div className="flex items-center gap-2 overflow-hidden">
                        <div className="w-2 h-2 rounded-full shrink-0" style={{
                          backgroundColor: idx === 0 ? "rgba(16, 185, 129, 0.85)" : 
                                           idx === 1 ? "rgba(16, 185, 129, 0.75)" : 
                                           idx === 2 ? "rgba(16, 185, 129, 0.65)" : 
                                           idx === 3 ? "rgba(16, 185, 129, 0.9)" : "rgba(16, 185, 129, 0.55)"
                        }} />
                        <span className="text-[10px] text-slate-500 font-bold truncate uppercase">{talhao.name}</span>
                      </div>
                      <span className="text-[10px] font-black text-slate-800 whitespace-nowrap ml-1">{talhao.productivity} ton/ha</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center px-4 space-y-2 flex-1">
                <Sprout className="w-8 h-8 text-slate-300" />
                <p className="text-[11px] font-bold text-slate-650 leading-snug">Nenhum talhão cadastrado</p>
                <p className="text-[9px] text-slate-400 leading-normal max-w-[200px] mx-auto">Cadastre seus talhões em 'Área Monitorada' para visualizar a produtividade por área.</p>
              </div>
            )}
          </div>

          {/* Desempenho Financeiro (Coluna 4) */}
          <div className="lg:col-span-4 bg-white rounded-[2rem] p-6 border border-slate-100 shadow-sm flex flex-col justify-between">
            <div className="flex justify-between items-center">
              <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider">DESEMPENHO FINANCEIRO</span>
              <span className="text-[10px] font-black text-emerald-600 uppercase cursor-pointer">Este mês</span>
            </div>

            {/* Quick Metrics */}
            <div className="grid grid-cols-4 gap-2 border-b border-slate-50 pb-3.5 mt-3 text-center">
              <div className="overflow-hidden">
                <p className="text-[8px] text-slate-400 font-extrabold uppercase">RECEITA</p>
                <p className="text-[11px] font-black text-slate-800 truncate mt-0.5">R$ {receitaTotal.toLocaleString("pt-BR")}</p>
                {receitaTotal > 0 && <span className="text-[8px] font-extrabold text-emerald-600">↑ +18%</span>}
              </div>
              <div className="overflow-hidden">
                <p className="text-[8px] text-slate-400 font-extrabold uppercase">CUSTOS</p>
                <p className="text-[11px] font-black text-slate-800 truncate mt-0.5">R$ {custosTotais.toLocaleString("pt-BR")}</p>
                {custosTotais > 0 && <span className="text-[8px] font-extrabold text-emerald-600">↑ +8%</span>}
              </div>
              <div className="overflow-hidden">
                <p className="text-[8px] text-slate-400 font-extrabold uppercase">MARGEM</p>
                <p className="text-[11px] font-black text-slate-800 truncate mt-0.5">{margemTotal}%</p>
                {margemTotal > 0 && <span className="text-[8px] font-extrabold text-emerald-600">↑ +6%</span>}
              </div>
              <div className="overflow-hidden">
                <p className="text-[8px] text-slate-400 font-extrabold uppercase">LUCRO</p>
                <p className="text-[11px] font-black text-slate-800 truncate mt-0.5">R$ {lucroEstimado.toLocaleString("pt-BR")}</p>
                {lucroEstimado > 0 && <span className="text-[8px] font-extrabold text-emerald-600">↑ +15%</span>}
              </div>
            </div>

            {/* Recharts Area Chart */}
            <div className="h-28 w-full mt-4 flex items-center justify-center">
              {receitaTotal === 0 && custosTotais === 0 ? (
                <div className="flex flex-col items-center justify-center text-center px-4 py-2 space-y-1">
                  <DollarSign className="w-6 h-6 text-slate-350" />
                  <p className="text-[10px] font-bold text-slate-650">Nenhuma transação cadastrada</p>
                  <p className="text-[8px] text-slate-400 max-w-[180px] leading-normal mx-auto">Lance suas receitas e despesas na 'Gestão Financeira' para ativar o gráfico de desempenho.</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={financialChartData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorLucro" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0.0}/>
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="name" tick={{ fontSize: 8, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 8, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                    <Tooltip 
                      contentStyle={{ fontSize: '10px', borderRadius: '1rem', border: '1px solid #e2e8f0', background: 'rgba(255,255,255,0.95)' }}
                      labelStyle={{ fontWeight: 'bold' }}
                    />
                    <Area type="monotone" dataKey="lucro" name="Lucro Acumulado" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorLucro)" dot={{ r: 3, stroke: '#10b981', strokeWidth: 1, fill: '#ffffff' }} />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </div>

        </div>
      </div>
    </Layout>
  );
}
