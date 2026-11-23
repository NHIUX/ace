import { ROLES, TEMPLATES, MODEL_PRESETS } from "./data.js";
import { analyzeSlop, cleanSlop, contrastReport, textStats } from "./analyzers.js";
import { getState, loadState, saveState, resetState, exportJson, importJson, uid } from "./state.js";

const MODULES = [
  { id: "home", label: "Beranda", hint: "Fokus dan pintasan" },
  { id: "studio", label: "Studio Peran", hint: "Tujuh peran kerja" },
  { id: "antislop", label: "Antislop", hint: "Scan dan bersihkan teks" },
  { id: "prompt", label: "Prompt Lab", hint: "Model dan pustaka prompt" },
  { id: "planner", label: "Content Planner", hint: "Kalender mingguan" },
  { id: "writer", label: "Writer", hint: "Bab dan naskah" },
  { id: "assets", label: "Aset & Warna", hint: "Palet dan potongan kode" },
  { id: "data", label: "Data & Setelan", hint: "Cadangan, tema, informasi" },
];

const BOTTOM = [
  { id: "home", label: "Beranda" },
  { id: "work", label: "Kerja" },
  { id: "antislop", label: "Antislop" },
  { id: "prompt", label: "Prompt" },
  { id: "data", label: "Arsip" },
];

let current = "home";
let activeRole = "ux";
let promptFilter = "semua";
let promptQuery = "";
let lastAnalysis = null;
let lastClean = null;
let confirmReset = false;
let modelBusy = false;

const view = document.getElementById("view");
const pageTitle = document.getElementById("pageTitle");
const dialog = document.getElementById("workDialog");
const statusbar = document.getElementById("statusbar");

