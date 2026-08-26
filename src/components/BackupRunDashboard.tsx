import React, { useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertTriangle, CheckCircle2, ChevronDown, ChevronUp, Clock, Database, Loader2, XCircle } from "lucide-react";
import { BackupLog, BackupSource } from "@/services/BackupLogsService";
import { deriveStatus, statusLabel, DerivedStatus } from "@/components/BackupRunProgress";
import DropboxErrorHint from "@/components/DropboxErrorHint";
import { diagnoseDropboxError } from "@/utils/dropboxErrors";

interface Props {
  logs: BackupLog[];
  sources: BackupSource[];
  extractSourceName: (fileName: string | null) => string;
}

const pstDay = (iso: string) =>
  new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Los_Angeles',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date(iso));

const formatDuration = (log: BackupLog) => {
  const start = new Date(log.created_at).getTime();
  const end = new Date(log.updated_at || log.created_at).getTime();
  const seconds = Math.max(0, Math.round((end - start) / 1000));
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  return `${minutes}m ${seconds % 60}s`;
};

const formatTime = (iso: string) =>
  new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Los_Angeles',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(iso));

const errorCause = (status: DerivedStatus, log?: BackupLog) => {
  if (!log) return 'No backup record — the run ended before this source started.';
  if (log.error_message) return log.error_message;
  if (status === 'timed_out') return 'No progress update for over 10 minutes — the job stopped mid-upload.';
  if (status === 'failed') return 'Backup failed without a reported reason.';
  if (status === 'processing') return 'Still running.';
  return '—';
};

const statusIcon = (status: DerivedStatus) => {
  if (status === 'completed') return <CheckCircle2 className="h-4 w-4 text-green-600" />;
  if (status === 'processing') return <Loader2 className="h-4 w-4 animate-spin text-yellow-600" />;
  if (status === 'timed_out') return <AlertTriangle className="h-4 w-4 text-destructive" />;
  return <XCircle className="h-4 w-4 text-destructive" />;
};

/**
 * Historical view of backup runs (grouped by PST day) with per-source
 * status, rows processed, duration and error cause.
 */
const BackupRunDashboard: React.FC<Props> = ({ logs, sources, extractSourceName }) => {
  const [open, setOpen] = useState(false);
  const [selectedDay, setSelectedDay] = useState<string | null>(null);

  const { days, rowsByDay } = useMemo(() => {
    const activeSources = sources.filter((s) => s.active && !s.is_partner);
    const byDay = new Map<string, Map<string, BackupLog>>();

    logs.forEach((log) => {
      const day = pstDay(log.created_at);
      const source = sources.find((s) => s.id === log.source_id);
      const name = source?.name ?? extractSourceName(log.file_name);
      if (!byDay.has(day)) byDay.set(day, new Map());
      const existing = byDay.get(day)!.get(name);
      // keep the newest attempt per source per day
      if (!existing || new Date(log.created_at).getTime() > new Date(existing.created_at).getTime()) {
        byDay.get(day)!.set(name, log);
      }
    });

    const days = Array.from(byDay.keys()).sort((a, b) => b.localeCompare(a)).slice(0, 14);

    const rowsByDay = new Map(
      days.map((day) => {
        const map = byDay.get(day)!;
        const names = new Set<string>([...map.keys(), ...activeSources.map((s) => s.name)]);
        const rows = Array.from(names)
          .map((name) => {
            const log = map.get(name);
            const status: DerivedStatus = log ? deriveStatus(log) : 'failed';
            return { name, log, status, cause: errorCause(status, log) };
          })
          .sort((a, b) => a.name.localeCompare(b.name));
        return [day, rows] as const;
      }),
    );

    return { days, rowsByDay };
  }, [logs, sources, extractSourceName]);

  if (days.length === 0) return null;

  const activeDay = selectedDay && rowsByDay.has(selectedDay) ? selectedDay : days[0];
  const rows = rowsByDay.get(activeDay) ?? [];
  const totals = rows.reduce(
    (acc, row) => {
      acc[row.status] += 1;
      acc.records += row.log?.record_count ?? 0;
      return acc;
    },
    { completed: 0, failed: 0, processing: 0, timed_out: 0, records: 0 },
  );

  return (
    <Card className="w-full max-w-6xl mx-auto">
      <Collapsible open={open} onOpenChange={setOpen}>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <CardTitle className="flex items-center gap-3 text-lg">
                <Database className="h-5 w-5 text-primary" />
                Backup Run Dashboard
              </CardTitle>
              <CardDescription>
                Status, rows processed, duration and error cause per source for each run day (PST)
              </CardDescription>
            </div>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm" className="shrink-0 gap-1">
                {open ? <>Minimize <ChevronUp className="h-4 w-4" /></> : <>Show <ChevronDown className="h-4 w-4" /></>}
              </Button>
            </CollapsibleTrigger>
          </div>
        </CardHeader>

        <CollapsibleContent>
          <CardContent className="space-y-4">
            <Tabs value={activeDay} onValueChange={setSelectedDay}>
              <TabsList className="flex-wrap h-auto gap-1">
                {days.map((day) => (
                  <TabsTrigger key={day} value={day}>{day}</TabsTrigger>
                ))}
              </TabsList>
            </Tabs>

            <div className="flex flex-wrap items-center gap-2 text-sm">
              <Badge variant="default" className="gap-1">
                <CheckCircle2 className="h-3 w-3" /> {totals.completed} completed
              </Badge>
              {totals.processing > 0 && (
                <Badge variant="secondary" className="gap-1">
                  <Loader2 className="h-3 w-3 animate-spin" /> {totals.processing} running
                </Badge>
              )}
              {totals.timed_out > 0 && (
                <Badge variant="destructive" className="gap-1">
                  <AlertTriangle className="h-3 w-3" /> {totals.timed_out} timed out
                </Badge>
              )}
              {totals.failed > 0 && (
                <Badge variant="destructive" className="gap-1">
                  <XCircle className="h-3 w-3" /> {totals.failed} failed
                </Badge>
              )}
              <span className="text-muted-foreground flex items-center gap-1">
                <Clock className="h-3 w-3" /> {totals.records.toLocaleString()} rows processed
              </span>
            </div>

            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Source</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Rows</TableHead>
                    <TableHead>Started</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Error cause</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map(({ name, log, status, cause }) => (
                    <TableRow key={name}>
                      <TableCell className="font-medium">{name}</TableCell>
                      <TableCell>
                        <span className="flex items-center gap-2">
                          {statusIcon(status)} {statusLabel[status]}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">{(log?.record_count ?? 0).toLocaleString()}</TableCell>
                      <TableCell>{log ? formatTime(log.created_at) : '—'}</TableCell>
                      <TableCell>{log ? formatDuration(log) : '—'}</TableCell>
                      <TableCell className={status === 'completed' ? 'text-muted-foreground' : 'text-destructive'}>
                        {diagnoseDropboxError(cause) ? (
                          <DropboxErrorHint message={cause} className="max-w-lg" />
                        ) : (
                          cause
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
};

export default BackupRunDashboard;
