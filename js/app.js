import { ROLES, UTILITIES, TEMPLATES, MODEL_PRESETS, ICONS } from "./data.js";
import { analyzeSlop, cleanSlop, contrastReport, textStats } from "./analyzers.js";
import { runTool, daftarHasilTeks } from "./tools.js";
import { getState, loadState, saveState, resetState, exportJson, importJson, uid } from "./state.js";

const BOTTOM = [
  { id: "home", label: "Beranda", icon: "home", action: "nav" },
  { id: "work", label: "Peran", icon: "ux", action: "open-work" },
  { id: "antislop", label: "Antislop", icon: "slop", action: "nav" },
  { id: "prompt", label: "AI", icon: "prompt", action: "nav" },
  { id: "data", label: "Data", icon: "data", action: "nav" },
];

let current = "home";
let activeRole = "ux";
let activeCapability = "ux-research";
let promptFilter = "semua";
let promptQuery = "";
let composerDraft = "";
let lastAnalysis = null;
let lastClean = null;
let confirmReset = false;
let modelBusy = false;

const view = document.getElementById("view");
const pageTitle = document.getElementById("pageTitle");
const pageSubtitle = document.getElementById("pageSubtitle");
const contextLabel = document.getElementById("contextLabel");
const dialog = document.getElementById("workDialog");
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

function semuaKapabilitas() {
  return ROLES.flatMap((role) => role.capabilities.map((cap) => ({ role, cap })));
}

function buildCapabilityPrompt(role, cap) {
  const template = TEMPLATES.find((item) => item.id === `t-${cap.id}`);
  const bahan = String(getState().tools.inputs[cap.id] || "").trim();
  const dasar = template?.text || `Bantu peran ${role.label} pada tugas ${cap.label}.`;
  return bahan ? dasar.replace("[tempel di sini]", bahan) : dasar;
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

  const roles = `<div class="grid-cards">${ROLES.map((role) => `<button class="shortcut" type="button" data-action="role" data-role-id="${role.id}">${icon(role.icon)}<div><strong>${h(role.label)}</strong><span>${h(role.summary)}</span></div></button>`).join("")}</div>`;

  const ideas = state.ideas.length
    ? `<ul class="list">${state.ideas.map((idea) => `<li class="item"><div class="item-body"><div class="item-title">${h(idea.title)}</div><p class="small">${h(idea.body)}</p><div class="item-meta">${h(roleById(idea.role).label)} · ${h(idea.status || "Ide")}</div></div><button class="btn btn-danger" type="button" data-action="remove" data-path="ideas" data-id="${idea.id}">Hapus</button></li>`).join("")}</ul>`
    : empty("Belum ada ide. Tulis satu sudut pandang yang mau kamu kerjakan.");

  return `<section class="focus-card"><div class="panel-head"><div><h2>Fokus berjalan</h2><p class="muted small">Satu hal di atas permukaan lain.</p></div></div>${focus}
      <form class="row" data-form="add-focus"><div class="field"><label for="focus-input">Fokus baru</label><input id="focus-input" name="text" placeholder="Contoh: rapikan alur beranda" required></div><button class="btn btn-primary" type="submit">Tambah fokus</button></form>
    </section>
    <div class="grid2">
      ${panel("Catatan cepat", "Tersimpan di perangkat ini.", `<div class="field"><label class="sr-only" for="quick-note">Catatan cepat</label><textarea id="quick-note" data-bind="quickNote" placeholder="Tulis catatan singkat">${h(state.quickNote)}</textarea></div>`)}
      ${panel("Pilih bidang kerja", "Sembilan peran, masing-masing punya alat bantu sendiri.", roles)}
      ${panel("Ide cepat", "Tampung ide sebelum masuk kalender atau naskah.", ideas + `<form class="item-stack" data-form="add-idea"><div class="field"><label for="idea-title">Judul ide</label><input id="idea-title" name="title" placeholder="Judul singkat" required></div><div class="field"><label for="idea-role">Peran</label><select id="idea-role" name="role">${ROLES.map((r) => `<option value="${r.id}" ${r.id === "creator" ? "selected" : ""}>${h(r.label)}</option>`).join("")}</select></div><div class="field"><label for="idea-body">Catatan ide</label><textarea id="idea-body" name="body" placeholder="Sudut pandang atau poin utama"></textarea></div><button class="btn btn-primary" type="submit">Simpan ide</button></form>`)}
    </div>
    ${panel("Tentang aplikasi ini", "Alat lokal jalan tanpa internet. AI hanya dipakai kalau kamu mengatur sendiri.", `<p class="muted small">ACE adalah PWA. Pasang di Android lewat menu browser, lalu buka seperti aplikasi biasa. Data tersimpan di perangkat. OpenCode dipakai sebagai agent utama di mesin pengembang. Di aplikasi, koneksi ke model bersifat opsional dan baru dikirim saat tombol Kirim ke AI ditekan.</p>`)}`;
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
  return `<div><h3>${h(result.label)}</h3>${stats}${findings}<p class="muted small" style="margin-top:10px">${h(result.note)}</p></div>`;
}

