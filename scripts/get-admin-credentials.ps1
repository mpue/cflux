# PowerShell Script zum Abrufen der Admin-Credentials
# Usage: .\get-admin-credentials.ps1

Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  TIME TRACKING SYSTEM - ADMIN CREDENTIALS" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

try {
    # Prüfe ob Docker läuft
    $dockerRunning = docker ps 2>&1
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Docker ist nicht verfügbar oder läuft nicht!" -ForegroundColor Red
        Write-Host "   Bitte starten Sie Docker Desktop." -ForegroundColor Yellow
        exit 1
    }

    # Prüfe ob Container läuft
    $containerRunning = docker ps --filter "name=timetracking-backend" --format "{{.Names}}" 2>&1
    if (-not $containerRunning) {
        Write-Host "❌ Backend-Container läuft nicht!" -ForegroundColor Red
        Write-Host "   Starten Sie das System mit: docker-compose up -d" -ForegroundColor Yellow
        exit 1
    }

    Write-Host "🔍 Suche nach Admin-Credentials..." -ForegroundColor Yellow
    Write-Host ""

    # Versuche Credentials-Datei zu lesen
    $credentials = docker exec timetracking-backend cat /tmp/admin-credentials.txt 2>&1
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host $credentials -ForegroundColor Green
    } else {
        Write-Host "⚠️  Credentials-Datei nicht gefunden!" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "Mögliche Gründe:" -ForegroundColor Yellow
        Write-Host "  1. Dies ist keine Erst-Installation" -ForegroundColor Gray
        Write-Host "  2. Die Datei wurde bereits gelöscht" -ForegroundColor Gray
        Write-Host "  3. Die Installation ist noch nicht abgeschlossen" -ForegroundColor Gray
        Write-Host ""
        Write-Host "🔎 Suche in Container-Logs..." -ForegroundColor Yellow
        Write-Host ""
        
        # Suche in Logs
        $logs = docker logs timetracking-backend 2>&1 | Select-String -Pattern "Admin Email|Temporary Password" -Context 0,1
        
        if ($logs) {
            Write-Host "Gefundene Credentials in Logs:" -ForegroundColor Green
            Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
            $logs | ForEach-Object { Write-Host $_.Line -ForegroundColor White }
            Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
        } else {
            Write-Host "❌ Keine Credentials in den Logs gefunden!" -ForegroundColor Red
            Write-Host ""
            Write-Host "Vollständige Logs anzeigen mit:" -ForegroundColor Yellow
            Write-Host "  docker logs timetracking-backend" -ForegroundColor Gray
        }
    }

} catch {
    Write-Host "❌ Fehler beim Abrufen der Credentials: $_" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""
Write-Host "📝 Nächste Schritte:" -ForegroundColor Cyan
Write-Host "  1. Melden Sie sich an: http://localhost:3002" -ForegroundColor White
Write-Host "  2. Ändern Sie sofort Ihr Passwort!" -ForegroundColor White
Write-Host "  3. Löschen Sie die Credentials-Datei:" -ForegroundColor White
Write-Host "     docker exec timetracking-backend rm /tmp/admin-credentials.txt" -ForegroundColor Gray
Write-Host ""
