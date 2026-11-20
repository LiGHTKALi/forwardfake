import { DurableObject } from "cloudflare:workers";

const DO_NAME = "forward-scheduler-owner";
const BUILD_VERSION = "5.4.13-config-driven-runtime";
const EMBEDDED_BOT_TOKEN = "9100041417:AAHYOpFKKTGpBQpdHoTAExwZYzlXPqOtSjg";
const EMBEDDED_OWNER_TELEGRAM_ID = "8621035125";
const EMBEDDED_WEBHOOK_SECRET = "fwd_scheduler_8621035125_5_4_0_telegram_edge";
const EMBEDDED_WEBHOOK_URL = "https://forwardfake.killerdutchmobin.workers.dev/telegram/webhook";

const WEBHOOK_MAX_CONNECTIONS = 10;
const WEBHOOK_CHECK_INTERVAL_MS = 5 * 60_000;

const DAY_MS = 86_400_000;
const MAX_DATABASE_BYTES = 20 * 1024 * 1024;
const DATABASE_CHUNK_CHARS = 400_000;
const MAX_RULES = 1_000;
const MAX_LIST_ITEMS = 5_000;
const MAX_TEXT_LENGTH = 8_000;
const MAX_RESOURCE_ENTRIES = 50_000;
const MAX_DATABASE_DEPTH = 40;
const MAX_DATABASE_NODES = 100_000;

const TELEGRAM_HOSTS = new Set(["t.me", "www.t.me", "telegram.me", "www.telegram.me"]);
const USERNAME_RE = /^[A-Za-z][A-Za-z0-9_]{4,31}$/;
const RESOURCE_ID_RE = /^[a-z][a-z0-9_-]{1,47}$/;
const RESOURCE_TYPES = new Set(["kv", "cache", "memory", "counter", "queue", "index"]);

function asText(value) {
  return value == null ? "" : String(value).trim();
}

function normalizeText(value) {
  return asText(value)
    .normalize("NFKC")
    .toLocaleLowerCase("fa-IR")
    .replace(/[\u064B-\u065F\u0670]/g, "")
    .replace(/[\u064A]/g, "ی")
    .replace(/[\u0643]/g, "ک")
    .replace(/[\u200c\u200f\u200e\u0640]/g, " ")
    .replace(/[\p{P}\p{S}]+/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tokenize(value) {
  return normalizeText(value).split(" ").filter(Boolean).slice(0, 80);
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

function parsePublicChannel(value) {
  const raw = asText(value);
  if (!raw) return null;
  const username = raw.startsWith("@")
    ? raw.slice(1)
    : (() => {
        const url = parseTelegramUrl(raw);
        if (!url) return null;
        const parts = url.pathname.split("/").filter(Boolean);
        if (!parts.length || ["c", "s"].includes(parts[0].toLowerCase()) || parts[0].startsWith("+")) return null;
        return parts[0];
      })();
  return username && USERNAME_RE.test(username) ? username : null;
}

function parseMessageLink(value) {
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

class DatabaseConfigParser {
  constructor(source) {
    this.source = String(source ?? "");
    this.index = 0;
    this.nodes = 0;
  }

  #skipTrivia() {
    while (this.index < this.source.length) {
      const char = this.source[this.index];
      if (/\s/.test(char)) {
        this.index += 1;
        continue;
      }
      if (char === "/" && this.source[this.index + 1] === "/") {
        this.index += 2;
        while (this.index < this.source.length && !/[\r\n]/.test(this.source[this.index])) this.index += 1;
        continue;
      }
      if (char === "/" && this.source[this.index + 1] === "*") {
        const end = this.source.indexOf("*/", this.index + 2);
        if (end < 0) throw new Error("database_config_unclosed_comment");
        this.index = end + 2;
        continue;
      }
      break;
    }
  }

  #countNode() {
    this.nodes += 1;
    if (this.nodes > MAX_DATABASE_NODES) throw new Error("database_config_node_limit_exceeded");
  }

  #readString(quote) {
    this.index += 1;
    let output = "";
    while (this.index < this.source.length) {
      const char = this.source[this.index++];
      if (char === quote) return output;
      if ((char === "\n" || char === "\r") && quote !== "`") throw new Error("database_config_unescaped_line_break");
      if (char !== "\\") {
        output += char;
        continue;
      }
      if (this.index >= this.source.length) throw new Error("database_config_invalid_escape");
      const escaped = this.source[this.index++];
      const simple = { n: "\n", r: "\r", t: "\t", b: "\b", f: "\f", v: "\v", "0": "\0" };
      if (Object.hasOwn(simple, escaped)) {
        output += simple[escaped];
      } else if (escaped === "u") {
        const hex = this.source.slice(this.index, this.index + 4);
        if (!/^[0-9a-fA-F]{4}$/.test(hex)) throw new Error("database_config_invalid_unicode_escape");
        output += String.fromCharCode(parseInt(hex, 16));
        this.index += 4;
      } else if (escaped === "x") {
        const hex = this.source.slice(this.index, this.index + 2);
        if (!/^[0-9a-fA-F]{2}$/.test(hex)) throw new Error("database_config_invalid_hex_escape");
        output += String.fromCharCode(parseInt(hex, 16));
        this.index += 2;
      } else if (escaped === "\n") {
        continue;
      } else if (escaped === "\r") {
        if (this.source[this.index] === "\n") this.index += 1;
      } else {
        output += escaped;
      }
    }
    throw new Error("database_config_unclosed_string");
  }

  #readIdentifier() {
    const match = this.source.slice(this.index).match(/^[A-Za-z_$][A-Za-z0-9_$]*/);
    if (!match) return "";
    this.index += match[0].length;
    return match[0];
  }

  #readNumber() {
    const match = this.source.slice(this.index).match(/^[+-]?(?:0[xX][0-9a-fA-F]+|0[bB][01]+|0[oO][0-7]+|(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?)/);
    if (!match) return null;
    const raw = match[0];
    const next = this.source[this.index + raw.length];
    if (next && /[A-Za-z0-9_$]/.test(next)) return null;
    this.index += raw.length;
    const value = Number(raw);
    if (!Number.isFinite(value)) throw new Error("database_config_non_finite_number");
    return value;
  }

  #parseObject(depth) {
    const output = {};
    this.index += 1;
    this.#skipTrivia();
    if (this.source[this.index] === "}") {
      this.index += 1;
      return output;
    }
    for (;;) {
      this.#skipTrivia();
      const quote = this.source[this.index];
      let key = "";
      if (quote === "'" || quote === '"') {
        key = this.#readString(quote);
      } else {
        key = this.#readIdentifier();
      }
      if (!key || ["__proto__", "prototype", "constructor"].includes(key)) {
        throw new Error("database_config_object_key_invalid");
      }
      this.#skipTrivia();
      if (this.source[this.index] !== ":") throw new Error("database_config_expected_colon");
      this.index += 1;
      this.#skipTrivia();
      if (Object.hasOwn(output, key)) throw new Error(`database_config_duplicate_key:${key}`);
      output[key] = this.#parseValue(depth + 1);
      this.#skipTrivia();
      const separator = this.source[this.index];
      if (separator === "}") {
        this.index += 1;
        return output;
      }
      if (separator !== ",") throw new Error("database_config_expected_object_separator");
      this.index += 1;
      this.#skipTrivia();
      if (this.source[this.index] === "}") {
        this.index += 1;
        return output;
      }
    }
  }

  #parseArray(depth) {
    const output = [];
    this.index += 1;
    this.#skipTrivia();
    if (this.source[this.index] === "]") {
      this.index += 1;
      return output;
    }
    for (;;) {
      this.#skipTrivia();
      if (this.source[this.index] === ",") throw new Error("database_config_sparse_array_not_supported");
      output.push(this.#parseValue(depth + 1));
      this.#skipTrivia();
      const separator = this.source[this.index];
      if (separator === "]") {
        this.index += 1;
        return output;
      }
      if (separator !== ",") throw new Error("database_config_expected_array_separator");
      this.index += 1;
      this.#skipTrivia();
      if (this.source[this.index] === "]") {
        this.index += 1;
        return output;
      }
    }
  }

  #parseValue(depth = 0) {
    this.#skipTrivia();
    this.#countNode();
    if (depth > MAX_DATABASE_DEPTH) throw new Error("database_config_depth_limit_exceeded");
    const char = this.source[this.index];
    if (char === "{") return this.#parseObject(depth);
    if (char === "[") return this.#parseArray(depth);
    if (char === "'" || char === '"') return this.#readString(char);
    if (char === "`") {
      // Template literals are accepted as inert configuration strings. The database
      // parser supports JavaScript object-literal syntax, but does not execute code.
      return this.#readString("`");
    }
    const number = this.#readNumber();
    if (number !== null) return number;
    const identifier = this.#readIdentifier();
    if (identifier === "true") return true;
    if (identifier === "false") return false;
    if (identifier === "null") return null;
    if (identifier) throw new Error(`database_config_executable_expression_not_supported:${identifier}`);
    throw new Error("database_config_value_invalid");
  }

  parse() {
    const value = this.#parseValue(0);
    this.#skipTrivia();
    if (this.source[this.index] === ";") {
      this.index += 1;
      this.#skipTrivia();
    }
    return { value, remainder: this.source.slice(this.index).trim() };
  }
}

function skipDatabaseTrivia(source) {
  let index = 0;
  while (index < source.length) {
    if (/\s/.test(source[index])) {
      index += 1;
      continue;
    }
    if (source[index] === "/" && source[index + 1] === "/") {
      index += 2;
      while (index < source.length && !/[\r\n]/.test(source[index])) index += 1;
      continue;
    }
    if (source[index] === "/" && source[index + 1] === "*") {
      const end = source.indexOf("*/", index + 2);
      if (end < 0) throw new Error("database_config_unclosed_comment");
      index = end + 2;
      continue;
    }
    break;
  }
  return index;
}

function parseDatabaseConfig(source) {
  const raw = String(source ?? "").replace(/^\uFEFF/, "").trim();
  const bytes = new TextEncoder().encode(raw).byteLength;
  if (!raw || bytes > MAX_DATABASE_BYTES) throw new Error("database_size_invalid");

  let body = raw;
  const first = skipDatabaseTrivia(body);
  body = body.slice(first);
  let exportedName = "";
  if (body.startsWith("export default")) {
    body = body.slice("export default".length).trim();
  } else if (body.startsWith("module.exports")) {
    const match = body.match(/^module\.exports\s*=/);
    if (!match) throw new Error("database_config_module_assignment_invalid");
    body = body.slice(match[0].length).trim();
  } else {
    const match = body.match(/^(?:export\s+)?(?:const|let|var)\s+([A-Za-z_$][A-Za-z0-9_$]*)\s*=/);
    if (match) {
      exportedName = match[1];
      body = body.slice(match[0].length).trim();
    }
  }

  let parsed;
  try {
    parsed = new DatabaseConfigParser(body).parse();
  } catch (error) {
    if (error instanceof Error && error.message.startsWith("database_config_")) throw error;
    throw new Error("database_config_parse_failed");
  }
  if (parsed.remainder) {
    const expectedExport = exportedName
      ? new RegExp(`^export\\s+default\\s+${exportedName}\\s*;?$`)
      : null;
    if (!expectedExport || !expectedExport.test(parsed.remainder)) {
      throw new Error("database_config_trailing_code_not_supported");
    }
  }
  const database = parsed.value;
  validateDatabase(database);
  return database;
}

function validateDatabase(database) {
  if (!database || typeof database !== "object" || Array.isArray(database)) throw new Error("database_root_invalid");
  if (!Number.isInteger(database.schemaVersion) || database.schemaVersion < 4 || database.schemaVersion > 5) throw new Error("database_schema_version_unsupported");
  if (!database.texts || typeof database.texts !== "object" || Array.isArray(database.texts)) throw new Error("database_texts_missing");
  if (!database.features || typeof database.features !== "object" || Array.isArray(database.features)) throw new Error("database_features_missing");
  if (database.commandMenu != null) {
    if (!Array.isArray(database.commandMenu) || database.commandMenu.length > 100) throw new Error("database_command_menu_invalid");
    for (const [index, item] of database.commandMenu.entries()) {
      if (!item || typeof item !== "object" || Array.isArray(item)
        || !/^\/?[a-z][a-z0-9_]{0,31}$/.test(String(item.command || ""))
        || String(item.command || "").toLowerCase().replace(/^\//, "") === "settings"
        || typeof item.response !== "string" || !item.response.trim() || item.response.length > 8_000
        || (item.description != null && (typeof item.description !== "string" || item.description.trim().length < 3 || item.description.length > 256))
        || (item.enabled != null && typeof item.enabled !== "boolean")) {
        throw new Error(`database_command_menu_item_invalid:${index}`);
      }
    }
  }

  const roles = database.roles ?? {};
  for (const field of ["adminIds", "protectedIds"]) {
    const list = roles[field];
    if (list != null && (!Array.isArray(list) || list.length > 500 || list.some((id) => !/^\d{1,20}$/.test(String(id))))) {
      throw new Error(`database_${field}_invalid`);
    }
  }
  if (roles.adminsByChat != null) {
    if (!roles.adminsByChat || typeof roles.adminsByChat !== "object" || Array.isArray(roles.adminsByChat)) {
      throw new Error("database_admins_by_chat_invalid");
    }
    const chatEntries = Object.entries(roles.adminsByChat);
    if (chatEntries.length > 500) throw new Error("database_admins_by_chat_too_large");
    for (const [chatId, admins] of chatEntries) {
      if (!/^-?\d{1,20}$/.test(chatId) || !Array.isArray(admins) || admins.length > 200 || admins.some((id) => !/^\d{1,20}$/.test(String(id)))) {
        throw new Error("database_admins_by_chat_invalid");
      }
    }
  }

  const limits = database.limits ?? {};
  for (const field of ["groupSendIntervalMs", "chatSendIntervalMs", "channelSendIntervalMs", "ownerSendIntervalMs"]) {
    // Keep send delays compatible with the bounded Worker wait window and avoid
    // deliberately configuring sub-second message bursts.
    if (limits[field] != null && (!Number.isFinite(Number(limits[field])) || Number(limits[field]) < 1_000 || Number(limits[field]) > 4_000)) {
      throw new Error(`database_limit_invalid:${field}`);
    }
  }
  if (limits.maxChatRulesEvaluated != null && (!Number.isInteger(Number(limits.maxChatRulesEvaluated)) || Number(limits.maxChatRulesEvaluated) < 1 || Number(limits.maxChatRulesEvaluated) > 1_000)) {
    throw new Error("database_chat_rule_limit_invalid");
  }
  for (const field of ["maxRegisteredGroups", "maxRegisteredChannels"]) {
    if (limits[field] != null && (!Number.isInteger(Number(limits[field])) || Number(limits[field]) < 1 || Number(limits[field]) > 5_000)) {
      throw new Error(`database_registry_limit_invalid:${field}`);
    }
  }

  const capabilities = database.runtime?.capabilities ?? [];
  if (!Array.isArray(capabilities) || capabilities.length > 128 || capabilities.some((item) => typeof item !== "string" || !/^[a-z][a-z0-9_.-]{0,63}$/.test(item))) {
    throw new Error("database_capabilities_invalid");
  }
  const resources = database.runtime?.resources ?? [];
  if (!Array.isArray(resources) || resources.length > 96) throw new Error("database_resources_invalid");
  const seenResources = new Set();
  let totalResourceEntries = 0;
  for (const resource of resources) {
    if (!resource || typeof resource !== "object" || Array.isArray(resource)) throw new Error("database_resource_invalid");
    const id = String(resource.id || "");
    if (!RESOURCE_ID_RE.test(id) || id === "v2" || seenResources.has(id)) throw new Error("database_resource_id_invalid");
    if (!RESOURCE_TYPES.has(resource.type)) throw new Error(`database_resource_type_unsupported:${id}`);
    seenResources.add(id);
    const ttl = Number(resource.ttlSeconds ?? 0);
    const maxEntries = Number(resource.maxEntries ?? 1_000);
    const schema = Number(resource.schema ?? 1);
    if (!Number.isFinite(ttl) || ttl < 0 || ttl > 31_536_000) throw new Error(`database_resource_ttl_invalid:${id}`);
    if (!Number.isInteger(maxEntries) || maxEntries < 1 || maxEntries > 20_000) throw new Error(`database_resource_capacity_invalid:${id}`);
    if (!Number.isInteger(schema) || schema < 1 || schema > 10_000) throw new Error(`database_resource_schema_invalid:${id}`);
    totalResourceEntries += maxEntries;
    if (resource.onSchemaChange != null && !["keep", "reset"].includes(resource.onSchemaChange)) throw new Error(`database_resource_migration_invalid:${id}`);
    if (resource.eviction != null && !["fifo", "ring", "none"].includes(resource.eviction)) throw new Error(`database_resource_eviction_invalid:${id}`);
  }
  if (totalResourceEntries > MAX_RESOURCE_ENTRIES) throw new Error("database_resource_total_capacity_exceeded");

  for (const descriptor of FEATURE_MODULES) {
    let config = database;
    for (const part of descriptor.path.split(".").slice(0, -1)) config = config?.[part];
    if (!config || typeof config !== "object" || Array.isArray(config)) {
      throw new Error(`database_feature_config_missing:${descriptor.id}`);
    }
    if (typeof config.enabled !== "boolean") {
      throw new Error(`database_feature_enabled_required:${descriptor.id}`);
    }
  }

  const allowedDatabaseHandlers = new Set([
    "help", "profile.info", "moderation.silence", "moderation.unsilence",
    "moderation.silent_list", "moderation.clean_silent_list", "moderation.ban",
    "moderation.unban", "moderation.ban_list", "moderation.clean_ban_list",
    "welcome.on", "welcome.off", "welcome.set", "welcome.get", "welcome.reset",
    "welcome.set_time", "welcome.set_media",
    "goodbye.on", "goodbye.off", "goodbye.set", "goodbye.get", "goodbye.reset", "goodbye.set_media",
  ]);
  if (database.commands != null) {
    if (!Array.isArray(database.commands) || database.commands.length > 100) throw new Error("database_commands_invalid");
    const commandIds = new Set();
    for (const [index, command] of database.commands.entries()) {
      if (!command || typeof command !== "object" || Array.isArray(command)
        || !/^[a-z][a-z0-9_-]{1,47}$/.test(String(command.id || ""))
        || commandIds.has(String(command.id || ""))
        || (!allowedDatabaseHandlers.has(String(command.handler || "")) && !Array.isArray(command.actions))
        || !Array.isArray(command.aliases) || command.aliases.length < 1 || command.aliases.length > 20
        || command.aliases.some((alias) => typeof alias !== "string" || !alias.trim() || alias.length > 80)
        || (command.slashCommands != null && (!Array.isArray(command.slashCommands) || command.slashCommands.length > 10
          || command.slashCommands.some((name) => !/^[a-z][a-z0-9_]{0,31}$/.test(String(name)))))
        || (command.enabled != null && typeof command.enabled !== "boolean")) {
        throw new Error(`database_command_invalid:${index}`);
      }
      if (command.access != null) {
        const access = command.access;
        if (!access || typeof access !== "object" || Array.isArray(access)
          || (access.scope != null && !["group_or_supergroup", "private", "any_chat"].includes(access.scope))
          || (access.requiredRole != null && !["owner", "creator", "administrator", "creator_or_administrator", "member", "any"].includes(access.requiredRole))
          || (access.verification != null && !["telegram_live_membership", "none"].includes(access.verification))
          || (access.botOwnerBypass != null && typeof access.botOwnerBypass !== "boolean")) {
          throw new Error(`database_command_access_invalid:${index}`);
        }
      }
      if (command.actions != null) {
        const actionTypes = new Set(["reply", "send_message", "telegram", "toggle_feature", "set_group_setting", "delete_group_setting", "resource_set", "resource_get", "target_policy_set", "owner_panel_show"]);
        if (!Array.isArray(command.actions) || command.actions.length < 1 || command.actions.length > 25) throw new Error(`database_command_actions_invalid:${index}`);
        for (const [actionIndex, action] of command.actions.entries()) {
          if (!action || typeof action !== "object" || Array.isArray(action) || !actionTypes.has(String(action.type || ""))) {
            throw new Error(`database_command_action_invalid:${index}:${actionIndex}`);
          }
          if (action.type === "telegram" && (!/^[A-Za-z][A-Za-z0-9]{1,63}$/.test(String(action.method || ""))
            || !action.payload || typeof action.payload !== "object" || Array.isArray(action.payload))) {
            throw new Error(`database_command_telegram_action_invalid:${index}:${actionIndex}`);
          }
          if (["set_group_setting", "delete_group_setting", "resource_set", "resource_get", "target_policy_set"].includes(action.type)
            && typeof action.key !== "string") {
            throw new Error(`database_command_action_key_invalid:${index}:${actionIndex}`);
          }
          if (action.type === "toggle_feature" && typeof action.feature !== "string") throw new Error(`database_command_action_feature_invalid:${index}:${actionIndex}`);
          if (action.type === "owner_panel_show" && typeof action.view !== "string") throw new Error(`database_command_action_view_invalid:${index}:${actionIndex}`);
        }
      }
      commandIds.add(String(command.id));
    }
    for (const [index, section] of (database.help?.sections || []).entries()) {
      if (!section || typeof section !== "object" || !/^[a-z][a-z0-9_-]{1,47}$/.test(String(section.id || ""))
        || !Array.isArray(section.commands) || section.commands.some((id) => !commandIds.has(String(id)))) {
        throw new Error(`database_help_section_invalid:${index}`);
      }
    }
  }

  const authorization = database.authorization ?? {};
  if (authorization.groupAdminCommands != null) {
    const policy = authorization.groupAdminCommands;
    if (!policy || typeof policy !== "object" || Array.isArray(policy)
      || (policy.handlerPrefixes != null && (!Array.isArray(policy.handlerPrefixes) || policy.handlerPrefixes.length > 32
        || policy.handlerPrefixes.some((prefix) => typeof prefix !== "string" || prefix.length > 48)))
      || (policy.requiredRole != null && !["creator", "administrator", "creator_or_administrator"].includes(policy.requiredRole))
      || (policy.botOwnerBypass != null && typeof policy.botOwnerBypass !== "boolean")) {
      throw new Error("database_authorization_group_admin_invalid");
    }
  }
  if (authorization.memberCommands != null) {
    const policy = authorization.memberCommands;
    if (!policy || typeof policy !== "object" || Array.isArray(policy)
      || (policy.handlers != null && (!Array.isArray(policy.handlers) || policy.handlers.length > 100 || policy.handlers.some((item) => typeof item !== "string")))) {
      throw new Error("database_authorization_member_commands_invalid");
    }
  }
  if (authorization.privateOwnerCommands != null) {
    const policy = authorization.privateOwnerCommands;
    if (!policy || typeof policy !== "object" || Array.isArray(policy)
      || (policy.scope != null && policy.scope !== "private")
      || (policy.requiredUserId != null && !/^\d{1,20}$/.test(String(policy.requiredUserId)))) {
      throw new Error("database_authorization_private_owner_invalid");
    }
  }
  for (const [index, command] of (database.commands || []).entries()) {
    const policyRef = command?.access?.policy;
    if (policyRef && !Object.hasOwn(authorization, String(policyRef))) {
      throw new Error(`database_command_policy_reference_missing:${index}:${String(policyRef).slice(0, 48)}`);
    }
  }
  const ownerPanel = database.ownerPanel;
  if (ownerPanel != null) {
    if (!ownerPanel || typeof ownerPanel !== "object" || Array.isArray(ownerPanel)
      || (ownerPanel.enabled != null && typeof ownerPanel.enabled !== "boolean")
      || (ownerPanel.command != null && !/^[a-z][a-z0-9_]{0,31}$/.test(String(ownerPanel.command)))
      || (ownerPanel.slashCommand != null && configuredCommand(ownerPanel.slashCommand) === "")
      || (ownerPanel.ownerId != null && !/^\d{1,20}$/.test(String(ownerPanel.ownerId)))
      || (ownerPanel.quotaPresets != null && (!Array.isArray(ownerPanel.quotaPresets) || ownerPanel.quotaPresets.length > 20
        || ownerPanel.quotaPresets.some((item) => !Number.isInteger(Number(item)) || Number(item) < -1 || Number(item) > 1_000_000_000)))) {
      throw new Error("database_owner_panel_invalid");
    }
    if (ownerPanel.access?.userIds != null && (!Array.isArray(ownerPanel.access.userIds) || ownerPanel.access.userIds.length > 20
      || ownerPanel.access.userIds.some((id) => !/^\d{1,20}$/.test(String(id))))) throw new Error("database_owner_panel_access_invalid");
    if (ownerPanel.buttons != null && (!ownerPanel.buttons || typeof ownerPanel.buttons !== "object" || Array.isArray(ownerPanel.buttons)
      || Object.entries(ownerPanel.buttons).some(([key, value]) => !/^[a-z][a-zA-Z0-9_]{0,31}$/.test(key) || typeof value !== "string" || value.length > 80))) {
      throw new Error("database_owner_panel_buttons_invalid");
    }
    for (const field of ["views", "detailActions", "homeActions"]) {
      if (ownerPanel[field] != null && (!Array.isArray(ownerPanel[field]) || ownerPanel[field].length > 32)) {
        throw new Error(`database_owner_panel_${field}_invalid`);
      }
    }
    const viewIds = new Set();
    for (const [index, view] of (ownerPanel.views || []).entries()) {
      if (!view || typeof view !== "object" || !/^[a-z][a-z0-9_-]{1,31}$/.test(String(view.id || ""))
        || viewIds.has(String(view.id)) || typeof view.sourcePath !== "string"
        || !/^(?:state\.)?[A-Za-z0-9_.]+$/.test(view.sourcePath)) {
        throw new Error(`database_owner_panel_view_invalid:${index}`);
      }
      viewIds.add(String(view.id));
    }
    for (const field of ["detailActions", "homeActions"]) {
      const ids = new Set();
      for (const [index, action] of (ownerPanel[field] || []).entries()) {
        if (!action || typeof action !== "object" || !/^[a-z][a-z0-9_-]{1,31}$/.test(String(action.id || ""))
          || ids.has(String(action.id)) || typeof action.label !== "string" || !action.label.trim()
          || !Array.isArray(action.actions) || action.actions.length < 1 || action.actions.length > 25) {
          throw new Error(`database_owner_panel_action_invalid:${field}:${index}`);
        }
        ids.add(String(action.id));
        for (const [actionIndex, step] of action.actions.entries()) {
          if (!step || typeof step !== "object" || Array.isArray(step)
            || !new Set(["reply", "send_message", "telegram", "toggle_feature", "set_group_setting", "delete_group_setting", "resource_set", "resource_get", "target_policy_set", "owner_panel_show"]).has(String(step.type || ""))) {
            throw new Error(`database_owner_panel_action_step_invalid:${field}:${index}:${actionIndex}`);
          }
        }
      }
    }
  }

  const commandEngine = database.runtime?.commandEngine ?? {};
  if (commandEngine.maxActionsPerCommand != null && (!Number.isInteger(Number(commandEngine.maxActionsPerCommand))
    || Number(commandEngine.maxActionsPerCommand) < 1 || Number(commandEngine.maxActionsPerCommand) > 25)) {
    throw new Error("database_command_engine_limit_invalid");
  }

  const moderationCommands = database.features.moderation?.commands ?? [];
  const supportedModerationActions = new Set(["ban", "kick", "mute", "unmute", "unban", "delete", "pin", "warn"]);
  if (!Array.isArray(moderationCommands) || moderationCommands.length > 100) throw new Error("database_moderation_commands_invalid");
  for (const [index, command] of moderationCommands.entries()) {
    if (!command || typeof command !== "object" || !/^\/[a-z][a-z0-9_]{0,31}$/i.test(String(command.command || ""))
      || !supportedModerationActions.has(String(command.action || ""))
      || (command.enabled != null && typeof command.enabled !== "boolean")) {
      throw new Error(`database_moderation_command_invalid:${index}`);
    }
  }

  const configurableCommands = [
    database.features.reports?.command,
    database.features.groupControls?.command,
    database.features.tagKnownMembers?.commands?.tagAll,
    database.features.tagKnownMembers?.commands?.tagOptIn,
    database.features.tagKnownMembers?.commands?.tagOptOut,
  ];
  if (configurableCommands.some((value) => value != null && !/^\/[a-z][a-z0-9_]{0,31}$/i.test(String(value)))) {
    throw new Error("database_feature_command_invalid");
  }

  const antiSpam = database.features.antiSpam ?? {};
  const boundedNumber = (object, key, min, max) => {
    if (object[key] != null && (!Number.isFinite(Number(object[key])) || Number(object[key]) < min || Number(object[key]) > max)) {
      throw new Error(`database_policy_value_invalid:${key}`);
    }
  };
  for (const [key, min, max] of [
    ["windowSeconds", 3, 120], ["maxMessages", 3, 30], ["duplicateLimit", 2, 10],
    ["duplicateWindowSeconds", 10, 300], ["chatWindowSeconds", 2, 60], ["chatMaxMessages", 5, 250],
    ["linkWindowSeconds", 3, 120], ["maxLinksPerMessage", 1, 20], ["mentionWindowSeconds", 3, 120],
    ["maxMentionsPerMessage", 2, 50], ["commandWindowSeconds", 3, 120], ["maxCommandsPerWindow", 2, 30],
    ["reportCooldownSeconds", 30, 86_400], ["maxTrackedUsers", 100, 2_000],
  ]) boundedNumber(antiSpam, key, min, max);
  if (antiSpam.signals != null && (!antiSpam.signals || typeof antiSpam.signals !== "object" || Array.isArray(antiSpam.signals)
    || Object.values(antiSpam.signals).some((value) => typeof value !== "boolean"))) throw new Error("database_anti_spam_signals_invalid");
  const raidPolicy = antiSpam.raid ?? {};
  for (const [key, min, max] of [["windowSeconds", 10, 600], ["maxJoins", 3, 100], ["escalationJoins", 3, 200], ["maxLeaves", 3, 100], ["escalationLeaves", 3, 200]]) {
    boundedNumber(raidPolicy, key, min, max);
  }
  const tagPolicy = database.features.tagKnownMembers ?? {};
  for (const [key, min, max] of [["cooldownSeconds", 30, 86_400], ["batchSize", 1, 12], ["maxMembers", 1, 200]]) {
    boundedNumber(tagPolicy, key, min, max);
  }
  for (const key of ["excludeBots", "requirePreview", "allowOptOut"]) {
    if (tagPolicy[key] != null && typeof tagPolicy[key] !== "boolean") throw new Error(`database_tag_policy_invalid:${key}`);
  }

  const automationRules = database.features.automations?.rules ?? [];
  if (!Array.isArray(automationRules) || automationRules.length > 500) throw new Error("database_automation_rules_invalid");
  for (const [index, rule] of automationRules.entries()) {
    if (!rule || typeof rule !== "object" || (rule.enabled != null && typeof rule.enabled !== "boolean")
      || !Array.isArray(rule.keywords) || !rule.keywords.length || rule.keywords.length > 40
      || rule.keywords.some((item) => typeof item !== "string" || !item.trim() || item.length > 120)
      || !["reply", "warn", "delete"].includes(String(rule.action || "reply"))) {
      throw new Error(`database_automation_rule_invalid:${index}`);
    }
    if (rule.cooldownSeconds != null && (!Number.isFinite(Number(rule.cooldownSeconds)) || Number(rule.cooldownSeconds) < 0 || Number(rule.cooldownSeconds) > 86_400)) {
      throw new Error(`database_automation_cooldown_invalid:${index}`);
    }
  }

  const rules = database.features.chatbot?.rules ?? [];
  if (!Array.isArray(rules) || rules.length > MAX_RULES) throw new Error("database_chatbot_rules_invalid");
  for (const [index, rule] of rules.entries()) {
    if (!rule || typeof rule !== "object" || Array.isArray(rule)) throw new Error(`database_chatbot_rule_invalid:${index}`);
    if (!Array.isArray(rule.keywords) || !rule.keywords.length || rule.keywords.length > 40
      || rule.keywords.some((item) => typeof item !== "string" || !item.trim() || item.length > 120)) {
      throw new Error(`database_chatbot_keywords_invalid:${index}`);
    }
    if (rule.negativeKeywords != null && (!Array.isArray(rule.negativeKeywords) || rule.negativeKeywords.length > 40
      || rule.negativeKeywords.some((item) => typeof item !== "string" || item.length > 120))) {
      throw new Error(`database_chatbot_negative_keywords_invalid:${index}`);
    }
    if (rule.responses != null && (!Array.isArray(rule.responses) || rule.responses.length > 30
      || rule.responses.some((item) => typeof item !== "string" || item.length > MAX_TEXT_LENGTH))) {
      throw new Error(`database_chatbot_responses_invalid:${index}`);
    }
    if (rule.match != null && !["any", "all", "exact"].includes(rule.match)) throw new Error(`database_chatbot_match_invalid:${index}`);
    if (rule.threshold != null && (!Number.isFinite(Number(rule.threshold)) || Number(rule.threshold) < 1 || Number(rule.threshold) > 40)) {
      throw new Error(`database_chatbot_threshold_invalid:${index}`);
    }
    if (rule.priority != null && (!Number.isFinite(Number(rule.priority)) || Number(rule.priority) < 0 || Number(rule.priority) > 100)) {
      throw new Error(`database_chatbot_priority_invalid:${index}`);
    }
  }

  // Uploaded database modules are parsed as safe data literals; uploaded code is never executed.
  // Bound nesting, total nodes, keys, and strings so pathological files cannot exhaust the Worker.
  const stack = [{ value: database, path: "database", depth: 0 }];
  let nodes = 0;
  while (stack.length) {
    const { value, path, depth } = stack.pop();
    nodes += 1;
    if (nodes > MAX_DATABASE_NODES) throw new Error("database_structure_too_large");
    if (depth > MAX_DATABASE_DEPTH) throw new Error("database_nesting_too_deep");
    if (typeof value === "string") {
      if (value.length > MAX_TEXT_LENGTH) throw new Error(`database_text_too_long:${path}`);
      continue;
    }
    if (Array.isArray(value)) {
      if (value.length > MAX_LIST_ITEMS) throw new Error(`database_list_too_large:${path}`);
      for (let index = value.length - 1; index >= 0; index -= 1) {
        stack.push({ value: value[index], path: `${path}.${index}`, depth: depth + 1 });
      }
      continue;
    }
    if (value && typeof value === "object") {
      const entries = Object.entries(value);
      if (entries.length > MAX_LIST_ITEMS) throw new Error(`database_object_too_large:${path}`);
      for (let index = entries.length - 1; index >= 0; index -= 1) {
        const [key, child] = entries[index];
        if (key.length > 160) throw new Error(`database_key_too_long:${path}`);
        if (["__proto__", "prototype", "constructor"].includes(key)) throw new Error(`database_dangerous_key:${path}.${key}`);
        stack.push({ value: child, path: `${path}.${key}`, depth: depth + 1 });
      }
    }
  }
  return true;
}

function matchPhrase(text, terms = []) {
  const normalized = normalizeText(text);
  if (!normalized || !Array.isArray(terms)) return false;
  return terms.some((term) => {
    const candidate = normalizeText(term);
    if (!candidate) return false;
    return normalized === candidate || ` ${normalized} `.includes(` ${candidate} `);
  });
}

function scoreNlpRule(text, rule) {
  const normalized = normalizeText(text);
  if (!normalized || !rule || !Array.isArray(rule.keywords)) return 0;
  const keywords = rule.keywords.map(normalizeText).filter(Boolean);
  if (!keywords.length) return 0;
  const padded = ` ${normalized} `;
  const negative = (rule.negativeKeywords || []).map(normalizeText).filter(Boolean);
  if (negative.some((term) => padded.includes(` ${term} `))) return 0;

  const hits = [];
  for (const keyword of keywords) {
    if (normalized === keyword) hits.push({ keyword, weight: 4 });
    else if (padded.includes(` ${keyword} `)) hits.push({ keyword, weight: keyword.includes(" ") ? 3 : 2 });
    else if (keyword.length >= 4 && normalized.includes(keyword)) hits.push({ keyword, weight: 1 });
  }

  const mode = rule.match || "any";
  if (mode === "exact" && !hits.some((hit) => normalized === hit.keyword)) return 0;
  if (mode === "all" && hits.length !== keywords.length) return 0;
  const threshold = Math.max(1, Number(rule.threshold) || (mode === "all" ? keywords.length : 1));
  if (hits.length < threshold) return 0;

  const rawScore = hits.reduce((sum, hit) => sum + hit.weight, 0);
  const priority = Math.max(0, Math.min(100, Number(rule.priority) || 0));
  return rawScore + priority * 0.05;
}

function selectNlpRule(text, rules = []) {
  let selected = null;
  let selectedScore = 0;
  for (const rule of rules) {
    const score = scoreNlpRule(text, rule);
    if (score > selectedScore) {
      selected = rule;
      selectedScore = score;
    }
  }
  return selected ? { rule: selected, score: selectedScore } : null;
}

function matchNlpRule(text, rule) {
  return scoreNlpRule(text, rule) > 0;
}

function renderTemplate(template, values = {}) {
  return String(template ?? "").replace(/\{([a-zA-Z0-9_]+)\}/g, (_, key) => {
    const value = values[key];
    return value == null ? "" : String(value);
  });
}

function utcDay(timestampMs = Date.now()) {
  return new Date(timestampMs).toISOString().slice(0, 10);
}

function nextUtcMidnightMs(timestampMs = Date.now()) {
  return (Math.floor(timestampMs / DAY_MS) + 1) * DAY_MS;
}

function parseIntervalInput(value) {
  const normalized = asText(value).replace(/[,_\s]/g, "");
  if (!/^\d+$/.test(normalized)) return null;
  const number = Number(normalized);
  return Number.isSafeInteger(number) ? number : null;
}

function isTelegramId(value) {
  return /^-?\d{1,20}$/.test(asText(value));
}

function isValidHttpsUrl(value) {
  try {
    const url = new URL(asText(value));
    if (url.protocol !== "https:" || url.username || url.password) return false;
    const host = url.hostname.toLowerCase().replace(/^\[|\]$/g, "");
    if (["localhost", "::1"].includes(host) || /\.(local|internal|test|invalid)$/.test(host)) return false;
    const ipv4 = host.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
    if (ipv4) {
      const [a, b] = ipv4.slice(1).map(Number);
      if (ipv4.slice(1).some((part) => Number(part) > 255)) return false;
      if (a === 0 || a === 10 || a === 127 || a >= 224 || (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168) || (a === 100 && b >= 64 && b <= 127)) return false;
    }
    if (host.startsWith("fc") || host.startsWith("fd") || host.startsWith("fe80:") || host === "::") return false;
    return true;
  } catch {
    return false;
  }
}

function randomItem(items, fallback = "") {
  if (!Array.isArray(items) || !items.length) return fallback;
  return items[Math.floor(Math.random() * items.length)] ?? fallback;
}

function clampNumber(value, fallback, min, max) {
  const number = Number(value);
  if (!Number.isFinite(number)) return fallback;
  return Math.min(max, Math.max(min, Math.floor(number)));
}

function makeKeyboardButton(text, callbackData, style = "primary") {
  const button = { text: String(text).slice(0, 64), callback_data: String(callbackData).slice(0, 64) };
  if (["primary", "success", "danger"].includes(style)) button.style = style;
  return button;
}

// Executable feature handlers are part of the Worker runtime. Feature flags,
// command names, texts, rules, and policies are read from the uploaded database.
const FEATURE_MODULES = Object.freeze([
  { id: "chatbot", path: "features.chatbot.enabled" },
  { id: "jokes", path: "features.jokes.enabled" },
  { id: "chatter", path: "features.chatter.enabled" },
  { id: "customCommands", path: "features.customCommands.enabled" },
  { id: "automations", path: "features.automations.enabled" },
  { id: "memory", path: "features.memory.enabled" },
  { id: "botReplyJokes", path: "features.botReplyJokes.enabled" },
  { id: "welcome", path: "features.welcome.enabled" },
  { id: "goodbye", path: "features.goodbye.enabled" },
  { id: "captcha", path: "features.captcha.enabled" },
  { id: "joinRequests", path: "features.joinRequests.enabled" },
  { id: "reports", path: "features.reports.enabled" },
  { id: "antiSpam", path: "features.antiSpam.enabled" },
  { id: "moderation", path: "features.moderation.enabled" },
  { id: "linkGuard", path: "features.linkGuard.enabled" },
  { id: "phishingGuard", path: "features.phishingGuard.enabled" },
  { id: "raidProtection", path: "features.raidProtection.enabled" },
  { id: "forwarding", path: "features.forwarding.enabled" },
  { id: "groupControls", path: "features.groupControls.enabled" },
  { id: "tagKnownMembers", path: "features.tagKnownMembers.enabled" },
]);

function getFeatureModule(id) {
  return FEATURE_MODULES.find((item) => item.id === String(id)) || null;
}

function isModuleEnabled(database, id) {
  const descriptor = getFeatureModule(id);
  if (!descriptor) return false;
  let current = database;
  for (const part of descriptor.path.split(".")) current = current?.[part];
  return current === true;
}

function collectDatabaseTelegramCommands(database) {
  if (!database || typeof database !== "object") return [];
  const commands = new Map();
  const add = (raw, fallbackDescription = "Database command", enabled = true) => {
    if (enabled === false || raw == null || commands.size >= 100) return;
    const record = typeof raw === "string" ? { command: raw } : raw;
    if (!record || typeof record !== "object") return;
    const normalized = configuredCommand(record.command || record.name || "");
    if (!normalized || normalized === "/settings") return;
    const command = normalized.slice(1);
    const description = String(record.description || record.help || fallbackDescription || "Database command")
      .replace(/[\u0000-\u001f\u007f]/g, " ").replace(/\s+/g, " ").trim().slice(0, 256);
    if (description.length < 3) return;
    if (!commands.has(command)) commands.set(command, { command, description });
  };

  const features = database.features || {};
  // commandMenu entries are executable response commands, not arbitrary menu labels.
  if (features.customCommands?.enabled !== false) {
    for (const item of database.commandMenu || []) add(item, "Database command", item?.enabled !== false);
    for (const item of features.customCommands?.rules || []) {
      add(item, "Custom database command", item?.enabled !== false);
    }
  }
  const moderationDescriptions = {
    ban: "Ban a replied group member",
    kick: "Remove a replied group member",
    mute: "Mute a replied group member",
    unmute: "Unmute a replied group member",
    unban: "Unban a replied group member",
    delete: "Delete a replied message",
    pin: "Pin a replied message",
    warn: "Warn a replied group member",
  };
  for (const item of features.moderation?.commands || []) {
    add(item, moderationDescriptions[String(item?.action || "").toLowerCase()] || "Moderation command",
      features.moderation?.enabled !== false && item?.enabled !== false);
  }
  if (features.reports?.command) add({ command: features.reports.command, description: features.reports.description || "Report a message to group administrators" }, "Report a message to group administrators", features.reports.enabled !== false);
  if (features.groupControls?.command) add({ command: features.groupControls.command, description: features.groupControls.description || "Control bot replies in this group" }, "Control bot replies in this group", features.groupControls.enabled !== false);
  const tagCommands = features.tagKnownMembers?.commands || {};
  add({ command: tagCommands.tagAll, description: tagCommands.tagAllDescription || "Preview a tag for known group members" }, "Preview a tag for known group members", features.tagKnownMembers?.enabled !== false);
  add({ command: tagCommands.tagOptIn, description: tagCommands.tagOptInDescription || "Allow administrators to include you in tags" }, "Allow tag participation", features.tagKnownMembers?.enabled !== false);
  add({ command: tagCommands.tagOptOut, description: tagCommands.tagOptOutDescription || "Opt out of group tags" }, "Allow tag participation", features.tagKnownMembers?.enabled !== false);
  for (const definition of database.commands || []) {
    if (!databaseCommandEnabled(definition, database)) continue;
    for (const command of definition.slashCommands || []) {
      add({ command: `/${command}`, description: definition.description || definition.title || definition.id }, definition.description || "Database command", true);
    }
  }

  return [...commands.values()].slice(0, 100);
}

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  })[character]);
}

