const FORBIDDEN_KEYS = new Set(["__proto__", "prototype", "constructor"]);
const ACTION_TYPES = new Set([
  "telegram.call", "api.call", "http.request",
  "state.get", "state.set", "state.delete", "state.increment", "state.list",
  "context.set", "context.merge", "condition", "each", "while", "workflow.run",
  "queue.enqueue", "queue.list", "queue.stats", "queue.retry", "queue.cancel", "conversation.start", "conversation.end", "conversation.update",
  "quota.get", "quota.consume", "runtime.status", "runtime.logs", "runtime.control", "log.write", "flow.return", "try", "throw",
]);

export class DatabaseParseError extends Error {
  constructor(code, offset = 0) {
    super(`${code} at ${offset}`);
    this.name = "DatabaseParseError";
    this.code = code;
    this.offset = offset;
  }
}

class DataOnlyParser {
  constructor(source, limits = {}) {
    this.source = String(source ?? "").replace(/^\uFEFF/, "");
    this.i = 0;
    this.nodes = 0;
    this.maxDepth = limits.maxDepth ?? 64;
    this.maxNodes = limits.maxNodes ?? 200_000;
  }

  fail(code) { throw new DatabaseParseError(code, this.i); }

  skip() {
    while (this.i < this.source.length) {
      const c = this.source[this.i];
      if (/\s/.test(c)) { this.i++; continue; }
      if (c === "/" && this.source[this.i + 1] === "/") {
        this.i += 2;
        while (this.i < this.source.length && !/[\r\n]/.test(this.source[this.i])) this.i++;
        continue;
      }
      if (c === "/" && this.source[this.i + 1] === "*") {
        const end = this.source.indexOf("*/", this.i + 2);
        if (end < 0) this.fail("unclosed_comment");
        this.i = end + 2;
        continue;
      }
      break;
    }
  }

  count() {
    this.nodes++;
    if (this.nodes > this.maxNodes) this.fail("node_limit_exceeded");
  }

  word(value) {
    this.skip();
    if (!this.source.startsWith(value, this.i)) return false;
    const before = this.source[this.i - 1] || "";
    const after = this.source[this.i + value.length] || "";
    if (/[A-Za-z0-9_$]/.test(before) || /[A-Za-z0-9_$]/.test(after)) return false;
    this.i += value.length;
    return true;
  }

  readString(quote) {
    this.i++;
    let out = "";
    while (this.i < this.source.length) {
      const c = this.source[this.i++];
      if (c === quote) return out;
      if (c === "\n" || c === "\r") {
        if (quote !== "`") this.fail("unescaped_line_break");
        out += c;
        continue;
      }
      if (c !== "\\") {
        if (quote === "`" && c === "$" && this.source[this.i] === "{") this.fail("template_expression_forbidden");
        out += c;
        continue;
      }
      if (this.i >= this.source.length) this.fail("invalid_escape");
      const e = this.source[this.i++];
      const simple = { n: "\n", r: "\r", t: "\t", b: "\b", f: "\f", v: "\v", 0: "\0" };
      if (Object.hasOwn(simple, e)) { out += simple[e]; continue; }
      if (e === "\\" || e === "'" || e === '"' || e === "`") { out += e; continue; }
      if (e === "\n") continue;
      if (e === "\r") { if (this.source[this.i] === "\n") this.i++; continue; }
      if (e === "x") {
        const hex = this.source.slice(this.i, this.i + 2);
        if (!/^[\da-fA-F]{2}$/.test(hex)) this.fail("invalid_hex_escape");
        out += String.fromCharCode(parseInt(hex, 16)); this.i += 2; continue;
      }
      if (e === "u") {
        if (this.source[this.i] === "{") {
          const end = this.source.indexOf("}", this.i + 1);
          if (end < 0) this.fail("invalid_unicode_escape");
          const hex = this.source.slice(this.i + 1, end);
          if (!/^[\da-fA-F]{1,6}$/.test(hex)) this.fail("invalid_unicode_escape");
          const cp = parseInt(hex, 16);
          if (cp > 0x10ffff) this.fail("invalid_unicode_escape");
          out += String.fromCodePoint(cp); this.i = end + 1; continue;
        }
        const hex = this.source.slice(this.i, this.i + 4);
        if (!/^[\da-fA-F]{4}$/.test(hex)) this.fail("invalid_unicode_escape");
        out += String.fromCharCode(parseInt(hex, 16)); this.i += 4; continue;
      }
      this.fail("unsupported_escape");
    }
    this.fail("unterminated_string");
  }

  readIdentifier() {
    this.skip();
    const match = /^[A-Za-z_$][A-Za-z0-9_$]*/.exec(this.source.slice(this.i));
    if (!match) this.fail("expected_identifier");
    this.i += match[0].length;
    return match[0];
  }

