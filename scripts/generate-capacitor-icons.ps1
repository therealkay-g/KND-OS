# Génère les icônes Android Capacitor à partir des assets KND OS.
# À lancer après `npx cap add android` (le dossier android/ doit exister).
$ErrorActionPreference = 'Stop'

$repoRoot = Split-Path -Parent $PSScriptRoot
$resRoot = Join-Path $repoRoot 'capacitor\android\app\src\main\res'
$iconSource = Join-Path $repoRoot 'assets\images\icon.png'
$foregroundSource = Join-Path $repoRoot 'assets\images\android-icon-foreground.png'

if (-not (Test-Path $iconSource)) { throw "Icône introuvable : $iconSource" }
if (-not (Test-Path $foregroundSource)) { throw "Foreground introuvable : $foregroundSource" }
if (-not (Test-Path $resRoot)) { throw "Ressources Android introuvables : $resRoot" }

Add-Type -AssemblyName System.Drawing

function Save-ResizedPng {
  param(
    [string]$Source,
    [string]$Destination,
    [int]$Size,
    [double]$Scale = 1.0
  )

  $sourceImage = [System.Drawing.Image]::FromFile($Source)
  try {
    $bitmap = New-Object System.Drawing.Bitmap($Size, $Size, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    try {
      $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
      try {
        $graphics.Clear([System.Drawing.Color]::Transparent)
        $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
        $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
        $graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality

        $drawSize = [int][math]::Round($Size * $Scale)
        $offset = [int][math]::Floor(($Size - $drawSize) / 2)
        $graphics.DrawImage($sourceImage, $offset, $offset, $drawSize, $drawSize)
      } finally {
        $graphics.Dispose()
      }
      $bitmap.Save($Destination, [System.Drawing.Imaging.ImageFormat]::Png)
    } finally {
      $bitmap.Dispose()
    }
  } finally {
    $sourceImage.Dispose()
  }
}

$densities = @{
  'mdpi' = 48
  'hdpi' = 72
  'xhdpi' = 96
  'xxhdpi' = 144
  'xxxhdpi' = 192
}

foreach ($entry in $densities.GetEnumerator()) {
  $folder = Join-Path $resRoot "mipmap-$($entry.Key)"
  New-Item -ItemType Directory -Force -Path $folder | Out-Null
  Save-ResizedPng -Source $iconSource -Destination (Join-Path $folder 'ic_launcher.png') -Size $entry.Value
  Save-ResizedPng -Source $iconSource -Destination (Join-Path $folder 'ic_launcher_round.png') -Size $entry.Value
}

$foregroundDensities = @{
  'mdpi' = 108
  'hdpi' = 162
  'xhdpi' = 216
  'xxhdpi' = 324
  'xxxhdpi' = 432
}

foreach ($entry in $foregroundDensities.GetEnumerator()) {
  $folder = Join-Path $resRoot "mipmap-$($entry.Key)"
  Save-ResizedPng -Source $foregroundSource -Destination (Join-Path $folder 'ic_launcher_foreground.png') -Size $entry.Value -Scale 0.68
}

$backgroundFile = Join-Path $resRoot 'values\ic_launcher_background.xml'
@"
<?xml version="1.0" encoding="utf-8"?>
<resources>
    <color name="ic_launcher_background">#FFC300</color>
</resources>
"@ | Set-Content -Path $backgroundFile -Encoding UTF8

Write-Host 'Icônes Android KND OS générées.'
