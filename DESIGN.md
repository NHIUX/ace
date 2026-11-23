# Design Read, ACE

Ruang kerja kreatif portabel untuk satu pemilik, dibaca sebagai alat kerja harian yang dipakai di layar kecil maupun besar, dalam bahasa visual hangat dan tenang. Dial: **ENERGY 1 / RHYTHM 2 / MOTION 1**.

Arah diambil dari permintaan pengguna: minimalis, siap pakai, dan bertumpu pada ketenangan alih-alih dekorasi. Claude dipakai sebagai patokan rasa, bukan sebagai tampilan untuk ditiru. Tidak ada gradien, glow, emoji dekoratif, atau tipografi monospace besar.

## Identitas

- Nama: ACE. Nama sebelumnya Antigravity Studio sudah diganti di seluruh antarmuka, manifest, judul halaman, berkas ekspor, dan dokumentasi.
- Motif: mahkota Ratu pada pion catur, digambar ulang secara geometris. Dipakai di header dan ikon PWA. Tombol Ratu di header berfungsi sebagai sakelar lebar navigasi, bukan sekadar hiasan.
- Suara: langsung, ramah, tanpa klaim. Kalimat pendek, kata kerja spesifik, tidak ada kata jargon. Nama bidang kerja sengaja memakai sebutan bidang yang diminta pengguna, misalnya UI/UX Designer dan Content Planner.

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

- Desktop: header penuh setinggi 78px, rel kiri 252px yang berisi sembilan bidang kerja dan tujuh alat pendukung, area kerja di kanan.
- Klik Ratu mengecilkan rel menjadi 76px. Teks dan judul grup disembunyikan, ikon tetap tertata, dan label muncul saat kursor di atasnya atau saat fokus. Keadaan ini tersimpan di `ace-v2`.
- Area kerja memakai lebar maksimal 1180px dan margin tengah. Panel memakai padding 26px, radius 12px, dan garis 1px.
- Jarak antar panel memakai skala tetap: 6, 10, 14, 20, 26, dan 34px. White space diatur lewat skala ini, bukan angka acak per komponen.
- Layar 960px ke bawah: rel disembunyikan, navigasi bawah lima tombol muncul, header melekat di atas. Tombol Ratu membuka dialog berisi sembilan peran dan tujuh alat.
- Layar 620px ke bawah: kolom penuh, panel padding 20px 16px, tombol dalam baris menjadi lebar penuh, kalender minggu menjadi satu kolom, workbench menjadi satu kolom.
- Kartu dipakai hanya untuk mengelompokkan isi yang benar-benar terpisah. Tidak ada bento grid, tidak ada hero, tidak ada bagian yang hanya mengisi template.
- Satu titik fokus per layar. Di Beranda, fokus berjalan berada di kartu dengan garis aksen. Di peran, kartu kapabilitas yang dipilih dan workbench menjadi fokus.

RHYTHM 2 diwujudkan oleh pola yang konsisten, dengan beberapa penyimpangan yang disengaja: kartu fokus, kalender minggu tujuh kolom di layar lebar, dan swatch palet.

## Gerak

MOTION 1. Tidak ada animasi masuk, efek muncul saat gulir atau pergeseran latar, dan elemen mengambang. Satu-satunya gerak adalah perubahan warna saat kursor di atasnya dan geser 1px saat tombol ditekan. Itu pun dimatikan kalau sistem meminta pengurangan gerak. Tidak ada gerak lebih dari 5 detik.

## Komponen dan alasan

- Tombol minimal 44px tinggi, termasuk dua tombol sakelar tema dan tombol Ratu. Sumber aturan ini adalah kebutuhan pemakaian di Android.
- Sakelar tema memakai dua ikon, matahari untuk terang dan bulan untuk gelap. Tiap tombol punya `aria-label` dan `aria-pressed`. Keterangan "Tampilan" ditampilkan di desktop dan disembunyikan di layar sempit.
- Tombol rel memakai nama dari teks yang terlihat ketika rel penuh. Saat rel ringkas, teks disembunyikan dan `aria-label` dipasang supaya pembaca layar tetap mendapat nama. Ini menghindari nama aksesibel yang tidak cocok dengan teks terlihat.
- Fokus keyboard memakai outline 3px berwarna aksen dengan offset 3px. Tidak ada penghapusan outline.
- Panel memakai garis 1px, bukan bayangan. Bayangan hanya dipakai sekali di kartu fokus untuk menandakan prioritas.
- Kartu kapabilitas memakai ikon, nama fungsi, ringkasan, dan keluaran. Kartu aktif diberi garis aksen dan garis atas aksen.
- Workbench memisahkan bahan kerja dan alat lokal di satu kolom, serta prompt dan jawaban AI di kolom lain. Pemisahan ini menegaskan mana yang offline dan mana yang butuh koneksi.
- Penanda dipakai untuk status nyata: peran aktif, jumlah alat, hasil kontras, tingkat temuan. Tidak ada penanda "AI Powered" atau "New".
- Keadaan kosong memakai garis putus-putus dan kalimat yang menyebut tindakan berikutnya.
- Bilah status muncul saat ada notifikasi dan hilang sendiri untuk pesan sukses. Pesan galat tetap tampil sampai kondisi berubah.
- Dialog ruang kerja bisa ditutup dengan tombol Tutup, klik di luar, atau Escape.

