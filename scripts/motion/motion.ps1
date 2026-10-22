# Motion pipeline wrapper: check | render | artifact | all
# Usage: powershell -ExecutionPolicy Bypass -File .\scripts\motion\motion.ps1 <cmd> motion\<name>\index.html
param(
    [ValidateSet('check', 'render', 'artifact', 'all')][string]$Command = 'all',
    [string]$File = 'motion\velloway-m84\index.html'
)
$ErrorActionPreference = 'Stop'
$here = Split-Path -Parent $MyInvocation.MyCommand.Path
$name = Split-Path -Leaf (Split-Path -Parent $File)
$out = Join-Path 'build\motion' $name
$globalRoot = (& npm root -g) 2>$null
$env:NODE_PATH = "$env:NODE_PATH;$(Join-Path (Get-Location) 'node_modules');$globalRoot"
node -e "require('playwright')" 2>$null
if ($LASTEXITCODE -ne 0) { Write-Error 'Playwright not found: npm i -D playwright; npx playwright install chromium' }

switch ($Command) {
    'check'    { node "$here\check-frames.cjs" $File "$out\qa" }
    'render'   { node "$here\render-video.cjs" $File "$out\$name.mp4" }
    'artifact' { node "$here\to-artifact.cjs" $File "$out\artifact.html" }
    'all'      {
        node "$here\check-frames.cjs" $File "$out\qa"
        node "$here\render-video.cjs" $File "$out\$name.mp4"
        node "$here\to-artifact.cjs" $File "$out\artifact.html"
    }
}
