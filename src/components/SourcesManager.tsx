
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Copy, Edit, KeyRound, Plus, Power, RefreshCw, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export interface Source {
  id: string;
  name: string;
  url?: string;
  api_key: string;
  created_at: string;
  data_count: number;
  active: boolean;
  last_active?: string;
}

const SourcesManager: React.FC = () => {
  const [sources, setSources] = useState<Source[]>([]);
  const [newSourceName, setNewSourceName] = useState('');
  const [newSourceUrl, setNewSourceUrl] = useState('');
  const [editingSource, setEditingSource] = useState<Source | null>(null);
  const [editName, setEditName] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const { user, isAuthenticated } = useAuth();

  // Fetch sources on component mount and when auth state changes
  useEffect(() => {
    if (isAuthenticated && user) {
      fetchSources();
      
      // Subscribe to realtime changes
      const channel = supabase
        .channel('public:sources')
        .on('postgres_changes', 
          { event: '*', schema: 'public', table: 'sources' }, 
          (payload) => {
            fetchSources();
          }
        )
        .subscribe();
      
      return () => {
        supabase.removeChannel(channel);
      };
    } else {
      setSources([]);
    }
  }, [isAuthenticated, user]);

  const fetchSources = async () => {
    try {
      setError(null);
      const { data, error } = await supabase
        .from('sources')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching sources:', error);
        setError('Error loading sources. Please try again later.');
        return;
      }
      
      setSources(data || []);
    } catch (err) {
      console.error('Error in fetchSources:', err);
      setError('An unexpected error occurred while loading sources.');
    }
  };

  const addSource = async () => {
    if (!newSourceName.trim()) {
      toast({
        title: "Error",
        description: "Please enter a valid source name.",
        variant: "destructive",
        duration: 3000,
      });
      return;
    }

    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to add a source.",
        variant: "destructive",
        duration: 3000,
      });
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Call the generate_unique_api_key function
      const { data: apiKeyData, error: apiKeyError } = await supabase.rpc('generate_unique_api_key');
      
      if (apiKeyError) {
        throw apiKeyError;
      }
      
      const api_key = apiKeyData;
      
      // Insert the new source
      const { data, error } = await supabase
        .from('sources')
        .insert({
          name: newSourceName,
          url: newSourceUrl || null,
          api_key: api_key,
          user_id: user.id
        })
        .select()
        .single();
      
      if (error) {
        throw error;
      }
      
      setNewSourceName('');
      setNewSourceUrl('');
      setIsDialogOpen(false);
      
      toast({
        title: "Source Added",
        description: `Source "${newSourceName}" has been added successfully.`,
        duration: 3000,
      });
      
      // Refresh the sources list
      fetchSources();
    } catch (err: any) {
      console.error('Error adding source:', err);
      toast({
        title: "Error",
        description: err.message || "Failed to add source. Please try again.",
        variant: "destructive",
        duration: 3000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const startEditSource = (source: Source) => {
    setEditingSource(source);
    setEditName(source.name);
    setIsEditDialogOpen(true);
  };

  const updateSource = async () => {
    if (!editingSource || !editName.trim()) {
      toast({
        title: "Error",
        description: "Please enter a valid source name.",
        variant: "destructive",
      });
      return;
    }
    
    try {
      const { error } = await supabase
        .from('sources')
        .update({ name: editName })
        .eq('id', editingSource.id);
      
      if (error) {
        throw error;
      }
      
      setEditingSource(null);
      setIsEditDialogOpen(false);
      
      toast({
        title: "Source Updated",
        description: `Source name has been updated successfully.`,
      });
      
      // Refresh the sources list
      fetchSources();
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Failed to update source. Please try again.",
        variant: "destructive",
      });
    }
  };

  const toggleSourceActive = async (id: string, name: string, currentState: boolean) => {
    try {
      const { error } = await supabase
        .from('sources')
        .update({ active: !currentState })
        .eq('id', id);
      
      if (error) {
        throw error;
      }
      
      toast({
        title: currentState ? "Source Deactivated" : "Source Activated",
        description: `Source "${name}" has been ${currentState ? "deactivated" : "activated"} successfully.`,
      });
      
      // Refresh the sources list
      fetchSources();
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Failed to toggle source state. Please try again.",
        variant: "destructive",
      });
    }
  };

  const regenerateApiKey = async (id: string, name: string) => {
    try {
      // Call the generate_unique_api_key function
      const { data: apiKeyData, error: apiKeyError } = await supabase.rpc('generate_unique_api_key');
      
      if (apiKeyError) {
        throw apiKeyError;
      }
      
      const api_key = apiKeyData;
      
      // Update the source with the new API key
      const { error } = await supabase
        .from('sources')
        .update({ api_key })
        .eq('id', id);
      
      if (error) {
        throw error;
      }
      
      toast({
        title: "API Key Regenerated",
        description: `A new API key has been generated for source "${name}".`,
      });
      
      // Refresh the sources list
      fetchSources();
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Failed to regenerate API key. Please try again.",
        variant: "destructive",
      });
    }
  };

  const deleteSource = async (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to delete source "${name}"? All associated data will also be deleted.`)) {
      try {
        const { error } = await supabase
          .from('sources')
          .delete()
          .eq('id', id);
        
        if (error) {
          throw error;
        }
        
        toast({
          title: "Source Deleted",
          description: `Source "${name}" has been deleted successfully.`,
        });
        
        // Refresh the sources list
        fetchSources();
      } catch (err: any) {
        toast({
          title: "Error",
          description: err.message || "Failed to delete source. Please try again.",
          variant: "destructive",
        });
      }
    }
  };

  const copyApiKey = (apiKey: string) => {
    navigator.clipboard.writeText(apiKey).then(() => {
      toast({
        title: "Copied!",
        description: "API key copied to clipboard.",
      });
    });
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleString();
    } catch (e) {
      return dateString;
    }
  };

  return (
    <Card className="w-full shadow-sm hover:shadow-md transition-all duration-300">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="text-xl font-medium">Data Sources</span>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="hover-lift">
                <Plus className="h-4 w-4 mr-1" />
                Add Source
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Data Source</DialogTitle>
                <DialogDescription>
                  Create a new data source and generate an API key for it.
                </DialogDescription>
              </DialogHeader>
              <div className="py-4 space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Source Name</label>
                  <Input
                    value={newSourceName}
                    onChange={(e) => setNewSourceName(e.target.value)}
                    placeholder="Enter source name (e.g., Factory Sensors)"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Source URL (optional)</label>
                  <Input
                    value={newSourceUrl}
                    onChange={(e) => setNewSourceUrl(e.target.value)}
                    placeholder="Enter source URL (optional)"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)} disabled={isLoading}>Cancel</Button>
                <Button onClick={addSource} disabled={isLoading}>
                  {isLoading ? 'Adding...' : 'Add Source'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardTitle>
        <CardDescription>
          Manage data sources and their API keys
        </CardDescription>
      </CardHeader>
      <CardContent>
        {error && isAuthenticated && (
          <Alert variant="destructive" className="mb-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              {error}
            </AlertDescription>
          </Alert>
        )}
        
        {!isAuthenticated && (
          <Alert className="mb-4">
            <AlertDescription>
              You need to be logged in to manage data sources.
            </AlertDescription>
          </Alert>
        )}
        
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Source Name</TableHead>
                <TableHead>API Key</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Data Points</TableHead>
                <TableHead>Last Active</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sources.length > 0 ? (
                sources.map((source) => (
                  <TableRow key={source.id}>
                    <TableCell className="font-medium">{source.name}</TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <code className="bg-muted px-1 py-0.5 rounded text-xs">
                          {source.api_key.substring(0, 8)}...
                        </code>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => copyApiKey(source.api_key)}
                          title="Copy API key"
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant={source.active ? "default" : "outline"} 
                        className={source.active ? "bg-green-500" : "text-muted-foreground"}
                      >
                        {source.active ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {source.data_count > 0 ? (
                        <Badge variant="outline">{source.data_count}</Badge>
                      ) : (
                        <Badge variant="outline" className="text-muted-foreground">0</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {source.last_active ? formatDate(source.last_active) : 'Never'}
                    </TableCell>
                    <TableCell>{formatDate(source.created_at)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => toggleSourceActive(source.id, source.name, source.active)}
                          title={source.active ? "Deactivate source" : "Activate source"}
                        >
                          <Power className={`h-4 w-4 ${source.active ? 'text-green-500' : 'text-gray-400'}`} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => startEditSource(source)}
                          title="Edit source"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => regenerateApiKey(source.id, source.name)}
                          title="Regenerate API key"
                        >
                          <KeyRound className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteSource(source.id, source.name)}
                          title="Delete source"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center">
                    {!isAuthenticated 
                      ? 'Authentication required to view sources' 
                      : 'No sources available'}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Source</DialogTitle>
            <DialogDescription>
              Update the source name or manage its API key.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Input
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              placeholder="Enter new source name"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>Cancel</Button>
            <Button onClick={updateSource}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default SourcesManager;