## Keadaan dan ketahanan

- Kosong: daftar fokus, langkah, jadwal, bab, potongan kode, hasil alat, dan jawaban AI punya teks kosong sendiri.
- Memuat: tombol kirim ke model menampilkan "Mengirim..." dan dinonaktifkan. Ini satu-satunya proses yang menunggu jaringan.
- Galat: pengiriman model, impor gagal, dan penyimpanan gagal memunculkan pesan di bilah status. Halaman tidak kosong karena alat lokal tetap tersedia.
- Tema: dua tema memakai variabel yang sama. Tidak ada gaya yang hanya berlaku di satu tema kecuali warna tombol utama, yang disesuaikan agar teks tetap terbaca.
- Keyboard: semua kontrol berupa elemen native. Dialog memakai `dialog` sehingga Escape berfungsi tanpa kode tambahan.
- Penyimpanan: kunci utama `ace-v2`, versi data `2`. Data lama dengan kunci `antigravity-studio-v2` dipindahkan otomatis sekali saat aplikasi dibuka. Peran aktif, kapabilitas aktif, hasil alat, prompt, dan jawaban ikut tersimpan.
- AI: OpenCode dipakai sebagai agent utama lewat HTTP API. Koneksi ke penyedia lain bersifat opsional dan manual. Tidak ada permintaan otomatis saat halaman dibuka.

## Ikon

`icons/icon.svg` dan turunan PNG 192px serta 512px memakai mahkota Ratu catur. Ini identitas final sesuai permintaan pengguna, bukan aset pihak ketiga. Tidak ada foto, avatar, atau gambar orang.

## Keputusan ringkas

- Kenapa kertas hangat: mengurangi silau dan membedakan alat ini dari dashboard gelap pada umumnya.
- Kenapa Poppins di semua tempat: satu font keluarga merapikan ritme antarmuka dan tetap jelas di layar HP.
- Kenapa satu aksen: memudahkan mata menemukan tindakan utama di layar kecil.
- Kenapa ikon Ratu: memberi nama dan wujud yang tidak generik, sesuai permintaan pengguna.
- Kenapa Ratu bisa mengecilkan rel: navigasi sembilan peran perlu tetap kuat di desktop, tetapi area kerja perlu lebih lapang saat dipakai lama.
- Kenapa alat lokal dipisahkan dari AI: sebagian besar pekerjaan tidak butuh jaringan, dan kunci API tidak aman bila disimpan di aplikasi.
- Kenapa tidak ada animasi masuk: alat kerja dibuka berkali-kali, gerak berulang mengganggu.
- Kenapa data di perangkat: laptop bisa mati dan jaringan bisa berbeda, jadi tidak ada server yang bisa dijadikan andalan.

## Pengujian

Dijalankan di `http://localhost:4180` dengan Bun 1.3.14 dan Chromium bawaan aplikasi. Angka di bawah berasal dari pengukuran atau pengamatan langsung setelah perubahan ACE selesai.

### Pembuktian navigasi dan peran

- Rel menampilkan sembilan peran dan tujuh alat pendukung. Navigasi bawah menampilkan lima tombol.
- Kesembilan peran diklik satu per satu. Setiap peran menampilkan delapan kartu kapabilitas, judul halaman yang sesuai, konteks `peran / kapabilitas`, dan satu item navigasi aktif. Total 72 kapabilitas.
- Tombol Ratu mengecilkan rel dari 252px menjadi 76px, mengubah label menjadi "Perbesar navigasi", menyimpan keadaan di `ace-v2`, lalu mengembalikannya saat diklik lagi. Saat ringkas, `aria-label` dipasang dan teks tersembunyi.
- Di lebar 390px dan 768px, tombol Ratu membuka dialog. Dialog memuat 16 tombol, yakni sembilan peran dan tujuh alat, dan bisa ditutup.
- Tidak ada tampilan gagal dibuat di semua modul yang dikunjungi.

