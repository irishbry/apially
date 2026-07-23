
import { supabase } from '@/integrations/supabase/client';
import { DataEntry } from '@/types/api.types';

export const DataService = {
  getData: async (options: { limit?: number; offset?: number; includeCount?: boolean; sourceId?: string } = {}): Promise<DataEntry[]> => {
    const { limit = 1000, offset = 0, includeCount = false, sourceId } = options;
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase.rpc('get_latest_active_data_entries', {
        p_user_id: user.id,
        p_limit: limit,
        p_offset: offset,
        p_source_id: sourceId || null,
      });
      
      if (error) {
        console.error('Error fetching data:', error);
        return [];
      }
      
      const mappedData = (data || []).map(item => {
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

      if (includeCount) {
        const totalCount = await DataService.getDataCount({ sourceId });
        (mappedData as any).totalCount = totalCount;
      }

      return mappedData;
    } catch (error) {
      console.error('Error in getData:', error);
      return [];
    }
  },

  getDataCount: async (options: { sourceId?: string } = {}): Promise<number> => {
    const { sourceId } = options;
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return 0;

      const { data, error } = await supabase.rpc('get_active_data_entries_count', {
        p_user_id: user.id,
        p_source_id: sourceId || null,
      });
      
      if (error) {
        console.error('Error fetching data count:', error);
        return 0;
      }
      
      return Number(data || 0);
    } catch (error) {
      console.error('Error in getDataCount:', error);
      return 0;
    }
  },

  searchData: async (options: {
    query?: string;
    sourceId?: string;
    from?: string;
    to?: string;
    limit?: number;
    offset?: number;
  } = {}): Promise<DataEntry[]> => {
    const { query, sourceId, from, to, limit = 100, offset = 0 } = options;
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase.rpc('search_data_entries', {
        p_user_id: user.id,
        p_query: query || null,
        p_source_id: sourceId || null,
        p_from: from || null,
        p_to: to || null,
        p_limit: limit,
        p_offset: offset,
      });

      if (error) {
        console.error('Error searching data:', error);
        return [];
      }

      return (data || []).map((item: any) => {
        let parsedMetadata: Record<string, any> | null = null;
        if (item.metadata) {
          if (typeof item.metadata === 'string') {
            try { parsedMetadata = JSON.parse(item.metadata); }
            catch { parsedMetadata = { raw: item.metadata }; }
          } else if (typeof item.metadata === 'object') {
            parsedMetadata = item.metadata as Record<string, any>;
          }
        }
        return {
          ...item,
          sourceId: item.source_id,
          userId: item.user_id,
          sensorId: item.sensor_id,
          fileName: item.file_name,
          filePath: item.file_path,
          metadata: parsedMetadata,
        } as DataEntry;
      });
    } catch (err) {
      console.error('Error in searchData:', err);
      return [];
    }
  },

  searchDataCount: async (options: {
    query?: string;
    sourceId?: string;
    from?: string;
    to?: string;
  } = {}): Promise<number> => {
    const { query, sourceId, from, to } = options;
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return 0;

      const { data, error } = await supabase.rpc('search_data_entries_count', {
        p_user_id: user.id,
        p_query: query || null,
        p_source_id: sourceId || null,
        p_from: from || null,
        p_to: to || null,
      });
      if (error) {
        console.error('Error counting search:', error);
        return 0;
      }
      return Number(data || 0);
    } catch (err) {
      console.error('Error in searchDataCount:', err);
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
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return { totalCount: 0, uniqueSources: 0, lastReceived: 'No data', backedUpDropbox: 0 };

      // Use RPCs scoped to the signed-in user and active sources so large tables do not time out.
      const [countResult, latestResult, sourcesResult] = await Promise.all([
        supabase.rpc('get_active_data_entries_count', { p_user_id: user.id, p_source_id: null }),
        supabase.rpc('get_latest_active_data_entries', { p_user_id: user.id, p_limit: 1, p_offset: 0, p_source_id: null }),
        supabase.from('sources').select('id').eq('user_id', user.id).eq('active', true),
      ]);

      if (countResult.error) console.error('Error fetching active data count:', countResult.error);
      if (latestResult.error) console.error('Error fetching latest data entry:', latestResult.error);
      if (sourcesResult.error) console.error('Error fetching active sources:', sourcesResult.error);

      const totalCount = Number(countResult.data || 0);
      const lastReceived = latestResult.data?.[0]?.timestamp || latestResult.data?.[0]?.created_at || 'No data';
      const uniqueSources = sourcesResult.data?.length || 0;

      return {
        totalCount,
        uniqueSources,
        lastReceived,
        backedUpDropbox: 0
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
