
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, Cloud, HelpCircle, Upload } from "lucide-react";
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ApiService } from "@/services/ApiService";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const DropboxLinkForm: React.FC = () => {
  const [dropboxLink, setDropboxLink] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const loadDropboxLink = async () => {
      try {
        // Try to get from user profile first
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('dropbox_link')
            .eq('id', session.user.id)
            .maybeSingle();
          
          if (profile?.dropbox_link) {
            setDropboxLink(profile.dropbox_link);
            return;
          }
        }
        
        // Fallback to localStorage
        const savedLink = ApiService.getDropboxLink();
        if (savedLink) {
          setDropboxLink(savedLink);
        }
      } catch (error) {
        console.error('Error loading Dropbox link:', error);
      }
    };

    loadDropboxLink();
  }, []);

  const saveDropboxLink = async () => {
    setIsLoading(true);
    try {
      // Save to localStorage
      ApiService.setDropboxLink(dropboxLink);
      
      // Save to user profile if authenticated
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const { error } = await supabase
          .from('profiles')
          .upsert({
            id: session.user.id,
            dropbox_link: dropboxLink
          });
        
        if (error) {
          console.error('Error saving to profile:', error);
          toast({
            title: "Warning",
            description: "Saved locally but couldn't sync to profile. Link saved successfully.",
            variant: "default",
          });
        } else {
          toast({
            title: "Success",
            description: "Dropbox link saved successfully! Daily backups will now be stored in your Dropbox.",
          });
        }
      } else {
        toast({
          title: "Success",
          description: "Dropbox link saved locally! Sign in to sync across devices and enable automatic backups.",
        });
      }
    } catch (error) {
      console.error('Error saving Dropbox link:', error);
      toast({
        title: "Error",
        description: "Failed to save Dropbox link",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
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
                <p className="max-w-xs">
                  Enter your Dropbox shared folder link where daily export backups will be automatically stored. 
                  This enables automatic backup of your scheduled exports to your personal Dropbox.
                </p>
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
          <Alert>
            <Upload className="h-4 w-4" />
            <AlertDescription>
              <strong>Automatic Backup:</strong> When you configure scheduled exports with a Dropbox link, 
              your daily exports will be automatically backed up to your Dropbox folder in addition to email delivery.
            </AlertDescription>
          </Alert>
          
          <div className="space-y-2">
            <Input
              type="text"
              placeholder="https://www.dropbox.com/scl/fo/your-shared-folder"
              value={dropboxLink}
              onChange={(e) => setDropboxLink(e.target.value)}
              className="w-full"
            />
            <p className="text-sm text-muted-foreground">
              To get a Dropbox link: Create a folder in Dropbox → Right-click → Share → Create link
            </p>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-end">
        <Button 
          onClick={saveDropboxLink} 
          className="hover-lift"
          disabled={isLoading}
        >
          <Check className="mr-2 h-4 w-4" />
          {isLoading ? 'Saving...' : 'Save Link'}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default DropboxLinkForm;
