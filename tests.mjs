import assert from "node:assert/strict";
import fs from "node:fs/promises";
import {
  ForwardSchedulerRuntime,
  FEATURE_MODULES,
  MAX_DATABASE_BYTES,
  configuredCommand,
  parseDatabaseModule,
} from "./modules.js";

const TOKEN = "123456789:ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghi";
const OWNER_ID = 100200300;
const OTHER_ID = 99887766;

function makeDatabase() {
  const features = Object.fromEntries(FEATURE_MODULES.map(({ id, defaultEnabled }) => [id, { enabled: defaultEnabled }]));
  features.chatbot = { ...features.chatbot, rules: [] };
  features.moderation = { ...features.moderation, commands: [] };
  features.automations = { ...features.automations, rules: [] };
  features.antiSpam = { ...features.antiSpam, signals: {} };
  features.tagKnownMembers = { ...features.tagKnownMembers };
  return {
    schemaVersion: 5,
    version: "test-1.0",
    name: "Test database",
    texts: {},
    roles: { adminIds: [], protectedIds: [] },
    runtime: { capabilities: [], resources: [], safety: { remoteCodeExecution: false }, maintenance: {} },
    features,
  };
}

class MockStorage {
  constructor() {
    this.values = new Map();
    this.alarmAt = null;
  }
  async get(key) { return structuredClone(this.values.get(key)); }
  async put(key, value) { this.values.set(key, structuredClone(value)); }
  async delete(keys) {
    const list = Array.isArray(keys) ? keys : [keys];
    let count = 0;
    for (const key of list) if (this.values.delete(key)) count += 1;
    return count;
  }
  async list({ prefix = "", limit = 1_000, startAfter = "" } = {}) {
    const entries = [...this.values.entries()]
      .filter(([key]) => key.startsWith(prefix) && (!startAfter || key > startAfter))
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(0, limit);
    return new Map(entries.map(([key, value]) => [key, structuredClone(value)]));
  }
  async transaction(fn) {
    const staged = new Map(this.values);
    const tx = {
      get: async (key) => structuredClone(staged.get(key)),
      put: async (key, value) => staged.set(key, structuredClone(value)),
      delete: async (key) => staged.delete(key),
    };
    const result = await fn(tx);
    this.values = staged;
    return result;
  }
  async getAlarm() { return this.alarmAt; }
  async setAlarm(value) { this.alarmAt = value; }
  async deleteAlarm() { this.alarmAt = null; }
}

function makeHarness({ ownerId = OWNER_ID, initialState = null } = {}) {
  const storage = new MockStorage();
  if (initialState) storage.values.set("state", structuredClone(initialState));
  const apiCalls = [];
  let messageId = 700;
  let uploadedFileSource = "";
  globalThis.fetch = async (input, init = {}) => {
    const url = String(input);
    if (url.includes("/file/bot")) return new Response(uploadedFileSource, { status: 200 });
    const method = url.slice(url.lastIndexOf("/") + 1);
    let payload = {};
    try { payload = JSON.parse(init.body || "{}"); } catch { /* empty payload */ }
    apiCalls.push({ method, payload, url });
    if (method === "getFile") {
      return Response.json({ ok: true, result: { file_path: "documents/database.json", file_size: new TextEncoder().encode(uploadedFileSource).byteLength } });
    }
    if (method === "sendMessage") {
      messageId += 1;
      return Response.json({ ok: true, result: { message_id: messageId, chat: { id: payload.chat_id } } });
    }
    if (method === "editMessageText") return Response.json({ ok: true, result: { message_id: payload.message_id, chat: { id: payload.chat_id } } });
    if (method === "getMe") return Response.json({ ok: true, result: { id: 123, username: "test_bot" } });
    return Response.json({ ok: true, result: true });
  };
  const env = { EMBEDDED_BOT_TOKEN: TOKEN, OWNER_TELEGRAM_ID: ownerId == null ? "" : String(ownerId), WORKER_PUBLIC_ORIGIN: "https://test.workers.dev" };
  const runtime = new ForwardSchedulerRuntime({ storage }, env);
  async function deliver(update) {
    const result = await runtime.handleUpdate(update);
    assert.equal(result.queued, true);
    await runtime.alarm();
  }
  return {
    storage,
    runtime,
    apiCalls,
    setFile(source) { uploadedFileSource = source; },
    deliver,
  };
}

let passed = 0;
async function check(name, fn) {
  await fn();
  passed += 1;
  process.stdout.write(`PASS ${passed}: ${name}\n`);
}

await check("database parser accepts strict JSON and data-only export default", async () => {
  const database = makeDatabase();
  const raw = JSON.stringify(database);
  assert.equal(parseDatabaseModule(raw).version, "test-1.0");
  assert.equal(parseDatabaseModule(`export default ${raw};`).version, "test-1.0");
  assert.throws(() => parseDatabaseModule(`export default (() => ${raw})();`), /database_must_be_json_object/);
  assert.equal(MAX_DATABASE_BYTES, 20 * 1024 * 1024);
});

