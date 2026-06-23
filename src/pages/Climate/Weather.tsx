import React, { useState, useEffect } from "react";
import Layout from "../../components/Layout/Layout";
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
  X
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
    alerts: [
      { id: "1", type: "Sigatoka Negra", message: "Umidade e temperatura elevadas elevam o risco de Sigatoka Negra para ALTO nas próximas 48h.", level: "warning" }
    ]
  });

  const [forecast, setForecast] = useState<any[]>([]);

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

  const getDayName = (dateStr: string, index: number): string => {
    if (index === 0) return "Amanhã";
    const date = new Date(dateStr + "T12:00:00");
    const days = ["Domingo", "Segunda-feira", "Terça-feira", "Quarta-feira", "Quinta-feira", "Sexta-feira", "Sábado"];
    return days[date.getDay()];
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
          const weatherData = await weatherRes.json();
          const cur = weatherData.current;
          const daily = weatherData.daily;
          
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
            temp: Math.round(temp),
            humidity: Math.round(humidity),
            windSpeed: Math.round(cur.wind_speed_10m),
            rainChance: daily.precipitation_probability_max ? daily.precipitation_probability_max[0] : 0,
            condition: mapWmoCode(cur.weather_code),
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
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-4xl font-display font-bold text-white mb-2 flex items-center gap-3">
              <CloudSun className="text-primary w-10 h-10" />
              Clima e Previsão Agrícola
            </h1>
            <p className="text-slate-400 text-lg">
              Previsão meteorológica regional com foco em operações agrícolas e alertas fitossanitários.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            {areas.length > 0 && (
              <div className="flex items-center gap-2 bg-zinc-900/50 border border-white/5 px-4 py-3 rounded-2xl">
                <span className="text-[10px] font-black uppercase text-slate-500 mr-1 shrink-0">Área:</span>
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
                  className="bg-transparent text-white font-bold text-xs focus:outline-none border-none cursor-pointer pr-4 uppercase tracking-wider"
                >
                  {areas.map(a => (
                    <option key={a.id} value={a.id} className="bg-zinc-950 text-white text-xs">
                      {a.name} ({a.property_name})
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="flex items-center gap-3 bg-zinc-900/50 border border-white/5 px-6 py-3 rounded-2xl">
              <MapPin className="text-primary w-5 h-5 shrink-0" />
              <span className="font-bold text-white text-sm">{city} - {state}</span>
              {areas.length === 0 && (
                <button
                  onClick={() => {
                    setNewCity(city);
                    setNewState(state);
                    setShowLocModal(true);
                  }}
                  className="p-1 rounded-lg hover:bg-white/5 text-zinc-500 hover:text-white transition-colors cursor-pointer ml-1"
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
          <div className="lg:col-span-2 glass-card p-8 rounded-[2.5rem] border-white/5 bg-gradient-to-br from-zinc-950 via-zinc-900/50 to-zinc-950 relative overflow-hidden flex flex-col justify-between min-h-[320px]">
            {/* Background Light */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl" />
            
            <div className="relative z-10 flex justify-between items-start">
              <div>
                <p className="text-sm font-bold text-zinc-500 uppercase tracking-widest">CONDIÇÕES ATUAIS</p>
                <h2 className="text-5xl font-black text-white mt-4">{currentConditions.temp}°C</h2>
                <p className="text-sm text-zinc-400 mt-2 font-medium">{currentConditions.condition}</p>
              </div>
              <div className="text-primary">
                <CloudSun size={80} className="animate-pulse" />
              </div>
            </div>

            <div className="relative z-10 grid grid-cols-3 gap-4 border-t border-white/5 pt-6 mt-8">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-primary">
                  <Droplets size={18} />
                </div>
                <div>
                  <p className="text-[10px] text-zinc-500 font-bold uppercase">Umidade</p>
                  <p className="text-sm font-bold text-white">{currentConditions.humidity}%</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-primary">
                  <Wind size={18} />
                </div>
                <div>
                  <p className="text-[10px] text-zinc-500 font-bold uppercase">Vento</p>
                  <p className="text-sm font-bold text-white">{currentConditions.windSpeed} km/h</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-primary">
                  <CloudRain size={18} />
                </div>
                <div>
                  <p className="text-[10px] text-zinc-500 font-bold uppercase">Chuva</p>
                  <p className="text-sm font-bold text-white">{currentConditions.rainChance}%</p>
                </div>
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
