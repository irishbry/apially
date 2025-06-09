
import { Json } from '@/integrations/supabase/types';

// Define the types needed across the application
export interface DataEntry {
  id?: string;
  timestamp?: string;
  sourceId?: string;
  source_id?: string;
  sensorId?: string;
  sensor_id?: string;
  userId?: string;
  user_id?: string;
  fileName?: string;
  file_name?: string;
  filePath?: string;
  file_path?: string;
  receivedAt?: string;
  clientIp?: string;
  temperature?: number;
  humidity?: number;
  pressure?: number;
  metadata?: Record<string, any> | null;
  [key: string]: any;
}

export interface ApiLog {
  id: string;
  timestamp: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  endpoint: string;
  status: string;
  statusCode?: number;
  responseTime?: number;
  source: string;
  ip: string;
  userAgent?: string;
  message?: string;
  requestBody?: string;
  responseBody?: string;
  error?: string;
}

export interface ApiResponse {
  success: boolean;
  message: string;
  code?: string;  // Added the optional code property
  data?: any;
}

export interface Source {
  id: string;
  name: string;
  api_key?: string;  // Changed from apiKey to api_key to match database
  active: boolean;
  last_active?: string;  // Changed from lastActive to last_active
  data_count?: number;   // Changed from dataCount to data_count
  url?: string;
  user_id?: string;      // Changed from userId to user_id
  created_at?: string;   // Added to match database schema
  schema?: any;          // Added to match database schema
}

export interface DataSchema {
  fieldTypes: Record<string, string>;
  requiredFields: string[];
}

export interface ApiUsageByDay {
  date: string;
  count: number;
  source?: string;
}

export interface ApiUsageBySource {
  source: string;
  count: number;
  percentage: number;
}