await check("no embedded database file remains in the project", async () => {
  await assert.rejects(fs.access(new URL("./database.js", import.meta.url)));
  const source = await fs.readFile(new URL("./modules.js", import.meta.url), "utf8");
  assert.doesNotMatch(source, /readFile\([^)]*database\.js/);
});

await check("group command names are configurable through database fields", async () => {
  assert.equal(configuredCommand("/R"), "/r");
  assert.equal(configuredCommand("/Report_2026"), "/report_2026");
  assert.equal(configuredCommand("report"), "");
  assert.equal(configuredCommand("/bad command"), "");
  const database = makeDatabase();
  database.features.reports.command = "/flag";
  database.features.groupControls.command = "/replies";
  database.features.tagKnownMembers.commands = { tagAll: "/tag", tagOptIn: "/tagin", tagOptOut: "/tagout" };
  database.features.moderation.commands = [{ command: "/banuser", action: "ban", enabled: true }];
  database.features.customCommands.rules = [{ command: "/rules", response: "Group rules", enabled: true }];
  const parsed = parseDatabaseModule(JSON.stringify(database));
  assert.equal(configuredCommand(parsed.features.reports.command), "/flag");
  assert.equal(configuredCommand(parsed.features.groupControls.command), "/replies");
  assert.equal(configuredCommand(parsed.features.tagKnownMembers.commands.tagAll), "/tag");
  assert.equal(configuredCommand(parsed.features.moderation.commands[0].command), "/banuser");
  assert.equal(configuredCommand(parsed.features.customCommands.rules[0].command), "/rules");
});

await check("/start and all private messages from non-owners are silent", async () => {
  const h = makeHarness();
  await h.deliver({ update_id: 1, message: { message_id: 1, chat: { id: OTHER_ID, type: "private" }, from: { id: OTHER_ID }, text: "/start" } });
  await h.deliver({ update_id: 2, message: { message_id: 2, chat: { id: OTHER_ID, type: "private" }, from: { id: OTHER_ID }, text: "/settings" } });
  await h.deliver({ update_id: 3, message: { message_id: 3, chat: { id: OWNER_ID, type: "private" }, from: { id: OWNER_ID }, text: "/start" } });
  assert.equal(h.apiCalls.filter((call) => call.method === "sendMessage").length, 0);
  assert.equal(h.storage.values.get("state")?.security?.ownerId, String(OWNER_ID));
});

await check("legacy /start owner claims are rejected when no owner ID is configured", async () => {
  const h = makeHarness({ ownerId: null, initialState: { security: { ownerId: String(OWNER_ID) } } });
  await h.deliver({ update_id: 4, message: { message_id: 4, chat: { id: OWNER_ID, type: "private" }, from: { id: OWNER_ID }, text: "/start" } });
  await h.deliver({ update_id: 5, message: { message_id: 5, chat: { id: OWNER_ID, type: "private" }, from: { id: OWNER_ID }, text: "/settings" } });
  assert.equal(h.apiCalls.filter((call) => call.method === "sendMessage").length, 0);
  assert.equal(h.apiCalls.filter((call) => call.method === "setMyCommands").length, 0);
  assert.equal(h.storage.values.get("state")?.security?.ownerId, null);
});

await check("legacy inline database state is not restored; explicit upload is required", async () => {
  const h = makeHarness({ initialState: { migrationVersion: 5, security: { ownerId: String(OWNER_ID) }, db: makeDatabase() } });
  h.storage.values.set("database:backup:v5", { previous: { db: makeDatabase() } });
  await h.deliver({ update_id: 6, message: { message_id: 6, chat: { id: OWNER_ID, type: "private" }, from: { id: OWNER_ID }, text: "/settings" } });
  const panel = h.apiCalls.find((call) => call.method === "sendMessage");
  assert.match(panel.payload.text, /Database: NOT INSTALLED/);
  assert.equal(h.storage.values.get("database:v1:manifest"), undefined);
  assert.equal(h.storage.values.get("state")?.db, undefined);
  assert.equal(h.storage.values.has("database:backup:v5"), false);
});

await check("owner legacy commands and ordinary text are silent", async () => {
  const h = makeHarness();
  for (const [index, text] of ["/start", "/help", "/author", "/installDB", "/cancel", "hello"].entries()) {
    await h.deliver({ update_id: 7 + index, message: { message_id: 7 + index, chat: { id: OWNER_ID, type: "private" }, from: { id: OWNER_ID }, text } });
  }
  assert.equal(h.apiCalls.filter((call) => call.method === "sendMessage").length, 0);
  assert.equal(h.apiCalls.filter((call) => call.method === "setMyCommands").length, 0);
});

