export const DAY_MS = 86_400_000;
export const MAX_DATABASE_BYTES = 256 * 1024;
export const MAX_RULES = 1_000;
export const MAX_LIST_ITEMS = 5_000;
export const MAX_TEXT_LENGTH = 8_000;
export const MAX_RESOURCE_ENTRIES = 50_000;
export const MAX_DATABASE_DEPTH = 40;
export const MAX_DATABASE_NODES = 100_000;

const TELEGRAM_HOSTS = new Set(["t.me", "www.t.me", "telegram.me", "www.telegram.me"]);
const USERNAME_RE = /^[A-Za-z][A-Za-z0-9_]{4,31}$/;
const RESOURCE_ID_RE = /^[a-z][a-z0-9_-]{1,47}$/;
const RESOURCE_TYPES = new Set(["kv", "cache", "memory", "counter", "queue", "index"]);

export function asText(value) {
  return value == null ? "" : String(value).trim();
}

export function normalizeText(value) {
  return asText(value)
    .normalize("NFKC")
    .toLocaleLowerCase("fa-IR")
    .replace(/[\u064B-\u065F\u0670]/g, "")
    .replace(/[\u064A]/g, "ی")
    .replace(/[\u0643]/g, "ک")
    .replace(/[\u200c\u200f\u200e\u0640]/g, " ")
    .replace(/[\p{P}\p{S}]+/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function tokenize(value) {
  return normalizeText(value).split(" ").filter(Boolean).slice(0, 80);
}

function parseTelegramUrl(value) {
  const raw = asText(value);
  if (!raw) return null;
  try {
    const url = new URL(raw.includes("://") ? raw : `https://${raw}`);
    if (!TELEGRAM_HOSTS.has(url.hostname.toLowerCase())) return null;
    return url;
  } catch {
    return null;
  }
}

export function parsePublicChannel(value) {
  const raw = asText(value);
  if (!raw) return null;
  const username = raw.startsWith("@")
    ? raw.slice(1)
    : (() => {
        const url = parseTelegramUrl(raw);
        if (!url) return null;
        const parts = url.pathname.split("/").filter(Boolean);
        if (!parts.length || ["c", "s"].includes(parts[0].toLowerCase()) || parts[0].startsWith("+")) return null;
        return parts[0];
      })();
  return username && USERNAME_RE.test(username) ? username : null;
}

export function parseMessageLink(value) {
  const url = parseTelegramUrl(value);
  if (!url) return null;
  let parts = url.pathname.split("/").filter(Boolean);
  if (parts[0]?.toLowerCase() === "s") parts = parts.slice(1);
  if (!parts.length) return null;

  if (parts[0].toLowerCase() === "c") {
    if (parts.length < 3 || !/^\d+$/.test(parts[1])) return null;
    const messageId = Number(parts[2]);
    if (!Number.isSafeInteger(messageId) || messageId < 1) return null;
    return [`-100${parts[1]}`, messageId];
  }

  if (parts.length < 2 || !USERNAME_RE.test(parts[0])) return null;
  const messageId = Number(parts[1]);
  if (!Number.isSafeInteger(messageId) || messageId < 1) return null;
  return [`@${parts[0]}`, messageId];
}

export function parseDatabaseModule(source) {
  const raw = String(source ?? "").replace(/^\uFEFF/, "").trim();
  const bytes = new TextEncoder().encode(raw).byteLength;
  if (!raw || bytes > MAX_DATABASE_BYTES) throw new Error("database_size_invalid");
  if (!raw.startsWith("export default")) throw new Error("database_module_must_export_default");

  let body = raw.slice("export default".length).trim();
  if (body.endsWith(";")) body = body.slice(0, -1).trim();
  if (!body.startsWith("{") || !body.endsWith("}")) throw new Error("database_must_be_object_literal");

  let database;
  try {
    database = JSON.parse(body);
  } catch {
    throw new Error("database_must_use_data_only_js_syntax");
  }
  validateDatabase(database);
  return database;
}

export function validateDatabase(database) {
  if (!database || typeof database !== "object" || Array.isArray(database)) throw new Error("database_root_invalid");
  if (!Number.isInteger(database.schemaVersion) || database.schemaVersion < 1 || database.schemaVersion > 3) throw new Error("database_schema_version_unsupported");
  if (!database.texts || typeof database.texts !== "object" || Array.isArray(database.texts)) throw new Error("database_texts_missing");
  if (!database.features || typeof database.features !== "object" || Array.isArray(database.features)) throw new Error("database_features_missing");

  const roles = database.roles ?? {};
  for (const field of ["adminIds", "protectedIds"]) {
    const list = roles[field];
    if (list != null && (!Array.isArray(list) || list.length > 500 || list.some((id) => !/^\d{1,20}$/.test(String(id))))) {
      throw new Error(`database_${field}_invalid`);
    }
  }
  if (roles.adminsByChat != null) {
    if (!roles.adminsByChat || typeof roles.adminsByChat !== "object" || Array.isArray(roles.adminsByChat)) {
      throw new Error("database_admins_by_chat_invalid");
    }
    const chatEntries = Object.entries(roles.adminsByChat);
    if (chatEntries.length > 500) throw new Error("database_admins_by_chat_too_large");
    for (const [chatId, admins] of chatEntries) {
      if (!/^-?\d{1,20}$/.test(chatId) || !Array.isArray(admins) || admins.length > 200 || admins.some((id) => !/^\d{1,20}$/.test(String(id)))) {
        throw new Error("database_admins_by_chat_invalid");
      }
    }
  }

  const limits = database.limits ?? {};
  for (const field of ["groupSendIntervalMs", "chatSendIntervalMs", "channelSendIntervalMs", "ownerSendIntervalMs"]) {
    // Keep send delays compatible with the bounded Worker wait window and avoid
    // deliberately configuring sub-second message bursts.
    if (limits[field] != null && (!Number.isFinite(Number(limits[field])) || Number(limits[field]) < 1_000 || Number(limits[field]) > 4_000)) {
      throw new Error(`database_limit_invalid:${field}`);
    }
  }
  if (limits.maxChatRulesEvaluated != null && (!Number.isInteger(Number(limits.maxChatRulesEvaluated)) || Number(limits.maxChatRulesEvaluated) < 1 || Number(limits.maxChatRulesEvaluated) > 1_000)) {
    throw new Error("database_chat_rule_limit_invalid");
  }

  const capabilities = database.runtime?.capabilities ?? [];
  if (!Array.isArray(capabilities) || capabilities.length > 128 || capabilities.some((item) => typeof item !== "string" || !/^[a-z][a-z0-9_.-]{0,63}$/.test(item))) {
    throw new Error("database_capabilities_invalid");
  }
  const resources = database.runtime?.resources ?? [];
  if (!Array.isArray(resources) || resources.length > 96) throw new Error("database_resources_invalid");
  const seenResources = new Set();
  let totalResourceEntries = 0;
  for (const resource of resources) {
    if (!resource || typeof resource !== "object" || Array.isArray(resource)) throw new Error("database_resource_invalid");
    const id = String(resource.id || "");
    if (!RESOURCE_ID_RE.test(id) || id === "v2" || seenResources.has(id)) throw new Error("database_resource_id_invalid");
    if (!RESOURCE_TYPES.has(resource.type)) throw new Error(`database_resource_type_unsupported:${id}`);
    seenResources.add(id);
    const ttl = Number(resource.ttlSeconds ?? 0);
    const maxEntries = Number(resource.maxEntries ?? 1_000);
    const schema = Number(resource.schema ?? 1);
    if (!Number.isFinite(ttl) || ttl < 0 || ttl > 31_536_000) throw new Error(`database_resource_ttl_invalid:${id}`);
    if (!Number.isInteger(maxEntries) || maxEntries < 1 || maxEntries > 20_000) throw new Error(`database_resource_capacity_invalid:${id}`);
    if (!Number.isInteger(schema) || schema < 1 || schema > 10_000) throw new Error(`database_resource_schema_invalid:${id}`);
    totalResourceEntries += maxEntries;
    if (resource.onSchemaChange != null && !["keep", "reset"].includes(resource.onSchemaChange)) throw new Error(`database_resource_migration_invalid:${id}`);
    if (resource.eviction != null && !["fifo", "ring", "none"].includes(resource.eviction)) throw new Error(`database_resource_eviction_invalid:${id}`);
  }
  if (totalResourceEntries > MAX_RESOURCE_ENTRIES) throw new Error("database_resource_total_capacity_exceeded");

  const rules = database.features.chatbot?.rules ?? [];
  if (!Array.isArray(rules) || rules.length > MAX_RULES) throw new Error("database_chatbot_rules_invalid");
  for (const [index, rule] of rules.entries()) {
    if (!rule || typeof rule !== "object" || Array.isArray(rule)) throw new Error(`database_chatbot_rule_invalid:${index}`);
    if (!Array.isArray(rule.keywords) || !rule.keywords.length || rule.keywords.length > 40
      || rule.keywords.some((item) => typeof item !== "string" || !item.trim() || item.length > 120)) {
      throw new Error(`database_chatbot_keywords_invalid:${index}`);
    }
    if (rule.negativeKeywords != null && (!Array.isArray(rule.negativeKeywords) || rule.negativeKeywords.length > 40
      || rule.negativeKeywords.some((item) => typeof item !== "string" || item.length > 120))) {
      throw new Error(`database_chatbot_negative_keywords_invalid:${index}`);
    }
    if (rule.responses != null && (!Array.isArray(rule.responses) || rule.responses.length > 30
      || rule.responses.some((item) => typeof item !== "string" || item.length > MAX_TEXT_LENGTH))) {
      throw new Error(`database_chatbot_responses_invalid:${index}`);
    }
    if (rule.match != null && !["any", "all", "exact"].includes(rule.match)) throw new Error(`database_chatbot_match_invalid:${index}`);
    if (rule.threshold != null && (!Number.isFinite(Number(rule.threshold)) || Number(rule.threshold) < 1 || Number(rule.threshold) > 40)) {
      throw new Error(`database_chatbot_threshold_invalid:${index}`);
    }
    if (rule.priority != null && (!Number.isFinite(Number(rule.priority)) || Number(rule.priority) < 0 || Number(rule.priority) > 100)) {
      throw new Error(`database_chatbot_priority_invalid:${index}`);
    }
  }

  // The uploaded file is parsed as strict JSON data, never evaluated as executable JavaScript.
  // Bound nesting, total nodes, keys, and strings so pathological files cannot exhaust the Worker.
  const stack = [{ value: database, path: "database", depth: 0 }];
  let nodes = 0;
  while (stack.length) {
    const { value, path, depth } = stack.pop();
    nodes += 1;
    if (nodes > MAX_DATABASE_NODES) throw new Error("database_structure_too_large");
    if (depth > MAX_DATABASE_DEPTH) throw new Error("database_nesting_too_deep");
    if (typeof value === "string") {
      if (value.length > MAX_TEXT_LENGTH) throw new Error(`database_text_too_long:${path}`);
      continue;
    }
    if (Array.isArray(value)) {
      if (value.length > MAX_LIST_ITEMS) throw new Error(`database_list_too_large:${path}`);
      for (let index = value.length - 1; index >= 0; index -= 1) {
        stack.push({ value: value[index], path: `${path}.${index}`, depth: depth + 1 });
      }
      continue;
    }
    if (value && typeof value === "object") {
      const entries = Object.entries(value);
      if (entries.length > MAX_LIST_ITEMS) throw new Error(`database_object_too_large:${path}`);
      for (let index = entries.length - 1; index >= 0; index -= 1) {
        const [key, child] = entries[index];
        if (key.length > 160) throw new Error(`database_key_too_long:${path}`);
        if (["__proto__", "prototype", "constructor"].includes(key)) throw new Error(`database_dangerous_key:${path}.${key}`);
        stack.push({ value: child, path: `${path}.${key}`, depth: depth + 1 });
      }
    }
  }
  return true;
}

export function matchPhrase(text, terms = []) {
  const normalized = normalizeText(text);
  if (!normalized || !Array.isArray(terms)) return false;
  return terms.some((term) => {
    const candidate = normalizeText(term);
    if (!candidate) return false;
    return normalized === candidate || ` ${normalized} `.includes(` ${candidate} `);
  });
}

export function scoreNlpRule(text, rule) {
  const normalized = normalizeText(text);
  if (!normalized || !rule || !Array.isArray(rule.keywords)) return 0;
  const keywords = rule.keywords.map(normalizeText).filter(Boolean);
  if (!keywords.length) return 0;
  const padded = ` ${normalized} `;
  const negative = (rule.negativeKeywords || []).map(normalizeText).filter(Boolean);
  if (negative.some((term) => padded.includes(` ${term} `))) return 0;

  const hits = [];
  for (const keyword of keywords) {
    if (normalized === keyword) hits.push({ keyword, weight: 4 });
    else if (padded.includes(` ${keyword} `)) hits.push({ keyword, weight: keyword.includes(" ") ? 3 : 2 });
    else if (keyword.length >= 4 && normalized.includes(keyword)) hits.push({ keyword, weight: 1 });
  }

  const mode = rule.match || "any";
  if (mode === "exact" && !hits.some((hit) => normalized === hit.keyword)) return 0;
  if (mode === "all" && hits.length !== keywords.length) return 0;
  const threshold = Math.max(1, Number(rule.threshold) || (mode === "all" ? keywords.length : 1));
  if (hits.length < threshold) return 0;

  const rawScore = hits.reduce((sum, hit) => sum + hit.weight, 0);
  const priority = Math.max(0, Math.min(100, Number(rule.priority) || 0));
  return rawScore + priority * 0.05;
}

export function selectNlpRule(text, rules = []) {
  let selected = null;
  let selectedScore = 0;
  for (const rule of rules) {
    const score = scoreNlpRule(text, rule);
    if (score > selectedScore) {
      selected = rule;
      selectedScore = score;
    }
  }
  return selected ? { rule: selected, score: selectedScore } : null;
}

export function matchNlpRule(text, rule) {
  return scoreNlpRule(text, rule) > 0;
}

export function renderTemplate(template, values = {}) {
  return String(template ?? "").replace(/\{([a-zA-Z0-9_]+)\}/g, (_, key) => {
    const value = values[key];
    return value == null ? "" : String(value);
  });
}

export function utcDay(timestampMs = Date.now()) {
  return new Date(timestampMs).toISOString().slice(0, 10);
}

export function nextUtcMidnightMs(timestampMs = Date.now()) {
  return (Math.floor(timestampMs / DAY_MS) + 1) * DAY_MS;
}

export function parseIntervalInput(value) {
  const normalized = asText(value).replace(/[,_\s]/g, "");
  if (!/^\d+$/.test(normalized)) return null;
  const number = Number(normalized);
  return Number.isSafeInteger(number) ? number : null;
}

export function isTelegramId(value) {
  return /^-?\d{1,20}$/.test(asText(value));
}

export function isValidHttpsUrl(value) {
  try {
    const url = new URL(asText(value));
    if (url.protocol !== "https:" || url.username || url.password) return false;
    const host = url.hostname.toLowerCase().replace(/^\[|\]$/g, "");
    if (["localhost", "::1"].includes(host) || /\.(local|internal|test|invalid)$/.test(host)) return false;
    const ipv4 = host.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
    if (ipv4) {
      const [a, b] = ipv4.slice(1).map(Number);
      if (ipv4.slice(1).some((part) => Number(part) > 255)) return false;
      if (a === 0 || a === 10 || a === 127 || a >= 224 || (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168) || (a === 100 && b >= 64 && b <= 127)) return false;
    }
    if (host.startsWith("fc") || host.startsWith("fd") || host.startsWith("fe80:") || host === "::") return false;
    return true;
  } catch {
    return false;
  }
}

export function randomItem(items, fallback = "") {
  if (!Array.isArray(items) || !items.length) return fallback;
  return items[Math.floor(Math.random() * items.length)] ?? fallback;
}

export function clampNumber(value, fallback, min, max) {
  const number = Number(value);
  if (!Number.isFinite(number)) return fallback;
  return Math.min(max, Math.max(min, Math.floor(number)));
}

export function makeKeyboardButton(text, callbackData, style = "primary") {
  const button = { text: String(text).slice(0, 64), callback_data: String(callbackData).slice(0, 64) };
  if (["primary", "success", "danger"].includes(style)) button.style = style;
  return button;
}
