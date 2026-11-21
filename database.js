export default {
  "manifest": {
    "name": "MUNITOS",
    "version": "8.0.5",
    "schemaVersion": 1,
    "description": "MUNITOS 8.0.5 — legacy command parity, polished button interface, force-join and granular group permissions",
    "locale": "fa"
  },
  "settings": {
    "language": "fa",
    "parseMode": "HTML",
    "http": {
      "requireHttps": true,
      "timeoutMs": 12000,
      "maxResponseBytes": 1048576,
      "maxRedirects": 3,
      "allowInsecureHosts": []
    },
    "execution": {
      "maxActionsPerUpdate": 2000,
      "maxLoopItems": 500,
      "maxWorkflowDepth": 12,
      "maxQueueAttempts": 5
    },
    "conversations": {
      "defaultTtlSeconds": 600
    }
  },
  "profile": {
    "name": "MUNITOS",
    "shortDescription": "MUNITOS | Group & Channel Administration",
    "description": "MUNITOS؛ مدیریت گروه و کانال، عضویت اجباری، پیام‌های سفارشی و مدیریت سطح دسترسی مدیران."
  },
  "telegram": {
    "webhook": {
      "allowedUpdates": [
        "message",
        "edited_message",
        "channel_post",
        "edited_channel_post",
        "callback_query",
        "my_chat_member",
        "chat_member",
        "chat_join_request"
      ],
      "dropPendingUpdates": false,
      "maxConnections": 40
    }
  },
  "quotas": {
    "period": "month",
    "timeZone": "UTC",
    "defaultPlan": "free",
    "plans": {
      "free": {
        "broadcastMonthly": 1000
      },
      "test": {
        "broadcastMonthly": 2000
      },
      "pro": {
        "broadcastMonthly": 5000
      },
      "vip": {
        "broadcastMonthly": 10000
      },
      "super": {
        "broadcastMonthly": -1
      }
    }
  },
  "policies": {
    "ownerIdSource": "embedded-worker",
    "groupAdminStatuses": [
      "creator",
      "administrator"
    ],
    "ownerCanManageAllChats": false,
    "registerObservedChats": true,
    "discovery": {
      "useChatSharedPicker": true,
      "verifyBotMembership": true,
      "verifySendPermissions": true,
      "detectLinkedChats": true,
      "linkedChatDepth": 1,
      "maximumRegistryScan": 2000,
      "ownerOnlyManualDiscovery": true,
      "maxAutoRepairPerRun": 2000,
      "maxBroadcastPerRun": 2000
    }
  },
  "modules": {
    "core": {
      "enabled": true,
      "description": "هسته فرمان‌ها و گردش‌کارهای اصلی"
    },
    "group_management": {
      "enabled": true,
      "description": "پنل گروه، سطح دسترسی مدیران، خوش‌آمد، خداحافظی، عضویت اجباری و مدیریت اعضا"
    },
    "channel_management": {
      "enabled": true,
      "description": "مدیریت کانال‌ها و ثبت مقصدها"
    },
    "owner_management": {
      "enabled": true,
      "description": "پنل مالک، گروه‌ها، کانال‌ها، صف و ارسال همگانی"
    }
  },
  "features": {
    "welcome": {
      "enabled": true
    },
    "moderation": {
      "enabled": true
    },
    "broadcast": {
      "enabled": true
    },
    "quota": {
      "enabled": true
    },
    "goodbye": {
      "enabled": true,
      "description": "پیام خداحافظی قابل تنظیم برای خروج اعضا"
    },
    "owner_panel": {
      "enabled": true,
      "description": "پنل مدیریت خصوصی مالک"
    },
    "interactive_help": {
      "enabled": true,
      "description": "راهنمای چندصفحه‌ای و دکمه‌ای"
    },
    "chatbot": {
      "enabled": false,
      "description": "غیرفعال؛ در نسخه 5.4.17 نیز خاموش بود."
    },
    "jokes": {
      "enabled": false
    },
    "chatter": {
      "enabled": false
    },
    "customCommands": {
      "enabled": false
    },
    "automations": {
      "enabled": false
    },
    "memory": {
      "enabled": false
    },
    "botReplyJokes": {
      "enabled": false
    },
    "captcha": {
      "enabled": false
    },
    "joinRequests": {
      "enabled": false
    },
    "reports": {
      "enabled": false
    },
    "antiSpam": {
      "enabled": false
    },
    "linkGuard": {
      "enabled": false
    },
    "phishingGuard": {
      "enabled": false
    },
    "raidProtection": {
      "enabled": false
    },
    "forwarding": {
      "enabled": false
    },
    "groupControls": {
      "enabled": false
    },
    "tagKnownMembers": {
      "enabled": false
    },
    "force_join_group": {
      "enabled": true,
      "description": "عضویت اجباری مستقل برای هر گروه"
    },
    "force_join_private": {
      "enabled": true,
      "description": "عضویت اجباری برای کاربران خصوصی ربات"
    },
    "install_notice": {
      "enabled": true,
      "description": "پیام نصب قابل تنظیم برای اولین ورود ربات به گروه"
    }
  },
  "authorization": {
    "defaultRole": "member",
    "ownerRole": "owner",
    "administratorRole": "admin"
  },
  "roles": {
    "owner": {
      "permissions": [
        "*"
      ]
    },
    "admin": {
      "permissions": [
        "group.manage",
        "member.moderate"
      ]
    },
    "member": {
      "permissions": [
        "bot.use"
      ]
    }
  },
  "permissions": {
    "group.manage": {
      "scope": "group"
    },
    "member.moderate": {
      "scope": "group"
    },
    "bot.use": {
      "scope": "any"
    }
  },
  "groups": {},
  "channels": {},
  "messages": {},
  "templates": {},
  "keyboards": {},
  "panels": {},
  "automations": {},
  "queues": {
    "maxAttempts": 5
  },
  "resources": {},
  "limits": {},
  "errorHandling": {},
  "logging": {
    "maxEntries": 500
  },
  "storage": {
    "namespaces": [
      "global",
      "chat",
      "user",
      "chat_user"
    ],
    "preserveOperationalStateOnDatabaseInstall": true
  },
  "menus": {
    "syncTelegramCommands": true,
    "includeInstallCommand": true,
    "commandSets": {
      "private": [
        {
          "command": "start",
          "description": "منوی شخصی MUNITOS"
        },
        {
          "command": "help",
          "description": "راهنمای امکانات شخصی"
        },
        {
          "command": "id",
          "description": "شناسه عددی شما"
        },
        {
          "command": "quota",
          "description": "سهمیه شما"
        },
        {
          "command": "cancel",
          "description": "لغو عملیات جاری"
        }
      ],
      "groupMember": [
        {
          "command": "start",
          "description": "منوی عمومی گروه"
        },
        {
          "command": "help",
          "description": "راهنمای اعضای گروه"
        },
        {
          "command": "id",
          "description": "شناسه عددی"
        },
        {
          "command": "info",
          "description": "اطلاعات کاربر با ریپلای"
        },
        {
          "command": "cancel",
          "description": "لغو عملیات جاری"
        }
      ],
      "groupAdmin": [
        {
          "command": "group",
          "description": "پنل تنظیمات همین گروه"
        },
        {
          "command": "mute",
          "description": "سکوت کاربر با ریپلای"
        },
        {
          "command": "unmute",
          "description": "رفع سکوت کاربر"
        },
        {
          "command": "ban",
          "description": "مسدودسازی کاربر با ریپلای"
        },
        {
          "command": "unban",
          "description": "رفع مسدودی کاربر"
        },
        {
          "command": "silentlist",
          "description": "فهرست کاربران سکوت‌شده"
        },
        {
          "command": "cleansilentlist",
          "description": "پاک‌سازی فهرست سکوت"
        },
        {
          "command": "banlist",
          "description": "فهرست کاربران مسدود"
        },
        {
          "command": "cleanbanlist",
          "description": "پاک‌سازی فهرست بن"
        },
        {
          "command": "setwelcome",
          "description": "تنظیم پیام خوش‌آمد"
        },
        {
          "command": "setwelcomemedia",
          "description": "تنظیم رسانه خوش‌آمد"
        },
        {
          "command": "setwelcometime",
          "description": "تنظیم تأخیر خوش‌آمد"
        },
        {
          "command": "getwelcome",
          "description": "مشاهده پیام خوش‌آمد"
        },
        {
          "command": "resetwelcome",
          "description": "بازنشانی خوش‌آمد"
        },
        {
          "command": "setgoodbye",
          "description": "تنظیم پیام خداحافظی"
        },
        {
          "command": "setgoodbyemedia",
          "description": "تنظیم رسانه خداحافظی"
        },
        {
          "command": "getgoodbye",
          "description": "مشاهده پیام خداحافظی"
        },
        {
          "command": "resetgoodbye",
          "description": "بازنشانی خداحافظی"
        },
        {
          "command": "setinstallmsg",
          "description": "تنظیم پیام ورود ربات"
        },
        {
          "command": "getinstallmsg",
          "description": "مشاهده پیام ورود ربات"
        },
        {
          "command": "resetinstallmsg",
          "description": "بازنشانی پیام ورود ربات"
        },
        {
          "command": "forcejoin",
          "description": "تنظیم عضویت اجباری گروه"
        },
        {
          "command": "forcejoin_on",
          "description": "فعال‌سازی عضویت اجباری"
        },
        {
          "command": "forcejoin_off",
          "description": "غیرفعال‌سازی عضویت اجباری"
        },
        {
          "command": "forcejoin_clear",
          "description": "پاک‌سازی فهرست عضویت اجباری"
        },
        {
          "command": "help",
          "description": "راهنمای مدیران گروه"
        },
        {
          "command": "cancel",
          "description": "لغو عملیات جاری"
        },
        {
          "command": "welcomeon",
          "description": "روشن‌کردن خوش‌آمدگویی همین گروه"
        },
        {
          "command": "welcomeoff",
          "description": "خاموش‌کردن خوش‌آمدگویی همین گروه"
        },
        {
          "command": "goodbye_on",
          "description": "روشن‌کردن پیام خداحافظی همین گروه"
        },
        {
          "command": "goodbye_off",
          "description": "خاموش‌کردن پیام خداحافظی همین گروه"
        }
      ],
      "owner": [
        {
          "command": "install",
          "description": "نصب یا به‌روزرسانی database.js"
        },
        {
          "command": "admin",
          "description": "پنل مرکزی مالک"
        },
        {
          "command": "forcejoin_pm",
          "description": "تنظیم عضویت اجباری کاربران خصوصی"
        },
        {
          "command": "forcejoin_pm_off",
          "description": "خاموش‌کردن عضویت اجباری خصوصی"
        },
        {
          "command": "forcejoin_pm_clear",
          "description": "پاک‌کردن فهرست عضویت خصوصی"
        },
        {
          "command": "broadcast",
          "description": "پیام همگانی"
        },
        {
          "command": "groups",
          "description": "فهرست گروه‌ها"
        },
        {
          "command": "channels",
          "description": "فهرست کانال‌ها"
        },
        {
          "command": "repair",
          "description": "ترمیم خودکار"
        },
        {
          "command": "runtime",
          "description": "وضعیت Runtime"
        },
        {
          "command": "runtime_logs",
          "description": "گزارش‌های Runtime"
        },
        {
          "command": "runtime_queue",
          "description": "وضعیت صف"
        },
        {
          "command": "runtime_pause",
          "description": "توقف صف پس‌زمینه"
        },
        {
          "command": "runtime_resume",
          "description": "ادامه صف پس‌زمینه"
        }
      ]
    }
  },
  "apis": {},
  "commands": {
    "start": {
      "module": "core",
      "triggers": [
        "/start",
        "شروع"
      ],
      "description": "نمایش منوی اصلی MUNITOS",
      "scope": "any",
      "roles": [
        "any"
      ],
      "actions": [
        {
          "type": "workflow.run",
          "workflow": "forcejoin.check",
          "input": {}
        },
        {
          "type": "workflow.run",
          "workflow": "ui.render.start",
          "input": {}
        }
      ],
      "title": "🏠 منوی اصلی"
    },
    "help": {
      "module": "core",
      "triggers": [
        "/help",
        "راهنما",
        "کمک",
        "Help"
      ],
      "description": "راهنمای تعاملی و دکمه‌ای امکانات",
      "scope": "any",
      "roles": [
        "any"
      ],
      "actions": [
        {
          "type": "workflow.run",
          "workflow": "forcejoin.check",
          "input": {}
        },
        {
          "type": "workflow.run",
          "workflow": "ui.render.help",
          "input": {}
        }
      ],
      "title": "📚 راهنمای امکانات"
    },
    "id": {
      "module": "core",
      "scope": "any",
      "roles": [
        "any"
      ],
      "title": "🪪 شناسه عددی",
      "triggers": [
        "/id",
        "شناسه"
      ],
      "description": "نمایش شناسه کاربر و گفتگو",
      "actions": [
        {
          "type": "workflow.run",
          "workflow": "forcejoin.check",
          "input": {}
        },
        {
          "type": "telegram.call",
          "method": "sendMessage",
          "payload": {
            "chat_id": "{{chat.id}}",
            "text": {
              "$expr": {
                "op": "concat",
                "args": [
                  "<b>شناسه کاربر:</b> <code>",
                  "{{user.id}}",
                  "</code>\n<b>شناسه گفتگو:</b> <code>",
                  "{{chat.id}}",
                  "</code>"
                ]
              }
            },
            "parse_mode": "HTML",
            "link_preview_options": {
              "is_disabled": true
            }
          }
        }
      ]
    },
    "setwelcome": {
      "module": "group_management",
      "scope": "group",
      "roles": [
        "admin"
      ],
      "feature": "welcome",
      "title": "✏️ تنظیم خوش‌آمد",
      "description": "سه روش تنظیم: متن را بعد از دستور بنویسید؛ به پیام/رسانه ریپلای کنید؛ یا دستور را خالی بفرستید و محتوای بعدی را ارسال کنید.",
      "triggers": [
        "/setwelcome",
        "تنظیم خوشامد",
        "تنظیم خوش‌آمد",
        "SetWelcome"
      ],
      "actions": [
        {
          "type": "workflow.run",
          "workflow": "forcejoin.check",
          "input": {}
        },
        {
          "type": "workflow.run",
          "workflow": "guard.group.admin",
          "input": {}
        },
        {
          "type": "context.set",
          "path": "templateKind",
          "value": "welcome"
        },
        {
          "type": "workflow.run",
          "workflow": "template.set",
          "input": {}
        }
      ]
    },
    "mute": {
      "module": "group_management",
      "feature": "moderation",
      "title": "🔇 سکوت کاربر",
      "section": "moderation",
      "description": "🔇 سکوت کاربر",
      "scope": "group",
      "roles": [
        "admin"
      ],
      "permissions": [
        "member.moderate"
      ],
      "triggers": [
        "/mute",
        "/silent",
        "سکوت",
        "Silent"
      ],
      "usage": "ریپلای به پیام کاربر و ارسال /mute",
      "actions": [
        {
          "type": "workflow.run",
          "workflow": "forcejoin.check",
          "input": {}
        },
        {
          "type": "workflow.run",
          "workflow": "registry.observe",
          "input": {}
        },
        {
          "type": "workflow.run",
          "workflow": "guard.group.restrict",
          "input": {}
        },
        {
          "type": "workflow.run",
          "workflow": "moderation.resolve.target",
          "input": {}
        },
        {
          "type": "telegram.call",
          "method": "restrictChatMember",
          "payload": {
            "chat_id": "{{chat.id}}",
            "user_id": "{{targetId}}",
            "permissions": {
              "can_send_messages": false,
              "can_send_audios": false,
              "can_send_documents": false,
              "can_send_photos": false,
              "can_send_videos": false,
              "can_send_video_notes": false,
              "can_send_voice_notes": false,
              "can_send_polls": false,
              "can_send_other_messages": false,
              "can_add_web_page_previews": false
            },
            "use_independent_chat_permissions": true
          }
        },
        {
          "type": "state.set",
          "scope": "global",
          "key": "moderation:{{chat.id}}:silent:{{targetId}}",
          "value": {
            "userId": "{{targetId}}",
            "actorId": "{{user.id}}",
            "timestamp": "{{runtime.iso}}"
          }
        },
        {
          "type": "telegram.call",
          "method": "sendMessage",
          "payload": {
            "chat_id": "{{chat.id}}",
            "text": "<b>کاربر سکوت شد.</b>\nشناسه: <code>{{targetId}}</code>",
            "parse_mode": "HTML",
            "link_preview_options": {
              "is_disabled": true
            }
          }
        }
      ]
    },
    "unmute": {
      "module": "group_management",
      "feature": "moderation",
      "title": "🔊 رفع سکوت",
      "section": "moderation",
      "description": "🔊 رفع سکوت",
      "scope": "group",
      "roles": [
        "admin"
      ],
      "permissions": [
        "member.moderate"
      ],
      "triggers": [
        "/unmute",
        "/unsilent",
        "رفع سکوت",
        "حذف سکوت",
        "UnSilent"
      ],
      "usage": "ریپلای به پیام کاربر و ارسال /unmute",
      "actions": [
        {
          "type": "workflow.run",
          "workflow": "forcejoin.check",
          "input": {}
        },
        {
          "type": "workflow.run",
          "workflow": "registry.observe",
          "input": {}
        },
        {
          "type": "workflow.run",
          "workflow": "guard.group.restrict",
          "input": {}
        },
        {
          "type": "workflow.run",
          "workflow": "moderation.resolve.target",
          "input": {}
        },
        {
          "type": "telegram.call",
          "method": "restrictChatMember",
          "payload": {
            "chat_id": "{{chat.id}}",
            "user_id": "{{targetId}}",
            "permissions": {
              "can_send_messages": true,
              "can_send_audios": true,
              "can_send_documents": true,
              "can_send_photos": true,
              "can_send_videos": true,
              "can_send_video_notes": true,
              "can_send_voice_notes": true,
              "can_send_polls": true,
              "can_send_other_messages": true,
              "can_add_web_page_previews": true
            },
            "use_independent_chat_permissions": true
          }
        },
        {
          "type": "state.delete",
          "scope": "global",
          "key": "moderation:{{chat.id}}:silent:{{targetId}}"
        },
        {
          "type": "telegram.call",
          "method": "sendMessage",
          "payload": {
            "chat_id": "{{chat.id}}",
            "text": "<b>محدودیت ارسال پیام برداشته شد.</b>",
            "parse_mode": "HTML",
            "link_preview_options": {
              "is_disabled": true
            }
          }
        }
      ]
    },
    "ban": {
      "module": "group_management",
      "feature": "moderation",
      "title": "⛔ مسدودسازی کاربر",
      "section": "ban",
      "description": "⛔ مسدودسازی کاربر",
      "scope": "group",
      "roles": [
        "admin"
      ],
      "permissions": [
        "member.moderate"
      ],
      "triggers": [
        "/ban",
        "بن",
        "Ban"
      ],
      "usage": "ریپلای به پیام کاربر و ارسال /ban",
      "actions": [
        {
          "type": "workflow.run",
          "workflow": "forcejoin.check",
          "input": {}
        },
        {
          "type": "workflow.run",
          "workflow": "registry.observe",
          "input": {}
        },
        {
          "type": "workflow.run",
          "workflow": "guard.group.restrict",
          "input": {}
        },
        {
          "type": "workflow.run",
          "workflow": "moderation.resolve.target",
          "input": {}
        },
        {
          "type": "telegram.call",
          "method": "banChatMember",
          "payload": {
            "chat_id": "{{chat.id}}",
            "user_id": "{{targetId}}"
          }
        },
        {
          "type": "state.set",
          "scope": "global",
          "key": "moderation:{{chat.id}}:banned:{{targetId}}",
          "value": {
            "userId": "{{targetId}}",
            "actorId": "{{user.id}}",
            "timestamp": "{{runtime.iso}}"
          }
        },
        {
          "type": "telegram.call",
          "method": "sendMessage",
          "payload": {
            "chat_id": "{{chat.id}}",
            "text": "<b>کاربر از گروه مسدود شد.</b>\nشناسه: <code>{{targetId}}</code>",
            "parse_mode": "HTML",
            "link_preview_options": {
              "is_disabled": true
            }
          }
        }
      ]
    },
    "unban": {
      "module": "group_management",
      "feature": "moderation",
      "title": "✅ رفع مسدودی کاربر",
      "section": "ban",
      "description": "✅ رفع مسدودی کاربر",
      "scope": "group",
      "roles": [
        "admin"
      ],
      "permissions": [
        "member.moderate"
      ],
      "triggers": [
        "/unban",
        "حذف بن",
        "رفع بن",
        "UnBan"
      ],
      "usage": "ریپلای به پیام کاربر و ارسال /unban",
      "actions": [
        {
          "type": "workflow.run",
          "workflow": "forcejoin.check",
          "input": {}
        },
        {
          "type": "workflow.run",
          "workflow": "registry.observe",
          "input": {}
        },
        {
          "type": "workflow.run",
          "workflow": "guard.group.restrict",
          "input": {}
        },
        {
          "type": "workflow.run",
          "workflow": "moderation.resolve.target",
          "input": {}
        },
        {
          "type": "telegram.call",
          "method": "unbanChatMember",
          "payload": {
            "chat_id": "{{chat.id}}",
            "user_id": "{{targetId}}",
            "only_if_banned": true
          }
        },
        {
          "type": "state.delete",
          "scope": "global",
          "key": "moderation:{{chat.id}}:banned:{{targetId}}"
        },
        {
          "type": "telegram.call",
          "method": "sendMessage",
          "payload": {
            "chat_id": "{{chat.id}}",
            "text": "<b>مسدودیت کاربر لغو شد.</b>",
            "parse_mode": "HTML",
            "link_preview_options": {
              "is_disabled": true
            }
          }
        }
      ]
    },
    "quota": {
      "module": "core",
      "feature": "quota",
      "triggers": [
        "/quota",
        "سهمیه"
      ],
      "description": "مشاهده سهمیه ماهانه ارسال",
      "scope": "any",
      "roles": [
        "any"
      ],
      "actions": [
        {
          "type": "workflow.run",
          "workflow": "forcejoin.check",
          "input": {}
        },
        {
          "type": "quota.get",
          "scope": "user",
          "quota": "broadcastMonthly",
          "as": "quotaInfo"
        },
        {
          "type": "telegram.call",
          "method": "sendMessage",
          "payload": {
            "chat_id": "{{chat.id}}",
            "text": "<b>سهمیه حساب</b>\nجزئیات مصرف در پنل سهمیه نمایش داده می‌شود.",
            "parse_mode": "HTML",
            "link_preview_options": {
              "is_disabled": true
            }
          }
        }
      ],
      "title": "📊 سهمیه ماهانه",
      "section": "quota",
      "usage": "/quota"
    },
    "runtime": {
      "module": "owner_management",
      "triggers": [
        "/runtime"
      ],
      "description": "وضعیت موتور MUNITOS",
      "scope": "private",
      "roles": [
        "owner"
      ],
      "actions": [
        {
          "type": "runtime.status",
          "as": "status"
        },
        {
          "type": "telegram.call",
          "method": "sendMessage",
          "payload": {
            "chat_id": "{{chat.id}}",
            "text": "<b>◈ MUNITOS RUNTIME</b>\n━━━━━━━━━━━━━━━━━━\nنسخه موتور: <code>{{status.runtimeVersion}}</code>\nنسخه دیتابیس: <code>{{status.databaseVersion}}</code>\nوضعیت توقف: {{status.paused}}\nفرمان‌ها: {{status.commands}}\nWorkflowها: {{status.workflows}}\nAPIها: {{status.apis}}\nرویدادها: {{status.events}}\nصف در انتظار: {{status.queuedJobs}}\nمقصدهای ثبت‌شده: {{status.registeredChats}}",
            "parse_mode": "HTML",
            "link_preview_options": {
              "is_disabled": true
            },
            "reply_markup": {
              "inline_keyboard": [
                [
                  {
                    "text": "⚙️ پنل مدیریت",
                    "callback_data": "ui:owner:home",
                    "style": "primary"
                  },
                  {
                    "text": "🧾 وضعیت صف",
                    "callback_data": "ui:owner:queue",
                    "style": "primary"
                  }
                ],
                [
                  {
                    "text": "📜 گزارش‌ها",
                    "callback_data": "ui:owner:logs",
                    "style": "primary"
                  },
                  {
                    "text": "🏠 خانه",
                    "callback_data": "ui:home",
                    "style": "primary"
                  }
                ]
              ]
            }
          }
        }
      ],
      "title": "📊 وضعیت Runtime",
      "section": "runtime",
      "usage": "/runtime"
    },
    "runtime_pause": {
      "module": "owner_management",
      "triggers": [
        "/runtime_pause"
      ],
      "description": "توقف صف و زمان‌بندی‌های پس‌زمینه",
      "scope": "private",
      "roles": [
        "owner"
      ],
      "actions": [
        {
          "type": "runtime.control",
          "operation": "pause",
          "reason": "{{argsText}}",
          "as": "control"
        },
        {
          "type": "telegram.call",
          "method": "sendMessage",
          "payload": {
            "chat_id": "{{chat.id}}",
            "text": "صف و زمان‌بندی‌های پس‌زمینه متوقف شدند. پردازش پیام‌ها و فرمان‌های ورودی ادامه دارد. برای ادامه صف /runtime_resume را بفرست."
          }
        }
      ],
      "title": "⏸ توقف صف پس‌زمینه",
      "section": "runtime",
      "usage": "/runtime_pause"
    },
    "runtime_resume": {
      "module": "owner_management",
      "triggers": [
        "/runtime_resume"
      ],
      "description": "ادامه پردازش ربات",
      "scope": "private",
      "roles": [
        "owner"
      ],
      "actions": [
        {
          "type": "runtime.control",
          "operation": "resume",
          "as": "control"
        },
        {
          "type": "telegram.call",
          "method": "sendMessage",
          "payload": {
            "chat_id": "{{chat.id}}",
            "text": "پردازش MUNITOS دوباره فعال شد."
          }
        }
      ],
      "title": "▶️ ادامه صف پس‌زمینه",
      "section": "runtime",
      "usage": "/runtime_resume"
    },
    "runtime_logs": {
      "module": "owner_management",
      "triggers": [
        "/runtime_logs"
      ],
      "description": "مشاهده گزارش‌های اخیر Runtime",
      "scope": "private",
      "roles": [
        "owner"
      ],
      "actions": [
        {
          "type": "runtime.logs",
          "limit": 12,
          "as": "logs"
        },
        {
          "type": "telegram.call",
          "method": "sendMessage",
          "payload": {
            "chat_id": "{{chat.id}}",
            "text": "<b>گزارش‌های اخیر MUNITOS</b>\n━━━━━━━━━━━━━━━━━━\n<code>{{logs}}</code>",
            "parse_mode": "HTML",
            "link_preview_options": {
              "is_disabled": true
            },
            "reply_markup": {
              "inline_keyboard": [
                [
                  {
                    "text": "⬅️ پنل مدیریت",
                    "callback_data": "ui:owner:home",
                    "style": "primary"
                  }
                ]
              ]
            }
          }
        }
      ],
      "title": "📜 گزارش‌های Runtime",
      "section": "runtime",
      "usage": "/runtime_logs"
    },
    "runtime_queue": {
      "module": "owner_management",
      "triggers": [
        "/runtime_queue"
      ],
      "description": "وضعیت صف پردازش",
      "scope": "private",
      "roles": [
        "owner"
      ],
      "actions": [
        {
          "type": "queue.stats",
          "as": "queueStats"
        },
        {
          "type": "telegram.call",
          "method": "sendMessage",
          "payload": {
            "chat_id": "{{chat.id}}",
            "text": "<b>صف پردازش MUNITOS</b>\n━━━━━━━━━━━━━━━━━━\nدر انتظار: <b>{{queueStats.pending}}</b>\nدر حال اجرا: <b>{{queueStats.running}}</b>\nناموفق: <b>{{queueStats.failed}}</b>",
            "parse_mode": "HTML",
            "link_preview_options": {
              "is_disabled": true
            },
            "reply_markup": {
              "inline_keyboard": [
                [
                  {
                    "text": "🔄 تازه‌سازی",
                    "callback_data": "ui:owner:queue",
                    "style": "primary"
                  },
                  {
                    "text": "⬅️ پنل مدیریت",
                    "callback_data": "ui:owner:home",
                    "style": "primary"
                  }
                ]
              ]
            }
          }
        }
      ],
      "title": "🧾 وضعیت صف",
      "section": "runtime",
      "usage": "/runtime_queue"
    },
    "runtime_retry": {
      "module": "owner_management",
      "triggers": [
        "/runtime_retry"
      ],
      "description": "تلاش دوباره برای Job ناموفق",
      "scope": "private",
      "roles": [
        "owner"
      ],
      "actions": [
        {
          "type": "queue.retry",
          "id": "{{args.0}}",
          "as": "retryResult"
        },
        {
          "type": "telegram.call",
          "method": "sendMessage",
          "payload": {
            "chat_id": "{{chat.id}}",
            "text": "نتیجه تلاش مجدد: {{retryResult.retried}}"
          }
        }
      ]
    },
    "runtime_cancel": {
      "module": "owner_management",
      "triggers": [
        "/runtime_cancel"
      ],
      "description": "لغو Job در صف",
      "scope": "private",
      "roles": [
        "owner"
      ],
      "actions": [
        {
          "type": "queue.cancel",
          "id": "{{args.0}}",
          "as": "cancelResult"
        },
        {
          "type": "telegram.call",
          "method": "sendMessage",
          "payload": {
            "chat_id": "{{chat.id}}",
            "text": "نتیجه لغو: {{cancelResult.cancelled}}"
          }
        }
      ]
    },
    "groups": {
      "module": "owner_management",
      "triggers": [
        "/groups",
        "گروه‌ها"
      ],
      "description": "فهرست گروه‌های ثبت‌شده با دکمه جزئیات",
      "scope": "private",
      "roles": [
        "owner"
      ],
      "title": "👥 فهرست گروه‌ها",
      "actions": [
        {
          "type": "context.set",
          "path": "kind",
          "value": "groups"
        },
        {
          "type": "workflow.run",
          "workflow": "owner.targets.list"
        }
      ]
    },
    "plan": {
      "module": "owner_management",
      "triggers": [
        "/plan"
      ],
      "description": "تنظیم پلن سهمیه برای یک مقصد",
      "scope": "private",
      "roles": [
        "owner"
      ],
      "actions": [
        {
          "type": "condition",
          "if": {
            "and": [
              {
                "exists": "args.0"
              },
              {
                "exists": "args.1"
              }
            ]
          },
          "then": [
            {
              "type": "state.set",
              "scope": "global",
              "key": "plan:{{args.0}}",
              "value": "{{args.1}}"
            },
            {
              "type": "telegram.call",
              "method": "sendMessage",
              "payload": {
                "chat_id": "{{chat.id}}",
                "text": "پلن مقصد <code>{{args.0}}</code> روی <b>{{args.1}}</b> تنظیم شد.",
                "parse_mode": "HTML",
                "link_preview_options": {
                  "is_disabled": true
                }
              }
            }
          ],
          "else": [
            {
              "type": "telegram.call",
              "method": "sendMessage",
              "payload": {
                "chat_id": "{{chat.id}}",
                "text": "استفاده: <code>/plan CHAT_ID free|pro|unlimited</code>",
                "parse_mode": "HTML",
                "link_preview_options": {
                  "is_disabled": true
                }
              }
            }
          ]
        }
      ],
      "title": "🎚 تنظیم پلن مقصد",
      "section": "owner",
      "usage": "/plan CHAT_ID free|pro|unlimited"
    },
    "broadcast": {
      "module": "owner_management",
      "feature": "broadcast",
      "triggers": [
        "/broadcast"
      ],
      "description": "ارسال پیام همگانی به مقصدهای ثبت‌شده",
      "scope": "private",
      "roles": [
        "owner"
      ],
      "actions": [
        {
          "type": "conversation.start",
          "workflow": "broadcast.collect",
          "ttlSeconds": 600,
          "input": {
            "initiatedAt": "{{runtime.iso}}"
          }
        },
        {
          "type": "telegram.call",
          "method": "sendMessage",
          "payload": {
            "chat_id": "{{chat.id}}",
            "text": "📢 پیام یا رسانه موردنظر را بفرست. قبل از شروع ارسال، پیش‌نمایش و دکمه تأیید نمایش داده می‌شود.\nبرای لغو /cancel را بفرست."
          }
        }
      ],
      "title": "📢 پیام همگانی",
      "section": "owner",
      "usage": "/broadcast"
    },
    "cancel": {
      "module": "core",
      "scope": "any",
      "roles": [
        "any"
      ],
      "title": "لغو عملیات جاری",
      "description": "لغو دریافت پیام یا تنظیم در حال انجام",
      "triggers": [
        "/cancel",
        "لغو"
      ],
      "actions": [
        {
          "type": "conversation.end"
        },
        {
          "type": "telegram.call",
          "method": "sendMessage",
          "payload": {
            "chat_id": "{{chat.id}}",
            "text": "<b>عملیات جاری لغو شد.</b>",
            "parse_mode": "HTML"
          }
        }
      ]
    },
    "admin": {
      "module": "owner_management",
      "title": "⚙️ پنل مدیریت",
      "description": "بازکردن پنل خصوصی مالک",
      "triggers": [
        "/admin",
        "/settings"
      ],
      "scope": "private",
      "roles": [
        "owner"
      ],
      "actions": [
        {
          "type": "telegram.call",
          "method": "sendMessage",
          "payload": {
            "chat_id": "{{chat.id}}",
            "text": "{{runtime.app.ui.owner.home.text}}",
            "parse_mode": "HTML",
            "link_preview_options": {
              "is_disabled": true
            },
            "reply_markup": {
              "inline_keyboard": {
                "$expr": {
                  "op": "get",
                  "path": "runtime.app.ui.owner.home.keyboard"
                }
              }
            }
          }
        }
      ]
    },
    "channels": {
      "module": "owner_management",
      "title": "📣 فهرست کانال‌ها",
      "description": "فهرست کانال‌های ثبت‌شده با دکمه جزئیات",
      "triggers": [
        "/channels",
        "کانال‌ها"
      ],
      "scope": "private",
      "roles": [
        "owner"
      ],
      "actions": [
        {
          "type": "context.set",
          "path": "kind",
          "value": "channels"
        },
        {
          "type": "workflow.run",
          "workflow": "owner.targets.list"
        }
      ]
    },
    "getwelcome": {
      "module": "group_management",
      "scope": "group",
      "roles": [
        "admin"
      ],
      "feature": "welcome",
      "title": "👁 مشاهده خوش‌آمد",
      "triggers": [
        "/getwelcome",
        "دریافت خوشامد",
        "دریافت خوش‌آمد",
        "GetWelcome"
      ],
      "actions": [
        {
          "type": "workflow.run",
          "workflow": "forcejoin.check",
          "input": {}
        },
        {
          "type": "workflow.run",
          "workflow": "guard.group.admin",
          "input": {}
        },
        {
          "type": "state.get",
          "scope": "chat",
          "key": "welcome.text",
          "default": "<b>سلام !mention عزیز!</b>\nبه گروه <b>!groupname</b> خوش اومدی !emoji\n\nامیدواریم کنارمون لحظات خوبی داشته باشی.",
          "as": "savedText"
        },
        {
          "type": "state.get",
          "scope": "chat",
          "key": "welcome.source",
          "default": null,
          "as": "savedSource"
        },
        {
          "type": "state.get",
          "scope": "chat",
          "key": "welcome.delaySeconds",
          "default": 0,
          "as": "savedDelay"
        },
        {
          "type": "telegram.call",
          "method": "sendMessage",
          "payload": {
            "chat_id": "{{chat.id}}",
            "text": {
              "$expr": {
                "op": "concat",
                "args": [
                  "<b>تنظیم خوش‌آمد</b>\nتأخیر: <code>",
                  "{{savedDelay}}",
                  "</code> ثانیه\nحالت محتوا: <code>",
                  {
                    "$expr": {
                      "op": "get",
                      "args": [
                        "{{savedSource.message_id}}"
                      ]
                    }
                  },
                  "</code>\n\n<b>متن:</b>\n",
                  "{{savedText}}"
                ]
              }
            },
            "parse_mode": "HTML",
            "link_preview_options": {
              "is_disabled": true
            }
          }
        }
      ]
    },
    "resetwelcome": {
      "module": "group_management",
      "scope": "group",
      "roles": [
        "admin"
      ],
      "feature": "welcome",
      "title": "♻️ بازنشانی خوش‌آمد",
      "triggers": [
        "/resetwelcome",
        "ریست خوشامد",
        "ریست خوش‌آمد",
        "ReSetWelcome"
      ],
      "actions": [
        {
          "type": "workflow.run",
          "workflow": "forcejoin.check",
          "input": {}
        },
        {
          "type": "workflow.run",
          "workflow": "guard.group.admin",
          "input": {}
        },
        {
          "type": "state.delete",
          "scope": "chat",
          "key": "welcome.text"
        },
        {
          "type": "state.delete",
          "scope": "chat",
          "key": "welcome.source"
        },
        {
          "type": "state.delete",
          "scope": "chat",
          "key": "welcome.delaySeconds"
        },
        {
          "type": "telegram.call",
          "method": "sendMessage",
          "payload": {
            "chat_id": "{{chat.id}}",
            "text": "<b>تنظیم خوش‌آمد به حالت پیش‌فرض بازگشت.</b>",
            "parse_mode": "HTML",
            "link_preview_options": {
              "is_disabled": true
            }
          }
        }
      ]
    },
    "welcome_on": {
      "module": "group_management",
      "scope": "group",
      "roles": [
        "admin"
      ],
      "feature": "welcome",
      "title": "🟢 روشن خوش‌آمد",
      "triggers": [
        "/welcome_on",
        "/welcomeon",
        "خوشامد روشن",
        "خوش‌آمد روشن",
        "Welcome on"
      ],
      "actions": [
        {
          "type": "workflow.run",
          "workflow": "forcejoin.check",
          "input": {}
        },
        {
          "type": "workflow.run",
          "workflow": "guard.group.admin",
          "input": {}
        },
        {
          "type": "state.set",
          "scope": "chat",
          "key": "welcome.enabled",
          "value": true
        },
        {
          "type": "telegram.call",
          "method": "sendMessage",
          "payload": {
            "chat_id": "{{chat.id}}",
            "text": "<b>خوش‌آمدگویی فعال شد.</b>",
            "parse_mode": "HTML",
            "link_preview_options": {
              "is_disabled": true
            }
          }
        }
      ]
    },
    "welcome_off": {
      "module": "group_management",
      "scope": "group",
      "roles": [
        "admin"
      ],
      "feature": "welcome",
      "title": "🔴 خاموش خوش‌آمد",
      "triggers": [
        "/welcome_off",
        "/welcomeoff",
        "خوشامد خاموش",
        "خوش‌آمد خاموش",
        "Welcome off"
      ],
      "actions": [
        {
          "type": "workflow.run",
          "workflow": "forcejoin.check",
          "input": {}
        },
        {
          "type": "workflow.run",
          "workflow": "guard.group.admin",
          "input": {}
        },
        {
          "type": "state.set",
          "scope": "chat",
          "key": "welcome.enabled",
          "value": false
        },
        {
          "type": "telegram.call",
          "method": "sendMessage",
          "payload": {
            "chat_id": "{{chat.id}}",
            "text": "<b>خوش‌آمدگویی غیرفعال شد.</b>",
            "parse_mode": "HTML",
            "link_preview_options": {
              "is_disabled": true
            }
          }
        }
      ]
    },
    "setgoodbye": {
      "module": "group_management",
      "scope": "group",
      "roles": [
        "admin"
      ],
      "feature": "goodbye",
      "title": "✏️ تنظیم خداحافظی",
      "description": "سه روش تنظیم: متن را بعد از دستور بنویسید؛ به پیام/رسانه ریپلای کنید؛ یا دستور را خالی بفرستید و محتوای بعدی را ارسال کنید.",
      "triggers": [
        "/setgoodbye",
        "تنظیم خداحافظی",
        "SetGoodbye"
      ],
      "actions": [
        {
          "type": "workflow.run",
          "workflow": "forcejoin.check",
          "input": {}
        },
        {
          "type": "workflow.run",
          "workflow": "guard.group.admin",
          "input": {}
        },
        {
          "type": "context.set",
          "path": "templateKind",
          "value": "goodbye"
        },
        {
          "type": "workflow.run",
          "workflow": "template.set",
          "input": {}
        }
      ]
    },
    "getgoodbye": {
      "module": "group_management",
      "scope": "group",
      "roles": [
        "admin"
      ],
      "feature": "goodbye",
      "title": "👁 مشاهده خداحافظی",
      "triggers": [
        "/getgoodbye",
        "دریافت خداحافظی",
        "GetGoodbye"
      ],
      "actions": [
        {
          "type": "workflow.run",
          "workflow": "forcejoin.check",
          "input": {}
        },
        {
          "type": "workflow.run",
          "workflow": "guard.group.admin",
          "input": {}
        },
        {
          "type": "state.get",
          "scope": "chat",
          "key": "goodbye.text",
          "default": "👋 <b>خدانگهدار !mention</b>\nامیدواریم دوباره ببینیمت.",
          "as": "savedText"
        },
        {
          "type": "state.get",
          "scope": "chat",
          "key": "goodbye.source",
          "default": null,
          "as": "savedSource"
        },
        {
          "type": "telegram.call",
          "method": "sendMessage",
          "payload": {
            "chat_id": "{{chat.id}}",
            "text": {
              "$expr": {
                "op": "concat",
                "args": [
                  "<b>پیام خداحافظی</b>\nحالت رسانه: <code>",
                  "{{savedSource.message_id}}",
                  "</code>\n\n",
                  "{{savedText}}"
                ]
              }
            },
            "parse_mode": "HTML",
            "link_preview_options": {
              "is_disabled": true
            }
          }
        }
      ]
    },
    "resetgoodbye": {
      "module": "group_management",
      "scope": "group",
      "roles": [
        "admin"
      ],
      "feature": "goodbye",
      "title": "♻️ بازنشانی خداحافظی",
      "triggers": [
        "/resetgoodbye",
        "ریست خداحافظی",
        "ResetGoodbye"
      ],
      "actions": [
        {
          "type": "workflow.run",
          "workflow": "forcejoin.check",
          "input": {}
        },
        {
          "type": "workflow.run",
          "workflow": "guard.group.admin",
          "input": {}
        },
        {
          "type": "state.delete",
          "scope": "chat",
          "key": "goodbye.text"
        },
        {
          "type": "state.delete",
          "scope": "chat",
          "key": "goodbye.source"
        },
        {
          "type": "telegram.call",
          "method": "sendMessage",
          "payload": {
            "chat_id": "{{chat.id}}",
            "text": "<b>خداحافظی به حالت پیش‌فرض بازگشت.</b>",
            "parse_mode": "HTML",
            "link_preview_options": {
              "is_disabled": true
            }
          }
        }
      ]
    },
    "goodbye_on": {
      "module": "group_management",
      "scope": "group",
      "roles": [
        "admin"
      ],
      "feature": "goodbye",
      "title": "🟢 روشن خداحافظی",
      "triggers": [
        "/goodbye_on",
        "خداحافظی روشن",
        "Goodbye on"
      ],
      "actions": [
        {
          "type": "workflow.run",
          "workflow": "forcejoin.check",
          "input": {}
        },
        {
          "type": "workflow.run",
          "workflow": "guard.group.admin",
          "input": {}
        },
        {
          "type": "state.set",
          "scope": "chat",
          "key": "goodbye.enabled",
          "value": true
        },
        {
          "type": "telegram.call",
          "method": "sendMessage",
          "payload": {
            "chat_id": "{{chat.id}}",
            "text": "<b>خداحافظی فعال شد.</b>",
            "parse_mode": "HTML",
            "link_preview_options": {
              "is_disabled": true
            }
          }
        }
      ]
    },
    "goodbye_off": {
      "module": "group_management",
      "scope": "group",
      "roles": [
        "admin"
      ],
      "feature": "goodbye",
      "title": "🔴 خاموش خداحافظی",
      "triggers": [
        "/goodbye_off",
        "خداحافظی خاموش",
        "Goodbye off"
      ],
      "actions": [
        {
          "type": "workflow.run",
          "workflow": "forcejoin.check",
          "input": {}
        },
        {
          "type": "workflow.run",
          "workflow": "guard.group.admin",
          "input": {}
        },
        {
          "type": "state.set",
          "scope": "chat",
          "key": "goodbye.enabled",
          "value": false
        },
        {
          "type": "telegram.call",
          "method": "sendMessage",
          "payload": {
            "chat_id": "{{chat.id}}",
            "text": "<b>خداحافظی غیرفعال شد.</b>",
            "parse_mode": "HTML",
            "link_preview_options": {
              "is_disabled": true
            }
          }
        }
      ]
    },
    "info": {
      "module": "group_management",
      "scope": "any",
      "roles": [
        "any"
      ],
      "title": "👤 اطلاعات کاربر",
      "triggers": [
        "/info",
        "اطلاعات کاربر",
        "اطلاعات",
        "Info"
      ],
      "description": "مشاهده اطلاعات پایه کاربر با ریپلای",
      "actions": [
        {
          "type": "workflow.run",
          "workflow": "forcejoin.check",
          "input": {}
        },
        {
          "type": "workflow.run",
          "workflow": "registry.observe"
        },
        {
          "type": "condition",
          "if": {
            "exists": "reply.from.id"
          },
          "then": [
            {
              "type": "telegram.call",
              "method": "getChatMember",
              "payload": {
                "chat_id": "{{chat.id}}",
                "user_id": "{{reply.from.id}}"
              },
              "as": "profile"
            },
            {
              "type": "telegram.call",
              "method": "sendMessage",
              "payload": {
                "chat_id": "{{chat.id}}",
                "text": "<b>اطلاعات کاربر</b>\nنام: {{profile.user.first_name}} {{profile.user.last_name}}\nنام کاربری: @{{profile.user.username}}\nشناسه: <code>{{profile.user.id}}</code>\nوضعیت عضویت: <code>{{profile.status}}</code>\nPremium: {{profile.user.is_premium}}",
                "parse_mode": "HTML",
                "link_preview_options": {
                  "is_disabled": true
                }
              }
            }
          ],
          "else": [
            {
              "type": "telegram.call",
              "method": "sendMessage",
              "payload": {
                "chat_id": "{{chat.id}}",
                "text": "برای مشاهده اطلاعات، روی پیام کاربر ریپلای کن و <code>/info</code> را بفرست.",
                "parse_mode": "HTML",
                "link_preview_options": {
                  "is_disabled": true
                }
              }
            }
          ]
        }
      ]
    },
    "detect": {
      "module": "owner_management",
      "triggers": [
        "/detect",
        "/scanchat",
        "شناسایی مقصد"
      ],
      "description": "شناسایی مقصد با شناسه، یوزرنیم یا پیام فورواردشده",
      "scope": "private",
      "roles": [
        "owner"
      ],
      "actions": [
        {
          "type": "workflow.run",
          "workflow": "system.detect.command"
        }
      ]
    },
    "detectshare": {
      "module": "owner_management",
      "triggers": [
        "/detectshare",
        "انتخاب مقصد"
      ],
      "description": "انتخاب مستقیم گروه یا کانال از فهرست رسمی تلگرام",
      "scope": "private",
      "roles": [
        "owner"
      ],
      "actions": [
        {
          "type": "workflow.run",
          "workflow": "system.detect.prompt"
        }
      ]
    },
    "repair": {
      "module": "owner_management",
      "triggers": [
        "/repair",
        "/autorepair",
        "ترمیم خودکار"
      ],
      "description": "ترمیم Webhook، تنظیمات Telegram، صف و بررسی دسترسی مقصدها",
      "scope": "private",
      "roles": [
        "owner"
      ],
      "actions": [
        {
          "type": "workflow.run",
          "workflow": "system.autorepair"
        }
      ]
    },
    "silent_list": {
      "module": "group_management",
      "feature": "moderation",
      "title": "📋 فهرست سکوت",
      "section": "ban",
      "description": "📋 فهرست سکوت",
      "scope": "group",
      "roles": [
        "admin"
      ],
      "permissions": [],
      "triggers": [
        "/silentlist",
        "لیست سکوت",
        "SilentList"
      ],
      "usage": "ریپلای به پیام کاربر و ارسال /silentlist",
      "actions": [
        {
          "type": "workflow.run",
          "workflow": "forcejoin.check",
          "input": {}
        },
        {
          "type": "workflow.run",
          "workflow": "registry.observe",
          "input": {}
        },
        {
          "type": "workflow.run",
          "workflow": "guard.group.admin",
          "input": {}
        },
        {
          "type": "state.list",
          "scope": "global",
          "prefix": "moderation:{{chat.id}}:silent:",
          "as": "moderationEntries",
          "limit": 500
        },
        {
          "type": "telegram.call",
          "method": "sendMessage",
          "payload": {
            "chat_id": "{{chat.id}}",
            "text": {
              "$expr": {
                "op": "concat",
                "args": [
                  "<b>فهرست کاربران سکوت‌شده</b>\nتعداد: ",
                  "{{moderationEntries.count}}"
                ]
              }
            },
            "parse_mode": "HTML",
            "link_preview_options": {
              "is_disabled": true
            }
          }
        },
        {
          "type": "each",
          "items": "{{moderationEntries.items}}",
          "as": "moderationEntry",
          "limit": 100,
          "actions": [
            {
              "type": "telegram.call",
              "method": "sendMessage",
              "payload": {
                "chat_id": "{{chat.id}}",
                "text": {
                  "$expr": {
                    "op": "concat",
                    "args": [
                      "شناسه: <code>",
                      "{{moderationEntry.value.userId}}",
                      "</code>"
                    ]
                  }
                },
                "parse_mode": "HTML",
                "link_preview_options": {
                  "is_disabled": true
                }
              }
            }
          ]
        }
      ]
    },
    "clean_silent_list": {
      "module": "group_management",
      "feature": "moderation",
      "title": "🧹 پاک‌سازی فهرست سکوت",
      "section": "ban",
      "description": "🧹 پاک‌سازی فهرست سکوت",
      "scope": "group",
      "roles": [
        "admin"
      ],
      "permissions": [
        "member.moderate"
      ],
      "triggers": [
        "/cleansilentlist",
        "پاکسازی لیست سکوت",
        "پاک سازی لیست سکوت",
        "Clean SilentList",
        "CleanSilentList"
      ],
      "usage": "ریپلای به پیام کاربر و ارسال /cleansilentlist",
      "actions": [
        {
          "type": "workflow.run",
          "workflow": "forcejoin.check",
          "input": {}
        },
        {
          "type": "workflow.run",
          "workflow": "registry.observe",
          "input": {}
        },
        {
          "type": "workflow.run",
          "workflow": "guard.group.restrict",
          "input": {}
        },
        {
          "type": "state.list",
          "scope": "global",
          "prefix": "moderation:{{chat.id}}:silent:",
          "as": "moderationEntries",
          "limit": 500
        },
        {
          "type": "each",
          "items": "{{moderationEntries.items}}",
          "as": "moderationEntry",
          "limit": 500,
          "actions": [
            {
              "type": "try",
              "actions": [
                {
                  "type": "telegram.call",
                  "method": "restrictChatMember",
                  "payload": {
                    "chat_id": "{{chat.id}}",
                    "user_id": "{{moderationEntry.value.userId}}",
                    "permissions": {
                      "can_send_messages": true,
                      "can_send_audios": true,
                      "can_send_documents": true,
                      "can_send_photos": true,
                      "can_send_videos": true,
                      "can_send_video_notes": true,
                      "can_send_voice_notes": true,
                      "can_send_polls": true,
                      "can_send_other_messages": true,
                      "can_add_web_page_previews": true
                    },
                    "use_independent_chat_permissions": true
                  }
                },
                {
                  "type": "state.delete",
                  "scope": "global",
                  "key": "moderation:{{chat.id}}:silent:{{moderationEntry.value.userId}}"
                }
              ],
              "catch": [
                {
                  "type": "log.write",
                  "entry": {
                    "level": "warn",
                    "code": "moderation.cleanup_failed",
                    "detail": "{{moderationEntry.value.userId}}:{{error.message}}"
                  }
                }
              ]
            }
          ]
        },
        {
          "type": "telegram.call",
          "method": "sendMessage",
          "payload": {
            "chat_id": "{{chat.id}}",
            "text": "<b>پاک‌سازی فهرست پایان یافت.</b> مواردی که تلگرام اجازه تغییرشان را نداد، در فهرست باقی می‌مانند.",
            "parse_mode": "HTML",
            "link_preview_options": {
              "is_disabled": true
            }
          }
        }
      ]
    },
    "ban_list": {
      "module": "group_management",
      "feature": "moderation",
      "title": "📋 فهرست بن",
      "section": "ban",
      "description": "📋 فهرست بن",
      "scope": "group",
      "roles": [
        "admin"
      ],
      "permissions": [],
      "triggers": [
        "/banlist",
        "لیست بن",
        "BanList"
      ],
      "usage": "ریپلای به پیام کاربر و ارسال /banlist",
      "actions": [
        {
          "type": "workflow.run",
          "workflow": "forcejoin.check",
          "input": {}
        },
        {
          "type": "workflow.run",
          "workflow": "registry.observe",
          "input": {}
        },
        {
          "type": "workflow.run",
          "workflow": "guard.group.admin",
          "input": {}
        },
        {
          "type": "state.list",
          "scope": "global",
          "prefix": "moderation:{{chat.id}}:banned:",
          "as": "moderationEntries",
          "limit": 500
        },
        {
          "type": "telegram.call",
          "method": "sendMessage",
          "payload": {
            "chat_id": "{{chat.id}}",
            "text": {
              "$expr": {
                "op": "concat",
                "args": [
                  "<b>فهرست کاربران مسدود</b>\nتعداد: ",
                  "{{moderationEntries.count}}"
                ]
              }
            },
            "parse_mode": "HTML",
            "link_preview_options": {
              "is_disabled": true
            }
          }
        },
        {
          "type": "each",
          "items": "{{moderationEntries.items}}",
          "as": "moderationEntry",
          "limit": 100,
          "actions": [
            {
              "type": "telegram.call",
              "method": "sendMessage",
              "payload": {
                "chat_id": "{{chat.id}}",
                "text": {
                  "$expr": {
                    "op": "concat",
                    "args": [
                      "شناسه: <code>",
                      "{{moderationEntry.value.userId}}",
                      "</code>"
                    ]
                  }
                },
                "parse_mode": "HTML",
                "link_preview_options": {
                  "is_disabled": true
                }
              }
            }
          ]
        }
      ]
    },
    "clean_ban_list": {
      "module": "group_management",
      "feature": "moderation",
      "title": "🧹 پاک‌سازی فهرست بن",
      "section": "ban",
      "description": "🧹 پاک‌سازی فهرست بن",
      "scope": "group",
      "roles": [
        "admin"
      ],
      "permissions": [
        "member.moderate"
      ],
      "triggers": [
        "/cleanbanlist",
        "پاکسازی لیست بن",
        "پاک سازی لیست بن",
        "Clean BanList",
        "CleanBanList"
      ],
      "usage": "ریپلای به پیام کاربر و ارسال /cleanbanlist",
      "actions": [
        {
          "type": "workflow.run",
          "workflow": "forcejoin.check",
          "input": {}
        },
        {
          "type": "workflow.run",
          "workflow": "registry.observe",
          "input": {}
        },
        {
          "type": "workflow.run",
          "workflow": "guard.group.restrict",
          "input": {}
        },
        {
          "type": "state.list",
          "scope": "global",
          "prefix": "moderation:{{chat.id}}:banned:",
          "as": "moderationEntries",
          "limit": 500
        },
        {
          "type": "each",
          "items": "{{moderationEntries.items}}",
          "as": "moderationEntry",
          "limit": 500,
          "actions": [
            {
              "type": "try",
              "actions": [
                {
                  "type": "telegram.call",
                  "method": "unbanChatMember",
                  "payload": {
                    "chat_id": "{{chat.id}}",
                    "user_id": "{{moderationEntry.value.userId}}",
                    "only_if_banned": true
                  }
                },
                {
                  "type": "state.delete",
                  "scope": "global",
                  "key": "moderation:{{chat.id}}:banned:{{moderationEntry.value.userId}}"
                }
              ],
              "catch": [
                {
                  "type": "log.write",
                  "entry": {
                    "level": "warn",
                    "code": "moderation.cleanup_failed",
                    "detail": "{{moderationEntry.value.userId}}:{{error.message}}"
                  }
                }
              ]
            }
          ]
        },
        {
          "type": "telegram.call",
          "method": "sendMessage",
          "payload": {
            "chat_id": "{{chat.id}}",
            "text": "<b>پاک‌سازی فهرست پایان یافت.</b> مواردی که تلگرام اجازه تغییرشان را نداد، در فهرست باقی می‌مانند.",
            "parse_mode": "HTML",
            "link_preview_options": {
              "is_disabled": true
            }
          }
        }
      ]
    },
    "setinstallmsg": {
      "module": "group_management",
      "scope": "group",
      "roles": [
        "admin"
      ],
      "feature": "install_notice",
      "title": "📝 تنظیم پیام ورود ربات",
      "description": "سه روش تنظیم: متن را بعد از دستور بنویسید؛ به پیام/رسانه ریپلای کنید؛ یا دستور را خالی بفرستید و محتوای بعدی را ارسال کنید.",
      "triggers": [
        "/setinstallmsg",
        "تنظیم پیام نصب"
      ],
      "actions": [
        {
          "type": "workflow.run",
          "workflow": "forcejoin.check",
          "input": {}
        },
        {
          "type": "workflow.run",
          "workflow": "guard.group.admin",
          "input": {}
        },
        {
          "type": "context.set",
          "path": "templateKind",
          "value": "install"
        },
        {
          "type": "workflow.run",
          "workflow": "template.set",
          "input": {}
        }
      ]
    },
    "setwelcomemedia": {
      "module": "group_management",
      "scope": "group",
      "roles": [
        "admin"
      ],
      "feature": "welcome",
      "title": "🖼 تنظیم رسانه خوش‌آمد",
      "description": "سه روش تنظیم: متن را بعد از دستور بنویسید؛ به پیام/رسانه ریپلای کنید؛ یا دستور را خالی بفرستید و محتوای بعدی را ارسال کنید.",
      "triggers": [
        "/setwelcomemedia",
        "تنظیم رسانه خوشامد",
        "تنظیم رسانه خوش‌آمد",
        "SetWelcomeMedia"
      ],
      "actions": [
        {
          "type": "workflow.run",
          "workflow": "forcejoin.check",
          "input": {}
        },
        {
          "type": "workflow.run",
          "workflow": "guard.group.admin",
          "input": {}
        },
        {
          "type": "context.set",
          "path": "templateKind",
          "value": "welcome"
        },
        {
          "type": "workflow.run",
          "workflow": "template.set",
          "input": {}
        }
      ]
    },
    "setgoodbyemedia": {
      "module": "group_management",
      "scope": "group",
      "roles": [
        "admin"
      ],
      "feature": "goodbye",
      "title": "🖼 تنظیم رسانه خداحافظی",
      "description": "سه روش تنظیم: متن را بعد از دستور بنویسید؛ به پیام/رسانه ریپلای کنید؛ یا دستور را خالی بفرستید و محتوای بعدی را ارسال کنید.",
      "triggers": [
        "/setgoodbyemedia",
        "تنظیم رسانه خداحافظی",
        "SetGoodbyeMedia"
      ],
      "actions": [
        {
          "type": "workflow.run",
          "workflow": "forcejoin.check",
          "input": {}
        },
        {
          "type": "workflow.run",
          "workflow": "guard.group.admin",
          "input": {}
        },
        {
          "type": "context.set",
          "path": "templateKind",
          "value": "goodbye"
        },
        {
          "type": "workflow.run",
          "workflow": "template.set",
          "input": {}
        }
      ]
    },
    "setwelcometime": {
      "module": "group_management",
      "scope": "group",
      "roles": [
        "admin"
      ],
      "feature": "welcome",
      "title": "⏱ تنظیم تأخیر خوش‌آمد",
      "triggers": [
        "/setwelcometime",
        "تنظیم زمان خوشامد",
        "تنظیم زمان خوش‌آمد",
        "SetWelcomeTime"
      ],
      "actions": [
        {
          "type": "workflow.run",
          "workflow": "forcejoin.check",
          "input": {}
        },
        {
          "type": "workflow.run",
          "workflow": "guard.group.admin",
          "input": {}
        },
        {
          "type": "condition",
          "if": {
            "and": [
              {
                "gte": [
                  "{{argsText}}",
                  0
                ]
              },
              {
                "lte": [
                  "{{argsText}}",
                  3600
                ]
              }
            ]
          },
          "then": [
            {
              "type": "state.set",
              "scope": "chat",
              "key": "welcome.delaySeconds",
              "value": {
                "$expr": {
                  "op": "trim",
                  "args": [
                    "{{argsText}}"
                  ]
                }
              }
            },
            {
              "type": "telegram.call",
              "method": "sendMessage",
              "payload": {
                "chat_id": "{{chat.id}}",
                "text": "<b>تأخیر خوش‌آمد ذخیره شد.</b>",
                "parse_mode": "HTML",
                "link_preview_options": {
                  "is_disabled": true
                }
              }
            }
          ],
          "else": [
            {
              "type": "telegram.call",
              "method": "sendMessage",
              "payload": {
                "chat_id": "{{chat.id}}",
                "text": "روش استفاده: <code>/setwelcometime 30</code>\nعدد باید بین ۰ تا ۳۶۰۰ ثانیه باشد.",
                "parse_mode": "HTML",
                "link_preview_options": {
                  "is_disabled": true
                }
              }
            }
          ]
        }
      ]
    },
    "getinstallmsg": {
      "module": "group_management",
      "scope": "group",
      "roles": [
        "admin"
      ],
      "feature": "install_notice",
      "title": "👁 مشاهده پیام ورود ربات",
      "triggers": [
        "/getinstallmsg"
      ],
      "actions": [
        {
          "type": "workflow.run",
          "workflow": "forcejoin.check",
          "input": {}
        },
        {
          "type": "workflow.run",
          "workflow": "guard.group.admin",
          "input": {}
        },
        {
          "type": "state.get",
          "scope": "chat",
          "key": "install.text",
          "default": "<b>MUNITOS به گروه اضافه شد.</b>\nبرای مشاهده راهنمای مدیریت، <code>/group</code> را اجرا کنید.",
          "as": "savedText"
        },
        {
          "type": "state.get",
          "scope": "chat",
          "key": "install.source",
          "default": null,
          "as": "savedSource"
        },
        {
          "type": "telegram.call",
          "method": "sendMessage",
          "payload": {
            "chat_id": "{{chat.id}}",
            "text": {
              "$expr": {
                "op": "concat",
                "args": [
                  "<b>پیام ورود ربات</b>\nحالت رسانه: <code>",
                  "{{savedSource.message_id}}",
                  "</code>\n\n",
                  "{{savedText}}"
                ]
              }
            },
            "parse_mode": "HTML",
            "link_preview_options": {
              "is_disabled": true
            }
          }
        }
      ]
    },
    "resetinstallmsg": {
      "module": "group_management",
      "scope": "group",
      "roles": [
        "admin"
      ],
      "feature": "install_notice",
      "title": "♻️ بازنشانی پیام ورود ربات",
      "triggers": [
        "/resetinstallmsg"
      ],
      "actions": [
        {
          "type": "workflow.run",
          "workflow": "forcejoin.check",
          "input": {}
        },
        {
          "type": "workflow.run",
          "workflow": "guard.group.admin",
          "input": {}
        },
        {
          "type": "state.delete",
          "scope": "chat",
          "key": "install.text"
        },
        {
          "type": "state.delete",
          "scope": "chat",
          "key": "install.source"
        },
        {
          "type": "state.set",
          "scope": "chat",
          "key": "install.sent",
          "value": false
        },
        {
          "type": "telegram.call",
          "method": "sendMessage",
          "payload": {
            "chat_id": "{{chat.id}}",
            "text": "<b>پیام ورود ربات بازنشانی شد.</b>",
            "parse_mode": "HTML",
            "link_preview_options": {
              "is_disabled": true
            }
          }
        }
      ]
    },
    "forcejoin": {
      "module": "group_management",
      "feature": "force_join_group",
      "scope": "group",
      "roles": [
        "admin"
      ],
      "title": "🔐 تنظیم عضویت اجباری گروه",
      "triggers": [
        "/forcejoin",
        "عضویت اجباری"
      ],
      "actions": [
        {
          "type": "workflow.run",
          "workflow": "forcejoin.check",
          "input": {}
        },
        {
          "type": "workflow.run",
          "workflow": "guard.group.admin",
          "input": {}
        },
        {
          "type": "workflow.run",
          "workflow": "forcejoin.group.configure",
          "input": {}
        }
      ]
    },
    "forcejoin_on": {
      "module": "group_management",
      "scope": "group",
      "roles": [
        "admin"
      ],
      "title": "🟢 فعال‌سازی عضویت اجباری",
      "triggers": [
        "/forcejoin_on"
      ],
      "actions": [
        {
          "type": "workflow.run",
          "workflow": "forcejoin.check",
          "input": {}
        },
        {
          "type": "workflow.run",
          "workflow": "guard.group.admin",
          "input": {}
        },
        {
          "type": "state.set",
          "scope": "global",
          "key": "forcejoin:group:{{chat.id}}:enabled",
          "value": true
        },
        {
          "type": "telegram.call",
          "method": "sendMessage",
          "payload": {
            "chat_id": "{{chat.id}}",
            "text": "<b>عضویت اجباری این گروه فعال شد.</b>",
            "parse_mode": "HTML",
            "link_preview_options": {
              "is_disabled": true
            }
          }
        }
      ]
    },
    "forcejoin_off": {
      "module": "group_management",
      "scope": "group",
      "roles": [
        "admin"
      ],
      "title": "🔴 غیرفعال‌سازی عضویت اجباری",
      "triggers": [
        "/forcejoin_off"
      ],
      "actions": [
        {
          "type": "workflow.run",
          "workflow": "forcejoin.check",
          "input": {}
        },
        {
          "type": "workflow.run",
          "workflow": "guard.group.admin",
          "input": {}
        },
        {
          "type": "state.set",
          "scope": "global",
          "key": "forcejoin:group:{{chat.id}}:enabled",
          "value": false
        },
        {
          "type": "telegram.call",
          "method": "sendMessage",
          "payload": {
            "chat_id": "{{chat.id}}",
            "text": "<b>عضویت اجباری این گروه غیرفعال شد.</b>",
            "parse_mode": "HTML",
            "link_preview_options": {
              "is_disabled": true
            }
          }
        }
      ]
    },
    "forcejoin_clear": {
      "module": "group_management",
      "scope": "group",
      "roles": [
        "admin"
      ],
      "title": "🧹 پاک‌سازی عضویت اجباری",
      "triggers": [
        "/forcejoin_clear"
      ],
      "actions": [
        {
          "type": "workflow.run",
          "workflow": "forcejoin.check",
          "input": {}
        },
        {
          "type": "workflow.run",
          "workflow": "guard.group.admin",
          "input": {}
        },
        {
          "type": "workflow.run",
          "workflow": "forcejoin.clear.group",
          "input": {}
        }
      ]
    },
    "forcejoin_pm": {
      "module": "owner_management",
      "feature": "force_join_private",
      "scope": "private",
      "roles": [
        "owner"
      ],
      "title": "🔐 عضویت اجباری کاربران خصوصی",
      "triggers": [
        "/forcejoin_pm"
      ],
      "actions": [
        {
          "type": "workflow.run",
          "workflow": "forcejoin.private.configure",
          "input": {}
        }
      ]
    },
    "forcejoin_pm_off": {
      "module": "owner_management",
      "scope": "private",
      "roles": [
        "owner"
      ],
      "title": "🔴 خاموش‌کردن عضویت اجباری خصوصی",
      "triggers": [
        "/forcejoin_pm_off"
      ],
      "actions": [
        {
          "type": "state.set",
          "scope": "global",
          "key": "forcejoin:private:enabled",
          "value": false
        },
        {
          "type": "telegram.call",
          "method": "sendMessage",
          "payload": {
            "chat_id": "{{chat.id}}",
            "text": "<b>عضویت اجباری کاربران خصوصی غیرفعال شد.</b>",
            "parse_mode": "HTML",
            "link_preview_options": {
              "is_disabled": true
            }
          }
        }
      ]
    },
    "forcejoin_pm_clear": {
      "module": "owner_management",
      "scope": "private",
      "roles": [
        "owner"
      ],
      "title": "🧹 پاک‌سازی عضویت اجباری خصوصی",
      "triggers": [
        "/forcejoin_pm_clear"
      ],
      "actions": [
        {
          "type": "workflow.run",
          "workflow": "forcejoin.clear.private",
          "input": {}
        }
      ]
    },
    "group": {
      "module": "group_management",
      "scope": "group",
      "roles": [
        "admin"
      ],
      "title": "⚙️ پنل مدیریت گروه",
      "triggers": [
        "/group",
        "/group_panel",
        "پنل گروه"
      ],
      "actions": [
        {
          "type": "workflow.run",
          "workflow": "group.panel.render",
          "input": {}
        }
      ]
    }
  },
  "workflows": {
    "broadcast.collect": {
      "actions": [
        {
          "type": "condition",
          "if": {
            "not": {
              "exists": "message.message_id"
            }
          },
          "then": [
            {
              "type": "telegram.call",
              "method": "sendMessage",
              "payload": {
                "chat_id": "{{chat.id}}",
                "text": "این پیام قابل ارسال نیست. یک پیام یا رسانه دیگر بفرست."
              }
            },
            {
              "type": "flow.return",
              "value": false
            }
          ]
        },
        {
          "type": "state.set",
          "scope": "user",
          "key": "broadcast.pending",
          "value": {
            "sourceChatId": "{{chat.id}}",
            "sourceMessageId": "{{message.message_id}}",
            "createdAt": "{{runtime.iso}}"
          }
        },
        {
          "type": "conversation.end"
        },
        {
          "type": "telegram.call",
          "method": "sendMessage",
          "payload": {
            "chat_id": "{{chat.id}}",
            "parse_mode": "HTML",
            "text": "<b>◈ پیش‌نمایش پیام همگانی</b>\n━━━━━━━━━━━━━━━━━━\nپیام دریافت شد و آماده ارسال است.\n\nپس از تأیید، مقصدهای ثبت‌شده بررسی و پیام‌ها به‌صورت صف‌بندی‌شده ارسال می‌شوند.\n\nبرای آغاز ارسال، تأیید را انتخاب کن.",
            "reply_markup": {
              "inline_keyboard": [
                [
                  {
                    "text": "✅ تأیید و شروع ارسال",
                    "callback_data": "ui:broadcast:confirm",
                    "style": "success"
                  },
                  {
                    "text": "✖️ لغو",
                    "callback_data": "ui:broadcast:cancel",
                    "style": "danger"
                  }
                ]
              ]
            }
          }
        }
      ]
    },
    "broadcast.deliver": {
      "actions": [
        {
          "type": "telegram.call",
          "method": "copyMessage",
          "payload": {
            "chat_id": "{{job.input.chatId}}",
            "from_chat_id": "{{job.input.fromChatId}}",
            "message_id": "{{job.input.messageId}}"
          }
        }
      ]
    },
    "system.reconcile": {
      "actions": [
        {
          "type": "telegram.call",
          "method": "getMe",
          "payload": {},
          "as": "botInfo"
        },
        {
          "type": "state.set",
          "scope": "global",
          "key": "bot:id",
          "value": "{{botInfo.id}}"
        },
        {
          "type": "state.set",
          "scope": "global",
          "key": "bot:username",
          "value": "{{botInfo.username}}"
        },
        {
          "type": "state.set",
          "scope": "global",
          "key": "bot:first_name",
          "value": "{{botInfo.first_name}}"
        },
        {
          "type": "try",
          "actions": [
            {
              "type": "telegram.call",
              "method": "setMyName",
              "payload": {
                "name": "{{runtime.profile.name}}"
              }
            }
          ],
          "catch": [
            {
              "type": "log.write",
              "entry": {
                "level": "warn",
                "code": "reconcile.set_name_failed",
                "detail": "{{error.message}}"
              }
            }
          ]
        },
        {
          "type": "try",
          "actions": [
            {
              "type": "telegram.call",
              "method": "setMyDescription",
              "payload": {
                "description": "{{runtime.profile.description}}"
              }
            }
          ],
          "catch": [
            {
              "type": "log.write",
              "entry": {
                "level": "warn",
                "code": "reconcile.set_description_failed",
                "detail": "{{error.message}}"
              }
            }
          ]
        },
        {
          "type": "try",
          "actions": [
            {
              "type": "telegram.call",
              "method": "setMyShortDescription",
              "payload": {
                "short_description": "{{runtime.profile.shortDescription}}"
              }
            }
          ],
          "catch": [
            {
              "type": "log.write",
              "entry": {
                "level": "warn",
                "code": "reconcile.set_short_description_failed",
                "detail": "{{error.message}}"
              }
            }
          ]
        },
        {
          "type": "condition",
          "if": {
            "eq": [
              "{{runtime.syncTelegramCommands}}",
              true
            ]
          },
          "then": [
            {
              "type": "try",
              "actions": [
                {
                  "type": "telegram.call",
                  "method": "setMyCommands",
                  "payload": {
                    "commands": {
                      "$expr": {
                        "op": "get",
                        "path": "runtime.app.menus.commandSets.private"
                      }
                    },
                    "scope": {
                      "type": "all_private_chats"
                    }
                  }
                }
              ],
              "catch": [
                {
                  "type": "log.write",
                  "entry": {
                    "level": "warn",
                    "code": "reconcile.set_commands_private_failed",
                    "detail": "{{error.message}}"
                  }
                }
              ]
            },
            {
              "type": "try",
              "actions": [
                {
                  "type": "telegram.call",
                  "method": "setMyCommands",
                  "payload": {
                    "commands": {
                      "$expr": {
                        "op": "get",
                        "path": "runtime.app.menus.commandSets.groupMember"
                      }
                    },
                    "scope": {
                      "type": "all_group_chats"
                    }
                  }
                }
              ],
              "catch": [
                {
                  "type": "log.write",
                  "entry": {
                    "level": "warn",
                    "code": "reconcile.set_commands_groupMember_failed",
                    "detail": "{{error.message}}"
                  }
                }
              ]
            },
            {
              "type": "try",
              "actions": [
                {
                  "type": "telegram.call",
                  "method": "setMyCommands",
                  "payload": {
                    "commands": {
                      "$expr": {
                        "op": "get",
                        "path": "runtime.app.menus.commandSets.groupAdmin"
                      }
                    },
                    "scope": {
                      "type": "all_chat_administrators"
                    }
                  }
                }
              ],
              "catch": [
                {
                  "type": "log.write",
                  "entry": {
                    "level": "warn",
                    "code": "reconcile.set_commands_groupAdmin_failed",
                    "detail": "{{error.message}}"
                  }
                }
              ]
            },
            {
              "type": "try",
              "actions": [
                {
                  "type": "telegram.call",
                  "method": "setMyCommands",
                  "payload": {
                    "commands": {
                      "$expr": {
                        "op": "get",
                        "path": "runtime.app.menus.commandSets.owner"
                      }
                    },
                    "scope": {
                      "type": "chat",
                      "chat_id": "{{owner.id}}"
                    }
                  }
                }
              ],
              "catch": [
                {
                  "type": "log.write",
                  "entry": {
                    "level": "warn",
                    "code": "reconcile.set_commands_owner_failed",
                    "detail": "{{error.message}}"
                  }
                }
              ]
            }
          ],
          "else": []
        },
        {
          "type": "telegram.call",
          "method": "setWebhook",
          "payload": {
            "url": "{{runtime.webhookUrl}}",
            "secret_token": "{{runtime.webhookSecret}}",
            "allowed_updates": "{{runtime.allowedUpdates}}",
            "drop_pending_updates": "{{runtime.dropPendingUpdates}}",
            "max_connections": "{{runtime.maxWebhookConnections}}"
          },
          "as": "webhookSet"
        },
        {
          "type": "telegram.call",
          "method": "getWebhookInfo",
          "payload": {},
          "as": "webhookInfo"
        },
        {
          "type": "state.set",
          "scope": "global",
          "key": "system:webhook:lastCheck",
          "value": {
            "url": "{{webhookInfo.url}}",
            "pendingUpdateCount": "{{webhookInfo.pending_update_count}}",
            "lastCheckAt": "{{runtime.iso}}"
          }
        },
        {
          "type": "condition",
          "if": {
            "eq": [
              "{{webhookInfo.url}}",
              "{{runtime.webhookUrl}}"
            ]
          },
          "then": [
            {
              "type": "log.write",
              "entry": {
                "level": "info",
                "code": "reconcile.webhook_verified",
                "detail": "{{webhookInfo.url}}"
              }
            }
          ],
          "else": [
            {
              "type": "log.write",
              "entry": {
                "level": "error",
                "code": "reconcile.webhook_mismatch",
                "detail": "{{webhookInfo.url}}"
              }
            }
          ]
        }
      ]
    },
    "owner.targets.list": {
      "actions": [
        {
          "type": "state.list",
          "scope": "global",
          "prefix": "registry:{{kind}}:",
          "limit": 2000,
          "as": "registry"
        },
        {
          "type": "context.set",
          "path": "page",
          "value": {
            "$expr": {
              "op": "max",
              "args": [
                0,
                "{{page}}"
              ]
            }
          }
        },
        {
          "type": "context.set",
          "path": "pageStart",
          "value": {
            "$expr": {
              "op": "multiply",
              "args": [
                "{{page}}",
                6
              ]
            }
          }
        },
        {
          "type": "context.set",
          "path": "pageEnd",
          "value": {
            "$expr": {
              "op": "add",
              "args": [
                "{{pageStart}}",
                6
              ]
            }
          }
        },
        {
          "type": "context.set",
          "path": "pageNumber",
          "value": {
            "$expr": {
              "op": "add",
              "args": [
                "{{page}}",
                1
              ]
            }
          }
        },
        {
          "type": "context.set",
          "path": "prevPage",
          "value": {
            "$expr": {
              "op": "max",
              "args": [
                0,
                {
                  "$expr": {
                    "op": "subtract",
                    "args": [
                      "{{page}}",
                      1
                    ]
                  }
                }
              ]
            }
          }
        },
        {
          "type": "context.set",
          "path": "nextPage",
          "value": {
            "$expr": {
              "op": "add",
              "args": [
                "{{page}}",
                1
              ]
            }
          }
        },
        {
          "type": "condition",
          "if": {
            "eq": [
              "{{kind}}",
              "groups"
            ]
          },
          "then": [
            {
              "type": "context.set",
              "path": "kindTitle",
              "value": "👥 گروه‌های ثبت‌شده"
            }
          ],
          "else": [
            {
              "type": "context.set",
              "path": "kindTitle",
              "value": "📣 کانال‌های ثبت‌شده"
            }
          ]
        },
        {
          "type": "context.set",
          "path": "hasPrevious",
          "value": {
            "$expr": {
              "op": "gt",
              "args": [
                "{{page}}",
                0
              ]
            }
          }
        },
        {
          "type": "context.set",
          "path": "hasNext",
          "value": {
            "$expr": {
              "op": "gt",
              "args": [
                "{{registry.count}}",
                "{{pageEnd}}"
              ]
            }
          }
        },
        {
          "type": "condition",
          "if": {
            "eq": [
              "{{hasPrevious}}",
              true
            ]
          },
          "then": [
            {
              "type": "condition",
              "if": {
                "eq": [
                  "{{hasNext}}",
                  true
                ]
              },
              "then": [
                {
                  "type": "context.set",
                  "path": "navKeyboard",
                  "value": [
                    [
                      {
                        "text": "⬅️ صفحه قبل",
                        "callback_data": "ui:owner:{{kind}}:{{prevPage}}",
                        "style": "primary"
                      },
                      {
                        "text": "صفحه بعد ➡️",
                        "callback_data": "ui:owner:{{kind}}:{{nextPage}}",
                        "style": "primary"
                      }
                    ],
                    [
                      {
                        "text": "🏠 پنل مدیریت",
                        "callback_data": "ui:owner:home",
                        "style": "primary"
                      }
                    ]
                  ]
                }
              ],
              "else": [
                {
                  "type": "context.set",
                  "path": "navKeyboard",
                  "value": [
                    [
                      {
                        "text": "⬅️ صفحه قبل",
                        "callback_data": "ui:owner:{{kind}}:{{prevPage}}",
                        "style": "primary"
                      }
                    ],
                    [
                      {
                        "text": "🏠 پنل مدیریت",
                        "callback_data": "ui:owner:home",
                        "style": "primary"
                      }
                    ]
                  ]
                }
              ]
            }
          ],
          "else": [
            {
              "type": "condition",
              "if": {
                "eq": [
                  "{{hasNext}}",
                  true
                ]
              },
              "then": [
                {
                  "type": "context.set",
                  "path": "navKeyboard",
                  "value": [
                    [
                      {
                        "text": "صفحه بعد ➡️",
                        "callback_data": "ui:owner:{{kind}}:{{nextPage}}",
                        "style": "primary"
                      }
                    ],
                    [
                      {
                        "text": "🏠 پنل مدیریت",
                        "callback_data": "ui:owner:home",
                        "style": "primary"
                      }
                    ]
                  ]
                }
              ],
              "else": [
                {
                  "type": "context.set",
                  "path": "navKeyboard",
                  "value": [
                    [
                      {
                        "text": "🏠 پنل مدیریت",
                        "callback_data": "ui:owner:home",
                        "style": "primary"
                      }
                    ]
                  ]
                }
              ]
            }
          ]
        },
        {
          "type": "telegram.call",
          "method": "sendMessage",
          "payload": {
            "chat_id": "{{chat.id}}",
            "text": "<b>{{kindTitle}}</b>\n\nتعداد مقصدهای ثبت‌شده: <b>{{registry.count}}</b>\nصفحه: <b>{{pageNumber}}</b>\n\nوضعیت عضویت و اجازه ارسال پس از شناسایی یا Auto Repair تکمیل می‌شود.\nبرای جزئیات هر مقصد، کارت مربوط را انتخاب کن.",
            "parse_mode": "HTML",
            "link_preview_options": {
              "is_disabled": true
            },
            "reply_markup": {
              "inline_keyboard": {
                "$expr": {
                  "op": "get",
                  "path": "navKeyboard"
                }
              }
            }
          }
        },
        {
          "type": "each",
          "items": {
            "$expr": {
              "op": "slice",
              "args": [
                "{{registry.items}}",
                "{{pageStart}}",
                "{{pageEnd}}"
              ]
            }
          },
          "as": "target",
          "limit": 6,
          "actions": [
            {
              "type": "condition",
              "if": {
                "eq": [
                  "{{target.value.active}}",
                  true
                ]
              },
              "then": [
                {
                  "type": "context.set",
                  "path": "targetStatusText",
                  "value": "🟢 فعال"
                }
              ],
              "else": [
                {
                  "type": "context.set",
                  "path": "targetStatusText",
                  "value": "🔴 غیرفعال"
                }
              ]
            },
            {
              "type": "context.set",
              "path": "targetButtonStyle",
              "value": "danger"
            },
            {
              "type": "condition",
              "if": {
                "eq": [
                  "{{target.value.active}}",
                  true
                ]
              },
              "then": [
                {
                  "type": "context.set",
                  "path": "targetButtonStyle",
                  "value": "success"
                }
              ],
              "else": []
            },
            {
              "type": "context.set",
              "path": "targetTypeText",
              "value": "گروه"
            },
            {
              "type": "condition",
              "if": {
                "eq": [
                  "{{target.value.type}}",
                  "channel"
                ]
              },
              "then": [
                {
                  "type": "context.set",
                  "path": "targetTypeText",
                  "value": "کانال"
                }
              ],
              "else": []
            },
            {
              "type": "context.set",
              "path": "targetCanSendText",
              "value": "نیازمند بررسی"
            },
            {
              "type": "condition",
              "if": {
                "eq": [
                  "{{target.value.canSend}}",
                  true
                ]
              },
              "then": [
                {
                  "type": "context.set",
                  "path": "targetCanSendText",
                  "value": "مجاز"
                }
              ],
              "else": [
                {
                  "type": "context.set",
                  "path": "targetCanSendText",
                  "value": "غیرمجاز"
                }
              ]
            },
            {
              "type": "condition",
              "if": {
                "eq": [
                  "{{target.value.verificationState}}",
                  "partial"
                ]
              },
              "then": [
                {
                  "type": "context.set",
                  "path": "targetCanSendText",
                  "value": "نیازمند بررسی"
                }
              ],
              "else": []
            },
            {
              "type": "context.set",
              "path": "targetButtonLabel",
              "value": {
                "$expr": {
                  "op": "concat",
                  "args": [
                    "{{targetStatusText}}",
                    " · ",
                    {
                      "$expr": {
                        "op": "slice",
                        "args": [
                          "{{target.value.title}}",
                          0,
                          40
                        ]
                      }
                    }
                  ]
                }
              }
            },
            {
              "type": "telegram.call",
              "method": "sendMessage",
              "payload": {
                "chat_id": "{{chat.id}}",
                "text": "<b>{{target.value.title}}</b>\n<code>{{target.value.id}}</code> · {{targetTypeText}}\nوضعیت: <b>{{targetStatusText}}</b> · ارسال: <b>{{targetCanSendText}}</b>",
                "link_preview_options": {
                  "is_disabled": true
                },
                "reply_markup": {
                  "inline_keyboard": [
                    [
                      {
                        "text": "{{targetButtonLabel}}",
                        "callback_data": "ui:target:{{target.value.id}}",
                        "style": "primary"
                      },
                      {
                        "text": "✉️ پیام اختصاصی",
                        "callback_data": "ui:target:message:{{target.value.id}}",
                        "style": "primary"
                      }
                    ]
                  ]
                },
                "parse_mode": "HTML"
              }
            }
          ]
        }
      ]
    },
    "owner.target.show": {
      "actions": [
        {
          "type": "state.get",
          "scope": "global",
          "key": "registry:chat:{{targetId}}",
          "as": "targetRecord"
        },
        {
          "type": "condition",
          "if": {
            "exists": "targetRecord.id"
          },
          "then": [
            {
              "type": "quota.get",
              "quota": "broadcast",
              "chatId": "{{targetId}}",
              "as": "quotaInfo"
            },
            {
              "type": "condition",
              "if": {
                "eq": [
                  "{{targetRecord.type}}",
                  "channel"
                ]
              },
              "then": [
                {
                  "type": "context.set",
                  "path": "targetTypeText",
                  "value": "کانال"
                }
              ],
              "else": [
                {
                  "type": "context.set",
                  "path": "targetTypeText",
                  "value": "گروه"
                }
              ]
            },
            {
              "type": "condition",
              "if": {
                "eq": [
                  "{{targetRecord.active}}",
                  true
                ]
              },
              "then": [
                {
                  "type": "context.set",
                  "path": "targetActiveText",
                  "value": "🟢 فعال"
                }
              ],
              "else": [
                {
                  "type": "context.set",
                  "path": "targetActiveText",
                  "value": "🔴 غیرفعال"
                }
              ]
            },
            {
              "type": "telegram.call",
              "method": "editMessageText",
              "payload": {
                "chat_id": "{{callback.message.chat.id}}",
                "message_id": "{{callback.message.message_id}}",
                "text": "<b>جزئیات مقصد</b>\n\n<b>نام:</b> {{targetRecord.title}}\n<b>شناسه:</b> <code>{{targetRecord.id}}</code>\n<b>نوع:</b> {{targetTypeText}}\n<b>یوزرنیم:</b> @{{targetRecord.username}}\n<b>عضویت ربات:</b> {{targetRecord.botStatus}}\n<b>وضعیت مقصد:</b> {{targetActiveText}}\n<b>اجازه ارسال:</b> {{targetRecord.canSend}}\n<b>اعضا:</b> {{targetRecord.memberCount}} · <b>مدیران:</b> {{targetRecord.adminCount}}\n<b>ارسال در کانال:</b> {{targetRecord.canPostMessages}}\n<b>محدودسازی اعضا:</b> {{targetRecord.canRestrictMembers}}\n<b>آخرین بررسی:</b> {{targetRecord.lastVerifiedAt}}\n\n<b>پلن:</b> {{quotaInfo.plan}}\n<b>مصرف این ماه:</b> {{quotaInfo.used}}\n<b>سقف ماهانه:</b> {{quotaInfo.limit}}\n<b>باقی‌مانده:</b> {{quotaInfo.remaining}}",
                "parse_mode": "HTML",
                "link_preview_options": {
                  "is_disabled": true
                },
                "reply_markup": {
                  "inline_keyboard": [
                    [
                      {
                        "text": "🟢 FREE",
                        "callback_data": "ui:target:plan:free:{{targetId}}",
                        "style": "primary"
                      },
                      {
                        "text": "⭐ PRO",
                        "callback_data": "ui:target:plan:pro:{{targetId}}",
                        "style": "primary"
                      },
                      {
                        "text": "♾ نامحدود",
                        "callback_data": "ui:target:plan:unlimited:{{targetId}}",
                        "style": "primary"
                      }
                    ],
                    [
                      {
                        "text": "✉️ ارسال پیام اختصاصی",
                        "callback_data": "ui:target:message:{{targetId}}",
                        "style": "primary"
                      }
                    ],
                    [
                      {
                        "text": "🔍 بررسی مجدد دسترسی",
                        "callback_data": "ui:target:verify:{{targetId}}",
                        "style": "primary"
                      }
                    ],
                    [
                      {
                        "text": "🔄 تغییر وضعیت ارسال",
                        "callback_data": "ui:target:toggle:{{targetId}}",
                        "style": "primary"
                      }
                    ],
                    [
                      {
                        "text": "⬅️ فهرست گروه‌ها",
                        "callback_data": "ui:owner:groups:0",
                        "style": "primary"
                      },
                      {
                        "text": "📣 فهرست کانال‌ها",
                        "callback_data": "ui:owner:channels:0",
                        "style": "primary"
                      }
                    ],
                    [
                      {
                        "text": "🏠 پنل مدیریت",
                        "callback_data": "ui:owner:home",
                        "style": "primary"
                      }
                    ]
                  ]
                }
              }
            }
          ],
          "else": [
            {
              "type": "telegram.call",
              "method": "editMessageText",
              "payload": {
                "chat_id": "{{callback.message.chat.id}}",
                "message_id": "{{callback.message.message_id}}",
                "text": "این مقصد دیگر در فهرست ثبت‌شده وجود ندارد.",
                "reply_markup": {
                  "inline_keyboard": [
                    [
                      {
                        "text": "⬅️ پنل مدیریت",
                        "callback_data": "ui:owner:home",
                        "style": "primary"
                      }
                    ]
                  ]
                }
              }
            }
          ]
        }
      ]
    },
    "broadcast.enqueue": {
      "actions": [
        {
          "type": "state.get",
          "scope": "user",
          "key": "broadcast.pending",
          "as": "broadcastPending"
        },
        {
          "type": "condition",
          "if": {
            "exists": "broadcastPending.sourceMessageId"
          },
          "then": [
            {
              "type": "state.list",
              "scope": "global",
              "prefix": "registry:chat:",
              "limit": 2000,
              "as": "targets"
            },
            {
              "type": "queue.enqueue",
              "workflow": "broadcast.prepare.batch",
              "input": {
                "offset": 0,
                "fromChatId": "{{broadcastPending.sourceChatId}}",
                "messageId": "{{broadcastPending.sourceMessageId}}"
              },
              "maxAttempts": 3
            },
            {
              "type": "queue.enqueue",
              "workflow": "broadcast.prepare.batch",
              "input": {
                "offset": 500,
                "fromChatId": "{{broadcastPending.sourceChatId}}",
                "messageId": "{{broadcastPending.sourceMessageId}}"
              },
              "maxAttempts": 3
            },
            {
              "type": "queue.enqueue",
              "workflow": "broadcast.prepare.batch",
              "input": {
                "offset": 1000,
                "fromChatId": "{{broadcastPending.sourceChatId}}",
                "messageId": "{{broadcastPending.sourceMessageId}}"
              },
              "maxAttempts": 3
            },
            {
              "type": "queue.enqueue",
              "workflow": "broadcast.prepare.batch",
              "input": {
                "offset": 1500,
                "fromChatId": "{{broadcastPending.sourceChatId}}",
                "messageId": "{{broadcastPending.sourceMessageId}}"
              },
              "maxAttempts": 3
            },
            {
              "type": "state.delete",
              "scope": "user",
              "key": "broadcast.pending"
            },
            {
              "type": "telegram.call",
              "method": "sendMessage",
              "payload": {
                "chat_id": "{{chat.id}}",
                "parse_mode": "HTML",
                "text": "✅ درخواست پیام همگانی ثبت شد.\n\n<b>مقصدهای شناسایی‌شده:</b> {{targets.count}}\n<b>ظرفیت بررسی در این نوبت:</b> حداکثر ۲۰۰۰ مقصد\n\nهر مقصد در یک مرحله جداگانه از نظر فعال‌بودن، مجوز ارسال و سهمیه ماهانه دوباره بررسی می‌شود."
              }
            }
          ],
          "else": [
            {
              "type": "telegram.call",
              "method": "sendMessage",
              "payload": {
                "chat_id": "{{chat.id}}",
                "text": "پیش‌نمایش معتبری برای ارسال پیدا نشد. دوباره /broadcast را اجرا کن."
              }
            }
          ]
        }
      ]
    },
    "owner.target.message.collect": {
      "actions": [
        {
          "type": "condition",
          "if": {
            "exists": "message.message_id"
          },
          "then": [
            {
              "type": "state.set",
              "scope": "user",
              "key": "target.message.pending",
              "value": {
                "targetId": "{{conversation.input.targetId}}",
                "sourceChatId": "{{chat.id}}",
                "sourceMessageId": "{{message.message_id}}"
              }
            },
            {
              "type": "conversation.end"
            },
            {
              "type": "telegram.call",
              "method": "sendMessage",
              "payload": {
                "chat_id": "{{chat.id}}",
                "text": "پیش‌نمایش پیام اختصاصی آماده است. ارسال به مقصد انتخاب‌شده را تأیید می‌کنی؟",
                "reply_markup": {
                  "inline_keyboard": [
                    [
                      {
                        "text": "✅ تأیید ارسال",
                        "callback_data": "ui:target:send:confirm",
                        "style": "success"
                      },
                      {
                        "text": "✖️ لغو",
                        "callback_data": "ui:target:send:cancel",
                        "style": "danger"
                      }
                    ]
                  ]
                }
              }
            }
          ],
          "else": [
            {
              "type": "telegram.call",
              "method": "sendMessage",
              "payload": {
                "chat_id": "{{chat.id}}",
                "text": "یک پیام یا رسانه معتبر بفرست."
              }
            }
          ]
        }
      ]
    },
    "registry.observe": {
      "actions": [
        {
          "type": "condition",
          "if": {
            "in": [
              "{{chat.type}}",
              [
                "group",
                "supergroup",
                "channel"
              ]
            ]
          },
          "then": [
            {
              "type": "state.get",
              "scope": "global",
              "key": "registry:chat:{{chat.id}}",
              "as": "previousRecord"
            },
            {
              "type": "context.set",
              "path": "observedRecord",
              "value": {
                "$expr": {
                  "op": "merge",
                  "args": [
                    "{{previousRecord}}",
                    {
                      "id": "{{chat.id}}",
                      "title": "{{chat.title}}",
                      "username": "{{chat.username}}",
                      "type": "{{chat.type}}",
                      "active": true,
                      "botStatus": "{{previousRecord.botStatus}}",
                      "canSend": "{{previousRecord.canSend}}",
                      "memberCount": "{{previousRecord.memberCount}}",
                      "linkedChatId": "{{previousRecord.linkedChatId}}",
                      "source": "{{updateType}}",
                      "seenCount": {
                        "$expr": {
                          "op": "add",
                          "args": [
                            "{{previousRecord.seenCount}}",
                            1
                          ]
                        }
                      },
                      "lastSeenAt": "{{runtime.iso}}",
                      "updatedAt": "{{runtime.iso}}"
                    }
                  ]
                }
              }
            },
            {
              "type": "state.set",
              "scope": "global",
              "key": "registry:chat:{{chat.id}}",
              "value": "{{observedRecord}}"
            },
            {
              "type": "condition",
              "if": {
                "eq": [
                  "{{chat.type}}",
                  "channel"
                ]
              },
              "then": [
                {
                  "type": "state.set",
                  "scope": "global",
                  "key": "registry:channels:{{chat.id}}",
                  "value": "{{observedRecord}}"
                }
              ],
              "else": [
                {
                  "type": "state.set",
                  "scope": "global",
                  "key": "registry:groups:{{chat.id}}",
                  "value": "{{observedRecord}}"
                }
              ]
            }
          ],
          "else": []
        },
        {
          "type": "condition",
          "if": {
            "and": [
              {
                "in": [
                  "{{chat.type}}",
                  [
                    "group",
                    "supergroup"
                  ]
                ]
              },
              {
                "exists": "user.id"
              }
            ]
          },
          "then": [
            {
              "type": "state.set",
              "scope": "global",
              "key": "registry:member:{{chat.id}}:{{user.id}}",
              "value": {
                "id": "{{user.id}}",
                "firstName": "{{user.first_name}}",
                "lastName": "{{user.last_name}}",
                "username": "{{user.username}}",
                "isBot": "{{user.is_bot}}",
                "lastSeenAt": "{{runtime.iso}}"
              }
            }
          ],
          "else": []
        }
      ]
    },
    "registry.bot.status": {
      "actions": [
        {
          "type": "context.set",
          "path": "botMemberStatus",
          "value": "{{myChatMember.new_chat_member.status}}"
        },
        {
          "type": "context.set",
          "path": "botActive",
          "value": true
        },
        {
          "type": "condition",
          "if": {
            "in": [
              "{{botMemberStatus}}",
              [
                "left",
                "kicked"
              ]
            ]
          },
          "then": [
            {
              "type": "context.set",
              "path": "botActive",
              "value": false
            },
            {
              "type": "state.set",
              "scope": "chat",
              "key": "install.sent",
              "value": false
            }
          ],
          "else": []
        },
        {
          "type": "context.set",
          "path": "botCanSend",
          "value": false
        },
        {
          "type": "condition",
          "if": {
            "eq": [
              "{{chat.type}}",
              "channel"
            ]
          },
          "then": [
            {
              "type": "condition",
              "if": {
                "and": [
                  {
                    "eq": [
                      "{{botMemberStatus}}",
                      "administrator"
                    ]
                  },
                  {
                    "eq": [
                      "{{myChatMember.new_chat_member.can_post_messages}}",
                      true
                    ]
                  }
                ]
              },
              "then": [
                {
                  "type": "context.set",
                  "path": "botCanSend",
                  "value": true
                }
              ],
              "else": []
            }
          ],
          "else": [
            {
              "type": "condition",
              "if": {
                "in": [
                  "{{botMemberStatus}}",
                  [
                    "member",
                    "administrator",
                    "creator"
                  ]
                ]
              },
              "then": [
                {
                  "type": "context.set",
                  "path": "botCanSend",
                  "value": true
                }
              ],
              "else": []
            },
            {
              "type": "condition",
              "if": {
                "and": [
                  {
                    "eq": [
                      "{{botMemberStatus}}",
                      "restricted"
                    ]
                  },
                  {
                    "eq": [
                      "{{myChatMember.new_chat_member.can_send_messages}}",
                      true
                    ]
                  }
                ]
              },
              "then": [
                {
                  "type": "context.set",
                  "path": "botCanSend",
                  "value": true
                }
              ],
              "else": []
            }
          ]
        },
        {
          "type": "context.set",
          "path": "botStatusRecord",
          "value": {
            "id": "{{chat.id}}",
            "title": "{{chat.title}}",
            "username": "{{chat.username}}",
            "type": "{{chat.type}}",
            "active": "{{botActive}}",
            "botStatus": "{{botMemberStatus}}",
            "canSend": "{{botCanSend}}",
            "canDeleteMessages": "{{myChatMember.new_chat_member.can_delete_messages}}",
            "canRestrictMembers": "{{myChatMember.new_chat_member.can_restrict_members}}",
            "canInviteUsers": "{{myChatMember.new_chat_member.can_invite_users}}",
            "permissions": "{{myChatMember.new_chat_member}}",
            "source": "my_chat_member",
            "verificationState": "verified",
            "updatedAt": "{{runtime.iso}}"
          }
        },
        {
          "type": "state.set",
          "scope": "global",
          "key": "registry:chat:{{chat.id}}",
          "value": "{{botStatusRecord}}"
        },
        {
          "type": "condition",
          "if": {
            "eq": [
              "{{chat.type}}",
              "channel"
            ]
          },
          "then": [
            {
              "type": "state.set",
              "scope": "global",
              "key": "registry:channels:{{chat.id}}",
              "value": "{{botStatusRecord}}"
            }
          ],
          "else": [
            {
              "type": "state.set",
              "scope": "global",
              "key": "registry:groups:{{chat.id}}",
              "value": "{{botStatusRecord}}"
            }
          ]
        },
        {
          "type": "condition",
          "if": {
            "and": [
              {
                "eq": [
                  "{{botActive}}",
                  true
                ]
              },
              {
                "in": [
                  "{{chat.type}}",
                  [
                    "group",
                    "supergroup"
                  ]
                ]
              },
              {
                "eq": [
                  "{{botCanSend}}",
                  true
                ]
              }
            ]
          },
          "then": [
            {
              "type": "state.get",
              "scope": "chat",
              "key": "install.sent",
              "default": false,
              "as": "installSent"
            },
            {
              "type": "condition",
              "if": {
                "eq": [
                  "{{installSent}}",
                  false
                ]
              },
              "then": [
                {
                  "type": "state.get",
                  "scope": "chat",
                  "key": "install.source",
                  "default": null,
                  "as": "installSource"
                },
                {
                  "type": "state.get",
                  "scope": "chat",
                  "key": "install.text",
                  "default": "<b>MUNITOS به گروه اضافه شد.</b>\nبرای مشاهده راهنمای مدیریت، <code>/group</code> را اجرا کنید.",
                  "as": "installText"
                },
                {
                  "type": "try",
                  "actions": [
                    {
                      "type": "condition",
                      "if": {
                        "exists": "installSource.message_id"
                      },
                      "then": [
                        {
                          "type": "telegram.call",
                          "method": "copyMessage",
                          "payload": {
                            "chat_id": "{{chat.id}}",
                            "from_chat_id": "{{installSource.chat_id}}",
                            "message_id": "{{installSource.message_id}}"
                          }
                        }
                      ],
                      "else": [
                        {
                          "type": "telegram.call",
                          "method": "sendMessage",
                          "payload": {
                            "chat_id": "{{chat.id}}",
                            "text": "{{installText}}",
                            "parse_mode": "HTML"
                          }
                        }
                      ]
                    },
                    {
                      "type": "state.set",
                      "scope": "chat",
                      "key": "install.sent",
                      "value": true
                    }
                  ],
                  "catch": [
                    {
                      "type": "state.set",
                      "scope": "chat",
                      "key": "install.sent",
                      "value": false
                    },
                    {
                      "type": "log.write",
                      "entry": {
                        "level": "error",
                        "code": "registry.install_notice_failed",
                        "detail": "{{chat.id}}:{{error.message}}"
                      }
                    }
                  ]
                }
              ],
              "else": []
            }
          ],
          "else": []
        },
        {
          "type": "log.write",
          "entry": {
            "level": "info",
            "code": "registry.bot_status_updated",
            "detail": "{{chat.id}}:{{botMemberStatus}}:{{botCanSend}}"
          }
        }
      ]
    },
    "system.detect.prompt": {
      "actions": [
        {
          "type": "telegram.call",
          "method": "sendMessage",
          "payload": {
            "chat_id": "{{chat.id}}",
            "text": "<b>شناسایی هوشمند مقصد</b>\n\nیکی از روش‌های زیر را انتخاب کن:\n\n<b>۱.</b> انتخاب مستقیم گروه از فهرست تلگرام\n<b>۲.</b> انتخاب مستقیم کانال از فهرست تلگرام\n<b>۳.</b> ارسال <code>/detect @username</code> یا شناسه عددی\n<b>۴.</b> فوروارد پیام از گروه یا کانال موردنظر\n\nپس از شناسایی، دسترسی ربات، نوع مقصد، تعداد اعضا و مجوز ارسال بررسی می‌شود.",
            "reply_markup": {
              "keyboard": [
                [
                  {
                    "text": "👥 انتخاب گروه",
                    "request_chat": {
                      "request_id": 88001,
                      "chat_is_channel": false,
                      "bot_is_member": true,
                      "request_title": true,
                      "request_username": true
                    },
                    "style": "primary"
                  }
                ],
                [
                  {
                    "text": "📣 انتخاب کانال",
                    "request_chat": {
                      "request_id": 88002,
                      "chat_is_channel": true,
                      "bot_is_member": true,
                      "request_title": true,
                      "request_username": true
                    },
                    "style": "primary"
                  }
                ]
              ],
              "resize_keyboard": true,
              "one_time_keyboard": true,
              "input_field_placeholder": "گروه یا کانال را انتخاب کن"
            },
            "parse_mode": "HTML"
          }
        }
      ]
    },
    "system.detect.command": {
      "actions": [
        {
          "type": "condition",
          "if": {
            "exists": "args.0"
          },
          "then": [
            {
              "type": "context.set",
              "path": "targetCandidate",
              "value": "{{args.0}}"
            },
            {
              "type": "workflow.run",
              "workflow": "system.detect.target",
              "input": {
                "targetCandidate": "{{targetCandidate}}"
              }
            }
          ],
          "else": [
            {
              "type": "condition",
              "if": {
                "exists": "reply.forward_origin.chat.id"
              },
              "then": [
                {
                  "type": "context.set",
                  "path": "targetCandidate",
                  "value": "{{reply.forward_origin.chat.id}}"
                },
                {
                  "type": "workflow.run",
                  "workflow": "system.detect.target",
                  "input": {
                    "targetCandidate": "{{targetCandidate}}"
                  }
                }
              ],
              "else": [
                {
                  "type": "condition",
                  "if": {
                    "exists": "reply.forward_from_chat.id"
                  },
                  "then": [
                    {
                      "type": "context.set",
                      "path": "targetCandidate",
                      "value": "{{reply.forward_from_chat.id}}"
                    },
                    {
                      "type": "workflow.run",
                      "workflow": "system.detect.target",
                      "input": {
                        "targetCandidate": "{{targetCandidate}}"
                      }
                    }
                  ],
                  "else": [
                    {
                      "type": "workflow.run",
                      "workflow": "system.detect.prompt"
                    }
                  ]
                }
              ]
            }
          ]
        }
      ]
    },
    "system.detect.target": {
      "actions": [
        {
          "type": "try",
          "errorAs": "detectError",
          "actions": [
            {
              "type": "telegram.call",
              "method": "getChat",
              "payload": {
                "chat_id": "{{targetCandidate}}"
              },
              "as": "chatInfo"
            },
            {
              "type": "state.get",
              "scope": "global",
              "key": "bot:id",
              "as": "storedBotId"
            },
            {
              "type": "condition",
              "if": {
                "exists": "storedBotId"
              },
              "then": [
                {
                  "type": "context.set",
                  "path": "detectedBotId",
                  "value": "{{storedBotId}}"
                }
              ],
              "else": [
                {
                  "type": "telegram.call",
                  "method": "getMe",
                  "payload": {},
                  "as": "detectedBotInfo"
                },
                {
                  "type": "context.set",
                  "path": "detectedBotId",
                  "value": "{{detectedBotInfo.id}}"
                },
                {
                  "type": "state.set",
                  "scope": "global",
                  "key": "bot:id",
                  "value": "{{detectedBotId}}"
                }
              ]
            },
            {
              "type": "context.set",
              "path": "botMember",
              "value": {
                "status": "unknown"
              }
            },
            {
              "type": "try",
              "errorAs": "detectMemberError",
              "actions": [
                {
                  "type": "telegram.call",
                  "method": "getChatMember",
                  "payload": {
                    "chat_id": "{{chatInfo.id}}",
                    "user_id": "{{detectedBotId}}"
                  },
                  "as": "botMember"
                }
              ],
              "catch": [
                {
                  "type": "log.write",
                  "entry": {
                    "level": "warn",
                    "code": "detect.membership_unavailable",
                    "detail": "{{chatInfo.id}}:{{detectMemberError.message}}"
                  }
                }
              ]
            },
            {
              "type": "context.set",
              "path": "memberCount",
              "value": 0
            },
            {
              "type": "try",
              "actions": [
                {
                  "type": "telegram.call",
                  "method": "getChatMemberCount",
                  "payload": {
                    "chat_id": "{{chatInfo.id}}"
                  },
                  "as": "memberCount"
                }
              ],
              "catch": [
                {
                  "type": "log.write",
                  "entry": {
                    "level": "warn",
                    "code": "detect.member_count_unavailable",
                    "detail": "{{chatInfo.id}}"
                  }
                }
              ]
            },
            {
              "type": "context.set",
              "path": "adminCount",
              "value": 0
            },
            {
              "type": "try",
              "actions": [
                {
                  "type": "telegram.call",
                  "method": "getChatAdministrators",
                  "payload": {
                    "chat_id": "{{chatInfo.id}}",
                    "return_bots": true
                  },
                  "as": "adminList"
                },
                {
                  "type": "context.set",
                  "path": "adminCount",
                  "value": {
                    "$expr": {
                      "op": "length",
                      "args": [
                        "{{adminList}}"
                      ]
                    }
                  }
                }
              ],
              "catch": [
                {
                  "type": "log.write",
                  "entry": {
                    "level": "debug",
                    "code": "detect.admin_list_unavailable",
                    "detail": "{{chatInfo.id}}"
                  }
                }
              ]
            },
            {
              "type": "context.set",
              "path": "targetActive",
              "value": false
            },
            {
              "type": "condition",
              "if": {
                "in": [
                  "{{botMember.status}}",
                  [
                    "member",
                    "administrator",
                    "creator",
                    "restricted"
                  ]
                ]
              },
              "then": [
                {
                  "type": "context.set",
                  "path": "targetActive",
                  "value": true
                }
              ],
              "else": []
            },
            {
              "type": "context.set",
              "path": "targetCanSend",
              "value": false
            },
            {
              "type": "condition",
              "if": {
                "eq": [
                  "{{chatInfo.type}}",
                  "channel"
                ]
              },
              "then": [
                {
                  "type": "condition",
                  "if": {
                    "and": [
                      {
                        "in": [
                          "{{botMember.status}}",
                          [
                            "administrator",
                            "creator"
                          ]
                        ]
                      },
                      {
                        "eq": [
                          "{{botMember.can_post_messages}}",
                          true
                        ]
                      }
                    ]
                  },
                  "then": [
                    {
                      "type": "context.set",
                      "path": "targetCanSend",
                      "value": true
                    }
                  ],
                  "else": []
                }
              ],
              "else": [
                {
                  "type": "condition",
                  "if": {
                    "in": [
                      "{{botMember.status}}",
                      [
                        "member",
                        "administrator",
                        "creator"
                      ]
                    ]
                  },
                  "then": [
                    {
                      "type": "context.set",
                      "path": "targetCanSend",
                      "value": true
                    }
                  ],
                  "else": []
                },
                {
                  "type": "condition",
                  "if": {
                    "and": [
                      {
                        "eq": [
                          "{{botMember.status}}",
                          "restricted"
                        ]
                      },
                      {
                        "eq": [
                          "{{botMember.can_send_messages}}",
                          true
                        ]
                      }
                    ]
                  },
                  "then": [
                    {
                      "type": "context.set",
                      "path": "targetCanSend",
                      "value": true
                    }
                  ],
                  "else": []
                }
              ]
            },
            {
              "type": "condition",
              "if": {
                "in": [
                  "{{botMember.status}}",
                  [
                    "member",
                    "administrator",
                    "creator",
                    "restricted"
                  ]
                ]
              },
              "then": [
                {
                  "type": "context.set",
                  "path": "targetVerificationState",
                  "value": "verified"
                }
              ],
              "else": [
                {
                  "type": "context.set",
                  "path": "targetVerificationState",
                  "value": "partial"
                }
              ]
            },
            {
              "type": "context.set",
              "path": "detectedRecord",
              "value": {
                "id": "{{chatInfo.id}}",
                "title": "{{chatInfo.title}}",
                "username": "{{chatInfo.username}}",
                "type": "{{chatInfo.type}}",
                "active": "{{targetActive}}",
                "canSend": "{{targetCanSend}}",
                "botStatus": "{{botMember.status}}",
                "memberCount": "{{memberCount}}",
                "adminCount": "{{adminCount}}",
                "linkedChatId": "{{chatInfo.linked_chat_id}}",
                "isForum": "{{chatInfo.is_forum}}",
                "description": "{{chatInfo.description}}",
                "inviteLink": "{{chatInfo.invite_link}}",
                "canPostMessages": "{{botMember.can_post_messages}}",
                "canRestrictMembers": "{{botMember.can_restrict_members}}",
                "canDeleteMessages": "{{botMember.can_delete_messages}}",
                "canInviteUsers": "{{botMember.can_invite_users}}",
                "canPinMessages": "{{botMember.can_pin_messages}}",
                "canManageVideoChats": "{{botMember.can_manage_video_chats}}",
                "permissions": "{{botMember}}",
                "source": "manual-verification",
                "lastVerifiedAt": "{{runtime.iso}}",
                "updatedAt": "{{runtime.iso}}",
                "verificationState": "{{targetVerificationState}}"
              }
            },
            {
              "type": "state.set",
              "scope": "global",
              "key": "registry:chat:{{chatInfo.id}}",
              "value": "{{detectedRecord}}"
            },
            {
              "type": "condition",
              "if": {
                "eq": [
                  "{{chatInfo.type}}",
                  "channel"
                ]
              },
              "then": [
                {
                  "type": "state.set",
                  "scope": "global",
                  "key": "registry:channels:{{chatInfo.id}}",
                  "value": "{{detectedRecord}}"
                }
              ],
              "else": [
                {
                  "type": "state.set",
                  "scope": "global",
                  "key": "registry:groups:{{chatInfo.id}}",
                  "value": "{{detectedRecord}}"
                }
              ]
            },
            {
              "type": "condition",
              "if": {
                "exists": "chatInfo.linked_chat_id"
              },
              "then": [
                {
                  "type": "queue.enqueue",
                  "workflow": "system.verify.target",
                  "input": {
                    "targetId": "{{chatInfo.linked_chat_id}}",
                    "depth": 1,
                    "source": "linked-chat"
                  },
                  "maxAttempts": 3
                }
              ],
              "else": []
            },
            {
              "type": "telegram.call",
              "method": "sendMessage",
              "payload": {
                "chat_id": "{{chat.id}}",
                "text": "<b>نتیجه شناسایی MUNITOS</b>\n\nنام: {{chatInfo.title}}\nشناسه: {{chatInfo.id}}\nیوزرنیم: @{{chatInfo.username}}\nنوع: {{chatInfo.type}}\nتعداد اعضا: {{memberCount}}\nتعداد مدیران: {{adminCount}}\nوضعیت ربات: {{botMember.status}}\nاجازه ارسال: {{targetCanSend}}\nمقصد مرتبط: {{chatInfo.linked_chat_id}}\n\nشناسه و وضعیت عضویت از Telegram API دریافت شد.",
                "reply_markup": {
                  "remove_keyboard": true
                },
                "parse_mode": "HTML"
              }
            }
          ],
          "catch": [
            {
              "type": "log.write",
              "entry": {
                "level": "error",
                "code": "detect.target_failed",
                "detail": "{{targetCandidate}}:{{detectError.message}}"
              }
            },
            {
              "type": "telegram.call",
              "method": "sendMessage",
              "payload": {
                "chat_id": "{{chat.id}}",
                "text": "❌ شناسایی کامل نشد. شناسه یا یوزرنیم را بررسی کن و مطمئن شو ربات به مقصد دسترسی دارد. برای کانال، ربات باید عضو کانال باشد؛ برای بررسی مجوز ارسال ممکن است لازم باشد مدیر کانال باشد.",
                "reply_markup": {
                  "remove_keyboard": true
                }
              }
            }
          ]
        }
      ]
    },
    "system.verify.target": {
      "actions": [
        {
          "type": "try",
          "errorAs": "verifyError",
          "actions": [
            {
              "type": "telegram.call",
              "method": "getChat",
              "payload": {
                "chat_id": "{{job.input.targetId}}"
              },
              "as": "verifyChat"
            },
            {
              "type": "state.get",
              "scope": "global",
              "key": "bot:id",
              "as": "verifyBotId"
            },
            {
              "type": "condition",
              "if": {
                "exists": "verifyBotId"
              },
              "then": [
                {
                  "type": "context.set",
                  "path": "verifyBotUserId",
                  "value": "{{verifyBotId}}"
                }
              ],
              "else": [
                {
                  "type": "telegram.call",
                  "method": "getMe",
                  "payload": {},
                  "as": "verifyBotInfo"
                },
                {
                  "type": "context.set",
                  "path": "verifyBotUserId",
                  "value": "{{verifyBotInfo.id}}"
                },
                {
                  "type": "state.set",
                  "scope": "global",
                  "key": "bot:id",
                  "value": "{{verifyBotUserId}}"
                }
              ]
            },
            {
              "type": "telegram.call",
              "method": "getChatMember",
              "payload": {
                "chat_id": "{{verifyChat.id}}",
                "user_id": "{{verifyBotUserId}}"
              },
              "as": "verifyBotMember"
            },
            {
              "type": "context.set",
              "path": "verifyMemberCount",
              "value": 0
            },
            {
              "type": "try",
              "actions": [
                {
                  "type": "telegram.call",
                  "method": "getChatMemberCount",
                  "payload": {
                    "chat_id": "{{verifyChat.id}}"
                  },
                  "as": "verifyMemberCount"
                }
              ],
              "catch": [
                {
                  "type": "log.write",
                  "entry": {
                    "level": "warn",
                    "code": "repair.member_count_failed",
                    "detail": "{{verifyChat.id}}"
                  }
                }
              ]
            },
            {
              "type": "context.set",
              "path": "verifyAdminCount",
              "value": 0
            },
            {
              "type": "try",
              "actions": [
                {
                  "type": "telegram.call",
                  "method": "getChatAdministrators",
                  "payload": {
                    "chat_id": "{{verifyChat.id}}",
                    "return_bots": true
                  },
                  "as": "verifyAdminList"
                },
                {
                  "type": "context.set",
                  "path": "verifyAdminCount",
                  "value": {
                    "$expr": {
                      "op": "length",
                      "args": [
                        "{{verifyAdminList}}"
                      ]
                    }
                  }
                }
              ],
              "catch": [
                {
                  "type": "log.write",
                  "entry": {
                    "level": "debug",
                    "code": "repair.admin_list_failed",
                    "detail": "{{verifyChat.id}}"
                  }
                }
              ]
            },
            {
              "type": "context.set",
              "path": "verifyActive",
              "value": true
            },
            {
              "type": "condition",
              "if": {
                "or": [
                  {
                    "eq": [
                      "{{verifyBotMember.status}}",
                      "left"
                    ]
                  },
                  {
                    "eq": [
                      "{{verifyBotMember.status}}",
                      "kicked"
                    ]
                  }
                ]
              },
              "then": [
                {
                  "type": "context.set",
                  "path": "verifyActive",
                  "value": false
                }
              ],
              "else": []
            },
            {
              "type": "context.set",
              "path": "verifyCanSend",
              "value": false
            },
            {
              "type": "condition",
              "if": {
                "eq": [
                  "{{verifyChat.type}}",
                  "channel"
                ]
              },
              "then": [
                {
                  "type": "condition",
                  "if": {
                    "and": [
                      {
                        "in": [
                          "{{verifyBotMember.status}}",
                          [
                            "administrator",
                            "creator"
                          ]
                        ]
                      },
                      {
                        "eq": [
                          "{{verifyBotMember.can_post_messages}}",
                          true
                        ]
                      }
                    ]
                  },
                  "then": [
                    {
                      "type": "context.set",
                      "path": "verifyCanSend",
                      "value": true
                    }
                  ],
                  "else": []
                }
              ],
              "else": [
                {
                  "type": "condition",
                  "if": {
                    "in": [
                      "{{verifyBotMember.status}}",
                      [
                        "member",
                        "administrator",
                        "creator"
                      ]
                    ]
                  },
                  "then": [
                    {
                      "type": "context.set",
                      "path": "verifyCanSend",
                      "value": true
                    }
                  ],
                  "else": []
                },
                {
                  "type": "condition",
                  "if": {
                    "and": [
                      {
                        "eq": [
                          "{{verifyBotMember.status}}",
                          "restricted"
                        ]
                      },
                      {
                        "eq": [
                          "{{verifyBotMember.can_send_messages}}",
                          true
                        ]
                      }
                    ]
                  },
                  "then": [
                    {
                      "type": "context.set",
                      "path": "verifyCanSend",
                      "value": true
                    }
                  ],
                  "else": []
                }
              ]
            },
            {
              "type": "context.set",
              "path": "verifyRecord",
              "value": {
                "id": "{{verifyChat.id}}",
                "title": "{{verifyChat.title}}",
                "username": "{{verifyChat.username}}",
                "type": "{{verifyChat.type}}",
                "active": "{{verifyActive}}",
                "canSend": "{{verifyCanSend}}",
                "botStatus": "{{verifyBotMember.status}}",
                "memberCount": "{{verifyMemberCount}}",
                "adminCount": "{{verifyAdminCount}}",
                "linkedChatId": "{{verifyChat.linked_chat_id}}",
                "isForum": "{{verifyChat.is_forum}}",
                "description": "{{verifyChat.description}}",
                "canPostMessages": "{{verifyBotMember.can_post_messages}}",
                "canRestrictMembers": "{{verifyBotMember.can_restrict_members}}",
                "canDeleteMessages": "{{verifyBotMember.can_delete_messages}}",
                "canInviteUsers": "{{verifyBotMember.can_invite_users}}",
                "canPinMessages": "{{verifyBotMember.can_pin_messages}}",
                "canManageVideoChats": "{{verifyBotMember.can_manage_video_chats}}",
                "permissions": "{{verifyBotMember}}",
                "source": "auto-repair",
                "lastVerifiedAt": "{{runtime.iso}}",
                "updatedAt": "{{runtime.iso}}",
                "verificationState": "verified"
              }
            },
            {
              "type": "state.set",
              "scope": "global",
              "key": "registry:chat:{{verifyChat.id}}",
              "value": "{{verifyRecord}}"
            },
            {
              "type": "condition",
              "if": {
                "eq": [
                  "{{verifyChat.type}}",
                  "channel"
                ]
              },
              "then": [
                {
                  "type": "state.set",
                  "scope": "global",
                  "key": "registry:channels:{{verifyChat.id}}",
                  "value": "{{verifyRecord}}"
                }
              ],
              "else": [
                {
                  "type": "state.set",
                  "scope": "global",
                  "key": "registry:groups:{{verifyChat.id}}",
                  "value": "{{verifyRecord}}"
                }
              ]
            },
            {
              "type": "condition",
              "if": {
                "and": [
                  {
                    "exists": "verifyChat.linked_chat_id"
                  },
                  {
                    "eq": [
                      "{{job.input.depth}}",
                      0
                    ]
                  }
                ]
              },
              "then": [
                {
                  "type": "queue.enqueue",
                  "workflow": "system.verify.target",
                  "input": {
                    "targetId": "{{verifyChat.linked_chat_id}}",
                    "depth": 1,
                    "source": "linked-chat"
                  },
                  "maxAttempts": 3
                }
              ],
              "else": []
            },
            {
              "type": "log.write",
              "entry": {
                "level": "info",
                "code": "repair.target_verified",
                "detail": "{{verifyChat.id}}:{{verifyBotMember.status}}:{{verifyCanSend}}"
              }
            }
          ],
          "catch": [
            {
              "type": "state.get",
              "scope": "global",
              "key": "registry:chat:{{job.input.targetId}}",
              "as": "failedTarget"
            },
            {
              "type": "condition",
              "if": {
                "exists": "failedTarget.id"
              },
              "then": [
                {
                  "type": "state.set",
                  "scope": "global",
                  "key": "registry:chat:{{job.input.targetId}}",
                  "value": {
                    "$expr": {
                      "op": "merge",
                      "args": [
                        "{{failedTarget}}",
                        {
                          "canSend": false,
                          "verificationState": "error",
                          "lastVerificationError": "{{verifyError.message}}",
                          "lastVerifiedAt": "{{runtime.iso}}"
                        }
                      ]
                    }
                  }
                },
                {
                  "type": "condition",
                  "if": {
                    "eq": [
                      "{{failedTarget.type}}",
                      "channel"
                    ]
                  },
                  "then": [
                    {
                      "type": "state.set",
                      "scope": "global",
                      "key": "registry:channels:{{job.input.targetId}}",
                      "value": {
                        "$expr": {
                          "op": "merge",
                          "args": [
                            "{{failedTarget}}",
                            {
                              "canSend": false,
                              "verificationState": "error",
                              "lastVerificationError": "{{verifyError.message}}",
                              "lastVerifiedAt": "{{runtime.iso}}"
                            }
                          ]
                        }
                      }
                    }
                  ],
                  "else": [
                    {
                      "type": "state.set",
                      "scope": "global",
                      "key": "registry:groups:{{job.input.targetId}}",
                      "value": {
                        "$expr": {
                          "op": "merge",
                          "args": [
                            "{{failedTarget}}",
                            {
                              "canSend": false,
                              "verificationState": "error",
                              "lastVerificationError": "{{verifyError.message}}",
                              "lastVerifiedAt": "{{runtime.iso}}"
                            }
                          ]
                        }
                      }
                    }
                  ]
                }
              ]
            },
            {
              "type": "log.write",
              "entry": {
                "level": "error",
                "code": "repair.target_verification_failed",
                "detail": "{{job.input.targetId}}:{{verifyError.message}}"
              }
            }
          ]
        }
      ]
    },
    "system.autorepair": {
      "actions": [
        {
          "type": "runtime.control",
          "operation": "resume"
        },
        {
          "type": "try",
          "actions": [
            {
              "type": "workflow.run",
              "workflow": "system.reconcile"
            }
          ],
          "catch": [
            {
              "type": "log.write",
              "entry": {
                "level": "error",
                "code": "autorepair.reconcile_failed",
                "detail": "{{error.message}}"
              }
            }
          ]
        },
        {
          "type": "state.list",
          "scope": "global",
          "prefix": "registry:chat:",
          "limit": 2000,
          "as": "repairTargets"
        },
        {
          "type": "queue.enqueue",
          "workflow": "system.autorepair.batch",
          "input": {
            "offset": 0
          },
          "maxAttempts": 3
        },
        {
          "type": "queue.enqueue",
          "workflow": "system.autorepair.batch",
          "input": {
            "offset": 500
          },
          "maxAttempts": 3
        },
        {
          "type": "queue.enqueue",
          "workflow": "system.autorepair.batch",
          "input": {
            "offset": 1000
          },
          "maxAttempts": 3
        },
        {
          "type": "queue.enqueue",
          "workflow": "system.autorepair.batch",
          "input": {
            "offset": 1500
          },
          "maxAttempts": 3
        },
        {
          "type": "telegram.call",
          "method": "sendMessage",
          "payload": {
            "chat_id": "{{chat.id}}",
            "parse_mode": "HTML",
            "text": "<b>ترمیم خودکار MUNITOS</b>\n\n✅ پردازش پس‌زمینه فعال شد.\n✅ تنظیمات Telegram و Webhook دوباره اعمال شدند.\n✅ بررسی مقصدهای ثبت‌شده در چهار بستهٔ مستقل به صف بررسی دقیق واگذار شد.\n\n<b>مقصدهای پیدا‌شده:</b> {{repairTargets.count}}\n<b>حداکثر مقصد قابل بررسی در این نوبت:</b> ۲۰۰۰\n\nوضعیت هر مقصد پس از بررسی در فهرست گروه‌ها و کانال‌ها به‌روزرسانی می‌شود.",
            "reply_markup": {
              "inline_keyboard": [
                [
                  {
                    "text": "🧾 مشاهده صف",
                    "callback_data": "ui:owner:queue",
                    "style": "primary"
                  },
                  {
                    "text": "📊 وضعیت سیستم",
                    "callback_data": "ui:owner:status",
                    "style": "primary"
                  }
                ],
                [
                  {
                    "text": "🏠 پنل مدیریت",
                    "callback_data": "ui:owner:home",
                    "style": "primary"
                  }
                ]
              ]
            }
          }
        },
        {
          "type": "log.write",
          "entry": {
            "level": "info",
            "code": "autorepair.started",
            "detail": "{{repairTargets.count}}"
          }
        }
      ]
    },
    "broadcast.prepare.target": {
      "actions": [
        {
          "type": "workflow.run",
          "workflow": "system.verify.target",
          "input": {
            "targetId": "{{job.input.targetId}}",
            "depth": 0,
            "source": "broadcast-preflight"
          }
        },
        {
          "type": "state.get",
          "scope": "global",
          "key": "registry:chat:{{job.input.targetId}}",
          "as": "broadcastTarget"
        },
        {
          "type": "condition",
          "if": {
            "and": [
              {
                "eq": [
                  "{{broadcastTarget.active}}",
                  true
                ]
              },
              {
                "eq": [
                  "{{broadcastTarget.canSend}}",
                  true
                ]
              },
              {
                "eq": [
                  "{{broadcastTarget.verificationState}}",
                  "verified"
                ]
              }
            ]
          },
          "then": [
            {
              "type": "quota.consume",
              "quota": "broadcast",
              "chatId": "{{broadcastTarget.id}}",
              "as": "quotaResult"
            },
            {
              "type": "condition",
              "if": {
                "eq": [
                  "{{quotaResult.allowed}}",
                  true
                ]
              },
              "then": [
                {
                  "type": "queue.enqueue",
                  "workflow": "broadcast.deliver",
                  "input": {
                    "chatId": "{{broadcastTarget.id}}",
                    "fromChatId": "{{job.input.fromChatId}}",
                    "messageId": "{{job.input.messageId}}",
                    "targetTitle": "{{broadcastTarget.title}}"
                  },
                  "maxAttempts": 4
                }
              ],
              "else": []
            }
          ],
          "else": []
        }
      ]
    },
    "system.autorepair.batch": {
      "actions": [
        {
          "type": "state.list",
          "scope": "global",
          "prefix": "registry:chat:",
          "limit": 2000,
          "as": "batchTargets"
        },
        {
          "type": "context.set",
          "path": "batchStart",
          "value": "{{job.input.offset}}"
        },
        {
          "type": "context.set",
          "path": "batchEnd",
          "value": {
            "$expr": {
              "op": "add",
              "args": [
                "{{job.input.offset}}",
                500
              ]
            }
          }
        },
        {
          "type": "each",
          "items": {
            "$expr": {
              "op": "slice",
              "args": [
                "{{batchTargets.items}}",
                "{{batchStart}}",
                "{{batchEnd}}"
              ]
            }
          },
          "as": "batchTarget",
          "limit": 500,
          "actions": [
            {
              "type": "queue.enqueue",
              "workflow": "system.verify.target",
              "input": {
                "targetId": "{{batchTarget.value.id}}",
                "depth": 0,
                "source": "auto-repair"
              },
              "maxAttempts": 4
            }
          ]
        },
        {
          "type": "log.write",
          "entry": {
            "level": "info",
            "code": "autorepair.batch_queued",
            "detail": "{{job.input.offset}}:{{batchEnd}}"
          }
        }
      ]
    },
    "broadcast.prepare.batch": {
      "actions": [
        {
          "type": "state.list",
          "scope": "global",
          "prefix": "registry:chat:",
          "limit": 2000,
          "as": "batchTargets"
        },
        {
          "type": "context.set",
          "path": "batchStart",
          "value": "{{job.input.offset}}"
        },
        {
          "type": "context.set",
          "path": "batchEnd",
          "value": {
            "$expr": {
              "op": "add",
              "args": [
                "{{job.input.offset}}",
                500
              ]
            }
          }
        },
        {
          "type": "each",
          "items": {
            "$expr": {
              "op": "slice",
              "args": [
                "{{batchTargets.items}}",
                "{{batchStart}}",
                "{{batchEnd}}"
              ]
            }
          },
          "as": "batchTarget",
          "limit": 500,
          "actions": [
            {
              "type": "queue.enqueue",
              "workflow": "broadcast.prepare.target",
              "input": {
                "targetId": "{{batchTarget.value.id}}",
                "fromChatId": "{{job.input.fromChatId}}",
                "messageId": "{{job.input.messageId}}"
              },
              "maxAttempts": 3
            }
          ]
        },
        {
          "type": "log.write",
          "entry": {
            "level": "info",
            "code": "broadcast.batch_queued",
            "detail": "{{job.input.offset}}:{{batchEnd}}"
          }
        }
      ]
    },
    "guard.group.admin": {
      "actions": [
        {
          "type": "try",
          "actions": [
            {
              "type": "telegram.call",
              "method": "getChatMember",
              "payload": {
                "chat_id": "{{chat.id}}",
                "user_id": "{{user.id}}"
              },
              "as": "actorStatus"
            }
          ],
          "catch": [
            {
              "type": "context.set",
              "path": "actorStatus",
              "value": {
                "status": "unknown"
              }
            }
          ]
        },
        {
          "type": "condition",
          "if": {
            "in": [
              "{{actorStatus.status}}",
              [
                "creator",
                "administrator"
              ]
            ]
          },
          "then": [],
          "else": [
            {
              "type": "telegram.call",
              "method": "sendMessage",
              "payload": {
                "chat_id": "{{chat.id}}",
                "text": "<b>این بخش فقط برای مدیران واقعی گروه است.</b>",
                "parse_mode": "HTML",
                "link_preview_options": {
                  "is_disabled": true
                }
              }
            },
            {
              "type": "flow.return"
            }
          ]
        }
      ]
    },
    "guard.group.restrict": {
      "actions": [
        {
          "type": "try",
          "actions": [
            {
              "type": "telegram.call",
              "method": "getChatMember",
              "payload": {
                "chat_id": "{{chat.id}}",
                "user_id": "{{user.id}}"
              },
              "as": "actorStatus"
            }
          ],
          "catch": [
            {
              "type": "context.set",
              "path": "actorStatus",
              "value": {
                "status": "unknown"
              }
            }
          ]
        },
        {
          "type": "state.get",
          "scope": "global",
          "key": "bot:id",
          "default": null,
          "as": "botId"
        },
        {
          "type": "condition",
          "if": {
            "eq": [
              "{{botId}}",
              null
            ]
          },
          "then": [
            {
              "type": "telegram.call",
              "method": "getMe",
              "payload": {},
              "as": "botInfo"
            },
            {
              "type": "context.set",
              "path": "botId",
              "value": "{{botInfo.id}}"
            }
          ],
          "else": []
        },
        {
          "type": "try",
          "actions": [
            {
              "type": "telegram.call",
              "method": "getChatMember",
              "payload": {
                "chat_id": "{{chat.id}}",
                "user_id": "{{botId}}"
              },
              "as": "botStatus"
            }
          ],
          "catch": [
            {
              "type": "context.set",
              "path": "botStatus",
              "value": {
                "status": "unknown"
              }
            }
          ]
        },
        {
          "type": "condition",
          "if": {
            "and": [
              {
                "or": [
                  {
                    "eq": [
                      "{{actorStatus.status}}",
                      "creator"
                    ]
                  },
                  {
                    "and": [
                      {
                        "eq": [
                          "{{actorStatus.status}}",
                          "administrator"
                        ]
                      },
                      {
                        "eq": [
                          "{{actorStatus.can_restrict_members}}",
                          true
                        ]
                      }
                    ]
                  }
                ]
              },
              {
                "or": [
                  {
                    "eq": [
                      "{{botStatus.status}}",
                      "creator"
                    ]
                  },
                  {
                    "and": [
                      {
                        "eq": [
                          "{{botStatus.status}}",
                          "administrator"
                        ]
                      },
                      {
                        "eq": [
                          "{{botStatus.can_restrict_members}}",
                          true
                        ]
                      }
                    ]
                  }
                ]
              }
            ]
          },
          "then": [],
          "else": [
            {
              "type": "telegram.call",
              "method": "sendMessage",
              "payload": {
                "chat_id": "{{chat.id}}",
                "text": "<b>دسترسی کافی نیست.</b>\nبرای این عملیات، مدیر گروه باید مجوزهای لازم تلگرام را داشته باشد.",
                "parse_mode": "HTML",
                "link_preview_options": {
                  "is_disabled": true
                }
              }
            },
            {
              "type": "flow.return"
            }
          ]
        }
      ]
    },
    "forcejoin.check": {
      "actions": [
        {
          "type": "context.set",
          "path": "forceJoinTargets",
          "value": []
        },
        {
          "type": "condition",
          "if": {
            "eq": [
              "{{chat.type}}",
              "private"
            ]
          },
          "then": [
            {
              "type": "condition",
              "if": {
                "eq": [
                  "{{owner.isOwner}}",
                  true
                ]
              },
              "then": [],
              "else": [
                {
                  "type": "state.get",
                  "scope": "global",
                  "key": "forcejoin:private:enabled",
                  "default": false,
                  "as": "forceJoinEnabled"
                },
                {
                  "type": "condition",
                  "if": {
                    "eq": [
                      "{{forceJoinEnabled}}",
                      true
                    ]
                  },
                  "then": [
                    {
                      "type": "state.list",
                      "scope": "global",
                      "prefix": "forcejoin:private:targets:",
                      "as": "forceJoinList",
                      "limit": 20
                    },
                    {
                      "type": "context.set",
                      "path": "forceJoinTargets",
                      "value": "{{forceJoinList.items}}"
                    }
                  ],
                  "else": []
                }
              ]
            }
          ],
          "else": [
            {
              "type": "condition",
              "if": {
                "in": [
                  "{{chat.type}}",
                  [
                    "group",
                    "supergroup"
                  ]
                ]
              },
              "then": [
                {
                  "type": "try",
                  "actions": [
                    {
                      "type": "telegram.call",
                      "method": "getChatMember",
                      "payload": {
                        "chat_id": "{{chat.id}}",
                        "user_id": "{{user.id}}"
                      },
                      "as": "forceActor"
                    }
                  ],
                  "catch": [
                    {
                      "type": "context.set",
                      "path": "forceActor",
                      "value": {
                        "status": "unknown"
                      }
                    }
                  ]
                },
                {
                  "type": "condition",
                  "if": {
                    "in": [
                      "{{forceActor.status}}",
                      [
                        "creator",
                        "administrator"
                      ]
                    ]
                  },
                  "then": [],
                  "else": [
                    {
                      "type": "state.get",
                      "scope": "global",
                      "key": "forcejoin:group:{{chat.id}}:enabled",
                      "default": false,
                      "as": "forceJoinEnabled"
                    },
                    {
                      "type": "condition",
                      "if": {
                        "eq": [
                          "{{forceJoinEnabled}}",
                          true
                        ]
                      },
                      "then": [
                        {
                          "type": "state.list",
                          "scope": "global",
                          "prefix": "forcejoin:group:{{chat.id}}:targets:",
                          "as": "forceJoinList",
                          "limit": 20
                        },
                        {
                          "type": "context.set",
                          "path": "forceJoinTargets",
                          "value": "{{forceJoinList.items}}"
                        }
                      ],
                      "else": []
                    }
                  ]
                }
              ],
              "else": []
            }
          ]
        },
        {
          "type": "condition",
          "if": {
            "gt": [
              {
                "$expr": {
                  "op": "length",
                  "args": [
                    "{{forceJoinTargets}}"
                  ]
                }
              },
              0
            ]
          },
          "then": [
            {
              "type": "state.list",
              "scope": "chat_user",
              "prefix": "forcejoin:missing:",
              "as": "oldMissing",
              "limit": 30
            },
            {
              "type": "each",
              "items": "{{oldMissing.items}}",
              "as": "staleMissing",
              "limit": 30,
              "actions": [
                {
                  "type": "state.delete",
                  "scope": "chat_user",
                  "key": "forcejoin:missing:{{staleMissing.key}}"
                }
              ]
            },
            {
              "type": "each",
              "items": "{{forceJoinTargets}}",
              "as": "joinEntry",
              "limit": 20,
              "actions": [
                {
                  "type": "try",
                  "actions": [
                    {
                      "type": "telegram.call",
                      "method": "getChatMember",
                      "payload": {
                        "chat_id": "{{joinEntry.value.id}}",
                        "user_id": "{{user.id}}"
                      },
                      "as": "joinMember"
                    }
                  ],
                  "catch": [
                    {
                      "type": "context.set",
                      "path": "joinMember",
                      "value": {
                        "status": "unknown"
                      }
                    }
                  ]
                },
                {
                  "type": "condition",
                  "if": {
                    "or": [
                      {
                        "in": [
                          "{{joinMember.status}}",
                          [
                            "creator",
                            "administrator",
                            "member"
                          ]
                        ]
                      },
                      {
                        "and": [
                          {
                            "eq": [
                              "{{joinMember.status}}",
                              "restricted"
                            ]
                          },
                          {
                            "eq": [
                              "{{joinMember.is_member}}",
                              true
                            ]
                          }
                        ]
                      }
                    ]
                  },
                  "then": [
                    {
                      "type": "state.delete",
                      "scope": "chat_user",
                      "key": "forcejoin:missing:{{joinEntry.key}}"
                    }
                  ],
                  "else": [
                    {
                      "type": "state.set",
                      "scope": "chat_user",
                      "key": "forcejoin:missing:{{joinEntry.key}}",
                      "value": "{{joinEntry.value}}"
                    }
                  ]
                }
              ]
            },
            {
              "type": "state.list",
              "scope": "chat_user",
              "prefix": "forcejoin:missing:",
              "as": "missingTargets",
              "limit": 20
            },
            {
              "type": "condition",
              "if": {
                "gt": [
                  "{{missingTargets.count}}",
                  0
                ]
              },
              "then": [
                {
                  "type": "condition",
                  "if": {
                    "in": [
                      "{{chat.type}}",
                      [
                        "group",
                        "supergroup"
                      ]
                    ]
                  },
                  "then": [
                    {
                      "type": "try",
                      "actions": [
                        {
                          "type": "telegram.call",
                          "method": "deleteMessage",
                          "payload": {
                            "chat_id": "{{chat.id}}",
                            "message_id": "{{message.message_id}}"
                          }
                        }
                      ],
                      "catch": []
                    }
                  ],
                  "else": []
                },
                {
                  "type": "telegram.call",
                  "method": "sendMessage",
                  "payload": {
                    "chat_id": "{{chat.id}}",
                    "text": {
                      "$expr": {
                        "op": "concat",
                        "args": [
                          "<b>عضویت لازم است</b>\n",
                          {
                            "$expr": {
                              "op": "concat",
                              "args": [
                                "<a href=\"tg://user?id=",
                                "{{user.id}}",
                                "\">",
                                {
                                  "$expr": {
                                    "op": "replace",
                                    "args": [
                                      {
                                        "$expr": {
                                          "op": "replace",
                                          "args": [
                                            {
                                              "$expr": {
                                                "op": "replace",
                                                "args": [
                                                  "{{user.first_name}}",
                                                  "&",
                                                  "&amp;"
                                                ]
                                              }
                                            },
                                            "<",
                                            "&lt;"
                                          ]
                                        }
                                      },
                                      ">",
                                      "&gt;"
                                    ]
                                  }
                                },
                                "</a>"
                              ]
                            }
                          },
                          "، برای ادامه باید در مقصدهای زیر عضو شوید. پس از عضویت، دکمه بررسی را بزنید."
                        ]
                      }
                    },
                    "parse_mode": "HTML",
                    "link_preview_options": {
                      "is_disabled": true
                    }
                  }
                },
                {
                  "type": "each",
                  "items": "{{missingTargets.items}}",
                  "as": "missingEntry",
                  "limit": 20,
                  "actions": [
                    {
                      "type": "telegram.call",
                      "method": "sendMessage",
                      "payload": {
                        "chat_id": "{{chat.id}}",
                        "text": "<b>برای دسترسی به خدمات، در مقصد زیر عضو شوید:</b>",
                        "parse_mode": "HTML",
                        "link_preview_options": {
                          "is_disabled": true
                        },
                        "reply_markup": {
                          "inline_keyboard": [
                            [
                              {
                                "text": "{{missingEntry.value.title}}",
                                "url": "{{missingEntry.value.joinUrl}}",
                                "style": "primary"
                              }
                            ]
                          ]
                        }
                      }
                    }
                  ]
                },
                {
                  "type": "telegram.call",
                  "method": "sendMessage",
                  "payload": {
                    "chat_id": "{{chat.id}}",
                    "text": "<b>پس از عضویت، وضعیت خود را بررسی کنید.</b>",
                    "parse_mode": "HTML",
                    "link_preview_options": {
                      "is_disabled": true
                    },
                    "reply_markup": {
                      "inline_keyboard": [
                        [
                          {
                            "text": "✓ بررسی عضویت",
                            "callback_data": "forcejoin:verify",
                            "style": "success"
                          }
                        ]
                      ]
                    }
                  }
                },
                {
                  "type": "flow.return"
                }
              ],
              "else": [
                {
                  "type": "condition",
                  "if": {
                    "eq": [
                      "{{forceJoinRecheck}}",
                      true
                    ]
                  },
                  "then": [
                    {
                      "type": "telegram.call",
                      "method": "sendMessage",
                      "payload": {
                        "chat_id": "{{chat.id}}",
                        "text": "<b>عضویت تأیید شد.</b> اکنون می‌توانید از ربات استفاده کنید.",
                        "parse_mode": "HTML",
                        "link_preview_options": {
                          "is_disabled": true
                        }
                      }
                    }
                  ],
                  "else": []
                }
              ]
            }
          ],
          "else": []
        }
      ]
    },
    "forcejoin.group.configure": {
      "actions": [
        {
          "type": "state.get",
          "scope": "global",
          "key": "bot:id",
          "default": null,
          "as": "botId"
        },
        {
          "type": "condition",
          "if": {
            "eq": [
              "{{botId}}",
              null
            ]
          },
          "then": [
            {
              "type": "telegram.call",
              "method": "getMe",
              "payload": {},
              "as": "botInfo"
            },
            {
              "type": "context.set",
              "path": "botId",
              "value": "{{botInfo.id}}"
            }
          ],
          "else": []
        },
        {
          "type": "try",
          "actions": [
            {
              "type": "telegram.call",
              "method": "getChatMember",
              "payload": {
                "chat_id": "{{chat.id}}",
                "user_id": "{{botId}}"
              },
              "as": "localBotStatus"
            }
          ],
          "catch": [
            {
              "type": "context.set",
              "path": "localBotStatus",
              "value": {
                "status": "unknown"
              }
            }
          ]
        },
        {
          "type": "condition",
          "if": {
            "or": [
              {
                "eq": [
                  "{{localBotStatus.status}}",
                  "creator"
                ]
              },
              {
                "and": [
                  {
                    "eq": [
                      "{{localBotStatus.status}}",
                      "administrator"
                    ]
                  },
                  {
                    "eq": [
                      "{{localBotStatus.can_delete_messages}}",
                      true
                    ]
                  }
                ]
              }
            ]
          },
          "then": [
            {
              "type": "conversation.start",
              "workflow": "forcejoin.collect",
              "ttlSeconds": 600,
              "input": {
                "scope": "group",
                "groupChatId": "{{chat.id}}"
              }
            },
            {
              "type": "telegram.call",
              "method": "sendMessage",
              "payload": {
                "chat_id": "{{chat.id}}",
                "text": "<b>تنظیم عضویت اجباری گروه</b>\nهر خط یک گروه یا کانال باشد. ربات باید در تمام مقصدها مدیر باشد.\n\nعمومی: <code>@channelname</code>\nخصوصی: <code>-1001234567890 | https://t.me/+invite</code>\n\nبرای اعمال اجباری در همین گروه، ربات باید مجوز حذف پیام اعضا را نیز داشته باشد. ارسال فهرست جدید، فهرست قبلی همین گروه را جایگزین می‌کند.",
                "parse_mode": "HTML",
                "link_preview_options": {
                  "is_disabled": true
                }
              }
            }
          ],
          "else": [
            {
              "type": "telegram.call",
              "method": "sendMessage",
              "payload": {
                "chat_id": "{{chat.id}}",
                "text": "<b>مجوز کافی برای تنظیم وجود ندارد.</b> ربات را در همین گروه مدیر کنید و دسترسی <code>Delete Messages</code> بدهید.",
                "parse_mode": "HTML",
                "link_preview_options": {
                  "is_disabled": true
                }
              }
            }
          ]
        }
      ]
    },
    "forcejoin.private.configure": {
      "actions": [
        {
          "type": "conversation.start",
          "workflow": "forcejoin.collect",
          "ttlSeconds": 600,
          "input": {
            "scope": "private",
            "ownerId": "{{user.id}}"
          }
        },
        {
          "type": "telegram.call",
          "method": "sendMessage",
          "payload": {
            "chat_id": "{{chat.id}}",
            "text": "<b>تنظیم عضویت اجباری کاربران خصوصی</b>\nهر خط یک کانال یا گروه باشد. ربات باید در تمام مقصدها مدیر باشد.\n\nعمومی: <code>@channelname</code>\nخصوصی: <code>-1001234567890 | https://t.me/+invite</code>\n\nفهرست جدید پس از تأیید، جایگزین فهرست قبلی می‌شود.",
            "parse_mode": "HTML",
            "link_preview_options": {
              "is_disabled": true
            }
          }
        }
      ]
    },
    "forcejoin.configure.line": {
      "actions": [
        {
          "type": "context.set",
          "path": "lineParts",
          "value": {
            "$expr": {
              "op": "split",
              "args": [
                {
                  "$expr": {
                    "op": "trim",
                    "args": [
                      "{{line}}"
                    ]
                  }
                },
                "|"
              ]
            }
          }
        },
        {
          "type": "context.set",
          "path": "targetRef",
          "value": {
            "$expr": {
              "op": "trim",
              "args": [
                {
                  "$expr": {
                    "op": "get",
                    "path": "lineParts.0"
                  }
                }
              ]
            }
          }
        },
        {
          "type": "context.set",
          "path": "suppliedInvite",
          "value": {
            "$expr": {
              "op": "trim",
              "args": [
                {
                  "$expr": {
                    "op": "get",
                    "path": "lineParts.1",
                    "default": ""
                  }
                }
              ]
            }
          }
        },
        {
          "type": "condition",
          "if": {
            "ne": [
              "{{targetRef}}",
              ""
            ]
          },
          "then": [
            {
              "type": "try",
              "actions": [
                {
                  "type": "telegram.call",
                  "method": "getChat",
                  "payload": {
                    "chat_id": "{{targetRef}}"
                  },
                  "as": "checkedTarget"
                },
                {
                  "type": "condition",
                  "if": {
                    "in": [
                      "{{checkedTarget.type}}",
                      [
                        "group",
                        "supergroup",
                        "channel"
                      ]
                    ]
                  },
                  "then": [
                    {
                      "type": "state.get",
                      "scope": "global",
                      "key": "bot:id",
                      "default": null,
                      "as": "botId"
                    },
                    {
                      "type": "condition",
                      "if": {
                        "eq": [
                          "{{botId}}",
                          null
                        ]
                      },
                      "then": [
                        {
                          "type": "telegram.call",
                          "method": "getMe",
                          "payload": {},
                          "as": "botInfo"
                        },
                        {
                          "type": "context.set",
                          "path": "botId",
                          "value": "{{botInfo.id}}"
                        }
                      ],
                      "else": []
                    },
                    {
                      "type": "telegram.call",
                      "method": "getChatMember",
                      "payload": {
                        "chat_id": "{{checkedTarget.id}}",
                        "user_id": "{{botId}}"
                      },
                      "as": "targetBotStatus"
                    },
                    {
                      "type": "condition",
                      "if": {
                        "in": [
                          "{{targetBotStatus.status}}",
                          [
                            "administrator",
                            "creator"
                          ]
                        ]
                      },
                      "then": [
                        {
                          "type": "context.set",
                          "path": "joinUrl",
                          "value": ""
                        },
                        {
                          "type": "condition",
                          "if": {
                            "ne": [
                              "{{checkedTarget.username}}",
                              ""
                            ]
                          },
                          "then": [
                            {
                              "type": "context.set",
                              "path": "joinUrl",
                              "value": {
                                "$expr": {
                                  "op": "concat",
                                  "args": [
                                    "https://t.me/",
                                    "{{checkedTarget.username}}"
                                  ]
                                }
                              }
                            }
                          ],
                          "else": [
                            {
                              "type": "condition",
                              "if": {
                                "startsWith": [
                                  "{{suppliedInvite}}",
                                  "https://t.me/"
                                ]
                              },
                              "then": [
                                {
                                  "type": "context.set",
                                  "path": "joinUrl",
                                  "value": "{{suppliedInvite}}"
                                }
                              ],
                              "else": [
                                {
                                  "type": "try",
                                  "actions": [
                                    {
                                      "type": "telegram.call",
                                      "method": "createChatInviteLink",
                                      "payload": {
                                        "chat_id": "{{checkedTarget.id}}",
                                        "name": "MUNITOS required join"
                                      },
                                      "as": "generatedInvite"
                                    },
                                    {
                                      "type": "context.set",
                                      "path": "joinUrl",
                                      "value": "{{generatedInvite.invite_link}}"
                                    }
                                  ],
                                  "catch": [
                                    {
                                      "type": "context.set",
                                      "path": "joinUrl",
                                      "value": ""
                                    }
                                  ]
                                }
                              ]
                            }
                          ]
                        },
                        {
                          "type": "condition",
                          "if": {
                            "ne": [
                              "{{joinUrl}}",
                              ""
                            ]
                          },
                          "then": [
                            {
                              "type": "condition",
                              "if": {
                                "eq": [
                                  "{{conversationInput.scope}}",
                                  "private"
                                ]
                              },
                              "then": [
                                {
                                  "type": "state.set",
                                  "scope": "global",
                                  "key": "forcejoin:pending:private:{{checkedTarget.id}}",
                                  "value": {
                                    "id": "{{checkedTarget.id}}",
                                    "title": "{{checkedTarget.title}}",
                                    "type": "{{checkedTarget.type}}",
                                    "username": "{{checkedTarget.username}}",
                                    "joinUrl": "{{joinUrl}}"
                                  }
                                }
                              ],
                              "else": [
                                {
                                  "type": "state.set",
                                  "scope": "global",
                                  "key": "forcejoin:pending:group:{{conversationInput.groupChatId}}:{{checkedTarget.id}}",
                                  "value": {
                                    "id": "{{checkedTarget.id}}",
                                    "title": "{{checkedTarget.title}}",
                                    "type": "{{checkedTarget.type}}",
                                    "username": "{{checkedTarget.username}}",
                                    "joinUrl": "{{joinUrl}}"
                                  }
                                }
                              ]
                            },
                            {
                              "type": "context.set",
                              "path": "forceJoinAccepted",
                              "value": {
                                "$expr": {
                                  "op": "add",
                                  "args": [
                                    "{{forceJoinAccepted}}",
                                    1
                                  ]
                                }
                              }
                            }
                          ],
                          "else": [
                            {
                              "type": "context.set",
                              "path": "forceJoinRejected",
                              "value": {
                                "$expr": {
                                  "op": "add",
                                  "args": [
                                    "{{forceJoinRejected}}",
                                    1
                                  ]
                                }
                              }
                            }
                          ]
                        }
                      ],
                      "else": [
                        {
                          "type": "context.set",
                          "path": "forceJoinRejected",
                          "value": {
                            "$expr": {
                              "op": "add",
                              "args": [
                                "{{forceJoinRejected}}",
                                1
                              ]
                            }
                          }
                        }
                      ]
                    }
                  ],
                  "else": [
                    {
                      "type": "context.set",
                      "path": "forceJoinRejected",
                      "value": {
                        "$expr": {
                          "op": "add",
                          "args": [
                            "{{forceJoinRejected}}",
                            1
                          ]
                        }
                      }
                    }
                  ]
                }
              ],
              "catch": [
                {
                  "type": "context.set",
                  "path": "forceJoinRejected",
                  "value": {
                    "$expr": {
                      "op": "add",
                      "args": [
                        "{{forceJoinRejected}}",
                        1
                      ]
                    }
                  }
                },
                {
                  "type": "log.write",
                  "entry": {
                    "level": "warn",
                    "code": "forcejoin.target_verification_failed",
                    "detail": "{{line}}:{{error.message}}"
                  }
                }
              ]
            }
          ],
          "else": []
        }
      ]
    },
    "forcejoin.commit": {
      "actions": [
        {
          "type": "condition",
          "if": {
            "eq": [
              "{{conversationInput.scope}}",
              "private"
            ]
          },
          "then": [
            {
              "type": "state.list",
              "scope": "global",
              "prefix": "forcejoin:pending:private:",
              "as": "pendingTargets",
              "limit": 20
            },
            {
              "type": "condition",
              "if": {
                "gt": [
                  "{{pendingTargets.count}}",
                  0
                ]
              },
              "then": [
                {
                  "type": "state.list",
                  "scope": "global",
                  "prefix": "forcejoin:private:targets:",
                  "as": "oldTargets",
                  "limit": 20
                },
                {
                  "type": "each",
                  "items": "{{oldTargets.items}}",
                  "as": "oldTarget",
                  "limit": 20,
                  "actions": [
                    {
                      "type": "state.delete",
                      "scope": "global",
                      "key": "forcejoin:private:targets:{{oldTarget.key}}"
                    }
                  ]
                },
                {
                  "type": "each",
                  "items": "{{pendingTargets.items}}",
                  "as": "pendingTarget",
                  "limit": 20,
                  "actions": [
                    {
                      "type": "state.set",
                      "scope": "global",
                      "key": "forcejoin:private:targets:{{pendingTarget.value.id}}",
                      "value": "{{pendingTarget.value}}"
                    },
                    {
                      "type": "state.delete",
                      "scope": "global",
                      "key": "forcejoin:pending:private:{{pendingTarget.key}}"
                    }
                  ]
                },
                {
                  "type": "state.set",
                  "scope": "global",
                  "key": "forcejoin:private:enabled",
                  "value": true
                }
              ],
              "else": []
            }
          ],
          "else": [
            {
              "type": "state.list",
              "scope": "global",
              "prefix": "forcejoin:pending:group:{{conversationInput.groupChatId}}:",
              "as": "pendingTargets",
              "limit": 20
            },
            {
              "type": "condition",
              "if": {
                "gt": [
                  "{{pendingTargets.count}}",
                  0
                ]
              },
              "then": [
                {
                  "type": "state.list",
                  "scope": "global",
                  "prefix": "forcejoin:group:{{conversationInput.groupChatId}}:targets:",
                  "as": "oldTargets",
                  "limit": 20
                },
                {
                  "type": "each",
                  "items": "{{oldTargets.items}}",
                  "as": "oldTarget",
                  "limit": 20,
                  "actions": [
                    {
                      "type": "state.delete",
                      "scope": "global",
                      "key": "forcejoin:group:{{conversationInput.groupChatId}}:targets:{{oldTarget.key}}"
                    }
                  ]
                },
                {
                  "type": "each",
                  "items": "{{pendingTargets.items}}",
                  "as": "pendingTarget",
                  "limit": 20,
                  "actions": [
                    {
                      "type": "state.set",
                      "scope": "global",
                      "key": "forcejoin:group:{{conversationInput.groupChatId}}:targets:{{pendingTarget.value.id}}",
                      "value": "{{pendingTarget.value}}"
                    },
                    {
                      "type": "state.delete",
                      "scope": "global",
                      "key": "forcejoin:pending:group:{{conversationInput.groupChatId}}:{{pendingTarget.key}}"
                    }
                  ]
                },
                {
                  "type": "state.set",
                  "scope": "global",
                  "key": "forcejoin:group:{{conversationInput.groupChatId}}:enabled",
                  "value": true
                }
              ],
              "else": []
            }
          ]
        }
      ]
    },
    "forcejoin.collect": {
      "actions": [
        {
          "type": "condition",
          "if": {
            "eq": [
              "{{conversationInput.scope}}",
              "private"
            ]
          },
          "then": [
            {
              "type": "state.list",
              "scope": "global",
              "prefix": "forcejoin:pending:private:",
              "as": "pendingStale",
              "limit": 20
            },
            {
              "type": "each",
              "items": "{{pendingStale.items}}",
              "as": "pendingRow",
              "limit": 20,
              "actions": [
                {
                  "type": "state.delete",
                  "scope": "global",
                  "key": "forcejoin:pending:private:{{pendingRow.key}}"
                }
              ]
            }
          ],
          "else": [
            {
              "type": "state.list",
              "scope": "global",
              "prefix": "forcejoin:pending:group:{{conversationInput.groupChatId}}:",
              "as": "pendingStale",
              "limit": 20
            },
            {
              "type": "each",
              "items": "{{pendingStale.items}}",
              "as": "pendingRow",
              "limit": 20,
              "actions": [
                {
                  "type": "state.delete",
                  "scope": "global",
                  "key": "forcejoin:pending:group:{{conversationInput.groupChatId}}:{{pendingRow.key}}"
                }
              ]
            }
          ]
        },
        {
          "type": "context.set",
          "path": "forceJoinAccepted",
          "value": 0
        },
        {
          "type": "context.set",
          "path": "forceJoinRejected",
          "value": 0
        },
        {
          "type": "context.set",
          "path": "inputLines",
          "value": {
            "$expr": {
              "op": "split",
              "args": [
                "{{message.text}}",
                "\n"
              ]
            }
          }
        },
        {
          "type": "each",
          "items": "{{inputLines}}",
          "as": "line",
          "limit": 20,
          "actions": [
            {
              "type": "workflow.run",
              "workflow": "forcejoin.configure.line",
              "input": {
                "line": "{{line}}"
              }
            }
          ]
        },
        {
          "type": "workflow.run",
          "workflow": "forcejoin.commit",
          "input": {}
        },
        {
          "type": "conversation.end"
        },
        {
          "type": "telegram.call",
          "method": "sendMessage",
          "payload": {
            "chat_id": "{{chat.id}}",
            "text": {
              "$expr": {
                "op": "concat",
                "args": [
                  "<b>بررسی فهرست عضویت اجباری پایان یافت.</b>\nتأییدشده: <b>",
                  "{{forceJoinAccepted}}",
                  "</b>\nردشده: <b>",
                  "{{forceJoinRejected}}",
                  "</b>\nفهرست قبلی فقط وقتی جایگزین می‌شود که حداقل یک مقصد معتبر ثبت شده باشد."
                ]
              }
            },
            "parse_mode": "HTML",
            "link_preview_options": {
              "is_disabled": true
            }
          }
        }
      ]
    },
    "forcejoin.clear.group": {
      "actions": [
        {
          "type": "state.list",
          "scope": "global",
          "prefix": "forcejoin:group:{{chat.id}}:targets:",
          "as": "currentTargets",
          "limit": 20
        },
        {
          "type": "each",
          "items": "{{currentTargets.items}}",
          "as": "currentTarget",
          "limit": 20,
          "actions": [
            {
              "type": "state.delete",
              "scope": "global",
              "key": "forcejoin:group:{{chat.id}}:targets:{{currentTarget.key}}"
            }
          ]
        },
        {
          "type": "state.set",
          "scope": "global",
          "key": "forcejoin:group:{{chat.id}}:enabled",
          "value": false
        },
        {
          "type": "telegram.call",
          "method": "sendMessage",
          "payload": {
            "chat_id": "{{chat.id}}",
            "text": "<b>عضویت اجباری این گروه غیرفعال و فهرست آن پاک شد.</b>",
            "parse_mode": "HTML",
            "link_preview_options": {
              "is_disabled": true
            }
          }
        }
      ]
    },
    "forcejoin.clear.private": {
      "actions": [
        {
          "type": "state.list",
          "scope": "global",
          "prefix": "forcejoin:private:targets:",
          "as": "currentTargets",
          "limit": 20
        },
        {
          "type": "each",
          "items": "{{currentTargets.items}}",
          "as": "currentTarget",
          "limit": 20,
          "actions": [
            {
              "type": "state.delete",
              "scope": "global",
              "key": "forcejoin:private:targets:{{currentTarget.key}}"
            }
          ]
        },
        {
          "type": "state.set",
          "scope": "global",
          "key": "forcejoin:private:enabled",
          "value": false
        },
        {
          "type": "telegram.call",
          "method": "sendMessage",
          "payload": {
            "chat_id": "{{chat.id}}",
            "text": "<b>عضویت اجباری کاربران خصوصی غیرفعال و فهرست آن پاک شد.</b>",
            "parse_mode": "HTML",
            "link_preview_options": {
              "is_disabled": true
            }
          }
        }
      ]
    },
    "template.set": {
      "actions": [
        {
          "type": "workflow.run",
          "workflow": "registry.observe",
          "input": {}
        },
        {
          "type": "condition",
          "if": {
            "exists": "reply.message_id"
          },
          "then": [
            {
              "type": "state.set",
              "scope": "chat",
              "key": "{{templateKind}}.source",
              "value": {
                "chat_id": "{{reply.chat.id}}",
                "message_id": "{{reply.message_id}}"
              }
            },
            {
              "type": "state.delete",
              "scope": "chat",
              "key": "{{templateKind}}.text"
            },
            {
              "type": "telegram.call",
              "method": "sendMessage",
              "payload": {
                "chat_id": "{{chat.id}}",
                "text": "<b>پیام و رسانه ذخیره شد.</b> محتوای اصلی همراه قالب‌بندی آن کپی خواهد شد.",
                "parse_mode": "HTML",
                "link_preview_options": {
                  "is_disabled": true
                }
              }
            }
          ],
          "else": [
            {
              "type": "condition",
              "if": {
                "ne": [
                  "{{argsText}}",
                  ""
                ]
              },
              "then": [
                {
                  "type": "state.set",
                  "scope": "chat",
                  "key": "{{templateKind}}.text",
                  "value": "{{argsText}}"
                },
                {
                  "type": "state.delete",
                  "scope": "chat",
                  "key": "{{templateKind}}.source"
                },
                {
                  "type": "telegram.call",
                  "method": "sendMessage",
                  "payload": {
                    "chat_id": "{{chat.id}}",
                    "text": "<b>متن ذخیره شد.</b> برای قالب HTML می‌توانید از تگ‌های مجاز تلگرام استفاده کنید.",
                    "parse_mode": "HTML",
                    "link_preview_options": {
                      "is_disabled": true
                    }
                  }
                }
              ],
              "else": [
                {
                  "type": "conversation.start",
                  "workflow": "template.collect",
                  "ttlSeconds": 600,
                  "input": {
                    "kind": "{{templateKind}}"
                  }
                },
                {
                  "type": "telegram.call",
                  "method": "sendMessage",
                  "payload": {
                    "chat_id": "{{chat.id}}",
                    "text": "<b>محتوای پیام را در پیام بعدی بفرستید.</b> متن، عکس، ویدئو، فایل یا رسانه همراه کپشن پذیرفته می‌شود؛ ساختار اصلی پیام حفظ خواهد شد. برای لغو /cancel را بفرستید.",
                    "parse_mode": "HTML",
                    "link_preview_options": {
                      "is_disabled": true
                    }
                  }
                }
              ]
            }
          ]
        }
      ]
    },
    "template.collect": {
      "actions": [
        {
          "type": "condition",
          "if": {
            "exists": "message.message_id"
          },
          "then": [
            {
              "type": "state.set",
              "scope": "chat",
              "key": "{{conversationInput.kind}}.source",
              "value": {
                "chat_id": "{{message.chat.id}}",
                "message_id": "{{message.message_id}}"
              }
            },
            {
              "type": "state.delete",
              "scope": "chat",
              "key": "{{conversationInput.kind}}.text"
            },
            {
              "type": "conversation.end"
            },
            {
              "type": "telegram.call",
              "method": "sendMessage",
              "payload": {
                "chat_id": "{{chat.id}}",
                "text": "<b>محتوای پیام ذخیره شد.</b> رسانه و قالب‌بندی اصلی حفظ می‌شوند.",
                "parse_mode": "HTML",
                "link_preview_options": {
                  "is_disabled": true
                }
              }
            }
          ],
          "else": [
            {
              "type": "telegram.call",
              "method": "sendMessage",
              "payload": {
                "chat_id": "{{chat.id}}",
                "text": "<b>پیام متنی یا رسانه‌ای دریافت نشد.</b> دوباره محتوا را ارسال کنید.",
                "parse_mode": "HTML",
                "link_preview_options": {
                  "is_disabled": true
                }
              }
            }
          ]
        }
      ]
    },
    "template.reset": {
      "actions": [
        {
          "type": "state.delete",
          "scope": "chat",
          "key": "{{templateKind}}.text"
        },
        {
          "type": "state.delete",
          "scope": "chat",
          "key": "{{templateKind}}.source"
        },
        {
          "type": "telegram.call",
          "method": "sendMessage",
          "payload": {
            "chat_id": "{{chat.id}}",
            "text": "<b>تنظیم پیام بازنشانی شد.</b> مقدار پیش‌فرض دیتابیس استفاده می‌شود.",
            "parse_mode": "HTML",
            "link_preview_options": {
              "is_disabled": true
            }
          }
        }
      ]
    },
    "welcome.deliver": {
      "actions": [
        {
          "type": "context.set",
          "path": "chat",
          "value": {
            "id": "{{job.input.chatId}}",
            "title": "{{job.input.chatTitle}}",
            "username": "{{job.input.chatUsername}}",
            "type": "supergroup"
          }
        },
        {
          "type": "context.set",
          "path": "member",
          "value": "{{job.input.member}}"
        },
        {
          "type": "context.set",
          "path": "memberUsername",
          "value": ""
        },
        {
          "type": "condition",
          "if": {
            "ne": [
              "{{member.username}}",
              ""
            ]
          },
          "then": [
            {
              "type": "context.set",
              "path": "memberUsername",
              "value": {
                "$expr": {
                  "op": "concat",
                  "args": [
                    "@",
                    "{{member.username}}"
                  ]
                }
              }
            }
          ],
          "else": []
        },
        {
          "type": "state.get",
          "scope": "chat",
          "key": "group.rules",
          "default": "",
          "as": "groupRules"
        },
        {
          "type": "context.set",
          "path": "groupInviteLink",
          "value": ""
        },
        {
          "type": "state.get",
          "scope": "chat",
          "key": "group.rules",
          "default": "",
          "as": "groupRules"
        },
        {
          "type": "try",
          "actions": [
            {
              "type": "telegram.call",
              "method": "getChat",
              "payload": {
                "chat_id": "{{chat.id}}"
              },
              "as": "chatInfo"
            },
            {
              "type": "context.set",
              "path": "groupInviteLink",
              "value": "{{chatInfo.invite_link}}"
            }
          ],
          "catch": []
        },
        {
          "type": "state.get",
          "scope": "chat",
          "key": "welcome.enabled",
          "default": true,
          "as": "welcomeEnabled"
        },
        {
          "type": "condition",
          "if": {
            "eq": [
              "{{welcomeEnabled}}",
              true
            ]
          },
          "then": [
            {
              "type": "state.get",
              "scope": "chat",
              "key": "welcome.source",
              "default": null,
              "as": "welcomeSource"
            },
            {
              "type": "state.get",
              "scope": "chat",
              "key": "welcome.text",
              "default": "<b>سلام !mention عزیز!</b>\nبه گروه <b>!groupname</b> خوش اومدی !emoji\n\nامیدواریم کنارمون لحظات خوبی داشته باشی.",
              "as": "welcomeText"
            },
            {
              "type": "condition",
              "if": {
                "exists": "welcomeSource.message_id"
              },
              "then": [
                {
                  "type": "telegram.call",
                  "method": "copyMessage",
                  "payload": {
                    "chat_id": "{{chat.id}}",
                    "from_chat_id": "{{welcomeSource.chat_id}}",
                    "message_id": "{{welcomeSource.message_id}}"
                  }
                }
              ],
              "else": [
                {
                  "type": "telegram.call",
                  "method": "sendMessage",
                  "payload": {
                    "chat_id": "{{chat.id}}",
                    "text": {
                      "$expr": {
                        "op": "replace",
                        "args": [
                          {
                            "$expr": {
                              "op": "replace",
                              "args": [
                                {
                                  "$expr": {
                                    "op": "replace",
                                    "args": [
                                      {
                                        "$expr": {
                                          "op": "replace",
                                          "args": [
                                            {
                                              "$expr": {
                                                "op": "replace",
                                                "args": [
                                                  {
                                                    "$expr": {
                                                      "op": "replace",
                                                      "args": [
                                                        {
                                                          "$expr": {
                                                            "op": "replace",
                                                            "args": [
                                                              {
                                                                "$expr": {
                                                                  "op": "replace",
                                                                  "args": [
                                                                    {
                                                                      "$expr": {
                                                                        "op": "replace",
                                                                        "args": [
                                                                          {
                                                                            "$expr": {
                                                                              "op": "replace",
                                                                              "args": [
                                                                                {
                                                                                  "$expr": {
                                                                                    "op": "replace",
                                                                                    "args": [
                                                                                      "{{templateText}}",
                                                                                      "!mention",
                                                                                      {
                                                                                        "$expr": {
                                                                                          "op": "concat",
                                                                                          "args": [
                                                                                            "<a href=\"tg://user?id=",
                                                                                            "{{member.id}}",
                                                                                            "\">",
                                                                                            {
                                                                                              "$expr": {
                                                                                                "op": "replace",
                                                                                                "args": [
                                                                                                  {
                                                                                                    "$expr": {
                                                                                                      "op": "replace",
                                                                                                      "args": [
                                                                                                        {
                                                                                                          "$expr": {
                                                                                                            "op": "replace",
                                                                                                            "args": [
                                                                                                              "{{member.first_name}}",
                                                                                                              "&",
                                                                                                              "&amp;"
                                                                                                            ]
                                                                                                          }
                                                                                                        },
                                                                                                        "<",
                                                                                                        "&lt;"
                                                                                                      ]
                                                                                                    }
                                                                                                  },
                                                                                                  ">",
                                                                                                  "&gt;"
                                                                                                ]
                                                                                              }
                                                                                            },
                                                                                            "</a>"
                                                                                          ]
                                                                                        }
                                                                                      }
                                                                                    ]
                                                                                  }
                                                                                },
                                                                                "!firstname",
                                                                                "{{member.first_name}}"
                                                                              ]
                                                                            }
                                                                          },
                                                                          "!lastname",
                                                                          "{{member.last_name}}"
                                                                        ]
                                                                      }
                                                                    },
                                                                    "!username",
                                                                    "{{memberUsername}}"
                                                                  ]
                                                                }
                                                              },
                                                              "!userid",
                                                              "{{member.id}}"
                                                            ]
                                                          }
                                                        },
                                                        "!groupname",
                                                        "{{chat.title}}"
                                                      ]
                                                    }
                                                  },
                                                  "!grouplink",
                                                  "{{groupInviteLink}}"
                                                ]
                                              }
                                            },
                                            "!grouprules",
                                            "{{groupRules}}"
                                          ]
                                        }
                                      },
                                      "!date",
                                      {
                                        "$expr": {
                                          "op": "slice",
                                          "args": [
                                            "{{runtime.iso}}",
                                            0,
                                            10
                                          ]
                                        }
                                      }
                                    ]
                                  }
                                },
                                "!time",
                                {
                                  "$expr": {
                                    "op": "slice",
                                    "args": [
                                      "{{runtime.iso}}",
                                      11,
                                      19
                                    ]
                                  }
                                }
                              ]
                            }
                          },
                          "!emoji",
                          "✨"
                        ]
                      }
                    },
                    "parse_mode": "HTML",
                    "link_preview_options": {
                      "is_disabled": true
                    }
                  }
                }
              ]
            }
          ],
          "else": []
        }
      ]
    },
    "goodbye.deliver": {
      "actions": [
        {
          "type": "state.get",
          "scope": "chat",
          "key": "goodbye.enabled",
          "default": true,
          "as": "goodbyeEnabled"
        },
        {
          "type": "context.set",
          "path": "memberUsername",
          "value": ""
        },
        {
          "type": "condition",
          "if": {
            "ne": [
              "{{leftMember.username}}",
              ""
            ]
          },
          "then": [
            {
              "type": "context.set",
              "path": "memberUsername",
              "value": {
                "$expr": {
                  "op": "concat",
                  "args": [
                    "@",
                    "{{leftMember.username}}"
                  ]
                }
              }
            }
          ],
          "else": []
        },
        {
          "type": "state.get",
          "scope": "chat",
          "key": "group.rules",
          "default": "",
          "as": "groupRules"
        },
        {
          "type": "context.set",
          "path": "groupInviteLink",
          "value": ""
        },
        {
          "type": "state.get",
          "scope": "chat",
          "key": "group.rules",
          "default": "",
          "as": "groupRules"
        },
        {
          "type": "try",
          "actions": [
            {
              "type": "telegram.call",
              "method": "getChat",
              "payload": {
                "chat_id": "{{chat.id}}"
              },
              "as": "chatInfo"
            },
            {
              "type": "context.set",
              "path": "groupInviteLink",
              "value": "{{chatInfo.invite_link}}"
            }
          ],
          "catch": []
        },
        {
          "type": "condition",
          "if": {
            "eq": [
              "{{goodbyeEnabled}}",
              true
            ]
          },
          "then": [
            {
              "type": "state.get",
              "scope": "chat",
              "key": "goodbye.source",
              "default": null,
              "as": "goodbyeSource"
            },
            {
              "type": "state.get",
              "scope": "chat",
              "key": "goodbye.text",
              "default": "👋 <b>خدانگهدار !mention</b>\nامیدواریم دوباره ببینیمت.",
              "as": "goodbyeText"
            },
            {
              "type": "condition",
              "if": {
                "exists": "goodbyeSource.message_id"
              },
              "then": [
                {
                  "type": "telegram.call",
                  "method": "copyMessage",
                  "payload": {
                    "chat_id": "{{chat.id}}",
                    "from_chat_id": "{{goodbyeSource.chat_id}}",
                    "message_id": "{{goodbyeSource.message_id}}"
                  }
                }
              ],
              "else": [
                {
                  "type": "telegram.call",
                  "method": "sendMessage",
                  "payload": {
                    "chat_id": "{{chat.id}}",
                    "text": {
                      "$expr": {
                        "op": "replace",
                        "args": [
                          {
                            "$expr": {
                              "op": "replace",
                              "args": [
                                {
                                  "$expr": {
                                    "op": "replace",
                                    "args": [
                                      {
                                        "$expr": {
                                          "op": "replace",
                                          "args": [
                                            {
                                              "$expr": {
                                                "op": "replace",
                                                "args": [
                                                  {
                                                    "$expr": {
                                                      "op": "replace",
                                                      "args": [
                                                        {
                                                          "$expr": {
                                                            "op": "replace",
                                                            "args": [
                                                              {
                                                                "$expr": {
                                                                  "op": "replace",
                                                                  "args": [
                                                                    {
                                                                      "$expr": {
                                                                        "op": "replace",
                                                                        "args": [
                                                                          {
                                                                            "$expr": {
                                                                              "op": "replace",
                                                                              "args": [
                                                                                {
                                                                                  "$expr": {
                                                                                    "op": "replace",
                                                                                    "args": [
                                                                                      "{{templateText}}",
                                                                                      "!mention",
                                                                                      {
                                                                                        "$expr": {
                                                                                          "op": "concat",
                                                                                          "args": [
                                                                                            "<a href=\"tg://user?id=",
                                                                                            "{{leftMember.id}}",
                                                                                            "\">",
                                                                                            {
                                                                                              "$expr": {
                                                                                                "op": "replace",
                                                                                                "args": [
                                                                                                  {
                                                                                                    "$expr": {
                                                                                                      "op": "replace",
                                                                                                      "args": [
                                                                                                        {
                                                                                                          "$expr": {
                                                                                                            "op": "replace",
                                                                                                            "args": [
                                                                                                              "{{leftMember.first_name}}",
                                                                                                              "&",
                                                                                                              "&amp;"
                                                                                                            ]
                                                                                                          }
                                                                                                        },
                                                                                                        "<",
                                                                                                        "&lt;"
                                                                                                      ]
                                                                                                    }
                                                                                                  },
                                                                                                  ">",
                                                                                                  "&gt;"
                                                                                                ]
                                                                                              }
                                                                                            },
                                                                                            "</a>"
                                                                                          ]
                                                                                        }
                                                                                      }
                                                                                    ]
                                                                                  }
                                                                                },
                                                                                "!firstname",
                                                                                "{{leftMember.first_name}}"
                                                                              ]
                                                                            }
                                                                          },
                                                                          "!lastname",
                                                                          "{{leftMember.last_name}}"
                                                                        ]
                                                                      }
                                                                    },
                                                                    "!username",
                                                                    "{{memberUsername}}"
                                                                  ]
                                                                }
                                                              },
                                                              "!userid",
                                                              "{{leftMember.id}}"
                                                            ]
                                                          }
                                                        },
                                                        "!groupname",
                                                        "{{chat.title}}"
                                                      ]
                                                    }
                                                  },
                                                  "!grouplink",
                                                  "{{groupInviteLink}}"
                                                ]
                                              }
                                            },
                                            "!grouprules",
                                            "{{groupRules}}"
                                          ]
                                        }
                                      },
                                      "!date",
                                      {
                                        "$expr": {
                                          "op": "slice",
                                          "args": [
                                            "{{runtime.iso}}",
                                            0,
                                            10
                                          ]
                                        }
                                      }
                                    ]
                                  }
                                },
                                "!time",
                                {
                                  "$expr": {
                                    "op": "slice",
                                    "args": [
                                      "{{runtime.iso}}",
                                      11,
                                      19
                                    ]
                                  }
                                }
                              ]
                            }
                          },
                          "!emoji",
                          "✨"
                        ]
                      }
                    },
                    "parse_mode": "HTML",
                    "link_preview_options": {
                      "is_disabled": true
                    }
                  }
                }
              ]
            }
          ],
          "else": []
        }
      ]
    },
    "moderation.resolve.target": {
      "actions": [
        {
          "type": "context.set",
          "path": "targetId",
          "value": null
        },
        {
          "type": "condition",
          "if": {
            "exists": "reply.from.id"
          },
          "then": [
            {
              "type": "context.set",
              "path": "targetId",
              "value": "{{reply.from.id}}"
            }
          ],
          "else": [
            {
              "type": "condition",
              "if": {
                "startsWith": [
                  {
                    "$expr": {
                      "op": "trim",
                      "args": [
                        "{{argsText}}"
                      ]
                    }
                  },
                  "@"
                ]
              },
              "then": [
                {
                  "type": "state.list",
                  "scope": "global",
                  "prefix": "registry:member:{{chat.id}}:",
                  "as": "knownMembers",
                  "limit": 2000
                },
                {
                  "type": "each",
                  "items": "{{knownMembers.items}}",
                  "as": "knownMember",
                  "limit": 500,
                  "actions": [
                    {
                      "type": "condition",
                      "if": {
                        "eq": [
                          {
                            "$expr": {
                              "op": "lower",
                              "args": [
                                "{{knownMember.value.username}}"
                              ]
                            }
                          },
                          {
                            "$expr": {
                              "op": "lower",
                              "args": [
                                {
                                  "$expr": {
                                    "op": "replace",
                                    "args": [
                                      {
                                        "$expr": {
                                          "op": "trim",
                                          "args": [
                                            "{{argsText}}"
                                          ]
                                        }
                                      },
                                      "@",
                                      ""
                                    ]
                                  }
                                }
                              ]
                            }
                          }
                        ]
                      },
                      "then": [
                        {
                          "type": "context.set",
                          "path": "targetId",
                          "value": "{{knownMember.value.id}}"
                        }
                      ],
                      "else": []
                    }
                  ]
                }
              ],
              "else": [
                {
                  "type": "condition",
                  "if": {
                    "gt": [
                      {
                        "$expr": {
                          "op": "length",
                          "args": [
                            {
                              "$expr": {
                                "op": "trim",
                                "args": [
                                  "{{argsText}}"
                                ]
                              }
                            }
                          ]
                        }
                      },
                      0
                    ]
                  },
                  "then": [
                    {
                      "type": "context.set",
                      "path": "targetId",
                      "value": {
                        "$expr": {
                          "op": "add",
                          "args": [
                            {
                              "$expr": {
                                "op": "trim",
                                "args": [
                                  "{{argsText}}"
                                ]
                              }
                            },
                            0
                          ]
                        }
                      }
                    }
                  ],
                  "else": []
                }
              ]
            }
          ]
        },
        {
          "type": "condition",
          "if": {
            "eq": [
              "{{targetId}}",
              null
            ]
          },
          "then": [
            {
              "type": "telegram.call",
              "method": "sendMessage",
              "payload": {
                "chat_id": "{{chat.id}}",
                "text": "<b>کاربر مشخص نشد.</b> روی پیام او ریپلای کنید یا شناسه عددی/یوزرنیم شناخته‌شده را وارد کنید.",
                "parse_mode": "HTML",
                "link_preview_options": {
                  "is_disabled": true
                }
              }
            },
            {
              "type": "flow.return"
            }
          ],
          "else": []
        }
      ]
    },
    "ui.render.start": {
      "actions": [
        {
          "type": "workflow.run",
          "workflow": "registry.observe",
          "input": {}
        },
        {
          "type": "workflow.run",
          "workflow": "forcejoin.check",
          "input": {}
        },
        {
          "type": "condition",
          "if": {
            "eq": [
              "{{chat.type}}",
              "private"
            ]
          },
          "then": [
            {
              "type": "condition",
              "if": {
                "eq": [
                  "{{owner.isOwner}}",
                  true
                ]
              },
              "then": [
                {
                  "type": "telegram.call",
                  "method": "sendMessage",
                  "payload": {
                    "chat_id": "{{chat.id}}",
                    "text": "{{runtime.app.ui.home.owner.text}}",
                    "parse_mode": "HTML",
                    "reply_markup": {
                      "inline_keyboard": {
                        "$expr": {
                          "op": "get",
                          "path": "runtime.app.ui.home.owner.keyboard"
                        }
                      }
                    }
                  }
                }
              ],
              "else": [
                {
                  "type": "telegram.call",
                  "method": "sendMessage",
                  "payload": {
                    "chat_id": "{{chat.id}}",
                    "text": "{{runtime.app.ui.home.privateUser.text}}",
                    "parse_mode": "HTML",
                    "reply_markup": {
                      "inline_keyboard": {
                        "$expr": {
                          "op": "get",
                          "path": "runtime.app.ui.home.privateUser.keyboard"
                        }
                      }
                    }
                  }
                }
              ]
            }
          ],
          "else": [
            {
              "type": "try",
              "actions": [
                {
                  "type": "telegram.call",
                  "method": "getChatMember",
                  "payload": {
                    "chat_id": "{{chat.id}}",
                    "user_id": "{{user.id}}"
                  },
                  "as": "actorStatus"
                }
              ],
              "catch": [
                {
                  "type": "context.set",
                  "path": "actorStatus",
                  "value": {
                    "status": "unknown"
                  }
                }
              ]
            },
            {
              "type": "condition",
              "if": {
                "in": [
                  "{{actorStatus.status}}",
                  [
                    "creator",
                    "administrator"
                  ]
                ]
              },
              "then": [
                {
                  "type": "telegram.call",
                  "method": "sendMessage",
                  "payload": {
                    "chat_id": "{{chat.id}}",
                    "text": "{{runtime.app.ui.home.groupAdmin.text}}",
                    "parse_mode": "HTML",
                    "reply_markup": {
                      "inline_keyboard": {
                        "$expr": {
                          "op": "get",
                          "path": "runtime.app.ui.home.groupAdmin.keyboard"
                        }
                      }
                    }
                  }
                }
              ],
              "else": [
                {
                  "type": "telegram.call",
                  "method": "sendMessage",
                  "payload": {
                    "chat_id": "{{chat.id}}",
                    "text": "{{runtime.app.ui.home.groupMember.text}}",
                    "parse_mode": "HTML",
                    "reply_markup": {
                      "inline_keyboard": {
                        "$expr": {
                          "op": "get",
                          "path": "runtime.app.ui.home.groupMember.keyboard"
                        }
                      }
                    }
                  }
                }
              ]
            }
          ]
        }
      ]
    },
    "ui.render.help": {
      "actions": [
        {
          "type": "workflow.run",
          "workflow": "forcejoin.check",
          "input": {}
        },
        {
          "type": "condition",
          "if": {
            "eq": [
              "{{chat.type}}",
              "private"
            ]
          },
          "then": [
            {
              "type": "condition",
              "if": {
                "eq": [
                  "{{owner.isOwner}}",
                  true
                ]
              },
              "then": [
                {
                  "type": "telegram.call",
                  "method": "sendMessage",
                  "payload": {
                    "chat_id": "{{chat.id}}",
                    "text": "{{runtime.app.ui.help.text}}",
                    "parse_mode": "HTML",
                    "reply_markup": {
                      "inline_keyboard": {
                        "$expr": {
                          "op": "get",
                          "path": "runtime.app.ui.help.ownerKeyboard"
                        }
                      }
                    }
                  }
                }
              ],
              "else": [
                {
                  "type": "telegram.call",
                  "method": "sendMessage",
                  "payload": {
                    "chat_id": "{{chat.id}}",
                    "text": "{{runtime.app.ui.help.private.text}}",
                    "parse_mode": "HTML",
                    "reply_markup": {
                      "inline_keyboard": {
                        "$expr": {
                          "op": "get",
                          "path": "runtime.app.ui.help.private.keyboard"
                        }
                      }
                    }
                  }
                }
              ]
            }
          ],
          "else": [
            {
              "type": "try",
              "actions": [
                {
                  "type": "telegram.call",
                  "method": "getChatMember",
                  "payload": {
                    "chat_id": "{{chat.id}}",
                    "user_id": "{{user.id}}"
                  },
                  "as": "actorStatus"
                }
              ],
              "catch": [
                {
                  "type": "context.set",
                  "path": "actorStatus",
                  "value": {
                    "status": "unknown"
                  }
                }
              ]
            },
            {
              "type": "condition",
              "if": {
                "in": [
                  "{{actorStatus.status}}",
                  [
                    "creator",
                    "administrator"
                  ]
                ]
              },
              "then": [
                {
                  "type": "telegram.call",
                  "method": "sendMessage",
                  "payload": {
                    "chat_id": "{{chat.id}}",
                    "text": "{{runtime.app.ui.help.groupAdmin.text}}",
                    "parse_mode": "HTML",
                    "reply_markup": {
                      "inline_keyboard": {
                        "$expr": {
                          "op": "get",
                          "path": "runtime.app.ui.help.groupAdmin.keyboard"
                        }
                      }
                    }
                  }
                }
              ],
              "else": [
                {
                  "type": "telegram.call",
                  "method": "sendMessage",
                  "payload": {
                    "chat_id": "{{chat.id}}",
                    "text": "{{runtime.app.ui.help.groupMember.text}}",
                    "parse_mode": "HTML",
                    "reply_markup": {
                      "inline_keyboard": {
                        "$expr": {
                          "op": "get",
                          "path": "runtime.app.ui.help.groupMember.keyboard"
                        }
                      }
                    }
                  }
                }
              ]
            }
          ]
        }
      ]
    },
    "group.panel.render": {
      "actions": [
        {
          "type": "workflow.run",
          "workflow": "guard.group.admin",
          "input": {}
        },
        {
          "type": "state.get",
          "scope": "chat",
          "key": "welcome.enabled",
          "default": true,
          "as": "welcomeEnabled"
        },
        {
          "type": "state.get",
          "scope": "chat",
          "key": "goodbye.enabled",
          "default": true,
          "as": "goodbyeEnabled"
        },
        {
          "type": "state.get",
          "scope": "global",
          "key": "forcejoin:group:{{chat.id}}:enabled",
          "default": false,
          "as": "forceJoinEnabled"
        },
        {
          "type": "state.list",
          "scope": "global",
          "prefix": "forcejoin:group:{{chat.id}}:targets:",
          "as": "forceJoinConfigured",
          "limit": 20
        },
        {
          "type": "context.set",
          "path": "welcomeToggleLabel",
          "value": "👋 خوش‌آمد: وضعیت نامشخص"
        },
        {
          "type": "condition",
          "if": {
            "eq": [
              "{{welcomeEnabled}}",
              true
            ]
          },
          "then": [
            {
              "type": "context.set",
              "path": "welcomeToggleLabel",
              "value": "🟢 خوش‌آمد: روشن"
            }
          ],
          "else": [
            {
              "type": "context.set",
              "path": "welcomeToggleLabel",
              "value": "🔴 خوش‌آمد: خاموش"
            }
          ]
        },
        {
          "type": "context.set",
          "path": "goodbyeToggleLabel",
          "value": "🌙 خداحافظی: وضعیت نامشخص"
        },
        {
          "type": "condition",
          "if": {
            "eq": [
              "{{goodbyeEnabled}}",
              true
            ]
          },
          "then": [
            {
              "type": "context.set",
              "path": "goodbyeToggleLabel",
              "value": "🟢 خداحافظی: روشن"
            }
          ],
          "else": [
            {
              "type": "context.set",
              "path": "goodbyeToggleLabel",
              "value": "🔴 خداحافظی: خاموش"
            }
          ]
        },
        {
          "type": "context.set",
          "path": "forceJoinToggleLabel",
          "value": "🔐 عضویت اجباری: خاموش"
        },
        {
          "type": "condition",
          "if": {
            "eq": [
              "{{forceJoinEnabled}}",
              true
            ]
          },
          "then": [
            {
              "type": "context.set",
              "path": "forceJoinToggleLabel",
              "value": "🟢 عضویت اجباری: روشن"
            }
          ],
          "else": []
        },
        {
          "type": "context.set",
          "path": "forceJoinCount",
          "value": "{{forceJoinConfigured.count}}"
        },
        {
          "type": "context.set",
          "path": "welcomeToggleStyle",
          "value": "danger"
        },
        {
          "type": "condition",
          "if": {
            "eq": [
              "{{welcomeEnabled}}",
              true
            ]
          },
          "then": [
            {
              "type": "context.set",
              "path": "welcomeToggleStyle",
              "value": "success"
            }
          ],
          "else": []
        },
        {
          "type": "context.set",
          "path": "goodbyeToggleStyle",
          "value": "danger"
        },
        {
          "type": "condition",
          "if": {
            "eq": [
              "{{goodbyeEnabled}}",
              true
            ]
          },
          "then": [
            {
              "type": "context.set",
              "path": "goodbyeToggleStyle",
              "value": "success"
            }
          ],
          "else": []
        },
        {
          "type": "context.set",
          "path": "forceJoinToggleStyle",
          "value": "danger"
        },
        {
          "type": "condition",
          "if": {
            "eq": [
              "{{forceJoinEnabled}}",
              true
            ]
          },
          "then": [
            {
              "type": "context.set",
              "path": "forceJoinToggleStyle",
              "value": "success"
            }
          ],
          "else": []
        },
        {
          "type": "condition",
          "if": {
            "exists": "callback.message.message_id"
          },
          "then": [
            {
              "type": "telegram.call",
              "method": "editMessageText",
              "payload": {
                "chat_id": "{{chat.id}}",
                "message_id": "{{message.message_id}}",
                "text": "<b>مدیریت گروه MUNITOS</b>\n\nگروه: <b>{{chat.title}}</b>\nخوش‌آمدگویی: <b>{{welcomeToggleLabel}}</b>\nخداحافظی: <b>{{goodbyeToggleLabel}}</b>\nعضویت اجباری: <b>{{forceJoinToggleLabel}}</b>\nمقصدهای جوین: <b>{{forceJoinCount}}</b>\n\nاز دکمه‌های زیر برای تنظیم پیام‌ها و مدیریت اعضا استفاده کنید. این پنل فقط برای مدیران گروه باز می‌شود.",
                "parse_mode": "HTML",
                "reply_markup": {
                  "inline_keyboard": [
                    [
                      {
                        "text": "✏️ تنظیم خوش‌آمد",
                        "callback_data": "group:welcome:set",
                        "style": "primary"
                      },
                      {
                        "text": "✏️ تنظیم خداحافظی",
                        "callback_data": "group:goodbye:set",
                        "style": "primary"
                      }
                    ],
                    [
                      {
                        "text": "{{welcomeToggleLabel}}",
                        "callback_data": "group:welcome:toggle",
                        "style": "{{welcomeToggleStyle}}"
                      },
                      {
                        "text": "{{goodbyeToggleLabel}}",
                        "callback_data": "group:goodbye:toggle",
                        "style": "{{goodbyeToggleStyle}}"
                      }
                    ],
                    [
                      {
                        "text": "👁 مشاهده پیام خوش‌آمد",
                        "callback_data": "ui:cmd:getwelcome",
                        "style": "primary"
                      },
                      {
                        "text": "👁 مشاهده پیام خداحافظی",
                        "callback_data": "ui:cmd:getgoodbye",
                        "style": "primary"
                      }
                    ],
                    [
                      {
                        "text": "⏱ تأخیر خوش‌آمد",
                        "callback_data": "ui:cmd:setwelcometime",
                        "style": "primary"
                      },
                      {
                        "text": "🖼 رسانه خوش‌آمد",
                        "callback_data": "ui:cmd:setwelcomemedia",
                        "style": "primary"
                      }
                    ],
                    [
                      {
                        "text": "🖼 رسانه خداحافظی",
                        "callback_data": "ui:cmd:setgoodbyemedia",
                        "style": "primary"
                      },
                      {
                        "text": "♻️ بازنشانی پیام‌ها",
                        "callback_data": "group:templates:reset",
                        "style": "danger"
                      }
                    ],
                    [
                      {
                        "text": "{{forceJoinToggleLabel}}",
                        "callback_data": "group:forcejoin:toggle",
                        "style": "{{forceJoinToggleStyle}}"
                      },
                      {
                        "text": "⚙️ تنظیم فهرست جوین",
                        "callback_data": "group:forcejoin",
                        "style": "primary"
                      }
                    ],
                    [
                      {
                        "text": "📋 وضعیت مقصدهای جوین",
                        "callback_data": "group:forcejoin:status",
                        "style": "primary"
                      },
                      {
                        "text": "🧹 پاک‌کردن جوین",
                        "callback_data": "group:forcejoin:clear",
                        "style": "danger"
                      }
                    ],
                    [
                      {
                        "text": "🛡 مدیریت اعضا",
                        "callback_data": "group:moderation",
                        "style": "danger"
                      },
                      {
                        "text": "🔑 راهنمای مجوزها",
                        "callback_data": "group:permissions",
                        "style": "primary"
                      }
                    ],
                    [
                      {
                        "text": "📝 تنظیم پیام ورود ربات",
                        "callback_data": "group:install:set",
                        "style": "primary"
                      },
                      {
                        "text": "👁 مشاهده پیام ورود",
                        "callback_data": "ui:cmd:getinstallmsg",
                        "style": "primary"
                      }
                    ],
                    [
                      {
                        "text": "🔴 بازنشانی پیام ورود",
                        "callback_data": "group:install:reset",
                        "style": "danger"
                      }
                    ],
                    [
                      {
                        "text": "⬅️ راهنما",
                        "callback_data": "ui:help",
                        "style": "primary"
                      }
                    ]
                  ]
                }
              }
            }
          ],
          "else": [
            {
              "type": "telegram.call",
              "method": "sendMessage",
              "payload": {
                "chat_id": "{{chat.id}}",
                "text": "<b>مدیریت گروه MUNITOS</b>\n\nگروه: <b>{{chat.title}}</b>\nخوش‌آمدگویی: <b>{{welcomeToggleLabel}}</b>\nخداحافظی: <b>{{goodbyeToggleLabel}}</b>\nعضویت اجباری: <b>{{forceJoinToggleLabel}}</b>\nمقصدهای جوین: <b>{{forceJoinCount}}</b>\n\nاز دکمه‌های زیر برای تنظیم پیام‌ها و مدیریت اعضا استفاده کنید. این پنل فقط برای مدیران گروه باز می‌شود.",
                "parse_mode": "HTML",
                "link_preview_options": {
                  "is_disabled": true
                },
                "reply_markup": {
                  "inline_keyboard": [
                    [
                      {
                        "text": "✏️ تنظیم خوش‌آمد",
                        "callback_data": "group:welcome:set",
                        "style": "primary"
                      },
                      {
                        "text": "✏️ تنظیم خداحافظی",
                        "callback_data": "group:goodbye:set",
                        "style": "primary"
                      }
                    ],
                    [
                      {
                        "text": "{{welcomeToggleLabel}}",
                        "callback_data": "group:welcome:toggle",
                        "style": "{{welcomeToggleStyle}}"
                      },
                      {
                        "text": "{{goodbyeToggleLabel}}",
                        "callback_data": "group:goodbye:toggle",
                        "style": "{{goodbyeToggleStyle}}"
                      }
                    ],
                    [
                      {
                        "text": "👁 مشاهده پیام خوش‌آمد",
                        "callback_data": "ui:cmd:getwelcome",
                        "style": "primary"
                      },
                      {
                        "text": "👁 مشاهده پیام خداحافظی",
                        "callback_data": "ui:cmd:getgoodbye",
                        "style": "primary"
                      }
                    ],
                    [
                      {
                        "text": "⏱ تأخیر خوش‌آمد",
                        "callback_data": "ui:cmd:setwelcometime",
                        "style": "primary"
                      },
                      {
                        "text": "🖼 رسانه خوش‌آمد",
                        "callback_data": "ui:cmd:setwelcomemedia",
                        "style": "primary"
                      }
                    ],
                    [
                      {
                        "text": "🖼 رسانه خداحافظی",
                        "callback_data": "ui:cmd:setgoodbyemedia",
                        "style": "primary"
                      },
                      {
                        "text": "♻️ بازنشانی پیام‌ها",
                        "callback_data": "group:templates:reset",
                        "style": "danger"
                      }
                    ],
                    [
                      {
                        "text": "{{forceJoinToggleLabel}}",
                        "callback_data": "group:forcejoin:toggle",
                        "style": "{{forceJoinToggleStyle}}"
                      },
                      {
                        "text": "⚙️ تنظیم فهرست جوین",
                        "callback_data": "group:forcejoin",
                        "style": "primary"
                      }
                    ],
                    [
                      {
                        "text": "📋 وضعیت مقصدهای جوین",
                        "callback_data": "group:forcejoin:status",
                        "style": "primary"
                      },
                      {
                        "text": "🧹 پاک‌کردن جوین",
                        "callback_data": "group:forcejoin:clear",
                        "style": "danger"
                      }
                    ],
                    [
                      {
                        "text": "🛡 مدیریت اعضا",
                        "callback_data": "group:moderation",
                        "style": "danger"
                      },
                      {
                        "text": "🔑 راهنمای مجوزها",
                        "callback_data": "group:permissions",
                        "style": "primary"
                      }
                    ],
                    [
                      {
                        "text": "📝 تنظیم پیام ورود ربات",
                        "callback_data": "group:install:set",
                        "style": "primary"
                      },
                      {
                        "text": "👁 مشاهده پیام ورود",
                        "callback_data": "ui:cmd:getinstallmsg",
                        "style": "primary"
                      }
                    ],
                    [
                      {
                        "text": "🔴 بازنشانی پیام ورود",
                        "callback_data": "group:install:reset",
                        "style": "danger"
                      }
                    ],
                    [
                      {
                        "text": "⬅️ راهنما",
                        "callback_data": "ui:help",
                        "style": "primary"
                      }
                    ]
                  ]
                }
              }
            }
          ]
        }
      ]
    }
  },
  "events": [
    {
      "id": "forcejoin.private.message.guard",
      "module": "core",
      "feature": "force_join_private",
      "on": "message",
      "match": {
        "chatTypes": [
          "private"
        ],
        "fromBot": false
      },
      "workflow": "forcejoin.check"
    },
    {
      "id": "forcejoin.group.message.guard",
      "module": "group_management",
      "feature": "force_join_group",
      "on": "message",
      "match": {
        "chatTypes": [
          "group",
          "supergroup"
        ],
        "fromBot": false
      },
      "workflow": "forcejoin.check"
    },
    {
      "id": "welcome.new.members",
      "module": "group_management",
      "feature": "welcome",
      "on": "new_chat_members",
      "match": {
        "chatTypes": [
          "group",
          "supergroup"
        ]
      },
      "actions": [
        {
          "type": "each",
          "items": "{{message.new_chat_members}}",
          "as": "newMember",
          "limit": 100,
          "actions": [
            {
              "type": "state.get",
              "scope": "global",
              "key": "moderation:{{chat.id}}:banned:{{newMember.id}}",
              "default": null,
              "as": "persistentlyBanned"
            },
            {
              "type": "condition",
              "if": {
                "exists": "persistentlyBanned"
              },
              "then": [
                {
                  "type": "try",
                  "actions": [
                    {
                      "type": "telegram.call",
                      "method": "banChatMember",
                      "payload": {
                        "chat_id": "{{chat.id}}",
                        "user_id": "{{newMember.id}}"
                      }
                    }
                  ],
                  "catch": [
                    {
                      "type": "log.write",
                      "entry": {
                        "level": "warn",
                        "code": "moderation.reban_failed",
                        "detail": "{{chat.id}}:{{newMember.id}}:{{error.message}}"
                      }
                    }
                  ]
                }
              ],
              "else": [
                {
                  "type": "state.get",
                  "scope": "chat",
                  "key": "welcome.delaySeconds",
                  "default": 0,
                  "as": "welcomeDelay"
                },
                {
                  "type": "queue.enqueue",
                  "workflow": "welcome.deliver",
                  "delayMs": {
                    "$expr": {
                      "op": "multiply",
                      "args": [
                        "{{welcomeDelay}}",
                        1000
                      ]
                    }
                  },
                  "input": {
                    "chatId": "{{chat.id}}",
                    "chatTitle": "{{chat.title}}",
                    "chatUsername": "{{chat.username}}",
                    "member": "{{newMember}}"
                  }
                }
              ]
            }
          ]
        }
      ]
    },
    {
      "id": "goodbye.left.member",
      "module": "group_management",
      "feature": "goodbye",
      "on": "left_chat_member",
      "match": {
        "chatTypes": [
          "group",
          "supergroup"
        ]
      },
      "actions": [
        {
          "type": "state.get",
          "scope": "global",
          "key": "bot:id",
          "default": null,
          "as": "botId"
        },
        {
          "type": "condition",
          "if": {
            "ne": [
              "{{message.left_chat_member.id}}",
              "{{botId}}"
            ]
          },
          "then": [
            {
              "type": "workflow.run",
              "workflow": "goodbye.deliver",
              "input": {
                "chat": "{{chat}}",
                "leftMember": "{{message.left_chat_member}}"
              }
            }
          ],
          "else": []
        }
      ]
    },
    {
      "id": "system.chat.shared",
      "module": "owner_management",
      "on": "message",
      "match": {
        "condition": {
          "and": [
            {
              "exists": "message.chat_shared.chat_id"
            },
            {
              "in": [
                "{{message.chat_shared.request_id}}",
                [
                  88001,
                  88002
                ]
              ]
            }
          ]
        }
      },
      "actions": [
        {
          "type": "condition",
          "if": {
            "and": [
              {
                "eq": [
                  "{{owner.isOwner}}",
                  true
                ]
              },
              {
                "eq": [
                  "{{chat.type}}",
                  "private"
                ]
              }
            ]
          },
          "then": [
            {
              "type": "context.set",
              "path": "targetCandidate",
              "value": "{{message.chat_shared.chat_id}}"
            },
            {
              "type": "workflow.run",
              "workflow": "system.detect.target",
              "input": {
                "targetCandidate": "{{targetCandidate}}"
              }
            }
          ],
          "else": []
        }
      ]
    },
    {
      "id": "registry.group.edited",
      "module": "group_management",
      "policy": "registerObservedChats",
      "on": "edited_message",
      "match": {
        "chatTypes": [
          "group",
          "supergroup"
        ]
      },
      "actions": [
        {
          "type": "workflow.run",
          "workflow": "registry.observe"
        }
      ]
    },
    {
      "id": "registry.channel.edited",
      "module": "group_management",
      "policy": "registerObservedChats",
      "on": "edited_channel_post",
      "match": {
        "chatTypes": [
          "channel"
        ]
      },
      "actions": [
        {
          "type": "workflow.run",
          "workflow": "registry.observe"
        }
      ]
    },
    {
      "id": "registry.chat.member",
      "module": "group_management",
      "policy": "registerObservedChats",
      "on": "chat_member",
      "match": {
        "chatTypes": [
          "group",
          "supergroup",
          "channel"
        ]
      },
      "actions": [
        {
          "type": "workflow.run",
          "workflow": "registry.observe"
        }
      ]
    },
    {
      "id": "registry.chat.join_request",
      "module": "group_management",
      "policy": "registerObservedChats",
      "on": "chat_join_request",
      "match": {
        "chatTypes": [
          "group",
          "supergroup",
          "channel"
        ]
      },
      "actions": [
        {
          "type": "workflow.run",
          "workflow": "registry.observe"
        }
      ]
    },
    {
      "id": "registry.bot.status",
      "module": "group_management",
      "policy": "registerObservedChats",
      "on": "my_chat_member",
      "match": {
        "chatTypes": [
          "group",
          "supergroup",
          "channel"
        ]
      },
      "workflow": "registry.bot.status"
    },
    {
      "id": "registry.group.message",
      "module": "group_management",
      "policy": "registerObservedChats",
      "on": "message",
      "match": {
        "chatTypes": [
          "group",
          "supergroup"
        ],
        "fromBot": false
      },
      "workflow": "registry.observe"
    },
    {
      "id": "registry.channel.post",
      "module": "channel_management",
      "policy": "registerObservedChats",
      "on": "channel_post",
      "match": {
        "chatTypes": [
          "channel"
        ]
      },
      "workflow": "registry.observe"
    }
  ],
  "callbacks": [
    {
      "id": "ui.myid",
      "module": "core",
      "on": "callback_query",
      "match": {
        "callbackPrefix": "ui:myid"
      },
      "actions": [
        {
          "type": "telegram.call",
          "method": "answerCallbackQuery",
          "payload": {
            "callback_query_id": "{{callback.id}}"
          }
        },
        {
          "type": "telegram.call",
          "method": "sendMessage",
          "payload": {
            "chat_id": "{{chat.id}}",
            "text": {
              "$expr": {
                "op": "concat",
                "args": [
                  "<b>شناسه کاربر:</b> <code>",
                  "{{user.id}}",
                  "</code>\n<b>شناسه گفتگو:</b> <code>",
                  "{{chat.id}}",
                  "</code>"
                ]
              }
            },
            "parse_mode": "HTML",
            "link_preview_options": {
              "is_disabled": true
            }
          }
        }
      ]
    },
    {
      "id": "ui.quota",
      "module": "core",
      "on": "callback_query",
      "match": {
        "callbackPrefix": "ui:quota"
      },
      "actions": [
        {
          "type": "telegram.call",
          "method": "answerCallbackQuery",
          "payload": {
            "callback_query_id": "{{callback.id}}"
          }
        },
        {
          "type": "telegram.call",
          "method": "sendMessage",
          "payload": {
            "chat_id": "{{chat.id}}",
            "text": "برای مشاهده سهمیه، فرمان <code>/quota</code> را ارسال کنید.",
            "parse_mode": "HTML",
            "link_preview_options": {
              "is_disabled": true
            }
          }
        }
      ]
    },
    {
      "id": "group.panel",
      "module": "group_management",
      "on": "callback_query",
      "match": {
        "callbackPrefix": "group:panel"
      },
      "actions": [
        {
          "type": "telegram.call",
          "method": "answerCallbackQuery",
          "payload": {
            "callback_query_id": "{{callback.id}}"
          }
        },
        {
          "type": "workflow.run",
          "workflow": "guard.group.admin",
          "input": {}
        },
        {
          "type": "workflow.run",
          "workflow": "group.panel.render",
          "input": {}
        }
      ]
    },
    {
      "id": "group.forcejoin.configure",
      "module": "group_management",
      "on": "callback_query",
      "match": {
        "callbackPrefix": "group:forcejoin"
      },
      "actions": [
        {
          "type": "telegram.call",
          "method": "answerCallbackQuery",
          "payload": {
            "callback_query_id": "{{callback.id}}"
          }
        },
        {
          "type": "workflow.run",
          "workflow": "guard.group.admin",
          "input": {}
        },
        {
          "type": "workflow.run",
          "workflow": "forcejoin.group.configure",
          "input": {}
        }
      ]
    },
    {
      "id": "group.welcome.set",
      "module": "group_management",
      "on": "callback_query",
      "match": {
        "callbackPrefix": "group:welcome:set"
      },
      "actions": [
        {
          "type": "telegram.call",
          "method": "answerCallbackQuery",
          "payload": {
            "callback_query_id": "{{callback.id}}"
          }
        },
        {
          "type": "workflow.run",
          "workflow": "guard.group.admin",
          "input": {}
        },
        {
          "type": "conversation.start",
          "workflow": "template.collect",
          "ttlSeconds": 600,
          "input": {
            "kind": "welcome"
          }
        },
        {
          "type": "telegram.call",
          "method": "sendMessage",
          "payload": {
            "chat_id": "{{chat.id}}",
            "text": "<b>پیام خوش‌آمد را ارسال کنید.</b> متن یا رسانه را بفرستید؛ برای متن دارای متغیر از <code>/setwelcome متن</code> استفاده کنید.",
            "parse_mode": "HTML",
            "link_preview_options": {
              "is_disabled": true
            }
          }
        }
      ]
    },
    {
      "id": "group.goodbye.set",
      "module": "group_management",
      "on": "callback_query",
      "match": {
        "callbackPrefix": "group:goodbye:set"
      },
      "actions": [
        {
          "type": "telegram.call",
          "method": "answerCallbackQuery",
          "payload": {
            "callback_query_id": "{{callback.id}}"
          }
        },
        {
          "type": "workflow.run",
          "workflow": "guard.group.admin",
          "input": {}
        },
        {
          "type": "conversation.start",
          "workflow": "template.collect",
          "ttlSeconds": 600,
          "input": {
            "kind": "goodbye"
          }
        },
        {
          "type": "telegram.call",
          "method": "sendMessage",
          "payload": {
            "chat_id": "{{chat.id}}",
            "text": "<b>پیام خداحافظی را ارسال کنید.</b> متن یا رسانه را بفرستید.",
            "parse_mode": "HTML",
            "link_preview_options": {
              "is_disabled": true
            }
          }
        }
      ]
    },
    {
      "id": "group.install.set",
      "module": "group_management",
      "on": "callback_query",
      "match": {
        "callbackPrefix": "group:install:set"
      },
      "actions": [
        {
          "type": "telegram.call",
          "method": "answerCallbackQuery",
          "payload": {
            "callback_query_id": "{{callback.id}}"
          }
        },
        {
          "type": "workflow.run",
          "workflow": "guard.group.admin",
          "input": {}
        },
        {
          "type": "conversation.start",
          "workflow": "template.collect",
          "ttlSeconds": 600,
          "input": {
            "kind": "install"
          }
        },
        {
          "type": "telegram.call",
          "method": "sendMessage",
          "payload": {
            "chat_id": "{{chat.id}}",
            "text": "<b>پیام ورود ربات را ارسال کنید.</b> متن یا هر نوع رسانه پذیرفته می‌شود.",
            "parse_mode": "HTML",
            "link_preview_options": {
              "is_disabled": true
            }
          }
        }
      ]
    },
    {
      "id": "group.forcejoin.status",
      "module": "group_management",
      "on": "callback_query",
      "match": {
        "callbackPrefix": "group:forcejoin:status"
      },
      "actions": [
        {
          "type": "telegram.call",
          "method": "answerCallbackQuery",
          "payload": {
            "callback_query_id": "{{callback.id}}"
          }
        },
        {
          "type": "workflow.run",
          "workflow": "guard.group.admin",
          "input": {}
        },
        {
          "type": "state.get",
          "scope": "global",
          "key": "forcejoin:group:{{chat.id}}:enabled",
          "default": false,
          "as": "forceEnabled"
        },
        {
          "type": "state.list",
          "scope": "global",
          "prefix": "forcejoin:group:{{chat.id}}:targets:",
          "as": "forceTargets",
          "limit": 20
        },
        {
          "type": "telegram.call",
          "method": "sendMessage",
          "payload": {
            "chat_id": "{{chat.id}}",
            "text": {
              "$expr": {
                "op": "concat",
                "args": [
                  "<b>عضویت اجباری گروه</b>\nوضعیت: ",
                  {
                    "$expr": {
                      "op": "get",
                      "args": [
                        "{{forceEnabled}}"
                      ]
                    }
                  },
                  "\nتعداد مقصدها: <b>",
                  "{{forceTargets.count}}",
                  "</b>"
                ]
              }
            },
            "parse_mode": "HTML",
            "link_preview_options": {
              "is_disabled": true
            }
          }
        }
      ]
    },
    {
      "id": "group.permissions",
      "module": "group_management",
      "on": "callback_query",
      "match": {
        "callbackPrefix": "group:permissions"
      },
      "actions": [
        {
          "type": "telegram.call",
          "method": "answerCallbackQuery",
          "payload": {
            "callback_query_id": "{{callback.id}}"
          }
        },
        {
          "type": "workflow.run",
          "workflow": "guard.group.admin",
          "input": {}
        },
        {
          "type": "telegram.call",
          "method": "sendMessage",
          "payload": {
            "chat_id": "{{chat.id}}",
            "text": "<b>کنترل سطح دسترسی</b>\nبرای سکوت/بن، مدیر اجراکننده و خود ربات باید دسترسی <code>Restrict Members</code> داشته باشند. برای اجرای عضویت اجباری در همین گروه، ربات به <code>Delete Messages</code> نیز نیاز دارد.",
            "parse_mode": "HTML",
            "link_preview_options": {
              "is_disabled": true
            }
          }
        }
      ]
    },
    {
      "id": "forcejoin.verify",
      "module": "core",
      "on": "callback_query",
      "match": {
        "callbackPrefix": "forcejoin:verify"
      },
      "actions": [
        {
          "type": "telegram.call",
          "method": "answerCallbackQuery",
          "payload": {
            "callback_query_id": "{{callback.id}}",
            "text": "در حال بررسی عضویت…"
          }
        },
        {
          "type": "context.set",
          "path": "forceJoinRecheck",
          "value": true
        },
        {
          "type": "workflow.run",
          "workflow": "forcejoin.check",
          "input": {}
        }
      ]
    },
    {
      "id": "ui.home",
      "module": "core",
      "on": "callback_query",
      "match": {
        "callbackPrefix": "ui:home"
      },
      "actions": [
        {
          "type": "telegram.call",
          "method": "answerCallbackQuery",
          "payload": {
            "callback_query_id": "{{callback.id}}"
          }
        },
        {
          "type": "workflow.run",
          "workflow": "ui.render.start",
          "input": {}
        }
      ]
    },
    {
      "id": "ui.help",
      "module": "core",
      "on": "callback_query",
      "match": {
        "callbackPrefix": "ui:help"
      },
      "actions": [
        {
          "type": "telegram.call",
          "method": "answerCallbackQuery",
          "payload": {
            "callback_query_id": "{{callback.id}}"
          }
        },
        {
          "type": "workflow.run",
          "workflow": "ui.render.help",
          "input": {}
        }
      ]
    },
    {
      "id": "ui.section",
      "module": "core",
      "on": "callback_query",
      "match": {
        "callbackPrefix": "ui:section:"
      },
      "actions": [
        {
          "type": "condition",
          "if": {
            "and": [
              {
                "in": [
                  "{{chat.type}}",
                  [
                    "group",
                    "supergroup"
                  ]
                ]
              },
              {
                "in": [
                  "{{callback.data}}",
                  [
                    "ui:section:welcome",
                    "ui:section:goodbye"
                  ]
                ]
              }
            ]
          },
          "then": [
            {
              "type": "workflow.run",
              "workflow": "guard.group.admin",
              "input": {}
            }
          ],
          "else": []
        },
        {
          "type": "workflow.run",
          "workflow": "forcejoin.check",
          "input": {}
        },
        {
          "type": "telegram.call",
          "method": "answerCallbackQuery",
          "payload": {
            "callback_query_id": "{{callback.id}}"
          }
        },
        {
          "type": "context.set",
          "path": "callbackParts",
          "value": {
            "$expr": {
              "op": "split",
              "args": [
                "{{callback.data}}",
                ":"
              ]
            }
          }
        },
        {
          "type": "context.set",
          "path": "uiSection",
          "value": {
            "$expr": {
              "op": "get",
              "args": [
                "runtime.app.ui.sections.{{callbackParts.2}}"
              ]
            }
          }
        },
        {
          "type": "condition",
          "if": {
            "in": [
              "{{chat.type}}",
              [
                "group",
                "supergroup"
              ]
            ]
          },
          "then": [
            {
              "type": "condition",
              "if": {
                "in": [
                  "{{callbackParts.2}}",
                  [
                    "welcome",
                    "goodbye"
                  ]
                ]
              },
              "then": [
                {
                  "type": "condition",
                  "if": {
                    "eq": [
                      "{{callbackParts.2}}",
                      "welcome"
                    ]
                  },
                  "then": [
                    {
                      "type": "condition",
                      "if": {
                        "eq": [
                          "{{callbackParts.2}}",
                          "welcome"
                        ]
                      },
                      "then": [
                        {
                          "type": "state.get",
                          "scope": "chat",
                          "key": "welcome.enabled",
                          "default": true,
                          "as": "sectionEnabled"
                        },
                        {
                          "type": "condition",
                          "if": {
                            "eq": [
                              "{{sectionEnabled}}",
                              true
                            ]
                          },
                          "then": [
                            {
                              "type": "telegram.call",
                              "method": "editMessageText",
                              "payload": {
                                "chat_id": "{{callback.message.chat.id}}",
                                "message_id": "{{callback.message.message_id}}",
                                "text": "{{uiSection.groupEnabledText}}",
                                "parse_mode": "HTML",
                                "link_preview_options": {
                                  "is_disabled": true
                                },
                                "reply_markup": {
                                  "inline_keyboard": {
                                    "$expr": {
                                      "op": "get",
                                      "path": "uiSection.groupEnabledKeyboard"
                                    }
                                  }
                                }
                              }
                            }
                          ],
                          "else": [
                            {
                              "type": "telegram.call",
                              "method": "editMessageText",
                              "payload": {
                                "chat_id": "{{callback.message.chat.id}}",
                                "message_id": "{{callback.message.message_id}}",
                                "text": "{{uiSection.groupDisabledText}}",
                                "parse_mode": "HTML",
                                "link_preview_options": {
                                  "is_disabled": true
                                },
                                "reply_markup": {
                                  "inline_keyboard": {
                                    "$expr": {
                                      "op": "get",
                                      "path": "uiSection.groupDisabledKeyboard"
                                    }
                                  }
                                }
                              }
                            }
                          ]
                        }
                      ],
                      "else": [
                        {
                          "type": "telegram.call",
                          "method": "editMessageText",
                          "payload": {
                            "chat_id": "{{callback.message.chat.id}}",
                            "message_id": "{{callback.message.message_id}}",
                            "text": "{{uiSection.text}}",
                            "parse_mode": "HTML",
                            "link_preview_options": {
                              "is_disabled": true
                            },
                            "reply_markup": {
                              "inline_keyboard": {
                                "$expr": {
                                  "op": "get",
                                  "path": "uiSection.keyboard"
                                }
                              }
                            }
                          }
                        }
                      ]
                    }
                  ],
                  "else": [
                    {
                      "type": "condition",
                      "if": {
                        "eq": [
                          "{{callbackParts.2}}",
                          "goodbye"
                        ]
                      },
                      "then": [
                        {
                          "type": "state.get",
                          "scope": "chat",
                          "key": "goodbye.enabled",
                          "default": true,
                          "as": "sectionEnabled"
                        },
                        {
                          "type": "condition",
                          "if": {
                            "eq": [
                              "{{sectionEnabled}}",
                              true
                            ]
                          },
                          "then": [
                            {
                              "type": "telegram.call",
                              "method": "editMessageText",
                              "payload": {
                                "chat_id": "{{callback.message.chat.id}}",
                                "message_id": "{{callback.message.message_id}}",
                                "text": "{{uiSection.groupEnabledText}}",
                                "parse_mode": "HTML",
                                "link_preview_options": {
                                  "is_disabled": true
                                },
                                "reply_markup": {
                                  "inline_keyboard": {
                                    "$expr": {
                                      "op": "get",
                                      "path": "uiSection.groupEnabledKeyboard"
                                    }
                                  }
                                }
                              }
                            }
                          ],
                          "else": [
                            {
                              "type": "telegram.call",
                              "method": "editMessageText",
                              "payload": {
                                "chat_id": "{{callback.message.chat.id}}",
                                "message_id": "{{callback.message.message_id}}",
                                "text": "{{uiSection.groupDisabledText}}",
                                "parse_mode": "HTML",
                                "link_preview_options": {
                                  "is_disabled": true
                                },
                                "reply_markup": {
                                  "inline_keyboard": {
                                    "$expr": {
                                      "op": "get",
                                      "path": "uiSection.groupDisabledKeyboard"
                                    }
                                  }
                                }
                              }
                            }
                          ]
                        }
                      ],
                      "else": [
                        {
                          "type": "telegram.call",
                          "method": "editMessageText",
                          "payload": {
                            "chat_id": "{{callback.message.chat.id}}",
                            "message_id": "{{callback.message.message_id}}",
                            "text": "{{uiSection.text}}",
                            "parse_mode": "HTML",
                            "link_preview_options": {
                              "is_disabled": true
                            },
                            "reply_markup": {
                              "inline_keyboard": {
                                "$expr": {
                                  "op": "get",
                                  "path": "uiSection.keyboard"
                                }
                              }
                            }
                          }
                        }
                      ]
                    }
                  ]
                }
              ],
              "else": [
                {
                  "type": "telegram.call",
                  "method": "editMessageText",
                  "payload": {
                    "chat_id": "{{callback.message.chat.id}}",
                    "message_id": "{{callback.message.message_id}}",
                    "text": "{{uiSection.text}}",
                    "parse_mode": "HTML",
                    "link_preview_options": {
                      "is_disabled": true
                    },
                    "reply_markup": {
                      "inline_keyboard": {
                        "$expr": {
                          "op": "get",
                          "path": "uiSection.keyboard"
                        }
                      }
                    }
                  }
                }
              ]
            }
          ],
          "else": [
            {
              "type": "telegram.call",
              "method": "editMessageText",
              "payload": {
                "chat_id": "{{callback.message.chat.id}}",
                "message_id": "{{callback.message.message_id}}",
                "text": "{{uiSection.text}}",
                "parse_mode": "HTML",
                "link_preview_options": {
                  "is_disabled": true
                },
                "reply_markup": {
                  "inline_keyboard": {
                    "$expr": {
                      "op": "get",
                      "path": "uiSection.keyboard"
                    }
                  }
                }
              }
            }
          ]
        }
      ]
    },
    {
      "id": "ui.command",
      "module": "core",
      "on": "callback_query",
      "match": {
        "callbackPrefix": "ui:cmd:"
      },
      "actions": [
        {
          "type": "workflow.run",
          "workflow": "forcejoin.check",
          "input": {}
        },
        {
          "type": "telegram.call",
          "method": "answerCallbackQuery",
          "payload": {
            "callback_query_id": "{{callback.id}}"
          }
        },
        {
          "type": "context.set",
          "path": "callbackParts",
          "value": {
            "$expr": {
              "op": "split",
              "args": [
                "{{callback.data}}",
                ":"
              ]
            }
          }
        },
        {
          "type": "context.set",
          "path": "uiCommand",
          "value": {
            "$expr": {
              "op": "get",
              "args": [
                "runtime.app.ui.commands.{{callbackParts.2}}"
              ]
            }
          }
        },
        {
          "type": "telegram.call",
          "method": "editMessageText",
          "payload": {
            "chat_id": "{{callback.message.chat.id}}",
            "message_id": "{{callback.message.message_id}}",
            "parse_mode": "HTML",
            "text": "<b>{{uiCommand.title}}</b>\n\n{{uiCommand.description}}\n\n<b>فرمان</b>\n<code>{{uiCommand.triggerText}}</code>\n\n<b>نحوه استفاده</b>\n<code>{{uiCommand.usage}}</code>\n\n<b>محدوده دسترسی</b> · {{uiCommand.scopeText}}",
            "reply_markup": {
              "inline_keyboard": [
                [
                  {
                    "text": "⬅️ بازگشت به بخش",
                    "callback_data": "ui:section:{{uiCommand.section}}",
                    "style": "primary"
                  },
                  {
                    "text": "🏠 راهنمای اصلی",
                    "callback_data": "ui:help",
                    "style": "primary"
                  }
                ]
              ]
            }
          }
        }
      ]
    },
    {
      "id": "ui.owner.home",
      "module": "owner_management",
      "on": "callback_query",
      "match": {
        "callbackPrefix": "ui:owner:home"
      },
      "actions": [
        {
          "type": "workflow.run",
          "workflow": "forcejoin.check",
          "input": {}
        },
        {
          "type": "condition",
          "if": {
            "eq": [
              "{{owner.isOwner}}",
              true
            ]
          },
          "then": [
            {
              "type": "telegram.call",
              "method": "answerCallbackQuery",
              "payload": {
                "callback_query_id": "{{callback.id}}"
              }
            },
            {
              "type": "telegram.call",
              "method": "editMessageText",
              "payload": {
                "chat_id": "{{callback.message.chat.id}}",
                "message_id": "{{callback.message.message_id}}",
                "text": "{{runtime.app.ui.owner.home.text}}",
                "parse_mode": "HTML",
                "link_preview_options": {
                  "is_disabled": true
                },
                "reply_markup": {
                  "inline_keyboard": {
                    "$expr": {
                      "op": "get",
                      "path": "runtime.app.ui.owner.home.keyboard"
                    }
                  }
                }
              }
            }
          ],
          "else": [
            {
              "type": "telegram.call",
              "method": "answerCallbackQuery",
              "payload": {
                "callback_query_id": "{{callback.id}}",
                "text": "این بخش فقط برای مالک ربات فعال است.",
                "show_alert": false
              }
            }
          ]
        }
      ]
    },
    {
      "id": "ui.owner.groups.list",
      "module": "owner_management",
      "on": "callback_query",
      "match": {
        "callbackPrefix": "ui:owner:groups:"
      },
      "actions": [
        {
          "type": "workflow.run",
          "workflow": "forcejoin.check",
          "input": {}
        },
        {
          "type": "condition",
          "if": {
            "eq": [
              "{{owner.isOwner}}",
              true
            ]
          },
          "then": [
            {
              "type": "telegram.call",
              "method": "answerCallbackQuery",
              "payload": {
                "callback_query_id": "{{callback.id}}"
              }
            },
            {
              "type": "context.set",
              "path": "callbackParts",
              "value": {
                "$expr": {
                  "op": "split",
                  "args": [
                    "{{callback.data}}",
                    ":"
                  ]
                }
              }
            },
            {
              "type": "workflow.run",
              "workflow": "owner.targets.list",
              "input": {
                "kind": "groups",
                "page": "{{callbackParts.3}}"
              }
            }
          ],
          "else": [
            {
              "type": "telegram.call",
              "method": "answerCallbackQuery",
              "payload": {
                "callback_query_id": "{{callback.id}}",
                "text": "فقط مالک ربات به این بخش دسترسی دارد.",
                "show_alert": false
              }
            }
          ]
        }
      ]
    },
    {
      "id": "ui.owner.channels.list",
      "module": "owner_management",
      "on": "callback_query",
      "match": {
        "callbackPrefix": "ui:owner:channels:"
      },
      "actions": [
        {
          "type": "workflow.run",
          "workflow": "forcejoin.check",
          "input": {}
        },
        {
          "type": "condition",
          "if": {
            "eq": [
              "{{owner.isOwner}}",
              true
            ]
          },
          "then": [
            {
              "type": "telegram.call",
              "method": "answerCallbackQuery",
              "payload": {
                "callback_query_id": "{{callback.id}}"
              }
            },
            {
              "type": "context.set",
              "path": "callbackParts",
              "value": {
                "$expr": {
                  "op": "split",
                  "args": [
                    "{{callback.data}}",
                    ":"
                  ]
                }
              }
            },
            {
              "type": "workflow.run",
              "workflow": "owner.targets.list",
              "input": {
                "kind": "channels",
                "page": "{{callbackParts.3}}"
              }
            }
          ],
          "else": [
            {
              "type": "telegram.call",
              "method": "answerCallbackQuery",
              "payload": {
                "callback_query_id": "{{callback.id}}",
                "text": "فقط مالک ربات به این بخش دسترسی دارد.",
                "show_alert": false
              }
            }
          ]
        }
      ]
    },
    {
      "id": "ui.owner.broadcast",
      "module": "owner_management",
      "on": "callback_query",
      "match": {
        "callbackPrefix": "ui:owner:broadcast"
      },
      "actions": [
        {
          "type": "workflow.run",
          "workflow": "forcejoin.check",
          "input": {}
        },
        {
          "type": "condition",
          "if": {
            "eq": [
              "{{owner.isOwner}}",
              true
            ]
          },
          "then": [
            {
              "type": "telegram.call",
              "method": "answerCallbackQuery",
              "payload": {
                "callback_query_id": "{{callback.id}}"
              }
            },
            {
              "type": "conversation.start",
              "workflow": "broadcast.collect",
              "ttlSeconds": 600,
              "input": {
                "initiatedAt": "{{runtime.iso}}"
              }
            },
            {
              "type": "telegram.call",
              "method": "sendMessage",
              "payload": {
                "chat_id": "{{chat.id}}",
                "text": "📢 پیام یا رسانه موردنظر را در پیام بعدی بفرست. پیش از ارسال، پیش‌نمایش برای تأیید نمایش داده می‌شود.\nبرای لغو /cancel را بفرست."
              }
            }
          ],
          "else": [
            {
              "type": "telegram.call",
              "method": "answerCallbackQuery",
              "payload": {
                "callback_query_id": "{{callback.id}}",
                "text": "فقط مالک ربات به این بخش دسترسی دارد.",
                "show_alert": false
              }
            }
          ]
        }
      ]
    },
    {
      "id": "ui.owner.status",
      "module": "owner_management",
      "on": "callback_query",
      "match": {
        "callbackPrefix": "ui:owner:status"
      },
      "actions": [
        {
          "type": "workflow.run",
          "workflow": "forcejoin.check",
          "input": {}
        },
        {
          "type": "condition",
          "if": {
            "eq": [
              "{{owner.isOwner}}",
              true
            ]
          },
          "then": [
            {
              "type": "telegram.call",
              "method": "answerCallbackQuery",
              "payload": {
                "callback_query_id": "{{callback.id}}"
              }
            },
            {
              "type": "runtime.status",
              "as": "status"
            },
            {
              "type": "telegram.call",
              "method": "editMessageText",
              "payload": {
                "chat_id": "{{callback.message.chat.id}}",
                "message_id": "{{callback.message.message_id}}",
                "text": "<b>◈ MUNITOS RUNTIME</b>\n━━━━━━━━━━━━━━━━━━\nنسخه موتور: <code>{{status.runtimeVersion}}</code>\nنسخه دیتابیس: <code>{{status.databaseVersion}}</code>\nوضعیت توقف: {{status.paused}}\nفرمان‌ها: {{status.commands}}\nWorkflowها: {{status.workflows}}\nAPIها: {{status.apis}}\nرویدادها: {{status.events}}\nصف در انتظار: {{status.queuedJobs}}\nمقصدهای ثبت‌شده: {{status.registeredChats}}",
                "parse_mode": "HTML",
                "link_preview_options": {
                  "is_disabled": true
                },
                "reply_markup": {
                  "inline_keyboard": [
                    [
                      {
                        "text": "🧾 صف پردازش",
                        "callback_data": "ui:owner:queue",
                        "style": "primary"
                      },
                      {
                        "text": "📜 گزارش‌ها",
                        "callback_data": "ui:owner:logs",
                        "style": "primary"
                      }
                    ],
                    [
                      {
                        "text": "🔄 تازه‌سازی",
                        "callback_data": "ui:owner:status",
                        "style": "primary"
                      },
                      {
                        "text": "⬅️ پنل مدیریت",
                        "callback_data": "ui:owner:home",
                        "style": "primary"
                      }
                    ]
                  ]
                }
              }
            }
          ],
          "else": [
            {
              "type": "telegram.call",
              "method": "answerCallbackQuery",
              "payload": {
                "callback_query_id": "{{callback.id}}",
                "text": "فقط مالک ربات به این بخش دسترسی دارد.",
                "show_alert": false
              }
            }
          ]
        }
      ]
    },
    {
      "id": "ui.owner.queue",
      "module": "owner_management",
      "on": "callback_query",
      "match": {
        "callbackPrefix": "ui:owner:queue"
      },
      "actions": [
        {
          "type": "workflow.run",
          "workflow": "forcejoin.check",
          "input": {}
        },
        {
          "type": "condition",
          "if": {
            "eq": [
              "{{owner.isOwner}}",
              true
            ]
          },
          "then": [
            {
              "type": "telegram.call",
              "method": "answerCallbackQuery",
              "payload": {
                "callback_query_id": "{{callback.id}}"
              }
            },
            {
              "type": "queue.stats",
              "as": "queueStats"
            },
            {
              "type": "telegram.call",
              "method": "editMessageText",
              "payload": {
                "chat_id": "{{callback.message.chat.id}}",
                "message_id": "{{callback.message.message_id}}",
                "text": "<b>◈ MUNITOS QUEUE</b>\n━━━━━━━━━━━━━━━━━━\nدر انتظار: <b>{{queueStats.pending}}</b>\nدر حال اجرا: <b>{{queueStats.running}}</b>\nناموفق: <b>{{queueStats.failed}}</b>",
                "parse_mode": "HTML",
                "link_preview_options": {
                  "is_disabled": true
                },
                "reply_markup": {
                  "inline_keyboard": [
                    [
                      {
                        "text": "🔄 تازه‌سازی",
                        "callback_data": "ui:owner:queue",
                        "style": "primary"
                      },
                      {
                        "text": "📊 وضعیت سیستم",
                        "callback_data": "ui:owner:status",
                        "style": "primary"
                      }
                    ],
                    [
                      {
                        "text": "⬅️ پنل مدیریت",
                        "callback_data": "ui:owner:home",
                        "style": "primary"
                      }
                    ]
                  ]
                }
              }
            }
          ],
          "else": [
            {
              "type": "telegram.call",
              "method": "answerCallbackQuery",
              "payload": {
                "callback_query_id": "{{callback.id}}",
                "text": "فقط مالک ربات به این بخش دسترسی دارد.",
                "show_alert": false
              }
            }
          ]
        }
      ]
    },
    {
      "id": "ui.owner.logs",
      "module": "owner_management",
      "on": "callback_query",
      "match": {
        "callbackPrefix": "ui:owner:logs"
      },
      "actions": [
        {
          "type": "workflow.run",
          "workflow": "forcejoin.check",
          "input": {}
        },
        {
          "type": "condition",
          "if": {
            "eq": [
              "{{owner.isOwner}}",
              true
            ]
          },
          "then": [
            {
              "type": "telegram.call",
              "method": "answerCallbackQuery",
              "payload": {
                "callback_query_id": "{{callback.id}}"
              }
            },
            {
              "type": "runtime.logs",
              "limit": 10,
              "as": "logs"
            },
            {
              "type": "telegram.call",
              "method": "editMessageText",
              "payload": {
                "chat_id": "{{callback.message.chat.id}}",
                "message_id": "{{callback.message.message_id}}",
                "text": "<b>◈ MUNITOS LOGS</b>\n━━━━━━━━━━━━━━━━━━\n<code>{{logs}}</code>",
                "parse_mode": "HTML",
                "link_preview_options": {
                  "is_disabled": true
                },
                "reply_markup": {
                  "inline_keyboard": [
                    [
                      {
                        "text": "🔄 تازه‌سازی",
                        "callback_data": "ui:owner:logs",
                        "style": "primary"
                      },
                      {
                        "text": "📊 وضعیت سیستم",
                        "callback_data": "ui:owner:status",
                        "style": "primary"
                      }
                    ],
                    [
                      {
                        "text": "⬅️ پنل مدیریت",
                        "callback_data": "ui:owner:home",
                        "style": "primary"
                      }
                    ]
                  ]
                }
              }
            }
          ],
          "else": [
            {
              "type": "telegram.call",
              "method": "answerCallbackQuery",
              "payload": {
                "callback_query_id": "{{callback.id}}",
                "text": "فقط مالک ربات به این بخش دسترسی دارد.",
                "show_alert": false
              }
            }
          ]
        }
      ]
    },
    {
      "id": "ui.owner.pause",
      "module": "owner_management",
      "on": "callback_query",
      "match": {
        "callbackPrefix": "ui:owner:pause"
      },
      "actions": [
        {
          "type": "workflow.run",
          "workflow": "forcejoin.check",
          "input": {}
        },
        {
          "type": "condition",
          "if": {
            "eq": [
              "{{owner.isOwner}}",
              true
            ]
          },
          "then": [
            {
              "type": "telegram.call",
              "method": "answerCallbackQuery",
              "payload": {
                "callback_query_id": "{{callback.id}}"
              }
            },
            {
              "type": "runtime.control",
              "operation": "pause",
              "reason": "owner panel"
            },
            {
              "type": "telegram.call",
              "method": "editMessageText",
              "payload": {
                "chat_id": "{{callback.message.chat.id}}",
                "message_id": "{{callback.message.message_id}}",
                "text": "⏸ صف و زمان‌بندی‌های پس‌زمینه متوقف شدند.\nدریافت و پردازش فرمان‌های ورودی ادامه دارد.",
                "parse_mode": "HTML",
                "link_preview_options": {
                  "is_disabled": true
                },
                "reply_markup": {
                  "inline_keyboard": [
                    [
                      {
                        "text": "🧾 وضعیت صف",
                        "callback_data": "ui:owner:queue",
                        "style": "primary"
                      },
                      {
                        "text": "📊 وضعیت سیستم",
                        "callback_data": "ui:owner:status",
                        "style": "primary"
                      }
                    ],
                    [
                      {
                        "text": "⬅️ پنل مدیریت",
                        "callback_data": "ui:owner:home",
                        "style": "primary"
                      }
                    ]
                  ]
                }
              }
            }
          ],
          "else": [
            {
              "type": "telegram.call",
              "method": "answerCallbackQuery",
              "payload": {
                "callback_query_id": "{{callback.id}}",
                "text": "فقط مالک ربات به این بخش دسترسی دارد.",
                "show_alert": false
              }
            }
          ]
        }
      ]
    },
    {
      "id": "ui.owner.resume",
      "module": "owner_management",
      "on": "callback_query",
      "match": {
        "callbackPrefix": "ui:owner:resume"
      },
      "actions": [
        {
          "type": "workflow.run",
          "workflow": "forcejoin.check",
          "input": {}
        },
        {
          "type": "condition",
          "if": {
            "eq": [
              "{{owner.isOwner}}",
              true
            ]
          },
          "then": [
            {
              "type": "telegram.call",
              "method": "answerCallbackQuery",
              "payload": {
                "callback_query_id": "{{callback.id}}"
              }
            },
            {
              "type": "runtime.control",
              "operation": "resume"
            },
            {
              "type": "telegram.call",
              "method": "editMessageText",
              "payload": {
                "chat_id": "{{callback.message.chat.id}}",
                "message_id": "{{callback.message.message_id}}",
                "text": "▶️ پردازش صف و زمان‌بندی‌های پس‌زمینه دوباره فعال شد.",
                "parse_mode": "HTML",
                "link_preview_options": {
                  "is_disabled": true
                },
                "reply_markup": {
                  "inline_keyboard": [
                    [
                      {
                        "text": "🧾 وضعیت صف",
                        "callback_data": "ui:owner:queue",
                        "style": "primary"
                      },
                      {
                        "text": "📊 وضعیت سیستم",
                        "callback_data": "ui:owner:status",
                        "style": "primary"
                      }
                    ],
                    [
                      {
                        "text": "⬅️ پنل مدیریت",
                        "callback_data": "ui:owner:home",
                        "style": "primary"
                      }
                    ]
                  ]
                }
              }
            }
          ],
          "else": [
            {
              "type": "telegram.call",
              "method": "answerCallbackQuery",
              "payload": {
                "callback_query_id": "{{callback.id}}",
                "text": "فقط مالک ربات به این بخش دسترسی دارد.",
                "show_alert": false
              }
            }
          ]
        }
      ]
    },
    {
      "id": "ui.owner.target",
      "module": "owner_management",
      "on": "callback_query",
      "match": {
        "callbackPrefix": "ui:target:",
        "condition": {
          "not": {
            "or": [
              {
                "startsWith": [
                  "{{callback.data}}",
                  "ui:target:send:"
                ]
              },
              {
                "startsWith": [
                  "{{callback.data}}",
                  "ui:target:verify:"
                ]
              }
            ]
          }
        }
      },
      "actions": [
        {
          "type": "workflow.run",
          "workflow": "forcejoin.check",
          "input": {}
        },
        {
          "type": "condition",
          "if": {
            "eq": [
              "{{owner.isOwner}}",
              true
            ]
          },
          "then": [
            {
              "type": "telegram.call",
              "method": "answerCallbackQuery",
              "payload": {
                "callback_query_id": "{{callback.id}}"
              }
            },
            {
              "type": "context.set",
              "path": "callbackParts",
              "value": {
                "$expr": {
                  "op": "split",
                  "args": [
                    "{{callback.data}}",
                    ":"
                  ]
                }
              }
            },
            {
              "type": "condition",
              "if": {
                "eq": [
                  "{{callbackParts.2}}",
                  "message"
                ]
              },
              "then": [
                {
                  "type": "conversation.start",
                  "workflow": "owner.target.message.collect",
                  "ttlSeconds": 600,
                  "input": {
                    "targetId": "{{callbackParts.3}}"
                  }
                },
                {
                  "type": "telegram.call",
                  "method": "sendMessage",
                  "payload": {
                    "chat_id": "{{chat.id}}",
                    "text": "✉️ پیام یا رسانه موردنظر برای این مقصد را بفرست. پیش از ارسال، پیش‌نمایش برای تأیید نمایش داده می‌شود."
                  }
                }
              ],
              "else": [
                {
                  "type": "condition",
                  "if": {
                    "eq": [
                      "{{callbackParts.2}}",
                      "plan"
                    ]
                  },
                  "then": [
                    {
                      "type": "state.set",
                      "scope": "global",
                      "key": "plan:{{callbackParts.4}}",
                      "value": "{{callbackParts.3}}"
                    },
                    {
                      "type": "workflow.run",
                      "workflow": "owner.target.show",
                      "input": {
                        "targetId": "{{callbackParts.4}}"
                      }
                    }
                  ],
                  "else": [
                    {
                      "type": "condition",
                      "if": {
                        "eq": [
                          "{{callbackParts.2}}",
                          "toggle"
                        ]
                      },
                      "then": [
                        {
                          "type": "state.get",
                          "scope": "global",
                          "key": "registry:chat:{{callbackParts.3}}",
                          "as": "targetRecord"
                        },
                        {
                          "type": "context.set",
                          "path": "nextActive",
                          "value": {
                            "$expr": {
                              "op": "not",
                              "args": [
                                {
                                  "$expr": {
                                    "op": "get",
                                    "path": "targetRecord.active"
                                  }
                                }
                              ]
                            }
                          }
                        },
                        {
                          "type": "state.set",
                          "scope": "global",
                          "key": "registry:chat:{{callbackParts.3}}",
                          "value": {
                            "$expr": {
                              "op": "merge",
                              "args": [
                                {
                                  "$expr": {
                                    "op": "get",
                                    "path": "targetRecord"
                                  }
                                },
                                {
                                  "active": "{{nextActive}}",
                                  "updatedAt": "{{runtime.iso}}"
                                }
                              ]
                            }
                          }
                        },
                        {
                          "type": "condition",
                          "if": {
                            "eq": [
                              "{{targetRecord.type}}",
                              "channel"
                            ]
                          },
                          "then": [
                            {
                              "type": "state.set",
                              "scope": "global",
                              "key": "registry:channels:{{callbackParts.3}}",
                              "value": {
                                "$expr": {
                                  "op": "merge",
                                  "args": [
                                    {
                                      "$expr": {
                                        "op": "get",
                                        "path": "targetRecord"
                                      }
                                    },
                                    {
                                      "active": "{{nextActive}}",
                                      "updatedAt": "{{runtime.iso}}"
                                    }
                                  ]
                                }
                              }
                            }
                          ],
                          "else": [
                            {
                              "type": "state.set",
                              "scope": "global",
                              "key": "registry:groups:{{callbackParts.3}}",
                              "value": {
                                "$expr": {
                                  "op": "merge",
                                  "args": [
                                    {
                                      "$expr": {
                                        "op": "get",
                                        "path": "targetRecord"
                                      }
                                    },
                                    {
                                      "active": "{{nextActive}}",
                                      "updatedAt": "{{runtime.iso}}"
                                    }
                                  ]
                                }
                              }
                            }
                          ]
                        },
                        {
                          "type": "workflow.run",
                          "workflow": "owner.target.show",
                          "input": {
                            "targetId": "{{callbackParts.3}}"
                          }
                        }
                      ],
                      "else": [
                        {
                          "type": "context.set",
                          "path": "targetId",
                          "value": "{{callbackParts.2}}"
                        },
                        {
                          "type": "workflow.run",
                          "workflow": "owner.target.show",
                          "input": {
                            "targetId": "{{targetId}}"
                          }
                        }
                      ]
                    }
                  ]
                }
              ]
            }
          ],
          "else": [
            {
              "type": "telegram.call",
              "method": "answerCallbackQuery",
              "payload": {
                "callback_query_id": "{{callback.id}}",
                "text": "فقط مالک ربات به این بخش دسترسی دارد.",
                "show_alert": true
              }
            }
          ]
        }
      ]
    },
    {
      "id": "ui.welcome.toggle",
      "module": "group_management",
      "on": "callback_query",
      "match": {
        "callbackPrefix": "ui:welcome:toggle"
      },
      "actions": [
        {
          "type": "workflow.run",
          "workflow": "forcejoin.check",
          "input": {}
        },
        {
          "type": "condition",
          "if": {
            "in": [
              "{{chat.type}}",
              [
                "group",
                "supergroup"
              ]
            ]
          },
          "then": [
            {
              "type": "try",
              "actions": [
                {
                  "type": "telegram.call",
                  "method": "getChatMember",
                  "payload": {
                    "chat_id": "{{chat.id}}",
                    "user_id": "{{user.id}}"
                  },
                  "as": "actorStatus"
                }
              ],
              "catch": [
                {
                  "type": "context.set",
                  "path": "actorStatus",
                  "value": {
                    "status": "unknown"
                  }
                }
              ]
            },
            {
              "type": "condition",
              "if": {
                "in": [
                  "{{actorStatus.status}}",
                  [
                    "creator",
                    "administrator"
                  ]
                ]
              },
              "then": [
                {
                  "type": "state.get",
                  "scope": "chat",
                  "key": "welcome.enabled",
                  "default": true,
                  "as": "toggleEnabled"
                },
                {
                  "type": "condition",
                  "if": {
                    "eq": [
                      "{{toggleEnabled}}",
                      true
                    ]
                  },
                  "then": [
                    {
                      "type": "state.set",
                      "scope": "chat",
                      "key": "welcome.enabled",
                      "value": false
                    },
                    {
                      "type": "telegram.call",
                      "method": "answerCallbackQuery",
                      "payload": {
                        "callback_query_id": "{{callback.id}}",
                        "text": "خوش‌آمدگویی خاموش شد."
                      }
                    },
                    {
                      "type": "telegram.call",
                      "method": "editMessageText",
                      "payload": {
                        "chat_id": "{{callback.message.chat.id}}",
                        "message_id": "{{callback.message.message_id}}",
                        "text": "{{runtime.app.ui.sections.welcome.groupDisabledText}}",
                        "parse_mode": "HTML",
                        "link_preview_options": {
                          "is_disabled": true
                        },
                        "reply_markup": {
                          "inline_keyboard": {
                            "$expr": {
                              "op": "get",
                              "path": "runtime.app.ui.sections.welcome.groupDisabledKeyboard"
                            }
                          }
                        }
                      }
                    }
                  ],
                  "else": [
                    {
                      "type": "state.set",
                      "scope": "chat",
                      "key": "welcome.enabled",
                      "value": true
                    },
                    {
                      "type": "telegram.call",
                      "method": "answerCallbackQuery",
                      "payload": {
                        "callback_query_id": "{{callback.id}}",
                        "text": "خوش‌آمدگویی روشن شد."
                      }
                    },
                    {
                      "type": "telegram.call",
                      "method": "editMessageText",
                      "payload": {
                        "chat_id": "{{callback.message.chat.id}}",
                        "message_id": "{{callback.message.message_id}}",
                        "text": "{{runtime.app.ui.sections.welcome.groupEnabledText}}",
                        "parse_mode": "HTML",
                        "link_preview_options": {
                          "is_disabled": true
                        },
                        "reply_markup": {
                          "inline_keyboard": {
                            "$expr": {
                              "op": "get",
                              "path": "runtime.app.ui.sections.welcome.groupEnabledKeyboard"
                            }
                          }
                        }
                      }
                    }
                  ]
                }
              ],
              "else": [
                {
                  "type": "telegram.call",
                  "method": "answerCallbackQuery",
                  "payload": {
                    "callback_query_id": "{{callback.id}}",
                    "text": "این دکمه فقط برای مالک یا مدیر واقعی گروه فعال است.",
                    "show_alert": true
                  }
                }
              ]
            }
          ],
          "else": [
            {
              "type": "telegram.call",
              "method": "answerCallbackQuery",
              "payload": {
                "callback_query_id": "{{callback.id}}",
                "text": "این گزینه فقط در گروه قابل استفاده است.",
                "show_alert": true
              }
            }
          ]
        }
      ]
    },
    {
      "id": "ui.goodbye.toggle",
      "module": "group_management",
      "on": "callback_query",
      "match": {
        "callbackPrefix": "ui:goodbye:toggle"
      },
      "actions": [
        {
          "type": "workflow.run",
          "workflow": "forcejoin.check",
          "input": {}
        },
        {
          "type": "condition",
          "if": {
            "in": [
              "{{chat.type}}",
              [
                "group",
                "supergroup"
              ]
            ]
          },
          "then": [
            {
              "type": "try",
              "actions": [
                {
                  "type": "telegram.call",
                  "method": "getChatMember",
                  "payload": {
                    "chat_id": "{{chat.id}}",
                    "user_id": "{{user.id}}"
                  },
                  "as": "actorStatus"
                }
              ],
              "catch": [
                {
                  "type": "context.set",
                  "path": "actorStatus",
                  "value": {
                    "status": "unknown"
                  }
                }
              ]
            },
            {
              "type": "condition",
              "if": {
                "in": [
                  "{{actorStatus.status}}",
                  [
                    "creator",
                    "administrator"
                  ]
                ]
              },
              "then": [
                {
                  "type": "state.get",
                  "scope": "chat",
                  "key": "goodbye.enabled",
                  "default": true,
                  "as": "toggleEnabled"
                },
                {
                  "type": "condition",
                  "if": {
                    "eq": [
                      "{{toggleEnabled}}",
                      true
                    ]
                  },
                  "then": [
                    {
                      "type": "state.set",
                      "scope": "chat",
                      "key": "goodbye.enabled",
                      "value": false
                    },
                    {
                      "type": "telegram.call",
                      "method": "answerCallbackQuery",
                      "payload": {
                        "callback_query_id": "{{callback.id}}",
                        "text": "خداحافظی خاموش شد."
                      }
                    },
                    {
                      "type": "telegram.call",
                      "method": "editMessageText",
                      "payload": {
                        "chat_id": "{{callback.message.chat.id}}",
                        "message_id": "{{callback.message.message_id}}",
                        "text": "{{runtime.app.ui.sections.goodbye.groupDisabledText}}",
                        "parse_mode": "HTML",
                        "link_preview_options": {
                          "is_disabled": true
                        },
                        "reply_markup": {
                          "inline_keyboard": {
                            "$expr": {
                              "op": "get",
                              "path": "runtime.app.ui.sections.goodbye.groupDisabledKeyboard"
                            }
                          }
                        }
                      }
                    }
                  ],
                  "else": [
                    {
                      "type": "state.set",
                      "scope": "chat",
                      "key": "goodbye.enabled",
                      "value": true
                    },
                    {
                      "type": "telegram.call",
                      "method": "answerCallbackQuery",
                      "payload": {
                        "callback_query_id": "{{callback.id}}",
                        "text": "خداحافظی روشن شد."
                      }
                    },
                    {
                      "type": "telegram.call",
                      "method": "editMessageText",
                      "payload": {
                        "chat_id": "{{callback.message.chat.id}}",
                        "message_id": "{{callback.message.message_id}}",
                        "text": "{{runtime.app.ui.sections.goodbye.groupEnabledText}}",
                        "parse_mode": "HTML",
                        "link_preview_options": {
                          "is_disabled": true
                        },
                        "reply_markup": {
                          "inline_keyboard": {
                            "$expr": {
                              "op": "get",
                              "path": "runtime.app.ui.sections.goodbye.groupEnabledKeyboard"
                            }
                          }
                        }
                      }
                    }
                  ]
                }
              ],
              "else": [
                {
                  "type": "telegram.call",
                  "method": "answerCallbackQuery",
                  "payload": {
                    "callback_query_id": "{{callback.id}}",
                    "text": "این دکمه فقط برای مالک یا مدیر واقعی گروه فعال است.",
                    "show_alert": true
                  }
                }
              ]
            }
          ],
          "else": [
            {
              "type": "telegram.call",
              "method": "answerCallbackQuery",
              "payload": {
                "callback_query_id": "{{callback.id}}",
                "text": "این گزینه فقط در گروه قابل استفاده است.",
                "show_alert": true
              }
            }
          ]
        }
      ]
    },
    {
      "id": "ui.broadcast.confirm",
      "module": "owner_management",
      "on": "callback_query",
      "match": {
        "callbackPrefix": "ui:broadcast:confirm"
      },
      "actions": [
        {
          "type": "workflow.run",
          "workflow": "forcejoin.check",
          "input": {}
        },
        {
          "type": "condition",
          "if": {
            "eq": [
              "{{owner.isOwner}}",
              true
            ]
          },
          "then": [
            {
              "type": "telegram.call",
              "method": "answerCallbackQuery",
              "payload": {
                "callback_query_id": "{{callback.id}}"
              }
            },
            {
              "type": "workflow.run",
              "workflow": "broadcast.enqueue",
              "input": {}
            }
          ],
          "else": [
            {
              "type": "telegram.call",
              "method": "answerCallbackQuery",
              "payload": {
                "callback_query_id": "{{callback.id}}",
                "text": "فقط مالک ربات می‌تواند ارسال همگانی را تأیید کند.",
                "show_alert": true
              }
            }
          ]
        }
      ]
    },
    {
      "id": "ui.broadcast.cancel",
      "module": "owner_management",
      "on": "callback_query",
      "match": {
        "callbackPrefix": "ui:broadcast:cancel"
      },
      "actions": [
        {
          "type": "workflow.run",
          "workflow": "forcejoin.check",
          "input": {}
        },
        {
          "type": "condition",
          "if": {
            "eq": [
              "{{owner.isOwner}}",
              true
            ]
          },
          "then": [
            {
              "type": "telegram.call",
              "method": "answerCallbackQuery",
              "payload": {
                "callback_query_id": "{{callback.id}}"
              }
            },
            {
              "type": "state.delete",
              "scope": "user",
              "key": "broadcast.pending"
            },
            {
              "type": "telegram.call",
              "method": "editMessageText",
              "payload": {
                "chat_id": "{{callback.message.chat.id}}",
                "message_id": "{{callback.message.message_id}}",
                "text": "✖️ ارسال همگانی لغو شد.",
                "reply_markup": {
                  "inline_keyboard": [
                    [
                      {
                        "text": "⚙️ پنل مدیریت",
                        "callback_data": "ui:owner:home",
                        "style": "primary"
                      }
                    ]
                  ]
                }
              }
            }
          ],
          "else": [
            {
              "type": "telegram.call",
              "method": "answerCallbackQuery",
              "payload": {
                "callback_query_id": "{{callback.id}}",
                "text": "فقط مالک ربات می‌تواند این عملیات را لغو کند.",
                "show_alert": true
              }
            }
          ]
        }
      ]
    },
    {
      "id": "ui.target.send",
      "module": "owner_management",
      "on": "callback_query",
      "match": {
        "callbackPrefix": "ui:target:send:"
      },
      "actions": [
        {
          "type": "workflow.run",
          "workflow": "forcejoin.check",
          "input": {}
        },
        {
          "type": "condition",
          "if": {
            "eq": [
              "{{owner.isOwner}}",
              true
            ]
          },
          "then": [
            {
              "type": "context.set",
              "path": "callbackParts",
              "value": {
                "$expr": {
                  "op": "split",
                  "args": [
                    "{{callback.data}}",
                    ":"
                  ]
                }
              }
            },
            {
              "type": "condition",
              "if": {
                "eq": [
                  "{{callbackParts.3}}",
                  "confirm"
                ]
              },
              "then": [
                {
                  "type": "state.get",
                  "scope": "user",
                  "key": "target.message.pending",
                  "as": "pendingTargetMessage"
                },
                {
                  "type": "condition",
                  "if": {
                    "exists": "pendingTargetMessage.targetId"
                  },
                  "then": [
                    {
                      "type": "telegram.call",
                      "method": "answerCallbackQuery",
                      "payload": {
                        "callback_query_id": "{{callback.id}}"
                      }
                    },
                    {
                      "type": "telegram.call",
                      "method": "copyMessage",
                      "payload": {
                        "chat_id": "{{pendingTargetMessage.targetId}}",
                        "from_chat_id": "{{pendingTargetMessage.sourceChatId}}",
                        "message_id": "{{pendingTargetMessage.sourceMessageId}}"
                      }
                    },
                    {
                      "type": "state.delete",
                      "scope": "user",
                      "key": "target.message.pending"
                    },
                    {
                      "type": "telegram.call",
                      "method": "editMessageText",
                      "payload": {
                        "chat_id": "{{callback.message.chat.id}}",
                        "message_id": "{{callback.message.message_id}}",
                        "text": "✅ پیام اختصاصی ارسال شد.",
                        "reply_markup": {
                          "inline_keyboard": [
                            [
                              {
                                "text": "⚙️ پنل مدیریت",
                                "callback_data": "ui:owner:home",
                                "style": "primary"
                              }
                            ]
                          ]
                        }
                      }
                    }
                  ],
                  "else": [
                    {
                      "type": "telegram.call",
                      "method": "answerCallbackQuery",
                      "payload": {
                        "callback_query_id": "{{callback.id}}",
                        "text": "پیش‌نمایش فعالی پیدا نشد.",
                        "show_alert": true
                      }
                    }
                  ]
                }
              ],
              "else": [
                {
                  "type": "telegram.call",
                  "method": "answerCallbackQuery",
                  "payload": {
                    "callback_query_id": "{{callback.id}}"
                  }
                },
                {
                  "type": "state.delete",
                  "scope": "user",
                  "key": "target.message.pending"
                },
                {
                  "type": "telegram.call",
                  "method": "editMessageText",
                  "payload": {
                    "chat_id": "{{callback.message.chat.id}}",
                    "message_id": "{{callback.message.message_id}}",
                    "text": "✖️ ارسال پیام اختصاصی لغو شد.",
                    "reply_markup": {
                      "inline_keyboard": [
                        [
                          {
                            "text": "⚙️ پنل مدیریت",
                            "callback_data": "ui:owner:home",
                            "style": "primary"
                          }
                        ]
                      ]
                    }
                  }
                }
              ]
            }
          ],
          "else": [
            {
              "type": "telegram.call",
              "method": "answerCallbackQuery",
              "payload": {
                "callback_query_id": "{{callback.id}}",
                "text": "فقط مالک ربات می‌تواند این عملیات را انجام دهد.",
                "show_alert": true
              }
            }
          ]
        }
      ]
    },
    {
      "id": "ui.owner.detect",
      "on": "callback_query",
      "match": {
        "callbackPrefix": "ui:owner:detect"
      },
      "actions": [
        {
          "type": "workflow.run",
          "workflow": "forcejoin.check",
          "input": {}
        },
        {
          "type": "condition",
          "if": {
            "eq": [
              "{{owner.isOwner}}",
              true
            ]
          },
          "then": [
            {
              "type": "telegram.call",
              "method": "answerCallbackQuery",
              "payload": {
                "callback_query_id": "{{callback.id}}"
              }
            },
            {
              "type": "workflow.run",
              "workflow": "system.detect.prompt"
            }
          ],
          "else": [
            {
              "type": "telegram.call",
              "method": "answerCallbackQuery",
              "payload": {
                "callback_query_id": "{{callback.id}}",
                "text": "این بخش فقط برای مالک ربات فعال است.",
                "show_alert": true
              }
            }
          ]
        }
      ]
    },
    {
      "id": "ui.owner.repair",
      "on": "callback_query",
      "match": {
        "callbackPrefix": "ui:owner:repair"
      },
      "actions": [
        {
          "type": "workflow.run",
          "workflow": "forcejoin.check",
          "input": {}
        },
        {
          "type": "condition",
          "if": {
            "eq": [
              "{{owner.isOwner}}",
              true
            ]
          },
          "then": [
            {
              "type": "telegram.call",
              "method": "answerCallbackQuery",
              "payload": {
                "callback_query_id": "{{callback.id}}"
              }
            },
            {
              "type": "workflow.run",
              "workflow": "system.autorepair"
            }
          ],
          "else": [
            {
              "type": "telegram.call",
              "method": "answerCallbackQuery",
              "payload": {
                "callback_query_id": "{{callback.id}}",
                "text": "این بخش فقط برای مالک ربات فعال است.",
                "show_alert": true
              }
            }
          ]
        }
      ]
    },
    {
      "id": "ui.owner.target.verify",
      "module": "owner_management",
      "on": "callback_query",
      "match": {
        "callbackPrefix": "ui:target:verify:"
      },
      "actions": [
        {
          "type": "workflow.run",
          "workflow": "forcejoin.check",
          "input": {}
        },
        {
          "type": "condition",
          "if": {
            "eq": [
              "{{owner.isOwner}}",
              true
            ]
          },
          "then": [
            {
              "type": "telegram.call",
              "method": "answerCallbackQuery",
              "payload": {
                "callback_query_id": "{{callback.id}}",
                "text": "بررسی مقصد به صف اضافه شد."
              }
            },
            {
              "type": "context.set",
              "path": "callbackParts",
              "value": {
                "$expr": {
                  "op": "split",
                  "args": [
                    "{{callback.data}}",
                    ":"
                  ]
                }
              }
            },
            {
              "type": "queue.enqueue",
              "workflow": "system.verify.target",
              "input": {
                "targetId": "{{callbackParts.3}}",
                "depth": 0,
                "source": "manual-verification"
              },
              "maxAttempts": 4
            },
            {
              "type": "telegram.call",
              "method": "sendMessage",
              "payload": {
                "chat_id": "{{chat.id}}",
                "text": "🔍 بررسی مجدد عضویت و دسترسی مقصد در صف قرار گرفت."
              }
            }
          ],
          "else": [
            {
              "type": "telegram.call",
              "method": "answerCallbackQuery",
              "payload": {
                "callback_query_id": "{{callback.id}}",
                "text": "فقط مالک ربات به این بخش دسترسی دارد.",
                "show_alert": true
              }
            }
          ]
        }
      ]
    },
    {
      "id": "owner.forcejoin.private",
      "module": "owner_management",
      "on": "callback_query",
      "match": {
        "callbackPrefix": "owner:forcejoin:private"
      },
      "actions": [
        {
          "type": "telegram.call",
          "method": "answerCallbackQuery",
          "payload": {
            "callback_query_id": "{{callback.id}}"
          }
        },
        {
          "type": "condition",
          "if": {
            "eq": [
              "{{owner.isOwner}}",
              true
            ]
          },
          "then": [
            {
              "type": "workflow.run",
              "workflow": "forcejoin.private.configure",
              "input": {}
            }
          ],
          "else": [
            {
              "type": "telegram.call",
              "method": "answerCallbackQuery",
              "payload": {
                "callback_query_id": "{{callback.id}}",
                "text": "فقط مالک دسترسی دارد.",
                "show_alert": true
              }
            }
          ]
        }
      ]
    },
    {
      "id": "group.welcome.toggle",
      "module": "group_management",
      "on": "callback_query",
      "match": {
        "callbackPrefix": "group:welcome:toggle"
      },
      "actions": [
        {
          "type": "telegram.call",
          "method": "answerCallbackQuery",
          "payload": {
            "callback_query_id": "{{callback.id}}"
          }
        },
        {
          "type": "workflow.run",
          "workflow": "guard.group.admin",
          "input": {}
        },
        {
          "type": "state.get",
          "scope": "chat",
          "key": "welcome.enabled",
          "default": true,
          "as": "toggleState"
        },
        {
          "type": "condition",
          "if": {
            "eq": [
              "{{toggleState}}",
              true
            ]
          },
          "then": [
            {
              "type": "state.set",
              "scope": "chat",
              "key": "welcome.enabled",
              "value": false
            }
          ],
          "else": [
            {
              "type": "state.set",
              "scope": "chat",
              "key": "welcome.enabled",
              "value": true
            }
          ]
        },
        {
          "type": "workflow.run",
          "workflow": "group.panel.render",
          "input": {}
        }
      ]
    },
    {
      "id": "group.goodbye.toggle",
      "module": "group_management",
      "on": "callback_query",
      "match": {
        "callbackPrefix": "group:goodbye:toggle"
      },
      "actions": [
        {
          "type": "telegram.call",
          "method": "answerCallbackQuery",
          "payload": {
            "callback_query_id": "{{callback.id}}"
          }
        },
        {
          "type": "workflow.run",
          "workflow": "guard.group.admin",
          "input": {}
        },
        {
          "type": "state.get",
          "scope": "chat",
          "key": "goodbye.enabled",
          "default": true,
          "as": "toggleState"
        },
        {
          "type": "condition",
          "if": {
            "eq": [
              "{{toggleState}}",
              true
            ]
          },
          "then": [
            {
              "type": "state.set",
              "scope": "chat",
              "key": "goodbye.enabled",
              "value": false
            }
          ],
          "else": [
            {
              "type": "state.set",
              "scope": "chat",
              "key": "goodbye.enabled",
              "value": true
            }
          ]
        },
        {
          "type": "workflow.run",
          "workflow": "group.panel.render",
          "input": {}
        }
      ]
    },
    {
      "id": "group.forcejoin.toggle",
      "module": "group_management",
      "on": "callback_query",
      "match": {
        "callbackPrefix": "group:forcejoin:toggle"
      },
      "actions": [
        {
          "type": "telegram.call",
          "method": "answerCallbackQuery",
          "payload": {
            "callback_query_id": "{{callback.id}}"
          }
        },
        {
          "type": "workflow.run",
          "workflow": "guard.group.admin",
          "input": {}
        },
        {
          "type": "state.get",
          "scope": "global",
          "key": "forcejoin:group:{{chat.id}}:enabled",
          "default": false,
          "as": "toggleState"
        },
        {
          "type": "condition",
          "if": {
            "eq": [
              "{{toggleState}}",
              true
            ]
          },
          "then": [
            {
              "type": "state.set",
              "scope": "global",
              "key": "forcejoin:group:{{chat.id}}:enabled",
              "value": false
            }
          ],
          "else": [
            {
              "type": "state.set",
              "scope": "global",
              "key": "forcejoin:group:{{chat.id}}:enabled",
              "value": true
            }
          ]
        },
        {
          "type": "workflow.run",
          "workflow": "group.panel.render",
          "input": {}
        }
      ]
    },
    {
      "id": "group.forcejoin.clear",
      "module": "group_management",
      "on": "callback_query",
      "match": {
        "callbackPrefix": "group:forcejoin:clear"
      },
      "actions": [
        {
          "type": "telegram.call",
          "method": "answerCallbackQuery",
          "payload": {
            "callback_query_id": "{{callback.id}}"
          }
        },
        {
          "type": "workflow.run",
          "workflow": "guard.group.admin",
          "input": {}
        },
        {
          "type": "workflow.run",
          "workflow": "forcejoin.clear.group",
          "input": {}
        },
        {
          "type": "workflow.run",
          "workflow": "group.panel.render",
          "input": {}
        }
      ]
    },
    {
      "id": "group.moderation",
      "module": "group_management",
      "on": "callback_query",
      "match": {
        "callbackPrefix": "group:moderation"
      },
      "actions": [
        {
          "type": "telegram.call",
          "method": "answerCallbackQuery",
          "payload": {
            "callback_query_id": "{{callback.id}}"
          }
        },
        {
          "type": "workflow.run",
          "workflow": "guard.group.admin",
          "input": {}
        },
        {
          "type": "telegram.call",
          "method": "sendMessage",
          "payload": {
            "chat_id": "{{chat.id}}",
            "text": "<b>مدیریت اعضا</b>\nبرای سکوت: روی پیام کاربر ریپلای و <code>/mute</code> ارسال کنید.\nبرای رفع سکوت: <code>/unmute</code>\nبرای بن: <code>/ban</code>\nبرای رفع بن: <code>/unban</code>\nفهرست‌ها: <code>/silentlist</code> و <code>/banlist</code>\nپاک‌سازی: <code>/cleansilentlist</code> و <code>/cleanbanlist</code>\n\nبرای عملیات محدودسازی، شما و ربات باید مجوز <code>Restrict Members</code> داشته باشید.",
            "parse_mode": "HTML",
            "link_preview_options": {
              "is_disabled": true
            }
          }
        }
      ]
    },
    {
      "id": "group.templates.reset",
      "module": "group_management",
      "on": "callback_query",
      "match": {
        "callbackPrefix": "group:templates:reset"
      },
      "actions": [
        {
          "type": "telegram.call",
          "method": "answerCallbackQuery",
          "payload": {
            "callback_query_id": "{{callback.id}}"
          }
        },
        {
          "type": "workflow.run",
          "workflow": "guard.group.admin",
          "input": {}
        },
        {
          "type": "state.delete",
          "scope": "chat",
          "key": "welcome.text"
        },
        {
          "type": "state.delete",
          "scope": "chat",
          "key": "welcome.source"
        },
        {
          "type": "state.delete",
          "scope": "chat",
          "key": "welcome.delaySeconds"
        },
        {
          "type": "state.delete",
          "scope": "chat",
          "key": "goodbye.text"
        },
        {
          "type": "state.delete",
          "scope": "chat",
          "key": "goodbye.source"
        },
        {
          "type": "telegram.call",
          "method": "sendMessage",
          "payload": {
            "chat_id": "{{chat.id}}",
            "text": "<b>پیام‌های خوش‌آمد و خداحافظی به مقادیر پیش‌فرض برگشتند.</b>",
            "parse_mode": "HTML"
          }
        },
        {
          "type": "workflow.run",
          "workflow": "group.panel.render",
          "input": {}
        }
      ]
    },
    {
      "id": "group.install.reset",
      "module": "group_management",
      "on": "callback_query",
      "match": {
        "callbackPrefix": "group:install:reset"
      },
      "actions": [
        {
          "type": "telegram.call",
          "method": "answerCallbackQuery",
          "payload": {
            "callback_query_id": "{{callback.id}}"
          }
        },
        {
          "type": "workflow.run",
          "workflow": "guard.group.admin",
          "input": {}
        },
        {
          "type": "state.delete",
          "scope": "chat",
          "key": "install.text"
        },
        {
          "type": "state.delete",
          "scope": "chat",
          "key": "install.source"
        },
        {
          "type": "state.set",
          "scope": "chat",
          "key": "install.sent",
          "value": false
        },
        {
          "type": "telegram.call",
          "method": "sendMessage",
          "payload": {
            "chat_id": "{{chat.id}}",
            "text": "<b>پیام ورود ربات به مقدار پیش‌فرض بازنشانی شد.</b>",
            "parse_mode": "HTML"
          }
        },
        {
          "type": "workflow.run",
          "workflow": "group.panel.render",
          "input": {}
        }
      ]
    }
  ],
  "schedules": [
    {
      "id": "system.reconcile.telegram",
      "cron": "0 */6 * * *",
      "workflow": "system.reconcile",
      "enabled": true
    }
  ],
  "lifecycle": {
    "onBootstrap": [
      {
        "type": "workflow.run",
        "workflow": "system.reconcile",
        "input": {}
      }
    ],
    "onInstall": [
      {
        "type": "workflow.run",
        "workflow": "system.reconcile",
        "input": {}
      }
    ]
  },
  "migrations": {
    "workflowAliases": {}
  },
  "integrations": {
    "telegram": {
      "enabled": true,
      "genericMethodGateway": true
    },
    "http": {
      "enabled": true,
      "genericRequestGateway": true
    }
  },
  "ui": {
    "style": {
      "language": "fa",
      "parseMode": "HTML",
      "separator": "━━━━━━━━━━━━━━━━",
      "footer": "MUNITOS • SMART GROUP MANAGEMENT",
      "layout": "inline_keyboard",
      "columns": 2,
      "buttonStyles": {
        "primary": "primary",
        "positive": "success",
        "destructive": "danger"
      }
    },
    "home": {
      "user": {
        "text": "<b>به MUNITOS خوش آمدید.</b>\nابزارهای شخصی و راهنمای استفاده را از منوی زیر باز کنید.",
        "keyboard": [
          [
            {
              "text": "📚 راهنما",
              "callback_data": "ui:help",
              "style": "primary"
            },
            {
              "text": "🪪 شناسه من",
              "callback_data": "ui:myid",
              "style": "primary"
            }
          ],
          [
            {
              "text": "📊 سهمیه من",
              "callback_data": "ui:quota",
              "style": "primary"
            }
          ]
        ]
      },
      "owner": {
        "text": "<b>خوش آمدید، مالک MUNITOS.</b>\n\nپنل مرکزی برای مدیریت گروه‌ها، کانال‌ها، پلن‌ها، عضویت اجباری و پردازش‌های ربات آماده است.",
        "keyboard": [
          [
            {
              "text": "⚙️ پنل مدیریت",
              "callback_data": "ui:owner:home",
              "style": "primary"
            },
            {
              "text": "📚 راهنمای امکانات",
              "callback_data": "ui:help",
              "style": "primary"
            }
          ],
          [
            {
              "text": "🛠 ترمیم خودکار",
              "callback_data": "ui:owner:repair",
              "style": "success"
            },
            {
              "text": "🔎 شناسایی مقصد",
              "callback_data": "ui:owner:detect",
              "style": "primary"
            }
          ],
          [
            {
              "text": "🔐 جوین اجباری کاربران خصوصی",
              "callback_data": "owner:forcejoin:private",
              "style": "success"
            }
          ],
          [
            {
              "text": "👥 گروه‌ها",
              "callback_data": "ui:owner:groups:0",
              "style": "primary"
            },
            {
              "text": "📣 کانال‌ها",
              "callback_data": "ui:owner:channels:0",
              "style": "primary"
            }
          ],
          [
            {
              "text": "📢 پیام همگانی",
              "callback_data": "ui:owner:broadcast",
              "style": "primary"
            },
            {
              "text": "📊 وضعیت سیستم",
              "callback_data": "ui:owner:status",
              "style": "primary"
            }
          ],
          [
            {
              "text": "🧾 صف پردازش",
              "callback_data": "ui:owner:queue",
              "style": "primary"
            },
            {
              "text": "📜 گزارش‌ها",
              "callback_data": "ui:owner:logs",
              "style": "primary"
            }
          ]
        ]
      },
      "privateUser": {
        "text": "<b>به MUNITOS خوش آمدید.</b>\nابزارهای شخصی و راهنمای استفاده را از منوی زیر باز کنید.",
        "keyboard": [
          [
            {
              "text": "📚 راهنما",
              "callback_data": "ui:help",
              "style": "primary"
            },
            {
              "text": "🪪 شناسه من",
              "callback_data": "ui:myid",
              "style": "primary"
            }
          ],
          [
            {
              "text": "📊 سهمیه من",
              "callback_data": "ui:quota",
              "style": "primary"
            }
          ]
        ]
      },
      "groupMember": {
        "text": "<b>منوی عمومی MUNITOS</b>\nابزارهای قابل استفاده برای اعضای این گروه.",
        "keyboard": [
          [
            {
              "text": "📚 راهنمای امکانات",
              "callback_data": "ui:help",
              "style": "primary"
            },
            {
              "text": "👤 اطلاعات کاربر",
              "callback_data": "ui:section:info",
              "style": "primary"
            }
          ],
          [
            {
              "text": "🪪 شناسه",
              "callback_data": "ui:myid",
              "style": "primary"
            }
          ]
        ]
      },
      "groupAdmin": {
        "text": "<b>پنل مدیریت گروه MUNITOS</b>\nدسترسی‌های مدیریتی بر اساس سمت واقعی شما و مجوزهای تلگرام کنترل می‌شوند.",
        "keyboard": [
          [
            {
              "text": "⚙️ تنظیمات گروه",
              "callback_data": "group:panel",
              "style": "primary"
            },
            {
              "text": "📚 راهنما",
              "callback_data": "ui:help",
              "style": "primary"
            }
          ],
          [
            {
              "text": "👋 خوش‌آمد و خداحافظی",
              "callback_data": "group:templates",
              "style": "primary"
            }
          ],
          [
            {
              "text": "🔐 عضویت اجباری",
              "callback_data": "group:forcejoin",
              "style": "success"
            }
          ],
          [
            {
              "text": "🛡 سطح دسترسی مدیران",
              "callback_data": "group:permissions",
              "style": "primary"
            }
          ]
        ]
      }
    },
    "help": {
      "text": "<b>راهنمای MUNITOS</b>\nدسته‌بندی موردنظر را انتخاب کنید. فهرست و تنظیمات مدیریتی بر اساس نوع گفتگو و سطح دسترسی فیلتر می‌شوند.",
      "keyboard": [
        [
          {
            "text": "🔇 سکوت و محدودیت",
            "callback_data": "ui:section:moderation",
            "style": "primary"
          },
          {
            "text": "⛔ بن و آزادسازی",
            "callback_data": "ui:section:ban",
            "style": "danger"
          }
        ],
        [
          {
            "text": "👋 خوش‌آمدگویی",
            "callback_data": "ui:section:welcome",
            "style": "primary"
          },
          {
            "text": "🌙 پیام خداحافظی",
            "callback_data": "ui:section:goodbye",
            "style": "primary"
          }
        ],
        [
          {
            "text": "👤 اطلاعات کاربر",
            "callback_data": "ui:section:info",
            "style": "primary"
          },
          {
            "text": "📊 سهمیه و پلن",
            "callback_data": "ui:section:quota",
            "style": "primary"
          }
        ],
        [
          {
            "text": "🧩 فهرست امکانات",
            "callback_data": "ui:section:features",
            "style": "primary"
          },
          {
            "text": "📚 ابزارهای عمومی",
            "callback_data": "ui:section:general",
            "style": "primary"
          }
        ],
        [
          {
            "text": "🏠 منوی اصلی",
            "callback_data": "ui:home",
            "style": "primary"
          }
        ]
      ],
      "userKeyboard": [
        [
          {
            "text": "🔇 سکوت و محدودیت",
            "callback_data": "ui:section:moderation",
            "style": "primary"
          },
          {
            "text": "⛔ بن و آزادسازی",
            "callback_data": "ui:section:ban",
            "style": "danger"
          }
        ],
        [
          {
            "text": "👋 خوش‌آمدگویی",
            "callback_data": "ui:section:welcome",
            "style": "primary"
          },
          {
            "text": "🌙 پیام خداحافظی",
            "callback_data": "ui:section:goodbye",
            "style": "primary"
          }
        ],
        [
          {
            "text": "👤 اطلاعات کاربر",
            "callback_data": "ui:section:info",
            "style": "primary"
          },
          {
            "text": "📊 سهمیه و پلن",
            "callback_data": "ui:section:quota",
            "style": "primary"
          }
        ],
        [
          {
            "text": "🧩 فهرست امکانات",
            "callback_data": "ui:section:features",
            "style": "primary"
          },
          {
            "text": "📚 ابزارهای عمومی",
            "callback_data": "ui:section:general",
            "style": "primary"
          }
        ],
        [
          {
            "text": "🏠 منوی اصلی",
            "callback_data": "ui:home",
            "style": "primary"
          }
        ]
      ],
      "ownerKeyboard": [
        [
          {
            "text": "🔇 سکوت و محدودیت",
            "callback_data": "ui:section:moderation",
            "style": "primary"
          },
          {
            "text": "⛔ بن و آزادسازی",
            "callback_data": "ui:section:ban",
            "style": "danger"
          }
        ],
        [
          {
            "text": "👋 خوش‌آمدگویی",
            "callback_data": "ui:section:welcome",
            "style": "primary"
          },
          {
            "text": "🌙 پیام خداحافظی",
            "callback_data": "ui:section:goodbye",
            "style": "primary"
          }
        ],
        [
          {
            "text": "👤 اطلاعات کاربر",
            "callback_data": "ui:section:info",
            "style": "primary"
          },
          {
            "text": "📊 سهمیه و پلن",
            "callback_data": "ui:section:quota",
            "style": "primary"
          }
        ],
        [
          {
            "text": "🧩 فهرست امکانات",
            "callback_data": "ui:section:features",
            "style": "primary"
          },
          {
            "text": "⚙️ ابزارهای مالک",
            "callback_data": "ui:section:owner",
            "style": "primary"
          }
        ],
        [
          {
            "text": "🔎 شناسایی گروه و کانال",
            "callback_data": "ui:section:detection",
            "style": "primary"
          },
          {
            "text": "🛠 ترمیم خودکار",
            "callback_data": "ui:owner:repair",
            "style": "success"
          }
        ],
        [
          {
            "text": "🧠 وضعیت و ابزار Runtime",
            "callback_data": "ui:section:runtime",
            "style": "primary"
          },
          {
            "text": "📚 ابزارهای عمومی",
            "callback_data": "ui:section:general",
            "style": "primary"
          }
        ],
        [
          {
            "text": "🏠 منوی اصلی",
            "callback_data": "ui:home",
            "style": "primary"
          }
        ]
      ],
      "private": {
        "text": "<b>راهنمای خصوصی MUNITOS</b>\nدر گفتگوی خصوصی، دستورات شخصی و راهنمای عمومی در دسترس هستند. ابزارهای مدیریت گروه فقط در همان گروه و برای مدیران ارائه می‌شوند.",
        "keyboard": [
          [
            {
              "text": "🪪 شناسه",
              "callback_data": "ui:myid",
              "style": "primary"
            },
            {
              "text": "📊 سهمیه",
              "callback_data": "ui:quota",
              "style": "primary"
            }
          ],
          [
            {
              "text": "🏠 منوی اصلی",
              "callback_data": "ui:home",
              "style": "primary"
            }
          ]
        ]
      },
      "groupMember": {
        "text": "<b>راهنمای اعضای گروه</b>\n\n<code>/info</code> — اطلاعات کاربر با ریپلای\n<code>/id</code> — شناسه عددی\n<code>/help</code> — راهنمای عمومی\n\nپنل مدیریت، تنظیم پیام‌ها و دستورات مدیریتی فقط برای مدیران واقعی گروه در دسترس است.",
        "keyboard": [
          [
            {
              "text": "👤 اطلاعات کاربر",
              "callback_data": "ui:section:info",
              "style": "primary"
            },
            {
              "text": "🪪 شناسه",
              "callback_data": "ui:myid",
              "style": "primary"
            }
          ],
          [
            {
              "text": "📚 راهنمای عمومی",
              "callback_data": "ui:section:general",
              "style": "primary"
            }
          ],
          [
            {
              "text": "🏠 منوی اصلی",
              "callback_data": "ui:home",
              "style": "primary"
            }
          ]
        ]
      },
      "groupAdmin": {
        "text": "<b>پنل مدیران گروه MUNITOS</b>\n\n<code>/group</code> — پنل کامل تنظیمات گروه\n<code>/mute</code> و <code>/unmute</code> — سکوت و رفع سکوت\n<code>/ban</code> و <code>/unban</code> — مسدودسازی و آزادسازی\n<code>/silentlist</code> و <code>/banlist</code> — فهرست محدودیت‌ها\n<code>/setwelcome</code>، <code>/setwelcomemedia</code> و <code>/setwelcometime</code> — تنظیم خوش‌آمد\n<code>/setgoodbye</code> و <code>/setgoodbyemedia</code> — تنظیم خداحافظی\n<code>/setinstallmsg</code> — پیام ورود ربات\n<code>/forcejoin</code> — عضویت اجباری همین گروه\n\n<b>توجه:</b> بن و سکوت فقط در صورت داشتن مجوز <code>can_restrict_members</code> توسط مدیر و ربات اجرا می‌شوند.",
        "keyboard": [
          [
            {
              "text": "⚙️ پنل تنظیمات گروه",
              "callback_data": "group:panel",
              "style": "primary"
            }
          ],
          [
            {
              "text": "🛡 مدیریت اعضا",
              "callback_data": "group:moderation",
              "style": "danger"
            },
            {
              "text": "🔐 عضویت اجباری",
              "callback_data": "group:forcejoin",
              "style": "success"
            }
          ],
          [
            {
              "text": "👋 خوش‌آمدگویی",
              "callback_data": "ui:section:welcome",
              "style": "primary"
            },
            {
              "text": "🌙 خداحافظی",
              "callback_data": "ui:section:goodbye",
              "style": "primary"
            }
          ],
          [
            {
              "text": "📚 فهرست فرمان‌های مدیر",
              "callback_data": "ui:section:features",
              "style": "primary"
            }
          ],
          [
            {
              "text": "🏠 منوی اصلی",
              "callback_data": "ui:home",
              "style": "primary"
            }
          ]
        ]
      }
    },
    "owner": {
      "home": {
        "text": "<b>پنل مرکزی مالک</b>\n\nاز این بخش می‌توانید مقصدها، شناسایی، عضویت اجباری کاربران خصوصی، پیام همگانی و سلامت Runtime را مدیریت کنید.",
        "keyboard": [
          [
            {
              "text": "👥 فهرست گروه‌ها",
              "callback_data": "ui:owner:groups:0",
              "style": "primary"
            },
            {
              "text": "📣 فهرست کانال‌ها",
              "callback_data": "ui:owner:channels:0",
              "style": "primary"
            }
          ],
          [
            {
              "text": "🔐 عضویت اجباری کاربران خصوصی",
              "callback_data": "owner:forcejoin:private",
              "style": "success"
            }
          ],
          [
            {
              "text": "🔎 شناسایی هوشمند مقصد",
              "callback_data": "ui:owner:detect",
              "style": "primary"
            }
          ],
          [
            {
              "text": "🛠 ترمیم خودکار سیستم",
              "callback_data": "ui:owner:repair",
              "style": "success"
            }
          ],
          [
            {
              "text": "📢 پیام همگانی",
              "callback_data": "ui:owner:broadcast",
              "style": "primary"
            }
          ],
          [
            {
              "text": "📊 وضعیت Runtime",
              "callback_data": "ui:owner:status",
              "style": "primary"
            },
            {
              "text": "🧾 وضعیت صف",
              "callback_data": "ui:owner:queue",
              "style": "primary"
            }
          ],
          [
            {
              "text": "📜 گزارش‌های اخیر",
              "callback_data": "ui:owner:logs",
              "style": "primary"
            }
          ],
          [
            {
              "text": "⏸ توقف صف",
              "callback_data": "ui:owner:pause",
              "style": "primary"
            },
            {
              "text": "▶️ ادامه صف",
              "callback_data": "ui:owner:resume",
              "style": "success"
            }
          ],
          [
            {
              "text": "📚 راهنما",
              "callback_data": "ui:help",
              "style": "primary"
            },
            {
              "text": "🏠 منوی اصلی",
              "callback_data": "ui:home",
              "style": "primary"
            }
          ]
        ]
      }
    },
    "sections": {
      "moderation": {
        "title": "🔇 مدیریت اعضا",
        "text": "<b>مدیریت اعضا</b>\nدستورات سکوت و رفع سکوت فقط وقتی اجرا می‌شوند که هم مدیر اجراکننده و هم خود ربات مجوز <code>Restrict Members</code> داشته باشند.",
        "commands": [
          "mute",
          "unmute",
          "silent_list",
          "clean_silent_list"
        ],
        "keyboard": [
          [
            {
              "text": "📋 فهرست سکوت",
              "callback_data": "ui:cmd:silent_list",
              "style": "primary"
            }
          ],
          [
            {
              "text": "⬅️ بازگشت",
              "callback_data": "ui:help",
              "style": "primary"
            }
          ]
        ]
      },
      "ban": {
        "title": "⛔ بن و آزادسازی",
        "text": "<b>بن و آزادسازی</b>\nاجرای این عملیات به مجوز <code>Restrict Members</code> برای مدیر اجراکننده و ربات نیاز دارد. برای تعیین کاربر روی پیام او ریپلای کنید.",
        "commands": [
          "ban",
          "unban",
          "ban_list",
          "clean_ban_list"
        ],
        "keyboard": [
          [
            {
              "text": "📋 فهرست بن",
              "callback_data": "ui:cmd:ban_list",
              "style": "danger"
            }
          ],
          [
            {
              "text": "⬅️ بازگشت",
              "callback_data": "ui:help",
              "style": "primary"
            }
          ]
        ]
      },
      "welcome": {
        "title": "👋 خوش‌آمدگویی",
        "text": "<b>تنظیمات خوش‌آمدگویی</b>\n\nپیام ورود اعضا برای هر گروه جداگانه ذخیره می‌شود. متن، رسانه، قالب‌بندی و تأخیر ارسال قابل تنظیم است.\n\nبرای دریافت مطمئن رویداد ورود، ربات را مدیر گروه کنید.",
        "keyboard": [
          [
            {
              "text": "✏️ تنظیم متن / پیام",
              "callback_data": "ui:cmd:setwelcome",
              "style": "primary"
            },
            {
              "text": "👁 مشاهده تنظیم فعلی",
              "callback_data": "ui:cmd:getwelcome",
              "style": "primary"
            }
          ],
          [
            {
              "text": "🖼 تنظیم رسانه",
              "callback_data": "ui:cmd:setwelcomemedia",
              "style": "primary"
            },
            {
              "text": "⏱ تنظیم تأخیر",
              "callback_data": "ui:cmd:setwelcometime",
              "style": "primary"
            }
          ],
          [
            {
              "text": "🟢 فعال‌سازی",
              "callback_data": "ui:cmd:welcome_on",
              "style": "success"
            },
            {
              "text": "🔴 غیرفعال‌سازی",
              "callback_data": "ui:cmd:welcome_off",
              "style": "success"
            }
          ],
          [
            {
              "text": "♻️ بازنشانی تنظیمات",
              "callback_data": "ui:cmd:resetwelcome",
              "style": "danger"
            }
          ],
          [
            {
              "text": "⬅️ راهنمای مدیران",
              "callback_data": "ui:help",
              "style": "primary"
            },
            {
              "text": "⚙️ پنل گروه",
              "callback_data": "group:panel",
              "style": "primary"
            }
          ]
        ],
        "groupEnabledText": "<b>خوش‌آمدگویی فعال است.</b>\n\nوضعیت فعلی: <b>🟢 روشن</b>\nبرای تغییر وضعیت از دکمه زیر استفاده کنید. فقط مدیران گروه دسترسی دارند.",
        "groupDisabledText": "<b>خوش‌آمدگویی غیرفعال است.</b>\n\nوضعیت فعلی: <b>🔴 خاموش</b>\nبرای فعال‌سازی دوباره از دکمه زیر استفاده کنید. فقط مدیران گروه دسترسی دارند.",
        "groupEnabledKeyboard": [
          [
            {
              "text": "🟢 خوش‌آمدگویی روشن است · خاموش‌کردن",
              "callback_data": "ui:welcome:toggle",
              "style": "success"
            }
          ],
          [
            {
              "text": "✏️ تنظیم پیام",
              "callback_data": "ui:cmd:setwelcome",
              "style": "primary"
            },
            {
              "text": "👁 مشاهده پیام",
              "callback_data": "ui:cmd:getwelcome",
              "style": "primary"
            }
          ],
          [
            {
              "text": "⬅️ بازگشت به راهنما",
              "callback_data": "ui:help",
              "style": "primary"
            },
            {
              "text": "🏠 منوی اصلی",
              "callback_data": "ui:home",
              "style": "primary"
            }
          ]
        ],
        "groupDisabledKeyboard": [
          [
            {
              "text": "🔴 خوش‌آمدگویی خاموش است · روشن‌کردن",
              "callback_data": "ui:welcome:toggle",
              "style": "success"
            }
          ],
          [
            {
              "text": "✏️ تنظیم پیام",
              "callback_data": "ui:cmd:setwelcome",
              "style": "primary"
            },
            {
              "text": "👁 مشاهده پیام",
              "callback_data": "ui:cmd:getwelcome",
              "style": "primary"
            }
          ],
          [
            {
              "text": "⬅️ بازگشت به راهنما",
              "callback_data": "ui:help",
              "style": "primary"
            },
            {
              "text": "🏠 منوی اصلی",
              "callback_data": "ui:home",
              "style": "primary"
            }
          ]
        ]
      },
      "goodbye": {
        "title": "🌙 خداحافظی",
        "text": "<b>تنظیمات پیام خداحافظی</b>\n\nهنگام خروج یا حذف عضو، پیام اختصاصی گروه ارسال می‌شود. متن، رسانه و قالب‌بندی قابل تنظیم هستند.",
        "keyboard": [
          [
            {
              "text": "✏️ تنظیم متن / پیام",
              "callback_data": "ui:cmd:setgoodbye",
              "style": "primary"
            },
            {
              "text": "👁 مشاهده تنظیم فعلی",
              "callback_data": "ui:cmd:getgoodbye",
              "style": "primary"
            }
          ],
          [
            {
              "text": "🖼 تنظیم رسانه",
              "callback_data": "ui:cmd:setgoodbyemedia",
              "style": "primary"
            }
          ],
          [
            {
              "text": "🟢 فعال‌سازی",
              "callback_data": "ui:cmd:goodbye_on",
              "style": "success"
            },
            {
              "text": "🔴 غیرفعال‌سازی",
              "callback_data": "ui:cmd:goodbye_off",
              "style": "success"
            }
          ],
          [
            {
              "text": "♻️ بازنشانی تنظیمات",
              "callback_data": "ui:cmd:resetgoodbye",
              "style": "danger"
            }
          ],
          [
            {
              "text": "⬅️ راهنمای مدیران",
              "callback_data": "ui:help",
              "style": "primary"
            },
            {
              "text": "⚙️ پنل گروه",
              "callback_data": "group:panel",
              "style": "primary"
            }
          ]
        ],
        "groupEnabledText": "<b>پیام خداحافظی فعال است.</b>\n\nوضعیت فعلی: <b>🟢 روشن</b>\nبرای تغییر وضعیت از دکمه زیر استفاده کنید. فقط مدیران گروه دسترسی دارند.",
        "groupDisabledText": "<b>پیام خداحافظی غیرفعال است.</b>\n\nوضعیت فعلی: <b>🔴 خاموش</b>\nبرای فعال‌سازی دوباره از دکمه زیر استفاده کنید. فقط مدیران گروه دسترسی دارند.",
        "groupEnabledKeyboard": [
          [
            {
              "text": "🟢 خداحافظی روشن است · خاموش‌کردن",
              "callback_data": "ui:goodbye:toggle",
              "style": "success"
            }
          ],
          [
            {
              "text": "✏️ تنظیم پیام",
              "callback_data": "ui:cmd:setgoodbye",
              "style": "primary"
            },
            {
              "text": "👁 مشاهده پیام",
              "callback_data": "ui:cmd:getgoodbye",
              "style": "primary"
            }
          ],
          [
            {
              "text": "⬅️ بازگشت به راهنما",
              "callback_data": "ui:help",
              "style": "primary"
            },
            {
              "text": "🏠 منوی اصلی",
              "callback_data": "ui:home",
              "style": "primary"
            }
          ]
        ],
        "groupDisabledKeyboard": [
          [
            {
              "text": "🔴 خداحافظی خاموش است · روشن‌کردن",
              "callback_data": "ui:goodbye:toggle",
              "style": "success"
            }
          ],
          [
            {
              "text": "✏️ تنظیم پیام",
              "callback_data": "ui:cmd:setgoodbye",
              "style": "primary"
            },
            {
              "text": "👁 مشاهده پیام",
              "callback_data": "ui:cmd:getgoodbye",
              "style": "primary"
            }
          ],
          [
            {
              "text": "⬅️ بازگشت به راهنما",
              "callback_data": "ui:help",
              "style": "primary"
            },
            {
              "text": "🏠 منوی اصلی",
              "callback_data": "ui:home",
              "style": "primary"
            }
          ]
        ]
      },
      "info": {
        "title": "👤 اطلاعات کاربر",
        "text": "<b>اطلاعات و شناسه‌ها</b>\n\nبرای مشاهده شناسه عددی از <code>/id</code> استفاده کنید.\nبرای دریافت اطلاعات پایه یک عضو، روی پیام او ریپلای کنید و <code>/info</code> را بفرستید.",
        "keyboard": [
          [
            {
              "text": "🆔 شناسه‌ها",
              "callback_data": "ui:cmd:id",
              "style": "primary"
            },
            {
              "text": "👤 اطلاعات با ریپلای",
              "callback_data": "ui:cmd:info",
              "style": "primary"
            }
          ],
          [
            {
              "text": "⬅️ راهنمای اصلی",
              "callback_data": "ui:help",
              "style": "primary"
            },
            {
              "text": "🏠 منوی اصلی",
              "callback_data": "ui:home",
              "style": "primary"
            }
          ]
        ]
      },
      "general": {
        "title": "📚 ابزارهای عمومی",
        "text": "<b>ابزارهای عمومی</b>\n\nشروع، راهنما، شناسه، سهمیه و لغو عملیات از این بخش در دسترس هستند.",
        "keyboard": [
          [
            {
              "text": "🏠 شروع",
              "callback_data": "ui:cmd:start",
              "style": "success"
            },
            {
              "text": "📚 راهنما",
              "callback_data": "ui:cmd:help",
              "style": "primary"
            }
          ],
          [
            {
              "text": "🆔 شناسه",
              "callback_data": "ui:cmd:id",
              "style": "primary"
            },
            {
              "text": "📊 سهمیه",
              "callback_data": "ui:cmd:quota",
              "style": "primary"
            }
          ],
          [
            {
              "text": "✖️ لغو عملیات",
              "callback_data": "ui:cmd:cancel",
              "style": "danger"
            }
          ],
          [
            {
              "text": "⬅️ فهرست امکانات",
              "callback_data": "ui:help",
              "style": "primary"
            },
            {
              "text": "🏠 منوی اصلی",
              "callback_data": "ui:home",
              "style": "primary"
            }
          ]
        ]
      },
      "quota": {
        "title": "📊 سهمیه و پلن",
        "text": "<b>سهمیه و پلن</b>\n\nسهمیه پیام همگانی بر اساس پلن هر مقصد و در دوره ماهانه محاسبه می‌شود. تغییر پلن مقصد فقط در اختیار مالک است.",
        "keyboard": [
          [
            {
              "text": "📊 مشاهده سهمیه",
              "callback_data": "ui:cmd:quota",
              "style": "primary"
            }
          ],
          [
            {
              "text": "🎚 تنظیم پلن مقصد",
              "callback_data": "ui:cmd:plan",
              "style": "primary"
            }
          ],
          [
            {
              "text": "⬅️ راهنمای اصلی",
              "callback_data": "ui:help",
              "style": "primary"
            },
            {
              "text": "🏠 منوی اصلی",
              "callback_data": "ui:home",
              "style": "primary"
            }
          ]
        ]
      },
      "owner": {
        "title": "⚙️ ابزارهای مالک",
        "text": "<b>ابزارهای مالک</b>\n\nفهرست گروه‌ها و کانال‌ها، شناسایی مقصد، عضویت اجباری کاربران خصوصی، پیام همگانی، پلن‌ها و Auto Repair از پنل خصوصی مالک مدیریت می‌شوند.",
        "keyboard": [
          [
            {
              "text": "⚙️ بازکردن پنل مدیریت",
              "callback_data": "ui:owner:home",
              "style": "primary"
            }
          ],
          [
            {
              "text": "🔎 شناسایی هوشمند",
              "callback_data": "ui:owner:detect",
              "style": "primary"
            },
            {
              "text": "🛠 Auto Repair",
              "callback_data": "ui:owner:repair",
              "style": "success"
            }
          ],
          [
            {
              "text": "👥 گروه‌ها",
              "callback_data": "ui:owner:groups:0",
              "style": "primary"
            },
            {
              "text": "📣 کانال‌ها",
              "callback_data": "ui:owner:channels:0",
              "style": "primary"
            }
          ],
          [
            {
              "text": "📢 پیام همگانی",
              "callback_data": "ui:owner:broadcast",
              "style": "primary"
            }
          ],
          [
            {
              "text": "⬅️ بازگشت به راهنما",
              "callback_data": "ui:help",
              "style": "primary"
            },
            {
              "text": "🏠 منوی اصلی",
              "callback_data": "ui:home",
              "style": "primary"
            }
          ],
          [
            {
              "text": "📚 راهنمای Auto Repair",
              "callback_data": "ui:cmd:repair",
              "style": "success"
            }
          ]
        ]
      },
      "runtime": {
        "title": "🧠 وضعیت Runtime",
        "text": "<b>وضعیت Runtime</b>\n\nوضعیت موتور، صف پردازش و گزارش خطاها از پنل مالک قابل مشاهده است. توقف Runtime فقط پردازش‌های زمان‌بندی‌شده و صف پس‌زمینه را متوقف می‌کند؛ دریافت فرمان‌ها ادامه دارد.",
        "keyboard": [
          [
            {
              "text": "📊 وضعیت سیستم",
              "callback_data": "ui:cmd:runtime",
              "style": "primary"
            },
            {
              "text": "🧾 وضعیت صف",
              "callback_data": "ui:cmd:runtime_queue",
              "style": "primary"
            }
          ],
          [
            {
              "text": "📜 گزارش‌های اخیر",
              "callback_data": "ui:cmd:runtime_logs",
              "style": "primary"
            }
          ],
          [
            {
              "text": "🔁 تلاش مجدد Job",
              "callback_data": "ui:cmd:runtime_retry",
              "style": "primary"
            },
            {
              "text": "✖️ لغو Job",
              "callback_data": "ui:cmd:runtime_cancel",
              "style": "danger"
            }
          ],
          [
            {
              "text": "⏸ توقف صف",
              "callback_data": "ui:cmd:runtime_pause",
              "style": "primary"
            },
            {
              "text": "▶️ ادامه صف",
              "callback_data": "ui:cmd:runtime_resume",
              "style": "success"
            }
          ],
          [
            {
              "text": "⬅️ فهرست امکانات",
              "callback_data": "ui:help",
              "style": "primary"
            },
            {
              "text": "🏠 منوی اصلی",
              "callback_data": "ui:home",
              "style": "primary"
            }
          ]
        ]
      },
      "features": {
        "title": "🧩 امکانات MUNITOS",
        "text": "<b>امکانات فعال MUNITOS</b>\n\n🛡 <b>مدیریت اعضا</b>\nسکوت، رفع سکوت، بن و رفع بن با ریپلای و کنترل مجوزهای مدیر و ربات.\n\n👋 <b>خوش‌آمد و خداحافظی</b>\nتنظیم متن، رسانه، قالب‌بندی و زمان تأخیر برای هر گروه.\n\n🗂 <b>مدیریت و شناسایی مقصد</b>\nثبت خودکار، انتخاب رسمی گروه و کانال، تشخیص شناسه و یوزرنیم، بررسی عضویت و مجوز ارسال.\n\n🔐 <b>عضویت اجباری</b>\nفهرست مستقل برای هر گروه و فهرست سراسری برای کاربران خصوصی.\n\n🛠 <b>Auto Repair</b>\nبررسی تنظیمات Telegram، Webhook، صف و مقصدهای ثبت‌شده.\n\n📢 <b>پیام همگانی</b>\nصف ارسال به مقصدهای ثبت‌شده همراه با کنترل سهمیه.\n\n📊 <b>پلن و سهمیه</b>\nسهمیه ماهانه و تنظیم پلن اختصاصی مقصد.\n\n⚙️ <b>پنل‌های مدیریتی</b>\nپنل گروه فقط برای مدیران واقعی و پنل مالک فقط در گفتگوی خصوصی مالک.",
        "keyboard": [
          [
            {
              "text": "🛡 مدیریت اعضا",
              "callback_data": "ui:section:moderation",
              "style": "primary"
            },
            {
              "text": "👋 خوش‌آمدگویی",
              "callback_data": "ui:section:welcome",
              "style": "primary"
            }
          ],
          [
            {
              "text": "🌙 خداحافظی",
              "callback_data": "ui:section:goodbye",
              "style": "primary"
            },
            {
              "text": "📊 سهمیه",
              "callback_data": "ui:section:quota",
              "style": "primary"
            }
          ],
          [
            {
              "text": "🔎 شناسایی گروه و کانال",
              "callback_data": "ui:section:detection",
              "style": "primary"
            },
            {
              "text": "🛠 Auto Repair",
              "callback_data": "ui:owner:repair",
              "style": "success"
            }
          ],
          [
            {
              "text": "⚙️ پنل مالک",
              "callback_data": "ui:section:owner",
              "style": "primary"
            }
          ],
          [
            {
              "text": "⬅️ بازگشت به راهنما",
              "callback_data": "ui:help",
              "style": "primary"
            },
            {
              "text": "🏠 منوی اصلی",
              "callback_data": "ui:home",
              "style": "primary"
            }
          ]
        ]
      },
      "detection": {
        "title": "🔎 شناسایی گروه و کانال",
        "text": "<b>شناسایی گروه و کانال</b>\n\n<b>روش‌های شناسایی</b>\n۱. انتخاب مستقیم گروه یا کانال از فهرست تلگرام\n۲. شناسه عددی مقصد\n۳. یوزرنیم عمومی مانند <code>@publicgroup</code>\n۴. فوروارد پیام از مقصد\n۵. ثبت خودکار هنگام دریافت Update\n۶. رویداد عضویت و تغییر وضعیت ربات\n\n<b>بررسی‌های تکمیلی</b>\nنوع مقصد، عضویت ربات، مجوز ارسال، تعداد اعضا، تعداد مدیران و مقصد مرتبط.\n\nبرای شناسایی مستقیم از <code>/detectshare</code> در گفتگوی خصوصی مالک استفاده کنید.",
        "keyboard": [
          [
            {
              "text": "🔎 شناسایی با شناسه یا یوزرنیم",
              "callback_data": "ui:owner:detect",
              "style": "primary"
            }
          ],
          [
            {
              "text": "📲 انتخاب مستقیم از تلگرام",
              "callback_data": "ui:owner:detect",
              "style": "primary"
            }
          ],
          [
            {
              "text": "📚 راهنمای /detect",
              "callback_data": "ui:cmd:detect",
              "style": "primary"
            },
            {
              "text": "📚 راهنمای /detectshare",
              "callback_data": "ui:cmd:detectshare",
              "style": "primary"
            }
          ],
          [
            {
              "text": "⬅️ راهنمای اصلی",
              "callback_data": "ui:help",
              "style": "primary"
            },
            {
              "text": "🏠 منوی اصلی",
              "callback_data": "ui:home",
              "style": "primary"
            }
          ]
        ]
      },
      "install": {
        "title": "📝 پیام ورود ربات",
        "text": "<b>پیام ورود MUNITOS</b>\n\nاین پیام زمانی ارسال می‌شود که ربات برای اولین بار به گروه اضافه شود. متن یا رسانه را در گروه تنظیم کنید.",
        "keyboard": [
          [
            {
              "text": "✏️ تنظیم پیام ورود",
              "callback_data": "ui:cmd:setinstallmsg",
              "style": "primary"
            },
            {
              "text": "👁 مشاهده پیام",
              "callback_data": "ui:cmd:getinstallmsg",
              "style": "primary"
            }
          ],
          [
            {
              "text": "♻️ بازنشانی پیام",
              "callback_data": "ui:cmd:resetinstallmsg",
              "style": "danger"
            }
          ],
          [
            {
              "text": "⚙️ پنل گروه",
              "callback_data": "group:panel",
              "style": "primary"
            }
          ]
        ]
      }
    },
    "commands": {
      "mute": {
        "title": "🔇 سکوت کاربر",
        "description": "ارسال پیام کاربر هدف را در گروه محدود می‌کند. ربات باید دسترسی Restrict Members داشته باشد.",
        "usage": "روی پیام کاربر ریپلای کن و /mute را بفرست.",
        "section": "moderation",
        "triggerText": "/mute  •  سکوت",
        "scopeText": "گروه"
      },
      "unmute": {
        "title": "🟢 رفع سکوت",
        "description": "محدودیت ارسال پیام کاربر هدف را برمی‌دارد.",
        "usage": "روی پیام کاربر ریپلای کن و /unmute را بفرست.",
        "section": "moderation",
        "triggerText": "/unmute  •  رفع_سکوت",
        "scopeText": "گروه"
      },
      "ban": {
        "title": "⛔ مسدودسازی کاربر",
        "description": "کاربر هدف را از گروه مسدود می‌کند. ربات باید دسترسی Ban Users داشته باشد.",
        "usage": "روی پیام کاربر ریپلای کن و /ban را بفرست.",
        "section": "ban",
        "triggerText": "/ban  •  بن",
        "scopeText": "گروه"
      },
      "unban": {
        "title": "✅ رفع مسدودی",
        "description": "مسدودیت کاربر هدف را در تلگرام برمی‌دارد.",
        "usage": "روی پیام کاربر ریپلای کن و /unban را بفرست.",
        "section": "ban",
        "triggerText": "/unban  •  رفع_بن",
        "scopeText": "گروه"
      },
      "setwelcome": {
        "title": "✏️ تنظیم پیام خوش‌آمد",
        "description": "متن خوش‌آمد اختصاصی همین گروه را ذخیره می‌کند.",
        "usage": "/setwelcome متن پیام",
        "section": "welcome",
        "triggerText": "/setwelcome",
        "scopeText": "گروه"
      },
      "getwelcome": {
        "title": "👁 مشاهده پیام خوش‌آمد",
        "description": "متن فعلی خوش‌آمد همین گروه را نمایش می‌دهد.",
        "usage": "/getwelcome",
        "section": "welcome",
        "triggerText": "/getwelcome  •  خوشامد فعلی",
        "scopeText": "گروه"
      },
      "resetwelcome": {
        "title": "♻️ بازنشانی خوش‌آمد",
        "description": "متن سفارشی را حذف و متن پیش‌فرض را فعال می‌کند.",
        "usage": "/resetwelcome",
        "section": "welcome",
        "triggerText": "/resetwelcome",
        "scopeText": "گروه"
      },
      "welcome_on": {
        "title": "🟢 روشن‌کردن خوش‌آمد",
        "description": "ارسال پیام هنگام ورود اعضا را فعال می‌کند.",
        "usage": "/welcome_on",
        "section": "welcome",
        "triggerText": "/welcome_on",
        "scopeText": "گروه"
      },
      "welcome_off": {
        "title": "🔴 خاموش‌کردن خوش‌آمد",
        "description": "ارسال پیام هنگام ورود اعضا را غیرفعال می‌کند.",
        "usage": "/welcome_off",
        "section": "welcome",
        "triggerText": "/welcome_off",
        "scopeText": "گروه"
      },
      "setgoodbye": {
        "title": "✏️ تنظیم پیام خداحافظی",
        "description": "متن خداحافظی اختصاصی همین گروه را ذخیره می‌کند.",
        "usage": "/setgoodbye متن پیام",
        "section": "goodbye",
        "triggerText": "/setgoodbye",
        "scopeText": "گروه"
      },
      "getgoodbye": {
        "title": "👁 مشاهده پیام خداحافظی",
        "description": "متن فعلی خداحافظی همین گروه را نمایش می‌دهد.",
        "usage": "/getgoodbye",
        "section": "goodbye",
        "triggerText": "/getgoodbye",
        "scopeText": "گروه"
      },
      "resetgoodbye": {
        "title": "♻️ بازنشانی خداحافظی",
        "description": "متن سفارشی خداحافظی را حذف می‌کند.",
        "usage": "/resetgoodbye",
        "section": "goodbye",
        "triggerText": "/resetgoodbye",
        "scopeText": "گروه"
      },
      "goodbye_on": {
        "title": "🟢 روشن‌کردن خداحافظی",
        "description": "ارسال پیام هنگام خروج اعضا را فعال می‌کند.",
        "usage": "/goodbye_on",
        "section": "goodbye",
        "triggerText": "/goodbye_on",
        "scopeText": "گروه"
      },
      "goodbye_off": {
        "title": "🔴 خاموش‌کردن خداحافظی",
        "description": "ارسال پیام هنگام خروج اعضا را غیرفعال می‌کند.",
        "usage": "/goodbye_off",
        "section": "goodbye",
        "triggerText": "/goodbye_off",
        "scopeText": "گروه"
      },
      "info": {
        "title": "👤 اطلاعات پایه کاربر",
        "description": "اطلاعات پایه کاربر را از Telegram دریافت می‌کند.",
        "usage": "روی پیام کاربر ریپلای کن و /info را بفرست.",
        "section": "info",
        "triggerText": "/info  •  اطلاعات کاربر",
        "scopeText": "گروه"
      },
      "quota": {
        "title": "📊 سهمیه ماهانه",
        "description": "مصرف و سهمیه ماهانه گفتگوی فعلی را نمایش می‌دهد.",
        "usage": "/quota",
        "section": "quota",
        "triggerText": "/quota  •  سهمیه",
        "scopeText": "همه گفتگوها"
      },
      "broadcast": {
        "title": "📢 ارسال پیام همگانی",
        "description": "پیام را پس از تأیید در صف ارسال به مقصدهای ثبت‌شده قرار می‌دهد.",
        "usage": "/broadcast",
        "section": "owner",
        "triggerText": "/broadcast",
        "scopeText": "گفتگوی خصوصی"
      },
      "plan": {
        "title": "🎚 تنظیم پلن مقصد",
        "description": "پلن یک گروه یا کانال را به‌صورت دستی تنظیم می‌کند.",
        "usage": "/plan CHAT_ID free|pro|unlimited",
        "section": "owner",
        "triggerText": "/plan",
        "scopeText": "گفتگوی خصوصی"
      },
      "runtime": {
        "title": "📊 وضعیت Runtime",
        "description": "نسخه موتور، دیتابیس، تعداد فرمان‌ها، Workflowها و صف را نمایش می‌دهد.",
        "usage": "/runtime",
        "section": "runtime",
        "triggerText": "/runtime",
        "scopeText": "گفتگوی خصوصی"
      },
      "runtime_logs": {
        "title": "📜 گزارش‌های Runtime",
        "description": "آخرین گزارش‌های خطا و رویدادهای موتور را نمایش می‌دهد.",
        "usage": "/runtime_logs",
        "section": "runtime",
        "triggerText": "/runtime_logs",
        "scopeText": "گفتگوی خصوصی"
      },
      "runtime_queue": {
        "title": "🧾 وضعیت صف",
        "description": "تعداد Jobهای در انتظار، ناموفق و در حال اجرا را نمایش می‌دهد.",
        "usage": "/runtime_queue",
        "section": "runtime",
        "triggerText": "/runtime_queue",
        "scopeText": "گفتگوی خصوصی"
      },
      "runtime_pause": {
        "title": "⏸ توقف صف پس‌زمینه",
        "description": "پردازش صف و زمان‌بندی‌ها را متوقف می‌کند؛ پیام‌های ورودی همچنان دریافت می‌شوند.",
        "usage": "/runtime_pause",
        "section": "runtime",
        "triggerText": "/runtime_pause",
        "scopeText": "گفتگوی خصوصی"
      },
      "runtime_resume": {
        "title": "▶️ ادامه صف پس‌زمینه",
        "description": "پردازش صف و زمان‌بندی‌ها را از سر می‌گیرد.",
        "usage": "/runtime_resume",
        "section": "runtime",
        "triggerText": "/runtime_resume",
        "scopeText": "گفتگوی خصوصی"
      },
      "start": {
        "title": "🏠 شروع",
        "description": "نمایش منوی اصلی MUNITOS و دسترسی به بخش‌های تعاملی.",
        "usage": "/start",
        "section": "general",
        "triggerText": "/start  •  شروع",
        "scopeText": "همه گفتگوها"
      },
      "help": {
        "title": "📚 راهنمای امکانات",
        "description": "نمایش راهنمای دسته‌بندی‌شده و دکمه‌ای امکانات و فرمان‌ها.",
        "usage": "/help",
        "section": "general",
        "triggerText": "/help  •  راهنما  •  کمک",
        "scopeText": "همه گفتگوها"
      },
      "id": {
        "title": "🆔 شناسه‌ها",
        "description": "نمایش شناسه گفتگو، شناسه کاربر و نوع گفتگو.",
        "usage": "/id",
        "section": "info",
        "triggerText": "/id  •  شناسه",
        "scopeText": "همه گفتگوها"
      },
      "groups": {
        "title": "👥 فهرست گروه‌ها",
        "description": "نمایش مقصدهای گروهی ثبت‌شده به شکل کارت‌های قابل انتخاب.",
        "usage": "/groups",
        "section": "owner",
        "triggerText": "/groups  •  گروه‌ها",
        "scopeText": "گفتگوی خصوصی"
      },
      "channels": {
        "title": "📣 فهرست کانال‌ها",
        "description": "نمایش کانال‌های ثبت‌شده به شکل کارت‌های قابل انتخاب.",
        "usage": "/channels",
        "section": "owner",
        "triggerText": "/channels  •  کانال‌ها",
        "scopeText": "گفتگوی خصوصی"
      },
      "admin": {
        "title": "⚙️ پنل مدیریت",
        "description": "بازکردن پنل خصوصی مالک MUNITOS.",
        "usage": "/admin",
        "section": "owner",
        "triggerText": "/admin  •  /settings",
        "scopeText": "گفتگوی خصوصی"
      },
      "runtime_retry": {
        "title": "🔁 تلاش مجدد Job",
        "description": "یک Job ناموفق را دوباره وارد صف اجرا می‌کند. شناسه Job باید از صفحه صف یا گزارش‌ها برداشته شود.",
        "usage": "/runtime_retry JOB_ID",
        "section": "runtime",
        "triggerText": "/runtime_retry",
        "scopeText": "گفتگوی خصوصی"
      },
      "runtime_cancel": {
        "title": "✖️ لغو Job",
        "description": "یک Job در صف را لغو می‌کند.",
        "usage": "/runtime_cancel JOB_ID",
        "section": "runtime",
        "triggerText": "/runtime_cancel",
        "scopeText": "گفتگوی خصوصی"
      },
      "cancel": {
        "title": "✖️ لغو عملیات",
        "description": "مکالمه یا عملیات در انتظار تأیید را لغو می‌کند.",
        "usage": "/cancel",
        "section": "general",
        "triggerText": "/cancel  •  لغو",
        "scopeText": "گفتگوی خصوصی"
      },
      "detect": {
        "title": "🔎 شناسایی مقصد",
        "description": "تشخیص مقصد بر اساس شناسه عددی، یوزرنیم عمومی یا پیام فورواردشده؛ سپس بررسی وضعیت عضویت و مجوزهای ربات.",
        "triggerText": "/detect · /scanchat · شناسایی مقصد",
        "usage": "/detect @username\n/detect -1001234567890\nیا روی پیام فورواردشده از مقصد پاسخ بده و /detect را اجرا کن.",
        "scopeText": "خصوصی · فقط مالک",
        "section": "detection"
      },
      "detectshare": {
        "title": "📲 انتخاب مستقیم مقصد",
        "description": "نمایش دو دکمه رسمی تلگرام برای انتخاب گروه یا کانالی که ربات عضو آن است؛ پس از انتخاب، مقصد به‌صورت خودکار بررسی و ثبت می‌شود.",
        "triggerText": "/detectshare · انتخاب مقصد",
        "usage": "/detectshare سپس انتخاب گروه یا کانال از صفحه تلگرام.",
        "scopeText": "خصوصی · فقط مالک",
        "section": "detection"
      },
      "repair": {
        "title": "🛠 ترمیم خودکار",
        "description": "فعال‌سازی مجدد صف، بازاعمال اطلاعات ربات و Webhook و قراردادن مقصدهای ثبت‌شده در صف بررسی مجدد دسترسی‌ها.",
        "triggerText": "/repair · /autorepair · ترمیم خودکار",
        "usage": "/repair سپس مشاهده نتیجه در پنل صف و فهرست مقصدها.",
        "scopeText": "خصوصی · فقط مالک",
        "section": "owner"
      },
      "setwelcomemedia": {
        "title": "🖼 تنظیم رسانه خوش‌آمد",
        "description": "رسانه یا پیام نمونه را تنظیم می‌کند. دستور را ریپلای کنید، متن را بعد از دستور بنویسید یا دستور خالی را بفرستید و محتوای بعدی را ارسال کنید.",
        "usage": "/setwelcomemedia یا ریپلای به یک پیام/رسانه",
        "section": "welcome",
        "triggerText": "/setwelcomemedia",
        "scopeText": "مدیران گروه"
      },
      "setwelcometime": {
        "title": "⏱ تنظیم تأخیر خوش‌آمد",
        "description": "تأخیر ارسال پیام خوش‌آمد را برحسب ثانیه تنظیم می‌کند.",
        "usage": "/setwelcometime 30",
        "section": "welcome",
        "triggerText": "/setwelcometime",
        "scopeText": "مدیران گروه"
      },
      "setgoodbyemedia": {
        "title": "🖼 تنظیم رسانه خداحافظی",
        "description": "رسانه یا پیام نمونه خداحافظی را از طریق ریپلای، متن دستور یا پیام بعدی ذخیره می‌کند.",
        "usage": "/setgoodbyemedia یا ریپلای به یک پیام/رسانه",
        "section": "goodbye",
        "triggerText": "/setgoodbyemedia",
        "scopeText": "مدیران گروه"
      },
      "setinstallmsg": {
        "title": "📝 تنظیم پیام ورود ربات",
        "description": "متن یا رسانه‌ای را تنظیم می‌کند که هنگام اضافه‌شدن ربات به گروه برای اولین بار ارسال می‌شود.",
        "usage": "/setinstallmsg متن پیام؛ یا ریپلای به پیام/رسانه؛ یا دستور خالی و سپس ارسال محتوا",
        "section": "welcome",
        "triggerText": "/setinstallmsg",
        "scopeText": "مدیران گروه"
      },
      "getinstallmsg": {
        "title": "👁 مشاهده پیام ورود ربات",
        "description": "متن و منبع رسانه‌ای پیام ورود فعلی را نشان می‌دهد.",
        "usage": "/getinstallmsg",
        "section": "welcome",
        "triggerText": "/getinstallmsg",
        "scopeText": "مدیران گروه"
      },
      "resetinstallmsg": {
        "title": "♻️ بازنشانی پیام ورود ربات",
        "description": "تنظیم اختصاصی پیام ورود ربات را حذف و مقدار پیش‌فرض را فعال می‌کند.",
        "usage": "/resetinstallmsg",
        "section": "welcome",
        "triggerText": "/resetinstallmsg",
        "scopeText": "مدیران گروه"
      },
      "forcejoin": {
        "title": "🔐 عضویت اجباری گروه",
        "description": "فهرست کانال‌ها و گروه‌های اجباری را برای همین گروه تنظیم می‌کند. هر خط یک مقصد است و ربات باید در همه مقصدها مدیر باشد.",
        "usage": "/forcejoin سپس ارسال یک مقصد در هر خط",
        "section": "owner",
        "triggerText": "/forcejoin",
        "scopeText": "مدیران گروه"
      },
      "forcejoin_on": {
        "title": "🟢 فعال‌سازی عضویت اجباری",
        "description": "کنترل عضویت اجباری را برای همین گروه فعال می‌کند.",
        "usage": "/forcejoin_on",
        "section": "owner",
        "triggerText": "/forcejoin_on",
        "scopeText": "مدیران گروه"
      },
      "forcejoin_off": {
        "title": "🔴 غیرفعال‌سازی عضویت اجباری",
        "description": "کنترل عضویت اجباری را برای همین گروه غیرفعال می‌کند.",
        "usage": "/forcejoin_off",
        "section": "owner",
        "triggerText": "/forcejoin_off",
        "scopeText": "مدیران گروه"
      },
      "forcejoin_clear": {
        "title": "🧹 پاک‌کردن فهرست عضویت اجباری",
        "description": "فهرست مقصدهای عضویت اجباری همین گروه را پاک می‌کند.",
        "usage": "/forcejoin_clear",
        "section": "owner",
        "triggerText": "/forcejoin_clear",
        "scopeText": "مدیران گروه"
      },
      "forcejoin_pm": {
        "title": "🔐 عضویت اجباری کاربران خصوصی",
        "description": "فهرست اجباری سراسری برای استفاده کاربران در گفتگوی خصوصی را تنظیم می‌کند.",
        "usage": "/forcejoin_pm سپس ارسال یک مقصد در هر خط",
        "section": "owner",
        "triggerText": "/forcejoin_pm",
        "scopeText": "مالک"
      },
      "forcejoin_pm_off": {
        "title": "🔴 خاموش‌کردن عضویت اجباری خصوصی",
        "description": "کنترل عضویت اجباری در گفتگوی خصوصی را خاموش می‌کند.",
        "usage": "/forcejoin_pm_off",
        "section": "owner",
        "triggerText": "/forcejoin_pm_off",
        "scopeText": "مالک"
      },
      "forcejoin_pm_clear": {
        "title": "🧹 پاک‌کردن فهرست عضویت خصوصی",
        "description": "فهرست مقصدهای اجباری کاربران خصوصی را پاک می‌کند.",
        "usage": "/forcejoin_pm_clear",
        "section": "owner",
        "triggerText": "/forcejoin_pm_clear",
        "scopeText": "مالک"
      },
      "group": {
        "title": "⚙️ پنل مدیریت گروه",
        "description": "پنل تنظیمات همین گروه را باز می‌کند. فقط مدیران واقعی گروه مجازند.",
        "usage": "/group",
        "section": "owner",
        "triggerText": "/group",
        "scopeText": "مدیران گروه"
      },
      "silent_list": {
        "title": "📋 فهرست کاربران سکوت‌شده",
        "description": "فهرست کاربرانی را که در همین گروه سکوت شده‌اند نشان می‌دهد.",
        "usage": "/silentlist",
        "section": "moderation",
        "triggerText": "/silentlist",
        "scopeText": "مدیران گروه"
      },
      "clean_silent_list": {
        "title": "🧹 پاک‌سازی فهرست سکوت",
        "description": "تلاش می‌کند محدودیت ارسال تمام کاربران ثبت‌شده را بردارد؛ موارد ناموفق در فهرست می‌مانند.",
        "usage": "/cleansilentlist",
        "section": "moderation",
        "triggerText": "/cleansilentlist",
        "scopeText": "مدیران دارای مجوز Restrict Members"
      },
      "ban_list": {
        "title": "📋 فهرست کاربران مسدود",
        "description": "فهرست کاربران بن‌شده در همین گروه را نشان می‌دهد.",
        "usage": "/banlist",
        "section": "ban",
        "triggerText": "/banlist",
        "scopeText": "مدیران گروه"
      },
      "clean_ban_list": {
        "title": "🧹 پاک‌سازی فهرست بن",
        "description": "تلاش می‌کند تمام کاربران فهرست را از بن خارج کند؛ موارد ناموفق باقی می‌مانند.",
        "usage": "/cleanbanlist",
        "section": "ban",
        "triggerText": "/cleanbanlist",
        "scopeText": "مدیران دارای مجوز Restrict Members"
      }
    },
    "groupPanel": {
      "text": "<b>مدیریت گروه</b>\nوضعیت قابلیت‌ها و تنظیمات همین گروه را از دکمه‌های زیر کنترل کنید.",
      "keyboard": [
        [
          {
            "text": "👋 تنظیم خوش‌آمد",
            "callback_data": "group:welcome:set",
            "style": "primary"
          },
          {
            "text": "🌙 تنظیم خداحافظی",
            "callback_data": "group:goodbye:set",
            "style": "primary"
          }
        ],
        [
          {
            "text": "📝 پیام ورود ربات",
            "callback_data": "group:install:set",
            "style": "primary"
          }
        ],
        [
          {
            "text": "🔐 تنظیم عضویت اجباری",
            "callback_data": "group:forcejoin",
            "style": "success"
          },
          {
            "text": "📊 وضعیت عضویت اجباری",
            "callback_data": "group:forcejoin:status",
            "style": "success"
          }
        ],
        [
          {
            "text": "🛡 ابزارهای محدودسازی",
            "callback_data": "ui:section:moderation",
            "style": "primary"
          }
        ],
        [
          {
            "text": "🏠 منوی اصلی",
            "callback_data": "ui:home",
            "style": "primary"
          }
        ]
      ]
    },
    "groupMessages": {
      "install": "<b>MUNITOS به گروه اضافه شد.</b>\nبرای مشاهده راهنمای مدیریت، <code>/group</code> را اجرا کنید.",
      "welcome": "<b>سلام !mention عزیز!</b>\nبه گروه <b>!groupname</b> خوش اومدی !emoji\n\nامیدواریم کنارمون لحظات خوبی داشته باشی.",
      "goodbye": "👋 <b>خدانگهدار !mention</b>\nامیدواریم دوباره ببینیمت."
    }
  }
};
