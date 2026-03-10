
import { supabase } from '@/integrations/supabase/client';
import { Source, ApiUsageBySource } from '@/types/api.types';

export const SourcesService = {
  getSources: async (): Promise<Source[]> => {
    try {
      const { data, error } = await supabase
        .from('sources')
        .select('*')
        .order('name');
      
      if (error) {
        console.error('Error fetching sources:', error);
        return [];
      }
      
      return data || [];
    } catch (error) {
      console.error('Error in getSources:', error);
      return [];
    }
  },
  
  getSourcesStats: async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return { totalSources: 0, activeSources: 0, totalDataPoints: 0 };

      const { data: sources, error: sourcesError } = await supabase
        .from('sources')
        .select('*')
        .eq('user_id', user.id);
      
      if (sourcesError) {
        console.error('Error getting sources:', sourcesError);
        return { totalSources: 0, activeSources: 0, totalDataPoints: 0 };
      }
      
      const totalSources = sources.length;
      const activeSources = sources.filter(s => s.active).length;

      // Get actual record counts via RPC
      const { data: counts } = await supabase.rpc('get_source_record_counts', { p_user_id: user.id });
      const totalDataPoints = (counts || []).reduce((sum: number, r: any) => sum + Number(r.record_count), 0);
      
      return { totalSources, activeSources, totalDataPoints };
    } catch (error) {
      console.error('Error in getSourcesStats:', error);
      return { totalSources: 0, activeSources: 0, totalDataPoints: 0 };
    }
  },
  
  getApiUsageBySource: async (): Promise<ApiUsageBySource[]> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase.rpc('get_source_entry_counts', {
        p_user_id: user.id,
      });

      if (error) {
        console.error('Error fetching API usage by source:', error);
        return [];
      }

      const rows = data || [];
      const totalCount = rows.reduce((sum: number, r: any) => sum + Number(r.entry_count), 0);

      return rows.map((row: any) => ({
        source: row.source_name,
        count: Number(row.entry_count),
        percentage: totalCount > 0 ? Math.round((Number(row.entry_count) / totalCount) * 100) : 0,
      }));
    } catch (error) {
      console.error('Error in getApiUsageBySource:', error);
      return [];
    }
  },
  
  subscribeToSources: (callback: (sources: Source[]) => void) => {
    const channel = supabase
      .channel('sources_changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'sources' }, 
        async () => {
          const freshSources = await SourcesService.getSources();
          callback(freshSources);
        }
      )
      .subscribe();
    
    SourcesService.getSources().then(callback);
    
    return () => {
      supabase.removeChannel(channel);
    };
  }
};
