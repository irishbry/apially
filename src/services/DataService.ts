
import { supabase } from '@/integrations/supabase/client';
import { DataEntry } from '@/types/api.types';

export const DataService = {
  getData: async (limit: number = 1000): Promise<DataEntry[]> => {
    try {
      const { data, error } = await supabase
        .from('data_entries')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);
      
      if (error) {
        console.error('Error fetching data:', error);
        return [];
      }
      
      return data.map(item => {
        let parsedMetadata: Record<string, any> | null = null;
        
        if (item.metadata) {
          if (typeof item.metadata === 'string') {
            try {
              parsedMetadata = JSON.parse(item.metadata);
            } catch (e) {
              parsedMetadata = { raw: item.metadata };
            }
          } else if (typeof item.metadata === 'object') {
            // Handle Json type from Supabase
            parsedMetadata = item.metadata as Record<string, any>;
          }
        }
        
        return {
          id: item.id,
          timestamp: item.timestamp,
          source_id: item.source_id,
          sourceId: item.source_id,
          user_id: item.user_id,
          userId: item.user_id,
          sensor_id: item.sensor_id,
          sensorId: item.sensor_id,
          file_name: item.file_name,
          fileName: item.file_name,
          file_path: item.file_path,
          filePath: item.file_path,
          metadata: parsedMetadata,
          ...item
        } as DataEntry;
      });
    } catch (error) {
      console.error('Error in getData:', error);
      return [];
    }
  },
  
  refreshData: async () => {
    return await DataService.getData();
  },
  
  deleteDataEntry: async (id: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('data_entries')
        .delete()
        .eq('id', id);
      
      if (error) {
        console.error('Error deleting entry:', error);
        return false;
      }
     
      
      return true;
    } catch (error) {
      console.error('Error in deleteDataEntry:', error);
      return false;
    }
  },
  
  clearData: async () => {
    try {
      const { error } = await supabase
        .from('data_entries')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000'); // This will match all rows since no row will have this ID
      
      if (error) {
        console.error('Error clearing data:', error);
        throw error;
      }
    
    } catch (error) {
      console.error('Error in clearData:', error);
      throw error;
    }
  },
  
  subscribe: (callback: (data: DataEntry[]) => void) => {
    const channel = supabase
      .channel('data_entries_changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'data_entries' }, 
        async () => {
          const freshData = await DataService.getData();
          callback(freshData);
        }
      )
      .subscribe();
    
    DataService.getData().then(callback);
    
    return () => {
      supabase.removeChannel(channel);
    };
  }
};
