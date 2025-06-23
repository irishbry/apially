
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, Cloud, HelpCircle, Download, Upload } from "lucide-react";
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";
import { ApiService } from "@/services/ApiService";
import { DropboxBackupService } from "@/services/DropboxBackupService";

const DropboxLinkForm: React.FC = () => {
  const [dropboxLink, setDropboxLink] = useState('');
  const [isValidLink, setIsValidLink] = useState(false);
  const [isCreatingBackup, setIsCreatingBackup] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const savedLink = ApiService.getDropboxLink();
    if (savedLink) {
      setDropboxLink(savedLink);
      validateDropboxLink(savedLink);
    }
  }, []);

  const validateDropboxLink = async (link: string) => {
    const isValid = await DropboxBackupService.testDropboxConnection(link);
    setIsValidLink(isValid);
  };

  const saveDropboxLink = async () => {
    try {
      if (!dropboxLink) {
        toast({
          title: "Error",
          description: "Please enter a Dropbox link",
          variant: "destructive",
        });
        return;
      }

      const isValid = await DropboxBackupService.testDropboxConnection(dropboxLink);
      
      if (!isValid) {
        toast({
          title: "Invalid Link",
          description: "Please enter a valid Dropbox shared folder link",
          variant: "destructive",
        });
        return;
      }

      ApiService.setDropboxLink(dropboxLink);
      setIsValidLink(true);
      
      toast({
        title: "Success",
        description: "Dropbox link saved successfully! Daily backups will be automatically uploaded.",
      });

      // Set up automatic backups
      await DropboxBackupService.setupAutomaticBackups();
    } catch (error) {
      console.error('Error saving Dropbox link:', error);
      toast({
        title: "Error",
        description: "Failed to save Dropbox link",
        variant: "destructive",
      });
    }
  };

  const createManualBackup = async () => {
    try {
      setIsCreatingBackup(true);
      
      const success = await DropboxBackupService.createDailyBackup('current-user', 'csv');
      
      if (success) {
        toast({
          title: "Success",
          description: "Manual backup created successfully!",
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to create backup. Make sure your Dropbox link is configured.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error creating manual backup:', error);
      toast({
        title: "Error",
        description: "Failed to create backup",
        variant: "destructive",
      });
    } finally {
      setIsCreatingBackup(false);
    }
  };

  return (
    <Card className="w-full shadow-sm hover:shadow-md transition-all duration-300">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-xl font-medium">
          <Cloud className="h-5 w-5 text-primary" />
          Dropbox Configuration
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent>
                <p className="max-w-xs">Enter your Dropbox shared folder link where daily backups will be uploaded automatically. Make sure the folder is public and has proper permissions.</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </CardTitle>
        <CardDescription>
          Configure automatic daily backups to your Dropbox folder
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="space-y-2">
            <Input
              type="text"
              placeholder="https://www.dropbox.com/scl/fo/your-shared-folder"
              value={dropboxLink}
              onChange={(e) => {
                setDropboxLink(e.target.value);
                if (e.target.value) {
                  validateDropboxLink(e.target.value);
                }
              }}
              className="w-full"
            />
            {dropboxLink && (
              <div className="text-sm">
                {isValidLink ? (
                  <span className="text-green-600">✓ Valid Dropbox link</span>
                ) : (
                  <span className="text-red-600">✗ Invalid Dropbox link format</span>
                )}
              </div>
            )}
          </div>
          
          {isValidLink && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center gap-2 text-green-800 text-sm">
                <Check className="h-4 w-4" />
                <span>Daily backups are enabled and will be uploaded automatically</span>
              </div>
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter className="flex gap-2 justify-end">
        {isValidLink && (
          <Button 
            onClick={createManualBackup} 
            variant="outline" 
            disabled={isCreatingBackup}
            className="hover-lift"
          >
            <Upload className="mr-2 h-4 w-4" />
            {isCreatingBackup ? 'Creating...' : 'Create Backup Now'}
          </Button>
        )}
        <Button onClick={saveDropboxLink} className="hover-lift">
          <Check className="mr-2 h-4 w-4" />
          Save Link
        </Button>
      </CardFooter>
    </Card>
  );
};

export default DropboxLinkForm;
