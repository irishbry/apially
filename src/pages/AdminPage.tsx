import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Shield, Users, Database, Activity, Loader2, AlertTriangle, Ban, CheckCircle, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
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
}

interface AdminData {
  sources: AdminSource[];
  users: AdminUser[];
  total_entries: number;
  total_sources: number;
  total_users: number;
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

      if (response.status === 403) {
        setError('Access denied. You are not an admin.');
        return;
      }
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
      const response = await fetch(getUrl(), {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
      });
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
    adminAction(
      { action: 'toggle_source', source_id: sourceId, active: !currentActive },
      `source-${sourceId}`
    );
  };

  const handleBanUser = (userId: string) => {
    adminAction({ action: 'ban_user', user_id: userId }, `ban-${userId}`);
  };

  const handleUnbanUser = (userId: string) => {
    adminAction({ action: 'unban_user', user_id: userId }, `unban-${userId}`);
  };

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
              ← Back to Dashboard
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Users className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-sm text-muted-foreground">Total Users</p>
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
                  <p className="text-sm text-muted-foreground">Total Sources</p>
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
                  <p className="text-sm text-muted-foreground">Total Data Entries</p>
                  <p className="text-2xl font-bold text-foreground">{formatNumber(data.total_entries)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Activity className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-sm text-muted-foreground">Active Sources</p>
                  <p className="text-2xl font-bold text-foreground">
                    {data.sources.filter(s => s.active).length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="sources">
          <TabsList>
            <TabsTrigger value="sources">All Sources</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
          </TabsList>

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
                        <TableHead>Status</TableHead>
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
                          <TableCell>
                            <Badge variant={source.active ? 'default' : 'secondary'}>
                              {source.active ? 'Active' : 'Inactive'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right font-mono">
                            {formatNumber(source.actual_record_count)}
                          </TableCell>
                          <TableCell className="text-muted-foreground text-sm">
                            {formatDate(source.created_at)}
                          </TableCell>
                          <TableCell className="text-muted-foreground text-sm">
                            {formatDate(source.last_active)}
                          </TableCell>
                          <TableCell>
                            <code className="text-xs bg-muted px-1.5 py-0.5 rounded">
                              {source.api_key.slice(0, 8)}…
                            </code>
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
                      <TableHead className="text-right">Active Sources</TableHead>
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
                        <TableCell className="text-right font-mono">
                          {formatNumber(u.total_records)}
                        </TableCell>
                        <TableCell className="text-center">
                          {u.banned ? (
                            <Button
                              variant="outline"
                              size="sm"
                              disabled={actionLoading === `unban-${u.user_id}`}
                              onClick={() => handleUnbanUser(u.user_id)}
                            >
                              {actionLoading === `unban-${u.user_id}` ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />
                              ) : (
                                <CheckCircle className="h-3.5 w-3.5 mr-1" />
                              )}
                              Unban
                            </Button>
                          ) : (
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  disabled={!!actionLoading}
                                >
                                  <Ban className="h-3.5 w-3.5 mr-1" />
                                  Ban
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Ban user {u.email}?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    This will prevent the user from logging in and deactivate all their sources. You can unban them later.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleBanUser(u.user_id)}
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                  >
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
