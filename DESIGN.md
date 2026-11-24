# Design Read, ACE

Ruang kerja kreatif portabel untuk satu pemilik. Dibaca sebagai alat kerja harian di layar kecil maupun besar, dengan bahasa visual hangat dan tenang. Dial: **ENERGY 1 / RHYTHM 2 / MOTION 1**.

Arah berasal dari permintaan pengguna: minimalis, siap pakai, dan bertumpu pada ketenangan, bukan dekorasi. Tidak ada gradien, glow, emoji dekoratif, bento grid, atau animasi berulang.

## Identitas

- Nama: ACE. Nama sebelumnya Antigravity Studio sudah diganti di seluruh antarmuka, manifest, judul halaman, berkas ekspor, dan dokumentasi.
- Motif: mahkota Ratu pada pion catur. Dipakai di header dan ikon PWA. Tombol Ratu mengecilkan dan mengembalikan navigasi kiri.
- Suara: langsung, ramah, tanpa klaim. Kalimat pendek, kata kerja spesifik. Nama bidang kerja memakai sebutan yang diminta pengguna, misalnya UI/UX Designer dan Content Planner.

## Warna

| Peran | Hex | Alasan |
|---|---|---|
| Latar kertas | `#F5F4EE` | Hangat dan tidak menyilaukan saat dipakai lama. |
| Permukaan | `#FFFFFF` | Membedakan panel dari latar tanpa bayangan tebal. |
| Teks utama | `#1F1E1B` | Kontras tinggi di atas kertas dan permukaan. |
| Teks sekunder | `#6B675E` | Masih terbaca sebagai penjelas, bukan isi utama. |
| Garis | `#E3DED3` | Pemisah lembut yang selaras dengan latar hangat. |
| Aksen | `#B85C38` | Satu warna coral untuk fokus, tombol utama, dan status. |
| Aksen lembut | `#F6E8E0` | Latar untuk item aktif, cukup terang untuk teks gelap. |

Tema gelap memakai pasangan nilai yang diuji terpisah: latar `#191817`, permukaan `#242220`, teks `#F5F1E8`, teks sekunder `#B6AFA4`, garis `#3A3733`, aksen `#E29268`, aksen lembut `#35271F`. Aksen gelap lebih terang supaya kontras tetap memadai.

Batasan warna dipatuhi: dua warna netral inti, satu aksen, sisanya turunan netral.

## Tipografi

- Font tunggal: Poppins untuk seluruh antarmuka, termasuk judul, isi, label, dan kode pendek.
- Berkas font disimpan lokal di `fonts/poppins-400.woff2`, `poppins-500.woff2`, `poppins-600.woff2`, dan `poppins-700.woff2`. Lisensi OFL ada di `fonts/OFL.txt`.
- Font 400 dan 600 dimuat lebih awal lewat `link rel="preload"`.
- Ukuran isi 15px dengan tinggi baris 1,6. Judul memakai weight 600 dan 700 dengan letter spacing `-0.015em`.

## Navigasi

Rel kiri hanya berisi sembilan bidang kerja. Tujuh menu alat pendukung lama sudah dihapus dari navigasi dan fungsinya dipindahkan:

| Menu lama | Tempat sekarang |
|---|---|
| Beranda | Admin, kartu fokus dan ringkasan kerja |
| Content Planner | Peran Content Planner |
| Writer | Peran Writer |
| Aset & Warna | Graphic Designer dan Frontend Developer |
| Antislop | Kapabilitas dengan alat `slop` pada peran yang membutuhkannya |
| AI & Prompt | Dialog AI di header |
| Data & Setelan | Admin, pengaturan, ekspor, impor, dan hapus data |

Bottom nav memuat lima peran yang paling sering dipakai: UX, Grafis, Kode, Rencana, dan Admin. Di layar sempit, tombol Ratu membuka dialog berisi sembilan peran. Tombol AI di header membuka dialog pengaturan dan composer AI.

