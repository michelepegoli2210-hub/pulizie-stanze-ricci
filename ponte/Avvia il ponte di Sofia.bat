@echo off
setlocal EnableExtensions
title Il ponte di Sofia
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
echo Fatto. D'ora in poi il ponte si avvia dalla cartella "%CASA%".
echo.

:avvia
cd /d "%CASA%"
if not exist node_modules (
  echo Preparo il ponte: solo la prima volta, ci vuole un minuto...
  call npm install --omit=dev --no-audit --no-fund
)
node ponte.mjs
echo.
echo Il ponte si e' fermato. Chiudi questa finestra e riaprila per farlo ripartire.
pause
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
