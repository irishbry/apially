import { DataSchema } from '@/types/api.types';
import { supabase } from '@/integrations/supabase/client';
import { Json } from '@/integrations/supabase/types';

const SCHEMA_KEY = 'data_schema';

export const ConfigService = {
  getSchema: async (apiKey?: string): Promise<DataSchema> => {
    try {
      if (apiKey) {
        console.log('Fetching schema for API key:', apiKey);
        
        // Primary: Try to get schema from schema_configs table
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
        
        if (schemaConfigError) {
          console.warn('Error fetching schema from schema_configs:', schemaConfigError);
        } else {
          console.log('No schema found in schema_configs for API key:', apiKey);
        }
        
        // Fallback: Try sources table for backward compatibility
        const { data: source, error: sourceError } = await supabase
          .from('sources')
          .select('schema')
          .eq('api_key', apiKey)
          .maybeSingle();
        
        if (!sourceError && source && source.schema) {
          console.log('Found schema in sources table (fallback):', source.schema);
          const sourceSchema = source.schema as unknown as DataSchema;
          
          // Migrate data from sources to schema_configs for future use
          await ConfigService.migrateSourceSchemaToConfig(apiKey, sourceSchema);
          
          return {
            fieldTypes: sourceSchema.fieldTypes || {},
            requiredFields: sourceSchema.requiredFields || []
          };
        }
        
        if (sourceError) {
          console.warn('Error fetching schema from sources table:', sourceError);
        }
      }
      
      // Return default schema if nothing is found
      return {
        fieldTypes: {},
        requiredFields: []
      };
    } catch (error) {
      console.error('Error fetching schema:', error);
      return {
        fieldTypes: {},
        requiredFields: []
      };
    }
  },
  
  setSchema: async (schema: DataSchema, apiKey?: string): Promise<boolean> => {
    try {
      console.log('Setting schema:', schema, 'for API key:', apiKey);
      
      if (apiKey) {
        // First, verify that the API key exists in the sources table
        const { data: sourceExists, error: sourceCheckError } = await supabase
          .from('sources')
          .select('id')
          .eq('api_key', apiKey)
          .maybeSingle();
        
        if (sourceCheckError) {
          console.error('Error checking if source exists:', sourceCheckError);
          return false;
        }
        
        if (!sourceExists) {
          console.error('API key does not exist in sources table:', apiKey);
          return false;
        }
        
        // Get user session
        const { data: { session } } = await supabase.auth.getSession();
        const userId = session?.user?.id;
        
        if (!userId) {
          console.error('No user ID found, user must be logged in to save schema');
          return false;
        }
        
        // Primary: Save to schema_configs table
        const success = await ConfigService.saveToSchemaConfigs(apiKey, schema, userId);
        
        if (success) {
          // Secondary: Update sources table for backward compatibility
          await ConfigService.updateSourcesSchema(apiKey, schema);
          console.log('Schema saved successfully to both tables');
          return true;
        }
        
        return false;
      }
      
      // If no API key, save to localStorage as fallback
      localStorage.setItem(SCHEMA_KEY, JSON.stringify(schema));
      return true;
    } catch (error) {
      console.error('Error saving schema:', error);
      return false;
    }
  },
  
  saveToSchemaConfigs: async (apiKey: string, schema: DataSchema, userId: string): Promise<boolean> => {
    try {
      console.log('Attempting to save schema to schema_configs:', { apiKey, schema, userId });
      
      // Check if entry exists in schema_configs
      const { data: existingConfig, error: selectError } = await supabase
        .from('schema_configs')
        .select('id')
        .eq('api_key', apiKey)
        .maybeSingle();
      
      if (selectError) {
        console.error('Error checking existing schema config:', selectError);
        return false;
      }
      
      if (existingConfig) {
        console.log('Updating existing schema config:', existingConfig.id);
        // Update existing record
        const { error: updateError } = await supabase
          .from('schema_configs')
          .update({
            field_types: schema.fieldTypes as Json,
            required_fields: schema.requiredFields as Json,
            updated_at: new Date().toISOString()
          })
          .eq('api_key', apiKey);
        
        if (updateError) {
          console.error('Error updating schema_configs:', updateError);
          return false;
        }
        
        console.log('Successfully updated schema config');
        return true;
      } else {
        console.log('Creating new schema config for API key:', apiKey);
        
        // Get source name for the schema config
        const { data: source } = await supabase
          .from('sources')
          .select('name')
          .eq('api_key', apiKey)
          .maybeSingle();
          
        const sourceName = source?.name || 'Unknown Source';
        
        // Insert new record
        const { error: insertError } = await supabase
          .from('schema_configs')
          .insert({
            name: `Schema for ${sourceName}`,
            description: `Schema validation configuration for API key ${apiKey.substring(0, 8)}...`,
            api_key: apiKey,
            field_types: schema.fieldTypes as Json,
            required_fields: schema.requiredFields as Json,
            user_id: userId
          });
          
        if (insertError) {
          console.error('Error inserting schema_configs:', insertError);
          return false;
        }
        
        console.log('Successfully created schema config');
        return true;
      }
    } catch (error) {
      console.error('Error in saveToSchemaConfigs:', error);
      return false;
    }
  },
  
  updateSourcesSchema: async (apiKey: string, schema: DataSchema): Promise<void> => {
    try {
      // Update the sources table for backward compatibility
      const { error } = await supabase
        .from('sources')
        .update({ 
          schema: schema as unknown as Json
        })
        .eq('api_key', apiKey);
      
      if (error) {
        console.warn('Error updating schema in sources table (non-critical):', error);
      } else {
        console.log('Successfully updated sources table schema');
      }
    } catch (error) {
      console.warn('Error in updateSourcesSchema (non-critical):', error);
    }
  },
  
  migrateSourceSchemaToConfig: async (apiKey: string, schema: DataSchema): Promise<void> => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const userId = session?.user?.id;
      
      if (!userId) {
        console.log('Cannot migrate schema: no user session');
        return;
      }
      
      // Check if already exists in schema_configs
      const { data: existing } = await supabase
        .from('schema_configs')
        .select('id')
        .eq('api_key', apiKey)
        .maybeSingle();
      
      if (!existing) {
        console.log('Migrating schema from sources to schema_configs');
        await ConfigService.saveToSchemaConfigs(apiKey, schema, userId);
      }
    } catch (error) {
      console.warn('Error during schema migration (non-critical):', error);
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