function h(value) {
  return String(value ?? "").replace(/[&<>"']/g, (char) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  })[char]);
}

function notify(message, kind = "ok") {
  statusbar.hidden = false;
  statusbar.dataset.kind = kind;
  statusbar.textContent = message;
  if (kind === "ok") setTimeout(() => { statusbar.hidden = true; }, 2600);
}

function panel(title, description, body, extra = "") {
  return `<section class="panel ${extra}"><div class="panel-head"><div><h2>${h(title)}</h2>${description ? `<p class="muted small">${h(description)}</p>` : ""}</div></div>${body}</section>`;
}

function empty(message) {
  return `<div class="empty"><p>${h(message)}</p></div>`;
}

function dateKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function fmtDate(date) {
  return new Intl.DateTimeFormat("id-ID", { weekday: "short", day: "numeric", month: "short" }).format(date);
}

function mondayOf(date) {
  const d = new Date(date);
  const day = (d.getDay() + 6) % 7;
  d.setDate(d.getDate() - day);
  d.setHours(0, 0, 0, 0);
  return d;
}

function setField(path, value) {
  const keys = path.split(".");
  const last = keys.pop();
  const parent = keys.reduce((node, key) => (node == null ? undefined : node[key]), getState());
  if (parent && typeof parent === "object") parent[last] = value;
}

function fieldValue(path) {
  return path.split(".").reduce((node, key) => (node == null ? undefined : node[key]), getState());
}

function renderHome() {
  const state = getState();
  const focus = state.focus.length
    ? `<ul class="list">${state.focus.map((item) => `<li class="item ${item.done ? "is-done" : ""}">
        <input type="checkbox" data-role="focus" data-id="${item.id}" ${item.done ? "checked" : ""} aria-label="Selesaikan ${h(item.text)}">
        <div class="item-body"><div class="item-title">${h(item.text)}</div></div>
        <button class="btn btn-danger" type="button" data-action="remove" data-path="focus" data-id="${item.id}">Hapus</button>
      </li>`).join("")}</ul>`
    : empty("Belum ada fokus. Tulis satu hal yang paling perlu selesai sekarang.");

  const roles = `<div class="grid-cards">${ROLES.map((role) => `<button class="shortcut" type="button" data-action="role" data-role-id="${role.id}"><strong>${h(role.label)}</strong><span>${h(role.summary)}</span></button>`).join("")}</div>`;

  const ideas = state.ideas.length
    ? `<ul class="list">${state.ideas.map((idea) => `<li class="item"><div class="item-body"><div class="item-title">${h(idea.title)}</div><p class="small">${h(idea.body)}</p><div class="item-meta">${h(ROLES.find((r) => r.id === idea.role)?.label || "Umum")} · ${h(idea.status || "Ide")}</div></div><button class="btn btn-danger" type="button" data-action="remove" data-path="ideas" data-id="${idea.id}">Hapus</button></li>`).join("")}</ul>`
    : empty("Belum ada ide. Tulis satu sudut pandang yang mau kamu kerjakan.");

  return `<section class="focus-card"><div class="panel-head"><div><h2>Fokus berjalan</h2><p class="muted small">Satu hal di atas permukaan lain.</p></div></div>${focus}
      <form class="row" data-form="add-focus"><div class="field"><label for="focus-input">Fokus baru</label><input id="focus-input" name="text" placeholder="Contoh: rapikan alur beranda" required></div><button class="btn btn-primary" type="submit">Tambah fokus</button></form>
    </section>
    <div class="grid2">
      ${panel("Catatan cepat", "Tersimpan di perangkat ini.", `<div class="field"><label class="sr-only" for="quick-note">Catatan cepat</label><textarea id="quick-note" data-bind="quickNote" placeholder="Tulis catatan singkat">${h(state.quickNote)}</textarea></div>`)}
      ${panel("Langkah berikutnya", "Pilih peran untuk membuka checklist dan alatnya.", roles)}
      ${panel("Ide cepat", "Tampung ide sebelum masuk kalender atau naskah.", ideas + `<form class="item-stack" data-form="add-idea"><div class="field"><label for="idea-title">Judul ide</label><input id="idea-title" name="title" placeholder="Judul singkat" required></div><div class="field"><label for="idea-role">Peran</label><select id="idea-role" name="role">${ROLES.map((r) => `<option value="${r.id}" ${r.id === "creator" ? "selected" : ""}>${h(r.label)}</option>`).join("")}</select></div><div class="field"><label for="idea-body">Catatan ide</label><textarea id="idea-body" name="body" placeholder="Sudut pandang atau poin utama"></textarea></div><button class="btn btn-primary" type="submit">Simpan ide</button></form>`)}
    </div>
    ${panel("Tentang aplikasi ini", "Tidak perlu laptop, tidak perlu koneksi internet untuk alat lokal.", `<p class="muted small">ACE adalah PWA. Pasang di Android lewat menu browser, lalu buka seperti aplikasi biasa. Data tersimpan di perangkat. Koneksi ke model AI hanya dipakai kalau kamu mengisi endpoint sendiri di Prompt Lab.</p>`)}`;
}

function renderStudio() {
  const state = getState();
  const role = ROLES.find((r) => r.id === activeRole) || ROLES[0];
  const checks = state.roleChecks[role.id] || [];
  const checkList = checks.length
    ? `<ul class="list">${checks.map((item) => `<li class="item ${item.done ? "is-done" : ""}">
        <input type="checkbox" data-role="check" data-role-id="${role.id}" data-id="${item.id}" ${item.done ? "checked" : ""} aria-label="Tandai ${h(item.label)}">
        <div class="item-body"><div class="item-title">${h(item.label)}</div></div>
        <button class="btn btn-danger" type="button" data-action="remove-check" data-role-id="${role.id}" data-id="${item.id}">Hapus</button>
      </li>`).join("")}</ul>`
    : empty("Belum ada langkah. Tambahkan satu langkah sesuai pekerjaanmu.");

  const outputs = `<div class="chips">${role.outputs.map((o) => `<span class="badge">${h(o)}</span>`).join("")}</div>`;
  const templates = TEMPLATES.filter((t) => t.role === role.id);
  const templateList = templates.length
    ? `<ul class="list">${templates.map((t) => `<li class="item"><div class="item-body"><div class="item-title">${h(t.title)}</div><pre>${h(t.text)}</pre></div><button class="btn" type="button" data-action="use-template" data-id="${t.id}">Pakai</button></li>`).join("")}</ul>`
    : empty("Belum ada template untuk peran ini.");

  const toolLinks = role.tools.map((tool) => {
    const label = { contrast: "Cek kontras", antislop: "Scan Antislop", prompt: "Prompt Lab" }[tool];
    const target = tool === "contrast" ? "assets" : tool;
    return `<button class="btn" type="button" data-action="nav" data-view="${target}">${h(label)}</button>`;
  }).join("");

  return `<section class="panel"><div class="panel-head"><div><h2>${h(role.label)}</h2><p class="muted small">${h(role.summary)}</p></div><span class="badge" data-tone="ok">${h(role.short)}</span></div>
      <div class="item-actions">${toolLinks}</div></section>
    <div class="grid2">
      ${panel("Checklist kerja", "Langkah awal bisa dicentang, diubah, atau dihapus.", checkList + `<form class="row" data-form="add-check" data-role-id="${role.id}"><div class="field"><label for="new-check">Langkah baru</label><input id="new-check" name="label" placeholder="Contoh: cek state error" required></div><button class="btn btn-primary" type="submit">Tambah</button></form>`)}
      ${panel("Hasil yang diharapkan", "Daftar keluaran untuk peran ini.", outputs + `<div class="field" style="margin-top:14px"><label for="role-note">Catatan peran</label><textarea id="role-note" data-bind="roleNotes.${role.id}" placeholder="Catat keputusan atau temuan">${h(state.roleNotes[role.id])}</textarea></div>`)}
    </div>
    ${panel("Template terkait", "Tombol Pakai membuka teks di Prompt Lab.", templateList)}`;
}

function renderAntislop() {
  const state = getState();
  let result = panel("Scan teks", "Alat lokal, teks tidak dikirim ke mana pun.", `<div class="field"><label class="sr-only" for="slop-input">Teks untuk diperiksa</label><textarea id="slop-input" data-bind="slopDraft" placeholder="Tempel teks yang ingin diperiksa">${h(state.slopDraft)}</textarea></div><div class="item-actions" style="margin-top:10px"><button class="btn btn-primary" type="button" data-action="analyze">Periksa teks</button><button class="btn" type="button" data-action="clean-preview">Lihat versi bersih</button></div>`);

  if (lastAnalysis) {
    const stats = lastAnalysis.stats;
    const counts = `<div class="summary"><span>${stats.words} kata</span><span>${stats.sentences} kalimat</span><span>rata-rata ${String(stats.avgSentence).replace(".", ",")} kata per kalimat</span><span>${lastAnalysis.findings.length} temuan</span></div>`;
    const findings = lastAnalysis.findings.length
      ? `<ul class="list">${lastAnalysis.findings.map((f) => `<li class="item"><div class="item-body"><div class="item-title">${h(f.label)} <span class="badge">${h(f.severity)}</span></div><div class="item-meta">${h(f.message)}</div><p class="small">${h(f.excerpt)}</p><p class="muted small">${h(f.hint)}</p></div></li>`).join("")}</ul>`
      : empty("Tidak ada pola yang terdeteksi. Tetap baca ulang untuk memastikan maknanya benar.");
    result += panel("Hasil pemeriksaan", "Temuan berasal dari pola nyata pada teksmu.", counts + findings);
  }

  if (lastClean) {
    const changes = lastClean.changes.length
      ? `<ul class="list">${lastClean.changes.map((c) => `<li class="item"><div class="item-body"><div class="item-title">${h(c)}</div></div></li>`).join("")}</ul>`
      : empty("Tidak ada perubahan otomatis. Perbaikan tetap perlu dilakukan manual.");
    result += panel("Versi bersih", "Periksa dulu sebelum dipakai.", changes + `<div class="field"><label for="clean-output">Hasil</label><textarea id="clean-output" readonly>${h(lastClean.text)}</textarea></div><div class="item-actions" style="margin-top:8px"><button class="btn btn-primary" type="button" data-action="apply-clean">Pakai sebagai draf</button><button class="btn" type="button" data-action="copy-clean">Salin hasil</button></div>`);
  }
  return result;
}

function renderPrompt() {
  const state = getState();
  const model = state.settings.model;
  const filtered = [...TEMPLATES, ...state.customPrompts].filter((t) => {
    const roleOk = promptFilter === "semua" || t.role === promptFilter;
    const q = promptQuery.trim().toLowerCase();
    const queryOk = !q || `${t.title} ${t.text} ${t.role}`.toLowerCase().includes(q);
    return roleOk && queryOk;
  });

  const library = `<div class="row"><div class="field"><label for="prompt-search">Cari prompt</label><input id="prompt-search" value="${h(promptQuery)}" placeholder="Contoh: kontras atau CTA"></div><div class="field"><label for="prompt-filter">Peran</label><select id="prompt-filter"><option value="semua" ${promptFilter === "semua" ? "selected" : ""}>Semua</option>${ROLES.map((r) => `<option value="${r.id}" ${promptFilter === r.id ? "selected" : ""}>${h(r.label)}</option>`).join("")}</select></div></div>
    <ul class="list" style="margin-top:12px">${filtered.length ? filtered.map((t) => `<li class="item"><div class="item-body"><div class="item-title">${h(t.title)}</div><div class="item-meta">${h(ROLES.find((r) => r.id === t.role)?.label || t.role || "Umum")}</div><pre>${h(t.text)}</pre></div><div class="item-actions"><button class="btn" type="button" data-action="use-template" data-id="${t.id}">Pakai</button><button class="btn" type="button" data-action="copy-template" data-id="${t.id}">Salin</button>${state.customPrompts.some((p) => p.id === t.id) ? `<button class="btn btn-danger" type="button" data-action="remove-custom" data-id="${t.id}">Hapus</button>` : ""}</div></li>`).join("") : empty("Tidak ada prompt yang cocok dengan pencarian.")}</ul>`;

  const config = `<form class="item-stack" data-form="save-model">
      <div class="row">
        <div class="field"><label for="model-preset">Preset</label><select id="model-preset" name="preset">${MODEL_PRESETS.map((p) => `<option value="${p.id}" ${model.preset === p.id ? "selected" : ""}>${h(p.label)}</option>`).join("")}</select></div>
        <div class="field"><label for="model-format">Format API</label><select id="model-format" name="format"><option value="openai" ${model.format === "openai" ? "selected" : ""}>OpenAI compatible</option><option value="gemini" ${model.format === "gemini" ? "selected" : ""}>Gemini</option><option value="anthropic" ${model.format === "anthropic" ? "selected" : ""}>Anthropic</option></select></div>
      </div>
      <div class="field"><label for="model-endpoint">Endpoint</label><input id="model-endpoint" name="endpoint" value="${h(model.endpoint)}" placeholder="https://..."></div>
      <div class="row"><div class="field"><label for="model-name">Nama model</label><input id="model-name" name="model" value="${h(model.model)}" placeholder="nama model"></div><div class="field"><label for="model-key">Kunci API</label><input id="model-key" name="apiKey" type="password" value="${h(model.apiKey)}" placeholder="kosongkan bila tidak perlu"></div></div>
      <button class="btn btn-primary" type="submit">Simpan pengaturan model</button>
    </form><p class="muted small" style="margin-top:10px">Kunci disimpan di browser perangkat ini. Jangan dipakai di perangkat bersama. Pengiriman prompt hanya terjadi saat tombol Kirim ditekan.</p>`;

  const composer = `<form class="item-stack" data-form="build-prompt"><div class="row"><div class="field"><label for="compose-role">Peran</label><select id="compose-role" name="role">${ROLES.map((r) => `<option ${r.id === activeRole ? "selected" : ""}>${h(r.label)}</option>`).join("")}</select></div><div class="field"><label for="compose-task">Tugas</label><input id="compose-task" name="task" placeholder="Contoh: susun state form login" required></div></div><button class="btn" type="submit">Susun prompt</button></form>
    <div class="field" style="margin-top:12px"><label for="prompt-compose">Prompt</label><textarea id="prompt-compose" placeholder="Prompt siap kirim muncul di sini">${h(window.__agComposedPrompt || "")}</textarea></div>
    <div class="item-actions" style="margin-top:8px"><button class="btn btn-primary" type="button" data-action="send-model" ${modelBusy ? "disabled" : ""}>${modelBusy ? "Mengirim..." : "Kirim ke model"}</button><button class="btn" type="button" data-action="copy-compose">Salin prompt</button></div>
    <div class="field" style="margin-top:12px"><label for="model-output">Jawaban model</label><textarea id="model-output" readonly placeholder="Jawaban muncul di sini"></textarea></div>`;

  const customForm = `<form class="item-stack" data-form="add-custom-prompt"><div class="field"><label for="custom-title">Nama prompt</label><input id="custom-title" name="title" required></div><div class="field"><label for="custom-role">Peran</label><select id="custom-role" name="role">${ROLES.map((r) => `<option value="${r.id}">${h(r.label)}</option>`).join("")}</select></div><div class="field"><label for="custom-text">Isi prompt</label><textarea id="custom-text" name="text" required></textarea></div><button class="btn btn-primary" type="submit">Simpan prompt</button></form>`;

  return `${panel("Koneksi model", "Opsional. Alat lokal tetap berfungsi tanpa ini.", config)}
    ${panel("Pustaka prompt", `${TEMPLATES.length + state.customPrompts.length} prompt tersedia.`, library)}
    <div class="grid2">${panel("Komposer", "Susun prompt lalu kirim bila model sudah diatur.", composer)}${panel("Prompt sendiri", "Simpan prompt yang sering dipakai.", customForm)}</div>`;
}

function renderPlanner() {
  const state = getState();
  const offset = state.planner.offset || 0;
  const base = mondayOf(new Date());
  base.setDate(base.getDate() + offset * 7);
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(base);
    d.setDate(d.getDate() + i);
    return d;
  });
  const today = dateKey(new Date());
  const channels = ["Feed", "Story", "Video", "Artikel", "Newsletter"];
  const grid = `<div class="week">${days.map((day) => {
    const key = dateKey(day);
    const items = state.planner.items.filter((i) => i.date === key);
    const list = items.length ? `<ul class="list">${items.map((item) => `<li class="item ${item.done ? "is-done" : ""}"><input type="checkbox" data-role="plan" data-id="${item.id}" ${item.done ? "checked" : ""} aria-label="Selesai ${h(item.title)}"><div class="item-body"><div class="item-title">${h(item.title)}</div><div class="item-meta">${h(item.channel)}</div></div><button class="btn btn-danger" type="button" data-action="remove" data-path="planner.items" data-id="${item.id}">Hapus</button></li>`).join("")}</ul>` : empty("Belum ada jadwal.");
    return `<section class="day ${key === today ? "is-today" : ""}"><h3><time datetime="${key}">${h(fmtDate(day))}</time></h3>${list}<form class="item-stack" data-form="add-plan" data-date="${key}"><div class="field"><label class="sr-only" for="plan-${key}">Judul ${h(fmtDate(day))}</label><input id="plan-${key}" name="title" placeholder="Judul unggahan" required></div><div class="field"><label class="sr-only" for="chan-${key}">Kanal ${h(fmtDate(day))}</label><select id="chan-${key}" name="channel">${channels.map((c) => `<option>${c}</option>`).join("")}</select></div><button class="btn btn-primary" type="submit">Tambah</button></form></section>`;
  }).join("")}</div>`;
  return `<section class="panel"><div class="week-head"><div><h2>${h(fmtDate(days[0]))} sampai ${h(fmtDate(days[6]))}</h2><p class="muted small">Hari berjalan diberi garis aksen.</p></div><div class="item-actions"><button class="btn" type="button" data-action="week-prev">Sebelumnya</button><button class="btn" type="button" data-action="week-today">Hari ini</button><button class="btn" type="button" data-action="week-next">Berikutnya</button></div></div>${grid}</section>`;
}

