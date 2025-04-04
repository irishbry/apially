import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { CalendarIcon, Clock, Mail, Download, Trash } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { getFormattedDateTime } from '@/utils/csvUtils';
import { ApiService, DataEntry } from '@/services/ApiService';

interface ScheduledExport {
  id: string;
  name: string;
  frequency: 'daily' | 'weekly' | 'monthly';
  format: 'csv' | 'json';
  delivery: 'email' | 'download';
  email?: string;
  lastExport?: string;
  nextExport?: string;
  active: boolean;
}

const ScheduledExports: React.FC = () => {
  const [exports, setExports] = useState<ScheduledExport[]>(() => {
    const saved = localStorage.getItem('scheduled-exports');
    return saved ? JSON.parse(saved) : [];
  });
  
  const [newExport, setNewExport] = useState<Partial<ScheduledExport>>({
    frequency: 'daily',
    format: 'csv',
    delivery: 'email',
    active: true
  });
  
  const { toast } = useToast();

  const saveExports = (updatedExports: ScheduledExport[]) => {
    localStorage.setItem('scheduled-exports', JSON.stringify(updatedExports));
    setExports(updatedExports);
  };

  const addExport = () => {
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

    const now = new Date();
    let nextExport = new Date();
    
    if (newExport.frequency === 'daily') {
      nextExport.setDate(now.getDate() + 1);
      nextExport.setHours(8, 0, 0, 0);
    } else if (newExport.frequency === 'weekly') {
      nextExport.setDate(now.getDate() + (8 - now.getDay()) % 7);
      nextExport.setHours(8, 0, 0, 0);
    } else if (newExport.frequency === 'monthly') {
      nextExport.setMonth(now.getMonth() + 1);
      nextExport.setDate(1);
      nextExport.setHours(8, 0, 0, 0);
    }
    
    const newScheduledExport: ScheduledExport = {
      id: Date.now().toString(),
      name: newExport.name || `Export ${exports.length + 1}`,
      frequency: newExport.frequency as 'daily' | 'weekly' | 'monthly',
      format: newExport.format as 'csv' | 'json',
      delivery: newExport.delivery as 'email' | 'download',
      email: newExport.email,
      nextExport: nextExport.toISOString(),
      active: true
    };
    
    const updatedExports = [...exports, newScheduledExport];
    saveExports(updatedExports);
    
    setNewExport({
      frequency: 'daily',
      format: 'csv',
      delivery: 'email',
      active: true
    });
    
    toast({
      title: "Export Scheduled",
      description: `Export "${newScheduledExport.name}" has been scheduled for ${new Date(newScheduledExport.nextExport).toLocaleString()}`
    });
  };

  const deleteExport = (id: string) => {
    const updatedExports = exports.filter(exp => exp.id !== id);
    saveExports(updatedExports);
    
    toast({
      title: "Export Deleted",
      description: "The scheduled export has been removed"
    });
  };

  const toggleActive = (id: string) => {
    const updatedExports = exports.map(exp => {
      if (exp.id === id) {
        return { ...exp, active: !exp.active };
      }
      return exp;
    });
    
    saveExports(updatedExports);
    
    const export_ = updatedExports.find(exp => exp.id === id);
    toast({
      title: export_?.active ? "Export Activated" : "Export Paused",
      description: export_?.active 
        ? `"${export_.name}" will run as scheduled` 
        : `"${export_.name}" has been paused`
    });
  };

  const runExportNow = (export_: ScheduledExport) => {
    const timestamp = getFormattedDateTime();
    const fileName = `${export_.name.replace(/\s+/g, '_')}_${timestamp}`;
    
    if (export_.delivery === 'email' && export_.email) {
      toast({
        title: "Export Started",
        description: `Preparing to email ${export_.format.toUpperCase()} to ${export_.email}`
      });
      
      setTimeout(() => {
        const updatedExports = exports.map(exp => {
          if (exp.id === export_.id) {
            return { 
              ...exp, 
              lastExport: new Date().toISOString() 
            };
          }
          return exp;
        });
        
        saveExports(updatedExports);
        
        toast({
          title: "Export Emailed",
          description: `${export_.format.toUpperCase()} exported and emailed to ${export_.email}`
        });
      }, 2000);
    } else {
      const data = ApiService.getData();
      handleDownload(data, export_.format, fileName);
      
      const updatedExports = exports.map(exp => {
        if (exp.id === export_.id) {
          return { 
            ...exp, 
            lastExport: new Date().toISOString() 
          };
        }
        return exp;
      });
      
      saveExports(updatedExports);
    }
  };

  const handleDownload = (data: DataEntry[], format: 'csv' | 'json', fileName: string) => {
    let blob, contentType;
    
    if (format === 'csv') {
      ApiService.exportToCsv();
    } else {
      const jsonContent = JSON.stringify(data, null, 2);
      blob = new Blob([jsonContent], { type: 'application/json' });
      contentType = 'application/json';
      
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

  return (
    <Card className="w-full shadow-sm hover:shadow-md transition-all duration-300">
      <CardHeader>
        <CardTitle className="text-xl font-medium">Scheduled Exports</CardTitle>
        <CardDescription>
          Configure automatic data exports on a schedule
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
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
            
            <Button className="w-full" onClick={addExport}>
              Schedule Export
            </Button>
          </div>
          
          <div className="border rounded-lg p-4">
            <h3 className="text-base font-medium mb-2">About Scheduled Exports</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Scheduled exports allow you to automatically export your data on a regular basis. 
              You can choose between CSV and JSON formats, and have the exports emailed to you 
              or automatically downloaded.
            </p>
            
            <div className="space-y-2">
              <div className="flex items-center">
                <CalendarIcon className="h-4 w-4 mr-2 text-primary" />
                <span className="text-sm">Daily, weekly, or monthly schedules</span>
              </div>
              
              <div className="flex items-center">
                <Mail className="h-4 w-4 mr-2 text-primary" />
                <span className="text-sm">Email delivery to any address</span>
              </div>
              
              <div className="flex items-center">
                <Clock className="h-4 w-4 mr-2 text-primary" />
                <span className="text-sm">Automated background processing</span>
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
                      {exp.lastExport && (
                        <span className="mr-3">Last: {new Date(exp.lastExport).toLocaleString()}</span>
                      )}
                      {exp.nextExport && exp.active && (
                        <span>Next: {new Date(exp.nextExport).toLocaleString()}</span>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Switch 
                      checked={exp.active} 
                      onCheckedChange={() => toggleActive(exp.id)} 
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
