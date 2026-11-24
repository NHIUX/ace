const ATURAN_AI = "Gunakan Bahasa Indonesia. Jangan mengarang data, angka, testimoni, tautan, atau sumber. Pisahkan fakta dari asumsi. Tandai bagian yang perlu dikonfirmasi.";

const c = (id, label, summary, tool, instruction, placeholder, output, icon) => ({
  id,
  label,
  summary,
  tool,
  instruction,
  placeholder,
  output,
  icon,
});

function susunPrompt(peran, kapabilitas) {
  return `Kamu adalah asisten kerja ACE untuk peran ${peran.label}. Fokus pada ${kapabilitas.label}.

Tugas:
${kapabilitas.instruction}

Konteks milikku:
[tempel di sini]

Keluarkan:
1. ${kapabilitas.output}
2. Langkah pengerjaan yang bisa langsung dijalankan
3. Bagian yang masih perlu kuputuskan atau kuverifikasi

${ATURAN_AI}`;
}

export const ICONS = {
  home: '<path d="M3 10.5 12 3l9 7.5"/><path d="M5.5 9.5V21h13V9.5"/><path d="M9.5 21v-6h5v6"/>',
  ux: '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 9h18M9 9v11"/><path d="M12 13h6M12 16h4"/>',
  graphic: '<circle cx="8" cy="8" r="4"/><rect x="12" y="12" width="8" height="8" rx="1"/><path d="M4 20h8M4 4v4"/>',
  frontend: '<path d="m8 7-5 5 5 5M16 7l5 5-5 5M14 4l-4 16"/>',
  writer: '<path d="M5 3h10l4 4v14H5z"/><path d="M15 3v5h4M8 12h8M8 16h6"/>',
  drafter: '<path d="M4 18 18 4l2 2L6 20z"/><circle cx="7" cy="17" r="2"/><path d="M14 6l4 4"/>',
  editor: '<path d="M4 20h4L19 9l-4-4L4 16z"/><path d="m14 6 4 4M4 12h6"/>',
  creator: '<rect x="3" y="6" width="18" height="13" rx="2"/><circle cx="9" cy="12" r="3"/><path d="m15 10 4-2v8l-4-2z"/>',
  planner: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4M8 14h3M8 17h7"/>',
  admin: '<rect x="4" y="3" width="16" height="18" rx="2"/><path d="M8 8h8M8 12h8M8 16h5"/><path d="m15 15 2 2 3-4"/>',
  slop: '<path d="M4 7h16M4 12h10M4 17h13"/><path d="m17 15 4 4M21 15l-4 4"/>',
  prompt: '<path d="M5 4h14v12H9l-4 4z"/><path d="M9 9h6M9 12h4"/>',
  data: '<ellipse cx="12" cy="6" rx="8" ry="3"/><path d="M4 6v12c0 1.7 3.6 3 8 3s8-1.3 8-3V6"/><path d="M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3"/>',
  search: '<circle cx="10.5" cy="10.5" r="6.5"/><path d="m15.5 15.5 5 5"/>',
  layout: '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 9h18M9 9v11"/>',
  chart: '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',
  check: '<path d="m4 12 5 5L20 6"/>',
  pen: '<path d="M4 20h4L19 9l-4-4L4 16z"/><path d="m14 6 4 4"/>',
  code: '<path d="m8 7-5 5 5 5M16 7l5 5-5 5"/>',
  calendar: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>',
  clipboard: '<rect x="5" y="4" width="14" height="17" rx="2"/><path d="M9 4V2h6v2M9 10h6M9 14h6"/>',
  shield: '<path d="M12 3 4 6v6c0 5 3.4 8.5 8 9 4.6-.5 8-4 8-9V6z"/><path d="m9 12 2 2 4-4"/>',
  trash: '<path d="M4 7h16M9 7V4h6v3M6 7l1 14h10l1-14"/><path d="M10 11v6M14 11v6"/>',
};