function renderRole() {
  const state = getState();
  const role = roleById(activeRole);
  const cap = capabilityById(activeCapability, role);
  const checks = state.roleChecks[role.id] || [];
  const checkList = checks.length
    ? `<ul class="list">${checks.map((item) => `<li class="item ${item.done ? "is-done" : ""}">
        <input type="checkbox" data-role="check" data-role-id="${role.id}" data-id="${item.id}" ${item.done ? "checked" : ""} aria-label="Tandai ${h(item.label)}">
        <div class="item-body"><div class="item-title">${h(item.label)}</div></div>
        <button class="btn btn-danger" type="button" data-action="remove-check" data-role-id="${role.id}" data-id="${item.id}">Hapus</button>
      </li>`).join("")}</ul>`
    : empty("Belum ada langkah. Tambahkan satu langkah sesuai pekerjaanmu.");

  const cards = role.capabilities.map((item) => `<button class="cap-card" type="button" data-action="capability" data-role-id="${role.id}" data-cap-id="${item.id}" aria-pressed="${item.id === cap.id}">${icon(item.outputIcon || item.icon || "clipboard")}<strong>${h(item.label)}</strong><span>${h(item.summary)}</span><small>${h(item.output)}</small></button>`).join("");

  const input = state.tools.inputs[cap.id] || "";
  const prompt = state.tools.prompts[cap.id] || buildCapabilityPrompt(role, cap);
  const answer = state.tools.answers[cap.id] || "";
  const result = state.tools.results[cap.id];
  const outputs = `<div class="chips">${role.outputs.map((o) => `<span class="badge">${h(o)}</span>`).join("")}</div>`;

  return `<section class="panel"><div class="role-head"><div class="role-emblem">${icon(role.icon)}</div><div><h2>${h(role.label)}</h2><p class="muted small">${h(role.summary)}</p></div><span class="badge" data-tone="ok">${h(role.capabilities.length)} alat</span></div>
      <div class="item-actions" style="margin-top:16px"><button class="btn" type="button" data-action="nav" data-view="antislop">Buka Antislop</button><button class="btn" type="button" data-action="nav" data-view="prompt">Atur AI</button><button class="btn" type="button" data-action="nav" data-view="data">Cadangkan data</button></div>
    </section>
    <section class="panel"><div class="panel-head"><div><h2>Alat bantu ${h(role.short)}</h2><p class="muted small">Pilih satu fungsi. Prompt AI disiapkan sesuai fungsi dan bahan yang kamu tulis.</p></div></div><div class="cap-grid">${cards}</div></section>
    <section class="panel workbench"><div class="panel-head"><div><h2>${h(cap.label)}</h2><p class="muted small">${h(cap.summary)}</p></div><span class="badge">${h(cap.output)}</span></div>
      <div class="workbench-grid">
        <div>
          <div class="field"><label for="tool-input">Bahan kerja</label><textarea id="tool-input" data-bind="tools.inputs.${cap.id}" placeholder="${h(cap.placeholder)}">${h(input)}</textarea></div>
          <div class="tool-actions"><button class="btn btn-primary" type="button" data-action="run-tool" data-cap-id="${cap.id}">Periksa lokal</button><button class="btn" type="button" data-action="build-tool-prompt" data-cap-id="${cap.id}">Susun prompt AI</button></div>
          <div id="tool-result" style="margin-top:14px">${renderToolResult(result)}</div>
        </div>
        <div>
          <div class="field"><label for="tool-prompt">Prompt AI</label><textarea id="tool-prompt" class="prompt-preview" data-bind="tools.prompts.${cap.id}">${h(prompt)}</textarea></div>
          <div class="tool-actions"><button class="btn btn-primary" type="button" data-action="send-tool" data-cap-id="${cap.id}" ${modelBusy ? "disabled" : ""}>Kirim ke AI</button><button class="btn" type="button" data-action="copy-tool-prompt" data-cap-id="${cap.id}">Salin prompt</button></div>
          <div class="field" style="margin-top:12px"><label for="tool-answer">Jawaban AI</label><textarea id="tool-answer" class="answer-output" data-bind="tools.answers.${cap.id}" placeholder="Jawaban muncul di sini setelah tombol Kirim ke AI ditekan.">${h(answer)}</textarea></div>
          <p class="muted small" style="margin-top:10px">AI opsional. Pemeriksaan lokal tidak mengirim data ke mana pun. Prompt baru dikirim saat kamu menekan tombol.</p>
        </div>
      </div>
    </section>
    <div class="grid2">
      ${panel("Daftar cek kerja", "Langkah awal bisa dicentang, diubah, atau dihapus.", checkList + `<form class="row" data-form="add-check" data-role-id="${role.id}"><div class="field"><label for="new-check">Langkah baru</label><input id="new-check" name="label" placeholder="Contoh: cek kondisi galat" required></div><button class="btn btn-primary" type="submit">Tambah</button></form>`)}
      ${panel("Hasil yang diharapkan", "Daftar keluaran untuk peran ini.", outputs + `<div class="field" style="margin-top:14px"><label for="role-note">Catatan peran</label><textarea id="role-note" data-bind="roleNotes.${role.id}" placeholder="Catat keputusan atau temuan">${h(state.roleNotes[role.id])}</textarea></div>`)}
    </div>`;
}

