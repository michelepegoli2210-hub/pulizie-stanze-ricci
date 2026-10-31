@echo off
setlocal EnableExtensions
title Avvio il ponte di Sofia
echo.
echo   IL PONTE DI SOFIA - legge soltanto il gruppo WhatsApp e passa i messaggi a Sofia
echo   (non scrive mai niente su WhatsApp)
echo.

rem --- Node.js appena installato a volte non si vede ancora in questa finestra: lo cerco nei posti soliti
where node >nul 2>nul
if not errorlevel 1 goto c_e_node
if exist "%ProgramFiles%\nodejs\node.exe" set "PATH=%ProgramFiles%\nodejs;%PATH%"
if exist "%LOCALAPPDATA%\Programs\nodejs\node.exe" set "PATH=%LOCALAPPDATA%\Programs\nodejs;%PATH%"
where node >nul 2>nul
if errorlevel 1 goto manca_node
:c_e_node

rem --- Il ponte vive sempre nella cartella "Ponte di Sofia", anche se lo apri da dentro lo zip o dai Download
set "CASA=%USERPROFILE%\Ponte di Sofia"
set "SITO=https://raw.githubusercontent.com/michelepegoli2210-hub/pulizie-stanze-ricci/main/ponte"
if /i "%~dp0"=="%CASA%\" goto avvia

rem --- 1.1.0: se un ponte e' gia' acceso (anche quello di prima), lo fermo: due ponti insieme litigano su WhatsApp
powershell -NoProfile -ExecutionPolicy Bypass -Command "Get-NetTCPConnection -LocalAddress 127.0.0.1 -LocalPort 3939 -State Listen -ErrorAction SilentlyContinue | ForEach-Object { Write-Host 'Fermo il ponte che era gia acceso...'; Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }"
timeout /t 2 /nobreak >nul

if not exist "%CASA%" mkdir "%CASA%"
if not exist "%~dp0ponte.mjs" goto da_internet
echo Sistemo il ponte nella cartella "%CASA%" ...
copy /y "%~dp0ponte.mjs" "%CASA%\ponte.mjs" >nul
copy /y "%~dp0package.json" "%CASA%\package.json" >nul
copy /y "%~dp0package-lock.json" "%CASA%\package-lock.json" >nul
if exist "%~dp0LEGGIMI.txt" copy /y "%~dp0LEGGIMI.txt" "%CASA%\LEGGIMI.txt" >nul
goto copia_me

:da_internet
echo Prendo il ponte dal sito e lo sistemo nella cartella "%CASA%" ...
curl -fsSL -o "%CASA%\ponte.mjs" "%SITO%/ponte.mjs"
if errorlevel 1 goto senza_file
curl -fsSL -o "%CASA%\package.json" "%SITO%/package.json"
if errorlevel 1 goto senza_file
curl -fsSL -o "%CASA%\package-lock.json" "%SITO%/package-lock.json"
if errorlevel 1 goto senza_file
curl -fsSL -o "%CASA%\LEGGIMI.txt" "%SITO%/LEGGIMI.txt"

:copia_me
copy /y "%~f0" "%CASA%\Avvia il ponte di Sofia.bat" >nul
if exist "%CASA%\ponte-prima.mjs" del /q "%CASA%\ponte-prima.mjs" >nul 2>nul
echo Fatto. D'ora in poi il ponte si avvia dalla cartella "%CASA%".
echo.

:avvia
title Il ponte di Sofia
cd /d "%CASA%"
rem --- 1.1.0: questo file sa far ripartire il ponte quando si aggiorna da solo (codice 3)
set "PONTE_BAT=2"
if not exist node_modules (
  echo Preparo il ponte: solo la prima volta, ci vuole un minuto...
  call npm install --omit=dev --no-audit --no-fund
)

:gira
if exist package-nuovo.json (
  echo Aggiorno le librerie del ponte: un minuto...
  move /y package-nuovo.json package.json >nul
  if exist package-lock-nuovo.json move /y package-lock-nuovo.json package-lock.json >nul
  call npm install --omit=dev --no-audit --no-fund
)
node ponte.mjs
set "USCITA=%errorlevel%"
if "%USCITA%"=="3" goto gira
if "%USCITA%"=="4" goto gia_acceso
if exist ponte-prima.mjs (
  echo Il ponte nuovo non e' partito bene: rimetto quello di prima.
  move /y ponte-prima.mjs ponte.mjs >nul
  goto gira
)
echo.
echo Il ponte si e' fermato. Chiudi questa finestra e riaprila per farlo ripartire.
pause
exit /b

:gia_acceso
echo.
echo Il ponte e' gia' acceso in un'altra finestra: questa si chiude da sola.
timeout /t 8 >nul
exit /b

:senza_file
echo.
echo Non riesco a prendere i file del ponte. Fai cosi': tasto destro sullo zip, "Estrai tutto",
echo apri la cartella estratta e fai doppio clic su "Avvia il ponte di Sofia".
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
