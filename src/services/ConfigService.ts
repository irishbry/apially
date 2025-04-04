
import { DataSchema } from '@/types/api.types';

export const ConfigService = {
  getSchema: (): DataSchema => {
    return {
      fieldTypes: {},
      requiredFields: []
    };
  },
  
  setSchema: (schema: DataSchema): void => {
    // Placeholder for implementation
  },
  
  getApiKey: (): string => {
    return '';
  },
  
  setApiKey: (key: string): void => {
    // Placeholder for implementation
  },
  
  getDropboxLink: (): string => {
    return '';
  },
  
  setDropboxLink: (link: string): void => {
    // Placeholder for implementation
  },
  
  exportToCsv: (): void => {
    // Placeholder for implementation
  }
};