function renderWriter() {
  const state = getState();
  const chapters = state.writer.chapters;
  const total = chapters.reduce((sum, c) => sum + (Number(c.words) || 0), 0);
  const done = chapters.filter((c) => c.status === "Selesai").length;
  const list = chapters.length ? `<ul class="list">${chapters.map((c, i) => `<li class="item"><div class="item-body item-stack"><div class="item-meta">Bab ${i + 1}</div><input data-path="writer.chapters" data-id="${c.id}" data-prop="title" value="${h(c.title)}" aria-label="Judul bab ${i + 1}"><div class="row"><div class="field"><label class="sr-only" for="st-${c.id}">Status bab ${i + 1}</label><select id="st-${c.id}" data-path="writer.chapters" data-id="${c.id}" data-prop="status">${["Rancangan", "Draft", "Selesai"].map((s) => `<option ${c.status === s ? "selected" : ""}>${s}</option>`).join("")}</select></div><div class="field"><label class="sr-only" for="tg-${c.id}">Target kata bab ${i + 1}</label><input id="tg-${c.id}" type="number" min="0" inputmode="numeric" data-path="writer.chapters" data-id="${c.id}" data-prop="target" data-type="number" value="${h(c.target ?? "")}" placeholder="Target"></div><div class="field"><label class="sr-only" for="wd-${c.id}">Kata tercatat bab ${i + 1}</label><input id="wd-${c.id}" type="number" min="0" inputmode="numeric" data-path="writer.chapters" data-id="${c.id}" data-prop="words" data-type="number" value="${h(c.words ?? "")}" placeholder="Kata tercatat"></div></div></div><button class="btn btn-danger" type="button" data-action="remove" data-path="writer.chapters" data-id="${c.id}">Hapus</button></li>`).join("")}</ul>` : empty("Belum ada bab. Tambahkan bab pertama.");

  return `${panel("Ringkasan", "Angka berasal dari kolom yang kamu isi.", `<div class="summary"><span>${chapters.length} bab</span><span>${done} selesai</span><span>${new Intl.NumberFormat("id-ID").format(total)} kata tercatat</span></div>`)}
    <div class="grid2">${panel("Sinopsis", "Premis dan konflik utama.", `<div class="field"><label class="sr-only" for="synopsis">Sinopsis</label><textarea id="synopsis" data-bind="writer.synopsis" placeholder="Tulis premis">${h(state.writer.synopsis)}</textarea></div>`)}${panel("Tokoh dan dunia", "Catatan tokoh, motif, dan aturan dunia.", `<div class="field"><label class="sr-only" for="characters">Tokoh dan dunia</label><textarea id="characters" data-bind="writer.characters" placeholder="Tulis catatan tokoh">${h(state.writer.characters)}</textarea></div>`)}</div>
    <div class="grid2">${panel("Daftar bab", "Isi target dan kata untuk melihat progres nyata.", list + `<form class="row" data-form="add-chapter"><div class="field"><label for="chapter-title">Judul bab</label><input id="chapter-title" name="title" placeholder="Judul bab" required></div><button class="btn btn-primary" type="submit">Tambah bab</button></form>`)}${panel("Target keseluruhan", "Opsional.", `<form class="row" data-form="set-target"><div class="field"><label for="target-words">Target kata</label><input id="target-words" type="number" min="0" inputmode="numeric" name="target" value="${h(state.writer.targetWords ?? "")}" placeholder="Contoh: 60000"></div><button class="btn btn-primary" type="submit">Simpan</button></form>`)}</div>`;
}

