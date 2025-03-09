import React, { useState, useEffect } from 'react';
import ApiService from "@/services/ApiService";

const ApiUsageStats: React.FC = () => {
  const [stats, setStats] = useState({
    totalRequests: 1250,
    successRate: "98.5%",
    avgResponseTime: "0.34s",
    lastUpdated: "3/8/2024, 4:33:31 PM"
  });
  
  useEffect(() => {
    // Subscribe to data changes - in real app this would update the actual stats
    const unsubscribeData = ApiService.subscribe(() => {
      // In a real application, we would update the statistics here
      // For now, we're using static demo data to match the screenshot
    });
    
    return () => {
      unsubscribeData();
    };
  }, []);

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
      <h2 className="text-xl font-medium mb-4">API Usage Statistics</h2>
      
      <div className="grid grid-cols-2 gap-6">
        <div>
          <p className="text-gray-600">Total Requests</p>
          <p className="text-3xl font-bold">{stats.totalRequests}</p>
        </div>
        
        <div>
          <p className="text-gray-600">Success Rate</p>
          <p className="text-3xl font-bold">{stats.successRate}</p>
        </div>
        
        <div>
          <p className="text-gray-600">Avg. Response Time</p>
          <p className="text-3xl font-bold">{stats.avgResponseTime}</p>
        </div>
        
        <div>
          <p className="text-gray-600">Last Updated</p>
          <p className="text-sm">{stats.lastUpdated}</p>
        </div>
      </div>
    </div>
  );
};

export default ApiUsageStats;
