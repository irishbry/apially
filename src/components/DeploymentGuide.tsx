import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ExternalLink, Server, Globe, Github, FileCode, Upload, AlertTriangle, CheckCircle, FileWarning } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Installer from '@/components/Installer';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

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
          <Alert variant="default" className="mb-4 bg-amber-50 border-amber-200 text-amber-800">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Important Installation Notes</AlertTitle>
            <AlertDescription>
              <ul className="list-disc list-inside mt-2 space-y-1 text-sm">
                <li>The API requires PHP with mod_rewrite enabled</li>
                <li>Make sure your server has write permissions for the data directory</li>
                <li>Always use the test.php script to verify your installation</li>
                <li>If uploading to csvscrub.com/api, make sure all files are in that directory</li>
                <li><strong>Ensure the .htaccess file has proper RewriteBase setting</strong> (e.g., RewriteBase /api/)</li>
                <li><strong className="text-amber-800">The .htaccess file is critical but may be hidden in file managers</strong></li>
              </ul>
            </AlertDescription>
          </Alert>

          <Tabs defaultValue="siteground" className="w-full">
            <TabsList className="grid grid-cols-4 mb-4">
              <TabsTrigger value="siteground">SiteGround</TabsTrigger>
              <TabsTrigger value="netlify">Netlify</TabsTrigger>
              <TabsTrigger value="vercel">Vercel</TabsTrigger>
              <TabsTrigger value="manual">Manual</TabsTrigger>
            </TabsList>
            
            <TabsContent value="siteground" className="space-y-4">
              <Installer />
            </TabsContent>
            
            <TabsContent value="netlify" className="space-y-4">
              <div className="space-y-2">
                <h3 className="text-sm font-medium">Deploy to Netlify</h3>
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
            <h3 className="text-sm font-medium mb-2">Troubleshooting Common Issues</h3>
            <ol className="list-decimal list-inside space-y-2 text-sm">
              <li><strong>API Connectivity Error (404)</strong>: 
                <ul className="list-disc list-inside ml-5 text-muted-foreground">
                  <li>Check that all files are in the correct location. For csvscrub.com/api, all files should be directly in the "api" folder.</li>
                  <li><strong className="text-amber-800">Make sure .htaccess file is uploaded and readable by the server (it's often hidden in FTP clients).</strong></li>
                  <li>To see hidden files in cPanel File Manager: Click "Settings" and check "Show Hidden Files (dotfiles)"</li>
                  <li>In FileZilla (FTP): Go to Server {'>'} Force showing hidden files</li>
                  <li>Verify mod_rewrite is enabled in your Apache configuration with <code>a2enmod rewrite</code> and restart Apache.</li>
                  <li>Check that your .htaccess has the correct RewriteBase directive (should be <code>RewriteBase /api/</code> for csvscrub.com/api installations).</li>
                  <li>Ensure your Apache configuration has <code>AllowOverride All</code> for the directory.</li>
                  <li>Try accessing the test.php file directly to see detailed diagnostics.</li>
                </ul>
              </li>
              <li><strong>Server Error (500)</strong>:
                <ul className="list-disc list-inside ml-5 text-muted-foreground">
                  <li>Check your server's error logs for specific PHP errors.</li>
                  <li>Verify PHP version is 7.0 or higher.</li>
                  <li>Make sure all required PHP extensions are enabled (curl, json).</li>
                  <li>Simplify the code if needed - remove complex functionality for initial testing.</li>
                </ul>
              </li>
              <li><strong>Permission Issues</strong>:
                <ul className="list-disc list-inside ml-5 text-muted-foreground">
                  <li>Set the data directory permissions to 755 or 775 (chmod 755 data)</li>
                  <li>Set PHP files to 644 (chmod 644 *.php)</li>
                  <li>Ensure the web server user (www-data, apache, etc.) has write access to the data directory</li>
                </ul>
              </li>
              <li><strong>Configuration</strong>:
                <ul className="list-disc list-inside ml-5 text-muted-foreground">
                  <li>Update the config.php with your domain in allowed_origins</li>
                  <li>Set your API key to a secure value</li>
                </ul>
              </li>
            </ol>
          </div>
          
          <Alert variant="default" className="mb-4 bg-blue-50 border-blue-200 text-blue-800">
            <FileWarning className="h-4 w-4" />
            <AlertTitle>Apache Configuration Note</AlertTitle>
            <AlertDescription className="text-sm">
              <p className="mb-2">If you're experiencing 404 errors, your Apache server might need additional configuration:</p>
              <ol className="list-decimal list-inside space-y-1">
                <li>Check if mod_rewrite is enabled: <code>sudo a2enmod rewrite</code></li>
                <li>Edit your VirtualHost configuration file (often in /etc/apache2/sites-available/) to include:</li>
                <pre className="bg-blue-100/50 p-2 rounded-md text-xs mt-1 overflow-x-auto">
{`<Directory /path/to/your/api>
    Options Indexes FollowSymLinks
    AllowOverride All
    Require all granted
</Directory>`}
                </pre>
                <li>Restart Apache: <code>sudo systemctl restart apache2</code></li>
              </ol>
            </AlertDescription>
          </Alert>
        </div>
      </CardContent>
    </Card>
  );
};

export default DeploymentGuide;