function parseCommand(text = "") {
  const parts = String(text).trim().split(/\s+/).filter(Boolean);
  if (!parts.length || !parts[0].startsWith("/")) return null;
  const [command, ...args] = parts;
  return { command: command.split("@")[0].toLowerCase(), args };
}

function configuredCommand(value) {
  const command = String(value ?? "").trim().toLowerCase();
  return /^\/[a-z][a-z0-9_]{0,31}$/.test(command) ? command : "";
}

function databaseCommandEnabled(definition, database) {
  if (!definition || definition.enabled === false) return false;
  const handler = String(definition.handler || "");
  if (handler.startsWith("moderation.")) return database?.features?.moderation?.enabled === true;
  if (handler.startsWith("welcome.")) return database?.features?.welcome?.enabled === true;
  if (handler.startsWith("goodbye.")) return database?.features?.goodbye?.enabled === true;
  const requiredFeature = String(definition.requiresFeature || "");
  if (requiredFeature) return getPath(database, `features.${requiredFeature}.enabled`, false) === true;
  return Boolean(handler || Array.isArray(definition.actions));
}

function matchDatabaseCommand(text, database) {
  const fullText = asText(text);
  if (!fullText || !Array.isArray(database?.commands)) return null;
  const firstLine = fullText.split(/\r?\n/, 1)[0].trim();
  if (!firstLine) return null;
  const slash = parseCommand(firstLine);
  if (slash) {
    const commandName = slash.command.replace(/^\//, "").toLowerCase();
    const definition = database.commands.find((item) => databaseCommandEnabled(item, database)
      && (item.slashCommands || []).some((name) => String(name).toLowerCase() === commandName));
    if (!definition) return null;
    const commandToken = firstLine.split(/\s+/, 1)[0];
    const sameLineArguments = firstLine.slice(commandToken.length).trim();
    const newlineAt = fullText.indexOf("\n");
    const followingLines = newlineAt >= 0 ? fullText.slice(newlineAt + 1) : "";
    return {
      definition,
      argumentText: [sameLineArguments, followingLines].filter(Boolean).join("\n"),
      matchedAlias: `/${commandName}`,
    };
  }
  const candidates = [];
  for (const definition of database.commands) {
    if (!databaseCommandEnabled(definition, database)) continue;
    for (const alias of definition.aliases || []) candidates.push({ definition, alias: String(alias) });
  }
  candidates.sort((a, b) => normalizeText(b.alias).length - normalizeText(a.alias).length);
  const normalizedRaw = normalizeText(fullText);
  for (const candidate of candidates) {
    const normalizedAlias = normalizeText(candidate.alias);
    if (!normalizedAlias || !(normalizedRaw === normalizedAlias || normalizedRaw.startsWith(`${normalizedAlias} `))) continue;
    let originalPrefixEnd = -1;
    for (let end = 1; end <= fullText.length; end += 1) {
      if (normalizeText(fullText.slice(0, end)) !== normalizedAlias) continue;
      if (end === fullText.length || normalizeText(fullText.slice(0, end + 1)) === normalizedAlias) {
        originalPrefixEnd = end;
        break;
      }
    }
    return {
      definition: candidate.definition,
      argumentText: fullText.slice(originalPrefixEnd < 0 ? candidate.alias.length : originalPrefixEnd).trim(),
      matchedAlias: candidate.alias,
    };
  }
  return null;
}

function getWelcomeMediaFromMessage(message) {
  if (!message || typeof message !== "object") return null;
  if (Array.isArray(message.photo) && message.photo.length) return { type: "photo", fileId: message.photo.at(-1).file_id };
  for (const [type, field] of [["video", "video"], ["audio", "audio"], ["voice", "voice"], ["animation", "animation"], ["sticker", "sticker"], ["video_note", "video_note"]]) {
    if (message[field]?.file_id) return { type, fileId: message[field].file_id };
  }
  return null;
}

function sleep(ms) { return new Promise((resolve) => setTimeout(resolve, ms)); }


function getTelegramUpdateActor(update) {
  return update?.message?.from?.id
    ?? update?.edited_message?.from?.id
    ?? update?.callback_query?.from?.id
    ?? update?.chat_join_request?.from?.id
    ?? update?.my_chat_member?.from?.id
    ?? update?.chat_member?.from?.id
    ?? update?.edited_channel_post?.from?.id
    ?? update?.channel_post?.from?.id
    ?? "";
}

function reserveSplitQuota(currentQuota, ownerRequest, now = Date.now()) {
  const day = utcDay(now);
  const quota = currentQuota && currentQuota.day === day
    ? {
        day,
        publicRequests: Math.max(0, Math.floor(Number(currentQuota.publicRequests) || 0)),
        ownerRequests: Math.max(0, Math.floor(Number(currentQuota.ownerRequests) || 0)),
        totalRequests: Math.max(0, Math.floor(Number(currentQuota.totalRequests) || 0)),
      }
    : { day, publicRequests: 0, ownerRequests: 0, totalRequests: 0 };
  if (ownerRequest) {
    if (quota.ownerRequests >= 1_000) return { allowed: false, owner: true, reason: "OWNER_RESERVE_EXHAUSTED", quota };
    quota.ownerRequests += 1;
  } else {
    if (quota.publicRequests >= 99_000) return { allowed: false, owner: false, reason: "PUBLIC_RESERVE_REACHED", quota };
    quota.publicRequests += 1;
  }
  quota.totalRequests += 1;
  return {
    allowed: true,
    owner: Boolean(ownerRequest),
    quota,
    publicRemaining: Math.max(0, 99_000 - quota.publicRequests),
    ownerRemaining: Math.max(0, 1_000 - quota.ownerRequests),
    total: quota.totalRequests,
    resetAt: nextUtcMidnightMs(now),
  };
}

// Forward Scheduler runtime implementation. The Worker entrypoint only validates
// incoming requests and delegates durable work to this runtime.
const BOT_API = "https://api.telegram.org/bot";
const BOT_FILE_API = "https://api.telegram.org/file/bot";
const TELEGRAM_TIMEOUT_MS = 12_000;
const TELEGRAM_UPDATE_TYPES = Object.freeze([
  "message", "edited_message", "channel_post", "edited_channel_post",
  "business_connection", "business_message", "edited_business_message", "deleted_business_messages",
  "guest_message", "message_reaction", "message_reaction_count",
  "inline_query", "chosen_inline_result", "callback_query",
  "widget_query", "shared_widget_query", "shipping_query", "pre_checkout_query",
  "purchased_paid_media", "poll", "poll_answer", "my_chat_member", "chat_member",
  "chat_join_request", "chat_boost", "removed_chat_boost", "managed_bot",
  "subscription", "stopped_message_generation",
]);
const DATABASE_DOWNLOAD_TIMEOUT_MS = 10_000;
const OUTBOUND_METHODS = new Set([
  "sendMessage", "sendRichMessage", "sendWidget", "sendSharedWidget",
  "sendMessageDraft", "sendRichMessageDraft", "sendPhoto", "sendLivePhoto",
  "sendVideo", "sendVideoNote", "sendAudio", "sendVoice", "sendAnimation",
  "sendSticker", "sendDocument", "sendLocation", "sendVenue", "sendContact",
  "sendDice", "sendPoll", "sendMediaGroup", "forwardMessage", "forwardMessages",
  "copyMessage", "copyMessages", "editMessageText", "editMessageCaption",
  "editMessageMedia", "editMessageReplyMarkup", "deleteMessage", "deleteMessages",
  "pinChatMessage", "unpinChatMessage", "banChatMember", "unbanChatMember",
  "restrictChatMember", "promoteChatMember", "setChatPermissions", "approveChatJoinRequest",
  "declineChatJoinRequest", "setChatTitle", "setChatDescription", "setChatPhoto",
  "deleteChatPhoto", "leaveChat",
]);
// Keep rate limiting future-compatible: newly added Telegram send/mutation methods
// pass through the same gateway without requiring an allow-list edit.
function isTelegramOutboundMethod(method) {
  return OUTBOUND_METHODS.has(method)
    || /^(?:send|forward|copy|editMessage|deleteMessage|pinChat|unpinChat|banChat|unbanChat|restrictChat|promoteChat|setChat|deleteChat|leaveChat|approveChat|declineChat|createForumTopic|editForumTopic|closeForumTopic|reopenForumTopic|deleteForumTopic|unpinAllForumTopicMessages)/.test(String(method || ""));
}
function botTokenFrom(env) { return String(env?.BOT_TOKEN || EMBEDDED_BOT_TOKEN).trim(); }
function ownerIdFrom(env) {
  const value = String(env?.OWNER_TELEGRAM_ID || EMBEDDED_OWNER_TELEGRAM_ID).trim();
  return /^\d{1,20}$/.test(value) && Number(value) > 0 ? value : "";
}
function webhookUrlFrom(env) {
  return String(env?.WEBHOOK_URL || EMBEDDED_WEBHOOK_URL).trim().replace(/\/$/, "");
}
function webhookSecretFrom(env) { return String(env?.WEBHOOK_SECRET || EMBEDDED_WEBHOOK_SECRET).trim(); }
function redactBotToken(value, env) {
  const message = String(value?.message || value || "");
  const token = botTokenFrom(env);
  return token ? message.replaceAll(token, "[redacted]") : message;
}

async function requestTelegramApi(env, method, payload = {}, options = {}) {
  const token = botTokenFrom(env);
  if (!/^\d{6,12}:[A-Za-z0-9_-]{25,}$/.test(token)) {
    return { ok: false, error_code: 401, description: "BOT_TOKEN_MISSING_OR_INVALID" };
  }
  if (!/^[A-Za-z][A-Za-z0-9]{0,63}$/.test(String(method || ""))) {
    return { ok: false, error_code: 400, description: "TELEGRAM_METHOD_INVALID" };
  }

  const timeoutMs = clampNumber(options.timeoutMs, TELEGRAM_TIMEOUT_MS, 1_000, 60_000);
  const isFormData = typeof FormData !== "undefined" && payload instanceof FormData;
  const request = async (body) => {
    const response = await fetch(`${BOT_API}${token}/${method}`, {
      method: "POST",
      headers: isFormData ? {} : { "content-type": "application/json" },
      body: isFormData ? body : JSON.stringify(body),
      signal: AbortSignal.timeout(timeoutMs),
    });
    const data = await response.json().catch(() => null);
    if (!data || typeof data !== "object") {
      return { ok: false, error_code: response.status || 502, description: "INVALID_TELEGRAM_RESPONSE" };
    }
    return data;
  };

  try {
    let data = null;
    for (let attempt = 0; attempt <= 1; attempt += 1) {
      data = await request(payload);
      const retryAfter = Number(data?.parameters?.retry_after || 0);
      if ((data?.error_code === 429) && attempt === 0 && options.retry429 !== false && retryAfter <= 8) {
        const delay = Math.max(retryAfter * 1_000, 500 * (2 ** attempt)) + Math.floor(Math.random() * 250);
        await new Promise((resolve) => setTimeout(resolve, delay));
        continue;
      }
      break;
    }

    const parseFailure = !data?.ok && !isFormData && payload?.parse_mode
      && /can't parse entities|can't find end of the entity|unsupported start tag|unsupported end tag|entity.*not found/i.test(String(data?.description || ""));
    if (parseFailure) {
      const plainPayload = { ...payload };
      delete plainPayload.parse_mode;
      data = await request(plainPayload);
    }
    return data || { ok: false, error_code: 502, description: "INVALID_TELEGRAM_RESPONSE" };
  } catch (error) {
    const safeError = asText(error?.message || error)
      .replaceAll(token, "[redacted]")
      .replace(/https?:\/\/api\.telegram\.org\//gi, "[telegram-api]")
      .slice(0, 120);
    return { ok: false, description: `NETWORK_ERROR:${safeError}` };
  }
}

function button(text, callbackData, style = "primary") { return makeKeyboardButton(text, callbackData, style); }
function toggleButton(label, enabled, callbackData) {
  return button(`${label}: ${enabled ? "ON" : "OFF"}`, callbackData, enabled ? "success" : "danger");
}

function isGroup(chat) {
  return chat?.type === "group" || chat?.type === "supergroup";
}

function isPrivate(chat) {
  return chat?.type === "private";
}

function userDisplay(user = {}) {
  return user.first_name || user.username || String(user.id || "User");
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
    security: { ownerId: null, ownerClaimedAt: null, ownerUsername: null, ownerDisplayName: null, credentialSource: "configured-owner" },
    settings: { cacheEnabled: true, autoUpdate: true, botEnabled: true },
    flow: null,
    forwardDraft: null,
    forwardTask: null,
    groupSettings: {},
    spam: {},
    warnings: {},
    rate: {},
    updateIds: [],
    quota: { day: utcDay(), publicRequests: 0, ownerRequests: 0, totalRequests: 0 },
    groupModuleOverrides: {},
    welcomeDedup: {},
    welcomeDelivered: {},
    welcomeQueue: [],
    memberStates: {},
    groupModerationLists: {},
    groups: {},
    groupUsage: {},
    targetPolicies: {},
    targetUsage: {},
    blockedGroups: [],
    leftGroups: [],
    channels: [],
    admins: { global: [], byChat: {} },
    pendingVerifications: {},
    joinWindows: {},
    leaveWindows: {},
    reportQueue: [],
    broadcastDraft: null,
    broadcastQueue: null,
    migrationVersion: 5,
    migrationStatus: { version: 5, status: "pending" },
    pvUsers: {},
    knownMembers: {},
    tagOptOut: {},
    tagDrafts: {},
    tagCooldowns: {},
    botJoinState: {},
    securityAudit: [],
    securityAlerts: {},
    chatActivity: {},
    queueCursor: "",
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
  const { moduleOverrides: _legacyModuleOverrides, ...cleanValue } = value;
  return {
    ...base,
    ...cleanValue,
    db: null,
    forwardTask,
    groupSettings: value.groupSettings && typeof value.groupSettings === "object" && !Array.isArray(value.groupSettings) ? value.groupSettings : {},
    spam: value.spam && typeof value.spam === "object" && !Array.isArray(value.spam) ? value.spam : {},
    warnings: value.warnings && typeof value.warnings === "object" && !Array.isArray(value.warnings) ? value.warnings : {},
    rate: value.rate && typeof value.rate === "object" && !Array.isArray(value.rate) ? value.rate : {},
    quota: {
      ...base.quota,
      ...(value.quota && typeof value.quota === "object" && !Array.isArray(value.quota) ? value.quota : {}),
      day: /^\d{4}-\d{2}-\d{2}$/.test(String(value.quota?.day || "")) ? value.quota.day : utcDay(),
      publicRequests: Math.max(0, Math.floor(Number(value.quota?.publicRequests) || 0)),
      ownerRequests: Math.max(0, Math.floor(Number(value.quota?.ownerRequests) || 0)),
      totalRequests: Math.max(0, Math.floor(Number(value.quota?.totalRequests) || 0)),
    },
    groups: value.groups && typeof value.groups === "object" && !Array.isArray(value.groups) ? value.groups : {},
    groupUsage: value.groupUsage && typeof value.groupUsage === "object" && !Array.isArray(value.groupUsage) ? value.groupUsage : {},
    targetPolicies: value.targetPolicies && typeof value.targetPolicies === "object" && !Array.isArray(value.targetPolicies)
      ? Object.fromEntries(Object.entries(value.targetPolicies).filter(([id, item]) => isTelegramId(id) && item && typeof item === "object" && !Array.isArray(item)).slice(-1_000)) : {},
    targetUsage: value.targetUsage && typeof value.targetUsage === "object" && !Array.isArray(value.targetUsage)
      ? Object.fromEntries(Object.entries(value.targetUsage).filter(([id, item]) => isTelegramId(id) && item && typeof item === "object" && !Array.isArray(item)
        && /^\d{4}-\d{2}$/.test(String(item.month || "")) && Number.isFinite(Number(item.used)) && Number(item.used) >= 0).slice(-1_000)) : {},
    groupModuleOverrides: value.groupModuleOverrides && typeof value.groupModuleOverrides === "object" && !Array.isArray(value.groupModuleOverrides)
      ? Object.fromEntries(Object.entries(value.groupModuleOverrides).slice(-500).map(([chatId, flags]) => [chatId, flags && typeof flags === "object" && !Array.isArray(flags)
        ? Object.fromEntries(Object.entries(flags).filter(([id, enabled]) => getFeatureModule(id) && typeof enabled === "boolean")) : {}])) : {},
    welcomeDedup: value.welcomeDedup && typeof value.welcomeDedup === "object" && !Array.isArray(value.welcomeDedup) ? value.welcomeDedup : {},
    welcomeDelivered: value.welcomeDelivered && typeof value.welcomeDelivered === "object" && !Array.isArray(value.welcomeDelivered) ? Object.fromEntries(Object.entries(value.welcomeDelivered).slice(-5_000)) : {},
    welcomeQueue: Array.isArray(value.welcomeQueue) ? value.welcomeQueue.filter((item) => item && /^-?\d{1,20}$/.test(String(item.chatId || "")) && item.member?.id).slice(-2_000) : [],
    memberStates: value.memberStates && typeof value.memberStates === "object" && !Array.isArray(value.memberStates)
      ? Object.fromEntries(Object.entries(value.memberStates).filter(([key, item]) => /^-?\d{1,20}:\d{1,20}$/.test(key) && item && ["member", "left"].includes(item.status)).slice(-20_000))
      : {},
    groupModerationLists: value.groupModerationLists && typeof value.groupModerationLists === "object" && !Array.isArray(value.groupModerationLists)
      ? Object.fromEntries(Object.entries(value.groupModerationLists).slice(-1_000).map(([chatId, lists]) => [chatId, {
        silent: lists?.silent && typeof lists.silent === "object" && !Array.isArray(lists.silent) ? Object.fromEntries(Object.entries(lists.silent).slice(-1_000)) : {},
        banned: lists?.banned && typeof lists.banned === "object" && !Array.isArray(lists.banned) ? Object.fromEntries(Object.entries(lists.banned).slice(-1_000)) : {},
      }])) : {},
    blockedGroups: Array.isArray(value.blockedGroups) ? [...new Set(value.blockedGroups.map(String).filter((id) => /^-?\d{1,20}$/.test(id)))].slice(-2_000) : [],
    leftGroups: Array.isArray(value.leftGroups) ? [...new Set(value.leftGroups.map(String).filter((id) => /^-?\d{1,20}$/.test(id)))].slice(-2_000) : [],
    channels: Array.isArray(value.channels) ? value.channels.slice(0, 300) : [],
    admins: {
      global: Array.isArray(value.admins?.global) ? [...new Set(value.admins.global.map(String).filter((id) => /^\d{1,20}$/.test(id)))].slice(0, 500) : [],
      byChat: value.admins?.byChat && typeof value.admins.byChat === "object" && !Array.isArray(value.admins.byChat) ? value.admins.byChat : {},
    },
    pendingVerifications: value.pendingVerifications && typeof value.pendingVerifications === "object" && !Array.isArray(value.pendingVerifications) ? value.pendingVerifications : {},
    joinWindows: value.joinWindows && typeof value.joinWindows === "object" && !Array.isArray(value.joinWindows) ? value.joinWindows : {},
    leaveWindows: value.leaveWindows && typeof value.leaveWindows === "object" && !Array.isArray(value.leaveWindows) ? value.leaveWindows : {},
    reportQueue: Array.isArray(value.reportQueue) ? value.reportQueue.slice(-100) : [],
    broadcastDraft: value.broadcastDraft && typeof value.broadcastDraft === "object" ? value.broadcastDraft : null,
    broadcastQueue: value.broadcastQueue && typeof value.broadcastQueue === "object" ? value.broadcastQueue : null,
    updateIds: Array.isArray(value.updateIds) ? value.updateIds.filter((id) => Number.isSafeInteger(id) && id >= 0).slice(-4_096) : [],
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
    settings: {
      ...base.settings,
      ...(value.settings && typeof value.settings === "object" && !Array.isArray(value.settings) ? value.settings : {}),
      cacheEnabled: value.settings?.cacheEnabled !== false,
      autoUpdate: value.settings?.autoUpdate !== false,
      botEnabled: value.settings?.botEnabled !== false,
    },
    flow: value.flow === "database_url" ? "database_upload" : (typeof value.flow === "string" ? value.flow.slice(0, 40) : null),
    dbFileName: typeof value.dbFileName === "string" ? value.dbFileName.slice(0, 128) : null,
    dbHash: typeof value.dbHash === "string" && /^[a-f0-9]{64}$/i.test(value.dbHash) ? value.dbHash : null,
    migrationVersion: Math.max(0, Math.floor(Number(value.migrationVersion) || 0)),
    migrationStatus: value.migrationStatus && typeof value.migrationStatus === "object" ? value.migrationStatus : base.migrationStatus,
    pvUsers: value.pvUsers && typeof value.pvUsers === "object" && !Array.isArray(value.pvUsers) ? Object.fromEntries(Object.entries(value.pvUsers).slice(-2_000)) : {},
    knownMembers: value.knownMembers && typeof value.knownMembers === "object" && !Array.isArray(value.knownMembers) ? Object.fromEntries(Object.entries(value.knownMembers).slice(-500).map(([chatId, members]) => [chatId, Array.isArray(members) ? members.slice(-300) : []])) : {},
    tagOptOut: value.tagOptOut && typeof value.tagOptOut === "object" && !Array.isArray(value.tagOptOut) ? value.tagOptOut : {},
    tagDrafts: value.tagDrafts && typeof value.tagDrafts === "object" && !Array.isArray(value.tagDrafts) ? Object.fromEntries(Object.entries(value.tagDrafts).slice(-100)) : {},
    tagCooldowns: value.tagCooldowns && typeof value.tagCooldowns === "object" && !Array.isArray(value.tagCooldowns) ? Object.fromEntries(Object.entries(value.tagCooldowns).slice(-500)) : {},
    botJoinState: value.botJoinState && typeof value.botJoinState === "object" && !Array.isArray(value.botJoinState) ? Object.fromEntries(Object.entries(value.botJoinState).slice(-500)) : {},
    securityAudit: Array.isArray(value.securityAudit) ? value.securityAudit.slice(-500) : [],
    securityAlerts: value.securityAlerts && typeof value.securityAlerts === "object" && !Array.isArray(value.securityAlerts) ? value.securityAlerts : {},
    chatActivity: value.chatActivity && typeof value.chatActivity === "object" && !Array.isArray(value.chatActivity) ? value.chatActivity : {},
    queueCursor: typeof value.queueCursor === "string" ? value.queueCursor.slice(0, 80) : "",
  };
}

function getPath(object, path, fallback = "") {
  let current = object;
  for (const part of path.split(".")) current = current?.[part];
  return current == null ? fallback : current;
}

class ForwardSchedulerRuntime {
  constructor(ctx, env) {
    this.ctx = ctx;
    this.env = env;
    this.serial = Promise.resolve();
    this.outboundAt = new Map();
    this.answerCache = new Map();
    this.adminCache = new Map();
    this.telegramCache = new Map();
    this.databaseCacheHash = "";
    this.databaseCache = null;
  }

  #persistableState(state) {
    const { db, ...snapshot } = state;
    return structuredClone(snapshot);
  }

  async #storeDatabaseChunks(source, hash, filename = "database.json") {
    const prefix = `database:v1:${hash}:chunk:`;
    const writes = [];
    for (let offset = 0, index = 0; offset < source.length; index += 1) {
      let end = Math.min(source.length, offset + DATABASE_CHUNK_CHARS);
      if (end < source.length) {
        const lastCodeUnit = source.charCodeAt(end - 1);
        if (lastCodeUnit >= 0xD800 && lastCodeUnit <= 0xDBFF) end -= 1;
      }
      writes.push(this.ctx.storage.put(`${prefix}${String(index).padStart(4, "0")}`, source.slice(offset, end)));
      offset = end;
    }
    await Promise.all(writes);
    const chunks = writes.length;
    return {
      hash,
      chunks,
      filename,
      bytes: new TextEncoder().encode(source).byteLength,
      installedAt: Date.now(),
    };
  }

  async #removeDatabaseChunks(hash) {
    if (!hash) return 0;
    const prefix = `database:v1:${hash}:chunk:`;
    let removed = 0;
    while (true) {
      const rows = await this.ctx.storage.list({ prefix, limit: 100 });
      if (!rows.size) break;
      removed += await this.ctx.storage.delete([...rows.keys()]);
      if (rows.size < 100) break;
    }
    return removed;
  }

  async #hydrateDatabase(state) {
    // Legacy inline database state is intentionally ignored. A database is active
    // only when a separately uploaded file has a committed storage manifest.
    const manifest = await this.ctx.storage.get("database:v1:manifest");
    if (!manifest) {
      state.db = null;
      state.dbHash = null;
      state.dbFileName = null;
      state.dbInstalledAt = null;
      state.dbManifest = null;
      this.databaseCacheHash = "";
      this.databaseCache = null;
      return;
    }
    if (!manifest.hash || !Number.isInteger(manifest.chunks) || manifest.chunks < 1 || manifest.chunks > 64) {
      throw new Error("DATABASE_STORAGE_MANIFEST_INVALID");
    }
    if (this.databaseCacheHash === manifest.hash && this.databaseCache) {
      state.db = this.databaseCache;
      state.dbHash = manifest.hash;
      state.dbFileName = "database.json";
      state.dbInstalledAt = Number(manifest.installedAt || state.dbInstalledAt || 0) || null;
      return;
    }
    const prefix = `database:v1:${manifest.hash}:chunk:`;
    const parts = await Promise.all(Array.from({ length: manifest.chunks }, (_, index) =>
      this.ctx.storage.get(`${prefix}${String(index).padStart(4, "0")}`)));
    if (parts.some((chunk) => typeof chunk !== "string")) throw new Error("DATABASE_STORAGE_CHUNK_MISSING");
    const source = parts.join("");
    const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(source));
    const actualHash = [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
    if (actualHash !== manifest.hash) throw new Error("DATABASE_STORAGE_HASH_MISMATCH");
    const database = parseDatabaseConfig(source);
    this.databaseCacheHash = manifest.hash;
    this.databaseCache = database;
    state.db = database;
    state.dbHash = manifest.hash;
    state.dbFileName = "database.json";
    state.dbInstalledAt = Number(manifest.installedAt || state.dbInstalledAt || 0) || null;
  }

  #cacheEnabled(state) {
    return state?.settings?.cacheEnabled !== false;
  }

  #clearRuntimeCaches() {
    const removed = this.answerCache.size + this.adminCache.size + this.telegramCache.size;
    this.answerCache.clear();
    this.adminCache.clear();
    this.telegramCache.clear();
    return removed;
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
        if (pending) await this.ctx.storage.put("state", this.#persistableState(pending));
      }
    };
    const next = this.serial.then(run, run);
    this.serial = next.catch(() => {});
    return next;
  }

  async #load() {
    if (this.pendingState) return this.pendingState;
    const raw = await this.ctx.storage.get("state");
    let state = mergeState(raw);
    await this.ctx.storage.delete("database:backup:v5");
    if (raw && state.migrationVersion < 5) {
      const backupKey = "migration:state-backup:v5";
      if (!(await this.ctx.storage.get(backupKey))) {
        const backupState = { ...raw };
        delete backupState.db;
        await this.ctx.storage.put(backupKey, { savedAt: Date.now(), fromVersion: state.migrationVersion || 4, state: backupState });
      }
      state.migrationVersion = 5;
      state.migrationStatus = { version: 5, status: "completed", completedAt: Date.now(), sourceVersion: state.migrationStatus?.sourceVersion || 4 };
      await this.ctx.storage.put("state", this.#persistableState(state));
    } else if (!raw) {
      state.migrationVersion = 5;
      state.migrationStatus = { version: 5, status: "initialized", completedAt: Date.now() };
      await this.ctx.storage.put("state", this.#persistableState(state));
    }
    await this.#hydrateDatabase(state);
    const configuredOwner = ownerIdFrom(this.env);
    state.security.ownerId = configuredOwner || null;
    state.security.credentialSource = this.env?.OWNER_TELEGRAM_ID ? "environment-override" : "embedded-default";
    if (raw && (Object.hasOwn(raw, "db") || String(raw.security?.ownerId || "") !== String(state.security.ownerId || ""))) {
      await this.ctx.storage.put("state", this.#persistableState(state));
    }
    return state;
  }

  async #save(state) {
    // The enclosing serialized operation flushes this state once before returning.
    this.pendingState = state;
    return true;
  }

  #ownerId(state) {
    const configured = String(state?.db?.ownerPanel?.ownerId
      || state?.db?.authorization?.privateOwnerCommands?.requiredUserId || "").trim();
    return /^\d{1,20}$/.test(configured) && Number(configured) > 0 ? configured : ownerIdFrom(this.env);
  }

  #db(state) {
    return state?.db && typeof state.db === "object" && !Array.isArray(state.db) ? state.db : null;
  }

  #featureEnabled(state, id, chatId = null) {
    // A global OFF is authoritative; per-group overrides can only narrow an ON module.
    const globallyEnabled = isModuleEnabled(this.#db(state), id);
    if (!globallyEnabled) return false;
    const local = chatId == null ? undefined : state?.groupModuleOverrides?.[String(chatId)]?.[id];
    return typeof local === "boolean" ? local : true;
  }

  #text(state, key, fallback = "") {
    return asText(getPath(this.#db(state)?.texts, key, fallback)) || fallback;
  }

  #isOwner(userId, state) {
    const ownerId = this.#ownerId(state);
    return Boolean(ownerId) && String(userId ?? "") === ownerId;
  }

  #isOperator(userId, chatId, db, state) {
    // Durable database role declarations are not proof of Telegram administrator status.
    // The caller must additionally use #isTelegramAdmin for live status verification.
    return this.#isOwner(userId, state);
  }

  async #telegram(state, method, payload = {}, options = {}) {
    const botToken = botTokenFrom(this.env);
    if (typeof botToken !== "string" || !/^\d{6,12}:[A-Za-z0-9_-]{25,}$/.test(botToken)) {
      return { ok: false, error_code: 401, description: "BOT_TOKEN_MISSING_OR_INVALID" };
    }

    if (!options.bypassLocalRate && isTelegramOutboundMethod(method)) {
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

    const cacheable = options.noCache !== true && ["getMe", "getChatMember", "getChatMemberCount"].includes(method);
    const cacheKey = cacheable ? `${method}:${JSON.stringify(payload)}` : "";
    const useCache = cacheable && this.#cacheEnabled(state);
    const cached = useCache ? this.telegramCache.get(cacheKey) : null;
    if (cached && cached.expiresAt > Date.now()) return cached.value;
    const data = await requestTelegramApi(this.env, method, payload, {
      ...options,
      timeoutMs: options.timeoutMs,
    });
    if (data?.ok && useCache) {
      const ttl = method === "getMe" ? 6 * 60 * 60_000 : method === "getChatMemberCount" ? 60_000 : 20_000;
      this.telegramCache.set(cacheKey, { value: data, expiresAt: Date.now() + ttl });
      if (this.telegramCache.size > 1_000) {
        for (const [key, entry] of this.telegramCache) if (entry.expiresAt <= Date.now()) this.telegramCache.delete(key);
        while (this.telegramCache.size > 800) this.telegramCache.delete(this.telegramCache.keys().next().value);
      }
    }
    return data || { ok: false, error_code: 502, description: "INVALID_TELEGRAM_RESPONSE" };
  }

  async #send(chatId, text, state, extra = {}, options = {}) {
    if (chatId == null || String(chatId).trim() === "") return { ok: false, error_code: 400, description: "CHAT_ID_MISSING" };
    const body = String(text ?? "").slice(0, 4_000);
    if (!body) return { ok: false, description: "EMPTY_MESSAGE" };
    const configuredMode = this.#db(state)?.runtime?.telegram?.parseMode;
    const defaultMode = ["HTML", "Markdown", "MarkdownV2"].includes(configuredMode) ? configuredMode
      : configuredMode === false || configuredMode === null ? ""
        : "HTML";
    return this.#telegram(state, "sendMessage", {
      chat_id: chatId,
      text: body,
      link_preview_options: { is_disabled: true },
      ...(defaultMode ? { parse_mode: defaultMode } : {}),
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

  #settingsKeyboard(state) {
    const cacheEnabled = this.#cacheEnabled(state);
    const autoUpdate = state.settings?.autoUpdate !== false;
    const botEnabled = state.settings?.botEnabled !== false;
    const databaseInstalled = Boolean(this.#db(state));
    return {
      inline_keyboard: [
        [toggleButton("Cache", cacheEnabled, "settings:toggle:cache")],
        [toggleButton("Auto Update", autoUpdate, "settings:toggle:auto")],
        [button("Clear Cache", "settings:clear-cache", "primary")],
        [button(databaseInstalled ? "Replace Database" : "Install Database", "settings:install", "success"), button("Delete Database", "settings:delete", "danger")],
        [toggleButton("Bot", botEnabled, "settings:toggle:bot")],
      ],
    };
  }

  #settingsText(state, note = "") {
    const database = this.#db(state);
    const botEnabled = state.settings?.botEnabled !== false;
    const details = [
      "BOT SETTINGS",
      "",
      `Status: ${botEnabled ? "RUNNING" : "SHUTDOWN"}`,
      `Database: ${database ? `INSTALLED (${escapeHtml(database.version || "version unknown")})` : "NOT INSTALLED"}`,
      `Cache: ${this.#cacheEnabled(state) ? "ENABLED" : "DISABLED"}`,
      `Auto Update: ${state.settings?.autoUpdate !== false ? "ENABLED" : "DISABLED"}`,
    ];
    if (note) details.push("", escapeHtml(note));
    return details.join("\n");
  }

  async #syncCommandMenu(state, ownerChatId = "") {
    const ownerId = String(ownerChatId || this.#ownerId(state) || "");
    if (!ownerId || !/^\d{1,20}$/.test(ownerId)) {
      console.error(JSON.stringify({ event: "telegram_command_menu_owner_missing" }));
      return false;
    }

    const databaseCommands = collectDatabaseTelegramCommands(this.#db(state));
    const results = [];
    const scopesToClear = [
      null,
      { type: "all_private_chats" },
      { type: "all_group_chats" },
      { type: "all_chat_administrators" },
      { type: "chat", chat_id: Number(ownerId) },
    ];
    for (const scope of scopesToClear) {
      results.push(await this.#telegram(state, "deleteMyCommands", scope ? { scope } : {}, { bypassLocalRate: true }));
    }
    if (databaseCommands.length) {
      results.push(await this.#telegram(state, "setMyCommands", {
        scope: { type: "all_group_chats" },
        commands: databaseCommands,
      }, { bypassLocalRate: true }));
    }
    const ownerPanel = this.#db(state)?.ownerPanel || {};
    const ownerCommand = configuredCommand(ownerPanel.slashCommand || `/${ownerPanel.command || "admin"}`);
    const ownerCommands = [{ command: "settings", description: "Open owner settings" }];
    if (ownerPanel.enabled !== false && ownerCommand && ownerCommands.length < 100) {
      ownerCommands.push({ command: ownerCommand.slice(1), description: String(ownerPanel.commandDescription || "Owner control panel").slice(0, 256) });
    }
    results.push(await this.#telegram(state, "setMyCommands", {
      scope: { type: "chat", chat_id: Number(ownerId) },
      commands: ownerCommands,
    }, { bypassLocalRate: true }));

    const failures = results.filter((item) => !item?.ok);
    if (failures.length) {
      console.error(JSON.stringify({
        event: "telegram_command_menu_sync_failed",
        failures: failures.map((item) => ({ errorCode: item.error_code || 0, description: String(item.description || "UNKNOWN").slice(0, 120) })),
        databaseCommandCount: databaseCommands.length,
      }));
      return false;
    }
    console.log(JSON.stringify({
      event: "telegram_command_menu_synced",
      ownerChatId: ownerId,
      ownerCommands: ownerCommands.map((item) => item.command),
      databaseGroupCommands: databaseCommands.map((item) => item.command),
    }));
    return true;
  }

  async #sendSettingsPanel(state, chatId) {
    await this.#syncCommandMenu(state, chatId);
    const result = await this.#send(chatId, this.#settingsText(state), state, { reply_markup: this.#settingsKeyboard(state) });
    if (result?.ok && result.result?.message_id) {
      state.settingsMessage = { chatId: String(chatId), messageId: result.result.message_id };
      await this.#save(state);
      console.log(JSON.stringify({ event: "owner_settings_panel_sent", chatId: String(chatId), messageId: result.result.message_id }));
    } else {
      console.error(JSON.stringify({ event: "owner_settings_panel_send_failed", chatId: String(chatId), errorCode: Number(result?.error_code || 0), description: String(result?.description || "UNKNOWN").slice(0, 160) }));
    }
    return result;
  }

  async #editSettingsPanel(state, callback, note = "", force = false) {
    if (!force && state.settings?.autoUpdate === false) return;
    const message = callback?.message || {};
    if (message.chat?.id == null || message.message_id == null) return;
    await this.#telegram(state, "editMessageText", {
      chat_id: message.chat.id,
      message_id: message.message_id,
      text: this.#settingsText(state, note),
      parse_mode: "HTML",
      reply_markup: this.#settingsKeyboard(state),
      link_preview_options: { is_disabled: true },
    }, { bypassLocalRate: true });
  }

  async #handleSettingsCallback(state, callback) {
    const data = asText(callback.data);
    const chatId = callback.message.chat.id;
    if (data.startsWith("settings:features") || data.startsWith("settings:feature:")) {
      await this.#answerCallback(callback.id, "Feature controls are managed by the database.");
      return;
    }
    if (data === "settings:toggle:cache") {
      state.settings.cacheEnabled = !this.#cacheEnabled(state);
      if (!state.settings.cacheEnabled) this.#clearRuntimeCaches();
      await this.#save(state);
      await this.#editSettingsPanel(state, callback, "Cache setting saved.");
      return;
    }
    if (data === "settings:toggle:auto") {
      state.settings.autoUpdate = state.settings.autoUpdate === false;
      await this.#save(state);
      await this.#editSettingsPanel(state, callback, "Auto Update setting saved.", true);
      return;
    }
    if (data === "settings:toggle:bot") {
      state.settings.botEnabled = state.settings.botEnabled === false;
      await this.#save(state);
      await this.#editSettingsPanel(state, callback, state.settings.botEnabled ? "Bot enabled." : "Bot shut down. Settings remain available.");
      if (state.settings.botEnabled) await this.#scheduleNext(state);
      return;
    }
    if (data === "settings:clear-cache") {
      const removed = this.#clearRuntimeCaches();
      await this.#save(state);
      await this.#editSettingsPanel(state, callback, `Runtime cache cleared. ${removed} entries removed.`);
      return;
    }
    if (data === "settings:install") {
      state.flow = "database_upload";
      state.settingsMessage = { chatId: String(chatId), messageId: callback.message.message_id };
      await this.#save(state);
      await this.#telegram(state, "editMessageText", {
        chat_id: chatId,
        message_id: callback.message.message_id,
        text: "DATABASE INSTALLATION\n\nUpload only database.json. The database parser accepts JavaScript object-literal data syntax: comments, unquoted keys, single-quoted strings, trailing commas and template strings as literal text. Arbitrary JavaScript code is not executed. Telegram API actions use the main Worker shared API gateway. Do not upload a separate JavaScript database file.",
        reply_markup: { inline_keyboard: [[button("Back to Settings", "settings:refresh", "primary")]] },
      }, { bypassLocalRate: true });
      return;
    }
    if (data === "settings:delete") {
      state.deleteDatabasePendingAt = Date.now();
      await this.#save(state);
      await this.#telegram(state, "editMessageText", {
        chat_id: chatId,
        message_id: callback.message.message_id,
        text: "DELETE DATABASE?\n\nThis removes the installed database and its database-managed resources. This action cannot be undone.",
        reply_markup: { inline_keyboard: [[button("Confirm Delete", "settings:delete:confirm", "danger"), button("Cancel", "settings:refresh", "primary")]] },
      }, { bypassLocalRate: true });
      return;
    }
    if (data === "settings:delete:confirm") {
      const pendingAt = Number(state.deleteDatabasePendingAt || 0);
      if (!pendingAt || Date.now() - pendingAt > 120_000) {
        state.deleteDatabasePendingAt = null;
        await this.#save(state);
        await this.#editSettingsPanel(state, callback, "No active database deletion confirmation. Open Delete Database again.");
        return;
      }
      state.deleteDatabasePendingAt = null;
      const removed = await this.#deleteDatabase(state);
      await this.#save(state);
      await this.#syncCommandMenu(state, this.#ownerId(state));
      await this.#editSettingsPanel(state, callback, `Database deleted. ${removed} stored items removed.`);
      return;
    }
    if (data === "settings:refresh") {
      state.flow = null;
      state.deleteDatabasePendingAt = null;
      await this.#save(state);
      await this.#editSettingsPanel(state, callback, "Settings refreshed.");
    }
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
    const filename = asText(document?.file_name).replace(/[\u0000-\u001f\u007f]/g, "").slice(0, 128).toLowerCase();
    if (!document?.file_id || filename !== "database.json") {
      await this.#send(chatId, "Invalid file. Upload a Telegram document named database.json.", state);
      return;
    }
    const declaredSize = Number(document.file_size || 0);
    if (Number.isFinite(declaredSize) && declaredSize > MAX_DATABASE_BYTES) {
      await this.#send(chatId, "Telegram Bot API file downloads are limited to 20 MB. This file is too large.", state);
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
        headers: { accept: "application/json, text/javascript, text/plain, application/octet-stream;q=0.9" },
        signal: AbortSignal.timeout(DATABASE_DOWNLOAD_TIMEOUT_MS),
      });
      if (response.status >= 300 && response.status < 400) throw new Error("DATABASE_DOWNLOAD_REDIRECT_REJECTED");
      if (!response.ok) throw new Error(`DATABASE_DOWNLOAD_HTTP_${response.status}`);
      const source = await readBodyTextLimited(response, MAX_DATABASE_BYTES);
      await this.#installDatabaseSource(state, source, filename);
    } catch (error) {
      const code = asText(error?.message || error);
      const reason = code === "DATABASE_TOO_LARGE" ? "Telegram Bot API file downloads are limited to 20 MB."
        : code === "DATABASE_DOWNLOAD_REDIRECT_REJECTED" ? "The file download redirected to another host and was rejected."
          : code.startsWith("DATABASE_DOWNLOAD_HTTP_") ? "Telegram could not return the uploaded file. Try again."
            : code.startsWith("TELEGRAM_GET_FILE_FAILED") ? "Telegram could not prepare this file for download."
              : code === "TELEGRAM_FILE_PATH_INVALID" ? "Telegram returned an invalid file path."
                : "The database structure or schema is invalid. The previous database was kept.";
      await this.#send(chatId, `Database installation failed: ${reason}`, state);
    }
  }

  async #installDatabaseSource(state, source, filename = "database.json") {
    const safeFilename = String(filename || "").toLowerCase();
    let database;
    let manifest;
    let resourceReport = { created: 0, updated: 0, removed: 0, retained: 0 };
    const sourceText = String(source ?? "");
    const sourceBytes = new TextEncoder().encode(sourceText);
    if (safeFilename !== "database.json") {
      await this.#send(this.#ownerId(state), "Database filename must be database.json.", state);
      return false;
    }
    if (!sourceText || sourceBytes.byteLength > MAX_DATABASE_BYTES) {
      await this.#send(this.#ownerId(state), "The database file exceeds Telegram's 20 MB download limit or is empty.", state);
      return false;
    }

    let newHash = "";
    const previousManifest = await this.ctx.storage.get("database:v1:manifest");
    try {
      database = parseDatabaseConfig(sourceText);
      const digest = await crypto.subtle.digest("SHA-256", sourceBytes);
      newHash = [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
      manifest = await this.#storeDatabaseChunks(sourceText, newHash, safeFilename);
      resourceReport = await this.#reconcileDatabaseResources(state, database);

      state.db = database;
      state.dbUrl = null;
      state.dbFileName = safeFilename;
      state.dbHash = newHash;
      state.dbInstalledAt = Date.now();
      state.dbManifest = this.#databaseManifest(database);
      state.maintenanceNextAt = Date.now() + clampNumber(database.runtime?.maintenance?.sweepIntervalMinutes, 30, 5, 1_440) * 60_000;
      state.maintenanceCursor = null;
      state.flow = null;
      await this.ctx.storage.transaction(async (txn) => {
        await txn.put("database:v1:manifest", manifest);
        await txn.put("state", this.#persistableState(state));
      });
      this.pendingState = null;
      this.databaseCacheHash = newHash;
      this.databaseCache = database;
      if (previousManifest?.hash && previousManifest.hash !== newHash) {
        await this.#removeDatabaseChunks(previousManifest.hash).catch((cleanupError) => {
          console.error("Previous database chunk cleanup deferred", asText(cleanupError?.message || cleanupError).slice(0, 120));
        });
      }
    } catch (error) {
      this.pendingState = null;
      if (newHash) await this.#removeDatabaseChunks(newHash).catch(() => {});
      const code = asText(error?.message || error);
      const reason = code === "database_size_invalid" ? "The file exceeds the supported download size."
        : code.startsWith("resource_") ? "A database resource configuration is outside the supported storage limits."
          : code === "DATABASE_STORAGE_CHUNK_MISSING" || code === "DATABASE_STORAGE_HASH_MISMATCH" ? "The uploaded data could not be verified after storage."
            : code.startsWith("database_config_executable_expression_not_supported")
              ? "The database contains unsupported executable JavaScript. Use supported JavaScript object-literal data syntax only; arbitrary code is not executed by this Cloudflare Worker."
              : "The database schema or supported JSON-plus-JavaScript data syntax is invalid.";
      console.error("Database installation rejected", code.slice(0, 120));
      await this.#send(this.#ownerId(state), `Database installation failed: ${reason} The previously installed database remains active.`, state);
      return false;
    }

    let commandMenuSynced = false;
    try {
      commandMenuSynced = await this.#syncCommandMenu(state, this.#ownerId(state));
      await this.#completeResourceCleanup(state);
      await this.#scheduleNext(state);
    } catch (cleanupError) {
      console.error("Database post-install maintenance deferred", asText(cleanupError?.message || cleanupError).slice(0, 120));
      state.maintenanceNextAt = Date.now() + 60_000;
      await this.#save(state);
    }

    const message = [
      "DATABASE INSTALLED",
      `Version: ${database.version || "unknown"}`,
      `File size: ${sourceBytes.byteLength.toLocaleString("en-US")} bytes`,
      `Rules: ${database.features?.chatbot?.rules?.length || 0}`,
      `Group commands: ${collectDatabaseTelegramCommands(database).length}`,
      `Command menu: ${commandMenuSynced ? "SYNCED" : "SYNC FAILED - RETRY WITH /settings"}`,
      `Resources created: ${resourceReport.created}`,
      `Resources updated: ${resourceReport.updated}`,
      `Resources removed: ${resourceReport.removed}`,
    ].join("\n");
    await this.#send(this.#ownerId(state), message, state);
    const panel = state.settingsMessage;
    if (state.settings?.autoUpdate !== false && panel?.chatId && panel?.messageId) {
      await this.#telegram(state, "editMessageText", {
        chat_id: panel.chatId,
        message_id: panel.messageId,
        text: this.#settingsText(state, "Database installed successfully."),
        reply_markup: this.#settingsKeyboard(state),
      }, { bypassLocalRate: true });
    }
    return true;
  }

  async #deleteDatabase(state) {
    const cleanup = await this.#reconcileDatabaseResources(state, null);
    let chunkCount = 0;
    while (true) {
      const databaseRows = await this.ctx.storage.list({ prefix: "database:", limit: 1_000 });
      if (!databaseRows.size) break;
      chunkCount += await this.ctx.storage.delete([...databaseRows.keys()]);
      if (databaseRows.size < 1_000) break;
    }
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
    this.databaseCacheHash = "";
    this.databaseCache = null;
    this.#clearRuntimeCaches();
    await this.#save(state);
    cleanup.removed += await this.#completeResourceCleanup(state);
    state.resourceRegistry = {};
    await this.#save(state);
    await this.#scheduleNext(state);
    return cleanup.removed + chunkCount;
  }

  async #handleGroupControlCallback(state, callback) {
    const data = asText(callback.data);
    const chat = callback.message?.chat;
    if (!isGroup(chat)) {
      await this.#answerCallback(callback.id, "This button is available only in its original group.");
      return;
    }
    const chatId = String(chat.id);
    const userId = String(callback.from?.id || "");
    const allowed = this.#isOwner(userId, state) || await this.#isTelegramAdmin(state, userId, chatId);
    if (!allowed) {
      await this.#answerCallback(callback.id, this.#text(state, "group.adminOnly", "Only a verified group administrator can use this command."));
      return;
    }
    if (data.startsWith("group:bot:") || data.startsWith("g5:")) {
      const parts = data.split(":");
      const action = data.startsWith("g5:") ? parts[1] : parts[2];
      const targetChatId = data.startsWith("g5:") ? parts[2] : parts[3];
      if (String(targetChatId) !== chatId || !["on", "off", "toggle"].includes(action)) {
        await this.#answerCallback(callback.id, "This button belongs to another group.");
        return;
      }
      state.groupSettings[chatId] ||= {};
      const current = state.groupSettings[chatId].botEnabled !== false;
      const next = action === "toggle" ? !current : action === "on";
      state.groupSettings[chatId].botEnabled = next;
      await this.#save(state);
      await this.#answerCallback(callback.id, next ? "Bot replies enabled." : "Bot replies disabled.");
      await this.#telegram(state, "editMessageText", {
        chat_id: chat.id,
        message_id: callback.message.message_id,
        text: `Quick controls\nBot replies: ${next ? "ON" : "OFF"}`,
        reply_markup: { inline_keyboard: [[toggleButton("Bot replies", next, `g5:toggle:${chatId}`)]] },
      }, { bypassLocalRate: true });
      return;
    }
    const parts = data.split(":");
    const action = data.startsWith("t5:") ? parts[1] : parts[1];
    const targetChatId = parts[2];
    const nonce = parts[3];
    const draft = state.tagDrafts?.[nonce];
    if (!draft || String(draft.chatId) !== chatId || String(targetChatId) !== chatId || Number(draft.expiresAt || 0) < Date.now()) {
      await this.#answerCallback(callback.id, "This preview has expired. Create a new preview and try again.");
      return;
    }
    if (String(draft.initiatorId) !== userId && !this.#isOwner(userId, state)) {
      await this.#answerCallback(callback.id, "This preview was created by another administrator.");
      return;
    }
    if (action === "cancel") {
      delete state.tagDrafts[nonce];
      await this.#save(state);
      await this.#answerCallback(callback.id, "Tagging cancelled.");
      return;
    }
    if (action !== "confirm") {
      await this.#answerCallback(callback.id, "Invalid request.");
      return;
    }
    const cooldown = clampNumber(this.#db(state)?.features?.tagKnownMembers?.cooldownSeconds, 300, 30, 86_400) * 1_000;
    if (Date.now() - Number(state.tagCooldowns[chatId] || 0) < cooldown) {
      await this.#answerCallback(callback.id, this.#text(state, "group.tagCooldown", "Please wait before creating another tag preview."));
      return;
    }
    const currentKnown = new Set((state.knownMembers[chatId] || []).filter((item) => !item.isBot && !state.tagOptOut[`${chatId}:${item.id}`]).map((item) => String(item.id)));
    const ids = (draft.ids || []).filter((id) => currentKnown.has(String(id))).slice(0, clampNumber(this.#db(state)?.features?.tagKnownMembers?.maxMembers, 80, 1, 200));
    if (!ids.length) {
      delete state.tagDrafts[nonce];
      await this.#save(state);
      await this.#answerCallback(callback.id, "No eligible members remain in this preview.");
      return;
    }
    const known = new Map((state.knownMembers[chatId] || []).map((item) => [String(item.id), item]));
    const batchSize = clampNumber(this.#db(state)?.features?.tagKnownMembers?.batchSize, 8, 1, 12);
    let attempted = 0;
    for (let index = 0; index < ids.length; index += batchSize) {
      const batch = ids.slice(index, index + batchSize);
      const mentions = batch.map((id) => {
        const member = known.get(String(id)) || {};
        const name = [member.firstName, member.lastName].filter(Boolean).join(" ") || `User ${id}`;
        const safeName = name.replace(/[&<>"]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;" }[char]));
        return `<a href="tg://user?id=${id}">${safeName}</a>`;
      }).join(", ");
      const result = await this.#send(chat.id, `👋 ${mentions}`, state, { parse_mode: "HTML" }, { bypassLocalRate: true, group: true });
      if (result.ok) attempted += batch.length;
      if (!result.ok) break;
    }
    state.tagCooldowns[chatId] = Date.now();
    delete state.tagDrafts[nonce];
    await this.#save(state);
    await this.#answerCallback(callback.id, `Tagging attempted for ${attempted} members.`);
    await this.#send(chat.id, renderTemplate(this.#text(state, "group.tagDone", "✅ Tags sent to {count} known members."), { count: attempted }), state, {}, { bypassLocalRate: true, group: true });
  }

  async #handleCaptchaCallback(state, callback) {
    const parts = asText(callback.data).split(":");
    const chatId = parts[1];
    const userId = parts[2];
    const nonce = parts[3];
    if (!callback.message?.chat || String(callback.message.chat.id) !== String(chatId) || !isGroup(callback.message.chat)) {
      await this.#answerCallback(callback.id, "The verification request is not linked to a valid group.");
      return true;
    }
    if (String(callback.from?.id) !== userId) {
      await this.#answerCallback(callback.id, "This button belongs to another member.");
      return true;
    }
    const key = `${chatId}:${userId}`;
    const pending = state.pendingVerifications?.[key];
    if (!pending || String(pending.nonce) !== nonce || Number(pending.expiresAt || 0) < Date.now()) {
      await this.#answerCallback(callback.id, "Verification expired. Rejoin the group or contact an administrator.");
      return true;
    }
    const unrestricted = await this.#telegram(state, "restrictChatMember", {
      chat_id: chatId,
      user_id: Number(userId),
      permissions: {
        can_send_messages: true, can_send_audios: true, can_send_documents: true,
        can_send_photos: true, can_send_videos: true, can_send_video_notes: true,
        can_send_voice_notes: true, can_send_polls: true, can_send_other_messages: true,
        can_add_web_page_previews: true,
      },
      use_independent_chat_permissions: true,
    }, { bypassLocalRate: true });
    if (!unrestricted.ok) {
      await this.#answerCallback(callback.id, "Telegram could not restore member permissions. Check the bot administrator rights.");
      return true;
    }
    delete state.pendingVerifications[key];
    await this.#save(state);
    await this.#answerCallback(callback.id, "Verified. Welcome!");
    if (callback.message?.chat?.id) {
      await this.#telegram(state, "editMessageText", {
        chat_id: callback.message.chat.id,
        message_id: callback.message.message_id,
        text: "Your membership has been verified.",
      }, { bypassLocalRate: true });
    }
    return true;
  }

  async #handleCallback(state, callback) {
    const data = asText(callback.data);
    if (data.startsWith("help:")) {
      await this.#handleHelpCallback(state, callback);
      return;
    }
    if (data.startsWith("captcha:")) {
      await this.#handleCaptchaCallback(state, callback);
      return;
    }
    if (data.startsWith("group:bot:") || data.startsWith("tag:") || data.startsWith("g5:") || data.startsWith("t5:")) {
      await this.#handleGroupControlCallback(state, callback);
      return;
    }
    await this.#answerCallback(callback.id);
  }

  async #isTelegramAdmin(state, userId, chatId) {
    if (this.#isOwner(userId, state)) return true;
    const key = `${chatId}:${userId}`;
    const useCache = this.#cacheEnabled(state);
    const cached = useCache ? this.adminCache?.get(key) : null;
    if (cached && cached.expiresAt > Date.now()) return cached.allowed;
    const result = await this.#telegram(state, "getChatMember", { chat_id: chatId, user_id: userId }, { bypassLocalRate: true });
    const allowed = Boolean(result.ok && ["creator", "administrator"].includes(result.result?.status));
    this.adminCache ||= new Map();
    if (useCache) this.adminCache.set(key, { allowed, expiresAt: Date.now() + 30_000 });
    if (useCache && this.adminCache.size > 1_000) {
      for (const [cacheKey, entry] of this.adminCache) if (entry.expiresAt <= Date.now()) this.adminCache.delete(cacheKey);
      while (this.adminCache.size > 800) this.adminCache.delete(this.adminCache.keys().next().value);
    }
    return allowed;
  }

  async #botPermission(state, chatId, permission) {
    const me = await this.#telegram(state, "getMe", {}, { bypassLocalRate: true });
    if (!me.ok || !me.result?.id) return null;
    const member = await this.#telegram(state, "getChatMember", { chat_id: chatId, user_id: me.result.id }, { bypassLocalRate: true });
    if (!member.ok || !member.result || !["creator", "administrator", "member", "restricted"].includes(member.result.status)) return null;
    if (member.result.status === "creator") return true;
    if (member.result.status !== "administrator") return false;
    return Object.hasOwn(member.result, permission) ? member.result[permission] === true : null;
  }

  async #securityAlert(state, details) {
    const chatId = String(details.chatId || "unknown");
    const kind = String(details.kind || "security").slice(0, 48);
    const key = `${chatId}:${kind}`;
    const now = Date.now();
    const settings = this.#db(state)?.features?.antiSpam || {};
    const cooldownMs = clampNumber(settings.reportCooldownSeconds, 300, 30, 86_400) * 1_000;
    const previous = state.securityAlerts[key] || {};
    const severity = clampNumber(details.severity, 1, 1, 5);
    const withinWindow = now - Number(previous.windowStartedAt || 0) <= cooldownMs;
    const accumulated = withinWindow ? Number(previous.eventCount || 0) + Number(details.count || 1) : Number(details.count || 1);
    const shouldSend = !previous.lastSentAt || now - Number(previous.lastSentAt) >= cooldownMs || severity > Number(previous.severity || 0);
    state.securityAlerts[key] = {
      windowStartedAt: withinWindow ? Number(previous.windowStartedAt) : now,
      eventCount: Math.min(100_000, accumulated),
      lastSentAt: shouldSend ? now : Number(previous.lastSentAt || 0),
      severity: Math.max(severity, shouldSend ? severity : Number(previous.severity || 0)),
      updatedAt: now,
    };
    const audit = {
      at: now, kind, chatId,
      chatTitle: asText(details.chatTitle || chatId).slice(0, 120),
      reason: asText(details.reason || kind).slice(0, 180),
      count: Math.min(100_000, Number(details.count || 1)),
      userIds: [...new Set((details.userIds || []).map(String))].slice(0, 30),
      action: asText(details.action || "No action").slice(0, 100),
    };
    audit.reportedToOwner = shouldSend;
    state.securityAudit = [...(state.securityAudit || []), audit].slice(-500);
    // Keep alert keys bounded even when an attacker creates many chat/kind pairs.
    const alertEntries = Object.entries(state.securityAlerts || {});
    if (alertEntries.length > 1_000) {
      alertEntries.sort((a, b) => Number(a[1]?.updatedAt || 0) - Number(b[1]?.updatedAt || 0));
      for (const [staleKey] of alertEntries.slice(0, alertEntries.length - 800)) delete state.securityAlerts[staleKey];
    }
    if (shouldSend) {
      const owner = this.#ownerId(state);
      if (owner) {
        const userIds = audit.userIds.length ? audit.userIds.join(", ") : "Not recorded";
        await this.#send(owner,
          `🛡 SECURITY ALERT: ${kind}\nGroup: ${audit.chatTitle} (${chatId})\nTime: ${new Date(now).toLocaleString("en-US")}\nMeasured reason: ${audit.reason}\nEvents in window: ${state.securityAlerts[key].eventCount}\nSuspected users: ${userIds}\nAction taken: ${audit.action}`,
          state, {}, { bypassLocalRate: true });
      }
    }
    await this.#save(state);
    return { shouldSend, eventCount: state.securityAlerts[key].eventCount };
  }

  async #trackGroup(state, chat, botMember = null) {
    if (!isGroup(chat) || !chat.id) return;
    const id = String(chat.id);
    const old = state.groups[id] || {};
    if (!botMember && Date.now() - Number(old.rightsCheckedAt || 0) > 600_000) {
      const me = await this.#telegram(state, "getMe", {}, { bypassLocalRate: true });
      if (me.ok && me.result?.id) {
        const membership = await this.#telegram(state, "getChatMember", { chat_id: id, user_id: me.result.id }, { bypassLocalRate: true });
        if (membership.ok) botMember = membership.result;
      }
      old.rightsCheckedAt = Date.now();
    }
    const permissionMap = {
      canDeleteMessages: "can_delete_messages", canRestrictMembers: "can_restrict_members",
      canInviteUsers: "can_invite_users", canPinMessages: "can_pin_messages",
      canManageChat: "can_manage_chat", canManageVideoChats: "can_manage_video_chats",
      canChangeInfo: "can_change_info", canPostMessages: "can_post_messages",
      canEditMessages: "can_edit_messages", canPromoteMembers: "can_promote_members",
      canManageTopics: "can_manage_topics", canManageStories: "can_manage_stories",
    };
    const rights = botMember ? Object.fromEntries(Object.entries(permissionMap).map(([key, source]) => [key, Object.hasOwn(botMember, source) ? botMember[source] === true : null])) : (old.rights || {});
    state.groups[id] = {
      id,
      title: asText(chat.title || old.title || id).slice(0, 180),
      username: chat.username || old.username || null,
      type: chat.type || old.type || "supergroup",
      link: chat.username ? `https://t.me/${chat.username}` : (old.link || null),
      botStatus: botMember?.status || old.botStatus || "unknown",
      rights,
      rightsCheckedAt: botMember ? Date.now() : Number(old.rightsCheckedAt || 0),
      lastMemberCount: Number.isInteger(old.lastMemberCount) ? old.lastMemberCount : null,
      inviteLink: old.inviteLinkValid ? old.inviteLink : null,
      inviteLinkValid: old.inviteLinkValid === true,
      lastSeenAt: Date.now(),
      joinedAt: old.joinedAt || (botMember && !["left", "kicked"].includes(botMember.status) ? Date.now() : null),
    };
    const maxRegisteredGroups = clampNumber(this.#db(state)?.limits?.maxRegisteredGroups, 500, 1, 5_000);
    if (Object.keys(state.groups).length > maxRegisteredGroups) {
      const candidates = Object.entries(state.groups)
        .filter(([groupId]) => !state.blockedGroups.includes(groupId) && !state.leftGroups.includes(groupId))
        .sort((a, b) => Number(a[1].lastSeenAt || 0) - Number(b[1].lastSeenAt || 0));
      for (const [oldId] of candidates.slice(0, Math.max(0, Object.keys(state.groups).length - maxRegisteredGroups))) {
        delete state.groups[oldId];
        delete state.groupUsage[oldId];
      }
    }
  }

  async #trackChannel(state, chat, botMember = null) {
    if (chat?.type !== "channel" || !chat.id) return;
    const id = String(chat.id);
    const old = state.channels.find((item) => String(item.id) === id) || {};
    if (!botMember || !Object.hasOwn(botMember, "status")) {
      const me = await this.#telegram(state, "getMe", {}, { bypassLocalRate: true });
      if (me.ok && me.result?.id) {
        const membership = await this.#telegram(state, "getChatMember", { chat_id: id, user_id: me.result.id }, { bypassLocalRate: true });
        if (membership.ok) botMember = membership.result;
      }
    }
    const rawPermissions = ["can_post_messages", "can_edit_messages", "can_delete_messages", "can_invite_users", "can_manage_chat", "can_change_info", "can_promote_members", "can_manage_video_chats", "can_post_stories", "can_edit_stories", "can_delete_stories"];
    const permissions = {};
    for (const key of rawPermissions) permissions[key] = botMember && Object.hasOwn(botMember, key) ? botMember[key] === true : null;
    const username = chat.username || old.username || null;
    const record = {
      id, title: asText(chat.title || old.title || id).slice(0, 180), username,
      link: username ? `https://t.me/${username}` : null,
      type: "channel", botStatus: botMember?.status || old.botStatus || "Unknown",
      permissions, rightsCheckedAt: botMember ? Date.now() : Number(old.rightsCheckedAt || 0),
      lastSeenAt: Date.now(),
    };
    const index = state.channels.findIndex((item) => String(item.id) === id);
    if (index >= 0) state.channels[index] = record;
    else state.channels.unshift(record);
    state.channels = state.channels.slice(0, clampNumber(this.#db(state)?.limits?.maxRegisteredChannels, 300, 1, 5_000));
    await this.#save(state);
  }

  #rememberPvUser(state, user, updateId = null) {
    if (!user?.id || user.is_bot) return;
    const id = String(user.id);
    const old = state.pvUsers[id] || {};
    state.pvUsers[id] = {
      id,
      firstName: asText(user.first_name || old.firstName || "User").slice(0, 100),
      lastName: asText(user.last_name || old.lastName || "").slice(0, 100),
      username: user.username || old.username || null,
      lastSeenAt: Date.now(),
      updateCount: Number(old.updateCount || 0) + 1,
      lastUpdateId: Number.isSafeInteger(updateId) ? updateId : old.lastUpdateId || null,
    };
    const ids = Object.keys(state.pvUsers);
    if (ids.length > clampNumber(this.#db(state)?.limits?.maxPvUsers, 2_000, 100, 5_000)) {
      ids.sort((a, b) => Number(state.pvUsers[a]?.lastSeenAt || 0) - Number(state.pvUsers[b]?.lastSeenAt || 0));
      for (const stale of ids.slice(0, ids.length - 1_800)) delete state.pvUsers[stale];
    }
  }

  #rememberKnownMember(state, chat, user) {
    if (!isGroup(chat) || !user?.id || user.is_bot) return;
    const chatId = String(chat.id);
    const max = clampNumber(this.#db(state)?.limits?.maxKnownMembersPerGroup, 300, 20, 1_000);
    const list = Array.isArray(state.knownMembers[chatId]) ? state.knownMembers[chatId] : [];
    const id = String(user.id);
    const existingIndex = list.findIndex((item) => String(item.id) === id);
    const entry = { id, firstName: asText(user.first_name || "User").slice(0, 80), lastName: asText(user.last_name || "").slice(0, 80), username: user.username || null, isBot: Boolean(user.is_bot), lastSeenAt: Date.now() };
    if (existingIndex >= 0) list.splice(existingIndex, 1);
    list.push(entry);
    state.knownMembers[chatId] = list.slice(-max);
  }

  #markMemberJoined(state, chat, member) {
    if (!isGroup(chat) || !member?.id || member.is_bot) return false;
    state.memberStates ||= {};
    const key = `${String(chat.id)}:${String(member.id)}`;
    const previous = state.memberStates[key];
    if (previous?.status === "member") return false;
    state.memberStates[key] = { status: "member", updatedAt: Date.now() };
    const entries = Object.entries(state.memberStates);
    if (entries.length > 20_000) {
      entries.sort((a, b) => Number(a[1]?.updatedAt || 0) - Number(b[1]?.updatedAt || 0));
      state.memberStates = Object.fromEntries(entries.slice(-16_000));
    }
    return true;
  }

  #markMemberLeft(state, chat, member) {
    if (!isGroup(chat) || !member?.id || member.is_bot) return false;
    state.memberStates ||= {};
    const chatId = String(chat.id);
    const userId = String(member.id);
    const key = `${chatId}:${userId}`;
    const previous = state.memberStates[key];
    const transitioned = previous?.status !== "left";
    state.memberStates[key] = { status: "left", updatedAt: Date.now() };
    delete state.welcomeDelivered[key];
    delete state.welcomeDedup[key];
    state.welcomeQueue = (state.welcomeQueue || []).filter((item) =>
      !(String(item.chatId) === chatId && String(item.member?.id) === userId));
    delete state.pendingVerifications[key];
    return transitioned;
  }

  #renderGoodbye(state, chat, member) {
    const fullName = [member?.first_name, member?.last_name].filter(Boolean).join(" ") || String(member?.id || "User");
    const mention = member?.id
      ? `<a href="tg://user?id=${Number(member.id)}">${escapeHtml(fullName)}</a>`
      : escapeHtml(fullName);
    const date = new Intl.DateTimeFormat("fa-IR", { timeZone: "Asia/Tehran", dateStyle: "long" }).format(new Date());
    const time = new Intl.DateTimeFormat("fa-IR", { timeZone: "Asia/Tehran", hour: "2-digit", minute: "2-digit" }).format(new Date());
    const values = {
      name: escapeHtml(fullName),
      user: escapeHtml(fullName),
      mention,
      firstname: escapeHtml(member?.first_name || ""),
      lastname: escapeHtml(member?.last_name || ""),
      username: member?.username ? `@${escapeHtml(member.username)}` : "",
      userid: escapeHtml(member?.id || ""),
      groupname: escapeHtml(chat?.title || "Group"),
      date: escapeHtml(date),
      time: escapeHtml(time),
    };
    const feature = this.#db(state)?.features?.goodbye || {};
    const groupSettings = state.groupSettings[String(chat?.id)] || {};
    let rendered = renderTemplate(groupSettings.goodbyeText || feature.text || "👋 خداحافظ !mention", values);
    const tokens = {
      "!mention": values.mention, "منشن_کاربر": values.mention,
      "!firstname": values.firstname, "نام_کاربر": values.firstname,
      "!lastname": values.lastname, "فامیل_کاربر": values.lastname,
      "!username": values.username, "آیدی_کاربر": values.username,
      "!userid": values.userid, "آیدی_عددی_کاربر": values.userid,
      "!groupname": values.groupname, "نام_گروه": values.groupname,
      "!date": values.date, "زمان_تاریخ": values.date,
      "!time": values.time, "زمان_ساعت": values.time,
    };
    for (const [token, value] of Object.entries(tokens)) rendered = rendered.split(token).join(value);
    return rendered;
  }

  async #sendGoodbye(state, chat, member) {
    if (!this.#featureEnabled(state, "goodbye", chat?.id)) return;
    const chatId = String(chat.id);
    const text = this.#renderGoodbye(state, chat, member);
    const media = state.groupSettings[chatId]?.goodbyeMedia || this.#db(state)?.features?.goodbye?.media || null;
    let delivered = false;
    if (media?.fileId && ["photo", "video", "audio", "voice", "animation", "sticker", "video_note"].includes(media.type)) {
      const field = media.type === "video_note" ? "video_note" : media.type;
      const method = media.type === "video_note" ? "sendVideoNote" : media.type === "sticker" ? "sendSticker" : media.type === "animation" ? "sendAnimation" : media.type === "voice" ? "sendVoice" : media.type === "audio" ? "sendAudio" : media.type === "video" ? "sendVideo" : "sendPhoto";
      const captionSupported = !["sticker", "video_note"].includes(media.type);
      const payload = { chat_id: Number(chat.id), [field]: media.fileId };
      if (captionSupported && text.length <= 950) {
        payload.caption = text;
        payload.parse_mode = this.#db(state)?.runtime?.telegram?.parseMode || "HTML";
      }
      const sent = await this.#telegram(state, method, payload, { group: true });
      delivered = Boolean(sent.ok);
      if (delivered && (!captionSupported || text.length > 950)) {
        const textSent = await this.#send(chat.id, text, state, {}, { group: true });
        delivered = Boolean(textSent.ok);
      }
    } else {
      const sent = await this.#send(chat.id, text, state, {}, { group: true });
      delivered = Boolean(sent.ok);
    }
    if (!delivered) {
      console.error(JSON.stringify({ event: "goodbye_message_failed", chatId, userId: String(member?.id || ""), reason: "TELEGRAM_DELIVERY_FAILED" }));
    }
  }

  async #handlePrivateMessage(state, message) {
    const user = message.from || {};
    const chat = message.chat || {};
    if (!isPrivate(chat) || !this.#isOwner(user.id, state)) return;

    const text = asText(message.text || message.caption);
    const parsed = parseCommand(text);
    const ownerCommand = configuredCommand(this.#ownerPanelConfig(state).slashCommand || `/${this.#ownerPanelConfig(state).command || "admin"}`);
    if (parsed && this.#ownerPanelConfig(state).enabled !== false && parsed.command === ownerCommand) {
      await this.#handleOwnerPanelCommand(state, message, parsed);
      return;
    }
    if (parsed?.command === "/settings") {
      if (parsed.args.length === 1 && parsed.args[0].toLowerCase() === "install") {
        state.flow = "database_upload";
        await this.#save(state);
        await this.#send(chat.id,
          "DATABASE INSTALLATION\n\nUpload only database.json. The database parser accepts JavaScript object-literal data syntax: comments, unquoted keys, single-quoted strings, trailing commas and template strings as literal text. Arbitrary JavaScript code is not executed. Telegram API actions use the main Worker shared API gateway. Do not upload a separate JavaScript database file.",
          state,
        );
        return;
      }
      if (parsed.args.length === 0) {
        state.flow = null;
        await this.#save(state);
        await this.#sendSettingsPanel(state, chat.id);
      }
      return;
    }

    if (state.flow === "database_upload" && message.document) {
      await this.#installFromTelegramDocument(state, message);
    }
  }

  #cacheGet(key, state) {
    if (!this.#cacheEnabled(state)) return "";
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

  #cacheSet(key, answer, ttlMs = 600_000, state = null) {
    if (!this.#cacheEnabled(state)) return;
    this.answerCache.delete(key);
    this.answerCache.set(key, { answer: String(answer).slice(0, 3800), expiresAt: Date.now() + ttlMs });
    while (this.answerCache.size > 512) this.answerCache.delete(this.answerCache.keys().next().value);
  }

  #chatbotAnswer(text, db, memory = null) {
    const feature = db.features?.chatbot || {};
    if (!text || text.length > Number(feature.maxInputLength || 1200)) return "";
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
      user: memory?.displayName || "friend",
      time: new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", timeZone: "UTC" }),
    }).slice(0, 3_800);
  }

  async #handleJoinRequest(state, request) {
    const feature = this.#db(state)?.features?.joinRequests || {};
    if (!this.#featureEnabled(state, "joinRequests", request.chat?.id)) return;
    const chatId = request.chat?.id;
    if (!chatId) return;
    const userId = String(request.from?.id || "");
    if ((feature.denylist || []).map(String).includes(userId)) {
      await this.#telegram(state, "declineChatJoinRequest", { chat_id: chatId, user_id: userId }, { bypassLocalRate: true });
      return;
    }
    const allowed = (feature.allowlist || []).map(String).includes(userId);
    if (!feature.autoApprove && !allowed) return;
    const result = await this.#telegram(state, "approveChatJoinRequest", { chat_id: chatId, user_id: userId }, { bypassLocalRate: true });
    if (result.ok && feature.notify && this.#ownerId(state)) {
      await this.#send(this.#ownerId(state), renderTemplate(this.#text(state, "join.approved", "✅ Join request approved for {name}."), { name: userDisplay(request.from) }), state);
    }
  }

  async #handleNewMembers(state, message, joinContext = {}) {
    const db = this.#db(state);
    if (!db) return;
    const welcomeFeature = db.features?.welcome || {};
    const captchaFeature = db.features?.captcha || {};
    const raidFeature = db.features?.raidProtection || {};
    const chatId = String(message.chat?.id || "");
    const now = Date.now();
    const raidEnabled = this.#featureEnabled(state, "raidProtection", chatId);
    const dedup = state.welcomeDedup || (state.welcomeDedup = {});
    const inviteSource = Boolean(joinContext.inviteLink || joinContext.viaChatFolderInviteLink || joinContext.viaJoinRequest);
    const members = (message.new_chat_members || []).filter((member) => {
      if (!member || member.is_bot || !member.id) return false;
      const key = `${chatId}:${member.id}`;
      const lastJoinAt = Number(dedup[key] || 0);
      const recentJoinEvent = lastJoinAt > 0 && now - lastJoinAt < 1_500;
      const alreadyQueued = (state.welcomeQueue || []).some((item) =>
        String(item.chatId) === chatId && String(item.member?.id) === String(member.id));
      // A second Telegram update type can describe the same join. Deduplicate only
      // that short cross-update window; stale delivered/queued state is reset so a
      // later real re-join receives a fresh welcome even if the leave update was missed.
      if (recentJoinEvent && (state.welcomeDelivered?.[key] || alreadyQueued)) return false;
      state.welcomeQueue = (state.welcomeQueue || []).filter((item) =>
        !(String(item.chatId) === chatId && String(item.member?.id) === String(member.id)));
      delete state.welcomeDelivered[key];
      this.#markMemberJoined(state, message.chat, member);
      dedup[key] = now;
      return true;
    });
    for (const [key, stamp] of Object.entries(dedup)) if (now - Number(stamp || 0) > 3_600_000) delete dedup[key];
    const dedupKeys = Object.keys(dedup);
    if (dedupKeys.length > 2_000) for (const key of dedupKeys.slice(0, dedupKeys.length - 1_500)) delete dedup[key];
    const antiRaid = db.features?.antiSpam?.raid || {};
    const raidWindow = clampNumber(antiRaid.windowSeconds, raidFeature.windowSeconds || 60, 10, 600);
    const joins = (state.joinWindows[chatId] || []).filter((stamp) => now - stamp <= raidWindow * 1_000);
    for (const member of members) joins.push(now);
    state.joinWindows[chatId] = joins.slice(-150);
    const raidThreshold = clampNumber(antiRaid.maxJoins, raidFeature.maxJoins || 10, 3, 100);
    const escalationThreshold = clampNumber(antiRaid.escalationJoins, raidFeature.escalationJoins || 20, raidThreshold, 200);
    const raidDetected = raidEnabled && joins.length >= raidThreshold;
    if (raidDetected) {
      const severity = joins.length >= escalationThreshold ? 2 : 1;
      await this.#securityAlert(state, {
        chatId, chatTitle: message.chat.title || chatId, kind: "join_raid",
        reason: `${joins.length} joins in ${raidWindow} seconds; threshold ${raidThreshold}`,
        count: members.length, userIds: members.map((member) => member.id), severity,
        action: "Join CAPTCHA was enabled for new members; restrictions require verified bot permissions.",
      });
    }
    const captchaRequired = this.#featureEnabled(state, "captcha", chatId)
      || (raidDetected && raidFeature.captchaDuringRaid !== false);

    for (const member of members) {
      this.#rememberKnownMember(state, message.chat, member);
      const key = `${chatId}:${member.id}`;
      if (state.groupModerationLists?.[chatId]?.banned?.[String(member.id)]) {
        const reban = await this.#telegram(state, "banChatMember", { chat_id: message.chat.id, user_id: Number(member.id), revoke_messages: true }, { bypassLocalRate: true });
        console.log(JSON.stringify({ event: "persistent_group_ban_reapplied", chatId, userId: String(member.id), ok: Boolean(reban.ok) }));
        continue;
      }
      if (captchaRequired && !state.pendingVerifications[key]) {
        const canRestrict = await this.#botPermission(state, chatId, "can_restrict_members");
        if (canRestrict !== true) {
          await this.#securityAlert(state, {
            chatId, chatTitle: message.chat.title || chatId, kind: "captcha_permission_missing",
            reason: "A new member required review, but the bot restriction permission could not be verified.", count: 1,
            userIds: [member.id], action: "No action taken; restrict_members permission was not verified.",
          });
        } else {
        const restrict = await this.#telegram(state, "restrictChatMember", {
          chat_id: message.chat.id,
          user_id: member.id,
          permissions: {
            can_send_messages: false, can_send_audios: false, can_send_documents: false,
            can_send_photos: false, can_send_videos: false, can_send_video_notes: false,
            can_send_voice_notes: false, can_send_polls: false, can_send_other_messages: false,
            can_add_web_page_previews: false,
          },
          until_date: Math.floor(now / 1_000) + clampNumber(captchaFeature.timeoutSeconds, 120, 30, 900),
          use_independent_chat_permissions: true,
        }, { bypassLocalRate: true });
        if (restrict.ok) {
          const nonce = Math.random().toString(36).slice(2, 10);
          state.pendingVerifications[key] = { userId: String(member.id), chatId, nonce, expiresAt: now + clampNumber(captchaFeature.timeoutSeconds, 120, 30, 900) * 1_000 };
          await this.#send(message.chat.id, `${userDisplay(member)}, press the confirmation button to enable messaging.`, state, {
            reply_markup: { inline_keyboard: [[button("✅ I am not a bot", `captcha:${chatId}:${member.id}:${nonce}`, "success")]] },
          }, { group: true });
        } else {
          await this.#securityAlert(state, {
            chatId, chatTitle: message.chat.title || chatId, kind: "captcha_action_failed",
            reason: "Telegram rejected the new-member restriction request.", count: 1,
            userIds: [member.id], action: `Restriction failed; ${asText(restrict.description || "Telegram error").slice(0, 90)}`,
          });
        }
        }
      }
      const welcomeKey = `${chatId}:${member.id}`;
      const inviteOnly = welcomeFeature.onlyViaInviteLink === true;
      const hasInviteSource = Boolean(joinContext.inviteLink || joinContext.viaChatFolderInviteLink || joinContext.viaJoinRequest);
      const alreadyQueued = (state.welcomeQueue || []).some((item) => String(item.chatId) === chatId && String(item.member?.id) === String(member.id));
      if (this.#featureEnabled(state, "welcome", chatId) && (!inviteOnly || hasInviteSource) && !state.welcomeDelivered[welcomeKey] && !alreadyQueued) {
        const groupSettings = state.groupSettings[chatId] ||= {};
        const delaySeconds = clampNumber(groupSettings.welcomeDelaySeconds ?? welcomeFeature.delaySeconds, 0, 0, 3_600);
        state.welcomeQueue ||= [];
        state.welcomeQueue.push({
          id: `${chatId}:${member.id}:${now}`,
          chatId: String(message.chat.id),
          chatTitle: message.chat.title || "Group",
          member: { id: String(member.id), first_name: member.first_name || "", last_name: member.last_name || "", username: member.username || "" },
          inviteLink: joinContext.inviteLink || "",
          dueAt: now + delaySeconds * 1_000,
          queuedAt: now,
        });
        state.welcomeQueue = state.welcomeQueue.slice(-2_000);
        console.log(JSON.stringify({ event: "welcome_message_queued", chatId, userId: String(member.id), delaySeconds, inviteSource: hasInviteSource }));
      }
    }
    await this.#save(state);
  }

  async #expireVerifications(state, now = Date.now()) {
    const expired = Object.entries(state.pendingVerifications || {}).filter(([, item]) => Number(item.expiresAt || 0) <= now);
    for (const [key, item] of expired.slice(0, 40)) {
      const [chatId, userId] = key.split(":");
      await this.#telegram(state, "banChatMember", { chat_id: chatId, user_id: Number(userId), until_date: Math.floor(now / 1_000) + 60 }, { bypassLocalRate: true });
      await this.#telegram(state, "unbanChatMember", { chat_id: chatId, user_id: Number(userId), only_if_banned: true }, { bypassLocalRate: true });
      delete state.pendingVerifications[key];
    }
    if (expired.length) await this.#save(state);
  }

  async #handleReport(state, message, reportText = "") {
    if (!this.#featureEnabled(state, "reports", message.chat?.id)) return false;
    const chat = message.chat || {};
    const reporter = message.from || {};
    const target = message.reply_to_message?.from;
    const record = {
      id: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`,
      chatId: String(chat.id), chatTitle: asText(chat.title || chat.id).slice(0, 120),
      reporterId: String(reporter.id || ""), reporterName: userDisplay(reporter).slice(0, 80),
      targetId: target?.id ? String(target.id) : null, targetName: target ? userDisplay(target).slice(0, 80) : null,
      messageId: message.reply_to_message?.message_id || message.message_id,
      text: asText(reportText || message.reply_to_message?.text || message.reply_to_message?.caption || "No text").slice(0, 600),
      createdAt: Date.now(),
    };
    state.reportQueue.push(record);
    state.reportQueue = state.reportQueue.slice(-100);
    await this.#save(state);
    if (this.#ownerId(state)) {
      await this.#send(this.#ownerId(state), `🚩 NEW REPORT\nGroup: ${record.chatTitle}\nGroup ID: ${record.chatId}\nReporter: ${record.reporterName} (${record.reporterId})\nTarget: ${record.targetName || "Not specified"}\nMessage ID: ${record.messageId}\nText: ${record.text}`, state);
    }
    await this.#reply(message, "✅ The report has been sent to the group administrators. Thank you.", state);
    return true;
  }

  async #recordSpam(state, message, db, operator = false) {
    const anti = db.features?.antiSpam || {};
    if (!this.#featureEnabled(state, "antiSpam", message.chat?.id) || !message.from?.id) return false;
    const userId = String(message.from.id);
    const chatId = String(message.chat.id);
    const protectedIds = [
      ...(db.roles?.protectedIds || []),
      ...(db.features?.moderation?.protectedIds || []),
    ].map(String);
    if ((anti.exemptIds || []).map(String).includes(userId)
      || protectedIds.includes(userId)
      || operator || this.#isOperator(userId, chatId, db, state)) return false;

    const now = Date.now();
    const spanMs = clampNumber(anti.windowSeconds, 10, 3, 120) * 1_000;
    const record = state.spam[`${chatId}:${userId}`] || { times: [], signatures: [], commands: [], links: [], strikes: 0 };
    record.times = (record.times || []).filter((time) => now - time <= spanMs).slice(-40);
    record.signatures = (record.signatures || []).filter((item) => now - item.at <= clampNumber(anti.duplicateWindowSeconds, 60, 10, 300) * 1_000).slice(-40);
    record.commands = (record.commands || []).filter((time) => now - time <= clampNumber(anti.commandWindowSeconds, 10, 3, 120) * 1_000).slice(-40);
    record.links = (record.links || []).filter((time) => now - time <= clampNumber(anti.linkWindowSeconds, 10, 3, 120) * 1_000).slice(-40);
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
    if (signature) record.signatures.push({ value: signature.slice(0, 300), at: now });

    const linkCount = (messageText.match(/(?:https?:\/\/|t\.me\/|www\.)/gi) || []).length;
    const mentionCount = (messageText.match(/@[A-Za-z][A-Za-z0-9_]{4,31}|tg:\/\/user\?id=/gi) || []).length;
    const command = /^\/[a-z0-9_]+(?:@\w+)?/i.test(messageText);
    if (linkCount) record.links.push(...Array(Math.min(10, linkCount)).fill(now));
    if (command) record.commands.push(now);

    record.times = record.times.slice(-40);
    record.signatures = record.signatures.slice(-40);
    record.links = record.links.slice(-40);
    record.commands = record.commands.slice(-40);
    const duplicateLimit = clampNumber(anti.duplicateLimit, 3, 2, 10);
    const duplicateCount = signature ? record.signatures.filter((item) => item.value === signature).length : 0;

    const activityWindow = clampNumber(anti.chatWindowSeconds, 5, 2, 60) * 1_000;
    const activity = (state.chatActivity[chatId] || []).filter((item) => now - Number(item.at || 0) <= activityWindow).slice(-250);
    activity.push({ at: now, userId, links: linkCount, mentions: mentionCount, command });
    state.chatActivity[chatId] = activity.slice(-250);

    const userRate = record.times.length >= clampNumber(anti.maxMessages, 7, 3, 30);
    const duplicate = Boolean(signature && duplicateCount >= duplicateLimit && anti.signals?.duplicateText !== false);
    const chatFlood = anti.signals?.chatFlood !== false && activity.length >= clampNumber(anti.chatMaxMessages, 35, 5, 250);
    const linkFlood = anti.signals?.linkFlood !== false && linkCount >= clampNumber(anti.maxLinksPerMessage, 4, 1, 20);
    const mentionFlood = anti.signals?.mentionFlood !== false && mentionCount >= clampNumber(anti.maxMentionsPerMessage, 8, 2, 50);
    const commandFlood = anti.signals?.commandFlood !== false && record.commands.length >= clampNumber(anti.maxCommandsPerWindow, 5, 2, 30);
    const reason = userRate ? `Sent ${record.times.length} messages by user ${userId} in ${anti.windowSeconds || 10} seconds`
      : duplicate ? `Repeated identical content ${duplicateCount} times by user ${userId}`
        : chatFlood ? `Message flood: ${activity.length} messages in ${anti.chatWindowSeconds || 5} seconds`
          : linkFlood ? `Links in one message: ${linkCount}`
            : mentionFlood ? `Mentions in one message: ${mentionCount}`
              : commandFlood ? `Sent ${record.commands.length} commands in ${anti.commandWindowSeconds || 10} seconds` : "";

    state.spam[`${chatId}:${userId}`] = record;
    const keys = Object.keys(state.spam);
    const maxTrackedUsers = clampNumber(anti.maxTrackedUsers || db.limits?.maxRememberedSpamUsers, 600, 100, 2_000);
    if (keys.length > maxTrackedUsers) {
      for (const oldKey of keys.slice(0, keys.length - Math.max(100, Math.floor(maxTrackedUsers * 0.75)))) delete state.spam[oldKey];
    }
    const chatKeys = Object.keys(state.chatActivity);
    if (chatKeys.length > 500) {
      for (const oldChat of chatKeys.slice(0, chatKeys.length - 400)) delete state.chatActivity[oldChat];
    }
    await this.#save(state);
    if (!reason) return false;

    record.strikes = Math.min(100, Number(record.strikes || 0) + 1);
    let action = "No action";
    const wantsDelete = anti.deleteFloodMessages !== false;
    const canDelete = wantsDelete ? await this.#botPermission(state, chatId, "can_delete_messages") : false;
    if (wantsDelete && canDelete === true) {
      const deleted = await this.#telegram(state, "deleteMessage", { chat_id: chatId, message_id: message.message_id }, { bypassLocalRate: true });
      action = deleted.ok ? "Message deleted" : "Message deletion failed; Telegram rejected the request";
    } else if (wantsDelete) {
      action = "Message was not deleted; delete permission was not verified";
    }

    let muted = false;
    if (anti.muteEnabled !== false) {
      const canRestrict = await this.#botPermission(state, chatId, "can_restrict_members");
      if (canRestrict === true) {
        const minutes = clampNumber(anti.muteMinutes, 10, 1, 1_440);
        const untilDate = Math.floor(now / 1_000) + minutes * 60;
        const result = await this.#telegram(state, "restrictChatMember", {
          chat_id: chatId, user_id: Number(userId),
          permissions: {
            can_send_messages: false, can_send_audios: false, can_send_documents: false,
            can_send_photos: false, can_send_videos: false, can_send_video_notes: false,
            can_send_voice_notes: false, can_send_polls: false, can_send_other_messages: false,
            can_add_web_page_previews: false,
          },
          until_date: untilDate, use_independent_chat_permissions: true,
        }, { bypassLocalRate: true });
        muted = result.ok;
        action += muted ? `; restriction of ${minutes} minutes applied` : "; Telegram rejected the restriction";
      } else {
        action += "; no restriction applied because restrict_members permission was not verified";
      }
    }

    await this.#securityAlert(state, {
      chatId, chatTitle: message.chat.title || chatId,
      kind: chatFlood ? "chat_flood" : duplicate ? "duplicate_spam" : linkFlood ? "link_flood" : mentionFlood ? "mention_flood" : commandFlood ? "command_flood" : "user_flood",
      reason, count: chatFlood ? activity.length : (duplicate ? duplicateCount : record.times.length),
      userIds: [userId], severity: record.strikes >= 3 ? 2 : 1, action,
    });
    record.times = [];
    record.signatures = [];
    record.links = [];
    record.commands = [];
    await this.#save(state);
    if (muted) {
      await this.#send(chatId, renderTemplate(this.#text(state, "moderation.muted", "🛡 {name} was restricted for {minutes} minutes due to spam behavior."), {
        name: userDisplay(message.from), minutes: clampNumber(anti.muteMinutes, 10, 1, 1_440),
      }), state, {}, { group: true });
    }
    return true;
  }

  #moderationStore(state, chatId) {
    const id = String(chatId);
    state.groupModerationLists ||= {};
    state.groupModerationLists[id] ||= { silent: {}, banned: {} };
    state.groupModerationLists[id].silent ||= {};
    state.groupModerationLists[id].banned ||= {};
    return state.groupModerationLists[id];
  }

  async #resolveCommandTarget(state, message, argumentText) {
    const chatId = String(message.chat?.id || "");
    const text = asText(argumentText);
    const entities = [...(message.entities || []), ...(message.caption_entities || [])];
    const textMention = entities.find((entity) => entity.type === "text_mention" && entity.user?.id);
    if (textMention?.user) return { user: textMention.user, source: "text_mention" };
    const numeric = text.match(/(?:^|\s)(\d{1,20})(?:$|\s)/);
    if (numeric) return { user: { id: Number(numeric[1]), first_name: numeric[1] }, source: "numeric_id" };
    const usernameMatch = text.match(/@([A-Za-z][A-Za-z0-9_]{4,31})/);
    if (usernameMatch) {
      const username = usernameMatch[1].toLowerCase();
      const known = (state.knownMembers?.[chatId] || []).find((item) => String(item.username || "").toLowerCase() === username);
      if (known) return { user: { id: Number(known.id), first_name: known.firstName || username, last_name: known.lastName || "", username: known.username }, source: "known_username" };
      return { user: null, error: "این یوزرنیم هنوز در پیام‌های گروه توسط ربات شناسایی نشده است. برای این کاربر ریپلای کنید، از منشن مستقیم تلگرام استفاده کنید یا آیدی عددی را بدهید." };
    }
    const replyUser = message.reply_to_message?.from;
    if (replyUser?.id) return { user: replyUser, source: "reply" };
    return { user: null, error: "کاربر هدف مشخص نیست. روی پیام او ریپلای کنید یا یوزرنیم، منشن یا آیدی عددی را وارد کنید." };
  }

  async #sendHelp(state, chatId, sectionId = "", commandId = "", messageId = null) {
    const db = this.#db(state) || {};
    const sections = Array.isArray(db.help?.sections) ? db.help.sections : [];
    const commands = new Map((db.commands || []).filter((item) => databaseCommandEnabled(item, db)).map((item) => [String(item.id), item]));
    let text = "";
    let keyboard = [];
    if (commandId) {
      const definition = commands.get(commandId);
      if (!definition) return this.#send(chatId, "این دستور در دیتابیس فعال نیست.", state, {}, { group: isGroup({ type: "group" }) });
      const aliases = (definition.aliases || []).map((alias) => `<code>${escapeHtml(alias)}</code>`).join("  •  ");
      const slash = (definition.slashCommands || []).map((name) => `<code>/${escapeHtml(name)}</code>`).join("  ");
      text = `<b>${escapeHtml(definition.title || definition.labelFa || definition.id)}</b>\n━━━━━━━━━━━━━━\n${escapeHtml(definition.descriptionFa || definition.description || "")}`;
      if (aliases) text += `\n\n<b>دستورات:</b>\n${aliases}`;
      if (slash) text += `\n\n<b>فرمان منو:</b>\n${slash}`;
      if (definition.usage) text += `\n\n<b>نحوه استفاده:</b>\n<code>${escapeHtml(definition.usage)}</code>`;
      if (definition.notes) text += `\n\n${escapeHtml(definition.notes)}`;
      const parent = String(definition.section || sectionId || "");
      keyboard = [[button("⬅️ بازگشت به بخش", `help:section:${parent}`, "primary"), button("🏠 راهنمای اصلی", "help:home", "success")]];
    } else if (sectionId) {
      const section = sections.find((item) => String(item.id) === sectionId);
      if (!section) return this.#send(chatId, "بخش موردنظر پیدا نشد.", state);
      text = `<b>${escapeHtml(section.title || "راهنما")}</b>\n━━━━━━━━━━━━━━\n${escapeHtml(section.description || "")}`;
      const rows = [];
      const renderedToggles = new Set();
      const groupChat = Number(chatId) < 0;
      for (const id of section.commands || []) {
        const item = commands.get(String(id));
        if (!item) continue;
        const featureId = String(item.toggleFeature || "");
        if (featureId && groupChat) {
          if (renderedToggles.has(featureId)) continue;
          renderedToggles.add(featureId);
          const enabled = this.#featureEnabled(state, featureId, chatId);
          rows.push(toggleButton(item.toggleLabel || item.title || item.labelFa || featureId, enabled, `help:toggle:${featureId}:${section.id}`));
          continue;
        }
        rows.push(button(String(item.buttonLabel || item.title || item.labelFa || item.id).slice(0, 60), `help:command:${item.id}:${section.id}`, item.color || "primary"));
      }
      for (let index = 0; index < rows.length; index += 2) keyboard.push(rows.slice(index, index + 2));
      keyboard.push([button("⬅️ بازگشت", "help:home", "success")]);
    } else {
      const activeSections = sections.filter((section) => (section.commands || []).some((id) => commands.has(String(id))));
      text = `<b>${escapeHtml(db.help?.title || "راهنمای مدیریت گروه")}</b>\n━━━━━━━━━━━━━━\n${escapeHtml(db.help?.intro || "برای مشاهده توضیحات هر بخش، دکمه مربوط را انتخاب کنید.")}\n\n<b>📌 راهنما کاملاً از دیتابیس ساخته می‌شود.</b>`;
      const rows = [];
      for (const section of activeSections) rows.push(button(section.buttonLabel || section.title, `help:section:${section.id}`, section.color || "primary"));
      for (let index = 0; index < rows.length; index += 2) keyboard.push(rows.slice(index, index + 2));
      const helpCommand = (db.commands || []).find((item) => item.id === "help");
      if (helpCommand) keyboard.push([button("🔄 بروزرسانی راهنما", "help:home", "success")]);
    }
    const extra = { reply_markup: { inline_keyboard: keyboard }, parse_mode: "HTML", link_preview_options: { is_disabled: true } };
    if (messageId) {
      return this.#telegram(state, "editMessageText", { chat_id: chatId, message_id: messageId, text: text.slice(0, 3_900), ...extra }, { bypassLocalRate: true });
    }
    return this.#send(chatId, text.slice(0, 3_900), state, extra, { group: true });
  }

  async #handleHelpCallback(state, callback) {
    const data = asText(callback.data);
    const chat = callback.message?.chat;
    const chatId = chat?.id;
    if (!chatId || !callback.message?.message_id) {
      await this.#answerCallback(callback.id);
      return;
    }
    if (data.startsWith("help:toggle:")) {
      const [, , featureId, sectionId] = data.split(":");
      const db = this.#db(state);
      const configured = (db?.commands || []).some((item) =>
        databaseCommandEnabled(item, db) && String(item.toggleFeature || "") === featureId);
      if (!isGroup(chat) || !configured || !getFeatureModule(featureId)) {
        await this.#answerCallback(callback.id, "این کلید در این گفتگو قابل استفاده نیست.");
        return;
      }
      const userId = String(callback.from?.id || "");
      const allowed = this.#isOwner(userId, state) || await this.#isTelegramAdmin(state, userId, chatId);
      if (!allowed) {
        await this.#answerCallback(callback.id, this.#text(state, "group.adminOnly", "⛔ این دکمه فقط برای مدیران گروه فعال است."));
        return;
      }
      if (!isModuleEnabled(db, featureId)) {
        await this.#answerCallback(callback.id, "این قابلیت در دیتابیس به‌صورت سراسری غیرفعال است.");
        return this.#sendHelp(state, chatId, sectionId || "", "", callback.message.message_id);
      }
      const current = this.#featureEnabled(state, featureId, chatId);
      const next = !current;
      state.groupModuleOverrides[String(chatId)] ||= {};
      state.groupModuleOverrides[String(chatId)][featureId] = next;
      await this.#save(state);
      await this.#answerCallback(callback.id, next ? "قابلیت فعال شد." : "قابلیت غیرفعال شد.");
      return this.#sendHelp(state, chatId, sectionId || "", "", callback.message.message_id);
    }
    await this.#answerCallback(callback.id);
    if (data === "help:home") return this.#sendHelp(state, chatId, "", "", callback.message.message_id);
    if (data.startsWith("help:section:")) return this.#sendHelp(state, chatId, data.slice("help:section:".length), "", callback.message.message_id);
    if (data.startsWith("help:command:")) {
      const parts = data.split(":");
      return this.#sendHelp(state, chatId, parts[3] || "", parts[2] || "", callback.message.message_id);
    }
  }

  async #handleProfileInfo(state, message, argumentText) {
    const resolved = await this.#resolveCommandTarget(state, message, argumentText);
    if (!resolved.user) {
      await this.#reply(message, `⚠️ ${escapeHtml(resolved.error)}`, state);
      return true;
    }
    const userId = Number(resolved.user.id);
    const [member, photos, audios, privateChat] = await Promise.all([
      this.#telegram(state, "getChatMember", { chat_id: message.chat.id, user_id: userId }, { bypassLocalRate: true }),
      this.#telegram(state, "getUserProfilePhotos", { user_id: userId, offset: 0, limit: 1 }, { bypassLocalRate: true }),
      this.#telegram(state, "getUserProfileAudios", { user_id: userId, offset: 0, limit: 1 }, { bypassLocalRate: true }),
      this.#telegram(state, "getChat", { chat_id: userId }, { bypassLocalRate: true }),
    ]);
    const user = member.ok ? member.result?.user || resolved.user : resolved.user;
    const privateInfo = privateChat.ok ? privateChat.result || {} : {};
    const photoCount = Number(photos.ok ? photos.result?.total_count || 0 : 0);
    const audioCount = Number(audios.ok ? audios.result?.total_count || 0 : 0);
    const status = member.ok ? String(member.result?.status || "unknown") : "در دسترس نیست";
    const statusFa = ({ creator: "مالک گروه", administrator: "مدیر", member: "عضو", restricted: "محدودشده", left: "خارج از گروه", kicked: "مسدود" })[status] || status;
    const fullName = [user.first_name, user.last_name].filter(Boolean).join(" ") || String(userId);
    const bio = asText(privateInfo.bio).slice(0, 500);
    const personalChat = privateInfo.personal_chat && typeof privateInfo.personal_chat === "object" ? privateInfo.personal_chat : null;
    const personalChatName = personalChat
      ? [personalChat.title, personalChat.username ? `@${personalChat.username}` : ""].filter(Boolean).join(" · ") || String(personalChat.id || "")
      : "در دسترس نیست";
    const premium = user.is_premium === true ? "فعال" : user.is_premium === false ? "غیرفعال" : "نامشخص";
    const text = [
      "<b>👤 اطلاعات کاربر</b>", "━━━━━━━━━━━━━━",
      `<b>نام:</b> ${escapeHtml(fullName)}`,
      `<b>یوزرنیم:</b> ${user.username ? `@${escapeHtml(user.username)}` : "ندارد"}`,
      `<b>آیدی عددی:</b> <code>${userId}</code>`,
      `<b>وضعیت در گروه:</b> ${escapeHtml(statusFa)}`,
      `<b>تلگرام پرمیوم:</b> ${premium}`,
      `<b>تعداد عکس‌های پروفایل:</b> ${photoCount}`,
      `<b>تعداد صداهای پروفایل:</b> ${audios.ok ? audioCount : "در دسترس نیست"}`,
      `<b>بیو:</b> ${bio ? escapeHtml(bio) : "در چت خصوصی قابل‌دسترسی نیست"}`,
      `<b>کانال شخصی:</b> ${escapeHtml(personalChatName)}`,
    ].join("\n");
    const latestPhoto = photos.ok && photos.result?.photos?.[0]?.length ? photos.result.photos[0].at(-1)?.file_id : "";
    const buttons = [{ text: "🔎 مشاهده پروفایل", url: `tg://user?id=${userId}`, style: "primary" }];
    if (personalChat?.username) buttons.push({ text: "📣 کانال شخصی", url: `https://t.me/${encodeURIComponent(personalChat.username)}`, style: "success" });
    const keyboard = { inline_keyboard: [buttons] };
    if (latestPhoto) {
      const sent = await this.#telegram(state, "sendPhoto", { chat_id: message.chat.id, photo: latestPhoto, caption: text.slice(0, 1_000), parse_mode: "HTML", reply_markup: keyboard }, { group: true });
      if (!sent.ok) await this.#reply(message, text, state);
    } else {
      await this.#send(message.chat.id, text, state, { reply_markup: keyboard }, { group: true });
    }
    return true;
  }

  async #handleModerationCommand(state, message, definition, argumentText) {
    const chatId = String(message.chat.id);
    const handler = String(definition.handler);
    const store = this.#moderationStore(state, chatId);
    const kind = handler.includes("silent") || handler === "moderation.silence" || handler === "moderation.unsilence" ? "silent" : "banned";
    const isList = handler.endsWith("_list") && !handler.startsWith("moderation.clean_");
    const isClean = handler.startsWith("moderation.clean_");
    const label = kind === "silent" ? "فهرست سکوت" : "فهرست بن";
    if (isList) {
      const entries = Object.values(store[kind]).sort((a, b) => Number(b.addedAt || 0) - Number(a.addedAt || 0));
      const displayLimit = 24;
      const lines = entries.slice(0, displayLimit).map((item, index) => {
        const displayName = String(item.name || item.username || item.id).slice(0, 28);
        return `${index + 1}. <a href="tg://user?id=${Number(item.id)}">${escapeHtml(displayName)}</a> <code>${escapeHtml(item.id)}</code>`;
      });
      const body = `<b>${kind === "silent" ? "🔇" : "⛔"} ${label}</b>\n━━━━━━━━━━━━━━\nتعداد: <b>${entries.length}</b>\n\n${lines.length ? lines.join("\n") : "<i>این فهرست خالی است.</i>"}${entries.length > displayLimit ? `\n\n<i>${displayLimit} مورد از ${entries.length} مورد نمایش داده شد.</i>` : ""}`;
      await this.#reply(message, body, state);
      return true;
    }
    if (isClean) {
      const entries = Object.values(store[kind]);
      if (!entries.length) {
        await this.#reply(message, `✅ ${label} از قبل خالی است.`, state);
        return true;
      }
      let success = 0;
      let failed = 0;
      for (const item of entries) {
        const userId = Number(item.id);
        const result = kind === "silent"
          ? await this.#telegram(state, "restrictChatMember", { chat_id: Number(chatId), user_id: userId, permissions: { can_send_messages: true, can_send_audios: true, can_send_documents: true, can_send_photos: true, can_send_videos: true, can_send_video_notes: true, can_send_voice_notes: true, can_send_polls: true, can_send_other_messages: true, can_add_web_page_previews: true }, use_independent_chat_permissions: true }, { bypassLocalRate: true })
          : await this.#telegram(state, "unbanChatMember", { chat_id: Number(chatId), user_id: userId, only_if_banned: true }, { bypassLocalRate: true });
        if (result.ok) { delete store[kind][String(userId)]; success += 1; }
        else failed += 1;
        if ((success + failed) % 12 === 0) await sleep(120);
      }
      await this.#save(state);
      await this.#reply(message, `<b>🧹 پاکسازی انجام شد.</b>\nفهرست: ${label}\nموفق: <b>${success}</b>\nناموفق: <b>${failed}</b>`, state);
      return true;
    }

    const resolved = await this.#resolveCommandTarget(state, message, argumentText);
    if (!resolved.user?.id) {
      await this.#reply(message, `⚠️ ${escapeHtml(resolved.error || "کاربر هدف مشخص نیست.")}`, state);
      return true;
    }
    const target = resolved.user;
    const userId = Number(target.id);
    if (!Number.isSafeInteger(userId) || userId <= 0 || target.is_bot || this.#isOwner(userId, state)
      || (this.#db(state)?.roles?.protectedIds || []).map(String).includes(String(userId))) {
      await this.#reply(message, "⛔ این کاربر در فهرست محافظت‌شده قرار دارد یا هدف معتبر نیست.", state);
      return true;
    }
    const targetMember = await this.#telegram(state, "getChatMember", { chat_id: Number(chatId), user_id: userId }, { bypassLocalRate: true });
    if (targetMember.ok && ["creator", "administrator"].includes(targetMember.result?.status)) {
      await this.#reply(message, "⛔ امکان مدیریت مالک یا مدیران گروه وجود ندارد.", state);
      return true;
    }
    const required = await this.#botPermission(state, Number(chatId), "can_restrict_members");
    if (required !== true) {
      await this.#reply(message, "⛔ ربات باید در گروه مدیر باشد و دسترسی Restrict Members داشته باشد.", state);
      return true;
    }

    let result;
    if (handler === "moderation.silence") {
      if (!targetMember.ok || !["member", "restricted"].includes(targetMember.result?.status)) {
        await this.#reply(message, "⚠️ برای سکوت، کاربر باید عضو فعلی گروه باشد.", state);
        return true;
      }
      result = await this.#telegram(state, "restrictChatMember", {
        chat_id: Number(chatId), user_id: userId,
        permissions: { can_send_messages: false, can_send_audios: false, can_send_documents: false, can_send_photos: false, can_send_videos: false, can_send_video_notes: false, can_send_voice_notes: false, can_send_polls: false, can_send_other_messages: false, can_add_web_page_previews: false },
        use_independent_chat_permissions: true,
      }, { bypassLocalRate: true });
      if (result.ok) store.silent[String(userId)] = { id: String(userId), name: [target.first_name, target.last_name].filter(Boolean).join(" ") || String(userId), username: target.username || "", addedAt: Date.now(), by: String(message.from?.id || "") };
    } else if (handler === "moderation.unsilence") {
      result = await this.#telegram(state, "restrictChatMember", {
        chat_id: Number(chatId), user_id: userId,
        permissions: { can_send_messages: true, can_send_audios: true, can_send_documents: true, can_send_photos: true, can_send_videos: true, can_send_video_notes: true, can_send_voice_notes: true, can_send_polls: true, can_send_other_messages: true, can_add_web_page_previews: true },
        use_independent_chat_permissions: true,
      }, { bypassLocalRate: true });
      if (result.ok) delete store.silent[String(userId)];
    } else if (handler === "moderation.ban") {
      result = await this.#telegram(state, "banChatMember", { chat_id: Number(chatId), user_id: userId, revoke_messages: true }, { bypassLocalRate: true });
      if (result.ok) store.banned[String(userId)] = { id: String(userId), name: [target.first_name, target.last_name].filter(Boolean).join(" ") || String(userId), username: target.username || "", addedAt: Date.now(), by: String(message.from?.id || "") };
    } else if (handler === "moderation.unban") {
      result = await this.#telegram(state, "unbanChatMember", { chat_id: Number(chatId), user_id: userId, only_if_banned: true }, { bypassLocalRate: true });
      if (result.ok) delete store.banned[String(userId)];
    } else return false;

    await this.#save(state);
    const actionText = handler === "moderation.silence" ? "سکوت شد" : handler === "moderation.unsilence" ? "از سکوت خارج شد" : handler === "moderation.ban" ? "بن شد" : "از بن خارج شد";
    await this.#reply(message, result?.ok
      ? `✅ <b>${escapeHtml(target.first_name || target.username || userId)}</b> ${actionText}.`
      : `❌ عملیات انجام نشد.\n<code>${escapeHtml(result?.description || "Telegram API error")}</code>`, state);
    return true;
  }

  async #handleWelcomeCommand(state, message, definition, argumentText) {
    const chatId = String(message.chat.id);
    const handler = String(definition.handler);
    const globalEnabled = isModuleEnabled(this.#db(state), "welcome");
    if (!globalEnabled) {
      await this.#reply(message, "⛔ قابلیت خوش‌آمدگویی در دیتابیس غیرفعال است.", state);
      return true;
    }
    const settings = state.groupSettings[chatId] ||= {};
    if (handler === "welcome.on" || handler === "welcome.off") {
      state.groupModuleOverrides[chatId] ||= {};
      state.groupModuleOverrides[chatId].welcome = handler === "welcome.on";
      await this.#save(state);
      await this.#reply(message, handler === "welcome.on" ? "🟢 <b>خوش‌آمدگویی فعال شد.</b>" : "🔴 <b>خوش‌آمدگویی غیرفعال شد.</b>", state);
    } else if (handler === "welcome.set") {
      const value = asText(argumentText || message.reply_to_message?.text || message.reply_to_message?.caption);
      if (!value) {
        await this.#reply(message, "✍️ متن جدید را بعد از دستور تنظیم خوشامد بنویسید یا روی متن موردنظر ریپلای کنید.", state);
        return true;
      }
      settings.welcomeText = value.slice(0, 3_500);
      await this.#save(state);
      await this.#reply(message, "✅ متن خوش‌آمدگویی این گروه ذخیره شد.", state);
    } else if (handler === "welcome.get") {
      const value = settings.welcomeText || this.#db(state).features.welcome.text || this.#text(state, "welcome", "سلام !mention به گروه !groupname خوش آمدی!");
      const media = settings.welcomeMedia ? `\n🖼 رسانه: <b>${escapeHtml(settings.welcomeMedia.type)}</b>` : "\n🖼 رسانه: <i>تنظیم نشده</i>";
      await this.#reply(message, `<b>متن خوش‌آمد فعلی:</b>\n${escapeHtml(value)}${media}\n⏱ زمان تأخیر: ${Number(settings.welcomeDelaySeconds || 0)} ثانیه`, state);
    } else if (handler === "welcome.reset") {
      delete settings.welcomeText;
      delete settings.welcomeMedia;
      delete settings.welcomeDelaySeconds;
      await this.#save(state);
      await this.#reply(message, "✅ تنظیمات خوش‌آمدگویی به مقادیر پیش‌فرض دیتابیس بازگشت.", state);
    } else if (handler === "welcome.set_time") {
      const normalizedDigits = asText(argumentText)
        .replace(/[۰-۹]/g, (digit) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(digit)))
        .replace(/[٠-٩]/g, (digit) => String("٠١٢٣٤٥٦٧٨٩".indexOf(digit)));
      const seconds = Number(normalizedDigits.match(/\d{1,4}/)?.[0]);
      if (!Number.isInteger(seconds) || seconds < 0 || seconds > 3_600) {
        await this.#reply(message, "⚠️ زمان را به ثانیه و بین ۰ تا ۳۶۰۰ وارد کنید. نمونه: تنظیم زمان خوشامد 30", state);
        return true;
      }
      settings.welcomeDelaySeconds = seconds;
      await this.#save(state);
      await this.#reply(message, `✅ زمان خوش‌آمدگویی روی <b>${seconds}</b> ثانیه تنظیم شد.`, state);
    } else if (handler === "welcome.set_media") {
      const source = message.reply_to_message || message;
      const media = getWelcomeMediaFromMessage(source);
      if (!media?.fileId) {
        await this.#reply(message, "⚠️ دستور را روی عکس، ویدئو، آهنگ، ویس، گیف، استیکر یا ویدئوی سلفی ریپلای کنید؛ یا دستور را به‌عنوان کپشن همان رسانه بفرستید.", state);
        return true;
      }
      settings.welcomeMedia = media;
      await this.#save(state);
      await this.#reply(message, `✅ رسانه خوش‌آمدگویی ذخیره شد: <b>${escapeHtml(media.type)}</b>`, state);
    }
    return true;
  }

  async #handleGoodbyeCommand(state, message, definition, argumentText) {
    const chatId = String(message.chat.id);
    const handler = String(definition.handler);
    if (!isModuleEnabled(this.#db(state), "goodbye")) {
      await this.#reply(message, "⛔ قابلیت پیام خداحافظی در دیتابیس غیرفعال است.", state);
      return true;
    }
    const settings = state.groupSettings[chatId] ||= {};
    if (handler === "goodbye.on" || handler === "goodbye.off") {
      state.groupModuleOverrides[chatId] ||= {};
      state.groupModuleOverrides[chatId].goodbye = handler === "goodbye.on";
      await this.#save(state);
      await this.#reply(message, handler === "goodbye.on" ? "🟢 <b>پیام خداحافظی فعال شد.</b>" : "🔴 <b>پیام خداحافظی غیرفعال شد.</b>", state);
    } else if (handler === "goodbye.set") {
      const value = asText(argumentText || message.reply_to_message?.text || message.reply_to_message?.caption);
      if (!value) {
        await this.#reply(message, "✍️ متن جدید را بعد از دستور تنظیم خداحافظی بنویسید یا روی متن موردنظر ریپلای کنید.", state);
        return true;
      }
      settings.goodbyeText = value.slice(0, 3_500);
      await this.#save(state);
      await this.#reply(message, "✅ متن خداحافظی این گروه ذخیره شد.", state);
    } else if (handler === "goodbye.get") {
      const value = settings.goodbyeText || this.#db(state).features.goodbye.text || "👋 خداحافظ !mention";
      const media = settings.goodbyeMedia ? `\n🖼 رسانه: <b>${escapeHtml(settings.goodbyeMedia.type)}</b>` : "\n🖼 رسانه: <i>تنظیم نشده</i>";
      await this.#reply(message, `<b>متن خداحافظی فعلی:</b>\n${escapeHtml(value)}${media}`, state);
    } else if (handler === "goodbye.reset") {
      delete settings.goodbyeText;
      delete settings.goodbyeMedia;
      await this.#save(state);
      await this.#reply(message, "✅ تنظیمات خداحافظی به مقادیر پیش‌فرض دیتابیس بازگشت.", state);
    } else if (handler === "goodbye.set_media") {
      const source = message.reply_to_message || message;
      const media = getWelcomeMediaFromMessage(source);
      if (!media?.fileId) {
        await this.#reply(message, "⚠️ دستور را روی عکس، ویدئو، آهنگ، ویس، گیف، استیکر یا ویدئوی سلفی ریپلای کنید؛ یا دستور را به‌عنوان کپشن همان رسانه بفرستید.", state);
        return true;
      }
      settings.goodbyeMedia = media;
      await this.#save(state);
      await this.#reply(message, `✅ رسانه خداحافظی ذخیره شد: <b>${escapeHtml(media.type)}</b>`, state);
    }
    return true;
  }

  #databaseCommandPolicy(definition, db) {
    const explicit = definition.access && typeof definition.access === "object" ? definition.access : {};
    if (explicit.policy) {
      const referenced = db?.authorization?.[String(explicit.policy)] || {};
      return { ...referenced, ...explicit, policy: undefined };
    }
    if (Object.keys(explicit).length) return explicit;
    const handler = String(definition.handler || "");
    const groupAdmin = db?.authorization?.groupAdminCommands || {};
    const member = db?.authorization?.memberCommands || {};
    const prefixes = Array.isArray(groupAdmin.handlerPrefixes) ? groupAdmin.handlerPrefixes : ["moderation.", "welcome.", "goodbye."];
    if (prefixes.some((prefix) => handler.startsWith(String(prefix)))) {
      return {
        scope: groupAdmin.scope || "group_or_supergroup",
        requiredRole: groupAdmin.requiredRole || "creator_or_administrator",
        verification: groupAdmin.verification || "telegram_live_membership",
        botOwnerBypass: groupAdmin.botOwnerBypass === true,
        denialText: groupAdmin.denialText || "group.adminOnly",
      };
    }
    const handlers = Array.isArray(member.handlers) ? member.handlers : ["help", "profile.info"];
    if (!handler || handlers.includes(handler) || Array.isArray(definition.actions)) {
      return { scope: member.scope || "group_or_supergroup", requiredRole: member.requiredRole || "member" };
    }
    return { scope: "group_or_supergroup", requiredRole: "member" };
  }

  async #authorizeDatabaseCommand(state, message, definition, db) {
    const policy = this.#databaseCommandPolicy(definition, db);
    const chat = message.chat || {};
    const actorId = String(message.from?.id || "");
    const scope = String(policy.scope || "group_or_supergroup");
    if (scope === "private" && !isPrivate(chat)) return { allowed: false, reason: "scope" };
    if (scope === "group_or_supergroup" && !isGroup(chat)) return { allowed: false, reason: "scope" };
    if (!actorId) return { allowed: false, reason: "actor" };

    const role = String(policy.requiredRole || "member");
    if (role === "any") return { allowed: true, policy };
    if (role === "owner") return { allowed: this.#isOwner(actorId, state) && isPrivate(chat), policy };
    if (role === "member") return { allowed: isGroup(chat) && !message.from?.is_bot, policy };
    if (role === "creator_or_administrator" || role === "administrator" || role === "creator") {
      if (!isGroup(chat)) return { allowed: false, reason: "scope", policy };
      if (policy.botOwnerBypass === true && this.#isOwner(actorId, state)) return { allowed: true, policy };
      if (policy.verification === "none") {
        const cachedRole = db?.roles?.adminsByChat?.[String(chat.id)] || [];
        return { allowed: cachedRole.map(String).includes(actorId), policy };
      }
      const member = await this.#telegram(state, "getChatMember", { chat_id: chat.id, user_id: Number(actorId) }, { bypassLocalRate: true, noCache: true });
      const status = String(member?.result?.status || "");
      const allowed = role === "creator" ? status === "creator"
        : role === "administrator" ? ["creator", "administrator"].includes(status)
          : ["creator", "administrator"].includes(status);
      return { allowed: Boolean(member.ok && allowed), reason: "role", policy };
    }
    return { allowed: false, reason: "unsupported_role", policy };
  }

  #resolveActionValue(value, context) {
    if (typeof value === "string") {
      const exact = value.match(/^\{\{([a-zA-Z0-9_.]+)\}\}$/);
      if (exact) return getPath(context, exact[1], "");
      return value.replace(/\{\{([a-zA-Z0-9_.]+)\}\}/g, (_match, path) => {
        const resolved = getPath(context, path, "");
        return resolved == null ? "" : String(resolved);
      });
    }
    if (Array.isArray(value)) return value.map((item) => this.#resolveActionValue(item, context));
    if (value && typeof value === "object") {
      return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, this.#resolveActionValue(item, context)]));
    }
    return value;
  }

  async #executeDatabaseActions(state, message, definition, argumentText, extraContext = {}) {
    const actions = Array.isArray(definition.actions) ? definition.actions : [];
    const db = this.#db(state) || {};
    const maxActions = clampNumber(db.runtime?.commandEngine?.maxActionsPerCommand, 12, 1, 25);
    const context = {
      user: message.from || {},
      chat: message.chat || {},
      message: { id: message.message_id, text: message.text || message.caption || "" },
      reply: {
        id: message.reply_to_message?.message_id || null,
        text: message.reply_to_message?.text || "",
        caption: message.reply_to_message?.caption || "",
        from: message.reply_to_message?.from || {},
      },
      args: String(argumentText || "").trim().split(/\s+/).filter(Boolean),
      argsText: String(argumentText || ""),
      owner: { id: this.#ownerId(state) },
      callback: extraContext.callback ? {
        id: extraContext.callback.id || "",
        data: extraContext.callback.data || "",
        args: Array.isArray(extraContext.callback.args) ? extraContext.callback.args : [],
        messageId: extraContext.callback.messageId || null,
      } : null,
      target: extraContext.target || null,
      result: null,
    };
    for (const action of actions.slice(0, maxActions)) {
      const when = action.when;
      if (when && typeof when === "object") {
        const actual = getPath(context, String(when.path || ""), null);
        if (Object.hasOwn(when, "equals") && String(actual) !== String(when.equals)) continue;
        if (Object.hasOwn(when, "notEquals") && String(actual) === String(when.notEquals)) continue;
        if (when.truthy === true && !actual) continue;
        if (when.truthy === false && actual) continue;
      }
      const type = String(action.type || "");
      const renderedText = String(this.#resolveActionValue(action.text || "", context) || "");
      if (type === "reply") {
        if (renderedText) await this.#reply(message, renderedText, state);
      } else if (type === "send_message") {
        const chatId = this.#resolveActionValue(action.chatId ?? "{{chat.id}}", context);
        const payload = action.options && typeof action.options === "object" ? this.#resolveActionValue(action.options, context) : {};
        if (renderedText) await this.#send(chatId, renderedText, state, payload, { group: isGroup(message.chat) });
      } else if (type === "telegram") {
        const method = String(action.method || "");
        if (!/^[A-Za-z][A-Za-z0-9]{1,63}$/.test(method) || ["setWebhook", "deleteWebhook", "getUpdates", "logOut", "close"].includes(method)) {
          throw new Error("database_action_telegram_method_rejected");
        }
        const payload = this.#resolveActionValue(action.payload || {}, context);
        if (payload.chat_id == null && ["sendMessage", "sendPhoto", "sendVideo", "sendDocument", "sendAudio", "sendVoice", "sendAnimation", "sendSticker", "copyMessage", "forwardMessage", "banChatMember", "unbanChatMember", "restrictChatMember", "promoteChatMember", "pinChatMessage", "deleteMessage", "getChat", "getChatMember", "getChatAdministrators", "getChatMemberCount"].includes(method)) {
          payload.chat_id = message.chat.id;
        }
        context.result = await this.#telegram(state, method, payload, { group: isGroup(message.chat) });
      } else if (type === "toggle_feature") {
        const feature = String(action.feature || "");
        if (!getFeatureModule(feature) || !isGroup(message.chat)) throw new Error("database_action_feature_invalid");
        const next = typeof action.enabled === "boolean" ? action.enabled : !this.#featureEnabled(state, feature, message.chat.id);
        state.groupModuleOverrides[String(message.chat.id)] ||= {};
        state.groupModuleOverrides[String(message.chat.id)][feature] = next;
        await this.#save(state);
        if (action.text) await this.#reply(message, renderedText || `${feature}: ${next ? "ON" : "OFF"}`, state);
      } else if (type === "set_group_setting" || type === "delete_group_setting") {
        const key = String(action.key || "");
        if (!isGroup(message.chat) || !/^[a-zA-Z][a-zA-Z0-9_]{0,47}$/.test(key)) throw new Error("database_action_group_setting_invalid");
        state.groupSettings[String(message.chat.id)] ||= {};
        if (type === "delete_group_setting") delete state.groupSettings[String(message.chat.id)][key];
        else state.groupSettings[String(message.chat.id)][key] = this.#resolveActionValue(action.value, context);
        await this.#save(state);
        if (action.text) await this.#reply(message, renderedText, state);
      } else if (type === "target_policy_set") {
        if (!isPrivate(message.chat) || !this.#isOwner(message.from?.id, state)) throw new Error("database_action_owner_required");
        const targetId = String(this.#resolveActionValue(action.targetId ?? "{{callback.args.0}}", context) || "");
        const key = String(action.key || "");
        if (!isTelegramId(targetId) || !this.#targetRecord(state, targetId)
          || !/^[A-Za-z][A-Za-z0-9_]{0,47}$/.test(key) || ["__proto__", "prototype", "constructor", "updatedAt", "updatedBy"].includes(key)) {
          throw new Error("database_action_target_policy_invalid");
        }
        state.targetPolicies ||= {};
        state.targetPolicies[targetId] ||= {};
        state.targetPolicies[targetId][key] = this.#resolveActionValue(action.value, context);
        state.targetPolicies[targetId].updatedAt = Date.now();
        state.targetPolicies[targetId].updatedBy = String(message.from.id);
        context.result = { targetId, key, value: state.targetPolicies[targetId][key] };
        await this.#save(state);
        if (action.text) await this.#reply(message, this.#resolveActionValue(action.text, context), state);
      } else if (type === "owner_panel_show") {
        if (!isPrivate(message.chat) || !this.#isOwner(message.from?.id, state)) throw new Error("database_action_owner_required");
        const view = String(this.#resolveActionValue(action.view || "home", context) || "home");
        const targetId = String(this.#resolveActionValue(action.targetId || "", context) || "");
        const page = Number(this.#resolveActionValue(action.page ?? 0, context)) || 0;
        const note = String(this.#resolveActionValue(action.note || "", context) || "");
        const messageId = extraContext.callback?.messageId || null;
        await this.#sendOwnerPanel(state, message.chat.id, view, targetId, page, messageId, note);
      } else if (type === "resource_set") {
        const key = String(this.#resolveActionValue(action.key, context) || "");
        const value = this.#resolveActionValue(action.value, context);
        const stored = await this.#resourcePut(state, String(action.resource || ""), key, value, action.ttlSeconds);
        context.result = { stored };
        if (action.text) await this.#reply(message, this.#resolveActionValue(action.text, context), state);
      } else if (type === "resource_get") {
        const key = String(this.#resolveActionValue(action.key, context) || "");
        context.result = { value: await this.#resourceGet(state, String(action.resource || ""), key) };
        if (action.text) await this.#reply(message, this.#resolveActionValue(action.text, context), state);
      }
    }
    await this.#save(state);
    return true;
  }

  #ownerPanelConfig(state) {
    return this.#db(state)?.ownerPanel || {};
  }

  #targetType(state, chatId) {
    if (state.groups?.[String(chatId)]) return "group";
    if ((state.channels || []).some((item) => String(item.id) === String(chatId))) return "channel";
    return "";
  }

  #targetRecord(state, chatId) {
    const id = String(chatId);
    if (state.groups?.[id]) return { ...state.groups[id], targetType: "group" };
    const channel = (state.channels || []).find((item) => String(item.id) === id);
    return channel ? { ...channel, targetType: "channel" } : null;
  }

  #targetUsageSnapshot(state, chatId) {
    const month = new Date().toISOString().slice(0, 7);
    const usage = state.targetUsage?.[String(chatId)];
    return usage?.month === month ? { month, used: Math.max(0, Number(usage.used || 0)) } : { month, used: 0 };
  }

  #targetQuotaSnapshot(state, chatId) {
    const db = this.#db(state) || {};
    const broadcast = db.ownerBroadcast || {};
    const policy = state.targetPolicies?.[String(chatId)] || {};
    const tier = String(policy.tier || broadcast.defaultTier || "FREE").toUpperCase();
    const tierQuota = Number(broadcast.monthlyQuotaByTier?.[tier] ?? db.limits?.chatTiers?.[tier]?.monthlyBroadcasts ?? 1_000);
    const quota = policy.monthlyQuotaOverride == null ? tierQuota : Number(policy.monthlyQuotaOverride);
    const usage = this.#targetUsageSnapshot(state, chatId);
    const remaining = quota < 0 ? -1 : Math.max(0, quota - usage.used);
    const active = policy.active == null ? broadcast.defaultActive !== false : policy.active !== false;
    return { tier, quota, used: usage.used, remaining, month: usage.month, active };
  }

  async #sendOwnerPanel(state, chatId, view = "home", targetId = "", page = 0, messageId = null, note = "") {
    const db = this.#db(state) || {};
    const config = this.#ownerPanelConfig(state);
    const ui = config.buttons || {};
    const uiText = (key, fallback) => String(ui[key] || fallback);
    const quotaLabel = (quota) => Number(quota) < 0 ? String(config.labels?.unlimited || "نامحدود") : Number(quota).toLocaleString("fa-IR");
    let text = "";
    let keyboard = [];
    if (view === "target") {
      const record = this.#targetRecord(state, targetId);
      if (!record) return this.#sendOwnerPanel(state, chatId, "home", "", 0, messageId, "مقصد پیدا نشد.");
      const policy = state.targetPolicies?.[String(targetId)] || {};
      const quota = this.#targetQuotaSnapshot(state, targetId);
      const active = quota.active && !state.blockedGroups.includes(String(targetId)) && !state.leftGroups.includes(String(targetId))
        && !["left", "kicked"].includes(String(record.botStatus || "").toLowerCase());
      const permissions = record.rights || record.permissions || {};
      const permissionLines = Object.entries(permissions).map(([key, value]) => `• ${escapeHtml(key)}: ${value === true ? "✅" : value === false ? "❌" : "نامشخص"}`).join("\n");
      let link = record.link || record.inviteLink || "";
      if (!link && this.#targetType(state, targetId) === "group") {
        const details = await this.#telegram(state, "getChat", { chat_id: Number(targetId) }, { bypassLocalRate: true, noCache: true });
        if (details.ok) {
          link = details.result?.invite_link || (details.result?.username ? `https://t.me/${details.result.username}` : "");
          if (link) {
            state.groups[String(targetId)].inviteLink = details.result?.invite_link || null;
            state.groups[String(targetId)].link = details.result?.username ? `https://t.me/${details.result.username}` : state.groups[String(targetId)].link;
            await this.#save(state);
          }
        }
      }
      const labels = config.labels || {};
      const label = (key, fallback) => escapeHtml(labels[key] || fallback || key);
      const valueMap = {
        title: escapeHtml(record.title || record.id),
        id: `<code>${escapeHtml(record.id)}</code>`,
        type: record.targetType === "channel" ? "کانال" : "گروه",
        link: link ? `<a href="${escapeHtml(link)}">باز کردن مقصد</a>` : label("noLink", "در دسترس نیست"),
        username: record.username ? `@${escapeHtml(record.username)}` : "ندارد",
        botStatus: escapeHtml(record.botStatus || "نامشخص"),
        sendStatus: active ? `🟢 ${label("active", "فعال")}` : `🔴 ${label("inactive", "غیرفعال")}`,
        plan: escapeHtml(quota.tier),
        monthlyLimit: quotaLabel(quota.quota),
        monthlyUsed: quotaLabel(quota.used),
        remaining: quota.remaining < 0 ? "نامحدود" : quotaLabel(quota.remaining),
        period: escapeHtml(quota.month),
        rights: permissionLines || "ثبت نشده",
        permissions: permissionLines || "ثبت نشده",
        lastMemberCount: record.lastMemberCount == null ? "نامشخص" : Number(record.lastMemberCount).toLocaleString("fa-IR"),
        lastSeenAt: record.lastSeenAt ? new Date(Number(record.lastSeenAt)).toLocaleString("fa-IR", { timeZone: "Asia/Tehran" }) : "نامشخص",
        inviteLink: record.inviteLink ? `<a href="${escapeHtml(record.inviteLink)}">باز کردن لینک دعوت</a>` : "ثبت نشده",
      };
      const defaultFields = ["type", "id", "link", "username", "botStatus", "sendStatus", "plan", "monthlyLimit", "monthlyUsed", "remaining", "period", "rights"];
      const fields = Array.isArray(config.detailsFields) ? config.detailsFields : defaultFields;
      const detailLines = fields.filter((field) => Object.hasOwn(valueMap, String(field))).map((field) =>
        `<b>${label(String(field), String(field))}:</b> ${valueMap[field]}`);
      text = [
        `<b>${escapeHtml(record.title || record.id)}</b>`,
        "━━━━━━━━━━━━━━",
        ...detailLines,
        note ? `\n${escapeHtml(note)}` : "",
      ].filter(Boolean).join("\n");
      const detailActions = Array.isArray(config.detailActions) ? config.detailActions : [];
      for (const action of detailActions) {
        const labelText = active ? (action.labelWhenActive || action.label) : (action.labelWhenInactive || action.label);
        const color = active ? (action.colorWhenActive || action.color || "primary") : (action.colorWhenInactive || action.color || "primary");
        const callbackData = `owneradmin:action:${action.id}:${targetId}`;
        keyboard.push([button(String(labelText).slice(0, 60), callbackData, color)]);
      }
      if (!detailActions.length) {
        keyboard.push([toggleButton("ارسال همگانی", active, `owneradmin:${active ? "deactivate" : "activate"}:${targetId}`)]);
        keyboard.push([button(uiText("setPlan", "تغییر پلن"), `owneradmin:plan:${targetId}`, "primary"), button(uiText("setQuota", "سقف دلخواه"), `owneradmin:quota:${targetId}`, "primary")]);
      }
      if (link) keyboard.push([{ text: "🔗 باز کردن مقصد", url: link }]);
      keyboard.push([button(uiText("backToList", "⬅️ بازگشت به فهرست"), `owneradmin:list:${record.targetType === "channel" ? "channels" : "groups"}:0`, "primary"), button(uiText("home", "🏠 خانه"), "owneradmin:home", "success")]);
    } else if (view === "list") {
      const viewConfig = (Array.isArray(config.views) ? config.views : []).find((item) => String(item.id) === String(targetId)) || {};
      const channelView = viewConfig.itemType === "channel" || targetId === "channels";
      const sourceValue = viewConfig.sourcePath ? getPath(state, String(viewConfig.sourcePath).replace(/^state\./, ""), null) : null;
      const source = Array.isArray(sourceValue) ? sourceValue : sourceValue && typeof sourceValue === "object" ? Object.values(sourceValue)
        : channelView ? state.channels || [] : Object.values(state.groups || {});
      const sorted = [...source].filter((item) => item && item.id != null).sort((a, b) => String(a.title || a.id).localeCompare(String(b.title || b.id)));
      const pageSize = clampNumber(config.pageSize, 8, 1, 12);
      const pageCount = Math.max(1, Math.ceil(sorted.length / pageSize));
      const currentPage = Math.max(0, Math.min(pageCount - 1, Number(page) || 0));
      const records = sorted.slice(currentPage * pageSize, (currentPage + 1) * pageSize);
      const viewTitle = viewConfig.title || (channelView ? "📣 کانال‌ها" : "👥 گروه‌ها");
      text = `<b>${escapeHtml(viewTitle)}</b>\n━━━━━━━━━━━━━━\nتعداد ثبت‌شده: <b>${sorted.length}</b>\nصفحه ${currentPage + 1} از ${pageCount}${note ? `\n\n${escapeHtml(note)}` : ""}`;
      for (const record of records) {
        const id = String(record.id);
        const quota = this.#targetQuotaSnapshot(state, id);
        const active = quota.active && !state.blockedGroups.includes(id) && !state.leftGroups.includes(id)
          && !["left", "kicked"].includes(String(record.botStatus || "").toLowerCase());
        keyboard.push([button(`${active ? "🟢" : "🔴"} ${String(record.title || id).slice(0, 42)}`, `owneradmin:target:${id}`, active ? "success" : "danger")]);
      }
      const nav = [];
      if (currentPage > 0) nav.push(button(uiText("previousPage", "⬅️ قبلی"), `owneradmin:list:${targetId}:${currentPage - 1}`, "primary"));
      if (currentPage + 1 < pageCount) nav.push(button(uiText("nextPage", "بعدی ➡️"), `owneradmin:list:${targetId}:${currentPage + 1}`, "primary"));
      if (nav.length) keyboard.push(nav);
      keyboard.push([button("🏠 خانه", "owneradmin:home", "success"), button(uiText("refresh", "🔄 تازه‌سازی"), `owneradmin:list:${targetId}:${currentPage}`, "primary")]);
    } else if (view === "plans") {
      const record = this.#targetRecord(state, targetId);
      if (!record) return this.#sendOwnerPanel(state, chatId, "home", "", 0, messageId, "مقصد پیدا نشد.");
      const tiers = Object.entries(db.ownerBroadcast?.monthlyQuotaByTier || db.limits?.chatTiers || {});
      text = `<b>انتخاب پلن · ${escapeHtml(record.title || targetId)}</b>\nشناسه: <code>${escapeHtml(targetId)}</code>`;
      for (const [tier, value] of tiers) {
        const rawQuota = typeof value === "object" ? value.monthlyBroadcasts : value;
        keyboard.push([button(`${tier} · ${quotaLabel(rawQuota)}`, `owneradmin:setplan:${targetId}:${tier}`, tier === this.#targetQuotaSnapshot(state, targetId).tier ? "success" : "primary")]);
      }
      keyboard.push([button(uiText("back", "⬅️ بازگشت"), `owneradmin:target:${targetId}`, "primary")]);
    } else if (view === "quotas") {
      const record = this.#targetRecord(state, targetId);
      if (!record) return this.#sendOwnerPanel(state, chatId, "home", "", 0, messageId, "مقصد پیدا نشد.");
      text = `<b>تنظیم سقف ماهانه · ${escapeHtml(record.title || targetId)}</b>\nشناسه: <code>${escapeHtml(targetId)}</code>\n\nسقف اختصاصی برای این مقصد را انتخاب کن:`;
      const presets = Array.isArray(config.quotaPresets) ? config.quotaPresets : [0, 500, 1000, 2000, 5000, 10000, -1];
      for (let index = 0; index < presets.length; index += 2) {
        const row = presets.slice(index, index + 2).map((value) => button(value < 0 ? "نامحدود" : Number(value).toLocaleString("fa-IR"), `owneradmin:setquota:${targetId}:${value}`, "primary"));
        keyboard.push(row);
      }
      keyboard.push([button(uiText("customQuota", "سقف دلخواه با دستور"), `owneradmin:quotahelp:${targetId}`, "primary")]);
      keyboard.push([button("⬅️ بازگشت", `owneradmin:target:${targetId}`, "primary")]);
    } else {
      const views = Array.isArray(config.views) && config.views.length ? config.views : [
        { id: "groups", title: "گروه‌ها", sourcePath: "state.groups", itemType: "group" },
        { id: "channels", title: "کانال‌ها", sourcePath: "state.channels", itemType: "channel" },
      ];
      const viewCounts = views.map((item) => {
        const raw = getPath(state, String(item.sourcePath || "").replace(/^state\./, ""), null);
        return { ...item, count: Array.isArray(raw) ? raw.length : raw && typeof raw === "object" ? Object.keys(raw).length : 0 };
      });
      const records = [...Object.keys(state.groups || {}), ...(state.channels || []).map((item) => String(item.id))];
      const active = records.filter((id) => this.#targetQuotaSnapshot(state, id).active && !state.blockedGroups.includes(id) && !state.leftGroups.includes(id)).length;
      text = [
        `<b>${escapeHtml(config.title || "مدیریت مرکزی ربات")}</b>`,
        "━━━━━━━━━━━━━━",
        escapeHtml(config.intro || "مدیریت گروه‌ها و کانال‌های ثبت‌شده"),
        "",
        ...viewCounts.map((item) => `${escapeHtml(item.title || item.id)}: <b>${item.count}</b>`),
        `🟢 مقصدهای فعال برای ارسال: <b>${active}</b>`,
        `🗓 دوره سهمیه: <b>ماه تقویمی</b>`,
        note ? `\n${escapeHtml(note)}` : "",
      ].filter(Boolean).join("\n");
      keyboard = viewCounts.map((item) => [button(`${String(item.title || item.id).slice(0, 42)} (${item.count})`, `owneradmin:list:${item.id}:0`, "primary")]);
      for (const action of (config.homeActions || [])) {
        keyboard.push([button(String(action.label || action.id).slice(0, 60), `owneradmin:action:${action.id}`, action.color || "primary")]);
      }
      keyboard.push([button(uiText("refresh", "🔄 تازه‌سازی"), "owneradmin:home", "success")]);
    }
    const extra = { parse_mode: "HTML", reply_markup: { inline_keyboard: keyboard }, link_preview_options: { is_disabled: true } };
    if (messageId) return this.#telegram(state, "editMessageText", { chat_id: chatId, message_id: messageId, text: text.slice(0, 3_900), ...extra }, { bypassLocalRate: true });
    return this.#send(chatId, text.slice(0, 3_900), state, extra, { bypassLocalRate: true });
  }

  async #handleOwnerPanelCommand(state, message, parsed) {
    const config = this.#ownerPanelConfig(state);
    if (config.enabled === false || !isPrivate(message.chat) || !this.#isOwner(message.from?.id, state)) return false;
    const db = this.#db(state) || {};
    const args = parsed.args || [];
    const action = String(args[0] || "").toLowerCase();
    if (!action || action === "home" || action === "refresh") {
      await this.#sendOwnerPanel(state, message.chat.id);
      return true;
    }
    const configuredViews = Array.isArray(config.views) ? config.views : [];
    if (configuredViews.some((view) => String(view.id) === action)) {
      await this.#sendOwnerPanel(state, message.chat.id, "list", action, Number(args[1] || 0));
      return true;
    }
    if (["activate", "deactivate", "plan", "quota"].includes(action)) {
      const targetId = String(args[1] || "");
      if (!isTelegramId(targetId) || !this.#targetRecord(state, targetId)) {
        await this.#send(message.chat.id, "شناسه مقصد معتبر یا ثبت‌شده نیست. از فهرست /admin مقصد را انتخاب کن.", state);
        return true;
      }
      state.targetPolicies ||= {};
      const policy = state.targetPolicies[targetId] ||= {};
      if (action === "activate" || action === "deactivate") {
        policy.active = action === "activate";
        policy.updatedAt = Date.now();
        policy.updatedBy = String(message.from.id);
        await this.#save(state);
        await this.#sendOwnerPanel(state, message.chat.id, "target", targetId, 0, null, "وضعیت مقصد ذخیره شد.");
        return true;
      }
      if (action === "plan") {
        const tier = String(args[2] || "").toUpperCase();
        if (!Object.hasOwn(db.ownerBroadcast?.monthlyQuotaByTier || {}, tier)) {
          await this.#send(message.chat.id, "پلن معتبر نیست. پلن‌های موجود را از صفحه جزئیات انتخاب کن.", state);
          return true;
        }
        policy.tier = tier;
        policy.monthlyQuotaOverride = null;
        policy.updatedAt = Date.now();
        policy.updatedBy = String(message.from.id);
        await this.#save(state);
        await this.#sendOwnerPanel(state, message.chat.id, "target", targetId, 0, null, "پلن مقصد به‌روزرسانی شد.");
        return true;
      }
      if (action === "quota") {
        const value = String(args[2] || "").toLowerCase();
        const quota = value === "unlimited" ? -1 : Number(value);
        if (!Number.isInteger(quota) || quota < -1 || quota > 1_000_000_000) {
          await this.#send(message.chat.id, "مقدار سهمیه باید عدد صحیح نامنفی یا unlimited باشد.", state);
          return true;
        }
        policy.monthlyQuotaOverride = quota;
        policy.updatedAt = Date.now();
        policy.updatedBy = String(message.from.id);
        await this.#save(state);
        await this.#sendOwnerPanel(state, message.chat.id, "target", targetId, 0, null, "سقف ماهانه اختصاصی ذخیره شد.");
        return true;
      }
    }
    await this.#send(message.chat.id, "فرمان‌های پنل مالک:\n/admin\n/admin groups\n/admin channels\n/admin activate <chat_id>\n/admin deactivate <chat_id>\n/admin plan <chat_id> <tier>\n/admin quota <chat_id> <number|unlimited>", state);
    return true;
  }

  async #handleOwnerPanelCallback(state, callback) {
    const data = String(callback.data || "");
    const payload = data.startsWith("owneradmin:") ? data.slice("owneradmin:".length).split(":") : [];
    const [action, first, second, third] = payload;
    const chatId = callback.message.chat.id;
    if (action === "home") {
      await this.#sendOwnerPanel(state, chatId, "home", "", 0, callback.message.message_id);
      return;
    }
    if (action === "list" && ((this.#ownerPanelConfig(state).views || []).some((view) => String(view.id) === String(first))
      || (!Array.isArray(this.#ownerPanelConfig(state).views) && ["groups", "channels"].includes(String(first))))) {
      await this.#sendOwnerPanel(state, chatId, "list", first, Number(second || 0), callback.message.message_id);
      return;
    }
    if (action === "action") {
      const config = this.#ownerPanelConfig(state);
      const actionConfig = (config.detailActions || []).find((item) => String(item.id) === String(first))
        || (config.homeActions || []).find((item) => String(item.id) === String(first));
      if (!actionConfig || !Array.isArray(actionConfig.actions)) {
        await this.#answerCallback(callback.id, "عملیات پنل تعریف نشده است.");
        return;
      }
      const targetId = String(second || "");
      const targetRecord = targetId ? this.#targetRecord(state, targetId) : null;
      const quota = targetRecord ? this.#targetQuotaSnapshot(state, targetId) : null;
      const targetActive = Boolean(targetRecord && quota?.active && !state.blockedGroups.includes(targetId)
        && !state.leftGroups.includes(targetId) && !["left", "kicked"].includes(String(targetRecord.botStatus || "").toLowerCase()));
      const syntheticMessage = {
        from: callback.from,
        chat: callback.message.chat,
        message_id: callback.message.message_id,
        text: "",
      };
      await this.#executeDatabaseActions(state, syntheticMessage, { actions: actionConfig.actions }, "", {
        callback: { id: callback.id, data, args: payload.slice(2), messageId: callback.message.message_id },
        target: targetRecord ? { ...targetRecord, ...quota, active: targetActive, nextActive: !targetActive } : null,
      });
      return;
    }
    if (action === "target" && isTelegramId(first)) {
      await this.#sendOwnerPanel(state, chatId, "target", first, 0, callback.message.message_id);
      return;
    }
    if ((action === "activate" || action === "deactivate") && isTelegramId(first) && this.#targetRecord(state, first)) {
      state.targetPolicies ||= {};
      state.targetPolicies[first] ||= {};
      state.targetPolicies[first].active = action === "activate";
      state.targetPolicies[first].updatedAt = Date.now();
      state.targetPolicies[first].updatedBy = String(callback.from.id);
      await this.#save(state);
      await this.#sendOwnerPanel(state, chatId, "target", first, 0, callback.message.message_id, "وضعیت ارسال مقصد تغییر کرد.");
      return;
    }
    if (action === "plan" && isTelegramId(first) && this.#targetRecord(state, first)) {
      await this.#sendOwnerPanel(state, chatId, "plans", first, 0, callback.message.message_id);
      return;
    }
    if (action === "setplan" && isTelegramId(first) && /^[A-Z][A-Z0-9_]{0,15}$/.test(String(second || ""))) {
      const tiers = this.#db(state)?.ownerBroadcast?.monthlyQuotaByTier || {};
      if (!Object.hasOwn(tiers, second) || !this.#targetRecord(state, first)) {
        await this.#answerCallback(callback.id, "پلن یا مقصد معتبر نیست.");
        return;
      }
      state.targetPolicies ||= {};
      state.targetPolicies[first] ||= {};
      state.targetPolicies[first].tier = second;
      state.targetPolicies[first].monthlyQuotaOverride = null;
      state.targetPolicies[first].updatedAt = Date.now();
      state.targetPolicies[first].updatedBy = String(callback.from.id);
      await this.#save(state);
      await this.#sendOwnerPanel(state, chatId, "target", first, 0, callback.message.message_id, "پلن مقصد به‌روزرسانی شد.");
      return;
    }
    if (action === "quota" && isTelegramId(first) && this.#targetRecord(state, first)) {
      await this.#sendOwnerPanel(state, chatId, "quotas", first, 0, callback.message.message_id);
      return;
    }
    if (action === "setquota" && isTelegramId(first) && this.#targetRecord(state, first)) {
      const quota = Number(second);
      if (!Number.isInteger(quota) || quota < -1 || quota > 1_000_000_000) {
        await this.#answerCallback(callback.id, "سقف نامعتبر است.");
        return;
      }
      state.targetPolicies ||= {};
      state.targetPolicies[first] ||= {};
      state.targetPolicies[first].monthlyQuotaOverride = quota;
      state.targetPolicies[first].updatedAt = Date.now();
      state.targetPolicies[first].updatedBy = String(callback.from.id);
      await this.#save(state);
      await this.#sendOwnerPanel(state, chatId, "target", first, 0, callback.message.message_id, "سقف ماهانه اختصاصی ذخیره شد.");
      return;
    }
    if (action === "quotahelp" && isTelegramId(first)) {
      await this.#answerCallback(callback.id, `فرمان: /admin quota ${first} 1500`);
      return;
    }
    await this.#answerCallback(callback.id, "درخواست نامعتبر یا منقضی شده است.");
  }

  async #handleDatabaseCommand(state, message, db) {
    const match = matchDatabaseCommand(message.text || message.caption || "", db);
    if (!match) return false;
    const definition = match.definition;
    const permission = await this.#authorizeDatabaseCommand(state, message, definition, db);
    if (!permission.allowed) {
      const denialKey = permission.policy?.denialText || (isGroup(message.chat) ? "group.adminOnly" : "group.adminOnly");
      const fallback = isGroup(message.chat) ? "⛔ این فرمان فقط برای مالک گروه یا مدیران واقعی گروه مجاز است." : "⛔ دسترسی مجاز نیست.";
      if (permission.reason !== "scope") await this.#reply(message, this.#text(state, denialKey, fallback), state);
      return true;
    }
    if (Array.isArray(definition.actions)) return this.#executeDatabaseActions(state, message, definition, match.argumentText);
    const handler = String(definition.handler || "");
    if (handler === "help") {
      await this.#sendHelp(state, message.chat.id);
      return true;
    }
    if (handler === "profile.info") return this.#handleProfileInfo(state, message, match.argumentText);
    if (handler.startsWith("welcome.")) return this.#handleWelcomeCommand(state, message, definition, match.argumentText);
    if (handler.startsWith("goodbye.")) return this.#handleGoodbyeCommand(state, message, definition, match.argumentText);
    if (handler.startsWith("moderation.")) {
      if (!this.#featureEnabled(state, "moderation", message.chat.id)) {
        await this.#reply(message, "⛔ مدیریت گروه در دیتابیس غیرفعال است.", state);
        return true;
      }
      return this.#handleModerationCommand(state, message, definition, match.argumentText);
    }
    return false;
  }

  async #renderWelcome(task, state, db) {
    const chatResult = await this.#telegram(state, "getChat", { chat_id: Number(task.chatId) }, { bypassLocalRate: true });
    const chatName = chatResult.ok ? chatResult.result?.title || task.chatTitle : task.chatTitle;
    const inviteLink = task.inviteLink || (chatResult.ok ? chatResult.result?.invite_link || "" : "");
    const member = task.member || {};
    const fullName = [member.first_name, member.last_name].filter(Boolean).join(" ") || String(member.id);
    const mention = `<a href="tg://user?id=${Number(member.id)}">${escapeHtml(fullName)}</a>`;
    const date = new Intl.DateTimeFormat("fa-IR", { timeZone: "Asia/Tehran", dateStyle: "long" }).format(new Date());
    const time = new Intl.DateTimeFormat("fa-IR", { timeZone: "Asia/Tehran", hour: "2-digit", minute: "2-digit" }).format(new Date());
    const rules = state.groupSettings[String(task.chatId)]?.rules || db.groupSettings?.rules || "";
    const values = {
      name: escapeHtml(fullName), username: member.username ? `@${escapeHtml(member.username)}` : "",
      id: escapeHtml(member.id), chat: escapeHtml(chatName), mention, firstname: escapeHtml(member.first_name || ""),
      lastname: escapeHtml(member.last_name || ""), grouplink: escapeHtml(inviteLink), grouprules: escapeHtml(rules),
      groupname: escapeHtml(chatName), date: escapeHtml(date), time: escapeHtml(time),
      emoji: ["🌸", "🌿", "✨", "💎", "🌈", "🦋", "☀️", "🎉"][Math.floor(Math.random() * 8)],
    };
    const template = state.groupSettings[String(task.chatId)]?.welcomeText || db.features?.welcome?.text || "سلام !mention به گروه !groupname خوش آمدی!";
    let rendered = renderTemplate(template, values);
    const tokens = {
      "!mention": values.mention, "منشن_کاربر": values.mention,
      "!firstname": values.firstname, "نام_کاربر": values.firstname,
      "!lastname": values.lastname, "فامیل_کاربر": values.lastname,
      "!username": values.username, "آیدی_کاربر": values.username,
      "!userid": values.id, "آیدی_عددی_کاربر": values.id,
      "!grouplink": values.grouplink, "لینک_گروه": values.grouplink,
      "!grouprules": values.grouprules, "قوانین_گروه": values.grouprules,
      "!groupname": values.groupname, "نام_گروه": values.groupname,
      "!date": values.date, "زمان_تاریخ": values.date,
      "!time": values.time, "زمان_ساعت": values.time,
      "!emoji": values.emoji, "ایموجی_خودکار": values.emoji,
    };
    for (const [token, value] of Object.entries(tokens)) rendered = rendered.split(token).join(value);
    return rendered;
  }

  async #runWelcomeQueue(state, now = Date.now()) {
    const queue = Array.isArray(state.welcomeQueue) ? state.welcomeQueue : [];
    const due = queue.filter((item) => Number(item.dueAt || 0) <= now).slice(0, 50);
    state.welcomeQueue = queue.filter((item) => Number(item.dueAt || 0) > now);
    if (!due.length) return;
    const db = this.#db(state);
    for (const task of due) {
      const chatId = String(task.chatId);
      const userId = String(task.member?.id || "");
      const deliveredKey = `${chatId}:${userId}`;
      if (!this.#featureEnabled(state, "welcome", chatId) || state.welcomeDelivered?.[deliveredKey]) continue;
      const text = await this.#renderWelcome(task, state, db);
      const media = state.groupSettings[chatId]?.welcomeMedia || db.features?.welcome?.media || null;
      let delivered = false;
      if (media?.fileId && ["photo", "video", "audio", "voice", "animation", "sticker", "video_note"].includes(media.type)) {
        const field = media.type === "video_note" ? "video_note" : media.type;
        const method = media.type === "video_note" ? "sendVideoNote" : media.type === "sticker" ? "sendSticker" : media.type === "animation" ? "sendAnimation" : media.type === "voice" ? "sendVoice" : media.type === "audio" ? "sendAudio" : media.type === "video" ? "sendVideo" : "sendPhoto";
        const captionSupported = !["sticker", "video_note"].includes(media.type);
        const payload = { chat_id: Number(task.chatId), [field]: media.fileId };
        if (captionSupported && text.length <= 950) {
          payload.caption = text;
          payload.parse_mode = db.runtime?.telegram?.parseMode || "HTML";
        }
        const sent = await this.#telegram(state, method, payload, { group: true });
        if (sent.ok) {
          delivered = true;
          if (!captionSupported || text.length > 950) {
            const textSent = await this.#send(Number(task.chatId), text, state, {}, { group: true });
            if (!textSent.ok) console.error(JSON.stringify({ event: "welcome_caption_fallback_failed", chatId, userId, reason: asText(textSent.description).slice(0, 120) }));
          }
        } else {
          console.error(JSON.stringify({ event: "welcome_media_send_failed", chatId, userId, mediaType: media.type, reason: asText(sent.description).slice(0, 120) }));
          const fallback = await this.#send(Number(task.chatId), text, state, {}, { group: true });
          delivered = Boolean(fallback.ok);
        }
      } else {
        const sent = await this.#send(Number(task.chatId), text, state, {}, { group: true });
        delivered = Boolean(sent.ok);
      }

      if (delivered) {
        state.welcomeDelivered[deliveredKey] = Date.now();
        console.log(JSON.stringify({ event: "welcome_message_sent", chatId, userId, hasMedia: Boolean(media?.fileId) }));
      } else {
        const retries = Number(task.retries || 0);
        if (retries < 3) {
          state.welcomeQueue.push({ ...task, retries: retries + 1, dueAt: Date.now() + 60_000 });
          console.error(JSON.stringify({ event: "welcome_message_retry_scheduled", chatId, userId, retry: retries + 1 }));
        } else {
          console.error(JSON.stringify({ event: "welcome_message_delivery_abandoned", chatId, userId, retries }));
        }
      }
    }
    state.welcomeQueue = state.welcomeQueue.slice(-2_000);
    const deliveredEntries = Object.entries(state.welcomeDelivered || {}).sort((a, b) => Number(a[1]) - Number(b[1]));
    if (deliveredEntries.length > 5_000) state.welcomeDelivered = Object.fromEntries(deliveredEntries.slice(-4_000));
    await this.#save(state);
  }

  async #replyAction(state, message, operator, db) {
    if (!operator || !this.#featureEnabled(state, "moderation", message.chat?.id) || !message.reply_to_message?.from || !message.text) return false;
    const parsed = parseCommand(message.text);
    const supportedActions = new Set(["ban", "kick", "mute", "unmute", "unban", "delete", "pin", "warn"]);
    const commandDefinitions = Array.isArray(db.features?.moderation?.commands) ? db.features.moderation.commands : [];
    const commandDefinition = parsed && commandDefinitions.find((item) => item.enabled !== false
      && String(item.command || "").toLowerCase() === parsed.command && supportedActions.has(String(item.action || "")));
    const selectedCommand = commandDefinition ? {
      action: String(commandDefinition.action),
      minutes: clampNumber(parsed.args[0] || commandDefinition.minutes, 60, 1, 40_320),
      label: String(commandDefinition.label || commandDefinition.action),
    } : null;
    const actions = db.features?.moderation?.replyActions || [];
    const normalized = normalizeText(message.text);
    const selected = selectedCommand || actions.find((item) => (item.terms || []).some((term) => normalizeText(term) === normalized));
    if (!selected) return false;

    const target = message.reply_to_message.from;
    const chatId = message.chat.id;
    const protectedIds = [...(db.roles?.protectedIds || []), ...(db.features?.moderation?.protectedIds || [])].map(String);
    if (!target.id || target.is_bot || this.#isOwner(target.id, state) || protectedIds.includes(String(target.id))) {
      await this.#reply(message, this.#text(state, "moderation.protected", "🛡 This user is on the protected list."), state);
      return true;
    }
    const targetMember = await this.#telegram(state, "getChatMember", { chat_id: chatId, user_id: target.id }, { bypassLocalRate: true });
    if (!targetMember.ok || !targetMember.result?.status) {
      await this.#reply(message, this.#text(state, "moderation.memberCheckFailed", "⚠️ The member status could not be verified; no action was taken."), state);
      return true;
    }
    if (["creator", "administrator"].includes(targetMember.result.status)) {
      await this.#reply(message, this.#text(state, "moderation.protected", "🛡 Group administrators are protected."), state);
      return true;
    }

    const action = selected.action;
    const me = await this.#telegram(state, "getMe", {}, { bypassLocalRate: true });
    const botMember = me.ok ? await this.#telegram(state, "getChatMember", { chat_id: chatId, user_id: me.result.id }, { bypassLocalRate: true }) : { ok: false };
    const botStatus = botMember.result || {};
    const needsRestrict = ["ban", "kick", "mute", "unmute", "unban"].includes(action);
    const needsDelete = action === "delete";
    const needsPin = action === "pin";
    if (needsRestrict && !(botStatus.status === "creator" || (botStatus.status === "administrator" && botStatus.can_restrict_members === true))) {
      await this.#reply(message, "⛔ The bot lacks Restrict Members permission. Grant it member-management access.", state);
      return true;
    }
    if (needsDelete && !(botStatus.status === "creator" || (botStatus.status === "administrator" && botStatus.can_delete_messages === true))) {
      await this.#reply(message, "⛔ The bot lacks Delete Messages permission.", state);
      return true;
    }
    if (needsPin && !(botStatus.status === "creator" || (botStatus.status === "administrator" && botStatus.can_pin_messages === true))) {
      await this.#reply(message, "⛔ The bot lacks Pin Messages permission.", state);
      return true;
    }

    const userId = Number(target.id);
    let result = { ok: false, description: "UNKNOWN_ACTION" };
    if (action === "ban") {
      result = await this.#telegram(state, "banChatMember", { chat_id: chatId, user_id: userId }, { bypassLocalRate: true });
    } else if (action === "kick") {
      result = await this.#telegram(state, "banChatMember", { chat_id: chatId, user_id: userId, until_date: Math.floor(Date.now() / 1_000) + 60 }, { bypassLocalRate: true });
      if (result.ok) {
        const unban = await this.#telegram(state, "unbanChatMember", { chat_id: chatId, user_id: userId, only_if_banned: true }, { bypassLocalRate: true });
        if (!unban.ok) result = unban;
      }
    } else if (action === "mute") {
      const minutes = clampNumber(selected.minutes ?? parsed?.args?.[0], 60, 1, 40_320);
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
      const warningKey = `${chatId}:${target.id}`;
      state.warnings ||= {};
      const count = Number(state.warnings[warningKey] || 0) + 1;
      state.warnings[warningKey] = count;
      result = { ok: true };
      const threshold = clampNumber(db.features?.moderation?.warningThreshold, 3, 2, 10);
      const warnText = renderTemplate(this.#text(state, "moderation.warn", "⚠️ {name}, please follow the group rules. Warning {count}/{threshold}"), {
        name: userDisplay(target), count, threshold,
      });
      await this.#reply(message, warnText, state);
      if (count >= threshold) {
        const minutes = clampNumber(db.features?.moderation?.warningMuteMinutes, 30, 1, 1_440);
        const muted = await this.#telegram(state, "restrictChatMember", {
          chat_id: chatId, user_id: userId,
          permissions: { can_send_messages: false, can_send_audios: false, can_send_documents: false, can_send_photos: false, can_send_videos: false, can_send_video_notes: false, can_send_voice_notes: false, can_send_polls: false, can_send_other_messages: false, can_add_web_page_previews: false },
          until_date: Math.floor(Date.now() / 1_000) + minutes * 60,
          use_independent_chat_permissions: true,
        }, { bypassLocalRate: true });
        if (muted.ok) state.warnings[warningKey] = 0;
      }
    }

    await this.#save(state);
    if (action !== "warn") {
      const responseText = result.ok
        ? renderTemplate(this.#text(state, "moderation.actionSuccess", "✅ {action} was completed for {name}."), { action: selected.label || action, name: userDisplay(target) })
        : renderTemplate(this.#text(state, "moderation.actionFailed", "❌ The action failed: {reason}"), { reason: asText(result.description || "Telegram error").slice(0, 160) });
      await this.#reply(message, responseText, state);
    }
    return true;
  }

  async #runGroupAutomations(state, message, text, db) {
    if (!this.#featureEnabled(state, "automations", message.chat?.id)) return false;
    const rules = db.features?.automations?.rules || [];
    for (const [index, rule] of rules.entries()) {
      if (rule.enabled === false || !Array.isArray(rule.keywords) || !matchPhrase(text, rule.keywords)) continue;
      const groupSettings = state.groupSettings[String(message.chat.id)] ||= {};
      groupSettings.automationCooldowns ||= {};
      const last = Number(groupSettings.automationCooldowns[index] || 0);
      if (Date.now() - last < clampNumber(rule.cooldownSeconds, 20, 0, 86_400) * 1_000) continue;
      groupSettings.automationCooldowns[index] = Date.now();
      const action = rule.action || "reply";
      if (action === "delete") {
        await this.#telegram(state, "deleteMessage", { chat_id: message.chat.id, message_id: message.message_id }, { bypassLocalRate: true });
      } else if (action === "warn") {
        await this.#reply(message, renderTemplate(rule.response || "⚠️ Please follow the group rules.", { user: userDisplay(message.from) }), state);
      } else if (action === "reply" && rule.response) {
        await this.#reply(message, renderTemplate(rule.response, { user: userDisplay(message.from), chat: message.chat.title || "Group" }), state);
      }
      await this.#save(state);
      return rule.stopProcessing !== false;
    }
    return false;
  }

  async #handleGroupMessage(state, message) {
    const db = this.#db(state);
    if (!db) return;
    const chat = message.chat;
    const text = asText(message.text || message.caption);
    const user = message.from || {};
    if (user.is_bot) return;
    this.#rememberKnownMember(state, chat, user);
    const persistentBan = state.groupModerationLists?.[String(chat.id)]?.banned?.[String(user.id)];
    if (persistentBan) {
      const reban = await this.#telegram(state, "banChatMember", { chat_id: chat.id, user_id: Number(user.id), revoke_messages: true }, { bypassLocalRate: true });
      console.log(JSON.stringify({ event: "persistent_group_ban_reapplied_from_message", chatId: String(chat.id), userId: String(user.id), ok: Boolean(reban.ok) }));
      await this.#save(state);
      return;
    }
    const ownerOperator = this.#isOwner(user.id, state);
    const operator = this.#isOperator(user.id, chat.id, db, state) || await this.#isTelegramAdmin(state, user.id, chat.id);
    const botReplyFeature = db.features?.botReplyJokes || {};
    if (this.#featureEnabled(state, "botReplyJokes", chat.id)
      && message.reply_to_message?.from?.is_bot && text && !text.startsWith("/")) {
      const terms = botReplyFeature.terms || ["remove me", "ban me", "kick me out"];
      if (matchPhrase(text, terms)) {
        await this.#reply(message, randomItem(botReplyFeature.responses, this.#text(state, "moderation.botMiss", "😂 I cannot be removed!")), state);
        return;
      }
    }
    const groupKey = String(chat.id);
    let settings = state.groupSettings[groupKey];
    if (!settings) {
      settings = {
        botEnabled: true, chatterEnabled: false, chatterNextAt: 0,
        jokesEnabled: db.groupSettings?.defaultJokesEnabled !== false,
        chatbotEnabled: db.groupSettings?.defaultChatbotEnabled !== false,
      };
      state.groupSettings[groupKey] = settings;
    }
    settings.lastSeenAt = Date.now();
    const protectedSenderIds = [
      ...(db.roles?.protectedIds || []),
      ...(db.features?.moderation?.protectedIds || []),
    ].map(String);
    const trustedSender = operator || protectedSenderIds.includes(String(user.id));

    if (await this.#handleDatabaseCommand(state, message, db)) return;

    const command = parseCommand(text);
    const reportCommand = configuredCommand(db.features?.reports?.command);
    const botCommand = configuredCommand(db.features?.groupControls?.command);
    const tagCommands = db.features?.tagKnownMembers?.commands || {};
    const tagAllCommand = configuredCommand(tagCommands.tagAll);
    const tagOptInCommand = configuredCommand(tagCommands.tagOptIn);
    const tagOptOutCommand = configuredCommand(tagCommands.tagOptOut);

    if (this.#featureEnabled(state, "reports", groupKey) && reportCommand && command?.command === reportCommand) {
      await this.#handleReport(state, message, command.args.join(" "));
      return;
    }
    if (!trustedSender && await this.#recordSpam(state, message, db, operator)) return;

    if (botCommand && command?.command === botCommand && this.#featureEnabled(state, "groupControls", groupKey)) {
      const action = String(command.args?.[0] || "").toLowerCase();
      if (!operator) {
        await this.#reply(message, this.#text(state, "group.adminOnly", "⛔ Only a verified group administrator can use this command."), state);
        return;
      }
      if (!["on", "off"].includes(action)) {
        await this.#reply(message, `Use ${botCommand} on or ${botCommand} off to control bot replies.`, state);
        return;
      }
      settings.botEnabled = action === "on";
      await this.#save(state);
      await this.#reply(message, this.#text(state, action === "on" ? "group.botOn" : "group.botOff", action === "on" ? "Bot replies are now enabled." : "Bot replies are now disabled."), state);
      await this.#send(chat.id, `Quick controls\nBot replies: ${settings.botEnabled === false ? "OFF" : "ON"}`, state, {
        reply_markup: { inline_keyboard: [[toggleButton("Bot replies", settings.botEnabled !== false, `g5:toggle:${groupKey}`)]] },
      }, { bypassLocalRate: true, group: true });
      return;
    }
    if ((tagOptOutCommand && command?.command === tagOptOutCommand)
      || (tagOptInCommand && command?.command === tagOptInCommand)) {
      const optingOut = command.command === tagOptOutCommand;
      state.tagOptOut[`${groupKey}:${user.id}`] = optingOut;
      await this.#save(state);
      await this.#reply(message, this.#text(state, optingOut ? "group.tagOptOut" : "group.tagOptIn", "Your tag preference has been saved."), state);
      return;
    }
    if (tagAllCommand && command?.command === tagAllCommand && this.#featureEnabled(state, "tagKnownMembers", groupKey)) {
      if (!operator) {
        await this.#reply(message, this.#text(state, "group.adminOnly", "Only a real group administrator can start tagging."), state);
        return;
      }
      const cooldown = clampNumber(db.features?.tagKnownMembers?.cooldownSeconds, 300, 30, 86_400) * 1_000;
      if (Date.now() - Number(state.tagCooldowns[groupKey] || 0) < cooldown) {
        await this.#reply(message, this.#text(state, "group.tagCooldown", "Please wait before starting another tag operation."), state);
        return;
      }
      const max = clampNumber(db.features?.tagKnownMembers?.maxMembers, 80, 1, 200);
      const ids = (state.knownMembers[groupKey] || []).filter((member) => !member.isBot && !state.tagOptOut[`${groupKey}:${member.id}`]).slice(-max).map((member) => String(member.id));
      if (!ids.length) {
        await this.#reply(message, this.#text(state, "group.tagEmpty", "No known members are available to tag yet."), state);
        return;
      }
      const nonce = crypto.randomUUID().replace(/-/g, "").slice(0, 12);
      state.tagDrafts[nonce] = { chatId: groupKey, initiatorId: String(user.id), ids, createdAt: Date.now(), expiresAt: Date.now() + 120_000 };
      state.tagDrafts = Object.fromEntries(Object.entries(state.tagDrafts).slice(-100));
      await this.#save(state);
      await this.#reply(message, renderTemplate(this.#text(state, "group.tagPreview", "Preview: {count} known members."), { count: ids.length }), state);
      await this.#send(chat.id, "This preview includes only members observed in real Telegram updates. The Bot API cannot enumerate unknown group members.", state, {
        reply_markup: { inline_keyboard: [[button("Confirm and Send", `t5:confirm:${groupKey}:${nonce}`, "success"), button("Cancel", `t5:cancel:${groupKey}:${nonce}`, "danger")]] },
      }, { bypassLocalRate: true, group: true });
      return;
    }

    const moderation = db.features?.moderation || {};
    const linkGuard = db.features?.linkGuard || {};
    const phishing = db.features?.phishingGuard || {};
    if (!trustedSender) {
      if (this.#featureEnabled(state, "moderation", groupKey) && matchPhrase(text, moderation.blockedWords || [])) {
        const canDelete = await this.#botPermission(state, groupKey, "can_delete_messages");
        if (canDelete === true) {
          const deleted = await this.#telegram(state, "deleteMessage", { chat_id: chat.id, message_id: message.message_id }, { bypassLocalRate: true });
          if (deleted.ok) await this.#send(chat.id, this.#text(state, "moderation.blockedWord", "⛔ The message was deleted because it violated the group rules."), state, {}, { group: true });
          else await this.#securityAlert(state, { chatId: groupKey, chatTitle: chat.title, kind: "moderation_delete_failed", reason: "The message contained a blocked phrase, but Telegram rejected the deletion.", count: 1, userIds: [user.id], action: "Message deletion failed; Telegram rejected the request." });
        } else {
          await this.#securityAlert(state, { chatId: groupKey, chatTitle: chat.title, kind: "moderation_permission_missing", reason: "The message contained a blocked phrase, but bot delete permission was not verified.", count: 1, userIds: [user.id], action: "No message was deleted; delete permission was missing or unverified." });
        }
        return;
      }
      const hasLink = /(?:https?:\/\/|t\.me\/|www\.)/i.test(text);
      const urlDomains = [...text.matchAll(/(?:https?:\/\/|www\.)?([a-z0-9.-]+\.[a-z]{2,})/gi)].map((match) => match[1].toLowerCase());
      const blockedLinkDomains = (linkGuard.blockedDomains || []).map((domain) => String(domain).toLowerCase());
      const blockedPhishingDomains = (phishing.blockedDomains || []).map((domain) => String(domain).toLowerCase());
      const matchesDomain = (domain, list) => list.some((blocked) => domain === blocked || domain.endsWith(`.${blocked}`));
      const linkDomainBlocked = urlDomains.some((domain) => matchesDomain(domain, blockedLinkDomains));
      const phishingDomainBlocked = urlDomains.some((domain) => matchesDomain(domain, blockedPhishingDomains));
      const allowDomains = (linkGuard.allowDomains || []).map((domain) => String(domain).toLowerCase());
      const notAllowlisted = linkGuard.requireAllowlist === true && urlDomains.some((domain) => !allowDomains.some((allowed) => domain === allowed || domain.endsWith(`.${allowed}`)));
      const suspicious = this.#featureEnabled(state, "phishingGuard", groupKey) && (matchPhrase(text, phishing.suspiciousTerms || []) || phishingDomainBlocked);
      const linkRejected = this.#featureEnabled(state, "linkGuard", groupKey) && hasLink
        && (linkGuard.deleteAllLinks === true || linkDomainBlocked || notAllowlisted || moderation.deleteLinks === true);
      if (suspicious || linkRejected) {
        const canDelete = await this.#botPermission(state, groupKey, "can_delete_messages");
        if (canDelete === true) {
          const deleted = await this.#telegram(state, "deleteMessage", { chat_id: chat.id, message_id: message.message_id }, { bypassLocalRate: true });
          if (deleted.ok) {
            const notice = suspicious ? (phishing.notice || "⚠️ A suspicious message was deleted. Do not click unknown links.") : (linkGuard.notice || "⛔ The link was deleted under the group rules.");
            await this.#send(chat.id, notice, state, {}, { group: true });
          } else {
            await this.#securityAlert(state, { chatId: groupKey, chatTitle: chat.title, kind: "guard_delete_failed", reason: suspicious ? "A suspicious phishing pattern was detected." : "The link violated the group policy.", count: 1, userIds: [user.id], action: "Telegram rejected the message deletion; the message is not considered deleted." });
          }
        } else {
          await this.#securityAlert(state, { chatId: groupKey, chatTitle: chat.title, kind: "guard_permission_missing", reason: suspicious ? "A suspicious phishing pattern was detected." : "The link violated the group policy.", count: 1, userIds: [user.id], action: "No deletion action was taken because delete permission was not verified." });
        }
        return;
      }
    }

    if (settings.botEnabled === false) {
      await this.#save(state);
      return;
    }

    if (operator && text) {
      const controls = db.features?.controls || [];
      const control = controls.find((item) => matchPhrase(text, item.terms || []));
      if (control && db.groupSettings?.operatorCanToggle !== false) {
        const featureId = String(control.feature || "");
        if (getFeatureModule(featureId)) {
          const desired = Boolean(control.value);
          state.groupModuleOverrides[groupKey] ||= {};
          state.groupModuleOverrides[groupKey][featureId] = desired;
          await this.#save(state);
          await this.#reply(message, `✅ ${featureId} was turned ${desired ? "ON" : "OFF"} in this group.`, state);
          await this.#scheduleNext(state);
          return;
        }
      }
    }

    if (await this.#replyAction(state, message, operator, db)) return;
    if (await this.#runGroupAutomations(state, message, text, db)) return;

    if (this.#featureEnabled(state, "customCommands", groupKey) && text.startsWith("/")) {
      const parsed = parseCommand(text);
      const custom = [
        ...(db.features?.customCommands?.rules || []),
        ...(Array.isArray(db.commandMenu) ? db.commandMenu : []),
      ];
      const rule = custom.find((item) => String(item.command || "").toLowerCase() === parsed?.command && item.enabled !== false);
      if (rule?.response) {
        await this.#reply(message, renderTemplate(rule.response, { user: userDisplay(user), username: user.username || "", chat: chat.title || "Group" }), state);
        return;
      }
    }

    if (settings.jokesEnabled !== false && this.#featureEnabled(state, "jokes", groupKey)
      && text && matchPhrase(text, db.features.jokes.triggerWords || ["joke", "tell me a joke"])) {
      await this.#reply(message, randomItem(db.features.jokes.items, this.#text(state, "jokes.empty", "I do not have a joke right now.")), state);
      return;
    }

    if (settings.chatbotEnabled !== false && this.#featureEnabled(state, "chatbot", groupKey) && text) {
      const contextKey = `group:${chat.id}:${user.id}`;
      const memory = this.#featureEnabled(state, "memory", groupKey) ? await this.#resourceGet(state, "chat-context", contextKey) : null;
      const cacheKey = `g:${chat.id}:${user.id}:${normalizeText(text).slice(0, 120)}:${normalizeText(memory?.lastMessage || "new").slice(0, 40)}`;
      const answer = this.#cacheGet(cacheKey, state) || this.#chatbotAnswer(text, db, memory);
      if (answer) {
        this.#cacheSet(cacheKey, answer, Number(db.runtime?.cache?.chatAnswerTtlSeconds || 600) * 1000, state);
        const history = Array.isArray(memory?.history) ? memory.history : [];
        history.push({ prompt: text.slice(0, 300), answer: answer.slice(0, 300), at: Date.now() });
        if (this.#featureEnabled(state, "memory", groupKey)) await this.#resourcePut(state, "chat-context", contextKey, {
          userId: String(user.id), chatId: String(chat.id), displayName: userDisplay(user), lastMessage: text.slice(0, 300),
          history: history.slice(-Math.max(1, Number(db.features.memory.groupHistory || 6))), lastReplyAt: Date.now(), updatedAt: Date.now(),
        });
        await this.#save(state);
        await this.#reply(message, answer, state);
        return;
      }
    }

    await this.#save(state);
    await this.#scheduleNext(state);
  }

  #updatePartition(update) {
    const chat = update?.message?.chat || update?.edited_message?.chat
      || update?.business_message?.chat || update?.edited_business_message?.chat || update?.guest_message?.chat
      || update?.channel_post?.chat || update?.edited_channel_post?.chat
      || update?.callback_query?.message?.chat || update?.my_chat_member?.chat
      || update?.chat_member?.chat || update?.chat_join_request?.chat
      || update?.message_reaction?.chat || update?.message_reaction_count?.chat
      || update?.chat_boost?.chat || update?.removed_chat_boost?.chat;
    return chat?.id == null ? "system" : String(chat.id);
  }

  async handleUpdate(update) {
    const updateId = update?.update_id;
    if (!Number.isSafeInteger(updateId) || updateId < 0) return { queued: false, reason: "INVALID_UPDATE_ID" };
    const storage = this.ctx.storage;
    const key = `queue:v1:item:${String(updateId).padStart(20, "0")}`;
    const result = await storage.transaction(async (txn) => {
      const meta = await txn.get("queue:v1:meta") || { pendingCount: 0, seenIds: [] };
      if ((meta.seenIds || []).includes(updateId)) return { queued: true, duplicate: true };
      if (Number(meta.pendingCount || 0) >= 512) return { queued: false, reason: "QUEUE_FULL" };
      const partition = this.#updatePartition(update);
      const updateType = getTelegramUpdateType(update);
      await txn.put(key, { updateId, partition, update, updateType, createdAt: Date.now(), attempts: 0 });
      meta.pendingCount = Math.max(0, Number(meta.pendingCount || 0)) + 1;
      meta.seenIds = [...(meta.seenIds || []), updateId].slice(-4_096);
      meta.lastReceivedAt = Date.now();
      meta.lastReceivedUpdateId = updateId;
      meta.lastReceivedType = updateType;
      meta.updatedAt = Date.now();
      await txn.put("queue:v1:meta", meta);
      return { queued: true, duplicate: false, pendingCount: meta.pendingCount, updateType };
    });
    await storage.setAlarm(Date.now() + 50);
    console.log(JSON.stringify({
      event: "durable_update_queued",
      updateId,
      updateType: getTelegramUpdateType(update),
      queued: Boolean(result.queued),
      duplicate: Boolean(result.duplicate),
      pendingCount: Number(result.pendingCount || 0),
    }));
    return result;
  }

  async #drainUpdateQueue(batchSize = 8) {
    const rows = await this.ctx.storage.list({ prefix: "queue:v1:item:", limit: 512 });
    if (!rows?.size) return 0;
    const byPartition = new Map();
    for (const [key, item] of rows) {
      if (!item || !Number.isSafeInteger(item.updateId)) continue;
      const partition = String(item.partition || "system");
      if (!byPartition.has(partition)) byPartition.set(partition, []);
      byPartition.get(partition).push({ key, item });
    }
    for (const group of byPartition.values()) group.sort((a, b) => a.item.updateId - b.item.updateId);
    // Keep order within a chat while letting other partitions proceed during
    // a failed chat's bounded retry backoff.
    const now = Date.now();
    const partitions = [...byPartition.entries()]
      .filter(([, group]) => Number(group[0]?.item?.retryAt || 0) <= now)
      .map(([partition]) => partition)
      .sort((a, b) => a.localeCompare(b));
    const state = await this.#load();
    const cursor = String(state.queueCursor || "");
    const startAt = Math.max(0, partitions.findIndex((partition) => partition > cursor));
    const ordered = [...partitions.slice(startAt), ...partitions.slice(0, startAt)];
    const selected = ordered.slice(0, Math.max(1, Math.min(16, batchSize))).map((partition) => ({
      partition, ...byPartition.get(partition)[0],
    }));
    let completed = 0;
    for (const row of selected) {
      try {
        await this.#handleUpdateInner(row.item.update);
        state.queueCursor = row.partition;
        completed += 1;
      } catch (error) {
        const attempts = Number(row.item.attempts || 0) + 1;
        const latest = await this.#load();
        latest.queueCursor = row.partition;
        if (attempts < 3) {
          const retryAt = Date.now() + Math.min(30_000, 1_000 * (2 ** attempts));
          await this.ctx.storage.put(row.key, { ...row.item, attempts, lastErrorAt: Date.now(), retryAt });
          console.error("Queued update retry scheduled", row.item.updateId, row.partition, attempts);
          await this.ctx.storage.setAlarm(retryAt);
          continue;
        }
        latest.queueDeadLetters = Array.isArray(latest.queueDeadLetters) ? latest.queueDeadLetters : [];
        latest.queueDeadLetters.push({ updateId: row.item.updateId, chatId: row.partition, failedAt: Date.now(), attempts, error: asText(error?.message || error).slice(0, 120) });
        latest.queueDeadLetters = latest.queueDeadLetters.slice(-100);
        await this.#save(latest);
        console.error("Queued update moved to dead letter", row.item.updateId, row.partition);
      }
      await this.ctx.storage.transaction(async (txn) => {
        await txn.delete(row.key);
        const meta = await txn.get("queue:v1:meta") || { pendingCount: 0, seenIds: [] };
        meta.pendingCount = Math.max(0, Number(meta.pendingCount || 0) - 1);
        meta.lastProcessedAt = Date.now();
        meta.lastProcessedUpdateId = row.item.updateId;
        meta.lastProcessedType = row.item.updateType || getTelegramUpdateType(row.item.update);
        await txn.put("queue:v1:meta", meta);
      });
    }
    const latest = await this.#load();
    latest.queueCursor = selected.at(-1)?.partition || latest.queueCursor;
    await this.#save(latest);
    return completed;
  }

  async #flushPendingState() {
    const pending = this.pendingState;
    if (!pending) return;
    await this.ctx.storage.put("state", this.#persistableState(pending));
    if (this.pendingState === pending) this.pendingState = null;
  }

  async #handleUpdateInner(update) {
    const updateId = update?.update_id;
    const hasUpdateId = Number.isSafeInteger(updateId) && updateId >= 0;
    const initial = await this.#load();
    const updateType = getTelegramUpdateType(update);
    // Commit completion before acknowledging the queue item. A retry after a
    // crash between the state write and queue deletion will then be idempotent.
    if (hasUpdateId && (initial.updateIds || []).includes(updateId)) {
      console.log(JSON.stringify({ event: "durable_update_duplicate_skipped", updateId, updateType }));
      return;
    }
    console.log(JSON.stringify({ event: "durable_update_processing", updateId, updateType }));
    await this.#processUpdateInner(update);
    if (hasUpdateId) {
      const completed = await this.#load();
      completed.updateIds = [...(completed.updateIds || []), updateId].slice(-4_096);
      await this.#save(completed);
    }
    await this.#flushPendingState();
    console.log(JSON.stringify({ event: "durable_update_processed", updateId, updateType }));
  }

  async #processUpdateInner(update) {
    const state = await this.#load();
    const updateId = update?.update_id;
    const callback = update?.callback_query;
    const messageForGate = update?.message || update?.edited_message || update?.business_message
      || update?.edited_business_message || update?.guest_message;
    const commandForGate = parseCommand(messageForGate?.text || "");
    const ownerPanelConfig = this.#ownerPanelConfig(state);
    const ownerPanelCommand = configuredCommand(ownerPanelConfig.slashCommand || `/${ownerPanelConfig.command || "admin"}`);
    const isOwnerPanelMessage = Boolean(messageForGate && isPrivate(messageForGate.chat)
      && this.#isOwner(messageForGate.from?.id, state)
      && ownerPanelConfig.enabled !== false && commandForGate?.command === ownerPanelCommand);
    const isOwnerSettingsMessage = Boolean(messageForGate && isPrivate(messageForGate.chat)
      && this.#isOwner(messageForGate.from?.id, state)
      && (commandForGate?.command === "/settings" || (state.flow === "database_upload" && messageForGate.document)));
    const isOwnerSettingsCallback = Boolean(callback && this.#isOwner(callback.from?.id, state)
      && isPrivate(callback.message?.chat) && String(callback.data || "").startsWith("settings:"));
    const isOwnerPanelCallback = Boolean(callback && this.#isOwner(callback.from?.id, state)
      && isPrivate(callback.message?.chat) && String(callback.data || "").startsWith("owneradmin:"));
    const actorId = messageForGate?.from?.id ?? callback?.from?.id ?? null;
    console.log(JSON.stringify({
      event: "telegram_update_dispatch",
      updateId: Number.isSafeInteger(updateId) ? updateId : null,
      updateType: getTelegramUpdateType(update),
      actorIsOwner: this.#isOwner(actorId, state),
      privateChat: Boolean(messageForGate ? isPrivate(messageForGate.chat) : callback ? isPrivate(callback.message?.chat) : false),
      ownerSettingsMessage: isOwnerSettingsMessage,
      ownerSettingsCallback: isOwnerSettingsCallback,
      botEnabled: state.settings?.botEnabled !== false,
    }));
    if (state.settings?.botEnabled === false && !isOwnerSettingsMessage && !isOwnerSettingsCallback && !isOwnerPanelMessage && !isOwnerPanelCallback) {
      console.log(JSON.stringify({ event: "telegram_update_ignored_bot_disabled", updateId }));
      return;
    }
    await this.#save(state);

    if (callback) {
      const callbackData = asText(callback.data);
      if (this.#isOwner(callback.from?.id, state) && isPrivate(callback.message?.chat) && callbackData.startsWith("settings:")) {
        await this.#answerCallback(callback.id);
        await this.#handleSettingsCallback(state, callback);
      } else if (this.#isOwner(callback.from?.id, state) && isPrivate(callback.message?.chat) && callbackData.startsWith("owneradmin:")) {
        await this.#answerCallback(callback.id);
        await this.#handleOwnerPanelCallback(state, callback);
      } else if (callbackData.startsWith("help:") || callbackData.startsWith("captcha:") || callbackData.startsWith("group:bot:") || callbackData.startsWith("tag:")
        || callbackData.startsWith("g5:") || callbackData.startsWith("t5:")) {
        await this.#handleCallback(state, callback);
      } else {
        await this.#answerCallback(callback.id);
      }
    } else if (update?.my_chat_member) {
      const botStatus = update.my_chat_member;
      const chat = botStatus.chat || {};
      const member = botStatus.new_chat_member || {};
      if (chat.type === "channel") {
        await this.#trackChannel(state, chat, member);
        return;
      }
      if (!isGroup(chat)) return;
      this.telegramCache.clear();
      await this.#trackGroup(state, chat, member);
      const nextStatus = member.status;
      if (["left", "kicked"].includes(nextStatus)) {
        state.botJoinState[String(chat.id)] = { ...(state.botJoinState[String(chat.id)] || {}), active: false, status: nextStatus, updatedAt: Date.now() };
        if (state.groupSettings[String(chat.id)]) {
          state.groupSettings[String(chat.id)].chatterEnabled = false;
          state.groupSettings[String(chat.id)].chatterNextAt = 0;
        }
        await this.#save(state);
      } else if (["member", "administrator"].includes(nextStatus)) {
        const groupId = String(chat.id);
        // A group previously rejected only for being below the minimum size may
        // retry after growing and re-adding the bot. Explicit owner blocks remain.
        if (state.botJoinState[groupId]?.status === "left_minimum_members") {
          state.leftGroups = state.leftGroups.filter((id) => id !== groupId);
          state.botJoinState[groupId].active = false;
        }
        if (state.blockedGroups.includes(groupId) || state.leftGroups.includes(groupId)) {
          await this.#telegram(state, "leaveChat", { chat_id: chat.id }, { bypassLocalRate: true });
        } else {
          const join = state.botJoinState[groupId] || {};
          if (!join.active) {
            state.botJoinState[groupId] = { active: true, startedAt: Date.now(), status: "checking" };
            const countResult = await this.#telegram(state, "getChatMemberCount", { chat_id: chat.id }, { bypassLocalRate: true });
            if (!countResult?.ok || !Number.isInteger(countResult.result) || countResult.result < 0) {
              state.botJoinState[groupId].status = "count_unavailable";
              state.botJoinState[groupId].active = false;
              state.botJoinState[groupId].countCheckedAt = Date.now();
              await this.#save(state);
              // Joining a group must remain silent; no greeting or owner notification is sent.
            } else {
              state.groups[groupId].lastMemberCount = countResult.result;
              state.groups[groupId].lastMemberCountAt = Date.now();
              state.botJoinState[groupId].memberCount = countResult.result;
              state.botJoinState[groupId].countCheckedAt = Date.now();
              if (countResult.result < 25) {
                state.botJoinState[groupId].status = "rejected_too_small";
                await this.#save(state);
                  const left = await this.#telegram(state, "leaveChat", { chat_id: chat.id }, { bypassLocalRate: true });
                if (left.ok) {
                  state.groups[groupId].botStatus = "left";
                  state.leftGroups = [...new Set([...state.leftGroups, groupId])].slice(-2_000);
                  state.botJoinState[groupId].status = "left_minimum_members";
                } else {
                  state.botJoinState[groupId].active = false;
                  state.botJoinState[groupId].status = "leave_failed_minimum_members";
                }
              } else {
                state.botJoinState[groupId].status = "ready";
                await this.#save(state);
              }
            }
          }
        }
      }
    } else if (update?.chat_member) {
      const memberUpdate = update.chat_member;
      const chat = memberUpdate.chat || {};
      if (!isGroup(chat)) return;
      const memberUser = memberUpdate.new_chat_member?.user;
      this.#rememberKnownMember(state, chat, memberUser);
      const oldStatus = memberUpdate.old_chat_member?.status;
      const newMember = memberUpdate.new_chat_member || {};
      if (["left", "kicked"].includes(newMember.status) && ["member", "restricted", "administrator", "creator"].includes(oldStatus)) {
        const departedUserId = String(newMember.user?.id || "");
        const transitioned = this.#markMemberLeft(state, chat, newMember.user);
        const anti = this.#db(state)?.features?.antiSpam || {};
        if (transitioned && anti.signals?.joinLeaveBurst !== false) {
          const now = Date.now();
          const windowSeconds = clampNumber(anti.raid?.windowSeconds, 60, 10, 600);
          const leaves = (state.leaveWindows[String(chat.id)] || []).filter((item) => now - Number(item.at || 0) <= windowSeconds * 1_000);
          leaves.push({ at: now, userId: String(newMember.user?.id || "") });
          state.leaveWindows[String(chat.id)] = leaves.slice(-150);
          if (Object.keys(state.leaveWindows).length > 500) {
            for (const [staleChat, events] of Object.entries(state.leaveWindows)) {
              if (!Array.isArray(events) || !events.length || now - Number(events.at(-1)?.at || 0) > windowSeconds * 1_000 * 3) delete state.leaveWindows[staleChat];
              if (Object.keys(state.leaveWindows).length <= 400) break;
            }
          }
          const threshold = clampNumber(anti.raid?.maxLeaves, 10, 3, 100);
          if (this.#featureEnabled(state, "raidProtection", chat.id) && leaves.length >= threshold) {
            await this.#securityAlert(state, {
              chatId: String(chat.id), chatTitle: chat.title || String(chat.id), kind: "leave_burst",
              reason: `${leaves.length} member departures or removals in ${windowSeconds} seconds; threshold ${threshold}`,
              count: leaves.length, userIds: leaves.map((item) => item.userId).filter(Boolean).slice(-30),
              severity: leaves.length >= clampNumber(anti.raid?.escalationLeaves, 20, threshold, 200) ? 2 : 1,
              action: "Events were recorded; no automatic action was taken.",
            });
          }
        }
        if (transitioned) await this.#sendGoodbye(state, chat, newMember.user);
      } else if (["member", "restricted", "administrator", "creator"].includes(newMember.status) && ["left", "kicked"].includes(oldStatus)) {
        const joinedUserId = String(newMember.user?.id || "");
        const savedBan = state.groupModerationLists?.[String(chat.id)]?.banned?.[joinedUserId];
        if (savedBan && joinedUserId) {
          const reban = await this.#telegram(state, "banChatMember", { chat_id: chat.id, user_id: Number(joinedUserId), revoke_messages: true }, { bypassLocalRate: true });
          console.log(JSON.stringify({ event: "persistent_group_ban_reapplied", chatId: String(chat.id), userId: joinedUserId, ok: Boolean(reban.ok) }));
          await this.#save(state);
        } else {
          const welcomeKey = `${String(chat.id)}:${joinedUserId}`;
          const lastJoinAt = Number(state.welcomeDedup?.[welcomeKey] || 0);
          const recentMessageJoin = lastJoinAt > 0 && Date.now() - lastJoinAt < 1_500
            && ((state.welcomeQueue || []).some((item) => String(item.chatId) === String(chat.id)
              && String(item.member?.id) === joinedUserId) || Boolean(state.welcomeDelivered?.[welcomeKey]));
          if (recentMessageJoin) {
            // The service message already handled this same join. Keep its delivery state.
            this.#markMemberJoined(state, chat, newMember.user);
            await this.#save(state);
          } else {
            // Telegram's old_status is authoritative. Clear stale delivery/member state
            // even when the leave update was missed while the Worker was unavailable.
            this.#markMemberLeft(state, chat, newMember.user);
            await this.#handleNewMembers(state, { chat, new_chat_members: [newMember.user].filter(Boolean) }, {
              inviteLink: memberUpdate.invite_link?.invite_link || "",
              viaChatFolderInviteLink: Boolean(memberUpdate.via_chat_folder_invite_link),
              viaJoinRequest: Boolean(memberUpdate.via_join_request),
            });
          }
        }
      }
    } else if (update?.chat_join_request) {
      const joinRequest = update.chat_join_request;
      if (!isGroup(joinRequest.chat)) return;
      await this.#trackGroup(state, joinRequest.chat);
      await this.#handleJoinRequest(state, joinRequest);
    } else {
      // channel_post and edited_channel_post are deliberately ignored: no channel response/moderation.
      const message = update?.message || update?.edited_message || update?.business_message
        || update?.edited_business_message || update?.guest_message;
      if (message) {
        const chat = message.chat || {};
        if (isGroup(chat)) {
          const groupId = String(chat.id);
          if (state.blockedGroups.includes(groupId) || state.leftGroups.includes(groupId)) {
            await this.#telegram(state, "leaveChat", { chat_id: chat.id }, { bypassLocalRate: true });
          } else {
            await this.#trackGroup(state, chat);
            if (!state.groupSettings[groupId]) {
              state.groupSettings[groupId] = {
                botEnabled: true, chatterEnabled: false, chatterNextAt: 0,
                jokesEnabled: this.#db(state)?.groupSettings?.defaultJokesEnabled !== false,
                chatbotEnabled: this.#db(state)?.groupSettings?.defaultChatbotEnabled !== false,
              };
            }
            if (message.left_chat_member) {
              const departed = message.left_chat_member;
              const transitioned = this.#markMemberLeft(state, chat, departed);
              if (transitioned) await this.#sendGoodbye(state, chat, departed);
            }
            if (message.new_chat_members?.length) await this.#handleNewMembers(state, message);
            await this.#handleGroupMessage(state, { ...message, update_id: updateId });
            state.groupUsage[groupId] = Math.max(0, Number(state.groupUsage[groupId] || 0)) + 1;
            await this.#save(state);
          }
        } else if (isPrivate(chat)) {
          await this.#handlePrivateMessage(state, { ...message, update_id: updateId });
        }
      }
    }

  }

  async #scheduleNext(state) {
    const due = [];
    const welcomeDue = (state.welcomeQueue || []).map((item) => Number(item.dueAt || 0)).filter((time) => time > 0);
    if (welcomeDue.length) due.push(Math.min(...welcomeDue));
    const queueMeta = await this.ctx.storage.get("queue:v1:meta");
    if (Number(queueMeta?.pendingCount || 0) > 0) {
      const queuedRows = await this.ctx.storage.list({ prefix: "queue:v1:item:", limit: 512 });
      const queueDue = [...queuedRows.values()].map((item) => {
        const retryAt = Number(item?.retryAt || 0);
        return retryAt > Date.now() ? retryAt : Date.now() + 100;
      });
      due.push(queueDue.length ? Math.min(...queueDue) : Date.now() + 100);
    }
    if (state.forwardTask?.active) due.push(Number(state.forwardTask.nextAt || Date.now() + 1_000));
    if (state.broadcastQueue && Number(state.broadcastQueue.index || 0) < (state.broadcastQueue.chatIds || []).length) {
      due.push(Math.max(Date.now() + 250, Number(state.broadcastQueue.nextAt || Date.now() + 1_200)));
    }
    {
      for (const [chatId, settings] of Object.entries(state.groupSettings || {})) {
        if (this.#featureEnabled(state, "chatter", chatId) && settings.chatterEnabled && settings.chatterNextAt) due.push(Number(settings.chatterNextAt));
      }
    }
    if (Object.keys(state.resourceRegistry || {}).length || (state.pendingResourceCleanup || []).length || (state.pendingResourceKeyCleanup || []).length) {
      if (!state.maintenanceNextAt) state.maintenanceNextAt = Date.now() + 30 * 60_000;
      due.push(Number(state.maintenanceNextAt));
    }
    const verificationExpiries = Object.values(state.pendingVerifications || {}).map((item) => Number(item.expiresAt || 0)).filter((time) => time > Date.now());
    if (verificationExpiries.length) due.push(Math.min(...verificationExpiries));
    if (due.length) {
      const target = Math.max(Date.now() + 250, Math.min(...due));
      const current = await this.ctx.storage.getAlarm();
      if (!Number.isFinite(current) || Math.abs(current - target) > 1_000) await this.ctx.storage.setAlarm(target);
    } else if (await this.ctx.storage.getAlarm()) {
      await this.ctx.storage.deleteAlarm();
    }
  }

  async #runForward(state, now) {
    const task = state.forwardTask;
    if (!task?.active || Number(task.nextAt || 0) > now) return;
    if (!this.#featureEnabled(state, "forwarding")) {
      task.active = false;
      task.stoppedAt = now;
      await this.#save(state);
      return;
    }

    if (["channel"].includes(String(task.targetType || "").toLowerCase())) {
      task.active = false;
      task.stoppedAt = now;
      task.stopReason = "channel_publishing_disabled_in_v4_2";
      await this.#save(state);
      if (this.#ownerId(state)) await this.#send(this.#ownerId(state), "⚠️ A legacy schedule targeting a channel was stopped because direct channel publishing is disabled in this version. Schedule details remain in state.", state, {}, { bypassLocalRate: true });
      return;
    }
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
      if (task.remaining != null) {
        task.remaining -= 1;
        if (task.remaining <= 0) {
          task.active = false;
          task.completedAt = now;
          await this.#save(state);
          await this.#send(this.#ownerId(state), renderTemplate(this.#text(state, "forward.completed", "✅ Forwarding completed. Successful: {sent}"), { sent: task.sent }), state);
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
      await this.#send(this.#ownerId(state), renderTemplate(this.#text(state, "forward.failed", "❌ The schedule stopped. Code: {code}; reason: {reason}"), {
        code: code || "Unknown", reason: asText(result.description || "Telegram error").slice(0, 160),
      }), state);
      return;
    }
    task.nextAt = now + Math.min(15 * 60_000, task.failures * 60_000);
    await this.#save(state);
  }

  async #runChatter(state, now) {
    const db = this.#db(state);
    const feature = db?.features?.chatter || {};
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
      if (!settings.chatterEnabled || settings.botEnabled === false || !this.#featureEnabled(state, "chatter", chatId) || Number(settings.chatterNextAt || 0) > now) continue;
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

  #recordTargetBroadcastUsage(state, chatId) {
    const id = String(chatId);
    const month = new Date().toISOString().slice(0, 7);
    state.targetUsage ||= {};
    const current = state.targetUsage[id];
    if (!current || current.month !== month) state.targetUsage[id] = { month, used: 0 };
    state.targetUsage[id].used = Math.max(0, Number(state.targetUsage[id].used || 0)) + 1;
    state.targetUsage[id].updatedAt = Date.now();
  }

  #broadcastTargetDecision(state, chatId) {
    const db = this.#db(state) || {};
    const config = db.ownerBroadcast || {};
    const record = this.#targetRecord(state, chatId);
    if (config.enabled === false) return { allowed: false, reason: "broadcast_disabled" };
    if (!record) return { allowed: true, reason: "legacy_or_untracked" };
    const type = record.targetType === "channel" ? "channels" : "groups";
    if (Array.isArray(config.targets) && !config.targets.includes(type)) return { allowed: false, reason: "target_type_disabled" };
    const policy = state.targetPolicies?.[String(chatId)] || {};
    const usage = this.#targetUsageSnapshot(state, chatId);
    if (state.blockedGroups.includes(String(chatId)) || state.leftGroups.includes(String(chatId))
      || ["left", "kicked"].includes(String(record.botStatus || "").toLowerCase())) {
      return { allowed: false, reason: "bot_not_member" };
    }
    const tier = String(policy.tier || config.defaultTier || "FREE").toUpperCase();
    const quotaFromTier = Number(config.monthlyQuotaByTier?.[tier] ?? db.limits?.chatTiers?.[tier]?.monthlyBroadcasts ?? 1_000);
    const quota = policy.monthlyQuotaOverride == null ? quotaFromTier : Number(policy.monthlyQuotaOverride);
    const active = policy.active == null ? config.defaultActive !== false : policy.active !== false;
    if (!active) return { allowed: false, reason: "target_inactive", tier, quota, used: usage.used };
    if (quota >= 0 && usage.used >= quota) return { allowed: false, reason: "monthly_quota_exceeded", tier, quota, used: usage.used };
    return { allowed: true, tier, quota, used: usage.used };
  }

  async #runBroadcast(state, now) {
    const queue = state.broadcastQueue;
    if (!queue) return;
    const ids = Array.isArray(queue.chatIds) ? queue.chatIds : [];
    const index = Math.max(0, Number(queue.index) || 0);
    if (index >= ids.length) {
      const sent = Number(queue.sent || 0);
      const failed = Number(queue.failed || 0);
      const skipped = Number(queue.skipped || 0);
      state.broadcastQueue = null;
      await this.#save(state);
      if (this.#ownerId(state)) await this.#send(this.#ownerId(state), `BROADCAST COMPLETED\nSent: ${sent}\nFailed: ${failed}\nSkipped: ${skipped}`, state, {}, { bypassLocalRate: true });
      return;
    }
    const chatId = ids[index];
    const targetDecision = this.#broadcastTargetDecision(state, chatId);
    if (!targetDecision.allowed) {
      queue.skipped = Number(queue.skipped || 0) + 1;
      queue.lastSkipReason = targetDecision.reason;
      queue.index = index + 1;
      queue.nextAt = now + 250;
      await this.#save(state);
      await this.ctx.storage.setAlarm(queue.nextAt);
      return;
    }
    let result;
    if (queue.hasMedia) {
      result = await this.#telegram(state, "copyMessage", {
        chat_id: chatId, from_chat_id: queue.sourceChatId, message_id: queue.sourceMessageId,
      }, { group: true, minIntervalMs: 3_500 });
    } else {
      result = await this.#send(chatId, queue.text || " ", state, {}, { group: true, minIntervalMs: 3_500 });
    }
    const retryAfter = Number(result.parameters?.retry_after || 0);
    if (!result.ok && (Number(result.error_code) === 429 || result.description === "LOCAL_ANTI_SPAM_RATE_LIMIT")) {
      queue.nextAt = now + Math.max(3_500, retryAfter * 1_000 || 3_500);
      await this.#save(state);
      await this.ctx.storage.setAlarm(queue.nextAt);
      return;
    }
    if (result.ok) {
      queue.sent = Number(queue.sent || 0) + 1;
      state.groupUsage[String(chatId)] = Number(state.groupUsage[String(chatId)] || 0) + 1;
      this.#recordTargetBroadcastUsage(state, chatId);
    } else {
      queue.failed = Number(queue.failed || 0) + 1;
      queue.lastError = asText(result.description || "unknown").slice(0, 120);
    }
    queue.index = index + 1;
    queue.nextAt = now + 3_500;
    await this.#save(state);
    await this.ctx.storage.setAlarm(queue.nextAt);
  }

  async alarm(alarmInfo = {}) {
    return this.#exclusive(() => this.#alarmInner(alarmInfo));
  }

  async #alarmInner(alarmInfo = {}) {
    let state = await this.#load();
    const now = Date.now();
    console.log(JSON.stringify({ event: "durable_alarm_started", retryCount: Number(alarmInfo?.retryCount || 0), isRetry: Boolean(alarmInfo?.isRetry) }));
    try {
      const drained = await this.#drainUpdateQueue(clampNumber(this.#db(state)?.limits?.queueBatchSize, 8, 1, 16));
      console.log(JSON.stringify({ event: "durable_alarm_queue_drained", processed: Number(drained || 0) }));
    } catch (error) {
      console.error(JSON.stringify({ event: "durable_update_queue_batch_failed", error: asText(error?.message || error).slice(0, 180) }));
    }
    state = await this.#load();
    if (state.settings?.botEnabled === false) {
      await this.#scheduleNext(state);
      console.log(JSON.stringify({ event: "durable_alarm_bot_disabled_queue_maintenance_only" }));
      return;
    }
    try {
      await this.#completeResourceCleanup(state, 256);
    } catch (error) {
      console.error("Resource cleanup batch failed; will retry", error);
      state.maintenanceNextAt = Date.now() + 60_000;
      await this.#save(state);
    }
    await this.#sweepResources(state, now);
    await this.#runBroadcast(state, now);
    await this.#runForward(state, now);
    await this.#runChatter(state, now);
    await this.#expireVerifications(state, now);
    await this.#runWelcomeQueue(state, now);
    await this.#scheduleNext(state);
  }

}


