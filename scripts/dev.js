const fs = require("fs");
const path = require("path");
const { spawn } = require("child_process");

const projectRoot = path.resolve(__dirname, "..");
const srcDir = path.join(projectRoot, "src");
const watchedExtensions = new Set([".js", ".json"]);
const watchTargets = [srcDir, path.join(projectRoot, ".env"), path.join(projectRoot, ".env.sample")];

let child = null;
let restartTimer = null;
const watchedFiles = new Set();

function shouldWatchFile(filePath) {
  return watchedExtensions.has(path.extname(filePath));
}

function collectFiles(targetPath) {
  if (!fs.existsSync(targetPath)) {
    return [];
  }

  const stat = fs.statSync(targetPath);
  if (stat.isFile()) {
    return [targetPath];
  }

  const entries = fs.readdirSync(targetPath, { withFileTypes: true });
  return entries.flatMap((entry) => {
    const entryPath = path.join(targetPath, entry.name);

    if (entry.isDirectory()) {
      return collectFiles(entryPath);
    }

    return shouldWatchFile(entryPath) ? [entryPath] : [];
  });
}

function startServer() {
  child = spawn(
    process.execPath,
    ["--env-file-if-exists=.env.sample", "--env-file-if-exists=.env", "src/index.js"],
    {
    cwd: projectRoot,
    stdio: "inherit",
    env: process.env,
    }
  );

  child.on("exit", () => {
    child = null;
  });
}

function stopServer() {
  if (child) {
    child.kill("SIGTERM");
  }
}

function restartServer(reason) {
  if (restartTimer) {
    clearTimeout(restartTimer);
  }

  restartTimer = setTimeout(() => {
    console.log(`\n[dev] Restarting server due to changes in ${reason}`);
    stopServer();
    startServer();
  }, 150);
}

function watchFile(filePath) {
  if (watchedFiles.has(filePath)) {
    return;
  }

  watchedFiles.add(filePath);
  fs.watchFile(filePath, { interval: 500 }, (current, previous) => {
    if (current.mtimeMs !== previous.mtimeMs || current.size !== previous.size) {
      restartServer(path.relative(projectRoot, filePath));
    }
  });
}

function setupWatches() {
  const files = watchTargets.flatMap(collectFiles);
  files.forEach(watchFile);
}

function shutdown(signal) {
  console.log(`\n[dev] Received ${signal}, shutting down...`);
  watchedFiles.forEach((filePath) => fs.unwatchFile(filePath));
  stopServer();
  process.exit(0);
}

setupWatches();
startServer();

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
