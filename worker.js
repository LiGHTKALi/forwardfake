import { DurableObject } from "cloudflare:workers";
import {
  asText,
  button,
  constantTimeEqual,
  DAILY_SEND_LIMIT,
  mainKeyboard,
  MAX_INTERVAL_MS,
  MAX_REPEAT,
  MIN_INTERVAL_MS,
  nextUtcMidnightMs,
  parseIntervalInput,
  parseMessageLink,
  parsePublicChannel,
  taskInterval,
  theoreticalDaily,
  utcDay,
  isValidOwnerId,
} from "./lib.js";

const BOT_API = "https://api.telegram.org/bot";
// Single-click configuration copied from the supplied original Python source.
const BOT_TOKEN = "9204167908:AAHwp-jsf6u4v-Ow2dzgi-E83wJOwEtOs8Q";
const OWNER_ID = 8621035125;
const ALARM_START_DELAY_MS = 1_000;
const TELEGRAM_TIMEOUT_MS = 12_000;
const MAX_TELEGRAM_ERROR_TEXT = 240;

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" },
  });
}

function textResponse(text, status = 200) {
  return new Response(text, {
    status,
    headers: { "content-type": "text/plain; charset=utf-8" },
  });
}

async function makeWebhookSecret(botToken, ownerId) {
  const input = new TextEncoder().encode(`forward-scheduler-webhook:${botToken}:${ownerId}`);
  const digest = await crypto.subtle.digest("SHA-256", input);
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

function configError() {
  if (!asText(BOT_TOKEN)) return "BOT_TOKEN is missing.";
  if (!isValidOwnerId(OWNER_ID)) return "OWNER_ID must be a numeric Telegram user ID.";
  return null;
}

function formatUtc(timestampMs) {
  return new Date(timestampMs).toISOString().replace("T", " ").replace(".000Z", " UTC");
}

export class ForwardScheduler extends DurableObject {
  constructor(ctx, env) {
    super(ctx, env);
  }

  async #load() {
    const stored = await this.ctx.storage.get("state");
    if (stored && typeof stored === "object" && !Array.isArray(stored)) return stored;

    return {
      flow: null,
      draft: null,
      target: null,
      task: null,
      usage_day: utcDay(),
      usage_count: 0,
      commands_installed: false,
    };
  }

  async #save(state) {
    await this.ctx.storage.put("state", state);
  }

  #ownerId() {
    return OWNER_ID;
  }

  async #tg(method, payload = {}) {
    const token = BOT_TOKEN;
    if (!token) return { ok: false, description: "BOT_TOKEN is not configured." };

    try {
      const response = await fetch(`${BOT_API}${token}/${method}`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(TELEGRAM_TIMEOUT_MS),
      });
      const result = await response.json().catch(() => null);
      if (result && typeof result === "object") return result;
      return {
        ok: false,
        error_code: response.status || 502,
        description: "Telegram returned an invalid response.",
      };
    } catch (error) {
      return {
        ok: false,
        description: `Telegram request failed: ${asText(error?.message || error).slice(0, 160)}`,
      };
    }
  }

  async #send(message, markup = null) {
    const payload = {
      chat_id: this.#ownerId(),
      text: String(message),
      link_preview_options: { is_disabled: true },
    };
    if (markup) payload.reply_markup = markup;
    return this.#tg("sendMessage", payload);
  }

  async #answerCallback(callbackId, message = null, alert = false) {
    const payload = { callback_query_id: callbackId };
    if (message) payload.text = String(message).slice(0, 180);
    if (alert) payload.show_alert = true;
    await this.#tg("answerCallbackQuery", payload);
  }

  async #installCommandsOnce(state) {
    if (state.commands_installed) return;

    const commands = [
      { command: "start", description: "منوی اصلی" },
      { command: "new", description: "ساخت عملیات جدید" },
      { command: "target", description: "ثبت کانال مقصد" },
      { command: "status", description: "وضعیت و آمار" },
      { command: "stop", description: "توقف عملیات" },
      { command: "cancel", description: "لغو مرحله جاری" },
      { command: "help", description: "راهنما" },
    ];

    const result = await this.#tg("setMyCommands", { commands });
    if (result.ok) {
      state.commands_installed = true;
      await this.#save(state);
    }
  }

  async #showMenu(state, greeting = false) {
    const target = state.target;
    const active = Boolean(state.task?.active);
    let message = greeting ? "🚀 پنل Forward Scheduler\n\n" : "📌 منوی اصلی\n\n";

    message += target
      ? `🎯 مقصد: @${target.username}\n`
      : "⚠️ هنوز کانال مقصد ثبت نشده است.\n";
    message += active
      ? "🟢 یک عملیات زمان‌بندی‌شده فعال است.\n"
      : "⚪ عملیات فعالی وجود ندارد.\n";

    await this.#send(message, mainKeyboard(Boolean(target), active));
  }

  async #showHelp() {
    await this.#send(
      "📚 راهنما\n\n" +
        "/start — منوی اصلی\n" +
        "/target — ثبت یا تغییر کانال مقصد\n" +
        "/new — ساخت عملیات جدید\n" +
        "/status — وضعیت عملیات و سهمیه امروز\n" +
        "/stop — توقف زمان‌بندی\n" +
        "/cancel — لغو مرحله فعلی\n\n" +
        "روش کار: مقصد عمومی را ثبت کن؛ سپس لینک پست مبدأ، فاصله برحسب MS و حالت ارسال را انتخاب کن.\n\n" +
        "نکات اجرایی: فقط کانالی را ثبت کن که مدیریت آن با توست و ربات در آن دسترسی Administrator و مجوز Post Messages دارد.",
    );
  }

  async #showStatus(state) {
    const task = state.task || {};
    const target = state.target;
    const today = utcDay();

    if (state.usage_day !== today) {
      state.usage_day = today;
      state.usage_count = 0;
      await this.#save(state);
    }

    const lines = ["📊 وضعیت ربات", ""];
    lines.push(target ? `🎯 مقصد: @${target.username}` : "🎯 مقصد: ثبت نشده");
    lines.push(`📅 ارسال موفق امروز: ${state.usage_count || 0}/${DAILY_SEND_LIMIT}`);

    if (task.active) {
      lines.push(
        "🟢 وضعیت: فعال",
        `🔁 حالت: ${task.mode === "auto" ? "Auto تا Stop" : "Repeat"}`,
        `⏱ فاصله: ${Number(task.interval_ms).toLocaleString("en-US")} MS`,
        `📨 ارسال موفق این عملیات: ${task.sent || 0}`,
      );
      if (task.mode === "repeat") lines.push(`🔢 باقی‌مانده: ${task.remaining}`);
      lines.push(`🕒 ارسال بعدی: ${formatUtc(Number(task.next_at) || Date.now())}`);
    } else {
      lines.push("⚪ وضعیت: غیرفعال");
    }

    await this.#send(lines.join("\n"), mainKeyboard(Boolean(target), Boolean(task.active)));
  }

  async #beginFlow(state, flow) {
    state.flow = flow;
    await this.#save(state);

    const prompts = {
      target:
        "📡 لینک عمومی کانال مقصد یا @username را بفرست. ربات باید در آن کانال Administrator با مجوز انتشار پیام باشد.",
      source:
        "🔗 لینک دقیق پیام کانال مبدأ را بفرست؛ نمونه: https://t.me/channelname/123",
    };

    await this.#send(prompts[flow], {
      inline_keyboard: [[button("لغو", "cancel", "danger")]],
    });
  }

  async #registerTarget(state, raw) {
    const username = parsePublicChannel(raw);
    if (!username) {
      await this.#send("❌ لینک یا نام کاربری معتبر نیست. نمونه: @my_channel یا https://t.me/my_channel");
      return;
    }

    const chatResult = await this.#tg("getChat", { chat_id: `@${username}` });
    if (!chatResult.ok) {
      await this.#send("❌ کانال پیدا نشد یا ربات به اطلاعات آن دسترسی ندارد. عمومی بودن کانال را بررسی کن.");
      return;
    }

    const chat = chatResult.result || {};
    if (chat.type !== "channel" || !chat.username) {
      await this.#send("❌ فقط کانال عمومی تلگرام قابل ثبت است.");
      return;
    }

    const meResult = await this.#tg("getMe");
    if (!meResult.ok || !meResult.result?.id) {
      await this.#send("❌ دریافت اطلاعات ربات از تلگرام ناموفق بود.");
      return;
    }

    const memberResult = await this.#tg("getChatMember", {
      chat_id: chat.id,
      user_id: meResult.result.id,
    });
    const member = memberResult.ok ? memberResult.result || {} : {};
    const canPost =
      member.status === "creator" ||
      (member.status === "administrator" && member.can_post_messages === true);

    if (!canPost) {
      await this.#send("❌ ربات در کانال مقصد Administrator با مجوز Post Messages نیست. ابتدا دسترسی را اصلاح کن.");
      return;
    }

    state.target = {
      id: chat.id,
      username: chat.username,
      title: chat.title || chat.username,
    };
    state.flow = null;
    await this.#save(state);

    await this.#send(
      `✅ کانال مقصد ثبت شد.\n📣 ${chat.title || "Channel"}\n🔗 @${chat.username}`,
      mainKeyboard(true, Boolean(state.task?.active)),
    );
  }

  async #prepareSource(state, raw) {
    const parsed = parseMessageLink(raw);
    if (!parsed) {
      await this.#send("❌ لینک پیام معتبر نیست. لینک باید از نوع https://t.me/channelname/message_id باشد.");
      return;
    }

    const [sourceRef, messageId] = parsed;
    const sourceResult = await this.#tg("getChat", { chat_id: sourceRef });
    if (!sourceResult.ok) {
      await this.#send("❌ کانال مبدأ قابل دسترسی نیست. اگر خصوصی است، ربات را به آن اضافه کن؛ برای کانال عمومی لینک را بررسی کن.");
      return;
    }

    const source = sourceResult.result || {};
    if (source.type !== "channel") {
      await this.#send("❌ لینک باید مربوط به یک کانال تلگرامی باشد.");
      return;
    }

    if (String(source.id) === String(state.target?.id)) {
      await this.#send("❌ کانال مبدأ و مقصد نباید یکی باشند.");
      return;
    }

    state.draft = {
      source_chat_id: source.id,
      source_title: source.title || source.username || "کانال مبدأ",
      message_id: messageId,
    };
    state.flow = "interval";
    await this.#save(state);

    await this.#send(
      `✅ پیام مبدأ شناسایی شد.\n📨 ${source.title || "کانال مبدأ"}\n🆔 Message ID: ${messageId}\n\n` +
        "⏱ فاصله زمانی را فقط به میلی‌ثانیه (MS) وارد کن.\nحداقل مجاز: 60,000 MS (یک دقیقه).",
      { inline_keyboard: [[button("لغو", "cancel", "danger")]] },
    );
  }

  async #beginTask(state, mode, count = null) {
    if (state.task?.active) {
      await this.#send("⚠️ یک عملیات فعال داری. ابتدا Stop را بزن.");
      return;
    }

    const target = state.target;
    const draft = state.draft || {};
    if (!target || !draft.source_chat_id || !draft.message_id || !draft.interval_ms) {
      state.flow = null;
      await this.#save(state);
      await this.#send("❌ اطلاعات کانال یا پیام ناقص است. از ابتدا /new را اجرا کن.");
      return;
    }

    const now = Date.now();
    state.task = {
      active: true,
      mode,
      target_chat_id: target.id,
      target_username: target.username,
      source_chat_id: draft.source_chat_id,
      source_title: draft.source_title || "source",
      message_id: Number(draft.message_id),
      interval_ms: Number(draft.interval_ms),
      remaining: count == null ? null : Number(count),
      sent: 0,
      next_at: now + ALARM_START_DELAY_MS,
      consecutive_errors: 0,
      quota_notice_day: null,
    };
    state.flow = null;
    state.draft = null;
    await this.#save(state);
    await this.ctx.storage.setAlarm(now + ALARM_START_DELAY_MS);

    const totalHint =
      mode === "auto"
        ? `تا زمان Stop، با سقف ${DAILY_SEND_LIMIT} ارسال موفق در روز`
        : `${count} ارسال`;

    await this.#send(
      "🚀 زمان‌بندی فعال شد!\n\n" +
        `📡 مقصد: @${target.username}\n` +
        `⏱ فاصله: ${taskInterval(state).toLocaleString("en-US")} MS\n` +
        `🔁 حالت: ${mode === "auto" ? "Auto" : "Repeat"}\n` +
        `📦 برنامه: ${totalHint}\n\n` +
        "اولین ارسال حدود یک ثانیه دیگر انجام می‌شود. برای توقف از /stop استفاده کن.",
      mainKeyboard(true, true),
    );
  }

  async #stopTask(state, announce = true) {
    const task = state.task || {};
    if (!task.active) {
      if (announce) await this.#send("ℹ️ عملیات فعالی برای توقف وجود ندارد.");
      return;
    }

    task.active = false;
    task.stopped_at = Date.now();
    await this.#save(state);
    await this.ctx.storage.deleteAlarm();

    if (announce) {
      await this.#send(
        `⏹ عملیات متوقف شد.\n📨 ارسال موفق این عملیات: ${task.sent || 0}`,
        mainKeyboard(Boolean(state.target), false),
      );
    }
  }

  async handleUpdate(update) {
    const state = await this.#load();
    const callback = update?.callback_query;

    if (callback) {
      const user = callback.from || {};
      if (Number(user.id) !== this.#ownerId()) {
        await this.#answerCallback(callback.id || "", "اجازه دسترسی نداری.", true);
        return;
      }
      if (callback.message?.chat?.type !== "private") {
        await this.#answerCallback(callback.id || "", "فقط در گفت‌وگوی خصوصی.", true);
        return;
      }

      await this.#answerCallback(callback.id || "");
      await this.#handleCallback(state, asText(callback.data));
      return;
    }

    const message = update?.message || update?.edited_message;
    if (!message) return;

    const user = message.from || {};
    const chat = message.chat || {};
    if (Number(user.id) !== this.#ownerId() || chat.type !== "private") return;

    const text = asText(message.text);
    if (!text) {
      await this.#send("لطفاً لینک یا عدد موردنیاز مرحله فعلی را به‌صورت متن بفرست.");
      return;
    }

    if (text.startsWith("/")) {
      const command = text.split(/\s+/, 1)[0].split("@")[0].toLowerCase();
      switch (command) {
        case "/start":
          state.flow = null;
          await this.#save(state);
          await this.#installCommandsOnce(state);
          await this.#showMenu(state, true);
          return;
        case "/help":
          await this.#showHelp();
          return;
        case "/cancel":
          state.flow = null;
          state.draft = null;
          await this.#save(state);
          await this.#send(
            "✅ مرحله جاری لغو شد.",
            mainKeyboard(Boolean(state.target), Boolean(state.task?.active)),
          );
          return;
        case "/target":
          await this.#beginFlow(state, "target");
          return;
        case "/new":
          if (!state.target) {
            await this.#send("ابتدا کانال مقصد را با /target ثبت کن.");
            return;
          }
          if (state.task?.active) {
            await this.#send("یک عملیات در حال اجراست؛ ابتدا /stop را بزن.");
            return;
          }
          state.draft = null;
          await this.#beginFlow(state, "source");
          return;
        case "/status":
          await this.#showStatus(state);
          return;
        case "/stop":
          await this.#stopTask(state);
          return;
        default:
          await this.#send("دستور ناشناخته است. /help را بزن.");
          return;
      }
    }

    switch (state.flow) {
      case "target":
        await this.#registerTarget(state, text);
        return;
      case "source":
        await this.#prepareSource(state, text);
        return;
      case "interval": {
        const interval = parseIntervalInput(text);
        if (interval === null) {
          await this.#send("❌ فقط عدد صحیح MS وارد کن؛ نمونه: 60000");
          return;
        }
        if (interval < MIN_INTERVAL_MS || interval > MAX_INTERVAL_MS) {
          await this.#send(`❌ بازه مجاز از 60,000 تا ${MAX_INTERVAL_MS.toLocaleString("en-US")} MS است.`);
          return;
        }

        state.draft.interval_ms = interval;
        state.flow = "mode";
        await this.#save(state);

        await this.#send(
          `✅ فاصله ثبت شد: ${interval.toLocaleString("en-US")} MS\n` +
            `📈 نرخ نظری: حدود ${theoreticalDaily(interval).toLocaleString("en-US")} ارسال در روز\n` +
            `🛡 سقف اجرایی ایمنی: حداکثر ${DAILY_SEND_LIMIT} ارسال موفق در روز.\n\n` +
            "حالت را انتخاب کن:",
          {
            inline_keyboard: [
              [button("📨 فقط یک‌بار", "mode:once", "success")],
              [button("🔁 Repeat با تعداد مشخص", "mode:repeat")],
              [button("♾ Auto تا Stop", "mode:auto")],
              [button("لغو", "cancel", "danger")],
            ],
          },
        );
        return;
      }
      case "count": {
        const count = parseIntervalInput(text);
        if (count === null || !Number.isInteger(count)) {
          await this.#send("❌ تعداد باید عدد صحیح باشد.");
          return;
        }
        if (count < 1 || count > MAX_REPEAT) {
          await this.#send(`❌ تعداد مجاز بین 1 تا ${MAX_REPEAT} است.`);
          return;
        }
        state.draft.interval_ms = Number(state.draft.interval_ms);
        await this.#save(state);
        await this.#beginTask(state, "repeat", count);
        return;
      }
      default:
        await this.#send(
          "برای شروع /new، برای ثبت مقصد /target و برای راهنما /help را بزن.",
          mainKeyboard(Boolean(state.target), Boolean(state.task?.active)),
        );
    }
  }

  async #handleCallback(state, data) {
    switch (data) {
      case "home":
        await this.#showMenu(state);
        return;
      case "help":
        await this.#showHelp();
        return;
      case "target":
        await this.#beginFlow(state, "target");
        return;
      case "new":
        if (!state.target) {
          await this.#send("ابتدا کانال مقصد را با دکمه ثبت کانال یا /target ثبت کن.");
        } else if (state.task?.active) {
          await this.#send("یک عملیات در حال اجراست؛ ابتدا Stop را بزن.");
        } else {
          state.draft = null;
          await this.#beginFlow(state, "source");
        }
        return;
      case "status":
        await this.#showStatus(state);
        return;
      case "stop":
        await this.#stopTask(state);
        return;
      case "cancel":
        state.flow = null;
        state.draft = null;
        await this.#save(state);
        await this.#send(
          "✅ مرحله جاری لغو شد.",
          mainKeyboard(Boolean(state.target), Boolean(state.task?.active)),
        );
        return;
      case "mode:once":
        await this.#beginTask(state, "repeat", 1);
        return;
      case "mode:repeat":
        state.flow = "count";
        await this.#save(state);
        await this.#send(
          `🔢 تعداد ارسال را وارد کن (1 تا ${MAX_REPEAT}).`,
          { inline_keyboard: [[button("لغو", "cancel", "danger")]] },
        );
        return;
      case "mode:auto":
        await this.#beginTask(state, "auto");
        return;
      default:
        await this.#send("دکمه منقضی شده است؛ /start را بزن.");
    }
  }

  async alarm() {
    const state = await this.#load();
    const task = state.task || {};
    if (!task.active) return;

    const now = Date.now();
    const dueAt = Number(task.next_at || now);
    if (dueAt > now) {
      await this.ctx.storage.setAlarm(dueAt);
      return;
    }

    const today = utcDay(now);
    if (state.usage_day !== today) {
      state.usage_day = today;
      state.usage_count = 0;
    }

    if (Number(state.usage_count || 0) >= DAILY_SEND_LIMIT) {
      const nextAt = nextUtcMidnightMs(now);
      task.next_at = nextAt;
      task.quota_notice_day = today;
      await this.#save(state);
      await this.ctx.storage.setAlarm(nextAt);
      await this.#send(
        `🛡 سهمیه روزانه ${DAILY_SEND_LIMIT} ارسال تکمیل شد. عملیات در نیمه‌شب UTC به‌صورت خودکار ادامه پیدا می‌کند؛ برای توقف /stop را بزن.`,
      );
      return;
    }

    // Persist the next point before Telegram's external side effect to reduce
    // duplicate sends if an alarm is delivered again after a transient failure.
    const provisionalNext = now + Math.max(MIN_INTERVAL_MS, Number(task.interval_ms) || MIN_INTERVAL_MS);
    task.next_at = provisionalNext;
    await this.#save(state);

    const result = await this.#tg("forwardMessage", {
      chat_id: task.target_chat_id,
      from_chat_id: task.source_chat_id,
      message_id: task.message_id,
    });

    if (result.ok) {
      task.sent = Number(task.sent || 0) + 1;
      task.consecutive_errors = 0;
      state.usage_count = Number(state.usage_count || 0) + 1;

      let finished = false;
      if (task.mode === "repeat") {
        task.remaining = Number(task.remaining || 1) - 1;
        if (task.remaining <= 0) {
          task.active = false;
          task.completed_at = now;
          finished = true;
        }
      }

      if (!finished) {
        task.next_at =
          state.usage_count >= DAILY_SEND_LIMIT
            ? nextUtcMidnightMs(now)
            : now + Math.max(MIN_INTERVAL_MS, Number(task.interval_ms) || MIN_INTERVAL_MS);
      }

      await this.#save(state);
      if (finished) {
        await this.ctx.storage.deleteAlarm();
        await this.#send(`✅ عملیات Repeat تکمیل شد.\n📨 تعداد ارسال موفق: ${task.sent}`);
      } else {
        await this.ctx.storage.setAlarm(Number(task.next_at));
        if (state.usage_count >= DAILY_SEND_LIMIT) {
          await this.#send("🛡 سهمیه روزانه تکمیل شد؛ عملیات در نیمه‌شب UTC ادامه پیدا می‌کند. برای توقف /stop را بزن.");
        }
      }
      return;
    }

    const errorCode = Number(result.error_code || 0);
    const description = asText(result.description).slice(0, MAX_TELEGRAM_ERROR_TEXT);
    const parameters = result.parameters || {};

    if (errorCode === 429) {
      const retryAfterSeconds = Number(parameters.retry_after || 60);
      const retryMs = Math.max(MIN_INTERVAL_MS, retryAfterSeconds * 1_000);
      task.next_at = now + retryMs;
      await this.#save(state);
      await this.ctx.storage.setAlarm(task.next_at);
      await this.#send("⏳ تلگرام محدودیت موقت ارسال برگرداند. زمان‌بندی با رعایت retry_after ادامه می‌یابد.");
      return;
    }

    task.consecutive_errors = Number(task.consecutive_errors || 0) + 1;
    if ([400, 401, 403, 404].includes(errorCode) || task.consecutive_errors >= 3) {
      task.active = false;
      task.stopped_at = now;
      await this.#save(state);
      await this.ctx.storage.deleteAlarm();
      await this.#send(
        `❌ عملیات به‌دلیل خطای تلگرام متوقف شد.\nکد خطا: ${errorCode || "نامشخص"}\nتوضیح: ${description || "بدون توضیح"}`,
      );
      return;
    }

    const retryDelay = Math.min(15 * 60_000, task.consecutive_errors * 60_000);
    task.next_at = now + retryDelay;
    await this.#save(state);
    await this.ctx.storage.setAlarm(task.next_at);
  }
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;

    if (request.method === "GET" && path === "/healthz") {
      return textResponse("ok");
    }

    if (request.method === "GET" && (path === "/" || path === "/setup")) {
      const error = configError();
      if (error) return textResponse(`Configuration error: ${error}`, 503);

      const webhookSecret = await makeWebhookSecret(BOT_TOKEN, OWNER_ID);
      const webhookUrl = `${url.origin}/telegram/webhook`;
      let result;
      try {
        const response = await fetch(`${BOT_API}${BOT_TOKEN}/setWebhook`, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            url: webhookUrl,
            secret_token: webhookSecret,
            allowed_updates: ["message", "callback_query"],
          }),
          signal: AbortSignal.timeout(TELEGRAM_TIMEOUT_MS),
        });
        result = await response.json();
      } catch (error) {
        return textResponse(`Webhook setup failed: ${asText(error?.message || error).slice(0, 160)}`, 502);
      }

      if (result?.ok) {
        return textResponse(
          "Forward Scheduler is deployed. Telegram webhook registered. Open your bot in Telegram and send /start.",
        );
      }
      return textResponse(
        `Worker is deployed, but Telegram rejected webhook setup: ${asText(result?.description).slice(0, MAX_TELEGRAM_ERROR_TEXT)}`,
        502,
      );
    }

    if (request.method !== "POST" || path !== "/telegram/webhook") {
      return textResponse("Not found", 404);
    }

    const error = configError();
    if (error) return textResponse(`Configuration error: ${error}`, 503);

    const expectedSecret = await makeWebhookSecret(BOT_TOKEN, OWNER_ID);
    const receivedSecret = request.headers.get("X-Telegram-Bot-Api-Secret-Token") || "";
    if (!constantTimeEqual(receivedSecret, expectedSecret)) return textResponse("Forbidden", 403);

    let update;
    try {
      update = await request.json();
    } catch {
      return textResponse("Bad request", 400);
    }

    try {
      const stub = env.SCHEDULER.getByName("forward-scheduler-owner");
      await stub.handleUpdate(update);
      return textResponse("ok");
    } catch (error) {
      console.error("Webhook processing failed:", error);
      return textResponse("Internal error", 500);
    }
  },
};
