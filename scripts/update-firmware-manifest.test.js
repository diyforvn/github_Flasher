const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const { generateFirmwareManifest } = require('./update-firmware-manifest.js');

test('generateFirmwareManifest should scan firmware folders and build entries from project.json', () => {
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'github-flasher-'));

  const projectA = path.join(tempRoot, 'firmware', 'alpha');
  const projectB = path.join(tempRoot, 'firmware', 'beta');
  fs.mkdirSync(projectA, { recursive: true });
  fs.mkdirSync(projectB, { recursive: true });
  fs.mkdirSync(path.join(tempRoot, 'firmware', '_template'), { recursive: true });

  fs.writeFileSync(path.join(projectA, 'project.json'), JSON.stringify({
    name: 'Alpha Project',
    chip: 'ESP32',
    version: '1.2.3',
    description: 'Alpha board',
    guide: 'alpha-guide.md',
    files: [
      { path: 'bootloader.bin', offset: '0x1000' },
      { path: 'firmware.bin', offset: '0x10000' }
    ]
  }, null, 2));

  fs.writeFileSync(path.join(projectB, 'project.json'), JSON.stringify({
    name: 'Beta Project',
    chip: 'ESP32-S3',
    version: '2.0.0',
    description: 'Beta board',
    guide: 'beta-guide.md',
    files: [
      { path: './partition-table.bin', offset: '0x8000' },
      { path: 'app.bin', offset: '0x10000' }
    ]
  }, null, 2));

  fs.writeFileSync(path.join(tempRoot, 'firmware', '_template', 'project.json'), JSON.stringify({
    name: 'Ignored',
    chip: 'ESP32',
    version: '9.9.9',
    description: 'Should be ignored',
    guide: 'ignored.md',
    files: [{ path: 'ignored.bin', offset: '0x0000' }]
  }, null, 2));

  const manifest = generateFirmwareManifest(tempRoot);

  assert.deepEqual(manifest, [
    {
      name: 'Alpha Project',
      chip: 'ESP32',
      version: '1.2.3',
      description: 'Alpha board',
      guide: 'firmware/alpha/alpha-guide.md',
      files: [
        { path: 'firmware/alpha/bootloader.bin', offset: '0x1000' },
        { path: 'firmware/alpha/firmware.bin', offset: '0x10000' }
      ]
    },
    {
      name: 'Beta Project',
      chip: 'ESP32-S3',
      version: '2.0.0',
      description: 'Beta board',
      guide: 'firmware/beta/beta-guide.md',
      files: [
        { path: 'firmware/beta/partition-table.bin', offset: '0x8000' },
        { path: 'firmware/beta/app.bin', offset: '0x10000' }
      ]
    }
  ]);
});
