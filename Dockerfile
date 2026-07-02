# Stage 1: Build React Frontend
FROM node:18-alpine AS frontend-builder
WORKDIR /app/Frontend
COPY Frontend/package*.json ./
RUN npm install
COPY Frontend/ ./
RUN npm run build

# Stage 2: Compile Python Backend & Serve
FROM python:3.10-slim
WORKDIR /app

# Install system dependencies (needed for compilation of psycopg2 and curl for node)
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install Node.js & npm (required in python container to trigger 'npx hardhat' role grants)
RUN curl -fsSL https://deb.nodesource.com/setup_18.x | bash - && \
    apt-get install -y nodejs && \
    rm -rf /var/lib/apt/lists/*

# Copy Blockchain files and install dependencies
COPY Blockchain/package*.json ./Blockchain/
RUN cd Blockchain && npm install

# Copy backend requirements and install them
COPY Backend/requirements.txt ./Backend/
RUN pip install --no-cache-dir -r Backend/requirements.txt
RUN pip install gunicorn

# Copy project source codes
COPY Backend/ ./Backend/
COPY Blockchain/ ./Blockchain/

# Copy React build assets from Stage 1
COPY --from=frontend-builder /app/Frontend/dist ./Frontend/dist

# Expose port and run using Gunicorn WSGI server
EXPOSE 5000
CMD ["gunicorn", "--bind", "0.0.0.0:5000", "--chdir", "Backend", "app:create_app()"]
