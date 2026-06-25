# EAFC Tournament Manager

A comprehensive system for managing video game soccer championships, built with a modern TypeScript stack and Material Design.

## Tech Stack

- **Backend:** Node.js with [NestJS](https://nestjs.com/)
- **Frontend:** [React](https://reactjs.org/) + [Material UI](https://mui.com/)
- **Database:** [TypeORM](https://typeorm.io/) (PostgreSQL for production, SQLite for testing)
- **Containerization:** Docker / Podman

## Features

- **Tournament Creation:** Support for League (Single/Double Round) and Cup formats.
- **Participant Management:** Register players and assign clubs per tournament.
- **Automated Scheduling:** Generate match fixtures automatically based on tournament rules.
- **Live Leaderboards:** Real-time standings calculation (Points, GD, GF).
- **Match Tracking:** Start/Finish matches and record goals with a mobile-first UI.

## Getting Started

### Prerequisites

- [Docker](https://www.docker.com/) and Docker Compose **OR** [Podman](https://podman.io/) with `podman-compose`.

### Running with Docker / Podman (Recommended)

The easiest way to start the entire stack (Database, Backend, and Frontend) is using Docker Compose.

1. **Clone the repository**
2. **Start the development environment:**
   ```bash
   docker compose up --build
   ```
   *(Note: If you use Podman, ensure you have the `docker` alias or use `podman-compose up`)*

3. **Access the applications:**
   - **Frontend:** [http://localhost:5173](http://localhost:5173)
   - **Backend API:** [http://localhost:3000](http://localhost:3000)

### Production Deployment

To run the production-optimized containers:
```bash
docker compose -f docker-compose.prod.yml up -d --build
```

---

### Manual Installation (Alternative)

If you prefer to run the components manually:

#### Backend
```bash
cd server
npm install
npm run start:dev
```
*Requires a running PostgreSQL instance. Configure connection in `server/.env`.*

#### Frontend
```bash
cd client
npm install
npm run dev
```

## Testing

Run the backend end-to-end tests (uses in-memory SQLite):
```bash
cd server
npm run test:e2e
```
