# Design Read, ACE

Ruang kerja kreatif portabel untuk satu pemilik, dibaca sebagai alat kerja harian yang dipakai di layar kecil maupun besar, dalam bahasa visual hangat dan tenang. Dial: **ENERGY 1 / RHYTHM 2 / MOTION 1**.

Arah diambil dari permintaan pengguna: minimalis, siap pakai, dan bertumpu pada ketenangan alih-alih dekorasi. Claude dipakai sebagai patokan rasa, bukan sebagai tampilan untuk ditiru. Tidak ada gradien, glow, emoji dekoratif, atau tipografi monospace besar.

## Identitas

- Nama: ACE. Nama sebelumnya Antigravity Studio sudah diganti di seluruh antarmuka, manifest, judul halaman, berkas ekspor, dan dokumentasi.
- Motif: mahkota Ratu pada pion catur, digambar ulang secara geometris. Dipakai di header dan ikon PWA. Alasannya supaya aplikasi punya tanda yang jelas dan tidak memakai simbol AI generik.
- Suara: langsung, ramah, tanpa klaim. Kalimat pendek, kata kerja spesifik, tidak ada buzzword.

## Warna

| Peran | Hex | Alasan |
|---|---|---|
| Latar kertas | `#F5F4EE` | Hangat dan tidak menyilaukan saat dipakai lama. |
| Permukaan | `#FFFFFF` | Membedakan panel dari latar tanpa bayangan tebal. |
| Teks utama | `#1F1E1B` | Kontras tinggi di atas kertas dan permukaan. |
| Teks sekunder | `#6B675E` | Masih terbaca sebagai penjelas, bukan sebagai isi utama. |
| Garis | `#E3DED3` | Pemisah lembut yang selaras dengan latar hangat. |
| Aksen | `#B85C38` | Satu warna coral untuk fokus, tombol utama, dan status. Dipakai jarang supaya tetap bermakna. |
| Aksen lembut | `#F6E8E0` | Latar untuk item aktif, cukup terang untuk teks gelap. |

Tema gelap memakai pasangan nilai yang diuji terpisah: latar `#191817`, permukaan `#242220`, teks `#F5F1E8`, teks sekunder `#B6AFA4`, garis `#3A3733`, aksen `#E29268`, aksen lembut `#35271F`. Aksen gelap sengaja lebih terang supaya kontras tetap memadai di atas permukaan gelap.

Batasan warna dipatuhi: dua warna netral inti, satu aksen, sisanya turunan netral.

## Tipografi

- Font tunggal: Poppins untuk seluruh antarmuka, termasuk judul, isi, label, dan kode pendek.
- Berkas font disimpan lokal di `fonts/poppins-400.woff2`, `poppins-500.woff2`, `poppins-600.woff2`, dan `poppins-700.woff2`. Lisensi OFL ada di `fonts/OFL.txt`. Sumber: Google Fonts.
- Font 400 dan 600 dimuat lebih awal lewat `link rel="preload"` supaya teks pertama tidak berkedip.
- Ukuran isi 15px dengan tinggi baris 1,6. Judul memakai weight 600 dan 700 dengan letter spacing `-0.015em`. Tidak ada uppercase lebar untuk label, tidak ada monospace dekoratif.

## Tata letak

- Desktop: header penuh setinggi 78px, rel kiri 240px untuk delapan modul, area kerja di kanan.
- Area kerja memakai lebar maksimal 1180px dan margin tengah. Panel memakai padding 26px, radius 12px, dan garis 1px.
- Jarak antar panel memakai skala tetap: 6, 10, 14, 20, 26, dan 34px. White space diatur lewat skala ini, bukan angka acak per komponen.
- Layar 960px ke bawah: rel disembunyikan, navigasi bawah lima tombol muncul, header melekat di atas.
- Layar 620px ke bawah: kolom penuh, panel padding 20px 16px, tombol dalam baris menjadi lebar penuh, kalender minggu menjadi satu kolom.
- Kartu dipakai hanya untuk mengelompokkan isi yang benar-benar terpisah. Tidak ada bento grid, tidak ada hero, tidak ada bagian yang hanya mengisi template.
- Satu titik fokus per layar. Di Beranda, fokus berjalan berada di kartu dengan garis aksen. Di modul lain, judul panel pertama menjadi fokus.

