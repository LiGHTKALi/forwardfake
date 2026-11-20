import { DurableObject } from "cloudflare:workers";
import DEFAULT_DATABASE from "./database.js";
import {
  WorkflowInterpreter,
  cronMatches,
  extractUpdateContext,
  matchCommand,
  matchesEvent,
  ownerInstallIntent,
  parseCommandText,
  parseDatabaseModule,
  validateDatabase,
} from "./engine.js";

const RUNTIME_VERSION = "8.0.0";
const DURABLE_OBJECT_NAME = "munitos-primary";

// Requested fixed credentials from the previous MUNITOS Worker source.
// Keep these constants private to this file; never write them to logs or responses.
const EMBEDDED_BOT_TOKEN = "9100041417:AAHYOpFKKTGpBQpdHoTAExwZYzlXPqOtSjg";
const EMBEDDED_OWNER_TELEGRAM_ID = "8621035125";
const EMBEDDED_WEBHOOK_SECRET = "75ybHg-JiStAC1ZvzatC2P878iQPWPFq1s-FXmSNvIKOTnio";

const MAX_UPDATE_BYTES = 2_000_000;
const MAX_DATABASE_BYTES = 1_500_000;
const MAX_HTTP_BODY_BYTES = 1_048_576;
const INSTALL_SESSION_SECONDS = 600;
const MAX_STATE_VALUE_BYTES = 512_000;
const MAX_QUEUE_INPUT_BYTES = 256_000;
const TELEGRAM_API_BASE = "https://api.telegram.org/bot";
const TELEGRAM_FILE_BASE = "https://api.telegram.org/file/bot";

function jsonResponse(value, status = 200) {
  return new Response(JSON.stringify(value), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" },
  });
}

function asString(value) {
  return value == null ? "" : String(value);
}

function parseJson(value, fallback = null) {
  try { return JSON.parse(value); } catch { return fallback; }
}

function utf8Size(value) {
  return new TextEncoder().encode(value).byteLength;
}

function randomId() {
  return crypto.randomUUID();
}

function sha256Hex(value) {
  return crypto.subtle.digest("SHA-256", new TextEncoder().encode(value)).then((digest) =>
    [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join(""),
  );
}

function getUpdateType(update) {
  if (!update || typeof update !== "object") return "unknown";
  return Object.keys(update).find((key) => key !== "update_id") || "unknown";
}

function updateEventNames(update) {
  const type = getUpdateType(update);
  const names = [type];
  const { message } = extractUpdateContext(update);
  if (message?.new_chat_members?.length) names.push("new_chat_members");
  if (message?.left_chat_member) names.push("left_chat_member");
  return names;
}

function isPrivate(chat) {
  return chat?.type === "private";
}

function normalizeScope(chatType) {
  if (chatType === "private") return "private";
  if (chatType === "group" || chatType === "supergroup") return "group";
  if (chatType === "channel") return "channel";
  return "any";
}

function isPrivateOrGroupScope(expected, actualChatType) {
  if (!expected || expected === "any") return true;
  if (expected === "group") return actualChatType === "group" || actualChatType === "supergroup";
  return expected === actualChatType;
}

function safeSqlJson(value) {
  const serialized = JSON.stringify(value ?? null);
  if (utf8Size(serialized) > MAX_STATE_VALUE_BYTES) throw new Error("state_value_too_large");
  return serialized;
}


async function readResponseBytesLimited(response, maxBytes) {
  if (!response.body) return new Uint8Array();
  const reader = response.body.getReader();
  const chunks = [];
  let total = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > maxBytes) {
      try { await reader.cancel(); } catch { /* ignore */ }
      throw new Error("http_response_too_large");
    }
    chunks.push(value);
  }
  const merged = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) { merged.set(chunk, offset); offset += chunk.byteLength; }
  return merged;
}

async function readResponseLimited(response, maxBytes) {
  return new TextDecoder().decode(await readResponseBytesLimited(response, maxBytes));
}

function isPrivateHost(hostname) {
  const host = String(hostname || "").toLowerCase().replace(/^\[|\]$/g, "");
  if (!host || host === "localhost" || host.endsWith(".localhost") || host.endsWith(".local") || host.endsWith(".internal")) return true;
  if (host.includes(":")) {
    return host === "::" || host === "::1" || host.startsWith("fc") || host.startsWith("fd") || host.startsWith("fe8") || host.startsWith("fe9") || host.startsWith("fea") || host.startsWith("feb") || host.startsWith("::ffff:127.");
  }
  const parts = host.split(".");
  if (parts.length !== 4 || !parts.every((part) => /^\d+$/.test(part) && Number(part) <= 255)) return false;
  const [a, b] = parts.map(Number);
  return a === 0 || a === 10 || a === 127 || a === 169 && b === 254 || a === 172 && b >= 16 && b <= 31
    || a === 192 && b === 168 || a === 100 && b >= 64 && b <= 127
    || a === 192 && b === 0 || a === 198 && (b === 18 || b === 19 || b === 51) || a === 203 && b === 0;
}

function validateExternalUrl(value, httpSettings) {
  const url = new URL(String(value));
  if (url.username || url.password) throw new Error("http_url_credentials_forbidden");
  if (isPrivateHost(url.hostname)) throw new Error("http_private_host_forbidden");
  if (url.protocol !== "https:") {
    const allow = Array.isArray(httpSettings?.allowInsecureHosts) && httpSettings.allowInsecureHosts.includes(url.hostname);
    if (httpSettings?.requireHttps !== false || url.protocol !== "http:" || !allow) throw new Error("http_https_required");
  }
  return url;
}

function formatPeriodKey(timeZone, timestamp) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: timeZone || "UTC", year: "numeric", month: "2-digit",
  }).formatToParts(new Date(timestamp));
  const year = parts.find((part) => part.type === "year")?.value || "0000";
  const month = parts.find((part) => part.type === "month")?.value || "00";
  return `${year}-${month}`;
}

function buildCommandMenu(database, ownerOnly = false) {
  const result = [];
  const seen = new Set();
  for (const [id, command] of Object.entries(database.commands || {})) {
    const roles = Array.isArray(command.roles) ? command.roles : ["any"];
    const isOwner = roles.includes("owner") && !roles.includes("any") && !roles.includes("admin") && !roles.includes("member");
    if (ownerOnly !== isOwner) continue;
    const trigger = (command.triggers || []).find((value) => String(value).startsWith("/"));
    if (!trigger) continue;
    const name = trigger.slice(1).split("@")[0].toLowerCase();
    if (!/^[a-z0-9_]{1,32}$/.test(name) || seen.has(name) || result.length >= 98) continue;
    seen.add(name);
    result.push({ command: name, description: String(command.description || id).slice(0, 256) });
  }
  if (ownerOnly && database.menus?.includeInstallCommand !== false) result.unshift({ command: "install", description: "Install database.js" });
  return result.slice(0, 100);
}

export class MunitosRuntime extends DurableObject {
  constructor(ctx, env) {
    super(ctx, env);
    this.ctx = ctx;
    this.env = env;
    this.sql = ctx.storage.sql;
    this.databaseCache = null;
    this.telegramNextAt = 0;
    this.queueDirty = false;
    this.operationTail = Promise.resolve();
    this.initializeStorage();
  }

