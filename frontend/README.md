# Tic Tac Toe Premium

A modern Tic Tac Toe game built with Next.js, featuring:

- 🤖 **vs AI** mode (Easy / Medium / Hard)
- 👥 **Local Play** (2 players on one device)
- 🌐 **Online Multiplayer** with room codes
- ✨ Responsive modern UI with smooth game flow

## Live Demo

🔗 https://tic-tac-toe-premium-nextjs-nodejs.vercel.app/

## Tech Stack

- **Frontend:** Next.js (App Router), React, TypeScript
- **Backend API:** Next.js Route Handlers (`/api/game`, `/api/health`)
- **Deployment:** Vercel

## API Endpoints

- `GET /api/health` → service health status
- `GET /api/game?action=health` → game service health
- `POST /api/game` → game actions (`create_room`, `join_room`, `make_move`, etc.)

## Local Development

```bash
cd frontend
npm install
npm run dev
```

Open: `http://localhost:3000`

## Production

The app is deployed on Vercel and serves both frontend and backend from the same project.

## Repository Structure

- `frontend/` → main app (UI + API routes)
- `backend/` → old standalone backend (kept for reference)
