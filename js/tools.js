import { ABSOLUTE_CLAIMS, VAGUE_WORDS, TERM_PAIRS, GENERIC_CTA, BUZZWORDS, FILLER } from "./data.js";
import { analyzeSlop, contrastReport, textStats } from "./analyzers.js";

const HARI = /senin|selasa|rabu|kamis|jumat|sabtu|minggu|\b\d{1,2}\/\d{1,2}\b|\b\d{4}-\d{2}-\d{2}\b/i;

function bersih(text) {
  return String(text || "").trim();
}

function baris(text) {
  return bersih(text).split(/\n+/).map((line) => line.trim()).filter(Boolean);
}

function temuan(label, detail, tone = "warn") {
  return { label, detail, tone };
}

function hasil(label, findings, note, stats = []) {
  return { label, findings, note, stats };
}

function mengandung(teks, daftar) {
  const lower = teks.toLowerCase();
  return daftar.find((kata) => lower.includes(String(kata).toLowerCase())) || null;
}

function hitungKata(teks) {
  return textStats(teks).words;
}

function analisisSlop(text) {
  const source = analyzeSlop(text);
  const findings = source.findings.map((item) => temuan(item.label, item.message, item.severity === "tinggi" ? "warn" : "info"));
  return hasil(
    "Pemeriksaan pola teks",
    findings,
    "Pemeriksaan ini memakai pola tetap. Baca ulang hasilnya sebelum dipakai.",
    [`${source.stats.words} kata`, `${source.stats.sentences} kalimat`, `${findings.length} temuan`]
  );
}

function analisisMicrocopy(text) {
  const findings = [];
  const source = bersih(text);
  if (!source) return hasil("Pemeriksaan teks pendek", [], "Tulis teks lebih dulu.");

  for (const line of baris(source)) {
    if (hitungKata(line) > 18) findings.push(temuan("Kalimat panjang", `${hitungKata(line)} kata: ${line.slice(0, 70)}`));
  }
  const cta = mengandung(source, GENERIC_CTA);
  if (cta) findings.push(temuan("Ajakan umum", `"${cta}" belum menyebut tindakan nyata.`));
  const kabur = mengandung(source, VAGUE_WORDS);
  if (kabur) findings.push(temuan("Kata kabur", `"${kabur}" bisa diganti dengan kondisi atau tindakan spesifik.`, "info"));
  if (/—/.test(source)) findings.push(temuan("Tanda hubung panjang", "Karakter ini tidak dipakai dalam teks ACE."));
  if (/!{2,}/.test(source)) findings.push(temuan("Tanda seru", "Tanda seru berulang terasa seperti iklan.", "info"));

  return hasil("Pemeriksaan teks pendek", findings, "Kalimat pendek belum selalu jelas. Cek juga apakah tindakannya bisa langsung dilakukan.", [`${baris(source).length} baris`, `${findings.length} temuan`]);
}

function analisisRiset(text) {
  const findings = [];
  const source = bersih(text);
  if (!source) return hasil("Pemeriksaan pertanyaan riset", [], "Tulis daftar pertanyaan lebih dulu.");

  const questions = source.split(/[?\n]+/).map((item) => item.trim()).filter(Boolean);
  for (const question of questions) {
    if (/\batau\b/i.test(question)) findings.push(temuan("Pertanyaan ganda", `"${question.slice(0, 70)}" meminta dua jawaban sekaligus.`));
    if (/\b(setuju|suka|penting|setidaknya|tentu)\b/i.test(question)) findings.push(temuan("Pertanyaan mengarah", `"${question.slice(0, 70)}" bisa mendorong jawaban tertentu.`));
    if (hitungKata(question) < 4) findings.push(temuan("Terlalu singkat", `"${question}" belum memberi konteks.`, "info"));
  }
  if (questions.length < 3) findings.push(temuan("Jumlah pertanyaan", "Baru ada beberapa pertanyaan. Tambah sudut yang belum tercakup.", "info"));
  if (!mengandung(source, ["siapa", "kapan", "di mana", "bagaimana", "ceritakan"])) {
    findings.push(temuan("Konteks belum jelas", "Tambahkan konteks siapa, kapan, atau bagaimana agar jawaban bisa dipakai.", "info"));
  }
  return hasil("Pemeriksaan pertanyaan riset", findings, "Pertanyaan netral membantu mengurangi jawaban yang hanya mengiyakan.", [`${questions.length} pertanyaan`, `${findings.length} temuan`]);
}

