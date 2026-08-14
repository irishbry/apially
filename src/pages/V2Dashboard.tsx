import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Activity,
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Clock,
  Database,
  Gauge,
  LayoutGrid,
  RefreshCw,
  Search,
  Users,
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RTooltip,
} from "recharts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ApiService, Source } from "@/services/ApiService";
import { SourcesService } from "@/services/SourcesService";
import { useAuth } from "@/hooks/useAuth";
import SimpleLoginForm from "@/components/SimpleLoginForm";

type Usage = { source: string; count: number; percentage: number };

const nf = new Intl.NumberFormat("en-US");

const relativeTime = (iso?: string) => {
  if (!iso || iso === "No data") return "No data";
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return "No data";
  const diff = Math.max(0, Date.now() - t);
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return `${Math.floor(diff / 1000)} sec ago`;
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} hr ago`;
  return `${Math.floor(hrs / 24)} d ago`;
};

const NAV = [
  { label: "Overview", icon: LayoutGrid },
  { label: "Sources", icon: Users },
  { label: "Events", icon: Activity },
  { label: "Backups", icon: Database },
  { label: "Logs", icon: Clock },
  { label: "Settings", icon: Gauge },
];

const V2Dashboard = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<{ totalCount: number; uniqueSources: number; lastReceived: string } | null>(null);
  const [sources, setSources] = useState<Source[]>([]);
  const [usageToday, setUsageToday] = useState<Usage[]>([]);
  const [usage7, setUsage7] = useState<Usage[]>([]);
  const [query, setQuery] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const [s, src, u1, u7] = await Promise.all([
        ApiService.getDataStats(),
        ApiService.getSources(),
        SourcesService.getApiUsageBySourceForPeriod(1),
        SourcesService.getApiUsageBySourceForPeriod(7),
      ]);
      setStats({ totalCount: s.totalCount, uniqueSources: s.uniqueSources, lastReceived: s.lastReceived });
      setSources(src);
      setUsageToday(u1);
      setUsage7(u7);
    } catch (e) {
      console.error("V2 dashboard load error", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) load();
  }, [isAuthenticated]);

  const recordsToday = usageToday.reduce((sum, u) => sum + u.count, 0);
  const activeSources = sources.filter((s) => s.active).length;

  const chartData = useMemo(
    () =>
      [...usage7]
        .sort((a, b) => b.count - a.count)
        .slice(0, 12)
        .map((u) => ({ name: u.source, events: u.count })),
    [usage7]
  );

  const rows = useMemo(() => {
    const todayMap = new Map(usageToday.map((u) => [u.source, u.count]));
    const weekMap = new Map(usage7.map((u) => [u.source, u.count]));
    return sources
      .filter((s) => s.name.toLowerCase().includes(query.toLowerCase()))
      .map((s) => {
        const today = todayMap.get(s.name) || 0;
        const week = weekMap.get(s.name) || 0;
        const status = !s.active ? "Paused" : today > 0 ? "Healthy" : week > 0 ? "Quiet" : "No data";
        return { id: s.id, name: s.name, active: s.active, today, week, last: s.last_active, status };
      })
      .sort((a, b) => b.today - a.today || b.week - a.week);
  }, [sources, usageToday, usage7, query]);

  const attention = rows.filter((r) => r.active && r.today === 0).slice(0, 4);

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

  const statusTone = (status: string) =>
    status === "Healthy"
      ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
      : status === "Quiet"
      ? "bg-amber-500/10 text-amber-600 border-amber-500/20"
      : status === "Paused"
      ? "bg-muted text-muted-foreground border-border"
      : "bg-destructive/10 text-destructive border-destructive/20";

  return (
    <div className="min-h-screen flex w-full bg-muted/30">
      {/* Sidebar */}
      <aside className="hidden md:flex w-56 flex-col border-r bg-card/60 backdrop-blur">
        <div className="h-16 flex items-center gap-2 px-5 border-b">
          <div className="bg-primary/10 p-1.5 rounded-md">
            <Database className="h-4 w-4 text-primary" />
          </div>
          <span className="font-semibold tracking-tight">ApiAlly</span>
          <Badge variant="secondary" className="ml-auto text-[10px]">v2</Badge>
        </div>
        <nav className="p-3 space-y-1">
          {NAV.map((item, i) => (
            <div
              key={item.label}
              className={`flex items-center gap-2.5 rounded-md px-3 py-2 text-sm ${
                i === 0 ? "bg-primary/10 text-primary font-medium" : "text-muted-foreground"
              }`}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </div>
          ))}
        </nav>
        <div className="mt-auto p-3">
          <Link to="/" className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-3.5 w-3.5" /> Back to current dashboard
          </Link>
        </div>
      </aside>

      <main className="flex-1 min-w-0">
        <div className="p-5 md:p-8 space-y-6 max-w-[1400px]">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h1 className="text-3xl font-semibold tracking-tight">Data Ingestion</h1>
              <p className="text-muted-foreground text-sm mt-1">
                Preview of a redesigned overview — read-only, nothing here changes your data.
              </p>
            </div>
            <Button variant="outline" onClick={load} disabled={loading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>

          <Card className="border-emerald-500/20 bg-emerald-500/5">
            <CardContent className="flex flex-wrap items-center gap-3 py-3 text-sm">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              <span className="font-medium">All systems operational</span>
              <Separator orientation="vertical" className="h-4 hidden sm:block" />
              <span className="text-muted-foreground">
                Last event received {relativeTime(stats?.lastReceived)}
              </span>
            </CardContent>
          </Card>

          <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
            {[
              { label: "Records today", value: nf.format(recordsToday), icon: Activity },
              { label: "Active sources", value: `${activeSources} / ${sources.length}`, icon: Users },
              { label: "Total records", value: nf.format(stats?.totalCount || 0), icon: Database },
              { label: "Data freshness", value: relativeTime(stats?.lastReceived), icon: Clock },
            ].map((k) => (
              <Card key={k.label}>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="bg-primary/10 p-2 rounded-lg">
                      <k.icon className="h-4 w-4 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs text-muted-foreground">{k.label}</p>
                      <p className="text-2xl font-semibold truncate">{loading ? "—" : k.value}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            <Card className="lg:col-span-2">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Ingestion by source — last 7 days</CardTitle>
              </CardHeader>
              <CardContent className="h-[300px]">
                {chartData.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-sm text-muted-foreground">
                    {loading ? "Loading…" : "No events in the last 7 days"}
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData} margin={{ top: 10, right: 10, bottom: 0, left: -10 }}>
                      <defs>
                        <linearGradient id="v2fill" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.35} />
                          <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" vertical={false} />
                      <XAxis dataKey="name" tick={{ fontSize: 11 }} interval={0} angle={-20} textAnchor="end" height={60} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <RTooltip
                        contentStyle={{
                          background: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: 8,
                          fontSize: 12,
                        }}
                      />
                      <Area type="monotone" dataKey="events" stroke="hsl(var(--primary))" fill="url(#v2fill)" strokeWidth={2} />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Needs attention</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {attention.length === 0 && (
                  <p className="text-sm text-muted-foreground">
                    {loading ? "Loading…" : "Every active source delivered data today."}
                  </p>
                )}
                {attention.map((a) => (
                  <div key={a.id} className="flex items-start gap-3 rounded-lg border p-3">
                    <AlertCircle className="h-4 w-4 mt-0.5 text-amber-600 shrink-0" />
                    <div className="min-w-0 text-sm">
                      <p className="font-medium truncate">{a.name}</p>
                      <p className="text-muted-foreground text-xs">
                        No events today · last active {relativeTime(a.last)}
                      </p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader className="pb-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <CardTitle className="text-base">Pipeline health</CardTitle>
                <div className="relative w-full sm:w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    className="pl-9 h-9"
                    placeholder="Search sources..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-muted-foreground border-b">
                    <th className="py-2 pr-4 font-medium">Source</th>
                    <th className="py-2 pr-4 font-medium">Status</th>
                    <th className="py-2 pr-4 font-medium text-right">Today</th>
                    <th className="py-2 pr-4 font-medium text-right">Last 7 days</th>
                    <th className="py-2 font-medium">Last event</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-6 text-center text-muted-foreground">
                        {loading ? "Loading…" : "No sources match your search"}
                      </td>
                    </tr>
                  )}
                  {rows.map((r) => (
                    <tr key={r.id} className="border-b last:border-0 hover:bg-muted/40">
                      <td className="py-2.5 pr-4 font-medium">{r.name}</td>
                      <td className="py-2.5 pr-4">
                        <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs ${statusTone(r.status)}`}>
                          {r.status}
                        </span>
                      </td>
                      <td className="py-2.5 pr-4 text-right tabular-nums">{nf.format(r.today)}</td>
                      <td className="py-2.5 pr-4 text-right tabular-nums">{nf.format(r.week)}</td>
                      <td className="py-2.5 text-muted-foreground">{relativeTime(r.last)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>

          <p className="text-xs text-muted-foreground pb-6">
            Preview build · live production data, read-only ·{" "}
            <Link to="/" className="underline">return to the current dashboard</Link>
          </p>
        </div>
      </main>
    </div>
  );
};

export default V2Dashboard;
