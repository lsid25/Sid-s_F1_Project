# F1 2026 Telemetry & Finish Predictor

A premium localhost monorepo for Formula 1 telemetry analytics and race finish prediction, built with Next.js, Tailwind CSS, Python FastAPI, and XGBoost. The architecture is designed to model the unique constraints of the 2026 technical regulations (50:50 hybrid split, active aerodynamics, and energy deployment/derating).

## Architecture Stack

### Frontend (`/frontend`)
- **Framework:** Next.js 15 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS with custom F1 carbon/neon design tokens
- **Visualizations:** Pure React SVG Charts (zero-dependency, SSR/proxy compatible)
- **Icons:** Lucide React
- **Build Tool:** Turbopack

### Backend (`/backend`)
- **Framework:** Python FastAPI
- **Data Source:** OpenF1 API (`openf1.org`)
- **ML Pipeline:** Scikit-Learn, XGBoost, Pandas
- **Data Processing:** Numpy

## Getting Started

### 1. Backend Setup (FastAPI)

Open a terminal and navigate to the backend directory:

```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

Run the FastAPI server:

```bash
uvicorn app.main:app --reload --port 8000
```

The API will be available at `http://localhost:8000`. You can view the Swagger documentation at `http://localhost:8000/docs`.

### 2. Frontend Setup (Next.js)

Open a new terminal and navigate to the frontend directory:

```bash
cd frontend
npm install
```

Run the Next.js development server with Turbopack:

```bash
npm run dev
```

The application will be available at `http://localhost:3000`.

### 3. Concurrent Execution

You can also run both the frontend and backend concurrently from the root directory:

```bash
npm install
npm run dev
```

## Features

- **Pit Wall Dashboard:** A dark mode aesthetic (carbon tones, neon team-colored accents) featuring a responsive grid layout.
- **2026 Simulation Engine:** A predictor panel that hits the Python endpoint to run XGBoost predictions based on the 2026 regulations.
- **Telemetry Overlay:** A pure SVG charting layout that compares two drivers' velocity profiles over a lap to visually highlight where a car is "derating" (running out of MGU-K battery power) on straights.
- **Mock Data Fallback:** If the OpenF1 API is unreachable, the frontend automatically falls back to generating realistic mock telemetry data so the UI remains functional.

## 2026 Regulation Context

The ML pipeline and telemetry visualizations are built around three core 2026 regulation changes:
1. **50:50 Hybrid Split:** Equal power contribution from the ICE and the MGU-K (350 kW each).
2. **Active Aerodynamics:** Automated active aero systems replacing manual DRS.
3. **Derating Zones:** Sharp power reduction when the MGU-K battery is depleted mid-straight, visible as a speed plateau at high throttle.

## License
MIT
