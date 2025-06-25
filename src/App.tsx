import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import DataEntries from '@/pages/DataEntries';
import Sources from '@/pages/Sources';
import Analytics from '@/pages/Analytics';
import Settings from '@/pages/Settings';
import { Toaster } from "@/components/ui/toaster"
import { useToast } from "@/hooks/use-toast"
import { AuthProvider } from './hooks/useAuth';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import RequireAuth from './components/RequireAuth';
import DropboxOAuthCallback from '@/pages/DropboxOAuthCallback';

const queryClient = new QueryClient();

function App() {
  return (
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
        <div className="min-h-screen bg-background">
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              
              <Route path="/" element={<RequireAuth><DataEntries /></RequireAuth>} />
              <Route path="/sources" element={<RequireAuth><Sources /></RequireAuth>} />
              <Route path="/analytics" element={<RequireAuth><Analytics /></RequireAuth>} />
              <Route path="/settings" element={<RequireAuth><Settings /></RequireAuth>} />
            <Route path="/dropbox-oauth-callback" element={<DropboxOAuthCallback />} />
          </Routes>
          <Toaster />
        </div>
        </AuthProvider>
      </QueryClientProvider>
    </BrowserRouter>
  );
}

export default App;
