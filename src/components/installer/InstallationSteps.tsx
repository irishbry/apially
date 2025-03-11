
import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

const InstallationSteps: React.FC = () => {
  const [isOpenFTP, setIsOpenFTP] = useState(false);
  const [isOpenCPanel, setIsOpenCPanel] = useState(false);
  const [isOpenConfig, setIsOpenConfig] = useState(false);

  return (
    <ol className="list-decimal list-inside space-y-3 text-sm mt-4">
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
              <li>Upload the downloaded ZIP file to your document root</li>
              <li>Extract the ZIP file in place</li>
              <li><strong className="text-amber-700">Very Important:</strong> Ensure the api/.htaccess file was properly extracted - to see hidden files in cPanel File Manager, click "Settings" then check "Show Hidden Files"</li>
            </ul>
            
            <p className="mt-2">Option 2: Using FTP</p>
            <ul className="list-disc list-inside ml-3">
              <li>Connect to your server using an FTP client (like FileZilla)</li>
              <li>Navigate to your website's document root</li>
              <li>Upload all extracted files to this directory</li>
              <li>Make sure to include the .htaccess file (enable "Show hidden files" in your FTP client)</li>
            </ul>
          </CollapsibleContent>
        </Collapsible>
      </li>
      
      <li>
        <Collapsible open={isOpenConfig} onOpenChange={setIsOpenConfig} className="space-y-2">
          <CollapsibleTrigger className="font-medium flex items-center">
            Run the installation check
            {isOpenConfig ? <ChevronUp className="h-4 w-4 ml-2" /> : <ChevronDown className="h-4 w-4 ml-2" />}
          </CollapsibleTrigger>
          <CollapsibleContent className="pl-5 space-y-2 text-muted-foreground">
            <p>After uploading and extracting the files:</p>
            <ol className="list-decimal list-inside ml-3">
              <li>Go to <code>https://yourdomain.com/install.php</code> in your browser</li>
              <li>This will run a comprehensive check of your installation</li>
              <li>If any issues are found, follow the instructions on the page to fix them</li>
              <li>Most common issues:
                <ul className="list-disc list-inside ml-5">
                  <li>Missing .htaccess file (hidden file issue)</li>
                  <li>Permissions on the data directory</li>
                  <li>mod_rewrite not enabled in Apache</li>
                  <li>PHP version too old</li>
                </ul>
              </li>
              <li>For detailed diagnostics, access <code>https://yourdomain.com/api/test.php</code></li>
            </ol>
          </CollapsibleContent>
        </Collapsible>
      </li>
      
      <li className="font-medium">Start using the API with your application</li>
    </ol>
  );
};

export default InstallationSteps;