RHYTHM 2 diwujudkan oleh pola yang konsisten, dengan beberapa penyimpangan yang disengaja: kartu fokus, kalender minggu tujuh kolom di layar lebar, dan swatch palet.

## Gerak

MOTION 1. Tidak ada animasi masuk, scroll reveal, parallax, atau elemen mengambang. Satu-satunya gerak adalah perubahan warna saat hover dan geser 1px saat tombol ditekan. Itu pun dimatikan kalau sistem meminta pengurangan gerak. Tidak ada gerak lebih dari 5 detik.

## Komponen dan alasan

- Tombol minimal 44px tinggi, termasuk dua tombol sakelar tema. Sumber aturan ini adalah kebutuhan pemakaian di Android.
- Sakelar tema memakai dua ikon, matahari untuk terang dan bulan untuk gelap. Tiap tombol punya `aria-label` dan `aria-pressed`. Tidak ada teks "Terang" atau "Gelap" di header.
- Fokus keyboard memakai outline 3px berwarna aksen dengan offset 3px. Tidak ada penghapusan outline.
- Panel memakai garis 1px, bukan bayangan. Bayangan hanya dipakai sekali di kartu fokus untuk menandakan prioritas.
- Badge dipakai untuk status nyata: peran aktif, hasil kontras, tingkat temuan. Tidak ada badge "AI Powered" atau "New".
- Empty state memakai garis putus-putus dan kalimat yang menyebut tindakan berikutnya.
- Status bar muncul saat ada notifikasi dan hilang sendiri untuk pesan sukses. Pesan error tetap tampil sampai kondisi berubah.
- Dialog ruang kerja bisa ditutup dengan tombol Tutup, klik di luar, atau Escape.

## Keadaan dan ketahanan

- Kosong: daftar fokus, checklist, jadwal, bab, potongan kode, dan hasil pemeriksaan punya teks kosong sendiri.
- Memuat: tombol kirim ke model menampilkan "Mengirim..." dan dinonaktifkan. Ini satu-satunya proses yang menunggu jaringan.
- Error: pengiriman model, impor gagal, dan penyimpanan gagal memunculkan pesan di status bar. Halaman tidak kosong karena alat lokal tetap tersedia.
- Tema: dua tema memakai variabel yang sama. Tidak ada gaya yang hanya berlaku di satu tema kecuali warna tombol utama, yang disesuaikan agar teks tetap terbaca.
- Keyboard: semua kontrol berupa elemen native. Dialog memakai `dialog` sehingga Escape berfungsi tanpa kode tambahan.
- Penyimpanan: kunci utama `ace-v2`. Data lama dengan kunci `antigravity-studio-v2` dipindahkan otomatis sekali saat aplikasi dibuka.

## Ikon

`icons/icon.svg` dan turunan PNG 192px serta 512px memakai mahkota Ratu catur. Ini identitas final sesuai permintaan pengguna, bukan aset pihak ketiga. Tidak ada foto, avatar, atau gambar orang.

## Keputusan ringkas

- Kenapa kertas hangat: mengurangi silau dan membedakan alat ini dari dashboard gelap pada umumnya.
- Kenapa Poppins di semua tempat: satu font keluarga merapikan ritme antarmuka dan tetap jelas di layar HP.
- Kenapa satu aksen: memudahkan mata menemukan tindakan utama di layar kecil.
- Kenapa ikon Ratu: memberi nama dan wujud yang tidak generik, sesuai permintaan pengguna.
- Kenapa tidak ada animasi masuk: alat kerja dibuka berkali-kali, gerak berulang mengganggu.
- Kenapa data di perangkat: laptop bisa mati dan jaringan bisa berbeda, jadi tidak ada server yang bisa dijadikan andalan.
- Kenapa model opsional: sebagian besar alat tidak butuh jaringan, dan kunci API tidak aman bila dibundling.

