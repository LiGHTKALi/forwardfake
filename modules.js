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
  if (!Number.isInteger(database.schemaVersion) || database.schemaVersion < 4 || database.schemaVersion > 5) throw new Error("database_schema_version_unsupported");
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

  for (const descriptor of FEATURE_MODULES) {
    let config = database;
    for (const part of descriptor.path.split(".").slice(0, -1)) config = config?.[part];
    if (!config || typeof config !== "object" || Array.isArray(config)) {
      throw new Error(`database_feature_config_missing:${descriptor.id}`);
    }
    if (config.enabled != null && typeof config.enabled !== "boolean") {
      throw new Error(`database_feature_enabled_invalid:${descriptor.id}`);
    }
  }

  const moderationCommands = database.features.moderation?.commands ?? [];
  const supportedModerationActions = new Set(["ban", "kick", "mute", "unmute", "unban", "delete", "pin", "warn"]);
  if (!Array.isArray(moderationCommands) || moderationCommands.length > 100) throw new Error("database_moderation_commands_invalid");
  for (const [index, command] of moderationCommands.entries()) {
    if (!command || typeof command !== "object" || !/^\/[a-z][a-z0-9_]{1,31}$/i.test(String(command.command || ""))
      || !supportedModerationActions.has(String(command.action || ""))
      || (command.enabled != null && typeof command.enabled !== "boolean")) {
      throw new Error(`database_moderation_command_invalid:${index}`);
    }
  }

  const antiSpam = database.features.antiSpam ?? {};
  const boundedNumber = (object, key, min, max) => {
    if (object[key] != null && (!Number.isFinite(Number(object[key])) || Number(object[key]) < min || Number(object[key]) > max)) {
      throw new Error(`database_policy_value_invalid:${key}`);
    }
  };
  for (const [key, min, max] of [
    ["windowSeconds", 3, 120], ["maxMessages", 3, 30], ["duplicateLimit", 2, 10],
    ["duplicateWindowSeconds", 10, 300], ["chatWindowSeconds", 2, 60], ["chatMaxMessages", 5, 250],
    ["linkWindowSeconds", 3, 120], ["maxLinksPerMessage", 1, 20], ["mentionWindowSeconds", 3, 120],
    ["maxMentionsPerMessage", 2, 50], ["commandWindowSeconds", 3, 120], ["maxCommandsPerWindow", 2, 30],
    ["reportCooldownSeconds", 30, 86_400], ["maxTrackedUsers", 100, 2_000],
  ]) boundedNumber(antiSpam, key, min, max);
  if (antiSpam.signals != null && (!antiSpam.signals || typeof antiSpam.signals !== "object" || Array.isArray(antiSpam.signals)
    || Object.values(antiSpam.signals).some((value) => typeof value !== "boolean"))) throw new Error("database_anti_spam_signals_invalid");
  const raidPolicy = antiSpam.raid ?? {};
  for (const [key, min, max] of [["windowSeconds", 10, 600], ["maxJoins", 3, 100], ["escalationJoins", 3, 200], ["maxLeaves", 3, 100], ["escalationLeaves", 3, 200]]) {
    boundedNumber(raidPolicy, key, min, max);
  }
  const tagPolicy = database.features.tagKnownMembers ?? {};
  for (const [key, min, max] of [["cooldownSeconds", 30, 86_400], ["batchSize", 1, 12], ["maxMembers", 1, 200]]) {
    boundedNumber(tagPolicy, key, min, max);
  }
  for (const key of ["excludeBots", "requirePreview", "allowOptOut"]) {
    if (tagPolicy[key] != null && typeof tagPolicy[key] !== "boolean") throw new Error(`database_tag_policy_invalid:${key}`);
  }

  const automationRules = database.features.automations?.rules ?? [];
  if (!Array.isArray(automationRules) || automationRules.length > 500) throw new Error("database_automation_rules_invalid");
  for (const [index, rule] of automationRules.entries()) {
    if (!rule || typeof rule !== "object" || (rule.enabled != null && typeof rule.enabled !== "boolean")
      || !Array.isArray(rule.keywords) || !rule.keywords.length || rule.keywords.length > 40
      || rule.keywords.some((item) => typeof item !== "string" || !item.trim() || item.length > 120)
      || !["reply", "warn", "delete"].includes(String(rule.action || "reply"))) {
      throw new Error(`database_automation_rule_invalid:${index}`);
    }
    if (rule.cooldownSeconds != null && (!Number.isFinite(Number(rule.cooldownSeconds)) || Number(rule.cooldownSeconds) < 0 || Number(rule.cooldownSeconds) > 86_400)) {
      throw new Error(`database_automation_cooldown_invalid:${index}`);
    }
  }

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

// Declarative feature modules. The Worker core only orchestrates these modules;
// all user-editable defaults, texts, rules, and per-feature settings live in database.js.
export const FEATURE_MODULES = Object.freeze([
  { id: "chatbot", title: "گفت‌وگوی هوشمند NLP", category: "تعامل", description: "پاسخ فارسی بر پایه قوانین و کلیدواژه‌های دیتابیس.", path: "features.chatbot.enabled", settingsPath: "features.chatbot", defaultEnabled: true, requiredPermission: "send_messages", executionType: "per-group" },
  { id: "jokes", title: "جوک و سرگرمی", category: "تعامل", description: "پاسخ به درخواست جوک و محتوای سرگرمی دیتابیس.", path: "features.jokes.enabled", settingsPath: "features.jokes", defaultEnabled: true, requiredPermission: "send_messages", executionType: "per-group" },
  { id: "chatter", title: "گفت‌وگوی زمان‌بندی‌شده", category: "تعامل", description: "ارسال پیام زمان‌بندی‌شده با فاصله و نوسان کنترل‌شده.", path: "features.chatter.enabled", settingsPath: "features.chatter", defaultEnabled: false, requiredPermission: "send_messages", executionType: "alarm" },
  { id: "customCommands", title: "دستورهای سفارشی", category: "تعامل", description: "تعریف فرمان و پاسخ سفارشی داخل دیتابیس.", path: "features.customCommands.enabled", settingsPath: "features.customCommands", defaultEnabled: true, requiredPermission: "send_messages", executionType: "per-group" },
  { id: "automations", title: "اتوماسیون قانون‌محور", category: "تعامل", description: "اجرای پاسخ یا هشدار امن بر اساس قوانین دیتابیس.", path: "features.automations.enabled", settingsPath: "features.automations", defaultEnabled: true, requiredPermission: "send_messages", executionType: "per-group" },
  { id: "memory", title: "حافظهٔ گفتگو", category: "تعامل", description: "حافظه کوتاه‌مدت با TTL و پاک‌سازی خودکار.", path: "features.memory.enabled", settingsPath: "features.memory", defaultEnabled: true, requiredPermission: "durable_storage", executionType: "per-chat" },
  { id: "botReplyJokes", title: "شوخی با ریپلای به ربات", category: "تعامل", description: "پاسخ سرگرم‌کننده به برخی ریپلای‌ها.", path: "features.botReplyJokes.enabled", settingsPath: "features.botReplyJokes", defaultEnabled: false, requiredPermission: "send_messages", executionType: "per-group" },
  { id: "welcome", title: "خوشامدگویی", category: "اعضا", description: "خوشامد idempotent به اعضای تازه‌وارد و ورود ربات.", path: "features.welcome.enabled", settingsPath: "features.welcome", defaultEnabled: true, requiredPermission: "send_messages", executionType: "per-group" },
  { id: "goodbye", title: "پیام بدرقه", category: "اعضا", description: "اعلام خروج عضو از گروه.", path: "features.goodbye.enabled", settingsPath: "features.goodbye", defaultEnabled: false, requiredPermission: "send_messages", executionType: "per-group" },
  { id: "captcha", title: "کپچای ورود", category: "اعضا", description: "محدودسازی موقت عضو تازه‌وارد با تأیید دکمه‌ای.", path: "features.captcha.enabled", settingsPath: "features.captcha", defaultEnabled: false, requiredPermission: "restrict_members", executionType: "per-group" },
  { id: "joinRequests", title: "درخواست عضویت", category: "اعضا", description: "پردازش درخواست پیوستن به گروه.", path: "features.joinRequests.enabled", settingsPath: "features.joinRequests", defaultEnabled: false, requiredPermission: "invite_users", executionType: "per-group" },
  { id: "reports", title: "گزارش تخلف", category: "اعضا", description: "ثبت گزارش و ارسال خلاصه به مالک.", path: "features.reports.enabled", settingsPath: "features.reports", defaultEnabled: true, requiredPermission: "send_messages", executionType: "per-group" },
  { id: "antiSpam", title: "ضداسپم و ضدفلود", category: "امنیت", description: "تشخیص نرخ، تکرار، لینک، mention، فرمان و موج پیام.", path: "features.antiSpam.enabled", settingsPath: "features.antiSpam", defaultEnabled: true, requiredPermission: "delete_messages", executionType: "per-group" },
  { id: "moderation", title: "مدیریت پیام و اعضا", category: "امنیت", description: "اخطار، حذف، بن، کیک، محدودسازی و رفع محدودیت با کنترل مجوز واقعی.", path: "features.moderation.enabled", settingsPath: "features.moderation", defaultEnabled: true, requiredPermission: "administrator", executionType: "per-group" },
  { id: "linkGuard", title: "فیلتر لینک", category: "امنیت", description: "کنترل دامنه‌های ممنوع و فهرست مجاز.", path: "features.linkGuard.enabled", settingsPath: "features.linkGuard", defaultEnabled: true, requiredPermission: "delete_messages", executionType: "per-group" },
  { id: "phishingGuard", title: "ضد فیشینگ", category: "امنیت", description: "شناسایی عبارات و دامنه‌های مشکوک تعریف‌شده.", path: "features.phishingGuard.enabled", settingsPath: "features.phishingGuard", defaultEnabled: true, requiredPermission: "delete_messages", executionType: "per-group" },
  { id: "raidProtection", title: "ضد حمله و هجوم", category: "امنیت", description: "تشخیص موج ورود با آستانه و پنجره قابل تنظیم.", path: "features.raidProtection.enabled", settingsPath: "features.raidProtection", defaultEnabled: false, requiredPermission: "restrict_members", executionType: "per-group" },
  { id: "forwarding", title: "زمان‌بندی فوروارد", category: "زمان‌بندی", description: "زمان‌بندی فوروارد به مقصد گروهی؛ انتشار مستقیم در کانال غیرفعال است.", path: "features.forwarding.enabled", settingsPath: "features.forwarding", defaultEnabled: true, requiredPermission: "send_messages", executionType: "alarm" },
  { id: "groupControls", title: "کنترل روشن/خاموش گروه", category: "مدیریت", description: "دستور و دکمه /bot on و /bot off با احراز مدیر واقعی.", path: "features.groupControls.enabled", settingsPath: "features.groupControls", defaultEnabled: true, requiredPermission: "administrator", executionType: "per-group" },
  { id: "tagKnownMembers", title: "تگ اعضای شناخته‌شده", category: "مدیریت", description: "پیش‌نمایش و تگ کاربران شناخته‌شده از Updateهای واقعی؛ نه همه اعضا.", path: "features.tagKnownMembers.enabled", settingsPath: "features.tagKnownMembers", defaultEnabled: false, requiredPermission: "administrator", executionType: "per-group" },
]);

export function getFeatureModule(id) {
  return FEATURE_MODULES.find((item) => item.id === String(id)) || null;
}

export function isModuleEnabled(database, overrides, id) {
  const descriptor = getFeatureModule(id);
  if (!descriptor) return false;
  const override = overrides && Object.hasOwn(overrides, id) ? overrides[id] : undefined;
  if (typeof override === "boolean") return override;
  let current = database;
  for (const part of descriptor.path.split(".")) current = current?.[part];
  return typeof current === "boolean" ? current : descriptor.defaultEnabled;
}

export function paginateModules(page = 0, pageSize = 6) {
  const safePageSize = Math.max(2, Math.min(12, Math.floor(Number(pageSize) || 6)));
  const totalPages = Math.max(1, Math.ceil(FEATURE_MODULES.length / safePageSize));
  const currentPage = Math.max(0, Math.min(totalPages - 1, Math.floor(Number(page) || 0)));
  const start = currentPage * safePageSize;
  return {
    page: currentPage,
    totalPages,
    items: FEATURE_MODULES.slice(start, start + safePageSize),
    hasPrevious: currentPage > 0,
    hasNext: currentPage < totalPages - 1,
  };
}

export function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  })[character]);
}

export function parseCommand(text = "") {
  const parts = String(text).trim().split(/\s+/).filter(Boolean);
  if (!parts.length || !parts[0].startsWith("/")) return null;
  const [command, ...args] = parts;
  return { command: command.split("@")[0].toLowerCase(), args };
}


export function getModuleConfig(database, id) {
  const descriptor = getFeatureModule(id);
  if (!descriptor) return null;
  let current = database;
  for (const part of descriptor.path.split(".").slice(0, -1)) current = current?.[part];
  return current && typeof current === "object" && !Array.isArray(current) ? current : null;
}

export function getTelegramUpdateActor(update) {
  return update?.message?.from?.id
    ?? update?.edited_message?.from?.id
    ?? update?.callback_query?.from?.id
    ?? update?.chat_join_request?.from?.id
    ?? update?.my_chat_member?.from?.id
    ?? update?.chat_member?.from?.id
    ?? update?.edited_channel_post?.from?.id
    ?? update?.channel_post?.from?.id
    ?? "";
}

export function isOwnerBootstrapUpdate(update) {
  const message = update?.message;
  if (!message || message.chat?.type !== "private" || !message.from?.id || message.from.is_bot
    || String(message.chat?.id || "") !== String(message.from.id)) return false;
  return /^\/start(?:@\w+)?(?:\s|$)/i.test(String(message.text || "").trim());
}

export function reserveSplitQuota(currentQuota, ownerRequest, now = Date.now()) {
  const day = utcDay(now);
  const quota = currentQuota && currentQuota.day === day
    ? {
        day,
        publicRequests: Math.max(0, Math.floor(Number(currentQuota.publicRequests) || 0)),
        ownerRequests: Math.max(0, Math.floor(Number(currentQuota.ownerRequests) || 0)),
        totalRequests: Math.max(0, Math.floor(Number(currentQuota.totalRequests) || 0)),
      }
    : { day, publicRequests: 0, ownerRequests: 0, totalRequests: 0 };
  if (ownerRequest) {
    if (quota.ownerRequests >= 1_000) return { allowed: false, owner: true, reason: "OWNER_RESERVE_EXHAUSTED", quota };
    quota.ownerRequests += 1;
  } else {
    if (quota.publicRequests >= 99_000) return { allowed: false, owner: false, reason: "PUBLIC_RESERVE_REACHED", quota };
    quota.publicRequests += 1;
  }
  quota.totalRequests += 1;
  return {
    allowed: true,
    owner: Boolean(ownerRequest),
    quota,
    publicRemaining: Math.max(0, 99_000 - quota.publicRequests),
    ownerRemaining: Math.max(0, 1_000 - quota.ownerRequests),
    total: quota.totalRequests,
    resetAt: nextUtcMidnightMs(now),
  };
}

export async function getCloudflareWorkersUsage({ accountId, apiToken, scriptName = "", now = new Date(), timeoutMs = 8_000 } = {}) {
  const accountTag = String(accountId || "").trim();
  const token = String(apiToken || "").trim();
  const script = String(scriptName || "").trim();
  if (!/^[a-f0-9]{32}$/i.test(accountTag) || token.length < 20 || !/^[A-Za-z0-9_-]{1,128}$/.test(script)) {
    return { ok: false, reason: "CLOUDFLARE_ANALYTICS_CREDENTIALS_MISSING" };
  }
  const current = now instanceof Date ? now : new Date(now);
  if (!Number.isFinite(current.getTime())) return { ok: false, reason: "INVALID_TIME" };
  const start = new Date(Date.UTC(current.getUTCFullYear(), current.getUTCMonth(), current.getUTCDate())).toISOString();
  const end = current.toISOString();
  // Account-wide numbers relate to the Free plan's aggregate cap; script numbers identify this Worker.
  const query = `query GetWorkersDailyUsage($accountTag: string, $datetimeStart: string, $datetimeEnd: string, $scriptName: string) {
    viewer {
      accounts(filter: {accountTag: $accountTag}) {
        accountWide: workersInvocationsAdaptive(limit: 10000, filter: {
          datetime_geq: $datetimeStart,
          datetime_leq: $datetimeEnd
        }) { sum { requests errors subrequests } }
        thisWorker: workersInvocationsAdaptive(limit: 10000, filter: {
          scriptName: $scriptName,
          datetime_geq: $datetimeStart,
          datetime_leq: $datetimeEnd
        }) { sum { requests errors subrequests } }
      }
    }
  }`;
  try {
    const response = await fetch("https://api.cloudflare.com/client/v4/graphql", {
      method: "POST",
      headers: {
        authorization: `Bearer ${token}`,
        accept: "application/json",
        "content-type": "application/json",
      },
      body: JSON.stringify({ query, variables: { accountTag, datetimeStart: start, datetimeEnd: end, scriptName: script } }),
      signal: AbortSignal.timeout(Math.max(1_000, Math.min(15_000, Number(timeoutMs) || 8_000))),
    });
    const payload = await response.json().catch(() => null);
    if (!response.ok || payload?.errors?.length || !payload?.data?.viewer?.accounts?.length) {
      return { ok: false, reason: `CLOUDFLARE_GRAPHQL_${response.status || "INVALID_RESPONSE"}` };
    }
    const account = payload.data.viewer.accounts[0];
    const sumBuckets = (buckets = []) => buckets.reduce((sum, bucket) => {
      sum.requests += Number(bucket.sum?.requests || 0);
      sum.errors += Number(bucket.sum?.errors || 0);
      sum.subrequests += Number(bucket.sum?.subrequests || 0);
      return sum;
    }, { requests: 0, errors: 0, subrequests: 0 });
    return {
      ok: true,
      account: sumBuckets(account.accountWide || []),
      worker: sumBuckets(account.thisWorker || []),
      from: start,
      to: end,
      fetchedAt: current.toISOString(),
    };
  } catch (error) {
    return { ok: false, reason: `CLOUDFLARE_ANALYTICS_NETWORK:${asText(error?.message || error).slice(0, 100)}` };
  }
}


// Forward Scheduler runtime implementation. The Worker entrypoint only validates
// incoming requests and delegates durable work to this runtime.
const BOT_API = "https://api.telegram.org/bot";
const BOT_FILE_API = "https://api.telegram.org/file/bot";
const TELEGRAM_TIMEOUT_MS = 12_000;
const DATABASE_DOWNLOAD_TIMEOUT_MS = 10_000;
const OUTBOUND_METHODS = new Set([
  "sendMessage", "forwardMessage", "copyMessage", "sendPhoto", "sendDocument",
  "sendVideo", "sendAudio", "sendVoice", "sendAnimation", "sendSticker",
  "sendLocation", "sendVenue", "sendContact", "sendDice", "sendPoll",
  "sendMediaGroup",
]);
function botTokenFrom(env) { return String(env?.EMBEDDED_BOT_TOKEN || env?.BOT_TOKEN || "").trim(); }
function validBotToken(env) { return /^\d{6,12}:[A-Za-z0-9_-]{25,}$/.test(botTokenFrom(env)); }
async function webhookSecret(botToken) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(`forward-scheduler-telegram-webhook:${botToken}`));
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}
function button(text, callbackData, style = "primary") { return makeKeyboardButton(text, callbackData, style); }

export function isGroup(chat) {
  return chat?.type === "group" || chat?.type === "supergroup";
}

export function isPrivate(chat) {
  return chat?.type === "private";
}

export function userDisplay(user = {}) {
  return user.first_name || user.username || String(user.id || "کاربر");
}

export async function readBodyTextLimited(response, maxBytes) {
  const declaredLength = Number(response.headers.get("content-length") || 0);
  if (Number.isFinite(declaredLength) && declaredLength > maxBytes) throw new Error("DATABASE_TOO_LARGE");
  if (!response.body) {
    const buffer = await response.arrayBuffer();
    if (buffer.byteLength > maxBytes) throw new Error("DATABASE_TOO_LARGE");
    return new TextDecoder("utf-8", { fatal: true }).decode(buffer);
  }
  const reader = response.body.getReader();
  const chunks = [];
  let total = 0;
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > maxBytes) {
        await reader.cancel("database size limit exceeded");
        throw new Error("DATABASE_TOO_LARGE");
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  const bytes = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return new TextDecoder("utf-8", { fatal: true }).decode(bytes);
}

export function defaultState() {
  return {
    db: null,
    dbUrl: null, // retained only for compatibility with existing v3 state
    dbFileName: null,
    dbHash: null,
    dbInstalledAt: null,
    dbManifest: null,
    resourceRegistry: {},
    pendingResourceCleanup: [],
    pendingResourceKeyCleanup: [],
    maintenanceNextAt: null,
    maintenanceCursor: null,
    security: { ownerId: null, ownerClaimedAt: null, ownerUsername: null, ownerDisplayName: null, credentialSource: "embedded-source" },
    webhookUrl: null,
    flow: null,
    forwardDraft: null,
    forwardTask: null,
    groupSettings: {},
    spam: {},
    warnings: {},
    rate: {},
    updateIds: [],
    quota: { day: utcDay(), publicRequests: 0, ownerRequests: 0, totalRequests: 0 },
    moduleOverrides: {},
    groupModuleOverrides: {},
    welcomeDedup: {},
    groups: {},
    groupUsage: {},
    blockedGroups: [],
    leftGroups: [],
    channels: [],
    admins: { global: [], byChat: {} },
    pendingVerifications: {},
    joinWindows: {},
    leaveWindows: {},
    reportQueue: [],
    broadcastDraft: null,
    broadcastQueue: null,
    migrationVersion: 5,
    migrationStatus: { version: 5, status: "pending" },
    pvUsers: {},
    knownMembers: {},
    tagOptOut: {},
    tagDrafts: {},
    tagCooldowns: {},
    botJoinState: {},
    securityAudit: [],
    securityAlerts: {},
    chatActivity: {},
    queueCursor: "",
  };
}

