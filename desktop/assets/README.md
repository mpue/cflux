# CFlux Desktop Application - Icon Placeholder

Icons für die Desktop-Anwendung sollten hier platziert werden:

- **icon.ico** - Windows Icon (256x256 oder mehrere Größen)
- **icon.icns** - macOS Icon (512x512@2x)
- **icon.png** - Linux Icon (512x512)

## Icon-Erstellung

Um Icons aus einem PNG zu erstellen, können folgende Tools verwendet werden:

### Mit electron-icon-builder

```bash
npm install -g electron-icon-builder
electron-icon-builder --input=./source.png --output=./assets --flatten
```

### Mit png2icons

```bash
npm install -g png2icons
png2icons ./source.png ./assets --icns --ico
```

### Online-Tools

- [CloudConvert](https://cloudconvert.com/png-to-ico)
- [iConvert Icons](https://iconverticons.com/online/)

## Empfohlene Ausgangsgröße

Erstelle ein quadratisches PNG mit mindestens 512x512 Pixeln für die beste Qualität auf allen Plattformen.
