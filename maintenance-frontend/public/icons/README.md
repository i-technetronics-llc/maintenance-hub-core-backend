# PWA Icons

This directory should contain app icons in various sizes for PWA support.

## Required Icons

Generate icons in the following sizes:
- 16x16 (favicon)
- 32x32 (favicon)
- 72x72 (iOS, Android)
- 96x96 (Android)
- 128x128 (Android, Chrome Web Store)
- 144x144 (Windows, IE11)
- 152x152 (iOS)
- 192x192 (Android, Chrome)
- 384x384 (Android splash screen)
- 512x512 (Android splash screen, PWA)

## How to Generate Icons

1. **Using Online Tools:**
   - Visit https://www.pwabuilder.com/imageGenerator
   - Upload your logo/icon (512x512 recommended)
   - Download all generated sizes

2. **Using CLI Tools:**
   ```bash
   npm install -g pwa-asset-generator
   pwa-asset-generator logo.png ./public/icons
   ```

3. **Using Photoshop/GIMP:**
   - Create images manually for each size
   - Export as PNG with transparency

## Icon Design Guidelines

- Use a simple, recognizable design
- Ensure icon works at small sizes (16x16)
- Use high contrast colors
- Avoid text in icons smaller than 72x72
- Support both light and dark backgrounds
- Use rounded corners for iOS (automatic)

## Current Status

⚠️ **ACTION REQUIRED**: Generate and add icons to this directory

The manifest.json references these icons. Generate them before deploying to production.