function renderAssets() {
  const state = getState();
  const palette = state.palette.map((color) => {
    const report = contrastReport(color.hex, "#FFFFFF");
    return `<div class="swatch"><label class="small" for="pname-${color.id}">Peran warna</label><input id="pname-${color.id}" data-path="palette" data-id="${color.id}" data-prop="name" value="${h(color.name)}"><div><input type="color" data-role="color" data-path="palette" data-id="${color.id}" data-prop="hex" value="${h(color.hex)}" aria-label="Warna ${h(color.name)}"><input data-role="hex" data-path="palette" data-id="${color.id}" data-prop="hex" value="${h(color.hex)}" aria-label="Hex ${h(color.name)}"></div><span class="badge" data-tone="${report.ok ? "ok" : "plain"}">${h(report.label)}</span><button class="btn btn-danger" type="button" data-action="remove" data-path="palette" data-id="${color.id}">Hapus</button></div>`;
  }).join("");

  const snippets = state.snippets.length ? `<ul class="list">${state.snippets.map((s) => `<li class="item"><div class="item-body item-stack"><input data-path="snippets" data-id="${s.id}" data-prop="title" value="${h(s.title)}" aria-label="Nama potongan"><input data-path="snippets" data-id="${s.id}" data-prop="tag" value="${h(s.tag)}" aria-label="Tag"><textarea data-path="snippets" data-id="${s.id}" data-prop="code" aria-label="Kode">${h(s.code)}</textarea></div><div class="item-actions"><button class="btn" type="button" data-action="copy-snippet" data-id="${s.id}">Salin</button><button class="btn btn-danger" type="button" data-action="remove" data-path="snippets" data-id="${s.id}">Hapus</button></div></li>`).join("")}</ul>` : empty("Belum ada potongan kode.");

  return `${panel("Palet kerja", "Kontras dihitung terhadap putih.", `<div class="palette">${palette}</div><form class="row" data-form="add-color" style="margin-top:14px"><div class="field"><label for="color-name">Peran</label><input id="color-name" name="name" placeholder="Contoh: garis" required></div><div class="field"><label for="color-hex">Hex</label><input id="color-hex" name="hex" value="#52635C" required></div><button class="btn btn-primary" type="submit">Tambah warna</button></form>`)}
    ${panel("Cek kontras pasangan", "Masukkan dua hex untuk memeriksa teks dan latar.", `<form class="row" data-form="check-contrast"><div class="field"><label for="fg">Teks</label><input id="fg" name="fg" value="#1F1E1B" required></div><div class="field"><label for="bg">Latar</label><input id="bg" name="bg" value="#F5F4EE" required></div><button class="btn btn-primary" type="submit">Periksa</button></form><div id="contrast-result" class="summary"></div>`)}
    ${panel("Potongan kode", "Simpan cuplikan yang sering dipakai.", snippets + `<form class="item-stack" data-form="add-snippet"><div class="row"><div class="field"><label for="snip-title">Nama</label><input id="snip-title" name="title" required></div><div class="field"><label for="snip-tag">Tag</label><input id="snip-tag" name="tag" placeholder="css"></div></div><div class="field"><label for="snip-code">Kode</label><textarea id="snip-code" name="code"></textarea></div><button class="btn btn-primary" type="submit">Simpan potongan</button></form>`)}`;
}

