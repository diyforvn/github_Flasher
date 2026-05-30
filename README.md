# DIYforVN ESP Flasher

## Them firmware moi

Web co the tu tao danh sach firmware tu cac thu muc con trong `firmware/` khi chay tren GitHub Pages.

1. Copy thu muc `firmware/_template` thanh `firmware/ten-project-moi`.
2. Dat cac file `.bin` vao thu muc project moi.
3. Sua `firmware/ten-project-moi/project.json`.
4. Upload/push thu muc project moi len GitHub.

Khong can sua `index.html`.

Vi du:

```text
firmware/
  den-led/
    project.json
    guide.md
    bootloader.bin
    partitions.bin
    firmware.bin
```

Trong `project.json`, cac duong dan `guide` va `files[].path` duoc tinh tu chinh thu muc project do.

```json
{
  "name": "Den LED",
  "chip": "ESP32",
  "version": "1.0.0",
  "description": "Bo dieu khien den LED",
  "guide": "guide.md",
  "files": [
    {
      "path": "bootloader.bin",
      "offset": "0x1000"
    },
    {
      "path": "partitions.bin",
      "offset": "0x8000"
    },
    {
      "path": "firmware.bin",
      "offset": "0x10000"
    }
  ]
}
```

Neu web khong chay tren domain `*.github.io`, hay dien repo vao hang `GITHUB_REPOSITORY` trong `index.html`, vi du `"ten-user/ten-repo"`.

Neu GitHub Pages cua ban lay file tu mot nhanh khac nhanh mac dinh, dien ten nhanh vao `GITHUB_BRANCH`, vi du `"gh-pages"`.

`firmware.json` van duoc giu lai lam che do du phong.