## Tata letak per peran

Kesembilan peran memakai komposisi berbeda. Ini bukan satu template kartu yang diberi judul berbeda.

| Peran | Komposisi | Grid terukur di 1294px |
|---|---|---|
| UI/UX Designer | rel kapabilitas bertahap, kanvas alur, panel kondisi | `216.594px 406.109px 284.297px` |
| Graphic Designer | pita palet penuh, area kerja utama, rel warna | `"band band" "main rail"`, `667px 260px` |
| Frontend Developer | daftar kapabilitas, editor potongan kode, papan state | `321.609px 605.391px` |
| Writer | punggung bab, naskah, penanda | `308.984px 618px` |
| Drafter | lembar dokumen dengan catatan pinggir | `947px` |
| Editor | dua panel diff, lalu alat dan daftar cek | `947px` |
| Content Creator | dinding ide, panel pendukung | `591.688px 335.312px` |
| Content Planner | kalender minggu, panel samping | `630.359px 296.625px` |
| Admin | area utama, panel fokus dan data | `617.984px 309px` |

Gaya kapabilitas juga berbeda menurut fungsi: `steps`, `tiles`, `index`, `bookmarks`, `chips`, dan `ledger`. Workbench memakai empat variasi: dua kolom, tumpuk, kompak, dan penuh.

Header penuh setinggi 78px. Rel penuh 252px, rel ringkas 76px. Area kerja memakai lebar maksimal 1180px dan margin tengah. Panel memakai garis 1px, radius 12px, dan padding 26px. Jarak memakai skala tetap 6, 10, 14, 20, 26, dan 34px.

Pada 1240px, UX turun menjadi dua kolom dan kalender minggu menjadi otomatis. Pada 960px, rel disembunyikan, bottom nav muncul, dan semua peran menjadi satu kolom. Pada 720px dan 620px, panel dalam dibagi ulang supaya tidak ada overflow horizontal.

## Gerak

MOTION 1. Tidak ada animasi masuk, efek gulir, pergeseran latar, atau elemen mengambang. Satu-satunya gerak adalah perubahan warna saat kursor di atasnya dan geser 1px saat tombol ditekan. Itu dimatikan kalau sistem meminta pengurangan gerak.

## Komponen dan alasan

- Tombol minimal 44px tinggi, termasuk dua tombol sakelar tema, tombol Ratu, dan tombol AI.
- Sakelar tema memakai matahari untuk terang dan bulan untuk gelap. Tiap tombol punya `aria-label` dan `aria-pressed`.
- Saat rel penuh, nama aksesibel tombol memakai teks terlihat. Saat rel ringkas, teks disembunyikan dan `aria-label` dipasang.
- Fokus keyboard memakai outline 3px berwarna aksen dengan offset 3px.
- Panel memakai garis 1px. Bayangan hanya dipakai di kartu fokus Admin dan dialog.
- Kartu kapabilitas memakai ikon, nama fungsi, ringkasan, dan keluaran. Kartu aktif diberi garis aksen.
- Workbench memisahkan bahan dan alat lokal dari prompt dan jawaban AI. Pemisahan ini menegaskan mana yang offline dan mana yang butuh koneksi.
- Penanda dipakai untuk status nyata: peran aktif, jumlah alat, hasil kontras, tingkat temuan. Tidak ada penanda dekoratif.
- Keadaan kosong memakai garis putus-putus dan kalimat yang menyebut tindakan berikutnya.
- Bilah status muncul saat ada notifikasi. Pesan sukses hilang sendiri, pesan galat tetap tampil sampai kondisi berubah.
- Dialog ruang kerja dan dialog AI memakai elemen `dialog`, sehingga Escape berfungsi.

## Keadaan dan ketahanan

