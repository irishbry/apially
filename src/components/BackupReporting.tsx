import { useCallback, useEffect, useState } from 'react';
import BackupAttempts from '@/components/BackupAttempts';
import BackupRunProgress from '@/components/BackupRunProgress';
import BackupRunDashboard from '@/components/BackupRunDashboard';
import { BackupLogsService, type BackupLog, type BackupSource } from '@/services/BackupLogsService';
import { useAuth } from '@/hooks/useAuth';

const BackupReporting = () => {
  const { user } = useAuth();
  const [logs, setLogs] = useState<BackupLog[]>([]);
  const [sources, setSources] = useState<BackupSource[]>([]);

  useEffect(() => {
    if (!user) return;
    let active = true;
    BackupLogsService.getBackupLogs().then((items) => {
      if (active) setLogs(items);
    }).catch((error) => console.error('Error loading backup reporting logs:', error));
    BackupLogsService.getBackupSources().then((items) => {
      if (active) setSources(items);
    }).catch((error) => console.error('Error loading backup reporting sources:', error));

    const unsubscribe = BackupLogsService.subscribeToBackupLogs((items) => {
      if (active) setLogs(items);
    });
    return () => {
      active = false;
      unsubscribe();
    };
  }, [user]);

  const extractSourceName = useCallback((fileName: string | null) => {
    if (!fileName) return 'Unknown';
    const match = fileName.match(/(?:manual_)?backup_\d{4}-\d{2}-\d{2}_(.+)\.\w+$/);
    if (!match) return 'Unknown';
    const parsed = match[1].replace(/_/g, ' ');
    const normalize = (name: string) => name.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
    return sources.find((source) => normalize(source.name) === normalize(parsed))?.name ?? parsed;
  }, [sources]);

  return (
    <div className="space-y-6">
      <BackupAttempts />
      <BackupRunProgress logs={logs} sources={sources} extractSourceName={extractSourceName} />
      <BackupRunDashboard logs={logs} sources={sources} extractSourceName={extractSourceName} />
    </div>
  );
};

export default BackupReporting;