await check("webhook setup clears legacy menus and registers settings only for the owner", async () => {
  const h = makeHarness();
  const result = await h.runtime.setupWebhookOnce();
  assert.equal(result.ok, true);
  const scopes = h.apiCalls.filter((call) => call.method === "deleteMyCommands").map((call) => call.payload.scope?.type || "default");
  assert.deepEqual(scopes, ["default", "all_private_chats", "all_group_chats", "all_chat_administrators", "chat"]);
  const set = h.apiCalls.find((call) => call.method === "setMyCommands");
  assert.deepEqual(set.payload.commands.map((item) => item.command), ["settings"]);
  assert.equal(set.payload.scope.chat_id, OWNER_ID);
});

await check("webhook setup uses the real request origin supplied by Cloudflare", async () => {
  const h = makeHarness();
  const result = await h.runtime.setupWebhookOnce("https://actual-account.workers.dev");
  assert.equal(result.ok, true);
  const call = h.apiCalls.find((item) => item.method === "setWebhook");
  assert.equal(call.payload.url, "https://actual-account.workers.dev/telegram/webhook");
});

await check("/settings shows one owner-only command and an English settings panel", async () => {
  const h = makeHarness();
  await h.deliver({ update_id: 10, message: { message_id: 10, chat: { id: OWNER_ID, type: "private" }, from: { id: OWNER_ID }, text: "/settings" } });
  const commandDelete = h.apiCalls.find((call) => call.method === "deleteMyCommands");
  const commandSet = h.apiCalls.find((call) => call.method === "setMyCommands");
  const message = h.apiCalls.find((call) => call.method === "sendMessage");
  assert.ok(commandDelete);
  const deletedScopes = h.apiCalls.filter((call) => call.method === "deleteMyCommands").map((call) => call.payload.scope?.type || "default");
  assert.deepEqual(deletedScopes, ["default", "all_private_chats", "all_group_chats", "all_chat_administrators", "chat"]);
  assert.deepEqual(commandSet.payload.commands.map((command) => command.command), ["settings"]);
  assert.equal(commandSet.payload.scope.chat_id, OWNER_ID);
  assert.match(message.payload.text, /BOT SETTINGS/);
  assert.match(message.payload.text, /Database: NOT INSTALLED/);
  assert.ok(message.payload.reply_markup.inline_keyboard.flat().some((button) => button.callback_data === "settings:toggle:cache"));
});

await check("/settings install prompts for a database upload in English", async () => {
  const h = makeHarness();
  await h.deliver({ update_id: 20, message: { message_id: 20, chat: { id: OWNER_ID, type: "private" }, from: { id: OWNER_ID }, text: "/settings install" } });
  const message = h.apiCalls.find((call) => call.method === "sendMessage");
  assert.match(message.payload.text, /DATABASE INSTALLATION/);
  assert.match(message.payload.text, /Upload your database file/);
});

await check("owner upload installs database into verified chunks, not the main state row", async () => {
  const h = makeHarness();
  const source = `export default ${JSON.stringify(makeDatabase())};`;
  h.setFile(source);
  await h.deliver({ update_id: 30, message: { message_id: 30, chat: { id: OWNER_ID, type: "private" }, from: { id: OWNER_ID }, text: "/settings install" } });
  await h.deliver({ update_id: 31, message: { message_id: 31, chat: { id: OWNER_ID, type: "private" }, from: { id: OWNER_ID }, document: { file_id: "file-1", file_name: "database.js", file_size: new TextEncoder().encode(source).byteLength } } });
  const manifest = h.storage.values.get("database:v1:manifest");
  assert.ok(manifest?.hash);
  assert.ok(manifest.chunks >= 1);
  const chunkKeys = [...h.storage.values.keys()].filter((key) => key.startsWith(`database:v1:${manifest.hash}:chunk:`));
  assert.equal(chunkKeys.length, manifest.chunks);
  assert.equal(h.storage.values.get("state")?.db, undefined);
  assert.equal(h.storage.values.get("state")?.dbHash, manifest.hash);
  assert.ok(h.apiCalls.some((call) => call.method === "getFile"));
  assert.ok(h.apiCalls.some((call) => call.method === "sendMessage" && /DATABASE INSTALLED/.test(call.payload.text)));
});

