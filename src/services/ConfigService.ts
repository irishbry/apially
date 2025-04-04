import { DataSchema } from '@/types/api.types';
import { supabase } from '@/integrations/supabase/client';

const SCHEMA_KEY = 'data_schema';

export const ConfigService = {
  getSchema: async (apiKey?: string): Promise<DataSchema> => {
    try {
      if (apiKey) {
        // If API key is provided, try to fetch schema associated with that API key
        const { data: source } = await supabase
          .from('sources')
          .select('schema')
          .eq('api_key', apiKey)
          .single();
        
        if (source && source.schema) {
          return source.schema as DataSchema;
        }
      }
      
      // Try to get schema from local storage as fallback
      const storedSchema = localStorage.getItem(SCHEMA_KEY);
      if (storedSchema) {
        return JSON.parse(storedSchema);
      }
      
      // If not in local storage, try to fetch from the API
      try {
        const response = await fetch('/api/schema');
        if (response.ok) {
          const data = await response.json();
          if (data && data.schema) {
            // Cache the schema in local storage
            localStorage.setItem(SCHEMA_KEY, JSON.stringify(data.schema));
            return data.schema;
          }
        }
      } catch (apiError) {
        console.error('Error fetching schema from API:', apiError);
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
  
  setSchema: async (schema: DataSchema, apiKey?: string): Promise<boolean> => {
    try {
      // Save to local storage for immediate use
      localStorage.setItem(SCHEMA_KEY, JSON.stringify(schema));
      
      // If API key is provided, update schema for that specific source
      if (apiKey) {
        const { error } = await supabase
          .from('sources')
          .update({ schema })
          .eq('api_key', apiKey);
        
        if (error) {
          console.error('Error updating schema in Supabase:', error);
          return false;
        }
      }
      
      // Also save to API endpoint for PHP backend
      try {
        const response = await fetch('/api/schema', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(schema),
        });
        
        return response.ok;
      } catch (apiError) {
        console.error('Error saving schema to API:', apiError);
        return false;
      }
    } catch (error) {
      console.error('Error saving schema:', error);
      return false;
    }
  },
  
  validateDataAgainstSchema: async (data: any, schema?: DataSchema, apiKey?: string): Promise<{ valid: boolean; errors: string[] }> => {
    try {
      // If schema is not provided, try to get it
      if (!schema) {
        schema = await ConfigService.getSchema(apiKey);
      }
      
      const errors: string[] = [];
      
      // Check required fields
      for (const field of schema.requiredFields) {
        if (data[field] === undefined || data[field] === null || data[field] === '') {
          errors.push(`Missing required field: ${field}`);
        }
      }
      
      // Check field types
      for (const [field, expectedType] of Object.entries(schema.fieldTypes)) {
        if (data[field] !== undefined && data[field] !== null && data[field] !== '') {
          const actualType = getDataType(data[field]);
          if (actualType !== expectedType) {
            errors.push(`Field ${field} should be type ${expectedType}, got ${actualType}`);
          }
        }
      }
      
      return {
        valid: errors.length === 0,
        errors
      };
    } catch (error) {
      console.error('Error validating data:', error);
      return {
        valid: false,
        errors: ['Error validating data against schema']
      };
    }
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
