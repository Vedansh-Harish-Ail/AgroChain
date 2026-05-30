@echo off
REM -------------------------------------------------
REM AgroChain – presentation start script (Windows)
REM -------------------------------------------------

REM ==== 1️⃣ Project root -------------------------------------------------
cd /d "C:\MY PROJECTS\AgroChain-Morden"

REM ==== 2️⃣ Activate Python virtual‑env ---------------------------------
if not exist venv (
    echo Creating virtual‑env...
    python -m venv venv
)
call venv\Scripts\activate.bat

REM ==== 3️⃣ Ensure Python deps are installed ------------------------------
pip install -r requirements.txt >nul 2>&1

REM ==== 4️⃣ Start Flask backend in a new console window -------------------
start "Flask Backend" cmd /k "set FLASK_APP=app.py ^&^ python -m flask run --host 0.0.0.0 --port 5000"

REM ==== 5️⃣ Wait a moment for the API to be ready ------------------------
timeout /t 3 >nul

REM ==== 6️⃣ Change to the frontend folder --------------------------------
cd frontend

REM ==== 7️⃣ Install / update Node packages (only runs if missing) -------
if not exist node_modules (
    echo Installing Node dependencies...
    npm install
)

REM ==== 8️⃣ Start the Vite dev server -------------------------------------
echo Starting Frontend (Vite)...
npm run dev

REM -------------------------------------------------
REM When you close this window, the Flask window stays alive.
REM Press Ctrl+C in the Vite window to stop the frontend.
REM -------------------------------------------------
