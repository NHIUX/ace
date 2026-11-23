import { ROLES, MODEL_PRESETS } from "./data.js";

const KEY = "ace-v2";
const LEGACY_KEY = "antigravity-studio-v2";

function seedChecks() {
  const out = {};
  for (const role of ROLES) {
    out[role.id] = role.checks.map((label, index) => ({
      id: `seed-${role.id}-${index}`,
      label,
      done: false,
    }));
  }
  return out;
}

function defaults() {
  const preset = MODEL_PRESETS[0];
  const roleNotes = {};
  for (const role of ROLES) roleNotes[role.id] = "";
  return {
    version: 2,
    updatedAt: null,
    focus: [],
    quickNote: "",
    roleNotes,
    roleChecks: seedChecks(),
    ideas: [],
    snippets: [],
    palette: [
      { id: "p1", name: "Latar", hex: "#F5F4EE" },
      { id: "p2", name: "Permukaan", hex: "#FFFFFF" },
      { id: "p3", name: "Teks", hex: "#1F1E1B" },
      { id: "p4", name: "Aksen", hex: "#B85C38" },
    ],
    planner: { offset: 0, items: [] },
    writer: { synopsis: "", characters: "", chapters: [], targetWords: null },
    customPrompts: [],
    slopDraft: "",
    tools: { inputs: {}, results: {}, prompts: {}, answers: {} },
    settings: {
      theme: "paper",
      railCollapsed: false,
      activeRole: "ux",
      activeCapability: "ux-research",
      model: {
        preset: preset.id,
        endpoint: preset.endpoint,
        model: preset.model,
        format: preset.format,
        apiKey: "",
        directory: "",
      },
    },
  };
}

let state = defaults();

export function getState() {
  return state;
}

export function loadState() {
  try {
    let raw = localStorage.getItem(KEY);
    if (!raw) {
      raw = localStorage.getItem(LEGACY_KEY);
      if (raw) {
        localStorage.setItem(KEY, raw);
        localStorage.removeItem(LEGACY_KEY);
      }
    }
    if (!raw) return state;
    const parsed = JSON.parse(raw);
    if (!parsed || parsed.version !== 2) return state;
    state = merge(defaults(), parsed);
  } catch (error) {
    console.warn("Gagal memuat data lokal", error);
  }
  return state;
}

function merge(base, incoming) {
  const out = Array.isArray(base) ? [...base] : { ...base };
  for (const [key, value] of Object.entries(incoming || {})) {
    if (value && typeof value === "object" && !Array.isArray(value) && base[key] && typeof base[key] === "object" && !Array.isArray(base[key])) {
      out[key] = merge(base[key], value);
    } else if (value !== undefined) {
      out[key] = value;
    }
  }
  return out;
}

export function saveState() {
  state.updatedAt = new Date().toISOString();
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
    return { ok: true, updatedAt: state.updatedAt };
  } catch (error) {
    return { ok: false, error: String(error?.message || error) };
  }
}

export function resetState() {
  state = defaults();
  saveState();
  return state;
}

export function exportJson() {
  return JSON.stringify(state, null, 2);
}

export function importJson(text) {
  const parsed = JSON.parse(text);
  if (!parsed || typeof parsed !== "object") throw new Error("Berkas bukan objek data");
  state = merge(defaults(), parsed);
  state.version = 2;
  saveState();
  return state;
}

export function uid() {
  return `id-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}
