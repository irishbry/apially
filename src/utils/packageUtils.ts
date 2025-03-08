import JSZip from 'jszip';
import { saveAs } from 'file-saver';

export const downloadFile = (fileName: string, content: string) => {
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  saveAs(blob, fileName);
};

export const packageFrontendFiles = async () => {
  const zip = new JSZip();
  
  // Add package.json
  zip.file('package.json', JSON.stringify({
    "name": "frontend-app",
    "private": true,
    "version": "0.0.0",
    "type": "module",
    "scripts": {
      "dev": "vite",
      "build": "tsc && vite build",
      "lint": "eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0",
      "preview": "vite preview"
    },
    "dependencies": {
      "react": "^18.3.1",
      "react-dom": "^18.3.1",
      "react-router-dom": "^6.26.2",
      "@radix-ui/react-dropdown-menu": "^2.1.1",
      "@radix-ui/react-toast": "^1.2.1",
      "class-variance-authority": "^0.7.1",
      "clsx": "^2.1.1",
      "file-saver": "^2.0.5",
      "jszip": "^3.10.1",
      "lucide-react": "^0.462.0",
      "sonner": "^1.5.0",
      "tailwind-merge": "^2.5.2",
      "tailwindcss-animate": "^1.0.7",
      "zod": "^3.23.8"
    },
    "devDependencies": {
      "@types/react": "^18.3.1",
      "@types/react-dom": "^18.3.1",
      "@typescript-eslint/eslint-plugin": "^7.3.1",
      "@typescript-eslint/parser": "^7.3.1",
      "@vitejs/plugin-react": "^4.2.1",
      "autoprefixer": "^10.4.19",
      "postcss": "^8.4.38",
      "tailwindcss": "^3.4.1",
      "typescript": "^5.4.5",
      "vite": "^5.2.3"
    }
  }, null, 2));
  
  // Add vite.config.ts
  zip.file('vite.config.ts', `
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
})
`);
  
  // Add tsconfig.json
  zip.file('tsconfig.json', JSON.stringify({
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
      "noFallthroughCasesInSwitch": true
    },
    "include": ["src"],
    "references": [{ "path": "./tsconfig.node.json" }]
  }, null, 2));
  
  // Add tsconfig.node.json
  zip.file('tsconfig.node.json', JSON.stringify({
    "compilerOptions": {
      "composite": true,
      "skipLibCheck": true,
      "module": "ESNext",
      "moduleResolution": "bundler",
      "allowSyntheticDefaultImports": true
    },
    "include": ["vite.config.ts"]
  }, null, 2));
  
  // Add postcss.config.js
  zip.file('postcss.config.js', `
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
`);
  
  // Add tailwind.config.js
  zip.file('tailwind.config.js', `
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
`);
  
  // Add index.html
  zip.file('index.html', `
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/favicon.ico" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>AI Deployment Assistant</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
`);
  
  // Add src/main.tsx
  zip.file('src/main.tsx', `
import React from 'react'
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
  zip.file('src/App.tsx', `
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { Toaster } from 'sonner'
import './App.css'
import Index from './pages/Index'
import DeploymentInstructions from './pages/DeploymentInstructions'
import NotFound from './pages/NotFound'

function App() {
  return (
    <Router>
      <Toaster position="top-right" />
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/deployment" element={<DeploymentInstructions />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Router>
  )
}

export default App
`);
  
  // Add src/index.css with tailwind directives
  zip.file('src/index.css', `
@tailwind base;
@tailwind components;
@tailwind utilities;
`);
  
  // Add src/App.css
  zip.file('src/App.css', `
#root {
  margin: 0 auto;
  width: 100%;
}
`);
  
  // Add public/favicon.ico as a placeholder
  zip.file('public/favicon.ico', '');
  
  // Add essential pages
  zip.file('src/pages/Index.tsx', `
import { Button } from '../components/ui/button'
import { useNavigate } from 'react-router-dom'

