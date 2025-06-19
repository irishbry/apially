
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { CalendarIcon, Clock, Mail, Download, Trash, AlertCircle } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";
import { ApiService, DataEntry } from '@/services/ApiService';
import { getFormattedDateTime } from '@/utils/csvUtils';

interface ScheduledExport {
  id: string;
  name: string;
  frequency: 'daily' | 'weekly' | 'monthly';
  format: 'csv' | 'json';
  delivery: 'email' | 'download';
  email?: string;
  last_export?: string;
  next_export?: string;
  active: boolean;
  user_id: string;
}

const ScheduledExports: React.FC = () => {
  const [exports, setExports] = useState<ScheduledExport[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [newExport, setNewExport] = useState<Partial<ScheduledExport>>({
    frequency: 'daily',
    format: 'csv',
    delivery: 'email',
    active: true
  });
  
  const { toast } = useToast();

  // Load scheduled exports from Supabase
  const loadScheduledExports = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('scheduled_exports')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading scheduled exports:', error);
        toast({
          title: "Error",
          description: "Failed to load scheduled exports",
          variant: "destructive"
        });
        return;
      }

      setExports(data || []);
    } catch (error) {
      console.error('Error in loadScheduledExports:', error);
      toast({
        title: "Error",
        description: "Failed to load scheduled exports",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadScheduledExports();
  }, []);

  const addExport = async () => {
    if (!newExport.name) {
      toast({
        title: "Error",
        description: "Please enter a name for the export",
        variant: "destructive"
      });
      return;
    }

    if (newExport.delivery === 'email' && (!newExport.email || !newExport.email.includes('@'))) {
      toast({
        title: "Error",
        description: "Please enter a valid email address",
        variant: "destructive"
      });
      return;
    }

    try {
      setSaving(true);
      
      const now = new Date();
      let nextExport = new Date();
      
      if (newExport.frequency === 'daily') {
        nextExport.setDate(now.getDate() + 1);
        nextExport.setHours(8, 0, 0, 0);
      } else if (newExport.frequency === 'weekly') {
        nextExport.setDate(now.getDate() + (8 - now.getDay()) % 7 || 7);
        nextExport.setHours(8, 0, 0, 0);
      } else if (newExport.frequency === 'monthly') {
        nextExport.setMonth(now.getMonth() + 1);
        nextExport.setDate(1);
        nextExport.setHours(8, 0, 0, 0);
      }

      const { data, error } = await supabase
        .from('scheduled_exports')
        .insert([{
          name: newExport.name,
          frequency: newExport.frequency as 'daily' | 'weekly' | 'monthly',
          format: newExport.format as 'csv' | 'json',
          delivery: newExport.delivery as 'email' | 'download',
          email: newExport.email,
          next_export: nextExport.toISOString(),
          active: true
        }])
        .select()
        .single();

      if (error) {
        console.error('Error creating scheduled export:', error);
        toast({
          title: "Error",
          description: "Failed to create scheduled export",
          variant: "destructive"
        });
        return;
      }

      await loadScheduledExports();
      
      setNewExport({
        frequency: 'daily',
        format: 'csv',
        delivery: 'email',
        active: true
      });
      
      toast({
        title: "Export Scheduled",
        description: `Export "${data.name}" has been scheduled for ${new Date(data.next_export).toLocaleString()}`
      });
    } catch (error) {
      console.error('Error in addExport:', error);
      toast({
        title: "Error",
        description: "Failed to create scheduled export",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const deleteExport = async (id: string) => {
    try {
      const { error } = await supabase
        .from('scheduled_exports')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting scheduled export:', error);
        toast({
          title: "Error",
          description: "Failed to delete scheduled export",
          variant: "destructive"
        });
        return;
      }

      await loadScheduledExports();
      
      toast({
        title: "Export Deleted",
        description: "The scheduled export has been removed"
      });
    } catch (error) {
      console.error('Error in deleteExport:', error);
      toast({
        title: "Error",
        description: "Failed to delete scheduled export",
        variant: "destructive"
      });
    }
  };

  const toggleActive = async (id: string, currentActive: boolean) => {
    try {
      const { error } = await supabase
        .from('scheduled_exports')
        .update({ active: !currentActive })
        .eq('id', id);

      if (error) {
        console.error('Error updating scheduled export:', error);
        toast({
          title: "Error",
          description: "Failed to update scheduled export",
          variant: "destructive"
        });
        return;
      }

      await loadScheduledExports();
      
      const exportItem = exports.find(exp => exp.id === id);
      toast({
        title: !currentActive ? "Export Activated" : "Export Paused",
        description: !currentActive 
          ? `"${exportItem?.name}" will run as scheduled` 
          : `"${exportItem?.name}" has been paused`
      });
    } catch (error) {
      console.error('Error in toggleActive:', error);
      toast({
        title: "Error",
        description: "Failed to update scheduled export",
        variant: "destructive"
      });
    }
  };

  const runExportNow = async (export_: ScheduledExport) => {
    const timestamp = getFormattedDateTime();
    const fileName = `${export_.name.replace(/\s+/g, '_')}_${timestamp}`;
    
    if (export_.delivery === 'email' && export_.email) {
      toast({
        title: "Export Started",
        description: `Preparing to email ${export_.format.toUpperCase()} to ${export_.email}`
      });
      
      // Call the edge function to process this specific export
      try {
        const { error } = await supabase.functions.invoke('process-scheduled-exports', {
          body: { exportId: export_.id, runNow: true }
        });

        if (error) {
          console.error('Error running export:', error);
          toast({
            title: "Export Error",
            description: "Failed to run export",
            variant: "destructive"
          });
          return;
        }

        toast({
          title: "Export Processing",
          description: `Export is being processed and will be emailed to ${export_.email}`
        });
      } catch (error) {
        console.error('Error running export:', error);
        toast({
          title: "Export Error",
          description: "Failed to run export",
          variant: "destructive"
        });
      }
    } else {
      try {
        const data = await ApiService.getData();
        handleDownload(data, export_.format, fileName);
        
        // Update last export time
        await supabase
          .from('scheduled_exports')
          .update({ last_export: new Date().toISOString() })
          .eq('id', export_.id);
        
        await loadScheduledExports();
      } catch (error) {
        console.error("Error getting data for export:", error);
        toast({
          title: "Export Error",
          description: "Could not retrieve data for export",
          variant: "destructive"
        });
      }
    }
  };

  const handleDownload = (data: DataEntry[], format: 'csv' | 'json', fileName: string) => {
    if (format === 'csv') {
      ApiService.exportToCsv();
    } else {
      const jsonContent = JSON.stringify(data, null, 2);
      const blob = new Blob([jsonContent], { type: 'application/json' });
      
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      
      link.setAttribute('href', url);
      link.setAttribute('download', `${fileName}.json`);
      link.style.visibility = 'hidden';
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast({
        title: "Export Downloaded",
        description: `Your data has been exported as JSON`
      });
    }
  };

  const formatFrequency = (freq: string): string => {
    switch (freq) {
      case 'daily': return 'Daily';
      case 'weekly': return 'Weekly';
      case 'monthly': return 'Monthly';
      default: return freq;
    }
  };

  if (loading) {
    return (
      <Card className="w-full shadow-sm hover:shadow-md transition-all duration-300">
        <CardContent className="flex items-center justify-center p-8">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full shadow-sm hover:shadow-md transition-all duration-300">
      <CardHeader>
        <CardTitle className="text-xl font-medium">Scheduled Exports</CardTitle>
        <CardDescription>
          Configure automatic data exports on a schedule using cron jobs
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Scheduled exports now run automatically using cron jobs. Email exports require a valid Resend API key to be configured.
          </AlertDescription>
        </Alert>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4 border rounded-lg p-4">
            <h3 className="text-base font-medium">New Scheduled Export</h3>
            
            <div className="space-y-2">
              <Label htmlFor="export-name">Export Name</Label>
              <Input 
                id="export-name" 
                placeholder="Weekly Backup" 
                value={newExport.name || ''} 
                onChange={(e) => setNewExport({...newExport, name: e.target.value})}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="frequency">Frequency</Label>
                <Select 
                  value={newExport.frequency} 
                  onValueChange={(val: 'daily' | 'weekly' | 'monthly') => setNewExport({...newExport, frequency: val})}
                >
                  <SelectTrigger id="frequency">
                    <SelectValue placeholder="Frequency" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="format">Format</Label>
                <Select 
                  value={newExport.format} 
                  onValueChange={(val: 'csv' | 'json') => setNewExport({...newExport, format: val})}
                >
                  <SelectTrigger id="format">
                    <SelectValue placeholder="Format" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="csv">CSV</SelectItem>
                    <SelectItem value="json">JSON</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="delivery">Delivery Method</Label>
              <Select 
                value={newExport.delivery} 
                onValueChange={(val: 'email' | 'download') => setNewExport({...newExport, delivery: val})}
              >
                <SelectTrigger id="delivery">
                  <SelectValue placeholder="Delivery" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="download">Download</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {newExport.delivery === 'email' && (
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input 
                  id="email" 
                  type="email" 
                  placeholder="your.email@example.com" 
                  value={newExport.email || ''} 
                  onChange={(e) => setNewExport({...newExport, email: e.target.value})}
                />
              </div>
            )}
            
            <Button className="w-full" onClick={addExport} disabled={saving}>
              {saving ? 'Scheduling...' : 'Schedule Export'}
            </Button>
          </div>
          
          <div className="border rounded-lg p-4">
            <h3 className="text-base font-medium mb-2">About Automated Exports</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Scheduled exports now run automatically using Supabase cron jobs. 
              The system checks for due exports every hour and processes them in the background.
            </p>
            
            <div className="space-y-2">
              <div className="flex items-center">
                <CalendarIcon className="h-4 w-4 mr-2 text-primary" />
                <span className="text-sm">Automated scheduling with cron jobs</span>
              </div>
              
              <div className="flex items-center">
                <Mail className="h-4 w-4 mr-2 text-primary" />
                <span className="text-sm">Email delivery with attachments</span>
              </div>
              
              <div className="flex items-center">
                <Clock className="h-4 w-4 mr-2 text-primary" />
                <span className="text-sm">Reliable background processing</span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="space-y-4">
          <h3 className="text-base font-medium">Your Scheduled Exports</h3>
          
          {exports.length === 0 ? (
            <div className="text-center py-4 text-muted-foreground">
              <p>You haven't set up any scheduled exports yet.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {exports.map((exp) => (
                <div key={exp.id} className="flex items-center justify-between border rounded-md p-3">
                  <div className="flex-1">
                    <div className="font-medium">{exp.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {formatFrequency(exp.frequency)} • {exp.format.toUpperCase()} • 
                      {exp.delivery === 'email' ? ` Email to ${exp.email}` : ' Download'}
                    </div>
                    <div className="text-xs mt-1">
                      {exp.last_export && (
                        <span className="mr-3">Last: {new Date(exp.last_export).toLocaleString()}</span>
                      )}
                      {exp.next_export && exp.active && (
                        <span>Next: {new Date(exp.next_export).toLocaleString()}</span>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Switch 
                      checked={exp.active} 
                      onCheckedChange={() => toggleActive(exp.id, exp.active)} 
                      aria-label="Toggle activation"
                    />
                    <Button 
                      variant="outline" 
                      size="icon" 
                      onClick={() => runExportNow(exp)}
                      title="Run now"
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => deleteExport(exp.id)}
                      title="Delete"
                    >
                      <Trash className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ScheduledExports;
