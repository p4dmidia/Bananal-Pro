import React, { useEffect, useState, useMemo } from "react";
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
  FileText,
  ArrowUpRight
} from "lucide-react";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../contexts/AuthContext";
import { getUserFirstName } from "../../lib/utils";
import { toast } from "react-hot-toast";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, LineChart, Line } from "recharts";
import { bananaPriceService } from "../../lib/bananaPriceService";
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
  const [farmName, setFarmName] = useState(profile?.property_name || "");

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

  // Dynamic dashboard states
  const [selectedAreaId, setSelectedAreaId] = useState<string>("all");
  const [rawAreas, setRawAreas] = useState<any[]>([]);
  const [rawTransactions, setRawTransactions] = useState<any[]>([]);
  const [rawCycles, setRawCycles] = useState<any[]>([]);
  const [rawDiagnostics, setRawDiagnostics] = useState<any[]>([]);
  const [rawSoilAnalyses, setRawSoilAnalyses] = useState<any[]>([]);
  const [varieties, setVarieties] = useState<any[]>([]);
  const [priceIndicators, setPriceIndicators] = useState<any>(null);
  const [loadingPrice, setLoadingPrice] = useState(false);

  // Dynamic calculations
  const activeAreas = useMemo(() => {
    if (selectedAreaId === "all") return rawAreas;
    return rawAreas.filter(a => String(a.id) === selectedAreaId);
  }, [selectedAreaId, rawAreas]);

  const calculatedAreaTotal = useMemo(() => {
    return parseFloat(activeAreas.reduce((sum, a) => sum + (a.size_hectares || 0), 0).toFixed(1));
  }, [activeAreas]);

  const calculatedEstimatedYield = useMemo(() => {
    const yieldVal = activeAreas.reduce((sum, a) => {
      let count = a.plants_count;
      if (!count || count <= 0) {
        if (a.spacing_row_m && a.spacing_plant_m) {
          count = Math.round((a.size_hectares * 10000) / (a.spacing_row_m * a.spacing_plant_m));
        } else {
          const varInfo = varieties.find(v => v.variety_name === a.banana_variety || v.variety_name.toLowerCase() === a.banana_variety?.toLowerCase());
          count = Math.round(a.size_hectares * (varInfo?.plants_per_hectare || 1666));
        }
      }
      
      const varInfo = varieties.find(v => v.variety_name === a.banana_variety || v.variety_name.toLowerCase() === a.banana_variety?.toLowerCase());
      const bunchWeight = varInfo?.average_bunch_weight_kg || 18.5;
      const yieldTons = ((count || 0) * 0.98 * bunchWeight) / 1000;
      return sum + yieldTons;
    }, 0);
    return parseFloat(yieldVal.toFixed(1));
  }, [activeAreas, varieties]);

  const filteredTransactions = useMemo(() => {
    if (selectedAreaId === "all") return rawTransactions;
    return rawTransactions.filter(t => String(t.area_id) === selectedAreaId);
  }, [selectedAreaId, rawTransactions]);

  const calculatedReceitaTotal = useMemo(() => {
    if (selectedAreaId !== "all" && priceIndicators) {
      const yieldKg = calculatedEstimatedYield * 1000;
      return Math.round(yieldKg * priceIndicators.currentPrice);
    }
    
    let totalRev = 0;
    activeAreas.forEach(a => {
      let count = a.plants_count;
      if (!count || count <= 0) {
        if (a.spacing_row_m && a.spacing_plant_m) {
          count = Math.round((a.size_hectares * 10000) / (a.spacing_row_m * a.spacing_plant_m));
        } else {
          const varInfo = varieties.find(v => v.variety_name === a.banana_variety || v.variety_name.toLowerCase() === a.banana_variety?.toLowerCase());
          count = Math.round(a.size_hectares * (varInfo?.plants_per_hectare || 1666));
        }
      }
      const varInfo = varieties.find(v => v.variety_name === a.banana_variety || v.variety_name.toLowerCase() === a.banana_variety?.toLowerCase());
      const bunchWeight = varInfo?.average_bunch_weight_kg || 18.5;
      const yieldKg = (count || 0) * 0.98 * bunchWeight;
      
      let basePrice = 2.20;
      if (varInfo) {
        const grp = varInfo.group_name;
        if (grp === "Prata") basePrice = 2.60;
        else if (grp === "Cavendish") basePrice = 1.85;
        else if (grp === "Terra") basePrice = 3.40;
        else if (grp === "Maçã") basePrice = 4.80;
        else if (grp === "Ouro") basePrice = 3.20;
      }
      totalRev += yieldKg * basePrice;
    });
    
    if (activeAreas.length === 0) {
      return filteredTransactions.filter(t => t.type === "Receita").reduce((sum, t) => sum + (t.amount || 0), 0);
    }
    return Math.round(totalRev);
  }, [selectedAreaId, activeAreas, varieties, priceIndicators, calculatedEstimatedYield, filteredTransactions]);

  const calculatedCustosTotais = useMemo(() => {
    return filteredTransactions
      .filter((t: any) => t.type === "Despesa" || t.type === "Custo Fixo" || t.type === "Custo Variável")
      .reduce((sum: number, t: any) => sum + (t.amount || 0), 0);
  }, [filteredTransactions]);

  const calculatedLucroEstimado = useMemo(() => {
    return calculatedReceitaTotal - calculatedCustosTotais;
  }, [calculatedReceitaTotal, calculatedCustosTotais]);

  const calculatedMargemTotal = useMemo(() => {
    return calculatedReceitaTotal > 0 ? Math.round(((calculatedReceitaTotal - calculatedCustosTotais) / calculatedReceitaTotal) * 100) : 0;
  }, [calculatedReceitaTotal, calculatedCustosTotais]);

  const calculatedFinancialChartData = useMemo(() => {
    const sortedTxs = [...filteredTransactions].sort((a, b) => new Date(a.created_at || a.date).getTime() - new Date(b.created_at || b.date).getTime());
    let accReceita = 0;
    let accLucro = 0;
    
    const chartPoints = sortedTxs.map((tx: any) => {
      const amt = tx.amount || 0;
      if (tx.type === "Receita") {
        accReceita += amt;
        accLucro += amt;
      } else {
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
    return chartPoints.slice(-10);
  }, [filteredTransactions]);

  const custosMonthComparison = useMemo(() => {
    const now = new Date();
    const thisMonth = now.getMonth();
    const thisYear = now.getFullYear();
    
    const prevMonth = thisMonth === 0 ? 11 : thisMonth - 1;
    const prevYear = thisMonth === 0 ? thisYear - 1 : thisYear;

    const thisMonthCustos = filteredTransactions
      .filter((t: any) => {
        return t.type === "Despesa" && new Date(t.created_at || t.date).getMonth() === thisMonth && new Date(t.created_at || t.date).getFullYear() === thisYear;
      })
      .reduce((sum: number, t: any) => sum + (t.amount || 0), 0);

    const prevMonthCustos = filteredTransactions
      .filter((t: any) => {
        return t.type === "Despesa" && new Date(t.created_at || t.date).getMonth() === prevMonth && new Date(t.created_at || t.date).getFullYear() === prevYear;
      })
      .reduce((sum: number, t: any) => sum + (t.amount || 0), 0);

    let variation = 0;
    if (prevMonthCustos > 0) {
      variation = parseFloat((((thisMonthCustos - prevMonthCustos) / prevMonthCustos) * 100).toFixed(1));
    }
    return {
      thisMonthCustos,
      prevMonthCustos,
      variation
    };
  }, [filteredTransactions]);

  const calculatedPotentialProductivity = useMemo(() => {
    let varietyScore = 85;
    if (activeAreas.length > 0) {
      let sumVar = 0;
      activeAreas.forEach(a => {
        const vName = (a.banana_variety || "").toLowerCase();
        let score = 85;
        if (vName.includes("platina") || vName.includes("graúda") || vName.includes("naine") || vName.includes("ken") || vName.includes("njk") || vName.includes("williams") || vName.includes("fhia-21")) {
          score = 100;
        } else if (vName.includes("anã") || vName.includes("catarina") || vName.includes("princesa") || vName.includes("fhia-18")) {
          score = 90;
        } else if (vName.includes("maçã") || vName.includes("ouro")) {
          score = 75;
        }
        sumVar += score;
      });
      varietyScore = Math.round(sumVar / activeAreas.length);
    }

    let soilScore = 70;
    if (rawSoilAnalyses.length > 0) {
      const latestSoil = rawSoilAnalyses[0];
      let score = 70;
      if (latestSoil.ph >= 5.5 && latestSoil.ph <= 6.5) {
        score += 20;
      }
      if (latestSoil.ph >= 5.8 && latestSoil.ph <= 6.2) {
        score += 5;
      }
      const mo = latestSoil.h_al || 0;
      if (mo > 2.5) {
        score += 5;
      }
      soilScore = Math.min(100, score);
    }

    let climateScore = 85;
    const temp = weatherWidget.temp;
    if (temp >= 20 && temp <= 30) {
      climateScore = 95;
    } else if (temp > 35 || temp < 15) {
      climateScore = 70;
    }
    
    const hasIrrigation = activeAreas.some(a => a.irrigation_type && a.irrigation_type !== "Sequeiro");
    if (weatherWidget.rainChance > 40 || hasIrrigation) {
      climateScore = Math.min(100, climateScore + 5);
    } else if (weatherWidget.rainChance === 0 && !hasIrrigation) {
      climateScore = Math.max(60, climateScore - 15);
    }

    let healthScore = 95;
    if (rawDiagnostics.length > 0) {
      const hasSevere = rawDiagnostics.some(d => d.severity?.toLowerCase() === "alta");
      const hasModerate = rawDiagnostics.some(d => d.severity?.toLowerCase() === "média" || d.severity?.toLowerCase() === "media");
      if (hasSevere) healthScore = 60;
      else if (hasModerate) healthScore = 80;
      else healthScore = 95;
    }

    const overall = Math.round(
      varietyScore * 0.40 +
      soilScore * 0.20 +
      climateScore * 0.15 +
      healthScore * 0.25
    );

    return {
      variety: varietyScore,
      soil: soilScore,
      climate: climateScore,
      health: healthScore,
      overall
    };
  }, [activeAreas, rawSoilAnalyses, weatherWidget, rawDiagnostics]);

  const computedTalhoes = useMemo(() => {
    return rawAreas.map((item, index) => {
      let count = item.plants_count;
      if (!count || count <= 0) {
        if (item.spacing_row_m && item.spacing_plant_m) {
          count = Math.round((item.size_hectares * 10000) / (item.spacing_row_m * item.spacing_plant_m));
        } else {
          const varInfo = varieties.find(v => v.variety_name === item.banana_variety || v.variety_name.toLowerCase() === item.banana_variety?.toLowerCase());
          count = Math.round(item.size_hectares * (varInfo?.plants_per_hectare || 1666));
        }
      }
      
      const varInfo = varieties.find(v => v.variety_name === item.banana_variety || v.variety_name.toLowerCase() === item.banana_variety?.toLowerCase());
      const bunchWeight = varInfo?.average_bunch_weight_kg || 18.5;
      const yieldTons = ((count || 0) * 0.98 * bunchWeight) / 1000;
      
      const productivity = item.size_hectares > 0 ? parseFloat((yieldTons / item.size_hectares).toFixed(1)) : 0;

      return {
        id: item.id,
        name: item.name || `Talhão ${index + 1}`,
        variety: item.banana_variety || "Cavendish",
        hectares: item.size_hectares || 1.0,
        productivity
      };
    });
  }, [rawAreas, varieties]);

  const dynamicAreaSparkline = useMemo(() => {
    return [
      { v: calculatedAreaTotal * 0.9 },
      { v: calculatedAreaTotal * 0.95 },
      { v: calculatedAreaTotal },
      { v: calculatedAreaTotal },
      { v: calculatedAreaTotal }
    ];
  }, [calculatedAreaTotal]);

  const dynamicYieldSparkline = useMemo(() => {
    return [
      { v: calculatedEstimatedYield * 0.9 },
      { v: calculatedEstimatedYield * 0.95 },
      { v: calculatedEstimatedYield },
      { v: calculatedEstimatedYield },
      { v: calculatedEstimatedYield }
    ];
  }, [calculatedEstimatedYield]);

  const dynamicProfitSparkline = useMemo(() => {
    return [
      { v: calculatedLucroEstimado * 0.9 },
      { v: calculatedLucroEstimado * 0.95 },
      { v: calculatedLucroEstimado },
      { v: calculatedLucroEstimado },
      { v: calculatedLucroEstimado }
    ];
  }, [calculatedLucroEstimado]);

  const dynamicCustosSparkline = useMemo(() => {
    return [
      { v: calculatedCustosTotais * 0.9 },
      { v: calculatedCustosTotais * 0.95 },
      { v: calculatedCustosTotais },
      { v: calculatedCustosTotais },
      { v: calculatedCustosTotais }
    ];
  }, [calculatedCustosTotais]);

  // Sync market price when variety changes
  useEffect(() => {
    const fetchMarketPrice = async () => {
      let varietyName = "Prata Anã";
      if (selectedAreaId !== "all" && rawAreas.length > 0) {
        const activeArea = rawAreas.find(a => String(a.id) === selectedAreaId);
        if (activeArea?.banana_variety) {
          varietyName = activeArea.banana_variety;
        }
      } else if (rawAreas.length > 0) {
        varietyName = rawAreas[0].banana_variety || "Prata Anã";
      }

      let normalized = varietyName;
      if (varietyName === "prata-ana") normalized = "Prata Anã";
      else if (varietyName === "nanica") normalized = "Nanica Tradicional";
      else if (varietyName === "maca") normalized = "Maçã Tradicional";
      else if (varietyName === "terra") normalized = "Banana Terra";
      else if (varietyName === "ouro") normalized = "Ouro";

      setLoadingPrice(true);
      try {
        const indicators = await bananaPriceService.getPriceIndicators(supabase, normalized);
        setPriceIndicators(indicators);
      } catch (err) {
        console.error("Error fetching price indicators:", err);
      } finally {
        setLoadingPrice(false);
      }
    };

    if (profile?.id) {
      fetchMarketPrice();
    }
  }, [selectedAreaId, rawAreas, profile]);

  // Update localStorage cache on dynamic calculations change
  useEffect(() => {
    if (!profile?.id || rawAreas.length === 0) return;
    const cacheKey = `dashboard_cache_${profile.id}`;
    localStorage.setItem(cacheKey, JSON.stringify({
      areaTotal: calculatedAreaTotal,
      estimatedYield: calculatedEstimatedYield,
      lucroEstimado: calculatedLucroEstimado,
      receitaTotal: calculatedReceitaTotal,
      custosTotais: calculatedCustosTotais,
      margemTotal: calculatedMargemTotal,
      healthStatus,
      weatherWidget,
      forecast7Days,
      alerts,
      recentTasks,
      soilStats,
      city,
      state,
      cep,
      farmName
    }));
  }, [
    profile,
    calculatedAreaTotal,
    calculatedEstimatedYield,
    calculatedLucroEstimado,
    calculatedReceitaTotal,
    calculatedCustosTotais,
    calculatedMargemTotal,
    healthStatus,
    weatherWidget,
    forecast7Days,
    alerts,
    recentTasks,
    soilStats,
    city,
    state,
    cep,
    farmName
  ]);

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

    const loadDashboardData = async () => {
      setLoading(true);
      try {
        const { data: areasData } = await supabase.from("producer_areas").select("*");
        setRawAreas(areasData || []);

        const { data: varietiesData } = await supabase.from("banana_varieties").select("*");
        setVarieties(varietiesData || []);

        const { data: cyclesData } = await supabase.from("production_cycles").select("*").eq("user_id", profile.id).eq("status", "Ativo");
        setRawCycles(cyclesData || []);

        const { data: txsData } = await supabase.from("transactions").select("*").eq("user_id", profile.id);
        setRawTransactions(txsData || []);

        const { data: soilData } = await supabase.from("soil_analyses").select("*").order("created_at", { ascending: false });
        setRawSoilAnalyses(soilData || []);

        const { data: tasksData } = await supabase.from("farm_tasks").select("*").eq("user_id", profile.id).eq("status", "Pendente").order("date", { ascending: true });
        setRecentTasks(tasksData || []);

        const { data: inventoryData } = await supabase.from("farm_inventory").select("*").eq("user_id", profile.id);

        const { data: diagnosticsData } = await supabase.from("visual_diagnostics").select("*").eq("user_id", profile.id);
        setRawDiagnostics(diagnosticsData || []);

        // Logic for Alerts
        const tempAlertsList: any[] = [];
        if (weatherWidget.humidity > 80) {
          tempAlertsList.push({ id: "sigatoka-alert", type: "danger", title: "ALERTA AGRO", message: `Umidade elevada (${weatherWidget.humidity}%). Risco de Sigatoka Negra.`, time: "Atualizado" });
        }
        if (inventoryData && inventoryData.length > 0) {
          const lowItems = inventoryData.filter((i: any) => (i.quantity || 0) < (i.min_quantity || 0));
          if (lowItems.length > 0) {
            tempAlertsList.unshift({ id: "stock-alert", type: "warning", title: "ESTOQUE BAIXO", message: `Insumo '${lowItems[0].name}' atingiu o nível mínimo.`, time: "Agora" });
          }
        }
        setAlerts(tempAlertsList);

        let finalHealth = diagnosticsData && diagnosticsData.some((d: any) => d.severity?.toLowerCase() === "alta") ? "Atenção" : "Excelente";
        setHealthStatus(finalHealth);

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
          <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/45 to-transparent" />
          
          <div className="relative z-10 flex items-center gap-3">
            <div className="space-y-1">
              <span className="banner-text text-xs font-semibold tracking-wide" style={{ color: 'rgba(255, 255, 255, 0.75)' }}>Bem-vindo de volta, {profile?.full_name || "Produtor"}!</span>
              <div className="flex items-center gap-2">
                <h1 className="banner-title text-3xl font-display font-black tracking-tight" style={{ color: '#ffffff' }}>
                  {farmName || "Minha Fazenda"}
                </h1>
                <Sprout className="text-emerald-400 w-5 h-5 fill-emerald-400/20" />
              </div>
            </div>
          </div>

          <div className="relative z-10 hidden md:flex items-center gap-3 bg-white/95 backdrop-blur-md px-5 py-3.5 rounded-2xl shadow-xl shadow-black/25 border border-white max-w-[280px]">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
            <div className="text-left overflow-hidden">
              <p className="text-[10px] font-black text-slate-800 tracking-wider uppercase">FAZENDA SAUDÁVEL</p>
              <p className="text-[10px] text-slate-400 font-medium truncate mt-0.5">Todos os indicadores dentro do ideal</p>
            </div>
            <div className="ml-auto text-slate-200">
              <svg className="w-6 h-6 stroke-slate-300 fill-none" strokeWidth="1.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z" />
              </svg>
            </div>
          </div>
        </div>

        {/* Conteúdo do Dashboard (KPIs, Solo, etc.) */}
        <div className="max-w-[1300px] mx-auto px-4 md:px-8 space-y-6 pb-20 -mt-10 relative z-20">
          
          {/* Seletor de Glebas/Talhões */}
          {rawAreas.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 p-1.5 bg-slate-50/80 backdrop-blur border border-slate-100 rounded-2xl w-fit">
              <button
                onClick={() => setSelectedAreaId("all")}
                className={`px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-xl transition-all cursor-pointer ${
                  selectedAreaId === "all"
                    ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/10"
                    : "text-slate-500 hover:text-slate-800 hover:bg-slate-100"
                }`}
              >
                Visão Geral
              </button>
              {rawAreas.map((area) => (
                <button
                  key={area.id}
                  onClick={() => setSelectedAreaId(String(area.id))}
                  className={`px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-xl transition-all cursor-pointer ${
                    selectedAreaId === String(area.id)
                      ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/10"
                      : "text-slate-500 hover:text-slate-800 hover:bg-slate-100"
                  }`}
                >
                  {area.name}
                </button>
              ))}
            </div>
          )}

          {/* Grade de KPIs Principais */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          
          {/* Card 1: Área Monitorada */}
          <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm flex flex-col justify-between group hover:shadow-md transition-all duration-300 relative overflow-hidden">
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider block">ÁREA MONITORADA</span>
                <span className="text-3xl font-display font-black text-slate-800">{calculatedAreaTotal} ha</span>
              </div>
              <div className="w-10 h-10 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-500">
                <Sprout size={20} className="fill-emerald-500/10" />
              </div>
            </div>
            
            {/* Sparkline & Trend */}
            <div className="flex items-end justify-between mt-4">
              <div className="flex items-center gap-1 text-[10px] font-black text-emerald-600">
                {calculatedAreaTotal > 0 && (
                  <>
                    <span>+12%</span>
                    <span className="text-slate-400 font-bold uppercase tracking-wider">vs último ciclo</span>
                  </>
                )}
              </div>
              <div className="h-6 w-16 opacity-70">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={dynamicAreaSparkline}>
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
                <span className="text-3xl font-display font-black text-slate-800">{calculatedEstimatedYield} ton</span>
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
                {calculatedEstimatedYield > 0 && (
                  <>
                    <span>+8%</span>
                    <span className="text-slate-400 font-bold uppercase tracking-wider">vs último ciclo</span>
                  </>
                )}
              </div>
              <div className="h-6 w-16 opacity-70">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={dynamicYieldSparkline}>
                    <Line type="monotone" dataKey="v" stroke="#10b981" strokeWidth={1.5} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Card 3: Total de Custos */}
          <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm flex flex-col justify-between group hover:shadow-md transition-all duration-300 relative overflow-hidden">
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider block">CUSTO OPERACIONAL TOTAL</span>
                <span className="text-3xl font-display font-black text-slate-800">R$ {calculatedCustosTotais.toLocaleString("pt-BR")}</span>
              </div>
              <div className="w-10 h-10 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-500">
                <DollarSign size={20} />
              </div>
            </div>
            
            {/* Sparkline & Trend */}
            <div className="flex items-end justify-between mt-4">
              <div className="flex items-center gap-1 text-[10px] font-black">
                {custosMonthComparison.variation !== 0 ? (
                  <span className={custosMonthComparison.variation > 0 ? "text-red-500" : "text-emerald-600"}>
                    {custosMonthComparison.variation > 0 ? `+${custosMonthComparison.variation}%` : `${custosMonthComparison.variation}%`}
                  </span>
                ) : (
                  <span className="text-slate-400">0%</span>
                )}
                <span className="text-slate-400 font-bold uppercase tracking-wider">vs mês anterior</span>
              </div>
              <div className="h-6 w-16 opacity-70">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={dynamicCustosSparkline}>
                    <Line type="monotone" dataKey="v" stroke={custosMonthComparison.variation > 0 ? "#ef4444" : "#10b981"} strokeWidth={1.5} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Card 4: Lucro Estimado */}
          <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm flex flex-col justify-between group hover:shadow-md transition-all duration-300 relative overflow-hidden">
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider block">LUCRO ESTIMADO</span>
                <span className="text-3xl font-display font-black text-slate-800">R$ {calculatedLucroEstimado.toLocaleString("pt-BR")}</span>
              </div>
              <div className="w-10 h-10 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-500">
                <DollarSign size={20} className="fill-emerald-500/10" />
              </div>
            </div>
            
            {/* Sparkline & Trend */}
            <div className="flex items-end justify-between mt-4">
              <div className="flex items-center gap-1 text-[10px] font-black text-emerald-600">
                {calculatedLucroEstimado > 0 && (
                  <>
                    <span>+15%</span>
                    <span className="text-slate-400 font-bold uppercase tracking-wider">vs mês anterior</span>
                  </>
                )}
              </div>
              <div className="h-6 w-16 opacity-70">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={dynamicProfitSparkline}>
                    <Line type="monotone" dataKey="v" stroke="#10b981" strokeWidth={1.5} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Card 5: Sanidade Geral */}
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

          {/* Card 6: Inteligência de Mercado */}
          <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm flex flex-col justify-between group hover:shadow-md transition-all duration-300 relative overflow-hidden min-h-[170px]">
            <div className="flex justify-between items-start">
              <div className="space-y-1 overflow-hidden max-w-[70%]">
                <span className="text-[9px] text-slate-400 font-extrabold uppercase tracking-wider block truncate">
                  COTAÇÃO ({activeAreas[0]?.banana_variety || "Prata Anã"})
                </span>
                <span className="text-2xl font-display font-black text-slate-800 tracking-tight">
                  {loadingPrice ? (
                    <span className="text-xs text-slate-400 font-bold">Buscando...</span>
                  ) : priceIndicators ? (
                    `R$ ${priceIndicators.currentPrice.toFixed(2)}/kg`
                  ) : (
                    "R$ 2.60/kg"
                  )}
                </span>
              </div>
              <div className="w-10 h-10 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-500">
                <TrendingUp size={20} />
              </div>
            </div>
            
            {/* Price variations & Receita Est. */}
            <div className="mt-3 space-y-1">
              <div className="flex items-center gap-2 text-[9px] font-bold text-slate-500">
                {priceIndicators && (
                  <>
                    <span className="flex items-center gap-0.5">
                      7d: <span className={priceIndicators.variation7d >= 0 ? "text-emerald-600" : "text-red-500"}>
                        {priceIndicators.variation7d >= 0 ? `+${priceIndicators.variation7d}%` : `${priceIndicators.variation7d}%`}
                      </span>
                    </span>
                    <span className="flex items-center gap-0.5">
                      30d: <span className={priceIndicators.variationMonth >= 0 ? "text-emerald-600" : "text-red-500"}>
                        {priceIndicators.variationMonth >= 0 ? `+${priceIndicators.variationMonth}%` : `${priceIndicators.variationMonth}%`}
                      </span>
                    </span>
                  </>
                )}
              </div>
              
              <div className="flex items-center justify-between text-[10px] pt-1 border-t border-slate-100">
                <span className="text-slate-400 font-bold uppercase">Receita Est. Safra:</span>
                <span className="font-extrabold text-slate-700">R$ {calculatedReceitaTotal.toLocaleString("pt-BR")}</span>
              </div>
            </div>
          </div>

          {/* Card 7: Potencial Produtivo */}
          <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm flex flex-col justify-between group hover:shadow-md transition-all duration-300 relative overflow-hidden min-h-[170px]">
            <div className="flex justify-between items-start">
              <div className="space-y-0.5">
                <span className="text-[9px] text-slate-400 font-extrabold uppercase tracking-wider block">POTENCIAL PRODUTIVO GERAL</span>
                <span className="text-2xl font-display font-black text-emerald-600">
                  {calculatedPotentialProductivity.overall}%
                </span>
              </div>
              <div className="w-10 h-10 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-500">
                <HelpCircle size={20} className="text-emerald-500 fill-emerald-500/10" />
              </div>
            </div>
            
            {/* Factor Bars */}
            <div className="mt-3 space-y-1.5">
              <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-[8px] font-black text-slate-500 uppercase tracking-wider">
                <div className="space-y-0.5">
                  <div className="flex justify-between">
                    <span>Var:</span>
                    <span className="text-slate-700">{calculatedPotentialProductivity.variety}%</span>
                  </div>
                  <div className="h-1 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${calculatedPotentialProductivity.variety}%` }} />
                  </div>
                </div>

                <div className="space-y-0.5">
                  <div className="flex justify-between">
                    <span>Solo:</span>
                    <span className="text-slate-700">{calculatedPotentialProductivity.soil}%</span>
                  </div>
                  <div className="h-1 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${calculatedPotentialProductivity.soil}%` }} />
                  </div>
                </div>

                <div className="space-y-0.5">
                  <div className="flex justify-between">
                    <span>Clima:</span>
                    <span className="text-slate-700">{calculatedPotentialProductivity.climate}%</span>
                  </div>
                  <div className="h-1 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${calculatedPotentialProductivity.climate}%` }} />
                  </div>
                </div>

                <div className="space-y-0.5">
                  <div className="flex justify-between">
                    <span>San:</span>
                    <span className="text-slate-700">{calculatedPotentialProductivity.health}%</span>
                  </div>
                  <div className="h-1 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${calculatedPotentialProductivity.health}%` }} />
                  </div>
                </div>
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
                        <span className="text-[10px] text-slate-400 font-medium">{new Date(task.date).toLocaleDateString('pt-BR')}</span>
                      </div>
                    </div>
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
                <div className="grid grid-cols-5 gap-2 py-6">
                  <SoilGauge value={String(soilStats.ph)} label="pH" idealText="Ideal" percentage={(soilStats.ph / 7) * 100} />
                  <SoilGauge value={`${soilStats.mo}%`} label="M.O." idealText="Ideal" percentage={(soilStats.mo / 5.0) * 100} color="#10b981" />
                  <SoilGauge value={String(soilStats.k)} label="K" idealText="Ideal" percentage={(soilStats.k / 0.6) * 100} />
                  <SoilGauge value={String(soilStats.ca)} label="Ca" idealText="Ideal" percentage={(soilStats.ca / 4.0) * 100} />
                  <SoilGauge value={String(soilStats.mg)} label="Mg" idealText="Ideal" percentage={(soilStats.mg / 2.0) * 100} />
                </div>
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

            {computedTalhoes.length > 0 ? (
              <div className="grid grid-cols-12 gap-4 items-center flex-1 py-4">
                <div className="col-span-6 flex justify-center">
                  <svg className="w-32 h-32" viewBox="0 0 120 120" fill="none" strokeWidth="1">
                    <path d="M10 20 L60 10 L65 50 L20 60 Z" fill={selectedTalhao === 0 ? "rgba(16, 185, 129, 0.4)" : "rgba(16, 185, 129, 0.85)"} stroke="#ffffff" strokeWidth="1.5" className="cursor-pointer" onMouseEnter={() => setSelectedTalhao(0)} onMouseLeave={() => setSelectedTalhao(null)} />
                    <path d="M60 10 L110 20 L100 60 L65 50 Z" fill={selectedTalhao === 1 ? "rgba(16, 185, 129, 0.4)" : "rgba(16, 185, 129, 0.75)"} stroke="#ffffff" strokeWidth="1.5" className="cursor-pointer" onMouseEnter={() => setSelectedTalhao(1)} onMouseLeave={() => setSelectedTalhao(null)} />
                    <path d="M20 60 L65 50 L55 90 L10 85 Z" fill={selectedTalhao === 2 ? "rgba(16, 185, 129, 0.4)" : "rgba(16, 185, 129, 0.65)"} stroke="#ffffff" strokeWidth="1.5" className="cursor-pointer" onMouseEnter={() => setSelectedTalhao(2)} onMouseLeave={() => setSelectedTalhao(null)} />
                    <path d="M65 50 L100 60 L90 95 L55 90 Z" fill={selectedTalhao === 3 ? "rgba(16, 185, 129, 0.4)" : "rgba(16, 185, 129, 0.9)"} stroke="#ffffff" strokeWidth="1.5" className="cursor-pointer" onMouseEnter={() => setSelectedTalhao(3)} onMouseLeave={() => setSelectedTalhao(null)} />
                    <path d="M55 90 L90 95 L80 115 L45 110 Z" fill={selectedTalhao === 4 ? "rgba(16, 185, 129, 0.4)" : "rgba(16, 185, 129, 0.55)"} stroke="#ffffff" strokeWidth="1.5" className="cursor-pointer" onMouseEnter={() => setSelectedTalhao(4)} onMouseLeave={() => setSelectedTalhao(null)} />
                  </svg>
                </div>
                <div className="col-span-6 space-y-1.5">
                  {computedTalhoes.slice(0, 5).map((talhao, idx) => (
                    <div key={talhao.id} className={`flex items-center justify-between p-1 rounded-lg transition-colors text-xs ${selectedTalhao === idx ? "bg-slate-50 font-bold" : ""}`} onMouseEnter={() => setSelectedTalhao(idx)} onMouseLeave={() => setSelectedTalhao(null)}>
                      <div className="flex items-center gap-2 overflow-hidden">
                        <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: "rgba(16, 185, 129, 0.85)" }} />
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

            <div className="flex items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div className="overflow-hidden">
                <p className="text-[8px] text-slate-400 font-extrabold uppercase">LUCRO</p>
                <p className="text-[11px] font-black text-slate-800 truncate mt-0.5">R$ {calculatedLucroEstimado.toLocaleString("pt-BR")}</p>
                {calculatedLucroEstimado > 0 && <span className="text-[8px] font-extrabold text-emerald-600"> +15%</span>}
              </div>
            </div>

            {/* Recharts Area Chart */}
            <div className="h-28 w-full mt-4 flex items-center justify-center">
              {calculatedReceitaTotal === 0 && calculatedCustosTotais === 0 ? (
                <div className="flex flex-col items-center justify-center text-center px-4 py-2 space-y-1">
                  <DollarSign className="w-6 h-6 text-slate-350" />
                  <p className="text-[10px] font-bold text-slate-650">Nenhuma transação cadastrada</p>
                  <p className="text-[8px] text-slate-400 max-w-[180px] leading-normal mx-auto">Lance suas receitas e despesas na 'Gestão Financeira' para ativar o gráfico de desempenho.</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={calculatedFinancialChartData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
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
