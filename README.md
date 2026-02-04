# NutriPioneer

NutriPioneer is a comprehensive nutrition and meal planning application.

## Project Structure

This project is organized into two main directories:

- **`nutripioneer/`**: The frontend application built with Next.js.
- **`backend/`**: The backend API built with Hono and running on Bun.

## Prerequisites

- [Node.js](https://nodejs.org/) (Introduction of Next.js 16 implies a recent version)
- [Bun](https://bun.sh/) (Required for the backend)
- [Docker](https://www.docker.com/) (For containerized deployment)

## Environment Configuration

This project uses a **centralized environment configuration** system with a single `.env` file at the project root. The configuration automatically adjusts based on `NODE_ENV` (development or production).

### Quick Setup

1. Copy the example environment file:
   ```bash
   cp .env.example .env
   ```

2. Edit the `.env` file and add your API keys and secrets

3. For local development, the defaults work out of the box:
   ```env
   NODE_ENV=development
   ```

4. For production deployment, just set two variables:
   ```env
   NODE_ENV=production
   DOMAIN=yourdomain.com
   ```

   URLs are automatically configured based on these values!

### Key Environment Variables

- **`NODE_ENV`**: Controls which URLs and settings are used (`development` or `production`)
- **`DOMAIN`**: Your production domain name (only used when `NODE_ENV=production`)
- **`BETTER_AUTH_SECRET`**: Secret key for authentication (generate with `openssl rand -base64 32`)

**Note:** All URLs (`FRONTEND_URL`, `BACKEND_URL`, `NEXT_PUBLIC_API_URL`, `BETTER_AUTH_URL`) are automatically set based on `NODE_ENV` and `DOMAIN`. The `NEXT_PUBLIC_` prefix means the variable is exposed to the browser and should only contain public-safe values.

For a complete list of all environment variables, see `.env.example`.

## Getting Started

### Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   bun install
   ```

3. Set up the database (Prisma):
   ```bash
   bun run db:generate
   bun run db:push
   ```
   *(Optional) Seed the database:*
   ```bash
   bun run db:seed
   ```

4. Start the development server:
   ```bash
   bun run dev
   ```

### Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd nutripioneer
   ```

2. Install dependencies:
   ```bash
   npm install
   # or
   bun install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```
    The application will be available at `http://localhost:3000`.

## Docker Deployment

### Development with Docker

Start all services (frontend, backend) with Docker Compose:

```bash
docker compose up
```

Or run in detached mode:

```bash
docker compose up -d
```

### Production Deployment

For production deployment, see the [Deployment Guide](./DEPLOYMENT.md) for detailed instructions including:

- Server provisioning
- SSL certificate setup
- CI/CD with GitHub Actions
- Environment configuration

Quick start for production:

```bash
docker compose -f docker-compose.prod.yml up -d --build
```

## Scripts

### Backend
- `bun run dev`: Start the dev server with watch mode.
- `bun run start`: Start the production server.
- `bun run db:generate`: Generate Prisma client.
- `bun run db:push`: Push schema changes to the database.
- `bun run db:studio`: Open Prisma Studio to view data.

### Frontend
- `npm run dev`: Start Next.js dev server on port 3000.
- `npm run build`: Build the application for production.
- `npm run start`: Start the production server.

## Tech Stack

**Frontend:**
- Next.js 16
- React 19
- Framer Motion & Motion (Animations)
- Zustand (State Management)
- Lucide React (Icons)
- Sonner (Toast notifications)

**Backend:**
- Hono (Web Framework)
- Bun (Runtime)
- Prisma (ORM)
- Better Auth
- OpenAI Integration