await check("settings toggles update the existing panel and shutdown can be reversed", async () => {
  const h = makeHarness();
  await h.deliver({ update_id: 40, message: { message_id: 40, chat: { id: OWNER_ID, type: "private" }, from: { id: OWNER_ID }, text: "/settings" } });
  const initialPanel = h.apiCalls.find((call) => call.method === "sendMessage");
  const panelId = initialPanel.payload.reply_to_message_id || h.storage.values.get("state")?.settingsMessage?.messageId;
  await h.deliver({ update_id: 41, callback_query: { id: "cb-41", from: { id: OWNER_ID }, data: "settings:toggle:cache", message: { message_id: panelId, chat: { id: OWNER_ID, type: "private" } } } });
  assert.equal(h.storage.values.get("state")?.settings?.cacheEnabled, false);
  assert.ok(h.apiCalls.some((call) => call.method === "editMessageText" && /Cache: DISABLED/.test(call.payload.text)));
  await h.deliver({ update_id: 42, callback_query: { id: "cb-42", from: { id: OWNER_ID }, data: "settings:toggle:auto", message: { message_id: panelId, chat: { id: OWNER_ID, type: "private" } } } });
  assert.equal(h.storage.values.get("state")?.settings?.autoUpdate, false);
  assert.ok(h.apiCalls.some((call) => call.method === "editMessageText" && /Auto Update: DISABLED/.test(call.payload.text)));
  const editsBeforeAutoOffAction = h.apiCalls.filter((call) => call.method === "editMessageText").length;
  await h.deliver({ update_id: 421, callback_query: { id: "cb-421", from: { id: OWNER_ID }, data: "settings:toggle:cache", message: { message_id: panelId, chat: { id: OWNER_ID, type: "private" } } } });
  assert.equal(h.storage.values.get("state")?.settings?.cacheEnabled, true);
  assert.equal(h.apiCalls.filter((call) => call.method === "editMessageText").length, editsBeforeAutoOffAction);
  await h.deliver({ update_id: 43, callback_query: { id: "cb-43", from: { id: OWNER_ID }, data: "settings:toggle:auto", message: { message_id: panelId, chat: { id: OWNER_ID, type: "private" } } } });
  assert.equal(h.storage.values.get("state")?.settings?.autoUpdate, true);
  await h.deliver({ update_id: 44, callback_query: { id: "cb-44", from: { id: OWNER_ID }, data: "settings:toggle:bot", message: { message_id: panelId, chat: { id: OWNER_ID, type: "private" } } } });
  assert.equal(h.storage.values.get("state")?.settings?.botEnabled, false);
  await h.deliver({ update_id: 45, callback_query: { id: "cb-45", from: { id: OWNER_ID }, data: "settings:toggle:bot", message: { message_id: panelId, chat: { id: OWNER_ID, type: "private" } } } });
  assert.equal(h.storage.values.get("state")?.settings?.botEnabled, true);
});

await check("a non-owner cannot change settings through forged callback data", async () => {
  const h = makeHarness();
  await h.deliver({ update_id: 50, callback_query: { id: "cb-50", from: { id: OTHER_ID }, data: "settings:toggle:bot", message: { message_id: 1, chat: { id: OTHER_ID, type: "private" } } } });
  assert.equal(h.storage.values.get("state")?.settings?.botEnabled, true);
  assert.ok(h.apiCalls.some((call) => call.method === "answerCallbackQuery"));
});

await check("database delete removes manifest and all corresponding chunks", async () => {
  const h = makeHarness();
  const source = JSON.stringify(makeDatabase());
  h.setFile(source);
  await h.deliver({ update_id: 60, message: { message_id: 60, chat: { id: OWNER_ID, type: "private" }, from: { id: OWNER_ID }, text: "/settings" } });
  const panel = h.storage.values.get("state")?.settingsMessage;
  await h.deliver({ update_id: 61, callback_query: { id: "cb-61", from: { id: OWNER_ID }, data: "settings:install", message: { message_id: panel.messageId, chat: { id: OWNER_ID, type: "private" } } } });
  await h.deliver({ update_id: 62, message: { message_id: 62, chat: { id: OWNER_ID, type: "private" }, from: { id: OWNER_ID }, document: { file_id: "file-2", file_name: "database.json", file_size: source.length } } });
  const manifest = h.storage.values.get("database:v1:manifest");
  assert.ok(manifest);
  h.storage.values.set("database:v1:orphan:chunk:0000", "stale");
  await h.deliver({ update_id: 63, callback_query: { id: "cb-63", from: { id: OWNER_ID }, data: "settings:delete", message: { message_id: panel.messageId, chat: { id: OWNER_ID, type: "private" } } } });
  await h.deliver({ update_id: 64, callback_query: { id: "cb-64", from: { id: OWNER_ID }, data: "settings:delete:confirm", message: { message_id: panel.messageId, chat: { id: OWNER_ID, type: "private" } } } });
  assert.equal(h.storage.values.has("database:v1:manifest"), false);
  assert.equal([...h.storage.values.keys()].some((key) => key.startsWith("database:v1:")), false);
  assert.equal(h.storage.values.get("state")?.dbHash, null);
});

console.log(`\n${passed} test groups passed.`);
