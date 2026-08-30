import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import DropboxErrorHint from "@/components/DropboxErrorHint";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  Download, 
  ExternalLink, 
  Trash2, 
  Clock, 
  CheckCircle2, 
  XCircle,
  Database,
  Calendar,
  FileText,
  HardDrive,
  AlertTriangle,
  Wrench,
  ChevronDown,
  ChevronUp,
  X
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { BackupLogsService, BackupLog, BackupSource } from "@/services/BackupLogsService";
import { useAuth } from "@/hooks/useAuth";
import { ApiService } from "@/services/ApiService";
import { supabase } from "@/integrations/supabase/client";
import BackupRunProgress, { deriveStatus, statusLabel, backupTargetDate, getLosAngelesDate } from "@/components/BackupRunProgress";
import BackupRunDashboard from "@/components/BackupRunDashboard";

// Extract source name from backup file name pattern: backup_YYYY-MM-DD_SourceName.csv
const extractSourceName = (fileName: string | null): string => {
  if (!fileName) return 'Unknown';
  const match = fileName.match(/(?:manual_)?backup_\d{4}-\d{2}-\d{2}_(.+)\.\w+$/);
  return match ? match[1].replace(/_/g, ' ') : 'Unknown';
};


// Module-level cache so logs persist across remounts/tab switches/navigations
let cachedLogs: BackupLog[] | null = null;
let cachedAt = 0;
const CACHE_TTL_MS = 60_000; // 1 minute — background refresh after this

