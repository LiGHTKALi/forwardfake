import { DurableObject } from "cloudflare:workers";
import {
  asText,
  clampNumber,
  MAX_DATABASE_BYTES,
  isTelegramId,
  selectNlpRule,
  makeKeyboardButton,
  matchPhrase,
  nextUtcMidnightMs,
  normalizeText,
  parseDatabaseModule,
  parseIntervalInput,
  parseMessageLink,
  parsePublicChannel,
  randomItem,
  renderTemplate,
  utcDay,
} from "./lib.js";

// Embedded bot token requested by the project owner.
// WARNING: anyone who can read this source or its ZIP can control the Telegram bot.
// Rotate this token in @BotFather if this project is shared or published.
const EMBEDDED_BOT_TOKEN = "9100041417:AAHYOpFKKTGpBQpdHoTAExwZYzlXPqOtSjg";
const BOT_API = "https://api.telegram.org/bot";
const BOT_FILE_API = "https://api.telegram.org/file/bot";
const DO_NAME = "forward-scheduler-owner";
const TELEGRAM_TIMEOUT_MS = 12_000;
const DATABASE_DOWNLOAD_TIMEOUT_MS = 10_000;
const DEFAULT_BUDGET = Object.freeze({
  dailyUnits: 30_000,
  warningRemaining: 1_000,
  criticalRemaining: 100,
  resetTimezone: "UTC",
});
const OUTBOUND_METHODS = new Set([
  "sendMessage", "forwardMessage", "copyMessage", "sendPhoto", "sendDocument",
  "sendVideo", "sendAudio", "sendVoice", "sendAnimation", "sendSticker",
  "sendLocation", "sendVenue", "sendContact", "sendDice", "sendPoll",
  "sendMediaGroup",
]);

function textResponse(text, status = 200) {
  return new Response(String(text), {
    status,
    headers: { "content-type": "text/plain; charset=utf-8", "cache-control": "no-store" },
  });
}

function botTokenFrom(env) {
  // Embedded token takes precedence; BOT_TOKEN remains an override/fallback.
  return String(EMBEDDED_BOT_TOKEN || env?.BOT_TOKEN || "").trim();
}

function validBotToken(env) {
  return /^\d{6,12}:[A-Za-z0-9_-]{25,}$/.test(botTokenFrom(env));
}

function button(text, callbackData, style = "primary") {
  return makeKeyboardButton(text, callbackData, style);
}

async function webhookSecret(botToken) {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(`forward-scheduler-telegram-webhook:${botToken}`),
  );
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

function isGroup(chat) {
  return chat?.type === "group" || chat?.type === "supergroup";
}

function isPrivate(chat) {
  return chat?.type === "private";
}

function userDisplay(user = {}) {
  return user.first_name || user.username || String(user.id || "کاربر");
}

async function readBodyTextLimited(response, maxBytes) {
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

function defaultState() {
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
    security: { ownerId: null, ownerClaimedAt: null, ownerUsername: null, ownerDisplayName: null, credentialSource: "cloudflare-secret" },
    webhookUrl: null,
    flow: null,
    forwardDraft: null,
    forwardTask: null,
    groupSettings: {},
    spam: {},
    rate: {},
    updateIds: [],
    budget: { day: utcDay(), units: 0, mode: "active", lastNotice: null },
    metrics: { updates: 0, replies: 0, moderated: 0, forwarded: 0, chatter: 0 },
  };
}

function mergeState(value) {
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
    rate: value.rate && typeof value.rate === "object" && !Array.isArray(value.rate) ? value.rate : {},
    budget: {
      ...base.budget,
      ...(value.budget && typeof value.budget === "object" && !Array.isArray(value.budget) ? value.budget : {}),
      units: Math.max(0, Math.floor(Number(value.budget?.units) || 0)),
      mode: ["active", "owner_only", "paused"].includes(value.budget?.mode) ? value.budget.mode : "active",
    },
    metrics: { ...base.metrics, ...(value.metrics && typeof value.metrics === "object" && !Array.isArray(value.metrics) ? value.metrics : {}) },
    updateIds: Array.isArray(value.updateIds) ? value.updateIds.filter((id) => Number.isSafeInteger(id) && id >= 0).slice(-256) : [],
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
  };
}

function getPath(object, path, fallback = "") {
  let current = object;
  for (const part of path.split(".")) current = current?.[part];
  return current == null ? fallback : current;
}

export class ForwardScheduler extends DurableObject {
  constructor(ctx, env) {
    super(ctx, env);
    this.env = env;
    this.serial = Promise.resolve();
    this.outboundAt = new Map();
    this.answerCache = new Map();
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
    return mergeState(await this.ctx.storage.get("state"));
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
    return state.db && typeof state.db === "object" ? state.db : null;
  }

  #text(state, key, fallback = "") {
    return asText(getPath(this.#db(state)?.texts, key, fallback)) || fallback;
  }

  #isOwner(userId, state) {
    const ownerId = this.#ownerId(state);
    return Boolean(ownerId) && String(userId ?? "") === ownerId;
  }

  #isOperator(userId, chatId, db, state) {
    if (this.#isOwner(userId, state)) return true;
    const globalAdmins = (db?.roles?.adminIds || []).map(String);
    const groupAdmins = (db?.roles?.adminsByChat?.[String(chatId)] || []).map(String);
    return globalAdmins.includes(String(userId)) || groupAdmins.includes(String(userId));
  }

