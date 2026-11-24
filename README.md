# ACE

ACE adalah ruang kerja kreatif portabel untuk satu pemilik. Berjalan di browser Android dan Windows, tidak perlu laptop menyala, tidak perlu jaringan yang sama.

Nama sebelumnya Antigravity Studio sudah diganti seluruhnya menjadi ACE. Folder proyek sengaja tidak diganti supaya tautan dan skrip lama tidak rusak.

Versi ini berbeda dari `output/antigravity-desk/`. Versi lama memakai server Bun di laptop. ACE adalah PWA statis yang bisa dipasang di perangkat.

## Yang bisa dilakukan

### Sembilan bidang kerja

UI/UX Designer, Graphic Designer, Frontend Developer, Writer, Drafter, Editor, Content Creator, Content Planner, dan Admin. Tiap peran memuat delapan fungsi kerja, jadi 72 kapabilitas.

Tiap kapabilitas punya penjelasan dan keluaran, alat pemeriksaan lokal, prompt AI yang disusun otomatis, serta kolom bahan, hasil, prompt, dan jawaban yang tersimpan per kapabilitas.

Layout tiap peran berbeda sesuai fungsinya. UX memakai alur tiga kolom, Graphic memakai pita palet, Frontend memakai editor kode, Writer memakai punggung bab, Drafter memakai lembar dokumen, Editor memakai dua panel diff, Creator memakai dinding ide, Planner memakai kalender minggu, dan Admin memakai panel fokus serta data.

### Tujuh menu lama sudah dihapus

Beranda dan Data & Setelan masuk Admin. Content Planner dan Writer menjadi peran tersendiri. Aset & Warna masuk Graphic Designer dan Frontend Developer. Antislop menjadi kapabilitas pada peran yang membutuhkannya. AI & Prompt masuk dialog AI di header. Navigasi kiri sekarang hanya sembilan bidang kerja.

### Alat lokal tanpa AI

Tersedia 15 pemeriksaan deterministik: pola teks generik, teks pendek, pertanyaan riset, klaim dan angka, struktur, markup, kondisi antarmuka, responsif, performa, palet, kontras pasangan, jadwal, matriks prioritas, konsistensi istilah, dan kelengkapan dokumen. Pemeriksaan ini hanya membaca teks yang kamu tempel. Tidak ada permintaan keluar.

Antislop juga menyediakan tombol versi bersih. Hasilnya tetap perlu dibaca ulang.

### Navigasi dan tampilan

Klik logo Ratu di header untuk mengecilkan navigasi kiri sampai hanya ikon. Klik lagi untuk mengembalikannya. Di layar sempit, tombol Ratu membuka dialog sembilan peran. Bottom nav memuat lima peran: UX, Grafis, Kode, Rencana, dan Admin.

Tombol AI di header membuka dialog pengaturan model, prompt sendiri, dan composer. Sakelar tema memakai matahari untuk terang dan bulan untuk gelap. Seluruh antarmuka memakai Poppins yang disimpan lokal.

## Koneksi ke model AI

ACE tidak menanam OpenCode sebagai library. Jalur dari ACE memakai HTTP API OpenCode: membuat sesi, mengantre prompt, menunggu agent selesai, lalu membaca jawaban assistant.

Penyedia yang tersedia di dialog AI:

- OpenCode lewat HTTP API dengan direktori kerja opsional;
- OpenAI compatible;
- Google Gemini;
- Anthropic compatible;
- endpoint sendiri lewat proxy atau bridge milikmu.

Kunci dan endpoint disimpan di `localStorage` perangkat dengan kunci `ace-v2`. Aturan penting:

- Pengiriman baru terjadi saat tombol kirim ditekan. Sebelum itu tidak ada permintaan keluar.
- Semua alat lokal tetap berfungsi tanpa koneksi.
- Banyak penyedia menolak permintaan lintas asal dari browser. Untuk OpenCode, server harus aktif dan mengizinkan origin ACE. Kalau CORS ditolak, pakai bridge di origin yang sama.
- Kunci API tidak disembunyikan oleh aplikasi ini. Jangan dipakai di perangkat bersama.

## Publikasi gratis

Kamu memilih Cloudflare Pages yang terhubung ke repository GitHub `NHIUX/ace`. Repository itu sudah publik dan remote `origin` sudah terpasang di folder proyek ini. Panduan lengkap ada di `CLOUDFLARE.md`.

Setelan yang dipakai: project `ace`, production branch `main`, build command kosong, output directory `.`.

Sampai sesi ini berakhir, deploy belum selesai karena belum ada sesi Cloudflare yang terautentikasi dan belum ada variabel `CLOUDFLARE_API_TOKEN` atau `CLOUDFLARE_ACCOUNT_ID`. Percobaan `wrangler whoami` tidak menghasilkan sesi aktif. Tidak ada alamat `pages.dev` yang dikarang di sini.

