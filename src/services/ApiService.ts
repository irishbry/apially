
import { DataService } from './DataService';
import { SourcesService } from './SourcesService';
import { AnalyticsService } from './AnalyticsService';
import { ApiRequestService } from './ApiRequestService';
import { ConfigService } from './ConfigService';
import { DataEntry, ApiResponse } from '@/types/api.types';

// Re-export types from their new location
export * from '@/types/api.types';

// Create a unified API service that composes functionality from the other services
export const ApiService = {
  // Data Service functions
  getData: DataService.getData,
  refreshData: DataService.refreshData,
  deleteDataEntry: DataService.deleteDataEntry,
  clearData: DataService.clearData,
  subscribe: DataService.subscribe,
  
  // Sources Service functions
  getSources: SourcesService.getSources,
  getSourcesStats: SourcesService.getSourcesStats,
  getApiUsageBySource: SourcesService.getApiUsageBySource,
  subscribeToSources: SourcesService.subscribeToSources,
  
  // Analytics Service functions
  getApiUsageByDay: AnalyticsService.getApiUsageByDay,
  getLogs: AnalyticsService.getLogs,
  
  // API Request Service functions
  receiveData: ApiRequestService.receiveData,
  testApiConnection: ApiRequestService.testApiConnection,
  
  // Config Service functions
  getSchema: ConfigService.getSchema,
  setSchema: ConfigService.setSchema,
  getApiKey: ConfigService.getApiKey,
  setApiKey: ConfigService.setApiKey,
  getDropboxLink: ConfigService.getDropboxLink,
  setDropboxLink: ConfigService.setDropboxLink,
  exportToCsv: ConfigService.exportToCsv
};
