
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const SourcesManager: React.FC = () => {
  const [sourceName, setSourceName] = useState('');
  const [sourceType, setSourceType] = useState('CSV');
  const [sourceUrl, setSourceUrl] = useState('');
  const [sources, setSources] = useState<any[]>([]);

  const handleAddSource = () => {
    if (sourceName && sourceUrl) {
      setSources([...sources, { name: sourceName, type: sourceType, url: sourceUrl }]);
      setSourceName('');
      setSourceUrl('');
    }
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
      <h2 className="text-xl font-medium mb-4">Data Sources</h2>
      
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-gray-600 mb-2">Source Name</label>
            <Input
              placeholder="e.g., Sales Data"
              value={sourceName}
              onChange={(e) => setSourceName(e.target.value)}
            />
          </div>
          
          <div>
            <label className="block text-gray-600 mb-2">Source Type</label>
            <Select value={sourceType} onValueChange={setSourceType}>
              <SelectTrigger>
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="CSV">CSV</SelectItem>
                <SelectItem value="JSON">JSON</SelectItem>
                <SelectItem value="XML">XML</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <div>
          <label className="block text-gray-600 mb-2">Source URL</label>
          <Input
            placeholder="https://example.com/data.csv"
            value={sourceUrl}
            onChange={(e) => setSourceUrl(e.target.value)}
          />
        </div>
        
        <div>
          <Button onClick={handleAddSource} className="bg-blue-500 hover:bg-blue-600">
            Add Source
          </Button>
        </div>
        
        {sources.length === 0 && (
          <p className="text-gray-500 mt-4">No data sources added yet.</p>
        )}
      </div>
    </div>
  );
};

export default SourcesManager;
