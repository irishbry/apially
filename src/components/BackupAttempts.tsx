import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertTriangle, CheckCircle, Clock, XCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface BackupAttempt {
  id: string;
  user_id: string;
  attempt_date: string;
  status: string;
  error_message?: string;
  created_at: string;
}

const BackupAttempts = () => {
  const [attempts, setAttempts] = useState<BackupAttempt[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAttempts();
  }, []);

  const fetchAttempts = async () => {
    try {
      const { data, error } = await supabase
        .from('backup_attempts')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) {
        console.error('Error fetching backup attempts:', error);
      } else {
        setAttempts(data || []);
      }
    } catch (error) {
      console.error('Error fetching backup attempts:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'success':
        return <Badge variant="default" className="bg-green-500 hover:bg-green-600">
          <CheckCircle className="w-3 h-3 mr-1" />
          Success
        </Badge>;
      case 'failed':
        return <Badge variant="destructive">
          <XCircle className="w-3 h-3 mr-1" />
          Failed
        </Badge>;
      case 'token_expired':
        return <Badge variant="secondary" className="bg-yellow-500 hover:bg-yellow-600 text-white">
          <AlertTriangle className="w-3 h-3 mr-1" />
          Token Expired
        </Badge>;
      case 'config_missing':
        return <Badge variant="secondary">
          <AlertTriangle className="w-3 h-3 mr-1" />
          Config Missing
        </Badge>;
      case 'attempting':
        return <Badge variant="outline">
          <Clock className="w-3 h-3 mr-1" />
          In Progress
        </Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getStatusSummary = () => {
    const today = new Date().toISOString().split('T')[0];
    const last7Days = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    
    const todayAttempts = attempts.filter(a => a.attempt_date === today);
    const weekAttempts = attempts.filter(a => a.attempt_date >= last7Days);
    
    const todaySuccess = todayAttempts.filter(a => a.status === 'success').length;
    const weekSuccess = weekAttempts.filter(a => a.status === 'success').length;
    const weekFailed = weekAttempts.filter(a => a.status !== 'success').length;
    
    return { todayAttempts: todayAttempts.length, todaySuccess, weekSuccess, weekFailed };
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Backup Attempts</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const summary = getStatusSummary();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="w-5 h-5" />
          Backup Attempts Monitor
        </CardTitle>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div className="text-center p-3 rounded-lg bg-muted">
            <div className="font-semibold text-lg">{summary.todayAttempts}</div>
            <div className="text-muted-foreground">Today's Attempts</div>
          </div>
          <div className="text-center p-3 rounded-lg bg-green-50 dark:bg-green-950">
            <div className="font-semibold text-lg text-green-600 dark:text-green-400">{summary.weekSuccess}</div>
            <div className="text-muted-foreground">Week Successful</div>
          </div>
          <div className="text-center p-3 rounded-lg bg-red-50 dark:bg-red-950">
            <div className="font-semibold text-lg text-red-600 dark:text-red-400">{summary.weekFailed}</div>
            <div className="text-muted-foreground">Week Failed</div>
          </div>
          <div className="text-center p-3 rounded-lg bg-blue-50 dark:bg-blue-950">
            <div className="font-semibold text-lg text-blue-600 dark:text-blue-400">
              {Math.round((summary.weekSuccess / (summary.weekSuccess + summary.weekFailed) * 100) || 0)}%
            </div>
            <div className="text-muted-foreground">Success Rate</div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {attempts.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No backup attempts recorded yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Time</TableHead>
                  <TableHead>Error Message</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {attempts.map((attempt) => (
                  <TableRow key={attempt.id}>
                    <TableCell>
                      {new Date(attempt.attempt_date).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(attempt.status)}
                    </TableCell>
                    <TableCell>
                      {new Date(attempt.created_at).toLocaleTimeString()}
                    </TableCell>
                    <TableCell className="max-w-xs">
                      {attempt.error_message ? (
                        <span className="text-sm text-muted-foreground truncate block">
                          {attempt.error_message}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
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

export default BackupAttempts;