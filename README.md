# ACE

ACE adalah ruang kerja kreatif portabel untuk satu pemilik. Berjalan di browser Android dan Windows, tidak perlu laptop menyala, tidak perlu jaringan yang sama.

Nama sebelumnya Antigravity Studio sudah diganti seluruhnya menjadi ACE. Folder proyek sengaja tidak diganti supaya tautan dan skrip lama tidak rusak.

Versi ini berbeda dari `output/antigravity-desk/`. Versi lama memakai server Bun di laptop dan hanya bisa dibuka lewat localhost atau jaringan lokal. ACE adalah PWA statis yang dipasang di perangkat.

## Yang bisa dilakukan

### Sembilan bidang kerja

UI/UX Designer, Graphic Designer, Frontend Developer, Writer, Drafter, Editor, Content Creator, Content Planner, dan Admin. Nama peran sengaja dipertahankan dalam bahasa Inggris karena itu sebutan bidang yang diminta.

Tiap peran memuat delapan fungsi kerja, jadi 72 kapabilitas secara keseluruhan. Tiap kapabilitas punya:

- penjelasan fungsi dan keluaran yang diharapkan;
- alat pemeriksaan lokal yang jalan tanpa internet;
- prompt AI yang disusun otomatis dari fungsi dan bahan yang kamu tulis;
- kolom bahan kerja, hasil pemeriksaan, prompt, dan jawaban yang tersimpan per kapabilitas.

Contoh fungsi: riset pengguna, alur dan kondisi UI, audit aksesibilitas, palet dan kontras, markup semantik, performa, struktur bab, konsistensi istilah, notulen, matriks prioritas, dan masih banyak lagi.

### Tujuh alat pendukung

Beranda, Content Planner kalender mingguan, Writer pengelola bab, Aset & Warna, Antislop, AI & Prompt, serta Data & Setelan.

### Alat lokal tanpa AI

Tersedia 15 pemeriksaan deterministik: pola teks generik, teks pendek, pertanyaan riset, klaim dan angka, struktur, markup, kondisi antarmuka, responsif, performa, palet, kontras pasangan, jadwal, matriks prioritas, konsistensi istilah, dan kelengkapan dokumen. Pemeriksaan ini hanya membaca teks yang kamu tempel. Tidak ada permintaan keluar.

Antislop juga menyediakan tombol versi bersih yang mengganti pola yang aman. Hasilnya tetap perlu dibaca ulang.

### Navigasi dan tampilan

Klik logo Ratu di header untuk mengecilkan navigasi kiri sampai hanya ikon yang tersisa. Klik lagi untuk mengembalikannya. Di layar sempit, tombol Ratu membuka dialog sembilan peran dan tujuh alat. Sakelar tema memakai matahari untuk terang dan bulan untuk gelap.

Seluruh antarmuka memakai Poppins yang disimpan lokal.

## Koneksi ke model AI

OpenCode adalah agent utama di mesin pengembang. ACE tidak menanam OpenCode sebagai library. Jalur dari ACE memakai HTTP API OpenCode: membuat sesi, mengantre prompt, menunggu agent selesai, lalu membaca jawaban assistant.

Yang tersedia di pengaturan AI & Prompt:

- OpenCode lewat HTTP API dengan direktori kerja opsional;
- OpenAI compatible;
- Google Gemini;
- Anthropic compatible;
- endpoint sendiri lewat proxy atau bridge milikmu.

Kunci dan endpoint disimpan di `localStorage` perangkat ini dengan kunci `ace-v2`. Aturan penting:

- Pengiriman baru terjadi saat tombol **Kirim ke AI** ditekan. Sebelum itu tidak ada permintaan keluar.
- Semua alat lokal tetap berfungsi tanpa koneksi.
- Banyak penyedia menolak permintaan lintas asal dari browser. Untuk OpenCode, server harus aktif dan mengizinkan origin ACE. Kalau CORS ditolak, pakai bridge di origin yang sama.
- Kunci API tidak disembunyikan oleh aplikasi ini. Jangan dipakai di perangkat bersama.