## Pengujian

Dijalankan di `http://localhost:4180` dengan Bun 1.3.14 dan Chromium bawaan aplikasi. Semua angka di bawah berasal dari pengukuran atau pengamatan langsung setelah perubahan ACE selesai.

### Pembuktian klik per modul

- Beranda: tambah fokus muncul di daftar, centang berubah ke keadaan selesai, hapus menghilangkan baris, catatan cepat tersimpan di `localStorage`, ide baru tersimpan dan bisa dihapus.
- Studio Peran: klik pintasan mengganti peran ke Frontend Developer, langkah baru muncul, centang berfungsi, hapus berfungsi, catatan peran tersimpan, tombol Pakai membuka Prompt Lab dengan isi template.
- Antislop: teks uji menghasilkan temuan Em dash, buzzword, CTA generik, angka tanpa konteks, dan emoji. Tombol versi bersih mengubah `revolutionary` menjadi `baru`, `effortless` menjadi `mudah`, merapikan tanda seru, dan menghapus emoji. Tombol Pakai sebagai draf mengganti isi textarea.
- Prompt Lab: 24 prompt tampil, pencarian `kontras` menyisakan 2 hasil, filter Writer menyisakan 3 hasil, pengaturan model tersimpan, komposer menghasilkan prompt, prompt sendiri tersimpan lalu berhasil dihapus setelah perbaikan tombol Hapus.
- Pengiriman model: endpoint `http://127.0.0.1:9/nope` sengaja dipakai. Status bar menampilkan `Gagal menghubungi model: Failed to fetch`, area jawaban kosong, tombol kembali aktif. Tidak ada permintaan sebelum tombol ditekan.
- Content Planner: tujuh hari tampil, unggahan baru muncul, minggu berikutnya dan kembali ke hari ini berfungsi, centang dan hapus berfungsi.
- Writer: bab baru tersimpan, perubahan status dan jumlah kata tercatat, target kata tersimpan, ringkasan menampilkan angka dari data yang diisi.
- Aset & Warna: empat swatch awal, warna baru bertambah, kontras `#1F1E1B` di atas `#F5F4EE` dilaporkan AAA 15,13:1, potongan kode tersimpan dan dihapus, swatch bisa dihapus.
- Data & Setelan: ekspor JSON menghasilkan `ace-data.json`, ekspor Markdown menghasilkan `ace-data.md`, impor JSON mengganti data dan menampilkan pesan sukses, tombol hapus meminta konfirmasi dua kali lalu mengosongkan data.
- Dialog: tombol Kerja membuka dialog, tombol Tutup dan Escape menutupnya.
- Tema: sakelar matahari dan bulan di header mengganti terang dan gelap, `aria-pressed` mengikuti tema aktif, nilai tersimpan di `ace-v2`. Tombol Terang dan Gelap di Data & Setelan juga mengubah header secara bersamaan.
- Navigasi: delapan modul utama tampil tanpa pesan "Tampilan gagal". Judul halaman mengikuti modul yang dipilih.

### Pembuktian build dan pemuatan

- `bun build js/app.js --target=browser`, `bun build sw.js --target=browser`, dan `bun build server.js --target=bun` lolos tanpa error.
- Browser memuat ACE tanpa console error. `document.title` bernilai `ACE, Ruang Kerja Kreatif Portabel`, teks merek bernilai `ACE`.
- `document.fonts.check('400 15px Poppins')` bernilai `true`. Font terdeteksi Poppins, berat judul 700, padding panel 26px, radius panel 12px, lebar area kerja maksimal 1180px, tinggi header 78px.
- Satu-satunya kunci `localStorage` yang dipakai adalah `ace-v2`. Migrasi dari `antigravity-studio-v2` berhasil dalam pengujian sebelumnya.
- Cache service worker bernama `ace-v2-2`. Ke-15 entri shell terverifikasi di cache, termasuk empat berkas Poppins, ikon SVG, ikon 192px, dan ikon 512px. Strategi cache adalah network-first dengan fallback cache.

