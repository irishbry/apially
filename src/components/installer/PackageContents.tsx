
import React from 'react';

const PackageContents: React.FC = () => {
  return (
    <div className="p-4 bg-primary/5 rounded-md">
      <h3 className="text-sm font-medium mb-2">Installation Overview</h3>
      <p className="text-sm text-muted-foreground mb-4">
        This guide will help you install the Data Consolidation API on your SiteGround hosting. Follow these steps to get your server up and running.
      </p>
      
      <p className="text-sm font-medium mb-2 text-primary">What's Included in the Package:</p>
      <ul className="list-disc list-inside space-y-1 text-sm">
        <li><strong>install.php</strong> - Diagnostic installation script</li>
        <li><strong>api/index.php</strong> - Main API entry point</li>
        <li><strong className="text-amber-700">api/.htaccess</strong> - <span className="text-amber-700">Apache configuration (may be hidden!)</span></li>
        <li><strong>api/htaccess_readme.md</strong> - Instructions if .htaccess is hidden</li>
        <li><strong>api/test.php</strong> - Verify your installation and troubleshoot issues</li>
        <li><strong>api/config.php</strong> - Basic configuration file</li>
        <li><strong>api/data/</strong> - Directory for storing data</li>
      </ul>
    </div>
  );
};

export default PackageContents;
