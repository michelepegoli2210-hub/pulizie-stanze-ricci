@echo off
title Il ponte di Sofia
cd /d "%~dp0"
echo.
echo   IL PONTE DI SOFIA - legge soltanto il gruppo WhatsApp e passa i messaggi a Sofia
echo   (non scrive mai niente su WhatsApp)
echo.
where node >nul 2>nul
if errorlevel 1 goto manca_node
if not exist node_modules (
  echo Preparo il ponte: solo la prima volta, ci vuole un minuto...
  call npm install --omit=dev --no-audit --no-fund
)
node ponte.mjs
echo.
echo Il ponte si e' fermato. Chiudi questa finestra e riaprila per farlo ripartire.
pause
exit /b

:manca_node
echo Sul PC manca Node.js, il programma che fa girare il ponte. Lo installo adesso.
echo Se qui sotto ti chiede di accettare le condizioni, premi Y e poi Invio.
echo Se Windows chiede il permesso, rispondi Si.
winget install -e --id OpenJS.NodeJS.LTS
if errorlevel 1 (
  echo Non ci sono riuscito da solo: si apre la pagina di Node.js. Scarica la versione LTS e installala.
  start "" "https://nodejs.org/it/download"
)
echo.
echo Quando ha finito, CHIUDI questa finestra e fai di nuovo doppio clic su "Avvia il ponte di Sofia".
pause
exit /b
