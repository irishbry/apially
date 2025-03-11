
import React from 'react';
import Installer from '@/components/Installer';

const InstallerPage: React.FC = () => {
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Installation Guide</h1>
      <Installer />
    </div>
  );
};

export default InstallerPage;