export const ROLES = [
  {
    id: "ux",
    label: "UI/UX Designer",
    short: "UX",
    icon: "ux",
    summary: "Riset, alur, antarmuka, kondisi, dan serah terima.",
    checks: [
      "Tulis tujuan layar dalam satu kalimat",
      "Petakan pengguna dan skenario utama",
      "Susun alur sebelum memilih visual",
      "Sertakan kondisi kosong, memuat, galat, dan berhasil",
      "Cek kontras dan target sentuh",
      "Tulis catatan handoff untuk frontend",
    ],
    outputs: ["Peta alur", "Kerangka layar", "Daftar kondisi", "Spesifikasi komponen"],
    capabilities: [
      c("ux-research", "Riset pengguna", "Susun pertanyaan dan rencana riset yang tidak mengarahkan jawaban.", "research", "Susun rencana riset pengguna: tujuan, siapa yang diwawancarai, pertanyaan netral, dan cara mencatat temuan.", "Tujuan riset dan hal yang ingin diketahui", "Rencana riset dan daftar pertanyaan", "search"),
      c("ux-flow", "Desain UX dan alur", "Ubah kebutuhan menjadi alur, langkah, dan kondisi yang lengkap.", "states", "Rancang alur satu fitur dari kebutuhan pengguna. Sertakan langkah utama, cabang, dan semua kondisi antarmuka.", "Nama fitur dan kebutuhan pengguna", "Peta alur dan daftar kondisi", "layout"),
      c("ui-design", "Desain UI", "Buat spesifikasi visual yang bisa dipakai tanpa menebak.", "structure", "Usulkan struktur layar, hierarki informasi, peran warna, dan alasan setiap keputusan visual.", "Deskripsi layar dan kendala yang ada", "Spesifikasi visual layar", "layout"),
      c("ux-writer", "Penulis UX", "Perbaiki teks pendek supaya jelas dan bisa ditindaklanjuti.", "microcopy", "Perbaiki teks pendek berikut. Berikan versi sebelum dan sesudah, plus alasan singkat per perubahan.", "Teks tombol, pesan galat, atau petunjuk", "Teks pendek final dan catatan alasan", "pen"),
      c("prototype", "Pembuatan prototipe", "Siapkan daftar interaksi dan daftar cek sebelum alat prototipe dibuka.", "checklist", "Susun rencana prototipe: alur yang diuji, interaksi yang dibuat, kondisi yang harus ada, dan hal yang sengaja tidak dibuat.", "Alur layar yang ingin diuji", "Rencana prototipe dan daftar cek", "layout"),
      c("ux-audit", "Audit UX", "Temukan masalah kegunaan dari deskripsi antarmuka atau layar.", "checklist", "Lakukan audit heuristik terhadap deskripsi antarmuka ini. Kelompokkan temuan berdasarkan prinsip yang dilanggar dan beri prioritas.", "Deskripsi layar atau alur", "Daftar temuan berprioritas", "search"),
      c("a11y", "Aksesibilitas", "Periksa markup dan teks untuk hambatan keyboard, nama kontrol, dan kontras.", "markup", "Periksa aksesibilitas cuplikan ini. Fokus pada struktur, nama kontrol, fokus keyboard, kontras, dan target sentuh.", "Cuplikan HTML, CSS, atau deskripsi komponen", "Temuan aksesibilitas dan perbaikannya", "shield"),
      c("antislop-ui", "Antislop UI", "Bersihkan teks antarmuka dari kata jargon, ajakan umum, dan klaim tanpa sumber.", "slop", "Periksa teks antarmuka ini. Temukan pola AI, ajakan umum, kalimat panjang, dan klaim tanpa bukti. Tulis versi bersihnya.", "Teks UI yang ingin diperiksa", "Temuan dan versi teks bersih", "slop"),
    ],
  },
  {
    id: "graphic",
    label: "Graphic Designer",
    short: "GFX",
    icon: "graphic",
    summary: "Arah visual, palet, tipografi, aset, dan spesifikasi.",
    checks: [
      "Kumpulkan referensi nyata sebelum memilih arah",
      "Tetapkan peran tiap warna dalam palet",
      "Uji kontras pasangan teks dan latar",
      "Samakan radius, garis, dan jarak",
      "Siapkan aset dalam ukuran yang diminta",
      "Tandai pengganti sementara bila aset belum final",
    ],
    outputs: ["Arah visual", "Palet warna", "Daftar aset", "Spesifikasi ekspor"],
    capabilities: [
      c("art-direction", "Arah visual", "Rangkai arah visual dari masalah, bukan dari tren acak.", "structure", "Usulkan tiga arah visual untuk kebutuhan ini. Tiap arah memuat peran warna, alasan tipografi, satu motif, dan hal yang sengaja tidak dipakai.", "Produk, audiens, dan batasan desain", "Tiga arah visual beralasan", "layout"),
      c("palette", "Palet warna", "Periksa peran warna dan kontras dalam palet yang kamu punya.", "palette", "Evaluasi daftar hex ini. Sebutkan peran tiap warna, pasangan teks dan latar yang lolos serta yang gagal, lalu usulkan perbaikan.", "Daftar hex warna", "Evaluasi palet dan pasangan aman", "chart"),
      c("typography", "Tipografi", "Buat skala huruf yang jelas untuk judul, isi, dan label.", "structure", "Susun skala tipografi untuk antarmuka ini. Sertakan ukuran, berat, tinggi baris, dan alasan penggunaannya.", "Jenis produk dan panjang teks", "Skala tipografi dan aturan pakainya", "pen"),
      c("grid", "Kisi dan komposisi", "Rapikan tata letak dengan kolom, jarak, dan ritme yang konsisten.", "structure", "Buat sistem kisi dan jarak untuk tata letak ini. Jelaskan kapan kolom berubah dan mana yang menjadi fokus utama.", "Deskripsi tata letak dan ukuran layar", "Sistem kisi dan aturan jarak", "layout"),
      c("asset-list", "Daftar aset", "Ubah kebutuhan visual menjadi daftar aset yang jelas statusnya.", "checklist", "Susun daftar aset untuk kebutuhan ini. Kolom: nama, ukuran, format, prioritas, dan status pengganti sementara.", "Kebutuhan visual dan kanal penggunaan", "Daftar aset dan statusnya", "clipboard"),
      c("contrast", "Cek kontras", "Hitung kontras dua warna memakai ambang AA dan AAA.", "contrast", "Bantu memilih pasangan warna teks dan latar yang tetap terbaca.", "Dua kode hex", "Hasil kontras dan rekomendasi", "shield"),
      c("antislop-visual", "Antislop visual", "Cek ringkasan visual dari dekorasi tanpa fungsi dan klaim kosong.", "slop", "Periksa ringkasan visual ini. Temukan dekorasi tanpa fungsi, kata sifat tanpa bukti, dan referensi yang terlalu umum. Tulis ulang lebih spesifik.", "Ringkasan atau deskripsi visual", "Ringkasan visual yang lebih tajam", "slop"),
      c("export-spec", "Spesifikasi ekspor", "Tetapkan format, ukuran, dan penamaan berkas sebelum produksi.", "checklist", "Buat daftar ekspor untuk aset ini. Sertakan format, ukuran, tipografi yang dibutuhkan, nama berkas, dan catatan kompresi.", "Daftar aset dan media penggunaan", "Spesifikasi ekspor final", "clipboard"),
    ],
  },
  {
    id: "frontend",
    label: "Frontend Developer",
    short: "FE",
    icon: "frontend",
    summary: "Markup, komponen, aksesibilitas, kondisi, dan performa.",
    checks: [
      "Gunakan elemen semantik yang sesuai",
      "Beri nama pada tombol dan kolom",
      "Pastikan fokus keyboard terlihat",
      "Pakai target sentuh minimal 44px",
      "Uji kondisi kosong, memuat, galat, dan berhasil",
      "Periksa aset dan skrip yang memblokir tampilan",
    ],
    outputs: ["Cuplikan HTML/CSS", "Daftar komponen", "Daftar cek aksesibilitas", "Catatan performa"],
    capabilities: [
      c("semantic-html", "Markup semantik", "Ubah deskripsi UI menjadi struktur HTML yang masuk akal.", "markup", "Ubah deskripsi ini menjadi HTML semantik tanpa framework. Jelaskan alasan setiap pilihan elemen utama.", "Deskripsi tampilan atau komponen", "Markup semantik dan alasannya", "code"),
      c("component-spec", "Spesifikasi komponen", "Lengkapi anatomi, kondisi, dan perilaku sebuah komponen.", "states", "Buat spesifikasi komponen ini. Sertakan anatomi, properti, kondisi, perilaku keyboard, dan teks bantuan.", "Nama komponen dan konteks pemakaian", "Spesifikasi komponen siap pakai", "layout"),
      c("responsive", "Tata letak responsif", "Temukan pola yang membuat tata letak pecah di layar kecil.", "responsive", "Tinjau cuplikan tata letak ini. Temukan lebar tetap, teks kecil, dan area yang tidak bisa digulir. Berikan perbaikan.", "Cuplikan HTML atau CSS", "Temuan responsif dan perbaikannya", "layout"),
      c("frontend-a11y", "Aksesibilitas kode", "Periksa markup terhadap kebiasaan yang menghalangi pengguna.", "markup", "Periksa aksesibilitas cuplikan kode ini. Fokus pada alt, label, nama tombol, urutan heading, dan fokus.", "Cuplikan HTML", "Daftar perbaikan aksesibilitas", "shield"),
      c("state-ui", "Kondisi antarmuka", "Pastikan setiap kondisi punya tampilan dan pesan yang jelas.", "states", "Untuk komponen ini, tulis tampilan dan teks untuk kondisi kosong, memuat, galat, dan berhasil. Sertakan tindakan berikutnya.", "Nama komponen atau alur", "Daftar kondisi dan teksnya", "layout"),
      c("performance", "Performa", "Cek kebiasaan yang memperlambat muat pertama.", "performance", "Tinjau cuplikan ini. Temukan aset tanpa ukuran, skrip pihak ketiga yang memblokir, CSS yang menunda tampilan, dan animasi tanpa fungsi.", "Cuplikan HTML, CSS, atau daftar aset", "Temuan performa dan prioritas perbaikan", "chart"),
      c("code-review", "Tinjau kode", "Baca kode sebagai peninjau yang fokus pada kebenaran dan pemeliharaan.", "structure", "Tinjau kode ini. Pisahkan kesalahan yang jelas, masalah pemeliharaan, dan saran opsional. Jangan menulis ulang seluruh kode tanpa alasan.", "Cuplikan kode dan konteksnya", "Catatan tinjauan berprioritas", "code"),
      c("antislop-code", "Antislop kode", "Bersihkan komentar, nama, dan pola kode yang tidak menjelaskan apa pun.", "slop", "Periksa kode dan komentar ini. Temukan nama umum, komentar yang mengulang kode, dan pola generik. Usulkan perbaikan kecil yang aman.", "Cuplikan kode", "Kode dan komentar yang lebih jelas", "slop"),
    ],
  },
  {
    id: "writer",
    label: "Writer",
    short: "WRITE",
    icon: "writer",
    summary: "Premis, tokoh, struktur bab, dialog, dan draf.",
    checks: [
      "Tulis premis dalam satu kalimat",
      "Tetapkan motif tokoh utama",
      "Susun konflik sebelum adegan",
      "Beri tujuan pada setiap bab",
      "Baca ulang dialog dengan keras",
      "Catat asumsi yang belum diputuskan",
    ],
    outputs: ["Sinopsis", "Bagan tokoh", "Kerangka bab", "Draf adegan"],
    capabilities: [
      c("premise", "Premis dan kerangka", "Buat kerangka cerita sebelum menulis prosa penuh.", "structure", "Kembangkan premis menjadi kerangka. Sertakan konflik utama, tiga tonggak cerita, dan pertanyaan yang masih terbuka.", "Premis satu kalimat", "Kerangka awal dan daftar pertanyaan", "pen"),
      c("characters", "Bagan tokoh", "Lengkapi motif, ketakutan, dan perubahan tokoh.", "checklist", "Buat bagan tokoh dari naskah ini. Isi motif, ketakutan, hubungan, dan perubahan yang diharapkan. Jangan mengarang nama baru.", "Nama tokoh dan catatan yang ada", "Bagan tokoh berbasis naskah", "clipboard"),
      c("chapters", "Struktur bab", "Beri setiap bab tujuan dan akhir yang jelas.", "structure", "Susun daftar bab untuk naskah ini. Tiap bab punya tujuan, konflik, dan keadaan di akhir bab.", "Premis atau daftar adegan", "Daftar bab dengan tujuan", "layout"),
      c("scene", "Draf adegan", "Kembangkan adegan dari tujuan dan konflik yang sudah ada.", "checklist", "Tulis draf adegan berdasarkan tujuan dan konflik ini. Tandai bagian yang masih bergantung pada keputusan dunia cerita.", "Tujuan adegan, tokoh, dan konflik", "Draf adegan dan catatan asumsi", "pen"),
      c("dialogue", "Dialog", "Buat percakapan yang terdengar seperti orang, bukan pidato.", "microcopy", "Perbaiki atau tulis dialog untuk adegan ini. Jaga suara tiap tokoh dan hindari kalimat yang hanya menyampaikan informasi.", "Konteks adegan dan peran tokoh", "Dialog dengan catatan suara tokoh", "pen"),
      c("style", "Gaya bahasa", "Samakan diksi, sudut pandang, dan ritme naskah.", "terms", "Periksa konsistensi gaya bahasa naskah ini. Temukan perubahan sudut pandang, diksi yang tidak konsisten, dan kalimat yang keluar dari nada.", "Potongan naskah", "Catatan konsistensi gaya", "search"),
      c("antislop-prose", "Antislop naskah", "Temukan pola AI, klaim kosong, dan kalimat yang terlalu rapi.", "slop", "Periksa naskah ini. Temukan kata jargon, emosi yang diberi nama langsung, kalimat panjang, dan pola generik. Tulis ulang bagian yang perlu.", "Potongan naskah", "Temuan dan draf revisi", "slop"),
      c("claims", "Cek klaim", "Pisahkan hal yang bisa dibuktikan dari opini tokoh atau narator.", "claims", "Tinjau teks ini. Tandai angka, klaim mutlak, dan pernyataan yang tampak sebagai fakta. Jangan menghapus suara tokoh.", "Potongan naskah atau catatan", "Daftar klaim yang perlu diverifikasi", "shield"),
    ],
  },
  {
    id: "drafter",
    label: "Drafter",
    short: "DRFT",
    icon: "drafter",
    summary: "Kerangka dokumen, spesifikasi, tabel, dan format.",
    checks: [
      "Tentukan pembaca dan tujuan dokumen",
      "Susun kerangka sebelum mengisi detail",
      "Pakai istilah yang konsisten",
      "Pisahkan fakta, keputusan, dan asumsi",
      "Tandai bagian yang belum ada datanya",
      "Periksa daftar lampiran dan referensi",
    ],
    outputs: ["Kerangka dokumen", "Tabel keputusan", "Spesifikasi format", "Daftar lampiran"],
    capabilities: [
      c("doc-outline", "Kerangka dokumen", "Susun struktur dokumen dari tujuan dan pembaca.", "structure", "Buat kerangka dokumen untuk tujuan ini. Sertakan urutan bagian, pertanyaan yang harus dijawab, dan bagian yang belum punya data.", "Tujuan dokumen dan pembaca", "Kerangka dokumen", "layout"),
      c("tech-spec", "Spesifikasi teknis", "Ubah kebutuhan menjadi spesifikasi yang bisa diuji.", "checklist", "Tulis spesifikasi teknis untuk kebutuhan ini. Sertakan batasan, format input dan keluaran, serta kriteria selesai.", "Kebutuhan dan batasan", "Spesifikasi teknis", "clipboard"),
      c("flow-doc", "Diagram alur teks", "Ubah proses menjadi langkah bernomor yang mudah dicek.", "structure", "Ubah proses ini menjadi alur bernomor. Sertakan cabang keputusan dan titik yang butuh konfirmasi.", "Deskripsi proses", "Alur bernomor dan cabang", "layout"),
      c("decision-table", "Tabel keputusan", "Bandingkan opsi dengan kriteria yang disebut jelas.", "structure", "Buat tabel keputusan untuk opsi ini. Kolom: kriteria, bobot bila ada, bukti, dan keputusan sementara.", "Daftar opsi dan kriteria", "Tabel keputusan", "chart"),
      c("format-spec", "Spesifikasi format", "Tetapkan aturan penulisan, penamaan, dan struktur berkas.", "checklist", "Susun aturan format untuk dokumen atau berkas ini. Sertakan penamaan, urutan bagian, dan hal yang tidak boleh diisi asal.", "Jenis dokumen dan aturan yang berlaku", "Spesifikasi format", "clipboard"),
      c("exec-summary", "Ringkasan eksekutif", "Ringkas dokumen panjang tanpa menambah informasi baru.", "structure", "Buat ringkasan eksekutif dari teks ini. Pakai hanya informasi yang ada dan tandai bagian yang tidak diketahui.", "Teks dokumen", "Ringkasan eksekutif", "pen"),
      c("antislop-doc", "Antislop dokumen", "Bersihkan dokumen dari kalimat kantor yang tidak menyampaikan isi.", "slop", "Periksa dokumen ini. Temukan kata jargon, kalimat panjang, pengulangan, dan klaim tanpa sumber. Tulis ulang bagian yang jelas.", "Teks dokumen", "Dokumen yang lebih ringkas", "slop"),
      c("completeness", "Kelengkapan", "Cek apakah bagian penting dokumen masih kosong.", "checklist", "Periksa kelengkapan dokumen ini terhadap tujuan, pembaca, isi, bukti, batasan, dan lampiran.", "Teks atau daftar isi dokumen", "Daftar bagian yang hilang", "check"),
    ],
  },
  {
    id: "editor",
    label: "Editor",
    short: "EDT",
    icon: "editor",
    summary: "Koreksi struktur, konsistensi, fakta, dan gaya.",
    checks: [
      "Baca duluan tanpa mengoreksi detail",
      "Tandai masalah struktur sebelum diksi",
      "Samakan istilah di seluruh naskah",
      "Pisahkan fakta dari opini",
      "Simpan alasan untuk perubahan besar",
      "Lakukan pas terakhir setelah perubahan",
    ],
    outputs: ["Catatan edit", "Daftar perubahan", "Daftar klaim", "Daftar cek akhir"],
    capabilities: [
      c("structure-edit", "Koreksi struktur", "Lihat urutan informasi sebelum menyunting kata.", "structure", "Tinjau struktur naskah ini. Temukan bagian yang duplikat, urutan yang membingungkan, dan bagian yang perlu dipindah.", "Naskah atau daftar isi", "Catatan perbaikan struktur", "layout"),
      c("terms", "Konsistensi istilah", "Samakan istilah yang dipakai berganti-ganti.", "terms", "Periksa konsistensi istilah dalam naskah ini. Usulkan satu istilah pilihan untuk setiap pasangan yang berganti-ganti.", "Naskah atau daftar istilah", "Daftar istilah dan keputusan", "search"),
      c("fact-check", "Fakta versus opini", "Tandai pernyataan yang butuh bukti sebelum dipublikasikan.", "claims", "Pisahkan fakta, opini, dan asumsi dalam teks ini. Tandai kalimat yang memerlukan sumber atau konfirmasi.", "Teks yang akan disunting", "Daftar pernyataan yang perlu dicek", "shield"),
      c("antislop-edit", "Antislop editor", "Temukan pola teks AI yang masih tersisa setelah suntingan.", "slop", "Periksa naskah ini memakai daftar pola teks generik. Beri temuan dan versi bersih tanpa mengubah makna.", "Teks hasil suntingan", "Temuan dan versi bersih", "slop"),
      c("change-log", "Catatan perubahan", "Dokumentasikan alasan perubahan besar.", "checklist", "Buat catatan perubahan dari naskah lama dan baru. Kelompokkan perubahan struktur, istilah, dan fakta.", "Teks lama dan teks baru", "Catatan perubahan beralasan", "clipboard"),
      c("copy-edit", "Suntingan kalimat", "Perbaiki kalimat tanpa mengubah maksud penulis.", "microcopy", "Sunting kalimat berikut agar lebih jelas dan ringkas. Jangan menambah fakta atau mengubah suara penulis.", "Potongan naskah", "Versi suntingan dan catatan kecil", "pen"),
      c("final-check", "Pemeriksaan akhir", "Jalankan daftar cek terakhir sebelum teks keluar.", "checklist", "Buat daftar cek akhir untuk naskah ini. Sertakan struktur, istilah, angka, tautan, hak cipta aset, dan ejaan.", "Jenis naskah dan kanal terbit", "Daftar cek akhir", "check"),
      c("style-guide", "Panduan gaya", "Buat aturan kecil yang dipakai bersama oleh penulis.", "structure", "Susun panduan gaya singkat berdasarkan naskah ini. Sertakan ejaan, istilah, struktur kalimat, dan hal yang dilarang.", "Contoh naskah dan preferensi tim", "Panduan gaya ringkas", "clipboard"),
    ],
  },
  {
    id: "creator",
    label: "Content Creator",
    short: "CREATE",
    icon: "creator",
    summary: "Ide, skrip, keterangan, variasi judul, dan ajakan.",
    checks: [
      "Tentukan satu sudut pandang per konten",
      "Tulis tiga alternatif judul",
      "Sesuaikan panjang dengan kanal",
      "Sertakan satu ajakan yang jelas",
      "Hindari emoji dekoratif berlebih",
      "Tandai klaim yang perlu bukti",
    ],
    outputs: ["Ide konten", "Skrip pendek", "Keterangan", "Variasi judul"],
    capabilities: [
      c("ideas", "Ide konten", "Buat ide dari topik yang sudah kamu tentukan.", "structure", "Buat lima ide konten untuk topik dan kanal ini. Tiap ide memuat sudut pandang, judul, tiga poin, dan satu ajakan spesifik.", "Topik dan kanal", "Lima ide siap dipilih", "search"),
      c("script", "Skrip pendek", "Susun skrip dengan ritme yang jelas dari awal sampai akhir.", "structure", "Tulis skrip pendek untuk topik ini. Bagian pembuka, tiga poin utama, dan penutup dengan satu ajakan.", "Topik, durasi, dan kanal", "Skrip pendek", "pen"),
      c("caption", "Keterangan konten", "Tulis keterangan yang sesuai dengan kanal tanpa berisik.", "microcopy", "Tulis keterangan untuk topik ini dalam tiga nada: tenang, tajam, dan ramah. Jangan menambah emoji dekoratif.", "Topik dan kanal", "Tiga pilihan keterangan", "pen"),
      c("headlines", "Variasi judul", "Cari judul yang spesifik tanpa klaim kosong.", "microcopy", "Buat sepuluh alternatif judul untuk topik ini. Hindari kata sifat tanpa bukti dan ajakan umum.", "Topik dan audiens", "Sepuluh alternatif judul", "pen"),
      c("repurpose", "Penyesuaian ulang", "Ubah satu ide menjadi beberapa format yang tetap konsisten.", "structure", "Ubah materi ini menjadi format umpan, cerita, video pendek, dan artikel. Jaga satu sudut pandang yang sama.", "Materi pokok dan kanal", "Empat versi konten", "layout"),
      c("hook", "Pembuka kuat", "Perbaiki beberapa detik pertama tanpa klikbait.", "microcopy", "Tulis lima pembuka untuk konten ini. Jangan memakai janji berlebihan, angka tanpa sumber, atau pertanyaan kosong.", "Topik dan audiens", "Lima pembuka aman", "pen"),
      c("antislop-content", "Antislop konten", "Bersihkan keterangan dan skrip dari pola generik.", "slop", "Periksa konten ini. Temukan kata jargon, emoji dekoratif, tanda seru berulang, dan angka tanpa sumber. Tulis versi bersih.", "Keterangan atau skrip", "Temuan dan versi bersih", "slop"),
      c("cta", "Ajakan spesifik", "Ganti ajakan umum dengan tindakan yang jelas.", "microcopy", "Ganti ajakan ini dengan delapan alternatif yang menyebut tindakan nyata. Jangan memakai ajakan umum.", "Ajakan yang ingin diganti", "Delapan alternatif ajakan", "pen"),
    ],
  },
  {
    id: "planner",
    label: "Content Planner",
    short: "PLAN",
    icon: "planner",
    summary: "Kalender, pilar konten, kanal, prioritas, dan evaluasi.",
    checks: [
      "Tetapkan tujuan konten minggu ini",
      "Batasi beban harian yang realistis",
      "Seimbangkan kanal yang dipakai",
      "Tulis kebutuhan aset di tiap jadwal",
      "Sisakan ruang untuk kebutuhan mendadak",
      "Tinjau hasil minggu lalu sebelum menambah",
    ],
    outputs: ["Kalender mingguan", "Pilar konten", "Prioritas antrean", "Catatan evaluasi"],
    capabilities: [
      c("week-calendar", "Kalender mingguan", "Susun jadwal tujuh hari dengan beban yang masuk akal.", "calendar", "Susun kalender tujuh hari untuk tujuan ini. Maksimal satu unggahan per hari. Sertakan alasan penempatan dan aset yang perlu disiapkan.", "Tujuan dan kanal yang dipakai", "Kalender tujuh hari", "calendar"),
      c("pillars", "Pilar konten", "Tetapkan beberapa topik utama agar konten tidak tersebar.", "structure", "Usulkan pilar konten untuk tujuan ini. Tiap pilar punya pertanyaan yang dijawab dan contoh bentuk konten.", "Tujuan dan audiens", "Daftar pilar konten", "layout"),
      c("channel-balance", "Keseimbangan kanal", "Lihat apakah satu kanal dipenuhi sementara yang lain kosong.", "calendar", "Evaluasi jadwal ini. Temukan kanal yang terlalu padat, kanal yang kosong, dan beban produksi per minggu.", "Daftar jadwal konten", "Catatan keseimbangan kanal", "chart"),
      c("backlog", "Prioritas antrean", "Urutkan ide berdasarkan dampak dan usaha.", "matrix", "Prioritaskan daftar ide ini berdasarkan dampak dan usaha. Kelompokkan menjadi kerjakan sekarang, jadwalkan, dan tunda.", "Daftar ide dan batasan", "Matriks prioritas", "chart"),
      c("brief", "Ringkasan produksi", "Beri tim satu halaman yang menjelaskan kebutuhan konten.", "checklist", "Buat ringkasan produksi untuk konten ini. Sertakan tujuan, audiens, sudut pandang, format, aset, dan kriteria selesai.", "Ide konten dan kanal", "Ringkasan produksi", "clipboard"),
      c("asset-plan", "Rencana aset", "Rangkum aset yang harus disiapkan sebelum produksi.", "checklist", "Buat daftar aset untuk jadwal ini. Tandai mana yang sudah ada dan mana yang masih berupa pengganti sementara.", "Jadwal konten", "Daftar kebutuhan aset", "clipboard"),
      c("review", "Evaluasi mingguan", "Tinjau hasil memakai data yang benar-benar tersedia.", "structure", "Buat kerangka evaluasi mingguan. Fokus pada pertanyaan yang bisa dijawab dengan data yang kamu miliki. Jangan menyarankan metrik yang tidak tersedia.", "Data atau catatan minggu ini", "Kerangka evaluasi", "search"),
      c("antislop-plan", "Antislop rencana", "Bersihkan rencana dari target dan klaim yang tidak jelas sumbernya.", "slop", "Periksa rencana konten ini. Temukan angka tanpa sumber, kata jargon, dan target yang tidak bisa diukur dari data yang ada.", "Teks rencana konten", "Rencana yang lebih jelas", "slop"),
    ],
  },
  {
    id: "admin",
    label: "Admin",
    short: "ADM",
    icon: "admin",
    summary: "Catatan rapat, tindak lanjut, keputusan, dan kerapian dokumen.",
    checks: [
      "Catat keputusan dan alasannya",
      "Tulis tindak lanjut dengan pemilik dan tenggat",
      "Pisahkan fakta, asumsi, dan pertanyaan",
      "Pakai nama berkas yang konsisten",
      "Simpan cadangan sebelum menghapus",
      "Tutup siklus dengan bukti selesai",
    ],
    outputs: ["Notulen rapat", "Daftar tindak lanjut", "Catatan keputusan", "Daftar prioritas"],
    capabilities: [
      c("meeting-notes", "Notulen rapat", "Ubah catatan mentah menjadi notulen yang bisa dibaca.", "structure", "Susun notulen dari catatan ini. Sertakan pokok bahasan, keputusan, tindak lanjut, dan pertanyaan terbuka.", "Catatan rapat mentah", "Notulen rapat", "clipboard"),
      c("followups", "Tindak lanjut", "Pastikan setiap janji kerja punya pemilik dan tenggat.", "checklist", "Buat daftar tindak lanjut dari catatan ini. Tiap baris memuat tugas, pemilik, tenggat, dan bukti selesai.", "Catatan rapat atau percakapan", "Daftar tindak lanjut", "check"),
      c("decision-log", "Catatan keputusan", "Simpan alasan di balik keputusan, bukan hanya hasilnya.", "structure", "Buat catatan keputusan dari catatan ini. Sertakan tanggal bila ada, keputusan, alasan, alternatif, dan penanggung jawab.", "Catatan keputusan", "Catatan keputusan", "clipboard"),
      c("priority", "Matriks prioritas", "Urutkan pekerjaan administratif yang menumpuk.", "matrix", "Prioritaskan daftar tugas ini. Tandai yang mendesak, yang bisa dijadwalkan, dan yang perlu didelegasikan.", "Daftar tugas dan tenggat", "Matriks prioritas", "chart"),
      c("daily-check", "Daftar cek harian", "Buat rutinitas yang bisa dicentang tanpa berpikir panjang.", "checklist", "Buat daftar cek harian untuk peran ini. Batasi jumlah item supaya bisa benar-benar dijalankan.", "Jenis pekerjaan harian", "Daftar cek harian", "check"),
      c("doc-template", "Template dokumen", "Siapkan kerangka yang dipakai ulang.", "structure", "Buat template dokumen untuk kebutuhan ini. Sertakan bagian wajib dan petunjuk singkat untuk mengisinya.", "Jenis dokumen", "Template dokumen", "clipboard"),
      c("deadlines", "Pelacakan tenggat", "Susun daftar tenggat dari teks yang berantakan.", "calendar", "Ekstrak tenggat dari teks ini. Tandai mana yang sudah lewat bila tanggal disebut, dan mana yang masih perlu dikonfirmasi.", "Catatan tenggat", "Daftar tenggat", "calendar"),
      c("antislop-admin", "Antislop admin", "Rapikan notulen dan memo dari kalimat bertele-tele.", "slop", "Periksa teks administrasi ini. Temukan kata jargon, kalimat panjang, dan pernyataan tanpa pemilik atau tenggat. Tulis versi ringkas.", "Notulen atau memo", "Teks administrasi yang lebih jelas", "slop"),
    ],
  },
];

