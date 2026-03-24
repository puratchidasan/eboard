import { useEffect, useMemo, useState } from "react";
import { Card } from "./components/Card";
import { Button } from "./components/Button";
import { AnimatedCounter } from "./components/AnimatedCounter";
import "./styles.css";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, ReferenceLine, AreaChart, Area } from "recharts";
import { Zap, Activity, TrendingUp, Euro, Download, Calendar, Settings, Info } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

function mean(arr) { return arr.reduce((a, b) => a + b, 0) / (arr.length || 1); }
function std(arr) {
  const m = mean(arr);
  return Math.sqrt(mean(arr.map(x => (x - m) ** 2)));
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.2 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
};

export default function App() {
  const [data, setData] = useState([]);
  const [metadata, setMetadata] = useState({});
  const [tariff, setTariff] = useState(0.25);
  const [windowKey, setWindowKey] = useState("24h");

  useEffect(() => {
    fetch(`${import.meta.env.BASE_URL}Consumption_data.csv`)
      .then(res => res.text())
      .then(text => {
        const rows = text.split(/\r?\n/).filter(r => r.trim());
        if (rows.length < 2) return;

        const firstDataRow = rows[1].split(";");
        setMetadata({
          ean: firstDataRow[4],
          meter: firstDataRow[5],
          type: firstDataRow[6],
          unit: firstDataRow[9]
        });

        const parsed = rows.slice(1).map(r => {
          const c = r.split(";");
          if (c.length < 9) return null;

          const dateParts = c[0].split("-");
          let ts = null;
          if (dateParts.length === 3) {
            // date is DD-MM-YYYY
            ts = new Date(`${dateParts[2]}-${dateParts[1]}-${dateParts[0]}T${c[1]}`);
          } else {
            ts = new Date(`${c[0]} ${c[1]}`);
          }

          // ensure valid date (isNaN checks if the date is invalid)
          if (isNaN(ts)) return null;

          return {
            ts,
            date: c[0],
            time: `${c[0].substring(0, 5)} ${c[1].substring(0, 5)}`, // Format: DD-MM HH:mm
            register: c[7]?.toLowerCase() || "",
            consumption: parseFloat(c[8]) || 0
          };
        })
        .filter(d => Boolean(d))
        .filter(d => d.register.includes("offtake"));

        // Sort by timestamp just in case
        parsed.sort((a, b) => a.ts - b.ts);

        setData(parsed);
      });
  }, []);

  const filtered = useMemo(() => {
    if (!data.length) return [];
    const now = new Date(Math.max(...data.map(d => d.ts)));
    let from = new Date(now);
    if (windowKey === "24h") from.setHours(from.getHours() - 24);
    if (windowKey === "7d") from.setDate(from.getDate() - 7);
    if (windowKey === "30d") from.setDate(from.getDate() - 30);
    return data.filter(d => d.ts >= from);
  }, [data, windowKey]);

  const values = filtered.map(d => d.consumption);
  const m = values.length ? mean(values) : 0;
  
  const total = values.reduce((a, b) => a + b, 0);
  const avg = values.length ? (total / values.length) : 0;
  const peak = values.length ? Math.max(...values, 0) : 0;
  const cost = total * tariff;

  const exportCSV = () => {
    const blob = new Blob(["date;time;consumption\n" + filtered.map(d => `${d.date};${d.time};${d.consumption}`).join("\n")]);
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "export.csv";
    a.click();
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass-card p-4 rounded-xl shadow-2xl z-50 border border-white/10"
        >
          <p className="text-slate-400 font-medium text-xs mb-2 uppercase tracking-wider">{label}</p>
          <div className="flex items-center gap-3">
            <div className="w-2.5 h-2.5 rounded-full bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.8)]" />
            <p className="text-white font-bold text-lg">
              {payload[0].value.toFixed(3)} <span className="text-xs text-indigo-300 font-normal">kWh</span>
            </p>
          </div>
        </motion.div>
      );
    }
    return null;
  };

  return (
    <div className="min-h-screen p-4 md:p-8 lg:p-12 max-w-[1400px] mx-auto space-y-8 tracking-tight selection:bg-indigo-500/30">

      {/* Header Area */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-8 border-b border-white/10"
      >
        <div className="space-y-2">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="absolute inset-0 bg-indigo-500 rounded-2xl blur-xl opacity-50 animate-pulse" />
              <div className="relative p-3 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl shadow-lg border border-white/20 text-white">
                <Zap size={28} className="fill-white/80" />
              </div>
            </div>
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white via-indigo-200 to-purple-200">
              Energy Center
            </h1>
          </div>
          <p className="text-slate-400 font-medium md:ml-[72px] text-lg">Actionable insights from your smart meter.</p>
        </div>

        <div className="flex items-center gap-2 md:ml-0 glass-card p-1.5 rounded-2xl">
          <Button variant="secondary" isActive={windowKey === "24h"} onClick={() => setWindowKey("24h")}><Calendar size={16} /> 24h</Button>
          <Button variant="secondary" isActive={windowKey === "7d"} onClick={() => setWindowKey("7d")}>7 Days</Button>
          <Button variant="secondary" isActive={windowKey === "30d"} onClick={() => setWindowKey("30d")}>30 Days</Button>
        </div>
      </motion.div>

      {/* Hero Stats Dashboard */}
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
      >
        <motion.div variants={itemVariants}>
          <Card className="hover:border-indigo-500/50 group">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-400 mb-1 flex items-center gap-2 group-hover:text-indigo-300 transition-colors">
                  <Zap size={16} className="text-indigo-400" /> Total Usage
                </p>
                <div className="flex items-baseline gap-1.5 mt-2">
                  <AnimatedCounter 
                    value={total} 
                    formatter={(v) => v.toFixed(1)} 
                    className="text-4xl font-black text-white tracking-tight" 
                  />
                  <span className="text-indigo-300/80 font-medium text-sm">kWh</span>
                </div>
              </div>
              <div className="p-3 bg-indigo-500/10 text-indigo-400 rounded-2xl border border-indigo-500/20 shadow-[0_0_15px_rgba(99,102,241,0.15)] group-hover:shadow-[0_0_25px_rgba(99,102,241,0.3)] transition-shadow">
                <Zap size={24} className="fill-indigo-500/20" />
              </div>
            </div>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card className="hover:border-blue-500/50 group">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-400 mb-1 flex items-center gap-2 group-hover:text-blue-300 transition-colors">
                  <Activity size={16} className="text-blue-400" /> Average
                </p>
                <div className="flex items-baseline gap-1.5 mt-2">
                  <AnimatedCounter 
                    value={avg} 
                    formatter={(v) => v.toFixed(2)} 
                    className="text-4xl font-black text-white tracking-tight" 
                  />
                  <span className="text-blue-300/80 font-medium text-sm">kWh</span>
                </div>
              </div>
              <div className="p-3 bg-blue-500/10 text-blue-400 rounded-2xl border border-blue-500/20 shadow-[0_0_15px_rgba(59,130,246,0.15)] group-hover:shadow-[0_0_25px_rgba(59,130,246,0.3)] transition-shadow">
                <Activity size={24} />
              </div>
            </div>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card className="hover:border-rose-500/50 group">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-400 mb-1 flex items-center gap-2 group-hover:text-rose-300 transition-colors">
                  <TrendingUp size={16} className="text-rose-400" /> Peak Load
                </p>
                <div className="flex items-baseline gap-1.5 mt-2">
                  <AnimatedCounter 
                    value={peak} 
                    formatter={(v) => v.toFixed(2)} 
                    className="text-4xl font-black text-white tracking-tight" 
                  />
                  <span className="text-rose-300/80 font-medium text-sm">kWh</span>
                </div>
              </div>
              <div className="p-3 bg-rose-500/10 text-rose-400 rounded-2xl border border-rose-500/20 shadow-[0_0_15px_rgba(244,63,94,0.15)] group-hover:shadow-[0_0_25px_rgba(244,63,94,0.3)] transition-shadow">
                <TrendingUp size={24} />
              </div>
            </div>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card className="hover:border-purple-500/50 border-purple-500/20 bg-purple-500/5 transition-colors group">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-semibold text-purple-300 mb-1 flex items-center gap-2">
                  <Euro size={16} className="text-emerald-400" /> Estimated Cost
                </p>
                <div className="flex items-baseline gap-1 mt-2">
                  <span className="text-4xl font-black text-white tracking-tight">€</span>
                  <AnimatedCounter 
                    value={cost} 
                    formatter={(v) => v.toFixed(2)} 
                    className="text-4xl font-black text-white tracking-tight" 
                  />
                </div>
              </div>
              <div className="p-3 bg-purple-500/10 rounded-2xl border border-purple-500/20 shadow-[0_0_15px_rgba(168,85,247,0.15)] group-hover:shadow-[0_0_25px_rgba(168,85,247,0.3)] transition-shadow">
                <Euro size={24} className="text-emerald-400" />
              </div>
            </div>
            
            <div className="mt-5 pt-4 border-t border-white/10 flex items-center justify-between text-xs font-medium text-slate-300">
                <span className="flex items-center gap-1.5"><Settings size={14} /> Tariff Rate</span>
                <div className="flex items-center gap-1 bg-black/20 px-3 py-1.5 rounded-lg border border-white/10 transition-colors focus-within:border-white/30 focus-within:bg-black/30">
                  <span>€</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    className="w-14 bg-transparent border-none p-0 focus:ring-0 text-white text-right outline-none font-semibold placeholder:text-indigo-200/50"
                    value={tariff}
                    onChange={e => setTariff(+e.target.value)}
                  />
                  <span className="text-indigo-200/70">/kWh</span>
                </div>
              </div>
          </Card>
        </motion.div>
      </motion.div>

      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 lg:grid-cols-3 gap-6"
      >
        {/* Main Chart Area */}
        <motion.div variants={itemVariants} className="lg:col-span-2">
          <Card className="h-full p-0 flex flex-col min-h-[480px]">
            <div className="p-6 md:p-8 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-xl font-bold text-white flex items-center gap-2 glow-text">
                  Consumption Timeline
                </h3>
                <p className="text-sm text-slate-400 font-medium mt-1">Electricity usage plotted over selected period.</p>
              </div>
              <Button onClick={exportCSV} variant="primary">
                <Download size={16} /> Export Data
              </Button>
            </div>

            <div className="flex-1 w-full p-4 pl-0 mt-4 min-h-[350px]">
              {filtered.length > 0 ? (
                <ResponsiveContainer width="100%" height={350}>
                  <AreaChart data={filtered} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorConsumption" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#818cf8" stopOpacity={0.5} />
                        <stop offset="95%" stopColor="#818cf8" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                    <XAxis
                      dataKey="time"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#64748b', fontSize: 13, fontWeight: 500, fontFamily: 'Outfit' }}
                      dy={10}
                      minTickGap={40}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#64748b', fontSize: 13, fontWeight: 500, fontFamily: 'Outfit' }}
                      dx={-10}
                    />
                    <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'rgba(255,255,255,0.1)', strokeWidth: 2 }} />
                    <ReferenceLine 
                      y={m} 
                      stroke="#64748b" 
                      strokeDasharray="4 4" 
                      label={{ position: 'top', value: 'Avg', fill: '#94a3b8', fontSize: 12, fontWeight: 600 }} 
                    />
                    <Area
                      type="monotone"
                      dataKey="consumption"
                      stroke="#818cf8"
                      strokeWidth={4}
                      fillOpacity={1}
                      fill="url(#colorConsumption)"
                      activeDot={{ r: 8, fill: '#818cf8', stroke: '#0f172a', strokeWidth: 3, style: { filter: 'drop-shadow(0px 0px 8px rgba(129,140,248,0.8))' } }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : null}
            </div>
          </Card>
        </motion.div>

        {/* Meter Details Sidebar */}
        <motion.div variants={itemVariants} className="h-full">
          <Card className="flex flex-col h-full bg-gradient-to-b from-slate-900/80 to-slate-900/40">
            <div className="mb-8 pb-6 border-b border-white/10">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <Info size={20} className="text-indigo-400" /> Meter Details
              </h3>
              <p className="text-sm text-slate-400 font-medium mt-1">Hardware identifier and specifications</p>
            </div>

            <div className="space-y-4 flex-1">
              <div className="bg-white/5 rounded-2xl p-5 border border-white/5 flex flex-col justify-center hover:bg-white/10 transition-colors">
                <span className="text-xs font-bold text-indigo-400 uppercase tracking-widest mb-1.5 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-500/50" /> EAN Number
                </span>
                <span className="text-slate-200 font-mono font-medium text-lg truncate" title={metadata.ean}>{metadata.ean || "Loading..."}</span>
              </div>
              <div className="bg-white/5 rounded-2xl p-5 border border-white/5 flex flex-col justify-center hover:bg-white/10 transition-colors">
                <span className="text-xs font-bold text-indigo-400 uppercase tracking-widest mb-1.5 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-500/50" /> Meter ID
                </span>
                <span className="text-slate-200 font-mono font-medium text-lg truncate" title={metadata.meter}>{metadata.meter || "Loading..."}</span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white/5 rounded-2xl p-5 border border-white/5 flex flex-col justify-center hover:bg-white/10 transition-colors">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5 flex items-center gap-2">
                    Type
                  </span>
                  <span className="text-slate-200 font-medium truncate" title={metadata.type}>{metadata.type || "..."}</span>
                </div>
                <div className="bg-white/5 rounded-2xl p-5 border border-white/5 flex flex-col justify-center hover:bg-white/10 transition-colors">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5 flex items-center gap-2">
                    Unit
                  </span>
                  <span className="text-slate-200 font-medium truncate" title={metadata.unit}>{metadata.unit || "..."}</span>
                </div>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-white/10 flex items-center justify-center">
              <div className="inline-flex items-center gap-2.5 px-4 py-2 bg-emerald-500/10 text-emerald-400 rounded-full text-sm font-bold border border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.15)] glow-text">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                </span>
                Live Connection Secure
              </div>
            </div>
          </Card>
        </motion.div>

      </motion.div>
    </div>
  );
}
