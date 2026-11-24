# Panduan deploy ACE ke Cloudflare Pages

Pilihan ini sudah kamu pilih. Repository GitHub `NHIUX/ace` sudah publik dan remote `origin` sudah terpasang di folder `output/antigravity-studio`. Deploy belum selesai karena belum ada sesi Cloudflare yang terautentikasi atau kredensial API di mesin ini. Berkas ini berisi langkah pastinya, tanpa alamat atau kredensial rekaan.

## 1. Repository GitHub

Fakta saat ini:

- Repository: `https://github.com/NHIUX/ace`
- Deskripsi: `ACE, ruang kerja kreatif portabel dan offline.`
- Branch: `main`
- Remote: `origin`

Perubahan terakhir sudah disiapkan untuk di-commit dan di-push. Kalau perlu memeriksa:

```bash
git status
git log -1 --oneline
git remote -v
git push -u origin main
```

`gh` tidak terpasang, jadi autentikasi GitHub memakai credential manager atau Personal Access Token bila diminta.

## 2. Hubungkan ke Cloudflare Pages

1. Masuk ke Cloudflare Dashboard.
2. Pilih Workers & Pages, lalu Create application, lalu Pages, lalu Connect to Git.
3. Pilih GitHub, lalu izinkan akses ke repository `NHIUX/ace`.
4. Pilih repository itu.
5. Setelan build:
   - Project name: `ace`
   - Production branch: `main`
   - Build command: kosongkan
   - Build output directory: isi dengan `.` karena `index.html` ada di akar repository
   - Root directory: kosongkan
6. Klik Save and Deploy.

Setelah selesai, Cloudflare memberi alamat `https://<project>.pages.dev`. Alamat itu nyata setelah deploy, jadi tidak ditulis di sini sebelum ada hasil.

## 3. Alternatif lewat Wrangler

Wrangler tidak tersedia di PATH dan percobaan lewat `npx --yes wrangler@latest whoami` tidak menghasilkan sesi aktif. Variabel `CLOUDFLARE_API_TOKEN`, `CF_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`, dan `CF_ACCOUNT_ID` juga tidak tersedia. Karena itu deploy otomatis dari sesi ini tidak bisa diselesaikan.

Kalau token tersedia nanti, set variabel lalu jalankan:

```bash
wrangler pages project create ace --production-branch main
wrangler pages deploy . --project-name ace --branch main
```

Jangan menaruh token di repository.

## 4. Verifikasi setelah deploy

Buka alamat `pages.dev` yang benar-benar diberikan Cloudflare di Chrome Android.

1. Pastikan judul halaman `ACE, Ruang Kerja Kreatif Portabel`.
2. Pastikan sembilan peran muncul di navigasi kiri di layar lebar.
3. Tunggu halaman termuat penuh sekali dengan internet supaya service worker mengisi cache `ace-v2-6`.
4. Buka menu Chrome, lalu pilih Add to Home screen atau Install app.
5. Buka ikon ACE dari layar utama.
6. Matikan internet, lalu pastikan alat lokal masih bisa dipakai.

## 5. APK

Untuk pemakaian langsung tanpa host HTTPS, pakai `android/offline/ACE-offline.apk` yang sudah dibuat dari aset lokal. Cara build ada di `android/README.md`.

Jalur TWA lama masih tersedia untuk versi yang memakai host HTTPS:

1. Buka `android/twa-manifest.json`.
2. Ganti `REPLACE_WITH_YOUR_HTTPS_HOST` dengan host asli, tanpa `https://`.
3. Jalankan `android/build-apk.bat` dari folder `android`.
4. Masukkan host yang sama ketika skrip bertanya.

Skrip memakai `npx --yes @bubblewrap/cli`. Toolchain sudah siap: Node.js 26.13.1 ada di `C:\Program Files\nodejs`, JDK 17.0.3 ada di `C:\Program Files\ojdkbuild`, dan Android SDK command line tools ada di `%LOCALAPPDATA%\Android\Sdk\cmdline-tools\latest`.

## 6. Asset Links untuk TWA

Langkah ini hanya diperlukan kalau memakai APK TWA, bukan APK offline.

1. Bubblewrap akan mencetak sidik jari sertifikat `SHA-256` setelah build pertama.
2. Buka `android/assetlinks-template.json`.
3. Ganti `REPLACE_WITH_SHA256_FINGERPRINT` dengan sidik jari asli.
4. Simpan berkas itu sebagai `.well-known/assetlinks.json` di akar repository.
5. Commit dan push supaya Cloudflare Pages menerbitkan ulang situs.

Tanpa langkah ini, TWA bisa tampil dengan bilah alamat browser.

## Catatan open source

Repository publik berarti siapa pun bisa membaca kode dan memakai ulang desainnya. Kunci API tidak pernah tersimpan di repository. Data pengguna tetap berada di `localStorage` perangkat masing-masing.

Monetisasi tidak diotomatisasi di sini. Tidak ada klaim pendapatan di aplikasi maupun dokumentasi.
