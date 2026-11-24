# APK ACE

Folder ini berisi dua jalur APK. Jalur utama menghasilkan APK offline dari aset ACE yang dibungkus WebView. Jalur lama memakai Bubblewrap TWA dan masih menunggu host HTTPS aktif.

## Jalur utama: APK offline

Berkas jadi ada di `offline/ACE-offline.apk`.

Fakta hasil build:

- Nama paket: `com.nhiux.ace`
- Ukuran: 133042 byte
- SHA-256: `F4CC3CF4129BB769A55222C37D162D6B1E6E8DD6D89E72836348362BC04D0241`
- MinSdk: 24
- TargetSdk: 36
- Tanda tangan: APK Signature Scheme v2 dan v3, terverifikasi dengan `apksigner verify`
- Isi: `index.html`, `styles.css`, `js/`, `fonts/`, `icons/`, `manifest.webmanifest`, `sw.js`, dan `classes.dex`

APK ini tidak memerlukan host HTTPS, Play Store, atau `assetlinks.json`. Aset ACE disalin ke dalam APK dan disajikan ke WebView pada origin `https://appassets.androidplatform.net`. Alat lokal, Poppins, dan ikon tersedia tanpa jaringan. Pengiriman ke model tetap terjadi hanya saat tombol kirim ditekan.

### Cara build ulang

Dari folder `output/antigravity-studio`:

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\android\offline\build-offline-apk.ps1
```

Skrip mencari JDK 17, SDK Android, build-tools 35.0.0 atau 36.1.0, dan platform android-36 atau android-35. Skrip menyalin aset, mengompilasi sumber daya, mengompilasi `MainActivity.java`, membuat `classes.dex`, memasukkan aset dengan jalur garis miring maju, menyelaraskan APK, lalu menandatanganinya.

Kunci tanda tangan dibuat sekali di `offline/ace-offline.keystore` dengan alias `androiddebugkey`. Berkas itu sengaja tidak dimasukkan repository karena repo ini publik. Simpan salinannya di tempat aman kalau kamu mau memperbarui APK dengan nama paket dan tanda tangan yang sama. Kunci ini untuk pemakaian lokal, bukan untuk Play Store.

### Struktur jalur offline

```text
android/offline/
  ACE-offline.apk
  ace-offline.keystore
  AndroidManifest.xml
  build-offline-apk.ps1
  src/com/nhiux/ace/MainActivity.java
  res/
  assets/
  build/
```

Folder `assets/` dan `build/` dihasilkan skrip dan boleh dihapus. Skrip akan membuatnya lagi.

## Jalur lama: TWA dengan host HTTPS

Folder `android/build-apk.bat` dan `android/twa-manifest.json` dipakai untuk Trusted Web Activity. Jalur ini belum dijalankan karena `twa-manifest.json` masih memakai `REPLACE_WITH_YOUR_HTTPS_HOST` dan belum ada host HTTPS aktif.

Yang perlu ada di Windows:

1. JDK 17. Skrip mencari JDK di `%ProgramFiles%\ojdkbuild`, `%ProgramFiles%\Java`, dan `%ProgramFiles%\Eclipse Adoptium`.
2. Android SDK Command Line Tools di `%LOCALAPPDATA%\Android\Sdk`.
3. Node.js 20 atau lebih baru, karena skrip memakai `npx`.
4. Platform Android, build-tools, dan platform-tools. Skrip akan memasangnya bila belum ada.

Lalu:

1. Publikasikan folder utama ACE ke HTTPS dan pastikan `manifest.webmanifest` bisa dibuka.
2. Buka Command Prompt di folder `android`.
3. Jalankan `build-apk.bat`.
4. Masukkan host HTTPS tanpa `https://`.
5. Skrip membuat proyek Trusted Web Activity, lalu menyusun APK.

Bubblewrap akan mencetak sidik jari sertifikat `SHA-256`. Salin ke `assetlinks-template.json`, lalu simpan sebagai `.well-known/assetlinks.json` di akar situs dan deploy ulang. Panduan lengkap ada di `../CLOUDFLARE.md`.

## Cara paling mudah tanpa APK

Kalau tujuanmu hanya memakai ACE di HP sendiri, PWA bawaan Chrome lebih praktis:

1. Publikasikan folder utama ACE ke host HTTPS.
2. Buka alamat itu di Chrome Android.
3. Menu Chrome, pilih Add to Home screen atau Install app.

Hasilnya tampil seperti aplikasi biasa dan bisa dipakai tanpa internet setelah cache terisi.
