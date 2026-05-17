
import React from 'react';
import { Database, Shield } from 'lucide-react';
import { useIsMobile } from "@/hooks/use-mobile";
import { useAuth } from '@/hooks/useAuth';
import { Link } from 'react-router-dom';

const ADMIN_EMAILS = ['bryan@rvnu.com'];

const Header: React.FC = () => {
  const isMobile = useIsMobile();
  const { user } = useAuth();
  const isAdmin = user?.email && ADMIN_EMAILS.includes(user.email);
  
  if (isMobile) {
    return null;
  }
  
  return (
    <div className="space-y-4 py-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="bg-primary/10 p-2 rounded-full">
            <Database className="h-6 w-6 text-primary" />
          </div>
          <h1 className="text-3xl font-medium tracking-tight">ApiAlly</h1>
        </div>
        {isAdmin && (
          <Link
            to="/admin"
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5 rounded-md hover:bg-muted"
          >
            <Shield className="h-4 w-4" />
            Admin
          </Link>
        )}
      </div>
      <p className="text-muted-foreground max-w-3xl">
        Easily collect real-time data through your API endpoint, automatically consolidate it into CSV files, 
        and export to your Dropbox at the end of each day.
      </p>
    </div>
  );
};

export default Header;
