
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Plus, Trash2, Eye, EyeOff, Copy, CheckCircle, Database } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Source, DataSchema } from "@/types/api.types";
import ApiInstructions from './ApiInstructions';
import ApiDocumentation from './ApiDocumentation';
import { ConfigService } from '@/services/ConfigService';
import { useForm } from 'react-hook-form';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface CreateSourceForm {
  name: string;
  description?: string;
}

interface SourcesManagerProps {
  onApiKeySelect?: (apiKey: string) => void;
}

interface SourceWithRecords extends Source {
  recordCount: number;
}

const SourcesManager: React.FC<SourcesManagerProps> = ({ onApiKeySelect }) => {
  const [sources, setSources] = useState<SourceWithRecords[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedApiKey, setSelectedApiKey] = useState<string>('');
  const [showApiKey, setShowApiKey] = useState<{[key: string]: boolean}>({});
  const [isCreatingSource, setIsCreatingSource] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [currentSchema, setCurrentSchema] = useState<DataSchema | undefined>(undefined);
  const [schemaRefreshKey, setSchemaRefreshKey] = useState(0);
  const { toast } = useToast();

  const form = useForm<CreateSourceForm>({
    defaultValues: {
      name: '',
      description: ''
    }
  });

  // Load sources on component mount
  useEffect(() => {
    loadSources();
  }, []);

  // Load schema when selectedApiKey changes or when schema is updated
  useEffect(() => {
    const loadSchema = async () => {
      if (selectedApiKey) {
        try {
          console.log('Loading schema for selected API key:', selectedApiKey);
          const schema = await ConfigService.getSchema(selectedApiKey);
          console.log('Loaded schema for API instructions:', schema);
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
  }, [selectedApiKey, schemaRefreshKey]);

  // Listen for schema updates
  useEffect(() => {
    const handleSchemaUpdate = () => {
      console.log('Schema updated event received, refreshing...');
      setSchemaRefreshKey(prev => prev + 1);
    };

    window.addEventListener('schemaUpdated', handleSchemaUpdate);
    return () => window.removeEventListener('schemaUpdated', handleSchemaUpdate);
  }, []);

  // Notify parent component when API key changes
  useEffect(() => {
    if (selectedApiKey && onApiKeySelect) {
      onApiKeySelect(selectedApiKey);
    }
  }, [selectedApiKey, onApiKeySelect]);

  const loadSources = async () => {
    setIsLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.user?.id) {
        console.log('No user session found');
        setSources([]);
        return;
      }

      const { data: sourcesData, error: sourcesError } = await supabase
        .from('sources')
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false });

      if (sourcesError) {
        console.error('Error loading sources:', sourcesError);
        toast({
          title: "Error",
          description: "Failed to load sources",
          variant: "destructive",
        });
        return;
      }

      // Fetch data entry counts for each source
      const sourcesWithRecords: SourceWithRecords[] = [];
      
      for (const source of sourcesData || []) {
        const { count, error: countError } = await supabase
          .from('data_entries')
          .select('*', { count: 'exact', head: true })
          .eq('source_id', source.id);

        if (countError) {
          console.error('Error counting records for source:', source.id, countError);
        }

        sourcesWithRecords.push({
          ...source,
          recordCount: count || 0
        });
      }

      setSources(sourcesWithRecords);
      
      // Set the first source as selected if no source is currently selected
      if (sourcesWithRecords && sourcesWithRecords.length > 0 && !selectedApiKey) {
        const firstApiKey = sourcesWithRecords[0].api_key;
        setSelectedApiKey(firstApiKey);
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

  const createSource = async (formData: CreateSourceForm) => {
    if (!formData.name.trim()) {
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
          name: formData.name.trim(),
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
        description: `Source "${formData.name}" created successfully`,
      });

      form.reset();
      setIsCreateModalOpen(false);
      
      // Reload sources to get the updated list
      await loadSources();
      
      // Immediately set the new API key as selected to trigger updates in documentation
      console.log('Setting new API key as selected:', apiKey);
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
    console.log('API key selected in SourcesManager:', apiKey);
    setSelectedApiKey(apiKey);
    // Notify parent component about the selected API key
    if (onApiKeySelect) {
      onApiKeySelect(apiKey);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with Create Button */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Data Sources</h2>
          <p className="text-muted-foreground">
            Manage your data sources and their API keys
          </p>
        </div>
        <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Source
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Create New Data Source</DialogTitle>
              <DialogDescription>
                Enter details for your new data source. You'll get a unique API key for this source.
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(createSource)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Source Name</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g., Weather Station 1"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Give your data source a descriptive name
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description (Optional)</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Brief description of this source"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Optional description for this data source
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <DialogFooter>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setIsCreateModalOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isCreatingSource}>
                    {isCreatingSource ? 'Creating...' : 'Create Source'}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Existing Sources */}
      <Card>
        <CardHeader>
          <CardTitle>Your Sources</CardTitle>
          <CardDescription>
            Select a source to manage its configuration
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
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Database className="h-3 w-3" />
                            <span>{source.recordCount} records</span>
                          </div>
                          <span>•</span>
                          <span>{source.active ? 'Active' : 'Inactive'}</span>
                        </div>
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
              <Plus className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No sources created yet.</p>
              <p className="text-sm">Create your first source to get started.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* API Documentation Tabs */}
      <Tabs defaultValue="quick-guide" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="quick-guide">Quick Integration Guide</TabsTrigger>
          <TabsTrigger value="complete-docs">Complete Documentation</TabsTrigger>
        </TabsList>
        
        <TabsContent value="quick-guide">
          <ApiInstructions currentApiKey={selectedApiKey} schema={currentSchema} />
        </TabsContent>
        
        <TabsContent value="complete-docs">
          <ApiDocumentation selectedApiKey={selectedApiKey} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SourcesManager;
