
import JSZip from 'jszip';
import { saveAs } from 'file-saver';

/**
 * Creates a package of the frontend application files
 * @returns Promise that resolves when the download starts
 */
export const packageFrontendFiles = async (): Promise<void> => {
  const zip = new JSZip();
  
  // Add package.json
  zip.file("package.json", JSON.stringify({
    "name": "csv-consolidator-frontend",
    "private": true,
    "version": "1.0.0",
    "type": "module",
    "scripts": {
      "dev": "vite",
      "build": "tsc && vite build",
      "lint": "eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0",
      "preview": "vite preview"
    },
    "dependencies": {
      "@hookform/resolvers": "^3.9.0",
      "@radix-ui/react-accordion": "^1.2.0",
      "@radix-ui/react-alert-dialog": "^1.1.1",
      "@radix-ui/react-aspect-ratio": "^1.1.0",
      "@radix-ui/react-avatar": "^1.1.0",
      "@radix-ui/react-checkbox": "^1.1.1",
      "@radix-ui/react-collapsible": "^1.1.0",
      "@radix-ui/react-context-menu": "^2.2.1",
      "@radix-ui/react-dialog": "^1.1.2",
      "@radix-ui/react-dropdown-menu": "^2.1.1",
      "@radix-ui/react-hover-card": "^1.1.1",
      "@radix-ui/react-label": "^2.1.0",
      "@radix-ui/react-menubar": "^1.1.1",
      "@radix-ui/react-navigation-menu": "^1.2.0",
      "@radix-ui/react-popover": "^1.1.1",
      "@radix-ui/react-progress": "^1.1.0",
      "@radix-ui/react-radio-group": "^1.2.0",
      "@radix-ui/react-scroll-area": "^1.1.0",
      "@radix-ui/react-select": "^2.1.1",
      "@radix-ui/react-separator": "^1.1.0",
      "@radix-ui/react-slider": "^1.2.0",
      "@radix-ui/react-slot": "^1.1.0",
      "@radix-ui/react-switch": "^1.1.0",
      "@radix-ui/react-tabs": "^1.1.0",
      "@radix-ui/react-toast": "^1.2.1",
      "@radix-ui/react-toggle": "^1.1.0",
      "@radix-ui/react-toggle-group": "^1.1.0",
      "@radix-ui/react-tooltip": "^1.1.4",
      "@tanstack/react-query": "^5.56.2",
      "class-variance-authority": "^0.7.1",
      "clsx": "^2.1.1",
      "cmdk": "^1.0.0",
      "date-fns": "^3.6.0",
      "embla-carousel-react": "^8.3.0",
      "file-saver": "^2.0.5",
      "input-otp": "^1.2.4",
      "jszip": "^3.10.1",
      "lucide-react": "^0.462.0",
      "next-themes": "^0.3.0",
      "react": "^18.3.1",
      "react-day-picker": "^8.10.1",
      "react-dom": "^18.3.1",
      "react-hook-form": "^7.53.0",
      "react-resizable-panels": "^2.1.3",
      "react-router-dom": "^6.26.2",
      "recharts": "^2.12.7",
      "sonner": "^1.5.0",
      "tailwind-merge": "^2.5.2",
      "tailwindcss-animate": "^1.0.7",
      "vaul": "^0.9.3",
      "zod": "^3.23.8"
    },
    "devDependencies": {
      "@types/file-saver": "^2.0.7",
      "@types/node": "^20.10.5",
      "@types/react": "^18.3.1",
      "@types/react-dom": "^18.3.1",
      "@typescript-eslint/eslint-plugin": "^6.21.0",
      "@typescript-eslint/parser": "^6.21.0",
      "@vitejs/plugin-react-swc": "^3.6.0",
      "autoprefixer": "^10.4.16",
      "eslint": "^8.57.0",
      "eslint-plugin-react-hooks": "^4.6.0",
      "eslint-plugin-react-refresh": "^0.4.5",
      "postcss": "^8.4.35",
      "tailwindcss": "^3.4.1",
      "typescript": "^5.3.3",
      "vite": "^5.1.4"
    }
  }, null, 2));

  // Add index.html
  zip.file("index.html", `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>CSV Consolidator Portal</title>
    <meta name="description" content="CSV Consolidator Portal - Collect and manage your data" />
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
`);

  // Add basic config files
  zip.file("tsconfig.json", JSON.stringify({
    "compilerOptions": {
      "target": "ES2020",
      "useDefineForClassFields": true,
      "lib": ["ES2020", "DOM", "DOM.Iterable"],
      "module": "ESNext",
      "skipLibCheck": true,
      "moduleResolution": "bundler",
      "allowImportingTsExtensions": true,
      "resolveJsonModule": true,
      "isolatedModules": true,
      "noEmit": true,
      "jsx": "react-jsx",
      "strict": true,
      "noUnusedLocals": true,
      "noUnusedParameters": true,
      "noFallthroughCasesInSwitch": true,
      "baseUrl": ".",
      "paths": {
        "@/*": ["./src/*"]
      }
    },
    "include": ["src"],
    "references": [{ "path": "./tsconfig.node.json" }]
  }, null, 2));

  zip.file("tsconfig.node.json", JSON.stringify({
    "compilerOptions": {
      "composite": true,
      "skipLibCheck": true,
      "module": "ESNext",
      "moduleResolution": "bundler",
      "allowSyntheticDefaultImports": true
    },
    "include": ["vite.config.ts"]
  }, null, 2));

  zip.file("vite.config.ts", `import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

export default defineConfig({
  server: {
    port: 3000,
  },
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
`);

  zip.file("tailwind.config.js", `/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: '2rem',
      screens: {
        '2xl': '1400px'
      }
    },
    extend: {
      fontFamily: {
        sans: [
          '"SF Pro Display"', 
          '"Inter"', 
          'system-ui', 
          'sans-serif'
        ],
      },
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))'
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))'
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))'
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))'
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))'
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))'
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))'
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)'
      },
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' }
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' }
        },
        'fade-in': {
          from: { opacity: '0' },
          to: { opacity: '1' }
        },
        'fade-out': {
          from: { opacity: '1' },
          to: { opacity: '0' }
        },
        'slide-up': {
          from: { transform: 'translateY(10px)', opacity: '0' },
          to: { transform: 'translateY(0)', opacity: '1' }
        },
        'pulse-subtle': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.8' }
        }
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        'fade-in': 'fade-in 0.3s ease-out',
        'fade-out': 'fade-out 0.3s ease-out',
        'slide-up': 'slide-up 0.4s ease-out',
        'pulse-subtle': 'pulse-subtle 2s ease-in-out infinite'
      }
    }
  },
  plugins: [require("tailwindcss-animate")],
}`);

  zip.file("postcss.config.js", `module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}`);

  // Add README
  zip.file("README.md", `# CSV Consolidator Portal Frontend

This is the frontend application for the CSV Consolidator Portal.

## Setup

1. Install dependencies:
   \`\`\`
   npm install
   \`\`\`

2. Run development server:
   \`\`\`
   npm run dev
   \`\`\`

3. Build for production:
   \`\`\`
   npm run build
   \`\`\`

## Configuration

Update the API endpoint in \`src/services/ApiService.ts\` to point to your production API server.
`);

  // Create directory structure
  const srcFolder = zip.folder("src");
  const componentsFolder = srcFolder.folder("components");
  const uiFolder = componentsFolder.folder("ui");
  const pagesFolder = srcFolder.folder("pages");
  const libFolder = srcFolder.folder("lib");
  const utilsFolder = srcFolder.folder("utils");
  const servicesFolder = srcFolder.folder("services");
  const hooksFolder = srcFolder.folder("hooks");

  // Add src/main.tsx
  srcFolder.file("main.tsx", `import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
`);

  // Add src/App.tsx
  srcFolder.file("App.tsx", `import { Toaster } from "./components/ui/toaster";
import { Toaster as Sonner } from "./components/ui/sonner";
import { TooltipProvider } from "./components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import DeploymentInstructions from "./pages/DeploymentInstructions";
import "./App.css";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/deploy" element={<DeploymentInstructions />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
`);

  // Add CSS files
  srcFolder.file("App.css", `#root {
  width: 100%;
  margin: 0 auto;
}

/* Remove default margin/padding */
body, html {
  margin: 0;
  padding: 0;
}

/* Smooth scrolling */
html {
  scroll-behavior: smooth;
}

/* Ensure all transitions are smooth */
* {
  transition-property: background-color, border-color, color, fill, stroke, opacity, box-shadow, transform, filter, backdrop-filter;
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
  transition-duration: 300ms;
}
`);

  srcFolder.file("index.css", `@import url('https://fonts.googleapis.com/css2?family=Inter:wght@100;200;300;400;500;600;700;800;900&display=swap');

@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background: 210 20% 98%;
    --foreground: 212 45% 15%;

    --card: 0 0% 100%;
    --card-foreground: 214 45% 18%;

    --popover: 0 0% 100%;
    --popover-foreground: 214 45% 18%;

    --primary: 215 70% 55%;
    --primary-foreground: 210 40% 98%;

    --secondary: 215 25% 92%;
    --secondary-foreground: 214 45% 18%;

    --muted: 214 15% 91%;
    --muted-foreground: 214 20% 45%;

    --accent: 214 15% 91%;
    --accent-foreground: 214 45% 18%;

    --destructive: 0 84% 60%;
    --destructive-foreground: 210 40% 98%;

    --border: 214 20% 90%;
    --input: 214 20% 90%;
    --ring: 215 70% 55%;

    --radius: 0.75rem;
  }

  * {
    @apply border-border;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }

  body {
    @apply bg-background text-foreground;
  }

  /* Glass effect */
  .glass {
    background: rgba(255, 255, 255, 0.7);
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.2);
  }

  /* Smooth transitions */
  .smooth-transition {
    @apply transition-all duration-300 ease-in-out;
  }

  /* Subtle hover effect */
  .hover-lift {
    @apply transition-all duration-300 ease-in-out;
  }
  .hover-lift:hover {
    @apply transform -translate-y-1;
  }
}
`);

  // Add utilities
  libFolder.file("utils.ts", `import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
`);

  utilsFolder.file("csvUtils.ts", `/**
 * Converts an array of objects to CSV format and triggers download
 * @param data Array of objects to convert to CSV
 * @param filename Optional filename (defaults to data.csv)
 */
export const downloadCSV = (data: any[], filename = 'data.csv'): void => {
  if (!data || !data.length) {
    console.warn('No data provided for CSV download');
    return;
  }

  try {
    // Get all column headers from the data
    const headers = Object.keys(data[0]);
    
    // Create CSV header row
    const csvRows = [
      headers.join(',')
    ];
    
    // Add data rows
    for (const row of data) {
      const values = headers.map(header => {
        const val = row[header];
        // Handle null, undefined, and format objects/arrays
        if (val === null || val === undefined) {
          return '';
        }
        if (typeof val === 'object') {
          return JSON.stringify(val).replace(/"/g, '""');
        }
        // Escape quotes and wrap in quotes if contains comma, quote, or newline
        const cell = String(val).replace(/"/g, '""');
        return /[",\\n]/.test(cell) ? \`"\${cell}"\` : cell;
      });
      csvRows.push(values.join(','));
    }
    
    // Combine rows into a string
    const csvString = csvRows.join('\\n');
    
    // Create blob and download
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch (error) {
    console.error('Error generating CSV file:', error);
  }
};
`);

  // Add API services
  servicesFolder.file("ApiService.ts", `import { v4 as uuidv4 } from 'uuid';

export interface DataEntry {
  id?: string;
  timestamp: string;
  sourceId?: string;
  sensorId?: string;
  [key: string]: any;
}

export interface Source {
  id: string;
  name: string;
  apiKey: string;
  createdAt: string;
}

export interface ApiResponse {
  success: boolean;
  message: string;
  data?: any;
}

// Mock data store (would be replaced by real API calls in production)
let storedApiKey = localStorage.getItem('apiKey') || '';
let dropboxLink = localStorage.getItem('dropboxLink') || '';
let isAuthenticated = localStorage.getItem('isAuthenticated') === 'true';
let username = localStorage.getItem('username') || '';
let password = localStorage.getItem('password') || '';

if (!username) {
  // Default credentials if not set
  username = 'admin';
  password = 'admin';
  localStorage.setItem('username', username);
  localStorage.setItem('password', password);
}

// Mock data storage
let data: DataEntry[] = [];
let sources: Source[] = localStorage.getItem('sources') 
  ? JSON.parse(localStorage.getItem('sources') || '[]') 
  : [];

// If no sources, create a default one
if (sources.length === 0) {
  const defaultSource: Source = {
    id: uuidv4(),
    name: 'Default Source',
    apiKey: uuidv4(),
    createdAt: new Date().toISOString(),
  };
  sources.push(defaultSource);
  localStorage.setItem('sources', JSON.stringify(sources));
}

// Callback for data changes
type DataCallback = (data: DataEntry[]) => void;
type SourceCallback = (sources: Source[]) => void;
const dataCallbacks: DataCallback[] = [];
const sourceCallbacks: SourceCallback[] = [];

const ApiService = {
  // Authentication
  login: (inputUsername: string, inputPassword: string): boolean => {
    if (inputUsername === username && inputPassword === password) {
      isAuthenticated = true;
      localStorage.setItem('isAuthenticated', 'true');
      return true;
    }
    return false;
  },
  
  logout: (): void => {
    isAuthenticated = false;
    localStorage.setItem('isAuthenticated', 'false');
  },
  
  isUserAuthenticated: (): boolean => {
    return isAuthenticated;
  },
  
  // API Key Management
  setApiKey: (key: string): void => {
    storedApiKey = key;
    localStorage.setItem('apiKey', key);
  },
  
  getApiKey: (): string => {
    return storedApiKey;
  },
  
  // Dropbox Link Management
  setDropboxLink: (link: string): void => {
    dropboxLink = link;
    localStorage.setItem('dropboxLink', link);
  },
  
  getDropboxLink: (): string => {
    return dropboxLink;
  },
  
  // Source Management
  getSources: (): Source[] => {
    return sources;
  },
  
  addSource: (name: string): Source => {
    const newSource: Source = {
      id: uuidv4(),
      name,
      apiKey: uuidv4(),
      createdAt: new Date().toISOString(),
    };
    
    sources.push(newSource);
    localStorage.setItem('sources', JSON.stringify(sources));
    sourceCallbacks.forEach(callback => callback([...sources]));
    
    return newSource;
  },
  
  updateSource: (id: string, name: string): Source | null => {
    const index = sources.findIndex(s => s.id === id);
    if (index === -1) return null;
    
    sources[index].name = name;
    localStorage.setItem('sources', JSON.stringify(sources));
    sourceCallbacks.forEach(callback => callback([...sources]));
    
    return sources[index];
  },
  
  deleteSource: (id: string): boolean => {
    const index = sources.findIndex(s => s.id === id);
    if (index === -1) return false;
    
    sources.splice(index, 1);
    localStorage.setItem('sources', JSON.stringify(sources));
    sourceCallbacks.forEach(callback => callback([...sources]));
    
    return true;
  },
  
  // Data Management
  getData: (): DataEntry[] => {
    return data;
  },
  
  receiveData: (entry: DataEntry, apiKey: string): ApiResponse => {
    // Find the source for this API key
    const source = sources.find(s => s.apiKey === apiKey);
    
    if (!source) {
      return {
        success: false,
        message: 'Invalid API key',
      };
    }
    
    // Add source ID and unique ID
    const newEntry: DataEntry = {
      ...entry,
      id: uuidv4(),
      sourceId: source.id,
    };
    
    data.push(newEntry);
    dataCallbacks.forEach(callback => callback([...data]));
    
    return {
      success: true,
      message: 'Data received successfully',
      data: newEntry,
    };
  },
  
  clearData: (): void => {
    data = [];
    dataCallbacks.forEach(callback => callback([]));
  },
  
  // Export to CSV (mock function for demo)
  exportToCsv: (): ApiResponse => {
    if (!dropboxLink) {
      return {
        success: false,
        message: 'Dropbox link not configured',
      };
    }
    
    return {
      success: true,
      message: 'Data exported to Dropbox successfully',
    };
  },
  
  // Observer pattern for data updates
  subscribe: (callback: DataCallback): () => void => {
    dataCallbacks.push(callback);
    return () => {
      const index = dataCallbacks.indexOf(callback);
      if (index > -1) {
        dataCallbacks.splice(index, 1);
      }
    };
  },
  
  subscribeToSources: (callback: SourceCallback): () => void => {
    sourceCallbacks.push(callback);
    return () => {
      const index = sourceCallbacks.indexOf(callback);
      if (index > -1) {
        sourceCallbacks.splice(index, 1);
      }
    };
  },
  
  // Usage Statistics (mock data for demo)
  getUsageStats: () => {
    return {
      totalRequests: Math.floor(Math.random() * 10000),
      todayRequests: Math.floor(Math.random() * 100),
      averageSize: Math.floor(Math.random() * 500) + 'KB',
      lastExport: new Date(Date.now() - Math.floor(Math.random() * 86400000)).toISOString(),
    };
  },
};

export default ApiService;
`);

  // Now create a function to package API files
  utilsFolder.file("packageUtils.ts", `import JSZip from 'jszip';
import { saveAs } from 'file-saver';

/**
 * Creates a package of the frontend application files
 * @returns Promise that resolves when the download starts
 */
export const packageFrontendFiles = async (): Promise<void> => {
  const zip = new JSZip();
  
  // Add package.json
  zip.file("package.json", JSON.stringify({
    "name": "csv-consolidator-frontend",
    "private": true,
    "version": "1.0.0",
    "type": "module",
    "scripts": {
      "dev": "vite",
      "build": "tsc && vite build",
      "lint": "eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0",
      "preview": "vite preview"
    },
    "dependencies": {
      "@hookform/resolvers": "^3.9.0",
      "@radix-ui/react-accordion": "^1.2.0",
      "@radix-ui/react-alert-dialog": "^1.1.1",
      "@radix-ui/react-aspect-ratio": "^1.1.0",
      "@radix-ui/react-avatar": "^1.1.0",
      "@radix-ui/react-checkbox": "^1.1.1",
      "@radix-ui/react-collapsible": "^1.1.0",
      "@radix-ui/react-context-menu": "^2.2.1",
      "@radix-ui/react-dialog": "^1.1.2",
      "@radix-ui/react-dropdown-menu": "^2.1.1",
      "@radix-ui/react-hover-card": "^1.1.1",
      "@radix-ui/react-label": "^2.1.0",
      "@radix-ui/react-menubar": "^1.1.1",
      "@radix-ui/react-navigation-menu": "^1.2.0",
      "@radix-ui/react-popover": "^1.1.1",
      "@radix-ui/react-progress": "^1.1.0",
      "@radix-ui/react-radio-group": "^1.2.0",
      "@radix-ui/react-scroll-area": "^1.1.0",
      "@radix-ui/react-select": "^2.1.1",
      "@radix-ui/react-separator": "^1.1.0",
      "@radix-ui/react-slider": "^1.2.0",
      "@radix-ui/react-slot": "^1.1.0",
      "@radix-ui/react-switch": "^1.1.0",
      "@radix-ui/react-tabs": "^1.1.0",
      "@radix-ui/react-toast": "^1.2.1",
      "@radix-ui/react-toggle": "^1.1.0",
      "@radix-ui/react-toggle-group": "^1.1.0",
      "@radix-ui/react-tooltip": "^1.1.4",
      "@tanstack/react-query": "^5.56.2",
      "class-variance-authority": "^0.7.1",
      "clsx": "^2.1.1",
      "cmdk": "^1.0.0",
      "date-fns": "^3.6.0",
      "embla-carousel-react": "^8.3.0",
      "file-saver": "^2.0.5",
      "input-otp": "^1.2.4",
      "jszip": "^3.10.1",
      "lucide-react": "^0.462.0",
      "next-themes": "^0.3.0",
      "react": "^18.3.1",
      "react-day-picker": "^8.10.1",
      "react-dom": "^18.3.1",
      "react-hook-form": "^7.53.0",
      "react-resizable-panels": "^2.1.3",
      "react-router-dom": "^6.26.2",
      "recharts": "^2.12.7",
      "sonner": "^1.5.0",
      "tailwind-merge": "^2.5.2",
      "tailwindcss-animate": "^1.0.7",
      "vaul": "^0.9.3",
      "zod": "^3.23.8"
    },
    "devDependencies": {
      "@types/file-saver": "^2.0.7",
      "@types/node": "^20.10.5",
      "@types/react": "^18.3.1",
      "@types/react-dom": "^18.3.1",
      "@typescript-eslint/eslint-plugin": "^6.21.0",
      "@typescript-eslint/parser": "^6.21.0",
      "@vitejs/plugin-react-swc": "^3.6.0",
      "autoprefixer": "^10.4.16",
      "eslint": "^8.57.0",
      "eslint-plugin-react-hooks": "^4.6.0",
      "eslint-plugin-react-refresh": "^0.4.5",
      "postcss": "^8.4.35",
      "tailwindcss": "^3.4.1",
      "typescript": "^5.3.3",
      "vite": "^5.1.4"
    }
  }, null, 2));

  // Add more files and folders...

  // Generate the zip file and trigger download
  const content = await zip.generateAsync({ type: "blob" });
  saveAs(content, "csv-consolidator-frontend.zip");
};

/**
 * Creates a package of the backend API files
 * @returns Promise that resolves when the download starts
 */
export const packageApiFiles = async (): Promise<void> => {
  const zip = new JSZip();
  
  // Add API files
  zip.file("README.md", `# CSV Consolidator API

This is the PHP API for the CSV Consolidator system.

## Setup

1. Upload these files to your PHP-enabled web server
2. Configure your database connection in \`config.php\`
3. Visit \`install.php\` in your browser to set up the database

## Endpoints

- \`/api/receive.php\` - Receives data from sensors/sources
- \`/api/export.php\` - Manually triggers CSV export
- \`/api/test.php\` - Tests if the API is working correctly

## Debugging

If you encounter any issues, check:
1. PHP error logs
2. Database connection parameters
3. File permissions (especially for CSV export directory)
`);

  // Config file
  zip.file("config.php", `<?php
// Enable detailed error reporting for debugging
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

// Database configuration
$config = [
    'db' => [
        'host' => 'localhost',
        'username' => 'your_db_username',
        'password' => 'your_db_password',
        'database' => 'csv_consolidator'
    ],
    'api' => [
        'allow_test_data' => true,  // Set to false in production
        'debug_mode' => true,       // Set to false in production
    ],
    'export' => [
        'dropbox_token' => '',      // Your Dropbox API token
        'export_dir' => 'exports/',  // Directory to store CSV files before upload
        'auto_export_hour' => 23,    // Hour of day to auto-export (0-23)
    ]
];

// Create database connection
function getDbConnection() {
    global $config;
    
    try {
        $conn = new PDO(
            "mysql:host={$config['db']['host']};dbname={$config['db']['database']}",
            $config['db']['username'],
            $config['db']['password']
        );
        
        // Set the PDO error mode to exception
        $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        return $conn;
    } catch(PDOException $e) {
        // Log the error but don't expose details in the response
        error_log("Database connection failed: " . $e->getMessage());
        return null;
    }
}

// Verify API key
function verifyApiKey($apiKey) {
    try {
        $conn = getDbConnection();
        if (!$conn) {
            return false;
        }
        
        $stmt = $conn->prepare("SELECT id FROM sources WHERE api_key = :api_key");
        $stmt->bindParam(':api_key', $apiKey);
        $stmt->execute();
        
        return $stmt->rowCount() > 0;
    } catch(PDOException $e) {
        error_log("API key verification failed: " . $e->getMessage());
        return false;
    }
}

// Helper function to send JSON response
function sendJsonResponse($success, $message, $data = null, $statusCode = 200) {
    http_response_code($statusCode);
    header('Content-Type: application/json');
    
    $response = [
        'success' => $success,
        'message' => $message
    ];
    
    if ($data !== null) {
        $response['data'] = $data;
    }
    
    echo json_encode($response);
    exit;
}
`);

  // Install script
  zip.file("install.php", `<?php
require_once 'config.php';

// Make sure this script only runs in a web browser
if (php_sapi_name() == 'cli') {
    die("Please run this script from a web browser.");
}

// Function to check if tables exist
function tablesExist($conn) {
    try {
        $tables = ['sources', 'data_entries'];
        foreach ($tables as $table) {
            $result = $conn->query("SHOW TABLES LIKE '$table'");
            if ($result->rowCount() == 0) {
                return false;
            }
        }
        return true;
    } catch (PDOException $e) {
        return false;
    }
}

// Function to create tables
function createTables($conn) {
    try {
        // Create sources table
        $conn->exec("CREATE TABLE IF NOT EXISTS sources (
            id VARCHAR(36) PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            api_key VARCHAR(36) UNIQUE NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )");
        
        // Create data_entries table
        $conn->exec("CREATE TABLE IF NOT EXISTS data_entries (
            id VARCHAR(36) PRIMARY KEY,
            source_id VARCHAR(36) NOT NULL,
            timestamp TIMESTAMP NOT NULL,
            sensor_id VARCHAR(255),
            data_json TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (source_id) REFERENCES sources(id) ON DELETE CASCADE
        )");
        
        return true;
    } catch (PDOException $e) {
        error_log("Error creating tables: " . $e->getMessage());
        return false;
    }
}

// Function to create default source
function createDefaultSource($conn) {
    try {
        // Check if any source exists
        $result = $conn->query("SELECT COUNT(*) FROM sources");
        if ($result->fetchColumn() > 0) {
            return true; // Sources already exist
        }
        
        // Generate UUID and API key
        $id = generateUuid();
        $apiKey = generateUuid();
        
        // Create default source
        $stmt = $conn->prepare("INSERT INTO sources (id, name, api_key) VALUES (:id, :name, :api_key)");
        $name = "Default Source";
        $stmt->bindParam(':id', $id);
        $stmt->bindParam(':name', $name);
        $stmt->bindParam(':api_key', $apiKey);
        $stmt->execute();
        
        return $apiKey;
    } catch (PDOException $e) {
        error_log("Error creating default source: " . $e->getMessage());
        return false;
    }
}

// Generate UUID v4
function generateUuid() {
    return sprintf('%04x%04x-%04x-%04x-%04x-%04x%04x%04x',
        mt_rand(0, 0xffff), mt_rand(0, 0xffff),
        mt_rand(0, 0xffff),
        mt_rand(0, 0x0fff) | 0x4000,
        mt_rand(0, 0x3fff) | 0x8000,
        mt_rand(0, 0xffff), mt_rand(0, 0xffff), mt_rand(0, 0xffff)
    );
}

// Create export directory
function createExportDir() {
    global $config;
    $dir = $config['export']['export_dir'];
    
    if (!file_exists($dir)) {
        return mkdir($dir, 0755, true);
    }
    
    return is_writable($dir);
}

// Main installer logic
$messages = [];
$success = false;
$defaultApiKey = null;

if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['install'])) {
    // Connect to database
    $conn = getDbConnection();
    
    if (!$conn) {
        $messages[] = "⚠️ Could not connect to database. Please check your database configuration in config.php.";
    } else {
        // Check if tables exist
        if (tablesExist($conn)) {
            $messages[] = "✓ Database tables already exist.";
        } else {
            // Create tables
            if (createTables($conn)) {
                $messages[] = "✓ Database tables created successfully.";
            } else {
                $messages[] = "⚠️ Error creating database tables.";
            }
        }
        
        // Create default source if needed
        $defaultSource = createDefaultSource($conn);
        if ($defaultSource !== false && $defaultSource !== true) {
            $defaultApiKey = $defaultSource;
            $messages[] = "✓ Default source created with API key: " . $defaultApiKey;
        } elseif ($defaultSource === true) {
            $messages[] = "✓ Sources already exist in the database.";
        } else {
            $messages[] = "⚠️ Error creating default source.";
        }
        
        // Create export directory
        if (createExportDir()) {
            $messages[] = "✓ Export directory created and is writable.";
        } else {
            $messages[] = "⚠️ Could not create or write to export directory. Please check permissions.";
        }
        
        $success = true;
    }
}

// Display installer page
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>CSV Consolidator API Installer</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
        }
        .container {
            background-color: #f9f9f9;
            border-radius: 8px;
            padding: 20px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        h1 {
            color: #2563eb;
            border-bottom: 2px solid #e5e7eb;
            padding-bottom: 10px;
        }
        .messages {
            background-color: #f3f4f6;
            padding: 15px;
            border-radius: 6px;
            margin: 20px 0;
        }
        .success-message {
            color: #047857;
            font-weight: bold;
        }
        .button {
            background-color: #2563eb;
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 6px;
            cursor: pointer;
            font-size: 16px;
            transition: background-color 0.3s;
        }
        .button:hover {
            background-color: #1d4ed8;
        }
        .code {
            background-color: #e5e7eb;
            padding: 2px 6px;
            border-radius: 4px;
            font-family: monospace;
        }
        .api-key {
            background-color: #e5e7eb;
            padding: 10px;
            border-radius: 4px;
            font-family: monospace;
            word-break: break-all;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>CSV Consolidator API Installer</h1>
        
        <?php if (!empty($messages)): ?>
            <div class="messages">
                <?php foreach ($messages as $message): ?>
                    <div><?php echo $message; ?></div>
                <?php endforeach; ?>
            </div>
            
            <?php if ($success): ?>
                <div class="success-message">
                    Installation completed successfully!
                </div>
                
                <?php if ($defaultApiKey): ?>
                    <p>Your default API key is:</p>
                    <div class="api-key"><?php echo $defaultApiKey; ?></div>
                    <p>Use this key to authenticate API requests from your application.</p>
                <?php endif; ?>
                
                <p>Next steps:</p>
                <ul>
                    <li>Test the API by visiting <a href="api/test.php">api/test.php</a></li>
                    <li>Configure your frontend application to use this API</li>
                    <li>For security, consider removing this install script in production</li>
                </ul>
            <?php endif; ?>
        <?php else: ?>
            <p>Welcome to the CSV Consolidator API installer. This script will:</p>
            <ul>
                <li>Create necessary database tables</li>
                <li>Set up a default data source with API key</li>
                <li>Create the export directory for CSV files</li>
            </ul>
            
            <p>Before continuing, make sure you've configured the database settings in <span class="code">config.php</span>.</p>
            
            <form method="post">
                <button type="submit" name="install" class="button">Install Now</button>
            </form>
        <?php endif; ?>
    </div>
</body>
</html>
`);

  // API test script
  zip.file("api/test.php", `<?php
require_once '../config.php';

// Set proper content type
header('Content-Type: application/json');

// Test results array
$tests = [];
$allPassed = true;

// Test 1: PHP Version
$phpVersion = phpversion();
$phpVersionPassed = version_compare($phpVersion, '7.2.0', '>=');
$tests[] = [
    'name' => 'PHP Version',
    'passed' => $phpVersionPassed,
    'message' => $phpVersionPassed 
        ? "PHP version $phpVersion is supported" 
        : "PHP version $phpVersion is too old, 7.2.0 or higher is required"
];
$allPassed = $allPassed && $phpVersionPassed;

// Test 2: Required Extensions
$requiredExtensions = ['pdo', 'pdo_mysql', 'json', 'curl'];
$missingExtensions = [];

foreach ($requiredExtensions as $ext) {
    if (!extension_loaded($ext)) {
        $missingExtensions[] = $ext;
    }
}

$extensionsPassed = empty($missingExtensions);
$tests[] = [
    'name' => 'Required PHP Extensions',
    'passed' => $extensionsPassed,
    'message' => $extensionsPassed 
        ? "All required extensions are available" 
        : "Missing extensions: " . implode(', ', $missingExtensions)
];
$allPassed = $allPassed && $extensionsPassed;

// Test 3: Database Connection
$dbConn = getDbConnection();
$dbPassed = $dbConn !== null;
$tests[] = [
    'name' => 'Database Connection',
    'passed' => $dbPassed,
    'message' => $dbPassed 
        ? "Successfully connected to database" 
        : "Failed to connect to database, check config.php settings"
];
$allPassed = $allPassed && $dbPassed;

// Test 4: Required Tables
$tablesExist = false;
if ($dbPassed) {
    try {
        $requiredTables = ['sources', 'data_entries'];
        $missingTables = [];
        
        foreach ($requiredTables as $table) {
            $stmt = $dbConn->query("SHOW TABLES LIKE '$table'");
            if ($stmt->rowCount() == 0) {
                $missingTables[] = $table;
            }
        }
        
        $tablesExist = empty($missingTables);
        $tests[] = [
            'name' => 'Database Tables',
            'passed' => $tablesExist,
            'message' => $tablesExist 
                ? "All required database tables exist" 
                : "Missing tables: " . implode(', ', $missingTables) . ". Run install.php to create them."
        ];
    } catch (PDOException $e) {
        $tests[] = [
            'name' => 'Database Tables',
            'passed' => false,
            'message' => "Error checking database tables: " . $e->getMessage()
        ];
        $tablesExist = false;
    }
}
$allPassed = $allPassed && $tablesExist;

// Test 5: Export Directory
$exportDir = $config['export']['export_dir'];
$dirExists = file_exists($exportDir);
$dirWritable = $dirExists && is_writable($exportDir);

$tests[] = [
    'name' => 'Export Directory',
    'passed' => $dirWritable,
    'message' => $dirWritable 
        ? "Export directory exists and is writable" 
        : ($dirExists 
            ? "Export directory exists but is not writable" 
            : "Export directory does not exist")
];
$allPassed = $allPassed && $dirWritable;

// Test 6: Check for at least one API key in the database
$hasApiKey = false;
if ($dbPassed && $tablesExist) {
    try {
        $stmt = $dbConn->query("SELECT COUNT(*) FROM sources");
        $sourceCount = (int)$stmt->fetchColumn();
        $hasApiKey = $sourceCount > 0;
        
        $tests[] = [
            'name' => 'API Keys',
            'passed' => $hasApiKey,
            'message' => $hasApiKey 
                ? "Found $sourceCount source(s) with API keys" 
                : "No API keys found. Run install.php to create a default source."
        ];
    } catch (PDOException $e) {
        $tests[] = [
            'name' => 'API Keys',
            'passed' => false,
            'message' => "Error checking API keys: " . $e->getMessage()
        ];
    }
}
$allPassed = $allPassed && $hasApiKey;

// Test 7: Write a test file to verify permissions
$testFilePath = $exportDir . '/test_write_' . time() . '.txt';
$writeTest = false;

try {
    $testFileContent = "This is a test file created at " . date('Y-m-d H:i:s');
    $writeTest = file_put_contents($testFilePath, $testFileContent) !== false;
    
    // Clean up test file if successfully written
    if ($writeTest) {
        unlink($testFilePath);
    }
    
    $tests[] = [
        'name' => 'File Write Permission',
        'passed' => $writeTest,
        'message' => $writeTest 
            ? "Successfully wrote and deleted test file" 
            : "Failed to write test file. Check directory permissions."
    ];
} catch (Exception $e) {
    $tests[] = [
        'name' => 'File Write Permission',
        'passed' => false,
        'message' => "Error testing file write: " . $e->getMessage()
    ];
}
$allPassed = $allPassed && $writeTest;

// Prepare the final response
$response = [
    'success' => $allPassed,
    'message' => $allPassed 
        ? "All tests passed! The API is ready to use." 
        : "Some tests failed. Please fix the issues before using the API.",
    'tests' => $tests,
    'system_info' => [
        'php_version' => PHP_VERSION,
        'server_software' => $_SERVER['SERVER_SOFTWARE'] ?? 'Unknown',
        'os' => PHP_OS,
        'max_upload_size' => ini_get('upload_max_filesize'),
        'max_post_size' => ini_get('post_max_size'),
        'time' => date('Y-m-d H:i:s'),
    ]
];

// Output the response
echo json_encode($response, JSON_PRETTY_PRINT);
`);

  // API receive endpoint
  zip.file("api/receive.php", `<?php
require_once '../config.php';

// Only allow POST requests
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    sendJsonResponse(false, 'Method not allowed', null, 405);
}

// Get API key from header or query parameter
$apiKey = null;
if (isset($_SERVER['HTTP_X_API_KEY'])) {
    $apiKey = $_SERVER['HTTP_X_API_KEY'];
} elseif (isset($_GET['api_key'])) {
    $apiKey = $_GET['api_key'];
}

// Verify API key
if (!$apiKey || !verifyApiKey($apiKey)) {
    sendJsonResponse(false, 'Invalid or missing API key', null, 401);
}

// Get request body
$requestBody = file_get_contents('php://input');
$data = json_decode($requestBody, true);

// If no data was provided or couldn't be parsed
if ($data === null) {
    sendJsonResponse(false, 'Invalid JSON data', null, 400);
}

// Validate required fields
if (!isset($data['timestamp'])) {
    $data['timestamp'] = date('Y-m-d H:i:s');
}

// Process and store the data
try {
    $conn = getDbConnection();
    
    // Get source ID from API key
    $stmt = $conn->prepare("SELECT id FROM sources WHERE api_key = :api_key");
    $stmt->bindParam(':api_key', $apiKey);
    $stmt->execute();
    $source = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$source) {
        sendJsonResponse(false, 'Source not found for API key', null, 401);
    }
    
    // Generate UUID for the data entry
    $id = generateUuid();
    $sourceId = $source['id'];
    $timestamp = $data['timestamp'];
    $sensorId = isset($data['sensorId']) ? $data['sensorId'] : null;
    $dataJson = json_encode($data);
    
    // Insert into database
    $stmt = $conn->prepare("
        INSERT INTO data_entries (id, source_id, timestamp, sensor_id, data_json)
        VALUES (:id, :source_id, :timestamp, :sensor_id, :data_json)
    ");
    
    $stmt->bindParam(':id', $id);
    $stmt->bindParam(':source_id', $sourceId);
    $stmt->bindParam(':timestamp', $timestamp);
    $stmt->bindParam(':sensor_id', $sensorId);
    $stmt->bindParam(':data_json', $dataJson);
    $stmt->execute();
    
    sendJsonResponse(true, 'Data received successfully', ['id' => $id]);
} catch(PDOException $e) {
    if ($config['api']['debug_mode']) {
        sendJsonResponse(false, 'Database error: ' . $e->getMessage(), null, 500);
    } else {
        error_log("Data insertion error: " . $e->getMessage());
        sendJsonResponse(false, 'An error occurred while storing data', null, 500);
    }
}

// Generate UUID v4
function generateUuid() {
    return sprintf('%04x%04x-%04x-%04x-%04x-%04x%04x%04x',
        mt_rand(0, 0xffff), mt_rand(0, 0xffff),
        mt_rand(0, 0xffff),
        mt_rand(0, 0x0fff) | 0x4000,
        mt_rand(0, 0x3fff) | 0x8000,
        mt_rand(0, 0xffff), mt_rand(0, 0xffff), mt_rand(0, 0xffff)
    );
}
`);

  // API export endpoint
  zip.file("api/export.php", `<?php
require_once '../config.php';

// Check if this is a CLI request or has the right authorization
$isCli = php_sapi_name() == 'cli';
$isAuthorized = false;

if (!$isCli) {
    // For web requests, check authorization
    // Get API key from header or query parameter
    $apiKey = null;
    if (isset($_SERVER['HTTP_X_API_KEY'])) {
        $apiKey = $_SERVER['HTTP_X_API_KEY'];
    } elseif (isset($_GET['api_key'])) {
        $apiKey = $_GET['api_key'];
    }
    
    // Verify API key
    $isAuthorized = $apiKey && verifyApiKey($apiKey);
    
    if (!$isAuthorized) {
        sendJsonResponse(false, 'Unauthorized', null, 401);
    }
}

// Get the date range to export
$date = isset($_GET['date']) ? $_GET['date'] : date('Y-m-d');
$startDate = $date . ' 00:00:00';
$endDate = $date . ' 23:59:59';

try {
    $conn = getDbConnection();
    
    // Get all sources
    $stmt = $conn->query("SELECT id, name FROM sources");
    $sources = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    if (empty($sources)) {
        sendJsonResponse(false, 'No sources found', null, 404);
    }
    
    $results = [];
    
    // Export data for each source
    foreach ($sources as $source) {
        $sourceId = $source['id'];
        $sourceName = $source['name'];
        $filename = sanitizeFilename($sourceName) . '_' . date('Ymd', strtotime($date)) . '.csv';
        $filePath = $config['export']['export_dir'] . $filename;
        
        // Get data for this source within the date range
        $stmt = $conn->prepare("
            SELECT *
            FROM data_entries
            WHERE source_id = :source_id
            AND timestamp BETWEEN :start_date AND :end_date
            ORDER BY timestamp ASC
        ");
        
        $stmt->bindParam(':source_id', $sourceId);
        $stmt->bindParam(':start_date', $startDate);
        $stmt->bindParam(':end_date', $endDate);
        $stmt->execute();
        
        $entries = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        if (empty($entries)) {
            $results[] = [
                'source' => $sourceName,
                'filename' => $filename,
                'status' => 'skipped',
                'message' => 'No data available for this date'
            ];
            continue;
        }
        
        // Create CSV file
        $fp = fopen($filePath, 'w');
        
        if (!$fp) {
            $results[] = [
                'source' => $sourceName,
                'filename' => $filename,
                'status' => 'error',
                'message' => 'Could not create CSV file'
            ];
            continue;
        }
        
        // Get headers from the first entry's JSON data
        $firstEntry = $entries[0];
        $firstData = json_decode($firstEntry['data_json'], true);
        $headers = array_keys($firstData);
        
        // Add metadata headers
        array_unshift($headers, 'id', 'timestamp', 'source_id', 'sensor_id');
        
        // Write headers
        fputcsv($fp, $headers);
        
        // Write data rows
        foreach ($entries as $entry) {
            $rowData = json_decode($entry['data_json'], true);
            $row = [];
            
            // Add metadata fields
            $row[] = $entry['id'];
            $row[] = $entry['timestamp'];
            $row[] = $entry['source_id'];
            $row[] = $entry['sensor_id'];
            
            // Add data fields in the same order as headers
            foreach (array_slice($headers, 4) as $header) {
                $row[] = isset($rowData[$header]) ? $rowData[$header] : '';
            }
            
            fputcsv($fp, $row);
        }
        
        fclose($fp);
        
        // Upload to Dropbox if token is configured
        $dropboxStatus = 'not_configured';
        $dropboxMessage = 'Dropbox upload not configured';
        
        if (!empty($config['export']['dropbox_token'])) {
            // Call function to upload to Dropbox
            $dropboxResult = uploadToDropbox($filePath, $filename);
            $dropboxStatus = $dropboxResult['success'] ? 'success' : 'error';
            $dropboxMessage = $dropboxResult['message'];
        }
        
        $results[] = [
            'source' => $sourceName,
            'filename' => $filename,
            'records' => count($entries),
            'file_size' => filesize($filePath),
            'status' => 'success',
            'message' => 'CSV file created successfully',
            'dropbox' => [
                'status' => $dropboxStatus,
                'message' => $dropboxMessage
            ]
        ];
    }
    
    sendJsonResponse(true, 'Export completed', [
        'date' => $date,
        'sources' => $results
    ]);
} catch(PDOException $e) {
    if ($config['api']['debug_mode']) {
        sendJsonResponse(false, 'Database error: ' . $e->getMessage(), null, 500);
    } else {
        error_log("Export error: " . $e->getMessage());
        sendJsonResponse(false, 'An error occurred during export', null, 500);
    }
}

// Helper function to sanitize filenames
function sanitizeFilename($filename) {
    // Remove special characters
    $filename = preg_replace('/[^\w\.-]/', '_', $filename);
    // Remove multiple underscores
    $filename = preg_replace('/_+/', '_', $filename);
    return $filename;
}

// Function to upload file to Dropbox
function uploadToDropbox($filePath, $filename) {
    global $config;
    
    if (empty($config['export']['dropbox_token'])) {
        return [
            'success' => false,
            'message' => 'Dropbox token not configured'
        ];
    }
    
    $token = $config['export']['dropbox_token'];
    $targetPath = '/' . $filename;
    
    // Read file content
    $fileContent = file_get_contents($filePath);
    if ($fileContent === false) {
        return [
            'success' => false,
            'message' => 'Could not read file for upload'
        ];
    }
    
    // Set up curl request
    $ch = curl_init('https://content.dropboxapi.com/2/files/upload');
    
    $dropboxApiArg = json_encode([
        'path' => $targetPath,
        'mode' => 'add',
        'autorename' => true,
        'mute' => false
    ]);
    
    // Set curl options
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, $fileContent);
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Authorization: Bearer ' . $token,
        'Content-Type: application/octet-stream',
        'Dropbox-API-Arg: ' . $dropboxApiArg
    ]);
    
    // Execute request
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    
    curl_close($ch);
    
    if ($httpCode == 200) {
        $responseData = json_decode($response, true);
        return [
            'success' => true,
            'message' => 'File uploaded to Dropbox successfully',
            'path' => $responseData['path_display'] ?? $targetPath
        ];
    } else {
        error_log("Dropbox upload error: $response");
        return [
            'success' => false,
            'message' => 'Failed to upload to Dropbox: HTTP code ' . $httpCode
        ];
    }
}
`);

  // Add phpinfo file for debugging
  zip.file("phpinfo.php", `<?php
// Display PHP configuration
phpinfo();
`);

  // Add .htaccess for API security
  zip.file(".htaccess", `# Prevent directory listing
Options -Indexes

# Set default character set
AddDefaultCharset UTF-8

# Enable Apache rewrite engine
<IfModule mod_rewrite.c>
  RewriteEngine On
  
  # Redirect requests to index.php if the requested file does not exist
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule ^(.*)$ index.php [QSA,L]
</IfModule>

# Set security headers
<IfModule mod_headers.c>
  # Prevent MIME type sniffing
  Header set X-Content-Type-Options "nosniff"
  
  # Enable XSS protection in browsers
  Header set X-XSS-Protection "1; mode=block"
  
  # Prevent clickjacking
  Header set X-Frame-Options "SAMEORIGIN"
</IfModule>

# Control access to sensitive files
<FilesMatch "^(config\.php|\.htaccess|\.git)">
  Order Allow,Deny
  Deny from all
</FilesMatch>

# Allow access to specific PHP files
<FilesMatch "^(index\.php|install\.php|api/.*\.php|phpinfo\.php)$">
  Order Allow,Deny
  Allow from all
</FilesMatch>
`);

  // Generate the zip file and trigger download
  const content = await zip.generateAsync({ type: "blob" });
  saveAs(content, "csv-consolidator-api.zip");
};
