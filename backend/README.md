# F1 2026 Predictor - Backend API

FastAPI-based backend for the F1 2026 Telemetry & Finish Predictor. Implements 2026 technical regulations with hybrid power management and active aerodynamics.

## Features

- **2026 Technical Regulations**: 50:50 hybrid power split (ICE + MGU-K), active aerodynamics, derating zones
- **Race Predictions**: Heuristic-based predictions for qualifying and race finish positions
- **Telemetry Generation**: Mock telemetry data with realistic 2026 power management
- **Real-time API**: RESTful endpoints for predictions and telemetry data

## Setup

### Installation

```bash
# Install dependencies
pip install -r requirements.txt
```

### Configuration

```bash
# Copy environment template
cp .env.example .env

# Edit .env with your settings
```

### Running the Server

```bash
# Development
python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000

# Production
python main.py
```

The API will be available at `http://localhost:8000`

## API Endpoints

### Health Check
```
GET /health
```

### Get 2026 Grid
```
GET /api/grid/2026
```
Returns the 2026 F1 grid with driver numbers, teams, and acronyms.

### Get 2026 Regulations
```
GET /api/regulations/2026
```
Returns 2026 technical regulations summary.

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

Response:
```json
{
  "driver_id": 1,
  "session_key": "2026-01-01-bahrain-qualifying",
  "predicted_finish": 2,
  "confidence_score": 0.87,
  "metrics": {
    "qualifying_position": 1,
    "race_finish_position": 2,
    "safety_car_probability": 0.32,
    "hybrid_efficiency_score": 92.5,
    "derating_impact_percent": 8.2
  },
  "simulation_type": "2026_regulations",
  "timestamp": "2026-06-03T12:34:56.789012"
}
```

### Get Telemetry
```
GET /api/telemetry/{driver_id}?session_key=optional
```

Returns telemetry data for a driver including speed, throttle, brake, power, and MGU-K battery state.

## 2026 Regulations

### Hybrid Power (50:50 Split)
- **ICE**: 350 kW
- **MGU-K**: 350 kW
- **Total**: 700 kW

### Active Aerodynamics
- Automated active aero system replaces manual DRS
- Continuous drag/downforce adjustment
- No manual DRS flap

### Derating Zones
- Power reduction (~15%) when MGU-K battery depleted
- Visible on telemetry as speed plateau at high throttle
- Critical for race strategy

## 2026 Grid

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

## Architecture

```
backend/
├── main.py                 # FastAPI application
├── requirements.txt        # Python dependencies
├── app/
│   ├── __init__.py
│   ├── models/
│   │   ├── __init__.py
│   │   └── schemas.py      # Pydantic models
│   ├── ml/
│   │   ├── __init__.py
│   │   └── predictor.py    # Prediction engine
│   └── utils/
│       ├── __init__.py
│       └── telemetry.py    # Telemetry generation
└── README.md
```

## Development

### Testing

```bash
# Test prediction endpoint
curl -X POST http://localhost:8000/api/predict \
  -H "Content-Type: application/json" \
  -d '{"session_key":"test","driver_id":1,"simulation_type":"2026_regulations"}'

# Test grid endpoint
curl http://localhost:8000/api/grid/2026

# Test health check
curl http://localhost:8000/health
```

## License

MIT
