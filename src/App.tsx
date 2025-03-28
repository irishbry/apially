
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Routes, Route, Navigate } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import DeploymentInstructions from "./pages/DeploymentInstructions";
import AutoInstaller from "./components/AutoInstaller";

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

// Remove the test notification that was added on startup
// setTimeout(() => {
//   NotificationService.addNotification(
//     'Welcome to API Manager',
//     'Explore the new advanced data filtering and historical analytics!',
//     'info'
//   );
// }, 3000);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/deploy" element={<DeploymentInstructions />} />
        <Route path="/installer" element={<AutoInstaller />} />
        {/* Handle 404 errors */}
        <Route path="/404" element={<NotFound />} />
        {/* Redirect all other routes to the 404 page instead of rendering it directly */}
        <Route path="*" element={<Navigate to="/404" replace />} />
      </Routes>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