  parseRoot() {
    this.skip();
    if (this.word("export")) {
      if (!this.word("default")) this.fail("expected_export_default");
    } else if (this.word("module")) {
      this.skip();
      if (this.source[this.i++] !== ".") this.fail("expected_module_exports");
      if (this.readIdentifier() !== "exports") this.fail("expected_module_exports");
      this.skip();
      if (this.source[this.i++] !== "=") this.fail("expected_assignment");
    }
    const value = this.value(0);
    if (!value || typeof value !== "object" || Array.isArray(value)) this.fail("root_must_be_object");
    this.skip();
    if (this.source[this.i] === ";") this.i++;
    this.skip();
    if (this.i !== this.source.length) this.fail("trailing_executable_content");
    return value;
  }

  value(depth) {
    if (depth > this.maxDepth) this.fail("depth_limit_exceeded");
    this.count(); this.skip();
    const c = this.source[this.i];
    if (c === "{") return this.object(depth + 1);
    if (c === "[") return this.array(depth + 1);
    if (c === "'" || c === '"' || c === "`") return this.readString(c);
    if (c === "-" || /\d/.test(c || "")) return this.number();
    for (const [name, value] of [["true", true], ["false", false], ["null", null]]) {
      if (this.word(name)) return value;
    }
    this.fail("unsupported_value_expression");
  }

  number() {
    this.skip();
    const match = /^-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?/.exec(this.source.slice(this.i));
    if (!match) this.fail("invalid_number");
    this.i += match[0].length;
    const value = Number(match[0]);
    if (!Number.isFinite(value)) this.fail("non_finite_number");
    return value;
  }

  object(depth) {
    this.i++;
    const out = Object.create(null);
    this.skip();
    if (this.source[this.i] === "}") { this.i++; return out; }
    while (this.i < this.source.length) {
      this.skip();
      const c = this.source[this.i];
      let key;
      if (c === "'" || c === '"' || c === "`") key = this.readString(c);
      else key = this.readIdentifier();
      if (FORBIDDEN_KEYS.has(key)) this.fail("unsafe_object_key");
      this.skip();
      if (this.source[this.i++] !== ":") this.fail("expected_colon");
      if (Object.hasOwn(out, key)) this.fail("duplicate_object_key");
      out[key] = this.value(depth);
      this.skip();
      if (this.source[this.i] === "}") { this.i++; return out; }
      if (this.source[this.i++] !== ",") this.fail("expected_object_comma");
      this.skip();
      if (this.source[this.i] === "}") { this.i++; return out; }
    }
    this.fail("unclosed_object");
  }

  array(depth) {
    this.i++;
    const out = [];
    this.skip();
    if (this.source[this.i] === "]") { this.i++; return out; }
    while (this.i < this.source.length) {
      out.push(this.value(depth));
      this.skip();
      if (this.source[this.i] === "]") { this.i++; return out; }
      if (this.source[this.i++] !== ",") this.fail("expected_array_comma");
      this.skip();
      if (this.source[this.i] === "]") { this.i++; return out; }
    }
    this.fail("unclosed_array");
  }
}

export function parseDatabaseModule(source, limits = {}) {
  const maxBytes = limits.maxBytes ?? 1_500_000;
  if (typeof source !== "string") throw new DatabaseParseError("source_must_be_text");
  if (new TextEncoder().encode(source).byteLength > maxBytes) throw new DatabaseParseError("database_too_large");
  return new DataOnlyParser(source, limits).parseRoot();
}

function isPlainObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function assert(condition, code) {
  if (!condition) throw new Error(`database_validation:${code}`);
}

function validateActionList(actions, path, db, depth = 0) {
  assert(Array.isArray(actions), `${path}_must_be_array`);
  assert(actions.length <= 250, `${path}_action_limit`);
  assert(depth <= 12, `${path}_nesting_limit`);
  for (let i = 0; i < actions.length; i++) {
    const action = actions[i];
    assert(isPlainObject(action), `${path}_${i}_must_be_object`);
    const type = String(action.type || "");
    assert(ACTION_TYPES.has(type), `${path}_${i}_unknown_action_${type || "empty"}`);
    if (type === "condition") {
      validateActionList(action.then || [], `${path}_${i}_then`, db, depth + 1);
      validateActionList(action.else || [], `${path}_${i}_else`, db, depth + 1);
    }
    if (type === "each" || type === "while") {
      validateActionList(action.actions || [], `${path}_${i}_actions`, db, depth + 1);
    }
    if (type === "try") {
      validateActionList(action.actions || [], `${path}_${i}_try`, db, depth + 1);
      validateActionList(action.catch || [], `${path}_${i}_catch`, db, depth + 1);
      validateActionList(action.finally || [], `${path}_${i}_finally`, db, depth + 1);
    }
    if (type === "telegram.call") {
      assert(typeof action.method === "string" && /^[A-Za-z][A-Za-z0-9]{1,80}$/.test(action.method), `${path}_${i}_telegram_method_invalid`);
      assert(action.payload === undefined || isPlainObject(action.payload), `${path}_${i}_telegram_payload_invalid`);
      assert(action.files === undefined || isPlainObject(action.files), `${path}_${i}_telegram_files_invalid`);
    }
    if (type === "http.request") assert(isPlainObject(action.request) && typeof action.request.url === "string", `${path}_${i}_http_request_invalid`);
    if (type.startsWith("state.")) assert(["global", "chat", "user", "chat_user"].includes(action.scope || (type === "state.list" ? "global" : "chat")), `${path}_${i}_state_scope_invalid`);
    if (type === "context.set") assert(typeof action.path === "string" && action.path.length <= 300 && !UNSAFE_PATH.test(action.path), `${path}_${i}_context_path_invalid`);
    if (type === "each" || type === "while") {
      if (action.limit !== undefined) assert(Number.isInteger(action.limit) && action.limit >= 1 && action.limit <= 500, `${path}_${i}_loop_limit_invalid`);
      if (type === "each") assert(typeof action.as === "string" && action.as.length <= 80, `${path}_${i}_each_alias_required`);
    }
    if (type === "workflow.run") assert(typeof action.workflow === "string" && Object.hasOwn(db.workflows || {}, action.workflow), `${path}_${i}_workflow_missing`);
    if (type === "api.call") assert(typeof action.api === "string" && Object.hasOwn(db.apis || {}, action.api), `${path}_${i}_api_missing`);
    if (type === "queue.enqueue") assert(typeof action.workflow === "string" && Object.hasOwn(db.workflows || {}, action.workflow), `${path}_${i}_queue_workflow_missing`);
    if (type === "conversation.start") assert(typeof action.workflow === "string" && Object.hasOwn(db.workflows || {}, action.workflow), `${path}_${i}_conversation_workflow_missing`);
    if (type === "runtime.control") assert(["pause", "resume", "status"].includes(action.operation), `${path}_${i}_runtime_operation_invalid`);
  }
}

