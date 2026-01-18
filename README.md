# DawinOS - Dawin Finishes

A comprehensive cutting list processing and optimization tool for millwork operations. Transforms design software exports (Polyboard, SketchUp) into optimized cutting patterns, BOMs, and supplier-ready formats.

![Version](https://img.shields.io/badge/version-1.1.0-blue.svg)
![License](https://img.shields.io/badge/license-Proprietary-red.svg)

## Features

### 🆕 v1.1 Integration Features
- **Google Authentication**: Sign in with Google account for seamless access
- **Notion Integration**: Connect to customer and project databases
- **Google Drive Upload**: Upload CSV files directly from Google Drive
- **Auto-Save to Drive**: Automatically save outputs to project-specific folders
- **Project Management**: Link processing cycles to customers and projects

### Data Processing
- **Import**: Upload CSV files locally or from Google Drive
- **Material Mapping**: Convert generic material names to supplier-specific names
- **Grain Direction**: Preserve material grain orientation from design software

### Cutting Optimizer
- **Guillotine Algorithm**: Realistic cutting patterns for panel saws
- **Waste Minimization**: Optimizes for least wasted area
- **Grain Preservation**: Respects grain direction constraints (no rotation for grain-sensitive materials)
- **Unlimited Stock**: Automatically calculates required number of sheets
- **Visual Layouts**: Interactive cutting diagrams with zoom controls

### Output Formats
- **PG Bison**: Format for board suppliers with edge banding counts
- **CutlistOpt**: Export for external cutting optimization software
- **Katana BOM**: Aggregated material quantities for MRP import
- **Timber BOM**: Volumetric calculator with milling yield factors

## Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Deployment

### Option 1: Firebase Hosting (Recommended for Google Ecosystem)

If you're using Google Workspace, Firebase Hosting is the best choice. See **[FIREBASE_DEPLOY.md](./FIREBASE_DEPLOY.md)** for detailed instructions.

**Quick Deploy:**
```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login with Google account
firebase login

# Deploy
npm run deploy
```

**Features:**
- Uses your existing Google account
- Free tier (10GB storage, 360MB/day transfer)
- Automatic SSL & global CDN
- GitHub integration for auto-deploy
- Preview channels for testing

### Option 2: Vercel

1. Push code to your Git repository
2. Go to [vercel.com](https://vercel.com) and sign up/login
3. Click "New Project" → Import your Git repository
4. Framework will be auto-detected as Vite
5. Click "Deploy"

**Environment Variables** (if needed):
- None required for basic deployment

**Custom Domain**:
- Go to Project Settings → Domains
- Add your custom domain (e.g., `cutlist.dawingroup.com`)

### Option 2: Netlify

1. Push code to your Git repository
2. Go to [netlify.com](https://netlify.com) and sign up/login
3. Click "Add new site" → "Import an existing project"
4. Connect to your Git provider and select the repository
5. Build settings (auto-detected):
   - Build command: `npm run build`
   - Publish directory: `dist`
6. Click "Deploy site"

### Option 3: Cloudflare Pages

1. Push code to your Git repository
2. Go to [pages.cloudflare.com](https://pages.cloudflare.com)
3. Click "Create a project" → "Connect to Git"
4. Select your repository
5. Build settings:
   - Framework preset: Vite
   - Build command: `npm run build`
   - Build output directory: `dist`
6. Click "Save and Deploy"

### Option 4: GitHub Pages

1. Install gh-pages: `npm install --save-dev gh-pages`
2. Add to `vite.config.js`:
   ```js
   export default defineConfig({
     base: '/your-repo-name/',
     // ... rest of config
   })
   ```
3. Add to `package.json` scripts:
   ```json
   "predeploy": "npm run build",
   "deploy": "gh-pages -d dist"
   ```
4. Run: `npm run deploy`

### Option 5: Docker (Self-Hosted)

Create a `Dockerfile`:

```dockerfile
# Build stage
FROM node:18-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Production stage
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

Create `nginx.conf`:

```nginx
server {
    listen 80;
    server_name localhost;
    root /usr/share/nginx/html;
    index index.html;
    
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

Build and run:
```bash
docker build -t dawinos .
docker run -p 8080:80 dawinos
```

## Project Structure

```
dawinos/
├── public/
│   └── favicon.svg
├── src/
│   ├── App.jsx          # Main application component
│   ├── main.jsx         # React entry point
│   └── index.css        # Global styles + Tailwind
├── index.html           # HTML template
├── package.json         # Dependencies and scripts
├── vite.config.js       # Vite configuration
├── tailwind.config.js   # Tailwind CSS configuration
├── postcss.config.js    # PostCSS configuration
└── README.md            # This file
```

## Configuration

### Stock Sheet Sizes
Configure default stock sheet dimensions in the Configuration tab or modify defaults in `App.jsx`:

```javascript
const DEFAULT_STOCK_SHEETS = {
  'Blockboard Light Brown': { length: 2440, width: 1220, thickness: 18 },
  'PG Bison White': { length: 2750, width: 1830, thickness: 18 },
  // Add more materials...
};
```

### Material Mapping
Map generic Polyboard material names to supplier names:

```javascript
const DEFAULT_MATERIAL_MAPPING = {
  'Generic 0180': 'Blockboard Light Brown',
  'OSB3': 'PG Bison White',
  // Add more mappings...
};
```

### Blade Kerf
Default blade kerf is 4mm. Adjust in Configuration tab based on your saw blade.

## Usage

1. **Load Data**: Paste tab-separated cutting list from Polyboard/SketchUp
2. **Configure**: Set material mappings and stock sheet sizes
3. **Optimize**: Run the cutting optimizer to generate patterns
4. **Export**: Copy results or use specific output formats

### Expected Input Format (Tab-Separated)
```
Cabinet	Label	Material	Thickness	Qty	Length	Width	Grain	TopEdge	RightEdge	BottomEdge	LeftEdge
TV Cabinet	Top	Generic 0180	18	1	1746	380	0		Edge-020		
TV Cabinet	Shelf	OSB3	18	2	1800	405	1	Edge-020	Edge-020	Edge-020	
```

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## License

Proprietary - Dawin Group Internal Use Only

## Support

For issues or feature requests, contact the development team or create an issue in the repository.
