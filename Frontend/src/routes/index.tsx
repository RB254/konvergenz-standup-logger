import React, { useState, useEffect, useCallback } from "react";
import { Activity, BarChart3, Sun, Cloud, Send, FileText, AlertTriangle, Users, RefreshCw, Phone, Mail, Trash2 } from "lucide-react";
import { IconBrandFacebook, IconBrandTwitter, IconBrandLinkedin, IconBrandInstagram } from "@tabler/icons-react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Cell } from "recharts";
import { standupsApi, authApi, StandupPost, StandupStats } from "../lib/api";
import { useAuth } from "../lib/auth";
import navbarBg from "../assets/Images/navbar-bg.png.png";
import knsLogo from "../assets/Images/Kns Logo.png";

// ── Brand Tokens ──────────────────────────────────────────────────────────────
const NAVY  = "#003366";
const RED   = "#FF2E2E";
const BG    = "#F8FAFC";

// ── Official KNS Wordmark Logo ─────────────────────────────────────────────────
const KNSLogo = () => (
  <div className="flex items-center gap-2.5 select-none">
    {/* Official PNG Logo */}
    <img src={knsLogo} alt="Konvergenz Logo" className="h-10 w-auto object-contain" />
    {/* Wordmark */}
    <div className="flex flex-col leading-none">
      <span style={{ color: "#FFFFFF", fontWeight: 800, fontSize: 15, letterSpacing: "0.14em", textShadow: "0 1px 3px rgba(0,0,0,0.5)" }}>KONVERGENZ</span>
      <span style={{ color: RED,  fontWeight: 700, fontSize: 9,  letterSpacing: "0.12em", textShadow: "0 1px 2px rgba(0,0,0,0.4)" }}>NETWORK SOLUTIONS</span>
    </div>
  </div>
);

// ── Weather Hook ──────────────────────────────────────────────────────────────
interface WeatherState { temp: number | null; desc: string; code: number | null; loading: boolean; }
function useWeather(): WeatherState {
  const [w, setW] = useState<WeatherState>({ temp: null, desc: "Mostly clear", code: null, loading: true });
  useEffect(() => {
    fetch("https://api.open-meteo.com/v1/forecast?latitude=-1.2921&longitude=36.8219&current_weather=true")
      .then(r => r.json())
      .then(d => {
        const cw = d?.current_weather;
        const code: number = cw?.weathercode ?? 0;
        const desc = code <= 1 ? "Mostly clear" : code <= 3 ? "Partly cloudy" : code <= 48 ? "Foggy" : code <= 67 ? "Rainy" : "Overcast";
        setW({ temp: cw?.temperature != null ? Math.round(cw.temperature) : 16, desc, code, loading: false });
      })
      .catch(() => setW({ temp: 16, desc: "Mostly clear", code: 0, loading: false }));
  }, []);
  return w;
}

// ── Demo Data ─────────────────────────────────────────────────────────────────
const fallbackStats: StandupStats = {
  total_posts: 32, active_members: 5, total_blockers: 8, blocker_count: 8,
  posts_per_day: [
    { date: "Fri", count: 3 }, { date: "Sat", count: 5 }, { date: "Sun", count: 2 },
    { date: "Mon", count: 8 }, { date: "Tue", count: 5 }, { date: "Wed", count: 4 }, { date: "Thu", count: 5 }
  ]
};
const fallbackFeed: StandupPost[] = [
  { _id:"1", author:"Amelia Otieno",  yesterday:"Shipped the new onboarding flow and reviewed two PRs from the platform team.", today:"Pairing with Marcus on the billing webhook + writing the post-mortem doc.", blockers:"Waiting on access to the staging Stripe account.", has_blocker:true,  file_attachment:null, timestamp:"14 minutes ago" },
  { _id:"2", author:"Marcus Wanjiku", yesterday:"Cleaned up the metrics service and migrated the old cron jobs.",               today:"Implementing the retry policy for failed webhook deliveries.",            blockers:"None",                                              has_blocker:false, file_attachment:null, timestamp:"about 1 hour ago" },
  { _id:"3", author:"Priya Shah",     yesterday:"Design review with marketing — landing page v3 is approved.",                  today:"Cutting the Figma specs for the dashboard refresh and syncing with eng.", blockers:"None",                                              has_blocker:false, file_attachment:null, timestamp:"about 3 hours ago" },
  { _id:"4", author:"Daniel Kim",     yesterday:"Investigated the slow query on the reports endpoint, found a missing index.",  today:"Rolling out the new index in staging then prod, watching p95 latency.",  blockers:"DB migration window is tight — coordinating with SRE.", has_blocker:true,  file_attachment:null, timestamp:"about 6 hours ago" },
  { _id:"5", author:"Lerato Nkokena", yesterday:"Wrote integration tests for the new audit flow.",                              today:"Code review backlog + 1:1s with the new hires.",                        blockers:"None",                                              has_blocker:false, file_attachment:null, timestamp:"about 22 hours ago" },
];

