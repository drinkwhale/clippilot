"""FastAPI 애플리케이션 진입점"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(
    title="ClipPilot API",
    version="1.0.0",
    description="AI 숏폼 크리에이터 자동화 SaaS API",
)

# CORS 설정
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return {"message": "ClipPilot API", "version": "1.0.0"}

@app.get("/health")
async def health_check():
    return {"status": "healthy"}
