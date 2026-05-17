import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { AlertTriangle, CheckCircle, Clock, XCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface BackupAttempt {
  id: string;
  user_id: string;
  attempt_date: string;
  status: string;
  error_message?: string;
  created_at: string;
}

const ADMIN_EMAILS = ['bryan@rvnu.com'];

const BackupAttempts = () => {
  const { user } = useAuth();
  const isAdmin = !!user?.email && ADMIN_EMAILS.includes(user.email);
  const [attempts, setAttempts] = useState<BackupAttempt[]>([]);
  const [emailMap, setEmailMap] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('today');

  useEffect(() => {
    fetchAttempts();
  }, []);

  useEffect(() => {
    if (isAdmin && attempts.length > 0 && Object.keys(emailMap).length === 0) {
      fetchEmails();
    }
  }, [isAdmin, attempts]);

  const fetchAttempts = async () => {
    try {
      const { data, error } = await supabase
        .from('backup_attempts')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(200);
      if (error) console.error('Error fetching backup attempts:', error);
      else setAttempts(data || []);
    } catch (error) {
      console.error('Error fetching backup attempts:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchEmails = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('admin-data', { body: {} });
      if (error || !data?.users) return;
      const map: Record<string, string> = {};
      for (const u of data.users) map[u.user_id] = u.email;
      setEmailMap(map);
    } catch (e) {
      console.error('Error fetching user emails:', e);
    }
  };

  const userLabel = (uid: string) =>
    emailMap[uid] || (isAdmin ? `${uid.slice(0, 8)}…` : `User ${uid.slice(0, 8)}…`);

  const summary = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    const last7Days = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const todayAttempts = attempts.filter((a) => a.attempt_date === today);
    const weekAttempts = attempts.filter((a) => a.attempt_date >= last7Days);
    const weekSuccess = weekAttempts.filter((a) => a.status === 'success').length;
    const weekFailed = weekAttempts.filter((a) => a.status !== 'success' && a.status !== 'attempting').length;
    const stuck = attempts.filter((a) => a.status === 'attempting');
    const successRate = Math.round((weekSuccess / (weekSuccess + weekFailed) * 100) || 0);
    return { today: todayAttempts, week: weekAttempts, weekSuccess, weekFailed, stuck, successRate };
  }, [attempts]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'success':
        return <Badge className="bg-green-500 hover:bg-green-600"><CheckCircle className="w-3 h-3 mr-1" />Success</Badge>;
      case 'failed':
        return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />Failed</Badge>;
      case 'token_expired':
        return <Badge className="bg-yellow-500 hover:bg-yellow-600 text-white"><AlertTriangle className="w-3 h-3 mr-1" />Token Expired</Badge>;
      case 'config_missing':
        return <Badge variant="secondary"><AlertTriangle className="w-3 h-3 mr-1" />Config Missing</Badge>;
      case 'attempting':
        return <Badge variant="outline"><Clock className="w-3 h-3 mr-1" />In Progress</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const renderTable = (rows: BackupAttempt[], showUser = false) => {
    if (rows.length === 0) {
      return <div className="text-center py-6 text-sm text-muted-foreground">No records to show.</div>;
    }
    return (
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Status</TableHead>
              {showUser && <TableHead>User</TableHead>}
              <TableHead>Time</TableHead>
              <TableHead>Error Message</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((a) => (
              <TableRow key={a.id}>
                <TableCell>{new Date(a.attempt_date).toLocaleDateString()}</TableCell>
                <TableCell>{getStatusBadge(a.status)}</TableCell>
                {showUser && <TableCell className="font-mono text-xs">{userLabel(a.user_id)}</TableCell>}
                <TableCell>{new Date(a.created_at).toLocaleTimeString()}</TableCell>
                <TableCell className="max-w-xs">
                  {a.error_message ? (
                    <span className="text-sm text-muted-foreground truncate block">{a.error_message}</span>
                  ) : (
                    <span className="text-muted-foreground">-</span>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Backup Attempts</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <Collapsible open={open} onOpenChange={setOpen}>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-muted/40 transition-colors">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Backup Attempts Monitor
                {summary.stuck.length > 0 && (
                  <Badge variant="outline" className="ml-2">
                    {summary.stuck.length} stuck
                  </Badge>
                )}
              </CardTitle>
              <Button variant="ghost" size="sm" className="gap-1">
                {open ? <>Hide <ChevronUp className="w-4 h-4" /></> : <>Show <ChevronDown className="w-4 h-4" /></>}
              </Button>
            </div>
          </CardHeader>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid grid-cols-4 w-full md:w-auto">
                <TabsTrigger value="today">Today ({summary.today.length})</TabsTrigger>
                <TabsTrigger value="success">Week Successful ({summary.weekSuccess})</TabsTrigger>
                <TabsTrigger value="failed">Week Failed ({summary.weekFailed})</TabsTrigger>
                <TabsTrigger value="stuck">Stuck ({summary.stuck.length})</TabsTrigger>
              </TabsList>

              <TabsContent value="today" className="mt-4">
                <div className="mb-3 text-sm text-muted-foreground">
                  Success rate this week: <span className="font-semibold text-foreground">{summary.successRate}%</span>
                </div>
                {renderTable(summary.today, isAdmin)}
              </TabsContent>

              <TabsContent value="success" className="mt-4">
                {renderTable(summary.week.filter((a) => a.status === 'success'), isAdmin)}
              </TabsContent>

              <TabsContent value="failed" className="mt-4">
                {renderTable(
                  summary.week.filter((a) => a.status !== 'success' && a.status !== 'attempting'),
                  isAdmin
                )}
              </TabsContent>

              <TabsContent value="stuck" className="mt-4">
                {renderTable(summary.stuck, true)}
              </TabsContent>
            </Tabs>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
};

export default BackupAttempts;
