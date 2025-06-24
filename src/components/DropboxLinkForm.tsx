
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, Cloud, HelpCircle, Download, Upload, Key, AlertCircle, CheckCircle2, Database } from "lucide-react";
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
  const [backupStats, setBackupStats] = useState({ total: 0, backedUp: 0, pending: 0 });
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      loadDropboxConfig();
      loadBackupStats();
    }
  }, [user]);

  const loadBackupStats = async () => {
    try {
      const data = await ApiService.getData();
      const total = data.length;
      const backedUp = data.filter(entry => entry.backed_up_dropbox).length;
      const pending = total - backedUp;
      setBackupStats({ total, backedUp, pending });
    } catch (error) {
      console.error('Error loading backup stats:', error);
    }
  };

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
        // Refresh backup stats after successful backup
        await loadBackupStats();
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
      <Card className="w-full max-w-2xl mx-auto">
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
      <Card className="w-full max-w-2xl mx-auto">
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
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-3 text-xl">
          <Cloud className="h-5 w-5 text-primary" />
          Dropbox Backup Configuration
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <HelpCircle className="h-4 w-4 text-slate-400 cursor-help ml-auto" />
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <p>Configure your Dropbox API token and folder path for automatic daily backups.</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </CardTitle>
        <CardDescription>
          Set up automatic daily backups to your Dropbox account
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Backup Statistics */}
        {backupStats.total > 0 && (
          <div className="p-4 bg-slate-50 rounded-lg border">
            <div className="flex items-center gap-2 mb-2">
              <Database className="h-4 w-4 text-slate-600" />
              <span className="text-sm font-medium text-slate-700">Backup Status</span>
            </div>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div className="text-center">
                <div className="text-lg font-semibold text-slate-900">{backupStats.total}</div>
                <div className="text-slate-600">Total Entries</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-semibold text-green-600">{backupStats.backedUp}</div>
                <div className="text-slate-600">Backed Up</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-semibold text-amber-600">{backupStats.pending}</div>
                <div className="text-slate-600">Pending</div>
              </div>
            </div>
          </div>
        )}

        <div className="space-y-2">
          <label className="text-sm font-medium">
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
          />
          <p className="text-xs text-slate-500">
            Specify the folder path where backups will be stored (must start with /)
          </p>
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
          />
          <p className="text-xs text-slate-500">
            Get your API token from the{' '}
            <a 
              href="https://www.dropbox.com/developers/apps" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-primary hover:underline"
            >
              Dropbox Developer Console
            </a>
          </p>
        </div>
        
        {dropboxLink && dropboxToken && (
          <Button 
            onClick={testConnection} 
            variant="outline" 
            disabled={isTestingConnection}
            className="w-full"
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
          <div className={`p-3 rounded-md border-l-4 ${
            isValidConfig 
              ? 'bg-green-50 border-green-400 text-green-800' 
              : 'bg-amber-50 border-amber-400 text-amber-800'
          }`}>
            <div className="flex items-center gap-2">
              {isValidConfig ? (
                <CheckCircle2 className="h-4 w-4 text-green-600" />
              ) : (
                <AlertCircle className="h-4 w-4 text-amber-600" />
              )}
              <span className="text-sm font-medium">{validationMessage}</span>
            </div>
          </div>
        )}
        
        {isValidConfig && isDailyEnabled && (
          <div className="p-3 bg-green-50 border border-green-200 rounded-md">
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4 text-green-600" />
              <div>
                <p className="text-green-800 font-medium text-sm">Configuration Active</p>
                <p className="text-green-700 text-xs">Daily backups are enabled and running automatically</p>
              </div>
            </div>
          </div>
        )}
      </CardContent>

      <CardFooter className="flex gap-2 justify-end">
        {isValidConfig && (
          <Button 
            onClick={createManualBackup} 
            variant="outline" 
            disabled={isCreatingBackup}
          >
            <Upload className="mr-2 h-4 w-4" />
            {isCreatingBackup ? 'Creating...' : `Backup Now ${backupStats.pending > 0 ? `(${backupStats.pending} new)` : ''}`}
          </Button>
        )}
        <Button 
          onClick={saveDropboxConfig} 
          disabled={!isValidConfig || isSaving}
        >
          {isSaving ? (
            <>
              <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
              Saving...
            </>
          ) : (
            <>
              <Check className="mr-2 h-4 w-4" />
              Save & Enable
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default DropboxLinkForm;
