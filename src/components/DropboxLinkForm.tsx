import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, Cloud, HelpCircle, Download, Upload, Key, AlertCircle, CheckCircle2 } from "lucide-react";
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
  const [isSaving, setIsSaving] = useState(false);
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

      setIsSaving(true);

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

      // Save configuration with daily backups automatically enabled
      await ApiService.saveDropboxConfig(dropboxLink, dropboxToken, true);
      setIsValidConfig(true);
      setIsDailyEnabled(true);
      setValidationMessage('Configuration saved successfully with daily backups enabled!');
      
      // Setup automatic backups
      const backupSetup = await DropboxBackupService.setupAutomaticBackups();
      
      if (backupSetup) {
        toast({
          title: "Success",
          description: "Dropbox configuration saved and daily automatic backups have been enabled!",
        });
      } else {
        toast({
          title: "Partial Success",
          description: "Configuration saved but there was an issue setting up automatic backups",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error saving Dropbox config:', error);
      toast({
        title: "Error",
        description: "Failed to save Dropbox configuration",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
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
      <Card className="w-full max-w-2xl mx-auto shadow-lg border-0 bg-gradient-to-br from-slate-50 to-white">
        <CardContent className="flex items-center justify-center p-12">
          <div className="text-center space-y-3">
            <AlertCircle className="h-12 w-12 text-slate-400 mx-auto" />
            <p className="text-slate-600 font-medium">Authentication Required</p>
            <p className="text-sm text-slate-500">Please log in to configure Dropbox backups</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card className="w-full max-w-2xl mx-auto shadow-lg border-0 bg-gradient-to-br from-slate-50 to-white">
        <CardContent className="flex items-center justify-center p-12">
          <div className="text-center space-y-3">
            <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-slate-600 font-medium">Loading Configuration</p>
            <p className="text-sm text-slate-500">Please wait while we load your Dropbox settings</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-2xl mx-auto shadow-lg border-0 bg-gradient-to-br from-slate-50 to-white hover:shadow-xl transition-all duration-300">
      <CardHeader className="pb-6 border-b border-slate-100">
        <CardTitle className="flex items-center gap-3 text-2xl font-semibold text-slate-800">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Cloud className="h-6 w-6 text-primary" />
          </div>
          Dropbox Backup Configuration
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <HelpCircle className="h-5 w-5 text-slate-400 cursor-help ml-auto" />
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <p>Configure your Dropbox API token and folder path for automatic daily backups. You'll need to create a Dropbox app to get an API token.</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </CardTitle>
        <CardDescription className="text-slate-600 mt-2">
          Set up automatic daily backups to your Dropbox account for secure data storage
        </CardDescription>
      </CardHeader>

      <CardContent className="p-6 space-y-6">
        <div className="grid gap-6">
          <div className="space-y-3">
            <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
              <div className="w-2 h-2 bg-primary rounded-full" />
              Dropbox Folder Path
            </label>
            <Input
              type="text"
              placeholder="/Backups/MyApp"
              value={dropboxLink}
              onChange={(e) => {
                setDropboxLink(e.target.value);
                setValidationMessage('');
                setIsValidConfig(false);
              }}
              className="h-11 border-slate-200 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
            />
            <p className="text-xs text-slate-500">
              Specify the folder path where backups will be stored (must start with /)
            </p>
          </div>
          
          <div className="space-y-3">
            <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
              <Key className="h-4 w-4 text-slate-500" />
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
              className="h-11 border-slate-200 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
            />
            <p className="text-xs text-slate-500">
              Get your API token from the{' '}
              <a 
                href="https://www.dropbox.com/developers/apps" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-primary hover:text-primary/80 underline font-medium"
              >
                Dropbox Developer Console
              </a>
            </p>
          </div>
          
          {dropboxLink && dropboxToken && (
            <Button 
              onClick={testConnection} 
              variant="outline" 
              size="lg"
              disabled={isTestingConnection}
              className="w-full h-12 border-2 border-primary text-primary hover:bg-primary hover:text-white transition-all duration-200"
            >
              {isTestingConnection ? (
                <>
                  <div className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                  Testing Connection...
                </>
              ) : (
                <>
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Test Connection
                </>
              )}
            </Button>
          )}
          
          {validationMessage && (
            <div className={`p-4 rounded-lg border-l-4 ${
              isValidConfig 
                ? 'bg-green-50 border-green-400 text-green-800' 
                : 'bg-amber-50 border-amber-400 text-amber-800'
            }`}>
              <div className="flex items-center gap-2">
                {isValidConfig ? (
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-amber-600" />
                )}
                <span className="font-medium">{validationMessage}</span>
              </div>
            </div>
          )}
          
          {isValidConfig && isDailyEnabled && (
            <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="p-1 bg-green-100 rounded-full">
                  <Check className="h-4 w-4 text-green-600" />
                </div>
                <div>
                  <p className="text-green-800 font-medium">Configuration Active</p>
                  <p className="text-green-700 text-sm">Daily backups are enabled and running automatically</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </CardContent>

      <CardFooter className="p-6 pt-0 flex gap-3 justify-end">
        {isValidConfig && (
          <Button 
            onClick={createManualBackup} 
            variant="outline" 
            size="lg"
            disabled={isCreatingBackup}
            className="hover:bg-slate-50 transition-colors"
          >
            <Upload className="mr-2 h-4 w-4" />
            {isCreatingBackup ? 'Creating Backup...' : 'Backup Now'}
          </Button>
        )}
        <Button 
          onClick={saveDropboxConfig} 
          disabled={!isValidConfig || isSaving} 
          size="lg"
          className="bg-primary hover:bg-primary/90 text-white shadow-lg hover:shadow-xl transition-all duration-200"
        >
          {isSaving ? (
            <>
              <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
              Saving...
            </>
          ) : (
            <>
              <Check className="mr-2 h-4 w-4" />
              Save & Enable Daily Backups
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default DropboxLinkForm;
