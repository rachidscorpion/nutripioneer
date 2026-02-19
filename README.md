# NutriPioneer

AI-powered nutrition and meal planning for users with complex health conditions (CKD, Diabetes, Hypertension, PCOS, High Cholesterol). Features Just-in-Time (JIT) disease onboarding via WHO ICD-11 integration, personalized meal plans, and real-time food safety analysis.

## Project Structure

This project is organized into two main directories:

- **`nutripioneer/`**: The frontend application built with Next.js.
- **`backend/`**: The backend API built with Hono and running on Bun.

## Key Features

- **6-Step Onboarding Flow** - Conditions, biometrics, medications, dietary preferences → AI-generated nutrition limits
- **JIT Disease Onboarding** - Search any condition via WHO ICD-11 (55,000+ conditions), AI auto-generates clinical nutrition rules
- **Smart Meal Planning** - Recipes from FatSecret/Edamam/TheMealDB filtered by your medical constraints
- **Food Safety Scanner** - Real-time conflict analysis for phosphate/potassium additives, hidden sugars, trans fats
- **Restaurant Rescue** - Upload menu photos → AI identifies SAFE/CAUTION/AVOID items
- **Health Metrics** - Track glucose, blood pressure, weight, water intake

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

## Quick Reference

### Common Tasks

```bash
# Database management
cd backend && bun run db:push          # Push schema changes
cd backend && bun run db:studio        # Open Prisma Studio

# API base URL
Backend: http://localhost:3001/api
Frontend: http://localhost:3000

# Key endpoints
GET  /api/conditions                   # List available conditions
GET  /api/conditions/search?q=         # Search ICD-11 for any condition
POST /api/conditions/onboard           # AI-generate nutrition rules for condition
POST /api/plans/generate               # Generate daily meal plan
GET  /api/food/analyze?q=              # Analyze food safety
POST /api/menu/scan                    # Scan restaurant menu image
```

## Tech Stack

**Frontend:**
- Next.js 16 (App Router)
- React 19
- Zustand (State Management)
- Framer Motion (Animations)
- Lucide React (Icons)
- Axios (HTTP Client)
- CSS Modules

**Backend:**
- Hono (Web Framework)
- Bun (Runtime)
- Prisma ORM + SQLite
- Better Auth (email/password + OAuth)
- Polar.sh (Subscriptions)

**AI & APIs:**
- OpenAI (GPT-4o, GPT-5-nico) - Menu analysis, nutrition limits, JIT onboarding
- WHO ICD-11 - 55,000+ medical conditions
- FatSecret - Primary recipe/food database
- Edamam - Recipe search with nutritional filters
- TheMealDB - Secondary recipe source
- USDA FoodData Central - Authoritative nutrition data
- Open Food Facts - Barcode scanning
- FDA RxNorm - Medication lookup

## Medical Constraints

The system enforces condition-specific nutrition limits:

- **CKD:** Low phosphorus (<1000mg), low potassium (<3000mg), limited protein (0.6-0.8g/kg), avoid phosphate additives
- **Type 2 Diabetes:** Carb limits per meal (45-75g), limit sugars (>25g/day), prioritize fiber
- **Hypertension:** Low sodium (<2300mg), high potassium encouraged (DASH diet)
- **PCOS:** Minimize sugars, avoid inflammatory oils and nitrates
- **High Cholesterol:** Limit saturated fat (<13g), zero trans fats, limit cholesterol (<200mg/day)

For complete architecture details, API documentation, and algorithms, see [PROJECT_DOCUMENTATION.md](./PROJECT_DOCUMENTATION.md).
# Wed Feb 18 22:27:10 EST 2026
