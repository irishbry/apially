import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import DropboxErrorHint from "@/components/DropboxErrorHint";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { 
  Download, 
  ExternalLink, 
  Trash2, 
  Clock, 
  CheckCircle2, 
  XCircle,
  Database,
  FileText,
  HardDrive,
  AlertTriangle,
  Wrench,
  ChevronDown,
  ChevronUp,
  X,
  Folder,
  FolderOpen,
  Files,
  Search
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { BackupLogsService, BackupLog, BackupSource } from "@/services/BackupLogsService";
import { useAuth } from "@/hooks/useAuth";
import { ApiService } from "@/services/ApiService";
import { supabase } from "@/integrations/supabase/client";
import { deriveStatus, statusLabel, backupTargetDate, getLosAngelesDate } from "@/components/BackupRunProgress";

// Extract source name from backup file name pattern: backup_YYYY-MM-DD_SourceName.csv
const extractSourceName = (fileName: string | null): string => {
  if (!fileName) return 'Unknown';
  const match = fileName.match(/(?:manual_)?backup_\d{4}-\d{2}-\d{2}_(.+)\.\w+$/);
  return match ? match[1].replace(/_/g, ' ') : 'Unknown';
};

const normalizeName = (value: string) =>
  value.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();


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
  const [selectedFolder, setSelectedFolder] = useState<string>('all');
  const [selectedSubsource, setSelectedSubsource] = useState<string | null>(null);
  const [sourceSearch, setSourceSearch] = useState('');
  const [dropboxApp, setDropboxApp] = useState<{ appKey: string | null; connected: boolean } | null>(null);
  const [recordCounts, setRecordCounts] = useState<Record<string, number>>({});
  const [eligibleDays, setEligibleDays] = useState<Set<string> | null>(null);
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

  // Resolve a log's display source name: source link first, then normalized
  // file-name match against known sources, then the raw parsed file-name text.
  const resolveNameFromFile = useCallback(
    (fileName: string | null): string => {
      const parsed = extractSourceName(fileName);
      if (parsed === 'Unknown') return parsed;
      const norm = normalizeName(parsed);
      const matches = sources.filter(source => normalizeName(source.name) === norm);
      return matches.length === 1 ? matches[0].name : parsed;
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

  const resolveLogSourceId = useCallback((log: BackupLog): string | null => {
    if (log.source_id && sources.some(source => source.id === log.source_id)) return log.source_id;
    const parsed = extractSourceName(log.file_name);
    if (parsed === 'Unknown') return null;
    const matches = sources.filter(source => normalizeName(source.name) === normalizeName(parsed));
    return matches.length === 1 ? matches[0].id : null;
  }, [sources]);

  const sourceBrowser = useMemo(() => {
    const logSourceIds = new Set(logs.map(resolveLogSourceId).filter((id): id is string => Boolean(id)));
    const directlyVisible = new Set(
      sources
        .filter(source => showAllSources || (source.active && ((recordCounts[source.id] || 0) > 0 || logSourceIds.has(source.id))))
        .map(source => source.id),
    );

    // A grouping source remains visible whenever one of its children is visible.
    sources.forEach(source => {
      if (!directlyVisible.has(source.id)) return;
      let parentId = source.parent_id;
      const visited = new Set<string>();
      while (parentId && !visited.has(parentId)) {
        visited.add(parentId);
        directlyVisible.add(parentId);
        parentId = sources.find(parent => parent.id === parentId)?.parent_id ?? null;
      }
    });

    const visibleSources = sources.filter(source => directlyVisible.has(source.id));
    const sourceIds = new Set(visibleSources.map(source => source.id));
    const topLevel = visibleSources
      .filter(source => !source.parent_id || !sourceIds.has(source.parent_id))
      .sort((a, b) => a.name.localeCompare(b.name));
    const childrenByParent = new Map<string, BackupSource[]>();
    visibleSources.forEach(source => {
      if (!source.parent_id || !sourceIds.has(source.parent_id)) return;
      const children = childrenByParent.get(source.parent_id) ?? [];
      children.push(source);
      children.sort((a, b) => a.name.localeCompare(b.name));
      childrenByParent.set(source.parent_id, children);
    });
    const hasUnmatched = logs.some(log => !resolveLogSourceId(log));
    return { topLevel, childrenByParent, hasUnmatched };
  }, [logs, sources, recordCounts, showAllSources, resolveLogSourceId]);

  const selectedFolderSource = sources.find(source => source.id === selectedFolder);
  const selectedChildren = selectedFolderSource
    ? sourceBrowser.childrenByParent.get(selectedFolderSource.id) ?? []
    : [];
  const selectedSubsourceSource = sources.find(source => source.id === selectedSubsource);
  const searchTerm = sourceSearch.trim().toLowerCase();
  const matchingFolders = sourceBrowser.topLevel.filter(source =>
    source.name.toLowerCase().includes(searchTerm)
    || (sourceBrowser.childrenByParent.get(source.id) ?? []).some(child => child.name.toLowerCase().includes(searchTerm)));
  const selectedLabel = selectedFolder === 'all'
    ? 'All Sources'
    : selectedFolder === 'unmatched'
      ? 'Unmatched historical files'
      : selectedSubsourceSource
        ? `${selectedFolderSource?.name ?? 'Source'} / ${selectedSubsourceSource.name}`
        : selectedFolderSource?.name ?? 'All Sources';

  const filteredLogs = useMemo(() => {
    const folderChildren = selectedFolder === 'all' || selectedFolder === 'unmatched'
      ? []
      : sourceBrowser.childrenByParent.get(selectedFolder) ?? [];
    const allowedIds = new Set(selectedSubsource
      ? [selectedSubsource]
      : [selectedFolder, ...folderChildren.map(source => source.id)]);
    const bySource = selectedFolder === 'all'
      ? logs
      : selectedFolder === 'unmatched'
        ? logs.filter(log => !resolveLogSourceId(log))
        : logs.filter(log => {
          const sourceId = resolveLogSourceId(log);
          return sourceId ? allowedIds.has(sourceId) : false;
        });
    // Successful backups only — failures and timed-out (stale) runs are hidden
    // and summarized as one missing-day notice instead.
    return bySource.filter(log => {
      const status = deriveStatus(log);
      return (status === 'completed' && Boolean(log.file_name)) || status === 'processing';
    });
  }, [logs, selectedFolder, selectedSubsource, sourceBrowser.childrenByParent, resolveLogSourceId]);

  // Sources that should produce a file every day
  const expectedSources = useMemo(
    () => sources.filter(source =>
      source.active
      && !source.is_partner
      && (selectedFolder === 'all'
        || (selectedFolder !== 'unmatched' && (
          source.id === (selectedSubsource ?? selectedFolder)
          || (!selectedSubsource && source.parent_id === selectedFolder)
        )))),
    [sources, selectedFolder, selectedSubsource],
  );

  // Days (last 14) where an expected source produced no completed backup file
  const missingDays = useMemo(() => {
    if (expectedSources.length === 0 || !eligibleDays) return [];
    const done = new Set<string>();
    logs.forEach(log => {
      if (log.status !== 'completed' || !log.file_name) return;
      const day = backupTargetDate(log);
      if (day) done.add(`${resolveLogSourceId(log) ?? resolveLogName(log)}|${day}`);
    });

    const todayPst = getLosAngelesDate(new Date().toISOString());
    const [y, m, d] = todayPst.split('-').map(Number);
    const result: { date: string; sources: BackupSource[] }[] = [];
    for (let i = 1; i <= 14; i++) {
      const date = new Date(Date.UTC(y, m - 1, d - i)).toISOString().slice(0, 10);
      const missing = expectedSources.filter(source =>
        eligibleDays.has(`${source.id}|${date}`) &&
        !done.has(`${source.id}|${date}`) && !done.has(`${source.name}|${date}`));
      if (missing.length > 0) result.push({ date, sources: missing });
    }
    return result;
  }, [logs, expectedSources, eligibleDays, resolveLogName, resolveLogSourceId]);

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
      BackupLogsService.getRecentBackupEligibility().then(setEligibleDays).catch(console.error);
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
    BackupLogsService.getBackupSources(true).then(setSources).catch(error => {
      console.error('Error loading backup sources:', error);
    });

    BackupLogsService.getSourceRecordCounts().then(setRecordCounts).catch(error => {
      console.error('Error loading source record counts:', error);
    });
    BackupLogsService.getRecentBackupEligibility().then(setEligibleDays).catch(error => {
      console.error('Error loading backup eligibility:', error);
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
            <div className="grid gap-5 lg:grid-cols-[240px_minmax(0,1fr)]">
              <nav aria-label="Data sources" className="min-w-0 border-b pb-4 lg:border-b-0 lg:border-r lg:pb-0 lg:pr-5">
                <div className="mb-3 text-xs font-semibold uppercase text-muted-foreground">Data sources</div>
                <div className="relative mb-3">
                  <Search className="pointer-events-none absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input aria-label="Search sources" placeholder="Search sources" value={sourceSearch} onChange={event => setSourceSearch(event.target.value)} className="h-9 pl-9" />
                </div>
                <div className="max-h-72 space-y-1 overflow-y-auto lg:max-h-[460px]">
                  <Button variant={selectedFolder === 'all' ? 'secondary' : 'ghost'} className="h-auto min-h-9 w-full justify-start gap-2 whitespace-normal text-left" onClick={() => { setSelectedFolder('all'); setSelectedSubsource(null); }}>
                    <Files className="h-4 w-4 shrink-0" /> All Sources
                  </Button>
                  {matchingFolders.map(source => {
                    const children = sourceBrowser.childrenByParent.get(source.id) ?? [];
                    return (
                      <Button key={source.id} variant={selectedFolder === source.id ? 'secondary' : 'ghost'} className="h-auto min-h-9 w-full justify-start gap-2 whitespace-normal text-left" onClick={() => { setSelectedFolder(source.id); setSelectedSubsource(null); }}>
                        {selectedFolder === source.id ? <FolderOpen className="h-4 w-4 shrink-0 text-primary" /> : <Folder className="h-4 w-4 shrink-0 text-muted-foreground" />}
                        <span className="min-w-0 flex-1 break-words">{source.name}</span>
                        {children.length > 0 && <span className="text-xs text-muted-foreground">{children.length}</span>}
                      </Button>
                    );
                  })}
                  {sourceBrowser.hasUnmatched && (!searchTerm || 'unmatched historical files'.includes(searchTerm)) && (
                    <Button variant={selectedFolder === 'unmatched' ? 'secondary' : 'ghost'} className="h-auto min-h-9 w-full justify-start gap-2 whitespace-normal text-left" onClick={() => { setSelectedFolder('unmatched'); setSelectedSubsource(null); }}>
                      <Folder className="h-4 w-4 shrink-0 text-muted-foreground" /> Unmatched historical files
                    </Button>
                  )}
                </div>
                <div className="mt-4 flex items-center gap-2 border-t pt-4">
                  <Switch id="show-all-sources" checked={showAllSources} onCheckedChange={setShowAllSources} />
                  <Label htmlFor="show-all-sources" className="cursor-pointer text-sm text-muted-foreground">Show all sources</Label>
                </div>
              </nav>

              <div className="min-w-0 space-y-4">
                <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                  <Button variant="link" size="sm" className="h-auto p-0" onClick={() => { setSelectedFolder('all'); setSelectedSubsource(null); }}>All Sources</Button>
                  {selectedFolder !== 'all' && <><span>/</span><Button variant="link" size="sm" className="h-auto p-0" onClick={() => setSelectedSubsource(null)}>{selectedFolderSource?.name ?? 'Unmatched historical files'}</Button></>}
                  {selectedSubsourceSource && <><span>/</span><span className="font-medium text-foreground">{selectedSubsourceSource.name}</span></>}
                </div>
                {selectedFolderSource && selectedChildren.length > 0 && (
                  <section aria-label={`${selectedFolderSource.name} subsources`}>
                    <h3 className="mb-3 text-sm font-semibold">{selectedFolderSource.name} subsources</h3>
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-4">
                      {selectedChildren.map(child => (
                        <Button key={child.id} variant={selectedSubsource === child.id ? 'secondary' : 'outline'} className="h-auto min-h-20 flex-col items-start justify-center gap-2 whitespace-normal p-3 text-left" onClick={() => setSelectedSubsource(child.id)}>
                          <Folder className="h-5 w-5 text-primary" />
                          <span className="w-full break-words text-sm">{child.name}</span>
                        </Button>
                      ))}
                    </div>
                    {selectedSubsource && <Button variant="link" size="sm" className="mt-2 px-0" onClick={() => setSelectedSubsource(null)}>View all {selectedFolderSource.name} files</Button>}
                  </section>
                )}
                <div className="flex items-center justify-between gap-3 border-t pt-3">
                  <h3 className="min-w-0 break-words text-base font-semibold">{selectedLabel} backups</h3>
                  <span className="shrink-0 text-sm text-muted-foreground">{filteredLogs.length} file{filteredLogs.length !== 1 ? 's' : ''}</span>
                </div>
                <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
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
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={dismissMissingDays}
                  aria-label="Dismiss missing backups notice"
                  className="absolute right-3 top-3 h-7 w-7 opacity-60 hover:opacity-100"
                >
                  <X className="h-4 w-4" />
                </Button>
                <AlertDescription className="text-xs">
                  <div className="mt-2 space-y-1">
                    {missingDays.map(({ date, sources: missing }) => (
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

            <div className="min-w-0 divide-y border-y" aria-label="Backup files">
              {filteredLogs.map((log) => {
                const fileName = log.file_name || sources.find(source => source.id === log.source_id)?.name || 'File not produced';
                return (
                  <div key={log.id} className="min-w-0 py-3">
                    <div className="flex min-w-0 items-start gap-2">
                      <HardDrive className="mt-1 h-4 w-4 shrink-0 text-muted-foreground" />
                      <div className="min-w-0 flex-1">
                        <span className="block break-all text-sm font-medium leading-snug" title={fileName}>{fileName}</span>
                        {log.status === 'failed' && log.error_message && <DropboxErrorHint message={log.error_message} className="mt-1 max-w-md" />}
                      </div>
                      <div className="flex shrink-0 items-center gap-1">
                        {log.status === 'completed' && (log.storage_path || log.dropbox_url) && (
                          <Button
                            variant="default"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => log.storage_path ? handleDirectDownload(log) : handleDropboxDownload(log)}
                            disabled={isDownloadingId === log.id}
                            title="Download backup"
                            aria-label={`Download ${fileName}`}
                          >
                            {isDownloadingId === log.id ? (
                              <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                            ) : <Download className="h-4 w-4" />}
                          </Button>
                        )}
                        {log.dropbox_url && (
                          <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => handleDropboxOpen(log.dropbox_url)} title="View on Dropbox" aria-label={`View ${fileName} on Dropbox`}>
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                        )}
                        <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => handleDelete(log.id)} disabled={isDeletingId === log.id} title="Delete log" aria-label={`Delete ${fileName} log`}>
                          {isDeletingId === log.id ? (
                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                          ) : <Trash2 className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>
                    <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 pl-6 text-xs text-muted-foreground">
                      {getStatusBadge(deriveStatus(log))}
                      <span>{log.record_count.toLocaleString()} records</span>
                      <span>{formatFileSize(log.file_size)}</span>
                      <span>{formatDate(log.created_at)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
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