### Perbaikan yang ditemukan saat pengujian

- Prompt buatan sendiri awalnya tidak punya tombol Hapus karena pengecekan ID memakai awalan `custom`. Sekarang pengecekan memakai daftar prompt sendiri.
- Ekspor Markdown awalnya melempar `ReferenceError: c is not defined` karena `map` menerima dua argumen. Sekarang memakai `flatMap`.
- Variabel tema gelap awalnya juga terpasang pada tombol yang membawa atribut `data-theme="night"`, sehingga tombol itu berlatar gelap dengan teks gelap. Sekarang selector dibatasi ke `:root[data-theme="night"]`.
- Warna aksen untuk teks awalnya memakai aksen yang sama dengan garis dan latar, kontrasnya 3,79:1. Sekarang teks memakai `--accent-ink` dengan kontras 6,23:1 di atas aksen lembut.
- Pola angka tanpa sumber awalnya gagal membaca bentuk `10K+ users`. Sekarang pola mencakup singkatan K, M, B, tanda persen, dan tanda tambah.
- Tombol sakelar tema awalnya berukuran 40x38px dan 38x36px di layar kecil. Sekarang kedua tombol 44x44px di semua lebar, sesuai aturan target sentuh.
- Nama, judul, manifest, dan berkas ekspor awalnya masih memakai Antigravity Studio. Sekarang semuanya memakai ACE. Kunci penyimpanan dan cache juga ikut diganti, dengan migrasi data lama.

### Responsif dan aksesibilitas

- Iframe lebar 390px: overflow 0, rel tersembunyi, navigasi bawah tampil, tombol terkecil 44px, kedua tombol tema 44x44px, font Poppins terdeteksi.
- Iframe lebar 768px: overflow 0, rel tersembunyi, navigasi bawah tampil, tombol terkecil 44px, kedua tombol tema 44x44px, font Poppins terdeteksi.
- Iframe lebar 1294px: overflow 0, rel tampil, navigasi bawah tersembunyi, tombol terkecil 44px, kedua tombol tema 44x44px, font Poppins terdeteksi.
- Lighthouse tema terang setelah redesign: Accessibility 1,00, Best Practices 1,00, SEO 1,00, tanpa temuan gagal.
- Lighthouse tema gelap setelah redesign: Accessibility 1,00, Best Practices 1,00, SEO 1,00, tanpa temuan gagal.
- Alat Lighthouse yang dipakai mengaudit aksesibilitas, best practices, dan SEO. Audit tidak menjalankan tolok ukur performa atau emulasi perangkat.
- Focus outline terlihat, dialog native bisa ditutup dengan Escape, semua kontrol memakai elemen dengan nama yang terbaca.

### Yang belum diuji

- Pemasangan sungguhan di Chrome Android belum bisa dilakukan dari workspace ini karena tidak ada perangkat tersambung. Perlu dicoba setelah aplikasi dipublikasikan ke HTTPS.
- Pemanggilan model sungguhan belum diuji karena tidak ada kunci API dan endpoint milik pengguna. Hanya jalur error yang diuji.
- Berkas APK biner belum dihasilkan karena mesin ini tidak punya Java, Android SDK, dan Gradle. Yang ada adalah proyek dan skrip build di folder `android/`.
- Publikasi ke host publik belum dilakukan karena host dan kredensial belum dipilih atau diberikan.
- Pengukuran Core Web Vitals lapangan tidak dilakukan karena tidak ada data pengguna nyata.
