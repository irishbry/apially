import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  HardDrive
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { BackupLogsService, BackupLog } from "@/services/BackupLogsService";
import { useAuth } from "@/hooks/useAuth";

const BackupLogs: React.FC = () => {
  const [logs, setLogs] = useState<BackupLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeletingId, setIsDeletingId] = useState<string | null>(null);
  const [isDownloadingId, setIsDownloadingId] = useState<string | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      loadBackupLogs();
      
      // Subscribe to real-time updates
      const unsubscribe = BackupLogsService.subscribeToBackupLogs((updatedLogs) => {
        setLogs(updatedLogs);
      });

      return unsubscribe;
    }
  }, [user]);

  const loadBackupLogs = async () => {
    try {
      setIsLoading(true);
      const backupLogs = await BackupLogsService.getBackupLogs();
      setLogs(backupLogs);
    } catch (error) {
      console.error('Error loading backup logs:', error);
      toast({
        title: "Error",
        description: "Failed to load backup logs",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
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
      await loadBackupLogs();
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
        // Create a temporary link element to trigger download
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.download = log.file_name;
        link.style.display = 'none';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        toast({
          title: "Success",
          description: "Download started",
        });
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
      const directUrl = log.dropbox_url.replace('?dl=0', '?dl=1');
      
      // Fetch the file and create a blob for download
      const response = await fetch(directUrl);
      if (!response.ok) {
        throw new Error('Failed to fetch file from Dropbox');
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      
      // Create a temporary link element to trigger download
      const link = document.createElement('a');
      link.href = url;
      link.download = log.file_name;
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Clean up the object URL
      window.URL.revokeObjectURL(url);
      
      toast({
        title: "Success",
        description: "Download started from Dropbox",
      });
    } catch (error) {
      console.error('Error downloading from Dropbox:', error);
      toast({
        title: "Error",
        description: "Failed to download from Dropbox. Opening in browser instead.",
        variant: "destructive",
      });
      // Fallback to opening in new tab
      window.open(log.dropbox_url, '_blank');
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
      processing: 'secondary'
    } as const;

    return (
      <Badge variant={variants[status as keyof typeof variants] || 'secondary'}>
        {status}
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
    <Card className="w-full max-w-6xl mx-auto">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-3 text-lg">
          <Database className="h-5 w-5 text-primary" />
          Backup Logs
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
            <div className="flex items-center justify-between text-sm text-slate-600">
              <span>{logs.length} backup log{logs.length !== 1 ? 's' : ''} found</span>
            </div>

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
                {logs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(log.status)}
                        {getStatusBadge(log.status)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <HardDrive className="h-4 w-4 text-slate-400" />
                        <span className="font-medium">{log.file_name}</span>
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
                              >
                                {isDownloadingId === log.id ? (
                                  <div className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-1" />
                                ) : (
                                  <Download className="h-4 w-4 mr-1" />
                                )}
                                Download
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
                                >
                                  {isDownloadingId === log.id ? (
                                    <div className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-1" />
                                  ) : (
                                    <Download className="h-4 w-4 mr-1" />
                                  )}
                                  Dropbox
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleDropboxOpen(log.dropbox_url!)}
                                >
                                  <ExternalLink className="h-4 w-4 mr-1" />
                                  View
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
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default BackupLogs;
