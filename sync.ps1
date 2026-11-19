param(
    [string]$Message = "Update project"
)
$time = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
$commitMsg = if ($Message -eq "Update project") { "Update: $time" } else { $Message }

git add -A
$status = git status --porcelain
if ($status) {
    git commit -m $commitMsg
    git push origin main
    Write-Host "Changes successfully pushed to GitHub!" -ForegroundColor Green
} else {
    Write-Host "No changes to commit. Everything is up to date." -ForegroundColor Yellow
    git push origin main
}
