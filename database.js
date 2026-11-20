// MUNITOS 8.0.2 — interactive Persian application database.
// Data-only configuration; executable JavaScript is not permitted by the Runtime parser.
export default {
  "manifest": {
    "name": "MUNITOS",
    "version": "8.0.2",
    "schemaVersion": 1,
    "description": "MUNITOS complete Persian inline-button interface",
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
      "maxLoopItems": 250,
      "maxWorkflowDepth": 12,
      "maxQueueAttempts": 5
    },
    "conversations": {
      "defaultTtlSeconds": 600
    }
  },
  "profile": {
    "name": "MUNITOS",
    "shortDescription": "MUNITOS | Smart Group & Channel Management",
    "description": "MUNITOS؛ مدیریت گروه‌ها و کانال‌ها با منوی تعاملی، ابزارهای مدیریتی و کنترل هوشمند."
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
    "timeZone": "Asia/Baku",
    "defaultPlan": "free",
    "plans": {
      "free": {
        "broadcastMonthly": 100
      },
      "pro": {
        "broadcastMonthly": 1000
      },
      "unlimited": {
        "broadcastMonthly": -1
      }
    }
  },
  "policies": {
    "ownerIdSource": "runtime",
    "groupAdminStatuses": [
      "creator",
      "administrator"
    ],
    "ownerCanManageAllChats": true,
    "registerObservedChats": true
  },
  "modules": {
    "core": {
      "enabled": true,
      "description": "هسته فرمان‌ها و گردش‌کارهای اصلی"
    },
    "group_management": {
      "enabled": true,
      "description": "مدیریت گروه‌ها و اعضا"
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
    "includeInstallCommand": true
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
                "link_preview_options": {
                  "is_disabled": true
                },
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
                "text": "{{runtime.app.ui.home.user.text}}",
                "parse_mode": "HTML",
                "link_preview_options": {
                  "is_disabled": true
                },
                "reply_markup": {
                  "inline_keyboard": {
                    "$expr": {
                      "op": "get",
                      "path": "runtime.app.ui.home.user.keyboard"
                    }
                  }
                }
              }
            }
          ]
        }
      ],
      "title": "🏠 منوی اصلی"
    },
    "help": {
      "module": "core",
      "triggers": [
        "/help",
        "راهنما",
        "کمک"
      ],
      "description": "راهنمای تعاملی و دکمه‌ای امکانات",
      "scope": "any",
      "roles": [
        "any"
      ],
      "actions": [
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
                "link_preview_options": {
                  "is_disabled": true
                },
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
                "text": "{{runtime.app.ui.help.text}}",
                "parse_mode": "HTML",
                "link_preview_options": {
                  "is_disabled": true
                },
                "reply_markup": {
                  "inline_keyboard": {
                    "$expr": {
                      "op": "get",
                      "path": "runtime.app.ui.help.userKeyboard"
                    }
                  }
                }
              }
            }
          ]
        }
      ],
      "title": "📚 راهنمای امکانات"
    },
    "id": {
      "module": "core",
      "triggers": [
        "/id",
        "شناسه"
      ],
      "description": "نمایش شناسه کاربر و گفتگو",
      "scope": "any",
      "roles": [
        "any"
      ],
      "actions": [
        {
          "type": "telegram.call",
          "method": "sendMessage",
          "payload": {
            "chat_id": "{{chat.id}}",
            "text": "<b>شناسه‌های تلگرام</b>\nشناسه گفتگو: <code>{{chat.id}}</code>\nشناسه کاربر: <code>{{user.id}}</code>\nنوع گفتگو: <code>{{chat.type}}</code>",
            "parse_mode": "HTML",
            "link_preview_options": {
              "is_disabled": true
            }
          }
        }
      ],
      "title": "🆔 شناسه‌ها",
      "section": "info",
      "usage": "/id"
    },
    "setwelcome": {
      "module": "group_management",
      "feature": "welcome",
      "triggers": [
        "/setwelcome"
      ],
      "description": "تنظیم پیام خوش‌آمد گروه",
      "scope": "group",
      "roles": [
        "owner",
        "admin"
      ],
      "actions": [
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
              "key": "welcome.text",
              "value": "{{argsText}}"
            },
            {
              "type": "telegram.call",
              "method": "sendMessage",
              "payload": {
                "chat_id": "{{chat.id}}",
                "text": "پیام خوش‌آمد این گفتگو ذخیره شد.",
                "reply_to_message_id": "{{message.message_id}}"
              }
            }
          ],
          "else": [
            {
              "type": "telegram.call",
              "method": "sendMessage",
              "payload": {
                "chat_id": "{{chat.id}}",
                "text": "استفاده: /setwelcome متن پیام خوش‌آمد",
                "reply_to_message_id": "{{message.message_id}}"
              }
            }
          ]
        }
      ],
      "title": "✏️ تنظیم پیام خوش‌آمد",
      "section": "welcome",
      "usage": "/setwelcome متن پیام"
    },
    "mute": {
      "module": "group_management",
      "feature": "moderation",
      "triggers": [
        "/mute",
        "سکوت"
      ],
      "description": "سکوت کاربر با ریپلای",
      "scope": "group",
      "roles": [
        "owner",
        "admin"
      ],
      "actions": [
        {
          "type": "condition",
          "if": {
            "exists": "reply.from.id"
          },
          "then": [
            {
              "type": "telegram.call",
              "method": "restrictChatMember",
              "payload": {
                "chat_id": "{{chat.id}}",
                "user_id": "{{reply.from.id}}",
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
              "type": "telegram.call",
              "method": "sendMessage",
              "payload": {
                "chat_id": "{{chat.id}}",
                "text": "کاربر <code>{{reply.from.id}}</code> سکوت شد.",
                "parse_mode": "HTML"
              }
            }
          ],
          "else": [
            {
              "type": "telegram.call",
              "method": "sendMessage",
              "payload": {
                "chat_id": "{{chat.id}}",
                "text": "برای سکوت، روی پیام کاربر ریپلای کن و /mute را بزن."
              }
            }
          ]
        }
      ],
      "title": "🔇 سکوت کاربر",
      "section": "moderation",
      "usage": "روی پیام کاربر ریپلای کن و /mute را بفرست."
    },
    "unmute": {
      "module": "group_management",
      "feature": "moderation",
      "triggers": [
        "/unmute",
        "رفع_سکوت"
      ],
      "description": "لغو سکوت کاربر با ریپلای",
      "scope": "group",
      "roles": [
        "owner",
        "admin"
      ],
      "actions": [
        {
          "type": "condition",
          "if": {
            "exists": "reply.from.id"
          },
          "then": [
            {
              "type": "telegram.call",
              "method": "restrictChatMember",
              "payload": {
                "chat_id": "{{chat.id}}",
                "user_id": "{{reply.from.id}}",
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
              "type": "telegram.call",
              "method": "sendMessage",
              "payload": {
                "chat_id": "{{chat.id}}",
                "text": "سکوت کاربر برداشته شد."
              }
            }
          ],
          "else": [
            {
              "type": "telegram.call",
              "method": "sendMessage",
              "payload": {
                "chat_id": "{{chat.id}}",
                "text": "برای لغو سکوت، روی پیام کاربر ریپلای کن و /unmute را بزن."
              }
            }
          ]
        }
      ],
      "title": "🟢 رفع سکوت",
      "section": "moderation",
      "usage": "روی پیام کاربر ریپلای کن و /unmute را بفرست."
    },
    "ban": {
      "module": "group_management",
      "feature": "moderation",
      "triggers": [
        "/ban",
        "بن"
      ],
      "description": "مسدودسازی کاربر با ریپلای",
      "scope": "group",
      "roles": [
        "owner",
        "admin"
      ],
      "actions": [
        {
          "type": "condition",
          "if": {
            "exists": "reply.from.id"
          },
          "then": [
            {
              "type": "telegram.call",
              "method": "banChatMember",
              "payload": {
                "chat_id": "{{chat.id}}",
                "user_id": "{{reply.from.id}}"
              }
            },
            {
              "type": "telegram.call",
              "method": "sendMessage",
              "payload": {
                "chat_id": "{{chat.id}}",
                "text": "کاربر مسدود شد."
              }
            }
          ],
          "else": [
            {
              "type": "telegram.call",
              "method": "sendMessage",
              "payload": {
                "chat_id": "{{chat.id}}",
                "text": "برای بن، روی پیام کاربر ریپلای کن و /ban را بزن."
              }
            }
          ]
        }
      ],
      "title": "⛔ مسدودسازی کاربر",
      "section": "ban",
      "usage": "روی پیام کاربر ریپلای کن و /ban را بفرست."
    },
    "unban": {
      "module": "group_management",
      "feature": "moderation",
      "triggers": [
        "/unban",
        "رفع_بن"
      ],
      "description": "لغو مسدودسازی کاربر با ریپلای",
      "scope": "group",
      "roles": [
        "owner",
        "admin"
      ],
      "actions": [
        {
          "type": "condition",
          "if": {
            "exists": "reply.from.id"
          },
          "then": [
            {
              "type": "telegram.call",
              "method": "unbanChatMember",
              "payload": {
                "chat_id": "{{chat.id}}",
                "user_id": "{{reply.from.id}}",
                "only_if_banned": true
              }
            },
            {
              "type": "telegram.call",
              "method": "sendMessage",
              "payload": {
                "chat_id": "{{chat.id}}",
                "text": "مسدودیت کاربر لغو شد."
              }
            }
          ],
          "else": [
            {
              "type": "telegram.call",
              "method": "sendMessage",
              "payload": {
                "chat_id": "{{chat.id}}",
                "text": "برای رفع بن، روی پیام کاربر ریپلای کن و /unban را بزن."
              }
            }
          ]
        }
      ],
      "title": "✅ رفع مسدودی",
      "section": "ban",
      "usage": "روی پیام کاربر ریپلای کن و /unban را بفرست."
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
          "type": "quota.get",
          "quota": "broadcast",
          "chatId": "{{chat.id}}",
          "as": "quotaInfo"
        },
        {
          "type": "telegram.call",
          "method": "sendMessage",
          "payload": {
            "chat_id": "{{chat.id}}",
            "text": "سهمیه ماهانه این گفتگو\nمصرف‌شده: {{quotaInfo.used}}\nسقف: {{quotaInfo.limit}}\nباقی‌مانده: {{quotaInfo.remaining}}\nپلن: {{quotaInfo.plan}}",
            "reply_to_message_id": "{{message.message_id}}"
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
                    "callback_data": "ui:owner:home"
                  },
                  {
                    "text": "🧾 وضعیت صف",
                    "callback_data": "ui:owner:queue"
                  }
                ],
                [
                  {
                    "text": "📜 گزارش‌ها",
                    "callback_data": "ui:owner:logs"
                  },
                  {
                    "text": "🏠 خانه",
                    "callback_data": "ui:home"
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
                    "callback_data": "ui:owner:home"
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
                    "callback_data": "ui:owner:queue"
                  },
                  {
                    "text": "⬅️ پنل مدیریت",
                    "callback_data": "ui:owner:home"
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
      "module": "owner_management",
      "triggers": [
        "/cancel",
        "لغو"
      ],
      "description": "لغو عملیات در حال انجام",
      "scope": "private",
      "roles": [
        "owner"
      ],
      "actions": [
        {
          "type": "conversation.end"
        },
        {
          "type": "state.delete",
          "scope": "user",
          "key": "broadcast.pending"
        },
        {
          "type": "state.delete",
          "scope": "user",
          "key": "target.message.pending"
        },
        {
          "type": "telegram.call",
          "method": "sendMessage",
          "payload": {
            "chat_id": "{{chat.id}}",
            "text": "عملیات لغو شد."
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
        "owner",
        "admin"
      ],
      "feature": "welcome",
      "title": "👁 مشاهده پیام خوش‌آمد",
      "triggers": [
        "/getwelcome",
        "خوشامد فعلی"
      ],
      "description": "نمایش متن خوش‌آمد فعلی گروه",
      "actions": [
        {
          "type": "state.get",
          "scope": "chat",
          "key": "welcome.text",
          "default": "سلام {{message.new_chat_members.0.first_name}}، به {{chat.title}} خوش آمدی.",
          "as": "welcomeText"
        },
        {
          "type": "telegram.call",
          "method": "sendMessage",
          "payload": {
            "chat_id": "{{chat.id}}",
            "text": "<b>پیام خوش‌آمد فعلی</b>\n\n{{welcomeText}}",
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
        "owner",
        "admin"
      ],
      "feature": "welcome",
      "title": "♻️ بازنشانی خوش‌آمد",
      "triggers": [
        "/resetwelcome"
      ],
      "description": "حذف متن سفارشی خوش‌آمد",
      "actions": [
        {
          "type": "state.delete",
          "scope": "chat",
          "key": "welcome.text"
        },
        {
          "type": "telegram.call",
          "method": "sendMessage",
          "payload": {
            "chat_id": "{{chat.id}}",
            "text": "متن خوش‌آمد به حالت پیش‌فرض بازگشت.",
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
        "owner",
        "admin"
      ],
      "feature": "welcome",
      "title": "🟢 روشن‌کردن خوش‌آمد",
      "triggers": [
        "/welcome_on"
      ],
      "description": "فعال‌کردن خوش‌آمدگویی",
      "actions": [
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
            "text": "خوش‌آمدگویی در این گروه فعال شد.",
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
        "owner",
        "admin"
      ],
      "feature": "welcome",
      "title": "🔴 خاموش‌کردن خوش‌آمد",
      "triggers": [
        "/welcome_off"
      ],
      "description": "غیرفعال‌کردن خوش‌آمدگویی",
      "actions": [
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
            "text": "خوش‌آمدگویی در این گروه غیرفعال شد.",
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
        "owner",
        "admin"
      ],
      "feature": "goodbye",
      "title": "✏️ تنظیم پیام خداحافظی",
      "triggers": [
        "/setgoodbye"
      ],
      "description": "ذخیره متن خداحافظی گروه",
      "actions": [
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
              "key": "goodbye.text",
              "value": "{{argsText}}"
            },
            {
              "type": "telegram.call",
              "method": "sendMessage",
              "payload": {
                "chat_id": "{{chat.id}}",
                "text": "متن خداحافظی این گروه ذخیره شد.",
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
                "text": "استفاده: <code>/setgoodbye متن پیام</code>",
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
    "getgoodbye": {
      "module": "group_management",
      "scope": "group",
      "roles": [
        "owner",
        "admin"
      ],
      "feature": "goodbye",
      "title": "👁 مشاهده پیام خداحافظی",
      "triggers": [
        "/getgoodbye"
      ],
      "description": "نمایش متن خداحافظی فعلی گروه",
      "actions": [
        {
          "type": "state.get",
          "scope": "chat",
          "key": "goodbye.text",
          "default": "خدانگهدار {{message.left_chat_member.first_name}}؛ امیدواریم دوباره ببینیمت.",
          "as": "goodbyeText"
        },
        {
          "type": "telegram.call",
          "method": "sendMessage",
          "payload": {
            "chat_id": "{{chat.id}}",
            "text": "<b>پیام خداحافظی فعلی</b>\n\n{{goodbyeText}}",
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
        "owner",
        "admin"
      ],
      "feature": "goodbye",
      "title": "♻️ بازنشانی خداحافظی",
      "triggers": [
        "/resetgoodbye"
      ],
      "description": "حذف متن سفارشی خداحافظی",
      "actions": [
        {
          "type": "state.delete",
          "scope": "chat",
          "key": "goodbye.text"
        },
        {
          "type": "telegram.call",
          "method": "sendMessage",
          "payload": {
            "chat_id": "{{chat.id}}",
            "text": "متن خداحافظی به حالت پیش‌فرض بازگشت.",
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
        "owner",
        "admin"
      ],
      "feature": "goodbye",
      "title": "🟢 روشن‌کردن خداحافظی",
      "triggers": [
        "/goodbye_on"
      ],
      "description": "فعال‌کردن پیام خروج اعضا",
      "actions": [
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
            "text": "خداحافظی در این گروه فعال شد.",
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
        "owner",
        "admin"
      ],
      "feature": "goodbye",
      "title": "🔴 خاموش‌کردن خداحافظی",
      "triggers": [
        "/goodbye_off"
      ],
      "description": "غیرفعال‌کردن پیام خروج اعضا",
      "actions": [
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
            "text": "خداحافظی در این گروه غیرفعال شد.",
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
      "scope": "group",
      "roles": [
        "any"
      ],
      "title": "👤 اطلاعات کاربر",
      "triggers": [
        "/info",
        "اطلاعات کاربر"
      ],
      "description": "مشاهده اطلاعات پایه کاربر با ریپلای",
      "actions": [
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
                    "callback_data": "ui:broadcast:confirm"
                  },
                  {
                    "text": "✖️ لغو",
                    "callback_data": "ui:broadcast:cancel"
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
          "key": "bot:username",
          "value": "{{botInfo.username}}"
        },
        {
          "type": "telegram.call",
          "method": "setMyName",
          "payload": {
            "name": "{{runtime.profile.name}}"
          }
        },
        {
          "type": "telegram.call",
          "method": "setMyDescription",
          "payload": {
            "description": "{{runtime.profile.description}}"
          }
        },
        {
          "type": "telegram.call",
          "method": "setMyShortDescription",
          "payload": {
            "short_description": "{{runtime.profile.shortDescription}}"
          }
        },
        {
          "type": "condition",
          "if": "{{runtime.syncTelegramCommands}}",
          "then": [
            {
              "type": "telegram.call",
              "method": "setMyCommands",
              "payload": {
                "commands": "{{runtime.commandMenu}}"
              }
            },
            {
              "type": "telegram.call",
              "method": "setMyCommands",
              "payload": {
                "commands": "{{runtime.ownerCommandMenu}}",
                "scope": {
                  "type": "chat",
                  "chat_id": "{{owner.id}}"
                }
              }
            }
          ]
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
          }
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
                        "callback_data": "ui:owner:{{kind}}:{{prevPage}}"
                      },
                      {
                        "text": "صفحه بعد ➡️",
                        "callback_data": "ui:owner:{{kind}}:{{nextPage}}"
                      }
                    ],
                    [
                      {
                        "text": "🏠 پنل مدیریت",
                        "callback_data": "ui:owner:home"
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
                        "callback_data": "ui:owner:{{kind}}:{{prevPage}}"
                      }
                    ],
                    [
                      {
                        "text": "🏠 پنل مدیریت",
                        "callback_data": "ui:owner:home"
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
                        "callback_data": "ui:owner:{{kind}}:{{nextPage}}"
                      }
                    ],
                    [
                      {
                        "text": "🏠 پنل مدیریت",
                        "callback_data": "ui:owner:home"
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
                        "callback_data": "ui:owner:home"
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
            "text": "╭━━━ ◈ <b>{{kindTitle}}</b> ◈ ━━━╮\n\nتعداد مقصدهای ثبت‌شده: <b>{{registry.count}}</b>\nصفحه: <b>{{pageNumber}}</b>\n\nبرای هر مقصد، جزئیات یا ارسال پیام اختصاصی را انتخاب کن.\n╰━━━━━━━━━━━━━━━━━━━━╯",
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
                "text": "╭━━ ◈ {{target.value.title}} ◈ ━━╮\n\nشناسه: {{target.value.id}}\nنوع: {{target.value.type}}\nوضعیت ارسال: {{targetStatusText}}\nوضعیت عضویت ربات: {{target.value.botStatus}}\n╰━━━━━━━━━━━━━━━━━━━━╯",
                "link_preview_options": {
                  "is_disabled": true
                },
                "reply_markup": {
                  "inline_keyboard": [
                    [
                      {
                        "text": "{{targetButtonLabel}}",
                        "callback_data": "ui:target:{{target.value.id}}"
                      }
                    ],
                    [
                      {
                        "text": "✉️ پیام اختصاصی",
                        "callback_data": "ui:target:message:{{target.value.id}}"
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
                "text": "╭━━━ ◈ <b>جزئیات مقصد MUNITOS</b> ◈ ━━━╮\n\n<b>نام:</b> {{targetRecord.title}}\n<b>شناسه:</b> <code>{{targetRecord.id}}</code>\n<b>نوع:</b> {{targetRecord.type}}\n<b>یوزرنیم:</b> @{{targetRecord.username}}\n<b>عضویت ربات:</b> {{targetRecord.botStatus}}\n<b>وضعیت مقصد:</b> {{targetRecord.active}}\n\n<b>پلن:</b> {{quotaInfo.plan}}\n<b>مصرف این ماه:</b> {{quotaInfo.used}}\n<b>سقف ماهانه:</b> {{quotaInfo.limit}}\n<b>باقی‌مانده:</b> {{quotaInfo.remaining}}\n\n<code>TARGET CONTROL · OWNER ONLY</code>\n╰━━━━━━━━━━━━━━━━━━━━╯",
                "parse_mode": "HTML",
                "link_preview_options": {
                  "is_disabled": true
                },
                "reply_markup": {
                  "inline_keyboard": [
                    [
                      {
                        "text": "🟢 FREE",
                        "callback_data": "ui:target:plan:free:{{targetId}}"
                      },
                      {
                        "text": "⭐ PRO",
                        "callback_data": "ui:target:plan:pro:{{targetId}}"
                      },
                      {
                        "text": "♾ نامحدود",
                        "callback_data": "ui:target:plan:unlimited:{{targetId}}"
                      }
                    ],
                    [
                      {
                        "text": "✉️ ارسال پیام اختصاصی",
                        "callback_data": "ui:target:message:{{targetId}}"
                      }
                    ],
                    [
                      {
                        "text": "🔄 تغییر وضعیت ارسال",
                        "callback_data": "ui:target:toggle:{{targetId}}"
                      }
                    ],
                    [
                      {
                        "text": "⬅️ فهرست گروه‌ها",
                        "callback_data": "ui:owner:groups:0"
                      },
                      {
                        "text": "📣 فهرست کانال‌ها",
                        "callback_data": "ui:owner:channels:0"
                      }
                    ],
                    [
                      {
                        "text": "🏠 پنل مدیریت",
                        "callback_data": "ui:owner:home"
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
                        "callback_data": "ui:owner:home"
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
              "type": "each",
              "items": "{{targets.items}}",
              "as": "target",
              "limit": 250,
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
                      "type": "quota.consume",
                      "quota": "broadcast",
                      "chatId": "{{target.value.id}}",
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
                            "chatId": "{{target.value.id}}",
                            "fromChatId": "{{broadcastPending.sourceChatId}}",
                            "messageId": "{{broadcastPending.sourceMessageId}}",
                            "targetTitle": "{{target.value.title}}"
                          },
                          "maxAttempts": 4
                        }
                      ]
                    }
                  ]
                }
              ]
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
                "text": "✅ پیام همگانی در صف پردازش قرار گرفت. مقصدهای فعال و دارای سهمیه بررسی شدند."
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
                        "callback_data": "ui:target:send:confirm"
                      },
                      {
                        "text": "✖️ لغو",
                        "callback_data": "ui:target:send:cancel"
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
    }
  },
  "events": [
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
      "actions": [
        {
          "type": "state.set",
          "scope": "global",
          "key": "registry:chat:{{chat.id}}",
          "value": {
            "id": "{{chat.id}}",
            "title": "{{chat.title}}",
            "username": "{{chat.username}}",
            "type": "{{chat.type}}",
            "active": true,
            "updatedAt": "{{runtime.iso}}"
          }
        },
        {
          "type": "state.set",
          "scope": "global",
          "key": "registry:groups:{{chat.id}}",
          "value": {
            "id": "{{chat.id}}",
            "title": "{{chat.title}}",
            "username": "{{chat.username}}",
            "type": "{{chat.type}}",
            "active": true,
            "updatedAt": "{{runtime.iso}}"
          }
        }
      ]
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
      "actions": [
        {
          "type": "state.set",
          "scope": "global",
          "key": "registry:chat:{{chat.id}}",
          "value": {
            "id": "{{chat.id}}",
            "title": "{{chat.title}}",
            "username": "{{chat.username}}",
            "type": "{{chat.type}}",
            "active": true,
            "updatedAt": "{{runtime.iso}}"
          }
        },
        {
          "type": "state.set",
          "scope": "global",
          "key": "registry:channels:{{chat.id}}",
          "value": {
            "id": "{{chat.id}}",
            "title": "{{chat.title}}",
            "username": "{{chat.username}}",
            "type": "{{chat.type}}",
            "active": true,
            "updatedAt": "{{runtime.iso}}"
          }
        }
      ]
    },
    {
      "id": "registry.bot.joined",
      "module": "group_management",
      "policy": "registerObservedChats",
      "on": "my_chat_member",
      "match": {
        "chatTypes": [
          "group",
          "supergroup",
          "channel"
        ],
        "chatMemberStatus": [
          "member",
          "administrator"
        ]
      },
      "actions": [
        {
          "type": "state.set",
          "scope": "global",
          "key": "registry:chat:{{chat.id}}",
          "value": {
            "id": "{{chat.id}}",
            "title": "{{chat.title}}",
            "username": "{{chat.username}}",
            "type": "{{chat.type}}",
            "active": true,
            "botStatus": "{{myChatMember.new_chat_member.status}}",
            "updatedAt": "{{runtime.iso}}"
          }
        },
        {
          "type": "try",
          "actions": [
            {
              "type": "telegram.call",
              "method": "sendMessage",
              "payload": {
                "chat_id": "{{chat.id}}",
                "text": "MUNITOS فعال شد. برای راهنما /help را ارسال کن."
              }
            }
          ],
          "catch": [
            {
              "type": "log.write",
              "entry": {
                "level": "warn",
                "code": "group.welcome_unavailable",
                "detail": "{{chat.id}}"
              }
            }
          ]
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
              "value": {
                "id": "{{chat.id}}",
                "title": "{{chat.title}}",
                "username": "{{chat.username}}",
                "type": "{{chat.type}}",
                "active": true,
                "botStatus": "{{myChatMember.new_chat_member.status}}",
                "updatedAt": "{{runtime.iso}}"
              }
            }
          ],
          "else": [
            {
              "type": "state.set",
              "scope": "global",
              "key": "registry:groups:{{chat.id}}",
              "value": {
                "id": "{{chat.id}}",
                "title": "{{chat.title}}",
                "username": "{{chat.username}}",
                "type": "{{chat.type}}",
                "active": true,
                "botStatus": "{{myChatMember.new_chat_member.status}}",
                "updatedAt": "{{runtime.iso}}"
              }
            }
          ]
        }
      ]
    },
    {
      "id": "registry.bot.left",
      "module": "group_management",
      "policy": "registerObservedChats",
      "on": "my_chat_member",
      "match": {
        "chatTypes": [
          "group",
          "supergroup",
          "channel"
        ],
        "chatMemberStatus": [
          "left",
          "kicked"
        ]
      },
      "actions": [
        {
          "type": "state.set",
          "scope": "global",
          "key": "registry:chat:{{chat.id}}",
          "value": {
            "id": "{{chat.id}}",
            "title": "{{chat.title}}",
            "username": "{{chat.username}}",
            "type": "{{chat.type}}",
            "active": false,
            "botStatus": "{{myChatMember.new_chat_member.status}}",
            "updatedAt": "{{runtime.iso}}"
          }
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
              "value": {
                "id": "{{chat.id}}",
                "title": "{{chat.title}}",
                "username": "{{chat.username}}",
                "type": "{{chat.type}}",
                "active": false,
                "botStatus": "{{myChatMember.new_chat_member.status}}",
                "updatedAt": "{{runtime.iso}}"
              }
            }
          ],
          "else": [
            {
              "type": "state.set",
              "scope": "global",
              "key": "registry:groups:{{chat.id}}",
              "value": {
                "id": "{{chat.id}}",
                "title": "{{chat.title}}",
                "username": "{{chat.username}}",
                "type": "{{chat.type}}",
                "active": false,
                "botStatus": "{{myChatMember.new_chat_member.status}}",
                "updatedAt": "{{runtime.iso}}"
              }
            }
          ]
        }
      ]
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
              "key": "welcome.text",
              "default": "👋 سلام {{message.new_chat_members.0.first_name}}، به {{chat.title}} خوش آمدی.",
              "as": "welcomeText"
            },
            {
              "type": "telegram.call",
              "method": "sendMessage",
              "payload": {
                "chat_id": "{{chat.id}}",
                "text": "{{welcomeText}}"
              }
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
          "scope": "chat",
          "key": "goodbye.enabled",
          "default": true,
          "as": "goodbyeEnabled"
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
              "key": "goodbye.text",
              "default": "👋 خدانگهدار {{message.left_chat_member.first_name}}؛ امیدواریم دوباره ببینیمت.",
              "as": "goodbyeText"
            },
            {
              "type": "telegram.call",
              "method": "sendMessage",
              "payload": {
                "chat_id": "{{chat.id}}",
                "text": "{{goodbyeText}}"
              }
            }
          ]
        }
      ]
    }
  ],
  "callbacks": [
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
              "method": "editMessageText",
              "payload": {
                "chat_id": "{{callback.message.chat.id}}",
                "message_id": "{{callback.message.message_id}}",
                "text": "{{runtime.app.ui.home.owner.text}}",
                "parse_mode": "HTML",
                "link_preview_options": {
                  "is_disabled": true
                },
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
              "method": "editMessageText",
              "payload": {
                "chat_id": "{{callback.message.chat.id}}",
                "message_id": "{{callback.message.message_id}}",
                "text": "{{runtime.app.ui.home.user.text}}",
                "parse_mode": "HTML",
                "link_preview_options": {
                  "is_disabled": true
                },
                "reply_markup": {
                  "inline_keyboard": {
                    "$expr": {
                      "op": "get",
                      "path": "runtime.app.ui.home.user.keyboard"
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
              "method": "editMessageText",
              "payload": {
                "chat_id": "{{callback.message.chat.id}}",
                "message_id": "{{callback.message.message_id}}",
                "text": "{{runtime.app.ui.help.text}}",
                "parse_mode": "HTML",
                "link_preview_options": {
                  "is_disabled": true
                },
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
              "method": "editMessageText",
              "payload": {
                "chat_id": "{{callback.message.chat.id}}",
                "message_id": "{{callback.message.message_id}}",
                "text": "{{runtime.app.ui.help.text}}",
                "parse_mode": "HTML",
                "link_preview_options": {
                  "is_disabled": true
                },
                "reply_markup": {
                  "inline_keyboard": {
                    "$expr": {
                      "op": "get",
                      "path": "runtime.app.ui.help.userKeyboard"
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
      "id": "ui.section",
      "module": "core",
      "on": "callback_query",
      "match": {
        "callbackPrefix": "ui:section:"
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
            "text": "╭━━━ ◈ <b>{{uiCommand.title}}</b> ◈ ━━━╮\n\n{{uiCommand.description}}\n\n<b>فرمان‌ها و عبارت‌ها</b>\n<code>{{uiCommand.triggerText}}</code>\n\n<b>نحوه استفاده</b>\n<code>{{uiCommand.usage}}</code>\n\n<b>محدوده</b> · {{uiCommand.scopeText}}\n\n<code>COMMAND DETAILS · MUNITOS</code>\n╰━━━━━━━━━━━━━━━━━━━━╯",
            "reply_markup": {
              "inline_keyboard": [
                [
                  {
                    "text": "⬅️ بازگشت به بخش",
                    "callback_data": "ui:section:{{uiCommand.section}}"
                  },
                  {
                    "text": "🏠 راهنمای اصلی",
                    "callback_data": "ui:help"
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
                        "callback_data": "ui:owner:queue"
                      },
                      {
                        "text": "📜 گزارش‌ها",
                        "callback_data": "ui:owner:logs"
                      }
                    ],
                    [
                      {
                        "text": "🔄 تازه‌سازی",
                        "callback_data": "ui:owner:status"
                      },
                      {
                        "text": "⬅️ پنل مدیریت",
                        "callback_data": "ui:owner:home"
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
                        "callback_data": "ui:owner:queue"
                      },
                      {
                        "text": "📊 وضعیت سیستم",
                        "callback_data": "ui:owner:status"
                      }
                    ],
                    [
                      {
                        "text": "⬅️ پنل مدیریت",
                        "callback_data": "ui:owner:home"
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
                        "callback_data": "ui:owner:logs"
                      },
                      {
                        "text": "📊 وضعیت سیستم",
                        "callback_data": "ui:owner:status"
                      }
                    ],
                    [
                      {
                        "text": "⬅️ پنل مدیریت",
                        "callback_data": "ui:owner:home"
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
                        "callback_data": "ui:owner:queue"
                      },
                      {
                        "text": "📊 وضعیت سیستم",
                        "callback_data": "ui:owner:status"
                      }
                    ],
                    [
                      {
                        "text": "⬅️ پنل مدیریت",
                        "callback_data": "ui:owner:home"
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
                        "callback_data": "ui:owner:queue"
                      },
                      {
                        "text": "📊 وضعیت سیستم",
                        "callback_data": "ui:owner:status"
                      }
                    ],
                    [
                      {
                        "text": "⬅️ پنل مدیریت",
                        "callback_data": "ui:owner:home"
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
            "startsWith": [
              "{{callback.data}}",
              "ui:target:send:"
            ]
          }
        }
      },
      "actions": [
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
                        "callback_data": "ui:owner:home"
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
                                "callback_data": "ui:owner:home"
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
                            "callback_data": "ui:owner:home"
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
      "separator": "━━━━━━━━━━━━━━━━━━",
      "footer": "MUNITOS  •  SMART GROUP & CHANNEL MANAGEMENT",
      "layout": "inline_keyboard",
      "columns": 2
    },
    "home": {
      "user": {
        "text": "╭━━━ ◈ <b>MUNITOS</b> ◈ ━━━╮\n\nبه مرکز مدیریت هوشمند گروه و کانال خوش آمدی.\nبرای دسترسی به ابزارها، یکی از گزینه‌های زیر را انتخاب کن.\n\n<code>SMART GROUP & CHANNEL MANAGEMENT</code>\n╰━━━━━━━━━━━━━━━━━━━━╯",
        "keyboard": [
          [
            {
              "text": "📚 راهنمای امکانات",
              "callback_data": "ui:help"
            },
            {
              "text": "🧩 قابلیت‌های ربات",
              "callback_data": "ui:section:features"
            }
          ],
          [
            {
              "text": "🛡 مدیریت اعضا",
              "callback_data": "ui:section:moderation"
            },
            {
              "text": "⛔ بن و آزادسازی",
              "callback_data": "ui:section:ban"
            }
          ],
          [
            {
              "text": "👋 خوش‌آمدگویی",
              "callback_data": "ui:section:welcome"
            },
            {
              "text": "🌙 خداحافظی",
              "callback_data": "ui:section:goodbye"
            }
          ],
          [
            {
              "text": "👤 اطلاعات کاربر",
              "callback_data": "ui:section:info"
            },
            {
              "text": "📊 سهمیه",
              "callback_data": "ui:section:quota"
            }
          ]
        ]
      },
      "owner": {
        "text": "╭━━━ ◈ <b>MUNITOS CONTROL</b> ◈ ━━━╮\n\nخوش آمدی مالک.\nپنل مرکزی برای کنترل گروه‌ها، کانال‌ها، پلن‌ها و پردازش‌های ربات آماده است.\n\n<code>OWNER ACCESS · VERIFIED</code>\n╰━━━━━━━━━━━━━━━━━━━━╯",
        "keyboard": [
          [
            {
              "text": "⚙️ پنل مدیریت",
              "callback_data": "ui:owner:home"
            },
            {
              "text": "📚 راهنمای امکانات",
              "callback_data": "ui:help"
            }
          ],
          [
            {
              "text": "👥 گروه‌ها",
              "callback_data": "ui:owner:groups:0"
            },
            {
              "text": "📣 کانال‌ها",
              "callback_data": "ui:owner:channels:0"
            }
          ],
          [
            {
              "text": "📢 پیام همگانی",
              "callback_data": "ui:owner:broadcast"
            },
            {
              "text": "📊 وضعیت سیستم",
              "callback_data": "ui:owner:status"
            }
          ],
          [
            {
              "text": "🧩 قابلیت‌ها",
              "callback_data": "ui:section:features"
            },
            {
              "text": "🧠 ابزار Runtime",
              "callback_data": "ui:section:runtime"
            }
          ],
          [
            {
              "text": "👤 اطلاعات و شناسه‌ها",
              "callback_data": "ui:section:info"
            }
          ]
        ]
      }
    },
    "help": {
      "text": "╭━━━ ◈ <b>راهنمای کامل MUNITOS</b> ◈ ━━━╮\n\nبرای مشاهدهٔ توضیح و روش استفاده، دسته‌بندی موردنظر را انتخاب کن.\n\n🛡 مدیریت اعضا و محدودیت‌ها\n👋 خوش‌آمدگویی و خداحافظی\n👤 اطلاعات کاربران و شناسه‌ها\n📊 سهمیه، پلن و مدیریت مقصدها\n\nمدیریت گروه‌ها، کانال‌ها و پیام همگانی فقط از پنل خصوصی مالک انجام می‌شود.\n\n<code>SELECT A CATEGORY · MUNITOS</code>\n╰━━━━━━━━━━━━━━━━━━━━╯",
      "keyboard": [
        [
          {
            "text": "🔇 سکوت و محدودیت",
            "callback_data": "ui:section:moderation"
          },
          {
            "text": "⛔ بن و آزادسازی",
            "callback_data": "ui:section:ban"
          }
        ],
        [
          {
            "text": "👋 خوش‌آمدگویی",
            "callback_data": "ui:section:welcome"
          },
          {
            "text": "🌙 پیام خداحافظی",
            "callback_data": "ui:section:goodbye"
          }
        ],
        [
          {
            "text": "👤 اطلاعات کاربر",
            "callback_data": "ui:section:info"
          },
          {
            "text": "📊 سهمیه و پلن",
            "callback_data": "ui:section:quota"
          }
        ],
        [
          {
            "text": "🧩 فهرست امکانات",
            "callback_data": "ui:section:features"
          },
          {
            "text": "📚 ابزارهای عمومی",
            "callback_data": "ui:section:general"
          }
        ],
        [
          {
            "text": "🏠 منوی اصلی",
            "callback_data": "ui:home"
          }
        ]
      ],
      "userKeyboard": [
        [
          {
            "text": "🔇 سکوت و محدودیت",
            "callback_data": "ui:section:moderation"
          },
          {
            "text": "⛔ بن و آزادسازی",
            "callback_data": "ui:section:ban"
          }
        ],
        [
          {
            "text": "👋 خوش‌آمدگویی",
            "callback_data": "ui:section:welcome"
          },
          {
            "text": "🌙 پیام خداحافظی",
            "callback_data": "ui:section:goodbye"
          }
        ],
        [
          {
            "text": "👤 اطلاعات کاربر",
            "callback_data": "ui:section:info"
          },
          {
            "text": "📊 سهمیه و پلن",
            "callback_data": "ui:section:quota"
          }
        ],
        [
          {
            "text": "🧩 فهرست امکانات",
            "callback_data": "ui:section:features"
          },
          {
            "text": "📚 ابزارهای عمومی",
            "callback_data": "ui:section:general"
          }
        ],
        [
          {
            "text": "🏠 منوی اصلی",
            "callback_data": "ui:home"
          }
        ]
      ],
      "ownerKeyboard": [
        [
          {
            "text": "🔇 سکوت و محدودیت",
            "callback_data": "ui:section:moderation"
          },
          {
            "text": "⛔ بن و آزادسازی",
            "callback_data": "ui:section:ban"
          }
        ],
        [
          {
            "text": "👋 خوش‌آمدگویی",
            "callback_data": "ui:section:welcome"
          },
          {
            "text": "🌙 پیام خداحافظی",
            "callback_data": "ui:section:goodbye"
          }
        ],
        [
          {
            "text": "👤 اطلاعات کاربر",
            "callback_data": "ui:section:info"
          },
          {
            "text": "📊 سهمیه و پلن",
            "callback_data": "ui:section:quota"
          }
        ],
        [
          {
            "text": "🧩 فهرست امکانات",
            "callback_data": "ui:section:features"
          },
          {
            "text": "⚙️ ابزارهای مالک",
            "callback_data": "ui:section:owner"
          }
        ],
        [
          {
            "text": "🧠 وضعیت و ابزار Runtime",
            "callback_data": "ui:section:runtime"
          },
          {
            "text": "📚 ابزارهای عمومی",
            "callback_data": "ui:section:general"
          }
        ],
        [
          {
            "text": "🏠 منوی اصلی",
            "callback_data": "ui:home"
          }
        ]
      ]
    },
    "owner": {
      "home": {
        "text": "╭━━━ ◈ <b>مرکز مدیریت MUNITOS</b> ◈ ━━━╮\n\nپنل خصوصی مالک\nمدیریت مقصدها، پلن‌ها، پیام همگانی و وضعیت اجرایی از این بخش انجام می‌شود.\n\n<code>ADMINISTRATION CENTER · OWNER ONLY</code>\n╰━━━━━━━━━━━━━━━━━━━━╯",
        "keyboard": [
          [
            {
              "text": "👥 فهرست گروه‌ها",
              "callback_data": "ui:owner:groups:0"
            },
            {
              "text": "📣 فهرست کانال‌ها",
              "callback_data": "ui:owner:channels:0"
            }
          ],
          [
            {
              "text": "📢 پیام همگانی",
              "callback_data": "ui:owner:broadcast"
            }
          ],
          [
            {
              "text": "📊 وضعیت Runtime",
              "callback_data": "ui:owner:status"
            },
            {
              "text": "🧾 وضعیت صف",
              "callback_data": "ui:owner:queue"
            }
          ],
          [
            {
              "text": "📜 گزارش‌های اخیر",
              "callback_data": "ui:owner:logs"
            }
          ],
          [
            {
              "text": "⏸ توقف صف",
              "callback_data": "ui:owner:pause"
            },
            {
              "text": "▶️ ادامه صف",
              "callback_data": "ui:owner:resume"
            }
          ],
          [
            {
              "text": "📚 راهنما",
              "callback_data": "ui:help"
            },
            {
              "text": "🏠 منوی اصلی",
              "callback_data": "ui:home"
            }
          ]
        ]
      }
    },
    "sections": {
      "moderation": {
        "title": "🛡 مدیریت اعضا",
        "text": "╭━━━ ◈ <b>مدیریت اعضا</b> ◈ ━━━╮\n\nابزارهای مدیریتی اعضا در گروه:\n\n🔇 <b>سکوت</b> — محدودکردن ارسال پیام\n🟢 <b>رفع سکوت</b> — بازگرداندن دسترسی ارسال\n⛔ <b>بن</b> — مسدودسازی کاربر\n✅ <b>رفع بن</b> — آزادسازی کاربر\n\nبرای تعیین کاربر هدف، روی پیام او ریپلای کن و فرمان مربوط را اجرا کن.\n\n<code>GROUP ADMINISTRATORS ONLY</code>\n╰━━━━━━━━━━━━━━━━━━━━╯",
        "keyboard": [
          [
            {
              "text": "🔇 سکوت کاربر",
              "callback_data": "ui:cmd:mute"
            },
            {
              "text": "🟢 رفع سکوت",
              "callback_data": "ui:cmd:unmute"
            }
          ],
          [
            {
              "text": "⛔ بن کاربر",
              "callback_data": "ui:cmd:ban"
            },
            {
              "text": "✅ رفع بن",
              "callback_data": "ui:cmd:unban"
            }
          ],
          [
            {
              "text": "⬅️ راهنمای اصلی",
              "callback_data": "ui:help"
            },
            {
              "text": "🏠 منوی اصلی",
              "callback_data": "ui:home"
            }
          ]
        ]
      },
      "ban": {
        "title": "⛔ بن و آزادسازی",
        "text": "╭━━━ ◈ <b>بن و آزادسازی</b> ◈ ━━━╮\n\nبا ابزار بن، کاربر از گروه مسدود می‌شود. با رفع بن، امکان ورود دوباره برای او فراهم خواهد شد.\n\n<b>روش استفاده:</b> روی پیام کاربر ریپلای کن و فرمان را بفرست.\n\nربات باید دسترسی محدودسازی اعضا داشته باشد.\n╰━━━━━━━━━━━━━━━━━━━━╯",
        "keyboard": [
          [
            {
              "text": "⛔ مسدودسازی",
              "callback_data": "ui:cmd:ban"
            },
            {
              "text": "✅ آزادسازی",
              "callback_data": "ui:cmd:unban"
            }
          ],
          [
            {
              "text": "⬅️ راهنمای اصلی",
              "callback_data": "ui:help"
            },
            {
              "text": "🏠 منوی اصلی",
              "callback_data": "ui:home"
            }
          ]
        ]
      },
      "welcome": {
        "title": "👋 خوش‌آمدگویی",
        "text": "╭━━━ ◈ <b>سیستم خوش‌آمدگویی</b> ◈ ━━━╮\n\nپیام ورود اعضا برای هر گروه جداگانه ذخیره می‌شود.\n\n✏️ تنظیم متن خوش‌آمد\n👁 مشاهده متن فعلی\n♻️ بازگردانی متن پیش‌فرض\n🔘 روشن یا خاموش‌کردن\n\nبرای دریافت مطمئن رویداد ورود، ربات باید در گروه مدیر باشد.\n╰━━━━━━━━━━━━━━━━━━━━╯",
        "keyboard": [
          [
            {
              "text": "✏️ تنظیم پیام",
              "callback_data": "ui:cmd:setwelcome"
            },
            {
              "text": "👁 مشاهده پیام",
              "callback_data": "ui:cmd:getwelcome"
            }
          ],
          [
            {
              "text": "🟢 روشن‌کردن",
              "callback_data": "ui:cmd:welcome_on"
            },
            {
              "text": "🔴 خاموش‌کردن",
              "callback_data": "ui:cmd:welcome_off"
            }
          ],
          [
            {
              "text": "♻️ بازنشانی پیام",
              "callback_data": "ui:cmd:resetwelcome"
            }
          ],
          [
            {
              "text": "⬅️ فهرست امکانات",
              "callback_data": "ui:help"
            },
            {
              "text": "🏠 منوی اصلی",
              "callback_data": "ui:home"
            }
          ]
        ],
        "groupEnabledText": "╭━━━ ◈ <b>تنظیمات خوش‌آمدگویی</b> ◈ ━━━╮\n\nوضعیت فعلی: <b>🟢 روشن</b>\n\nبرای تغییر وضعیت، دکمهٔ زیر را بزن. این گزینه فقط برای مالک یا مدیر واقعی گروه فعال است.\n╰━━━━━━━━━━━━━━━━━━━━╯",
        "groupDisabledText": "╭━━━ ◈ <b>تنظیمات خوش‌آمدگویی</b> ◈ ━━━╮\n\nوضعیت فعلی: <b>🔴 خاموش</b>\n\nبرای فعال‌سازی دوباره، دکمهٔ زیر را بزن. این گزینه فقط برای مالک یا مدیر واقعی گروه فعال است.\n╰━━━━━━━━━━━━━━━━━━━━╯",
        "groupEnabledKeyboard": [
          [
            {
              "text": "🟢 خوش‌آمدگویی روشن است · خاموش‌کردن",
              "callback_data": "ui:welcome:toggle"
            }
          ],
          [
            {
              "text": "✏️ تنظیم پیام",
              "callback_data": "ui:cmd:setwelcome"
            },
            {
              "text": "👁 مشاهده پیام",
              "callback_data": "ui:cmd:getwelcome"
            }
          ],
          [
            {
              "text": "⬅️ بازگشت به راهنما",
              "callback_data": "ui:help"
            },
            {
              "text": "🏠 منوی اصلی",
              "callback_data": "ui:home"
            }
          ]
        ],
        "groupDisabledKeyboard": [
          [
            {
              "text": "🔴 خوش‌آمدگویی خاموش است · روشن‌کردن",
              "callback_data": "ui:welcome:toggle"
            }
          ],
          [
            {
              "text": "✏️ تنظیم پیام",
              "callback_data": "ui:cmd:setwelcome"
            },
            {
              "text": "👁 مشاهده پیام",
              "callback_data": "ui:cmd:getwelcome"
            }
          ],
          [
            {
              "text": "⬅️ بازگشت به راهنما",
              "callback_data": "ui:help"
            },
            {
              "text": "🏠 منوی اصلی",
              "callback_data": "ui:home"
            }
          ]
        ]
      },
      "goodbye": {
        "title": "🌙 خداحافظی",
        "text": "╭━━━ ◈ <b>سیستم خداحافظی</b> ◈ ━━━╮\n\nهنگام خروج یا حذف عضو، پیام خداحافظی اختصاصی گروه ارسال می‌شود.\n\n✏️ تنظیم متن\n👁 مشاهده متن فعلی\n♻️ بازنشانی متن\n🔘 روشن یا خاموش‌کردن\n╰━━━━━━━━━━━━━━━━━━━━╯",
        "keyboard": [
          [
            {
              "text": "✏️ تنظیم پیام",
              "callback_data": "ui:cmd:setgoodbye"
            },
            {
              "text": "👁 مشاهده پیام",
              "callback_data": "ui:cmd:getgoodbye"
            }
          ],
          [
            {
              "text": "🟢 روشن‌کردن",
              "callback_data": "ui:cmd:goodbye_on"
            },
            {
              "text": "🔴 خاموش‌کردن",
              "callback_data": "ui:cmd:goodbye_off"
            }
          ],
          [
            {
              "text": "♻️ بازنشانی پیام",
              "callback_data": "ui:cmd:resetgoodbye"
            }
          ],
          [
            {
              "text": "⬅️ فهرست امکانات",
              "callback_data": "ui:help"
            },
            {
              "text": "🏠 منوی اصلی",
              "callback_data": "ui:home"
            }
          ]
        ],
        "groupEnabledText": "╭━━━ ◈ <b>تنظیمات خداحافظی</b> ◈ ━━━╮\n\nوضعیت فعلی: <b>🟢 روشن</b>\n\nبرای تغییر وضعیت، دکمهٔ زیر را بزن. این گزینه فقط برای مالک یا مدیر واقعی گروه فعال است.\n╰━━━━━━━━━━━━━━━━━━━━╯",
        "groupDisabledText": "╭━━━ ◈ <b>تنظیمات خداحافظی</b> ◈ ━━━╮\n\nوضعیت فعلی: <b>🔴 خاموش</b>\n\nبرای فعال‌سازی دوباره، دکمهٔ زیر را بزن. این گزینه فقط برای مالک یا مدیر واقعی گروه فعال است.\n╰━━━━━━━━━━━━━━━━━━━━╯",
        "groupEnabledKeyboard": [
          [
            {
              "text": "🟢 خداحافظی روشن است · خاموش‌کردن",
              "callback_data": "ui:goodbye:toggle"
            }
          ],
          [
            {
              "text": "✏️ تنظیم پیام",
              "callback_data": "ui:cmd:setgoodbye"
            },
            {
              "text": "👁 مشاهده پیام",
              "callback_data": "ui:cmd:getgoodbye"
            }
          ],
          [
            {
              "text": "⬅️ بازگشت به راهنما",
              "callback_data": "ui:help"
            },
            {
              "text": "🏠 منوی اصلی",
              "callback_data": "ui:home"
            }
          ]
        ],
        "groupDisabledKeyboard": [
          [
            {
              "text": "🔴 خداحافظی خاموش است · روشن‌کردن",
              "callback_data": "ui:goodbye:toggle"
            }
          ],
          [
            {
              "text": "✏️ تنظیم پیام",
              "callback_data": "ui:cmd:setgoodbye"
            },
            {
              "text": "👁 مشاهده پیام",
              "callback_data": "ui:cmd:getgoodbye"
            }
          ],
          [
            {
              "text": "⬅️ بازگشت به راهنما",
              "callback_data": "ui:help"
            },
            {
              "text": "🏠 منوی اصلی",
              "callback_data": "ui:home"
            }
          ]
        ]
      },
      "info": {
        "title": "👤 اطلاعات کاربر",
        "text": "╭━━━ ◈ <b>اطلاعات کاربر</b> ◈ ━━━╮\n\nبرای مشاهده شناسه‌ها از /id استفاده کن.\nبرای دریافت اطلاعات پایه یک عضو، روی پیام او ریپلای کن و /info را بفرست.\n\nاطلاعاتی که Telegram در اختیار ربات قرار دهد نمایش داده می‌شود.\n╰━━━━━━━━━━━━━━━━━━━━╯",
        "keyboard": [
          [
            {
              "text": "🆔 شناسه‌ها",
              "callback_data": "ui:cmd:id"
            },
            {
              "text": "👤 اطلاعات با ریپلای",
              "callback_data": "ui:cmd:info"
            }
          ],
          [
            {
              "text": "⬅️ راهنمای اصلی",
              "callback_data": "ui:help"
            },
            {
              "text": "🏠 منوی اصلی",
              "callback_data": "ui:home"
            }
          ]
        ]
      },
      "general": {
        "title": "📚 ابزارهای عمومی",
        "text": "╭━━━ ◈ <b>ابزارهای عمومی</b> ◈ ━━━╮\n\nفرمان‌های شروع، راهنما، شناسه و سهمیه از این بخش در دسترس‌اند.\n╰━━━━━━━━━━━━━━━━━━━━╯",
        "keyboard": [
          [
            {
              "text": "🏠 شروع",
              "callback_data": "ui:cmd:start"
            },
            {
              "text": "📚 راهنما",
              "callback_data": "ui:cmd:help"
            }
          ],
          [
            {
              "text": "🆔 شناسه",
              "callback_data": "ui:cmd:id"
            },
            {
              "text": "📊 سهمیه",
              "callback_data": "ui:cmd:quota"
            }
          ],
          [
            {
              "text": "✖️ لغو عملیات",
              "callback_data": "ui:cmd:cancel"
            }
          ],
          [
            {
              "text": "⬅️ فهرست امکانات",
              "callback_data": "ui:help"
            },
            {
              "text": "🏠 منوی اصلی",
              "callback_data": "ui:home"
            }
          ]
        ]
      },
      "quota": {
        "title": "📊 سهمیه و پلن",
        "text": "╭━━━ ◈ <b>سهمیه و پلن</b> ◈ ━━━╮\n\nسهمیه پیام همگانی براساس پلن مقصد محاسبه می‌شود. دوره محاسبه ماهانه است.\n\nکاربران می‌توانند سهمیه گفتگوی فعلی را ببینند. تغییر پلن مقصد فقط در اختیار مالک است.\n╰━━━━━━━━━━━━━━━━━━━━╯",
        "keyboard": [
          [
            {
              "text": "📊 مشاهده سهمیه",
              "callback_data": "ui:cmd:quota"
            }
          ],
          [
            {
              "text": "🎚 تنظیم پلن مقصد",
              "callback_data": "ui:cmd:plan"
            }
          ],
          [
            {
              "text": "⬅️ راهنمای اصلی",
              "callback_data": "ui:help"
            },
            {
              "text": "🏠 منوی اصلی",
              "callback_data": "ui:home"
            }
          ]
        ]
      },
      "owner": {
        "title": "⚙️ ابزارهای مالک",
        "text": "╭━━━ ◈ <b>مدیریت مالک</b> ◈ ━━━╮\n\nپنل خصوصی مالک برای فهرست مقصدها، تنظیم پلن، پیام همگانی و کنترل پردازش‌هاست.\n\nاین بخش فقط برای مالک اصلی فعال است.\n╰━━━━━━━━━━━━━━━━━━━━╯",
        "keyboard": [
          [
            {
              "text": "⚙️ بازکردن پنل مدیریت",
              "callback_data": "ui:owner:home"
            }
          ],
          [
            {
              "text": "👥 گروه‌ها",
              "callback_data": "ui:owner:groups:0"
            },
            {
              "text": "📣 کانال‌ها",
              "callback_data": "ui:owner:channels:0"
            }
          ],
          [
            {
              "text": "📢 پیام همگانی",
              "callback_data": "ui:owner:broadcast"
            }
          ],
          [
            {
              "text": "⬅️ بازگشت به راهنما",
              "callback_data": "ui:help"
            },
            {
              "text": "🏠 منوی اصلی",
              "callback_data": "ui:home"
            }
          ]
        ]
      },
      "runtime": {
        "title": "🧠 وضعیت Runtime",
        "text": "╭━━━ ◈ <b>مدیریت Runtime</b> ◈ ━━━╮\n\nوضعیت موتور، صف پردازش و گزارش خطاها از پنل مالک قابل مشاهده است. توقف Runtime فقط پردازش‌های زمان‌بندی‌شده و صف پس‌زمینه را متوقف می‌کند؛ دریافت فرمان‌ها ادامه دارد.\n╰━━━━━━━━━━━━━━━━━━━━╯",
        "keyboard": [
          [
            {
              "text": "📊 وضعیت سیستم",
              "callback_data": "ui:cmd:runtime"
            },
            {
              "text": "🧾 وضعیت صف",
              "callback_data": "ui:cmd:runtime_queue"
            }
          ],
          [
            {
              "text": "📜 گزارش‌های اخیر",
              "callback_data": "ui:cmd:runtime_logs"
            }
          ],
          [
            {
              "text": "🔁 تلاش مجدد Job",
              "callback_data": "ui:cmd:runtime_retry"
            },
            {
              "text": "✖️ لغو Job",
              "callback_data": "ui:cmd:runtime_cancel"
            }
          ],
          [
            {
              "text": "⏸ توقف صف",
              "callback_data": "ui:cmd:runtime_pause"
            },
            {
              "text": "▶️ ادامه صف",
              "callback_data": "ui:cmd:runtime_resume"
            }
          ],
          [
            {
              "text": "⬅️ فهرست امکانات",
              "callback_data": "ui:help"
            },
            {
              "text": "🏠 منوی اصلی",
              "callback_data": "ui:home"
            }
          ]
        ]
      },
      "features": {
        "title": "🧩 امکانات MUNITOS",
        "text": "╭━━━ ◈ <b>امکانات فعال MUNITOS</b> ◈ ━━━╮\n\n🛡 <b>مدیریت اعضا</b>\nسکوت، رفع سکوت، بن و رفع بن با ریپلای و بررسی مجوز مدیر گروه.\n\n👋 <b>خوش‌آمد و خداحافظی</b>\nمتن جداگانه برای هر گروه، همراه با روشن و خاموش‌کردن.\n\n🗂 <b>ثبت گروه و کانال</b>\nثبت خودکار مقصدهایی که ربات در آن‌ها پیام یا رویداد عضویت دریافت می‌کند.\n\n📢 <b>پیام همگانی</b>\nصف ارسال به مقصدهای ثبت‌شده با کنترل سهمیه.\n\n📊 <b>پلن و سهمیه</b>\nسهمیه ماهانه و تنظیم پلن اختصاصی مقصد.\n\n⚙️ <b>پنل مالک</b>\nمدیریت مقصدها، وضعیت Runtime، صف و گزارش‌ها از طریق دکمه‌ها.\n\n<code>ACTIVE FEATURES · DATABASE DRIVEN</code>\n\n<code>ALL FEATURES · DATABASE DRIVEN</code>\n╰━━━━━━━━━━━━━━━━━━━━╯",
        "keyboard": [
          [
            {
              "text": "🛡 مدیریت اعضا",
              "callback_data": "ui:section:moderation"
            },
            {
              "text": "👋 خوش‌آمدگویی",
              "callback_data": "ui:section:welcome"
            }
          ],
          [
            {
              "text": "🌙 خداحافظی",
              "callback_data": "ui:section:goodbye"
            },
            {
              "text": "📊 سهمیه",
              "callback_data": "ui:section:quota"
            }
          ],
          [
            {
              "text": "⚙️ پنل مالک",
              "callback_data": "ui:section:owner"
            }
          ],
          [
            {
              "text": "⬅️ بازگشت به راهنما",
              "callback_data": "ui:help"
            },
            {
              "text": "🏠 منوی اصلی",
              "callback_data": "ui:home"
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
      }
    }
  }
};