### Pembuktian alat kerja dan AI

- Kapabilitas "UX design dan alur" dipilih. Bahan kerja diisi, tombol "Periksa lokal" menghasilkan temuan kondisi fokus dan dinonaktifkan yang belum ditulis.
- Tombol "Susun prompt AI" menghasilkan prompt yang memuat fungsi kapabilitas dan bahan kerja milik pengguna.
- Bahan kerja, hasil pemeriksaan, dan prompt tersimpan di `ace-v2` di bawah kunci kapabilitas `ux-flow`.
- Jalur galat AI diuji dengan endpoint `http://127.0.0.1:9/v1/chat/completions`. Bilah status menampilkan `Gagal menghubungi AI: Failed to fetch`, area jawaban kosong, tombol kembali aktif, dan tidak ada pengecualian di konsol. Satu-satunya galat konsol berasal dari port yang sengaja diblokir browser.
- Pengaturan model dikembalikan ke preset OpenCode setelah pengujian. Tidak ada kunci API yang diisi.

### Pembuktian tampilan dan aksesibilitas

- `document.fonts.check('15px Poppins')` bernilai `true`. Font terdeteksi Poppins di body.
- Lighthouse: Accessibility 1,00, Best Practices 1,00, SEO 1,00, tanpa temuan gagal. Diuji pada tema gelap dengan rel penuh, tema gelap dengan rel ringkas, dan tema terang dengan rel penuh.
- Temuan awal `label-content-name-mismatch` pada 16 tombol rel diperbaiki dengan memakai teks terlihat sebagai nama aksesibel saat rel penuh, dan `aria-label` hanya saat rel ringkas.
- Tombol Ratu, dua tombol tema, dan tombol navigasi bawah masing-masing minimal 44x44px di lebar 390px. Tombol navigasi bawah 56px tingginya.
- Iframe lebar 390px: overflow horizontal 0, rel tersembunyi, navigasi bawah tampil, workbench satu kolom, kartu kapabilitas 309px, dialog lebar 359px.
- Iframe lebar 768px: overflow horizontal 0, rel tersembunyi, navigasi bawah tampil, dialog lebar 520px.
- Layar 1294px: overflow horizontal 0, rel tampil, navigasi bawah tersembunyi.
- Lighthouse tidak menjalankan tolok ukur performa atau emulasi perangkat.

### Pembuktian build dan pemuatan

- `bun build` lolos untuk `js/data.js`, `js/tools.js`, `js/analyzers.js`, `js/state.js`, `js/app.js`, `sw.js`, dan `server.js`.
- Browser memuat ACE tanpa galat konsol saat kondisi normal.
- Service worker terdaftar dengan scope `http://localhost:4180/`. Cache bernama `ace-v2-4` berisi 17 entri, termasuk `js/tools.js`, empat berkas Poppins, ikon SVG, ikon 192px, dan ikon 512px. Strategi cache adalah network-first dengan fallback cache.
- `meta theme-color` mengikuti tema aktif. Tema tersimpan di `ace-v2`.
- Satu-satunya kunci `localStorage` yang dipakai adalah `ace-v2`. Migrasi dari `antigravity-studio-v2` berhasil dalam pengujian sebelumnya.

### Yang belum diuji

- Pemasangan sungguhan di Chrome Android belum bisa dilakukan karena tidak ada perangkat tersambung. Perlu dicoba setelah aplikasi dipublikasikan ke HTTPS.
- Pemanggilan model sungguhan belum diuji karena belum ada endpoint, token, atau kunci milik pengguna, termasuk server OpenCode yang aktif dan mengizinkan origin ACE.
- Berkas APK biner belum dihasilkan karena masih menunggu host HTTPS aktif. Toolchain Node.js, JDK 17, dan Android SDK sudah tersedia.
- Publikasi ke host publik belum dilakukan karena alamat repository GitHub dan akses Cloudflare belum diberikan.
- Pengukuran Core Web Vitals lapangan tidak dilakukan karena tidak ada data pengguna nyata.
- Tangkapan layar tidak diperiksa secara visual dalam sesi ini karena model tidak menerima masukan gambar. Pemeriksaan mengandalkan DOM, gaya komputasi, dan Lighthouse.