function markdownExport() {
  const state = getState();
  const lines = ["# ACE, Ekspor Data", "", "## Fokus", ...state.focus.map((f) => `- ${f.done ? "[x]" : "[ ]"} ${f.text}`), "", "## Catatan cepat", state.quickNote || "Kosong", "", "## Catatan peran"];
  for (const role of ROLES) lines.push(`### ${role.label}`, state.roleNotes[role.id] || "Kosong", "");
  lines.push("## Ide", ...state.ideas.map((i) => `- ${i.title} (${i.status || "Ide"}) dengan ${i.role || "umum"}: ${i.body}`), "", "## Jadwal konten", ...state.planner.items.map((i) => `- ${i.date}: ${i.title} (${i.channel})`), "", "## Naskah", state.writer.synopsis || "Kosong", "", ...state.writer.chapters.flatMap((c) => [`### ${c.title} (${c.status})`, `Target: ${c.target ?? "-"}, tercatat: ${c.words ?? "-"}`]));
  return lines.join("\n");
}

function renderData() {
  const state = getState();
  return `${panel("Cadangan data", "Semua data ada di browser perangkat ini.", `<div class="item-actions"><button class="btn btn-primary" type="button" data-action="export-json">Unduh JSON</button><button class="btn" type="button" data-action="export-md">Unduh Markdown</button><label class="btn" for="import-file">Impor JSON</label><input id="import-file" type="file" accept="application/json" class="sr-only"></div><p class="muted small" style="margin-top:10px">Impor akan mengganti data saat ini. Unduh cadangan dulu bila perlu.</p>`)}
    ${panel("Tampilan", "Tema disimpan di perangkat.", `<div class="item-actions"><button class="btn" type="button" data-action="theme" data-theme="paper">Terang</button><button class="btn" type="button" data-action="theme" data-theme="night">Gelap</button></div>`)}
    ${panel("Pasang di Android", "Langkah singkat.", `<ol class="list"><li class="item"><div class="item-body">Buka alamat aplikasi di Chrome Android.</div></li><li class="item"><div class="item-body">Pilih menu browser, lalu Add to Home screen atau Install app.</div></li><li class="item"><div class="item-body">Buka ikon aplikasi. Alat lokal tetap berfungsi tanpa internet setelah terpasang.</div></li></ol>`)}
    ${panel("Keadaan kosong", "Menghapus semua data tidak bisa dibatalkan.", `<button class="btn btn-danger" type="button" data-action="reset">${confirmReset ? "Ya, hapus semua data" : "Hapus semua data"}</button>`)}
    ${panel("Tentang", "Informasi aplikasi.", `<p class="muted small">Versi 2, PWA offline. Dibuat dengan OpenCode. Tidak ada akun, tidak ada pengiriman otomatis. Prompt ke model hanya dikirim saat kamu menekan Kirim ke model.</p>`)}`;
}

