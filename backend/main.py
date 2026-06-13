from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.routes import predictor, telemetry

app = FastAPI(
    title="F1 2026 Telemetry & Finish Predictor API",
    description="Backend API for F1 2026 prediction models and telemetry data fetching.",
    version="1.0.0",
)

# Configure CORS for local development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(predictor.router, prefix="/api/predict", tags=["predictor"])
app.include_router(telemetry.router, prefix="/api/telemetry", tags=["telemetry"])

@app.get("/health")
async def health_check():
    return {"status": "ok", "message": "F1 Predictor API is running."}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