export const TEMPLATES = ROLES.flatMap((role) => role.capabilities.map((cap) => ({
  id: `t-${cap.id}`,
  role: role.id,
  title: cap.label,
  text: susunPrompt(role, cap),
})));

export const MODEL_PRESETS = [
  { id: "opencode", label: "OpenCode, agent utama", endpoint: "http://localhost:4096", model: "", format: "opencode", directory: "", hint: "Memakai session OpenCode lewat HTTP API. Server harus aktif dan mengizinkan origin aplikasi ini." },
  { id: "openai", label: "OpenAI kompatibel", endpoint: "https://api.openai.com/v1/chat/completions", model: "gpt-4o-mini", format: "openai", directory: "", hint: "Endpoint Chat Completions. Kunci disimpan hanya di perangkat ini." },
  { id: "gemini", label: "Google Gemini", endpoint: "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent", model: "gemini-2.0-flash", format: "gemini", directory: "", hint: "Kunci dikirim sebagai parameter permintaan hanya saat tombol kirim ditekan." },
  { id: "anthropic", label: "Anthropic kompatibel", endpoint: "https://api.anthropic.com/v1/messages", model: "claude-3-5-haiku-latest", format: "anthropic", directory: "", hint: "Membutuhkan header akses browser langsung dari penyedia." },
  { id: "custom", label: "Endpoint sendiri", endpoint: "", model: "", format: "openai", directory: "", hint: "Pakai proxy atau jembatan milikmu supaya kunci tidak disimpan di browser." },
];

