
import { supabase } from '@/integrations/supabase/client';
import { DataEntry } from '@/types/api.types';

export const DataService = {
  getData: async (options: { limit?: number; offset?: number; includeCount?: boolean } = {}): Promise<DataEntry[]> => {
    const { limit = 1000, offset = 0, includeCount = false } = options;
    
    try {
      let query = supabase
        .from('data_entries')
        .select('*', { count: includeCount ? 'exact' : undefined })
        .order('created_at', { ascending: false });

      if (limit > 0) {
        query = query.limit(limit);
      }
      
      if (offset > 0) {
        query = query.range(offset, offset + limit - 1);
      }

      const { data, error, count } = await query;
      
      if (error) {
        console.error('Error fetching data:', error);
        return [];
      }
      
      const mappedData = data.map(item => {
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

      // Store count for pagination
      if (includeCount && count !== null) {
        (mappedData as any).totalCount = count;
      }

      return mappedData;
    } catch (error) {
      console.error('Error in getData:', error);
      return [];
    }
  },

  getDataCount: async (): Promise<number> => {
    try {
      const { count, error } = await supabase
        .from('data_entries')
        .select('*', { count: 'exact', head: true });
      
      if (error) {
        console.error('Error fetching data count:', error);
        return 0;
      }
      
      return count || 0;
    } catch (error) {
      console.error('Error in getDataCount:', error);
      return 0;
    }
  },
  
  getDataStats: async (): Promise<{
    totalCount: number;
    uniqueSources: number;
    lastReceived: string;
    backedUpDropbox: number;
  }> => {
    try {
      // Get total count
      const { count: totalCount, error: countError } = await supabase
        .from('data_entries')
        .select('*', { count: 'exact', head: true });

      if (countError) {
        console.error('Error fetching total count:', countError);
        return { totalCount: 0, uniqueSources: 0, lastReceived: 'No data', backedUpDropbox: 0 };
      }

      // Get latest entry for last received timestamp
      const { data: latestData, error: latestError } = await supabase
        .from('data_entries')
        .select('timestamp')
        .order('created_at', { ascending: false })
        .limit(1);

      // Get unique sources count
      const { data: sourcesData, error: sourcesError } = await supabase
        .from('data_entries')
        .select('source_id')
        .not('source_id', 'is', null);

      // Get backed up dropbox count
      const { count: backedUpCount, error: backedUpError } = await supabase
        .from('data_entries')
        .select('*', { count: 'exact', head: true })
        .eq('backed_up_dropbox', true);

      const uniqueSources = sourcesData ? new Set(sourcesData.map(item => item.source_id)).size : 0;
      const lastReceived = latestData && latestData.length > 0 ? latestData[0].timestamp : 'No data';
      const backedUpDropbox = backedUpError ? 0 : (backedUpCount || 0);

      return {
        totalCount: totalCount || 0,
        uniqueSources,
        lastReceived,
        backedUpDropbox
      };
    } catch (error) {
      console.error('Error in getDataStats:', error);
      return { totalCount: 0, uniqueSources: 0, lastReceived: 'No data', backedUpDropbox: 0 };
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