  runExclusive(operation) {
    const current = this.operationTail.then(operation, operation);
    this.operationTail = current.catch(() => undefined);
    return current;
  }

  initializeStorage() {
    this.sql.exec(`
      CREATE TABLE IF NOT EXISTS application_config (
        id INTEGER PRIMARY KEY CHECK (id = 1),
        source TEXT NOT NULL,
        version TEXT NOT NULL,
        sha256 TEXT NOT NULL,
        installed_at INTEGER NOT NULL
      )
    `);
    this.sql.exec(`
      CREATE TABLE IF NOT EXISTS operational_state (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL,
        updated_at INTEGER NOT NULL
      )
    `);
    this.sql.exec(`
      CREATE TABLE IF NOT EXISTS queued_jobs (
        id TEXT PRIMARY KEY,
        workflow TEXT NOT NULL,
        input TEXT NOT NULL,
        run_at INTEGER NOT NULL,
        attempts INTEGER NOT NULL DEFAULT 0,
        max_attempts INTEGER NOT NULL DEFAULT 5,
        status TEXT NOT NULL DEFAULT 'pending',
        last_error TEXT,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      )
    `);
    this.sql.exec("CREATE INDEX IF NOT EXISTS queued_jobs_due_idx ON queued_jobs(status, run_at)");
    this.sql.exec(`
      CREATE TABLE IF NOT EXISTS processed_updates (
        update_id TEXT PRIMARY KEY,
        processed_at INTEGER NOT NULL
      )
    `);
    this.sql.exec(`
      CREATE TABLE IF NOT EXISTS runtime_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        level TEXT NOT NULL,
        code TEXT NOT NULL,
        detail TEXT,
        created_at INTEGER NOT NULL
      )
    `);

    const row = this.sql.exec("SELECT id FROM application_config WHERE id = 1").toArray()[0];
    if (!row) {
      const source = JSON.stringify(DEFAULT_DATABASE);
      const validation = validateDatabase(DEFAULT_DATABASE);
      this.sql.exec(
        "INSERT INTO application_config (id, source, version, sha256, installed_at) VALUES (1, ?, ?, ?, ?)",
        source,
        String(DEFAULT_DATABASE.manifest.version || "0.0.0"),
        "embedded-default",
        Date.now(),
      );
      this.logSync("info", "database.initialized", JSON.stringify(validation));
    }
  }

  loadDatabase() {
    if (this.databaseCache) return this.databaseCache;
    const row = this.sql.exec("SELECT source FROM application_config WHERE id = 1").toArray()[0];
    if (!row?.source) return DEFAULT_DATABASE;
    const database = parseJson(row.source, null);
    if (!database) throw new Error("active_database_corrupt");
    validateDatabase(database);
    this.databaseCache = database;
    return database;
  }

  runtimeContext(database, now = Date.now()) {
    return {
      runtime: {
        name: "MUNITOS",
        version: RUNTIME_VERSION,
        now,
        iso: new Date(now).toISOString(),
        webhookUrl: String(this.env.WEBHOOK_URL || ""),
        webhookSecret: EMBEDDED_WEBHOOK_SECRET,
        botToken: undefined,
        profile: database.profile || { name: "MUNITOS" },
        commandMenu: buildCommandMenu(database, false),
        ownerCommandMenu: buildCommandMenu(database, true),
        syncTelegramCommands: database.menus?.syncTelegramCommands !== false,
        app: JSON.parse(JSON.stringify(database)),
        allowedUpdates: Array.isArray(database.telegram?.webhook?.allowedUpdates)
          ? database.telegram.webhook.allowedUpdates
          : ["message", "edited_message", "channel_post", "edited_channel_post", "callback_query", "my_chat_member", "chat_member", "chat_join_request"],
        dropPendingUpdates: database.telegram?.webhook?.dropPendingUpdates === true,
        maxWebhookConnections: Math.min(100, Math.max(1, Number(database.telegram?.webhook?.maxConnections) || 40)),
        storage: "durable-object-sqlite",
      },
      owner: { id: Number(EMBEDDED_OWNER_TELEGRAM_ID) },
      bot: { username: String(this.getRawState("global:bot:username") || "") },
    };
  }

  buildContext(update, database, now = Date.now()) {
    const { message, chat, user } = extractUpdateContext(update);
    const owner = Boolean(user && String(user.id) === EMBEDDED_OWNER_TELEGRAM_ID);
    return {
      ...this.runtimeContext(database, now),
      update,
      updateType: getUpdateType(update),
      message,
      chat,
      user,
      reply: message?.reply_to_message || null,
      callback: update?.callback_query || null,
      myChatMember: update?.my_chat_member || null,
      chatMember: update?.chat_member || null,
      joinRequest: update?.chat_join_request || null,
      owner: { id: Number(EMBEDDED_OWNER_TELEGRAM_ID), isOwner: owner },
      features: database.features || {},
      modules: database.modules || {},
      policies: database.policies || {},
      args: [],
      argsText: "",
    };
  }

  fullStateKey(args, context) {
    const scope = String(args.scope || "chat");
    const key = String(args.key || "");
    const allowedNamespaces = this.loadDatabase().storage?.namespaces || ["global", "chat", "user", "chat_user"];
    if (!allowedNamespaces.includes(scope)) throw new Error("state_scope_not_enabled");
    if (!key || key.length > 300 || key.includes("\0")) throw new Error("state_key_invalid");
    if (scope === "global") return `global:${key}`;
    if (scope === "chat") {
      if (!context.chat?.id) throw new Error("state_chat_scope_unavailable");
      return `chat:${context.chat.id}:${key}`;
    }
    if (scope === "user") {
      if (!context.user?.id) throw new Error("state_user_scope_unavailable");
      return `user:${context.user.id}:${key}`;
    }
    if (scope === "chat_user") {
      if (!context.chat?.id || !context.user?.id) throw new Error("state_chat_user_scope_unavailable");
      return `chat_user:${context.chat.id}:${context.user.id}:${key}`;
    }
    throw new Error("state_scope_invalid");
  }

  getRawState(key) {
    const row = this.sql.exec("SELECT value FROM operational_state WHERE key = ?", key).toArray()[0];
    return row ? parseJson(row.value, null) : undefined;
  }

  setRawState(key, value) {
    const serialized = safeSqlJson(value);
    this.sql.exec(
      "INSERT INTO operational_state (key, value, updated_at) VALUES (?, ?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at",
      key, serialized, Date.now(),
    );
  }

  deleteRawState(key) {
    this.sql.exec("DELETE FROM operational_state WHERE key = ?", key);
  }

