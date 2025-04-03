
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

const AuthCallback = () => {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Get the URL hash for code exchange
        const hash = window.location.hash;
        console.log("Auth callback received with hash:", hash);
        
        // Process the callback from Supabase
        const { data, error } = await supabase.auth.getSession();

        if (error) {
          console.error('Error during auth callback:', error);
          setError(error.message);
          return;
        }

        if (data?.session) {
          console.log('Authentication successful, redirecting to dashboard');
          navigate('/');
        } else {
          console.log('No session found, redirecting to login');
          navigate('/');
        }
      } catch (err: any) {
        console.error('Exception during auth callback:', err);
        setError(err.message || 'An error occurred during authentication');
      }
    };

    handleAuthCallback();
  }, [navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-background to-background/95 p-4">
      <div className="w-full max-w-md p-8 space-y-4 bg-white rounded-lg shadow-lg text-center">
        {error ? (
          <>
            <h1 className="text-2xl font-bold text-destructive">Authentication Error</h1>
            <p className="text-muted-foreground">{error}</p>
            <button 
              className="mt-4 px-4 py-2 bg-primary text-white rounded-md"
              onClick={() => navigate('/')}
            >
              Return to Login
            </button>
          </>
        ) : (
          <>
            <h1 className="text-2xl font-bold">Completing Authentication...</h1>
            <p className="text-muted-foreground">Please wait while we verify your account.</p>
            <div className="flex justify-center mt-4">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default AuthCallback;
