import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, Calendar, Database } from 'lucide-react';

const BackupTimingDemo: React.FC = () => {
  // Dummy data with PST timestamps
  const currentTimePST = new Date().toLocaleString("en-US", {
    timeZone: "America/Los_Angeles",
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });

  const nextBackupTime = "2:00 AM PST";
  
  // Generate dummy data for the last 24 hours in PST
  const generateDummyData = () => {
    const data = [];
    const now = new Date();
    
    for (let i = 0; i < 24; i++) {
      const timestamp = new Date(now.getTime() - (i * 60 * 60 * 1000));
      const pstTime = timestamp.toLocaleString("en-US", {
        timeZone: "America/Los_Angeles",
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
      
      data.push({
        id: `entry_${i}`,
        timestamp: pstTime,
        source: `Sensor_${(i % 3) + 1}`,
        temperature: (68 + Math.random() * 10).toFixed(1),
        humidity: (45 + Math.random() * 20).toFixed(1),
        included: i < 24 // All entries from last 24 hours
      });
    }
    return data.reverse();
  };

  const dummyData = generateDummyData();
  const backupCutoffTime = new Date();
  backupCutoffTime.setHours(2, 0, 0, 0); // 2 AM today
  
  const backupCutoffPST = backupCutoffTime.toLocaleString("en-US", {
    timeZone: "America/Los_Angeles",
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  return (
    <div className="space-y-6 p-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center space-y-0 pb-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-sm font-medium ml-2">Current Time (PST)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{currentTimePST}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center space-y-0 pb-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-sm font-medium ml-2">Next Backup</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{nextBackupTime}</div>
            <p className="text-xs text-muted-foreground mt-1">Daily at 2:00 AM Pacific</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center space-y-0 pb-2">
            <Database className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-sm font-medium ml-2">Data Window</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">24 Hours</div>
            <p className="text-xs text-muted-foreground mt-1">Since last backup at 2 AM</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Backup Data Collection Demo</CardTitle>
          <p className="text-sm text-muted-foreground">
            Shows how data is collected in PST timezone for backup. Last backup cutoff: <span className="font-medium">{backupCutoffPST}</span>
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {dummyData.slice(0, 12).map((entry, index) => (
              <div key={entry.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                <div className="flex items-center space-x-4">
                  <Badge variant={entry.included ? "default" : "secondary"}>
                    {entry.source}
                  </Badge>
                  <span className="text-sm font-mono">{entry.timestamp}</span>
                </div>
                <div className="flex items-center space-x-4 text-sm">
                  <span>🌡️ {entry.temperature}°F</span>
                  <span>💧 {entry.humidity}%</span>
                  {entry.included && (
                    <Badge variant="outline" className="text-green-600 border-green-600">
                      ✓ Included
                    </Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-4 p-4 bg-primary/5 rounded-lg">
            <h4 className="font-medium mb-2">How Backup Timing Works:</h4>
            <ul className="text-sm space-y-1 text-muted-foreground">
              <li>• Backup runs daily at <strong>2:00 AM PST</strong></li>
              <li>• Collects all data from the <strong>previous 24 hours</strong> in PST timezone</li>
              <li>• Creates separate CSV files for each data source</li>
              <li>• Files are named with PST date: <code>source_YYYY-MM-DD_pst.csv</code></li>
              <li>• Data timestamps are converted to PST in the backup files</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default BackupTimingDemo;