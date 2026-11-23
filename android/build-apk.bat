@echo off
setlocal EnableDelayedExpansion

echo ============================================
echo  ACE - Pembuat APK dari PWA
echo ============================================
echo.

rem Deteksi JDK 17 dari lokasi pemasangan umum bila JAVA_HOME kosong.
if "%JAVA_HOME%"=="" (
  for /d %%D in ("%ProgramFiles%\ojdkbuild\*") do if exist "%%~D\bin\java.exe" set "JAVA_HOME=%%~D"
)
if "%JAVA_HOME%"=="" (
  for /d %%D in ("%ProgramFiles%\Java\*") do if exist "%%~D\bin\java.exe" set "JAVA_HOME=%%~D"
)
if "%JAVA_HOME%"=="" (
  for /d %%D in ("%ProgramFiles%\Eclipse Adoptium\*") do if exist "%%~D\bin\java.exe" set "JAVA_HOME=%%~D"
)
if "%JAVA_HOME%"=="" (
  echo JAVA_HOME belum ditemukan. Pasang JDK 17 lalu atur JAVA_HOME.
  exit /b 1
)
echo JAVA_HOME : %JAVA_HOME%

rem Deteksi Android SDK di lokasi bawaan Android Studio dan command line tools.
if "%ANDROID_HOME%"=="" set "ANDROID_HOME=%LOCALAPPDATA%\Android\Sdk"
if "%ANDROID_HOME%"=="" (
  echo ANDROID_HOME belum ditemukan. Pasang Android SDK command line tools.
  exit /b 1
)
echo ANDROID_HOME: %ANDROID_HOME%

set "SDKMANAGER=%ANDROID_HOME%\cmdline-tools\latest\bin\sdkmanager.bat"
if not exist "%SDKMANAGER%" (
  echo sdkmanager tidak ditemukan di %SDKMANAGER%
  exit /b 1
)

where npx >nul 2>&1
if errorlevel 1 (
  echo npx belum tersedia. Pasang Node.js 20 atau lebih baru.
  exit /b 1
)

echo.
echo Menerima lisensi Android SDK.
(for /L %%i in (1,1,30) do @echo y) | call "%SDKMANAGER%" --licenses >nul 2>&1

if not exist "%ANDROID_HOME%\platforms\android-35" (
  echo Memasang platform Android 35, build-tools, dan platform-tools.
  call "%SDKMANAGER%" "platforms;android-35" "build-tools;35.0.0" "platform-tools"
  if errorlevel 1 (
    echo Gagal memasang paket Android SDK.
    exit /b 1
  )
)

set /p HOST=Masukkan host HTTPS ACE tanpa https:// dan tanpa garis miring, lalu Enter:
if "%HOST%"=="" (
  echo Host tidak boleh kosong.
  exit /b 1
)

echo.
echo Mengambil manifest dari https://%HOST%/manifest.webmanifest
npx --yes @bubblewrap/cli init --manifest=https://%HOST%/manifest.webmanifest
if errorlevel 1 (
  echo Inisialisasi gagal. Periksa alamat host dan koneksi internet.
  exit /b 1
)

echo.
echo Menyusun APK. Tunggu sampai selesai.
npx --yes @bubblewrap/cli build
if errorlevel 1 (
  echo Build gagal. Lihat pesan di atas.
  exit /b 1
)

echo.
echo Selesai. Cari berkas .apk di folder app\build\outputs\apk\release\
endlocal
