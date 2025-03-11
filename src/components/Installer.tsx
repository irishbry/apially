
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Server } from "lucide-react";
import HiddenFilesAlert from "./installer/HiddenFilesAlert";
import PackageContents from "./installer/PackageContents";
import DownloadButton from "./installer/DownloadButton";
import InstallationSteps from "./installer/InstallationSteps";

const Installer: React.FC = () => {
  return (
    <Card className="w-full shadow-sm hover:shadow-md transition-all duration-300">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-xl font-medium">
          <Server className="h-5 w-5 text-primary" />
          SiteGround Installation Guide
        </CardTitle>
        <CardDescription>
          How to install this application on your SiteGround hosting
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <HiddenFilesAlert />

          <PackageContents />
          
          <DownloadButton />
          
          <InstallationSteps />
        </div>
      </CardContent>
    </Card>
  );
};

export default Installer;
