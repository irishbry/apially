import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Shield, Users, Database, Activity, Loader2, AlertTriangle, Ban, CheckCircle, RefreshCw, HeartPulse, TrendingUp, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { format, differenceInHours, differenceInDays, subDays } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, BarChart, Bar } from 'recharts';

interface AdminSource {
  id: string;
  name: string;
  api_key: string;
  active: boolean;
  created_at: string;
  last_active: string | null;
  user_id: string;
  user_email: string;
  actual_record_count: number;
}

interface AdminUser {
  user_id: string;
  email: string;
  banned: boolean;
  source_count: number;
  total_records: number;
  active_sources: number;
  earliest_entry: string | null;
  latest_entry: string | null;
}

interface DailyCount {
  day: string;
  entry_count: number;
}

interface AdminData {
  sources: AdminSource[];
  users: AdminUser[];
  total_entries: number;
  total_sources: number;
  total_users: number;
  daily_counts: DailyCount[];
}

export default function AdminPage() {
  const { user, isLoading: authLoading, isAuthenticated } = useAuth();
  const [data, setData] = useState<AdminData | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) {
      navigate('/');
      return;
    }
    fetchAdminData();
  }, [isAuthenticated, authLoading]);

  const getHeaders = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error('Not authenticated');
    return {
      Authorization: `Bearer ${session.access_token}`,
      'Content-Type': 'application/json',
    };
  };

  const getUrl = () => {
    const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
    return `https://${projectId}.supabase.co/functions/v1/admin-data`;
  };

  const fetchAdminData = async () => {
    try {
      setLoading(true);
      setError(null);
      const headers = await getHeaders();
      const response = await fetch(getUrl(), { headers });
      if (response.status === 403) { setError('Access denied. You are not an admin.'); return; }
      if (!response.ok) throw new Error(`Error: ${response.statusText}`);
      const result = await response.json();
      setData(result);
    } catch (err: any) {
      setError(err.message || 'Failed to load admin data');
    } finally {
      setLoading(false);
    }
  };

  const adminAction = async (body: Record<string, any>, loadingKey: string) => {
    try {
      setActionLoading(loadingKey);
      const headers = await getHeaders();
      const response = await fetch(getUrl(), { method: 'POST', headers, body: JSON.stringify(body) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Action failed');
      toast({ title: 'Success', description: result.message });
      await fetchAdminData();
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setActionLoading(null);
    }
  };

  const handleToggleSource = (sourceId: string, currentActive: boolean) => {
    adminAction({ action: 'toggle_source', source_id: sourceId, active: !currentActive }, `source-${sourceId}`);
  };
  const handleBanUser = (userId: string) => {
    adminAction({ action: 'ban_user', user_id: userId }, `ban-${userId}`);
  };
  const handleUnbanUser = (userId: string) => {
    adminAction({ action: 'unban_user', user_id: userId }, `unban-${userId}`);
  };

  // Source health classification
  const sourceHealth = useMemo(() => {
    if (!data) return { healthy: [], warning: [], critical: [], inactive: [] };
    const now = new Date();
    const healthy: AdminSource[] = [];
    const warning: AdminSource[] = [];
    const critical: AdminSource[] = [];
    const inactive: AdminSource[] = [];

    for (const s of data.sources) {
      if (!s.active) { inactive.push(s); continue; }
      if (!s.last_active) { critical.push(s); continue; }
      const hours = differenceInHours(now, new Date(s.last_active));
      if (hours <= 24) healthy.push(s);
      else if (hours <= 168) warning.push(s); // 7 days
      else critical.push(s);
    }
    return { healthy, warning, critical, inactive };
  }, [data]);

  // Growth chart data
  const chartData = useMemo(() => {
    if (!data?.daily_counts) return [];
    return data.daily_counts.map(d => ({
      date: format(new Date(d.day), 'MMM d'),
      count: Number(d.entry_count),
    }));
  }, [data]);

  // Weekly totals for bar chart
  const weeklyData = useMemo(() => {
    if (!data?.daily_counts) return [];
    const weeks: Record<string, number> = {};
    for (const d of data.daily_counts) {
      const date = new Date(d.day);
      const weekStart = subDays(date, date.getDay());
      const key = format(weekStart, 'MMM d');
      weeks[key] = (weeks[key] || 0) + Number(d.entry_count);
    }
    return Object.entries(weeks).map(([week, count]) => ({ week, count }));
  }, [data]);

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <AlertTriangle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <p className="text-lg font-semibold text-foreground">{error}</p>
            <button onClick={() => navigate('/')} className="mt-4 text-primary underline">
              Back to Dashboard
            </button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!data) return null;

  const formatNumber = (n: number) => n.toLocaleString();
  const formatDate = (d: string | null) => d ? format(new Date(d), 'MMM d, yyyy HH:mm') : '—';

  const getHealthBadge = (source: AdminSource) => {
    if (!source.active) return <Badge variant="secondary">Inactive</Badge>;
    if (!source.last_active) return <Badge variant="destructive">Never sent</Badge>;
    const hours = differenceInHours(new Date(), new Date(source.last_active));
    if (hours <= 24) return <Badge className="bg-green-600 text-white">Healthy</Badge>;
    if (hours <= 168) return <Badge className="bg-yellow-600 text-white">Warning ({differenceInDays(new Date(), new Date(source.last_active))}d ago)</Badge>;
    return <Badge variant="destructive">Stale ({differenceInDays(new Date(), new Date(source.last_active))}d ago)</Badge>;
  };

  // Calculate recent trends
  const last7Days = data.daily_counts.filter(d => new Date(d.day) >= subDays(new Date(), 7));
  const prev7Days = data.daily_counts.filter(d => {
    const date = new Date(d.day);
    return date >= subDays(new Date(), 14) && date < subDays(new Date(), 7);
  });
  const last7Total = last7Days.reduce((s, d) => s + Number(d.entry_count), 0);
  const prev7Total = prev7Days.reduce((s, d) => s + Number(d.entry_count), 0);
  const growthPct = prev7Total > 0 ? Math.round(((last7Total - prev7Total) / prev7Total) * 100) : 0;

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b border-border bg-card">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Shield className="h-6 w-6 text-primary" />
            <h1 className="text-xl font-bold text-foreground">Admin Dashboard</h1>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" onClick={fetchAdminData} disabled={!!actionLoading}>
              <RefreshCw className={`h-4 w-4 mr-1.5 ${actionLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <button onClick={() => navigate('/')} className="text-sm text-muted-foreground hover:text-foreground">
              ← Back
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Users className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-xs text-muted-foreground">Users</p>
                  <p className="text-2xl font-bold text-foreground">{data.total_users}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Activity className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-xs text-muted-foreground">Sources</p>
                  <p className="text-2xl font-bold text-foreground">{data.total_sources}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Database className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-xs text-muted-foreground">Total Entries</p>
                  <p className="text-2xl font-bold text-foreground">{formatNumber(data.total_entries)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <TrendingUp className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-xs text-muted-foreground">Last 7 Days</p>
                  <p className="text-2xl font-bold text-foreground">{formatNumber(last7Total)}</p>
                  {growthPct !== 0 && (
                    <p className={`text-xs ${growthPct > 0 ? 'text-green-600' : 'text-destructive'}`}>
                      {growthPct > 0 ? '+' : ''}{growthPct}% vs prev week
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <HeartPulse className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-xs text-muted-foreground">Source Health</p>
                  <div className="flex gap-1.5 mt-1">
                    <span className="text-xs text-green-600 font-medium">{sourceHealth.healthy.length} ok</span>
                    <span className="text-xs text-yellow-600 font-medium">{sourceHealth.warning.length} warn</span>
                    <span className="text-xs text-destructive font-medium">{sourceHealth.critical.length} crit</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="health">
          <TabsList>
            <TabsTrigger value="health">Source Health</TabsTrigger>
            <TabsTrigger value="usage">Data Usage</TabsTrigger>
            <TabsTrigger value="sources">All Sources</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
          </TabsList>

          {/* SOURCE HEALTH TAB */}
          <TabsContent value="health" className="mt-4 space-y-4">
            {sourceHealth.critical.length > 0 && (
              <Card className="border-destructive/50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2 text-destructive">
                    <AlertCircle className="h-4 w-4" />
                    Critical — No data in 7+ days or never sent ({sourceHealth.critical.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {sourceHealth.critical.map(s => (
                      <div key={s.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                        <div>
                          <span className="font-medium text-sm">{s.name}</span>
                          <span className="text-xs text-muted-foreground ml-2">{s.user_email}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-xs text-muted-foreground">
                            {s.last_active ? `Last: ${formatDate(s.last_active)}` : 'Never sent data'}
                          </span>
                          <Switch
                            checked={s.active}
                            disabled={actionLoading === `source-${s.id}`}
                            onCheckedChange={() => handleToggleSource(s.id, s.active)}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {sourceHealth.warning.length > 0 && (
              <Card className="border-yellow-500/50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2 text-yellow-600">
                    <AlertTriangle className="h-4 w-4" />
                    Warning — No data in 1-7 days ({sourceHealth.warning.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {sourceHealth.warning.map(s => (
                      <div key={s.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                        <div>
                          <span className="font-medium text-sm">{s.name}</span>
                          <span className="text-xs text-muted-foreground ml-2">{s.user_email}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-xs text-muted-foreground">
                            Last: {formatDate(s.last_active)}
                          </span>
                          <span className="text-xs font-mono">{formatNumber(s.actual_record_count)} records</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            <Card className="border-green-500/30">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2 text-green-600">
                  <CheckCircle className="h-4 w-4" />
                  Healthy — Active within 24h ({sourceHealth.healthy.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {sourceHealth.healthy.map(s => (
                    <div key={s.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                      <div>
                        <span className="font-medium text-sm">{s.name}</span>
                        <span className="text-xs text-muted-foreground ml-2">{s.user_email}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-muted-foreground">
                          Last: {formatDate(s.last_active)}
                        </span>
                        <span className="text-xs font-mono">{formatNumber(s.actual_record_count)} records</span>
                      </div>
                    </div>
                  ))}
                  {sourceHealth.healthy.length === 0 && (
                    <p className="text-sm text-muted-foreground">No healthy sources</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* DATA USAGE TAB */}
          <TabsContent value="usage" className="mt-4 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Daily Ingestion — Last 90 Days</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData}>
                      <defs>
                        <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="date" tick={{ fontSize: 11 }} className="text-muted-foreground" />
                      <YAxis tick={{ fontSize: 11 }} className="text-muted-foreground" />
                      <Tooltip
                        contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '6px' }}
                        labelStyle={{ color: 'hsl(var(--foreground))' }}
                      />
                      <Area type="monotone" dataKey="count" stroke="hsl(var(--primary))" fill="url(#colorCount)" strokeWidth={2} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Weekly Volume</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={weeklyData}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="week" tick={{ fontSize: 11 }} className="text-muted-foreground" />
                      <YAxis tick={{ fontSize: 11 }} className="text-muted-foreground" />
                      <Tooltip
                        contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '6px' }}
                        labelStyle={{ color: 'hsl(var(--foreground))' }}
                      />
                      <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Usage by User</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead className="text-right">Total Records</TableHead>
                      <TableHead className="text-right">Sources</TableHead>
                      <TableHead>First Entry</TableHead>
                      <TableHead>Latest Entry</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.users
                      .sort((a, b) => b.total_records - a.total_records)
                      .map(u => (
                        <TableRow key={u.user_id}>
                          <TableCell className="font-medium">{u.email}</TableCell>
                          <TableCell className="text-right font-mono">{formatNumber(u.total_records)}</TableCell>
                          <TableCell className="text-right">{u.source_count}</TableCell>
                          <TableCell className="text-muted-foreground text-sm">{formatDate(u.earliest_entry)}</TableCell>
                          <TableCell className="text-muted-foreground text-sm">{formatDate(u.latest_entry)}</TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ALL SOURCES TAB */}
          <TabsContent value="sources" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>All Sources ({data.sources.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Source Name</TableHead>
                        <TableHead>Owner</TableHead>
                        <TableHead>Health</TableHead>
                        <TableHead className="text-right">Records</TableHead>
                        <TableHead>Created</TableHead>
                        <TableHead>Last Active</TableHead>
                        <TableHead>API Key</TableHead>
                        <TableHead className="text-center">Active</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.sources.map((source) => (
                        <TableRow key={source.id} className={!source.active ? 'opacity-60' : ''}>
                          <TableCell className="font-medium">{source.name}</TableCell>
                          <TableCell className="text-muted-foreground">{source.user_email}</TableCell>
                          <TableCell>{getHealthBadge(source)}</TableCell>
                          <TableCell className="text-right font-mono">{formatNumber(source.actual_record_count)}</TableCell>
                          <TableCell className="text-muted-foreground text-sm">{formatDate(source.created_at)}</TableCell>
                          <TableCell className="text-muted-foreground text-sm">{formatDate(source.last_active)}</TableCell>
                          <TableCell>
                            <code className="text-xs bg-muted px-1.5 py-0.5 rounded">{source.api_key.slice(0, 8)}…</code>
                          </TableCell>
                          <TableCell className="text-center">
                            <Switch
                              checked={source.active}
                              disabled={actionLoading === `source-${source.id}`}
                              onCheckedChange={() => handleToggleSource(source.id, source.active)}
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* USERS TAB */}
          <TabsContent value="users" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Users ({data.users.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Email</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Sources</TableHead>
                      <TableHead className="text-right">Active</TableHead>
                      <TableHead className="text-right">Total Records</TableHead>
                      <TableHead className="text-center">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.users.map((u) => (
                      <TableRow key={u.user_id} className={u.banned ? 'opacity-60' : ''}>
                        <TableCell className="font-medium">{u.email}</TableCell>
                        <TableCell>
                          <Badge variant={u.banned ? 'destructive' : 'default'}>
                            {u.banned ? 'Banned' : 'Active'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">{u.source_count}</TableCell>
                        <TableCell className="text-right">{u.active_sources}</TableCell>
                        <TableCell className="text-right font-mono">{formatNumber(u.total_records)}</TableCell>
                        <TableCell className="text-center">
                          {u.banned ? (
                            <Button variant="outline" size="sm" disabled={actionLoading === `unban-${u.user_id}`} onClick={() => handleUnbanUser(u.user_id)}>
                              {actionLoading === `unban-${u.user_id}` ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : <CheckCircle className="h-3.5 w-3.5 mr-1" />}
                              Unban
                            </Button>
                          ) : (
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="destructive" size="sm" disabled={!!actionLoading}>
                                  <Ban className="h-3.5 w-3.5 mr-1" /> Ban
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Ban user {u.email}?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    This will prevent the user from logging in and deactivate all their sources.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => handleBanUser(u.user_id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                                    Ban User
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
