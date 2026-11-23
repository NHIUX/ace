# Panduan deploy ACE ke Cloudflare Pages

Pilihan ini sudah kamu pilih. Saya belum bisa menyelesaikan deploy sampai ada repository GitHub dan akses akun Cloudflare-mu. Berkas ini berisi langkah pastinya, tanpa alamat atau kredensial rekaan.

## 1. Siapkan repository GitHub

1. Buka GitHub, buat repository baru. Nama bebas, misalnya `ace`.
2. Pilih publik kalau mau benar-benar open source. Pilih privat kalau mau tetap sendiri. Cloudflare Pages bisa memakai keduanya.
3. Jangan centang README, license, atau `.gitignore` saat membuat repo karena berkas ACE sudah disiapkan di sini.
4. Salin alamat repository, biasanya bentuknya `https://github.com/<user>/<repo>.git`.

## 2. Hubungkan repository lokal

Repository lokal ACE sudah saya siapkan di folder ini dengan satu commit awal. Dari Command Prompt di folder `output/antigravity-studio`, jalankan:

```bash
git remote add origin https://github.com/<user>/<repo>.git
git branch -M main
git push -u origin main
```

Kalau GitHub meminta login, pakai Personal Access Token atau GitHub CLI yang sudah diautentikasi. Saya tidak menyimpan token di berkas mana pun.

## 3. Hubungkan ke Cloudflare Pages

1. Masuk ke Cloudflare Dashboard.
2. Pilih Workers & Pages, lalu Create application, lalu Pages, lalu Connect to Git.
3. Pilih GitHub, lalu izinkan akses ke repository ACE.
4. Pilih repository itu.
5. Setelan build:
   - Project name: bebas, misalnya `ace`.
   - Production branch: `main`.
   - Build command: kosongkan.
   - Build output directory: isi dengan `.` karena `index.html` ada di akar repository.
   - Root directory: kosongkan.
6. Klik Save and Deploy.

Setelah selesai, Cloudflare memberi alamat `https://<project>.pages.dev`. Alamat itu nyata setelah deploy, jadi saya tidak mengarangnya di sini.

## 4. Verifikasi setelah deploy

Buka alamat `https://<project>.pages.dev` di Chrome Android.

1. Pastikan judul halaman `ACE, Ruang Kerja Kreatif Portabel`.
2. Tunggu halaman termuat penuh sekali dengan internet supaya service worker mengisi cache.
3. Buka menu Chrome, lalu pilih Add to Home screen atau Install app.
4. Buka ikon ACE dari layar utama.
5. Matikan internet, lalu pastikan alat lokal masih bisa dipakai.

## 5. Lanjut ke APK biner

Setelah alamat HTTPS aktif:

1. Buka `android/twa-manifest.json`.
2. Ganti `REPLACE_WITH_YOUR_HTTPS_HOST` dengan host asli, tanpa `https://`.
3. Jalankan `android/build-apk.bat` dari folder `android`.
4. Masukkan host yang sama ketika skrip bertanya.

Skrip memakai `npx --yes @bubblewrap/cli`. Node.js sudah dipasang di mesin ini. JDK 17 dan Android SDK juga sedang dipasang atau disiapkan.

## Catatan open source

Kalau repo publik, siapa pun bisa membaca kode dan memakai ulang desainnya. Itu sesuai arah open source friendly. Kunci API tidak pernah tersimpan di repository. Data pengguna tetap berada di `localStorage` perangkat masing-masing.

Monetisasi tidak diotomatisasi di sini. Yang bisa kamu jual adalah paket prompt, template, jasa desain atau copywriting, afiliasi alat yang memang kamu pakai, atau sponsorship. Tidak ada klaim pendapatan di aplikasi maupun dokumentasi.
