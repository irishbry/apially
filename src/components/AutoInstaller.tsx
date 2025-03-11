
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Download, Server, FileCode, CheckSquare, FileText, AlertTriangle, ArrowRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import JSZip from 'jszip';
import FileSaver from 'file-saver';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { createInstallerPHP, createReadme } from '@/utils/installerTemplates';

const AutoInstaller: React.FC = () => {
  const [isDownloading, setIsDownloading] = useState(false);
  const { toast } = useToast();

  const handleDownload = async () => {
    setIsDownloading(true);
    
    try {
      const zip = new JSZip();
      
      // Create directory structure
      const srcDir = zip.folder("src");
      const componentsDir = srcDir.folder("components");
      const pagesDir = srcDir.folder("pages");
      const hooksDir = srcDir.folder("hooks");
      const uiDir = componentsDir.folder("ui");
      const utilsDir = srcDir.folder("utils");
      const publicDir = zip.folder("public");
      const apiDir = publicDir.folder("api");
      const dataDir = apiDir.folder("data");
      const endpointsDir = apiDir.folder("endpoints");
      const apiUtilsDir = apiDir.folder("utils");
      
      // Add PHP installation file
      zip.file("install.php", createInstallerPHP());
      
      // Add README
      zip.file("README.md", createReadme());
      
      // Add package.json
      zip.file("package.json", `{
  "name": "data-consolidation-tool",
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
    "@radix-ui/react-alert-dialog": "^1.0.5",
    "@radix-ui/react-avatar": "^1.0.4",
    "@radix-ui/react-dialog": "^1.0.5",
    "@radix-ui/react-dropdown-menu": "^2.0.6",
    "@radix-ui/react-label": "^2.0.2",
    "@radix-ui/react-select": "^2.0.0",
    "@radix-ui/react-separator": "^1.0.3",
    "@radix-ui/react-slot": "^1.0.2",
    "@radix-ui/react-tabs": "^1.0.4",
    "@radix-ui/react-toast": "^1.1.5",
    "@tanstack/react-query": "^4.32.6",
    "class-variance-authority": "^0.7.0",
    "clsx": "^2.0.0",
    "lucide-react": "^0.279.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-hook-form": "^7.46.1",
    "react-router-dom": "^6.16.0",
    "tailwind-merge": "^1.14.0",
    "tailwindcss-animate": "^1.0.7",
    "zod": "^3.22.2"
  },
  "devDependencies": {
    "@types/node": "^20.6.3",
    "@types/react": "^18.2.15",
    "@types/react-dom": "^18.2.7",
    "@typescript-eslint/eslint-plugin": "^6.0.0",
    "@typescript-eslint/parser": "^6.0.0",
    "@vitejs/plugin-react": "^4.0.3",
    "autoprefixer": "^10.4.15",
    "eslint": "^8.45.0",
    "eslint-plugin-react-hooks": "^4.6.0",
    "eslint-plugin-react-refresh": "^0.4.3",
    "postcss": "^8.4.30",
    "tailwindcss": "^3.3.3",
    "typescript": "^5.0.2",
    "vite": "^4.4.5"
  }
}`);
      
      // Add index.html
      zip.file("index.html", `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Data Consolidation Tool</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>`);

      // Add vite.config.ts
      zip.file("vite.config.ts", `import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:80',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\\/api/, '')
      }
    }
  }
})`);

      // Add tailwind.config.js
      zip.file("tailwind.config.js", `/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
	],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: 0 },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: 0 },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}`);

      // Add tsconfig.json
      zip.file("tsconfig.json", `{
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
}`);

      // Add tsconfig.node.json
      zip.file("tsconfig.node.json", `{
  "compilerOptions": {
    "composite": true,
    "skipLibCheck": true,
    "module": "ESNext",
    "moduleResolution": "bundler",
    "allowSyntheticDefaultImports": true
  },
  "include": ["vite.config.ts"]
}`);

      // Add postcss.config.js
      zip.file("postcss.config.js", `export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}`);

      // Add main.tsx
      srcDir.file("main.tsx", `import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import App from './App.tsx'
import './index.css'

const queryClient = new QueryClient()

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </QueryClientProvider>
  </React.StrictMode>,
)`);

      // Add App.tsx
      srcDir.file("App.tsx", `import { Routes, Route } from 'react-router-dom'
import { Toaster } from './components/ui/toaster'
import Home from './pages/Home'
import NotFound from './pages/NotFound'
import Layout from './components/Layout'
import SourcesManager from './components/SourcesManager'
import DataViewer from './components/DataViewer'

function App() {
  return (
    <>
      <Toaster />
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="sources" element={<SourcesManager />} />
          <Route path="data" element={<DataViewer />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </>
  )
}

export default App`);

      // Add index.css
      srcDir.file("index.css", `@tailwind base;
@tailwind components;
@tailwind utilities;
 
@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 222.2 84% 4.9%;

    --card: 0 0% 100%;
    --card-foreground: 222.2 84% 4.9%;
 
    --popover: 0 0% 100%;
    --popover-foreground: 222.2 84% 4.9%;
 
    --primary: 222.2 47.4% 11.2%;
    --primary-foreground: 210 40% 98%;
 
    --secondary: 210 40% 96.1%;
    --secondary-foreground: 222.2 47.4% 11.2%;
 
    --muted: 210 40% 96.1%;
    --muted-foreground: 215.4 16.3% 46.9%;
 
    --accent: 210 40% 96.1%;
    --accent-foreground: 222.2 47.4% 11.2%;
 
    --destructive: 0 84.2% 60.2%;
    --destructive-foreground: 210 40% 98%;

    --border: 214.3 31.8% 91.4%;
    --input: 214.3 31.8% 91.4%;
    --ring: 222.2 84% 4.9%;
 
    --radius: 0.5rem;
  }
 
  .dark {
    --background: 222.2 84% 4.9%;
    --foreground: 210 40% 98%;
 
    --card: 222.2 84% 4.9%;
    --card-foreground: 210 40% 98%;
 
    --popover: 222.2 84% 4.9%;
    --popover-foreground: 210 40% 98%;
 
    --primary: 210 40% 98%;
    --primary-foreground: 222.2 47.4% 11.2%;
 
    --secondary: 217.2 32.6% 17.5%;
    --secondary-foreground: 210 40% 98%;
 
    --muted: 217.2 32.6% 17.5%;
    --muted-foreground: 215 20.2% 65.1%;
 
    --accent: 217.2 32.6% 17.5%;
    --accent-foreground: 210 40% 98%;
 
    --destructive: 0 62.8% 30.6%;
    --destructive-foreground: 210 40% 98%;
 
    --border: 217.2 32.6% 17.5%;
    --input: 217.2 32.6% 17.5%;
    --ring: 212.7 26.8% 83.9%;
  }
}
 
@layer base {
  * {
    @apply border-border;
  }
  body {
    @apply bg-background text-foreground;
  }
}`);

      // Add components
      componentsDir.file("Layout.tsx", `import { Outlet } from 'react-router-dom'
import Navbar from './Navbar'

export default function Layout() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-8">
        <Outlet />
      </main>
      <footer className="py-4 bg-slate-100">
        <div className="container mx-auto px-4 text-center text-sm text-gray-500">
          Data Consolidation Tool © {new Date().getFullYear()}
        </div>
      </footer>
    </div>
  )
}`);

      componentsDir.file("Navbar.tsx", `import { Link } from 'react-router-dom'
import { Database, Home, Settings } from 'lucide-react'

export default function Navbar() {
  return (
    <nav className="bg-white shadow-sm">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-8">
            <Link to="/" className="text-xl font-bold text-primary flex items-center gap-2">
              <Database className="h-6 w-6" />
              <span>Data Tool</span>
            </Link>
            <div className="hidden md:flex md:items-center md:gap-4">
              <Link to="/" className="px-3 py-2 rounded-md text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50">
                Home
              </Link>
              <Link to="/sources" className="px-3 py-2 rounded-md text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50">
                Sources
              </Link>
              <Link to="/data" className="px-3 py-2 rounded-md text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50">
                Data
              </Link>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <a href="/api/status" target="_blank" className="text-sm text-gray-500 hover:text-gray-700">
              API Status
            </a>
          </div>
        </div>
      </div>
    </nav>
  )
}`);

      componentsDir.file("SourcesManager.tsx", `import { useState } from 'react'
import { useToast } from '@/hooks/use-toast'
import { Button } from './ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './ui/card'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { Plus, RefreshCw, Trash2 } from 'lucide-react'

type Source = {
  id: string;
  name: string;
  type: string;
  url: string;
  dateAdded: string;
}

export default function SourcesManager() {
  const { toast } = useToast()
  const [sources, setSources] = useState<Source[]>([
    {
      id: '1',
      name: 'Sales Data',
      type: 'csv',
      url: 'https://example.com/sales.csv',
      dateAdded: new Date().toISOString()
    }
  ])
  const [isAddSourceOpen, setIsAddSourceOpen] = useState(false)
  const [newSource, setNewSource] = useState({
    name: '',
    type: 'csv',
    url: ''
  })
  
  const handleAddSource = () => {
    if (!newSource.name || !newSource.url) {
      toast({
        title: "Missing information",
        description: "Please fill in all required fields",
        variant: "destructive"
      })
      return
    }
    
    const source: Source = {
      id: Date.now().toString(),
      name: newSource.name,
      type: newSource.type,
      url: newSource.url,
      dateAdded: new Date().toISOString()
    }
    
    setSources([...sources, source])
    setNewSource({ name: '', type: 'csv', url: '' })
    setIsAddSourceOpen(false)
    
    toast({
      title: "Source added",
      description: \`\${source.name} has been added to your sources\`
    })
  }
  
  const handleDeleteSource = (id: string) => {
    setSources(sources.filter(source => source.id !== id))
    toast({
      title: "Source deleted",
      description: "The source has been removed from your list"
    })
  }
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Data Sources</h1>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Dialog open={isAddSourceOpen} onOpenChange={setIsAddSourceOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Source
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Data Source</DialogTitle>
                <DialogDescription>
                  Add a new data source to consolidate with your existing data.
                </DialogDescription>
              </DialogHeader>
              
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Source Name</Label>
                  <Input 
                    id="name" 
                    value={newSource.name}
                    onChange={(e) => setNewSource({...newSource, name: e.target.value})}
                    placeholder="e.g., Sales Data" 
                  />
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="url">Source URL</Label>
                  <Input 
                    id="url" 
                    value={newSource.url}
                    onChange={(e) => setNewSource({...newSource, url: e.target.value})}
                    placeholder="https://example.com/data.csv" 
                  />
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="type">Source Type</Label>
                  <Select 
                    value={newSource.type}
                    onValueChange={(value) => setNewSource({...newSource, type: value})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="csv">CSV</SelectItem>
                      <SelectItem value="json">JSON</SelectItem>
                      <SelectItem value="api">API Endpoint</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddSourceOpen(false)}>Cancel</Button>
                <Button onClick={handleAddSource}>Add Source</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {sources.map(source => (
          <Card key={source.id}>
            <CardHeader>
              <CardTitle>{source.name}</CardTitle>
              <CardDescription>Added on {new Date(source.dateAdded).toLocaleDateString()}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="text-sm">
                  <span className="font-medium">Type:</span> {source.type.toUpperCase()}
                </div>
                <div className="text-sm break-all">
                  <span className="font-medium">URL:</span> {source.url}
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline" size="sm">
                View Data
              </Button>
              <Button variant="destructive" size="sm" onClick={() => handleDeleteSource(source.id)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
      
      {sources.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No data sources added yet.</p>
          <p className="text-muted-foreground">Click "Add Source" to get started.</p>
        </div>
      )}
    </div>
  )
}`);

      componentsDir.file("DataViewer.tsx", `import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

const data = [
  {
    name: 'Jan',
    value: 2400,
  },
  {
    name: 'Feb',
    value: 1398,
  },
  {
    name: 'Mar',
    value: 9800,
  },
  {
    name: 'Apr',
    value: 3908,
  },
  {
    name: 'May',
    value: 4800,
  },
  {
    name: 'Jun',
    value: 3800,
  },
];

export default function DataViewer() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Data Visualization</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Monthly Data</CardTitle>
            <CardDescription>Sample visualization of monthly data</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={data}
                  margin={{
                    top: 20,
                    right: 30,
                    left: 20,
                    bottom: 5,
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Data Statistics</CardTitle>
            <CardDescription>Summary of your consolidated data</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-100 p-4 rounded-lg">
                  <p className="text-sm text-muted-foreground">Total Records</p>
                  <p className="text-2xl font-bold">4,238</p>
                </div>
                <div className="bg-slate-100 p-4 rounded-lg">
                  <p className="text-sm text-muted-foreground">Sources</p>
                  <p className="text-2xl font-bold">3</p>
                </div>
                <div className="bg-slate-100 p-4 rounded-lg">
                  <p className="text-sm text-muted-foreground">Last Updated</p>
                  <p className="text-2xl font-bold">Today</p>
                </div>
                <div className="bg-slate-100 p-4 rounded-lg">
                  <p className="text-sm text-muted-foreground">Data Size</p>
                  <p className="text-2xl font-bold">1.2 MB</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}`);

      // Add UI components
      uiDir.file("button.tsx", `import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline:
          "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }`);

      uiDir.file("card.tsx", `import * as React from "react"

import { cn } from "@/lib/utils"

const Card = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "rounded-lg border bg-card text-card-foreground shadow-sm",
      className
    )}
    {...props}
  />
))
Card.displayName = "Card"

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1.5 p-6", className)}
    {...props}
  />
))
CardHeader.displayName = "CardHeader"

const CardTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn(
      "text-2xl font-semibold leading-none tracking-tight",
      className
    )}
    {...props}
  />
))
CardTitle.displayName = "CardTitle"

const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
))
CardDescription.displayName = "CardDescription"

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
))
CardContent.displayName = "CardContent"

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center p-6 pt-0", className)}
    {...props}
  />
))
CardFooter.displayName = "CardFooter"

export { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter }`);

      uiDir.file("dialog.tsx", `import * as React from "react"
import * as DialogPrimitive from "@radix-ui/react-dialog"
import { X } from "lucide-react"

import { cn } from "@/lib/utils"

const Dialog = DialogPrimitive.Root

const DialogTrigger = DialogPrimitive.Trigger

const DialogPortal = DialogPrimitive.Portal

const DialogClose = DialogPrimitive.Close

const DialogOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn(
      "fixed inset-0 z-50 bg-black/80 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
      className
    )}
    {...props}
  />
))
DialogOverlay.displayName = DialogPrimitive.Overlay.displayName

const DialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>
>(({ className, children, ...props }, ref) => (
  <DialogPortal>
    <DialogOverlay />
    <DialogPrimitive.Content
      ref={ref}
      className={cn(
        "fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-lg",
        className
      )}
      {...props}
    >
      {children}
      <DialogPrimitive.Close className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground">
        <X className="h-4 w-4" />
        <span className="sr-only">Close</span>
      </DialogPrimitive.Close>
    </DialogPrimitive.Content>
  </DialogPortal>
))
DialogContent.displayName = DialogPrimitive.Content.displayName

const DialogHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col space-y-1.5 text-center sm:text-left",
      className
    )}
    {...props}
  />
)
DialogHeader.displayName = "DialogHeader"

const DialogFooter = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2",
      className
    )}
    {...props}
  />
)
DialogFooter.displayName = "DialogFooter"

const DialogTitle = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn(
      "text-lg font-semibold leading-none tracking-tight",
      className
    )}
    {...props}
  />
))
DialogTitle.displayName = DialogPrimitive.Title.displayName

const DialogDescription = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
))
DialogDescription.displayName = DialogPrimitive.Description.displayName

export {
  Dialog,
  DialogPortal,
  DialogOverlay,
  DialogTrigger,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
}`);

      uiDir.file("input.tsx", `import * as React from "react"

import { cn } from "@/lib/utils"

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }`);

      uiDir.file("label.tsx", `import * as React from "react"
import * as LabelPrimitive from "@radix-ui/react-label"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const labelVariants = cva(
  "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
)

const Label = React.forwardRef<
  React.ElementRef<typeof LabelPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root> &
    VariantProps<typeof labelVariants>
>(({ className, ...props }, ref) => (
  <LabelPrimitive.Root
    ref={ref}
    className={cn(labelVariants(), className)}
    {...props}
  />
))
Label.displayName = LabelPrimitive.Root.displayName

export { Label }`);

      uiDir.file("select.tsx", `import * as React from "react"
import * as SelectPrimitive from "@radix-ui/react-select"
import { Check, ChevronDown, ChevronUp } from "lucide-react"

import { cn } from "@/lib/utils"

const Select = SelectPrimitive.Root

const SelectGroup = SelectPrimitive.Group

const SelectValue = SelectPrimitive.Value

const SelectTrigger = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Trigger>
>(({ className, children, ...props }, ref) => (
  <SelectPrimitive.Trigger
    ref={ref}
    className={cn(
      "flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 [&>span]:line-clamp-1",
      className
    )}
    {...props}
  >
    {children}
    <SelectPrimitive.Icon asChild>
      <ChevronDown className="h-4 w-4 opacity-50" />
    </SelectPrimitive.Icon>
  </SelectPrimitive.Trigger>
))
SelectTrigger.displayName = SelectPrimitive.Trigger.displayName

const SelectScrollUpButton = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.ScrollUpButton>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.ScrollUpButton>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.ScrollUpButton
    ref={ref}
    className={cn(
      "flex cursor-default items-center justify-center py-1",
      className
    )}
    {...props}
  >
    <ChevronUp className="h-4 w-4" />
  </SelectPrimitive.ScrollUpButton>
))
SelectScrollUpButton.displayName = SelectPrimitive.ScrollUpButton.displayName

const SelectScrollDownButton = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.ScrollDownButton>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.ScrollDownButton>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.ScrollDownButton
    ref={ref}
    className={cn(
      "flex cursor-default items-center justify-center py-1",
      className
    )}
    {...props}
  >
    <ChevronDown className="h-4 w-4" />
  </SelectPrimitive.ScrollDownButton>
))
SelectScrollDownButton.displayName =
  SelectPrimitive.ScrollDownButton.displayName

const SelectContent = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Content>
>(({ className, children, position = "popper", ...props }, ref) => (
  <SelectPrimitive.Portal>
    <SelectPrimitive.Content
      ref={ref}
      className={cn(
        "relative z-50 max-h-96 min-w-[8rem] overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-md data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
        position === "popper" &&
          "data-[side=bottom]:translate-y-1 data-[side=left]:-translate-x-1 data-[side=right]:translate-x-1 data-[side=top]:-translate-y-1",
        className
      )}
      position={position}
      {...props}
    >
      <SelectScrollUpButton />
      <SelectPrimitive.Viewport
        className={cn(
          "p-1",
          position === "popper" &&
            "h-[var(--radix-select-trigger-height)] w-full min-w-[var(--radix-select-trigger-width)]"
        )}
      >
        {children}
      </SelectPrimitive.Viewport>
      <SelectScrollDownButton />
    </SelectPrimitive.Content>
  </SelectPrimitive.Portal>
))
SelectContent.displayName = SelectPrimitive.Content.displayName

const SelectLabel = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Label>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Label>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.Label
    ref={ref}
    className={cn("py-1.5 pl-8 pr-2 text-sm font-semibold", className)}
    {...props}
  />
))
SelectLabel.displayName = SelectPrimitive.Label.displayName

const SelectItem = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Item>
>(({ className, children, ...props }, ref) => (
  <SelectPrimitive.Item
    ref={ref}
    className={cn(
      "relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
      className
    )}
    {...props}
  >
    <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
      <SelectPrimitive.ItemIndicator>
        <Check className="h-4 w-4" />
      </SelectPrimitive.ItemIndicator>
    </span>

    <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
  </SelectPrimitive.Item>
))
SelectItem.displayName = SelectPrimitive.Item.displayName

const SelectSeparator = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Separator>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Separator>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.Separator
    ref={ref}
    className={cn("-mx-1 my-1 h-px bg-muted", className)}
    {...props}
  />
))
SelectSeparator.displayName = SelectPrimitive.Separator.displayName

export {
  Select,
  SelectGroup,
  SelectValue,
  SelectTrigger,
  SelectContent,
  SelectLabel,
  SelectItem,
  SelectSeparator,
  SelectScrollUpButton,
  SelectScrollDownButton,
}`);

      uiDir.file("toaster.tsx", `import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast"
import { useToast } from "@/hooks/use-toast"

export function Toaster() {
  const { toasts } = useToast()

  return (
    <ToastProvider>
      {toasts.map(function ({ id, title, description, action, ...props }) {
        return (
          <Toast key={id} {...props}>
            <div className="grid gap-1">
              {title && <ToastTitle>{title}</ToastTitle>}
              {description && (
                <ToastDescription>{description}</ToastDescription>
              )}
            </div>
            {action}
            <ToastClose />
          </Toast>
        )
      })}
      <ToastViewport />
    </ToastProvider>
  )
}`);

      uiDir.file("toast.tsx", `import * as React from "react"
import * as ToastPrimitives from "@radix-ui/react-toast"
import { cva, type VariantProps } from "class-variance-authority"
import { X } from "lucide-react"

import { cn } from "@/lib/utils"

const ToastProvider = ToastPrimitives.Provider

const ToastViewport = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Viewport>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Viewport>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Viewport
    ref={ref}
    className={cn(
      "fixed top-0 z-[100] flex max-h-screen w-full flex-col-reverse p-4 sm:bottom-0 sm:right-0 sm:top-auto sm:flex-col md:max-w-[420px]",
      className
    )}
    {...props}
  />
))
ToastViewport.displayName = ToastPrimitives.Viewport.displayName

const toastVariants = cva(
  "group pointer-events-auto relative flex w-full items-center justify-between space-x-4 overflow-hidden rounded-md border p-6 pr-8 shadow-lg transition-all data-[swipe=cancel]:translate-x-0 data-[swipe=end]:translate-x-[var(--radix-toast-swipe-end-x)] data-[swipe=move]:translate-x-[var(--radix-toast-swipe-move-x)] data-[swipe=move]:transition-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[swipe=end]:animate-out data-[state=closed]:fade-out-80 data-[state=closed]:slide-out-to-right-full data-[state=open]:slide-in-from-top-full data-[state=open]:sm:slide-in-from-bottom-full",
  {
    variants: {
      variant: {
        default: "border bg-background text-foreground",
        destructive:
          "destructive group border-destructive bg-destructive text-destructive-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

const Toast = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Root>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Root> &
    VariantProps<typeof toastVariants>
>(({ className, variant, ...props }, ref) => {
  return (
    <ToastPrimitives.Root
      ref={ref}
      className={cn(toastVariants({ variant }), className)}
      {...props}
    />
  )
})
Toast.displayName = ToastPrimitives.Root.displayName

const ToastAction = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Action>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Action>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Action
    ref={ref}
    className={cn(
      "inline-flex h-8 shrink-0 items-center justify-center rounded-md border bg-transparent px-3 text-sm font-medium ring-offset-background transition-colors hover:bg-secondary focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 group-[.destructive]:border-muted/40 group-[.destructive]:hover:border-destructive/30 group-[.destructive]:hover:bg-destructive group-[.destructive]:hover:text-destructive-foreground group-[.destructive]:focus:ring-destructive",
      className
    )}
    {...props}
  />
))
ToastAction.displayName = ToastPrimitives.Action.displayName

const ToastClose = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Close>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Close>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Close
    ref={ref}
    className={cn(
      "absolute right-2 top-2 rounded-md p-1 text-foreground/50 opacity-0 transition-opacity hover:text-foreground focus:opacity-100 focus:outline-none focus:ring-2 group-hover:opacity-100 group-[.destructive]:text-red-300 group-[.destructive]:hover:text-red-50 group-[.destructive]:focus:ring-red-400 group-[.destructive]:focus:ring-offset-red-600",
      className
    )}
    toast-close=""
    {...props}
  >
    <X className="h-4 w-4" />
  </ToastPrimitives.Close>
))
ToastClose.displayName = ToastPrimitives.Close.displayName

const ToastTitle = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Title>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Title>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Title
    ref={ref}
    className={cn("text-sm font-semibold", className)}
    {...props}
  />
))
ToastTitle.displayName = ToastPrimitives.Title.displayName

const ToastDescription = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Description>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Description>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Description
    ref={ref}
    className={cn("text-sm opacity-90", className)}
    {...props}
  />
))
ToastDescription.displayName = ToastPrimitives.Description.displayName

type ToastProps = React.ComponentPropsWithoutRef<typeof Toast>

type ToastActionElement = React.ReactElement<typeof ToastAction>

export {
  type ToastProps,
  type ToastActionElement,
  ToastProvider,
  ToastViewport,
  Toast,
  ToastTitle,
  ToastDescription,
  ToastClose,
  ToastAction,
}`);

      // Add pages
      pagesDir.file("Home.tsx", `import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function Home() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col items-center text-center">
        <h1 className="text-3xl font-bold">Welcome to Data Consolidation Tool</h1>
        <p className="text-muted-foreground">
          Easily collect, consolidate, and visualize data from multiple sources
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Collect Data</CardTitle>
            <CardDescription>Connect to multiple data sources</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Import data from CSV files, APIs, databases, and more. Automatically 
              schedule refreshes to keep your data up to date.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Consolidate</CardTitle>
            <CardDescription>Map and transform your data</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Define schemas to consolidate data from different sources into a unified 
              format. Apply transformations and validations as needed.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Visualize</CardTitle>
            <CardDescription>Create insights from your data</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Build charts, dashboards, and reports to visualize your consolidated 
              data. Share insights with your team or clients.
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="text-center mt-8">
        <p>
          This is a <strong>React-based</strong> implementation of the Data Consolidation Tool. 
          Get started by adding your first data source and defining your schema.
        </p>
      </div>
    </div>
  )
}`);

      pagesDir.file("NotFound.tsx", `import { Button } from '@/components/ui/button'
import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] text-center">
      <h1 className="text-6xl font-bold text-gray-900">404</h1>
      <h2 className="mt-4 text-2xl font-medium text-gray-700">Page Not Found</h2>
      <p className="mt-2 text-gray-500">
        Sorry, we couldn't find the page you're looking for.
      </p>
      <Link to="/">
        <Button className="mt-6">
          Go back home
        </Button>
      </Link>
    </div>
  )
}`);

      // Add hooks
      hooksDir.file("use-toast.ts", `import {
  Toast,
  ToastActionElement,
  ToastProps,
} from "@/components/ui/toast"
import {
  useCallback,
  useEffect,
  useState,
} from "react"

// Unique identifier for the toast
let count = 0
function generateId() {
  return \`toast-\${++count}\`
}

export type ToasterToast = ToastProps & {
  id: string
  title?: React.ReactNode
  description?: React.ReactNode
  action?: ToastActionElement
}

type ToastOptions = Omit<
  ToasterToast,
  "id"
>

export const useToast = () => {
  const [toasts, setToasts] = useState<ToasterToast[]>([])

  useEffect(() => {
    return () => {
      toasts.forEach((toast) => {
        window.clearTimeout(toast.timeoutId)
      })
    }
  }, [toasts])

  const dismiss = useCallback((toastId?: string) => {
    setToasts((prevToasts) => {
      if (toastId) {
        return prevToasts.filter((toast) => toast.id !== toastId)
      }

      return []
    })
  }, [])

  const toast = useCallback(
    ({ ...props }: ToastOptions) => {
      const id = generateId()
      const duration = props.duration || 5000

      const newToast = {
        ...props,
        id,
        onOpenChange: (open: boolean) => {
          if (!open) dismiss(id)
        },
      }

      setToasts((prevToasts) => [...prevToasts, newToast])

      setTimeout(() => {
        dismiss(id)
      }, duration)

      return newToast.id
    },
    [dismiss]
  )

  return {
    toast,
    dismiss,
    toasts,
  }
}`);

      // Add utils
      utilsDir.file("lib/utils.ts", `import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}`);

      // Add API files
      apiDir.file(".htaccess", `# Enable rewrite engine
RewriteEngine On

# Explicitly set the RewriteBase to match your installation directory
RewriteBase /api/

# If the request is for a real file or directory, skip rewrite rules
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d

# Rewrite all other URLs to index.php
RewriteRule ^(.*)$ index.php [QSA,L]

# Security headers
<IfModule mod_headers.c>
    # Prevent clickjacking
    Header set X-Frame-Options "SAMEORIGIN"
    
    # XSS protection
    Header set X-XSS-Protection "1; mode=block"
    
    # Content type protection
    Header set X-Content-Type-Options "nosniff"
    
    # CORS headers (make sure to update the domain)
    Header set Access-Control-Allow-Origin "*"
    Header set Access-Control-Allow-Methods "GET, POST, OPTIONS"
    Header set Access-Control-Allow-Headers "Content-Type, X-API-Key"
</IfModule>

# Protect sensitive files
<FilesMatch "^\.">
    Order allow,deny
    Deny from all
</FilesMatch>

# Protect data directory
<IfModule mod_rewrite.c>
    RewriteRule ^data/ - [F,L]
</IfModule>

# Disable directory listing
Options -Indexes

# PHP configuration
php_flag display_errors off
php_value error_reporting 0
php_flag log_errors on
php_value error_log "error_log.txt"
`);

      apiDir.file("index.php", `<?php
// Main API entry point
require_once 'utils/error_handler.php';
require_once 'config.php';
require_once 'utils/api_utils.php';
require_once 'endpoints/status_endpoint.php';
require_once 'endpoints/login_endpoint.php';
require_once 'endpoints/data_endpoint.php';
require_once 'endpoints/sources_endpoint.php';
require_once 'endpoints/schema_endpoint.php';
require_once 'endpoints/api_key_endpoint.php';

// Set content type and CORS headers
header('Content-Type: application/json');
setCorsHeaders();

// Check for actual path
$requestPath = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$basePath = dirname($_SERVER['SCRIPT_NAME']);
$endpoint = str_replace($basePath, '', $requestPath);
$endpoint = trim($endpoint, '/');

// Simple routing
try {
    switch ($endpoint) {
        case 'status':
            handleStatusEndpoint();
            break;
            
        case 'test':
            include 'test.php';
            break;
            
        case 'login':
            handleLoginEndpoint();
            break;
            
        case 'data':
            handleDataEndpoint();
            break;
            
        case 'sources':
            handleSourcesEndpoint();
            break;
            
        case 'schema':
            handleSchemaEndpoint();
            break;
            
        case 'api-key':
            handleApiKeyEndpoint();
            break;
            
        case '':
            echo json_encode([
                'name' => 'Data Consolidation API',
                'version' => '1.0.0',
                'endpoints' => ['/status', '/test', '/login', '/data', '/sources', '/schema', '/api-key']
            ]);
            break;
            
        default:
            header('HTTP/1.1 404 Not Found');
            echo json_encode(['error' => 'Endpoint not found']);
            logApiRequest($endpoint, 'error', 'Endpoint not found');
    }
} catch (Exception $e) {
    // Log the error and return a generic message
    logApiRequest($endpoint, 'error', $e->getMessage());
    header('HTTP/1.1 500 Internal Server Error');
    echo json_encode(['error' => 'An internal server error occurred']);
}
`);

      apiDir.file("config.php", `<?php
// Configuration settings
error_reporting(0);  // Disable error reporting in production
ini_set('display_errors', 0);  // Don't display errors to users

// Database configuration would go here if needed
$config = [
    // Allowed origins for CORS - update this with your production domain
    'allowed_origins' => ['https://yourdomain.com'], 
    
    // Path to data storage directory
    'storage_path' => __DIR__ . '/data',
    
    // API key for production (change this to a secure value)
    'api_key' => 'your-secure-api-key-here',
    
    // Production credentials (change these)
    'demo_user' => 'admin',
    'demo_password' => 'password'
];

// Create storage directory if it doesn't exist
if (!file_exists($config['storage_path'])) {
    mkdir($config['storage_path'], 0755, true);
}

// Helper function to log API requests
function logApiRequest($endpoint, $status, $message = '') {
    global $config;
    $logFile = $config['storage_path'] . '/api_log.txt';
    $timestamp = date('Y-m-d H:i:s');
    $logEntry = "[$timestamp] $endpoint - Status: $status" . ($message ? " - $message" : "") . PHP_EOL;
    file_put_contents($logFile, $logEntry, FILE_APPEND);
}

// Set CORS headers for production
function setCorsHeaders() {
    global $config;
    $origin = $_SERVER['HTTP_ORIGIN'] ?? '';
    
    // Only allow specified origins
    if (in_array($origin, $config['allowed_origins'])) {
        header("Access-Control-Allow-Origin: $origin");
        header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
        header('Access-Control-Allow-Headers: Content-Type, X-API-Key, Authorization');
        header('Access-Control-Max-Age: 86400'); // 24 hours cache
    }
    
    // Handle preflight requests
    if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
        http_response_code(200);
        exit(0);
    }
}

// Secure way to extract JSON request values
function getJsonRequestValue($data, $key, $default = null) {
    return isset($data[$key]) ? $data[$key] : $default;
}
`);

      // Add test.php
      apiDir.file("test.php", `<?php
// Test script for API
header("Content-Type: text/html; charset=utf-8");
?>
<!DOCTYPE html>
<html>
<head>
    <title>API Test</title>
    <style>
        body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
        h1 { color: #333; }
        .success { color: green; font-weight: bold; }
        .error { color: red; font-weight: bold; }
        .warning { color: orange; font-weight: bold; }
        .test { border: 1px solid #ddd; padding: 10px; margin-bottom: 10px; }
    </style>
</head>
<body>
    <h1>API Test</h1>
    
    <div class="test">
        <h3>PHP Version</h3>
        <p>Current version: <?php echo phpversion(); ?></p>
    </div>
    
    <div class="test">
        <h3>API Connectivity</h3>
        <?php
        // Test API connection
        $statusUrl = "./status";
        $ch = curl_init($statusUrl);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_HEADER, false);
        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);
        
        if ($httpCode === 200) {
            $data = json_decode($response, true);
            if ($data && isset($data["status"]) && $data["status"] === "ok") {
                echo "<p><span class=\"success\">Success!</span> API is responsive.</p>";
            } else {
                echo "<p><span class=\"error\">Error</span> API returned HTTP 200 but unexpected response format.</p>";
            }
        } else {
            echo "<p><span class=\"error\">Error</span> API is not responsive. HTTP code: " . $httpCode . "</p>";
        }
        ?>
    </div>
</body>
</html>
`);

      // Add endpoint files
      endpointsDir.file("status_endpoint.php", `<?php
// Status endpoint handler

function handleStatusEndpoint() {
    echo json_encode([
        'status' => 'ok',
        'version' => '1.0.0',
        'timestamp' => date('c')
    ]);
    logApiRequest('status', 'success');
}
`);

      endpointsDir.file("login_endpoint.php", `<?php
// Login endpoint handler

function handleLoginEndpoint() {
    global $config;
    
    // Set content type and CORS headers
    header('Content-Type: application/json');
    
    // Handle login request
    try {
        $input = file_get_contents('php://input');
        $data = json_decode($input, true);
        
        // Check if JSON was valid
        if ($data === null && json_last_error() !== JSON_ERROR_NONE) {
            logApiRequest('login', 'error', "Invalid JSON: " . json_last_error_msg());
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Invalid request format']);
            return;
        }
        
        $username = isset($data['username']) ? $data['username'] : '';
        $password = isset($data['password']) ? $data['password'] : '';
        
        // Validate credentials
        if ($username === $config['demo_user'] && $password === $config['demo_password']) {
            logApiRequest('login', 'success', "User: $username");
            echo json_encode(['success' => true, 'message' => 'Login successful']);
        } else {
            logApiRequest('login', 'failed', "Invalid credentials attempt: $username");
            http_response_code(401);
            echo json_encode(['success' => false, 'message' => 'Invalid username or password']);
        }
    } catch (Exception $e) {
        logApiRequest('login', 'error', "Exception: " . $e->getMessage());
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Server error occurred']);
    }
}
`);

      endpointsDir.file("data_endpoint.php", `<?php
// Data endpoint handler

function handleDataEndpoint() {
    global $config;
    
    // Handle data submission
    $apiKey = $_SERVER['HTTP_X_API_KEY'] ?? '';
    if (empty($apiKey)) {
        http_response_code(401);
        echo json_encode(['error' => 'API key is required']);
        logApiRequest('data', 'error', 'Missing API key');
        return;
    }
    
    // For demo, we'll accept any data with a valid structure
    $data = json_decode(file_get_contents('php://input'), true);
    if (json_last_error() !== JSON_ERROR_NONE) {
        http_response_code(400);
        echo json_encode(['error' => 'Invalid JSON format']);
        logApiRequest('data', 'error', 'Invalid JSON: ' . json_last_error_msg());
        return;
    }
    
    // Store the data (in a real app, you would do more processing here)
    $dataFile = $config['storage_path'] . '/data_' . date('Ymd_His') . '.json';
    file_put_contents($dataFile, json_encode($data, JSON_PRETTY_PRINT));
    
    logApiRequest('data', 'success', 'Data stored in ' . basename($dataFile));
    
    echo json_encode([
        'success' => true,
        'message' => 'Data received successfully',
        'data' => $data
    ]);
}
`);

      endpointsDir.file("sources_endpoint.php", `<?php
// Sources endpoint handler

function handleSourcesEndpoint() {
    global $config;
    
    // Handle sources data
    $method = $_SERVER['REQUEST_METHOD'];
    $sourcesFile = $config['storage_path'] . '/sources.json';
    
    // Get sources
    if ($method === 'GET') {
        $sources = [];
        if (file_exists($sourcesFile)) {
            $sources = json_decode(file_get_contents($sourcesFile), true);
        }
        echo json_encode(['sources' => $sources]);
        logApiRequest('sources', 'success', 'Retrieved sources list');
    } 
    // Add or update source
    else if ($method === 'POST') {
        $data = json_decode(file_get_contents('php://input'), true);
        
        if (!$data || !isset($data['name']) || !isset($data['url'])) {
            http_response_code(400);
            echo json_encode(['error' => 'Invalid request data']);
            logApiRequest('sources', 'error', 'Invalid source data');
            return;
        }
        
        // Get existing sources
        $sources = [];
        if (file_exists($sourcesFile)) {
            $sources = json_decode(file_get_contents($sourcesFile), true);
        }
        
        // Add the new source with unique ID
        $sources[] = [
            'id' => uniqid(),
            'name' => $data['name'],
            'url' => $data['url'],
            'type' => $data['type'] ?? 'csv',
            'dateAdded' => date('c')
        ];
        
        // Save updated sources
        file_put_contents($sourcesFile, json_encode($sources, JSON_PRETTY_PRINT));
        
        logApiRequest('sources', 'success', 'Added new source: ' . $data['name']);
        echo json_encode(['success' => true]);
    }
}
`);

      endpointsDir.file("schema_endpoint.php", `<?php
// Schema endpoint handler

function handleSchemaEndpoint() {
    global $config;
    
    // Handle schema management
    $method = $_SERVER['REQUEST_METHOD'];
    $schemaFile = $config['storage_path'] . '/schema.json';
    
    // Get schema
    if ($method === 'GET') {
        $schema = [];
        if (file_exists($schemaFile)) {
            $schema = json_decode(file_get_contents($schemaFile), true);
        }
        echo json_encode(['schema' => $schema]);
        logApiRequest('schema', 'success', 'Retrieved schema');
    } 
    // Update schema
    else if ($method === 'POST') {
        $data = json_decode(file_get_contents('php://input'), true);
        
        if (!$data) {
            http_response_code(400);
            echo json_encode(['error' => 'Invalid schema data']);
            logApiRequest('schema', 'error', 'Invalid schema data');
            return;
        }
        
        // Save schema
        file_put_contents($schemaFile, json_encode($data, JSON_PRETTY_PRINT));
        
        logApiRequest('schema', 'success', 'Updated schema');
        echo json_encode(['success' => true]);
    }
}
`);

      endpointsDir.file("api_key_endpoint.php", `<?php
// API Key endpoint handler

function handleApiKeyEndpoint() {
    // Update API key (would require authentication in production)
    $method = $_SERVER['REQUEST_METHOD'];
    
    if ($method === 'POST') {
        $data = json_decode(file_get_contents('php://input'), true);
        
        if (!$data || !isset($data['apiKey'])) {
            http_response_code(400);
            echo json_encode(['error' => 'Invalid API key data']);
            return;
        }
        
        // In a real app, you would update the API key in a secure way
        // For demo purposes, we'll just return success
        echo json_encode([
            'success' => true,
            'message' => 'API key updated successfully'
        ]);
        logApiRequest('api-key', 'success', 'API key updated');
    }
}
`);

      // Add API utility files
      apiUtilsDir.file("error_handler.php", `<?php
// Production error handler
function productionErrorHandler($errno, $errstr, $errfile, $errline) {
    // Log error details to file
    $errorLog = dirname(__DIR__) . '/logs/error.log';
    $timestamp = date('Y-m-d H:i:s');
    $errorMessage = "[$timestamp] Error ($errno): $errstr in $errfile on line $errline\n";
    error_log($errorMessage, 3, $errorLog);
    
    // Return a generic error message to the user
    header('Content-Type: application/json');
    http_response_code(500);
    echo json_encode(['error' => 'An internal server error occurred']);
    exit;
}

// Set the error handler
set_error_handler('productionErrorHandler');

// Handle uncaught exceptions
set_exception_handler(function($exception) {
    productionErrorHandler(
        E_ERROR,
        $exception->getMessage(),
        $exception->getFile(),
        $exception->getLine()
    );
});

// Ensure all errors are caught
error_reporting(E_ALL);
ini_set('display_errors', 0);
ini_set('log_errors', 1);
ini_set('error_log', dirname(__DIR__) . '/logs/error.log');
`);

      apiUtilsDir.file("api_utils.php", `<?php
// General API utility functions

/**
 * Safely gets a value from a JSON request body
 */
function getJsonRequestValue($data, $key, $default = null) {
    return isset($data[$key]) ? $data[$key] : $default;
}

/**
 * Sends a JSON response
 */
function sendJsonResponse($data, $statusCode = 200) {
    http_response_code($statusCode);
    echo json_encode($data);
    exit;
}

/**
 * Sends an error response
 */
function sendErrorResponse($message, $statusCode = 400) {
    http_response_code($statusCode);
    echo json_encode(['error' => $message]);
    exit;
}

/**
 * Loads a JSON file or returns a default value if not found
 */
function loadJsonFile($filePath, $default = []) {
    if (file_exists($filePath)) {
        $data = json_decode(file_get_contents($filePath), true);
        return ($data !== null) ? $data : $default;
    }
    return $default;
}

/**
 * Saves data to a JSON file
 */
function saveJsonFile($filePath, $data) {
    return file_put_contents($filePath, json_encode($data, JSON_PRETTY_PRINT));
}
`);

      // Create placeholder files in data directory
      dataDir.file(".gitkeep", "# Data directory - this is where application data is stored");
      
      const zipContent = await zip.generateAsync({ type: "blob" });
      
      FileSaver.saveAs(zipContent, "data-consolidation-tool.zip");
      
      toast({
        title: "Installation package created!",
        description: "The React-based application and backend API have been packaged successfully.",
      });
    } catch (error) {
      console.error("Error creating installation package:", error);
      toast({
        title: "Package creation failed",
        description: "There was an error creating the installation package.",
        variant: "destructive"
      });
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <Card className="w-full shadow-sm hover:shadow-md transition-all duration-300">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-xl font-medium">
          <Server className="h-5 w-5 text-primary" />
          All-in-One Installation Package
        </CardTitle>
        <CardDescription>
          Creates a complete, self-installing package with both frontend and backend components
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <Alert variant="default" className="mb-4 bg-blue-50 border-blue-200 text-blue-800">
            <FileCode className="h-4 w-4" />
            <AlertTitle>React-based Installation</AlertTitle>
            <AlertDescription>
              <p className="mb-2">This tool creates a single installation package that includes a complete React application with the backend API.</p>
              <p>Just download, upload to your server, and run the installer!</p>
            </AlertDescription>
          </Alert>

          <div className="p-4 bg-primary/5 rounded-md">
            <h3 className="text-sm font-medium mb-2">How It Works</h3>
            <ol className="list-decimal list-inside space-y-2 text-sm">
              <li><strong>Download</strong> the installation package below</li>
              <li><strong>Upload</strong> all files in the ZIP to your web server (via FTP or cPanel)</li>
              <li><strong>Maintain the directory structure</strong> exactly as it is in the ZIP file</li>
              <li><strong>Run</strong> install.php by visiting it in your browser (e.g., yourdomain.com/install.php)</li>
              <li>Follow the on-screen instructions to complete the installation</li>
            </ol>
          </div>
          
          <div className="flex justify-center">
            <Button 
              className="gap-2 px-8 py-6 text-lg" 
              onClick={handleDownload} 
              disabled={isDownloading}
            >
              {isDownloading ? (
                <>
                  <div className="h-5 w-5 border-2 border-t-transparent border-white rounded-full animate-spin" />
                  Creating Installation Package...
                </>
              ) : (
                <>
                  <Download className="h-5 w-5" />
                  Download React App Package
                </>
              )}
            </Button>
          </div>
          
          <Separator className="my-4" />
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-green-50 border border-green-100 rounded-md">
              <h3 className="flex items-center gap-2 text-sm font-medium text-green-800 mb-2">
                <CheckSquare className="h-4 w-4" />
                What's Included
              </h3>
              <ul className="list-disc list-inside space-y-1 text-sm text-green-700">
                <li><strong>Complete React Application</strong> - Built with modern React</li>
                <li><strong>UI Components</strong> - Using Tailwind CSS</li>
                <li><strong>Backend API</strong> - PHP-based API</li>
                <li><strong>Data Management</strong> - Sources, schemas, and data handling</li>
                <li><strong>Development Environment</strong> - Vite, TypeScript, and more</li>
                <li><strong>Installation Scripts</strong> - For easy deployment</li>
              </ul>
            </div>
            
            <div className="p-4 bg-amber-50 border border-amber-100 rounded-md">
              <h3 className="flex items-center gap-2 text-sm font-medium text-amber-800 mb-2">
                <AlertTriangle className="h-4 w-4" />
                Server Requirements
              </h3>
              <ul className="list-disc list-inside space-y-1 text-sm text-amber-700">
                <li>PHP 7.0 or higher for the API</li>
                <li>Apache with mod_rewrite enabled</li>
                <li>PHP extensions: curl, json</li>
                <li>Write permissions (chmod 755) for the installation directory</li>
                <li>Node.js for development (not required for production)</li>
              </ul>
            </div>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between items-center bg-slate-50 p-4 rounded-b-lg">
        <div className="text-sm text-muted-foreground">
          <span>Need more detailed instructions?</span>
        </div>
        <Button variant="outline" className="gap-2" onClick={() => window.location.href = "/deploy"}>
          View Detailed Guide
          <ArrowRight className="h-3 w-3" />
        </Button>
      </CardFooter>
    </Card>
  );
};

export default AutoInstaller;