export const SLOP_PATTERNS = {
  emDash: { label: "Tanda hubung panjang", severity: "tinggi", hint: "Ganti dengan koma, titik, atau kurung." },
  buzzwords: { label: "Kata jargon", severity: "tinggi", hint: "Ganti dengan manfaat yang bisa diverifikasi." },
  genericCta: { label: "Ajakan umum", severity: "tinggi", hint: "Sebut tindakan spesifik." },
  fakeStats: { label: "Angka tanpa konteks", severity: "tinggi", hint: "Sertakan sumber atau hapus angka." },
  emoji: { label: "Emoji dekoratif", severity: "sedang", hint: "Hapus bila tidak menyampaikan informasi." },
  filler: { label: "Kata isian", severity: "sedang", hint: "Hapus atau tulis ulang kalimatnya." },
  exclamation: { label: "Tanda seru berulang", severity: "rendah", hint: "Satu tanda seru sudah cukup." },
  longSentence: { label: "Kalimat terlalu panjang", severity: "sedang", hint: "Pecah menjadi dua kalimat." },
  absolute: { label: "Klaim mutlak", severity: "tinggi", hint: "Batasi klaim atau sertakan bukti." },
  vague: { label: "Kata kabur", severity: "sedang", hint: "Ganti dengan tindakan atau kondisi yang jelas." },
};

