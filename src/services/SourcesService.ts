
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
      const { data: sources, error: sourcesError } = await supabase
        .from('sources')
        .select('*');
      
      if (sourcesError) {
        console.error('Error getting sources:', sourcesError);
        return {
          totalSources: 0,
          activeSources: 0,
          totalDataPoints: 0
        };
      }
      
      const totalSources = sources.length;
      const activeSources = sources.filter(s => s.active).length;
      const totalDataPoints = sources.reduce((sum, source) => sum + (source.data_count || 0), 0);
      
      return {
        totalSources,
        activeSources,
        totalDataPoints
      };
    } catch (error) {
      console.error('Error in getSourcesStats:', error);
      return {
        totalSources: 0,
        activeSources: 0,
        totalDataPoints: 0
      };
    }
  },
  
  getApiUsageBySource: async (): Promise<ApiUsageBySource[]> => {
    try {
      const { data: entries, error: entriesError } = await supabase
        .from('data_entries')
        .select('source_id')
        .not('source_id', 'is', null);
        
      if (entriesError) {
        console.error('Error fetching API usage by source:', entriesError);
        return [];
      }
      
      const { data: sources, error: sourcesError } = await supabase
        .from('sources')
        .select('id, name');
        
      if (sourcesError) {
        console.error('Error fetching sources for API usage:', sourcesError);
        return [];
      }
      
      const sourceMap: Record<string, string> = {};
      sources.forEach(source => {
        sourceMap[source.id] = source.name;
      });
      
      const countBySource: Record<string, number> = {};
      entries.forEach(entry => {
        if (entry.source_id) {
          countBySource[entry.source_id] = (countBySource[entry.source_id] || 0) + 1;
        }
      });
      
      const totalCount = entries.length;
      
      const result: ApiUsageBySource[] = Object.keys(countBySource).map(sourceId => ({
        source: sourceMap[sourceId] || 'Unknown',
        count: countBySource[sourceId],
        percentage: Math.round((countBySource[sourceId] / totalCount) * 100)
      }));
      
      result.sort((a, b) => b.count - a.count);
      
      return result;
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
