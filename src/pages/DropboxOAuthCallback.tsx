
import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { DropboxBackupService } from '@/services/DropboxBackupService';
import { useToast } from "@/hooks/use-toast";

const DropboxOAuthCallback: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');
  const [message, setMessage] = useState('Processing OAuth callback...');

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const code = searchParams.get('code');
        const error = searchParams.get('error');
        const state = searchParams.get('state');

        if (error) {
          setStatus('error');
          setMessage(`OAuth error: ${error}`);
          return;
        }

        if (!code) {
          setStatus('error');
          setMessage('No authorization code received');
          return;
        }

        // Get the app credentials from localStorage (temporarily stored during OAuth flow)
        const appKey = localStorage.getItem('dropbox_app_key');
        const appSecret = localStorage.getItem('dropbox_app_secret');

        if (!appKey || !appSecret) {
          setStatus('error');
          setMessage('Missing app credentials. Please restart the OAuth process.');
          return;
        }

        // Clean up temporary storage
        localStorage.removeItem('dropbox_app_key');
        localStorage.removeItem('dropbox_app_secret');

        setMessage('Exchanging authorization code for tokens...');

        const success = await DropboxBackupService.handleOAuthCallback(code, appKey, appSecret);

        if (success) {
          setStatus('success');
          setMessage('Successfully connected to Dropbox! You can now close this window.');
          
          toast({
            title: "Success",
            description: "Dropbox has been connected successfully. Daily backups are now enabled!",
          });

          // Redirect back to main app after a short delay
          setTimeout(() => {
            navigate('/');
          }, 3000);
        } else {
          setStatus('error');
          setMessage('Failed to complete OAuth flow. Please try again.');
        }
      } catch (error) {
        console.error('Error handling OAuth callback:', error);
        setStatus('error');
        setMessage('An unexpected error occurred during OAuth callback.');
      }
    };

    handleCallback();
  }, [searchParams, navigate, toast]);

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2">
            {status === 'processing' && <Loader2 className="h-5 w-5 animate-spin text-blue-600" />}
            {status === 'success' && <CheckCircle2 className="h-5 w-5 text-green-600" />}
            {status === 'error' && <AlertCircle className="h-5 w-5 text-red-600" />}
            Dropbox OAuth
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center">
          <p className="text-sm text-slate-600">{message}</p>
          {status === 'success' && (
            <p className="text-xs text-slate-500 mt-2">
              Redirecting you back to the app...
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default DropboxOAuthCallback;