export class ForwardScheduler extends DurableObject {
  constructor(ctx, env) {
    super(ctx, env);
    this.runtime = new ForwardSchedulerRuntime(ctx, env || {});
  }

  handleUpdate(update) { return this.runtime.handleUpdate(update); }
  alarm(alarmInfo) { return this.runtime.alarm(alarmInfo); }

  async claimIntegrationCheck(now, intervalMs, version) {
    return this.ctx.storage.transaction(async (txn) => {
      const storedVersion = await txn.get("integration:version");
      const lastSuccessAt = Number(await txn.get("integration:lastSuccessAt") || 0);
      const lastAttemptAt = Number(await txn.get("integration:lastAttemptAt") || 0);
      const force = storedVersion !== version;
      if (!force && lastSuccessAt && now - lastSuccessAt < intervalMs) return { run: false, reason: "check_interval" };
      if (lastAttemptAt && now - lastAttemptAt < 55_000) return { run: false, reason: "attempt_cooldown" };
      await txn.put("integration:lastAttemptAt", now);
      return { run: true, force };
    });
  }

  async finishIntegrationCheck(result) {
    await this.ctx.storage.transaction(async (txn) => {
      await txn.put("integration:lastResult", {
        ok: Boolean(result?.ok),
        checkedAt: Number(result?.checkedAt || Date.now()),
        version: String(result?.version || BUILD_VERSION),
        botUsername: result?.botUsername || null,
        webhookUrl: result?.webhookUrl || null,
        pendingUpdates: Number(result?.pendingUpdates || 0),
        lastWebhookError: result?.lastWebhookError || null,
        error: result?.error || null,
      });
      if (result?.ok) {
        await txn.put("integration:version", String(result.version || BUILD_VERSION));
        await txn.put("integration:lastSuccessAt", Number(result.checkedAt || Date.now()));
      } else {
        // Retry on the next cron tick after an integration failure.
        await txn.put("integration:lastAttemptAt", Date.now() - 55_000);
      }
    });
  }

