const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const { generateFirmwareManifest } = require('./update-firmware-manifest.js');

function makeRoot() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'github-flasher-'));
}

function writeProject(root, folder, project) {
  const dir = path.join(root, 'firmware', folder);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'project.json'), JSON.stringify(project, null, 2));
}

test('generateFirmwareManifest should scan firmware folders and build entries from project.json', () => {
  const tempRoot = makeRoot();

  // project.json kiểu cũ (version + files) vẫn phải chạy, được gói thành 1 version
  writeProject(tempRoot, 'alpha', {
    name: 'Alpha Project',
    chip: 'ESP32',
    version: '1.2.3',
    description: 'Alpha board',
    guide: 'alpha-guide.md',
    files: [
      { path: 'bootloader.bin', offset: '0x1000' },
      { path: 'firmware.bin', offset: '0x10000' }
    ]
  });

  writeProject(tempRoot, 'beta', {
    name: 'Beta Project',
    chip: 'ESP32-S3',
    version: '2.0.0',
    description: 'Beta board',
    guide: 'beta-guide.md',
    files: [
      { path: './partition-table.bin', offset: '0x8000' },
      { path: 'app.bin', offset: '0x10000' }
    ]
  });

  writeProject(tempRoot, '_template', {
    name: 'Ignored',
    chip: 'ESP32',
    version: '9.9.9',
    description: 'Should be ignored',
    guide: 'ignored.md',
    files: [{ path: 'ignored.bin', offset: '0x0000' }]
  });

  const manifest = generateFirmwareManifest(tempRoot);

  assert.deepEqual(manifest, [
    {
      name: 'Alpha Project',
      chip: 'ESP32',
      description: 'Alpha board',
      guide: 'firmware/alpha/alpha-guide.md',
      latest: '1.2.3',
      versions: [
        {
          version: '1.2.3',
          files: [
            { path: 'firmware/alpha/bootloader.bin', offset: '0x1000' },
            { path: 'firmware/alpha/firmware.bin', offset: '0x10000' }
          ]
        }
      ]
    },
    {
      name: 'Beta Project',
      chip: 'ESP32-S3',
      description: 'Beta board',
      guide: 'firmware/beta/beta-guide.md',
      latest: '2.0.0',
      versions: [
        {
          version: '2.0.0',
          files: [
            { path: 'firmware/beta/partition-table.bin', offset: '0x8000' },
            { path: 'firmware/beta/app.bin', offset: '0x10000' }
          ]
        }
      ]
    }
  ]);
});

test('generateFirmwareManifest should keep multiple versions, latest, notes and per-version flash options', () => {
  const tempRoot = makeRoot();

  writeProject(tempRoot, 'gamma', {
    name: 'Gamma Project',
    chip: 'ESP32S3',
    description: 'Gamma board',
    guide: 'readme.md',
    latest: '1.1.0',
    versions: [
      {
        version: '1.1.0',
        notes: 'Cập nhật app, giữ cấu hình',
        eraseAll: false,
        files: [
          { path: 'v1.1.0/bootloader.bin', offset: '0x0000' },
          { path: 'v1.1.0/app.bin', offset: '0x20000' }
        ]
      },
      {
        version: '1.0.0',
        files: [
          { path: 'v1.0.0/bootloader.bin' },
          { path: 'v1.0.0/app.bin', offset: '0x20000' }
        ]
      }
    ]
  });

  const [gamma] = generateFirmwareManifest(tempRoot);

  assert.equal(gamma.latest, '1.1.0');
  assert.equal(gamma.guide, 'firmware/gamma/readme.md');
  assert.equal(gamma.version, undefined);
  assert.equal(gamma.files, undefined);

  assert.deepEqual(gamma.versions, [
    {
      version: '1.1.0',
      notes: 'Cập nhật app, giữ cấu hình',
      eraseAll: false,
      files: [
        { path: 'firmware/gamma/v1.1.0/bootloader.bin', offset: '0x0000' },
        { path: 'firmware/gamma/v1.1.0/app.bin', offset: '0x20000' }
      ]
    },
    {
      version: '1.0.0',
      files: [
        { path: 'firmware/gamma/v1.0.0/bootloader.bin', offset: '0x0000' },
        { path: 'firmware/gamma/v1.0.0/app.bin', offset: '0x20000' }
      ]
    }
  ]);
});

test('generateFirmwareManifest should fall back to the first version when latest is missing or unknown', () => {
  const tempRoot = makeRoot();

  writeProject(tempRoot, 'delta', {
    name: 'Delta Project',
    latest: '9.9.9',
    versions: [
      { version: '2.0.0', files: [{ path: 'a.bin', offset: '0x0' }] },
      { version: '1.0.0', files: [{ path: 'b.bin', offset: '0x0' }] }
    ]
  });

  const [delta] = generateFirmwareManifest(tempRoot);

  assert.equal(delta.latest, '2.0.0');
  assert.equal(delta.chip, 'ESP32');
});