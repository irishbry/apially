
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Download, ExternalLink, Server, CheckCircle2, Database, Globe, Code, ArrowRight } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { packageFrontendFiles, packageApiFiles, packageCompleteProject } from '@/utils/packageUtils';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

const DeploymentInstructions = () => {
  const { toast } = useToast();
  const [isDownloadingFrontend, setIsDownloadingFrontend] = React.useState(false);
  const [isDownloadingAPI, setIsDownloadingAPI] = React.useState(false);
  const [isDownloadingComplete, setIsDownloadingComplete] = React.useState(false);
  const [openSection, setOpenSection] = React.useState<string | null>(null);

  const toggleSection = (section: string) => {
    setOpenSection(openSection === section ? null : section);
  };

  const downloadFrontendFiles = async () => {
    setIsDownloadingFrontend(true);
    
    try {
      await packageFrontendFiles();
      
      toast({
        title: "Frontend files downloaded",
        description: "Your frontend files package is ready. Extract and upload to your server.",
      });
    } catch (error) {
      console.error("Error creating frontend package:", error);
      toast({
        title: "Download failed",
        description: "There was an error creating the frontend package.",
        variant: "destructive"
      });
    } finally {
      setIsDownloadingFrontend(false);
    }
  };

  const downloadAPIFiles = async () => {
    setIsDownloadingAPI(true);
    
    try {
      await packageApiFiles();
      
      toast({
        title: "API files downloaded",
        description: "Your API files package is ready. Extract and upload to an 'api' directory on your server.",
      });
    } catch (error) {
      console.error("Error creating API package:", error);
      toast({
        title: "Download failed",
        description: "There was an error creating the API package.",
        variant: "destructive"
      });
    } finally {
      setIsDownloadingAPI(false);
    }
  };

  const downloadCompleteProject = async () => {
    setIsDownloadingComplete(true);
    
    try {
      await packageCompleteProject();
      
      toast({
        title: "Complete project downloaded",
        description: "Your complete project package is ready for deployment.",
      });
    } catch (error) {
      console.error("Error creating complete package:", error);
      toast({
        title: "Download failed",
        description: "There was an error creating the complete project package.",
        variant: "destructive"
      });
    } finally {
      setIsDownloadingComplete(false);
    }
  };

  return (
    <Card className="w-full shadow-sm hover:shadow-md transition-all duration-300">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-xl font-medium">
          <FileText className="h-5 w-5 text-primary" />
          Complete Deployment Instructions
        </CardTitle>
        <CardDescription>
          Step-by-step guide for deploying this application in a production environment
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <Alert variant="default" className="mb-4 bg-blue-50 border-blue-200 text-blue-800">
            <Server className="h-4 w-4" />
            <AlertTitle>Production Deployment Package</AlertTitle>
            <AlertDescription>
              This guide helps you deploy both the frontend and backend components of this application on a production server.
              Download the complete package or individual components based on your needs.
            </AlertDescription>
          </Alert>

          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <Button 
              className="flex-1 gap-2" 
              onClick={downloadCompleteProject}
              disabled={isDownloadingComplete}
            >
              {isDownloadingComplete ? (
                <>
                  <div className="h-4 w-4 border-2 border-t-transparent border-white rounded-full animate-spin" />
                  Creating Package...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4" />
                  Download Complete Project
                </>
              )}
            </Button>
            <Button 
              variant="outline" 
              className="flex-1 gap-2" 
              onClick={downloadFrontendFiles}
              disabled={isDownloadingFrontend}
            >
              {isDownloadingFrontend ? (
                <>
                  <div className="h-4 w-4 border-2 border-t-transparent border-current rounded-full animate-spin" />
                  Creating Package...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4" />
                  Download Frontend Only
                </>
              )}
            </Button>
            <Button 
              variant="outline" 
              className="flex-1 gap-2" 
              onClick={downloadAPIFiles}
              disabled={isDownloadingAPI}
            >
              {isDownloadingAPI ? (
                <>
                  <div className="h-4 w-4 border-2 border-t-transparent border-current rounded-full animate-spin" />
                  Creating Package...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4" />
                  Download API Only
                </>
              )}
            </Button>
          </div>

          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid grid-cols-4 mb-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="frontend">Frontend</TabsTrigger>
              <TabsTrigger value="backend">Backend API</TabsTrigger>
              <TabsTrigger value="configuration">Configuration</TabsTrigger>
            </TabsList>
            
            <TabsContent value="overview" className="space-y-4">
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Deployment Overview</h3>
                
                <div className="bg-muted p-4 rounded-md">
                  <h4 className="font-medium mb-2 flex items-center">
                    <CheckCircle2 className="h-4 w-4 mr-2 text-green-500" />
                    Architecture Overview
                  </h4>
                  <p className="mb-4 text-sm">This application consists of two main components:</p>
                  <div className="flex flex-col md:flex-row gap-4 mb-4">
                    <div className="flex-1 border rounded-md p-3">
                      <div className="flex items-center gap-2 mb-2">
                        <Globe className="h-4 w-4 text-blue-500" /> 
                        <h5 className="font-medium">Frontend (React)</h5>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        A React application that provides the user interface. It communicates with the backend API to fetch and store data.
                      </p>
                    </div>
                    <div className="flex items-center justify-center text-muted-foreground">
                      <ArrowRight className="h-5 w-5 rotate-90 md:rotate-0" />
                    </div>
                    <div className="flex-1 border rounded-md p-3">
                      <div className="flex items-center gap-2 mb-2">
                        <Database className="h-4 w-4 text-green-500" /> 
                        <h5 className="font-medium">Backend (PHP API)</h5>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        A PHP-based API that handles data processing and storage. It uses a simple file-based storage system.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-muted p-4 rounded-md">
                  <h4 className="font-medium mb-2 flex items-center">
                    <CheckCircle2 className="h-4 w-4 mr-2 text-green-500" />
                    Deployment Options
                  </h4>
                  <div className="space-y-3">
                    <div className="border rounded-md p-3">
                      <h5 className="font-medium mb-1">Option 1: Single Server (Recommended)</h5>
                      <p className="text-sm text-muted-foreground">
                        Deploy both frontend and backend on the same server. This is the simplest option and works well for most use cases.
                      </p>
                    </div>
                    <div className="border rounded-md p-3">
                      <h5 className="font-medium mb-1">Option 2: Separate Servers</h5>
                      <p className="text-sm text-muted-foreground">
                        Deploy the frontend on a static hosting service and the backend on a PHP-compatible server. This is more complex but provides greater scalability.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-muted p-4 rounded-md">
                  <h4 className="font-medium mb-2 flex items-center">
                    <CheckCircle2 className="h-4 w-4 mr-2 text-green-500" />
                    Deployment Process
                  </h4>
                  <ol className="list-decimal list-inside text-sm space-y-2">
                    <li className="font-medium">Download the deployment package</li>
                    <li>Set up your web server (Apache/Nginx)</li>
                    <li>Deploy the frontend files</li>
                    <li>Deploy the backend API</li>
                    <li>Configure the API</li>
                    <li>Test the application</li>
                  </ol>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="frontend" className="space-y-4">
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Frontend Deployment</h3>
                
                <Collapsible open={openSection === 'frontend-prereq'} onOpenChange={() => toggleSection('frontend-prereq')} className="w-full">
                  <CollapsibleTrigger className="flex w-full items-center justify-between bg-muted p-4 rounded-md">
                    <h4 className="font-medium flex items-center">
                      <CheckCircle2 className="h-4 w-4 mr-2 text-green-500" />
                      Prerequisites
                    </h4>
                    <Code className="h-4 w-4" />
                  </CollapsibleTrigger>
                  <CollapsibleContent className="px-4 pb-4 pt-2 bg-muted/50 rounded-b-md">
                    <p className="mb-2 text-sm">To deploy the frontend, you'll need:</p>
                    <ul className="list-disc list-inside text-sm space-y-1">
                      <li>A web server (Apache, Nginx, or any static file server)</li>
                      <li>Node.js and npm (only if you need to rebuild the frontend)</li>
                    </ul>
                  </CollapsibleContent>
                </Collapsible>

                <Collapsible open={openSection === 'frontend-build'} onOpenChange={() => toggleSection('frontend-build')} className="w-full">
                  <CollapsibleTrigger className="flex w-full items-center justify-between bg-muted p-4 rounded-md">
                    <h4 className="font-medium flex items-center">
                      <CheckCircle2 className="h-4 w-4 mr-2 text-green-500" />
                      Building the Frontend (Optional)
                    </h4>
                    <Code className="h-4 w-4" />
                  </CollapsibleTrigger>
                  <CollapsibleContent className="px-4 pb-4 pt-2 bg-muted/50 rounded-b-md">
                    <p className="mb-2 text-sm">The download package includes pre-built files, but if you need to rebuild:</p>
                    <div className="bg-secondary/30 p-3 rounded text-xs font-mono whitespace-pre overflow-x-auto mb-2">
{`# Navigate to the frontend directory
cd frontend

# Install dependencies
npm install

# Build the project
npm run build

# The build files will be in the 'dist' directory`}
                    </div>
                    <p className="text-sm text-muted-foreground">The resulting files in the 'dist' directory are what you'll deploy to your server.</p>
                  </CollapsibleContent>
                </Collapsible>

                <Collapsible open={openSection === 'frontend-deploy'} onOpenChange={() => toggleSection('frontend-deploy')} className="w-full">
                  <CollapsibleTrigger className="flex w-full items-center justify-between bg-muted p-4 rounded-md">
                    <h4 className="font-medium flex items-center">
                      <CheckCircle2 className="h-4 w-4 mr-2 text-green-500" />
                      Deploying the Frontend
                    </h4>
                    <Code className="h-4 w-4" />
                  </CollapsibleTrigger>
                  <CollapsibleContent className="px-4 pb-4 pt-2 bg-muted/50 rounded-b-md">
                    <ol className="list-decimal list-inside text-sm space-y-2">
                      <li>Extract the frontend files from the downloaded package</li>
                      <li>Upload all files to your web server's root directory (often called public_html, www, or htdocs)</li>
                      <li>Ensure the main index.html file is in the root directory</li>
                      <li>If you're using Apache, make sure the .htaccess file is also uploaded</li>
                    </ol>
                    <div className="mt-3 p-3 border rounded-md">
                      <h5 className="font-medium text-sm mb-1">Important: HTML5 Routing Configuration</h5>
                      <p className="text-sm text-muted-foreground mb-2">
                        Since this is a single-page application, you need to configure your server to redirect all requests to index.html:
                      </p>
                      <div className="text-xs font-medium mb-1">For Apache (.htaccess file included in package):</div>
                      <div className="bg-secondary/30 p-2 rounded text-xs font-mono whitespace-pre overflow-x-auto mb-2">
{`<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  RewriteRule ^index\\.html$ - [L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule . /index.html [L]
</IfModule>`}
                      </div>
                      <div className="text-xs font-medium mb-1">For Nginx:</div>
                      <div className="bg-secondary/30 p-2 rounded text-xs font-mono whitespace-pre overflow-x-auto">
{`location / {
  try_files $uri $uri/ /index.html;
}`}
                      </div>
                    </div>
                  </CollapsibleContent>
                </Collapsible>

                <Collapsible open={openSection === 'frontend-config'} onOpenChange={() => toggleSection('frontend-config')} className="w-full">
                  <CollapsibleTrigger className="flex w-full items-center justify-between bg-muted p-4 rounded-md">
                    <h4 className="font-medium flex items-center">
                      <CheckCircle2 className="h-4 w-4 mr-2 text-green-500" />
                      Configuring the Frontend
                    </h4>
                    <Code className="h-4 w-4" />
                  </CollapsibleTrigger>
                  <CollapsibleContent className="px-4 pb-4 pt-2 bg-muted/50 rounded-b-md">
                    <p className="mb-2 text-sm">The frontend needs to know the URL of your API. There are two ways to configure this:</p>
                    <ol className="list-decimal list-inside text-sm space-y-2">
                      <li>
                        <strong>Automatic Configuration (Recommended)</strong>
                        <p className="ml-7 mt-1 text-muted-foreground">If you deploy both frontend and backend on the same server, the frontend will automatically look for the API at /api/ path.</p>
                      </li>
                      <li>
                        <strong>Manual Configuration</strong>
                        <p className="ml-7 mt-1 text-muted-foreground">If your API is at a different URL, you'll need to set the API URL in the settings after logging in.</p>
                      </li>
                    </ol>
                  </CollapsibleContent>
                </Collapsible>
              </div>
            </TabsContent>
            
            <TabsContent value="backend" className="space-y-4">
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Backend API Deployment</h3>
                
                <Collapsible open={openSection === 'backend-prereq'} onOpenChange={() => toggleSection('backend-prereq')} className="w-full">
                  <CollapsibleTrigger className="flex w-full items-center justify-between bg-muted p-4 rounded-md">
                    <h4 className="font-medium flex items-center">
                      <CheckCircle2 className="h-4 w-4 mr-2 text-green-500" />
                      Prerequisites
                    </h4>
                    <Code className="h-4 w-4" />
                  </CollapsibleTrigger>
                  <CollapsibleContent className="px-4 pb-4 pt-2 bg-muted/50 rounded-b-md">
                    <p className="mb-2 text-sm">To deploy the backend API, you'll need:</p>
                    <ul className="list-disc list-inside text-sm space-y-1">
                      <li>A web server with PHP 7.0 or higher</li>
                      <li>Apache with mod_rewrite enabled (recommended) or Nginx</li>
                      <li>PHP extensions: json, curl</li>
                    </ul>
                  </CollapsibleContent>
                </Collapsible>

                <Collapsible open={openSection === 'backend-deploy'} onOpenChange={() => toggleSection('backend-deploy')} className="w-full">
                  <CollapsibleTrigger className="flex w-full items-center justify-between bg-muted p-4 rounded-md">
                    <h4 className="font-medium flex items-center">
                      <CheckCircle2 className="h-4 w-4 mr-2 text-green-500" />
                      Deploying the Backend API
                    </h4>
                    <Code className="h-4 w-4" />
                  </CollapsibleTrigger>
                  <CollapsibleContent className="px-4 pb-4 pt-2 bg-muted/50 rounded-b-md">
                    <ol className="list-decimal list-inside text-sm space-y-2">
                      <li>Extract the API files from the downloaded package</li>
                      <li>Create a folder called <strong>api</strong> in your web server's root directory</li>
                      <li>Upload all API files to the <strong>api</strong> folder</li>
                      <li>
                        <strong className="text-amber-800">Make sure hidden files are also uploaded!</strong>
                        <ul className="list-disc list-inside ml-5 text-muted-foreground mt-1">
                          <li>In cPanel File Manager: Click "Settings" and check "Show Hidden Files (dotfiles)"</li>
                          <li>In FileZilla (FTP): Go to Server {'>'} Force showing hidden files</li>
                        </ul>
                      </li>
                      <li>Verify the .htaccess file is present in the api folder</li>
                      <li>Set appropriate file permissions:
                        <ul className="list-disc list-inside ml-5 text-muted-foreground mt-1">
                          <li>Directories: 755 (chmod 755 directory-name)</li>
                          <li>Files: 644 (chmod 644 file-name)</li>
                          <li>Data directory: 755 (chmod 755 data)</li>
                        </ul>
                      </li>
                    </ol>
                  </CollapsibleContent>
                </Collapsible>

                <Collapsible open={openSection === 'backend-config'} onOpenChange={() => toggleSection('backend-config')} className="w-full">
                  <CollapsibleTrigger className="flex w-full items-center justify-between bg-muted p-4 rounded-md">
                    <h4 className="font-medium flex items-center">
                      <CheckCircle2 className="h-4 w-4 mr-2 text-green-500" />
                      Configuring the Backend API
                    </h4>
                    <Code className="h-4 w-4" />
                  </CollapsibleTrigger>
                  <CollapsibleContent className="px-4 pb-4 pt-2 bg-muted/50 rounded-b-md">
                    <ol className="list-decimal list-inside text-sm space-y-2">
                      <li>Edit the <code>config.php</code> file in the api folder:
                        <ul className="list-disc list-inside ml-5 text-muted-foreground mt-1">
                          <li>Change <code>'your-secure-api-key-here'</code> to a strong password you create</li>
                          <li>If needed, change the <code>'*'</code> in <code>allowed_origins</code> to your domain (e.g., <code>'https://yourdomain.com'</code>)</li>
                        </ul>
                      </li>
                      <li>Check the .htaccess file in the api folder:
                        <ul className="list-disc list-inside ml-5 text-muted-foreground mt-1">
                          <li>Make sure the <code>RewriteBase</code> is set correctly (e.g., <code>RewriteBase /api/</code>)</li>
                          <li>If your API is not in an "/api/" directory, update this value accordingly</li>
                        </ul>
                      </li>
                    </ol>
                  </CollapsibleContent>
                </Collapsible>

                <Collapsible open={openSection === 'backend-test'} onOpenChange={() => toggleSection('backend-test')} className="w-full">
                  <CollapsibleTrigger className="flex w-full items-center justify-between bg-muted p-4 rounded-md">
                    <h4 className="font-medium flex items-center">
                      <CheckCircle2 className="h-4 w-4 mr-2 text-green-500" />
                      Testing the Backend API
                    </h4>
                    <Code className="h-4 w-4" />
                  </CollapsibleTrigger>
                  <CollapsibleContent className="px-4 pb-4 pt-2 bg-muted/50 rounded-b-md">
                    <p className="mb-2 text-sm">After deployment, test the API to make sure it's working correctly:</p>
                    <ol className="list-decimal list-inside text-sm space-y-2">
                      <li>Go to <code>https://yourdomain.com/api/test.php</code> in your browser</li>
                      <li>This page will run a series of tests to verify your API installation</li>
                      <li>If all tests pass, your API is properly configured</li>
                      <li>If any tests fail, follow the troubleshooting guidance provided on the test page</li>
                    </ol>
                  </CollapsibleContent>
                </Collapsible>
              </div>
            </TabsContent>
            
            <TabsContent value="configuration" className="space-y-4">
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Configuration and First Steps</h3>
                
                <div className="bg-muted p-4 rounded-md">
                  <h4 className="font-medium mb-2 flex items-center">
                    <CheckCircle2 className="h-4 w-4 mr-2 text-green-500" />
                    File Structure After Deployment
                  </h4>
                  <p className="mb-2 text-sm">Your server should have this structure after deployment:</p>
                  <div className="bg-secondary/30 p-3 rounded text-xs font-mono whitespace-pre overflow-x-auto">
{`public_html/ (or www/)
├── index.html           <-- Frontend files
├── assets/              <-- Frontend files
│   └── ...more files
├── .htaccess            <-- Frontend routing (if using Apache)
└── api/                 <-- API folder
    ├── index.php        <-- API files
    ├── .htaccess        <-- IMPORTANT! (Hidden file)
    ├── config.php       <-- API configuration
    ├── test.php         <-- API test script
    └── ...more files`}
                  </div>
                </div>
                
                <div className="bg-muted p-4 rounded-md">
                  <h4 className="font-medium mb-2 flex items-center">
                    <CheckCircle2 className="h-4 w-4 mr-2 text-green-500" />
                    First Steps After Deployment
                  </h4>
                  <ol className="list-decimal list-inside text-sm space-y-2">
                    <li>Visit your domain (e.g., <code>https://yourdomain.com</code>) to access the application</li>
                    <li>Log in using the default credentials (username: <code>admin</code>, password: <code>admin</code>)</li>
                    <li><strong>Immediately change the password</strong> in the Settings tab</li>
                    <li>Configure your API key to match the one you set in <code>config.php</code></li>
                    <li>Start adding your data sources and configuring your schema</li>
                  </ol>
                </div>
                
                <div className="bg-muted p-4 rounded-md">
                  <h4 className="font-medium mb-2 flex items-center">
                    <CheckCircle2 className="h-4 w-4 mr-2 text-green-500" />
                    Security Considerations
                  </h4>
                  <ul className="list-disc list-inside text-sm space-y-2">
                    <li>Use HTTPS for your domain (obtain an SSL certificate)</li>
                    <li>Set a strong API key in the config.php file</li>
                    <li>Change the default admin password immediately</li>
                    <li>Restrict direct access to the data directory</li>
                    <li>Keep your server and PHP up to date with security patches</li>
                  </ul>
                </div>
                
                <Alert variant="default" className="mb-4 bg-green-50 border-green-200 text-green-800">
                  <CheckCircle2 className="h-4 w-4" />
                  <AlertTitle>Need More Help?</AlertTitle>
                  <AlertDescription className="text-sm">
                    If you encounter any issues during deployment, please check the Troubleshooting section in the API test page.
                    For direct support, contact us at support@csvscrub.com.
                  </AlertDescription>
                </Alert>
              </div>
            </TabsContent>
          </Tabs>
          
          <Separator className="my-6" />
          
          <div className="space-y-3">
            <h3 className="text-lg font-medium">Troubleshooting Common Issues</h3>
            <div className="space-y-2">
              <Collapsible open={openSection === 'trouble-api'} onOpenChange={() => toggleSection('trouble-api')} className="w-full">
                <CollapsibleTrigger className="flex w-full items-center justify-between p-4 border rounded-md">
                  <h4 className="font-medium flex items-center">
                    API Connectivity Error (404)
                  </h4>
                  <Code className="h-4 w-4" />
                </CollapsibleTrigger>
                <CollapsibleContent className="px-4 pb-4 pt-2 rounded-b-md">
                  <ul className="list-disc list-inside text-sm space-y-1">
                    <li>Check that all files are in the correct location</li>
                    <li><strong className="text-amber-800">Make sure .htaccess file is uploaded and readable by the server (it's often hidden in FTP clients)</strong></li>
                    <li>To see hidden files in cPanel File Manager: Click "Settings" and check "Show Hidden Files (dotfiles)"</li>
                    <li>In FileZilla (FTP): Go to Server {'>'} Force showing hidden files</li>
                    <li>Verify mod_rewrite is enabled in your Apache configuration</li>
                    <li>Check that your .htaccess has the correct RewriteBase directive</li>
                    <li>Ensure your Apache configuration has <code>AllowOverride All</code> for the directory</li>
                  </ul>
                </CollapsibleContent>
              </Collapsible>
              
              <Collapsible open={openSection === 'trouble-500'} onOpenChange={() => toggleSection('trouble-500')} className="w-full">
                <CollapsibleTrigger className="flex w-full items-center justify-between p-4 border rounded-md">
                  <h4 className="font-medium flex items-center">
                    Server Error (500)
                  </h4>
                  <Code className="h-4 w-4" />
                </CollapsibleTrigger>
                <CollapsibleContent className="px-4 pb-4 pt-2 rounded-b-md">
                  <ul className="list-disc list-inside text-sm space-y-1">
                    <li>Check your server's error logs for specific PHP errors</li>
                    <li>Verify PHP version is 7.0 or higher</li>
                    <li>Make sure all required PHP extensions are enabled (curl, json)</li>
                    <li>Check file permissions (644 for files, 755 for directories)</li>
                    <li>Try accessing the test.php file directly to see more detailed errors</li>
                  </ul>
                </CollapsibleContent>
              </Collapsible>
              
              <Collapsible open={openSection === 'trouble-cors'} onOpenChange={() => toggleSection('trouble-cors')} className="w-full">
                <CollapsibleTrigger className="flex w-full items-center justify-between p-4 border rounded-md">
                  <h4 className="font-medium flex items-center">
                    CORS Errors
                  </h4>
                  <Code className="h-4 w-4" />
                </CollapsibleTrigger>
                <CollapsibleContent className="px-4 pb-4 pt-2 rounded-b-md">
                  <p className="mb-2 text-sm">If you're experiencing CORS errors:</p>
                  <ol className="list-decimal list-inside text-sm space-y-1">
                    <li>Edit config.php and update the allowed_origins array with your frontend domain:
                      <div className="bg-secondary/30 p-2 rounded text-xs font-mono whitespace-pre overflow-x-auto mt-1">
{`'allowed_origins' => ['https://yourdomain.com'], // Replace with your frontend domain`}
                      </div>
                    </li>
                    <li>Make sure your API is served over HTTPS if your frontend is on HTTPS</li>
                    <li>Check that the .htaccess file has the proper CORS headers</li>
                  </ol>
                </CollapsibleContent>
              </Collapsible>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default DeploymentInstructions;
