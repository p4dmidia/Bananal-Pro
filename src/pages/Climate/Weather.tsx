import React, { useState, useEffect } from "react";
import Layout from "../../components/Layout/Layout";
import bannerImg from "../../assets/banana_weather_climate_banner.png";
import { motion, AnimatePresence } from "motion/react";
import { 
  CloudSun, 
  Thermometer, 
  Droplets, 
  Wind, 
  CloudRain, 
  AlertTriangle, 
  Info, 
  Sun,
  MapPin,
  CheckCircle2,
  Calendar,
  Loader2,
  Pencil,
  X,
  Cloud,
  CloudLightning
} from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { toast } from "react-hot-toast";
import { supabase } from "../../lib/supabase";

export default function Weather() {
  const { profile, refreshProfile } = useAuth();
  const [city, setCity] = useState("Sete Lagoas");
  const [state, setState] = useState("MG");
  const [loading, setLoading] = useState(true);
  const [areas, setAreas] = useState<any[]>([]);
  const [selectedArea, setSelectedArea] = useState<any | null>(null);
  const [loadingAreas, setLoadingAreas] = useState(true);

  const [showLocModal, setShowLocModal] = useState(false);
  const [newCity, setNewCity] = useState("");
  const [newState, setNewState] = useState("");
  const [updatingLoc, setUpdatingLoc] = useState(false);

  const [currentConditions, setCurrentConditions] = useState({
    temp: 26,
    humidity: 78,
    windSpeed: 8,
    rainChance: 20,
    condition: "Carregando...",
    wmoCode: 3,
    thermalSensation: 25,
    alerts: [
      { id: "1", type: "Sigatoka Negra", message: "Umidade e temperatura elevadas elevam o risco de Sigatoka Negra para ALTO nas próximas 48h.", level: "warning" }
    ]
  });

  const [forecast, setForecast] = useState<any[]>([]);
  const [forecast7Days, setForecast7Days] = useState<any[]>([
    { day: "Hoje", maxTemp: 26, minTemp: 18, wmoCode: 3 },
    { day: "Amanhã", maxTemp: 25, minTemp: 17, wmoCode: 2 },
    { day: "Seg", maxTemp: 25, minTemp: 17, wmoCode: 2 },
    { day: "Ter", maxTemp: 25, minTemp: 16, wmoCode: 1 },
    { day: "Qua", maxTemp: 26, minTemp: 18, wmoCode: 2 },
    { day: "Qui", maxTemp: 26, minTemp: 17, wmoCode: 2 },
    { day: "Sex", maxTemp: 23, minTemp: 15, wmoCode: 61 }
  ]);

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

  const getWeatherIcon = (code: number, size = 20, className = "") => {
    if (code === 0) return <Sun size={size} className={`weather-sun ${className}`} />;
    if (code <= 3) return <CloudSun size={size} className={`weather-cloud-sun ${className}`} />;
    if (code === 45 || code === 48) return <Cloud size={size} className={`weather-cloud ${className}`} />;
    if (code <= 65 || (code >= 80 && code <= 82)) return <CloudRain size={size} className={`weather-rain ${className}`} />;
    return <CloudLightning size={size} className={`weather-lightning ${className}`} />;
  };



  const getDayName = (dateStr: string, index: number): string => {
    if (index === 0) return "Amanhã";
    const date = new Date(dateStr + "T12:00:00");
    const days = ["Domingo", "Segunda-feira", "Terça-feira", "Quarta-feira", "Quinta-feira", "Sexta-feira", "Sábado"];
    return days[date.getDay()];
  };

  const getDayOfWeekName = (dateStr: string) => {
    const days = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
    const d = new Date(dateStr + "T00:00:00");
    return days[d.getDay()];
  };

  const handleSaveLocation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCity.trim()) {
      toast.error("Por favor, digite o nome da cidade.");
      return;
    }
    if (!profile?.id) {
      toast.error("Usuário não identificado.");
      return;
    }

    setUpdatingLoc(true);
    try {
      const { error } = await supabase
        .from("user_profiles")
        .update({
          city: newCity.trim(),
          state: newState.trim().toUpperCase()
        })
        .eq("id", profile.id);

      if (error) throw error;

      toast.success("Localização da fazenda atualizada!");
      setShowLocModal(false);
      await refreshProfile();
    } catch (err) {
      console.error("Error updating location:", err);
      toast.error("Erro ao atualizar localização no Supabase.");
    } finally {
      setUpdatingLoc(false);
    }
  };

  useEffect(() => {
    const fetchAreas = async () => {
      if (!profile?.id) {
        setLoadingAreas(false);
        return;
      }
      try {
        const { data, error } = await supabase
          .from("producer_areas")
          .select("*")
          .order("created_at", { ascending: false });

        if (error) throw error;

        const loadedAreas = data || [];
        setAreas(loadedAreas);

        if (loadedAreas.length > 0) {
          const savedAreaId = localStorage.getItem("selected_area_id");
          const found = loadedAreas.find(a => String(a.id) === savedAreaId);
          const initialArea = found || loadedAreas[0];
          setSelectedArea(initialArea);
          setCity(initialArea.city);
          setState(initialArea.state);
        } else {
          setCity(profile.city || "Sete Lagoas");
          setState(profile.state || "MG");
        }
      } catch (err) {
        console.error("Error loading areas for weather:", err);
      } finally {
        setLoadingAreas(false);
      }
    };

    fetchAreas();
  }, [profile]);

  useEffect(() => {
    const fetchWeather = async () => {
      if (!city || !state) return;
      setLoading(true);

      const weatherCacheKey = `open_meteo_raw_cache_${city}`;
      const cachedWeather = sessionStorage.getItem(weatherCacheKey);
      
      if (cachedWeather) {
        try {
          const parsed = JSON.parse(cachedWeather);
          if (Date.now() - parsed.timestamp < 1800000) {
            const wData = parsed.data;
            const cur = wData.current;
            const daily = wData.daily;
            
            const temp = cur.temperature_2m;
            const humidity = cur.relative_humidity_2m;
            const sigatokaRisk = (humidity > 75 && temp >= 21 && temp <= 30);
            
            const alerts = sigatokaRisk ? [
              {
                id: "1",
                type: "Sigatoka Negra",
                message: `Umidade elevada (${humidity}%) e temperatura propícia (${temp}°C) elevam o risco de Sigatoka Negra para CRÍTICO nas próximas 48h. Evite atraso na pulverização preventiva.`,
                level: "danger"
              }
            ] : [
              {
                id: "1",
                type: "Prevenção Geral",
                message: "Condições sob controle. Continue realizando a desfolha sanitária quinzenal nas glebas ativas.",
                level: "info"
              }
            ];

            setCurrentConditions({
              temp: parseFloat(temp.toFixed(1)),
              humidity: Math.round(humidity),
              windSpeed: Math.round(cur.wind_speed_10m),
              rainChance: daily.precipitation_probability_max ? daily.precipitation_probability_max[0] : 0,
              condition: mapWmoCode(cur.weather_code),
              wmoCode: cur.weather_code,
              thermalSensation: Math.round(temp + (humidity > 70 ? 1.2 : -0.8)),
              alerts
            });

            const forecastList = [];
            for (let i = 1; i <= 5; i++) {
              if (daily.time[i]) {
                forecastList.push({
                  day: getDayName(daily.time[i], i - 1),
                  tempMin: Math.round(daily.temperature_2m_min[i]),
                  tempMax: Math.round(daily.temperature_2m_max[i]),
                  condition: mapWmoCode(daily.weather_code[i]),
                  rain: daily.precipitation_probability_max ? daily.precipitation_probability_max[i] : 0
                });
              }
            }
            setForecast(forecastList);

            const f7Days = [];
            if (daily && daily.time) {
              for (let i = 0; i < 7; i++) {
                if (daily.time[i]) {
                  f7Days.push({
                    day: i === 0 ? "Hoje" : getDayOfWeekName(daily.time[i]),
                    maxTemp: Math.round(daily.temperature_2m_max[i]),
                    minTemp: Math.round(daily.temperature_2m_min[i]),
                    wmoCode: daily.weather_code[i]
                  });
                }
              }
            }
            setForecast7Days(f7Days);
            setLoading(false);
            return;
          }
        } catch (e) {
          console.error(e);
        }
      }

      // Default Sete Lagoas coordinates
      let lat = -19.4664;
      let lon = -44.2447;

      try {
        const geoRes = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=pt`);
        if (geoRes.ok) {
          const geoData = await geoRes.json();
          if (geoData.results && geoData.results.length > 0) {
            lat = geoData.results[0].latitude;
            lon = geoData.results[0].longitude;
          }
        }
      } catch (err) {
        console.error("Geocoding failed, using defaults:", err);
      }

      try {
        const weatherRes = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,wind_speed_10m,precipitation,weather_code&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max,weather_code&timezone=auto`);
        
        if (weatherRes.ok) {
          const wData = await weatherRes.json();
          
          // Save to sessionStorage
          sessionStorage.setItem(weatherCacheKey, JSON.stringify({
            timestamp: Date.now(),
            data: wData
          }));

          const cur = wData.current;
          const daily = wData.daily;
          
          const temp = cur.temperature_2m;
          const humidity = cur.relative_humidity_2m;
          const sigatokaRisk = (humidity > 75 && temp >= 21 && temp <= 30);
          
          const alerts = sigatokaRisk ? [
            {
              id: "1",
              type: "Sigatoka Negra",
              message: `Umidade elevada (${humidity}%) e temperatura propícia (${temp}°C) elevam o risco de Sigatoka Negra para CRÍTICO nas próximas 48h. Evite atraso na pulverização preventiva.`,
              level: "danger"
            }
          ] : [
            {
              id: "1",
              type: "Prevenção Geral",
              message: "Condições sob controle. Continue realizando a desfolha sanitária quinzenal nas glebas ativas.",
              level: "info"
            }
          ];

          setCurrentConditions({
            temp: parseFloat(temp.toFixed(1)),
            humidity: Math.round(humidity),
            windSpeed: Math.round(cur.wind_speed_10m),
            rainChance: daily.precipitation_probability_max ? daily.precipitation_probability_max[0] : 0,
            condition: mapWmoCode(cur.weather_code),
            wmoCode: cur.weather_code,
            thermalSensation: Math.round(temp + (humidity > 70 ? 1.2 : -0.8)),
            alerts
          });

          const forecastList = [];
          for (let i = 1; i <= 5; i++) {
            if (daily.time[i]) {
              forecastList.push({
                day: getDayName(daily.time[i], i - 1),
                tempMin: Math.round(daily.temperature_2m_min[i]),
                tempMax: Math.round(daily.temperature_2m_max[i]),
                condition: mapWmoCode(daily.weather_code[i]),
                rain: daily.precipitation_probability_max ? daily.precipitation_probability_max[i] : 0
              });
            }
          }
          setForecast(forecastList);

          const f7Days = [];
          if (daily && daily.time) {
            for (let i = 0; i < 7; i++) {
              if (daily.time[i]) {
                f7Days.push({
                  day: i === 0 ? "Hoje" : getDayOfWeekName(daily.time[i]),
                  maxTemp: Math.round(daily.temperature_2m_max[i]),
                  minTemp: Math.round(daily.temperature_2m_min[i]),
                  wmoCode: daily.weather_code[i]
                });
              }
            }
          }
          setForecast7Days(f7Days);
        }
      } catch (err) {
        console.error("Weather fetch failed:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchWeather();
  }, [city, state]);

  if (loading || loadingAreas) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="w-10 h-10 text-primary animate-spin" />
        </div>
      </Layout>
    );
  }

  // Agro recommendations based on current conditions
  const getSprayingAdvice = () => {
    if (currentConditions.windSpeed > 10) {
      return { status: "Crítico", message: "Evite pulverizações. Ventos acima de 10 km/h provocam alta deriva de defensivos.", color: "text-red-400", bg: "bg-red-500/10" };
    }
    if (currentConditions.humidity < 55) {
      return { status: "Atenção", message: "Evite pulverizações. Umidade abaixo de 55% causa evaporação acelerada das gotas.", color: "text-yellow-400", bg: "bg-yellow-500/10" };
    }
    return { status: "Excelente", message: "Condições ideais para pulverização de defensivos. Baixa deriva e boa absorção.", color: "text-emerald-400", bg: "bg-emerald-500/10" };
  };

  const getFertilizationAdvice = () => {
    if (currentConditions.rainChance > 70) {
      return { status: "Atenção", message: "Risco de lixiviação de Nitrogênio elevada. Adie adubações pesadas de solo se houver previsão de temporais.", color: "text-yellow-400", bg: "bg-yellow-500/10" };
    }
    return { status: "Seguro", message: "Bom momento para adubação de solo. Umidade suficiente para solubilização do fertilizante.", color: "text-emerald-400", bg: "bg-emerald-500/10" };
  };

  const getHarvestAdvice = () => {
    if (currentConditions.humidity > 85) {
      return { status: "Atenção", message: "Umidade muito alta pode favorecer estragos e mancha de látex na casca durante o corte. Cuidado no manuseio.", color: "text-yellow-400", bg: "bg-yellow-500/10" };
    }
    return { status: "Seguro", message: "Condições secas ideais para colheita, transporte e climatização de cachos de banana.", color: "text-emerald-400", bg: "bg-emerald-500/10" };
  };

  return (
    <Layout>
      <div className="max-w-7xl mx-auto space-y-10 pb-20">
        {/* Header Banner */}
        <div 
          className="hero-banner-container relative mx-[-1rem] mt-[-1rem] md:mx-[-2rem] md:mt-[-2rem] rounded-none md:rounded-b-[2.5rem] overflow-hidden px-8 pb-10 pt-24 md:px-12 md:pb-12 md:pt-28 min-h-[220px] flex flex-col md:flex-row justify-between items-center md:items-end gap-6 bg-cover bg-center border-none z-10"
          style={{ backgroundImage: `url(${bannerImg})` }}
        >
          {/* Película escura do tom do menu lateral (#02160a) para legibilidade perfeita */}
          <div className="absolute inset-0 bg-[#02160a]/85 backdrop-blur-[1px] z-0 pointer-events-none" />

          {/* Fade to white/page-background at the bottom */}
          <div className="absolute bottom-0 left-0 right-0 h-10 bg-gradient-to-t from-background to-transparent z-10 pointer-events-none" />

          <div className="relative z-10 max-w-3xl text-left">
            <h1 className="text-3xl md:text-4xl font-display font-bold !text-white mb-2 flex items-center gap-3">
              <span className="!text-white">Clima e</span> <span className="text-[#589c1c] dark:text-[#6ee7b7]">Previsão Agrícola</span>
              <CloudSun className="text-[#589c1c] dark:text-[#6ee7b7] w-8 h-8 shrink-0 animate-pulse" />
            </h1>
            <p className="!text-white text-sm md:text-base font-medium leading-relaxed opacity-95">
              Previsão meteorológica regional com foco em operações agrícolas e alertas fitossanitários.
            </p>
          </div>

          <div className="relative z-10 flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto shrink-0 mb-2">
            {areas.length > 0 && (
              <div className="flex items-center gap-2 bg-[#02160a]/50 border border-white/10 px-4 py-3 rounded-2xl">
                <span className="text-[10px] font-black uppercase !text-slate-400 mr-1 shrink-0">Área:</span>
                <select
                  value={selectedArea?.id || ""}
                  onChange={(e) => {
                    const areaId = e.target.value;
                    const area = areas.find(a => String(a.id) === areaId);
                    if (area) {
                      setSelectedArea(area);
                      setCity(area.city);
                      setState(area.state);
                      localStorage.setItem("selected_area_id", String(area.id));
                    }
                  }}
                  className="bg-transparent !text-white font-bold text-xs focus:outline-none border-none cursor-pointer pr-4 uppercase tracking-wider"
                >
                  {areas.map(a => (
                    <option key={a.id} value={a.id} className="bg-[#02160a] !text-white text-xs">
                      {a.name} ({a.property_name})
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="flex items-center gap-3 bg-[#02160a]/50 border border-white/10 px-6 py-3 rounded-2xl">
              <MapPin className="text-[#589c1c] dark:text-[#6ee7b7] w-5 h-5 shrink-0" />
              <span className="font-bold !text-white text-sm">{city} - {state}</span>
              {areas.length === 0 && (
                <button
                  onClick={() => {
                    setNewCity(city);
                    setNewState(state);
                    setShowLocModal(true);
                  }}
                  className="p-1 rounded-lg hover:bg-white/5 text-zinc-400 hover:text-white transition-colors cursor-pointer ml-1"
                  title="Alterar Localização"
                >
                  <Pencil size={14} />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Current Weather Widget */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div 
            className="lg:col-span-2 bg-white rounded-[2rem] p-6 border border-slate-100 shadow-sm flex flex-col justify-between"
          >
            <div>
              <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider">CLIMA ATUAL</span>
              <div className="flex justify-between items-center mt-3">
                <div className="flex items-center gap-3">
                  {getWeatherIcon(currentConditions.wmoCode, 44)}
                  <div>
                    <h2 className="text-3xl font-display font-black text-slate-800">{currentConditions.temp}°C</h2>
                    <p className="text-xs text-slate-400 font-semibold">{currentConditions.condition} • Sensação {currentConditions.thermalSensation}°C</p>
                  </div>
                </div>

                <div className="text-right space-y-1">
                  <div className="flex items-center gap-1.5 justify-end text-xs text-slate-500">
                    <Droplets size={14} className="text-blue-500" />
                    <span className="font-semibold text-slate-700">{currentConditions.humidity}%</span>
                    <span className="text-[10px] text-slate-400">UMIDADE</span>
                  </div>
                  <div className="flex items-center gap-1.5 justify-end text-xs text-slate-500">
                    <Wind size={14} className="text-slate-400" />
                    <span className="font-semibold text-slate-700">{currentConditions.windSpeed} km/h</span>
                    <span className="text-[10px] text-slate-400">VENTO</span>
                  </div>
                  <div className="flex items-center gap-1.5 justify-end text-xs text-slate-500">
                    <CloudRain size={14} className="text-blue-500" />
                    <span className="font-semibold text-slate-700">{currentConditions.rainChance} mm</span>
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

          {/* Disease Alerts Column */}
          <div className="space-y-6">
            <h3 className="text-lg font-bold text-white">Alertas Sanitários</h3>
            
            {currentConditions.alerts.map(alert => (
              <div key={alert.id} className="glass-card p-6 rounded-3xl border-red-500/20 bg-red-500/5 flex gap-4">
                <AlertTriangle className="text-red-400 shrink-0" size={24} />
                <div>
                  <h4 className="font-bold text-white text-sm uppercase tracking-wider mb-1">{alert.type}</h4>
                  <p className="text-xs text-zinc-400 leading-relaxed">{alert.message}</p>
                </div>
              </div>
            ))}

            <div className="glass-card p-6 rounded-3xl border-white/5 bg-zinc-900/40 flex gap-4">
              <Info className="text-primary shrink-0" size={20} />
              <div>
                <h4 className="font-bold text-white text-xs uppercase tracking-wider mb-1">Climatologia Cavendish</h4>
                <p className="text-xs text-zinc-500 leading-relaxed">
                  Temperaturas ótimas para bananeiras estão entre 22°C e 31°C. Ventos acima de 30 km/h podem rasgar folhas e derrubar plantas em fase de colheita.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Agro Recommendations Section */}
        <div className="space-y-6">
          <h3 className="text-2xl font-display font-bold text-white">Recomendações Operacionais do Dia</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Spraying Card */}
            <div className="glass-card p-6 rounded-3xl border-white/5 bg-zinc-900/30 flex flex-col justify-between">
              <div>
                <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mb-4">PULVERIZAÇÃO FOLIAR</p>
                <p className="text-sm text-zinc-300 leading-relaxed">{getSprayingAdvice().message}</p>
              </div>
              <div className={`mt-6 p-3.5 rounded-xl ${getSprayingAdvice().bg} flex items-center justify-between`}>
                <span className="text-xs font-semibold text-zinc-400">Status</span>
                <span className={`text-xs font-black uppercase ${getSprayingAdvice().color}`}>{getSprayingAdvice().status}</span>
              </div>
            </div>

            {/* Fertilization Card */}
            <div className="glass-card p-6 rounded-3xl border-white/5 bg-zinc-900/30 flex flex-col justify-between">
              <div>
                <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mb-4">ADUBAÇÃO DE SOLO</p>
                <p className="text-sm text-zinc-300 leading-relaxed">{getFertilizationAdvice().message}</p>
              </div>
              <div className={`mt-6 p-3.5 rounded-xl ${getFertilizationAdvice().bg} flex items-center justify-between`}>
                <span className="text-xs font-semibold text-zinc-400">Status</span>
                <span className={`text-xs font-black uppercase ${getFertilizationAdvice().color}`}>{getFertilizationAdvice().status}</span>
              </div>
            </div>

            {/* Harvest Card */}
            <div className="glass-card p-6 rounded-3xl border-white/5 bg-zinc-900/30 flex flex-col justify-between">
              <div>
                <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mb-4">COLHEITA E TRANSPORTE</p>
                <p className="text-sm text-zinc-300 leading-relaxed">{getHarvestAdvice().message}</p>
              </div>
              <div className={`mt-6 p-3.5 rounded-xl ${getHarvestAdvice().bg} flex items-center justify-between`}>
                <span className="text-xs font-semibold text-zinc-400">Status</span>
                <span className={`text-xs font-black uppercase ${getHarvestAdvice().color}`}>{getHarvestAdvice().status}</span>
              </div>
            </div>
          </div>
        </div>

        {/* 5-Day Forecast */}
        <div className="space-y-6">
          <h3 className="text-2xl font-display font-bold text-white">Previsão para os Próximos Dias</h3>
          
          <div className="glass-card rounded-[2.5rem] border-white/5 bg-zinc-900/20 overflow-hidden divide-y divide-white/5">
            {forecast.map((day, i) => (
              <div key={i} className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-white/[0.01] transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-primary">
                    <Calendar size={18} />
                  </div>
                  <div>
                    <p className="font-bold text-white text-base">{day.day}</p>
                    <p className="text-xs text-zinc-500">{day.condition}</p>
                  </div>
                </div>

                <div className="flex items-center gap-10">
                  {/* Rain chance */}
                  <div className="flex items-center gap-2">
                    <CloudRain size={16} className="text-blue-400" />
                    <span className="text-xs text-zinc-400 font-medium">{day.rain}% chance de chuva</span>
                  </div>

                  {/* Temp min/max */}
                  <div className="flex items-center gap-3">
                    <span className="text-zinc-500 text-xs font-semibold">Min: <span className="text-zinc-300">{day.tempMin}°C</span></span>
                    <span className="text-zinc-500 text-xs font-semibold">Max: <span className="text-white font-bold">{day.tempMax}°C</span></span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* EDIT LOCATION DIALOG */}
      <AnimatePresence>
        {showLocModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowLocModal(false)}
              className="fixed inset-0 bg-black/80 backdrop-blur-md"
            />

            <motion.div
              initial={{ scale: 0.95, y: 20, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.95, y: 20, opacity: 0 }}
              className="bg-zinc-950 border border-white/10 rounded-[2.5rem] w-full max-w-sm p-8 relative z-10 overflow-hidden shadow-2xl"
            >
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xl font-bold text-white">Localização da Fazenda</h3>
                <button
                  onClick={() => setShowLocModal(false)}
                  className="p-1.5 rounded-lg hover:bg-white/5 text-zinc-400 hover:text-white transition-colors cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>
              <p className="text-xs text-zinc-400 mb-6">
                Informe a cidade e estado para obter previsões meteorológicas e alertas sanitários reais para a sua lavoura.
              </p>

              <form onSubmit={handleSaveLocation} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">Cidade</label>
                  <input
                    type="text"
                    required
                    value={newCity}
                    onChange={(e) => setNewCity(e.target.value)}
                    placeholder="Ex: Sete Lagoas"
                    className="w-full bg-black/40 border border-white/10 rounded-2xl py-3 px-4 text-white text-sm focus:outline-none focus:border-primary/50"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">Estado (UF)</label>
                  <input
                    type="text"
                    required
                    maxLength={2}
                    value={newState}
                    onChange={(e) => setNewState(e.target.value)}
                    placeholder="Ex: MG"
                    className="w-full bg-black/40 border border-white/10 rounded-2xl py-3 px-4 text-white text-sm focus:outline-none focus:border-primary/50 uppercase"
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="submit"
                    disabled={updatingLoc}
                    className="flex-1 bg-primary hover:bg-primary-dark text-white font-bold py-3.5 rounded-2xl transition-all cursor-pointer text-sm shadow-md flex items-center justify-center gap-2"
                  >
                    {updatingLoc ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Salvando...
                      </>
                    ) : (
                      "Salvar Localização"
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowLocModal(false)}
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
