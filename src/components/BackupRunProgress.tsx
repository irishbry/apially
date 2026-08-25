import React, { useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Progress } from "@/components/ui/progress";
import { Activity, AlertTriangle, CheckCircle2, ChevronDown, ChevronUp, Loader2, RefreshCw, XCircle } from "lucide-react";
import { BackupLog, BackupSource } from "@/services/BackupLogsService";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

// A source whose log row hasn't been touched for this long is treated as timed out:
// the edge function died mid-run and will never finalize the row itself.
export const STALE_AFTER_MS = 10 * 60 * 1000;

export type DerivedStatus = 'completed' | 'failed' | 'processing' | 'timed_out';

export const deriveStatus = (log: BackupLog, now = Date.now()): DerivedStatus => {
  if (log.status !== 'processing') return log.status as DerivedStatus;
  const touchedAt = new Date(log.updated_at || log.created_at).getTime();
  return now - touchedAt > STALE_AFTER_MS ? 'timed_out' : 'processing';
};

export const statusLabel: Record<DerivedStatus, string> = {
  completed: 'Completed',
  failed: 'Failed',
  processing: 'In progress',
  timed_out: 'Timed out',
};

const formatBytes = (bytes?: number) => {
  if (!bytes) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  let size = bytes;
  let i = 0;
  while (size >= 1024 && i < units.length - 1) {
    size /= 1024;
    i++;
  }
  return `${size.toFixed(1)} ${units[i]}`;
};

const relativeTime = (iso: string) => {
  const diff = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
};

const getLosAngelesDate = (iso: string) => {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Los_Angeles',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date(iso));
  const value = (type: Intl.DateTimeFormatPartTypes) => parts.find((part) => part.type === type)?.value ?? '';
  return `${value('year')}-${value('month')}-${value('day')}`;
};

interface Props {
  logs: BackupLog[];
  sources: BackupSource[];
  extractSourceName: (fileName: string | null) => string;
}

/**
 * Shows the state of the most recent backup run per source, so a run that dies
 * mid-flight (edge function timeout) is visible instead of silently missing.
 */