export function validateDatabase(database) {
  assert(isPlainObject(database), "root_object_required");
  assert(isPlainObject(database.manifest), "manifest_required");
  assert(String(database.manifest.name || "").trim().toUpperCase() === "MUNITOS", "manifest_name_must_be_MUNITOS");
  assert(typeof database.manifest.version === "string" && database.manifest.version.length <= 64, "manifest_version_required");
  assert(Number(database.manifest.schemaVersion || 0) === 1, "unsupported_schema_version");

  const sections = [
    "settings", "commands", "workflows", "apis", "quotas", "menus", "policies",
    "messages", "integrations", "storage", "lifecycle", "profile", "migrations",
    "telegram", "modules", "features", "authorization", "roles", "permissions",
    "groups", "channels", "templates", "keyboards", "panels", "automations",
    "queues", "resources", "limits", "errorHandling", "logging",
  ];
  for (const section of sections) assert(isPlainObject(database[section] ?? {}), `${section}_must_be_object`);
  const webhook = database.telegram?.webhook || {};
  if (webhook.allowedUpdates !== undefined) {
    assert(Array.isArray(webhook.allowedUpdates) && webhook.allowedUpdates.length <= 100, "webhook_allowed_updates_invalid");
    assert(webhook.allowedUpdates.every((value) => typeof value === "string" && /^[a-z][a-z0-9_]{0,63}$/.test(value)), "webhook_allowed_update_name_invalid");
  }
  if (webhook.dropPendingUpdates !== undefined) assert(typeof webhook.dropPendingUpdates === "boolean", "webhook_drop_pending_must_be_boolean");
  if (webhook.maxConnections !== undefined) assert(Number.isInteger(webhook.maxConnections) && webhook.maxConnections >= 1 && webhook.maxConnections <= 100, "webhook_max_connections_invalid");
  assert(Object.keys(database.commands || {}).length <= 1_000, "command_limit");
  assert(Object.keys(database.workflows || {}).length <= 2_000, "workflow_limit");
  assert(Object.keys(database.apis || {}).length <= 500, "api_limit");
  assert(Array.isArray(database.events || []), "events_must_be_array");
  assert(Array.isArray(database.callbacks || []), "callbacks_must_be_array");
  assert((database.events || []).length <= 500, "event_limit");
  assert((database.callbacks || []).length <= 500, "callback_limit");
  assert(Array.isArray(database.schedules || []), "schedules_must_be_array");
  assert((database.schedules || []).length <= 200, "schedule_limit");

  for (const [id, module] of Object.entries(database.modules || {})) {
    assert(/^[a-zA-Z0-9_.-]{1,80}$/.test(id) && isPlainObject(module), `module_${id}_invalid`);
    if (module.enabled !== undefined) assert(typeof module.enabled === "boolean", `module_${id}_enabled_invalid`);
  }
  for (const [id, feature] of Object.entries(database.features || {})) {
    assert(/^[a-zA-Z0-9_.-]{1,80}$/.test(id) && isPlainObject(feature), `feature_${id}_invalid`);
    if (feature.enabled !== undefined) assert(typeof feature.enabled === "boolean", `feature_${id}_enabled_invalid`);
  }
  for (const [id, role] of Object.entries(database.roles || {})) {
    assert(isPlainObject(role), `role_${id}_invalid`);
    if (role.permissions !== undefined) assert(Array.isArray(role.permissions) && role.permissions.every((permission) => typeof permission === "string"), `role_${id}_permissions_invalid`);
  }
  for (const [id, permission] of Object.entries(database.permissions || {})) {
    assert(isPlainObject(permission), `permission_${id}_invalid`);
    assert([undefined, "any", "private", "group", "supergroup", "channel"].includes(permission.scope), `permission_${id}_scope_invalid`);
  }
  if (database.quotas.period !== undefined) assert(["month", "all"].includes(database.quotas.period), "quota_period_invalid");
  if (database.quotas.plans !== undefined) {
    assert(isPlainObject(database.quotas.plans), "quota_plans_invalid");
    for (const [planId, plan] of Object.entries(database.quotas.plans)) {
      assert(isPlainObject(plan), `quota_plan_${planId}_invalid`);
      for (const [quotaId, value] of Object.entries(plan)) assert(Number.isFinite(Number(value)), `quota_plan_${planId}_${quotaId}_invalid`);
    }
  }

  for (const [id, command] of Object.entries(database.commands || {})) {
    assert(/^[a-zA-Z0-9_.-]{1,80}$/.test(id), `invalid_command_id_${id}`);
    assert(isPlainObject(command), `command_${id}_must_be_object`);
    if (command.module) assert(Object.hasOwn(database.modules || {}, command.module), `command_${id}_module_missing`);
    if (command.feature) assert(Object.hasOwn(database.features || {}, command.feature), `command_${id}_feature_missing`);
    if (command.roles !== undefined) assert(Array.isArray(command.roles) && command.roles.every((role) => typeof role === "string"), `command_${id}_roles_invalid`);
    if (command.permissions !== undefined) assert(Array.isArray(command.permissions) && command.permissions.every((permission) => typeof permission === "string"), `command_${id}_permissions_invalid`);
    assert(Array.isArray(command.triggers) && command.triggers.length > 0, `command_${id}_triggers_required`);
    assert(command.triggers.every((x) => typeof x === "string" && x.length <= 80), `command_${id}_trigger_invalid`);
    assert(command.triggers.every((x) => normalizeCommandText(x) !== "/install"), `command_${id}_reserved_install_trigger`);
    assert(["private", "group", "supergroup", "channel", "any"].includes(command.scope || "any"), `command_${id}_scope_invalid`);
    if (command.workflow) assert(Object.hasOwn(database.workflows || {}, command.workflow), `command_${id}_workflow_missing`);
    if (command.actions) validateActionList(command.actions, `command_${id}`, database);
    assert(command.workflow || command.actions, `command_${id}_actions_required`);
  }

  for (const [id, workflow] of Object.entries(database.workflows || {})) {
    assert(/^[a-zA-Z0-9_.-]{1,100}$/.test(id), `invalid_workflow_id_${id}`);
    assert(isPlainObject(workflow), `workflow_${id}_must_be_object`);
    validateActionList(workflow.actions || [], `workflow_${id}`, database);
  }

  for (const [id, api] of Object.entries(database.apis || {})) {
    assert(isPlainObject(api), `api_${id}_must_be_object`);
    assert(typeof api.url === "string" && api.url.length <= 2_000, `api_${id}_url_required`);
    assert(["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD"].includes(String(api.method || "GET").toUpperCase()), `api_${id}_method_invalid`);
  }

  for (const [collectionName, collection] of [["events", database.events || []], ["callbacks", database.callbacks || []]]) {
    for (let i = 0; i < collection.length; i++) {
      const event = collection[i];
      assert(isPlainObject(event) && typeof event.on === "string", `${collectionName}_${i}_invalid`);
      if (event.module) assert(Object.hasOwn(database.modules || {}, event.module), `${collectionName}_${i}_module_missing`);
      if (event.feature) assert(Object.hasOwn(database.features || {}, event.feature), `${collectionName}_${i}_feature_missing`);
      if (event.workflow) assert(Object.hasOwn(database.workflows || {}, event.workflow), `${collectionName}_${i}_workflow_missing`);
      if (event.actions) validateActionList(event.actions, `${collectionName}_${i}`, database);
      assert(event.workflow || event.actions, `${collectionName}_${i}_actions_required`);
    }
  }

  for (const lifecycleKey of ["onBootstrap", "onInstall"]) {
    if (database.lifecycle?.[lifecycleKey] !== undefined) {
      validateActionList(database.lifecycle[lifecycleKey], `lifecycle_${lifecycleKey}`, database);
    }
  }
  const aliases = database.migrations?.workflowAliases || {};
  assert(isPlainObject(aliases), "workflow_aliases_must_be_object");
  for (const [oldId, newId] of Object.entries(aliases)) {
    assert(typeof newId === "string" && Object.hasOwn(database.workflows || {}, newId), `workflow_alias_target_missing_${oldId}`);
  }

  for (let i = 0; i < (database.schedules || []).length; i++) {
    const schedule = database.schedules[i];
    assert(isPlainObject(schedule) && typeof schedule.id === "string" && typeof schedule.cron === "string", `schedule_${i}_invalid`);
    assert(Object.hasOwn(database.workflows || {}, schedule.workflow), `schedule_${i}_workflow_missing`);
  }

  return { ok: true, commands: Object.keys(database.commands || {}).length, workflows: Object.keys(database.workflows || {}).length, events: (database.events || []).length, apis: Object.keys(database.apis || {}).length };
}