export default function Index() {
  const navigate = useNavigate();
  
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <h1 className="text-3xl font-bold mb-6">AI Deployment Assistant</h1>
      <Button onClick={() => navigate('/deployment')}>
        View Deployment Instructions
      </Button>
    </div>
  )
}
`);
  
  zip.file('src/pages/DeploymentInstructions.tsx', `
import { useState } from 'react'
import { Button } from '../components/ui/button'
import { useNavigate } from 'react-router-dom'
import { packageFrontendFiles, packageApiFiles } from '../utils/packageUtils'

export default function DeploymentInstructions() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState({
    frontend: false,
    api: false
  });
  
  const handleDownloadFrontend = async () => {
    setLoading(prev => ({ ...prev, frontend: true }));
    try {
      await packageFrontendFiles();
    } finally {
      setLoading(prev => ({ ...prev, frontend: false }));
    }
  };
  
  const handleDownloadApi = async () => {
    setLoading(prev => ({ ...prev, api: true }));
    try {
      await packageApiFiles();
    } finally {
      setLoading(prev => ({ ...prev, api: false }));
    }
  };
  
  return (
    <div className="min-h-screen p-6">
      <Button variant="outline" onClick={() => navigate('/')} className="mb-6">
        Back to Home
      </Button>
      
      <h1 className="text-3xl font-bold mb-6">Deployment Instructions</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="border p-4 rounded-lg">
          <h2 className="text-xl font-semibold mb-4">Frontend Deployment</h2>
          <p className="mb-4">Download the complete frontend package with all necessary files.</p>
          <Button 
            onClick={handleDownloadFrontend} 
            disabled={loading.frontend}
          >
            {loading.frontend ? 'Preparing...' : 'Download Frontend Files'}
          </Button>
        </div>
        
        <div className="border p-4 rounded-lg">
          <h2 className="text-xl font-semibold mb-4">API Deployment</h2>
          <p className="mb-4">Download the API package with all necessary backend files.</p>
          <Button 
            onClick={handleDownloadApi} 
            disabled={loading.api}
          >
            {loading.api ? 'Preparing...' : 'Download API Files'}
          </Button>
        </div>
      </div>
      
      <div className="border p-4 rounded-lg mb-6">
        <h2 className="text-xl font-semibold mb-4">Installation Steps</h2>
        <ol className="list-decimal ml-6 space-y-2">
          <li>Extract the downloaded ZIP files to your preferred location</li>
          <li>Navigate to each directory and run <code className="bg-gray-100 p-1 rounded">npm install</code> to install dependencies</li>
          <li>Start the frontend with <code className="bg-gray-100 p-1 rounded">npm run dev</code></li>
          <li>Start the API with <code className="bg-gray-100 p-1 rounded">npm run start</code></li>
        </ol>
      </div>
    </div>
  )
}
`);
  
  zip.file('src/pages/NotFound.tsx', `
import { Button } from '../components/ui/button'
import { useNavigate } from 'react-router-dom'

export default function NotFound() {
  const navigate = useNavigate();
  
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <h1 className="text-3xl font-bold mb-4">404 - Page Not Found</h1>
      <p className="mb-6">The page you are looking for does not exist.</p>
      <Button onClick={() => navigate('/')}>
        Back to Home
      </Button>
    </div>
  )
}
`);
  
  // Add basic components folder with button component
  zip.file('src/components/ui/button.tsx', `
import React from 'react'

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'default' | 'outline'
}