- Kosong: fokus, langkah, jadwal, bab, potongan kode, ide, hasil alat, dan jawaban AI punya teks kosong sendiri.
- Memuat: tombol kirim ke model menampilkan "Mengirim..." dan dinonaktifkan. Ini satu-satunya proses yang menunggu jaringan.
- Galat: pengiriman model, impor gagal, dan penyimpanan gagal memunculkan pesan di bilah status. Alat lokal tetap tersedia.
- Tema: dua tema memakai variabel yang sama.
- Keyboard: semua kontrol berupa elemen native.
- Penyimpanan: kunci utama `ace-v2`, versi data `2`. Data lama dengan kunci `antigravity-studio-v2` dipindahkan sekali saat aplikasi dibuka.
- AI: OpenCode dipakai sebagai preset utama lewat HTTP API. Penyedia lain bersifat opsional dan manual. Tidak ada permintaan otomatis saat halaman dibuka.

## Ikon

`icons/icon.svg` dan turunan PNG 192px serta 512px memakai mahkota Ratu catur. Ini identitas final sesuai permintaan pengguna. Tidak ada foto, avatar, atau gambar orang baru.

## Keputusan ringkas

- Kenapa kertas hangat: mengurangi silau dan membedakan alat ini dari dashboard gelap pada umumnya.
- Kenapa Poppins di semua tempat: satu keluarga font merapikan ritme antarmuka dan tetap jelas di layar HP.
- Kenapa satu aksen: memudahkan mata menemukan tindakan utama di layar kecil.
- Kenapa ikon Ratu: memberi wujud yang tidak generik sesuai permintaan pengguna.
- Kenapa Ratu bisa mengecilkan rel: navigasi sembilan peran tetap kuat di desktop, tetapi area kerja bisa lebih lapang.
- Kenapa layout peran berbeda: fungsinya berbeda, jadi strukturnya juga harus berbeda.
- Kenapa tujuh menu lama dihapus: menu those sudah tidak merepresentasikan tempat kerja saat ini. Fungsinya masuk ke peran atau kapabilitas yang memakainya.
- Kenapa alat lokal dipisahkan dari AI: sebagian besar pekerjaan tidak butuh jaringan, dan kunci API tidak aman bila disimpan di aplikasi.
- Kenapa tidak ada animasi masuk: alat kerja dibuka berkali-kali, gerak berulang mengganggu.
- Kenapa data di perangkat: laptop bisa mati dan jaringan bisa berbeda, jadi tidak ada server yang dijadikan andalan.

## Pengujian

Dijalankan di `http://localhost:4180` dengan Bun dan Chromium bawaan aplikasi. Angka di bawah berasal dari pengukuran atau pengamatan langsung setelah perubahan terakhir.

### Navigasi dan peran

- Rel menampilkan sembilan peran. Bottom nav menampilkan lima tombol. Dialog Ratu menampilkan sembilan pilihan peran.
- Kesembilan peran diklik satu per satu. Tiap peran menampilkan delapan kapabilitas, judul yang sesuai, konteks `peran / kapabilitas`, satu item aktif, dan workbench. Total 72 kapabilitas.
- Pergantian kapabilitas di tiap peran mengubah subjudul halaman.
- Tidak ada teks `Tampilan gagal dibuat` di kesembilan peran.
- Tombol Ratu mengecilkan rel menjadi 76px, mengubah label menjadi `Perbesar navigasi`, lalu mengembalikannya saat diklik lagi.

### Tombol dan alat kerja

