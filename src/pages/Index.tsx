
import React, { useEffect, useState } from "react";
import { Separator } from "@/components/ui/separator";
import ApiKeyForm from "@/components/ApiKeyForm";
import DropboxLinkForm from "@/components/DropboxLinkForm";
import ControlPanel from "@/components/ControlPanel";
import DataTable from "@/components/DataTable";
import ApiInstructions from "@/components/ApiInstructions";
import ApiUsageStats from "@/components/ApiUsageStats";
import SchemaEditor from "@/components/SchemaEditor";
import DeploymentGuide from "@/components/DeploymentGuide";
import SourcesManager from "@/components/SourcesManager";
import LoginForm from "@/components/LoginForm";
import { Button } from "@/components/ui/button";
import ApiService from "@/services/ApiService";
import { useToast } from "@/components/ui/use-toast";

const Index = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activeTab, setActiveTab] = useState("basic");
  const { toast } = useToast();

  useEffect(() => {
    // Check authentication status when component mounts
    setIsAuthenticated(ApiService.isUserAuthenticated());
  }, []);

  const handleLogout = () => {
    ApiService.logout();
    setIsAuthenticated(false);
    toast({
      title: "Logged Out",
      description: "You have been logged out successfully.",
    });
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <LoginForm />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto py-6">
        {/* Header with title and logout */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">CSV Consolidator Portal</h1>
          <Button
            variant="outline"
            onClick={handleLogout}
            className="px-4 py-2"
          >
            Logout
          </Button>
        </div>
        
        <Separator className="mb-6" />
        
        {/* Main content */}
        <div className="space-y-6">
          {/* API Usage Stats */}
          <ApiUsageStats />
          
          {/* Sources Manager */}
          <SourcesManager />
          
          {/* Configuration Tabs */}
          <div>
            <h2 className="text-2xl font-medium mb-4">Configuration</h2>
            
            <div className="border-b border-gray-200">
              <div className="flex">
                <button
                  className={`px-4 py-2 border-b-2 ${activeTab === 'basic' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500'}`}
                  onClick={() => setActiveTab('basic')}
                >
                  Basic Setup
                </button>
                <button
                  className={`px-4 py-2 border-b-2 ${activeTab === 'schema' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500'}`}
                  onClick={() => setActiveTab('schema')}
                >
                  Data Schema
                </button>
                <button
                  className={`px-4 py-2 border-b-2 ${activeTab === 'deployment' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500'}`}
                  onClick={() => setActiveTab('deployment')}
                >
                  Deployment
                </button>
              </div>
            </div>
            
            <div className="py-4">
              {activeTab === 'basic' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <ApiKeyForm />
                  <DropboxLinkForm />
                </div>
              )}
              
              {activeTab === 'schema' && (
                <SchemaEditor />
              )}
              
              {activeTab === 'deployment' && (
                <DeploymentGuide />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
