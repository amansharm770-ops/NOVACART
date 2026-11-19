# auto-sync.ps1 - Automatically monitors, commits, and pushes changes to GitHub
param (
    [int]$IntervalSeconds = 15
)

$repoRoot = (Get-Item $PSScriptRoot).FullName
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "  NovaCart GitHub Auto-Sync Active        " -ForegroundColor Cyan
Write-Host "  Repository: $repoRoot                   " -ForegroundColor Cyan
Write-Host "  Checking for changes every $IntervalSeconds seconds...  " -ForegroundColor Yellow
Write-Host "  (Press Ctrl + C in this terminal to stop)" -ForegroundColor Gray
Write-Host "==========================================" -ForegroundColor Cyan

while ($true) {
    Start-Sleep -Seconds $IntervalSeconds
    try {
        $status = git status --porcelain
        if ($status) {
            $time = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
            Write-Host "[$time] Changes detected! Syncing with GitHub..." -ForegroundColor Green
            git add -A
            git commit -m "Auto-sync: $time"
            git push origin main
            Write-Host "[$time] Successfully pushed to GitHub!" -ForegroundColor Cyan
        }
    }
    catch {
        Write-Host "Sync error: $_" -ForegroundColor Red
    }
}
