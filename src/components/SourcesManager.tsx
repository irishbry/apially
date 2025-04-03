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
import ApiService, { Source } from "@/services/ApiService";

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
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Check authentication first
    const authStatus = ApiService.isUserAuthenticated();
    setIsAuthenticated(authStatus);

    if (authStatus) {
      try {
        // Get initial sources only if authenticated
        setSources(ApiService.getSources());
        setError(null);
        
        // Subscribe to source changes
        const unsubscribe = ApiService.subscribeToSources(newSources => {
          setSources([...newSources]);
          setError(null);
        });
        
        return () => unsubscribe();
      } catch (err) {
        console.error('Error loading sources:', err);
        setError('Error loading sources. Please ensure you are logged in.');
      }
    }

    // Listen for auth changes
    const handleAuthChange = () => {
      const newAuthStatus = ApiService.isUserAuthenticated();
      setIsAuthenticated(newAuthStatus);
      
      if (newAuthStatus) {
        try {
          setSources(ApiService.getSources());
          setError(null);
        } catch (err) {
          console.error('Error loading sources after auth change:', err);
          setError('Error loading sources. Please try refreshing the page.');
        }
      }
    };
    
    window.addEventListener('auth-change', handleAuthChange);
    return () => {
      window.removeEventListener('auth-change', handleAuthChange);
    };
  }, []);

  const addSource = () => {
    if (!newSourceName.trim()) {
      toast({
        title: "Error",
        description: "Please enter a valid source name.",
        variant: "destructive",
        duration: 3000,
      });
      return;
    }
    
    setIsLoading(true);
    
    try {
      ApiService.addSource(newSourceName, newSourceUrl);
      setNewSourceName('');
      setNewSourceUrl('');
      setIsDialogOpen(false);
      
      toast({
        title: "Source Added",
        description: `Source "${newSourceName}" has been added successfully.`,
        duration: 3000,
      });
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to add source. Please ensure you are logged in.",
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

  const updateSource = () => {
    if (!editingSource || !editName.trim()) {
      toast({
        title: "Error",
        description: "Please enter a valid source name.",
        variant: "destructive",
      });
      return;
    }
    
    try {
      ApiService.updateSourceName(editingSource.id, editName);
      setEditingSource(null);
      setIsEditDialogOpen(false);
      
      toast({
        title: "Source Updated",
        description: `Source name has been updated successfully.`,
      });
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to update source. Please ensure you are logged in.",
        variant: "destructive",
      });
    }
  };

  const toggleSourceActive = (id: string, name: string, currentState: boolean) => {
    try {
      const success = ApiService.toggleSourceActive(id);
      if (success) {
        toast({
          title: currentState ? "Source Deactivated" : "Source Activated",
          description: `Source "${name}" has been ${currentState ? "deactivated" : "activated"} successfully.`,
        });
      }
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to toggle source state. Please ensure you are logged in.",
        variant: "destructive",
      });
    }
  };

  const regenerateApiKey = (id: string, name: string) => {
    try {
      const newKey = ApiService.regenerateApiKey(id);
      if (newKey) {
        toast({
          title: "API Key Regenerated",
          description: `A new API key has been generated for source "${name}".`,
        });
      }
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to regenerate API key. Please ensure you are logged in.",
        variant: "destructive",
      });
    }
  };

  const deleteSource = (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to delete source "${name}"? All associated data will also be deleted.`)) {
      try {
        const success = ApiService.deleteSource(id);
        if (success) {
          toast({
            title: "Source Deleted",
            description: `Source "${name}" has been deleted successfully.`,
          });
        }
      } catch (err) {
        toast({
          title: "Error",
          description: "Failed to delete source. Please ensure you are logged in.",
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
                          {source.apiKey.substring(0, 8)}...
                        </code>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => copyApiKey(source.apiKey)}
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
                      {source.dataCount > 0 ? (
                        <Badge variant="outline">{source.dataCount}</Badge>
                      ) : (
                        <Badge variant="outline" className="text-muted-foreground">0</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {source.lastActive ? formatDate(source.lastActive) : 'Never'}
                    </TableCell>
                    <TableCell>{formatDate(source.createdAt)}</TableCell>
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