function renderAntislop() {
  const state = getState();
  let result = panel("Periksa teks", "Alat lokal, teks tidak dikirim ke mana pun.", `<div class="field"><label class="sr-only" for="slop-input">Teks untuk diperiksa</label><textarea id="slop-input" data-bind="slopDraft" placeholder="Tempel teks yang ingin diperiksa">${h(state.slopDraft)}</textarea></div><div class="item-actions" style="margin-top:10px"><button class="btn btn-primary" type="button" data-action="analyze">Periksa teks</button><button class="btn" type="button" data-action="clean-preview">Lihat versi bersih</button></div>`);

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
      ? `<ul class="list">${lastClean.changes.map((change) => `<li class="item"><div class="item-body"><div class="item-title">${h(change)}</div></div></li>`).join("")}</ul>`
      : empty("Tidak ada perubahan otomatis. Perbaikan tetap perlu dilakukan manual.");
    result += panel("Versi bersih", "Periksa dulu sebelum dipakai.", changes + `<div class="field"><label for="clean-output">Hasil</label><textarea id="clean-output" readonly>${h(lastClean.text)}</textarea></div><div class="item-actions" style="margin-top:8px"><button class="btn btn-primary" type="button" data-action="apply-clean">Pakai sebagai draf</button><button class="btn" type="button" data-action="copy-clean">Salin hasil</button></div>`);
  }
  return result;
}

