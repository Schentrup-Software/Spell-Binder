# Spell Binder

A self-hostable web application for cataloging and managing your Magic: The Gathering card collection. Built with React and PocketBase for easy deployment and management.

## Features

- 📱 Responsive web interface for desktop and mobile
- 🔍 Search and add cards to your collection
- 📊 Collection statistics and dashboard
- 🏷️ Track card condition, quantity, and notes
- 🐳 Docker support for easy deployment
- 💾 Self-hosted with PocketBase backend

## Quick Start

### Development Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd spell-binder
   ```

2. **Run the setup script**
   ```bash
   npm run setup
   ```
   This will download PocketBase and install all dependencies.

3. **Start the development servers**
   
   In one terminal, start PocketBase:
   ```bash
   npm run pocketbase
   ```
   
   In another terminal, start the React development server:
   ```bash
   npm run dev
   ```

4. **Access the application**
   - React app: http://localhost:3000
   - PocketBase admin: http://localhost:8090/_/

### Docker Deployment

1. **Using Docker Compose (Recommended)**
   ```bash
   docker-compose up --build
   ```

2. **Using Docker directly**
   ```bash
   npm run docker:build
   npm run docker:run
   ```

3. **Access the application**
   - Application: http://localhost:8080
   - PocketBase admin: http://localhost:8080/_/

## Project Structure

```
spell-binder/
├── src/                    # React application source
│   ├── components/         # React components
│   ├── App.tsx            # Main application component
│   ├── main.tsx           # Application entry point
│   └── index.css          # Global styles with Tailwind
├── pocketbase/            # PocketBase directory
│   └── pb_public/         # Built React app (auto-generated)
├── scripts/               # Development scripts
├── Dockerfile             # Docker configuration
├── docker-compose.yml     # Docker Compose configuration
└── vite.config.ts         # Vite build configuration
```

## Development

### Available Scripts

- `npm run dev` - Start React development server
- `npm run build` - Build production React app
- `npm run pocketbase` - Start PocketBase server
- `npm run setup` - Run development setup script
- `npm run lint` - Run ESLint
- `npm run docker:build` - Build Docker image
- `npm run docker:run` - Run Docker container
- `npm run docker:compose` - Run with Docker Compose

### Environment Variables

Copy `.env.example` to `.env` and configure:

```env
# PocketBase Configuration
PB_ENCRYPTION_KEY=your-encryption-key-here

# Development Configuration
VITE_POCKETBASE_URL=http://localhost:8090
```

## Architecture

- **Frontend**: React 18 with TypeScript and Tailwind CSS
- **Backend**: PocketBase (Go-based BaaS with SQLite)
- **Build Tool**: Vite for fast development and optimized builds
- **Deployment**: Docker with multi-stage builds

## Requirements

- Node.js 18+ (for development)
- Docker (for deployment)
- Modern web browser

## License

This project is licensed under the MIT License - see the LICENSE file for details.