  stateOperation(operation, args, context) {
    if (operation === "list") {
      const scope = String(args.scope || "global");
      const allowedNamespaces = this.loadDatabase().storage?.namespaces || ["global", "chat", "user", "chat_user"];
      if (!allowedNamespaces.includes(scope)) throw new Error("state_scope_not_enabled");
      const rawPrefix = String(args.prefix || "");
      let prefix;
      if (scope === "global") prefix = `global:${rawPrefix}`;
      else if (scope === "chat") prefix = `chat:${context.chat?.id || ""}:${rawPrefix}`;
      else if (scope === "user") prefix = `user:${context.user?.id || ""}:${rawPrefix}`;
      else if (scope === "chat_user") prefix = `chat_user:${context.chat?.id || ""}:${context.user?.id || ""}:${rawPrefix}`;
      else throw new Error("state_list_scope_invalid");
      const limit = Math.min(2000, Math.max(1, Number(args.limit) || 100));
      const rows = this.sql.exec(
        "SELECT key, value, updated_at FROM operational_state WHERE substr(key, 1, ?) = ? ORDER BY key LIMIT ?",
        prefix.length, prefix, limit,
      ).toArray();
      return {
        count: rows.length,
        items: rows.map((row) => ({
          key: row.key.slice(prefix.length),
          value: parseJson(row.value, null),
          updatedAt: row.updated_at,
        })),
      };
    }

    const key = this.fullStateKey(args, context);
    if (operation === "get") {
      const value = this.getRawState(key);
      return value === undefined ? (args.default ?? null) : value;
    }
    if (operation === "set") {
      this.setRawState(key, args.value);
      return args.value;
    }
    if (operation === "delete") {
      this.deleteRawState(key);
      return true;
    }
    if (operation === "increment") {
      const oldValue = Number(this.getRawState(key) ?? 0);
      const increment = Number(args.by ?? 1);
      if (!Number.isFinite(oldValue) || !Number.isFinite(increment)) throw new Error("state_increment_number_required");
      const next = oldValue + increment;
      this.setRawState(key, next);
      return next;
    }
    throw new Error("state_operation_invalid");
  }

  quotaOperation(operation, args, context, database) {
    const chatId = String(args.chatId ?? context.chat?.id ?? "");
    if (!chatId) throw new Error("quota_chat_id_required");
    const quotaName = String(args.quota || "default");
    const quotaConfig = database.quotas || {};
    const planKey = `global:plan:${chatId}`;
    const plan = String(this.getRawState(planKey) || quotaConfig.defaultPlan || "free");
    const planLimits = quotaConfig.plans?.[plan] || quotaConfig.plans?.[quotaConfig.defaultPlan] || {};
    const limitRaw = planLimits[`${quotaName}Monthly`] ?? planLimits[quotaName] ?? 0;
    const limit = Number(limitRaw);
    const period = quotaConfig.period === "month" ? formatPeriodKey(quotaConfig.timeZone || "UTC", Date.now()) : "all";
    const key = `global:quota:${quotaName}:${period}:${chatId}`;
    const used = Number(this.getRawState(key) ?? 0);
    const allowed = limit < 0 || used < limit;
    if (operation === "consume" && allowed && limit >= 0) this.setRawState(key, used + 1);
    const nextUsed = operation === "consume" && allowed && limit >= 0 ? used + 1 : used;
    return {
      allowed,
      quota: quotaName,
      chatId,
      plan,
      period,
      used: nextUsed,
      limit: limit < 0 ? "unlimited" : limit,
      remaining: limit < 0 ? "unlimited" : Math.max(0, limit - nextUsed),
    };
  }

  async waitTelegramTurn() {
    const now = Date.now();
    const wait = Math.max(0, this.telegramNextAt - now);
    this.telegramNextAt = Math.max(now, this.telegramNextAt) + 35;
    if (wait > 0) await new Promise((resolve) => setTimeout(resolve, wait));
  }

  async callTelegram(method, payload = {}, files = {}, options = {}) {
    const configuredDatabase = this.databaseCache
      || parseJson(this.sql.exec("SELECT source FROM application_config WHERE id = 1").toArray()[0]?.source, DEFAULT_DATABASE);
    if (configuredDatabase?.integrations?.telegram?.enabled === false && options.allowDisabled !== true) throw new Error("telegram_integration_disabled");
    const apiMethod = String(method || "").trim();
    if (!/^[A-Za-z][A-Za-z0-9]{1,80}$/.test(apiMethod)) throw new Error("telegram_method_invalid");
    await this.waitTelegramTurn();
    const fileEntries = files && typeof files === "object" ? Object.entries(files) : [];
    let body;
    let headers;
    if (fileEntries.length) {
      const form = new FormData();
      for (const [key, value] of Object.entries(payload ?? {})) {
        if (value === undefined || value === null) continue;
        form.set(key, typeof value === "object" ? JSON.stringify(value) : String(value));
      }
      for (const [field, specRaw] of fileEntries) {
        const spec = typeof specRaw === "string" ? { value: specRaw } : (specRaw || {});
        if (spec.file_id || spec.value) {
          form.set(field, String(spec.file_id || spec.value));
          continue;
        }
        if (!spec.url) throw new Error(`telegram_file_source_missing:${field}`);
        if (spec.upload !== true) {
          form.set(field, String(spec.url));
          continue;
        }
        const fileUrl = validateExternalUrl(spec.url, { requireHttps: true });
        const fileController = new AbortController();
        const fileTimer = setTimeout(() => fileController.abort("telegram_file_timeout"), 15_000);
        let fileResponse;
        let bytes;
        try {
          fileResponse = await fetch(fileUrl, { redirect: "error", signal: fileController.signal });
          if (!fileResponse.ok) throw new Error(`telegram_file_fetch_${fileResponse.status}:${field}`);
          bytes = await readResponseBytesLimited(fileResponse, 18 * 1024 * 1024);
        } finally {
          clearTimeout(fileTimer);
        }
        const contentType = String(spec.contentType || fileResponse.headers.get("content-type") || "application/octet-stream");
        const filename = String(spec.filename || `upload-${field}`).slice(0, 128);
        form.set(field, new Blob([bytes], { type: contentType }), filename);
      }
      body = form;
      headers = undefined;
    } else {
      body = JSON.stringify(payload ?? {});
      headers = { "content-type": "application/json" };
    }
    const response = await fetch(`${TELEGRAM_API_BASE}${EMBEDDED_BOT_TOKEN}/${apiMethod}`, {
      method: "POST",
      headers,
      body,
    });
    const raw = await readResponseLimited(response, 2 * 1024 * 1024);
    const result = parseJson(raw, null);
    if (!response.ok || !result || result.ok !== true) {
      const code = result?.error_code || response.status;
      const description = String(result?.description || "telegram_api_request_failed").slice(0, 500);
      throw new Error(`telegram_api_${code}:${description}`);
    }
    return result.result ?? true;
  }

  async requestExternal(request, context, database) {
    if (database.integrations?.http?.enabled === false) throw new Error("http_integration_disabled");
    const httpSettings = database.settings?.http || {};
    const method = String(request.method || "GET").toUpperCase();
    if (!["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD"].includes(method)) throw new Error("http_method_forbidden");
    let url = validateExternalUrl(request.url, httpSettings);
    for (const [key, value] of Object.entries(request.query || {})) {
      if (value !== undefined && value !== null) url.searchParams.set(key, typeof value === "object" ? JSON.stringify(value) : String(value));
    }
    const headers = new Headers();
    for (const [key, value] of Object.entries(request.headers || {})) {
      if (/^(host|content-length|connection|transfer-encoding)$/i.test(key)) continue;
      headers.set(key, String(value));
    }

    const timeoutMs = Math.min(30_000, Math.max(1000, Number(request.timeoutMs || httpSettings.timeoutMs || 12000)));
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort("http_timeout"), timeoutMs);
    let currentMethod = method;
    let body;
    if (!["GET", "HEAD"].includes(currentMethod) && request.body !== undefined && request.body !== null) {
      if (request.bodyType === "form") {
        const form = new URLSearchParams();
        for (const [key, value] of Object.entries(request.body)) form.set(key, String(value ?? ""));
        body = form;
      } else if (typeof request.body === "string") {
        body = request.body;
      } else {
        body = JSON.stringify(request.body);
        if (!headers.has("content-type")) headers.set("content-type", "application/json");
      }
    }
    if (body && utf8Size(typeof body === "string" ? body : body.toString()) > MAX_HTTP_BODY_BYTES) {
      clearTimeout(timer);
      throw new Error("http_request_body_too_large");
    }