const UNSAFE_PATH = /(?:^|\.)(?:__proto__|prototype|constructor)(?:\.|$)/;

export function readPath(object, path, fallback = undefined) {
  if (typeof path !== "string" || !path || UNSAFE_PATH.test(path)) return fallback;
  const parts = path.replace(/\[(\d+)\]/g, ".$1").split(".").filter(Boolean);
  let current = object;
  for (const part of parts) {
    if (current == null) return fallback;
    current = current[part];
  }
  return current === undefined ? fallback : current;
}

function safeClone(value) {
  if (value === undefined) return null;
  return JSON.parse(JSON.stringify(value));
}

function evaluateExpression(expression, context) {
  if (expression == null || typeof expression !== "object") return expression;
  if (Array.isArray(expression)) return expression.map((item) => resolveValue(item, context));
  const op = String(expression.op || "");
  const args = Array.isArray(expression.args) ? expression.args.map((item) => resolveValue(item, context)) : [];
  const first = args[0];
  const second = args[1];
  switch (op) {
    case "get": return safeClone(readPath(context, String(expression.path || first || ""), expression.default ?? null));
    case "concat": return args.map((item) => item == null ? "" : typeof item === "object" ? JSON.stringify(item) : String(item)).join("");
    case "join": return (Array.isArray(first) ? first : []).join(String(second ?? ""));
    case "split": return String(first ?? "").split(String(second ?? ""));
    case "upper": return String(first ?? "").toLocaleUpperCase();
    case "lower": return String(first ?? "").toLocaleLowerCase();
    case "trim": return String(first ?? "").trim();
    case "replace": return String(first ?? "").split(String(second ?? "")).join(String(args[2] ?? ""));
    case "length": return first == null ? 0 : (typeof first === "string" || Array.isArray(first) ? first.length : Object.keys(first).length);
    case "add": return args.reduce((sum, value) => sum + Number(value || 0), 0);
    case "subtract": return Number(first || 0) - Number(second || 0);
    case "multiply": return args.reduce((product, value) => product * Number(value || 0), 1);
    case "divide": return Number(second) === 0 ? null : Number(first) / Number(second);
    case "mod": return Number(second) === 0 ? null : Number(first) % Number(second);
    case "min": return Math.min(...args.map(Number));
    case "max": return Math.max(...args.map(Number));
    case "sum": return (Array.isArray(first) ? first : []).reduce((sum, value) => sum + Number(value || 0), 0);
    case "unique": return [...new Set(Array.isArray(first) ? first : [])];
    case "first": return Array.isArray(first) ? (first[0] ?? null) : null;
    case "last": return Array.isArray(first) ? (first.at(-1) ?? null) : null;
    case "slice": return Array.isArray(first) || typeof first === "string" ? first.slice(Number(second) || 0, args[2] == null ? undefined : Number(args[2])) : null;
    case "merge": return Object.assign({}, ...args.filter(isPlainObject));
    case "pick": {
      const source = isPlainObject(first) ? first : {};
      const keys = Array.isArray(second) ? second.map(String) : [];
      return Object.fromEntries(keys.filter((key) => !FORBIDDEN_KEYS.has(key) && Object.hasOwn(source, key)).map((key) => [key, source[key]]));
    }
    case "stringify": return JSON.stringify(first ?? null);
    case "parseJson": return parseJson(String(first ?? ""), expression.default ?? null);
    case "now": return Date.now();
    case "iso": return new Date(Number(first || Date.now())).toISOString();
    case "eq": return first === second || String(first) === String(second);
    case "gt": return Number(first) > Number(second);
    case "gte": return Number(first) >= Number(second);
    case "lt": return Number(first) < Number(second);
    case "lte": return Number(first) <= Number(second);
    case "not": return !first;
    case "and": return args.every(Boolean);
    case "or": return args.some(Boolean);
    case "contains": return Array.isArray(first) ? first.includes(second) : String(first ?? "").includes(String(second ?? ""));
    default: throw new Error(`expression_operator_unsupported:${op}`);
  }
}

