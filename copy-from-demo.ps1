Write-Host "🔄 Copying updated files from Demo-HRM to hospital-crm-pro-new..." -ForegroundColor Cyan
Write-Host "Excluding: Supabase configs, Vercel configs, Git configs" -ForegroundColor Yellow

$sourceDir = "..\Demo-HRM"
$destDir = "."

# Files and patterns to exclude
$excludePatterns = @(
    "src\config\supabase.ts",
    "src\config\supabaseNew.ts", 
    "vercel.json",
    ".git",
    ".gitignore",
    ".env",
    ".env.*",
    "backend\.env",
    "node_modules",
    "dist",
    "*.log",
    "package-lock.json"
)

Write-Host "📁 Copying files..." -ForegroundColor Green

# Function to check if file should be excluded
function Should-Exclude($filePath) {
    foreach ($pattern in $excludePatterns) {
        if ($filePath -like "*$pattern*" -or $filePath -like "*$pattern") {
            return $true
        }
    }
    return $false
}

# Copy files recursively, excluding specified patterns
function Copy-FilesExcluding($src, $dst) {
    $items = Get-ChildItem -Path $src -Recurse
    
    foreach ($item in $items) {
        $relativePath = $item.FullName.Substring($src.Length + 1)
        $destPath = Join-Path $dst $relativePath
        
        if (-not (Should-Exclude $relativePath)) {
            if ($item.PSIsContainer) {
                # Create directory if it doesn't exist
                if (-not (Test-Path $destPath)) {
                    New-Item -ItemType Directory -Path $destPath -Force | Out-Null
                }
            } else {
                # Copy file
                $destDir = Split-Path $destPath -Parent
                if (-not (Test-Path $destDir)) {
                    New-Item -ItemType Directory -Path $destDir -Force | Out-Null
                }
                Copy-Item $item.FullName $destPath -Force
                Write-Host "   ✅ $relativePath" -ForegroundColor DarkGreen
            }
        } else {
            Write-Host "   ❌ $relativePath (excluded)" -ForegroundColor DarkRed
        }
    }
}

$sourceFullPath = Resolve-Path $sourceDir
Copy-FilesExcluding $sourceFullPath.Path $destDir

Write-Host ""
Write-Host "✅ Copy completed!" -ForegroundColor Green
Write-Host ""
Write-Host "🔧 Preserving current configuration files:" -ForegroundColor Cyan
Write-Host "   ✅ .env (Supabase configuration)" -ForegroundColor Green
Write-Host "   ✅ src/config/supabase.ts" -ForegroundColor Green
Write-Host "   ✅ Git configuration" -ForegroundColor Green
Write-Host ""
Write-Host "📦 You may need to run 'npm install' if package.json was updated." -ForegroundColor Yellow