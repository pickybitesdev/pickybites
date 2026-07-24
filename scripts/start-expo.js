/**
 * Starts Expo dev server: frees port 8081, passes through CLI flags.
 *
 * Do not pass --offline by default — it disables Expo CLI networking and causes
 * Expo Go to show "Cannot connect to the server" even on the same Wi‑Fi.
 * Use `npm run start:offline` only when you truly need offline mode.
 */
const { spawn } = require("child_process");
const path = require("path");

require("./free-port.js");

const userArgs = process.argv.slice(2);
const port = process.env.EXPO_PORT || "8081";
const expoArgs = ["expo", "start", "--port", port, "--lan"];

expoArgs.push(...userArgs);

const child = spawn("npx", expoArgs, {
  stdio: "inherit",
  cwd: path.join(__dirname, ".."),
  shell: true,
});

child.on("exit", (code) => process.exit(code ?? 1));
