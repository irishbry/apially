
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Download, Server, FileDown, ChevronDown, ChevronUp, FolderDown, Code } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useToast } from "@/components/ui/use-toast";

const Installer: React.FC = () => {
  const [isOpenFTP, setIsOpenFTP] = useState(false);
  const [isOpenCPanel, setIsOpenCPanel] = useState(false);
  const [isOpenConfig, setIsOpenConfig] = useState(false);
  const { toast } = useToast();

  const handleDownload = () => {
    // Create a dummy installation package for demonstration
    const dummyPackageContent = `
    # Data Consolidation API Installation Package
    
    This package contains all files needed to install the Data Consolidation API on your SiteGround hosting.
    
    ## Contents
    - index.php - Main API entry point
    - config.php - Configuration file
    - data/ - Directory for data storage
    - api/ - API endpoints
    - status.php - API status checker
    
    ## Installation
    Follow the instructions in the SiteGround Installation Guide to set up this package.
    
    ## Support
    For any issues, please contact support.
    `;
    
    // Create a Blob with the package content
    const blob = new Blob([dummyPackageContent], { type: 'text/plain' });
    
    // Create a download link and trigger the download
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'data-consolidation-api.txt';
    document.body.appendChild(a);
    a.click();
    
    // Clean up
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    // Show success toast
    toast({
      title: "Download started",
      description: "Your installation package is downloading now.",
    });
  };

  return (
    <Card className="w-full shadow-sm hover:shadow-md transition-all duration-300">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-xl font-medium">
          <Server className="h-5 w-5 text-primary" />
          SiteGround Installation Guide
        </CardTitle>
        <CardDescription>
          How to install this application on your SiteGround hosting
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div className="p-4 bg-primary/5 rounded-md">
            <h3 className="text-sm font-medium mb-2">Installation Overview</h3>
            <p className="text-sm text-muted-foreground mb-4">
              This guide will help you install the Data Consolidation API on your SiteGround hosting. Follow these steps to get your server up and running.
            </p>
            
            <Button className="gap-2 mb-4" onClick={handleDownload}>
              <Download className="h-4 w-4" />
              Download Installation Package
            </Button>
            
            <ol className="list-decimal list-inside space-y-3 text-sm">
              <li className="font-medium">Log in to your SiteGround account</li>
              
              <li>
                <Collapsible open={isOpenCPanel} onOpenChange={setIsOpenCPanel} className="space-y-2">
                  <CollapsibleTrigger className="font-medium flex items-center">
                    Access cPanel
                    {isOpenCPanel ? <ChevronUp className="h-4 w-4 ml-2" /> : <ChevronDown className="h-4 w-4 ml-2" />}
                  </CollapsibleTrigger>
                  <CollapsibleContent className="pl-5 space-y-2 text-muted-foreground">
                    <p>Go to your SiteGround User Area and select your hosting account.</p>
                    <p>Click on "Websites" then "Site Tools" or "cPanel" depending on your hosting plan.</p>
                  </CollapsibleContent>
                </Collapsible>
              </li>
              
              <li>
                <Collapsible open={isOpenFTP} onOpenChange={setIsOpenFTP} className="space-y-2">
                  <CollapsibleTrigger className="font-medium flex items-center">
                    Upload files using File Manager or FTP
                    {isOpenFTP ? <ChevronUp className="h-4 w-4 ml-2" /> : <ChevronDown className="h-4 w-4 ml-2" />}
                  </CollapsibleTrigger>
                  <CollapsibleContent className="pl-5 space-y-2 text-muted-foreground">
                    <p>Option 1: Using File Manager in cPanel</p>
                    <ul className="list-disc list-inside ml-3">
                      <li>Open File Manager</li>
                      <li>Navigate to your website's document root (usually public_html)</li>
                      <li>Create a new folder named "api" (or use your preferred name)</li>
                      <li>Upload the installation package and extract it</li>
                    </ul>
                    
                    <p className="mt-2">Option 2: Using FTP</p>
                    <ul className="list-disc list-inside ml-3">
                      <li>Connect to your server using an FTP client (like FileZilla)</li>
                      <li>Navigate to your website's document root</li>
                      <li>Create a new folder named "api" (or use your preferred name)</li>
                      <li>Upload the extracted installation files to this folder</li>
                    </ul>
                  </CollapsibleContent>
                </Collapsible>
              </li>
              
              <li>
                <Collapsible open={isOpenConfig} onOpenChange={setIsOpenConfig} className="space-y-2">
                  <CollapsibleTrigger className="font-medium flex items-center">
                    Configure the application
                    {isOpenConfig ? <ChevronUp className="h-4 w-4 ml-2" /> : <ChevronDown className="h-4 w-4 ml-2" />}
                  </CollapsibleTrigger>
                  <CollapsibleContent className="pl-5 space-y-2 text-muted-foreground">
                    <p>In the "api" folder, locate the config.php file and edit it:</p>
                    <div className="bg-secondary p-3 rounded-md mt-2 mb-2">
                      <pre className="text-xs overflow-x-auto">
{`// config.php
$config = [
    'allowed_origins' => ['https://your-front-end-domain.com'],
    'storage_path' => '/absolute/path/to/data/storage',
    'dropbox_token' => 'your_dropbox_token',
    'admin_username' => 'admin',
    'admin_password' => 'change_this_password'
];`}
                      </pre>
                    </div>
                    <p>Update these settings as needed for your environment.</p>
                  </CollapsibleContent>
                </Collapsible>
              </li>
              
              <li className="font-medium">Set the correct permissions</li>
              <div className="pl-5 text-muted-foreground">
                <p>Make sure the "data" directory is writable:</p>
                <div className="bg-secondary p-2 rounded-md mt-1 mb-2">
                  <code className="text-xs">chmod 755 api</code><br />
                  <code className="text-xs">chmod 755 api/data</code>
                </div>
              </div>
              
              <li className="font-medium">Test the installation</li>
              <div className="pl-5 text-muted-foreground">
                <p>Visit <code>https://your-domain.com/api/status.php</code> to verify the API is working.</p>
                <p>You should see a JSON response with status: "ok"</p>
              </div>
            </ol>
          </div>
          
          <Separator />
          
          <div>
            <h3 className="text-sm font-medium mb-3">Advanced Configuration</h3>
            
            <Tabs defaultValue="htaccess" className="w-full">
              <TabsList className="grid grid-cols-2 mb-4">
                <TabsTrigger value="htaccess">.htaccess Setup</TabsTrigger>
                <TabsTrigger value="endpoints">API Endpoints</TabsTrigger>
              </TabsList>
              
              <TabsContent value="htaccess" className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Create or modify the .htaccess file in your api directory to enable clean URLs and enhance security:
                </p>
                <div className="bg-secondary p-3 rounded-md overflow-x-auto">
                  <pre className="text-xs">
{`RewriteEngine On
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^data/?$ data.php [QSA,NC,L]

# Protect config file
<Files "config.php">
Order Allow,Deny
Deny from all
</Files>

# Cross-Origin headers for API
<IfModule mod_headers.c>
  Header set Access-Control-Allow-Origin "*"
  Header set Access-Control-Allow-Methods "POST, GET, OPTIONS"
  Header set Access-Control-Allow-Headers "Content-Type, X-API-Key"
  Header set Access-Control-Max-Age "3600"
</IfModule>`}
                  </pre>
                </div>
              </TabsContent>
              
              <TabsContent value="endpoints" className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  The installer provides these API endpoints:
                </p>
                <div className="space-y-2">
                  <div className="p-2 bg-secondary/50 rounded-md">
                    <code className="text-xs">POST /api/data</code>
                    <p className="text-xs mt-1">Main endpoint for receiving data from sources.</p>
                  </div>
                  <div className="p-2 bg-secondary/50 rounded-md">
                    <code className="text-xs">GET /api/export</code>
                    <p className="text-xs mt-1">Manually trigger data export to CSV.</p>
                  </div>
                  <div className="p-2 bg-secondary/50 rounded-md">
                    <code className="text-xs">GET /api/status</code>
                    <p className="text-xs mt-1">Check if the API is running correctly.</p>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex flex-col items-start gap-4">
        <div className="p-3 bg-primary/5 rounded-md w-full">
          <h3 className="text-sm font-medium mb-2 flex items-center gap-2">
            <Code className="h-4 w-4" />
            Server Requirements
          </h3>
          <ul className="list-disc list-inside text-xs text-muted-foreground space-y-1">
            <li>PHP 7.4 or higher</li>
            <li>JSON extension enabled</li>
            <li>cURL extension enabled</li>
            <li>mod_rewrite enabled (for clean URLs)</li>
            <li>Write permissions on data directory</li>
          </ul>
        </div>
        
        <Button variant="outline" className="gap-2 w-full" onClick={() => window.open('https://www.siteground.com/tutorials/php/', '_blank')}>
          <FolderDown className="h-4 w-4" />
          SiteGround PHP Documentation
        </Button>
      </CardFooter>
    </Card>
  );
};

export default Installer;
