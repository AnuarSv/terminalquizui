# Network Defense Game

A retro terminal/hacker-themed educational game built with FastAPI and React.

## Project Structure

- `backend/`: FastAPI application serving questions and static assets
- `frontend/`: React + Vite + Tailwind CSS v4 application
- `db/`: Contains game assets (avatars, question images, JSON question files)

## Setup Instructions

### Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Install dependencies (using `uv`):
```bash
uv sync
```

3. Run the FastAPI server:
```bash
uv run python main.py
```

The backend will start on `http://localhost:8000`

### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

The frontend will start on `http://localhost:5173`

## Game Features

- **Terminal/Hacker Theme**: Retro green-on-black terminal aesthetic with CRT monitor effects
- **Multiple Question Types**: 
  - Single choice (20s timer)
  - Multiple choice (40s timer)
  - Text input with fuzzy matching (60s timer)
- **Game Flow**:
  - Select a block (1-4) from the main menu
  - Answer questions with typewriter effect
  - Win condition: 70% accuracy required
  - Review wrong answers after completion
- **Visual Effects**:
  - CRT scanlines and glow effects
  - Glitch animation on game over
  - Typewriter effect for questions
  - Countdown timer with color transitions

## API Endpoints

- `GET /api/blocks`: Returns available blocks (1-4)
- `GET /api/questions/{block_id}`: Returns questions for a specific block
- Static files served from `/db/` (avatars, question images)

## Technologies

- **Backend**: FastAPI, Python 3.10+
- **Frontend**: React 19, Vite, Tailwind CSS v4, Zustand
- **Font**: VT323 (Google Fonts)

