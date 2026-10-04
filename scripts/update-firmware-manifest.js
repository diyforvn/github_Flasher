const fs = require('node:fs');
const path = require('node:path');

// Các tuỳ chọn flash có thể khai báo ở cấp project hoặc cấp từng version.
const FLASH_OPTION_KEYS = ['flashMode', 'flashFreq', 'flashSize', 'eraseAll', 'compress'];

function normalizeProjectFilePath(baseDir, projectDir, inputPath) {
  const resolvedPath = path.resolve(projectDir, inputPath || '.');
  const relativeToRoot = path.relative(baseDir, resolvedPath);
  return relativeToRoot.split(path.sep).join('/');
}

function pickFlashOptions(source) {
  const options = {};
  for (const key of FLASH_OPTION_KEYS) {
    if (source[key] !== undefined) {
      options[key] = source[key];
    }
  }
  return options;
}

function normalizeFiles(baseDir, projectDir, files) {
  return (files || []).map((file) => ({
    path: normalizeProjectFilePath(baseDir, projectDir, file.path),
    offset: file.offset || '0x0000'
  }));
}

// project.json cũ (version + files) được coi như 1 version duy nhất.
function readVersions(rawProject) {
  if (Array.isArray(rawProject.versions) && rawProject.versions.length) {
    return rawProject.versions;
  }
  return [{ version: rawProject.version || '1.0.0', files: rawProject.files || [] }];
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

      const versions = readVersions(rawProject).map((rawVersion) => {
        const version = {
          version: String(rawVersion.version || '1.0.0')
        };

        if (rawVersion.notes) {
          version.notes = rawVersion.notes;
        }

        Object.assign(version, pickFlashOptions(rawVersion));
        version.files = normalizeFiles(rootDir, projectDir, rawVersion.files);
        return version;
      });

      const latest = versions.some((v) => v.version === String(rawProject.latest))
        ? String(rawProject.latest)
        : versions[0].version;

      return {
        name: rawProject.name || entry.name,
        chip: rawProject.chip || 'ESP32',
        description: rawProject.description || '',
        guide: guidePath,
        latest,
        ...pickFlashOptions(rawProject),
        versions
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