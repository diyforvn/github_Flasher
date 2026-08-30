const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const rootDir = process.cwd();
const firmwareDir = path.join(rootDir, 'firmware');

function getProjectSnapshot() {
  if (!fs.existsSync(firmwareDir)) {
    return {};
  }

  const result = {};
  const entries = fs.readdirSync(firmwareDir, { withFileTypes: true });

  for (const entry of entries) {
    if (!entry.isDirectory()) {
      continue;
    }

    if (entry.name.startsWith('_') || entry.name.startsWith('.')) {
      continue;
    }

    const projectJsonPath = path.join(firmwareDir, entry.name, 'project.json');
    if (!fs.existsSync(projectJsonPath)) {
      continue;
    }

    result[entry.name] = fs.statSync(projectJsonPath).mtimeMs;
  }

  return result;
}

function runUpdate() {
  console.log('Detected firmware change, updating firmware.json...');
  const result = spawnSync(process.execPath, [path.join(rootDir, 'scripts', 'update-firmware-manifest.js')], {
    cwd: rootDir,
    stdio: 'inherit'
  });

  if (result.error) {
    console.error('Failed to update firmware.json:', result.error);
  }
}

let lastSnapshot = {};

function checkForChanges() {
  const snapshot = getProjectSnapshot();
  const changed =
    Object.keys(snapshot).length !== Object.keys(lastSnapshot).length ||
    Object.keys(snapshot).some((key) => snapshot[key] !== lastSnapshot[key]);

  if (changed) {
    runUpdate();
    lastSnapshot = snapshot;
  }
}

function startWatching() {
  console.log(`Watching ${firmwareDir} for new firmware folders...`);
  lastSnapshot = getProjectSnapshot();
  runUpdate();

  setInterval(checkForChanges, 2000);
}

startWatching();
