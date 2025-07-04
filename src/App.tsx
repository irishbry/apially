
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Routes, Route, Navigate } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import DeploymentInstructions from "./pages/DeploymentInstructions";
import AutoInstaller from "./components/AutoInstaller";
import Signup from "./pages/Signup";
import AuthCallback from "./pages/AuthCallback";
import SmtpTest from "./pages/SmtpTest";

// Initialize notification listeners
import NotificationService from "./services/NotificationService";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      {/* Toasters with explicit positions */}
      <Toaster position="bottom-right" closeButton={true} />
      <Sonner position="top-right" />
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/deploy" element={<DeploymentInstructions />} />
        <Route path="/installer" element={<AutoInstaller />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/auth/callback" element={<AuthCallback />} />
        <Route path="/smtp-test" element={<SmtpTest />} />
        {/* Handle 404 errors */}
        <Route path="/404" element={<NotFound />} />
        {/* Redirect all other routes to the 404 page instead of rendering it directly */}
        <Route path="*" element={<Navigate to="/404" replace />} />
      </Routes>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
