import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, Cloud, HelpCircle } from "lucide-react";
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ApiService } from "@/services/ApiService";

const DropboxLinkForm: React.FC = () => {
  const [dropboxLink, setDropboxLink] = useState('');

  useEffect(() => {
    const savedLink = ApiService.getDropboxLink();
    if (savedLink) {
      setDropboxLink(savedLink);
    }
  }, []);

  const saveDropboxLink = () => {
    ApiService.setDropboxLink(dropboxLink);
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
                <p className="max-w-xs">Enter your Dropbox shared folder link where CSV files will be uploaded. Make sure the folder has proper permissions.</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </CardTitle>
        <CardDescription>
          Configure where your daily CSV exports will be stored
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="space-y-2">
            <Input
              type="text"
              placeholder="https://www.dropbox.com/scl/fo/your-shared-folder"
              value={dropboxLink}
              onChange={(e) => setDropboxLink(e.target.value)}
              className="w-full"
            />
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-end">
        <Button onClick={saveDropboxLink} className="hover-lift">
          <Check className="mr-2 h-4 w-4" />
          Save Link
        </Button>
      </CardFooter>
    </Card>
  );
};

export default DropboxLinkForm;
