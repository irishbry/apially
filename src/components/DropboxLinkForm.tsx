
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, Cloud, HelpCircle, Download, Upload, Key } from "lucide-react";
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
  const [dropboxToken, setDropboxToken] = useState('');
  const [isValidConfig, setIsValidConfig] = useState(false);
  const [isCreatingBackup, setIsCreatingBackup] = useState(false);
  const [isSettingUpDaily, setIsSettingUpDaily] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const savedLink = ApiService.getDropboxLink();
    const savedToken = ApiService.getDropboxToken();
    if (savedLink && savedToken) {
      setDropboxLink(savedLink);
      setDropboxToken(savedToken);
      validateDropboxConfig(savedLink, savedToken);
    }
  }, []);

  const validateDropboxConfig = async (link: string, token: string) => {
    const isValid = await DropboxBackupService.testDropboxConnection(link, token);
    setIsValidConfig(isValid);
  };

  const saveDropboxConfig = async () => {
    try {
      if (!dropboxLink || !dropboxToken) {
        toast({
          title: "Error",
          description: "Please enter both Dropbox folder path and API token",
          variant: "destructive",
        });
        return;
      }

      const isValid = await DropboxBackupService.testDropboxConnection(dropboxLink, dropboxToken);
      
      if (!isValid) {
        toast({
          title: "Invalid Configuration",
          description: "Please check your Dropbox folder path and API token",
          variant: "destructive",
        });
        return;
      }

      ApiService.setDropboxLink(dropboxLink);
      ApiService.setDropboxToken(dropboxToken);
      setIsValidConfig(true);
      
      toast({
        title: "Success",
        description: "Dropbox configuration saved successfully!",
      });
    } catch (error) {
      console.error('Error saving Dropbox config:', error);
      toast({
        title: "Error",
        description: "Failed to save Dropbox configuration",
        variant: "destructive",
      });
    }
  };

  const setupDailyBackups = async () => {
    try {
      setIsSettingUpDaily(true);
      
      const success = await DropboxBackupService.setupAutomaticBackups();
      
      if (success) {
        toast({
          title: "Success",
          description: "Daily automatic backups have been enabled!",
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to setup automatic backups",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error setting up daily backups:', error);
      toast({
        title: "Error",
        description: "Failed to setup automatic backups",
        variant: "destructive",
      });
    } finally {
      setIsSettingUpDaily(false);
    }
  };

  const createManualBackup = async () => {
    try {
      setIsCreatingBackup(true);
      
      const success = await DropboxBackupService.createDailyBackup('current-user', 'csv');
      
      if (success) {
        toast({
          title: "Success",
          description: "Manual backup uploaded to Dropbox successfully!",
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to upload backup to Dropbox",
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
          Dropbox Backup Configuration
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent>
                <p className="max-w-xs">Configure your Dropbox API token and folder path for automatic daily backups. You'll need to create a Dropbox app to get an API token.</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </CardTitle>
        <CardDescription>
          Set up automatic daily backups to your Dropbox account
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Dropbox Folder Path</label>
            <Input
              type="text"
              placeholder="/Backups/MyApp"
              value={dropboxLink}
              onChange={(e) => {
                setDropboxLink(e.target.value);
                if (e.target.value && dropboxToken) {
                  validateDropboxConfig(e.target.value, dropboxToken);
                }
              }}
              className="w-full"
            />
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center gap-2">
              <Key className="h-4 w-4" />
              Dropbox API Token
            </label>
            <Input
              type="password"
              placeholder="sl.xxxxxxxxxxxxxxxxx"
              value={dropboxToken}
              onChange={(e) => {
                setDropboxToken(e.target.value);
                if (e.target.value && dropboxLink) {
                  validateDropboxConfig(dropboxLink, e.target.value);
                }
              }}
              className="w-full"
            />
            <p className="text-xs text-muted-foreground">
              Get your API token from the <a href="https://www.dropbox.com/developers/apps" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Dropbox Developer Console</a>
            </p>
          </div>
          
          {dropboxLink && dropboxToken && (
            <div className="text-sm">
              {isValidConfig ? (
                <span className="text-green-600">✓ Valid Dropbox configuration</span>
              ) : (
                <span className="text-red-600">✗ Invalid configuration - check your folder path and token</span>
              )}
            </div>
          )}
          
          {isValidConfig && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center gap-2 text-green-800 text-sm">
                <Check className="h-4 w-4" />
                <span>Dropbox configuration is valid</span>
              </div>
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter className="flex gap-2 justify-end">
        {isValidConfig && (
          <>
            <Button 
              onClick={createManualBackup} 
              variant="outline" 
              disabled={isCreatingBackup}
              className="hover-lift"
            >
              <Upload className="mr-2 h-4 w-4" />
              {isCreatingBackup ? 'Uploading...' : 'Backup Now'}
            </Button>
            <Button 
              onClick={setupDailyBackups} 
              variant="outline" 
              disabled={isSettingUpDaily}
              className="hover-lift"
            >
              <Cloud className="mr-2 h-4 w-4" />
              {isSettingUpDaily ? 'Setting up...' : 'Enable Daily Backups'}
            </Button>
          </>
        )}
        <Button onClick={saveDropboxConfig} className="hover-lift">
          <Check className="mr-2 h-4 w-4" />
          Save Configuration
        </Button>
      </CardFooter>
    </Card>
  );
};

export default DropboxLinkForm;
