import { SLOP_PATTERNS, BUZZWORDS, GENERIC_CTA, FILLER, BUZZWORD_REPLACEMENTS } from "./data.js";

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function findAll(text, regex) {
  const out = [];
  let match;
  const re = new RegExp(regex.source, regex.flags.includes("g") ? regex.flags : `${regex.flags}g`);
  while ((match = re.exec(text)) !== null) {
    out.push({ index: match.index, value: match[0] });
    if (match[0] === "") re.lastIndex += 1;
  }
  return out;
}

function excerpt(text, index, length) {
  const start = Math.max(0, index - 22);
  const end = Math.min(text.length, index + length + 22);
  return `${start > 0 ? "..." : ""}${text.slice(start, end).trim()}${end < text.length ? "..." : ""}`;
}

export function textStats(text) {
  const clean = String(text || "").trim();
  const words = clean ? clean.split(/\s+/).filter(Boolean) : [];
  const sentences = clean ? clean.split(/[.!?]+/).map((s) => s.trim()).filter(Boolean) : [];
  return {
    words: words.length,
    sentences: sentences.length,
    avgSentence: sentences.length ? Math.round((words.length / sentences.length) * 10) / 10 : 0,
    longest: sentences.reduce((max, s) => Math.max(max, s.split(/\s+/).filter(Boolean).length), 0),
  };
}

export function analyzeSlop(text) {
  const source = String(text || "");
  const findings = [];
  const add = (type, match, message) => {
    findings.push({
      type,
      label: SLOP_PATTERNS[type].label,
      severity: SLOP_PATTERNS[type].severity,
      hint: SLOP_PATTERNS[type].hint,
      match: match.value,
      excerpt: excerpt(source, match.index, match.value.length),
      message,
    });
  };

  for (const match of findAll(source, /—/g)) add("emDash", match, "Karakter ini dilarang dalam teks yang ditulis agent.");

  for (const term of BUZZWORDS) {
    for (const match of findAll(source, new RegExp(`\\b${escapeRegExp(term)}\\b`, "gi"))) {
      add("buzzwords", match, `"${term}" tidak menjelaskan manfaat yang bisa diverifikasi.`);
    }
  }

  for (const term of GENERIC_CTA) {
    for (const match of findAll(source, new RegExp(`\\b${escapeRegExp(term)}\\b`, "gi"))) {
      add("genericCta", match, `"${term}" bisa diganti dengan tindakan yang lebih spesifik.`);
    }
  }

  for (const term of FILLER) {
    for (const match of findAll(source, new RegExp(`\\b${escapeRegExp(term)}\\b`, "gi"))) {
      add("filler", match, `"${term}" adalah kata isian yang bisa dipotong.`);
    }
  }

  const statRegex = /\b\d[\d.,]*(?:\s?%|\s?[kmbt])?\s?\+?\s?(?:users?|customers?|countries|uptime|requests?|followers?|views?|downloads?|pelanggan|pengguna(?:\s+aktif)?|negara|x\s+lebih\s+cepat|lebih\s+cepat)\b/gi;
  for (const match of findAll(source, statRegex)) add("fakeStats", match, "Angka ini perlu sumber yang nyata bila dipertahankan.");

  for (const match of findAll(source, /\p{Extended_Pictographic}/gu)) add("emoji", match, "Emoji di teks UI bersaing dengan pesan utama.");

  for (const match of findAll(source, /!{2,}/g)) add("exclamation", match, "Tanda seru berulang terasa seperti iklan.");

  for (const sentence of source.split(/[.!?]+/)) {
    const trimmed = sentence.trim();
    const count = trimmed ? trimmed.split(/\s+/).filter(Boolean).length : 0;
    if (count > 30) {
      add("longSentence", { index: source.indexOf(trimmed), value: trimmed.slice(0, 42) + "..." }, `Kalimat ini punya ${count} kata.`);
    }
  }

  findings.sort((a, b) => a.index - b.index);
  const stats = textStats(source);
  return { findings, stats };
}

export function cleanSlop(text) {
  const changes = [];
  let result = String(text || "");

  if (result.includes("—")) {
    result = result.replace(/—/g, ", ");
    changes.push("Em dash diganti koma");
  }

  const emojiCount = (result.match(/\p{Extended_Pictographic}/gu) || []).length;
  if (emojiCount) {
    result = result.replace(/\p{Extended_Pictographic}/gu, "");
    changes.push(`${emojiCount} emoji dihapus`);
  }

  for (const [term, replacement] of Object.entries(BUZZWORD_REPLACEMENTS)) {
    const re = new RegExp(`\\b${escapeRegExp(term)}\\b`, "gi");
    if (re.test(result)) {
      result = result.replace(re, replacement);
      changes.push(`"${term}" diganti "${replacement}"`);
    }
  }

  if (/!{2,}/.test(result)) {
    result = result.replace(/!{2,}/g, "!");
    changes.push("Tanda seru berulang dirapikan");
  }

  result = result.replace(/[ \t]{2,}/g, " ").replace(/ *,/g, ",").replace(/\n{3,}/g, "\n\n").trim();
  return { text: result, changes };
}

function channel(hex) {
  const clean = String(hex || "").replace("#", "").trim();
  if (!/^[0-9a-f]{6}$/i.test(clean)) return null;
  return [0, 2, 4].map((i) => parseInt(clean.slice(i, i + 2), 16));
}

function relativeLuminance(hex) {
  const rgb = channel(hex);
  if (!rgb) return null;
  const [r, g, b] = rgb.map((value) => {
    const scaled = value / 255;
    return scaled <= 0.03928 ? scaled / 12.92 : ((scaled + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contrastRatio(hexA, hexB) {
  const a = relativeLuminance(hexA);
  const b = relativeLuminance(hexB);
  if (a === null || b === null) return null;
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
}

export function contrastReport(fg, bg) {
  const ratio = contrastRatio(fg, bg);
  if (ratio === null) return { ok: false, label: "Hex tidak valid", ratio: null };
  const shown = ratio.toFixed(2).replace(".", ",");
  if (ratio >= 7) return { ok: true, label: `AAA ${shown}:1`, ratio };
  if (ratio >= 4.5) return { ok: true, label: `AA teks biasa ${shown}:1`, ratio };
  if (ratio >= 3) return { ok: true, label: `AA teks besar ${shown}:1`, ratio };
  return { ok: false, label: `Di bawah AA, ${shown}:1`, ratio };
}