export function Button({ 
  children, 
  className = '', 
  variant = 'default',
  disabled,
  ...props 
}: ButtonProps) {
  const baseStyles = "px-4 py-2 rounded font-medium transition-colors";
  const variantStyles = {
    default: "bg-blue-500 text-white hover:bg-blue-600",
    outline: "border border-gray-300 hover:bg-gray-100"
  };
  
  const combinedClasses = \`\${baseStyles} \${variantStyles[variant]} \${disabled ? 'opacity-50 cursor-not-allowed' : ''} \${className}\`;
  
  return (
    <button className={combinedClasses} disabled={disabled} {...props}>
      {children}
    </button>
  );
}
`);
  
  // Utils
  zip.file('src/utils/packageUtils.ts', `
import JSZip from 'jszip';
import { saveAs } from 'file-saver';

export const packageApiFiles = async () => {
  const zip = new JSZip();
  
  // Add package.json
  zip.file('package.json', JSON.stringify({
    "name": "api-service",
    "version": "1.0.0",
    "description": "Backend API service",
    "main": "index.js",
    "scripts": {
      "start": "node index.js",
      "dev": "nodemon index.js",
      "test": "jest"
    },
    "dependencies": {
      "express": "^4.18.2",
      "cors": "^2.8.5",
      "dotenv": "^16.3.1",
      "body-parser": "^1.20.2"
    },
    "devDependencies": {
      "nodemon": "^3.0.1",
      "jest": "^29.7.0"
    }
  }, null, 2));
  
  // Add index.js
  zip.file('index.js', \`
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());

app.get('/api/health', (req, res) => {
  res.json({ status: 'healthy' });
});

app.listen(PORT, () => {
  console.log(\`API server running on port \${PORT}\`);
});
\`);
  
  // Add .env.example
  zip.file('.env.example', \`
PORT=3000
# Add other environment variables here
\`);
  
  // Add README
  zip.file('README.md', \`
# API Service

This is the backend API service for the application.

## Setup

1. Clone this repository
2. Run \`npm install\` to install dependencies
3. Copy \`.env.example\` to \`.env\` and update values
4. Run \`npm run dev\` to start the development server
\`);
  
  // Generate and download the zip
  const content = await zip.generateAsync({ type: 'blob' });
  saveAs(content, 'api-files.zip');
};

// Export the function for packaging frontend files
export const packageFrontendFiles = async () => {
  const zip = new JSZip();
  
  // Add all the frontend files
  // The specific content for each file would be defined here
  // Similar to the structure above, but with frontend-specific files
  
  // Generate and download the zip
  const content = await zip.generateAsync({ type: 'blob' });
  saveAs(content, 'frontend-files.zip');
};
`);
  
  // Generate and download the zip
  const content = await zip.generateAsync({ type: 'blob' });
  saveAs(content, 'frontend-files.zip');
};

export const packageApiFiles = async () => {
  const zip = new JSZip();
  
  // Add package.json
  zip.file('package.json', JSON.stringify({
    "name": "api-service",
    "version": "1.0.0",
    "description": "Backend API service",
    "main": "index.js",
    "scripts": {
      "start": "node index.js",
      "dev": "nodemon index.js",
      "test": "jest"
    },
    "dependencies": {
      "express": "^4.18.2",
      "cors": "^2.8.5",
      "dotenv": "^16.3.1",
      "body-parser": "^1.20.2"
    },
    "devDependencies": {
      "nodemon": "^3.0.1",
      "jest": "^29.7.0"
    }
  }, null, 2));
  
  // Add index.js
  zip.file('index.js', `
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());

app.get('/api/health', (req, res) => {
  res.json({ status: 'healthy' });
});

app.listen(PORT, () => {
  console.log(\`API server running on port \${PORT}\`);
});
`);
  
  // Add .env.example
  zip.file('.env.example', `
PORT=3000
# Add other environment variables here
`);
  
  // Add README
  zip.file('README.md', `
# API Service

This is the backend API service for the application.

## Setup

1. Clone this repository
2. Run \`npm install\` to install dependencies
3. Copy \`.env.example\` to \`.env\` and update values
4. Run \`npm run dev\` to start the development server
`);
  
  // Generate and download the zip
  const content = await zip.generateAsync({ type: 'blob' });
  saveAs(content, 'api-files.zip');
};
