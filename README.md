# F1 2026 Telemetry & Finish Predictor

A full-stack web application for predicting F1 2026 race outcomes and analyzing telemetry data. Built with Next.js (frontend) and FastAPI (backend), featuring 2026 technical regulations including hybrid power management and active aerodynamics.

## 🏎 Features

- **2026 Technical Regulations**: 
  - 50:50 hybrid power split (ICE 350kW + MGU-K 350kW)
  - Active aerodynamics (no manual DRS)
  - Derating zones when MGU-K battery depleted

- **Race Predictions**:
  - Qualifying position prediction
  - Race finish position prediction
  - Confidence scoring
  - Safety car probability estimation

- **Real-time Telemetry**:
  - Speed, throttle, brake monitoring
  - Hybrid power distribution tracking
  - MGU-K battery state visualization
  - Derating zone detection

- **Pit Wall UI**:
  - Dark mode aesthetic inspired by F1 pit wall displays
  - Live clock and status indicators
  - Driver-specific prediction cards
  - Interactive telemetry overlay

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ (for frontend)
- Python 3.10+ (for backend)
- Git

### Installation

```bash
# Clone the repository
git clone git@github.com:lsid25/Sid-s_F1_Project.git
cd f1-2026-predictor

# Setup backend
cd backend
pip install -r requirements.txt

# Setup frontend
cd ../frontend
npm install
```

### Running the Application

**Terminal 1 - Backend:**
```bash
cd backend
python main.py
# API runs on http://localhost:8000
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
# App runs on http://localhost:3000
```

Visit `http://localhost:3000` in your browser.

## 📁 Project Structure

```
f1-2026-predictor/
├── backend/
│   ├── main.py                 # FastAPI application
│   ├── requirements.txt        # Python dependencies
│   ├── app/
│   │   ├── models/
│   │   │   └── schemas.py      # Pydantic models
│   │   ├── ml/
│   │   │   └── predictor.py    # Prediction engine
│   │   └── utils/
│   │       └── telemetry.py    # Telemetry generation
│   └── README.md
│
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── dashboard/
│   │   │   │   └── page.tsx    # Main dashboard
│   │   │   └── layout.tsx
│   │   ├── components/
│   │   │   ├── PitWallHeader.tsx
│   │   │   ├── PredictorPanel.tsx
│   │   │   ├── TelemetryOverlay.tsx
│   │   │   └── ...
│   │   ├── lib/
│   │   │   ├── api.ts          # API client
│   │   │   └── utils.ts
│   │   └── types/
│   │       └── f1.ts           # TypeScript types
│   ├── package.json
│   ├── next.config.ts
│   └── README.md
│
├── .gitignore
└── README.md
```

## 🔧 API Endpoints

### Health Check
```
GET /health
```

### Get 2026 Grid
```
GET /api/grid/2026
```

### Get 2026 Regulations
```
GET /api/regulations/2026
```

### Predict Race Finish
```
POST /api/predict
Content-Type: application/json

{
  "session_key": "2026-01-01-bahrain-qualifying",
  "driver_id": 1,
  "simulation_type": "2026_regulations"
}
```

### Get Telemetry
```
GET /api/telemetry/{driver_id}?session_key=optional
```

## 🏁 2026 Grid

| # | Driver | Team | Acronym |
|---|--------|------|---------|
| 1 | Lando Norris | McLaren | NOR |
| 33 | Max Verstappen | Red Bull Racing | VER |
| 11 | Sergio Perez | Cadillac | PER |
| 16 | Charles Leclerc | Ferrari | LEC |
| 55 | Carlos Sainz | Ferrari | SAI |
| 44 | Lewis Hamilton | Ferrari | HAM |
| 63 | George Russell | Mercedes | RUS |
| 81 | Oscar Piastri | McLaren | PIA |
| 14 | Fernando Alonso | Aston Martin | ALO |
| 18 | Lance Stroll | Aston Martin | STR |

## 🛠 Development

### Frontend Development
```bash
cd frontend
npm run dev      # Start dev server with hot reload
npm run build    # Build for production
npm run lint     # Run ESLint
```

### Backend Development
```bash
cd backend
python main.py                           # Start server
python -m uvicorn main:app --reload      # With auto-reload
```

### Testing

**Backend API Test:**
```bash
curl -X POST http://localhost:8000/api/predict \
  -H "Content-Type: application/json" \
  -d '{"session_key":"test","driver_id":1,"simulation_type":"2026_regulations"}'
```

## 📊 2026 Regulations

### Hybrid Power System
- **Total Power**: 700 kW (50:50 split)
- **ICE**: 350 kW (internal combustion engine)
- **MGU-K**: 350 kW (motor generator unit - kinetic)
- **Impact**: Fundamental change to energy deployment strategy

### Active Aerodynamics
- Automated active aero system
- Replaces manual DRS flap entirely
- Continuous drag/downforce adjustment
- Adapts to speed and circuit conditions

### Derating Zones
- Power reduction (~15%) when MGU-K battery depleted
- Visible as speed plateau at high throttle
- Critical for race strategy and pit stop timing
- Highlighted in red on telemetry overlay

## 🎨 UI/UX

- **Pit Wall Aesthetic**: Dark mode inspired by F1 pit wall displays
- **Real-time Clock**: UTC time display with live updates
- **Status Indicators**: OpenF1 connection status, hybrid mode indicator
- **Driver Cards**: Individual driver statistics and predictions
- **Telemetry Overlay**: SVG-based pure visualization (no library dependencies)

## 🔐 Security

- CORS enabled for local development
- Environment variables for sensitive data
- Input validation with Pydantic
- Type safety with TypeScript

## 📝 License

MIT

## 👤 Author

Sid (lsid25)

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📧 Support

For issues and questions, please open an issue on GitHub.

---

**Last Updated**: June 2026  
**Status**: Active Development
