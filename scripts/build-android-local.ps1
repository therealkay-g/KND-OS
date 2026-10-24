# Build local Android APK without Expo/EAS.
# Requires JDK 17 and Android SDK in %LOCALAPPDATA%\KND-Android
# Usage: powershell -ExecutionPolicy Bypass -File scripts\build-android-local.ps1

param(
  [ValidateSet('Debug', 'Release')]
  [string]$Configuration = 'Release',
  [string]$Architecture = 'arm64-v8a'
)

$ErrorActionPreference = 'Stop'

$root = Join-Path $env:LOCALAPPDATA 'KND-Android'
$jdkHome = if (Test-Path (Join-Path $root 'jdk-home.txt')) {
  (Get-Content (Join-Path $root 'jdk-home.txt') -Raw).Trim()
} else {
  Join-Path $root 'jdk\jdk-17.0.20.1+1'
}
$sdkHome = Join-Path $root 'android-sdk'

if (-not (Test-Path (Join-Path $jdkHome 'bin\java.exe'))) {
  throw "JDK 17 introuvable : $jdkHome"
}
if (-not (Test-Path (Join-Path $sdkHome 'platforms'))) {
  throw "SDK Android introuvable : $sdkHome"
}

# Le SDK 37 preview s'installe dans platforms\android-37.0, alors qu'AGP
# recherche platforms\android-37. Créer une jonction rend le build reproductible.
$platformDir = Join-Path $sdkHome 'platforms\android-37'
$platformMinorDir = Join-Path $sdkHome 'platforms\android-37.0'
if (-not (Test-Path $platformDir) -and (Test-Path $platformMinorDir)) {
  New-Item -ItemType Junction -Path $platformDir -Target $platformMinorDir | Out-Null
}

$env:JAVA_HOME = $jdkHome
$env:ANDROID_HOME = $sdkHome
$env:ANDROID_SDK_ROOT = $sdkHome

$projectRoot = Split-Path -Parent $PSScriptRoot
$sourceRoot = $projectRoot

# Le chemin source contient un espace : CMake/Ninja produisent alors des
# chemins objets « KND_OS » invalides, et Node résout les jonctions vers le
# chemin physique. Il faut une copie réelle dans un chemin sans espace ; une
# jonction serait résolue par Node/CMake vers le chemin avec espace.
if ($projectRoot -match '\s') {
  $link = 'C:\KNDOS'
  if (Test-Path $link) {
    $linkItem = Get-Item $link -Force
    if ($linkItem.Attributes -band [IO.FileAttributes]::ReparsePoint) {
      cmd /c rmdir $link
    }
  }
  if (-not (Test-Path (Join-Path $link 'android'))) {
    New-Item -ItemType Directory -Force $link | Out-Null
    $excludes = @(
      '.cxx', '.next', '.expo', '.git', 'kindu-search',
      (Join-Path $projectRoot 'dist'),
      (Join-Path $projectRoot 'android\app\build\intermediates\cxx')
    )
    $roboArgs = @($projectRoot, $link, '/E', '/MT:16', '/R:1', '/W:1',
      '/NFL', '/NDL', '/NP', '/XD') + $excludes
    & robocopy @roboArgs
    if ($LASTEXITCODE -ge 8) {
      throw "Copie du projet vers $link échouée ($LASTEXITCODE)"
    }
  }
  if (-not (Test-Path (Join-Path $link 'android'))) {
    throw "Impossible de préparer la copie de build $link"
  }
  $projectRoot = $link
}

Set-Location $projectRoot

if (-not (Test-Path 'android\gradlew.bat')) {
  Write-Output 'Génération du projet natif Android...'
  & npx.cmd expo prebuild --platform android --no-install
  if ($LASTEXITCODE -ne 0) { throw "expo prebuild a échoué ($LASTEXITCODE)" }
}

# Gradle lit sdk.dir et cmake.dir depuis android/local.properties.
$sdkDir = $sdkHome.Replace('\', '/')
$props = "sdk.dir=$sdkDir"
# CMake 3.31.6 corrige les chemins objets trop longs sous Windows ; 3.22.1
# échoue sur react-native-reanimated si le chemin du projet est long.
$cmakeDir = Join-Path $root 'cmake-3.31.6\cmake-3.31.6-windows-x86_64'
if (-not (Test-Path (Join-Path $cmakeDir 'bin\cmake.exe'))) {
  $cmakeDir = Join-Path $sdkHome 'cmake\3.22.1'
}
if (Test-Path (Join-Path $cmakeDir 'bin\cmake.exe')) {
  $props += "`ncmake.dir=$($cmakeDir.Replace('\', '/'))"
}

# Expo fixe CMAKE_OBJECT_PATH_MAX=1024 pour les chemins d'objets longs.
# Ninja < 1.12 ne sait pas créer ces répertoires sous Windows (erreur
# « mkdir(...): No such file or directory »). Le Ninja du SDK Android 3.22.1
# est 1.10.2 : il faut celui de CMake 3.31.6, ou un ninja-win >= 1.12.1.
$ninja = Join-Path $cmakeDir 'bin\ninja.exe'
if (Test-Path $ninja) {
  $ninjaVersion = (& $ninja --version).Trim()
  $ninjaParts = $ninjaVersion.Split('.')
  $ninjaMajor = 0
  $ninjaMinor = 0
  [void][int]::TryParse($ninjaParts[0], [ref]$ninjaMajor)
  if ($ninjaParts.Length -gt 1) {
    [void][int]::TryParse($ninjaParts[1], [ref]$ninjaMinor)
  }
  if ($ninjaMajor -lt 1 -or ($ninjaMajor -eq 1 -and $ninjaMinor -lt 12)) {
    throw "Ninja $ninjaVersion détecté ($ninja). Ninja >= 1.12 requis pour les chemins d'objets longs Windows. Télécharger https://github.com/ninja-build/ninja/releases/download/v1.12.1/ninja-win.zip et remplacer bin\ninja.exe."
  }
}

$props | Set-Content 'android\local.properties' -Encoding ascii

Write-Output "Compilation Android ($Configuration)..."
Push-Location 'android'
try {
  & .\gradlew.bat "assemble$Configuration" -PreactNativeArchitectures=$Architecture --no-daemon --console=plain
  if ($LASTEXITCODE -ne 0) { throw "Gradle a échoué ($LASTEXITCODE)" }
} finally {
  Pop-Location
}

$apk = "android\app\build\outputs\apk\$($Configuration.ToLower())\app-$($Configuration.ToLower()).apk"
if (-not (Test-Path $apk)) { throw "APK introuvable : $apk" }

$realDist = Join-Path $sourceRoot 'dist'
New-Item -ItemType Directory -Force $realDist | Out-Null
$target = Join-Path $realDist "knd-os-0.1.0-$($Configuration.ToLower()).apk"
Copy-Item $apk $target -Force
$item = Get-Item $target
Write-Output "APK : $($item.FullName)"
Write-Output "Taille : $([math]::Round($item.Length / 1MB, 1)) Mo"
Write-Output "SHA256 : $((Get-FileHash $target -Algorithm SHA256).Hash)"
