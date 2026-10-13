# LectureLoop launcher — starts the backend and frontend together.
# Usage:  powershell -ExecutionPolicy Bypass -File .\start.ps1
# Or just double-click start.bat

$ErrorActionPreference = "Stop"
$root     = Split-Path -Parent $MyInvocation.MyCommand.Path
$backend  = Join-Path $root "backend"
$frontend = Join-Path $root "frontend"
$python   = Join-Path $backend ".venv\Scripts\python.exe"

Write-Host ""
Write-Host "  LectureLoop" -ForegroundColor Magenta
Write-Host "  Starting the full site..." -ForegroundColor Gray
Write-Host ""

# --- Backend: create the virtual environment on first run -----------------
if (-not (Test-Path $python)) {
    Write-Host "  First run: setting up the Python environment..." -ForegroundColor Yellow
    python -m venv (Join-Path $backend ".venv")
    & $python -m pip install --upgrade pip --quiet
    & $python -m pip install -r (Join-Path $backend "requirements.txt")
}

# --- Frontend: install Node dependencies on first run ---------------------
if (-not (Test-Path (Join-Path $frontend "node_modules"))) {
    Write-Host "  First run: installing frontend dependencies (this can take a minute)..." -ForegroundColor Yellow
    Push-Location $frontend
    npm install --no-audit --no-fund
    Pop-Location
}

# --- Start backend in its own window --------------------------------------
Start-Process powershell -ArgumentList @(
    "-NoExit", "-Command",
    "Set-Location '$backend'; Write-Host 'LectureLoop backend' -ForegroundColor Magenta; & '$python' -m uvicorn app.main:app --reload --port 8000"
)

# --- Start frontend in its own window -------------------------------------
Start-Process powershell -ArgumentList @(
    "-NoExit", "-Command",
    "Set-Location '$frontend'; Write-Host 'LectureLoop frontend' -ForegroundColor Magenta; npm run dev"
)

Write-Host "  Backend  : http://localhost:8000  (API docs: /docs)" -ForegroundColor Cyan
Write-Host "  Frontend : http://localhost:3000" -ForegroundColor Cyan
Write-Host ""
Write-Host "  Opening the site once the servers are ready..." -ForegroundColor Gray

# Give the dev server a moment, then open the browser.
Start-Sleep -Seconds 8
Start-Process "http://localhost:3000"

Write-Host ""
Write-Host "  Close the two LectureLoop windows to stop the servers." -ForegroundColor Gray
