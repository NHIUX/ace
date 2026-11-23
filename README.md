# ACE

ACE adalah ruang kerja kreatif portabel untuk satu pemilik. Berjalan di browser Android dan Windows, tidak perlu laptop menyala, tidak perlu jaringan yang sama.

Nama sebelumnya Antigravity Studio sudah diganti seluruhnya menjadi ACE. Folder proyek sengaja tidak diganti supaya tautan dan skrip lama tidak rusak.

Versi ini berbeda dari `output/antigravity-desk/`. Versi lama memakai server Bun di laptop dan hanya bisa dibuka lewat localhost atau jaringan lokal. ACE adalah PWA statis yang dipasang di perangkat.

## Yang bisa dilakukan

- Tujuh peran kerja: UI/UX Designer, Graphic Designer, Frontend Developer, Writer, Copywriting, Content Creator, Content Planner. Tiap peran punya checklist, keluaran, catatan, dan template prompt.
- Ide cepat di Beranda untuk menampung ide sebelum masuk kalender atau naskah.
- Antislop: memindai em dash, buzzword, CTA generik, angka tanpa konteks, emoji dekoratif, kata isian, tanda seru berulang, dan kalimat panjang. Tombol versi bersih melakukan penggantian yang aman, lalu hasil tetap perlu dibaca ulang.
- Prompt Lab: 24 template, pencarian, filter peran, komposer, prompt sendiri, dan pengiriman opsional ke model.
- Content Planner: kalender tujuh hari dengan navigasi minggu, kanal, dan status selesai.
- Writer: sinopsis, catatan tokoh, daftar bab, target dan hitungan kata yang kamu isi sendiri.
- Aset & Warna: palet dengan peran warna, pengecekan kontras, dan potongan kode.
- Data & Setelan: ekspor JSON, ekspor Markdown, impor JSON, tema terang dan gelap, penghapusan data.

Semua alat di atas berjalan lokal di browser. Tidak ada akun, tidak ada pengiriman otomatis, tidak ada data bawaan yang dikarang.

## Rekomendasi publikasi gratis

Pilihan terbaik: **Cloudflare Pages yang terhubung ke repository GitHub**.

Alasannya:

- Gratis untuk penggunaan pribadi.
- HTTPS otomatis, syarat wajib agar PWA bisa dipasang di Android.
- Tidak perlu menyalakan komputer, tidak ada server yang diurus.
- Bisa memakai repository publik kalau mau benar-benar open source, atau privat kalau mau tetap sendiri.
- Bisa memakai domain sendiri nanti.

Cara deploy:

1. Buat repository GitHub, lalu unggah isi folder ini.
2. Di Cloudflare Pages, buat project baru dan hubungkan repository itu.
3. Build command dikosongkan. Output directory diisi `.` atau folder tempat `index.html` berada.
4. Setelah selesai, salin alamat `https://...pages.dev`.

Alternatif:

- **GitHub Pages**: paling sederhana dan cocok untuk repo publik. Alamatnya `https://<user>.github.io/<repo>/`. Kekurangannya, repo gratis harus publik.
- **Netlify**: juga gratis dan mudah, cocok kalau kamu lebih nyaman memakai drag and drop.

Saya belum mempublikasikan apa pun karena belum ada alamat hosting dan kredensial dari kamu.

## Bisa menghasilkan uang?

Bisa, tetapi jangan mengharapkan uang dari berkas statisnya sendiri. Yang realistis:

- Menjual paket prompt, template desain, atau checklist kerja yang dibuat dengan ACE.
- Memakai ACE untuk mempercepat pekerjaan desain, copywriting, atau content planning yang dibayar.
- Menaruh tautan afiliasi untuk alat desain yang memang kamu pakai, dengan label yang jelas.
- Menerima sponsorship setelah ada audiens nyata.
- Menambahkan fitur berlangganan di kemudian hari, tetapi itu butuh backend, sistem pembayaran, dan perawatan.

Kalau kode aplikasi dijadikan open source, orang lain bisa menyalin dan memakainya. Nilai yang bisa kamu jual biasanya ada pada kurasi, merek, dan layanan, bukan pada kode mentahnya.

Saya tidak menambahkan angka penghasilan, janji pendapatan, atau statistik palsu.

## Menjalankan di komputer

Opsional, hanya untuk mencoba sebelum dipublikasikan.

```bash
cd output/antigravity-studio
bun run server.js
```

Buka `http://localhost:4180`. Server ini hanya penyaji berkas statis. Tidak ada logika bisnis di server.

## Memasang di Android

### Cara PWA, tanpa APK

1. Buka alamat HTTPS ACE di Chrome Android.
2. Tunggu halaman termuat penuh sekali dengan internet. Ini mengisi cache service worker.
3. Buka menu Chrome, lalu pilih Add to Home screen atau Install app.
4. Buka ikon ACE dari layar utama. Alat lokal tetap bisa dipakai tanpa internet setelah langkah ke-2 berhasil.

### Cara APK

Folder `android/` berisi `build-apk.bat` dan `twa-manifest.json`, bukan APK jadi. Mesin yang dipakai membuat proyek ini tidak punya Java dan Android SDK, jadi saya tidak bisa menghasilkan berkas `.apk` di sini.

Untuk membuat APK, ikuti `android/README.md`. Perlu JDK 17, Android SDK, dan alamat HTTPS yang sudah aktif. Saya sengaja tidak membuat berkas APK palsu atau mengklaim sudah jadi.

isi folder yang perlu dipublikasikan:

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

## Koneksi ke model AI

Pengaturan ada di Prompt Lab. Tersedia preset OpenAI compatible, Gemini, Anthropic compatible, dan endpoint sendiri. Kunci API dan endpoint disimpan di `localStorage` perangkat ini dengan kunci `ace-v2`.

Yang perlu diketahui:

- Pemanggilan dilakukan langsung dari browser ke endpoint yang kamu isi. Banyak penyedia API memblokir permintaan lintas asal dari browser karena CORS. Kalau gagal, pakai endpoint proxy milikmu yang mengizinkan origin aplikasi ini.
- Kunci API tidak disembunyikan oleh aplikasi ini. Jangan dipakai di perangkat bersama.
- Pengiriman hanya terjadi saat tombol Kirim ke model ditekan. Sebelum itu tidak ada permintaan keluar.
- Alat lokal tetap berfungsi kalau endpoint kosong atau gagal.

## Data dan cadangan

Data tersimpan di `localStorage` dengan kunci `ace-v2`. Kalau ada data lama dengan kunci `antigravity-studio-v2`, aplikasi memindahkannya otomatis saat dibuka pertama kali.

Data tidak tersinkron otomatis antar perangkat. Untuk berpindah:

1. Di perangkat lama, buka Data & Setelan, lalu unduh JSON.
2. Di perangkat baru, buka Data & Setelan, lalu impor JSON itu.

Impor mengganti data saat ini. Unduh cadangan dulu bila perlu. Tombol hapus semua data meminta konfirmasi dua kali.

## Font dan ikon

Font Poppins dipakai untuk seluruh antarmuka. Berkas font disimpan lokal di `fonts/` supaya tampilan tetap benar saat offline. Lisensi OFL ada di `fonts/OFL.txt`. Sumber: Google Fonts.

Ikon ACE memakai mahkota Ratu catur yang digambar ulang secara geometris. Ini identitas aplikasi sesuai permintaanmu, bukan aset pihak ketiga.

## Status pengujian

Lihat bagian pengujian di akhir `DESIGN.md`.
