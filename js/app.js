import { ROLES, TEMPLATES, MODEL_PRESETS, ICONS } from "./data.js";
import { analyzeSlop, cleanSlop, contrastReport } from "./analyzers.js";
import { runTool, daftarHasilTeks } from "./tools.js";
import { getState, loadState, saveState, resetState, exportJson, importJson, uid } from "./state.js";

const BOTTOM = [
  { id: "ux", label: "UX", icon: "ux" },
  { id: "graphic", label: "Grafis", icon: "graphic" },
  { id: "frontend", label: "Kode", icon: "frontend" },
  { id: "planner", label: "Rencana", icon: "planner" },
  { id: "admin", label: "Admin", icon: "admin" },
];

const DESKS = {
  ux: deskUX,
  graphic: deskGraphic,
  frontend: deskFrontend,
  writer: deskWriter,
  drafter: deskDrafter,
  editor: deskEditor,
  creator: deskCreator,
  planner: deskPlanner,
  admin: deskAdmin,
};

let activeRole = "ux";
let activeCapability = "ux-research";
let composerDraft = "";
let lastAnalysis = null;
let lastClean = null;
let confirmReset = false;
let modelBusy = false;

const view = document.getElementById("view");
const aiBody = document.getElementById("aiDialogBody");
const pageTitle = document.getElementById("pageTitle");
const pageSubtitle = document.getElementById("pageSubtitle");
const contextLabel = document.getElementById("contextLabel");
const dialog = document.getElementById("workDialog");
const aiDialog = document.getElementById("aiDialog");
const statusbar = document.getElementById("statusbar");
const railToggle = document.getElementById("railToggle");
const narrow = window.matchMedia("(max-width: 960px)");