- Tambah lalu hapus diuji untuk fokus Admin, jadwal Planner, bab Writer, potongan kode Frontend, warna Graphic, ide Creator, dan langkah cek UX. Semua kembali ke jumlah awal.
- Tombol salin potongan kode diuji.
- Reset menampilkan konfirmasi `Ya, hapus semua data`. Konfirmasi kedua sengaja tidak dijalankan supaya data uji tidak hilang.
- Pemeriksaan riset menghasilkan 2 temuan. Antislop menghasilkan 4 temuan. `Lihat versi bersih` dan `Pakai sebagai draf` bekerja. `Susun prompt AI` memasukkan bahan kerja ke prompt.
- Jalur galat AI memakai endpoint `http://127.0.0.1:9/v1/chat/completions`. Bilah status menampilkan `Gagal menghubungi AI: Failed to fetch`, jawaban kosong, dan tombol kembali aktif. Satu-satunya galat konsol adalah `Failed to load resource: net::ERR_UNSAFE_PORT` dari port yang sengaja diblokir.
- Pengaturan model dikembalikan ke preset OpenCode. Tidak ada kunci API yang diisi.

### Tampilan dan aksesibilitas

- `bun build` lolos untuk `js/data.js`, `js/tools.js`, `js/analyzers.js`, `js/state.js`, `js/app.js`, `sw.js`, dan `server.js`.
- Normal load tidak menghasilkan galat konsol.
- Lighthouse dijalankan ulang setelah perubahan terakhir. Terang dengan rel penuh, gelap dengan rel penuh, dan gelap dengan rel ringkas semuanya mencatat Accessibility 1,00, Best Practices 1,00, dan SEO 1,00, tanpa temuan gagal.
- Iframe 390px: overflow 0, rel tersembunyi, bottom nav tampil, lima tombol bawah `70x56`, dua tombol tema `44x44`, tombol Ratu `44x44`, workbench satu kolom, dialog 367px, sembilan pilihan peran.
- Iframe 768px: overflow 0, lima tombol bawah `146x56`, tombol Ratu `48x48`, dialog 560px. Memilih Graphic Designer menutup dialog dan mengubah halaman.
- Di 1294px, overflow horizontal 0.
- Hanya ada dua `box-shadow`: kartu fokus Admin dan dialog. Tidak ada `gradient`, `glow`, `@keyframes`, atau animasi berulang di stylesheet.
- Tidak ada komentar generik di berkas JavaScript. Tidak ada permintaan jaringan di luar jembatan AI yang dipicu pengguna, service worker, dan server statis lokal.
- Cache service worker aktif bernama `ace-v2-6`.
- Tangkapan layar berhasil dibuat, tetapi model tidak menerima masukan gambar. Pemeriksaan visual masih mengandalkan DOM, gaya komputasi, dan Lighthouse, bukan penilaian piksel.

### APK

- `android/offline/ACE-offline.apk` dibuat dari aset ACE yang dibungkus WebView. Ini APK biner nyata, bukan TWA, dan tidak memerlukan host HTTPS atau `assetlinks.json`.
- Ukuran 133042 byte. SHA-256 `F4CC3CF4129BB769A55222C37D162D6B1E6E8DD6D89E72836348362BC04D0241`.
- `apksigner verify` lolos dengan skema v2 dan v3. Nama paket `com.nhiux.ace`, minSdk 24, targetSdk 36.
- Isi APK memuat `assets/index.html`, `assets/styles.css`, `assets/js/app.js`, empat font Poppins, ikon, manifest, dan `classes.dex` dengan jalur garis miring maju.
- Skrip build ada di `android/offline/build-offline-apk.ps1`. Kunci tanda tangan lokal ada di `android/offline/ace-offline.keystore`.

### Yang belum diuji

- Pemasangan di perangkat Android fisik belum bisa dilakukan karena tidak ada perangkat tersambung.
- Pemanggilan model sungguhan belum diuji karena belum ada endpoint, token, atau kunci milik pengguna, termasuk server OpenCode yang aktif dan mengizinkan origin ACE.
- Deploy Cloudflare Pages belum selesai karena belum ada sesi Cloudflare yang terautentikasi atau kredensial API.
- Pengukuran Core Web Vitals lapangan tidak dilakukan karena tidak ada data pengguna nyata.
- Penilaian visual dari tangkapan layar belum bisa dilakukan karena keterbatasan masukan gambar pada sesi ini.