const RENDERERS = {
  home: renderHome,
  studio: renderStudio,
  antislop: renderAntislop,
  prompt: renderPrompt,
  planner: renderPlanner,
  writer: renderWriter,
  assets: renderAssets,
  data: renderData,
};

function buildNav() {
  document.getElementById("rail").innerHTML = `<ul class="rail-list">${MODULES.map((m) => `<li><button class="rail-btn" type="button" data-action="nav" data-view="${m.id}"><strong>${h(m.label)}</strong><span>${h(m.hint)}</span></button></li>`).join("")}</ul>`;
  document.getElementById("bottomNav").innerHTML = BOTTOM.map((b) => `<button type="button" data-action="${b.id === "work" ? "open-work" : "nav"}" ${b.id === "work" ? "" : `data-view="${b.id}"`}>${h(b.label)}</button>`).join("");
  document.getElementById("workDialogList").innerHTML = `${ROLES.map((r) => `<button class="btn" type="button" data-action="role" data-role-id="${r.id}">${h(r.label)} <span class="muted small">${h(r.summary)}</span></button>`).join("")}<hr><button class="btn" type="button" data-action="nav" data-view="planner">Content Planner</button><button class="btn" type="button" data-action="nav" data-view="writer">Writer</button><button class="btn" type="button" data-action="nav" data-view="assets">Aset & Warna</button><button class="btn" type="button" data-action="nav" data-view="studio">Studio Peran</button>`;
}

function markNav() {
  document.querySelectorAll("[data-action='nav']").forEach((b) => {
    if (b.dataset.view === current) b.setAttribute("aria-current", "page");
    else b.removeAttribute("aria-current");
  });
  const work = document.querySelector("[data-action='open-work']");
  if (work) {
    if (current === "studio" || current === "planner" || current === "writer" || current === "assets") work.setAttribute("aria-current", "page");
    else work.removeAttribute("aria-current");
  }
}

function navigate(id) {
  if (!RENDERERS[id]) return;
  current = id;
  pageTitle.textContent = MODULES.find((m) => m.id === id)?.label || "Ruang kerja";
  if (dialog.open) dialog.close();
  markNav();
  render();
  window.scrollTo({ top: 0 });
}

function openRole(id) {
  activeRole = id;
  navigate("studio");
}

function render() {
  try {
    view.innerHTML = RENDERERS[current]();
  } catch (error) {
    console.error(error);
    view.innerHTML = `<div class="panel"><h2>Tampilan gagal dibuat</h2><p class="muted">Buka modul lain lalu periksa konsol.</p></div>`;
  }
  markNav();
}

function commit() {
  const result = saveState();
  if (!result.ok) notify(`Gagal menyimpan di perangkat: ${result.error}`, "error");
  return result;
}

function markTheme() {
  const theme = getState().settings.theme || "paper";
  document.documentElement.dataset.theme = theme;
  document.querySelectorAll("[data-action='theme']").forEach((button) => {
    button.setAttribute("aria-pressed", String(button.dataset.theme === theme));
  });
}

function applyTheme(theme) {
  if (theme !== "paper" && theme !== "night") return;
  getState().settings.theme = theme;
  markTheme();
  commit();
  render();
  notify(theme === "night" ? "Tema gelap aktif" : "Tema terang aktif");
}

async function copyText(text) {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    }
    const helper = document.createElement("textarea");
    helper.value = text;
    helper.setAttribute("readonly", "");
    helper.style.position = "fixed";
    helper.style.opacity = "0";
    document.body.appendChild(helper);
    helper.select();
    const ok = document.execCommand("copy");
    helper.remove();
    return ok;
  } catch {
    return false;
  }
}

