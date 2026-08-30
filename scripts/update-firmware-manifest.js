const fs = require('node:fs');
const path = require('node:path');

function normalizeProjectFilePath(baseDir, projectDir, inputPath) {
  const resolvedPath = path.resolve(projectDir, inputPath || '.');
  const relativeToRoot = path.relative(baseDir, resolvedPath);
  return relativeToRoot.split(path.sep).join('/');
}

function generateFirmwareManifest(rootDir = process.cwd()) {
  const firmwareRoot = path.join(rootDir, 'firmware');

  if (!fs.existsSync(firmwareRoot)) {
    return [];
  }

  const entries = fs.readdirSync(firmwareRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && !entry.name.startsWith('_') && !entry.name.startsWith('.'))
    .map((entry) => {
      const projectDir = path.join(firmwareRoot, entry.name);
      const projectJsonPath = path.join(projectDir, 'project.json');

      if (!fs.existsSync(projectJsonPath)) {
        return null;
      }

      const rawProject = JSON.parse(fs.readFileSync(projectJsonPath, 'utf8'));
      const guidePath = rawProject.guide ? normalizeProjectFilePath(rootDir, projectDir, rawProject.guide) : '';

      return {
        name: rawProject.name || entry.name,
        chip: rawProject.chip || 'ESP32',
        version: rawProject.version || '1.0.0',
        description: rawProject.description || '',
        guide: guidePath,
        files: (rawProject.files || []).map((file) => ({
          path: normalizeProjectFilePath(rootDir, projectDir, file.path),
          offset: file.offset || '0x0000'
        }))
      };
    })
    .filter(Boolean)
    .sort((a, b) => a.name.localeCompare(b.name));

  return entries;
}

function main() {
  const rootDir = process.cwd();
  const manifest = generateFirmwareManifest(rootDir);
  const outputPath = path.join(rootDir, 'firmware.json');
  fs.writeFileSync(outputPath, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
  console.log(`Updated ${outputPath} with ${manifest.length} firmware entries.`);
}

if (require.main === module) {
  main();
}

module.exports = { generateFirmwareManifest };
