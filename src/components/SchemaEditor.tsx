import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Settings, Plus, Minus, Save, FileJson, Check, X, AlertTriangle } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { ConfigService } from "@/services/ConfigService";
import { DataSchema } from "@/types/api.types";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
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

interface SchemaEditorProps {
  apiKey?: string;
}

const SchemaEditor: React.FC<SchemaEditorProps> = ({ apiKey }) => {
  // State management
  const [requiredFields, setRequiredFields] = useState<string[]>([]);
  const [fieldTypes, setFieldTypes] = useState<{[key: string]: string}>({});
  const [newField, setNewField] = useState('');
  const [newType, setNewType] = useState('string');
  const [isRequired, setIsRequired] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [validationResult, setValidationResult] = useState<{valid: boolean; errors: string[]} | null>(null);
  const [activeTab, setActiveTab] = useState('editor');
  const { toast } = useToast();

  // For testing schema validation - empty by default
  const form = useForm<TestDataForm>({
    resolver: zodResolver(testDataSchema),
    defaultValues: {
      testData: ""
    },
  });

  // Load schema on component mount and when apiKey changes
  useEffect(() => {
    const loadSchema = async () => {
      if (!apiKey) return;
      
      setIsLoading(true);
      try {
        console.log("Loading schema for API key:", apiKey);
        const schema = await ConfigService.getSchema(apiKey);
        console.log("Loaded schema:", schema);
        
        if (schema) {
          setRequiredFields(schema.requiredFields || []);
          setFieldTypes(schema.fieldTypes || {});
        }
      } catch (error) {
        console.error("Error loading schema:", error);
        toast({
          title: "Error",
          description: "Failed to load schema. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    loadSchema();
  }, [apiKey, toast]);

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

    // Validate existing data against the updated schema
    validateAgainstUpdatedSchema();
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

    // Validate existing data against the updated schema
    validateAgainstUpdatedSchema();
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

    // Validate existing data against the updated schema
    validateAgainstUpdatedSchema();
  };

  // Validate existing test data against updated schema
  const validateAgainstUpdatedSchema = () => {
    try {
      const testDataValue = form.getValues().testData;
      if (testDataValue) {
        const parsedData = JSON.parse(testDataValue);
        const schema: DataSchema = {
          requiredFields,
          fieldTypes
        };
        
        // Run validation and update state
        validateTestDataInternal(parsedData, schema);
      }
    } catch (error) {
      // Ignore validation errors during schema updates
      console.log("Skipping validation during schema update:", error);
    }
  };

  // Save the schema
  const saveSchema = async () => {
    if (!apiKey) {
      toast({
        title: "Error",
        description: "No API key available to save schema",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);
    try {
      const schema: DataSchema = {
        requiredFields,
        fieldTypes
      };
      
      console.log("Saving schema for API key:", apiKey, "Schema:", schema);
      
      // Check if user is authenticated first
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session?.user) {
        console.error('User not authenticated:', sessionError);
        toast({
          title: "Authentication Error",
          description: "You must be logged in to save schemas. Please log in and try again.",
          variant: "destructive",
        });
        return;
      }
      
      // Save using ConfigService
      const success = await ConfigService.setSchema(schema, apiKey);
      
      if (success) {
        toast({
          title: "Success",
          description: "Schema saved successfully and will be used to validate data for this API key",
        });
        
        // Switch to validator tab after successful save
        setActiveTab('validator');
        
        // Validate existing test data against the saved schema
        validateAgainstUpdatedSchema();
        
        // Trigger a refresh of the parent component to update API instructions
        console.log('🚀 Dispatching schemaUpdated event for API key:', apiKey);
        window.dispatchEvent(new CustomEvent('schemaUpdated', { 
          detail: { apiKey, schema } 
        }));
        
        // Also dispatch a more specific event
        window.dispatchEvent(new CustomEvent('apiSchemaChanged', { 
          detail: { apiKey, schema } 
        }));
      } else {
        toast({
          title: "Error",
          description: "Failed to save schema. Please check your connection and try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error saving schema:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred while saving. Please check your connection and try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Internal validation function that updates state
  const validateTestDataInternal = (parsedData: any, schema: DataSchema) => {
    try {
      // Run validation directly without API call for immediate feedback
      const errors: string[] = [];
      
      // Check required fields
      for (const field of schema.requiredFields) {
        if (parsedData[field] === undefined || parsedData[field] === null || parsedData[field] === '') {
          errors.push(`Missing required field: ${field}`);
        }
      }
      
      // Check field types
      for (const [field, expectedType] of Object.entries(schema.fieldTypes)) {
        if (parsedData[field] !== undefined && parsedData[field] !== null && parsedData[field] !== '') {
          const actualType = getDataType(parsedData[field]);
          if (actualType !== expectedType) {
            errors.push(`Field ${field} should be type ${expectedType}, got ${actualType}`);
          }
        }
      }
      
      // Update validation result state
      setValidationResult({
        valid: errors.length === 0,
        errors
      });
      
      if (errors.length === 0) {
        toast({
          title: "Validation Successful",
          description: "The test data is valid according to the schema",
        });
      } else {
        toast({
          title: "Validation Failed",
          description: `Found ${errors.length} errors in the test data`,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error in internal validation:", error);
      setValidationResult({
        valid: false,
        errors: ["Error validating data"]
      });
    }
  };

  // Helper function to determine data type
  function getDataType(value: any): string {
    if (typeof value === 'number') {
      return 'number';
    } else if (typeof value === 'boolean') {
      return 'boolean';
    } else if (typeof value === 'string') {
      return 'string';
    } else if (Array.isArray(value)) {
      return 'array';
    } else if (typeof value === 'object' && value !== null) {
      return 'object';
    } else {
      return 'unknown';
    }
  }

  // Validate test data against the schema
  const validateTestData = async (data: TestDataForm) => {
    try {
      const parsedData = JSON.parse(data.testData);
      const schema: DataSchema = {
        requiredFields,
        fieldTypes
      };
      
      // Use the internal validation function that updates state
      validateTestDataInternal(parsedData, schema);
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
    <div className="space-y-6">
      {apiKey && (
        <Alert className="bg-muted/50">
          <Settings className="h-4 w-4" />
          <AlertTitle>API Key Specific Schema</AlertTitle>
          <AlertDescription>
            You are configuring validation rules for API key: {apiKey.substring(0, 8)}...
            This schema will persist in the database and be available after page refresh.
          </AlertDescription>
        </Alert>
      )}
      
      {isLoading ? (
        <div className="flex justify-center p-6">
          <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full"></div>
        </div>
      ) : (
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4">
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
            
            <Button onClick={saveSchema} disabled={isSaving} className="w-full">
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
                            placeholder="Enter JSON data to validate against your schema" 
                            className="font-mono h-40" 
                            {...field} 
                          />
                        </FormControl>
                        <FormDescription>
                          Enter valid JSON that matches your defined schema to test validation
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
      )}
      
      <div className="text-xs text-muted-foreground mt-4">
        {Object.keys(fieldTypes).length} fields defined, {requiredFields.length} required
      </div>
    </div>
  );
};

export default SchemaEditor;
