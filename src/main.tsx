
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import App from './App.tsx'
import InstallerPage from './pages/InstallerPage.tsx'
import './index.css'

// Improved error boundary for the entire application
const renderApp = () => {
  try {
    const container = document.getElementById("root");
    
    if (!container) {
      console.error("Root element not found!");
      return;
    }
    
    const root = createRoot(container);
    
    // Render the app with proper routing
    root.render(
      <BrowserRouter>
        <Routes>
          <Route path="/installer" element={<InstallerPage />} />
          <Route path="/*" element={<App />} />
        </Routes>
      </BrowserRouter>
    );
    
    console.log("Application successfully rendered");
  } catch (error) {
    console.error("Failed to render application:", error);
    const rootElement = document.getElementById("root");
    if (rootElement) {
      rootElement.innerHTML = `
        <div style="padding: 20px; font-family: Arial, sans-serif;">
          <h2 style="color: #e53e3e;">Application Error</h2>
          <p>The application failed to start due to an error.</p>
          <pre style="background: #f7fafc; padding: 10px; border-radius: 5px; overflow: auto;">${error.message}</pre>
          <p><a href="/installer" style="color: #3182ce;">Go to Installer Page</a></p>
        </div>
      `;
    }
  }
};

// Execute with a small delay to ensure DOM is fully loaded
setTimeout(renderApp, 0);