function renderPrompt() {
  const state = getState();
  const model = state.settings.model;
  const preset = MODEL_PRESETS.find((item) => item.id === model.preset) || MODEL_PRESETS[0];
  const filtered = [...TEMPLATES, ...state.customPrompts].filter((item) => {
    const roleOk = promptFilter === "semua" || item.role === promptFilter;
    const q = promptQuery.trim().toLowerCase();
    const queryOk = !q || `${item.title} ${item.text} ${item.role}`.toLowerCase().includes(q);
    return roleOk && queryOk;
  });

  const library = `<div class="row"><div class="field"><label for="prompt-search">Cari prompt</label><input id="prompt-search" value="${h(promptQuery)}" placeholder="Contoh: kontras atau ajakan"></div><div class="field"><label for="prompt-filter">Peran</label><select id="prompt-filter"><option value="semua" ${promptFilter === "semua" ? "selected" : ""}>Semua</option>${ROLES.map((r) => `<option value="${r.id}" ${promptFilter === r.id ? "selected" : ""}>${h(r.label)}</option>`).join("")}</select></div></div>
    <ul class="list" style="margin-top:12px">${filtered.length ? filtered.map((item) => `<li class="item"><div class="item-body"><div class="item-title">${h(item.title)}</div><div class="item-meta">${h(roleById(item.role).label)}</div><pre>${h(item.text)}</pre></div><div class="item-actions"><button class="btn" type="button" data-action="use-template" data-id="${item.id}">Pakai</button><button class="btn" type="button" data-action="copy-template" data-id="${item.id}">Salin</button>${state.customPrompts.some((p) => p.id === item.id) ? `<button class="btn btn-danger" type="button" data-action="remove-custom" data-id="${item.id}">Hapus</button>` : ""}</div></li>`).join("") : empty("Tidak ada prompt yang cocok dengan pencarian.")}</ul>`;

  const config = `<form class="item-stack" data-form="save-model">
      <div class="field"><label for="model-preset">Penyedia</label><select id="model-preset" name="preset">${MODEL_PRESETS.map((p) => `<option value="${p.id}" ${model.preset === p.id ? "selected" : ""}>${h(p.label)}</option>`).join("")}</select><span class="muted small" id="preset-hint">${h(preset.hint)}</span></div>
      <div class="row">
        <div class="field"><label for="model-format">Format API</label><select id="model-format" name="format"><option value="opencode" ${model.format === "opencode" ? "selected" : ""}>OpenCode HTTP API</option><option value="openai" ${model.format === "openai" ? "selected" : ""}>OpenAI kompatibel</option><option value="gemini" ${model.format === "gemini" ? "selected" : ""}>Gemini</option><option value="anthropic" ${model.format === "anthropic" ? "selected" : ""}>Anthropic</option></select></div>
        <div class="field"><label for="model-name">Nama model</label><input id="model-name" name="model" value="${h(model.model)}" placeholder="kosongkan untuk OpenCode"></div>
      </div>
      <div class="field"><label for="model-endpoint">Alamat server atau endpoint</label><input id="model-endpoint" name="endpoint" value="${h(model.endpoint)}" placeholder="https://..."></div>
      <div class="row"><div class="field"><label for="model-directory">Direktori kerja OpenCode</label><input id="model-directory" name="directory" value="${h(model.directory || "")}" placeholder="opsional, contoh: /workspace"></div><div class="field"><label for="model-key">Token atau kunci API</label><input id="model-key" name="apiKey" type="password" value="${h(model.apiKey)}" placeholder="kosongkan bila tidak perlu"></div></div>
      <button class="btn btn-primary" type="submit">Simpan pengaturan AI</button>
    </form><p class="muted small" style="margin-top:10px">Kredensial disimpan di browser perangkat ini. Jangan dipakai di perangkat bersama. Untuk OpenCode, server harus aktif dan mengizinkan origin aplikasi ini. Jika CORS ditolak, pakai bridge milikmu di origin yang sama.</p>`;

  const composer = `<form class="item-stack" data-form="build-prompt"><div class="row"><div class="field"><label for="compose-role">Peran</label><select id="compose-role" name="role">${ROLES.map((r) => `<option value="${r.id}" ${r.id === activeRole ? "selected" : ""}>${h(r.label)}</option>`).join("")}</select></div><div class="field"><label for="compose-task">Tugas</label><input id="compose-task" name="task" placeholder="Contoh: susun kondisi kosong form masuk" required></div></div><button class="btn" type="submit">Susun prompt</button></form>
    <div class="field" style="margin-top:12px"><label for="prompt-compose">Prompt</label><textarea id="prompt-compose">${h(composerDraft)}</textarea></div>
    <div class="item-actions" style="margin-top:8px"><button class="btn btn-primary" type="button" data-action="send-model" ${modelBusy ? "disabled" : ""}>${modelBusy ? "Mengirim..." : "Kirim ke AI"}</button><button class="btn" type="button" data-action="copy-compose">Salin prompt</button></div>
    <div class="field" style="margin-top:12px"><label for="model-output">Jawaban AI</label><textarea id="model-output" readonly placeholder="Jawaban muncul di sini"></textarea></div>`;

  const customForm = `<form class="item-stack" data-form="add-custom-prompt"><div class="field"><label for="custom-title">Nama prompt</label><input id="custom-title" name="title" required></div><div class="field"><label for="custom-role">Peran</label><select id="custom-role" name="role">${ROLES.map((r) => `<option value="${r.id}">${h(r.label)}</option>`).join("")}</select></div><div class="field"><label for="custom-text">Isi prompt</label><textarea id="custom-text" name="text" required></textarea></div><button class="btn btn-primary" type="submit">Simpan prompt</button></form>`;

  return `${panel("Koneksi AI", "Opsional. Semua alat lokal tetap berfungsi tanpa ini.", config)}
    ${panel("Pustaka prompt", `${TEMPLATES.length + state.customPrompts.length} prompt tersedia dari kapabilitas dan prompt sendiri.`, library)}
    <div class="grid2">${panel("Komposer", "Susun prompt lalu kirim bila koneksi sudah diatur.", composer)}${panel("Prompt sendiri", "Simpan prompt yang sering dipakai.", customForm)}</div>`;
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
  const channels = ["Umpan", "Cerita", "Video", "Artikel", "Buletin"];
  const grid = `<div class="week">${days.map((day) => {
    const key = dateKey(day);
    const items = state.planner.items.filter((i) => i.date === key);
    const list = items.length ? `<ul class="list">${items.map((item) => `<li class="item ${item.done ? "is-done" : ""}"><input type="checkbox" data-role="plan" data-id="${item.id}" ${item.done ? "checked" : ""} aria-label="Selesai ${h(item.title)}"><div class="item-body"><div class="item-title">${h(item.title)}</div><div class="item-meta">${h(item.channel)}</div></div><button class="btn btn-danger" type="button" data-action="remove" data-path="planner.items" data-id="${item.id}">Hapus</button></li>`).join("")}</ul>` : empty("Belum ada jadwal.");
    return `<section class="day ${key === today ? "is-today" : ""}"><h3><time datetime="${key}">${h(fmtDate(day))}</time></h3>${list}<form class="item-stack" data-form="add-plan" data-date="${key}"><div class="field"><label class="sr-only" for="plan-${key}">Judul ${h(fmtDate(day))}</label><input id="plan-${key}" name="title" placeholder="Judul unggahan" required></div><div class="field"><label class="sr-only" for="chan-${key}">Kanal ${h(fmtDate(day))}</label><select id="chan-${key}" name="channel">${channels.map((channel) => `<option>${channel}</option>`).join("")}</select></div><button class="btn btn-primary" type="submit">Tambah</button></form></section>`;
  }).join("")}</div>`;
  return `<section class="panel"><div class="week-head"><div><h2>${h(fmtDate(days[0]))} sampai ${h(fmtDate(days[6]))}</h2><p class="muted small">Hari berjalan diberi garis aksen.</p></div><div class="item-actions"><button class="btn" type="button" data-action="week-prev">Sebelumnya</button><button class="btn" type="button" data-action="week-today">Hari ini</button><button class="btn" type="button" data-action="week-next">Berikutnya</button></div></div>${grid}</section>`;
}

