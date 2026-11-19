import { DurableObject } from "cloudflare:workers";
import { ForwardSchedulerRuntime, readBodyTextLimited } from "./modules.js";

// The owner explicitly requested source-embedded credentials. Do not print this value.
// Any person with access to the source archive can control the bot; rotate it if shared.
const EMBEDDED_BOT_TOKEN = "9100041417:AAHYOpFKKTGpBQpdHoTAExwZYzlXPqOtSjg";
const DO_NAME = "forward-scheduler-owner";
const MAX_WEBHOOK_BYTES = 1_000_000;
const BOT_API = "https://api.telegram.org/bot";

function textResponse(text, status = 200) {
  return new Response(String(text), {
    status,
    headers: { "content-type": "text/plain; charset=utf-8", "cache-control": "no-store" },
  });
}

function botTokenFrom(env) { return String(EMBEDDED_BOT_TOKEN || env?.BOT_TOKEN || "").trim(); }
function validBotToken(env) { return /^\d{6,12}:[A-Za-z0-9_-]{25,}$/.test(botTokenFrom(env)); }

async function webhookSecret(botToken) {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(`forward-scheduler-telegram-webhook:${botToken}`),
  );
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

function constantTimeEqual(expected, received) {
  if (typeof received !== "string" || expected.length !== received.length) return false;
  let difference = 0;
  for (let index = 0; index < expected.length; index += 1) {
    difference |= expected.charCodeAt(index) ^ received.charCodeAt(index);
  }
  return difference === 0;
}

function safeLogError(label, error) {
  const message = String(error?.message || error || "unknown")
    .replace(new RegExp(EMBEDDED_BOT_TOKEN.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g"), "[redacted]")
    .replace(/https?:\/\/api\.telegram\.org\/[^\s]+/gi, "[telegram-api-url]")
    .slice(0, 180);
  console.error(JSON.stringify({ event: label, error: message, at: new Date().toISOString() }));
}

export class ForwardScheduler extends DurableObject {
  constructor(ctx, env) {
    super(ctx, env);
    const runtimeEnv = Object.create(env || null);
    runtimeEnv.EMBEDDED_BOT_TOKEN = EMBEDDED_BOT_TOKEN;
    this.runtime = new ForwardSchedulerRuntime(ctx, runtimeEnv);
  }

  handleUpdate(update) { return this.runtime.handleUpdate(update); }
  setupWebhookOnce(publicOrigin) { return this.runtime.setupWebhookOnce(publicOrigin); }
  alarm(alarmInfo) { return this.runtime.alarm(alarmInfo); }
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;
    if (request.method === "GET" && path === "/healthz") return textResponse("ok");
    if (request.method === "GET" && path === "/") {
      return textResponse("Forward Scheduler is online. Open /setup once to connect the Telegram webhook.");
    }

    if (request.method === "GET" && path === "/setup") {
      if (!validBotToken(env)) return textResponse("The embedded Telegram bot token is invalid.", 503);
      try {
        const stub = env.SCHEDULER.get(env.SCHEDULER.idFromName(DO_NAME));
        const result = await stub.setupWebhookOnce(url.origin);
        if (!result.ok) return textResponse(`Webhook setup failed: ${result.reason || "unknown error"}`, 502);
        return textResponse(result.already
          ? "Webhook is already connected."
          : "Webhook connected. The configured owner can now open the bot and send /settings.");
      } catch (error) {
        safeLogError("webhook_bootstrap_failed", error);
        return textResponse("Webhook setup failed due to a temporary error.", 502);
      }
    }

    if (request.method !== "POST" || path !== "/telegram/webhook") return textResponse("Not found", 404);
    if (!validBotToken(env)) return textResponse("The embedded Telegram bot token is invalid.", 503);
    const declaredLength = Number(request.headers.get("content-length") || 0);
    if (Number.isFinite(declaredLength) && declaredLength > MAX_WEBHOOK_BYTES) return textResponse("Payload too large", 413);

    const expected = await webhookSecret(botTokenFrom(env));
    const received = request.headers.get("X-Telegram-Bot-Api-Secret-Token") || "";
    if (!constantTimeEqual(expected, received)) return textResponse("Forbidden", 403);

    let update;
    try {
      const body = await readBodyTextLimited(request, MAX_WEBHOOK_BYTES);
      update = JSON.parse(body);
      if (!update || typeof update !== "object" || Array.isArray(update)
        || !Number.isSafeInteger(update.update_id) || update.update_id < 0) {
        return textResponse("Bad request", 400);
      }
      const recognized = ["message", "edited_message", "callback_query", "my_chat_member", "chat_member", "chat_join_request", "channel_post", "edited_channel_post"];
      if (!recognized.some((key) => Object.hasOwn(update, key))) return textResponse("Bad request", 400);
    } catch (error) {
      if (error?.message === "DATABASE_TOO_LARGE") return textResponse("Payload too large", 413);
      return textResponse("Bad request", 400);
    }

    try {
      const stub = env.SCHEDULER.get(env.SCHEDULER.idFromName(DO_NAME));
      const result = await stub.handleUpdate(update);
      if (result?.queued === false && result?.reason === "QUEUE_FULL") return textResponse("Queue full", 503);
      return textResponse("ok");
    } catch (error) {
      safeLogError("webhook_enqueue_failed", error);
      return textResponse("Internal error", 503);
    }
  },
};
