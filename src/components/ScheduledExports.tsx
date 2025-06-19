
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Calendar, Mail, Download, Plus, Trash2, Edit, Clock, Play, Pause } from 'lucide-react';
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
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Scheduled Exports
        </CardTitle>
        <div className="flex justify-between items-start">
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              Automatically export your data on a schedule
            </p>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-semibold text-blue-900 mb-2">About Scheduled Exports</h4>
              <p className="text-sm text-blue-800">
                Scheduled exports allow you to automatically export your data on a regular basis. 
                You can choose between CSV and JSON formats, and have the exports emailed to you 
                or automatically downloaded.
              </p>
            </div>
          </div>
          <Button 
            onClick={() => setShowForm(!showForm)} 
            size="sm"
            variant={showForm ? "outline" : "default"}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            {showForm ? 'Cancel' : 'Add Export'}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {showForm && (
          <div className="border rounded-lg p-6 bg-muted/20">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium">
                {editingExport ? 'Edit Export' : 'Create New Export'}
              </h3>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Export Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., Weekly Sales Report"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="frequency">Frequency</Label>
                  <Select
                    value={formData.frequency}
                    onValueChange={(value: 'daily' | 'weekly' | 'monthly') => 
                      setFormData({ ...formData, frequency: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
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
                    value={formData.format}
                    onValueChange={(value: 'csv' | 'json') => 
                      setFormData({ ...formData, format: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="csv">CSV</SelectItem>
                      <SelectItem value="json">JSON</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="delivery">Delivery Method</Label>
                  <Select
                    value={formData.delivery}
                    onValueChange={(value: 'email' | 'download') => 
                      setFormData({ ...formData, delivery: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="email">Email</SelectItem>
                      <SelectItem value="download">Download Link</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              {formData.delivery === 'email' && (
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="user@example.com"
                    required={formData.delivery === 'email'}
                  />
                </div>
              )}
              
              <div className="flex gap-2 pt-2">
                <Button type="submit" className="flex-1">
                  {editingExport ? 'Update Export' : 'Create Export'}
                </Button>
                <Button type="button" variant="outline" onClick={cancelForm}>
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        )}

        {exports.length === 0 ? (
          <div className="text-center py-12">
            <Calendar className="h-16 w-16 mx-auto mb-4 text-muted-foreground/50" />
            <h3 className="text-lg font-medium mb-2">No scheduled exports yet</h3>
            <p className="text-muted-foreground mb-4">
              Create your first automated data export to get started
            </p>
            <Button onClick={() => setShowForm(true)} variant="outline">
              <Plus className="h-4 w-4 mr-2" />
              Create Export
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {exports.map((exportItem) => (
              <div key={exportItem.id} className="border rounded-lg p-4 hover:bg-muted/20 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-3">
                      <h3 className="font-medium text-lg">{exportItem.name}</h3>
                      <Badge variant={exportItem.active ? "default" : "secondary"}>
                        {exportItem.active ? 'Active' : 'Paused'}
                      </Badge>
                      <Badge variant="outline" className="capitalize">
                        {exportItem.frequency}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center gap-6 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {exportItem.format.toUpperCase()} format
                      </span>
                      <span className="flex items-center gap-1">
                        {exportItem.delivery === 'email' ? (
                          <>
                            <Mail className="h-4 w-4" />
                            {exportItem.email}
                          </>
                        ) : (
                          <>
                            <Download className="h-4 w-4" />
                            Download link
                          </>
                        )}
                      </span>
                    </div>
                    
                    {exportItem.next_export && (
                      <p className="text-sm text-muted-foreground">
                        Next export: {new Date(exportItem.next_export).toLocaleString()}
                      </p>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2 ml-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => editExport(exportItem)}
                      className="flex items-center gap-1"
                    >
                      <Edit className="h-4 w-4" />
                      Edit
                    </Button>
                    <Button
                      variant={exportItem.active ? "outline" : "default"}
                      size="sm"
                      onClick={() => toggleActive(exportItem)}
                      className="flex items-center gap-1"
                    >
                      {exportItem.active ? (
                        <>
                          <Pause className="h-4 w-4" />
                          Pause
                        </>
                      ) : (
                        <>
                          <Play className="h-4 w-4" />
                          Resume
                        </>
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => deleteExport(exportItem.id)}
                      className="text-destructive hover:text-destructive flex items-center gap-1"
                    >
                      <Trash2 className="h-4 w-4" />
                      Delete
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ScheduledExports;
