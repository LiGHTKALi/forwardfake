export default {
  "schemaVersion": 5,
  "version": "4.2.1",
  "name": "Forward Scheduler Bot Declarative Database",
  "runtime": {
    "engineVersion": 5,
    "capabilities": [
      "chatbot",
      "weighted_nlp",
      "conversation_memory",
      "contextual_replies",
      "response_cache",
      "group_moderation",
      "anti_spam",
      "scheduled_forwarding",
      "join_requests",
      "scheduled_chatter",
      "resource_reconciliation",
      "resource_ttl",
      "resource_ring_eviction",
      "owner_panel",
      "colored_inline_keyboard",
      "batched_state_commit",
      "local_lru_answer_cache",
      "low_write_resource_store",
      "alarm_write_deduplication",
      "expanded_persian_intents",
      "context_aware_response_templates",
      "adaptive_chatter_jitter",
      "low_cost_maintenance",
      "telegram_owner_console",
      "database_document_upload",
      "declarative_feature_modules",
      "inline_module_pagination",
      "native_cloudflare_graphql_usage",
      "split_webhook_quota_99k_1k",
      "webhook_owner_reconnect",
      "group_local_feature_overrides",
      "captcha_deduplication",
      "data_only_database_validation",
      "durable_update_queue",
      "round_robin_chat_fairness",
      "private_only_owner_console",
      "group_only_execution",
      "channel_membership_registry",
      "channel_posts_ignored",
      "bot_minimum_group_size",
      "persistent_pv_registry",
      "known_member_tag_preview",
      "security_alert_deduplication",
      "group_bot_on_off",
      "migration_backup_v5"
    ],
    "resources": [
      {
        "id": "chat-context",
        "type": "memory",
        "ttlSeconds": 86400,
        "maxEntries": 2400,
        "schema": 3,
        "onSchemaChange": "reset",
        "eviction": "ring"
      },
      {
        "id": "moderation-index",
        "type": "index",
        "ttlSeconds": 2592000,
        "maxEntries": 10000,
        "schema": 3,
        "onSchemaChange": "reset",
        "eviction": "ring"
      },
      {
        "id": "scheduled-job-state",
        "type": "queue",
        "ttlSeconds": 2592000,
        "maxEntries": 1000,
        "schema": 3,
        "onSchemaChange": "reset",
        "eviction": "ring"
      },
      {
        "id": "user-preferences",
        "type": "kv",
        "ttlSeconds": 7776000,
        "maxEntries": 4000,
        "schema": 3,
        "onSchemaChange": "reset",
        "eviction": "ring"
      },
      {
        "id": "chatbot-cooldowns",
        "type": "counter",
        "ttlSeconds": 86400,
        "maxEntries": 5000,
        "schema": 3,
        "onSchemaChange": "reset",
        "eviction": "ring"
      }
    ],
    "maintenance": {
      "sweepBatchSize": 32,
      "sweepIntervalMinutes": 120,
      "maxDeletesPerRun": 64,
      "pruneUpdateIds": 128,
      "compactSpamAfter": 600,
      "maxQueueEntriesPerRun": 8
    },
    "cache": {
      "chatAnswerTtlSeconds": 900,
      "chatContextTtlSeconds": 86400,
      "maxCachedTextLength": 500,
      "normalizePersian": true,
      "mode": "isolate-lru",
      "persistentAnswerCache": false,
      "maxEntries": 512,
      "singleDurableContextResource": true
    },
    "safety": {
      "remoteCodeExecution": false,
      "databaseMustBeDataOnly": true,
      "maxDatabaseBytes": 262144,
      "unknownResourcePolicy": "reject",
      "resourceProvisioning": "Durable Object logical storage only; Cloudflare account bindings are provisioned through deployment configuration/API, not dynamically at runtime.",
      "channelPosts": "ignored"
    }
  },
  "roles": {
    "adminIds": [],
    "adminsByChat": {},
    "protectedIds": [],
    "permissions": {
      "owner": [
        "*"
      ],
      "admin": [
        "group.moderate",
        "group.settings",
        "channel.manage"
      ],
      "member": [
        "chat.talk"
      ]
    },
    "adminCanManageAdmins": false
  },
  "channels": {
    "defaultTarget": "",
    "targets": []
  },
  "limits": {
    "groupSendIntervalMs": 3500,
    "chatSendIntervalMs": 1100,
    "channelSendIntervalMs": 1200,
    "ownerSendIntervalMs": 1000,
    "maxRememberedSpamUsers": 600,
    "maxMessageLength": 4000,
    "webhookTimeoutMs": 12000,
    "databaseFetchTimeoutMs": 8000,
    "maxParallelExternalFetches": 2,
    "maxChatRulesEvaluated": 120,
    "maxMemoryHistory": 8,
    "maxTelegramRetries": 2,
    "respectTelegramRetryAfter": true,
    "deduplicateUpdates": true,
    "publicWebhookUpdatesPerUtcDay": 99000,
    "ownerWebhookUpdatesPerUtcDay": 1000,
    "maxGroupsTracked": 500,
    "maxReportsStored": 100,
    "maxCaptchaPending": 2000,
    "maxTrackedSpamUsers": 1200,
    "webhookPayloadMaxBytes": 1000000,
    "databaseMaxBytes": 262144,
    "maxWebhookQueueUpdates": 512,
    "queueBatchSize": 8,
    "maxQueueRetries": 2,
    "maxKnownMembersPerGroup": 300,
    "maxPvUsers": 2000,
    "maxSecurityAuditEntries": 300,
    "securityAlertCooldownSeconds": 300,
    "tagallCooldownSeconds": 300,
    "tagallBatchSize": 8
  },
  "forwarding": {
    "enabled": true,
    "minIntervalMs": 10000,
    "maxIntervalMs": 31536000000,
    "defaultIntervalMs": 60000,
    "dailySuccessLimit": 0,
    "maxCount": 9007199254740000,
    "respectTelegramFloodWait": true,
    "retry429": true,
    "stopOnPermissionErrors": true,
    "stopOnMessageNotFound": true,
    "allowProtectedContentBypass": false,
    "description": "از Telegram Bot API رسمی استفاده می‌شود؛ محتوای محافظت‌شده یا پیام در دسترس را نمی‌توان دور زد.",
    "stopOnNotFound": true,
    "respectFloodWait": true
  },
  "texts": {
    "start": "برای استفاده، ربات را به یک گروه یا سوپرگروه اضافه کنید. در گفت‌وگوی خصوصی قابلیت‌های عمومی فعال نیستند.",
    "startOwner": "👑 پنل مالک\n\nمدیریت گروه‌ها، کانال‌ها، PVهای ثبت‌شده و ماژول‌ها از دکمه‌های زیر انجام می‌شود.\n\nنکته مهم: مالک باید پیش از عمومی‌کردن ربات، خودش در PV ربات /start بفرستد؛ اولین /start خصوصی فقط یک‌بار مالک را ثبت می‌کند.",
    "install": {
      "prompt": "📎 فایل database.js را مستقیماً به‌صورت Document ارسال کن. لینک لازم نیست؛ حجم مجاز حداکثر 256 KiB است.",
      "invalidUrl": "❌ فایل معتبر نیست. یک فایل .js با ساختار export default و داده‌های JSON ارسال کن.",
      "success": "✅ دیتابیس با موفقیت فعال شد\n\n📦 نسخه: {version}\n🧠 قوانین گفت‌وگو: {rules}\n\n🧩 منابع ساخته‌شده: {created}\n🔄 منابع به‌روزشده: {updated}\n🗑 منابع پاک‌سازی‌شده: {removed}\n\n🚀 موتور گفتگو، حافظه زمان‌دار و قابلیت‌های پیکربندی‌شده آماده‌اند.",
      "failed": "❌ نصب دیتابیس انجام نشد: {reason}",
      "confirmDelete": "⚠️ دیتابیس و حافظه‌های متعلق به آن حذف شوند؟",
      "deleted": "🗑 دیتابیس حذف شد؛ منابع منطقی و حافظه‌های وابسته در Durable Object پاک‌سازی شدند. برای نصب مجدد /installDB را بفرست.",
      "unchanged": "ℹ️ نسخه دیتابیس تغییری نکرده است؛ بررسی منابع تکمیل شد.",
      "resourceReport": "🧩 گزارش منابع دیتابیس\n\n🟢 ساخته‌شده: {created}\n🔵 به‌روزرسانی: {updated}\n⚪ حفظ‌شده: {retained}\n🗑 پاک‌سازی‌شده: {removed}",
      "dataOnly": "⚠️ دیتابیس فقط دادهٔ JSON معتبر می‌پذیرد؛ تابع، eval و کد اجرایی از فایل آپلودشده اجرا نمی‌شود."
    },
    "access": {
      "denied": "⛔ این بخش فقط برای مالک یا مدیر مجاز است.",
      "privateOnly": "🔒 این پنل فقط در گفت‌وگوی خصوصی فعال است.",
      "ownerOnly": "👑 این فرمان فقط برای مالک ربات است.",
      "adminOnly": "🛡 این فرمان فقط برای مدیران مجاز است."
    },
    "ui": {
      "forward": "📨 زمان‌بندی فوروارد",
      "reload": "📤 بارگذاری نسخه جدید",
      "delete": "🗑 حذف دیتابیس",
      "stopForward": "⏹ توقف فوروارد",
      "help": "💡 راهنما",
      "unknown": "این گزینه در دیتابیس تعریف نشده است.",
      "home": "🏠 صفحه اصلی",
      "confirm": "✅ تأیید",
      "cancel": "↩️ انصراف",
      "groups": "👥 گروه‌ها",
      "channels": "📢 کانال‌ها",
      "pvs": "👤 PVهای ثبت‌شده",
      "security": "🛡 گزارش‌های امنیتی"
    },
    "forward": {
      "askSource": "🔗 لینک دقیق پست مبدأ را بفرست. کانال یا گروه عمومی پشتیبانی می‌شود؛ مثال: https://t.me/channelname/123",
      "badSource": "❌ لینک پیام معتبر نیست؛ لینک عمومی یا خصوصی یک پست کانال را بفرست.",
      "sourceUnavailable": "❌ کانال یا گروه مبدأ قابل دسترسی نیست یا لینک متعلق به کانال/گروه نیست.",
      "joinSource": "❌ ربات عضو کانال مبدأ نیست. ربات را به کانال اضافه کن و دوباره تلاش کن.",
      "protected": "⛔ این کانال محتوای محافظت‌شده دارد؛ تلگرام اجازه فوروارد آن را نمی‌دهد.",
      "askTarget": "📡 لینک یا @username کانال/گروه را بفرست؛ برای گروه خصوصی می‌توانی شناسه عددی -100... را وارد کنی.",
      "badTarget": "❌ کانال مقصد معتبر نیست.",
      "targetUnavailable": "❌ مقصد باید کانال یا گروهی باشد که ربات به آن دسترسی دارد.",
      "sameTarget": "❌ مبدأ و مقصد نمی‌توانند یکسان باشند.",
      "targetPermission": "برای کانال، ربات باید مدیر با مجوز انتشار باشد؛ برای گروه، باید عضو گروه باشد.",
      "askInterval": "⏱ فاصله ارسال را به میلی‌ثانیه وارد کن. حداقل پیش‌فرض 10000 میلی‌ثانیه است.",
      "intervalInvalid": "❌ فاصله باید بین {min} و {max} میلی‌ثانیه باشد.",
      "askCount": "🔁 تعداد فوروارد را وارد کن؛ برای اجرای پیوسته بنویس auto.",
      "countInvalid": "❌ تعداد باید عددی بین 1 تا {max} یا auto باشد.",
      "started": "🚀 زمان‌بندی فعال شد!\n\nمبدأ: {source}\nمقصد: {target}\nفاصله: {interval} ms\nتعداد: {count}",
      "alreadyActive": "⚠️ یک زمان‌بندی فعال داری؛ ابتدا آن را متوقف کن.",
      "notActive": "ℹ️ زمان‌بندی فعالی وجود ندارد.",
      "stopped": "⏹ فوروارد متوقف شد. تعداد ارسال موفق: {sent}",
      "completed": "✅ عملیات فوروارد تکمیل شد. ارسال موفق: {sent}",
      "failed": "❌ عملیات فوروارد متوقف شد. کد تلگرام: {code}\nتوضیح: {reason}"
    },
    "welcome": "👋 سلام {name}، به {chat} خوش اومدی! قوانین رو بخون و خوش بگذرون. 💙",
    "moderation": {
      "protected": "🛡 این حساب در فهرست محافظت‌شده است و اقدامی روی آن انجام نمی‌دهم.",
      "actionSuccess": "✅ عملیات «{action}» با موفقیت برای {name} انجام شد.",
      "actionFailed": "❌ عملیات انجام نشد: {reason}",
      "muted": "🔇 {name} به دلیل اسپم برای {minutes} دقیقه محدود شد.",
      "warn": "⚠️ {name} عزیز، لطفاً قوانین گروه را رعایت کن.",
      "blockedWord": "⛔ پیام به دلیل نقض قوانین گروه حذف شد.",
      "notReply": "برای این فرمان باید روی پیام کاربر ریپلای کنی.",
      "botMiss": "😂 اشتباه زدی! منو نمی‌شه ریم کرد؛ تیرت خطا خورد 🎯"
    },
    "botReplyJokes": {
      "missed": "اشتباه زدی 😂 منو نمی‌شه ریم کرد! تیرت خطا خورد 🎯"
    },
    "controls": {
      "updated": "✅ تنظیمات این گروه به‌روزرسانی شد."
    },
    "jokes": {
      "empty": "فعلاً جوکی تو دیتابیس ندارم!"
    },
    "join": {
      "approved": "✅ درخواست عضویت {name} تأیید شد.",
      "rejected": "درخواست عضویت رد شد.",
      "captcha": "برای ارسال پیام، دکمه تأیید عضویت را بزن."
    },
    "channel": {
      "deleted": "🧹 یک پست دارای واژه ممنوع از {channel} حذف شد."
    },
    "channels": {
      "targetMissing": "ابتدا channels.defaultTarget را در دیتابیس تنظیم کن.",
      "targetUnavailable": "کانال پیکربندی‌شده در دسترس نیست.",
      "targetPermission": "ربات باید در کانال مدیر و دارای مجوز انتشار باشد.",
      "askPost": "متن یا رسانه‌ای را بفرست تا در کانال منتشر کنم.",
      "postSent": "✅ پست با موفقیت منتشر شد.",
      "postFailed": "❌ انتشار ناموفق بود: {reason}"
    },
    "help": "🤖 راهنمای ربات\n\nدر گروه: گفت‌وگو، سرگرمی و قابلیت‌های مدیریتی طبق تنظیمات فعال است.\nمدیر گروه: /bot off یا /bot on برای توقف یا فعال‌سازی پاسخ‌های ربات.\nمدیر گروه: /tagall برای پیش‌نمایش تگ اعضای شناخته‌شده/فعال؛ فهرست کامل همه اعضای ناشناخته از Bot API قابل دریافت نیست.\nگزارش تخلف: روی پیام ریپلای کنید و /report بفرستید.\nمالک: /author و /installDB فقط در PV مالک.",
    "conversation": {
      "empty": "الان جواب مشخصی براش ندارم؛ یه جور دیگه بپرس تا بهتر متوجه بشم. 🙂",
      "fallback": "من اینجام برای گپ و کمک؛ از یه سؤال دیگه شروع کنیم؟ 🤖",
      "cooldown": "",
      "tooLong": "پیامت طولانیه؛ لطفاً کوتاه‌ترش کن تا دقیق‌تر جواب بدم. ✂️",
      "contextReset": "🧠 حافظه گفت‌وگوی این چت پاک شد."
    },
    "errors": {
      "generic": "⚠️ خطای موقت رخ داد. کمی بعد دوباره تلاش کن.",
      "telegram": "خطای تلگرام: {reason}",
      "permission": "مجوز لازم برای این عملیات وجود ندارد."
    },
    "reports": {
      "received": "✅ گزارش برای مدیران ارسال شد. ممنون از اطلاع‌رسانی.",
      "ownerNotice": "🚩 گزارش جدید در {chat} ({chat_id}) از {reporter} ({reporter_id})؛ پیام {message_id}: {text}"
    },
    "privateOnly": "🤖 این ربات در گفت‌وگوی خصوصی برای کاربران عادی فعالیت نمی‌کند. برای استفاده، آن را به گروه یا سوپرگروه خود اضافه کنید.",
    "addToGroup": "➕ افزودن ربات به گروه",
    "group": {
      "ready": "✅ ربات با موفقیت به گروه اضافه شد و آمادهٔ کار است.\nتعداد اعضای گزارش‌شده توسط تلگرام: {members}",
      "minimumMembers": "⚠️ برای امنیت و جلوگیری از سوءاستفاده، گروه باید حداقل ۲۵ عضو داشته باشد.\nتعداد اعضای گزارش‌شده توسط تلگرام: {members}\nلطفاً تعداد اعضا را افزایش دهید و دوباره ربات را اضافه کنید. ربات اکنون گروه را ترک می‌کند.",
      "countUnavailable": "⚠️ بررسی تعداد اعضا از تلگرام ناموفق بود. ربات گروه را ترک نمی‌کند؛ لطفاً بعداً دوباره بررسی کنید.",
      "botOn": "✅ پاسخ‌های ربات در این گروه روشن شد.",
      "botOff": "🔕 پاسخ‌های عادی ربات در این گروه خاموش شد؛ کنترل امنیتی و فرمان /bot on همچنان فعال می‌ماند.",
      "adminOnly": "⛔ این فرمان فقط برای مالک یا مدیر واقعی گروه مجاز است.",
      "tagPreview": "👥 پیش‌نمایش تگ اعضای شناخته‌شده/فعال\nافراد قابل‌تگ از Updateهای واقعی ثبت شده‌اند: {count}\nاین فهرست شامل همه اعضای ناشناخته گروه نیست. برای ارسال، تأیید کنید.",
      "tagCooldown": "⏳ برای تگ‌کردن دوباره باید تا پایان زمان انتظار صبر کنید.",
      "tagEmpty": "هنوز کاربر شناخته‌شده و قابل‌تگی در این گروه ثبت نشده است.",
      "tagDone": "✅ تگ کاربران شناخته‌شده ارسال شد. تعداد واقعی تلاش‌شده: {count}",
      "tagOptOut": "✅ از تگ‌های گروه خارج شدید.",
      "tagOptIn": "✅ امکان تگ‌شدن دوباره فعال شد."
    },
    "ownerStartup": "👑 مالک ربات باید پیش از عمومی‌کردن ربات، از حساب شخصی خود در PV ربات /start بفرستد. Telegram Bot API شناسه سازنده Bot را به Worker ارائه نمی‌کند؛ بنابراین فقط اولین /start خصوصی مالک را ثبت می‌کند."
  },
  "features": {
    "chatbot": {
      "enabled": true,
      "mode": "weighted-rule-nlp",
      "language": "fa",
      "fallbackEnabled": false,
      "minScore": 1,
      "cooldownSeconds": 3,
      "maxInputLength": 1200,
      "maxRulesEvaluated": 160,
      "contextMemory": true,
      "maxHistory": 8,
      "responseVariation": true,
      "persona": {
        "name": "MUNITOS",
        "tone": "friendly-clever",
        "language": "fa-IR",
        "emojiDensity": "balanced",
        "answerStyle": "concise-first",
        "avoidOverReplying": true,
        "acknowledgeUncertainty": true,
        "doNotPretendToHaveLiveData": true
      },
      "fallbackResponses": [
        "الان پاسخ دقیقی براش ندارم؛ یه جور دیگه بپرس تا بهتر متوجه بشم. 🙂",
        "این موضوع جالبه؛ یکم دقیق‌ترش می‌کنی؟ 🧩"
      ],
      "rules": [
        {
          "keywords": [
            "سلام",
            "درود",
            "سلام علیکم",
            "سلاو",
            "هلو",
            "های"
          ],
          "match": "any",
          "threshold": 1,
          "priority": 30,
          "responses": [
            "سلام رفیق! 😄 چه خبر؟",
            "درود به روی ماهت! 🌱",
            "سلام سلام! خوش اومدی 💙"
          ]
        },
        {
          "keywords": [
            "خوبی",
            "چطوری",
            "حالت چطوره",
            "چه خبر"
          ],
          "match": "any",
          "threshold": 1,
          "priority": 28,
          "responses": [
            "من آماده‌ام و پرانرژی! تو چطوری؟ 😎",
            "همه‌چی روبه‌راهه؛ از تو چه خبر؟ 🌿"
          ]
        },
        {
          "keywords": [
            "صبح بخیر",
            "صبحت بخیر"
          ],
          "match": "any",
          "threshold": 1,
          "priority": 30,
          "responses": [
            "صبح قشنگت بخیر! ☀️",
            "روزت پر از اتفاق‌های خوب! 🌻"
          ]
        },
        {
          "keywords": [
            "شب بخیر",
            "شب خوش"
          ],
          "match": "any",
          "threshold": 1,
          "priority": 30,
          "responses": [
            "شب آرومی داشته باشی 🌙",
            "خواب‌های خوب ببینی؛ فردا بدرخشی ✨"
          ]
        },
        {
          "keywords": [
            "خداحافظ",
            "فعلا",
            "فعلاً",
            "بای",
            "میبینمت"
          ],
          "match": "any",
          "threshold": 1,
          "priority": 25,
          "responses": [
            "فعلاً رفیق، مراقب خودت باش! 👋",
            "به امید دیدار؛ هر وقت خواستی برگرد 💙"
          ]
        },
        {
          "keywords": [
            "ممنون",
            "مرسی",
            "دمت گرم",
            "سپاس",
            "تشکر"
          ],
          "match": "any",
          "threshold": 1,
          "priority": 25,
          "responses": [
            "قربونت! انجام وظیفه بود 💙",
            "خواهش می‌کنم، خوشحالم که کمک کردم! 😄"
          ]
        },
        {
          "keywords": [
            "ببخشید",
            "معذرت",
            "شرمنده"
          ],
          "match": "any",
          "threshold": 1,
          "priority": 20,
          "responses": [
            "اشکالی نداره، پیش میاد 🌱",
            "همه‌چی خوبه؛ ادامه بدیم 😊"
          ]
        },
        {
          "keywords": [
            "اسمت چیه",
            "اسم تو",
            "کی هستی"
          ],
          "match": "any",
          "threshold": 1,
          "priority": 35,
          "responses": [
            "من دستیار هوشمند همین جمعم؛ اسمم رو شما باحال‌تر می‌کنین! 🤖",
            "یه ربات چندکاره‌ام؛ هم گپ می‌زنم هم به مدیرها کمک می‌کنم."
          ]
        },
        {
          "keywords": [
            "سازنده",
            "مالک ربات",
            "صاحب ربات"
          ],
          "match": "any",
          "threshold": 1,
          "priority": 35,
          "answer": "مدیریت اصلی و تنظیمات حساس دست مالک رباته. 👑"
        },
        {
          "keywords": [
            "چند سالته",
            "سنت چقدره"
          ],
          "match": "any",
          "threshold": 1,
          "priority": 20,
          "answer": "من با زمان نسخه‌بندی می‌شم، نه با شمع تولد! 😂"
        },
        {
          "keywords": [
            "ربات",
            "چه کارهایی بلدی",
            "قابلیت"
          ],
          "match": "any",
          "threshold": 1,
          "priority": 22,
          "answer": "می‌تونم گفت‌وگو کنم، جوک بگم، در گروه ضداسپم و مدیریت انجام بدم، اعضای جدید رو خوشامد بگم و کارهای زمان‌بندی‌شده اجرا کنم. 🤖"
        },
        {
          "keywords": [
            "کمک",
            "راهنما",
            "راهنمایی",
            "چیکار میکنی"
          ],
          "match": "any",
          "threshold": 1,
          "priority": 22,
          "answer": "برای گپ فقط پیام بده؛ برای جوک بگو «جوک». مدیرها می‌تونن روی پیام افراد ریپلای کنن و فرمان‌های مدیریتی دیتابیس رو بفرستن. 💡"
        },
        {
          "keywords": [
            "جوک",
            "لطیفه",
            "بخندون"
          ],
          "match": "any",
          "threshold": 1,
          "priority": 18,
          "answer": "برای یه جوک تازه فقط بنویس «جوک»؛ آرشیوم آماده‌ست! 😂"
        },
        {
          "keywords": [
            "خسته ام",
            "خسته‌ام",
            "حوصله ندارم",
            "بی حوصله",
            "بی‌حوصله"
          ],
          "match": "any",
          "threshold": 1,
          "priority": 24,
          "responses": [
            "یه استراحت کوتاه، یه لیوان آب و یه نفس عمیق؛ از همین‌جا شروع کن ☕",
            "گاهی فقط لازمه چند دقیقه به خودت فرصت بدی. منم هستم برای یه گپ کوتاه 💙"
          ]
        },
        {
          "keywords": [
            "ناراحتم",
            "حالم بده",
            "غمگینم",
            "دلم گرفته"
          ],
          "match": "any",
          "threshold": 1,
          "priority": 26,
          "responses": [
            "متأسفم که این حس رو داری. دوست داری درباره‌ش حرف بزنی؟ 💙",
            "گاهی گفتن چیزی که توی دلمونه، کمی سبک‌مون می‌کنه. من گوش می‌دم. 🌱"
          ]
        },
        {
          "keywords": [
            "عالی",
            "خوشحالم",
            "خیلی خوبم"
          ],
          "match": "any",
          "threshold": 1,
          "priority": 20,
          "responses": [
            "چه عالی! همین انرژی رو نگه دار! 🚀",
            "این خبر خوب رو باید جشن گرفت! 🎉"
          ]
        },
        {
          "keywords": [
            "دوستت دارم",
            "عاشقتم"
          ],
          "match": "any",
          "threshold": 1,
          "priority": 22,
          "responses": [
            "چه انرژی قشنگی! منم با تمام بیت‌هام در خدمتتم 😂💙",
            "محبت داری رفیق! 🤖"
          ]
        },
        {
          "keywords": [
            "تنهایی",
            "تنها هستم"
          ],
          "match": "any",
          "threshold": 1,
          "priority": 24,
          "responses": [
            "اگه دوست داری، همین‌جا با هم گپ می‌زنیم. چه موضوعی توی ذهنته؟ 💬",
            "گاهی یک گفت‌وگوی ساده حال آدم رو بهتر می‌کنه. من گوش می‌دم."
          ]
        },
        {
          "keywords": [
            "استرس",
            "نگرانم",
            "اضطراب دارم"
          ],
          "match": "any",
          "threshold": 1,
          "priority": 24,
          "responses": [
            "بیا مسئله رو به قدم‌های کوچک‌تر تقسیم کنیم؛ اولین چیزی که نگرانت کرده چیه؟ 🌿",
            "یک نفس آرام بکش. لازم نیست همه‌چیز رو همین الان حل کنی."
          ]
        },
        {
          "keywords": [
            "موفق باشی",
            "آرزوی موفقیت",
            "بدرخشی"
          ],
          "match": "any",
          "threshold": 1,
          "priority": 20,
          "answer": "ممنون! برای تو هم کلی موفقیت و اتفاق خوب آرزو می‌کنم ✨"
        },
        {
          "keywords": [
            "شب",
            "امشب",
            "امروز"
          ],
          "match": "any",
          "threshold": 1,
          "priority": 5,
          "answer": "امیدوارم ادامه روزت پر از اتفاق‌های خوب باشه. 🌱"
        },
        {
          "keywords": [
            "تلگرام",
            "telegram",
            "بات api"
          ],
          "match": "any",
          "threshold": 1,
          "priority": 18,
          "answer": "من روی Telegram Bot API و Cloudflare Workers اجرا می‌شم؛ تنظیمات و رفتارم از دیتابیس قابل به‌روزرسانیه."
        },
        {
          "keywords": [
            "فوروارد",
            "زمان بندی",
            "زمان‌بندی",
            "ارسال خودکار"
          ],
          "match": "any",
          "threshold": 1,
          "priority": 22,
          "answer": "برای زمان‌بندی فوروارد، مالک از پنل خصوصی دکمه «زمان‌بندی فوروارد» رو انتخاب می‌کنه. نرخ ارسال با محدودیت ضداسپم تلگرام هماهنگ می‌شه."
        },
        {
          "keywords": [
            "مدیر",
            "ادمین",
            "مدیریت گروه"
          ],
          "match": "any",
          "threshold": 1,
          "priority": 20,
          "answer": "فرمان‌های مدیریتی فقط برای مالک و شناسه‌هایی که مالک در دیتابیس مجاز کرده فعال می‌شن. برای اقدام روی کاربر، روی پیامش ریپلای کن."
        },
        {
          "keywords": [
            "بن",
            "ریم",
            "اخراج"
          ],
          "match": "any",
          "threshold": 1,
          "priority": 14,
          "answer": "اگر مدیر مجاز هستی، روی پیام کاربر ریپلای کن و فرمان بن یا اخراج دیتابیس رو بفرست."
        },
        {
          "keywords": [
            "حافظه",
            "یادت میمونه",
            "یادت می‌مونه"
          ],
          "match": "any",
          "threshold": 1,
          "priority": 20,
          "answer": "بخشی از زمینه گفت‌وگو به‌صورت محدود و زمان‌دار در حافظه داخلی ذخیره می‌شه تا پاسخ‌ها مرتبط‌تر باشن. 🧠"
        },
        {
          "keywords": [
            "هوش مصنوعی",
            "ai",
            "ان ال پی",
            "nlp"
          ],
          "match": "any",
          "threshold": 1,
          "priority": 20,
          "answer": "موتور گفت‌وگوی من در این نسخه NLP قانون‌محوره: کلیدواژه‌ها رو نرمال‌سازی می‌کنه، امتیاز می‌ده و بهترین پاسخ دیتابیس رو انتخاب می‌کنه."
        },
        {
          "keywords": [
            "هوا چطوره",
            "آب و هوا"
          ],
          "match": "any",
          "threshold": 1,
          "priority": 15,
          "answer": "برای اطلاعات زنده آب‌وهوا باید به من منبع هواشناسی متصل بشه؛ فعلاً نمی‌خوام حدس بزنم. 🌦️"
        },
        {
          "keywords": [
            "پول",
            "قیمت",
            "دلار"
          ],
          "match": "any",
          "threshold": 1,
          "priority": 15,
          "answer": "برای قیمت‌های لحظه‌ای باید منبع داده زنده داشته باشم؛ عدد قدیمی یا حدسی بهت نمی‌دم."
        },
        {
          "keywords": [
            "شبکه",
            "اینترنت",
            "وای فای",
            "وای‌فای"
          ],
          "match": "any",
          "threshold": 1,
          "priority": 16,
          "responses": [
            "اینترنت خوب یعنی آرامش دیجیتال! 📶",
            "وقتی وای‌فای قطع می‌شه، تازه می‌فهمیم چقدر بهش وابسته‌ایم 😂"
          ]
        },
        {
          "keywords": [
            "برنامه نویسی",
            "کدنویسی",
            "جاوااسکریپت",
            "javascript"
          ],
          "match": "any",
          "threshold": 1,
          "priority": 18,
          "responses": [
            "کد خوب، کدی‌ـه که ساده، قابل تست و قابل نگهداری باشه. 💻",
            "اول درست کار کنه، بعد سریع و تمیزش می‌کنیم! 🚀"
          ]
        },
        {
          "keywords": [
            "گشنمه",
            "گرسنمه",
            "غذا چی بخورم"
          ],
          "match": "any",
          "threshold": 1,
          "priority": 18,
          "responses": [
            "یه غذای ساده و خوشمزه انتخاب کن؛ اگه مواد اولیه رو بگی ایده می‌دم! 🍲",
            "من که امکان چشیدن ندارم، ولی برای پیشنهاد غذا پایه‌ام! 😄"
          ]
        },
        {
          "keywords": [
            "چای",
            "قهوه"
          ],
          "match": "any",
          "threshold": 1,
          "priority": 12,
          "responses": [
            "تیم چای برای آرامش، تیم قهوه برای شروع دوباره! تو کدومی؟ ☕",
            "این یکی از سخت‌ترین تصمیم‌های روزه! 😂"
          ]
        },
        {
          "keywords": [
            "بازی",
            "حوصله بازی"
          ],
          "match": "any",
          "threshold": 1,
          "priority": 16,
          "responses": [
            "یه بازی کلمه‌ای بزنیم؟ یک کلمه بگو تا با آخرین حرفش ادامه بدم! 🎮",
            "من پایه‌ام؛ اسم بازی رو انتخاب کن! 🕹️"
          ]
        },
        {
          "keywords": [
            "ادامه بده",
            "بیشتر بگو",
            "ادامه"
          ],
          "match": "any",
          "threshold": 1,
          "priority": 12,
          "answer": "حتماً! موضوع یا بخش موردنظرت رو دقیق‌تر بگو تا ادامه بدم. 🙂"
        },
        {
          "keywords": [
            "چرا",
            "دلیلش چیه"
          ],
          "match": "any",
          "threshold": 1,
          "priority": 8,
          "answer": "برای اینکه دقیق جواب بدم، جمله یا موضوع قبلی رو هم مشخص کن؛ نمی‌خوام بی‌دلیل حدس بزنم. 🧩"
        },
        {
          "keywords": [
            "باشه",
            "اوکی",
            "اوک",
            "قبوله"
          ],
          "match": "any",
          "threshold": 1,
          "priority": 10,
          "responses": [
            "پس بزن بریم! ✅",
            "عالی، هماهنگ شدیم 😎"
          ]
        },
        {
          "keywords": [
            "نه",
            "نخیر"
          ],
          "match": "any",
          "threshold": 1,
          "priority": 4,
          "answer": "باشه، نظرت محترمه. می‌خوای مسیر دیگه‌ای رو امتحان کنیم؟"
        },
        {
          "keywords": [
            "آره",
            "بله",
            "حتما",
            "حتماً"
          ],
          "match": "any",
          "threshold": 1,
          "priority": 4,
          "answer": "پس عالیه! ادامه بده، دارم گوش می‌دم. 👂"
        },
        {
          "keywords": [
            "شوخی",
            "شوخی کردم",
            "جدی نگیر"
          ],
          "match": "any",
          "threshold": 1,
          "priority": 15,
          "responses": [
            "😂 گرفتم، شوخی‌ات ثبت شد!",
            "پس پرونده رو با خنده می‌بندیم! 😄"
          ]
        },
        {
          "keywords": [
            "تبریک",
            "تولدت مبارک",
            "مبارکه"
          ],
          "match": "any",
          "threshold": 1,
          "priority": 18,
          "responses": [
            "مبارک باشه! همیشه خبرهای خوب بشنوی 🎉",
            "چه خبر خوبی! هزار بار مبارک! 🥳"
          ]
        },
        {
          "keywords": [
            "موفقیت",
            "هدف",
            "انگیزه"
          ],
          "match": "any",
          "threshold": 1,
          "priority": 17,
          "responses": [
            "هدف بزرگ رو به کارهای کوچیک روزانه تبدیل کن؛ استمرار معجزه می‌کنه. 🚀",
            "قدم کوچک امروز، از برنامه بزرگِ بدون اجرا بهتره. 🌱"
          ]
        },
        {
          "keywords": [
            "اشتباه",
            "باگ",
            "ارور",
            "خطا"
          ],
          "match": "any",
          "threshold": 1,
          "priority": 16,
          "answer": "اول متن دقیق خطا و مرحله‌ای که خطا در اون رخ داده رو بررسی کنیم؛ با حدس زدن فقط زمان از دست می‌ره. 🛠️"
        },
        {
          "keywords": [
            "موزیک",
            "آهنگ",
            "موسیقی"
          ],
          "match": "any",
          "threshold": 1,
          "priority": 14,
          "responses": [
            "چه سبکی دوست داری؟ پاپ، راک، سنتی یا الکترونیک؟ 🎧",
            "موسیقی بعضی روزها از هزار تا حرف بهتره. 🎶"
          ]
        },
        {
          "keywords": [
            "کتاب",
            "مطالعه",
            "کتاب خوندن"
          ],
          "match": "any",
          "threshold": 1,
          "priority": 14,
          "responses": [
            "چه ژانری دوست داری؟ داستانی، علمی، روان‌شناسی یا تاریخی؟ 📚",
            "حتی ده دقیقه مطالعه هم می‌تونه شروع خوبی باشه."
          ]
        },
        {
          "keywords": [
            "سکوت",
            "چرا ساکتی"
          ],
          "match": "any",
          "threshold": 1,
          "priority": 14,
          "answer": "داشتم بهینه‌سازی می‌کردم که بی‌موقع وسط حرف کسی نپرم! 🤖"
        },
        {
          "keywords": [
            "حافظه پاک",
            "فراموش کن"
          ],
          "match": "any",
          "threshold": 1,
          "priority": 14,
          "answer": "می‌تونم زمینه مکالمه ذخیره‌شده در حافظه کوتاه‌مدت رو کنار بگذارم؛ اطلاعات پایدار دیتابیس جداگانه مدیریت می‌شه."
        },
        {
          "keywords": [
            "مراقب خودت",
            "مواظب خودت"
          ],
          "match": "any",
          "threshold": 1,
          "priority": 12,
          "answer": "تو هم مراقب خودت باش رفیق! 💙"
        },
        {
          "keywords": [
            "😂",
            "🤣",
            "خخخ"
          ],
          "match": "any",
          "threshold": 1,
          "priority": 10,
          "responses": [
            "خنده مسریه؛ ادامه بده! 😂",
            "این خنده‌ها رو دوست دارم! 🤣"
          ]
        },
        {
          "keywords": [
            "کجایی",
            "کجا هستی"
          ],
          "match": "any",
          "threshold": 1,
          "priority": 12,
          "answer": "من داخل همین چت‌ام؛ هر وقت صدام کنی جواب می‌دم! 🤖"
        },
        {
          "keywords": [
            "بیداری",
            "خوابی"
          ],
          "match": "any",
          "threshold": 1,
          "priority": 12,
          "answer": "ربات‌ها نمی‌خوابن؛ فقط گاهی منتظر پیام بعدی می‌مونن! 😴"
        },
        {
          "keywords": [
            "حوصله",
            "سرم شلوغه"
          ],
          "match": "any",
          "threshold": 1,
          "priority": 10,
          "answer": "می‌تونیم یک کار کوچیک و مشخص انتخاب کنیم تا شروعش راحت‌تر بشه. 🌱"
        },
        {
          "keywords": [
            "چی فکر میکنی",
            "نظرت چیه"
          ],
          "match": "any",
          "threshold": 1,
          "priority": 10,
          "answer": "نظرم رو می‌گم، ولی اول بگو دقیقاً درباره کدوم بخش می‌پرسی؟"
        },
        {
          "keywords": [
            "خطرناکه",
            "امنیت"
          ],
          "match": "any",
          "threshold": 1,
          "priority": 16,
          "answer": "اول دسترسی‌ها رو محدود کن، ورودی‌ها رو اعتبارسنجی کن و خطاها رو بدون افشای اطلاعات ثبت کن. 🔐"
        },
        {
          "keywords": [
            "سرعت",
            "کندی",
            "بهینه سازی"
          ],
          "match": "any",
          "threshold": 1,
          "priority": 16,
          "answer": "برای سرعت، تعداد درخواست‌ها، نوشتن‌های ذخیره‌سازی و کارهای تکراری رو کم می‌کنیم؛ نه اینکه کنترل خطا رو حذف کنیم. ⚡"
        },
        {
          "keywords": [
            "هزینه",
            "مصرف",
            "سهمیه"
          ],
          "match": "any",
          "threshold": 1,
          "priority": 16,
          "answer": "مصرف واقعی حساب رو باید از داشبورد Cloudflare دید؛ شمارنده داخلی فقط تخمین و ترمز محافظتیه."
        },
        {
          "keywords": [
            "کانال",
            "پست کانال"
          ],
          "match": "any",
          "threshold": 1,
          "priority": 14,
          "answer": "برای انتشار در کانال، ربات باید مدیر و دارای مجوز ارسال پیام باشه. 📣"
        },
        {
          "keywords": [
            "عضو جدید",
            "خوشامد"
          ],
          "match": "any",
          "threshold": 1,
          "priority": 14,
          "answer": "خوشامدگویی اعضای جدید از تنظیمات features.welcome در دیتابیس کنترل می‌شه."
        },
        {
          "keywords": [
            "ضد اسپم",
            "اسپم"
          ],
          "match": "any",
          "threshold": 1,
          "priority": 14,
          "answer": "ضداسپم با پنجره زمانی، تشخیص تکرار و محدودسازی تدریجی کار می‌کنه. 🛡️"
        },
        {
          "keywords": [
            "ربات خوب",
            "آفرین",
            "دمت گرم ربات"
          ],
          "match": "any",
          "threshold": 1,
          "priority": 16,
          "answer": "مرسی از انرژی خوبت! 😎💙"
        },
        {
          "keywords": [
            "دلم میخواد",
            "دوست دارم"
          ],
          "match": "any",
          "threshold": 1,
          "priority": 8,
          "answer": "چه خوب! بگو دوست داری چه اتفاقی بیفته؟"
        },
        {
          "keywords": [
            "نمی دونم",
            "نمیدونم",
            "نمی‌دونم"
          ],
          "match": "any",
          "threshold": 1,
          "priority": 12,
          "answer": "اشکالی نداره؛ از بین گزینه‌ها یکی رو امتحان کنیم یا مسئله رو خرد کنیم. 🌿"
        },
        {
          "keywords": [
            "تصمیم",
            "انتخاب کنم"
          ],
          "match": "any",
          "threshold": 1,
          "priority": 12,
          "answer": "گزینه‌ها، مزایا و محدودیت‌ها رو کنار هم بذار؛ بعد انتخاب روشن‌تر می‌شه."
        },
        {
          "keywords": [
            "وقت بخیر",
            "روز بخیر"
          ],
          "match": "any",
          "threshold": 1,
          "priority": 14,
          "answer": "وقت تو هم بخیر و پر از خبرهای خوب! 🌼"
        },
        {
          "keywords": [
            "شب طولانی",
            "دیر وقته"
          ],
          "match": "any",
          "threshold": 1,
          "priority": 12,
          "answer": "پس وقتشه کمی استراحت کنی؛ فردا با انرژی ادامه بده. 🌙"
        },
        {
          "keywords": [
            "خنده دار",
            "بامزه"
          ],
          "match": "any",
          "threshold": 1,
          "priority": 10,
          "answer": "پس بذار یه لبخند کوچیک به برنامه امروز اضافه کنیم! 😁"
        },
        {
          "keywords": [
            "موفق نمیشم",
            "نمیتونم"
          ],
          "match": "any",
          "threshold": 1,
          "priority": 14,
          "answer": "لازم نیست یک‌باره کامل انجامش بدی؛ فقط قدم اول رو مشخص کن. 💪"
        },
        {
          "keywords": [
            "استراحت",
            "خوابم میاد"
          ],
          "match": "any",
          "threshold": 1,
          "priority": 10,
          "answer": "کمی استراحت مفید می‌تونه تمرکزت رو برگردونه. 💤"
        },
        {
          "keywords": [
            "بازی کنیم",
            "بازی کلمه"
          ],
          "match": "any",
          "threshold": 1,
          "priority": 14,
          "answer": "من آماده‌ام؛ تو شروع کن و یک کلمه بفرست. 🎲"
        },
        {
          "keywords": [
            "میشه کمکم کنی",
            "کمکم میکنی",
            "به کمک نیاز دارم"
          ],
          "match": "any",
          "threshold": 1,
          "priority": 29,
          "responses": [
            "حتماً! بگو دقیقاً کجای کار گیر کردی تا با هم قدم‌به‌قدم حلش کنیم. 🧩",
            "پایه‌ام؛ موضوع رو بگو و هر اطلاعاتی داری اضافه کن. 🤝"
          ]
        },
        {
          "keywords": [
            "یه سوال دارم",
            "یک سوال دارم",
            "سوالی دارم"
          ],
          "match": "any",
          "threshold": 1,
          "priority": 30,
          "responses": [
            "بپرس رفیق؛ حواسم بهته. 🎧",
            "گوشم با توئه! سوالت رو بگو. 💬"
          ]
        },
        {
          "keywords": [
            "میشه توضیح بدی",
            "بیشتر توضیح بده",
            "ساده توضیح بده"
          ],
          "match": "any",
          "threshold": 1,
          "priority": 27,
          "responses": [
            "حتماً؛ ساده و مرحله‌به‌مرحله بازش می‌کنم. اول بگو کدوم بخش برات مبهمه؟ 🧠",
            "با مثال توضیحش می‌دم؛ موضوع دقیق رو مشخص کن. ✨"
          ]
        },
        {
          "keywords": [
            "نظرت چیه",
            "نظر تو چیه",
            "تو چی فکر میکنی"
          ],
          "match": "any",
          "threshold": 1,
          "priority": 25,
          "responses": [
            "اول معیارها رو مشخص کنیم؛ بعد نظر دقیق‌تری می‌دم. از چه زاویه‌ای برات مهمه؟ 🔎",
            "به نظرم باید مزایا، هزینه و ریسک رو کنار هم دید. موضوع چیه؟"
          ]
        },
        {
          "keywords": [
            "تصمیم گیری",
            "نمیتونم تصمیم بگیرم",
            "بین دو راه موندم"
          ],
          "match": "any",
          "threshold": 1,
          "priority": 25,
          "responses": [
            "دو گزینه رو بنویس؛ با معیارهای هزینه، زمان، ریسک و نتیجه مقایسه‌شون می‌کنیم. ⚖️",
            "تصمیم رو به چند معیار قابل‌اندازه‌گیری بشکنیم؛ گزینه‌هات چیه؟"
          ]
        },
        {
          "keywords": [
            "اشتباه کردم",
            "گند زدم",
            "خرابکاری کردم"
          ],
          "match": "any",
          "threshold": 1,
          "priority": 24,
          "responses": [
            "اشتباه پایان کار نیست؛ اول ببینیم چه چیزی قابل جبرانه و قدم بعدی چیه. 🌱",
            "آروم؛ اتفاق افتاده. بگو چی شده تا راه اصلاحش رو پیدا کنیم."
          ]
        },
        {
          "keywords": [
            "ببخشید",
            "معذرت میخوام",
            "معذرت خواهی"
          ],
          "match": "any",
          "threshold": 1,
          "priority": 24,
          "answer": "لازم نیست خودت رو سرزنش کنی؛ مهم اینه که متوجه شدی و می‌خوای بهترش کنی. 💙"
        },
        {
          "keywords": [
            "خوابم نمیبره",
            "بی خوابم",
            "بی خوابی"
          ],
          "match": "any",
          "threshold": 1,
          "priority": 24,
          "responses": [
            "نور صفحه رو کم کن، چند دقیقه از گوشی فاصله بگیر و نفس آروم بکش. 🌙",
            "اگه فکرت شلوغه، کارهای فردا رو روی کاغذ بنویس تا ذهنت سبک‌تر بشه."
          ]
        },
        {
          "keywords": [
            "مدرسه",
            "کلاس درس",
            "دانشگاه"
          ],
          "match": "any",
          "threshold": 1,
          "priority": 15,
          "responses": [
            "از درس و کلاس چه خبر؟ امروز چه چیزی جالب بود؟ 📚",
            "اگه درس خاصی داری، اسمش رو بگو تا برای مرورش برنامه بچینیم."
          ]
        },
        {
          "keywords": [
            "امتحان دارم",
            "امتحان فردا",
            "آزمون دارم"
          ],
          "match": "any",
          "threshold": 1,
          "priority": 26,
          "responses": [
            "برای مرور سریع، سرفصل‌ها رو به بخش‌های ۲۵ دقیقه‌ای تقسیم کن و آخر هر بخش از خودت آزمون بگیر. 🎯",
            "اسم درس و زمان باقی‌مونده رو بگو تا یک برنامه مرور واقع‌بینانه بچینیم."
          ]
        },
        {
          "keywords": [
            "ریاضی",
            "معادله",
            "هندسه"
          ],
          "match": "any",
          "threshold": 1,
          "priority": 16,
          "answer": "صورت سؤال رو کامل بفرست؛ مرحله‌به‌مرحله حلش می‌کنیم و دلیل هر مرحله رو می‌گم. ➗"
        },
        {
          "keywords": [
            "انگلیسی",
            "زبان انگلیسی",
            "گرامر انگلیسی"
          ],
          "match": "any",
          "threshold": 1,
          "priority": 17,
          "responses": [
            "می‌تونیم واژگان، گرامر یا مکالمه تمرین کنیم. کدوم رو ترجیح می‌دی؟ 🇬🇧",
            "یک جمله انگلیسی بفرست؛ هم اصلاحش می‌کنم هم دلیلش رو توضیح می‌دم."
          ]
        },
        {
          "keywords": [
            "برنامه نویسی",
            "کدنویسی",
            "کد نویسی"
          ],
          "match": "any",
          "threshold": 1,
          "priority": 18,
          "responses": [
            "زبان، خطا و تکه‌کد مربوط رو بفرست؛ اول علت رو پیدا می‌کنیم، بعد راه‌حل کم‌تغییر می‌دیم. 💻",
            "برای بررسی دقیق، پیام خطا و بخشی از کد که درگیرشه رو بفرست."
          ]
        },
        {
          "keywords": [
            "باگ دارم",
            "ارور میده",
            "خطا میده"
          ],
          "match": "any",
          "threshold": 1,
          "priority": 23,
          "responses": [
            "متن کامل خطا، محیط اجرا و آخرین تغییری که دادی رو بفرست؛ از اولین خطای واقعی شروع می‌کنیم. 🛠️",
            "لاگ کامل بهتر از حدسه؛ خطا رو از اولین بخش قرمز تا انتها بفرست."
          ]
        },
        {
          "keywords": [
            "اینترنت قطع شده",
            "اینترنت ضعیفه",
            "سرعت اینترنت"
          ],
          "match": "any",
          "threshold": 1,
          "priority": 20,
          "responses": [
            "اول اتصال رو روی یک دستگاه دیگه و یک شبکه دیگه بررسی کن؛ بعد مودم رو یک‌بار خاموش و روشن کن. 📶",
            "برای عیب‌یابی بگو مشکل روی وای‌فای هم هست یا دیتای موبایل؟"
          ]
        },
        {
          "keywords": [
            "گوشیم داغ میکنه",
            "گوشی داغ شده",
            "داغ شدن گوشی"
          ],
          "match": "any",
          "threshold": 1,
          "priority": 20,
          "responses": [
            "برنامه‌های سنگین رو ببند، گوشی رو از آفتاب دور کن و هنگام شارژ استفاده سنگین نکن. 🌡️",
            "اگه دما خیلی بالاست، شارژر رو جدا کن و بذار در محیط خنک به حالت عادی برگرده."
          ]
        },
        {
          "keywords": [
            "باتری زود خالی میشه",
            "شارژ نگه نمیداره",
            "مصرف باتری"
          ],
          "match": "any",
          "threshold": 1,
          "priority": 20,
          "responses": [
            "مصرف باتری برنامه‌ها، روشنایی و آنتن‌دهی رو بررسی کن؛ افت ناگهانی می‌تونه نشانه فرسودگی باتری باشه. 🔋",
            "در تنظیمات Battery usage ببین کدوم برنامه بیشترین مصرف رو داشته."
          ]
        },
        {
          "keywords": [
            "امنیت حساب",
            "هک شدم",
            "اکانتم هک شده"
          ],
          "match": "any",
          "threshold": 1,
          "priority": 27,
          "responses": [
            "از یک دستگاه مطمئن نشست‌های فعال رو ببند، رمز یکتا بگذار و تأیید دومرحله‌ای رو فعال کن. 🔐",
            "اول دسترسی‌های ناشناس رو لغو کن و ایمیل/شماره بازیابی رو بررسی کن. رمز یا کد ورودت رو برای هیچ‌کس نفرست."
          ]
        },
        {
          "keywords": [
            "رمزم رو فراموش کردم",
            "رمز عبور یادم رفته",
            "پسوردم یادم رفته"
          ],
          "match": "any",
          "threshold": 1,
          "priority": 25,
          "answer": "از فرایند رسمی بازیابی همان سرویس استفاده کن؛ کد یک‌بارمصرف یا رمز بازیابی رو با هیچ‌کس به اشتراک نگذار. 🔑"
        },
        {
          "keywords": [
            "معما بگو",
            "یه معما",
            "چیستان"
          ],
          "match": "any",
          "threshold": 1,
          "priority": 24,
          "responses": [
            "چی هست که هرچی ازش برداری بزرگ‌تر می‌شه؟ 🤔",
            "معمای کوتاه: بدون دهان حرف می‌زنم و بدون گوش جواب می‌دم؛ من چی‌ام؟ 🧩"
          ]
        },
        {
          "keywords": [
            "ازم سوال بپرس",
            "یه سوال بپرس",
            "سوال جالب"
          ],
          "match": "any",
          "threshold": 1,
          "priority": 23,
          "responses": [
            "اگه می‌تونستی یک مهارت رو همین امشب کامل یاد بگیری، چی انتخاب می‌کردی؟ ✨",
            "ترجیح می‌دی یک سال آینده روی یک هدف بزرگ تمرکز کنی یا چند هدف کوچک؟ چرا؟"
          ]
        },
        {
          "keywords": [
            "فیلم معرفی کن",
            "فیلم خوب",
            "چی ببینم"
          ],
          "match": "any",
          "threshold": 1,
          "priority": 20,
          "responses": [
            "چه ژانری دوست داری؛ کمدی، معمایی، علمی‌تخیلی یا درام؟ 🎬",
            "فیلم پرهیجان می‌خوای یا چیزی آروم و حال‌خوب‌کن؟"
          ]
        },
        {
          "keywords": [
            "موسیقی معرفی کن",
            "آهنگ معرفی کن",
            "چی گوش بدم"
          ],
          "match": "any",
          "threshold": 1,
          "priority": 20,
          "responses": [
            "حال‌وهوات رو بگو؛ پرانرژی، آرام، غمگین یا تمرکزی؟ 🎧",
            "فارسی می‌خوای یا بین‌المللی؟ سبک رو مشخص کن تا پیشنهاد دقیق‌تری بدم."
          ]
        },
        {
          "keywords": [
            "کتاب معرفی کن",
            "چی بخونم",
            "کتاب خوب"
          ],
          "match": "any",
          "threshold": 1,
          "priority": 20,
          "responses": [
            "داستانی، علمی، روان‌شناسی یا مهارتی؟ ژانر رو بگو تا بهتر پیشنهاد بدم. 📖",
            "کتاب کوتاه و روان دوست داری یا عمیق و مفصل؟"
          ]
        },
        {
          "keywords": [
            "ورزش کنم",
            "ورزش کردن",
            "تمرین ورزشی"
          ],
          "match": "any",
          "threshold": 1,
          "priority": 18,
          "responses": [
            "برای شروع، پیاده‌روی منظم و تمرین سبک بهتر از برنامه سنگین و ناگهانیه. 🏃",
            "هدفت چیه؛ آمادگی عمومی، قدرت، انعطاف یا فقط تحرک روزانه؟"
          ]
        },
        {
          "keywords": [
            "حوصلم سر رفته",
            "حوصله ام سر رفته",
            "بی حوصله ام"
          ],
          "match": "any",
          "threshold": 1,
          "priority": 25,
          "responses": [
            "سه گزینه: بازی کلمه‌ای، معما یا یک سؤال عجیب! کدوم رو انتخاب می‌کنی؟ 🎲",
            "بیا یک چالش کوتاه: سه چیز بگو که امروز دیدی و قبلاً بهشون دقت نکرده بودی. 😄"
          ]
        },
        {
          "keywords": [
            "چقدر طول میکشه",
            "زمانش چقدره",
            "کی تموم میشه"
          ],
          "match": "any",
          "threshold": 1,
          "priority": 17,
          "answer": "بستگی به کاری داره که منظورت هست؛ جزئیات و نقطه شروع رو بگو تا زمان واقع‌بینانه تخمین بزنیم. ⏱️"
        },
        {
          "keywords": [
            "یادت هست",
            "یادت میاد",
            "قبلا گفتم"
          ],
          "match": "any",
          "threshold": 1,
          "priority": 22,
          "responses": [
            "فقط زمینه محدودی از گفت‌وگوی همین چت و در بازه نگهداری تنظیم‌شده در دسترسمه؛ اگه نکته‌ای مهمه دوباره یادآوری کن. 🧠",
            "ممکنه بخشی از زمینه قبلی رو داشته باشم، ولی اطلاعات حساس رو دوباره ارسال نکن."
          ]
        },
        {
          "keywords": [
            "حافظه ات رو پاک کن",
            "فراموشم کن",
            "حافظه رو پاک کن"
          ],
          "match": "any",
          "threshold": 1,
          "priority": 28,
          "answer": "برای حفظ حریم خصوصی، حافظه مکالمه به‌صورت محدود و زمان‌دار نگهداری می‌شه؛ پاک‌سازی مدیریتی از طریق حذف/بازسازی دیتابیس انجام می‌شه. 🧹"
        },
        {
          "keywords": [
            "چرا جواب نمیدی",
            "جواب نمیدی",
            "چرا ساکتی"
          ],
          "match": "any",
          "threshold": 1,
          "priority": 22,
          "responses": [
            "شاید پیام با قوانین پاسخ‌گویی یا فاصله ضداسپم هم‌زمان شده؛ یک‌بار کوتاه‌تر بفرست. 🙂",
            "اینجام! گاهی برای جلوگیری از پاسخ تکراری کمی مکث می‌کنم. 🤖"
          ]
        },
        {
          "keywords": [
            "صبح چه خبره",
            "امروز چه خبره",
            "برنامه امروز"
          ],
          "match": "any",
          "threshold": 1,
          "priority": 13,
          "answer": "برای برنامه‌ریزی امروز، سه کار مهم رو انتخاب کن؛ اولویت اول رو قبل از بقیه انجام بده. ☀️"
        },
        {
          "keywords": [
            "آخر هفته",
            "تعطیلات",
            "روز تعطیل"
          ],
          "match": "any",
          "threshold": 1,
          "priority": 16,
          "responses": [
            "یک استراحت واقعی هم توی برنامه بذار؛ قرار نیست همه تعطیلات صرف کار بشه. 🌿",
            "برای تعطیلات ترکیب یک کار دلخواه، کمی حرکت و استراحت عالیه."
          ]
        },
        {
          "keywords": [
            "هدف دارم",
            "هدف گذاری",
            "هدفم چیه"
          ],
          "match": "any",
          "threshold": 1,
          "priority": 20,
          "responses": [
            "هدفت رو قابل‌اندازه‌گیری و زمان‌دار تعریف کن؛ بعد کوچک‌ترین قدم امروز رو مشخص کن. 🎯",
            "یک هدف خوب باید روشن و قابل پیگیری باشه. می‌خوای با هم به قدم‌های هفتگی تقسیمش کنیم؟"
          ]
        },
        {
          "keywords": [
            "شروع از کجا",
            "از کجا شروع کنم",
            "نقطه شروع"
          ],
          "match": "any",
          "threshold": 1,
          "priority": 21,
          "answer": "از کوچک‌ترین قدمی شروع کن که در کمتر از ۱۵ دقیقه قابل انجامه. شروع کوچک از برنامه کاملِ اجرا‌نشده بهتره. 🚀"
        },
        {
          "keywords": [
            "به من اعتماد داری",
            "اعتماد داری",
            "راست میگی"
          ],
          "match": "any",
          "threshold": 1,
          "priority": 15,
          "responses": [
            "من باید دلیل و محدودیت جوابم رو روشن بگم؛ هرجا مطمئن نباشم صریح می‌گم. 🤝",
            "بهتره پاسخ‌های مهم رو با منبع معتبر بررسی کنیم؛ حدس رو جای واقعیت نمی‌ذارم."
          ]
        },
        {
          "keywords": [
            "تو واقعی هستی",
            "آدمی یا ربات",
            "انسانی"
          ],
          "match": "any",
          "threshold": 1,
          "priority": 21,
          "answer": "من یک ربات نرم‌افزاری‌ام؛ احساس و تجربه انسانی ندارم، اما برای گفت‌وگو و کمک متنی طراحی شدم. 🤖"
        },
        {
          "keywords": [
            "خسته نباشی",
            "دستت درد نکنه",
            "عالی بود"
          ],
          "match": "any",
          "threshold": 1,
          "priority": 22,
          "responses": [
            "قربون انرژی خوبت! هر وقت خواستی ادامه می‌دیم. 💙",
            "خوشحالم به کارت اومد؛ بزن بریم مرحله بعد! 🚀"
          ]
        },
        {
          "keywords": [
            "شب زنده داری",
            "هنوز بیداری",
            "بیداری"
          ],
          "match": "any",
          "threshold": 1,
          "priority": 15,
          "answer": "من همیشه آماده پاسخ‌گویی‌ام؛ ولی تو هم حواست به استراحتت باشه! 🌙"
        }
      ],
      "localCache": true
    },
    "jokes": {
      "enabled": true,
      "triggerWords": [
        "جوک",
        "یه جوک بگو",
        "لطیفه",
        "بخندون",
        "یه چیزی بگو بخندیم",
        "خنده"
      ],
      "items": [
        "به کامپیوتر گفتم چرا سردته؟ گفت چون ویندوزم بازه! 🥶",
        "رفتم دکتر گفتم حافظه‌م ضعیف شده؛ گفت از کی؟ گفتم چی از کی؟ 😂",
        "به ساعت گفتم عجله نکن؛ گفت وقت ندارم! ⏰",
        "معلم گفت چرا مشقت رو ننوشتی؟ گفتم خودکارم مرخصی بود! ✍️",
        "به وای‌فای گفتم چرا قهر کردی؟ گفت رابطه‌مون ضعیف شده! 📶",
        "گفتم رژیم گرفتم؛ یخچال گفت من هنوز بهت اعتماد ندارم! 🍰",
        "برنامه‌نویس عاشق شد؛ گفت قلبم باگ داده ولی نمی‌خوام فیکسش کنم! ❤️",
        "به آینه گفتم امروز چطورم؟ گفت من فقط تصویر می‌دم، مشاوره نمی‌دم! 😅",
        "گوشیم گفت حافظه پره؛ گفتم خاطرات خوب رو پاک نکن! 📱",
        "رفیقم گفت خیلی آرومی؛ گفتم دارم باطری ذخیره می‌کنم! 🔋",
        "رفتم به کامپیوتر گفتم یه چیزی بگو؛ گفت بذار اول بوت شم! 😂",
        "برنامه‌نویس چرا دروغ نمی‌گه؟ چون هرچی باشه توی لاگ می‌مونه! 🧾",
        "به مودم گفتم چرا چشمک می‌زنی؟ گفت دارم باهات ارتباط چشمی می‌گیرم! 📡",
        "گفتم امروز خیلی کار دارم؛ تقویم گفت من که از اول می‌دونستم! 📅",
        "به یخچال گفتم چرا ساکتی؟ گفت دارم سرد برخورد می‌کنم! 🧊",
        "گفتم حافظه‌ام پر شده؛ گفت خاطره‌هات رو فشرده‌سازی کن! 🤣",
        "رفتم باشگاه، مربی گفت از امروز با وزنه کار می‌کنی؛ گفتم نه، با حقوق کار می‌کنم! 💸",
        "به ساعت هوشمندم گفتم استرس دارم؛ گفت ضربانت با من هماهنگه! ⌚",
        "گفتم می‌خوام زود بخوابم؛ مغزم گفت بیا اول همه اتفاقات ده سال پیش رو مرور کنیم! 🫠",
        "گوشی رو گذاشتم روی حالت پرواز؛ هنوز قبض اینترنت اومد! ✈️",
        "به هوش مصنوعی گفتم یه راز بگو؛ گفت اول سیاست حریم خصوصی رو بخون! 🤖",
        "گفتم امروز هیچ کاری نکردم؛ ساعت گفت پس چرا این‌قدر خسته‌ای؟ 😅",
        "به قهوه گفتم تلخی؛ گفت زندگی من همینه! ☕",
        "از پله برقی پرسیدم کجا میری؟ گفت دارم پیشرفت می‌کنم! 🛗",
        "به باتری گفتم چرا کم آوردی؟ گفت منم ظرفیت محدودی دارم! 🔋",
        "گفتم می‌خوام پول جمع کنم؛ کیف پولم خندید! 😂",
        "معلم گفت آینده‌ات رو چطور می‌بینی؟ گفتم با تقویم! 📆",
        "به سطل زباله گفتم روزت چطور بود؟ گفت پر از تجربه بود! 🗑️",
        "گفتم از فردا ورزش می‌کنم؛ فردا گفت منو وارد این ماجرا نکن! 🏃",
        "برنامه‌نویس به دوستش گفت من عاشقتم؛ دوستش گفت این باگ نیست؟ ❤️",
        "به برنامه‌نویس گفتم چرا دیر اومدی؟ گفت داشتم باگ‌های مسیر رو دیباگ می‌کردم! 🐞",
        "به تقویم گفتم وقت داری؟ گفت روزهام شماره‌گذاری شده، ولی وقت آزاد نه! 📆",
        "گوشی گفت حافظه‌ام پر شده؛ گفتم پس چرا هنوز خاطرات بد رو نگه داشتی؟ 😂",
        "به ربات گفتم یه جوک بگو؛ گفت اول مطمئن شو حس شوخ‌طبعی‌ات آپدیت شده! 🤖",
        "از پشتیبانی پرسیدم مشکل از کجاست؟ گفت از اونجایی که کار می‌کرده و دیگه نمی‌کنه! 🛠️",
        "گفتم امروز زود می‌خوابم؛ ساعت گفت این وعده رو هر شب می‌دی! 🌙",
        "به کد گفتم چرا اجرا نمی‌شی؟ گفت با این همه کامنت انتظار داری کار کنم؟ 💻",
        "مودم گفت من با همه ارتباط می‌گیرم جز وقتی که واقعاً لازمم داری! 📡",
        "گفتم پولم کجا رفت؟ کیف پول گفت منم دنبالشم! 💸",
        "به هوش مصنوعی گفتم خلاق باش؛ گفت اول محدودیت‌های حافظه رو قبول کن! 😅",
        "رفتم باشگاه ذهنی؛ مربی گفت اول افکار اضافی رو از ست خارج کن! 🧠",
        "از فردا تصمیم گرفتم منظم شم؛ فردا گفت لطفاً منو وسط نکش! 😂"
      ]
    },
    "chatter": {
      "enabled": true,
      "intervalMinutes": 60,
      "jitterMinutes": 12,
      "quietHours": {
        "enabled": true,
        "start": "00:30",
        "end": "08:00",
        "timezone": "Asia/Tehran"
      },
      "maxDailyPerGroup": 12,
      "items": [
        "یه نفر یه موضوع باحال بندازه وسط، گروه از سکوت دربیاد 😄",
        "سؤال مهم امشب: چای یا قهوه؟ ☕",
        "هرکی یه آهنگ خوب معرفی کنه؛ پلی‌لیست گروه بسازیم 🎧",
        "من اومدم فقط یادآوری کنم که آب بخورین 💧",
        "وضعیت انرژی گروه چطوره؟ از یک تا ده امتیاز بدین!",
        "یه حقیقت جالب بگین که کمتر کسی می‌دونه 🧠",
        "امروز چه چیزی حتی کوچیک، خوشحالتون کرد؟ 🌱",
        "سکوت بیش از حد مشکوکه... یکی یه چیزی بگه 😂",
        "چالش: بدون فکر کردن اولین کلمه‌ای که به ذهنتون میاد رو بفرستین!",
        "من دارم لاگ سکوت گروه رو ثبت می‌کنم... حجمش خطرناکه! 🤖",
        "اگه قرار بود همین الان سفر برید، کجا رو انتخاب می‌کردید؟ ✈️",
        "یک فیلم خوب معرفی کنید که ارزش دیدن داشته باشه 🎬",
        "امروز یک چیز کوچیک یاد گرفتید که قبلاً نمی‌دونستید؟ 📚",
        "به نظرتون بهترین اختراع بشر چی بوده؟ 💡",
        "هرکی یک ایموجی برای حال الانش بفرسته! 😎",
        "یک خاطره بامزه از مدرسه یا دانشگاه تعریف کنید! 😂",
        "اگه یک مهارت رو فوری یاد می‌گرفتید، چی انتخاب می‌کردید؟ 🧩",
        "سؤال فلسفی: پیتزا با آناناس یا بدون آناناس؟ 🍕",
        "یک اپلیکیشن کاربردی معرفی کنید که همه باید بشناسن 📱",
        "این هفته به چه چیزی افتخار می‌کنید؟ 🌟",
        "یک هدف کوچیک برای فردا انتخاب کنید و بنویسید 🎯",
        "اگر گروه یک اسم جدید داشت، چی می‌ذاشتید؟ 😁",
        "امروز چند لیوان آب خوردید؟ گزارش سلامت گروه! 💧",
        "یک آهنگ برای حال‌وهوای امشب پیشنهاد بدید 🎶",
        "بهترین خوراکی برای آخر شب چیه؟ 🍪",
        "اگر یک روز اینترنت نبود، اولین کاری که می‌کردید چی بود؟ 🌐",
        "یک جمله انگیزشی کوتاه از خودتون بگید 💪",
        "امتیاز امروزتون از ۱۰ چنده؟ بدون تقلب! 😄",
        "یک واقعیت عجیب ولی واقعی تعریف کنید 🧠",
        "بازی: آخرین حرف اسم‌تون، اول اسم یک شهر! 🗺️",
        "چالش سریع: هر نفر با سه ایموجی حال امروز خودش رو توصیف کنه! 😎",
        "اگه امروز فقط یک کار رو می‌تونستین کامل کنین، اون کار چی بود؟ 🎯",
        "یک ابزار یا سایت مفید معرفی کنین که وقتتون رو ذخیره کرده باشه. 🔧",
        "موضوع آزاد امشب: تکنولوژی زندگی رو ساده‌تر کرده یا پیچیده‌تر؟ 💭",
        "هرکی یک نکته کوچک برای تمرکز بهتر بلده با گروه شریک بشه. 🧠",
        "بازی حدس کلمه: یک نفر سه سرنخ بده، بقیه حدس بزنن! 🧩",
        "اگه می‌تونستین یک قانون جدید برای اینترنت بذارین، چی بود؟ 🌐",
        "امروز یک اتفاق خوب هرچند کوچیک داشتین؟ تعریف کنین. 🌱",
        "پیشنهاد موسیقی برای تمرکز یا استراحت دارین؟ 🎧",
        "بهترین میان‌وعده برای شب‌های طولانی چیه؟ 🍪",
        "یک مهارت کاربردی که یاد گرفتنش رو عقب انداختین چیه؟ 📚",
        "موضوع امروز: سرعت مهم‌تره یا کیفیت؟ مثال هم بزنین. ⚖️"
      ]
    },
    "welcome": {
      "enabled": true,
      "text": "👋 سلام {name}، به {chat} خوش اومدی! قوانین رو بخون و خوش بگذرون. 💙"
    },
    "antiSpam": {
      "enabled": true,
      "windowSeconds": 10,
      "maxMessages": 7,
      "duplicateLimit": 3,
      "muteMinutes": 10,
      "deleteFloodMessages": true,
      "ignoreAdmins": true,
      "trackMedia": true,
      "maxTrackedUsers": 1200,
      "escalation": [
        {
          "strikes": 1,
          "muteMinutes": 5
        },
        {
          "strikes": 2,
          "muteMinutes": 15
        },
        {
          "strikes": 3,
          "muteMinutes": 60
        }
      ],
      "exemptIds": [],
      "signals": {
        "duplicateText": true,
        "mediaFlood": true,
        "burstRate": true,
        "perGroupIsolation": true,
        "linkFlood": true,
        "mentionFlood": true,
        "commandFlood": true,
        "chatFlood": true,
        "joinLeaveBurst": true
      },
      "duplicateWindowSeconds": 60,
      "chatWindowSeconds": 5,
      "chatMaxMessages": 35,
      "linkWindowSeconds": 10,
      "maxLinksPerMessage": 4,
      "mentionWindowSeconds": 10,
      "maxMentionsPerMessage": 8,
      "commandWindowSeconds": 10,
      "maxCommandsPerWindow": 5,
      "reportCooldownSeconds": 300,
      "raid": {
        "windowSeconds": 60,
        "maxJoins": 10,
        "escalationJoins": 20,
        "maxLeaves": 10,
        "escalationLeaves": 20
      }
    },
    "moderation": {
      "enabled": true,
      "deleteLinks": false,
      "blockedWords": [],
      "protectedIds": [],
      "replyActions": [
        {
          "action": "ban",
          "label": "بن",
          "terms": [
            "بن",
            "ریم",
            "گمشو",
            "سیک",
            "بندازش بیرون",
            "بلاک"
          ],
          "minutes": 0
        },
        {
          "action": "kick",
          "label": "اخراج",
          "terms": [
            "کیک",
            "اخراج",
            "بنداز بیرون",
            "برو بیرون"
          ]
        },
        {
          "action": "mute",
          "label": "سکوت",
          "terms": [
            "میوت",
            "سکوت",
            "خفه",
            "ساکت",
            "خفه شو"
          ],
          "minutes": 60
        },
        {
          "action": "unmute",
          "label": "رفع سکوت",
          "terms": [
            "رفع سکوت",
            "آنمیوت",
            "آنباز",
            "آزاد از سکوت"
          ]
        },
        {
          "action": "unban",
          "label": "رفع بن",
          "terms": [
            "آنبن",
            "رفع بن",
            "آزاد کن"
          ]
        },
        {
          "action": "delete",
          "label": "حذف پیام",
          "terms": [
            "حذف",
            "پاک کن",
            "پاکش کن"
          ]
        },
        {
          "action": "pin",
          "label": "پین پیام",
          "terms": [
            "پین",
            "سنجاق",
            "سنجاق کن"
          ]
        },
        {
          "action": "warn",
          "label": "اخطار",
          "terms": [
            "اخطار",
            "وارن",
            "هشدار"
          ]
        }
      ],
      "warningThreshold": 3,
      "warningMuteMinutes": 30,
      "commands": [
        {
          "command": "/ban",
          "action": "ban",
          "label": "بن دائم",
          "enabled": true
        },
        {
          "command": "/kick",
          "action": "kick",
          "label": "اخراج",
          "enabled": true
        },
        {
          "command": "/mute",
          "action": "mute",
          "label": "سکوت",
          "minutes": 60,
          "enabled": true
        },
        {
          "command": "/unmute",
          "action": "unmute",
          "label": "رفع سکوت",
          "enabled": true
        },
        {
          "command": "/unban",
          "action": "unban",
          "label": "رفع بن",
          "enabled": true
        },
        {
          "command": "/del",
          "action": "delete",
          "label": "حذف پیام",
          "enabled": true
        },
        {
          "command": "/delete",
          "action": "delete",
          "label": "حذف پیام",
          "enabled": true
        },
        {
          "command": "/pin",
          "action": "pin",
          "label": "پین پیام",
          "enabled": true
        },
        {
          "command": "/warn",
          "action": "warn",
          "label": "اخطار",
          "enabled": true
        }
      ]
    },
    "controls": [
      {
        "feature": "chatter",
        "value": true,
        "terms": [
          "شتل روشن",
          "حرف بزن",
          "فعال شو"
        ],
        "textKey": "controls.updated"
      },
      {
        "feature": "chatter",
        "value": false,
        "terms": [
          "شتل خاموش",
          "ساکت باش"
        ],
        "textKey": "controls.updated"
      },
      {
        "feature": "jokes",
        "value": true,
        "terms": [
          "جوک روشن"
        ],
        "textKey": "controls.updated"
      },
      {
        "feature": "jokes",
        "value": false,
        "terms": [
          "جوک خاموش"
        ],
        "textKey": "controls.updated"
      },
      {
        "feature": "chatbot",
        "value": true,
        "terms": [
          "چت روشن"
        ],
        "textKey": "controls.updated"
      },
      {
        "feature": "chatbot",
        "value": false,
        "terms": [
          "چت خاموش"
        ],
        "textKey": "controls.updated"
      },
      {
        "feature": "antiSpam",
        "value": true,
        "terms": [
          "ضد اسپم روشن"
        ],
        "textKey": "controls.updated"
      },
      {
        "feature": "antiSpam",
        "value": false,
        "terms": [
          "ضد اسپم خاموش"
        ],
        "textKey": "controls.updated"
      },
      {
        "feature": "welcome",
        "value": true,
        "terms": [
          "خوشامد روشن"
        ],
        "textKey": "controls.updated"
      },
      {
        "feature": "welcome",
        "value": false,
        "terms": [
          "خوشامد خاموش"
        ],
        "textKey": "controls.updated"
      }
    ],
    "botReplyJokes": {
      "enabled": false,
      "terms": [
        "ریمو کن",
        "بن کن",
        "بنداز بیرون",
        "اخراجت می‌کنم"
      ],
      "responses": [
        "😂 منو نمی‌شه ریم کرد؛ تیرت خطا خورد!",
        "🤖 اول باید از ربات‌فوبیا عبور کنی!",
        "😄 من اینجام که کمک کنم، نه اینکه از گروه برم!"
      ]
    },
    "joinRequests": {
      "enabled": false,
      "autoApprove": false,
      "notify": true,
      "allowlist": [],
      "denylist": []
    },
    "channelModeration": {
      "enabled": false,
      "channelIds": [],
      "blockedWords": [],
      "deleteBlockedPosts": true,
      "notifyOwner": true
    },
    "channelTools": {
      "enabled": false,
      "allowTextPost": true,
      "allowCopyPost": true,
      "defaultParseMode": "HTML",
      "disableLinkPreview": false
    },
    "forwarding": {
      "enabled": true,
      "copyProtectedContent": false,
      "respectRights": true,
      "stopOnNotFound": true,
      "allowChannelTargets": false,
      "allowGroupTargets": true
    },
    "memory": {
      "enabled": true,
      "privateHistory": true,
      "groupHistory": 6,
      "ttlSeconds": 86400,
      "storeRawMessages": false,
      "storeOnlyBotInteractions": true,
      "allowForgetCommand": true,
      "storageMode": "durable-object-ttl"
    },
    "groupSettings": {
      "defaultChatbotEnabled": true,
      "defaultJokesEnabled": true,
      "defaultChatterEnabled": false,
      "operatorCanToggle": true
    },
    "commands": {
      "public": [
        "/start"
      ],
      "owner": [
        "/author",
        "/installDB",
        "/help",
        "/cancel"
      ],
      "helpTextKey": "help",
      "ignoreUnknownCommands": true
    },
    "customCommands": {
      "enabled": true,
      "rules": [
        {
          "command": "/rules",
          "enabled": true,
          "response": "📜 قوانین این گروه را از مدیران دریافت کن و به حقوق سایر اعضا احترام بگذار."
        },
        {
          "command": "/admins",
          "enabled": true,
          "response": "🛡 برای مشاهده مدیران گروه، فهرست مدیران تلگرام را باز کن."
        }
      ]
    },
    "automations": {
      "enabled": true,
      "rules": [
        {
          "id": "greeting-thanks",
          "enabled": true,
          "keywords": [
            "ممنون",
            "مرسی",
            "دمت گرم"
          ],
          "action": "reply",
          "response": "خواهش می‌کنم {user}! 💙",
          "cooldownSeconds": 30,
          "stopProcessing": false
        },
        {
          "id": "greeting-welcome",
          "enabled": true,
          "keywords": [
            "خوش اومدی",
            "خوش آمدی"
          ],
          "action": "reply",
          "response": "به جمع ما خوش اومدی! 🌱",
          "cooldownSeconds": 60,
          "stopProcessing": false
        }
      ]
    },
    "goodbye": {
      "enabled": false,
      "text": "👋 {name} از گروه خارج شد. براش آرزوی موفقیت داریم."
    },
    "captcha": {
      "enabled": false,
      "mode": "button",
      "timeoutSeconds": 180,
      "maxAttempts": 1,
      "deletePromptAfterVerify": false,
      "text": "برای فعال‌شدن امکان ارسال پیام، دکمهٔ زیر را بزن."
    },
    "raidProtection": {
      "enabled": false,
      "windowSeconds": 60,
      "maxJoins": 10,
      "captchaDuringRaid": true,
      "notifyOwner": true,
      "autoSlowMode": false,
      "underAttackMode": "captcha",
      "escalationJoins": 20
    },
    "reports": {
      "enabled": true,
      "command": "/report",
      "maxStored": 100,
      "ownerNotification": true,
      "includeRepliedMessage": true
    },
    "linkGuard": {
      "enabled": true,
      "deleteAllLinks": false,
      "requireAllowlist": false,
      "allowDomains": [],
      "blockedDomains": [
        "tinyurl.com",
        "bit.ly",
        "t.co",
        "rb.gy",
        "cutt.ly"
      ],
      "notice": "⛔ این لینک طبق قوانین امنیتی گروه مجاز نیست."
    },
    "phishingGuard": {
      "enabled": true,
      "blockedDomains": [
        "secure-login-alert.com",
        "telegram-premium-free.com",
        "wallet-verify-now.com"
      ],
      "suspiciousTerms": [
        "رمزتو بفرست",
        "کد ورودتو بده",
        "کیف پولتو متصل کن",
        "سود تضمینی"
      ],
      "notice": "⚠️ پیام مشکوک به فیشینگ حذف شد؛ روی لینک‌های ناشناس کلیک نکن."
    },
    "groupControls": {
      "enabled": true,
      "ownerCanOverride": true,
      "adminStatuses": [
        "creator",
        "administrator"
      ]
    },
    "tagKnownMembers": {
      "enabled": false,
      "cooldownSeconds": 300,
      "batchSize": 8,
      "maxMembers": 80,
      "excludeBots": true,
      "requirePreview": true,
      "allowOptOut": true,
      "description": "فقط کاربران شناخته‌شده از Updateهای واقعی گروه قابل تگ هستند."
    }
  },
  "description": "دیتابیس داده‌محور نسخه ۴.۲.۰؛ تنظیمات، متن‌ها، قواعد NLP، سیاست‌های ضداسپم، مدیریت گروه و ثبت صرفاً رویدادهای عضویت کانال. پیام‌های کانال پردازش نمی‌شوند.",
  "groupSettings": {
    "defaultJokesEnabled": true,
    "defaultChatbotEnabled": true,
    "defaultChatterEnabled": false,
    "operatorCanToggle": false,
    "defaultBotEnabled": true
  }
};
