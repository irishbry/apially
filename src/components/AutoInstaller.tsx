
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Download, Server, FileCode, CheckSquare, FileText, AlertTriangle, ArrowRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import JSZip from 'jszip';
import FileSaver from 'file-saver';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { createInstallerPHP, createReadme } from '@/utils/installerTemplates';

const AutoInstaller: React.FC = () => {
  const [isDownloading, setIsDownloading] = useState(false);
  const { toast } = useToast();

  const handleDownload = async () => {
    setIsDownloading(true);
    
    try {
      // Create a new JSZip instance
      const zip = new JSZip();
      
      // Add installation script
      zip.file("install.php", createInstallerPHP());
      
      // Add README
      zip.file("README.md", createReadme());
      
      // Generate the ZIP file
      const zipContent = await zip.generateAsync({ type: "blob" });
      
      // Save the ZIP file using FileSaver
      FileSaver.saveAs(zipContent, "all-in-one-installer.zip");
      
      // Show success toast
      toast({
        title: "Installation package created!",
        description: "Upload the ZIP file to your server, extract it, and run install.php to complete the installation.",
      });
    } catch (error) {
      console.error("Error creating installation package:", error);
      toast({
        title: "Package creation failed",
        description: "There was an error creating the installation package.",
        variant: "destructive"
      });
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <Card className="w-full shadow-sm hover:shadow-md transition-all duration-300">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-xl font-medium">
          <Server className="h-5 w-5 text-primary" />
          All-in-One Installation Package
        </CardTitle>
        <CardDescription>
          Creates a complete, self-installing package with both frontend and backend components
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <Alert variant="default" className="mb-4 bg-blue-50 border-blue-200 text-blue-800">
            <FileCode className="h-4 w-4" />
            <AlertTitle>Automatic Installation</AlertTitle>
            <AlertDescription>
              <p className="mb-2">This tool creates a single installation package that will automatically set up both the frontend interface and the backend API on your server.</p>
              <p>Just download, upload to your server, and run the installer!</p>
            </AlertDescription>
          </Alert>

          <div className="p-4 bg-primary/5 rounded-md">
            <h3 className="text-sm font-medium mb-2">How It Works</h3>
            <ol className="list-decimal list-inside space-y-2 text-sm">
              <li><strong>Download</strong> the installation package below</li>
              <li><strong>Upload</strong> the ZIP file to your web server (via FTP or cPanel)</li>
              <li><strong>Extract</strong> the ZIP file in your desired location</li>
              <li><strong>Run</strong> install.php by visiting it in your browser (e.g., yourdomain.com/install.php)</li>
              <li>Follow the on-screen instructions to complete the installation</li>
            </ol>
          </div>
          
          <div className="flex justify-center">
            <Button 
              className="gap-2 px-8 py-6 text-lg" 
              onClick={handleDownload} 
              disabled={isDownloading}
            >
              {isDownloading ? (
                <>
                  <div className="h-5 w-5 border-2 border-t-transparent border-white rounded-full animate-spin" />
                  Creating Installation Package...
                </>
              ) : (
                <>
                  <Download className="h-5 w-5" />
                  Download All-in-One Installer
                </>
              )}
            </Button>
          </div>
          
          <Separator className="my-4" />
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-green-50 border border-green-100 rounded-md">
              <h3 className="flex items-center gap-2 text-sm font-medium text-green-800 mb-2">
                <CheckSquare className="h-4 w-4" />
                What's Included
              </h3>
              <ul className="list-disc list-inside space-y-1 text-sm text-green-700">
                <li>Self-installing script (install.php)</li>
                <li>Complete frontend interface</li>
                <li>Backend PHP API</li>
                <li>Data storage configuration</li>
                <li>Detailed installation instructions</li>
              </ul>
            </div>
            
            <div className="p-4 bg-amber-50 border border-amber-100 rounded-md">
              <h3 className="flex items-center gap-2 text-sm font-medium text-amber-800 mb-2">
                <AlertTriangle className="h-4 w-4" />
                Server Requirements
              </h3>
              <ul className="list-disc list-inside space-y-1 text-sm text-amber-700">
                <li>PHP 7.0 or higher</li>
                <li>Apache with mod_rewrite enabled</li>
                <li>PHP extensions: curl, json, zip</li>
                <li>Write permissions (chmod 755) for the installation directory</li>
                <li>AllowOverride All in Apache configuration</li>
              </ul>
            </div>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between items-center bg-slate-50 p-4 rounded-b-lg">
        <div className="text-sm text-muted-foreground">
          <span>Need more detailed instructions?</span>
        </div>
        <Button variant="outline" className="gap-2" onClick={() => window.location.href = "/deploy"}>
          View Detailed Guide
          <ArrowRight className="h-3 w-3" />
        </Button>
      </CardFooter>
    </Card>
  );
};

export default AutoInstaller;
