import { readFile } from "node:fs/promises";
import { parseDatabaseModule } from "../lib.js";

const source = await readFile(new URL("../database.js", import.meta.url), "utf8");
const database = parseDatabaseModule(source);
const rules = database.features?.chatbot?.rules?.length ?? 0;
const resources = database.runtime?.resources?.length ?? 0;
console.log(`Database valid: version=${database.version ?? "unknown"}, rules=${rules}, resources=${resources}`);
