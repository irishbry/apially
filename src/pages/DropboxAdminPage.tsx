import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { Loader2, RefreshCw, CloudUpload, KeyRound, ArrowLeft, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import DropboxErrorHint from '@/components/DropboxErrorHint';

interface DropboxConfig {
  id: string;
  user_id: string;
  dropbox_path: string;
  app_key: string | null;
  is_active: boolean;
  daily_backup_enabled: boolean;
  refresh_token: string | null;
  access_token_expires_at: string | null;
  updated_at: string;
}

interface BackupLog {
  id: string;
  file_name: string | null;
  status: string;
  record_count: number;
  backup_type: string;
  dropbox_url: string | null;
  storage_path: string | null;
  error_message: string | null;
  created_at: string;
}

export default function DropboxAdminPage() {
  const { isLoading: authLoading, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [testing, setTesting] = useState(false);
  const [config, setConfig] = useState<DropboxConfig | null>(null);
  const [logs, setLogs] = useState<BackupLog[]>([]);
  const [liveStatus, setLiveStatus] = useState<{ ok: boolean; message: string } | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) {
      navigate('/');
      return;
    }
    load();
  }, [authLoading, isAuthenticated]);

  const load = async () => {
    setLoading(true);
    try {
      const [{ data: cfg }, { data: logRows }] = await Promise.all([
        supabase
          .from('dropbox_configs')
          .select('*')
          .order('updated_at', { ascending: false })
          .limit(1)
          .maybeSingle(),
        supabase
          .from('backup_logs')
          .select('id, file_name, status, record_count, backup_type, dropbox_url, storage_path, error_message, created_at')
          .order('created_at', { ascending: false })
          .limit(10),
      ]);
      setConfig((cfg as DropboxConfig) ?? null);
      setLogs((logRows as BackupLog[]) ?? []);
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const testConnection = async () => {
    setTesting(true);
    setLiveStatus(null);
    try {
      const { data, error } = await supabase.functions.invoke('dropbox-backup', {
        body: { action: 'test_connection' },
      });
      if (error) throw error;
      const ok = data?.success !== false && !data?.error;
      setLiveStatus({ ok, message: ok ? (data?.message || 'Authorization is valid.') : (data?.error || 'Authorization failed.') });
    } catch (err: any) {
      setLiveStatus({ ok: false, message: err.message || 'Authorization check failed.' });
    } finally {
      setTesting(false);
    }
  };

  const tokenExpired = config?.access_token_expires_at
    ? new Date(config.access_token_expires_at).getTime() < Date.now()
    : true;
  const authorized = Boolean(config?.refresh_token) && Boolean(config?.is_active);
  const lastUpload = logs[0] ?? null;

  const statusBadge = (status: string) => {
    const variant = status === 'completed' ? 'default' : status === 'failed' ? 'destructive' : 'secondary';
    return <Badge variant={variant as any}>{status}</Badge>;
  };

  if (authLoading || loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-5xl space-y-6 p-4 md:p-8">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Dropbox Integration</h1>
          <p className="text-sm text-muted-foreground">App identity, authorization state and latest upload activity.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => navigate('/admin')}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Admin
          </Button>
          <Button variant="outline" size="sm" onClick={load}>
            <RefreshCw className="mr-2 h-4 w-4" /> Refresh
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <KeyRound className="h-4 w-4" /> App ID
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            <p className="font-mono text-lg">{config?.app_key ? config.app_key : 'Not configured'}</p>
            <p className="text-xs text-muted-foreground break-all">{config?.dropbox_path || 'No folder path set'}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              {authorized ? <CheckCircle className="h-4 w-4 text-primary" /> : <XCircle className="h-4 w-4 text-destructive" />}
              Authorization
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Badge variant={authorized ? 'default' : 'destructive'}>{authorized ? 'Active' : 'Not authorized'}</Badge>
            <p className="text-xs text-muted-foreground">
              Access token {tokenExpired ? 'expired — will refresh on next use' : `valid until ${format(new Date(config!.access_token_expires_at!), 'MMM d, yyyy h:mm a')}`}
            </p>
            <p className="text-xs text-muted-foreground">
              Daily backups {config?.daily_backup_enabled ? 'enabled' : 'disabled'}
            </p>
            <Button size="sm" variant="outline" onClick={testConnection} disabled={testing}>
              {testing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Test authorization
            </Button>
            {liveStatus && (
              <p className={`text-xs ${liveStatus.ok ? 'text-muted-foreground' : 'text-destructive'}`}>{liveStatus.message}</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <CloudUpload className="h-4 w-4" /> Last upload
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            {lastUpload ? (
              <>
                <div className="flex items-center gap-2">{statusBadge(lastUpload.status)}</div>
                <p className="truncate text-sm" title={lastUpload.file_name ?? ''}>{lastUpload.file_name || 'No file name'}</p>
                <p className="text-xs text-muted-foreground">
                  {lastUpload.record_count.toLocaleString()} records · {format(new Date(lastUpload.created_at), 'MMM d, h:mm a')}
                </p>
                {lastUpload.error_message && (
                  <DropboxErrorHint message={lastUpload.error_message} className="mt-2" />
                )}
              </>
            ) : (
              <p className="text-sm text-muted-foreground">No backup uploads recorded yet.</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recent uploads</CardTitle>
          <CardDescription>Last 10 backup log entries across all sources.</CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>File</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Type</TableHead>
                <TableHead className="text-right">Records</TableHead>
                <TableHead>Link</TableHead>
                <TableHead>When</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-sm text-muted-foreground">No uploads found.</TableCell>
                </TableRow>
              )}
              {logs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell className="max-w-[240px] truncate" title={log.file_name ?? ''}>{log.file_name || '—'}</TableCell>
                  <TableCell>{statusBadge(log.status)}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{log.backup_type}</TableCell>
                  <TableCell className="text-right">{log.record_count.toLocaleString()}</TableCell>
                  <TableCell>
                    {log.dropbox_url ? (
                      <a className="text-sm underline" href={log.dropbox_url} target="_blank" rel="noreferrer">Dropbox</a>
                    ) : (
                      <span className="text-sm text-muted-foreground">None</span>
                    )}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{format(new Date(log.created_at), 'MMM d, h:mm a')}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