  async getDiagnostics() {
    const [queue, integration, state, manifest, alarmAt] = await Promise.all([
      this.ctx.storage.get("queue:v1:meta"),
      this.ctx.storage.get("integration:lastResult"),
      this.ctx.storage.get("state"),
      this.ctx.storage.get("database:v1:manifest"),
      this.ctx.storage.getAlarm(),
    ]);
    return {
      ok: true,
      queue: {
        pendingCount: Number(queue?.pendingCount || 0),
        lastReceivedAt: Number(queue?.lastReceivedAt || 0) || null,
        lastReceivedUpdateId: Number(queue?.lastReceivedUpdateId || 0) || null,
        lastReceivedType: queue?.lastReceivedType || null,
        lastProcessedAt: Number(queue?.lastProcessedAt || 0) || null,
        lastProcessedUpdateId: Number(queue?.lastProcessedUpdateId || 0) || null,
      },
      integration: integration || null,
      settings: {
        botEnabled: state?.settings?.botEnabled !== false,
        cacheEnabled: state?.settings?.cacheEnabled !== false,
        autoUpdate: state?.settings?.autoUpdate !== false,
      },
      database: { installed: Boolean(manifest?.hash), bytes: Number(manifest?.bytes || 0), chunks: Number(manifest?.chunks || 0) },
      nextAlarmAt: Number(alarmAt || 0) || null,
    };
  }
}

