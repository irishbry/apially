import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { AlertTriangle, CheckCircle2, Copy, ExternalLink, Loader2, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ApiService } from "@/services/ApiService";
import { DropboxBackupService } from "@/services/DropboxBackupService";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export const REQUIRED_DROPBOX_SCOPES = [
  'files.content.write',
  'files.content.read',
  'files.metadata.read',
  'sharing.write',
  'sharing.read',
];

const getLosAngelesDate = (iso: string) => {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Los_Angeles',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date(iso));
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? '';
  return `${get('year')}-${get('month')}-${get('day')}`;
};

interface ReconnectDropboxProps {
  onReconnected?: () => void;
}

type RerunResult = { name: string; ok: boolean; message?: string };

const ReconnectDropbox: React.FC<ReconnectDropboxProps> = ({ onReconnected }) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [authUrl, setAuthUrl] = useState('');
  const [appKey, setAppKey] = useState('');
  const [appSecret, setAppSecret] = useState('');
  const [dropboxPath, setDropboxPath] = useState('');
  const [authCode, setAuthCode] = useState('');
  const [isPreparing, setIsPreparing] = useState(false);
  const [isExchanging, setIsExchanging] = useState(false);
  const [isRerunning, setIsRerunning] = useState(false);
  const [results, setResults] = useState<RerunResult[]>([]);

  const prepare = async () => {
    setIsPreparing(true);
    try {
      const config = await ApiService.getDropboxConfig();
      if (!config?.app_key || !config?.app_secret) {
        toast({
          title: 'No Dropbox configuration found',
          description: 'Complete the initial Dropbox OAuth setup first.',
          variant: 'destructive',
        });
        return;
      }
      setAppKey(config.app_key);
      setAppSecret(config.app_secret);
      setDropboxPath(config.dropbox_path);
      setAuthUrl(DropboxBackupService.generateDropboxAuthUrl(config.app_key));
      setResults([]);
      setAuthCode('');
      setStep(1);
      setOpen(true);
    } catch (error) {
      console.error('Failed to prepare Dropbox reconnect:', error);
      toast({ title: 'Error', description: 'Could not load your Dropbox configuration.', variant: 'destructive' });
    } finally {
      setIsPreparing(false);
    }
  };

  const exchange = async () => {
    if (!authCode.trim()) return;
    setIsExchanging(true);
    try {
      const tokens = await ApiService.exchangeDropboxCode(authCode.trim(), appKey, appSecret);
      const expiresAt = new Date(Date.now() + tokens.expires_in * 1000).toISOString();
      await ApiService.saveDropboxConfig(
        dropboxPath,
        appKey,
        appSecret,
        tokens.refresh_token,
        tokens.access_token,
        expiresAt,
        true,
      );
      toast({ title: 'Dropbox reconnected', description: 'New token saved with the updated permissions.' });
      setStep(3);
      onReconnected?.();
    } catch (error) {
      console.error('Dropbox token exchange failed:', error);
      toast({
        title: 'Reauthorization failed',
        description: error instanceof Error ? error.message : 'Could not exchange the authorization code.',
        variant: 'destructive',
      });
    } finally {
      setIsExchanging(false);
    }
  };

  // Reruns the most recent backups that either failed outright or completed
  // without a downloadable link (the symptom of outdated Dropbox scopes).
  const rerunLastFailed = async () => {
    if (!user) return;
    setIsRerunning(true);
    setResults([]);
    try {
      const { data: logs, error } = await supabase
        .from('backup_logs')
        .select('id, source_id, file_name, status, format, created_at, storage_path, dropbox_url')
        .eq('user_id', user.id)
        .not('source_id', 'is', null)
        .order('created_at', { ascending: false })
        .limit(200);

      if (error) throw error;

      const needsRerun = (logs || []).filter(
        (log: any) => log.status !== 'completed' || (!log.storage_path && !log.dropbox_url),
      );

      // Keep only the newest attempt per source so we don't rerun the same source repeatedly.
      const bySource = new Map<string, any>();
      for (const log of needsRerun) {
        if (!bySource.has(log.source_id)) bySource.set(log.source_id, log);
      }
      const targets = Array.from(bySource.values()).slice(0, 25);

      if (targets.length === 0) {
        toast({ title: 'Nothing to rerun', description: 'All recent backups already have download links.' });
        return;
      }

      const collected: RerunResult[] = [];
      for (const log of targets) {
        const name = log.file_name || log.source_id;
        try {
          const { data, error: fnError } = await supabase.functions.invoke('dropbox-backup', {
            body: {
              action: 'recreate_backup',
              userId: user.id,
              sourceId: log.source_id,
              pstDate: getLosAngelesDate(log.created_at),
              format: log.format || 'csv',
            },
          });
          if (fnError) throw fnError;
          if (!data?.success) throw new Error(data?.error || 'Backup failed');
          collected.push({ name, ok: true });
        } catch (err) {
          collected.push({ name, ok: false, message: err instanceof Error ? err.message : 'Failed' });
        }
        setResults([...collected]);
      }

      const failures = collected.filter((r) => !r.ok).length;
      toast({
        title: failures ? 'Rerun finished with errors' : 'Rerun complete',
        description: `${collected.length - failures} succeeded, ${failures} failed.`,
        variant: failures ? 'destructive' : undefined,
      });
      onReconnected?.();
    } catch (error) {
      console.error('Rerun failed:', error);
      toast({
        title: 'Rerun failed',
        description: error instanceof Error ? error.message : 'Could not rerun the last failed backups.',
        variant: 'destructive',
      });
    } finally {
      setIsRerunning(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" onClick={prepare} disabled={isPreparing}>
          {isPreparing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
          Reconnect Dropbox
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Reconnect Dropbox</DialogTitle>
          <DialogDescription>
            Existing tokens keep their old permissions. Reauthorize to pick up new scopes, then rerun the last failed backups.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {step === 1 && (
            <div className="space-y-3">
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
                <div className="mb-2 flex items-center gap-2 font-medium">
                  <AlertTriangle className="h-4 w-4" />
                  Step 1 — Confirm app permissions
                </div>
                <p className="mb-2">
                  In the Dropbox App Console → Permissions tab, make sure these scopes are enabled and submitted:
                </p>
                <div className="flex flex-wrap gap-1">
                  {REQUIRED_DROPBOX_SCOPES.map((scope) => (
                    <Badge key={scope} variant="secondary" className="font-mono text-xs">{scope}</Badge>
                  ))}
                </div>
                <a
                  className="mt-2 inline-flex items-center gap-1 underline"
                  href="https://www.dropbox.com/developers/apps"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Open Dropbox App Console <ExternalLink className="h-3 w-3" />
                </a>
              </div>
              <Button className="w-full" onClick={() => setStep(2)}>Permissions are enabled — continue</Button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-3">
              <p className="text-sm font-medium">Step 2 — Reauthorize</p>
              <div className="flex items-center gap-2">
                <Input value={authUrl} readOnly className="text-xs" />
                <Button variant="outline" size="sm" onClick={() => navigator.clipboard.writeText(authUrl)}>
                  <Copy className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={() => window.open(authUrl, '_blank')}>
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Approve the app in Dropbox, then paste the authorization code shown afterwards.
              </p>
              <Input
                placeholder="Paste authorization code"
                value={authCode}
                onChange={(e) => setAuthCode(e.target.value)}
              />
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={() => setStep(1)}>Back</Button>
                <Button className="flex-1" onClick={exchange} disabled={!authCode.trim() || isExchanging}>
                  {isExchanging ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Save new token
                </Button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-800">
                <CheckCircle2 className="h-4 w-4" />
                Dropbox reconnected with the updated permissions.
              </div>
              <p className="text-sm">
                Step 3 — Rerun the most recent backups that failed or are missing a download link.
              </p>
              <Button className="w-full" onClick={rerunLastFailed} disabled={isRerunning}>
                {isRerunning ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
                {isRerunning ? 'Rerunning backups...' : 'Rerun last failed backups'}
              </Button>

              {results.length > 0 && (
                <div className="max-h-48 space-y-1 overflow-y-auto rounded border p-2 text-xs">
                  {results.map((result, index) => (
                    <div key={`${result.name}-${index}`} className="flex items-center justify-between gap-2">
                      <span className="truncate">{result.name}</span>
                      <Badge variant={result.ok ? 'secondary' : 'destructive'}>
                        {result.ok ? 'OK' : result.message || 'Failed'}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ReconnectDropbox;
