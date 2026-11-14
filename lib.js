export const MIN_INTERVAL_MS = 60_000;
export const MAX_INTERVAL_MS = 30 * 24 * 60 * 60 * 1_000;
export const MAX_REPEAT = 10;
export const DAILY_SEND_LIMIT = 10;
export const DAY_MS = 86_400_000;

const TELEGRAM_HOSTS = new Set([
  "t.me",
  "www.t.me",
  "telegram.me",
  "www.telegram.me",
]);
const USERNAME_RE = /^[A-Za-z][A-Za-z0-9_]{4,31}$/;

export function asText(value) {
  return value == null ? "" : String(value).trim();
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

/** Returns a public Telegram channel username without the @ prefix. */
export function parsePublicChannel(value) {
  const raw = asText(value);
  if (!raw) return null;

  const username = raw.startsWith("@")
    ? raw.slice(1)
    : (() => {
        const url = parseTelegramUrl(raw);
        if (!url) return null;
        const parts = url.pathname.split("/").filter(Boolean);
        if (!parts.length || ["c", "s"].includes(parts[0].toLowerCase()) || parts[0].startsWith("+")) {
          return null;
        }
        return parts[0];
      })();

  return username && USERNAME_RE.test(username) ? username : null;
}

/** Returns [sourceChatId, messageId] for public and private t.me post links. */
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

export function theoreticalDaily(intervalMs) {
  if (!Number.isFinite(intervalMs) || intervalMs <= 0) return 0;
  return Math.floor(DAY_MS / intervalMs);
}

export function utcDay(timestampMs = Date.now()) {
  return new Date(timestampMs).toISOString().slice(0, 10);
}

export function nextUtcMidnightMs(timestampMs = Date.now()) {
  return (Math.floor(timestampMs / DAY_MS) + 1) * DAY_MS;
}

export function button(text, callbackData, style = "primary") {
  return { text, callback_data: callbackData, style };
}

export function mainKeyboard(targetExists, active) {
  const rows = [
    [button("➕ عملیات جدید", "new"), button("📡 ثبت کانال مقصد", "target", "success")],
    [button("📊 وضعیت", "status"), button("⏹ توقف", "stop", "danger")],
    [button("❔ راهنما", "help")],
  ];

  if (!targetExists) {
    rows[0] = [button("📡 ابتدا کانال مقصد را ثبت کن", "target", "success")];
  }
  if (!active) {
    rows[1][1] = button("⏹ توقف (عملیاتی فعال نیست)", "status", "danger");
  }

  return { inline_keyboard: rows };
}

export function taskInterval(state) {
  return Number(state?.task?.interval_ms ?? 0);
}

export function parseIntervalInput(value) {
  const normalized = asText(value).replace(/[,_\s]/g, "");
  if (!/^\d+$/.test(normalized)) return null;
  const number = Number(normalized);
  return Number.isSafeInteger(number) ? number : null;
}

export function isValidOwnerId(value) {
  return /^\d{1,20}$/.test(asText(value));
}

export function constantTimeEqual(a, b) {
  const left = asText(a);
  const right = asText(b);
  if (left.length !== right.length) return false;
  let mismatch = 0;
  for (let i = 0; i < left.length; i += 1) {
    mismatch |= left.charCodeAt(i) ^ right.charCodeAt(i);
  }
  return mismatch === 0;
}
