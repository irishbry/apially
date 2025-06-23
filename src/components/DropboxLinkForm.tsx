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
import { useAuth } from "@/hooks/useAuth";

const DropboxLinkForm: React.FC = () => {
  const [dropboxLink, setDropboxLink] = useState('');
  const [dropboxToken, setDropboxToken] = useState('');
  const [isValidConfig, setIsValidConfig] = useState(false);
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [isCreatingBackup, setIsCreatingBackup] = useState(false);
  const [isSettingUpDaily, setIsSettingUpDaily] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isDailyEnabled, setIsDailyEnabled] = useState(false);
  const [validationMessage, setValidationMessage] = useState('');
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      loadDropboxConfig();
    }
  }, [user]);

  const loadDropboxConfig = async () => {
    try {
      setIsLoading(true);
      const config = await ApiService.getDropboxConfig();
      
      if (config) {
        setDropboxLink(config.dropbox_path);
        setDropboxToken(config.dropbox_token);
        setIsDailyEnabled(config.daily_backup_enabled);
        
        // Test the existing config
        if (config.is_active) {
          setValidationMessage('Testing existing configuration...');
          const isValid = await DropboxBackupService.testDropboxConnection(
            config.dropbox_path, 
            config.dropbox_token
          );
          setIsValidConfig(isValid);
          setValidationMessage(isValid ? 'Configuration is valid' : 'Configuration test failed');
        }
      }
    } catch (error) {
      console.error('Error loading Dropbox config:', error);
      toast({
        title: "Error",
        description: "Failed to load Dropbox configuration",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const testConnection = async () => {
    if (!dropboxLink || !dropboxToken) {
      setValidationMessage('Please enter both folder path and API token');
      setIsValidConfig(false);
      return;
    }

    // Basic validation first
    if (!dropboxLink.startsWith('/')) {
      setValidationMessage('Folder path must start with /');
      setIsValidConfig(false);
      return;
    }

    if (!dropboxToken.startsWith('sl.') && !dropboxToken.startsWith('aal')) {
      setValidationMessage('Invalid token format. Dropbox tokens should start with "sl." or "aal"');
      setIsValidConfig(false);
      return;
    }

    setIsTestingConnection(true);
    setValidationMessage('Testing connection...');

    try {
      const isValid = await DropboxBackupService.testDropboxConnection(dropboxLink, dropboxToken);
      setIsValidConfig(isValid);
      setValidationMessage(isValid ? 'Connection successful!' : 'Connection failed. Please check your token and folder path.');
      
      if (!isValid) {
        toast({
          title: "Connection Failed",
          description: "Please verify your Dropbox API token and folder path. Make sure the folder exists and your token has the necessary permissions.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Connection test error:', error);
      setIsValidConfig(false);
      setValidationMessage('Connection test failed');
      toast({
        title: "Error",
        description: "Failed to test connection",
        variant: "destructive",
      });
    } finally {
      setIsTestingConnection(false);
    }
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

      // Test connection before saving
      setValidationMessage('Testing connection before saving...');
      const isValid = await DropboxBackupService.testDropboxConnection(dropboxLink, dropboxToken);
      
      if (!isValid) {
        toast({
          title: "Invalid Configuration",
          description: "Connection test failed. Please check your Dropbox folder path and API token",
          variant: "destructive",
        });
        return;
      }

      await ApiService.saveDropboxConfig(dropboxLink, dropboxToken, isDailyEnabled);
      setIsValidConfig(true);
      setValidationMessage('Configuration saved successfully!');
      
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
        setIsDailyEnabled(true);
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
      if (!user) {
        toast({
          title: "Error",
          description: "Please log in to create a backup",
          variant: "destructive",
        });
        return;
      }

      setIsCreatingBackup(true);
      
      const success = await DropboxBackupService.createDailyBackup(user.id, 'csv');
      
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

  if (!user) {
    return (
      <Card className="w-full shadow-sm">
        <CardContent className="p-6">
          <p className="text-muted-foreground text-center">Please log in to configure Dropbox backups.</p>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card className="w-full shadow-sm">
        <CardContent className="p-6">
          <p className="text-muted-foreground text-center">Loading Dropbox configuration...</p>
        </CardContent>
      </Card>
    );
  }

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
                setValidationMessage('');
                setIsValidConfig(false);
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
                setValidationMessage('');
                setIsValidConfig(false);
              }}
              className="w-full"
            />
            <p className="text-xs text-muted-foreground">
              Get your API token from the <a href="https://www.dropbox.com/developers/apps" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Dropbox Developer Console</a>
            </p>
          </div>
          
          {dropboxLink && dropboxToken && (
            <div className="space-y-2">
              <Button 
                onClick={testConnection} 
                variant="outline" 
                disabled={isTestingConnection}
                className="w-full"
              >
                {isTestingConnection ? 'Testing...' : 'Test Connection'}
              </Button>
            </div>
          )}
          
          {validationMessage && (
            <div className={`text-sm p-2 rounded ${
              isValidConfig 
                ? 'text-green-600 bg-green-50 border border-green-200' 
                : 'text-orange-600 bg-orange-50 border border-orange-200'
            }`}>
              {isValidConfig ? '✓' : '⚠'} {validationMessage}
            </div>
          )}
          
          {isValidConfig && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center gap-2 text-green-800 text-sm">
                <Check className="h-4 w-4" />
                <span>Dropbox configuration is valid</span>
                {isDailyEnabled && <span className="text-xs">(Daily backups enabled)</span>}
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
            {!isDailyEnabled && (
              <Button 
                onClick={setupDailyBackups} 
                variant="outline" 
                disabled={isSettingUpDaily}
                className="hover-lift"
              >
                <Cloud className="mr-2 h-4 w-4" />
                {isSettingUpDaily ? 'Setting up...' : 'Enable Daily Backups'}
              </Button>
            )}
          </>
        )}
        <Button onClick={saveDropboxConfig} disabled={!isValidConfig} className="hover-lift">
          <Check className="mr-2 h-4 w-4" />
          Save Configuration
        </Button>
      </CardFooter>
    </Card>
  );
};

export default DropboxLinkForm;
