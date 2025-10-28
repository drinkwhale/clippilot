FROM python:3.11-slim

WORKDIR /app

# uv 설치
COPY --from=ghcr.io/astral-sh/uv:latest /uv /usr/local/bin/uv

# 의존성 복사 및 설치
COPY backend/pyproject.toml backend/uv.lock* ./
RUN uv sync --frozen

# 소스 코드 복사
COPY backend/src ./src
COPY backend/alembic ./alembic
COPY backend/alembic.ini ./

# 환경 변수
ENV PYTHONPATH=/app
ENV PATH="/app/.venv/bin:$PATH"

# 포트 노출
EXPOSE 8000

# 실행
CMD ["uvicorn", "src.main:app", "--host", "0.0.0.0", "--port", "8000"]
