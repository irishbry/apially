
import React, { useState } from 'react';
import { Download } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import JSZip from 'jszip';
import FileSaver from 'file-saver';
import { createPackageFiles } from "@/utils/installer/packageCreator";

const DownloadButton: React.FC = () => {
  const [isDownloading, setIsDownloading] = useState(false);
  const { toast } = useToast();

  const handleDownload = async () => {
    setIsDownloading(true);
    
    try {
      // Create a new JSZip instance
      const zip = new JSZip();
      
      // Get all the files to include in the package
      const packageFiles = createPackageFiles();
      
      // Add each file to the zip
      for (const file of packageFiles) {
        if (file.directory) {
          zip.folder(file.path);
        } else {
          const folderPath = file.path.split('/').slice(0, -1).join('/');
          if (folderPath) {
            const folder = zip.folder(folderPath);
            if (folder) {
              folder.file(file.path.split('/').pop() || '', file.content);
            }
          } else {
            zip.file(file.path, file.content);
          }
        }
      }
      
      // Generate the ZIP file
      const zipContent = await zip.generateAsync({ type: "blob" });
      
      // Save the ZIP file using FileSaver
      FileSaver.saveAs(zipContent, "data-consolidation-api.zip");
      
      // Show success toast with .htaccess warning
      toast({
        title: "Download started",
        description: "Your installation package is downloading. IMPORTANT: The .htaccess file may be hidden - see htaccess_readme.md in the package.",
        duration: 5000,
      });
    } catch (error) {
      console.error("Error creating ZIP package:", error);
      toast({
        title: "Download failed",
        description: "There was an error creating the installation package.",
        variant: "destructive"
      });
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <Button 
      className="gap-2 mb-4" 
      onClick={handleDownload} 
      disabled={isDownloading}
    >
      {isDownloading ? (
        <>
          <div className="h-4 w-4 border-2 border-t-transparent border-white rounded-full animate-spin" />
          Creating Package...
        </>
      ) : (
        <>
          <Download className="h-4 w-4" />
          Download Installation Package
        </>
      )}
    </Button>
  );
};

export default DownloadButton;