export function resolveValue(value, context) {
  if (typeof value === "string") {
    const exact = /^\{\{\s*([^{}]+?)\s*\}\}$/.exec(value);
    if (exact) return safeClone(readPath(context, exact[1].trim(), ""));
    return value.replace(/\{\{\s*([^{}]+?)\s*\}\}/g, (_match, path) => {
      const result = readPath(context, path.trim(), "");
      return result == null ? "" : typeof result === "object" ? JSON.stringify(result) : String(result);
    });
  }
  if (Array.isArray(value)) return value.map((item) => resolveValue(item, context));
  if (isPlainObject(value)) {
    if (Object.keys(value).length === 1 && Object.hasOwn(value, "$expr")) return evaluateExpression(value.$expr, context);
    const result = {};
    for (const [key, item] of Object.entries(value)) {
      if (FORBIDDEN_KEYS.has(key)) continue;
      result[key] = resolveValue(item, context);
    }
    return result;
  }
  return value;
}

function compareCondition(condition, context) {
  if (condition === undefined || condition === null) return true;
  if (typeof condition === "boolean") return condition;
  if (!isPlainObject(condition)) return Boolean(resolveValue(condition, context));
  if (Array.isArray(condition.and)) return condition.and.every((part) => compareCondition(part, context));
  if (Array.isArray(condition.or)) return condition.or.some((part) => compareCondition(part, context));
  if (Object.hasOwn(condition, "not")) return !compareCondition(condition.not, context);
  if (Object.hasOwn(condition, "exists")) return readPath(context, String(condition.exists), undefined) !== undefined;
  const ops = ["eq", "ne", "gt", "gte", "lt", "lte", "contains", "in", "startsWith", "endsWith"];
  const operator = ops.find((key) => Object.hasOwn(condition, key));
  if (!operator) return false;
  const args = condition[operator];
  const values = Array.isArray(args) ? args.map((item) => resolveValue(item, context)) : [resolveValue(args, context)];
  const [left, right] = values;
  switch (operator) {
    case "eq": return left === right || String(left) === String(right);
    case "ne": return !(left === right || String(left) === String(right));
    case "gt": return Number(left) > Number(right);
    case "gte": return Number(left) >= Number(right);
    case "lt": return Number(left) < Number(right);
    case "lte": return Number(left) <= Number(right);
    case "contains": return Array.isArray(left) ? left.includes(right) : String(left ?? "").includes(String(right ?? ""));
    case "in": return Array.isArray(right) ? right.includes(left) : String(right ?? "").split(",").includes(String(left));
    case "startsWith": return String(left ?? "").startsWith(String(right ?? ""));
    case "endsWith": return String(left ?? "").endsWith(String(right ?? ""));
    default: return false;
  }
}

