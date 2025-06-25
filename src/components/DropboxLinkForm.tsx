
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, Cloud, HelpCircle, Download, Upload, Key, AlertCircle, CheckCircle2, Database, ExternalLink } from "lucide-react";
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
  const [dropboxPath, setDropboxPath] = useState('/DataBackups');
  const [appKey, setAppKey] = useState('');
  const [appSecret, setAppSecret] = useState('');
  const [isValidConfig, setIsValidConfig] = useState(false);
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [isCreatingBackup, setIsCreatingBackup] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isDailyEnabled, setIsDailyEnabled] = useState(false);
  const [validationMessage, setValidationMessage] = useState('');
  const [backupStats, setBackupStats] = useState({ total: 0, backedUp: 0, pending: 0 });
  const [hasValidTokens, setHasValidTokens] = useState(false);
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
        setDropboxPath(config.dropbox_path || '/DataBackups');
        setAppKey(config.app_key || '');
        setAppSecret(config.app_secret || '');
        setIsDailyEnabled(config.daily_backup_enabled);
        
        // Check if we have valid OAuth tokens
        const hasTokens = !!(config.refresh_token && config.access_token);
        setHasValidTokens(hasTokens);
        
        if (hasTokens && config.is_active) {
          setValidationMessage('Testing existing connection...');
          const isValid = await DropboxBackupService.testDropboxConnection(config.dropbox_path);
          setIsValidConfig(isValid);
          setValidationMessage(isValid ? 'Connection is active and working' : 'Connection test failed - may need to re-authenticate');
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
    if (!hasValidTokens) {
      setValidationMessage('Please complete OAuth authentication first');
      setIsValidConfig(false);
      return;
    }

    setIsTestingConnection(true);
    setValidationMessage('Testing connection...');

    try {
      const isValid = await DropboxBackupService.testDropboxConnection(dropboxPath);
      setIsValidConfig(isValid);
      setValidationMessage(isValid ? 'Connection successful!' : 'Connection failed. You may need to re-authenticate.');
      
      if (!isValid) {
        toast({
          title: "Connection Failed",
          description: "Connection test failed. You may need to re-authenticate with Dropbox.",
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

  const connectToDropbox = async () => {
    if (!appKey || !appSecret) {
      toast({
        title: "Error",
        description: "Please enter both App Key and App Secret",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsConnecting(true);
      
      // Store credentials temporarily for the OAuth callback
      localStorage.setItem('dropbox_app_key', appKey);
      localStorage.setItem('dropbox_app_secret', appSecret);
      
      // Start OAuth flow
      const authUrl = await DropboxBackupService.initiateOAuthFlow(appKey);
      
      // Open OAuth URL in a new window
      window.open(authUrl, 'dropbox-oauth', 'width=600,height=700,scrollbars=yes,resizable=yes');
      
      setValidationMessage('Please complete the authorization in the popup window...');
      
      // Listen for the OAuth completion (you might want to implement a more robust method)
      const checkForCompletion = setInterval(async () => {
        try {
          const config = await ApiService.getDropboxConfig();
          if (config?.refresh_token) {
            clearInterval(checkForCompletion);
            setHasValidTokens(true);
            setIsDailyEnabled(true);
            setValidationMessage('OAuth completed successfully!');
            
            // Test the connection
            const isValid = await DropboxBackupService.testDropboxConnection(dropboxPath);
            setIsValidConfig(isValid);
            
            if (isValid) {
              toast({
                title: "Success",
                description: "Successfully connected to Dropbox! Daily backups are now enabled.",
              });
            }
            
            setIsConnecting(false);
          }
        } catch (error) {
          // Still checking...
        }
      }, 2000);
      
      // Stop checking after 5 minutes
      setTimeout(() => {
        clearInterval(checkForCompletion);
        setIsConnecting(false);
      }, 300000);
      
    } catch (error) {
      console.error('Error connecting to Dropbox:', error);
      setIsConnecting(false);
      toast({
        title: "Error",
        description: "Failed to start OAuth flow",
        variant: "destructive",
      });
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
          description: "Failed to upload backup to Dropbox. You may need to re-authenticate.",
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
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-3 text-lg">
          <Cloud className="h-4 w-4 text-primary" />
          Dropbox Backup Configuration
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <HelpCircle className="h-4 w-4 text-slate-400 cursor-help ml-auto" />
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <p>Configure OAuth authentication with your Dropbox app for secure, automatic daily backups with refresh tokens.</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </CardTitle>
        <CardDescription className="text-sm">
          Set up secure OAuth authentication for automatic daily backups using refresh tokens
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Backup Statistics - Very Compact */}
        {backupStats.total > 0 && (
          <div className="flex items-center justify-between text-xs text-slate-600 bg-slate-50 px-2 py-1 rounded border">
            <span className="flex items-center gap-1">
              <Database className="h-3 w-3" />
              Backup Status
            </span>
            <span>{backupStats.total} Total • {backupStats.backedUp} Done • {backupStats.pending} Pending</span>
          </div>
        )}

        <div className="space-y-2">
          <label className="text-sm font-medium">
            Dropbox Folder Path
          </label>
          <Input
            type="text"
            placeholder="/DataBackups"
            value={dropboxPath}
            onChange={(e) => {
              setDropboxPath(e.target.value);
              setValidationMessage('');
            }}
          />
          <p className="text-xs text-slate-500">
            Specify the folder path where backups will be stored (must start with /)
          </p>
        </div>

        {!hasValidTokens && (
          <>
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <Key className="h-4 w-4" />
                Dropbox App Key
              </label>
              <Input
                type="text"
                placeholder="Your Dropbox app key"
                value={appKey}
                onChange={(e) => {
                  setAppKey(e.target.value);
                  setValidationMessage('');
                }}
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Dropbox App Secret
              </label>
              <Input
                type="password"
                placeholder="Your Dropbox app secret"
                value={appSecret}
                onChange={(e) => {
                  setAppSecret(e.target.value);
                  setValidationMessage('');
                }}
              />
              <p className="text-xs text-slate-500">
                Create a Dropbox app at{' '}
                <a 
                  href="https://www.dropbox.com/developers/apps" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="text-primary hover:underline inline-flex items-center gap-1"
                >
                  Dropbox Developer Console
                  <ExternalLink className="h-3 w-3" />
                </a>
                {' '}and get your App Key & Secret
              </p>
            </div>

            <Button 
              onClick={connectToDropbox} 
              disabled={isConnecting || !appKey || !appSecret}
              className="w-full"
              size="sm"
            >
              {isConnecting ? (
                <>
                  <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Connecting to Dropbox...
                </>
              ) : (
                <>
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Connect to Dropbox
                </>
              )}
            </Button>
          </>
        )}

        {hasValidTokens && (
          <Button 
            onClick={testConnection} 
            variant="outline" 
            disabled={isTestingConnection}
            className="w-full"
            size="sm"
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
          <div className={`p-2 rounded-md border-l-4 ${
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
              <span className="text-xs font-medium">{validationMessage}</span>
            </div>
          </div>
        )}
        
        {isValidConfig && isDailyEnabled && (
          <div className="flex items-center gap-2 text-xs text-green-700 bg-green-50 px-2 py-1 rounded border border-green-200">
            <Check className="h-3 w-3 text-green-600" />
            <span>Daily backups enabled and running automatically</span>
          </div>
        )}
      </CardContent>

      <CardFooter className="flex gap-2 justify-end pt-3">
        {isValidConfig && (
          <Button 
            onClick={createManualBackup} 
            variant="outline" 
            disabled={isCreatingBackup}
            size="sm"
          >
            <Upload className="mr-2 h-4 w-4" />
            {isCreatingBackup ? 'Creating...' : `Backup Now ${backupStats.pending > 0 ? `(${backupStats.pending} new)` : ''}`}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};

export default DropboxLinkForm;