function renderWriter() {
  const state = getState();
  const chapters = state.writer.chapters;
  const total = chapters.reduce((sum, chapter) => sum + (Number(chapter.words) || 0), 0);
  const done = chapters.filter((chapter) => chapter.status === "Selesai").length;
  const list = chapters.length ? `<ul class="list">${chapters.map((chapter, i) => `<li class="item"><div class="item-body item-stack"><div class="item-meta">Bab ${i + 1}</div><input data-path="writer.chapters" data-id="${chapter.id}" data-prop="title" value="${h(chapter.title)}" aria-label="Judul bab ${i + 1}"><div class="row"><div class="field"><label class="sr-only" for="st-${chapter.id}">Status bab ${i + 1}</label><select id="st-${chapter.id}" data-path="writer.chapters" data-id="${chapter.id}" data-prop="status">${["Rancangan", "Draf", "Selesai"].map((status) => `<option ${chapter.status === status ? "selected" : ""}>${status}</option>`).join("")}</select></div><div class="field"><label class="sr-only" for="tg-${chapter.id}">Target kata bab ${i + 1}</label><input id="tg-${chapter.id}" type="number" min="0" inputmode="numeric" data-path="writer.chapters" data-id="${chapter.id}" data-prop="target" data-type="number" value="${h(chapter.target ?? "")}" placeholder="Target"></div><div class="field"><label class="sr-only" for="wd-${chapter.id}">Kata tercatat bab ${i + 1}</label><input id="wd-${chapter.id}" type="number" min="0" inputmode="numeric" data-path="writer.chapters" data-id="${chapter.id}" data-prop="words" data-type="number" value="${h(chapter.words ?? "")}" placeholder="Kata tercatat"></div></div></div><button class="btn btn-danger" type="button" data-action="remove" data-path="writer.chapters" data-id="${chapter.id}">Hapus</button></li>`).join("")}</ul>` : empty("Belum ada bab. Tambahkan bab pertama.");

  return `${panel("Ringkasan", "Angka berasal dari kolom yang kamu isi.", `<div class="summary"><span>${chapters.length} bab</span><span>${done} selesai</span><span>${new Intl.NumberFormat("id-ID").format(total)} kata tercatat</span></div>`)}
    <div class="grid2">${panel("Sinopsis", "Premis dan konflik utama.", `<div class="field"><label class="sr-only" for="synopsis">Sinopsis</label><textarea id="synopsis" data-bind="writer.synopsis" placeholder="Tulis premis">${h(state.writer.synopsis)}</textarea></div>`)}${panel("Tokoh dan dunia", "Catatan tokoh, motif, dan aturan dunia.", `<div class="field"><label class="sr-only" for="characters">Tokoh dan dunia</label><textarea id="characters" data-bind="writer.characters" placeholder="Tulis catatan tokoh">${h(state.writer.characters)}</textarea></div>`)}</div>
    <div class="grid2">${panel("Daftar bab", "Isi target dan kata untuk melihat progres nyata.", list + `<form class="row" data-form="add-chapter"><div class="field"><label for="chapter-title">Judul bab</label><input id="chapter-title" name="title" placeholder="Judul bab" required></div><button class="btn btn-primary" type="submit">Tambah bab</button></form>`)}${panel("Target keseluruhan", "Opsional.", `<form class="row" data-form="set-target"><div class="field"><label for="target-words">Target kata</label><input id="target-words" type="number" min="0" inputmode="numeric" name="target" value="${h(state.writer.targetWords ?? "")}" placeholder="Contoh: 60000"></div><button class="btn btn-primary" type="submit">Simpan</button></form>`)}</div>`;
}

function renderAssets() {
  const state = getState();
  const palette = state.palette.map((color) => {
    const report = contrastReport(color.hex, "#FFFFFF");
    return `<div class="swatch"><label class="small" for="pname-${color.id}">Peran warna</label><input id="pname-${color.id}" data-path="palette" data-id="${color.id}" data-prop="name" value="${h(color.name)}"><div><input type="color" data-role="color" data-path="palette" data-id="${color.id}" data-prop="hex" value="${h(color.hex)}" aria-label="Warna ${h(color.name)}"><input data-role="hex" data-path="palette" data-id="${color.id}" data-prop="hex" value="${h(color.hex)}" aria-label="Hex ${h(color.name)}"></div><span class="badge" data-tone="${report.ok ? "ok" : "warn"}">${h(report.label)}</span><button class="btn btn-danger" type="button" data-action="remove" data-path="palette" data-id="${color.id}">Hapus</button></div>`;
  }).join("");

  const snippets = state.snippets.length ? `<ul class="list">${state.snippets.map((snippet) => `<li class="item"><div class="item-body item-stack"><input data-path="snippets" data-id="${snippet.id}" data-prop="title" value="${h(snippet.title)}" aria-label="Nama potongan"><input data-path="snippets" data-id="${snippet.id}" data-prop="tag" value="${h(snippet.tag)}" aria-label="Label"><textarea data-path="snippets" data-id="${snippet.id}" data-prop="code" aria-label="Kode">${h(snippet.code)}</textarea></div><div class="item-actions"><button class="btn" type="button" data-action="copy-snippet" data-id="${snippet.id}">Salin</button><button class="btn btn-danger" type="button" data-action="remove" data-path="snippets" data-id="${snippet.id}">Hapus</button></div></li>`).join("")}</ul>` : empty("Belum ada potongan kode.");

  return `${panel("Palet kerja", "Kontras dihitung terhadap putih.", `<div class="palette">${palette}</div><form class="row" data-form="add-color" style="margin-top:14px"><div class="field"><label for="color-name">Peran</label><input id="color-name" name="name" placeholder="Contoh: garis" required></div><div class="field"><label for="color-hex">Hex</label><input id="color-hex" name="hex" value="#52635C" required></div><button class="btn btn-primary" type="submit">Tambah warna</button></form>`)}
    ${panel("Cek kontras pasangan", "Masukkan dua hex untuk memeriksa teks dan latar.", `<form class="row" data-form="check-contrast"><div class="field"><label for="fg">Teks</label><input id="fg" name="fg" value="#1F1E1B" required></div><div class="field"><label for="bg">Latar</label><input id="bg" name="bg" value="#F5F4EE" required></div><button class="btn btn-primary" type="submit">Periksa</button></form><div id="contrast-result" class="summary"></div>`)}
    ${panel("Potongan kode", "Simpan cuplikan yang sering dipakai.", snippets + `<form class="item-stack" data-form="add-snippet"><div class="row"><div class="field"><label for="snip-title">Nama</label><input id="snip-title" name="title" required></div><div class="field"><label for="snip-tag">Label</label><input id="snip-tag" name="tag" placeholder="css"></div></div><div class="field"><label for="snip-code">Kode</label><textarea id="snip-code" name="code"></textarea></div><button class="btn btn-primary" type="submit">Simpan potongan</button></form>`)}`;
}