// ── Helpers ───────────────────────────────────────────────────────────────────
const initials = (n?: string) => {
  if (!n) return "";
  return n.split(" ").map(x => x[0]).join("").substring(0, 2).toUpperCase();
};
const AVATAR_BG  = [NAVY, "#7f1d1d", "#1e3a5f", "#14532d", "#312e81"];
const avatarBg = (n?: string) => {
  if (!n) return NAVY;
  return AVATAR_BG[n.charCodeAt(0) % AVATAR_BG.length];
};

const barFill = (entry: { count: number }, allData?: { count: number }[]) => {
  if (!allData || allData.length === 0) return NAVY;
  const max = Math.max(...allData.map(d => d?.count ?? 0));
  return entry?.count === max ? RED : NAVY;
};

// Form style tokens
const labelCls = "block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5";
const inputCls = "w-full rounded-[6px] border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:border-[#003366] focus:ring-1 focus:ring-[#003366] focus:outline-none transition-colors";

// ── Component ─────────────────────────────────────────────────────────────────
export default function App() {
  const { user, isAuthenticated, ready, signOut } = useAuth();
  const weather = useWeather();

  const [feed,  setFeed]  = useState<StandupPost[]>(fallbackFeed);
  const [stats, setStats] = useState<StandupStats>(fallbackStats);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  // Standup form states
  const [yesterday,   setYesterday]   = useState("");
  const [today,       setToday]       = useState("");
  const [blockers,    setBlockers]    = useState("");
  const [hasBlocker,  setHasBlocker]  = useState(false);
  const [attachName,  setAttachName]  = useState<string | null>(null);
  const [attachFile,  setAttachFile]  = useState<File | null>(null);

  // Form Validation Error hooks
  const [yesterdayError, setYesterdayError] = useState<string | null>(null);
  const [todayError, setTodayError] = useState<string | null>(null);

  // Admin Provision Panel states
  const [activeTab, setActiveTab] = useState<"form" | "provision">("form");
  const [provName, setProvName] = useState("");
  const [provEmail, setProvEmail] = useState("");
  const [provPassword, setProvPassword] = useState("");
  const [provRole, setProvRole] = useState<"employee" | "admin">("employee");
  const [provSubmitting, setProvSubmitting] = useState(false);
  const [provisionError, setProvisionError] = useState<string | null>(null);
  const [provisionSuccess, setProvisionSuccess] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const [f, s] = await Promise.all([standupsApi.list(), standupsApi.stats()]);
      if (f) setFeed(f);
      if (s) setStats(s);
    } catch { /* offline fallback */ } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      fetchData();
      const id = setInterval(fetchData, 10000);
      return () => clearInterval(id);
    }
  }, [isAuthenticated, fetchData]);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) { setAttachName(null); setAttachFile(null); return; }
    setAttachName(file.name);
    setAttachFile(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setYesterdayError(null);
    setTodayError(null);

    let validationFailed = false;
    if (!yesterday.trim()) {
      setYesterdayError("Please share what you worked on yesterday.");
      validationFailed = true;
    }
    if (!today.trim()) {
      setTodayError("Please share your plan for today.");
      validationFailed = true;
    }

    if (validationFailed) return;

    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append("yesterday", yesterday);
      fd.append("today", today);   
      fd.append("blockers", blockers);
      fd.append("has_blocker", hasBlocker.toString());
      if (attachFile) {
        fd.append("file", attachFile);
      }
      await standupsApi.create(fd);
      await fetchData();
    } catch {
      // Offline fallback state update
      setFeed(prev => [{ _id: Date.now().toString(), user_id: user?.id, author: user?.name || "Self", yesterday, today, blockers: blockers||"None", has_blocker: hasBlocker, file_attachment: attachName, timestamp:"Just now" }, ...prev]);
      setStats(prev => ({ 
        ...prev, 
        total_posts: (prev?.total_posts ?? 0) + 1, 
        total_blockers: hasBlocker ? (prev?.total_blockers ?? 0) + 1 : (prev?.total_blockers ?? 0),
        blocker_count: hasBlocker ? (prev?.blocker_count ?? 0) + 1 : (prev?.blocker_count ?? 0),
        active_members: prev?.active_members ?? 5,
        posts_per_day: prev?.posts_per_day ?? []
      }));
    } finally {
      setSubmitting(false); 
      setYesterday(""); 
      setToday(""); 
      setBlockers(""); 
      setHasBlocker(false); 
      setAttachName(null); 
      setAttachFile(null);
      const fi = document.getElementById("file-upload") as HTMLInputElement;
      if (fi) fi.value = "";
    }
  };

  const handleProvision = async (e: React.FormEvent) => {
    e.preventDefault();
    setProvisionError(null);
    setProvisionSuccess(null);
    setProvSubmitting(true);
    try {
      await authApi.provisionUser({
        name: provName,
        email: provEmail,
        password: provPassword,
        role: provRole
      });
      setProvisionSuccess(`Account for "${provName}" (${provEmail}) provisioned successfully!`);
      setProvName("");
      setProvEmail("");
      setProvPassword("");
      setProvRole("employee");
    } catch (err: any) {
      setProvisionError(err?.response?.data?.error || "Failed to provision user.");
    } finally {
      setProvSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this standup?")) return;
    try {
      await standupsApi.delete(id);
      await fetchData();
    } catch {
      setFeed(prev => prev.filter(p => p._id !== id));
    }
  };

  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white">
        <div className="text-center space-y-3">
          <RefreshCw className="h-8 w-8 text-[#FF2E2E] animate-spin mx-auto" />
          <p className="text-sm font-semibold tracking-wider uppercase text-slate-400">Loading KNS Standup Session...</p>
        </div>
      </div>
    );
  }

  // if (!isAuthenticated) {
  //   return <LoginPage />;
  // }

  const blockerRate = stats?.total_posts ? Math.round(((stats?.total_blockers ?? 0) / stats.total_posts) * 100) : 0;

  return (
    <div className="flex min-h-screen flex-col font-sans" style={{ background: BG }}>

      {/* ── TOP UTILITY BAR ────────────────────────────────────────────── */}
      <div className="w-full text-white" style={{ background: NAVY }}>
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-1.5">
          <div className="flex items-center gap-5 text-[11px]" style={{ color: "#a8c4e0" }}>
            <a href="tel:+254709208000" className="flex items-center gap-1.5 hover:text-white transition-colors">
              <Phone className="h-3 w-3" />+254 70 920 8000
            </a>
            <a href="mailto:support@konvergenz.co.ke" className="flex items-center gap-1.5 hover:text-white transition-colors">
              <Mail className="h-3 w-3" />support@konvergenz.co.ke
            </a>
          </div>
          <div className="flex items-center gap-3">
            {[IconBrandFacebook, IconBrandTwitter, IconBrandLinkedin, IconBrandInstagram].map((Icon, i) => (
              <a key={i} href="#" style={{ color: "#a8c4e0" }} className="hover:text-white transition-colors"><Icon className="h-3.5 w-3.5" /></a>
            ))}
          </div>
        </div>
      </div>

      {/* ── MAIN HEADER ────────────────────────────────────────────────── */}
      <header
        className="sticky top-0 z-50 w-full shadow-md"
        style={{
          backgroundImage: `url(${navbarBg})`,
          backgroundSize: "cover",
          backgroundPosition: "center left",
          backgroundRepeat: "no-repeat",
          height: "70px",
        }}
      >
        <div className="flex h-full max-w-6xl mx-auto items-center justify-between px-5">
          <KNSLogo />
          <div className="hidden text-[11px] font-semibold text-white md:block tracking-wide" style={{ textShadow: "0 1px 3px rgba(0,0,0,0.4)" }}>
            KONVERGENZ TEAM STANDUP
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-1.5 text-[12px] text-white animate-fade-in" style={{ textShadow: "0 1px 2px rgba(0,0,0,0.5)" }}>
              {(weather?.code ?? 0) <= 1 ? <Sun className="h-4 w-4 text-yellow-300" /> : <Cloud className="h-4 w-4 text-white/70" />}
              <span>Nairobi {weather?.loading ? "…" : `${weather?.temp ?? 16}°C`} · {weather?.desc ?? ""}</span>
            </div>
            
            {/* User credentials and Sign Out */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 rounded-[6px] px-3 py-1.5 text-[11px] font-bold text-white shadow-sm" style={{ background: RED }}>
                <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
                {user?.name} ({user?.role === "admin" ? "Admin" : "Employee"})
              </div>
              <button
                onClick={signOut}
                className="rounded-[6px] border border-white/30 hover:border-white text-white px-3 py-1.5 text-[11px] font-bold transition bg-white/10 hover:bg-white/20 cursor-pointer"
              >
                LOG OUT
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* ── PAGE CONTENT ───────────────────────────────────────────────── */}
      <main className="mx-auto w-full max-w-6xl flex-1 space-y-8 px-5 py-8">

        {/* Hero */}
        <section className="border-l-4 pl-4" style={{ borderColor: RED }}>
          <p className="text-[10px] font-bold uppercase tracking-[0.22em]" style={{ color: RED }}>Today · Daily Sync</p>
          <h1 className="mt-1 text-[28px] font-extrabold tracking-tight" style={{ color: NAVY }}>Good day, team. Let's sync up.</h1>
          <p className="mt-1 max-w-xl text-[13px] text-slate-500">Drop your async standup, scan team activity, and watch productivity trends — all in one place.</p>
        </section>

        {/* ── STANDUP / PROVISION FORM CARD ─────────────────────────────────── */}
        <div className="rounded-[8px] border border-slate-200 bg-white overflow-hidden shadow-sm">
          <div className="border-b border-slate-100 px-6 py-4 flex flex-col md:flex-row md:items-center justify-between gap-3" style={{ background: "#f4f6f9" }}>
            <div>
              <h2 className="text-[13px] font-bold" style={{ color: NAVY }}>
                {activeTab === "form" ? "Submit today's standup" : "Provision New Member"}
              </h2>
              <p className="text-[11px] text-slate-500 mt-0.5">
                {activeTab === "form" 
                  ? "Three quick prompts. Files are optional — screenshots help when you're blocked."
                  : "Insert a new pre-provisioned user credential into the system database."}
              </p>
            </div>
            
            {/* Show Tab Switcher for Admin only */}
            {user?.role === "admin" && (
              <div className="flex gap-2">
                <button
                  onClick={() => setActiveTab("form")}
                  className={`px-3 py-1.5 rounded-[4px] text-[11.5px] font-bold transition ${activeTab === "form" ? "bg-[#003366] text-white" : "bg-slate-200 text-slate-700 hover:bg-slate-300 cursor-pointer"}`}
                >
                  Submit Standup
                </button>
                <button
                  onClick={() => setActiveTab("provision")}
                  className={`px-3 py-1.5 rounded-[4px] text-[11.5px] font-bold transition ${activeTab === "provision" ? "bg-[#003366] text-white" : "bg-slate-200 text-slate-700 hover:bg-slate-300 cursor-pointer"}`}
                >
                  Provision Member
                </button>
              </div>
            )}
          </div>

          {activeTab === "provision" ? (
            <form onSubmit={handleProvision} className="p-6 space-y-5 animate-fade-in">
              {provisionError && (
                <div className="rounded-[6px] border border-red-200 bg-red-50 p-4 text-xs font-semibold text-red-700">
                  {provisionError}
                </div>
              )}
              {provisionSuccess && (
                <div className="rounded-[6px] border border-green-200 bg-green-50 p-4 text-xs font-semibold text-green-700">
                  {provisionSuccess}
                </div>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className={labelCls}>Name <span style={{ color: RED }}>*</span></label>
                  <input
                    type="text"
                    required
                    value={provName}
                    onChange={e => setProvName(e.target.value)}
                    className={inputCls}
                    placeholder="e.g. Jane Doe"
                  />
                </div>
                <div>
                  <label className={labelCls}>Email Address <span style={{ color: RED }}>*</span></label>
                  <input
                    type="email"
                    required
                    value={provEmail}
                    onChange={e => setProvEmail(e.target.value)}
                    className={inputCls}
                    placeholder="e.g. jane@konvergenz.co.ke"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className={labelCls}>Password <span style={{ color: RED }}>*</span></label>
                  <input
                    type="password"
                    required
                    value={provPassword}
                    onChange={e => setProvPassword(e.target.value)}
                    className={inputCls}
                    placeholder="Enter password"
                  />
                </div>
                <div>
                  <label className={labelCls}>Role <span style={{ color: RED }}>*</span></label>
                  <select
                    value={provRole}
                    onChange={e => setProvRole(e.target.value as "employee" | "admin")}
                    className={inputCls}
                  >
                    <option value="employee">Employee</option>
                    <option value="admin">Admin / Team Manager</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end pt-1">
                <button
                  type="submit"
                  disabled={provSubmitting}
                  className="rounded-[6px] px-6 py-2.5 text-[11px] font-bold tracking-widest text-white transition disabled:opacity-60 bg-[#003366] hover:bg-[#002244] cursor-pointer"
                >
                  {provSubmitting ? "PROVISIONING..." : "PROVISION USER"}
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className={labelCls}>Yesterday <span style={{ color: RED }}>*</span></label>
                  <textarea 
                    value={yesterday} 
                    onChange={e => { setYesterday(e.target.value); if (e.target.value.trim()) setYesterdayError(null); }} 
                    className={`${inputCls} h-24 resize-none ${yesterdayError ? "border-red-500 focus:border-red-500 focus:ring-red-500" : ""}`} 
                    placeholder="What you shipped or worked on" 
                  />
                  {yesterdayError && <span className="text-xs text-red-600 mt-1 block font-medium">{yesterdayError}</span>}
                </div>
                <div>
                  <label className={labelCls}>Today <span style={{ color: RED }}>*</span></label>
                  <textarea 
                    value={today} 
                    onChange={e => { setToday(e.target.value); if (e.target.value.trim()) setTodayError(null); }} 
                    className={`${inputCls} h-24 resize-none ${todayError ? "border-red-500 focus:border-red-500 focus:ring-red-500" : ""}`} 
                    placeholder="Your plan for today" 
                  />
                  {todayError && <span className="text-xs text-red-600 mt-1 block font-medium">{todayError}</span>}
                </div>
              </div>
              <div>
                <label className={labelCls}>Blockers</label>
                <textarea value={blockers} onChange={e => setBlockers(e.target.value)} className={`${inputCls} h-16 resize-none`} placeholder="Anything in your way?" />
              </div>
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pt-1">
                <div className="flex flex-wrap items-center gap-5">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={hasBlocker} onChange={e => setHasBlocker(e.target.checked)} className="h-4 w-4 rounded border-slate-300 cursor-pointer" style={{ accentColor: RED }} />
                    <span className="text-[13px] font-medium text-slate-700">I am blocked</span>
                  </label>
                  <div className="flex items-center gap-2 text-[13px] text-slate-600">
                    <span className="font-medium">Attachment</span>
                    <input type="file" id="file-upload" onChange={handleFile}
                      className="text-[11px] text-slate-500 file:mr-2 file:py-1 file:px-3 file:rounded-[4px] file:border-0 file:bg-slate-100 file:text-slate-700 file:font-semibold hover:file:bg-slate-200 file:cursor-pointer" />
                    {attachName && <span className="text-[11px] font-medium text-green-700 truncate max-w-[110px]">{attachName}</span>}
                  </div>
                </div>
                <button type="submit" disabled={submitting}
                  className="flex items-center gap-2 rounded-[6px] px-6 py-2.5 text-[11px] font-bold tracking-widest text-white transition disabled:opacity-60 w-full md:w-auto justify-center cursor-pointer"
                  style={{ background: submitting ? "#cc1111" : RED }}>
                  <Send className="h-3.5 w-3.5" />
                  {submitting ? "SUBMITTING…" : "SUBMIT STANDUP"}
                </button>
              </div>
            </form>
          )}
        </div>

        {/* ── PRODUCTIVITY DASHBOARD ──────────────────────────────────── */}
        <section className="space-y-5">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" style={{ color: NAVY }} />
            <h2 className="text-[12px] font-bold uppercase tracking-widest" style={{ color: NAVY }}>Productivity Dashboard</h2>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 px-4 rounded-[8px] border border-slate-200 bg-white shadow-sm">
              <RefreshCw className="h-8 w-8 text-[#003366] animate-spin mb-3" />
              <p className="text-sm font-semibold text-slate-600">Syncing dashboard data...</p>
              <p className="text-xs text-slate-400 mt-1">Retrieving latest team metrics and standup updates</p>
            </div>
          ) : (
            <>
              {/* Stat cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  { label: "Total Posts",    value: stats?.total_posts ?? 0,    icon: <FileText className="h-5 w-5" />,      bg: "#eef2f7", fg: NAVY },
                  { label: "Total Blockers", value: stats?.total_blockers ?? 0, icon: <AlertTriangle className="h-5 w-5" />, bg: "#fff0f0", fg: RED  },
                  { label: "Active Members", value: stats?.active_members ?? 0, icon: <Users className="h-5 w-5" />,         bg: "#eefaf3", fg: "#166534" },
                ].map(c => (
                  <div key={c.label} className="rounded-[8px] border border-slate-200 bg-white p-5 flex items-center gap-4 shadow-sm">
                    <div className="h-10 w-10 rounded-[6px] flex items-center justify-center" style={{ background: c.bg, color: c.fg }}>{c.icon}</div>
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{c.label}</p>
                      <p className="text-2xl font-black" style={{ color: NAVY }}>{c.value}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* 75 / 25 split */}
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
                {/* Bar chart — takes 75% for Admin, 100% for Employee */}
                <div className={`${user?.role === "admin" ? "lg:col-span-3" : "lg:col-span-4"} rounded-[8px] border border-slate-200 bg-white p-6 shadow-sm`}>
                  <p className="text-[13px] font-bold mb-5" style={{ color: NAVY }}>Posts per day · last 7 days</p>
                  <div className="h-52">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={stats?.posts_per_day ?? []} margin={{ top: 4, right: 4, left: -22, bottom: 0 }}>
                        <CartesianGrid vertical={false} stroke="#e8ecf0" strokeDasharray="3 3" />
                        <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} tickMargin={8} />
                        <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                        <Tooltip cursor={{ fill: "#f1f5f9" }} contentStyle={{ borderRadius: "6px", border: "1px solid #e2e8f0", fontSize: "12px" }} />
                        <Bar dataKey="count" radius={[3, 3, 0, 0]} maxBarSize={50}>
                          {(stats?.posts_per_day ?? []).map((entry, i) => (
                            <Cell key={i} fill={barFill(entry, stats?.posts_per_day)} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Blocker summary — 25% (Admin Only) */}
                {user?.role === "admin" && (
                  <div className="lg:col-span-1 rounded-[8px] border border-slate-200 bg-white p-6 shadow-sm flex flex-col">
                    <p className="text-[13px] font-bold mb-5" style={{ color: NAVY }}>Blocker summary</p>
                    <div className="flex-1 flex flex-col justify-end space-y-3 text-[13px]">
                      {[
                        { label: "Last 7 days",      value: stats?.total_blockers ?? 0 },
                        { label: "All-time blockers", value: stats?.total_blockers ?? 0 },
                      ].map(r => (
                        <div key={r.label} className="flex justify-between items-center border-b border-slate-100 pb-3">
                          <span className="text-slate-500">{r.label}</span>
                          <span className="font-black text-lg" style={{ color: NAVY }}>{r.value}</span>
                        </div>
                      ))}
                      <div className="flex justify-between items-center pb-1">
                        <span className="text-slate-500">Blocker rate</span>
                        <span className="font-black text-lg" style={{ color: RED }}>{blockerRate}%</span>
                      </div>
                      <div className="w-full rounded-full h-2 overflow-hidden" style={{ background: "#e8ecf0" }}>
                        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${blockerRate}%`, background: RED }} />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </section>

        {/* ── LIVE ACTIVITY FEED ──────────────────────────────────────── */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4" style={{ color: NAVY }} />
              <h2 className="text-[12px] font-bold uppercase tracking-widest" style={{ color: NAVY }}>Live Activity Feed</h2>
            </div>
            <div className="flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-500 shadow-sm">
              Refreshes every 10s
              <RefreshCw className="h-3 w-3 text-slate-400 ml-1" style={{ animation: "spin 3s linear infinite" }} />
            </div>
          </div>

          {/* Inner card */}
          <div className="rounded-[8px] border border-slate-200 bg-white shadow-sm overflow-hidden">
            <div className="border-b border-slate-100 px-6 py-3 flex items-center justify-between" style={{ background: "#f4f6f9" }}>
              <div>
                <p className="text-[12px] font-bold" style={{ color: NAVY }}>LIVE ACTIVITY</p>
                <p className="text-[10px] text-slate-400 mt-0.5">Refreshes every 10s</p>
              </div>
              <RefreshCw className="h-4 w-4 text-slate-300" />
            </div>

            <div className="divide-y divide-slate-100">
              {(feed ?? []).map(post => (
                <div key={post?._id} className="px-6 py-5 hover:bg-[#fafbfc] transition-colors">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full text-white flex items-center justify-center text-[13px] font-bold shrink-0" style={{ background: avatarBg(post?.author) }}>
                        {initials(post?.author)}
                      </div>
                      <div>
                        <p className="text-[13px] font-bold" style={{ color: NAVY }}>{post?.author}</p>
                        <p className="text-[11px] text-slate-400">{post?.timestamp}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {post?.has_blocker && (
                        <span className="flex items-center gap-1.5 text-white text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-[4px]" style={{ background: RED }}>
                          <AlertTriangle className="h-3 w-3" />[B] BLOCKED
                        </span>
                      )}
                      {/* Delete button check: Admin OR post author's own card */}
                      {post?._id && (user?.role === "admin" || post?.user_id === user?.id) && (
                        <button
                          onClick={() => handleDelete(post._id!)}
                          className="p-1.5 rounded-[4px] hover:bg-red-50 text-slate-400 hover:text-red-600 transition-colors cursor-pointer"
                          title="Delete standup"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-[13px]">
                    {[
                      { label: "Yesterday", val: post?.yesterday, red: false },
                      { label: "Today",     val: post?.today,     red: false },
                      { label: "Blockers",  val: post?.blockers || "None", red: post?.has_blocker },
                    ].map(col => (
                      <div key={col.label} className="space-y-1">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{col.label}</p>
                        <p className={`leading-relaxed ${col.red ? "font-medium" : "text-slate-700"}`} style={col.red ? { color: RED } : {}}>{col.val}</p>
                      </div>
                    ))}
                  </div>
                  {post?.file_attachment && (
                    <div className="mt-3 flex items-center gap-1.5 text-[11px] font-medium" style={{ color: NAVY }}>
                      <FileText className="h-3.5 w-3.5" />
                      <a 
                        href={post.file_attachment.startsWith("http") || post.file_attachment.startsWith("data:") ? post.file_attachment : `http://localhost:5000${post.file_attachment.startsWith("/") ? "" : "/"}${post.file_attachment}`}
                        target="_blank" 
                        rel="noreferrer"
                        className="hover:underline"
                      >
                        {post.file_attachment.split("/").pop()}
                      </a>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      {/* ── FOOTER ─────────────────────────────────────────────────────── */}
      <footer style={{ background: NAVY }} className="mt-12">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-5 py-8 md:flex-row">
          <p className="text-[11px] text-center" style={{ color: "#7aa3c8" }}>
            Copyright &copy; 2026 Konvergenz Network Solutions. All Rights Reserved. | Internal Team Tool
          </p>
          <div className="flex items-center gap-3">
            {[IconBrandFacebook, IconBrandTwitter, IconBrandLinkedin, IconBrandInstagram].map((Icon, i) => (
              <a key={i} href="#" className="flex h-8 w-8 items-center justify-center rounded-full transition" style={{ background: "rgba(255,255,255,0.1)", color: "#a8c4e0" }}
                onMouseEnter={e => (e.currentTarget.style.background = RED)}
                onMouseLeave={e => (e.currentTarget.style.background = "rgba(255,255,255,0.1)")}>
                <Icon className="h-4 w-4" />
              </a>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}

// ── CUSTOM STYLISH LOGIN PAGE ──────────────────────────────────────────────────
function LoginPage() {
  const { signIn } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await authApi.login(email, password);
      signIn(res.token);
    } catch (err: any) {
      setError(err?.response?.data?.error || "Invalid email or password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 px-4 relative overflow-hidden">
      {/* Decorative background grid pattern */}
      <div className="absolute inset-0 opacity-10 bg-[linear-gradient(to_right,#808080_1px,transparent_1px),linear-gradient(to_bottom,#808080_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />
      
      <div className="w-full max-w-md bg-white rounded-[12px] shadow-2xl overflow-hidden border border-slate-100 z-10">
        
        {/* Top brand header */}
        <div className="p-8 text-center text-white relative overflow-hidden" style={{ background: NAVY }}>
          {/* Subtle grid pattern inside header */}
          <div className="absolute inset-0 opacity-20 bg-[linear-gradient(to_right,#fff_1px,transparent_1px),linear-gradient(to_bottom,#fff_1px,transparent_1px)] bg-[size:16px_16px]" />
          <div className="relative z-10 flex flex-col items-center">
            {/* Wordmark and mini dot */}
            <div className="flex items-center gap-2 mb-2 select-none">
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: RED }} />
              <span className="text-[14px] font-black tracking-[0.25em] uppercase">Konvergenz</span>
            </div>
            <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#a8c4e0]">
              Team Standup Logger
            </p>
          </div>
        </div>

        {/* Login form */}
        <form onSubmit={handleLoginSubmit} className="p-8 space-y-5">
          <div className="text-center mb-6">
            <h2 className="text-[18px] font-bold text-slate-800">Account Authentication</h2>
            <p className="text-[11px] text-slate-500 mt-1">Authorized corporate access only. Enter pre-provisioned credentials.</p>
          </div>

          {error && (
            <div className="rounded-[6px] border border-red-200 bg-red-50 p-4 text-xs font-semibold text-red-700 text-center">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">Corporate Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full rounded-[6px] border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:border-[#003366] focus:ring-1 focus:ring-[#003366] focus:outline-none transition-colors"
                placeholder="username@konvergenz.co.ke"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full rounded-[6px] border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:border-[#003366] focus:ring-1 focus:ring-[#003366] focus:outline-none transition-colors"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-[6px] py-3 text-[11px] font-bold tracking-widest text-white transition disabled:opacity-60 flex justify-center items-center gap-2 cursor-pointer"
            style={{ background: RED }}
          >
            {loading ? "AUTHENTICATING..." : "LOG IN"}
          </button>
        </form>
      </div>
    </div>
  );
}
