
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
import ApiAnalytics from "@/components/ApiAnalytics";
import NotificationsCenter, { Notification } from "@/components/NotificationsCenter";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { LogOut, Bell, Menu, Database } from "lucide-react";
import { ApiService, DataEntry, Source } from "@/services/ApiService";
import NotificationService from "@/services/NotificationService";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import SimpleLoginForm from "@/components/SimpleLoginForm";
import { useIsMobile } from "@/hooks/use-mobile";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import MobileDataSummary from "@/components/MobileDataSummary";
import { supabase } from "@/integrations/supabase/client";

const Index = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [selectedApiKey, setSelectedApiKey] = useState<string>('');
  const [data, setData] = useState<DataEntry[]>([]);
  const [sources, setSources] = useState<Source[]>([]);
  const { toast } = useToast();
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        setIsLoading(true);
        const { data: { session } } = await supabase.auth.getSession();
        const authStatus = !!session;
        console.log("Auth status from Supabase:", authStatus);
        setIsAuthenticated(authStatus);
      } catch (error) {
        console.error("Error checking auth status:", error);
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    };
    
    checkAuth();
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log("Auth state changed:", event, !!session);
        const newAuthStatus = !!session;
        setIsAuthenticated(newAuthStatus);
      }
    );
    
    setNotifications(NotificationService.getNotifications());
    const unsubscribeNotifications = NotificationService.subscribe(newNotifications => {
      setNotifications(newNotifications);
    });
    
    return () => {
      subscription.unsubscribe();
      unsubscribeNotifications();
    };
  }, []);

  // Centralized data management
  useEffect(() => {
    if (!isAuthenticated) return;

    try {
      const unsubscribeData = ApiService.subscribe(newData => {
        console.log('Data updated:', newData.length, 'entries');
        setData([...newData]);
      });
      
      const unsubscribeSources = ApiService.subscribeToSources(newSources => {
        console.log('Sources updated:', newSources.length, 'sources');
        setSources([...newSources]);
      });
      
      return () => {
        unsubscribeData();
        unsubscribeSources();
      };
    } catch (err) {
      console.error('Error setting up data subscriptions:', err);
    }
  }, [isAuthenticated]);

  const handleApiKeySelect = (apiKey: string) => {
    console.log('API key selected in Index:', apiKey);
    setSelectedApiKey(apiKey);
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      toast({
        title: "Logged Out",
        description: "You have been logged out successfully.",
        duration: 5000,
      });
      setIsAuthenticated(false);
      navigate('/');
    } catch (error) {
      console.error("Error logging out:", error);
      toast({
        title: "Logout Error",
        description: "An error occurred during logout. Please try again.",
        variant: "destructive",
      });
    }
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

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-background to-background/95 p-4">
        <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

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
        <div className="py-4 md:py-10 space-y-4 md:space-y-8 animate-slide-up">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <div className="bg-primary/10 p-2 rounded-full">
                <Database className="h-5 w-5 md:h-6 md:w-6 text-primary" />
              </div>
              <h1 className="text-2xl md:text-3xl font-medium tracking-tight">ApiAlly</h1>
            </div>
            <div className="flex items-center gap-2">
              <NotificationsCenter 
                notifications={notifications}
                onMarkRead={handleMarkRead}
                onMarkAllRead={handleMarkAllRead}
                onDeleteNotification={handleDeleteNotification}
                onClearAll={handleClearAllNotifications}
              />
              {isMobile ? (
                <Sheet>
                  <SheetTrigger asChild>
                    <Button variant="outline" size="icon" className="hover-lift h-9 w-9">
                      <Menu className="h-4 w-4" />
                    </Button>
                  </SheetTrigger>
                  <SheetContent>
                    <div className="flex flex-col gap-4 pt-8">
                      <Button variant="outline" onClick={handleLogout} className="w-full">
                        <LogOut className="h-4 w-4 mr-2" />
                        Logout
                      </Button>
                      <Separator />
                      <div className="text-sm text-muted-foreground">
                        Quick navigation
                      </div>
                      <nav className="grid gap-2">
                        {["Dashboard", "Sources", "Data", "Analytics", "API Logs", "Settings"].map((item) => (
                          <Button 
                            key={item} 
                            variant="ghost" 
                            className="justify-start"
                            onClick={() => {
                              const tabId = item.toLowerCase().replace(' ', '-');
                              document.querySelector(`[value="${tabId}"]`)?.dispatchEvent(
                                new MouseEvent('click', { bubbles: true })
                              );
                            }}
                          >
                            {item}
                          </Button>
                        ))}
                      </nav>
                    </div>
                  </SheetContent>
                </Sheet>
              ) : (
                <Button variant="outline" onClick={handleLogout} className="hover-lift">
                  <LogOut className="h-4 w-4 mr-2" />
                  Logout
                </Button>
              )}
            </div>
          </div>
          
          {!isMobile && <Separator />}
          
          {isMobile && <MobileDataSummary />}
          
          <section>
            <ApiUsageStats data={data} sources={sources} />
          </section>
          
          <section>
            <Tabs defaultValue="dashboard" className="w-full">
              <TabsList className="mb-4 overflow-auto flex w-full">
                <TabsTrigger value="dashboard" className="flex-1">Dashboard</TabsTrigger>
                <TabsTrigger value="sources" className="flex-1">Sources</TabsTrigger>
                <TabsTrigger value="data" className="flex-1">Data</TabsTrigger>
                <TabsTrigger value="analytics" className="flex-1">Analytics</TabsTrigger>
                <TabsTrigger value="logs" className="flex-1">Logs</TabsTrigger>
                <TabsTrigger value="settings" className="flex-1">Settings</TabsTrigger>
              </TabsList>
              
              <TabsContent value="dashboard" className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <ScheduledExports />
                  <ControlPanel />
                </div>
              </TabsContent>
              
              <TabsContent value="sources" className="space-y-6">
                <SourcesManager onApiKeySelect={handleApiKeySelect} />
              </TabsContent>
              
              <TabsContent value="data" className="space-y-6">
                <EnhancedDataTable data={data} sources={sources} />
              </TabsContent>
              
              <TabsContent value="analytics" className="space-y-6">
                <ApiAnalytics />
              </TabsContent>
              
              <TabsContent value="logs" className="space-y-6">
                <ApiLogViewer />
              </TabsContent>
              
              <TabsContent value="settings">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <ApiKeyForm />
                  <DropboxLinkForm />
                </div>
                
              </TabsContent>
            </Tabs>
          </section>
          
          {!isMobile && (
            <section className="space-y-6 pb-10">
              <h2 className="text-xl font-medium mb-4">API Documentation</h2>
              <ApiDocumentation selectedApiKey={selectedApiKey} />
            </section>
          )}
        </div>
      </div>
    </div>
  );
};

export default Index;
