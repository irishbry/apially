import { toast } from "@/components/ui/use-toast";

// Type for incoming data
export interface DataEntry {
  id?: string;
  timestamp?: string;
  [key: string]: any;
}

// Schema validation interface
export interface DataSchema {
  requiredFields: string[];
  fieldTypes: {[key: string]: string};
}

// Main API service
class ApiService {
  private static instance: ApiService;
  private apiKey: string = "";
  private data: DataEntry[] = [];
  private dropboxLink: string = "";
  private subscribers: ((data: DataEntry[]) => void)[] = [];
  private schema: DataSchema = {
    requiredFields: [],
    fieldTypes: {}
  };

  private constructor() {
    // Initialize with demo data
    this.generateDemoData();
    
    // Simulate scheduled daily export
    this.scheduleExport();
    
    // Default schema - can be customized
    this.schema = {
      requiredFields: ['sensorId'],
      fieldTypes: {
        sensorId: 'string',
        temperature: 'number',
        humidity: 'number',
        pressure: 'number'
      }
    };
  }

  // Singleton pattern
  public static getInstance(): ApiService {
    if (!ApiService.instance) {
      ApiService.instance = new ApiService();
    }
    return ApiService.instance;
  }

  // Generate some demo data
  private generateDemoData() {
    const demoData: DataEntry[] = [];
    const now = new Date();
    
    for (let i = 0; i < 10; i++) {
      const timestamp = new Date(now.getTime() - (i * 3600000));
      demoData.push({
        id: `demo-${i}`,
        timestamp: timestamp.toISOString(),
        sensorId: `sensor-${Math.floor(Math.random() * 5) + 1}`,
        temperature: Math.round((Math.random() * 30 + 10) * 10) / 10,
        humidity: Math.round(Math.random() * 100),
        pressure: Math.round((Math.random() * 50 + 970) * 10) / 10,
      });
    }
    
    this.data = demoData;
  }

  // Set API key
  public setApiKey(key: string): void {
    this.apiKey = key;
    localStorage.setItem('csv-api-key', key);
    toast({
      title: "API Key Updated",
      description: "Your API key has been set successfully.",
    });
  }

  // Get current API key
  public getApiKey(): string {
    if (!this.apiKey) {
      const savedKey = localStorage.getItem('csv-api-key');
      if (savedKey) this.apiKey = savedKey;
    }
    return this.apiKey;
  }

  // Set Dropbox link
  public setDropboxLink(link: string): void {
    this.dropboxLink = link;
    localStorage.setItem('csv-dropbox-link', link);
    toast({
      title: "Dropbox Link Updated",
      description: "Your Dropbox link has been set successfully.",
    });
  }

  // Get current Dropbox link
  public getDropboxLink(): string {
    if (!this.dropboxLink) {
      const savedLink = localStorage.getItem('csv-dropbox-link');
      if (savedLink) this.dropboxLink = savedLink;
    }
    return this.dropboxLink;
  }

  // Set data schema
  public setSchema(schema: DataSchema): void {
    this.schema = schema;
    localStorage.setItem('csv-data-schema', JSON.stringify(schema));
    toast({
      title: "Schema Updated",
      description: "Your data schema has been updated successfully.",
    });
  }

  // Get current schema
  public getSchema(): DataSchema {
    if (!this.schema.requiredFields.length) {
      const savedSchema = localStorage.getItem('csv-data-schema');
      if (savedSchema) this.schema = JSON.parse(savedSchema);
    }
    return this.schema;
  }

  // Validate data against schema
  private validateData(data: DataEntry): { valid: boolean; errors: string[] } {
    const schema = this.getSchema();
    const errors: string[] = [];
    
    // Check required fields
    schema.requiredFields.forEach(field => {
      if (data[field] === undefined || data[field] === null) {
        errors.push(`Missing required field: ${field}`);
      }
    });
    
    // Check field types
    Object.entries(schema.fieldTypes).forEach(([field, type]) => {
      if (data[field] !== undefined && data[field] !== null) {
        const actualType = typeof data[field];
        if (actualType !== type) {
          errors.push(`Field ${field} should be type ${type}, got ${actualType}`);
        }
      }
    });
    
    return { valid: errors.length === 0, errors };
  }

  // Normalize data
  private normalizeData(data: DataEntry): DataEntry {
    const normalized = { ...data };
    
    // Ensure timestamp is in ISO format
    if (normalized.timestamp) {
      try {
        normalized.timestamp = new Date(normalized.timestamp).toISOString();
      } catch (e) {
        normalized.timestamp = new Date().toISOString();
      }
    } else {
      normalized.timestamp = new Date().toISOString();
    }
    
    // Ensure ID exists
    if (!normalized.id) {
      normalized.id = `entry-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    }
    
    return normalized;
  }

  // Receive data from API endpoint
  public receiveData(data: DataEntry, apiKey: string): { success: boolean; message: string } {
    // Validate API key
    if (apiKey !== this.apiKey) {
      return { success: false, message: "Invalid API key" };
    }

    // Validate data against schema
    const validation = this.validateData(data);
    if (!validation.valid) {
      return { success: false, message: `Data validation failed: ${validation.errors.join(', ')}` };
    }
    
    // Normalize data
    const normalizedData = this.normalizeData(data);
    
    // Add to data store
    this.data.unshift(normalizedData);
    
    // Notify subscribers
    this.notifySubscribers();
    
    return { success: true, message: "Data received successfully" };
  }

  // Get all data
  public getData(): DataEntry[] {
    return this.data;
  }

  // Clear all data
  public clearData(): void {
    this.data = [];
    this.notifySubscribers();
    toast({
      title: "Data Cleared",
      description: "All stored data has been cleared.",
    });
  }

  // Export data to CSV (simulated)
  public exportToCsv(): void {
    toast({
      title: "CSV Export Initiated",
      description: "Your data is being exported to CSV and will be available in your Dropbox shortly.",
    });
    
    setTimeout(() => {
      toast({
        title: "CSV Export Complete",
        description: "Your data has been successfully exported to CSV and is available in your Dropbox.",
      });
    }, 3000);
  }

  // Schedule daily export (simulated)
  private scheduleExport(): void {
    // In a real implementation, you would use a more reliable scheduling mechanism
    // This is just for demo purposes
    setInterval(() => {
      console.log("Daily export triggered");
      this.exportToCsv();
    }, 86400000); // 24 hours
  }

  // Subscribe to data changes
  public subscribe(callback: (data: DataEntry[]) => void): () => void {
    this.subscribers.push(callback);
    return () => {
      this.subscribers = this.subscribers.filter(cb => cb !== callback);
    };
  }

  // Notify subscribers of data changes
  private notifySubscribers(): void {
    this.subscribers.forEach(callback => callback(this.data));
  }

  // Get API usage information (for the dashboard)
  public getApiUsageStats(): { 
    totalRequests: number, 
    uniqueSources: number, 
    lastReceived: string 
  } {
    return {
      totalRequests: this.data.length,
      uniqueSources: new Set(this.data.map(d => d.sensorId)).size,
      lastReceived: this.data[0]?.timestamp || 'No data received'
    };
  }
}

export default ApiService.getInstance();