## Bisa menghasilkan uang?

Bisa, tetapi jangan mengharapkan uang dari berkas statisnya sendiri. Yang realistis:

- menjual paket prompt, template desain, atau daftar cek kerja yang dibuat dengan ACE;
- memakai ACE untuk mempercepat pekerjaan desain, penulisan, atau perencanaan konten yang dibayar;
- menaruh tautan afiliasi untuk alat yang memang kamu pakai, dengan label jelas;
- menerima sponsorship setelah ada audiens nyata;
- menambahkan langganan di kemudian hari, tetapi itu butuh backend, pembayaran, dan perawatan.

Kode dibuka sebagai open source. Nilai yang bisa dijual biasanya ada pada kurasi, merek, dan layanan, bukan kode mentahnya. Tidak ada angka penghasilan atau klaim pendapatan di aplikasi maupun dokumentasi.

## Menjalankan di komputer

Opsional, hanya untuk mencoba sebelum dipublikasikan.

```bash
cd output/antigravity-studio
bun run server.js
```

Buka `http://localhost:4180`. Server ini hanya penyaji berkas statis. Tidak ada logika bisnis di server.

## Memasang di Android

### Cara PWA, tanpa APK

1. Publikasikan folder utama ACE ke alamat HTTPS.
2. Buka alamat itu di Chrome Android dan tunggu halaman termuat penuh sekali dengan internet.
3. Buka menu Chrome, lalu pilih Add to Home screen atau Install app.
4. Buka ikon ACE dari layar utama. Alat lokal tetap bisa dipakai tanpa internet setelah cache terisi.

### Cara APK offline

`android/offline/ACE-offline.apk` sudah dibuat. APK ini membungkus aset ACE di WebView, jadi tidak butuh host HTTPS, Play Store, atau `assetlinks.json`. Ini APK biner nyata dengan tanda tangan v2 dan v3, ukuran 133042 byte, SHA-256 `F4CC3CF4129BB769A55222C37D162D6B1E6E8DD6D89E72836348362BC04D0241`, nama paket `com.nhiux.ace`.

Cara membangun ulang:

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\android\offline\build-offline-apk.ps1
```

Skrip memakai JDK 17, Android SDK build-tools 35.0.0 atau 36.1.0, dan platform android-36 atau android-35. Kunci tanda tangan dibuat sekali di `android/offline/ace-offline.keystore` dan sengaja tidak dimasukkan repository publik. Simpan salinannya di tempat aman kalau kamu mau memperbarui APK dengan tanda tangan yang sama.

Jalur TWA lama lewat Bubblewrap masih ada di `android/build-apk.bat` dan `android/twa-manifest.json`. Jalur itu menunggu host HTTPS aktif dan belum dipakai untuk APK di atas.

Isi folder yang perlu dipublikasikan ke host statis:

```text
index.html
styles.css
manifest.webmanifest
sw.js
icons/
fonts/
js/
```

`server.js` dan `android/` tidak diperlukan host statis.

## Data dan cadangan

Data tersimpan di `localStorage` dengan kunci `ace-v2` dan versi data `2`. Data lama dengan kunci `antigravity-studio-v2` dipindahkan otomatis saat dibuka pertama kali.

Yang tersimpan: fokus, catatan cepat, catatan dan langkah tiap peran, ide, jadwal konten, naskah dan bab, palet, potongan kode, prompt sendiri, hasil alat per kapabilitas, peran aktif, kapabilitas aktif, lebar navigasi, tema, dan pengaturan model.

Data tidak tersinkron otomatis antar perangkat. Untuk berpindah:

1. Di perangkat lama, buka Admin, lalu unduh JSON atau Markdown.
2. Di perangkat baru, buka Admin, lalu impor JSON itu.

Impor mengganti data saat ini. Unduh cadangan dulu bila perlu. Tombol hapus semua data meminta konfirmasi dua kali.

## Status pengujian

Ringkasan dan bukti lengkap ada di `DESIGN.md` dan `DELIVERY-GATE.md`.

Sudah diverifikasi: build semua modul, sembilan peran dan layout berbeda, 72 kapabilitas, penghapusan tujuh menu lama, tombol Ratu, tambah hapus, alat lokal, susun prompt, jalur galat AI, ekspor, tema, dialog, cache `ace-v2-6`, lebar 390/768/1294px, APK offline, dan Lighthouse 1,00 untuk Accessibility, Best Practices, dan SEO pada tiga keadaan.

Belum diuji: pemasangan di perangkat fisik, pemanggilan model sungguhan dengan kredensial milikmu, dan deploy ke host publik. Semua itu menunggu perangkat, endpoint, atau akun dari kamu.