function getTelegramUpdateType(update) {
  if (!update || typeof update !== "object") return "unknown";
  return Object.keys(update).find((key) => key !== "update_id") || "unknown";
}

function jsonResponse(value, status = 200) {
  return new Response(JSON.stringify(value, null, 2), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store, max-age=0",
      "x-content-type-options": "nosniff",
    },
  });
}

async function telegramControlApi(env, method, payload = {}) {
  const data = await requestTelegramApi(env, method, payload, { timeoutMs: TELEGRAM_TIMEOUT_MS });
  if (!data?.ok) {
    const description = redactBotToken(data?.description || `HTTP_${data?.error_code || 502}`, env).slice(0, 180);
    throw new Error(`TELEGRAM_${method.toUpperCase()}_FAILED:${description}`);
  }
  return data.result;
}

async function syncTelegramCommands(env, force = false) {
  const ownerId = ownerIdFrom(env);
  if (!ownerId) throw new Error("OWNER_TELEGRAM_ID_MISSING_OR_INVALID");
  const ownerScope = { type: "chat", chat_id: Number(ownerId) };
  if (force) {
    const scopes = [
      null,
      { type: "all_private_chats" },
      { type: "all_chat_administrators" },
      ownerScope,
    ];
    for (const scope of scopes) {
      await telegramControlApi(env, "deleteMyCommands", scope ? { scope } : {});
    }
  }
  const existing = await telegramControlApi(env, "getMyCommands", { scope: ownerScope });
  const expected = [
    { command: "settings", description: "Open owner settings" },
    { command: "admin", description: "Open owner control panel" },
  ];
  const correct = Array.isArray(existing) && expected.every((item) => existing.some((current) => current.command === item.command));
  if (force || !correct) {
    await telegramControlApi(env, "setMyCommands", { scope: ownerScope, commands: expected });
  }
}

