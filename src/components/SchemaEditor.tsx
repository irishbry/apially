
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Settings, Plus, Minus, Save, FileJson, Check, X, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ApiService, DataSchema } from "@/services/ApiService";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";

const testDataSchema = z.object({
  testData: z.string()
    .min(5, "Test data must be at least 5 characters long")
    .refine(value => {
      try {
        JSON.parse(value);
        return true;
      } catch (e) {
        return false;
      }
    }, "Must be valid JSON")
});

type TestDataForm = z.infer<typeof testDataSchema>;

const SchemaEditor: React.FC = () => {
  // State management
  const [requiredFields, setRequiredFields] = useState<string[]>([]);
  const [fieldTypes, setFieldTypes] = useState<{[key: string]: string}>({});
  const [newField, setNewField] = useState('');
  const [newType, setNewType] = useState('string');
  const [isRequired, setIsRequired] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [validationResult, setValidationResult] = useState<{valid: boolean; errors: string[]} | null>(null);
  const [activeTab, setActiveTab] = useState('editor');
  const { toast } = useToast();

  // For testing schema validation
  const form = useForm<TestDataForm>({
    resolver: zodResolver(testDataSchema),
    defaultValues: {
      testData: JSON.stringify({
        sensorId: "sensor-1",
        temperature: 25.4,
        humidity: 68
      }, null, 2)
    },
  });

  // Load schema on component mount
  useEffect(() => {
    const loadSchema = async () => {
      const schema = await ApiService.getSchema();
      setRequiredFields(schema.requiredFields || []);
      setFieldTypes(schema.fieldTypes || {});
    };
    
    loadSchema();
  }, []);

  // Add a new field to the schema
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
    
    toast({
      title: "Field Added",
      description: `Added field "${newField}" of type ${newType}`,
    });
  };

  // Remove a field from the schema
  const removeField = (field: string) => {
    // Remove from field types
    const updatedFieldTypes = { ...fieldTypes };
    delete updatedFieldTypes[field];
    setFieldTypes(updatedFieldTypes);

    // Remove from required fields if present
    setRequiredFields(prev => prev.filter(f => f !== field));
    
    toast({
      title: "Field Removed",
      description: `Removed field "${field}" from schema`,
    });
  };

  // Toggle whether a field is required
  const toggleRequired = (field: string) => {
    if (requiredFields.includes(field)) {
      setRequiredFields(prev => prev.filter(f => f !== field));
      toast({
        title: "Field Updated",
        description: `Field "${field}" is no longer required`,
      });
    } else {
      setRequiredFields(prev => [...prev, field]);
      toast({
        title: "Field Updated",
        description: `Field "${field}" is now required`,
      });
    }
  };

  // Save the schema
  const saveSchema = async () => {
    setIsSaving(true);
    try {
      const schema: DataSchema = {
        requiredFields,
        fieldTypes
      };
      
      const success = await ApiService.setSchema(schema);
      if (success) {
        toast({
          title: "Success",
          description: "Schema saved successfully",
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to save schema",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error saving schema:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred while saving",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Validate test data against the schema
  const validateTestData = async (data: TestDataForm) => {
    try {
      const parsedData = JSON.parse(data.testData);
      const schema: DataSchema = {
        requiredFields,
        fieldTypes
      };
      
      const result = ApiService.validateDataAgainstSchema(parsedData, schema);
      setValidationResult(result);
      
      if (result.valid) {
        toast({
          title: "Validation Successful",
          description: "The test data is valid according to the schema",
        });
      } else {
        toast({
          title: "Validation Failed",
          description: `Found ${result.errors.length} errors in the test data`,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error validating test data:", error);
      setValidationResult({
        valid: false,
        errors: ["Invalid JSON format"]
      });
      
      toast({
        title: "Validation Error",
        description: "Failed to parse test data as JSON",
        variant: "destructive",
      });
    }
  };

  return (
    <Card className="w-full shadow-sm hover:shadow-md transition-all duration-300">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-xl font-medium">
          <FileJson className="h-5 w-5 text-primary" />
          Data Schema Editor
        </CardTitle>
        <CardDescription>
          Define and validate the expected data structure for incoming API requests
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="editor">Schema Editor</TabsTrigger>
            <TabsTrigger value="validator">Validator</TabsTrigger>
          </TabsList>
          
          <TabsContent value="editor" className="space-y-6">
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
                      <SelectItem value="array">Array</SelectItem>
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
          </TabsContent>
          
          <TabsContent value="validator" className="space-y-6">
            <div className="space-y-4">
              <h3 className="text-sm font-medium">Test Schema Validation</h3>
              <p className="text-sm text-muted-foreground">
                Enter JSON data below to test it against your schema definition.
              </p>
              
              <Form {...form}>
                <form onSubmit={form.handleSubmit(validateTestData)} className="space-y-6">
                  <FormField
                    control={form.control}
                    name="testData"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Test Data (JSON)</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Enter JSON data to validate" 
                            className="font-mono h-40" 
                            {...field} 
                          />
                        </FormControl>
                        <FormDescription>
                          Enter valid JSON that matches your schema to test validation
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <Button type="submit">
                    Validate
                  </Button>
                </form>
              </Form>
              
              {validationResult && (
                <Alert variant={validationResult.valid ? "default" : "destructive"} className="mt-4">
                  <div className="flex items-start gap-2">
                    {validationResult.valid ? 
                      <Check className="h-5 w-5 text-green-500" /> : 
                      <AlertTriangle className="h-5 w-5" />
                    }
                    <div>
                      <AlertTitle>
                        {validationResult.valid ? "Validation Passed" : "Validation Failed"}
                      </AlertTitle>
                      <AlertDescription>
                        {validationResult.valid ? (
                          "The data is valid according to the schema."
                        ) : (
                          <div className="space-y-2 mt-2">
                            <p>The following errors were found:</p>
                            <ul className="list-disc list-inside text-sm">
                              {validationResult.errors.map((error, index) => (
                                <li key={index}>{error}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </AlertDescription>
                    </div>
                  </div>
                </Alert>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
      <CardFooter className="flex justify-between">
        <div className="text-xs text-muted-foreground">
          {Object.keys(fieldTypes).length} fields defined, {requiredFields.length} required
        </div>
        <Button onClick={saveSchema} disabled={isSaving} className="hover-lift">
          {isSaving ? (
            <>
              <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
              Saving...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Save Schema
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default SchemaEditor;
