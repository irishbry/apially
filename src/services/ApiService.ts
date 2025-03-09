import { toast } from "@/components/ui/use-toast";

// Type for incoming data
export interface DataEntry {
  id?: string;
  timestamp?: string;
  sourceId?: string;
  [key: string]: any;
}

// Schema validation interface
export interface DataSchema {
  requiredFields: string[];
  fieldTypes: {[key: string]: string};
}

// Source interface
export interface Source {
  id: string;
  name: string;
  apiKey: string;
  createdAt: string;
  dataCount: number;
  active: boolean;
  lastActive?: string;
}

// Main API service
class ApiService {
  private static instance: ApiService;
  private data: DataEntry[] = [];
  private sources: Source[] = [];
  private dropboxLink: string = "";
  private apiKey: string = "";
  private subscribers: ((data: DataEntry[]) => void)[] = [];
  private sourceSubscribers: ((sources: Source[]) => void)[] = [];
  private schema: DataSchema = {
    requiredFields: [],
    fieldTypes: {}
  };
  private isAuthenticated: boolean = false;

  private constructor() {
    // Initialize with demo data
    this.generateDemoData();
    
    // Initialize with demo sources
    this.loadSources();
    
    // Load saved API key
    this.loadApiKey();
    
    // Check if user is authenticated
    this.checkAuthentication();
    
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

  // Load API key from localStorage
  private loadApiKey(): void {
    const savedKey = localStorage.getItem('csv-api-key');
    if (savedKey) {
      this.apiKey = savedKey;
    }
  }

  // Get current API key
  public getApiKey(): string {
    return this.apiKey;
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

  // Check if user is authenticated
  private checkAuthentication(): void {
    const authStatus = localStorage.getItem('csv-api-auth');
    this.isAuthenticated = authStatus === 'true';
  }

  // Login function
  public login(username: string, password: string): boolean {
    // In a real app, this should validate against a secure backend
    // For demo, we'll use a simple check
    if (username === 'admin' && password === 'password') {
      this.isAuthenticated = true;
      localStorage.setItem('csv-api-auth', 'true');
      
      // Dispatch auth change event
      window.dispatchEvent(new Event('auth-change'));
      
      return true;
    }
    return false;
  }

  // Logout function
  public logout(): void {
    this.isAuthenticated = false;
    localStorage.removeItem('csv-api-auth');
    
    // Dispatch auth change event
    window.dispatchEvent(new Event('auth-change'));
  }

  // Check if user is authenticated
  public isUserAuthenticated(): boolean {
    return this.isAuthenticated;
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
        sourceId: `source-${Math.floor(Math.random() * 3) + 1}`,
        sensorId: `sensor-${Math.floor(Math.random() * 5) + 1}`,
        temperature: Math.round((Math.random() * 30 + 10) * 10) / 10,
        humidity: Math.round(Math.random() * 100),
        pressure: Math.round((Math.random() * 50 + 970) * 10) / 10,
      });
    }
    
