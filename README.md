# xmas-cake-threejs
ｎ×ｍのパーツに分かれた画像を使ってクリスマスケーキに飾り付けができます

```shell
npm i -D pwa-asset-generator
npm i -D sharp
```

```shell
npx pwa-asset-generator ./brand/logo.svg ./public/assets \
  --manifest ./public/manifest.webmanifest \
  --index ./public/index.html \
  --path "/assets" \
  --padding "15%" \
  --background "#111827"
```
