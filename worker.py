"""Forward Scheduler bot for Cloudflare Python Workers.

Uses Telegram's forwardMessage method (original-forward attribution is preserved).
Only the configured owner can use the bot. Scheduling is persisted by a Durable Object.
"""

from datetime import datetime, timezone
import hashlib
import json
import re
import time
from urllib.parse import urlparse

from workers import DurableObject, Response, WorkerEntrypoint, fetch

# Single-click deployment profile. This token was supplied by the owner.
# Anyone who can read a public copy of this repository can control the bot.
BOT_TOKEN = "9204167908:AAHwp-jsf6u4v-Ow2dzgi-E83wJOwEtOs8Q"
OWNER_ID = 8621035125
WEBHOOK_SECRET = hashlib.sha256(
    ("forward-scheduler-webhook:" + BOT_TOKEN + ":" + str(OWNER_ID)).encode("utf-8")
).hexdigest()

# Deliberate anti-spam guardrails. Intervals are still entered in milliseconds.
MIN_INTERVAL_MS = 60_000
MAX_INTERVAL_MS = 30 * 24 * 60 * 60 * 1000
MAX_REPEAT = 10
DAILY_SEND_LIMIT = 10
DAY_MS = 86_400_000
BOT_API = "https://api.telegram.org/bot{}/{}"


def _as_text(value):
    return str(value).strip() if value is not None else ""


def parse_public_channel(value):
    """Return a public Telegram channel username without @, or None."""
    raw = _as_text(value)
    if not raw:
        return None

    if raw.startswith("@"): 
        username = raw[1:]
    else:
        candidate = raw if "://" in raw else "https://" + raw
        parsed = urlparse(candidate)
        if parsed.netloc.lower() not in {"t.me", "www.t.me", "telegram.me", "www.telegram.me"}:
            return None
        parts = [part for part in parsed.path.split("/") if part]
        if not parts or parts[0].lower() in {"c", "s"} or parts[0].startswith("+"):
            return None
        username = parts[0]

    if not re.fullmatch(r"[A-Za-z][A-Za-z0-9_]{4,31}", username):
        return None
    return username


def parse_message_link(value):
    """Return (source chat reference, message id) for public/private t.me links."""
    raw = _as_text(value)
    if not raw:
        return None
    candidate = raw if "://" in raw else "https://" + raw
    parsed = urlparse(candidate)
    if parsed.netloc.lower() not in {"t.me", "www.t.me", "telegram.me", "www.telegram.me"}:
        return None

    parts = [part for part in parsed.path.split("/") if part]
    if parts and parts[0].lower() == "s":
        parts = parts[1:]

    try:
        if len(parts) >= 3 and parts[0].lower() == "c":
            internal_id = parts[1]
            message_id = int(parts[2])
            if not internal_id.isdigit() or message_id < 1:
                return None
            return "-100" + internal_id, message_id

        if len(parts) >= 2:
            username = parts[0]
            message_id = int(parts[1])
            if not re.fullmatch(r"[A-Za-z][A-Za-z0-9_]{4,31}", username) or message_id < 1:
                return None
            return "@" + username, message_id
    except (TypeError, ValueError):
        return None
    return None


def theoretical_daily(interval_ms):
    return DAY_MS // interval_ms


def utc_day(timestamp_ms=None):
    timestamp_ms = timestamp_ms if timestamp_ms is not None else int(time.time() * 1000)
    return datetime.fromtimestamp(timestamp_ms / 1000, tz=timezone.utc).strftime("%Y-%m-%d")


