
import React from "react";
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

const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-background/95">
      {/* Subtle background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute top-[20%] -left-40 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 right-[20%] w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
      </div>
      
      <div className="container max-w-7xl relative">
        <div className="py-10 space-y-8 animate-slide-up">
          {/* Header */}
          <Header />
          
          <Separator />
          
          {/* API Usage Stats */}
          <section>
            <ApiUsageStats />
          </section>
          
          {/* Sources Management */}
          <section>
            <SourcesManager />
          </section>
          
          {/* Configuration */}
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
          
          {/* Control and Data View */}
          <section className="space-y-6">
            <h2 className="text-xl font-medium mb-4">Manage & Test</h2>
            <ControlPanel />
            <DataTable />
          </section>
          
          {/* API Documentation */}
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