export const BUZZWORDS = [
  "ai powered", "next generation", "revolutionary", "seamless", "cutting edge",
  "intelligent", "ultimate", "powerful", "effortless", "game changer",
  "unlock", "elevate", "leverage", "streamline", "robust", "innovative",
  "revolutioner", "mutakhir", "unggul", "terbaik di kelasnya", "solusi terbaik",
  "pengalaman tak terlupakan", "kinerja maksimal", "fungsi canggih",
];

export const GENERIC_CTA = [
  "get started", "learn more", "try now", "explore", "discover", "click here",
  "mulai sekarang", "pelajari lebih lanjut", "coba sekarang", "jelajahi", "klik di sini",
];

export const FILLER = [
  "as an ai", "i hope this helps", "in today's fast-paced", "delve", "tapestry",
  "testament to", "in the realm of", "navigate the landscape", "it is important to note",
  "pada dasarnya", "secara umum", "tentunya", "pastinya",
];

export const ABSOLUTE_CLAIMS = [
  "selalu", "tidak pernah", "100%", "paling", "terbaik", "satu-satunya",
  "dijamin", "pasti", "tanpa risiko", "semua orang",
];

export const VAGUE_WORDS = [
  "hal", "item", "stuff", "things", "fitur", "produk", "informasi",
  "beberapa", "tertentu", "dll", "dan lain-lain",
];

export const TERM_PAIRS = [
  ["pengguna", "user"],
  ["antarmuka", "interface"],
  ["konten", "content"],
  ["desain", "design"],
  ["tulisan", "copy"],
  ["pesan", "message"],
];

export const BUZZWORD_REPLACEMENTS = {
  "revolutionary": "baru",
  "seamless": "mulus",
  "cutting edge": "terkini",
  "powerful": "kuat",
  "effortless": "mudah",
  "next generation": "generasi berikutnya",
  "ai powered": "menggunakan AI",
  "ultimate": "utama",
  "intelligent": "cerdas",
  "game changer": "perubahan besar",
  "revolutioner": "baru",
  "unggul": "lebih baik",
  "terbaik di kelasnya": "unggul di kategorinya",
  "solusi terbaik": "pilihan yang bisa dibandingkan",
  "kinerja maksimal": "kinerja yang diukur",
  "fungsi canggih": "fungsi yang disebut jelas",
};
