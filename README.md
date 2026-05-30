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

## Khi web van hien du lieu cu

1. Doi GitHub Pages deploy xong. Vao tab `Actions` hoac `Settings > Pages` de kiem tra lan deploy moi nhat.
2. Mo lai trang bang hard refresh: `Ctrl + F5`.
3. Neu van cu, them tham so vao URL de bo cache, vi du `https://user.github.io/repo/?v=2`.
4. Kiem tra `GITHUB_BRANCH` trong `index.html`. Neu Pages deploy tu nhanh `gh-pages` nhung API doc tu nhanh mac dinh, danh sach co the bi lech.

`index.html` da them cache-busting cho `project.json`, `firmware.json`, file huong dan va file `.bin`, nen sau khi deploy xong thi moi lan mo trang se uu tien lay ban moi.
