
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Settings, Plus, Minus, Save, FileJson } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { ApiService, DataSchema } from "@/services/ApiService";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const SchemaEditor: React.FC = () => {
  const [requiredFields, setRequiredFields] = useState<string[]>([]);
  const [fieldTypes, setFieldTypes] = useState<{[key: string]: string}>({});
  const [newField, setNewField] = useState('');
  const [newType, setNewType] = useState('string');
  const [isRequired, setIsRequired] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const schema = ApiService.getSchema();
    setRequiredFields(schema.requiredFields);
    setFieldTypes(schema.fieldTypes);
  }, []);

  const addField = () => {
    if (!newField.trim()) {
      toast({
        title: "Error",
        description: "Please enter a field name.",
        variant: "destructive",
      });
      return;
    }

    if (fieldTypes[newField]) {
      toast({
        title: "Error",
        description: "This field already exists.",
        variant: "destructive",
      });
      return;
    }

    // Add to field types
    setFieldTypes(prev => ({
      ...prev,
      [newField]: newType
    }));

    // Add to required fields if checked
    if (isRequired) {
      setRequiredFields(prev => [...prev, newField]);
    }

    // Reset form
    setNewField('');
    setNewType('string');
    setIsRequired(false);
  };

  const removeField = (field: string) => {
    // Remove from field types
    const updatedFieldTypes = { ...fieldTypes };
    delete updatedFieldTypes[field];
    setFieldTypes(updatedFieldTypes);

    // Remove from required fields if present
    setRequiredFields(prev => prev.filter(f => f !== field));
  };

  const toggleRequired = (field: string) => {
    if (requiredFields.includes(field)) {
      setRequiredFields(prev => prev.filter(f => f !== field));
    } else {
      setRequiredFields(prev => [...prev, field]);
    }
  };

  const saveSchema = () => {
    const schema: DataSchema = {
      requiredFields,
      fieldTypes
    };
    
    ApiService.setSchema(schema);
  };

  return (
    <Card className="w-full shadow-sm hover:shadow-md transition-all duration-300">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-xl font-medium">
          <FileJson className="h-5 w-5 text-primary" />
          Data Schema Editor
        </CardTitle>
        <CardDescription>
          Define the expected data structure for incoming API requests
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div className="space-y-3">
            <h3 className="text-sm font-medium">Add New Field</h3>
            <div className="flex flex-wrap gap-2 items-end">
              <div className="grow-[2] min-w-[150px]">
                <label className="text-xs text-muted-foreground">Field Name</label>
                <Input
                  type="text"
                  placeholder="e.g. temperature"
                  value={newField}
                  onChange={(e) => setNewField(e.target.value)}
                />
              </div>
              <div className="grow min-w-[120px]">
                <label className="text-xs text-muted-foreground">Data Type</label>
                <Select value={newType} onValueChange={setNewType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="string">String</SelectItem>
                    <SelectItem value="number">Number</SelectItem>
                    <SelectItem value="boolean">Boolean</SelectItem>
                    <SelectItem value="object">Object</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2 h-10">
                <label className="text-xs flex items-center gap-2 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={isRequired}
                    onChange={() => setIsRequired(!isRequired)}
                    className="rounded"
                  />
                  <span>Required</span>
                </label>
                <Button 
                  onClick={addField}
                  size="sm"
                  className="ml-2"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
          
          <div className="space-y-3">
            <h3 className="text-sm font-medium">Current Schema</h3>
            {Object.keys(fieldTypes).length > 0 ? (
              <div className="space-y-2">
                {Object.entries(fieldTypes).map(([field, type]) => (
                  <div key={field} className="flex items-center justify-between bg-secondary/50 p-2 rounded-md">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={requiredFields.includes(field)}
                        onChange={() => toggleRequired(field)}
                        className="rounded"
                      />
                      <span className="text-sm font-medium">{field}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground px-2 py-1 bg-secondary rounded">{type}</span>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => removeField(field)}
                        className="h-8 w-8 p-0"
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No fields defined yet. Add your first field above.</p>
            )}
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <div className="text-xs text-muted-foreground">
          {Object.keys(fieldTypes).length} fields defined, {requiredFields.length} required
        </div>
        <Button onClick={saveSchema} className="hover-lift">
          <Save className="mr-2 h-4 w-4" />
          Save Schema
        </Button>
      </CardFooter>
    </Card>
  );
};

export default SchemaEditor;
