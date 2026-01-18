# NutriPioneer

NutriPioneer is a comprehensive nutrition and meal planning application.

## Project Structure

This project is organized into two main directories:

- **`nutripioneer/`**: The frontend application built with Next.js.
- **`backend/`**: The backend API built with Hono and running on Bun.

## Prerequisites

- [Node.js](https://nodejs.org/) (Introduction of Next.js 16 implies a recent version)
- [Bun](https://bun.sh/) (Required for the backend)

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
