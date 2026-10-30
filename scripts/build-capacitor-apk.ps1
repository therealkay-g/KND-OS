# Build APK Android de KND OS via Capacitor (sans EAS).
# L'app Expo est exportée en web, puis emballée dans une WebView Android.
# Prérequis : Node.js, JDK 17, Android SDK 34 + build-tools 34.0.0.
param(
  [switch]$SkipExport
)

$ErrorActionPreference = 'Stop'

$repoRoot = Split-Path -Parent $PSScriptRoot
$capRoot = Join-Path $repoRoot 'capacitor'
$webDir = Join-Path $repoRoot 'dist-capacitor'
$apkOut = Join-Path $repoRoot 'dist\knd-os-0.1.0-capacitor-debug.apk'

$sdkRoot = if ($env:ANDROID_HOME) { $env:ANDROID_HOME } else { Join-Path $env:LOCALAPPDATA 'KND-Android\android-sdk' }
$javaHome = if ($env:JAVA_HOME) { $env:JAVA_HOME } else { Join-Path $env:LOCALAPPDATA 'KND-Android\jdk\jdk-17.0.20.1+1' }

if (-not (Test-Path $sdkRoot)) { throw "SDK Android introuvable : $sdkRoot" }
if (-not (Test-Path $javaHome)) { throw "JDK 17 introuvable : $javaHome" }

$env:JAVA_HOME = $javaHome
$env:ANDROID_HOME = $sdkRoot
$env:ANDROID_SDK_ROOT = $sdkRoot
$env:PATH = "$javaHome\bin;$env:PATH"

$npm = (Get-Command npm.cmd -ErrorAction Stop).Source
$npx = (Get-Command npx.cmd -ErrorAction Stop).Source

if (-not $SkipExport) {
  Write-Host 'Export web KND OS...'
  Push-Location $repoRoot
  try {
    & $npx expo export --platform web --output-dir dist-capacitor
    if ($LASTEXITCODE -ne 0) { throw "L'export web Expo a échoué (code $LASTEXITCODE)." }
  } finally {
    Pop-Location
  }
}

if (-not (Test-Path (Join-Path $webDir 'index.html'))) {
  throw "Export web introuvable : $webDir\index.html"
}

if (-not (Test-Path (Join-Path $capRoot 'node_modules\@capacitor\android'))) {
  Write-Host 'Installation des dépendances Capacitor...'
  Push-Location $capRoot
  try {
    & $npm install
    if ($LASTEXITCODE -ne 0) { throw "npm install a échoué (code $LASTEXITCODE)." }
  } finally {
    Pop-Location
  }
}

$configTs = Join-Path $capRoot 'capacitor.config.ts'
$configJson = Join-Path $capRoot 'capacitor.config.json'
if (-not (Test-Path $configTs) -and -not (Test-Path $configJson)) {
  Write-Host 'Initialisation du projet Capacitor...'
  Push-Location $capRoot
  try {
    & $npx cap init 'KND OS' 'cd.knd.os' --web-dir '../dist-capacitor'
    if ($LASTEXITCODE -ne 0) { throw "cap init a échoué (code $LASTEXITCODE)." }
  } finally {
    Pop-Location
  }
}

$androidDir = Join-Path $capRoot 'android'
if (-not (Test-Path $androidDir)) {
  Write-Host 'Ajout de la plateforme Android...'
  Push-Location $capRoot
  try {
    & $npx cap add android
    if ($LASTEXITCODE -ne 0) { throw "cap add android a échoué (code $LASTEXITCODE)." }
  } finally {
    Pop-Location
  }
}

$iconScript = Join-Path $PSScriptRoot 'generate-capacitor-icons.ps1'
if (Test-Path $iconScript) {
  Write-Host 'Génération des icônes KND OS...'
  $LASTEXITCODE = 0
  & $iconScript
  if ($LASTEXITCODE -ne 0) { throw "La génération des icônes a échoué (code $LASTEXITCODE)." }
}

$appGradle = Join-Path $androidDir 'app\build.gradle'
if (Test-Path $appGradle) {
  $appGradleContent = Get-Content $appGradle -Raw
  $appGradleContent = $appGradleContent -replace 'versionName\s+"[^"]+"', 'versionName "0.1.0"'
  Set-Content -Path $appGradle -Value $appGradleContent -Encoding ASCII
}

$localProperties = Join-Path $androidDir 'local.properties'
$sdkDirValue = $sdkRoot -replace '\\', '/'
Set-Content -Path $localProperties -Value "sdk.dir=$sdkDirValue" -Encoding ASCII

$gradleProperties = Join-Path $androidDir 'gradle.properties'
$jvmArgs = 'org.gradle.jvmargs=-Xmx1024m -XX:MaxMetaspaceSize=512m'
$gradleContent = if (Test-Path $gradleProperties) { Get-Content $gradleProperties -Raw } else { '' }
if ($gradleContent -notmatch '(?m)^org\.gradle\.jvmargs=') {
  Add-Content -Path $gradleProperties -Value $jvmArgs
} else {
  $gradleContent = $gradleContent -replace '(?m)^org\.gradle\.jvmargs=.*$', $jvmArgs
  Set-Content -Path $gradleProperties -Value $gradleContent -Encoding ASCII
}

Write-Host 'Synchronisation des fichiers web vers Android...'
Push-Location $capRoot
try {
  & $npx cap sync android
  if ($LASTEXITCODE -ne 0) { throw "cap sync android a échoué (code $LASTEXITCODE)." }
} finally {
  Pop-Location
}

Write-Host 'Compilation de l''APK debug (sans daemon Gradle)...'
Push-Location $androidDir
try {
  & (Join-Path $androidDir 'gradlew.bat') assembleDebug --no-daemon --console=plain
  if ($LASTEXITCODE -ne 0) { throw "Gradle assembleDebug a échoué (code $LASTEXITCODE)." }
} finally {
  Pop-Location
}

$builtApk = Join-Path $androidDir 'app\build\outputs\apk\debug\app-debug.apk'
if (-not (Test-Path $builtApk)) { throw "APK introuvable : $builtApk" }

New-Item -ItemType Directory -Force -Path (Split-Path -Parent $apkOut) | Out-Null
Copy-Item $builtApk $apkOut -Force

$hash = (Get-FileHash $apkOut -Algorithm SHA256).Hash
$size = [math]::Round((Get-Item $apkOut).Length / 1MB, 2)
Write-Host ''
Write-Host "APK : $apkOut"
Write-Host "Taille : $size Mo"
Write-Host "SHA256 : $hash"