function markdownExport() {
  const state = getState();
  const lines = ["# ACE, Ekspor Data", "", "## Fokus", ...state.focus.map((f) => `- ${f.done ? "[x]" : "[ ]"} ${f.text}`), "", "## Catatan cepat", state.quickNote || "Kosong", "", "## Catatan peran"];
  for (const role of ROLES) lines.push(`### ${role.label}`, state.roleNotes[role.id] || "Kosong", "");
  lines.push("## Ide", ...state.ideas.map((idea) => `- ${idea.title} (${idea.status || "Ide"}) dengan ${idea.role || "umum"}: ${idea.body}`), "", "## Jadwal konten", ...state.planner.items.map((item) => `- ${item.date}: ${item.title} (${item.channel})`), "", "## Naskah", state.writer.synopsis || "Kosong", "", ...state.writer.chapters.flatMap((chapter) => [`### ${chapter.title} (${chapter.status})`, `Target: ${chapter.target ?? "-"}, tercatat: ${chapter.words ?? "-"}`]));

  lines.push("", "## Alat kerja");
  let adaAlat = false;
  for (const { role, cap } of semuaKapabilitas()) {
    const bahan = state.tools.inputs[cap.id] || "";
    const hasilPemeriksaan = state.tools.results[cap.id];
    const jawaban = state.tools.answers[cap.id] || "";
    if (!bahan && !hasilPemeriksaan && !jawaban) continue;
    adaAlat = true;
    lines.push(`### ${role.label}: ${cap.label}`, `Bahan: ${bahan || "Kosong"}`, "");
    if (hasilPemeriksaan) lines.push("Pemeriksaan lokal:", daftarHasilTeks(hasilPemeriksaan), "");
    if (jawaban) lines.push("Jawaban AI:", jawaban, "");
  }
  if (!adaAlat) lines.push("Belum ada hasil alat kerja yang tersimpan.");
  return lines.join("\n");
}

function renderData() {
  return `${panel("Cadangan data", "Semua data ada di browser perangkat ini.", `<div class="item-actions"><button class="btn btn-primary" type="button" data-action="export-json">Unduh JSON</button><button class="btn" type="button" data-action="export-md">Unduh Markdown</button><label class="btn" for="import-file">Impor JSON</label><input id="import-file" type="file" accept="application/json" class="sr-only"></div><p class="muted small" style="margin-top:10px">Impor akan mengganti data saat ini. Unduh cadangan dulu bila perlu.</p>`)}
    ${panel("Tampilan", "Tema dan lebar navigasi disimpan di perangkat.", `<div class="item-actions"><button class="btn" type="button" data-action="theme" data-theme="paper">Terang</button><button class="btn" type="button" data-action="theme" data-theme="night">Gelap</button><button class="btn" type="button" data-action="toggle-rail">${document.body.classList.contains("rail-collapsed") ? "Perbesar navigasi" : "Kecilkan navigasi"}</button></div>`)}
    ${panel("Pasang di Android", "Langkah singkat.", `<ol class="list"><li class="item"><div class="item-body">Buka alamat aplikasi di Chrome Android.</div></li><li class="item"><div class="item-body">Pilih menu browser, lalu Add to Home screen atau Install app.</div></li><li class="item"><div class="item-body">Buka ikon aplikasi. Alat lokal tetap berfungsi tanpa internet setelah terpasang.</div></li></ol>`)}
    ${panel("Keadaan kosong", "Menghapus semua data tidak bisa dibatalkan.", `<button class="btn btn-danger" type="button" data-action="reset">${confirmReset ? "Ya, hapus semua data" : "Hapus semua data"}</button>`)}
    ${panel("Tentang", "Informasi aplikasi.", `<p class="muted small">Versi 2, PWA offline, sembilan peran, dan tujuh alat pendukung. Dibangun dengan OpenCode sebagai agent utama di mesin pengembang. Tidak ada akun dan tidak ada pengiriman otomatis. Koneksi AI baru dipakai saat tombol Kirim ke AI ditekan.</p>`)}`;
}

const RENDERERS = {
  home: renderHome,
  role: renderRole,
  antislop: renderAntislop,
  prompt: renderPrompt,
  planner: renderPlanner,
  writer: renderWriter,
  assets: renderAssets,
  data: renderData,
};