    try {
      let response;
      let redirects = 0;
      while (true) {
        response = await fetch(url, { method: currentMethod, headers, body, signal: controller.signal, redirect: "manual" });
        if (![301, 302, 303, 307, 308].includes(response.status)) break;
        if (redirects >= Math.min(5, Number(httpSettings.maxRedirects ?? 3))) throw new Error("http_redirect_limit");
        const location = response.headers.get("location");
        if (!location) throw new Error("http_redirect_without_location");
        const nextUrl = validateExternalUrl(new URL(location, url).toString(), httpSettings);
        if (nextUrl.origin !== url.origin) {
          headers.delete("authorization");
          headers.delete("proxy-authorization");
          headers.delete("cookie");
          headers.delete("x-api-key");
        }
        if (response.status === 303 || ((response.status === 301 || response.status === 302) && currentMethod === "POST")) {
          currentMethod = "GET";
          body = undefined;
        }
        url = nextUrl;
        redirects++;
      }
      const maxResponse = Math.min(MAX_HTTP_BODY_BYTES, Math.max(1024, Number(httpSettings.maxResponseBytes || MAX_HTTP_BODY_BYTES)));
      const text = await readResponseLimited(response, maxResponse);
      const responseType = String(request.response || "json").toLowerCase();
      const parsed = responseType === "text" ? text : parseJson(text, text);
      const output = { ok: response.ok, status: response.status, headers: Object.fromEntries(response.headers), data: parsed, url: url.toString() };
      if (!response.ok && request.acceptHttpErrors !== true) throw new Error(`http_status_${response.status}:${text.slice(0, 300)}`);
      return output;
    } finally {
      clearTimeout(timer);
    }
  }

  async callConfiguredApi(apiId, apiDefinition, input, context, database) {
    const apiContext = { ...context, input: input || {} };
    const resolved = this.resolveConfigValue(apiDefinition, apiContext);
    return this.requestExternal(resolved, apiContext, database);
  }

  resolveConfigValue(value, context) {
    if (typeof value === "string") {
      const exact = /^\{\{\s*([^{}]+?)\s*\}\}$/.exec(value);
      const get = (path) => {
        const parts = path.trim().replace(/\[(\d+)\]/g, ".$1").split(".").filter(Boolean);
        let current = context;
        for (const part of parts) current = current == null ? undefined : current[part];
        return current;
      };
      if (exact) return get(exact[1]) ?? "";
      return value.replace(/\{\{\s*([^{}]+?)\s*\}\}/g, (_m, path) => {
        const result = get(path);
        return result == null ? "" : typeof result === "object" ? JSON.stringify(result) : String(result);
      });
    }
    if (Array.isArray(value)) return value.map((item) => this.resolveConfigValue(item, context));
    if (value && typeof value === "object") {
      const output = {};
      for (const [key, item] of Object.entries(value)) output[key] = this.resolveConfigValue(item, context);
      return output;
    }
    return value;
  }

  async enqueueJob({ workflow, input, delayMs = 0, maxAttempts }) {
    const database = this.loadDatabase();
    if (!workflow || !database.workflows?.[workflow]) throw new Error("queue_workflow_not_found");
    const configuredAttempts = Number(maxAttempts ?? database.settings?.execution?.maxQueueAttempts ?? database.queues?.maxAttempts ?? 5);
    const serialized = JSON.stringify(input ?? {});
    if (utf8Size(serialized) > MAX_QUEUE_INPUT_BYTES) throw new Error("queue_input_too_large");
    const id = randomId();
    const now = Date.now();
    this.sql.exec(
      "INSERT INTO queued_jobs (id, workflow, input, run_at, attempts, max_attempts, status, created_at, updated_at) VALUES (?, ?, ?, ?, 0, ?, 'pending', ?, ?)",
      id, workflow, serialized, now + Math.max(0, Math.min(86_400_000, Number(delayMs) || 0)), Math.min(10, Math.max(1, configuredAttempts || 5)), now, now,
    );
    this.queueDirty = true;
    return { id, queued: true };
  }

  async queueOperation(operation, args = {}, context = {}) {
    const limit = Math.min(100, Math.max(1, Number(args.limit) || 20));
    if (operation === "stats") {
      const rows = this.sql.exec("SELECT status, COUNT(*) AS count FROM queued_jobs GROUP BY status").toArray();
      const counts = { pending: 0, failed: 0, running: 0 };
      for (const row of rows) counts[row.status] = Number(row.count || 0);
      return counts;
    }
    if (operation === "list") {
      const allowedStatuses = new Set(["pending", "failed", "running"]);
      const status = args.status == null ? null : String(args.status);
      if (status && !allowedStatuses.has(status)) throw new Error("queue_status_invalid");
      const workflow = args.workflow == null ? null : String(args.workflow);
      const rows = status && workflow
        ? this.sql.exec("SELECT id, workflow, run_at, attempts, max_attempts, status, last_error, created_at FROM queued_jobs WHERE status = ? AND workflow = ? ORDER BY created_at DESC LIMIT ?", status, workflow, limit).toArray()
        : status
          ? this.sql.exec("SELECT id, workflow, run_at, attempts, max_attempts, status, last_error, created_at FROM queued_jobs WHERE status = ? ORDER BY created_at DESC LIMIT ?", status, limit).toArray()
          : workflow
            ? this.sql.exec("SELECT id, workflow, run_at, attempts, max_attempts, status, last_error, created_at FROM queued_jobs WHERE workflow = ? ORDER BY created_at DESC LIMIT ?", workflow, limit).toArray()
            : this.sql.exec("SELECT id, workflow, run_at, attempts, max_attempts, status, last_error, created_at FROM queued_jobs ORDER BY created_at DESC LIMIT ?", limit).toArray();
      return rows;
    }
    const id = String(args.id || "").trim();
    if (!id || id.length > 80) throw new Error("queue_job_id_required");
    if (operation === "retry") {
      const result = this.sql.exec("UPDATE queued_jobs SET status = 'pending', attempts = 0, last_error = NULL, run_at = ?, updated_at = ? WHERE id = ? AND status = 'failed'", Date.now(), Date.now(), id);
      const changed = Number(result?.rowsWritten || 0) > 0;
      if (changed) await this.scheduleNextAlarm();
      return { id, retried: changed };
    }
    if (operation === "cancel") {
      const result = this.sql.exec("DELETE FROM queued_jobs WHERE id = ? AND status IN ('pending', 'failed')", id);
      const changed = Number(result?.rowsWritten || 0) > 0;
      if (changed) await this.scheduleNextAlarm();
      return { id, cancelled: changed };
    }
    throw new Error("queue_operation_invalid");
  }

  isRuntimePaused() {
    return Boolean(this.getRawState("global:runtime:paused"));
  }

  async scheduleNextAlarm() {
    if (this.isRuntimePaused()) {
      await this.ctx.storage.setAlarm(Date.now() + 60_000);
      return;
    }
    const row = this.sql.exec("SELECT MIN(run_at) AS next_at FROM queued_jobs WHERE status = 'pending'").toArray()[0];
    if (row?.next_at != null) await this.ctx.storage.setAlarm(Math.max(Date.now() + 100, Number(row.next_at)));
    else await this.ctx.storage.deleteAlarm();
  }

  async processOneQueueJob(now = Date.now()) {
    if (this.isRuntimePaused()) { await this.scheduleNextAlarm(); return false; }
    const row = this.sql.exec(
      "SELECT id, workflow, input, attempts, max_attempts FROM queued_jobs WHERE status = 'pending' AND run_at <= ? ORDER BY run_at, created_at LIMIT 1",
      now,
    ).toArray()[0];
    if (!row) { await this.scheduleNextAlarm(); return false; }

    const attempts = Number(row.attempts) + 1;
    this.sql.exec("UPDATE queued_jobs SET attempts = ?, updated_at = ? WHERE id = ?", attempts, now, row.id);
    try {
      const database = this.loadDatabase();
      const input = parseJson(row.input, {});
      const context = {
        ...this.runtimeContext(database, now),
        job: { id: row.id, workflow: row.workflow, input, attempts },
      };
      await this.runWorkflow(row.workflow, context, database);
      this.sql.exec("DELETE FROM queued_jobs WHERE id = ?", row.id);
      this.logSync("info", "queue.job_completed", row.id);
    } catch (error) {
      const errorText = String(error?.message || error).slice(0, 800);
      if (attempts >= Number(row.max_attempts)) {
        this.sql.exec("UPDATE queued_jobs SET status = 'failed', last_error = ?, updated_at = ? WHERE id = ?", errorText, Date.now(), row.id);
        this.logSync("error", "queue.job_failed", `${row.id}:${errorText}`);
      } else {
        const delay = Math.min(3_600_000, 2 ** attempts * 1000);
        this.sql.exec("UPDATE queued_jobs SET run_at = ?, last_error = ?, updated_at = ? WHERE id = ?", Date.now() + delay, errorText, Date.now(), row.id);
        this.logSync("warn", "queue.job_retry", `${row.id}:${errorText}`);
      }
    }
    await this.scheduleNextAlarm();
    return true;
  }

  async alarm() {
    return this.runExclusive(() => this.processOneQueueJob(Date.now()));
  }

  getConversationKey(context) {
    if (!context.chat?.id || !context.user?.id) return null;
    return `global:conversation:${context.chat.id}:${context.user.id}`;
  }

  async conversationOperation(operation, args, context) {
    const key = this.getConversationKey(context);
    if (!key) throw new Error("conversation_context_missing");
    if (operation === "start") {
      const configuredTtl = Number(this.loadDatabase().settings?.conversations?.defaultTtlSeconds) || INSTALL_SESSION_SECONDS;
      const ttl = Math.min(86_400, Math.max(30, Number(args.ttlSeconds) || configuredTtl));
      const value = {
        workflow: String(args.workflow || ""),
        input: args.input || {},
        expiresAt: Date.now() + ttl * 1000,
      };
      if (!this.loadDatabase().workflows?.[value.workflow]) throw new Error("conversation_workflow_not_found");
      this.setRawState(key, value);
      return value;
    }
    if (operation === "update") {
      const current = this.getRawState(key);
      if (!current || current.expiresAt < Date.now()) return false;
      current.input = { ...(current.input || {}), ...(args.input || {}) };
      this.setRawState(key, current);
      return current;
    }
    if (operation === "end") {
      this.deleteRawState(key);
      return true;
    }
    throw new Error("conversation_operation_invalid");
  }

  async executeWorkflowActions(actions, context, database) {
    const interpreter = new WorkflowInterpreter({
      database,
      io: {
        telegram: (method, payload, _context, files) => this.callTelegram(method, payload, files),
        api: (apiId, definition, input, ctx) => this.callConfiguredApi(apiId, definition, input, ctx, database),
        http: (request, ctx) => this.requestExternal(request, ctx, database),
        state: (operation, args, ctx) => this.stateOperation(operation, args, ctx),
        enqueue: (args) => this.enqueueJob(args),
        queue: (operation, args, ctx) => this.queueOperation(operation, args, ctx),
        conversation: (operation, args, ctx) => this.conversationOperation(operation, args, ctx),
        quota: (operation, args, ctx) => this.quotaOperation(operation, args, ctx, database),
        runtimeStatus: (ctx) => this.runtimeStatus(database, ctx),
        runtimeLogs: (options, ctx) => this.runtimeLogs(options, ctx),
        runtimeControl: (operation, options, ctx) => this.runtimeControl(operation, options, ctx),
        log: (entry) => this.log(entry),
      },
      limits: {
        maxActions: Math.min(2000, Math.max(10, Number(database.settings?.execution?.maxActionsPerUpdate) || 500)),
        maxLoop: Math.min(500, Math.max(1, Number(database.settings?.execution?.maxLoopItems) || 100)),
        maxDepth: Math.min(20, Math.max(1, Number(database.settings?.execution?.maxWorkflowDepth) || 12)),
      },
    });
    return interpreter.runActions(actions, context);
  }

  async runWorkflow(id, context, database = this.loadDatabase()) {
    const interpreter = new WorkflowInterpreter({
      database,
      io: {
        telegram: (method, payload, _context, files) => this.callTelegram(method, payload, files),
        api: (apiId, definition, input, ctx) => this.callConfiguredApi(apiId, definition, input, ctx, database),
        http: (request, ctx) => this.requestExternal(request, ctx, database),
        state: (operation, args, ctx) => this.stateOperation(operation, args, ctx),
        enqueue: (args) => this.enqueueJob(args),
        queue: (operation, args, ctx) => this.queueOperation(operation, args, ctx),
        conversation: (operation, args, ctx) => this.conversationOperation(operation, args, ctx),
        quota: (operation, args, ctx) => this.quotaOperation(operation, args, ctx, database),
        runtimeStatus: (ctx) => this.runtimeStatus(database, ctx),
        runtimeLogs: (options, ctx) => this.runtimeLogs(options, ctx),
        runtimeControl: (operation, options, ctx) => this.runtimeControl(operation, options, ctx),
        log: (entry) => this.log(entry),
      },
      limits: {
        maxActions: Math.min(2000, Math.max(10, Number(database.settings?.execution?.maxActionsPerUpdate) || 500)),
        maxLoop: Math.min(500, Math.max(1, Number(database.settings?.execution?.maxLoopItems) || 100)),
        maxDepth: Math.min(20, Math.max(1, Number(database.settings?.execution?.maxWorkflowDepth) || 12)),
      },
    });
    return interpreter.runWorkflow(id, context);
  }

  async runtimeControl(operation, options = {}, context = {}) {
    if (!context.owner?.isOwner) throw new Error("runtime_owner_only");
    const key = "global:runtime:paused";
    if (operation === "pause") {
      this.setRawState(key, {
        pausedAt: Date.now(),
        by: String(context.user?.id || EMBEDDED_OWNER_TELEGRAM_ID),
        reason: String(options.reason || "").slice(0, 300),
      });
      await this.scheduleNextAlarm();
      return { paused: true };
    }
    if (operation === "resume") {
      this.deleteRawState(key);
      await this.scheduleNextAlarm();
      return { paused: false };
    }
    if (operation === "status") return { paused: this.isRuntimePaused() };
    throw new Error("runtime_control_operation_invalid");
  }

  async runtimeLogs(options = {}, context = {}) {
    if (!context.owner?.isOwner) throw new Error("runtime_owner_only");
    const limit = Math.min(50, Math.max(1, Number(options.limit) || 20));
    return this.sql.exec(
      "SELECT level, code, detail, created_at FROM runtime_logs ORDER BY id DESC LIMIT ?",
      limit,
    ).toArray();
  }

  async runtimeStatus(database = this.loadDatabase(), context = {}) {
    if (!context.owner?.isOwner) throw new Error("runtime_owner_only");
    const stateCount = Number(this.sql.exec("SELECT COUNT(*) AS count FROM operational_state").toArray()[0]?.count || 0);
    const queuedJobs = Number(this.sql.exec("SELECT COUNT(*) AS count FROM queued_jobs WHERE status = 'pending'").toArray()[0]?.count || 0);
    const failedJobs = Number(this.sql.exec("SELECT COUNT(*) AS count FROM queued_jobs WHERE status = 'failed'").toArray()[0]?.count || 0);
    const registeredChats = Number(this.sql.exec("SELECT COUNT(*) AS count FROM operational_state WHERE substr(key, 1, 15) = 'global:registry' AND value LIKE '%\"active\":true%'").toArray()[0]?.count || 0);
    const config = this.sql.exec("SELECT version, sha256, installed_at FROM application_config WHERE id = 1").toArray()[0];
    return {
      runtimeVersion: RUNTIME_VERSION,
      paused: this.isRuntimePaused(),
      databaseVersion: config?.version || database.manifest.version,
      databaseHash: config?.sha256 || "embedded",
      databaseInstalledAt: config?.installed_at || 0,
      commands: Object.keys(database.commands || {}).length,
      workflows: Object.keys(database.workflows || {}).length,
      apis: Object.keys(database.apis || {}).length,
      events: (database.events || []).length,
      schedules: (database.schedules || []).length,
      stateRecords: stateCount,
      queuedJobs,
      failedJobs,
      registeredChats,
    };
  }

  logSync(level, code, detail = "") {
    try {
      this.sql.exec(
        "INSERT INTO runtime_logs (level, code, detail, created_at) VALUES (?, ?, ?, ?)",
        String(level).slice(0, 16), String(code).slice(0, 120), String(detail).slice(0, 1500), Date.now(),
      );
      const activeDatabase = this.databaseCache || parseJson(this.sql.exec("SELECT source FROM application_config WHERE id = 1").toArray()[0]?.source, {});
      const retention = Math.min(5000, Math.max(50, Number(activeDatabase?.logging?.maxEntries) || 500));
      this.sql.exec("DELETE FROM runtime_logs WHERE id NOT IN (SELECT id FROM runtime_logs ORDER BY id DESC LIMIT ?)", retention);
    } catch { /* logging must not break bot processing */ }
  }

  async log(entry = {}) {
    this.logSync(entry.level || "info", entry.code || "database.log", entry.detail || "");
    return true;
  }

  async sendText(chatId, text, options = {}) {
    return this.callTelegram("sendMessage", { chat_id: chatId, text, ...options });
  }

  async sendInstallerText(chatId, text, options = {}) {
    return this.callTelegram("sendMessage", { chat_id: chatId, text, ...options }, {}, { allowDisabled: true });
  }

  async checkChatAdmin(chatId, userId, database = this.loadDatabase()) {
    if (!chatId || !userId) return false;
    try {
      const member = await this.callTelegram("getChatMember", { chat_id: chatId, user_id: userId });
      const statuses = Array.isArray(database.policies?.groupAdminStatuses) ? database.policies.groupAdminStatuses : ["creator", "administrator"];
      return statuses.includes(member?.status);
    } catch {
      return false;
    }
  }

  async canRunCommand(definition, context, database) {
    const scope = definition.scope || "any";
    if (!isPrivateOrGroupScope(scope === "group" ? "group" : scope, context.chat?.type)) return false;
    const roles = Array.isArray(definition.roles) && definition.roles.length ? definition.roles : ["any"];
    const available = new Set();
    const ownerRole = String(database.authorization?.ownerRole || "owner");
    const adminRole = String(database.authorization?.administratorRole || "admin");
    const defaultRole = String(database.authorization?.defaultRole || "member");
    if (context.owner.isOwner && !(scope === "group" && database.policies?.ownerCanManageAllChats === false)) available.add(ownerRole);
    if (context.user?.id) available.add(defaultRole);
    if (context.user?.id && await this.checkChatAdmin(context.chat?.id, context.user.id, database)) available.add(adminRole);

    if (context.user?.id) {
      const storedRoles = this.getRawState(`global:role:user:${context.user.id}`);
      const chatRoles = context.chat?.id ? this.getRawState(`chat:${context.chat.id}:role:user:${context.user.id}`) : null;
      for (const role of [...(Array.isArray(storedRoles) ? storedRoles : [storedRoles]), ...(Array.isArray(chatRoles) ? chatRoles : [chatRoles])]) {
        if (typeof role === "string" && Object.hasOwn(database.roles || {}, role)) available.add(role);
      }
    }

    const roleMatched = roles.includes("any") || roles.some((role) => available.has(role));
    if (!roleMatched) return false;
    const requiredPermissions = Array.isArray(definition.permissions) ? definition.permissions : [];
    if (!requiredPermissions.length) return true;
    const granted = new Set();
    for (const role of available) {
      for (const permission of database.roles?.[role]?.permissions || []) granted.add(permission);
    }
    return requiredPermissions.every((permission) => {
      const specification = database.permissions?.[permission];
      if (!specification) return false;
      const permissionScope = specification.scope || "any";
      if (!isPrivateOrGroupScope(permissionScope === "group" ? "group" : permissionScope, context.chat?.type)) return false;
      return granted.has("*") || granted.has(permission);
    });
  }

  async dispatchCommand(match, context, database) {
    if (!await this.canRunCommand(match.definition, context, database)) {
      await this.sendText(context.chat.id, "اجازه اجرای این فرمان را نداری.");
      return;
    }
    context.command = { id: match.id, definition: match.definition };
    context.args = match.parsed.args;
    context.argsText = match.parsed.argsText;
    if (match.definition.workflow) await this.runWorkflow(match.definition.workflow, context, database);
    else await this.executeWorkflowActions(match.definition.actions || [], context, database);
  }

  async dispatchEvents(update, context, database) {
    const names = updateEventNames(update);
    for (const event of [...(database.events || []), ...(database.callbacks || [])]) {
      if (!names.includes(event.on)) continue;
      if (!matchesEvent(event, event.on, context)) continue;
      if (event.workflow) await this.runWorkflow(event.workflow, context, database);
      else await this.executeWorkflowActions(event.actions || [], context, database);
      if (context.__flowReturn) break;
    }
  }

  async processConversation(context, database) {
    const key = this.getConversationKey(context);
    if (!key) return false;
    const conversation = this.getRawState(key);
    if (!conversation) return false;
    if (Number(conversation.expiresAt) < Date.now()) {
      this.deleteRawState(key);
      return false;
    }
    if (!database.workflows?.[conversation.workflow]) {
      this.deleteRawState(key);
      return false;
    }
    context.conversation = conversation;
    context.conversationInput = conversation.input || {};
    await this.runWorkflow(conversation.workflow, context, database);
    return true;
  }

  async startInstall(context) {
    if (!context.owner.isOwner || !isPrivate(context.chat)) {
      if (context.chat?.id) await this.sendInstallerText(context.chat.id, "این دستور فقط برای مالک و در گفتگوی خصوصی فعال است.");
      return;
    }
    const key = `global:install:session:${EMBEDDED_OWNER_TELEGRAM_ID}`;
    this.setRawState(key, { expiresAt: Date.now() + INSTALL_SESSION_SECONDS * 1000 });
    await this.sendInstallerText(context.chat.id, "فایل <code>database.js</code> را به‌صورت Document ارسال کن. فقط ساختار داده‌ای مجاز است؛ کد اجرایی پذیرفته نمی‌شود.", { parse_mode: "HTML" });
  }

  async downloadTelegramDocument(fileId) {
    const fileResponse = await fetch(`${TELEGRAM_API_BASE}${EMBEDDED_BOT_TOKEN}/getFile`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ file_id: fileId }),
    });
    const fileResult = await fileResponse.json();
    if (!fileResponse.ok || fileResult?.ok !== true || !fileResult.result?.file_path) throw new Error("telegram_file_lookup_failed");
    const filePath = String(fileResult.result.file_path);
    if (filePath.includes("..") || filePath.startsWith("/") || filePath.includes("\\")) throw new Error("telegram_file_path_invalid");
    const response = await fetch(`${TELEGRAM_FILE_BASE}${EMBEDDED_BOT_TOKEN}/${filePath}`);
    if (!response.ok) throw new Error("telegram_file_download_failed");
    const bytes = new Uint8Array(await response.arrayBuffer());
    if (bytes.byteLength > MAX_DATABASE_BYTES) throw new Error("database_file_too_large");
    return new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  }

  planDatabaseUpgrade(nextDatabase) {
    const aliases = nextDatabase.migrations?.workflowAliases || {};
    const jobUpdates = [];
    const conversationUpdates = [];

    const jobs = this.sql.exec("SELECT id, workflow FROM queued_jobs WHERE status = 'pending'").toArray();
    for (const job of jobs) {
      if (nextDatabase.workflows?.[job.workflow]) continue;
      const target = aliases[job.workflow];
      if (!target || !nextDatabase.workflows?.[target]) throw new Error(`active_queue_workflow_missing:${job.workflow}`);
      jobUpdates.push({ id: job.id, workflow: target });
    }

    const conversations = this.sql.exec("SELECT key, value FROM operational_state WHERE key LIKE 'global:conversation:%'").toArray();
    for (const row of conversations) {
      const conversation = parseJson(row.value, null);
      if (!conversation || Number(conversation.expiresAt) < Date.now()) continue;
      if (nextDatabase.workflows?.[conversation.workflow]) continue;
      const target = aliases[conversation.workflow];
      if (!target || !nextDatabase.workflows?.[target]) throw new Error(`active_conversation_workflow_missing:${conversation.workflow}`);
      conversationUpdates.push({ key: row.key, value: { ...conversation, workflow: target } });
    }
    return { jobUpdates, conversationUpdates };
  }

  async installDatabaseDocument(context) {
    const key = `global:install:session:${EMBEDDED_OWNER_TELEGRAM_ID}`;
    const session = this.getRawState(key);
    if (!session || Number(session.expiresAt) < Date.now()) {
      this.deleteRawState(key);
      return false;
    }
    const document = context.message?.document;
    if (!document || document.file_name !== "database.js") {
      await this.sendInstallerText(context.chat.id, "نام فایل باید دقیقاً database.js باشد. دوباره /install را اجرا کن.");
      return true;
    }
    if (Number(document.file_size || 0) > MAX_DATABASE_BYTES) {
      await this.sendInstallerText(context.chat.id, "حجم دیتابیس از حد مجاز بیشتر است.");
      return true;
    }

    let nextDatabase;
    let source;
    try {
      source = await this.downloadTelegramDocument(document.file_id);
      nextDatabase = parseDatabaseModule(source, { maxBytes: MAX_DATABASE_BYTES, maxDepth: 64, maxNodes: 200_000 });
      validateDatabase(nextDatabase);
    } catch (error) {
      const code = String(error?.code || error?.message || "database_invalid").slice(0, 180);
      await this.sendInstallerText(context.chat.id, `نصب انجام نشد. دیتابیس فعلی تغییر نکرد.\nخطا: ${code}`);
      return true;
    }

    let migrationPlan;
    try {
      migrationPlan = this.planDatabaseUpgrade(nextDatabase);
    } catch (error) {
      const code = String(error?.message || error).slice(0, 180);
      await this.sendInstallerText(context.chat.id, `نصب انجام نشد؛ یک وظیفه یا مکالمه فعال به Workflow حذف‌شده وابسته است. دیتابیس فعلی دست‌نخورده ماند.\n${code}`);
      return true;
    }

    const normalized = JSON.stringify(nextDatabase);
    const hash = await sha256Hex(normalized);
    const version = String(nextDatabase.manifest.version || "unknown");
    const now = Date.now();

    // One synchronous SQLite transaction replaces only the application definition.
    // operational_state, queues, conversations and processed updates remain untouched.
    this.ctx.storage.transactionSync(() => {
      this.sql.exec(
        "INSERT INTO application_config (id, source, version, sha256, installed_at) VALUES (1, ?, ?, ?, ?) ON CONFLICT(id) DO UPDATE SET source = excluded.source, version = excluded.version, sha256 = excluded.sha256, installed_at = excluded.installed_at",
        normalized, version, hash, now,
      );
      this.sql.exec("DELETE FROM operational_state WHERE key = ?", key);
      for (const update of migrationPlan.jobUpdates) {
        this.sql.exec("UPDATE queued_jobs SET workflow = ?, updated_at = ? WHERE id = ?", update.workflow, now, update.id);
      }
      for (const update of migrationPlan.conversationUpdates) {
        this.sql.exec("UPDATE operational_state SET value = ?, updated_at = ? WHERE key = ?", JSON.stringify(update.value), now, update.key);
      }
    });
    this.databaseCache = nextDatabase;

    let lifecycleError = "";
    try {
      const lifecycle = nextDatabase.lifecycle?.onInstall;
      if (Array.isArray(lifecycle) && lifecycle.length) {
        const lifecycleContext = {
          ...this.runtimeContext(nextDatabase, now),
          chat: context.chat,
          user: context.user,
          owner: context.owner,
          install: { version, sha256: hash },
        };
        await this.executeWorkflowActions(lifecycle, lifecycleContext, nextDatabase);
      }
    } catch (error) {
      lifecycleError = String(error?.message || error).slice(0, 200);
      this.logSync("error", "database.lifecycle_install_failed", lifecycleError);
    }

    const status = await this.runtimeStatus(nextDatabase, context);
    const extra = lifecycleError ? `\nتنظیمات اولیه نیاز به بررسی دارد: ${lifecycleError}` : "";
    await this.sendInstallerText(
      context.chat.id,
      `دیتابیس MUNITOS نصب شد.\nنسخه: ${version}\nSHA-256: <code>${hash}</code>\nفرمان‌ها: ${status.commands}\nWorkflowها: ${status.workflows}\nAPIها: ${status.apis}${extra}`,
      { parse_mode: "HTML" },
    );
    return true;
  }

  async handleUpdate(update) {
    return this.runExclusive(() => this.handleUpdateLocked(update));
  }

  markUpdateProcessed(updateId) {
    if (!updateId) return;
    this.sql.exec("INSERT OR IGNORE INTO processed_updates (update_id, processed_at) VALUES (?, ?)", updateId, Date.now());
    this.sql.exec("DELETE FROM processed_updates WHERE update_id NOT IN (SELECT update_id FROM processed_updates ORDER BY processed_at DESC LIMIT 5000)");
  }

  async handleUpdateLocked(update) {
    if (!update || typeof update !== "object") throw new Error("telegram_update_invalid");
    const updateId = update.update_id == null ? null : String(update.update_id);
    if (updateId) {
      const seen = this.sql.exec("SELECT update_id FROM processed_updates WHERE update_id = ?", updateId).toArray()[0];
      if (seen) return { duplicate: true };
    }

    const installSessionKey = `global:install:session:${EMBEDDED_OWNER_TELEGRAM_ID}`;
    const installIntent = ownerInstallIntent(
      update,
      EMBEDDED_OWNER_TELEGRAM_ID,
      String(this.getRawState("global:bot:username") || ""),
      Boolean(this.getRawState(installSessionKey)),
    );
    if (installIntent) {
      const installContext = this.buildContext(update, DEFAULT_DATABASE);
      try {
        if (installIntent === "start") await this.startInstall(installContext);
        else await this.installDatabaseDocument(installContext);
        if (this.queueDirty) {
          this.queueDirty = false;
          await this.scheduleNextAlarm();
        }
        this.markUpdateProcessed(updateId);
        return { ok: true, installer: installIntent };
      } catch (error) {
        this.logSync("error", "database.installer_failed", `${updateId || "no-id"}:${String(error?.message || error).slice(0, 1000)}`);
        throw error;
      }
    }

    const database = this.loadDatabase();
    const context = this.buildContext(update, database);
    const messageText = context.message?.text || context.message?.caption || "";
    const parsed = parseCommandText(messageText, context.bot.username);
    const commandMatch = matchCommand(database, messageText, context.bot.username);

    try {
      if (parsed?.kind === "slash" && parsed.trigger === "/install") {
        await this.startInstall(context);
      } else if (context.owner.isOwner && isPrivate(context.chat) && context.message?.document) {
        const installSession = this.getRawState(`global:install:session:${EMBEDDED_OWNER_TELEGRAM_ID}`);
        if (installSession) await this.installDatabaseDocument(context);
        else await this.dispatchEvents(update, context, database);
      } else {
        if (commandMatch) await this.dispatchCommand(commandMatch, context, database);
        else {
          const handledConversation = context.message ? await this.processConversation(context, database) : false;
          if (!handledConversation) await this.dispatchEvents(update, context, database);
        }
      }

      if (this.queueDirty) {
        this.queueDirty = false;
        await this.scheduleNextAlarm();
      }
      this.markUpdateProcessed(updateId);
      return { ok: true };
    } catch (error) {
      this.logSync("error", "update.processing_failed", `${updateId || "no-id"}:${String(error?.message || error).slice(0, 1000)}`);
      throw error;
    }
  }

  async tick(now = Date.now()) {
    return this.runExclusive(() => this.tickLocked(now));
  }

  async tickLocked(now = Date.now()) {
    if (this.isRuntimePaused()) {
      await this.scheduleNextAlarm();
      return { ok: true, paused: true };
    }
    const database = this.loadDatabase();
    const runtime = this.runtimeContext(database, now);
    const bootstrapKey = "global:runtime:bootstrap:completed";
    const bootstrapped = this.getRawState(bootstrapKey);
    if (!bootstrapped && Array.isArray(database.lifecycle?.onBootstrap)) {
      try {
        await this.executeWorkflowActions(database.lifecycle.onBootstrap, runtime, database);
        this.setRawState(bootstrapKey, { at: now, version: database.manifest.version });
        this.logSync("info", "runtime.bootstrap_completed", String(database.manifest.version));
      } catch (error) {
        this.logSync("error", "runtime.bootstrap_failed", String(error?.message || error).slice(0, 1000));
      }
    }

    const date = new Date(now);
    const minuteStamp = Math.floor(now / 60_000);
    for (const schedule of database.schedules || []) {
      if (schedule.enabled === false || !cronMatches(schedule.cron, date)) continue;
      const key = `global:schedule:last:${schedule.id}`;
      const last = Number(this.getRawState(key) || 0);
      if (last === minuteStamp) continue;
      this.setRawState(key, minuteStamp);
      try {
        const context = { ...runtime, schedule: { id: schedule.id, cron: schedule.cron, timestamp: now } };
        await this.runWorkflow(schedule.workflow, context, database);
      } catch (error) {
        this.logSync("error", "schedule.execution_failed", `${schedule.id}:${String(error?.message || error).slice(0, 800)}`);
      }
    }
    if (this.queueDirty) {
      this.queueDirty = false;
      await this.scheduleNextAlarm();
    }
    await this.processOneQueueJob(now);
    return { ok: true, version: database.manifest.version };
  }
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    if (url.pathname === "/health" || url.pathname === "/") {
      return jsonResponse({ ok: true, name: "MUNITOS", version: RUNTIME_VERSION });
    }

    if (url.pathname !== "/telegram/webhook" || request.method !== "POST") {
      return jsonResponse({ ok: false, error: "not_found" }, 404);
    }

    const secret = request.headers.get("x-telegram-bot-api-secret-token") || "";
    if (secret !== EMBEDDED_WEBHOOK_SECRET) return jsonResponse({ ok: false, error: "unauthorized" }, 401);

    const contentLength = Number(request.headers.get("content-length") || 0);
    if (contentLength > MAX_UPDATE_BYTES) return jsonResponse({ ok: false, error: "update_too_large" }, 413);

    let update;
    try {
      const raw = await request.text();
      if (utf8Size(raw) > MAX_UPDATE_BYTES) return jsonResponse({ ok: false, error: "update_too_large" }, 413);
      update = JSON.parse(raw);
    } catch {
      return jsonResponse({ ok: false, error: "invalid_json" }, 400);
    }

    try {
      const runtime = env.MUNITOS.getByName(DURABLE_OBJECT_NAME);
      await runtime.handleUpdate(update);
      return new Response("ok", { status: 200, headers: { "content-type": "text/plain; charset=utf-8" } });
    } catch (error) {
      console.error("MUNITOS update failed", String(error?.message || error).slice(0, 500));
      return jsonResponse({ ok: false, error: "update_processing_failed" }, 500);
    }
  },

  async scheduled(controller, env, ctx) {
    const runtime = env.MUNITOS.getByName(DURABLE_OBJECT_NAME);
    ctx.waitUntil(runtime.tick(Number(controller.scheduledTime || Date.now())));
  },
};

