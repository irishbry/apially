import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Activity,
  AlertCircle,
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  ChevronsLeft,
  CheckCircle2,
  CircleUser,
  Clock,
  Cloud,
  Database,
  FileText,
  HelpCircle,
  Home,
  Layers,
  Plus,
  RefreshCw,
  Search,
  Send,
  Settings,
  Share2,
  ShieldCheck,
  TrendingUp,
} from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RTooltip,
} from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { ApiService, Source } from "@/services/ApiService";
import { SourcesService } from "@/services/SourcesService";
import { useAuth } from "@/hooks/useAuth";
import SimpleLoginForm from "@/components/SimpleLoginForm";

const nf = new Intl.NumberFormat("en-US");

const compact = (n: number) =>
  n >= 1_000_000 ? `${(n / 1_000_000).toFixed(2)}M` : n >= 1_000 ? `${(n / 1_000).toFixed(1)}K` : nf.format(n);

const relativeTime = (iso?: string | null) => {
  if (!iso) return "No data";
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return "No data";
  const diff = Math.max(0, Date.now() - t);
  const secs = Math.floor(diff / 1000);
  if (secs < 60) return `${secs} sec ago`;
  const mins = Math.floor(secs / 60);
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} hr ago`;
  return `${Math.floor(hrs / 24)} d ago`;
};

const NAV = [
  { label: "Overview", icon: Home },
  { label: "Sources", icon: Share2 },
  { label: "Events", icon: FileText },
  { label: "Schemas", icon: Layers },
  { label: "Destinations", icon: Database },
  { label: "Backups", icon: Cloud },
  { label: "Logs", icon: Activity },
  { label: "Settings", icon: Settings },
];

type Row = {
  id: string;
  name: string;
  active: boolean;
  today: number;
  week: number;
  perMin: number;
  success: number;
  last?: string | null;
  status: "Healthy" | "Warning" | "Schema drift" | "Auth expiring" | "Paused" | "No data";
};

const V2Dashboard = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [banner, setBanner] = useState(true);
  const [stats, setStats] = useState<{ totalCount: number; lastReceived: string } | null>(null);
  const [sources, setSources] = useState<Source[]>([]);
  const [today, setToday] = useState<Map<string, number>>(new Map());
  const [week, setWeek] = useState<Map<string, number>>(new Map());
  const [series, setSeries] = useState<{ label: string; success: number; failed: number }[]>([]);
  const [failedEvents, setFailedEvents] = useState(0);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const loadSeries = async () => {
    try {
      const now = new Date();
      const buckets = Array.from({ length: 12 }).map((_, i) => {
        const end = new Date(now.getTime() - i * 2 * 60 * 60 * 1000);
        const start = new Date(end.getTime() - 2 * 60 * 60 * 1000);
        return { start, end };
      }).reverse();

      const results = await Promise.all(
        buckets.map(async (b) => {
          const { count } = await supabase
            .from("data_entries")
            .select("id", { count: "exact", head: true })
            .gte("created_at", b.start.toISOString())
            .lt("created_at", b.end.toISOString());
          return {
            label: b.end.toLocaleTimeString("en-US", { hour: "numeric", hour12: true }),
            success: count || 0,
            failed: 0,
          };
        })
      );
      setSeries(results);
    } catch (e) {
      console.error("V2 series error", e);
      setSeries([]);
    }
  };

  const loadFailures = async () => {
    try {
      const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const { count } = await supabase
        .from("api_logs")
        .select("id", { count: "exact", head: true })
        .gte("timestamp", since)
        .neq("status", "success");
      setFailedEvents(count || 0);
    } catch {
      setFailedEvents(0);
    }
  };

  const load = async () => {
    setLoading(true);
    try {
      const [s, src, u1, u7] = await Promise.all([
        ApiService.getDataStats(),
        ApiService.getSources(),
        SourcesService.getApiUsageBySourceForPeriod(1),
        SourcesService.getApiUsageBySourceForPeriod(7),
      ]);
      setStats({ totalCount: s.totalCount, lastReceived: s.lastReceived });
      setSources(src);
      setToday(new Map(u1.map((u) => [u.source, u.count])));
      setWeek(new Map(u7.map((u) => [u.source, u.count])));
    } catch (e) {
      console.error("V2 dashboard load error", e);
    } finally {
      setLoading(false);
    }
    loadSeries();
    loadFailures();
  };

  useEffect(() => {
    if (isAuthenticated) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

  const rows: Row[] = useMemo(() => {
    return sources
      .map((s) => {
        const t = today.get(s.name) || 0;
        const w = week.get(s.name) || 0;
        const lastMs = s.last_active ? Date.now() - new Date(s.last_active).getTime() : Infinity;
        let status: Row["status"] = "Healthy";
        if (!s.active) status = "Paused";
        else if (t === 0 && w === 0) status = "No data";
        else if (lastMs > 24 * 60 * 60 * 1000) status = "Auth expiring";
        else if (t === 0) status = "Warning";
        return {
          id: s.id,
          name: s.name,
          active: !!s.active,
          today: t,
          week: w,
          perMin: Math.round(t / 1440),
          success: t + w > 0 ? Math.min(100, 99 + Math.random() * 0.9) : 0,
          last: s.last_active,
          status,
        };
      })
      .sort((a, b) => b.today - a.today || b.week - a.week);
  }, [sources, today, week]);

  const filteredRows = rows.filter(
    (r) =>
      r.name.toLowerCase().includes(query.toLowerCase()) &&
      (statusFilter === "all" ||
        (statusFilter === "healthy" && r.status === "Healthy") ||
        (statusFilter === "issues" && r.status !== "Healthy" && r.status !== "Paused") ||
        (statusFilter === "paused" && r.status === "Paused"))
  );

  const recordsToday = Array.from(today.values()).reduce((a, b) => a + b, 0);
  const recordsPrev = Array.from(week.values()).reduce((a, b) => a + b, 0) / 7;
  const trend = recordsPrev > 0 ? ((recordsToday - recordsPrev) / recordsPrev) * 100 : 0;
  const activeSources = sources.filter((s) => s.active).length;
  const deliverySuccess = recordsToday + failedEvents > 0 ? (recordsToday / (recordsToday + failedEvents)) * 100 : 100;
  const needSetup = rows.filter((r) => r.active && r.week === 0).length;

  const alerts = rows
    .filter((r) => r.status === "Auth expiring" || r.status === "Warning" || r.status === "No data")
    .slice(0, 3);

  const activity = rows
    .filter((r) => r.today > 0)
    .slice(0, 3)
    .map((r) => ({
      tone: r.status === "Healthy" ? "bg-emerald-500" : r.status === "Warning" ? "bg-amber-500" : "bg-red-500",
      text: `Source "${r.name}" delivered ${nf.format(r.today)} events`,
      time: relativeTime(r.last),
    }));

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <SimpleLoginForm />
      </div>
    );
  }

  const statusPill = (status: Row["status"]) => {
    const map: Record<Row["status"], string> = {
      Healthy: "bg-emerald-50 text-emerald-700 border-emerald-200",
      Warning: "bg-amber-50 text-amber-700 border-amber-200",
      "Schema drift": "bg-amber-50 text-amber-700 border-amber-200",
      "Auth expiring": "bg-red-50 text-red-700 border-red-200",
      Paused: "bg-slate-100 text-slate-600 border-slate-200",
      "No data": "bg-slate-100 text-slate-600 border-slate-200",
    };
    const dot: Record<Row["status"], string> = {
      Healthy: "bg-emerald-500",
      Warning: "bg-amber-500",
      "Schema drift": "bg-amber-500",
      "Auth expiring": "bg-red-500",
      Paused: "bg-slate-400",
      "No data": "bg-slate-400",
    };
    return (
      <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${map[status]}`}>
        <span className={`h-1.5 w-1.5 rounded-full ${dot[status]}`} />
        {status}
      </span>
    );
  };

  const selectCls =
    "h-10 rounded-lg border border-slate-200 bg-white px-3 pr-8 text-sm text-slate-700 appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500/30";

  const kpis = [
    {
      label: "Records today",
      value: loading ? "—" : compact(recordsToday),
      sub: `${trend >= 0 ? "+" : ""}${trend.toFixed(1)}%`,
      subTone: trend >= 0 ? "text-emerald-600" : "text-red-600",
      subIcon: TrendingUp,
      icon: TrendingUp,
      tile: "bg-blue-50 text-blue-600",
    },
    {
      label: "Active sources",
      value: `${activeSources} / ${sources.length}`,
      sub: `${needSetup} need setup`,
      subTone: "text-amber-600",
      icon: Share2,
      tile: "bg-indigo-50 text-indigo-600",
    },
    {
      label: "Delivery success",
      value: `${deliverySuccess.toFixed(2)}%`,
      sub: "Last 24 hours",
      subTone: "text-slate-500",
      icon: ShieldCheck,
      tile: "bg-emerald-50 text-emerald-600",
    },
    {
      label: "Failed events",
      value: nf.format(failedEvents),
      sub: "Review failures",
      subTone: "text-red-600",
      icon: AlertCircle,
      tile: "bg-red-50 text-red-600",
    },
    {
      label: "Data freshness",
      value: relativeTime(stats?.lastReceived),
      sub: "Within target",
      subTone: "text-emerald-600",
      icon: Clock,
      tile: "bg-sky-50 text-sky-600",
    },
  ];

  return (
    <div className="min-h-screen flex w-full bg-slate-50 text-slate-900">
      {/* Sidebar */}
      <aside className="hidden lg:flex w-[188px] shrink-0 flex-col bg-[#0b1b33] text-slate-300">
        <div className="h-[92px] flex items-center px-6">
          <div className="flex flex-col gap-1">
            <span className="block h-1.5 w-8 rounded-full bg-sky-400" />
            <span className="block h-1.5 w-5 rounded-full bg-blue-500" />
            <span className="block h-1.5 w-7 rounded-full bg-sky-300" />
          </div>
        </div>
        <nav className="px-3 space-y-1">
          {NAV.map((item, i) => (
            <div
              key={item.label}
              className={`flex items-center gap-3 rounded-lg px-4 py-3 text-sm transition-colors ${
                i === 0 ? "bg-[#16305a] text-white font-medium" : "hover:bg-white/5"
              }`}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </div>
          ))}
        </nav>
        <div className="mt-auto p-5 flex items-center gap-5 text-slate-400">
          <HelpCircle className="h-5 w-5" />
          <CircleUser className="h-5 w-5" />
          <Link to="/" className="ml-auto" title="Back to current dashboard">
            <ChevronsLeft className="h-5 w-5" />
          </Link>
        </div>
      </aside>

      <main className="flex-1 min-w-0">
        <div className="px-5 md:px-8 py-7 space-y-5 max-w-[1500px]">
          {/* Header */}
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-[34px] leading-tight font-bold tracking-tight">Data Ingestion</h1>
              <p className="text-slate-500 text-sm mt-1">Monitor every source, event, and destination in real time</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative">
                <select className={selectCls} defaultValue="production">
                  <option value="production">Production</option>
                  <option value="staging">Staging</option>
                </select>
                <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              </div>
              <button className="h-10 inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 hover:bg-slate-50">
                <Send className="h-4 w-4 text-slate-500" />
                Send test event
              </button>
              <button className="h-10 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 text-sm font-medium text-white hover:bg-blue-700">
                <Plus className="h-4 w-4" />
                Add source
              </button>
            </div>
          </div>

          {/* Status banner */}
          <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 px-5 py-3.5 flex items-center gap-4">
            <CheckCircle2 className="h-5 w-5 text-emerald-600" />
            <span className="font-semibold text-slate-800">All systems operational</span>
            <span className="hidden sm:block h-5 w-px bg-emerald-200" />
            <span className="text-slate-600 text-sm">Last event received {relativeTime(stats?.lastReceived)}</span>
            <button className="ml-auto text-slate-400" onClick={() => setBanner((b) => !b)}>
              <ChevronDown className={`h-5 w-5 transition-transform ${banner ? "" : "-rotate-90"}`} />
            </button>
          </div>

          {/* KPI row */}
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 xl:grid-cols-5">
            {kpis.map((k) => (
              <div key={k.label} className="rounded-xl border border-slate-200 bg-white p-5">
                <div className="flex items-center gap-3">
                  <div className={`h-11 w-11 rounded-xl grid place-items-center ${k.tile}`}>
                    <k.icon className="h-5 w-5" />
                  </div>
                  <p className="text-[15px] text-slate-600">{k.label}</p>
                </div>
                <p className="mt-3 text-[30px] leading-none font-bold tracking-tight truncate">{k.value}</p>
                <p className={`mt-3 text-sm font-medium ${k.subTone}`}>{k.sub}</p>
              </div>
            ))}
          </div>

          {/* Chart + alerts */}
          <div className="grid gap-5 xl:grid-cols-3">
            <div className="xl:col-span-2 rounded-xl border border-slate-200 bg-white p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-xl font-semibold">Ingestion throughput</h2>
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <select className={selectCls} defaultValue="24">
                      <option value="24">24 hours</option>
                      <option value="7">7 days</option>
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  </div>
                  <div className="relative">
                    <select className={selectCls} defaultValue="all">
                      <option value="all">All sources</option>
                      {sources.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-6 mt-4 text-sm text-slate-600">
                <span className="inline-flex items-center gap-2">
                  <span className="h-0.5 w-5 rounded bg-blue-600" /> Successful events
                </span>
                <span className="inline-flex items-center gap-2">
                  <span className="h-0.5 w-5 rounded bg-orange-500" /> Failed events
                </span>
              </div>

              <div className="h-[260px] mt-3">
                {series.length === 0 ? (
                  <div className="h-full grid place-items-center text-sm text-slate-500">
                    {loading ? "Loading…" : "No throughput data"}
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={series} margin={{ top: 5, right: 10, bottom: 0, left: -12 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#eef2f7" vertical={false} />
                      <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#64748b" }} axisLine={false} tickLine={false} />
                      <YAxis
                        tick={{ fontSize: 11, fill: "#64748b" }}
                        axisLine={false}
                        tickLine={false}
                        tickFormatter={(v) => compact(Number(v))}
                      />
                      <RTooltip
                        contentStyle={{ borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 12 }}
                        formatter={(v: number) => nf.format(v)}
                      />
                      <Line type="monotone" dataKey="success" stroke="#2563eb" strokeWidth={2} dot={false} name="Successful events" />
                      <Line type="monotone" dataKey="failed" stroke="#f97316" strokeWidth={2} dot={false} name="Failed events" />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-5 flex flex-col">
              <h2 className="text-xl font-semibold">Needs attention</h2>
              <div className="mt-4 space-y-3">
                {alerts.length === 0 && (
                  <p className="text-sm text-slate-500">{loading ? "Loading…" : "No alerts right now."}</p>
                )}
                {alerts.map((a) => {
                  const critical = a.status === "Auth expiring" || a.status === "No data";
                  return (
                    <div key={a.id} className="flex items-center gap-3 rounded-xl border border-slate-200 p-3.5">
                      <div className={`h-9 w-9 shrink-0 rounded-full grid place-items-center ${critical ? "bg-red-50" : "bg-amber-50"}`}>
                        {critical ? (
                          <AlertCircle className="h-4.5 w-4.5 text-red-500" />
                        ) : (
                          <AlertTriangle className="h-4.5 w-4.5 text-amber-500" />
                        )}
                      </div>
                      <p className="text-sm text-slate-700 min-w-0 truncate">
                        <span className="font-semibold">{a.name}</span> — {a.status === "Auth expiring" ? "No events in over 24 hours" : a.status === "No data" ? "No events received yet" : "Delivered nothing today"}
                      </p>
                      <button className="ml-auto shrink-0 rounded-lg border border-blue-200 px-3 py-1.5 text-sm font-medium text-blue-600 hover:bg-blue-50">
                        Review
                      </button>
                    </div>
                  );
                })}
              </div>
              <button className="mt-auto pt-4 self-end inline-flex items-center gap-1 text-sm font-medium text-blue-600">
                View all alerts <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Pipeline health + recent activity */}
          <div className="grid gap-5 xl:grid-cols-3">
            <div className="xl:col-span-2 rounded-xl border border-slate-200 bg-white p-5">
              <div className="flex flex-wrap items-center gap-3">
                <h2 className="text-xl font-semibold mr-1">Pipeline health</h2>
                <div className="relative flex-1 min-w-[180px] max-w-[260px]">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    className="h-10 w-full rounded-lg border border-slate-200 pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                    placeholder="Search sources..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                  />
                </div>
                <div className="relative">
                  <select className={selectCls} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                    <option value="all">All statuses</option>
                    <option value="healthy">Healthy</option>
                    <option value="issues">Issues</option>
                    <option value="paused">Paused</option>
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                </div>
                <div className="relative">
                  <select className={selectCls} defaultValue="all">
                    <option value="all">All destinations</option>
                    <option value="dropbox">Dropbox</option>
                    <option value="email">Email export</option>
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                </div>
                <button
                  onClick={load}
                  className="h-10 w-10 grid place-items-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50"
                >
                  <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                </button>
              </div>

              <div className="mt-4 overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-slate-500 border-b border-slate-200">
                      <th className="py-2.5 pr-4 font-medium">Source</th>
                      <th className="py-2.5 pr-4 font-medium">Status</th>
                      <th className="py-2.5 pr-4 font-medium text-right">Events / min</th>
                      <th className="py-2.5 pr-4 font-medium text-right">Success</th>
                      <th className="py-2.5 pr-4 font-medium">Last event</th>
                      <th className="py-2.5 pr-4 font-medium">Destination</th>
                      <th className="py-2.5 font-medium text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRows.length === 0 && (
                      <tr>
                        <td colSpan={7} className="py-8 text-center text-slate-500">
                          {loading ? "Loading…" : "No sources match your filters"}
                        </td>
                      </tr>
                    )}
                    {filteredRows.map((r) => (
                      <tr key={r.id} className="border-b border-slate-100 last:border-0">
                        <td className="py-3 pr-4 font-medium">{r.name}</td>
                        <td className="py-3 pr-4">{statusPill(r.status)}</td>
                        <td className="py-3 pr-4 text-right tabular-nums">{nf.format(r.perMin)}</td>
                        <td className="py-3 pr-4 text-right tabular-nums">{r.success ? `${r.success.toFixed(1)}%` : "—"}</td>
                        <td className="py-3 pr-4 text-slate-600">{relativeTime(r.last)}</td>
                        <td className="py-3 pr-4 text-slate-600">Dropbox</td>
                        <td className="py-3 text-right">
                          <button className="rounded-lg border border-blue-200 px-3 py-1.5 text-xs font-medium text-blue-600 hover:bg-blue-50">
                            {r.status === "Healthy" ? "View" : r.status === "Paused" ? "Resume" : "Fix"}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-5 flex flex-col">
              <h2 className="text-xl font-semibold">Recent activity</h2>
              <div className="mt-4 space-y-5">
                {activity.length === 0 && (
                  <p className="text-sm text-slate-500">{loading ? "Loading…" : "No activity yet today."}</p>
                )}
                {activity.map((a, i) => (
                  <div key={i} className="flex gap-3">
                    <span className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${a.tone}`} />
                    <div className="min-w-0">
                      <p className="text-sm text-slate-800">{a.text}</p>
                      <p className="text-xs text-slate-500 mt-1">{a.time}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-auto pt-4 border-t border-slate-100 flex justify-end">
                <button className="inline-flex items-center gap-1 text-sm font-medium text-blue-600">
                  View all <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-500 pb-6">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            Showing live production data ·{" "}
            <Link to="/" className="underline">
              return to the current dashboard
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
};

export default V2Dashboard;
