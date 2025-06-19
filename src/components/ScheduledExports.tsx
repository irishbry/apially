
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Calendar, Mail, Download, Trash2, Edit, Play, Pause } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Tables } from '@/integrations/supabase/types';

// Use the database type directly
type ScheduledExport = Tables<'scheduled_exports'>;

type FormDataType = {
  name: string;
  frequency: 'daily' | 'weekly' | 'monthly';
  format: 'csv' | 'json';
  delivery: 'email' | 'download';
  email: string;
};

const ScheduledExports = () => {
  const [exports, setExports] = useState<ScheduledExport[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingExport, setEditingExport] = useState<ScheduledExport | null>(null);
  const { toast } = useToast();

  const [formData, setFormData] = useState<FormDataType>({
    name: '',
    frequency: 'daily',
    format: 'csv',
    delivery: 'email',
    email: ''
  });

  useEffect(() => {
    fetchExports();
  }, []);

  const fetchExports = async () => {
    try {
      const { data, error } = await supabase
        .from('scheduled_exports')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setExports(data || []);
    } catch (error) {
      console.error('Error fetching scheduled exports:', error);
      toast({
        title: "Error",
        description: "Failed to fetch scheduled exports",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const exportData = {
        ...formData,
        user_id: user.id,
        next_export: calculateNextExport(formData.frequency)
      };

      if (editingExport) {
        const { error } = await supabase
          .from('scheduled_exports')
          .update(exportData)
          .eq('id', editingExport.id);
        
        if (error) throw error;
        
        toast({
          title: "Success",
          description: "Scheduled export updated successfully",
        });
      } else {
        const { error } = await supabase
          .from('scheduled_exports')
          .insert([exportData]);
        
        if (error) throw error;
        
        toast({
          title: "Success",
          description: "Scheduled export created successfully",
        });
      }

      setShowForm(false);
      setEditingExport(null);
      setFormData({
        name: '',
        frequency: 'daily',
        format: 'csv',
        delivery: 'email',
        email: ''
      });
      fetchExports();
    } catch (error) {
      console.error('Error saving scheduled export:', error);
      toast({
        title: "Error",
        description: "Failed to save scheduled export",
        variant: "destructive",
      });
    }
  };

  const calculateNextExport = (frequency: string): string => {
    const now = new Date();
    const next = new Date(now);
    
    switch (frequency) {
      case 'daily':
        next.setDate(next.getDate() + 1);
        break;
      case 'weekly':
        next.setDate(next.getDate() + 7);
        break;
      case 'monthly':
        next.setMonth(next.getMonth() + 1);
        break;
    }
    
    // Set to 8 AM
    next.setHours(8, 0, 0, 0);
    return next.toISOString();
  };

  const deleteExport = async (id: string) => {
    try {
      const { error } = await supabase
        .from('scheduled_exports')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      toast({
        title: "Success",
        description: "Scheduled export deleted successfully",
      });
      
      fetchExports();
    } catch (error) {
      console.error('Error deleting scheduled export:', error);
      toast({
        title: "Error",
        description: "Failed to delete scheduled export",
        variant: "destructive",
      });
    }
  };

  const toggleActive = async (exportItem: ScheduledExport) => {
    try {
      const { error } = await supabase
        .from('scheduled_exports')
        .update({ active: !exportItem.active })
        .eq('id', exportItem.id);
      
      if (error) throw error;
      
      toast({
        title: "Success",
        description: `Export ${exportItem.active ? 'paused' : 'resumed'} successfully`,
      });
      
      fetchExports();
    } catch (error) {
      console.error('Error toggling export status:', error);
      toast({
        title: "Error",
        description: "Failed to update export status",
        variant: "destructive",
      });
    }
  };

  const editExport = (exportItem: ScheduledExport) => {
    setEditingExport(exportItem);
    setFormData({
      name: exportItem.name,
      frequency: exportItem.frequency as 'daily' | 'weekly' | 'monthly',
      format: exportItem.format as 'csv' | 'json',
      delivery: exportItem.delivery as 'email' | 'download',
      email: exportItem.email || ''
    });
    setShowForm(true);
  };

  const cancelForm = () => {
    setShowForm(false);
    setEditingExport(null);
    setFormData({
      name: '',
      frequency: 'daily',
      format: 'csv',
      delivery: 'email',
      email: ''
    });
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Scheduled Exports
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Calendar className="h-4 w-4" />
          Scheduled Exports
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Configure automatic data exports on a schedule
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Left Column - New Scheduled Export Form */}
          <div className="space-y-3">
            <div className="border rounded-lg p-4 h-full flex flex-col">
              <h3 className="text-sm font-medium mb-3">New Scheduled Export</h3>
              
              <form onSubmit={handleSubmit} className="space-y-3 flex-1 flex flex-col">
                <div className="space-y-1">
                  <Label htmlFor="name" className="text-sm">Export Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Weekly Backup"
                    required
                    className="h-8 text-sm"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label htmlFor="frequency" className="text-sm">Frequency</Label>
                    <Select
                      value={formData.frequency}
                      onValueChange={(value: 'daily' | 'weekly' | 'monthly') => 
                        setFormData({ ...formData, frequency: value })
                      }
                    >
                      <SelectTrigger className="h-8 text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="daily">Daily</SelectItem>
                        <SelectItem value="weekly">Weekly</SelectItem>
                        <SelectItem value="monthly">Monthly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="format" className="text-sm">Format</Label>
                    <Select
                      value={formData.format}
                      onValueChange={(value: 'csv' | 'json') => 
                        setFormData({ ...formData, format: value })
                      }
                    >
                      <SelectTrigger className="h-8 text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="csv">CSV</SelectItem>
                        <SelectItem value="json">JSON</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-1">
                  <Label htmlFor="delivery" className="text-sm">Delivery Method</Label>
                  <Select
                    value={formData.delivery}
                    onValueChange={(value: 'email' | 'download') => 
                      setFormData({ ...formData, delivery: value })
                    }
                  >
                    <SelectTrigger className="h-8 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="email">Email</SelectItem>
                      <SelectItem value="download">Download Link</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                {formData.delivery === 'email' && (
                  <div className="space-y-1">
                    <Label htmlFor="email" className="text-sm">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="your.email@example.com"
                      required={formData.delivery === 'email'}
                      className="h-8 text-sm"
                    />
                  </div>
                )}
                
                <div className="mt-auto">
                  <Button type="submit" className="w-full h-8 text-sm">
                    Schedule Export
                  </Button>
                </div>
              </form>
            </div>
          </div>

          {/* Right Column - About Scheduled Exports */}
          <div className="space-y-3">
            <div className="border rounded-lg p-4 h-full flex flex-col">
              <h3 className="text-sm font-medium mb-3">About Scheduled Exports</h3>
              <div className="flex-1 flex flex-col justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-3">
                    Scheduled exports allow you to automatically export your data on a regular basis. 
                    You can choose between CSV and JSON formats, and have the exports emailed to you 
                    or automatically downloaded.
                  </p>
                  
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <span>• Daily, weekly, or monthly schedules</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <span>• Email delivery to any address</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <span>• Automated background processing</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Your Scheduled Exports Section */}
        <div className="space-y-1">
          <h3 className="text-sm font-medium">Your Scheduled Exports</h3>
          
          {exports.length === 0 ? (
            <div className="text-center py-4 border rounded-lg">
              <h4 className="text-sm font-medium mb-1">No scheduled exports yet</h4>
              <p className="text-muted-foreground text-sm">
                Create your first automated data export to get started
              </p>
            </div>
          ) : (
            <div className="space-y-1">
              {exports.map((exportItem) => (
                <div key={exportItem.id} className="border rounded-lg p-2 hover:bg-muted/20 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium text-sm">{exportItem.name}</h4>
                        <Badge variant={exportItem.active ? "default" : "secondary"} className="text-xs px-1 py-0 h-4">
                          {exportItem.active ? 'Active' : 'Paused'}
                        </Badge>
                        <Badge variant="outline" className="capitalize text-xs px-1 py-0 h-4">
                          {exportItem.frequency}
                        </Badge>
                      </div>
                      
                      <div className="flex items-center gap-3 text-sm text-muted-foreground">
                        <span>{exportItem.format.toUpperCase()}</span>
                        <span className="flex items-center gap-1">
                          {exportItem.delivery === 'email' ? (
                            <>
                              <Mail className="h-3 w-3" />
                              {exportItem.email}
                            </>
                          ) : (
                            <>
                              <Download className="h-3 w-3" />
                              Download
                            </>
                          )}
                        </span>
                      </div>
                      
                      {exportItem.next_export && (
                        <p className="text-sm text-muted-foreground">
                          Next: {new Date(exportItem.next_export).toLocaleString()}
                        </p>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-1 ml-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => editExport(exportItem)}
                        className="h-6 px-2 text-xs"
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                      <Button
                        variant={exportItem.active ? "outline" : "default"}
                        size="sm"
                        onClick={() => toggleActive(exportItem)}
                        className="h-6 px-2 text-xs"
                      >
                        {exportItem.active ? (
                          <Pause className="h-3 w-3" />
                        ) : (
                          <Play className="h-3 w-3" />
                        )}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => deleteExport(exportItem.id)}
                        className="text-destructive hover:text-destructive h-6 px-2 text-xs"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
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
