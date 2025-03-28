
import React from 'react';
import { Database } from 'lucide-react';
import { useIsMobile } from "@/hooks/use-mobile";

const Header: React.FC = () => {
  const isMobile = useIsMobile();
  
  if (isMobile) {
    return null; // No separate header for mobile, it's integrated in the Index page
  }
  
  return (
    <div className="space-y-4 py-4 animate-fade-in">
      <div className="flex items-center gap-2">
        <div className="bg-primary/10 p-2 rounded-full">
          <Database className="h-6 w-6 text-primary" />
        </div>
        <h1 className="text-3xl font-medium tracking-tight">ApiAlly</h1>
      </div>
      <p className="text-muted-foreground max-w-3xl">
        Easily collect real-time data through your API endpoint, automatically consolidate it into CSV files, 
        and export to your Dropbox at the end of each day.
      </p>
    </div>
  );
};

export default Header;
