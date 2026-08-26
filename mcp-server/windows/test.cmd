@echo off
REM Prueft, ob Verbindung, Schluessel und Zugriff stimmen.
REM Liest dieselben Werte, die auch Claude Desktop benutzt.
setlocal

if "%CFLUX_BASE_URL%"=="" (
  echo.
  echo Hinweis: CFLUX_BASE_URL und CFLUX_API_KEY sind hier nicht gesetzt.
  echo Bitte unten die beiden Zeilen ausfuellen und diese Datei erneut starten.
  echo.
  REM --- Hier eintragen, dann das REM davor entfernen: -------------------
  REM set CFLUX_BASE_URL=https://cflux.example
  REM set CFLUX_API_KEY=cflux_...
  REM --------------------------------------------------------------------
)

"%~dp0node.exe" "%~dp0cflux-mcp.mjs" --selftest
echo.
pause