export class WorkflowInterpreter {
  constructor({ database, io, limits = {} }) {
    this.database = database;
    this.io = io;
    this.maxActions = limits.maxActions ?? 500;
    this.maxLoop = limits.maxLoop ?? 100;
    this.maxDepth = limits.maxDepth ?? 12;
    this.actionCount = 0;
  }

  async runWorkflow(id, context, depth = 0) {
    if (depth > this.maxDepth) throw new Error("workflow_depth_limit");
    const workflow = this.database.workflows?.[id];
    if (!workflow) throw new Error(`workflow_not_found:${id}`);
    return this.runActions(workflow.actions || [], context, depth + 1);
  }

  async runActions(actions, context, depth = 0) {
    if (depth > this.maxDepth) throw new Error("action_nesting_limit");
    let lastResult = null;
    for (const action of actions) {
      this.actionCount++;
      if (this.actionCount > this.maxActions) throw new Error("runtime_action_budget_exceeded");
      if (action.when !== undefined && !compareCondition(action.when, context)) continue;
      const result = await this.executeAction(action, context, depth);
      if (action.as) context[action.as] = result;
      if (result !== undefined) {
        context.result = result;
        lastResult = result;
      }
      if (context.__flowReturn) break;
    }
    return lastResult;
  }

  async executeAction(action, context, depth) {
    const type = action.type;
    switch (type) {
      case "telegram.call": {
        const method = String(resolveValue(action.method, context) || "");
        const payload = resolveValue(action.payload || {}, context);
        const files = resolveValue(action.files || {}, context);
        return this.io.telegram(method, payload, context, files);
      }
      case "api.call": {
        const api = this.database.apis[action.api];
        const input = resolveValue(action.input || {}, context);
        return this.io.api(action.api, api, input, context);
      }
      case "http.request": {
        const request = resolveValue(action.request || {}, context);
        return this.io.http(request, context);
      }
      case "state.get": {
        const args = resolveValue(action, context);
        return this.io.state("get", args, context);
      }
      case "state.set": {
        const args = resolveValue(action, context);
        return this.io.state("set", args, context);
      }
      case "state.delete": {
        const args = resolveValue(action, context);
        return this.io.state("delete", args, context);
      }
      case "state.increment": {
        const args = resolveValue(action, context);
        return this.io.state("increment", args, context);
      }
      case "state.list": {
        const args = resolveValue(action, context);
        return this.io.state("list", args, context);
      }
      case "context.set": {
        const key = String(action.path || "");
        if (!key || UNSAFE_PATH.test(key)) throw new Error("context_path_forbidden");
        const parts = key.split(".");
        let target = context;
        for (const part of parts.slice(0, -1)) {
          if (!isPlainObject(target[part])) target[part] = {};
          target = target[part];
        }
        target[parts.at(-1)] = resolveValue(action.value, context);
        return target[parts.at(-1)];
      }
      case "context.merge": {
        const data = resolveValue(action.value || {}, context);
        if (!isPlainObject(data)) throw new Error("context_merge_object_required");
        Object.assign(context, data);
        return context;
      }
      case "condition": {
        const branch = compareCondition(action.if, context) ? action.then || [] : action.else || [];
        return this.runActions(branch, context, depth + 1);
      }
      case "each": {
        const items = resolveValue(action.items, context);
        if (!Array.isArray(items)) return [];
        const output = [];
        for (const item of items.slice(0, Math.min(this.maxLoop, Number(action.limit) || this.maxLoop))) {
          context[action.as || "item"] = item;
          if (action.indexAs) context[action.indexAs] = output.length;
          output.push(await this.runActions(action.actions || [], context, depth + 1));
          if (context.__flowReturn) break;
        }
        return output;
      }
      case "while": {
        const output = [];
        const limit = Math.min(this.maxLoop, Math.max(1, Number(action.limit) || 10));
        for (let i = 0; i < limit && compareCondition(action.if, context); i++) {
          context.loopIndex = i;
          output.push(await this.runActions(action.actions || [], context, depth + 1));
          if (context.__flowReturn) break;
        }
        return output;
      }
      case "workflow.run": {
        const data = resolveValue(action.input || {}, context);
        const child = { ...context, ...(isPlainObject(data) ? data : {}) };
        const result = await this.runWorkflow(action.workflow, child, depth + 1);
        if (action.merge !== false) Object.assign(context, child);
        return result;
      }
      case "queue.enqueue": {
        const data = resolveValue(action.input || {}, context);
        return this.io.enqueue({ workflow: action.workflow, input: data, delayMs: Number(resolveValue(action.delayMs ?? 0, context)) || 0, maxAttempts: action.maxAttempts }, context);
      }
      case "queue.list":
        return this.io.queue("list", resolveValue(action, context), context);
      case "queue.stats":
        return this.io.queue("stats", resolveValue(action, context), context);
      case "queue.retry":
        return this.io.queue("retry", resolveValue(action, context), context);
      case "queue.cancel":
        return this.io.queue("cancel", resolveValue(action, context), context);
      case "conversation.start": {
        const data = resolveValue(action.input || {}, context);
        return this.io.conversation("start", { workflow: action.workflow, input: data, ttlSeconds: action.ttlSeconds }, context);
      }
      case "conversation.end":
        return this.io.conversation("end", {}, context);
      case "conversation.update": {
        const data = resolveValue(action.input || {}, context);
        return this.io.conversation("update", { input: data }, context);
      }
      case "quota.get": {
        const args = resolveValue(action, context);
        return this.io.quota("get", args, context);
      }
      case "quota.consume": {
        const args = resolveValue(action, context);
        return this.io.quota("consume", args, context);
      }
      case "runtime.status":
        return this.io.runtimeStatus(context);
      case "runtime.logs": {
        const options = resolveValue(action, context);
        return this.io.runtimeLogs(options, context);
      }
      case "runtime.control": {
        const options = resolveValue(action, context);
        return this.io.runtimeControl(String(options.operation || ""), options, context);
      }
      case "log.write": {
        const entry = resolveValue(action.entry || {}, context);
        return this.io.log(entry, context);
      }
      case "try": {
        let result = null;
        try {
          result = await this.runActions(action.actions || [], context, depth + 1);
        } catch (error) {
          context[action.errorAs || "error"] = { message: String(error?.message || error).slice(0, 500) };
          result = await this.runActions(action.catch || [], context, depth + 1);
        } finally {
          if (Array.isArray(action.finally) && action.finally.length) await this.runActions(action.finally, context, depth + 1);
        }
        return result;
      }
      case "throw":
        throw new Error(String(resolveValue(action.message || "workflow_error", context)).slice(0, 500));
      case "flow.return":
        context.__flowReturn = true;
        return resolveValue(action.value, context);
      default:
        throw new Error(`unknown_action:${type}`);
    }
  }
}

