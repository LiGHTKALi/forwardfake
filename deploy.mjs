import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawn } from "node:child_process";
import readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const CONFIG = path.join(ROOT, "wrangler.toml");
const rl = readline.createInterface({ input, output });

function commandName(name) {
  return process.platform === "win32" && name === "npx" ? "npx.cmd" : name;
}

function run(command, args, { quiet = false, allowFailure = false } = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(commandName(command), args, {
      cwd: ROOT,
      shell: process.platform === "win32",
      stdio: ["inherit", "pipe", "pipe"],
      env: process.env,
    });
    let combined = "";
    const collect = (chunk, stream) => {
      const value = chunk.toString();
      combined += value;
      if (!quiet) stream.write(value);
    };
    child.stdout.on("data", (chunk) => collect(chunk, process.stdout));
    child.stderr.on("data", (chunk) => collect(chunk, process.stderr));
    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0 || allowFailure) resolve({ code: code ?? 1, output: combined });
      else reject(new Error(`${command} ${args.join(" ")} exited with code ${code}`));
    });
  });
}

async function setOwnerId(ownerId) {
  const config = await fs.readFile(CONFIG, "utf8");
  const pattern = /^OWNER_TELEGRAM_ID\s*=\s*.*$/m;
  if (!pattern.test(config)) throw new Error("OWNER_TELEGRAM_ID was not found in wrangler.toml");
  await fs.writeFile(CONFIG, config.replace(pattern, `OWNER_TELEGRAM_ID = "${ownerId}"`), "utf8");
}

function deployedUrl(outputText) {
  const matches = [...outputText.matchAll(/https:\/\/[a-z0-9-]+(?:\.[a-z0-9-]+)?\.workers\.dev\b/gi)];
  return matches.length ? matches[matches.length - 1][0].replace(/\/$/, "") : "";
}

async function requestManualOrigin() {
  const value = (await rl.question("Paste the deployed https://...workers.dev URL (or press Enter to finish manually): ")).trim();
  if (!value) return "";
  let parsed;
  try { parsed = new URL(value); } catch { throw new Error("That is not a valid URL."); }
  if (parsed.protocol !== "https:" || !parsed.hostname.endsWith(".workers.dev")) {
    throw new Error("Use the canonical HTTPS workers.dev URL printed by Wrangler.");
  }
  return parsed.origin;
}

async function main() {
  console.log("\nForward Scheduler · Cloudflare automatic deployment\n");
  console.log("This wizard embeds the Telegram bot token in worker.js and saves the owner ID in wrangler.toml.");
  console.log("Use the numeric Telegram user ID of the bot owner, not a username.\n");

  const ownerId = (await rl.question("Owner Telegram numeric ID: ")).trim();
  if (!/^\d{5,15}$/.test(ownerId) || /^0+$/.test(ownerId)) {
    throw new Error("Invalid owner ID. Enter a numeric Telegram user ID (5–15 digits).");
  }
  await setOwnerId(ownerId);
  console.log("\nOwner ID saved to wrangler.toml.\n");

  try {
    await fs.access(path.join(ROOT, "node_modules", "wrangler"));
  } catch {
    console.log("Installing project dependencies...\n");
    await run("npm", ["install"]);
  }

  console.log("\nRunning project tests...\n");
  await run("npm", ["test"]);

  console.log("\nChecking Cloudflare login...\n");
  const whoami = await run("npx", ["wrangler", "whoami"], { quiet: true, allowFailure: true });
  if (whoami.code !== 0) {
    console.log("A Cloudflare login is required. Complete the browser/device authorization.\n");
    await run("npx", ["wrangler", "login"]);
  } else {
    console.log(whoami.output.trim() || "Already authenticated.");
  }

  console.log("\nDeploying Worker...\n");
  const deployment = await run("npx", ["wrangler", "deploy"]);
  let origin = deployedUrl(deployment.output);
  if (!origin) {
    console.log("\nWrangler did not expose the workers.dev URL in its output.");
    origin = await requestManualOrigin();
  }

  if (!origin) {
    console.log("\nWorker deployed. Automatic Telegram webhook setup was skipped.");
    console.log("Open https://<your-worker>.<your-subdomain>.workers.dev/setup once to finish setup.");
    return;
  }

  console.log(`\nWorker URL: ${origin}`);
  console.log("Registering Telegram webhook automatically...\n");
  const response = await fetch(`${origin}/setup`, { signal: AbortSignal.timeout(25_000) });
  const body = (await response.text()).trim();
  console.log(body || `Setup endpoint returned HTTP ${response.status}.`);
  if (!response.ok || !/Webhook connected|Webhook is already connected/i.test(body)) {
    throw new Error("Worker deployed, but Telegram webhook setup did not complete. Check the URL and Cloudflare logs, then open /setup manually.");
  }
  console.log("\nDeployment and Telegram webhook setup completed.");
  console.log("Open your bot and send /settings from the configured owner account.");
}

main()
  .catch((error) => {
    console.error(`\nDeployment failed: ${error?.message || error}`);
    process.exitCode = 1;
  })
  .finally(() => rl.close());
