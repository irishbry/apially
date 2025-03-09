
import React from 'react';
import { ArrowDownToLine, Database } from 'lucide-react';

const Header: React.FC = () => {
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
      <div className="flex items-center text-sm text-muted-foreground">
        <ArrowDownToLine className="mr-1 h-4 w-4" />
        <span>Configure your API key and Dropbox link below to get started</span>
      </div>
    </div>
  );
};

export default Header;
