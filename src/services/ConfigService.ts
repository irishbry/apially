
import { DataSchema } from '@/types/api.types';
import { supabase } from '@/integrations/supabase/client';

const SCHEMA_KEY = 'data_schema';

export const ConfigService = {
  getSchema: async (): Promise<DataSchema> => {
    try {
      // Try to get schema from local storage first
      const storedSchema = localStorage.getItem(SCHEMA_KEY);
      if (storedSchema) {
        return JSON.parse(storedSchema);
      }
      
      // If not in local storage, try to fetch from the API
      const response = await fetch('/api/endpoints/schema_endpoint.php');
      if (response.ok) {
        const data = await response.json();
        if (data && data.schema) {
          // Cache the schema in local storage
          localStorage.setItem(SCHEMA_KEY, JSON.stringify(data.schema));
          return data.schema;
        }
      }
    } catch (error) {
      console.error('Error fetching schema:', error);
    }
    
    // Return default schema if nothing is found
    return {
      fieldTypes: {},
      requiredFields: []
    };
  },
  
  setSchema: async (schema: DataSchema): Promise<boolean> => {
    try {
      // Save to local storage for immediate use
      localStorage.setItem(SCHEMA_KEY, JSON.stringify(schema));
      
      // Save to API endpoint
      const response = await fetch('/api/endpoints/schema_endpoint.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(schema),
      });
      
      return response.ok;
    } catch (error) {
      console.error('Error saving schema:', error);
      return false;
    }
  },
  
  validateDataAgainstSchema: (data: any, schema: DataSchema): { valid: boolean; errors: string[] } => {
    const errors: string[] = [];
    
    // Check required fields
    schema.requiredFields.forEach(field => {
      if (!data[field] && data[field] !== 0 && data[field] !== false) {
        errors.push(`Missing required field: ${field}`);
      }
    });
    
    // Check field types
    Object.entries(schema.fieldTypes).forEach(([field, expectedType]) => {
      if (data[field] !== undefined && data[field] !== null) {
        const actualType = getDataType(data[field]);
        if (actualType !== expectedType) {
          errors.push(`Field ${field} should be type ${expectedType}, got ${actualType}`);
        }
      }
    });
    
    return {
      valid: errors.length === 0,
      errors
    };
  },
  
  getApiKey: (): string => {
    return localStorage.getItem('api_key') || '';
  },
  
  setApiKey: (key: string): void => {
    localStorage.setItem('api_key', key);
  },
  
  getDropboxLink: (): string => {
    return localStorage.getItem('dropbox_link') || '';
  },
  
  setDropboxLink: (link: string): void => {
    localStorage.setItem('dropbox_link', link);
  },
  
  exportToCsv: (): void => {
    // Placeholder for implementation
  }
};

// Helper function to determine data type
function getDataType(value: any): string {
  if (typeof value === 'number') {
    return 'number';
  } else if (typeof value === 'boolean') {
    return 'boolean';
  } else if (typeof value === 'string') {
    return 'string';
  } else if (Array.isArray(value)) {
    return 'array';
  } else if (typeof value === 'object' && value !== null) {
    return 'object';
  } else {
    return 'unknown';
  }
}
