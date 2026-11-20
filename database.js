// MUNITOS 8.0.0 — application definition.
// This file is data-only JavaScript object syntax. It contains no executable functions.
export default {
  manifest: {
    name: "MUNITOS",
    version: "8.0.0",
    schemaVersion: 1,
    description: "Universal database-driven Telegram runtime",
    locale: "fa",
  },

  settings: {
    language: "fa",
    parseMode: "HTML",
    http: {
      requireHttps: true,
      timeoutMs: 12000,
      maxResponseBytes: 1048576,
      maxRedirects: 3,
      allowInsecureHosts: [],
    },
    execution: {
      maxActionsPerUpdate: 2000,
      maxLoopItems: 250,
      maxWorkflowDepth: 12,
      maxQueueAttempts: 5,
    },
    conversations: {
      defaultTtlSeconds: 600,
    },
  },

  profile: {
    name: "MUNITOS",
    shortDescription: "MUNITOS — Universal Telegram Management Runtime",
    description: "ربات مدیریت هوشمند گروه‌ها و کانال‌ها با موتور قابل توسعه و دیتابیس پویا.",
  },

  telegram: {
    webhook: {
      allowedUpdates: [
        "message",
        "edited_message",
        "channel_post",
        "edited_channel_post",
        "callback_query",
        "my_chat_member",
        "chat_member",
        "chat_join_request",
      ],
      dropPendingUpdates: false,
      maxConnections: 40,
    },
  },

  quotas: {
    period: "month",
    timeZone: "Asia/Baku",
    defaultPlan: "free",
    plans: {
      free: {
        broadcastMonthly: 100,
      },
      pro: {
        broadcastMonthly: 1000,
      },
      unlimited: {
        broadcastMonthly: -1,
      },
    },
  },

  policies: {
    ownerIdSource: "runtime",
    groupAdminStatuses: ["creator", "administrator"],
    ownerCanManageAllChats: true,
    registerObservedChats: true,
  },

  modules: {
    core: { enabled: true, description: "هسته فرمان‌ها و گردش‌کارهای اصلی" },
    group_management: { enabled: true, description: "مدیریت گروه‌ها و اعضا" },
    channel_management: { enabled: true, description: "مدیریت کانال‌ها و ثبت مقصدها" },
    owner_management: { enabled: true, description: "فرمان‌ها و ابزارهای مالک" },
  },

  features: {
    welcome: { enabled: true },
    moderation: { enabled: true },
    broadcast: { enabled: true },
    quota: { enabled: true },
  },

  authorization: {
    defaultRole: "member",
    ownerRole: "owner",
    administratorRole: "admin",
  },

  roles: {
    owner: { permissions: ["*"] },
    admin: { permissions: ["group.manage", "member.moderate"] },
    member: { permissions: ["bot.use"] },
  },

  permissions: {
    "group.manage": { scope: "group" },
    "member.moderate": { scope: "group" },
    "bot.use": { scope: "any" },
  },

  groups: {},
  channels: {},
  messages: {},
  templates: {},
  keyboards: {},
  panels: {},
  automations: {},
  queues: { maxAttempts: 5 },
  resources: {},
  limits: {},
  errorHandling: {},
  logging: { maxEntries: 500 },

  storage: {
    namespaces: ["global", "chat", "user", "chat_user"],
    preserveOperationalStateOnDatabaseInstall: true,
  },

  menus: {
    syncTelegramCommands: true,
    includeInstallCommand: true,
  },

  apis: {},

  commands: {
    start: {
      module: "core",
      triggers: ["/start", "شروع"],
      description: "شروع کار با ربات",
      scope: "any",
      roles: ["any"],
      actions: [
        {
          type: "telegram.call",
          method: "sendMessage",
          payload: {
            chat_id: "{{chat.id}}",
            text: "سلام {{user.first_name}}.\n\nبه MUNITOS خوش آمدی.\nبرای مشاهده فرمان‌ها /help را بزن.",
          },
        },
      ],
    },

    help: {
      module: "core",
      triggers: ["/help", "راهنما", "کمک"],
      description: "نمایش راهنما",
      scope: "any",
      roles: ["any"],
      actions: [
        {
          type: "telegram.call",
          method: "sendMessage",
          payload: {
            chat_id: "{{chat.id}}",
            text: "<b>فرمان‌های MUNITOS</b>\n/start — شروع\n/help — راهنما\n/id — شناسه‌ها\n/setwelcome — تنظیم خوش‌آمد گروه\n/mute — سکوت با ریپلای\n/unmute — لغو سکوت\n/ban — مسدودسازی با ریپلای\n/unban — لغو مسدودسازی\n/quota — مشاهده سهمیه\n\nفرمان‌های مالک: /runtime، /runtime_pause، /runtime_resume، /runtime_logs، /runtime_queue، /runtime_retry، /runtime_cancel، /groups، /broadcast، /plan و /install",
            parse_mode: "HTML",
            reply_to_message_id: "{{message.message_id}}",
          },
        },
      ],
    },

    id: {
      module: "core",
      triggers: ["/id", "شناسه"],
      description: "نمایش شناسه کاربر و گفتگو",
      scope: "any",
      roles: ["any"],
      actions: [
        {
          type: "telegram.call",
          method: "sendMessage",
          payload: {
            chat_id: "{{chat.id}}",
            text: "Chat ID: <code>{{chat.id}}</code>\nUser ID: <code>{{user.id}}</code>",
            parse_mode: "HTML",
            reply_to_message_id: "{{message.message_id}}",
          },
        },
      ],
    },

    setwelcome: {
      module: "group_management",
      feature: "welcome",
      triggers: ["/setwelcome"],
      description: "تنظیم پیام خوش‌آمد گروه",
      scope: "group",
      roles: ["owner", "admin"],
      actions: [
        {
          type: "condition",
          if: { ne: ["{{argsText}}", ""] },
          then: [
            {
              type: "state.set",
              scope: "chat",
              key: "welcome.text",
              value: "{{argsText}}",
            },
            {
              type: "telegram.call",
              method: "sendMessage",
              payload: {
                chat_id: "{{chat.id}}",
                text: "پیام خوش‌آمد این گفتگو ذخیره شد.",
                reply_to_message_id: "{{message.message_id}}",
              },
            },
          ],
          else: [
            {
              type: "telegram.call",
              method: "sendMessage",
              payload: {
                chat_id: "{{chat.id}}",
                text: "استفاده: /setwelcome متن پیام خوش‌آمد",
                reply_to_message_id: "{{message.message_id}}",
              },
            },
          ],
        },
      ],
    },

    mute: {
      module: "group_management",
      feature: "moderation",
      triggers: ["/mute", "سکوت"],
      description: "سکوت کاربر با ریپلای",
      scope: "group",
      roles: ["owner", "admin"],
      actions: [
        {
          type: "condition",
          if: { exists: "reply.from.id" },
          then: [
            {
              type: "telegram.call",
              method: "restrictChatMember",
              payload: {
                chat_id: "{{chat.id}}",
                user_id: "{{reply.from.id}}",
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
                use_independent_chat_permissions: true,
              },
            },
            {
              type: "telegram.call",
              method: "sendMessage",
              payload: {
                chat_id: "{{chat.id}}",
                text: "کاربر <code>{{reply.from.id}}</code> سکوت شد.",
                parse_mode: "HTML",
              },
            },
          ],
          else: [
            {
              type: "telegram.call",
              method: "sendMessage",
              payload: { chat_id: "{{chat.id}}", text: "برای سکوت، روی پیام کاربر ریپلای کن و /mute را بزن." },
            },
          ],
        },
      ],
    },

    unmute: {
      module: "group_management",
      feature: "moderation",
      triggers: ["/unmute", "رفع_سکوت"],
      description: "لغو سکوت کاربر با ریپلای",
      scope: "group",
      roles: ["owner", "admin"],
      actions: [
        {
          type: "condition",
          if: { exists: "reply.from.id" },
          then: [
            {
              type: "telegram.call",
              method: "restrictChatMember",
              payload: {
                chat_id: "{{chat.id}}",
                user_id: "{{reply.from.id}}",
                permissions: {
                  can_send_messages: true,
                  can_send_audios: true,
                  can_send_documents: true,
                  can_send_photos: true,
                  can_send_videos: true,
                  can_send_video_notes: true,
                  can_send_voice_notes: true,
                  can_send_polls: true,
                  can_send_other_messages: true,
                  can_add_web_page_previews: true,
                },
                use_independent_chat_permissions: true,
              },
            },
            {
              type: "telegram.call",
              method: "sendMessage",
              payload: { chat_id: "{{chat.id}}", text: "سکوت کاربر برداشته شد." },
            },
          ],
          else: [
            {
              type: "telegram.call",
              method: "sendMessage",
              payload: { chat_id: "{{chat.id}}", text: "برای لغو سکوت، روی پیام کاربر ریپلای کن و /unmute را بزن." },
            },
          ],
        },
      ],
    },

    ban: {
      module: "group_management",
      feature: "moderation",
      triggers: ["/ban", "بن"],
      description: "مسدودسازی کاربر با ریپلای",
      scope: "group",
      roles: ["owner", "admin"],
      actions: [
        {
          type: "condition",
          if: { exists: "reply.from.id" },
          then: [
            { type: "telegram.call", method: "banChatMember", payload: { chat_id: "{{chat.id}}", user_id: "{{reply.from.id}}" } },
            { type: "telegram.call", method: "sendMessage", payload: { chat_id: "{{chat.id}}", text: "کاربر مسدود شد." } },
          ],
          else: [
            { type: "telegram.call", method: "sendMessage", payload: { chat_id: "{{chat.id}}", text: "برای بن، روی پیام کاربر ریپلای کن و /ban را بزن." } },
          ],
        },
      ],
    },

    unban: {
      module: "group_management",
      feature: "moderation",
      triggers: ["/unban", "رفع_بن"],
      description: "لغو مسدودسازی کاربر با ریپلای",
      scope: "group",
      roles: ["owner", "admin"],
      actions: [
        {
          type: "condition",
          if: { exists: "reply.from.id" },
          then: [
            { type: "telegram.call", method: "unbanChatMember", payload: { chat_id: "{{chat.id}}", user_id: "{{reply.from.id}}", only_if_banned: true } },
            { type: "telegram.call", method: "sendMessage", payload: { chat_id: "{{chat.id}}", text: "مسدودیت کاربر لغو شد." } },
          ],
          else: [
            { type: "telegram.call", method: "sendMessage", payload: { chat_id: "{{chat.id}}", text: "برای رفع بن، روی پیام کاربر ریپلای کن و /unban را بزن." } },
          ],
        },
      ],
    },

    quota: {
      module: "core",
      feature: "quota",
      triggers: ["/quota", "سهمیه"],
      description: "مشاهده سهمیه ماهانه ارسال",
      scope: "any",
      roles: ["any"],
      actions: [
        {
          type: "quota.get",
          quota: "broadcast",
          chatId: "{{chat.id}}",
          as: "quotaInfo",
        },
        {
          type: "telegram.call",
          method: "sendMessage",
          payload: {
            chat_id: "{{chat.id}}",
            text: "سهمیه ماهانه این گفتگو\nمصرف‌شده: {{quotaInfo.used}}\nسقف: {{quotaInfo.limit}}\nباقی‌مانده: {{quotaInfo.remaining}}\nپلن: {{quotaInfo.plan}}",
            reply_to_message_id: "{{message.message_id}}",
          },
        },
      ],
    },

    runtime: {
      module: "owner_management",
      triggers: ["/runtime"],
      description: "وضعیت موتور MUNITOS",
      scope: "private",
      roles: ["owner"],
      actions: [
        { type: "runtime.status", as: "status" },
        {
          type: "telegram.call",
          method: "sendMessage",
          payload: {
            chat_id: "{{chat.id}}",
            text: "<b>MUNITOS Runtime</b>\nVersion: <code>{{status.runtimeVersion}}</code>\nDatabase: <code>{{status.databaseVersion}}</code>\nPaused: {{status.paused}}\nCommands: {{status.commands}}\nWorkflows: {{status.workflows}}\nAPIs: {{status.apis}}\nEvents: {{status.events}}\nQueued jobs: {{status.queuedJobs}}\nRegistered chats: {{status.registeredChats}}",
            parse_mode: "HTML",
          },
        },
      ],
    },

    runtime_pause: {
      module: "owner_management",
      triggers: ["/runtime_pause"],
      description: "توقف صف و زمان‌بندی‌های پس‌زمینه",
      scope: "private",
      roles: ["owner"],
      actions: [
        { type: "runtime.control", operation: "pause", reason: "{{argsText}}", as: "control" },
        { type: "telegram.call", method: "sendMessage", payload: { chat_id: "{{chat.id}}", text: "صف و زمان‌بندی‌های پس‌زمینه متوقف شدند. پردازش پیام‌ها و فرمان‌های ورودی ادامه دارد. برای ادامه صف /runtime_resume را بفرست." } },
      ],
    },

    runtime_resume: {
      module: "owner_management",
      triggers: ["/runtime_resume"],
      description: "ادامه پردازش ربات",
      scope: "private",
      roles: ["owner"],
      actions: [
        { type: "runtime.control", operation: "resume", as: "control" },
        { type: "telegram.call", method: "sendMessage", payload: { chat_id: "{{chat.id}}", text: "پردازش MUNITOS دوباره فعال شد." } },
      ],
    },

    runtime_logs: {
      module: "owner_management",
      triggers: ["/runtime_logs"],
      description: "مشاهده گزارش‌های اخیر Runtime",
      scope: "private",
      roles: ["owner"],
      actions: [
        { type: "runtime.logs", limit: 10, as: "logs" },
        { type: "telegram.call", method: "sendMessage", payload: { chat_id: "{{chat.id}}", text: "گزارش‌های اخیر:\n{{logs}}" } },
      ],
    },

    runtime_queue: {
      module: "owner_management",
      triggers: ["/runtime_queue"],
      description: "وضعیت صف پردازش",
      scope: "private",
      roles: ["owner"],
      actions: [
        { type: "queue.stats", as: "queueStats" },
        { type: "queue.list", status: "failed", limit: 5, as: "failedJobs" },
        {
          type: "telegram.call",
          method: "sendMessage",
          payload: {
            chat_id: "{{chat.id}}",
            text: "صف MUNITOS\nدر انتظار: {{queueStats.pending}}\nناموفق: {{queueStats.failed}}\nدر حال اجرا: {{queueStats.running}}\n\nآخرین Jobهای ناموفق:\n{{failedJobs}}",
          },
        },
      ],
    },

    runtime_retry: {
      module: "owner_management",
      triggers: ["/runtime_retry"],
      description: "تلاش دوباره برای Job ناموفق",
      scope: "private",
      roles: ["owner"],
      actions: [
        { type: "queue.retry", id: "{{args.0}}", as: "retryResult" },
        { type: "telegram.call", method: "sendMessage", payload: { chat_id: "{{chat.id}}", text: "نتیجه تلاش مجدد: {{retryResult.retried}}" } },
      ],
    },

    runtime_cancel: {
      module: "owner_management",
      triggers: ["/runtime_cancel"],
      description: "لغو Job در صف",
      scope: "private",
      roles: ["owner"],
      actions: [
        { type: "queue.cancel", id: "{{args.0}}", as: "cancelResult" },
        { type: "telegram.call", method: "sendMessage", payload: { chat_id: "{{chat.id}}", text: "نتیجه لغو: {{cancelResult.cancelled}}" } },
      ],
    },

    groups: {
      module: "owner_management",
      triggers: ["/groups"],
      description: "فهرست گروه‌ها و کانال‌های ثبت‌شده",
      scope: "private",
      roles: ["owner"],
      actions: [
        { type: "state.list", scope: "global", prefix: "registry:chat:", limit: 8, as: "registry" },
        {
          type: "telegram.call",
          method: "sendMessage",
          payload: {
            chat_id: "{{chat.id}}",
            text: "گروه‌ها و کانال‌های ثبت‌شده\n{{registry.items}}",
          },
        },
      ],
    },

    plan: {
      module: "owner_management",
      triggers: ["/plan"],
      description: "تغییر پلن یک گروه یا کانال",
      scope: "private",
      roles: ["owner"],
      actions: [
        {
          type: "condition",
          if: { and: [{ exists: "args.0" }, { exists: "args.1" }] },
          then: [
            { type: "state.set", scope: "global", key: "plan:{{args.0}}", value: "{{args.1}}" },
            { type: "telegram.call", method: "sendMessage", payload: { chat_id: "{{chat.id}}", text: "پلن مقصد {{args.0}} روی {{args.1}} تنظیم شد." } },
          ],
          else: [
            { type: "telegram.call", method: "sendMessage", payload: { chat_id: "{{chat.id}}", text: "استفاده: /plan CHAT_ID free|pro|unlimited" } },
          ],
        },
      ],
    },

    broadcast: {
      module: "owner_management",
      feature: "broadcast",
      triggers: ["/broadcast"],
      description: "ارسال پیام همگانی به مقصدهای ثبت‌شده",
      scope: "private",
      roles: ["owner"],
      actions: [
        {
          type: "conversation.start",
          workflow: "broadcast.collect",
          ttlSeconds: 600,
          input: { initiatedAt: "{{runtime.iso}}" },
        },
        {
          type: "telegram.call",
          method: "sendMessage",
          payload: { chat_id: "{{chat.id}}", text: "پیام همگانی را در پیام بعدی ارسال کن. برای لغو /cancel را بفرست." },
        },
      ],
    },

    cancel: {
      module: "owner_management",
      triggers: ["/cancel", "لغو"],
      description: "لغو عملیات در حال انجام",
      scope: "private",
      roles: ["owner"],
      actions: [
        { type: "conversation.end" },
        { type: "telegram.call", method: "sendMessage", payload: { chat_id: "{{chat.id}}", text: "عملیات لغو شد." } },
      ],
    },
  },

  workflows: {
    "broadcast.collect": {
      actions: [
        {
          type: "condition",
          if: { not: { exists: "message.message_id" } },
          then: [
            { type: "telegram.call", method: "sendMessage", payload: { chat_id: "{{chat.id}}", text: "پیام قابل ارسال نیست. دوباره یک پیام بفرست." } },
            { type: "flow.return", value: false },
          ],
        },
        { type: "state.list", scope: "global", prefix: "registry:chat:", limit: 500, as: "targets" },
        {
          type: "each",
          items: "{{targets.items}}",
          as: "target",
          limit: 250,
          actions: [
            {
              type: "condition",
              if: { eq: ["{{target.value.active}}", true] },
              then: [
                { type: "quota.consume", quota: "broadcast", chatId: "{{target.value.id}}", as: "quotaResult" },
                {
                  type: "condition",
                  if: { eq: ["{{quotaResult.allowed}}", true] },
                  then: [
                    {
                      type: "queue.enqueue",
                      workflow: "broadcast.deliver",
                      input: {
                        chatId: "{{target.value.id}}",
                        fromChatId: "{{chat.id}}",
                        messageId: "{{message.message_id}}",
                        sourceUserId: "{{user.id}}",
                        targetTitle: "{{target.value.title}}",
                      },
                      maxAttempts: 4,
                    },
                  ],
                },
              ],
            },
          ],
        },
        { type: "conversation.end" },
        {
          type: "telegram.call",
          method: "sendMessage",
          payload: {
            chat_id: "{{chat.id}}",
            text: "پیام در صف ارسال قرار گرفت. مقصدهای دارای سهمیه فعال پردازش می‌شوند.",
          },
        },
      ],
    },

    "broadcast.deliver": {
      actions: [
        {
          type: "telegram.call",
          method: "copyMessage",
          payload: {
            chat_id: "{{job.input.chatId}}",
            from_chat_id: "{{job.input.fromChatId}}",
            message_id: "{{job.input.messageId}}",
          },
        },
      ],
    },

    "system.reconcile": {
      actions: [
        {
          type: "telegram.call",
          method: "getMe",
          payload: {},
          as: "botInfo",
        },
        {
          type: "state.set",
          scope: "global",
          key: "bot:username",
          value: "{{botInfo.username}}",
        },
        {
          type: "telegram.call",
          method: "setMyName",
          payload: { name: "{{runtime.profile.name}}" },
        },
        {
          type: "telegram.call",
          method: "setMyDescription",
          payload: { description: "{{runtime.profile.description}}" },
        },
        {
          type: "telegram.call",
          method: "setMyShortDescription",
          payload: { short_description: "{{runtime.profile.shortDescription}}" },
        },
        {
          type: "condition",
          if: "{{runtime.syncTelegramCommands}}",
          then: [
            {
              type: "telegram.call",
              method: "setMyCommands",
              payload: { commands: "{{runtime.commandMenu}}" },
            },
            {
              type: "telegram.call",
              method: "setMyCommands",
              payload: {
                commands: "{{runtime.ownerCommandMenu}}",
                scope: { type: "chat", chat_id: "{{owner.id}}" },
              },
            },
          ],
        },
        {
          type: "telegram.call",
          method: "setWebhook",
          payload: {
            url: "{{runtime.webhookUrl}}",
            secret_token: "{{runtime.webhookSecret}}",
            allowed_updates: "{{runtime.allowedUpdates}}",
            drop_pending_updates: "{{runtime.dropPendingUpdates}}",
            max_connections: "{{runtime.maxWebhookConnections}}",
          },
        },
      ],
    },
  },

  events: [
    {
      id: "registry.group.message",
      module: "group_management",
      policy: "registerObservedChats",
      on: "message",
      match: { chatTypes: ["group", "supergroup"], fromBot: false },
      actions: [
        {
          type: "state.set",
          scope: "global",
          key: "registry:chat:{{chat.id}}",
          value: {
            id: "{{chat.id}}",
            title: "{{chat.title}}",
            username: "{{chat.username}}",
            type: "{{chat.type}}",
            active: true,
            updatedAt: "{{runtime.iso}}",
          },
        },
      ],
    },
    {
      id: "registry.channel.post",
      module: "channel_management",
      policy: "registerObservedChats",
      on: "channel_post",
      match: { chatTypes: ["channel"] },
      actions: [
        {
          type: "state.set",
          scope: "global",
          key: "registry:chat:{{chat.id}}",
          value: {
            id: "{{chat.id}}",
            title: "{{chat.title}}",
            username: "{{chat.username}}",
            type: "{{chat.type}}",
            active: true,
            updatedAt: "{{runtime.iso}}",
          },
        },
      ],
    },
    {
      id: "registry.bot.joined",
      module: "group_management",
      policy: "registerObservedChats",
      on: "my_chat_member",
      match: { chatTypes: ["group", "supergroup", "channel"], chatMemberStatus: ["member", "administrator"] },
      actions: [
        {
          type: "state.set",
          scope: "global",
          key: "registry:chat:{{chat.id}}",
          value: {
            id: "{{chat.id}}",
            title: "{{chat.title}}",
            username: "{{chat.username}}",
            type: "{{chat.type}}",
            active: true,
            botStatus: "{{myChatMember.new_chat_member.status}}",
            updatedAt: "{{runtime.iso}}",
          },
        },
        {
          type: "try",
          actions: [
            {
              type: "telegram.call",
              method: "sendMessage",
              payload: {
                chat_id: "{{chat.id}}",
                text: "MUNITOS فعال شد. برای راهنما /help را ارسال کن.",
              },
            },
          ],
          catch: [
            { type: "log.write", entry: { level: "warn", code: "group.welcome_unavailable", detail: "{{chat.id}}" } },
          ],
        },
      ],
    },
    {
      id: "registry.bot.left",
      module: "group_management",
      policy: "registerObservedChats",
      on: "my_chat_member",
      match: { chatTypes: ["group", "supergroup", "channel"], chatMemberStatus: ["left", "kicked"] },
      actions: [
        {
          type: "state.set",
          scope: "global",
          key: "registry:chat:{{chat.id}}",
          value: {
            id: "{{chat.id}}",
            title: "{{chat.title}}",
            username: "{{chat.username}}",
            type: "{{chat.type}}",
            active: false,
            botStatus: "{{myChatMember.new_chat_member.status}}",
            updatedAt: "{{runtime.iso}}",
          },
        },
      ],
    },
    {
      id: "welcome.new.members",
      module: "group_management",
      feature: "welcome",
      on: "new_chat_members",
      match: { chatTypes: ["group", "supergroup"] },
      actions: [
        {
          type: "state.get",
          scope: "chat",
          key: "welcome.text",
          default: "خوش آمدی {{message.new_chat_members.0.first_name}} به {{chat.title}}",
          as: "welcomeText",
        },
        {
          type: "telegram.call",
          method: "sendMessage",
          payload: {
            chat_id: "{{chat.id}}",
            text: "{{welcomeText}}",
          },
        },
      ],
    },
    {
      id: "welcome.goodbye",
      module: "group_management",
      feature: "welcome",
      on: "left_chat_member",
      match: { chatTypes: ["group", "supergroup"] },
      actions: [
        {
          type: "telegram.call",
          method: "sendMessage",
          payload: {
            chat_id: "{{chat.id}}",
            text: "{{message.left_chat_member.first_name}} از گروه خارج شد.",
          },
        },
      ],
    },
  ],

  callbacks: [
    {
      id: "callbacks.answer",
      module: "core",
      on: "callback_query",
      match: { callbackPrefix: "notice:" },
      actions: [
        {
          type: "telegram.call",
          method: "answerCallbackQuery",
          payload: {
            callback_query_id: "{{callback.id}}",
            text: "{{callback.data}}",
            show_alert: false,
          },
        },
      ],
    },
  ],

  schedules: [
    {
      id: "system.reconcile.telegram",
      cron: "0 */6 * * *",
      workflow: "system.reconcile",
      enabled: true,
    },
  ],

  lifecycle: {
    onBootstrap: [
      { type: "workflow.run", workflow: "system.reconcile", input: {} },
    ],
    onInstall: [
      { type: "workflow.run", workflow: "system.reconcile", input: {} },
    ],
  },


  migrations: {
    workflowAliases: {},
  },

  integrations: {
    telegram: {
      enabled: true,
      genericMethodGateway: true,
    },
    http: {
      enabled: true,
      genericRequestGateway: true,
    },
  },
};