export function mergeState(value) {
  const base = defaultState();
  if (!value || typeof value !== "object" || Array.isArray(value)) return base;
  let forwardTask = value.forwardTask || null;
  // One-time compatibility bridge for the previous v2.x Durable Object state.
  if (!forwardTask && value.task?.active) {
    const old = value.task;
    forwardTask = {
      active: Boolean(old.active),
      sourceChatId: old.source_chat_id,
      sourceUsername: old.source_username || null,
      sourceTitle: old.source_title || "source",
      messageId: Number(old.message_id),
      targetChatId: old.target_chat_id,
      targetUsername: old.target_username || null,
      intervalMs: Number(old.interval_ms) || 10_000,
      remaining: old.mode === "auto" ? null : (old.remaining == null ? 1 : Number(old.remaining)),
      sent: Number(old.sent || 0),
      nextAt: Number(old.next_at || Date.now() + 1_000),
      failures: Number(old.consecutive_errors || 0),
      migratedFrom: "v2.x",
    };
  }
  return {
    ...base,
    ...value,
    forwardTask,
    groupSettings: value.groupSettings && typeof value.groupSettings === "object" && !Array.isArray(value.groupSettings) ? value.groupSettings : {},
    spam: value.spam && typeof value.spam === "object" && !Array.isArray(value.spam) ? value.spam : {},
    warnings: value.warnings && typeof value.warnings === "object" && !Array.isArray(value.warnings) ? value.warnings : {},
    rate: value.rate && typeof value.rate === "object" && !Array.isArray(value.rate) ? value.rate : {},
    quota: {
      ...base.quota,
      ...(value.quota && typeof value.quota === "object" && !Array.isArray(value.quota) ? value.quota : {}),
      day: /^\d{4}-\d{2}-\d{2}$/.test(String(value.quota?.day || "")) ? value.quota.day : utcDay(),
      publicRequests: Math.max(0, Math.floor(Number(value.quota?.publicRequests) || 0)),
      ownerRequests: Math.max(0, Math.floor(Number(value.quota?.ownerRequests) || 0)),
      totalRequests: Math.max(0, Math.floor(Number(value.quota?.totalRequests) || 0)),
    },
    moduleOverrides: value.moduleOverrides && typeof value.moduleOverrides === "object" && !Array.isArray(value.moduleOverrides)
      ? Object.fromEntries(Object.entries(value.moduleOverrides).filter(([key, flag]) => getFeatureModule(key) && typeof flag === "boolean")) : {},
    groups: value.groups && typeof value.groups === "object" && !Array.isArray(value.groups) ? value.groups : {},
    groupUsage: value.groupUsage && typeof value.groupUsage === "object" && !Array.isArray(value.groupUsage) ? value.groupUsage : {},
    groupModuleOverrides: value.groupModuleOverrides && typeof value.groupModuleOverrides === "object" && !Array.isArray(value.groupModuleOverrides)
      ? Object.fromEntries(Object.entries(value.groupModuleOverrides).slice(-500).map(([chatId, flags]) => [chatId, flags && typeof flags === "object" && !Array.isArray(flags)
        ? Object.fromEntries(Object.entries(flags).filter(([id, enabled]) => getFeatureModule(id) && typeof enabled === "boolean")) : {}])) : {},
    welcomeDedup: value.welcomeDedup && typeof value.welcomeDedup === "object" && !Array.isArray(value.welcomeDedup) ? value.welcomeDedup : {},
    blockedGroups: Array.isArray(value.blockedGroups) ? [...new Set(value.blockedGroups.map(String).filter((id) => /^-?\d{1,20}$/.test(id)))].slice(-2_000) : [],
    leftGroups: Array.isArray(value.leftGroups) ? [...new Set(value.leftGroups.map(String).filter((id) => /^-?\d{1,20}$/.test(id)))].slice(-2_000) : [],
    channels: Array.isArray(value.channels) ? value.channels.slice(0, 300) : [],
    admins: {
      global: Array.isArray(value.admins?.global) ? [...new Set(value.admins.global.map(String).filter((id) => /^\d{1,20}$/.test(id)))].slice(0, 500) : [],
      byChat: value.admins?.byChat && typeof value.admins.byChat === "object" && !Array.isArray(value.admins.byChat) ? value.admins.byChat : {},
    },
    pendingVerifications: value.pendingVerifications && typeof value.pendingVerifications === "object" && !Array.isArray(value.pendingVerifications) ? value.pendingVerifications : {},
    joinWindows: value.joinWindows && typeof value.joinWindows === "object" && !Array.isArray(value.joinWindows) ? value.joinWindows : {},
    leaveWindows: value.leaveWindows && typeof value.leaveWindows === "object" && !Array.isArray(value.leaveWindows) ? value.leaveWindows : {},
    reportQueue: Array.isArray(value.reportQueue) ? value.reportQueue.slice(-100) : [],
    broadcastDraft: value.broadcastDraft && typeof value.broadcastDraft === "object" ? value.broadcastDraft : null,
    broadcastQueue: value.broadcastQueue && typeof value.broadcastQueue === "object" ? value.broadcastQueue : null,
    updateIds: Array.isArray(value.updateIds) ? value.updateIds.filter((id) => Number.isSafeInteger(id) && id >= 0).slice(-4_096) : [],
    resourceRegistry: value.resourceRegistry && typeof value.resourceRegistry === "object" && !Array.isArray(value.resourceRegistry) ? value.resourceRegistry : {},
    pendingResourceCleanup: Array.isArray(value.pendingResourceCleanup) ? [...new Set(value.pendingResourceCleanup.filter((id) => typeof id === "string" && /^[a-z][a-z0-9_-]{1,47}$/.test(id)))].slice(0, 96) : [],
    pendingResourceKeyCleanup: Array.isArray(value.pendingResourceKeyCleanup)
      ? [...new Set(value.pendingResourceKeyCleanup.filter((key) => typeof key === "string" && /^dbres:v2:[a-z][a-z0-9_-]{1,47}:item:.{1,4096}$/.test(key)))].slice(0, 50_000)
      : [],
    maintenanceNextAt: Number.isFinite(Number(value.maintenanceNextAt)) && Number(value.maintenanceNextAt) > 0 ? Number(value.maintenanceNextAt) : null,
    maintenanceCursor: typeof value.maintenanceCursor === "string" ? value.maintenanceCursor.slice(0, 512) : null,
    security: {
      ...base.security,
      ...(value.security && typeof value.security === "object" && !Array.isArray(value.security) ? value.security : {}),
      ownerId: /^\d{1,20}$/.test(String(value.security?.ownerId || "")) ? String(value.security.ownerId) : null,
    },
    flow: value.flow === "database_url" ? "database_upload" : (typeof value.flow === "string" ? value.flow.slice(0, 40) : null),
    dbFileName: typeof value.dbFileName === "string" ? value.dbFileName.slice(0, 128) : null,
    dbHash: typeof value.dbHash === "string" && /^[a-f0-9]{64}$/i.test(value.dbHash) ? value.dbHash : null,
    migrationVersion: Math.max(0, Math.floor(Number(value.migrationVersion) || 0)),
    migrationStatus: value.migrationStatus && typeof value.migrationStatus === "object" ? value.migrationStatus : base.migrationStatus,
    pvUsers: value.pvUsers && typeof value.pvUsers === "object" && !Array.isArray(value.pvUsers) ? Object.fromEntries(Object.entries(value.pvUsers).slice(-2_000)) : {},
    knownMembers: value.knownMembers && typeof value.knownMembers === "object" && !Array.isArray(value.knownMembers) ? Object.fromEntries(Object.entries(value.knownMembers).slice(-500).map(([chatId, members]) => [chatId, Array.isArray(members) ? members.slice(-300) : []])) : {},
    tagOptOut: value.tagOptOut && typeof value.tagOptOut === "object" && !Array.isArray(value.tagOptOut) ? value.tagOptOut : {},
    tagDrafts: value.tagDrafts && typeof value.tagDrafts === "object" && !Array.isArray(value.tagDrafts) ? Object.fromEntries(Object.entries(value.tagDrafts).slice(-100)) : {},
    tagCooldowns: value.tagCooldowns && typeof value.tagCooldowns === "object" && !Array.isArray(value.tagCooldowns) ? Object.fromEntries(Object.entries(value.tagCooldowns).slice(-500)) : {},
    botJoinState: value.botJoinState && typeof value.botJoinState === "object" && !Array.isArray(value.botJoinState) ? Object.fromEntries(Object.entries(value.botJoinState).slice(-500)) : {},
    securityAudit: Array.isArray(value.securityAudit) ? value.securityAudit.slice(-500) : [],
    securityAlerts: value.securityAlerts && typeof value.securityAlerts === "object" && !Array.isArray(value.securityAlerts) ? value.securityAlerts : {},
    chatActivity: value.chatActivity && typeof value.chatActivity === "object" && !Array.isArray(value.chatActivity) ? value.chatActivity : {},
    queueCursor: typeof value.queueCursor === "string" ? value.queueCursor.slice(0, 80) : "",
  };
}

export function getPath(object, path, fallback = "") {
  let current = object;
  for (const part of path.split(".")) current = current?.[part];
  return current == null ? fallback : current;
}

export class ForwardSchedulerRuntime {
  constructor(ctx, env) {
    this.ctx = ctx;
    this.env = env;
    this.serial = Promise.resolve();
    this.outboundAt = new Map();
    this.answerCache = new Map();
    this.adminCache = new Map();
    this.telegramCache = new Map();
  }