function findNestedObject(root, predicate, maxNodes = 2500, maxDepth = 8) {
  const queue = [{ value: root, depth: 0 }];
  const seen = new WeakSet();
  let visited = 0;
  let cursor = 0;
  while (cursor < queue.length && visited < maxNodes) {
    const { value, depth } = queue[cursor++];
    if (!value || typeof value !== "object" || seen.has(value) || depth > maxDepth) continue;
    seen.add(value);
    visited++;
    if (!Array.isArray(value) && predicate(value)) return value;
    for (const child of Object.values(value)) {
      if (child && typeof child === "object") queue.push({ value: child, depth: depth + 1 });
    }
  }
  return null;
}

export function extractUpdateContext(update) {
  const message = update?.message || update?.edited_message || update?.channel_post || update?.edited_channel_post
    || update?.business_message || update?.edited_business_message || update?.callback_query?.message
    || findNestedObject(update, (value) => Number.isInteger(Number(value.message_id)) && value.chat && typeof value.chat === "object")
    || null;
  const chat = message?.chat || update?.callback_query?.message?.chat || update?.my_chat_member?.chat
    || update?.chat_member?.chat || update?.chat_join_request?.chat
    || findNestedObject(update, (value) => Number.isInteger(Number(value.id)) && ["private", "group", "supergroup", "channel"].includes(value.type))
    || null;
  const user = message?.from || update?.callback_query?.from || update?.my_chat_member?.from
    || update?.chat_member?.from || update?.chat_join_request?.from || update?.inline_query?.from
    || update?.chosen_inline_result?.from
    || findNestedObject(update, (value) => Number.isInteger(Number(value.id)) && (typeof value.is_bot === "boolean" || typeof value.first_name === "string"))
    || null;
  return { message, chat, user };
}

