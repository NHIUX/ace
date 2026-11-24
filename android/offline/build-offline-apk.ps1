$ErrorActionPreference = "Stop"

$offline = $PSScriptRoot
$android = Split-Path -Parent $offline
$project = Split-Path -Parent $android

$jdk = $env:JAVA_HOME
if (-not $jdk -or -not (Test-Path $jdk)) {
  $jdk = "C:\Program Files\ojdkbuild\java-17-openjdk-17.0.3.0.6-1"
}
$env:JAVA_HOME = $jdk
$env:PATH = "$jdk\bin;$env:PATH"

$sdk = $env:ANDROID_HOME
if (-not $sdk -or -not (Test-Path $sdk)) {
  $sdk = Join-Path $env:LOCALAPPDATA "Android\Sdk"
}
$buildToolsRoot = Join-Path $sdk "build-tools"
$buildTools = @("35.0.0", "36.1.0") | ForEach-Object { Join-Path $buildToolsRoot $_ } | Where-Object { Test-Path $_ } | Select-Object -First 1
$platformRoot = Join-Path $sdk "platforms"
$platform = @("android-36", "android-35") | ForEach-Object { Join-Path $platformRoot $_ } | Where-Object { Test-Path $_ } | Select-Object -First 1

if (-not (Test-Path $buildTools)) { throw "Build-tools Android tidak ditemukan di $buildToolsRoot" }
if (-not (Test-Path $platform)) { throw "Platform Android tidak ditemukan di $platformRoot" }

$aapt2 = Join-Path $buildTools "aapt2.exe"
$d8 = Join-Path $buildTools "d8.bat"
if (-not (Test-Path $d8)) { $d8 = Join-Path $buildTools "d8.exe" }
$zipalign = Join-Path $buildTools "zipalign.exe"
$apksigner = Join-Path $buildTools "apksigner.bat"
if (-not (Test-Path $apksigner)) { $apksigner = Join-Path $buildTools "apksigner.exe" }
$androidJar = Join-Path $platform "android.jar"
$javac = Join-Path $jdk "bin\javac.exe"
$jar = Join-Path $jdk "bin\jar.exe"
$keytool = Join-Path $jdk "bin\keytool.exe"

$assets = Join-Path $offline "assets"
$build = Join-Path $offline "build"
$classes = Join-Path $build "classes"
$dex = Join-Path $build "dex"
$gen = Join-Path $build "gen"
$compiled = Join-Path $build "compiled.zip"
$unsigned = Join-Path $build "ace-unsigned.apk"
$aligned = Join-Path $build "ace-aligned.apk"
$apk = Join-Path $offline "ACE-offline.apk"
$keystore = Join-Path $offline "ace-offline.keystore"
$javaFile = Join-Path $offline "src\com\nhiux\ace\MainActivity.java"
$manifest = Join-Path $offline "AndroidManifest.xml"
$res = Join-Path $offline "res"

foreach ($dir in @($assets, $build, $classes, $dex, $gen)) {
  if (Test-Path $dir) { Remove-Item $dir -Recurse -Force }
  New-Item -ItemType Directory -Path $dir -Force | Out-Null
}

foreach ($item in @("index.html", "styles.css", "manifest.webmanifest", "sw.js", "icons", "fonts", "js")) {
  Copy-Item (Join-Path $project $item) (Join-Path $assets $item) -Recurse -Force
}

foreach ($density in @("mdpi", "hdpi", "xhdpi", "xxhdpi")) {
  $target = Join-Path $res "mipmap-$density"
  New-Item -ItemType Directory -Path $target -Force | Out-Null
  Copy-Item (Join-Path $project "icons\icon-192.png") (Join-Path $target "ic_launcher.png") -Force
}
$xxxhdpi = Join-Path $res "mipmap-xxxhdpi"
New-Item -ItemType Directory -Path $xxxhdpi -Force | Out-Null
Copy-Item (Join-Path $project "icons\icon-512.png") (Join-Path $xxxhdpi "ic_launcher.png") -Force

& $aapt2 compile --dir $res -o $compiled
if ($LASTEXITCODE -ne 0) { throw "Gagal mengompilasi sumber daya Android" }

& $aapt2 link -o $unsigned -I $androidJar --manifest $manifest --java $gen --min-sdk-version 24 --target-sdk-version 36 $compiled
if ($LASTEXITCODE -ne 0) { throw "Gagal merangkai APK" }

& $javac -source 17 -target 17 -classpath $androidJar -d $classes $javaFile
if ($LASTEXITCODE -ne 0) { throw "Gagal mengompilasi MainActivity" }

$classFiles = Get-ChildItem $classes -Recurse -Filter "*.class" | ForEach-Object { $_.FullName }
& $d8 --lib $androidJar --output $dex @classFiles
if ($LASTEXITCODE -ne 0) { throw "Gagal membuat classes.dex" }

Push-Location $dex
& $jar uf $unsigned "classes.dex"
Pop-Location
if ($LASTEXITCODE -ne 0) { throw "Gagal memasukkan classes.dex" }

Add-Type -AssemblyName System.IO.Compression
Add-Type -AssemblyName System.IO.Compression.FileSystem
$archive = [System.IO.Compression.ZipFile]::Open($unsigned, [System.IO.Compression.ZipArchiveMode]::Update)
foreach ($file in Get-ChildItem $assets -Recurse -File) {
  $relative = $file.FullName.Substring($assets.Length).TrimStart('\', '/').Replace('\', '/')
  $entryName = "assets/$relative"
  $existing = $archive.GetEntry($entryName)
  if ($existing) { $existing.Delete() }
  $entry = $archive.CreateEntry($entryName, [System.IO.Compression.CompressionLevel]::Optimal)
  $destination = $entry.Open()
  $source = [System.IO.File]::OpenRead($file.FullName)
  $source.CopyTo($destination)
  $source.Dispose()
  $destination.Dispose()
}
$archive.Dispose()

if (Test-Path $aligned) { Remove-Item $aligned -Force }
& $zipalign -f -p 4 $unsigned $aligned
if ($LASTEXITCODE -ne 0) { throw "Gagal menyelaraskan APK" }

if (-not (Test-Path $keystore)) {
  & $keytool -genkeypair -v -storetype JKS -keystore $keystore -alias androiddebugkey -keyalg RSA -keysize 2048 -validity 10000 -storepass android -keypass android -dname "CN=ACE, OU=ACE, O=NHIUX, L=Palembang, ST=Sumatera Selatan, C=ID"
  if ($LASTEXITCODE -ne 0) { throw "Gagal membuat kunci tanda tangan" }
}

if (Test-Path $apk) { Remove-Item $apk -Force }
& $apksigner sign --ks $keystore --ks-key-alias androiddebugkey --ks-pass pass:android --key-pass pass:android --out $apk $aligned
if ($LASTEXITCODE -ne 0) { throw "Gagal menandatangani APK" }

& $apksigner verify --verbose $apk
if ($LASTEXITCODE -ne 0) { throw "Verifikasi APK gagal" }

$file = Get-Item $apk
$hash = Get-FileHash $apk -Algorithm SHA256
"APK: $($file.FullName)"
"Ukuran: $($file.Length) byte"
"SHA-256: $($hash.Hash)"
