# Pembuat APK ACE

Folder ini bukan APK jadi. Isinya adalah konfigurasi dan skrip untuk menghasilkan APK dari PWA setelah aplikasi dipublikasikan ke alamat HTTPS.

Saya tidak bisa menghasilkan berkas `.apk` di workspace ini karena mesin ini tidak memasang Java, Android SDK, atau Gradle. Jadi jangan mengira `twa-manifest.json` atau `build-apk.bat` adalah aplikasi yang bisa langsung dikirim ke HP.

## Cara paling mudah tanpa APK

Kalau tujuanmu hanya memakai ACE di HP sendiri, lebih praktis memakai install PWA bawaan Chrome:

1. Publikasikan folder utama ACE ke host HTTPS.
2. Buka alamat itu di Chrome Android.
3. Menu Chrome, pilih Add to Home screen atau Install app.

Hasilnya tampil seperti aplikasi biasa dan bisa dipakai offline. Ini tidak butuh JDK, SDK, atau Play Store.

## Cara menghasilkan APK

APK berguna kalau kamu ingin berkas yang bisa dibagikan langsung atau dipasang tanpa lewat menu browser.

Yang perlu dipasang di Windows:

1. JDK 17. Setelah dipasang, atur variabel `JAVA_HOME` ke folder JDK.
2. Android SDK Command Line Tools. Setelah dipasang, atur `ANDROID_HOME` ke folder SDK.
3. Node.js 20 atau lebih baru, karena skrip memakai `npx`.
4. Android SDK Platform 35 dan build-tools yang sesuai. Ini bisa dipasang lewat `sdkmanager`.

Lalu:

1. Publikasikan folder utama ACE ke HTTPS dan pastikan `manifest.webmanifest` bisa dibuka.
2. Buka Command Prompt di folder `android`.
3. Jalankan `build-apk.bat`.
4. Masukkan host HTTPS tanpa `https://`, misalnya `ace.pages.dev`.
5. Skrip akan membuat proyek Trusted Web Activity, lalu menyusun APK.

Berkas APK ada di `app\build\outputs\apk\release\`.

## Tanda tangan aplikasi

Bubblewrap akan membuat kunci tanda tangan saat inisialisasi. Simpan berkas `.keystore` dan kata sandinya. Kalau kunci hilang, kamu tidak bisa memperbarui APK dengan nama paket yang sama.

`com.nurhafit.ace` adalah nama paket contoh. Kalau mau menggantinya, ubah `packageName` di `twa-manifest.json` sebelum build, lalu sesuaikan juga saat inisialisasi.

## Isi twa-manifest.json

Berkas ini dipakai sebagai rujukan nilai warna, nama, dan identitas aplikasi. Nilai `REPLACE_WITH_YOUR_HTTPS_HOST` sengaja dibiarkan karena saya tidak mengarang alamat hosting. Isi dengan alamat aslimu setelah deploy.