function h(value) {
  return String(value ?? "").replace(/[&<>"']/g, (char) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  })[char]);
}

function icon(name, className = "nav-icon") {
  return `<svg class="${className}" viewBox="0 0 24 24" aria-hidden="true" focusable="false">${ICONS[name] || ICONS.clipboard}</svg>`;
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

function deleteButton(path, id, label) {
  return `<button class="btn btn-danger btn-icon" type="button" data-action="remove" data-path="${h(path)}" data-id="${h(id)}" aria-label="Hapus ${h(label)}">${icon("trash")}<span>Hapus</span></button>`;
}

function deleteCheckButton(roleId, id, label) {
  return `<button class="btn btn-danger btn-icon" type="button" data-action="remove-check" data-role-id="${h(roleId)}" data-id="${h(id)}" aria-label="Hapus langkah ${h(label)}">${icon("trash")}<span>Hapus</span></button>`;
}

function deleteCustomButton(id, label) {
  return `<button class="btn btn-danger btn-icon" type="button" data-action="remove-custom" data-id="${h(id)}" aria-label="Hapus prompt ${h(label)}">${icon("trash")}<span>Hapus</span></button>`;
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

function roleById(id) {
  return ROLES.find((role) => role.id === id) || ROLES[0];
}

function capabilityById(id, role = roleById(activeRole)) {
  return role.capabilities.find((cap) => cap.id === id) || role.capabilities[0];
}

function buildCapabilityPrompt(role, cap) {
  const template = TEMPLATES.find((item) => item.id === `t-${cap.id}`);
  const bahan = String(getState().tools.inputs[cap.id] || "").trim();
  const dasar = template?.text || `Bantu peran ${role.label} pada tugas ${cap.label}.`;
  return bahan ? dasar.replace("[tempel di sini]", bahan) : dasar;
}

function renderToolFinding(item) {
  return `<div class="finding" data-tone="${h(item.tone)}"><strong>${h(item.label)}</strong><p>${h(item.detail)}</p></div>`;
}

function renderToolResult(result) {
  if (!result) return empty("Belum ada pemeriksaan lokal. Tulis bahan lebih dulu, lalu pilih Periksa lokal.");
  const stats = result.stats?.length ? `<div class="summary">${result.stats.map((stat) => `<span>${h(stat)}</span>`).join("")}</div>` : "";
  const findings = result.findings.length
    ? `<div class="finding-list">${result.findings.map(renderToolFinding).join("")}</div>`
    : `<p class="muted small">Tidak ada temuan dari pemeriksaan ini. Tetap baca ulang hasilmu.</p>`;
  return `<div class="tool-result"><h3>${h(result.label)}</h3>${stats}${findings}<p class="muted small">${h(result.note)}</p></div>`;
}

function capList(role, cap, style) {
  const items = role.capabilities.map((item, index) => {
    const active = item.id === cap.id;
    const number = String(index + 1).padStart(2, "0");
    const mark = style === "tiles" ? icon(item.outputIcon || item.icon || "clipboard") : `<span>${number}</span>`;
    return `<li><button class="cap-item" type="button" data-action="capability" data-role-id="${role.id}" data-cap-id="${item.id}" aria-pressed="${active}">
      <span class="cap-mark">${mark}</span>
      <span class="cap-copy"><strong>${h(item.label)}</strong><small>${h(item.summary)}</small></span>
    </button></li>`;
  }).join("");
  return `<ol class="caps caps--${style}">${items}</ol>`;
}

function slopWorkbench(cap, variant) {
  const state = getState();
  const result = lastAnalysis
    ? `<div class="analysis-block"><div class="summary"><span>${lastAnalysis.stats.words} kata</span><span>${lastAnalysis.stats.sentences} kalimat</span><span>${lastAnalysis.findings.length} temuan</span></div>${lastAnalysis.findings.length ? `<div class="finding-list">${lastAnalysis.findings.map((item) => `<div class="finding" data-tone="${item.severity === "tinggi" ? "warn" : "info"}"><strong>${h(item.label)}</strong><p>${h(item.message)}</p><p class="muted small">${h(item.hint)}</p></div>`).join("")}</div>` : empty("Tidak ada pola yang terdeteksi. Tetap baca ulang teksmu.")}</div>`
    : empty("Belum ada pemeriksaan. Tulis teks lalu pilih Periksa teks.");
  const clean = lastClean
    ? `<div class="analysis-block"><h3>Versi bersih</h3><div class="field"><label for="clean-output">Hasil</label><textarea id="clean-output" readonly>${h(lastClean.text)}</textarea></div><div class="tool-actions"><button class="btn btn-primary" type="button" data-action="apply-clean">Pakai sebagai draf</button><button class="btn" type="button" data-action="copy-clean">Salin hasil</button></div></div>`
    : "";
  return `<section class="panel workbench workbench--${variant}">
    <div class="panel-head"><div><h2>${h(cap.label)}</h2><p class="muted small">${h(cap.summary)}</p></div><span class="badge">Al lokal</span></div>
    <div class="field"><label for="slop-input">Teks yang diperiksa</label><textarea id="slop-input" data-bind="slopDraft" placeholder="Tempel teks yang ingin diperiksa">${h(state.slopDraft)}</textarea></div>
    <div class="tool-actions"><button class="btn btn-primary" type="button" data-action="analyze">Periksa teks</button><button class="btn" type="button" data-action="clean-preview">Lihat versi bersih</button></div>
    ${result}${clean}
    <p class="muted small">Pemeriksaan memakai pola tetap di perangkat ini. Teks tidak dikirim ke mana pun.</p>
  </section>`;
}

function workbench(role, cap, variant = "split", options = {}) {
  if (cap.tool === "slop") return slopWorkbench(cap, variant);
  const state = getState();
  const input = state.tools.inputs[cap.id] || "";
  const prompt = state.tools.prompts[cap.id] || buildCapabilityPrompt(role, cap);
  const answer = state.tools.answers[cap.id] || "";
  const result = state.tools.results[cap.id];
  const inputField = options.skipInput ? "" : `<div class="field"><label for="tool-input">Bahan kerja</label><textarea id="tool-input" data-bind="tools.inputs.${cap.id}" placeholder="${h(cap.placeholder)}">${h(input)}</textarea></div>`;
  return `<section class="panel workbench workbench--${variant}">
    <div class="panel-head"><div><h2>${h(cap.label)}</h2><p class="muted small">${h(cap.summary)}</p></div><span class="badge">${h(cap.output)}</span></div>
    <div class="workbench-grid">
      <div class="workbench-col">
        ${inputField}
        <div class="tool-actions"><button class="btn btn-primary" type="button" data-action="run-tool" data-cap-id="${cap.id}">Periksa lokal</button><button class="btn" type="button" data-action="build-tool-prompt" data-cap-id="${cap.id}">Susun prompt AI</button></div>
        <div id="tool-result">${renderToolResult(result)}</div>
      </div>
      <div class="workbench-col">
        <div class="field"><label for="tool-prompt">Prompt AI</label><textarea id="tool-prompt" class="prompt-preview" data-bind="tools.prompts.${cap.id}">${h(prompt)}</textarea></div>
        <div class="tool-actions"><button class="btn btn-primary" type="button" data-action="send-tool" data-cap-id="${cap.id}" ${modelBusy ? "disabled" : ""}>${modelBusy ? "Mengirim..." : "Kirim ke AI"}</button><button class="btn" type="button" data-action="copy-tool-prompt" data-cap-id="${cap.id}">Salin prompt</button></div>
        <div class="field"><label for="tool-answer">Jawaban AI</label><textarea id="tool-answer" class="answer-output" data-bind="tools.answers.${cap.id}" placeholder="Jawaban muncul di sini setelah tombol Kirim ke AI ditekan.">${h(answer)}</textarea></div>
        <p class="muted small">AI opsional. Pemeriksaan lokal tidak mengirim data ke mana pun. Prompt baru dikirim saat kamu menekan tombol.</p>
      </div>
    </div>
  </section>`;
}

function outputChips(role) {
  return `<div class="chips">${role.outputs.map((item) => `<span class="badge">${h(item)}</span>`).join("")}</div>`;
}

function checkListBody(role) {
  const checks = getState().roleChecks[role.id] || [];
  const list = checks.length
    ? `<ul class="list">${checks.map((item) => `<li class="item ${item.done ? "is-done" : ""}">
        <input type="checkbox" data-role="check" data-role-id="${role.id}" data-id="${item.id}" ${item.done ? "checked" : ""} aria-label="Tandai ${h(item.label)}">
        <div class="item-body"><div class="item-title">${h(item.label)}</div></div>
        ${deleteCheckButton(role.id, item.id, item.label)}
      </li>`).join("")}</ul>`
    : empty("Belum ada langkah. Tambahkan satu langkah sesuai pekerjaanmu.");
  return `${list}<form class="row" data-form="add-check" data-role-id="${role.id}"><div class="field"><label for="new-check-${role.id}">Langkah baru</label><input id="new-check-${role.id}" name="label" placeholder="Contoh: cek kondisi galat" required></div><button class="btn btn-primary" type="submit">Tambah</button></form>`;
}

function checkListPanel(role, title = "Daftar cek kerja", description = "Langkah awal bisa dicentang, diubah, atau dihapus.") {
  return panel(title, description, checkListBody(role));
}

function deskUX() {
  const role = roleById(activeRole);
  const cap = capabilityById(activeCapability, role);
  const index = role.capabilities.indexOf(cap) + 1;
  const flow = ["Kebutuhan", "Langkah", "Kondisi", "Serah terima"];
  return `<section class="desk desk--ux">
    <aside class="desk-rail panel"><h2 class="desk-kicker">Alur kerja</h2>${capList(role, cap, "steps")}</aside>
    <div class="desk-flow">
      <section class="panel canvas">
        <div class="canvas-head"><span class="canvas-index">${String(index).padStart(2, "0")}</span><div><h2>${h(cap.label)}</h2><p class="muted small">${h(cap.summary)}</p></div></div>
        <div class="flow-track">${flow.map((step, i) => `${i ? '<div class="flow-link" aria-hidden="true"></div>' : ""}<div class="flow-node"><span>0${i + 1}</span><strong>${h(step)}</strong></div>`).join("")}</div>
        <div class="condition-grid">${role.outputs.map((item, i) => `<div class="condition"><small>0${i + 1}</small><strong>${h(item)}</strong></div>`).join("")}</div>
      </section>
      ${checkListPanel(role, "Daftar cek alur", "Tandai yang sudah kamu kerjakan.")}
    </div>
    <aside class="desk-side">${workbench(role, cap, "stack")}</aside>
  </section>`;
}

function deskGraphic() {
  const role = roleById(activeRole);
  const cap = capabilityById(activeCapability, role);
  const state = getState();
  const palette = state.palette.map((color) => {
    const report = contrastReport(color.hex, "#FFFFFF");
    return `<div class="swatch-mini">
      <label class="sr-only" for="pname-${color.id}">Peran warna ${h(color.name)}</label>
      <input id="pname-${color.id}" data-path="palette" data-id="${color.id}" data-prop="name" value="${h(color.name)}">
      <span class="swatch-color" style="background:${h(color.hex)}" aria-hidden="true"></span>
      <input type="color" data-role="color" data-path="palette" data-id="${color.id}" data-prop="hex" value="${h(color.hex)}" aria-label="Warna ${h(color.name)}">
      <input data-role="hex" data-path="palette" data-id="${color.id}" data-prop="hex" value="${h(color.hex)}" aria-label="Hex ${h(color.name)}">
      <span class="badge" data-tone="${report.ok ? "ok" : "warn"}">${h(report.label)}</span>
      ${deleteButton("palette", color.id, `warna ${color.name}`)}
    </div>`;
  }).join("");
  return `<section class="desk desk--graphic">
    <section class="panel graphic-band">
      <div class="band-head"><div><h2>Palet kerja</h2><p class="muted small">Peran tiap warna lebih penting dari jumlah warna.</p></div><span class="badge">${state.palette.length} warna</span></div>
      <div class="palette-strip">${palette}</div>
      <div class="band-forms">
        <form class="row" data-form="add-color"><div class="field"><label for="color-name">Peran warna</label><input id="color-name" name="name" placeholder="Contoh: garis" required></div><div class="field"><label for="color-hex">Hex</label><input id="color-hex" name="hex" value="#52635C" required></div><button class="btn btn-primary" type="submit">Tambah warna</button></form>
        <form class="row" data-form="check-contrast"><div class="field"><label for="fg">Teks</label><input id="fg" name="fg" value="#1F1E1B" required></div><div class="field"><label for="bg">Latar</label><input id="bg" name="bg" value="#F5F4EE" required></div><button class="btn" type="submit">Periksa pasangan</button><div id="contrast-result" class="contrast-result" aria-live="polite"></div></form>
      </div>
    </section>
    <aside class="desk-rail panel"><h2 class="desk-kicker">Arah visual</h2>${capList(role, cap, "tiles")}</aside>
    <div class="desk-main">
      <section class="panel type-board">
        <h2>Skala huruf</h2>
        <div class="type-row"><span class="type-label">Judul</span><strong class="type-sample type-xl">Ruang kerja kreatif</strong></div>
        <div class="type-row"><span class="type-label">Isi</span><span class="type-sample">Poppins dipakai di seluruh antarmuka supaya ritme tetap sama.</span></div>
        <div class="type-row"><span class="type-label">Label</span><span class="type-sample type-sm">Nama kontrol dan petunjuk singkat</span></div>
      </section>
      ${workbench(role, cap, "split")}
      ${checkListPanel(role, "Daftar cek visual", "Sebelum aset dibuat, periksa keputusan yang sudah kamu tulis.")}
    </div>
  </section>`;
}

function deskFrontend() {
  const role = roleById(activeRole);
  const cap = capabilityById(activeCapability, role);
  const state = getState();
  const snippets = state.snippets.length ? `<ul class="list snippet-list">${state.snippets.map((snippet) => `<li class="item"><div class="item-body item-stack">
      <label class="sr-only" for="snip-${snippet.id}">Nama potongan</label><input id="snip-${snippet.id}" data-path="snippets" data-id="${snippet.id}" data-prop="title" value="${h(snippet.title)}">
      <label class="sr-only" for="tag-${snippet.id}">Label potongan</label><input id="tag-${snippet.id}" data-path="snippets" data-id="${snippet.id}" data-prop="tag" value="${h(snippet.tag)}">
      <label class="sr-only" for="code-${snippet.id}">Kode</label><textarea id="code-${snippet.id}" data-path="snippets" data-id="${snippet.id}" data-prop="code">${h(snippet.code)}</textarea>
    </div><div class="item-actions"><button class="btn" type="button" data-action="copy-snippet" data-id="${snippet.id}">Salin</button>${deleteButton("snippets", snippet.id, `potongan kode ${snippet.title}`)}</div></li>`).join("")}</ul>` : empty("Belum ada potongan kode. Simpan cuplikan yang sering dipakai.");
  const states = ["Kosong", "Memuat", "Galat", "Berhasil"];
  return `<section class="desk desk--frontend">
    <aside class="desk-rail panel">
      <h2 class="desk-kicker">Komponen</h2>
      ${capList(role, cap, "index")}
      <div class="snippet-block"><h3>Potongan kode</h3>${snippets}
        <form class="item-stack" data-form="add-snippet"><div class="row"><div class="field"><label for="snip-title">Nama</label><input id="snip-title" name="title" required></div><div class="field"><label for="snip-tag">Label</label><input id="snip-tag" name="tag" placeholder="css"></div></div><div class="field"><label for="snip-code">Kode</label><textarea id="snip-code" name="code"></textarea></div><button class="btn btn-primary" type="submit">Simpan potongan</button></form>
      </div>
    </aside>
    <div class="desk-main">
      <section class="panel state-board">
        <div class="panel-head"><div><h2>Kondisi komponen</h2><p class="muted small">Tiap kondisi perlu pesan dan tindakan berikutnya.</p></div></div>
        <div class="state-grid">${states.map((item, i) => `<div class="state-card"><small>0${i + 1}</small><strong>${h(item)}</strong><span>Pesan dan tindakan</span></div>`).join("")}</div>
      </section>
      ${workbench(role, cap, "stack")}
      ${checkListPanel(role, "Daftar cek kode", "Periksa struktur, nama kontrol, fokus, dan target sentuh.")}
    </div>
  </section>`;
}

function deskWriter() {
  const role = roleById(activeRole);
  const cap = capabilityById(activeCapability, role);
  const state = getState();
  const chapters = state.writer.chapters;
  const total = chapters.reduce((sum, chapter) => sum + (Number(chapter.words) || 0), 0);
  const done = chapters.filter((chapter) => chapter.status === "Selesai").length;
  const list = chapters.length ? `<ol class="chapter-list">${chapters.map((chapter, i) => `<li class="chapter">
      <div class="chapter-top"><span class="chapter-no">${String(i + 1).padStart(2, "0")}</span><strong>Bab ${i + 1}</strong>${deleteButton("writer.chapters", chapter.id, `bab ${chapter.title}`)}</div>
      <label class="sr-only" for="ch-${chapter.id}">Judul bab ${i + 1}</label><input id="ch-${chapter.id}" data-path="writer.chapters" data-id="${chapter.id}" data-prop="title" value="${h(chapter.title)}">
      <div class="row"><div class="field"><label class="sr-only" for="st-${chapter.id}">Status bab ${i + 1}</label><select id="st-${chapter.id}" data-path="writer.chapters" data-id="${chapter.id}" data-prop="status">${["Rancangan", "Draf", "Selesai"].map((status) => `<option ${chapter.status === status ? "selected" : ""}>${status}</option>`).join("")}</select></div><div class="field"><label class="sr-only" for="tg-${chapter.id}">Target kata bab ${i + 1}</label><input id="tg-${chapter.id}" type="number" min="0" inputmode="numeric" data-path="writer.chapters" data-id="${chapter.id}" data-prop="target" data-type="number" value="${h(chapter.target ?? "")}" placeholder="Target"></div><div class="field"><label class="sr-only" for="wd-${chapter.id}">Kata tercatat bab ${i + 1}</label><input id="wd-${chapter.id}" type="number" min="0" inputmode="numeric" data-path="writer.chapters" data-id="${chapter.id}" data-prop="words" data-type="number" value="${h(chapter.words ?? "")}" placeholder="Tercatat"></div></div>
    </li>`).join("")}</ol>` : empty("Belum ada bab. Tambahkan bab pertama supaya progres terlihat.");
  return `<section class="desk desk--writer">
    <aside class="chapter-spine panel">
      <div class="spine-head"><div><h2>Daftar bab</h2><p class="muted small">Angka berasal dari kolom yang kamu isi.</p></div></div>
      <div class="summary"><span>${chapters.length} bab</span><span>${done} selesai</span><span>${new Intl.NumberFormat("id-ID").format(total)} kata</span></div>
      ${list}
      <form class="row" data-form="add-chapter"><div class="field"><label for="chapter-title">Judul bab</label><input id="chapter-title" name="title" placeholder="Judul bab" required></div><button class="btn btn-primary" type="submit">Tambah bab</button></form>
      <form class="row" data-form="set-target"><div class="field"><label for="target-words">Target kata</label><input id="target-words" type="number" min="0" inputmode="numeric" name="target" value="${h(state.writer.targetWords ?? "")}" placeholder="Contoh: 60000"></div><button class="btn" type="submit">Simpan</button></form>
    </aside>
    <div class="desk-main">
      <section class="panel manuscript">
        <div class="manuscript-grid">
          <div class="field"><label for="synopsis">Sinopsis</label><textarea id="synopsis" data-bind="writer.synopsis" placeholder="Tulis premis dan konflik utama">${h(state.writer.synopsis)}</textarea></div>
          <div class="field"><label for="characters">Tokoh dan dunia</label><textarea id="characters" data-bind="writer.characters" placeholder="Catat motif tokoh dan aturan dunia">${h(state.writer.characters)}</textarea></div>
        </div>
        <div class="bookmark-block"><h2>Fokus naskah</h2>${capList(role, cap, "bookmarks")}</div>
      </section>
      ${workbench(role, cap, "compact")}
      ${checkListPanel(role, "Daftar cek naskah", "Tandai bagian yang sudah kamu baca ulang.")}
    </div>
  </section>`;
}

function deskDrafter() {
  const role = roleById(activeRole);
  const cap = capabilityById(activeCapability, role);
  const note = getState().roleNotes[role.id] || "";
  return `<section class="desk desk--drafter">
    <div class="doc-sheet panel">
      <header class="doc-head"><div><p class="doc-eyebrow">Dokumen kerja</p><h2>${h(role.label)}</h2><p class="muted small">${h(role.summary)}</p></div>${outputChips(role)}</header>
      <div class="doc-columns">
        <aside class="margin-notes"><h3>Bagian dokumen</h3>${capList(role, cap, "steps")}<div class="check-block"><h3>Catatan pinggir</h3>${checkListBody(role)}</div></aside>
        <div class="doc-body">
          ${workbench(role, cap, "split")}
          <div class="field doc-note"><label for="role-note">Catatan dokumen</label><textarea id="role-note" data-bind="roleNotes.${role.id}" placeholder="Catat keputusan atau hal yang belum ada datanya">${h(note)}</textarea></div>
        </div>
      </div>
    </div>
  </section>`;
}

function deskEditor() {
  const role = roleById(activeRole);
  const cap = capabilityById(activeCapability, role);
  const before = getState().roleNotes[role.id] || "";
  const after = getState().tools.inputs[cap.id] || "";
  return `<section class="desk desk--editor">
    <div class="editor-diff">
      <section class="panel diff-pane"><div class="pane-head"><span class="pane-tag">Sebelum</span><h2>Naskah awal</h2></div><div class="field"><label class="sr-only" for="editor-before">Naskah awal</label><textarea id="editor-before" data-bind="roleNotes.${role.id}" placeholder="Tempel naskah sebelum disunting">${h(before)}</textarea></div></section>
      <section class="panel diff-pane is-after"><div class="pane-head"><span class="pane-tag">Sesudah</span><h2>Hasil suntingan</h2></div><div class="field"><label class="sr-only" for="editor-after">Hasil suntingan</label><textarea id="editor-after" data-bind="tools.inputs.${cap.id}" placeholder="Tulis hasil suntingan di sini">${h(after)}</textarea></div></section>
    </div>
    <div class="editor-lower">
      <div class="panel"><h2>Jenis suntingan</h2>${capList(role, cap, "chips")}${checkListBody(role)}</div>
      ${workbench(role, cap, "stack", { skipInput: true })}
    </div>
  </section>`;
}

function deskCreator() {
  const role = roleById(activeRole);
  const cap = capabilityById(activeCapability, role);
  const state = getState();
  const ideas = state.ideas.length ? `<div class="idea-grid">${state.ideas.map((idea) => `<article class="idea-card">
      <div class="idea-top"><span class="badge">${h(roleById(idea.role).label)}</span>${deleteButton("ideas", idea.id, `ide ${idea.title}`)}</div>
      <h3>${h(idea.title)}</h3><p class="muted small">${h(idea.body || "Belum ada catatan isi.")}</p><span class="idea-status">${h(idea.status || "Ide")}</span>
    </article>`).join("")}</div>` : empty("Belum ada ide. Tulis satu sudut pandang yang mau kamu kerjakan.");
  return `<section class="desk desk--creator">
    <div class="idea-wall panel">
      <div class="wall-head"><div><h2>Dinding ide</h2><p class="muted small">Ide tersimpan sebelum masuk kalender atau naskah.</p></div></div>
      ${ideas}
      <form class="item-stack" data-form="add-idea"><div class="row"><div class="field"><label for="idea-title">Judul ide</label><input id="idea-title" name="title" placeholder="Judul singkat" required></div><div class="field"><label for="idea-role">Peran</label><select id="idea-role" name="role">${ROLES.map((r) => `<option value="${r.id}" ${r.id === "creator" ? "selected" : ""}>${h(r.label)}</option>`).join("")}</select></div></div><div class="field"><label for="idea-body">Catatan ide</label><textarea id="idea-body" name="body" placeholder="Sudut pandang atau poin utama"></textarea></div><button class="btn btn-primary" type="submit">Simpan ide</button></form>
    </div>
    <div class="creator-side">
      <div class="panel"><h2>Bentuk konten</h2>${capList(role, cap, "chips")}</div>
      ${workbench(role, cap, "stack")}
      ${checkListPanel(role, "Daftar cek konten", "Sebelum diterbitkan, periksa sudut pandang dan klaim.")}
    </div>
  </section>`;
}

function deskPlanner() {
  const role = roleById(activeRole);
  const cap = capabilityById(activeCapability, role);
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
  const channels = ["Umpan", "Cerita", "Video", "Artikel", "Buletin"];
  const grid = `<div class="week">${days.map((day) => {
    const key = dateKey(day);
    const items = state.planner.items.filter((item) => item.date === key);
    const list = items.length ? `<ul class="list">${items.map((item) => `<li class="item ${item.done ? "is-done" : ""}"><input type="checkbox" data-role="plan" data-id="${item.id}" ${item.done ? "checked" : ""} aria-label="Selesai ${h(item.title)}"><div class="item-body"><div class="item-title">${h(item.title)}</div><div class="item-meta">${h(item.channel)}</div></div>${deleteButton("planner.items", item.id, `jadwal ${item.title}`)}</li>`).join("")}</ul>` : empty("Belum ada jadwal.");
    return `<section class="day ${key === today ? "is-today" : ""}"><h3><time datetime="${key}">${h(fmtDate(day))}</time></h3>${list}<form class="item-stack" data-form="add-plan" data-date="${key}"><div class="field"><label class="sr-only" for="plan-${key}">Judul ${h(fmtDate(day))}</label><input id="plan-${key}" name="title" placeholder="Judul unggahan" required></div><div class="field"><label class="sr-only" for="chan-${key}">Kanal ${h(fmtDate(day))}</label><select id="chan-${key}" name="channel">${channels.map((channel) => `<option>${channel}</option>`).join("")}</select></div><button class="btn btn-primary" type="submit">Tambah</button></form></section>`;
  }).join("")}</div>`;
  return `<section class="desk desk--planner">
    <div class="planner-main panel">
      <div class="week-head"><div><h2>${h(fmtDate(days[0]))} sampai ${h(fmtDate(days[6]))}</h2><p class="muted small">Hari berjalan diberi garis aksen.</p></div><div class="item-actions"><button class="btn" type="button" data-action="week-prev">Sebelumnya</button><button class="btn" type="button" data-action="week-today">Hari ini</button><button class="btn" type="button" data-action="week-next">Berikutnya</button></div></div>
      ${grid}
    </div>
    <aside class="planner-side">
      <div class="panel"><h2>Alat perencanaan</h2>${capList(role, cap, "strip")}</div>
      ${workbench(role, cap, "compact")}
      ${checkListPanel(role, "Daftar cek minggu", "Tinjau beban dan aset sebelum menambah jadwal.")}
    </aside>
  </section>`;
}

function deskAdmin() {
  const role = roleById(activeRole);
  const cap = capabilityById(activeCapability, role);
  const state = getState();
  const focus = state.focus.length ? `<ul class="list">${state.focus.map((item) => `<li class="item ${item.done ? "is-done" : ""}"><input type="checkbox" data-role="focus" data-id="${item.id}" ${item.done ? "checked" : ""} aria-label="Selesaikan ${h(item.text)}"><div class="item-body"><div class="item-title">${h(item.text)}</div></div>${deleteButton("focus", item.id, `fokus ${item.text}`)}</li>`).join("")}</ul>` : empty("Belum ada fokus. Tulis satu hal yang paling perlu selesai sekarang.");
  const ideas = state.ideas.length ? `<ul class="list">${state.ideas.map((idea) => `<li class="item"><div class="item-body"><div class="item-title">${h(idea.title)}</div><p class="small">${h(idea.body)}</p><div class="item-meta">${h(roleById(idea.role).label)} · ${h(idea.status || "Ide")}</div></div>${deleteButton("ideas", idea.id, `ide ${idea.title}`)}</li>`).join("")}</ul>` : empty("Belum ada ide. Tulis satu sudut pandang yang mau kamu kerjakan.");
  const collapsed = document.body.classList.contains("rail-collapsed");
  return `<section class="desk desk--admin">
    <div class="admin-main">
      <section class="panel focus-card"><div class="panel-head"><div><h2>Fokus berjalan</h2><p class="muted small">Satu hal di atas permukaan lain.</p></div></div>${focus}<form class="row" data-form="add-focus"><div class="field"><label for="focus-input">Fokus baru</label><input id="focus-input" name="text" placeholder="Contoh: rapikan alur beranda" required></div><button class="btn btn-primary" type="submit">Tambah fokus</button></form></section>
      <div class="admin-grid">
        <section class="panel"><div class="panel-head"><div><h2>Catatan cepat</h2><p class="muted small">Tersimpan di perangkat ini.</p></div></div><div class="field"><label class="sr-only" for="quick-note">Catatan cepat</label><textarea id="quick-note" data-bind="quickNote" placeholder="Tulis catatan singkat">${h(state.quickNote)}</textarea></div></section>
        <section class="panel"><div class="panel-head"><div><h2>Ide tersimpan</h2><p class="muted small">Dipakai bersama Content Creator dan Content Planner.</p></div></div>${ideas}</section>
      </div>
      <section class="panel"><div class="panel-head"><div><h2>Cadangan dan setelan</h2><p class="muted small">Data tidak dikirim otomatis ke mana pun.</p></div></div>
        <div class="item-actions"><button class="btn btn-primary" type="button" data-action="export-json">Unduh JSON</button><button class="btn" type="button" data-action="export-md">Unduh Markdown</button><label class="btn" for="import-file">Impor JSON</label><input id="import-file" type="file" accept="application/json" class="sr-only"></div>
        <div class="item-actions admin-settings"><button class="btn" type="button" data-action="theme" data-theme="paper">Terang</button><button class="btn" type="button" data-action="theme" data-theme="night">Gelap</button><button class="btn" type="button" data-action="toggle-rail">${collapsed ? "Perbesar navigasi" : "Kecilkan navigasi"}</button></div>
        <p class="muted small">Impor akan mengganti data saat ini. Unduh cadangan dulu bila perlu.</p>
        <div class="admin-install"><h3>Pasang di Android</h3><ol class="list"><li class="item"><div class="item-body">Buka alamat aplikasi di Chrome Android.</div></li><li class="item"><div class="item-body">Pilih menu browser, lalu Add to Home screen atau Install app.</div></li><li class="item"><div class="item-body">Buka ikon aplikasi. Alat lokal tetap berfungsi tanpa internet setelah terpasang.</div></li></ol></div>
        <div class="admin-danger"><h3>Hapus semua data</h3><p class="muted small">Tindakan ini tidak bisa dibatalkan.</p><button class="btn btn-danger" type="button" data-action="reset">${confirmReset ? "Ya, hapus semua data" : "Hapus semua data"}</button></div>
        <p class="muted small">ACE versi 2. Sembilan bidang kerja, tanpa akun, dan tanpa pengiriman otomatis. Koneksi AI diatur lewat tombol AI di header dan baru dipakai saat tombol Kirim ke AI ditekan.</p>
      </section>
    </div>
    <aside class="admin-side">
      <div class="panel"><h2>Fungsi admin</h2>${capList(role, cap, "ledger")}</div>
      ${workbench(role, cap, "stack")}
    </aside>
  </section>`;
}

function aiDialogHtml() {
  const state = getState();
  const model = state.settings.model;
  const preset = MODEL_PRESETS.find((item) => item.id === model.preset) || MODEL_PRESETS[0];
  const custom = state.customPrompts.length ? `<ul class="list">${state.customPrompts.map((item) => `<li class="item"><div class="item-body"><div class="item-title">${h(item.title)}</div><div class="item-meta">${h(roleById(item.role).label)}</div><pre>${h(item.text)}</pre></div><div class="item-actions"><button class="btn" type="button" data-action="copy-template" data-id="${item.id}">Salin</button>${deleteCustomButton(item.id, item.title)}</div></li>`).join("")}</ul>` : empty("Belum ada prompt sendiri. Simpan prompt yang sering dipakai.");
  return `<div class="dialog-head"><div><h2 id="aiDialogTitle">Pengaturan AI</h2><p class="muted small">Opsional. Semua alat lokal tetap berfungsi tanpa ini.</p></div><button class="btn" type="button" data-action="close-ai">Tutup</button></div>
    <div class="ai-sections">
      <section class="ai-section"><h3>Koneksi</h3>
        <form class="item-stack" data-form="save-model">
          <div class="field"><label for="model-preset">Penyedia</label><select id="model-preset" name="preset">${MODEL_PRESETS.map((item) => `<option value="${item.id}" ${model.preset === item.id ? "selected" : ""}>${h(item.label)}</option>`).join("")}</select><span class="muted small" id="preset-hint">${h(preset.hint)}</span></div>
          <div class="row"><div class="field"><label for="model-format">Format API</label><select id="model-format" name="format"><option value="opencode" ${model.format === "opencode" ? "selected" : ""}>OpenCode HTTP API</option><option value="openai" ${model.format === "openai" ? "selected" : ""}>OpenAI kompatibel</option><option value="gemini" ${model.format === "gemini" ? "selected" : ""}>Gemini</option><option value="anthropic" ${model.format === "anthropic" ? "selected" : ""}>Anthropic</option></select></div><div class="field"><label for="model-name">Nama model</label><input id="model-name" name="model" value="${h(model.model)}" placeholder="kosongkan untuk OpenCode"></div></div>
          <div class="field"><label for="model-endpoint">Alamat server atau endpoint</label><input id="model-endpoint" name="endpoint" value="${h(model.endpoint)}" placeholder="https://..."></div>
          <div class="row"><div class="field"><label for="model-directory">Direktori kerja OpenCode</label><input id="model-directory" name="directory" value="${h(model.directory || "")}" placeholder="opsional, contoh: /workspace"></div><div class="field"><label for="model-key">Token atau kunci API</label><input id="model-key" name="apiKey" type="password" value="${h(model.apiKey)}" placeholder="kosongkan bila tidak perlu"></div></div>
          <button class="btn btn-primary" type="submit">Simpan pengaturan AI</button>
        </form>
        <p class="muted small">Kredensial disimpan di browser perangkat ini. Jangan dipakai di perangkat bersama. Untuk OpenCode, server harus aktif dan mengizinkan origin aplikasi ini. Jika CORS ditolak, pakai bridge milikmu di origin yang sama.</p>
      </section>
      <section class="ai-section"><h3>Prompt sendiri</h3>${custom}
        <form class="item-stack" data-form="add-custom-prompt"><div class="field"><label for="custom-title">Nama prompt</label><input id="custom-title" name="title" required></div><div class="field"><label for="custom-role">Peran</label><select id="custom-role" name="role">${ROLES.map((r) => `<option value="${r.id}">${h(r.label)}</option>`).join("")}</select></div><div class="field"><label for="custom-text">Isi prompt</label><textarea id="custom-text" name="text" required></textarea></div><button class="btn btn-primary" type="submit">Simpan prompt</button></form>
      </section>
      <section class="ai-section"><h3>Komposer</h3>
        <form class="item-stack" data-form="build-prompt"><div class="row"><div class="field"><label for="compose-role">Peran</label><select id="compose-role" name="role">${ROLES.map((r) => `<option value="${r.id}" ${r.id === activeRole ? "selected" : ""}>${h(r.label)}</option>`).join("")}</select></div><div class="field"><label for="compose-task">Tugas</label><input id="compose-task" name="task" placeholder="Contoh: susun kondisi kosong form masuk" required></div></div><button class="btn" type="submit">Susun prompt</button></form>
        <div class="field"><label for="prompt-compose">Prompt</label><textarea id="prompt-compose">${h(composerDraft)}</textarea></div>
        <div class="tool-actions"><button class="btn btn-primary" type="button" data-action="send-model" ${modelBusy ? "disabled" : ""}>${modelBusy ? "Mengirim..." : "Kirim ke AI"}</button><button class="btn" type="button" data-action="copy-compose">Salin prompt</button></div>
        <div class="field"><label for="model-output">Jawaban AI</label><textarea id="model-output" readonly placeholder="Jawaban muncul di sini"></textarea></div>
      </section>
    </div>`;
}

function markdownExport() {
  const state = getState();
  const lines = ["# ACE, Ekspor Data", "", "## Fokus", ...state.focus.map((f) => `- ${f.done ? "[x]" : "[ ]"} ${f.text}`), "", "## Catatan cepat", state.quickNote || "Kosong", "", "## Catatan peran"];
  for (const role of ROLES) lines.push(`### ${role.label}`, state.roleNotes[role.id] || "Kosong", "");
  lines.push("## Ide", ...state.ideas.map((idea) => `- ${idea.title} (${idea.status || "Ide"}) dengan ${idea.role || "umum"}: ${idea.body}`), "", "## Jadwal konten", ...state.planner.items.map((item) => `- ${item.date}: ${item.title} (${item.channel})`), "", "## Naskah", state.writer.synopsis || "Kosong", "", ...state.writer.chapters.flatMap((chapter) => [`### ${chapter.title} (${chapter.status})`, `Target: ${chapter.target ?? "-"}, tercatat: ${chapter.words ?? "-"}`]));
  lines.push("", "## Alat kerja");
  let adaAlat = false;
  for (const role of ROLES) {
    for (const cap of role.capabilities) {
      const bahan = state.tools.inputs[cap.id] || "";
      const hasilPemeriksaan = state.tools.results[cap.id];
      const jawaban = state.tools.answers[cap.id] || "";
      if (!bahan && !hasilPemeriksaan && !jawaban) continue;
      adaAlat = true;
      lines.push(`### ${role.label}: ${cap.label}`, `Bahan: ${bahan || "Kosong"}`, "");
      if (hasilPemeriksaan) lines.push("Pemeriksaan lokal:", daftarHasilTeks(hasilPemeriksaan), "");
      if (jawaban) lines.push("Jawaban AI:", jawaban, "");
    }
  }
  if (!adaAlat) lines.push("Belum ada hasil alat kerja yang tersimpan.");
  return lines.join("\n");
}

function buildNav() {
  document.getElementById("rail").innerHTML = `<div class="rail-group"><p class="rail-heading">Bidang kerja</p><ul class="rail-list">${ROLES.map((role) => `<li><button class="rail-btn" type="button" data-action="role" data-role-id="${role.id}" data-tooltip="${h(role.label)}" title="${h(role.label)}">${icon(role.icon)}<span class="rail-copy"><strong>${h(role.label)}</strong><span>${h(role.short)}</span></span></button></li>`).join("")}</ul></div>`;
  document.getElementById("bottomNav").innerHTML = BOTTOM.map((item) => `<button type="button" data-action="role" data-role-id="${item.id}" aria-label="Buka ${h(roleById(item.id).label)}">${icon(item.icon)}<span>${h(item.label)}</span></button>`).join("");
  document.getElementById("workDialogList").innerHTML = ROLES.map((role) => `<button class="btn work-choice" type="button" data-action="role" data-role-id="${role.id}">${icon(role.icon)}<span>${h(role.label)}</span><small>${h(role.summary)}</small></button>`).join("");
}

function syncRailLabels() {
  const collapsed = document.body.classList.contains("rail-collapsed");
  document.querySelectorAll("#rail .rail-btn").forEach((button) => {
    if (collapsed) button.setAttribute("aria-label", button.dataset.tooltip);
    else button.removeAttribute("aria-label");
  });
}

function markNav() {
  document.querySelectorAll("[data-action='role']").forEach((button) => {
    if (button.dataset.roleId === activeRole) button.setAttribute("aria-current", "page");
    else button.removeAttribute("aria-current");
  });
}

function updateChrome() {
  const role = roleById(activeRole);
  const cap = capabilityById(activeCapability, role);
  pageTitle.textContent = role.label;
  pageSubtitle.textContent = `${cap.label}. ${cap.summary}`;
  contextLabel.textContent = `${role.label} / ${cap.label}`;
}

function render() {
  updateChrome();
  try {
    view.innerHTML = DESKS[activeRole] ? DESKS[activeRole]() : deskUX();
  } catch (error) {
    console.error(error);
    view.innerHTML = `<div class="panel"><h2>Tampilan gagal dibuat</h2><p class="muted">Buka bidang kerja lain lalu periksa konsol.</p></div>`;
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
  document.querySelector('meta[name="theme-color"]').content = theme === "night" ? "#191817" : "#f5f4ee";
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

function updateToggleLabel() {
  if (narrow.matches) {
    railToggle.setAttribute("aria-label", "Buka daftar bidang kerja");
    railToggle.title = "Buka daftar bidang kerja";
    railToggle.setAttribute("aria-expanded", "false");
    return;
  }
  const collapsed = document.body.classList.contains("rail-collapsed");
  const label = collapsed ? "Perbesar navigasi" : "Kecilkan navigasi";
  railToggle.setAttribute("aria-label", label);
  railToggle.title = label;
  railToggle.setAttribute("aria-expanded", String(!collapsed));
}

function setRail(collapsed, shouldSave = true) {
  document.body.classList.toggle("rail-collapsed", collapsed);
  getState().settings.railCollapsed = collapsed;
  syncRailLabels();
  updateToggleLabel();
  if (shouldSave) {
    commit();
    if (document.querySelector("[data-action='toggle-rail']")) render();
  }
}

function openRole(id) {
  if (!ROLES.some((role) => role.id === id)) return;
  activeRole = id;
  activeCapability = roleById(id).capabilities[0].id;
  getState().settings.activeRole = id;
  getState().settings.activeCapability = activeCapability;
  commit();
  if (dialog.open) dialog.close();
  render();
  window.scrollTo({ top: 0 });
}

function openCapability(roleId, capId) {
  const role = roleById(roleId);
  const cap = capabilityById(capId, role);
  activeRole = role.id;
  activeCapability = cap.id;
  getState().settings.activeRole = role.id;
  getState().settings.activeCapability = cap.id;
  commit();
  render();
  window.scrollTo({ top: 0 });
}

function openWorkDialog() {
  if (!dialog.open) dialog.showModal();
}

function openAiDialog() {
  aiBody.innerHTML = aiDialogHtml();
  if (!aiDialog.open) aiDialog.showModal();
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
  const before = button.innerHTML;
  button.textContent = ok ? "Tersalin" : "Salin manual";
  setTimeout(() => { button.innerHTML = before; }, 1300);
}

function handleField(target) {
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

function handleInput(event) {
  if (["check", "focus", "plan", "color", "hex"].includes(event.target.dataset.role)) return;
  handleField(event.target);
}

function handleChange(event) {
  const target = event.target;
  const state = getState();
  if (target.dataset.role === "check") {
    const item = state.roleChecks[target.dataset.roleId]?.find((x) => x.id === target.dataset.id);
    if (item) { item.done = target.checked; commit(); render(); }
    return;
  }
  if (target.dataset.role === "focus") {
    const item = state.focus.find((x) => x.id === target.dataset.id);
    if (item) { item.done = target.checked; commit(); render(); }
    return;
  }
  if (target.dataset.role === "plan") {
    const item = state.planner.items.find((x) => x.id === target.dataset.id);
    if (item) { item.done = target.checked; commit(); render(); }
    return;
  }
  const wasPalette = String(target.dataset.path || "").includes("palette");
  handleField(target);
  if (wasPalette) render();
  if (target.id === "model-preset") {
    const preset = MODEL_PRESETS.find((item) => item.id === target.value);
    if (preset) {
      const format = document.getElementById("model-format");
      const endpoint = document.getElementById("model-endpoint");
      const name = document.getElementById("model-name");
      const directory = document.getElementById("model-directory");
      const hint = document.getElementById("preset-hint");
      if (format) format.value = preset.format;
      if (endpoint) endpoint.value = preset.endpoint;
      if (name) name.value = preset.model;
      if (directory) directory.value = preset.directory || "";
      if (hint) hint.textContent = preset.hint;
    }
  }
  if (target.id === "import-file") handleImport(target);
}

async function handleSubmit(event) {
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
    if (!state.roleChecks[form.dataset.roleId]) state.roleChecks[form.dataset.roleId] = [];
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
    const target = document.getElementById("contrast-result");
    if (target) target.innerHTML = `<span class="badge" data-tone="${report.ok ? "ok" : "warn"}">${h(report.label)}</span>`;
    return;
  } else if (type === "save-model") {
    state.settings.model = {
      preset: value("preset"),
      endpoint: value("endpoint"),
      model: value("model"),
      format: value("format"),
      apiKey: value("apiKey"),
      directory: value("directory"),
    };
    commit();
    notify("Pengaturan AI tersimpan");
    render();
    return;
  } else if (type === "build-prompt") {
    const role = roleById(value("role"));
    const cap = role.capabilities[0];
    const task = value("task");
    composerDraft = `Bertindak sebagai ${role.label} pada tugas ${cap.label}.\n\nTugas: ${task}\n\nKeluarkan:\n1. Langkah pengerjaan\n2. Hasil akhir yang bisa langsung dipakai\n3. Asumsi yang perlu dikonfirmasi\n\nAturan: Bahasa Indonesia, langsung, tanpa klaim atau angka tanpa sumber.`;
    const area = document.getElementById("prompt-compose");
    if (area) area.value = composerDraft;
    return;
  } else if (type === "add-custom-prompt") {
    state.customPrompts.push({ id: uid(), role: value("role"), title: value("title"), text: value("text") });
  } else {
    return;
  }
  form.reset();
  commit();
  if (event.target.closest("dialog")) aiBody.innerHTML = aiDialogHtml();
  render();
}

async function handleClick(event) {
  const button = event.target.closest("button[data-action]");
  if (!button) return;
  const action = button.dataset.action;
  const state = getState();

  if (action === "capability") { openCapability(button.dataset.roleId, button.dataset.capId); return; }
  if (action === "run-tool") {
    const cap = capabilityById(button.dataset.capId);
    state.tools.results[cap.id] = runTool(cap.tool, state.tools.inputs[cap.id] || "");
    commit(); render(); return;
  }
  if (action === "build-tool-prompt") {
    const cap = capabilityById(button.dataset.capId);
    state.tools.prompts[cap.id] = buildCapabilityPrompt(roleById(activeRole), cap);
    commit(); render(); notify("Prompt disiapkan dari fungsi dan bahan yang kamu tulis"); return;
  }
  if (action === "copy-tool-prompt") {
    const cap = capabilityById(button.dataset.capId);
    const text = document.getElementById("tool-prompt")?.value || state.tools.prompts[cap.id] || buildCapabilityPrompt(roleById(activeRole), cap);
    await flashCopy(button, text); return;
  }
  if (action === "send-tool") {
    const cap = capabilityById(button.dataset.capId);
    const prompt = document.getElementById("tool-prompt")?.value.trim() || buildCapabilityPrompt(roleById(activeRole), cap);
    await sendToModel(button, { prompt, output: document.getElementById("tool-answer"), saveKey: cap.id });
    return;
  }
  if (action === "remove" || action === "remove-check") {
    const list = action === "remove-check" ? state.roleChecks[button.dataset.roleId] : fieldValue(button.dataset.path);
    const index = list?.findIndex((item) => item.id === button.dataset.id) ?? -1;
    if (index >= 0) list.splice(index, 1);
    commit(); render(); return;
  }
  if (action === "week-prev" || action === "week-next" || action === "week-today") {
    if (action === "week-today") state.planner.offset = 0;
    else state.planner.offset += action === "week-next" ? 1 : -1;
    commit(); render(); return;
  }
  if (action === "analyze") {
    lastAnalysis = analyzeSlop(state.slopDraft);
    lastClean = null;
    render(); return;
  }
  if (action === "clean-preview") { lastClean = cleanSlop(state.slopDraft); render(); return; }
  if (action === "apply-clean") {
    state.slopDraft = lastClean.text;
    lastAnalysis = analyzeSlop(state.slopDraft);
    commit(); render(); notify("Draf diperbarui"); return;
  }
  if (action === "copy-clean") { await flashCopy(button, lastClean?.text || ""); return; }
  if (action === "copy-template") {
    const item = state.customPrompts.find((template) => template.id === button.dataset.id);
    if (item) await flashCopy(button, item.text);
    return;
  }
  if (action === "remove-custom") {
    const index = state.customPrompts.findIndex((item) => item.id === button.dataset.id);
    if (index >= 0) state.customPrompts.splice(index, 1);
    commit(); aiBody.innerHTML = aiDialogHtml(); return;
  }
  if (action === "copy-compose") { await flashCopy(button, document.getElementById("prompt-compose")?.value || ""); return; }
  if (action === "copy-snippet") {
    const item = state.snippets.find((snippet) => snippet.id === button.dataset.id);
    if (item) await flashCopy(button, item.code);
    return;
  }
  if (action === "send-model") {
    await sendToModel(button, { prompt: document.getElementById("prompt-compose")?.value || "", output: document.getElementById("model-output") });
    return;
  }
  if (action === "export-json") { download("ace-data.json", exportJson(), "application/json"); return; }
  if (action === "export-md") { download("ace-data.md", markdownExport(), "text/markdown"); return; }
  if (action === "toggle-rail") { setRail(!document.body.classList.contains("rail-collapsed")); return; }
  if (action === "reset") {
    if (!confirmReset) { confirmReset = true; render(); return; }
    resetState();
    confirmReset = false;
    lastAnalysis = null; lastClean = null;
    activeRole = "ux";
    activeCapability = "ux-research";
    markTheme(); setRail(false, false); render(); notify("Data dihapus"); return;
  }
}

for (const surface of [view, aiBody]) {
  surface.addEventListener("input", handleInput);
  surface.addEventListener("change", handleChange);
  surface.addEventListener("submit", handleSubmit);
  surface.addEventListener("click", handleClick);
}

document.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-action]");
  if (!button) return;
  const action = button.dataset.action;
  if (action === "role") openRole(button.dataset.roleId);
  else if (action === "theme") applyTheme(button.dataset.theme);
  else if (action === "open-work") openWorkDialog();
  else if (action === "close-dialog") dialog.close();
  else if (action === "ai-toggle") openAiDialog();
  else if (action === "close-ai") aiDialog.close();
});

railToggle.addEventListener("click", () => {
  if (narrow.matches) openWorkDialog();
  else setRail(!document.body.classList.contains("rail-collapsed"));
});

if (narrow.addEventListener) narrow.addEventListener("change", updateToggleLabel);
dialog.addEventListener("click", (event) => { if (event.target === dialog) dialog.close(); });
aiDialog.addEventListener("click", (event) => { if (event.target === aiDialog) aiDialog.close(); });

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
    activeRole = getState().settings.activeRole || "ux";
    activeCapability = getState().settings.activeCapability || roleById(activeRole).capabilities[0].id;
    markTheme(); setRail(Boolean(getState().settings.railCollapsed), false); render();
    notify("Data berhasil diimpor");
  } catch (error) {
    notify(`Gagal mengimpor: ${error.message}`, "error");
  }
  input.value = "";
}

async function parseError(response) {
  const data = await response.json().catch(() => ({}));
  return new Error(data?.error?.message || data?.message || `HTTP ${response.status}`);
}

function teksDariPesanOpenCode(messages) {
  const assistant = [...messages].reverse().find((message) => message.type === "assistant" || message.role === "assistant");
  if (!assistant) return "";
  const parts = assistant.content || assistant.parts || [];
  const text = parts
    .filter((part) => part?.type === "text" && typeof part.text === "string")
    .map((part) => part.text)
    .join("\n");
  return text.trim() || (typeof assistant.text === "string" ? assistant.text.trim() : "");
}

async function requestOpenCode(model, prompt) {
  const base = String(model.endpoint || "").replace(/\/+$/, "");
  const headers = { "content-type": "application/json" };
  if (model.apiKey) headers.authorization = `Bearer ${model.apiKey}`;

  const body = {};
  if (model.directory) body.location = { directory: model.directory };
  const createResponse = await fetch(`${base}/api/session`, { method: "POST", headers, body: JSON.stringify(body) });
  if (!createResponse.ok) throw await parseError(createResponse);
  const created = await createResponse.json();
  const session = created?.data?.id ? created.data : created;
  const sessionID = session?.id;
  if (!sessionID) throw new Error("OpenCode tidak mengembalikan session ID");

  const promptResponse = await fetch(`${base}/api/session/${encodeURIComponent(sessionID)}/prompt`, {
    method: "POST", headers, body: JSON.stringify({ text: prompt }),
  });
  if (!promptResponse.ok) throw await parseError(promptResponse);

  const waitResponse = await fetch(`${base}/api/experimental/session/${encodeURIComponent(sessionID)}/wait`, { method: "POST", headers });
  if (!waitResponse.ok) throw await parseError(waitResponse);

  const messagesResponse = await fetch(`${base}/api/session/${encodeURIComponent(sessionID)}/message?limit=20&order=desc`, { headers });
  if (!messagesResponse.ok) throw await parseError(messagesResponse);
  const messagesData = await messagesResponse.json();
  const messages = messagesData?.data || messagesData?.messages || (Array.isArray(messagesData) ? messagesData : []);
  const answer = teksDariPesanOpenCode(messages);
  return answer || "OpenCode selesai menjalankan prompt, tetapi jawabannya bukan teks yang bisa dibaca di sini. Periksa sesi tersebut di antarmuka OpenCode.";
}

async function requestModel(model, prompt) {
  if (model.format === "opencode") return requestOpenCode(model, prompt);

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
  if (!response.ok) throw await parseError(response);
  const data = await response.json().catch(() => ({}));
  if (model.format === "gemini") return data.candidates?.[0]?.content?.parts?.map((part) => part.text || "").join("") || "Tidak ada teks yang dikembalikan.";
  if (model.format === "anthropic") return data.content?.filter((part) => part.type === "text").map((part) => part.text).join("") || "Tidak ada teks yang dikembalikan.";
  return data.choices?.[0]?.message?.content || "Tidak ada teks yang dikembalikan.";
}

async function sendToModel(button, options = {}) {
  const model = getState().settings.model;
  const prompt = String(options.prompt || "").trim();
  const output = options.output;
  if (!prompt) { notify("Tulis prompt lebih dulu", "error"); return; }
  if (!output) { notify("Area jawaban tidak ditemukan", "error"); return; }
  if (!model.endpoint) { notify("Isi alamat server atau endpoint di pengaturan AI", "error"); return; }
  if (model.format !== "opencode" && model.format !== "gemini" && !model.model) {
    notify("Isi nama model di pengaturan AI", "error");
    return;
  }
  const label = options.label || "Kirim ke AI";
  modelBusy = true;
  button.disabled = true;
  button.textContent = "Mengirim...";
  output.value = "Mengirim prompt ke koneksi yang kamu atur...";
  try {
    const text = await requestModel(model, prompt);
    output.value = text;
    if (options.saveKey) getState().tools.answers[options.saveKey] = text;
    commit();
    notify("Jawaban diterima");
  } catch (error) {
    output.value = "";
    notify(`Gagal menghubungi AI: ${error.message}`, "error");
  } finally {
    modelBusy = false;
    button.disabled = false;
    button.textContent = label;
  }
}

function init() {
  loadState();
  const savedRole = getState().settings.activeRole;
  activeRole = ROLES.some((role) => role.id === savedRole) ? savedRole : "ux";
  const savedCap = getState().settings.activeCapability;
  activeCapability = roleById(activeRole).capabilities.some((cap) => cap.id === savedCap) ? savedCap : roleById(activeRole).capabilities[0].id;
  markTheme();
  buildNav();
  setRail(Boolean(getState().settings.railCollapsed), false);
  render();
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("./sw.js").catch((error) => console.warn("Service worker gagal", error));
  }
}

init();