async function ensureTelegramIntegration(env, force = false) {
  const webhookUrl = webhookUrlFrom(env);
  const webhookSecret = webhookSecretFrom(env);
  if (!webhookUrl || !/^https:\/\//i.test(webhookUrl)) throw new Error("WEBHOOK_URL_MISSING_OR_INVALID");
  if (!webhookSecret || webhookSecret.length < 16) throw new Error("WEBHOOK_SECRET_MISSING_OR_INVALID");
  if (!ownerIdFrom(env)) throw new Error("OWNER_TELEGRAM_ID_MISSING_OR_INVALID");

  const me = await telegramControlApi(env, "getMe");
  if (!me?.id || !me?.is_bot) throw new Error("TELEGRAM_GET_ME_INVALID_RESULT");
  const current = await telegramControlApi(env, "getWebhookInfo");
  const currentAllowed = Array.isArray(current?.allowed_updates) ? [...current.allowed_updates].sort() : [];
  const expectedAllowed = [...TELEGRAM_UPDATE_TYPES].sort();
  const needsWebhookUpdate = force || current?.url !== webhookUrl
    || JSON.stringify(currentAllowed) !== JSON.stringify(expectedAllowed);
  if (needsWebhookUpdate) {
    await telegramControlApi(env, "setWebhook", {
      url: webhookUrl,
      secret_token: webhookSecret,
      max_connections: WEBHOOK_MAX_CONNECTIONS,
      allowed_updates: TELEGRAM_UPDATE_TYPES,
      drop_pending_updates: false,
    });
  }
  await syncTelegramCommands(env, force);
  const verified = await telegramControlApi(env, "getWebhookInfo");
  if (verified?.url !== webhookUrl) throw new Error("TELEGRAM_WEBHOOK_VERIFICATION_FAILED");
  return {
    ok: true,
    botId: me.id,
    botUsername: me.username || null,
    webhookUrl: verified.url,
    pendingUpdates: Number(verified.pending_update_count || 0),
    maxConnections: Number(verified.max_connections || WEBHOOK_MAX_CONNECTIONS),
    allowedUpdateCount: Array.isArray(verified.allowed_updates) ? verified.allowed_updates.length : 0,
    lastWebhookError: verified.last_error_message || null,
  };
}

async function runScheduledBootstrap(env, reason = "cron") {
  const startedAt = Date.now();
  let stub = null;
  console.log(JSON.stringify({ event: "telegram_integration_bootstrap_started", reason, version: BUILD_VERSION }));
  try {
    stub = env.SCHEDULER.get(env.SCHEDULER.idFromName(DO_NAME));
    const claim = await stub.claimIntegrationCheck(startedAt, WEBHOOK_CHECK_INTERVAL_MS, BUILD_VERSION);
    if (!claim?.run) {
      console.log(JSON.stringify({ event: "telegram_integration_bootstrap_skipped", reason, skipReason: claim?.reason || "interval" }));
      return { skipped: true, reason: claim?.reason || "interval" };
    }
    const result = await ensureTelegramIntegration(env, Boolean(claim.force));
    await stub.finishIntegrationCheck({ ...result, checkedAt: Date.now(), version: BUILD_VERSION });
    console.log(JSON.stringify({ event: "telegram_integration_ready", reason, ...result }));
    return result;
  } catch (error) {
    const message = redactBotToken(error, env).slice(0, 220);
    if (stub) {
      try {
        await stub.finishIntegrationCheck({ ok: false, checkedAt: Date.now(), version: BUILD_VERSION, error: message });
      } catch (storageError) {
        console.error(JSON.stringify({ event: "telegram_integration_error_state_write_failed", reason, error: String(storageError?.message || storageError).slice(0, 160) }));
      }
    }
    console.error(JSON.stringify({ event: "telegram_integration_failed", reason, error: message }));
    return { ok: false, error: message };
  }
}

async function repairTelegramIntegrationFromHealth(env) {
  const reason = "healthz_self_heal";
  const startedAt = Date.now();
  let stub = null;
  console.log(JSON.stringify({ event: "telegram_healthcheck_bootstrap_started", reason }));
  try {
    stub = env.SCHEDULER.get(env.SCHEDULER.idFromName(DO_NAME));
    const result = await ensureTelegramIntegration(env, true);
    await stub.finishIntegrationCheck({ ...result, checkedAt: Date.now(), version: BUILD_VERSION });
    console.log(JSON.stringify({ event: "telegram_healthcheck_bootstrap_ready", durationMs: Date.now() - startedAt, ...result }));
    return { ok: true, ...result };
  } catch (error) {
    const message = redactBotToken(error, env).slice(0, 220);
    if (stub) {
      try {
        await stub.finishIntegrationCheck({ ok: false, checkedAt: Date.now(), version: BUILD_VERSION, error: message });
      } catch (storageError) {
        console.error(JSON.stringify({ event: "telegram_healthcheck_error_state_write_failed", error: String(storageError?.message || storageError).slice(0, 160) }));
      }
    }
    console.error(JSON.stringify({ event: "telegram_healthcheck_bootstrap_failed", durationMs: Date.now() - startedAt, error: message }));
    return { ok: false, error: message };
  }
}

function response(text, status = 200) {
  return new Response(text, {
    status,
    headers: {
      "content-type": "text/plain; charset=utf-8",
      "cache-control": "no-store",
    },
  });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const requestId = request.headers.get("cf-ray") || crypto.randomUUID();

    if (request.method === "GET" && (url.pathname === "/" || url.pathname === "/healthz")) {
      // Health checks are also a recovery path: if Cron has not fired yet, an
      // operator opening /healthz can still register and verify the webhook.
      const beforeRepair = await telegramControlApi(env, "getWebhookInfo").catch((error) => ({
        url: "",
        _error: redactBotToken(error, env).slice(0, 180),
      }));
      let bootstrap = null;
      if (beforeRepair?.url !== webhookUrlFrom(env)) {
        bootstrap = await repairTelegramIntegrationFromHealth(env);
      }
      const stub = env.SCHEDULER.get(env.SCHEDULER.idFromName(DO_NAME));
      const [telegram, webhook, scheduler] = await Promise.all([
        telegramControlApi(env, "getMe").then((result) => ({
          ok: true,
          id: result.id,
          username: result.username || null,
        })).catch((error) => ({ ok: false, error: String(error?.message || error).slice(0, 180) })),
        telegramControlApi(env, "getWebhookInfo").then((result) => ({
          ok: true,
          url: result.url || "",
          expectedUrl: webhookUrlFrom(env),
          matchesExpectedUrl: result.url === webhookUrlFrom(env),
          pendingUpdates: Number(result.pending_update_count || 0),
          lastErrorAt: Number(result.last_error_date || 0) || null,
          lastError: result.last_error_message || null,
          allowedUpdateCount: Array.isArray(result.allowed_updates) ? result.allowed_updates.length : 0,
        })).catch((error) => ({ ok: false, error: String(error?.message || error).slice(0, 180) })),
        stub.getDiagnostics().catch((error) => ({ ok: false, error: String(error?.message || error).slice(0, 180) })),
      ]);
      const ok = Boolean(telegram.ok && webhook.ok && scheduler.ok && webhook.matchesExpectedUrl && (!bootstrap || bootstrap.ok));
      return jsonResponse({
        service: "Forward Scheduler",
        version: BUILD_VERSION,
        status: ok ? "operational" : "degraded",
        requestId,
        worker: "online",
        ownerConfigured: Boolean(ownerIdFrom(env)),
        telegram,
        webhook,
        scheduler,
        bootstrap,
        checkedAt: new Date().toISOString(),
      }, ok ? 200 : 503);
    }

    if (request.method === "POST" && url.pathname === "/telegram/webhook") {
      console.log(JSON.stringify({
        event: "telegram_webhook_request_received",
        requestId,
        method: request.method,
        path: url.pathname,
        contentLength: Number(request.headers.get("content-length") || 0),
        hasSecretHeader: request.headers.has("x-telegram-bot-api-secret-token"),
      }));

      const suppliedSecret = request.headers.get("x-telegram-bot-api-secret-token") || "";
      if (!webhookSecretFrom(env) || suppliedSecret !== webhookSecretFrom(env)) {
        console.error(JSON.stringify({ event: "telegram_webhook_rejected", requestId, reason: "secret_mismatch" }));
        return response("Unauthorized", 401);
      }

      const contentLength = Number(request.headers.get("content-length") || 0);
      if (Number.isFinite(contentLength) && contentLength > 1_000_000) {
        console.error(JSON.stringify({ event: "telegram_webhook_rejected", requestId, reason: "payload_too_large", contentLength }));
        return response("Payload too large", 413);
      }

      let update;
      try {
        const rawBody = await request.text();
        const actualBytes = new TextEncoder().encode(rawBody).byteLength;
        if (actualBytes > 1_000_000) {
          console.error(JSON.stringify({ event: "telegram_webhook_rejected", requestId, reason: "payload_too_large", actualBytes }));
          return response("Payload too large", 413);
        }
        update = JSON.parse(rawBody);
      } catch (error) {
        console.error(JSON.stringify({ event: "telegram_webhook_invalid_json", requestId, error: String(error?.message || error).slice(0, 120) }));
        return response("Invalid JSON", 400);
      }
      if (!update || !Number.isSafeInteger(update.update_id) || update.update_id < 0) {
        console.error(JSON.stringify({ event: "telegram_webhook_invalid_update", requestId }));
        return response("Invalid Telegram update", 400);
      }

      const updateType = getTelegramUpdateType(update);
      try {
        const stub = env.SCHEDULER.get(env.SCHEDULER.idFromName(DO_NAME));
        const accepted = await stub.handleUpdate(update);
        if (!accepted?.queued) {
          console.error(JSON.stringify({
            event: "telegram_webhook_queue_rejected",
            requestId,
            updateId: update.update_id,
            updateType,
            reason: String(accepted?.reason || "UPDATE_QUEUE_REJECTED").slice(0, 120),
          }));
          return response("Temporary queue failure", 503);
        }
        console.log(JSON.stringify({
          event: "telegram_webhook_update_accepted",
          requestId,
          updateId: update.update_id,
          updateType,
          duplicate: Boolean(accepted.duplicate),
          pendingCount: Number(accepted.pendingCount || 0),
        }));
        return response("ok");
      } catch (error) {
        console.error(JSON.stringify({
          event: "telegram_webhook_durable_object_error",
          requestId,
          updateId: update.update_id,
          updateType,
          error: String(error?.message || error).slice(0, 180),
        }));
        return response("Temporary queue error", 503);
      }
    }

    console.log(JSON.stringify({ event: "worker_route_not_found", requestId, method: request.method, path: url.pathname }));
    return response("Not Found", 404);
  },

  async scheduled(controller, env, ctx) {
    const reason = `cron:${controller.cron || "unknown"}`;
    console.log(JSON.stringify({ event: "cron_invocation_received", reason, scheduledTime: controller.scheduledTime || null }));
    ctx.waitUntil(runScheduledBootstrap(env, reason));
  },
};
