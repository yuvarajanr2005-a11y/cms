import { spawn } from "child_process";
import path from "path";

const isWindows = process.platform === "win32";
const npmCmd = isWindows ? "npm.cmd" : "npm";

console.log("=======================================================");
console.log("🚀 Starting SmartCMS (Backend + Frontend)...");
console.log("📡 Backend:  http://localhost:5000");
console.log("💻 Frontend: http://localhost:5173");
console.log("=======================================================\n");

// 1. Start Backend
const backend = spawn(npmCmd, ["start"], {
  cwd: path.resolve("./backend"),
  stdio: "inherit",
  shell: true
});

// 2. Start Frontend
const frontend = spawn(npmCmd, ["run", "dev"], {
  cwd: path.resolve("./frontend"),
  stdio: "inherit",
  shell: true
});

const cleanup = () => {
  console.log("\n🛑 Stopping servers...");
  try {
    if (backend && !backend.killed) {
      if (isWindows && backend.pid) {
        spawn("taskkill", ["/pid", backend.pid.toString(), "/f", "/t"]);
      } else {
        backend.kill("SIGTERM");
      }
    }
  } catch (_) {}

  try {
    if (frontend && !frontend.killed) {
      if (isWindows && frontend.pid) {
        spawn("taskkill", ["/pid", frontend.pid.toString(), "/f", "/t"]);
      } else {
        frontend.kill("SIGTERM");
      }
    }
  } catch (_) {}

  process.exit(0);
};

process.on("SIGINT", cleanup);
process.on("SIGTERM", cleanup);

backend.on("exit", (code) => {
  if (code !== 0 && code !== null) {
    console.error(`❌ Backend exited with code ${code}`);
  }
});

frontend.on("exit", (code) => {
  if (code !== 0 && code !== null) {
    console.error(`❌ Frontend exited with code ${code}`);
  }
});
