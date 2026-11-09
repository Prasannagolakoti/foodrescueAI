@echo off
title Food Rescue Agent Runner
echo ========================================================
echo   Starting AI Food Rescue & Donation Platform
echo ========================================================
echo.
echo Starting Backend & Full-Stack Server on ports 5000 and 8080...
start "Food Rescue Server" cmd /k "node server/index.js"

echo Starting Vite Frontend Dev Server on port 3000...
start "Food Rescue Frontend" cmd /k "npm.cmd --prefix client run dev"

echo.
echo ========================================================
echo Both servers are launching!
echo You can open any of these in your browser:
echo   - http://localhost:5000
echo   - http://127.0.0.1:5000
echo   - http://localhost:8080
echo   - http://localhost:3000
echo ========================================================
echo.
pause