export function normalizeCommandText(value) {
  return String(value ?? "")
    .normalize("NFKC")
    .toLocaleLowerCase("fa-IR")
    .replace(/[\u064B-\u065F\u0670]/g, "")
    .replace(/[\u064A]/g, "ی")
    .replace(/[\u0643]/g, "ک")
    .replace(/[\u200c\u200f\u200e\u0640]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function parseCommandText(text, botUsername = "") {
  const raw = String(text ?? "").trim();
  if (!raw) return null;
  const parts = raw.split(/\s+/);
  let token = parts[0];
  if (token.startsWith("/")) {
    token = token.split("@")[0];
    if (parts[0].includes("@") && botUsername && parts[0].split("@")[1].toLowerCase() !== botUsername.toLowerCase()) return null;
    return { kind: "slash", trigger: normalizeCommandText(token), args: parts.slice(1), argsText: parts.slice(1).join(" "), raw };
  }
  return { kind: "text", trigger: normalizeCommandText(raw), args: [], argsText: "", raw };
}

export function matchCommand(database, text, botUsername = "") {
  const parsed = parseCommandText(text, botUsername);
  if (!parsed) return null;
  for (const [id, command] of Object.entries(database.commands || {})) {
    if (command.enabled === false) continue;
    if (command.feature && database.features?.[command.feature]?.enabled === false) continue;
    if (command.module && database.modules?.[command.module]?.enabled === false) continue;
    const triggers = (command.triggers || []).map((value) => normalizeCommandText(value));
    const matched = triggers.find((trigger) => {
      if (parsed.kind === "slash") return trigger === parsed.trigger;
      if (command.match === "prefix") return parsed.trigger.startsWith(trigger);
      return trigger === parsed.trigger;
    });
    if (matched) return { id, definition: command, parsed };
  }
  return null;
}

export function ownerInstallIntent(update, ownerId, botUsername = "", hasSession = false) {
  const { message, chat, user } = extractUpdateContext(update);
  if (!chat || chat.type !== "private" || !user || String(user.id) !== String(ownerId)) return null;
  const parsed = parseCommandText(message?.text || "", botUsername);
  if (parsed?.kind === "slash" && parsed.trigger === "/install") return "start";
  if (hasSession && message?.document) return "document";
  return null;
}

export function matchesEvent(event, updateType, context) {
  if (event.enabled === false || event.on !== updateType) return false;
  if (event.feature && context.features?.[event.feature]?.enabled === false) return false;
  if (event.module && context.modules?.[event.module]?.enabled === false) return false;
  if (event.policy && context.policies?.[event.policy] === false) return false;
  const match = event.match || {};
  if (Array.isArray(match.chatTypes) && !match.chatTypes.includes(context.chat?.type)) return false;
  if (match.fromBot === true && context.user?.is_bot !== true) return false;
  if (match.fromBot === false && context.user?.is_bot === true) return false;
  if (Array.isArray(match.chatMemberStatus) && !match.chatMemberStatus.includes(context.chatMember?.new_chat_member?.status ?? context.myChatMember?.new_chat_member?.status)) return false;
  if (match.textStartsWith && !String(context.message?.text || "").startsWith(match.textStartsWith)) return false;
  if (match.callbackPrefix && !String(context.callback?.data || "").startsWith(match.callbackPrefix)) return false;
  if (match.condition && !compareCondition(match.condition, context)) return false;
  return true;
}

export function cronMatches(expression, date = new Date()) {
  const fields = String(expression || "").trim().split(/\s+/);
  if (fields.length !== 5) return false;
  const values = [date.getUTCMinutes(), date.getUTCHours(), date.getUTCDate(), date.getUTCMonth() + 1, date.getUTCDay() + 1];
  const ranges = [[0, 59], [0, 23], [1, 31], [1, 12], [1, 7]];
  return fields.every((field, index) => {
    return field.split(",").some((part) => {
      const [base, stepText] = part.split("/");
      const step = stepText == null ? 1 : Number(stepText);
      if (!Number.isInteger(step) || step < 1) return false;
      let min = ranges[index][0]; let max = ranges[index][1];
      if (base !== "*") {
        const range = base.split("-").map(Number);
        if (range.length === 1) min = max = range[0];
        else if (range.length === 2) [min, max] = range;
        else return false;
      }
      return values[index] >= min && values[index] <= max && (values[index] - min) % step === 0;
    });
  });
}
