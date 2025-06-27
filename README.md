# Malabon Pickleball Client

## Environment Setup

Create the following environment files in the root directory:

### `.env.development`
```bash
# Development Environment Configuration
VITE_APP_ENV=development
VITE_API_URL=http://localhost:5000
VITE_API_BASE_URL=http://localhost:5000/api

# Frontend Configuration
VITE_APP_NAME=Malabon Pickleball
VITE_APP_VERSION=1.0.0

# Google OAuth Configuration
VITE_GOOGLE_CLIENT_ID=your_google_client_id_here

# Development specific settings
VITE_DEBUG=true
VITE_ENABLE_LOGS=true
```

### `.env.production`
```bash
# Production Environment Configuration
VITE_APP_ENV=production
VITE_API_URL=https://your-production-api.com
VITE_API_BASE_URL=https://your-production-api.com/api

# Frontend Configuration
VITE_APP_NAME=Malabon Pickleball
VITE_APP_VERSION=1.0.0

# Google OAuth Configuration
VITE_GOOGLE_CLIENT_ID=your_production_google_client_id_here

# Production specific settings
VITE_DEBUG=false
VITE_ENABLE_LOGS=false
```

## Development Commands

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Start development server with production mode
npm run dev:prod

# Type checking
npm run type-check

# Clean build directory
npm run clean
```

## Production Commands

```bash
# Build for development
npm run build:dev

# Build for production
npm run build:prod

# Preview production build locally
npm run preview

# Preview production build with production mode
npm run preview:prod

# Start production server
npm run start
```

## Features

- ✅ Environment-based configuration (development/production)
- ✅ React 18 with TypeScript
- ✅ Vite for fast development and building
- ✅ Tailwind CSS for styling
- ✅ React Router for navigation
- ✅ Axios for API calls
- ✅ Socket.IO client integration
- ✅ MobX for state management
- ✅ Google OAuth integration
- ✅ Image optimization and lazy loading
- ✅ Responsive design
- ✅ ESLint configuration

## Global Constants

The build process defines global constants you can use in your code:

```typescript
// Available in your components
if (__DEV__) {
  console.log('Development mode');
}

if (__PROD__) {
  console.log('Production mode');
}
```

## Project Structure

```
src/
├── components/     # Reusable components
├── pages/         # Page components
├── stores/        # MobX stores
├── types/         # TypeScript type definitions
├── utils/         # Utility functions
└── contexts/      # React contexts
```