    this.data = demoData;
  }

  // Load saved sources or create demo sources
  private loadSources() {
    const savedSources = localStorage.getItem('csv-api-sources');
    if (savedSources) {
      this.sources = JSON.parse(savedSources);
    } else {
      // Create demo sources
      this.sources = [
        {
          id: 'source-1',
          name: 'Factory Sensors',
          apiKey: 'demo-key-factory',
          createdAt: new Date().toISOString(),
          dataCount: 4,
          active: true,
          lastActive: new Date().toISOString()
        },
        {
          id: 'source-2',
          name: 'Warehouse Monitors',
          apiKey: 'demo-key-warehouse',
          createdAt: new Date().toISOString(),
          dataCount: 3,
          active: true,
          lastActive: new Date().toISOString()
        },
        {
          id: 'source-3',
          name: 'Office Environment',
          apiKey: 'demo-key-office',
          createdAt: new Date().toISOString(),
          dataCount: 3,
          active: true,
          lastActive: new Date().toISOString()
        }
      ];
      this.saveSources();
    }
  }

  // Save sources to localStorage
  private saveSources() {
    localStorage.setItem('csv-api-sources', JSON.stringify(this.sources));
  }

  // Get all sources
  public getSources(): Source[] {
    return [...this.sources];
  }

  // Add a new source
  public addSource(name: string): Source {
    const id = `source-${Date.now()}`;
    const apiKey = this.generateApiKey();
    
    const newSource: Source = {
      id,
      name,
      apiKey,
      createdAt: new Date().toISOString(),
      active: true,
      dataCount: 0
    };
    
    this.sources.push(newSource);
    this.saveSources();
    this.notifySourceSubscribers();
    
    return newSource;
  }

  // Update a source name
  public updateSourceName(id: string, name: string): boolean {
    const sourceIndex = this.sources.findIndex(s => s.id === id);
    if (sourceIndex === -1) return false;
    
    this.sources[sourceIndex].name = name;
    this.saveSources();
    this.notifySourceSubscribers();
    
    return true;
  }

  // Toggle source active state
  public toggleSourceActive(id: string): boolean {
    const sourceIndex = this.sources.findIndex(s => s.id === id);
    if (sourceIndex === -1) return false;
    
    this.sources[sourceIndex].active = !this.sources[sourceIndex].active;
    this.saveSources();
    this.notifySourceSubscribers();
    
    return true;
  }

  // Generate a new API key for a source
  public regenerateApiKey(id: string): string | null {
    const sourceIndex = this.sources.findIndex(s => s.id === id);
    if (sourceIndex === -1) return null;
    
    const newApiKey = this.generateApiKey();
    this.sources[sourceIndex].apiKey = newApiKey;
    this.saveSources();
    this.notifySourceSubscribers();
    
    return newApiKey;
  }

  // Delete a source
  public deleteSource(id: string): boolean {
    const initialLength = this.sources.length;
    this.sources = this.sources.filter(s => s.id !== id);
    
    if (this.sources.length !== initialLength) {
      // Also delete all data associated with this source
      this.data = this.data.filter(d => d.sourceId !== id);
      
      this.saveSources();
      this.notifySourceSubscribers();
      this.notifySubscribers();
      return true;
    }
    
    return false;
  }

  // Generate a random API key
  private generateApiKey(): string {
    return Array.from(Array(32), () => Math.floor(Math.random() * 36).toString(36)).join('');
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
  private normalizeData(data: DataEntry, sourceId: string): DataEntry {
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
    
    // Add source ID
    normalized.sourceId = sourceId;
    
    return normalized;
  }

  // Find source by API key
  private findSourceByApiKey(apiKey: string): Source | null {
    const source = this.sources.find(s => s.apiKey === apiKey) || null;
    // Also check if the source is active
    if (source && !source.active) {
      return null; // Treat inactive sources as if they don't exist
    }
    return source;
  }

  // Update source stats after receiving data
  private updateSourceStats(sourceId: string): void {
    const sourceIndex = this.sources.findIndex(s => s.id === sourceId);
    if (sourceIndex === -1) return;
    
    this.sources[sourceIndex].dataCount += 1;
    this.sources[sourceIndex].lastActive = new Date().toISOString();
    this.saveSources();
    this.notifySourceSubscribers();
  }

  // Receive data from API endpoint
  public receiveData(data: DataEntry, apiKey: string): { success: boolean; message: string } {
    // Find source by API key
    const source = this.findSourceByApiKey(apiKey);
    if (!source) {
      return { success: false, message: "Invalid API key or inactive source" };
    }

    // Validate data against schema
    const validation = this.validateData(data);
    if (!validation.valid) {
      return { success: false, message: `Data validation failed: ${validation.errors.join(', ')}` };
    }
    
    // Normalize data and add source ID
    const normalizedData = this.normalizeData(data, source.id);
    
    // Add to data store
    this.data.unshift(normalizedData);
    
    // Update source stats
    this.updateSourceStats(source.id);
    
    // Notify subscribers
    this.notifySubscribers();
    
    return { success: true, message: "Data received successfully" };
  }

  // Get all data
  public getData(): DataEntry[] {
    return this.data;
  }

  // Get data for a specific source
  public getDataBySource(sourceId: string): DataEntry[] {
    return this.data.filter(d => d.sourceId === sourceId);
  }

  // Clear all data
  public clearData(): void {
    this.data = [];
    
    // Reset data counts for all sources
    this.sources.forEach(s => s.dataCount = 0);
    this.saveSources();
    
    this.notifySubscribers();
    this.notifySourceSubscribers();
    
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

  // Subscribe to source changes
  public subscribeToSources(callback: (sources: Source[]) => void): () => void {
    this.sourceSubscribers.push(callback);
    return () => {
      this.sourceSubscribers = this.sourceSubscribers.filter(cb => cb !== callback);
    };
  }

  // Notify subscribers of data changes
  private notifySubscribers(): void {
    this.subscribers.forEach(callback => callback(this.data));
  }

  // Notify subscribers of source changes
  private notifySourceSubscribers(): void {
    this.sourceSubscribers.forEach(callback => callback(this.sources));
  }

  // Get API usage information (for the dashboard)
  public getApiUsageStats(): { 
    totalRequests: number, 
    uniqueSources: number, 
    lastReceived: string 
  } {
    return {
      totalRequests: this.data.length,
      uniqueSources: new Set(this.data.map(d => d.sourceId)).size,
      lastReceived: this.data[0]?.timestamp || 'No data received'
    };
  }

  // Get source-specific stats
  public getSourcesStats(): {
    totalSources: number,
    activeSources: number,
    totalDataPoints: number
  } {
    return {
      totalSources: this.sources.length,
      activeSources: this.sources.filter(s => s.active && s.dataCount > 0).length,
      totalDataPoints: this.sources.reduce((sum, s) => sum + s.dataCount, 0)
    };
  }
}

export default ApiService.getInstance();
