@echo off
setlocal EnableDelayedExpansion

echo ============================================
echo  ACE - Pembuat APK dari PWA
echo ============================================
echo.

if "%JAVA_HOME%"=="" (
  echo JAVA_HOME belum diatur. Pasang JDK 17 lalu atur JAVA_HOME.
  exit /b 1
)
if "%ANDROID_HOME%"=="" (
  echo ANDROID_HOME belum diatur. Pasang Android SDK Command Line Tools lalu atur ANDROID_HOME.
  exit /b 1
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
  echo Build gagal. Lihat pesan di atas, biasanya JDK atau SDK belum lengkap.
  exit /b 1
)

echo.
echo Selesai. Cari berkas .apk di folder app\build\outputs\apk\release\
endlocal
