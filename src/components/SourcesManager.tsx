import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Trash2, Eye, EyeOff, Settings, Copy, CheckCircle } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Source, DataSchema } from "@/types/api.types";
import ApiInstructions from './ApiInstructions';
import SchemaEditor from './SchemaEditor';
import { ConfigService } from '@/services/ConfigService';

const SourcesManager: React.FC = () => {
  const [sources, setSources] = useState<Source[]>([]);
  const [newSourceName, setNewSourceName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedApiKey, setSelectedApiKey] = useState<string>('');
  const [showApiKey, setShowApiKey] = useState<{[key: string]: boolean}>({});
  const [isCreatingSource, setIsCreatingSource] = useState(false);
  const [currentSchema, setCurrentSchema] = useState<DataSchema | undefined>(undefined);
  const { toast } = useToast();

  // Load sources on component mount
  useEffect(() => {
    loadSources();
  }, []);

  // Load schema when selectedApiKey changes
  useEffect(() => {
    const loadSchema = async () => {
      if (selectedApiKey) {
        try {
          const schema = await ConfigService.getSchema(selectedApiKey);
          setCurrentSchema(schema);
        } catch (error) {
          console.error('Error loading schema:', error);
          setCurrentSchema(undefined);
        }
      } else {
        setCurrentSchema(undefined);
      }
    };
    
    loadSchema();
  }, [selectedApiKey]);

  const loadSources = async () => {
    setIsLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.user?.id) {
        console.log('No user session found');
        setSources([]);
        return;
      }

      const { data, error } = await supabase
        .from('sources')
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading sources:', error);
        toast({
          title: "Error",
          description: "Failed to load sources",
          variant: "destructive",
        });
        return;
      }

      setSources(data || []);
      
      // Set the first source as selected if no source is currently selected
      if (data && data.length > 0 && !selectedApiKey) {
        setSelectedApiKey(data[0].api_key);
      }
    } catch (error) {
      console.error('Error in loadSources:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const createSource = async () => {
    if (!newSourceName.trim()) {
      toast({
        title: "Error",
        description: "Please enter a source name",
        variant: "destructive",
      });
      return;
    }

    setIsCreatingSource(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.user?.id) {
        toast({
          title: "Error",
          description: "You must be logged in to create sources",
          variant: "destructive",
        });
        return;
      }

      // Generate a unique API key using the database function
      const { data: apiKeyData, error: apiKeyError } = await supabase
        .rpc('generate_unique_api_key');

      if (apiKeyError) {
        console.error('Error generating API key:', apiKeyError);
        toast({
          title: "Error",
          description: "Failed to generate API key",
          variant: "destructive",
        });
        return;
      }

      const apiKey = apiKeyData as string;

      const { data, error } = await supabase
        .from('sources')
        .insert({
          name: newSourceName.trim(),
          api_key: apiKey,
          user_id: session.user.id,
          active: true,
          data_count: 0
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating source:', error);
        toast({
          title: "Error", 
          description: "Failed to create source",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Success",
        description: `Source "${newSourceName}" created successfully`,
      });

      setNewSourceName('');
      loadSources(); // Reload sources
      
      // Set the new source as selected
      setSelectedApiKey(apiKey);

    } catch (error) {
      console.error('Error in createSource:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsCreatingSource(false);
    }
  };

  const deleteSource = async (sourceId: string, sourceName: string) => {
    try {
      const { error } = await supabase
        .from('sources')
        .delete()
        .eq('id', sourceId);

      if (error) {
        console.error('Error deleting source:', error);
        toast({
          title: "Error",
          description: "Failed to delete source",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Success",
        description: `Source "${sourceName}" deleted successfully`,
      });

      loadSources(); // Reload sources
      
      // Clear selected API key if the deleted source was selected
      if (selectedApiKey && sources.find(s => s.id === sourceId)?.api_key === selectedApiKey) {
        const remainingSources = sources.filter(s => s.id !== sourceId);
        setSelectedApiKey(remainingSources.length > 0 ? remainingSources[0].api_key : '');
      }

    } catch (error) {
      console.error('Error in deleteSource:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    }
  };

  const toggleApiKeyVisibility = (sourceId: string) => {
    setShowApiKey(prev => ({
      ...prev,
      [sourceId]: !prev[sourceId]
    }));
  };

  const copyApiKey = (apiKey: string) => {
    navigator.clipboard.writeText(apiKey).then(() => {
      toast({
        title: "Copied!",
        description: "API key copied to clipboard",
      });
    });
  };

  const handleApiKeySelect = (apiKey: string) => {
    setSelectedApiKey(apiKey);
  };

  return (
    <div className="space-y-6">
      {/* Create New Source */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Create New Source
          </CardTitle>
          <CardDescription>
            Create a new data source to get a unique API key for sending data
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input
              placeholder="Enter source name (e.g., Weather Station 1)"
              value={newSourceName}
              onChange={(e) => setNewSourceName(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && createSource()}
            />
            <Button onClick={createSource} disabled={isCreatingSource}>
              {isCreatingSource ? 'Creating...' : 'Create'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Existing Sources */}
      <Card>
        <CardHeader>
          <CardTitle>Your Sources</CardTitle>
          <CardDescription>
            Manage your data sources and their API keys
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center p-6">
              <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full"></div>
            </div>
          ) : sources.length > 0 ? (
            <div className="space-y-4">
              {sources.map((source) => (
                <div 
                  key={source.id} 
                  className={`p-4 border rounded-lg transition-all cursor-pointer ${
                    selectedApiKey === source.api_key 
                      ? 'border-primary bg-primary/5' 
                      : 'border-border hover:border-primary/50'
                  }`}
                  onClick={() => handleApiKeySelect(source.api_key || '')}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {selectedApiKey === source.api_key && (
                        <CheckCircle className="h-5 w-5 text-primary" />
                      )}
                      <div>
                        <h3 className="font-medium">{source.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {source.data_count || 0} records • {source.active ? 'Active' : 'Inactive'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1 text-xs bg-secondary px-2 py-1 rounded">
                        <span>API Key:</span>
                        <code className="bg-background px-1">
                          {showApiKey[source.id] 
                            ? source.api_key 
                            : `${source.api_key?.substring(0, 8)}...`
                          }
                        </code>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleApiKeyVisibility(source.id);
                          }}
                        >
                          {showApiKey[source.id] ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0"
                          onClick={(e) => {
                            e.stopPropagation();
                            copyApiKey(source.api_key || '');
                          }}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteSource(source.id, source.name);
                        }}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Settings className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No sources created yet.</p>
              <p className="text-sm">Create your first source to get started.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Schema Editor for selected API key */}
      {selectedApiKey && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Schema Validation
            </CardTitle>
            <CardDescription>
              Configure data validation rules for the selected source
            </CardDescription>
          </CardHeader>
          <CardContent>
            <SchemaEditor apiKey={selectedApiKey} />
          </CardContent>
        </Card>
      )}

      {/* API Instructions with schema */}
      <ApiInstructions currentApiKey={selectedApiKey} schema={currentSchema} />
    </div>
  );
};

export default SourcesManager;
