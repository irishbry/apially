
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, Cloud, HelpCircle, Download, Upload, Key, AlertCircle, CheckCircle2, Database, ExternalLink, Copy } from "lucide-react";
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
  const [dropboxPath, setDropboxPath] = useState('');
  const [appKey, setAppKey] = useState('');
  const [appSecret, setAppSecret] = useState('');
  const [authCode, setAuthCode] = useState('');
  const [isValidConfig, setIsValidConfig] = useState(false);
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [isCreatingBackup, setIsCreatingBackup] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isExchangingCode, setIsExchangingCode] = useState(false);
  const [isDailyEnabled, setIsDailyEnabled] = useState(false);
  const [validationMessage, setValidationMessage] = useState('');
  const [authUrl, setAuthUrl] = useState('');
  const [step, setStep] = useState<'setup' | 'authorize' | 'complete'>('setup');
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
      
      if (config && config.refresh_token) {
        setDropboxPath(config.dropbox_path);
        setAppKey(config.app_key);
        setAppSecret(config.app_secret);
        setIsDailyEnabled(config.daily_backup_enabled);
        setStep('complete');
        setIsValidConfig(true);
        setValidationMessage('OAuth configuration complete and active');
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

  const generateAuthUrl = () => {
    if (!appKey) {
      toast({
        title: "Error",
        description: "Please enter your App Key first",
        variant: "destructive",
      });
      return;
    }

    if (!dropboxPath) {
      toast({
        title: "Error",
        description: "Please enter your Dropbox folder path first",
        variant: "destructive",
      });
      return;
    }

    const url = DropboxBackupService.generateDropboxAuthUrl(appKey);
    setAuthUrl(url);
    setStep('authorize');
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied",
      description: "URL copied to clipboard",
    });
  };

  const exchangeAuthCode = async () => {
    if (!authCode || !appKey || !appSecret) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    setIsExchangingCode(true);
    try {
      // Exchange code for tokens
      const tokens = await ApiService.exchangeDropboxCode(authCode, appKey, appSecret);
      
      // Calculate expiration time
      const expiresAt = new Date(Date.now() + (tokens.expires_in * 1000));
      
      // Save configuration
      await ApiService.saveDropboxConfig(
        dropboxPath,
        appKey,
        appSecret,
        tokens.refresh_token,
        tokens.access_token,
        expiresAt.toISOString(),
        true
      );

      // Test the connection
      const connectionValid = await DropboxBackupService.testDropboxConnection(dropboxPath, tokens.access_token);
      
      if (connectionValid) {
        setIsValidConfig(true);
        setIsDailyEnabled(true);
        setStep('complete');
        setValidationMessage('OAuth setup complete! Daily backups are now enabled.');
        
        toast({
          title: "Success",
          description: "Dropbox OAuth setup completed successfully! Daily backups are now enabled.",
        });
      } else {
        throw new Error('Connection test failed after token exchange');
      }
    } catch (error) {
      console.error('Error exchanging auth code:', error);
      toast({
        title: "Error",
        description: "Failed to complete OAuth setup. Please check your credentials and try again.",
        variant: "destructive",
      });
    } finally {
      setIsExchangingCode(false);
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

  const resetSetup = () => {
    setStep('setup');
    setDropboxPath('');
    setAppKey('');
    setAppSecret('');
    setAuthCode('');
    setAuthUrl('');
    setIsValidConfig(false);
    setValidationMessage('');
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
          Dropbox OAuth Backup Setup
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <HelpCircle className="h-4 w-4 text-slate-400 cursor-help ml-auto" />
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <p>Set up permanent Dropbox integration using OAuth for automatic daily backups without token expiration issues.</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </CardTitle>
        <CardDescription className="text-sm">
          One-time OAuth setup for permanent automatic daily backups
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Backup Statistics */}
        {backupStats.total > 0 && (
          <div className="flex items-center justify-between text-xs text-slate-600 bg-slate-50 px-2 py-1 rounded border">
            <span className="flex items-center gap-1">
              <Database className="h-3 w-3" />
              Backup Status
            </span>
            <span>{backupStats.total} Total • {backupStats.backedUp} Done • {backupStats.pending} Pending</span>
          </div>
        )}

        {step === 'setup' && (
          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <h4 className="text-sm font-medium text-blue-900 mb-2">Setup Instructions</h4>
              <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
                <li>Create a Dropbox App at <a href="https://www.dropbox.com/developers/apps" target="_blank" rel="noopener noreferrer" className="underline">developers.dropbox.com</a></li>
                <li>Choose "Scoped access" and "Full Dropbox" access</li>
                <li><strong>Important:</strong> In the "Permissions" tab, enable the <code>files.content.write</code> scope to allow file uploads</li>
                <li>Copy your App Key and App Secret from the app settings</li>
                <li>Fill in the form below and generate authorization URL</li>
              </ol>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
              <h4 className="text-sm font-medium text-amber-900 mb-2">⚠️ Permission Required</h4>
              <p className="text-sm text-amber-800">
                Make sure to enable the <strong>files.content.write</strong> permission in your Dropbox app's Permissions tab. 
                Without this permission, backup uploads will fail with "scope not permitted" errors.
              </p>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium">Dropbox Folder Path</label>
                <Input
                  type="text"
                  placeholder="/Backups/MyApp"
                  value={dropboxPath}
                  onChange={(e) => setDropboxPath(e.target.value)}
                />
                <p className="text-xs text-slate-500 mt-1">
                  Folder path where backups will be stored (must start with /)
                </p>
              </div>

              <div>
                <label className="text-sm font-medium">App Key</label>
                <Input
                  type="text"
                  placeholder="Your Dropbox App Key"
                  value={appKey}
                  onChange={(e) => setAppKey(e.target.value)}
                />
              </div>

              <div>
                <label className="text-sm font-medium">App Secret</label>
                <Input
                  type="password"
                  placeholder="Your Dropbox App Secret"
                  value={appSecret}
                  onChange={(e) => setAppSecret(e.target.value)}
                />
              </div>

              <Button 
                onClick={generateAuthUrl} 
                className="w-full"
                disabled={!dropboxPath || !appKey || !appSecret}
              >
                <ExternalLink className="mr-2 h-4 w-4" />
                Generate Authorization URL
              </Button>
            </div>
          </div>
        )}

        {step === 'authorize' && (
          <div className="space-y-4">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <h4 className="text-sm font-medium text-yellow-900 mb-2">Authorization Step</h4>
              <p className="text-sm text-yellow-800 mb-3">
                Click the link below to authorize your app. After authorization, copy the code from the URL and paste it here.
              </p>
              
              <div className="flex items-center gap-2 mb-3">
                <Input
                  value={authUrl}
                  readOnly
                  className="text-xs"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(authUrl)}
                >
                  <Copy className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(authUrl, '_blank')}
                >
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium">Authorization Code</label>
              <Input
                type="text"
                placeholder="Paste the authorization code here"
                value={authCode}
                onChange={(e) => setAuthCode(e.target.value)}
              />
              <p className="text-xs text-slate-500 mt-1">
                Copy the code parameter from the URL after authorization
              </p>
            </div>

            <div className="flex gap-2">
              <Button 
                onClick={resetSetup} 
                variant="outline" 
                className="flex-1"
              >
                Back to Setup
              </Button>
              <Button 
                onClick={exchangeAuthCode} 
                disabled={!authCode || isExchangingCode}
                className="flex-1"
              >
                {isExchangingCode ? (
                  <>
                    <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    Completing Setup...
                  </>
                ) : (
                  'Complete Setup'
                )}
              </Button>
            </div>
          </div>
        )}

        {step === 'complete' && (
          <div className="space-y-4">
            {validationMessage && (
              <div className="p-3 rounded-md border-l-4 bg-green-50 border-green-400">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-medium text-green-800">{validationMessage}</span>
                </div>
              </div>
            )}

            {isDailyEnabled && (
              <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 px-3 py-2 rounded border border-green-200">
                <Check className="h-4 w-4 text-green-600" />
                <span>Daily automatic backups are enabled and running</span>
              </div>
            )}

            <div className="bg-slate-50 rounded-lg p-3">
              <h4 className="text-sm font-medium mb-2">Configuration Summary</h4>
              <div className="text-sm text-slate-600 space-y-1">
                <p><strong>Folder:</strong> {dropboxPath}</p>
                <p><strong>App Key:</strong> {appKey?.substring(0, 8)}...</p>
                <p><strong>Status:</strong> OAuth Active with Refresh Token</p>
              </div>
            </div>

            <Button 
              onClick={resetSetup} 
              variant="outline" 
              size="sm"
              className="w-full"
            >
              Reconfigure OAuth Setup
            </Button>
          </div>
        )}
      </CardContent>

      {step === 'complete' && (
        <CardFooter className="flex gap-2 justify-end pt-3">
          <Button 
            onClick={createManualBackup} 
            variant="outline" 
            disabled={isCreatingBackup}
            size="sm"
          >
            <Upload className="mr-2 h-4 w-4" />
            {isCreatingBackup ? 'Creating...' : `Backup Now ${backupStats.pending > 0 ? `(${backupStats.pending} new)` : ''}`}
          </Button>
        </CardFooter>
      )}
    </Card>
  );
};

export default DropboxLinkForm;