  #budgetConfig(state) {
    const source = this.#db(state)?.budget || {};
    return {
      dailyUnits: clampNumber(source.dailyUnits, DEFAULT_BUDGET.dailyUnits, 10_000, 40_000),
      warningRemaining: clampNumber(source.warningRemaining, DEFAULT_BUDGET.warningRemaining, 100, 10_000),
      criticalRemaining: clampNumber(source.criticalRemaining, DEFAULT_BUDGET.criticalRemaining, 10, 999),
      resetTimezone: "UTC",
    };
  }

  async #budgetRoll(state, now = Date.now()) {
    const day = utcDay(now);
    if (state.budget.day === day) return false;
    const previousMode = state.budget.mode;
    state.budget = { day, units: 0, mode: "active", lastNotice: null, webhookDisabled: false };
    if (previousMode !== "active" && state.webhookUrl) {
      const restored = await this.#telegram(state, "setWebhook", {
        url: state.webhookUrl,
        secret_token: await webhookSecret(botTokenFrom(this.env)),
        allowed_updates: ["message", "edited_message", "callback_query", "channel_post", "edited_channel_post", "chat_join_request", "my_chat_member"],
        drop_pending_updates: false,
      }, { bypassLocalRate: true });
      state.budget.webhookDisabled = !restored.ok;
      await this.#save(state);
      const baseMessage = this.#text(state, "budget.resumed", "🟢 سهمیه داخلی برنامه برای روز جدید بازنشانی شد و ربات دوباره فعال است.");
      await this.#send(this.#ownerId(state), restored.ok ? baseMessage : `${baseMessage} ⚠️ اتصال webhook خودکار نشد؛ مسیر /setup را باز کن.`, state, {}, { bypassLocalRate: true });
    } else {
      await this.#save(state);
      if (previousMode !== "active" && this.#db(state)) {
        await this.#send(this.#ownerId(state), this.#text(state, "budget.resumed", "🟢 سهمیه داخلی برنامه برای روز جدید بازنشانی شد و ربات دوباره فعال است."), state, {}, { bypassLocalRate: true });
      }
    }
    return true;
  }

  async #chargeBudget(state, now = Date.now()) {
    await this.#budgetRoll(state, now);
    if (state.budget.mode === "paused") return { allowed: false, mode: "paused", remaining: 0 };
    const config = this.#budgetConfig(state);
    state.budget.units = Number(state.budget.units || 0) + 1;
    const remaining = Math.max(0, config.dailyUnits - state.budget.units);

    if (remaining <= config.criticalRemaining && state.budget.mode !== "paused") {
      state.budget.mode = "paused";
      state.budget.lastNotice = "critical";
      await this.#save(state);
      const resetAt = nextUtcMidnightMs(now);
      await this.ctx.storage.setAlarm(resetAt);
      if (state.webhookUrl) {
        const disabled = await this.#telegram(state, "deleteWebhook", { drop_pending_updates: false }, { bypassLocalRate: true });
        state.budget.webhookDisabled = Boolean(disabled.ok);
        await this.#save(state);
      }
      await this.#send(
        this.#ownerId(state),
        renderTemplate(this.#text(state, "budget.critical", "⛔ بودجه داخلی به {remaining} واحد رسید. ربات برای حفظ سهمیه تا {resetAt} UTC متوقف شد. پس از بازنشانی خودکار خبر می‌دهم."), {
          remaining, resetAt: new Date(resetAt).toISOString(),
        }),
        state,
        {},
        { bypassLocalRate: true },
      );
      await this.#save(state);
      return { allowed: false, mode: "paused", remaining };
    }

    if (remaining <= config.warningRemaining && state.budget.mode === "active") {
      state.budget.mode = "owner_only";
      state.budget.lastNotice = "warning";
      await this.#save(state);
      const resetAt = nextUtcMidnightMs(now);
      await this.ctx.storage.setAlarm(resetAt);
      await this.#send(
        this.#ownerId(state),
        renderTemplate(this.#text(state, "budget.warning", "⚠️ فقط {remaining} واحد از بودجه داخلی مانده است؛ امکانات عمومی متوقف و حالت مالک‌محور فعال شد. بازنشانی: {resetAt} UTC."), {
          remaining, resetAt: new Date(resetAt).toISOString(),
        }),
        state,
        {},
        { bypassLocalRate: true },
      );
    }

    await this.#save(state);
    return { allowed: state.budget.mode !== "paused", mode: state.budget.mode, remaining };
  }

  async #telegram(state, method, payload = {}, options = {}) {
    const botToken = botTokenFrom(this.env);
    if (typeof botToken !== "string" || !/^\d{6,12}:[A-Za-z0-9_-]{25,}$/.test(botToken)) {
      return { ok: false, error_code: 401, description: "BOT_TOKEN_SECRET_NOT_CONFIGURED" };
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

    try {
      const response = await fetch(`${BOT_API}${botToken}/${method}`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(TELEGRAM_TIMEOUT_MS),
      });
      const data = await response.json().catch(() => null);
      if (data && typeof data === "object") return data;
      return { ok: false, error_code: response.status || 502, description: "INVALID_TELEGRAM_RESPONSE" };
    } catch (error) {
      return { ok: false, description: `NETWORK_ERROR:${asText(error?.message || error).slice(0, 120)}` };
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
      [button(this.#text(state, "ui.forward", "📨 زمان‌بندی فوروارد"), "forward:new", "primary"), button(this.#text(state, "ui.channelPost", "📣 انتشار در کانال"), "channel:post", "success")],
      ...(state.forwardTask?.active ? [[button(this.#text(state, "ui.stopForward", "⏹ توقف فوروارد"), "forward:stop", "danger")]] : []),
      [button(this.#text(state, "ui.status", "📊 وضعیت سیستم"), "status", "primary"), button(this.#text(state, "ui.help", "💡 راهنما"), "help", "success")],
      [button(this.#text(state, "ui.reload", "📤 بارگذاری نسخه جدید"), "db:reload", "success"), button(this.#text(state, "ui.delete", "🗑 حذف دیتابیس"), "db:delete", "danger")],
    ];
    if (!db) rows.splice(0, rows.length, [button("📥 نصب دیتابیس", "db:install", "success")]);
    return { inline_keyboard: rows };
  }

  async #showStart(state, chatId, isOwner) {
    if (!this.#db(state)) {
      const bootstrap = isOwner
        ? "برای نصب یا جایگزینی دیتابیس، /install را بفرست و فایل database.js را مستقیماً به‌صورت Document آپلود کن.\n\nفقط /start و /install فرمان‌های اصلی هستند."
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
    if (!document?.file_id || !filename.toLowerCase().endsWith(".js")) {
      await this.#send(chatId, "❌ فقط فایل JavaScript با پسوند .js را به‌صورت Document ارسال کن.", state);
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
      const reason = asText(error?.message || error).replace(/https?:\/\/\S+/g, "[url]").slice(0, 180);
      await this.#send(chatId, renderTemplate(this.#text(state, "install.failed", "❌ نصب دیتابیس انجام نشد: {reason}"), { reason }), state);
    }
  }

  async #installDatabaseSource(state, source, filename = "database.js") {
    try {
      const database = parseDatabaseModule(source);
      const sourceBytes = new TextEncoder().encode(String(source));
      const digest = await crypto.subtle.digest("SHA-256", sourceBytes);
      const databaseHash = [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
      const resourceReport = await this.#reconcileDatabaseResources(state, database);

      state.db = database;
      state.dbUrl = null;
      state.dbFileName = filename || "database.js";
      state.dbHash = databaseHash;
      state.dbInstalledAt = Date.now();
      state.dbManifest = this.#databaseManifest(database);
      state.maintenanceNextAt = Date.now() + clampNumber(database.runtime?.maintenance?.sweepIntervalMinutes, 30, 5, 1_440) * 60_000;
      state.maintenanceCursor = null;
      state.flow = null;
      await this.#save(state);

      let cleanupWarning = false;
      try {
        resourceReport.removed += await this.#completeResourceCleanup(state);
      } catch (cleanupError) {
        cleanupWarning = true;
        console.error("Database resource cleanup deferred", cleanupError);
      }
      await this.#scheduleNext(state);
      const suffix = cleanupWarning || state.pendingResourceCleanup.length
        ? "\n⚠️ پاک‌سازی برخی منابع در صف اجرای مرحله‌ای قرار گرفت."
        : "";
      const message = renderTemplate(this.#text(state, "install.success", "✅ دیتابیس {version} نصب شد. قوانین: {rules}؛ حافظه‌ها: {created} ساخته، {updated} به‌روزرسانی، {removed} پاک‌سازی."), {
        version: database.version || "بدون نسخه",
        rules: database.features?.chatbot?.rules?.length || 0,
        created: resourceReport.created,
        updated: resourceReport.updated,
        removed: resourceReport.removed,
      });
      const notify = await this.#send(this.#ownerId(state), `${message}${suffix}`, state, { reply_markup: this.#ownerKeyboard(state) });
      if (!notify.ok) console.error("Database installed, but Telegram notification failed", notify.error_code, notify.description);
    } catch (error) {
      const reason = asText(error?.message || error).slice(0, 180);
      console.error("Database installation failed", reason);
      await this.#send(this.#ownerId(state), renderTemplate(this.#text(state, "install.failed", "❌ نصب دیتابیس انجام نشد: {reason}"), { reason }), state);
    }
  }

  async #refreshDatabase(state) {
    state.flow = "database_upload";
    await this.#save(state);
    await this.#send(this.#ownerId(state), this.#text(state, "install.prompt", "برای به‌روزرسانی، نسخهٔ جدید database.js را مستقیماً به‌صورت Document آپلود کن."), state);
  }

  async #deleteDatabase(state) {
    const deletedMessage = this.#text(state, "install.deleted", "🗑 دیتابیس حذف شد. منابع و حافظه‌های متعلق به دیتابیس نیز پاک‌سازی شدند. برای نصب دیتابیس جدید /install را بفرست.");
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
    state.forwardTask = null;
    state.groupSettings = {};
    await this.#save(state);
    cleanup.removed += await this.#completeResourceCleanup(state);
    state.resourceRegistry = {};
    await this.#save(state);
    await this.#scheduleNext(state);
    const pendingText = state.pendingResourceCleanup.length ? " پاک‌سازی بقیه منابع به‌صورت خودکار ادامه می‌یابد." : "";
    await this.#send(this.#ownerId(state), `${deletedMessage} (${cleanup.removed} مورد پاک‌سازی شد).${pendingText}`, state);
  }

  async #showStatus(state) {
    const db = this.#db(state);
    const budget = this.#budgetConfig(state);
    const remaining = Math.max(0, budget.dailyUnits - Number(state.budget.units || 0));
    const task = state.forwardTask;
    const message = renderTemplate(this.#text(state, "status", "📊 وضعیت\nدیتابیس: {dbVersion}\nحالت بودجه: {budgetMode}\nواحد باقی‌مانده تخمینی: {remaining}\nپیام‌های پردازش‌شده: {updates}\nفوروارد موفق: {forwarded}\nعملیات فوروارد: {forwardState}"), {
      dbVersion: db?.version || "نصب نشده",
      budgetMode: state.budget.mode,
      remaining,
      updates: state.metrics.updates,
      forwarded: state.metrics.forwarded,
      forwardState: task?.active ? "فعال" : "خاموش",
    });
    await this.#send(this.#ownerId(state), message, state, { reply_markup: this.#ownerKeyboard(state) });
  }

  async #loadFlowPrompt(state, key, fallback) {
    await this.#send(this.#ownerId(state), this.#text(state, key, fallback), state);
  }

  async #beginChannelPost(state) {
    const db = this.#db(state);
    if (!db) {
      await this.#send(this.#ownerId(state), "ابتدا دیتابیس را نصب کن.", state);
      return;
    }
    const targetRef = db.channels?.defaultTarget || db.channels?.targets?.[0];
    if (!targetRef) {
      await this.#send(this.#ownerId(state), this.#text(state, "channels.targetMissing", "در database.js مقدار channels.defaultTarget یا channels.targets را تنظیم کن."), state);
      return;
    }
    const target = await this.#telegram(state, "getChat", { chat_id: targetRef }, { bypassLocalRate: true });
    if (!target.ok || target.result?.type !== "channel") {
      await this.#send(this.#ownerId(state), this.#text(state, "channels.targetUnavailable", "کانال پیکربندی‌شده قابل دسترسی نیست."), state);
      return;
    }
    const me = await this.#telegram(state, "getMe", {}, { bypassLocalRate: true });
    const member = me.ok ? await this.#telegram(state, "getChatMember", { chat_id: target.result.id, user_id: me.result.id }, { bypassLocalRate: true }) : { ok: false };
    const canPost = member.result?.status === "creator" || (member.result?.status === "administrator" && member.result?.can_post_messages === true);
    if (!member.ok || !canPost) {
      await this.#send(this.#ownerId(state), this.#text(state, "channels.targetPermission", "ربات در کانال مقصد مجوز انتشار پست ندارد."), state);
      return;
    }
    state.channelPostTarget = { id: target.result.id, username: target.result.username || null };
    state.flow = "channel_post_text";
    await this.#save(state);
    await this.#send(this.#ownerId(state), this.#text(state, "channels.askPost", "متن پست را بفرست تا در کانال منتشر کنم."), state);
  }

  async #beginForward(state) {
    if (!this.#db(state)) {
      await this.#send(this.#ownerId(state), "ابتدا دیتابیس را با /install نصب کن.", state);
      return;
    }
    if (this.#db(state)?.forwarding?.enabled === false) {
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
      if (!target.ok || !["channel", "group", "supergroup"].includes(target.result?.type)) {
        await this.#loadFlowPrompt(state, "forward.targetUnavailable", "❌ مقصد باید کانال یا گروهی باشد که ربات به آن دسترسی دارد.");
        return;
      }
      if (String(target.result.id) === String(draft.sourceChatId)) {
        await this.#loadFlowPrompt(state, "forward.sameTarget", "❌ مبدأ و مقصد نمی‌توانند یکسان باشند.");
        return;
      }
      const me = await this.#telegram(state, "getMe", {}, { bypassLocalRate: true });
      const member = me.ok ? await this.#telegram(state, "getChatMember", { chat_id: target.result.id, user_id: me.result.id }, { bypassLocalRate: true }) : { ok: false };
      const isTargetChannel = target.result.type === "channel";
      const canPublish = member.result?.status === "creator" || (member.result?.status === "administrator" && member.result?.can_post_messages === true);
      const isPresentInGroup = !["left", "kicked"].includes(member.result?.status);
      if (!member.ok || (isTargetChannel ? !canPublish : !isPresentInGroup)) {
        await this.#loadFlowPrompt(state, "forward.targetPermission", "برای کانال، ربات باید مدیر با مجوز انتشار باشد؛ برای گروه، باید عضو گروه باشد.");
        return;
      }
      draft.targetChatId = target.result.id;
      draft.targetUsername = target.result.username || null;
      draft.targetTitle = target.result.title || target.result.username || String(target.result.id);
      draft.targetType = target.result.type;
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
        targetType: draft.targetType || "channel",
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

  async #handleCallback(state, callback) {
    const userId = callback.from?.id;
    if (!this.#isOwner(userId, state)) {
      await this.#answerCallback(callback.id, this.#text(state, "access.denied", "دسترسی نداری."));
      return;
    }
    const data = asText(callback.data);
    const databaseMutationActions = new Set(["db:install", "db:reload", "db:delete", "db:delete:yes"]);
    if (state.budget?.mode === "owner_only" && databaseMutationActions.has(data)) {
      await this.#answerCallback(callback.id);
      await this.#send(this.#ownerId(state), this.#text(state, "budget.installDisabled", "⚠️ سهمیه به محدوده هشدار رسیده؛ نصب، به‌روزرسانی و حذف دیتابیس تا بازنشانی بعدی غیرفعال است."), state);
      return;
    }
    await this.#answerCallback(callback.id);
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
        await this.#beginChannelPost(state);
        break;
      case "forward:stop":
        await this.#stopForward(state);
        break;
      case "status":
        await this.#showStatus(state);
        break;
      case "help":
        await this.#send(this.#ownerId(state), this.#text(state, "help", "برای گفت‌وگو پیام بده؛ مدیریت از طریق پنل مالک و فرمان‌های دیتابیس انجام می‌شود."), state, { reply_markup: this.#ownerKeyboard(state) });
        break;
      case "home":
        await this.#showStart(state, this.#ownerId(state), true);
        break;
      default:
        await this.#send(this.#ownerId(state), this.#text(state, "ui.unknown", "این گزینه شناخته نشد."), state);
    }
  }

  async #handlePrivateMessage(state, message) {
    const user = message.from || {};
    const chat = message.chat || {};
    const text = asText(message.text || message.caption);

    if (text.startsWith("/")) {
      const command = text.split(/\s+/, 1)[0].split("@")[0].toLowerCase();
      if (command === "/start") {
        // First private user to start the bot claims ownership. The DO serial queue
        // makes this a one-time, race-safe claim; no OWNER_ID variable is required.
        if (!state.security.ownerId) {
          const candidateId = String(user.id ?? "");
          if (!isTelegramId(candidateId) || Number(candidateId) <= 0 || user.is_bot || String(chat.id) !== candidateId) {
            await this.#send(chat.id, "برای ثبت مالک، دستور /start را در گفت‌وگوی خصوصی با حساب کاربری خودت بفرست.", state);
            return;
          }
          state.security.ownerId = candidateId;
          state.security.ownerClaimedAt = Date.now();
          state.security.ownerUsername = user.username || null;
          state.security.ownerDisplayName = userDisplay(user).slice(0, 120);
          await this.#save(state);
          await this.#send(chat.id, "👑 مالکیت ربات به‌صورت خودکار برای اولین کاربری که /start را ارسال کرد ثبت شد. این مالکیت در Durable Object ذخیره شده و با Deploy مجدد از بین نمی‌رود. برای نصب دیتابیس /install را بفرست.", state, {
            reply_markup: this.#ownerKeyboard(state),
          });
          return;
        }

        const owner = this.#isOwner(user.id, state);
        await this.#showStart(state, chat.id, owner);
        return;
      }

      const owner = this.#isOwner(user.id, state);
      if (command === "/install") {
        if (!owner) {
          await this.#send(chat.id, state.security.ownerId
            ? "⛔ این دستور فقط برای مالک ربات فعال است."
            : "ابتدا مالک باید در گفت‌وگوی خصوصی /start را ارسال کند.", state);
          return;
        }
        if (state.budget?.mode === "owner_only") {
          state.flow = null;
          await this.#save(state);
          await this.#send(chat.id, this.#text(state, "budget.installDisabled", "⚠️ سهمیه به محدوده هشدار رسیده؛ نصب، به‌روزرسانی و حذف دیتابیس تا بازنشانی بعدی غیرفعال است."), state);
          return;
        }
        state.flow = "database_upload";
        await this.#save(state);
        await this.#send(chat.id, this.#text(state, "install.prompt", "📎 فایل database.js را به‌صورت Document (نه متن پیام) همین‌جا آپلود کن. حجم مجاز حداکثر 256 KiB است."), state);
        return;
      }
      return;
    }

    const owner = this.#isOwner(user.id, state);
    if (owner && state.flow === "database_upload") {
      if (state.budget?.mode === "owner_only") {
        state.flow = null;
        await this.#save(state);
        await this.#send(chat.id, this.#text(state, "budget.installDisabled", "⚠️ سهمیه به محدوده هشدار رسیده؛ نصب، به‌روزرسانی و حذف دیتابیس تا بازنشانی بعدی غیرفعال است."), state);
        return;
      }
      if (message.document) {
        await this.#installFromTelegramDocument(state, message);
      } else {
        await this.#send(chat.id, "منتظر فایل database.js هستم. فایل را با گزینهٔ ارسال به‌صورت Document بفرست، نه به شکل متن یا تصویر.", state);
      }
      return;
    }

    if (owner && state.flow === "channel_post_text") {
      const targetId = state.channelPostTarget?.id;
      if (!targetId) {
        state.flow = null;
        await this.#save(state);
        await this.#send(chat.id, this.#text(state, "channels.targetMissing", "کانال پیش‌فرض در دیتابیس تنظیم نشده است."), state);
        return;
      }
      const outgoing = text
        ? await this.#send(targetId, text, state, {}, { minIntervalMs: Number(this.#db(state)?.limits?.channelSendIntervalMs || 1_100) })
        : await this.#telegram(state, "copyMessage", { chat_id: targetId, from_chat_id: chat.id, message_id: message.message_id }, { minIntervalMs: Number(this.#db(state)?.limits?.channelSendIntervalMs || 1_100) });
      if (outgoing.ok) {
        await this.#send(chat.id, this.#text(state, "channels.postSent", "✅ پست در کانال منتشر شد."), state, { reply_markup: this.#ownerKeyboard(state) });
      } else {
        await this.#send(chat.id, renderTemplate(this.#text(state, "channels.postFailed", "❌ ارسال پست ناموفق بود: {reason}"), { reason: asText(outgoing.description || "خطای تلگرام").slice(0, 160) }), state);
      }
      state.flow = null;
      state.channelPostTarget = null;
      await this.#save(state);
      return;
    }
    if (owner && state.flow?.startsWith("forward_")) {
      await this.#forwardFlowText(state, text);
      return;
    }

    if (owner && message.document) {
      await this.#send(chat.id, "برای نصب یا به‌روزرسانی دیتابیس، ابتدا /install را بفرست و سپس فایل database.js را آپلود کن.", state);
      return;
    }

    const db = this.#db(state);
    if (!db || !text) return;
    const privateJokes = db.features?.jokes || {};
    if (privateJokes.enabled && matchPhrase(text, privateJokes.triggerWords || ["جوک", "لطیفه"])) {
      await this.#reply(message, randomItem(privateJokes.items, this.#text(state, "jokes.empty", "فعلاً جوکی ندارم!")), state);
      return;
    }
    const normalized = normalizeText(text);
    const contextKey = `${chat.id}:${user.id}`;
    const memoryEnabled = db.features?.memory?.enabled !== false;
    const priorContext = memoryEnabled ? await this.#resourceGet(state, "chat-context", contextKey) : null;
    const contextFingerprint = priorContext?.lastMessage ? normalizeText(priorContext.lastMessage).slice(0, 40) : "new";
    // Include the user/chat in the key: personalized templates must never leak across users.
    const cacheKey = `${chat.id}:${user.id}:${normalized.slice(0, 120)}|${contextFingerprint}`;
    const cached = memoryEnabled ? this.#cacheGet(cacheKey) : "";
    const cooldownMs = Math.max(0, Number(db.features?.chatbot?.cooldownSeconds || 0)) * 1000;
    const cooldownActive = Boolean(cooldownMs && priorContext?.lastReplyAt && Date.now() - Number(priorContext.lastReplyAt) < cooldownMs);
    const answer = cooldownActive ? "" : (cached || this.#chatbotAnswer(text, db, priorContext));
    if (answer) {
      state.metrics.replies += 1;
      await this.#save(state);
      if (memoryEnabled) {
        this.#cacheSet(cacheKey, answer, Number(db.runtime?.cache?.chatAnswerTtlSeconds || 600) * 1000);
        const history = Array.isArray(priorContext?.history) ? priorContext.history : [];
        history.push({ prompt: text.slice(0, 500), answer: answer.slice(0, 500), at: Date.now() });
        await this.#resourcePut(state, "chat-context", contextKey, {
          userId: String(user.id), chatId: String(chat.id), displayName: userDisplay(user), lastMessage: text.slice(0, 500),
          history: history.slice(-Math.max(1, Number(db.features?.memory?.privateHistory || 12))), lastReplyAt: Date.now(), updatedAt: Date.now(),
        });
      }
      await this.#reply(message, answer, state);
    }
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
    if (!feature.enabled || !text || text.length > Number(feature.maxInputLength || 1200)) return "";
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
    if (!feature.enabled || !feature.autoApprove) return;
    const chatId = request.chat?.id;
    if (!chatId) return;
    const result = await this.#telegram(state, "approveChatJoinRequest", {
      chat_id: chatId,
      user_id: request.from.id,
    }, { bypassLocalRate: true });
    if (result.ok && feature.notify) {
      await this.#send(this.#ownerId(state), renderTemplate(this.#text(state, "join.approved", "✅ درخواست عضویت {name} تأیید شد."), { name: userDisplay(request.from) }), state);
    }
  }

  async #handleNewMembers(state, message) {
    const feature = this.#db(state)?.features?.welcome || {};
    if (!feature.enabled) return;
    const text = asText(feature.text || this.#text(state, "welcome", "سلام {name}، خوش اومدی!"));
    for (const user of message.new_chat_members || []) {
      if (user.is_bot) continue;
      await this.#send(message.chat.id, renderTemplate(text, {
        name: userDisplay(user),
        username: user.username ? `@${user.username}` : "",
        id: user.id,
        chat: message.chat.title || "گروه",
      }), state, {}, { group: true });
    }
  }

  async #recordSpam(state, message, db) {
    const anti = db.features?.antiSpam || {};
    if (!anti.enabled || !message.from?.id) return false;
    const userId = String(message.from.id);
    const chatId = String(message.chat.id);
    const protectedIds = [
      ...(db.roles?.protectedIds || []),
      ...(db.features?.moderation?.protectedIds || []),
    ].map(String);
    if ((anti.exemptIds || []).map(String).includes(userId)
      || protectedIds.includes(userId)
      || this.#isOperator(userId, chatId, db, state)) return false;
    const key = `${chatId}:${userId}`;
    const now = Date.now();
    const spanMs = clampNumber(anti.windowSeconds, 10, 3, 120) * 1_000;
    const record = state.spam[key] || { times: [], signatures: [] };
    record.times = (record.times || []).filter((time) => now - time <= spanMs).slice(-30);
    record.signatures = (record.signatures || []).filter((item) => now - item.at <= 60_000).slice(-30);
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
    if (signature) record.signatures.push({ value: signature, at: now });
    record.times = record.times.slice(-30);
    record.signatures = record.signatures.slice(-30);
    const maxMessages = clampNumber(anti.maxMessages, 6, 3, 30);
    const duplicateLimit = clampNumber(anti.duplicateLimit, 3, 2, 10);
    const duplicateCount = signature ? record.signatures.filter((item) => item.value === signature).length : 0;
    state.spam[key] = record;
    const keys = Object.keys(state.spam);
    const maxTrackedUsers = clampNumber(anti.maxTrackedUsers || db.limits?.maxRememberedSpamUsers, 600, 100, 2_000);
    if (keys.length > maxTrackedUsers) {
      for (const oldKey of keys.slice(0, keys.length - Math.max(100, Math.floor(maxTrackedUsers * 0.75)))) delete state.spam[oldKey];
    }
    await this.#save(state);
    if (record.times.length >= maxMessages || (signature && duplicateCount >= duplicateLimit)) {
      await this.#telegram(state, "deleteMessage", { chat_id: chatId, message_id: message.message_id }, { bypassLocalRate: true });
      const minutes = clampNumber(anti.muteMinutes, 10, 1, 1_440);
      const untilDate = Math.floor(now / 1_000) + minutes * 60;
      const muted = await this.#telegram(state, "restrictChatMember", {
        chat_id: chatId,
        user_id: Number(userId),
        permissions: {
          can_send_messages: false,
          can_send_audios: false,
          can_send_documents: false,
          can_send_photos: false,
          can_send_videos: false,
          can_send_video_notes: false,
          can_send_voice_notes: false,
          can_send_polls: false,
          can_send_other_messages: false,
          can_add_web_page_previews: false,
        },
        until_date: untilDate,
        use_independent_chat_permissions: true,
      }, { bypassLocalRate: true });
      state.metrics.moderated += 1;
      record.times = [];
      record.signatures = [];
      await this.#save(state);
      if (muted.ok) {
        await this.#send(chatId, renderTemplate(this.#text(state, "moderation.muted", "🛡 به دلیل اسپم، {name} برای {minutes} دقیقه محدود شد."), {
          name: userDisplay(message.from), minutes,
        }), state, {}, { group: true });
      }
      return true;
    }
    return false;
  }

  async #replyAction(state, message, operator, db) {
    if (!operator || !message.reply_to_message?.from || !message.text) return false;
    const actions = db.features?.moderation?.replyActions || [];
    const text = normalizeText(message.text);
    const selected = actions.find((item) => (item.terms || []).some((term) => normalizeText(term) === text));
    if (!selected) return false;
    const target = message.reply_to_message.from;
    const chatId = message.chat.id;
    const protectedIds = [...(db.roles?.protectedIds || []), ...(db.features?.moderation?.protectedIds || [])].map(String);
    if (!target.id || target.is_bot || this.#isOperator(target.id, chatId, db, state) || protectedIds.includes(String(target.id))) {
      await this.#reply(message, this.#text(state, "moderation.protected", "این کاربر در فهرست محافظت‌شده است."), state);
      return true;
    }

    const action = selected.action;
    const userId = Number(target.id);
    if (["ban", "kick", "mute", "unmute", "unban"].includes(action)) {
      const targetMember = await this.#telegram(state, "getChatMember", { chat_id: chatId, user_id: userId }, { bypassLocalRate: true });
      if (!targetMember.ok || !targetMember.result?.status) {
        await this.#reply(message, this.#text(state, "moderation.memberCheckFailed", "⚠️ وضعیت عضو قابل تأیید نیست؛ برای جلوگیری از اقدام اشتباه، عملیات انجام نشد."), state);
        return true;
      }
      if (["creator", "administrator"].includes(targetMember.result.status)) {
        await this.#reply(message, this.#text(state, "moderation.protected", "🛡 مدیران گروه محافظت می‌شوند."), state);
        return true;
      }
    }
    let result = { ok: false, description: "UNKNOWN_ACTION" };
    if (action === "ban") {
      result = await this.#telegram(state, "banChatMember", { chat_id: chatId, user_id: userId }, { bypassLocalRate: true });
    } else if (action === "kick") {
      result = await this.#telegram(state, "banChatMember", { chat_id: chatId, user_id: userId, until_date: Math.floor(Date.now() / 1_000) + 60 }, { bypassLocalRate: true });
      if (result.ok) {
        const unbanResult = await this.#telegram(state, "unbanChatMember", { chat_id: chatId, user_id: userId, only_if_banned: true }, { bypassLocalRate: true });
        if (!unbanResult.ok) result = unbanResult;
      }
    } else if (action === "mute") {
      const minutes = clampNumber(selected.minutes, 60, 1, 40_320);
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
      result = await this.#send(chatId, renderTemplate(this.#text(state, "moderation.warn", "⚠️ {name}، لطفاً قوانین گروه را رعایت کن."), { name: userDisplay(target) }), state, {}, { group: true });
    }

    const success = result.ok;
    if (success) state.metrics.moderated += 1;
    await this.#save(state);
    const responseText = success
      ? renderTemplate(this.#text(state, "moderation.actionSuccess", "✅ عملیات {action} برای {name} انجام شد."), { action: selected.label || action, name: userDisplay(target) })
      : renderTemplate(this.#text(state, "moderation.actionFailed", "❌ عملیات انجام نشد: {reason}"), { reason: asText(result.description || "خطای تلگرام").slice(0, 160) });
    await this.#reply(message, responseText, state);
    return true;
  }

  async #handleGroupMessage(state, message) {
    const db = this.#db(state);
    if (!db) return;
    const chat = message.chat;
    const text = asText(message.text || message.caption);
    const user = message.from || {};
    if (user.is_bot) return;
    const operator = this.#isOperator(user.id, chat.id, db, state);
    const groupKey = String(chat.id);
    let settings = state.groupSettings[groupKey];
    if (!settings) {
      const knownGroups = Object.entries(state.groupSettings);
      if (knownGroups.length >= 500) {
        knownGroups.sort((a, b) => Number(a[1]?.lastSeenAt || 0) - Number(b[1]?.lastSeenAt || 0));
        for (const [oldGroup] of knownGroups.slice(0, knownGroups.length - 399)) delete state.groupSettings[oldGroup];
      }
      settings = { chatterEnabled: false, chatterNextAt: 0, jokesEnabled: true, chatbotEnabled: true };
      state.groupSettings[groupKey] = settings;
    }
    settings.lastSeenAt = Date.now();
    const protectedSenderIds = [
      ...(db.roles?.protectedIds || []),
      ...(db.features?.moderation?.protectedIds || []),
    ].map(String);
    const trustedSender = operator || protectedSenderIds.includes(String(user.id));

    if (message.new_chat_members?.length) await this.#handleNewMembers(state, message);

    const botTerms = db.features?.botReplyJokes?.terms || ["سیک", "بن", "ریم", "گمشو"];
    if (message.reply_to_message?.from?.is_bot && matchPhrase(text, botTerms)) {
      await this.#reply(message, this.#text(state, "botReplyJokes.missed", "اشتباه زدی 😂 منو نمی‌شه ریم کرد!"), state);
      return;
    }

    if (await this.#replyAction(state, message, operator, db)) return;

    const controls = db.features?.controls || [];
    if (operator && text) {
      const control = controls.find((item) => matchPhrase(text, item.terms || []));
      if (control) {
        const value = Boolean(control.value);
        if (control.feature === "chatter") {
          settings.chatterEnabled = value;
          settings.chatterNextAt = value ? Date.now() + clampNumber(db.features?.chatter?.intervalMinutes, 25, 20, 1_440) * 60_000 : 0;
        } else if (control.feature === "jokes") settings.jokesEnabled = value;
        else if (control.feature === "chatbot") settings.chatbotEnabled = value;
        await this.#save(state);
        await this.#reply(message, this.#text(state, control.textKey || "controls.updated", "✅ تنظیم گروه به‌روزرسانی شد."), state);
        await this.#scheduleNext(state);
        return;
      }
    }

    if (!trustedSender && await this.#recordSpam(state, message, db)) return;

    const moderation = db.features?.moderation || {};
    if (!trustedSender && moderation.enabled) {
      const blockedWords = moderation.blockedWords || [];
      if (matchPhrase(text, blockedWords)) {
        await this.#telegram(state, "deleteMessage", { chat_id: chat.id, message_id: message.message_id }, { bypassLocalRate: true });
        await this.#send(chat.id, this.#text(state, "moderation.blockedWord", "⛔ این پیام با قوانین گروه سازگار نیست."), state, {}, { group: true });
        state.metrics.moderated += 1;
        await this.#save(state);
        return;
      }
      const antiLinks = moderation.deleteLinks === true;
      if (antiLinks && /(?:https?:\/\/|t\.me\/|www\.)/i.test(text)) {
        await this.#telegram(state, "deleteMessage", { chat_id: chat.id, message_id: message.message_id }, { bypassLocalRate: true });
        state.metrics.moderated += 1;
        await this.#save(state);
        return;
      }
    }

    const jokes = db.features?.jokes || {};
    if (settings.jokesEnabled !== false && jokes.enabled && text && matchPhrase(text, jokes.triggerWords || ["جوک", "یه جوک بگو"])) {
      await this.#reply(message, randomItem(jokes.items, this.#text(state, "jokes.empty", "فعلاً جوکی ندارم!")), state);
      return;
    }

    if (settings.chatbotEnabled !== false && text) {
      const contextKey = `group:${chat.id}:${user.id}`;
      const memory = db.features?.memory?.enabled ? await this.#resourceGet(state, "chat-context", contextKey) : null;
      const cacheKey = `g:${chat.id}:${user.id}:${normalizeText(text).slice(0, 120)}:${normalizeText(memory?.lastMessage || "new").slice(0, 40)}`;
      const answer = this.#cacheGet(cacheKey) || this.#chatbotAnswer(text, db, memory);
      if (answer) {
        this.#cacheSet(cacheKey, answer, Number(db.runtime?.cache?.chatAnswerTtlSeconds || 600) * 1000);
        const history = Array.isArray(memory?.history) ? memory.history : [];
        history.push({ prompt: text.slice(0, 300), answer: answer.slice(0, 300), at: Date.now() });
        if (db.features?.memory?.enabled) await this.#resourcePut(state, "chat-context", contextKey, {
          userId: String(user.id), chatId: String(chat.id), displayName: userDisplay(user), lastMessage: text.slice(0, 300),
          history: history.slice(-Math.max(1, Number(db.features.memory.groupHistory || 6))), lastReplyAt: Date.now(), updatedAt: Date.now(),
        });
        state.metrics.replies += 1;
        await this.#save(state);
        await this.#reply(message, answer, state);
        return;
      }
    }

    await this.#save(state);
    await this.#scheduleNext(state);
  }

  async #handleChannelPost(state, message) {
    const db = this.#db(state);
    if (!db || !db.features?.channelModeration?.enabled) return;
    const feature = db.features.channelModeration;
    const text = asText(message.text || message.caption);
    const managed = (feature.channelIds || []).map(String);
    if (managed.length && !managed.includes(String(message.chat.id))) return;
    if (matchPhrase(text, feature.blockedWords || [])) {
      await this.#telegram(state, "deleteMessage", { chat_id: message.chat.id, message_id: message.message_id }, { bypassLocalRate: true });
      await this.#send(this.#ownerId(state), renderTemplate(this.#text(state, "channel.deleted", "🧹 یک پست دارای واژه ممنوع از {channel} حذف شد."), { channel: message.chat.title || message.chat.id }), state);
    }
  }

  async rememberWebhook(webhookUrl) {
    return this.#exclusive(async () => {
      const parsed = new URL(String(webhookUrl));
      if (parsed.protocol !== "https:" || !parsed.pathname.endsWith("/telegram/webhook")) return false;
      const state = await this.#load();
      state.webhookUrl = parsed.toString();
      await this.#save(state);
      return true;
    });
  }

  async handleUpdate(update, requestOrigin = "") {
    return this.#exclusive(() => this.#handleUpdateInner(update, requestOrigin));
  }

  async #handleUpdateInner(update, requestOrigin) {
    const state = await this.#load();
    if (requestOrigin) {
      try {
        const origin = new URL(requestOrigin);
        if (origin.protocol === "https:") state.webhookUrl = `${origin.origin}/telegram/webhook`;
      } catch {}
    }
    const updateId = update?.update_id;
    const hasUpdateId = Number.isSafeInteger(updateId) && updateId >= 0;
    if (hasUpdateId && (state.updateIds || []).includes(updateId)) return;

    await (async () => {
      const incomingMessage = update?.message;
      const incomingCommand = asText(incomingMessage?.text).split(/\s+/, 1)[0].split("@")[0].toLowerCase();
      const incomingUserId = String(incomingMessage?.from?.id ?? "");
      const firstPrivateStart = !this.#ownerId(state)
        && isPrivate(incomingMessage?.chat)
        && incomingCommand === "/start"
        && !incomingMessage?.from?.is_bot
        && isTelegramId(incomingUserId)
        && Number(incomingUserId) > 0
        && String(incomingMessage?.chat?.id) === incomingUserId;
      // A v3 deployment could have exhausted or paused its internal budget before v4
      // has an owner identity. Bootstrap a fresh v4 budget together with the one-time claim.
      if (firstPrivateStart) {
        state.budget = { day: utcDay(), units: 0, mode: "active", lastNotice: null, webhookDisabled: false };
        state.flow = null;
        state.dbUrl = null;
        state.forwardDraft = null;
        state.channelPostTarget = null;
        await this.#save(state);
      }
      const budget = await this.#chargeBudget(state);
      if (budget.mode === "paused") return;

      const callback = update?.callback_query;
      if (callback) {
        if (!this.#isOwner(callback.from?.id, state)) {
          await this.#answerCallback(callback.id, this.#text(state, "access.denied", "دسترسی نداری."));
          return;
        }
        if (!isPrivate(callback.message?.chat)) {
          await this.#answerCallback(callback.id, this.#text(state, "access.privateOnly", "این پنل فقط در گفت‌وگوی خصوصی فعال است."));
          return;
        }
        await this.#handleCallback(state, callback);
        return;
      }

      const botStatus = update?.my_chat_member;
      if (botStatus) {
        const nextStatus = botStatus.new_chat_member?.status;
        const chat = botStatus.chat || {};
        if (["left", "kicked"].includes(nextStatus)) {
          if (state.groupSettings[String(chat.id)]) {
            state.groupSettings[String(chat.id)].chatterEnabled = false;
            state.groupSettings[String(chat.id)].chatterNextAt = 0;
          }
          await this.#save(state);
          await this.#send(this.#ownerId(state), `⚠️ ربات از «${asText(chat.title || chat.id)}» حذف شد یا دسترسی‌اش لغو شد.`, state, {}, { bypassLocalRate: true });
        } else if (["member", "administrator"].includes(nextStatus)) {
          await this.#send(this.#ownerId(state), `✅ ربات به «${asText(chat.title || chat.id)}» دسترسی گرفت.`, state, {}, { bypassLocalRate: true });
        }
        return;
      }

      const joinRequest = update?.chat_join_request;
      if (joinRequest) {
        if (budget.mode === "owner_only") return;
        await this.#handleJoinRequest(state, joinRequest);
        return;
      }

      const channelPost = update?.channel_post || update?.edited_channel_post;
      if (channelPost) {
        if (budget.mode === "owner_only") return;
        await this.#handleChannelPost(state, channelPost);
        return;
      }

      const message = update?.message || update?.edited_message;
      if (!message) return;
      const user = message.from || {};
      const chat = message.chat || {};
      const isOwner = this.#isOwner(user.id, state);

      if (budget.mode === "owner_only" && !isOwner) return;
      if (isPrivate(chat)) {
        await this.#handlePrivateMessage(state, message);
        state.metrics.updates += 1;
        await this.#save(state);
      } else if (isGroup(chat)) {
        if (budget.mode === "owner_only" && !isOwner) return;
        await this.#handleGroupMessage(state, message);
        state.metrics.updates += 1;
        await this.#save(state);
      }
    })();

    // Commit the de-duplication marker only after the update handler completed without throwing.
    if (hasUpdateId) {
      const ids = state.updateIds || [];
      ids.push(updateId);
      state.updateIds = ids.slice(-256);
      await this.#save(state);
    }
  }

  async #scheduleNext(state) {
    if (state.budget.mode !== "active") {
      const target = nextUtcMidnightMs();
      const current = await this.ctx.storage.getAlarm();
      if (!Number.isFinite(current) || Math.abs(current - target) > 1_000) await this.ctx.storage.setAlarm(target);
      return;
    }
    const due = [];
    if (state.forwardTask?.active) due.push(Number(state.forwardTask.nextAt || Date.now() + 1_000));
    if (this.#db(state)?.features?.chatter?.enabled) {
      for (const settings of Object.values(state.groupSettings || {})) {
        if (settings.chatterEnabled && settings.chatterNextAt) due.push(Number(settings.chatterNextAt));
      }
    }
    if (Object.keys(state.resourceRegistry || {}).length || (state.pendingResourceCleanup || []).length || (state.pendingResourceKeyCleanup || []).length) {
      if (!state.maintenanceNextAt) state.maintenanceNextAt = Date.now() + 30 * 60_000;
      due.push(Number(state.maintenanceNextAt));
    }
    if (state.budget.mode !== "active") due.push(nextUtcMidnightMs());
    if (due.length) {
      const target = Math.max(Date.now() + 250, Math.min(...due));
      const current = await this.ctx.storage.getAlarm();
      if (!Number.isFinite(current) || Math.abs(current - target) > 1_000) {
        await this.ctx.storage.setAlarm(target);
      }
    } else if (await this.ctx.storage.getAlarm()) {
      await this.ctx.storage.deleteAlarm();
    }
  }

  async #runForward(state, now) {
    const task = state.forwardTask;
    if (!task?.active || Number(task.nextAt || 0) > now) return;

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
      state.metrics.forwarded += 1;
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
    if (!feature.enabled) return;
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
      if (!settings.chatterEnabled || Number(settings.chatterNextAt || 0) > now) continue;
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
          state.metrics.chatter += 1;
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

  async alarm() {
    return this.#exclusive(() => this.#alarmInner());
  }

  async #alarmInner() {
    const state = await this.#load();
    const now = Date.now();
    const wasDay = state.budget.day;
    await this.#budgetRoll(state, now);
    if (wasDay !== state.budget.day) {
      await this.#scheduleNext(state);
      return;
    }
    if (state.budget.mode !== "active") {
      const target = nextUtcMidnightMs(now);
      const current = await this.ctx.storage.getAlarm();
      if (!Number.isFinite(current) || Math.abs(current - target) > 1_000) await this.ctx.storage.setAlarm(target);
      return;
    }
    const budget = await this.#chargeBudget(state, now);
    if (budget.mode === "paused") return;
    try {
      await this.#completeResourceCleanup(state, 256);
    } catch (error) {
      console.error("Resource cleanup batch failed; will retry", error);
      state.maintenanceNextAt = Date.now() + 60_000;
      await this.#save(state);
    }
    await this.#sweepResources(state, now);
    // Warning mode is owner-only: automated public forwarding/chatter must stop.
    if (budget.mode === "active") {
      await this.#runForward(state, now);
      await this.#runChatter(state, now);
    }
    await this.#scheduleNext(state);
  }
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;
    if (request.method === "GET" && path === "/healthz") return textResponse("ok");

    if (request.method === "GET" && (path === "/" || path === "/setup")) {
      if (!validBotToken(env)) return textResponse("Bot token is missing or invalid. Check the embedded token in worker.js.", 503);
      const token = botTokenFrom(env);
      const secret = await webhookSecret(token);
      let result;
      try {
        const response = await fetch(`${BOT_API}${token}/setWebhook`, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            url: `${url.origin}/telegram/webhook`,
            secret_token: secret,
            allowed_updates: ["message", "edited_message", "callback_query", "channel_post", "edited_channel_post", "chat_join_request", "my_chat_member"],
            drop_pending_updates: false,
          }),
          signal: AbortSignal.timeout(TELEGRAM_TIMEOUT_MS),
        });
        result = await response.json().catch(() => null);
        if (!response.ok || !result || typeof result !== "object") {
          throw new Error(`TELEGRAM_HTTP_${response.status}`);
        }
      } catch (error) {
        const reason = asText(error?.message || error).replace(/https?:\/\/\S+/g, "[url]").slice(0, 160);
        return textResponse(`Webhook setup failed: ${reason}`, 502);
      }

      if (result.ok) {
        try {
          const stub = env.SCHEDULER.get(env.SCHEDULER.idFromName(DO_NAME));
          await stub.rememberWebhook(`${url.origin}/telegram/webhook`);
        } catch (error) {
          console.error("Could not persist webhook URL", error);
          return textResponse("Telegram webhook was set, but its URL could not be stored. Retry /setup once.", 503);
        }
        return textResponse("Webhook installed. Immediately open the bot and send /start from the private chat to claim one-time owner access.");
      }
      return textResponse(`Webhook setup failed: ${asText(result.description || result.error_code || "Telegram rejected setWebhook")}`.slice(0, 500), 502);
    }

    if (request.method !== "POST" || path !== "/telegram/webhook") return textResponse("Not found", 404);
    if (!validBotToken(env)) return textResponse("Bot token is missing or invalid. Check the embedded token in worker.js.", 503);
    const declaredLength = Number(request.headers.get("content-length") || 0);
    if (Number.isFinite(declaredLength) && declaredLength > 1_000_000) return textResponse("Payload too large", 413);

    const expected = await webhookSecret(botTokenFrom(env));
    const received = request.headers.get("X-Telegram-Bot-Api-Secret-Token") || "";
    if (received.length !== expected.length) return textResponse("Forbidden", 403);
    let difference = 0;
    for (let index = 0; index < expected.length; index += 1) difference |= expected.charCodeAt(index) ^ received.charCodeAt(index);
    if (difference !== 0) return textResponse("Forbidden", 403);

    let update;
    try {
      const body = await readBodyTextLimited(request, 1_000_000);
      update = JSON.parse(body);
      if (!update || typeof update !== "object" || Array.isArray(update)) return textResponse("Bad request", 400);
    } catch (error) {
      if (error?.message === "DATABASE_TOO_LARGE") return textResponse("Payload too large", 413);
      return textResponse("Bad request", 400);
    }
    try {
      const id = env.SCHEDULER.idFromName(DO_NAME);
      const stub = env.SCHEDULER.get(id);
      await stub.handleUpdate(update, url.origin);
      return textResponse("ok");
    } catch (error) {
      console.error("Webhook update failed", error);
      return textResponse("Internal error", 500);
    }
  },
};