function navButton(item, action, extra = "") {
  const label = `${item.label}${item.hint ? ` ${item.hint}` : ""}`;
  return `<button class="rail-btn" type="button" data-action="${action}" ${extra} title="${h(label)}" data-tooltip="${h(item.label)}">${icon(item.icon)}<span class="rail-copy"><strong>${h(item.label)}</strong><span>${h(item.hint || "")}</span></span></button>`;
}

function syncRailLabels() {
  const collapsed = document.body.classList.contains("rail-collapsed");
  document.querySelectorAll("#rail .rail-btn").forEach((button) => {
    if (collapsed) button.setAttribute("aria-label", button.dataset.tooltip);
    else button.removeAttribute("aria-label");
  });
}

function buildNav() {
  document.getElementById("rail").innerHTML = `
    <div class="rail-group">
      <p class="rail-heading">Bidang kerja</p>
      <ul class="rail-list">${ROLES.map((role) => `<li>${navButton({ label: role.label, hint: role.short, icon: role.icon }, "role", `data-role-id="${role.id}"`)}</li>`).join("")}</ul>
    </div>
    <hr class="rail-divider">
    <div class="rail-group">
      <p class="rail-heading">Alat pendukung</p>
      <ul class="rail-list">${UTILITIES.map((item) => `<li>${navButton(item, "nav", `data-view="${item.id}"`)}</li>`).join("")}</ul>
    </div>`;

  document.getElementById("bottomNav").innerHTML = BOTTOM.map((item) => `<button type="button" data-action="${item.action}" ${item.action === "nav" ? `data-view="${item.id}"` : ""} aria-label="${h(item.label)}">${icon(item.icon)}<span>${h(item.label)}</span></button>`).join("");

  document.getElementById("workDialogList").innerHTML = `
    <p class="dialog-section">Bidang kerja</p>
    ${ROLES.map((role) => `<button class="btn" type="button" data-action="role" data-role-id="${role.id}">${icon(role.icon)}<span>${h(role.label)}</span></button>`).join("")}
    <hr>
    <p class="dialog-section">Alat pendukung</p>
    ${UTILITIES.map((item) => `<button class="btn" type="button" data-action="nav" data-view="${item.id}">${icon(item.icon)}<span>${h(item.label)}</span></button>`).join("")}`;
}

function markNav() {
  document.querySelectorAll("[data-action='nav']").forEach((button) => {
    if (button.dataset.view === current) button.setAttribute("aria-current", "page");
    else button.removeAttribute("aria-current");
  });
  document.querySelectorAll("[data-action='role']").forEach((button) => {
    if (current === "role" && button.dataset.roleId === activeRole) button.setAttribute("aria-current", "page");
    else button.removeAttribute("aria-current");
  });
  document.querySelectorAll("[data-action='open-work']").forEach((button) => {
    if (current === "role") button.setAttribute("aria-current", "page");
    else button.removeAttribute("aria-current");
  });
}

function updateChrome() {
  const role = roleById(activeRole);
  const cap = capabilityById(activeCapability, role);
  const util = UTILITIES.find((item) => item.id === current);
  pageTitle.textContent = current === "role" ? role.label : (util?.label || "Ruang kerja");
  pageSubtitle.textContent = current === "role"
    ? `${cap.label}. ${cap.summary}`
    : (current === "home" ? "Ruang kerja kreatif yang ikut ke mana pun kamu pergi." : (util?.hint || "Alat pendukung ACE."));
  contextLabel.textContent = current === "role" ? `${role.label} / ${cap.label}` : (util?.label || "ACE");
}

function navigate(id) {
  if (!RENDERERS[id]) return;
  current = id;
  if (dialog.open) dialog.close();
  render();
  window.scrollTo({ top: 0 });
}

function openRole(id) {
  if (!ROLES.some((role) => role.id === id)) return;
  activeRole = id;
  activeCapability = roleById(id).capabilities[0].id;
  getState().settings.activeRole = id;
  getState().settings.activeCapability = activeCapability;
  commit();
  navigate("role");
}

function openCapability(roleId, capId) {
  const role = roleById(roleId);
  const cap = capabilityById(capId, role);
  activeRole = role.id;
  activeCapability = cap.id;
  getState().settings.activeRole = role.id;
  getState().settings.activeCapability = cap.id;
  commit();
  if (current !== "role") navigate("role");
  else render();
}

function render() {
  updateChrome();
  try {
    view.innerHTML = RENDERERS[current]();
  } catch (error) {
    console.error(error);
    view.innerHTML = `<div class="panel"><h2>Tampilan gagal dibuat</h2><p class="muted">Buka alat lain lalu periksa konsol.</p></div>`;
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
    if (current === "data") render();
  }
}

