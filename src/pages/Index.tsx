
import React, { useEffect, useState } from "react";
import { Separator } from "@/components/ui/separator";
import ApiKeyForm from "@/components/ApiKeyForm";
import DropboxLinkForm from "@/components/DropboxLinkForm";
import ControlPanel from "@/components/ControlPanel";
import DataTable from "@/components/DataTable";
import ApiInstructions from "@/components/ApiInstructions";
import ApiUsageStats from "@/components/ApiUsageStats";
import Header from "@/components/Header";
import SchemaEditor from "@/components/SchemaEditor";
import DeploymentGuide from "@/components/DeploymentGuide";
import SourcesManager from "@/components/SourcesManager";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import ApiService from "@/services/ApiService";
import { useToast } from "@/components/ui/use-toast";
import { useNavigate } from "react-router-dom";
import SimpleLoginForm from "@/components/SimpleLoginForm";

const Index = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const authStatus = ApiService.isUserAuthenticated();
    console.log("Auth status on page load:", authStatus);
    setIsAuthenticated(authStatus);
    
    const handleAuthChange = () => {
      const newAuthStatus = ApiService.isUserAuthenticated();
      console.log("Auth status changed to:", newAuthStatus);
      setIsAuthenticated(newAuthStatus);
    };
    
    window.addEventListener('auth-change', handleAuthChange);
    
    return () => {
      window.removeEventListener('auth-change', handleAuthChange);
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

  if (!isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center">
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
            <Button variant="outline" onClick={handleLogout} className="hover-lift">
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
          
          <Separator />
          
          <section>
            <ApiUsageStats />
          </section>
          
          <section>
            <SourcesManager />
          </section>
          
          <section>
            <h2 className="text-xl font-medium mb-4">Configuration</h2>
            <Tabs defaultValue="basic" className="w-full">
              <TabsList className="mb-4">
                <TabsTrigger value="basic">Basic Setup</TabsTrigger>
                <TabsTrigger value="schema">Data Schema</TabsTrigger>
                <TabsTrigger value="deployment">Deployment</TabsTrigger>
              </TabsList>
              
              <TabsContent value="basic">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <ApiKeyForm />
                  <DropboxLinkForm />
                </div>
              </TabsContent>
              
              <TabsContent value="schema">
                <SchemaEditor />
              </TabsContent>
              
              <TabsContent value="deployment">
                <DeploymentGuide />
              </TabsContent>
            </Tabs>
          </section>
          
          <section className="space-y-6">
            <h2 className="text-xl font-medium mb-4">Manage & Test</h2>
            <ControlPanel />
            <DataTable />
          </section>
          
          <section className="space-y-6 pb-10">
            <h2 className="text-xl font-medium mb-4">Documentation</h2>
            <ApiInstructions />
          </section>
        </div>
      </div>
    </div>
  );
};

export default Index;