  #exclusive(operation) {
    const run = async () => {
      this.pendingState = null;
      try {
        return await operation();
      } finally {
        // Coalesce every state mutation made during one webhook/alarm into a single SQLite row write.
        const pending = this.pendingState;
        this.pendingState = null;
        if (pending) await this.ctx.storage.put("state", pending);
      }
    };
    const next = this.serial.then(run, run);
    this.serial = next.catch(() => {});
    return next;
  }

  async #load() {
    // Within one serialized alarm/webhook, always build on the newest in-memory
    // pending snapshot. Reading the persisted row between batched updates would
    // otherwise overwrite earlier mutations before the coalesced commit.
    if (this.pendingState) return this.pendingState;
    const raw = await this.ctx.storage.get("state");
    let state = mergeState(raw);
    const backup = await this.ctx.storage.get("database:backup:v5");
    if (backup && state.dbHash !== backup.targetHash && backup.previous && typeof backup.previous === "object") {
      state = mergeState({ ...state, ...backup.previous });
      await this.ctx.storage.put("state", state);
      await this.ctx.storage.delete("database:backup:v5");
    } else if (backup && state.dbHash === backup.targetHash) {
      await this.ctx.storage.delete("database:backup:v5");
    }
    if (raw && state.migrationVersion < 5) {
      const backupKey = "migration:state-backup:v5";
      if (!(await this.ctx.storage.get(backupKey))) {
        await this.ctx.storage.put(backupKey, { savedAt: Date.now(), fromVersion: state.migrationVersion || 4, state: raw });
      }
      state.migrationVersion = 5;
      state.migrationStatus = { version: 5, status: "completed", completedAt: Date.now(), sourceVersion: state.migrationStatus?.sourceVersion || 4 };
      await this.ctx.storage.put("state", state);
    } else if (!raw) {
      state.migrationVersion = 5;
      state.migrationStatus = { version: 5, status: "initialized", completedAt: Date.now() };
      await this.ctx.storage.put("state", state);
    }
    return state;
  }

  async #save(state) {
    // The enclosing serialized operation flushes this state once before returning.
    this.pendingState = state;
    return true;
  }

  #ownerId(state) {
    return String(state?.security?.ownerId || "");
  }

  #db(state) {
    return state?.db && typeof state.db === "object" && !Array.isArray(state.db) ? state.db : null;
  }

  #featureEnabled(state, id, chatId = null) {
    // A global OFF is authoritative; per-group overrides can only narrow an ON module.
    const globallyEnabled = isModuleEnabled(this.#db(state), state.moduleOverrides, id);
    if (!globallyEnabled) return false;
    const local = chatId == null ? undefined : state?.groupModuleOverrides?.[String(chatId)]?.[id];
    return typeof local === "boolean" ? local : true;
  }

  #reserveWebhookRequest(state, actorId = "", bootstrapCandidate = false) {
    const ownerRequest = this.#isOwner(actorId, state) || (!this.#ownerId(state) && bootstrapCandidate);
    const reservation = reserveSplitQuota(state.quota, ownerRequest);
    state.quota = reservation.quota;
    return reservation;
  }

  #text(state, key, fallback = "") {
    return asText(getPath(this.#db(state)?.texts, key, fallback)) || fallback;
  }

  #isOwner(userId, state) {
    const ownerId = this.#ownerId(state);
    return Boolean(ownerId) && String(userId ?? "") === ownerId;
  }

  #isOperator(userId, chatId, db, state) {
    // Durable database role declarations are not proof of Telegram administrator status.
    // The caller must additionally use #isTelegramAdmin for live status verification.
    return this.#isOwner(userId, state);
  }

  async #telegram(state, method, payload = {}, options = {}) {
    const botToken = botTokenFrom(this.env);
    if (typeof botToken !== "string" || !/^\d{6,12}:[A-Za-z0-9_-]{25,}$/.test(botToken)) {
      return { ok: false, error_code: 401, description: "EMBEDDED_BOT_TOKEN_INVALID" };
    }

    if (!options.bypassLocalRate && OUTBOUND_METHODS.has(method)) {
      const chatId = String(payload.chat_id ?? "");
      const limits = this.#db(state)?.limits || {};
      const ownerPrivateChat = !options.group && chatId === this.#ownerId(state);
      const fallbackInterval = options.group ? 3_500 : ownerPrivateChat ? 1_000 : 1_100;
      const configuredInterval = options.minIntervalMs ?? (
        options.group ? limits.groupSendIntervalMs
          : ownerPrivateChat ? limits.ownerSendIntervalMs
            : limits.chatSendIntervalMs
      ) ?? fallbackInterval;
      const interval = clampNumber(configuredInterval, fallbackInterval, 1_000, 4_000);
      const now = Date.now();
      const last = Number(this.outboundAt.get(chatId) || 0);
      const waitMs = Math.max(0, interval - (now - last));
      if (waitMs > 0) {
        // Interactive replies are delayed instead of silently dropped. Scheduled forwards
        // return a retry hint so the alarm can reschedule without holding a long invocation.
        if (method === "sendMessage") {
          await new Promise((resolve) => setTimeout(resolve, Math.min(waitMs, 4_000)));
        } else {
          return {
            ok: false,
            error_code: 429,
            description: "LOCAL_ANTI_SPAM_RATE_LIMIT",
            parameters: { retry_after: Math.ceil(waitMs / 1_000) },
          };
        }
      }
      this.outboundAt.set(chatId, Date.now());
      if (this.outboundAt.size > 512) {
        for (const [key, stamp] of this.outboundAt) {
          if (now - stamp > 60_000) this.outboundAt.delete(key);
          if (this.outboundAt.size <= 384) break;
        }
      }
    }

    const cacheable = ["getMe", "getChatMember", "getChatMemberCount"].includes(method);
    const cacheKey = cacheable ? `${method}:${JSON.stringify(payload)}` : "";
    const cached = cacheable ? this.telegramCache.get(cacheKey) : null;
    if (cached && cached.expiresAt > Date.now()) return cached.value;
    try {
      let data = null;
      for (let attempt = 0; attempt <= 1; attempt += 1) {
        const response = await fetch(`${BOT_API}${botToken}/${method}`, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(payload),
          signal: AbortSignal.timeout(TELEGRAM_TIMEOUT_MS),
        });
        data = await response.json().catch(() => null);
        const retryAfter = Number(data?.parameters?.retry_after || 0);
        if ((response.status === 429 || data?.error_code === 429) && attempt === 0 && options.retry429 !== false) {
          // Do not retry earlier than Telegram's requested cooldown. Long delays are
          // surfaced to the durable scheduler instead of holding a Worker invocation.
          if (retryAfter > 8) break;
          const delay = Math.max(retryAfter * 1_000, 500 * (2 ** attempt)) + Math.floor(Math.random() * 250);
          await new Promise((resolve) => setTimeout(resolve, delay));
          continue;
        }
        if (!data || typeof data !== "object") data = { ok: false, error_code: response.status || 502, description: "INVALID_TELEGRAM_RESPONSE" };
        break;
      }
      if (data?.ok && cacheable) {
        const ttl = method === "getMe" ? 6 * 60 * 60_000 : method === "getChatMemberCount" ? 60_000 : 20_000;
        this.telegramCache.set(cacheKey, { value: data, expiresAt: Date.now() + ttl });
        if (this.telegramCache.size > 1_000) {
          for (const [key, entry] of this.telegramCache) if (entry.expiresAt <= Date.now()) this.telegramCache.delete(key);
          while (this.telegramCache.size > 800) this.telegramCache.delete(this.telegramCache.keys().next().value);
        }
      }
      return data || { ok: false, error_code: 502, description: "INVALID_TELEGRAM_RESPONSE" };
    } catch (error) {
      const safeError = asText(error?.message || error)
        .replaceAll(botToken, "[redacted]")
        .replace(/https?:\/\/api\.telegram\.org\/[^\s]+/gi, "[telegram-api-url]")
        .slice(0, 120);
      return { ok: false, description: `NETWORK_ERROR:${safeError}` };
    }
  }

  async #send(chatId, text, state, extra = {}, options = {}) {
    if (chatId == null || String(chatId).trim() === "") return { ok: false, error_code: 400, description: "CHAT_ID_MISSING" };
    const body = String(text ?? "").slice(0, 4_000);
    if (!body) return { ok: false, description: "EMPTY_MESSAGE" };
    return this.#telegram(state, "sendMessage", {
      chat_id: chatId,
      text: body,
      link_preview_options: { is_disabled: true },
      ...extra,
    }, options);
  }

  async #reply(message, text, state) {
    const chat = message.chat || {};
    return this.#send(chat.id, text, state, { reply_parameters: { message_id: message.message_id, allow_sending_without_reply: true } }, { group: isGroup(chat) });
  }

  async #answerCallback(callbackId, text = "") {
    if (!callbackId) return;
    const payload = { callback_query_id: callbackId };
    if (text) payload.text = String(text).slice(0, 180);
    await this.#telegram(null, "answerCallbackQuery", payload, { bypassLocalRate: true });
  }

  #ownerKeyboard(state) {
    const db = this.#db(state);
    const rows = [
      [button(this.#text(state, "ui.forward", "📨 زمان‌بندی فوروارد"), "forward:new", "primary")],
      ...(state.forwardTask?.active ? [[button(this.#text(state, "ui.stopForward", "⏹ توقف فوروارد"), "forward:stop", "danger")]] : []),
      [button("🧩 مدیریت قابلیت‌ها", "author:modules:0", "primary")],
      [button("👥 گروه‌ها", "author:groups:0", "success"), button("📢 کانال‌ها", "author:channels:0", "primary")],
      [button("👤 PVهای ثبت‌شده", "author:pvs:0", "primary"), button("🛡 گزارش امنیتی", "author:security:0", "danger")],
      [button("📤 بارگذاری دیتابیس", "db:install", "success"), button("🗑 حذف دیتابیس", "db:delete", "danger")],
    ];
    if (!db) rows.splice(0, rows.length, [button("📥 نصب دیتابیس", "db:install", "success")]);
    return { inline_keyboard: rows };
  }

  async #showStart(state, chatId, isOwner) {
    if (!this.#db(state)) {
      const bootstrap = isOwner
        ? "برای نصب یا جایگزینی دیتابیس، /installDB را بفرست و فایل database.js را مستقیماً به‌صورت Document آپلود کن.\n\nپنل مدیریتی مالک: /author"
        : "سلام! ربات هنوز راه‌اندازی نشده است.";
      await this.#send(chatId, bootstrap, state, isOwner ? { reply_markup: this.#ownerKeyboard(state) } : {});
      return;
    }
    const key = isOwner ? "startOwner" : "start";
    const greeting = this.#text(state, key, this.#text(state, "start", "سلام! خوش اومدی."));
    await this.#send(chatId, greeting, state, isOwner ? { reply_markup: this.#ownerKeyboard(state) } : {});
  }

  #databaseManifest(database) {
    return {
      schemaVersion: database.schemaVersion,
      version: String(database.version || "0"),
      capabilities: [...(database.runtime?.capabilities || [])],
      resources: (database.runtime?.resources || []).map((resource) => ({
        id: resource.id, type: resource.type, ttlSeconds: resource.ttlSeconds || 0,
        maxEntries: resource.maxEntries || 0, schema: resource.schema || 1, eviction: resource.eviction || "ring",
      })),
      maintenance: database.runtime?.maintenance || {},
    };
  }

  #resourcePrefix(resourceId) {
    return `dbres:v2:${resourceId}:`;
  }

  async #deleteResourcePrefixBatch(resourceId, maxDeletes = 256) {
    const prefixes = [this.#resourcePrefix(resourceId), `dbres:${resourceId}:`];
    let removed = 0;
    for (const prefix of prefixes) {
      while (removed < maxDeletes) {
        const limit = Math.min(128, maxDeletes - removed);
        const page = await this.ctx.storage.list({ prefix, limit });
        const keys = [...page.keys()];
        if (!keys.length) break;
        removed += await this.ctx.storage.delete(keys);
        if (keys.length < limit) break;
      }
      if (removed >= maxDeletes) return { removed, complete: false };
    }
    return { removed, complete: true };
  }

  async #reconcileDatabaseResources(state, database) {
    const desired = new Map((database?.runtime?.resources || []).map((item) => [item.id, item]));
    const previous = state.resourceRegistry || {};
    const next = {};
    const report = { created: 0, updated: 0, removed: 0, retained: 0 };

    // Resource ownership and bounded FIFO rings live in the single persisted state row.
    for (const [id, spec] of desired) {
      const old = previous[id];
      const schema = Number(spec.schema || 1);
      const capacity = Math.max(1, Number(spec.maxEntries || 1000));
      const schemaChanged = Boolean(old && (old.type !== spec.type || Number(old.schema || 1) !== schema));
      const resetResource = schemaChanged && spec.onSchemaChange === "reset";
      const oldRing = resetResource || !Array.isArray(old?.ring) ? [] : old.ring.slice();
      const excess = Math.max(0, oldRing.length - capacity);
      if (excess) {
        const staleKeys = oldRing.slice(0, excess).map((encoded) => `${this.#resourcePrefix(id)}item:${encoded}`);
        const queued = new Set(state.pendingResourceKeyCleanup || []);
        for (const key of staleKeys) queued.add(key);
        if (queued.size > 50_000) throw new Error("resource_cleanup_queue_capacity_exceeded");
        state.pendingResourceKeyCleanup = [...queued];
      }
      const ring = oldRing.slice(-capacity);
      const normalized = {
        id, type: spec.type, ttlSeconds: Number(spec.ttlSeconds || 0),
        maxEntries: capacity, schema,
        eviction: spec.eviction || "ring",
        ring,
        entryCount: ring.length,
        cursor: resetResource ? 0 : Number(old?.cursor || 0) % capacity,
        createdAt: old?.createdAt || Date.now(), updatedAt: Date.now(),
      };
      if (!old) report.created += 1;
      else if (schemaChanged) {
        if (resetResource) state.pendingResourceCleanup.push(id);
        report.updated += 1;
      } else report.retained += 1;
      next[id] = normalized;
    }

    for (const id of Object.keys(previous)) {
      if (!desired.has(id)) state.pendingResourceCleanup.push(id);
    }
    state.pendingResourceCleanup = [...new Set(state.pendingResourceCleanup)];
    state.resourceRegistry = next;
    state.maintenanceCursor = null;
    await this.#save(state);
    return report;
  }

  async #completeResourceCleanup(state, maxDeletes = 256) {
    let removed = 0;
    let processed = 0;

    // Exact-key cleanup is used when a resource capacity shrinks. Process bounded batches
    // and keep the ring authoritative, so stale entries are never returned or resurrected.
    const pendingKeys = [...(state.pendingResourceKeyCleanup || [])];
    const keyBatch = pendingKeys.slice(0, maxDeletes);
    if (keyBatch.length) {
      removed += await this.ctx.storage.delete(keyBatch);
      processed += keyBatch.length;
      state.pendingResourceKeyCleanup = pendingKeys.slice(keyBatch.length);
    }

    const pending = [...(state.pendingResourceCleanup || [])];
    while (pending.length && processed < maxDeletes) {
      const id = pending[0];
      const result = await this.#deleteResourcePrefixBatch(id, maxDeletes - processed);
      removed += result.removed;
      processed += result.removed;
      if (result.complete) pending.shift();
      else break;
    }
    state.pendingResourceCleanup = pending;
    if (pending.length || state.pendingResourceKeyCleanup.length) state.maintenanceNextAt = Date.now() + 15_000;
    await this.#save(state);
    return removed;
  }

  async #resourceGet(state, resourceId, key) {
    if ((state.pendingResourceCleanup || []).includes(resourceId)) return null;
    const spec = state.resourceRegistry?.[resourceId];
    if (!spec) return null;
    const safeKey = String(key).slice(0, 180);
    const encoded = encodeURIComponent(safeKey);
    if (!Array.isArray(spec.ring) || !spec.ring.includes(encoded)) return null;
    const storageKey = `${this.#resourcePrefix(resourceId)}item:${encoded}`;
    const entry = await this.ctx.storage.get(storageKey);
    if (!entry) return null;
    if (entry.expiresAt && entry.expiresAt <= Date.now()) {
      await this.ctx.storage.delete(storageKey);
      const ring = Array.isArray(spec.ring) ? spec.ring : [];
      const position = ring.indexOf(encoded);
      if (position >= 0) ring.splice(position, 1);
      spec.entryCount = ring.length;
      await this.#save(state);
      return null;
    }
    return entry.value ?? null;
  }

  async #resourcePut(state, resourceId, key, value, ttlSeconds = null) {
    if ((state.pendingResourceCleanup || []).includes(resourceId)) return false;
    const spec = state.resourceRegistry?.[resourceId];
    if (!spec) return false;
    const safeKey = String(key).slice(0, 180);
    const encoded = encodeURIComponent(safeKey);
    const prefix = this.#resourcePrefix(resourceId);
    const itemKey = `${prefix}item:${encoded}`;
    const now = Date.now();
    const requestedTtl = ttlSeconds == null ? Number(spec.ttlSeconds || 0) : Math.max(0, Number(ttlSeconds));
    const entry = { value, updatedAt: now, expiresAt: requestedTtl > 0 ? now + requestedTtl * 1000 : null };

    // The hot path is one item write. The ring is authoritative even if a prior
    // asynchronous cleanup left an orphaned storage value behind.
    const ring = Array.isArray(spec.ring) ? spec.ring : (spec.ring = []);
    const existingPosition = ring.indexOf(encoded);
    if (existingPosition < 0) {
      state.pendingResourceKeyCleanup = (state.pendingResourceKeyCleanup || []).filter((queuedKey) => queuedKey !== itemKey);
      const capacity = Math.max(1, Number(spec.maxEntries || 1000));
      if (ring.length < capacity) {
        ring.push(encoded);
      } else if (spec.eviction === "none") {
        return false;
      } else if (spec.eviction === "fifo") {
        const evicted = ring.shift();
        if (evicted && evicted !== encoded) await this.ctx.storage.delete(`${prefix}item:${evicted}`);
        ring.push(encoded);
      } else {
        const cursor = Number(spec.cursor || 0) % capacity;
        const evicted = ring[cursor];
        if (evicted && evicted !== encoded) await this.ctx.storage.delete(`${prefix}item:${evicted}`);
        ring[cursor] = encoded;
        spec.cursor = (cursor + 1) % capacity;
      }
      spec.entryCount = ring.length;
      spec.updatedAt = now;
      await this.#save(state);
    }

    await this.ctx.storage.put(itemKey, entry);
    return true;
  }

  async #sweepResources(state, now = Date.now()) {
    const runtime = this.#db(state)?.runtime || {};
    const maintenance = runtime.maintenance || {};
    const intervalMs = clampNumber(maintenance.sweepIntervalMinutes, 60, 5, 1_440) * 60_000;
    if (!state.resourceRegistry || !Object.keys(state.resourceRegistry).length) {
      state.maintenanceNextAt = null;
      state.maintenanceCursor = null;
      return 0;
    }
    if (state.maintenanceNextAt && state.maintenanceNextAt > now) return 0;

    const batchSize = clampNumber(maintenance.sweepBatchSize, 48, 8, 256);
    const maxDeletes = clampNumber(maintenance.maxDeletesPerRun, 96, 8, 512);
    const options = { prefix: "dbres:v2:", limit: batchSize };
    if (state.maintenanceCursor) options.startAfter = state.maintenanceCursor;
    const page = await this.ctx.storage.list(options);
    const entries = [...page.entries()];
    let removed = 0;

    for (const [key, entry] of entries) {
      state.maintenanceCursor = key;
      if (!key.includes(":item:") || !entry?.expiresAt || Number(entry.expiresAt) > now) continue;
      const match = key.match(/^dbres:v2:([a-z][a-z0-9_-]{1,47}):item:(.+)$/);
      if (!match) continue;
      const [, resourceId, encoded] = match;
      await this.ctx.storage.delete(key);
      const spec = state.resourceRegistry[resourceId];
      if (spec && Array.isArray(spec.ring)) {
        const position = spec.ring.indexOf(encoded);
        if (position >= 0) spec.ring.splice(position, 1);
        spec.entryCount = spec.ring.length;
      }
      removed += 1;
      if (removed >= maxDeletes) break;
    }

    if (entries.length < batchSize) state.maintenanceCursor = null;
    state.maintenanceNextAt = now + intervalMs;
    await this.#save(state);
    return removed;
  }

  async #installFromTelegramDocument(state, message) {
    const document = message?.document;
    const chatId = message?.chat?.id || this.#ownerId(state);
    const filename = asText(document?.file_name).replace(/[\u0000-\u001f\u007f]/g, "").slice(0, 128);
    if (!document?.file_id || filename.toLowerCase() !== "database.js") {
      await this.#send(chatId, "❌ نام فایل باید دقیقاً database.js باشد و فایل را به‌صورت Document ارسال کنی.", state);
      return;
    }
    const declaredSize = Number(document.file_size || 0);
    if (Number.isFinite(declaredSize) && declaredSize > MAX_DATABASE_BYTES) {
      await this.#send(chatId, `❌ حجم دیتابیس نباید بیشتر از ${MAX_DATABASE_BYTES} بایت باشد.`, state);
      return;
    }

    try {
      const fileInfo = await this.#telegram(state, "getFile", { file_id: document.file_id }, { bypassLocalRate: true });
      if (!fileInfo?.ok || !fileInfo.result?.file_path) {
        throw new Error(`TELEGRAM_GET_FILE_FAILED:${asText(fileInfo?.description || fileInfo?.error_code || "unknown")}`);
      }
      const filePath = String(fileInfo.result.file_path);
      if (!/^[A-Za-z0-9_./-]{1,512}$/.test(filePath)
        || filePath.split("/").some((part) => !part || part === "." || part === "..")) {
        throw new Error("TELEGRAM_FILE_PATH_INVALID");
      }
      const remoteSize = Number(fileInfo.result.file_size || declaredSize || 0);
      if (Number.isFinite(remoteSize) && remoteSize > MAX_DATABASE_BYTES) throw new Error("DATABASE_TOO_LARGE");

      const token = botTokenFrom(this.env);
      const response = await fetch(`${BOT_FILE_API}${token}/${filePath}`, {
        method: "GET",
        redirect: "manual",
        headers: { accept: "text/javascript, application/javascript, text/plain, application/octet-stream;q=0.9" },
        signal: AbortSignal.timeout(DATABASE_DOWNLOAD_TIMEOUT_MS),
      });
      if (response.status >= 300 && response.status < 400) throw new Error("DATABASE_DOWNLOAD_REDIRECT_REJECTED");
      if (!response.ok) throw new Error(`DATABASE_DOWNLOAD_HTTP_${response.status}`);
      const source = await readBodyTextLimited(response, MAX_DATABASE_BYTES);
      await this.#installDatabaseSource(state, source, filename);
    } catch (error) {
      const code = asText(error?.message || error);
      const reason = code === "DATABASE_TOO_LARGE" ? "حجم فایل از سقف مجاز بیشتر است."
        : code === "DATABASE_DOWNLOAD_REDIRECT_REJECTED" ? "نشانی دانلود به مقصد دیگری هدایت شد و به دلایل امنیتی رد شد."
          : code.startsWith("DATABASE_DOWNLOAD_HTTP_") ? "دریافت فایل از تلگرام موفق نبود. دوباره تلاش کن."
            : code.startsWith("TELEGRAM_GET_FILE_FAILED") ? "تلگرام نتوانست اطلاعات فایل را بازیابی کند."
              : code === "TELEGRAM_FILE_PATH_INVALID" ? "مسیر فایل دریافتی معتبر نبود."
                : "ساختار یا نسخهٔ دیتابیس معتبر نیست؛ فایل database.js را بررسی کن.";
      await this.#send(chatId, renderTemplate(this.#text(state, "install.failed", "❌ نصب دیتابیس انجام نشد: {reason}"), { reason }), state);
    }
  }

  async #installDatabaseSource(state, source, filename = "database.js") {
    let committed = false;
    let database = null;
    let resourceReport = { created: 0, updated: 0, removed: 0, retained: 0 };
    try {
      if (String(filename).toLowerCase() !== "database.js") throw new Error("DATABASE_FILENAME_INVALID");
      database = parseDatabaseModule(source);
      const sourceBytes = new TextEncoder().encode(String(source));
      const digest = await crypto.subtle.digest("SHA-256", sourceBytes);
      const databaseHash = [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
      const backupFields = ["db", "dbUrl", "dbFileName", "dbHash", "dbInstalledAt", "dbManifest", "resourceRegistry", "pendingResourceCleanup", "pendingResourceKeyCleanup", "maintenanceNextAt", "maintenanceCursor", "flow"];
      const previous = Object.fromEntries(backupFields.map((field) => [field, structuredClone(state[field])]));
      await this.ctx.storage.put("database:backup:v5", { targetHash: databaseHash, savedAt: Date.now(), previous });
      resourceReport = await this.#reconcileDatabaseResources(state, database);

      state.db = database;
      state.dbUrl = null;
      state.dbFileName = "database.js";
      state.dbHash = databaseHash;
      state.dbInstalledAt = Date.now();
      state.dbManifest = this.#databaseManifest(database);
      state.maintenanceNextAt = Date.now() + clampNumber(database.runtime?.maintenance?.sweepIntervalMinutes, 30, 5, 1_440) * 60_000;
      state.maintenanceCursor = null;
      state.flow = null;
      // Commit the new declarative database and remove its rollback marker atomically.
      await this.ctx.storage.transaction(async (txn) => {
        await txn.put("state", state);
        await txn.delete("database:backup:v5");
      });
      this.pendingState = null;
      committed = true;
    } catch (error) {
      if (!committed) {
        const backup = await this.ctx.storage.get("database:backup:v5");
        if (backup?.previous) {
          Object.assign(state, backup.previous);
          await this.ctx.storage.transaction(async (txn) => {
            await txn.put("state", state);
            await txn.delete("database:backup:v5");
          });
          this.pendingState = null;
        }
        const code = asText(error?.message || error);
        const reason = code === "DATABASE_TOO_LARGE" ? "حجم فایل از سقف مجاز بیشتر است."
          : code === "DATABASE_FILENAME_INVALID" ? "نام فایل باید دقیقاً database.js باشد."
            : code.startsWith("resource_") ? "ظرفیت منابع دیتابیس با محدودیت‌های ذخیره‌سازی سازگار نیست."
              : "ساختار، schema یا تنظیمات دیتابیس معتبر نیست؛ نسخهٔ قبلی حفظ شد.";
        console.error("Database installation rejected", code.slice(0, 100));
        await this.#send(this.#ownerId(state), renderTemplate(this.#text(state, "install.failed", "❌ نصب دیتابیس انجام نشد: {reason}"), { reason }), state);
      }
      return;
    }

    // Post-commit work is deliberately isolated: cleanup or Telegram notification
    // failures cannot falsely roll back a database that has already committed.
    let cleanupWarning = false;
    try {
      resourceReport.removed += await this.#completeResourceCleanup(state);
      await this.#scheduleNext(state);
    } catch (cleanupError) {
      cleanupWarning = true;
      console.error("Database post-commit maintenance deferred", asText(cleanupError?.message || cleanupError).slice(0, 120));
      state.maintenanceNextAt = Date.now() + 60_000;
      await this.#save(state);
    }
    const suffix = cleanupWarning || state.pendingResourceCleanup.length || state.pendingResourceKeyCleanup.length
      ? "\n⚠️ پاک‌سازی برخی منابع در صف اجرای مرحله‌ای قرار گرفت."
      : "";
    const message = renderTemplate(this.#text(state, "install.success", "✅ دیتابیس {version} نصب شد. قوانین: {rules}؛ حافظه‌ها: {created} ساخته، {updated} به‌روزرسانی، {removed} پاک‌سازی."), {
      version: database.version || "بدون نسخه",
      rules: database.features?.chatbot?.rules?.length || 0,
      created: resourceReport.created,
      updated: resourceReport.updated,
      removed: resourceReport.removed,
    });
    try {
      const notify = await this.#send(this.#ownerId(state), `${message}${suffix}`, state, { reply_markup: this.#ownerKeyboard(state) });
      if (!notify.ok) console.error("Database installed; owner notification was not delivered", notify.error_code || 0);
    } catch (notifyError) {
      console.error("Database installed; owner notification failed", asText(notifyError?.message || notifyError).slice(0, 100));
    }
  }

  async #refreshDatabase(state) {
    state.flow = "database_upload";
    await this.#save(state);
    await this.#send(this.#ownerId(state), this.#text(state, "install.prompt", "برای به‌روزرسانی، نسخهٔ جدید database.js را مستقیماً به‌صورت Document آپلود کن."), state);
  }

  async #deleteDatabase(state) {
    const deletedMessage = this.#text(state, "install.deleted", "🗑 دیتابیس حذف شد. منابع و حافظه‌های متعلق به دیتابیس نیز پاک‌سازی شدند. برای نصب دیتابیس جدید /installDB را بفرست.");
    const cleanup = await this.#reconcileDatabaseResources(state, null);
    state.db = null;
    state.dbManifest = null;
    state.dbUrl = null;
    state.dbFileName = null;
    state.dbHash = null;
    state.dbInstalledAt = null;
    state.maintenanceNextAt = null;
    state.maintenanceCursor = null;
    state.flow = null;
    state.forwardDraft = null;
    // Ownership, groups/channels/PVs, group settings, schedule history and security audit survive DB removal.
    await this.#save(state);
    cleanup.removed += await this.#completeResourceCleanup(state);
    state.resourceRegistry = {};
    await this.#save(state);
    await this.#scheduleNext(state);
    const pendingText = state.pendingResourceCleanup.length ? " پاک‌سازی بقیه منابع به‌صورت خودکار ادامه می‌یابد." : "";
    await this.#send(this.#ownerId(state), `${deletedMessage} (${cleanup.removed} مورد پاک‌سازی شد).${pendingText}`, state);
  }

  async #loadFlowPrompt(state, key, fallback) {
    await this.#send(this.#ownerId(state), this.#text(state, key, fallback), state);
  }

  async #beginForward(state) {
    if (!this.#db(state)) {
      await this.#send(this.#ownerId(state), "ابتدا دیتابیس را با /installDB نصب کن.", state);
      return;
    }
    if (!this.#featureEnabled(state, "forwarding")) {
      await this.#send(this.#ownerId(state), this.#text(state, "forward.disabled", "قابلیت فوروارد در دیتابیس غیرفعال شده است."), state);
      return;
    }
    if (state.forwardTask?.active) {
      await this.#send(this.#ownerId(state), this.#text(state, "forward.alreadyActive", "یک زمان‌بندی فعال است؛ ابتدا آن را از پنل متوقف کن."), state);
      return;
    }
    state.flow = "forward_source";
    state.forwardDraft = {};
    await this.#save(state);
    await this.#loadFlowPrompt(state, "forward.askSource", "لینک پست مبدأ را بفرست؛ نمونه: https://t.me/channel/123");
  }

  async #forwardFlowText(state, text) {
    const db = this.#db(state);
    const draft = state.forwardDraft || {};
    if (state.flow === "forward_source") {
      const parsed = parseMessageLink(text);
      if (!parsed) {
        await this.#loadFlowPrompt(state, "forward.badSource", "❌ لینک پیام معتبر نیست.");
        return;
      }
      const [sourceChatId, messageId] = parsed;
      const chat = await this.#telegram(state, "getChat", { chat_id: sourceChatId }, { bypassLocalRate: true });
      if (!chat.ok || !["channel", "group", "supergroup"].includes(chat.result?.type)) {
        await this.#loadFlowPrompt(state, "forward.sourceUnavailable", "ربات به کانال یا گروه مبدأ دسترسی ندارد یا لینک معتبر نیست.");
        return;
      }
      const me = await this.#telegram(state, "getMe", {}, { bypassLocalRate: true });
      const member = me.ok ? await this.#telegram(state, "getChatMember", { chat_id: chat.result.id, user_id: me.result.id }, { bypassLocalRate: true }) : { ok: false };
      if (!member.ok || ["left", "kicked"].includes(member.result?.status)) {
        await this.#loadFlowPrompt(state, "forward.joinSource", "ربات را به کانال مبدأ اضافه کن؛ سپس دوباره لینک را بفرست.");
        return;
      }
      if (chat.result.has_protected_content) {
        await this.#loadFlowPrompt(state, "forward.protected", "تلگرام فوروارد محتوای محافظت‌شده را مجاز نمی‌کند.");
        return;
      }
      draft.sourceChatId = chat.result.id;
      draft.sourceUsername = chat.result.username || null;
      draft.sourceTitle = chat.result.title || "کانال مبدأ";
      draft.messageId = messageId;
      state.forwardDraft = draft;
      state.flow = "forward_target";
      await this.#save(state);
      await this.#loadFlowPrompt(state, "forward.askTarget", "لینک یا @username کانال مقصد را بفرست.");
      return;
    }

    if (state.flow === "forward_target") {
      const username = parsePublicChannel(text);
      const targetRef = isTelegramId(text) ? text : (username ? `@${username}` : null);
      if (!targetRef) {
        await this.#loadFlowPrompt(state, "forward.badTarget", "❌ مقصد معتبر نیست؛ @username یا شناسه عددی گروه/کانال را بفرست.");
        return;
      }
      const target = await this.#telegram(state, "getChat", { chat_id: targetRef }, { bypassLocalRate: true });
      if (!target.ok || !["group", "supergroup"].includes(target.result?.type)) {
        await this.#loadFlowPrompt(state, "forward.targetUnavailable", "❌ مقصد باید گروه یا سوپرگروهی باشد که ربات به آن دسترسی دارد؛ انتشار در کانال غیرفعال است.");
        return;
      }
      if (String(target.result.id) === String(draft.sourceChatId)) {
        await this.#loadFlowPrompt(state, "forward.sameTarget", "❌ مبدأ و مقصد نمی‌توانند یکسان باشند.");
        return;
      }
      const me = await this.#telegram(state, "getMe", {}, { bypassLocalRate: true });
      const member = me.ok ? await this.#telegram(state, "getChatMember", { chat_id: target.result.id, user_id: me.result.id }, { bypassLocalRate: true }) : { ok: false };
      const isPresentInGroup = !["left", "kicked"].includes(member.result?.status);
      if (!member.ok || !isPresentInGroup) {
        await this.#loadFlowPrompt(state, "forward.targetPermission", "ربات باید عضو گروه مقصد باشد؛ انتشار مستقیم در کانال پشتیبانی نمی‌شود.");
        return;
      }
      draft.targetChatId = target.result.id;
      draft.targetUsername = target.result.username || null;
      draft.targetTitle = target.result.title || target.result.username || String(target.result.id);
      draft.targetType = "group";
      state.forwardDraft = draft;
      state.flow = "forward_interval";
      await this.#save(state);
      await this.#loadFlowPrompt(state, "forward.askInterval", "فاصله ارسال را به میلی‌ثانیه وارد کن؛ حداقل پیش‌فرض 10000 است.");
      return;
    }

    if (state.flow === "forward_interval") {
      const interval = parseIntervalInput(text);
      const limits = db?.forwarding || {};
      const minimum = clampNumber(limits.minIntervalMs, 10_000, 10_000, 3_600_000);
      const maximum = clampNumber(limits.maxIntervalMs, 31_536_000_000, minimum, 31_536_000_000);
      if (interval == null || interval < minimum || interval > maximum) {
        await this.#send(this.#ownerId(state), renderTemplate(this.#text(state, "forward.intervalInvalid", "فاصله باید بین {min} و {max} میلی‌ثانیه باشد."), { min: minimum, max: maximum }), state);
        return;
      }
      draft.intervalMs = interval;
      state.forwardDraft = draft;
      state.flow = "forward_count";
      await this.#save(state);
      await this.#loadFlowPrompt(state, "forward.askCount", "تعداد فوروارد را وارد کن؛ برای ادامه نامحدود بنویس: auto");
      return;
    }

    if (state.flow === "forward_count") {
      const normalized = normalizeText(text);
      const infinite = ["auto", "infinite", "نامحدود", "بی نهایت", "∞"].includes(normalized);
      const count = infinite ? null : parseIntervalInput(text);
      const maxCount = clampNumber(db?.forwarding?.maxCount, 100_000, 1, Number.MAX_SAFE_INTEGER);
      if (!infinite && (!count || count < 1 || count > maxCount)) {
        await this.#send(this.#ownerId(state), renderTemplate(this.#text(state, "forward.countInvalid", "تعداد باید بین 1 تا {max} یا auto باشد."), { max: maxCount }), state);
        return;
      }
      const now = Date.now();
      state.forwardTask = {
        active: true,
        sourceChatId: draft.sourceChatId,
        sourceUsername: draft.sourceUsername,
        sourceTitle: draft.sourceTitle,
        messageId: draft.messageId,
        targetChatId: draft.targetChatId,
        targetUsername: draft.targetUsername,
        targetTitle: draft.targetTitle || draft.targetUsername || String(draft.targetChatId),
        targetType: "group",
        intervalMs: draft.intervalMs,
        remaining: count,
        sent: 0,
        nextAt: now + 1_000,
        failures: 0,
      };
      state.forwardDraft = null;
      state.flow = null;
      await this.#save(state);
      await this.ctx.storage.setAlarm(now + 1_000);
      await this.#send(this.#ownerId(state), renderTemplate(this.#text(state, "forward.started", "🚀 زمان‌بندی فعال شد.\nمبدأ: {source}\nمقصد: {target}\nفاصله: {interval} ms\nتعداد: {count}"), {
        source: draft.sourceUsername ? `@${draft.sourceUsername}` : draft.sourceTitle,
        target: draft.targetUsername ? `@${draft.targetUsername}` : draft.targetTitle,
        interval: draft.intervalMs,
        count: infinite ? "نامحدود" : count,
      }), state, { reply_markup: { inline_keyboard: [[button(this.#text(state, "ui.stopForward", "⏹ توقف فوروارد"), "forward:stop", "danger")]] } });
    }
  }

  async #stopForward(state) {
    if (!state.forwardTask?.active) {
      await this.#send(this.#ownerId(state), this.#text(state, "forward.notActive", "زمان‌بندی فعالی وجود ندارد."), state);
      return;
    }
    state.forwardTask.active = false;
    state.forwardTask.stoppedAt = Date.now();
    await this.#save(state);
    await this.#scheduleNext(state);
    await this.#send(this.#ownerId(state), renderTemplate(this.#text(state, "forward.stopped", "⏹ فوروارد متوقف شد؛ ارسال موفق: {sent}"), { sent: state.forwardTask.sent }), state);
  }

  #authorHomeKeyboard() {
    return { inline_keyboard: [
      [button("🧩 روشن/خاموش قابلیت‌ها", "author:modules:0", "primary")],
      [button("👥 گروه‌ها", "author:groups:0", "success"), button("📢 کانال‌ها", "author:channels:0", "primary")],
      [button("👤 PVهای ثبت‌شده", "author:pvs:0", "primary"), button("🛡 گزارش امنیتی", "author:security:0", "danger")],
      [button("📣 پیام همگانی به گروه‌ها", "author:broadcast", "success")],
      [button("🔌 اتصال دوباره به تلگرام", "author:webhook", "primary")],
      [button("📖 راهنمای دستورات مالک", "author:help", "primary")],
    ] };
  }

  #modulePageKeyboard(state, page) {
    const pageData = paginateModules(page, 6);
    const rows = [];
    for (const module of pageData.items) {
      const enabled = this.#featureEnabled(state, module.id);
      rows.push([
        button(`ℹ️ ${module.title}`.slice(0, 64), `m5:view:${module.id}:${pageData.page}`, "primary"),
        button(`${enabled ? "🟢 روشن" : "🔴 خاموش"}`, `m5:toggle:${module.id}:${pageData.page}`, enabled ? "success" : "danger"),
      ]);
    }
    const navigation = [];
    if (pageData.hasPrevious) navigation.push(button("⬅️ صفحه قبل", `author:modules:${pageData.page - 1}`, "primary"));
    if (pageData.hasNext) navigation.push(button("صفحه بعد ➡️", `author:modules:${pageData.page + 1}`, "primary"));
    if (navigation.length) rows.push(navigation);
    return { inline_keyboard: rows };
  }

  #modulePageText(state, page) {
    const pageData = paginateModules(page, 6);
    const lines = pageData.items.map((module) => `${this.#featureEnabled(state, module.id) ? "🟢 روشن" : "🔴 خاموش"} — ${module.title}\n${module.description || module.category}`);
    return `🧩 راهنمای هوشمند و مدیریت ماژول‌ها\nصفحه ${pageData.page + 1} از ${pageData.totalPages}\nروی هر دکمه بزن تا همان قابلیت فوراً روشن/خاموش شود. وضعیت جدید ذخیره می‌شود.\n\n${lines.join("\n\n")}`;
  }

  #moduleDetailText(state, moduleId) {
    const descriptor = getFeatureModule(moduleId);
    if (!descriptor) return "قابلیت موردنظر شناخته نشد.";
    const enabled = this.#featureEnabled(state, moduleId);
    const config = getModuleConfig(this.#db(state), moduleId) || {};
    const settings = Object.entries(config).filter(([key]) => key !== "rules" && key !== "items" && key !== "responses")
      .slice(0, 18).map(([key, value]) => {
        let rendered;
        if (Array.isArray(value)) rendered = `فهرست (${value.length} مورد)`;
        else if (value && typeof value === "object") rendered = `تنظیمات (${Object.keys(value).length} کلید)`;
        else if (typeof value === "boolean") rendered = value ? "روشن" : "خاموش";
        else rendered = String(value).slice(0, 80);
        return `• ${key}: ${rendered}`;
      });
    return `🧩 ${descriptor.title}
وضعیت: ${enabled ? "🟢 روشن" : "🔴 خاموش"}
توضیح: ${descriptor.description}
مسیر تنظیمات: ${descriptor.settingsPath}
مجوز موردنیاز: ${descriptor.requiredPermission}
نوع اجرا: ${descriptor.executionType}

تنظیمات فعلی در دیتابیس:
${settings.join("\n") || "تنظیم اضافه‌ای ثبت نشده است."}`;
  }

  async #showModuleDetail(state, moduleId, page = 0, callback = null) {
    const descriptor = getFeatureModule(moduleId);
    if (!descriptor) {
      await this.#answerCallback(callback?.id, "این قابلیت در نسخهٔ فعلی وجود ندارد.");
      return;
    }
    const enabled = this.#featureEnabled(state, moduleId);
    const text = this.#moduleDetailText(state, moduleId);
    const replyMarkup = { inline_keyboard: [
      [button(enabled ? "🔴 خاموش‌کردن قابلیت" : "🟢 روشن‌کردن قابلیت", `m5:toggle:${moduleId}:${page}`, enabled ? "danger" : "success")],
      [button("↩️ بازگشت به فهرست قابلیت‌ها", `author:modules:${page}`, "secondary")],
      [button("↩️ پنل مالک", "author:home", "secondary")],
    ] };
    if (callback?.message?.chat?.id && callback?.message?.message_id) {
      const edited = await this.#telegram(state, "editMessageText", { chat_id: callback.message.chat.id, message_id: callback.message.message_id, text, reply_markup: replyMarkup }, { bypassLocalRate: true });
      if (edited.ok) return;
    }
    await this.#send(this.#ownerId(state), text, state, { reply_markup: replyMarkup });
  }

  async #showModulePage(state, page, callback = null) {
    const text = this.#modulePageText(state, page);
    const replyMarkup = this.#modulePageKeyboard(state, page);
    if (callback?.message?.chat?.id && callback?.message?.message_id) {
      const edited = await this.#telegram(state, "editMessageText", {
        chat_id: callback.message.chat.id,
        message_id: callback.message.message_id,
        text,
        reply_markup: replyMarkup,
      }, { bypassLocalRate: true });
      if (edited.ok) return;
    }
    await this.#send(this.#ownerId(state), text, state, { reply_markup: replyMarkup });
  }

  async #showGroupsPage(state, page = 0, callback = null) {
    const entries = Object.values(state.groups || {}).sort((a, b) => Number(b.lastSeenAt || 0) - Number(a.lastSeenAt || 0));
    const pageSize = 8;
    const totalPages = Math.max(1, Math.ceil(entries.length / pageSize));
    const current = Math.max(0, Math.min(totalPages - 1, Math.floor(Number(page) || 0)));
    const selected = entries.slice(current * pageSize, current * pageSize + pageSize);
    const lines = selected.map((group) => {
      const usage = Number(state.groupUsage?.[String(group.id)] || 0);
      const link = group.username ? `https://t.me/${group.username}` : (group.inviteLinkValid && group.inviteLink ? group.inviteLink : "لینک در دسترس نیست");
      const rights = group.rights || {};
      const access = Object.entries(rights).map(([key, value]) => `${key}:${value === true ? "بله" : value === false ? "خیر" : "نامشخص"}`).join("، ") || "نامشخص";
      return `• ${asText(group.title || group.id).slice(0, 70)}\n  لینک: ${link}\n  ID: ${group.id} | نوع: ${group.type || "نامشخص"}\n  وضعیت ربات: ${asText(group.botStatus || "نامشخص")}\n  اعضای گزارش‌شده توسط تلگرام: ${Number.isInteger(group.lastMemberCount) ? group.lastMemberCount : "نامشخص"}\n  Updateهای پردازش‌شده توسط ربات: ${usage}\n  مجوزهای واقعی: ${access}`;
    });
    const keyboard = [];
    for (const group of selected) keyboard.push([button(`🔎 ${asText(group.title || group.id).slice(0, 45)}`, `group:view:${group.id}`, "secondary")]);
    const nav = [];
    if (current > 0) nav.push(button("⬅️ صفحه قبل", `author:groups:${current - 1}`, "primary"));
    if (current < totalPages - 1) nav.push(button("صفحه بعد ➡️", `author:groups:${current + 1}`, "primary"));
    if (nav.length) keyboard.push(nav);
    keyboard.push([button("↩️ بازگشت به پنل مالک", "author:home", "secondary")]);
    const text = `👥 گروه‌های شناخته‌شده: ${entries.length}\nصفحه ${current + 1} از ${totalPages}\n\n${lines.join("\n\n") || "هنوز هیچ گروهی پیام یا رویدادی برای ربات نفرستاده است."}`;
    if (callback?.message?.chat?.id && callback?.message?.message_id) {
      const edited = await this.#telegram(state, "editMessageText", { chat_id: callback.message.chat.id, message_id: callback.message.message_id, text, reply_markup: { inline_keyboard: keyboard } }, { bypassLocalRate: true });
      if (edited.ok) return;
    }
    await this.#send(this.#ownerId(state), text, state, { reply_markup: { inline_keyboard: keyboard } });
  }

  async #showRegistryPage(state, type, page = 0, callback = null) {
    const pageSize = 8;
    let entries = [];
    let heading = "";
    if (type === "channels") {
      entries = [...(state.channels || [])].sort((a, b) => Number(b.lastSeenAt || 0) - Number(a.lastSeenAt || 0));
      heading = `📢 کانال‌های ثبت‌شده: ${entries.length}`;
    } else if (type === "pvs") {
      entries = Object.values(state.pvUsers || {}).sort((a, b) => Number(b.lastSeenAt || 0) - Number(a.lastSeenAt || 0));
      heading = `👤 کاربران خصوصی مشاهده‌شده: ${entries.length}`;
    } else if (type === "security") {
      entries = [...(state.securityAudit || [])].sort((a, b) => Number(b.at || 0) - Number(a.at || 0));
      heading = `🛡 رویدادهای امنیتی ثبت‌شده: ${entries.length}`;
    } else return;
    const totalPages = Math.max(1, Math.ceil(entries.length / pageSize));
    const current = Math.max(0, Math.min(totalPages - 1, Math.floor(Number(page) || 0)));
    const selected = entries.slice(current * pageSize, current * pageSize + pageSize);
    let lines = [];
    if (type === "channels") {
      lines = selected.map((item) => {
        const permissions = Object.entries(item.permissions || {}).map(([key, value]) => `${key}: ${value === true ? "بله" : value === false ? "خیر" : "نامشخص"}`).join("، ") || "نامشخص";
        return `• ${asText(item.title || item.id)}\nشناسه: ${item.id} | وضعیت: ${item.botStatus || "نامشخص"}\nلینک: ${item.username ? `https://t.me/${item.username}` : "خصوصی؛ لینک در دسترس نیست"}\nدسترسی‌های ثبت‌شده از API: ${permissions}`;
      });
    } else if (type === "pvs") {
      lines = selected.map((item) => {
        const name = [item.firstName, item.lastName].filter(Boolean).join(" ") || "کاربر";
        const username = item.username ? `@${item.username} (https://t.me/${item.username})` : "نام کاربری ثبت نشده";
        return `• ${name}\nنام کاربری: ${username}\nشناسه: ${item.id}\nآخرین مشاهده: ${new Date(Number(item.lastSeenAt || 0)).toLocaleString("fa-IR")}\nUpdateهای خصوصی پردازش‌شده: ${Number(item.updateCount || 0)}`;
      });
    } else {
      lines = selected.map((item) => `• ${item.kind || "هشدار"} | گروه: ${item.chatTitle || item.chatId || "نامشخص"} (${item.chatId || "—"})\nزمان: ${new Date(Number(item.at || 0)).toLocaleString("fa-IR")}\nعلت: ${item.reason || "نامشخص"} | رویدادها: ${Number(item.count || 1)}\nکاربران مشکوک: ${(item.userIds || []).join(", ") || "ثبت نشده"}\nاقدام واقعی: ${item.action || "بدون اقدام"}`);
    }
    const keyboard = [];
    const nav = [];
    if (current > 0) nav.push(button("⬅️ صفحه قبل", `author:${type}:${current - 1}`, "primary"));
    if (current < totalPages - 1) nav.push(button("صفحه بعد ➡️", `author:${type}:${current + 1}`, "primary"));
    if (nav.length) keyboard.push(nav);
    keyboard.push([button("↩️ بازگشت به پنل مالک", "author:home", "secondary")]);
    const text = `${heading}\nصفحه ${current + 1} از ${totalPages}\n\n${lines.join("\n\n") || "موردی ثبت نشده است."}`;
    if (callback?.message?.chat?.id && callback?.message?.message_id) {
      const edited = await this.#telegram(state, "editMessageText", { chat_id: callback.message.chat.id, message_id: callback.message.message_id, text, reply_markup: { inline_keyboard: keyboard } }, { bypassLocalRate: true });
      if (edited.ok) return;
    }
    await this.#send(this.#ownerId(state), text, state, { reply_markup: { inline_keyboard: keyboard } });
  }

  async #handleGroupControlCallback(state, callback) {
    const data = asText(callback.data);
    const chat = callback.message?.chat;
    if (!isGroup(chat)) {
      await this.#answerCallback(callback.id, "این دکمه فقط در همان گروه قابل استفاده است.");
      return;
    }
    const chatId = String(chat.id);
    const userId = String(callback.from?.id || "");
    const allowed = this.#isOwner(userId, state) || await this.#isTelegramAdmin(state, userId, chatId);
    if (!allowed) {
      await this.#answerCallback(callback.id, this.#text(state, "group.adminOnly", "این فرمان فقط برای مدیر واقعی گروه مجاز است."));
      return;
    }
    if (data.startsWith("group:bot:") || data.startsWith("g5:")) {
      const parts = data.split(":");
      const action = data.startsWith("g5:") ? parts[1] : parts[2];
      const targetChatId = data.startsWith("g5:") ? parts[2] : parts[3];
      if (String(targetChatId) !== chatId || !["on", "off"].includes(action)) {
        await this.#answerCallback(callback.id, "دکمه به گروه دیگری تعلق دارد.");
        return;
      }
      state.groupSettings[chatId] ||= {};
      state.groupSettings[chatId].botEnabled = action === "on";
      await this.#save(state);
      await this.#answerCallback(callback.id, action === "on" ? "پاسخ‌های ربات روشن شد." : "پاسخ‌های ربات خاموش شد.");
      await this.#send(chat.id, this.#text(state, action === "on" ? "group.botOn" : "group.botOff", action === "on" ? "✅ ربات روشن شد." : "🔕 پاسخ‌های عادی ربات خاموش شد."), state, {
        reply_markup: { inline_keyboard: [[button("🟢 روشن", `g5:on:${chatId}`, "success"), button("🔴 خاموش", `g5:off:${chatId}`, "danger")]] },
      }, { bypassLocalRate: true, group: true });
      return;
    }
    const parts = data.split(":");
    const action = data.startsWith("t5:") ? parts[1] : parts[1];
    const targetChatId = parts[2];
    const nonce = parts[3];
    const draft = state.tagDrafts?.[nonce];
    if (!draft || String(draft.chatId) !== chatId || String(targetChatId) !== chatId || Number(draft.expiresAt || 0) < Date.now()) {
      await this.#answerCallback(callback.id, "پیش‌نمایش تگ منقضی شده است؛ دوباره /tagall را اجرا کنید.");
      return;
    }
    if (String(draft.initiatorId) !== userId && !this.#isOwner(userId, state)) {
      await this.#answerCallback(callback.id, "این پیش‌نمایش را مدیر دیگری ساخته است.");
      return;
    }
    if (action === "cancel") {
      delete state.tagDrafts[nonce];
      await this.#save(state);
      await this.#answerCallback(callback.id, "ارسال تگ لغو شد.");
      return;
    }
    if (action !== "confirm") {
      await this.#answerCallback(callback.id, "درخواست نامعتبر است.");
      return;
    }
    const cooldown = clampNumber(this.#db(state)?.features?.tagKnownMembers?.cooldownSeconds, 300, 30, 86_400) * 1_000;
    if (Date.now() - Number(state.tagCooldowns[chatId] || 0) < cooldown) {
      await this.#answerCallback(callback.id, this.#text(state, "group.tagCooldown", "برای تگ‌کردن دوباره باید صبر کنید."));
      return;
    }
    const currentKnown = new Set((state.knownMembers[chatId] || []).filter((item) => !item.isBot && !state.tagOptOut[`${chatId}:${item.id}`]).map((item) => String(item.id)));
    const ids = (draft.ids || []).filter((id) => currentKnown.has(String(id))).slice(0, clampNumber(this.#db(state)?.features?.tagKnownMembers?.maxMembers, 80, 1, 200));
    if (!ids.length) {
      delete state.tagDrafts[nonce];
      await this.#save(state);
      await this.#answerCallback(callback.id, "کاربر قابل‌تگی باقی نمانده است.");
      return;
    }
    const known = new Map((state.knownMembers[chatId] || []).map((item) => [String(item.id), item]));
    const batchSize = clampNumber(this.#db(state)?.features?.tagKnownMembers?.batchSize, 8, 1, 12);
    let attempted = 0;
    for (let index = 0; index < ids.length; index += batchSize) {
      const batch = ids.slice(index, index + batchSize);
      const mentions = batch.map((id) => {
        const member = known.get(String(id)) || {};
        const name = [member.firstName, member.lastName].filter(Boolean).join(" ") || `کاربر ${id}`;
        const safeName = name.replace(/[&<>"]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;" }[char]));
        return `<a href="tg://user?id=${id}">${safeName}</a>`;
      }).join("، ");
      const result = await this.#send(chat.id, `👋 ${mentions}`, state, { parse_mode: "HTML" }, { bypassLocalRate: true, group: true });
      if (result.ok) attempted += batch.length;
      if (!result.ok) break;
    }
    state.tagCooldowns[chatId] = Date.now();
    delete state.tagDrafts[nonce];
    await this.#save(state);
    await this.#answerCallback(callback.id, `تلاش برای تگ ${attempted} عضو انجام شد.`);
    await this.#send(chat.id, renderTemplate(this.#text(state, "group.tagDone", "✅ تگ کاربران شناخته‌شده ارسال شد: {count}"), { count: attempted }), state, {}, { bypassLocalRate: true, group: true });
  }

  async #handleCaptchaCallback(state, callback) {
    const parts = asText(callback.data).split(":");
    const chatId = parts[1];
    const userId = parts[2];
    const nonce = parts[3];
    if (!callback.message?.chat || String(callback.message.chat.id) !== String(chatId) || !isGroup(callback.message.chat)) {
      await this.#answerCallback(callback.id, "درخواست تأیید به گروه معتبر متصل نیست.");
      return true;
    }
    if (String(callback.from?.id) !== userId) {
      await this.#answerCallback(callback.id, "این دکمه برای عضو دیگری است.");
      return true;
    }
    const key = `${chatId}:${userId}`;
    const pending = state.pendingVerifications?.[key];
    if (!pending || String(pending.nonce) !== nonce || Number(pending.expiresAt || 0) < Date.now()) {
      await this.#answerCallback(callback.id, "مهلت تأیید تمام شده است؛ دوباره وارد گروه شو یا از مدیر کمک بگیر.");
      return true;
    }
    const unrestricted = await this.#telegram(state, "restrictChatMember", {
      chat_id: chatId,
      user_id: Number(userId),
      permissions: {
        can_send_messages: true, can_send_audios: true, can_send_documents: true,
        can_send_photos: true, can_send_videos: true, can_send_video_notes: true,
        can_send_voice_notes: true, can_send_polls: true, can_send_other_messages: true,
        can_add_web_page_previews: true,
      },
      use_independent_chat_permissions: true,
    }, { bypassLocalRate: true });
    if (!unrestricted.ok) {
      await this.#answerCallback(callback.id, "تلگرام اجازه آزادسازی عضو را نداد؛ دسترسی مدیریتی ربات را بررسی کنید.");
      return true;
    }
    delete state.pendingVerifications[key];
    await this.#save(state);
    await this.#answerCallback(callback.id, "✅ تأیید شد؛ خوش آمدی!");
    if (callback.message?.chat?.id) {
      await this.#telegram(state, "editMessageText", {
        chat_id: callback.message.chat.id,
        message_id: callback.message.message_id,
        text: "✅ عضویت شما تأیید شد. خوش آمدید!",
      }, { bypassLocalRate: true });
    }
    return true;
  }

  async #handleCallback(state, callback) {
    const data = asText(callback.data);
    if (data.startsWith("captcha:")) {
      await this.#handleCaptchaCallback(state, callback);
      return;
    }
    if (data.startsWith("group:bot:") || data.startsWith("tag:") || data.startsWith("g5:") || data.startsWith("t5:")) {
      await this.#handleGroupControlCallback(state, callback);
      return;
    }
    const userId = callback.from?.id;
    if (!this.#isOwner(userId, state) || !isPrivate(callback.message?.chat)) {
      await this.#answerCallback(callback.id, this.#text(state, "access.denied", "این پنل فقط برای مالک ربات در گفت‌وگوی خصوصی است."));
      return;
    }
    await this.#answerCallback(callback.id);

    if (data === "author:home") {
      await this.#telegram(state, "editMessageText", {
        chat_id: callback.message.chat.id,
        message_id: callback.message.message_id,
        text: "👑 پنل مدیریت مالک\nاز این بخش قابلیت‌ها، گروه‌ها، کانال‌ها و پیام همگانی را مدیریت کن.",
        reply_markup: this.#authorHomeKeyboard(),
      }, { bypassLocalRate: true });
      return;
    }
    if (data.startsWith("author:modules:")) {
      await this.#showModulePage(state, Number(data.split(":")[2]), callback);
      return;
    }
    if (data.startsWith("m5:view:")) {
      const [, , moduleId, pageText] = data.split(":");
      await this.#showModuleDetail(state, moduleId, Number(pageText) || 0, callback);
      return;
    }
    if (data.startsWith("m5:toggle:") || data.startsWith("module:toggle:")) {
      const parts = data.split(":");
      const moduleId = data.startsWith("m5:") ? parts[2] : parts[2];
      const pageText = data.startsWith("m5:") ? parts[3] : parts[3];
      if (!getFeatureModule(moduleId)) return;
      state.moduleOverrides[moduleId] = !this.#featureEnabled(state, moduleId);
      const enabled = state.moduleOverrides[moduleId];
      if (moduleId === "chatter" && !enabled) {
        for (const groupState of Object.values(state.groupSettings || {})) {
          groupState.chatterEnabled = false;
          groupState.chatterNextAt = 0;
        }
      }
      if (moduleId === "forwarding" && !enabled && state.forwardTask?.active) {
        state.forwardTask.active = false;
        state.forwardTask.stoppedAt = Date.now();
      }
      if (["captcha", "raidProtection"].includes(moduleId) && !enabled) {
        for (const [key, pending] of Object.entries(state.pendingVerifications || {})) {
          const [chatId, userId] = key.split(":");
          await this.#telegram(state, "restrictChatMember", {
            chat_id: chatId, user_id: Number(userId),
            permissions: { can_send_messages: true, can_send_audios: true, can_send_documents: true, can_send_photos: true, can_send_videos: true, can_send_video_notes: true, can_send_voice_notes: true, can_send_polls: true, can_send_other_messages: true, can_add_web_page_previews: true },
            use_independent_chat_permissions: true,
          }, { bypassLocalRate: true });
          delete state.pendingVerifications[key];
        }
      }
      await this.#save(state);
      if (data.startsWith("m5:toggle:")) await this.#showModuleDetail(state, moduleId, Number(pageText) || 0, callback);
      else await this.#showModulePage(state, Number(pageText) || 0, callback);
      await this.#scheduleNext(state);
      return;
    }
    if (data.startsWith("author:groups:")) {
      await this.#showGroupsPage(state, Number(data.split(":")[2]), callback);
      return;
    }
    if (data === "author:webhook") {
      const result = await this.#setWebhook(state);
      await this.#send(this.#ownerId(state), result.ok
        ? "✅ اتصال وبهوک تلگرام با نشانی ثابت Worker بازتنظیم شد."
        : `❌ اتصال مجدد ناموفق بود: ${asText(result.reason || "خطای ناشناخته")}`, state, { reply_markup: this.#authorHomeKeyboard() });
      return;
    }
    if (data.startsWith("author:channels:") || data.startsWith("author:pvs:") || data.startsWith("author:security:")) {
      const [root, type, pageText] = data.split(":");
      await this.#showRegistryPage(state, type, Number(pageText) || 0, callback);
      return;
    }
    if (data === "author:channels") {
      await this.#showRegistryPage(state, "channels", 0, callback);
      return;
    }
    if (data === "author:broadcast") {
      state.flow = "broadcast_wait";
      await this.#save(state);
      await this.#send(this.#ownerId(state), "متن یا رسانه پیام همگانی را بفرست. قبل از ارسال به گروه‌ها، پیش‌نمایش و تأیید نهایی نمایش داده می‌شود.", state);
      return;
    }
    if (data === "author:help") {
      await this.#send(this.#ownerId(state), this.#ownerCommandHelp(), state, { reply_markup: this.#authorHomeKeyboard() });
      return;
    }
    if (data.startsWith("group:owner-toggle:") || data.startsWith("group:leave:") || data.startsWith("group:block:") || data.startsWith("group:restore:")) {
      const [scope, action, groupId] = data.split(":");
      const group = state.groups?.[groupId];
      if (!group || !/^-?\d{1,20}$/.test(groupId || "")) {
        await this.#send(this.#ownerId(state), "گروه موردنظر در فهرست موجود نیست.", state);
        return;
      }
      if (action === "owner-toggle") {
        state.groupSettings[groupId] ||= {};
        state.groupSettings[groupId].botEnabled = state.groupSettings[groupId].botEnabled === false;
        await this.#save(state);
      } else if (action === "leave" || action === "block") {
        const result = await this.#telegram(state, "leaveChat", { chat_id: groupId }, { bypassLocalRate: true });
        if (result.ok) {
          if (action === "block" && !state.blockedGroups.includes(groupId)) state.blockedGroups.push(groupId);
          if (!state.leftGroups.includes(groupId)) state.leftGroups.push(groupId);
          if (state.groups[groupId]) state.groups[groupId].botStatus = "left";
          await this.#save(state);
        } else {
          await this.#send(this.#ownerId(state), "خروج انجام نشد؛ دسترسی یا وضعیت گروه را بررسی کنید.", state);
        }
      } else if (action === "restore") {
        state.blockedGroups = state.blockedGroups.filter((id) => id !== groupId);
        state.leftGroups = state.leftGroups.filter((id) => id !== groupId);
        await this.#save(state);
      }
      const isOn = state.groupSettings?.[groupId]?.botEnabled !== false;
      await this.#send(this.#ownerId(state), `وضعیت گروه ${group.title || groupId}: ${isOn ? "روشن" : "خاموش"}.`, state, { reply_markup: { inline_keyboard: [[button("↩️ جزئیات گروه", `group:view:${groupId}`, "primary")], [button("↩️ پنل مالک", "author:home", "secondary")]] } });
      return;
    }
    if (data.startsWith("group:view:")) {
      const groupId = data.slice("group:view:".length);
      const group = state.groups?.[groupId];
      if (!group) {
        await this.#send(this.#ownerId(state), "این گروه دیگر در فهرست ذخیره‌شده وجود ندارد.", state);
        return;
      }
      const usage = Number(state.groupUsage?.[groupId] || 0);
      const isOn = state.groupSettings?.[groupId]?.botEnabled !== false;
      const link = group.username ? `https://t.me/${group.username}` : (group.inviteLinkValid && group.inviteLink ? group.inviteLink : "لینک در دسترس نیست");
      const rights = Object.entries(group.rights || {}).map(([key, value]) => `${key}: ${value === true ? "بله" : value === false ? "خیر" : "نامشخص"}`).join("\n");
      const text = `👥 ${group.title || groupId}\nشناسه: ${groupId}\nنوع: ${group.type || "نامشخص"}\nلینک: ${link}\nوضعیت عضویت ربات: ${group.botStatus || "نامشخص"}\nتعداد اعضای گزارش‌شده: ${Number.isInteger(group.lastMemberCount) ? group.lastMemberCount : "نامشخص"}\nUpdateهای یکتای پردازش‌شده: ${usage}\nوضعیت قابلیت‌های گروه: ${isOn ? "روشن" : "خاموش"}\nمجوزها:\n${rights || "نامشخص"}`;
      await this.#send(this.#ownerId(state), text, state, {
        reply_markup: { inline_keyboard: [
          [button(isOn ? "🔴 خاموش‌کردن گروه" : "🟢 روشن‌کردن گروه", `group:owner-toggle:${groupId}`, isOn ? "danger" : "success")],
          [button("🚪 خروج ربات", `group:leave:${groupId}`, "danger"), button("⛔ مسدودسازی", `group:block:${groupId}`, "danger")],
          [button("♻️ بازگردانی از مسدودها", `group:restore:${groupId}`, "success")],
          [button("↩️ فهرست گروه‌ها", "author:groups:0", "primary")], [button("↩️ پنل مالک", "author:home", "secondary")],
        ] },
      });
      return;
    }
    if (data === "broadcast:confirm") {
      if (!state.broadcastDraft) {
        await this.#send(this.#ownerId(state), "پیام آمادهٔ ارسال وجود ندارد.", state);
        return;
      }
      const targets = Object.keys(state.groups || {}).filter((id) => {
        const group = state.groups[id] || {};
        return !state.blockedGroups.includes(id) && !state.leftGroups.includes(id)
          && !["left", "kicked"].includes(String(group.botStatus || "").toLowerCase());
      });
      state.broadcastQueue = { ...state.broadcastDraft, chatIds: targets, index: 0, sent: 0, failed: 0, createdAt: Date.now() };
      state.broadcastDraft = null;
      state.flow = null;
      await this.#save(state);
      await this.#scheduleNext(state);
      await this.#send(this.#ownerId(state), `📣 پیام همگانی در صف قرار گرفت. مقصدها: ${targets.length}. ارسال به‌صورت نوبتی و با رعایت محدودیت تلگرام انجام می‌شود.`, state);
      return;
    }
    if (data === "broadcast:cancel") {
      state.broadcastDraft = null;
      state.flow = null;
      await this.#save(state);
      await this.#send(this.#ownerId(state), "ارسال همگانی لغو شد.", state, { reply_markup: this.#authorHomeKeyboard() });
      return;
    }

    switch (data) {
      case "db:install":
        state.flow = "database_upload";
        await this.#save(state);
        await this.#loadFlowPrompt(state, "install.prompt", "فایل database.js را مستقیماً به‌صورت Document ارسال کن.");
        break;
      case "db:reload":
        await this.#refreshDatabase(state);
        break;
      case "db:delete":
        await this.#send(this.#ownerId(state), this.#text(state, "install.confirmDelete", "حذف دیتابیس؟ این کار تنظیمات جاری را پاک می‌کند."), state, {
          reply_markup: { inline_keyboard: [[button("بله، حذف شود", "db:delete:yes", "danger"), button("لغو", "home", "primary")]] },
        });
        break;
      case "db:delete:yes":
        await this.#deleteDatabase(state);
        break;
      case "forward:new":
        await this.#beginForward(state);
        break;
      case "channel:post":
        await this.#send(this.#ownerId(state), "انتشار پست در کانال در این نسخه غیرفعال است.", state);
        break;
      case "forward:stop":
        await this.#stopForward(state);
        break;
      case "help":
        await this.#send(this.#ownerId(state), this.#ownerCommandHelp(), state, { reply_markup: this.#authorHomeKeyboard() });
        break;
      case "home":
        await this.#showStart(state, this.#ownerId(state), true);
        break;
      default:
        await this.#send(this.#ownerId(state), this.#text(state, "ui.unknown", "این گزینه شناخته نشد."), state);
    }
  }

  #ownerCommandHelp() {
    return [
      "👑 راهنمای دستورات مالک",
      "/author — پنل کامل مدیریت",
      "/installDB — نصب دیتابیس با ارسال مستقیم database.js",
      "/help groups — فهرست گروه‌ها و تعداد پیام‌های پردازش‌شده هر گروه",
      "/help left <chat_id> — خروج دائمی از گروه",
      "/help ban <chat_id> — مسدودسازی گروه و خروج",
      "/help unban <chat_id> — برداشتن مسدودیت داخلی گروه",
      "/help banlist — فهرست گروه‌های مسدود/ترک‌شده",
      "/help invite <chat_id> — ساخت لینک دعوت در صورت داشتن مجوز",
      "/help channel add <@username|id> — ثبت کانال",
      "/help channel remove <id> — حذف کانال از فهرست ربات",
      "/help channels — فهرست کانال‌ها",
      "/help addadmin <user_id> [chat_id] — افزودن مدیر ربات",
      "/help deladmin <user_id> [chat_id] — حذف مدیر ربات",
      "/help broadcast — آماده‌سازی پیام همگانی",
      "/help quota — آمار واقعی Cloudflare (در صورت تنظیم Analytics API) و سهمیه داخلی Updateها",
      "/help webhook — اتصال مجدد Webhook (فقط مالک)",
      "/help reports — مشاهده آخرین گزارش‌های تخلف",
      "/help reportclear — پاک‌کردن صف گزارش‌ها",
      "/help groupinfo <chat_id> — اطلاعات و مجوزهای یک گروه",
    ].join("\n");
  }

  async #isTelegramAdmin(state, userId, chatId) {
    if (this.#isOwner(userId, state)) return true;
    const key = `${chatId}:${userId}`;
    const cached = this.adminCache?.get(key);
    if (cached && cached.expiresAt > Date.now()) return cached.allowed;
    const result = await this.#telegram(state, "getChatMember", { chat_id: chatId, user_id: userId }, { bypassLocalRate: true });
    const allowed = Boolean(result.ok && ["creator", "administrator"].includes(result.result?.status));
    this.adminCache ||= new Map();
    this.adminCache.set(key, { allowed, expiresAt: Date.now() + 30_000 });
    if (this.adminCache.size > 1_000) {
      for (const [cacheKey, entry] of this.adminCache) if (entry.expiresAt <= Date.now()) this.adminCache.delete(cacheKey);
      while (this.adminCache.size > 800) this.adminCache.delete(this.adminCache.keys().next().value);
    }
    return allowed;
  }

  async #botPermission(state, chatId, permission) {
    const me = await this.#telegram(state, "getMe", {}, { bypassLocalRate: true });
    if (!me.ok || !me.result?.id) return null;
    const member = await this.#telegram(state, "getChatMember", { chat_id: chatId, user_id: me.result.id }, { bypassLocalRate: true });
    if (!member.ok || !member.result || !["creator", "administrator", "member", "restricted"].includes(member.result.status)) return null;
    if (member.result.status === "creator") return true;
    if (member.result.status !== "administrator") return false;
    return Object.hasOwn(member.result, permission) ? member.result[permission] === true : null;
  }

  async #securityAlert(state, details) {
    const chatId = String(details.chatId || "unknown");
    const kind = String(details.kind || "security").slice(0, 48);
    const key = `${chatId}:${kind}`;
    const now = Date.now();
    const settings = this.#db(state)?.features?.antiSpam || {};
    const cooldownMs = clampNumber(settings.reportCooldownSeconds, 300, 30, 86_400) * 1_000;
    const previous = state.securityAlerts[key] || {};
    const severity = clampNumber(details.severity, 1, 1, 5);
    const withinWindow = now - Number(previous.windowStartedAt || 0) <= cooldownMs;
    const accumulated = withinWindow ? Number(previous.eventCount || 0) + Number(details.count || 1) : Number(details.count || 1);
    const shouldSend = !previous.lastSentAt || now - Number(previous.lastSentAt) >= cooldownMs || severity > Number(previous.severity || 0);
    state.securityAlerts[key] = {
      windowStartedAt: withinWindow ? Number(previous.windowStartedAt) : now,
      eventCount: Math.min(100_000, accumulated),
      lastSentAt: shouldSend ? now : Number(previous.lastSentAt || 0),
      severity: Math.max(severity, shouldSend ? severity : Number(previous.severity || 0)),
      updatedAt: now,
    };
    const audit = {
      at: now, kind, chatId,
      chatTitle: asText(details.chatTitle || chatId).slice(0, 120),
      reason: asText(details.reason || kind).slice(0, 180),
      count: Math.min(100_000, Number(details.count || 1)),
      userIds: [...new Set((details.userIds || []).map(String))].slice(0, 30),
      action: asText(details.action || "بدون اقدام").slice(0, 100),
    };
    audit.reportedToOwner = shouldSend;
    state.securityAudit = [...(state.securityAudit || []), audit].slice(-500);
    // Keep alert keys bounded even when an attacker creates many chat/kind pairs.
    const alertEntries = Object.entries(state.securityAlerts || {});
    if (alertEntries.length > 1_000) {
      alertEntries.sort((a, b) => Number(a[1]?.updatedAt || 0) - Number(b[1]?.updatedAt || 0));
      for (const [staleKey] of alertEntries.slice(0, alertEntries.length - 800)) delete state.securityAlerts[staleKey];
    }
    if (shouldSend) {
      const owner = this.#ownerId(state);
      if (owner) {
        const userIds = audit.userIds.length ? audit.userIds.join(", ") : "ثبت نشده";
        await this.#send(owner,
          `🛡 گزارش امنیتی ${kind}
گروه: ${audit.chatTitle} (${chatId})
زمان: ${new Date(now).toLocaleString("fa-IR")}
علت قابل‌اندازه‌گیری: ${audit.reason}
تعداد رویدادها در بازه: ${state.securityAlerts[key].eventCount}
کاربران مشکوک: ${userIds}
اقدام واقعی: ${audit.action}`,
          state, {}, { bypassLocalRate: true });
      }
    }
    await this.#save(state);
    return { shouldSend, eventCount: state.securityAlerts[key].eventCount };
  }

  async #trackGroup(state, chat, botMember = null) {
    if (!isGroup(chat) || !chat.id) return;
    const id = String(chat.id);
    const old = state.groups[id] || {};
    if (!botMember && Date.now() - Number(old.rightsCheckedAt || 0) > 600_000) {
      const me = await this.#telegram(state, "getMe", {}, { bypassLocalRate: true });
      if (me.ok && me.result?.id) {
        const membership = await this.#telegram(state, "getChatMember", { chat_id: id, user_id: me.result.id }, { bypassLocalRate: true });
        if (membership.ok) botMember = membership.result;
      }
      old.rightsCheckedAt = Date.now();
    }
    const permissionMap = {
      canDeleteMessages: "can_delete_messages", canRestrictMembers: "can_restrict_members",
      canInviteUsers: "can_invite_users", canPinMessages: "can_pin_messages",
      canManageChat: "can_manage_chat", canManageVideoChats: "can_manage_video_chats",
      canChangeInfo: "can_change_info", canPostMessages: "can_post_messages",
      canEditMessages: "can_edit_messages", canPromoteMembers: "can_promote_members",
      canManageTopics: "can_manage_topics", canManageStories: "can_manage_stories",
    };
    const rights = botMember ? Object.fromEntries(Object.entries(permissionMap).map(([key, source]) => [key, Object.hasOwn(botMember, source) ? botMember[source] === true : null])) : (old.rights || {});
    state.groups[id] = {
      id,
      title: asText(chat.title || old.title || id).slice(0, 180),
      username: chat.username || old.username || null,
      type: chat.type || old.type || "supergroup",
      link: chat.username ? `https://t.me/${chat.username}` : (old.link || null),
      botStatus: botMember?.status || old.botStatus || "unknown",
      rights,
      rightsCheckedAt: botMember ? Date.now() : Number(old.rightsCheckedAt || 0),
      lastMemberCount: Number.isInteger(old.lastMemberCount) ? old.lastMemberCount : null,
      inviteLink: old.inviteLinkValid ? old.inviteLink : null,
      inviteLinkValid: old.inviteLinkValid === true,
      lastSeenAt: Date.now(),
      joinedAt: old.joinedAt || (botMember && !["left", "kicked"].includes(botMember.status) ? Date.now() : null),
    };
    if (Object.keys(state.groups).length > 500) {
      const candidates = Object.entries(state.groups)
        .filter(([groupId]) => !state.blockedGroups.includes(groupId) && !state.leftGroups.includes(groupId))
        .sort((a, b) => Number(a[1].lastSeenAt || 0) - Number(b[1].lastSeenAt || 0));
      for (const [oldId] of candidates.slice(0, Math.max(0, Object.keys(state.groups).length - 500))) {
        delete state.groups[oldId];
        delete state.groupUsage[oldId];
      }
    }
  }

  async #trackChannel(state, chat, botMember = null) {
    if (chat?.type !== "channel" || !chat.id) return;
    const id = String(chat.id);
    const old = state.channels.find((item) => String(item.id) === id) || {};
    if (!botMember || !Object.hasOwn(botMember, "status")) {
      const me = await this.#telegram(state, "getMe", {}, { bypassLocalRate: true });
      if (me.ok && me.result?.id) {
        const membership = await this.#telegram(state, "getChatMember", { chat_id: id, user_id: me.result.id }, { bypassLocalRate: true });
        if (membership.ok) botMember = membership.result;
      }
    }
    const rawPermissions = ["can_post_messages", "can_edit_messages", "can_delete_messages", "can_invite_users", "can_manage_chat", "can_change_info", "can_promote_members", "can_manage_video_chats", "can_post_stories", "can_edit_stories", "can_delete_stories"];
    const permissions = {};
    for (const key of rawPermissions) permissions[key] = botMember && Object.hasOwn(botMember, key) ? botMember[key] === true : null;
    const username = chat.username || old.username || null;
    const record = {
      id, title: asText(chat.title || old.title || id).slice(0, 180), username,
      link: username ? `https://t.me/${username}` : null,
      type: "channel", botStatus: botMember?.status || old.botStatus || "نامشخص",
      permissions, rightsCheckedAt: botMember ? Date.now() : Number(old.rightsCheckedAt || 0),
      lastSeenAt: Date.now(),
    };
    const index = state.channels.findIndex((item) => String(item.id) === id);
    if (index >= 0) state.channels[index] = record;
    else state.channels.unshift(record);
    state.channels = state.channels.slice(0, 300);
    await this.#save(state);
  }

  async #handleOwnerConsoleCommand(state, chat, args) {
    const action = String(args[0] || "").toLowerCase();
    const target = String(args[1] || "");
    const numericChatId = /^-?\d{1,20}$/.test(target);
    if (!action) {
      await this.#showModulePage(state, 0);
      return;
    }
    if (action === "groups") {
      await this.#showGroupsPage(state, 0);
      return;
    }
    if (action === "modules") {
      await this.#showModulePage(state, 0);
      return;
    }
    if (action === "banlist") {
      const ids = [...new Set([...(state.blockedGroups || []), ...(state.leftGroups || [])])];
      const lines = ids.map((id) => {
        const group = state.groups?.[id];
        const status = state.blockedGroups.includes(id) ? "مسدود" : "ترک‌شده دائمی";
        return `• ${group?.title || "گروه ناشناخته"} | ${id} | ${status}`;
      });
      await this.#send(chat.id, `📋 فهرست گروه‌های مسدود یا ترک‌شده (${ids.length})\n\n${lines.join("\n") || "فهرست خالی است."}`, state);
      return;
    }
    if (action === "reports") {
      const records = (state.reportQueue || []).slice(-25).reverse();
      const lines = records.map((item) => `• ${item.chatTitle} | ${item.chatId}\n  گزارش‌دهنده: ${item.reporterName} (${item.reporterId})\n  پیام: ${item.messageId} | ${item.text.slice(0, 180)}`);
      await this.#send(chat.id, `🚩 آخرین گزارش‌ها (${records.length})\n\n${lines.join("\n\n") || "گزارشی ثبت نشده است."}`, state);
      return;
    }
    if (action === "reportclear") {
      const count = (state.reportQueue || []).length;
      state.reportQueue = [];
      await this.#save(state);
      await this.#send(chat.id, `✅ صف گزارش‌ها پاک شد؛ ${count} مورد حذف شد.`, state);
      return;
    }
    if (action === "webhook") {
      const result = await this.#setWebhook(state);
      await this.#send(chat.id, result.ok ? "✅ اتصال Webhook به تلگرام بازتنظیم شد." : `❌ بازتنظیم Webhook ناموفق بود: ${asText(result.reason || result.description || "خطای نامشخص")}`, state);
      return;
    }
    if (["left", "ban", "unban", "invite", "groupinfo"].includes(action) && !numericChatId) {
      await this.#send(chat.id, `شناسه عددی گروه معتبر نیست. نمونه: /help ${action} -1001234567890`, state);
      return;
    }
    if (action === "left" || action === "ban") {
      const group = state.groups?.[target];
      if (action === "left" && !state.leftGroups.includes(target)) state.leftGroups.push(target);
      if (action === "ban" && !state.blockedGroups.includes(target)) state.blockedGroups.push(target);
      await this.#save(state);
      const leave = await this.#telegram(state, "leaveChat", { chat_id: target }, { bypassLocalRate: true });
      await this.#send(chat.id, `${action === "ban" ? "⛔ گروه در فهرست مسدودسازی داخلی ثبت شد" : "👋 خروج دائمی از گروه ثبت شد"}.\nگروه: ${group?.title || target}\nشناسه: ${target}\nنتیجه تلگرام: ${leave.ok ? "خروج انجام شد" : asText(leave.description || "عضویت قبلی/دسترسی قابل تأیید نیست")}`, state);
      return;
    }
    if (action === "unban") {
      state.blockedGroups = state.blockedGroups.filter((id) => id !== target);
      state.leftGroups = state.leftGroups.filter((id) => id !== target);
      await this.#save(state);
      await this.#send(chat.id, `✅ محدودیت داخلی گروه ${target} برداشته شد. برای بازگشت، ربات را دوباره به گروه اضافه کن.`, state);
      return;
    }
    if (action === "invite") {
      const group = state.groups?.[target];
      if (group?.username) {
        await this.#send(chat.id, `🔗 ${group.title || target}\nhttps://t.me/${group.username}`, state);
        return;
      }
      const result = await this.#telegram(state, "createChatInviteLink", { chat_id: target, name: "Bot owner invite" }, { bypassLocalRate: true });
      if (!result.ok || !result.result?.invite_link) {
        await this.#send(chat.id, `ساخت لینک ممکن نشد: ${asText(result.description || "ربات باید مجوز دعوت داشته باشد")}`, state);
        return;
      }
      if (group) {
        group.inviteLink = result.result.invite_link;
        group.inviteLinkValid = true;
        group.inviteLinkCreatedAt = Date.now();
      }
      await this.#save(state);
      await this.#send(chat.id, `🔗 لینک دعوت گروه:\n${result.result.invite_link}`, state);
      return;
    }
    if (action === "groupinfo") {
      const group = state.groups?.[target];
      if (!group) {
        await this.#send(chat.id, "گروه در فهرست ثبت‌شده پیدا نشد.", state);
        return;
      }
      const usage = Number(state.groupUsage?.[target] || 0);
      await this.#send(chat.id, `👥 ${group.title}\nID: ${target}\nنوع: ${group.type}\nلینک: ${group.link || "ندارد"}\nوضعیت ربات: ${group.botStatus}\nپیام‌های پردازش‌شده در این گروه: ${usage}\nدسترسی‌ها: ${JSON.stringify(group.rights || {})}`, state);
      return;
    }
    if (action === "channel" && String(args[1] || "").toLowerCase() === "add") {
      const reference = String(args[2] || "");
      if (!reference) {
        await this.#send(chat.id, "نمونه: /help channel add @channelusername", state);
        return;
      }
      const channel = await this.#telegram(state, "getChat", { chat_id: reference }, { bypassLocalRate: true });
      if (!channel.ok || channel.result?.type !== "channel") {
        await this.#send(chat.id, `کانال قابل دسترسی نیست: ${asText(channel.description || "شناسه نامعتبر")}`, state);
        return;
      }
      const me = await this.#telegram(state, "getMe", {}, { bypassLocalRate: true });
      const member = me.ok ? await this.#telegram(state, "getChatMember", { chat_id: channel.result.id, user_id: me.result.id }, { bypassLocalRate: true }) : { ok: false };
      if (!member.ok || !["creator", "administrator", "member", "restricted", "left", "kicked"].includes(member.result?.status)) {
        await this.#send(chat.id, "وضعیت عضویت ربات در کانال از تلگرام قابل تأیید نبود؛ کانال ثبت نشد.", state);
        return;
      }
      await this.#trackChannel(state, channel.result, member.result);
      const record = state.channels.find((item) => String(item.id) === String(channel.result.id));
      await this.#send(chat.id, `✅ کانال ثبت شد: ${record.title}\nشناسه: ${record.id}`, state);
      return;
    }
    if (action === "channel" && String(args[1] || "").toLowerCase() === "remove") {
      const channelId = String(args[2] || "");
      if (!/^-?\d{1,20}$/.test(channelId)) {
        await this.#send(chat.id, "نمونه: /help channel remove -1001234567890", state);
        return;
      }
      const before = state.channels.length;
      state.channels = state.channels.filter((item) => String(item.id) !== channelId);
      await this.#save(state);
      await this.#send(chat.id, state.channels.length < before ? `✅ کانال ${channelId} از فهرست ربات حذف شد.` : `ℹ️ کانال ${channelId} در فهرست نبود.`, state);
      return;
    }
    if (action === "channels") {
      const lines = state.channels.map((item) => `• ${item.title} | ${item.id} | ${item.username ? `@${item.username}` : "خصوصی"}`);
      await this.#send(chat.id, `📢 کانال‌های ثبت‌شده (${state.channels.length})\n\n${lines.join("\n") || "کانالی ثبت نشده است."}`, state);
      return;
    }
    if (action === "addadmin" || action === "deladmin") {
      const userId = String(args[1] || "");
      const groupId = String(args[2] || "");
      if (!/^\d{1,20}$/.test(userId)) {
        await this.#send(chat.id, `شناسه کاربر معتبر نیست. نمونه: /help ${action} 123456789 [chat_id]`, state);
        return;
      }
      if (groupId && !/^-?\d{1,20}$/.test(groupId)) {
        await this.#send(chat.id, "شناسه گروه معتبر نیست.", state);
        return;
      }
      const list = groupId ? (state.admins.byChat[groupId] ||= []) : state.admins.global;
      if (action === "addadmin" && !list.includes(userId)) list.push(userId);
      if (action === "deladmin") {
        const index = list.indexOf(userId);
        if (index >= 0) list.splice(index, 1);
      }
      await this.#save(state);
      await this.#send(chat.id, `${action === "addadmin" ? "✅ مدیر اضافه شد" : "✅ مدیر حذف شد"}: ${userId}${groupId ? ` در گروه ${groupId}` : " (سراسری)"}. مدیران منصوب‌شدهٔ مالک می‌توانند فرمان بدهند؛ خود ربات همچنان باید مجوز تلگرام لازم را داشته باشد.`, state);
      return;
    }
    if (action === "broadcast") {
      state.flow = "broadcast_wait";
      await this.#save(state);
      await this.#send(chat.id, "پیام همگانی را به شکل متن یا رسانه بفرست. پس از پیش‌نمایش، ارسال باید با دکمه تأیید شود.", state);
      return;
    }
    if (action === "quota") {
      const day = utcDay();
      if (state.quota.day !== day) state.quota = { day, publicRequests: 0, ownerRequests: 0, totalRequests: 0 };
      await this.#save(state);
      const native = await getCloudflareWorkersUsage({
        accountId: this.env.CLOUDFLARE_ACCOUNT_ID,
        apiToken: this.env.CLOUDFLARE_API_TOKEN,
        scriptName: this.env.CLOUDFLARE_SCRIPT_NAME || this.env.WORKER_NAME || "forwardfake",
      });
      const local = `\n\nسهمیه داخلی وبهوک همین ربات (شمارش دقیق Updateهای پذیرفته‌شده):\nعمومی: ${state.quota.publicRequests.toLocaleString("en-US")}/99,000\nمالک: ${state.quota.ownerRequests.toLocaleString("en-US")}/1,000\nمجموع: ${state.quota.totalRequests.toLocaleString("en-US")}/100,000\nبازنشانی داخلی: ${new Date(nextUtcMidnightMs()).toISOString()}`;
      if (native.ok) {
        await this.#send(chat.id, `☁️ آمار رسمی Cloudflare GraphQL (UTC امروز تا ${native.to})\nکل حساب: ${native.account.requests.toLocaleString("en-US")} درخواست | ${native.account.errors.toLocaleString("en-US")} خطا\nاین Worker (${this.env.CLOUDFLARE_SCRIPT_NAME || this.env.WORKER_NAME || "forwardfake"}): ${native.worker.requests.toLocaleString("en-US")} درخواست | ${native.worker.errors.toLocaleString("en-US")} خطا\nزیر‌درخواست‌های حساب: ${native.account.subrequests.toLocaleString("en-US")}\n\nاین داده از Analytics GraphQL کلودفلر خوانده شده؛ ممکن است با تأخیر آماری نمایش داده شود.${local}`, state);
      } else {
        await this.#send(chat.id, `⚠️ آمار رسمی Cloudflare در دسترس نیست (${native.reason}).\nبرای فعال‌سازی: Account ID را در CLOUDFLARE_ACCOUNT_ID قرار بده و API Token با مجوز Analytics:Read را در Secret با نام CLOUDFLARE_API_TOKEN ذخیره کن.\nتا آن زمان هیچ مصرف کلودفلری حدس زده نمی‌شود؛ فقط شمارندهٔ دقیق Updateهای همین ربات نشان داده می‌شود.${local}`, state);
      }
      return;
    }
    await this.#send(chat.id, this.#ownerCommandHelp(), state, { reply_markup: this.#authorHomeKeyboard() });
  }

  #rememberPvUser(state, user, updateId = null) {
    if (!user?.id || user.is_bot) return;
    const id = String(user.id);
    const old = state.pvUsers[id] || {};
    state.pvUsers[id] = {
      id,
      firstName: asText(user.first_name || old.firstName || "کاربر").slice(0, 100),
      lastName: asText(user.last_name || old.lastName || "").slice(0, 100),
      username: user.username || old.username || null,
      lastSeenAt: Date.now(),
      updateCount: Number(old.updateCount || 0) + 1,
      lastUpdateId: Number.isSafeInteger(updateId) ? updateId : old.lastUpdateId || null,
    };
    const ids = Object.keys(state.pvUsers);
    if (ids.length > clampNumber(this.#db(state)?.limits?.maxPvUsers, 2_000, 100, 5_000)) {
      ids.sort((a, b) => Number(state.pvUsers[a]?.lastSeenAt || 0) - Number(state.pvUsers[b]?.lastSeenAt || 0));
      for (const stale of ids.slice(0, ids.length - 1_800)) delete state.pvUsers[stale];
    }
  }

  #rememberKnownMember(state, chat, user) {
    if (!isGroup(chat) || !user?.id || user.is_bot) return;
    const chatId = String(chat.id);
    const max = clampNumber(this.#db(state)?.limits?.maxKnownMembersPerGroup, 300, 20, 1_000);
    const list = Array.isArray(state.knownMembers[chatId]) ? state.knownMembers[chatId] : [];
    const id = String(user.id);
    const existingIndex = list.findIndex((item) => String(item.id) === id);
    const entry = { id, firstName: asText(user.first_name || "کاربر").slice(0, 80), lastName: asText(user.last_name || "").slice(0, 80), username: user.username || null, isBot: Boolean(user.is_bot), lastSeenAt: Date.now() };
    if (existingIndex >= 0) list.splice(existingIndex, 1);
    list.push(entry);
    state.knownMembers[chatId] = list.slice(-max);
  }

  async #privateJoinMarkup(state) {
    const me = await this.#telegram(state, "getMe", {}, { bypassLocalRate: true });
    const username = asText(me?.result?.username).replace(/^@/, "");
    if (!me.ok || !/^[A-Za-z][A-Za-z0-9_]{4,31}$/.test(username)) return {};
    return { reply_markup: { inline_keyboard: [[{ text: this.#text(state, "addToGroup", "➕ افزودن ربات به گروه"), url: `https://t.me/${username}?startgroup=true` }]] } };
  }

  async #handlePrivateMessage(state, message) {
    const user = message.from || {};
    const chat = message.chat || {};
    const chatId = chat.id;
    const text = asText(message.text || message.caption);
    const owner = this.#isOwner(user.id, state);
    this.#rememberPvUser(state, user, message.update_id);
    const parsed = parseCommand(text);
    const bootstrapStart = Boolean(parsed?.command === "/start" && !this.#ownerId(state));
    if (!owner && !bootstrapStart) {
      await this.#save(state);
      const markup = await this.#privateJoinMarkup(state);
      await this.#send(chatId, this.#text(state, "privateOnly", "🤖 این ربات در PV کاربران عادی فعالیت نمی‌کند؛ آن را به گروه یا سوپرگروه اضافه کنید."), state, markup);
      return;
    }

    if (parsed) {
      const { command, args } = parsed;
      if (command === "/start") {
        if (!state.security.ownerId) {
          const candidateId = String(user.id ?? "");
          if (!isTelegramId(candidateId) || Number(candidateId) <= 0 || user.is_bot || String(chatId) !== candidateId) {
            await this.#send(chatId, "برای ثبت مالک، /start را با حساب شخصی در گفت‌وگوی خصوصی بفرست.", state);
            return;
          }
          state.security.ownerId = candidateId;
          state.security.ownerClaimedAt = Date.now();
          state.security.ownerUsername = user.username || null;
          state.security.ownerDisplayName = userDisplay(user).slice(0, 120);
          await this.#save(state);
          await this.#send(chatId,
            `${this.#text(state, "ownerStartup", "مالک باید ابتدا از حساب شخصی خود در PV ربات /start بفرستد؛ اولین /start خصوصی مالک را ثبت می‌کند.")}\n\n👑 این حساب به‌عنوان اولین مالک ثبت شد.\nبرای نصب دیتابیس: /installDB\nپنل مدیریت: /author`,
            state, { reply_markup: this.#authorHomeKeyboard() });
          return;
        }
        await this.#showStart(state, chatId, owner);
        return;
      }

      if (command === "/author") {
        if (!owner) {
          await this.#send(chatId, "⛔ پنل /author فقط برای مالک ربات در دسترس است.", state);
          return;
        }
        await this.#send(chatId, "👑 پنل مدیریت مالک\nماژول‌ها، گروه‌ها، کانال‌ها، ارسال همگانی و تنظیمات ربات را از اینجا مدیریت کن.", state, {
          reply_markup: this.#authorHomeKeyboard(),
        });
        return;
      }

      if (command === "/installdb") {
        if (!owner) {
          await this.#send(chatId, state.security.ownerId
            ? "⛔ دستور /installDB فقط برای مالک ربات فعال است."
            : "ابتدا مالک باید /start را در گفت‌وگوی خصوصی ارسال کند.", state);
          return;
        }
        state.flow = "database_upload";
        await this.#save(state);
        await this.#send(chatId, this.#text(state, "install.prompt", "📎 فایل database.js را مستقیماً به‌صورت Document آپلود کن؛ لینک لازم نیست و حجم حداکثر 256 KiB است."), state);
        return;
      }

      if (command === "/help") {
        if (owner) await this.#handleOwnerConsoleCommand(state, chat, args);
        else await this.#send(chatId, this.#text(state, "help", "برای راهنمای استفاده، پیام عادی بفرست یا در گروه از مدیر کمک بگیر."), state);
        return;
      }

      if (command === "/cancel") {
        if (!owner) return;
        state.flow = null;
        state.forwardDraft = null;
        state.broadcastDraft = null;
        await this.#save(state);
        await this.#send(chatId, "عملیات جاری لغو شد.", state, { reply_markup: this.#authorHomeKeyboard() });
        return;
      }

      if (command === "/forget") {
        const db = this.#db(state);
        if (db?.features?.memory?.allowForgetCommand === false || !this.#featureEnabled(state, "memory")) {
          await this.#send(chatId, "حافظهٔ مکالمه در این ربات فعال نیست.", state);
          return;
        }
        const memorySpec = state.resourceRegistry?.["chat-context"];
        const encoded = encodeURIComponent(`${chatId}:${user.id}`.slice(0, 180));
        if (memorySpec?.ring) {
          const index = memorySpec.ring.indexOf(encoded);
          if (index >= 0) memorySpec.ring.splice(index, 1);
          memorySpec.entryCount = memorySpec.ring.length;
          await this.ctx.storage.delete(`${this.#resourcePrefix("chat-context")}item:${encoded}`);
          await this.#save(state);
        }
        for (const key of [...this.answerCache.keys()]) {
          if (key.startsWith(`${chatId}:${user.id}:`)) this.answerCache.delete(key);
        }
        await this.#send(chatId, this.#text(state, "conversation.contextReset", "🧠 حافظهٔ این گفت‌وگو پاک شد."), state);
        return;
      }

      if (command.startsWith("/")) {
        const db = this.#db(state);
        const rules = this.#featureEnabled(state, "customCommands") ? (db?.features?.customCommands?.rules || []) : [];
        const rule = rules.find((item) => String(item.command || "").toLowerCase() === command && item.enabled !== false);
        if (rule?.response) {
          await this.#send(chatId, renderTemplate(String(rule.response), {
            user: userDisplay(user), username: user.username || "", chat: "خصوصی",
          }), state);
        } else if (owner) {
          await this.#send(chatId, this.#ownerCommandHelp(), state, { reply_markup: this.#authorHomeKeyboard() });
        }
        return;
      }
    }

    if (owner && state.flow === "database_upload") {
      if (!message.document) {
        await this.#send(chatId, "منتظر فایل database.js هستم. فایل را با گزینهٔ ارسال به‌صورت Document بفرست؛ متن یا تصویر قابل نصب نیست.", state);
        return;
      }
      await this.#installFromTelegramDocument(state, message);
      return;
    }

    if (owner && state.flow === "broadcast_wait") {
      const hasMedia = Boolean(message.photo || message.video || message.document || message.animation || message.audio || message.voice || message.video_note);
      if (!text && !hasMedia) {
        await this.#send(chatId, "برای پیام همگانی، متن یا رسانه بفرست؛ برای لغو /cancel را بزن.", state);
        return;
      }
      state.broadcastDraft = {
        sourceChatId: chatId,
        sourceMessageId: message.message_id,
        text: text.slice(0, 3_800),
        hasMedia,
      };
      state.flow = "broadcast_confirm";
      await this.#save(state);
      const targetCount = Object.keys(state.groups || {}).filter((id) => !state.blockedGroups.includes(id) && !state.leftGroups.includes(id)).length;
      await this.#send(chatId, `📣 پیش‌نمایش پیام همگانی آماده است.\nگروه‌های مقصد: ${targetCount}\nارسال به‌صورت صفی انجام می‌شود و برای هر گروه نتیجه ثبت خواهد شد.`, state, {
        reply_markup: { inline_keyboard: [[button("✅ تأیید ارسال", "broadcast:confirm", "success"), button("لغو", "broadcast:cancel", "danger")]] },
      });
      return;
    }

    if (owner && state.flow === "channel_post_text") {
      state.flow = null;
      await this.#save(state);
      await this.#send(chatId, "انتشار مستقیم پیام در کانال در این نسخه پشتیبانی نمی‌شود.", state);
      return;
    }

    if (owner && typeof state.flow === "string" && state.flow.startsWith("forward_")) {
      await this.#forwardFlowText(state, text);
      return;
    }

    if (owner && message.document) {
      await this.#send(chatId, "برای نصب دیتابیس، ابتدا /installDB را بفرست و سپس database.js را به‌صورت Document آپلود کن.", state);
      return;
    }

    const db = this.#db(state);
    if (!db || !text) return;

    const privateJokes = db.features?.jokes || {};
    if (this.#featureEnabled(state, "jokes")
      && matchPhrase(text, privateJokes.triggerWords || ["جوک", "لطیفه"])) {
      await this.#reply(message, randomItem(privateJokes.items, this.#text(state, "jokes.empty", "فعلاً جوکی ندارم!")), state);
      return;
    }

    if (!this.#featureEnabled(state, "chatbot")) return;
    const normalized = normalizeText(text);
    const contextKey = `${chatId}:${user.id}`;
    const memoryEnabled = this.#featureEnabled(state, "memory");
    const priorContext = memoryEnabled ? await this.#resourceGet(state, "chat-context", contextKey) : null;
    const contextFingerprint = priorContext?.lastMessage ? normalizeText(priorContext.lastMessage).slice(0, 40) : "new";
    const cacheKey = `${chatId}:${user.id}:${normalized.slice(0, 120)}|${contextFingerprint}`;
    const cached = memoryEnabled ? this.#cacheGet(cacheKey) : "";
    const cooldownMs = Math.max(0, Number(db.features?.chatbot?.cooldownSeconds || 0)) * 1_000;
    const cooldownActive = Boolean(cooldownMs && priorContext?.lastReplyAt && Date.now() - Number(priorContext.lastReplyAt) < cooldownMs);
    const answer = cooldownActive ? "" : (cached || this.#chatbotAnswer(text, db, priorContext));
    if (!answer) return;

    if (memoryEnabled) {
      this.#cacheSet(cacheKey, answer, Number(db.runtime?.cache?.chatAnswerTtlSeconds || 600) * 1_000);
      const history = Array.isArray(priorContext?.history) ? priorContext.history : [];
      history.push({ prompt: text.slice(0, 500), answer: answer.slice(0, 500), at: Date.now() });
      await this.#resourcePut(state, "chat-context", contextKey, {
        userId: String(user.id), chatId: String(chatId), displayName: userDisplay(user), lastMessage: text.slice(0, 500),
        history: history.slice(-Math.max(1, Number(db.features?.memory?.privateHistory || 12))),
        lastReplyAt: Date.now(), updatedAt: Date.now(),
      });
    }
    await this.#save(state);
    await this.#reply(message, answer, state);
  }

  #cacheGet(key) {
    const entry = this.answerCache.get(key);
    if (!entry) return "";
    if (entry.expiresAt <= Date.now()) {
      this.answerCache.delete(key);
      return "";
    }
    // Refresh insertion order for a small LRU cache held only in the DO isolate.
    this.answerCache.delete(key);
    this.answerCache.set(key, entry);
    return entry.answer || "";
  }

  #cacheSet(key, answer, ttlMs = 600_000) {
    this.answerCache.delete(key);
    this.answerCache.set(key, { answer: String(answer).slice(0, 3800), expiresAt: Date.now() + ttlMs });
    while (this.answerCache.size > 512) this.answerCache.delete(this.answerCache.keys().next().value);
  }

  #chatbotAnswer(text, db, memory = null) {
    const feature = db.features?.chatbot || {};
    if (!text || text.length > Number(feature.maxInputLength || 1200)) return "";
    const cooldown = Math.max(0, Number(feature.cooldownSeconds || 0)) * 1000;
    if (cooldown && memory?.lastReplyAt && Date.now() - Number(memory.lastReplyAt) < cooldown) return "";
    const selected = selectNlpRule(text, (feature.rules || []).slice(0, Number(feature.maxRulesEvaluated || 300)));
    if (!selected || selected.score < Number(feature.minScore || 1)) {
      return feature.fallbackEnabled ? randomItem(feature.fallbackResponses, "") : "";
    }
    const rule = selected.rule;
    const answer = randomItem(rule.responses, rule.answer || "");
    if (!answer) return "";
    return renderTemplate(answer, {
      lastMessage: memory?.lastMessage || "",
      previousMessage: memory?.history?.at(-1)?.prompt || "",
      previousAnswer: memory?.history?.at(-1)?.answer || "",
      user: memory?.displayName || "رفیق",
      time: new Date().toLocaleTimeString("fa-IR", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Tehran" }),
    }).slice(0, 3_800);
  }

  async #handleJoinRequest(state, request) {
    const feature = this.#db(state)?.features?.joinRequests || {};
    if (!this.#featureEnabled(state, "joinRequests", request.chat?.id)) return;
    const chatId = request.chat?.id;
    if (!chatId) return;
    const userId = String(request.from?.id || "");
    if ((feature.denylist || []).map(String).includes(userId)) {
      await this.#telegram(state, "declineChatJoinRequest", { chat_id: chatId, user_id: userId }, { bypassLocalRate: true });
      return;
    }
    const allowed = (feature.allowlist || []).map(String).includes(userId);
    if (!feature.autoApprove && !allowed) return;
    const result = await this.#telegram(state, "approveChatJoinRequest", { chat_id: chatId, user_id: userId }, { bypassLocalRate: true });
    if (result.ok && feature.notify && this.#ownerId(state)) {
      await this.#send(this.#ownerId(state), renderTemplate(this.#text(state, "join.approved", "✅ درخواست عضویت {name} تأیید شد."), { name: userDisplay(request.from) }), state);
    }
  }

  async #handleNewMembers(state, message) {
    const db = this.#db(state);
    if (!db) return;
    const welcomeFeature = db.features?.welcome || {};
    const captchaFeature = db.features?.captcha || {};
    const raidFeature = db.features?.raidProtection || {};
    const chatId = String(message.chat?.id || "");
    const now = Date.now();
    const raidEnabled = this.#featureEnabled(state, "raidProtection", chatId);
    const dedup = state.welcomeDedup || (state.welcomeDedup = {});
    const members = (message.new_chat_members || []).filter((member) => {
      if (!member || member.is_bot || !member.id) return false;
      const key = `${chatId}:${member.id}`;
      const last = Number(dedup[key] || 0);
      if (now - last < 60_000) return false;
      dedup[key] = now;
      return true;
    });
    for (const [key, stamp] of Object.entries(dedup)) if (now - Number(stamp || 0) > 3_600_000) delete dedup[key];
    const dedupKeys = Object.keys(dedup);
    if (dedupKeys.length > 2_000) for (const key of dedupKeys.slice(0, dedupKeys.length - 1_500)) delete dedup[key];
    const antiRaid = db.features?.antiSpam?.raid || {};
    const raidWindow = clampNumber(antiRaid.windowSeconds, raidFeature.windowSeconds || 60, 10, 600);
    const joins = (state.joinWindows[chatId] || []).filter((stamp) => now - stamp <= raidWindow * 1_000);
    for (const member of members) joins.push(now);
    state.joinWindows[chatId] = joins.slice(-150);
    const raidThreshold = clampNumber(antiRaid.maxJoins, raidFeature.maxJoins || 10, 3, 100);
    const escalationThreshold = clampNumber(antiRaid.escalationJoins, raidFeature.escalationJoins || 20, raidThreshold, 200);
    const raidDetected = raidEnabled && joins.length >= raidThreshold;
    if (raidDetected) {
      const severity = joins.length >= escalationThreshold ? 2 : 1;
      await this.#securityAlert(state, {
        chatId, chatTitle: message.chat.title || chatId, kind: "join_raid",
        reason: `${joins.length} ورود در ${raidWindow} ثانیه؛ آستانه ${raidThreshold}`,
        count: members.length, userIds: members.map((member) => member.id), severity,
        action: "حالت کپچای ورود برای اعضای تازه فعال شد؛ اقدام محدودسازی منوط به مجوز واقعی ربات است.",
      });
    }
    const captchaRequired = this.#featureEnabled(state, "captcha", chatId)
      || (raidDetected && raidFeature.captchaDuringRaid !== false);

    for (const member of members) {
      this.#rememberKnownMember(state, message.chat, member);
      const key = `${chatId}:${member.id}`;
      if (captchaRequired && !state.pendingVerifications[key]) {
        const canRestrict = await this.#botPermission(state, chatId, "can_restrict_members");
        if (canRestrict !== true) {
          await this.#securityAlert(state, {
            chatId, chatTitle: message.chat.title || chatId, kind: "captcha_permission_missing",
            reason: "عضو تازه نیازمند بررسی بود، اما دسترسی محدودسازی ربات تأیید نشد.", count: 1,
            userIds: [member.id], action: "اقدام انجام نشد؛ مجوز restrict_members تأیید نشد.",
          });
        } else {
        const restrict = await this.#telegram(state, "restrictChatMember", {
          chat_id: message.chat.id,
          user_id: member.id,
          permissions: {
            can_send_messages: false, can_send_audios: false, can_send_documents: false,
            can_send_photos: false, can_send_videos: false, can_send_video_notes: false,
            can_send_voice_notes: false, can_send_polls: false, can_send_other_messages: false,
            can_add_web_page_previews: false,
          },
          until_date: Math.floor(now / 1_000) + clampNumber(captchaFeature.timeoutSeconds, 120, 30, 900),
          use_independent_chat_permissions: true,
        }, { bypassLocalRate: true });
        if (restrict.ok) {
          const nonce = Math.random().toString(36).slice(2, 10);
          state.pendingVerifications[key] = { userId: String(member.id), chatId, nonce, expiresAt: now + clampNumber(captchaFeature.timeoutSeconds, 120, 30, 900) * 1_000 };
          await this.#send(message.chat.id, `${userDisplay(member)}، برای فعال‌شدن امکان ارسال پیام، دکمهٔ تأیید را بزن.`, state, {
            reply_markup: { inline_keyboard: [[button("✅ من ربات نیستم", `captcha:${chatId}:${member.id}:${nonce}`, "success")]] },
          }, { group: true });
        } else {
          await this.#securityAlert(state, {
            chatId, chatTitle: message.chat.title || chatId, kind: "captcha_action_failed",
            reason: "درخواست محدودسازی عضو تازه توسط تلگرام پذیرفته نشد.", count: 1,
            userIds: [member.id], action: `محدودسازی ناموفق؛ ${asText(restrict.description || "خطای تلگرام").slice(0, 90)}`,
          });
        }
        }
      }
      if (this.#featureEnabled(state, "welcome", chatId)) {
        const text = asText(welcomeFeature.text || this.#text(state, "welcome", "سلام {name}، خوش اومدی!"));
        await this.#send(message.chat.id, renderTemplate(text, {
          name: userDisplay(member), username: member.username ? `@${member.username}` : "",
          id: member.id, chat: message.chat.title || "گروه",
        }), state, {}, { group: true });
      }
    }
    await this.#save(state);
  }

  async #expireVerifications(state, now = Date.now()) {
    const expired = Object.entries(state.pendingVerifications || {}).filter(([, item]) => Number(item.expiresAt || 0) <= now);
    for (const [key, item] of expired.slice(0, 40)) {
      const [chatId, userId] = key.split(":");
      await this.#telegram(state, "banChatMember", { chat_id: chatId, user_id: Number(userId), until_date: Math.floor(now / 1_000) + 60 }, { bypassLocalRate: true });
      await this.#telegram(state, "unbanChatMember", { chat_id: chatId, user_id: Number(userId), only_if_banned: true }, { bypassLocalRate: true });
      delete state.pendingVerifications[key];
    }
    if (expired.length) await this.#save(state);
  }

  async #handleReport(state, message, reportText = "") {
    if (!this.#featureEnabled(state, "reports", message.chat?.id)) return false;
    const chat = message.chat || {};
    const reporter = message.from || {};
    const target = message.reply_to_message?.from;
    const record = {
      id: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`,
      chatId: String(chat.id), chatTitle: asText(chat.title || chat.id).slice(0, 120),
      reporterId: String(reporter.id || ""), reporterName: userDisplay(reporter).slice(0, 80),
      targetId: target?.id ? String(target.id) : null, targetName: target ? userDisplay(target).slice(0, 80) : null,
      messageId: message.reply_to_message?.message_id || message.message_id,
      text: asText(reportText || message.reply_to_message?.text || message.reply_to_message?.caption || "بدون متن").slice(0, 600),
      createdAt: Date.now(),
    };
    state.reportQueue.push(record);
    state.reportQueue = state.reportQueue.slice(-100);
    await this.#save(state);
    if (this.#ownerId(state)) {
      await this.#send(this.#ownerId(state), `🚩 گزارش جدید\nگروه: ${record.chatTitle}\nشناسه گروه: ${record.chatId}\nگزارش‌دهنده: ${record.reporterName} (${record.reporterId})\nهدف: ${record.targetName || "تعیین نشده"}\nشناسه پیام: ${record.messageId}\nمتن: ${record.text}`, state);
    }
    await this.#reply(message, "✅ گزارش برای مدیران ارسال شد. ممنون از اطلاع‌رسانی.", state);
    return true;
  }

  async #recordSpam(state, message, db, operator = false) {
    const anti = db.features?.antiSpam || {};
    if (!this.#featureEnabled(state, "antiSpam", message.chat?.id) || !message.from?.id) return false;
    const userId = String(message.from.id);
    const chatId = String(message.chat.id);
    const protectedIds = [
      ...(db.roles?.protectedIds || []),
      ...(db.features?.moderation?.protectedIds || []),
    ].map(String);
    if ((anti.exemptIds || []).map(String).includes(userId)
      || protectedIds.includes(userId)
      || operator || this.#isOperator(userId, chatId, db, state)) return false;

    const now = Date.now();
    const spanMs = clampNumber(anti.windowSeconds, 10, 3, 120) * 1_000;
    const record = state.spam[`${chatId}:${userId}`] || { times: [], signatures: [], commands: [], links: [], strikes: 0 };
    record.times = (record.times || []).filter((time) => now - time <= spanMs).slice(-40);
    record.signatures = (record.signatures || []).filter((item) => now - item.at <= clampNumber(anti.duplicateWindowSeconds, 60, 10, 300) * 1_000).slice(-40);
    record.commands = (record.commands || []).filter((time) => now - time <= clampNumber(anti.commandWindowSeconds, 10, 3, 120) * 1_000).slice(-40);
    record.links = (record.links || []).filter((time) => now - time <= clampNumber(anti.linkWindowSeconds, 10, 3, 120) * 1_000).slice(-40);
    record.times.push(now);

    const messageText = asText(message.text || message.caption);
    const mediaFileId = message.photo?.at(-1)?.file_unique_id
      || message.document?.file_unique_id || message.animation?.file_unique_id
      || message.video?.file_unique_id || message.audio?.file_unique_id
      || message.voice?.file_unique_id || message.video_note?.file_unique_id
      || message.sticker?.file_unique_id || "";
    const signature = messageText
      ? normalizeText(messageText)
      : (anti.trackMedia && mediaFileId ? `media:${mediaFileId}` : "");
    if (signature) record.signatures.push({ value: signature.slice(0, 300), at: now });

    const linkCount = (messageText.match(/(?:https?:\/\/|t\.me\/|www\.)/gi) || []).length;
    const mentionCount = (messageText.match(/@[A-Za-z][A-Za-z0-9_]{4,31}|tg:\/\/user\?id=/gi) || []).length;
    const command = /^\/[a-z0-9_]+(?:@\w+)?/i.test(messageText);
    if (linkCount) record.links.push(...Array(Math.min(10, linkCount)).fill(now));
    if (command) record.commands.push(now);

    record.times = record.times.slice(-40);
    record.signatures = record.signatures.slice(-40);
    record.links = record.links.slice(-40);
    record.commands = record.commands.slice(-40);
    const duplicateLimit = clampNumber(anti.duplicateLimit, 3, 2, 10);
    const duplicateCount = signature ? record.signatures.filter((item) => item.value === signature).length : 0;

    const activityWindow = clampNumber(anti.chatWindowSeconds, 5, 2, 60) * 1_000;
    const activity = (state.chatActivity[chatId] || []).filter((item) => now - Number(item.at || 0) <= activityWindow).slice(-250);
    activity.push({ at: now, userId, links: linkCount, mentions: mentionCount, command });
    state.chatActivity[chatId] = activity.slice(-250);

    const userRate = record.times.length >= clampNumber(anti.maxMessages, 7, 3, 30);
    const duplicate = Boolean(signature && duplicateCount >= duplicateLimit && anti.signals?.duplicateText !== false);
    const chatFlood = anti.signals?.chatFlood !== false && activity.length >= clampNumber(anti.chatMaxMessages, 35, 5, 250);
    const linkFlood = anti.signals?.linkFlood !== false && linkCount >= clampNumber(anti.maxLinksPerMessage, 4, 1, 20);
    const mentionFlood = anti.signals?.mentionFlood !== false && mentionCount >= clampNumber(anti.maxMentionsPerMessage, 8, 2, 50);
    const commandFlood = anti.signals?.commandFlood !== false && record.commands.length >= clampNumber(anti.maxCommandsPerWindow, 5, 2, 30);
    const reason = userRate ? `ارسال ${record.times.length} پیام توسط کاربر ${userId} در ${anti.windowSeconds || 10} ثانیه`
      : duplicate ? `تکرار یک محتوای یکسان ${duplicateCount} بار توسط کاربر ${userId}`
        : chatFlood ? `موج پیام: ${activity.length} پیام در ${anti.chatWindowSeconds || 5} ثانیه`
          : linkFlood ? `تعداد لینک در یک پیام: ${linkCount}`
            : mentionFlood ? `تعداد اشاره در یک پیام: ${mentionCount}`
              : commandFlood ? `ارسال ${record.commands.length} فرمان در بازه ${anti.commandWindowSeconds || 10} ثانیه` : "";

    state.spam[`${chatId}:${userId}`] = record;
    const keys = Object.keys(state.spam);
    const maxTrackedUsers = clampNumber(anti.maxTrackedUsers || db.limits?.maxRememberedSpamUsers, 600, 100, 2_000);
    if (keys.length > maxTrackedUsers) {
      for (const oldKey of keys.slice(0, keys.length - Math.max(100, Math.floor(maxTrackedUsers * 0.75)))) delete state.spam[oldKey];
    }
    const chatKeys = Object.keys(state.chatActivity);
    if (chatKeys.length > 500) {
      for (const oldChat of chatKeys.slice(0, chatKeys.length - 400)) delete state.chatActivity[oldChat];
    }
    await this.#save(state);
    if (!reason) return false;

    record.strikes = Math.min(100, Number(record.strikes || 0) + 1);
    let action = "بدون اقدام";
    const wantsDelete = anti.deleteFloodMessages !== false;
    const canDelete = wantsDelete ? await this.#botPermission(state, chatId, "can_delete_messages") : false;
    if (wantsDelete && canDelete === true) {
      const deleted = await this.#telegram(state, "deleteMessage", { chat_id: chatId, message_id: message.message_id }, { bypassLocalRate: true });
      action = deleted.ok ? "پیام حذف شد" : "حذف پیام ناموفق بود؛ تلگرام درخواست را نپذیرفت";
    } else if (wantsDelete) {
      action = "پیام حذف نشد؛ مجوز حذف پیام تأیید نشد";
    }

    let muted = false;
    if (anti.muteEnabled !== false) {
      const canRestrict = await this.#botPermission(state, chatId, "can_restrict_members");
      if (canRestrict === true) {
        const minutes = clampNumber(anti.muteMinutes, 10, 1, 1_440);
        const untilDate = Math.floor(now / 1_000) + minutes * 60;
        const result = await this.#telegram(state, "restrictChatMember", {
          chat_id: chatId, user_id: Number(userId),
          permissions: {
            can_send_messages: false, can_send_audios: false, can_send_documents: false,
            can_send_photos: false, can_send_videos: false, can_send_video_notes: false,
            can_send_voice_notes: false, can_send_polls: false, can_send_other_messages: false,
            can_add_web_page_previews: false,
          },
          until_date: untilDate, use_independent_chat_permissions: true,
        }, { bypassLocalRate: true });
        muted = result.ok;
        action += muted ? `؛ محدودیت ${minutes} دقیقه‌ای اعمال شد` : "؛ محدودسازی توسط تلگرام رد شد";
      } else {
        action += "؛ محدودسازی انجام نشد چون مجوز restrict_members تأیید نشد";
      }
    }

    await this.#securityAlert(state, {
      chatId, chatTitle: message.chat.title || chatId,
      kind: chatFlood ? "chat_flood" : duplicate ? "duplicate_spam" : linkFlood ? "link_flood" : mentionFlood ? "mention_flood" : commandFlood ? "command_flood" : "user_flood",
      reason, count: chatFlood ? activity.length : (duplicate ? duplicateCount : record.times.length),
      userIds: [userId], severity: record.strikes >= 3 ? 2 : 1, action,
    });
    record.times = [];
    record.signatures = [];
    record.links = [];
    record.commands = [];
    await this.#save(state);
    if (muted) {
      await this.#send(chatId, renderTemplate(this.#text(state, "moderation.muted", "🛡 به دلیل رفتار اسپم، {name} برای {minutes} دقیقه محدود شد."), {
        name: userDisplay(message.from), minutes: clampNumber(anti.muteMinutes, 10, 1, 1_440),
      }), state, {}, { group: true });
    }
    return true;
  }

  async #replyAction(state, message, operator, db) {
    if (!operator || !this.#featureEnabled(state, "moderation", message.chat?.id) || !message.reply_to_message?.from || !message.text) return false;
    const parsed = parseCommand(message.text);
    const supportedActions = new Set(["ban", "kick", "mute", "unmute", "unban", "delete", "pin", "warn"]);
    const commandDefinitions = Array.isArray(db.features?.moderation?.commands) ? db.features.moderation.commands : [];
    const commandDefinition = parsed && commandDefinitions.find((item) => item.enabled !== false
      && String(item.command || "").toLowerCase() === parsed.command && supportedActions.has(String(item.action || "")));
    const selectedCommand = commandDefinition ? {
      action: String(commandDefinition.action),
      minutes: clampNumber(parsed.args[0] || commandDefinition.minutes, 60, 1, 40_320),
      label: String(commandDefinition.label || commandDefinition.action),
    } : null;
    const actions = db.features?.moderation?.replyActions || [];
    const normalized = normalizeText(message.text);
    const selected = selectedCommand || actions.find((item) => (item.terms || []).some((term) => normalizeText(term) === normalized));
    if (!selected) return false;

    const target = message.reply_to_message.from;
    const chatId = message.chat.id;
    const protectedIds = [...(db.roles?.protectedIds || []), ...(db.features?.moderation?.protectedIds || [])].map(String);
    if (!target.id || target.is_bot || this.#isOwner(target.id, state) || protectedIds.includes(String(target.id))) {
      await this.#reply(message, this.#text(state, "moderation.protected", "🛡 این کاربر در فهرست محافظت‌شده است."), state);
      return true;
    }
    const targetMember = await this.#telegram(state, "getChatMember", { chat_id: chatId, user_id: target.id }, { bypassLocalRate: true });
    if (!targetMember.ok || !targetMember.result?.status) {
      await this.#reply(message, this.#text(state, "moderation.memberCheckFailed", "⚠️ وضعیت عضو قابل تأیید نیست؛ عملیات انجام نشد."), state);
      return true;
    }
    if (["creator", "administrator"].includes(targetMember.result.status)) {
      await this.#reply(message, this.#text(state, "moderation.protected", "🛡 مدیران گروه محافظت می‌شوند."), state);
      return true;
    }

    const action = selected.action;
    const me = await this.#telegram(state, "getMe", {}, { bypassLocalRate: true });
    const botMember = me.ok ? await this.#telegram(state, "getChatMember", { chat_id: chatId, user_id: me.result.id }, { bypassLocalRate: true }) : { ok: false };
    const botStatus = botMember.result || {};
    const needsRestrict = ["ban", "kick", "mute", "unmute", "unban"].includes(action);
    const needsDelete = action === "delete";
    const needsPin = action === "pin";
    if (needsRestrict && !(botStatus.status === "creator" || (botStatus.status === "administrator" && botStatus.can_restrict_members === true))) {
      await this.#reply(message, "⛔ ربات مجوز Restrict Members ندارد؛ مجوز مدیریت اعضا را به آن بده.", state);
      return true;
    }
    if (needsDelete && !(botStatus.status === "creator" || (botStatus.status === "administrator" && botStatus.can_delete_messages === true))) {
      await this.#reply(message, "⛔ ربات مجوز Delete Messages ندارد.", state);
      return true;
    }
    if (needsPin && !(botStatus.status === "creator" || (botStatus.status === "administrator" && botStatus.can_pin_messages === true))) {
      await this.#reply(message, "⛔ ربات مجوز Pin Messages ندارد.", state);
      return true;
    }

    const userId = Number(target.id);
    let result = { ok: false, description: "UNKNOWN_ACTION" };
    if (action === "ban") {
      result = await this.#telegram(state, "banChatMember", { chat_id: chatId, user_id: userId }, { bypassLocalRate: true });
    } else if (action === "kick") {
      result = await this.#telegram(state, "banChatMember", { chat_id: chatId, user_id: userId, until_date: Math.floor(Date.now() / 1_000) + 60 }, { bypassLocalRate: true });
      if (result.ok) {
        const unban = await this.#telegram(state, "unbanChatMember", { chat_id: chatId, user_id: userId, only_if_banned: true }, { bypassLocalRate: true });
        if (!unban.ok) result = unban;
      }
    } else if (action === "mute") {
      const minutes = clampNumber(selected.minutes ?? parsed?.args?.[0], 60, 1, 40_320);
      result = await this.#telegram(state, "restrictChatMember", {
        chat_id: chatId, user_id: userId,
        permissions: { can_send_messages: false, can_send_audios: false, can_send_documents: false, can_send_photos: false, can_send_videos: false, can_send_video_notes: false, can_send_voice_notes: false, can_send_polls: false, can_send_other_messages: false, can_add_web_page_previews: false },
        until_date: Math.floor(Date.now() / 1_000) + minutes * 60,
        use_independent_chat_permissions: true,
      }, { bypassLocalRate: true });
    } else if (action === "unmute") {
      result = await this.#telegram(state, "restrictChatMember", {
        chat_id: chatId, user_id: userId,
        permissions: { can_send_messages: true, can_send_audios: true, can_send_documents: true, can_send_photos: true, can_send_videos: true, can_send_video_notes: true, can_send_voice_notes: true, can_send_polls: true, can_send_other_messages: true, can_add_web_page_previews: true },
        use_independent_chat_permissions: true,
      }, { bypassLocalRate: true });
    } else if (action === "unban") {
      result = await this.#telegram(state, "unbanChatMember", { chat_id: chatId, user_id: userId, only_if_banned: true }, { bypassLocalRate: true });
    } else if (action === "delete") {
      result = await this.#telegram(state, "deleteMessage", { chat_id: chatId, message_id: message.reply_to_message.message_id }, { bypassLocalRate: true });
    } else if (action === "pin") {
      result = await this.#telegram(state, "pinChatMessage", { chat_id: chatId, message_id: message.reply_to_message.message_id, disable_notification: true }, { bypassLocalRate: true });
    } else if (action === "warn") {
      const warningKey = `${chatId}:${target.id}`;
      state.warnings ||= {};
      const count = Number(state.warnings[warningKey] || 0) + 1;
      state.warnings[warningKey] = count;
      result = { ok: true };
      const threshold = clampNumber(db.features?.moderation?.warningThreshold, 3, 2, 10);
      const warnText = renderTemplate(this.#text(state, "moderation.warn", "⚠️ {name}، لطفاً قوانین گروه را رعایت کن. اخطار {count}/{threshold}"), {
        name: userDisplay(target), count, threshold,
      });
      await this.#reply(message, warnText, state);
      if (count >= threshold) {
        const minutes = clampNumber(db.features?.moderation?.warningMuteMinutes, 30, 1, 1_440);
        const muted = await this.#telegram(state, "restrictChatMember", {
          chat_id: chatId, user_id: userId,
          permissions: { can_send_messages: false, can_send_audios: false, can_send_documents: false, can_send_photos: false, can_send_videos: false, can_send_video_notes: false, can_send_voice_notes: false, can_send_polls: false, can_send_other_messages: false, can_add_web_page_previews: false },
          until_date: Math.floor(Date.now() / 1_000) + minutes * 60,
          use_independent_chat_permissions: true,
        }, { bypassLocalRate: true });
        if (muted.ok) state.warnings[warningKey] = 0;
      }
    }

    await this.#save(state);
    if (action !== "warn") {
      const responseText = result.ok
        ? renderTemplate(this.#text(state, "moderation.actionSuccess", "✅ عملیات {action} برای {name} انجام شد."), { action: selected.label || action, name: userDisplay(target) })
        : renderTemplate(this.#text(state, "moderation.actionFailed", "❌ عملیات انجام نشد: {reason}"), { reason: asText(result.description || "خطای تلگرام").slice(0, 160) });
      await this.#reply(message, responseText, state);
    }
    return true;
  }

  async #runGroupAutomations(state, message, text, db) {
    if (!this.#featureEnabled(state, "automations", message.chat?.id)) return false;
    const rules = db.features?.automations?.rules || [];
    for (const [index, rule] of rules.entries()) {
      if (rule.enabled === false || !Array.isArray(rule.keywords) || !matchPhrase(text, rule.keywords)) continue;
      const groupSettings = state.groupSettings[String(message.chat.id)] ||= {};
      groupSettings.automationCooldowns ||= {};
      const last = Number(groupSettings.automationCooldowns[index] || 0);
      if (Date.now() - last < clampNumber(rule.cooldownSeconds, 20, 0, 86_400) * 1_000) continue;
      groupSettings.automationCooldowns[index] = Date.now();
      const action = rule.action || "reply";
      if (action === "delete") {
        await this.#telegram(state, "deleteMessage", { chat_id: message.chat.id, message_id: message.message_id }, { bypassLocalRate: true });
      } else if (action === "warn") {
        await this.#reply(message, renderTemplate(rule.response || "⚠️ لطفاً قوانین گروه را رعایت کن.", { user: userDisplay(message.from) }), state);
      } else if (action === "reply" && rule.response) {
        await this.#reply(message, renderTemplate(rule.response, { user: userDisplay(message.from), chat: message.chat.title || "گروه" }), state);
      }
      await this.#save(state);
      return rule.stopProcessing !== false;
    }
    return false;
  }

  async #handleGroupMessage(state, message) {
    const db = this.#db(state);
    if (!db) return;
    const chat = message.chat;
    const text = asText(message.text || message.caption);
    const user = message.from || {};
    if (user.is_bot) return;
    this.#rememberKnownMember(state, chat, user);
    const ownerOperator = this.#isOwner(user.id, state);
    const operator = this.#isOperator(user.id, chat.id, db, state) || await this.#isTelegramAdmin(state, user.id, chat.id);
    const botReplyFeature = db.features?.botReplyJokes || {};
    if (this.#featureEnabled(state, "botReplyJokes", chat.id)
      && message.reply_to_message?.from?.is_bot && text && !text.startsWith("/")) {
      const terms = botReplyFeature.terms || ["ریمو کن", "بن کن", "بنداز بیرون"];
      if (matchPhrase(text, terms)) {
        await this.#reply(message, randomItem(botReplyFeature.responses, this.#text(state, "moderation.botMiss", "😂 منو نمی‌شه ریم کرد!")), state);
        return;
      }
    }
    const groupKey = String(chat.id);
    let settings = state.groupSettings[groupKey];
    if (!settings) {
      settings = {
        botEnabled: true, chatterEnabled: false, chatterNextAt: 0,
        jokesEnabled: db.groupSettings?.defaultJokesEnabled !== false,
        chatbotEnabled: db.groupSettings?.defaultChatbotEnabled !== false,
      };
      state.groupSettings[groupKey] = settings;
    }
    settings.lastSeenAt = Date.now();
    const protectedSenderIds = [
      ...(db.roles?.protectedIds || []),
      ...(db.features?.moderation?.protectedIds || []),
    ].map(String);
    const trustedSender = operator || protectedSenderIds.includes(String(user.id));

    if (message.new_chat_members?.length) await this.#handleNewMembers(state, message);

    if (this.#featureEnabled(state, "reports", groupKey) && text && /^\/report(?:@\w+)?(?:\s|$)/i.test(text)) {
      await this.#handleReport(state, message, text.replace(/^\/report(?:@\w+)?\s*/i, ""));
      return;
    }
    if (!trustedSender && await this.#recordSpam(state, message, db, operator)) return;

    const command = parseCommand(text);
    if (command?.command === "/bot" && this.#featureEnabled(state, "groupControls", groupKey)) {
      const action = String(command.args?.[0] || "").toLowerCase();
      if (!operator) {
        await this.#reply(message, this.#text(state, "group.adminOnly", "⛔ این فرمان فقط برای مدیر واقعی گروه مجاز است."), state);
        return;
      }
      if (!["on", "off"].includes(action)) {
        await this.#reply(message, "برای کنترل پاسخ‌های ربات از /bot on یا /bot off استفاده کنید.", state);
        return;
      }
      settings.botEnabled = action === "on";
      await this.#save(state);
      await this.#reply(message, this.#text(state, action === "on" ? "group.botOn" : "group.botOff", action === "on" ? "✅ ربات روشن شد." : "🔕 پاسخ‌های عادی ربات خاموش شد."), state);
      await this.#send(chat.id, "کنترل سریع:", state, { reply_markup: { inline_keyboard: [[button("🟢 روشن", `g5:on:${groupKey}`, "success"), button("🔴 خاموش", `g5:off:${groupKey}`, "danger")]] } }, { bypassLocalRate: true, group: true });
      return;
    }
    if (["/tagoptout", "/tagoptin"].includes(command?.command)) {
      state.tagOptOut[`${groupKey}:${user.id}`] = command.command === "/tagoptout";
      await this.#save(state);
      await this.#reply(message, this.#text(state, command.command === "/tagoptout" ? "group.tagOptOut" : "group.tagOptIn", "تنظیم تگ شما ذخیره شد."), state);
      return;
    }
    if (command?.command === "/tagall" && this.#featureEnabled(state, "tagKnownMembers", groupKey)) {
      if (!operator) {
        await this.#reply(message, this.#text(state, "group.adminOnly", "⛔ فقط مدیر واقعی گروه می‌تواند تگ انجام دهد."), state);
        return;
      }
      const cooldown = clampNumber(db.features?.tagKnownMembers?.cooldownSeconds, 300, 30, 86_400) * 1_000;
      if (Date.now() - Number(state.tagCooldowns[groupKey] || 0) < cooldown) {
        await this.#reply(message, this.#text(state, "group.tagCooldown", "⏳ برای تگ‌کردن دوباره باید صبر کنید."), state);
        return;
      }
      const max = clampNumber(db.features?.tagKnownMembers?.maxMembers, 80, 1, 200);
      const ids = (state.knownMembers[groupKey] || []).filter((member) => !member.isBot && !state.tagOptOut[`${groupKey}:${member.id}`]).slice(-max).map((member) => String(member.id));
      if (!ids.length) {
        await this.#reply(message, this.#text(state, "group.tagEmpty", "هنوز کاربر شناخته‌شده‌ای ثبت نشده است."), state);
        return;
      }
      const nonce = crypto.randomUUID().replace(/-/g, "").slice(0, 12);
      state.tagDrafts[nonce] = { chatId: groupKey, initiatorId: String(user.id), ids, createdAt: Date.now(), expiresAt: Date.now() + 120_000 };
      state.tagDrafts = Object.fromEntries(Object.entries(state.tagDrafts).slice(-100));
      await this.#save(state);
      await this.#reply(message, renderTemplate(this.#text(state, "group.tagPreview", "پیش‌نمایش تگ اعضای شناخته‌شده: {count}"), { count: ids.length }), state);
      await this.#send(chat.id, "این فهرست فقط کاربران شناخته‌شده از Updateهای واقعی را دربرمی‌گیرد؛ کاربران ناشناخته قابل استخراج نیستند.", state, {
        reply_markup: { inline_keyboard: [[button("✅ تأیید و ارسال", `t5:confirm:${groupKey}:${nonce}`, "success"), button("لغو", `t5:cancel:${groupKey}:${nonce}`, "danger")]] },
      }, { bypassLocalRate: true, group: true });
      return;
    }

    const moderation = db.features?.moderation || {};
    const linkGuard = db.features?.linkGuard || {};
    const phishing = db.features?.phishingGuard || {};
    if (!trustedSender) {
      if (this.#featureEnabled(state, "moderation", groupKey) && matchPhrase(text, moderation.blockedWords || [])) {
        const canDelete = await this.#botPermission(state, groupKey, "can_delete_messages");
        if (canDelete === true) {
          const deleted = await this.#telegram(state, "deleteMessage", { chat_id: chat.id, message_id: message.message_id }, { bypassLocalRate: true });
          if (deleted.ok) await this.#send(chat.id, this.#text(state, "moderation.blockedWord", "⛔ پیام حذف شد؛ این محتوا با قوانین گروه سازگار نبود."), state, {}, { group: true });
          else await this.#securityAlert(state, { chatId: groupKey, chatTitle: chat.title, kind: "moderation_delete_failed", reason: "پیام دارای عبارت مسدود بود، اما حذف آن توسط تلگرام رد شد.", count: 1, userIds: [user.id], action: "حذف پیام ناموفق؛ تلگرام درخواست را رد کرد." });
        } else {
          await this.#securityAlert(state, { chatId: groupKey, chatTitle: chat.title, kind: "moderation_permission_missing", reason: "پیام دارای عبارت مسدود بود، اما مجوز حذف پیام ربات تأیید نشد.", count: 1, userIds: [user.id], action: "هیچ پیامی حذف نشد؛ مجوز حذف نامشخص یا غیرفعال بود." });
        }
        return;
      }
      const hasLink = /(?:https?:\/\/|t\.me\/|www\.)/i.test(text);
      const urlDomains = [...text.matchAll(/(?:https?:\/\/|www\.)?([a-z0-9.-]+\.[a-z]{2,})/gi)].map((match) => match[1].toLowerCase());
      const blockedLinkDomains = (linkGuard.blockedDomains || []).map((domain) => String(domain).toLowerCase());
      const blockedPhishingDomains = (phishing.blockedDomains || []).map((domain) => String(domain).toLowerCase());
      const matchesDomain = (domain, list) => list.some((blocked) => domain === blocked || domain.endsWith(`.${blocked}`));
      const linkDomainBlocked = urlDomains.some((domain) => matchesDomain(domain, blockedLinkDomains));
      const phishingDomainBlocked = urlDomains.some((domain) => matchesDomain(domain, blockedPhishingDomains));
      const allowDomains = (linkGuard.allowDomains || []).map((domain) => String(domain).toLowerCase());
      const notAllowlisted = linkGuard.requireAllowlist === true && urlDomains.some((domain) => !allowDomains.some((allowed) => domain === allowed || domain.endsWith(`.${allowed}`)));
      const suspicious = this.#featureEnabled(state, "phishingGuard", groupKey) && (matchPhrase(text, phishing.suspiciousTerms || []) || phishingDomainBlocked);
      const linkRejected = this.#featureEnabled(state, "linkGuard", groupKey) && hasLink
        && (linkGuard.deleteAllLinks === true || linkDomainBlocked || notAllowlisted || moderation.deleteLinks === true);
      if (suspicious || linkRejected) {
        const canDelete = await this.#botPermission(state, groupKey, "can_delete_messages");
        if (canDelete === true) {
          const deleted = await this.#telegram(state, "deleteMessage", { chat_id: chat.id, message_id: message.message_id }, { bypassLocalRate: true });
          if (deleted.ok) {
            const notice = suspicious ? (phishing.notice || "⚠️ پیام مشکوک حذف شد؛ روی لینک‌های ناشناس کلیک نکن.") : (linkGuard.notice || "⛔ لینک طبق قوانین گروه حذف شد.");
            await this.#send(chat.id, notice, state, {}, { group: true });
          } else {
            await this.#securityAlert(state, { chatId: groupKey, chatTitle: chat.title, kind: "guard_delete_failed", reason: suspicious ? "الگوی مشکوک فیشینگ تشخیص داده شد." : "لینک با سیاست گروه ناسازگار تشخیص داده شد.", count: 1, userIds: [user.id], action: "حذف پیام توسط تلگرام رد شد؛ پیام حذف‌شده تلقی نمی‌شود." });
          }
        } else {
          await this.#securityAlert(state, { chatId: groupKey, chatTitle: chat.title, kind: "guard_permission_missing", reason: suspicious ? "الگوی مشکوک فیشینگ شناسایی شد." : "لینک ناسازگار با سیاست گروه شناسایی شد.", count: 1, userIds: [user.id], action: "اقدام حذف انجام نشد؛ مجوز واقعی حذف تأیید نشد." });
        }
        return;
      }
    }

    if (settings.botEnabled === false) {
      await this.#save(state);
      return;
    }

    if (operator && text) {
      const controls = db.features?.controls || [];
      const control = controls.find((item) => matchPhrase(text, item.terms || []));
      if (control && db.groupSettings?.operatorCanToggle !== false) {
        const featureId = String(control.feature || "");
        if (getFeatureModule(featureId)) {
          const desired = Boolean(control.value);
          state.groupModuleOverrides[groupKey] ||= {};
          state.groupModuleOverrides[groupKey][featureId] = desired;
          await this.#save(state);
          await this.#reply(message, `✅ ماژول ${getFeatureModule(featureId).title} در همین گروه ${desired ? "روشن" : "خاموش"} شد.`, state);
          await this.#scheduleNext(state);
          return;
        }
      }
    }

    if (await this.#replyAction(state, message, operator, db)) return;
    if (await this.#runGroupAutomations(state, message, text, db)) return;

    if (this.#featureEnabled(state, "customCommands", groupKey) && text.startsWith("/")) {
      const parsed = parseCommand(text);
      const custom = db.features?.customCommands?.rules || [];
      const rule = custom.find((item) => String(item.command || "").toLowerCase() === parsed?.command && item.enabled !== false);
      if (rule?.response) {
        await this.#reply(message, renderTemplate(rule.response, { user: userDisplay(user), username: user.username || "", chat: chat.title || "گروه" }), state);
        return;
      }
    }

    if (settings.jokesEnabled !== false && this.#featureEnabled(state, "jokes", groupKey)
      && text && matchPhrase(text, db.features.jokes.triggerWords || ["جوک", "یه جوک بگو"])) {
      await this.#reply(message, randomItem(db.features.jokes.items, this.#text(state, "jokes.empty", "فعلاً جوکی ندارم!")), state);
      return;
    }

    if (settings.chatbotEnabled !== false && this.#featureEnabled(state, "chatbot", groupKey) && text) {
      const contextKey = `group:${chat.id}:${user.id}`;
      const memory = this.#featureEnabled(state, "memory", groupKey) ? await this.#resourceGet(state, "chat-context", contextKey) : null;
      const cacheKey = `g:${chat.id}:${user.id}:${normalizeText(text).slice(0, 120)}:${normalizeText(memory?.lastMessage || "new").slice(0, 40)}`;
      const answer = this.#cacheGet(cacheKey) || this.#chatbotAnswer(text, db, memory);
      if (answer) {
        this.#cacheSet(cacheKey, answer, Number(db.runtime?.cache?.chatAnswerTtlSeconds || 600) * 1000);
        const history = Array.isArray(memory?.history) ? memory.history : [];
        history.push({ prompt: text.slice(0, 300), answer: answer.slice(0, 300), at: Date.now() });
        if (this.#featureEnabled(state, "memory", groupKey)) await this.#resourcePut(state, "chat-context", contextKey, {
          userId: String(user.id), chatId: String(chat.id), displayName: userDisplay(user), lastMessage: text.slice(0, 300),
          history: history.slice(-Math.max(1, Number(db.features.memory.groupHistory || 6))), lastReplyAt: Date.now(), updatedAt: Date.now(),
        });
        await this.#save(state);
        await this.#reply(message, answer, state);
        return;
      }
    }

    await this.#save(state);
    await this.#scheduleNext(state);
  }

  async #setWebhook(state) {
    const token = botTokenFrom(this.env);
    const origin = String(this.env.WORKER_PUBLIC_ORIGIN || "").trim();
    let base;
    try { base = new URL(origin); } catch { return { ok: false, reason: "WORKER_PUBLIC_ORIGIN_INVALID" }; }
    if (base.protocol !== "https:" || !base.hostname.endsWith(".workers.dev")) return { ok: false, reason: "WORKER_PUBLIC_ORIGIN_MUST_BE_CANONICAL_HTTPS_WORKERS_DEV" };
    if (!validBotToken(this.env)) return { ok: false, reason: "BOT_TOKEN_INVALID" };
    const webhookUrl = `${base.origin}/telegram/webhook`;
    const secret = await webhookSecret(token);
    try {
      const response = await fetch(`${BOT_API}${token}/setWebhook`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          url: webhookUrl,
          secret_token: secret,
          allowed_updates: ["message", "edited_message", "callback_query", "chat_join_request", "my_chat_member", "chat_member"],
          drop_pending_updates: false,
        }),
        signal: AbortSignal.timeout(TELEGRAM_TIMEOUT_MS),
      });
      const result = await response.json().catch(() => null);
      if (!response.ok || !result?.ok) return { ok: false, reason: asText(result?.description || `TELEGRAM_HTTP_${response.status}`) };
      state.webhookUrl = webhookUrl;
      await this.#save(state);
      return { ok: true, url: webhookUrl };
    } catch (error) {
      return { ok: false, reason: asText(error?.message || error).replace(/https?:\/\/\S+/g, "[url]").slice(0, 180) };
    }
  }

  async setupWebhookOnce() {
    return this.#exclusive(async () => {
      const state = await this.#load();
      const configuredOrigin = String(this.env.WORKER_PUBLIC_ORIGIN || "").trim();
      let canonicalWebhook = "";
      try {
        const parsedOrigin = new URL(configuredOrigin);
        if (parsedOrigin.protocol === "https:" && parsedOrigin.hostname.endsWith(".workers.dev")
          && parsedOrigin.pathname === "/" && !parsedOrigin.search && !parsedOrigin.hash
          && !parsedOrigin.username && !parsedOrigin.password) {
          canonicalWebhook = `${parsedOrigin.origin}/telegram/webhook`;
        }
      } catch { /* an invalid origin is reported by #setWebhook */ }
      if (state.webhookUrl && state.webhookUrl === canonicalWebhook) return { ok: true, already: true, url: state.webhookUrl };
      // One-time bootstrap is required before Telegram can deliver the first private /start.
      if (state.security.ownerId) return { ok: false, reason: "OWNER_MUST_RECONNECT_FROM_PRIVATE_PANEL" };
      return this.#setWebhook(state);
    });
  }

  #updatePartition(update) {
    const chat = update?.message?.chat || update?.edited_message?.chat
      || update?.callback_query?.message?.chat || update?.my_chat_member?.chat
      || update?.chat_member?.chat || update?.chat_join_request?.chat;
    return chat?.id == null ? "system" : String(chat.id);
  }

  async handleUpdate(update) {
    const updateId = update?.update_id;
    if (!Number.isSafeInteger(updateId) || updateId < 0) return { queued: false, reason: "INVALID_UPDATE_ID" };
    const storage = this.ctx.storage;
    const key = `queue:v1:item:${String(updateId).padStart(20, "0")}`;
    const result = await storage.transaction(async (txn) => {
      const meta = await txn.get("queue:v1:meta") || { pendingCount: 0, seenIds: [] };
      if ((meta.seenIds || []).includes(updateId)) return { queued: true, duplicate: true };
      if (Number(meta.pendingCount || 0) >= 512) return { queued: false, reason: "QUEUE_FULL" };
      const partition = this.#updatePartition(update);
      await txn.put(key, { updateId, partition, update, createdAt: Date.now(), attempts: 0 });
      meta.pendingCount = Math.max(0, Number(meta.pendingCount || 0)) + 1;
      meta.seenIds = [...(meta.seenIds || []), updateId].slice(-4_096);
      meta.updatedAt = Date.now();
      await txn.put("queue:v1:meta", meta);
      return { queued: true, duplicate: false };
    });
    await storage.setAlarm(Date.now() + 50);
    return result;
  }

  async #drainUpdateQueue(batchSize = 8) {
    const rows = await this.ctx.storage.list({ prefix: "queue:v1:item:", limit: 512 });
    if (!rows?.size) return 0;
    const byPartition = new Map();
    for (const [key, item] of rows) {
      if (!item || !Number.isSafeInteger(item.updateId)) continue;
      const partition = String(item.partition || "system");
      if (!byPartition.has(partition)) byPartition.set(partition, []);
      byPartition.get(partition).push({ key, item });
    }
    for (const group of byPartition.values()) group.sort((a, b) => a.item.updateId - b.item.updateId);
    // Keep order within a chat while letting other partitions proceed during
    // a failed chat's bounded retry backoff.
    const now = Date.now();
    const partitions = [...byPartition.entries()]
      .filter(([, group]) => Number(group[0]?.item?.retryAt || 0) <= now)
      .map(([partition]) => partition)
      .sort((a, b) => a.localeCompare(b));
    const state = await this.#load();
    const cursor = String(state.queueCursor || "");
    const startAt = Math.max(0, partitions.findIndex((partition) => partition > cursor));
    const ordered = [...partitions.slice(startAt), ...partitions.slice(0, startAt)];
    const selected = ordered.slice(0, Math.max(1, Math.min(16, batchSize))).map((partition) => ({
      partition, ...byPartition.get(partition)[0],
    }));
    let completed = 0;
    for (const row of selected) {
      try {
        await this.#handleUpdateInner(row.item.update);
        state.queueCursor = row.partition;
        completed += 1;
      } catch (error) {
        const attempts = Number(row.item.attempts || 0) + 1;
        const latest = await this.#load();
        latest.queueCursor = row.partition;
        if (attempts < 3) {
          const retryAt = Date.now() + Math.min(30_000, 1_000 * (2 ** attempts));
          await this.ctx.storage.put(row.key, { ...row.item, attempts, lastErrorAt: Date.now(), retryAt });
          console.error("Queued update retry scheduled", row.item.updateId, row.partition, attempts);
          await this.ctx.storage.setAlarm(retryAt);
          continue;
        }
        latest.queueDeadLetters = Array.isArray(latest.queueDeadLetters) ? latest.queueDeadLetters : [];
        latest.queueDeadLetters.push({ updateId: row.item.updateId, chatId: row.partition, failedAt: Date.now(), attempts, error: asText(error?.message || error).slice(0, 120) });
        latest.queueDeadLetters = latest.queueDeadLetters.slice(-100);
        await this.#save(latest);
        console.error("Queued update moved to dead letter", row.item.updateId, row.partition);
      }
      await this.ctx.storage.transaction(async (txn) => {
        await txn.delete(row.key);
        const meta = await txn.get("queue:v1:meta") || { pendingCount: 0, seenIds: [] };
        meta.pendingCount = Math.max(0, Number(meta.pendingCount || 0) - 1);
        meta.lastProcessedAt = Date.now();
        await txn.put("queue:v1:meta", meta);
      });
    }
    const latest = await this.#load();
    latest.queueCursor = selected.at(-1)?.partition || latest.queueCursor;
    await this.#save(latest);
    return completed;
  }

  async #flushPendingState() {
    const pending = this.pendingState;
    if (!pending) return;
    await this.ctx.storage.put("state", pending);
    if (this.pendingState === pending) this.pendingState = null;
  }

  async #handleUpdateInner(update) {
    const updateId = update?.update_id;
    const hasUpdateId = Number.isSafeInteger(updateId) && updateId >= 0;
    const initial = await this.#load();
    // Commit completion before acknowledging the queue item. A retry after a
    // crash between the state write and queue deletion will then be idempotent.
    if (hasUpdateId && (initial.updateIds || []).includes(updateId)) return;
    await this.#processUpdateInner(update);
    if (hasUpdateId) {
      const completed = await this.#load();
      completed.updateIds = [...(completed.updateIds || []), updateId].slice(-4_096);
      await this.#save(completed);
    }
    await this.#flushPendingState();
  }

  async #processUpdateInner(update) {
    const state = await this.#load();
    const updateId = update?.update_id;
    const actorId = getTelegramUpdateActor(update);
    const bootstrapCandidate = isOwnerBootstrapUpdate(update);
    const reservation = this.#reserveWebhookRequest(state, actorId, bootstrapCandidate);
    await this.#save(state);
    if (!reservation.allowed) return;

    const callback = update?.callback_query;
    if (callback) {
      const callbackData = asText(callback.data);
      if (callbackData.startsWith("captcha:") || callbackData.startsWith("group:bot:") || callbackData.startsWith("tag:")
        || callbackData.startsWith("g5:") || callbackData.startsWith("t5:")) {
        await this.#handleCallback(state, callback);
      } else if (this.#isOwner(callback.from?.id, state) && isPrivate(callback.message?.chat)) {
        await this.#handleCallback(state, callback);
      } else {
        await this.#answerCallback(callback.id, this.#text(state, "access.denied", "این گزینه برای شما فعال نیست."));
      }
    } else if (update?.my_chat_member) {
      const botStatus = update.my_chat_member;
      const chat = botStatus.chat || {};
      const member = botStatus.new_chat_member || {};
      if (chat.type === "channel") {
        await this.#trackChannel(state, chat, member);
        if (this.#ownerId(state)) await this.#send(this.#ownerId(state), `📢 رویداد عضویت ربات در کانال ثبت شد: ${asText(chat.title || chat.id)} (${chat.id})؛ وضعیت: ${asText(member.status || "نامشخص")} .`, state, {}, { bypassLocalRate: true });
        return;
      }
      if (!isGroup(chat)) return;
      this.telegramCache.clear();
      await this.#trackGroup(state, chat, member);
      const nextStatus = member.status;
      if (["left", "kicked"].includes(nextStatus)) {
        state.botJoinState[String(chat.id)] = { ...(state.botJoinState[String(chat.id)] || {}), active: false, status: nextStatus, updatedAt: Date.now() };
        if (state.groupSettings[String(chat.id)]) {
          state.groupSettings[String(chat.id)].chatterEnabled = false;
          state.groupSettings[String(chat.id)].chatterNextAt = 0;
        }
        await this.#save(state);
        if (this.#ownerId(state)) await this.#send(this.#ownerId(state), `⚠️ ربات از «${asText(chat.title || chat.id)}» حذف شد یا دسترسی‌اش لغو شد.`, state, {}, { bypassLocalRate: true });
      } else if (["member", "administrator"].includes(nextStatus)) {
        const groupId = String(chat.id);
        // A group previously rejected only for being below the minimum size may
        // retry after growing and re-adding the bot. Explicit owner blocks remain.
        if (state.botJoinState[groupId]?.status === "left_minimum_members") {
          state.leftGroups = state.leftGroups.filter((id) => id !== groupId);
          state.botJoinState[groupId].active = false;
        }
        if (state.blockedGroups.includes(groupId) || state.leftGroups.includes(groupId)) {
          await this.#telegram(state, "leaveChat", { chat_id: chat.id }, { bypassLocalRate: true });
        } else {
          const join = state.botJoinState[groupId] || {};
          if (!join.active) {
            state.botJoinState[groupId] = { active: true, startedAt: Date.now(), status: "checking" };
            const countResult = await this.#telegram(state, "getChatMemberCount", { chat_id: chat.id }, { bypassLocalRate: true });
            if (!countResult?.ok || !Number.isInteger(countResult.result) || countResult.result < 0) {
              state.botJoinState[groupId].status = "count_unavailable";
              state.botJoinState[groupId].active = false;
              state.botJoinState[groupId].countCheckedAt = Date.now();
              await this.#save(state);
              if (this.#ownerId(state)) await this.#send(this.#ownerId(state), `⚠️ شمارش اعضای گروه ${asText(chat.title || chat.id)} (${groupId}) از تلگرام دریافت نشد؛ ربات گروه را ترک نکرد.`, state, {}, { bypassLocalRate: true });
            } else {
              state.groups[groupId].lastMemberCount = countResult.result;
              state.groups[groupId].lastMemberCountAt = Date.now();
              state.botJoinState[groupId].memberCount = countResult.result;
              state.botJoinState[groupId].countCheckedAt = Date.now();
              if (countResult.result < 25) {
                state.botJoinState[groupId].status = "rejected_too_small";
                await this.#save(state);
                await this.#send(chat.id, renderTemplate(this.#text(state, "group.minimumMembers", "⚠️ گروه باید حداقل ۲۵ عضو داشته باشد؛ تعداد گزارش‌شده توسط تلگرام: {members}."), { members: countResult.result }), state, {}, { bypassLocalRate: true, group: true });
                const left = await this.#telegram(state, "leaveChat", { chat_id: chat.id }, { bypassLocalRate: true });
                if (left.ok) {
                  state.groups[groupId].botStatus = "left";
                  state.leftGroups = [...new Set([...state.leftGroups, groupId])].slice(-2_000);
                  state.botJoinState[groupId].status = "left_minimum_members";
                } else {
                  state.botJoinState[groupId].active = false;
                  state.botJoinState[groupId].status = "leave_failed_minimum_members";
                }
                if (this.#ownerId(state)) await this.#send(this.#ownerId(state), `⚠️ گروه «${asText(chat.title || chat.id)}» به‌دلیل کمتر بودن تعداد اعضای گزارش‌شده از ۲۵، ${left.ok ? "ترک شد" : "قابل ترک نبود"}. تعداد گزارش‌شده: ${countResult.result}.`, state, {}, { bypassLocalRate: true });
              } else {
                state.botJoinState[groupId].status = "ready";
                await this.#save(state);
                await this.#send(chat.id, renderTemplate(this.#text(state, "group.ready", "✅ ربات با موفقیت به گروه اضافه شد و آمادهٔ کار است. تعداد اعضای گزارش‌شده توسط تلگرام: {members} (این عدد تفکیک انسان و ربات نیست)."), { members: countResult.result }), state, {
                  reply_markup: { inline_keyboard: [[{ text: "عضو شدن", style: "success", url: "https://t.me/MUNITOS" }]] },
                }, { bypassLocalRate: true, group: true });
                if (this.#ownerId(state)) await this.#send(this.#ownerId(state), `✅ ربات در گروه «${asText(chat.title || chat.id)}» فعال شد؛ تعداد اعضای گزارش‌شده توسط تلگرام: ${countResult.result}.`, state, {}, { bypassLocalRate: true });
              }
            }
          }
        }
      }
    } else if (update?.chat_member) {
      const memberUpdate = update.chat_member;
      const chat = memberUpdate.chat || {};
      if (!isGroup(chat)) return;
      const memberUser = memberUpdate.new_chat_member?.user;
      this.#rememberKnownMember(state, chat, memberUser);
      const oldStatus = memberUpdate.old_chat_member?.status;
      const newMember = memberUpdate.new_chat_member || {};
      if (["left", "kicked"].includes(newMember.status) && ["member", "restricted", "administrator", "creator"].includes(oldStatus)) {
        const anti = this.#db(state)?.features?.antiSpam || {};
        if (anti.signals?.joinLeaveBurst !== false) {
          const now = Date.now();
          const windowSeconds = clampNumber(anti.raid?.windowSeconds, 60, 10, 600);
          const leaves = (state.leaveWindows[String(chat.id)] || []).filter((item) => now - Number(item.at || 0) <= windowSeconds * 1_000);
          leaves.push({ at: now, userId: String(newMember.user?.id || "") });
          state.leaveWindows[String(chat.id)] = leaves.slice(-150);
          if (Object.keys(state.leaveWindows).length > 500) {
            for (const [staleChat, events] of Object.entries(state.leaveWindows)) {
              if (!Array.isArray(events) || !events.length || now - Number(events.at(-1)?.at || 0) > windowSeconds * 1_000 * 3) delete state.leaveWindows[staleChat];
              if (Object.keys(state.leaveWindows).length <= 400) break;
            }
          }
          const threshold = clampNumber(anti.raid?.maxLeaves, 10, 3, 100);
          if (this.#featureEnabled(state, "raidProtection", chat.id) && leaves.length >= threshold) {
            await this.#securityAlert(state, {
              chatId: String(chat.id), chatTitle: chat.title || String(chat.id), kind: "leave_burst",
              reason: `${leaves.length} خروج یا حذف عضو در ${windowSeconds} ثانیه؛ آستانه ${threshold}`,
              count: leaves.length, userIds: leaves.map((item) => item.userId).filter(Boolean).slice(-30),
              severity: leaves.length >= clampNumber(anti.raid?.escalationLeaves, 20, threshold, 200) ? 2 : 1,
              action: "رویدادها ثبت شدند؛ اقدام خودکار انجام نشد.",
            });
          }
        }
        if (this.#featureEnabled(state, "goodbye", chat.id)) {
          const goodbye = this.#db(state)?.features?.goodbye || {};
          await this.#send(chat.id, renderTemplate(goodbye.text || "👋 {name} از گروه خارج شد.", { name: userDisplay(newMember.user) }), state, {}, { group: true });
        }
      } else if (["member", "restricted"].includes(newMember.status) && ["left", "kicked"].includes(oldStatus)) {
        await this.#handleNewMembers(state, { chat, new_chat_members: [newMember.user].filter(Boolean) });
      }
    } else if (update?.chat_join_request) {
      const joinRequest = update.chat_join_request;
      if (!isGroup(joinRequest.chat)) return;
      await this.#trackGroup(state, joinRequest.chat);
      await this.#handleJoinRequest(state, joinRequest);
    } else {
      // channel_post and edited_channel_post are deliberately ignored: no channel response/moderation.
      const message = update?.message || update?.edited_message;
      if (message) {
        const chat = message.chat || {};
        if (isGroup(chat)) {
          const groupId = String(chat.id);
          if (state.blockedGroups.includes(groupId) || state.leftGroups.includes(groupId)) {
            await this.#telegram(state, "leaveChat", { chat_id: chat.id }, { bypassLocalRate: true });
          } else {
            await this.#trackGroup(state, chat);
            if (!state.groupSettings[groupId]) {
              state.groupSettings[groupId] = {
                botEnabled: true, chatterEnabled: false, chatterNextAt: 0,
                jokesEnabled: this.#db(state)?.groupSettings?.defaultJokesEnabled !== false,
                chatbotEnabled: this.#db(state)?.groupSettings?.defaultChatbotEnabled !== false,
              };
            }
            await this.#handleGroupMessage(state, { ...message, update_id: updateId });
            state.groupUsage[groupId] = Math.max(0, Number(state.groupUsage[groupId] || 0)) + 1;
            await this.#save(state);
          }
        } else if (isPrivate(chat)) {
          await this.#handlePrivateMessage(state, { ...message, update_id: updateId });
        }
      }
    }

  }

  async #scheduleNext(state) {
    const due = [];
    const queueMeta = await this.ctx.storage.get("queue:v1:meta");
    if (Number(queueMeta?.pendingCount || 0) > 0) {
      const queuedRows = await this.ctx.storage.list({ prefix: "queue:v1:item:", limit: 512 });
      const queueDue = [...queuedRows.values()].map((item) => {
        const retryAt = Number(item?.retryAt || 0);
        return retryAt > Date.now() ? retryAt : Date.now() + 100;
      });
      due.push(queueDue.length ? Math.min(...queueDue) : Date.now() + 100);
    }
    if (state.forwardTask?.active) due.push(Number(state.forwardTask.nextAt || Date.now() + 1_000));
    if (state.broadcastQueue && Number(state.broadcastQueue.index || 0) < (state.broadcastQueue.chatIds || []).length) {
      due.push(Math.max(Date.now() + 250, Number(state.broadcastQueue.nextAt || Date.now() + 1_200)));
    }
    {
      for (const [chatId, settings] of Object.entries(state.groupSettings || {})) {
        if (this.#featureEnabled(state, "chatter", chatId) && settings.chatterEnabled && settings.chatterNextAt) due.push(Number(settings.chatterNextAt));
      }
    }
    if (Object.keys(state.resourceRegistry || {}).length || (state.pendingResourceCleanup || []).length || (state.pendingResourceKeyCleanup || []).length) {
      if (!state.maintenanceNextAt) state.maintenanceNextAt = Date.now() + 30 * 60_000;
      due.push(Number(state.maintenanceNextAt));
    }
    const verificationExpiries = Object.values(state.pendingVerifications || {}).map((item) => Number(item.expiresAt || 0)).filter((time) => time > Date.now());
    if (verificationExpiries.length) due.push(Math.min(...verificationExpiries));
    if (due.length) {
      const target = Math.max(Date.now() + 250, Math.min(...due));
      const current = await this.ctx.storage.getAlarm();
      if (!Number.isFinite(current) || Math.abs(current - target) > 1_000) await this.ctx.storage.setAlarm(target);
    } else if (await this.ctx.storage.getAlarm()) {
      await this.ctx.storage.deleteAlarm();
    }
  }

  async #runForward(state, now) {
    const task = state.forwardTask;
    if (!task?.active || Number(task.nextAt || 0) > now) return;
    if (!this.#featureEnabled(state, "forwarding")) {
      task.active = false;
      task.stoppedAt = now;
      await this.#save(state);
      return;
    }

    if (["channel"].includes(String(task.targetType || "").toLowerCase())) {
      task.active = false;
      task.stoppedAt = now;
      task.stopReason = "channel_publishing_disabled_in_v4_2";
      await this.#save(state);
      if (this.#ownerId(state)) await this.#send(this.#ownerId(state), "⚠️ زمان‌بندی قدیمی که مقصد آن کانال بود متوقف شد؛ انتشار مستقیم در کانال در نسخهٔ جدید غیرفعال است. جزئیات زمان‌بندی در state حفظ شده است.", state, {}, { bypassLocalRate: true });
      return;
    }
    const result = await this.#telegram(state, "forwardMessage", {
      chat_id: task.targetChatId,
      from_chat_id: task.sourceChatId,
      message_id: task.messageId,
    }, {
      group: task.targetType === "group" || task.targetType === "supergroup",
      minIntervalMs: Number(task.targetType === "group" || task.targetType === "supergroup"
        ? this.#db(state)?.limits?.groupSendIntervalMs || 3_200
        : this.#db(state)?.limits?.channelSendIntervalMs || 1_100),
    });

    if (result.ok) {
      task.sent = Number(task.sent || 0) + 1;
      task.failures = 0;
      if (task.remaining != null) {
        task.remaining -= 1;
        if (task.remaining <= 0) {
          task.active = false;
          task.completedAt = now;
          await this.#save(state);
          await this.#send(this.#ownerId(state), renderTemplate(this.#text(state, "forward.completed", "✅ فوروارد تکمیل شد. تعداد موفق: {sent}"), { sent: task.sent }), state);
          return;
        }
      }
      task.nextAt = now + Math.max(10_000, Number(task.intervalMs) || 10_000);
      await this.#save(state);
      return;
    }

    const code = Number(result.error_code || 0);
    const retryAfter = Number(result.parameters?.retry_after || 0);
    if (code === 429 || result.description === "LOCAL_ANTI_SPAM_RATE_LIMIT") {
      task.nextAt = now + Math.max(3_200, (retryAfter || 5) * 1_000);
      await this.#save(state);
      return;
    }
    task.failures = Number(task.failures || 0) + 1;
    if ([400, 401, 403, 404].includes(code) || task.failures >= 5) {
      task.active = false;
      task.stoppedAt = now;
      await this.#save(state);
      await this.#send(this.#ownerId(state), renderTemplate(this.#text(state, "forward.failed", "❌ زمان‌بندی متوقف شد. کد: {code}؛ توضیح: {reason}"), {
        code: code || "نامشخص", reason: asText(result.description || "خطای تلگرام").slice(0, 160),
      }), state);
      return;
    }
    task.nextAt = now + Math.min(15 * 60_000, task.failures * 60_000);
    await this.#save(state);
  }

  async #runChatter(state, now) {
    const db = this.#db(state);
    const feature = db?.features?.chatter || {};
    const baseIntervalMs = clampNumber(feature.intervalMinutes, 45, 20, 1_440) * 60_000;
    const jitterMs = clampNumber(feature.jitterMinutes, 8, 0, 120) * 60_000;
    const dailyCap = clampNumber(feature.maxDailyPerGroup, 24, 1, 100);
    const quiet = feature.quietHours || {};
    const parseMinutes = (value, fallback) => {
      const match = String(value || "").match(/^(\d{1,2}):(\d{2})$/);
      if (!match) return fallback;
      const hours = Number(match[1]);
      const minutes = Number(match[2]);
      return hours < 24 && minutes < 60 ? hours * 60 + minutes : fallback;
    };
    let localMinutes = 0;
    try {
      const parts = new Intl.DateTimeFormat("en-GB", {
        timeZone: String(quiet.timezone || "UTC"), hour: "2-digit", minute: "2-digit", hourCycle: "h23",
      }).formatToParts(new Date(now));
      localMinutes = Number(parts.find((part) => part.type === "hour")?.value || 0) * 60
        + Number(parts.find((part) => part.type === "minute")?.value || 0);
    } catch { localMinutes = new Date(now).getUTCHours() * 60 + new Date(now).getUTCMinutes(); }
    const quietStart = parseMinutes(quiet.start, 60);
    const quietEnd = parseMinutes(quiet.end, 480);
    const isQuiet = quiet.enabled === true && (quietStart < quietEnd
      ? localMinutes >= quietStart && localMinutes < quietEnd
      : localMinutes >= quietStart || localMinutes < quietEnd);
    let quietWaitMs = 0;
    if (isQuiet) {
      const minutesToEnd = (quietEnd - localMinutes + 1_440) % 1_440 || 1;
      quietWaitMs = minutesToEnd * 60_000;
    }

    let sendsThisAlarm = 0;
    for (const [chatId, settings] of Object.entries(state.groupSettings || {})) {
      if (!settings.chatterEnabled || settings.botEnabled === false || !this.#featureEnabled(state, "chatter", chatId) || Number(settings.chatterNextAt || 0) > now) continue;
      const today = utcDay(now);
      if (settings.chatterDay !== today) {
        settings.chatterDay = today;
        settings.chatterCount = 0;
      }
      if (Number(settings.chatterCount || 0) >= dailyCap) {
        settings.chatterNextAt = nextUtcMidnightMs(now);
        continue;
      }
      if (isQuiet) {
        settings.chatterNextAt = now + quietWaitMs;
        continue;
      }
      if (sendsThisAlarm >= 4) {
        settings.chatterNextAt = now + 30_000;
        continue;
      }
      const text = randomItem(feature.items, "");
      if (text) {
        sendsThisAlarm += 1;
        const result = await this.#send(chatId, text, state, {}, { group: true });
        if (result.ok) {
          settings.chatterCount = Number(settings.chatterCount || 0) + 1;
        }
        const retry = Number(result.parameters?.retry_after || 0);
        const jitter = jitterMs ? Math.floor(Math.random() * (jitterMs + 1)) : 0;
        settings.chatterNextAt = now + (retry ? retry * 1_000 : baseIntervalMs + jitter);
      } else {
        settings.chatterNextAt = now + baseIntervalMs;
      }
    }
    await this.#save(state);
  }

  async #runBroadcast(state, now) {
    const queue = state.broadcastQueue;
    if (!queue) return;
    const ids = Array.isArray(queue.chatIds) ? queue.chatIds : [];
    const index = Math.max(0, Number(queue.index) || 0);
    if (index >= ids.length) {
      const sent = Number(queue.sent || 0);
      const failed = Number(queue.failed || 0);
      state.broadcastQueue = null;
      await this.#save(state);
      if (this.#ownerId(state)) await this.#send(this.#ownerId(state), `✅ ارسال همگانی تمام شد.\nارسال موفق: ${sent}\nناموفق: ${failed}`, state, { reply_markup: this.#authorHomeKeyboard() }, { bypassLocalRate: true });
      return;
    }
    const chatId = ids[index];
    let result;
    if (queue.hasMedia) {
      result = await this.#telegram(state, "copyMessage", {
        chat_id: chatId, from_chat_id: queue.sourceChatId, message_id: queue.sourceMessageId,
      }, { group: true, minIntervalMs: 3_500 });
    } else {
      result = await this.#send(chatId, queue.text || " ", state, {}, { group: true, minIntervalMs: 3_500 });
    }
    const retryAfter = Number(result.parameters?.retry_after || 0);
    if (!result.ok && (Number(result.error_code) === 429 || result.description === "LOCAL_ANTI_SPAM_RATE_LIMIT")) {
      queue.nextAt = now + Math.max(3_500, retryAfter * 1_000 || 3_500);
      await this.#save(state);
      await this.ctx.storage.setAlarm(queue.nextAt);
      return;
    }
    if (result.ok) {
      queue.sent = Number(queue.sent || 0) + 1;
      state.groupUsage[String(chatId)] = Number(state.groupUsage[String(chatId)] || 0) + 1;
    } else {
      queue.failed = Number(queue.failed || 0) + 1;
      queue.lastError = asText(result.description || "unknown").slice(0, 120);
    }
    queue.index = index + 1;
    queue.nextAt = now + 3_500;
    await this.#save(state);
    await this.ctx.storage.setAlarm(queue.nextAt);
  }

  async alarm() {
    return this.#exclusive(() => this.#alarmInner());
  }

  async #alarmInner() {
    let state = await this.#load();
    const now = Date.now();
    try {
      await this.#drainUpdateQueue(clampNumber(this.#db(state)?.limits?.queueBatchSize, 8, 1, 16));
    } catch (error) {
      console.error("Durable update queue batch failed", asText(error?.message || error).slice(0, 120));
    }
    state = await this.#load();
    try {
      await this.#completeResourceCleanup(state, 256);
    } catch (error) {
      console.error("Resource cleanup batch failed; will retry", error);
      state.maintenanceNextAt = Date.now() + 60_000;
      await this.#save(state);
    }
    await this.#sweepResources(state, now);
    await this.#runBroadcast(state, now);
    await this.#runForward(state, now);
    await this.#runChatter(state, now);
    await this.#expireVerifications(state, now);
    await this.#scheduleNext(state);
  }

}
