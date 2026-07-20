# Stage 1: build the Next.js SPA export.
FROM node:22-slim AS frontend-builder

WORKDIR /app
COPY package*.json ./
RUN npm ci

COPY app/ app/
COPY public/ public/
COPY scripts/ scripts/
COPY src/ src/
COPY next.config.ts postcss.config.mjs tsconfig.json ./
ARG NEXT_PUBLIC_INTHUB_UI_BASE_PATH=/integrations-hub
ARG NEXT_PUBLIC_INTHUB_API_BASE_PATH=/api/integrations-hub
ENV NEXT_PUBLIC_INTHUB_UI_BASE_PATH=${NEXT_PUBLIC_INTHUB_UI_BASE_PATH} \
    NEXT_PUBLIC_INTHUB_API_BASE_PATH=${NEXT_PUBLIC_INTHUB_API_BASE_PATH}
RUN npm run build:spa

# Stage 2: Python/FastAPI application serving the SPA and API.
FROM python:3.12-slim-bookworm

WORKDIR /app
ENV PYTHONPATH=/app \
    INTHUB_STATIC_DIR=/app/out \
    INTHUB_ROOT_PATH=/integrations-hub \
    INTHUB_API_ROOT_PATH=/api/integrations-hub

RUN apt-get update && \
    apt-get install -y --no-install-recommends git libpq5 && \
    apt-get clean && rm -rf /var/lib/apt/lists/* && \
    pip install --no-cache-dir uv==0.11.21

COPY backend/ backend/
RUN cd backend && \
    uv export --no-dev --no-emit-project --format requirements-txt --no-hashes > /tmp/requirements.txt && \
    uv pip install --system -r /tmp/requirements.txt

COPY --from=frontend-builder /app/out ./out

RUN groupadd -r integrations-hub && \
    useradd -r -g integrations-hub -u 42420 integrations-hub
USER integrations-hub

EXPOSE 8000

# Datadog is configured by the deployment's standard DD_* variables.  Running
# through ddtrace-run instruments imports before FastAPI and its dependencies
# load; DD_TRACE_ENABLED still controls whether traces are emitted.
CMD ["ddtrace-run", "python", "-m", "backend.app.server"]