function analisisKlaim(text) {
  const findings = [];
  const source = bersih(text);
  if (!source) return hasil("Pemeriksaan klaim", [], "Tulis teks lebih dulu.");

  const angka = [...source.matchAll(/\b\d[\d.,]*(?:\s?%|\s?[kmbt])?\s?\+?\b/gi)];
  for (const match of angka) {
    const awal = Math.max(0, match.index - 70);
    const akhir = Math.min(source.length, match.index + match[0].length + 70);
    const sekitar = source.slice(awal, akhir);
    if (!/\b(sumber|menurut|berdasarkan|data|tanggal|jam|versi|halaman|nomor|no\.)\b/i.test(sekitar)) {
      findings.push(temuan("Angka tanpa penjelas", `"${match[0]}" belum punya sumber atau konteks.`));
    }
  }
  for (const kata of ABSOLUTE_CLAIMS) {
    if (new RegExp(`\\b${kata.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i").test(source)) {
      findings.push(temuan("Klaim mutlak", `"${kata}" perlu dibatasi atau dibuktikan.`));
    }
  }
  return hasil("Pemeriksaan klaim", findings, "Angka dan klaim mutlak tidak dihapus otomatis. Kamu yang memutuskan buktinya.", [`${angka.length} angka ditemukan`, `${findings.length} temuan`]);
}

function analisisStruktur(text) {
  const findings = [];
  const source = bersih(text);
  const rows = baris(source);
  if (!rows.length) return hasil("Pemeriksaan struktur", [], "Tulis kerangka atau naskah lebih dulu.");

  const judul = rows.filter((line) => /^#{1,6}\s/.test(line) || (/^[\p{Lu}\s\d]{4,60}$/u.test(line) && !/[.!?]$/.test(line))).length;
  const poin = rows.filter((line) => /^([-*+]|\d+[.)])\s/.test(line)).length;
  const paragrafPanjang = rows.filter((line) => hitungKata(line) > 100).length;

  if (rows.length > 6 && judul === 0 && poin === 0) findings.push(temuan("Tanpa pembagi", "Teks ini belum punya heading atau daftar poin."));
  if (paragrafPanjang) findings.push(temuan("Paragraf terlalu panjang", `${paragrafPanjang} baris melebihi 100 kata.`, "info"));
  if (judul && judul < 2 && rows.length > 10) findings.push(temuan("Bagian belum berkembang", "Pertimbangkan memecah isi menjadi beberapa bagian.", "info"));

  return hasil("Pemeriksaan struktur", findings, "Struktur yang rapi memudahkan pembaca menemukan keputusan dan pertanyaan.", [`${rows.length} baris`, `${judul} judul`, `${poin} poin`]);
}

function analisisMarkup(text) {
  const findings = [];
  const source = bersih(text);
  if (!source) return hasil("Pemeriksaan markup", [], "Tempel cuplikan HTML lebih dulu.");

  const gambar = [...source.matchAll(/<img\b[^>]*>/gi)].map((m) => m[0]);
  const tanpaAlt = gambar.filter((tag) => !/\balt\s*=/.test(tag));
  if (tanpaAlt.length) findings.push(temuan("Gambar tanpa alt", `${tanpaAlt.length} tag img belum punya atribut alt.`));

  const inputs = [...source.matchAll(/<input\b[^>]*>/gi)].map((m) => m[0]);
  const punyaLabel = /<label\b/i.test(source) || inputs.every((tag) => /aria-(label|labelledby)\s*=/.test(tag));
  if (inputs.length && !punyaLabel) findings.push(temuan("Kolom tanpa nama", "Sebagian input belum punya label atau aria-label."));

  if (/<button\b[^>]*>\s*<\/button>/i.test(source)) findings.push(temuan("Tombol kosong", "Ada button tanpa teks atau nama yang terbaca."));
  if (/<div\b[^>]*class=["'][^"']*\bbtn\b/i.test(source)) findings.push(temuan("Elemen bukan tombol", "Div dengan kelas btn tidak punya perilaku keyboard bawaan."));
  if (/\son(click|change|submit|keydown)\s*=/i.test(source)) findings.push(temuan("Peristiwa sebaris", "Pindahkan pengendali ke skrip supaya lebih mudah dirawat.", "info"));

  const levels = [...source.matchAll(/<h([1-6])\b/gi)].map((m) => Number(m[1]));
  if (levels.length && levels[0] > 1) findings.push(temuan("Judul awal", "Halaman sebaiknya dimulai dari h1.", "info"));
  for (let i = 1; i < levels.length; i += 1) {
    if (levels[i] - levels[i - 1] > 1) {
      findings.push(temuan("Tingkat judul melompat", `Urutan ${levels[i - 1]} ke ${levels[i]} perlu diperiksa.`, "info"));
      break;
    }
  }

  return hasil("Pemeriksaan markup", findings, "Pemeriksaan ini hanya membaca teks. Uji keyboard dan pembaca layar tetap diperlukan.", [`${gambar.length} gambar`, `${inputs.length} input`, `${findings.length} temuan`]);
}

function analisisState(text) {
  const findings = [];
  const source = bersih(text);
  if (!source) return hasil("Pemeriksaan kondisi", [], "Tulis nama komponen atau daftar kondisi lebih dulu.");

  const pasangan = [
    ["kosong", "empty"],
    ["memuat", "loading"],
    ["error", "gagal"],
    ["sukses", "berhasil"],
    ["fokus", "focus"],
    ["dinonaktifkan", "disabled"],
  ];
  for (const [depan, belakang] of pasangan) {
    if (!new RegExp(`${depan}|${belakang}`, "i").test(source)) findings.push(temuan("Kondisi belum tertulis", `Belum ada petunjuk untuk kondisi ${depan}.`));
  }
  return hasil("Pemeriksaan kondisi", findings, "Tiap kondisi perlu pesan dan tindakan berikutnya, bukan hanya tampilan.", [`${pasangan.length} kelompok kondisi`, `${findings.length} yang belum ada`]);
}

function analisisResponsive(text) {
  const findings = [];
  const source = bersih(text);
  if (!source) return hasil("Pemeriksaan responsif", [], "Tempel CSS atau HTML lebih dulu.");

  const lebarTetap = [...source.matchAll(/width\s*:\s*(\d{3,})px/gi)];
  for (const match of lebarTetap.slice(0, 5)) findings.push(temuan("Lebar tetap", `${match[1]}px berisiko meluap di layar kecil.`, "info"));
  const kecil = [...source.matchAll(/font-size\s*:\s*(\d{1,2})px/gi)].filter((m) => Number(m[1]) < 14);
  if (kecil.length) findings.push(temuan("Teks kecil", `${kecil.length} aturan memakai ukuran di bawah 14px.`, "info"));
  if (source.length > 120 && !/@media\b/.test(source)) findings.push(temuan("Tanpa breakpoint", "Belum ada aturan @media untuk lebar lain.", "info"));
  if (/white-space\s*:\s*nowrap/i.test(source)) findings.push(temuan("Teks tidak bisa pindah baris", "nowrap bisa membuat teks keluar dari wadah.", "info"));

  return hasil("Pemeriksaan responsif", findings, "Uji juga pada lebar 390px, 768px, dan lebar desktop.", [`${lebarTetap.length} lebar tetap`, `${findings.length} temuan`]);
}

function analisisPerforma(text) {
  const findings = [];
  const source = bersih(text);
  if (!source) return hasil("Pemeriksaan performa", [], "Tempel cuplikan kode atau daftar aset lebih dulu.");

  const gambar = [...source.matchAll(/<img\b[^>]*>/gi)].map((m) => m[0]);
  for (const tag of gambar) {
    if (!/\bwidth\s*=/.test(tag) || !/\bheight\s*=/.test(tag)) {
      findings.push(temuan("Ukuran gambar belum ada", "Tambahkan atribut width dan height supaya ruang disiapkan sebelum gambar dimuat."));
      break;
    }
  }
  if (/<(script|link)\b[^>]+(src|href)\s*=\s*["']https?:\/\//i.test(source)) findings.push(temuan("Aset eksternal", "Aset pihak ketiga bisa menunda tampilan.", "info"));
  if (/@import\b/i.test(source)) findings.push(temuan("CSS @import", "Pertimbangkan menggabungkan berkas CSS.", "info"));
  if (/animation\s*:[^;]*infinite/i.test(source)) findings.push(temuan("Animasi berulang", "Pastikan gerak berulang punya fungsi dan bisa dimatikan.", "info"));

  return hasil("Pemeriksaan performa", findings, "Temuan bersifat statis. Ukur juga di perangkat yang sebenarnya bila tersedia.", [`${gambar.length} gambar`, `${findings.length} temuan`]);
}

function analisisPalet(text) {
  const findings = [];
  const source = bersih(text);
  const hexes = [...new Set([...source.matchAll(/#([0-9a-f]{6})\b/gi)].map((m) => `#${m[1].toUpperCase()}`))];
  if (!hexes.length) return hasil("Pemeriksaan palet", [], "Tulis kode hex 6 karakter, misalnya #F5F4EE.");

  for (const hex of hexes) {
    const putih = contrastReport(hex, "#FFFFFF");
    const hitam = contrastReport(hex, "#000000");
    const terbaik = Math.max(putih.ratio || 0, hitam.ratio || 0);
    if (terbaik < 4.5) findings.push(temuan("Warna sulit dipasangkan", `${hex} tidak mencapai 4,5:1 terhadap putih maupun hitam.`));
  }
  if (hexes.length < 2) findings.push(temuan("Palet belum lengkap", "Tambahkan warna latar dan warna teks untuk bisa dibandingkan.", "info"));
  if (hexes.length > 6) findings.push(temuan("Terlalu banyak warna", "Tandai peran tiap warna supaya palet tetap terkendali.", "info"));

  return hasil("Pemeriksaan palet", findings, "Kontras dihitung dengan rasio WCAG terhadap putih dan hitam.", [`${hexes.length} warna unik`, `${findings.length} temuan`]);
}

function analisisPasangan(text) {
  const source = bersih(text);
  const hexes = [...source.matchAll(/#([0-9a-f]{6})\b/gi)].map((m) => `#${m[1].toUpperCase()}`);
  if (hexes.length < 2) return hasil("Cek kontras pasangan", [temuan("Hex belum lengkap", "Tulis dua kode hex, contoh #1F1E1B dan #F5F4EE.")], "Teks pertama dipakai sebagai warna teks, teks kedua sebagai latar.");
  const report = contrastReport(hexes[0], hexes[1]);
  const tone = report.ok ? "good" : "warn";
  return hasil("Cek kontras pasangan", [temuan(report.label, `${hexes[0]} di atas ${hexes[1]}`, tone)], `Ambang AA teks biasa adalah 4,5:1.`, [hexes[0], hexes[1]]);
}

function analisisKalender(text) {
  const findings = [];
  const rows = baris(bersih(text));
  if (!rows.length) return hasil("Pemeriksaan jadwal", [], "Tulis jadwal atau rencana lebih dulu.");

  const groups = new Map();
  for (const row of rows) {
    const day = row.match(HARI)?.[0]?.toLowerCase();
    if (!day) continue;
    groups.set(day, (groups.get(day) || 0) + 1);
  }
  for (const [day, count] of groups) {
    if (count > 2) findings.push(temuan("Beban harian tinggi", `${day} punya ${count} entri.`, "info"));
  }
  if (!groups.size) findings.push(temuan("Tidak ada penanda hari", "Tambahkan hari atau tanggal pada tiap baris jadwal."));
  if (!/\baset|gambar|video|foto|desain\b/i.test(rows.join(" "))) findings.push(temuan("Kebutuhan aset belum ada", "Tandai aset yang harus disiapkan untuk tiap entri.", "info"));

  return hasil("Pemeriksaan jadwal", findings, "Jadwal yang realistis lebih berguna daripada daftar yang penuh.", [`${rows.length} baris`, `${groups.size} hari terdeteksi`]);
}

function analisisMatriks(text) {
  const findings = [];
  const rows = baris(bersih(text));
  if (!rows.length) return hasil("Matriks prioritas", [], "Tulis daftar tugas lebih dulu.");

  const items = [];
  for (const row of rows) {
    const angka = [...row.matchAll(/\b(\d{1,5})\b/g)].map((m) => Number(m[1]));
    if (angka.length >= 2) items.push({ row, dampak: angka[0], usaha: angka[1] });
  }
  if (items.length < 3) findings.push(temuan("Format belum lengkap", "Tulis minimal tiga baris berbentuk Nama, dampak, usaha. Contoh: Rapikan alur, 4, 2.", "info"));

  const kuadran = { sekarang: 0, jadwalkan: 0, tunda: 0 };
  for (const item of items) {
    if (item.dampak >= 3 && item.usaha <= 3) kuadran.sekarang += 1;
    else if (item.dampak >= 3) kuadran.jadwalkan += 1;
    else kuadran.tunda += 1;
  }
  return hasil("Matriks prioritas", findings, "Angka pada matriks berasal dari penilaianmu. ACE tidak menentukan bobot tanpa data.", [
    `${items.length} baris terbaca`,
    `${kuadran.sekarang} kerjakan sekarang`,
    `${kuadran.jadwalkan} jadwalkan`,
    `${kuadran.tunda} tunda`,
  ]);
}

function analisisIstilah(text) {
  const findings = [];
  const source = bersih(text);
  if (!source) return hasil("Pemeriksaan istilah", [], "Tulis naskah atau daftar istilah lebih dulu.");

  for (const [depan, belakang] of TERM_PAIRS) {
    const a = (source.match(new RegExp(`\\b${depan}\\b`, "gi")) || []).length;
    const b = (source.match(new RegExp(`\\b${belakang}\\b`, "gi")) || []).length;
    if (a && b) findings.push(temuan("Istilah ganda", `"${depan}" dan "${belakang}" dipakai bersamaan. Pilih satu bila tidak ada alasan.`, "info"));
  }
  const buzz = mengandung(source, BUZZWORDS);
  if (buzz) findings.push(temuan("Kata jargon", `"${buzz}" belum menjelaskan manfaat konkret.`));
  const isi = mengandung(source, FILLER);
  if (isi) findings.push(temuan("Kata isian", `"${isi}" bisa dipotong.`, "info"));

  return hasil("Pemeriksaan istilah", findings, "Konsistensi membantu pembaca mengenali hal yang sama tanpa menebak.", [`${findings.length} temuan`]);
}

function analisisChecklist(text) {
  const findings = [];
  const source = bersih(text);
  if (!source) return hasil("Pemeriksaan kelengkapan", [], "Tulis dokumen atau daftar isi lebih dulu.");

  const pokok = ["tujuan", "pembaca", "keluaran", "batasan", "asumsi", "langkah"];
  for (const kata of pokok) {
    if (!new RegExp(`\\b${kata}\\b`, "i").test(source)) findings.push(temuan("Bagian belum ada", `Belum ada penanda ${kata}.`));
  }
  return hasil("Pemeriksaan kelengkapan", findings, "Kata kunci membantu menemukan bagian yang kosong, bukan menggantikan penilaian manual.", [`${pokok.length} bagian dicek`, `${findings.length} belum ada`]);
}

export function runTool(id, text) {
  switch (id) {
    case "slop": return analisisSlop(text);
    case "microcopy": return analisisMicrocopy(text);
    case "research": return analisisRiset(text);
    case "claims": return analisisKlaim(text);
    case "structure": return analisisStruktur(text);
    case "markup": return analisisMarkup(text);
    case "states": return analisisState(text);
    case "responsive": return analisisResponsive(text);
    case "performance": return analisisPerforma(text);
    case "palette": return analisisPalet(text);
    case "contrast": return analisisPasangan(text);
    case "calendar": return analisisKalender(text);
    case "matrix": return analisisMatriks(text);
    case "terms": return analisisIstilah(text);
    case "checklist": return analisisChecklist(text);
    default: return hasil("Pemeriksaan", [], "Alat pemeriksaan belum tersedia untuk kapabilitas ini.");
  }
}

export function daftarHasilTeks(toolResult) {
  if (!toolResult?.findings?.length) return toolResult?.note || "Tidak ada temuan.";
  return toolResult.findings.map((item) => `${item.label}: ${item.detail}`).join("\n");
}
