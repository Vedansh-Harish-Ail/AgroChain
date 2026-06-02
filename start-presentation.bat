@echo off
REM -------------------------------------------------
REM AgroChain – presentation start script (Windows)
REM -------------------------------------------------

REM ==== 1️⃣ Cleanup ------------------------------------------------------
echo Cleaning up existing processes...
taskkill /f /im python.exe >nul 2>&1
taskkill /f /im node.exe >nul 2>&1

REM ==== 2️⃣ Project root -------------------------------------------------
cd /d "C:\MY PROJECTS\AgroChain-Morden"

REM ==== 3️⃣ Start Blockchain Node in a new window -------------------------
echo Starting Hardhat Blockchain Node...
start "Blockchain Node" cmd /k "cd Blockchain & echo y | npx hardhat node"

REM ==== 4️⃣ Wait for Node to start ----------------------------------------
timeout /t 5 >nul

REM ==== 5️⃣ Deploy Smart Contracts ----------------------------------------
echo Deploying Smart Contracts...
cd Blockchain
call npx hardhat run scripts/deploy.js --network localhost
cd ..

REM ==== 6️⃣ Configure Backend ---------------------------------------------
echo Setting up Backend...
cd Backend
if not exist .env copy .env.example .env

REM Ensure deps are installed
py -m pip install -r requirements.txt >nul 2>&1

REM Seed the database (now uses absolute paths)
echo Seeding database with latest schema...
py seed.py

REM ==== 7️⃣ Start Flask backend in a new console window -------------------
start "Flask Backend" cmd /k "py app.py"
cd ..

REM ==== 8️⃣ Wait for API --------------------------------------------------
timeout /t 3 >nul

REM ==== 9️⃣ Start the Vite dev server -------------------------------------
echo Starting Frontend (Vite)...
cd Frontend
if not exist node_modules (
    echo Installing Node dependencies...
    npm install
)

REM Start the Vite server
npm run dev

REM -------------------------------------------------
REM When you close this window, the Flask and Node windows stay alive.
REM Press Ctrl+C in the Vite window to stop the frontend.
REM -------------------------------------------------
