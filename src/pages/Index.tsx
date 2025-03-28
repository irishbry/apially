
import React, { useEffect, useState } from "react";
import { Separator } from "@/components/ui/separator";
import ApiKeyForm from "@/components/ApiKeyForm";
import DropboxLinkForm from "@/components/DropboxLinkForm";
import ControlPanel from "@/components/ControlPanel";
import ApiDocumentation from "@/components/ApiDocumentation";
import ApiUsageStats from "@/components/ApiUsageStats";
import Header from "@/components/Header";
import SchemaEditor from "@/components/SchemaEditor";
import DeploymentGuide from "@/components/DeploymentGuide";
import SourcesManager from "@/components/SourcesManager";
import ScheduledExports from "@/components/ScheduledExports";
import EnhancedDataTable from "@/components/EnhancedDataTable";
import HistoricalAnalysis from "@/components/HistoricalAnalysis";
import ApiLogViewer from "@/components/ApiLogViewer";
import NotificationsCenter, { Notification } from "@/components/NotificationsCenter";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { LogOut, Bell } from "lucide-react";
import ApiService from "@/services/ApiService";
import NotificationService from "@/services/NotificationService";
import { useToast } from "@/components/ui/use-toast";
import { useNavigate } from "react-router-dom";
import SimpleLoginForm from "@/components/SimpleLoginForm";

const Index = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    // Check auth status on component mount
    const checkAuth = () => {
      const authStatus = ApiService.isUserAuthenticated();
      console.log("Auth status check:", authStatus);
      setIsAuthenticated(authStatus);
    };
    
    // Initial check
    checkAuth();
    
    // Set up event listener for auth changes
    window.addEventListener('storage', (e) => {
      if (e.key === 'csv-api-auth') {
        checkAuth();
      }
    });
    
    // Custom auth-change event listener for direct updates
    window.addEventListener('auth-change', checkAuth);
    
    // Load notifications and subscribe to changes
    setNotifications(NotificationService.getNotifications());
    const unsubscribeNotifications = NotificationService.subscribe(newNotifications => {
      setNotifications(newNotifications);
    });
    
    // Add a welcome notification when first logging in
    if (ApiService.isUserAuthenticated()) {
      setTimeout(() => {
        NotificationService.addNotification(
          'Welcome to the Dashboard',
          'You can now manage your data sources and view analytics.',
          'info'
        );
      }, 1000);
    }
    
    return () => {
      window.removeEventListener('storage', checkAuth);
      window.removeEventListener('auth-change', checkAuth);
      unsubscribeNotifications();
    };
  }, []);

  const handleLogout = () => {
    ApiService.logout();
    setIsAuthenticated(false);
    toast({
      title: "Logged Out",
      description: "You have been logged out successfully.",
    });
    navigate('/');
  };
  
  const handleMarkRead = (id: string) => {
    NotificationService.markAsRead(id);
  };
  
  const handleMarkAllRead = () => {
    NotificationService.markAllAsRead();
  };
  
  const handleDeleteNotification = (id: string) => {
    NotificationService.deleteNotification(id);
  };
  
  const handleClearAllNotifications = () => {
    NotificationService.clearAll();
  };

  if (!isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-background to-background/95 p-4">
        <SimpleLoginForm />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-background/95">
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-5">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute top-[20%] -left-40 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 right-[20%] w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
      </div>
      
      <div className="container max-w-7xl relative">
        <div className="py-10 space-y-8 animate-slide-up">
          <div className="flex justify-between items-center">
            <Header />
            <div className="flex items-center gap-3">
              <NotificationsCenter 
                notifications={notifications}
                onMarkRead={handleMarkRead}
                onMarkAllRead={handleMarkAllRead}
                onDeleteNotification={handleDeleteNotification}
                onClearAll={handleClearAllNotifications}
              />
              <Button variant="outline" onClick={handleLogout} className="hover-lift">
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
          
          <Separator />
          
          <section>
            <ApiUsageStats />
          </section>
          
          <section>
            <Tabs defaultValue="dashboard" className="w-full">
              <TabsList className="mb-4">
                <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
                <TabsTrigger value="sources">Sources</TabsTrigger>
                <TabsTrigger value="data">Data</TabsTrigger>
                <TabsTrigger value="analytics">Analytics</TabsTrigger>
                <TabsTrigger value="logs">API Logs</TabsTrigger>
                <TabsTrigger value="settings">Settings</TabsTrigger>
              </TabsList>
              
              <TabsContent value="dashboard" className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <ScheduledExports />
                  <ControlPanel />
                </div>
              </TabsContent>
              
              <TabsContent value="sources" className="space-y-6">
                <SourcesManager />
              </TabsContent>
              
              <TabsContent value="data" className="space-y-6">
                <EnhancedDataTable />
              </TabsContent>
              
              <TabsContent value="analytics" className="space-y-6">
                <HistoricalAnalysis />
              </TabsContent>
              
              <TabsContent value="logs" className="space-y-6">
                <ApiLogViewer />
              </TabsContent>
              
              <TabsContent value="settings">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <ApiKeyForm />
                  <DropboxLinkForm />
                </div>
                <SchemaEditor />
              </TabsContent>
            </Tabs>
          </section>
          
          <section className="space-y-6 pb-10">
            <h2 className="text-xl font-medium mb-4">API Documentation</h2>
            <ApiDocumentation />
          </section>
        </div>
      </div>
    </div>
  );
};

export default Index;