def next_utc_midnight_ms(timestamp_ms=None):
    timestamp_ms = timestamp_ms if timestamp_ms is not None else int(time.time() * 1000)
    return ((timestamp_ms // DAY_MS) + 1) * DAY_MS


def _button(text, callback_data, style="primary"):
    return {"text": text, "callback_data": callback_data, "style": style}


def main_keyboard(target_exists, active):
    rows = [
        [_button("➕ عملیات جدید", "new", "primary"), _button("📡 ثبت کانال مقصد", "target", "success")],
        [_button("📊 وضعیت", "status", "primary"), _button("⏹ توقف", "stop", "danger")],
        [_button("❔ راهنما", "help", "primary")],
    ]
    if not target_exists:
        rows[0] = [_button("📡 ابتدا کانال مقصد را ثبت کن", "target", "success")]
    if not active:
        rows[1][1] = _button("⏹ توقف (عملیاتی فعال نیست)", "status", "danger")
    return {"inline_keyboard": rows}


class ForwardScheduler(DurableObject):
    """One durable scheduler instance for the single configured owner."""

    def __init__(self, ctx, env):
        super().__init__(ctx, env)

    async def _load(self):
        state = await self.ctx.storage.get("state")
        if not isinstance(state, dict):
            state = {
                "flow": None,
                "draft": None,
                "target": None,
                "task": None,
                "usage_day": utc_day(),
                "usage_count": 0,
                "commands_installed": False,
            }
        return state

    async def _save(self, state):
        await self.ctx.storage.put("state", state)

    def _owner_id(self):
        return OWNER_ID

    async def _tg(self, method, payload=None):
        try:
            response = await fetch(
                BOT_API.format(BOT_TOKEN, method),
                {
                    "method": "POST",
                    "headers": {"Content-Type": "application/json"},
                    "body": json.dumps(payload or {}, separators=(",", ":")),
                },
            )
            return await response.json()
        except Exception as exc:
            return {"ok": False, "description": "Telegram request failed: {}".format(str(exc)[:160])}

    async def _send(self, text, markup=None):
        payload = {"chat_id": self._owner_id(), "text": text, "disable_web_page_preview": True}
        if markup:
            payload["reply_markup"] = markup
        return await self._tg("sendMessage", payload)

    async def _answer_callback(self, callback_id, text=None, alert=False):
        payload = {"callback_query_id": callback_id}
        if text:
            payload["text"] = text[:180]
        if alert:
            payload["show_alert"] = True
        await self._tg("answerCallbackQuery", payload)

    async def _install_commands_once(self, state):
        if state.get("commands_installed"):
            return
        commands = [
            {"command": "start", "description": "منوی اصلی"},
            {"command": "new", "description": "ساخت عملیات جدید"},
            {"command": "target", "description": "ثبت کانال مقصد"},
            {"command": "status", "description": "وضعیت و آمار"},
            {"command": "stop", "description": "توقف عملیات"},
            {"command": "cancel", "description": "لغو مرحله جاری"},
            {"command": "help", "description": "راهنما"},
        ]
        result = await self._tg("setMyCommands", {"commands": commands})
        if result.get("ok"):
            state["commands_installed"] = True
            await self._save(state)

    async def _show_menu(self, state, greeting=False):
        target = state.get("target")
        task = state.get("task") or {}
        active = bool(task.get("active"))
        header = "🚀 پنل Forward Scheduler\n\n" if greeting else "📌 منوی اصلی\n\n"
        if target:
            header += "🎯 مقصد: @{}\n".format(target.get("username", "channel"))
        else:
            header += "⚠️ هنوز کانال مقصد ثبت نشده است.\n"
        if active:
            header += "🟢 یک عملیات زمان‌بندی‌شده فعال است.\n"
        else:
            header += "⚪ عملیات فعالی وجود ندارد.\n"
        await self._send(header, main_keyboard(bool(target), active))

    async def _show_help(self):
        await self._send(
            "📚 راهنما\n\n"
            "/start — منوی اصلی\n"
            "/target — ثبت یا تغییر کانال مقصد\n"
            "/new — ساخت عملیات جدید\n"
            "/status — وضعیت عملیات و سهمیه امروز\n"
            "/stop — توقف زمان‌بندی\n"
            "/cancel — لغو مرحله فعلی\n\n"
            "روش کار: مقصد عمومی را ثبت کن؛ سپس لینک پست مبدأ، فاصله برحسب MS و حالت ارسال را انتخاب کن.\n\n"
            "نکات اجرایی: فقط کانالی را ثبت کن که مدیریت آن با توست و ربات در آن دسترسی Administrator و مجوز Post Messages دارد."
        )

    async def _show_status(self, state):
        task = state.get("task") or {}
        target = state.get("target")
        today = utc_day()
        if state.get("usage_day") != today:
            state["usage_day"] = today
            state["usage_count"] = 0
            await self._save(state)
        lines = ["📊 وضعیت ربات", ""]
        lines.append("🎯 مقصد: @{}".format(target.get("username")) if target else "🎯 مقصد: ثبت نشده")
        lines.append("📅 ارسال موفق امروز: {}/{}".format(state.get("usage_count", 0), DAILY_SEND_LIMIT))
        if task.get("active"):
            interval = int(task["interval_ms"])
            lines.extend([
                "🟢 وضعیت: فعال",
                "🔁 حالت: {}".format("Auto تا Stop" if task["mode"] == "auto" else "Repeat"),
                "⏱ فاصله: {:,} MS".format(interval),
                "📨 ارسال موفق این عملیات: {}".format(task.get("sent", 0)),
            ])
            if task["mode"] == "repeat":
                lines.append("🔢 باقی‌مانده: {}".format(task.get("remaining", 0)))
            lines.append("🕒 ارسال بعدی: {}".format(datetime.fromtimestamp(task.get("next_at", 0) / 1000, tz=timezone.utc).strftime("%Y-%m-%d %H:%M:%S UTC")))
        else:
            lines.append("⚪ وضعیت: غیرفعال")
        await self._send("\n".join(lines), main_keyboard(bool(target), bool(task.get("active"))))

    async def _begin_flow(self, state, flow):
        state["flow"] = flow
        await self._save(state)
        prompts = {
            "target": "📡 لینک عمومی کانال مقصد یا @username را بفرست. ربات باید در آن کانال Administrator با مجوز انتشار پیام باشد.",
            "source": "🔗 لینک دقیق پیام کانال مبدأ را بفرست؛ نمونه: https://t.me/channelname/123",
        }
        await self._send(prompts[flow], {"inline_keyboard": [[_button("لغو", "cancel", "danger")]]})

    async def _register_target(self, state, raw):
        username = parse_public_channel(raw)
        if not username:
            await self._send("❌ لینک یا نام کاربری معتبر نیست. نمونه: @my_channel یا https://t.me/my_channel")
            return

        chat_result = await self._tg("getChat", {"chat_id": "@" + username})
        if not chat_result.get("ok"):
            await self._send("❌ کانال پیدا نشد یا ربات به اطلاعات آن دسترسی ندارد. عمومی بودن کانال را بررسی کن.")
            return
        chat = chat_result.get("result", {})
        if chat.get("type") != "channel" or not chat.get("username"):
            await self._send("❌ فقط کانال عمومی تلگرام قابل ثبت است.")
            return

        me_result = await self._tg("getMe", {})
        if not me_result.get("ok"):
            await self._send("❌ دریافت اطلاعات ربات از تلگرام ناموفق بود.")
            return
        member_result = await self._tg(
            "getChatMember", {"chat_id": chat["id"], "user_id": me_result["result"]["id"]}
        )
        member = member_result.get("result", {}) if member_result.get("ok") else {}
        status = member.get("status")
        can_post = status == "creator" or (status == "administrator" and member.get("can_post_messages") is True)
        if not can_post:
            await self._send("❌ ربات در کانال مقصد Administrator با مجوز Post Messages نیست. ابتدا دسترسی را اصلاح کن.")
            return

        state["target"] = {"id": chat["id"], "username": chat["username"], "title": chat.get("title", chat["username"])}
        state["flow"] = None
        await self._save(state)
        await self._send(
            "✅ کانال مقصد ثبت شد.\n📣 {}\n🔗 @{}".format(chat.get("title", "Channel"), chat["username"]),
            main_keyboard(True, bool((state.get("task") or {}).get("active"))),
        )

    async def _prepare_source(self, state, raw):
        parsed = parse_message_link(raw)
        if not parsed:
            await self._send("❌ لینک پیام معتبر نیست. لینک باید از نوع https://t.me/channelname/message_id باشد.")
            return
        source_ref, message_id = parsed
        source_result = await self._tg("getChat", {"chat_id": source_ref})
        if not source_result.get("ok"):
            await self._send("❌ کانال مبدأ قابل دسترسی نیست. اگر خصوصی است، ربات را به آن اضافه کن؛ برای کانال عمومی لینک را بررسی کن.")
            return
        source = source_result.get("result", {})
        if source.get("type") != "channel":
            await self._send("❌ لینک باید مربوط به یک کانال تلگرامی باشد.")
            return
        target = state.get("target") or {}
        if str(source.get("id")) == str(target.get("id")):
            await self._send("❌ کانال مبدأ و مقصد نباید یکی باشند.")
            return

        state["draft"] = {
            "source_chat_id": source["id"],
            "source_title": source.get("title", source.get("username", "کانال مبدأ")),
            "message_id": message_id,
        }
        state["flow"] = "interval"
        await self._save(state)
        await self._send(
            "✅ پیام مبدأ شناسایی شد.\n📨 {}\n🆔 Message ID: {}\n\n⏱ فاصله زمانی را فقط به میلی‌ثانیه (MS) وارد کن.\nحداقل مجاز: 60,000 MS (یک دقیقه).".format(
                source.get("title", "کانال مبدأ"), message_id
            ),
            {"inline_keyboard": [[_button("لغو", "cancel", "danger")]]},
        )

    async def _begin_task(self, state, mode, count=None):
        current = state.get("task") or {}
        if current.get("active"):
            await self._send("⚠️ یک عملیات فعال داری. ابتدا Stop را بزن.")
            return
        target = state.get("target")
        draft = state.get("draft") or {}
        if not target or not draft or not draft.get("source_chat_id"):
            state["flow"] = None
            await self._save(state)
            await self._send("❌ اطلاعات کانال یا پیام ناقص است. از ابتدا /new را اجرا کن.")
            return
        now = int(time.time() * 1000)
        state["task"] = {
            "active": True,
            "mode": mode,
            "target_chat_id": target["id"],
            "target_username": target["username"],
            "source_chat_id": draft["source_chat_id"],
            "source_title": draft.get("source_title", "source"),
            "message_id": int(draft["message_id"]),
            "interval_ms": int(draft["interval_ms"]),
            "remaining": int(count) if count is not None else None,
            "sent": 0,
            "next_at": now + 1000,
            "consecutive_errors": 0,
            "quota_notice_day": None,
        }
        state["flow"] = None
        state["draft"] = None
        await self._save(state)
        await self.ctx.storage.setAlarm(now + 1000)
        total_hint = "تا زمان Stop، با سقف {} ارسال موفق در روز".format(DAILY_SEND_LIMIT) if mode == "auto" else "{} ارسال".format(count)
        await self._send(
            "🚀 زمان‌بندی فعال شد!\n\n"
            "📡 مقصد: @{}\n"
            "⏱ فاصله: {:,} MS\n"
            "🔁 حالت: {}\n"
            "📦 برنامه: {}\n\n"
            "اولین ارسال حدود یک ثانیه دیگر انجام می‌شود. برای توقف از /stop استفاده کن.".format(
                target["username"], task_interval(state), "Auto" if mode == "auto" else "Repeat", total_hint
            ),
            main_keyboard(True, True),
        )

    async def _stop_task(self, state, announce=True):
        task = state.get("task") or {}
        if not task.get("active"):
            if announce:
                await self._send("ℹ️ عملیات فعالی برای توقف وجود ندارد.")
            return
        task["active"] = False
        task["stopped_at"] = int(time.time() * 1000)
        await self._save(state)
        await self.ctx.storage.deleteAlarm()
        if announce:
            await self._send("⏹ عملیات متوقف شد.\n📨 ارسال موفق این عملیات: {}".format(task.get("sent", 0)), main_keyboard(bool(state.get("target")), False))

    async def handle_update(self, update):
        """RPC entry point called by the public webhook Worker."""
        owner_id = self._owner_id()
        state = await self._load()

        callback = update.get("callback_query")
        if callback:
            user = callback.get("from", {})
            if int(user.get("id", 0)) != owner_id:
                await self._answer_callback(callback.get("id", ""), "اجازه دسترسی نداری.", True)
                return
            message = callback.get("message", {})
            if message.get("chat", {}).get("type") != "private":
                await self._answer_callback(callback.get("id", ""), "فقط در گفت‌وگوی خصوصی.", True)
                return
            await self._answer_callback(callback.get("id", ""))
            await self._handle_callback(state, callback.get("data", ""))
            return

        message = update.get("message") or update.get("edited_message")
        if not message:
            return
        user = message.get("from", {})
        chat = message.get("chat", {})
        if int(user.get("id", 0)) != owner_id or chat.get("type") != "private":
            return
        text = _as_text(message.get("text"))
        if not text:
            await self._send("لطفاً لینک یا عدد موردنیاز مرحله فعلی را به‌صورت متن بفرست.")
            return

        if text.startswith("/"):
            command = text.split()[0].split("@")[0].lower()
            if command == "/start":
                state["flow"] = None
                await self._save(state)
                await self._install_commands_once(state)
                await self._show_menu(state, True)
                return
            if command == "/help":
                await self._show_help()
                return
            if command == "/cancel":
                state["flow"] = None
                state["draft"] = None
                await self._save(state)
                await self._send("✅ مرحله جاری لغو شد.", main_keyboard(bool(state.get("target")), bool((state.get("task") or {}).get("active"))))
                return
            if command == "/target":
                await self._begin_flow(state, "target")
                return
            if command == "/new":
                if not state.get("target"):
                    await self._send("ابتدا کانال مقصد را با /target ثبت کن.")
                    return
                if (state.get("task") or {}).get("active"):
                    await self._send("یک عملیات در حال اجراست؛ ابتدا /stop را بزن.")
                    return
                state["draft"] = None
                await self._begin_flow(state, "source")
                return
            if command == "/status":
                await self._show_status(state)
                return
            if command == "/stop":
                await self._stop_task(state)
                return
            await self._send("دستور ناشناخته است. /help را بزن.")
            return

        flow = state.get("flow")
        if flow == "target":
            await self._register_target(state, text)
        elif flow == "source":
            await self._prepare_source(state, text)
        elif flow == "interval":
            try:
                interval = int(text.replace(",", "").replace("_", ""))
            except ValueError:
                await self._send("❌ فقط عدد صحیح MS وارد کن؛ نمونه: 60000")
                return
            if interval < MIN_INTERVAL_MS or interval > MAX_INTERVAL_MS:
                await self._send("❌ بازه مجاز از 60,000 تا {:,} MS است.".format(MAX_INTERVAL_MS))
                return
            state["draft"]["interval_ms"] = interval
            state["flow"] = "mode"
            await self._save(state)
            projected = theoretical_daily(interval)
            await self._send(
                "✅ فاصله ثبت شد: {:,} MS\n📈 نرخ نظری: حدود {:,} ارسال در روز\n🛡 سقف اجرایی ایمنی: حداکثر {} ارسال موفق در روز.\n\nحالت را انتخاب کن:".format(
                    interval, projected, DAILY_SEND_LIMIT
                ),
                {"inline_keyboard": [
                    [_button("📨 فقط یک‌بار", "mode:once", "success")],
                    [_button("🔁 Repeat با تعداد مشخص", "mode:repeat", "primary")],
                    [_button("♾ Auto تا Stop", "mode:auto", "primary")],
                    [_button("لغو", "cancel", "danger")],
                ]},
            )
        elif flow == "count":
            try:
                count = int(text)
            except ValueError:
                await self._send("❌ تعداد باید عدد صحیح باشد.")
                return
            if not 1 <= count <= MAX_REPEAT:
                await self._send("❌ تعداد مجاز بین 1 تا {} است.".format(MAX_REPEAT))
                return
            state["draft"]["interval_ms"] = int(state["draft"]["interval_ms"])
            await self._save(state)
            await self._begin_task(state, "repeat", count)
        else:
            await self._send("برای شروع /new، برای ثبت مقصد /target و برای راهنما /help را بزن.", main_keyboard(bool(state.get("target")), bool((state.get("task") or {}).get("active"))))

    async def _handle_callback(self, state, data):
        if data == "home":
            await self._show_menu(state)
        elif data == "help":
            await self._show_help()
        elif data == "target":
            await self._begin_flow(state, "target")
        elif data == "new":
            if not state.get("target"):
                await self._send("ابتدا کانال مقصد را با دکمه ثبت کانال یا /target ثبت کن.")
            elif (state.get("task") or {}).get("active"):
                await self._send("یک عملیات در حال اجراست؛ ابتدا Stop را بزن.")
            else:
                state["draft"] = None
                await self._begin_flow(state, "source")
        elif data == "status":
            await self._show_status(state)
        elif data == "stop":
            await self._stop_task(state)
        elif data == "cancel":
            state["flow"] = None
            state["draft"] = None
            await self._save(state)
            await self._send("✅ مرحله جاری لغو شد.", main_keyboard(bool(state.get("target")), bool((state.get("task") or {}).get("active"))))
        elif data == "mode:once":
            await self._begin_task(state, "repeat", 1)
        elif data == "mode:repeat":
            state["flow"] = "count"
            await self._save(state)
            await self._send("🔢 تعداد ارسال را وارد کن (1 تا {}).".format(MAX_REPEAT), {"inline_keyboard": [[_button("لغو", "cancel", "danger")]]})
        elif data == "mode:auto":
            await self._begin_task(state, "auto")
        else:
            await self._send("دکمه منقضی شده است؛ /start را بزن.")

    async def alarm(self):
        """Durable Object alarm: performs at most one forward per invocation."""
        state = await self._load()
        task = state.get("task") or {}
        if not task.get("active"):
            return

        now = int(time.time() * 1000)
        due_at = int(task.get("next_at", now))
        if due_at > now:
            await self.ctx.storage.setAlarm(due_at)
            return

        today = utc_day(now)
        if state.get("usage_day") != today:
            state["usage_day"] = today
            state["usage_count"] = 0
        if int(state.get("usage_count", 0)) >= DAILY_SEND_LIMIT:
            next_at = next_utc_midnight_ms(now)
            task["next_at"] = next_at
            task["quota_notice_day"] = today
            await self._save(state)
            await self.ctx.storage.setAlarm(next_at)
            await self._send("🛡 سهمیه روزانه {} ارسال تکمیل شد. عملیات در نیمه‌شب UTC به‌صورت خودکار ادامه پیدا می‌کند؛ برای توقف /stop را بزن.".format(DAILY_SEND_LIMIT))
            return

        # Move the alarm forward before the external side effect. This reduces
        # accidental duplicate sends if an alarm delivery is repeated.
        provisional_next = now + max(MIN_INTERVAL_MS, int(task.get("interval_ms", MIN_INTERVAL_MS)))
        task["next_at"] = provisional_next
        await self._save(state)

        result = await self._tg("forwardMessage", {
            "chat_id": task["target_chat_id"],
            "from_chat_id": task["source_chat_id"],
            "message_id": task["message_id"],
        })

        if result.get("ok"):
            task["sent"] = int(task.get("sent", 0)) + 1
            task["consecutive_errors"] = 0
            state["usage_count"] = int(state.get("usage_count", 0)) + 1
            finished = False
            if task["mode"] == "repeat":
                task["remaining"] = int(task.get("remaining", 1)) - 1
                if task["remaining"] <= 0:
                    task["active"] = False
                    task["completed_at"] = now
                    finished = True
            if not finished:
                if int(state.get("usage_count", 0)) >= DAILY_SEND_LIMIT:
                    task["next_at"] = next_utc_midnight_ms(now)
                    task["quota_notice_day"] = today
                else:
                    task["next_at"] = now + max(MIN_INTERVAL_MS, int(task["interval_ms"]))
            await self._save(state)
            if finished:
                await self.ctx.storage.deleteAlarm()
                await self._send("✅ عملیات Repeat تکمیل شد.\n📨 تعداد ارسال موفق: {}".format(task["sent"]))
            else:
                await self.ctx.storage.setAlarm(int(task["next_at"]))
                if int(state.get("usage_count", 0)) >= DAILY_SEND_LIMIT:
                    await self._send("🛡 سهمیه روزانه تکمیل شد؛ عملیات در نیمه‌شب UTC ادامه پیدا می‌کند. برای توقف /stop را بزن.")
            return

        # Telegram may return 429 with retry_after. Respect it and never spin.
        error_code = int(result.get("error_code", 0) or 0)
        description = _as_text(result.get("description"))[:240]
        parameters = result.get("parameters") or {}
        if error_code == 429:
            retry_ms = max(MIN_INTERVAL_MS, int(parameters.get("retry_after", 60)) * 1000)
            task["next_at"] = now + retry_ms
            await self._save(state)
            await self.ctx.storage.setAlarm(task["next_at"])
            await self._send("⏳ تلگرام محدودیت موقت ارسال برگرداند. زمان‌بندی با رعایت retry_after ادامه می‌یابد.")
            return

        task["consecutive_errors"] = int(task.get("consecutive_errors", 0)) + 1
        if error_code in {400, 401, 403, 404} or task["consecutive_errors"] >= 3:
            task["active"] = False
            task["stopped_at"] = now
            await self._save(state)
            await self.ctx.storage.deleteAlarm()
            await self._send("❌ عملیات به‌دلیل خطای تلگرام متوقف شد.\nکد خطا: {}\nتوضیح: {}".format(error_code or "نامشخص", description or "بدون توضیح"))
            return

        retry_delay = min(15 * 60_000, task["consecutive_errors"] * 60_000)
        task["next_at"] = now + retry_delay
        await self._save(state)
        await self.ctx.storage.setAlarm(task["next_at"])


def task_interval(state):
    return int((state.get("task") or {}).get("interval_ms", 0))


class Default(WorkerEntrypoint):
    async def fetch(self, request):
        parsed_url = urlparse(request.url)
        path = parsed_url.path

        # Visiting the deployed Worker URL once automatically registers its
        # Telegram webhook. No dashboard secret or curl command is required.
        if request.method == "GET" and path in {"/", "/setup"}:
            webhook_url = "{}://{}/telegram/webhook".format(parsed_url.scheme, parsed_url.netloc)
            try:
                response = await fetch(
                    BOT_API.format(BOT_TOKEN, "setWebhook"),
                    {
                        "method": "POST",
                        "headers": {"Content-Type": "application/json"},
                        "body": json.dumps(
                            {
                                "url": webhook_url,
                                "secret_token": WEBHOOK_SECRET,
                                "allowed_updates": ["message", "callback_query"],
                            },
                            separators=(",", ":"),
                        ),
                    },
                )
                result = await response.json()
            except Exception as exc:
                return Response("Webhook setup failed: {}".format(str(exc)[:160]), status=502)
            if result.get("ok"):
                return Response(
                    "Forward Scheduler is deployed. Telegram webhook registered automatically. "
                    "Open your bot in Telegram and send /start.",
                    status=200,
                )
            return Response(
                "Worker is deployed, but Telegram rejected webhook setup: {}".format(
                    _as_text(result.get("description"))[:240]
                ),
                status=502,
            )

        if request.method == "GET" and path == "/healthz":
            return Response("ok", status=200)

        if request.method != "POST" or path != "/telegram/webhook":
            return Response("Not found", status=404)

        incoming_secret = request.headers.get("X-Telegram-Bot-Api-Secret-Token")
        if incoming_secret != WEBHOOK_SECRET:
            return Response("Forbidden", status=403)
        try:
            update = await request.json()
        except Exception:
            return Response("Bad request", status=400)

        stub = self.env.SCHEDULER.getByName("forward-scheduler-owner")
        await stub.handle_update(update)
        return Response("ok", status=200)
