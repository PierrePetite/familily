# PWA Icons

Diese Verzeichnis enthält die App-Icons für die PWA (Progressive Web App).

## Benötigte Icon-Größen

Um die PWA vollständig zu unterstützen, werden folgende PNG-Icons benötigt:

- `icon-72x72.png`
- `icon-96x96.png`
- `icon-128x128.png`
- `icon-144x144.png`
- `icon-152x152.png`
- `icon-192x192.png`
- `icon-384x384.png`
- `icon-512x512.png`

## Icons generieren

Das SVG-Basisicon ist bereits vorhanden: `icon.svg`

Um die PNG-Icons zu generieren, kannst du folgende Methoden nutzen:

### Option 1: Online-Tool
1. Öffne https://realfavicongenerator.net/
2. Lade `icon.svg` hoch
3. Lade das generierte Icon-Paket herunter

### Option 2: ImageMagick (Terminal)
```bash
for size in 72 96 128 144 152 192 384 512; do
  convert icon.svg -resize ${size}x${size} icon-${size}x${size}.png
done
```

### Option 3: Sharp (Node.js)
```javascript
const sharp = require('sharp');
const sizes = [72, 96, 128, 144, 152, 192, 384, 512];

sizes.forEach(size => {
  sharp('icon.svg')
    .resize(size, size)
    .png()
    .toFile(`icon-${size}x${size}.png`);
});
```

## Apple Touch Icon

Für iOS wird zusätzlich ein `apple-touch-icon.png` (180x180) empfohlen.
