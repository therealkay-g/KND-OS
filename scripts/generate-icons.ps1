# Génère les icônes KND OS (marque jaune #FFC300 sur noir #0A0A0A).
# Usage : powershell -ExecutionPolicy Bypass -File scripts/generate-icons.ps1

Add-Type -AssemblyName System.Drawing

$assets = Join-Path $PSScriptRoot '..\assets\images'

function New-RoundedRectPath {
  param([float]$x, [float]$y, [float]$w, [float]$h, [float]$r)
  $path = New-Object System.Drawing.Drawing2D.GraphicsPath
  $d = $r * 2
  $path.AddArc($x, $y, $d, $d, 180, 90)
  $path.AddArc($x + $w - $d, $y, $d, $d, 270, 90)
  $path.AddArc($x + $w - $d, $y + $h - $d, $d, $d, 0, 90)
  $path.AddArc($x, $y + $h - $d, $d, $d, 90, 90)
  $path.CloseFigure()
  return $path
}

function Draw-K {
  param(
    [System.Drawing.Graphics]$graphics,
    [float]$centerX,
    [float]$centerY,
    [float]$size,
    [System.Drawing.Color]$color,
    [float]$strokeWidth
  )
  $pen = New-Object System.Drawing.Pen($color, $strokeWidth)
  $pen.StartCap = [System.Drawing.Drawing2D.LineCap]::Round
  $pen.EndCap = [System.Drawing.Drawing2D.LineCap]::Round
  $pen.LineJoin = [System.Drawing.Drawing2D.LineJoin]::Round

  $top = $centerY - ($size * 0.46)
  $bottom = $centerY + ($size * 0.46)
  $stemX = $centerX - ($size * 0.24)
  $junctionX = $centerX - ($size * 0.08)
  $junctionY = $centerY
  $armX = $centerX + ($size * 0.38)

  $graphics.DrawLine($pen, $stemX, $top, $stemX, $bottom)
  $graphics.DrawLine($pen, $junctionX, $junctionY, $armX, $centerY - ($size * 0.38))
  $graphics.DrawLine($pen, $junctionX, $junctionY, $armX, $centerY + ($size * 0.38))
  $pen.Dispose()
}

function New-Canvas {
  param([int]$size, [bool]$transparent)
  $bitmap = New-Object System.Drawing.Bitmap($size, $size, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
  $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
  $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
  $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
  $graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
  if ($transparent) {
    $graphics.Clear([System.Drawing.Color]::Transparent)
  } else {
    $graphics.Clear([System.Drawing.ColorTranslator]::FromHtml('#0A0A0A'))
  }
  return @{ Bitmap = $bitmap; Graphics = $graphics }
}

# 1. Icône principale 1024x1024
$canvas = New-Canvas 1024 $false
$square = New-RoundedRectPath 192 192 640 640 148
$yellow = New-Object System.Drawing.SolidBrush([System.Drawing.ColorTranslator]::FromHtml('#FFC300'))
$canvas.Graphics.FillPath($yellow, $square)
Draw-K -graphics $canvas.Graphics -centerX 512 -centerY 512 -size 330 -color ([System.Drawing.ColorTranslator]::FromHtml('#0A0A0A')) -strokeWidth 64
$canvas.Bitmap.Save((Join-Path $assets 'icon.png'), [System.Drawing.Imaging.ImageFormat]::Png)
$yellow.Dispose(); $square.Dispose(); $canvas.Graphics.Dispose(); $canvas.Bitmap.Dispose()

# 2. Favicon 64x64
$canvas = New-Canvas 64 $false
$square = New-RoundedRectPath 6 6 52 52 13
$yellow = New-Object System.Drawing.SolidBrush([System.Drawing.ColorTranslator]::FromHtml('#FFC300'))
$canvas.Graphics.FillPath($yellow, $square)
Draw-K -graphics $canvas.Graphics -centerX 32 -centerY 32 -size 27 -color ([System.Drawing.ColorTranslator]::FromHtml('#0A0A0A')) -strokeWidth 5
$canvas.Bitmap.Save((Join-Path $assets 'favicon.png'), [System.Drawing.Imaging.ImageFormat]::Png)
$yellow.Dispose(); $square.Dispose(); $canvas.Graphics.Dispose(); $canvas.Bitmap.Dispose()

# 3. Splash 512x512 transparent (le fond noir vient de app.json)
$canvas = New-Canvas 512 $true
Draw-K -graphics $canvas.Graphics -centerX 256 -centerY 256 -size 330 -color ([System.Drawing.ColorTranslator]::FromHtml('#FFC300')) -strokeWidth 68
$canvas.Bitmap.Save((Join-Path $assets 'splash-icon.png'), [System.Drawing.Imaging.ImageFormat]::Png)
$canvas.Graphics.Dispose(); $canvas.Bitmap.Dispose()

# 4. Foreground Android 432x432 transparent (fond jaune adaptatif)
$canvas = New-Canvas 432 $true
Draw-K -graphics $canvas.Graphics -centerX 216 -centerY 216 -size 230 -color ([System.Drawing.ColorTranslator]::FromHtml('#0A0A0A')) -strokeWidth 46
$canvas.Bitmap.Save((Join-Path $assets 'android-icon-foreground.png'), [System.Drawing.Imaging.ImageFormat]::Png)
$canvas.Graphics.Dispose(); $canvas.Bitmap.Dispose()

# 5. Monochrome Android 432x432 transparent
$canvas = New-Canvas 432 $true
Draw-K -graphics $canvas.Graphics -centerX 216 -centerY 216 -size 230 -color ([System.Drawing.Color]::White) -strokeWidth 46
$canvas.Bitmap.Save((Join-Path $assets 'android-icon-monochrome.png'), [System.Drawing.Imaging.ImageFormat]::Png)
$canvas.Graphics.Dispose(); $canvas.Bitmap.Dispose()

Write-Host 'Icônes KND OS générées dans assets/images.'
