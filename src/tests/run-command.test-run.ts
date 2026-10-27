import { createToolRegistry } from "../tools/tool-registration.js";

const registry = createToolRegistry(process.cwd());

const result = await registry.execute("run_command", {
  command: "pwd && printf 'Hello from Bash\\n' && git status --short && git log -4 --oneline",
});

console.dir(result, { depth: null });