const BackupLogs: React.FC = () => {
  const [logs, setLogs] = useState<BackupLog[]>(cachedLogs ?? []);
  const [sources, setSources] = useState<BackupSource[]>([]);
  // Only show the spinner if we have nothing cached yet
  const [isLoading, setIsLoading] = useState(cachedLogs === null);
  const [isDeletingId, setIsDeletingId] = useState<string | null>(null);
  const [isDownloadingId, setIsDownloadingId] = useState<string | null>(null);
  const [selectedSource, setSelectedSource] = useState<string>('all');
  const [dropboxApp, setDropboxApp] = useState<{ appKey: string | null; connected: boolean } | null>(null);
  const [recordCounts, setRecordCounts] = useState<Record<string, number>>({});
  const [showAllSources, setShowAllSources] = useState(false);
  
  const [retryingDay, setRetryingDay] = useState<string | null>(null);
  const [isRepairing, setIsRepairing] = useState(false);
  const [repairProgress, setRepairProgress] = useState<{
    batch: number;
    totalRepaired: number;
    totalFailed: number;
    remaining: number;
    currentFile?: string;
    done: boolean;
    failures: string[];
  } | null>(null);
  const [showRepairDetails, setShowRepairDetails] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  // Ticks while a run is active so elapsed/timeout state stays accurate on screen
  const [, setTick] = useState(0);

  // Normalize names so "Popular - Solar" and "Popular___Solar" resolve to one source
  const normalizeName = (value: string) =>
    value.toLowerCase().replace(/[^a-z0-9]+/g, ' ').replace(/\s+/g, ' ').trim();

  // Resolve a log's display source name: source link first, then normalized
  // file-name match against known sources, then the raw parsed file-name text.
  const resolveNameFromFile = useCallback(
    (fileName: string | null): string => {
      const parsed = extractSourceName(fileName);
      if (parsed === 'Unknown') return parsed;
      const norm = normalizeName(parsed);
      const match = sources.find(source => normalizeName(source.name) === norm);
      return match?.name ?? parsed;
    },
    [sources],
  );

  const resolveLogName = useCallback(
    (log: BackupLog): string => {
      const source = sources.find(item => item.id === log.source_id);
      return source?.name ?? resolveNameFromFile(log.file_name);
    },
    [sources, resolveNameFromFile],
  );

  // Build the list of source names shown in the tab bar.
  // Default: only active sources that actually have data.
  // Toggle: show every non-partner source plus any source referenced by logs.
  const sourceNames = useMemo(() => {
    const allNames = new Set<string>();
    sources.forEach(source => allNames.add(source.name));
    logs.forEach(log => {
      allNames.add(resolveLogName(log));
    });
    allNames.delete('Unknown');

    if (showAllSources) return Array.from(allNames).sort();

    const visible = new Set<string>();
    sources.forEach(source => {
      if (!source.active) return;
      const hasData = (recordCounts[source.id] || 0) > 0;
      if (hasData) visible.add(source.name);
    });
    // Also keep any source that already has a completed backup log with records
    logs.forEach(log => {
      if (log.record_count > 0) {
        const name = resolveLogName(log);
        if (name && name !== 'Unknown') visible.add(name);
      }
    });
    return Array.from(visible).sort();
  }, [logs, sources, recordCounts, showAllSources, resolveLogName]);

  const filteredLogs = useMemo(() => {
    const bySource = selectedSource === 'all'
      ? logs
      : logs.filter(log => resolveLogName(log) === selectedSource);
    // Successful backups only — failures and timed-out (stale) runs are hidden
    // and summarized as one missing-day notice instead.
    return bySource.filter(log => {
      const status = deriveStatus(log);
      return status === 'completed' || status === 'processing';
    });
  }, [logs, selectedSource, resolveLogName]);

  // Sources that should produce a file every day
  const expectedSources = useMemo(
    () => sources.filter(source =>
      source.active
      && !source.is_partner
      && (selectedSource === 'all'
        ? (recordCounts[source.id] || 0) > 0
        : source.name === selectedSource)),
    [sources, selectedSource, recordCounts],
  );

  // Days (last 14) where an expected source produced no completed backup file
  const missingDays = useMemo(() => {
    if (expectedSources.length === 0) return [];
    const done = new Set<string>();
    logs.forEach(log => {
      if (log.status !== 'completed' || !log.file_name) return;
      const day = backupTargetDate(log);
      if (day) done.add(`${resolveLogName(log)}|${day}`);
    });

    const todayPst = getLosAngelesDate(new Date().toISOString());
    const [y, m, d] = todayPst.split('-').map(Number);
    const result: { date: string; sources: BackupSource[] }[] = [];
    for (let i = 1; i <= 14; i++) {
      const date = new Date(Date.UTC(y, m - 1, d - i)).toISOString().slice(0, 10);
      const missing = expectedSources.filter(source => !done.has(`${source.name}|${date}`));
      if (missing.length > 0) result.push({ date, sources: missing });
    }
    return result;
  }, [logs, expectedSources, resolveLogName]);

  // Fingerprint of the current missing-days set — dismissal stays until the
  // situation changes (new missing day appears or a day gets fixed)
  const missingDaysKey = useMemo(
    () => missingDays.map(({ date, sources: m }) => `${date}:${m.map(s => s.name).join(',')}`).join('|'),
    [missingDays],
  );
  const [dismissedMissingKey, setDismissedMissingKey] = useState<string | null>(
    () => localStorage.getItem('backup-logs-dismissed-missing'),
  );
  const dismissMissingDays = () => {
    localStorage.setItem('backup-logs-dismissed-missing', missingDaysKey);
    setDismissedMissingKey(missingDaysKey);
  };
  const showMissingDays = missingDays.length > 0 && dismissedMissingKey !== missingDaysKey;

  const retryDay = async (date: string, targets: BackupSource[]) => {
    if (!user) return;
    setRetryingDay(date);
    let ok = 0;
    let failed = 0;
    try {
      for (const source of targets) {
        try {
          const { data, error } = await supabase.functions.invoke('dropbox-backup', {
            body: {
              action: 'recreate_backup',
              userId: user.id,
              sourceId: source.id,
              pstDate: date,
              format: 'csv',
            },
          });
          if (error || data?.success === false) throw new Error(error?.message || data?.error || 'Backup failed');
          ok++;
        } catch (sourceError) {
          console.error(`Retry failed for ${source.name} on ${date}:`, sourceError);
          failed++;
        }
      }
      toast({
        title: `Retry finished for ${date}`,
        description: `${ok} source${ok !== 1 ? 's' : ''} backed up${failed ? `, ${failed} still missing` : ''}.`,
        variant: failed && !ok ? 'destructive' : 'default',
      });
      await loadBackupLogs(true);
    } finally {
      setRetryingDay(null);
    }
  };


  useEffect(() => {
    if (!user) return;

    const isStale = Date.now() - cachedAt > CACHE_TTL_MS;
    // Fetch only if no cache or cache is stale; otherwise reuse cached data
    if (cachedLogs === null || isStale) {
      loadBackupLogs(cachedLogs !== null);
    }
    BackupLogsService.getBackupSources().then(setSources).catch(error => {
      console.error('Error loading backup sources:', error);
    });

    BackupLogsService.getSourceRecordCounts().then(setRecordCounts).catch(error => {
      console.error('Error loading source record counts:', error);
    });

    // Show which Dropbox app is connected alongside the logs
    ApiService.getDropboxConfig().then(config => {
      setDropboxApp({
        appKey: config?.app_key ?? null,
        connected: Boolean(config?.refresh_token && config?.is_active),
      });
    }).catch(error => {
      console.error('Error loading Dropbox config:', error);
    });

    // Subscribe to real-time updates so the cache stays fresh in the background
    const unsubscribe = BackupLogsService.subscribeToBackupLogs((updatedLogs) => {
      cachedLogs = updatedLogs;
      cachedAt = Date.now();
      setLogs(updatedLogs);
    });

    return unsubscribe;
  }, [user]);

  const hasRunningBackup = useMemo(
    () => logs.some(log => log.status === 'processing'),
    [logs]
  );

  // While a run is in flight, refresh + re-render so progress advances and a
  // stalled run flips to "Timed out" without the user reloading the page.
  useEffect(() => {
    if (!user || !hasRunningBackup) return;
    const interval = setInterval(() => {
      setTick(t => t + 1);
      loadBackupLogs(true);
    }, 15_000);
    return () => clearInterval(interval);
  }, [user, hasRunningBackup]);


  // background = true means we already have cached data shown, just refresh silently
  const loadBackupLogs = async (background = false) => {
    try {
      if (!background) setIsLoading(true);
      const backupLogs = await BackupLogsService.getBackupLogs();
      cachedLogs = backupLogs;
      cachedAt = Date.now();
      setLogs(backupLogs);
    } catch (error) {
      console.error('Error loading backup logs:', error);
      if (!background) {
        toast({
          title: "Error",
          description: "Failed to load backup logs",
          variant: "destructive",
        });
      }
    } finally {
      if (!background) setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      setIsDeletingId(id);
      await BackupLogsService.deleteBackupLog(id);
      toast({
        title: "Success",
        description: "Backup log deleted successfully",
      });
      await loadBackupLogs(true);
    } catch (error) {
      console.error('Error deleting backup log:', error);
      toast({
        title: "Error",
        description: "Failed to delete backup log",
        variant: "destructive",
      });
    } finally {
      setIsDeletingId(null);
    }
  };

  const downloadFile = async (url: string, filename: string) => {
    try {
      // Fetch the file as a blob
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const blob = await response.blob();
      
      // Create object URL from blob
      const objectUrl = URL.createObjectURL(blob);
      
      // Create download link
      const link = document.createElement('a');
      link.href = objectUrl;
      link.download = filename;
      link.style.display = 'none';
      
      // Trigger download
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Clean up object URL
      URL.revokeObjectURL(objectUrl);
      
      return true;
    } catch (error) {
      console.error('Download failed:', error);
      return false;
    }
  };

  const handleDirectDownload = async (log: BackupLog) => {
    if (!log.storage_path) {
      toast({
        title: "Error",
        description: "No direct download available for this backup",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsDownloadingId(log.id);
      
      const downloadUrl = await BackupLogsService.getDownloadUrl(log.storage_path);
      if (downloadUrl) {
        const success = await downloadFile(downloadUrl, log.file_name || 'backup');
        
        if (success) {
          toast({
            title: "Success",
            description: "File downloaded successfully",
          });
        } else {
          throw new Error('Download failed');
        }
      } else {
        throw new Error('Failed to generate download URL');
      }
    } catch (error) {
      console.error('Error downloading file:', error);
      toast({
        title: "Error",
        description: "Failed to download file",
        variant: "destructive",
      });
    } finally {
      setIsDownloadingId(null);
    }
  };

  // Completed backups whose Dropbox share link / Storage copy never got created
  const missingLinkCount = useMemo(
    () => logs.filter(log => log.status === 'completed' && log.file_name && !log.storage_path && !log.dropbox_url).length,
    [logs],
  );

  const handleRepairLinks = async () => {
    if (!user) return;
    setIsRepairing(true);
    setRepairProgress({
      batch: 0,
      totalRepaired: 0,
      totalFailed: 0,
      remaining: missingLinkCount,
      currentFile: undefined,
      done: false,
      failures: [],
    });
    setShowRepairDetails(true);

    try {
      // Repair in small batches so each Edge Function call stays inside its runtime limit
      let repaired = 0;
      let failed = 0;
      const allFailures: string[] = [];
      const allRepaired: string[] = [];
      const batchSize = 8;
      const estimatedBatches = Math.max(1, Math.ceil(missingLinkCount / batchSize));

      console.log(`[BackupLogs] starting link repair for ${missingLinkCount} missing links`);

      for (let round = 0; round < 20; round++) {
        setRepairProgress(prev => ({
          ...prev!,
          batch: round + 1,
          currentFile: `Batch ${round + 1} of ~${estimatedBatches}...`,
        }));

        const { data, error } = await supabase.functions.invoke('dropbox-backup', {
          body: { action: 'repair_links', userId: user.id, limit: batchSize },
        });
        console.log(`[BackupLogs] repair batch ${round + 1} response:`, { data, error });
        if (error) throw error;
        if (data?.success === false || data?.error) throw new Error(data.error || 'Link repair failed');

        repaired += data?.repaired ?? 0;
        failed += data?.failed ?? 0;
        if (data?.failures?.length) {
          allFailures.push(...data.failures);
        }
        if (data?.repairedFiles?.length) {
          allRepaired.push(...data.repairedFiles);
        }

        const checked = data?.checked ?? 0;
        const justProcessed = (data?.repaired ?? 0) + (data?.failed ?? 0);
        const remaining = Math.max(0, missingLinkCount - repaired - failed);

        setRepairProgress({
          batch: round + 1,
          totalRepaired: repaired,
          totalFailed: failed,
          remaining,
          currentFile: checked === 0
            ? 'No more missing links found'
            : `Batch ${round + 1}: ${data?.repaired ?? 0} repaired, ${data?.failed ?? 0} failed`,
          done: checked === 0 || justProcessed === 0,
          failures: allFailures.slice(0, 50),
        });

        if (checked === 0 || justProcessed === 0) break;
      }

      toast({
        title: "Download links restored",
        description: `${repaired} backup${repaired !== 1 ? 's' : ''} now have download links${failed ? `, ${failed} could not be recovered` : ''}.`,
      });
      await loadBackupLogs();
    } catch (repairError) {
      console.error('Repair links error:', repairError);
      setRepairProgress(prev => prev ? { ...prev, done: true } : null);
      toast({
        title: "Could not restore links",
        description: repairError instanceof Error ? repairError.message : 'Unknown error',
        variant: "destructive",
      });
    } finally {
      setIsRepairing(false);
    }
  };



  const handleDropboxDownload = async (log: BackupLog) => {
    if (!log.dropbox_url) {
      toast({
        title: "Error",
        description: "No Dropbox URL available for this backup",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsDownloadingId(log.id);
      
      // Convert Dropbox share URL to direct download URL
      let directUrl = log.dropbox_url;
      if (directUrl.includes('dropbox.com') && directUrl.includes('?dl=0')) {
        directUrl = directUrl.replace('?dl=0', '?dl=1');
      }
      
      const success = await downloadFile(directUrl, log.file_name || 'backup');
      
      if (success) {
        toast({
          title: "Success",
          description: "File downloaded from Dropbox successfully",
        });
      } else {
        // Fallback to opening in new tab
        window.open(log.dropbox_url, '_blank');
        toast({
          title: "Info",
          description: "Opened Dropbox file in new tab",
        });
      }
    } catch (error) {
      console.error('Error downloading from Dropbox:', error);
      // Fallback to opening in new tab
      window.open(log.dropbox_url, '_blank');
      toast({
        title: "Info",
        description: "Opened Dropbox file in new tab",
      });
    } finally {
      setIsDownloadingId(null);
    }
  };

  const handleDropboxOpen = (dropboxUrl: string) => {
    window.open(dropboxUrl, '_blank');
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'timed_out':
        return <AlertTriangle className="h-4 w-4 text-red-600" />;
      case 'processing':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      completed: 'default',
      failed: 'destructive',
      timed_out: 'destructive',
      processing: 'secondary'
    } as const;

    return (
      <Badge
        variant={variants[status as keyof typeof variants] || 'secondary'}
        title={status === 'timed_out' ? 'The backup job stopped before finishing this file' : undefined}
      >
        {statusLabel[status as keyof typeof statusLabel] ?? status}
      </Badge>
    );
  };


  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'Unknown';
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIndex = 0;
    
    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }
    
    return `${size.toFixed(1)} ${units[unitIndex]}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  if (!user) {
    return (
      <Card className="w-full max-w-4xl mx-auto">
        <CardContent className="flex items-center justify-center p-12">
          <div className="text-center space-y-3">
            <Database className="h-12 w-12 text-slate-400 mx-auto" />
            <p className="text-slate-600 font-medium">Authentication Required</p>
            <p className="text-sm text-slate-500">Please log in to view backup logs</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <BackupRunProgress logs={logs} sources={sources} extractSourceName={resolveNameFromFile} />
      <BackupRunDashboard logs={logs} sources={sources} extractSourceName={resolveNameFromFile} />
      <Card className="w-full max-w-6xl mx-auto">

      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-3 text-lg">
          <Database className="h-5 w-5 text-primary" />
          Backup Logs
          {dropboxApp && (
            <Badge variant={dropboxApp.connected ? 'default' : 'destructive'} className="font-mono text-xs">
              Dropbox app {dropboxApp.appKey ?? 'not set'}
              {dropboxApp.connected ? '' : ' · not connected'}
            </Badge>
          )}
        </CardTitle>
        <CardDescription>
          View and manage your backup history. Files are stored both locally and on Dropbox for redundancy.
        </CardDescription>
      </CardHeader>

      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center p-8">
            <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            <span className="ml-3 text-slate-600">Loading backup logs...</span>
          </div>
        ) : logs.length === 0 ? (
          <div className="text-center py-8">
            <FileText className="h-12 w-12 text-slate-400 mx-auto mb-4" />
            <p className="text-slate-600 font-medium">No backup logs found</p>
            <p className="text-sm text-slate-500 mt-1">
              Backup logs will appear here after you create your first backup
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex flex-col gap-3">
              {sourceNames.length > 1 && (
                <Tabs value={selectedSource} onValueChange={setSelectedSource}>
                  <TabsList className="flex-wrap h-auto gap-1">
                    <TabsTrigger value="all">All Sources</TabsTrigger>
                    {sourceNames.map(name => (
                      <TabsTrigger key={name} value={name}>
                        {name}
                      </TabsTrigger>
                    ))}
                  </TabsList>
                </Tabs>
              )}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-muted-foreground">
              <span>{filteredLogs.length} backup log{filteredLogs.length !== 1 ? 's' : ''} found{selectedSource !== 'all' ? ` for ${selectedSource}` : ''}</span>
              <div className="flex items-center gap-3">
                {missingLinkCount > 0 && (
                  <span className="text-xs text-destructive">
                    {missingLinkCount} backup{missingLinkCount !== 1 ? 's' : ''} without a download link
                  </span>
                )}
                <Button variant="outline" size="sm" onClick={handleRepairLinks} disabled={isRepairing} className="gap-2">
                  {isRepairing ? (
                    <div className="h-3 w-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Wrench className="h-3 w-3" />
                  )}
                  Restore download links
                </Button>
                {!showAllSources && (
                  <span className="text-xs">Showing active sources with data</span>
                )}
              </div>
            </div>

            {repairProgress && (
              <Alert className={repairProgress.done ? 'border-green-500/30 bg-green-500/5' : 'border-primary/30 bg-primary/5'}>
                <div className="flex items-start gap-3 w-full">
                  {repairProgress.done ? (
                    <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
                  ) : (
                    <div className="h-5 w-5 border-2 border-primary border-t-transparent rounded-full animate-spin mt-0.5" />
                  )}
                  <div className="flex-1 space-y-2">
                    <AlertTitle className="text-sm">
                      {repairProgress.done
                        ? `Link restore complete — ${repairProgress.totalRepaired} repaired, ${repairProgress.totalFailed} failed`
                        : `Restoring download links... batch ${repairProgress.batch}`}
                    </AlertTitle>
                    <AlertDescription className="text-xs">
                      {repairProgress.currentFile}
                    </AlertDescription>
                    {missingLinkCount > 0 && (
                      <Progress
                        value={Math.min(100, Math.round(((repairProgress.totalRepaired + repairProgress.totalFailed) / missingLinkCount) * 100))}
                        className="h-2"
                      />
                    )}
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>
                        {repairProgress.totalRepaired} repaired · {repairProgress.totalFailed} failed · {repairProgress.remaining} remaining
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 px-2 text-xs"
                        onClick={() => setShowRepairDetails(d => !d)}
                      >
                        {showRepairDetails ? (
                          <><ChevronUp className="h-3 w-3 mr-1" /> Hide details</>
                        ) : (
                          <><ChevronDown className="h-3 w-3 mr-1" /> Show details</>
                        )}
                      </Button>
                    </div>
                    {showRepairDetails && (
                      <div className="rounded-md border bg-background p-2 text-xs font-mono space-y-1 max-h-40 overflow-y-auto">
                        {repairProgress.failures.length === 0 ? (
                          <span className="text-muted-foreground">No failures reported yet.</span>
                        ) : (
                          repairProgress.failures.map((f, i) => (
                            <div key={i} className="text-destructive">{f}</div>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </Alert>
            )}

            {showMissingDays && (
              <Alert variant="destructive" className="relative pr-10">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle className="text-sm">
                  Missing backups for {missingDays.length} day{missingDays.length !== 1 ? 's' : ''}
                </AlertTitle>
                <button
                  type="button"
                  onClick={dismissMissingDays}
                  aria-label="Dismiss missing backups notice"
                  className="absolute right-3 top-3 rounded-md p-1 text-current opacity-60 transition-opacity hover:opacity-100"
                >
                  <X className="h-4 w-4" />
                </button>
                <AlertDescription className="text-xs">
                  <div className="mt-2 space-y-1">
                    {missingDays.slice(0, 7).map(({ date, sources: missing }) => (
                      <div key={date} className="flex flex-wrap items-center justify-between gap-2">
                        <span>
                          <span className="font-medium">{date}</span>
                          {' — '}
                          {missing.length} source{missing.length !== 1 ? 's' : ''} without a file
                          {missing.length <= 4 ? ` (${missing.map(s => s.name).join(', ')})` : ''}
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 gap-1 text-xs"
                          disabled={retryingDay !== null}
                          onClick={() => retryDay(date, missing)}
                        >
                          {retryingDay === date ? (
                            <div className="h-3 w-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <Wrench className="h-3 w-3" />
                          )}
                          Retry {date}
                        </Button>
                      </div>
                    ))}
                  </div>
                </AlertDescription>
              </Alert>
            )}

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Status</TableHead>
                  <TableHead>File Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Format</TableHead>
                  <TableHead>Records</TableHead>
                  <TableHead>Size</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLogs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(deriveStatus(log))}
                        {getStatusBadge(deriveStatus(log))}
                      </div>
                    </TableCell>

                    <TableCell className="whitespace-normal min-w-[200px] max-w-[360px]">
                      <div className="flex items-start gap-2">
                        <HardDrive className="h-4 w-4 text-slate-400 mt-0.5 shrink-0" />
                        <div className="min-w-0">
                          <span className="font-medium block break-all line-clamp-2 leading-snug" title={log.file_name || sources.find(source => source.id === log.source_id)?.name || 'File not produced'}>
                            {log.file_name || sources.find(source => source.id === log.source_id)?.name || 'File not produced'}
                          </span>
                          {log.status === 'failed' && log.error_message && <DropboxErrorHint message={log.error_message} className="max-w-md mt-1" />}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-slate-400" />
                        <span className="capitalize">{log.backup_type}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="uppercase">
                        {log.format}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="text-slate-600">{log.record_count.toLocaleString()}</span>
                    </TableCell>
                    <TableCell>
                      <span className="text-slate-600">{formatFileSize(log.file_size)}</span>
                    </TableCell>
                    <TableCell>
                      <span className="text-slate-600">{formatDate(log.created_at)}</span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center gap-2 justify-end">
                        {log.status === 'completed' && (
                          <>
                            {log.storage_path && (
                              <Button
                                variant="default"
                                size="sm"
                                onClick={() => handleDirectDownload(log)}
                                disabled={isDownloadingId === log.id}
                                className="bg-green-600 hover:bg-green-700"
                                title="Download directly"
                              >
                                {isDownloadingId === log.id ? (
                                  <div className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                                ) : (
                                  <Download className="h-4 w-4" />
                                )}
                              </Button>
                            )}
                            {log.dropbox_url && (
                              <>
                                <Button
                                  variant="default"
                                  size="sm"
                                  onClick={() => handleDropboxDownload(log)}
                                  disabled={isDownloadingId === log.id}
                                  className="bg-blue-600 hover:bg-blue-700"
                                  title="Download from Dropbox"
                                >
                                  {isDownloadingId === log.id ? (
                                    <div className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                                  ) : (
                                    <Download className="h-4 w-4" />
                                  )}
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleDropboxOpen(log.dropbox_url!)}
                                  title="View on Dropbox"
                                >
                                  <ExternalLink className="h-4 w-4" />
                                </Button>
                              </>
                            )}
                          </>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(log.id)}
                          disabled={isDeletingId === log.id}
                          title="Delete log"
                        >
                          {isDeletingId === log.id ? (
                            <div className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            <div className="flex flex-wrap items-center justify-end gap-4 pt-2 border-t">
              <div className="flex items-center gap-2">
                <Switch
                  id="show-all-sources"
                  checked={showAllSources}
                  onCheckedChange={setShowAllSources}
                />
                <Label htmlFor="show-all-sources" className="text-sm text-muted-foreground cursor-pointer">
                  Show all sources
                </Label>
              </div>
            </div>
          </div>
        )}
      </CardContent>
      </Card>
    </div>
  );

};

export default BackupLogs;