## Publikasi gratis

Kamu sudah memilih **Cloudflare Pages yang terhubung ke repository GitHub**. Panduan lengkap ada di `CLOUDFLARE.md`.

Alasan pilihan ini:

- gratis untuk penggunaan pribadi;
- HTTPS otomatis, syarat wajib agar PWA bisa dipasang di Android;
- tidak perlu menyalakan komputer, tidak ada server yang diurus;
- repository boleh publik untuk open source atau privat untuk pemakaian sendiri;
- domain sendiri bisa ditambahkan nanti.

Repository Git lokal sudah ada di branch `main`. Yang masih perlu kamu berikan adalah alamat repository GitHub dan akses akun Cloudflare. Saya belum mempublikasikan apa pun karena belum ada keduanya.

Alternatif kalau nanti berubah pikiran: GitHub Pages untuk repo publik, atau Netlify untuk deploy seret dan lepas.

## Bisa menghasilkan uang?

Bisa, tetapi jangan mengharapkan uang dari berkas statisnya sendiri. Yang realistis:

- menjual paket prompt, template desain, atau daftar cek kerja yang dibuat dengan ACE;
- memakai ACE untuk mempercepat pekerjaan desain, penulisan, atau perencanaan konten yang dibayar;
- menaruh tautan afiliasi untuk alat yang memang kamu pakai, dengan label jelas;
- menerima sponsorship setelah ada audiens nyata;
- menambahkan langganan di kemudian hari, tetapi itu butuh backend, pembayaran, dan perawatan.

Kalau kode dibuka sebagai open source, orang lain bisa menyalin dan memakainya. Nilai yang bisa dijual biasanya ada pada kurasi, merek, dan layanan, bukan kode mentahnya. Tidak ada angka penghasilan atau klaim pendapatan di aplikasi maupun dokumentasi.

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
2. Buka alamat itu di Chrome Android dan tunggu halaman termuat penuh sekali dengan internet. Ini mengisi cache service worker.
3. Buka menu Chrome, lalu pilih Add to Home screen atau Install app.
4. Buka ikon ACE dari layar utama. Alat lokal tetap bisa dipakai tanpa internet setelah cache terisi.

### Cara APK

Folder `android/` berisi `build-apk.bat` dan `twa-manifest.json`, bukan APK jadi. Build biner belum dijalankan karena butuh host HTTPS aktif yang menyediakan `https://HOST/manifest.webmanifest`.

Toolchain sudah siap di mesin ini: Node.js 26.13.1, JDK 17.0.3, dan Android SDK command line tools di `%LOCALAPPDATA%\Android\Sdk\cmdline-tools\latest`. Skrip akan memasang platform Android 35, build-tools, dan platform-tools bila belum ada.

Ikuti `android/README.md` setelah host HTTPS aktif. Saya sengaja tidak membuat berkas APK palsu atau mengklaim sudah jadi.

Isi folder yang perlu dipublikasikan:

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

1. Di perangkat lama, buka Data & Setelan, lalu unduh JSON atau Markdown.
2. Di perangkat baru, buka Data & Setelan, lalu impor JSON itu.

Impor mengganti data saat ini. Unduh cadangan dulu bila perlu. Tombol hapus semua data meminta konfirmasi dua kali.

## Status pengujian

Ringkasan dan bukti ada di bagian pengujian `DESIGN.md`.

Sudah diverifikasi: semua modul dan sembilan peran, 72 kapabilitas, sakelar Ratu, alat lokal, susun prompt, jalur galat AI, ekspor, tema, dialog, cache lokal, lebar 390/768/1294px, serta Lighthouse terang dan gelap 1,00 untuk Accessibility, Best Practices, dan SEO.

Belum diuji: pemasangan di perangkat Android fisik, pemanggilan model sungguhan dengan kredensial milikmu, build APK biner, dan deploy ke host publik. Semua itu menunggu host, akun, endpoint, atau perangkat dari kamu.
