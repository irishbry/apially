
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ExternalLink, Server, Globe, Github, FileCode } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const DeploymentGuide: React.FC = () => {
  return (
    <Card className="w-full shadow-sm hover:shadow-md transition-all duration-300">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-xl font-medium">
          <Server className="h-5 w-5 text-primary" />
          Deployment Guide
        </CardTitle>
        <CardDescription>
          How to deploy this application on your own domain
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <Tabs defaultValue="netlify" className="w-full">
            <TabsList className="grid grid-cols-3 mb-4">
              <TabsTrigger value="netlify">Netlify</TabsTrigger>
              <TabsTrigger value="vercel">Vercel</TabsTrigger>
              <TabsTrigger value="manual">Manual</TabsTrigger>
            </TabsList>
            
            <TabsContent value="netlify" className="space-y-4">
              <div className="space-y-2">
                <h3 className="text-sm font-medium">Deploy to Netlify (Recommended)</h3>
                <ol className="list-decimal list-inside space-y-2 text-sm">
                  <li>Push this code to a GitHub repository</li>
                  <li>Sign up for <a href="https://www.netlify.com/" className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">Netlify</a></li>
                  <li>Click "Add new site" → "Import an existing project"</li>
                  <li>Connect to your GitHub repository</li>
                  <li>Use these build settings:
                    <ul className="list-disc list-inside ml-5 text-muted-foreground">
                      <li>Build command: <code className="bg-secondary px-1 py-0.5 rounded">npm run build</code></li>
                      <li>Publish directory: <code className="bg-secondary px-1 py-0.5 rounded">dist</code></li>
                    </ul>
                  </li>
                  <li>Click "Deploy site"</li>
                </ol>
                
                <div className="mt-4">
                  <Button variant="outline" className="gap-2" onClick={() => window.open('https://app.netlify.com/start', '_blank')}>
                    <Globe className="h-4 w-4" />
                    Go to Netlify
                    <ExternalLink className="h-3 w-3 ml-1" />
                  </Button>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="vercel" className="space-y-4">
              <div className="space-y-2">
                <h3 className="text-sm font-medium">Deploy to Vercel</h3>
                <ol className="list-decimal list-inside space-y-2 text-sm">
                  <li>Push this code to a GitHub repository</li>
                  <li>Sign up for <a href="https://vercel.com/" className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">Vercel</a></li>
                  <li>Click "Add New" → "Project"</li>
                  <li>Import your GitHub repository</li>
                  <li>Vercel will automatically detect it's a Vite project</li>
                  <li>Click "Deploy"</li>
                </ol>
                
                <div className="mt-4">
                  <Button variant="outline" className="gap-2" onClick={() => window.open('https://vercel.com/new', '_blank')}>
                    <Globe className="h-4 w-4" />
                    Go to Vercel
                    <ExternalLink className="h-3 w-3 ml-1" />
                  </Button>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="manual" className="space-y-4">
              <div className="space-y-2">
                <h3 className="text-sm font-medium">Manual Deployment</h3>
                <ol className="list-decimal list-inside space-y-2 text-sm">
                  <li>Install Node.js and npm on your server</li>
                  <li>Clone this repository:
                    <pre className="bg-secondary p-2 rounded-md text-xs mt-1 overflow-x-auto">git clone https://github.com/your-username/your-repo.git</pre>
                  </li>
                  <li>Install dependencies:
                    <pre className="bg-secondary p-2 rounded-md text-xs mt-1 overflow-x-auto">npm install</pre>
                  </li>
                  <li>Build the project:
                    <pre className="bg-secondary p-2 rounded-md text-xs mt-1 overflow-x-auto">npm run build</pre>
                  </li>
                  <li>The built files will be in the <code>dist</code> directory</li>
                  <li>Serve these files using Nginx, Apache, or any static file server</li>
                </ol>
                
                <div className="mt-4 p-3 bg-secondary/50 rounded-md text-sm">
                  <h4 className="font-medium mb-2 flex items-center gap-2">
                    <FileCode className="h-4 w-4" />
                    Example Nginx Configuration
                  </h4>
                  <pre className="text-xs overflow-x-auto">
{`server {
    listen 80;
    server_name your-domain.com;
    root /path/to/your/dist;
    index index.html;
    
    location / {
        try_files $uri $uri/ /index.html;
    }
}`}
                  </pre>
                </div>
              </div>
            </TabsContent>
          </Tabs>
          
          <div className="p-4 bg-primary/5 rounded-md">
            <h3 className="text-sm font-medium mb-2">Next Steps After Deployment</h3>
            <ol className="list-decimal list-inside space-y-1 text-sm">
              <li>Set up your domain name in your hosting provider</li>
              <li>Configure your API key and Dropbox link in the application</li>
              <li>Share your API endpoint with your data provider: <code className="bg-secondary px-1 py-0.5 rounded">https://your-domain.com/api/data</code></li>
              <li>Test the integration using the Control Panel</li>
              <li>For a more robust solution, consider adding a proper backend service</li>
            </ol>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default DeploymentGuide;