const BackupRunProgress: React.FC<Props> = ({ logs, sources, extractSourceName }) => {
  const [open, setOpen] = useState(true);
  const [retryingSourceId, setRetryingSourceId] = useState<string | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();
  const { runLogs, counts, runStartedAt } = useMemo(() => {
    const now = Date.now();
    // The current "run" = the newest log plus everything within 6h of it.
    const newest = logs.reduce<number>((max, log) => Math.max(max, new Date(log.created_at).getTime()), 0);
    const windowStart = newest - 6 * 60 * 60 * 1000;
    const inRun = logs
      .filter((log) => new Date(log.created_at).getTime() >= windowStart)
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

    // Keep only the latest attempt per source in this run.
    const bySource = new Map<string, BackupLog>();
    inRun.forEach((log) => {
      const source = sources.find((item) => item.id === log.source_id);
      bySource.set(source?.name ?? extractSourceName(log.file_name), log);
    });
    const runLogs = sources.map((source) => {
      const log = bySource.get(source.name);
      return {
        sourceId: source.id,
        sourceActive: source.active,
        sourceName: source.name,
        log,
        status: log ? deriveStatus(log, now) : 'failed' as DerivedStatus,
        reason: log?.error_message || (!log
          ? (source.active
              ? 'No backup record was created. The run ended before this source started.'
              : 'Source is paused, so its data is excluded from backups.')
          : null),
      };
    });

    const counts = runLogs.reduce(
      (acc, item) => {
        acc[item.status] += 1;
        return acc;
      },
      { completed: 0, failed: 0, processing: 0, timed_out: 0 } as Record<DerivedStatus, number>,
    );

    return {
      runLogs: runLogs.sort((a, b) => a.sourceName.localeCompare(b.sourceName)),
      counts,
      runStartedAt: inRun[0]?.created_at ?? null,
    };
  }, [logs, sources, extractSourceName]);

  if (runLogs.length === 0) return null;

  const finished = counts.completed + counts.failed + counts.timed_out;
  const percent = Math.round((finished / runLogs.length) * 100);
  const hasProblem = counts.failed > 0 || counts.timed_out > 0;
  const unhealthy = runLogs.filter((item) => item.status !== 'completed');

  const retryBackup = async (sourceId: string, sourceName: string, log?: BackupLog) => {
    if (!user || !runStartedAt) return;
    setRetryingSourceId(sourceId);
    try {
      const { data, error } = await supabase.functions.invoke('dropbox-backup', {
        body: {
          action: 'recreate_backup',
          userId: user.id,
          sourceId,
          pstDate: getLosAngelesDate(log?.created_at ?? runStartedAt),
          format: log?.format ?? 'csv',
        },
      });
      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || 'Backup retry failed');
      toast({ title: 'Backup completed', description: `${sourceName} was backed up successfully.` });
    } catch (error) {
      console.error('Backup retry failed:', error);
      toast({
        title: 'Retry did not complete',
        description: error instanceof Error ? error.message : `Could not retry ${sourceName}.`,
        variant: 'destructive',
      });
    } finally {
      setRetryingSourceId(null);
    }
  };

  return (
    <Card className="w-full max-w-6xl mx-auto">
      <Collapsible open={open} onOpenChange={setOpen}>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <CardTitle className="flex items-center gap-3 text-lg">
                <Activity className="h-5 w-5 text-primary" />
                Latest Backup Run
              </CardTitle>
              <CardDescription>
                {runStartedAt
                  ? `Started ${relativeTime(runStartedAt)} · ${runLogs.length} source${runLogs.length !== 1 ? 's' : ''}`
                  : 'Per-source progress for the most recent backup run'}
              </CardDescription>
            </div>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm" className="shrink-0 gap-1" aria-label={open ? 'Minimize latest backup run' : 'Expand latest backup run'}>
                {open ? <>Minimize <ChevronUp className="h-4 w-4" /></> : <>Show <ChevronDown className="h-4 w-4" /></>}
              </Button>
            </CollapsibleTrigger>
          </div>
        </CardHeader>

        <CollapsibleContent>
          <CardContent className="space-y-4">
        <div className="space-y-2">
          <Progress value={percent} />
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <span className="text-muted-foreground">
              {finished}/{runLogs.length} sources finished
            </span>
            <Badge variant="default" className="gap-1">
              <CheckCircle2 className="h-3 w-3" /> {counts.completed} completed
            </Badge>
            {counts.processing > 0 && (
              <Badge variant="secondary" className="gap-1">
                <Loader2 className="h-3 w-3 animate-spin" /> {counts.processing} in progress
              </Badge>
            )}
            {counts.timed_out > 0 && (
              <Badge variant="destructive" className="gap-1">
                <AlertTriangle className="h-3 w-3" /> {counts.timed_out} timed out
              </Badge>
            )}
            {counts.failed > 0 && (
              <Badge variant="destructive" className="gap-1">
                <XCircle className="h-3 w-3" /> {counts.failed} failed
              </Badge>
            )}
          </div>
        </div>

        {hasProblem && (
          <p className="text-sm text-destructive">
            Some sources never finished. Timed out means the backup job stopped mid-run — re-run the backup for
            those sources to produce their files.
          </p>
        )}

        {unhealthy.length > 0 && (
          <div className="rounded-md border divide-y">
            {unhealthy.map(({ sourceId, sourceActive, sourceName, log, status, reason }) => (
              <div key={log?.id ?? sourceName} className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 text-sm">
                <div className="flex items-center gap-2 min-w-0">
                  {status === 'processing' && <Loader2 className="h-4 w-4 animate-spin text-yellow-600" />}
                  {status === 'timed_out' && <AlertTriangle className="h-4 w-4 text-destructive" />}
                  {status === 'failed' && <XCircle className="h-4 w-4 text-destructive" />}
                  <div className="min-w-0">
                    <span className="font-medium block truncate">{sourceName}</span>
                    {reason && <span className="text-xs text-destructive block">{reason}</span>}
                  </div>
                </div>
                <div className="flex items-center gap-3 text-muted-foreground">
                  <span>
                    {(log?.record_count ?? 0).toLocaleString()} records · {formatBytes(log?.file_size)} written
                  </span>
                  {log && <span>{relativeTime(log.updated_at || log.created_at)}</span>}
                  <Badge variant={status === 'processing' ? 'secondary' : 'destructive'}>
                    {statusLabel[status]}
                  </Badge>
                  {sourceActive && status !== 'processing' && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-1"
                      disabled={retryingSourceId !== null}
                      onClick={() => retryBackup(sourceId, sourceName, log)}
                    >
                      {retryingSourceId === sourceId
                        ? <Loader2 className="h-4 w-4 animate-spin" />
                        : <RefreshCw className="h-4 w-4" />}
                      Retry
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
};

export default BackupRunProgress;
