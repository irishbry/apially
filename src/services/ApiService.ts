// This method needs to be updated to properly send the API key as an authorization header
async function receiveData(data: DataEntry, apiKey?: string): Promise<ApiResponse> {
  try {
    // If we're in a test environment with the PHP API backend
    if (usingPhpBackend()) {
      return receivePhpApiData(data, apiKey);
    }
    
    // Otherwise use Supabase Edge Function
    console.log('Sending data to Supabase Edge Function...');
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    
    // Add API key as Authorization header if provided
    if (apiKey) {
      headers['Authorization'] = apiKey;
      headers['x-api-key'] = apiKey; // Adding both for compatibility
    }
    
    const response = await fetch(`${window.location.origin}/api/v1/data-receiver`, {
      method: 'POST',
      headers,
      body: JSON.stringify(data),
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ 
        error: `HTTP error ${response.status}` 
      }));
      
      console.error('API error:', errorData);
      return {
        success: false,
        message: errorData.error || errorData.message || 'Failed to submit data',
      };
    }
    
    const result = await response.json();
    return {
      success: true,
      message: result.message || 'Data received successfully',
      data: result.receipt || result.data,
    };
  } catch (error) {
    console.error('Error in receiveData:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}