function openWorkDialog() {
  if (!dialog.open) dialog.showModal();
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
  if (target.id === "prompt-search") { promptQuery = target.value; render(); }
  if (target.id === "prompt-filter") { promptFilter = target.value; render(); }
  if (target.id === "model-preset") {
    const preset = MODEL_PRESETS.find((item) => item.id === target.value);
    if (preset) {
      document.getElementById("model-format").value = preset.format;
      document.getElementById("model-endpoint").value = preset.endpoint;
      document.getElementById("model-name").value = preset.model;
      document.getElementById("model-directory").value = preset.directory || "";
      document.getElementById("preset-hint").textContent = preset.hint;
    }
  }
  if (target.id === "import-file") handleImport(target);
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
    document.getElementById("contrast-result").innerHTML = `<span class="badge" data-tone="${report.ok ? "ok" : "warn"}">${h(report.label)}</span>`;
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
    const composed = `Bertindak sebagai ${role.label} pada tugas ${cap.label}.\n\nTugas: ${task}\n\nKeluarkan:\n1. Langkah pengerjaan\n2. Hasil akhir yang bisa langsung dipakai\n3. Asumsi yang perlu dikonfirmasi\n\nAturan: Bahasa Indonesia, langsung, tanpa klaim atau angka tanpa sumber.`;
    composerDraft = composed;
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

  if (action === "capability") {
    openCapability(button.dataset.roleId, button.dataset.capId);
    return;
  }
  if (action === "run-tool") {
    const cap = capabilityById(button.dataset.capId);
    const bahan = state.tools.inputs[cap.id] || "";
    state.tools.results[cap.id] = runTool(cap.tool, bahan);
    commit();
    render();
    return;
  }
  if (action === "build-tool-prompt") {
    const cap = capabilityById(button.dataset.capId);
    state.tools.prompts[cap.id] = buildCapabilityPrompt(roleById(activeRole), cap);
    commit();
    render();
    notify("Prompt disiapkan dari fungsi dan bahan yang kamu tulis");
    return;
  }
  if (action === "copy-tool-prompt") {
    const cap = capabilityById(button.dataset.capId);
    const text = document.getElementById("tool-prompt")?.value || state.tools.prompts[cap.id] || buildCapabilityPrompt(roleById(activeRole), cap);
    await flashCopy(button, text);
    return;
  }
  if (action === "send-tool") {
    const cap = capabilityById(button.dataset.capId);
    const prompt = document.getElementById("tool-prompt")?.value.trim() || buildCapabilityPrompt(roleById(activeRole), cap);
    await sendToModel(button, { prompt, output: document.getElementById("tool-answer"), saveKey: cap.id, label: "Kirim ke AI" });
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
  if (action === "copy-clean") { await flashCopy(button, lastClean?.text || ""); return; }
  if (action === "use-template") {
    const item = [...TEMPLATES, ...state.customPrompts].find((template) => template.id === button.dataset.id);
    if (item) {
      composerDraft = item.text;
      navigate("prompt");
      const area = document.getElementById("prompt-compose");
      if (area) area.value = item.text;
    }
    return;
  }
  if (action === "copy-template") {
    const item = [...TEMPLATES, ...state.customPrompts].find((template) => template.id === button.dataset.id);
    if (item) await flashCopy(button, item.text);
    return;
  }
  if (action === "remove-custom") {
    const index = state.customPrompts.findIndex((item) => item.id === button.dataset.id);
    if (index >= 0) state.customPrompts.splice(index, 1);
    commit(); render(); return;
  }
  if (action === "copy-compose") { await flashCopy(button, document.getElementById("prompt-compose").value); return; }
  if (action === "copy-snippet") {
    const item = state.snippets.find((snippet) => snippet.id === button.dataset.id);
    if (item) await flashCopy(button, item.code);
    return;
  }
  if (action === "send-model") {
    await sendToModel(button, { prompt: document.getElementById("prompt-compose")?.value || "", output: document.getElementById("model-output"), label: "Kirim ke AI" });
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
    markTheme();
    setRail(false, false);
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
    activeRole = getState().settings.activeRole || "ux";
    activeCapability = getState().settings.activeCapability || roleById(activeRole).capabilities[0].id;
    markTheme();
    setRail(Boolean(getState().settings.railCollapsed), false);
    render();
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
    method: "POST",
    headers,
    body: JSON.stringify({ text: prompt }),
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
  if (!model.endpoint) { notify("Isi alamat server atau endpoint di AI & Prompt", "error"); return; }
  if (model.format !== "opencode" && model.format !== "gemini" && !model.model) {
    notify("Isi nama model di AI & Prompt", "error");
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

document.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-action]");
  if (!button) return;
  const action = button.dataset.action;
  if (action === "nav") navigate(button.dataset.view);
  else if (action === "role") openRole(button.dataset.roleId);
  else if (action === "theme") applyTheme(button.dataset.theme);
  else if (action === "open-work") openWorkDialog();
  else if (action === "close-dialog") dialog.close();
});

railToggle.addEventListener("click", () => {
  if (narrow.matches) openWorkDialog();
  else setRail(!document.body.classList.contains("rail-collapsed"));
});

if (narrow.addEventListener) narrow.addEventListener("change", updateToggleLabel);
dialog.addEventListener("click", (event) => { if (event.target === dialog) dialog.close(); });

function init() {
  loadState();
  const savedRole = getState().settings.activeRole;
  activeRole = ROLES.some((role) => role.id === savedRole) ? savedRole : "ux";
  const savedCap = getState().settings.activeCapability;
  const semuanya = semuaKapabilitas();
  activeCapability = semuanya.some((entry) => entry.cap.id === savedCap) ? savedCap : roleById(activeRole).capabilities[0].id;
  markTheme();
  buildNav();
  setRail(Boolean(getState().settings.railCollapsed), false);
  render();
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("./sw.js").catch((error) => console.warn("Service worker gagal", error));
  }
}

init();
