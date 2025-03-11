
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Trash2, Calendar, Clock, Mail, Plus, CalendarCheck } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import ApiService, { Source } from "@/services/ApiService";

interface ScheduledExport {
  id: string;
  name: string;
  frequency: 'daily' | 'weekly' | 'monthly';
  time: string;
  day?: string;
  date?: string;
  sourceId: string;
  email: string;
  active: boolean;
  lastExport?: string;
}

const ScheduledExports: React.FC = () => {
  const [schedules, setSchedules] = useState<ScheduledExport[]>([]);
  const [sources, setSources] = useState<Source[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [newSchedule, setNewSchedule] = useState<Omit<ScheduledExport, 'id' | 'active' | 'lastExport'>>({
    name: '',
    frequency: 'daily',
    time: '08:00',
    sourceId: 'all',
    email: ''
  });
  const { toast } = useToast();

  useEffect(() => {
    // Load saved schedules
    const savedSchedules = localStorage.getItem('csv-scheduled-exports');
    if (savedSchedules) {
      try {
        setSchedules(JSON.parse(savedSchedules));
      } catch (e) {
        console.error('Error loading saved schedules:', e);
      }
    }
    
    // Load sources
    setSources(ApiService.getSources());
    
    // Subscribe to source changes
    const unsubscribe = ApiService.subscribeToSources(newSources => {
      setSources([...newSources]);
    });
    
    // Set up simulated scheduler timer (check every minute in a real app)
    const timer = setInterval(checkScheduledExports, 60000);
    
    return () => {
      unsubscribe();
      clearInterval(timer);
    };
  }, []);

  // Save schedules to localStorage
  const saveSchedules = (updatedSchedules: ScheduledExport[]) => {
    setSchedules(updatedSchedules);
    localStorage.setItem('csv-scheduled-exports', JSON.stringify(updatedSchedules));
  };

  // Add a new schedule
  const addSchedule = () => {
    if (!newSchedule.name.trim()) {
      toast({
        title: "Name Required",
        description: "Please enter a name for the scheduled export.",
        variant: "destructive",
      });
      return;
    }

    if (!newSchedule.email.trim() || !newSchedule.email.includes('@')) {
      toast({
        title: "Invalid Email",
        description: "Please enter a valid email address.",
        variant: "destructive",
      });
      return;
    }

    // Create new schedule
    const schedule: ScheduledExport = {
      ...newSchedule,
      id: `schedule-${Date.now()}`,
      active: true
    };

    // Add day for weekly or date for monthly
    if (schedule.frequency === 'weekly') {
      schedule.day = '1'; // Monday
    } else if (schedule.frequency === 'monthly') {
      schedule.date = '1'; // 1st of month
    }

    const updatedSchedules = [...schedules, schedule];
    saveSchedules(updatedSchedules);

    // Reset form and close it
    setNewSchedule({
      name: '',
      frequency: 'daily',
      time: '08:00',
      sourceId: 'all',
      email: ''
    });
    setIsAdding(false);

    toast({
      title: "Schedule Created",
      description: `${schedule.name} has been scheduled successfully.`,
    });
  };

  // Toggle schedule active state
  const toggleScheduleActive = (id: string) => {
    const updatedSchedules = schedules.map(schedule => {
      if (schedule.id === id) {
        return { ...schedule, active: !schedule.active };
      }
      return schedule;
    });
    saveSchedules(updatedSchedules);
  };

  // Delete a schedule
  const deleteSchedule = (id: string) => {
    const updatedSchedules = schedules.filter(schedule => schedule.id !== id);
    saveSchedules(updatedSchedules);
    
    toast({
      title: "Schedule Deleted",
      description: "The scheduled export has been removed.",
    });
  };

  // Get source name from ID
  const getSourceName = (sourceId: string): string => {
    if (sourceId === 'all') return 'All Sources';
    const source = sources.find(s => s.id === sourceId);
    return source ? source.name : 'Unknown Source';
  };

  // Function to check if any exports need to be run
  const checkScheduledExports = () => {
    if (!schedules.length) return;
    
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const currentDay = now.getDay(); // 0 is Sunday, 1 is Monday, etc.
    const currentDate = now.getDate(); // 1-31
    
    schedules.forEach(schedule => {
      if (!schedule.active) return;
      
      // Parse schedule time
      const [hours, minutes] = schedule.time.split(':').map(Number);
      
      // Check if it's time to run the export
      let shouldRun = false;
      
      if (schedule.frequency === 'daily') {
        // Run daily at the specified time
        shouldRun = currentHour === hours && currentMinute >= minutes && currentMinute < minutes + 5;
      } else if (schedule.frequency === 'weekly' && schedule.day) {
        // Run weekly on the specified day at the specified time
        const scheduleDay = parseInt(schedule.day);
        // Convert from Monday-first (1-7) to Sunday-first (0-6)
        const adjustedScheduleDay = scheduleDay === 7 ? 0 : scheduleDay;
        shouldRun = currentDay === adjustedScheduleDay && currentHour === hours && currentMinute >= minutes && currentMinute < minutes + 5;
      } else if (schedule.frequency === 'monthly' && schedule.date) {
        // Run monthly on the specified date at the specified time
        const scheduleDate = parseInt(schedule.date);
        shouldRun = currentDate === scheduleDate && currentHour === hours && currentMinute >= minutes && currentMinute < minutes + 5;
      }
      
      if (shouldRun) {
        runScheduledExport(schedule);
      }
    });
  };

  // Function to run a scheduled export
  const runScheduledExport = (schedule: ScheduledExport) => {
    // Simulate the export (in a real app, this would call an API endpoint)
    console.log(`Running scheduled export: ${schedule.name}`);
    
    // Get data based on source filter
    let exportData = schedule.sourceId === 'all' 
      ? ApiService.getData() 
      : ApiService.getDataBySource(schedule.sourceId);
    
    // Simulate sending email with CSV
    simulateEmailExport(schedule, exportData.length);
    
    // Update last export time
    const updatedSchedules = schedules.map(s => {
      if (s.id === schedule.id) {
        return { ...s, lastExport: new Date().toISOString() };
      }
      return s;
    });
    
    saveSchedules(updatedSchedules);
  };

  // Simulate sending an email with CSV
  const simulateEmailExport = (schedule: ScheduledExport, dataCount: number) => {
    toast({
      title: "Export Running",
      description: `Preparing to send ${schedule.name} to ${schedule.email}...`,
    });
    
    // In a real app, this would call a backend API to send the email
    setTimeout(() => {
      toast({
        title: "Export Complete",
        description: `CSV with ${dataCount} records sent to ${schedule.email}`,
      });
    }, 3000);
  };

  // Manually trigger a scheduled export
  const manuallyTriggerExport = (schedule: ScheduledExport) => {
    runScheduledExport(schedule);
  };

  // Format date for display
  const formatDate = (dateString?: string): string => {
    if (!dateString) return 'Never';
    try {
      return new Date(dateString).toLocaleString();
    } catch (e) {
      return dateString;
    }
  };

  return (
    <Card className="w-full shadow-sm hover:shadow-md transition-all duration-300">
      <CardHeader>
        <CardTitle className="flex items-center justify-between text-xl font-medium">
          <span>Scheduled Exports</span>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setIsAdding(!isAdding)}
            className="hover-lift"
          >
            {isAdding ? 'Cancel' : (
              <>
                <Plus className="mr-1 h-4 w-4" />
                Add Schedule
              </>
            )}
          </Button>
        </CardTitle>
        <CardDescription>
          Set up automated email exports on a regular schedule
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isAdding && (
          <div className="mb-6 p-4 border rounded-md bg-secondary/20">
            <h3 className="text-sm font-medium mb-3">New Scheduled Export</h3>
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="schedule-name">Name</Label>
                  <Input 
                    id="schedule-name" 
                    value={newSchedule.name} 
                    onChange={(e) => setNewSchedule({...newSchedule, name: e.target.value})}
                    placeholder="Daily Morning Export" 
                  />
                </div>
                <div>
                  <Label htmlFor="schedule-email">Email Address</Label>
                  <Input 
                    id="schedule-email" 
                    type="email"
                    value={newSchedule.email} 
                    onChange={(e) => setNewSchedule({...newSchedule, email: e.target.value})}
                    placeholder="user@example.com" 
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="schedule-frequency">Frequency</Label>
                  <Select 
                    value={newSchedule.frequency} 
                    onValueChange={(value: 'daily' | 'weekly' | 'monthly') => setNewSchedule({...newSchedule, frequency: value})}
                  >
                    <SelectTrigger id="schedule-frequency">
                      <SelectValue placeholder="Select frequency" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                {newSchedule.frequency === 'weekly' && (
                  <div>
                    <Label htmlFor="schedule-day">Day of Week</Label>
                    <Select 
                      value={newSchedule.day || '1'} 
                      onValueChange={(value) => setNewSchedule({...newSchedule, day: value})}
                    >
                      <SelectTrigger id="schedule-day">
                        <SelectValue placeholder="Select day" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">Monday</SelectItem>
                        <SelectItem value="2">Tuesday</SelectItem>
                        <SelectItem value="3">Wednesday</SelectItem>
                        <SelectItem value="4">Thursday</SelectItem>
                        <SelectItem value="5">Friday</SelectItem>
                        <SelectItem value="6">Saturday</SelectItem>
                        <SelectItem value="7">Sunday</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
                
                {newSchedule.frequency === 'monthly' && (
                  <div>
                    <Label htmlFor="schedule-date">Day of Month</Label>
                    <Select 
                      value={newSchedule.date || '1'} 
                      onValueChange={(value) => setNewSchedule({...newSchedule, date: value})}
                    >
                      <SelectTrigger id="schedule-date">
                        <SelectValue placeholder="Select date" />
                      </SelectTrigger>
                      <SelectContent>
                        {[...Array(31)].map((_, i) => (
                          <SelectItem key={i+1} value={(i+1).toString()}>
                            {i+1}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                
                <div>
                  <Label htmlFor="schedule-time">Time (24h)</Label>
                  <Input 
                    id="schedule-time" 
                    type="time"
                    value={newSchedule.time} 
                    onChange={(e) => setNewSchedule({...newSchedule, time: e.target.value})}
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="schedule-source">Data Source</Label>
                <Select 
                  value={newSchedule.sourceId} 
                  onValueChange={(value) => setNewSchedule({...newSchedule, sourceId: value})}
                >
                  <SelectTrigger id="schedule-source">
                    <SelectValue placeholder="Select source" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Sources</SelectItem>
                    {sources.map((source) => (
                      <SelectItem key={source.id} value={source.id}>
                        {source.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex justify-end">
                <Button onClick={addSchedule}>
                  Add Scheduled Export
                </Button>
              </div>
            </div>
          </div>
        )}
        
        {schedules.length === 0 ? (
          <div className="flex items-center justify-center h-40 text-center text-muted-foreground border rounded-md bg-secondary/10">
            <div>
              <CalendarCheck className="mx-auto h-8 w-8 text-muted-foreground/60 mb-2" />
              <p>No scheduled exports configured.</p>
              <p className="text-sm">Click "Add Schedule" to create your first automated export.</p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {schedules.map((schedule) => (
              <div key={schedule.id} className="p-4 border rounded-md flex flex-col sm:flex-row justify-between">
                <div className="space-y-1 flex-grow">
                  <div className="flex items-center">
                    <h3 className="font-medium">{schedule.name}</h3>
                    <div className={`ml-2 px-1.5 py-0.5 text-xs rounded-full ${schedule.active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                      {schedule.active ? 'Active' : 'Paused'}
                    </div>
                  </div>
                  
                  <div className="text-sm text-muted-foreground grid grid-cols-1 sm:grid-cols-3 gap-x-4">
                    <div className="flex items-center">
                      <Calendar className="h-3 w-3 mr-1" />
                      {schedule.frequency === 'daily' && 'Daily'}
                      {schedule.frequency === 'weekly' && `Weekly on ${['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'][parseInt(schedule.day || '1') - 1]}`}
                      {schedule.frequency === 'monthly' && `Monthly on day ${schedule.date}`}
                    </div>
                    <div className="flex items-center">
                      <Clock className="h-3 w-3 mr-1" />
                      {schedule.time}
                    </div>
                    <div className="flex items-center">
                      <Mail className="h-3 w-3 mr-1" />
                      {schedule.email}
                    </div>
                  </div>
                  
                  <div className="text-xs">
                    Source: {getSourceName(schedule.sourceId)}
                    {schedule.lastExport && (
                      <span className="ml-4 text-muted-foreground">
                        Last sent: {formatDate(schedule.lastExport)}
                      </span>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center mt-3 sm:mt-0 space-x-2">
                  <div className="flex items-center space-x-2">
                    <Switch 
                      checked={schedule.active} 
                      onCheckedChange={() => toggleScheduleActive(schedule.id)} 
                      id={`active-${schedule.id}`}
                    />
                    <Label htmlFor={`active-${schedule.id}`} className="text-xs">Active</Label>
                  </div>
                  
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="py-1 h-8"
                    onClick={() => manuallyTriggerExport(schedule)}
                  >
                    Run Now
                  </Button>
                  
                  <Button 
                    variant="ghost" 
                    size="icon"
                    onClick={() => deleteSchedule(schedule.id)}
                    className="text-destructive h-8 w-8"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
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
