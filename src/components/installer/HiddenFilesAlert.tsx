
import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const HiddenFilesAlert: React.FC = () => {
  return (
    <Alert variant="default" className="mb-4 bg-amber-50 border-amber-200 text-amber-800">
      <AlertTriangle className="h-4 w-4" />
      <AlertTitle>Important Note About Hidden Files</AlertTitle>
      <AlertDescription>
        <p className="mb-2">The <strong>.htaccess</strong> file is <strong>critical</strong> for the API to work but may be hidden in your file browser.</p>
        <ul className="list-disc list-inside mt-2 space-y-1 text-sm">
          <li>In cPanel File Manager: Click on "Settings" and check "Show Hidden Files (dotfiles)"</li>
          <li>In FTP clients: Enable "Show hidden files" option</li>
          <li>In Windows Explorer: Enable "Show hidden files" in folder options</li>
          <li>In macOS Finder: Press Cmd+Shift+. (period) to toggle hidden files</li>
        </ul>
        <p className="mt-2">Without this file, you will get 404 errors when accessing API endpoints.</p>
      </AlertDescription>
    </Alert>
  );
};

export default HiddenFilesAlert;