async function flashCopy(button, text) {
  const ok = await copyText(text);
  const before = button.textContent;
  button.textContent = ok ? "Tersalin" : "Salin manual";
  setTimeout(() => { button.textContent = before; }, 1300);
}

function handleField(target) {
  const state = getState();
  if (target.dataset.bind !== undefined) {
    setField(target.dataset.bind, target.value);
    commit();
    return;
  }
  if (target.dataset.path && target.dataset.id && target.dataset.prop) {
    const list = fieldValue(target.dataset.path);
    const item = list?.find((entry) => entry.id === target.dataset.id);
    if (!item) return;
    item[target.dataset.prop] = target.dataset.type === "number"
      ? (target.value === "" ? null : Number(target.value))
      : target.value;
    commit();
  }
}

view.addEventListener("input", (event) => {
  if (["check", "focus", "plan", "color", "hex"].includes(event.target.dataset.role)) return;
  handleField(event.target);
});

view.addEventListener("change", (event) => {
  const t = event.target;
  const state = getState();
  if (t.dataset.role === "check") {
    const item = state.roleChecks[t.dataset.roleId]?.find((x) => x.id === t.dataset.id);
    if (item) { item.done = t.checked; commit(); render(); }
    return;
  }
  if (t.dataset.role === "focus") {
    const item = state.focus.find((x) => x.id === t.dataset.id);
    if (item) { item.done = t.checked; commit(); render(); }
    return;
  }
  if (t.dataset.role === "plan") {
    const item = state.planner.items.find((x) => x.id === t.dataset.id);
    if (item) { item.done = t.checked; commit(); render(); }
    return;
  }
  const wasPalette = String(t.dataset.path || "").includes("palette");
  handleField(t);
  if (wasPalette) render();
  if (t.id === "prompt-search") { promptQuery = t.value; render(); }
  if (t.id === "prompt-filter") { promptFilter = t.value; render(); }
  if (t.id === "import-file") handleImport(t);
});

