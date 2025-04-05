
import { DataSchema } from '@/types/api.types';
import { supabase } from '@/integrations/supabase/client';
import { Json } from '@/integrations/supabase/types';

const SCHEMA_KEY = 'data_schema';

export const ConfigService = {
  getSchema: async (apiKey?: string): Promise<DataSchema> => {
    try {
      if (apiKey) {
        console.log('Fetching schema for API key:', apiKey);
        
        // If API key is provided, try to fetch schema from schema_configs table first
        const { data: schemaConfig, error: schemaConfigError } = await supabase
          .from('schema_configs')
          .select('field_types, required_fields')
          .eq('api_key', apiKey)
          .maybeSingle();
        
        if (!schemaConfigError && schemaConfig) {
          console.log('Found schema in schema_configs table:', schemaConfig);
          return {
            fieldTypes: schemaConfig.field_types as Record<string, string> || {},
            requiredFields: schemaConfig.required_fields as string[] || []
          };
        }
        
        // If not found in schema_configs, fallback to sources table
        const { data: source, error: sourceError } = await supabase
          .from('sources')
          .select('schema')
          .eq('api_key', apiKey)
          .maybeSingle();
        
        if (!sourceError && source && source.schema) {
          console.log('Found schema in sources table:', source.schema);
          const sourceSchema = source.schema as unknown as DataSchema;
          return {
            fieldTypes: sourceSchema.fieldTypes || {},
            requiredFields: sourceSchema.requiredFields || []
          };
        }
        
        if (sourceError) {
          console.error('Error fetching schema from sources:', sourceError);
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
      console.log('Setting schema:', schema, 'for API key:', apiKey);
      
      // Save to local storage for immediate use
      localStorage.setItem(SCHEMA_KEY, JSON.stringify(schema));
      
      // If API key is provided, update schema in the schema_configs table
      if (apiKey) {
        // Check if entry exists in schema_configs
        const { data: existingConfig, error: checkError } = await supabase
          .from('schema_configs')
          .select('id')
          .eq('api_key', apiKey)
          .maybeSingle();
        
        if (checkError) {
          console.error('Error checking schema_configs:', checkError);
          return false;
        }
        
        if (existingConfig) {
          console.log('Updating existing schema config:', existingConfig.id);
          // Update existing record
          const { error: updateError } = await supabase
            .from('schema_configs')
            .update({
              field_types: schema.fieldTypes as unknown as Json,
              required_fields: schema.requiredFields as unknown as Json,
              updated_at: new Date().toISOString()
            })
            .eq('api_key', apiKey);
          
          if (updateError) {
            console.error('Error updating schema_configs:', updateError);
            return false;
          }
        } else {
          console.log('Creating new schema config for API key:', apiKey);
          // Fetch source name first
          const { data: source, error: sourceError } = await supabase
            .from('sources')
            .select('name')
            .eq('api_key', apiKey)
            .maybeSingle();
            
          if (sourceError) {
            console.error('Error fetching source for API key:', sourceError);
            return false;
          }
          
          if (!source) {
            console.error('No source found for API key:', apiKey);
            return false;
          }
          
          // Insert new record
          const { data: insertData, error: insertError } = await supabase
            .from('schema_configs')
            .insert({
              name: `Schema for ${source.name}`,
              description: `Schema validation configuration for API key ${apiKey.substring(0, 8)}...`,
              api_key: apiKey,
              field_types: schema.fieldTypes as unknown as Json,
              required_fields: schema.requiredFields as unknown as Json
            })
            .select();
            
          if (insertError) {
            console.error('Error inserting schema_configs:', insertError);
            return false;
          }
          
          console.log('Successfully created schema config:', insertData);
        }
        
        // Also update legacy schema in sources table for backward compatibility
        // Cast the schema to Json type for the sources table
        const schemaAsJson = schema as unknown as Json;
        const { error } = await supabase
          .from('sources')
          .update({ 
            schema: schemaAsJson
          })
          .eq('api_key', apiKey);
        
        if (error) {
          console.error('Error updating schema in sources table:', error);
          return false;
        }
      }
      
      // Also save to API endpoint for PHP backend
      try {
        const response = await fetch('/api/schema', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(apiKey ? { 'Authorization': `Bearer ${apiKey}` } : {})
          },
          body: JSON.stringify(schema),
        });
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error('API returned error:', errorText);
          return false;
        }
        
        console.log('Schema successfully saved to API endpoint');
        return true;
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