view.addEventListener("submit", (event) => {
  event.preventDefault();
  const form = event.target;
  const data = new FormData(form);
  const value = (key) => String(data.get(key) || "").trim();
  const type = form.dataset.form;
  const state = getState();

  if (type === "add-focus") {
    if (!value("text")) return;
    state.focus.push({ id: uid(), text: value("text"), done: false });
  } else if (type === "add-idea") {
    state.ideas.push({ id: uid(), title: value("title"), body: value("body"), role: value("role"), status: "Ide" });
  } else if (type === "add-check") {
    state.roleChecks[form.dataset.roleId].push({ id: uid(), label: value("label"), done: false });
  } else if (type === "add-plan") {
    state.planner.items.push({ id: uid(), date: form.dataset.date, title: value("title"), channel: value("channel"), done: false });
  } else if (type === "add-chapter") {
    state.writer.chapters.push({ id: uid(), title: value("title"), status: "Rancangan", target: null, words: null });
  } else if (type === "set-target") {
    state.writer.targetWords = value("target") === "" ? null : Number(value("target"));
  } else if (type === "add-color") {
    if (!/^#[0-9a-f]{6}$/i.test(value("hex"))) { notify("Hex harus 6 karakter, contoh #52635C", "error"); return; }
    state.palette.push({ id: uid(), name: value("name"), hex: value("hex") });
  } else if (type === "add-snippet") {
    state.snippets.push({ id: uid(), title: value("title"), tag: value("tag"), code: value("code") });
  } else if (type === "check-contrast") {
    const report = contrastReport(value("fg"), value("bg"));
    document.getElementById("contrast-result").innerHTML = `<span class="badge" data-tone="${report.ok ? "ok" : "plain"}">${h(report.label)}</span>`;
    return;
  } else if (type === "save-model") {
    const preset = MODEL_PRESETS.find((p) => p.id === value("preset"));
    state.settings.model = { preset: value("preset"), endpoint: value("endpoint"), model: value("model"), format: value("format"), apiKey: value("apiKey") };
    if (preset) state.settings.model.format = preset.format;
    commit();
    notify("Pengaturan model tersimpan");
    render();
    return;
  } else if (type === "build-prompt") {
    const role = value("role");
    const task = value("task");
    const composed = `Bertindak sebagai ${role}.\n\nTugas: ${task}\n\nKeluarkan:\n1. Langkah pengerjaan\n2. Hasil akhir yang bisa langsung dipakai\n3. Asumsi yang perlu dikonfirmasi\n\nAturan: Bahasa Indonesia, langsung, tanpa klaim atau angka tanpa sumber.`;
    window.__agComposedPrompt = composed;
    document.getElementById("prompt-compose").value = composed;
    return;
  } else if (type === "add-custom-prompt") {
    state.customPrompts.push({ id: uid(), role: value("role"), title: value("title"), text: value("text") });
  } else {
    return;
  }
  form.reset();
  commit();
  render();
});

view.addEventListener("click", async (event) => {
  const button = event.target.closest("button[data-action]");
  if (!button) return;
  const action = button.dataset.action;
  const state = getState();

  if (action === "remove" || action === "remove-check") {
    const list = action === "remove-check" ? state.roleChecks[button.dataset.roleId] : fieldValue(button.dataset.path);
    const index = list?.findIndex((x) => x.id === button.dataset.id) ?? -1;
    if (index >= 0) list.splice(index, 1);
    commit(); render(); return;
  }
  if (action === "week-prev" || action === "week-next" || action === "week-today") {
    if (action === "week-today") state.planner.offset = 0;
    else state.planner.offset += action === "week-next" ? 1 : -1;
    commit(); render(); return;
  }
  if (action === "role") return;
  if (action === "analyze") {
    lastAnalysis = analyzeSlop(state.slopDraft);
    lastClean = null;
    render(); return;
  }
  if (action === "clean-preview") {
    lastClean = cleanSlop(state.slopDraft);
    render(); return;
  }
  if (action === "apply-clean") {
    state.slopDraft = lastClean.text;
    lastAnalysis = analyzeSlop(state.slopDraft);
    commit(); render(); notify("Draf diperbarui"); return;
  }
  if (action === "clean-copy") { await flashCopy(button, lastClean?.text || ""); return; }
  if (action === "copy-clean") { await flashCopy(button, lastClean?.text || ""); return; }
  if (action === "use-template") {
    const item = [...TEMPLATES, ...state.customPrompts].find((t) => t.id === button.dataset.id);
    if (item) {
      window.__agComposedPrompt = item.text;
      navigate("prompt");
      const area = document.getElementById("prompt-compose");
      if (area) area.value = item.text;
    }
    return;
  }
  if (action === "copy-template") {
    const item = [...TEMPLATES, ...state.customPrompts].find((t) => t.id === button.dataset.id);
    if (item) await flashCopy(button, item.text);
    return;
  }
  if (action === "remove-custom") {
    const index = state.customPrompts.findIndex((p) => p.id === button.dataset.id);
    if (index >= 0) state.customPrompts.splice(index, 1);
    commit(); render(); return;
  }
  if (action === "copy-compose") { await flashCopy(button, document.getElementById("prompt-compose").value); return; }
  if (action === "copy-snippet") {
    const item = state.snippets.find((s) => s.id === button.dataset.id);
    if (item) await flashCopy(button, item.code);
    return;
  }
  if (action === "send-model") { await sendToModel(button); return; }
  if (action === "export-json") { download("ace-data.json", exportJson(), "application/json"); return; }
  if (action === "export-md") { download("ace-data.md", markdownExport(), "text/markdown"); return; }
  if (action === "reset") {
    if (!confirmReset) { confirmReset = true; render(); return; }
    resetState();
    confirmReset = false;
    lastAnalysis = null; lastClean = null;
    markTheme();
    render(); notify("Data dihapus"); return;
  }
});

function download(name, content, type) {
  const blob = new Blob([content], { type: `${type};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

async function handleImport(input) {
  const file = input.files?.[0];
  if (!file) return;
  try {
    importJson(await file.text());
    markTheme();
    render();
    notify("Data berhasil diimpor");
  } catch (error) {
    notify(`Gagal mengimpor: ${error.message}`, "error");
  }
  input.value = "";
}

async function sendToModel(button) {
  const model = getState().settings.model;
  const prompt = document.getElementById("prompt-compose").value.trim();
  const output = document.getElementById("model-output");
  if (!prompt) { notify("Tulis prompt lebih dulu", "error"); return; }
  if (!model.endpoint || !model.model) { notify("Isi endpoint dan nama model di Pengaturan", "error"); return; }
  modelBusy = true;
  button.disabled = true;
  button.textContent = "Mengirim...";
  output.value = "Mengirim prompt ke endpoint yang kamu atur...";
  try {
    const text = await requestModel(model, prompt);
    output.value = text;
    notify("Jawaban diterima");
  } catch (error) {
    output.value = "";
    notify(`Gagal menghubungi model: ${error.message}`, "error");
  } finally {
    modelBusy = false;
    button.disabled = false;
    button.textContent = "Kirim ke model";
  }
}

async function requestModel(model, prompt) {
  const headers = { "content-type": "application/json" };
  let url = model.endpoint;
  let body;
  if (model.format === "gemini") {
    body = { contents: [{ parts: [{ text: prompt }] }] };
    url = `${model.endpoint}${model.endpoint.includes("?") ? "&" : "?"}key=${encodeURIComponent(model.apiKey)}`;
  } else if (model.format === "anthropic") {
    body = { model: model.model, max_tokens: 1500, messages: [{ role: "user", content: prompt }] };
    headers["x-api-key"] = model.apiKey;
    headers["anthropic-version"] = "2023-06-01";
    headers["anthropic-dangerous-direct-browser-access"] = "true";
  } else {
    body = { model: model.model, messages: [{ role: "user", content: prompt }], temperature: 0.4 };
    if (model.apiKey) headers.Authorization = `Bearer ${model.apiKey}`;
  }
  const response = await fetch(url, { method: "POST", headers, body: JSON.stringify(body) });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data?.error?.message || `HTTP ${response.status}`);
  if (model.format === "gemini") return data.candidates?.[0]?.content?.parts?.map((p) => p.text || "").join("") || "Tidak ada teks yang dikembalikan.";
  if (model.format === "anthropic") return data.content?.filter((c) => c.type === "text").map((c) => c.text).join("") || "Tidak ada teks yang dikembalikan.";
  return data.choices?.[0]?.message?.content || "Tidak ada teks yang dikembalikan.";
}

document.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-action]");
  if (!button) return;
  const action = button.dataset.action;
  if (action === "nav") navigate(button.dataset.view);
  else if (action === "role") openRole(button.dataset.roleId);
  else if (action === "theme") applyTheme(button.dataset.theme);
  else if (action === "open-work") { if (!dialog.open) dialog.showModal(); }
  else if (action === "close-dialog") dialog.close();
});

dialog.addEventListener("click", (event) => { if (event.target === dialog) dialog.close(); });

function init() {
  loadState();
  markTheme();
  buildNav();
  navigate("home");
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("./sw.js").catch((error) => console.warn("Service worker gagal", error));
  }
}

init();
